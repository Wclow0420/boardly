import base64
import binascii
import uuid
from datetime import datetime, timezone

import jwt as pyjwt
from flask import Blueprint, g, request
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from app import presence
from app.cosmetics import BORDER_IDS, BORDER_PRICES, DEFAULT_BORDER, owns_border
from app.auth import issue_tokens, require_auth, user_from_token
from app.extensions import db, limiter, socketio
from app.models import Avatar, Friendship, GameSession, Room, RoomPlayer, User
from app.utils import api_error

auth_bp = Blueprint("auth", __name__)

MIN_PASSWORD_LENGTH = 6
# The app uploads a small square (about 256px); this leaves headroom
MAX_AVATAR_BYTES = 300 * 1024


def _image_mime(data: bytes) -> str | None:
    """JPEG, PNG or WebP by their file signatures; None otherwise."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@auth_bp.post("/register")
@limiter.limit("5 per minute; 30 per hour")
def register():
    """Body: {"username": "...", "password": "..."}"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3 or len(username) > 30:
        return api_error(
            "invalid_username", "Username must be 3-30 characters", 400
        )
    if len(password) < MIN_PASSWORD_LENGTH:
        return api_error(
            "invalid_password", "Password must be at least 6 characters", 400
        )
    if User.query.filter_by(username=username).first() is not None:
        return api_error("username_taken", "That username is already taken", 409)

    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return {"user": user.to_self_dict(), **issue_tokens(user)}, 201


@auth_bp.post("/login")
@limiter.limit("10 per minute; 100 per hour")
def login():
    """Body: {"username": "...", "password": "..."}"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if (
        user is None
        or user.deleted_at is not None
        or not check_password_hash(user.password_hash, password)
    ):
        return api_error("invalid_credentials", "Wrong username or password", 401)

    return {"user": user.to_self_dict(), **issue_tokens(user)}


@auth_bp.post("/refresh")
@limiter.limit("60 per minute")
def refresh():
    """Body: {"refreshToken": "..."} — rotates both tokens."""
    data = request.get_json() or {}
    token = data.get("refreshToken") or ""
    try:
        user = user_from_token(token, "refresh")
    except pyjwt.InvalidTokenError:
        return api_error("unauthorized", "Invalid or expired refresh token", 401)
    return {"user": user.to_self_dict(), **issue_tokens(user)}


@auth_bp.get("/me")
@require_auth
def me():
    return {"user": g.current_user.to_self_dict()}


@auth_bp.patch("/me")
@require_auth
def update_me():
    """Body: {"borderId": "..."} — change the profile border."""
    me = g.current_user
    data = request.get_json() or {}
    border_id = data.get("borderId")
    if border_id not in BORDER_IDS:
        return api_error("invalid_border", "Unknown profile border", 400)
    if not owns_border(me, border_id):
        return api_error("border_locked", "Unlock this border first", 403)

    me.border_id = border_id
    db.session.commit()
    return {"user": me.to_self_dict()}


@auth_bp.put("/me/avatar")
@limiter.limit("20 per hour")
@require_auth
def upload_avatar():
    """Body: {"image": "<base64 JPEG, PNG or WebP>"} — set the profile
    picture."""
    # base64 is 4/3 of the bytes; refuse oversized bodies before parsing
    if (request.content_length or 0) > MAX_AVATAR_BYTES * 4 // 3 + 1024:
        return api_error("image_too_large", "That picture is too large", 413)
    data = request.get_json(silent=True) or {}
    try:
        image = base64.b64decode(data.get("image") or "", validate=True)
    except (binascii.Error, ValueError):
        image = b""
    mime = _image_mime(image)
    if mime is None:
        return api_error("invalid_image", "Upload a JPEG, PNG or WebP picture", 400)
    if len(image) > MAX_AVATAR_BYTES:
        return api_error("image_too_large", "That picture is too large", 413)

    me = g.current_user
    avatar = db.session.get(Avatar, me.id)
    if avatar is None:
        avatar = Avatar(user_id=me.id)
        db.session.add(avatar)
    avatar.data = image
    avatar.mime = mime
    avatar.updated_at = datetime.now(timezone.utc)
    me.avatar = uuid.uuid4().hex[:12]
    db.session.commit()
    return {"user": me.to_self_dict()}


@auth_bp.delete("/me/avatar")
@require_auth
def delete_avatar():
    """Back to the letter avatar."""
    me = g.current_user
    Avatar.query.filter_by(user_id=me.id).delete()
    me.avatar = None
    db.session.commit()
    return {"user": me.to_self_dict()}


@auth_bp.post("/me/borders/<border_id>/buy")
@require_auth
def buy_border(border_id):
    """Spend coins to unlock a profile border."""
    if border_id not in BORDER_IDS:
        return api_error("invalid_border", "Unknown profile border", 404)
    # Lock the account row so the balance cannot be spent twice
    me = db.session.get(
        User, g.current_user.id, with_for_update=True, populate_existing=True
    )
    price = BORDER_PRICES[border_id]
    refusal = None
    if owns_border(me, border_id):
        refusal = api_error("already_owned", "You already have this border", 409)
    elif me.coins < price:
        refusal = api_error("not_enough_coins", "Not enough coins", 402)
    if refusal is not None:
        db.session.rollback()  # let go of the row lock
        return refusal

    me.coins -= price
    me.owned_borders = [*(me.owned_borders or []), border_id]
    db.session.commit()
    return {"user": me.to_self_dict()}


@auth_bp.post("/password")
@limiter.limit("10 per minute")
@require_auth
def change_password():
    """Body: {"currentPassword": "...", "newPassword": "..."} — signs out
    every other device and returns fresh tokens for this one."""
    me = g.current_user
    data = request.get_json() or {}
    if not check_password_hash(me.password_hash, data.get("currentPassword") or ""):
        return api_error("wrong_password", "Current password is incorrect", 403)
    new_password = data.get("newPassword") or ""
    if len(new_password) < MIN_PASSWORD_LENGTH:
        return api_error(
            "invalid_password", "Password must be at least 6 characters", 400
        )

    me.password_hash = generate_password_hash(new_password)
    me.token_version += 1
    db.session.commit()
    return {"user": me.to_self_dict(), **issue_tokens(me)}


@auth_bp.delete("/me")
@limiter.limit("10 per minute")
@require_auth
def delete_account():
    """Body: {"password": "..."} — permanently deletes the account.

    The user leaves any table they are at, friendships are removed, and
    the row is scrubbed of everything personal (username, password,
    avatar). The anonymous row stays so finished games keep their
    history for the other players; the username becomes free again."""
    me = g.current_user
    data = request.get_json() or {}
    if not check_password_hash(me.password_hash, data.get("password") or ""):
        return api_error("wrong_password", "Password is incorrect", 403)

    # Local import: rooms imports this package's siblings at module load
    from app.routes.rooms import ACTIVE_STATUSES, leave

    memberships = (
        RoomPlayer.query.filter_by(user_id=me.id)
        .join(Room)
        .filter(Room.status.in_(ACTIVE_STATUSES))
        .all()
    )
    for membership in memberships:
        leave(membership.room, membership)

    friends = presence.friend_ids(me.id)
    Friendship.query.filter(
        (Friendship.requester_id == me.id) | (Friendship.addressee_id == me.id)
    ).delete(synchronize_session=False)

    me.username = f"deleted-{uuid.uuid4().hex[:12]}"
    me.password_hash = ""  # never matches a password hash check
    me.avatar = None
    Avatar.query.filter_by(user_id=me.id).delete()
    me.border_id = DEFAULT_BORDER
    me.coins = 0
    me.owned_borders = []
    me.token_version += 1
    me.deleted_at = datetime.now(timezone.utc)
    db.session.commit()

    presence.notify_users(friends)
    # Drop this user's live connections (their tokens no longer work)
    socketio.close_room(f"user:{me.id}")
    return {"ok": True}


@auth_bp.get("/me/stats")
@require_auth
def my_stats():
    """Profile counters: finished games I took part in, wins, friends."""
    me = g.current_user
    my_room_ids = db.session.query(RoomPlayer.room_id).filter_by(user_id=me.id)
    finished = GameSession.query.filter(
        GameSession.status == "finished", GameSession.room_id.in_(my_room_ids)
    )
    return {
        "stats": {
            "gamesPlayed": finished.count(),
            "wins": finished.filter(
                or_(
                    GameSession.winner_user_id == me.id,
                    GameSession.winner_user_ids.contains([str(me.id)]),
                )
            ).count(),
            "friends": len(presence.friend_ids(me.id)),
        }
    }

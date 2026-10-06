import uuid
from datetime import datetime, timezone

import jwt as pyjwt
from flask import Blueprint, g, request
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from app import presence
from app.cosmetics import BORDER_IDS, DEFAULT_BORDER
from app.auth import issue_tokens, require_auth, user_from_token
from app.extensions import db, limiter, socketio
from app.models import Friendship, GameSession, Room, RoomPlayer, User
from app.utils import api_error

auth_bp = Blueprint("auth", __name__)

MIN_PASSWORD_LENGTH = 6


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
    return {"user": user.to_dict(), **issue_tokens(user)}, 201


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

    return {"user": user.to_dict(), **issue_tokens(user)}


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
    return {"user": user.to_dict(), **issue_tokens(user)}


@auth_bp.get("/me")
@require_auth
def me():
    return {"user": g.current_user.to_dict()}


@auth_bp.patch("/me")
@require_auth
def update_me():
    """Body: {"borderId": "..."} — change the profile border."""
    me = g.current_user
    data = request.get_json() or {}
    border_id = data.get("borderId")
    if border_id not in BORDER_IDS:
        return api_error("invalid_border", "Unknown profile border", 400)

    me.border_id = border_id
    db.session.commit()
    return {"user": me.to_dict()}


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
    return {"user": me.to_dict(), **issue_tokens(me)}


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
    me.border_id = DEFAULT_BORDER
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

import uuid
from datetime import datetime, timezone

from flask import Blueprint, g, request
from sqlalchemy import and_, or_

from app import presence
from app.auth import require_auth
from app.extensions import db, socketio
from app.games import GAMES
from app.models import Friendship, Room, RoomPlayer, SessionPlayer, User
from app.outcomes import player_card
from app.utils import api_error

friends_bp = Blueprint("friends", __name__)

SEARCH_LIMIT = 20
RECENT_LIMIT = 20


def _between(user_id, other_id):
    """The friendship row between two users, in either direction."""
    return Friendship.query.filter(
        or_(
            and_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == other_id,
            ),
            and_(
                Friendship.requester_id == other_id,
                Friendship.addressee_id == user_id,
            ),
        )
    ).first()


def _my_rows(user_id):
    return Friendship.query.filter(
        or_(
            Friendship.requester_id == user_id,
            Friendship.addressee_id == user_id,
        )
    ).all()


def _relation(row, user_id):
    if row is None:
        return "none"
    if row.status == "accepted":
        return "friend"
    return "outgoing" if row.requester_id == user_id else "incoming"


def _entry(user, row, me_id, presences=None, games=None, together=None):
    """One person as the app lists them. Presence (and which game they
    are playing) is only shared between friends; `together` is what the
    two of us have played (see _together)."""
    relation = _relation(row, me_id)
    friend = relation == "friend"
    return {
        **user.to_dict(),
        "relation": relation,
        "requestId": str(row.id) if row is not None and not friend else None,
        "presence": (presences or {}).get(user.id) if friend else None,
        "playing": (games or {}).get(user.id) if friend else None,
        "together": (together or {}).get(user.id),
    }


def _together(me_id, other_ids) -> dict:
    """other user id -> the finished games we both sat at: how many,
    and the latest one's game and time."""
    if not other_ids:
        return {}
    mine = db.session.query(SessionPlayer.session_id).filter_by(user_id=me_id)
    rows = (
        SessionPlayer.query.filter(
            SessionPlayer.session_id.in_(mine),
            SessionPlayer.user_id.in_(list(other_ids)),
        )
        .order_by(SessionPlayer.finished_at.desc())
        .all()
    )
    out = {}
    for row in rows:
        entry = out.setdefault(
            row.user_id,
            {
                "games": 0,
                "lastGameType": row.game_type,
                "lastPlayedAt": row.finished_at.isoformat(),
            },
        )
        entry["games"] += 1
    return out


@friends_bp.get("")
@require_auth
def list_friends():
    """Friends (with presence), pending requests both ways, and people
    recently played with."""
    me = g.current_user
    rows = _my_rows(me.id)
    by_other = {row.other_id(me.id): row for row in rows}

    friend_rows = [r for r in rows if r.status == "accepted"]
    presences = presence.presence_of([r.other_id(me.id) for r in friend_rows])

    my_room_ids = db.session.query(RoomPlayer.room_id).filter_by(user_id=me.id)
    recent_ids = []
    for (user_id,) in (
        db.session.query(RoomPlayer.user_id)
        .join(User, User.id == RoomPlayer.user_id)
        .filter(
            RoomPlayer.room_id.in_(my_room_ids),
            RoomPlayer.user_id != me.id,
            User.deleted_at.is_(None),
            User.is_bot.is_(False),
        )
        .order_by(RoomPlayer.joined_at.desc())
        .limit(RECENT_LIMIT * 5)
    ):
        if user_id not in recent_ids:
            recent_ids.append(user_id)
    recent_ids = recent_ids[:RECENT_LIMIT]

    games = presence.playing([r.other_id(me.id) for r in friend_rows])
    together = _together(me.id, set(by_other) | set(recent_ids))

    needed = set(by_other) | set(recent_ids)
    users = (
        {u.id: u for u in User.query.filter(User.id.in_(needed)).all()}
        if needed
        else {}
    )

    def entries(selected):
        return [
            _entry(users[r.other_id(me.id)], r, me.id, presences, games, together)
            for r in selected
        ]

    friends = entries(friend_rows)
    order = {"online": 0, "inGame": 1, "offline": 2}
    friends.sort(key=lambda f: (order[f["presence"]], f["username"].lower()))

    pending = sorted(
        (r for r in rows if r.status == "pending"),
        key=lambda r: r.created_at,
        reverse=True,
    )
    return {
        "friends": friends,
        "incoming": entries([r for r in pending if r.addressee_id == me.id]),
        "outgoing": entries([r for r in pending if r.requester_id == me.id]),
        "recent": [
            _entry(users[uid], by_other.get(uid), me.id, presences, games, together)
            for uid in recent_ids
        ],
    }


@friends_bp.get("/search")
@require_auth
def search_users():
    """?q=<username prefix> — find people to add."""
    me = g.current_user
    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return {"users": []}

    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    users = (
        User.query.filter(
            User.username.ilike(f"{escaped}%", escape="\\"),
            User.id != me.id,
            User.deleted_at.is_(None),
            User.is_bot.is_(False),
        )
        .order_by(User.username)
        .limit(SEARCH_LIMIT)
        .all()
    )
    by_other = {row.other_id(me.id): row for row in _my_rows(me.id)}
    presences = presence.presence_of(
        [u.id for u in users if _relation(by_other.get(u.id), me.id) == "friend"]
    )
    return {
        "users": [_entry(u, by_other.get(u.id), me.id, presences) for u in users]
    }


@friends_bp.post("/requests")
@require_auth
def send_request():
    """Body: {"userId": "..."}. If that person already sent me a
    request, this accepts it instead."""
    me = g.current_user
    data = request.get_json() or {}
    try:
        target = db.session.get(User, uuid.UUID(str(data.get("userId"))))
    except ValueError:
        target = None
    if target is None or target.deleted_at is not None or target.is_bot:
        return api_error("user_not_found", "User not found", 404)
    if target.id == me.id:
        return api_error("cannot_friend_self", "You can't add yourself", 400)

    row = _between(me.id, target.id)
    status = 200
    if row is None:
        row = Friendship(requester_id=me.id, addressee_id=target.id)
        db.session.add(row)
        status = 201
    elif row.status == "accepted":
        return api_error("already_friends", "You are already friends", 409)
    elif row.requester_id == me.id:
        return api_error("request_exists", "Friend request already sent", 409)
    else:
        row.status = "accepted"
        row.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    presence.notify_users([me.id, target.id])
    return {
        "user": _entry(target, row, me.id, presence.presence_of([target.id]))
    }, status


@friends_bp.post("/requests/<uuid:request_id>/accept")
@require_auth
def accept_request(request_id):
    me = g.current_user
    row = db.session.get(Friendship, request_id)
    if row is None or row.addressee_id != me.id or row.status != "pending":
        return api_error("request_not_found", "Friend request not found", 404)

    row.status = "accepted"
    row.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    presence.notify_users([row.requester_id, row.addressee_id])
    return {
        "user": _entry(
            row.requester, row, me.id, presence.presence_of([row.requester_id])
        )
    }


@friends_bp.delete("/requests/<uuid:request_id>")
@require_auth
def remove_request(request_id):
    """Decline a request sent to me, or cancel one I sent."""
    me = g.current_user
    row = db.session.get(Friendship, request_id)
    if (
        row is None
        or row.status != "pending"
        or me.id not in (row.requester_id, row.addressee_id)
    ):
        return api_error("request_not_found", "Friend request not found", 404)

    targets = [row.requester_id, row.addressee_id]
    db.session.delete(row)
    db.session.commit()
    presence.notify_users(targets)
    return {"ok": True}


@friends_bp.delete("/<uuid:user_id>")
@require_auth
def remove_friend(user_id):
    me = g.current_user
    row = _between(me.id, user_id)
    if row is None or row.status != "accepted":
        return api_error("not_friends", "You are not friends", 404)

    db.session.delete(row)
    db.session.commit()
    presence.notify_users([me.id, user_id])
    return {"ok": True}


def _shared_a_table(me_id, other_id) -> bool:
    """Whether we have ever sat at the same table (one we're at now
    counts)."""
    mine = db.session.query(RoomPlayer.room_id).filter_by(user_id=me_id)
    return (
        db.session.query(RoomPlayer.id)
        .filter(RoomPlayer.room_id.in_(mine), RoomPlayer.user_id == other_id)
        .first()
        is not None
    )


@friends_bp.get("/<uuid:user_id>/card")
@require_auth
def player_card_of(user_id):
    """Someone's player card: their numbers, the badges they have earned
    (never their progress), what we have played together, and how we
    know each other. Open to friends and to anyone I've shared a table
    with; presence stays between friends."""
    me = g.current_user
    row = _between(me.id, user_id)
    is_friend = row is not None and row.status == "accepted"
    if not is_friend and not _shared_a_table(me.id, user_id):
        return api_error("not_found", "User not found", 404)
    user = db.session.get(User, user_id)
    if user is None or user.deleted_at is not None:
        return api_error("not_found", "User not found", 404)
    card = player_card(user.id, user.showcase_badges)
    return {
        "card": {
            "user": user.to_dict(),
            "relation": _relation(row, me.id),
            "requestId": str(row.id) if row is not None and not is_friend else None,
            "gamesPlayed": card["gamesPlayed"],
            "wins": card["wins"],
            "bestStreak": card["bestStreak"],
            "favourite": card["favourite"],
            # only the four they show, never their progress
            "badges": [
                {k: v for k, v in b.items() if k != "progress"}
                for key in card["showcase"]
                for b in card["badges"]
                if b["key"] == key
            ],
            "badgeCount": sum(1 for b in card["badges"] if b["tier"]),
            "together": _together(me.id, {user.id}).get(user.id),
            "presence": presence.presence_of([user.id])[user.id] if is_friend else None,
            "playing": presence.playing([user.id]).get(user.id) if is_friend else None,
        }
    }


@friends_bp.post("/<uuid:user_id>/invite")
@require_auth
def invite_friend(user_id):
    """Invite an online friend to the table I'm waiting at. Delivered
    live over their socket — there is no stored invitation."""
    me = g.current_user
    row = _between(me.id, user_id)
    if row is None or row.status != "accepted":
        return api_error("not_friends", "You are not friends", 404)

    membership = (
        RoomPlayer.query.filter_by(user_id=me.id)
        .join(Room)
        .filter(Room.status == "waiting")
        .first()
    )
    if membership is None:
        return api_error("no_open_table", "Start a table first", 409)
    room = membership.room

    game = GAMES.get(room.game_type)
    if game is not None and len(room.players) >= game.max_players:
        return api_error("room_full", "Room is full", 409)
    if any(p.user_id == user_id for p in room.players):
        return api_error("already_at_table", "Already at your table", 409)
    if not presence.is_online(user_id):
        return api_error("friend_offline", "Your friend is offline", 409)

    socketio.emit(
        "table_invite",
        {
            "from": me.to_dict(),
            "code": room.code,
            "game": game.to_dict() if game else None,
        },
        to=f"user:{user_id}",
    )
    return {"ok": True, "code": room.code}

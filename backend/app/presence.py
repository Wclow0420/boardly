"""Presence: who is connected right now, and telling their friends.

Connections are tracked in process memory (socket id -> user), which is
correct for the single-worker setup this app runs with. Running several
workers needs a shared store (e.g. Redis) behind the same functions.
"""

import threading

from sqlalchemy import or_

from app.extensions import db, socketio
from app.models import Friendship, Room, RoomPlayer

_lock = threading.Lock()
_sid_user: dict = {}
_user_sids: dict = {}


def connect(sid, user_id) -> bool:
    """Register a socket for a user. True if the user just came online."""
    with _lock:
        previous = _sid_user.get(sid)
        if previous == user_id:
            return False
        if previous is not None:
            _drop(sid)
        _sid_user[sid] = user_id
        sids = _user_sids.setdefault(user_id, set())
        sids.add(sid)
        return len(sids) == 1


def disconnect(sid):
    """Forget a socket. Returns the user id if they just went offline."""
    with _lock:
        return _drop(sid)


def _drop(sid):
    user_id = _sid_user.pop(sid, None)
    if user_id is None:
        return None
    sids = _user_sids.get(user_id, set())
    sids.discard(sid)
    if sids:
        return None
    _user_sids.pop(user_id, None)
    return user_id


def user_for(sid):
    """The authenticated user behind a socket, if any."""
    return _sid_user.get(sid)


def is_online(user_id) -> bool:
    return user_id in _user_sids


def presence_of(user_ids) -> dict:
    """user id -> "inGame" | "online" | "offline"."""
    online = [uid for uid in user_ids if is_online(uid)]
    playing = set()
    if online:
        rows = (
            db.session.query(RoomPlayer.user_id)
            .join(Room)
            .filter(RoomPlayer.user_id.in_(online), Room.status == "playing")
            .all()
        )
        playing = {user_id for (user_id,) in rows}
    return {
        uid: ("inGame" if uid in playing else "online")
        if is_online(uid)
        else "offline"
        for uid in user_ids
    }


def friend_ids(user_id) -> list:
    rows = Friendship.query.filter(
        Friendship.status == "accepted",
        or_(
            Friendship.requester_id == user_id,
            Friendship.addressee_id == user_id,
        ),
    ).all()
    return [row.other_id(user_id) for row in rows]


def notify_users(user_ids):
    """Tell these users their friends data changed (refetch)."""
    for user_id in set(user_ids):
        socketio.emit("friends_updated", {}, to=f"user:{user_id}")


def notify_friends_of(user_ids):
    """A user's presence changed (online/offline/in game) — tell their
    friends."""
    targets = set()
    for user_id in user_ids:
        targets.update(friend_ids(user_id))
    notify_users(targets)

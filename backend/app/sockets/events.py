"""Socket.IO events.

A client first sends `authenticate` with its access token. That joins
its personal `user:<id>` channel (`friends_updated`, `table_invite`) and
marks the user online for as long as the socket stays connected.

An authenticated client can then `join_room` for a table it sits at to
receive the `room_updated`, `game_started`, and `game_updated`
broadcasts the REST endpoints emit. Both events ack {"ok": bool}."""

import uuid

import jwt
from flask import request
from flask_socketio import join_room as sio_join_room, leave_room as sio_leave_room

from app import presence
from app.auth import user_from_token
from app.extensions import db, socketio
from app.models import RoomPlayer


@socketio.on("join_room")
def on_join_room(data):
    """Body: {"roomId": "..."} — only players seated at the table may
    listen in (broadcasts carry the full game state)."""
    user_id = presence.user_for(request.sid)
    try:
        room_id = uuid.UUID(str((data or {}).get("roomId")))
    except ValueError:
        return {"ok": False}
    if user_id is None:
        return {"ok": False}

    try:
        seated = (
            RoomPlayer.query.filter_by(room_id=room_id, user_id=user_id).first()
            is not None
        )
    finally:
        db.session.remove()
    if not seated:
        return {"ok": False}
    sio_join_room(f"room:{room_id}")
    return {"ok": True}


@socketio.on("leave_room")
def on_leave_room(data):
    room_id = (data or {}).get("roomId")
    if room_id is not None:
        sio_leave_room(f"room:{room_id}")


@socketio.on("authenticate")
def on_authenticate(data):
    """Body: {"token": "<access token>"} — acks {"ok": bool}."""
    token = (data or {}).get("token") or ""
    try:
        try:
            user_id = user_from_token(token, "access").id
        except jwt.InvalidTokenError:
            return {"ok": False}

        sio_join_room(f"user:{user_id}")
        if presence.connect(request.sid, user_id):
            presence.notify_friends_of([user_id])
    finally:
        db.session.remove()
    return {"ok": True}


@socketio.on("disconnect")
def on_disconnect(*_args):
    user_id = presence.disconnect(request.sid)
    if user_id is not None:
        try:
            presence.notify_friends_of([user_id])
        finally:
            db.session.remove()

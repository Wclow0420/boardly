"""Socket.IO events. Clients join a per-room channel to receive
`room_updated`, `game_started`, and `game_updated` broadcasts that the
REST endpoints emit.

A client that sends `authenticate` with its access token also joins its
personal `user:<id>` channel (`friends_updated`, `table_invite`) and
counts as online for as long as that socket stays connected."""

import uuid

import jwt
from flask import request
from flask_socketio import join_room as sio_join_room, leave_room as sio_leave_room

from app import presence
from app.auth import decode_token
from app.extensions import db, socketio


@socketio.on("join_room")
def on_join_room(data):
    room_id = data.get("roomId")
    if room_id is not None:
        sio_join_room(f"room:{room_id}")


@socketio.on("leave_room")
def on_leave_room(data):
    room_id = data.get("roomId")
    if room_id is not None:
        sio_leave_room(f"room:{room_id}")


@socketio.on("authenticate")
def on_authenticate(data):
    """Body: {"token": "<access token>"} — acks {"ok": bool}."""
    token = (data or {}).get("token") or ""
    try:
        payload = decode_token(token, "access")
    except jwt.InvalidTokenError:
        return {"ok": False}

    user_id = uuid.UUID(payload["sub"])
    sio_join_room(f"user:{user_id}")
    try:
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

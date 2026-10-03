"""Socket.IO events. Clients join a per-room channel to receive
`room_updated`, `game_started`, and `game_updated` broadcasts that the
REST endpoints emit."""

from flask_socketio import join_room as sio_join_room, leave_room as sio_leave_room

from app.extensions import socketio


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

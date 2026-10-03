from datetime import datetime, timezone

from flask import Blueprint, g, request

from app.auth import require_auth
from app.extensions import db, socketio
from app.games import GameError, get_game
from app.models import GameSession, Room, RoomPlayer
from app.utils import api_error

rooms_bp = Blueprint("rooms", __name__)

ACTIVE_STATUSES = ("waiting", "playing")


def _active_membership(user_id, exclude_room_id=None):
    """The user's membership in a waiting/playing room, if any."""
    q = (
        RoomPlayer.query.filter_by(user_id=user_id)
        .join(Room)
        .filter(Room.status.in_(ACTIVE_STATUSES))
    )
    if exclude_room_id is not None:
        q = q.filter(Room.id != exclude_room_id)
    return q.first()


def _reseat(room):
    """Compact seat indices after someone leaves (turn order = seat)."""
    remaining = sorted(room.players, key=lambda p: p.seat)
    for index, player in enumerate(remaining):
        player.seat = index


def _room_payload(room: Room, with_session: bool = True) -> dict:
    payload = room.to_dict()
    if with_session:
        session = (
            GameSession.query.filter_by(room_id=room.id)
            .order_by(GameSession.started_at.desc())
            .first()
        )
        payload["session"] = session.to_dict() if session else None
    return payload


@rooms_bp.post("")
@require_auth
def create_room():
    """Body: {"gameType": "tictactoe"} — creator becomes host."""
    data = request.get_json() or {}
    game_type = data.get("gameType")
    if not game_type:
        return api_error("invalid_request", "gameType is required", 400)

    if _active_membership(g.current_user.id) is not None:
        return api_error(
            "already_in_room", "You are already at another table", 409
        )

    game = get_game(game_type)  # raises GameError if unknown
    room = Room(game_type=game.key, host_id=g.current_user.id)
    db.session.add(room)
    db.session.flush()
    db.session.add(
        RoomPlayer(room_id=room.id, user_id=g.current_user.id, seat=0, ready=True)
    )
    db.session.commit()
    return {"room": _room_payload(room)}, 201


@rooms_bp.post("/join")
@require_auth
def join_room():
    """Body: {"code": "AB12CD"}"""
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    if not code:
        return api_error("invalid_request", "code is required", 400)

    room = Room.query.filter_by(code=code).first()
    if room is None:
        return api_error("room_not_found", "Room not found", 404)

    game = get_game(room.game_type)
    existing = RoomPlayer.query.filter_by(
        room_id=room.id, user_id=g.current_user.id
    ).first()
    if existing is None:
        if _active_membership(g.current_user.id) is not None:
            return api_error(
                "already_in_room", "You are already at another table", 409
            )
        if room.status != "waiting":
            return api_error("game_started", "Game already started", 409)
        if len(room.players) >= game.max_players:
            return api_error("room_full", "Room is full", 409)
        db.session.add(
            RoomPlayer(
                room_id=room.id, user_id=g.current_user.id, seat=len(room.players)
            )
        )
        db.session.commit()

    socketio.emit("room_updated", _room_payload(room), to=f"room:{room.id}")
    return {"room": _room_payload(room)}


@rooms_bp.get("/mine")
@require_auth
def my_rooms():
    """Active (waiting/playing) rooms the authenticated user is part of."""
    memberships = (
        RoomPlayer.query.filter_by(user_id=g.current_user.id)
        .join(Room)
        .filter(Room.status.in_(ACTIVE_STATUSES))
        .order_by(Room.created_at.desc())
        .all()
    )
    return {"rooms": [_room_payload(m.room, with_session=False) for m in memberships]}


@rooms_bp.get("/code/<code>")
@require_auth
def get_room_by_code(code):
    room = Room.query.filter_by(code=code.strip().upper()).first()
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    return {"room": _room_payload(room)}


@rooms_bp.get("/<uuid:room_id>")
@require_auth
def get_room(room_id):
    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    return {"room": _room_payload(room)}


@rooms_bp.post("/<uuid:room_id>/start")
@require_auth
def start_game(room_id):
    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.host_id != g.current_user.id:
        return api_error("not_host", "Only the host can start the game", 403)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)

    game = get_game(room.game_type)
    if len(room.players) < game.min_players:
        return api_error(
            "not_enough_players", f"Need at least {game.min_players} players", 409
        )
    # Host is ready by definition — never let a stale host row block start
    if not all(p.ready for p in room.players if p.user_id != room.host_id):
        return api_error("not_all_ready", "Not everyone is ready yet", 409)

    session = GameSession(
        room_id=room.id,
        game_type=room.game_type,
        state=game.initial_state(len(room.players)),
    )
    room.status = "playing"
    db.session.add(session)
    db.session.commit()

    socketio.emit(
        "game_started",
        {"roomId": str(room.id), "session": session.to_dict()},
        to=f"room:{room.id}",
    )
    return {"session": session.to_dict()}, 201


@rooms_bp.post("/<uuid:room_id>/move")
@require_auth
def make_move(room_id):
    """Body: {"move": {...game-specific...}} — mover is the caller."""
    data = request.get_json() or {}
    move = data.get("move")
    if move is None:
        return api_error("invalid_request", "move is required", 400)

    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    session = (
        GameSession.query.filter_by(room_id=room.id, status="in_progress")
        .order_by(GameSession.started_at.desc())
        .first()
    )
    if session is None:
        return api_error("no_game", "No game in progress", 409)

    player = RoomPlayer.query.filter_by(
        room_id=room.id, user_id=g.current_user.id
    ).first()
    if player is None:
        return api_error("not_in_room", "You are not in this room", 403)

    game = get_game(session.game_type)
    session.state = game.apply_move(session.state, player.seat, move)

    result = game.get_result(session.state)
    if result is not None:
        session.status = "finished"
        session.finished_at = datetime.now(timezone.utc)
        room.status = "finished"
        winner_seat = result.get("winnerSeat")
        if winner_seat is not None:
            winner = RoomPlayer.query.filter_by(
                room_id=room.id, seat=winner_seat
            ).first()
            session.winner_user_id = winner.user_id if winner else None
    db.session.commit()

    socketio.emit(
        "game_updated",
        {"roomId": str(room.id), "session": session.to_dict(), "result": result},
        to=f"room:{room.id}",
    )
    return {"session": session.to_dict(), "result": result}



@rooms_bp.post("/<uuid:room_id>/ready")
@require_auth
def set_ready(room_id):
    """Body: {"ready": true|false} — lobby readiness (host is always ready)."""
    data = request.get_json() or {}
    ready = bool(data.get("ready"))

    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)
    player = RoomPlayer.query.filter_by(
        room_id=room.id, user_id=g.current_user.id
    ).first()
    if player is None:
        return api_error("not_in_room", "You are not in this room", 403)
    if room.host_id == g.current_user.id:
        return api_error("invalid_request", "The host is always ready", 400)

    player.ready = ready
    db.session.commit()
    socketio.emit("room_updated", _room_payload(room), to=f"room:{room.id}")
    return {"room": _room_payload(room)}


@rooms_bp.post("/<uuid:room_id>/leave")
@require_auth
def leave_room(room_id):
    """Leave the table. Host leaving a waiting room closes it; leaving
    mid-game forfeits (remaining player wins a 2-player game)."""
    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    player = RoomPlayer.query.filter_by(
        room_id=room.id, user_id=g.current_user.id
    ).first()
    if player is None:
        return api_error("not_in_room", "You are not in this room", 403)

    if room.status == "waiting":
        if room.host_id == g.current_user.id:
            room.status = "closed"
            db.session.commit()
            socketio.emit(
                "room_closed", {"roomId": str(room.id)}, to=f"room:{room.id}"
            )
            socketio.emit(
                "room_updated", _room_payload(room), to=f"room:{room.id}"
            )
        else:
            db.session.delete(player)
            db.session.flush()
            _reseat(room)
            db.session.commit()
            socketio.emit(
                "room_updated", _room_payload(room), to=f"room:{room.id}"
            )
        return {"room": _room_payload(room)}

    if room.status == "playing":
        session = (
            GameSession.query.filter_by(room_id=room.id, status="in_progress")
            .order_by(GameSession.started_at.desc())
            .first()
        )
        room.status = "finished"
        if session is not None:
            session.status = "finished"
            session.finished_at = datetime.now(timezone.utc)
            remaining = [p for p in room.players if p.user_id != g.current_user.id]
            if len(remaining) == 1:
                session.winner_user_id = remaining[0].user_id
        db.session.commit()
        socketio.emit(
            "game_updated",
            {
                "roomId": str(room.id),
                "session": session.to_dict() if session else None,
                "result": {"forfeit": True},
            },
            to=f"room:{room.id}",
        )
        socketio.emit("room_updated", _room_payload(room), to=f"room:{room.id}")
        return {"room": _room_payload(room)}

    # finished / closed rooms: nothing to do
    return {"room": _room_payload(room)}


@rooms_bp.errorhandler(GameError)
def handle_game_error(err):
    return api_error("game_error", str(err), 400)

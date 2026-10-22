from datetime import datetime, timezone

from flask import Blueprint, current_app, g, request
from flask_socketio import leave_room as sio_leave_room

from app import presence
from app.auth import require_auth
from app.bots import bots_available, nudge, practice_bots, seat_bots
from app.extensions import db, socketio
from app.games import GameError, get_game
from app.models import GameSession, Room, RoomPlayer
from app.outcomes import record_outcomes
from app.play import announce_move, apply_move
from app.rewards import grant_game_rewards
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


def _seat_of(room: Room, user_id) -> int:
    """The user's seat at this table, or -1 if they are not seated."""
    for player in room.players:
        if player.user_id == user_id:
            return player.seat
    return -1


def _room_payload(room: Room, viewer_id=None) -> dict:
    """Room as one user sees it. With a viewer, includes the latest game
    session filtered through that player's view (hidden information
    stays on the server)."""
    payload = room.to_dict()
    payload["botsAvailable"] = bots_available(room)
    if viewer_id is not None:
        session = (
            GameSession.query.filter_by(room_id=room.id)
            .order_by(GameSession.started_at.desc())
            .first()
        )
        payload["session"] = (
            session.to_dict(_seat_of(room, viewer_id)) if session else None
        )
    return payload


def _broadcast_room(room: Room):
    """Tell the table the room changed. Carries no game state — every
    client refetches its own view."""
    socketio.emit("room_updated", _room_payload(room), to=f"room:{room.id}")


@rooms_bp.post("")
@require_auth
def create_room():
    """Body: {"gameType": "tictactoe", "options"?: {...}, "practice"?:
    true} — creator becomes host. A practice table comes already filled
    with bots, all ready (app/bots.py PRACTICE_BOTS): the host can still
    add or take off bots, change the settings and start when they like.
    Like every table it is private: friends join it only by its code."""
    data = request.get_json() or {}
    game_type = data.get("gameType")
    if not game_type:
        return api_error("invalid_request", "gameType is required", 400)
    practice = data.get("practice") is True

    if _active_membership(g.current_user.id) is not None:
        return api_error(
            "already_in_room", "You are already at another table", 409
        )

    game = get_game(game_type)  # raises GameError if unknown
    room = Room(
        game_type=game.key,
        host_id=g.current_user.id,
        options=game.clean_options(data.get("options")),
        practice=practice,
    )
    if practice and not bots_available(room):
        return api_error("no_bots", "There are no bots for this game yet", 409)
    db.session.add(room)
    db.session.flush()
    room.players.append(
        RoomPlayer(room_id=room.id, user_id=g.current_user.id, seat=0, ready=True)
    )
    if practice:
        seat_bots(room, practice_bots(game))
    db.session.commit()
    return {"room": _room_payload(room, g.current_user.id)}, 201


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

    _broadcast_room(room)
    return {"room": _room_payload(room, g.current_user.id)}


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
    return {"rooms": [_room_payload(m.room) for m in memberships]}


@rooms_bp.get("/code/<code>")
@require_auth
def get_room_by_code(code):
    room = Room.query.filter_by(code=code.strip().upper()).first()
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    payload = _room_payload(room, g.current_user.id)
    # Bots pick up where they were if the server restarted mid-game
    nudge(room)
    return {"room": payload}


@rooms_bp.get("/<uuid:room_id>")
@require_auth
def get_room(room_id):
    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    payload = _room_payload(room, g.current_user.id)
    nudge(room)
    return {"room": payload}


@rooms_bp.patch("/<uuid:room_id>/options")
@require_auth
def set_options(room_id):
    """Body: {"options": {"mode": "endless"}} — the host changes the
    game's settings while the table is still waiting."""
    room = db.session.get(Room, room_id)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.host_id != g.current_user.id:
        return api_error("not_host", "Only the host can change settings", 403)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)
    game = get_game(room.game_type)
    room.options = game.clean_options((request.get_json() or {}).get("options"), room.options)
    db.session.commit()
    _broadcast_room(room)
    return {"room": _room_payload(room, g.current_user.id)}


@rooms_bp.post("/<uuid:room_id>/bots")
@require_auth
def add_bots(room_id):
    """Body: {"count": 3} — the host fills empty seats with bot players
    (see app/bots.py). They sit down ready, and the server plays them."""
    if not current_app.config.get("BOTS_ENABLED"):
        return api_error("not_found", "Not found", 404)
    # Locked: players joining at the same moment take seats one by one
    room = db.session.get(Room, room_id, with_for_update=True)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.host_id != g.current_user.id:
        return api_error("not_host", "Only the host can add bots", 403)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)
    if not bots_available(room):
        return api_error("no_bots", "There are no bots for this game yet", 409)
    count = (request.get_json(silent=True) or {}).get("count")
    free = get_game(room.game_type).max_players - len(room.players)
    if not isinstance(count, int) or isinstance(count, bool) or not 1 <= count <= free:
        return api_error("invalid_request", f"Ask for between 1 and {free} bots", 400)
    seat_bots(room, count)
    db.session.commit()
    _broadcast_room(room)
    return {"added": count, "room": _room_payload(room, g.current_user.id)}, 201


@rooms_bp.delete("/<uuid:room_id>/bots/<uuid:user_id>")
@require_auth
def remove_bot(room_id, user_id):
    """The host takes a bot off a waiting table."""
    room = db.session.get(Room, room_id, with_for_update=True)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.host_id != g.current_user.id:
        return api_error("not_host", "Only the host can remove bots", 403)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)
    player = next(
        (p for p in room.players if p.user_id == user_id and p.user.is_bot), None
    )
    if player is None:
        return api_error("not_found", "No such bot at this table", 404)
    room.players.remove(player)  # deleted as an orphan
    db.session.flush()
    _reseat(room)
    db.session.commit()
    _broadcast_room(room)
    return {"room": _room_payload(room, g.current_user.id)}


@rooms_bp.delete("/<uuid:room_id>/players/<uuid:user_id>")
@require_auth
def remove_player(room_id, user_id):
    """The host takes anyone (a person or a bot) off a waiting table, not
    themselves (they leave, which closes it). The seats close up, the
    table hears it, and the one removed gets `removed_from_room` on their
    own channel and stops hearing the table."""
    room = db.session.get(Room, room_id, with_for_update=True)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if room.host_id != g.current_user.id:
        return api_error("not_host", "Only the host can remove players", 403)
    if room.status != "waiting":
        return api_error("game_started", "Game already started", 409)
    if user_id == g.current_user.id:
        return api_error("cannot_remove_self", "Leave the table instead", 400)
    player = next((p for p in room.players if p.user_id == user_id), None)
    if player is None:
        return api_error("not_found", "No such player at this table", 404)
    is_bot = player.user.is_bot
    room.players.remove(player)  # deleted as an orphan
    db.session.flush()
    _reseat(room)
    db.session.commit()
    if not is_bot:
        channel = f"room:{room.id}"
        for sid in presence.sids_of(user_id):
            sio_leave_room(channel, sid=sid, namespace="/")
        socketio.emit(
            "removed_from_room",
            {"roomId": str(room.id), "code": room.code},
            to=f"user:{user_id}",
        )
    _broadcast_room(room)
    return {"room": _room_payload(room, g.current_user.id)}


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
        state=game.new_state(
            len(room.players), game.clean_options(None, room.options)
        ),
    )
    room.status = "playing"
    db.session.add(session)
    db.session.commit()

    socketio.emit("game_started", {"roomId": str(room.id)}, to=f"room:{room.id}")
    # Friends see these players switch to "in game"
    presence.notify_friends_of([p.user_id for p in room.players])
    payload = session.to_dict(_seat_of(room, g.current_user.id))
    nudge(room)
    return {"session": payload}, 201


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
    # Row lock: games with simultaneous actions (votes, secret cards)
    # get concurrent moves, and each must build on the previous one.
    session = (
        GameSession.query.filter_by(room_id=room.id, status="in_progress")
        .order_by(GameSession.started_at.desc())
        .with_for_update()
        .first()
    )
    if session is None:
        return api_error("no_game", "No game in progress", 409)

    player = RoomPlayer.query.filter_by(
        room_id=room.id, user_id=g.current_user.id
    ).first()
    if player is None:
        return api_error("not_in_room", "You are not in this room", 403)

    result = apply_move(room, session, player.seat, move)
    payload = {"session": session.to_dict(player.seat), "result": result}
    db.session.commit()

    announce_move(room, result, session)
    # The game may be waiting on a bot now
    nudge(room)
    return payload



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
    _broadcast_room(room)
    return {"room": _room_payload(room, g.current_user.id)}


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

    leave(room, player)
    return {"room": _room_payload(room, g.current_user.id)}


def leave(room, player):
    """Take a player out of a room and tell everyone at the table.
    Host leaving a waiting room closes it; leaving mid-game forfeits.
    Commits; finished / closed rooms are left untouched."""
    user_id = player.user_id

    if room.status == "waiting":
        if room.host_id == user_id:
            room.status = "closed"
            db.session.commit()
            socketio.emit(
                "room_closed", {"roomId": str(room.id)}, to=f"room:{room.id}"
            )
        else:
            db.session.delete(player)
            db.session.flush()
            _reseat(room)
            db.session.commit()
        _broadcast_room(room)

    elif room.status == "playing":
        session = (
            GameSession.query.filter_by(room_id=room.id, status="in_progress")
            .order_by(GameSession.started_at.desc())
            .first()
        )
        room.status = "finished"
        if session is not None:
            session.status = "finished"
            session.finished_at = datetime.now(timezone.utc)
            session.state = get_game(session.game_type).on_abandon(
                session.state, player.seat
            )
            remaining = [p for p in room.players if p.user_id != user_id]
            if len(remaining) == 1:
                session.winner_user_id = remaining[0].user_id
                session.winner_user_ids = [str(remaining[0].user_id)]
            grant_game_rewards(room, session, abandoned=True, exclude=user_id)
            record_outcomes(room, session, abandoned=True, exclude=user_id)
        db.session.commit()
        socketio.emit(
            "game_updated", {"roomId": str(room.id)}, to=f"room:{room.id}"
        )
        _broadcast_room(room)
        presence.notify_friends_of([p.user_id for p in room.players])


@rooms_bp.post("/<uuid:room_id>/rematch")
@require_auth
def rematch(room_id):
    """Play again with the same people. The first player to ask opens a
    fresh table (and hosts it); everyone else who asks joins that table.
    The finished room keeps its history untouched."""
    me = g.current_user
    # Lock the finished room so two players asking at once share one table
    room = db.session.get(Room, room_id, with_for_update=True)
    if room is None:
        return api_error("room_not_found", "Room not found", 404)
    if _seat_of(room, me.id) < 0:
        return api_error("not_in_room", "You are not in this room", 403)
    if room.status != "finished":
        return api_error("game_not_finished", "The game isn't over yet", 409)

    target = room.rematch_room
    active = _active_membership(me.id)
    if active is not None:
        if target is not None and active.room_id == target.id:
            return {"room": _room_payload(target, me.id)}  # already there
        return api_error("already_in_room", "You are already at another table", 409)

    if target is not None and target.status == "playing":
        return api_error("game_started", "Game already started", 409)
    if target is not None and target.status != "waiting":
        target = None  # that rematch is over or was closed — open a new one

    game = get_game(room.game_type)
    if target is None:
        target = Room(
            game_type=room.game_type,
            host_id=me.id,
            options=dict(room.options or {}),
            practice=bool(room.practice),
        )
        db.session.add(target)
        db.session.flush()
        target.players.append(
            RoomPlayer(room_id=target.id, user_id=me.id, seat=0, ready=True)
        )
        room.rematch_room_id = target.id
        # The bots come along: the same ones, if they are free
        bots = [p.user_id for p in room.players if p.user is not None and p.user.is_bot]
        if bots and bots_available(target):
            seat_bots(target, len(bots), prefer=bots)
    else:
        if len(target.players) >= game.max_players:
            return api_error("room_full", "Room is full", 409)
        db.session.add(
            RoomPlayer(room_id=target.id, user_id=me.id, seat=len(target.players))
        )
    db.session.commit()

    # Players still looking at the finished game see the invitation;
    # players already at the new table see the newcomer.
    _broadcast_room(room)
    _broadcast_room(target)
    return {"room": _room_payload(target, me.id)}


@rooms_bp.errorhandler(GameError)
def handle_game_error(err):
    return api_error("game_error", str(err), 400)

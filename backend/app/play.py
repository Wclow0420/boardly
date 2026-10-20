"""Applying a move to a table's game — shared by players' moves
(routes/rooms.py) and bot moves (app/bots.py)."""

from datetime import datetime, timezone

from app import presence
from app.extensions import socketio
from app.games import get_game
from app.outcomes import record_outcomes
from app.rewards import grant_game_rewards


def winner_ids(room, result: dict) -> list:
    seats = result.get("winnerSeats")
    if seats is None:
        seats = [result["winnerSeat"]] if result.get("winnerSeat") is not None else []
    return [p.user_id for p in room.players if p.seat in seats]


def apply_move(room, session, seat: int, move: dict) -> dict | None:
    """Play `move` for `seat` on the locked session; when it ends the
    game, finish the room and queue the rewards and stats. Raises
    GameError for an illegal move. Does not commit; returns the result
    (None while the game goes on)."""
    game = get_game(session.game_type)
    version = session.state.get("_v", 0)
    session.state = {**game.apply_move(session.state, seat, move), "_v": version + 1}

    result = game.get_result(session.state)
    if result is not None:
        session.status = "finished"
        session.finished_at = datetime.now(timezone.utc)
        room.status = "finished"
        winners = winner_ids(room, result)
        session.winner_user_ids = [str(user_id) for user_id in winners]
        session.winner_user_id = winners[0] if len(winners) == 1 else None
        grant_game_rewards(room, session)
        record_outcomes(room, session)
    return result


def announce_move(room, result, session=None) -> None:
    """After the commit, the new state goes out: each player at the table
    is sent their own view of it (no refetch, no waiting on a second round
    trip), and the table's channel is told for anyone watching. When the
    game ended, friends see these players free again."""
    if session is not None and result is None:
        for player in room.players:
            if player.user is not None and not player.user.is_bot:
                socketio.emit(
                    "game_updated",
                    {"roomId": str(room.id), "session": session.to_dict(player.seat)},
                    to=f"user:{player.user_id}",
                )
        socketio.emit("game_updated", {"roomId": str(room.id), "seated": True}, to=f"room:{room.id}")
        return
    socketio.emit("game_updated", {"roomId": str(room.id)}, to=f"room:{room.id}")
    if result is not None:
        presence.notify_friends_of([p.user_id for p in room.players])

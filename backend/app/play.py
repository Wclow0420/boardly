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
    session.state = game.apply_move(session.state, seat, move)

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


def announce_move(room, result) -> None:
    """After the commit: everyone at the table refetches their view;
    when the game ended, friends see these players free again."""
    socketio.emit("game_updated", {"roomId": str(room.id)}, to=f"room:{room.id}")
    if result is not None:
        presence.notify_friends_of([p.user_id for p in room.players])

"""Game registry.

Each game lives in its own folder (app/games/<key>/) and exposes a
`game` instance in its game.py. Register it here to make it playable.
"""

from app.games.base import BaseGame, GameError
from app.games.tictactoe.game import game as tictactoe

GAMES: dict[str, BaseGame] = {
    tictactoe.key: tictactoe,
}


def get_game(key: str) -> BaseGame:
    if key not in GAMES:
        raise GameError(f"Unknown game type: {key}")
    return GAMES[key]

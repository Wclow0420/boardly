"""Game registry.

Each game lives in its own folder (app/games/<key>/) and exposes a
`game` instance in its game.py. Register it here to make it playable.
"""

from app.games.base import BaseGame, GameError
from app.games.avalon.game import game as avalon
from app.games.coup.game import game as coup
from app.games.manor.game import game as manor
from app.games.tictactoe.game import game as tictactoe

GAMES: dict[str, BaseGame] = {
    tictactoe.key: tictactoe,
    avalon.key: avalon,
    coup.key: coup,
    manor.key: manor,
}


def get_game(key: str) -> BaseGame:
    if key not in GAMES:
        raise GameError(f"Unknown game type: {key}")
    return GAMES[key]

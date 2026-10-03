from flask import Blueprint

from app.games import GAMES

games_bp = Blueprint("games", __name__)


@games_bp.get("")
def list_games():
    """Catalogue of playable games, driven by the registry."""
    return {"games": [g.to_dict() for g in GAMES.values()]}

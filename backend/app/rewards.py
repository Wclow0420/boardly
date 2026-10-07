"""Coins for finished games.

Every player still at the table when a game ends earns coins: the
game's `coins_win` for winners, `coins_play` for everyone else. A game
that ends because someone walked out pays only `coins_play`, so leaving
on purpose cannot be used to hand a friend easy wins.
"""

from app.extensions import db
from app.games import get_game
from app.models import CoinReward


def grant_game_rewards(room, session, abandoned=False, exclude=None):
    """Queue each seated player's reward for this session (not `exclude`,
    the player who walked out). Does not commit. Call once per session."""
    game = get_game(session.game_type)
    winners = set(session.winner_user_ids or [])
    for player in room.players:
        if player.user_id == exclude:
            continue
        won = str(player.user_id) in winners and not abandoned
        amount = game.coins_win if won else game.coins_play
        if amount <= 0:
            continue
        db.session.add(
            CoinReward(
                user_id=player.user_id,
                session_id=session.id,
                game_type=session.game_type,
                amount=amount,
                reason="win" if won else "played",
            )
        )

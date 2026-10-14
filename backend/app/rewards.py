"""Coins for finished games.

Every player still at the table when a game ends earns coins: the
game's `coins_win` for winners, `coins_play` for everyone else. A game
that ends because someone walked out pays only `coins_play`, so leaving
on purpose cannot be used to hand a friend easy wins. Bots earn
nothing, and a game with a bot at the table pays only `coins_play`, so
beating bots cannot be farmed for coins.
"""

from app.extensions import db
from app.games import get_game
from app.models import CoinReward


def grant_game_rewards(room, session, abandoned=False, exclude=None):
    """Queue each seated player's reward for this session (not `exclude`,
    the player who walked out). Does not commit. Call once per session."""
    game = get_game(session.game_type)
    winners = set(session.winner_user_ids or [])
    with_bots = any(p.user is not None and p.user.is_bot for p in room.players)
    for player in room.players:
        if player.user_id == exclude or (player.user is not None and player.user.is_bot):
            continue
        won = str(player.user_id) in winners and not abandoned and not with_bots
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

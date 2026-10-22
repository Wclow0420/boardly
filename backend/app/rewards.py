"""Coins and badges for finished games: the one place that says what a
game pays.

Every player still at the table when a game ends earns coins: the
game's `coins_win` for winners, `coins_play` for everyone else. A game
that ends because someone walked out pays only `coins_play`, so leaving
on purpose cannot be used to hand a friend easy wins. Bots earn
nothing.

THE BOT-GAME RULE: a game with any bot at the table (a practice table
or bots added in the lobby) is a bot game. It pays BOT_GAME_COINS of
what the same game would pay among people (rounded, at least 1 coin)
and counts towards no badge at all (so no earned border either); it
still counts as played (and won) on the player card. `is_bot_game` is
what decides it, here and in app/outcomes.py.

The coins go straight onto the balance when the game ends: there is
nothing to claim. A CoinReward row stays behind as the record of what
each game paid (the after-game screen shows it).
"""

import math
from datetime import datetime, timezone

from sqlalchemy import update

from app.extensions import db
from app.games import get_game
from app.models import CoinReward, User

# What a bot game pays, as a share of the same game among people
BOT_GAME_COINS = 0.25


def is_bot_game(room) -> bool:
    """Whether a bot sits (or sat) at this table."""
    return any(p.user is not None and p.user.is_bot for p in room.players)


def game_coins(game, won: bool, bot_game: bool) -> int:
    """What one player earns from a finished game."""
    amount = game.coins_win if won else game.coins_play
    if bot_game and amount > 0:
        # rounded half up (Python's round() would make 2.5 into 2)
        amount = max(1, math.floor(amount * BOT_GAME_COINS + 0.5))
    return amount


def grant_game_rewards(room, session, abandoned=False, exclude=None):
    """Pay each seated player (not `exclude`, the player who walked out)
    for this session, straight onto their balance. Does not commit. Call
    once per session."""
    game = get_game(session.game_type)
    winners = set(session.winner_user_ids or [])
    bot_game = is_bot_game(room)
    now = datetime.now(timezone.utc)
    for player in room.players:
        if player.user_id == exclude or (player.user is not None and player.user.is_bot):
            continue
        won = str(player.user_id) in winners and not abandoned
        amount = game_coins(game, won, bot_game)
        if amount <= 0:
            continue
        db.session.add(
            CoinReward(
                user_id=player.user_id,
                session_id=session.id,
                game_type=session.game_type,
                amount=amount,
                reason="win" if won else "played",
                claimed_at=now,
            )
        )
        # One UPDATE adding to what is there: a purchase at the same
        # moment (which locks the row) can never be overwritten
        db.session.execute(
            update(User).where(User.id == player.user_id).values(coins=User.coins + amount)
        )

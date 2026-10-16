"""Badges for playing Boardly at all (each game adds its own: the
`badges` list on its engine). A badge with a plain count uses `match`;
the few that need more than one game at a time are measured below."""

from app.games.base import Badge

GENERAL_BADGES = [
    Badge("boardly.regular", (1, 10, 50, 100), lambda o: True),
    Badge("boardly.champion", (1, 10, 25, 100)),
    Badge("boardly.streak", (3, 5, 8, 12)),
    Badge("boardly.company", (3, 10, 25, 60)),
]


def _streak(ctx):
    """How long my best run of wins is, and when it first reached each
    length."""
    return ctx["best_streak"], ctx["streak_reached"]


def _company(ctx):
    """How many players I've met, and when I met the nth."""
    met = sorted(ctx["co_players"].values())
    return len(met), met


# Badges measured over all games rather than counted one game at a time:
# each gives (progress, when progress first reached 1, 2, 3...)
MEASURED = {
    "boardly.streak": _streak,
    "boardly.company": _company,
}

"""Badges for playing Boardly at all (each game adds its own: the
`badges` list on its engine). A badge with a plain count uses `match`;
the few that need more than one game at a time are measured below."""

from app.games.base import Badge

GENERAL_BADGES = [
    Badge("boardly.firstTable", "bronze", 1, lambda o: True, "played"),
    Badge("boardly.firstWin", "bronze", 1, series="wins"),
    Badge("boardly.regular", "silver", 10, lambda o: True, "played"),
    Badge("boardly.streak", "silver", 3),
    Badge("boardly.company", "silver", 5),
    Badge("boardly.veteran", "gold", 50, lambda o: True, "played"),
    Badge("boardly.champion", "gold", 25, series="wins"),
    Badge("boardly.legend", "legendary", 100, lambda o: True, "played"),
]


def _streak(ctx, goal):
    best, reached = ctx["best_streak"]
    return best, reached if best >= goal else None


def _company(ctx, goal):
    met = sorted(ctx["co_players"].values())
    return len(met), met[goal - 1] if len(met) >= goal else None


# Badges measured over all games rather than counted one game at a time
MEASURED = {
    "boardly.streak": _streak,
    "boardly.company": _company,
}

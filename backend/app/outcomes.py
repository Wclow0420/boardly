"""Each player's outcome per finished game, and what is built from it:
per-game stats and badges.

record_outcomes() runs where a game ends (next to the coin rewards).
player_card() answers the profile: totals, a line per game, and every
badge with its progress.
"""

from datetime import datetime, timezone

from app.achievements import GENERAL_BADGES, MEASURED
from app.extensions import db
from app.games import GAMES, get_game
from app.games.base import TIERS
from app.models import GameSession, SessionPlayer


def _outcome(game, state: dict, seat: int) -> dict:
    """The game's player_outcome, never allowed to stop a game ending."""
    try:
        return game.player_outcome(state, seat) or {}
    except Exception:  # noqa: BLE001 - stats must not break finishing
        return {}


def record_outcomes(room, session, abandoned=False, exclude=None):
    """Write how every seated player did (`exclude` walked out). Does not
    commit. Call once, when the session finishes. Games with a bot at
    the table are practice: they count towards no stats or badges."""
    if any(p.user is not None and p.user.is_bot for p in room.players):
        return
    game = get_game(session.game_type)
    winners = set(session.winner_user_ids or [])
    finished = session.finished_at or datetime.now(timezone.utc)
    for player in room.players:
        left = player.user_id == exclude
        outcome = _outcome(game, session.state, player.seat)
        db.session.add(
            SessionPlayer(
                session_id=session.id,
                user_id=player.user_id,
                game_type=session.game_type,
                seat=player.seat,
                side=outcome.get("side"),
                role=outcome.get("role"),
                # a forfeit is a win on the card, but never towards a badge
                won=str(player.user_id) in winners and not left,
                abandoned=abandoned,
                left_game=left,
                facts=outcome.get("facts") or {},
                finished_at=finished,
            )
        )


def _fill_in(rows):
    """Rows copied from before the table existed (facts NULL): ask each
    game what the saved state says. Commits once, if anything changed."""
    missing = [row for row in rows if row.facts is None]
    if not missing:
        return
    sessions = {
        s.id: s
        for s in GameSession.query.filter(
            GameSession.id.in_({row.session_id for row in missing})
        )
    }
    for row in missing:
        game = GAMES.get(row.game_type)
        session = sessions.get(row.session_id)
        outcome = _outcome(game, session.state, row.seat) if game and session else {}
        row.side = outcome.get("side")
        row.role = outcome.get("role")
        row.facts = outcome.get("facts") or {}
        row.abandoned = bool(session) and (session.state or {}).get("winReason") == "abandoned"
    db.session.commit()


def _streaks(rows):
    """(current, best, when a run of wins first reached 1, 2, 3...) over
    games in order."""
    current = best = 0
    reached = []
    for row in rows:
        current = current + 1 if row.won else 0
        if current > best:
            best = current
            reached.append(row.finished_at)
    return current, best, reached


def _count(rows, match):
    """(progress, when it reached 1, 2, 3...) of a counted badge."""
    hits = [row.finished_at for row in rows if match(row)]
    return len(hits), hits


def _iso(when):
    return when.isoformat() if when else None


def player_card(user_id) -> dict:
    rows = (
        SessionPlayer.query.filter_by(user_id=user_id)
        .order_by(SessionPlayer.finished_at)
        .all()
    )
    _fill_in(rows)
    # games I was at the end of (walking out still counts as played)
    played = rows
    current, best, reached = _streaks(played)

    games = {}
    for row in played:
        line = games.setdefault(
            row.game_type,
            {"gameType": row.game_type, "played": 0, "wins": 0, "sides": {}},
        )
        line["played"] += 1
        line["wins"] += int(row.won)
        if row.side:
            side = line["sides"].setdefault(row.side, {"played": 0, "wins": 0})
            side["played"] += 1
            side["wins"] += int(row.won)
    by_game = sorted(games.values(), key=lambda g: (-g["played"], g["gameType"]))

    ctx = {
        "rows": played,
        "best_streak": best,
        "streak_reached": reached,
        "co_players": _co_players(user_id, played),
    }
    badges = []
    for badge in GENERAL_BADGES:
        if badge.key in MEASURED:
            progress, times = MEASURED[badge.key](ctx)
        else:
            progress, times = _count(played, badge.match)
        badges.append(_badge(badge, None, progress, times))
    for key, game in GAMES.items():
        mine = [r for r in played if r.game_type == key and not r.abandoned]
        for badge in game.badges:
            progress, times = _count(mine, badge.match)
            badges.append(_badge(badge, key, progress, times))

    return {
        "gamesPlayed": len(played),
        "wins": sum(int(r.won) for r in played),
        "streak": current,
        "bestStreak": best,
        "favourite": by_game[0]["gameType"] if by_game else None,
        # When the latest game ended: badges unlocked at this moment were
        # earned in it (the app celebrates those when the game ends)
        "lastGameAt": _iso(played[-1].finished_at) if played else None,
        "games": by_game,
        "badges": badges,
        "tiers": list(TIERS),
    }


def has_badge(user_id, key, tier="bronze") -> bool:
    """Whether this player has reached `tier` of the badge `key`."""
    return any(
        b["key"] == key and tier in b["unlocked"]
        for b in player_card(user_id)["badges"]
    )


def _badge(badge, game_type, progress, times):
    """A badge as the app sees it: its four goals, how far I am, the
    highest level reached (None before bronze) and when each level was
    reached. `times[n - 1]` is when progress first reached n."""
    unlocked = {
        tier: _iso(times[goal - 1])
        for tier, goal in zip(TIERS, badge.goals)
        if len(times) >= goal
    }
    return {
        "key": badge.key,
        "gameType": game_type,
        "goals": list(badge.goals),
        "progress": min(progress, badge.goals[-1]),
        "tier": next((t for t in reversed(TIERS) if t in unlocked), None),
        "unlocked": unlocked,
    }


def _co_players(user_id, rows):
    """When each other player was first met at a finished table."""
    if not rows:
        return {}
    met = {}
    others = (
        SessionPlayer.query.filter(
            SessionPlayer.session_id.in_({r.session_id for r in rows}),
            SessionPlayer.user_id != user_id,
        )
        .order_by(SessionPlayer.finished_at)
        .all()
    )
    for other in others:
        met.setdefault(other.user_id, other.finished_at)
    return met

"""How a bot plays Double Agent, from its own view of the game.

Everything comes from the view a player gets: the public record (every
proposal, every vote, every mission's fail count) and what the bot's own
role learned at the start (`known`). Bots keep no memory between moves.

- Agents weigh every way the moles could be seated against the record:
  a sabotaged mission had at least that many moles on it, a clean one
  probably had none, and moles tend to back teams with a mole on them.
  The leader takes himself and the players least likely to be moles; a
  vote approves a team nearly as likely to be clean as the one he'd
  pick himself, and always the last team before five rejections.
- The Handler rules out worlds with what he knows, but only some of the
  time, so the Hitman can't just pick the one perfect voter. The
  Bodyguard knows exactly one of his two candidates is the Decoy.
- Moles put one of their own on a team (two when the mission needs two
  sabotages), lean towards teams with a mole on them, and sabotage most of the
  time (less on the first mission, always when it decides the game).
  When several moles share a mission only one sabotages, unless it
  takes two.
- The Hitman names the agent whose votes and teams best avoided the
  moles: the one who acted most like the Handler.
- Nobody sends the quiet `pick` moves: a leader bot proposes at once.
"""

from itertools import combinations

from app.games.avalon.game import EVIL_ROLES, MAX_REJECTIONS, QUESTS_TO_WIN

# How often the Handler lets what he knows show in a vote or a team
HANDLER_USES_KNOWLEDGE = 0.5
# Chance a mole sabotages a mission it could fail, by how early it is
FAIL_FIRST_QUEST = 0.5
FAIL_LATER = 0.85
# How often a mole approves a team with a mole on it, and one without
MOLE_BACKS_MOLE = 0.7
MOLE_BACKS_CLEAN = 0.5
# An agent approves a team at least this fraction as likely to be clean
# as the best team he could pick himself
APPROVE_BAR = 0.75
# How much less likely a clean mission is with a mole on it
CLEAN_WITH_MOLE = 0.4
# How much a mole's vote fits a world: [team has a mole][approved]
VOTE_TELLS = {True: {True: 1.4, False: 0.6}, False: {True: 0.8, False: 1.2}}


def _approved_missions(view):
    """(proposal, result) for every mission played so far."""
    approved = [h for h in view["history"] if h["approved"]]
    return list(zip(approved, view["questResults"]))


def _evil_count(view):
    return sum(role in EVIL_ROLES for role in view["rolesInGame"])


def _worlds(view, seat, knowledge=True):
    """Every way the moles could be seated, as seen by an agent in
    `seat`, with how likely the record makes it: (moles, weight).
    A sabotaged mission had at least as many moles as sabotages; a clean
    one with a mole on it is less likely (moles mostly sabotage). The
    Handler's and the Bodyguard's knowledge rule worlds out."""
    n = view["numPlayers"]
    role = view["myRole"]
    known = [k["seat"] for k in view["known"]] if knowledge else []
    missions = _approved_missions(view)
    worlds = []
    for moles in combinations([s for s in range(n) if s != seat], _evil_count(view)):
        moles = set(moles)
        if role == "merlin" and not set(known) <= moles:
            continue
        if role == "percival" and known and len(moles & set(known)) != 1:
            continue  # exactly one of the two is the Decoy
        weight = 1.0
        for proposal, result in missions:
            on_team = len(moles & set(result["team"]))
            if on_team < result["fails"]:
                weight = 0.0
                break
            if result["success"] and on_team and not result["fails"]:
                weight *= CLEAN_WITH_MOLE
        for proposal in view["history"] if weight else ():
            # Moles back teams with a mole on them and turn down the rest
            dirty = bool(moles & set(proposal["team"]))
            for s in moles:
                weight *= VOTE_TELLS[dirty][proposal["votes"][s]]
        if weight:
            worlds.append((moles, weight))
    return worlds


def _clean_chance(worlds, team):
    """How likely a team has no mole on it."""
    team = set(team)
    total = sum(w for _, w in worlds)
    clean = sum(w for moles, w in worlds if not moles & team)
    return clean / total if total else 0.0


def _best_team(view, seat, worlds, size, rng):
    """Me and the size-1 players least likely to be moles."""
    n = view["numPlayers"]
    total = sum(w for _, w in worlds) or 1.0
    evil = [sum(w for moles, w in worlds if s in moles) / total for s in range(n)]
    others = sorted((s for s in range(n) if s != seat), key=lambda s: (evil[s], rng.random()))
    return sorted([seat] + others[: size - 1])


def _agent_worlds(view, seat, rng):
    """The Handler hides what he knows some of the time."""
    knowledge = view["myRole"] != "merlin" or rng.random() < HANDLER_USES_KNOWLEDGE
    worlds = _worlds(view, seat, knowledge)
    return worlds or _worlds(view, seat, False) or [(set(), 1.0)]


def _suspicion(view):
    """How evil each seat looks from the public record alone (what a
    mole uses to pick agents that will pass the vote)."""
    n = view["numPlayers"]
    score = [0.0] * n
    for proposal, result in _approved_missions(view):
        for s in result["team"]:
            score[s] += result["fails"] / len(result["team"]) - (0 if result["fails"] else 0.15)
    return score


def _pick_cleanest(score, pool, count, rng):
    """`count` seats of `pool` with the lowest scores, ties broken at random."""
    ranked = sorted(pool, key=lambda s: (score[s], rng.random()))
    return ranked[:count]


# ------------------------------------------------------------------ moves


def _propose(view, seat, rng, evil, known_evil):
    n = view["numPlayers"]
    quest = view["quest"]
    size = view["questSizes"][quest]
    if not evil:
        worlds = _agent_worlds(view, seat, rng)
        return {"type": "propose", "team": _best_team(view, seat, worlds, size, rng)}

    # A mole: himself, a fellow mole if the mission needs two sabotages,
    # and the cleanest-looking agents to make it pass the vote
    public = _suspicion(view)
    team = [seat]
    if view["failsRequired"][quest] > 1:
        mates = [s for s in known_evil if s != seat]
        team += _pick_cleanest(public, mates, 1, rng)
    rest = [s for s in range(n) if s not in known_evil]
    team += _pick_cleanest(public, rest, size - len(team), rng)
    if len(team) < size:  # never short: fill with anyone left
        team += [s for s in range(n) if s not in team][: size - len(team)]
    return {"type": "propose", "team": sorted(team)}


def _vote(view, seat, rng, evil, known_evil):
    team = set(view["team"])
    last_chance = view["rejections"] >= MAX_REJECTIONS - 1
    if evil:
        if team & known_evil:
            return rng.random() < MOLE_BACKS_MOLE
        # A clean team: a coin toss, so the votes don't give them away
        return last_chance or rng.random() < MOLE_BACKS_CLEAN

    if last_chance:
        return True  # rejecting it hands the moles the game
    worlds = _agent_worlds(view, seat, rng)
    chance = _clean_chance(worlds, team)
    # As good as the team I'd pick myself?
    best = _clean_chance(worlds, _best_team(view, seat, worlds, len(team), rng))
    if chance >= best * APPROVE_BAR:
        return rng.random() < 0.95
    return rng.random() < 0.05


def _quest_card(view, seat, rng, role, known_evil):
    if role not in EVIL_ROLES:
        return "success"
    quest = view["quest"]
    results = view["questResults"]
    wins = sum(r["success"] for r in results)
    losses = len(results) - wins
    needed = view["failsRequired"][quest]
    mates = sorted(s for s in view["team"] if s in known_evil)
    oberon_unseen = "oberon" in view["rolesInGame"] and role != "oberon"

    if needed > 1:
        # It takes two: fail only with a partner (or a hidden wildcard)
        if len(mates) >= needed:
            return "fail"
        gamble = 0.6 if role == "oberon" else (0.4 if oberon_unseen else 0.0)
        return "fail" if rng.random() < gamble else "success"

    # One is enough: the lowest-seated mole on the team does it
    if mates and mates[0] != seat:
        return "success"
    if losses == QUESTS_TO_WIN - 1 or wins == QUESTS_TO_WIN - 1:
        return "fail"  # it decides the game
    chance = FAIL_FIRST_QUEST if quest == 0 else FAIL_LATER
    return "fail" if rng.random() < chance else "success"


def _assassinate(view, seat, rng):
    """The agent who acted most like the Handler: kept moles off teams
    and voted against teams that had one."""
    n = view["numPlayers"]
    evil = set(view["evilSeats"] or [])
    agents = [s for s in range(n) if s not in evil]
    score = {s: 0.0 for s in agents}
    for h in view["history"]:
        dirty = bool(set(h["team"]) & evil)
        for s in agents:
            score[s] += 1.0 if h["votes"][s] != dirty else -1.0
        if h["leader"] in score:
            score[h["leader"]] += -2.0 if dirty else 1.0
    target = max(agents, key=lambda s: (score[s], rng.random()))
    return {"type": "assassinate", "target": target}


def avalon(view, seat, rng):
    phase = view["phase"]
    role = view["myRole"]
    if role is None:
        return None
    evil = role in EVIL_ROLES
    known_evil = {k["seat"] for k in view["known"] if k["as"] == "evil"} | {seat} \
        if evil else set()

    if phase == "team" and view["leader"] == seat:
        return _propose(view, seat, rng, evil, known_evil)
    if phase == "vote" and not view["voted"][seat]:
        return {"type": "vote", "approve": bool(_vote(view, seat, rng, evil, known_evil))}
    if phase == "quest" and seat in view["team"] and seat not in view["questPlayed"]:
        return {"type": "quest", "card": _quest_card(view, seat, rng, role, known_evil)}
    if phase == "assassinate" and role == "assassin":
        return _assassinate(view, seat, rng)
    return None

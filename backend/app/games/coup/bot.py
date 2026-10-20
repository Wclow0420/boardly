"""How a bot plays Hustle, from its own view of the game.

A bot claims the roles it holds and bluffs now and then (less with one
card left, never a role whose every copy it can see). It doubts a claim
by how unlikely it is given the cards it can see (its own and the ones
face up) and by how much the claim costs it: a sure bluff is always
called, a Rough Up aimed at it often, a stranger's Collect Rent seldom.
It blocks with the card it holds, or bluffs the blocker when it is
being robbed or roughed up. It shuts down (and roughs up) the strongest
player left: most cards, then most cash. Good enough to fill a seat.
"""

from math import comb

COPIES = 3
ROLES = ("duke", "assassin", "captain", "ambassador", "contessa")
# What stops what (the same as game.ACTIONS, which imports this file)
BLOCKERS = {
    "foreignAid": ("duke",),
    "assassinate": ("contessa",),
    "steal": ("captain", "ambassador"),
}
COUP_COST = 7
ASSASSINATE_COST = 3
FORCED_COUP_AT = 10
# How much a card is worth keeping (lose the cheapest, swap for the best)
WORTH = {"duke": 5, "assassin": 4, "contessa": 3.5, "captain": 3, "ambassador": 2}
# How often the bot thinks a claim is a bluff when the claimant could
# hold the card: people claim what they hold most of the time
BLUFF_PRIOR = 0.2

PASS = {"type": "pass"}
CHALLENGE = {"type": "challenge"}


def coup(view, seat, rng):
    """The bot's move, or None when the game isn't waiting on it."""
    if seat not in view.get("waitingOn", []):
        return None
    phase = view["phase"]
    if phase == "action":
        return _act(view, seat, rng)
    if phase == "loseInfluence":
        return _give_up(view, seat)
    if phase == "exchange":
        return _swap(view, seat)
    if phase == "challengeAction":
        return _doubt_action(view, seat, rng)
    if phase == "block":
        return _maybe_block(view, seat, rng)
    if phase == "challengeBlock":
        return _doubt_block(view, seat, rng)
    return None


# ------------------------------------------------------------ reading


def _mine(view, seat):
    """The bot's own face-down roles."""
    return [c["role"] for c in view["players"][seat]["cards"] if not c["revealed"]]


def _left(view, seat):
    """How many face-down cards a seat has."""
    return sum(1 for c in view["players"][seat]["cards"] if not c["revealed"])


def _known(view, seat):
    """Every card whose role the bot can see: its own and the face-up ones."""
    return [
        c["role"]
        for s, player in enumerate(view["players"])
        for c in player["cards"]
        if c["revealed"] or s == seat
    ]


def _unseen(view, seat, role):
    """Copies of `role` the bot can't see (in other hands or the deck)."""
    return COPIES - _known(view, seat).count(role)


def _holds(view, seat, claimant, role):
    """How likely `claimant` really has `role`: the chance one of their
    face-down cards is one of the copies the bot can't see, weighed
    against how often people bluff. 0 when it can't be true."""
    known = _known(view, seat)
    pool = COPIES * len(ROLES) - len(known)
    unseen = COPIES - known.count(role)
    cards = _left(view, claimant)
    if unseen <= 0 or cards == 0:
        return 0.0
    could = 1 - comb(pool - unseen, cards) / comb(pool, cards)
    return could / (could + (1 - could) * BLUFF_PRIOR)


def _rivals(view, seat):
    return [
        s for s, p in enumerate(view["players"]) if s != seat and p["alive"]
    ]


def _bystanders(view, seat):
    """Others who could call a claim that isn't aimed at the bot: the
    more of them, the less it needs to be the one."""
    return max(1, len(_rivals(view, seat)) - 1)


def _strongest(view, seats, rng):
    """The most dangerous of `seats`: most cards, then most cash."""
    return max(
        seats,
        key=lambda s: (_left(view, s), view["players"][s]["coins"], rng.random()),
    )


# ------------------------------------------------------------ my turn


def _act(view, seat, rng):
    coins = view["players"][seat]["coins"]
    mine = _mine(view, seat)
    rivals = _rivals(view, seat)

    def claims(role, bluff):
        """Whether to claim `role`: always with it, sometimes without."""
        if role in mine:
            return True
        if _unseen(view, seat, role) <= 0:
            return False  # every copy is in sight: a sure catch
        return rng.random() < (bluff if len(mine) > 1 else bluff / 2)

    def action(kind, target=None):
        return {"type": "action", "action": kind, "target": target}

    if coins >= FORCED_COUP_AT or (coins >= COUP_COST and rng.random() < 0.85):
        return action("coup", _strongest(view, rivals, rng))
    if coins >= ASSASSINATE_COST and claims("assassin", 0.12):
        return action("assassinate", _strongest(view, rivals, rng))
    if claims("duke", 0.25):
        return action("tax")
    rich = [s for s in rivals if view["players"][s]["coins"] >= 2]
    if rich and claims("captain", 0.12):
        return action("steal", max(rich, key=lambda s: (view["players"][s]["coins"], rng.random())))
    if "ambassador" in mine and not {"duke", "assassin", "captain"} & set(mine) \
            and rng.random() < 0.7:
        return action("exchange")
    return action("foreignAid" if rng.random() < 0.5 else "income")


def _give_up(view, seat):
    """Turn over the card least worth keeping."""
    cards = view["players"][seat]["cards"]
    down = [i for i, c in enumerate(cards) if not c["revealed"]]
    return {"type": "reveal", "card": min(down, key=lambda i: WORTH[cards[i]["role"]])}


def _swap(view, seat):
    """Keep the best cards, two different ones where it can."""
    options = view["exchange"]
    slots = _left(view, seat)
    best = sorted(range(len(options)), key=lambda i: -WORTH[options[i]])
    keep = []
    for i in best:
        if len(keep) < slots and options[i] not in {options[k] for k in keep}:
            keep.append(i)
    for i in best:
        if len(keep) < slots and i not in keep:
            keep.append(i)
    return {"type": "exchange", "keep": keep}


# ------------------------------------------------------- answering


def _doubt(view, seat, claimant, role, stake, rng):
    """Challenge if it can't be true, else by how unlikely it is times
    what letting it through would cost."""
    holds = _holds(view, seat, claimant, role)
    if holds == 0:
        return CHALLENGE
    return CHALLENGE if rng.random() < (1 - holds) * stake else PASS


def _doubt_action(view, seat, rng):
    action = view["action"]
    kind = action["type"]
    mine = _mine(view, seat)
    on_me = action["target"] == seat
    if on_me and any(r in mine for r in BLOCKERS.get(kind, ())):
        return PASS  # it holds the blocker: cheaper to block in a moment
    if on_me and kind == "assassinate":
        stake = 0.9 if len(mine) == 1 else 0.4
    else:
        if on_me and kind == "steal":
            stake = 0.5 if view["players"][seat]["coins"] > 0 else 0.05
        elif kind == "tax":
            stake = 0.4 if view["players"][action["actor"]]["coins"] + 3 >= COUP_COST else 0.15
        elif kind == "exchange":
            stake = 0.05
        else:
            stake = 0.12
        if not on_me:
            stake /= _bystanders(view, seat)
        if len(mine) == 1:
            stake /= 2
    return _doubt(view, seat, action["actor"], action["claim"], stake, rng)


def _maybe_block(view, seat, rng):
    action = view["action"]
    kind = action["type"]
    blockers = BLOCKERS.get(kind, ())
    mine = _mine(view, seat)
    held = [r for r in blockers if r in mine]

    def block(role):
        return {"type": "block", "role": role}

    if kind == "foreignAid":
        urgent = view["players"][action["actor"]]["coins"] + 2 >= COUP_COST
        if held:
            return block(held[0]) if rng.random() < (0.8 if urgent else 0.45) else PASS
        if len(mine) > 1 and _unseen(view, seat, "duke") > 0 and rng.random() < 0.06:
            return block("duke")
        return PASS
    if kind == "steal":
        if view["players"][seat]["coins"] == 0:
            return PASS  # nothing to take
        if held:
            return block(held[0])
        bluff = max(blockers, key=lambda r: (_unseen(view, seat, r), rng.random()))
        if _unseen(view, seat, bluff) > 0 and rng.random() < (0.35 if len(mine) > 1 else 0.15):
            return block(bluff)
        return PASS
    if kind == "assassinate":
        if held or len(mine) == 1:
            return block("contessa")  # with one card, a bluff costs nothing
        if _unseen(view, seat, "contessa") > 0 and rng.random() < 0.25:
            return block("contessa")
        return PASS
    return PASS


def _doubt_block(view, seat, rng):
    action, blocked = view["action"], view["block"]
    if seat == action["actor"]:
        stake = {"assassinate": 0.6, "steal": 0.4}.get(action["type"], 0.3)
    else:
        stake = 0.15 / _bystanders(view, seat)
    if len(_mine(view, seat)) == 1:
        stake /= 2
    return _doubt(view, seat, blocked["seat"], blocked["role"], stake, rng)

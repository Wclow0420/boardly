"""How a bot plays Liar's Dice, from its own view of the game: its own
cup, the bids on the table and the votes. It never sees anyone else's
dice.

The bot weighs every bid by the chance the table holds it: the dice in
its own cup that count, plus the covered dice, each counting with a
chance of 1/3 when 1s are wild or 1/6 when they aren't (and a die for
every other player who has bid the face this round, since they likely
hold one). It raises with the likeliest legal bid, or calls the last
bid a lie when that is less likely to hold than its own raise would be.
What is legal comes from rules.py, under the table's way of calling
(几几几, classic or no zhai), so it never bids what the engine refuses.

It only answers when the game is waiting on it, so the driver
(app/bots.py) never loops on it:
- on its turn: shake a 散骰 again (at most twice a round), else bid,
  open (开) or now and then split (劈) a bid it is sure is false;
- when someone splits its bid: accept, or counter-split (反劈) when it
  is confident;
- endless games: vote to stop once, when it wants to (never taken back,
  so it can't flip back and forth).
"""

from functools import lru_cache
from math import comb

from app.games.liarsdice.rules import calling_of, face_rank, kinds, least_call

DICE_EACH = 5


def _mine(hand: list[int], face: int, zhai: bool) -> int:
    """Dice in this cup that count for the face (豹子 counts one extra)."""
    wild = not zhai and face != 1
    found = sum(1 for d in hand if d == face or (wild and d == 1))
    return found + 1 if found == len(hand) == DICE_EACH else found


@lru_cache(maxsize=4096)
def _at_least(n: int, p: float, k: int) -> float:
    """P(Binomial(n, p) >= k)."""
    if k <= 0:
        return 1.0
    if k > n:
        return 0.0
    return sum(comb(n, i) * p**i * (1 - p) ** (n - i) for i in range(k, n + 1))


def _chance(view: dict, seat: int, quantity: int, face: int, zhai: bool) -> float:
    """How likely the table holds `quantity` of `face`, as this seat sees it."""
    hand = view["myDice"]
    total = sum(view["diceCount"])
    covered = total - len(hand)
    # Others who bid this face this round probably hold one
    hinted = {b["seat"] for b in view["bids"] if b["face"] == face and b["seat"] != seat}
    hint = min(len(hinted), covered)
    p = 1 / 6 if zhai or face == 1 else 1 / 3
    return _at_least(covered - hint, p, quantity - _mine(hand, face, zhai) - hint)


def _smallest_bids(view: dict) -> list[tuple[int, int, bool]]:
    """For every face and kind (zhai or kaizhai), the smallest bid the
    engine accepts next, as (quantity, face, zhai). A bigger bid on the
    same face is only less likely, so these are the only ones worth
    weighing."""
    total = sum(view["diceCount"])
    active = sum(1 for count in view["diceCount"] if count)
    calling = calling_of(view)
    last = view["bid"]
    bids = []
    for face in range(1, 7):
        for zhai in kinds(calling, last, face):
            quantity = least_call(calling, active, last, face, zhai, total)
            if quantity is not None:
                bids.append((quantity, face, zhai))
    return bids


def _bid(quantity: int, face: int, zhai: bool) -> dict:
    return {"type": "bid", "quantity": quantity, "face": face, "zhai": zhai}


def wants_to_stop(view: dict, seat: int) -> bool:
    """Endless games: stop once well into the night and not behind, follow
    someone else's call to stop unless far behind, and always stop
    eventually. Decided from the view alone (no dice roll), so asking
    twice gives the same answer."""
    rounds = view["round"]
    cups = view["cups"]
    mine = cups[seat]
    average = sum(cups) / len(cups)
    others = any(s != seat for s in view["endVotes"])
    if rounds >= 30:
        return True
    if rounds >= 10 and mine <= average:
        return True
    return others and (rounds >= 12 or (rounds >= 3 and mine <= average + 2))


def _opening(view: dict, seat: int, rng) -> dict:
    bids = [(q, f, z, _chance(view, seat, q, f, z)) for q, f, z in _smallest_bids(view)]
    if calling_of(view) == "jijiji":
        # 几几几 opens one of three ways: a few 1s, a zhai face, or a
        # kaizhai face at FEI. Weigh each by how likely it holds, with a
        # little taste so the table isn't predictable.
        sure = [b for b in bids if b[3] >= 0.55]
        if sure:
            q, f, z, _ = max(sure, key=lambda b: b[3] + rng.uniform(0, 0.2))
            return _bid(q, f, z)
        q, f, z, _ = max(bids, key=lambda b: (b[3], -b[0]))
        return _bid(q, f, z)
    # Now and then open zhai (斋), when the cup suits it
    zhai_first = rng.random() < 0.25
    pools = [[b for b in bids if b[2] == zhai_first], [b for b in bids if b[2] != zhai_first]]
    for pool in pools:
        sure = [b for b in pool if b[3] >= 0.6]
        if sure:
            least = min(b[0] for b in sure)
            at = [b for b in sure if b[0] == least]
            top = max(b[3] for b in at)
            q, f, z, _ = rng.choice([b for b in at if b[3] >= top - 0.03])
            # Sometimes open a die higher, while it still looks good
            if rng.random() < 0.3 and q < sum(view["diceCount"]):
                if _chance(view, seat, q + 1, f, z) >= 0.55:
                    q += 1
            return _bid(q, f, z)
    q, f, z, _ = max(bids, key=lambda b: (b[3], -b[0]))
    return _bid(q, f, z)


def _raise_or_call(view: dict, seat: int, rng) -> dict:
    last = view["bid"]
    holds = _chance(view, seat, last["quantity"], last["face"], last["zhai"])
    raises = [(q, f, z, _chance(view, seat, q, f, z)) for q, f, z in _smallest_bids(view)]

    call = not raises
    if raises:
        # The likeliest raise, the smallest step among near-equals
        best = min(raises, key=lambda b: (-round(b[3], 2), b[0], face_rank(b[1])))
        # A bluff now and then: the smallest raise on another face
        if rng.random() < 0.12:
            least = min(b[0] for b in raises)
            bluffs = [b for b in raises if b[0] == least and b[3] >= 0.2]
            if bluffs:
                best = rng.choice(bluffs)
        # Call when the last bid is less likely to hold than my raise
        call = holds < (1 - best[3]) + rng.uniform(-0.05, 0.05)
    if call:
        # Split (劈, two cups) now and then when sure it's false
        if holds < 0.1 and rng.random() < 0.35:
            return {"type": "split", "bids": len(view["bids"])}
        return {"type": "challenge"}
    return _bid(*best[:3])


def liarsdice(view: dict, seat: int, rng) -> dict | None:
    if view["phase"] == "finished" or not 0 <= seat < view["numPlayers"]:
        return None
    if view["maxCups"] is not None and view["cups"][seat] >= view["maxCups"]:
        return None  # out of the game

    if view["mode"] == "endless" and seat not in view["endVotes"] and wants_to_stop(view, seat):
        return {"type": "end", "vote": True}

    bid = view["bid"]
    if view["phase"] == "split":
        if bid is None or bid["seat"] != seat:
            return None
        # Someone split my bid: counter (反劈) when it probably holds
        holds = _chance(view, seat, bid["quantity"], bid["face"], bid["zhai"])
        counter = holds >= 0.7 or (holds >= 0.45 and rng.random() < 0.25) or rng.random() < 0.05
        return {"type": "respond", "counter": counter}

    if view["phase"] != "bidding" or view["turn"] != seat:
        return None

    hand = view["myDice"]
    shaken = sum(1 for r in view["rerolls"] if r["seat"] == seat)
    if (
        len(hand) == DICE_EACH
        and len(set(hand)) == DICE_EACH
        and shaken < 2
        and not any(b["seat"] == seat for b in view["bids"])
    ):
        return {"type": "reroll"}

    if bid is None:
        return _opening(view, seat, rng)
    return _raise_or_call(view, seat, rng)

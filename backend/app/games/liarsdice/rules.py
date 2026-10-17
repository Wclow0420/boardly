"""Which calls are legal in Liar's Dice (大话骰), under each way of calling
the host may pick in the lobby (`calling`). Shared by the engine (game.py)
and the bots (bot.py), so the two can never disagree.

- jijiji (几几几, the South China / HK / Macau bar rule): three thresholds
  per number of players still in, ONE / ZHAI / FEI (`JIJIJI`). Below ONE
  nothing; from ONE to ZHAI-1 only 1s (always zhai); from ZHAI to FEI-1
  zhai only (any face, 1s included); from FEI up zhai or kaizhai freely,
  no doubling. Once a call goes kaizhai the round stays kaizhai: no zhai
  and no 1s. Every call raises the last by (dice, face rank).
- classic (经典): a zhai opening at least the players, a kaizhai opening
  one more; breaking zhai (开斋) needs double the dice; once kaizhai the
  round stays kaizhai.
- nozhai (不玩斋): 1s are always wild, every call is kaizhai, 1s can't be
  called; the opening at least players + 1; raises as usual.

Games saved before `calling` existed play classic.
"""

CALLINGS = ["jijiji", "classic", "nozhai"]

# (ONE, ZHAI, FEI) by the number of players still in. 2-4 are the owner's
# house rule; 5+ follow "fei at least 1.5x the players, rounded up".
JIJIJI = {
    2: (2, 3, 3),
    3: (3, 4, 5),
    4: (4, 5, 7),
    5: (5, 6, 8),
    6: (6, 7, 9),
    7: (7, 8, 11),
    8: (8, 9, 12),
    9: (9, 10, 14),
    10: (10, 11, 15),
}


def face_rank(face: int) -> int:
    """1 is the top face: 2 < 3 < 4 < 5 < 6 < 1."""
    return 7 if face == 1 else face


def calling_of(state: dict) -> str:
    """The way of calling a game (or a view) plays; classic for old games."""
    calling = state.get("calling")
    return calling if calling in CALLINGS else "classic"


def thresholds(players: int) -> tuple[int, int, int]:
    """几几几's (ONE, ZHAI, FEI) for this many players still in."""
    return JIJIJI[max(2, min(10, players))]


def bid_error(calling: str, players: int, last: dict | None, quantity: int, face: int, zhai: bool) -> str | None:
    """Why (quantity, face, zhai) can't be called after `last`, or None when
    it can. `zhai` is the call's kind as it will be stored (a call of 1s
    is always zhai, except under nozhai where 1s can't be called)."""
    kaizhai_round = last is not None and not last["zhai"]
    above = last is None or (quantity, face_rank(face)) > (last["quantity"], face_rank(last["face"]))

    if calling == "nozhai":
        if face == 1:
            return "1s are always wild here, so they can't be called"
        if zhai:
            return "This table doesn't play zhai"
        if last is None and quantity < players + 1:
            return f"Open with at least {players + 1} dice"
        return None if above else "Call higher than the last call"

    if zhai and kaizhai_round:
        return "This round is kaizhai, so no zhai and no 1s"
    if face == 1 and not zhai:
        return "1s are always zhai"

    if calling == "jijiji":
        one, least_zhai, fei = thresholds(players)
        if quantity < one:
            return f"Call at least {one} dice"
        if quantity < least_zhai and face != 1:
            return f"Under {least_zhai} dice only 1s may be called"
        if not zhai and quantity < fei:
            return f"Kaizhai needs at least {fei} dice"
        return None if above else "Call higher than the last call"

    # classic
    if last is None:
        least = players if zhai else players + 1
        return None if quantity >= least else f"Open with at least {least} dice"
    if last["zhai"] and not zhai:
        # Breaking the fast: 1s are wild again, at double the dice
        double = 2 * last["quantity"]
        return None if quantity >= double else f"Breaking zhai needs at least {double} dice"
    return None if above else "Call higher than the last call"


def least_call(calling: str, players: int, last: dict | None, face: int, zhai: bool, total: int) -> int | None:
    """The fewest dice of `face`, of this kind, that may be called next, or
    None if no count up to `total` can be. (Every rule set is monotone in
    the count: once a count is legal, every higher one is too.)"""
    for quantity in range(1, total + 1):
        if bid_error(calling, players, last, quantity, face, zhai) is None:
            return quantity
    return None


def kinds(calling: str, last: dict | None, face: int) -> tuple[bool, ...]:
    """The kinds a call on `face` may take next: (zhai,), (False,) or both."""
    if calling == "nozhai":
        return () if face == 1 else (False,)
    if face == 1:
        return () if last is not None and not last["zhai"] else (True,)
    if last is not None and not last["zhai"]:
        return (False,)
    return (False, True)

"""How a bot plays Seal the Manor, from its own view of the game.

Bots stay in reach of the mission room most nights, lock doors, track,
leave decoys, write letters and pray now and then; evil bots usually
fail missions and back teams with evil on them. Good enough to fill a
seat, not to win on purpose.
"""

LETTERS = [
    "I saw nobody suspicious tonight.",
    "Don't trust the last leader.",
    "The Prophet is closer than you think.",
    "Check who was really in the Hall.",
    "昨晚的失败牌不是我出的。",
    "我在书房什么都没看到。",
]


def _steps(view, start, goal):
    """Rooms between two rooms tonight (walls, doors and locks counted)."""
    def links(room):
        row, col = divmod(room, 3)
        out = {r * 3 + c for r, c in ((row - 1, col), (row + 1, col),
                                      (row, col - 1), (row, col + 1))
               if 0 <= r < 3 and 0 <= c < 3}
        out |= {b for a, b in view["doors"] if a == room}
        out |= {a for a, b in view["doors"] if b == room}
        if view["lockedDoor"] and room in view["lockedDoor"]:
            out -= set(view["lockedDoor"])
        return out - set(view["collapsed"])

    seen, frontier, dist = {start}, {start}, 0
    while frontier:
        if goal in frontier:
            return dist
        frontier = {n for r in frontier for n in links(r)} - seen
        seen |= frontier
        dist += 1
    return 99


def nightwatch(view, seat, rng):
    phase = view["phase"]
    n = view["numPlayers"]
    others = [s for s in range(n) if s != seat]
    role = view["myRole"]
    evil = role in ("double", "hermit", "possessed")
    known_evil = {k["seat"] for k in view["known"] if k["as"] == "evil"}
    if evil:
        known_evil.add(seat)

    if phase in ("announce", "patrol", "room") and view["ready"][seat]:
        return None
    if phase == "announce":
        move = {"type": "ready"}
        if view["doorOptions"] and rng.random() < 0.25:
            move["lock"] = rng.choice(view["doorOptions"])
        return move
    if phase == "patrol":
        rooms = view["patrolRooms"]
        if (role == "tracker" and view["abilityLeft"] > 0
                and view["event"] != "storm" and rng.random() < 0.3):
            return {"type": "patrol", "track": rng.choice(others)}
        # Like a sensible player: usually stay in reach of the mission
        reach = 1 if view["event"] == "fog" else 2
        near = [r for r in rooms
                if _steps(view, r, view["missionRoom"]) <= reach]
        room = rng.choice(near if near and rng.random() < 0.8 else rooms)
        move = {"type": "patrol", "room": room}
        fakes = [r for r in rooms if r != room]
        if role == "double" and view["abilityLeft"] > 0 and fakes \
                and rng.random() < 0.4:
            move["fake"] = rng.choice(fakes)
        return move
    if phase == "room":
        fn = view["myFn"]
        if fn == "study" and view["studyOptions"]:
            return {"type": "room", "target": rng.choice(view["studyOptions"])}
        if fn == "kitchen":
            return {"type": "room", "target": rng.choice(others)}
        if fn == "gallery" and rng.random() < 0.7:
            return {"type": "room", "letters": [rng.choice(LETTERS)]}
        if fn == "chapel" and rng.random() < 0.6:
            return {"type": "room", "pray": True}
        return {"type": "room"}
    if phase == "team" and view["leader"] == seat:
        size = view["missionSizes"][view["round"]]
        pool = [s for s in others if evil or s not in known_evil]
        if len(pool) < size - 1:
            pool = others
        return {"type": "propose",
                "team": sorted([seat] + rng.sample(pool, size - 1))}
    if phase == "vote" and not view["voted"][seat]:
        team = set(view["team"])
        if evil:
            approve = bool(team & known_evil) or rng.random() < 0.3
        else:
            approve = not (team & known_evil) and rng.random() < 0.75
        return {"type": "vote", "approve": approve}
    if phase == "mission" and seat in view["team"] \
            and seat not in view["missionPlayed"]:
        fail = evil and rng.random() < 0.7
        return {"type": "mission", "card": "fail" if fail else "success"}
    if phase == "assassinate" and view["assassinSeat"] == seat:
        evil_seats = set(view["evilSeats"] or [])
        return {"type": "assassinate",
                "target": rng.choice([s for s in range(n)
                                      if s not in evil_seats])}
    return None

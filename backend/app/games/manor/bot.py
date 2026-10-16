"""How a bot plays Midnight Manor, from its own view of the game.

The household: the Butler (who knows where the old man was) stays at
his side, guarding him when someone is near and taking him along when
alone; the Guard heads for where he is likely to be and shines the
flashlight on whoever is there; Guests fix cameras, watch the monitors,
take a weapon now and then so the intruders can't, and guard him when
they find him. At a meeting they accuse on their own evidence (the
flashlight, a search, footage of a room where he screamed, votes cast
against them); without it they all name whoever voted in a bloc at an
earlier meeting (so the household's votes can make a majority), or
abstain.

The intruders: fetch a weapon, then hunt the old man where he was last
seen, attacking when they find him (or leading him off to a quiet room
when someone else is there), lying low part of the time; they break
cameras and hide a weapon from a search once. They vote as one against whoever has been accusing
them, and at dawn the ringleader names whoever the footage showed at
the old man's side most.
"""

ROOMS = 9
SECURITY = 5
WEAPON_HOMES = {"knife": 3, "candlestick": 1, "poison": 6}
QUIET_ROOMS = (0, 6)  # no camera, out of the way
# How often an armed intruder goes where the old man most likely is
# (the rest of the time it lies low), by how many intruders there are;
# tuned so all-bot games come out roughly even
HUNT = {1: 0.6, 2: 0.5, 3: 0.35}


def _neighbors(room):
    row, col = divmod(room, 3)
    return [r * 3 + c for r, c in ((row - 1, col), (row + 1, col),
                                   (row, col - 1), (row, col + 1))
            if 0 <= r < 3 and 0 <= c < 3]


def _dist(a, b):
    return abs(a // 3 - b // 3) + abs(a % 3 - b % 3)


def _best(rng, options, score):
    """The highest-scoring option, ties broken at random."""
    top = max(score(o) for o in options)
    return rng.choice([o for o in options if score(o) == top])


# ------------------------------------------------- where is the old man?


def _owner_belief(view, upto):
    """How likely the old man is in each room during hour `upto`, from
    what this seat saw: its own rooms, footage, screams, and (Butler)
    where he was. He wanders one room at most an hour."""
    seen, absent = {-1: 2}, {}  # he starts the night in the Bedroom

    def saw(hour, room, there):
        if there:
            seen[hour] = room
        else:
            absent.setdefault(hour, set()).add(room)

    for entry in view["log"]:
        saw(entry["hour"], entry["room"], entry["owner"])
        for clip in entry.get("footage") or []:
            saw(entry["hour"], clip["room"], clip["owner"])
    for event in view["events"]:
        if event["kind"] == "scream":
            saw(event["hour"], event["room"], True)
    hour = view["hour"]
    if view["phase"] == "act" and view["myRoom"] is not None:
        saw(hour, view["myRoom"], view["ownerHere"])
    if view["ownerSeenAt"] is not None:
        # Butler: where he was when this hour began (or ended, at a meeting)
        saw(hour if view["phase"] == "gathering" else hour - 1,
            view["ownerSeenAt"], True)

    belief = [1.0 if r == 2 else 0.0 for r in range(ROOMS)]
    for h in range(0, upto + 1):
        step = [0.0] * ROOMS
        for r, p in enumerate(belief):
            if p:
                nxt = [r] + _neighbors(r)
                for to in nxt:
                    step[to] += p / len(nxt)
        belief = step
        if h in seen:
            belief = [1.0 if r == seen[h] else 0.0 for r in range(ROOMS)]
        for r in absent.get(h, ()):
            belief[r] = 0.0
        total = sum(belief)
        if total == 0:  # someone led him off: no idea any more
            belief = [0.0 if r in absent.get(h, ()) else 1.0
                      for r in range(ROOMS)]
            total = sum(belief)
        belief = [p / total for p in belief]
    return belief


# ---------------------------------------------------------- moving


def _open_rooms(view):
    here = view["myRoom"]
    if view["myRole"] == "intruder":
        rooms = list(range(ROOMS))
    else:
        rooms = [here] + _neighbors(here)
    if here == SECURITY:
        rooms = [r for r in rooms if r != SECURITY]
    return rooms


def _toward(rng, options, goal, belief=None):
    """The room among `options` closest to `goal`."""
    return _best(rng, options, lambda r: (-_dist(r, goal),
                                          belief[r] if belief else 0))


def _intruder_room(view, seat, rng, options):
    here = view["myRoom"]
    if view["followingMe"]:
        # He follows me this hour: somewhere quiet, with no camera
        return rng.choice(QUIET_ROOMS)
    if view["myItem"] is None:
        if view["roomItems"] and here in options:
            return here
        # Weapons not yet missing from where they lie; each intruder
        # heads for a different one first
        gone = set()
        for entry in view["log"]:
            act = entry["action"]
            for item, home in WEAPON_HOMES.items():
                if entry["room"] == home and (
                        act.get("action") != "take" or act.get("item") != item
                        or entry.get("took") is None):
                    gone.add(item)
        left = [i for i in WEAPON_HOMES if i not in gone]
        if left:
            mine = view["intruders"].index(seat)
            return WEAPON_HOMES[left[mine % len(left)]]
    hunt = HUNT[min(len(view["intruders"]), 3)]
    roll = rng.random()
    if roll < hunt:
        belief = _owner_belief(view, view["hour"])
        return _best(rng, options, lambda r: belief[r])
    # Lie low for an hour: the monitors (where he is, who's with him),
    # or a camera to break
    if here != SECURITY and roll < (1 + hunt) / 2:
        return SECURITY
    working = [r for r in options if view["cameras"][r]]
    return rng.choice(working or options)


def _butler_room(view, rng, options):
    here = view["myRoom"]
    if view["followingMe"]:
        return here if here in options else rng.choice(options)
    if rng.random() < 0.05:
        return rng.choice(options)  # don't make it too plain who knows
    owner = view["ownerSeenAt"]
    if owner in options:
        return owner
    near = [r for r in options if r in _neighbors(owner)]
    return rng.choice(near) if near else _toward(rng, options, owner)


def _household_room(view, rng, options):
    here = view["myRoom"]
    guest = view["myRole"] == "guest"
    if view["followingMe"]:
        return here if here in options else rng.choice(options)
    belief = _owner_belief(view, view["hour"])
    goal = _best(rng, range(ROOMS), lambda r: belief[r])
    if belief[goal] >= 0.3 and rng.random() < 0.7:
        # He was just heard or seen nearby: go and stand by him
        return _toward(rng, options, goal, belief)
    cameras = view["cameras"]
    broken = [r for r in options if cameras[r] is False]
    if broken and rng.random() < (0.5 if guest else 0.2):
        return rng.choice(broken)
    if SECURITY in options and any(cameras) and \
            rng.random() < (0.4 if guest else 0.15):
        return SECURITY
    if rng.random() < 0.15:
        return rng.choice(options)
    return _toward(rng, options, goal, belief)


def _move(view, seat, rng):
    options = _open_rooms(view)
    role = view["myRole"]
    if role == "intruder":
        room = _intruder_room(view, seat, rng, options)
    elif role == "butler":
        room = _butler_room(view, rng, options)
    else:
        room = _household_room(view, rng, options)
    return {"type": "move", "room": room if room in options
            else rng.choice(options)}


# ---------------------------------------------------------- acting


def _intruder_act(view, rng):
    item = view["myItem"]
    company = view["someoneHere"]
    camera = view["cameras"][view["myRoom"]]
    if view["ownerHere"] and item:
        # Alone with him: strike. With company: usually strike anyway,
        # or lead him off to be alone with him next hour
        move = {"action": "attack" if not company or rng.random() < 0.7
                else "escort"}
    elif not item and view["roomItems"]:
        move = {"action": "take", "item": view["roomItems"][0]}
    elif view["ownerHere"]:
        move = {"action": "escort"}
    elif camera is True and rng.random() < 0.8:
        move = {"action": "break"}
    elif view["myRoom"] == SECURITY:
        move = {"action": "watch"}
    else:
        move = {"action": "wait"}
    if item and company and not view["hideUsed"] and rng.random() < 0.5:
        move["hide"] = True
    return move


def _household_act(view, rng):
    role = view["myRole"]
    company = view["someoneHere"]
    here = view["myRoom"]
    if view["ownerHere"]:
        if not company:
            # Nobody to fear here: keep him close
            if role == "butler" or rng.random() < 0.4:
                return {"action": "escort"}
            return {"action": "guard"}
        if role == "guard" and rng.random() < 0.25:
            return {"action": "flashlight"}
        return {"action": "guard"}
    if here == SECURITY:
        return {"action": "watch"}
    if view["cameras"][here] is False:
        return {"action": "fix"}
    if company and role == "guard":
        return {"action": "flashlight" if rng.random() < 0.65 else "search"}
    if (role == "guest" and view["roomItems"] and view["myItem"] is None
            and rng.random() < 0.35):
        # One weapon the intruders can't have
        return {"action": "take", "item": view["roomItems"][0]}
    if company and rng.random() < 0.25:
        return {"action": "search"}
    return {"action": "wait"}


def _act(view, rng):
    if view["myRole"] == "intruder":
        move = _intruder_act(view, rng)
    else:
        move = _household_act(view, rng)
    return {"type": "act", **move}


# ------------------------------------------------- meetings and dawn


def _screams(view):
    return {(e["hour"], e["room"]) for e in view["events"]
            if e["kind"] == "scream"}


def suspicion(view, seat):
    """How guilty each other seat looks to this (household) seat."""
    score = [0.0] * view["numPlayers"]
    screams = _screams(view)
    for entry in view["log"]:
        for o in entry.get("seen") or []:
            if o["action"] in ("attack", "break"):
                score[o["seat"]] += 10
            elif o["action"] == "take":
                score[o["seat"]] += 1.5
        found = entry.get("search")
        if found and "target" in found:
            score[found["target"]] += 3 if found["item"] else -0.5
        for clip in entry.get("footage") or []:
            if (entry["hour"], clip["room"]) in screams:
                there = [s for s in clip["seats"] if s != seat]
                for s in there:
                    score[s] += 6 / len(there)
    for event in view["events"]:
        if event["kind"] == "gathering":
            for voter, target in enumerate(event["votes"]):
                if target == seat:
                    score[voter] += 1.5  # they tried to lock me up
    return score


def in_step(view):
    """Seats that voted in a bloc (two or more naming the same person) at
    earlier meetings, as anyone at the table saw it."""
    together = [0] * view["numPlayers"]
    for event in view["events"]:
        if event["kind"] != "gathering":
            continue
        votes = event["votes"]
        for voter, target in enumerate(votes):
            if target is not None and votes.count(target) >= 2:
                together[voter] += 1
    return together


def _accuse(view, seat, rng):
    n = view["numPlayers"]
    locked = set(view["locked"])
    suspects = [s for s in range(n) if s != seat and s not in locked]
    if not suspects:
        return None
    if view["myRole"] == "intruder":
        return _intruder_vote(view, seat, rng, suspects)
    score = suspicion(view, seat)
    target = _best(rng, suspects, lambda s: score[s])
    if score[target] >= 6:
        return target  # caught in the act: no doubt
    # Otherwise go with what the whole table saw, so the household's
    # votes land on the same seat
    together = in_step(view)
    shared = min(suspects, key=lambda s: (-together[s], s))
    if together[shared] >= 1 and score[shared] > -1:
        return shared
    if score[target] >= 3 or (score[target] >= 1 and rng.random() < 0.4):
        return target
    return None


def _intruder_vote(view, seat, rng, suspects):
    """All intruders pick the same target from what everyone saw: whoever
    voted against them most; a quiet meeting goes by without a vote."""
    intruders = set(view["intruders"])
    targets = [s for s in suspects if s not in intruders]
    if not targets:
        return None
    threat = [0] * view["numPlayers"]
    for event in view["events"]:
        if event["kind"] == "gathering":
            for voter, target in enumerate(event["votes"]):
                if target in intruders:
                    threat[voter] += 1
    hour = view["hour"]
    target = min(targets, key=lambda s: (-threat[s], (s * 5 + hour) % 7, s))
    if threat[target] == 0 and not _screams(view):
        return None if rng.random() < 0.6 else target
    return None if rng.random() < 0.15 else target


def _guess(view, seat, rng):
    """The ringleader names whoever was seen at the old man's side."""
    intruders = set(view["intruders"])
    options = [s for s in range(view["numPlayers"]) if s not in intruders]
    score = [0.0] * view["numPlayers"]
    for entry in view["log"]:
        for clip in entry.get("footage") or []:
            if clip["owner"]:
                for s in clip["seats"]:
                    score[s] += 2
                    if clip["ownerEntered"] and s in clip["entered"]:
                        score[s] += 2  # came in with him: led him there
    return {"type": "guess", "target": _best(rng, options, lambda s: score[s])}


def manor(view, seat, rng):
    phase = view["phase"]
    if phase == "guess":
        return _guess(view, seat, rng) if view["ringleader"] == seat else None
    if phase not in ("move", "act", "gathering"):
        return None
    if view["myRoom"] is None or view["ready"][seat]:
        return None  # locked up, or already chose this phase
    if phase == "move":
        return _move(view, seat, rng)
    if phase == "act":
        return _act(view, rng)
    return {"type": "accuse", "target": _accuse(view, seat, rng)}

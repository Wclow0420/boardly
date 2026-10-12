"""Seal the Manor (守夜) engine — hidden roles, a secret map, five nights.

The manor is haunted. The watchers must light the seal lamp on five
nights to lock the ghosts away, but some of them are possessed and
quietly make the seal fail. It plays like Double Agent (teams, public
votes, secret success / fail cards) on a 3x3 house: where you stand
decides whether you can be sent on the mission and what you can learn.

House (room index):
  0 Bell Tower  1 Study  2 Chapel
  3 Gallery     4 Hall   5 Dining Room
  6 Cellar      7 Kitchen 8 Garden

Each round (one night):
  announce  everyone reads the night's mission room, team size, the
            next night's room and the night event, then taps ready. The
            Keeper's ready may lock one door for the night — only the
            door is announced, never who locked it.
  patrol    everyone secretly stays or walks one room (the Tracker may
            follow someone instead; the Double may leave a decoy).
  room      everyone sees who shares their room and uses its function.
  team      the leader names a team (anonymous letters are shown first).
  vote      everyone approves or rejects, in public.
  mission   the team walks to the mission room (two steps at most); if
            anyone can't make it the mission fails outright. Otherwise
            each plays success or fail in secret.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 6,
  "roles": ["prophet", "double", ...],     # by seat
  "phase": "announce" | "patrol" | "room" | "team" | "vote" | "mission"
           | "assassinate" | "finished",
  "round": 0,                              # 0-4
  "missionRooms": [1, 8],                  # drawn so far, by round
  "eventDeck": ["fog", ...],               # night events still face down
  "nightEvents": [None, "storm"],          # by round (none on night 1)
  "collapsed": [5],                        # rooms sealed for good
  "doors": [[0, 4]],                       # secret doors (diagonals)
  "lockedDoor": None | [3, 4],             # the Keeper's lock tonight
  "positions": [4, 4, ...],                # real room by seat
  "fakes": [None, 2, ...],                 # a Double's decoy tonight
  "abilityLeft": [0, 2, ...],              # Tracker / Double / Keeper uses
  "freeMove": [False, ...],                # Cellar passage: any room
  "lastUsed": [None, 7, ...],              # room function used last night
  "used": [None, ...],                     # ... and tonight
  "fn": [None, "kitchen", ...],            # room function open tonight
  "orders": [None, {...}, ...],            # announce / patrol / room
  "prayed": [False, ...],
  "chapelSpent": False,                    # the one successful prayer
  "leader": 2, "nextLeader": 3, "bellLeader": None,
  "rejections": 0,
  "team": [0, 2],
  "votes": [True, None, ...],
  "cards": [None, "success", ...],
  "cardHistory": [[None, "fail", ...]],    # by round, for the Study
  "results": [{"round": 0, "room": 1, "team": [..], "missing": [],
               "fails": 0, "success": True}],
  "history": [{"round": 0, "leader": 2, "bell": False, "team": [..],
               "votes": [...], "approved": True}],
  "timeline": [{"round": 1, "kind": "night", "event": "collapse"}, ...],
  "logs": [[...], ...],                    # private notes by seat
  "assassinTarget": None,
  "winner": None | "good" | "evil",
  "winReason": None | "missions" | "assassination" | "failedMissions"
               | "rejections" | "abandoned"
}

Moves:
  {"type": "ready", "lock"?: [a, b]}                   phase "announce"
  {"type": "patrol", "room": r, "fake"?: f}            phase "patrol"
  {"type": "patrol", "track": seat}                    phase "patrol"
  {"type": "room", "target"?: seat, "letters"?: [..], "pray"?: bool}
                                                       phase "room"
  {"type": "propose", "team": [seats]}                 leader, "team"
  {"type": "vote", "approve": bool}                    everyone, "vote"
  {"type": "mission", "card": "success" | "fail"}      team, "mission"
  {"type": "assassinate", "target": seat}              the assassin
"""

import random

from app.games.base import BaseGame, GameError

ROOMS = [
    "belltower", "study", "chapel",
    "gallery", "hall", "dining",
    "cellar", "kitchen", "garden",
]
BELLTOWER, STUDY, CHAPEL, GALLERY, HALL, DINING, CELLAR, KITCHEN, GARDEN = range(9)

GOOD_ROLES = ("prophet", "apprentice", "tracker", "keeper", "watcher")
EVIL_ROLES = ("double", "hermit", "possessed")

ROLE_SETS = {
    5: ["prophet", "apprentice", "tracker", "double", "hermit"],
    6: ["prophet", "apprentice", "tracker", "keeper", "double", "hermit"],
    7: ["prophet", "apprentice", "tracker", "keeper",
        "double", "hermit", "possessed"],
    8: ["prophet", "apprentice", "tracker", "keeper", "watcher",
        "double", "hermit", "possessed"],
    9: ["prophet", "apprentice", "tracker", "keeper", "watcher", "watcher",
        "double", "hermit", "possessed"],
    10: ["prophet", "apprentice", "tracker", "keeper", "watcher", "watcher",
         "double", "hermit", "possessed", "possessed"],
}

# Team size for each of the five missions
MISSION_SIZES = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
}

# Uses per game of each role's ability
ABILITY_USES = {"tracker": 2, "double": 2, "keeper": 1}

EVENTS = (
    "blackout", "collapse", "secretDoor", "storm",
    "insomnia", "echo", "fog", "calm",
)

ROUNDS = 5
MISSIONS_TO_WIN = 3
MAX_REJECTIONS = 5
LETTER_MAX = 120

# Rooms whose function needs a choice in the room phase
CHOICE_ROOMS = ("study", "kitchen", "gallery", "chapel")


def is_evil(role: str) -> bool:
    return role in EVIL_ROLES


def fails_required(num_players: int, round_: int) -> int:
    """Fail cards needed to fail a mission: two on the 4th with 7+."""
    return 2 if num_players >= 7 and round_ == 3 else 1


def neighbors(room: int) -> list[int]:
    """Rooms one step up/down/left/right on the 3x3 floor plan."""
    row, col = divmod(room, 3)
    out = []
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        r, c = row + dr, col + dc
        if 0 <= r < 3 and 0 <= c < 3:
            out.append(r * 3 + c)
    return out


def diagonals() -> list[list[int]]:
    """Every pair of diagonally touching rooms (secret door spots)."""
    pairs = []
    for a in range(9):
        row, col = divmod(a, 3)
        for dc in (-1, 1):
            r, c = row + 1, col + dc
            if 0 <= r < 3 and 0 <= c < 3:
                pairs.append(sorted([a, r * 3 + c]))
    return pairs


def links(collapsed, doors, locked=None) -> dict[int, set[int]]:
    """The house as a graph: walls, secret doors, sealed rooms and
    tonight's locked door all taken into account."""
    adj = {r: set(neighbors(r)) for r in range(9)}
    for a, b in doors:
        adj[a].add(b)
        adj[b].add(a)
    if locked:
        a, b = locked
        adj[a].discard(b)
        adj[b].discard(a)
    for c in collapsed:
        adj[c] = set()
        for r in adj:
            adj[r].discard(c)
    return adj


def within(adj, start: int, steps: int) -> set[int]:
    """Rooms reachable from `start` in at most `steps` steps."""
    seen = {start}
    frontier = {start}
    for _ in range(steps):
        frontier = {n for r in frontier for n in adj[r]} - seen
        seen |= frontier
    return seen


def assassin_seat(roles) -> int:
    """The evil player in the lowest seat names the Prophet."""
    return next(s for s, role in enumerate(roles) if is_evil(role))


class Nightwatch(BaseGame):
    key = "nightwatch"
    name = "Seal the Manor"
    min_players = 5
    max_players = 10
    coins_win = 25
    coins_play = 8
    emoji = "🏮"
    tile_color = "#F7E6D5"
    category = "party"
    tag = "party"

    def __init__(self, rng: random.Random | None = None):
        # Room draws, night events and the first leader; tests pass a
        # seeded one
        self.rng = rng or random.SystemRandom()

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if num_players not in ROLE_SETS:
            raise GameError("This game needs 5 to 10 players")
        rng = rng or self.rng
        roles = list(ROLE_SETS[num_players])
        rng.shuffle(roles)
        deck = list(EVENTS)
        rng.shuffle(deck)
        first = self._draw_room(rng, [], None)
        n = num_players
        leader = rng.randrange(n)
        return {
            "numPlayers": n,
            "roles": roles,
            "phase": "announce",
            "round": 0,
            "missionRooms": [first, self._draw_room(rng, [], first)],
            "eventDeck": deck,
            "nightEvents": [None],
            "collapsed": [],
            "doors": [],
            "lockedDoor": None,
            "positions": [HALL] * n,
            "fakes": [None] * n,
            "abilityLeft": [ABILITY_USES.get(role, 0) for role in roles],
            "freeMove": [False] * n,
            "lastUsed": [None] * n,
            "used": [None] * n,
            "fn": [None] * n,
            "orders": [None] * n,
            "prayed": [False] * n,
            "chapelSpent": False,
            "leader": None,
            "nextLeader": leader,
            "bellLeader": None,
            "rejections": 0,
            "team": [],
            "votes": [None] * n,
            "cards": [None] * n,
            "cardHistory": [],
            "results": [],
            "history": [],
            "timeline": [],
            "logs": [[] for _ in range(n)],
            "assassinTarget": None,
            "winner": None,
            "winReason": None,
        }

    @staticmethod
    def _draw_room(rng, collapsed, previous):
        """A mission room: never the Hall, a sealed room, or last
        night's room again."""
        options = [
            r for r in range(9)
            if r != HALL and r not in collapsed and r != previous
        ]
        return rng.choice(options)

    # ------------------------------------------------------------ helpers

    @staticmethod
    def event(state):
        return state["nightEvents"][state["round"]]

    @staticmethod
    def mission_room(state):
        return state["missionRooms"][state["round"]]

    @staticmethod
    def graph(state):
        return links(state["collapsed"], state["doors"], state["lockedDoor"])

    def patrol_rooms(self, state, seat) -> list[int]:
        """Where this seat may stand after tonight's patrol."""
        here = state["positions"][seat]
        if self.event(state) == "storm":
            return [here]
        if state["freeMove"][seat]:
            # The Cellar's passage: any open room
            return [r for r in range(9) if r not in state["collapsed"]]
        steps = 2 if self.event(state) == "insomnia" else 1
        return sorted(within(self.graph(state), here, steps))

    @staticmethod
    def door_options(state) -> list[list[int]]:
        """Doors the Keeper may lock: every open link between rooms."""
        adj = links(state["collapsed"], state["doors"])
        return [[a, b] for a in range(9) for b in sorted(adj[a]) if a < b]

    def _can_reach(self, state, seat) -> bool:
        """Whether a team member makes it to the mission room."""
        if state["used"][seat] == CELLAR:
            return True  # the Cellar's passage: any distance
        steps = 1 if self.event(state) == "fog" else 2
        reach = within(self.graph(state), state["positions"][seat], steps)
        return self.mission_room(state) in reach

    # ------------------------------------------------------------ moves

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")
        if not 0 <= seat < state["numPlayers"]:
            raise GameError("You are not playing")

        handlers = {
            "ready": self._ready,
            "patrol": self._patrol,
            "room": self._room,
            "propose": self._propose,
            "vote": self._vote,
            "mission": self._mission,
            "assassinate": self._assassinate,
        }
        handler = handlers.get(move.get("type"))
        if handler is None:
            raise GameError("Unknown move type")
        return handler(state, seat, move)

    def _submit(self, state, seat, order):
        if state["orders"][seat] is not None:
            raise GameError("You already chose")
        orders = list(state["orders"])
        orders[seat] = order
        return {**state, "orders": orders}

    @staticmethod
    def _all_in(state) -> bool:
        return all(o is not None for o in state["orders"])

    # --- announcement (and the Keeper's lock)

    def _ready(self, state, seat, move):
        if state["phase"] != "announce":
            raise GameError("Not reading the announcement right now")
        order = {}
        lock = move.get("lock")
        if lock is not None:
            if state["roles"][seat] != "keeper":
                raise GameError("Only the Keeper locks doors")
            if state["abilityLeft"][seat] <= 0:
                raise GameError("You already locked a door this game")
            if (
                not isinstance(lock, list)
                or not all(type(r) is int for r in lock)
                or sorted(lock) not in self.door_options(state)
            ):
                raise GameError("Pick a door between two open rooms")
            order["lock"] = sorted(lock)
        state = self._submit(state, seat, order)
        if not self._all_in(state):
            return state

        n = state["numPlayers"]
        locked = None
        ability = list(state["abilityLeft"])
        timeline = list(state["timeline"])
        for s, o in enumerate(state["orders"]):
            if o.get("lock"):
                locked = o["lock"]
                ability[s] -= 1
        if locked:
            timeline.append({"round": state["round"], "kind": "lock",
                             "rooms": locked})
        return {
            **state,
            "phase": "patrol",
            "lockedDoor": locked,
            "abilityLeft": ability,
            "timeline": timeline,
            "orders": [None] * n,
        }

    # --- patrol

    def _patrol(self, state, seat, move):
        if state["phase"] != "patrol":
            raise GameError("Not patrolling right now")
        role = state["roles"][seat]
        rooms = self.patrol_rooms(state, seat)
        n = state["numPlayers"]

        if move.get("track") is not None:
            target = move["track"]
            if role != "tracker":
                raise GameError("Only the Tracker follows people")
            if state["abilityLeft"][seat] <= 0:
                raise GameError("You have no tracking left")
            if self.event(state) == "storm":
                raise GameError("Nobody can move in the storm")
            if type(target) is not int or not 0 <= target < n or target == seat:
                raise GameError("Pick someone else to follow")
            order = {"track": target}
        else:
            room = move.get("room")
            if type(room) is not int or room not in rooms:
                raise GameError("You can't get there tonight")
            order = {"room": room}
            fake = move.get("fake")
            if fake is not None:
                if role != "double":
                    raise GameError("Only the Double leaves a decoy")
                if state["abilityLeft"][seat] <= 0:
                    raise GameError("You have no decoys left")
                if type(fake) is not int or fake not in rooms or fake == room:
                    raise GameError("Your decoy must stand in another room "
                                    "you could reach")
                order["fake"] = fake

        state = self._submit(state, seat, order)
        if not self._all_in(state):
            return state
        return self._resolve_patrol(state)

    def _resolve_patrol(self, state):
        n = state["numPlayers"]
        r = state["round"]
        roles = state["roles"]
        orders = state["orders"]
        mission_room = self.mission_room(state)
        blackout = self.event(state) == "blackout"

        positions = list(state["positions"])
        fakes = [None] * n
        ability = list(state["abilityLeft"])
        for s, o in enumerate(orders):
            if "room" in o:
                positions[s] = o["room"]
            if o.get("fake") is not None:
                fakes[s] = o["fake"]
                ability[s] -= 1
        tracked = {}
        for s, o in enumerate(orders):
            if "track" in o:
                # Straight to wherever they really ended up
                positions[s] = positions[o["track"]]
                tracked[s] = o["track"]
                ability[s] -= 1

        logs = [list(log) for log in state["logs"]]
        fn = [None] * n
        counts = [0] * 9
        for p in positions:
            counts[p] += 1

        for s in range(n):
            here = positions[s]
            others = [
                o for o in range(n)
                if o != s and positions[o] == here and fakes[o] is None
            ]
            if fakes[s] is not None:
                # The hidden Double sees everyone in the room
                visible = others
            else:
                decoys = [o for o in range(n) if o != s and fakes[o] == here]
                visible = others + decoys
            alone = not visible

            blocked = None
            if here == HALL:
                blocked = "hall"
            elif here == mission_room:
                blocked = "mission"
            elif here == state["lastUsed"][s]:
                blocked = "repeat"

            note = {
                "room": here,
                "seen": None if blackout else sorted(visible),
                "company": bool(visible),
                "fake": fakes[s],
                "tracked": tracked.get(s),
                "blocked": blocked,
            }
            logs[s].append({"round": r, "kind": "patrol", **note})
            if blocked:
                continue

            name = ROOMS[here]
            if name in ("belltower", "study") and not alone:
                continue
            if name == "study" and not (
                state["cardHistory"] and state["cardHistory"][-1]
            ):
                continue  # no cards from last night to read about
            if name == "dining":
                if fakes[s] is not None or len(visible) != 1:
                    continue
                partner = visible[0]
                # A decoy passes for one of the watchers
                camp = (
                    "good" if fakes[partner] is not None
                    else "evil" if is_evil(roles[partner]) else "good"
                )
                logs[s].append({"round": r, "kind": "dining",
                                "seat": None if blackout else partner,
                                "camp": camp})
            elif name == "garden":
                logs[s].append({"round": r, "kind": "garden",
                                "counts": counts})
            elif name == "cellar":
                logs[s].append({"round": r, "kind": "cellar"})
            fn[s] = name

        bell = next((s for s in range(n) if fn[s] == "belltower"), None)
        if bell is not None:
            logs[bell].append({"round": r, "kind": "bell"})

        # Functions that work on their own are used right away
        used = [
            positions[s] if fn[s] in ("belltower", "dining", "garden", "cellar")
            else None
            for s in range(n)
        ]
        return {
            **state,
            "phase": "room",
            "positions": positions,
            "fakes": fakes,
            "abilityLeft": ability,
            "freeMove": [False] * n,
            "fn": fn,
            "used": used,
            "bellLeader": bell,
            "logs": logs,
            "orders": [None] * n,
        }

    # --- room functions

    def _room(self, state, seat, move):
        if state["phase"] != "room":
            raise GameError("Not using rooms right now")
        n = state["numPlayers"]
        fn = state["fn"][seat]
        order = {}
        target = move.get("target")
        letters = move.get("letters")
        pray = move.get("pray")

        if target is not None:
            if fn not in ("study", "kitchen"):
                raise GameError("Your room has nobody to look into")
            if type(target) is not int or not 0 <= target < n or target == seat:
                raise GameError("Pick someone else")
            if fn == "study":
                last = state["results"][-1]
                if target not in last["team"] or last["fails"] is None:
                    raise GameError("Pick someone who played on last night's "
                                    "mission")
            order["target"] = target
        if letters:
            if fn != "gallery":
                raise GameError("Letters are written in the Gallery")
            limit = 2 if self.event(state) == "echo" else 1
            if (
                not isinstance(letters, list)
                or len(letters) > limit
                or not all(isinstance(t, str) for t in letters)
            ):
                raise GameError(f"Write up to {limit} letter(s)")
            texts = [" ".join(t.split())[:LETTER_MAX] for t in letters]
            texts = [t for t in texts if t]
            if texts:
                order["letters"] = texts
        if pray:
            if fn != "chapel":
                raise GameError("Prayers are said in the Chapel")
            order["pray"] = True

        state = self._submit(state, seat, order)
        if not self._all_in(state):
            return state
        return self._resolve_room(state)

    def _resolve_room(self, state):
        n = state["numPlayers"]
        r = state["round"]
        positions = state["positions"]
        fakes = state["fakes"]
        logs = [list(log) for log in state["logs"]]
        used = list(state["used"])
        prayed = [False] * n
        letters = []

        for s, o in enumerate(state["orders"]):
            fn = state["fn"][s]
            if fn == "study" and "target" in o:
                t = o["target"]
                logs[s].append({"round": r, "kind": "study", "seat": t,
                                "card": state["cardHistory"][-1][t]})
            elif fn == "kitchen" and "target" in o:
                t = o["target"]
                # A Double's decoy fools the eavesdropper
                room = fakes[t] if fakes[t] is not None else positions[t]
                logs[s].append({"round": r, "kind": "kitchen", "seat": t,
                                "room": room})
            elif fn == "gallery" and o.get("letters"):
                letters.extend(o["letters"])
                logs[s].append({"round": r, "kind": "letter",
                                "texts": o["letters"]})
            elif fn == "chapel" and o.get("pray"):
                prayed[s] = True
                logs[s].append({"round": r, "kind": "pray"})
            else:
                continue
            used[s] = positions[s]

        timeline = list(state["timeline"])
        if letters:
            # Shuffled, so the order gives nobody away
            self.rng.shuffle(letters)
            timeline.append({"round": r, "kind": "letters", "texts": letters})

        bell = state["bellLeader"]
        if bell is not None and bell != state["nextLeader"]:
            # The Bell Tower cuts in; the order then carries on as before
            leader, next_leader = bell, state["nextLeader"]
        else:
            leader = state["nextLeader"]
            next_leader = (leader + 1) % n
        return {
            **state,
            "phase": "team",
            "used": used,
            "prayed": prayed,
            "logs": logs,
            "timeline": timeline,
            "leader": leader,
            "nextLeader": next_leader,
            "team": [],
            "orders": [None] * n,
        }

    # --- team and vote

    def _propose(self, state, seat, move):
        if state["phase"] != "team":
            raise GameError("Not choosing a team right now")
        if seat != state["leader"]:
            raise GameError("Only the leader picks the team")
        n = state["numPlayers"]
        team = move.get("team")
        size = MISSION_SIZES[n][state["round"]]
        if (
            not isinstance(team, list)
            or len(team) != size
            or not all(type(s) is int and 0 <= s < n for s in team)
            or len(set(team)) != size
        ):
            raise GameError(f"Pick exactly {size} different players")
        return {**state, "phase": "vote", "team": sorted(team),
                "votes": [None] * n}

    def _vote(self, state, seat, move):
        if state["phase"] != "vote":
            raise GameError("Not voting right now")
        if state["votes"][seat] is not None:
            raise GameError("You already voted")
        approve = move.get("approve")
        if not isinstance(approve, bool):
            raise GameError("Vote must be approve: true or false")
        votes = list(state["votes"])
        votes[seat] = approve
        if any(v is None for v in votes):
            return {**state, "votes": votes}

        n = state["numPlayers"]
        approved = sum(votes) * 2 > n  # more than half
        history = state["history"] + [{
            "round": state["round"],
            "leader": state["leader"],
            "bell": state["leader"] == state["bellLeader"],
            "team": state["team"],
            "votes": votes,
            "approved": approved,
        }]
        state = {**state, "votes": votes, "history": history,
                 "bellLeader": None}
        if approved:
            return self._depart(state)

        rejections = state["rejections"] + 1
        if rejections >= MAX_REJECTIONS:
            return self._finish({**state, "rejections": rejections},
                                "evil", "rejections")
        leader = state["nextLeader"]
        return {
            **state,
            "phase": "team",
            "rejections": rejections,
            "leader": leader,
            "nextLeader": (leader + 1) % n,
            "team": [],
        }

    # --- mission

    def _depart(self, state):
        """The team walks to the mission room; the others stay put."""
        n = state["numPlayers"]
        room = self.mission_room(state)
        team = state["team"]
        missing = [s for s in team if not self._can_reach(state, s)]
        positions = list(state["positions"])
        for s in team:
            if s not in missing:
                positions[s] = room
        # The Cellar's passage, unused by a team member, opens tomorrow
        free = [
            state["used"][s] == CELLAR and s not in team for s in range(n)
        ]
        state = {**state, "positions": positions, "freeMove": free,
                 "cards": [None] * n}
        if missing:
            # No cards are played: tomorrow's Study has nothing to read
            state = {**state, "cardHistory": state["cardHistory"] + [None]}
            # Somebody never showed up: the mission fails outright
            return self._settle(state, {
                "round": state["round"],
                "room": room,
                "team": team,
                "missing": missing,
                "fails": None,
                "success": False,
            }, None)
        return {**state, "phase": "mission"}

    def _mission(self, state, seat, move):
        if state["phase"] != "mission":
            raise GameError("No mission in progress")
        if seat not in state["team"]:
            raise GameError("You are not on this mission")
        if state["cards"][seat] is not None:
            raise GameError("You already played your card")
        card = move.get("card")
        if card not in ("success", "fail"):
            raise GameError("Card must be success or fail")
        if card == "fail" and not is_evil(state["roles"][seat]):
            raise GameError("Watchers can only play Success")
        cards = list(state["cards"])
        cards[seat] = card
        if any(cards[s] is None for s in state["team"]):
            return {**state, "cards": cards}

        fails = sum(1 for s in state["team"] if cards[s] == "fail")
        cancelled = False
        if any(state["prayed"]) and fails and not state["chapelSpent"]:
            # The Chapel's one answered prayer takes back a fail card
            fails -= 1
            cancelled = True
        n = state["numPlayers"]
        result = {
            "round": state["round"],
            "room": self.mission_room(state),
            "team": state["team"],
            "missing": [],
            "fails": fails,
            "success": fails < fails_required(n, state["round"]),
        }
        state = {
            **state,
            "cards": [None] * n,
            "cardHistory": state["cardHistory"] + [cards],
            "chapelSpent": state["chapelSpent"] or cancelled,
        }
        return self._settle(state, result, cancelled)

    def _settle(self, state, result, cancelled):
        n = state["numPlayers"]
        r = state["round"]
        logs = [list(log) for log in state["logs"]]
        if any(state["prayed"]):
            # Only those who were in the Chapel tonight learn the answer
            outcome = (
                "noCards" if cancelled is None
                else "cancelled" if cancelled else "none"
            )
            for s in range(n):
                if self._patrol_room(state, s) == CHAPEL:
                    logs[s].append({"round": r, "kind": "prayer",
                                    "result": outcome})

        results = state["results"] + [result]
        state = {**state, "results": results, "logs": logs, "team": [],
                 "prayed": [False] * n}
        if sum(1 for x in results if not x["success"]) >= MISSIONS_TO_WIN:
            return self._finish(state, "evil", "failedMissions")
        if sum(1 for x in results if x["success"]) >= MISSIONS_TO_WIN:
            return {**state, "phase": "assassinate"}
        return self._next_round(state)

    @staticmethod
    def _patrol_room(state, seat):
        """Where this seat stood after tonight's patrol."""
        for note in reversed(state["logs"][seat]):
            if note["kind"] == "patrol" and note["round"] == state["round"]:
                return note["room"]
        return None

    def _next_round(self, state):
        n = state["numPlayers"]
        r = state["round"] + 1
        rng = self.rng
        deck = list(state["eventDeck"])
        event = deck.pop(0)
        collapsed = list(state["collapsed"])
        doors = [list(d) for d in state["doors"]]
        positions = list(state["positions"])
        timeline = state["timeline"] + [{"round": r, "kind": "night",
                                         "event": event}]
        logs = [list(log) for log in state["logs"]]
        rooms = list(state["missionRooms"])

        if event == "collapse":
            spared = {HALL, rooms[r], *([rooms[r + 1]] if len(rooms) > r + 1 else [])}
            options = [x for x in range(9) if x not in collapsed and x not in spared]
            if options:
                sealed = rng.choice(options)
                collapsed.append(sealed)
                timeline.append({"round": r, "kind": "collapse", "room": sealed})
                for s in range(n):
                    if positions[s] == sealed:
                        positions[s] = HALL
                        logs[s].append({"round": r, "kind": "collapse",
                                        "room": sealed})
        elif event == "secretDoor":
            options = [
                d for d in diagonals()
                if d not in doors and not set(d) & set(collapsed)
            ]
            if options:
                door = rng.choice(options)
                doors.append(door)
                timeline.append({"round": r, "kind": "door", "rooms": door})

        if r + 1 < ROUNDS:
            rooms.append(self._draw_room(rng, collapsed, rooms[r]))

        return {
            **state,
            "phase": "announce",
            "round": r,
            "missionRooms": rooms,
            "eventDeck": deck,
            "nightEvents": state["nightEvents"] + [event],
            "collapsed": collapsed,
            "doors": doors,
            "lockedDoor": None,
            "positions": positions,
            "fakes": [None] * n,
            "lastUsed": state["used"],
            "used": [None] * n,
            "fn": [None] * n,
            "orders": [None] * n,
            "leader": None,
            "bellLeader": None,
            "rejections": 0,
            "votes": [None] * n,
            "timeline": timeline,
            "logs": logs,
        }

    # --- the end

    def _assassinate(self, state, seat, move):
        if state["phase"] != "assassinate":
            raise GameError("Not time for the assassin")
        if seat != assassin_seat(state["roles"]):
            raise GameError("Only the assassin names the Prophet")
        target = move.get("target")
        n = state["numPlayers"]
        if type(target) is not int or not 0 <= target < n:
            raise GameError("Pick a player")
        if is_evil(state["roles"][target]):
            raise GameError("Pick one of the watchers")
        state = {**state, "assassinTarget": target}
        if state["roles"][target] == "prophet":
            return self._finish(state, "evil", "assassination")
        return self._finish(state, "good", "missions")

    @staticmethod
    def _finish(state, winner, reason):
        n = state["numPlayers"]
        return {**state, "phase": "finished", "orders": [None] * n,
                "winner": winner, "winReason": reason}

    # ----------------------------------------------------------- result

    def get_result(self, state: dict) -> dict | None:
        if state["phase"] != "finished":
            return None
        winner = state["winner"]
        if winner is None:
            return {"draw": True}
        return {
            "winner": winner,
            "winnerSeats": [
                s for s, role in enumerate(state["roles"])
                if is_evil(role) == (winner == "evil")
            ],
        }

    def on_abandon(self, state: dict, seat: int) -> dict:
        if state["phase"] == "finished":
            return state
        return self._finish(state, None, "abandoned")

    # ------------------------------------------------------------- view

    def view_for(self, state: dict, seat: int) -> dict:
        n = state["numPlayers"]
        roles = state["roles"]
        phase = state["phase"]
        r = state["round"]
        finished = phase == "finished"
        seated = 0 <= seat < n
        my_role = roles[seat] if seated else None
        evil_seats = [s for s, role in enumerate(roles) if is_evil(role)]
        reveal = finished or phase == "assassinate"
        rooms = state["missionRooms"]
        live = phase in ("announce", "patrol", "room") and seated

        return {
            "numPlayers": n,
            "phase": phase,
            "round": r,
            "rounds": ROUNDS,
            "missionRoom": rooms[r],
            "nextMissionRoom": rooms[r + 1] if len(rooms) > r + 1 else None,
            "missionSizes": MISSION_SIZES[n],
            "failsRequired": [fails_required(n, x) for x in range(ROUNDS)],
            "event": state["nightEvents"][r],
            "collapsed": state["collapsed"],
            "doors": state["doors"],
            "lockedDoor": state["lockedDoor"],
            "leader": state["leader"],
            # The next in line by seat (the Bell Tower cuts in ahead)
            "nextLeader": state["nextLeader"],
            "rejections": state["rejections"],
            "team": state["team"],
            "results": state["results"],
            "history": state["history"],
            "timeline": state["timeline"],
            "rolesInGame": sorted(roles),
            # Who has acted — never what they chose
            "ready": [o is not None for o in state["orders"]],
            "voted": [v is not None for v in state["votes"]],
            "missionPlayed": [
                s for s in state["team"] if state["cards"][s] is not None
            ],
            "myRole": my_role,
            "known": self._known(roles, seat) if seated else [],
            "assassinSeat": assassin_seat(roles)
            if reveal or (my_role is not None and is_evil(my_role))
            else None,
            "evilSeats": evil_seats if reveal else None,
            "myRoom": state["positions"][seat] if seated else None,
            "myFake": state["fakes"][seat] if seated else None,
            "myFn": state["fn"][seat] if seated and phase == "room" else None,
            "abilityLeft": state["abilityLeft"][seat] if seated else 0,
            "lastUsed": state["lastUsed"][seat] if seated else None,
            "freeMove": state["freeMove"][seat] if seated else False,
            "patrolRooms": self.patrol_rooms(state, seat) if live else [],
            "doorOptions": self.door_options(state)
            if live and my_role == "keeper" and state["abilityLeft"][seat] > 0
            else [],
            "studyOptions": [
                s for s in state["results"][-1]["team"] if s != seat
            ]
            if live and state["fn"][seat] == "study"
            else [],
            "letterLimit": 2 if state["nightEvents"][r] == "echo" else 1,
            "myOrder": state["orders"][seat] if seated else None,
            "myVote": state["votes"][seat] if seated and phase == "vote" else None,
            "myCard": state["cards"][seat] if seated else None,
            "log": state["logs"][seat] if seated else [],
            "assassinTarget": state["assassinTarget"],
            "winner": state["winner"],
            "winReason": state["winReason"],
            "roles": roles if finished else None,
            "positions": state["positions"] if finished else None,
        }

    @staticmethod
    def _known(roles, seat):
        """What this seat learned when the night began."""
        me = roles[seat]
        if me == "prophet":
            # Every evil player but the Hermit
            return [
                {"seat": s, "as": "evil"}
                for s, role in enumerate(roles)
                if is_evil(role) and role != "hermit"
            ]
        if me == "apprentice":
            # The Prophet and the Double, but not which is which
            return [
                {"seat": s, "as": "prophet"}
                for s, role in enumerate(roles)
                if role in ("prophet", "double")
            ]
        if is_evil(me):
            return [
                {"seat": s, "as": "evil"}
                for s, role in enumerate(roles)
                if s != seat and is_evil(role)
            ]
        return []


game = Nightwatch()

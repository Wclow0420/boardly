"""Midnight Manor engine — hidden roles in a dark house.

A rich old man has his relatives over for the night. Some of them are
Intruders in disguise who want him dead before dawn; the rest (one of
them the Butler, who knows where he is) want him alive at 6am.

The night is 8 hours. Each hour everyone secretly moves (stay, or one
room up/down/left/right), then secretly picks one action. It's dark:
in your room you see who is there, whether the old man is, and what
items lie around — but not what anyone does. Only working cameras see
actions, and only whoever watches the monitors sees the footage.

House (room index):
  0 Study      1 Library 📷   2 Bedroom 📷
  3 Kitchen 📷 4 Grand Hall   5 Security
  6 Cellar     7 Foyer 📷     8 Garden 📷

Full state (server only — clients get `view_for`):
{
  "numPlayers": 5,
  "roles": ["butler", "intruder", "guest", ...],   # by seat
  "phase": "move" | "act" | "gathering" | "guess" | "finished",
  "hour": 0,                         # 0 = 10pm ... 7 = 5am
  "positions": [4, 4, ...],          # room by seat, None = locked up
  "owner": {"room": 2, "hp": 2, "startRoom": 2, "escort": None},
  "cameras": [None, False, ...],     # by room: None = no camera
  "items": {"knife": 3, ...},        # room, or None while carried
  "carrying": [None, "knife", ...],  # by seat
  "orders": [None, {...}, ...],      # this phase's secret choices
  "lastMove": {"from": [...], "ownerFrom": 2},
  "events": [...],                   # public timeline
  "logs": [[...], ...],              # private notes by seat
  "guessTarget": None,
  "winner": None | "good" | "evil",
  "winReason": None | "dawn" | "caught" | "killed" | "butlerFound"
               | "abandoned"
}

Moves:
  {"type": "move", "room": r}                        phase "move"
  {"type": "act", "action": a, ...}                  phase "act"
      a: wait | guard | attack | take (+ "item") | fix | break
         | search (+ "target") | watch | escort
  {"type": "accuse", "target": seat | None}          phase "gathering"
  {"type": "guess", "target": seat}                  phase "guess"
"""

import random

from app.games.base import BaseGame, GameError

ROOMS = [
    "study", "library", "bedroom",
    "kitchen", "hall", "security",
    "cellar", "foyer", "garden",
]
HALL = 4
BEDROOM = 2
SECURITY = 5
CAMERA_ROOMS = (1, 2, 3, 7, 8)
# Where each weapon lies at the start of the night
WEAPONS = {"knife": 3, "candlestick": 1, "poison": 6}

HOURS = 8
OWNER_HP = 2
# Household meetings after these hours (0-based), and after a scream
GATHERING_HOURS = (2, 5)

ROLE_SETS = {
    4: ["butler", "guest", "guest", "intruder"],
    5: ["butler", "guest", "guest", "intruder", "intruder"],
    6: ["butler", "guest", "guest", "guest", "intruder", "intruder"],
    7: ["butler", "guest", "guest", "guest",
        "intruder", "intruder", "intruder"],
    8: ["butler", "guest", "guest", "guest", "guest",
        "intruder", "intruder", "intruder"],
}

ACTIONS = (
    "wait", "guard", "attack", "take", "fix", "break",
    "search", "watch", "escort",
)


def neighbors(room: int) -> list[int]:
    """Rooms one step up/down/left/right on the 3x3 floor plan."""
    row, col = divmod(room, 3)
    out = []
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        r, c = row + dr, col + dc
        if 0 <= r < 3 and 0 <= c < 3:
            out.append(r * 3 + c)
    return out


def is_evil(role: str) -> bool:
    return role == "intruder"


class Manor(BaseGame):
    key = "manor"
    name = "Midnight Manor"
    min_players = 4
    max_players = 8
    coins_win = 25
    coins_play = 8
    emoji = "🕯️"
    tile_color = "#E9E2F7"
    category = "party"
    tag = "party"

    def __init__(self, rng: random.Random | None = None):
        # The old man's wandering and tie-breaks; tests pass a seeded one
        self.rng = rng or random.SystemRandom()

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if num_players not in ROLE_SETS:
            raise GameError("This game needs 4 to 8 players")
        rng = rng or self.rng
        roles = list(ROLE_SETS[num_players])
        rng.shuffle(roles)

        items = dict(WEAPONS)
        carrying = [None] * num_players
        if num_players == 4:
            # A lone intruder starts armed
            carrying[roles.index("intruder")] = "knife"
            items["knife"] = None

        return {
            "numPlayers": num_players,
            "roles": roles,
            "phase": "move",
            "hour": 0,
            "positions": [HALL] * num_players,
            "owner": {"room": BEDROOM, "hp": OWNER_HP, "startRoom": BEDROOM,
                      "escort": None},
            "cameras": [False if r in CAMERA_ROOMS else None
                        for r in range(len(ROOMS))],
            "items": items,
            "carrying": carrying,
            "orders": [None] * num_players,
            "lastMove": None,
            "events": [],
            "logs": [[] for _ in range(num_players)],
            "guessTarget": None,
            "winner": None,
            "winReason": None,
        }

    # ------------------------------------------------------------ moves

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")

        handlers = {
            "move": self._move,
            "act": self._act,
            "accuse": self._accuse,
            "guess": self._guess,
        }
        handler = handlers.get(move.get("type"))
        if handler is None:
            raise GameError("Unknown move type")
        if state["phase"] != "guess" and state["positions"][seat] is None:
            raise GameError("You are locked up")
        return handler(state, seat, move)

    @staticmethod
    def _active(state) -> list[int]:
        """Seats still free to move and act (not locked up)."""
        return [s for s, room in enumerate(state["positions"]) if room is not None]

    def _submit(self, state, seat, order):
        if state["orders"][seat] is not None:
            raise GameError("You already chose")
        orders = list(state["orders"])
        orders[seat] = order
        return {**state, "orders": orders}

    def _all_in(self, state) -> bool:
        return all(state["orders"][s] is not None for s in self._active(state))

    # --- step 1: move

    def _move(self, state, seat, move):
        if state["phase"] != "move":
            raise GameError("Not moving right now")
        here = state["positions"][seat]
        room = move.get("room")
        if type(room) is not int or (room != here and room not in neighbors(here)):
            raise GameError("Stay, or move to a room next to yours")
        state = self._submit(state, seat, {"room": room})
        if not self._all_in(state):
            return state
        return self._resolve_move(state)

    def _resolve_move(self, state):
        n = state["numPlayers"]
        old = list(state["positions"])
        positions = [
            state["orders"][s]["room"] if old[s] is not None else None
            for s in range(n)
        ]

        owner = dict(state["owner"])
        owner_from = owner["room"]
        owner["startRoom"] = owner_from
        escort = owner["escort"]
        if escort is not None and positions[escort] is not None:
            # He follows whoever escorted him last hour
            owner["room"] = positions[escort]
        else:
            owner["room"] = self.rng.choice([owner_from] + neighbors(owner_from))
        owner["escort"] = None

        return {
            **state,
            "phase": "act",
            "positions": positions,
            "owner": owner,
            "orders": [None] * n,
            "lastMove": {"from": old, "ownerFrom": owner_from},
        }

    # --- step 2: act

    def _act(self, state, seat, move):
        if state["phase"] != "act":
            raise GameError("Not acting right now")
        here = state["positions"][seat]
        action = move.get("action")
        if action not in ACTIONS:
            raise GameError("Unknown action")

        role = state["roles"][seat]
        owner_here = state["owner"]["room"] == here
        camera = state["cameras"][here]
        order = {"action": action}

        if action in ("guard", "escort") and not owner_here:
            raise GameError("The old man isn't here")
        elif action == "attack":
            if not is_evil(role):
                raise GameError("Only intruders attack")
            if not owner_here:
                raise GameError("The old man isn't here")
            if state["carrying"][seat] is None:
                raise GameError("You need a weapon")
        elif action == "take":
            item = move.get("item")
            if item not in WEAPONS or state["items"].get(item) != here:
                raise GameError("That item isn't here")
            order["item"] = item
        elif action == "fix" and camera is not False:
            raise GameError("No broken camera here")
        elif action == "break":
            if not is_evil(role):
                raise GameError("Only intruders break cameras")
            if camera is not True:
                raise GameError("No working camera here")
        elif action == "search":
            target = move.get("target")
            if (
                type(target) is not int
                or target == seat
                or not 0 <= target < state["numPlayers"]
                or state["positions"][target] != here
            ):
                raise GameError("Pick someone in your room")
            order["target"] = target
        elif action == "watch" and here != SECURITY:
            raise GameError("The monitors are in the Security Room")

        state = self._submit(state, seat, order)
        if not self._all_in(state):
            return state
        return self._resolve_act(state)

    def _resolve_act(self, state):
        n = state["numPlayers"]
        hour = state["hour"]
        positions = state["positions"]
        orders = state["orders"]
        roles = state["roles"]
        owner = dict(state["owner"])
        cameras = list(state["cameras"])
        items = dict(state["items"])
        carrying = list(state["carrying"])
        events = list(state["events"])
        active = self._active(state)
        notes = {s: {} for s in active}

        def acting(action):
            return [s for s in active if orders[s]["action"] == action]

        # Items: simultaneous grabs for the same item go to one of them
        for item in WEAPONS:
            grabbers = [s for s in acting("take") if orders[s]["item"] == item]
            if not grabbers:
                continue
            winner = self.rng.choice(grabbers)
            for s in grabbers:
                notes[s]["took"] = item if s == winner else None
            dropped = carrying[winner]
            if dropped is not None:
                # Swap: what you held stays behind in this room
                items[dropped] = positions[winner]
            carrying[winner] = item
            items[item] = None

        # The attack: succeeds when attackers outnumber guards
        room = owner["room"]
        attackers = [s for s in acting("attack") if positions[s] == room]
        guards = [s for s in acting("guard") if positions[s] == room]
        hit = False
        if attackers:
            hit = len(attackers) > len(guards)
            for s in active:
                if positions[s] == room and s not in attackers:
                    notes[s]["attack"] = "hit" if hit else "blocked"
            for s in attackers:
                notes[s]["attack"] = "hit" if hit else "blocked"
        if hit:
            owner["hp"] -= 1
            events.append({"hour": hour, "kind": "scream", "room": room})

        # Cameras: whatever was on this hour (or came on) recorded it,
        # including the last moments before someone broke it
        recording = [r for r in CAMERA_ROOMS if cameras[r]]
        for s in acting("fix"):
            r = positions[s]
            if not cameras[r]:
                cameras[r] = True
                if r not in recording:
                    recording.append(r)
        for s in acting("break"):
            cameras[positions[s]] = False
        for r in CAMERA_ROOMS:
            if cameras[r] != state["cameras"][r]:
                events.append({
                    "hour": hour,
                    "kind": "cameraOn" if cameras[r] else "cameraOff",
                    "room": r,
                })

        last = state["lastMove"] or {"from": positions, "ownerFrom": room}
        footage = [
            self._footage(state, r, last)
            for r in sorted(recording)
        ]
        for s in acting("watch"):
            notes[s]["footage"] = footage

        for s in acting("search"):
            target = orders[s]["target"]
            notes[s]["search"] = {"target": target, "item": carrying[target]}

        escorts = acting("escort")
        owner["escort"] = self.rng.choice(escorts) if escorts else None

        logs = [list(log) for log in state["logs"]]
        for s in active:
            here = positions[s]
            logs[s].append({
                "hour": hour,
                "room": here,
                "with": [o for o in active if o != s and positions[o] == here],
                "owner": room == here,
                "action": orders[s],
                **notes[s],
            })

        state = {
            **state,
            "owner": owner,
            "cameras": cameras,
            "items": items,
            "carrying": carrying,
            "orders": [None] * n,
            "events": events,
            "logs": logs,
        }

        if owner["hp"] <= 0:
            return self._finish(state, "evil", "killed")
        if hit or hour in GATHERING_HOURS:
            return {**state, "phase": "gathering"}
        return self._next_hour(state)

    @staticmethod
    def _footage(state, room, last):
        """What one camera saw this hour (night vision: actions too)."""
        positions = state["positions"]
        inside = [s for s, r in enumerate(positions) if r == room]
        owner = state["owner"]
        return {
            "room": room,
            "seats": inside,
            "entered": [s for s in inside if last["from"][s] != room],
            "left": [
                s for s, r in enumerate(last["from"])
                if r == room and positions[s] != room
            ],
            "owner": owner["room"] == room,
            "ownerEntered": owner["room"] == room and last["ownerFrom"] != room,
            "ownerLeft": last["ownerFrom"] == room and owner["room"] != room,
            "actions": [
                {"seat": s, **state["orders"][s]}
                for s in inside
                if state["orders"][s] is not None
            ],
        }

    def _next_hour(self, state):
        hour = state["hour"] + 1
        if hour >= HOURS:
            # Dawn: the intruders' last chance — name the Butler
            return {**state, "hour": hour, "phase": "guess"}
        return {**state, "hour": hour, "phase": "move", "lastMove": None}

    # --- household meeting

    def _accuse(self, state, seat, move):
        if state["phase"] != "gathering":
            raise GameError("No meeting right now")
        target = move.get("target")
        if target is not None and (
            type(target) is not int
            or target == seat
            or not 0 <= target < state["numPlayers"]
            or state["positions"][target] is None
        ):
            raise GameError("Pick someone else who isn't locked up")
        state = self._submit(state, seat, {"target": target})
        if not self._all_in(state):
            return state

        active = self._active(state)
        votes = [state["orders"][s]["target"] if s in active else None
                 for s in range(state["numPlayers"])]
        tally = {}
        for s in active:
            if votes[s] is not None:
                tally[votes[s]] = tally.get(votes[s], 0) + 1
        locked = next(
            (t for t, count in tally.items() if count * 2 > len(active)), None
        )

        positions = list(state["positions"])
        owner = dict(state["owner"])
        if locked is not None:
            positions[locked] = None
            if owner["escort"] == locked:
                owner["escort"] = None
        state = {
            **state,
            "positions": positions,
            "owner": owner,
            "orders": [None] * state["numPlayers"],
            "events": state["events"] + [{
                "hour": state["hour"],
                "kind": "gathering",
                "votes": votes,
                "locked": locked,
            }],
        }

        free_intruders = [
            s for s in self._active(state) if is_evil(state["roles"][s])
        ]
        if not free_intruders:
            return self._finish(state, "good", "caught")
        return self._next_hour(state)

    # --- dawn

    @staticmethod
    def ringleader(roles) -> int:
        """The intruder who names the Butler at dawn."""
        return next(s for s, role in enumerate(roles) if is_evil(role))

    def _guess(self, state, seat, move):
        if state["phase"] != "guess":
            raise GameError("It isn't dawn yet")
        if seat != self.ringleader(state["roles"]):
            raise GameError("Only the ringleader names the Butler")
        target = move.get("target")
        if (
            type(target) is not int
            or not 0 <= target < state["numPlayers"]
            or is_evil(state["roles"][target])
        ):
            raise GameError("Pick someone who isn't an intruder")
        state = {**state, "guessTarget": target}
        if state["roles"][target] == "butler":
            return self._finish(state, "evil", "butlerFound")
        return self._finish(state, "good", "dawn")

    @staticmethod
    def _finish(state, winner, reason):
        return {
            **state,
            "phase": "finished",
            "orders": [None] * state["numPlayers"],
            "winner": winner,
            "winReason": reason,
        }

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
                seat
                for seat, role in enumerate(state["roles"])
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
        finished = phase == "finished"
        seated = 0 <= seat < n
        my_role = roles[seat] if seated else None
        here = state["positions"][seat] if seated else None
        owner = state["owner"]
        evil_seats = [s for s, role in enumerate(roles) if is_evil(role)]
        reveal_evil = finished or phase == "guess"

        return {
            "numPlayers": n,
            "phase": phase,
            "hour": state["hour"],
            "hours": HOURS,
            "ownerHp": owner["hp"],
            "ownerMaxHp": OWNER_HP,
            "cameras": state["cameras"],
            "events": state["events"],
            "locked": [s for s, r in enumerate(state["positions"]) if r is None],
            # Who has chosen this phase — never what
            "ready": [o is not None for o in state["orders"]],
            "myRole": my_role,
            "myRoom": here,
            "myItem": state["carrying"][seat] if seated else None,
            "myOrder": state["orders"][seat] if seated else None,
            "roommates": [
                s for s, r in enumerate(state["positions"])
                if here is not None and r == here and s != seat
            ],
            "ownerHere": here is not None and owner["room"] == here,
            # The Butler always knows where he was when the hour began
            "ownerSeenAt": (owner["startRoom"] if phase == "act" else owner["room"])
            if my_role == "butler" and not finished
            else None,
            "followingMe": seated and owner["escort"] == seat,
            "roomItems": sorted(
                item for item, room in state["items"].items()
                if here is not None and room == here
            ),
            "log": state["logs"][seat] if seated else [],
            "intruders": evil_seats
            if reveal_evil or (my_role is not None and is_evil(my_role))
            else None,
            "ringleader": self.ringleader(roles)
            if reveal_evil or (my_role is not None and is_evil(my_role))
            else None,
            "guessTarget": state["guessTarget"],
            "winner": state["winner"],
            "winReason": state["winReason"],
            "roles": roles if finished else None,
            "ownerRoom": owner["room"] if finished else None,
        }


game = Manor()

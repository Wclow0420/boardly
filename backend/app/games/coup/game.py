"""Hustle engine — bluffing, challenges and blocks; last player with
a card wins.

Shown to players as "Hustle" with a night-market theme. The internal
keys keep the ids the engine was written with: duke = Boss,
assassin = Enforcer, captain = Pickpocket, ambassador = Fixer,
contessa = Auntie; income = Day Job, foreignAid = Borrow,
tax = Collect Rent, steal = Pickpocket, exchange = Swap,
assassinate = Rough Up, coup = Shut Down. The themed names live in the
app's locale files.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 5,
  "players": [{"coins": 2,
               "cards": [{"role": "duke", "revealed": false}, ...]}],
  "deck": ["captain", ...],
  "turn": 0,                       # whose turn it is
  "phase": "action" | "challengeAction" | "block" | "challengeBlock"
           | "loseInfluence" | "exchange" | "finished",
  "action": null | {"type": "steal", "actor": 0, "target": 2,
                    "claim": "captain"},
  "block": null | {"seat": 2, "role": "ambassador"},
  "passed": [1, 3],                # who let the current claim through
  "pending": null | {"seat": 1, "next": "end"},   # must lose a card
  "exchange": null | ["duke", "captain", "contessa", "duke"],
  "log": [ ...public events... ],
  "winner": null | seat
}

Moves:
  {"type": "action", "action": "tax" | ..., "target": seat?}
  {"type": "pass"}                  let the current claim / action through
  {"type": "challenge"}             call the current claim a bluff
  {"type": "block", "role": "duke"} block the action, claiming a role
  {"type": "reveal", "card": 0|1}   choose which influence to lose
  {"type": "exchange", "keep": [indices into the exchange options]}
"""

import copy
import random

from app.games.base import BaseGame, GameError

ROLES = ["duke", "assassin", "captain", "ambassador", "contessa"]
COPIES_PER_ROLE = 3
STARTING_COINS = 2
COUP_COST = 7
FORCED_COUP_AT = 10

# claim: the role the actor says they have (challengeable)
# blockers: roles that stop the action; "anyone" when not just the target
ACTIONS = {
    "income": {},
    "foreignAid": {"blockers": ["duke"], "anyone": True},
    "coup": {"cost": COUP_COST, "target": True},
    "tax": {"claim": "duke"},
    "assassinate": {
        "claim": "assassin", "cost": 3, "target": True, "blockers": ["contessa"],
    },
    "steal": {"claim": "captain", "target": True, "blockers": ["captain", "ambassador"]},
    "exchange": {"claim": "ambassador"},
}

_rng = random.SystemRandom()


def hand(state, seat):
    """Indices of a player's face-down (still alive) cards."""
    return [
        i for i, card in enumerate(state["players"][seat]["cards"])
        if not card["revealed"]
    ]


def alive(state, seat):
    return len(hand(state, seat)) > 0


def alive_seats(state):
    return [s for s in range(state["numPlayers"]) if alive(state, s)]


def responders(state):
    """Seats that may answer the current claim / action."""
    phase = state["phase"]
    action = state["action"]
    if phase == "challengeAction":
        return [s for s in alive_seats(state) if s != action["actor"]]
    if phase == "block":
        if ACTIONS[action["type"]].get("anyone"):
            return [s for s in alive_seats(state) if s != action["actor"]]
        return [action["target"]] if alive(state, action["target"]) else []
    if phase == "challengeBlock":
        return [s for s in alive_seats(state) if s != state["block"]["seat"]]
    return []


class Coup(BaseGame):
    key = "coup"
    name = "Hustle"
    min_players = 2
    max_players = 6
    coins_win = 20
    coins_play = 5
    emoji = "🏮"
    tile_color = "#FFEBD6"
    category = "strategy"
    tag = "card"

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if not self.min_players <= num_players <= self.max_players:
            raise GameError("This game needs 2 to 6 players")
        rng = rng or _rng
        deck = [role for role in ROLES for _ in range(COPIES_PER_ROLE)]
        rng.shuffle(deck)
        players = [
            {
                "coins": STARTING_COINS,
                "cards": [
                    {"role": deck.pop(), "revealed": False},
                    {"role": deck.pop(), "revealed": False},
                ],
            }
            for _ in range(num_players)
        ]
        turn = rng.randrange(num_players)
        if num_players == 2:
            players[turn]["coins"] = 1  # two-player rule: first player starts with 1
        return {
            "numPlayers": num_players,
            "players": players,
            "deck": deck,
            "turn": turn,
            "phase": "action",
            "action": None,
            "block": None,
            "passed": [],
            "pending": None,
            "exchange": None,
            "log": [],
            "winner": None,
        }

    # ------------------------------------------------------------ moves

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")
        handler = {
            "action": self._action,
            "pass": self._pass,
            "challenge": self._challenge,
            "block": self._block,
            "reveal": self._reveal,
            "exchange": self._exchange,
        }.get(move.get("type"))
        if handler is None:
            raise GameError("Unknown move type")
        state = copy.deepcopy(state)
        handler(state, seat, move)
        return state

    def _action(self, s, seat, move):
        if s["phase"] != "action":
            raise GameError("Not time to choose an action")
        if seat != s["turn"]:
            raise GameError("Not your turn")
        kind = move.get("action")
        spec = ACTIONS.get(kind) if isinstance(kind, str) else None
        if spec is None:
            raise GameError("Unknown action")

        player = s["players"][seat]
        if player["coins"] >= FORCED_COUP_AT and kind != "coup":
            raise GameError("With $10 or more you must shut someone down")
        cost = spec.get("cost", 0)
        if player["coins"] < cost:
            raise GameError("Not enough cash")

        target = None
        if spec.get("target"):
            target = move.get("target")
            if (
                type(target) is not int
                or not 0 <= target < s["numPlayers"]
                or target == seat
                or not alive(s, target)
            ):
                raise GameError("Pick another player who is still in the game")

        player["coins"] -= cost
        s["action"] = {
            "type": kind, "actor": seat, "target": target, "claim": spec.get("claim"),
        }
        s["block"] = None
        s["passed"] = []
        s["log"].append({"t": "action", "actor": seat, "action": kind, "target": target})

        if spec.get("claim"):
            s["phase"] = "challengeAction"
        elif spec.get("blockers"):
            s["phase"] = "block"
        else:
            self._resolve(s)

    def _pass(self, s, seat, move):
        if seat not in responders(s):
            raise GameError("Nothing for you to respond to")
        if seat in s["passed"]:
            raise GameError("You already responded")
        s["passed"].append(seat)
        if any(r not in s["passed"] for r in responders(s)):
            return

        phase = s["phase"]
        if phase == "challengeAction":
            self._action_stands(s)
        elif phase == "block":
            self._resolve(s)
        else:  # challengeBlock: nobody doubted the block
            self._block_stands(s)

    def _challenge(self, s, seat, move):
        phase = s["phase"]
        if phase not in ("challengeAction", "challengeBlock"):
            raise GameError("Nothing to challenge")
        if seat not in responders(s):
            raise GameError("You can't challenge this")
        if seat in s["passed"]:
            raise GameError("You already let it through")

        on_action = phase == "challengeAction"
        claimant = s["action"]["actor"] if on_action else s["block"]["seat"]
        role = s["action"]["claim"] if on_action else s["block"]["role"]
        cards = s["players"][claimant]["cards"]
        proof = next(
            (c for c in cards if not c["revealed"] and c["role"] == role), None
        )
        s["log"].append(
            {
                "t": "challenge",
                "challenger": seat,
                "claimant": claimant,
                "role": role,
                "caught": proof is None,
            }
        )

        if proof is not None:
            # Honest: show the card, shuffle it back, draw a fresh one
            s["deck"].append(proof["role"])
            _rng.shuffle(s["deck"])
            proof["role"] = s["deck"].pop()
            self._lose(s, seat, "actionStands" if on_action else "blockStands")
        elif on_action:
            # Bluff called: the action never happens, its cost is returned
            cost = ACTIONS[s["action"]["type"]].get("cost", 0)
            s["players"][claimant]["coins"] += cost
            self._lose(s, claimant, "end")
        else:
            s["block"] = None
            self._lose(s, claimant, "resolve")

    def _block(self, s, seat, move):
        if s["phase"] != "block":
            raise GameError("Nothing to block")
        if seat not in responders(s):
            raise GameError("You can't block this")
        if seat in s["passed"]:
            raise GameError("You already let it through")
        role = move.get("role")
        if role not in ACTIONS[s["action"]["type"]]["blockers"]:
            raise GameError("That role can't block this action")

        s["block"] = {"seat": seat, "role": role}
        s["passed"] = []
        s["phase"] = "challengeBlock"
        s["log"].append({"t": "block", "seat": seat, "role": role})

    def _reveal(self, s, seat, move):
        if s["phase"] != "loseInfluence" or s["pending"]["seat"] != seat:
            raise GameError("You don't have to give up a card")
        card = move.get("card")
        if type(card) is not int or card not in hand(s, seat):
            raise GameError("Pick one of your face-down cards")
        next_step = s["pending"]["next"]
        s["pending"] = None
        self._flip(s, seat, card)
        self._continue(s, next_step)

    def _exchange(self, s, seat, move):
        if s["phase"] != "exchange" or s["action"]["actor"] != seat:
            raise GameError("You are not exchanging cards")
        options = s["exchange"]
        slots = hand(s, seat)
        keep = move.get("keep")
        if (
            not isinstance(keep, list)
            or len(keep) != len(slots)
            or len(set(keep)) != len(keep)
            or not all(type(i) is int and 0 <= i < len(options) for i in keep)
        ):
            raise GameError(f"Keep exactly {len(slots)} of the cards")

        for slot, choice in zip(slots, keep):
            s["players"][seat]["cards"][slot]["role"] = options[choice]
        s["deck"].extend(r for i, r in enumerate(options) if i not in keep)
        _rng.shuffle(s["deck"])
        s["exchange"] = None
        self._end_turn(s)

    # ------------------------------------------------------- resolution

    def _action_stands(self, s):
        """The action's claim went unchallenged (or survived one)."""
        action = s["action"]
        blockable = ACTIONS[action["type"]].get("blockers")
        s["passed"] = []
        s["phase"] = "block"
        if blockable and responders(s):
            return
        self._resolve(s)

    def _block_stands(self, s):
        s["log"].append({"t": "blocked", "seat": s["block"]["seat"]})
        self._end_turn(s)

    def _resolve(self, s):
        action = s["action"]
        kind, actor, target = action["type"], action["actor"], action["target"]
        player = s["players"][actor]

        if kind == "income":
            player["coins"] += 1
        elif kind == "foreignAid":
            player["coins"] += 2
        elif kind == "tax":
            player["coins"] += 3
        elif kind == "steal":
            taken = min(2, s["players"][target]["coins"])
            s["players"][target]["coins"] -= taken
            player["coins"] += taken
        elif kind in ("coup", "assassinate"):
            # The target may already be out (lost a challenge on the way)
            self._lose(s, target, "end")
            return
        elif kind == "exchange":
            drawn = [s["deck"].pop(), s["deck"].pop()]
            s["exchange"] = [
                player["cards"][i]["role"] for i in hand(s, actor)
            ] + drawn
            s["phase"] = "exchange"
            return
        self._end_turn(s)

    def _lose(self, s, seat, next_step):
        """`seat` must give up an influence, then play continues with
        `next_step`. With one card left there is nothing to choose."""
        cards = hand(s, seat)
        if len(cards) > 1:
            s["phase"] = "loseInfluence"
            s["pending"] = {"seat": seat, "next": next_step}
            return
        if cards:
            self._flip(s, seat, cards[0])
        self._continue(s, next_step)

    def _flip(self, s, seat, card):
        player = s["players"][seat]
        player["cards"][card]["revealed"] = True
        s["log"].append(
            {"t": "lose", "seat": seat, "role": player["cards"][card]["role"]}
        )
        if not alive(s, seat):
            player["coins"] = 0
            s["log"].append({"t": "out", "seat": seat})
        remaining = alive_seats(s)
        if len(remaining) == 1:
            s["phase"] = "finished"
            s["winner"] = remaining[0]
            s["pending"] = None

    def _continue(self, s, next_step):
        if s["phase"] == "finished":
            return
        if next_step == "actionStands":
            self._action_stands(s)
        elif next_step == "blockStands":
            self._block_stands(s)
        elif next_step == "resolve":
            self._resolve(s)
        else:
            self._end_turn(s)

    def _end_turn(self, s):
        s["action"] = None
        s["block"] = None
        s["passed"] = []
        s["pending"] = None
        s["exchange"] = None
        seat = s["turn"]
        for _ in range(s["numPlayers"]):
            seat = (seat + 1) % s["numPlayers"]
            if alive(s, seat):
                break
        s["turn"] = seat
        s["phase"] = "action"

    # ----------------------------------------------------------- result

    def get_result(self, state: dict) -> dict | None:
        if state["phase"] != "finished":
            return None
        if state["winner"] is None:
            return {"draw": True}
        return {"winnerSeat": state["winner"]}

    def on_abandon(self, state: dict, seat: int) -> dict:
        if state["phase"] == "finished":
            return state
        return {**state, "phase": "finished", "winner": None, "pending": None}

    # ------------------------------------------------------------- view

    def view_for(self, state: dict, seat: int) -> dict:
        finished = state["phase"] == "finished"
        phase = state["phase"]

        if phase in ("challengeAction", "block", "challengeBlock"):
            waiting = [r for r in responders(state) if r not in state["passed"]]
        elif phase == "loseInfluence":
            waiting = [state["pending"]["seat"]]
        elif phase == "exchange":
            waiting = [state["action"]["actor"]]
        elif phase == "action":
            waiting = [state["turn"]]
        else:
            waiting = []

        return {
            "numPlayers": state["numPlayers"],
            "players": [
                {
                    "coins": player["coins"],
                    "alive": alive(state, s),
                    "cards": [
                        {
                            "revealed": card["revealed"],
                            # Face-down cards are only visible to their owner
                            "role": card["role"]
                            if card["revealed"] or s == seat or finished
                            else None,
                        }
                        for card in player["cards"]
                    ],
                }
                for s, player in enumerate(state["players"])
            ],
            "deckCount": len(state["deck"]),
            "turn": state["turn"],
            "phase": phase,
            "action": state["action"],
            "block": state["block"],
            "passed": state["passed"],
            "waitingOn": waiting,
            "exchange": state["exchange"]
            if phase == "exchange" and state["action"]["actor"] == seat
            else None,
            "log": state["log"],
            "winner": state["winner"],
        }


game = Coup()

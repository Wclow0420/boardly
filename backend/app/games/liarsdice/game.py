"""Liar's Dice engine (大话骰) — the bar drinking game.

Everyone shakes 5 dice under a cup and looks only at their own. In
turn, players bid on how many dice of one face there are on the whole
table ("4 fives"), each bid higher than the last, until someone calls
the last bid a lie:

- Opening bid: more dice than there are players (2 players: 3+).
- A raise is more dice, or as many dice of a higher face, where faces
  rank 2 < 3 < 4 < 5 < 6 < 1.
- 1s are wild and count as any face, until someone bids "zhai" (斋)
  or bids on 1s; from then on in that round 1s count only as 1s. Going
  zhai may keep the same count and face (it makes the bid harder).
- Challenge ("open", 开): reveal everything. If the table has at least
  the bid, the challenger drinks a cup, otherwise the bidder does. A
  "double" challenge (劈) makes the loser drink two.
- Three cups and you're out (drunk). Last one standing wins.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 3,
  "dice": [[1, 4, 4, 6, 2], [], ...],   # by seat; [] once out
  "cups": [0, 2, 3],                    # cups drunk, by seat
  "turn": 0,                            # whose turn to bid or call
  "round": 1,
  "bid": null | {"quantity": 4, "face": 5, "zhai": false, "seat": 2},
  "bids": [...],                        # this round's bids, in order
  "reveal": null | {...},               # how the last round ended
  "phase": "bidding" | "finished",
  "winner": null | seat
}

Moves (on your turn):
  {"type": "bid", "quantity": q, "face": f, "zhai": bool}
  {"type": "challenge", "double": bool}  call the last bid a lie
"""

import random

from app.games.base import BaseGame, GameError

DICE_EACH = 5
MAX_CUPS = 3


def face_rank(face: int) -> int:
    """1 is the top face: 2 < 3 < 4 < 5 < 6 < 1."""
    return 7 if face == 1 else face


def counts(dice: list[list[int]], face: int, zhai: bool) -> int:
    """Dice on the table that count for a bid on `face`."""
    wild = not zhai and face != 1
    return sum(1 for hand in dice for d in hand if d == face or (wild and d == 1))


class LiarsDice(BaseGame):
    key = "liarsdice"
    name = "Liar's Dice"
    min_players = 2
    max_players = 6
    coins_win = 15
    coins_play = 4
    emoji = "🎲"
    tile_color = "#FFE0E0"
    category = "party"
    tag = "party"

    def __init__(self, rng: random.Random | None = None):
        self.rng = rng or random.SystemRandom()

    def _roll(self) -> list[int]:
        return [self.rng.randint(1, 6) for _ in range(DICE_EACH)]

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if not self.min_players <= num_players <= self.max_players:
            raise GameError("This game needs 2 to 6 players")
        rng = rng or self.rng
        return {
            "numPlayers": num_players,
            "dice": [self._roll() for _ in range(num_players)],
            "cups": [0] * num_players,
            "turn": rng.randrange(num_players),
            "round": 1,
            "bid": None,
            "bids": [],
            "reveal": None,
            "phase": "bidding",
            "winner": None,
        }

    # ------------------------------------------------------------ moves

    @staticmethod
    def _active(state) -> list[int]:
        return [s for s, cups in enumerate(state["cups"]) if cups < MAX_CUPS]

    def _next_active(self, state, seat) -> int:
        n = state["numPlayers"]
        for step in range(1, n + 1):
            s = (seat + step) % n
            if state["cups"][s] < MAX_CUPS:
                return s
        return seat

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")
        if seat != state["turn"]:
            raise GameError("It isn't your turn")
        kind = move.get("type")
        if kind == "bid":
            return self._bid(state, seat, move)
        if kind == "challenge":
            return self._challenge(state, seat, bool(move.get("double")))
        raise GameError("Unknown move type")

    def _bid(self, state, seat, move):
        quantity = move.get("quantity")
        face = move.get("face")
        if type(quantity) is not int or type(face) is not int or not 1 <= face <= 6:
            raise GameError("Bid a number of dice and a face")
        active = self._active(state)
        total = DICE_EACH * len(active)
        if not 1 <= quantity <= total:
            raise GameError(f"There are only {total} dice on the table")

        last = state["bid"]
        # Once zhai, the round stays zhai; bidding 1s is always zhai
        zhai = bool(move.get("zhai")) or face == 1 or bool(last and last["zhai"])
        if last is None:
            if quantity <= len(active):
                raise GameError(f"Open with more than {len(active)} dice")
        else:
            new = (quantity, face_rank(face))
            old = (last["quantity"], face_rank(last["face"]))
            going_zhai = zhai and not last["zhai"]
            if not (new > old or (going_zhai and new >= old)):
                raise GameError("Bid higher than the last call")

        bid = {"quantity": quantity, "face": face, "zhai": zhai, "seat": seat}
        return {
            **state,
            "bid": bid,
            "bids": state["bids"] + [bid],
            "turn": self._next_active(state, seat),
        }

    def _challenge(self, state, seat, double):
        bid = state["bid"]
        if bid is None:
            raise GameError("Nobody has bid yet")
        found = counts(state["dice"], bid["face"], bid["zhai"])
        bidder_right = found >= bid["quantity"]
        loser = seat if bidder_right else bid["seat"]
        drink = 2 if double else 1

        cups = list(state["cups"])
        cups[loser] = min(MAX_CUPS, cups[loser] + drink)
        reveal = {
            "round": state["round"],
            "dice": state["dice"],
            "bid": bid,
            "challenger": seat,
            "double": double,
            "found": found,
            "loser": loser,
            "drink": drink,
            "out": cups[loser] >= MAX_CUPS,
        }
        state = {**state, "cups": cups, "reveal": reveal}

        active = self._active(state)
        if len(active) == 1:
            return {
                **state,
                "phase": "finished",
                "winner": active[0],
                "bid": None,
                "dice": [[] for _ in cups],
            }

        # New round: everyone still in shakes again; the loser starts
        starter = loser if cups[loser] < MAX_CUPS else self._next_active(state, loser)
        return {
            **state,
            "dice": [self._roll() if c < MAX_CUPS else [] for c in cups],
            "turn": starter,
            "round": state["round"] + 1,
            "bid": None,
            "bids": [],
        }

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
        return {**state, "phase": "finished", "winner": None}

    # ------------------------------------------------------------- view

    def view_for(self, state: dict, seat: int) -> dict:
        n = state["numPlayers"]
        seated = 0 <= seat < n
        return {
            "numPlayers": n,
            "phase": state["phase"],
            "turn": state["turn"],
            "round": state["round"],
            "cups": state["cups"],
            "maxCups": MAX_CUPS,
            "diceEach": DICE_EACH,
            # Only your own cup; everyone else's stays covered
            "myDice": sorted(state["dice"][seat]) if seated else [],
            "diceCount": [len(hand) for hand in state["dice"]],
            "bid": state["bid"],
            "bids": state["bids"],
            "reveal": state["reveal"],
            "winner": state["winner"],
        }


game = LiarsDice()

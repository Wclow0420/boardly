"""Liar's Dice engine (大话骰) — the bar drinking game.

Everyone shakes 5 dice under a cup and looks only at their own. In
turn, players bid on how many dice of one face there are on the whole
table ("4 fives"), each bid higher than the last, until someone calls
the last bid a lie:

- Opening bid: more dice than there are players (2 players: 3+); an
  opening zhai bid may be as many as there are players.
- A raise is more dice, or as many dice of a higher face, where faces
  rank 2 < 3 < 4 < 5 < 6 < 1.
- 1s are wild and count as any face, unless the bid is "zhai" (斋):
  then 1s count only as 1s. Bidding 1s is always zhai. Going zhai may
  keep the same count and face (it makes the bid harder).
- Breaking the fast (开斋, also called 飞): after a zhai bid, the next
  bid may make 1s wild again, but must call at least double the dice.
- Open (开): the player whose turn it is calls the last bid a lie.
  Everything is revealed; if the table has at least the bid, the
  caller drinks a cup, otherwise the bidder does.
- Split (劈): ANY other player may call the last bid a lie at any time,
  for two cups. The bidder then accepts (two cups) or counter-splits
  (反劈) for four.

Two modes, picked in the lobby:
- knockout: five cups and you're out (drunk); last one standing wins.
- endless: nobody is ever out; cups just add up. The game ends when
  more than half the table votes to stop; the fewest cups win.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 3,
  "mode": "knockout" | "endless",
  "dice": [[1, 4, 4, 6, 2], [], ...],   # by seat; [] once out
  "cups": [0, 2, 5],                    # cups drunk, by seat
  "turn": 0,                            # whose turn to bid or open
  "round": 1,
  "bid": null | {"quantity": 4, "face": 5, "zhai": false, "seat": 2},
  "bids": [...],                        # this round's bids, in order
  "split": null | {"by": 1},            # waiting on the bidder's answer
  "endVotes": [],                       # endless: seats voting to stop
  "reveal": null | {...},               # how the last round ended
  "phase": "bidding" | "split" | "finished",
  "winner": null | seat,
  "winners": null | [seats]             # endless: fewest cups (ties)
}

Moves:
  {"type": "bid", "quantity": q, "face": f, "zhai": bool}   your turn
  {"type": "challenge"}                                     your turn: 开
  {"type": "split", "bids": n}     anyone but the bidder: 劈 the bid they
                                   saw (n = how many bids they saw)
  {"type": "respond", "counter": bool}   the bidder: accept, or 反劈
  {"type": "end", "vote": bool}          endless: vote to stop
"""

import random

from app.games.base import BaseGame, GameError

DICE_EACH = 5
KNOCKOUT_CUPS = 5
DRINKS = {"open": 1, "split": 2, "counter": 4}


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
    max_players = 10
    coins_win = 15
    coins_play = 4
    emoji = "🎲"
    tile_color = "#FFE0E0"
    category = "party"
    tag = "party"
    options = {"mode": ["knockout", "endless"]}

    def __init__(self, rng: random.Random | None = None):
        self.rng = rng or random.SystemRandom()

    def _roll(self) -> list[int]:
        return [self.rng.randint(1, 6) for _ in range(DICE_EACH)]

    def initial_state(
        self, num_players: int, rng: random.Random | None = None, mode: str = "knockout"
    ) -> dict:
        if not self.min_players <= num_players <= self.max_players:
            raise GameError("This game needs 2 to 10 players")
        if mode not in self.options["mode"]:
            raise GameError("Unknown mode")
        rng = rng or self.rng
        return {
            "numPlayers": num_players,
            "mode": mode,
            "dice": [self._roll() for _ in range(num_players)],
            "cups": [0] * num_players,
            "turn": rng.randrange(num_players),
            "round": 1,
            "bid": None,
            "bids": [],
            "split": None,
            "endVotes": [],
            "reveal": None,
            "phase": "bidding",
            "winner": None,
            "winners": None,
        }

    def new_state(self, num_players: int, options: dict) -> dict:
        return self.initial_state(num_players, mode=options["mode"])

    # ------------------------------------------------------------ moves

    @staticmethod
    def _endless(state) -> bool:
        return state.get("mode") == "endless"

    def _is_out(self, state, seat) -> bool:
        return not self._endless(state) and state["cups"][seat] >= KNOCKOUT_CUPS

    def _active(self, state) -> list[int]:
        return [s for s in range(state["numPlayers"]) if not self._is_out(state, s)]

    def _next_active(self, state, seat) -> int:
        n = state["numPlayers"]
        for step in range(1, n + 1):
            s = (seat + step) % n
            if not self._is_out(state, s):
                return s
        return seat

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")
        if not 0 <= seat < state["numPlayers"] or self._is_out(state, seat):
            raise GameError("You're out of this game")
        kind = move.get("type")
        if kind == "end":
            return self._vote_end(state, seat, bool(move.get("vote")))
        if kind == "split":
            return self._split(state, seat, move)
        if kind == "respond":
            return self._respond(state, seat, bool(move.get("counter")))

        if state["phase"] != "bidding":
            raise GameError("Waiting on the split")
        if seat != state["turn"]:
            raise GameError("It isn't your turn")
        if kind == "bid":
            return self._bid(state, seat, move)
        if kind == "challenge":
            if state["bid"] is None:
                raise GameError("Nobody has bid yet")
            return self._reveal(state, seat, "open")
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
        # Bidding 1s is always zhai
        zhai = bool(move.get("zhai")) or face == 1
        if last is None:
            # A zhai opening may call as many dice as there are players
            least = len(active) if zhai else len(active) + 1
            if quantity < least:
                raise GameError(f"Open with at least {least} dice")
        elif last["zhai"] and not zhai:
            # Breaking the fast: 1s are wild again, at double the dice
            if quantity < 2 * last["quantity"]:
                raise GameError(
                    f"Breaking zhai needs at least {2 * last['quantity']} dice"
                )
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

    def _split(self, state, seat, move):
        """劈: anyone but the bidder, at any time, for two cups."""
        bid = state["bid"]
        if state["phase"] != "bidding" or bid is None:
            raise GameError("There's no bid to split")
        if seat == bid["seat"]:
            raise GameError("You can't split your own bid")
        # Splits race the next bid: only the bid the player saw counts
        if move.get("bids") != len(state["bids"]):
            raise GameError("The bid has changed — look again")
        return {**state, "phase": "split", "split": {"by": seat}}

    def _respond(self, state, seat, counter):
        """The bidder answers a split: accept, or counter-split (反劈)."""
        if state["phase"] != "split":
            raise GameError("Nobody split")
        if seat != state["bid"]["seat"]:
            raise GameError("Only the bidder answers a split")
        return self._reveal(
            state, state["split"]["by"], "counter" if counter else "split"
        )

    def _reveal(self, state, challenger, kind):
        bid = state["bid"]
        found = counts(state["dice"], bid["face"], bid["zhai"])
        loser = challenger if found >= bid["quantity"] else bid["seat"]
        drink = DRINKS[kind]

        cups = list(state["cups"])
        cups[loser] += drink
        if not self._endless(state):
            cups[loser] = min(KNOCKOUT_CUPS, cups[loser])
        state = {
            **state,
            "cups": cups,
            "phase": "bidding",
            "split": None,
            "reveal": {
                "round": state["round"],
                "dice": state["dice"],
                "bid": bid,
                "challenger": challenger,
                "kind": kind,
                "found": found,
                "loser": loser,
                "drink": drink,
                "out": False,
            },
        }
        state["reveal"]["out"] = self._is_out(state, loser)

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
        starter = (
            loser if not self._is_out(state, loser) else self._next_active(state, loser)
        )
        return {
            **state,
            "dice": [
                [] if self._is_out(state, s) else self._roll()
                for s in range(state["numPlayers"])
            ],
            "turn": starter,
            "round": state["round"] + 1,
            "bid": None,
            "bids": [],
        }

    def _vote_end(self, state, seat, vote):
        """Endless mode: more than half the table stops the game."""
        if not self._endless(state):
            raise GameError("Only endless games end by vote")
        votes = set(state.get("endVotes", []))
        if vote:
            votes.add(seat)
        else:
            votes.discard(seat)
        state = {**state, "endVotes": sorted(votes)}
        if len(votes) * 2 <= state["numPlayers"]:
            return state
        fewest = min(state["cups"])
        winners = [s for s, c in enumerate(state["cups"]) if c == fewest]
        return {
            **state,
            "phase": "finished",
            "winners": winners,
            "winner": winners[0] if len(winners) == 1 else None,
            "bid": None,
            "split": None,
            "dice": [[] for _ in state["cups"]],
        }

    # ----------------------------------------------------------- result

    def get_result(self, state: dict) -> dict | None:
        if state["phase"] != "finished":
            return None
        if state.get("winners"):
            return {"winnerSeats": state["winners"]}
        if state["winner"] is None:
            return {"draw": True}
        return {"winnerSeat": state["winner"]}

    def on_abandon(self, state: dict, seat: int) -> dict:
        if state["phase"] == "finished":
            return state
        return {**state, "phase": "finished", "winner": None, "winners": None}

    # ------------------------------------------------------------- view

    def view_for(self, state: dict, seat: int) -> dict:
        n = state["numPlayers"]
        seated = 0 <= seat < n
        endless = self._endless(state)
        return {
            "numPlayers": n,
            "mode": state.get("mode", "knockout"),
            "phase": state["phase"],
            "turn": state["turn"],
            "round": state["round"],
            "cups": state["cups"],
            # Cups that knock you out; null in endless games
            "maxCups": None if endless else KNOCKOUT_CUPS,
            "diceEach": DICE_EACH,
            # Only your own cup; everyone else's stays covered
            "myDice": sorted(state["dice"][seat]) if seated else [],
            "diceCount": [len(hand) for hand in state["dice"]],
            "bid": state["bid"],
            "bids": state["bids"],
            "split": state.get("split"),
            "endVotes": state.get("endVotes", []),
            "reveal": state["reveal"],
            "winner": state["winner"],
            "winners": state.get("winners"),
        }


game = LiarsDice()

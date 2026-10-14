"""Shelter (避难所) engine — survive six days of winter; someone turns.

Everyone starts as a survivor. Each day they scavenge outside, bringing
food back to a shared storeroom; each night they eat one each, and
some stand guard. On the 2nd or 3rd night one survivor secretly turns
into the Infected (a second one two nights later with 6+ players), who
from then on tries to starve the shelter: playing sabotage into the
day's haul, stealing from the storeroom or opening the door at night.
Every morning after the cough, the shelter may vote someone out.

The three clashes:
  day     everyone at a place plays one card face down; the cards are
          shuffled and revealed. The Infected's sabotage turns over as
          mould (−2), the same as the mould already in the decks.
  night   everyone secretly picks a post: storeroom, door or bed. The
          Infected picks the same three, meaning steal / open / nothing.
          If a survivor guards where the Infected strikes, the strike
          fails and the guard sees who it was. One guard to a post (the
          first to choose it; anyone later goes back to bed). Guards are
          tired the next day (one card instead of two). A theft takes a
          third of the storeroom, at least 2.
  morning a public vote; more than half of those standing exiles one.

Places: farm and market; the hospital opens with 5+ players.

Each day (day 0-5):
  vote    (once the cough has been heard, from day 1) everyone standing
          names someone to exile, or no one.
  search  everyone standing and not injured picks a place.
  play    each is dealt two cards (one when tired or weak) from their
          place's deck and plays one face down; the Infected may play
          sabotage instead.
  night   everyone standing picks a post; then the storeroom feeds
          everyone, one each.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 5,
  "roles": ["survivor", "infected", ...],  # by seat, assigned at the cough
  "turnNights": [1, 3],                    # nights an infection happens
  "phase": "vote" | "search" | "play" | "night" | "finished",
  "day": 0,                                # 0-5
  "status": ["ok", "fallen", "exiled", ...],
  "store": 5, "medicine": 0,
  "sitOut": [None, 3, ...],                # injured: can't go out that day
  "tired": [False, ...], "weak": [False, ...], "hunger": [0, ...],
  "stealth": [0, 1, ...],                  # the Infected's one stealth (5p)
  "places": [None, "farm", ...],           # today
  "hands": [[], ["f1", "mold1"], ...],     # today
  "plays": [None, "f2", ...],              # today
  "posts": [None, "store", ...],           # tonight (raw choice)
  "votes": [None, 3, -1, ...],             # -1 = no one
  "searches": [{"day": 0, "places": {"farm": {"players": [..],
                "cards": [..], "food": 3}}}],
  "nights": [{"day": 0, "before": 5, "after": 1, "stolen": 0,
              "opened": False, "injured": [], "hungry": [], "fallen": [],
              "cough": False}],
  "exiles": [{"day": 1, "votes": [..], "exiled": 2, "role": "survivor"}],
  "logs": [[...], ...],                    # private notes by seat
  "winner": None | "survivors" | "infected",
  "winReason": None | "rescue" | "exiled" | "famine" | "outnumbered"
               | "lateRescue" | "abandoned"
}

Moves:
  {"type": "vote", "target": seat | -1}                phase "vote"
  {"type": "search", "place": "farm" | "market" | "hospital"}
  {"type": "play", "card": index | "sabotage"}         phase "play"
  {"type": "night", "post": "store" | "door" | "sleep", "stealth"?: bool}
"""

import random

from app.games.base import BaseGame, GameError, Badge, won_as
from app.games.shelter.bot import shelter as bot_policy

DAYS = 6
PLACES = ("farm", "market", "hospital")
POSTS = ("store", "door", "sleep")

# Each deck as {card: copies}; cards are drawn with replacement
DECKS = {
    "farm": {"f1": 6, "f2": 3, "none": 3, "mold1": 2, "mold2": 1},
    "market": {"f2": 4, "f3": 2, "none": 4, "mold2": 4, "zombie": 2},
    "hospital": {"f1": 5, "f2": 2, "none": 2, "medicine": 2, "zombie": 1},
}
FOOD = {"f1": 1, "f2": 2, "f3": 3, "none": 0, "mold1": -1, "mold2": -2,
        "zombie": 0, "medicine": 0, "sabotage": -2}

STEAL = 2


def steal_amount(store: int) -> int:
    """Food one theft takes: a third of the storeroom, at least 2. It grows
    with the stock, so a run of lucky days doesn't shut the Infected out."""
    return max(STEAL, store // 3)

# Players: (infected in all, survivors needed at the rescue, starving
# players that make a famine)
COUNTS = {
    4: (1, 2, 2),
    5: (1, 2, 2),
    6: (2, 2, 3),
    7: (2, 3, 3),
    8: (2, 3, 3),
}


def infected_total(n: int) -> int:
    return COUNTS[n][0]


def rescue_needed(n: int) -> int:
    return COUNTS[n][1]


def famine_at(n: int) -> int:
    return COUNTS[n][2]


def places_for(n: int) -> list[str]:
    return list(PLACES) if n >= 5 else ["farm", "market"]


class Shelter(BaseGame):
    key = "shelter"
    name = "Shelter"
    min_players = 4
    max_players = 8
    coins_win = 25
    coins_play = 8
    emoji = "🔥"
    tile_color = "#E3ECF5"
    category = "faction"
    tag = "faction"
    has_bots = True

    badges = [
        Badge("shelter.rescued", "bronze", 1, won_as("good")),
        Badge("shelter.patientZero", "silver", 1, won_as("evil")),
        Badge("shelter.caught", "silver", 1, lambda o: o.won and o.side == "good" and (o.facts or {}).get("reason") == "exiled"),
        Badge("shelter.fullLarder", "gold", 1,
              lambda o: o.won and o.side == "good"
              and (o.facts or {}).get("reason") == "rescue"
              and (o.facts or {}).get("store", 0) >= 10),
        Badge("shelter.lastWinter", "legendary", 25, series="wins"),
    ]

    def __init__(self, rng: random.Random | None = None):
        # Who turns and when, card draws, who goes hungry; tests pass a
        # seeded one
        self.rng = rng or random.SystemRandom()

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if num_players not in COUNTS:
            raise GameError("This game needs 4 to 8 players")
        rng = rng or self.rng
        n = num_players
        first = rng.choice([1, 2])
        turns = [first] + ([first + 2] if infected_total(n) == 2 else [])
        return {
            "numPlayers": n,
            "roles": ["survivor"] * n,
            "turnNights": turns,
            "cough": None,
            "phase": "search",
            "day": 0,
            "status": ["ok"] * n,
            "store": n,
            "medicine": 0,
            "sitOut": [None] * n,
            "tired": [False] * n,
            "weak": [False] * n,
            "hunger": [0] * n,
            "stealth": [0] * n,
            "places": [None] * n,
            "hands": [[] for _ in range(n)],
            "plays": [None] * n,
            "posts": [None] * n,
            "votes": [None] * n,
            "searches": [],
            "nights": [],
            "exiles": [],
            "logs": [[] for _ in range(n)],
            "winner": None,
            "winReason": None,
        }

    # ------------------------------------------------------------ helpers

    @staticmethod
    def standing(state) -> list[int]:
        return [s for s, st in enumerate(state["status"]) if st == "ok"]

    @staticmethod
    def searchers(state) -> list[int]:
        """Who goes out today: standing and not injured."""
        return [
            s for s, st in enumerate(state["status"])
            if st == "ok" and state["sitOut"][s] != state["day"]
        ]

    @staticmethod
    def coughed(state) -> bool:
        return any(r == "infected" for r in state["roles"])

    @staticmethod
    def _log(state, seat, note):
        logs = [list(log) for log in state["logs"]]
        logs[seat].append({"day": state["day"], **note})
        return {**state, "logs": logs}

    def _draw(self, place: str) -> str:
        deck = DECKS[place]
        cards = list(deck)
        return self.rng.choices(cards, weights=[deck[c] for c in cards])[0]

    # -------------------------------------------------------------- moves

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if state["phase"] == "finished":
            raise GameError("Game is already over")
        if not isinstance(move, dict):
            raise GameError("Invalid move")
        if not 0 <= seat < state["numPlayers"]:
            raise GameError("You are not playing")
        handlers = {
            "vote": self._vote,
            "search": self._search,
            "play": self._play,
            "night": self._night,
        }
        handler = handlers.get(move.get("type"))
        if handler is None:
            raise GameError("Unknown move type")
        return handler(state, seat, move)

    # --- morning vote

    def _vote(self, state, seat, move):
        if state["phase"] != "vote":
            raise GameError("Not voting right now")
        standing = self.standing(state)
        if seat not in standing:
            raise GameError("You can't vote")
        if state["votes"][seat] is not None:
            raise GameError("You already voted")
        target = move.get("target")
        if target != -1 and (target not in standing or target == seat):
            raise GameError("Pick someone still standing, or no one")
        votes = list(state["votes"])
        votes[seat] = target
        state = {**state, "votes": votes}
        if all(votes[s] is not None for s in standing):
            return self._resolve_vote(state)
        return state

    def _resolve_vote(self, state):
        n = state["numPlayers"]
        standing = self.standing(state)
        need = len(standing) // 2 + 1
        counts: dict[int, int] = {}
        for s in standing:
            if state["votes"][s] != -1:
                counts[state["votes"][s]] = counts.get(state["votes"][s], 0) + 1
        exiled = next((s for s, c in counts.items() if c >= need), None)
        entry = {"day": state["day"], "votes": list(state["votes"]),
                 "exiled": exiled,
                 "role": state["roles"][exiled] if exiled is not None else None}
        state = {**state, "exiles": state["exiles"] + [entry],
                 "votes": [None] * n}
        if exiled is not None:
            status = list(state["status"])
            status[exiled] = "exiled"
            state = {**state, "status": status}
            out = sum(
                1 for s, st in enumerate(status)
                if st == "exiled" and state["roles"][s] == "infected"
            )
            if out == infected_total(n):
                return self._finish(state, "survivors", "exiled")
            done = self._outnumbered(state)
            if done:
                return done
        return self._to_search(state)

    # --- day: pick a place, then play a card

    def _to_search(self, state):
        state = {**state, "phase": "search", "places": [None] * state["numPlayers"]}
        if not self.searchers(state):
            return self._to_night({**state, "phase": "play"})
        return state

    def _search(self, state, seat, move):
        if state["phase"] != "search":
            raise GameError("Not searching right now")
        out = self.searchers(state)
        if seat not in out:
            raise GameError("You can't go out today")
        if state["places"][seat] is not None:
            raise GameError("You already chose")
        place = move.get("place")
        if place not in places_for(state["numPlayers"]):
            raise GameError("Unknown place")
        places = list(state["places"])
        places[seat] = place
        state = {**state, "places": places}
        if all(places[s] is not None for s in out):
            return self._deal(state)
        return state

    def _deal(self, state):
        hands = [[] for _ in range(state["numPlayers"])]
        for s in self.searchers(state):
            size = 1 if state["tired"][s] or state["weak"][s] else 2
            hands[s] = [self._draw(state["places"][s]) for _ in range(size)]
        return {**state, "phase": "play", "hands": hands,
                "plays": [None] * state["numPlayers"]}

    def _play(self, state, seat, move):
        if state["phase"] != "play":
            raise GameError("Not playing cards right now")
        out = self.searchers(state)
        if seat not in out:
            raise GameError("You didn't go out today")
        if state["plays"][seat] is not None:
            raise GameError("You already played")
        card = move.get("card")
        if card == "sabotage":
            if state["roles"][seat] != "infected":
                raise GameError("Only the Infected can sabotage")
        elif isinstance(card, int) and not isinstance(card, bool) \
                and 0 <= card < len(state["hands"][seat]):
            card = state["hands"][seat][card]
        else:
            raise GameError("Pick a card from your hand")
        plays = list(state["plays"])
        # Sabotage goes down as mould: turned over, nobody can tell it apart
        plays[seat] = "mold2" if card == "sabotage" else card
        state = {**state, "plays": plays}
        state = self._log(state, seat, {"kind": "played", "card": card,
                                        "place": state["places"][seat]})
        if all(plays[s] is not None for s in out):
            return self._resolve_search(state)
        return state

    def _resolve_search(self, state):
        day = state["day"]
        report = {}
        store = state["store"]
        medicine = state["medicine"]
        sit_out = list(state["sitOut"])
        injured = []
        for place in places_for(state["numPlayers"]):
            here = [s for s in self.searchers(state) if state["places"][s] == place]
            if not here:
                continue
            cards = [state["plays"][s] for s in here]
            self.rng.shuffle(cards)
            food = sum(FOOD[c] for c in cards)
            store = max(0, store + food)
            medicine += cards.count("medicine")
            for s in here:
                if state["plays"][s] == "zombie":
                    sit_out[s] = day + 1
                    injured.append(s)
            report[place] = {"players": here, "cards": cards, "food": food}
        entry = {"day": day, "places": report, "injured": injured}
        state = {**state, "store": store, "medicine": medicine,
                 "sitOut": sit_out, "searches": state["searches"] + [entry]}
        return self._to_night(state)

    # --- night: posts, the Infected's strike, supper

    def _to_night(self, state):
        n = state["numPlayers"]
        day = state["day"]
        state = {**state, "phase": "night", "posts": [None] * n,
                 "hands": [[] for _ in range(n)], "plays": [None] * n}
        if day in state["turnNights"]:
            pool = [s for s in self.standing(state) if state["roles"][s] == "survivor"]
            if pool:
                chosen = self.rng.choice(pool)
                roles = list(state["roles"])
                roles[chosen] = "infected"
                stealth = list(state["stealth"])
                if n == 5:
                    stealth[chosen] = 1
                state = {**state, "roles": roles, "stealth": stealth,
                         "cough": day}
                state = self._log(state, chosen, {"kind": "turned"})
        return state

    def _night(self, state, seat, move):
        if state["phase"] != "night":
            raise GameError("Not night time")
        standing = self.standing(state)
        if seat not in standing:
            raise GameError("You can't act tonight")
        if state["posts"][seat] is not None:
            raise GameError("You already chose")
        post = move.get("post")
        if post not in POSTS:
            raise GameError("Unknown post")
        stealth = bool(move.get("stealth"))
        if stealth and (state["roles"][seat] != "infected"
                        or state["stealth"][seat] < 1 or post == "sleep"):
            raise GameError("You can't sneak")
        posts = list(state["posts"])
        # The order of choosing decides who guards a post first
        at = sum(1 for p in posts if p is not None)
        posts[seat] = {"post": post, "stealth": stealth, "at": at}
        state = {**state, "posts": posts}
        if all(posts[s] is not None for s in standing):
            return self._resolve_night(state)
        return state

    def _resolve_night(self, state):
        n = state["numPlayers"]
        day = state["day"]
        roles = state["roles"]
        standing = self.standing(state)
        posts = state["posts"]
        # One guard to a post: the first survivor to choose it. Anyone who
        # chose a post already taken goes back to bed (and isn't tired).
        guards = {"store": [], "door": []}
        bumped = []
        for p in ("store", "door"):
            here = sorted(
                (s for s in standing
                 if roles[s] == "survivor" and posts[s]["post"] == p),
                key=lambda s: posts[s]["at"],
            )
            guards[p] = here[:1]
            for s in here[1:]:
                bumped.append(s)
                state = self._log(state, s, {"kind": "bumped", "post": p})
        posts = [
            {**p, "post": "sleep"} if s in bumped else p
            for s, p in enumerate(posts)
        ]
        before = state["store"]
        store = before
        stealth = list(state["stealth"])
        sit_out = list(state["sitOut"])
        thieves = []
        stolen = 0
        opened = False
        injured = []

        # Guards see each other
        for p, seen in guards.items():
            for s in seen:
                others = [o for o in seen if o != s]
                state = self._log(state, s, {"kind": "guarded", "post": p,
                                             "with": others, "saw": []})

        strikers = [s for s in standing
                    if roles[s] == "infected" and posts[s]["post"] != "sleep"]
        self.rng.shuffle(strikers)
        for s in strikers:
            post = posts[s]["post"]
            watchers = guards[post]
            sneaking = posts[s]["stealth"]
            if sneaking:
                stealth[s] -= 1
            if watchers and not sneaking:
                state = self._log(state, s, {"kind": "caught", "post": post,
                                             "by": watchers})
                for g in watchers:
                    logs = [list(log) for log in state["logs"]]
                    for note in reversed(logs[g]):
                        if note["kind"] == "guarded" and note["day"] == day:
                            note["saw"] = note["saw"] + [s]
                            break
                    state = {**state, "logs": logs}
                continue
            if post == "store":
                take = min(steal_amount(store), store)
                store -= take
                stolen += take
                thieves.append(s)
                state = self._log(state, s, {"kind": "stole", "food": take,
                                             "sneaked": sneaking})
            else:
                store = max(0, store - 1)
                opened = True
                sleepers = [o for o in standing
                            if roles[o] == "survivor" and posts[o]["post"] == "sleep"]
                if sleepers:
                    hurt = self.rng.choice(sleepers)
                    sit_out[hurt] = day + 1
                    injured.append(hurt)
                state = self._log(state, s, {"kind": "opened", "sneaked": sneaking})

        # Supper: one each; a thief eats what they took
        eaters = [s for s in standing if s not in thieves]
        self.rng.shuffle(eaters)
        hungry = []
        for s in eaters:
            if store > 0:
                store -= 1
            else:
                hungry.append(s)

        hunger = list(state["hunger"])
        weak = [False] * n
        status = list(state["status"])
        fallen = []
        for s in standing:
            if s in hungry:
                hunger[s] += 1
                weak[s] = True
                if hunger[s] >= 2:
                    status[s] = "fallen"
                    fallen.append(s)
            else:
                hunger[s] = 0
        tired = [
            s in standing and posts[s]["post"] != "sleep" for s in range(n)
        ]

        entry = {
            "day": day, "before": before, "after": store,
            "stolen": stolen, "opened": opened, "injured": injured,
            "hungry": sorted(hungry), "fallen": fallen,
            "cough": state.get("cough") == day,
        }
        state = {
            **state, "store": store, "stealth": stealth, "sitOut": sit_out,
            "hunger": hunger, "weak": weak, "tired": tired, "status": status,
            "nights": state["nights"] + [entry], "posts": [None] * n,
        }

        if store == 0 and len(hungry) >= famine_at(n):
            return self._finish(state, "infected" if self.coughed(state) else None,
                                "famine")
        done = self._outnumbered(state)
        if done:
            return done
        if day == DAYS - 1:
            good = sum(1 for s, st in enumerate(status)
                       if st == "ok" and roles[s] == "survivor")
            if good >= rescue_needed(n):
                return self._finish(state, "survivors", "rescue")
            return self._finish(state, "infected", "lateRescue")
        return self._dawn(state)

    def _dawn(self, state):
        """A new day: medicine treats the injured first, then the weak."""
        day = state["day"] + 1
        state = {**state, "day": day}
        medicine = state["medicine"]
        sit_out = list(state["sitOut"])
        weak = list(state["weak"])
        for s in range(state["numPlayers"]):
            if medicine and state["status"][s] == "ok" and sit_out[s] == day:
                sit_out[s] = None
                medicine -= 1
        for s in range(state["numPlayers"]):
            if medicine and state["status"][s] == "ok" and weak[s]:
                weak[s] = False
                medicine -= 1
        state = {**state, "medicine": medicine, "sitOut": sit_out, "weak": weak}
        if self.coughed(state):
            return {**state, "phase": "vote", "votes": [None] * state["numPlayers"]}
        return self._to_search(state)

    def _outnumbered(self, state):
        status = state["status"]
        roles = state["roles"]
        good = sum(1 for s, st in enumerate(status) if st == "ok" and roles[s] == "survivor")
        bad = sum(1 for s, st in enumerate(status) if st == "ok" and roles[s] == "infected")
        if bad and good <= bad:
            return self._finish(state, "infected", "outnumbered")
        return None

    @staticmethod
    def _finish(state, winner, reason):
        n = state["numPlayers"]
        return {**state, "phase": "finished", "winner": winner,
                "winReason": reason, "posts": [None] * n, "votes": [None] * n}

    # ------------------------------------------------------------- result

    def player_outcome(self, state: dict, seat: int) -> dict:
        role = state["roles"][seat]
        return {
            "side": "evil" if role == "infected" else "good",
            "role": role,
            "facts": {"reason": state.get("winReason"), "store": state.get("store", 0)},
        }

    def get_result(self, state: dict) -> dict | None:
        if state["phase"] != "finished":
            return None
        winner = state["winner"]
        if winner is None:
            return {"draw": True}
        role = "survivor" if winner == "survivors" else "infected"
        return {
            "winner": winner,
            "winnerSeats": [s for s, r in enumerate(state["roles"]) if r == role],
        }

    def on_abandon(self, state: dict, seat: int) -> dict:
        if state["phase"] == "finished":
            return state
        return self._finish(state, None, "abandoned")

    # --------------------------------------------------------------- view

    def bot_move(self, view, seat, rng):
        return bot_policy(view, seat, rng)

    def view_for(self, state: dict, seat: int) -> dict:
        n = state["numPlayers"]
        phase = state["phase"]
        finished = phase == "finished"
        seated = 0 <= seat < n
        roles = state["roles"]
        status = state["status"]
        standing = self.standing(state)
        acting = (
            standing if phase in ("vote", "night")
            else self.searchers(state) if phase in ("search", "play")
            else []
        )
        done = {
            "vote": lambda s: state["votes"][s] is not None,
            "search": lambda s: state["places"][s] is not None,
            "play": lambda s: state["plays"][s] is not None,
            "night": lambda s: state["posts"][s] is not None,
        }.get(phase, lambda s: True)
        # Exiled players' roles are public; the rest stay hidden to the end
        revealed = [
            roles[s] if finished or status[s] == "exiled" else None
            for s in range(n)
        ]
        my_role = roles[seat] if seated else None
        coughs = sum(1 for e in state["nights"] if e["cough"])
        if phase == "night" and state.get("cough") == state["day"]:
            coughs += 1
        return {
            "numPlayers": n,
            "phase": phase,
            "day": state["day"],
            "days": DAYS,
            "places": places_for(n),
            "store": state["store"],
            "medicine": state["medicine"],
            "status": status,
            "injured": [state["sitOut"][s] == state["day"] for s in range(n)],
            "weak": state["weak"],
            "infectedTotal": infected_total(n),
            "rescueNeeded": rescue_needed(n),
            "famineAt": famine_at(n),
            "coughs": coughs,
            "roles": revealed,
            # Who still has to act — never what they chose
            "waiting": [s for s in acting if not done(s)],
            "searches": state["searches"],
            "nights": state["nights"],
            "exiles": state["exiles"],
            "myRole": my_role,
            "myStatus": status[seat] if seated else None,
            "myPlace": state["places"][seat] if seated else None,
            "myHand": state["hands"][seat] if seated and phase == "play" else [],
            "myPlay": state["plays"][seat] if seated else None,
            "myPost": state["posts"][seat] if seated else None,
            "myVote": state["votes"][seat] if seated else None,
            "myTired": state["tired"][seat] if seated else False,
            "myStealth": state["stealth"][seat] if seated else 0,
            "canAct": seated and seat in acting and not done(seat),
            "log": state["logs"][seat] if seated else [],
            "winner": state["winner"],
            "winReason": state["winReason"],
        }


game = Shelter()

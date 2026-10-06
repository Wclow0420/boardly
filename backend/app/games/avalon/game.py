"""Double Agent engine — hidden roles, simultaneous votes, team quests.

Shown to players as "Double Agent" with a spy theme (Handler, Bodyguard,
Hitman, Decoy, ...). The internal keys keep the classic role ids the
engine was written with: merlin = Handler, percival = Bodyguard,
servant = Field Agent, assassin = Hitman, morgana = Decoy,
mordred = Sleeper, oberon = Wildcard, minion = Mole. The themed names
live in the app's locale files.

Full state (server only — clients get `view_for`):
{
  "numPlayers": 5,
  "roles": ["merlin", "assassin", ...],     # by seat
  "phase": "team" | "vote" | "quest" | "assassinate" | "finished",
  "quest": 0,                                # current quest index (0-4)
  "leader": 2,                               # seat proposing the team
  "rejections": 0,                           # rejected teams in a row
  "team": [0, 2],                            # proposed / questing seats
  "votes": [true, null, ...],                # by seat, null = not yet
  "questCards": [null, "success", ...],      # by seat, null = not played
  "questResults": [{"team": [..], "fails": 0, "success": true}],
  "history": [{"quest": 0, "leader": 2, "team": [..],
               "votes": [true, false, ...], "approved": true}],
  "assassinTarget": null,
  "winner": null | "good" | "evil",
  "winReason": null | "quests" | "assassination" | "failedQuests"
               | "rejections" | "abandoned"
}

Moves:
  {"type": "propose", "team": [seats]}       leader, phase "team"
  {"type": "vote", "approve": bool}          everyone, phase "vote"
  {"type": "quest", "card": "success"|"fail"}  team members, phase "quest"
  {"type": "assassinate", "target": seat}    the Assassin, phase "assassinate"
"""

import random

from app.games.base import BaseGame, GameError

EVIL_ROLES = {"assassin", "morgana", "mordred", "oberon", "minion"}

# Roles dealt per player count (recommended setups)
ROLE_SETS = {
    5: ["merlin", "percival", "servant", "assassin", "morgana"],
    6: ["merlin", "percival", "servant", "servant", "assassin", "morgana"],
    7: ["merlin", "percival", "servant", "servant", "assassin", "morgana", "oberon"],
    8: ["merlin", "percival", "servant", "servant", "servant",
        "assassin", "morgana", "minion"],
    9: ["merlin", "percival", "servant", "servant", "servant", "servant",
        "assassin", "morgana", "mordred"],
    10: ["merlin", "percival", "servant", "servant", "servant", "servant",
         "assassin", "morgana", "mordred", "oberon"],
}

# Team size for each of the five quests
QUEST_SIZES = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
}

MAX_REJECTIONS = 5
QUESTS_TO_WIN = 3


def is_evil(role: str) -> bool:
    return role in EVIL_ROLES


def fails_required(num_players: int, quest: int) -> int:
    """Fail cards needed to fail a quest: two on the 4th quest with 7+."""
    return 2 if num_players >= 7 and quest == 3 else 1


class Avalon(BaseGame):
    key = "avalon"
    name = "Double Agent"
    min_players = 5
    max_players = 10
    emoji = "🕵️"
    tile_color = "#EDE4FF"
    category = "party"
    tag = "party"

    def initial_state(self, num_players: int, rng: random.Random | None = None) -> dict:
        if num_players not in ROLE_SETS:
            raise GameError("This game needs 5 to 10 players")
        rng = rng or random.SystemRandom()
        roles = list(ROLE_SETS[num_players])
        rng.shuffle(roles)
        return {
            "numPlayers": num_players,
            "roles": roles,
            "phase": "team",
            "quest": 0,
            "leader": rng.randrange(num_players),
            "rejections": 0,
            "team": [],
            "votes": [None] * num_players,
            "questCards": [None] * num_players,
            "questResults": [],
            "history": [],
            "assassinTarget": None,
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
            "propose": self._propose,
            "vote": self._vote,
            "quest": self._quest,
            "assassinate": self._assassinate,
        }
        handler = handlers.get(move.get("type"))
        if handler is None:
            raise GameError("Unknown move type")
        return handler(state, seat, move)

    def _propose(self, state, seat, move):
        if state["phase"] != "team":
            raise GameError("Not choosing a team right now")
        if seat != state["leader"]:
            raise GameError("Only the leader picks the team")

        n = state["numPlayers"]
        team = move.get("team")
        size = QUEST_SIZES[n][state["quest"]]
        if (
            not isinstance(team, list)
            or len(team) != size
            or len(set(team)) != size
            or not all(type(s) is int and 0 <= s < n for s in team)
        ):
            raise GameError(f"Pick exactly {size} different players")

        return {
            **state,
            "phase": "vote",
            "team": sorted(team),
            "votes": [None] * n,
        }

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
        approved = sum(votes) * 2 > n  # strict majority; ties reject
        history = state["history"] + [
            {
                "quest": state["quest"],
                "leader": state["leader"],
                "team": state["team"],
                "votes": votes,
                "approved": approved,
            }
        ]
        state = {**state, "votes": votes, "history": history}

        if approved:
            return {
                **state,
                "phase": "quest",
                "rejections": 0,
                "questCards": [None] * n,
            }

        rejections = state["rejections"] + 1
        if rejections >= MAX_REJECTIONS:
            return self._finish(
                {**state, "rejections": rejections}, "evil", "rejections"
            )
        return {
            **state,
            "phase": "team",
            "rejections": rejections,
            "leader": (state["leader"] + 1) % n,
            "team": [],
        }

    def _quest(self, state, seat, move):
        if state["phase"] != "quest":
            raise GameError("No quest in progress")
        if seat not in state["team"]:
            raise GameError("You are not on this quest")
        if state["questCards"][seat] is not None:
            raise GameError("You already played your card")
        card = move.get("card")
        if card not in ("success", "fail"):
            raise GameError("Card must be success or fail")
        if card == "fail" and not is_evil(state["roles"][seat]):
            raise GameError("Agents must play Success")

        cards = list(state["questCards"])
        cards[seat] = card
        if any(cards[s] is None for s in state["team"]):
            return {**state, "questCards": cards}

        n = state["numPlayers"]
        fails = sum(1 for s in state["team"] if cards[s] == "fail")
        success = fails < fails_required(n, state["quest"])
        results = state["questResults"] + [
            {"team": state["team"], "fails": fails, "success": success}
        ]
        # Played cards are wiped: only the fail count is ever public
        state = {**state, "questCards": [None] * n, "questResults": results}

        if sum(1 for r in results if not r["success"]) >= QUESTS_TO_WIN:
            return self._finish(state, "evil", "failedQuests")
        if sum(1 for r in results if r["success"]) >= QUESTS_TO_WIN:
            # Evil's last chance: name Merlin
            return {**state, "phase": "assassinate", "team": []}
        return {
            **state,
            "phase": "team",
            "quest": state["quest"] + 1,
            "leader": (state["leader"] + 1) % n,
            "team": [],
        }

    def _assassinate(self, state, seat, move):
        if state["phase"] != "assassinate":
            raise GameError("Not time for the assassination")
        if state["roles"][seat] != "assassin":
            raise GameError("Only the Hitman can do this")
        target = move.get("target")
        n = state["numPlayers"]
        if type(target) is not int or not 0 <= target < n:
            raise GameError("Pick a player")
        if is_evil(state["roles"][target]):
            raise GameError("Pick an agent")

        state = {**state, "assassinTarget": target}
        if state["roles"][target] == "merlin":
            return self._finish(state, "evil", "assassination")
        return self._finish(state, "good", "quests")

    @staticmethod
    def _finish(state, winner, reason):
        return {**state, "phase": "finished", "winner": winner, "winReason": reason}

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
        evil_seats = [s for s, role in enumerate(roles) if is_evil(role)]

        return {
            "numPlayers": n,
            "phase": phase,
            "quest": state["quest"],
            "leader": state["leader"],
            "rejections": state["rejections"],
            "team": state["team"],
            "questSizes": QUEST_SIZES[n],
            "failsRequired": [fails_required(n, q) for q in range(5)],
            "questResults": state["questResults"],
            "history": state["history"],
            "rolesInGame": sorted(roles),
            # Who has acted — never what they chose
            "voted": [v is not None for v in state["votes"]],
            "questPlayed": [
                s for s in state["team"] if state["questCards"][s] is not None
            ],
            "myVote": state["votes"][seat] if seated and phase == "vote" else None,
            "myCard": state["questCards"][seat] if seated else None,
            "myRole": my_role,
            "known": self._known(roles, seat) if seated else [],
            # Evil reveals itself for the assassination discussion
            "evilSeats": evil_seats if phase == "assassinate" or finished else None,
            "assassinSeat": roles.index("assassin")
            if phase == "assassinate" or finished
            else None,
            "assassinTarget": state["assassinTarget"],
            "winner": state["winner"],
            "winReason": state["winReason"],
            "roles": roles if finished else None,
        }

    @staticmethod
    def _known(roles, seat):
        """What this seat learned during the night phase."""
        me = roles[seat]
        if me == "merlin":
            # Sees evil, except Mordred
            return [
                {"seat": s, "as": "evil"}
                for s, role in enumerate(roles)
                if is_evil(role) and role != "mordred"
            ]
        if me == "percival":
            # Sees Merlin and Morgana, indistinguishable
            return [
                {"seat": s, "as": "merlin"}
                for s, role in enumerate(roles)
                if role in ("merlin", "morgana")
            ]
        if is_evil(me) and me != "oberon":
            # Evil know each other, except Oberon
            return [
                {"seat": s, "as": "evil"}
                for s, role in enumerate(roles)
                if s != seat and is_evil(role) and role != "oberon"
            ]
        return []


game = Avalon()

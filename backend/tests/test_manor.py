"""Midnight Manor engine tests (pure) plus API tests for the hidden
information the room plumbing must keep per player."""

import json
import random

import pytest

from app.games.base import GameError
from app.games.manor.game import (
    BEDROOM,
    CAMERA_ROOMS,
    HALL,
    HOURS,
    ROLE_SETS,
    SECURITY,
    Manor,
    is_evil,
    neighbors,
)

KITCHEN, LIBRARY, STUDY, CELLAR, FOYER = 3, 1, 0, 6, 7


class FirstChoice(random.Random):
    """The old man stays put and ties go to the first in line."""

    def choice(self, seq):
        return seq[0]


game = Manor(FirstChoice())

# seat:      0         1        2        3           4
ROLES_5 = ["butler", "guard", "guest", "intruder", "intruder"]


def start(roles=ROLES_5):
    state = game.initial_state(len(roles), random.Random(1))
    n = len(roles)
    return {**state, "roles": list(roles), "carrying": [None] * n,
            "items": {"knife": KITCHEN, "candlestick": LIBRARY, "poison": CELLAR}}


def place(state, rooms, owner=None):
    """Put players (and the old man) straight into rooms."""
    state = {**state, "positions": list(rooms)}
    if owner is not None:
        state = {**state, "owner": {**state["owner"], "room": owner,
                                    "startRoom": owner}}
    return state


def move_all(state, rooms=None):
    rooms = rooms or {}
    for s, here in enumerate(state["positions"]):
        if here is not None:
            state = game.apply_move(state, s, {"type": "move",
                                               "room": rooms.get(s, here)})
    return state


def act_all(state, acts=None):
    acts = acts or {}
    for s, here in enumerate(state["positions"]):
        if here is not None:
            state = game.apply_move(state, s, {"type": "act",
                                               **acts.get(s, {"action": "wait"})})
    return state


def hour(state, rooms=None, acts=None):
    return act_all(move_all(state, rooms), acts)


def accuse_all(state, targets):
    for s, here in enumerate(state["positions"]):
        if here is not None:
            state = game.apply_move(state, s, {"type": "accuse",
                                               "target": targets.get(s)})
    return state


# ---------------------------------------------------------------- setup


@pytest.mark.parametrize("n", range(4, 9))
def test_setup_for_every_player_count(n):
    state = game.initial_state(n, random.Random(n))
    assert sorted(state["roles"]) == sorted(ROLE_SETS[n])
    assert state["roles"].count("butler") == 1
    assert state["roles"].count("guard") == 1
    assert sum(is_evil(r) for r in state["roles"]) == {4: 1, 5: 2, 6: 2, 7: 3, 8: 3}[n]
    assert state["positions"] == [HALL] * n
    assert state["owner"]["room"] == BEDROOM and state["owner"]["hp"] == 2
    assert all(state["cameras"][r] is False for r in CAMERA_ROOMS)
    assert state["phase"] == "move" and state["hour"] == 0
    assert game.get_result(state) is None


def test_a_lone_intruder_starts_with_the_knife():
    state = game.initial_state(4, random.Random(2))
    intruder = state["roles"].index("intruder")
    assert state["carrying"][intruder] == "knife"
    assert state["items"]["knife"] is None
    five = game.initial_state(5, random.Random(2))
    assert five["carrying"] == [None] * 5


def test_rejects_unsupported_player_counts():
    for n in (3, 9):
        with pytest.raises(GameError):
            game.initial_state(n)


def test_floor_plan_is_a_three_by_three_grid():
    assert sorted(neighbors(HALL)) == [1, 3, 5, 7]
    assert sorted(neighbors(0)) == [1, 3]
    assert sorted(neighbors(8)) == [5, 7]


# ------------------------------------------------------------- moving


def test_move_waits_for_everyone_then_reveals_the_room():
    state = start()
    state = game.apply_move(state, 0, {"type": "move", "room": KITCHEN})
    assert state["phase"] == "move"
    assert state["positions"][0] == HALL  # nothing happens until all are in
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "move", "room": KITCHEN})
    state = move_all({**state, "orders": [None] * 5}, {0: KITCHEN, 3: KITCHEN})
    assert state["phase"] == "act"
    assert state["positions"] == [KITCHEN, HALL, HALL, KITCHEN, HALL]
    # In the dark you only know someone else is there — not who, not how many
    assert game.view_for(state, 0)["someoneHere"] is True
    assert game.view_for(state, 1)["someoneHere"] is True
    assert "othersHere" not in game.view_for(state, 1)
    assert "roommates" not in game.view_for(state, 0)


def test_only_one_step_at_a_time():
    state = start()
    for room in (BEDROOM, 8, 0, 99, "hall", None):
        with pytest.raises(GameError):
            game.apply_move(state, 0, {"type": "move", "room": room})


def test_intruders_slip_into_any_room():
    state = game.apply_move(start(), 3, {"type": "move", "room": 8})
    assert state["orders"][3] == {"room": 8}
    with pytest.raises(GameError):
        game.apply_move(start(), 3, {"type": "move", "room": 9})


def test_nobody_stays_in_the_security_room():
    state = place(start(), [SECURITY, HALL, HALL, SECURITY, HALL])
    for seat in (0, 3):
        with pytest.raises(GameError):
            game.apply_move(state, seat, {"type": "move", "room": SECURITY})
    state = move_all(state, {0: HALL, 3: 8, 1: SECURITY})
    assert state["positions"][:2] == [HALL, SECURITY]


def test_the_old_man_wanders_at_most_one_room():
    wanderer = Manor(random.Random(7))
    state = start()
    seen = set()
    for _ in range(40):
        before = state["owner"]["room"]
        state = {**state, "phase": "move", "orders": [None] * 5}
        state = wanderer._resolve_move(
            {**state, "orders": [{"room": HALL}] * 5}
        )
        after = state["owner"]["room"]
        assert after == before or after in neighbors(before)
        seen.add(after)
    assert len(seen) > 2


def test_escort_leads_the_old_man():
    state = place(start(), [BEDROOM, HALL, HALL, HALL, HALL], owner=BEDROOM)
    state = move_all(state)
    state = act_all(state, {0: {"action": "escort"}})
    assert game.view_for(state, 0)["followingMe"] is True
    state = hour(state, {0: 5})
    assert state["owner"]["room"] == 5


# ------------------------------------------------------------ attacks


def test_unguarded_attack_wounds_and_calls_a_meeting():
    state = place(start(), [HALL, HALL, HALL, BEDROOM, HALL], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "knife", None]}
    state = hour(state, acts={3: {"action": "attack"}})
    assert state["owner"]["hp"] == 1
    assert state["phase"] == "gathering"
    assert {"hour": 0, "kind": "scream", "room": BEDROOM} in state["events"]
    assert state["logs"][3][-1]["attack"] == "hit"


def test_second_hit_kills_and_intruders_win():
    state = place(start(), [HALL, HALL, HALL, BEDROOM, BEDROOM], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "knife", "poison"],
             "owner": {**state["owner"], "hp": 1}}
    state = hour(state, acts={3: {"action": "attack"}})
    assert state["phase"] == "finished"
    assert state["winner"] == "evil" and state["winReason"] == "killed"
    assert game.get_result(state) == {"winner": "evil", "winnerSeats": [3, 4]}


def test_guards_block_as_many_attackers():
    state = place(start(), [BEDROOM, BEDROOM, HALL, BEDROOM, BEDROOM], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "knife", "poison"]}
    # two attackers against one guard: hit
    hit = hour(state, acts={0: {"action": "guard"}, 3: {"action": "attack"},
                            4: {"action": "attack"}})
    assert hit["owner"]["hp"] == 1
    # two against two: blocked, and everyone there knows something happened
    blocked = hour(state, acts={0: {"action": "guard"}, 1: {"action": "guard"},
                                3: {"action": "attack"}, 4: {"action": "attack"}})
    assert blocked["owner"]["hp"] == 2
    assert blocked["phase"] == "move"
    assert blocked["logs"][0][-1]["attack"] == "blocked"
    assert not any(e["kind"] == "scream" for e in blocked["events"])


def test_attack_rules():
    state = place(start(), [BEDROOM, HALL, HALL, BEDROOM, HALL], owner=BEDROOM)
    state = move_all(state)
    with pytest.raises(GameError):  # guests can't
        game.apply_move(state, 0, {"type": "act", "action": "attack"})
    with pytest.raises(GameError):  # unarmed
        game.apply_move(state, 3, {"type": "act", "action": "attack"})
    with pytest.raises(GameError):  # he isn't in the hall
        game.apply_move(state, 1, {"type": "act", "action": "guard"})


# -------------------------------------------------------------- items


def test_take_swaps_and_ties_go_to_one_player():
    state = place(start(), [KITCHEN, HALL, HALL, KITCHEN, HALL], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "poison", None],
             "items": {"knife": KITCHEN, "candlestick": LIBRARY, "poison": None}}
    state = hour(state, acts={0: {"action": "take", "item": "knife"},
                              3: {"action": "take", "item": "knife"}})
    assert state["carrying"][0] == "knife"
    assert state["carrying"][3] == "poison"
    assert state["logs"][3][-1]["took"] is None

    with pytest.raises(GameError):  # nothing left to take
        game.apply_move(move_all(state), 3,
                        {"type": "act", "action": "take", "item": "knife"})


def test_a_search_in_the_dark_only_feels_something():
    state = place(start(), [KITCHEN, HALL, KITCHEN, KITCHEN, HALL], owner=BEDROOM)
    state = {**state, "carrying": [None, None, "candlestick", "knife", None]}
    state = hour(state, acts={0: {"action": "search"}})
    # a random person in the room (here the first); not who, not what
    assert state["logs"][0][-1]["search"] == {"found": True}
    assert state["logs"][0][-1]["company"] is True
    with pytest.raises(GameError):  # nobody else in the study
        game.apply_move(move_all(place(state, [STUDY] + state["positions"][1:])),
                        0, {"type": "act", "action": "search"})


def test_the_guard_sees_who_and_what():
    state = place(start(), [HALL, KITCHEN, HALL, KITCHEN, HALL], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "knife", None]}
    state = hour(state, acts={1: {"action": "search"}})
    assert state["logs"][1][-1]["search"] == {"target": 3, "item": "knife"}


def test_the_flashlight_shows_who_is_here_and_what_they_do():
    state = place(start(), [HALL, KITCHEN, KITCHEN, KITCHEN, HALL], owner=BEDROOM)
    state = hour(state, acts={1: {"action": "flashlight"},
                              2: {"action": "fix"},
                              3: {"action": "take", "item": "knife"}})
    assert state["logs"][1][-1]["seen"] == [
        {"seat": 2, "action": "fix"},
        {"seat": 3, "action": "take", "item": "knife"},
    ]
    with pytest.raises(GameError):  # only the guard has one
        game.apply_move(move_all(state), 2, {"type": "act", "action": "flashlight"})


def test_an_intruder_hides_a_weapon_once_for_one_hour():
    state = place(start(), [HALL, KITCHEN, HALL, KITCHEN, HALL], owner=BEDROOM)
    state = {**state, "carrying": [None, None, None, "knife", None]}
    hidden = hour(state, acts={1: {"action": "search"},
                               3: {"action": "wait", "hide": True}})
    assert hidden["logs"][1][-1]["search"] == {"target": 3, "item": None}
    assert game.view_for(hidden, 3)["hideUsed"] is True
    with pytest.raises(GameError):  # once a game
        game.apply_move(move_all(hidden), 3,
                        {"type": "act", "action": "wait", "hide": True})
    # the next hour it's found again
    found = hour(hidden, acts={1: {"action": "search"}})
    assert found["logs"][1][-1]["search"] == {"target": 3, "item": "knife"}
    with pytest.raises(GameError):  # only intruders, only with a weapon
        game.apply_move(move_all(state), 2,
                        {"type": "act", "action": "wait", "hide": True})


# ------------------------------------------------------------ cameras


def test_fixed_camera_shows_who_was_there_not_what_they_did():
    state = place(start(), [KITCHEN, HALL, HALL, KITCHEN, HALL], owner=BEDROOM)
    state = hour(state, {1: SECURITY},
                 acts={0: {"action": "fix"}, 1: {"action": "watch"}})
    assert state["cameras"][KITCHEN] is True
    assert state["events"] == []  # nobody is told it came on
    feed = state["logs"][1][-1]["footage"]
    assert [f["room"] for f in feed] == [KITCHEN]
    assert feed[0]["seats"] == [0, 3]
    assert "actions" not in feed[0]
    assert "footage" not in state["logs"][0][-1]


def test_a_broken_camera_still_shows_who_was_there_last():
    state = place(start(), [HALL, HALL, HALL, KITCHEN, HALL], owner=BEDROOM)
    cameras = list(state["cameras"])
    cameras[KITCHEN] = True
    state = {**state, "cameras": cameras}
    state = hour(state, {0: KITCHEN, 1: SECURITY},
                 acts={3: {"action": "break"}, 1: {"action": "watch"}})
    assert state["cameras"][KITCHEN] is False
    assert state["events"] == []  # nobody is told it went dark
    feed = state["logs"][1][-1]["footage"][0]
    assert feed["seats"] == [0, 3] and feed["entered"] == [0]
    assert "break" not in json.dumps(feed)  # not who broke it


def test_camera_rules():
    state = move_all(place(start(), [KITCHEN, HALL, HALL, KITCHEN, HALL]))
    with pytest.raises(GameError):  # guests can't break
        game.apply_move(state, 0, {"type": "act", "action": "break"})
    with pytest.raises(GameError):  # already broken
        game.apply_move(state, 3, {"type": "act", "action": "break"})
    with pytest.raises(GameError):  # the hall has no camera
        game.apply_move(state, 1, {"type": "act", "action": "fix"})
    with pytest.raises(GameError):  # monitors are in the security room
        game.apply_move(state, 0, {"type": "act", "action": "watch"})


# ----------------------------------------------------------- meetings


def test_meetings_follow_the_third_and_sixth_hours():
    state = start()
    for _ in range(3):
        state = hour(state)
    assert state["phase"] == "gathering" and state["hour"] == 2
    state = accuse_all(state, {})
    assert state["phase"] == "move" and state["hour"] == 3
    assert state["events"][-1] == {"hour": 2, "kind": "gathering",
                                   "votes": [None] * 5, "locked": None}


def test_majority_locks_someone_up_and_they_sit_out():
    state = {**start(), "hour": 2, "phase": "gathering"}
    state = accuse_all(state, {0: 1, 1: 0, 2: 1, 3: 1, 4: 2})
    assert state["events"][-1]["locked"] == 1
    assert state["positions"][1] is None
    assert game.view_for(state, 0)["locked"] == [1]
    with pytest.raises(GameError):
        game.apply_move(state, 1, {"type": "move", "room": HALL})
    state = move_all(state)  # four players are enough to move on
    assert state["phase"] == "act"


def test_no_majority_locks_nobody():
    state = {**start(), "hour": 2, "phase": "gathering"}
    state = accuse_all(state, {0: 3, 1: 3, 2: 4, 3: 1, 4: 1})
    assert state["events"][-1]["locked"] is None
    assert None not in state["positions"]


def test_locking_up_every_intruder_wins_for_the_household():
    state = {**start(), "hour": 2, "phase": "gathering",
             "positions": [HALL, HALL, HALL, HALL, None]}
    state = accuse_all(state, {0: 3, 1: 3, 2: 3})
    assert state["winner"] == "good" and state["winReason"] == "caught"
    assert game.get_result(state)["winnerSeats"] == [0, 1, 2]


# --------------------------------------------------------------- dawn


def _dawn():
    state = start()
    for h in range(HOURS):
        state = hour(state)
        if state["phase"] == "gathering":
            state = accuse_all(state, {})
    assert state["phase"] == "guess"
    return state


def test_dawn_brings_the_intruders_last_chance():
    state = _dawn()
    view = game.view_for(state, 1)
    assert view["intruders"] == [3, 4] and view["ringleader"] == 3
    with pytest.raises(GameError):  # only the ringleader
        game.apply_move(state, 4, {"type": "guess", "target": 0})
    with pytest.raises(GameError):  # must name a household member
        game.apply_move(state, 3, {"type": "guess", "target": 4})

    found = game.apply_move(state, 3, {"type": "guess", "target": 0})
    assert found["winner"] == "evil" and found["winReason"] == "butlerFound"
    missed = game.apply_move(state, 3, {"type": "guess", "target": 2})
    assert missed["winner"] == "good" and missed["winReason"] == "dawn"
    assert game.get_result(missed)["winnerSeats"] == [0, 1, 2]


def test_abandoned_game_has_no_winner():
    state = game.on_abandon(start(), 2)
    assert state["phase"] == "finished"
    assert game.get_result(state) == {"draw": True}
    assert game.view_for(state, 1)["roles"] == ROLES_5


# --------------------------------------------------------------- view


def test_view_keeps_secrets():
    state = place(start(), [STUDY, HALL, HALL, KITCHEN, HALL], owner=8)
    state = {**state, "carrying": [None, None, None, "knife", None]}
    state = move_all(state)
    state = game.apply_move(state, 3, {"type": "act", "action": "wait"})

    guest = game.view_for(state, 2)
    text = json.dumps(guest)
    assert guest["roles"] is None and guest["intruders"] is None
    assert guest["ownerSeenAt"] is None and guest["ownerRoom"] is None
    assert '"intruder"' not in text and '"knife"' not in text
    assert guest["ready"] == [False, False, False, True, False]
    assert guest["myOrder"] is None

    butler = game.view_for(state, 0)
    assert butler["myRole"] == "butler" and butler["ownerSeenAt"] == 8

    intruder = game.view_for(state, 3)
    assert intruder["intruders"] == [3, 4] and intruder["myItem"] == "knife"
    assert intruder["myOrder"] == {"action": "wait"}

    spectator = game.view_for(state, -1)
    assert spectator["myRole"] is None and spectator["log"] == []
    assert spectator["someoneHere"] is False


# ------------------------------------------------------------------ API


def _table(client, make_user, n=4):
    users = [make_user(f"guest{i}") for i in range(n)]
    room = client.post(
        "/api/v1/rooms", json={"gameType": "manor"}, headers=users[0]["headers"]
    ).get_json()["room"]
    for user in users[1:]:
        client.post("/api/v1/rooms/join", json={"code": room["code"]},
                    headers=user["headers"])
        client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True},
                    headers=user["headers"])
    return users, room


def _view(client, room, user):
    return client.get(
        f"/api/v1/rooms/code/{room['code']}", headers=user["headers"]
    ).get_json()["room"]["session"]["state"]


def test_api_plays_an_hour_with_private_views(client, make_user):
    users, room = _table(client, make_user)
    started = client.post(f"/api/v1/rooms/{room['id']}/start",
                          headers=users[0]["headers"])
    assert started.status_code == 201

    views = [_view(client, room, u) for u in users]
    assert sorted(v["myRole"] for v in views) == sorted(ROLE_SETS[4])
    assert all(v["roles"] is None for v in views)

    for user in users:
        res = client.post(f"/api/v1/rooms/{room['id']}/move",
                          json={"move": {"type": "move", "room": HALL}},
                          headers=user["headers"])
        assert res.status_code == 200
    state = _view(client, room, users[0])
    assert state["phase"] == "act"
    assert state["someoneHere"] is True


def test_you_only_see_a_camera_from_its_room_or_the_monitors():
    state = place(start(), [KITCHEN, HALL, HALL, HALL, HALL], owner=BEDROOM)
    state = hour(state, acts={0: {"action": "fix"}})
    assert state["cameras"][KITCHEN] is True
    assert game.view_for(state, 0)["cameras"][KITCHEN] is True  # the fixer
    assert game.view_for(state, 2)["cameras"][KITCHEN] is False  # elsewhere

    # walking into the Security Room shows every camera
    state = move_all(state, {2: SECURITY})
    assert game.view_for(state, 2)["cameras"][KITCHEN] is True
    # and you remember what you saw after you leave
    state = act_all(state)
    state = move_all(state, {2: HALL})
    assert game.view_for(state, 2)["cameras"][KITCHEN] is True
    assert game.view_for(state, 1)["cameras"][KITCHEN] is False

    # spectators never see the real cameras mid-game
    assert game.view_for(state, -1)["cameras"][KITCHEN] is False

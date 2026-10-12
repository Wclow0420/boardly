"""Seal the Manor engine tests (pure) plus an API test for the hidden
information the room plumbing must keep per player."""

import json
import random

import pytest

from app.games.base import GameError
from app.games.nightwatch.game import (
    BELLTOWER,
    CELLAR,
    CHAPEL,
    DINING,
    EVENTS,
    GALLERY,
    GARDEN,
    HALL,
    KITCHEN,
    MISSION_SIZES,
    ROLE_SETS,
    STUDY,
    Nightwatch,
    assassin_seat,
    diagonals,
    fails_required,
    is_evil,
    links,
    within,
)


class FirstChoice(random.Random):
    """Draws take the first option and shuffles leave things be."""

    def choice(self, seq):
        return seq[0]

    def shuffle(self, x):
        pass


game = Nightwatch(FirstChoice())

# seat:      0          1             2          3         4         5
ROLES_6 = ["prophet", "apprentice", "tracker", "keeper", "double", "hermit"]


def start(roles=ROLES_6, rooms=(STUDY, GARDEN), leader=0, deck=None):
    state = game.initial_state(len(roles), FirstChoice())
    n = len(roles)
    return {
        **state,
        "roles": list(roles),
        "abilityLeft": [{"tracker": 2, "double": 2, "keeper": 1}.get(r, 0)
                        for r in roles],
        "missionRooms": list(rooms),
        "nextLeader": leader,
        "eventDeck": list(deck or ["calm"] * 4),
        "positions": [HALL] * n,
    }


def ready_all(state, locks=None):
    locks = locks or {}
    for s in range(state["numPlayers"]):
        move = {"type": "ready"}
        if s in locks:
            move["lock"] = locks[s]
        state = game.apply_move(state, s, move)
    return state


def patrol_all(state, orders=None):
    """Everyone patrols; a bare room number means go there."""
    orders = orders or {}
    for s in range(state["numPlayers"]):
        order = orders.get(s, state["positions"][s])
        if isinstance(order, int):
            order = {"room": order}
        state = game.apply_move(state, s, {"type": "patrol", **order})
    return state


def room_all(state, orders=None):
    orders = orders or {}
    for s in range(state["numPlayers"]):
        state = game.apply_move(state, s, {"type": "room", **orders.get(s, {})})
    return state


def night(state, patrol=None, rooms=None, locks=None):
    """Announcement, patrol and room functions: ends at the team phase."""
    return room_all(patrol_all(ready_all(state, locks), patrol), rooms)


def vote_all(state, approve=True, no=()):
    for s in range(state["numPlayers"]):
        state = game.apply_move(state, s, {"type": "vote",
                                           "approve": approve and s not in no})
    return state


def send(state, team, cards=None):
    """Propose `team`, approve it and play the cards (default success)."""
    cards = cards or {}
    state = game.apply_move(state, state["leader"],
                            {"type": "propose", "team": team})
    state = vote_all(state)
    if state["phase"] != "mission":
        return state
    for s in team:
        state = game.apply_move(state, s, {"type": "mission",
                                           "card": cards.get(s, "success")})
    return state


def notes(state, seat, kind):
    return [n for n in state["logs"][seat] if n["kind"] == kind]


def last_patrol(state, seat):
    return notes(state, seat, "patrol")[-1]


# ---------------------------------------------------------------- setup


@pytest.mark.parametrize("n", sorted(ROLE_SETS))
def test_setup_for_every_player_count(n):
    state = Nightwatch().initial_state(n)
    roles = state["roles"]
    assert sorted(roles) == sorted(ROLE_SETS[n])
    evil = sum(is_evil(r) for r in roles)
    assert evil == {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4}[n]
    assert state["phase"] == "announce"
    assert state["positions"] == [HALL] * n
    first, second = state["missionRooms"]
    assert HALL not in (first, second) and first != second
    assert sorted(state["eventDeck"]) == sorted(EVENTS)
    assert state["nightEvents"] == [None]


def test_rejects_unsupported_player_counts():
    for n in (4, 11):
        with pytest.raises(GameError):
            game.initial_state(n)


def test_mission_table_and_double_fail_round():
    assert MISSION_SIZES[5] == [2, 3, 2, 3, 3]
    assert MISSION_SIZES[7] == [2, 3, 3, 4, 4]
    assert MISSION_SIZES[10] == [3, 4, 4, 5, 5]
    assert fails_required(7, 3) == 2
    assert fails_required(6, 3) == 1
    assert fails_required(7, 2) == 1


def test_mission_rooms_are_never_the_hall_or_repeated():
    rng = random.Random(3)
    for _ in range(50):
        state = Nightwatch(rng).initial_state(5)
        state = {**state, "eventDeck": ["calm"] * 4}
        rooms = state["missionRooms"]
        for r in range(4):
            state = Nightwatch(rng)._next_round({**state, "results": []})
            rooms = state["missionRooms"]
        assert len(rooms) == 5
        assert HALL not in rooms
        assert all(a != b for a, b in zip(rooms, rooms[1:]))


# ------------------------------------------------------------ knowledge


def test_night_knowledge():
    state = start()
    prophet = game.view_for(state, 0)
    # The Hermit hides from the Prophet
    assert prophet["known"] == [{"seat": 4, "as": "evil"}]
    apprentice = game.view_for(state, 1)
    assert apprentice["known"] == [{"seat": 0, "as": "prophet"},
                                   {"seat": 4, "as": "prophet"}]
    hermit = game.view_for(state, 5)
    assert hermit["known"] == [{"seat": 4, "as": "evil"}]
    assert hermit["assassinSeat"] == 4
    assert game.view_for(state, 2)["known"] == []
    assert game.view_for(state, 2)["assassinSeat"] is None
    assert assassin_seat(ROLES_6) == 4


# --------------------------------------------------------- announcement


def test_the_keeper_locks_a_door_and_only_the_door_is_announced():
    state = start()
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "ready", "lock": [HALL, GALLERY]})
    state = game.apply_move(state, 3, {"type": "ready",
                                       "lock": [HALL, GALLERY]})
    # Nothing shows until everyone is ready, and never who
    assert state["lockedDoor"] is None
    assert game.view_for(state, 0)["myOrder"] is None
    for s in (0, 1, 2, 4, 5):
        state = game.apply_move(state, s, {"type": "ready"})
    assert state["phase"] == "patrol"
    assert state["lockedDoor"] == [GALLERY, HALL]
    assert state["timeline"][-1] == {"round": 0, "kind": "lock",
                                     "rooms": [GALLERY, HALL]}
    assert state["abilityLeft"][3] == 0
    # Nobody walks through it tonight
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "patrol", "room": GALLERY})


def test_the_keeper_locks_once_and_only_real_doors():
    state = start()
    with pytest.raises(GameError):
        game.apply_move(state, 3, {"type": "ready", "lock": [BELLTOWER, HALL]})
    state = {**state, "abilityLeft": [0, 0, 2, 0, 2, 0]}
    with pytest.raises(GameError):
        game.apply_move(state, 3, {"type": "ready", "lock": [HALL, GALLERY]})


def test_keeper_has_a_choice_in_their_view():
    state = start()
    assert [3, 4] in game.view_for(state, 3)["doorOptions"]
    assert game.view_for(state, 0)["doorOptions"] == []


# --------------------------------------------------------------- patrol


def test_patrol_is_one_step_and_secret():
    state = ready_all(start())
    assert game.view_for(state, 0)["patrolRooms"] == [1, 3, 4, 5, 7]
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "patrol", "room": BELLTOWER})
    state = game.apply_move(state, 0, {"type": "patrol", "room": KITCHEN})
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "patrol", "room": HALL})
    assert game.view_for(state, 1)["ready"] == [True] + [False] * 5
    assert game.view_for(state, 1)["myOrder"] is None


def test_you_see_who_shares_your_room():
    state = patrol_all(ready_all(start()), {0: KITCHEN, 1: KITCHEN, 2: STUDY})
    assert state["phase"] == "room"
    assert last_patrol(state, 0)["seen"] == [1]
    assert last_patrol(state, 2)["seen"] == []
    assert last_patrol(state, 2)["company"] is False
    assert last_patrol(state, 3)["seen"] == [4, 5]


def test_insomnia_storm_and_collapse():
    state = {**start(), "nightEvents": ["insomnia"]}
    state = ready_all(state)
    assert game.view_for(state, 0)["patrolRooms"] == list(range(9))

    state = {**start(), "positions": [BELLTOWER] * 6, "nightEvents": ["storm"]}
    state = ready_all(state)
    assert game.view_for(state, 0)["patrolRooms"] == [BELLTOWER]
    with pytest.raises(GameError):
        game.apply_move(state, 2, {"type": "patrol", "track": 0})

    state = {**start(), "collapsed": [GALLERY]}
    state = ready_all(state)
    assert GALLERY not in game.view_for(state, 0)["patrolRooms"]


def test_secret_doors_join_diagonal_rooms():
    assert [0, 4] in diagonals() and len(diagonals()) == 8
    adj = links([], [[BELLTOWER, HALL]])
    assert HALL in adj[BELLTOWER]
    assert DINING in within(adj, BELLTOWER, 2)
    assert GARDEN not in within(adj, BELLTOWER, 2)
    # A sealed room is a wall
    assert within(links([STUDY, GALLERY], []), BELLTOWER, 2) == {BELLTOWER}


def test_the_tracker_follows_someone_any_distance():
    state = {**start(), "positions": [GARDEN, HALL, BELLTOWER, HALL, HALL, HALL]}
    state = patrol_all(ready_all(state), {0: DINING, 2: {"track": 0}})
    assert state["positions"][2] == DINING
    assert last_patrol(state, 2)["tracked"] == 0
    assert last_patrol(state, 2)["seen"] == [0]
    assert state["abilityLeft"][2] == 1


# ----------------------------------------------------------- the Double


def test_the_double_hides_at_the_real_room_and_shows_at_the_decoy():
    # The rulebook's example: the Double writes in the Gallery while a
    # decoy keeps the Prophet company in the Hall; the Tracker follows
    # the Double into an empty Gallery.
    state = patrol_all(ready_all(start()), {
        4: {"room": GALLERY, "fake": HALL},
        2: {"track": 4},
        1: STUDY,
        3: KITCHEN,
        5: DINING,
    })
    assert state["positions"][4] == GALLERY
    assert state["positions"][2] == GALLERY
    assert last_patrol(state, 2)["seen"] == []        # sees nobody
    assert last_patrol(state, 4)["seen"] == [2]       # the Double sees them
    assert last_patrol(state, 0)["seen"] == [4]       # the decoy
    assert state["fn"][4] == "gallery"
    assert state["abilityLeft"][4] == 1


def test_decoy_rules():
    state = ready_all(start())
    with pytest.raises(GameError):  # only the Double
        game.apply_move(state, 0, {"type": "patrol", "room": HALL,
                                   "fake": STUDY})
    with pytest.raises(GameError):  # both must be reachable
        game.apply_move(state, 4, {"type": "patrol", "room": HALL,
                                   "fake": BELLTOWER})
    with pytest.raises(GameError):  # two different rooms
        game.apply_move(state, 4, {"type": "patrol", "room": STUDY,
                                   "fake": STUDY})


def test_the_bell_tower_example():
    # Real Double and Xiao Ming in the Bell Tower, decoy in the Study
    # with the Apprentice: Xiao Ming leads, the Apprentice reads nothing.
    state = {**start(rooms=(GARDEN, CHAPEL)),
             "positions": [BELLTOWER, STUDY, HALL, HALL, BELLTOWER, HALL],
             "cardHistory": [[None] * 6],
             "results": [{"round": 0, "team": [0, 2], "fails": 0,
                          "missing": [], "success": True}]}
    state = patrol_all(ready_all(state), {4: {"room": BELLTOWER, "fake": STUDY}})
    assert last_patrol(state, 0)["seen"] == []
    assert last_patrol(state, 4)["seen"] == [0]
    assert state["fn"][0] == "belltower"
    assert state["fn"][4] is None
    assert last_patrol(state, 1)["seen"] == [4]
    assert state["fn"][1] is None
    assert state["bellLeader"] == 0


def test_the_garden_counts_real_bodies_and_the_kitchen_hears_the_decoy():
    state = {**start(), "positions": [DINING] + [HALL] * 5}
    state = patrol_all(ready_all(state), {
        0: GARDEN, 1: KITCHEN, 4: {"room": GALLERY, "fake": DINING},
    })
    counts = notes(state, 0, "garden")[0]["counts"]
    assert counts[GALLERY] == 1 and counts[DINING] == 0 and counts[HALL] == 3
    assert counts[GARDEN] == 1
    state = room_all(state, {1: {"target": 4}})
    assert notes(state, 1, "kitchen")[0] == {
        "round": 0, "kind": "kitchen", "seat": 4, "room": DINING,
    }


def test_the_dining_room_shows_camps():
    state = patrol_all(ready_all(start()), {0: DINING, 5: DINING})
    # The Hermit hides from the Prophet's vision, not from a drink
    assert notes(state, 0, "dining")[0]["camp"] == "evil"
    assert notes(state, 5, "dining")[0]["camp"] == "good"
    assert notes(state, 0, "dining")[0]["seat"] == 5


def test_a_decoy_drinks_as_a_watcher_and_learns_nothing():
    state = patrol_all(ready_all(start()), {
        0: DINING, 4: {"room": HALL, "fake": DINING},
    })
    assert notes(state, 0, "dining")[0]["seat"] == 4
    assert notes(state, 0, "dining")[0]["camp"] == "good"
    assert notes(state, 4, "dining") == []


def test_three_in_the_dining_room_learn_nothing():
    state = patrol_all(ready_all(start()), {0: DINING, 1: DINING, 2: DINING})
    assert notes(state, 0, "dining") == []


def test_blackout_hides_faces():
    state = {**start(), "nightEvents": ["blackout"]}
    state = patrol_all(ready_all(state), {0: DINING, 5: DINING, 1: STUDY})
    assert last_patrol(state, 0)["seen"] is None
    assert last_patrol(state, 0)["company"] is True
    assert last_patrol(state, 1)["company"] is False
    assert notes(state, 0, "dining")[0] == {"round": 0, "kind": "dining",
                                            "seat": None, "camp": "evil"}


# --------------------------------------------------------- room functions


def test_no_function_in_the_hall_or_the_mission_room():
    state = patrol_all(ready_all(start(rooms=(KITCHEN, GARDEN))), {0: KITCHEN})
    assert state["fn"][0] is None
    assert last_patrol(state, 0)["blocked"] == "mission"
    assert last_patrol(state, 1)["blocked"] == "hall"


def test_no_function_two_nights_running():
    state = night(start(rooms=(STUDY, GARDEN)), {0: KITCHEN},
                  {0: {"target": 1}})
    state = send(state, [1, 2])
    assert state["round"] == 1
    state = patrol_all(ready_all(state))
    assert state["fn"][0] is None
    assert last_patrol(state, 0)["blocked"] == "repeat"


def test_a_room_you_were_sent_to_is_not_used():
    # The team ends the night in the mission room and may use it next
    # night (it is no longer the mission room)
    state = night(start(rooms=(KITCHEN, GARDEN)))
    state = send(state, [0, 1])
    assert state["positions"][0] == KITCHEN
    state = patrol_all(ready_all(state))
    assert state["fn"][0] == "kitchen"


def test_the_bell_tower_cuts_in_and_the_order_carries_on():
    state = night(start(leader=3), {2: GALLERY})
    assert state["leader"] == 3 and state["nextLeader"] == 4
    state = night(
        {**start(leader=3), "positions": [GALLERY] + [HALL] * 5},
        {0: BELLTOWER},
    )
    assert state["leader"] == 0 and state["nextLeader"] == 3
    state = game.apply_move(state, 0, {"type": "propose", "team": [0, 1]})
    state = vote_all(state, approve=False)
    assert state["leader"] == 3 and state["nextLeader"] == 4
    assert state["history"][0]["bell"] is True


def test_the_study_reads_one_card_from_last_night():
    state = night(start(rooms=(GARDEN, CHAPEL)))
    state = send(state, [4, 2], {4: "fail"})
    assert state["results"][0]["fails"] == 1
    state = patrol_all(ready_all(state), {0: STUDY})
    assert state["fn"][0] == "study"
    assert game.view_for(state, 0)["studyOptions"] == [2, 4]
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "room", "target": 1})
    state = room_all(state, {0: {"target": 4}})
    assert notes(state, 0, "study")[0]["card"] == "fail"


def test_the_gallery_posts_anonymous_letters():
    state = patrol_all(ready_all(start()), {0: GALLERY})
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "room", "letters": ["a", "b"]})
    with pytest.raises(GameError):
        game.apply_move(state, 1, {"type": "room", "letters": ["hi"]})
    state = room_all(state, {0: {"letters": ["  Trust   the Tracker "]}})
    assert state["timeline"][-1] == {"round": 0, "kind": "letters",
                                     "texts": ["Trust the Tracker"]}
    assert state["used"][0] == GALLERY

    state = {**start(), "nightEvents": ["echo"]}
    state = patrol_all(ready_all(state), {0: GALLERY})
    assert game.view_for(state, 0)["letterLimit"] == 2
    state = room_all(state, {0: {"letters": ["one", "two"]}})
    assert state["timeline"][-1]["texts"] == ["one", "two"]


def test_an_empty_letter_does_not_use_the_gallery():
    state = patrol_all(ready_all(start()), {0: GALLERY})
    state = room_all(state, {0: {"letters": ["   "]}})
    assert state["used"][0] is None
    assert all(e["kind"] != "letters" for e in state["timeline"])


# --------------------------------------------------------------- chapel


def at_study():
    """Seats 0 and 1 start next door to the Chapel."""
    return {**start(rooms=(GARDEN, KITCHEN)),
            "positions": [STUDY, STUDY] + [HALL] * 4}


def test_a_prayer_cancels_one_fail_and_only_the_chapel_knows():
    state = night(at_study(), {0: CHAPEL, 1: CHAPEL},
                  {0: {"pray": True}})
    state = send(state, [4, 3], {4: "fail"})
    result = state["results"][0]
    assert result["fails"] == 0 and result["success"] is True
    assert state["chapelSpent"] is True
    for s in (0, 1):
        assert notes(state, s, "prayer") == [
            {"round": 0, "kind": "prayer", "result": "cancelled"}
        ]
    assert notes(state, 4, "prayer") == []
    assert "chapelSpent" not in game.view_for(state, 0)


def test_an_unneeded_prayer_is_not_spent():
    state = night(at_study(), {0: CHAPEL},
                  {0: {"pray": True}})
    state = send(state, [2, 3])
    assert state["chapelSpent"] is False
    assert notes(state, 0, "prayer")[0]["result"] == "none"


def test_the_chapel_answers_only_once_a_game():
    state = night(at_study(), {0: CHAPEL},
                  {0: {"pray": True}})
    state = send(state, [4, 3], {4: "fail"})
    state = night(state, {1: CHAPEL}, {1: {"pray": True}})
    state = send(state, [4, 2, 3], {4: "fail"})
    assert state["results"][1]["fails"] == 1
    assert notes(state, 1, "prayer")[0]["result"] == "none"


# --------------------------------------------------- team, vote, mission


def test_team_size_and_leader_checks():
    state = night(start())
    with pytest.raises(GameError):
        game.apply_move(state, 1, {"type": "propose", "team": [0, 1]})
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "propose", "team": [0, 1, 2]})
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "propose", "team": [0, 0]})


def test_a_tie_rejects_and_five_rejections_lose():
    state = night(start())
    state = game.apply_move(state, 0, {"type": "propose", "team": [0, 1]})
    state = vote_all(state, no=(3, 4, 5))
    assert state["phase"] == "team" and state["rejections"] == 1
    assert state["leader"] == 1
    for _ in range(4):
        state = game.apply_move(state, state["leader"],
                                {"type": "propose", "team": [0, 1]})
        state = vote_all(state, approve=False)
    assert state["phase"] == "finished"
    assert state["winner"] == "evil" and state["winReason"] == "rejections"


def test_watchers_can_only_play_success():
    state = night(start())
    state = game.apply_move(state, 0, {"type": "propose", "team": [0, 4]})
    state = vote_all(state)
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "mission", "card": "fail"})
    with pytest.raises(GameError):
        game.apply_move(state, 1, {"type": "mission", "card": "success"})
    state = game.apply_move(state, 0, {"type": "mission", "card": "success"})
    assert game.view_for(state, 1)["missionPlayed"] == [0]
    state = game.apply_move(state, 4, {"type": "mission", "card": "fail"})
    assert state["results"][0]["fails"] == 1
    assert state["results"][0]["success"] is False
    # Cards are wiped: only the count is public
    assert state["cards"] == [None] * 6


def test_someone_out_of_reach_fails_the_mission_outright():
    # Mission in the Bell Tower; the Garden is three steps away
    state = {**start(rooms=(BELLTOWER, GARDEN)),
             "positions": [HALL, DINING] + [HALL] * 4}
    state = night(state, {1: GARDEN})
    state = send(state, [0, 1])
    result = state["results"][0]
    assert result == {"round": 0, "room": BELLTOWER, "team": [0, 1],
                      "missing": [1], "fails": None, "success": False}
    assert state["positions"][0] == BELLTOWER
    assert state["positions"][1] == GARDEN
    assert state["round"] == 1


def test_a_locked_door_or_fog_can_keep_you_away():
    west = {**start(rooms=(STUDY, GARDEN)),
            "positions": [GALLERY] + [HALL] * 5}
    state = night(west, locks={3: [BELLTOWER, STUDY]})
    # Gallery -> Hall -> Study still works
    assert game._can_reach(state, 0)
    state = night(west, locks={3: [GALLERY, HALL]})
    # Gallery -> Bell Tower -> Study still works
    assert game._can_reach(state, 0)

    state = {**start(rooms=(STUDY, GARDEN)), "nightEvents": ["fog"]}
    state = night(state, {0: GALLERY})
    assert not game._can_reach(state, 0)
    assert game._can_reach(state, 1)  # the Hall is one step away


def test_the_cellar_passage():
    # Named: walk straight to the mission room, however far
    state = {**start(rooms=(CHAPEL, GARDEN)),
             "positions": [GALLERY] + [HALL] * 5}
    state = night(state, {0: CELLAR})
    state = send(state, [0, 1])
    assert state["results"][0]["missing"] == []
    assert state["positions"][0] == CHAPEL

    # Not named: any room on the next patrol
    state = {**start(rooms=(CHAPEL, GARDEN)),
             "positions": [GALLERY] + [HALL] * 5}
    state = night(state, {0: CELLAR})
    state = send(state, [1, 2])
    assert state["freeMove"][0] is True
    state = ready_all(state)
    assert game.view_for(state, 0)["patrolRooms"] == list(range(9))
    state = patrol_all(state, {0: CHAPEL})
    assert state["positions"][0] == CHAPEL
    assert state["freeMove"][0] is False


def test_the_fourth_mission_needs_two_fails_with_seven():
    roles = ROLES_6 + ["possessed"]
    state = {**start(roles, rooms=(STUDY, GARDEN)), "round": 3,
             "missionRooms": [GARDEN, KITCHEN, GARDEN, STUDY, GARDEN],
             "nightEvents": [None, "calm", "calm", "calm"]}
    state = night(state)
    state = send(state, [0, 1, 4, 6], {4: "fail"})
    assert state["results"][0]["success"] is True
    assert state["results"][0]["fails"] == 1


# ---------------------------------------------------------- night events


def test_events_start_on_the_second_night():
    state = night(start(deck=["secretDoor", "collapse", "calm", "calm"]))
    assert game.view_for(state, 0)["event"] is None
    state = send(state, [0, 1])
    assert state["round"] == 1 and state["phase"] == "announce"
    assert state["nightEvents"][1] == "secretDoor"
    assert state["doors"] == [[0, 4]]
    assert {"round": 1, "kind": "door", "rooms": [0, 4]} in state["timeline"]
    assert len(state["missionRooms"]) == 3


def test_a_collapse_seals_a_room_and_sends_its_people_to_the_hall():
    state = {**start(rooms=(STUDY, GARDEN), deck=["collapse"] * 4),
             "positions": [GALLERY] + [HALL] * 5}
    state = night(state, {0: BELLTOWER, 1: STUDY})
    state = send(state, [1, 2])
    # Belltower is the first room spared neither by Hall nor missions
    assert state["collapsed"] == [BELLTOWER]
    assert state["positions"][0] == HALL
    assert notes(state, 0, "collapse")[0]["room"] == BELLTOWER
    # The next mission room is never a sealed one
    assert BELLTOWER not in state["missionRooms"][2:]


# ----------------------------------------------------------- the ending


def win_three(state):
    for _ in range(3):
        # Missions next to the Hall, so everyone can make it
        state = {**state, "missionRooms": [STUDY, KITCHEN] * 3}
        state = night(state)
        size = MISSION_SIZES[6][state["round"]]
        state = send(state, [0, 1, 2, 3][:size])
    return state


def test_three_successes_bring_the_assassin():
    state = win_three(start(rooms=(STUDY, GARDEN)))
    assert state["phase"] == "assassinate"
    view = game.view_for(state, 0)
    assert view["evilSeats"] == [4, 5] and view["assassinSeat"] == 4
    with pytest.raises(GameError):
        game.apply_move(state, 5, {"type": "assassinate", "target": 0})
    with pytest.raises(GameError):
        game.apply_move(state, 4, {"type": "assassinate", "target": 5})
    found = game.apply_move(state, 4, {"type": "assassinate", "target": 0})
    assert found["winner"] == "evil" and found["winReason"] == "assassination"
    missed = game.apply_move(state, 4, {"type": "assassinate", "target": 1})
    assert missed["winner"] == "good" and missed["winReason"] == "missions"
    assert game.get_result(missed) == {"winner": "good",
                                       "winnerSeats": [0, 1, 2, 3]}


def test_three_failures_win_for_evil():
    state = start(rooms=(STUDY, GARDEN))
    for _ in range(3):
        state = night(state)
        size = MISSION_SIZES[6][state["round"]]
        state = send(state, [4, 0, 1, 2][:size], {4: "fail"})
    assert state["phase"] == "finished"
    assert state["winReason"] == "failedMissions"
    assert game.get_result(state)["winnerSeats"] == [4, 5]
    assert game.view_for(state, 0)["roles"] == ROLES_6


def test_abandoned_game_has_no_winner():
    state = game.on_abandon(start(), 0)
    assert state["phase"] == "finished"
    assert game.get_result(state) == {"draw": True}


# ---------------------------------------------------------------- views


def test_view_keeps_secrets():
    state = patrol_all(ready_all(start()), {
        0: DINING, 5: DINING, 4: {"room": GALLERY, "fake": HALL},
    })
    watcher = game.view_for(state, 2)
    text = json.dumps(watcher)
    assert watcher["roles"] is None and watcher["positions"] is None
    assert watcher["myRoom"] == HALL and watcher["myFake"] is None
    assert '"hermit"' in text  # rolesInGame lists the setup...
    assert watcher["known"] == [] and watcher["evilSeats"] is None
    assert watcher["log"] == state["logs"][2]
    # ...but nobody else's notes
    assert all(n not in watcher["log"] for n in state["logs"][0])

    double = game.view_for(state, 4)
    assert double["myRoom"] == GALLERY and double["myFake"] == HALL

    spectator = game.view_for(state, -1)
    assert spectator["myRole"] is None and spectator["log"] == []
    assert spectator["myRoom"] is None and spectator["known"] == []


# ------------------------------------------------------------------ API


def _table(client, make_user, n=5):
    users = [make_user(f"watch{i}") for i in range(n)]
    room = client.post(
        "/api/v1/rooms", json={"gameType": "nightwatch"},
        headers=users[0]["headers"],
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


def test_api_plays_a_night_with_private_views(client, make_user):
    users, room = _table(client, make_user)
    started = client.post(f"/api/v1/rooms/{room['id']}/start",
                          headers=users[0]["headers"])
    assert started.status_code == 201

    views = [_view(client, room, u) for u in users]
    assert sorted(v["myRole"] for v in views) == sorted(ROLE_SETS[5])
    assert all(v["roles"] is None for v in views)

    for user in users:
        res = client.post(f"/api/v1/rooms/{room['id']}/move",
                          json={"move": {"type": "ready"}},
                          headers=user["headers"])
        assert res.status_code == 200
    for user in users:
        res = client.post(f"/api/v1/rooms/{room['id']}/move",
                          json={"move": {"type": "patrol", "room": HALL}},
                          headers=user["headers"])
        assert res.status_code == 200
    state = _view(client, room, users[0])
    assert state["phase"] == "room"
    assert len(state["log"]) >= 1 and state["log"][0]["kind"] == "patrol"
    assert len(state["log"][0]["seen"]) == 4

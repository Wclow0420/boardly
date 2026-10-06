"""Avalon engine tests (pure) plus API tests for what the generic room
plumbing must guarantee for a hidden-role game."""

import json
import random
from concurrent.futures import ThreadPoolExecutor

import pytest

from app.games.avalon.game import (
    QUEST_SIZES,
    ROLE_SETS,
    Avalon,
    fails_required,
    is_evil,
)
from app.games.base import GameError

game = Avalon()

# seat:      0         1           2          3           4
ROLES_5 = ["merlin", "percival", "servant", "assassin", "morgana"]


def start(roles=ROLES_5, leader=0):
    state = game.initial_state(len(roles), random.Random(1))
    return {**state, "roles": list(roles), "leader": leader}


def propose(state, team):
    return game.apply_move(state, state["leader"], {"type": "propose", "team": team})


def vote_all(state, approvals):
    for seat, approve in enumerate(approvals):
        state = game.apply_move(state, seat, {"type": "vote", "approve": approve})
    return state


def run_quest(state, team, fail_seats=()):
    """Propose, approve unanimously, and play the quest."""
    state = propose(state, team)
    state = vote_all(state, [True] * state["numPlayers"])
    for seat in team:
        card = "fail" if seat in fail_seats else "success"
        state = game.apply_move(state, seat, {"type": "quest", "card": card})
    return state


# ---------------------------------------------------------------- setup


@pytest.mark.parametrize("n", range(5, 11))
def test_setup_for_every_player_count(n):
    state = game.initial_state(n, random.Random(n))
    assert sorted(state["roles"]) == sorted(ROLE_SETS[n])
    evil = sum(is_evil(r) for r in state["roles"])
    assert evil == {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4}[n]
    assert state["roles"].count("merlin") == 1
    assert state["roles"].count("assassin") == 1
    assert 0 <= state["leader"] < n
    assert len(QUEST_SIZES[n]) == 5
    assert game.get_result(state) is None


def test_roles_are_shuffled():
    deals = {tuple(game.initial_state(5)["roles"]) for _ in range(30)}
    assert len(deals) > 1


def test_rejects_unsupported_player_counts():
    for n in (2, 4, 11):
        with pytest.raises(GameError):
            game.initial_state(n)


def test_two_fails_needed_only_on_fourth_quest_with_seven_plus():
    assert [fails_required(5, q) for q in range(5)] == [1, 1, 1, 1, 1]
    assert [fails_required(6, q) for q in range(5)] == [1, 1, 1, 1, 1]
    for n in (7, 8, 9, 10):
        assert [fails_required(n, q) for q in range(5)] == [1, 1, 1, 2, 1]


# ------------------------------------------------------------- proposing


def test_only_the_leader_proposes():
    state = start(leader=2)
    with pytest.raises(GameError, match="leader"):
        game.apply_move(state, 0, {"type": "propose", "team": [0, 1]})
    assert propose(state, [1, 0])["team"] == [0, 1]


@pytest.mark.parametrize(
    "team", [[0], [0, 1, 2], [0, 0], [0, 5], [0, -1], [0, "1"], [0, True], None, "01"]
)
def test_rejects_bad_teams(team):
    with pytest.raises(GameError):
        propose(start(), team)


def test_unknown_and_malformed_moves():
    state = start()
    for move in ({}, {"type": "nope"}, {"type": None}, "vote", None):
        with pytest.raises(GameError):
            game.apply_move(state, 0, move)


# ---------------------------------------------------------------- voting


def test_votes_stay_hidden_until_everyone_has_voted():
    state = propose(start(), [0, 1])
    state = game.apply_move(state, 0, {"type": "vote", "approve": False})
    state = game.apply_move(state, 3, {"type": "vote", "approve": True})

    view = game.view_for(state, 1)
    assert view["voted"] == [True, False, False, True, False]
    assert view["myVote"] is None
    assert view["history"] == []
    assert game.view_for(state, 0)["myVote"] is False
    assert "votes" not in view

    with pytest.raises(GameError, match="already voted"):
        game.apply_move(state, 0, {"type": "vote", "approve": True})
    with pytest.raises(GameError):
        game.apply_move(state, 1, {"type": "vote", "approve": "yes"})


def test_majority_approves_and_ties_reject():
    approved = vote_all(propose(start(), [0, 1]), [True, True, True, False, False])
    assert approved["phase"] == "quest"
    assert approved["history"][-1] == {
        "quest": 0,
        "leader": 0,
        "team": [0, 1],
        "votes": [True, True, True, False, False],
        "approved": True,
    }

    six = ["merlin", "percival", "servant", "servant", "assassin", "morgana"]
    tied = vote_all(propose(start(six), [0, 1]), [True, True, True, False, False, False])
    assert tied["phase"] == "team"
    assert tied["rejections"] == 1
    assert tied["leader"] == 1
    assert tied["team"] == []
    assert tied["history"][-1]["approved"] is False


def test_five_rejections_in_a_row_hand_evil_the_win():
    state = start()
    for round_number in range(5):
        assert state["leader"] == round_number
        state = vote_all(propose(state, [0, 1]), [False] * 5)
    assert state["phase"] == "finished"
    assert (state["winner"], state["winReason"]) == ("evil", "rejections")
    assert game.get_result(state) == {"winner": "evil", "winnerSeats": [3, 4]}


def test_rejection_count_resets_once_a_team_is_approved():
    state = start()
    for _ in range(4):
        state = vote_all(propose(state, [0, 1]), [False] * 5)
    assert state["rejections"] == 4
    state = vote_all(propose(state, [0, 1]), [True] * 5)
    assert (state["phase"], state["rejections"]) == ("quest", 0)


# ---------------------------------------------------------------- quests


def test_quest_cards():
    state = vote_all(propose(start(), [2, 3]), [True] * 5)

    with pytest.raises(GameError, match="not on this quest"):
        game.apply_move(state, 0, {"type": "quest", "card": "success"})
    with pytest.raises(GameError, match="must play Success"):
        game.apply_move(state, 2, {"type": "quest", "card": "fail"})
    with pytest.raises(GameError):
        game.apply_move(state, 2, {"type": "quest", "card": "maybe"})

    state = game.apply_move(state, 3, {"type": "quest", "card": "fail"})
    with pytest.raises(GameError, match="already played"):
        game.apply_move(state, 3, {"type": "quest", "card": "success"})
    view = game.view_for(state, 2)
    assert view["questPlayed"] == [3]
    assert view["myCard"] is None
    assert game.view_for(state, 3)["myCard"] == "fail"

    state = game.apply_move(state, 2, {"type": "quest", "card": "success"})
    assert state["questResults"] == [{"team": [2, 3], "fails": 1, "success": False}]
    assert (state["phase"], state["quest"], state["leader"]) == ("team", 1, 1)
    # who played what is gone for good
    assert state["questCards"] == [None] * 5


def test_fourth_quest_with_seven_players_survives_a_single_fail():
    seven = ROLE_SETS[7]  # seats 4, 5, 6 are evil
    state = start(seven)
    state = run_quest(state, [0, 1])
    state = run_quest(state, [0, 1, 4], fail_seats=[4])
    state = run_quest(state, [0, 1, 5], fail_seats=[5])
    assert state["quest"] == 3

    one_fail = run_quest(state, [0, 1, 2, 4], fail_seats=[4])
    assert one_fail["questResults"][-1] == {
        "team": [0, 1, 2, 4], "fails": 1, "success": True,
    }
    two_fails = run_quest(state, [0, 1, 4, 5], fail_seats=[4, 5])
    assert two_fails["questResults"][-1]["success"] is False
    assert (two_fails["winner"], two_fails["winReason"]) == ("evil", "failedQuests")


def test_three_failed_quests_win_for_evil():
    state = start()
    state = run_quest(state, [0, 3], fail_seats=[3])
    state = run_quest(state, [0, 1, 2])
    state = run_quest(state, [0, 4], fail_seats=[4])
    assert state["phase"] == "team"
    state = run_quest(state, [0, 1, 3], fail_seats=[3])
    assert state["phase"] == "finished"
    assert game.get_result(state) == {"winner": "evil", "winnerSeats": [3, 4]}
    with pytest.raises(GameError, match="already over"):
        propose(state, [0, 1])


# --------------------------------------------------------- assassination


def good_wins_three():
    state = start()
    state = run_quest(state, [0, 1])
    state = run_quest(state, [0, 1, 2])
    return run_quest(state, [0, 1])


def test_three_successes_lead_to_the_assassination():
    state = good_wins_three()
    assert state["phase"] == "assassinate"
    assert game.get_result(state) is None

    view = game.view_for(state, 2)
    assert view["evilSeats"] == [3, 4]
    assert view["assassinSeat"] == 3
    assert view["roles"] is None  # Merlin is still hidden

    with pytest.raises(GameError, match="Only the Hitman"):
        game.apply_move(state, 4, {"type": "assassinate", "target": 0})
    for bad in (4, 3, 9, None, "0"):
        with pytest.raises(GameError):
            game.apply_move(state, 3, {"type": "assassinate", "target": bad})


def test_assassin_finds_merlin():
    state = game.apply_move(good_wins_three(), 3, {"type": "assassinate", "target": 0})
    assert (state["winner"], state["winReason"]) == ("evil", "assassination")
    assert game.get_result(state) == {"winner": "evil", "winnerSeats": [3, 4]}


def test_assassin_misses():
    state = game.apply_move(good_wins_three(), 3, {"type": "assassinate", "target": 1})
    assert (state["winner"], state["winReason"]) == ("good", "quests")
    assert game.get_result(state) == {"winner": "good", "winnerSeats": [0, 1, 2]}
    view = game.view_for(state, 2)
    assert view["roles"] == ROLES_5
    assert view["assassinTarget"] == 1


def test_abandoned_game_reveals_roles_with_no_winner():
    state = game.on_abandon(propose(start(), [0, 1]), 2)
    assert (state["phase"], state["winner"], state["winReason"]) == (
        "finished", None, "abandoned",
    )
    assert game.get_result(state) == {"draw": True}
    assert game.view_for(state, 0)["roles"] == ROLES_5


# ----------------------------------------------------- secret knowledge


def known(roles, seat):
    return {(k["seat"], k["as"]) for k in game.view_for(start(roles), seat)["known"]}


def test_night_phase_knowledge():
    # seat: 0 merlin, 1 percival, 2-5 servants, 6 assassin, 7 morgana,
    #       8 mordred, 9 oberon
    roles = ROLE_SETS[10]
    assert known(roles, 0) == {(6, "evil"), (7, "evil"), (9, "evil")}  # no Mordred
    assert known(roles, 1) == {(0, "merlin"), (7, "merlin")}  # can't tell apart
    assert known(roles, 2) == set()
    assert known(roles, 6) == {(7, "evil"), (8, "evil")}  # no Oberon
    assert known(roles, 8) == {(6, "evil"), (7, "evil")}
    assert known(roles, 9) == set()  # Oberon knows nobody


def test_view_never_leaks_roles_mid_game():
    state = vote_all(propose(start(), [0, 3]), [True] * 5)
    state = game.apply_move(state, 3, {"type": "quest", "card": "fail"})
    for seat in (-1, 2):  # spectator, plain servant
        view = game.view_for(state, seat)
        text = json.dumps(view)
        assert view["roles"] is None and view["evilSeats"] is None
        assert view["known"] == []
        assert "questCards" not in view and '"fail"' not in text
        assert sorted(view["rolesInGame"]) == sorted(ROLES_5)  # public, unordered
    spectator = game.view_for(state, -1)
    assert spectator["myRole"] is None
    assert game.view_for(state, 2)["myRole"] == "servant"


# ------------------------------------------------------------------ API


def _table(client, make_user, n=5):
    users = [make_user(f"player{i}") for i in range(n)]
    room = client.post(
        "/api/v1/rooms", json={"gameType": "avalon"}, headers=users[0]["headers"]
    ).get_json()["room"]
    for user in users[1:]:
        client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=user["headers"])
        client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True}, headers=user["headers"])
    return users, room


def _view(client, room, user):
    return client.get(
        f"/api/v1/rooms/code/{room['code']}", headers=user["headers"]
    ).get_json()["room"]["session"]["state"]


def _move(client, room, user, move):
    return client.post(
        f"/api/v1/rooms/{room['id']}/move", json={"move": move}, headers=user["headers"]
    )


def test_needs_five_players_to_start(client, make_user):
    users, room = _table(client, make_user, n=4)
    res = client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    assert res.get_json()["error"]["code"] == "not_enough_players"


def test_api_only_ever_serves_each_players_own_view(app, client, make_user):
    users, room = _table(client, make_user)
    outsider = make_user("outsider")
    started = client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    assert started.status_code == 201
    assert "roles" not in started.get_json()["session"]["state"] or (
        started.get_json()["session"]["state"]["roles"] is None
    )

    views = [_view(client, room, u) for u in users]
    assert sorted(v["myRole"] for v in views) == sorted(ROLE_SETS[5])
    assert all(v["roles"] is None for v in views)
    merlin = next(v for v in views if v["myRole"] == "merlin")
    servant = next(v for v in views if v["myRole"] == "servant")
    assert len(merlin["known"]) == 2 and servant["known"] == []

    spectator = _view(client, room, outsider)
    assert spectator["myRole"] is None and spectator["known"] == []

    # a move answers with the mover's view too
    leader = users[views[0]["leader"]]
    res = _move(client, room, leader, {"type": "propose", "team": [0, 1]})
    assert res.status_code == 200
    assert res.get_json()["session"]["state"]["roles"] is None

    bad = _move(client, room, leader, {"type": "propose", "team": [0, 1]})
    assert bad.get_json()["error"]["code"] == "game_error"


def test_simultaneous_votes_are_all_counted(app, client, make_user):
    users, room = _table(client, make_user)
    client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    leader = users[_view(client, room, users[0])["leader"]]
    _move(client, room, leader, {"type": "propose", "team": [0, 1]})

    def vote(user):
        with app.app_context():
            return app.test_client().post(
                f"/api/v1/rooms/{room['id']}/move",
                json={"move": {"type": "vote", "approve": True}},
                headers=user["headers"],
            ).status_code

    with ThreadPoolExecutor(max_workers=5) as pool:
        codes = list(pool.map(vote, users))

    assert codes == [200] * 5
    state = _view(client, room, users[0])
    assert state["phase"] == "quest"
    assert state["history"][-1]["votes"] == [True] * 5


def test_full_game_records_the_winning_team(app, client, make_user):
    users, room = _table(client, make_user)
    client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    roles = [_view(client, room, u)["myRole"] for u in users]
    good = [s for s, r in enumerate(roles) if not is_evil(r)]

    for _ in range(3):
        state = _view(client, room, users[0])
        team = good[: state["questSizes"][state["quest"]]]
        _move(client, room, users[state["leader"]], {"type": "propose", "team": team})
        for user in users:
            _move(client, room, user, {"type": "vote", "approve": True})
        for seat in team:
            _move(client, room, users[seat], {"type": "quest", "card": "success"})

    assert _view(client, room, users[0])["phase"] == "assassinate"
    not_merlin = next(s for s in good if roles[s] != "merlin")
    res = _move(
        client, room, users[roles.index("assassin")],
        {"type": "assassinate", "target": not_merlin},
    )
    body = res.get_json()
    assert body["result"] == {"winner": "good", "winnerSeats": good}
    assert sorted(body["session"]["winnerUserIds"]) == sorted(users[s]["id"] for s in good)
    assert body["session"]["winnerUserId"] is None
    assert body["session"]["state"]["roles"] == roles

    for seat, user in enumerate(users):
        stats = client.get("/api/v1/auth/me/stats", headers=user["headers"]).get_json()["stats"]
        assert stats["gamesPlayed"] == 1
        assert stats["wins"] == (1 if seat in good else 0)


def test_leaving_mid_game_ends_it_and_reveals_roles(client, make_user):
    users, room = _table(client, make_user)
    client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/leave", headers=users[2]["headers"])

    payload = client.get(
        f"/api/v1/rooms/code/{room['code']}", headers=users[0]["headers"]
    ).get_json()["room"]
    assert payload["status"] == "finished"
    assert payload["session"]["winnerUserIds"] == []
    assert payload["session"]["state"]["winReason"] == "abandoned"
    assert sorted(payload["session"]["state"]["roles"]) == sorted(ROLE_SETS[5])

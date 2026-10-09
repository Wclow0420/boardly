"""Liar's Dice (大话骰) engine tests plus API tests for lobby options."""

import random

import pytest

from app.games.base import GameError
from app.games.liarsdice.game import KNOCKOUT_CUPS, LiarsDice, counts, face_rank

game = LiarsDice(random.Random(3))


def start(dice, turn=0, cups=None, mode="knockout"):
    state = game.initial_state(len(dice), random.Random(1), mode=mode)
    return {**state, "dice": [list(h) for h in dice], "turn": turn,
            "cups": cups or [0] * len(dice)}


def bid(state, seat, quantity, face, zhai=False):
    return game.apply_move(state, seat, {"type": "bid", "quantity": quantity,
                                         "face": face, "zhai": zhai})


def open_(state, seat):
    return game.apply_move(state, seat, {"type": "challenge"})


def split(state, seat):
    return game.apply_move(state, seat, {"type": "split", "bids": len(state["bids"])})


def respond(state, seat, counter=False):
    return game.apply_move(state, seat, {"type": "respond", "counter": counter})


TWO = [[1, 5, 5, 2, 3], [5, 6, 6, 1, 4]]
THREE = [[1, 5, 5, 2, 3], [5, 6, 6, 1, 4], [2, 2, 3, 3, 4]]


# ---------------------------------------------------------------- setup


def test_setup():
    state = game.initial_state(4, random.Random(2))
    assert len(state["dice"]) == 4 and all(len(h) == 5 for h in state["dice"])
    assert all(1 <= d <= 6 for h in state["dice"] for d in h)
    assert state["cups"] == [0, 0, 0, 0] and state["bid"] is None
    assert state["mode"] == "knockout"
    assert len(game.initial_state(10, random.Random(2))["dice"]) == 10
    for n in (1, 11):
        with pytest.raises(GameError):
            game.initial_state(n)
    assert game.new_state(3, {"mode": "endless"})["mode"] == "endless"


def test_five_of_a_kind_counts_one_extra():
    leopard = [[1, 1, 3, 3, 3]]
    assert counts(leopard, 3, zhai=False) == 6  # kaizhai: 1s wild, 豹子 +1
    assert counts(leopard, 3, zhai=True) == 3   # zhai: just three 3s
    assert counts([[3, 3, 3, 3, 3]], 3, zhai=True) == 6  # five real 3s
    assert counts([[1, 1, 1, 1, 1]], 1, zhai=True) == 6
    assert counts([[1, 1, 1, 1, 1]], 4, zhai=False) == 6  # all wild
    assert counts([[3, 3, 3, 3, 2]], 3, zhai=False) == 4  # not a full cup
    assert counts([[1, 1, 3, 3, 3], [3, 2, 2, 2, 2]], 3, zhai=False) == 7


def test_ones_are_wild_unless_zhai():
    dice = [[1, 5, 5], [1, 2, 5]]
    assert counts(dice, 5, zhai=False) == 5  # three 5s and two wild 1s
    assert counts(dice, 5, zhai=True) == 3
    assert counts(dice, 1, zhai=False) == 2  # 1s never count double
    assert [face_rank(f) for f in (2, 6, 1)] == [2, 6, 7]


# -------------------------------------------------------------- bidding


def test_opening_must_beat_the_player_count():
    state = start(TWO)
    with pytest.raises(GameError):
        bid(state, 0, 2, 5)  # two players: open with 3 or more
    state = bid(state, 0, 3, 5)
    assert state["bid"]["quantity"] == 3 and state["turn"] == 1


def test_each_bid_must_go_higher():
    state = bid(start(TWO), 0, 3, 5)
    for q, f in ((3, 4), (3, 5), (2, 6)):
        with pytest.raises(GameError):
            bid(state, 1, q, f)
    assert bid(state, 1, 3, 6)["bid"]["face"] == 6   # same count, higher face
    assert bid(state, 1, 4, 2)["bid"]["quantity"] == 4  # more dice
    zhai = bid(start(TWO), 0, 3, 5, zhai=True)
    assert bid(zhai, 1, 3, 1)["bid"]["face"] == 1  # 1 is the top face
    with pytest.raises(GameError):  # only ten dice on the table
        bid(state, 1, 11, 2)


def test_once_kaizhai_no_going_back_to_zhai():
    state = bid(start(TWO), 0, 3, 5)  # a kaizhai opening: 1s are wild
    for q, f, z in ((3, 5, True), (5, 6, True), (4, 1, False)):
        with pytest.raises(GameError):  # no zhai, so no 1s either
            bid(state, 1, q, f, zhai=z)
    zhai = bid(start(TWO), 0, 3, 5, zhai=True)
    assert bid(zhai, 1, 4, 5, zhai=True)["bid"]["zhai"] is True  # stays zhai
    broken = bid(zhai, 1, 6, 5)  # break the fast
    with pytest.raises(GameError):  # and it stays broken
        bid(broken, 0, 7, 5, zhai=True)


def test_a_zhai_opening_may_call_the_player_count():
    with pytest.raises(GameError):
        bid(start(TWO), 0, 2, 5)
    assert bid(start(TWO), 0, 2, 5, zhai=True)["bid"]["quantity"] == 2
    assert bid(start(TWO), 0, 2, 1)["bid"]["zhai"] is True  # 1s are zhai
    with pytest.raises(GameError):
        bid(start(TWO), 0, 1, 5, zhai=True)


def test_breaking_zhai_needs_double_the_dice():
    state = bid(start(TWO), 0, 3, 4, zhai=True)
    for q in (4, 5):
        with pytest.raises(GameError):  # 开斋 at 3 zhai needs 6+
            bid(state, 1, q, 6)
    state = bid(state, 1, 6, 2)  # break the fast: 1s are wild again
    assert state["bid"]["zhai"] is False
    state = open_(state, 0)
    # 2s with wild 1s: [1, 2] + [1] = 3, short of 6
    assert state["reveal"]["found"] == 3 and state["reveal"]["loser"] == 1


def test_not_your_turn():
    with pytest.raises(GameError):
        bid(start(TWO), 1, 3, 5)
    with pytest.raises(GameError):  # nothing to open yet
        open_(start(TWO), 0)


# ------------------------------------------------------------- opening


def test_open_a_true_bid_and_the_caller_drinks_one():
    state = bid(start(TWO), 0, 5, 5)  # 5s: three plus two wild 1s = 5
    state = open_(state, 1)
    assert state["reveal"]["found"] == 5 and state["reveal"]["loser"] == 1
    assert state["reveal"]["kind"] == "open" and state["cups"] == [0, 1]
    # a new round: fresh dice, the loser starts, no bid
    assert state["round"] == 2 and state["turn"] == 1 and state["bid"] is None
    assert state["reveal"]["dice"] == TWO


def test_only_the_player_up_may_open():
    state = bid(start(THREE), 0, 4, 5)
    with pytest.raises(GameError):
        open_(state, 2)


# --------------------------------------------------------------- split


def test_anyone_may_split_out_of_turn():
    state = bid(start(THREE), 0, 4, 5)  # seat 1 is up, seat 2 splits
    state = split(state, 2)
    assert state["phase"] == "split" and state["split"] == {"by": 2}
    with pytest.raises(GameError):  # no bidding while the split is pending
        bid(state, 1, 5, 5)
    with pytest.raises(GameError):  # only the bidder answers
        respond(state, 1)
    state = respond(state, 0)  # accept: 5s = three plus two wild 1s = 5
    assert state["reveal"]["kind"] == "split" and state["reveal"]["drink"] == 2
    assert state["reveal"]["loser"] == 2 and state["cups"] == [0, 0, 2]


def test_counter_split_doubles_again():
    state = bid(start(THREE), 0, 7, 6)  # 6s: two plus two wild 1s = 4: a lie
    state = respond(split(state, 1), 0, counter=True)
    assert state["reveal"]["kind"] == "counter" and state["reveal"]["drink"] == 4
    assert state["reveal"]["loser"] == 0 and state["cups"] == [4, 0, 0]


def test_split_rules():
    state = start(THREE)
    with pytest.raises(GameError):  # nothing to split
        split(state, 1)
    state = bid(state, 0, 4, 5)
    with pytest.raises(GameError):  # not your own bid
        split(state, 0)
    with pytest.raises(GameError):  # the bid changed since you looked
        game.apply_move(bid(state, 1, 5, 5), 2, {"type": "split", "bids": 1})


# ------------------------------------------------------------- modes


def test_knockout_five_cups_and_out_last_one_wins():
    three = [[2, 2, 2, 2, 2], [3, 3, 3, 3, 3], [4, 4, 4, 4, 4]]
    state = start(three, cups=[0, 3, 0])
    state = bid(state, 0, 4, 2)                 # five 2s: true
    state = respond(split(state, 1), 0)          # seat 1 drinks two: out
    assert state["cups"][1] == KNOCKOUT_CUPS and state["reveal"]["out"]
    assert state["dice"][1] == [] and state["turn"] == 2  # next one starts
    assert game.view_for(state, 0)["diceCount"] == [5, 0, 5]
    with pytest.raises(GameError):  # out players can't act
        game.apply_move(state, 1, {"type": "split", "bids": 0})
    state = {**state, "dice": [[6] * 5, [], [5] * 5]}
    state = bid(state, 2, 3, 6)
    assert state["turn"] == 0                     # out players are skipped
    state = respond(split(state, 0), 2, counter=True)  # five 6s: seat 0 drinks 4
    assert state["cups"][0] == 4
    state = {**state, "dice": [[6] * 5, [], [5] * 5]}
    state = bid(state, 0, 3, 6)
    state = open_(state, 2)                      # true: seat 2 drinks one
    state = {**state, "dice": [[6] * 5, [], [5] * 5]}
    state = bid(state, 2, 3, 6)
    state = open_(state, 0)                      # true: seat 0's fifth cup
    assert state["phase"] == "finished" and state["winner"] == 2
    assert game.get_result(state) == {"winnerSeat": 2}


def test_endless_never_knocks_anyone_out():
    state = start(TWO, cups=[9, 0], mode="endless")
    state = respond(split(bid(state, 0, 9, 6), 1), 0, counter=True)
    assert state["cups"] == [13, 0] and state["phase"] == "bidding"
    assert state["dice"][0] != [] and game.view_for(state, 1)["maxCups"] is None


def test_endless_ends_by_majority_vote_and_fewest_cups_win():
    state = start(THREE, cups=[3, 1, 1], mode="endless")
    state = game.apply_move(state, 0, {"type": "end", "vote": True})
    assert state["endVotes"] == [0] and state["phase"] == "bidding"
    state = game.apply_move(state, 0, {"type": "end", "vote": False})
    assert state["endVotes"] == []
    state = game.apply_move(state, 0, {"type": "end", "vote": True})
    state = game.apply_move(state, 2, {"type": "end", "vote": True})
    assert state["phase"] == "finished" and state["winners"] == [1, 2]
    assert game.get_result(state) == {"winnerSeats": [1, 2]}
    with pytest.raises(GameError):  # knockout games don't end by vote
        game.apply_move(start(TWO), 0, {"type": "end", "vote": True})


def test_view_shows_only_your_own_dice():
    state = start(TWO)
    view = game.view_for(state, 0)
    assert view["myDice"] == sorted(TWO[0])
    assert "dice" not in view and view["diceCount"] == [5, 5]
    assert game.view_for(state, -1)["myDice"] == []


def test_abandon():
    state = game.on_abandon(start(TWO), 1)
    assert game.get_result(state) == {"draw": True}


# ------------------------------------------------------------------ API


def _table(client, make_user, options=None):
    users = [make_user(f"drinker{i}") for i in range(2)]
    body = {"gameType": "liarsdice", **({"options": options} if options else {})}
    room = client.post("/api/v1/rooms", json=body,
                       headers=users[0]["headers"]).get_json()["room"]
    client.post("/api/v1/rooms/join", json={"code": room["code"]},
                headers=users[1]["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True},
                headers=users[1]["headers"])
    return users, room


def _state(client, room, user):
    return client.get(f"/api/v1/rooms/code/{room['code']}",
                      headers=user["headers"]).get_json()["room"]["session"]["state"]


def test_api_game_keeps_dice_private(client, make_user):
    users, room = _table(client, make_user)
    assert room["options"] == {"mode": "knockout"}
    assert room["game"]["options"] == {"mode": ["knockout", "endless"]}
    assert client.post(f"/api/v1/rooms/{room['id']}/start",
                       headers=users[0]["headers"]).status_code == 201
    views = [_state(client, room, u) for u in users]
    assert all(len(v["myDice"]) == 5 and "dice" not in v for v in views)
    turn = views[0]["turn"]
    res = client.post(f"/api/v1/rooms/{room['id']}/move",
                      json={"move": {"type": "bid", "quantity": 3, "face": 4}},
                      headers=users[turn]["headers"])
    assert res.status_code == 200


def test_api_host_picks_the_mode_in_the_lobby(client, make_user):
    users, room = _table(client, make_user)
    url = f"/api/v1/rooms/{room['id']}/options"
    res = client.patch(url, json={"options": {"mode": "endless"}},
                       headers=users[1]["headers"])
    assert res.status_code == 403  # only the host
    bad = client.patch(url, json={"options": {"mode": "forever"}},
                       headers=users[0]["headers"])
    assert bad.status_code == 400
    res = client.patch(url, json={"options": {"mode": "endless"}},
                       headers=users[0]["headers"])
    assert res.get_json()["room"]["options"] == {"mode": "endless"}

    client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    assert _state(client, room, users[1])["mode"] == "endless"
    late = client.patch(url, json={"options": {"mode": "knockout"}},
                        headers=users[0]["headers"])
    assert late.status_code == 409  # not once the game started


def test_api_options_at_creation_and_other_games_have_none(client, make_user):
    users, room = _table(client, make_user, options={"mode": "endless"})
    assert room["options"] == {"mode": "endless"}
    other = make_user("chess")
    ttt = client.post("/api/v1/rooms", json={"gameType": "tictactoe"},
                      headers=other["headers"]).get_json()["room"]
    assert ttt["options"] == {} and ttt["game"]["options"] == {}

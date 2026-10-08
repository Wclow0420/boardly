"""Liar's Dice (大话骰) engine tests plus an API smoke test."""

import random

import pytest

from app.games.base import GameError
from app.games.liarsdice.game import MAX_CUPS, LiarsDice, counts, face_rank

game = LiarsDice(random.Random(3))


def start(dice, turn=0, cups=None):
    state = game.initial_state(len(dice), random.Random(1))
    return {**state, "dice": [list(h) for h in dice], "turn": turn,
            "cups": cups or [0] * len(dice)}


def bid(state, seat, quantity, face, zhai=False):
    return game.apply_move(state, seat, {"type": "bid", "quantity": quantity,
                                         "face": face, "zhai": zhai})


def challenge(state, seat, double=False):
    return game.apply_move(state, seat, {"type": "challenge", "double": double})


TWO = [[1, 5, 5, 2, 3], [5, 6, 6, 1, 4]]


def test_setup():
    state = game.initial_state(4, random.Random(2))
    assert len(state["dice"]) == 4 and all(len(h) == 5 for h in state["dice"])
    assert all(1 <= d <= 6 for h in state["dice"] for d in h)
    assert state["cups"] == [0, 0, 0, 0] and state["bid"] is None
    for n in (1, 7):
        with pytest.raises(GameError):
            game.initial_state(n)


def test_ones_are_wild_until_zhai():
    dice = [[1, 5, 5], [1, 2, 5]]
    assert counts(dice, 5, zhai=False) == 5  # three 5s and two wild 1s
    assert counts(dice, 5, zhai=True) == 3
    assert counts(dice, 1, zhai=False) == 2  # 1s never count double
    assert [face_rank(f) for f in (2, 6, 1)] == [2, 6, 7]


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
    assert bid(state, 1, 3, 1)["bid"]["zhai"] is True  # 1 is the top face
    assert bid(state, 1, 4, 2)["bid"]["quantity"] == 4  # more dice
    with pytest.raises(GameError):  # only ten dice on the table
        bid(state, 1, 11, 2)


def test_zhai_may_keep_the_count_and_then_sticks():
    state = bid(start(TWO), 0, 3, 5)
    state = bid(state, 1, 3, 5, zhai=True)  # going zhai is itself a raise
    assert state["bid"]["zhai"] is True
    state = bid(state, 0, 4, 5)  # no way back to wild 1s
    assert state["bid"]["zhai"] is True


def test_not_your_turn():
    with pytest.raises(GameError):
        bid(start(TWO), 1, 3, 5)
    with pytest.raises(GameError):  # nothing to challenge yet
        challenge(start(TWO), 0)


def test_challenge_a_true_bid_and_the_challenger_drinks():
    state = bid(start(TWO), 0, 5, 5)  # 5s: three plus two wild 1s = 5
    state = challenge(state, 1)
    assert state["reveal"]["found"] == 5 and state["reveal"]["loser"] == 1
    assert state["cups"] == [0, 1]
    # a new round: fresh dice, the loser starts, no bid
    assert state["round"] == 2 and state["turn"] == 1 and state["bid"] is None
    assert state["reveal"]["dice"] == TWO


def test_challenge_a_lie_and_the_bidder_drinks_double():
    state = bid(start(TWO), 0, 3, 5, zhai=True)  # only three 5s: true
    state = bid(state, 1, 4, 5)                  # four 5s without wilds: lie
    state = challenge(state, 0, double=True)
    assert state["reveal"]["found"] == 3 and state["reveal"]["loser"] == 1
    assert state["cups"] == [0, 2] and state["reveal"]["drink"] == 2


def test_three_cups_and_out_last_one_wins():
    three = [[2, 2, 2, 2, 2], [3, 3, 3, 3, 3], [4, 4, 4, 4, 4]]
    state = start(three, cups=[0, 2, 0])
    state = bid(state, 0, 4, 6)    # no 6s at all
    state = challenge(state, 1)    # seat 1 is right: seat 0 drinks
    assert state["cups"] == [1, 2, 0] and state["turn"] == 0
    state = {**state, "dice": three}
    state = bid(state, 0, 4, 2)    # five 2s: true
    state = challenge(state, 1)    # seat 1 drinks the third cup
    assert state["cups"][1] == MAX_CUPS and state["reveal"]["out"]
    assert state["dice"][1] == [] and state["turn"] == 2  # next one starts
    assert game.view_for(state, 0)["diceCount"] == [5, 0, 5]
    # out players are skipped
    state = {**state, "dice": [[6] * 5, [], [5] * 5]}
    state = bid(state, 2, 3, 6)
    assert state["turn"] == 0
    state = challenge(state, 0, double=True)  # five 6s: seat 0 drinks two
    assert state["cups"][0] == MAX_CUPS
    assert state["phase"] == "finished" and state["winner"] == 2
    assert game.get_result(state) == {"winnerSeat": 2}


def test_view_shows_only_your_own_dice():
    state = start(TWO)
    view = game.view_for(state, 0)
    assert view["myDice"] == sorted(TWO[0])
    assert "dice" not in view and view["diceCount"] == [5, 5]
    assert game.view_for(state, -1)["myDice"] == []


def test_abandon():
    state = game.on_abandon(start(TWO), 1)
    assert game.get_result(state) == {"draw": True}


def test_api_game_keeps_dice_private(client, make_user):
    users = [make_user(f"drinker{i}") for i in range(2)]
    room = client.post("/api/v1/rooms", json={"gameType": "liarsdice"},
                       headers=users[0]["headers"]).get_json()["room"]
    client.post("/api/v1/rooms/join", json={"code": room["code"]},
                headers=users[1]["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True},
                headers=users[1]["headers"])
    assert client.post(f"/api/v1/rooms/{room['id']}/start",
                       headers=users[0]["headers"]).status_code == 201
    views = [client.get(f"/api/v1/rooms/code/{room['code']}",
                        headers=u["headers"]).get_json()["room"]["session"]["state"]
             for u in users]
    assert all(len(v["myDice"]) == 5 and "dice" not in v for v in views)
    turn = views[0]["turn"]
    res = client.post(f"/api/v1/rooms/{room['id']}/move",
                      json={"move": {"type": "bid", "quantity": 3, "face": 4}},
                      headers=users[turn]["headers"])
    assert res.status_code == 200

"""Liar's Dice (大话骰) engine tests plus API tests for lobby options."""

import random
from types import SimpleNamespace

import pytest

from app.games.base import GameError
from app.games.liarsdice.game import KNOCKOUT_CUPS, LiarsDice, counts, face_rank
from app.games.liarsdice.rules import JIJIJI, least_call, thresholds

game = LiarsDice(random.Random(3))


def start(dice, turn=0, cups=None, mode="knockout", calling="classic"):
    state = game.initial_state(len(dice), random.Random(1), mode=mode, calling=calling)
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
    assert state["mode"] == "knockout" and state["calling"] == "jijiji"
    assert len(game.initial_state(10, random.Random(2))["dice"]) == 10
    for n in (1, 11):
        with pytest.raises(GameError):
            game.initial_state(n)
    assert game.new_state(3, {"mode": "endless"})["mode"] == "endless"
    assert game.new_state(3, {"mode": "knockout", "calling": "nozhai"})["calling"] == "nozhai"
    with pytest.raises(GameError):
        game.initial_state(3, calling="vegas")


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


# ------------------------------------------------- classic (经典) bidding


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


# --------------------------------------------------- jijiji (几几几) bidding


def dice_for(n):
    return [[2, 3, 4, 5, 6] for _ in range(n)]


def jstart(n, turn=0):
    return start(dice_for(n), turn=turn, calling="jijiji")


def legal(state, seat, q, f, zhai):
    try:
        bid(state, seat, q, f, zhai)
        return True
    except GameError:
        return False


def test_jijiji_table_of_thresholds():
    assert JIJIJI == {2: (2, 3, 3), 3: (3, 4, 5), 4: (4, 5, 7), 5: (5, 6, 8), 6: (6, 7, 9),
                      7: (7, 8, 11), 8: (8, 9, 12), 9: (9, 10, 14), 10: (10, 11, 15)}


@pytest.mark.parametrize("n", range(2, 11))
def test_jijiji_openings_at_every_table_size(n):
    one, zhai, fei = thresholds(n)
    state = jstart(n)
    # nothing below ONE, not even 1s
    assert not legal(state, 0, one - 1, 1, True)
    # ONE up to ZHAI-1: only 1s (always zhai)
    for q in range(one, zhai):
        assert legal(state, 0, q, 1, False)
        assert bid(state, 0, q, 1)["bid"]["zhai"] is True
        for f in range(2, 7):
            assert not legal(state, 0, q, f, True) and not legal(state, 0, q, f, False)
    # ZHAI up to FEI-1: zhai only, any face
    for q in range(zhai, fei):
        for f in range(1, 7):
            assert legal(state, 0, q, f, True)
        for f in range(2, 7):
            assert not legal(state, 0, q, f, False)
    # FEI and up: zhai or kaizhai
    for f in range(2, 7):
        assert legal(state, 0, fei, f, True) and legal(state, 0, fei, f, False)
    assert bid(state, 0, fei, 1)["bid"]["zhai"] is True  # 1s at FEI are still zhai
    # the smallest calls the bots and the app work from
    total = 5 * n
    assert least_call("jijiji", n, None, 1, True, total) == one
    assert least_call("jijiji", n, None, 4, True, total) == zhai
    assert least_call("jijiji", n, None, 4, False, total) == fei


def test_jijiji_counts_only_the_players_still_in():
    # four seated, one drunk: the 3-player table applies (3 / 4 / 5)
    state = start(dice_for(4), cups=[0, 0, 0, KNOCKOUT_CUPS], calling="jijiji")
    state = {**state, "dice": dice_for(3) + [[]]}
    assert legal(state, 0, 3, 1, True) and not legal(state, 0, 4, 5, False)
    assert legal(state, 0, 5, 5, False)
    # endless: nobody is out, everyone counts
    endless = start(dice_for(4), cups=[0, 0, 0, 9], mode="endless", calling="jijiji")
    assert not legal(endless, 0, 3, 1, True) and legal(endless, 0, 4, 1, True)


def test_jijiji_zhai_to_kaizhai_needs_no_doubling():
    state = bid(jstart(3), 0, 4, 5, zhai=True)        # 4 fives zhai
    assert not legal(state, 1, 4, 6, False)            # kaizhai below FEI
    state = bid(state, 1, 5, 3)                        # 5 threes kaizhai: fine
    assert state["bid"]["zhai"] is False
    # it must still be a raise: 4 fives zhai -> 4 sixes kaizhai is short of FEI,
    # and 5 sixes zhai -> 5 threes kaizhai goes down the faces
    high = bid(bid(jstart(3), 0, 4, 5, zhai=True), 1, 5, 6, zhai=True)
    assert not legal(high, 2, 5, 3, False) and legal(high, 2, 5, 1, True)
    assert legal(high, 2, 6, 3, False)


def test_jijiji_stays_kaizhai_and_no_ones_after_fei():
    state = bid(jstart(3), 0, 5, 4)                    # opens kaizhai at FEI
    for q, f, z in ((6, 4, True), (6, 1, True), (6, 1, False), (9, 6, True)):
        assert not legal(state, 1, q, f, z)
    state = bid(state, 1, 5, 6)
    assert legal(state, 2, 6, 2, False) and not legal(state, 2, 6, 2, True)
    # broken mid-round: the same from then on
    state = bid(bid(jstart(3), 0, 4, 2, zhai=True), 1, 5, 2)
    assert not legal(state, 2, 7, 1, True) and not legal(state, 2, 7, 3, True)
    assert legal(state, 2, 5, 3, False)


def test_jijiji_raises_and_ones_on_top():
    state = bid(jstart(3), 0, 3, 1)                    # three 1s: the lowest opening
    assert not legal(state, 1, 3, 6, True)             # nothing tops 1s at 3
    assert legal(state, 1, 4, 2, True) and legal(state, 1, 4, 1, True)
    state = bid(state, 1, 4, 6, zhai=True)
    assert legal(state, 2, 4, 1, True) and not legal(state, 2, 4, 5, True)


# -------------------------------------------------------- nozhai (不玩斋)


def test_nozhai_ones_are_wild_and_never_called():
    state = start(THREE, calling="nozhai")
    assert not legal(state, 0, 3, 5, False)            # open above the players
    assert not legal(state, 0, 4, 1, False) and not legal(state, 0, 4, 1, True)
    assert not legal(state, 0, 4, 5, True)             # no zhai at all
    state = bid(state, 0, 4, 5)
    assert state["bid"]["zhai"] is False
    assert not legal(state, 1, 4, 4, False) and legal(state, 1, 4, 6, False)
    assert not legal(state, 1, 5, 1, False)
    # 1s are wild in the count: three 5s plus two 1s = 5, so the call holds
    state = open_(bid(state, 1, 5, 5), 2)
    assert state["reveal"]["found"] == 5 and state["reveal"]["loser"] == 2


def test_old_games_without_calling_play_classic():
    state = start(TWO)
    old = {k: v for k, v in state.items() if k != "calling"}
    assert game.view_for(old, 0)["calling"] == "classic"
    assert bid(old, 0, 2, 5, zhai=True)["bid"]["quantity"] == 2  # a classic zhai opening
    state = bid(old, 0, 3, 4, zhai=True)
    with pytest.raises(GameError):  # classic: breaking zhai doubles
        bid(state, 1, 5, 6)


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


# ------------------------------------------------------------ badges


def _badge(key):
    return next(b for b in game.badges if b.key == key)


def _row(state, seat, won):
    return SimpleNamespace(won=won, abandoned=False, side=None, role=None,
                           **game.player_outcome(state, seat))


def test_badges_count_cups_and_counter_splits():
    # seat 1 splits a true call, seat 0 counters and wins
    state = bid(start(THREE), 0, 4, 5)  # 5s: four plus two wild 1s: true
    state = respond(split(state, 1), 0, counter=True)
    assert state["reveal"]["loser"] == 1 and state["counterWins"] == [1, 0, 0]
    # a counter-split lost doesn't count for the one who split
    state = bid({**state, "dice": THREE, "turn": 0}, 0, 7, 6)  # a lie
    state = respond(split(state, 2), 0, counter=True)
    assert state["reveal"]["loser"] == 0 and state["counterWins"] == [1, 0, 1]

    counter, sober = _badge("liarsdice.counter"), _badge("liarsdice.sober")
    assert counter.match(_row(state, 0, False)) and counter.match(_row(state, 2, False))
    assert not counter.match(_row(state, 1, False))
    # seat 2 has drunk nothing: a sober win; seat 0 has drunk four
    assert state["cups"] == [4, 4, 0]
    assert sober.match(_row(state, 2, True)) and not sober.match(_row(state, 2, False))
    assert not sober.match(_row(state, 0, True))
    # games saved before counter-splits were counted
    old = {k: v for k, v in state.items() if k != "counterWins"}
    assert game.player_outcome(old, 0)["facts"] == {"cups": 4, "counterWins": 0}


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


def test_five_different_faces_may_be_shaken_again():
    scattered = [[1, 2, 3, 5, 6], [4, 4, 2, 2, 6]]
    state = start(scattered)
    state = game.apply_move(state, 0, {"type": "reroll"})
    assert state["rerolls"] == [{"seat": 0, "dice": [1, 2, 3, 5, 6]}]
    assert len(state["dice"][0]) == 5 and state["turn"] == 0  # still my turn
    with pytest.raises(GameError):  # a pair: no reroll
        game.apply_move(state, 1, {"type": "reroll"})
    # any time before your own first bid, even out of turn
    state = {**start(scattered, turn=1)}
    state = bid(state, 1, 3, 4)
    state = game.apply_move(state, 0, {"type": "reroll"})
    assert state["rerolls"][0]["seat"] == 0
    # but not once you've bid
    state = {**bid({**state, "dice": scattered}, 0, 4, 4)}
    state = {**state, "dice": scattered}
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "reroll"})
    # a new round starts with no rerolls
    state = open_(state, 1)
    assert state["rerolls"] == []


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
    assert room["options"] == {"mode": "knockout", "calling": "jijiji"}
    assert room["game"]["options"] == {"mode": ["knockout", "endless"],
                                       "calling": ["jijiji", "classic", "nozhai"]}
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
    assert res.get_json()["room"]["options"] == {"mode": "endless", "calling": "jijiji"}
    res = client.patch(url, json={"options": {"calling": "nozhai"}},
                       headers=users[0]["headers"])
    assert res.get_json()["room"]["options"] == {"mode": "endless", "calling": "nozhai"}
    assert client.patch(url, json={"options": {"calling": "vegas"}},
                        headers=users[0]["headers"]).status_code == 400

    client.post(f"/api/v1/rooms/{room['id']}/start", headers=users[0]["headers"])
    assert _state(client, room, users[1])["mode"] == "endless"
    assert _state(client, room, users[1])["calling"] == "nozhai"
    late = client.patch(url, json={"options": {"mode": "knockout"}},
                        headers=users[0]["headers"])
    assert late.status_code == 409  # not once the game started


def test_api_options_at_creation_and_other_games_have_none(client, make_user):
    users, room = _table(client, make_user, options={"mode": "endless"})
    assert room["options"] == {"mode": "endless", "calling": "jijiji"}
    other = make_user("chess")
    ttt = client.post("/api/v1/rooms", json={"gameType": "tictactoe"},
                      headers=other["headers"]).get_json()["room"]
    assert ttt["options"] == {} and ttt["game"]["options"] == {}

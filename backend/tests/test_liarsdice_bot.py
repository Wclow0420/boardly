"""Liar's Dice bots (app/games/liarsdice/bot.py): only legal moves, from
their own view, and whole games end, in both modes at every size."""

import random

import pytest

from app.games.liarsdice.bot import liarsdice as policy
from app.games.liarsdice.game import LiarsDice

MAX_STEPS = 6000


def _waiting(game, state, rng):
    n = state["numPlayers"]
    return [s for s in range(n) if game.bot_move(game.view_for(state, s), s, rng) is not None]


def _step(game, state, rng):
    """One step of app/bots.py: every bot the game waits on moves, each
    asked again on the state the ones before it left."""
    waiting = _waiting(game, state, rng)
    for seat in waiting:
        move = game.bot_move(game.view_for(state, seat), seat, rng)
        if move is not None:
            state = game.apply_move(state, seat, move)  # a GameError fails the test
    return state, bool(waiting)


def _play(n, mode, seed):
    game = LiarsDice(random.Random(seed))
    rng = random.Random(seed + 1000)
    state = game.initial_state(n, mode=mode)
    kinds = set()
    for _ in range(MAX_STEPS):
        if state["phase"] == "finished":
            return state, kinds
        before = state
        state, moved = _step(game, state, rng)
        assert moved, f"stalled: the game waits on no bot ({n}, {mode}, {seed})"
        if state["reveal"] is not before["reveal"] and state["reveal"]:
            kinds.add(state["reveal"]["kind"])
        if len(state.get("rerolls", [])) > len(before.get("rerolls", [])):
            kinds.add("reroll")
        if state["bids"] and state["bids"][0]["zhai"]:
            kinds.add("zhai")
    raise AssertionError(f"never ended ({n}, {mode}, {seed})")


@pytest.mark.parametrize("mode", ["knockout", "endless"])
@pytest.mark.parametrize("n", range(2, 11))
def test_bots_finish_whole_games(n, mode):
    seen = set()
    for seed in range(12):
        state, kinds = _play(n, mode, seed)
        seen |= kinds
        if mode == "endless":
            assert len(state["endVotes"]) * 2 > n
            assert state["winners"] and min(state["cups"]) == state["cups"][state["winners"][0]]
        else:
            assert state["winner"] is not None
            out = [s for s in range(n) if state["cups"][s] >= 5]
            assert len(out) == n - 1 and state["winner"] not in out
    assert "open" in seen


def test_bots_use_every_move():
    """Across many games the bots open, split, counter, reroll and go zhai."""
    seen = set()
    for n in (2, 4, 6, 8):
        for seed in range(15):
            seen |= _play(n, "knockout", seed)[1]
    assert {"open", "split", "counter", "reroll", "zhai"} <= seen


def _view(**over):
    view = {
        "numPlayers": 3, "mode": "knockout", "phase": "bidding", "turn": 0,
        "round": 1, "cups": [0, 0, 0], "maxCups": 5, "diceEach": 5,
        "myDice": [2, 2, 3, 4, 6], "diceCount": [5, 5, 5], "bid": None,
        "bids": [], "split": None, "endVotes": [], "rerolls": [],
        "reveal": None, "winner": None, "winners": None,
    }
    view.update(over)
    return view


def _bid(q, f, zhai=False, seat=2):
    return {"quantity": q, "face": f, "zhai": zhai, "seat": seat}


def test_only_on_its_turn_or_when_its_bid_is_split():
    rng = random.Random(0)
    bid = _bid(4, 3, seat=1)
    assert policy(_view(turn=1, bid=bid, bids=[bid]), 0, rng) is None
    # a split aimed at someone else isn't ours to answer
    split = _view(phase="split", split={"by": 2}, bid=bid, bids=[bid])
    assert policy(split, 0, rng) is None
    move = policy(split, 1, rng)
    assert move["type"] == "respond" and isinstance(move["counter"], bool)
    assert policy(_view(phase="finished"), 0, rng) is None
    assert policy(_view(cups=[5, 0, 0], myDice=[], diceCount=[0, 5, 5]), 0, rng) is None


def test_calls_an_impossible_bid_and_raises_a_sure_one():
    rng = random.Random(0)
    for _ in range(50):
        bid = _bid(14, 5)  # 14 fives of 15 dice, none in my cup
        move = policy(_view(bid=bid, bids=[bid]), 0, rng)
        assert move["type"] in ("challenge", "split")
        if move["type"] == "split":
            assert move["bids"] == 1
        bid = _bid(4, 2)  # I hold two 2s and the table has 10 more dice
        move = policy(_view(myDice=[1, 1, 2, 2, 2], bid=bid, bids=[bid]), 0, rng)
        assert move["type"] == "bid"


def test_its_bids_are_legal_from_any_bid():
    game = LiarsDice(random.Random(3))
    rng = random.Random(3)
    for seed in range(200):
        state = game.initial_state(3, rng=random.Random(seed))
        state["turn"] = 0
        q, f = rng.randint(3, 15), rng.randint(1, 6)
        zhai = f == 1 or rng.random() < 0.5
        bid = _bid(q, f, zhai, seat=2)
        state = {**state, "bid": bid, "bids": [bid]}
        move = game.bot_move(game.view_for(state, 0), 0, rng)
        game.apply_move(state, 0, move)


def test_rerolls_scattered_dice_at_most_twice_a_round():
    rng = random.Random(0)
    scattered = [1, 2, 3, 4, 6]
    assert policy(_view(myDice=scattered), 0, rng) == {"type": "reroll"}
    twice = [{"seat": 0, "dice": scattered}] * 2
    assert policy(_view(myDice=scattered, rerolls=twice), 0, rng)["type"] == "bid"


def test_endless_votes_once_and_follows_a_call_to_stop():
    rng = random.Random(0)
    endless = dict(mode="endless", maxCups=None, turn=1)
    assert policy(_view(**endless, round=2), 0, rng) is None
    # someone asked to stop: the bot agrees, even off its turn
    asked = _view(**endless, round=4, endVotes=[2])
    assert policy(asked, 0, rng) == {"type": "end", "vote": True}
    # ...once: having voted it waits for its turn
    assert policy({**asked, "endVotes": [0, 2]}, 0, rng) is None
    # far behind, it plays on for a while
    assert policy(_view(**endless, round=4, endVotes=[2], cups=[9, 0, 0]), 0, rng) is None
    assert policy(_view(**endless, round=30, cups=[20, 0, 0]), 0, rng)["type"] == "end"
    # never in a knockout game
    assert policy(_view(turn=1, round=40, endVotes=[1, 2]), 0, rng) is None


def test_a_person_splits_a_bot_and_the_bot_answers():
    game = LiarsDice(random.Random(5))
    rng = random.Random(5)
    state = {**game.initial_state(4, rng=random.Random(5)), "turn": 1}
    # the bot at seat 1 bids, the person at seat 0 splits it
    state = game.apply_move(state, 1, game.bot_move(game.view_for(state, 1), 1, rng))
    while state["turn"] == 1:  # it shook a 散骰 again first
        state = game.apply_move(state, 1, game.bot_move(game.view_for(state, 1), 1, rng))
    state = game.apply_move(state, 0, {"type": "split", "bids": len(state["bids"])})
    assert _waiting(game, state, rng) == [1]
    move = game.bot_move(game.view_for(state, 1), 1, rng)
    state = game.apply_move(state, 1, move)
    assert state["reveal"]["kind"] in ("split", "counter")


ROOMS = "/api/v1/rooms"


@pytest.mark.parametrize("mode", ["knockout", "endless"])
def test_a_person_plays_with_bots_through_the_server(client, make_user, mode):
    """The server's bot driver (app/bots.py, inline in tests) plays the
    bots after every move of the person, until the game is theirs again."""
    alice = make_user("alice")
    room = client.post(ROOMS, json={"gameType": "liarsdice", "options": {"mode": mode}},
                       headers=alice["headers"]).get_json()["room"]
    assert room["botsAvailable"] is True
    assert client.post(f"{ROOMS}/{room['id']}/bots", json={"count": 4},
                       headers=alice["headers"]).status_code == 201
    assert client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"]).status_code == 201
    game, rng = LiarsDice(), random.Random(2)
    for _ in range(2000):
        session = client.get(f"{ROOMS}/code/{room['code']}",
                             headers=alice["headers"]).get_json()["room"]["session"]
        if session["status"] != "in_progress":
            break
        move = game.bot_move(session["state"], 0, rng)
        assert move is not None, "the game waits on neither Alice nor a bot"
        res = client.post(f"{ROOMS}/{room['id']}/move", json={"move": move},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    assert session["status"] == "finished"

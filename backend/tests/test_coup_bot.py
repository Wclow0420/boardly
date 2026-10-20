"""Hustle's bots (app/games/coup/bot.py): they only make legal moves,
answer every window they're asked in, and whole games of bots end."""

import random

import pytest

from app.games.coup import bot as policy
from app.games.coup import game as engine
from app.games.coup.game import ACTIONS, Coup

game = Coup()
MOVE_CAP = 1500


def _table(hands, coins=None, turn=0):
    n = len(hands)
    return {
        "numPlayers": n,
        "players": [
            {
                "coins": (coins or [2] * n)[seat],
                "cards": [{"role": r, "revealed": False} for r in cards.split(",")],
            }
            for seat, cards in enumerate(hands)
        ],
        "deck": ["duke", "assassin", "captain", "ambassador", "contessa"],
        "turn": turn,
        "phase": "action",
        "action": None,
        "block": None,
        "passed": [],
        "pending": None,
        "exchange": None,
        "log": [],
        "winner": None,
    }


def _ask(state, seat, rng):
    return game.bot_move(game.view_for(state, seat), seat, rng)


def _play(n, seed, monkeypatch):
    """One all-bot game, moved the way app/bots.py moves them: ask every
    seat, then the waiting ones move in seat order, each asked again on
    the state its neighbours left. Returns (state, moves)."""
    monkeypatch.setattr(engine, "_rng", random.Random(seed))  # the deck's shuffles
    rng = random.Random(seed)
    state = game.initial_state(n, random.Random(seed))
    moves = 0
    while state["phase"] != "finished":
        waiting = [s for s in range(n) if _ask(state, s, rng) is not None]
        # The bots answer exactly when the game waits on them
        assert waiting == sorted(game.view_for(state, 0)["waitingOn"]), state
        for seat in waiting:
            move = _ask(state, seat, rng)
            if move is None:
                continue
            state = game.apply_move(state, seat, move)
            moves += 1
            if state["phase"] == "finished":
                break
        assert moves < MOVE_CAP, (n, seed)
    return state, moves


def test_all_bot_games_end_at_every_size(monkeypatch):
    games, total = 0, 0
    for n in range(game.min_players, game.max_players + 1):
        for seed in range(60):
            state, moves = _play(n, seed, monkeypatch)
            assert game.get_result(state)["winnerSeat"] == state["winner"]
            games += 1
            total += moves
    assert games == 300
    assert total / games < 200


def test_the_blockers_match_the_engine():
    assert policy.BLOCKERS == {
        kind: tuple(spec["blockers"]) for kind, spec in ACTIONS.items() if "blockers" in spec
    }
    assert policy.ROLES == tuple(engine.ROLES)
    assert policy.COPIES == engine.COPIES_PER_ROLE
    assert policy.COUP_COST == engine.COUP_COST == ACTIONS["coup"]["cost"]
    assert policy.ASSASSINATE_COST == ACTIONS["assassinate"]["cost"]
    assert policy.FORCED_COUP_AT == engine.FORCED_COUP_AT


def test_ten_coins_always_shuts_the_strongest_down():
    state = _table(["duke,assassin", "captain,contessa", "ambassador,duke", "captain,captain"],
                   coins=[10, 2, 6, 1])
    state["players"][1]["cards"][0]["revealed"] = True
    for seed in range(50):
        move = _ask(state, 0, random.Random(seed))
        # seats 2 and 3 have two cards; 2 has more cash
        assert move == {"type": "action", "action": "coup", "target": 2}


def test_no_move_unless_the_game_waits_on_it():
    rng = random.Random(0)
    state = _table(["duke,assassin", "captain,contessa", "ambassador,duke"])
    assert _ask(state, 1, rng) is None and _ask(state, 2, rng) is None
    state = game.apply_move(state, 0, {"type": "action", "action": "tax"})
    # the claimant never answers its own claim
    assert _ask(state, 0, rng) is None
    state = game.apply_move(state, 1, {"type": "pass"})
    # nor again once it has let it through
    assert _ask(state, 1, rng) is None
    assert _ask(state, 2, rng) in ({"type": "pass"}, {"type": "challenge"})


def test_a_claim_it_can_see_is_false_is_always_called():
    # seat 1 holds two dukes and the third is face up: seat 0 has none
    state = _table(["captain,duke", "duke,duke", "ambassador,contessa"], turn=0)
    state["players"][0]["cards"][1]["revealed"] = True
    state = game.apply_move(state, 0, {"type": "action", "action": "tax"})
    for seed in range(30):
        assert _ask(state, 1, random.Random(seed)) == {"type": "challenge"}


def test_it_never_bluffs_a_role_whose_every_copy_is_face_up():
    state = _table(["ambassador,contessa", "duke,assassin", "duke,ambassador", "duke,captain"],
                   coins=[2, 1, 1, 0])
    for seat in (1, 2, 3):
        state["players"][seat]["cards"][0]["revealed"] = True
    for seed in range(200):
        move = _ask(state, 0, random.Random(seed))
        assert move["action"] in ("exchange", "foreignAid", "income")


def test_it_blocks_with_the_card_it_holds():
    state = _table(["captain,duke", "contessa,duke", "ambassador,ambassador"], coins=[3, 2, 2])
    state = game.apply_move(state, 0, {"type": "action", "action": "assassinate", "target": 1})
    for seed in range(30):
        rng = random.Random(seed)
        # holding the Auntie, it waits to block rather than challenge
        assert _ask(state, 1, rng) == {"type": "pass"}
    state = game.apply_move(state, 2, {"type": "pass"})
    state = game.apply_move(state, 1, {"type": "pass"})
    assert state["phase"] == "block"
    assert _ask(state, 1, random.Random(0)) == {"type": "block", "role": "contessa"}


def test_with_one_card_left_it_always_answers_a_rough_up():
    state = _table(["assassin,duke", "captain,duke", "ambassador,ambassador"], coins=[3, 2, 2])
    state["players"][1]["cards"][1]["revealed"] = True
    state = game.apply_move(state, 0, {"type": "action", "action": "assassinate", "target": 1})
    state = game.apply_move(state, 2, {"type": "pass"})
    for seed in range(30):
        move = _ask(state, 1, random.Random(seed))
        if move == {"type": "challenge"}:
            continue
        after = game.apply_move(state, 1, move)
        # let through, it bluffs the Auntie: it has nothing left to lose
        assert _ask(after, 1, random.Random(seed)) == {"type": "block", "role": "contessa"}


def test_it_gives_up_its_cheapest_card_and_swaps_for_the_best():
    state = _table(["duke,ambassador", "captain,captain"], coins=[7, 2])
    state = game.apply_move(state, 0, {"type": "action", "action": "coup", "target": 1})
    assert _ask(state, 1, random.Random(0)) == {"type": "reveal", "card": 0}
    state = _table(["ambassador,captain", "contessa,contessa"])
    state["deck"] = ["contessa", "duke", "duke"]
    state = game.apply_move(state, 0, {"type": "action", "action": "exchange"})
    state = game.apply_move(state, 1, {"type": "pass"})
    assert state["phase"] == "exchange"
    move = _ask(state, 0, random.Random(0))
    options = game.view_for(state, 0)["exchange"]
    assert sorted(options[i] for i in move["keep"]) == ["captain", "duke"]
    game.apply_move(state, 0, move)


def test_bots_finish_a_table_with_a_person(app, client, make_user):
    alice = make_user("alice")
    room = client.post("/api/v1/rooms", json={"gameType": "coup"},
                       headers=alice["headers"]).get_json()["room"]
    assert room["botsAvailable"] is True
    res = client.post(f"/api/v1/rooms/{room['id']}/bots", json={"count": 3},
                      headers=alice["headers"])
    assert res.status_code == 201
    assert client.post(f"/api/v1/rooms/{room['id']}/start",
                       headers=alice["headers"]).status_code == 201
    rng = random.Random(3)
    for _ in range(500):
        session = client.get(f"/api/v1/rooms/code/{room['code']}",
                             headers=alice["headers"]).get_json()["room"]["session"]
        if session["status"] != "in_progress":
            break
        move = game.bot_move(session["state"], 0, rng)
        assert move is not None, "the game waits on neither Alice nor a bot"
        res = client.post(f"/api/v1/rooms/{room['id']}/move", json={"move": move},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    assert session["status"] == "finished"


@pytest.mark.parametrize("n", range(2, 7))
def test_moves_are_legal_from_every_seat_mid_game(n, monkeypatch):
    """Every seat's answer, at every step, is accepted by the engine."""
    monkeypatch.setattr(engine, "_rng", random.Random(n))
    rng = random.Random(100 + n)
    state = game.initial_state(n, random.Random(n))
    for _ in range(MOVE_CAP):
        if state["phase"] == "finished":
            break
        for seat in range(n):
            move = _ask(state, seat, rng)
            if move is not None:
                game.apply_move(state, seat, move)  # each would be legal
        seat = rng.choice(game.view_for(state, 0)["waitingOn"])
        state = game.apply_move(state, seat, _ask(state, seat, rng))
    assert state["phase"] == "finished"

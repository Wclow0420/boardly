"""Tic-Tac-Toe bots (app/games/tictactoe/bot.py): legal moves only,
whole games end, and the policy wins, blocks and forks."""

import random
from collections import Counter

from app.games.tictactoe.bot import tictactoe as policy
from app.games.tictactoe.game import TicTacToe

game = TicTacToe()


class Sure:
    """An rng that never takes the random move."""

    def random(self):
        return 0.99

    def choice(self, seq):
        return seq[0]


def _board(text):
    return [None if c == "." else c for c in text.replace(" ", "")]


def _view(text, seat=0):
    return {**game.initial_state(2), "board": _board(text), "currentSeat": seat}


def _play(seed):
    rng = random.Random(seed)
    state = game.initial_state(2)
    for _ in range(9):
        if game.get_result(state) is not None:
            break
        waiting = [s for s in (0, 1) if game.bot_move(game.view_for(state, s), s, rng) is not None]
        assert len(waiting) == 1 and waiting[0] == state["currentSeat"]
        seat = waiting[0]
        state = game.apply_move(state, seat, game.bot_move(game.view_for(state, seat), seat, rng))
    result = game.get_result(state)
    assert result is not None
    assert game.bot_move(game.view_for(state, 0), 0, rng) is None
    assert game.bot_move(game.view_for(state, 1), 1, rng) is None
    return result


def test_bots_finish_whole_games():
    results = Counter()
    for seed in range(400):
        result = _play(seed)
        results["draw" if result.get("draw") else result["winnerSeat"]] += 1
    # Mostly draws, but the random move lets games be won
    assert results["draw"] > results[0] + results[1]
    assert results[0] + results[1] > 0


def test_takes_a_win():
    # X to move: 0 1 . / O O . / . . .
    assert policy(_view("XX. OO. ..."), 0, Sure()) == {"cell": 2}


def test_blocks():
    # X to move, O threatens the middle column
    assert policy(_view("XO. .O. ..X"), 0, Sure()) == {"cell": 7}


def test_wins_before_blocking():
    assert policy(_view("OO. XX. ..."), 0, Sure()) == {"cell": 5}


def test_forks():
    # X in opposite corners, O in the centre: 2 or 6 threatens two lines
    assert policy(_view("X.. .O. ..X"), 0, Sure())["cell"] in (2, 6)


def test_centre_then_corner():
    assert policy(_view("... ... ..."), 0, Sure()) == {"cell": 4}
    assert policy(_view("... .X. ...", seat=1), 1, Sure())["cell"] in (0, 2, 6, 8)


def test_waits_for_its_turn_and_the_end():
    rng = random.Random(0)
    assert policy(_view("... ... ...", seat=1), 0, rng) is None
    assert policy(_view("XXX OO. ...", seat=1), 1, rng) is None
    assert policy(_view("XOX XOO OXX", seat=0), 0, rng) is None


def test_sometimes_plays_a_random_square():
    rng = random.Random(1)
    view = _view("XX. OO. ...")
    cells = Counter(policy(view, 0, rng)["cell"] for _ in range(1000))
    assert cells[2] > 800 and len(cells) > 1


def test_a_person_plays_a_bot_through_the_server(client, make_user):
    rooms = "/api/v1/rooms"
    alice = make_user("alice")
    room = client.post(rooms, json={"gameType": "tictactoe"},
                       headers=alice["headers"]).get_json()["room"]
    assert room["botsAvailable"] is True
    client.post(f"{rooms}/{room['id']}/bots", json={"count": 1}, headers=alice["headers"])
    assert client.post(f"{rooms}/{room['id']}/start", headers=alice["headers"]).status_code == 201
    rng = random.Random(4)
    for _ in range(9):
        session = client.get(f"{rooms}/code/{room['code']}",
                             headers=alice["headers"]).get_json()["room"]["session"]
        if session["status"] != "in_progress":
            break
        move = game.bot_move(session["state"], 0, rng)
        assert move is not None
        res = client.post(f"{rooms}/{room['id']}/move", json={"move": move},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    assert session["status"] == "finished"

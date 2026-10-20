"""Reference engine tests — every game engine gets a file like this.
Engines are stateless and pure, so no app/db fixtures are needed."""

from types import SimpleNamespace

import pytest

from app.games.base import GameError
from app.games.tictactoe.game import TicTacToe

game = TicTacToe()


def play(moves):
    """Apply (seat, cell) moves in order and return the final state."""
    state = game.initial_state(2)
    for seat, cell in moves:
        state = game.apply_move(state, seat, {"cell": cell})
    return state


def test_initial_state():
    state = game.initial_state(2)
    assert state["board"] == [None] * 9
    assert state["currentSeat"] == 0
    assert game.get_result(state) is None


def test_moves_alternate_turns():
    state = play([(0, 4)])
    assert state["board"][4] == "X"
    assert state["currentSeat"] == 1


def test_rejects_out_of_turn_move():
    state = game.initial_state(2)
    with pytest.raises(GameError, match="Not your turn"):
        game.apply_move(state, 1, {"cell": 0})


def test_rejects_taken_cell():
    state = play([(0, 4)])
    with pytest.raises(GameError, match="already taken"):
        game.apply_move(state, 1, {"cell": 4})


def test_rejects_invalid_cell():
    state = game.initial_state(2)
    for bad in (-1, 9, None, "4"):
        with pytest.raises(GameError):
            game.apply_move(state, 0, {"cell": bad})


def test_row_win():
    state = play([(0, 0), (1, 3), (0, 1), (1, 4), (0, 2)])
    assert game.get_result(state) == {"winnerSeat": 0}


def test_no_moves_after_game_over():
    state = play([(0, 0), (1, 3), (0, 1), (1, 4), (0, 2)])
    with pytest.raises(GameError, match="already over"):
        game.apply_move(state, 1, {"cell": 5})


def test_draw():
    # X O X / X O O / O X X — full board, no line
    state = play([(0, 0), (1, 1), (0, 2), (1, 4), (0, 3), (1, 5), (0, 7), (1, 6), (0, 8)])
    assert game.get_result(state) == {"draw": True}


# ------------------------------------------------------------ badges


def _row(state, seat):
    won = (game.get_result(state) or {}).get("winnerSeat") == seat
    return SimpleNamespace(won=won, abandoned=False, side=None,
                           **game.player_outcome(state, seat))


def test_fork_badge_needs_two_threats_before_the_last_block():
    fork = next(b for b in game.badges if b.key == "tictactoe.fork")
    # X: centre, corner, corner — threatens 0-3-6 and 2-4-6 at once
    state = play([(0, 4), (1, 1), (0, 0), (1, 8), (0, 6), (1, 3), (0, 2)])
    assert game.get_result(state) == {"winnerSeat": 0}
    assert game.player_outcome(state, 0) == {"role": "X", "facts": {"fork": True}}
    assert fork.match(_row(state, 0)) and not fork.match(_row(state, 1))
    # a plain win: one threat, left open
    state = play([(0, 0), (1, 3), (0, 1), (1, 4), (0, 2)])
    assert game.player_outcome(state, 0)["facts"] == {"fork": False}
    assert not fork.match(_row(state, 0))
    assert game.player_outcome(state, 1)["role"] == "O"

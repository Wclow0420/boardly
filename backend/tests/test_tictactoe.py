"""Reference engine tests — every game engine gets a file like this.
Engines are stateless and pure, so no app/db fixtures are needed."""

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

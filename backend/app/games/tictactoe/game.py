"""Tic-tac-toe engine — reference implementation of BaseGame.

State shape:
{
  "board": [null, null, "X", ...],   # 9 cells, "X" / "O" / null
  "currentSeat": 0,                  # whose turn (seat index)
  "symbols": ["X", "O"],             # seat -> symbol
  "moves": [{"seat": 0, "cell": 4}]  # move history
}
Move shape: {"cell": 0-8}
"""

from app.games.base import BaseGame, GameError

WIN_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),  # columns
    (0, 4, 8), (2, 4, 6),             # diagonals
]


class TicTacToe(BaseGame):
    key = "tictactoe"
    name = "Tic-Tac-Toe"
    min_players = 2
    max_players = 2
    coins_win = 6
    coins_play = 2
    emoji = "⭕"
    tile_color = "#E3F0FF"
    category = "classic"
    tag = "classic"

    def initial_state(self, num_players: int) -> dict:
        return {
            "board": [None] * 9,
            "currentSeat": 0,
            "symbols": ["X", "O"],
            "moves": [],
        }

    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        if self.get_result(state) is not None:
            raise GameError("Game is already over")
        if seat != state["currentSeat"]:
            raise GameError("Not your turn")

        cell = move.get("cell")
        if not isinstance(cell, int) or not 0 <= cell <= 8:
            raise GameError("Move must include a cell between 0 and 8")
        if state["board"][cell] is not None:
            raise GameError("Cell is already taken")

        board = list(state["board"])
        board[cell] = state["symbols"][seat]
        return {
            **state,
            "board": board,
            "currentSeat": (seat + 1) % 2,
            "moves": state["moves"] + [{"seat": seat, "cell": cell}],
        }

    def get_result(self, state: dict) -> dict | None:
        board = state["board"]
        for a, b, c in WIN_LINES:
            if board[a] is not None and board[a] == board[b] == board[c]:
                return {"winnerSeat": state["symbols"].index(board[a])}
        if all(cell is not None for cell in board):
            return {"draw": True}
        return None


game = TicTacToe()

"""How a bot plays Tic-Tac-Toe: win if it can, else block, else fork,
else the centre, a corner, an edge. One move in seven or so is a plain
random square, so people can beat it now and then."""

WIN_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),
    (0, 3, 6), (1, 4, 7), (2, 5, 8),
    (0, 4, 8), (2, 4, 6),
]
CORNERS = (0, 2, 6, 8)
EDGES = (1, 3, 5, 7)
RANDOM = 0.15


def _winning(board: list, symbol) -> list[int]:
    """Empty squares that complete a line for `symbol`."""
    cells = []
    for line in WIN_LINES:
        marks = [board[i] for i in line]
        if marks.count(symbol) == 2 and marks.count(None) == 1:
            cells.append(line[marks.index(None)])
    return cells


def _over(board: list) -> bool:
    return all(c is not None for c in board) or any(
        board[a] is not None and board[a] == board[b] == board[c] for a, b, c in WIN_LINES
    )


def tictactoe(view: dict, seat: int, rng) -> dict | None:
    board = view["board"]
    if view["currentSeat"] != seat or _over(board):
        return None
    empty = [i for i, c in enumerate(board) if c is None]
    if rng.random() < RANDOM:
        return {"cell": rng.choice(empty)}

    me = view["symbols"][seat]
    them = view["symbols"][1 - seat]
    for symbol in (me, them):  # win, else block
        cells = _winning(board, symbol)
        if cells:
            return {"cell": rng.choice(cells)}
    forks = [
        i for i in empty
        if len(set(_winning(board[:i] + [me] + board[i + 1:], me))) >= 2
    ]
    if forks:
        return {"cell": rng.choice(forks)}
    if board[4] is None:
        return {"cell": 4}
    for group in (CORNERS, EDGES):
        free = [i for i in group if board[i] is None]
        if free:
            return {"cell": rng.choice(free)}
    return None  # unreachable: the board has an empty square

// Client-side tic-tac-toe rules — mirrors backend
// (backend/app/games/tictactoe/game.py). The backend is authoritative;
// this is used for instant UI feedback (disable taken cells, show
// whose turn, highlight the winning line).

export type Cell = "X" | "O" | null;

export interface TicTacToeState {
  board: Cell[];
  currentSeat: number;
  symbols: ["X", "O"];
  moves: { seat: number; cell: number }[];
}

export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function isLegalMove(state: TicTacToeState, cell: number): boolean {
  return cell >= 0 && cell <= 8 && state.board[cell] === null;
}

export function winningLine(
  state: TicTacToeState
): [number, number, number] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (
      state.board[a] !== null &&
      state.board[a] === state.board[b] &&
      state.board[a] === state.board[c]
    ) {
      return line;
    }
  }
  return null;
}

export function isDraw(state: TicTacToeState): boolean {
  return winningLine(state) === null && state.board.every((c) => c !== null);
}

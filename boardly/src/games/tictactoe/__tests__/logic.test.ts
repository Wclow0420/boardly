// Game logic is pure functions — the highest-value tests in the app.
// Every game folder ships a logic.test.ts like this one.

import {
  isDraw,
  isLegalMove,
  winningLine,
  type Cell,
  type TicTacToeState,
} from "../logic";

function makeState(board: Cell[]): TicTacToeState {
  return { board, currentSeat: 0, symbols: ["X", "O"], moves: [] };
}

const EMPTY = makeState(Array(9).fill(null));

describe("isLegalMove", () => {
  it("allows any empty cell on an empty board", () => {
    for (let cell = 0; cell < 9; cell++) {
      expect(isLegalMove(EMPTY, cell)).toBe(true);
    }
  });

  it("rejects taken cells", () => {
    const state = makeState(["X", null, null, null, null, null, null, null, null]);
    expect(isLegalMove(state, 0)).toBe(false);
    expect(isLegalMove(state, 1)).toBe(true);
  });

  it("rejects out-of-range cells", () => {
    expect(isLegalMove(EMPTY, -1)).toBe(false);
    expect(isLegalMove(EMPTY, 9)).toBe(false);
  });
});

describe("winningLine", () => {
  it("returns null for an empty board", () => {
    expect(winningLine(EMPTY)).toBeNull();
  });

  it("detects a row win", () => {
    const state = makeState(["X", "X", "X", "O", "O", null, null, null, null]);
    expect(winningLine(state)).toEqual([0, 1, 2]);
  });

  it("detects a column win", () => {
    const state = makeState(["O", "X", null, "O", "X", null, "O", null, null]);
    expect(winningLine(state)).toEqual([0, 3, 6]);
  });

  it("detects a diagonal win", () => {
    const state = makeState(["X", "O", null, "O", "X", null, null, null, "X"]);
    expect(winningLine(state)).toEqual([0, 4, 8]);
  });
});

describe("isDraw", () => {
  it("is false while the board has empty cells", () => {
    expect(isDraw(EMPTY)).toBe(false);
  });

  it("is true for a full board with no winner", () => {
    const state = makeState(["X", "O", "X", "X", "O", "O", "O", "X", "X"]);
    expect(isDraw(state)).toBe(true);
  });

  it("is false for a full board with a winner", () => {
    const state = makeState(["X", "X", "X", "O", "O", "X", "O", "X", "O"]);
    expect(isDraw(state)).toBe(false);
  });
});

import type { GameDefinition } from "../types";
import { TicTacToeBoard } from "./TicTacToeBoard";
import type { TicTacToeState } from "./logic";

export const tictactoe: GameDefinition<TicTacToeState> = {
  key: "tictactoe",
  name: "Tic-Tac-Toe",
  minPlayers: 2,
  maxPlayers: 2,
  Board: TicTacToeBoard,
  currentSeat: (state) => state.currentSeat,
};

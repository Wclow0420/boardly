import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
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
  badges: {
    "tictactoe.firstWin": { glyph: G.xo, loop: "pulse", face: "#2F5D8A" },
    "tictactoe.master": { glyph: G.crown, loop: "spin", face: "#2F5D8A" },
  },
};

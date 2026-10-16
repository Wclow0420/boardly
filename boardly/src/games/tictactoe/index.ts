import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BADGE_FRAMES } from "./badgeFrames";
import { TicTacToeBoard } from "./TicTacToeBoard";
import type { TicTacToeState } from "./logic";
import { TICTACTOE_RULES } from "./rules";

export const tictactoe: GameDefinition<TicTacToeState> = {
  key: "tictactoe",
  name: "Tic-Tac-Toe",
  minPlayers: 2,
  maxPlayers: 2,
  rulePages: TICTACTOE_RULES,
  Board: TicTacToeBoard,
  currentSeat: (state) => state.currentSeat,
  layout: "stage",
  badges: {
    "tictactoe.master": { glyph: G.crown, emoji: "👑", loop: "spin", face: "#2F5D8A" },
    "tictactoe.fork": { glyph: G.xo, emoji: "⚡", loop: "pulse", face: "#2F5D8A" },
  },
  badgeFrames: BADGE_FRAMES,
};

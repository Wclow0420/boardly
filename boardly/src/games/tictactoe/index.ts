import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BADGE_FRAMES } from "./badgeFrames";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { FIRST_SEAT, SYMBOLS, WIN_LINES, type TicTacToeState } from "./logic";
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
  // what the two at the table play: who has which mark, who starts, what wins
  tableNotes: (_players, t) => {
    const first = SYMBOLS[FIRST_SEAT];
    const second = SYMBOLS[(FIRST_SEAT + 1) % SYMBOLS.length];
    const line = WIN_LINES[0].length;
    return [
      {
        emoji: "⭕",
        text: t("tictactoe.table.first", { first: t(`tictactoe.marks.${first}`), second: t(`tictactoe.marks.${second}`) }),
        short: t("tictactoe.table.firstShort", { mark: first }),
      },
      {
        emoji: "🏆",
        text: t("tictactoe.table.line", { count: line, cells: line * line }),
        short: t("tictactoe.table.lineShort", { count: line }),
      },
    ];
  },
};

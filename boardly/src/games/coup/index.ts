import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { BADGE_FRAMES } from "./badgeFrames";
import { CoupBoard } from "./CoupBoard";
import {
  CARDS_EACH,
  COPIES_PER_ROLE,
  DECK_SIZE,
  FORCED_COUP_AT,
  STARTING_COINS,
  currentSeat,
  firstPlayerCoins,
  taskFor,
  type CoupState,
} from "./logic";
import { COUP_RULES } from "./rules";

export const coup: GameDefinition<CoupState> = {
  key: "coup",
  name: "Hustle",
  minPlayers: 2,
  maxPlayers: 6,
  category: "bluff",
  Board: CoupBoard,
  currentSeat,
  layout: "stage",
  rulePages: COUP_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#22335A", "rgba(10,16,32,0)"],
    backdropImage: BACKDROP,
    logo: LOGO,
    taglineKey: "coup.tagline",
  },
  needsMe: (state, mySeat) =>
    state.phase !== "finished" && taskFor(state, mySeat) !== null,
  badges: {
    "coup.kingpin": { glyph: G.coins, emoji: "🪙", loop: "spin" },
    "coup.untouchable": { glyph: G.star, emoji: "🛡", loop: "pulse" },
    "coup.smooth": { glyph: G.mask, emoji: "🎭", loop: "sway" },
    "coup.sharpEye": { glyph: G.target, emoji: "🔍", loop: "bob" },
  },
  badgeFrames: BADGE_FRAMES,
  tableNotes: (players, t) => [
    {
      emoji: "🪙",
      text:
        firstPlayerCoins(players) < STARTING_COINS
          ? t("coup.table.coinsTwo", { count: STARTING_COINS, first: firstPlayerCoins(players) })
          : t("coup.table.coins", { count: STARTING_COINS }),
      short: t("coup.table.coinsShort", { count: STARTING_COINS }),
    },
    {
      emoji: "🕴",
      text: t("coup.table.cards", { count: CARDS_EACH }),
      short: t("coup.table.cardsShort", { count: CARDS_EACH }),
    },
    {
      emoji: "🔄",
      text: t("coup.table.deck", {
        size: DECK_SIZE,
        copies: COPIES_PER_ROLE,
        left: Math.max(0, DECK_SIZE - CARDS_EACH * players),
      }),
    },
    { emoji: "🔒", text: t("coup.table.forced", { count: FORCED_COUP_AT }) },
  ],
};

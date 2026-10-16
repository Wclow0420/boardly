import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { BADGE_FRAMES } from "./badgeFrames";
import { CoupBoard } from "./CoupBoard";
import { currentSeat, taskFor, type CoupState } from "./logic";
import { COUP_RULES } from "./rules";

export const coup: GameDefinition<CoupState> = {
  key: "coup",
  name: "Hustle",
  minPlayers: 2,
  maxPlayers: 6,
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
};

import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { AvalonBoard } from "./AvalonBoard";
import { BADGE_FRAMES } from "./badgeFrames";
import { currentSeat, pendingAction, type AvalonState } from "./logic";
import { AVALON_RULES } from "./rules";

export const avalon: GameDefinition<AvalonState> = {
  key: "avalon",
  name: "Double Agent",
  minPlayers: 5,
  maxPlayers: 10,
  Board: AvalonBoard,
  currentSeat,
  layout: "stage",
  rulePages: AVALON_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#12393A", "rgba(11,17,20,0)"],
    backdropImage: BACKDROP,
    logo: LOGO,
    taglineKey: "avalon.tagline",
  },
  needsMe: (state, mySeat) =>
    state.phase !== "finished" && pendingAction(state, mySeat) !== null,
  badges: {
    "avalon.firstOp": { glyph: G.star, emoji: "★", loop: "pulse" },
    "avalon.mole": { glyph: G.mask, emoji: "🎭", loop: "bob" },
    "avalon.hitman": { glyph: G.target, emoji: "🎯", loop: "spin" },
    "avalon.spymaster": { glyph: G.crown, emoji: "🕵", loop: "pulse" },
  },
  badgeFrames: BADGE_FRAMES,
};

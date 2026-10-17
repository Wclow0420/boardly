import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { AvalonBoard } from "./AvalonBoard";
import { BADGE_FRAMES } from "./badgeFrames";
import {
  MAX_REJECTIONS,
  PLAYER_COUNTS,
  QUEST_SIZES,
  ROLE_SETS,
  currentSeat,
  failsNeeded,
  pendingAction,
  sideOf,
  type AvalonState,
  type Role,
  type Side,
} from "./logic";
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
    "avalon.handler": { glyph: G.star, emoji: "🎧", loop: "pulse" },
    "avalon.spymaster": { glyph: G.crown, emoji: "🕵", loop: "pulse" },
  },
  badgeFrames: BADGE_FRAMES,
  tableNotes: (players, t) => {
    const n = Math.min(Math.max(players, PLAYER_COUNTS[0]), PLAYER_COUNTS[PLAYER_COUNTS.length - 1]);
    const roles = ROLE_SETS[n];
    // the roles on one side, each once, with how many there are
    const listOf = (side: Side) => {
      const seen = new Map<Role, number>();
      roles.filter((r) => sideOf(r) === side).forEach((r) => seen.set(r, (seen.get(r) ?? 0) + 1));
      return [...seen]
        .map(([role, count]) => {
          const name = t(`avalon.roles.${role}.name`);
          return count > 1 ? t("avalon.table.times", { name, count }) : name;
        })
        .join(t("avalon.table.sep"));
    };
    const agents = roles.filter((r) => sideOf(r) === "good").length;
    const moles = roles.length - agents;
    const sizes = QUEST_SIZES[n];
    const hard = sizes.findIndex((_, q) => failsNeeded(n, q) > 1);
    return [
      {
        emoji: "🕵",
        text: t("avalon.table.sides", { agents, moles }),
        short: t("avalon.table.sidesShort", { agents, moles }),
      },
      { emoji: "🎧", text: t("avalon.table.agents", { roles: listOf("good") }) },
      { emoji: "🐀", text: t("avalon.table.moles", { roles: listOf("evil") }) },
      { emoji: "💼", text: t("avalon.table.teams", { sizes: sizes.join(" · ") }) },
      {
        emoji: "✕",
        text: hard >= 0 ? t("avalon.table.twoFails", { op: hard + 1, count: failsNeeded(n, hard) }) : t("avalon.table.oneFail"),
      },
      { emoji: "🔒", text: t("avalon.table.rejections", { count: MAX_REJECTIONS }) },
    ];
  },
};

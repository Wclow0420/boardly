import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BADGE_FRAMES } from "./badgeFrames";
import { ManorBoard } from "./ManorBoard";
import {
  HOURS,
  INTRUDERS_BY_COUNT,
  OWNER_HP,
  PLAYER_COUNTS,
  ROLE_SETS,
  currentSeat,
  taskFor,
  type ManorState,
  type Role,
} from "./logic";
import { MANOR_RULES } from "./rules";

// Candlelit night: deep plum, warm amber highlights.
const SKIN_COLORS = {
  background: "#0E0B14",
  surface: "#0E0B14",
  card: "#18131F",
  well: "#211A2B",
  chip: "#211A2B",
  border: "#342A40",
  divider: "#241D2E",
  text: "#F3EEF7",
  textMuted: "#B5A9C2",
  textSubtle: "#857A93",
  icon: "#F3EEF7",
  iconMuted: "#857A93",
  primary: "#F5B544",
  primaryPressed: "#DB9B2C",
  primaryContrast: "#241603",
  primarySoft: "#2E2414",
  primarySoftBorder: "#7A5A22",
  accent: "#F5B544",
  accentPressed: "#DB9B2C",
  onAccent: "#241603",
  success: "#34D399",
  successSoft: "#12302A",
  successStrong: "#5EE0A8",
  danger: "#F0605D",
  info: "#9CB8FF",
  infoSoft: "#1B2240",
  toggleOff: "#3D3349",
  overlay: "rgba(5,3,8,0.76)",
};

export const manor: GameDefinition<ManorState> = {
  key: "manor",
  name: "Midnight Manor",
  minPlayers: 4,
  maxPlayers: 8,
  rulePages: MANOR_RULES,
  Board: ManorBoard,
  currentSeat,
  layout: "custom",
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#3A2A12", "rgba(14,11,20,0)"],
    taglineKey: "manor.tagline",
  },
  needsMe: (state, mySeat) => taskFor(state, mySeat) !== null,
  badges: {
    "manor.dawn": { glyph: G.sunrise, emoji: "🌅", loop: "bob" },
    "manor.intruder": { glyph: G.mask, emoji: "🎭", loop: "bob" },
    "manor.caught": { glyph: G.target, emoji: "🎯", loop: "pulse" },
    "manor.lord": { glyph: G.crown, emoji: "👑", loop: "spin" },
  },
  badgeFrames: BADGE_FRAMES,
  // what a table of this size means: the intruders among you, the roles
  // dealt, the night's length (from the tables in logic.ts)
  tableNotes: (players, t) => {
    const n = Math.min(Math.max(players, PLAYER_COUNTS[0]), PLAYER_COUNTS[PLAYER_COUNTS.length - 1]);
    const dealt = ROLE_SETS[n];
    const intruders = INTRUDERS_BY_COUNT[n];
    const roles = [...new Set(dealt)]
      .map((role: Role) => {
        const name = t(`manor.roles.${role}.name`);
        const copies = dealt.filter((r) => r === role).length;
        return copies > 1 ? t("manor.table.copies", { role: name, n: copies }) : name;
      })
      .join(t("manor.table.join"));
    return [
      {
        emoji: "🗡",
        text: t("manor.table.intruders", { count: intruders, household: n - intruders }),
        short: t("manor.table.intrudersShort", { count: intruders }),
      },
      { emoji: "🤵", text: t("manor.table.roles", { roles }) },
      {
        emoji: "🕰",
        text: t("manor.table.night", { hours: HOURS, from: t("manor.hours.h0"), to: t(`manor.hours.h${HOURS}`), hits: OWNER_HP }),
        short: t("manor.table.nightShort", { hours: HOURS }),
      },
      ...(intruders === 1 ? [{ emoji: "🔪", text: t("manor.table.knife") }] : []),
    ];
  },
};

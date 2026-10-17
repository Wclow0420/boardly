import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { GameDefinition } from "../types";
import { BADGE_FRAMES } from "./badgeFrames";
import { LiarsDiceBoard } from "./LiarsDiceBoard";
import {
  CALLINGS,
  DICE_EACH,
  DRINKS,
  KNOCKOUT_CUPS,
  currentSeat,
  openingFor,
  taskFor,
  thresholds,
  type Calling,
  type LiarsDiceState,
} from "./logic";
import { LIARSDICE_RULES } from "./rules";

// Late-night bar: dark wood, neon red, beer gold.
const SKIN_COLORS = {
  background: "#140C0C",
  surface: "#140C0C",
  card: "#1F1414",
  well: "#2A1B1B",
  chip: "#2A1B1B",
  border: "#3D2828",
  divider: "#2B1D1D",
  text: "#F7EFEA",
  textMuted: "#C4AFA8",
  textSubtle: "#927C76",
  icon: "#F7EFEA",
  iconMuted: "#927C76",
  primary: "#F6B93B",
  primaryPressed: "#DC9F22",
  primaryContrast: "#281A02",
  primarySoft: "#33240D",
  primarySoftBorder: "#82601F",
  accent: "#F6B93B",
  accentPressed: "#DC9F22",
  onAccent: "#281A02",
  success: "#34D399",
  successSoft: "#12302A",
  successStrong: "#5EE0A8",
  danger: "#F0605D",
  info: "#9CB8FF",
  infoSoft: "#1B2240",
  toggleOff: "#4A3434",
  overlay: "rgba(8,3,3,0.76)",
};

export const liarsdice: GameDefinition<LiarsDiceState> = {
  key: "liarsdice",
  name: "Liar's Dice",
  minPlayers: 2,
  maxPlayers: 10,
  rulePages: LIARSDICE_RULES,
  Board: LiarsDiceBoard,
  currentSeat,
  layout: "stage",
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#4A1414", "rgba(20,12,12,0)"],
    taglineKey: "liarsdice.tagline",
  },
  needsMe: (state, mySeat) => taskFor(state, mySeat) !== null,
  badges: {
    "liarsdice.bluffer": { glyph: G.die, emoji: "🎲", loop: "tumble" },
    "liarsdice.sober": { glyph: G.cup, emoji: "🥤", loop: "bob" },
    "liarsdice.counter": { glyph: G.target, emoji: "🥊", loop: "pulse" },
  },
  badgeFrames: BADGE_FRAMES,
  // what this many at the bar means: the dice under the cups, where each
  // way of calling starts, what a lost call costs, when you're out
  tableNotes: (players, t) => {
    const [one, zhai, fei] = thresholds(players);
    const rule: Record<Calling, string> = {
      jijiji: t("liarsdice.openRule.jijiji", { one, zhai, fei }),
      classic: t("liarsdice.openRule.classic", { zhai: openingFor(players, true), kai: openingFor(players, false) }),
      nozhai: t("liarsdice.openRule.nozhai", { min: openingFor(players, false) }),
    };
    return [
      {
        emoji: "🎲",
        text: t("liarsdice.table.dice", { count: players * DICE_EACH, each: DICE_EACH }),
        short: t("liarsdice.table.diceShort", { count: players * DICE_EACH }),
      },
      ...CALLINGS.map((calling) => ({
        emoji: "🎯",
        text: t("liarsdice.table.calling", { name: t(`gameOptions.liarsdice.calling.${calling}.name`), rule: rule[calling] }),
      })),
      { emoji: "🍺", text: t("liarsdice.table.drinks", DRINKS) },
      { emoji: "🍻", text: t("liarsdice.table.knockout", { count: KNOCKOUT_CUPS }) },
    ];
  },
};

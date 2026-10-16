import { GLYPHS } from "./icons";
import { ManorBoxArt } from "./BoxArt";
import type { GameDefinition } from "../types";
import { NightwatchBoard } from "./NightwatchBoard";
import { NIGHTWATCH_RULES } from "./rules";
import { currentSeat, taskFor, type NightwatchState } from "./logic";

// Lamplight in a haunted house: ink-blue night, warm lantern red-gold.
const SKIN_COLORS = {
  background: "#0B0E16",
  surface: "#0B0E16",
  card: "#141927",
  well: "#1B2133",
  chip: "#1B2133",
  border: "#2C3550",
  divider: "#1F2638",
  text: "#F1F0EA",
  textMuted: "#AEB3C6",
  textSubtle: "#7C8299",
  icon: "#F1F0EA",
  iconMuted: "#7C8299",
  primary: "#F28B4B",
  primaryPressed: "#D97234",
  primaryContrast: "#2A1206",
  primarySoft: "#2E1D16",
  primarySoftBorder: "#7D4426",
  accent: "#F28B4B",
  accentPressed: "#D97234",
  onAccent: "#2A1206",
  success: "#34D399",
  successSoft: "#12302A",
  successStrong: "#5EE0A8",
  danger: "#F0605D",
  info: "#9CB8FF",
  infoSoft: "#1B2240",
  toggleOff: "#343C55",
  overlay: "rgba(4,5,10,0.78)",
};

export const nightwatch: GameDefinition<NightwatchState> = {
  key: "nightwatch",
  name: "Seal the Manor",
  minPlayers: 5,
  maxPlayers: 10,
  Board: NightwatchBoard,
  currentSeat,
  layout: "custom",
  rulePages: NIGHTWATCH_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#3B1E12", "rgba(11,14,22,0)"],
    taglineKey: "nightwatch.tagline",
  },
  needsMe: (state, mySeat) => taskFor(state, mySeat) !== null,
  boxArt: ManorBoxArt,
  badges: {
    "nightwatch.sealed": { glyph: GLYPHS.candle, emoji: "🕯", loop: "sway" },
    "nightwatch.possessed": { glyph: GLYPHS.ghost, emoji: "👻", loop: "bob" },
    "nightwatch.prophet": { glyph: GLYPHS.eye, emoji: "👀", loop: "pulse" },
    "nightwatch.sharpEye": { glyph: GLYPHS.dagger, emoji: "🗡", loop: "sway" },
    "nightwatch.ghostbreaker": { glyph: GLYPHS.orb, emoji: "🔮", loop: "spin" },
  },
};

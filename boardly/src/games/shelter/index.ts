import { GLYPHS } from "./icons";
import type { GameDefinition } from "../types";
import { BADGE_FRAMES } from "./badgeFrames";
import { ShelterBoxArt } from "./BoxArt";
import { ShelterBoard } from "./ShelterBoard";
import { SHELTER_RULES } from "./rules";
import { COUNTS, DAYS, canSneak, currentSeat, placesFor, startFood, type ShelterState } from "./logic";

// A winter night: cold blue-grey, the warm orange of the fire.
const SKIN_COLORS = {
  background: "#0C1118",
  surface: "#0C1118",
  card: "#151C26",
  well: "#1C2532",
  chip: "#1C2532",
  border: "#2C384A",
  divider: "#1F2835",
  text: "#EEF2F6",
  textMuted: "#A9B4C4",
  textSubtle: "#77839A",
  icon: "#EEF2F6",
  iconMuted: "#77839A",
  primary: "#FF9A4D",
  primaryPressed: "#E8803C",
  primaryContrast: "#2A1206",
  primarySoft: "#2E1F16",
  primarySoftBorder: "#7D4A26",
  accent: "#FF9A4D",
  accentPressed: "#E8803C",
  onAccent: "#2A1206",
  success: "#5EE0A8",
  successSoft: "#12302A",
  successStrong: "#7BE3B0",
  danger: "#F0605D",
  info: "#9CC8FF",
  infoSoft: "#1B2840",
  toggleOff: "#343F55",
  overlay: "rgba(4,6,10,0.78)",
};

export const shelter: GameDefinition<ShelterState> = {
  key: "shelter",
  name: "Shelter",
  minPlayers: 4,
  maxPlayers: 8,
  category: "deduction",
  Board: ShelterBoard,
  currentSeat,
  layout: "custom",
  rulePages: SHELTER_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#1E2E44", "rgba(12,17,24,0)"],
    taglineKey: "shelter.tagline",
  },
  needsMe: (state) => state.canAct,
  boxArt: ShelterBoxArt,
  badges: {
    "shelter.rescued": { glyph: GLYPHS.rescue, emoji: "🚚", loop: "bob" },
    "shelter.patientZero": { glyph: GLYPHS.infected, emoji: "☣", loop: "spin" },
    "shelter.caught": { glyph: GLYPHS.exile, emoji: "🚷", loop: "pulse" },
    "shelter.fullLarder": { glyph: GLYPHS.food, emoji: "🍞", loop: "pulse" },
    "shelter.lastWinter": { glyph: GLYPHS.fire, emoji: "🔥", loop: "flicker" },
  },
  badgeFrames: BADGE_FRAMES,
  tableNotes: (players, t) => {
    const counts = Object.keys(COUNTS).map(Number);
    const n = Math.min(Math.max(players, counts[0]), counts[counts.length - 1]);
    const [infected, rescue, famine] = COUNTS[n];
    const names = placesFor(n).map((p) => t(`shelter.places.${p}`));
    const places =
      names.length > 2
        ? t("shelter.table.placesThree", { a: names[0], b: names[1], c: names[2] })
        : t("shelter.table.placesTwo", { a: names[0], b: names[1] });
    return [
      {
        emoji: "☣",
        text: infected > 1 ? t("shelter.table.infectedTwo", { count: infected }) : t("shelter.table.infectedOne"),
        short: t("shelter.table.infectedShort", { count: infected }),
      },
      {
        emoji: "🍞",
        text: t("shelter.table.food", { count: startFood(n) }),
        short: t("shelter.table.foodShort", { count: startFood(n) }),
      },
      { emoji: "🚚", text: t("shelter.table.rescue", { days: DAYS, count: rescue }) },
      { emoji: "⚰", text: t("shelter.table.famine", { count: famine }) },
      { emoji: "🌾", text: places },
      ...(canSneak(n) ? [{ emoji: "👣", text: t("shelter.table.sneak") }] : []),
    ];
  },
};

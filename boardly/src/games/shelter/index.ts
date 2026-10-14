import type { GameDefinition } from "../types";
import { ShelterBoard } from "./ShelterBoard";
import { SHELTER_RULES } from "./rules";
import { currentSeat, type ShelterState } from "./logic";

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
};

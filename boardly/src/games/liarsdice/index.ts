import type { GameDefinition } from "../types";
import { LiarsDiceBoard } from "./LiarsDiceBoard";
import { currentSeat, taskFor, type LiarsDiceState } from "./logic";

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
  Board: LiarsDiceBoard,
  currentSeat,
  layout: "custom",
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#4A1414", "rgba(20,12,12,0)"],
    taglineKey: "liarsdice.tagline",
  },
  needsMe: (state, mySeat) => taskFor(state, mySeat) !== null,
};

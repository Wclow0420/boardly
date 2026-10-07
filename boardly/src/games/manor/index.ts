import type { GameDefinition } from "../types";
import { ManorBoard } from "./ManorBoard";
import { currentSeat, taskFor, type ManorState } from "./logic";

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
  Board: ManorBoard,
  currentSeat,
  layout: "custom",
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#3A2A12", "rgba(14,11,20,0)"],
    taglineKey: "manor.tagline",
  },
  needsMe: (state, mySeat) => taskFor(state, mySeat) !== null,
};

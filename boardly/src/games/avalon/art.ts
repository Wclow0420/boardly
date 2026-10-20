// Double Agent's artwork. The roles are drawn, not pictures: each is its
// engraved portrait (emblems.ts) on its card face (cards.ts), in the game
// and in the rules. The images here are the backdrop, logo and mission
// cards (sizes in assets/games/double-agent/README).
//
// Role ids are the engine's internal ones: merlin = Handler,
// percival = Bodyguard, servant = Field Agent, assassin = Hitman,
// morgana = Decoy, mordred = Sleeper, oberon = Wildcard, minion = Mole.

import type { ImageSourcePropType } from "react-native";

export const BACKDROP: ImageSourcePropType | undefined = require("../../../assets/games/double-agent/backdrop.webp");
export const LOGO: ImageSourcePropType | undefined = require("../../../assets/games/double-agent/logo-trimmed.png");
export const SUCCESS_CARD: ImageSourcePropType | undefined = require("../../../assets/games/double-agent/card-success.png");
export const FAIL_CARD: ImageSourcePropType | undefined = require("../../../assets/games/double-agent/card-fail.png");

export const SKIN_COLORS = {
  background: "#0B1114",
  surface: "#0B1114",
  card: "#131C21",
  well: "#1A262C",
  chip: "#1A262C",
  border: "#27373F",
  divider: "#1C2A31",
  text: "#EEF4F3",
  textMuted: "#A6B6B8",
  textSubtle: "#7B8C90",
  icon: "#EEF4F3",
  iconMuted: "#7B8C90",
  primary: "#2DD4BF",
  primaryPressed: "#1FB5A3",
  primaryContrast: "#06201C",
  primarySoft: "#10292A",
  primarySoftBorder: "#1F6F68",
  accent: "#2DD4BF",
  accentPressed: "#1FB5A3",
  onAccent: "#06201C",
  success: "#34D399",
  successSoft: "#12302A",
  successStrong: "#5EE0A8",
  danger: "#F0605D",
  info: "#7CC4FF",
  infoSoft: "#15293A",
  toggleOff: "#33454D",
  overlay: "rgba(2,6,8,0.74)",
};

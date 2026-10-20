// Hustle's artwork. The roles are drawn, not pictures: each is a faceless
// meeple portrait (emblems.ts), standing in its card's enamel window
// (cards.tsx) and on its own in the rules. The images here are the backdrop, logo and
// card back (sizes in assets/games/hustle/README).

import type { ImageSourcePropType } from "react-native";

import type { ActionType, Role } from "./logic";

export const BACKDROP: ImageSourcePropType | undefined = require("../../../assets/games/hustle/backdrop.webp");
// logo.png cropped, brightened and given a soft halo
export const LOGO: ImageSourcePropType | undefined = require("../../../assets/games/hustle/logo-trimmed.png");
export const CARD_BACK: ImageSourcePropType | undefined = require("../../../assets/games/hustle/card-back.png");

/** Picture badges for the actions, drawn in place of the tinted circle.
 *  None: each action is its engraved emblem (ACTION_EMOJI, drawn by
 *  <Emblem>) in a circle of its tint, in the app's own style. */
export const ACTION_ART: Partial<Record<ActionType, ImageSourcePropType>> = {};

/** The roles' emoji, for lines of text; pictured, a role is its
 *  portrait (ROLE_EMBLEMS in emblems.ts). */
export const ROLE_EMOJI: Record<Role, string> = {
  duke: "🕴️",
  assassin: "👊",
  captain: "🧤",
  ambassador: "🤝",
  contessa: "👵",
};

export const ACTION_EMOJI: Record<ActionType, string> = {
  income: "💼",
  foreignAid: "🫴",
  tax: "🪙",
  steal: "👛",
  exchange: "🔄",
  assassinate: "🥊",
  coup: "🔒",
};

/** Accent colour per role / action (tile border, icon circle). */
export const ROLE_TINT: Record<Role, string> = {
  duke: "#F5B93A",
  assassin: "#34D399",
  captain: "#E0964A",
  ambassador: "#A78BFA",
  contessa: "#F472B6",
};

export const ACTION_TINT: Record<ActionType, string> = {
  income: "#60A5FA",
  foreignAid: "#38BDF8",
  tax: ROLE_TINT.duke,
  steal: ROLE_TINT.captain,
  exchange: ROLE_TINT.ambassador,
  assassinate: ROLE_TINT.assassin,
  coup: "#94A3B8",
};

export const SKIN_COLORS = {
  background: "#0A1020",
  surface: "#0A1020",
  card: "#131C30",
  well: "#1A2540",
  chip: "#1A2540",
  border: "#27344F",
  divider: "#1C2740",
  text: "#F2F4F8",
  textMuted: "#A9B4C8",
  textSubtle: "#7D8AA3",
  icon: "#F2F4F8",
  iconMuted: "#7D8AA3",
  primary: "#F5B93A",
  primaryPressed: "#D99A1F",
  primaryContrast: "#141B2B",
  primarySoft: "#2A2413",
  primarySoftBorder: "#8A6A22",
  overlay: "rgba(3,6,14,0.72)",
};

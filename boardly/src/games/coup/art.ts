// Hustle's artwork. Every slot is optional: without an image the game
// draws a placeholder (emoji in a tinted circle, a glow for the
// backdrop). To add art, put the file in assets/games/hustle/ (sizes in
// that folder's README) and register it here, for example:
//
//   export const ROLE_ART: Partial<Record<Role, ImageSourcePropType>> = {
//     duke: require("../../../assets/games/hustle/role-boss.png"),
//   };

import type { ImageSourcePropType } from "react-native";

import type { ActionType, Role } from "./logic";

export const BACKDROP: ImageSourcePropType | undefined = require("../../../assets/games/hustle/backdrop.webp");
// logo.png cropped, brightened and given a soft halo
export const LOGO: ImageSourcePropType | undefined = require("../../../assets/games/hustle/logo-trimmed.png");
export const CARD_BACK: ImageSourcePropType | undefined = require("../../../assets/games/hustle/card-back.png");

export const ROLE_ART: Partial<Record<Role, ImageSourcePropType>> = {
  duke: require("../../../assets/games/hustle/role-boss.png"),
  assassin: require("../../../assets/games/hustle/role-enforcer.png"),
  captain: require("../../../assets/games/hustle/role-pickpocket.png"),
  ambassador: require("../../../assets/games/hustle/role-fixer.png"),
  contessa: require("../../../assets/games/hustle/role-auntie.png"),
};

/** Complete round badges — drawn in place of the tinted icon circle. */
export const ACTION_ART: Partial<Record<ActionType, ImageSourcePropType>> = {
  income: require("../../../assets/games/hustle/action-dayjob.png"),
  foreignAid: require("../../../assets/games/hustle/action-borrow.png"),
  tax: require("../../../assets/games/hustle/action-rent.png"),
  steal: require("../../../assets/games/hustle/action-pickpocket.png"),
  exchange: require("../../../assets/games/hustle/action-swap.png"),
  assassinate: require("../../../assets/games/hustle/action-roughup.png"),
  coup: require("../../../assets/games/hustle/action-shutdown.png"),
};

/** Placeholder glyphs used until art is registered above. */
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

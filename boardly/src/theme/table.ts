// The app's game-table look: dark wood, cream ink, bright game pieces.
// TABLE holds the decorative colours (frames, ribbons, buttons);
// TABLE_COLORS maps the look onto the theme's semantic names so the
// whole UI kit follows it.

import type { ImageSourcePropType } from "react-native";

import type { ColorScheme } from "./colors";

/** Full-screen table art behind the app's pages. Optional — without it
 *  the pages get the plain wood gradient. */
export const TABLE_BACKGROUND: ImageSourcePropType | undefined = require("../../assets/ui/home/background.webp");

export const TABLE = {
  table: ["#2B1D13", "#1A120C"] as [string, string],
  cream: "#F6E9D2",
  creamMuted: "#D8C6A6",
  ink: "#3A2408",

  // Frames: fill, lighter inner line, border
  yellow: { fill: ["#F7C948", "#E9A92B"] as [string, string], border: "#7A4E1C", inner: "#FBDD7E" },
  blue: { fill: ["#234469", "#1A3352"] as [string, string], border: "#12233A", inner: "#4E7BB0" },
  wood: { fill: ["#6A4528", "#4E321C"] as [string, string], border: "#2E1C0F", inner: "#9A6B43" },
  dark: { fill: ["#3A281B", "#2A1C12"] as [string, string], border: "#170E08", inner: "#6A4A30" },

  ribbonRed: ["#B4492E", "#8E3520"] as [string, string],
  ribbonBlue: ["#34659C", "#274E7B"] as [string, string],
  ribbonGreen: ["#47863F", "#356A30"] as [string, string],
  ribbonGold: ["#C8922B", "#9E6E1A"] as [string, string],

  button: ["#F9A23B", "#E9781C"] as [string, string],
  buttonBorder: "#A9510F",
  woodButton: ["#5E3D24", "#44291A"] as [string, string],
  woodButtonBorder: "#2A180D",
};

export const TABLE_COLORS: Partial<ColorScheme> = {
  background: "#1A120C",
  surface: "#1A120C",
  card: "#4A301D",
  well: "#33231A",
  chip: "#33231A",
  border: "#27170C",
  divider: "#63442C",

  text: TABLE.cream,
  textMuted: TABLE.creamMuted,
  textSubtle: "#B8A383",
  icon: TABLE.cream,
  iconMuted: "#B8A383",

  primary: "#F9A23B",
  primaryPressed: "#E9781C",
  primaryContrast: "#FFFFFF",
  primarySoft: "#3F2A18",
  primarySoftBorder: "#8A5A26",
  accent: "#F7C948",
  accentPressed: "#E9A92B",
  onAccent: TABLE.ink,

  success: "#6CCB5F",
  successSoft: "#243A1F",
  successStrong: "#8FE082",
  danger: "#E5533C",
  warning: "#F7C948",
  warningSoft: "#4A3A14",
  warningStrong: "#F7C948",
  info: "#7FB4EE",
  infoSoft: "#1E3554",

  toggleOff: "#6A4A30",
  tabBarBackground: "#141B2B",
  overlay: "rgba(8,5,3,0.72)",
};

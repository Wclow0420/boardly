// Semantic color schemes. Components consume these names — never raw
// palette values — so every screen automatically supports both modes.

import { palette } from "./tokens";

export interface ColorScheme {
  // Surfaces
  background: string;
  surface: string;
  card: string;
  well: string; // sunken/neutral fill (icon wells, placeholders)
  chip: string; // unselected chip / pill background
  border: string;
  divider: string;

  // Content
  text: string;
  textMuted: string;
  textSubtle: string;
  icon: string;
  iconMuted: string;

  // Brand
  primary: string;
  primaryPressed: string;
  primaryContrast: string;
  primarySoft: string; // tinted background behind primary content
  primarySoftBorder: string;
  accent: string; // playful yellow
  accentPressed: string;
  onAccent: string;

  // Feedback
  success: string;
  successSoft: string;
  successStrong: string;
  danger: string;
  warning: string;
  warningSoft: string;
  warningStrong: string;
  info: string;
  infoSoft: string;

  // Misc
  toggleOff: string;
  tabBarBackground: string;
  overlay: string;
}

export const lightColors: ColorScheme = {
  background: palette.cream,
  surface: palette.creamSurface,
  card: palette.creamCard,
  well: palette.wellLight,
  chip: palette.chipLight,
  border: palette.borderLight,
  divider: palette.dividerLight,

  text: palette.ink,
  textMuted: palette.grayMuted,
  textSubtle: palette.graySubtle,
  icon: palette.ink,
  iconMuted: palette.grayIcon,

  primary: palette.orange,
  primaryPressed: palette.orangeDeep,
  primaryContrast: palette.white,
  primarySoft: "#FFF6EA",
  primarySoftBorder: "#FFC98F",
  accent: palette.yellow,
  accentPressed: palette.yellowDeep,
  onAccent: palette.ink,

  success: palette.green,
  successSoft: "#E7F6EC",
  successStrong: "#37955A",
  danger: palette.red,
  warning: palette.yellow,
  warningSoft: "#FFF3DC",
  warningStrong: "#C58A18",
  info: palette.purple,
  infoSoft: "#EDE4FF",

  toggleOff: "#E4E1DA",
  tabBarBackground: palette.creamSurface,
  overlay: "rgba(24,32,43,0.45)",
};

export const darkColors: ColorScheme = {
  background: palette.darkBg,
  surface: palette.darkSurface,
  card: palette.darkCard,
  well: palette.darkChip,
  chip: palette.darkChip,
  border: palette.darkBorder,
  divider: palette.darkDivider,

  text: palette.darkText,
  textMuted: palette.darkMuted,
  textSubtle: palette.darkSubtle,
  icon: palette.darkText,
  iconMuted: palette.darkSubtle,

  primary: palette.orange,
  primaryPressed: palette.orangeDeep,
  primaryContrast: palette.white,
  primarySoft: "#33261A",
  primarySoftBorder: "#5C4128",
  accent: palette.yellow,
  accentPressed: palette.yellowDeep,
  onAccent: palette.ink,

  success: palette.green,
  successSoft: "#1D3527",
  successStrong: "#5FC983",
  danger: palette.red,
  warning: palette.yellow,
  warningSoft: "#3A3021",
  warningStrong: "#E3B45C",
  info: "#9B82E3",
  infoSoft: "#2C2545",

  toggleOff: "#39424F",
  tabBarBackground: palette.darkSurface,
  overlay: "rgba(0,0,0,0.55)",
};

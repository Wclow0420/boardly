// Design tokens — the raw values of the Boardly design language.
// Screens/components must never hardcode these; they consume them
// through the semantic `Theme` (see colors.ts) via useTheme().

export const palette = {
  // Brand (from the design's Color Palette sheet)
  yellow: "#FFC83D",
  yellowLight: "#FFD75C",
  yellowDeep: "#FFB627",
  orange: "#FF8A3D",
  orangeDeep: "#F25C3A",
  orangeVivid: "#FF7A24",
  ink: "#18202B",
  cream: "#FBF8F3",
  creamSurface: "#FFFDF9",
  creamCard: "#FFFFFF",

  // Feedback
  green: "#46B96B",
  red: "#E85D5D",
  purple: "#7C5CD6",

  // Neutrals (light)
  grayText: "#5C6474",
  grayMuted: "#7B8494",
  graySubtle: "#8A93A2",
  grayIcon: "#A9B1BE",
  grayDisabled: "#B8BFCA",
  borderLight: "#F1EDE5",
  dividerLight: "#F5F1E9",
  chipLight: "#F5F1E9",
  wellLight: "#F6F3EC",

  // Neutrals (dark)
  darkBg: "#12161D",
  darkSurface: "#181E28",
  darkCard: "#1F2733",
  darkBorder: "#2A3342",
  darkDivider: "#232C39",
  darkChip: "#252E3B",
  darkText: "#F4F1EA",
  darkMuted: "#A7AFBD",
  darkSubtle: "#8B94A3",

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 26,
  phone: 34,
  pill: 999,
} as const;

export const fontFamily = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;

// Type ramp taken from the design's Typography sheet.
export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 44 },
  h1: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  tiny: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  card: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 6,
  },
  primaryButton: {
    shadowColor: palette.orangeVivid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  quickPlay: {
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

import {
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from "react-native";

import { useTheme, type TypographyVariant } from "@/theme";

export interface AppTextProps extends TextProps {
  /** Type ramp variant (see theme/tokens.ts). Defaults to "body". */
  variant?: TypographyVariant;
  /** Semantic color name from the theme. Defaults to "text". */
  color?: "text" | "textMuted" | "textSubtle" | "primary" | "primaryContrast" | "danger" | "success";
  align?: TextStyle["textAlign"];
}

/** Line box for a custom font size: tall enough that CJK glyphs and
 *  accents aren't cut off on phones. */
const LINE_HEIGHT_RATIO = 1.35;

export function AppText({
  variant = "body",
  color = "text",
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  // A caller that sets its own fontSize without a lineHeight would keep
  // the variant's line height — too short for a bigger size, which clips
  // the text on native. Give it a line height that fits.
  const custom = StyleSheet.flatten(style) as TextStyle | undefined;
  const fitted: TextStyle | undefined =
    custom?.fontSize !== undefined && custom.lineHeight === undefined
      ? { lineHeight: Math.ceil(custom.fontSize * LINE_HEIGHT_RATIO) }
      : undefined;

  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[color], textAlign: align },
        style,
        fitted,
      ]}
      {...rest}
    />
  );
}

import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme, type TypographyVariant } from "@/theme";

export interface AppTextProps extends TextProps {
  /** Type ramp variant (see theme/tokens.ts). Defaults to "body". */
  variant?: TypographyVariant;
  /** Semantic color name from the theme. Defaults to "text". */
  color?: "text" | "textMuted" | "textSubtle" | "primary" | "primaryContrast" | "danger" | "success";
  align?: TextStyle["textAlign"];
}

export function AppText({
  variant = "body",
  color = "text",
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[color], textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

import { Children, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextProps,
  type TextStyle,
} from "react-native";

import { Emblem, splitEmblems } from "@/components/icons";
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

/** The text with every emoji that has an engraved emblem drawn as it,
 *  as tall as the letters; untouched when there are none. */
function withEmblems(children: ReactNode, fontSize: number): ReactNode {
  let found = false;
  const size = Math.round(fontSize * 1.25);
  const drawn = Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const pieces = splitEmblems(child);
    if (pieces.length === 1) return child;
    found = true;
    // an emoji on its own is a picture: centred in the line, not set on
    // the baseline like a letter
    if (pieces.length === 3 && !pieces[0].trim() && !pieces[2].trim()) {
      const alone = Math.round(fontSize * 1.1);
      return (
        <View style={{ width: alone, height: alone }}>
          <Emblem emoji={pieces[1]} size={alone} />
        </View>
      );
    }
    return pieces.map((piece, index) =>
      index % 2 === 1 ? (
        <View
          key={index}
          style={{ width: size, height: size, transform: [{ translateY: size * 0.2 }] }}
        >
          <Emblem emoji={piece} size={size} />
        </View>
      ) : (
        piece
      ),
    );
  });
  return found ? drawn : children;
}

export function AppText({
  variant = "body",
  color = "text",
  align,
  style,
  children,
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
    >
      {withEmblems(
        children,
        custom?.fontSize ?? theme.typography[variant].fontSize ?? 14,
      )}
    </Text>
  );
}

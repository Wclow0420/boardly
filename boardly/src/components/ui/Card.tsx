import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

import { Texture } from "./Texture";
import { tapHaptic } from "@/utils/haptics";

const CARD_BORDER = 2;

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Raised panel — the standard container for a block of content. */
export function Card({ children, onPress, padding, radius, style }: CardProps) {
  const theme = useTheme();

  // A tray on the table: solid fill, dark rim, thicker bottom edge
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderWidth: CARD_BORDER,
    borderBottomWidth: 4,
    borderColor: theme.colors.border,
    borderRadius: radius ?? theme.radius.lg,
    padding: padding ?? theme.spacing.md,
    ...theme.shadows.card,
  };

  const texture = (
    <Texture radius={(radius ?? theme.radius.lg) - CARD_BORDER} />
  );

  if (!onPress) {
    return (
      <View style={[cardStyle, style]}>
        {texture}
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }, style]}
    >
      {texture}
      {children}
    </Pressable>
  );
}

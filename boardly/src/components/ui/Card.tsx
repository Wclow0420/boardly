import type { ReactNode } from "react";
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** White surface card with the design's soft border + shadow. */
export function Card({ children, onPress, padding, radius, style }: CardProps) {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius ?? theme.radius.lg,
    padding: padding ?? theme.spacing.md,
    ...theme.shadows.card,
  };

  if (!onPress) {
    return <View style={[cardStyle, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }, style]}
    >
      {children}
    </Pressable>
  );
}

import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export interface IconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  /** Circular filled background (default transparent). */
  filled?: boolean;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  children,
  onPress,
  filled = false,
  size = 36,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={
        onPress
          ? () => {
              tapHaptic();
              onPress();
            }
          : undefined
      }
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          // Opacity-only press feedback: a background color here looks
          // like a dark blob on brand-colored surfaces in dark mode.
          backgroundColor: filled ? colors.well : "transparent",
          opacity: pressed ? 0.5 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

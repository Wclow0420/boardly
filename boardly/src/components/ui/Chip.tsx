import { Pressable } from "react-native";

import { shade, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter/tab token — gold when selected, wood otherwise. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={
        onPress
          ? () => {
              tapHaptic();
              onPress();
            }
          : undefined
      }
      style={({ pressed }) => ({
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        borderColor: selected ? shade(colors.accentPressed, -0.35) : colors.border,
        backgroundColor: selected
          ? pressed
            ? colors.accentPressed
            : colors.accent
          : pressed
            ? colors.well
            : colors.card,
      })}
    >
      <AppText
        variant="label"
        style={{
          fontSize: 11.5,
          color: selected ? colors.onAccent : colors.textMuted,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

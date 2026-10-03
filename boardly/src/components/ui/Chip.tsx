import { Pressable } from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter/tab pill — yellow when selected, neutral otherwise. */
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
        backgroundColor: selected
          ? pressed
            ? colors.accentPressed
            : colors.accent
          : pressed
            ? colors.well
            : colors.chip,
      })}
    >
      <AppText
        variant="label"
        style={{
          fontSize: 11.5,
          color: selected ? colors.onAccent : colors.textSubtle,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

import { Pressable } from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";
import { BezelOverlay } from "./Trim";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter/tab token: gold enamel in a gold bezel when selected, wood in
 *  silver otherwise. */
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
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: radius.pill,
        transform: [{ translateY: pressed ? 1 : 0 }],
        backgroundColor: selected
          ? pressed
            ? colors.accentPressed
            : colors.accent
          : pressed
            ? colors.well
            : colors.card,
      })}
    >
      <BezelOverlay r={radius.pill} t={2.4} metal={selected ? "gold" : "silver"} />
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

import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

/** "Your Tables            See All" style row. */
export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing.md }]}>
      <AppText variant="label">{title}</AppText>
      {actionLabel ? (
        <Pressable
          onPress={() => {
            tapHaptic();
            onActionPress?.();
          }}
          hitSlop={8}
        >
          <AppText variant="tiny" color="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});

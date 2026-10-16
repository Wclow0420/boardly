// The vote on a team: two enamel buttons side by side on the plinth, a
// green Approve and a red Reject, each in a gold bezel. One tap casts it.

import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { BezelOverlay, LightSweep } from "@/components/ui";
import { fontFamily } from "@/theme";
import { moveHaptic } from "@/utils/haptics";
import { GameText as AppText } from "./GameText";

const LOOK = {
  yes: { fill: ["#7AE8A0", "#22A058", "#0E5228"], text: "#06240F", mark: "✓" },
  no: { fill: ["#FF7A86", "#C2203A", "#5A0612"], text: "#FFF2F0", mark: "✕" },
} as const;

export function VoteButtons({
  approve,
  reject,
  disabled,
  onVote,
}: {
  approve: string;
  reject: string;
  disabled: boolean;
  onVote: (approve: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      {(["yes", "no"] as const).map((kind) => {
        const look = LOOK[kind];
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={kind === "yes" ? approve : reject}
            disabled={disabled}
            onPress={() => {
              moveHaptic();
              onVote(kind === "yes");
            }}
            style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.off]}
          >
            <LinearGradient colors={look.fill as unknown as [string, string, string]} style={StyleSheet.absoluteFill} />
            <LightSweep r={16} phase={kind === "yes" ? 0 : 0.5} />
            <BezelOverlay r={16} t={4} />
            <AppText style={[styles.label, { color: look.text }]} numberOfLines={1}>
              {`${look.mark}  ${kind === "yes" ? approve : reject}`}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignSelf: "stretch" },
  button: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.96 }] },
  off: { opacity: 0.5 },
  label: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 23, letterSpacing: 0.5 },
});

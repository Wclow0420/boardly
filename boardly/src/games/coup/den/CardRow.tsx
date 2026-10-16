// My cards laid out large on the stage, to choose among: which one to
// turn over (lifted into a red light), which to keep from a swap (lifted
// in gold), or just dealt to me (each turning over in turn).

import { memo, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText, useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic, tickHaptic } from "@/utils/haptics";
import { CARD_RATIO, FlipCard, RoleCard } from "../cards";
import type { Role } from "../logic";

export type Mark = "none" | "doom" | "keep";

export interface RowCard {
  key: string;
  role: Role;
  lost?: boolean;
  mark?: Mark;
  /** A word on a tag over it ("Kept", "New"). */
  tag?: string;
}

const LIFT: Record<Mark, number> = { none: 0, doom: -16, keep: -16 };

function Slot({
  card,
  width,
  delay,
  dealt,
  onPress,
}: {
  card: RowCard;
  width: number;
  delay: number;
  dealt: boolean;
  onPress?: () => void;
}) {
  const mark = card.mark ?? "none";
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.set(withSpring(LIFT[mark], { damping: 14, stiffness: 180 }));
  }, [mark, lift]);
  const flip = useSharedValue(dealt ? 0 : 1);
  useEffect(() => {
    if (!dealt) return;
    flip.set(withDelay(delay + 500, withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) })));
    const tick = setTimeout(tickHaptic, delay + 760);
    return () => clearTimeout(tick);
  }, [dealt, delay, flip]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const glow = mark === "doom" ? styles.doom : mark === "keep" ? styles.keep : null;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
      <Animated.View style={style}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mark !== "none", disabled: !onPress }}
          disabled={!onPress}
          onPress={() => {
            tapHaptic();
            onPress?.();
          }}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {glow ? <View style={[styles.glow, glow, { borderRadius: width * 0.09 }]} /> : null}
          {dealt ? <FlipCard role={card.role} width={width} flip={flip} /> : <RoleCard role={card.role} width={width} lost={card.lost} />}
          {card.tag ? (
            <View style={[styles.tag, mark === "doom" ? styles.tagDoom : styles.tagKeep]}>
              <AppText style={styles.tagText} numberOfLines={1}>
                {card.tag}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export const CardRow = memo(function CardRow({
  cards,
  onPress,
  dealt = false,
  maxWidth = 150,
}: {
  cards: RowCard[];
  onPress?: (key: string) => void;
  /** Dealt to me just now: each turns over in turn. */
  dealt?: boolean;
  maxWidth?: number;
}) {
  const [{ w, h }, onLayout] = useBox();
  const n = cards.length;
  // two in a row; four in two rows of two
  const perRow = n > 2 ? 2 : n;
  const rows = Math.ceil(n / perRow);
  const width =
    w > 0 ? Math.min(maxWidth, (w - 24 - (perRow - 1) * 16) / perRow, (h - 30 - (rows - 1) * 22) / rows / CARD_RATIO) : 0;
  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: rows }, (_, r) => (
            <View key={r} style={styles.row}>
              {cards.slice(r * perRow, r * perRow + perRow).map((card, i) => (
                <Slot
                  key={card.key}
                  card={card}
                  width={width}
                  delay={(r * perRow + i) * 260}
                  dealt={dealt}
                  onPress={onPress && !card.lost ? () => onPress(card.key) : undefined}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center" },
  grid: { gap: 22, alignItems: "center" },
  row: { flexDirection: "row", gap: 16, justifyContent: "center" },
  pressed: { opacity: 0.85 },
  glow: { position: "absolute", left: -5, top: -5, right: -5, bottom: -5, borderWidth: 3, shadowOpacity: 0.9, shadowRadius: 12 },
  doom: { borderColor: "#FF4A5A", shadowColor: "#FF2E44", backgroundColor: "rgba(255,46,68,0.18)" },
  keep: { borderColor: "#FFD27A", shadowColor: "#FFC24A", backgroundColor: "rgba(255,210,122,0.16)" },
  tag: { position: "absolute", top: -11, alignSelf: "center", paddingHorizontal: 9, borderRadius: 8, borderWidth: 1.5 },
  tagDoom: { backgroundColor: "#5A0812", borderColor: "#FF4A5A" },
  tagKeep: { backgroundColor: "#3A2408", borderColor: "#FFD27A" },
  tagText: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 16, color: "#FFF2D8", letterSpacing: 0.6 },
});

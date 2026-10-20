// The end of a night of Liar's Dice, on the stage. The gold tankard
// comes down on the bar in a ring of light, the verdict and how it was
// won under it, everyone on the boards (the winner crowned, those drunk
// under the table in the dark), the night's tally — how many cups each
// drank, fewest first — and then what follows a game (coins, badges),
// handed in by the game screen.

import { Canvas, Group, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useContext, useEffect, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { AppText, BezelOverlay } from "@/components/ui";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { StageInsets, useStageSize } from "@/features/game/stage/GameStage";
import { Burst } from "@/features/game/stage/light";
import { StageLineup, type Light, type Standing } from "@/features/game/stage/StageLineup";
import { fontFamily } from "@/theme";
import { heavyHaptic } from "@/utils/haptics";
import { steinArt, tankardArt } from "./art";

const SIZE = 150;
const TOP_H = 200;
const STEIN = 26;
const LINE = 36;

export function Ending({
  title,
  reason,
  winners,
  people,
  cups,
  maxCups,
  mySeat,
  afterGame,
  paused,
}: {
  title: string;
  reason: string;
  winners: number[];
  people: Standing[];
  cups: number[];
  maxCups: number | null;
  mySeat: number;
  afterGame?: ReactNode;
  paused: boolean;
}) {
  const insets = useContext(StageInsets);
  const { width } = useStageSize();
  const still = useReducedMotion();
  const image = bakedSvg("ld-tankard", SIZE, SIZE, () => tankardArt(SIZE));
  const cx = width / 2;
  const cy = TOP_H / 2;

  const fall = useSharedValue(still ? 1 : 0);
  const burst = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    const drop = 420;
    fall.set(
      withSequence(
        withDelay(250, withTiming(1, { duration: drop, easing: Easing.in(Easing.quad) })),
        withTiming(1.06, { duration: 110 }),
        withTiming(1, { duration: 160 }),
      ),
    );
    burst.set(withDelay(250 + drop, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) })));
    const thud = setTimeout(heavyHaptic, 250 + drop);
    return () => clearTimeout(thud);
  }, [still, fall, burst]);
  const transform = useDerivedValue(() => {
    const k = fall.value;
    const scale = k <= 1 ? 2.6 - 1.6 * k : k;
    return [{ translateX: cx }, { translateY: cy }, { scale }, { translateX: -SIZE / 2 }, { translateY: -SIZE / 2 }];
  });
  const opacity = useDerivedValue(() => Math.min(1, fall.value * 2.5));

  const out = (seat: number) => maxCups !== null && cups[seat] >= maxCups;
  const lights: Record<number, Light> = Object.fromEntries(
    people.map((p) => [p.seat, winners.includes(p.seat) ? "lit" : out(p.seat) ? "dim" : "soft"]),
  );
  const tally = [...people].sort((a, b) => cups[a.seat] - cups[b.seat]);
  const full = maxCups ?? Math.max(5, ...cups);
  const lineupH = people.length > 5 ? 290 : 236;

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 10 }}
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: TOP_H }} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Burst x={cx} y={cy} go={burst} color="#FFD27A" size={width * 0.5} />
          <Group transform={transform}>
            {image ? <SkImage image={image} x={0} y={0} width={SIZE} height={SIZE} opacity={opacity} /> : null}
          </Group>
        </Canvas>
      </View>

      <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.verdict}>
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        <AppText style={styles.reason}>{reason}</AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1100).duration(500)} style={{ height: lineupH, marginTop: 6 }}>
        <StageLineup people={people} lights={lights} crown={winners.length === 1 ? winners[0] : null} paused={paused} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1400).duration(500)} style={styles.tally}>
        <LinearGradient colors={["#2A1A10", "#1A100A"]} style={StyleSheet.absoluteFill} />
        <BezelOverlay r={12} t={3} />
        <View style={[styles.steins, { height: tally.length * LINE }]} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            {tally.map((p, i) => {
              const level = Math.min(full, cups[p.seat]);
              const img = bakedSvg(`ld-stein|${level}/${full}|${out(p.seat)}`, STEIN, STEIN * 1.3, () =>
                steinArt(level / full, out(p.seat), STEIN),
              );
              return img ? <SkImage key={p.seat} image={img} x={0} y={i * LINE + 1} width={STEIN} height={STEIN * 1.3} /> : null;
            })}
          </Canvas>
        </View>
        {tally.map((p) => (
          <View key={p.seat} style={styles.line}>
            <PlayerName
              name={p.name}
              align="left"
              style={[styles.who, winners.includes(p.seat) && styles.winner, p.seat === mySeat && styles.me]}
            />
            <AppText style={[styles.count, out(p.seat) && styles.drunk]}>
              {maxCups !== null ? `🍺 ${cups[p.seat]}/${maxCups}` : `🍺 ${cups[p.seat]}`}
            </AppText>
          </View>
        ))}
      </Animated.View>

      {afterGame ? (
        <Animated.View entering={FadeIn.delay(1700).duration(500)} style={styles.after}>
          {afterGame}
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  verdict: { alignItems: "center", paddingHorizontal: 24, gap: 4 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    color: "#FFD58A",
    ...shadow,
  },
  reason: { fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 19, color: "#F1E6D2", textAlign: "center", ...shadow },
  tally: { marginHorizontal: 24, marginTop: 14, borderRadius: 12, overflow: "hidden", paddingVertical: 8, paddingHorizontal: 14 },
  steins: { position: "absolute", left: 14, top: 8, width: STEIN },
  line: { flexDirection: "row", alignItems: "center", gap: 10, height: LINE, paddingLeft: STEIN + 10 },
  who: { flex: 1, fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 19, color: "#F1E6D2", ...shadow },
  winner: { color: "#FFD58A", fontFamily: fontFamily.bold },
  me: { textDecorationLine: "underline" },
  count: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 18, color: "#E8C88A", ...shadow },
  drunk: { color: "#FF8A94" },
  after: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
});

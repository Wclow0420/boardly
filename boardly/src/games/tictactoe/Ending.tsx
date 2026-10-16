// The end of a game of noughts and crosses, on the stage. The medal
// comes down hard in a ring of light — the winner's mark on its enamel,
// or both marks per pale for a draw — the verdict and how it was won
// under it, the two players on the boards (the winner crowned, the loser
// in shadow), the last board with its line, and then what follows a
// game (coins, badges), handed in by the game screen.

import { Canvas, Group, Image as SkImage } from "@shopify/react-native-skia";
import { useContext, useEffect, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
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
import { AppText } from "@/components/ui";
import { StageInsets } from "@/features/game/stage/GameStage";
import { Burst } from "@/features/game/stage/light";
import { StageLineup, type Light, type Standing } from "@/features/game/stage/StageLineup";
import { fontFamily } from "@/theme";
import { heavyHaptic } from "@/utils/haptics";
import { medalArt, type Mark } from "./art";
import { BoardView } from "./BoardView";
import type { Cell } from "./logic";

const MEDAL = 150;
const MEDAL_H = 210;

export function Ending({
  board,
  line,
  winner,
  title,
  reason,
  mine,
  people,
  afterGame,
  paused,
}: {
  board: Cell[];
  line: number[] | null;
  /** The winning seat, or null for a draw or a game left early. */
  winner: number | null;
  title: string;
  reason: string;
  /** Whether I won (true), lost (false), or neither. */
  mine: boolean | null;
  people: Standing[];
  afterGame?: ReactNode;
  paused: boolean;
}) {
  const insets = useContext(StageInsets);
  const { width } = useWindowDimensions();
  const still = useReducedMotion();
  const kind: Mark | "draw" = winner === 0 ? "X" : winner === 1 ? "O" : "draw";
  const image = bakedSvg(`ttt-medal|${kind}`, MEDAL, MEDAL, () => medalArt(kind, MEDAL));
  const cx = width / 2;
  const cy = MEDAL_H / 2;

  // the slam: from high above, down hard, a little bounce
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
    return [{ translateX: cx }, { translateY: cy }, { scale }, { translateX: -MEDAL / 2 }, { translateY: -MEDAL / 2 }];
  });
  const opacity = useDerivedValue(() => Math.min(1, fall.value * 2.5));

  const lights: Record<number, Light> = Object.fromEntries(
    people.map((p) => [p.seat, winner === null ? "lit" : p.seat === winner ? "lit" : "dim"]),
  );
  const boardSize = Math.min(220, width * 0.56);

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 10 }}
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: MEDAL_H }} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Burst x={cx} y={cy} go={burst} color={kind === "O" ? "#FF8A94" : kind === "X" ? "#9CC8FF" : "#FFD27A"} size={width * 0.5} />
          <Group transform={transform}>
            {image ? <SkImage image={image} x={0} y={0} width={MEDAL} height={MEDAL} opacity={opacity} /> : null}
          </Group>
        </Canvas>
      </View>

      <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.verdict}>
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        <AppText style={styles.reason}>{reason}</AppText>
        {mine !== null ? (
          <View style={[styles.rule, { backgroundColor: mine ? "#8CFFB0" : "#FFB0B8" }]} />
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1100).duration(500)} style={styles.lineup}>
        <StageLineup people={people} lights={lights} crown={winner} paused={paused} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1400).duration(500)} style={styles.board}>
        <BoardView board={board} size={boardSize} canTap={false} line={line} paused={paused} lineDelay={0} />
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
  rule: { width: 44, height: 3, borderRadius: 2, marginTop: 6, opacity: 0.8 },
  lineup: { height: 236, marginTop: 6 },
  board: { alignItems: "center", marginTop: 14 },
  after: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
});

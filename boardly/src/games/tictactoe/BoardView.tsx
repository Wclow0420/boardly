// The inlaid board on the stage: one canvas drawing the baked board, the
// marks on it and the winning line. A new mark drops onto its square —
// down from above, a little bounce, a ring of light and a knock in the
// hand as it lands; marks already there when the board opens just sit.
// Three in a row: warm light pools under them and a line of gold is
// drawn through, breathing softly. Invisible buttons over the squares.

import { Canvas, Circle, Group, Image as SkImage, Path, RadialGradient, vec } from "@shopify/react-native-skia";
import { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { Burst } from "@/features/game/stage/light";
import { useOnScreen } from "@/hooks/useOnScreen";
import { heavyHaptic, moveHaptic, tapHaptic } from "@/utils/haptics";
import { boardArt, cellAt, markArt, type Mark } from "./art";
import type { Cell } from "./logic";

const DROP_MS = 300;

/** One mark on its square: dropping in if it's new. */
const Piece = memo(function Piece({
  kind,
  i,
  size,
  drop,
}: {
  kind: Mark;
  i: number;
  size: number;
  drop: boolean;
}) {
  const still = useReducedMotion();
  const { x, y, cell } = cellAt(size, i);
  const s = cell * 0.82;
  const image = bakedSvg(`ttt-mark|${kind}`, s, s, () => markArt(kind, s));
  const fall = useSharedValue(drop && !still ? 0 : 1);
  const ring = useSharedValue(0);
  useEffect(() => {
    if (!drop) return;
    const land = setTimeout(moveHaptic, still ? 0 : DROP_MS);
    if (still) return () => clearTimeout(land);
    fall.set(
      withSequence(
        withTiming(1, { duration: DROP_MS, easing: Easing.in(Easing.quad) }),
        withTiming(1.07, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 140 }),
      ),
    );
    ring.set(withDelay(DROP_MS, withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })));
    return () => clearTimeout(land);
  }, [drop, still, fall, ring]);
  const transform = useDerivedValue(() => {
    const k = fall.value;
    const scale = k <= 1 ? 1.9 - 0.9 * k : 2 - k;
    return [{ translateX: x }, { translateY: y - (1 - Math.min(1, k)) * cell * 0.3 }, { scale }, { translateX: -s / 2 }, { translateY: -s / 2 }];
  });
  const opacity = useDerivedValue(() => Math.min(1, fall.value * 2.2));
  if (!image) return null;
  return (
    <>
      {drop ? <Burst x={x} y={y} go={ring} color="#FFE7A0" size={cell * 0.55} /> : null}
      <Group transform={transform}>
        <SkImage image={image} x={0} y={0} width={s} height={s} opacity={opacity} />
      </Group>
    </>
  );
});

/** The winning line: light pooled under the three, and a gold line
 *  drawn through them. */
function WinLine({ line, size, clock, delay }: { line: number[]; size: number; clock: SharedValue<number>; delay: number }) {
  const still = useReducedMotion();
  const a = cellAt(size, line[0]);
  const b = cellAt(size, line[2]);
  const cell = a.cell;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const over = cell * 0.4;
  const d = `M${a.x - ux * over} ${a.y - uy * over}L${b.x + ux * over} ${b.y + uy * over}`;
  const draw = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    draw.set(withDelay(delay, withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) })));
    const thud = setTimeout(heavyHaptic, delay + 260);
    return () => clearTimeout(thud);
  }, [still, delay, draw]);
  const pool = useDerivedValue(() => Math.min(1, draw.value * 1.6) * (0.7 + 0.18 * Math.sin(clock.value * 2.1)));
  const glow = useDerivedValue(() => (draw.value > 0 ? 0.55 + 0.2 * Math.sin(clock.value * 2.1) : 0));
  return (
    <>
      {line.map((i) => {
        const c = cellAt(size, i);
        return (
          <Circle key={i} cx={c.x} cy={c.y} r={cell * 0.55} opacity={pool} blendMode="screen">
            <RadialGradient c={vec(c.x, c.y)} r={cell * 0.55} colors={["#FFD27ACC", "#FFB23A55", "#FFB23A00"]} />
          </Circle>
        );
      })}
      <Path path={d} style="stroke" strokeWidth={cell * 0.24} strokeCap="round" color="#FFC864" end={draw} opacity={glow} blendMode="screen" />
      <Path path={d} style="stroke" strokeWidth={cell * 0.075} strokeCap="round" color="#FFF8E0" end={draw} />
    </>
  );
}

export function BoardView({
  board,
  size,
  canTap,
  onTap,
  line,
  paused = false,
  lineDelay = 450,
}: {
  board: Cell[];
  size: number;
  /** Empty squares can be tapped. */
  canTap: boolean;
  onTap?: (cell: number) => void;
  /** The winning three, if any. */
  line: number[] | null;
  paused?: boolean;
  /** How long the line waits before it's drawn (for the last mark to
   *  land). */
  lineDelay?: number;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen || !line);
  const image = bakedSvg("ttt-board", size, size, () => boardArt(size));
  // squares already filled when the board opened don't drop again
  const [there] = useState(() => board.map((c) => c !== null));
  return (
    <View style={{ width: size, height: size }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          {image ? <SkImage image={image} x={0} y={0} width={size} height={size} /> : null}
          {board.map((c, i) => (c ? <Piece key={i} kind={c} i={i} size={size} drop={!there[i]} /> : null))}
          {line ? <WinLine line={line} size={size} clock={clock} delay={line.every((i) => there[i]) ? 0 : lineDelay} /> : null}
        </Canvas>
      </View>
      {board.map((c, i) => {
        const { x, y, cell } = cellAt(size, i);
        const open = canTap && c === null;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`cell-${i}`}
            accessibilityState={{ disabled: !open }}
            disabled={!open}
            onPress={() => {
              tapHaptic();
              onTap?.(i);
            }}
            style={[styles.cell, { left: x - cell / 2, top: y - cell / 2, width: cell, height: cell }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { position: "absolute" },
});

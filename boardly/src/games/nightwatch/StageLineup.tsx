// Everyone on a bare stage: each player walks out as their own mascot,
// one after another, to a place in a row (two rows at a big table), each
// under a spotlight from above. The same stage serves three moments:
//
//   the team — the leader (a crown over their head) taps players: each
//              one picked steps into a full spotlight, and everyone at
//              the table sees it as it happens;
//   the vote — the team stands lit; a gold coin appears over each player
//              who has voted (never which way), and at the reveal every
//              coin turns over: green ✓ or red ✕;
//   the last chance — the assassin taps the one they think is the
//              Prophet (that light turns crimson), holds, and the blow
//              falls: a slash of light, a burst, the mascot topples.

import {
  Canvas,
  Group,
  Image as SkImage,
  LinearGradient as SkLinear,
  Oval,
  Path,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { BezelOverlay, useBox } from "@/components/ui";
import { MascotFigure } from "@/features/mascot/MascotStage";
import type { Look } from "@/features/mascot/dress";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { heavyHaptic } from "@/utils/haptics";
import { GameText as AppText } from "./GameText";
import { Burst, Motes } from "./lantern/Lantern";

export interface Standing {
  seat: number;
  name: string;
  look: Look;
}

/** How a spotlight shines on someone: full, low (waiting to be picked),
 *  nearly out (not in it), or crimson (named). */
export type Light = "lit" | "soft" | "dim" | "red";
/** Over someone's head: a coin face down (they've voted), or turned up. */
export type Mark = "voted" | "yes" | "no";

/** The boards of the stage, w × h: planks running back, a gilt edge
 *  along the front. */
function floorArt(w: number, h: number) {
  const n = 14;
  const planks = Array.from({ length: n }, (_, i) => {
    const top = (i / n) * w * 0.7 + w * 0.15;
    const top2 = ((i + 1) / n) * w * 0.7 + w * 0.15;
    const bot = (i / n) * (w + 80) - 40;
    const bot2 = ((i + 1) / n) * (w + 80) - 40;
    return `<path d="M${top} 0L${top2} 0L${bot2} ${h - 8}L${bot} ${h - 8}Z" fill="${i % 2 ? "#4A2C16" : "#563420"}" stroke="#1E1006" stroke-width="1"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.8"/><stop offset="0.6" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
<linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#9A6B1E"/><stop offset="1" stop-color="#F0CC72"/></linearGradient>
</defs>
${planks}
<rect width="${w}" height="${h - 8}" fill="url(#fd)"/>
<rect x="0" y="${h - 9}" width="${w}" height="9" fill="url(#fg)" stroke="#3A2408" stroke-width="1"/>
<path d="M8 ${h - 6.5}H${w * 0.45}" stroke="#fff" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>
</svg>`;
}

export function StageLineup({
  people,
  lights,
  selectable = [],
  onPick,
  crown = null,
  marks = {},
  hold,
  aim = null,
  struck = null,
  paused,
}: {
  people: Standing[];
  /** Each seat's light (lit when left out). */
  lights: Record<number, Light>;
  /** Seats that can be tapped. */
  selectable?: number[];
  onPick?: (seat: number) => void;
  /** The leader. */
  crown?: number | null;
  marks?: Record<number, Mark>;
  /** While held, red light streams to `aim`. */
  hold?: SharedValue<number>;
  aim?: number | null;
  /** The one named: the blow falls on them. */
  struck?: number | null;
  paused: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {w > 0 ? (
        <Stage
          people={people}
          lights={lights}
          selectable={selectable}
          onPick={onPick}
          crown={crown}
          marks={marks}
          hold={hold}
          aim={aim}
          struck={struck}
          clock={clock}
          paused={paused}
          w={w}
          h={h}
        />
      ) : null}
    </View>
  );
}

function Stage({
  people,
  lights,
  selectable,
  onPick,
  crown,
  marks,
  hold,
  aim,
  struck,
  clock,
  paused,
  w,
  h,
}: {
  people: Standing[];
  lights: Record<number, Light>;
  selectable: number[];
  onPick?: (seat: number) => void;
  crown: number | null;
  marks: Record<number, Mark>;
  hold?: SharedValue<number>;
  aim: number | null;
  struck: number | null;
  clock: SharedValue<number>;
  paused: boolean;
  w: number;
  h: number;
}) {
  const floorH = Math.min(people.length > 5 ? 200 : 170, h * 0.42);
  const floorTop = h - floorH;
  const floor = bakedSvg("manor-stage-floor", w, floorH, () => floorArt(w, floorH));
  // one row, or two when the table is big (the back row smaller, higher)
  const rows =
    people.length > 5
      ? [people.slice(0, Math.ceil(people.length / 2)), people.slice(Math.ceil(people.length / 2))]
      : [people];
  // a big table stands in two rows: the back one further up the boards
  // and smaller, each of them in a gap of the row in front
  const places = rows.flatMap((row, r) => {
    const back = rows.length > 1 && r === 0;
    const across = w * 0.92;
    const size = back ? Math.min(54, across / (row.length + 1.2)) : Math.min(84, across / (row.length + 0.4));
    const y = back ? h - 136 : h - 58;
    return row.map((person, i) => ({
      ...person,
      x: w * 0.04 + (back ? ((i + 1) * across) / (row.length + 1) : ((i + 0.5) * across) / row.length),
      y,
      size,
      order: r * 10 + i,
    }));
  });
  const target = places.find((p) => p.seat === (struck ?? aim));
  const flow = useDerivedValue(
    () => (hold && aim !== null && struck === null ? Math.min(1, hold.value * 1.5) : 0),
    [aim, struck],
  );
  const burst = useSharedValue(0);
  useEffect(() => {
    if (struck === null) return;
    burst.set(0);
    burst.set(withDelay(180, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })));
    const thud = setTimeout(heavyHaptic, 180);
    return () => clearTimeout(thud);
  }, [struck, burst]);
  // coins turned up together are turned one after another
  const revealOrder = places.filter((p) => marks[p.seat] === "yes" || marks[p.seat] === "no").map((p) => p.seat);

  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {floor ? <SkImage image={floor} x={0} y={floorTop} width={w} height={floorH} /> : null}
        {places.map((p) => (
          <Spotlight
            key={p.seat}
            x={p.x}
            y={p.y}
            size={p.size}
            clock={clock}
            seed={p.seat}
            mode={lights[p.seat] ?? "lit"}
          />
        ))}
        {target ? (
          <Motes
            clock={clock}
            flow={flow}
            from={{ x0: w * 0.1, x1: w * 0.9, y: h + 40 }}
            to={{ x: target.x, y: target.y - target.size * 0.7 }}
            color="#FF2E44"
            count={30}
          />
        ) : null}
      </Canvas>
      {places.map((p) => (
        <Walker
          key={p.seat}
          person={p}
          from={p.order % 2 ? w + 60 : -60}
          delay={p.order * 160}
          paused={paused}
          light={lights[p.seat] ?? "lit"}
          struck={p.seat === struck}
          selectable={selectable.includes(p.seat)}
          crowned={p.seat === crown}
          mark={marks[p.seat]}
          markDelay={Math.max(0, revealOrder.indexOf(p.seat)) * 220}
          onPick={() => onPick?.(p.seat)}
        />
      ))}
      {target && struck !== null ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <Slash x={target.x} y={target.y - target.size * 0.75} size={target.size * 1.6} go={burst} />
            <Burst x={target.x} y={target.y - target.size * 0.7} go={burst} color="#FF2E44" size={w * 0.35} />
          </Canvas>
        </View>
      ) : null}
    </>
  );
}

const LEVEL: Record<Light, number> = { lit: 1, soft: 0.3, dim: 0.16, red: 1 };

/** A cone of light from above onto a pool on the floor. */
function Spotlight({
  x,
  y,
  size,
  clock,
  seed,
  mode,
}: {
  x: number;
  y: number;
  size: number;
  clock: SharedValue<number>;
  seed: number;
  mode: Light;
}) {
  const level = useSharedValue(LEVEL[mode]);
  const red = useSharedValue(mode === "red" ? 1 : 0);
  useEffect(() => {
    level.set(withTiming(LEVEL[mode], { duration: 350 }));
    red.set(withTiming(mode === "red" ? 1 : 0, { duration: 400 }));
  }, [mode, level, red]);
  // a stage light's faint unsteadiness
  const flicker = useDerivedValue(
    () =>
      level.value *
      (0.88 + 0.08 * Math.sin(clock.value * 5.3 + seed * 1.7) + 0.04 * Math.sin(clock.value * 17 + seed)),
  );
  const warm = useDerivedValue(() => flicker.value * (1 - red.value));
  const crimson = useDerivedValue(() => flicker.value * red.value);
  const top = -20;
  const half = size * 0.34;
  const cone = `M${x - half * 0.35} ${top}L${x + half * 0.35} ${top}L${x + size * 0.62} ${y}L${x - size * 0.62} ${y}Z`;
  return (
    <Group>
      <Path path={cone} opacity={warm} blendMode="screen">
        <SkLinear start={vec(x, top)} end={vec(x, y)} colors={["#FFE7B000", "#FFE7B033", "#FFE7B066"]} />
      </Path>
      <Path path={cone} opacity={crimson} blendMode="screen">
        <SkLinear start={vec(x, top)} end={vec(x, y)} colors={["#FF2E4400", "#FF2E4440", "#FF2E4488"]} />
      </Path>
      <Oval x={x - size * 0.7} y={y - size * 0.16} width={size * 1.4} height={size * 0.32} opacity={warm} blendMode="screen">
        <RadialGradient c={vec(x, y)} r={size * 0.7} colors={["#FFE7B0AA", "#FFE7B000"]} />
      </Oval>
      <Oval x={x - size * 0.7} y={y - size * 0.16} width={size * 1.4} height={size * 0.32} opacity={crimson} blendMode="screen">
        <RadialGradient c={vec(x, y)} r={size * 0.7} colors={["#FF2E44CC", "#FF2E4400"]} />
      </Oval>
    </Group>
  );
}

/** The blow: a bright slash across, drawn on as `go` runs. */
function Slash({ x, y, size, go }: { x: number; y: number; size: number; go: SharedValue<number> }) {
  const end = useDerivedValue(() => Math.min(1, go.value * 3));
  const opacity = useDerivedValue(() => (go.value > 0 && go.value < 1 ? 1 - go.value : 0));
  const d = `M${x - size * 0.5} ${y - size * 0.45}Q${x} ${y - size * 0.05} ${x + size * 0.5} ${y + size * 0.4}`;
  return (
    <Group>
      <Path path={d} style="stroke" strokeWidth={10} strokeCap="round" color="#FF2E44" end={end} opacity={opacity} blendMode="screen" />
      <Path path={d} style="stroke" strokeWidth={3} strokeCap="round" color="#FFFFFF" end={end} opacity={opacity} />
    </Group>
  );
}

const COIN = 28;
const FACE = {
  voted: ["#FFF2B8", "#E2B04A", "#9A6B1E"],
  yes: ["#7AE8A0", "#22A058", "#0E5228"],
  no: ["#FF7A86", "#C2203A", "#5A0612"],
} as const;

/** A coin over someone's head: gold face down once they've voted; when
 *  the vote is shown it turns over, green ✓ or red ✕. */
function Coin({ mark, delay }: { mark: Mark; delay: number }) {
  const turn = useSharedValue(mark === "voted" ? 0 : 0);
  const shown = mark === "voted" ? "voted" : mark;
  useEffect(() => {
    if (mark === "voted") {
      turn.set(0);
      return;
    }
    turn.set(withDelay(500 + delay, withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) })));
  }, [mark, delay, turn]);
  const back = useAnimatedStyle(() => ({
    opacity: turn.value < 0.5 ? 1 : 0,
    transform: [{ scaleX: Math.max(0.02, Math.abs(Math.cos(turn.value * Math.PI))) }],
  }));
  const front = useAnimatedStyle(() => ({
    opacity: turn.value >= 0.5 ? 1 : 0,
    transform: [{ scaleX: Math.max(0.02, Math.abs(Math.cos(turn.value * Math.PI))) }, { scale: 1 + 0.15 * Math.sin(turn.value * Math.PI) }],
  }));
  return (
    <Animated.View entering={ZoomIn.duration(260)} style={styles.coin}>
      <Animated.View style={[StyleSheet.absoluteFill, back]}>
        <CoinFace colors={FACE.voted}>
          <Emblem emoji="🏮" size={14} />
        </CoinFace>
      </Animated.View>
      {shown !== "voted" ? (
        <Animated.View style={[StyleSheet.absoluteFill, front]}>
          <CoinFace colors={FACE[shown]}>
            <AppText style={styles.coinMark}>{shown === "yes" ? "✓" : "✕"}</AppText>
          </CoinFace>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function CoinFace({ colors, children }: { colors: readonly string[]; children: ReactNode }) {
  return (
    <View style={styles.coinFace}>
      <LinearGradient colors={colors as unknown as [string, string, string]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={COIN / 2} t={2.5} />
      {children}
    </View>
  );
}

/** A mascot walking out to its place, waddling, then standing; toppling
 *  over into shadow when struck. */
function Walker({
  person,
  from,
  delay,
  paused,
  light,
  struck,
  selectable,
  crowned,
  mark,
  markDelay,
  onPick,
}: {
  person: Standing & { x: number; y: number; size: number };
  from: number;
  delay: number;
  paused: boolean;
  light: Light;
  struck: boolean;
  selectable: boolean;
  crowned: boolean;
  mark?: Mark;
  markDelay: number;
  onPick: () => void;
}) {
  const { x, y, size } = person;
  const height = size * 1.3;
  const shadeOf = (l: Light) => (l === "dim" ? 0.45 : l === "soft" ? 0.8 : 1);
  const walk = useSharedValue(0);
  const fall = useSharedValue(0);
  const shade = useSharedValue(shadeOf(light));
  const bob = useSharedValue(0);
  useEffect(() => {
    walk.set(withDelay(delay, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) })));
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1));
  }, [walk, bob, delay]);
  useEffect(() => {
    shade.set(withTiming(shadeOf(light), { duration: 350 }));
  }, [light, shade]);
  useEffect(() => {
    if (struck)
      fall.set(
        withDelay(
          260,
          withSequence(withTiming(0.15, { duration: 120 }), withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) })),
        ),
      );
  }, [struck, fall]);
  const style = useAnimatedStyle(() => {
    const p = walk.value;
    const steps = Math.sin(p * Math.PI * 7) * (1 - p);
    return {
      opacity: shade.value * (1 - fall.value * 0.55),
      transform: [
        { translateX: from + (x - from) * p - size / 2 },
        { translateY: y - height - Math.abs(steps) * 6 },
        { rotate: `${steps * 7 + fall.value * 84}deg` },
      ],
    };
  });
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 3 }] }));
  return (
    <Animated.View style={[styles.walker, { width: size, height, transformOrigin: [size / 2, height, 0] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={person.name}
        accessibilityState={{ selected: light === "lit" || light === "red", disabled: !selectable }}
        disabled={!selectable}
        onPress={onPick}
        hitSlop={6}
        style={StyleSheet.absoluteFill}
      >
        <MascotFigure look={person.look} width={size} seed={String(person.seat)} paused={paused} />
      </Pressable>
      {crowned ? (
        <Animated.View style={[styles.over, { top: -size * 0.32 }, float]} pointerEvents="none">
          <Emblem emoji="👑" size={Math.max(16, size * 0.28)} />
        </Animated.View>
      ) : null}
      {mark ? (
        // held up in front of them
        <View style={[styles.over, { top: height * 0.5 - COIN / 2, transform: [{ scale: Math.min(1.15, Math.max(0.75, size / 72)) }] }]} pointerEvents="none">
          <Coin mark={mark} delay={markDelay} />
        </View>
      ) : null}
      <AppText
        numberOfLines={1}
        style={[styles.name, { width: size + 20, left: -10 }, light === "red" && styles.named, light === "lit" && styles.picked]}
      >
        {person.name}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  walker: { position: "absolute", left: 0, top: 0 },
  over: { position: "absolute", left: 0, right: 0, alignItems: "center", gap: 2 },
  coin: { width: COIN, height: COIN },
  coinFace: {
    width: COIN,
    height: COIN,
    borderRadius: COIN / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coinMark: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 19,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    position: "absolute",
    bottom: -16,
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: "#F1E6D2",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  picked: { color: "#FFD58A", fontFamily: fontFamily.bold },
  named: { color: "#FF8A94", fontFamily: fontFamily.bold },
});

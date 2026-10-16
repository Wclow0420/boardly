// Everyone on a bare stage, for any game: each player walks out as their
// own mascot, one after another, to a place in a row (two staggered rows
// at a big table), under a lamp on the gilt lighting rig across the top.
// Each lamp throws a soft beam with dust drifting in it and a pool of
// light on the boards; a name plate stands at each player's feet.
//
// A game drives it with plain data:
//   lights  — each player's beam: full, low, nearly out, crimson, green
//   plates  — on the name plate: a seal once they've voted (never which
//             way), turned over at the reveal to green ✓ or red ✕
//   crown   — the leader: a crown set on their head (or hat)
//   selectable / onPick — who can be tapped
//   hold / aim / struck — red light streaming to someone while a button
//             is held, and the blow that falls on them (a slash, a burst,
//             the mascot toppling into shadow)
// Seal the Manor plays its team, its vote and its last chance on it.

import {
  Canvas,
  Group,
  Image as SkImage,
  Oval,
  Path,
  Picture,
  RadialGradient,
  Rect,
  Shader,
  Skia,
  vec,
  BlendMode,
  type SkPaint,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
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
import { NOISE } from "@/components/iso/noise";
import { useIsoClock } from "@/components/iso";
import { AppText, BezelOverlay, useBox } from "@/components/ui";
import { MascotFigure, lookKey } from "@/features/mascot/MascotStage";
import { topOf, type Look } from "@/features/mascot/dress";
import { BOX } from "@/features/mascot/rig";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { heavyHaptic } from "@/utils/haptics";
import { Burst, Motes } from "./light";
import { floorArt, rigArt, RIG_Y } from "./lineupArt";
import { shader } from "@/components/iso/shaders";

export interface Standing {
  seat: number;
  name: string;
  look: Look;
}

/** How a beam shines on someone: full, low (waiting to be picked), nearly
 *  out (left out), crimson (named, or voted against), green (voted for). */
export type Light = "lit" | "soft" | "dim" | "red" | "green";
/** On the name plate: sealed (they've voted), or turned up. */
export type Plate = "voted" | "yes" | "no";

const TINT: Record<Light, [number, number, number]> = {
  lit: [1, 0.9, 0.7],
  soft: [1, 0.9, 0.7],
  dim: [1, 0.9, 0.7],
  red: [1, 0.2, 0.26],
  green: [0.4, 1, 0.55],
};
const LEVEL: Record<Light, number> = { lit: 1, soft: 0.34, dim: 0.12, red: 1, green: 0.9 };

/** A beam from a lamp at `top` down to the floor at `bottomY`, soft at its
 *  edges, brightest near the lamp, shimmering a little; and the pool of
 *  light where it lands. */
const BEAM = `
uniform float t;
uniform vec2 top;
uniform float topHalf;
uniform float bottomY;
uniform float bottomHalf;
uniform vec3 color;
uniform float level;
uniform float seed;
${NOISE}
half4 main(vec2 p) {
  if (level < 0.01) return half4(0.0);
  float v = (p.y - top.y) / (bottomY - top.y);
  float h = mix(topHalf, bottomHalf, clamp(v, 0.0, 1.0));
  float u = (p.x - top.x) / h;
  float beam = 0.0;
  if (v > 0.0 && v < 1.0 && abs(u) < 1.0) {
    float edge = 1.0 - smoothstep(0.45, 1.0, abs(u));
    float core = exp(-u * u * 3.0);
    float shimmer = 0.8 + 0.4 * noise(vec2(p.x * 0.04 + seed, p.y * 0.03 - t * 0.35));
    beam = (edge * (0.1 + 0.26 * (1.0 - v)) + core * 0.1 * (1.0 - v * 0.5)) * shimmer;
    beam *= smoothstep(0.0, 0.06, v) * (1.0 - smoothstep(0.86, 1.0, v));
  }
  vec2 d = vec2((p.x - top.x) / (bottomHalf * 1.05), (p.y - bottomY) / (bottomHalf * 0.26));
  float pool = (1.0 - smoothstep(0.15, 1.0, length(d))) * 0.6;
  float a = max(beam, pool) * level;
  return half4(color * a, a);
}`;

export function StageLineup({
  people,
  lights,
  plates = {},
  crown = null,
  selectable = [],
  onPick,
  hold,
  aim = null,
  struck = null,
  paused,
}: {
  people: Standing[];
  /** Each seat's beam (full when left out). */
  lights: Record<number, Light>;
  plates?: Record<number, Plate>;
  /** The leader's seat. */
  crown?: number | null;
  /** Seats that can be tapped. */
  selectable?: number[];
  onPick?: (seat: number) => void;
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
          plates={plates}
          crown={crown}
          selectable={selectable}
          onPick={onPick}
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

type Place = Standing & { x: number; y: number; size: number; order: number };

/** Where everyone stands on a stage w × h. A big table stands in two
 *  rows: the back one further up the boards and smaller, each of them in
 *  a gap of the row in front. */
function placeAll(people: Standing[], w: number, h: number): Place[] {
  const two = people.length > 5;
  const rows = two ? [people.slice(0, Math.ceil(people.length / 2)), people.slice(Math.ceil(people.length / 2))] : [people];
  const across = w * 0.92;
  return rows.flatMap((row, r) => {
    const back = two && r === 0;
    const size = back ? Math.min(54, across / (row.length + 1.2)) : Math.min(84, across / (row.length + 0.4));
    const y = back ? h - 158 : h - 60;
    return row.map((person, i) => ({
      ...person,
      x: w * 0.04 + (back ? ((i + 1) * across) / (row.length + 1) : ((i + 0.5) * across) / row.length),
      y,
      size,
      order: r * 10 + i,
    }));
  });
}

function Stage({
  people,
  lights,
  plates,
  crown,
  selectable,
  onPick,
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
  plates: Record<number, Plate>;
  crown: number | null;
  selectable: number[];
  onPick?: (seat: number) => void;
  hold?: SharedValue<number>;
  aim: number | null;
  struck: number | null;
  clock: SharedValue<number>;
  paused: boolean;
  w: number;
  h: number;
}) {
  const two = people.length > 5;
  const floorH = Math.min(two ? 220 : 170, h * 0.48);
  const floorTop = h - floorH;
  const floor = bakedSvg("stage-lineup-floor", w, floorH, () => floorArt(w, floorH));
  // where everyone stands, worked out again only when who's there or the
  // stage's size changes (the board sends new objects every update)
  const cast = people.map((p) => `${p.seat}:${p.name}:${lookKey(p.look)}`).join("|");
  const places: Place[] = useMemo(
    () => placeAll(people, w, h),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cast` stands for `people`
    [cast, w, h],
  );
  const lamps = [...places].sort((a, b) => a.x - b.x);
  const rig = bakedSvg(`stage-lineup-rig|${lamps.map((p) => Math.round(p.x)).join(",")}`, w, RIG_Y + 30, () =>
    rigArt(w, lamps.map((p) => p.x)),
  );

  // the latest onPick, so the walkers needn't re-render when it changes
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  });
  const pick = useCallback((seat: number) => pickRef.current?.(seat), []);
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
  // plates turned up together turn one after another, left to right
  const turned = lamps.filter((p) => plates[p.seat] === "yes" || plates[p.seat] === "no").map((p) => p.seat);
  const lampY = RIG_Y + 22;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          {floor ? <SkImage image={floor} x={0} y={floorTop} width={w} height={floorH} /> : null}
          {places.map((p) => (
            <Beam key={p.seat} x={p.x} y={p.y} size={p.size} seat={p.seat} lampY={lampY} clock={clock} mode={lights[p.seat] ?? "lit"} />
          ))}
          <Dust places={places} lights={lights} lampY={lampY} clock={clock} />
          {rig ? <SkImage image={rig} x={0} y={0} width={w} height={RIG_Y + 30} /> : null}
          {lamps.map((p) => (
            <Lens key={p.seat} x={p.x} y={lampY - 2} mode={lights[p.seat] ?? "lit"} clock={clock} seed={p.seat} />
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
      </View>
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
          plate={plates[p.seat]}
          plateDelay={Math.max(0, turned.indexOf(p.seat)) * 200}
          onPick={pick}
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

/** One lamp's beam and its pool on the boards. */
function Beam({
  x,
  y,
  size,
  seat,
  lampY,
  clock,
  mode,
}: {
  x: number;
  y: number;
  size: number;
  seat: number;
  lampY: number;
  clock: SharedValue<number>;
  mode: Light;
}) {
  const source = shader(BEAM);
  const level = useSharedValue(LEVEL[mode]);
  const red = useSharedValue(mode === "red" ? 1 : 0);
  const green = useSharedValue(mode === "green" ? 1 : 0);
  useEffect(() => {
    level.set(withTiming(LEVEL[mode], { duration: 380 }));
    red.set(withTiming(mode === "red" ? 1 : 0, { duration: 380 }));
    green.set(withTiming(mode === "green" ? 1 : 0, { duration: 380 }));
  }, [mode, level, red, green]);
  const half = size * 0.66;
  const uniforms = useDerivedValue(
    () => ({
      t: clock.value,
      top: [x, lampY],
      topHalf: 7,
      bottomY: y,
      bottomHalf: half,
      color: TINT.lit.map((v, i) => v + (TINT.red[i] - v) * red.value + (TINT.green[i] - v) * green.value),
      // a stage light's faint unsteadiness
      level: level.value * (0.92 + 0.05 * Math.sin(clock.value * 5.3 + seat * 1.7) + 0.03 * Math.sin(clock.value * 17 + seat)),
      seed: seat * 7.3,
    }),
    [x, y, half, lampY, seat],
  );
  if (!source) return null;
  return (
    <Rect x={x - half * 1.2} y={lampY} width={half * 2.4} height={y - lampY + half * 0.4} blendMode="screen">
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** Specks of dust turning slowly in the lit beams: one picture a frame. */
function Dust({
  places,
  lights,
  lampY,
  clock,
}: {
  places: Place[];
  lights: Record<number, Light>;
  lampY: number;
  clock: SharedValue<number>;
}) {
  const paint = useMemo<SkPaint>(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color("#FFF2D0"));
    p.setBlendMode(BlendMode.Plus);
    p.setAntiAlias(true);
    return p;
  }, []);
  const beams = places.map((p) => ({ x: p.x, y: p.y, half: p.size * 0.6, level: LEVEL[lights[p.seat] ?? "lit"], seat: p.seat }));
  const beamsKey = JSON.stringify(beams);
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(-2000, -2000, 4000, 4000));
    const t = clock.value;
    for (const b of beams) {
      if (b.level < 0.3) continue;
      for (let i = 0; i < 7; i++) {
        const k = b.seat * 13 + i;
        const r1 = Math.sin(k * 127.1) * 43758.5453;
        const r2 = Math.sin(k * 311.7) * 43758.5453;
        const fx = r1 - Math.floor(r1);
        const fy = r2 - Math.floor(r2);
        const v = (fy + t * (0.02 + fx * 0.02)) % 1;
        const y = lampY + 20 + v * (b.y - lampY - 30);
        const spread = 0.15 + 0.85 * v;
        const x = b.x + (fx - 0.5) * 2 * b.half * spread * 0.8 + Math.sin(t * 0.7 + k) * 4;
        paint.setAlphaf(b.level * 0.5 * Math.sin(Math.PI * v));
        c.drawCircle(x, y, 0.9 + fx * 0.9, paint);
      }
    }
    return recorder.finishRecordingAsPicture();
  }, [beamsKey, lampY]);
  return <Picture picture={picture} />;
}

/** The glow in a lamp's lens, in its beam's colour. */
function Lens({ x, y, mode, clock, seed }: { x: number; y: number; mode: Light; clock: SharedValue<number>; seed: number }) {
  const level = useSharedValue(LEVEL[mode]);
  useEffect(() => {
    level.set(withTiming(LEVEL[mode], { duration: 380 }));
  }, [mode, level]);
  const opacity = useDerivedValue(() => level.value * (0.85 + 0.15 * Math.sin(clock.value * 6 + seed)));
  const hex = mode === "red" ? "#FF5A66" : mode === "green" ? "#8CFFA8" : "#FFF0C8";
  return (
    <Group>
      <Oval x={x - 14} y={y - 7} width={28} height={14} opacity={opacity} blendMode="screen">
        <RadialGradient c={vec(x, y)} r={14} colors={[hex, `${hex}00`]} />
      </Oval>
      <Oval x={x - 5} y={y - 2} width={10} height={4} opacity={opacity} color="#FFFFFF" />
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

const PLATE_FACE = {
  name: ["#3A2A1A", "#22160C"],
  voted: ["#3A2A1A", "#22160C"],
  yes: ["#5ED88A", "#1E8A4A"],
  no: ["#F05A6A", "#9A1428"],
} as const;

/** The name plate at someone's feet: dark wood in a gold rim; a gold seal
 *  on it once they've voted; at the reveal it turns over, green ✓ or
 *  red ✕. */
function NamePlate({
  name,
  plate,
  delay,
  width,
  bright,
}: {
  name: string;
  plate?: Plate;
  delay: number;
  width: number;
  bright: boolean;
}) {
  const shown = plate === "yes" || plate === "no" ? plate : null;
  const turn = useSharedValue(0);
  useEffect(() => {
    if (!shown) {
      turn.set(0);
      return;
    }
    turn.set(withDelay(500 + delay, withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) })));
  }, [shown, delay, turn]);
  const flip = useAnimatedStyle(() => ({
    transform: [{ scaleY: Math.max(0.05, Math.abs(Math.cos(turn.value * Math.PI))) }],
  }));
  const face = useAnimatedStyle(() => ({ opacity: turn.value >= 0.5 ? 1 : 0 }));
  return (
    <Animated.View style={[styles.plate, { width }, flip]}>
      <LinearGradient colors={PLATE_FACE.name as unknown as [string, string]} style={StyleSheet.absoluteFill} />
      {shown ? (
        <Animated.View style={[StyleSheet.absoluteFill, face]}>
          <LinearGradient colors={PLATE_FACE[shown] as unknown as [string, string]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      <BezelOverlay r={6} t={1.6} />
      <View style={styles.plateRow}>
        {plate === "voted" ? <View style={styles.seal} /> : null}
        {shown ? (
          <Animated.View style={face}>
            <AppText style={styles.mark}>{shown === "yes" ? "✓" : "✕"}</AppText>
          </Animated.View>
        ) : null}
        <AppText numberOfLines={1} style={[styles.name, bright && styles.nameBright]}>
          {name}
        </AppText>
      </View>
    </Animated.View>
  );
}

/** A mascot walking out to its place, waddling, then standing; toppling
 *  over into shadow when struck. */
const Walker = memo(function Walker({
  person,
  from,
  delay,
  paused,
  light,
  struck,
  selectable,
  crowned,
  plate,
  plateDelay,
  onPick,
}: {
  person: Place;
  from: number;
  delay: number;
  paused: boolean;
  light: Light;
  struck: boolean;
  selectable: boolean;
  crowned: boolean;
  plate?: Plate;
  plateDelay: number;
  onPick: (seat: number) => void;
}) {
  const { x, y, size } = person;
  const height = (size * BOX[1]) / BOX[0];
  const shadeOf = (l: Light) => (l === "dim" ? 0.42 : l === "soft" ? 0.78 : 1);
  const walk = useSharedValue(0);
  const fall = useSharedValue(0);
  const shade = useSharedValue(shadeOf(light));
  const sway = useSharedValue(0);
  useEffect(() => {
    walk.set(withDelay(delay, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) })));
  }, [walk, delay]);
  // only a crown sways
  useEffect(() => {
    if (!crowned) return;
    sway.set(withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(-1, { duration: 1400 })), -1, true));
    return () => cancelAnimation(sway);
  }, [crowned, sway]);
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
  // the crown rests on the head, or on the hat; it tilts a little
  const crownSize = Math.max(16, size * 0.3);
  const top = (topOf(person.look) / BOX[1]) * height;
  const tilt = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value * 4}deg` }] }));
  const plateW = Math.max(56, size + 10);
  return (
    <Animated.View style={[styles.walker, { width: size, height, transformOrigin: [size / 2, height, 0] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={person.name}
        accessibilityState={{ selected: light === "lit" || light === "red", disabled: !selectable }}
        disabled={!selectable}
        onPress={() => onPick(person.seat)}
        hitSlop={6}
        style={StyleSheet.absoluteFill}
      >
        <MascotFigure look={person.look} width={size} seed={String(person.seat)} paused={paused} />
      </Pressable>
      {crowned ? (
        <Animated.View
          style={[styles.crown, { top: top - crownSize * 0.78, transformOrigin: [crownSize / 2, crownSize, 0] }, tilt]}
          pointerEvents="none"
        >
          <Emblem emoji="👑" size={crownSize} />
        </Animated.View>
      ) : null}
      <View style={[styles.plateAt, { top: height - 2, left: (size - plateW) / 2, width: plateW }]} pointerEvents="none">
        <NamePlate name={person.name} plate={plate} delay={plateDelay} width={plateW} bright={light === "lit" || light === "red" || light === "green"} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  walker: { position: "absolute", left: 0, top: 0 },
  crown: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  plateAt: { position: "absolute", alignItems: "center" },
  plate: { height: 18, borderRadius: 6, overflow: "hidden", justifyContent: "center" },
  plateRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 5 },
  seal: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2B04A",
    borderWidth: 1,
    borderColor: "#7A5212",
  },
  mark: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 14, color: "#FFFFFF" },
  name: { fontFamily: fontFamily.semiBold, fontSize: 10, lineHeight: 13, color: "#C8C2B0", flexShrink: 1 },
  nameBright: { color: "#FFF2D8", fontFamily: fontFamily.bold },
});

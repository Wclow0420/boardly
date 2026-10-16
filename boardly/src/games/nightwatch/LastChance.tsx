// The last chance: the room is gone and the curtain opens on a bare
// stage. Everyone walks out as their own mascot, one after another, to a
// place in a row, each under a spotlight from above. The assassin taps
// the one they think is the Prophet — that light turns crimson and the
// rest dim — and holds the button: red light gathers on them, and when
// it's full the blow falls: a slash of light, a burst, and the mascot
// topples into shadow. Everyone else watches the lights flicker.

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
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { useBox } from "@/components/ui";
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
  /** The assassin may name them. */
  candidate: boolean;
}

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

export function LastChance({
  people,
  choosing,
  picked,
  onPick,
  hold,
  struck,
  paused,
}: {
  people: Standing[];
  /** I am the assassin, choosing. */
  choosing: boolean;
  picked: number | null;
  onPick: (seat: number) => void;
  hold: SharedValue<number>;
  /** The one named: the blow falls on them. */
  struck: number | null;
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
          choosing={choosing}
          picked={picked}
          onPick={onPick}
          hold={hold}
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
  choosing,
  picked,
  onPick,
  hold,
  struck,
  clock,
  paused,
  w,
  h,
}: Omit<Parameters<typeof LastChance>[0], never> & { clock: SharedValue<number>; w: number; h: number }) {
  const floorH = Math.min(170, h * 0.36);
  const floorTop = h - floorH;
  const floor = bakedSvg("manor-stage-floor", w, floorH, () => floorArt(w, floorH));
  // one row, or two when the table is big (the back row smaller, higher)
  const rows = people.length > 5 ? [people.slice(0, Math.ceil(people.length / 2)), people.slice(Math.ceil(people.length / 2))] : [people];
  const places = rows.flatMap((row, r) => {
    const back = rows.length > 1 && r === 0;
    const size = Math.min(back ? 66 : 84, (w * 0.92) / (row.length + 0.4));
    const y = back ? floorTop + floorH * 0.3 : h - 40;
    return row.map((person, i) => ({
      ...person,
      x: w * 0.04 + ((i + 0.5) * (w * 0.92)) / row.length,
      y,
      size,
      order: r * 10 + i,
    }));
  });
  const target = places.find((p) => p.seat === (struck ?? picked));
  const flow = useDerivedValue(() => (picked !== null && struck === null ? Math.min(1, hold.value * 1.5) : 0), [picked, struck]);
  const burst = useSharedValue(0);
  useEffect(() => {
    if (struck === null) return;
    burst.set(0);
    burst.set(withDelay(180, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })));
    const thud = setTimeout(heavyHaptic, 180);
    return () => clearTimeout(thud);
  }, [struck, burst]);

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
            mode={
              p.seat === struck || (struck === null && p.seat === picked)
                ? "red"
                : (choosing && !p.candidate) || (picked !== null && p.seat !== picked) || (struck !== null && p.seat !== struck)
                  ? "dim"
                  : "lit"
            }
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
          dim={(choosing && !p.candidate) || (picked !== null && p.seat !== picked) || (struck !== null && p.seat !== struck)}
          struck={p.seat === struck}
          selectable={choosing && p.candidate && struck === null}
          selected={p.seat === picked}
          onPick={() => onPick(p.seat)}
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
  mode: "lit" | "dim" | "red";
}) {
  const level = useSharedValue(mode === "dim" ? 0.25 : 1);
  const red = useSharedValue(mode === "red" ? 1 : 0);
  useEffect(() => {
    level.set(withTiming(mode === "dim" ? 0.22 : 1, { duration: 400 }));
    red.set(withTiming(mode === "red" ? 1 : 0, { duration: 400 }));
  }, [mode, level, red]);
  // a stage light's faint unsteadiness
  const flicker = useDerivedValue(
    () => level.value * (0.88 + 0.08 * Math.sin(clock.value * 5.3 + seed * 1.7) + 0.04 * Math.sin(clock.value * 17 + seed)),
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

/** A mascot walking out to its place, waddling, then standing; toppling
 *  over into shadow when struck. */
function Walker({
  person,
  from,
  delay,
  paused,
  dim,
  struck,
  selectable,
  selected,
  onPick,
}: {
  person: Standing & { x: number; y: number; size: number };
  from: number;
  delay: number;
  paused: boolean;
  dim: boolean;
  struck: boolean;
  selectable: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const { x, y, size } = person;
  const height = size * 1.3;
  const walk = useSharedValue(0);
  const fall = useSharedValue(0);
  const shade = useSharedValue(dim ? 0.45 : 1);
  useEffect(() => {
    walk.set(withDelay(delay, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) })));
  }, [walk, delay]);
  useEffect(() => {
    shade.set(withTiming(dim ? 0.45 : 1, { duration: 400 }));
  }, [dim, shade]);
  useEffect(() => {
    if (struck) fall.set(withDelay(260, withSequence(withTiming(0.15, { duration: 120 }), withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) }))));
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
  return (
    <Animated.View style={[styles.walker, { width: size, height, transformOrigin: [size / 2, height, 0] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={person.name}
        accessibilityState={{ selected, disabled: !selectable }}
        disabled={!selectable}
        onPress={onPick}
        style={StyleSheet.absoluteFill}
      >
        <MascotFigure look={person.look} width={size} seed={String(person.seat)} paused={paused} />
      </Pressable>
      <AppText numberOfLines={1} style={[styles.name, { width: size + 20, left: -10 }, selected && styles.picked]}>
        {person.name}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  walker: { position: "absolute", left: 0, top: 0 },
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
  picked: { color: "#FF8A94", fontFamily: fontFamily.bold },
});

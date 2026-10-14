// One-off moments on an <IsoCanvas>: what happens when something is
// used — rings off a bell, a column of light, sparks, a puff of smoke,
// ripples on water — and the slower, standing ones: a seal of runes on
// the floor, a shaft of moonlight. A burst plays once as its `progress`
// runs from 0 to 1; at 1 it is gone.

import { useMemo, type ReactNode } from "react";
import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

/** What a burst looks like and where it starts, in the picture's units.
 *  `size` is how far it reaches. */
export interface BurstSpec {
  kind: "rings" | "ripples" | "beam" | "sparks" | "puff" | "glow";
  x: number;
  y: number;
  size: number;
  color: string;
  /** How long it plays, in milliseconds. */
  duration: number;
  /** A puff of smoke rather than of steam. */
  dark?: boolean;
  /** How bright, 0–1. */
  strength?: number;
}

const FLOOR = 0.58;
const clamp = (v: number) => {
  "worklet";
  return Math.min(1, Math.max(0, v));
};

function Rings({ spec, progress, flat }: { spec: BurstSpec; progress: SharedValue<number>; flat: boolean }) {
  const { x, y, size, color, strength = 1 } = spec;
  const useRing = (delay: number) => ({
    r: useDerivedValue(() => size * (0.25 + clamp((progress.value - delay) / 0.7) * 1.1)),
    opacity: useDerivedValue(() => {
      const p = clamp((progress.value - delay) / 0.7);
      return p > 0 && p < 1 ? (1 - p) * 0.9 * strength : 0;
    }),
  });
  const rings = [useRing(0), useRing(0.14), useRing(0.28)];
  return (
    <Group transform={flat ? [{ scaleY: FLOOR }] : []} origin={vec(x, y)} blendMode="screen">
      {rings.map((one, index) => (
        <Circle key={index} cx={x} cy={y} r={one.r} opacity={one.opacity} color={color} style="stroke" strokeWidth={1.6}>
          <BlurMask blur={1.2} style="solid" />
        </Circle>
      ))}
    </Group>
  );
}

function Beam({ spec, progress }: { spec: BurstSpec; progress: SharedValue<number> }) {
  const { x, y, size, color, strength = 1 } = spec;
  const swell = useDerivedValue(() => Math.sin(Math.PI * clamp(progress.value)));
  const width = useDerivedValue(() => size * (0.8 + 0.7 * swell.value));
  const left = useDerivedValue(() => x - width.value / 2);
  const opacity = useDerivedValue(() => swell.value * strength);
  const top = Math.max(0, y - size * 6);
  return (
    <Group blendMode="screen" opacity={opacity}>
      <Rect x={left} y={top} width={width} height={y - top}>
        <LinearGradient start={vec(x, top)} end={vec(x, y)} colors={[`${color}00`, `${color}DD`, color]} />
        <BlurMask blur={4} style="normal" />
      </Rect>
      <Circle cx={x} cy={y} r={size * 1.7}>
        <RadialGradient c={vec(x, y)} r={size * 1.7} colors={[color, `${color}00`]} />
      </Circle>
    </Group>
  );
}

/** One spark: thrown out, it rises, falls and fades. */
function Spark({ spec, progress, index }: { spec: BurstSpec; progress: SharedValue<number>; index: number }) {
  const { x, y, size, color, strength = 1 } = spec;
  const angle = (index / 10) * Math.PI * 2 + (index % 3) * 0.3;
  const reach = size * (0.6 + ((index * 37) % 10) / 25);
  const cx = useDerivedValue(() => x + Math.cos(angle) * reach * progress.value);
  const cy = useDerivedValue(() => {
    const p = progress.value;
    return y + Math.sin(angle) * reach * p * 0.6 - size * 0.7 * p + size * 1.1 * p * p;
  });
  const r = useDerivedValue(() => 1.3 * (1 - progress.value) + 0.2);
  const opacity = useDerivedValue(() => (progress.value < 1 ? (1 - progress.value) * strength : 0));
  return (
    <Circle cx={cx} cy={cy} r={r} opacity={opacity} color={color}>
      <BlurMask blur={0.8} style="solid" />
    </Circle>
  );
}

function Sparks({ spec, progress }: { spec: BurstSpec; progress: SharedValue<number> }) {
  return (
    <Group blendMode="screen">
      {Array.from({ length: 10 }, (_, index) => (
        <Spark key={index} spec={spec} progress={progress} index={index} />
      ))}
    </Group>
  );
}

function Puff({ spec, progress }: { spec: BurstSpec; progress: SharedValue<number> }) {
  const { x, y, size, color, dark, strength = 1 } = spec;
  const useCloud = (index: number) => ({
    cx: useDerivedValue(() => x + Math.sin(index * 2.1 + progress.value * 3) * size * 0.25),
    cy: useDerivedValue(() => y - size * progress.value * (0.6 + index * 0.35)),
    r: useDerivedValue(() => size * (0.25 + 0.55 * progress.value) * (1 - index * 0.12)),
    opacity: useDerivedValue(() =>
      progress.value < 1 ? (1 - progress.value) * (dark ? 0.75 : 0.55) * strength : 0
    ),
  });
  const clouds = [useCloud(0), useCloud(1), useCloud(2), useCloud(3)];
  return (
    <Group blendMode={dark ? "srcOver" : "screen"}>
      {clouds.map((one, index) => (
        <Circle key={index} cx={one.cx} cy={one.cy} r={one.r} opacity={one.opacity} color={color}>
          <BlurMask blur={4} style="normal" />
        </Circle>
      ))}
    </Group>
  );
}

function Glow({ spec, progress }: { spec: BurstSpec; progress: SharedValue<number> }) {
  const { x, y, size, color, strength = 1 } = spec;
  const swell = useDerivedValue(() => Math.sin(Math.PI * clamp(progress.value)));
  const r = useDerivedValue(() => size * (0.6 + 0.7 * swell.value));
  const opacity = useDerivedValue(() => swell.value * strength);
  return (
    <Circle cx={x} cy={y} r={r} opacity={opacity} blendMode="screen">
      <RadialGradient c={vec(x, y)} r={size * 1.3} colors={[color, `${color}00`]} />
    </Circle>
  );
}

/** A burst, playing as `progress` runs from 0 to 1. */
export function Burst({ spec, progress }: { spec: BurstSpec; progress: SharedValue<number> }) {
  switch (spec.kind) {
    case "rings":
      return <Rings spec={spec} progress={progress} flat={false} />;
    case "ripples":
      return <Rings spec={spec} progress={progress} flat />;
    case "beam":
      return <Beam spec={spec} progress={progress} />;
    case "sparks":
      return <Sparks spec={spec} progress={progress} />;
    case "puff":
      return <Puff spec={spec} progress={progress} />;
    case "glow":
      return <Glow spec={spec} progress={progress} />;
  }
}

/** A ring of runes laid on the floor, turning slowly and glowing: a
 *  seal. `rx`/`ry` are its radii as the floor foreshortens it. */
export function Seal({
  x,
  y,
  rx,
  ry,
  color,
  clock,
}: {
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
  clock: SharedValue<number>;
}) {
  // drawn at radius 100 around the origin, then laid down and moved into place
  const runes = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(0, 0, 100);
    path.addCircle(0, 0, 78);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      const at = (r: number, t = 0) => [c * r - s * t, s * r + c * t] as const;
      if (i % 2 === 0) {
        // a little diamond
        const [ax, ay] = at(95);
        const [bx, by] = at(89, 5);
        const [cx, cy] = at(83);
        const [dx, dy] = at(89, -5);
        path.moveTo(ax, ay).lineTo(bx, by).lineTo(cx, cy).lineTo(dx, dy).close();
      } else {
        // a bar with a cross-stroke
        const [ax, ay] = at(96);
        const [bx, by] = at(82);
        const [cx, cy] = at(90, 5);
        const [dx, dy] = at(90, -5);
        path.moveTo(ax, ay).lineTo(bx, by).moveTo(cx, cy).lineTo(dx, dy);
      }
    }
    return path;
  }, []);
  const transform = useDerivedValue(() => [
    { translateX: x },
    { translateY: y },
    { scaleX: rx / 100 },
    { scaleY: ry / 100 },
    { rotate: clock.value * 0.25 },
  ]);
  const opacity = useDerivedValue(() => 0.75 + 0.25 * Math.sin(clock.value * 1.8));
  return (
    <Group blendMode="screen" opacity={opacity}>
      <Circle cx={x} cy={y} r={rx * 1.5} transform={[{ scaleY: ry / rx }]} origin={vec(x, y)}>
        <RadialGradient c={vec(x, y)} r={rx * 1.5} colors={[`${color}AA`, `${color}00`]} />
      </Circle>
      <Group transform={transform}>
        <Path path={runes} color={color} style="stroke" strokeWidth={5.5}>
          <BlurMask blur={5} style="solid" />
        </Path>
      </Group>
    </Group>
  );
}

/** A shaft of moonlight from a window down to the floor it lights:
 *  `d` is its outline, running from `from` (the window) to `to`. */
export function Shaft({
  d,
  from,
  to,
  color,
  clock,
  children,
}: {
  d: string;
  from: [number, number];
  to: [number, number];
  color: string;
  clock: SharedValue<number>;
  /** Drawn inside the shaft only: dust hanging in the light. */
  children?: ReactNode;
}) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);
  const opacity = useDerivedValue(() => 0.8 + 0.2 * Math.sin(clock.value * 0.4 + from[0]));
  if (!path) return null;
  return (
    <Group blendMode="screen" opacity={opacity}>
      <Path path={path}>
        <LinearGradient start={vec(...from)} end={vec(...to)} colors={[`${color}88`, `${color}30`, `${color}00`]} />
      </Path>
      <Group clip={path}>{children}</Group>
    </Group>
  );
}

/** An area that glows and breathes: `d` is its outline. */
export function GlowArea({ d, color, clock }: { d: string; color: string; clock: SharedValue<number> }) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);
  const breath = useDerivedValue(() => 0.55 + 0.45 * Math.sin(clock.value * 2.2));
  if (!path) return null;
  return (
    <Group blendMode="screen" opacity={breath}>
      <Path path={path} color={`${color}44`} />
      <Path path={path} color={color} style="stroke" strokeWidth={2}>
        <BlurMask blur={3} style="solid" />
      </Path>
    </Group>
  );
}

/** A lit passage between two points, a bead of light travelling it. */
export function Passage({
  from,
  to,
  color,
  clock,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  clock: SharedValue<number>;
}) {
  const path = useMemo(() => {
    const line = Skia.Path.Make();
    line.moveTo(from[0], from[1]).lineTo(to[0], to[1]);
    return line;
  }, [from, to]);
  const bead = useDerivedValue(() => {
    const f = (clock.value * 0.35) % 1;
    const there = f < 0.5 ? f * 2 : 2 - f * 2;
    return vec(from[0] + (to[0] - from[0]) * there, from[1] + (to[1] - from[1]) * there);
  });
  const cx = useDerivedValue(() => bead.value.x);
  const cy = useDerivedValue(() => bead.value.y);
  return (
    <Group blendMode="screen">
      <Path path={path} color={color} style="stroke" strokeWidth={2.2} strokeCap="round" opacity={0.7}>
        <BlurMask blur={2.5} style="solid" />
      </Path>
      <Circle cx={cx} cy={cy} r={2.4} color="#FFFFFF">
        <BlurMask blur={2} style="solid" />
      </Circle>
    </Group>
  );
}

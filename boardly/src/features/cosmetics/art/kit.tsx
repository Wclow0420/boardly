// What the art borders are drawn with. Every border draws in one space:
// the avatar is a circle of radius 50 at the origin, and the art has
// room out to about 92 (the canvas is 1.9 avatars wide). Angles are in
// radians, 0 pointing right and -π/2 straight up.
//
// One clock (useBorderClock) drives every border on screen. Small
// avatars get a clock that stands still: a list of a dozen borders
// doesn't need a dozen fires burning.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

export type Clock = SharedValue<number>;

/** What an art border draws on one of its two layers. */
export type ArtLayer = (props: { t: Clock }) => ReactNode;

export interface ArtBorderDrawing {
  /** Behind the avatar. */
  back?: ArtLayer;
  /** Over the avatar's edge (keep clear of its face: r < 46). */
  front?: ArtLayer;
}

// ── the clock ───────────────────────────────────────────────────────

const ClockContext = createContext<Clock | null>(null);

/** Ticks every border on screen; stops while the app is away or reduce
 *  motion is on. */
export function BorderClockProvider({ children }: { children: ReactNode }) {
  const seconds = useSharedValue(0);
  const still = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const watch = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => watch.remove();
  }, []);
  const running = active && !still;
  const tick = useFrameCallback((frame) => {
    seconds.value += Math.min(frame.timeSincePreviousFrame ?? 16, 100) / 1000;
  }, running);
  useEffect(() => tick.setActive(running), [running, tick]);
  return (
    <ClockContext.Provider value={seconds}>
      <MotionBudget>{children}</MotionBudget>
    </ClockContext.Provider>
  );
}

// ── how many borders may move at once ───────────────────────────────

/** The most art borders that move at the same time. Past that, the
 *  smallest stand still on their resting pose (nothing is left out of
 *  the drawing) until a bigger one leaves the screen: a lobby full of
 *  legendary borders stays smooth. */
export const MOVING_AT_ONCE = 6;

type Budget = {
  want: (id: string, size: number) => void;
  drop: (id: string) => void;
  moving: ReadonlySet<string>;
};
const BudgetContext = createContext<Budget | null>(null);

function MotionBudget({ children }: { children: ReactNode }) {
  // every border that would like to move, in the order they asked
  const [wants, setWants] = useState<[string, number][]>([]);
  const want = useCallback((id: string, size: number) => {
    setWants((all) =>
      all.some(([other, s]) => other === id && s === size)
        ? all
        : [...all.filter(([other]) => other !== id), [id, size]],
    );
  }, []);
  const drop = useCallback((id: string) => {
    setWants((all) => all.filter(([other]) => other !== id));
  }, []);
  // the biggest move; among equals, the first to ask
  const moving = useMemo(
    () =>
      new Set(
        wants
          .map(([id, size], order) => ({ id, size, order }))
          .sort((a, b) => b.size - a.size || a.order - b.order)
          .slice(0, MOVING_AT_ONCE)
          .map((w) => w.id),
      ),
    [wants],
  );
  const value = useMemo(() => ({ want, drop, moving }), [want, drop, moving]);
  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

/** Whether a border of `size` may move now (it asks only when `wants`). */
export function useMayMove(size: number, wants: boolean): boolean {
  const budget = useContext(BudgetContext);
  const id = useId();
  useEffect(() => {
    if (!budget || !wants) return;
    budget.want(id, size);
    return () => budget.drop(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget?.want, budget?.drop, id, size, wants]);
  if (!wants) return false;
  return budget ? budget.moving.has(id) : true;
}

/** The shared clock, or one that stands still (small avatars, or no
 *  provider). */
export function useBorderClock(still: boolean): Clock {
  const shared = useContext(ClockContext);
  const frozen = useSharedValue(1.7);
  return still || !shared ? frozen : shared;
}

// ── small helpers ───────────────────────────────────────────────────

export const TAU = Math.PI * 2;

/** A point at angle `a`, radius `r`. */
export const polar = (a: number, r: number) => {
  "worklet";
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
};

/** A repeatable random number in [0, 1) for seed `i`. */
export const rnd = (i: number) => {
  "worklet";
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** A circle as path data. */
export const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

/** An arc of a circle as path data, from angle a0 to a1. */
export const arcPath = (r: number, a0: number, a1: number) => {
  const p0 = polar(a0, r);
  const p1 = polar(a1, r);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${p0.x} ${p0.y}A${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`;
};

/** The clock, set forward so neighbours don't move as one. */
export function useOffset(t: Clock, offset: number) {
  return useDerivedValue(() => t.value + offset);
}

// ── shared pieces ───────────────────────────────────────────────────

/** A metal-or-wood band round the avatar, with dark rims. */
export function Band({
  r = 54,
  width = 8,
  colors,
  rim = "#00000088",
  sweep = false,
}: {
  r?: number;
  width?: number;
  colors: string[];
  rim?: string;
  /** Colours go round the band rather than top to bottom. */
  sweep?: boolean;
}) {
  return (
    <Group>
      <Circle cx={0} cy={0} r={r} style="stroke" strokeWidth={width}>
        {sweep ? (
          <SweepGradient c={vec(0, 0)} colors={[...colors, colors[0]]} />
        ) : (
          <LinearGradient start={vec(0, -r)} end={vec(0, r)} colors={colors} />
        )}
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={r + width / 2}
        style="stroke"
        strokeWidth={1.2}
        color={rim}
      />
      <Circle
        cx={0}
        cy={0}
        r={r - width / 2}
        style="stroke"
        strokeWidth={1.2}
        color={rim}
      />
    </Group>
  );
}

/** A soft glow behind everything. */
export function Halo({
  r = 80,
  color,
  opacity = 1,
}: {
  r?: number;
  color: string;
  opacity?: number | SharedValue<number>;
}) {
  return (
    <Circle cx={0} cy={0} r={r} opacity={opacity}>
      <RadialGradient
        c={vec(0, 0)}
        r={r}
        colors={[color, `${color}00`]}
        positions={[0.55, 1]}
      />
    </Circle>
  );
}

/** Sparks that rise from a band of the ring and fade. */
export function Sparks({
  t,
  count = 8,
  from = -Math.PI * 0.85,
  to = -Math.PI * 0.15,
  r = 60,
  rise = 34,
  color = "#FFC35A",
  size = 1.8,
  seed = 1,
}: {
  t: Clock;
  count?: number;
  from?: number;
  to?: number;
  r?: number;
  rise?: number;
  color?: string;
  size?: number;
  seed?: number;
}) {
  return (
    <Group blendMode="screen">
      {Array.from({ length: count }, (_, i) => (
        <Spark
          key={i}
          t={t}
          i={i + seed * 100}
          from={from}
          to={to}
          r={r}
          rise={rise}
          color={color}
          size={size}
        />
      ))}
    </Group>
  );
}

function Spark({
  t,
  i,
  from,
  to,
  r,
  rise,
  color,
  size,
}: {
  t: Clock;
  i: number;
  from: number;
  to: number;
  r: number;
  rise: number;
  color: string;
  size: number;
}) {
  const life = 1.3 + rnd(i) * 1.2;
  const a = from + (to - from) * rnd(i + 7);
  const start = polar(a, r);
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 3) * life) % life) / life;
    return [
      { translateX: start.x + Math.sin(p * 6 + i) * 4 },
      { translateY: start.y - p * rise },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 3) * life) % life) / life;
    return Math.sin(p * Math.PI);
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={size * 2.4} color={color} opacity={0.35}>
        <BlurMask blur={size * 1.4} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={size} color="#FFF4D6" />
    </Group>
  );
}

/** A four-pointed glint that flares and fades. */
export function Glint({
  t,
  x,
  y,
  size,
  phase = 0,
  speed = 1.2,
}: {
  t: Clock;
  x: number;
  y: number;
  size: number;
  phase?: number;
  speed?: number;
}) {
  const star = useMemo(() => {
    const w = size * 0.2;
    return `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`;
  }, [size]);
  const transform = useDerivedValue(() => {
    const p = Math.max(0, Math.sin(t.value * speed + phase)) ** 5;
    return [{ translateX: x }, { translateY: y }, { scale: 0.15 + p }];
  });
  const opacity = useDerivedValue(
    () => Math.max(0, Math.sin(t.value * speed + phase)) ** 3,
  );
  return (
    <Path path={star} color="#FFFFFF" transform={transform} opacity={opacity} />
  );
}

/** A small flame drawn as a teardrop that flickers (cheaper than the
 *  Fire shader, for many small flames). */
export function Flicker({
  t,
  x,
  y,
  size,
  phase = 0,
  color = "#FFB347",
}: {
  t: Clock;
  x: number;
  y: number;
  size: number;
  phase?: number;
  color?: string;
}) {
  const d = useMemo(() => {
    const w = size * 0.42;
    return `M0 ${-size}C${w} ${-size * 0.45} ${w * 1.15} ${-size * 0.05} 0 0C${-w * 1.15} ${-size * 0.05} ${-w} ${-size * 0.45} 0 ${-size}z`;
  }, [size]);
  const transform = useDerivedValue(() => {
    const s =
      1 +
      0.16 *
        Math.sin(t.value * 11 + phase) *
        Math.sin(t.value * 4.3 + phase * 2);
    return [
      { translateX: x },
      { translateY: y },
      { scaleY: s },
      { scaleX: 2 - s },
    ];
  });
  return (
    <Group transform={transform}>
      <Path path={d} color={color} opacity={0.5}>
        <BlurMask blur={size * 0.35} style="normal" />
      </Path>
      <Path path={d} color={color} />
      <Path
        path={d}
        color="#FFF3C4"
        transform={[{ translateY: -size * 0.05 }, { scale: 0.5 }]}
      />
    </Group>
  );
}

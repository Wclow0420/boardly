// Sunburst, Emerald Grove and Moonpool: engraved art borders, replacing
// the old flat glows of the same ids (Golden Aura, Neon Green, Ripple).
//   Sunburst — a gold ring set with a fire opal, sharp faceted rays
//     fanning out behind it, long and short, turning slowly in a warm halo.
//   Emerald Grove — a silver ring wound round by a vine, leaves swaying
//     at each turn and emeralds set where it crosses, lighting in turn.
//   Moonpool — a pearled silver ring in dark night water, rings of
//     water spreading out from it, moonlight glinting, a crescent moon.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  FillType,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  LEAF,
  MATERIALS,
  curl,
  ribbon,
  type Pt,
} from "@/components/engraved/shapes";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_STEEL = "#1E242C";
const VEIN_STEEL = "#4A5462";
const DEG = Math.PI / 180;

const f2 = (n: number) => n.toFixed(2);
const pt = (p: { x: number; y: number }) => `${f2(p.x)} ${f2(p.y)}`;
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;

/** An engraved piece: filled with its metal, its veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink,
  vein,
  veinColor,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors: readonly string[];
  ink: string;
  vein?: string;
  veinColor?: string;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const fill = evenOdd ? "evenOdd" : "winding";
  // the engraving stays inside the piece
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={[...colors]} />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={0.8}
              strokeCap="round"
              color={veinColor ?? ink}
              opacity={0.75}
            />
          ) : null}
          {shine ? (
            <Path
              path={shine}
              style="stroke"
              strokeWidth={1.2}
              strokeCap="round"
              color="#FFFFFF"
              opacity={0.85}
            />
          ) : null}
        </Group>
      ) : null}
      <Path
        path={d}
        fillType={fill}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        color={ink}
      />
    </Group>
  );
}

/** An arc of radius r from angle a0 to a1 (degrees), as an open line. */
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${pt(p)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${pt(q)}`;
};

// ── Sunburst ─────────────────────────────────────────────────────────

/** One sharp ray at angle a: two facets split down its midrib (the
 *  clockwise one lit, the other in shade), flanks drawn in a little. */
function ray(a: number, r0: number, rt: number, w: number) {
  const across = { x: -Math.sin(a), y: Math.cos(a) };
  const at = (r: number, side: number) => {
    const p = polar(a, r);
    return { x: p.x + across.x * side, y: p.y + across.y * side };
  };
  const base = polar(a, r0);
  const tip = polar(a, rt);
  const mid = r0 + (rt - r0) * 0.5;
  const lit = `M${pt(at(r0, w))}Q${pt(at(mid, w * 0.38))} ${pt(tip)}L${pt(base)}Z`;
  const dark = `M${pt(at(r0, -w))}Q${pt(at(mid, -w * 0.38))} ${pt(tip)}L${pt(base)}Z`;
  const outline = `M${pt(at(r0, w))}Q${pt(at(mid, w * 0.38))} ${pt(tip)}Q${pt(at(mid, -w * 0.38))} ${pt(at(r0, -w))}Z`;
  const rib = `M${pt(polar(a, r0 + 6))}L${pt(polar(a, rt - (rt - r0) * 0.12))}`;
  return { lit, dark, outline, rib };
}

function rays(count: number, offset: number, rt: number, w: number) {
  const all = Array.from({ length: count }, (_, k) =>
    ray(((k * 360) / count + offset) * DEG - Math.PI / 2, 53, rt, w),
  );
  return {
    lit: all.map((r) => r.lit).join(""),
    dark: all.map((r) => r.dark).join(""),
    outline: all.map((r) => r.outline).join(""),
    rib: all.map((r) => r.rib).join(""),
  };
}

const LONG_RAYS = rays(12, 0, 89, 7.4);
const SHORT_RAYS = rays(12, 15, 75, 5.6);
const ALL_RAYS = LONG_RAYS.outline + SHORT_RAYS.outline;

function RaySet({
  set,
  lit,
  dark,
}: {
  set: typeof LONG_RAYS;
  lit: string[];
  dark: string[];
}) {
  const positions = [0.58, 0.78, 1];
  return (
    <Group>
      <Path path={set.lit}>
        <RadialGradient
          c={vec(0, 0)}
          r={90}
          colors={lit}
          positions={positions}
        />
      </Path>
      <Path path={set.dark}>
        <RadialGradient
          c={vec(0, 0)}
          r={90}
          colors={dark}
          positions={positions}
        />
      </Path>
      <Path
        path={set.rib}
        style="stroke"
        strokeWidth={0.7}
        strokeCap="round"
        color={VEIN_GOLD}
      />
      <Path
        path={set.outline}
        style="stroke"
        strokeWidth={1.1}
        strokeJoin="round"
        color={INK_GOLD}
      />
    </Group>
  );
}

function SunBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.34 + 0.16 * Math.sin(t.value * 1.1));
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.05 }]);
  return (
    <Group>
      <Halo r={92} color="#FFB23A" opacity={glow} />
      <Group transform={turn}>
        <RaySet
          set={LONG_RAYS}
          lit={["#FFF6CC", "#F6D274", "#E2A43A"]}
          dark={["#D09A3A", "#9A6B1E", "#6A4410"]}
        />
        <RaySet
          set={SHORT_RAYS}
          lit={["#FFE6A0", "#F4B44A", "#E08424"]}
          dark={["#C07A1E", "#8A4E10", "#5A2E06"]}
        />
        <Sweep t={t} d={ALL_RAYS} every={4.2} phase={1.2} />
      </Group>
    </Group>
  );
}

const SUN_RING = circle(61) + circle(50.5);
/** Notches cut round the ring between its two grooves. */
const SUN_TICKS = Array.from({ length: 36 }, (_, k) => {
  const a = (k * 10 + 5) * DEG;
  return `M${pt(polar(a, 54.2))}L${pt(polar(a, 57.2))}`;
}).join("");
const FIRE_OPAL: [string, string, string] = ["#FFF0B0", "#FF8A1A", "#7A2604"];

/** A gem in a gold bezel. */
function Bezel({
  x,
  y,
  r,
  colors,
}: {
  x: number;
  y: number;
  r: number;
  colors: [string, string, string];
}) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient
          c={vec(x - r * 0.4, y - r * 0.4)}
          r={r * 1.6}
          colors={GOLD}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={r}
        style="stroke"
        strokeWidth={1.1}
        color={INK_GOLD}
      />
      <Gem x={x} y={y} w={r * 1.25} h={r * 1.25} colors={colors} />
    </Group>
  );
}

function SunFront({ t }: { t: Clock }) {
  const beat = useDerivedValue(() => 0.45 + 0.35 * Math.sin(t.value * 1.1));
  return (
    <Group>
      <Metal
        d={SUN_RING}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        vein={circle(58.2) + circle(53.2) + SUN_TICKS}
        veinColor={VEIN_GOLD}
        shine={arc(59.6, -168, -112)}
      />
      <Sweep t={t} d={SUN_RING} evenOdd every={4.2} />
      {/* the fire opal on top glows with the halo */}
      <Circle cx={0} cy={-56} r={9} color="#FF9A2A" opacity={beat}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Bezel x={0} y={-56} r={7} colors={FIRE_OPAL} />
      <Bezel x={0} y={56} r={5} colors={FIRE_OPAL} />
      <Glint t={t} x={-1.5} y={-58} size={6} phase={0.4} speed={1} />
      <Glint t={t} x={-44} y={-34} size={4} phase={2.2} speed={1.1} />
      <Glint t={t} x={0} y={55} size={4} phase={3.6} speed={0.9} />
    </Group>
  );
}

// ── Emerald Grove ────────────────────────────────────────────────────

/** The vine winds round the ring like a thread round a hoop: n turns,
 *  over the front then under the back. Where it rounds the outer edge
 *  an emerald is set, and leaves spring. */
const VINE_R = 55;
const VINE_RHO = 5.4;
const TURNS = 8;
// a bud straight up at the top
const PHI0 = (Math.PI / 2) * TURNS;
const vineAt = (th: number): Pt => {
  const r = VINE_R + VINE_RHO * Math.cos(TURNS * th + PHI0);
  return [Math.cos(th) * r, Math.sin(th) * r];
};
/** The vine where φ runs from p0 to p1. */
function vineSpan(j: number, p0: number, p1: number, w0: number, w1: number) {
  const N = 8;
  const pts: Pt[] = [];
  const ws: number[] = [];
  for (let i = 0; i <= N; i++) {
    const phi = p0 + ((p1 - p0) * i) / N;
    pts.push(vineAt((phi + TAU * j - PHI0) / TURNS));
    // fuller over the face, thinner where it turns away
    ws.push(w0 + (w1 - w0) * Math.sin((Math.PI * i) / N));
  }
  return ribbon(pts, ws);
}
const VINE_FRONT = Array.from({ length: TURNS }, (_, j) =>
  vineSpan(j, -0.2, Math.PI + 0.2, 3.6, 5.6),
);
const VINE_BACK = Array.from({ length: TURNS }, (_, j) =>
  vineSpan(j, Math.PI, TAU, 2.8, 3.4),
)
  .map((r) => r.outline)
  .join("");
const VINE_D = VINE_FRONT.map((r) => r.outline).join("");
const VINE_SHINE = VINE_FRONT.map((r) => r.shine).join("");
/** Where it rounds the outer edge: an emerald like a bud, leaves and a
 *  tendril springing from it. */
const LEAF_ROOTS = Array.from({ length: TURNS }, (_, j) => {
  const th = (TAU * j - PHI0) / TURNS;
  return { th, p: vineAt(th) };
});
const LEAVES = LEAF_ROOTS.flatMap(({ th, p }, j) => {
  const out = th + Math.PI / 2;
  return [
    { x: p[0], y: p[1], a: out - 0.7, len: 16, w: 5.4, k: j * 3 + 1 },
    { x: p[0], y: p[1], a: out + 0.95, len: 12, w: 4.2, k: j * 3 + 2 },
    { x: p[0], y: p[1], a: out + 0.3, len: 23, w: 7.8, k: j * 3 },
  ];
});
/** A tendril curling off each turn, just ahead of the leaves. */
const TENDRILS = LEAF_ROOTS.map(({ th }) => {
  const p = vineAt(th + 0.1);
  return curl(p[0], p[1], th - 0.2, 13, 5.6, 1.6, 0.4);
});
const TENDRIL_D = TENDRILS.map((c) => c.outline).join("");
const EMERALDS = LEAF_ROOTS.map(({ p }) => p);
const LEAF_GREEN = MATERIALS.leaf;
const INK_LEAF = "#14300A";
const VEIN_LEAF = "#2E5A16";
const EMERALD: [string, string, string] = ["#C8FFD8", "#1E9A54", "#06401E"];
const GROVE_RING = circle(59.5) + circle(50.5);

function GroveLeaf({
  t,
  x,
  y,
  a,
  len,
  w,
  k,
}: {
  t: Clock;
  x: number;
  y: number;
  a: number;
  len: number;
  w: number;
  k: number;
}) {
  const sway = useDerivedValue(() => [
    { translateX: x },
    { translateY: y },
    { rotate: a + Math.sin(t.value * 1.3 + k * 0.9) * 0.07 },
  ]);
  const d = LEAF(len, w);
  // side veins off the midrib, leaning to the tip
  const veins = [0.3, 0.5, 0.7]
    .map((s) => {
      const y0 = -len * s;
      return `M0 ${f2(y0)}L${f2(w * 0.55)} ${f2(y0 - len * 0.12)}M0 ${f2(y0)}L${f2(-w * 0.55)} ${f2(y0 - len * 0.12)}`;
    })
    .join("");
  return (
    <Group transform={sway}>
      <Metal
        d={d}
        colors={LEAF_GREEN}
        ink={INK_LEAF}
        width={1}
        from={vec(-w, -len)}
        to={vec(w, 0)}
        vein={`M0 -1L0 ${f2(-len * 0.88)}${veins}`}
        veinColor={VEIN_LEAF}
        shine={`M${f2(-w * 0.45)} ${f2(-len * 0.3)}Q${f2(-w * 0.6)} ${f2(-len * 0.6)} ${f2(-w * 0.15)} ${f2(-len * 0.85)}`}
      />
    </Group>
  );
}

function GroveBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.3 + 0.12 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={90} color="#3AE07A" opacity={glow} />
      {/* the vine where it passes behind the ring */}
      <Path path={VINE_BACK}>
        <LinearGradient
          start={vec(-60, -60)}
          end={vec(60, 60)}
          colors={["#3A6A22", "#1E4A12"]}
        />
      </Path>
      <Path path={VINE_BACK} style="stroke" strokeWidth={1} color={INK_LEAF} />
    </Group>
  );
}

function Emerald({
  t,
  x,
  y,
  k,
}: {
  t: Clock;
  x: number;
  y: number;
  k: number;
}) {
  // a light runs round the vine, one stone after another
  const glow = useDerivedValue(
    () => Math.max(0, Math.cos(t.value * 1.4 - (k * TAU) / TURNS)) ** 6,
  );
  return (
    <Group>
      <Circle cx={x} cy={y} r={8} color="#3AFF8A" opacity={glow}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={x} cy={y} r={4.6}>
        <RadialGradient
          c={vec(x - 1.6, y - 1.6)}
          r={7}
          colors={["#FFFFFF", "#C9D0DA", "#7A8494"]}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={4.6}
        style="stroke"
        strokeWidth={0.9}
        color={INK_STEEL}
      />
      <Gem x={x} y={y} w={6} h={6} colors={EMERALD} />
    </Group>
  );
}

function GroveFront({ t }: { t: Clock }) {
  // the stones in order round the ring, from the top
  const stones = EMERALDS.map((p) => ({
    x: p[0],
    y: p[1],
    order: (Math.atan2(p[1], p[0]) + Math.PI / 2 + TAU) % TAU,
  })).sort((a, b) => a.order - b.order);
  return (
    <Group>
      <Metal
        d={GROVE_RING}
        evenOdd
        colors={SILVER}
        ink={INK_STEEL}
        vein={circle(57.4) + circle(52.6)}
        veinColor={VEIN_STEEL}
        shine={arc(58.4, -170, -110)}
      />
      <Sweep t={t} d={GROVE_RING} evenOdd every={4.6} />
      <Metal
        d={TENDRIL_D}
        colors={["#B8E07A", "#4A8A2A", "#1E4A12"]}
        ink={INK_LEAF}
        width={0.8}
      />
      {LEAVES.map((l, i) => (
        <GroveLeaf key={i} t={t} {...l} />
      ))}
      {/* the vine over the ring's face */}
      <Metal
        d={VINE_D}
        colors={["#B8E07A", "#4A8A2A", "#1E4A12", "#7AB04A"]}
        ink={INK_LEAF}
        width={1}
        shine={VINE_SHINE}
      />
      {stones.map((s, k) => (
        <Emerald key={k} t={t} x={s.x} y={s.y} k={k} />
      ))}
      <Glint
        t={t}
        x={stones[0].x - 1}
        y={stones[0].y - 1}
        size={5}
        phase={0.6}
      />
      <Glint
        t={t}
        x={stones[2].x - 1}
        y={stones[2].y - 1}
        size={4}
        phase={2.5}
      />
      <Glint
        t={t}
        x={stones[4].x - 1}
        y={stones[4].y - 1}
        size={4}
        phase={4.1}
      />
    </Group>
  );
}

// ── Moonpool ─────────────────────────────────────────────────────────

const RIPPLES = 3;
const RIPPLE_EVERY = 5.2;

function Ripple({ t, k }: { t: Clock; k: number }) {
  const p = useDerivedValue(() => (t.value / RIPPLE_EVERY + k / RIPPLES) % 1);
  const r = useDerivedValue(() => 63 + p.value * 27);
  const trough = useDerivedValue(() => 63 + p.value * 27 - 2.2);
  const fade = useDerivedValue(() => {
    const q = p.value;
    return Math.min(1, q * 6) * (1 - q) ** 1.4;
  });
  return (
    <Group opacity={fade}>
      <Circle
        cx={0}
        cy={0}
        r={trough}
        style="stroke"
        strokeWidth={1.8}
        color="#060C20"
        opacity={0.7}
      />
      <Circle
        cx={0}
        cy={0}
        r={r}
        style="stroke"
        strokeWidth={1.3}
        color="#BCD4F4"
      />
    </Group>
  );
}

/** Where the moonlight catches the water. */
const WATER_GLINTS = [
  { x: 68, y: -18, size: 4.5, phase: 0.2 },
  { x: -74, y: 14, size: 4, phase: 1.7 },
  { x: 26, y: 74, size: 3.5, phase: 3.1 },
  { x: -42, y: -66, size: 4, phase: 4.4 },
  { x: -50, y: 58, size: 3, phase: 5.3 },
];

function MoonBack({ t }: { t: Clock }) {
  return (
    <Group>
      {/* the night water, fading out at its edge */}
      <Circle cx={0} cy={0} r={90}>
        <RadialGradient
          c={vec(0, 0)}
          r={90}
          colors={["#1E3466", "#14244A", "#0A1634D0", "#0A163400"]}
          positions={[0.55, 0.74, 0.9, 1]}
        />
      </Circle>
      {/* the moon's light lying on it */}
      <Circle cx={38} cy={-40} r={30}>
        <RadialGradient
          c={vec(38, -40)}
          r={30}
          colors={["#9AB8E860", "#9AB8E800"]}
        />
      </Circle>
      {Array.from({ length: RIPPLES }, (_, k) => (
        <Ripple key={k} t={t} k={k} />
      ))}
      {WATER_GLINTS.map((g, k) => (
        <Glint key={k} t={t} {...g} speed={0.9} />
      ))}
    </Group>
  );
}

/** Two silver bands with a string of pearls laid in the channel
 *  between them, broken at the foot by a moonstone. */
const MOON_INNER = circle(53.6) + circle(50.5);
const MOON_OUTER = circle(62) + circle(57.6);
const MOON_RING = MOON_INNER + MOON_OUTER;
const PEARL_R = 55.6;
const PEARLS = Array.from(
  { length: 40 },
  (_, k) => (k / 40) * TAU - Math.PI / 2,
)
  .filter((a) => Math.abs(a - Math.PI / 2) > 0.2)
  .map((a) => polar(a, PEARL_R));

/** A crescent: a circle of radius R with one of radius r, d along x,
 *  bitten out of it; its horns point toward +x. */
function crescent(R: number, r: number, d: number) {
  const x = (R * R - r * r + d * d) / (2 * d);
  const y = Math.sqrt(R * R - x * x);
  const inner = x > d ? 1 : 0;
  return `M${f2(x)} ${f2(y)}A${R} ${R} 0 1 1 ${f2(x)} ${f2(-y)}A${r} ${r} 0 ${inner} 0 ${f2(x)} ${f2(y)}Z`;
}
const MOON = crescent(13, 10.8, 6.2);
const MOON_AT = polar(-46 * DEG, 73);

function Pearl({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient
          c={vec(x - r * 0.35, y - r * 0.4)}
          r={r * 1.5}
          colors={["#FFFFFF", "#ECE6F2", "#8A94B4"]}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={r}
        style="stroke"
        strokeWidth={0.6}
        color={INK_STEEL}
      />
    </Group>
  );
}

const MOONSTONE: [string, string, string] = ["#FFFFFF", "#A8C8F0", "#2A4A8A"];

function MoonFront({ t }: { t: Clock }) {
  const moonGlow = useDerivedValue(() => 0.45 + 0.2 * Math.sin(t.value * 0.9));
  const stone = useDerivedValue(() => 0.35 + 0.35 * Math.sin(t.value * 0.9));
  return (
    <Group>
      {/* the channel the pearls lie in */}
      <Circle
        cx={0}
        cy={0}
        r={PEARL_R}
        style="stroke"
        strokeWidth={4.4}
        color="#0E1A3A"
      />
      <Metal
        d={MOON_RING}
        evenOdd
        colors={SILVER}
        ink={INK_STEEL}
        width={1.2}
        vein={circle(59.8)}
        veinColor={VEIN_STEEL}
        shine={arc(60.9, -168, -112)}
      />
      <Sweep t={t} d={MOON_RING} evenOdd every={4.8} />
      {PEARLS.map((p, k) => (
        <Pearl key={k} x={p.x} y={p.y} r={2.35} />
      ))}
      {/* the moonstone at the foot, glowing like the moon */}
      <Circle cx={0} cy={PEARL_R} r={9} color="#9AC0FF" opacity={stone}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={0} cy={PEARL_R} r={6.4}>
        <RadialGradient
          c={vec(-2.4, PEARL_R - 2.4)}
          r={10}
          colors={["#FFFFFF", "#C9D0DA", "#7A8494"]}
        />
      </Circle>
      <Circle
        cx={0}
        cy={PEARL_R}
        r={6.4}
        style="stroke"
        strokeWidth={1}
        color={INK_STEEL}
      />
      <Gem x={0} y={PEARL_R} w={8} h={8.6} colors={MOONSTONE} />
      {/* the crescent moon over the water */}
      <Group
        transform={[
          { translateX: MOON_AT.x },
          { translateY: MOON_AT.y },
          { rotate: -64 * DEG },
        ]}
      >
        <Path path={MOON} color="#DCE8FF" opacity={moonGlow}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Metal
          d={MOON}
          colors={["#FFFFFF", "#E8EEF8", "#A8B4CC"]}
          from={vec(-13, -13)}
          to={vec(9, 13)}
          ink={INK_STEEL}
          width={1.1}
          shine="M-11.4 3.6A11.8 11.8 0 0 1 -5 -10.4"
        />
      </Group>
      <Glint t={t} x={MOON_AT.x - 4} y={MOON_AT.y - 6} size={5} phase={1.1} />
      <Glint t={t} x={-1} y={PEARL_R - 1.5} size={5} phase={2.9} />
      <Glint t={t} x={PEARLS[30].x} y={PEARLS[30].y} size={4} phase={4.6} />
    </Group>
  );
}

export const RADIANT_ART = {
  sunburst: { back: SunBack, front: SunFront } satisfies ArtBorderDrawing,
  "emerald-grove": {
    back: GroveBack,
    front: GroveFront,
  } satisfies ArtBorderDrawing,
  moonpool: { back: MoonBack, front: MoonFront } satisfies ArtBorderDrawing,
};

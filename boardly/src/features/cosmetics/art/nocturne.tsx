// Ghost Lantern and Galaxy, redrawn as engraved art.
// - Ghost Lantern: a ring of twisted wrought iron in a faint violet mist.
//   Two iron lanterns hang from scrolled brackets at its shoulders and a
//   third from its foot: caged glass, a candle burning in each, swaying
//   on their hooks and throwing a warm light. Pale sheet-ghosts (eye
//   holes, nothing more) drift round between them, fading in and out.
// - Galaxy: the turning nebula and its rim, as loved, now inside a thin
//   brass astrolabe ring (degree ticks, silver star marks, a pointer
//   sliding round). Three engraved planets orbit, lit from the picture
//   (their dark sides face away from it), one ringed. Constellations
//   draw themselves in the corners and fade; now and then a star falls.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  FillType,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { curl } from "@/components/engraved/shapes";
import { Gem, Sweep } from "./crowns";
import {
  Flicker,
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { AURA_CLOUD, Fx, NEBULA_RIM, aura } from "./rimfx";

const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(2);
/** A point at angle `a`, radius `r`, as path text. */
const at = (a: number, r: number) => {
  const p = polar(a, r);
  return `${f(p.x)} ${f(p.y)}`;
};
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (cx: number, cy: number, r: number, hole = false) => {
  const s = hole ? 0 : 1;
  return `M${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx + r)} ${f(cy)}Z`;
};
/** A band round the origin from `rIn` to `rOut`. */
const ring = (rOut: number, rIn: number) =>
  disc(0, 0, rOut) + disc(0, 0, rIn, true);
/** An arc as an open path, from angle a0 to a1 (degrees). */
const arc = (r: number, a0: number, a1: number) =>
  `M${at(a0 * DEG, r)}A${r} ${r} 0 0 1 ${at(a1 * DEG, r)}`;

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
  colors: string[];
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
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={colors} />
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

// ── Ghost Lantern ────────────────────────────────────────────────────

/** Wrought iron gone cold in the night: a touch of violet in the shade. */
const IRON = ["#8E8AA0", "#3E3C4E", "#14121C", "#5C5A70"];
const INK_IRON = "#0C0A12";
const VEIN_IRON = "#2C2A3A";
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const INK_IVORY = "#3A2408";

const IRON_RING = ring(56.6, 49.5);
/** The twist of the bar: slanting cuts all the way round, a glint of
 *  light on each strand between them. */
const TWISTS = 52;
const TWIST = Array.from({ length: TWISTS }, (_, k) => {
  const a = (k / TWISTS) * TAU;
  return `M${at(a, 49.6)}L${at(a + 5.6 * DEG, 56.5)}`;
}).join("");
const STRANDS = Array.from({ length: TWISTS }, (_, k) => {
  const a = ((k + 0.5) / TWISTS) * TAU;
  return `M${at(a - 1.2 * DEG, 51.4)}L${at(a + 1.6 * DEG, 54.6)}`;
}).join("");
/** A scroll each side of the top, a ring between them: the hanger. */
const FINIAL = curl(2, -57, -1.35, 20, 4.4, 3.2, 0.55);
const HANGER = disc(0, -66.4, 3.8) + disc(0, -66.4, 2, true);

/** The right bracket: a bar out from the ring's shoulder ending in a
 *  scroll, a smaller scroll bracing it from below. Mirrored for the left. */
const ARM_FROM = polar(-38 * DEG, 54);
const ARM_TO = { x: 74, y: -46 };
const ARM = (() => {
  const dx = ARM_TO.x - ARM_FROM.x;
  const dy = ARM_TO.y - ARM_FROM.y;
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  const w0 = 2.4;
  const w1 = 1.6;
  const p = (x: number, y: number) => `${f(x)} ${f(y)}`;
  return `M${p(ARM_FROM.x + nx * w0, ARM_FROM.y + ny * w0)}L${p(ARM_TO.x + nx * w1, ARM_TO.y + ny * w1)}L${p(ARM_TO.x - nx * w1, ARM_TO.y - ny * w1)}L${p(ARM_FROM.x - nx * w0, ARM_FROM.y - ny * w0)}Z`;
})();
const ARM_SCROLL = curl(73.4, -45.6, -0.75, 15, -4.6, 3, 0.55);
const BRACE = curl(55, -17, -0.6, 20, -3.8, 2.8, 0.6);
/** Where the right lantern hangs from the bar. */
const HOOK = { x: 68, y: -43.4 };
/** The foot of the ring, where the third lantern hangs. */
const FOOT = { x: 0, y: 57.4 };
/** Collars where the iron is joined. */
const collar = (a: number) =>
  `M${at(a - 3.4 * DEG, 48.4)}L${at(a - 3.4 * DEG, 58.2)}A58.2 58.2 0 0 1 ${at(a + 3.4 * DEG, 58.2)}L${at(a + 3.4 * DEG, 48.4)}A48.4 48.4 0 0 0 ${at(a - 3.4 * DEG, 48.4)}Z`;
const COLLARS = [-38, -142, 90, -90].map((a) => collar(a * DEG));

/** The lantern, hanging from its hook at the origin: a loop, a roof,
 *  a cage of glass with a candle in it, a base and a finial. */
const LOOP = disc(0, 1.8, 2.2) + disc(0, 1.8, 1, true);
const ROOF = "M-7.6 9.2L-2.2 4.4Q0 3 2.2 4.4L7.6 9.2Z";
const BRIM_TOP = "M-8.8 8.8H8.8L8.4 11.4H-8.4Z";
const GLASS = "M-6.6 11.4H6.6L6 24H-6Z";
const POSTS =
  "M-7.6 11.4H-5.4L-5 24H-7ZM7.6 11.4H5.4L5 24H7Z" +
  // a fine grille over the glass, clear of the flame
  "M-3.1 11.4H-2.3L-2.2 24H-3ZM3.1 11.4H2.3L2.2 24H3Z";
const BRIM_FOOT = "M-8.2 24H8.2L8.6 26.6H-8.6Z";
const BASE = "M-5.6 26.6H5.6L2.4 29.6H-2.4Z";
const CANDLE = "M-1.5 18.6H1.5V23.8H-1.5Z";

function Lantern({
  t,
  x,
  y,
  scale,
  i,
}: {
  t: Clock;
  x: number;
  y: number;
  scale: number;
  i: number;
}) {
  const sway = useDerivedValue(() => [
    { translateX: x },
    { translateY: y },
    { scale },
    {
      rotate:
        Math.sin(t.value * 1.1 + i * 2.3) * 0.07 +
        Math.sin(t.value * 2.3 + i) * 0.015,
    },
  ]);
  const light = useDerivedValue(
    () =>
      0.78 +
      0.22 * Math.sin(t.value * 8.3 + i * 2) * Math.sin(t.value * 3.1 + i),
  );
  const glow = useDerivedValue(() => 0.5 + light.value * 0.38);
  return (
    <Group transform={sway}>
      {/* the warm light it throws */}
      <Circle cx={0} cy={18} r={16} color="#FFA442" opacity={glow}>
        <BlurMask blur={9} style="normal" />
      </Circle>
      <Metal
        d={LOOP}
        evenOdd
        colors={IRON}
        ink={INK_IRON}
        width={0.8}
        from={vec(-3, 0)}
        to={vec(3, 4)}
      />
      {/* the glass, lit from within */}
      <Path path={GLASS} color="#3A1A0A" />
      <Path path={GLASS} opacity={light}>
        <RadialGradient
          c={vec(0, 18)}
          r={9}
          colors={["#FFF4C8", "#FFC062", "#C8641C"]}
        />
      </Path>
      <Metal
        d={CANDLE}
        colors={IVORY}
        ink={INK_IVORY}
        width={0.6}
        from={vec(-1.5, 0)}
        to={vec(1.5, 0)}
      />
      <Flicker t={t} x={0} y={18.8} size={5.6} phase={i * 1.7} />
      <Path
        path="M-4.4 13L-4.1 21.6"
        style="stroke"
        strokeWidth={0.8}
        strokeCap="round"
        color="#FFFFFF"
        opacity={0.55}
      />
      <Metal
        d={POSTS}
        colors={IRON}
        ink={INK_IRON}
        width={0.7}
        from={vec(-8, 10)}
        to={vec(8, 26)}
      />
      <Metal
        d={ROOF}
        colors={IRON}
        ink={INK_IRON}
        width={0.9}
        vein="M0 4.6V9"
        veinColor={VEIN_IRON}
        shine="M-5.6 8.2L-2 5"
        from={vec(-8, 3)}
        to={vec(8, 10)}
      />
      <Metal
        d={BRIM_TOP}
        colors={IRON}
        ink={INK_IRON}
        width={0.9}
        from={vec(-9, 8)}
        to={vec(9, 12)}
      />
      <Metal
        d={BRIM_FOOT}
        colors={IRON}
        ink={INK_IRON}
        width={0.9}
        from={vec(-9, 24)}
        to={vec(9, 27)}
      />
      <Metal
        d={BASE}
        colors={IRON}
        ink={INK_IRON}
        width={0.9}
        from={vec(-6, 26)}
        to={vec(6, 30)}
      />
      <Circle cx={0} cy={30.8} r={1.4} color="#4A4858" />
      <Circle
        cx={0}
        cy={30.8}
        r={1.4}
        style="stroke"
        strokeWidth={0.6}
        color={INK_IRON}
      />
    </Group>
  );
}

/** A sheet thrown over nobody: a rounded head, the cloth falling to a
 *  ragged hem. */
const SHEET =
  "M-7 -3C-7 -12.2 7 -12.2 7 -3C7 2 8.2 5.2 9.6 8.8Q7.2 7.4 5.6 10Q3.6 7.6 1.6 10.4Q-0.4 7.8 -2.4 10.2Q-4.4 7.6 -6.4 9.8Q-8 7.6 -9.6 8.6C-8.2 5 -7 2 -7 -3Z";
const FOLDS = "M-3.2 2.4Q-3.6 6 -4.6 9M3 3Q3.6 6.4 4.4 9.4M0.2 4Q0.4 7 0.6 9.6";

function Ghost({ t, i }: { t: Clock; i: number }) {
  const base = [-90, 150, 30][i] * DEG;
  const transform = useDerivedValue(() => {
    const a = base + t.value * 0.09;
    const p = polar(a, 75 + Math.sin(t.value * 0.8 + i * 2) * 2.5);
    return [
      { translateX: p.x },
      { translateY: p.y + Math.sin(t.value * 1.6 + i) * 2 },
      { rotate: Math.sin(t.value * 1.2 + i * 3) * 0.12 },
      { scaleX: 1.12 + Math.sin(t.value * 2.4 + i) * 0.04 },
      { scaleY: 1.12 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const s = 0.5 + 0.5 * Math.sin(t.value * 0.55 + i * 2.1);
    return 0.12 + 0.8 * s * s;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={SHEET} color="#E8E0FF" opacity={0.55}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Metal
        d={SHEET}
        colors={["#FFFFFF", "#F0ECFA", "#BCB4D6"]}
        ink="#2A2440"
        width={0.9}
        vein={FOLDS}
        veinColor="#9890B4"
        shine="M-5.4 -5Q-5 -8.4 -2 -9.6"
        from={vec(-6, -10)}
        to={vec(6, 10)}
      />
      <Oval x={-3.8} y={-5.4} width={2.4} height={3.4} color="#1E1A2E" />
      <Oval x={1.4} y={-5.4} width={2.4} height={3.4} color="#1E1A2E" />
    </Group>
  );
}

const MIST = aura("#3A2C6A", "#7A62C8", "#D4C8FF", 0.35, 0.75);

function Bracket() {
  return (
    <Group>
      <Metal
        d={BRACE.outline}
        colors={IRON}
        ink={INK_IRON}
        width={1}
        vein={BRACE.vein}
        veinColor={VEIN_IRON}
      />
      <Metal
        d={ARM}
        colors={IRON}
        ink={INK_IRON}
        width={1}
        shine={`M${f(ARM_FROM.x + 4)} ${f(ARM_FROM.y - 2.6)}L${f(ARM_TO.x - 8)} ${f(ARM_TO.y + 1.4)}`}
      />
      <Metal
        d={ARM_SCROLL.outline}
        colors={IRON}
        ink={INK_IRON}
        width={1}
        vein={ARM_SCROLL.vein}
        veinColor={VEIN_IRON}
      />
    </Group>
  );
}

function Finial() {
  return (
    <Metal
      d={FINIAL.outline}
      colors={IRON}
      ink={INK_IRON}
      width={1}
      vein={FINIAL.vein}
      veinColor={VEIN_IRON}
    />
  );
}

function GhostBack({ t }: { t: Clock }) {
  const haze = useDerivedValue(() => 0.42 + 0.08 * Math.sin(t.value * 0.7));
  return (
    <Group>
      <Halo r={90} color="#7A5AD8" opacity={0.42} />
      <Group opacity={haze}>
        <Fx sksl={AURA_CLOUD} t={t} values={MIST} />
      </Group>
      {[0, 1, 2].map((i) => (
        <Ghost key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

function GhostFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Bracket />
      <Group transform={[{ scaleX: -1 }]}>
        <Bracket />
      </Group>
      <Metal
        d={HANGER}
        evenOdd
        colors={IRON}
        ink={INK_IRON}
        width={1}
        from={vec(-4, -70)}
        to={vec(4, -62)}
      />
      <Finial />
      <Group transform={[{ scaleX: -1 }]}>
        <Finial />
      </Group>
      <Metal
        d={IRON_RING}
        evenOdd
        colors={IRON}
        ink={INK_IRON}
        shine={arc(55.4, -160, -112)}
      />
      <Path
        path={STRANDS}
        style="stroke"
        strokeWidth={1}
        strokeCap="round"
        color="#C8C4DA"
        opacity={0.45}
      />
      <Path path={TWIST} style="stroke" strokeWidth={1} color={INK_IRON} />
      {/* the lanterns' light lying on the iron */}
      <Group blendMode="screen" opacity={0.5}>
        {[
          { x: HOOK.x, y: HOOK.y + 14 },
          { x: -HOOK.x, y: HOOK.y + 14 },
          { x: 0, y: FOOT.y + 12 },
        ].map((p, k) => (
          <Circle key={k} cx={p.x} cy={p.y} r={26}>
            <RadialGradient
              c={vec(p.x, p.y)}
              r={26}
              colors={["#FF9A3A", "#FF9A3A00"]}
            />
          </Circle>
        ))}
      </Group>
      {COLLARS.map((d, k) => (
        <Metal
          key={k}
          d={d}
          colors={IRON}
          ink={INK_IRON}
          width={0.9}
          vein={d}
          veinColor={VEIN_IRON}
        />
      ))}
      <Group opacity={0.4}>
        <Sweep t={t} d={IRON_RING} evenOdd every={5.6} />
      </Group>
      <Lantern t={t} x={HOOK.x} y={HOOK.y} scale={0.86} i={0} />
      <Lantern t={t} x={-HOOK.x} y={HOOK.y} scale={0.86} i={1} />
      <Lantern t={t} x={FOOT.x} y={FOOT.y} scale={0.9} i={2} />
    </Group>
  );
}

// ── Galaxy ───────────────────────────────────────────────────────────

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_STEEL = "#1E242C";

function Star({ t, i }: { t: Clock; i: number }) {
  const p = polar(rnd(i) * TAU, 58 + rnd(i + 1) * 32);
  const opacity = useDerivedValue(
    () => 0.3 + 0.7 * Math.max(0, Math.sin(t.value * (1 + rnd(i + 2) * 2) + i)),
  );
  return (
    <Circle
      cx={p.x}
      cy={p.y}
      r={0.6 + rnd(i + 3) * 1.1}
      color="#FFFFFF"
      opacity={opacity}
    />
  );
}

/** The nebula, turning: as it was. */
function GalaxyBack({ t }: { t: Clock }) {
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.18 }]);
  const turnBack = useDerivedValue(() => [{ rotate: -t.value * 0.11 }]);
  return (
    <Group>
      <Group transform={turn} origin={vec(0, 0)}>
        {/* kept, blur and all, inside the canvas: no square edge */}
        <Circle
          cx={0}
          cy={0}
          r={70}
          style="stroke"
          strokeWidth={26}
          opacity={0.85}
        >
          <SweepGradient
            c={vec(0, 0)}
            colors={[
              "#2B1B6B",
              "#7B3FD1",
              "#E05FB8",
              "#3B7BEA",
              "#1B1450",
              "#9B4FE0",
              "#2B1B6B",
            ]}
          />
          <BlurMask blur={9} style="normal" />
        </Circle>
      </Group>
      <Group transform={turnBack} origin={vec(0, 0)} blendMode="screen">
        <Circle
          cx={0}
          cy={0}
          r={66}
          style="stroke"
          strokeWidth={10}
          opacity={0.5}
        >
          <SweepGradient
            c={vec(0, 0)}
            colors={[
              "#00000000",
              "#B8E1FF",
              "#00000000",
              "#FFC2F0",
              "#00000000",
            ]}
          />
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Group>
      {Array.from({ length: 26 }, (_, i) => (
        <Star key={i} t={t} i={i} />
      ))}
      {CONSTELLATIONS.map((c, k) => (
        <Constellation key={k} t={t} stars={c} phase={k * 3.6} />
      ))}
      <ShootingStar t={t} />
    </Group>
  );
}

/** Constellations in the corners, clear of the planets' paths. */
const CONSTELLATIONS: [number, number][][] = [
  [
    [-90, -62],
    [-82, -76],
    [-70, -70],
    [-62, -84],
    [-48, -82],
  ],
  [
    [52, 88],
    [64, 82],
    [76, 84],
    [86, 72],
    [80, 60],
  ],
  [
    [-88, 50],
    [-80, 64],
    [-88, 76],
    [-72, 82],
  ],
];
const STARS_EVERY = 10.8;

function Constellation({
  t,
  stars,
  phase,
}: {
  t: Clock;
  stars: [number, number][];
  phase: number;
}) {
  const d = useMemo(
    () => `M${stars.map(([x, y]) => `${x} ${y}`).join("L")}`,
    [stars],
  );
  // drawn star to star, held, then faded
  const drawn = useDerivedValue(() => {
    const u = (t.value + phase) % STARS_EVERY;
    const p = Math.min(1, u / 2.6);
    return 1 - (1 - p) * (1 - p);
  });
  const shown = useDerivedValue(() => {
    const u = (t.value + phase) % STARS_EVERY;
    if (u < 5.4) return 1;
    return Math.max(0, 1 - (u - 5.4) / 1.6);
  });
  const lit = useDerivedValue(() => 0.45 + 0.55 * shown.value);
  const line = useDerivedValue(() => shown.value * 0.7);
  return (
    <Group>
      <Path
        path={d}
        style="stroke"
        strokeWidth={0.7}
        strokeCap="round"
        strokeJoin="round"
        color="#CFE4FF"
        start={0}
        end={drawn}
        opacity={line}
      />
      <Group opacity={lit}>
        {stars.map(([x, y], k) => (
          <Group key={k}>
            <Circle cx={x} cy={y} r={2.6} color="#B8D8FF" opacity={0.45}>
              <BlurMask blur={2} style="normal" />
            </Circle>
            <Circle cx={x} cy={y} r={k === 0 ? 1.5 : 1.1} color="#FFFFFF" />
          </Group>
        ))}
      </Group>
    </Group>
  );
}

/** Now and then a star falls across the top right corner. */
function ShootingStar({ t }: { t: Clock }) {
  const from = { x: 22, y: -92 };
  const to = { x: 92, y: -30 };
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const every = 7.4;
  const run = 0.9;
  const transform = useDerivedValue(() => {
    const u = ((t.value + 3) % every) / run;
    const p = Math.min(1, u);
    return [
      { translateX: from.x + (to.x - from.x) * p },
      { translateY: from.y + (to.y - from.y) * p },
      { rotate: angle },
    ];
  });
  const opacity = useDerivedValue(() => {
    const u = ((t.value + 3) % every) / run;
    return u > 1 ? 0 : Math.sin(u * Math.PI);
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path
        path="M-22 0L0 0"
        style="stroke"
        strokeWidth={1.4}
        strokeCap="round"
      >
        <LinearGradient
          start={vec(-22, 0)}
          end={vec(0, 0)}
          colors={["#FFFFFF00", "#CFE4FF", "#FFFFFF"]}
        />
      </Path>
      <Circle cx={0} cy={0} r={3} color="#CFE4FF" opacity={0.6}>
        <BlurMask blur={2.4} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={1.3} color="#FFFFFF" />
    </Group>
  );
}

/** The astrolabe: a thin brass ring graduated in degrees, a silver star
 *  set every thirty, a pointer sliding round it. */
const ASTRO = ring(70.6, 65.6);
const TICKS = Array.from({ length: 72 }, (_, k) => {
  const a = k * 5 * DEG;
  return `M${at(a, 65.6)}L${at(a, k % 6 === 0 ? 69 : 67.4)}`;
}).join("");
const ASTRO_GROOVE = disc(0, 0, 69.6);
const STAR_MARKS = Array.from({ length: 12 }, (_, k) =>
  polar((k * 30 + 15) * DEG, 68.4),
);
/** A four-pointed star, `s` across. */
const sparkle = (x: number, y: number, s: number) => {
  const w = s * 0.22;
  return `M${f(x)} ${f(y - s)}Q${f(x + w)} ${f(y - w)} ${f(x + s)} ${f(y)}Q${f(x + w)} ${f(y + w)} ${f(x)} ${f(y + s)}Q${f(x - w)} ${f(y + w)} ${f(x - s)} ${f(y)}Q${f(x - w)} ${f(y - w)} ${f(x)} ${f(y - s)}Z`;
};
const STAR_INLAYS = STAR_MARKS.map((p) => sparkle(p.x, p.y, 1.5)).join("");
/** The pointer, at angle 0: its tip reaching in over the rim. */
const POINTER = "M60.4 0L65.6 -2.4L74.6 -1.8Q77.4 0 74.6 1.8L65.6 2.4Z";

function Pointer({ t }: { t: Clock }) {
  const turn = useDerivedValue(() => [
    { rotate: -Math.PI / 2 + t.value * 0.13 + Math.sin(t.value * 0.4) * 0.3 },
  ]);
  return (
    <Group transform={turn}>
      <Metal
        d={POINTER}
        colors={GOLD}
        ink={INK_GOLD}
        width={0.9}
        vein="M64 0H72.6"
        veinColor={VEIN_GOLD}
        from={vec(60, -3)}
        to={vec(76, 3)}
      />
      <Gem
        x={73.4}
        y={0}
        w={3}
        h={3}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
    </Group>
  );
}

function Planet({
  t,
  r,
  speed,
  size,
  colors,
  ink,
  bands,
  ring: ringed,
  phase,
}: {
  t: Clock;
  r: number;
  speed: number;
  size: number;
  colors: string[];
  ink: string;
  bands?: string;
  ring?: boolean;
  phase: number;
}) {
  const body = useMemo(() => disc(0, 0, size), [size]);
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(body), [body]);
  const move = useDerivedValue(() => {
    const p = polar(t.value * speed + phase, r);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
  // the night side faces away from the picture
  const night = useDerivedValue(() => {
    const p = polar(t.value * speed + phase, size * 0.95);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
  const tilt = -0.32;
  const rx = size * 1.95;
  const ry = size * 0.55;
  const band = (
    <Oval
      x={-rx}
      y={-ry}
      width={rx * 2}
      height={ry * 2}
      style="stroke"
      strokeWidth={size * 0.32}
    >
      <LinearGradient
        start={vec(-rx, 0)}
        end={vec(rx, 0)}
        colors={["#8A6A3A", "#FFE8B8", "#C89A58", "#6A4A22"]}
      />
    </Oval>
  );
  const bandInk = (
    <Group>
      <Oval
        x={-rx - size * 0.16}
        y={-ry - size * 0.16}
        width={(rx + size * 0.16) * 2}
        height={(ry + size * 0.16) * 2}
        style="stroke"
        strokeWidth={0.6}
        color={INK_GOLD}
      />
      <Oval
        x={-rx + size * 0.16}
        y={-ry + size * 0.16}
        width={(rx - size * 0.16) * 2}
        height={(ry - size * 0.16) * 2}
        style="stroke"
        strokeWidth={0.6}
        color={INK_GOLD}
      />
    </Group>
  );
  return (
    <Group transform={move}>
      <Circle cx={0} cy={0} r={size * 1.8} color={colors[1]} opacity={0.25}>
        <BlurMask blur={size * 0.8} style="normal" />
      </Circle>
      {ringed ? (
        <Group transform={[{ rotate: tilt }]}>
          {band}
          {bandInk}
        </Group>
      ) : null}
      <Path path={body}>
        <LinearGradient
          start={vec(-size, -size)}
          end={vec(size, size)}
          colors={colors}
        />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {bands ? (
            <Path
              path={bands}
              style="stroke"
              strokeWidth={0.7}
              color={ink}
              opacity={0.45}
              transform={[{ rotate: tilt }]}
            />
          ) : null}
          <Group transform={night}>
            <Circle cx={0} cy={0} r={size * 1.1} color="#0A0C24" opacity={0.72}>
              <BlurMask blur={size * 0.18} style="normal" />
            </Circle>
          </Group>
          <Path
            path={`M${f(-size * 0.75)} ${f(-size * 0.1)}A${size * 0.78} ${size * 0.78} 0 0 1 ${f(-size * 0.1)} ${f(-size * 0.75)}`}
            style="stroke"
            strokeWidth={0.8}
            strokeCap="round"
            color="#FFFFFF"
            opacity={0.75}
          />
        </Group>
      ) : null}
      <Path path={body} style="stroke" strokeWidth={0.8} color={ink} />
      {ringed ? (
        // the near half of the ring, over the planet
        <Group transform={[{ rotate: tilt }]}>
          <Group clip={{ x: -rx - 3, y: 0, width: rx * 2 + 6, height: ry + 3 }}>
            {band}
            {bandInk}
          </Group>
        </Group>
      ) : null}
    </Group>
  );
}

const GAS_BANDS = "M-8 -2.4H8M-8 0.6H8M-8 3H8";

function GalaxyFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Fx sksl={NEBULA_RIM} t={t} extent={68} />
      <Metal
        d={ASTRO}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        width={0.9}
        vein={TICKS + ASTRO_GROOVE}
        veinColor={VEIN_GOLD}
        shine={arc(68.2, -162, -118)}
      />
      <Path path={STAR_INLAYS} color="#EEF2FA" />
      <Path
        path={STAR_INLAYS}
        style="stroke"
        strokeWidth={0.4}
        color={INK_STEEL}
      />
      <Group opacity={0.8}>
        <Sweep t={t} d={ASTRO} evenOdd every={5.2} />
      </Group>
      <Pointer t={t} />
      <Planet
        t={t}
        r={80}
        speed={0.2}
        size={5.6}
        colors={["#FFF0C8", "#E8A85A", "#9A5A22"]}
        ink="#3A1A06"
        bands={GAS_BANDS}
        ring
        phase={-2.2}
      />
      <Planet
        t={t}
        r={77}
        speed={-0.3}
        size={4.2}
        colors={["#E0F6FF", "#4A9AE0", "#16407A"]}
        ink="#0A1A3A"
        phase={0.4}
      />
      <Planet
        t={t}
        r={84}
        speed={0.42}
        size={3}
        colors={["#FFE0D6", "#D8705A", "#6A2018"]}
        ink="#3A0A06"
        phase={2.6}
      />
      <Glint
        t={t}
        x={STAR_MARKS[7].x}
        y={STAR_MARKS[7].y}
        size={4.5}
        phase={0.5}
      />
      <Glint
        t={t}
        x={STAR_MARKS[1].x}
        y={STAR_MARKS[1].y}
        size={4}
        phase={2.4}
      />
    </Group>
  );
}

export const NOCTURNE_ART: Record<string, ArtBorderDrawing> = {
  "ghost-lantern": { back: GhostBack, front: GhostFront },
  galaxy: { back: GalaxyBack, front: GalaxyFront },
};

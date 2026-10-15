// Stained Glass, Brazier and Snowflake: engraved art borders, replacing
// the old flat glows of the same ids.
// - Stained Glass: a rose window. Twelve leaded panes of pink, cyan and
//   violet glass, a petal in each, between two gold rims, with small
//   round foils outside; light turns slowly through the glass.
// - Brazier: a ring of wrought iron, banded and riveted, its cracks
//   glowing with heat; coals nestle on top and sparks drift up.
// - Snowflake: a silver ring with six crystal arms and six small ones,
//   engraved filigree tipped with ice; frost twinkles and a cold glint
//   runs round the ring.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { curl } from "@/components/engraved/shapes";
import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

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
/** A band round the origin from `rIn` to `rOut` (fills as a ring under
 *  either fill rule). */
const ring = (rOut: number, rIn: number) =>
  disc(0, 0, rOut) + disc(0, 0, rIn, true);
/** A slice of a ring, between angles a0 and a1. */
const sector = (a0: number, a1: number, r0: number, r1: number) =>
  `M${at(a0, r0)}L${at(a0, r1)}A${r1} ${r1} 0 0 1 ${at(a1, r1)}L${at(a1, r0)}A${r0} ${r0} 0 0 0 ${at(a0, r0)}Z`;

/** An engraved piece: filled with its metal, its veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink,
  vein,
  veinColor,
  shine,
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
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);
  return (
    <Group>
      <Path path={d}>
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
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        color={ink}
      />
    </Group>
  );
}

/** A domed stud. */
function Stud({
  x,
  y,
  r,
  colors,
  ink,
}: {
  x: number;
  y: number;
  r: number;
  colors: string[];
  ink: string;
}) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient
          c={vec(x - r * 0.4, y - r * 0.4)}
          r={r * 1.6}
          colors={colors}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={r}
        style="stroke"
        strokeWidth={0.8}
        color={ink}
      />
    </Group>
  );
}

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const GOLD_STUD = ["#FFF8D8", "#E2B04A", "#6A4410"];

// ── Stained Glass ────────────────────────────────────────────────────

/** Glass: its lit heart, its body, its edge. */
const GLASS = [
  ["#FFE0F2", "#FF5AB8", "#8A1260"], // rose
  ["#E0FFFF", "#30D4E8", "#0A5A80"], // cyan
  ["#EEDDFF", "#9A62F2", "#341480"], // violet
];
const LEAD = "#1A1222";
const PANE_N = 12;
const PANE_IN = 54;
const PANE_OUT = 72.5;
/** Each pane holds a petal of another colour, pointing out. */
const PETAL_BASE = 55.4;
const PETAL_LEN = 16;
const PETAL = (() => {
  // narrow at the hub, round at its outer end
  const l = PETAL_LEN;
  const w = 6.2;
  return `M0 0C${w * 0.5} ${-l * 0.2} ${w} ${-l * 0.45} ${w * 0.85} ${-l * 0.75}C${w * 0.7} ${-l * 1.02} ${-w * 0.7} ${-l * 1.02} ${-w * 0.85} ${-l * 0.75}C${-w} ${-l * 0.45} ${-w * 0.5} ${-l * 0.2} 0 0Z`;
})();
const FOIL_R = 81;
const FOIL = 4.6;

const PANES = Array.from({ length: PANE_N }, (_, k) => {
  const mid = -Math.PI / 2 + (k * TAU) / PANE_N;
  const half = Math.PI / PANE_N;
  return {
    d: sector(mid - half, mid + half, PANE_IN, PANE_OUT),
    mid,
    edge: mid - half,
    c: polar(mid, 63.4),
    base: polar(mid, PETAL_BASE),
    glass: GLASS[k % 3],
    petal: GLASS[(k + 1) % 3],
  };
});
/** The small round panes outside, one where each lead meets the rim. */
const FOILS = PANES.map((p, k) => ({
  c: polar(p.edge, FOIL_R),
  glass: GLASS[(k + 2) % 3],
}));
const GLASS_D =
  PANES.map((p) => p.d).join("") +
  FOILS.map((o) => disc(o.c.x, o.c.y, FOIL)).join("");
const LEADS = PANES.map(
  (p) => `M${at(p.edge, PANE_IN)}L${at(p.edge, PANE_OUT)}`,
).join("");
const RIM_IN = ring(54.6, 49.5);
const RIM_OUT = ring(77, 72);
const FOIL_RIMS = FOILS.map(
  (o) => disc(o.c.x, o.c.y, FOIL + 2.2) + disc(o.c.x, o.c.y, FOIL, true),
).join("");

function GlassBack({ t }: { t: Clock }) {
  // the light behind the window, turning slowly so the colours drift
  const turn = useDerivedValue(() => [{ rotate: -t.value * 0.25 }]);
  const glow = useDerivedValue(() => 0.5 + 0.12 * Math.sin(t.value * 1.1));
  return (
    <Group>
      <Halo r={92} color="#E8B8FF" opacity={0.3} />
      <Group transform={turn} opacity={glow}>
        <Circle cx={0} cy={0} r={66} style="stroke" strokeWidth={24}>
          <SweepGradient
            c={vec(0, 0)}
            colors={[
              GLASS[0][1],
              GLASS[1][1],
              GLASS[2][1],
              GLASS[0][1],
              GLASS[1][1],
              GLASS[2][1],
              GLASS[0][1],
            ]}
          />
          <BlurMask blur={10} style="normal" />
        </Circle>
      </Group>
    </Group>
  );
}

function GlassFront({ t }: { t: Clock }) {
  const glassClip = useMemo(() => Skia.Path.MakeFromSVGString(GLASS_D), []);
  // a band of light walking round the window
  const spin = useDerivedValue(() => [{ rotate: t.value * 0.5 }]);
  return (
    <Group>
      {/* the panes, each lit from its heart */}
      {PANES.map((p, k) => (
        <Group key={k}>
          <Path path={p.d} opacity={0.92}>
            <RadialGradient c={vec(p.c.x, p.c.y)} r={17} colors={p.glass} />
          </Path>
          <Group
            transform={[
              { translateX: p.base.x },
              { translateY: p.base.y },
              { rotate: p.mid + Math.PI / 2 },
            ]}
          >
            <Path path={PETAL} opacity={0.95}>
              <RadialGradient
                c={vec(-1.5, -PETAL_LEN * 0.6)}
                r={PETAL_LEN * 0.75}
                colors={p.petal}
              />
            </Path>
            <Path
              path={`M-3 ${-PETAL_LEN * 0.45}L-2.6 ${-PETAL_LEN * 0.74}`}
              style="stroke"
              strokeWidth={1}
              strokeCap="round"
              color="#FFFFFF"
              opacity={0.75}
            />
            <Path
              path={PETAL}
              style="stroke"
              strokeWidth={1.8}
              strokeJoin="round"
              color={LEAD}
            />
          </Group>
        </Group>
      ))}
      {FOILS.map((o, k) => (
        <Circle key={k} cx={o.c.x} cy={o.c.y} r={FOIL} opacity={0.92}>
          <RadialGradient
            c={vec(o.c.x - 1.2, o.c.y - 1.2)}
            r={FOIL * 1.6}
            colors={o.glass}
          />
        </Circle>
      ))}
      {glassClip ? (
        <Group clip={glassClip}>
          <Group transform={spin} blendMode="screen">
            <Circle cx={0} cy={0} r={90}>
              <SweepGradient
                c={vec(0, 0)}
                colors={[
                  "#FFFFFF00",
                  "#FFFFFF00",
                  "#FFFFFFB0",
                  "#FFFFFF00",
                  "#FFFFFF00",
                  "#FFFFFF60",
                  "#FFFFFF00",
                ]}
                positions={[0, 0.06, 0.13, 0.2, 0.56, 0.63, 0.7]}
              />
            </Circle>
          </Group>
        </Group>
      ) : null}
      {/* the lead holding it */}
      <Path
        path={LEADS}
        style="stroke"
        strokeWidth={2.2}
        strokeJoin="round"
        color={LEAD}
      />
      {/* the gold */}
      <Metal d={FOIL_RIMS} colors={GOLD} ink={INK_GOLD} width={0.9} />
      <Metal
        d={RIM_OUT}
        colors={GOLD}
        ink={INK_GOLD}
        vein={disc(0, 0, 74.5)}
        veinColor="#7A5212"
        shine="M-60 -38A72 72 0 0 1 -38 -60"
      />
      <Metal
        d={RIM_IN}
        colors={GOLD}
        ink={INK_GOLD}
        width={1.2}
        vein={disc(0, 0, 52)}
        veinColor="#7A5212"
      />
      {PANES.map((p, k) => {
        const o = polar(p.edge, 74.5);
        return (
          <Stud
            key={k}
            x={o.x}
            y={o.y}
            r={2}
            colors={GOLD_STUD}
            ink={INK_GOLD}
          />
        );
      })}
      <Sweep t={t} d={RIM_OUT + RIM_IN + FOIL_RIMS} every={4.6} />
      <Glint t={t} x={FOILS[0].c.x} y={FOILS[0].c.y} size={6} phase={0.5} />
      <Glint t={t} x={PANES[4].c.x} y={PANES[4].c.y} size={5} phase={2.3} />
      <Glint t={t} x={FOILS[8].c.x} y={FOILS[8].c.y} size={5} phase={4.1} />
    </Group>
  );
}

// ── Brazier ──────────────────────────────────────────────────────────

/** Iron that has sat in the fire: warm in the light, black in the shade. */
const IRON = ["#9A9A9E", "#4C4A4C", "#1C1A1B", "#6C6A6C"];
const INK_IRON = "#0C0807";
const VEIN_IRON = "#2A201C";
const IRON_STUD = ["#D8C8BE", "#5E4E46", "#160F0D"];
const HOT = "#FF6A1A";

const BZ_RING = ring(65, 49.5);
/** Straps across the ring, clear of the coals on top. */
const STRAP_A = Array.from({ length: 8 }, (_, k) => (22.5 + k * 45) * DEG);
const strap = (a: number) => {
  const w = 4.2;
  const p = (r: number, o: number) => {
    const c = polar(a, r);
    return `${f(c.x - Math.sin(a) * o)} ${f(c.y + Math.cos(a) * o)}`;
  };
  return `M${p(47.8, -w)}L${p(67, -w)}L${p(67, w)}L${p(47.8, w)}Z`;
};
const STRAPS = STRAP_A.map(strap);

/** A crack of heat in each length of iron between two straps. */
const CRACKS = STRAP_A.map((a, k) => {
  const from = a + 9 * DEG;
  const to = a + 36 * DEG;
  const steps = 11;
  const pts = Array.from({ length: steps + 1 }, (_, j) => {
    const s = (j + (rnd(k * 17 + j) - 0.5) * 0.5) / steps;
    const r =
      57.2 +
      (rnd(k * 31 + j) - 0.5) * 5 * Math.sin(Math.PI * (0.1 + 0.8 * s)) +
      Math.sin(s * 5 + k) * 1.5;
    return at(from + (to - from) * Math.min(1, Math.max(0, s)), r);
  });
  // a short branch off the middle, toward the outer edge or the inner
  const side = k % 2 ? 1 : -1;
  const mid = from + (to - from) * 0.5;
  const branch = `M${pts[6]}L${at(mid + 2.5 * DEG, 57.2 + side * 3.2)}L${at(mid + 5 * DEG, 57.2 + side * 5.2)}`;
  return `M${pts.join("L")}${branch}`;
});

/** A coal: a lumpy rounded stone. */
const lump = (cx: number, cy: number, r: number, seed: number) => {
  const n = 7;
  const pts = Array.from({ length: n }, (_, j) => {
    const a = (j / n) * TAU + (rnd(seed + j) - 0.5) * 0.5;
    const rr = r * (0.8 + 0.3 * rnd(seed * 7 + j));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.78];
  });
  const m = (i: number) => {
    const p = pts[i % n];
    const q = pts[(i + 1) % n];
    return `${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`;
  };
  return `M${m(n - 1)}${pts.map((p, j) => `Q${f(p[0])} ${f(p[1])} ${m(j)}`).join("")}Z`;
};
const COALS = [
  // the back of the heap, then the front
  { a: -97, r: 72, s: 6.4 },
  { a: -83, r: 72, s: 6.6 },
  { a: -115, r: 65.5, s: 5.6 },
  { a: -65, r: 65.5, s: 5.6 },
  { a: -103, r: 67, s: 7 },
  { a: -77, r: 67, s: 7.2 },
  { a: -90, r: 66.5, s: 8 },
].map((c, k) => {
  const p = polar(c.a * DEG, c.r);
  return {
    x: p.x,
    y: p.y,
    s: c.s,
    d: lump(p.x, p.y, c.s, k * 13 + 5),
    seam: `M${Array.from({ length: 5 }, (_, j) => {
      const u = -0.55 + j * 0.27;
      const v = 0.12 + (rnd(k * 9 + j) - 0.5) * 0.4;
      return `${f(p.x + u * c.s)} ${f(p.y + v * c.s)}`;
    }).join("L")}`,
    phase: k * 1.7,
  };
});

/** Wrought-iron scrolls at the sides and the foot; the right half. */
const IRON_SCROLLS = [
  curl(58, 24, 0.35, 42, -6, 7, 0.6),
  curl(56, -28, -0.4, 34, 5.5, 6, 0.6),
  curl(14, 62, 1.4, 30, -5, 6, 0.6),
];

function IronScrolls() {
  return (
    <Group>
      {IRON_SCROLLS.map((s, k) => (
        <Metal
          key={k}
          d={s.outline}
          colors={IRON}
          ink={INK_IRON}
          vein={s.vein}
          veinColor={VEIN_IRON}
          width={1.2}
        />
      ))}
    </Group>
  );
}

function BrazierBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.38 + 0.08 * Math.sin(t.value * 1.7) * Math.sin(t.value * 0.6 + 1),
  );
  return (
    <Group>
      <Halo r={92} color="#FF7A22" opacity={glow} />
      <IronScrolls />
      <Group transform={[{ scaleX: -1 }]}>
        <IronScrolls />
      </Group>
    </Group>
  );
}

function Crack({ t, d, phase }: { t: Clock; d: string; phase: number }) {
  const heat = useDerivedValue(
    () =>
      0.6 +
      0.4 *
        Math.sin(t.value * 1.6 + phase) *
        Math.sin(t.value * 0.7 + phase * 2),
  );
  return (
    <Group opacity={heat}>
      <Path
        path={d}
        style="stroke"
        strokeWidth={4.4}
        strokeJoin="round"
        strokeCap="round"
        color={HOT}
      >
        <BlurMask blur={2.6} style="normal" />
      </Path>
      <Path
        path={d}
        style="stroke"
        strokeWidth={1.3}
        strokeJoin="round"
        strokeCap="round"
        color="#FFE6A0"
      />
    </Group>
  );
}

function Coal({
  t,
  x,
  y,
  s,
  d,
  seam,
  phase,
}: {
  t: Clock;
  x: number;
  y: number;
  s: number;
  d: string;
  seam: string;
  phase: number;
}) {
  const burn = useDerivedValue(
    () => 0.55 + 0.45 * Math.sin(t.value * 1.9 + phase),
  );
  return (
    <Group>
      <Path path={d}>
        <RadialGradient
          c={vec(x - s * 0.4, y - s * 0.5)}
          r={s * 1.6}
          colors={["#5A5250", "#221C1C", "#0C0808"]}
        />
      </Path>
      {/* lit from below, by the fire */}
      <Path path={d} opacity={burn}>
        <LinearGradient
          start={vec(x, y + s * 0.8)}
          end={vec(x, y - s * 0.2)}
          colors={["#FFC050", "#F04A14", "#F04A1400"]}
        />
      </Path>
      <Group opacity={burn}>
        <Path
          path={seam}
          style="stroke"
          strokeWidth={2.4}
          strokeCap="round"
          strokeJoin="round"
          color={HOT}
        >
          <BlurMask blur={1.4} style="normal" />
        </Path>
        <Path
          path={seam}
          style="stroke"
          strokeWidth={0.8}
          strokeCap="round"
          strokeJoin="round"
          color="#FFE8A8"
        />
      </Group>
      <Path path={d} style="stroke" strokeWidth={1} color={INK_IRON} />
    </Group>
  );
}

function BrazierFront({ t }: { t: Clock }) {
  const heat = useDerivedValue(() => 0.75 + 0.25 * Math.sin(t.value * 1.9));
  return (
    <Group>
      <Metal
        d={BZ_RING}
        colors={IRON}
        ink={INK_IRON}
        vein={disc(0, 0, 53) + disc(0, 0, 61.5)}
        veinColor={VEIN_IRON}
        shine="M-58 -14A59 59 0 0 1 -44 -40"
      />
      {/* the iron glows hottest under the coals */}
      <Path path={BZ_RING} opacity={heat}>
        <LinearGradient
          start={vec(0, -66)}
          end={vec(0, -18)}
          colors={["#FF5A1AA0", "#C2300E40", "#C2300E00"]}
        />
      </Path>
      {CRACKS.map((d, k) => (
        <Crack key={k} t={t} d={d} phase={k * 1.3} />
      ))}
      {STRAPS.map((d, k) => (
        <Metal
          key={k}
          d={d}
          colors={IRON}
          ink={INK_IRON}
          width={1.1}
          from={vec(-40, -60)}
          to={vec(40, 60)}
        />
      ))}
      {STRAP_A.flatMap((a, k) =>
        [52.4, 62.4].map((r, j) => {
          const p = polar(a, r);
          return (
            <Stud
              key={`${k}-${j}`}
              x={p.x}
              y={p.y}
              r={1.9}
              colors={IRON_STUD}
              ink={INK_IRON}
            />
          );
        }),
      )}
      <Group opacity={0.45}>
        <Sweep t={t} d={BZ_RING} every={5.2} />
      </Group>
      {/* the coals, a fire's glow round them */}
      <Group opacity={heat}>
        {COALS.map((c, k) => (
          <Circle key={k} cx={c.x} cy={c.y + 1} r={c.s * 1.7} color={HOT}>
            <BlurMask blur={6} style="normal" />
          </Circle>
        ))}
      </Group>
      {COALS.map((c, k) => (
        <Coal key={k} t={t} {...c} />
      ))}
      <Sparks
        t={t}
        count={9}
        from={-Math.PI * 0.68}
        to={-Math.PI * 0.32}
        r={68}
        rise={20}
        color="#FFA43A"
        size={1.5}
        seed={4}
      />
    </Group>
  );
}

// ── Snowflake ────────────────────────────────────────────────────────

const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_SILVER = "#1E242C";
const VEIN_SILVER = "#4A5462";
const ICE = ["#FFFFFF", "#A8DCFF", "#2A78C8"];
const INK_ICE = "#0A2440";

/** A crystal rod from (x, y) along angle `a`: `len` long, `hw` half as
 *  wide, cut to a point. */
const rod = (x: number, y: number, a: number, len: number, hw: number) => {
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const p = (s: number, o: number) =>
    `${f(x + ux * s * len - uy * o)} ${f(y + uy * s * len + ux * o)}`;
  return {
    d: `M${p(0, -hw)}L${p(0.8, -hw * 0.8)}L${p(1, 0)}L${p(0.8, hw * 0.8)}L${p(0, hw)}Z`,
    vein: `M${p(0.04, 0)}L${p(0.86, 0)}`,
  };
};
const hexagon = (x: number, y: number, r: number, a: number) =>
  `M${Array.from({ length: 6 }, (_, k) => {
    const q = polar(a + (k * TAU) / 6, r);
    return `${f(x + q.x)} ${f(y + q.y)}`;
  }).join("L")}Z`;

interface Piece {
  d: string;
  vein: string;
}
interface Arm {
  branches: Piece[];
  spine: Piece;
  tip: { x: number; y: number; r: number; a: number };
}

const ROOT = 54;
const arm = (a: number, major: boolean): Arm => {
  const len = major ? 29 : 18;
  const root = polar(a, ROOT);
  const branches: Piece[] = [];
  const forks = major
    ? [
        { r: 61, len: 14, hw: 1.6 },
        { r: 68.5, len: 10.5, hw: 1.4 },
        { r: 75.5, len: 6, hw: 1.1 },
      ]
    : [
        { r: 61.5, len: 7, hw: 1.2 },
        { r: 67, len: 4.6, hw: 1 },
      ];
  for (const fk of forks) {
    const p = polar(a, fk.r);
    for (const side of [-1, 1]) {
      branches.push(rod(p.x, p.y, a + side * 60 * DEG, fk.len, fk.hw));
    }
  }
  const tip = polar(a, ROOT + len);
  return {
    branches,
    spine: rod(root.x, root.y, a, len, major ? 2.3 : 1.6),
    tip: { x: tip.x, y: tip.y, r: major ? 4.4 : 2.8, a },
  };
};
const ARMS = Array.from({ length: 12 }, (_, k) =>
  arm(-Math.PI / 2 + (k * TAU) / 12, k % 2 === 0),
);
const ARMS_D = ARMS.flatMap((m) => [
  ...m.branches.map((b) => b.d),
  m.spine.d,
]).join("");
const SNOW_RING = ring(57, 49.5);
/** Silver wire looping out between the arms' roots. */
const SCALLOPS = Array.from({ length: 12 }, (_, k) => {
  const a = -Math.PI / 2 + (k * TAU) / 12;
  return `M${at(a + 4 * DEG, 56)}Q${at(a + 15 * DEG, 67)} ${at(a + 26 * DEG, 56)}`;
}).join("");
const BEADS = Array.from({ length: 12 }, (_, k) =>
  polar(-Math.PI / 2 + (k * TAU) / 12 + 15 * DEG, 61.6),
);

function Wire({ d }: { d: string }) {
  return (
    <Group>
      <Path
        path={d}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color={INK_SILVER}
      />
      <Path path={d} style="stroke" strokeWidth={1.5} strokeCap="round">
        <LinearGradient
          start={vec(-60, -70)}
          end={vec(60, 70)}
          colors={SILVER}
        />
      </Path>
    </Group>
  );
}

function IceCrystal({
  x,
  y,
  r,
  a,
}: {
  x: number;
  y: number;
  r: number;
  a: number;
}) {
  const d = hexagon(x, y, r, a);
  const facets = [0, 2, 4]
    .map((k) => {
      const q = polar(a + (k * TAU) / 6, r);
      return `M${f(x)} ${f(y)}L${f(x + q.x)} ${f(y + q.y)}`;
    })
    .join("");
  return (
    <Group>
      <Path path={d}>
        <RadialGradient
          c={vec(x - r * 0.35, y - r * 0.4)}
          r={r * 1.7}
          colors={ICE}
        />
      </Path>
      <Path
        path={facets}
        style="stroke"
        strokeWidth={0.6}
        color="#FFFFFF"
        opacity={0.8}
      />
      <Path
        path={d}
        style="stroke"
        strokeWidth={0.9}
        strokeJoin="round"
        color={INK_ICE}
      />
    </Group>
  );
}

/** Frost glinting here and there round the flake. */
const FROST = Array.from({ length: 7 }, (_, k) => {
  const p = polar(-Math.PI / 2 + (k * TAU) / 7 + 0.35, 74 + rnd(k + 40) * 8);
  return { x: p.x, y: p.y, phase: k * 0.9, size: 3 + rnd(k + 60) * 2 };
});

function SnowBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.28 + 0.08 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={92} color="#8CC8FF" opacity={glow} />
      <Wire d={SCALLOPS} />
      {BEADS.map((b, k) => (
        <Stud
          key={k}
          x={b.x}
          y={b.y}
          r={1.7}
          colors={["#FFFFFF", "#B8C2D0", "#5A6474"]}
          ink={INK_SILVER}
        />
      ))}
      {ARMS.map((m, k) => (
        <Group key={k}>
          {m.branches.map((b, j) => (
            <Metal
              key={j}
              d={b.d}
              colors={SILVER}
              ink={INK_SILVER}
              vein={b.vein}
              veinColor={VEIN_SILVER}
              width={1}
            />
          ))}
          <Metal
            d={m.spine.d}
            colors={SILVER}
            ink={INK_SILVER}
            vein={m.spine.vein}
            veinColor={VEIN_SILVER}
            width={1.2}
          />
        </Group>
      ))}
      <Sweep t={t} d={ARMS_D} every={4.8} />
      {ARMS.map((m, k) => (
        <IceCrystal key={k} {...m.tip} />
      ))}
    </Group>
  );
}

function SnowFront({ t }: { t: Clock }) {
  // a cold glint runs round the ring
  const run = useDerivedValue(() => [{ rotate: t.value * 0.7 }]);
  const pulse = useDerivedValue(() => 0.55 + 0.35 * Math.sin(t.value * 2));
  const star = "M0 -5Q0.8 -0.8 5 0Q0.8 0.8 0 5Q-0.8 0.8 -5 0Q-0.8 -0.8 0 -5Z";
  return (
    <Group>
      <Metal
        d={SNOW_RING}
        colors={SILVER}
        ink={INK_SILVER}
        width={1.3}
        vein={disc(0, 0, 53.25)}
        veinColor={VEIN_SILVER}
        shine="M-50 -20A54 54 0 0 1 -30 -45"
      />
      {ARMS.filter((_, k) => k % 2 === 0).map((m, k) => {
        const p = polar(m.tip.a, 53.25);
        return <IceCrystal key={k} x={p.x} y={p.y} r={3} a={m.tip.a} />;
      })}
      <Sweep t={t} d={SNOW_RING} every={4.8} phase={0.25} />
      <Group transform={run}>
        <Group opacity={pulse}>
          <Circle cx={0} cy={-53.25} r={4.5} color="#8ACCFF">
            <BlurMask blur={3} style="normal" />
          </Circle>
        </Group>
        <Path
          path={star}
          color="#FFFFFF"
          transform={[{ translateY: -53.25 }]}
        />
      </Group>
      {FROST.map((s, k) => (
        <Glint
          key={k}
          t={t}
          x={s.x}
          y={s.y}
          size={s.size}
          phase={s.phase}
          speed={1.4}
        />
      ))}
      <Glint t={t} x={0} y={-83} size={6} phase={0.2} />
    </Group>
  );
}

export const ELEMENTS_ART = {
  "stained-glass": {
    back: GlassBack,
    front: GlassFront,
  } satisfies ArtBorderDrawing,
  brazier: {
    back: BrazierBack,
    front: BrazierFront,
  } satisfies ArtBorderDrawing,
  snowflake: { back: SnowBack, front: SnowFront } satisfies ArtBorderDrawing,
};

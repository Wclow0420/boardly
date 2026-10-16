// Aurora, Tidal Wave and Plasma Core, enhanced and engraved. Each keeps
// the living shader rim it was built on, licking over the picture's edge,
// and gains a crafted frame round it.
//
// - Aurora: the northern-light curtains ripple higher above, where stars
//   twinkle, round a thin engraved silver ring with a sea-green jewel at
//   its crown. Below, the ring sits in a winter landscape: snowy peaks on
//   both shoulders and snow-dusted pines on a drift under its foot.
// - Tidal Wave: the swell and foam as before, now held by a slim nautical
//   ring (brass bands either side of a twisted rope), the crests rolling
//   out past it. A compass rose sits at its top, its card wandering; a wave rears up
//   and breaks at the right, throwing spray; bubbles rise on the left, and
//   a pearl sits in a scallop shell at its foot.
// - Plasma Core: the crackling plasma as before, inside a reactor ring of
//   engraved gunmetal. A charge meter runs round its conduits between four
//   emitters at the compass points; as each quarter fills, the emitter at
//   its end discharges arcs into the core and the plasma surges.
// See heraldry.tsx and tempest.tsx for the house style.

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
import { useMemo, type ReactNode } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import { curl, type Pt } from "@/components/engraved/shapes";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { AURORA_RIM, Fx } from "./rimfx";

const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(2);
const fp = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
/** A point at angle `a` (degrees), radius `r`, as path text. */
const at = (a: number, r: number) => {
  const p = polar(a * DEG, r);
  return `${f(p.x)} ${f(p.y)}`;
};
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (r: number, hole = false, cx = 0, cy = 0) => {
  const s = hole ? 0 : 1;
  return `M${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx + r)} ${f(cy)}Z`;
};
/** A band round the origin (a ring under either fill rule). */
const ring = (rOut: number, rIn: number) => disc(rOut) + disc(rIn, true);
/** An arc from a0 to a1 (degrees, a1 > a0), clockwise. */
const arc = (r: number, a0: number, a1: number) =>
  `M${at(a0, r)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${at(a1, r)}`;
/** Every "x y" pair in a path, moved by `map`. */
const remap = (d: string, map: (x: number, y: number) => Pt) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    fp(map(Number(x), Number(y))),
  );

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_SILVER = "#1E242C";
const VEIN_SILVER = "#4A5462";

/** An engraved piece: filled with its metal (or `fill`), its veins and
 *  shine cut in, inked round. */
function Metal({
  d,
  colors,
  fill,
  ink,
  vein,
  veinColor,
  veinWidth = 0.8,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors?: string[];
  /** A shader to fill with instead of the linear `colors`. */
  fill?: ReactNode;
  ink: string;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const rule = evenOdd ? "evenOdd" : "winding";
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={rule}>
        {fill ?? (
          <LinearGradient start={from} end={to} colors={colors ?? GOLD} />
        )}
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={veinWidth}
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
      {width > 0 ? (
        <Path
          path={d}
          fillType={rule}
          style="stroke"
          strokeWidth={width}
          strokeJoin="round"
          color={ink}
        />
      ) : null}
    </Group>
  );
}

/** What this file's shaders start with (Fx hands every one t and flash). */
const PRE = `
uniform float t;
uniform float flash;
${NOISE}
vec2 rot(vec2 v, float a) { float c = cos(a); float s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
`;

// ══ Aurora ═══════════════════════════════════════════════════════════

/** The curtains as before, but hanging higher and brighter above (where
 *  they ripple) and fading low behind the peaks; stars twinkle in the
 *  sky above. */
const AURORA_SKY = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 50.0 || r > 92.0) return half4(0.0);
  float h = (r - 50.0) / 42.0;
  float ang = atan(xy.y, xy.x);
  vec2 d = vec2(cos(ang), sin(ang));
  // 1 straight up, 0 straight down
  float up = 0.5 - 0.5 * d.y;
  float curtain = fbm(d * 2.5 + vec2(t * 0.25, 0.0));
  // folds hanging like cloth, rippling along
  float folds = pow(0.5 + 0.5 * sin(ang * 30.0 + curtain * 9.0 + t * 1.2), 2.0);
  float streak = 0.6 + 0.4 * sin(ang * 70.0 + curtain * 14.0);
  float fade = smoothstep(0.0, 0.15, h) * (1.0 - smoothstep(0.6, 1.0, h));
  float mid = 0.35 + 0.1 * up + (curtain - 0.5) * 0.35 + 0.05 * sin(ang * 5.0 + t * 0.9);
  float band = exp(-pow((h - mid) / (0.26 + 0.12 * up), 2.0));
  float v = band * fade * (0.3 + folds * streak * 0.9) * (0.7 + curtain * 0.6);
  v *= 0.35 + 0.85 * up;
  vec3 col = mix(vec3(0.1, 0.95, 0.55), vec3(0.2, 0.8, 0.95), smoothstep(0.2, 0.6, h));
  col = mix(col, vec3(0.95, 0.4, 0.8), smoothstep(0.5, 0.9, h + (curtain - 0.5) * 0.3));
  float a = clamp(v, 0.0, 1.0) * 0.85;
  // stars: one in some cells of a grid, each twinkling at its own pace
  vec2 cell = floor(xy / 7.0);
  float k = hash(cell);
  vec2 c = (cell + 0.25 + 0.5 * vec2(hash(cell + 7.1), hash(cell + 3.7))) * 7.0;
  float s = (1.0 - smoothstep(0.25, 0.95, length(xy - c)))
    * step(0.55, k) * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(t * (1.5 + k * 3.0) + k * 40.0), 3.0))
    * smoothstep(0.35, 0.7, up) * smoothstep(60.0, 66.0, r) * (1.0 - smoothstep(86.0, 91.0, r));
  vec3 star = vec3(0.92, 0.97, 1.0) * s;
  return half4(col * a + star * (1.0 - a * 0.5), a + s * (1.0 - a));
}`;

// The horizon: snowy peaks on both shoulders, pines standing on a drift
// of snow under the ring. Drawn as the right half, mirrored.
const mirror = (d: string) => remap(d, (x, y) => [-x, y]);
const both = (d: string) => d + mirror(d);

/** The tall peaks behind, their snow, and the shaded face down each. */
const PEAK_BACK = both(
  "M30 46L50 10L58 2L64 -6L70 -15L75 -9L80 -4L86 6L88 20L84 34Z",
);
const PEAK_BACK_SNOW = both(
  "M70 -15L64 -6L61.4 -2.4L65 -4.4L68 -0.6L72 -5.4L76.4 -2.2L80 -4L75 -9Z",
);
const PEAK_BACK_SHADE = both(
  "M70 -15L75 -9L80 -4L86 6L88 20L84 34L72 40L71 8Z",
);
/** Lower peaks in front of them. */
const PEAK_FRONT = both("M46 46L60 24L66 16L70 12L75 17L80 24L85 34L62 50Z");
const PEAK_FRONT_SNOW = both(
  "M70 12L66 16L64 19.4L67 18L69.4 21L72 17.6L75 17Z",
);
const PEAK_FRONT_SHADE = both("M70 12L75 17L80 24L85 34L70 44L70.6 24Z");
const PEAK_RIDGES = both(
  "M70 -13L66 4L62 20M70.6 -11L74 6M70 14L68 30M70.6 15L74 30",
);

/** The drift of snow the pines stand on, hugging the ring's foot. */
const DRIFT_TOP: Pt[] = [
  [86, 33],
  [78, 31],
  [72, 38],
  [64, 40],
  [56, 42],
  [50, 48],
  [42, 52],
  [32, 57],
  [24, 60],
  [14, 61],
  [8, 62],
  [4, 63],
  [0, 63],
];
const DRIFT_UNDER: Pt[] = [
  [0, 75],
  [6, 75.6],
  [12, 74.2],
  [20, 72.8],
  [28, 71],
  [36, 66],
  [44, 64.4],
  [54, 61],
  [62, 56],
  [70, 51.4],
  [78, 44],
  [84, 39],
  [86, 33],
];
/** Cubic runs through every third point. */
const cubics = (pts: Pt[]) => {
  let d = "";
  for (let k = 1; k + 2 < pts.length; k += 3)
    d += `C${fp(pts[k])} ${fp(pts[k + 1])} ${fp(pts[k + 2])}`;
  return d;
};
const neg = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y]);
const rev = (pts: Pt[]): Pt[] => [...pts].reverse();
const DRIFT = `M-86 33${cubics(neg(DRIFT_TOP))}${cubics(rev(DRIFT_TOP))}${cubics(rev(DRIFT_UNDER))}${cubics(neg(DRIFT_UNDER))}Z`;
const DRIFT_VEIN = both(
  "M78 36C70 42 60 46 50 52M64 50C54 56 44 60 32 64M40 66C30 68 20 70 10 70",
);
const DRIFT_SHINE = "M-80 34C-74 33 -70 38 -62 40";

/** A pine standing upright at (x, y): tiers of boughs, notched; snow
 *  along each tier's lit edge. */
function pine(x: number, y: number, h: number) {
  const w = h * 0.34;
  const tiers = [
    { u: 0, w },
    { u: h * 0.3, w: w * 0.78 },
    { u: h * 0.56, w: w * 0.55 },
  ];
  const P = (u: number, v: number) => `${f(x + v)} ${f(y - u)}`;
  const right = tiers
    .map((s, k) =>
      k ? `L${P(s.u, s.w * 0.42)}L${P(s.u, s.w)}` : `L${P(s.u, s.w)}`,
    )
    .join("");
  const left = [...tiers]
    .reverse()
    .map((s, k) =>
      k === tiers.length - 1
        ? `L${P(s.u, -s.w)}`
        : `L${P(s.u, -s.w)}L${P(s.u, -s.w * 0.42)}`,
    )
    .join("");
  const d = `M${P(-2.2, -0.9)}L${P(-2.2, 0.9)}L${P(0, 0.9)}${right}L${P(h, 0)}${left}L${P(0, -0.9)}Z`;
  const snow = tiers
    .map((s, k) => {
      const top = k < 2 ? tiers[k + 1] : { u: h, w: 0 };
      return `M${P(s.u + 0.5, -s.w * 0.82)}L${P(top.u - 0.2, -top.w * 0.42 - 0.2)}`;
    })
    .join("");
  return { d, snow };
}

/** The pines on the drift: tall ones on the shoulders, smaller toward the
 *  ring's foot (half hidden behind it). */
const PINE_AT: [number, number, number][] = [
  [20, 62.4, 9],
  [28, 59.6, 11],
  [36, 56, 15],
  [44, 51.6, 18],
  [52, 47.4, 13],
  [60, 43.6, 16],
  [68, 40.4, 12],
  [76, 36.6, 14],
];
const PINES = PINE_AT.flatMap(([x, y, h]) => [pine(x, y, h), pine(-x, y, h)]);
const PINE_D = PINES.map((p) => p.d).join("");
const PINE_SNOW = PINES.map((p) => p.snow).join("");

const PEAK_FAR = ["#F4F8FF", "#A8BCDA", "#5A7096", "#C8D6EA"];
const PEAK_NEAR = ["#D8E2F2", "#7A90B4", "#34486E", "#9AAECE"];
const SNOW = ["#FFFFFF", "#EEF4FC", "#C4D2E6"];
/** Snow lying in the night: a little blue. */
const DRIFT_SNOW = ["#F2F6FE", "#C6D4EA", "#8EA2C4"];
const INK_PEAK = "#0E1A30";
const PINE = ["#6E9A7A", "#2A5A40", "#0E2E1E", "#4A7A5C"];
const INK_PINE = "#04140A";

function AuroraBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Halo r={92} color="#2FE3A8" opacity={0.3} />
      <Fx sksl={AURORA_SKY} t={t} />
      <Metal
        d={PEAK_BACK}
        colors={PEAK_FAR}
        ink={INK_PEAK}
        width={1}
        from={vec(-90, -20)}
        to={vec(90, 50)}
      />
      <Path path={PEAK_BACK_SHADE} color="#0A1430" opacity={0.22} />
      <Metal d={PEAK_BACK_SNOW} colors={SNOW} ink={INK_PEAK} width={0.7} />
      <Metal
        d={PEAK_FRONT}
        colors={PEAK_NEAR}
        ink={INK_PEAK}
        width={1}
        from={vec(-90, 10)}
        to={vec(90, 50)}
        vein={PEAK_RIDGES}
        veinColor={INK_PEAK}
        veinWidth={0.6}
      />
      <Path path={PEAK_FRONT_SHADE} color="#0A1430" opacity={0.25} />
      <Metal d={PEAK_FRONT_SNOW} colors={SNOW} ink={INK_PEAK} width={0.7} />
      <Metal
        d={DRIFT}
        colors={DRIFT_SNOW}
        ink={INK_PEAK}
        width={1}
        from={vec(0, 34)}
        to={vec(0, 78)}
        vein={DRIFT_VEIN}
        veinColor="#8AA0C0"
        veinWidth={0.6}
        shine={DRIFT_SHINE}
      />
      <Metal
        d={PINE_D}
        colors={PINE}
        ink={INK_PINE}
        width={0.7}
        from={vec(-60, 30)}
        to={vec(60, 70)}
      />
      <Path
        path={PINE_SNOW}
        style="stroke"
        strokeWidth={0.6}
        strokeCap="round"
        color="#F4FAFF"
        opacity={0.9}
      />
    </Group>
  );
}

/** The thin silver ring: grooves at its edges, a star mark every 30°. */
const SKY_RING = ring(62.6, 58.4);
const SKY_RING_VEIN =
  disc(61.6) +
  disc(59.4) +
  Array.from({ length: 12 }, (_, k) => {
    const a = k * 30 - 75;
    return `M${at(a - 1.6, 60.5)}L${at(a + 1.6, 60.5)}M${at(a, 59.6)}L${at(a, 61.4)}`;
  }).join("");

/** The jewel's mount: a four-pointed silver star. */
const JY = -60.5;
const STAR_MOUNT = (() => {
  const pts = Array.from({ length: 8 }, (_, k) => {
    const r = k % 2 ? 3.2 : 9;
    const p = polar(-Math.PI / 2 + (k * Math.PI) / 4, r);
    return `${f(p.x)} ${f(p.y + JY)}`;
  });
  return `M${pts.join("L")}Z`;
})();

function AuroraJewel({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.45 + 0.3 * Math.sin(t.value * 1.4));
  const pink = useDerivedValue(() => 0.3 - 0.25 * Math.sin(t.value * 1.4));
  return (
    <Group>
      <Metal
        d={STAR_MOUNT}
        colors={SILVER}
        ink={INK_SILVER}
        width={0.9}
        vein={`M0 ${JY - 8}V${JY + 8}M-8 ${JY}H8`}
        veinColor={VEIN_SILVER}
        from={vec(-8, JY - 8)}
        to={vec(8, JY + 8)}
      />
      <Group blendMode="screen">
        <Circle cx={0} cy={JY} r={7} color="#3FFFB8" opacity={glow}>
          <BlurMask blur={4} style="normal" />
        </Circle>
        <Circle cx={0} cy={JY} r={6} color="#FF6AD0" opacity={pink}>
          <BlurMask blur={4} style="normal" />
        </Circle>
      </Group>
      <Gem
        x={0}
        y={JY}
        w={6.4}
        h={7}
        colors={["#D8FFF0", "#1EC8A0", "#05463E"]}
      />
    </Group>
  );
}

function AuroraFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Fx sksl={AURORA_RIM} t={t} extent={68} />
      <Metal
        d={SKY_RING}
        evenOdd
        colors={SILVER}
        ink={INK_SILVER}
        width={0.9}
        vein={SKY_RING_VEIN}
        veinColor={VEIN_SILVER}
        veinWidth={0.6}
        shine={arc(61, 195, 240)}
      />
      <Group opacity={0.75}>
        <Sweep t={t} d={SKY_RING} evenOdd every={5.4} />
      </Group>
      <AuroraJewel t={t} />
      <Glint t={t} x={0} y={JY} size={5.5} phase={0.5} speed={0.9} />
      <Glint t={t} x={-58} y={-58} size={4.5} phase={1.6} />
      <Glint t={t} x={66} y={-46} size={3.8} phase={3.1} />
      <Glint t={t} x={-26} y={-82} size={3.2} phase={4.4} />
    </Group>
  );
}

const Aurora: ArtBorderDrawing = { back: AuroraBack, front: AuroraFront };

// ══ Tidal Wave ═══════════════════════════════════════════════════════

/** The rolling wave round the rim, foam on its crests (rimfx's TIDE_RIM). */
const TIDE = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float wave = fbm(rot(dir, -t * 0.8) * 6.0 + vec2(t * 0.6, 0.0));
  float swell = 0.5 + 0.5 * sin(atan(xy.y, xy.x) * 7.0 - t * 2.4 + wave * 4.0);
  float d0 = r - 54.0;
  float outer = 3.0 + swell * 14.0 + wave * 4.0;
  float inner = 4.0 + wave * 3.0;
  float m = d0 > 0.0 ? 1.0 - d0 / outer : 1.0 + d0 / inner;
  if (m <= 0.0) return half4(0.0);
  vec3 deep = vec3(0.0, 0.1, 0.32);
  vec3 col = mix(deep, vec3(0.08, 0.5, 0.88), smoothstep(0.0, 0.9, m * (0.5 + swell * 0.7)));
  col = mix(col, vec3(0.45, 0.85, 1.0), smoothstep(0.55, 0.9, wave) * 0.5);
  float foam = (1.0 - smoothstep(0.0, 0.4, m)) * step(0.0, d0) * smoothstep(0.35, 0.75, swell);
  foam += smoothstep(0.72, 0.85, fbm(rot(dir, t * 0.5) * 11.0 + vec2(r * 0.25, t))) * 0.6;
  col = mix(col, vec3(0.96, 0.99, 1.0), clamp(foam, 0.0, 1.0)) * (1.0 + flash * 0.2);
  float a = smoothstep(0.0, 0.25, m);
  return half4(col * a, a);
}`;

/** The nautical ring: brass bands either side of a twisted rope. */
const BRASS = ring(64.2, 62.9) + ring(58.6, 56.4);
const BRASS_VEIN = disc(57.5);
const ROPE = ring(62.9, 58.6);
const STRANDS = 50;
const ROPE_LAY = Array.from({ length: STRANDS }, (_, k) => {
  const a = (k * 360) / STRANDS;
  return `M${at(a, 58.4)}Q${at(a + 2.8, 60.2)} ${at(a + 4.8, 63.1)}`;
}).join("");
const ROPE_SHINE = Array.from({ length: STRANDS }, (_, k) => {
  const a = (k * 360) / STRANDS + 3.2;
  return `M${at(a, 59.4)}Q${at(a + 2.2, 60.6)} ${at(a + 3.4, 62.2)}`;
}).join("");
const HEMP = ["#FFF4D8", "#D8B47A", "#8A6430", "#E8CC94"];

// The breaking wave, drawn along the ring: x runs along it (from low on
// the right, up toward the top), y is height above it.
const WAVE_R = 62;
const WAVE_A0 = 70 * DEG;
/** How far along the ring the wave runs, for its length. */
const WAVE_STRETCH = 1.12;
const wrap = (x: number, y: number): Pt => {
  const p = polar(WAVE_A0 - (x * WAVE_STRETCH) / WAVE_R, WAVE_R + y * 1.1);
  return [p.x, p.y];
};
type Seg = [Pt, Pt, Pt];
/** Cubic segments in the wave's frame, sampled and wrapped round the ring. */
const wrapped = (start: Pt, segs: Seg[], close = false) => {
  const out: Pt[] = [wrap(...start)];
  let p0 = start;
  for (const [c1, c2, p1] of segs) {
    for (let k = 1; k <= 10; k++) {
      const u = k / 10;
      const v = 1 - u;
      const b = (i: 0 | 1) =>
        v * v * v * p0[i] +
        3 * v * v * u * c1[i] +
        3 * v * u * u * c2[i] +
        u * u * u * p1[i];
      out.push(wrap(b(0), b(1)));
    }
    p0 = p1;
  }
  return `M${out.map(fp).join("L")}${close ? "Z" : ""}`;
};
const line = (a: Pt, b: Pt): Seg => [
  [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
  [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3],
  b,
];
const WAVE = wrapped(
  [0, -5],
  [
    [
      [14, -3],
      [26, 4],
      [33, 13],
    ],
    [
      [38, 20],
      [42, 24],
      [48, 24],
    ],
    [
      [55, 24],
      [60, 19],
      [60, 13],
    ],
    [
      [60, 8],
      [56, 6],
      [53, 8],
    ],
    [
      [51, 9.5],
      [52, 12],
      [54, 12],
    ],
    [
      [51, 14.5],
      [47, 13],
      [46, 9],
    ],
    [
      [45, 5],
      [48, 0],
      [56, -5],
    ],
    line([56, -5], [0, -5]),
  ],
  true,
);
const WAVE_VEIN =
  wrapped(
    [6, -2],
    [
      [
        [18, 0],
        [27, 6],
        [34, 16],
      ],
    ],
  ) +
  wrapped(
    [16, -3],
    [
      [
        [25, -1],
        [33, 6],
        [39, 15],
      ],
    ],
  ) +
  wrapped(
    [28, -3],
    [
      [
        [34, -1],
        [40, 4],
        [43, 10],
      ],
    ],
  ) +
  wrapped(
    [47, 9.5],
    [
      [
        [47.5, 14],
        [53, 15],
        [56, 11],
      ],
    ],
  );
const WAVE_SHINE = wrapped(
  [36, 19],
  [
    [
      [40, 23],
      [46, 24.5],
      [54, 22],
    ],
  ],
);
/** Foam claws curling off the crest. */
const CLAWS = (
  [
    [31, 15, 1.0, 7, -3.2, 3],
    [38, 21.5, 0.75, 8.5, -3.4, 3.4],
    [45, 24.6, 0.4, 9.5, -3.6, 3.6],
    [53, 24, 0.0, 9, -3.8, 3.4],
  ] as const
).map(([x, y, h, len, turn, w]) => {
  const c = curl(x, y, h, len, turn, w);
  return { outline: remap(c.outline, wrap), vein: remap(c.vein, wrap) };
});
const CLAW_D = CLAWS.map((c) => c.outline).join("");
const CLAW_VEIN = CLAWS.map((c) => c.vein).join("");
const FOAM = ["#FFFFFF", "#EAF8FF", "#A8D4EE"];
const INK_SEA = "#04223E";
/** Where the spray flies from, and its way forward and out there. */
const LIP = wrap(57, 21);
const LIP_A = WAVE_A0 - (57 * WAVE_STRETCH) / WAVE_R;

function Droplet({ t, i }: { t: Clock; i: number }) {
  const life = 0.9 + rnd(i + 3) * 0.6;
  const fwd = 14 + rnd(i + 5) * 22;
  const out = 10 + rnd(i + 9) * 20;
  const vx = Math.sin(LIP_A) * fwd + Math.cos(LIP_A) * out;
  const vy = -Math.cos(LIP_A) * fwd + Math.sin(LIP_A) * out;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 11) * life) % life) / life;
    const s = p * life;
    return [
      { translateX: LIP[0] + vx * s },
      { translateY: LIP[1] + vy * s + 22 * s * s },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 11) * life) % life) / life;
    return Math.sin(p * Math.PI);
  });
  const size = 0.8 + rnd(i + 13) * 0.9;
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={size * 2.2} color="#8AD8FF" opacity={0.35}>
        <BlurMask blur={size} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={size} color="#F4FCFF" />
    </Group>
  );
}

function Bubble({ t, i }: { t: Clock; i: number }) {
  const life = 2.4 + rnd(i + 21) * 1.8;
  const start = polar((118 + rnd(i + 23) * 52) * DEG, 69 + rnd(i + 25) * 8);
  const size = 1.2 + rnd(i + 27) * 1.5;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 29) * life) % life) / life;
    return [
      { translateX: start.x + Math.sin(p * 9 + i) * 2.2 },
      { translateY: start.y - p * 30 },
      { scale: 0.7 + p * 0.5 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 29) * life) % life) / life;
    return Math.min(1, p * 5) * (1 - p);
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={size} color="#7ACCF4" opacity={0.25} />
      <Circle
        cx={0}
        cy={0}
        r={size}
        style="stroke"
        strokeWidth={0.7}
        color="#D8F4FF"
      />
      <Circle
        cx={-size * 0.35}
        cy={-size * 0.35}
        r={size * 0.28}
        color="#FFFFFF"
      />
    </Group>
  );
}

/** The compass rose at the ring's top. */
const CX = 0;
const CY = -61;
const ROSE_FACE = disc(10.4, false, CX, CY);
const ROSE_BEZEL = disc(10.4, false, CX, CY) + disc(8.2, true, CX, CY);
const ROSE_TICKS = Array.from({ length: 16 }, (_, k) => {
  const p0 = polar((k * 22.5 * Math.PI) / 180, 8.4);
  const p1 = polar((k * 22.5 * Math.PI) / 180, k % 2 ? 9.3 : 10);
  return `M${f(CX + p0.x)} ${f(CY + p0.y)}L${f(CX + p1.x)} ${f(CY + p1.y)}`;
}).join("");
/** A compass point's two halves: lit (left of its axis) and shaded. */
const rosePoint = (a: number, len: number, w: number) => {
  const tip = polar(a, len);
  const l = polar(a - Math.PI / 2, w);
  const r = polar(a + Math.PI / 2, w);
  return {
    lit: `M${f(CX)} ${f(CY)}L${f(CX + l.x)} ${f(CY + l.y)}L${f(CX + tip.x)} ${f(CY + tip.y)}Z`,
    dark: `M${f(CX)} ${f(CY)}L${f(CX + tip.x)} ${f(CY + tip.y)}L${f(CX + r.x)} ${f(CY + r.y)}Z`,
  };
};
const LONG = [0, 1, 2, 3].map((k) =>
  rosePoint(k * (Math.PI / 2) - Math.PI / 2, 8, 2.2),
);
const SHORT = [0, 1, 2, 3].map((k) =>
  rosePoint(k * (Math.PI / 2) - Math.PI / 4, 5.6, 1.6),
);
const join = (ps: { lit: string; dark: string }[], key: "lit" | "dark") =>
  ps.map((p) => p[key]).join("");

function CompassRose({ t }: { t: Clock }) {
  const wander = useDerivedValue(() => [
    { translateX: CX },
    { translateY: CY },
    {
      rotate:
        0.12 * Math.sin(t.value * 0.7) + 0.05 * Math.sin(t.value * 1.9 + 1),
    },
    { translateX: -CX },
    { translateY: -CY },
  ]);
  return (
    <Group>
      <Path path={ROSE_FACE}>
        <RadialGradient
          c={vec(CX - 2, CY - 3)}
          r={11}
          colors={["#4A6AAA", "#1A2A5A", "#0A1430"]}
        />
      </Path>
      <Group transform={wander}>
        <Path path={join(SHORT, "lit")} color="#F4F6FA" />
        <Path path={join(SHORT, "dark")} color="#8A94A4" />
        <Path
          path={join(SHORT, "lit") + join(SHORT, "dark")}
          style="stroke"
          strokeWidth={0.4}
          strokeJoin="round"
          color={INK_SILVER}
        />
        <Path path={join(LONG, "lit")} color="#FFE68A" />
        <Path path={join(LONG, "dark")} color="#A8741E" />
        <Path
          path={join(LONG, "lit") + join(LONG, "dark")}
          style="stroke"
          strokeWidth={0.5}
          strokeJoin="round"
          color={INK_GOLD}
        />
      </Group>
      <Metal
        d={ROSE_BEZEL}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        width={0.9}
        vein={ROSE_TICKS}
        veinColor={VEIN_GOLD}
        veinWidth={0.5}
        from={vec(CX - 10, CY - 10)}
        to={vec(CX + 10, CY + 10)}
      />
      <Gem
        x={CX}
        y={CY}
        w={3.6}
        h={3.6}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
    </Group>
  );
}

/** A scallop shell at the ring's foot, a pearl in it. */
const HX = 0;
const HY = 88;
const SHELL_R = 24;
const RIBS = 9;
const ribA = (k: number) => (-150 + (k * 120) / (RIBS - 1)) * DEG;
const shellPt = (a: number, r: number) => {
  const p = polar(a, r);
  return `${f(HX + p.x)} ${f(HY + p.y)}`;
};
const SHELL = (() => {
  let d = `M${shellPt(ribA(0), 3)}L${shellPt(ribA(0), SHELL_R)}`;
  for (let k = 0; k < RIBS - 1; k++) {
    const m = (ribA(k) + ribA(k + 1)) / 2;
    d += `Q${shellPt(m, SHELL_R * 1.13)} ${shellPt(ribA(k + 1), SHELL_R)}`;
  }
  return `${d}L${shellPt(ribA(RIBS - 1), 3)}Z`;
})();
const SHELL_RIBS = Array.from(
  { length: RIBS },
  (_, k) => `M${shellPt(ribA(k), 4)}L${shellPt(ribA(k), SHELL_R - 1)}`,
).join("");
const SHELL_EARS = `M${HX - 6.4} ${HY - 4.2}L${HX + 6.4} ${HY - 4.2}L${HX + 3.4} ${HY + 1.2}L${HX - 3.4} ${HY + 1.2}Z`;
const SHELL_COLORS = ["#FFFFFF", "#FBE6DC", "#D8A894", "#F4D4C4"];
const PX = 0;
const PY = 74;

function Pearl({ t }: { t: Clock }) {
  const sheen = useDerivedValue(() => [
    { translateX: PX },
    { translateY: PY },
    { rotate: t.value * 0.6 },
  ]);
  return (
    <Group>
      <Circle cx={PX + 0.6} cy={PY + 1.4} r={5.6} color="#5A2A1A" opacity={0.3}>
        <BlurMask blur={1.2} style="normal" />
      </Circle>
      <Circle cx={PX} cy={PY} r={5.4}>
        <RadialGradient
          c={vec(PX - 1.8, PY - 2)}
          r={7.4}
          colors={["#FFFFFF", "#F4EEF6", "#C8BED6", "#8A7E9A"]}
        />
      </Circle>
      {/* a play of colour sliding round the pearl */}
      <Group transform={sheen} blendMode="softLight">
        <Path
          path="M-4.6 1.4A4.8 4.8 0 0 0 1.4 4.6"
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          color="#FF9AD8"
        />
        <Path
          path="M4.6 -1.4A4.8 4.8 0 0 0 -1.4 -4.6"
          style="stroke"
          strokeWidth={1.4}
          strokeCap="round"
          color="#8AE8F4"
        />
      </Group>
      <Circle
        cx={PX}
        cy={PY}
        r={5.4}
        style="stroke"
        strokeWidth={0.8}
        color="#4A3A4A"
      />
      <Circle cx={PX - 1.8} cy={PY - 2} r={1.3} color="#FFFFFF" />
    </Group>
  );
}

function TidalBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.38 + 0.08 * Math.sin(t.value * 1.1));
  return <Halo r={92} color="#3FA8FF" opacity={glow} />;
}

function TidalFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Fx sksl={TIDE} t={t} extent={76} />
      {/* the breaking wave, rising from behind the ring */}
      <Metal
        d={WAVE}
        fill={
          <RadialGradient
            c={vec(0, 0)}
            r={90}
            colors={["#06306A", "#0A3E80", "#1E86CC", "#7AD6F6", "#E8FAFF"]}
            positions={[0, 0.7, 0.8, 0.9, 0.98]}
          />
        }
        ink={INK_SEA}
        width={1.1}
        vein={WAVE_VEIN}
        veinColor="#0A3A6A"
        shine={WAVE_SHINE}
      />
      <Metal
        d={CLAW_D}
        colors={FOAM}
        ink={INK_SEA}
        width={0.8}
        vein={CLAW_VEIN}
        veinColor="#4A8AB8"
        veinWidth={0.5}
        from={vec(50, -40)}
        to={vec(90, 40)}
      />
      {/* the ring: rope between brass bands */}
      <Metal
        d={ROPE}
        evenOdd
        colors={HEMP}
        ink={INK_GOLD}
        width={0.8}
        vein={ROPE_LAY}
        veinColor="#5A3A14"
        veinWidth={0.9}
      />
      <Path
        path={ROPE_SHINE}
        style="stroke"
        strokeWidth={0.9}
        strokeCap="round"
        color="#FFFAEA"
        opacity={0.75}
      />
      <Metal
        d={BRASS}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        width={0.8}
        vein={BRASS_VEIN}
        veinColor={VEIN_GOLD}
        veinWidth={0.5}
        shine={arc(57.5, 200, 245)}
      />
      <Group opacity={0.75}>
        <Sweep t={t} d={BRASS} evenOdd every={5} phase={0.8} />
      </Group>
      {Array.from({ length: 7 }, (_, i) => (
        <Droplet key={i} t={t} i={i} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <Bubble key={i} t={t} i={i + 40} />
      ))}
      <CompassRose t={t} />
      {/* the shell at the foot, a pearl in it */}
      <Metal
        d={SHELL_EARS}
        colors={SHELL_COLORS}
        ink={INK_GOLD}
        width={0.9}
        from={vec(-8, 84)}
        to={vec(8, 91)}
      />
      <Metal
        d={SHELL}
        colors={SHELL_COLORS}
        ink={INK_GOLD}
        width={1}
        vein={SHELL_RIBS}
        veinColor="#A06A50"
        veinWidth={0.7}
        shine={`M${shellPt(ribA(1) + 0.08, 8)}L${shellPt(ribA(1) + 0.08, 20)}`}
        from={vec(-20, 62)}
        to={vec(20, 90)}
      />
      <Pearl t={t} />
      <Glint t={t} x={PX - 1.6} y={PY - 2} size={5} phase={0.9} speed={0.9} />
      <Glint t={t} x={CX} y={CY} size={5} phase={2.6} speed={0.9} />
      <Glint t={t} x={-50} y={-38} size={3.6} phase={4.1} />
    </Group>
  );
}

const TidalWave: ArtBorderDrawing = { back: TidalBack, front: TidalFront };

// ══ Plasma Core ══════════════════════════════════════════════════════

/** Plasma crackling round the rim, pulsing (rimfx's PLASMA_RIM). */
const PLASMA = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 2.2;
  float n = fbm(dir * 6.0 + vec2(s, -s));
  float n2 = fbm(dir * 9.0 - vec2(s * 1.3, s * 0.4));
  float width = 7.0 + 11.0 * n * (0.8 + 0.2 * sin(t * 5.0));
  float d = abs(r - 54.0 + (n2 - 0.5) * 6.0);
  float heat = (1.0 - d / width) * (0.7 + n) * (1.0 + flash * 0.4);
  if (heat <= 0.0) return half4(0.0);
  vec3 col = mix(vec3(0.9, 0.1, 0.75), vec3(0.2, 0.9, 1.0), smoothstep(0.3, 0.8, heat));
  col = mix(col, vec3(1.0), smoothstep(0.85, 1.2, heat));
  float a = smoothstep(0.05, 0.4, heat) * (0.85 + 0.15 * sin(t * 6.0));
  return half4(col * a, a);
}`;

const GUNMETAL = ["#F2F5FA", "#AEB6C2", "#5C6470", "#CDD4DE"];
const INK_STEEL = "#0C0F14";
const VEIN_STEEL = "#2A3038";
const REACTOR = ring(69, 61.6);
/** The conduit slot each quarter's charge runs in, between emitters. */
const GAP = 11;
const SLOT_IN = 64.1;
const SLOT_OUT = 66.5;
const SLOT_R = (SLOT_IN + SLOT_OUT) / 2;
const SLOTS = [0, 1, 2, 3]
  .map((k) => {
    const a0 = k * 90 + GAP;
    const a1 = k * 90 + 90 - GAP;
    return `M${at(a0, SLOT_OUT)}A${SLOT_OUT} ${SLOT_OUT} 0 0 1 ${at(a1, SLOT_OUT)}L${at(a1, SLOT_IN)}A${SLOT_IN} ${SLOT_IN} 0 0 0 ${at(a0, SLOT_IN)}Z`;
  })
  .join("");
/** Dividers across the slots, so the charge reads as a row of cells. */
const CELLS = 9;
const DIVIDERS = [0, 1, 2, 3]
  .map((k) =>
    Array.from({ length: CELLS - 1 }, (_, j) => {
      const a = k * 90 + GAP + ((90 - GAP * 2) * (j + 1)) / CELLS;
      return `M${at(a, SLOT_IN - 0.4)}L${at(a, SLOT_OUT + 0.4)}`;
    }).join(""),
  )
  .join("");
/** Grooves at the ring's edges, and hatching on the bare steel by each
 *  emitter. */
const REACTOR_VEIN =
  disc(62.6) +
  disc(68) +
  [0, 1, 2, 3]
    .map((k) =>
      [-1, 1]
        .map((s) =>
          Array.from({ length: 3 }, (_, j) => {
            const a = k * 90 + s * (7.6 + j * 1.3);
            return `M${at(a, 63)}L${at(a, 67.6)}`;
          }).join(""),
        )
        .join(""),
    )
    .join("");

/** The charge in quarter `k`, as an arc to trim. */
const CHARGE = [0, 1, 2, 3].map((k) =>
  arc(SLOT_R, k * 90 + GAP + 0.6, k * 90 + 90 - GAP - 0.6),
);

// Emitters at the compass points, each a finned steel housing with a
// crystal at its tip, pointing in at the core.
const EMIT_A = [0, 90, 180, 270];
const frame = (a: number) => {
  const o = polar(a * DEG, 1);
  return (u: number, v: number) =>
    `${f(o.x * u - o.y * v)} ${f(o.y * u + o.x * v)}`;
};
const emitter = (a: number) => {
  const P = frame(a);
  const body = `M${P(59.4, -4)}L${P(63, -7.6)}L${P(74.4, -7.6)}L${P(78.6, -4.6)}L${P(81.4, -3.4)}Q${P(83.2, 0)} ${P(81.4, 3.4)}L${P(78.6, 4.6)}L${P(74.4, 7.6)}L${P(63, 7.6)}L${P(59.4, 4)}Z`;
  const fins = [65.6, 69.2, 72.8]
    .map(
      (u) =>
        `M${P(u - 1, -10.6)}L${P(u + 1, -10.6)}L${P(u + 1, 10.6)}L${P(u - 1, 10.6)}Z`,
    )
    .join("");
  const coil = `M${P(75.4, -6.4)}L${P(77.8, -5.2)}L${P(77.8, 5.2)}L${P(75.4, 6.4)}Z`;
  const crystal = `M${P(53.6, 0)}L${P(57.6, -3.6)}L${P(61.4, 0)}L${P(57.6, 3.6)}Z`;
  const crystalLit = `M${P(53.6, 0)}L${P(57.6, -3.6)}L${P(61.4, 0)}Z`;
  return {
    body,
    fins,
    coil,
    crystal,
    crystalLit,
    vein: `M${P(61, 0)}L${P(75, 0)}M${P(61.6, -5.4)}L${P(61.6, 5.4)}`,
    shine: `M${P(63.4, -6.4)}L${P(74, -6.4)}`,
    bolt: polar(a * DEG, 80),
    tip: polar(a * DEG, 54.6),
  };
};
const EMITTERS = EMIT_A.map(emitter);
const EMIT_BODY = EMITTERS.map((e) => e.body).join("");
const EMIT_FINS = EMITTERS.map((e) => e.fins).join("");
const EMIT_COIL = EMITTERS.map((e) => e.coil).join("");
const EMIT_VEIN = EMITTERS.map((e) => e.vein).join("");
const EMIT_SHINE = EMITTERS.map((e) => e.shine).join("");

/** Forked arcs from an emitter's crystal into the plasma: three shapes
 *  each, a different one every discharge. */
const VARIANTS = 3;
const ARCS = EMIT_A.map((a, k) =>
  Array.from({ length: VARIANTS }, (_, v) => {
    const seed = k * 37 + v * 11;
    // two long forks crawling along the core either way, and a short one
    // striking straight in
    return [-1, 1, 0]
      .map((side, b) => {
        const spread = side
          ? side * (0.3 + rnd(seed + b) * 0.22)
          : (rnd(seed + 5) - 0.5) * 0.16;
        const r1 = side ? 50.5 + rnd(seed + b + 3) * 2.5 : 48.5;
        const steps = side ? 9 : 5;
        let d = "";
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const inner = s && s < steps;
          const ja = inner ? (rnd(seed * 7 + b * 13 + s) - 0.5) * 0.07 : 0;
          const jr = inner ? (rnd(seed * 5 + b * 17 + s) - 0.5) * 3.2 : 0;
          const p = polar(
            a * DEG + spread * Math.pow(u, 0.75) + ja,
            54 + (r1 - 54) * u + jr,
          );
          d += `${s ? "L" : "M"}${f(p.x)} ${f(p.y)}`;
        }
        return d;
      })
      .join("");
  }),
);

const CYCLE = 2.4;
const FILL = 0.8;
/** Quarter k charges clockwise toward emitter k + 1, which fires when it's
 *  full; quarters run a quarter-cycle apart. */
const phaseOf = (t: number, k: number) => {
  "worklet";
  return ((((t + k * (CYCLE / 4)) % CYCLE) + CYCLE) % CYCLE) / CYCLE;
};
const fireOf = (p: number) => {
  "worklet";
  if (p < FILL) return 0;
  // full for a moment, then dying away
  const q = (p - FILL) / 0.2;
  return q < 0.45 ? 1 : Math.max(0, 1 - (q - 0.45) / 0.55);
};

function Meter({ t, k }: { t: Clock; k: number }) {
  const end = useDerivedValue(() => {
    const p = phaseOf(t.value, k);
    return p < FILL ? p / FILL : Math.max(0, 1 - (p - FILL) / 0.12);
  });
  const opacity = useDerivedValue(
    () => 0.75 + 0.25 * Math.sin(t.value * 9 + k),
  );
  const color = k % 2 ? "#5FF2FF" : "#FF6FDC";
  return (
    <Group opacity={opacity} blendMode="screen">
      {/* the conduit, faintly alive even when drained */}
      <Path
        path={CHARGE[k]}
        style="stroke"
        strokeWidth={2.2}
        color={color}
        opacity={0.28}
      />
      <Path
        path={CHARGE[k]}
        style="stroke"
        strokeWidth={4.4}
        color={color}
        end={end}
        opacity={0.6}
      >
        <BlurMask blur={2.2} style="normal" />
      </Path>
      <Path
        path={CHARGE[k]}
        style="stroke"
        strokeWidth={2.2}
        color={color}
        end={end}
      />
      <Path
        path={CHARGE[k]}
        style="stroke"
        strokeWidth={0.8}
        color="#FFFFFF"
        end={end}
      />
    </Group>
  );
}

/** Emitter `e` fires when quarter (e + 3) % 4 has filled. */
const quarterFor = (e: number) => (e + 3) % 4;

function Discharge({ t, e, v }: { t: Clock; e: number; v: number }) {
  const q = quarterFor(e);
  const opacity = useDerivedValue(() => {
    const shifted = t.value + q * (CYCLE / 4);
    const which = Math.floor(shifted / CYCLE) % VARIANTS;
    if (which !== v) return 0;
    const fire = fireOf(phaseOf(t.value, q));
    return fire * (0.75 + 0.25 * Math.sin(t.value * 70 + v));
  });
  const color = e % 2 ? "#FF3FD0" : "#1FE0FF";
  // a violet glow under the bolt, so it shows on the white-hot plasma
  return (
    <Group opacity={opacity}>
      <Path
        path={ARCS[e][v]}
        style="stroke"
        strokeWidth={7}
        color="#B040FF"
        strokeJoin="round"
        opacity={0.45}
      >
        <BlurMask blur={2.4} style="normal" />
      </Path>
      <Path
        path={ARCS[e][v]}
        style="stroke"
        strokeWidth={3.8}
        color="#5A0CC0"
        strokeJoin="round"
        strokeCap="round"
      />
      <Path
        path={ARCS[e][v]}
        style="stroke"
        strokeWidth={2.6}
        color={color}
        strokeJoin="round"
      />
      <Path
        path={ARCS[e][v]}
        style="stroke"
        strokeWidth={1.1}
        color="#FFFFFF"
        strokeJoin="round"
      />
    </Group>
  );
}

function Crystal({ t, e }: { t: Clock; e: number }) {
  const q = quarterFor(e);
  // brightens as its quarter charges, flares when it fires
  const opacity = useDerivedValue(() => {
    const p = phaseOf(t.value, q);
    return 0.3 + (p < FILL ? p / FILL : 0) * 0.35 + fireOf(p) * 0.7;
  });
  const em = EMITTERS[e];
  const glow = e % 2 ? "#FF5FD8" : "#5FF2FF";
  return (
    <Group>
      <Path path={em.crystal}>
        <LinearGradient
          start={vec(em.tip.x * 1.1, em.tip.y * 1.1)}
          end={vec(em.tip.x * 0.98, em.tip.y * 0.98)}
          colors={e % 2 ? ["#5A0A4A", "#FF8AE4"] : ["#06404A", "#8AF6FF"]}
        />
      </Path>
      <Path path={em.crystalLit} color="#FFFFFF" opacity={0.35} />
      <Path
        path={em.crystal}
        style="stroke"
        strokeWidth={0.7}
        strokeJoin="round"
        color={INK_STEEL}
      />
      <Group blendMode="screen" opacity={opacity}>
        <Circle cx={em.tip.x * 1.04} cy={em.tip.y * 1.04} r={5.4} color={glow}>
          <BlurMask blur={3.4} style="normal" />
        </Circle>
        <Path path={em.crystal} color="#FFFFFF" opacity={0.7} />
      </Group>
    </Group>
  );
}

function PlasmaBack({ t }: { t: Clock }) {
  const pink = useDerivedValue(() => 0.35 + 0.2 * Math.sin(t.value * 3));
  const cyan = useDerivedValue(() => 0.35 - 0.2 * Math.sin(t.value * 3));
  return (
    <Group>
      <Halo r={92} color="#FF3FC8" opacity={pink} />
      <Halo r={86} color="#3FE8FF" opacity={cyan} />
    </Group>
  );
}

function PlasmaFront({ t }: { t: Clock }) {
  // the plasma surges each time an emitter fires
  const surge = useDerivedValue(() => {
    let m = 0;
    for (let k = 0; k < 4; k++) m = Math.max(m, fireOf(phaseOf(t.value, k)));
    return m * 0.6;
  });
  return (
    <Group>
      <Fx sksl={PLASMA} t={t} flash={surge} extent={74} />
      <Metal
        d={REACTOR}
        evenOdd
        colors={GUNMETAL}
        ink={INK_STEEL}
        width={1}
        vein={REACTOR_VEIN}
        veinColor={VEIN_STEEL}
        veinWidth={0.6}
        shine={arc(67.9, 196, 232)}
      />
      {/* the conduit slots, dark until the charge runs in them */}
      <Path path={SLOTS} color="#121624" />
      {[0, 1, 2, 3].map((k) => (
        <Meter key={k} t={t} k={k} />
      ))}
      <Path path={DIVIDERS} style="stroke" strokeWidth={0.9} color="#1A1E26" />
      <Path
        path={SLOTS}
        style="stroke"
        strokeWidth={0.7}
        strokeJoin="round"
        color={INK_STEEL}
      />
      <Group opacity={0.6}>
        <Sweep t={t} d={REACTOR} evenOdd every={4.8} phase={0.4} />
      </Group>
      {/* the four emitters */}
      <Metal d={EMIT_FINS} colors={GUNMETAL} ink={INK_STEEL} width={0.8} />
      <Metal
        d={EMIT_BODY}
        colors={SILVER}
        ink={INK_STEEL}
        width={1}
        vein={EMIT_VEIN}
        veinColor={VEIN_SILVER}
        veinWidth={0.6}
        shine={EMIT_SHINE}
      />
      <Metal d={EMIT_COIL} colors={GOLD} ink={INK_GOLD} width={0.7} />
      {EMITTERS.map((em, e) => (
        <Circle key={e} cx={em.bolt.x} cy={em.bolt.y} r={1.5}>
          <RadialGradient
            c={vec(em.bolt.x - 0.5, em.bolt.y - 0.5)}
            r={2.2}
            colors={["#FFFFFF", "#9AA4B4", "#3A424E"]}
          />
        </Circle>
      ))}
      {EMITTERS.map((_, e) => (
        <Crystal key={e} t={t} e={e} />
      ))}
      {EMITTERS.map((_, e) =>
        Array.from({ length: VARIANTS }, (__, v) => (
          <Discharge key={`${e}-${v}`} t={t} e={e} v={v} />
        )),
      )}
      <Glint t={t} x={-48} y={-48} size={4.5} phase={0.7} />
      <Glint t={t} x={0} y={-77} size={4} phase={2.6} />
    </Group>
  );
}

const PlasmaCore: ArtBorderDrawing = { back: PlasmaBack, front: PlasmaFront };

export const CURRENTS_ART: Record<string, ArtBorderDrawing> = {
  aurora: Aurora,
  "tidal-wave": TidalWave,
  "plasma-core": PlasmaCore,
};

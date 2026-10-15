// Baroque Silver: an engraved cartouche. Two thick acanthus bands, cut
// with grooves, meet in a bud at the top and in two pointed leaves at
// the foot; great scrolls curl out at the upper corners, and leafy
// fronds fan out at the lower sides, stirring. A sapphire sits in the
// bud and the light runs over the silver.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { Gem, Sweep } from "./crowns";
import { LEAF, acanthus, curl } from "./crest";
import { Glint, Halo, type ArtBorderDrawing, type Clock } from "./kit";

const INK = "#1E242C";
const GROOVE = "#4A5462";
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const DEG = Math.PI / 180;

type Pt = [number, number];
const fmt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

const catmull = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const f = (i: 0 | 1) =>
    0.5 *
    (2 * b[i] +
      (c[i] - a[i]) * u +
      (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u * u +
      (3 * b[i] - a[i] - 3 * c[i] + d[i]) * u * u * u);
  return [f(0), f(1)];
};

/** A band of varying width along a smooth curve through `points`, with
 *  grooves cut along its length and a line of shine. */
function ribbon(points: Pt[], widths: number[]) {
  const S = 10;
  const mid: Pt[] = [];
  const wid: number[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const a = points[Math.max(i - 1, 0)];
    const d = points[Math.min(i + 2, n - 1)];
    for (let j = 0; j < S; j++) {
      mid.push(catmull(a, points[i], points[i + 1], d, j / S));
      wid.push(widths[i] + ((widths[i + 1] - widths[i]) * j) / S);
    }
  }
  mid.push(points[n - 1]);
  wid.push(widths[n - 1]);
  const along = (offset: number) =>
    mid.map((p, k): Pt => {
      const a = mid[Math.max(k - 1, 0)];
      const b = mid[Math.min(k + 1, mid.length - 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const h = (wid[k] / 2) * offset;
      return [p[0] - ((b[1] - a[1]) / l) * h, p[1] + ((b[0] - a[0]) / l) * h];
    });
  const line = (pts: Pt[], from: number, to: number) =>
    `M${pts
      .slice(Math.round(from * pts.length), Math.round(to * pts.length))
      .map(fmt)
      .join("L")}`;
  return {
    outline: `M${along(1).map(fmt).join("L")}L${along(-1).reverse().map(fmt).join("L")}Z`,
    grooves:
      line(along(0.55), 0.04, 0.9) +
      line(along(0.15), 0.08, 0.8) +
      line(along(-0.5), 0.12, 0.95),
    shine: line(along(-0.15), 0.1, 0.7),
  };
}

/** A serrated acanthus leaf, pointing up from its stalk: lobes leaning
 *  toward the tip, notched between. */
function frond(len: number, w: number, lobes: number) {
  const width = (s: number) =>
    w * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.7);
  const lobe = Array.from({ length: lobes }, (_, j) => {
    const s0 = j / lobes;
    const s1 = (j + 0.85) / lobes;
    return {
      notch: [width(s0) * 0.5, -len * s0] as Pt,
      ctrl: [width(s0) * 1.1, -len * (s0 + 0.25 / lobes)] as Pt,
      tip: [width(s1), -len * s1] as Pt,
    };
  });
  const flip = (p: Pt): Pt => [-p[0], p[1]];
  // up the right side, notch to lobe tip; then down the left, in reverse
  const right = lobe
    .map((l) => `L${fmt(l.notch)}Q${fmt(l.ctrl)} ${fmt(l.tip)}`)
    .join("");
  const left = [...lobe]
    .reverse()
    .map(
      (l) => `L${fmt(flip(l.tip))}Q${fmt(flip(l.ctrl))} ${fmt(flip(l.notch))}`,
    )
    .join("");
  return `M0 0${right}L0 ${-len}${left}Z`;
}

// The right half; the left is its mirror image.

const BAND = ribbon(
  [
    [2, -56],
    [18, -60],
    [37, -56],
    [51, -42],
    [58, -23],
    [59, 0],
    [55, 19],
    [46, 35],
    [34, 47],
    [19, 56],
    [6, 63],
    [1, 70],
  ],
  [5, 10, 15, 15, 12, 10, 12, 13, 11, 8, 5, 2],
);

const SCROLLS = [
  // the great scroll at the upper corner
  ...acanthus(50, -34, -1.45, 84, 7.4, 16, true),
  // a smaller one curling out below the side
  ...acanthus(58, 22, 0.3, 50, 6.8, 12, true),
];

/** The fronds fanned at the lower side, from out to down. */
const FRONDS = [
  { dir: -10, len: 46, w: 8 },
  { dir: 18, len: 42, w: 7.5 },
  { dir: 46, len: 36, w: 7 },
  { dir: 74, len: 28, w: 6 },
].map((f) => ({ dir: f.dir * DEG, len: f.len, d: frond(f.len, f.w, 5) }));
const FROND_ROOT: Pt = [50, 42];

/** The bud on top: two small curls opening out of the bands. */
const BUD = curl(0, -58, -1.75, 22, 4.4, 6);
/** The pointed leaf at the foot, leaning in to meet its twin. */
const FOOT = frond(26, 6, 4);

const ALL_D = [
  BAND.outline,
  BUD.outline,
  ...SCROLLS.map((s) => s.outline),
].join("");

function Silver({ d, vein }: { d: string; vein?: string }) {
  return (
    <Group>
      <Path path={d}>
        <LinearGradient
          start={vec(-20, -80)}
          end={vec(80, 80)}
          colors={SILVER}
        />
      </Path>
      <Path path={d} style="stroke" strokeWidth={1.2} color={INK} />
      {vein ? (
        <Path path={vein} style="stroke" strokeWidth={0.7} color={GROOVE} />
      ) : null}
    </Group>
  );
}

function BackHalf({ t }: { t: Clock }) {
  // the fronds stir, hinged at their root
  const stir = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.3) * 0.04 },
  ]);
  return (
    <Group>
      <Group transform={stir} origin={vec(FROND_ROOT[0], FROND_ROOT[1])}>
        {FRONDS.map((f, k) => (
          <Group
            key={k}
            transform={[
              { translateX: FROND_ROOT[0] },
              { translateY: FROND_ROOT[1] },
              { rotate: f.dir + Math.PI / 2 },
            ]}
          >
            <Silver d={f.d} vein={`M0 -2L0 ${-f.len * 0.85}`} />
          </Group>
        ))}
      </Group>
      {SCROLLS.map((s, i) => (
        <Silver key={i} d={s.outline} vein={s.vein} />
      ))}
    </Group>
  );
}

function FrontHalf() {
  return (
    <Group>
      <Silver d={BAND.outline} />
      <Path
        path={BAND.grooves}
        style="stroke"
        strokeWidth={0.8}
        color={GROOVE}
      />
      <Path
        path={BAND.shine}
        style="stroke"
        strokeWidth={1.2}
        color="#FFFFFF"
        opacity={0.75}
      />
      <Silver d={BUD.outline} vein={BUD.vein} />
      <Group
        transform={[
          { translateX: 5 },
          { translateY: 62 },
          { rotate: Math.PI + 0.2 },
        ]}
      >
        <Silver d={FOOT} vein="M0 -2L0 -22" />
      </Group>
    </Group>
  );
}

const MIRROR = [{ scaleX: -1 }];

function BaroqueBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.32 + 0.1 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={92} color="#CFE0FF" opacity={glow} />
      <BackHalf t={t} />
      <Group transform={MIRROR}>
        <BackHalf t={t} />
      </Group>
      <Sweep t={t} d={ALL_D} every={4.5} />
    </Group>
  );
}

function BaroqueFront({ t }: { t: Clock }) {
  const shine = useDerivedValue(() => 0.5 + 0.4 * Math.sin(t.value * 2.2));
  return (
    <Group>
      <FrontHalf />
      <Group transform={MIRROR}>
        <FrontHalf />
      </Group>
      <Sweep t={t} d={BAND.outline} every={4.5} phase={0.3} />
      {/* the bud's centre: a leaf with a sapphire */}
      <Group transform={[{ translateY: -56 }]}>
        <Silver d={LEAF(20, 6)} vein="M0 -2L0 -16" />
      </Group>
      <Circle cx={0} cy={-64} r={7} color="#5AA8FF" opacity={shine}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={-64}
        w={6}
        h={8}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
      <Glint t={t} x={0} y={-64} size={5} phase={0.5} speed={1} />
      <Glint t={t} x={-62} y={-50} size={4} phase={1.9} speed={1.1} />
      <Glint t={t} x={58} y={10} size={4} phase={3.2} speed={0.9} />
    </Group>
  );
}

export const BAROQUE_ART = {
  "baroque-silver": {
    back: BaroqueBack,
    front: BaroqueFront,
  } satisfies ArtBorderDrawing,
};

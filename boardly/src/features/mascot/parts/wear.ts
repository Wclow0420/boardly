// Clothes: tops, bottoms and shoes, cut to the meeple (see ../rig for
// where its arms, waist and legs are). The cut follows the body's own
// curves: the helpers below trace BODY's left arm and leg and mirror
// them, so a sleeve ends exactly on the arm and a hem on the leg.

import type { EmblemPart } from "@/components/engraved/emblem";
import { both, ell, type PartDef } from "../rig";

// ── the body's outline, traced ───────────────────────────────────────

type P = [number, number];
type Bez = [P, P, P, P];
/** A step along an outline: a line to a point, or a curve (two
 *  controls and the end). */
type Seg = P | [P, P, P];
interface Run {
  from: P;
  segs: Seg[];
}

/** BODY's left side: the arm's top from the neck to the hand, its
 *  underside back to the armpit, and the armpit into the waist. */
const ARM_TOP: Bez = [[34.2, 40], [24.8, 41.4], [14.4, 44.8], [12.4, 51.2]];
const ARM_UNDER: Bez = [[12.4, 51.2], [10.6, 57.8], [18, 61], [26.6, 62]];
const ARMPIT: Bez = [[26.6, 62], [27.8, 62.2], [28.2, 63.2], [27.8, 64.2]];
/** The outside of the left leg (from the waist down) and its inside
 *  (from the crotch down), as x at a height. */
const sideX = (y: number) => 27.8 - ((y - 64.2) * 9.2) / 24.2;
const innerX = (y: number) => 50 - ((y - 83.2) * 4.4) / 11;

const r = (v: number) => +v.toFixed(2);
const pt = (p: P) => `${r(p[0])} ${r(p[1])}`;
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const flip = (p: P): P => [100 - p[0], p[1]];
const isLine = (s: Seg): s is P => typeof s[0] === "number";

function split(b: Bez, t: number): [Bez, Bez] {
  const [p0, p1, p2, p3] = b;
  const a = lerp(p0, p1, t);
  const m = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, m, t);
  const e = lerp(m, c, t);
  const f = lerp(d, e, t);
  return [
    [p0, a, d, f],
    [f, e, c, p3],
  ];
}
const point = (b: Bez, t: number) => split(b, t)[0][3];
/** The piece of a curve between t0 and t1. */
function cut(b: Bez, t0: number, t1: number): Bez {
  if (t1 >= 1) return split(b, t0)[1];
  const left = split(b, t1)[0];
  return t0 <= 0 ? left : split(left, t0 / t1)[1];
}
/** Where on a curve x (axis 0) or y (1) reaches `v`, between lo and hi
 *  (where it runs one way). */
function solve(b: Bez, axis: 0 | 1, v: number, lo = 0, hi = 1) {
  const rising = point(b, hi)[axis] > point(b, lo)[axis];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (point(b, mid)[axis] < v === rising) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const tTop = (x: number) => solve(ARM_TOP, 0, x);
const tUnder = (x: number) => solve(ARM_UNDER, 0, x, 0.15, 1);
const curve = (b: Bez): Seg => [b[1], b[2], b[3]];
const segs = (segments: Seg[]) =>
  segments.map((s) => (isLine(s) ? `L${pt(s)}` : `C${pt(s[0])} ${pt(s[1])} ${pt(s[2])}`)).join("");
const mirror = (run: Run): Run => ({
  from: flip(run.from),
  segs: run.segs.map((s) => (isLine(s) ? flip(s) : [flip(s[0]), flip(s[1]), flip(s[2])])),
});
function reverse(run: Run): Run {
  const ends = [run.from, ...run.segs.map((s) => (isLine(s) ? s : s[2]))];
  const out: Seg[] = [];
  for (let i = run.segs.length - 1; i >= 0; i--) {
    const s = run.segs[i];
    out.push(isLine(s) ? ends[i] : [s[1], s[0], ends[i]]);
  }
  return { from: ends[ends.length - 1], segs: out };
}
/** The run as points, for finding where stripes cross it. */
function sample(run: Run): P[] {
  const out: P[] = [run.from];
  let at = run.from;
  for (const s of run.segs) {
    if (isLine(s)) out.push(s);
    else for (let i = 1; i <= 12; i++) out.push(point([at, s[0], s[1], s[2]], i / 12));
    at = isLine(s) ? s : s[2];
  }
  return out;
}

/** A garment's outline round the left arm: from the neck along the top
 *  of the arm to the cuff at x, back along the underside, round the
 *  armpit and down the side to the hem (`flare` lets it out). */
function leftSide(cuff: number, hem: number, flare = 0): Run {
  const t = tTop(cuff);
  const u = tUnder(cuff);
  return {
    from: [34.2, 40],
    segs: [
      curve(cut(ARM_TOP, 0, t)),
      point(ARM_UNDER, u),
      curve(cut(ARM_UNDER, u, 1)),
      curve(ARMPIT),
      [sideX(hem) - flare, hem],
    ],
  };
}

interface Bodice {
  /** The path, closed. */
  d: string;
  /** The outline as points (the neck left out), for stripes. */
  poly: P[];
}
/** A top: sleeves to `cuff`, the hem at `hem` (sagging by `sag` in the
 *  middle), and `neck`, the path back from the right of the neck
 *  (65.8, 40) to the left (34.2, 40). */
function bodice(o: { cuff: number; hem: number; flare?: number; sag?: number; neck: string }): Bodice {
  const left = leftSide(o.cuff, o.hem, o.flare);
  const right = reverse(mirror(left));
  const hem = o.sag ? `Q50 ${r(o.hem + o.sag * 2)} ${pt(right.from)}` : `L${pt(right.from)}`;
  return {
    d: `M${pt(left.from)}${segs(left.segs)}${hem}${segs(right.segs)}${o.neck}Z`,
    poly: [...sample(left), ...sample(right)],
  };
}

/** A band round the left arm between x0 and x1 (a cuff, a stripe). */
function armBand(x0: number, x1: number) {
  const a = tTop(x1);
  const b = tTop(x0);
  const c = tUnder(x0);
  const e = tUnder(x1);
  return `M${pt(point(ARM_TOP, a))}${segs([curve(cut(ARM_TOP, a, b)), point(ARM_UNDER, c), curve(cut(ARM_UNDER, c, e))])}Z`;
}
/** A ribbed cuff on the left arm from x0 to x1: the band, with its ribs
 *  running along the arm. */
function ribCuff(x0: number, x1: number, m: `#${string}`): EmblemPart {
  const [top0, under0] = armAt(x0);
  const [top1, under1] = armAt(x1);
  const poly: P[] = [top1, top0, under0, under1];
  const ys: number[] = [];
  for (let y = Math.min(top0[1], top1[1]) + 1; y < Math.max(under0[1], under1[1]) - 0.6; y += 1.1) ys.push(r(y));
  return { d: armBand(x0, x1), m, ink: 1, round: true, vein: hStripes(poly, ys, 0.35), vw: 0.35 };
}

/** The top and underside of the left arm at x. */
const armAt = (x: number): [P, P] => [point(ARM_TOP, tTop(x)), point(ARM_UNDER, tUnder(x))];

/** Where a horizontal (axis 1) or vertical (axis 0) line at `v` is
 *  inside an outline: pairs of the other coordinate. */
function spans(poly: P[], axis: 0 | 1, v: number): [number, number][] {
  const o = axis === 1 ? 0 : 1;
  const hits: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (a[axis] <= v !== b[axis] <= v) hits.push(a[o] + ((v - a[axis]) * (b[o] - a[o])) / (b[axis] - a[axis]));
  }
  hits.sort((p, q) => p - q);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < hits.length; i += 2) out.push([hits[i], hits[i + 1]]);
  return out;
}
/** Stripes across an outline at each y, kept `inset` in from its edge
 *  and between `lo` and `hi`. */
function hStripes(poly: P[], ys: number[], inset: number, lo = 0, hi = 100) {
  return ys
    .flatMap((y) =>
      spans(poly, 1, y)
        .map(([a, b]): P => [Math.max(a + inset, lo), Math.min(b - inset, hi)])
        .filter(([a, b]) => b - a > 1)
        .map(([a, b]) => `M${r(a)} ${y}H${r(b)}`),
    )
    .join("");
}

/** Many little dots, as path data. */
const dots = (at: P[], rad: number) => at.map(([x, y]) => ell(x, y, rad, rad)).join("");

/** A soft fuzzy outline: an ellipse with `n` bumps round it. */
function fluff(cx: number, cy: number, rx: number, ry: number, n: number, puff: number) {
  const at = (k: number, grow = 0): P => {
    const a = (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * (rx + grow), cy + Math.sin(a) * (ry + grow * (ry / rx) * 1.6)];
  };
  let d = `M${pt(at(0))}`;
  for (let k = 0; k < n; k++) d += `Q${pt(at(k + 0.5, puff))} ${pt(at(k + 1))}`;
  return `${d}Z`;
}

/** A frog button: a knot with a loop of cord either side. */
const frog = (x: number, y: number, cord: string): EmblemPart[] => [
  { line: ell(x - 1.9, y, 1.6, 0.8), color: cord, w: 0.6 },
  { line: ell(x + 1.9, y, 1.6, 0.8), color: cord, w: 0.6 },
  { d: ell(x, y, 0.95, 0.95), m: "gold", ink: 0.45, round: true },
];

/** A rib knit: short lines across a band. */
const ribs = (x0: number, x1: number, y0: number, y1: number, step: number, slope = 0) => {
  let d = "";
  for (let x = x0; x <= x1 + 0.01; x += step) d += `M${r(x)} ${y0}L${r(x + slope)} ${y1}`;
  return d;
};

// The ordinary crew neck and a lower round one.
const CREW = "C62.6 43.2 56.6 45 50 45C43.4 45 37.4 43.2 34.2 40";
const DEEP_CREW = "C62.6 43.6 56.6 45.4 50 45.4C43.4 45.4 37.4 43.6 34.2 40";

// ── tops ─────────────────────────────────────────────────────────────

const HOODIE = "#3E7A5A";
const SUIT = "#2E3448";
const NAVY = "#22346A";
const JERSEY = "#2659B8";
const DENIM_BIB = "#4E74AA";
const SILK = "#C8213A";
const KNIT = "#3F8F86";
const CREAM = "#F4F0E8";
const THREAD = "#E8A84A";

export const TOPS: Record<string, PartDef> = {
  tee: {
    name: "Tee",
    price: 0,
    draw: () => [
      {
        d: "M34.2 40C29.6 40.7 26.6 41.6 24 42.6L23.4 61.6C24.6 61.8 25.6 61.9 26.6 62C27.8 62.2 28.2 63.2 27.8 64.2L26.8 67H73.2L72.2 64.2C71.8 63.2 72.2 62.2 73.4 62C74.4 61.9 75.4 61.8 76.6 61.6L76 42.6C73.4 41.6 70.4 40.7 65.8 40C62.6 43.2 56.6 45 50 45C43.4 45 37.4 43.2 34.2 40Z",
        m: CREAM,
        ink: 1.2,
        round: true,
        vein: "M24.6 46V59M75.4 46V59",
        vw: 0.6,
      },
    ],
  },
  sweater: {
    name: "Sweater",
    price: 400,
    draw: () => [
      {
        d: "M34.2 40C27.4 41 21.6 42.8 18 45.6L18.6 60.8C21.4 61.4 24 61.8 26.6 62C27.8 62.2 28.2 63.2 27.8 64.2L26.6 67.6H73.4L72.2 64.2C71.8 63.2 72.2 62.2 73.4 62C76 61.8 78.6 61.4 81.4 60.8L82 45.6C78.4 42.8 72.6 41 65.8 40C62.6 43.4 56.6 45.2 50 45.2C43.4 45.2 37.4 43.4 34.2 40Z",
        m: "#C2203A",
        ink: 1.2,
        round: true,
        vein: "M21 46.4V60.4M79 46.4V60.4M28.4 64.6H71.6M36 45.6C40 47.6 60 47.6 64 45.6",
        vw: 0.6,
      },
    ],
  },

  hoodie: {
    name: "Hoodie",
    price: 500,
    draw: () => {
      const body = bodice({ cuff: 18.4, hem: 68.6, flare: 0.3, neck: DEEP_CREW });
      return [
        // the hood, bunched up behind the neck on both shoulders
        ...both({
          d: "M34.2 40C32.6 38.6 31.6 37.2 31 35.8C27.6 35.6 23.6 37.6 21.6 41.6C21.2 42.6 21.4 43.2 22 43.2C25.4 41.8 29.6 40.6 34.2 40Z",
          m: "#336A4C",
          ink: 1.2,
          round: true,
          vein: "M30.4 37.2C27.6 37.6 25 39.2 23.6 41.4",
          vw: 0.6,
        }),
        {
          d: body.d,
          m: HOODIE,
          ink: 1.2,
          round: true,
          vein: "M24.4 44.6C25.6 49 25.4 55 24.2 60.4M75.6 44.6C74.4 49 74.6 55 75.8 60.4M30.6 47C31.4 52 31.6 58 30.8 63M69.4 47C68.6 52 68.4 58 69.2 63",
          vw: 0.6,
        },
        // ribbed cuffs and hem
        ...both(ribCuff(18.4, 21.4, "#336A4C")),
        {
          d: `M${r(sideX(65.6) - 0.3)} 65.6H${r(100 - sideX(65.6) + 0.3)}L${r(100 - sideX(68.6) + 0.3)} 68.6H${r(sideX(68.6) - 0.3)}Z`,
          m: "#336A4C",
          ink: 1,
          round: true,
          vein: ribs(28, 72, 66, 68.2, 1.4),
          vw: 0.35,
        },
        // the kangaroo pocket
        {
          d: "M38.2 54.6H61.8C63.4 57.4 65 60.4 66.2 64.6H33.8C35 60.4 36.6 57.4 38.2 54.6Z",
          m: HOODIE,
          ink: 1.1,
          round: true,
          vein: "M38.2 54.6C37.4 58 37.6 61.6 38.6 64.6M61.8 54.6C62.6 58 62.4 61.6 61.4 64.6",
          vw: 0.6,
          shine: "M41 56.4H50",
          sw: 0.6,
        },
        // drawstrings
        { dark: ell(46.4, 45.8, 0.55, 0.55) + ell(53.6, 45.8, 0.55, 0.55) },
        { line: "M46.4 46.2C46.2 48.6 45.6 50.6 45.4 53", color: CREAM, w: 0.8 },
        { line: "M53.6 46.2C53.8 48.6 54.6 50.2 54.8 52.4", color: CREAM, w: 0.8 },
        { line: "M45.4 52.4V54.2M54.8 51.8V53.6", color: "#9AA4B2", w: 1.1 },
      ];
    },
  },

  suit: {
    name: "Suit & tie",
    price: 1200,
    draw: () => {
      const jacket = bodice({ cuff: 20.4, hem: 69.2, flare: 0.2, neck: CREW });
      return [
        // shirt cuffs peeping out of the sleeves
        ...both({ d: armBand(18.4, 21), m: CREAM, ink: 1, round: true }),
        {
          d: jacket.d,
          m: SUIT,
          ink: 1.2,
          round: true,
          vein: "M24.8 45C26 50 25.8 55 24.6 60.2M75.2 45C74 50 74.2 55 75.4 60.2M50 59V69",
          vw: 0.6,
        },
        // the shirt in the open front
        {
          d: "M37.4 41.6C41.2 44.2 45.4 45.2 50 45.2C54.6 45.2 58.8 44.2 62.6 41.6L50 59Z",
          m: CREAM,
          ink: 1,
          round: true,
        },
        // its collar
        ...both({ d: "M37.6 41.6C40.6 43.6 44.6 45 49.4 45.4L45.6 49Z", m: CREAM, ink: 0.9, round: true }),
        // the tie: knot, then blade
        {
          d: "M48.4 45.6H51.6L52.6 57.2L50 59.6L47.4 57.2Z",
          m: "#B8283C",
          ink: 1,
          round: true,
          vein: "M48.2 50.4L52 48.4M47.8 54.2L52.4 51.8",
          vw: 0.7,
        },
        { d: "M47.8 45.2H52.2L51.4 48.2H48.6Z", m: "#9A1E30", ink: 0.9, round: true },
        // lapels
        ...both({
          d: "M37.4 41.6L48.8 57.2L46.8 58C42 54.4 37.8 51.4 32.8 48.2L35 46.8L33.4 45.6L34.8 41.2Z",
          m: "#3A4258",
          ink: 1,
          round: true,
          vein: "M36.6 43.4L46.8 56.2",
          vw: 0.5,
        }),
        // a breast pocket with a square in it
        { d: "M57.8 51.4L61.6 49.8L62.8 51.6L59.6 52.6Z", m: "#E07AA8", ink: 0.8, round: true },
        { line: "M56.6 52.8L63.8 50.6", color: "#141822", w: 0.7 },
        // buttons
        { d: ell(50, 61.6, 1.05, 1.05), m: "#2A2E3A", ink: 0.5, round: true },
        { d: ell(50, 65.6, 1.05, 1.05), m: "#2A2E3A", ink: 0.5, round: true },
        // the side pockets' flaps
        { line: "M31.4 63.4L39.6 63.8M60.4 63.8L68.6 63.4", color: "#141822", w: 0.7 },
      ];
    },
  },

  sailor: {
    name: "Sailor stripes",
    price: 350,
    draw: () => {
      const shirt = bodice({ cuff: 21.6, hem: 67.4, neck: "Q50 43.4 34.2 40" });
      const torso = hStripes(shirt.poly, [46.6, 50.2, 53.8, 57.4, 61, 64.6], 0.9, 29, 71);
      // round the sleeves, the stripes run up and down
      const sleeve = [23.8, 27]
        .map((x) => {
          const [top, under] = armAt(x);
          return `M${r(x)} ${r(top[1] + 0.9)}V${r(under[1] - 0.9)}`;
        })
        .join("");
      return [
        {
          d: shirt.d,
          m: CREAM,
          ink: 1.2,
          round: true,
          vein: "M29.2 42C29 48 28.6 56 28.2 61.4M70.8 42C71 48 71.4 56 71.8 61.4",
          vw: 0.5,
        },
        { line: torso, color: NAVY, w: 1.5 },
        ...both({ line: sleeve, color: NAVY, w: 1.5 }),
        // the boat neck's edge, and a red knot of a scarf
        { line: "M35.8 41.2Q50 44.4 64.2 41.2", color: NAVY, w: 0.9 },
        { d: "M47 43.2H53L52 46.2H48Z", m: "#C2203A", ink: 0.9, round: true },
        ...both({ d: "M48.2 45.6L44.6 51.4L47.6 52.2L50 46.2Z", m: "#C2203A", ink: 0.9, round: true }),
      ];
    },
  },

  jersey: {
    name: "Team jersey",
    price: 600,
    draw: () => {
      const shirt = bodice({ cuff: 24.6, hem: 70.2, flare: 0.6, sag: 0.4, neck: "L50 49.2Z" });
      return [
        {
          d: shirt.d,
          m: JERSEY,
          ink: 1.2,
          round: true,
          vein: "M30.4 46.4C30.4 54 30 60 29.4 66M69.6 46.4C69.6 54 70 60 70.6 66",
          vw: 0.6,
        },
        // white side panels
        ...both({
          d: `M27.4 62.2C28 62.8 28.2 63.6 27.8 64.4L${r(sideX(70.2) - 0.6)} 70.2H${r(sideX(70.2) + 1.8)}L30 62.8Z`,
          m: CREAM,
          ink: 0.9,
        }),
        // sleeve bands
        ...both({ d: armBand(24.6, 27.4), m: CREAM, ink: 0.9, round: true }),
        ...both({ line: (() => { const [a, b] = armAt(26); return `M26 ${r(a[1] + 0.8)}V${r(b[1] - 0.8)}`; })(), color: "#F2C230", w: 0.9 }),
        // the V collar
        { d: "M34.2 40L50 49.2L65.8 40L62.6 40.4L50 46.4L37.4 40.4Z", m: CREAM, ink: 1, round: true },
        { line: "M36.6 40.8L50 48.2L63.4 40.8", color: "#F2C230", w: 0.6 },
        // the number: 10
        { line: "M43.6 54L45.6 52.4V62.2M53.8 52.4C56.4 52.4 57.2 54.8 57.2 57.3C57.2 59.8 56.4 62.2 53.8 62.2C51.2 62.2 50.4 59.8 50.4 57.3C50.4 54.8 51.2 52.4 53.8 52.4Z", color: "#0E1C3E", w: 3 },
        { line: "M43.6 54L45.6 52.4V62.2M53.8 52.4C56.4 52.4 57.2 54.8 57.2 57.3C57.2 59.8 56.4 62.2 53.8 62.2C51.2 62.2 50.4 59.8 50.4 57.3C50.4 54.8 51.2 52.4 53.8 52.4Z", color: CREAM, w: 1.8 },
      ];
    },
  },

  overalls: {
    name: "Overalls",
    price: 450,
    draw: () => {
      const [shoulder] = armAt(31);
      const [shoulder2] = armAt(34.6);
      return [
        // straps over the shoulders
        ...both({
          d: `M${pt(shoulder)}L${pt(shoulder2)}L42.4 49H38.6Z`,
          m: DENIM_BIB,
          ink: 1,
          round: true,
          vein: `M${r(shoulder[0] + 0.7)} ${r(shoulder[1] + 0.6)}L39.4 48.4`,
          vw: 0.4,
        }),
        // the bib, and the waist of the trousers
        {
          d: "M38.4 47.8Q50 46.8 61.6 47.8L62.8 63.6H71.8C72.2 64.6 72.6 65.6 73 66.4L73.6 68.8H26.4L27 66.4C27.4 65.6 27.8 64.6 28.2 63.6H37.2Z",
          m: DENIM_BIB,
          ink: 1.2,
          round: true,
          vein: "M44 61V63.6M56 61V63.6",
          vw: 0.6,
        },
        { line: "M39.6 49.2Q50 48.2 60.4 49.2L61.4 62.6M38.6 62.6L39.6 49.2M28.4 67.4H71.6", color: THREAD, w: 0.4 },
        // the bib pocket
        { d: "M44.2 51.6H55.8V56.8Q50 58.8 44.2 56.8Z", m: "#5A82BA", ink: 0.9, round: true },
        { line: "M45 52.6H55M45.2 56Q50 57.6 54.8 56", color: THREAD, w: 0.35 },
        // brass buttons where the straps meet the bib, and at the hips
        { d: ell(40.4, 49.6, 1.2, 1.2), m: "gold", ink: 0.6, round: true },
        { d: ell(59.6, 49.6, 1.2, 1.2), m: "gold", ink: 0.6, round: true },
        { d: ell(30.2, 66, 1, 1) + ell(69.8, 66, 1, 1), m: "gold", ink: 0.6, round: true },
      ];
    },
  },

  qipao: {
    name: "Qipao",
    price: 1000,
    draw: () => {
      const dress = bodice({ cuff: 25.2, hem: 70.4, flare: 0.4, neck: "Q50 42.6 34.2 40" });
      const gold = "#F0C860";
      const blossoms: P[] = [[39.4, 55.2], [58.4, 62.4], [35.6, 63.8]];
      return [
        {
          d: dress.d,
          m: SILK,
          ink: 1.2,
          round: true,
          vein: "M30.4 47C30.8 54 30.4 60 29.6 66M69.6 47C69.2 54 69.6 60 70.4 66",
          vw: 0.6,
        },
        // the gold piping round the cap sleeves and the hem
        ...both({ line: (() => { const [a, b] = armAt(25.9); return `M25.9 ${r(a[1] + 0.5)}V${r(b[1] - 0.5)}`; })(), color: gold, w: 0.8 }),
        { line: `M${r(sideX(69.6) + 0.4)} 69.6H${r(100 - sideX(69.6) - 0.4)}`, color: gold, w: 0.8 },
        // the side-fastening front: from the collar round to the armpit
        { line: "M51.4 45.4C57 46 61.2 47 63.6 50.4C65.4 53 67.4 57.6 71.2 61.4", color: gold, w: 0.9 },
        { line: "M51.4 45.4C57 46 61.2 47 63.6 50.4C65.4 53 67.4 57.6 71.2 61.4", color: "#6A0A18", w: 0.3 },
        // plum blossoms
        { d: blossoms.map(([x, y]) => dots([[x, y - 1.2], [x + 1.15, y - 0.4], [x + 0.7, y + 1], [x - 0.7, y + 1], [x - 1.15, y - 0.4]], 0.75)).join(""), m: "#F7B8C4", ink: 0.3 },
        { d: dots(blossoms, 0.45), m: "gold", ink: 0 },
        // the mandarin collar
        {
          d: "M35 37.6C40.2 41 59.8 41 65 37.6L65.6 42.6C60 46.4 40 46.4 34.4 42.6Z",
          m: SILK,
          ink: 1.1,
          round: true,
          vein: "M50 42.4V45.6",
          vw: 0.5,
        },
        { line: "M35.3 38.8C40.6 42.2 59.4 42.2 64.7 38.8", color: gold, w: 0.7 },
        // frog buttons along the opening
        ...frog(50, 43.8, gold),
        ...frog(61.4, 48.4, gold),
        ...frog(66, 55, gold),
      ];
    },
  },

  cardigan: {
    name: "Cardigan",
    price: 550,
    draw: () => {
      const knit = bodice({ cuff: 18.4, hem: 69, flare: 0.3, neck: "L50 55.6" });
      const cable = (x: number) => {
        let d = `M${x} 47`;
        for (let y = 47; y < 63; y += 3) d += `Q${x + 1.2} ${y + 0.75} ${x} ${y + 1.5}Q${x - 1.2} ${y + 2.25} ${x} ${y + 3}`;
        return d;
      };
      return [
        // the tee underneath
        { d: "M38.2 43.2C41.8 44.8 45.8 45.4 50 45.4C54.2 45.4 58.2 44.8 61.8 43.2L50 55Z", m: CREAM, ink: 0.9, round: true },
        {
          d: knit.d,
          m: KNIT,
          ink: 1.2,
          round: true,
          vein: `${cable(39.6)}${cable(60.4)}M24.4 44.6C25.6 49 25.4 55 24.2 60.4M75.6 44.6C74.4 49 74.6 55 75.8 60.4`,
          vw: 0.55,
        },
        // ribbed cuffs and hem
        ...both(ribCuff(18.4, 21.4, "#327A72")),
        {
          d: `M${r(sideX(65.8) - 0.3)} 65.8H${r(100 - sideX(65.8) + 0.3)}L${r(100 - sideX(69) + 0.3)} 69H${r(sideX(69) - 0.3)}Z`,
          m: "#327A72",
          ink: 1,
          round: true,
          vein: ribs(28, 72, 66.2, 68.6, 1.4),
          vw: 0.35,
        },
        // the button band up the front and round the neck
        {
          d: "M34.2 40L50 55.6L65.8 40L68.6 40.4L51.6 57V69H48.4V57L31.4 40.4Z",
          m: "#327A72",
          ink: 1,
          round: true,
          vein: "M34 41.4L48.6 55.8M66 41.4L51.4 55.8",
          vw: 0.4,
        },
        // patch pockets
        ...both({
          d: "M32.6 57.6H41.4L41 64.4Q36.8 65.4 32.4 64.4Z",
          m: KNIT,
          ink: 1,
          round: true,
          vein: "M32.6 59H41.4",
          vw: 0.4,
        }),
        // wooden buttons
        { d: dots([[50, 58.6], [50, 62.2], [50, 65.8]], 1.15), m: "wood", ink: 0.6, round: true },
      ];
    },
  },
};

// ── bottoms ──────────────────────────────────────────────────────────

/** Short trousers: the waist at 66, legs to `hem`, let out by `flare`. */
function shortsPath(hem: number, flare: number) {
  const o = r(sideX(hem) - flare);
  const i = r(innerX(hem) - flare * 0.2);
  return `M27.1 66H72.9L${r(100 - o)} ${hem}Q${r((100 - o + 100 - i) / 2)} ${r(hem + 0.8)} ${r(100 - i)} ${hem}L50 83.2L${i} ${hem}Q${r((o + i) / 2)} ${r(hem + 0.8)} ${o} ${hem}Z`;
}
/** A waistband from y0 to y1, on the body's sides. */
const waistband = (y0: number, y1: number, out = 0) =>
  `M${r(sideX(y0) - out)} ${y0}H${r(100 - sideX(y0) + out)}L${r(100 - sideX(y1) + out)} ${y1}H${r(sideX(y1) - out)}Z`;

const PANTS = "M27.1 66H72.9L81.4 88.4C82.4 91 82.2 93 81.2 94.6H54.9L50 83.2L45.1 94.6H18.8C17.8 93 17.6 91 18.6 88.4Z";
const DENIM = "#3D6299";

export const BOTTOMS: Record<string, PartDef> = {
  pants: {
    name: "Pants",
    price: 0,
    draw: () => [
      {
        d: PANTS,
        m: "#3A4A6A",
        ink: 1.2,
        round: true,
        vein: "M50 68V80M36 72L31 92M64 72L69 92",
        vw: 0.6,
      },
    ],
  },
  shorts: {
    name: "Shorts",
    price: 0,
    draw: () => [
      {
        d: shortsPath(86.6, 0.6),
        m: "#D04848",
        ink: 1.2,
        round: true,
        vein: "M50 69V81M36 72L33.6 86M64 72L66.4 86",
        vw: 0.6,
      },
      { d: waistband(66, 68.6, 0.1), m: "#B03A3A", ink: 1, round: true },
      { line: "M48.4 68.6L47.4 72.4M51.6 68.6L52.6 72.4", color: CREAM, w: 0.6 },
      // a white stripe down each side
      ...both({ line: `M${r(sideX(69.4) + 1.3)} 69.4L${r(sideX(86) + 0.9)} 86`, color: CREAM, w: 1.1 }),
    ],
  },
  skirt: {
    name: "Skirt",
    price: 300,
    draw: () => [
      {
        d: "M28.2 62.6H71.8L81.6 86.4Q50 92 18.4 86.4Z",
        m: "#E07AA8",
        ink: 1.2,
        round: true,
        vein: "M38 64L33 88M50 64V90M62 64L67 88",
        vw: 0.6,
      },
    ],
  },

  jeans: {
    name: "Jeans",
    price: 500,
    draw: () => [
      {
        d: PANTS,
        m: DENIM,
        ink: 1.2,
        round: true,
        vein: "M36.4 72.4L32 90M63.6 72.4L68 90M30.6 80.4L34.4 79.6M69.4 80.4L65.6 79.6",
        vw: 0.6,
      },
      { d: waistband(66, 68.8, 0.1), m: "#4A70A8", ink: 1, round: true },
      // the stitching: waistband, fly, pockets, outer seams
      {
        line:
          "M28.8 67.4H71.2M50 68.8V77.6Q50.6 79.4 52.8 78.8M52.8 68.8V78.6" +
          "M28.4 71.2Q34.4 71.6 36.6 68.8M71.6 71.2Q65.6 71.6 63.4 68.8" +
          `M${r(sideX(72) + 1.1)} 72L${r(sideX(88) + 0.9)} 88M${r(100 - sideX(72) - 1.1)} 72L${r(100 - sideX(88) - 0.9)} 88`,
        color: THREAD,
        w: 0.4,
      },
      { line: "M28 70.2Q34 70.6 36 68.8M72 70.2Q66 70.6 64 68.8", color: "#1E3460", w: 0.6 },
      // belt loops, the button and rivets
      { d: "M34.6 65.6H36.2V69.6H34.6ZM63.8 65.6H65.4V69.6H63.8ZM43.4 65.6H45V69.4H43.4Z", m: "#4A70A8", ink: 0.6 },
      { d: ell(51.4, 67.4, 1.05, 1.05), m: "gold", ink: 0.5, round: true },
      { d: dots([[36.4, 69.4], [63.6, 69.4]], 0.5), m: "gold", ink: 0.3 },
      // rolled-up cuffs
      ...both({
        d: "M17.9 91.2H46.6L45.1 94.6H18.8C18.2 93.6 17.9 92.4 17.9 91.2Z",
        m: "#6A8CC0",
        ink: 1,
        round: true,
        vein: "M19 92.6H45.6",
        vw: 0.4,
      }),
    ],
  },

  tutu: {
    name: "Tutu",
    price: 900,
    draw: () => {
      // a stiff ring of tulle: each layer's edge is a run of scallops
      // round the front half of a flat ellipse
      const layer = (rx: number, ry: number, cy: number, n: number) => {
        const at = (k: number, grow = 0): P => {
          const a = Math.PI - (k / n) * Math.PI;
          return [50 + Math.cos(a) * (rx + grow), cy + Math.sin(a) * (ry + grow * 0.4)];
        };
        let d = `M27.6 64.8C${r(50 - rx * 0.8)} 65.4 ${r(50 - rx)} ${r(cy - 2)} ${pt(at(0))}`;
        for (let k = 0; k < n; k++) d += `Q${pt(at(k + 0.5, 2.2))} ${pt(at(k + 1))}`;
        return `${d}C${r(50 + rx)} ${r(cy - 2)} ${r(50 + rx * 0.8)} 65.4 72.4 64.8Z`;
      };
      const pleats = (rx: number, ry: number, cy: number, n: number) => {
        let d = "";
        for (let k = 1; k < n; k++) {
          const a = Math.PI - (k / n) * Math.PI;
          d += `M${r(50 + Math.cos(a) * 18)} 67.4L${r(50 + Math.cos(a) * (rx - 1.6))} ${r(cy + Math.sin(a) * (ry - 1))}`;
        }
        return d;
      };
      return [
        { d: layer(40, 8.4, 70.4, 13), m: "#F7C2D8", ink: 1.1, round: true, vein: pleats(40, 8.4, 70.4, 13), vw: 0.45, op: 0.94 },
        { d: layer(35, 6.4, 69.2, 11), m: "#F2A3C4", ink: 1.1, round: true, vein: pleats(35, 6.4, 69.2, 11), vw: 0.5 },
        { d: waistband(63.4, 67.4, 0.2), m: "#E07AA8", ink: 1.1, round: true, shine: "M31 64.8H44", sw: 0.6 },
        // a satin bow at the front
        { d: "M50 65.4L45.4 63.2Q44.4 65.4 45.4 67.6ZM50 65.4L54.6 63.2Q55.6 65.4 54.6 67.6Z", m: "#E07AA8", ink: 0.9, round: true },
        { d: ell(50, 65.4, 1.2, 1.2), m: "#C85A8A", ink: 0.8, round: true },
        // sequins
        { d: dots([[24.4, 70.4], [35, 73.6], [46.2, 75], [58.6, 74.6], [69.6, 72.6], [79.4, 69.8], [30, 75.2], [72.4, 76.4]], 0.45), m: "#FFFFFF", ink: 0, op: 0.95 },
      ];
    },
  },

  pleated: {
    name: "Pleated skirt",
    price: 600,
    draw: () => {
      // eleven knife pleats from the waist out to the hem
      const n = 11;
      const wx = (k: number) => 28.2 + (43.6 * k) / n;
      const hx = (k: number) => 17.4 + (65.2 * k) / n;
      const hy = (x: number) => 84.6 + 1.8 * (1 - ((x - 50) / 32.6) ** 2);
      let folds = "";
      for (let k = 1; k < n; k++) folds += `M${r(wx(k))} 66.6L${r(hx(k))} ${r(hy(hx(k)) - 0.2)}`;
      const poly: P[] = [[28.2, 64.2], [71.8, 64.2]];
      for (let k = n; k >= 0; k--) poly.push([hx(k), hy(hx(k))]);
      const plaid = hStripes(poly, [71.2, 72.4, 79.6], 0.9);
      const thin = hStripes(poly, [76], 0.9);
      let down = "";
      for (const k of [1.5, 3.5, 5.5, 7.5, 9.5]) down += `M${r(wx(k))} 67.4L${r(hx(k))} ${r(hy(hx(k)) - 1)}`;
      return [
        {
          d: `M28.2 64.2H71.8L${r(hx(n))} ${r(hy(hx(n)))}` + reverseHem(hx, hy, n) + "Z",
          m: "#24365E",
          ink: 1.2,
          round: true,
          vein: folds,
          vw: 0.6,
        },
        { line: down, color: "#2E6A4A", w: 1.6, op: 0.85 },
        { line: plaid, color: "#2E6A4A", w: 1.6, op: 0.85 },
        { line: plaid + down, color: "#C8343C", w: 0.4 },
        { line: thin, color: "#F2D060", w: 0.35 },
        { d: waistband(63.6, 67, 0.2), m: "#1C2A4A", ink: 1.1, round: true },
      ];
    },
  },

  cargo: {
    name: "Cargo shorts",
    price: 450,
    draw: () => [
      {
        d: shortsPath(87.6, 1.1),
        m: "#7C7A48",
        ink: 1.2,
        round: true,
        vein: "M50 69V81M42 72Q44 75 45.2 79M58 72Q56 75 54.8 79",
        vw: 0.6,
      },
      { d: waistband(66, 68.8, 0.1), m: "#686638", ink: 1, round: true },
      { d: "M34.6 65.6H36.2V69.6H34.6ZM63.8 65.6H65.4V69.6H63.8Z", m: "#686638", ink: 0.6 },
      { d: ell(50, 67.4, 0.95, 0.95), m: "#3A3A22", ink: 0.4 },
      // big pockets on the thighs, with buttoned flaps
      ...both({
        d: "M23.8 76.2H32.8L32.4 85.6Q27.4 86.6 21.2 85.6Z",
        m: "#86844E",
        ink: 1,
        round: true,
        vein: "M28 77.6L27.2 85.4",
        vw: 0.45,
      }),
      ...both({
        d: "M23.4 74.4H33.4L33.2 78.2Q28.2 79.4 22.4 78.2Z",
        m: "#7C7A48",
        ink: 1,
        round: true,
      }),
      { d: dots([[28, 77.6], [72, 77.6]], 0.75), m: "#3A3A22", ink: 0.3 },
      // turned-up cuffs
      {
        d: `M${r(sideX(85.4) - 1.1)} 85.4H${r(innerX(85.4) - 0.2)}L${r(innerX(87.6) - 0.2)} 87.6H${r(sideX(87.6) - 1.1)}Z` +
          `M${r(100 - sideX(85.4) + 1.1)} 85.4H${r(100 - innerX(85.4) + 0.2)}L${r(100 - innerX(87.6) + 0.2)} 87.6H${r(100 - sideX(87.6) + 1.1)}Z`,
        m: "#8C8A56",
        ink: 0.9,
        round: true,
      },
    ],
  },
};

/** The pleated skirt's hem, from its right corner back to its left. */
function reverseHem(hx: (k: number) => number, hy: (x: number) => number, n: number) {
  let d = "";
  for (let k = n; k > 0; k--) {
    const a = hx(k);
    const b = hx(k - 1);
    d += `Q${r((a + b) / 2)} ${r(hy((a + b) / 2) + 0.9)} ${r(b)} ${r(hy(b))}`;
  }
  return d;
}

// ── shoes ────────────────────────────────────────────────────────────

/** The left foot cased from `top` down (a boot), let out by `g`. */
function bootPath(top: number, g: number) {
  const o = r(sideX(top) - g);
  const i = r(Math.min(innerX(top) + g * 0.4, 49.4));
  const s = r(98.4 + g * 0.5);
  return `M${o} ${top}H${i}L${r(45.6 + g * 0.6)} 94.2C${r(44.6 + g * 0.6)} ${r(96.8 + g * 0.4)} 42.4 ${s} 39.4 ${s}H25.6C${r(19.6 - g)} ${s} ${r(16.6 - g)} 94 ${r(18.6 - g)} 88.4Z`;
}
/** A sole under the left foot, from y 96.4 down. */
const sole = (g: number) =>
  `M${r(19.8 - g)} 96.4H${r(44.2 + g)}C${r(43.2 + g)} 97.8 41.8 ${r(98.6 + g)} 39.4 ${r(98.6 + g)}H25.6C${r(22.4 - g)} ${r(98.6 + g)} ${r(20.6 - g)} 97.8 ${r(19.8 - g)} 96.4Z`;

export const SHOES: Record<string, PartDef> = {
  none: { name: "Barefoot", price: 0, draw: () => [] },
  sneakers: {
    name: "Sneakers",
    price: 0,
    draw: () =>
      both({
        d: "M18 90.4H47.1L45.6 94.2C44.6 96.8 42.4 98.4 39.4 98.4H25.6C19.6 98.4 16.6 94 18 90.4Z",
        m: CREAM,
        ink: 1.2,
        round: true,
        vein: "M17.6 95.4H45",
        vw: 0.7,
        shine: "M22 92.6H30",
        sw: 0.8,
      }),
  },

  boots: {
    name: "Boots",
    price: 600,
    draw: () => [
      ...both({
        d: bootPath(84.6, 0.5),
        m: "#7A4A26",
        ink: 1.2,
        round: true,
        vein: "M22.4 90.4Q24 93 23.4 95.6",
        vw: 0.5,
        shine: "M21.2 88V93",
        sw: 0.8,
      }),
      ...both({ d: sole(0.6), m: "#3A2414", ink: 1 }),
      // the cuff folded down at the top
      ...both({
        d: `M${r(sideX(84.6) - 0.9)} 84.4H${r(innerX(84.6) + 0.2)}L${r(innerX(87.4) + 0.4)} 87.4H${r(sideX(87.4) - 0.9)}Z`,
        m: "#9A6436",
        ink: 1,
        round: true,
      }),
      // laces up the front
      ...both({ line: "M31 88.4L36.4 90.2M36.4 88.4L31 90.2M31 90.8L36.4 92.6M36.4 90.8L31 92.6", color: "#E8C88A", w: 0.55 }),
    ],
  },

  sandals: {
    name: "Sandals",
    price: 250,
    draw: () => [
      ...both({ d: sole(0.9), m: "#D8A468", ink: 1, round: true }),
      // a strap round the ankle, one over the toes, and one between
      ...both({ d: "M33 87.4H36.2V92.6H33Z", m: "#8A5A2E", ink: 0.9, round: true }),
      ...both({
        d: `M${r(sideX(86.2) - 0.3)} 86.2H${r(innerX(86.2) + 0.2)}L${r(innerX(88.4) + 0.2)} 88.4H${r(sideX(88.4) - 0.3)}Z`,
        m: "#8A5A2E",
        ink: 0.9,
        round: true,
      }),
      ...both({ d: "M17.6 91.6H46.9L46 94.4H18.2Q17.6 93 17.6 91.6Z", m: "#8A5A2E", ink: 0.9, round: true, shine: "M21 92.6H28", sw: 0.5 }),
      ...both({ d: "M21.6 85.6H24.4V89H21.6Z", m: "gold", ink: 0.6 }),
    ],
  },

  rainboots: {
    name: "Rain boots",
    price: 450,
    draw: () => [
      ...both({
        d: bootPath(84.2, 1.1),
        m: "#F2C230",
        ink: 1.2,
        round: true,
        shine: "M21 87.2V93.2",
        sw: 1.1,
      }),
      ...both({ d: sole(1.1), m: "#3A3A3A", ink: 1 }),
      // the rim round the top
      ...both({
        d: `M${r(sideX(84.2) - 1.5)} 83.8H${r(Math.min(innerX(84.2) + 0.6, 49.6))}L${r(innerX(86.2) + 0.6)} 86.2H${r(sideX(86.2) - 1.4)}Z`,
        m: "#E2A81E",
        ink: 1,
        round: true,
      }),
    ],
  },

  slippers: {
    name: "Fluffy slippers",
    price: 350,
    draw: () => [
      ...both({
        d: "M18 90H47.2L45.8 94.2C44.8 96.8 42.6 98.6 39.4 98.6H25.6C19.6 98.6 16.4 94 18 90Z",
        m: "#F2A6BE",
        ink: 1.2,
        round: true,
        vein: "M18.6 96.6Q32 98 45 96.4",
        vw: 0.5,
      }),
      ...both({
        d: fluff(32.2, 90.4, 14.6, 3.6, 12, 2.2),
        m: "#FFF4F8",
        ink: 1,
        round: true,
        vein: "M21.4 89.4Q22.6 91 24.6 90.4M29.2 91.4Q31 92.6 33 91.4M38.4 89.6Q40.2 91.2 42 90.4M26 88.4Q27.4 89.4 28.8 88.6",
        vw: 0.5,
      }),
    ],
  },

  dress: {
    name: "Dress shoes",
    price: 800,
    draw: () => [
      ...both({ d: sole(0.5), m: "#5A3418", ink: 1 }),
      ...both({
        d: "M17.8 91.2C22.4 90.2 27.4 90 32 91C37 90 42.4 90.2 47 90.8L45.6 94.2C44.6 96.6 42.4 97.8 39.4 97.8H25.6C19.8 97.8 16.6 94.2 17.8 91.2Z",
        m: "#2A2420",
        ink: 1.2,
        round: true,
        vein: "M19.2 94.6Q32 92.6 45 94.4",
        vw: 0.5,
        shine: "M22.6 95.8Q26 96.6 30 96.2",
        sw: 0.9,
      }),
      ...both({ line: "M29.6 91.6L34.4 92.6M34.4 91.6L29.6 92.6", color: "#8A7A6A", w: 0.45 }),
    ],
  },
};

export { ell };

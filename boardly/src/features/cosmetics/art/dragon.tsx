// Imperial Dragon: an engraved heraldic dragon (龙) holding the picture,
// face on and mirrored like Winged Crest. Its head crowns the top: ringed
// gold horns sweep back off the crown, a scowling scaled brow hoods two
// amber eyes with slit pupils, a ruyi snout curls into nostril scrolls
// over an open jaw of ivory fangs and tusks, and long whiskers arch out
// over the mane and curl. A mane of jade and gold flame tongues streams
// down both sides of a gold ring inlaid with jade; scaled forelegs come
// out of it, their talons gripping the ring low on each side, and a
// flaming pearl burns at the foot. The whiskers sway, the eyes smoulder,
// the pearl's flames flicker, embers rise and the light runs over the
// gold.

import {
  BlurMask,
  Circle,
  ClipOp,
  FillType,
  Group,
  PaintStyle,
  Path,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { curl, ribbon, type Pt } from "@/components/engraved/shapes";

import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const DEG = Math.PI / 180;
const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const JADE = ["#C4EED6", "#3FA67A", "#145A40", "#6FCDA0"];
const INK_JADE = "#06281B";
const VEIN_JADE = "#0E4A33";
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const CRIMSON = ["#FF9AA6", "#C2203A", "#6A0A18"];
const FLAME = ["#8E130C", "#E2541A", "#FFB23A", "#FFF2B8"];
const AMBER = ["#FFF6C0", "#FFC63A", "#E0660E", "#7A1E04"];

// ── path data ─────────────────────────────────────────────────────────

const f2 = (n: number) => n.toFixed(2);
const P = (x: number, y: number) => `${f2(x)} ${f2(y)}`;
const poly = (pts: Pt[], close = true) =>
  `M${pts.map(([x, y]) => P(x, y)).join("L")}${close ? "Z" : ""}`;
const circle = (r: number, x = 0, y = 0) =>
  `M${P(x + r, y)}A${r} ${r} 0 1 1 ${P(x - r, y)}A${r} ${r} 0 1 1 ${P(x + r, y)}Z`;

/** A path of absolute M/L/C/Q/Z commands, mirrored left to right. */
function mirrorD(d: string) {
  return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_, cmd: string, args: string) => {
    const n = args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
    return cmd + n.map((v, i) => (i % 2 ? v : f2(-Number(v)))).join(" ");
  });
}

const catmull = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const f = (i: 0 | 1) =>
    0.5 *
    (2 * b[i] +
      (c[i] - a[i]) * u +
      (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u * u +
      (3 * b[i] - a[i] - 3 * c[i] + d[i]) * u * u * u);
  return [f(0), f(1)];
};

/** A smooth closed outline through `pts`. */
function smooth(pts: Pt[]) {
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < 8; j++)
      out.push(
        catmull(
          pts[(i - 1 + n) % n],
          pts[i],
          pts[(i + 1) % n],
          pts[(i + 2) % n],
          j / 8,
        ),
      );
  return poly(out);
}

/** A symmetric outline from its right half, top centre round to bottom
 *  centre. */
const sym = (right: Pt[]) =>
  smooth([
    ...right,
    ...right
      .slice(1, -1)
      .reverse()
      .map(([x, y]): Pt => [-x, y]),
  ]);

/** A lens (an eye) of half-length `l` and half-height `h`, tilted. */
function lens(x: number, y: number, l: number, h: number, tilt: number) {
  const at = (u: number, v: number): Pt => [
    x + u * Math.cos(tilt) - v * Math.sin(tilt),
    y + u * Math.sin(tilt) + v * Math.cos(tilt),
  ];
  return `M${P(...at(-l, 0.4 * h))}Q${P(...at(-0.1 * l, -2.1 * h))} ${P(...at(l, -0.2 * h))}Q${P(...at(0.2 * l, 1.7 * h))} ${P(...at(-l, 0.4 * h))}Z`;
}

/** Short grooves cut across a scroll, like scales on a ridge. */
function ticks(
  part: ReturnType<typeof curl>,
  w: number,
  from: number,
  to: number,
  n: number,
) {
  let d = "";
  for (let k = 0; k < n; k++) {
    const s = from + ((to - from) * k) / Math.max(1, n - 1);
    const { p, th } = part.at(s);
    const h = (w * Math.pow(1 - s, 0.6)) / 2;
    const nx = -Math.sin(th);
    const ny = Math.cos(th);
    d += `M${P(p[0] + nx * h, p[1] + ny * h)}Q${P(p[0] + Math.cos(th) * h * 0.6, p[1] + Math.sin(th) * h * 0.6)} ${P(p[0] - nx * h, p[1] - ny * h)}`;
  }
  return d;
}

/** A tongue of flame pointing up from (0, 0), waving once, its tip
 *  flicking back. Its vein runs up the middle; `veins` adds one either
 *  side, like the barbs of a flame-feather. */
function tongue(h: number, b: number, bend: number) {
  const N = 20;
  const mid: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    mid.push([bend * h * 0.13 * Math.sin(1.5 * Math.PI * s), -h * s]);
  }
  const side = (k: number) =>
    mid.map((p, i): Pt => {
      const s = i / N;
      const a = mid[Math.max(i - 1, 0)];
      const q = mid[Math.min(i + 1, N)];
      const l = Math.hypot(q[0] - a[0], q[1] - a[1]) || 1;
      const half =
        (b / 2) * Math.pow(1 - s, 0.85) * (1 + 0.3 * Math.sin(Math.PI * s));
      return [
        p[0] - ((q[1] - a[1]) / l) * half * k,
        p[1] + ((q[0] - a[0]) / l) * half * k,
      ];
    });
  const line = (pts: Pt[], from: number, to: number) =>
    `M${pts
      .slice(from, to)
      .map((p) => P(...p))
      .join("L")}`;
  const vein = line(mid, 2, 15);
  return {
    outline: poly([...side(1), ...side(-1).reverse()]),
    vein,
    veins: vein + line(side(0.45), 3, 12) + line(side(-0.45), 3, 12),
    h,
  };
}

/** A strand (a whisker, a lock of beard): a tapering line setting off
 *  along `heading`, bending by `bend` evenly along its length and
 *  flicking by `flick` at its end. */
function strand(
  x: number,
  y: number,
  heading: number,
  len: number,
  bend: number,
  flick: number,
  w: number,
  /** How much of its width it keeps to the end (a toe keeps most). */
  keep = 0,
  /** A gentle wave along it. */
  wave = 0,
) {
  const N = 64;
  const mid: Pt[] = [];
  const left: Pt[] = [];
  const right: Pt[] = [];
  let px = x;
  let py = y;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const th =
      heading +
      bend * s +
      flick * Math.max(0, (s - 0.72) / 0.28) ** 1.6 +
      wave * Math.sin(TAU * 1.3 * s);
    const half = (w * (keep + (1 - keep) * Math.pow(1 - s, 0.8)) + 0.5) / 2;
    mid.push([px, py]);
    left.push([px + Math.sin(th) * half, py - Math.cos(th) * half]);
    right.push([px - Math.sin(th) * half, py + Math.cos(th) * half]);
    px += (Math.cos(th) * len) / N;
    py += (Math.sin(th) * len) / N;
  }
  const at = (s: number) => {
    const i = Math.round(s * N);
    const th =
      heading +
      bend * s +
      flick * Math.max(0, (s - 0.72) / 0.28) ** 1.6 +
      wave * Math.sin(TAU * 1.3 * s);
    const half = (w * (keep + (1 - keep) * Math.pow(1 - s, 0.8)) + 0.5) / 2;
    return { p: mid[i], th, half };
  };
  return {
    outline: poly([...left, ...right.reverse()]),
    vein: poly(mid.slice(2, N - 8), false),
    end: mid[N],
    endHeading: heading + bend + flick + wave * Math.sin(TAU * 1.3),
    at,
  };
}

/** Grooves cut across a strand at `ss` (a knuckle, a horn's rings). */
function rings(part: ReturnType<typeof strand>, ss: number[]) {
  return ss
    .map((s) => {
      const { p, th, half } = part.at(s);
      const nx = -Math.sin(th) * half;
      const ny = Math.cos(th) * half;
      const bx = Math.cos(th) * half * 0.5;
      const by = Math.sin(th) * half * 0.5;
      return `M${P(p[0] + nx, p[1] + ny)}Q${P(p[0] + bx, p[1] + by)} ${P(p[0] - nx, p[1] - ny)}`;
    })
    .join("");
}

// ── the shapes (right half; the left is its mirror) ───────────────────

/** The ring over the picture's edge: gold, a jade inlay, gold. */
const RING_IN = 49.5;
const RING_OUT = 61;
const RING = circle(RING_OUT) + circle(RING_IN);
const INLAY = circle(57.6) + circle(52.6);

/** The skull: a broad brow narrowing to the snout. */
const CRANIUM = sym([
  [0, -90],
  [10, -89.6],
  [20, -87.4],
  [26, -82.6],
  [27.2, -77],
  [24, -71],
  [18.4, -67],
  [10, -65.4],
  [0, -65],
]);
/** Scales over the brow, grooves round the cheek, the lit edge. */
const CRANIUM_VEIN = (() => {
  let d = "";
  for (let r = 0; r < 3; r++) {
    const y = -87.6 + r * 3;
    for (let x = -14 + (r % 2) * 2.5; x <= 14; x += 5)
      d += `M${P(x - 2.5, y)}Q${P(x, y + 3.2)} ${P(x + 2.5, y)}`;
  }
  const half = "M23 -80Q25.6 -74 21 -69.4";
  return d + half + mirrorD(half);
})();
const CRANIUM_SHINE = "M-12 -88.6Q-21 -86.6 -25 -81";

/** The muzzle, widening again to the upper lip. */
const MUZZLE = sym([
  [0, -70],
  [7, -69.6],
  [12.4, -67.6],
  [15.2, -63.6],
  [18.4, -59.4],
  [17.4, -56.8],
  [9, -56.2],
  [0, -56],
]);
const MUZZLE_VEIN = "M-13 -58.6Q0 -56.4 13 -58.6";

const MOUTH = sym([
  [0, -58],
  [14.5, -58],
  [17, -54.6],
  [14.5, -50.2],
  [0, -49.2],
]);
const JAW = sym([
  [0, -51.4],
  [7, -51.6],
  [13, -52.6],
  [16.4, -51.6],
  [15, -49.2],
  [10, -47.7],
  [4, -47],
  [0, -46.8],
]);
const JAW_VEIN =
  "M-11 -49.6Q0 -47.6 11 -49.6M-4 -48.6L-3 -47.4M4 -48.6L3 -47.4";
const TONGUE = sym([
  [0, -55.6],
  [4.4, -55],
  [6, -52.4],
  [4, -50.2],
  [0, -51.4],
]);

/** The ridge down the brow to the nose, cut across in plates. */
const BRIDGE = {
  outline: sym([
    [0, -90.4],
    [2.4, -86.4],
    [3.6, -80],
    [4.2, -74],
    [5.6, -69],
    [0, -67.4],
  ]),
};
const BRIDGE_VEIN = [-85, -82, -79, -76, -73, -70.4]
  .map((y) => {
    const h = 2.4 + (y + 88) * 0.16;
    return `M${P(-h, y - 0.6)}Q${P(0, y + 1.2)} ${P(h, y - 0.6)}`;
  })
  .join("");

/** The brow: a heavy scaled ridge, low over the nose (the dragon
 *  scowls), flaring up and out like flame. */
const BROW = curl(2.4, -77.4, -0.3, 25, -0.9, 8.4, 0.55);
const BROW_VEIN = ticks(BROW, 8, 0.06, 0.62, 7);
/** Flames rising off the brow. */
const BROW_FLAMES = [
  { x: 9.6, y: -83.4, rot: 0.3, h: 8.4, b: 5, bend: 1 },
  { x: 15.6, y: -84.6, rot: 0.72, h: 10, b: 5.4, bend: 1 },
  { x: 21, y: -83.4, rot: 1.12, h: 10.4, b: 5.4, bend: 1 },
].map((f) => ({ ...f, part: tongue(f.h, f.b, f.bend) }));

const EYE = { x: 13.4, y: -74, l: 6.6, h: 2.5, tilt: -0.32 };
const SOCKET = lens(EYE.x + 0.4, EYE.y + 0.4, EYE.l + 2, EYE.h + 1.6, EYE.tilt);
const EYEBALL = lens(EYE.x, EYE.y, EYE.l, EYE.h, EYE.tilt);
/** Both eyes, and the bright heart of each iris, for the glow. */
const EYES = EYEBALL + mirrorD(EYEBALL);
const IRIS =
  lens(EYE.x - 0.6, EYE.y - 0.2, EYE.l * 0.55, EYE.h * 0.55, EYE.tilt) +
  mirrorD(lens(EYE.x - 0.6, EYE.y - 0.2, EYE.l * 0.55, EYE.h * 0.55, EYE.tilt));
const PUPIL = `M${P(EYE.x + 0.6, EYE.y - 3.2)}Q${P(EYE.x + 1.6, EYE.y)} ${P(EYE.x + 0.2, EYE.y + 2.4)}Q${P(EYE.x - 0.8, EYE.y)} ${P(EYE.x + 0.6, EYE.y - 3.2)}Z`;

/** The cheek: a scroll curling out under the eye. */
const CHEEK = curl(15, -67.6, 0.25, 20, -4.2, 5.2, 0.6);
/** Fins of flame off the jowl, laid over the ring. */
const FINS = [
  { a: 8, len: 17, w: 6 },
  { a: 32, len: 19, w: 6.4 },
  { a: 56, len: 15, w: 5.6 },
].map((f) => curl(20, -62, f.a * DEG, f.len, 1.2, f.w, "leaf"));

/** The ruyi nose: a bulb with a scroll curling out of each nostril. */
const NOSE = sym([
  [0, -69],
  [5, -69.6],
  [10, -68.2],
  [13.4, -64.4],
  [12.6, -60.8],
  [9, -59.2],
  [4, -60],
  [0, -60.8],
]);
const NOSTRIL = curl(1.6, -61.4, -1.25, 15, 4.8, 3.6, 0.7);
const NOSTRIL_HOLE =
  "M5 -62.3Q7.2 -64.2 9.2 -62.6Q8.6 -60.8 6.6 -60.9Q5.4 -61.1 5 -62.3Z";
/** The upper lip, flaring out and curling up. */
const LIP = curl(9.4, -57.2, -0.1, 19, -4.6, 4.6, 0.7);

/** The fangs hanging from the upper lip, and the tusks rising from the
 *  jaw past it, curving out. */
const FANG = strand(5.8, -57.6, 1.62, 7.2, -0.35, 0, 3.2).outline;
const TUSK = strand(13.2, -49.6, -1.62, 11.6, 0.55, 0, 3.6).outline;

/** The horns: rising off the crown, sweeping out and back down the
 *  mane, ringed along their length, a tine forking off each. */
const HORN = ribbon(
  [
    [8, -81.4],
    [16, -86.2],
    [27, -87.8],
    [40, -86],
    [52, -80.6],
    [61, -72.8],
    [67, -63],
    [70, -53],
  ],
  [9, 8.4, 7.4, 6.2, 5, 3.6, 2.2, 0.6],
);
const TINES = [
  ribbon(
    [
      [39, -85],
      [42, -88.8],
      [46.6, -91],
    ],
    [4.4, 2.8, 0.6],
  ),
  ribbon(
    [
      [59, -74],
      [65, -77.2],
      [71.4, -77.4],
    ],
    [3.8, 2.4, 0.5],
  ),
];
/** Rings round the horn, from root to tip. */
const HORN_RINGS = (() => {
  const pts: Pt[] = [
    [8, -81.4],
    [16, -86.2],
    [27, -87.8],
    [40, -86],
    [52, -80.6],
    [61, -72.8],
    [67, -63],
    [70, -53],
  ];
  const ws = [9, 8.4, 7.4, 6.2, 5, 3.6, 2.2, 0.6];
  let d = "";
  for (let i = 0; i < pts.length - 2; i++)
    for (const u of [0.25, 0.75]) {
      const a = pts[i];
      const b = pts[i + 1];
      const x = a[0] + (b[0] - a[0]) * u;
      const y = a[1] + (b[1] - a[1]) * u;
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const tx = (b[0] - a[0]) / l;
      const ty = (b[1] - a[1]) / l;
      const h = (ws[i] + (ws[i + 1] - ws[i]) * u) / 2;
      d += `M${P(x - ty * h, y + tx * h)}Q${P(x + tx * h * 0.45, y + ty * h * 0.45)} ${P(x + ty * h, y - tx * h)}`;
    }
  return d;
})();

/** The mane: tongues of flame streaming from behind the head and down
 *  the sides of the ring, licking upward; jade behind gold. Each is
 *  [angle round the ring, heading, length, width]. */
const maneRow = (r: number, spec: [number, number, number, number][]) =>
  spec.map(([phi, heading, h, b]) => {
    const p = polar(phi * DEG, r);
    return { x: p.x, y: p.y, rot: (heading + 90) * DEG, part: tongue(h, b, 1) };
  });
const MANE_BACK = maneRow(58, [
  [-76, -64, 28, 12],
  [-58, -44, 38, 14],
  [-38, -28, 40, 15],
  [-18, -12, 36, 14.5],
  [2, 2, 33, 14],
  [22, 16, 28, 12],
  [40, 28, 22, 10],
]);
const MANE_FRONT = maneRow(57, [
  [-67, -54, 30, 11],
  [-48, -36, 34, 12.5],
  [-28, -20, 32, 13],
  [-8, -5, 29, 12.5],
  [12, 9, 25, 11],
  [31, 22, 19, 9],
]);

/** A whisker: a long barbel from the lip, flowing out and down the side
 *  of the ring and curling out at its end. */
const WHISKER_ROOT: Pt = [17, -59];
const WHISKER = strand(
  WHISKER_ROOT[0],
  WHISKER_ROOT[1],
  -0.1,
  108,
  1.9,
  -4.6,
  3.5,
  0,
  -0.3,
);

/** The beard: tongues of flame off the jaw, along the top of the ring. */
const BEARD = [
  { x: 9, y: -48.8, rot: 1.95, h: 13, b: 5, bend: 1 },
  { x: 13.4, y: -50.6, rot: 1.72, h: 16, b: 5.6, bend: 1 },
].map((f) => ({ ...f, part: tongue(f.h, f.b, f.bend) }));

/** The flaming pearl at the foot, on the ring: flames rise round it. */
const PEARL = { x: 0, y: 68.5, r: 7 };
const PEARL_FLAMES = [
  { rot: 0.3, h: 17, b: 7.5, bend: 1 },
  { rot: 0.85, h: 15, b: 7, bend: 1 },
  { rot: 1.45, h: 11, b: 6, bend: 1 },
]
  .flatMap((f) => [f, { ...f, rot: -f.rot, bend: -f.bend }])
  .map((f) => ({ rot: f.rot, part: tongue(f.h, f.b, f.bend) }));

/** Samples a smooth curve through `pts`: points and headings. */
function along(pts: Pt[], n: number) {
  const out: { p: Pt; th: number; u: number }[] = [];
  const m = pts.length - 1;
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * m;
    const i = Math.min(Math.floor(u), m - 1);
    const f = u - i;
    const q = (j: number) => pts[Math.max(0, Math.min(m, j))];
    const p = catmull(q(i - 1), q(i), q(i + 1), q(i + 2), f);
    const p2 = catmull(
      q(i - 1),
      q(i),
      q(i + 1),
      q(i + 2),
      Math.min(1, f + 0.02),
    );
    const p1 = catmull(
      q(i - 1),
      q(i),
      q(i + 1),
      q(i + 2),
      Math.max(0, f - 0.02),
    );
    out.push({ p, th: Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), u: k / n });
  }
  return out;
}

/** A foreleg down the lower side, its claw gripping the ring: a scaled
 *  forearm from under the mane, flames off its elbow, three toes over
 *  the ring with ivory talons, and a thumb behind. */
const WRIST = polar(40 * DEG, 69);
const ARM_PTS: Pt[] = [
  [74, -6],
  [80, 8],
  [77.6, 22],
  [68.6, 34],
  [WRIST.x, WRIST.y],
];
const ARM_W = [6, 11, 11.4, 10.4, 9.6];
const FOREARM = ribbon(ARM_PTS, ARM_W);
/** The plates down the inside of the forearm, toward the ring. */
const BELLY_PTS = ARM_PTS.slice(1).map(([x, y]): Pt => {
  const r = Math.hypot(x, y);
  return [(x * (r - 3.4)) / r, (y * (r - 3.4)) / r];
});
const BELLY = ribbon(BELLY_PTS, [3.6, 4.4, 4.4, 4]);
const BELLY_GROOVES = along(BELLY_PTS, 14)
  .slice(1, -1)
  .map(({ p, th }) => {
    const nx = -Math.sin(th) * 2.4;
    const ny = Math.cos(th) * 2.4;
    return `M${P(p[0] - nx, p[1] - ny)}L${P(p[0] + nx, p[1] + ny)}`;
  })
  .join("");
/** Scales over the forearm, overlapping toward the claw. */
const FOREARM_SCALES = along(ARM_PTS, 12)
  .slice(3)
  .map(({ p, th, u }, k) => {
    const half = (11 + (9.6 - 11) * u) / 2;
    const nx = -Math.sin(th);
    const ny = Math.cos(th);
    const tx = Math.cos(th);
    const ty = Math.sin(th);
    return (k % 2 ? [-0.36, 0.36] : [-0.72, 0, 0.72])
      .map((v) => {
        const cx = p[0] + nx * v * half;
        const cy = p[1] + ny * v * half;
        const a = half * 0.36;
        return `M${P(cx - nx * a - tx * a * 0.6, cy - ny * a - ty * a * 0.6)}Q${P(cx + tx * a * 1.3, cy + ty * a * 1.3)} ${P(cx + nx * a - tx * a * 0.6, cy + ny * a - ty * a * 0.6)}`;
      })
      .join("");
  })
  .join("");
const KNUCKLE = (() => {
  const th = 220 * DEG;
  const cx = WRIST.x + Math.cos(th) * 1.5;
  const cy = WRIST.y + Math.sin(th) * 1.5;
  return lens(cx, cy, 6.4, 3.4, th + Math.PI / 2);
})();
const TOES = [-42, -4, 34].map((spread, k) => {
  const dir = (221 + spread) * DEG;
  const toe = strand(
    WRIST.x + Math.cos(dir) * 2.5,
    WRIST.y + Math.sin(dir) * 2.5,
    dir,
    [12, 14, 12][k],
    -0.5,
    0,
    5.2,
    0.62,
  );
  const [x, y] = toe.end;
  const talon = strand(x, y, toe.endHeading - 0.15, 7.6, 2.2, 0, 3.6);
  return { toe, talon, knuckles: rings(toe, [0.38, 0.72]) };
});
const THUMB = strand(WRIST.x + 3, WRIST.y - 2, -38 * DEG, 8, -0.4, 0, 4.6, 0.6);
const THUMB_TALON = strand(
  THUMB.end[0],
  THUMB.end[1],
  THUMB.endHeading,
  6,
  -1.9,
  0,
  3,
);

// ── drawing onto a canvas, for the recorded pictures ──────────────────

const linear = (x0: number, y0: number, x1: number, y1: number, cs: string[]) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    cs.map((c) => Skia.Color(c)),
    null,
    TileMode.Clamp,
  );
const radial = (x: number, y: number, r: number, cs: string[]) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    cs.map((c) => Skia.Color(c)),
    null,
    TileMode.Clamp,
  );

function pen(width: number, color: string, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  return paint;
}

function brush(fill: SkShader | string, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  if (typeof fill === "string") paint.setColor(Skia.Color(fill));
  else paint.setShader(fill);
  paint.setAlphaf(alpha);
  return paint;
}

const skPath = (d: string, evenOdd = false) => {
  const path = Skia.Path.MakeFromSVGString(d);
  if (path && evenOdd) path.setFillType(FillType.EvenOdd);
  return path;
};

interface Piece {
  d: string;
  /** A gradient's colours, laid corner to corner over the piece, or a
   *  ready shader or flat colour. */
  fill: string[] | SkShader | string;
  ink: string;
  width?: number;
  evenOdd?: boolean;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  shine?: string;
  shadow?: boolean;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = skPath(p.d, p.evenOdd);
  if (!path) return;
  if (p.shadow) {
    c.save();
    c.translate(0.8, 1.2);
    c.drawPath(path, brush("#1A0E02", 0.4));
    c.restore();
  }
  let fill: SkShader | string;
  if (Array.isArray(p.fill)) {
    const b = path.getBounds();
    fill = linear(b.x, b.y, b.x + b.width, b.y + b.height, p.fill);
  } else fill = p.fill;
  c.drawPath(path, brush(fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? skPath(p.vein) : null;
    if (vein)
      c.drawPath(vein, pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, 0.8));
    const shine = p.shine ? skPath(p.shine) : null;
    if (shine) c.drawPath(shine, pen(0.8, "#FFFFFF", 0.8));
    c.restore();
  }
  if ((p.width ?? 1.1) > 0) c.drawPath(path, pen(p.width ?? 1.1, p.ink));
}

const gold = (d: string, more: Partial<Piece> = {}): Piece => ({
  d,
  fill: GOLD,
  width: 0.9,
  ink: INK_GOLD,
  veinColor: VEIN_GOLD,
  ...more,
});

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  draw(c);
  return recorder.finishRecordingAsPicture();
}

/** Remembers a recorded picture once it has been drawn. */
function once(draw: () => SkPicture) {
  let pic: SkPicture | null = null;
  return () => (pic ??= draw());
}

/** Draws `half` as it is and mirrored. */
function both(c: SkCanvas, half: (c: SkCanvas) => void) {
  half(c);
  c.save();
  c.scale(-1, 1);
  half(c);
  c.restore();
}

function drawFlame(c: SkCanvas, part: ReturnType<typeof tongue>) {
  engrave(c, {
    d: part.outline,
    fill: linear(0, 0, 0, -part.h, FLAME),
    ink: "#4A0C04",
    width: 0.8,
    vein: part.vein,
    veinColor: "#FFF2B8",
    veinWidth: 0.5,
  });
}

/** Behind the picture: the mane and the antlers. */
const backPicture = once(() =>
  record((c) => {
    const flame = (
      f: (typeof MANE_BACK)[number],
      colors: string[],
      ink: string,
      vein: string,
      shadow: boolean,
    ) => {
      c.save();
      c.translate(f.x, f.y);
      c.rotate(f.rot / DEG, 0, 0);
      engrave(c, {
        d: f.part.outline,
        fill: linear(0, 0, 0, -f.part.h, colors),
        ink,
        width: 1,
        vein: f.part.veins,
        veinColor: vein,
        veinWidth: 0.6,
        shadow,
      });
      c.restore();
    };
    both(c, (c) => {
      for (const f of MANE_BACK)
        flame(f, [JADE[2], JADE[1], JADE[0]], INK_JADE, VEIN_JADE, false);
      engrave(
        c,
        gold(FOREARM.outline, {
          vein: FOREARM_SCALES,
          width: 1.1,
          shadow: true,
        }),
      );
      engrave(c, {
        d: BELLY.outline,
        fill: ["#FFFBEA", "#F6E2A8", "#D8B868"],
        ink: INK_GOLD,
        width: 0.7,
        vein: BELLY_GROOVES,
        veinColor: VEIN_GOLD,
        veinWidth: 0.5,
      });
      for (const f of MANE_FRONT)
        flame(f, [GOLD[2], GOLD[1], GOLD[0]], INK_GOLD, VEIN_GOLD, true);
      for (const t of TINES)
        engrave(
          c,
          gold(t.outline, { vein: t.grooves, width: 1, shadow: true }),
        );
      engrave(
        c,
        gold(HORN.outline, {
          vein: HORN_RINGS,
          shine: HORN.shine,
          width: 1.2,
          shadow: true,
        }),
      );
    });
  }),
);

/** The ring over the picture's edge. */
const ringPicture = once(() =>
  record((c) => {
    let twists = "";
    for (let k = 0; k < 90; k++) {
      const a = (k / 90) * TAU;
      const p = polar(a, 57.9);
      const q = polar(a + 2.6 * DEG, 60.6);
      twists += `M${P(p.x, p.y)}L${P(q.x, q.y)}`;
    }
    engrave(c, {
      d: RING,
      evenOdd: true,
      fill: linear(-60, -60, 60, 60, GOLD),
      ink: INK_GOLD,
      width: 1.2,
      vein: twists + circle(51.4),
      veinColor: VEIN_GOLD,
    });
    let facets = "";
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU;
      const p = polar(a, 52.6);
      const q = polar(a + 3 * DEG, 57.6);
      facets += `M${P(p.x, p.y)}L${P(q.x, q.y)}`;
    }
    engrave(c, {
      d: INLAY,
      evenOdd: true,
      fill: linear(-50, -60, 50, 60, JADE),
      ink: INK_JADE,
      width: 0.9,
      vein: facets,
      veinColor: "#E6FFF0",
      veinWidth: 0.35,
    });
    // gold studs set in the jade
    for (let k = 0; k < 16; k++) {
      const p = polar((k / 16) * TAU + TAU / 32, 55.1);
      c.drawCircle(
        p.x,
        p.y,
        1.5,
        brush(
          radial(p.x - 0.5, p.y - 0.6, 2.4, ["#FFFBE0", "#E2B04A", "#7A5212"]),
        ),
      );
      c.drawCircle(p.x, p.y, 1.5, pen(0.5, INK_GOLD, 0.9));
    }
    both(c, drawClaw);
  }),
);

/** Draws a tongue of flame placed at (x, y), turned by `rot`. */
function placed(
  c: SkCanvas,
  f: { x: number; y: number; rot: number; part: ReturnType<typeof tongue> },
  piece: (d: string, vein: string) => Piece,
) {
  c.save();
  c.translate(f.x, f.y);
  c.rotate(f.rot / DEG, 0, 0);
  engrave(c, piece(f.part.outline, f.part.vein));
  c.restore();
}

/** The claw over the ring. */
function drawClaw(c: SkCanvas) {
  engrave(c, gold(THUMB.outline, { vein: THUMB.vein, shadow: true }));
  engrave(c, {
    d: THUMB_TALON.outline,
    fill: IVORY,
    ink: INK_GOLD,
    width: 0.7,
  });
  engrave(c, gold(KNUCKLE, { width: 1, shadow: true }));
  for (const t of TOES) {
    engrave(
      c,
      gold(t.toe.outline, { vein: t.knuckles, width: 1, shadow: true }),
    );
    engrave(c, {
      d: t.talon.outline,
      fill: IVORY,
      ink: INK_GOLD,
      width: 0.7,
      shadow: true,
    });
  }
}

/** The head over the top of the ring, up to the eyes. All its gold
 *  shares one sheen, so it reads as one cast piece. */
const headPicture = once(() =>
  record((c) => {
    const metal = linear(0, -92, 0, -46, GOLD);
    const g = (d: string, more: Partial<Piece> = {}) =>
      gold(d, { fill: metal, ...more });
    both(c, (c) => {
      for (const b of BEARD)
        placed(c, b, (d, vein) => gold(d, { vein, shadow: true }));
      for (const f of FINS)
        engrave(c, gold(f.outline, { vein: f.vein, width: 1, shadow: true }));
      for (const f of BROW_FLAMES)
        placed(c, f, (d, vein) => g(d, { vein, shadow: true }));
    });
    engrave(c, {
      d: MOUTH,
      fill: ["#6A0A18", "#2A0206"],
      ink: INK_GOLD,
      width: 0.9,
    });
    engrave(c, { d: TONGUE, fill: CRIMSON, ink: "#3A0408", width: 0.6 });
    engrave(c, g(JAW, { vein: JAW_VEIN, shadow: true, width: 1.1 }));
    both(c, (c) => {
      engrave(c, { d: FANG, fill: IVORY, ink: INK_GOLD, width: 0.6 });
    });
    engrave(
      c,
      g(CRANIUM, {
        vein: CRANIUM_VEIN,
        shine: CRANIUM_SHINE,
        width: 1.25,
        shadow: true,
      }),
    );
    engrave(c, g(MUZZLE, { vein: MUZZLE_VEIN, width: 1.1, shadow: true }));
    both(c, (c) => {
      engrave(c, g(CHEEK.outline, { vein: CHEEK.vein, shadow: true }));
      engrave(c, { d: SOCKET, fill: "#2A1404", ink: INK_GOLD, width: 0.7 });
      engrave(c, {
        d: EYEBALL,
        fill: radial(EYE.x - 2, EYE.y - 1.5, 8, AMBER),
        ink: "#5A1A02",
        width: 0.4,
      });
      engrave(
        c,
        g(BROW.outline, {
          vein: BROW_VEIN + BROW.vein,
          width: 1.1,
          shadow: true,
        }),
      );
    });
    engrave(c, g(BRIDGE.outline, { vein: BRIDGE_VEIN, shadow: true }));
  }),
);

/** The pupils and their catch-lights, over the glow. */
const pupilPicture = once(() =>
  record((c) => {
    both(c, (c) => {
      const pupil = skPath(PUPIL);
      if (pupil) c.drawPath(pupil, brush("#140600"));
      const shine = skPath(
        `M${P(EYE.x - 4.4, EYE.y - 0.2)}Q${P(EYE.x - 3.4, EYE.y - 1.9)} ${P(EYE.x - 1.6, EYE.y - 2.2)}`,
      );
      if (shine) c.drawPath(shine, pen(0.7, "#FFFFFF", 0.9));
    });
  }),
);

/** The snout, over the whiskers' roots. */
const snoutPicture = once(() =>
  record((c) => {
    const metal = linear(0, -92, 0, -46, GOLD);
    const g = (d: string, more: Partial<Piece> = {}) =>
      gold(d, { fill: metal, ...more });
    engrave(c, g(NOSE, { width: 1, shadow: true }));
    both(c, (c) => {
      const hole = skPath(NOSTRIL_HOLE);
      if (hole) c.drawPath(hole, brush("#1A0A02"));
      engrave(c, g(NOSTRIL.outline, { vein: NOSTRIL.vein, width: 0.8 }));
      engrave(c, g(LIP.outline, { vein: LIP.vein, shadow: true }));
      engrave(c, {
        d: TUSK,
        fill: IVORY,
        ink: INK_GOLD,
        width: 0.6,
        shadow: true,
      });
    });
  }),
);

/** One whisker (the right); the left is drawn mirrored. */
const whiskerPicture = once(() =>
  record((c) => {
    engrave(
      c,
      gold(WHISKER.outline, { vein: WHISKER.vein, width: 0.8, shadow: true }),
    );
  }),
);

const pearlFlamesPicture = once(() =>
  record((c) => {
    for (const f of PEARL_FLAMES) {
      c.save();
      c.translate(PEARL.x, PEARL.y);
      c.rotate(f.rot / DEG, 0, 0);
      c.translate(0, -3.5);
      drawFlame(c, f.part);
      c.restore();
    }
  }),
);

const pearlPicture = once(() =>
  record((c) => {
    const { x, y, r } = PEARL;
    c.drawCircle(x, y, r + 0.8, brush("#4A1A10"));
    c.drawCircle(
      x,
      y,
      r,
      brush(
        radial(x - r * 0.35, y - r * 0.4, r * 1.7, [
          "#FFFFFF",
          "#FFF0D8",
          "#F2B88A",
          "#B86A3A",
        ]),
      ),
    );
    c.drawCircle(x - 2.2, y - 2.3, 1.6, brush("#FFFFFF"));
  }),
);

/** A placed flame's outline, in the drawing's own space. */
const placedD = (f: {
  x: number;
  y: number;
  rot: number;
  part: ReturnType<typeof tongue>;
}) =>
  f.part.outline.replace(
    /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_, a: string, b: string) => {
      const c = Math.cos(f.rot);
      const s = Math.sin(f.rot);
      return P(f.x + +a * c - +b * s, f.y + +a * s + +b * c);
    },
  );
const withMirror = (d: string) => d + mirrorD(d);

// The light runs over all the gold at once, both halves.
const SWEEP_BACK = withMirror(
  HORN.outline +
    TINES.map((t) => t.outline).join("") +
    FOREARM.outline +
    MANE_FRONT.map(placedD).join(""),
);
const SWEEP_FRONT =
  CRANIUM +
  MUZZLE +
  BRIDGE.outline +
  JAW +
  NOSE +
  withMirror(
    BROW.outline +
      CHEEK.outline +
      LIP.outline +
      KNUCKLE +
      TOES.map((t) => t.toe.outline).join(""),
  );
const EVERY = 5;

// ── the layers ─────────────────────────────────────────────────────────

/** A whisker, swaying from its root. */
function Whisker({ t, side }: { t: Clock; side: 1 | -1 }) {
  const picture = useMemo(() => whiskerPicture(), []);
  const transform = useDerivedValue(() => {
    const sway = Math.sin(t.value * 1.1 + (side < 0 ? 1.3 : 0)) * 0.035;
    return [
      { scaleX: side },
      { translateX: WHISKER_ROOT[0] },
      { translateY: WHISKER_ROOT[1] },
      { rotate: sway },
      { translateX: -WHISKER_ROOT[0] },
      { translateY: -WHISKER_ROOT[1] },
    ];
  });
  return (
    <Group transform={transform}>
      <Picture picture={picture} />
    </Group>
  );
}

function DragonBack({ t }: { t: Clock }) {
  const back = useMemo(() => backPicture(), []);
  const glow = useDerivedValue(() => 0.34 + 0.1 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={92} color="#FFD27A" opacity={glow} />
      <Picture picture={back} />
      <Sweep t={t} d={SWEEP_BACK} every={EVERY} />
    </Group>
  );
}

function DragonFront({ t }: { t: Clock }) {
  const ring = useMemo(() => ringPicture(), []);
  const head = useMemo(() => headPicture(), []);
  const pupils = useMemo(() => pupilPicture(), []);
  const snout = useMemo(() => snoutPicture(), []);
  const flames = useMemo(() => pearlFlamesPicture(), []);
  const pearl = useMemo(() => pearlPicture(), []);
  // the eyes smoulder, slowly
  const ember = useDerivedValue(
    () => 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(t.value * 1.3)) ** 2,
  );
  const flicker = useDerivedValue(() => [
    { translateX: PEARL.x },
    { translateY: PEARL.y },
    { rotate: Math.sin(t.value * 1.7) * 0.06 },
    { scale: 1 + 0.07 * Math.sin(t.value * 5.3) * Math.sin(t.value * 2.1) },
    { translateX: -PEARL.x },
    { translateY: -PEARL.y },
  ]);
  const pearlGlow = useDerivedValue(() => 0.4 + 0.25 * Math.sin(t.value * 2.3));
  return (
    <Group>
      {/* the frame's shadow on the picture's edge */}
      <Circle
        cx={0.6}
        cy={1}
        r={RING_IN}
        style="stroke"
        strokeWidth={2.2}
        color="#000000"
        opacity={0.35}
      >
        <BlurMask blur={1.4} style="normal" />
      </Circle>
      <Picture picture={ring} />
      <Sweep t={t} d={RING} evenOdd every={EVERY} phase={0.4} />
      <Picture picture={head} />
      {/* the eyes smoulder: a fire behind the iris, brightening */}
      <Group opacity={ember} blendMode="screen">
        <Path path={EYES} color="#FF7A10">
          <BlurMask blur={1.6} style="normal" />
        </Path>
        <Path path={IRIS} color="#FFE9A0" />
      </Group>
      <Picture picture={pupils} />
      <Whisker t={t} side={1} />
      <Whisker t={t} side={-1} />
      <Picture picture={snout} />
      <Sweep t={t} d={SWEEP_FRONT} every={EVERY} />
      {/* the flaming pearl */}
      <Circle
        cx={PEARL.x}
        cy={PEARL.y}
        r={12}
        color="#FF7A2A"
        opacity={pearlGlow}
      >
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Group transform={flicker}>
        <Picture picture={flames} />
      </Group>
      <Picture picture={pearl} />
      <Glint t={t} x={PEARL.x - 2} y={PEARL.y - 2} size={5} phase={0.4} />
      <Glint t={t} x={-46} y={-90} size={4} phase={2.2} speed={1.1} />
      <Glint t={t} x={44} y={-58} size={3.5} phase={3.6} speed={0.9} />
      <Glint t={t} x={-41} y={33} size={3.5} phase={4.8} speed={1} />
      <Sparks
        t={t}
        count={7}
        from={-Math.PI * 0.95}
        to={-Math.PI * 0.05}
        r={70}
        rise={20}
        size={1.2}
        seed={88}
      />
    </Group>
  );
}

export const DRAGON_ART: Record<string, ArtBorderDrawing> = {
  "imperial-dragon": { back: DragonBack, front: DragonFront },
};

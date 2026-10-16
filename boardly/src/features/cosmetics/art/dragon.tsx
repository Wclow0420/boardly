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
  BlendMode,
  BlurStyle,
  ClipOp,
  FillType,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkRect,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { PixelRatio } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

import { curl, ribbon, type Pt } from "@/components/engraved/shapes";

import {
  TAU,
  polar,
  rnd,
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


// ── how it is drawn each frame ────────────────────────────────────────
// Every frame Skia redraws each canvas, so the dragon is drawn cheaply:
// every part that stands still (the mane and horns, the ring and claws,
// the head, the snout) or only moves as a whole (a whisker, the pearl's
// flames) is baked once into an image, blurs and all, and each layer is
// one picture recorded per frame from a single derived value, which
// places those images and draws the few live things (the glows, the
// glints, the embers, the light sweeping the gold) with the same numbers
// as ever.

/** Pixels per art unit the still parts are baked at: a little finer
 *  than a 100pt avatar shows them, so they stay crisp up to ~130pt. */
const bakeScale = () => Math.max(2, PixelRatio.get()) * 1.2;

/** A drawing baked into an image, and the rect (in art units) it fills. */
interface Baked {
  image: SkImage;
  src: SkRect;
  dst: SkRect;
}

/** Bakes `draw` over the art rect x, y, w, h. */
function bake(
  draw: (c: SkCanvas) => void,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = bakeScale(),
): Baked | null {
  const W = Math.ceil(w * scale);
  const H = Math.ceil(h * scale);
  const surface = Skia.Surface.Make(W, H);
  if (!surface) return null;
  const c = surface.getCanvas();
  c.scale(scale, scale);
  c.translate(-x, -y);
  draw(c);
  surface.flush();
  return {
    image: surface.makeImageSnapshot(),
    src: Skia.XYWHRect(0, 0, W, H),
    dst: Skia.XYWHRect(x, y, W / scale, H / scale),
  };
}

/** Draws a baked image where it belongs (cubic, so it scales cleanly). */
const put = (c: SkCanvas, b: Baked | null, paint: SkPaint) => {
  "worklet";
  if (b) c.drawImageRectCubic(b.image, b.src, b.dst, 1 / 3, 1 / 3, paint);
};

/** `paint` set to alpha `a`, clamped as Skia's opacity is. A picture
 *  keeps a copy of each paint it draws with, so one paint can be reused
 *  at many alphas. */
const faded = (paint: SkPaint, a: number) => {
  "worklet";
  paint.setAlphaf(Math.min(1, Math.max(0, a)));
  return paint;
};

/** A copy of a layer's parts with paints of its own (they are set per
 *  frame), sharing the baked images and paths. */
function own<T>(v: T): T {
  if (Array.isArray(v)) return v.map(own) as T;
  if (!v || typeof v !== "object" || v instanceof Float32Array) return v;
  const name = (v as { __typename__?: string }).__typename__;
  if (name === "Paint") return (v as unknown as SkPaint).copy() as T;
  if (name) return v;
  return Object.fromEntries(
    Object.entries(v).map(([k, x]) => [k, own(x)]),
  ) as T;
}

/** Made once, on first use (never at import: Jest has no Skia). */
function lazy<T>(make: () => T) {
  let made: T | undefined;
  return () => (made ??= make());
}

const DEG_W = 180 / Math.PI;

/** A plain fill; with `blur`, a soft one; with `screen`, screened. */
function fill(color: string, blur = 0, screen = false) {
  const paint = brush(color);
  if (blur > 0)
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  if (screen) paint.setBlendMode(BlendMode.Screen);
  return paint;
}

/** Starts a frame's picture. */
const begin = () => {
  "worklet";
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  return { recorder, c };
};

/** The light sweeping the gold (as Sweep in crowns): a soft white band,
 *  tilted, crossing the canvas once every `every` seconds, drawn as the
 *  shape filled with a moving gradient rather than a band clipped to it. */
const SWEEP_COLORS = () =>
  ["#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"].map((col) => Skia.Color(col));
const sweep = (
  c: SkCanvas,
  path: SkPath | null,
  colors: Float32Array[],
  t: number,
  every: number,
  phase: number,
) => {
  "worklet";
  const p = ((t + phase) % every) / 1.1;
  if (!path || p >= 1) return;
  const x = -110 + p * 220;
  const dx = Math.cos(0.45) * 12;
  const dy = Math.sin(0.45) * 12;
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setShader(
    Skia.Shader.MakeLinearGradient(
      Skia.Point(x - dx, -dy),
      Skia.Point(x + dx, dy),
      colors,
      null,
      TileMode.Clamp,
    ),
  );
  c.drawPath(path, paint);
};

/** A four-pointed glint that flares and fades (as Glint in kit). */
const glint = (
  x: number,
  y: number,
  size: number,
  phase: number,
  speed = 1.2,
) => {
  const w = size * 0.2;
  return {
    x,
    y,
    phase,
    speed,
    path: skPath(
      `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`,
    )!,
  };
};

/** The embers rising off the top of the ring (as Sparks in kit). */
const SPARKS = {
  count: 7,
  from: -Math.PI * 0.95,
  to: -Math.PI * 0.05,
  r: 70,
  rise: 20,
  size: 1.2,
  seed: 88,
};

const backParts = lazy(() => ({
  plain: Skia.Paint(),
  halo: brush(
    Skia.Shader.MakeRadialGradient(
      vec(0, 0),
      92,
      [Skia.Color("#FFD27A"), Skia.Color("#FFD27A00")],
      [0.55, 1],
      TileMode.Clamp,
    ),
  ),
  back: bake((c) => c.drawPicture(backPicture()), -95, -95, 190, 147),
  gold: skPath(SWEEP_BACK),
  sweepColors: SWEEP_COLORS(),
}));

function DragonBack({ t }: { t: Clock }) {
  const P = useMemo(() => own(backParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const { recorder, c } = begin();
    c.drawCircle(0, 0, 92, faded(P.halo, 0.34 + 0.1 * Math.sin(T * 1.2)));
    put(c, P.back, P.plain);
    sweep(c, P.gold, P.sweepColors, T, EVERY, 0);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

const frontParts = lazy(() => {
  const { size } = SPARKS;
  return {
    plain: Skia.Paint(),
    soft: Skia.Paint(),
    screen: fill("#FFFFFF", 0, true),
    white: fill("#FFFFFF"),
    // the frame's shadow on the picture's edge, then the ring and claws
    ring: bake(
      (c) => {
        const shade = pen(2.2, "#000000", 0.35);
        shade.setMaskFilter(
          Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.4, true),
        );
        c.drawCircle(0.6, 1, RING_IN, shade);
        c.drawPicture(ringPicture());
      },
      -66,
      -66,
      132,
      132,
    ),
    ringPath: skPath(RING, true),
    head: bake((c) => c.drawPicture(headPicture()), -38, -96, 76, 56),
    // the fire behind the irises
    eyeGlow: bake(
      (c) => {
        const eyes = skPath(EYES);
        if (eyes) c.drawPath(eyes, fill("#FF7A10", 1.6));
      },
      -26,
      -85,
      52,
      21,
    ),
    iris: skPath(IRIS),
    irisPaint: fill("#FFE9A0", 0, true),
    pupils: pupilPicture(),
    whisker: bake((c) => c.drawPicture(whiskerPicture()), 13, -67, 78, 57),
    snout: bake((c) => c.drawPicture(snoutPicture()), -24, -73, 48, 27),
    gold: skPath(SWEEP_FRONT),
    sweepColors: SWEEP_COLORS(),
    pearlGlow: bake(
      (c) => c.drawCircle(PEARL.x, PEARL.y, 12, fill("#FF7A2A", 7)),
      -34,
      34.5,
      68,
      68,
    ),
    flames: bake((c) => c.drawPicture(pearlFlamesPicture()), -18, 45, 36, 30),
    pearl: pearlPicture(),
    glints: [
      glint(PEARL.x - 2, PEARL.y - 2, 5, 0.4),
      glint(-46, -90, 4, 2.2, 1.1),
      glint(44, -58, 3.5, 3.6, 0.9),
      glint(-41, 33, 3.5, 4.8, 1),
    ],
    // an ember's soft glow, and its bright core
    sparkGlow: bake(
      (c) => c.drawCircle(0, 0, size * 2.4, fill("#FFC35A", size * 1.4)),
      -9,
      -9,
      18,
      18,
    ),
    sparkCore: fill("#FFF4D6", 0, true),
    sparks: Array.from({ length: SPARKS.count }, (_, k) => {
      const i = k + SPARKS.seed * 100;
      const life = 1.3 + rnd(i) * 1.2;
      const a = SPARKS.from + (SPARKS.to - SPARKS.from) * rnd(i + 7);
      const start = polar(a, SPARKS.r);
      return { i, life, x: start.x, y: start.y, offset: rnd(i + 3) * life };
    }),
  };
});

function DragonFront({ t }: { t: Clock }) {
  const P = useMemo(() => own(frontParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const { recorder, c } = begin();
    put(c, P.ring, P.plain);
    sweep(c, P.ringPath, P.sweepColors, T, EVERY, 0.4);
    put(c, P.head, P.plain);
    // the eyes smoulder, slowly: a fire behind the iris, brightening
    const ember = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(T * 1.3)) ** 2;
    put(c, P.eyeGlow, faded(P.screen, ember));
    if (P.iris) c.drawPath(P.iris, faded(P.irisPaint, ember));
    c.drawPicture(P.pupils);
    // the whiskers sway from their roots
    for (const side of [1, -1]) {
      const sway = Math.sin(T * 1.1 + (side < 0 ? 1.3 : 0)) * 0.035;
      c.save();
      c.scale(side, 1);
      c.translate(WHISKER_ROOT[0], WHISKER_ROOT[1]);
      c.rotate(sway * DEG_W, 0, 0);
      c.translate(-WHISKER_ROOT[0], -WHISKER_ROOT[1]);
      put(c, P.whisker, P.plain);
      c.restore();
    }
    put(c, P.snout, P.plain);
    sweep(c, P.gold, P.sweepColors, T, EVERY, 0);
    // the flaming pearl
    put(c, P.pearlGlow, faded(P.soft, 0.4 + 0.25 * Math.sin(T * 2.3)));
    c.save();
    c.translate(PEARL.x, PEARL.y);
    c.rotate(Math.sin(T * 1.7) * 0.06 * DEG_W, 0, 0);
    const k = 1 + 0.07 * Math.sin(T * 5.3) * Math.sin(T * 2.1);
    c.scale(k, k);
    c.translate(-PEARL.x, -PEARL.y);
    put(c, P.flames, P.plain);
    c.restore();
    c.drawPicture(P.pearl);
    for (const g of P.glints) {
      const s = Math.max(0, Math.sin(T * g.speed + g.phase));
      if (s <= 0) continue;
      c.save();
      c.translate(g.x, g.y);
      const z = 0.15 + s ** 5;
      c.scale(z, z);
      c.drawPath(g.path, faded(P.white, s ** 3));
      c.restore();
    }
    // the embers rise and fade
    for (const e of P.sparks) {
      const p = ((T + e.offset) % e.life) / e.life;
      const o = Math.sin(p * Math.PI);
      if (o <= 0) continue;
      c.save();
      c.translate(e.x + Math.sin(p * 6 + e.i) * 4, e.y - p * SPARKS.rise);
      put(c, P.sparkGlow, faded(P.screen, 0.35 * o));
      c.drawCircle(0, 0, SPARKS.size, faded(P.sparkCore, o));
      c.restore();
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

export const DRAGON_ART: Record<string, ArtBorderDrawing> = {
  "imperial-dragon": { back: DragonBack, front: DragonFront },
};

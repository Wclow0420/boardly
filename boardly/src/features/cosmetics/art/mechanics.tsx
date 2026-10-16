// Clockwork Grand Master and Kraken's Deep: two legendary borders.
//
// - Clockwork Grand Master: a skeleton clock round the picture. Engraved
//   brass wheels mesh in two trains up its sides (true ratios, touching
//   wheels turning opposite ways), each hub a ruby bearing, the big ones
//   carrying a steel pinion. The ring is a silver chapter ring with blued
//   hour batons in a reeded brass bezel. A small clock sits on its crown,
//   with blued hands and a moon-phase window; below, a lyre pendulum swings
//   and its anchor ticks an escape wheel round, and the whole train moves
//   on the tick. Every eight seconds the minute hand reaches twelve and the
//   clock strikes: the train lurches forward, the dial rings (it shivers,
//   glows and sends out rings of sound) and the light runs round the
//   chapter ring.
// - Kraken's Deep: a barnacled bronze ring in the deep. Two bronze-and-
//   teal arms rise from a hoard of gold and pearls, coil over and under
//   the ring and curl away at the top; there is no head, only arms. A
//   sunken ship's wheel rocks behind, dark water swirls round the lower
//   half and bubbles rise. An aquamarine sits at the crown. Every nine
//   seconds the arms tighten: the ring shudders, bubbles burst up and a
//   coin flips off the hoard.
// See crest.tsx, baroque.tsx and heraldry.tsx for the house style.

import {
  BlurMask,
  BlurStyle,
  Circle,
  ClipOp,
  FillType,
  Group,
  LinearGradient,
  Oval,
  PaintStyle,
  Path,
  Picture,
  RadialGradient,
  Rect,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
  type SkShader,
  type Transforms3d,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type DerivedValue } from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { Fx } from "./rimfx";

type Pt = [number, number];

const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(2);
const fp = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
/** A point at angle `a` (radians), radius `r`, round (cx, cy). */
const pol = (a: number, r: number, cx = 0, cy = 0): Pt => [
  cx + Math.cos(a) * r,
  cy + Math.sin(a) * r,
];
const at = (a: number, r: number, cx = 0, cy = 0) => fp(pol(a, r, cx, cy));
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (r: number, cx = 0, cy = 0, hole = false) => {
  const s = hole ? 0 : 1;
  return `M${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx + r)} ${f(cy)}Z`;
};
/** A band round a centre (a ring under either fill rule). */
const ring = (rOut: number, rIn: number, cx = 0, cy = 0) =>
  disc(rOut, cx, cy) + disc(rIn, cx, cy, true);
/** An open arc of radius r from a0 to a1 (radians, a1 > a0). */
const arc = (r: number, a0: number, a1: number, cx = 0, cy = 0) =>
  `M${at(a0, r, cx, cy)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${at(a1, r, cx, cy)}`;
const poly = (pts: Pt[]) => `M${pts.map(fp).join("L")}Z`;
/** Radial lines round a centre, from r0 to r1. */
const spokes = (
  count: number,
  r0: number,
  r1: number,
  cx = 0,
  cy = 0,
  skip?: (k: number) => boolean,
) =>
  Array.from({ length: count }, (_, k) => {
    if (skip?.(k)) return "";
    const a = (k / count) * TAU;
    return `M${at(a, r0, cx, cy)}L${at(a, r1, cx, cy)}`;
  }).join("");

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const BLUED = ["#A8C4FF", "#3A5CC0", "#12286A"];
const RUBY = ["#FF9AA6", "#D0102E", "#5A0410"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_STEEL = "#1E242C";
const INK_BLUE = "#0A1236";

// ── drawing straight onto a canvas, for the recorded pictures ─────────

const linear = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cs: string[],
  pos: number[] | null = null,
) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    cs.map((c) => Skia.Color(c)),
    pos,
    TileMode.Clamp,
  );
const radial = (
  x: number,
  y: number,
  r: number,
  cs: string[],
  pos: number[] | null = null,
) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    cs.map((c) => Skia.Color(c)),
    pos,
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

function brush(fill: SkShader | string, alpha = 1, blur = 0) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  if (typeof fill === "string") paint.setColor(Skia.Color(fill));
  else paint.setShader(fill);
  paint.setAlphaf(alpha);
  if (blur > 0)
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  return paint;
}

const path = (d: string, evenOdd = false) => {
  const p = Skia.Path.MakeFromSVGString(d);
  if (p && evenOdd) p.setFillType(FillType.EvenOdd);
  return p;
};

interface Piece {
  d: string;
  fill: SkShader | string;
  ink: string;
  width: number;
  evenOdd?: boolean;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  veinAlpha?: number;
  shine?: string;
  shineWidth?: number;
  shineAlpha?: number;
  /** Drawn inside the piece after its veins (a strip, a shade). */
  inside?: (c: SkCanvas) => void;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const shape = path(p.d, p.evenOdd);
  if (!shape) return;
  c.drawPath(shape, brush(p.fill));
  if (p.vein || p.shine || p.inside) {
    c.save();
    c.clipPath(shape, ClipOp.Intersect, true);
    p.inside?.(c);
    const vein = p.vein ? path(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? path(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(p.shineWidth ?? 0.9, "#FFFFFF", p.shineAlpha ?? 0.8),
      );
    c.restore();
  }
  if (p.width > 0) c.drawPath(shape, pen(p.width, p.ink));
}

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  draw(c);
  return recorder.finishRecordingAsPicture();
}

/** A picture recorded once, the first time it's drawn. */
function once(draw: (c: SkCanvas) => void) {
  let pic: SkPicture | null = null;
  return () => (pic ??= record(draw));
}

/** A clip path made once per component. */
function useClip(d: string, evenOdd = false) {
  return useMemo(() => path(d, evenOdd), [d, evenOdd]);
}

/** Lands with a little overshoot, 0 → 1. */
const backOut = (x: number) => {
  "worklet";
  const y = x - 1;
  return 1 + 2.7 * y * y * y + 1.7 * y * y;
};

/** A ruby jewel bearing in its gold chaton. */
function bearing(c: SkCanvas, x: number, y: number, r: number) {
  c.drawCircle(x, y, r + 0.9, brush(radial(x - 0.6, y - 0.6, r + 1.6, GOLD)));
  c.drawCircle(x, y, r + 0.9, pen(0.55, INK_GOLD));
  c.drawCircle(
    x,
    y,
    r,
    brush(radial(x - r * 0.35, y - r * 0.4, r * 1.6, RUBY)),
  );
  c.drawCircle(x, y, r, pen(0.4, "#3A0408"));
  c.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.3, brush("#FFFFFF", 0.85));
}

// ══ Clockwork Grand Master ═══════════════════════════════════════════

/** Tooth spacing along the pitch circle; every wheel here shares it, so
 *  any two can mesh. */
const PITCH = 4.2;
const BEAT = 0.5;
const STRIKE = 8;

/** Turned brass: bright at the hub, darker toward the teeth, lit at the
 *  rim. The same at any angle, so a turning wheel's light stays put. */
const TURNED = ["#FFF6CE", "#F0CA68", "#BC8834", "#80551A", "#E2B85A"];
const TURNED_AT = [0, 0.3, 0.64, 0.9, 1];

interface Gear {
  n: number;
  r: number;
  x: number;
  y: number;
  spin: 1 | -1;
  phase: number;
  /** 0: a plain wheel with lightening holes. */
  spokes: number;
  pinion: boolean;
}

/** A train of meshing wheels: the first at angle `a` (degrees) and
 *  distance `d`, each next at its own distance, turning `turn` round the
 *  picture from the last. Teeth are phased to fall into each other's
 *  gaps, and touching wheels turn opposite ways. */
function train(
  first: { n: number; d: number; a: number },
  rest: { n: number; d: number }[],
  turn: 1 | -1,
): Gear[] {
  const style = (n: number) => ({
    spokes: n >= 26 ? 5 : n >= 18 ? 4 : 0,
    pinion: n >= 26,
  });
  const rOf = (n: number) => (n * PITCH) / TAU;
  const gears: Gear[] = [];
  let ang = first.a * DEG;
  let prev = {
    n: first.n,
    r: rOf(first.n),
    d: first.d,
    phase: 0.1,
    spin: 1 as 1 | -1,
  };
  gears.push({
    n: first.n,
    r: prev.r,
    x: Math.cos(ang) * first.d,
    y: Math.sin(ang) * first.d,
    spin: 1,
    phase: prev.phase,
    ...style(first.n),
  });
  for (const g of rest) {
    const r = rOf(g.n);
    const D = prev.r + r;
    const cos = (prev.d * prev.d + g.d * g.d - D * D) / (2 * prev.d * g.d);
    const px = Math.cos(ang) * prev.d;
    const py = Math.sin(ang) * prev.d;
    ang += turn * Math.acos(cos);
    const x = Math.cos(ang) * g.d;
    const y = Math.sin(ang) * g.d;
    // the line between the centres, and where the last wheel's tooth is
    const alpha = Math.atan2(y - py, x - px);
    const u = ((alpha - prev.phase) * prev.n) / TAU;
    const phase = alpha + Math.PI - (TAU / g.n) * (0.5 - u);
    const spin = (prev.spin * -1) as 1 | -1;
    gears.push({ n: g.n, r, x, y, spin, phase, ...style(g.n) });
    prev = { n: g.n, r, d: g.d, phase, spin };
  }
  return gears;
}

const GEARS: Gear[] = [
  // up the left side, from the crown down
  ...train(
    { n: 14, d: 74, a: -114 },
    [
      { n: 30, d: 67 },
      { n: 20, d: 72 },
      { n: 28, d: 67 },
      { n: 13, d: 72 },
      { n: 20, d: 69 },
    ],
    -1,
  ),
  // and the right
  ...train(
    { n: 16, d: 74, a: -64 },
    [
      { n: 34, d: 66 },
      { n: 18, d: 73 },
      { n: 26, d: 68 },
      { n: 13, d: 71 },
      { n: 20, d: 69 },
    ],
    1,
  ),
];

/** A wheel's teeth: `n` of them round pitch radius `r`. */
function teeth(n: number, r: number, add = 1.15, ded = 1.3) {
  const p = (TAU * r) / n;
  const rr = r - ded;
  const rt = r + add;
  const step = TAU / n;
  const hr = (0.29 * p) / rr;
  const ht = (0.15 * p) / rt;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = k * step;
    d += `${k ? "L" : "M"}${at(a - hr, rr)}L${at(a - ht, rt)}A${f(rt)} ${f(rt)} 0 0 1 ${at(a + ht, rt)}L${at(a + hr, rr)}A${f(rr)} ${f(rr)} 0 0 1 ${at(a + step - hr, rr)}`;
  }
  return `${d}Z`;
}

const rimIn = (g: Gear) => g.r - 1.3 - Math.max(1.9, g.r * 0.13);
const hubOf = (g: Gear) => Math.max(2.7, g.r * 0.21);

/** The open spaces between a wheel's spokes, or its lightening holes. */
function openings(g: Gear) {
  const rin = rimIn(g);
  const hub = hubOf(g);
  if (!g.spokes) {
    const mid = (rin + hub) / 2;
    const hr = Math.max(0.9, (rin - hub - 1.6) / 2);
    return Array.from({ length: 5 }, (_, k) => {
      const [x, y] = pol((k / 5) * TAU, mid);
      return disc(hr, x, y, true);
    }).join("");
  }
  const rh = hub + 1.1;
  const sw = Math.max(1.5, g.r * 0.11);
  let d = "";
  for (let j = 0; j < g.spokes; j++) {
    const a0 = (j / g.spokes) * TAU;
    const a1 = ((j + 1) / g.spokes) * TAU;
    const o0 = a0 + sw / 2 / rin;
    const o1 = a1 - sw / 2 / rin;
    const i0 = a0 + sw / 2 / rh;
    const i1 = a1 - sw / 2 / rh;
    d += `M${at(o0, rin)}A${f(rin)} ${f(rin)} 0 0 1 ${at(o1, rin)}L${at(i1, rh)}A${f(rh)} ${f(rh)} 0 0 0 ${at(i0, rh)}Z`;
  }
  return d;
}

/** One wheel, drawn round its own centre with tooth 0 pointing right. */
function drawGear(c: SkCanvas, g: Gear) {
  const rin = rimIn(g);
  const hub = hubOf(g);
  const rr = g.r - 1.3;
  // its shadow on whatever is behind
  const body = teeth(g.n, g.r) + openings(g);
  const shadow = path(body, true);
  if (shadow) {
    c.save();
    c.translate(0.8, 1.3);
    c.drawPath(shadow, brush("#1A0E02", 0.35, 0.8));
    c.restore();
  }
  engrave(c, {
    d: body,
    evenOdd: true,
    fill: radial(0, 0, g.r + 1.2, TURNED, TURNED_AT),
    ink: INK_GOLD,
    width: g.r > 12 ? 0.9 : 0.75,
    // a groove round the rim, and the spokes' arrises
    vein: disc((rr + rin) / 2) + (g.spokes ? "" : disc(hub + 0.9)),
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
  });
  // the boss, turned
  engrave(c, {
    d: disc(hub),
    fill: radial(0, 0, hub, ["#FFF8DA", "#E8BE5E", "#A87428"]),
    ink: INK_GOLD,
    width: 0.6,
    vein: disc(hub * 0.66),
    veinColor: VEIN_GOLD,
    veinWidth: 0.4,
  });
  if (g.pinion) {
    // a steel pinion on the same arbor
    engrave(c, {
      d: teeth(8, hub * 0.82, 0.75, 0.8),
      fill: radial(0, 0, hub, ["#FFFFFF", "#C9D0DA", "#6A7484"]),
      ink: INK_STEEL,
      width: 0.5,
    });
  }
}

const GEAR_PICS: (SkPicture | null)[] = GEARS.map(() => null);
const gearPicture = (k: number) =>
  (GEAR_PICS[k] ??= record((c) => drawGear(c, GEARS[k])));

/** The beats counted so far, each landing with a little recoil. */
const beats = (t: number) => {
  "worklet";
  const n = Math.floor(t / BEAT);
  const p = t / BEAT - n;
  return n + (p < 0.16 ? backOut(p / 0.16) : 1);
};
/** The strikes so far: each throws the train forward. */
const strikes = (t: number) => {
  "worklet";
  const n = Math.floor(t / STRIKE);
  const c = t - n * STRIKE;
  return n + (c < 0.5 ? backOut(c / 0.5) : 1);
};
/** How far the train has run, along the pitch circles: half a tooth a
 *  beat, three beats more at each strike. */
const travel = (t: number) => {
  "worklet";
  return (beats(t) + 3 * strikes(t)) * (PITCH / 2);
};
/** The three strokes of the bell: 1 at each, dying away. */
const chime = (t: number) => {
  "worklet";
  const c = t % STRIKE;
  let g = 0;
  for (let k = 0; k < 3; k++) {
    const s = c - k * 0.55;
    if (s >= 0) g += Math.exp(-s * 4);
  }
  return Math.min(1.2, g);
};

function GearPiece({ t, k }: { t: Clock; k: number }) {
  const g = GEARS[k];
  const pic = useMemo(() => gearPicture(k), [k]);
  const transform = useDerivedValue(() => [
    { translateX: g.x },
    { translateY: g.y },
    { rotate: g.phase + (g.spin * travel(t.value)) / g.r },
  ]);
  return (
    <Group transform={transform}>
      <Picture picture={pic} />
    </Group>
  );
}

/** What stays still over the wheels: the light on each rim, and the
 *  jewels in the hubs. */
const gearLights = once((c) => {
  for (const g of GEARS) {
    const rin = rimIn(g);
    const rr = g.r - 1.3;
    const rs = rin + (rr - rin) * 0.72;
    const shine = path(arc(rs, 200 * DEG, 248 * DEG, g.x, g.y));
    if (shine) c.drawPath(shine, pen(0.7, "#FFFFFF", 0.8));
    bearing(c, g.x, g.y, g.pinion ? 1.3 : 1.55);
  }
});
/** Where the light sweeps over the wheels: their rims and bosses. */
const GEAR_METAL = GEARS.map(
  (g) => ring(g.r - 1.3, rimIn(g), g.x, g.y) + disc(hubOf(g), g.x, g.y),
).join("");

// The escapement under the ring's foot: an escape wheel, its anchor and
// the lyre pendulum, which hang from one pivot.
const ESC = { x: 0, y: 72, n: 15, r: 9.8 };
const PIVOT_Y = 57;

/** Saw teeth leaning the way the wheel turns. */
const ESCAPE_TEETH = (() => {
  const { n, r } = ESC;
  const rr = r - 2.3;
  const rt = r + 0.5;
  const step = TAU / n;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = k * step;
    d += `${k ? "L" : "M"}${at(a, rr)}L${at(a + 0.66 * step, rt)}L${at(a + 0.74 * step, rt - 0.4)}L${at(a + 0.8 * step, rr)}A${f(rr)} ${f(rr)} 0 0 1 ${at(a + step, rr)}`;
  }
  return `${d}Z`;
})();
const ESCAPE_BODY =
  ESCAPE_TEETH +
  Array.from({ length: 4 }, (_, j) => {
    const a0 = (j / 4) * TAU + 0.28;
    const a1 = ((j + 1) / 4) * TAU - 0.28;
    return `M${at(a0, 5.2)}A5.2 5.2 0 0 1 ${at(a1, 5.2)}L${at(a1 - 0.25, 2.6)}A2.6 2.6 0 0 0 ${at(a0 + 0.25, 2.6)}Z`;
  }).join("");

const escapePicture = once((c) => {
  const body = path(ESCAPE_BODY, true);
  if (body) {
    c.save();
    c.translate(0.6, 1);
    c.drawPath(body, brush("#1A0E02", 0.35, 0.6));
    c.restore();
  }
  engrave(c, {
    d: ESCAPE_BODY,
    evenOdd: true,
    fill: radial(0, 0, ESC.r + 0.6, TURNED, TURNED_AT),
    ink: INK_GOLD,
    width: 0.65,
    vein: disc(5.7),
    veinColor: VEIN_GOLD,
    veinWidth: 0.4,
  });
  engrave(c, {
    d: disc(2.2),
    fill: radial(0, 0, 2.2, ["#FFF8DA", "#E8BE5E", "#A87428"]),
    ink: INK_GOLD,
    width: 0.5,
  });
});

/** The anchor (steel), drawn from its pivot: an arch over the escape
 *  wheel, a pallet at each end biting between the teeth. */
const ANCHOR = (() => {
  const dy = ESC.y - PIVOT_Y;
  const reach = ESC.r + 0.7;
  const pallet = (s: 1 | -1) => {
    const a = -Math.PI / 2 + s * 47 * DEG;
    const tip = pol(a, reach - 1.6, 0, dy);
    const base = pol(a, reach + 1.4, 0, dy);
    const side = a + Math.PI / 2;
    return poly([
      [base[0] + Math.cos(side) * 1.3, base[1] + Math.sin(side) * 1.3],
      tip,
      [base[0] - Math.cos(side) * 1.3, base[1] - Math.sin(side) * 1.3],
    ]);
  };
  const arch: Pt[] = [
    [-8.7, 6.7],
    [-6.6, 2.6],
    [-3.2, -0.6],
    [3.2, -0.6],
    [6.6, 2.6],
    [8.7, 6.7],
  ];
  const outer = arch.map(([x, y]): Pt => [x * 1.12, y - 1.3]);
  const arms = `M${fp(outer[0])}${outer
    .slice(1)
    .map((p) => `L${fp(p)}`)
    .join("")}L${[...arch]
    .reverse()
    .map(fp)
    .join("L")}Z`;
  return { arms, pallets: pallet(1) + pallet(-1) };
})();

/** The lyre: two brass rods springing round the escape wheel to the bob. */
const BOB_Y = 28.4;
const LYRE = (() => {
  const side = (s: number) => {
    const pts: Pt[] = [
      [1.2, 1.5],
      [6.6, 6],
      [14.4, 13.4],
      [15.4, 17.6],
      [12, 22.8],
      [5.2, 25.8],
      [2, BOB_Y - 5],
    ].map(([x, y]) => [x * s, y]);
    return pts;
  };
  const band = (pts: Pt[], w: number) => {
    const L: Pt[] = [];
    const R: Pt[] = [];
    pts.forEach((p, k) => {
      const a = pts[Math.max(k - 1, 0)];
      const b = pts[Math.min(k + 1, pts.length - 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (-(b[1] - a[1]) / l) * (w / 2);
      const ny = ((b[0] - a[0]) / l) * (w / 2);
      L.push([p[0] + nx, p[1] + ny]);
      R.push([p[0] - nx, p[1] - ny]);
    });
    return poly([...L, ...R.reverse()]);
  };
  return band(side(1), 1.7) + band(side(-1), 1.7);
})();
const BOB_R = 6.1;
const BOB_RAYS = spokes(16, 1.8, BOB_R - 1.1, 0, BOB_Y);

const pendulumPicture = once((c) => {
  // shadows of the rods and bob
  const shade = path(LYRE + disc(BOB_R, 0, BOB_Y));
  if (shade) {
    c.save();
    c.translate(0.7, 1.2);
    c.drawPath(shade, brush("#1A0E02", 0.3, 0.7));
    c.restore();
  }
  engrave(c, {
    d: LYRE,
    fill: linear(-14, 0, 14, 28, GOLD),
    ink: INK_GOLD,
    width: 0.55,
  });
  engrave(c, {
    d: ANCHOR.arms + ANCHOR.pallets,
    fill: linear(-8, -2, 8, 14, SILVER),
    ink: INK_STEEL,
    width: 0.55,
  });
  // the pallet stones, ruby
  const stones = path(ANCHOR.pallets);
  if (stones) {
    c.drawPath(stones, brush(linear(-8, 6, 8, 14, RUBY)));
    c.drawPath(stones, pen(0.45, "#3A0408"));
  }
  engrave(c, {
    d: disc(BOB_R, 0, BOB_Y),
    fill: radial(-1.8, BOB_Y - 2, BOB_R * 1.6, [
      "#FFF6CE",
      "#E8BE5E",
      "#9A6B1E",
    ]),
    ink: INK_GOLD,
    width: 0.8,
    vein: BOB_RAYS + disc(BOB_R - 0.9, 0, BOB_Y),
    veinColor: VEIN_GOLD,
    veinWidth: 0.4,
    shine: arc(BOB_R - 1.6, 200 * DEG, 250 * DEG, 0, BOB_Y),
    shineWidth: 0.7,
  });
  bearing(c, 0, BOB_Y, 1.3);
});

function Escapement({ t }: { t: Clock }) {
  const wheel = useMemo(() => escapePicture(), []);
  const lyre = useMemo(() => pendulumPicture(), []);
  const turn = useDerivedValue(() => [
    { translateX: ESC.x },
    { translateY: ESC.y },
    { rotate: (beats(t.value) + 3 * strikes(t.value)) * (TAU / (2 * ESC.n)) },
  ]);
  const swing = useDerivedValue(() => [
    { translateY: PIVOT_Y },
    { rotate: 0.11 * Math.sin((Math.PI * t.value) / BEAT) },
  ]);
  return (
    <Group>
      <Group transform={turn}>
        <Picture picture={wheel} />
      </Group>
      <Group transform={swing}>
        <Picture picture={lyre} />
      </Group>
    </Group>
  );
}

// The ring: a silver chapter ring in a reeded brass bezel.
const CH_IN = 49.5;
const CH_OUT = 55.4;
const BZ_OUT = 60.6;

const HOURS = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) * TAU - Math.PI / 2;
  const quarter = k % 3 === 0;
  const w0 = quarter ? 1.5 : 0.95;
  const w1 = quarter ? 1.9 : 1.25;
  const r0 = 50.4;
  const r1 = 54.9;
  const s = a + Math.PI / 2;
  const off = (r: number, w: number, sgn: number): Pt => [
    Math.cos(a) * r + Math.cos(s) * w * sgn,
    Math.sin(a) * r + Math.sin(s) * w * sgn,
  ];
  return poly([off(r0, w0, -1), off(r1, w1, -1), off(r1, w1, 1), off(r0, w0, 1)]);
}).join("");

const ringPicture = once((c) => {
  engrave(c, {
    d: ring(CH_OUT, CH_IN),
    evenOdd: true,
    fill: linear(-40, -60, 40, 60, SILVER),
    ink: INK_STEEL,
    width: 0.9,
    // the minute track
    vein:
      spokes(60, 53.5, 55, 0, 0, (k) => k % 5 === 0) + disc(53.2),
    veinColor: "#2A3240",
    veinWidth: 0.35,
    veinAlpha: 0.85,
  });
  engrave(c, {
    d: HOURS,
    fill: linear(-50, -50, 50, 50, BLUED),
    ink: INK_BLUE,
    width: 0.4,
  });
  engrave(c, {
    d: ring(BZ_OUT, CH_OUT),
    evenOdd: true,
    fill: linear(-50, -70, 50, 70, GOLD),
    ink: INK_GOLD,
    width: 1.1,
    // reeding round the edge, and a groove
    vein: spokes(132, 58.9, 60.8) + disc(57.4),
    veinColor: VEIN_GOLD,
    veinWidth: 0.45,
    shine: arc(56.4, 196 * DEG, 246 * DEG),
  });
});
const RING_D = ring(BZ_OUT, CH_IN);

// The clock on the crown.
const DX = 0;
const DY = -71;
const FACE_R = 12.6;
const BEZEL_R = 16;
/** The moon window: an arch under the hands, two humps at its foot. */
const MOON_Y = DY + 6.6;
const MOON_W = 4.6;
const MOON_WINDOW = `M${f(-MOON_W)} ${f(MOON_Y)}A${MOON_W} ${MOON_W} 0 0 1 ${f(MOON_W)} ${f(MOON_Y)}A${MOON_W / 2} ${MOON_W / 2} 0 0 0 0 ${f(MOON_Y)}A${MOON_W / 2} ${MOON_W / 2} 0 0 0 ${f(-MOON_W)} ${f(MOON_Y)}Z`;
const BEZEL_D = ring(BEZEL_R, FACE_R, DX, DY);

const dialPicture = once((c) => {
  // its shadow on the ring
  c.drawCircle(DX + 0.8, DY + 1.6, BEZEL_R, brush("#1A0E02", 0.4, 1.4));
  engrave(c, {
    d: ring(BEZEL_R, FACE_R, DX, DY),
    evenOdd: true,
    fill: linear(DX - 14, DY - 16, DX + 14, DY + 16, GOLD),
    ink: INK_GOLD,
    width: 1,
    vein: spokes(44, BEZEL_R - 1.2, BEZEL_R + 0.2, DX, DY) +
      disc(FACE_R + 1.1, DX, DY),
    veinColor: VEIN_GOLD,
    veinWidth: 0.4,
    shine: arc(FACE_R + 2.2, 200 * DEG, 245 * DEG, DX, DY),
    shineWidth: 0.7,
  });
  engrave(c, {
    d: disc(FACE_R, DX, DY),
    fill: radial(DX - 3, DY - 4, FACE_R * 1.5, IVORY),
    ink: INK_GOLD,
    width: 0.6,
    vein:
      Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * TAU;
        const r0 = k % 3 === 0 ? 9.2 : 10;
        return `M${at(a, r0, DX, DY)}L${at(a, 11.6, DX, DY)}`;
      }).join("") + disc(11.9, DX, DY),
    veinColor: "#2A2014",
    veinWidth: 0.55,
    veinAlpha: 0.9,
  });
});

/** The moon disc behind the window: night blue, two gold moons. */
const moonPicture = once((c) => {
  c.drawCircle(0, 0, MOON_W + 0.4, brush(radial(0, -2, 6, ["#3A5AB0", "#14244A"])));
  for (const s of [1, -1]) {
    const x = s * 2.75;
    c.drawCircle(x, 0, 1.75, brush(radial(x - 0.5, -0.6, 2.4, GOLD)));
    c.drawCircle(x, 0, 1.75, pen(0.3, INK_GOLD));
  }
  for (let k = 0; k < 9; k++) {
    const [x, y] = pol(rnd(k + 3) * TAU, 1 + rnd(k + 9) * 3.6);
    c.drawCircle(x, y, 0.22, brush("#FFFFFF", 0.85));
  }
});

const windowFrame = once((c) => {
  const w = path(MOON_WINDOW);
  if (w) c.drawPath(w, pen(0.5, INK_GOLD));
});

const MINUTE_HAND =
  "M0 -10.8L0.95 -7.9L0.42 -7.1L0.62 2.4L-0.62 2.4L-0.42 -7.1L-0.95 -7.9Z";
const HOUR_HAND =
  "M0 -7.2L1.7 -4.8L0.62 -3.8L0.75 1.9L-0.75 1.9L-0.62 -3.8L-1.7 -4.8Z";

function Hand({
  t,
  d,
  hour,
}: {
  t: Clock;
  d: string;
  hour: boolean;
}) {
  const transform = useDerivedValue(() => {
    const a = hour
      ? (t.value / STRIKE) * (TAU / 12) + (10 * TAU) / 12
      : (beats(t.value) * TAU * BEAT) / STRIKE;
    return [{ translateX: DX }, { translateY: DY }, { rotate: a }];
  });
  return (
    <Group transform={transform}>
      <Path path={d} color="#000000" opacity={0.3} transform={[{ translateX: 0.4 }, { translateY: 0.7 }]} />
      <Path path={d}>
        <RadialGradient c={vec(-1, -6)} r={11} colors={BLUED} />
      </Path>
      <Path path={d} style="stroke" strokeWidth={0.4} strokeJoin="round" color={INK_BLUE} />
    </Group>
  );
}

function Dial({ t }: { t: Clock }) {
  const dial = useMemo(() => dialPicture(), []);
  const moon = useMemo(() => moonPicture(), []);
  const frame = useMemo(() => windowFrame(), []);
  const porthole = useClip(MOON_WINDOW);
  // the dial shivers as the bell rings
  const shiver = useDerivedValue(() => {
    const c = t.value % STRIKE;
    let s = 0;
    for (let k = 0; k < 3; k++) {
      const p = c - k * 0.55;
      if (p >= 0) s += Math.sin(p * 46) * Math.exp(-p * 6);
    }
    return [
      { translateX: DX },
      { translateY: DY },
      { rotate: 0.035 * s },
      { translateX: -DX },
      { translateY: -DY },
    ];
  });
  const glow = useDerivedValue(() => 0.18 + 0.7 * chime(t.value));
  const phase = useDerivedValue(() => [
    { translateX: 0 },
    { translateY: MOON_Y },
    { rotate: (t.value * TAU) / 48 + 0.4 },
  ]);
  return (
    <Group>
      <Circle cx={DX} cy={DY} r={24} opacity={glow} blendMode="screen">
        <RadialGradient
          c={vec(DX, DY)}
          r={24}
          colors={["#FFE9A8", "#FFC94A88", "#FFB02000"]}
          positions={[0.45, 0.7, 1]}
        />
      </Circle>
      <Group transform={shiver}>
        <Picture picture={dial} />
        {porthole ? (
          <Group clip={porthole}>
            <Group transform={phase}>
              <Picture picture={moon} />
            </Group>
          </Group>
        ) : null}
        <Picture picture={frame} />
        <Hand t={t} d={HOUR_HAND} hour />
        <Hand t={t} d={MINUTE_HAND} hour={false} />
        <Circle cx={DX} cy={DY} r={1.6} color="#E2B04A" />
        <Circle cx={DX} cy={DY} r={1.6} style="stroke" strokeWidth={0.4} color={INK_GOLD} />
        <Circle cx={DX} cy={DY} r={0.8} color="#D0102E" />
        <Sweep t={t} d={BEZEL_D} evenOdd every={5.2} phase={0.9} />
      </Group>
      <Glint t={t} x={DX} y={DY} size={4.5} phase={0.4} speed={1} />
    </Group>
  );
}

/** Rings of sound going out from the dial at each stroke. */
function Ripple({ t, k }: { t: Clock; k: number }) {
  const r = useDerivedValue(() => {
    const s = (t.value % STRIKE) - k * 0.55;
    return s < 0 ? 0 : 17 + s * 22;
  });
  const opacity = useDerivedValue(() => {
    const s = (t.value % STRIKE) - k * 0.55;
    return s < 0 || s > 1.2 ? 0 : 0.7 * (1 - s / 1.2);
  });
  return (
    <Circle
      cx={DX}
      cy={DY}
      r={r}
      style="stroke"
      strokeWidth={1.6}
      color="#FFD86A"
      opacity={opacity}
    >
      <BlurMask blur={1} style="solid" />
    </Circle>
  );
}

/** The strike's light running round the chapter ring, both ways from
 *  twelve down to six. */
function RingRun({ t, s }: { t: Clock; s: 1 | -1 }) {
  const transform = useDerivedValue(() => {
    const p = Math.min(1, (t.value % STRIKE) / 0.9);
    const a = -Math.PI / 2 + s * p * Math.PI;
    return [
      { translateX: Math.cos(a) * 52.5 },
      { translateY: Math.sin(a) * 52.5 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = (t.value % STRIKE) / 0.9;
    return p > 1 ? 0 : Math.sin(p * Math.PI) * 0.95;
  });
  return (
    <Group transform={transform} opacity={opacity} blendMode="screen">
      <Circle cx={0} cy={0} r={5} color="#FFE08A">
        <BlurMask blur={3} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={1.6} color="#FFFFFF" />
    </Group>
  );
}

function ClockBack({ t }: { t: Clock }) {
  const lights = useMemo(() => gearLights(), []);
  const glow = useDerivedValue(() => 0.3 + 0.25 * chime(t.value));
  return (
    <Group>
      <Halo r={92} color="#FFD98A" opacity={glow} />
      {[0, 1, 2].map((k) => (
        <Ripple key={k} t={t} k={k} />
      ))}
      {GEARS.map((_, k) => (
        <GearPiece key={k} t={t} k={k} />
      ))}
      <Picture picture={lights} />
      <Sweep t={t} d={GEAR_METAL} evenOdd every={5.2} />
      <Escapement t={t} />
      <Glint t={t} x={GEARS[1].x} y={GEARS[1].y} size={4} phase={1.1} />
      <Glint t={t} x={GEARS[7].x} y={GEARS[7].y} size={4} phase={2.6} />
      <Glint t={t} x={GEARS[3].x} y={GEARS[3].y} size={3.5} phase={4.2} />
      <Glint t={t} x={GEARS[9].x} y={GEARS[9].y} size={3.5} phase={5.3} />
    </Group>
  );
}

function ClockFront({ t }: { t: Clock }) {
  const picture = useMemo(() => ringPicture(), []);
  return (
    <Group>
      {/* the ring's shadow on the picture's edge */}
      <Circle
        cx={0.6}
        cy={1}
        r={CH_IN}
        style="stroke"
        strokeWidth={2.2}
        color="#000000"
        opacity={0.35}
      >
        <BlurMask blur={1.4} style="normal" />
      </Circle>
      <Picture picture={picture} />
      <RingRun t={t} s={1} />
      <RingRun t={t} s={-1} />
      <Sweep t={t} d={RING_D} evenOdd every={5.2} phase={0.6} />
      <Dial t={t} />
    </Group>
  );
}

// ══ Kraken's Deep ════════════════════════════════════════════════════

const BRONZE = ["#FFE6BE", "#D49A58", "#7E4A1C", "#EAB47C"];
const INK_BRONZE = "#2A1808";
const VEIN_BRONZE = "#6E3E14";
const TEAL = ["#DDF8F0", "#6CC2B2", "#1F625A"];
const INK_TEAL = "#0A2A26";
const WOOD = ["#D09A5E", "#8A5A2E", "#5A3618", "#A8743E"];
const INK_WOOD = "#2A1808";
const AQUA: [string, string, string] = ["#D8FFF8", "#2EC4B4", "#05463F"];
const KRAKEN = 9;

const catmull = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const g = (i: 0 | 1) =>
    0.5 *
    (2 * b[i] +
      (c[i] - a[i]) * u +
      (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u * u +
      (3 * b[i] - a[i] - 3 * c[i] + d[i]) * u * u * u);
  return [g(0), g(1)];
};

/** An arm: a smooth centre line and its width at every sample. */
interface Arm {
  p: Pt[];
  w: number[];
}
type Ctrl = [Pt, number];

function arm(ctrl: Ctrl[], S = 10): Arm {
  const p: Pt[] = [];
  const w: number[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const a = ctrl[Math.max(i - 1, 0)][0];
    const d = ctrl[Math.min(i + 2, n - 1)][0];
    for (let j = 0; j < S; j++) {
      p.push(catmull(a, ctrl[i][0], ctrl[i + 1][0], d, j / S));
      w.push(ctrl[i][1] + ((ctrl[i + 1][1] - ctrl[i][1]) * j) / S);
    }
  }
  p.push(ctrl[n - 1][0]);
  w.push(ctrl[n - 1][1]);
  return { p, w };
}

const pd = (a: number, r: number) => pol(a * DEG, r);

/** A curling tip from `start`: tighter and thinner as it goes. */
function spiral(
  start: Pt,
  heading: number,
  len: number,
  turn: number,
  w0: number,
): Ctrl[] {
  const out: Ctrl[] = [];
  let [x, y] = start;
  const N = 56;
  for (let i = 1; i <= N; i++) {
    const s = i / N;
    const th = heading + turn * s * s;
    const ds = (len / N) * (1.4 - 0.95 * s);
    x += Math.cos(th) * ds;
    y += Math.sin(th) * ds;
    if (i % 7 === 0) out.push([[x, y], Math.max(1.1, w0 * Math.pow(1 - s, 0.75))]);
  }
  return out;
}

/** A coil crossing over the ring: from the outer edge, where it comes
 *  round from behind, in to the inner edge, where it goes back under. */
const coil = (a: number, dir: 1 | -1, w: number): Arm =>
  arm(
    [
      [pd(a - dir * 1.5, 64.5 - w / 2), w * 0.95],
      [pd(a, 59.5), w],
      [pd(a + dir * 5.5, 52), w],
      [pd(a + dir * 11, 42), w * 0.95],
    ],
    8,
  );

interface Tentacle {
  /** Up from the hoard and over the ring the first time. */
  base: Arm;
  coils: Arm[];
  /** Out from under the ring, curling away. */
  tip: Arm;
  /** Where the tip leaves the ring, and its sucker side (1: right of the
   *  way it runs). */
  root: Pt;
  side: 1 | -1;
}

const TENTACLES: Tentacle[] = [
  // up out of the deep on the left, coiling four times round the ring,
  // curling away at the top
  {
    base: arm([
      [[-60, 106], 21],
      [[-67, 91], 17.5],
      [[-58, 78], 14.6],
      [[-46, 68], 12.6],
      [pd(124, 64), 11.2],
      [pd(130, 53), 10.8],
      [pd(137, 42), 10.4],
    ]),
    coils: [coil(144, 1, 9.8), coil(159, 1, 9.2), coil(174, 1, 8.6)],
    tip: arm([
      [pd(185, 56), 8.2],
      [pd(191, 63), 8],
      ...spiral(pd(194, 68), (194 + 50) * DEG, 50, 6.6, 7.6),
    ]),
    root: pd(188, 60),
    side: 1,
  },
  // and on the right, three times round, curling out at the shoulder
  {
    base: arm([
      [[60, 106], 20],
      [[67, 91], 17],
      [[58, 78], 14.2],
      [[46, 68], 12.2],
      [pd(56, 64), 10.8],
      [pd(50, 53), 10.4],
      [pd(43, 42), 10],
    ]),
    coils: [coil(36, -1, 9.4), coil(21, -1, 8.8)],
    tip: arm([
      [pd(7, 56), 8.2],
      [pd(1, 63), 8],
      ...spiral(pd(-2, 68), (-2 - 55) * DEG, 48, -6.6, 7.6),
    ]),
    root: pd(4, 60),
    side: -1,
  },
];

/** The arm's two edges, and its outline with round ends if asked. */
function edges(a: Arm) {
  const n = a.p.length;
  const tan = (k: number): Pt => {
    const p = a.p[Math.max(k - 1, 0)];
    const q = a.p[Math.min(k + 1, n - 1)];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
  };
  /** A line along the arm at `o` (-1 left edge … 1 right edge). */
  const along = (
    o: number | ((s: number) => number),
    from = 0,
    to = 1,
  ): Pt[] => {
    const out: Pt[] = [];
    for (let k = Math.round(from * (n - 1)); k <= Math.round(to * (n - 1)); k++) {
      const [tx, ty] = tan(k);
      const h = (a.w[k] / 2) * (typeof o === "number" ? o : o(k / (n - 1)));
      out.push([a.p[k][0] - ty * h, a.p[k][1] + tx * h]);
    }
    return out;
  };
  const cap = (k: number, sgn: 1 | -1): Pt[] => {
    const [tx, ty] = tan(k);
    const h = a.w[k] / 2;
    const p = a.p[k];
    const out: Pt[] = [];
    for (let i = 1; i < 10; i++) {
      const u = (i / 10) * Math.PI;
      out.push([
        p[0] + sgn * h * (-ty * Math.cos(u) + tx * Math.sin(u)),
        p[1] + sgn * h * (tx * Math.cos(u) + ty * Math.sin(u)),
      ]);
    }
    return out;
  };
  const outline = (capStart: boolean, capEnd: boolean) =>
    poly([
      ...along(1),
      ...(capEnd ? cap(n - 1, 1) : []),
      ...along(-1).reverse(),
      ...(capStart ? cap(0, -1) : []),
    ]);
  return { along, outline, tan, n };
}

const line = (pts: Pt[]) => `M${pts.map(fp).join("L")}`;
/** How much of a coil, from its outer end, is the elbow. */
const ELBOW = 0.3;

/** An arm, engraved: bronze above, the teal underside along its sucker
 *  side, suckers, cross grooves, a shine. `peek` shows only the edge of
 *  the underside (a coil lying on the ring, its suckers against it). */
function drawArm(
  c: SkCanvas,
  a: Arm,
  side: 1 | -1,
  opts: {
    capStart?: boolean;
    capEnd?: boolean;
    peek?: boolean;
    shade?: "coil" | "inner";
  } = {},
) {
  const e = edges(a);
  const d = e.outline(!!opts.capStart, !!opts.capEnd);
  const shape = path(d);
  if (!shape) return;
  // its shadow
  c.save();
  c.translate(1, 1.6);
  c.drawPath(shape, brush("#06100E", 0.4, 1.2));
  c.restore();
  c.drawPath(shape, brush(linear(-60, -70, 60, 70, BRONZE)));
  c.save();
  c.clipPath(shape, ClipOp.Intersect, true);
  // the arm's roundness: shade under its far edge
  const back = path(poly([...e.along(-side * 1.1), ...e.along(-side * 0.62).reverse()]));
  if (back) c.drawPath(back, brush("#3A1A04", 0.3));
  // the underside; on a coil it shows across the elbow, where the arm
  // turns as it comes round the ring's edge, and then only at its side
  const inner = (s: number) =>
    side *
    (opts.peek
      ? s < ELBOW
        ? -1.1 + 1.72 * Math.sin((s / ELBOW) * (Math.PI / 2)) ** 2
        : 0.62
      : 0.06);
  const strip = poly([...e.along(side * 1.1), ...e.along(inner).reverse()]);
  const under = path(strip);
  if (under) {
    if (opts.peek) {
      // the elbow's round end
      c.drawCircle(a.p[0][0], a.p[0][1], a.w[0] / 2 + 0.6, brush(linear(-50, -60, 50, 60, TEAL)));
    }
    c.drawPath(under, brush(linear(-50, -60, 50, 60, TEAL)));
    const edge = path(line(e.along(inner)));
    if (edge) c.drawPath(edge, pen(0.5, INK_TEAL, 0.8));
  }
  // suckers along it, smaller toward the tip
  let run = 0;
  let next = 1.5;
  for (let k = 1; k < e.n; k++) {
    const [x0, y0] = a.p[k - 1];
    const [x1, y1] = a.p[k];
    run += Math.hypot(x1 - x0, y1 - y0);
    if (run < next) continue;
    const w = a.w[k];
    const sAt = k / (e.n - 1);
    const elbow = opts.peek && sAt < ELBOW;
    next = run + (opts.peek ? Math.max(2.2, w * 0.42) : Math.max(1.6, w * 0.34));
    const [tx, ty] = e.tan(k);
    // two rows, staggered; on a coil, across the elbow, then at the side
    const row = Math.round(run / Math.max(1.6, w * 0.34)) % 2;
    const o = elbow
      ? ((inner(sAt) * side + 1.1) / 2) * w * 0.5 * side
      : (opts.peek ? 0.5 : row ? 0.36 : 0.2) * w * side;
    const x = x1 - ty * o;
    const y = y1 + tx * o;
    const r = Math.max(0.65, w * (elbow ? 0.17 : opts.peek ? 0.15 : 0.13));
    c.drawCircle(x, y, r, brush(radial(x - r * 0.3, y - r * 0.3, r * 1.4, ["#F6FFFB", "#BFE6DC", "#6AA89C"])));
    c.drawCircle(x, y, r * 0.45, brush("#24605A"));
    c.drawCircle(x, y, r, pen(0.35, INK_TEAL, 0.9));
  }
  // grooves round the bronze, and a groove along it
  let grooves = "";
  run = 0;
  next = 3;
  for (let k = 1; k < e.n - 2; k++) {
    const [x0, y0] = a.p[k - 1];
    const [x1, y1] = a.p[k];
    run += Math.hypot(x1 - x0, y1 - y0);
    if (run < next) continue;
    next = run + Math.max(2.4, a.w[k] * 0.75);
    const [tx, ty] = e.tan(k);
    const h = a.w[k] / 2;
    const p = (o: number): Pt => [x1 - ty * h * o, y1 + tx * h * o];
    const end = side * (opts.peek ? 0.6 : 0.05);
    const mid = (-side + end) / 2;
    const q = p(mid);
    grooves += `M${fp(p(-side))}Q${f(q[0] + tx * 0.9)} ${f(q[1] + ty * 0.9)} ${fp(p(end))}`;
  }
  const g = path(grooves + line(e.along(-side * 0.42, 0.04, 0.9)));
  if (g) c.drawPath(g, pen(0.45, VEIN_BRONZE, 0.7));
  const shine = path(line(e.along(-side * 0.66, 0.1, 0.62)));
  if (shine) c.drawPath(shine, pen(0.8, "#FFFFFF", 0.6));
  // turning away under the ring's edges
  if (opts.shade) {
    const stops =
      opts.shade === "coil"
        ? { cs: ["#00000000", "#000000A0", "#00000000", "#00000000", "#00000070", "#00000070"], at: [0, 47.6 / 68, 52 / 68, 60 / 68, 66 / 68, 1] }
        : { cs: ["#00000000", "#000000A0", "#00000000", "#00000000"], at: [0, 47.6 / 68, 52 / 68, 1] };
    c.drawCircle(0, 0, 68, brush(radial(0, 0, 68, stops.cs, stops.at)));
  }
  c.restore();
  c.drawPath(shape, pen(0.9, INK_BRONZE));
}

const ARM_PICS = TENTACLES.map((tn) => ({
  base: once((c) => drawArm(c, tn.base, tn.side, { shade: "inner" })),
  coils: once((c) => {
    for (const k of tn.coils) drawArm(c, k, tn.side, { capStart: true, peek: true, shade: "coil" });
  }),
  tip: once((c) => drawArm(c, tn.tip, tn.side, { capEnd: true })),
}));

/** The arms' grip: a slow breath, and the squeeze. */
const squeeze = (t: number) => {
  "worklet";
  const c = t % KRAKEN;
  if (c < 0.2) return Math.sin((c / 0.2) * (Math.PI / 2));
  return Math.exp(-(c - 0.2) * 2.6);
};
/** The ring's shudder when the arms squeeze. */
const shudder = (t: number) => {
  "worklet";
  const c = t % KRAKEN;
  return c > 2 ? 0 : Math.sin(c * 52) * Math.exp(-c * 4.2);
};
const gripTransform = (t: number) => {
  "worklet";
  const s = 1 - 0.04 * squeeze(t) + 0.005 * Math.sin(t * 1.1);
  return [{ rotate: 0.045 * shudder(t) }, { scale: s }];
};

function Tip({ t, k }: { t: Clock; k: number }) {
  const tn = TENTACLES[k];
  const pic = useMemo(() => ARM_PICS[k].tip(), [k]);
  const transform = useDerivedValue(() => {
    const sway =
      0.07 * Math.sin(t.value * 0.9 + k * 2.1) +
      0.025 * Math.sin(t.value * 2.3 + k) +
      tn.side * 0.12 * squeeze(t.value);
    return [
      { translateX: tn.root[0] },
      { translateY: tn.root[1] },
      { rotate: sway },
      { translateX: -tn.root[0] },
      { translateY: -tn.root[1] },
    ];
  });
  return (
    <Group transform={transform}>
      <Picture picture={pic} />
    </Group>
  );
}

// The sunken wheel: eight turned handles past a wooden rim.
const HANDLE = (() => {
  const prof: Pt[] = [
    [68.6, 2.1],
    [70.6, 2.0],
    [72, 2.7],
    [73.4, 1.8],
    [76, 3.0],
    [78.6, 3.0],
    [80.8, 1.9],
    [83.2, 2.5],
    [85.6, 2.6],
    [87.6, 1.6],
  ];
  const dense: Pt[] = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[Math.max(i - 1, 0)];
    const d = prof[Math.min(i + 2, prof.length - 1)];
    for (let j = 0; j < 6; j++) dense.push(catmull(a, prof[i], prof[i + 1], d, j / 6));
  }
  dense.push(prof[prof.length - 1]);
  // pointing right; a round knob at its end
  const top = dense.map(([x, h]): Pt => [x, -h]);
  const bottom = dense.map(([x, h]): Pt => [x, h]).reverse();
  const end = prof[prof.length - 1];
  return `M${top.map(fp).join("L")}A${end[1]} ${end[1]} 0 0 1 ${fp(bottom[0])}L${bottom.map(fp).join("L")}Z`;
})();
const SPOKE = "M40 -2.2L68.6 -2.4L68.6 2.4L40 2.2Z";
const WHEEL_RIM_OUT = 69.6;
const WHEEL_RIM_IN = 63.4;

const wheelPicture = once((c) => {
  for (let k = 0; k < 8; k++) {
    c.save();
    c.rotate(k * 45, 0, 0);
    engrave(c, {
      d: SPOKE + HANDLE,
      fill: linear(40, -3, 88, 3, WOOD),
      ink: INK_WOOD,
      width: 0.8,
      vein: "M71 0L86.6 0M74.2 -2.4L74.2 2.4M79.8 -2.2L79.8 2.2M84.4 -2.2L84.4 2.2",
      veinColor: "#4A2C12",
      veinWidth: 0.45,
      shine: "M76 -2L79 -2.1",
      shineWidth: 0.6,
    });
    c.restore();
  }
  engrave(c, {
    d: ring(WHEEL_RIM_OUT, WHEEL_RIM_IN),
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, WOOD),
    ink: INK_WOOD,
    width: 0.9,
    vein: disc(64.6) + disc(68.4),
    veinColor: "#4A2C12",
    veinWidth: 0.45,
  });
  // a brass band round the rim, and a stud at each spoke
  engrave(c, {
    d: ring(67.1, 65.9),
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, BRONZE),
    ink: INK_BRONZE,
    width: 0.4,
  });
  for (let k = 0; k < 8; k++) {
    const [x, y] = pol(k * 45 * DEG, 66.5);
    c.drawCircle(x, y, 1.5, brush(radial(x - 0.5, y - 0.5, 2.2, BRONZE)));
    c.drawCircle(x, y, 1.5, pen(0.45, INK_BRONZE));
  }
});

function ShipsWheel({ t }: { t: Clock }) {
  const pic = useMemo(() => wheelPicture(), []);
  const transform = useDerivedValue(() => [
    {
      rotate:
        0.12 +
        0.07 * Math.sin(t.value * 0.45) +
        0.03 * Math.sin(t.value * 0.23 + 1) +
        0.05 * squeeze(t.value),
    },
  ]);
  return (
    <Group transform={transform}>
      <Picture picture={pic} />
    </Group>
  );
}

/** Dark water swirling round the lower half, its currents catching the
 *  light; faint rays fall from above. `flash`: the squeeze stirs it. */
const DEEP = `
uniform float t;
uniform float flash;
${NOISE}
vec2 rot(vec2 v, float a) { float c = cos(a); float s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 44.0 || r > 98.0) return half4(0.0);
  float low = smoothstep(0.0, 58.0, xy.y);
  float edge = (1.0 - smoothstep(76.0, 95.0, r)) * smoothstep(44.0, 58.0, r);
  float ang = atan(xy.y, xy.x);
  vec2 p = rot(xy * 0.03, t * 0.14 + r * 0.03);
  float n = fbm(p * 2.0 + vec2(t * 0.12, -t * 0.08));
  float m = fbm(rot(xy * 0.05, -t * 0.1) * 2.0 + n * 1.6);
  vec3 col = mix(vec3(0.015, 0.13, 0.15), vec3(0.04, 0.34, 0.34), smoothstep(0.3, 0.75, m));
  float current = pow(0.5 + 0.5 * sin(ang * 3.0 + r * 0.16 - t * 0.7 + n * 6.0), 10.0);
  col += vec3(0.25, 0.75, 0.68) * current * (0.22 + flash * 0.6);
  float a = low * edge * (0.42 + 0.3 * n + flash * 0.15);
  // rays from the surface, above
  float ray = pow(0.5 + 0.5 * sin(xy.x * 0.16 + xy.y * 0.07 + 1.6 * sin(t * 0.25)), 6.0)
    * (1.0 - low) * smoothstep(52.0, 64.0, r) * (1.0 - smoothstep(78.0, 92.0, r)) * 0.16;
  vec3 c = col * a + vec3(0.62, 0.95, 0.9) * ray * (1.0 - a);
  return half4(c, a + ray * (1.0 - a));
}`;

/** The hoard under the ring's foot: coins in a heap, pearls among them. */
const COINS = (() => {
  const out: { x: number; y: number; rx: number; ry: number; rot: number; mark: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const x = (rnd(i + 41) - 0.5) * 60;
    const top = 70 + (x / 30) * (x / 30) * 16;
    const y = top + rnd(i + 57) * (92 - top);
    if (y > 92) continue;
    const tilt = 0.42 + rnd(i + 63) * 0.4;
    out.push({ x, y, rx: 4.5, ry: 4.5 * tilt, rot: (rnd(i + 71) - 0.5) * 0.7, mark: i % 3 });
  }
  return out.sort((a, b) => a.y - b.y);
})();
const PEARLS: [number, number, number][] = [
  [-12, 78, 2.6],
  [14, 82, 2.3],
  [-22, 88, 2.2],
  [3, 73, 2.1],
  [24, 90, 2.4],
];

function drawCoin(c: SkCanvas, x: number, y: number, rx: number, ry: number, rot: number, mark: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot / DEG, 0, 0);
  const face = Skia.Path.Make();
  face.addOval(Skia.XYWHRect(-rx, -ry, rx * 2, ry * 2));
  const edge = Skia.Path.Make();
  edge.addOval(Skia.XYWHRect(-rx, -ry + 1.1, rx * 2, ry * 2));
  c.drawPath(edge, brush("#7A4E10"));
  c.drawPath(edge, pen(0.5, INK_GOLD));
  c.drawPath(face, brush(linear(-rx, -ry, rx, ry, GOLD)));
  c.save();
  c.scale(1, ry / rx);
  const marks = [
    // a star, a cross, a crown's three points
    "M0 -2.2L0.6 -0.6L2.2 0L0.6 0.6L0 2.2L-0.6 0.6L-2.2 0L-0.6 -0.6Z",
    "M-0.6 -2.2H0.6V-0.6H2.2V0.6H0.6V2.2H-0.6V0.6H-2.2V-0.6H-0.6Z",
    "M-2 1.2L-2 -1.2L-1 0L0 -1.8L1 0L2 -1.2L2 1.2Z",
  ];
  const m = path(marks[mark]);
  const groove = path(disc(rx * 0.74));
  if (groove) c.drawPath(groove, pen(0.45, VEIN_GOLD, 0.8));
  if (m) {
    c.drawPath(m, brush("#B07A22"));
    c.drawPath(m, pen(0.3, VEIN_GOLD));
  }
  c.restore();
  const shine = path(`M${f(-rx * 0.6)} ${f(-ry * 0.45)}Q${f(-rx * 0.2)} ${f(-ry * 0.85)} ${f(rx * 0.3)} ${f(-ry * 0.8)}`);
  if (shine) c.drawPath(shine, pen(0.5, "#FFFFFF", 0.8));
  c.drawPath(face, pen(0.55, INK_GOLD));
  c.restore();
}

function drawPearl(c: SkCanvas, x: number, y: number, r: number) {
  c.drawCircle(x + 0.4, y + 0.8, r, brush("#1A0E02", 0.35, 0.6));
  c.drawCircle(x, y, r, brush(radial(x - r * 0.35, y - r * 0.4, r * 1.5, ["#FFFFFF", "#F2ECF4", "#BDB2CA", "#7E7290"])));
  c.drawCircle(x, y, r, pen(0.4, "#3A3446"));
  c.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.26, brush("#FFFFFF"));
}

const hoardPicture = once((c) => {
  // a soft dark bed under the heap
  c.drawOval(Skia.XYWHRect(-36, 72, 72, 26), brush("#04100E", 0.35, 4));
  // back to front: coins and pearls by how low they lie
  const items = [
    ...COINS.map((k) => ({ y: k.y, draw: () => drawCoin(c, k.x, k.y, k.rx, k.ry, k.rot, k.mark) })),
    ...PEARLS.map(([x, y, r]) => ({ y: y + 0.5, draw: () => drawPearl(c, x, y, r) })),
  ].sort((a, b) => a.y - b.y);
  for (const item of items) item.draw();
});

// The ring: bronze, grooved, greened in places, barnacled.
const K_IN = 49.5;
const K_OUT = 60;
const K_RING = ring(K_OUT, K_IN);
/** Barnacles: angle (degrees), radius, size. */
const BARNACLES: [number, number, number][] = [
  [52, 57.6, 2.7],
  [58, 53.4, 2.0],
  [64, 57.8, 2.2],
  [70, 54.6, 1.6],
  [83, 57.4, 2.4],
  [92, 53.6, 2.9],
  [99, 57.8, 1.9],
  [110, 55, 2.3],
  [118, 58, 1.6],
  [124, 53.6, 1.8],
  [-28, 57.4, 2.1],
  [-34, 53.6, 1.5],
  [-102, 57.6, 1.7],
  [-78, 57.8, 1.5],
  [-140, 56.4, 2.0],
  [-146, 52.8, 1.4],
];

function drawBarnacle(c: SkCanvas, a: number, r: number, s: number, i: number) {
  const [x, y] = pd(a, r);
  const pts: Pt[] = Array.from({ length: 6 }, (_, k) => {
    const ang = (k / 6) * TAU + rnd(i + k) * 0.4;
    return pol(ang, s * (0.85 + rnd(i * 3 + k) * 0.3), x, y);
  });
  const shell = path(poly(pts));
  if (!shell) return;
  c.save();
  c.translate(0.4, 0.7);
  c.drawPath(shell, brush("#0E0A04", 0.45, 0.5));
  c.restore();
  c.drawPath(shell, brush(radial(x - s * 0.4, y - s * 0.5, s * 1.8, ["#F4F0E6", "#C9C1AE", "#7A7262"])));
  const plates = path(pts.map((p) => `M${f(x)} ${f(y)}L${fp(p)}`).join(""));
  if (plates) c.drawPath(plates, pen(0.3, "#5A5446", 0.8));
  c.drawPath(shell, pen(0.45, "#2E2A20"));
  const mouth = Skia.Path.Make();
  mouth.addOval(Skia.XYWHRect(x - s * 0.36, y - s * 0.22, s * 0.72, s * 0.44));
  c.drawPath(mouth, brush("#1E1A12"));
  c.drawPath(mouth, pen(0.25, "#FFFFFF", 0.5));
}

const krakenRingPicture = once((c) => {
  engrave(c, {
    d: K_RING,
    evenOdd: true,
    fill: linear(-50, -70, 50, 70, BRONZE),
    ink: INK_BRONZE,
    width: 1.1,
    vein: disc(51.6) + disc(57.9),
    veinColor: VEIN_BRONZE,
    veinWidth: 0.55,
    shine: arc(55, 196 * DEG, 246 * DEG),
    // verdigris, thickest low down where the water lies
    inside: (cv) => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + rnd(i + 5) * 0.3;
        const low = 0.5 + 0.5 * Math.sin(a);
        const [x, y] = pol(a, 54 + (rnd(i + 8) - 0.5) * 6);
        cv.drawCircle(x, y, 2.6 + rnd(i + 11) * 3, brush("#3FB0A0", 0.25 + 0.4 * low, 1.6));
      }
    },
  });
  BARNACLES.forEach(([a, r, s], i) => drawBarnacle(c, a, r, s, i + 1));
  // the aquamarine's bronze collet at the crown
  engrave(c, {
    d: disc(6.6, 0, -55),
    fill: radial(-2, -58, 8, BRONZE),
    ink: INK_BRONZE,
    width: 0.9,
    vein: spokes(16, 5.4, 6.6, 0, -55) ,
    veinColor: VEIN_BRONZE,
    veinWidth: 0.4,
  });
});

/** A bubble rising: born low at the side, wobbling up, gone before the top. */
function Bubble({ t, i }: { t: Clock; i: number }) {
  const s = i % 2 ? 1 : -1;
  const life = 3.4 + rnd(i + 21) * 2.2;
  const x0 = s * (63 + rnd(i + 23) * 18);
  const y0 = 64 - rnd(i + 25) * 26;
  const size = 0.9 + rnd(i + 27) * 1.3;
  const transform = useDerivedValue<Transforms3d>(() => {
    const p = ((t.value + rnd(i + 29) * life) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 10 + i) * 2 },
      { translateY: y0 - p * (y0 + 80) },
      { scale: 0.7 + p * 0.5 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 29) * life) % life) / life;
    return Math.min(1, p * 6) * (1 - p) * 0.9;
  });
  return <BubbleBody transform={transform} opacity={opacity} size={size} />;
}

function BubbleBody({
  transform,
  opacity,
  size,
}: {
  transform: DerivedValue<Transforms3d>;
  opacity: DerivedValue<number>;
  size: number;
}) {
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={size} color="#7ADCD0" opacity={0.22} />
      <Circle cx={0} cy={0} r={size} style="stroke" strokeWidth={0.6} color="#DFFFF8" />
      <Circle cx={-size * 0.35} cy={-size * 0.35} r={size * 0.3} color="#FFFFFF" />
    </Group>
  );
}

/** The burst when the arms squeeze: bubbles thrown up off both sides. */
function BurstBubble({ t, i }: { t: Clock; i: number }) {
  const s = i % 2 ? 1 : -1;
  const a = (8 + rnd(i + 81) * 32) * DEG;
  const [sx, sy] = pol(a, 61 + rnd(i + 83) * 6);
  const vy = 55 + rnd(i + 85) * 45;
  const vx = 8 + rnd(i + 87) * 18;
  const delay = rnd(i + 89) * 0.25;
  const size = 1 + rnd(i + 91) * 1.9;
  const transform = useDerivedValue<Transforms3d>(() => {
    const c = (t.value % KRAKEN) - delay;
    const p = Math.max(0, c);
    return [
      { translateX: s * (sx + vx * p) + Math.sin(p * 14 + i) * 1.2 },
      { translateY: sy - vy * p + 14 * p * p },
      { scale: 0.6 + p * 0.5 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const c = (t.value % KRAKEN) - delay;
    return c < 0 || c > 1.5 ? 0 : Math.min(1, c * 8) * (1 - c / 1.5);
  });
  return <BubbleBody transform={transform} opacity={opacity} size={size} />;
}

/** A coin flipped off the hoard by the squeeze, landing back on its edge. */
function FlipCoin({ t }: { t: Clock }) {
  const transform = useDerivedValue(() => {
    const c = (t.value % KRAKEN) - 0.15;
    const p = Math.min(1, Math.max(0, c / 1.1));
    const x = 4 + 26 * p;
    const y = 74 + 12 * p - 88 * p * (1 - p);
    const spin = Math.cos(p * TAU * 2.5);
    return [
      { translateX: x },
      { translateY: y },
      { rotate: -0.3 + p * 0.6 },
      { scaleY: Math.max(0.08, Math.abs(spin)) },
    ];
  });
  const opacity = useDerivedValue(() => {
    const c = (t.value % KRAKEN) - 0.15;
    return c < 0 || c > 1.3 ? 0 : c > 1.1 ? 1 - (c - 1.1) / 0.2 : 1;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Oval x={-5.2} y={-5.2} width={10.4} height={10.4} color="#8A5A14" />
      <Oval x={-4.7} y={-4.7} width={9.4} height={9.4}>
        <RadialGradient c={vec(-1.4, -1.6)} r={6} colors={["#FFF4C0", "#E8B84A", "#A8741E"]} />
      </Oval>
      <Circle cx={0} cy={0} r={3.3} style="stroke" strokeWidth={0.5} color={VEIN_GOLD} />
      <Circle cx={0} cy={0} r={5.2} style="stroke" strokeWidth={0.7} color={INK_GOLD} />
    </Group>
  );
}

function KrakenBack({ t }: { t: Clock }) {
  const pics = useMemo(() => ARM_PICS.map((a) => a.base()), []);
  const hoard = useMemo(() => hoardPicture(), []);
  const grip = useDerivedValue(() => gripTransform(t.value));
  const stir = useDerivedValue(() => squeeze(t.value));
  return (
    <Group>
      <Halo r={92} color="#5AD8C8" opacity={0.22} />
      <ShipsWheel t={t} />
      <Fx sksl={DEEP} t={t} flash={stir} extent={96} />
      {/* the ring's shadow, falling outward on what lies behind */}
      <Circle cx={1} cy={1.6} r={61.5} style="stroke" strokeWidth={3} color="#000000" opacity={0.3}>
        <BlurMask blur={2} style="normal" />
      </Circle>
      <Group transform={grip}>
        {/* the arms rise out of the deep, fading in */}
        <Group layer>
          {pics.map((p, k) => (
            <Picture key={k} picture={p} />
          ))}
          <Rect x={-96} y={70} width={192} height={30} blendMode="dstIn">
            <LinearGradient
              start={vec(0, 78)}
              end={vec(0, 93)}
              colors={["#000000", "#00000000"]}
            />
          </Rect>
        </Group>
        {TENTACLES.map((_, k) => (
          <Tip key={k} t={t} k={k} />
        ))}
      </Group>
      <Picture picture={hoard} />
      <Glint t={t} x={PEARLS[0][0] - 0.8} y={PEARLS[0][1] - 0.9} size={3.4} phase={0.8} />
      <Glint t={t} x={-8} y={84} size={3.4} phase={2.7} />
      <Glint t={t} x={18} y={77} size={3} phase={4.4} />
    </Group>
  );
}

/** The arms' front parts: where they cross over the ring. */
const OVER = ring(95, 47.6);
const BASE_OVER = disc(63) + disc(47.6, 0, 0, true);

function KrakenFront({ t }: { t: Clock }) {
  const ringPic = useMemo(() => krakenRingPicture(), []);
  const bases = useMemo(() => ARM_PICS.map((a) => a.base()), []);
  const coils = useMemo(() => ARM_PICS.map((a) => a.coils()), []);
  const over = useClip(OVER, true);
  const baseOver = useClip(BASE_OVER);
  const shake = useDerivedValue(() => {
    const s = shudder(t.value);
    return [
      { translateX: 1.4 * s },
      { translateY: 0.5 * Math.sin(t.value * 61) * Math.abs(s) },
      { rotate: 0.045 * s },
    ];
  });
  const grip = useDerivedValue(() => gripTransform(t.value));
  const glow = useDerivedValue(() => 0.45 + 0.3 * Math.sin(t.value * 1.6) + 0.4 * squeeze(t.value));
  return (
    <Group>
      <Circle cx={0.6} cy={1} r={K_IN} style="stroke" strokeWidth={2.2} color="#000000" opacity={0.35}>
        <BlurMask blur={1.4} style="normal" />
      </Circle>
      <Group transform={shake}>
        <Picture picture={ringPic} />
        <Sweep t={t} d={K_RING} evenOdd every={5.6} phase={0.4} />
        <Circle cx={0} cy={-55} r={7} color="#5FF0DC" opacity={glow} blendMode="screen">
          <BlurMask blur={4} style="normal" />
        </Circle>
        <Gem x={0} y={-55} w={7.6} h={9} colors={AQUA} />
      </Group>
      {over ? (
        <Group clip={over}>
          <Group transform={grip}>
            {baseOver ? (
              <Group clip={baseOver}>
                {bases.map((p, k) => (
                  <Picture key={k} picture={p} />
                ))}
              </Group>
            ) : null}
            {coils.map((p, k) => (
              <Picture key={k} picture={p} />
            ))}
          </Group>
        </Group>
      ) : null}
      {Array.from({ length: 10 }, (_, i) => (
        <Bubble key={i} t={t} i={i} />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <BurstBubble key={i} t={t} i={i} />
      ))}
      <FlipCoin t={t} />
      <Glint t={t} x={0} y={-55} size={5} phase={0.3} speed={1} />
      <Glint t={t} x={-50} y={-30} size={3.5} phase={2.2} speed={0.9} />
    </Group>
  );
}

export const MECHANICS_ART: Record<string, ArtBorderDrawing> = {
  clockwork: { back: ClockBack, front: ClockFront },
  "krakens-deep": { back: KrakenBack, front: KrakenFront },
};

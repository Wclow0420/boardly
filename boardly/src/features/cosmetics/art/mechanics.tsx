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
  BlendMode,
  BlurStyle,
  ClipOp,
  FillType,
  FilterMode,
  MipmapMode,
  PaintStyle,
  PathOp,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkColor,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkRect,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import {
  TAU,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

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
  /** Drawn over the fill before its veins; must already lie inside the
   *  piece (a baked strip or shade). */
  inside?: (c: SkCanvas) => void;
}

// Cutting veins, strips and shades to a piece's outline. They used to be
// clipped as they were drawn, but a clip (and a blur) inside a picture
// that turns is worked out again on every frame; so the cut is made once,
// when the picture is recorded, with path ops, and blurred shadows are
// baked into images.

/** `d`, cut to the inside of `shape`. */
const cut = (d: SkPath | null, shape: SkPath) =>
  d ? Skia.Path.MakeFromOp(d, shape, PathOp.Intersect) : null;

/** A round-capped line's outline, as a filled shape. */
const stroked = (d: string | SkPath, width: number) => {
  const p = typeof d === "string" ? path(d) : d.copy();
  return p ? p.stroke({ width, cap: StrokeCap.Round, join: StrokeJoin.Round }) : null;
};

/** Fills `d` where it lies inside `shape`. */
function fillIn(c: SkCanvas, shape: SkPath, d: SkPath | null, paint: SkPaint) {
  const p = cut(d, shape);
  if (p) c.drawPath(p, paint);
}

/** Strokes `d` where its stroke lies inside `shape`. */
function strokeIn(
  c: SkCanvas,
  shape: SkPath,
  d: string | SkPath,
  width: number,
  color: string,
  alpha: number,
) {
  fillIn(c, shape, stroked(d, width), brush(color, alpha));
}

/** Pixels per unit the baked images are drawn at (2.2 at 74pt, 2.9 at
 *  96pt): soft shadows stay soft at any size up to about 130pt. */
const BAKE = 4;

/** Draws `draw` once into an image covering (x, y, w, h), and returns
 *  something that draws it there again. */
function bake(
  x: number,
  y: number,
  w: number,
  h: number,
  draw: (c: SkCanvas) => void,
) {
  const W = Math.ceil(w * BAKE);
  const H = Math.ceil(h * BAKE);
  const surface = Skia.Surface.Make(W, H);
  if (!surface) return () => {};
  const sc = surface.getCanvas();
  sc.scale(BAKE, BAKE);
  sc.translate(-x, -y);
  draw(sc);
  const image = surface.makeImageSnapshot();
  const src = Skia.XYWHRect(0, 0, W, H);
  const dst = Skia.XYWHRect(x, y, W / BAKE, H / BAKE);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  return (c: SkCanvas) =>
    c.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.Linear, paint);
}

/** A blurred shadow of `shape`, offset by (dx, dy), baked. */
function shadowOf(
  c: SkCanvas,
  shape: SkPath,
  dx: number,
  dy: number,
  color: string,
  alpha: number,
  blur: number,
) {
  const b = shape.computeTightBounds();
  const pad = blur * 3 + 1;
  bake(b.x + dx - pad, b.y + dy - pad, b.width + pad * 2, b.height + pad * 2, (sc) => {
    sc.translate(dx, dy);
    sc.drawPath(shape, brush(color, alpha, blur));
  })(c);
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const shape = path(p.d, p.evenOdd);
  if (!shape) return;
  c.drawPath(shape, brush(p.fill));
  p.inside?.(c);
  if (p.vein)
    strokeIn(c, shape, p.vein, p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75);
  if (p.shine)
    strokeIn(c, shape, p.shine, p.shineWidth ?? 0.9, "#FFFFFF", p.shineAlpha ?? 0.8);
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

// ── each layer as one picture a frame ─────────────────────────────────
//
// Every moving part of a layer is drawn by one worklet into one picture
// per frame (the fixed parts are pictures recorded once, drawn whole), so
// a layer is one node and one derived value however many parts move.
// The steps below match what the kit's Glint, Halo and Sweep draw.

/** Made the first time it's asked for (Jest has no Skia at load time). */
function lazy<T>(make: () => T) {
  let v: T | null = null;
  return () => (v ??= make());
}

const TO_DEG = 180 / Math.PI;
/** What a frame's picture covers: the whole canvas. */
const frameRect = lazy(() => Skia.XYWHRect(-100, -100, 200, 200));

interface GlintAt {
  x: number;
  y: number;
  star: SkPath;
  phase: number;
  speed: number;
}

/** A four-pointed glint (the kit's Glint). */
function glintAt(
  x: number,
  y: number,
  size: number,
  phase = 0,
  speed = 1.2,
): GlintAt {
  const w = size * 0.2;
  const star =
    path(
      `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`,
    ) ?? Skia.Path.Make();
  return { x, y, star, phase, speed };
}

function drawGlint(c: SkCanvas, g: GlintAt, white: SkPaint, t: number) {
  "worklet";
  const p = Math.max(0, Math.sin(t * g.speed + g.phase));
  if (p <= 0) return;
  const s = 0.15 + p ** 5;
  c.save();
  c.translate(g.x, g.y);
  c.scale(s, s);
  white.setAlphaf(p ** 3);
  c.drawPath(g.star, white);
  c.restore();
}

interface SweepAt {
  clip: SkPath;
  every: number;
  phase: number;
}

/** A light sweeping over metal (crowns' Sweep). */
function sweepAt(d: string, every: number, phase = 0, evenOdd = true): SweepAt {
  return { clip: path(d, evenOdd) ?? Skia.Path.Make(), every, phase };
}

function drawSweep(
  c: SkCanvas,
  s: SweepAt,
  band: SkPaint,
  colors: SkColor[],
  t: number,
) {
  "worklet";
  const p = ((t + s.phase) % s.every) / 1.1;
  // the rest of the time it waits well off the canvas
  if (p >= 1) return;
  // the band of light clipped to the metal is the metal filled with the
  // band's gradient (no clip to mask every frame)
  const m = Skia.Matrix();
  m.translate(-110 + p * 220, 0);
  m.rotate(0.45);
  band.setShader(
    Skia.Shader.MakeLinearGradient(
      Skia.Point(-12, 0),
      Skia.Point(12, 0),
      colors,
      null,
      TileMode.Clamp,
      m,
    ),
  );
  c.drawPath(s.clip, band);
}

/** The paints and fixed shapes every layer shares. */
const common = lazy(() => {
  const band = Skia.Paint();
  band.setAntiAlias(true);
  return {
    band,
    bandColors: ["#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"].map((k) => Skia.Color(k)),
    white: brush("#FFFFFF"),
    plain: brush("#FFFFFF"),
  };
});

/** The kit's Halo: a soft glow behind everything. */
function haloPaint(r: number, color: string) {
  return brush(radial(0, 0, r, [color, `${color}00`], [0.55, 1]));
}

/** A part drawn whole: its picture, and the same picture baked into an
 *  image, which a moving border draws instead: one quad a frame rather
 *  than hundreds of strokes, gradients and suckers replayed. Baked at
 *  SHEET_K pixels a unit, it is drawn at or a little under that from
 *  130pt down to 74pt and looks the same. A border that stands still
 *  (too small to move) draws the picture itself, crisp at any size. */
interface Sheet {
  pic: SkPicture;
  img: SkImage | null;
  src: SkRect;
  dst: SkRect;
}

const SHEET_K = 4;
const BAKED = new WeakMap<SkPicture, Sheet>();

function sheet(pic: SkPicture, [x, y, w, h]: [number, number, number, number]): Sheet {
  const none = { pic, img: null, src: frameRect(), dst: frameRect() };
  const done = BAKED.get(pic);
  if (done) return done;
  const W = Math.ceil(w * SHEET_K);
  const H = Math.ceil(h * SHEET_K);
  const surface = Skia.Surface.Make(W, H);
  if (!surface) return none;
  const c = surface.getCanvas();
  c.scale(SHEET_K, SHEET_K);
  c.translate(-x, -y);
  c.drawPicture(pic);
  const out = {
    pic,
    img: surface.makeImageSnapshot(),
    src: Skia.XYWHRect(0, 0, W, H),
    dst: Skia.XYWHRect(x, y, W / SHEET_K, H / SHEET_K),
  };
  BAKED.set(pic, out);
  return out;
}

function drawSheet(c: SkCanvas, s: Sheet, paint: SkPaint, baked: boolean) {
  "worklet";
  if (baked && s.img)
    c.drawImageRectOptions(s.img, s.src, s.dst, FilterMode.Linear, MipmapMode.None, paint);
  else c.drawPicture(s.pic);
}

/** A blurred glow or shadow, drawn every frame (circles blur cheaply). */
function glowPaint(color: string, blur: number, style = BlurStyle.Normal) {
  const paint = brush(color);
  paint.setMaskFilter(Skia.MaskFilter.MakeBlur(style, blur, true));
  return paint;
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
  if (shadow) shadowOf(c, shadow, 0.8, 1.3, "#1A0E02", 0.35, 0.8);
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
  if (body) shadowOf(c, body, 0.6, 1, "#1A0E02", 0.35, 0.6);
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
  if (shade) shadowOf(c, shade, 0.7, 1.2, "#1A0E02", 0.3, 0.7);
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

/** A hand, recorded pointing up from the dial's centre: its shadow, its
 *  blued steel, its ink. */
const handPicture = (d: string) =>
  record((c) => {
    const hand = path(d);
    if (!hand) return;
    c.save();
    c.translate(0.4, 0.7);
    c.drawPath(hand, brush("#000000", 0.3));
    c.restore();
    c.drawPath(hand, brush(radial(-1, -6, 11, BLUED)));
    const ink = pen(0.4, INK_BLUE);
    ink.setStrokeCap(StrokeCap.Butt);
    c.drawPath(hand, ink);
  });

/** The back's parts and paints, made once: each wheel's picture (and
 *  image) with where it sits and how it turns. */
const clockScene = lazy(() => ({
  ...common(),
  halo: haloPaint(92, "#FFD98A"),
  ripple: (() => {
    const paint = glowPaint("#FFD86A", 1, BlurStyle.Solid);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(1.6);
    return paint;
  })(),
  gears: GEARS.map((g, k) => ({
    x: g.x,
    y: g.y,
    r: g.r,
    spin: g.spin,
    phase: g.phase,
    pic: sheet(gearPicture(k), [-g.r - 6, -g.r - 6, 2 * g.r + 12, 2 * g.r + 12]),
  })),
  lights: sheet(gearLights(), [-92, -92, 184, 184]),
  metal: sweepAt(GEAR_METAL, 5.2),
  escape: sheet(escapePicture(), [-14, -14, 28, 28]),
  lyre: sheet(pendulumPicture(), [-21, -4, 42, 44]),
  glints: [
    glintAt(GEARS[1].x, GEARS[1].y, 4, 1.1),
    glintAt(GEARS[7].x, GEARS[7].y, 4, 2.6),
    glintAt(GEARS[3].x, GEARS[3].y, 3.5, 4.2),
    glintAt(GEARS[9].x, GEARS[9].y, 3.5, 5.3),
  ],
}));

/** The ring's shadow on the picture's edge, and the ring. */
const ringFront = once((c) => {
  const shadow = glowPaint("#000000", 1.4);
  shadow.setStyle(PaintStyle.Stroke);
  shadow.setStrokeWidth(2.2);
  shadow.setAlphaf(0.35);
  c.drawCircle(0.6, 1, CH_IN, shadow);
  c.drawPicture(ringPicture());
});

/** The arbor over the hands. */
const pinPicture = once((c) => {
  c.drawCircle(DX, DY, 1.6, brush("#E2B04A"));
  const ink = pen(0.4, INK_GOLD);
  ink.setStrokeCap(StrokeCap.Butt);
  c.drawCircle(DX, DY, 1.6, ink);
  c.drawCircle(DX, DY, 0.8, brush("#D0102E"));
});

const clockFrontScene = lazy(() => {
  const screen = (paint: SkPaint) => {
    paint.setBlendMode(BlendMode.Screen);
    return paint;
  };
  return {
    ...common(),
    ring: sheet(ringFront(), [-62, -62, 124, 124]),
    run: screen(glowPaint("#FFE08A", 3)),
    runDot: screen(brush("#FFFFFF")),
    ringSweep: sweepAt(RING_D, 5.2, 0.6),
    glow: screen(
      brush(
        radial(DX, DY, 24, ["#FFE9A8", "#FFC94A88", "#FFB02000"], [0.45, 0.7, 1]),
      ),
    ),
    dial: sheet(dialPicture(), [DX - 22, DY - 22, 44, 44]),
    moon: moonPicture(),
    porthole: path(MOON_WINDOW) ?? Skia.Path.Make(),
    frame: windowFrame(),
    hour: handPicture(HOUR_HAND),
    minute: handPicture(MINUTE_HAND),
    pin: pinPicture(),
    bezel: sweepAt(BEZEL_D, 5.2, 0.9),
    glint: glintAt(DX, DY, 4.5, 0.4, 1),
  };
});

function ClockBack({ t }: { t: Clock }) {
  const start = useStart(t);
  const S = useMemo(() => clockScene(), []);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const bounds = useMemo(() => frameRect(), []);
  const picture = useDerivedValue(() => {
    const v = t.value;
    const baked = v !== start;
    const c = recorder.beginRecording(bounds);
    S.halo.setAlphaf(0.3 + 0.25 * chime(v));
    c.drawCircle(0, 0, 92, S.halo);
    // rings of sound going out from the dial at each stroke
    for (let k = 0; k < 3; k++) {
      const s = (v % STRIKE) - k * 0.55;
      if (s < 0 || s > 1.2) continue;
      S.ripple.setAlphaf(0.7 * (1 - s / 1.2));
      c.drawCircle(DX, DY, 17 + s * 22, S.ripple);
    }
    const run = travel(v);
    for (const g of S.gears) {
      c.save();
      c.translate(g.x, g.y);
      c.rotate((g.phase + (g.spin * run) / g.r) * TO_DEG, 0, 0);
      drawSheet(c, g.pic, S.plain, baked);
      c.restore();
    }
    drawSheet(c, S.lights, S.plain, baked);
    drawSweep(c, S.metal, S.band, S.bandColors, v);
    // the escapement: the wheel ticks round, the pendulum swings
    c.save();
    c.translate(ESC.x, ESC.y);
    c.rotate((beats(v) + 3 * strikes(v)) * (TAU / (2 * ESC.n)) * TO_DEG, 0, 0);
    drawSheet(c, S.escape, S.plain, baked);
    c.restore();
    c.save();
    c.translate(0, PIVOT_Y);
    c.rotate(0.11 * Math.sin((Math.PI * v) / BEAT) * TO_DEG, 0, 0);
    drawSheet(c, S.lyre, S.plain, baked);
    c.restore();
    for (const g of S.glints) drawGlint(c, g, S.white, v);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

function ClockFront({ t }: { t: Clock }) {
  const start = useStart(t);
  const S = useMemo(() => clockFrontScene(), []);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const bounds = useMemo(() => frameRect(), []);
  const picture = useDerivedValue(() => {
    const v = t.value;
    const baked = v !== start;
    const c = recorder.beginRecording(bounds);
    drawSheet(c, S.ring, S.plain, baked);
    // the strike's light running round the chapter ring, both ways from
    // twelve down to six
    const p = (v % STRIKE) / 0.9;
    if (p <= 1) {
      const o = Math.sin(p * Math.PI) * 0.95;
      if (o > 0) {
        S.run.setAlphaf(o);
        S.runDot.setAlphaf(o);
        for (const s of [1, -1]) {
          const a = -Math.PI / 2 + s * p * Math.PI;
          c.save();
          c.translate(Math.cos(a) * 52.5, Math.sin(a) * 52.5);
          c.drawCircle(0, 0, 5, S.run);
          c.drawCircle(0, 0, 1.6, S.runDot);
          c.restore();
        }
      }
    }
    drawSweep(c, S.ringSweep, S.band, S.bandColors, v);
    // the dial glows as the bell rings
    S.glow.setAlphaf(0.18 + 0.7 * chime(v));
    c.drawCircle(DX, DY, 24, S.glow);
    // and shivers
    const cy = v % STRIKE;
    let sh = 0;
    for (let k = 0; k < 3; k++) {
      const q = cy - k * 0.55;
      if (q >= 0) sh += Math.sin(q * 46) * Math.exp(-q * 6);
    }
    c.save();
    c.translate(DX, DY);
    c.rotate(0.035 * sh * TO_DEG, 0, 0);
    c.translate(-DX, -DY);
    drawSheet(c, S.dial, S.plain, baked);
    c.save();
    c.clipPath(S.porthole, ClipOp.Intersect, true);
    c.translate(0, MOON_Y);
    c.rotate(((v * TAU) / 48 + 0.4) * TO_DEG, 0, 0);
    c.drawPicture(S.moon);
    c.restore();
    c.drawPicture(S.frame);
    c.save();
    c.translate(DX, DY);
    c.rotate(((v / STRIKE) * (TAU / 12) + (10 * TAU) / 12) * TO_DEG, 0, 0);
    c.drawPicture(S.hour);
    c.restore();
    c.save();
    c.translate(DX, DY);
    c.rotate(((beats(v) * TAU * BEAT) / STRIKE) * TO_DEG, 0, 0);
    c.drawPicture(S.minute);
    c.restore();
    c.drawPicture(S.pin);
    drawSweep(c, S.bezel, S.band, S.bandColors, v);
    c.restore();
    drawGlint(c, S.glint, S.white, v);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
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
  shadowOf(c, shape, 1, 1.6, "#06100E", 0.4, 1.2);
  c.drawPath(shape, brush(linear(-60, -70, 60, 70, BRONZE)));
  // everything from here to the outline is cut to the arm
  // the arm's roundness: shade under its far edge
  const back = path(poly([...e.along(-side * 1.1), ...e.along(-side * 0.62).reverse()]));
  fillIn(c, shape, back, brush("#3A1A04", 0.3));
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
      const end = Skia.Path.Make();
      end.addCircle(a.p[0][0], a.p[0][1], a.w[0] / 2 + 0.6);
      fillIn(c, shape, end, brush(linear(-50, -60, 50, 60, TEAL)));
    }
    fillIn(c, shape, under, brush(linear(-50, -60, 50, 60, TEAL)));
    strokeIn(c, shape, line(e.along(inner)), 0.5, INK_TEAL, 0.8);
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
    const cup = brush(radial(x - r * 0.3, y - r * 0.3, r * 1.4, ["#F6FFFB", "#BFE6DC", "#6AA89C"]));
    // most lie well inside the arm and are drawn as they are; one that
    // reaches its edge is cut to it
    const clear = Array.from({ length: 16 }, (_, j) => (j / 16) * TAU).every((ang) =>
      shape.contains(x + Math.cos(ang) * (r + 0.25), y + Math.sin(ang) * (r + 0.25)),
    );
    if (clear) {
      c.drawCircle(x, y, r, cup);
      c.drawCircle(x, y, r * 0.45, brush("#24605A"));
      c.drawCircle(x, y, r, pen(0.35, INK_TEAL, 0.9));
    } else {
      const rim = Skia.Path.Make();
      rim.addCircle(x, y, r);
      const mouth = Skia.Path.Make();
      mouth.addCircle(x, y, r * 0.45);
      fillIn(c, shape, rim, cup);
      fillIn(c, shape, mouth, brush("#24605A"));
      strokeIn(c, shape, rim, 0.35, INK_TEAL, 0.9);
    }
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
  strokeIn(c, shape, grooves + line(e.along(-side * 0.42, 0.04, 0.9)), 0.45, VEIN_BRONZE, 0.7);
  strokeIn(c, shape, line(e.along(-side * 0.66, 0.1, 0.62)), 0.8, "#FFFFFF", 0.6);
  // turning away under the ring's edges
  if (opts.shade) {
    const stops =
      opts.shade === "coil"
        ? { cs: ["#00000000", "#000000A0", "#00000000", "#00000000", "#00000070", "#00000070"], at: [0, 47.6 / 68, 52 / 68, 60 / 68, 66 / 68, 1] }
        : { cs: ["#00000000", "#000000A0", "#00000000", "#00000000"], at: [0, 47.6 / 68, 52 / 68, 1] };
    const deep = Skia.Path.Make();
    deep.addCircle(0, 0, 68);
    fillIn(c, shape, deep, brush(radial(0, 0, 68, stops.cs, stops.at)));
  }
  c.drawPath(shape, pen(0.9, INK_BRONZE));
}

const ARM_PICS = TENTACLES.map((tn) => ({
  base: once((c) => drawArm(c, tn.base, tn.side, { shade: "inner" })),
  coils: once((c) => {
    for (const k of tn.coils) drawArm(c, k, tn.side, { capStart: true, peek: true, shade: "coil" });
  }),
  tip: once((c) => drawArm(c, tn.tip, tn.side, { capEnd: true })),
}));

/** Both arms' rise out of the deep, fading in toward the hoard: drawn
 *  straight down to y 78, and only the strip below that through a layer
 *  (once the whole canvas went through one, every frame). */
const FADE_Y = 78;
const risingPicture = once((c) => {
  const bases = ARM_PICS.map((a) => a.base());
  c.save();
  c.clipRect(Skia.XYWHRect(-200, -200, 400, 200 + FADE_Y), ClipOp.Intersect, false);
  for (const p of bases) c.drawPicture(p);
  c.restore();
  c.save();
  c.clipRect(Skia.XYWHRect(-96, FADE_Y, 192, 100 - FADE_Y), ClipOp.Intersect, false);
  c.saveLayer();
  for (const p of bases) c.drawPicture(p);
  const fade = Skia.Paint();
  fade.setShader(linear(0, 78, 0, 93, ["#000000", "#00000000"]));
  fade.setBlendMode(BlendMode.DstIn);
  c.drawRect(Skia.XYWHRect(-96, 70, 192, 30), fade);
  c.restore();
  c.restore();
});

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
  shadowOf(c, shell, 0.4, 0.7, "#0E0A04", 0.45, 0.5);
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
    inside: bake(-K_OUT - 1, -K_OUT - 1, K_OUT * 2 + 2, K_OUT * 2 + 2, (cv) => {
      const band = path(K_RING, true);
      if (band) cv.clipPath(band, ClipOp.Intersect, true);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + rnd(i + 5) * 0.3;
        const low = 0.5 + 0.5 * Math.sin(a);
        const [x, y] = pol(a, 54 + (rnd(i + 8) - 0.5) * 6);
        cv.drawCircle(x, y, 2.6 + rnd(i + 11) * 3, brush("#3FB0A0", 0.25 + 0.4 * low, 1.6));
      }
    }),
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

/** Bubbles rising: born low at the side, wobbling up, gone before the
 *  top. */
const BUBBLES = Array.from({ length: 10 }, (_, i) => {
  const s = i % 2 ? 1 : -1;
  const life = 3.4 + rnd(i + 21) * 2.2;
  return {
    i,
    life,
    x0: s * (63 + rnd(i + 23) * 18),
    y0: 64 - rnd(i + 25) * 26,
    size: 0.9 + rnd(i + 27) * 1.3,
    lead: rnd(i + 29) * life,
  };
});

/** The burst when the arms squeeze: bubbles thrown up off both sides. */
const BURST = Array.from({ length: 20 }, (_, i) => {
  const a = (8 + rnd(i + 81) * 32) * DEG;
  const [sx, sy] = pol(a, 61 + rnd(i + 83) * 6);
  return {
    i,
    s: i % 2 ? 1 : -1,
    sx,
    sy,
    vy: 55 + rnd(i + 85) * 45,
    vx: 8 + rnd(i + 87) * 18,
    delay: rnd(i + 89) * 0.25,
    size: 1 + rnd(i + 91) * 1.9,
  };
});

interface BubblePaints {
  water: SkPaint;
  film: SkPaint;
  white: SkPaint;
}

/** One bubble at (x, y), scaled, faded to `o`. */
function drawBubble(
  c: SkCanvas,
  P: BubblePaints,
  x: number,
  y: number,
  scale: number,
  size: number,
  o: number,
) {
  "worklet";
  if (o <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  P.water.setAlphaf(0.22 * o);
  c.drawCircle(0, 0, size, P.water);
  P.film.setAlphaf(o);
  c.drawCircle(0, 0, size, P.film);
  P.white.setAlphaf(o);
  c.drawCircle(-size * 0.35, -size * 0.35, size * 0.3, P.white);
  c.restore();
}

/** The water, working out nothing outside the band it can colour
 *  (r 44–95), nor its currents above the middle, where they are never
 *  seen. */
const DEEP_FAST = DEEP.replace(
  `  if (r < 44.0 || r > 98.0) return half4(0.0);
  float low = smoothstep(0.0, 58.0, xy.y);`,
  `  if (r < 44.0 || r > 95.0) return half4(0.0);
  float low = smoothstep(0.0, 58.0, xy.y);
  if (low <= 0.0) {
    float ray0 = pow(0.5 + 0.5 * sin(xy.x * 0.16 + xy.y * 0.07 + 1.6 * sin(t * 0.25)), 6.0)
      * smoothstep(52.0, 64.0, r) * (1.0 - smoothstep(78.0, 92.0, r)) * 0.16;
    return half4(vec3(0.62, 0.95, 0.9) * ray0, ray0);
  }`,
);

/** The halo and the dark water's glow, behind everything. */
const krakenHalo = once((c) => {
  const halo = haloPaint(92, "#5AD8C8");
  halo.setAlphaf(0.22);
  c.drawCircle(0, 0, 92, halo);
});

/** The ring's shadow, falling outward on what lies behind. */
const ringShadow = once((c) => {
  const shadow = glowPaint("#000000", 2);
  shadow.setStyle(PaintStyle.Stroke);
  shadow.setStrokeWidth(3);
  shadow.setAlphaf(0.3);
  c.drawCircle(1, 1.6, 61.5, shadow);
});

/** Where an arm's drawing lies (its shadow too), cut to `box`. */
function armBox(
  arms: Arm[],
  box: [number, number, number, number] = [-96, -96, 96, 96],
): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const a of arms)
    a.p.forEach(([x, y], k) => {
      const r = a.w[k] / 2 + 8;
      x0 = Math.min(x0, x - r);
      y0 = Math.min(y0, y - r);
      x1 = Math.max(x1, x + r);
      y1 = Math.max(y1, y + r);
    });
  x0 = Math.max(x0, box[0]);
  y0 = Math.max(y0, box[1]);
  x1 = Math.min(x1, box[2]);
  y1 = Math.min(y1, box[3]);
  return [x0, y0, x1 - x0, y1 - y0];
}

const deepEffect = lazy(() => Skia.RuntimeEffect.Make(DEEP_FAST));

const krakenScene = () => {
  const deep = Skia.Paint();
  deep.setAntiAlias(true);
  return {
    ...common(),
    halo: krakenHalo(),
    wheel: sheet(wheelPicture(), [-91, -91, 182, 182]),
    effect: deepEffect(),
    deep,
    // over the art's square, as the rims' Fx draws it (a ring-shaped path
    // here would be masked on the CPU every frame)
    water: Skia.XYWHRect(-96, -96, 192, 192),
    shadow: ringShadow(),
    rising: sheet(
      risingPicture(),
      armBox(TENTACLES.map((tn) => tn.base), [-96, -96, 96, 100]),
    ),
    tips: TENTACLES.map((tn, k) => ({
      x: tn.root[0],
      y: tn.root[1],
      side: tn.side,
      pic: sheet(ARM_PICS[k].tip(), armBox([tn.tip])),
    })),
    hoard: sheet(hoardPicture(), [-50, 58, 100, 42]),
    glints: [
      glintAt(PEARLS[0][0] - 0.8, PEARLS[0][1] - 0.9, 3.4, 0.8),
      glintAt(-8, 84, 3.4, 2.7),
      glintAt(18, 77, 3, 4.4),
    ],
  };
};

/** The aquamarine: its dark setting, the stone, a highlight. */
const gemPicture = once((c) => {
  const [x, y, w, h] = [0, -55, 7.6, 9];
  c.drawOval(Skia.XYWHRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2), brush("#5A3A08"));
  c.drawOval(
    Skia.XYWHRect(x - w / 2, y - h / 2, w, h),
    brush(radial(x - w * 0.2, y - h * 0.25, Math.max(w, h), AQUA)),
  );
  c.drawOval(Skia.XYWHRect(x - w * 0.28, y - h * 0.32, w * 0.3, h * 0.22), brush("#FFFFFFCC"));
});

/** The ring's shadow on the picture's edge. */
const innerShadow = once((c) => {
  const shadow = glowPaint("#000000", 1.4);
  shadow.setStyle(PaintStyle.Stroke);
  shadow.setStrokeWidth(2.2);
  shadow.setAlphaf(0.35);
  c.drawCircle(0.6, 1, K_IN, shadow);
});

/** The arms' front parts: where they cross over the ring. */
const OVER = ring(95, 47.6);
const BASE_OVER = disc(63) + disc(47.6, 0, 0, true);

const krakenFrontScene = () => {
  const glow = glowPaint("#5FF0DC", 4);
  glow.setBlendMode(BlendMode.Screen);
  const film = brush("#DFFFF8");
  film.setStyle(PaintStyle.Stroke);
  film.setStrokeWidth(0.6);
  const stroke = (width: number, color: string) => {
    const paint = brush(color);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    return paint;
  };
  return {
    ...common(),
    shadow: innerShadow(),
    ring: sheet(krakenRingPicture(), [-63, -63, 126, 126]),
    ringSweep: sweepAt(K_RING, 5.6, 0.4),
    glow,
    gem: gemPicture(),
    over: path(OVER, true) ?? Skia.Path.Make(),
    baseOver: path(BASE_OVER) ?? Skia.Path.Make(),
    bases: ARM_PICS.map((a, k) =>
      sheet(a.base(), armBox([TENTACLES[k].base], [-72, -72, 72, 72])),
    ),
    coils: ARM_PICS.map((a, k) => sheet(a.coils(), armBox(TENTACLES[k].coils))),
    bubble: { water: brush("#7ADCD0"), film, white: brush("#FFFFFF") },
    coin: {
      edge: brush("#8A5A14"),
      edgeRect: Skia.XYWHRect(-5.2, -5.2, 10.4, 10.4),
      face: brush(radial(-1.4, -1.6, 6, ["#FFF4C0", "#E8B84A", "#A8741E"])),
      faceRect: Skia.XYWHRect(-4.7, -4.7, 9.4, 9.4),
      groove: stroke(0.5, VEIN_GOLD),
      ink: stroke(0.7, INK_GOLD),
    },
    glints: [glintAt(0, -55, 5, 0.3, 1), glintAt(-50, -30, 3.5, 2.2, 0.9)],
  };
};

/** The clock as this border was first shown: a border too small to move
 *  is handed one that stands still there, so it draws its pictures
 *  rather than the baked images. (The shared clock's context doesn't
 *  reach inside the canvas, so it's told apart by moving.) */
function useStart(t: Clock) {
  return useMemo(() => t.value, [t]);
}

function KrakenBack({ t }: { t: Clock }) {
  const start = useStart(t);
  const S = useMemo(() => krakenScene(), []);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const bounds = useMemo(() => frameRect(), []);
  const picture = useDerivedValue(() => {
    const v = t.value;
    const baked = v !== start;
    const sq = squeeze(v);
    const c = recorder.beginRecording(bounds);
    c.drawPicture(S.halo);
    // the sunken wheel rocks
    c.save();
    c.rotate(
      (0.12 + 0.07 * Math.sin(v * 0.45) + 0.03 * Math.sin(v * 0.23 + 1) + 0.05 * sq) *
        TO_DEG,
      0,
      0,
    );
    drawSheet(c, S.wheel, S.plain, baked);
    c.restore();
    if (S.effect) {
      S.deep.setShader(S.effect.makeShader([v, sq]));
      c.drawRect(S.water, S.deep);
    }
    c.drawPicture(S.shadow);
    // the arms' grip
    c.save();
    c.rotate(0.045 * shudder(v) * TO_DEG, 0, 0);
    const g = 1 - 0.04 * sq + 0.005 * Math.sin(v * 1.1);
    c.scale(g, g);
    drawSheet(c, S.rising, S.plain, baked);
    for (let k = 0; k < S.tips.length; k++) {
      const tip = S.tips[k];
      const sway =
        0.07 * Math.sin(v * 0.9 + k * 2.1) +
        0.025 * Math.sin(v * 2.3 + k) +
        tip.side * 0.12 * sq;
      c.save();
      c.translate(tip.x, tip.y);
      c.rotate(sway * TO_DEG, 0, 0);
      c.translate(-tip.x, -tip.y);
      drawSheet(c, tip.pic, S.plain, baked);
      c.restore();
    }
    c.restore();
    drawSheet(c, S.hoard, S.plain, baked);
    for (const gl of S.glints) drawGlint(c, gl, S.white, v);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

function KrakenFront({ t }: { t: Clock }) {
  const start = useStart(t);
  const S = useMemo(() => krakenFrontScene(), []);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const bounds = useMemo(() => frameRect(), []);
  const picture = useDerivedValue(() => {
    const v = t.value;
    const baked = v !== start;
    const sq = squeeze(v);
    const sh = shudder(v);
    const c = recorder.beginRecording(bounds);
    c.drawPicture(S.shadow);
    // the ring shudders when the arms squeeze
    c.save();
    c.translate(1.4 * sh, 0.5 * Math.sin(v * 61) * Math.abs(sh));
    c.rotate(0.045 * sh * TO_DEG, 0, 0);
    drawSheet(c, S.ring, S.plain, baked);
    drawSweep(c, S.ringSweep, S.band, S.bandColors, v);
    S.glow.setAlphaf(0.45 + 0.3 * Math.sin(v * 1.6) + 0.4 * sq);
    c.drawCircle(0, -55, 7, S.glow);
    c.drawPicture(S.gem);
    c.restore();
    // the arms where they cross over the ring
    c.save();
    c.clipPath(S.over, ClipOp.Intersect, true);
    c.rotate(0.045 * sh * TO_DEG, 0, 0);
    const g = 1 - 0.04 * sq + 0.005 * Math.sin(v * 1.1);
    c.scale(g, g);
    c.save();
    c.clipPath(S.baseOver, ClipOp.Intersect, true);
    for (const p of S.bases) drawSheet(c, p, S.plain, baked);
    c.restore();
    for (const p of S.coils) drawSheet(c, p, S.plain, baked);
    c.restore();
    for (const b of BUBBLES) {
      const p = ((v + b.lead) % b.life) / b.life;
      drawBubble(
        c,
        S.bubble,
        b.x0 + Math.sin(p * 10 + b.i) * 2,
        b.y0 - p * (b.y0 + 80),
        0.7 + p * 0.5,
        b.size,
        Math.min(1, p * 6) * (1 - p) * 0.9,
      );
    }
    const k9 = v % KRAKEN;
    for (const b of BURST) {
      const q = k9 - b.delay;
      if (q < 0 || q > 1.5) continue;
      drawBubble(
        c,
        S.bubble,
        b.s * (b.sx + b.vx * q) + Math.sin(q * 14 + b.i) * 1.2,
        b.sy - b.vy * q + 14 * q * q,
        0.6 + q * 0.5,
        b.size,
        Math.min(1, q * 8) * (1 - q / 1.5),
      );
    }
    // a coin flipped off the hoard, landing back on its edge
    const cc = k9 - 0.15;
    if (cc >= 0 && cc <= 1.3) {
      const o = cc > 1.1 ? 1 - (cc - 1.1) / 0.2 : 1;
      const p = Math.min(1, cc / 1.1);
      const C = S.coin;
      c.save();
      c.translate(4 + 26 * p, 74 + 12 * p - 88 * p * (1 - p));
      c.rotate((-0.3 + p * 0.6) * TO_DEG, 0, 0);
      c.scale(1, Math.max(0.08, Math.abs(Math.cos(p * TAU * 2.5))));
      C.edge.setAlphaf(o);
      c.drawOval(C.edgeRect, C.edge);
      C.face.setAlphaf(o);
      c.drawOval(C.faceRect, C.face);
      C.groove.setAlphaf(o);
      c.drawCircle(0, 0, 3.3, C.groove);
      C.ink.setAlphaf(o);
      c.drawCircle(0, 0, 5.2, C.ink);
      c.restore();
    }
    for (const gl of S.glints) drawGlint(c, gl, S.white, v);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

export const MECHANICS_ART: Record<string, ArtBorderDrawing> = {
  clockwork: { back: ClockBack, front: ClockFront },
  "krakens-deep": { back: KrakenBack, front: KrakenFront },
};

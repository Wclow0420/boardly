// The Grand Board: the ultimate Boardly border.
//   The ring is a miniature game board: a gold track laid round the
//   picture, inlaid with thirty-six squares of engraved ivory and gold,
//   enamel squares of sapphire, emerald and crimson set with gold suits,
//   and a ruby start square at the foot that beats. Round it the game is
//   being played: the app's glossy mascot (wearing its crown), a gold
//   coin spinning, an ivory die tumbling, an ace flipping, an ebony king
//   and a stack of coins, each taking its turn and hopping square to
//   square. They pass behind a grand gold crown at the top: crimson
//   velvet, pearled points, a jewelled circlet and, at its heart, the
//   gold meeple on a sapphire medallion.
//   Every eight seconds the crown flashes, confetti bursts round the
//   board in the house colours and every piece jumps at once.
// Static detail is recorded once into pictures. See heraldry.tsx,
// garden.tsx (Meeple Parade) and tabletop.tsx for the pieces it grew from.

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
  type Matrix4,
  type SkCanvas,
  type SkPicture,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { EmblemPart } from "@/components/engraved/emblem";
import { recordEmblem } from "@/components/engraved/picture";
import type { Pt } from "@/components/engraved/shapes";
import { MEEPLE_PATH } from "@/components/tabletop/Meeple";
import { HATS } from "@/features/mascot/parts/gear";
import { EYES, MOUTHS } from "@/features/mascot/parts/face";
import { BOX, lifted } from "@/features/mascot/rig";
import { COLOURS, SKINS } from "@/features/mascot/skins";
import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const DEEP_GOLD = ["#6A4410", "#A87A2A", "#D8A848"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const EBONY = ["#7A808E", "#2E323A", "#0E1014"];
const VELVET = ["#F25A6E", "#B0182E", "#6A0A1A", "#3A0410"];
const ENAMEL = {
  sapphire: ["#9AC4FF", "#2E6AD8", "#0E2A6A"],
  emerald: ["#9AF0BC", "#1E9A54", "#06401E"],
  crimson: ["#FF9AA6", "#C2203A", "#5A0614"],
};
const RUBY = ["#FF9AA6", "#D0102E", "#5A0410"];
const SAPPHIRE = ["#D8EEFF", "#2E7AE0", "#0A2A6A"];
const EMERALD = ["#C8FFD8", "#1E9A54", "#06401E"];
const INK = "#3A2408";
const VEIN_GOLD = "#7A5212";
const VEIN_IVORY = "#A08A60";
const INK_EBONY = "#08090C";
const DEG = Math.PI / 180;

// ── path data ──────────────────────────────────────────────────────────

const f2 = (n: number) => n.toFixed(2);
const P = (x: number, y: number) => `${f2(x)} ${f2(y)}`;
const circle = (r: number, cx = 0, cy = 0) =>
  `M${P(cx + r, cy)}A${r} ${r} 0 1 1 ${P(cx - r, cy)}A${r} ${r} 0 1 1 ${P(cx + r, cy)}Z`;
/** A ring between two radii; the hole winds the other way, so it stays
 *  open however it's filled (the Sweep clips to it). */
const ring = (outer: number, inner: number) =>
  circle(outer) +
  `M${P(inner, 0)}A${inner} ${inner} 0 1 0 ${P(-inner, 0)}A${inner} ${inner} 0 1 0 ${P(inner, 0)}Z`;
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  return `M${P(p.x, p.y)}A${r} ${r} 0 0 1 ${P(q.x, q.y)}`;
};
const poly = (pts: Pt[], close = true) =>
  `M${pts.map(([x, y]) => P(x, y)).join("L")}${close ? "Z" : ""}`;
/** A piece of the ring between radii r0 and r1, angles a0 to a1. */
const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const p0 = polar(a0, r0);
  const p1 = polar(a1, r0);
  const p2 = polar(a1, r1);
  const p3 = polar(a0, r1);
  return (
    `M${P(p0.x, p0.y)}A${r0} ${r0} 0 0 1 ${P(p1.x, p1.y)}` +
    `L${P(p2.x, p2.y)}A${r1} ${r1} 0 0 0 ${P(p3.x, p3.y)}Z`
  );
};
/** A rounded rectangle centred on (cx, cy). */
const rrect = (w: number, h: number, r: number, cx = 0, cy = 0) => {
  const x = w / 2;
  const y = h / 2;
  const R = (u: number, v: number) => P(cx + u, cy + v);
  return (
    `M${R(-x + r, -y)}H${f2(cx + x - r)}Q${R(x, -y)} ${R(x, -y + r)}V${f2(cy + y - r)}` +
    `Q${R(x, y)} ${R(x - r, y)}H${f2(cx - x + r)}Q${R(-x, y)} ${R(-x, y - r)}` +
    `V${f2(cy - y + r)}Q${R(-x, -y)} ${R(-x + r, -y)}Z`
  );
};
/** A four-pointed star (a rosette engraved on the gold squares). */
const star4 = (cx: number, cy: number, s: number) => {
  const w = s * 0.22;
  const R = (u: number, v: number) => P(cx + u, cy + v);
  return `M${R(0, -s)}Q${R(w, -w)} ${R(s, 0)}Q${R(w, w)} ${R(0, s)}Q${R(-w, w)} ${R(-s, 0)}Q${R(-w, -w)} ${R(0, -s)}Z`;
};

// The suits, two units tall, centred (as in tabletop.tsx).
const HEART =
  "M0 0.92C-0.6 0.42 -1 0.02 -1 -0.4C-1 -0.82 -0.62 -1 -0.34 -1C-0.14 -1 0 -0.86 0 -0.7C0 -0.86 0.14 -1 0.34 -1C0.62 -1 1 -0.82 1 -0.4C1 0.02 0.6 0.42 0 0.92Z";
const DIAMOND =
  "M0 -1Q0.32 -0.42 0.74 0Q0.32 0.42 0 1Q-0.32 0.42 -0.74 0Q-0.32 -0.42 0 -1Z";
const SPADE =
  "M0 -1C0.55 -0.5 1 -0.18 1 0.24C1 0.62 0.62 0.78 0.36 0.74C0.2 0.72 0.1 0.62 0.05 0.5Q0.1 0.84 0.4 1H-0.4Q-0.1 0.84 -0.05 0.5C-0.1 0.62 -0.2 0.72 -0.36 0.74C-0.62 0.78 -1 0.62 -1 0.24C-1 -0.18 -0.55 -0.5 0 -1Z";
const CLUB =
  "M-0.310 -0.221A0.38 0.38 0 1 1 0.310 -0.221A0.38 0.38 0 1 1 0.101 0.330Q0.1 0.62 0.36 0.98H-0.36Q-0.1 0.62 -0.101 0.330A0.38 0.38 0 1 1 -0.310 -0.221Z";

// ── drawing straight onto a canvas, for the recorded pictures ─────────

const linear = (x0: number, y0: number, x1: number, y1: number, cs: string[]) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    cs.map((c) => Skia.Color(c)),
    null,
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
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = skPath(p.d, p.evenOdd);
  if (!path) return;
  c.drawPath(path, brush(p.fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? skPath(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? skPath(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(p.shineWidth ?? 0.8, "#FFFFFF", p.shineAlpha ?? 0.8),
      );
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

function line(c: SkCanvas, d: string, width: number, color: string, alpha = 1) {
  const path = skPath(d);
  if (path) c.drawPath(path, pen(width, color, alpha));
}

/** A domed bead in a metal. */
function stud(c: SkCanvas, x: number, y: number, r: number, cs: string[], ink: string) {
  c.drawCircle(x, y, r, brush(radial(x - r * 0.4, y - r * 0.45, r * 1.7, cs)));
  c.drawCircle(x, y, r, pen(Math.min(0.5, r * 0.4), ink));
}

function pearl(c: SkCanvas, x: number, y: number, r: number) {
  c.drawCircle(
    x,
    y,
    r,
    brush(radial(x - r * 0.35, y - r * 0.4, r * 1.7, ["#FFFFFF", "#F6F0F2", "#CFC4D2", "#8E8498"])),
  );
  c.drawCircle(x, y, r, pen(Math.min(0.6, r * 0.26), "#4A3E4E", 0.85));
  c.drawCircle(x - r * 0.36, y - r * 0.38, r * 0.28, brush("#FFFFFF", 0.95));
}

/** A cut oval stone in a gold collet: setting, stone, facets, highlight. */
function gem(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
  collet = 1.1,
) {
  const oval = (ww: number, hh: number, cy = y) =>
    Array.from({ length: 32 }, (_, k): Pt => {
      const a = (k / 32) * TAU - Math.PI / 2;
      return [x + (Math.cos(a) * ww) / 2, cy + (Math.sin(a) * hh) / 2];
    });
  if (collet > 0)
    engrave(c, {
      d: poly(oval(w + collet * 2, h + collet * 2)),
      fill: linear(x - w, y - h, x + w, y + h, GOLD),
      ink: INK,
      width: 0.55,
    });
  const rim = oval(w, h);
  const table = oval(w * 0.5, h * 0.5);
  const stone = skPath(poly(rim));
  if (!stone) return;
  c.drawPath(stone, brush(radial(x - w * 0.2, y - h * 0.25, Math.max(w, h) * 0.9, colors)));
  c.save();
  c.clipPath(stone, ClipOp.Intersect, true);
  let facets = "";
  for (let k = 0; k < rim.length; k += 4) facets += `M${P(...table[k])}L${P(...rim[k])}`;
  const fp = skPath(facets + poly(table));
  if (fp) c.drawPath(fp, pen(Math.max(0.22, w * 0.04), colors[2], 0.55));
  const tp = skPath(poly(table));
  if (tp) c.drawPath(tp, brush(colors[0], 0.35));
  line(
    c,
    `M${P(x - w * 0.3, y - h * 0.12)}Q${P(x - w * 0.28, y - h * 0.32)} ${P(x - w * 0.08, y - h * 0.36)}`,
    Math.max(0.35, w * 0.1),
    "#FFFFFF",
    0.85,
  );
  c.restore();
  c.drawPath(stone, pen(Math.max(0.3, w * 0.06), colors[2], 0.9));
}

/** A suit sign, gold, `size` half-tall, its top pointing along `turn`. */
function goldSuit(c: SkCanvas, d: string, x: number, y: number, size: number, turn: number) {
  c.save();
  c.translate(x, y);
  c.rotate(turn / DEG, 0, 0);
  c.scale(size, size);
  engrave(c, {
    d,
    fill: linear(-0.8, -1, 0.8, 1, GOLD),
    ink: INK,
    width: 0.5 / size,
    shine: "M-0.6 -0.3Q-0.58 -0.6 -0.3 -0.7",
    shineWidth: 0.4 / size,
  });
  c.restore();
}

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  draw(c);
  return recorder.finishRecordingAsPicture();
}
/** Recorded the first time it's asked for, then kept. */
function once(draw: (c: SkCanvas) => void) {
  let pic: SkPicture | null = null;
  return () => (pic ??= record(draw));
}
function usePicture(get: () => SkPicture) {
  return useMemo(() => get(), [get]);
}

// ══ The board ═════════════════════════════════════════════════════════

const SQUARES = 36;
const SQ = TAU / SQUARES;
const R_IN = 49.5;
const R_OUT = 65.4;
const SQ_IN = 52.4;
const SQ_OUT = 62.2;
const SQ_MID = (SQ_IN + SQ_OUT) / 2;
const TRACK = ring(R_OUT, R_IN);
/** The start square, at the foot. */
const START = 9;
/** The enamel squares, mirrored about the upright. */
const ENAMELS: Record<number, { colors: string[]; suit: string }> = {
  5: { colors: ENAMEL.sapphire, suit: SPADE },
  13: { colors: ENAMEL.sapphire, suit: SPADE },
  0: { colors: ENAMEL.emerald, suit: CLUB },
  18: { colors: ENAMEL.emerald, suit: CLUB },
  23: { colors: ENAMEL.crimson, suit: HEART },
  31: { colors: ENAMEL.crimson, suit: DIAMOND },
};

const boardPicture = once((c) => {
  // the gold track, its shine on the rims
  engrave(c, {
    d: TRACK,
    evenOdd: true,
    fill: linear(-62, -62, 62, 62, GOLD),
    ink: INK,
    width: 1.3,
    vein: circle(51.05),
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
    shine: arc(64.5, -168, -108) + arc(50.3, -160, -122),
    shineWidth: 0.75,
  });
  // the channel the squares sit in: deeper gold, so the gaps read as
  // grooves between them
  engrave(c, {
    d: ring(SQ_OUT + 0.45, SQ_IN - 0.45),
    evenOdd: true,
    fill: linear(-60, -60, 60, 60, DEEP_GOLD),
    ink: INK,
    width: 0.55,
  });
  const half = (SQ / 2) - 0.62 / SQ_MID;
  const inset = 1.35;
  const din = inset / SQ_MID;
  // a soft corner on every square
  const corner = Skia.PathEffect.MakeCorner(1.3);
  for (let k = 0; k < SQUARES; k++) {
    const a = k * SQ;
    const a0 = a - half;
    const a1 = a + half;
    const mid = polar(a, SQ_MID);
    const d = sector(SQ_IN, SQ_OUT, a0, a1);
    const bevel = sector(SQ_IN + inset, SQ_OUT - inset, a0 + din, a1 - din);
    const path = skPath(d);
    if (!path) continue;
    const lit = (cs: string[]) => linear(mid.x - 6, mid.y - 6, mid.x + 6, mid.y + 6, cs);
    const enamel = ENAMELS[k];
    let fill: SkShader;
    if (k === START) fill = radial(mid.x - 2, mid.y - 2.4, 9, ENAMEL.crimson);
    else if (enamel) fill = radial(mid.x - 2, mid.y - 2.4, 9, enamel.colors);
    else if (k % 2 === 0) fill = lit(IVORY);
    else fill = lit(GOLD);
    const body = brush(fill);
    if (corner) body.setPathEffect(corner);
    c.drawPath(path, body);
    // the engraving: a bevel round every square; a rosette on the gold;
    // a gold inlay line round the ivory and enamel
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    if (k !== START && !enamel && k % 2 === 1) {
      line(c, bevel, 0.45, VEIN_GOLD, 0.8);
      line(c, star4(mid.x, mid.y, 2.3), 0.45, VEIN_GOLD, 0.85);
    } else if (k !== START && !enamel) {
      line(c, bevel, 0.5, "#C89A40", 0.85);
      line(c, star4(mid.x, mid.y, 1.2), 0.4, VEIN_IVORY, 0.6);
    } else {
      line(c, bevel, 0.55, "#F0CC72", 0.9);
    }
    // a shine along the edge toward the light
    const sh0 = polar(a0 + din * 0.8, SQ_OUT - 1);
    const sh1 = polar(a0 + din * 0.8, SQ_IN + 1.2);
    line(c, `M${P(sh0.x, sh0.y)}L${P(sh1.x, sh1.y)}`, 0.5, "#FFFFFF", 0.45);
    c.restore();
    const ink = pen(0.6, INK);
    if (corner) ink.setPathEffect(corner);
    c.drawPath(path, ink);
    if (enamel) goldSuit(c, enamel.suit, mid.x, mid.y, 2.75, a + Math.PI / 2);
  }
  // the start square: a ruby in a gold collet, gold rays round it
  const s = polar(START * SQ, SQ_MID);
  let rays = "";
  for (let k = 0; k < 8; k++) {
    const p0 = polar(k * 45 * DEG + 22.5 * DEG, 4.2);
    const p1 = polar(k * 45 * DEG + 22.5 * DEG, 5.6);
    rays += `M${P(s.x + p0.x, s.y + p0.y)}L${P(s.x + p1.x, s.y + p1.y)}`;
  }
  line(c, rays, 0.7, "#F0CC72", 0.9);
  gem(c, s.x, s.y, 5.4, 5.4, RUBY, 1.1);
  // beads round the outer rim: a pearl at every groove, gold between
  for (let k = 0; k < SQUARES * 2; k++) {
    const p = polar((k * SQ) / 2 + SQ / 2, 63.8);
    if (k % 2 === 0) pearl(c, p.x, p.y, 1.12);
    else stud(c, p.x, p.y, 0.85, ["#FFFBE0", "#E2B04A", "#7A5212"], INK);
  }
});

function BoardBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.2 + 0.05 * Math.sin(t.value * 1.2) + 0.35 * flashAt(t.value),
  );
  return (
    <Group>
      <Halo r={92} color="#FFD27A" opacity={glow} />
      {/* the board's thickness */}
      <Group transform={[{ translateX: 1.5 }, { translateY: 2.6 }]}>
        <Path path={TRACK} fillType="evenOdd" color="#1A0E04" opacity={0.6}>
          <BlurMask blur={1.2} style="normal" />
        </Path>
      </Group>
    </Group>
  );
}

// ══ The game: when each piece hops ════════════════════════════════════

/** One round: everyone jumps (0–0.8s), then each piece takes four
 *  turns, one after another. */
const CYCLE = 8;
/** Sets the clock so a still border (its clock stopped at 1.7) catches
 *  the board between rounds: every piece standing, no confetti. */
const PHASE = 6.2;
const PLAY_AT = 1.8;
const HOPS = 4;
const HOP_GAP = 1.45;
const HOP_LEN = 0.42;
const RIPPLE = 0.2;
const HOP_H = 5;
const BIG_LEN = 0.8;
const BIG_H = 7;
/** Where the pieces stand, feet on the outer half of the squares. */
const FEET = 59;
const PIECES = 6;
/** The square each piece starts the game on. */
const HOME = Array.from({ length: PIECES }, (_, i) => 7 + i * 6);

const smooth = (x: number) => {
  "worklet";
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** The moment of the round's flash: up fast, then fading. */
const flashAt = (T: number) => {
  "worklet";
  const c = (((T + PHASE) % CYCLE) + CYCLE) % CYCLE;
  return c < 0.1 ? c / 0.1 : Math.exp(-(c - 0.1) * 3.5);
};

interface Move {
  /** Its angle round the board. */
  a: number;
  /** Squares moved so far (fractional mid-hop). */
  steps: number;
  /** Height off the board. */
  lift: number;
  /** 0–1 through a hop, 0 between. */
  hop: number;
  /** 0–1 through the round's big jump, 0 otherwise. */
  big: number;
  /** How squashed by a landing. */
  squash: number;
}

const move = (T: number, i: number, home: number): Move => {
  "worklet";
  const c0 = T + PHASE;
  const n = Math.floor(c0 / CYCLE);
  const c = c0 - n * CYCLE;
  let steps = n * HOPS;
  let lift = 0;
  let hop = 0;
  let squash = 0;
  for (let k = 0; k < HOPS; k++) {
    const u = (c - (PLAY_AT + k * HOP_GAP + i * RIPPLE)) / HOP_LEN;
    if (u >= 1) {
      steps += 1;
      const l = (u - 1) * HOP_LEN;
      if (l < 0.22) squash = Math.max(squash, (1 - l / 0.22) ** 2);
    } else if (u > 0) {
      steps += smooth(u);
      lift = 4 * u * (1 - u) * HOP_H;
      hop = u;
    }
  }
  let big = 0;
  if (c < BIG_LEN) {
    big = c / BIG_LEN;
    lift += 4 * big * (1 - big) * BIG_H;
  } else if (c < BIG_LEN + 0.6) {
    const l = c - BIG_LEN;
    if (l < 0.28) squash = Math.max(squash, 1.4 * (1 - l / 0.28) ** 2);
    const b = (l - 0.12) / 0.4;
    if (b > 0 && b < 1) lift += 2.2 * Math.sin(b * Math.PI);
  }
  return { a: (home + steps) * SQ, steps, lift, hop, big, squash };
};

function useMove(t: Clock, i: number) {
  const home = HOME[i];
  return useDerivedValue(() => move(t.value, i, home));
}

/** Stands a piece on the board: its own +x along the way it goes, -y
 *  out from the picture (up off the board). */
function usePlace(m: SharedValue<Move>, size = 1.2) {
  return useDerivedValue(() => {
    const { a, lift } = m.value;
    const p = polar(a, FEET + lift);
    return [{ translateX: p.x }, { translateY: p.y }, { rotate: a + Math.PI / 2 }, { scale: size }];
  });
}

function PieceShadow({ m, w }: { m: SharedValue<Move>; w: number }) {
  const transform = useDerivedValue(() => {
    const { a, lift } = m.value;
    const p = polar(a, FEET - 0.3);
    return [
      { translateX: p.x },
      { translateY: p.y },
      { rotate: a + Math.PI / 2 },
      { scale: Math.max(0.45, 1 - lift * 0.04) },
    ];
  });
  const opacity = useDerivedValue(() => Math.max(0.12, 0.42 - m.value.lift * 0.025));
  return (
    <Group transform={transform} opacity={opacity}>
      <Oval x={-w / 2} y={-1.5} width={w} height={3} color="#1A0E04">
        <BlurMask blur={0.8} style="normal" />
      </Oval>
    </Group>
  );
}

// ── the mascot, crowned ──────────────────────────────────────────────

const MASCOT_SCALE = 0.2;
const FOOT_Y = 118.4; // the soles, in the mascot's box

function mascotParts(colour: string): EmblemPart[] {
  const body = SKINS.glossy.draw(colour).slice(1);
  const face = [...EYES.dots.draw({ colour }), ...MOUTHS.smile.draw({ colour })];
  const hat = HATS.crown.draw({ colour });
  return lifted([...body, ...face, ...hat]).map((part) =>
    "d" in part && (part.ink ?? 1.5) > 0 ? { ...part, ink: (part.ink ?? 1.5) * 1.8 } : part,
  );
}
let MASCOT: SkPicture | null = null;
const mascotPicture = () =>
  (MASCOT ??= recordEmblem(mascotParts(COLOURS.blue), undefined, BOX));

function MascotPiece({ t, m, i }: { t: Clock; m: SharedValue<Move>; i: number }) {
  const picture = useMemo(() => mascotPicture(), []);
  const place = usePlace(m);
  const body = useDerivedValue(() => {
    const { hop, big, squash } = m.value;
    const breathe = 1 + 0.025 * Math.sin(t.value * 2.6 + i);
    const lean = 0.16 * Math.sin(hop * Math.PI) + 0.05 * Math.sin(t.value * 1.9 + i);
    const twirl = big > 0 ? Math.cos(big * TAU) : 1;
    return [
      { rotate: lean },
      { scaleX: MASCOT_SCALE * (1 + 0.1 * squash) * twirl },
      { scaleY: MASCOT_SCALE * (1 - 0.13 * squash) * breathe },
      { translateX: -50 },
      { translateY: -FOOT_Y },
    ];
  });
  return (
    <Group transform={place}>
      <Group transform={body}>
        <Picture picture={picture} />
      </Group>
    </Group>
  );
}

// ── a gold coin, spinning on its edge ────────────────────────────────

const COIN_R = 5.3;

const coinFacePicture = once((c) => {
  const r = COIN_R;
  engrave(c, {
    d: circle(r),
    fill: radial(-r * 0.45, -r * 0.5, r * 2, ["#FFFBE0", "#F0C860", "#B8862E", "#7A5212"]),
    ink: INK,
    width: 0.7,
    vein: circle(r - 1.1),
    veinColor: VEIN_GOLD,
    veinWidth: 0.4,
    shine: `M${P(-r * 0.62, -r * 0.2)}Q${P(-r * 0.6, -r * 0.62)} ${P(-r * 0.18, -r * 0.68)}`,
    shineWidth: 0.55,
  });
  // the reeded edge
  let reeds = "";
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * TAU;
    const p = polar(a, r - 0.15);
    const q = polar(a, r - 0.85);
    reeds += `M${P(p.x, p.y)}L${P(q.x, q.y)}`;
  }
  line(c, reeds, 0.25, VEIN_GOLD, 0.7);
  // the meeple struck on it
  c.save();
  c.scale(0.3, 0.3);
  c.translate(-12, -11.75);
  engrave(c, {
    d: MEEPLE_PATH,
    fill: linear(4, 2, 20, 21, ["#FFF6C8", "#E8BA52", "#9A6B1E"]),
    ink: VEIN_GOLD,
    width: 1.3,
  });
  c.restore();
});

function CoinPiece({ t, m, i }: { t: Clock; m: SharedValue<Move>; i: number }) {
  const picture = usePicture(coinFacePicture);
  const place = usePlace(m);
  const spin = useDerivedValue(() => {
    const { steps, big } = m.value;
    return t.value * 2.2 + i + steps * Math.PI + smooth(big) * 2 * TAU;
  });
  const edge = useDerivedValue(() => [
    { translateY: -COIN_R - 0.3 },
    { translateX: -1.3 * Math.sin(spin.value) },
    { scaleX: Math.max(0.04, Math.abs(Math.cos(spin.value))) },
  ]);
  const face = useDerivedValue(() => {
    const k = Math.cos(spin.value);
    return [
      { translateY: -COIN_R - 0.3 },
      { scaleX: Math.abs(k) < 0.04 ? 0.04 * Math.sign(k || 1) : k },
    ];
  });
  return (
    <Group transform={place}>
      <Group transform={edge}>
        <Circle cx={0} cy={0} r={COIN_R + 0.2} color={INK} />
        <Circle cx={0} cy={0} r={COIN_R - 0.3} color="#9A6B1E" />
      </Group>
      <Group transform={face}>
        <Picture picture={picture} />
      </Group>
    </Group>
  );
}

// ── the stack of coins ───────────────────────────────────────────────

const stackPicture = once((c) => {
  const w = 11.4;
  const h = 2.5;
  const shifts = [0.5, -0.6, 0.2];
  shifts.forEach((dx, k) => {
    const y = -h * (k + 0.5);
    let reeds = "";
    for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 0.9) reeds += `M${P(dx + x, y - h / 2 + 0.45)}V${f2(y + h / 2 - 0.45)}`;
    engrave(c, {
      d: rrect(w, h, 1.1, dx, y),
      fill: linear(dx - w / 2, 0, dx + w / 2, 0, ["#9A6B1E", "#FFF2B8", "#E2B04A", "#7A5212"]),
      ink: INK,
      width: 0.6,
      vein: reeds,
      veinColor: VEIN_GOLD,
      veinWidth: 0.3,
    });
  });
  // the top coin's face, seen from a little above
  const top = -h * 3;
  const face = skPath(`M${P(-5.5 + 0.2, top)}A5.5 1.9 0 1 1 ${P(5.5 + 0.2, top)}A5.5 1.9 0 1 1 ${P(-5.5 + 0.2, top)}Z`);
  if (face) {
    c.drawPath(face, brush(linear(-5, top - 2, 5, top + 2, ["#FFFBE0", "#F0C860", "#B8862E"])));
    line(c, `M${P(-3.7, top)}A3.9 1.15 0 1 1 ${P(4.1, top)}A3.9 1.15 0 1 1 ${P(-3.7, top)}Z`, 0.35, VEIN_GOLD, 0.8);
    c.drawPath(face, pen(0.6, INK));
  }
});

function StackPiece({ m }: { m: SharedValue<Move> }) {
  const picture = usePicture(stackPicture);
  const place = usePlace(m);
  const body = useDerivedValue(() => {
    const { hop, squash } = m.value;
    return [
      { rotate: 0.12 * Math.sin(hop * TAU) },
      { scaleX: 1 + 0.1 * squash },
      { scaleY: 1 - 0.14 * squash + 0.08 * Math.sin(hop * Math.PI) },
    ];
  });
  return (
    <Group transform={place}>
      <Group transform={body}>
        <Picture picture={picture} />
      </Group>
    </Group>
  );
}

// ── the ebony king ───────────────────────────────────────────────────

const kingPicture = once((c) => {
  const ebony = (d: string, vein?: string, shine?: string) =>
    engrave(c, {
      d,
      fill: linear(-5, -22, 5, 0, EBONY),
      ink: INK_EBONY,
      width: 0.65,
      vein,
      veinColor: "#5A606E",
      veinWidth: 0.35,
      shine,
      shineWidth: 0.55,
      shineAlpha: 0.6,
    });
  const gold = (d: string, vein?: string) =>
    engrave(c, {
      d,
      fill: linear(-5, -22, 5, 0, GOLD),
      ink: INK,
      width: 0.6,
      vein,
      veinColor: VEIN_GOLD,
      veinWidth: 0.35,
    });
  // the foot, gold
  gold("M-5.8 0Q-6 -1.6 -4.6 -2.4H4.6Q6 -1.6 5.8 0Z", "M-5 -1.2H5");
  // the body: a tapering column
  ebony(
    "M-4.4 -2.4C-3.6 -5 -2.4 -8.6 -2.3 -12.4H2.3C2.4 -8.6 3.6 -5 4.4 -2.4Z",
    "M0 -3.6V-11.4",
    "M-3 -3.6C-2.3 -6 -1.7 -9 -1.6 -11.6",
  );
  // the collar
  gold("M-3.9 -12.2Q0 -11.4 3.9 -12.2L3.6 -14.2Q0 -13.5 -3.6 -14.2Z");
  // the crown cup
  ebony(
    "M-2.6 -14Q-3.8 -16.2 -4.1 -17.9Q0 -18.8 4.1 -17.9Q3.8 -16.2 2.6 -14Z",
    undefined,
    "M-2.9 -15.2L-3.4 -17.3",
  );
  gold("M-4.3 -17.6Q0 -18.6 4.3 -17.6L4.1 -18.9Q0 -19.9 -4.1 -18.9Z");
  // the cross on top
  gold("M-0.75 -18.8V-20.3H-2.1V-21.7H-0.75V-23.1H0.75V-21.7H2.1V-20.3H0.75V-18.8Z");
});

function KingPiece({ m }: { m: SharedValue<Move> }) {
  const picture = usePicture(kingPicture);
  const place = usePlace(m, 1.05);
  const body = useDerivedValue(() => {
    const { hop, big, squash } = m.value;
    return [
      { rotate: 0.2 * Math.sin(hop * TAU) + 0.12 * Math.sin(big * TAU) },
      { scaleX: 1 + 0.06 * squash },
      { scaleY: 1 - 0.08 * squash },
    ];
  });
  return (
    <Group transform={place}>
      <Group transform={body}>
        <Picture picture={picture} />
      </Group>
    </Group>
  );
}

// ── the ace, flipping as it goes ─────────────────────────────────────

const CARD_W = 10.6;
const CARD_H = 14.8;
const CARD = rrect(CARD_W, CARD_H, 1.6, 0, -CARD_H / 2);

const cardFacePicture = once((c) => {
  const cy = -CARD_H / 2;
  engrave(c, {
    d: CARD,
    fill: linear(-5, -15, 5, 0, IVORY),
    ink: INK,
    width: 0.7,
  });
  // a gold edge inside the border
  engrave(c, {
    d: rrect(CARD_W - 1.6, CARD_H - 1.6, 1.1, 0, cy) + rrect(CARD_W - 3, CARD_H - 3, 0.7, 0, cy),
    evenOdd: true,
    fill: linear(-5, -15, 5, 0, GOLD),
    ink: INK,
    width: 0.35,
  });
  // the ruby heart, and a small one in the corner
  c.save();
  c.translate(0, cy + 0.6);
  c.scale(3.1, 3.1);
  engrave(c, {
    d: HEART,
    fill: linear(-0.8, -1, 0.6, 0.9, RUBY),
    ink: "#3A0408",
    width: 0.5 / 3.1,
    shine: "M-0.66 -0.36Q-0.64 -0.72 -0.32 -0.8",
    shineWidth: 0.5 / 3.1,
  });
  c.restore();
  c.save();
  c.translate(-CARD_W / 2 + 2.5, -CARD_H + 2.6);
  c.scale(0.9, 0.9);
  c.drawPath(skPath(HEART) ?? Skia.Path.Make(), brush("#C2203A"));
  c.restore();
});

const cardBackPicture = once((c) => {
  const cy = -CARD_H / 2;
  engrave(c, {
    d: CARD,
    fill: linear(-5, -15, 5, 0, IVORY),
    ink: INK,
    width: 0.7,
  });
  let lattice = "";
  for (let k = 0; k < 10; k++) {
    const x = -14 + k * 2.6;
    lattice += `M${P(x, cy - 8)}L${P(x + 16, cy + 8)}M${P(x, cy + 8)}L${P(x + 16, cy - 8)}`;
  }
  engrave(c, {
    d: rrect(CARD_W - 2.4, CARD_H - 2.4, 1, 0, cy),
    fill: linear(-4, -14, 4, -1, ENAMEL.crimson),
    ink: INK,
    width: 0.4,
    vein: lattice,
    veinColor: "#F0CC72",
    veinWidth: 0.25,
    veinAlpha: 0.55,
  });
  engrave(c, {
    d: `M0 ${f2(cy - 3.6)}Q0.9 ${f2(cy - 1.3)} 2.4 ${f2(cy)}Q0.9 ${f2(cy + 1.3)} 0 ${f2(cy + 3.6)}Q-0.9 ${f2(cy + 1.3)} -2.4 ${f2(cy)}Q-0.9 ${f2(cy - 1.3)} 0 ${f2(cy - 3.6)}Z`,
    fill: linear(-2, cy - 3, 2, cy + 3, GOLD),
    ink: INK,
    width: 0.4,
  });
});

function CardPiece({ m }: { m: SharedValue<Move> }) {
  const face = usePicture(cardFacePicture);
  const back = usePicture(cardBackPicture);
  const place = usePlace(m, 1.15);
  const turn = useDerivedValue(() => {
    const { steps, big } = m.value;
    return Math.cos(steps * Math.PI + smooth(big) * TAU);
  });
  const body = useDerivedValue(() => {
    const k = turn.value;
    return [
      { rotate: 0.16 * Math.sin(m.value.hop * TAU) },
      { scaleX: Math.abs(k) < 0.03 ? 0.03 * Math.sign(k || 1) : k },
    ];
  });
  const faceUp = useDerivedValue(() => (turn.value >= 0 ? 1 : 0));
  const backUp = useDerivedValue(() => 1 - faceUp.value);
  return (
    <Group transform={place}>
      <Group transform={body}>
        <Group opacity={faceUp}>
          <Picture picture={face} />
        </Group>
        <Group opacity={backUp}>
          <Picture picture={back} />
        </Group>
      </Group>
    </Group>
  );
}

// ── the ivory die, tumbling over as it hops ──────────────────────────

const EDGE = 9.4;

type M3 = number[];
const mul = (a: M3, b: M3): M3 => {
  "worklet";
  const out = new Array<number>(9);
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 3; k++)
      out[r * 3 + k] = a[r * 3] * b[k] + a[r * 3 + 1] * b[3 + k] + a[r * 3 + 2] * b[6 + k];
  return out;
};
const rotX = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};
const rotY = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};
const rotZ = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};
const roundM = (m: M3) => m.map((v) => Math.round(v));

// In the die's frame x is the way it goes, y down into the board and z
// toward us. The camera looks down on it a little and from its front
// corner, so it shows its top and two sides.
const VIEW = mul(rotX(-0.42), rotY(-0.5));
/** Each hop tips it forward (about z), now and then over sideways (x). */
const AXES = [2, 2, 0, 2, 0, 2];
const ORIENT: number[] = (() => {
  const all: M3[] = [];
  let m: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let k = 0; k < 6 * 24; k++) {
    if (k > 0 && k % 6 === 0 && m.join() === "1,0,0,0,1,0,0,0,1") break;
    all.push(m);
    const turn = AXES[k % 6] === 2 ? rotZ(Math.PI / 2) : rotX(Math.PI / 2);
    m = roundM(mul(turn, m));
  }
  return all.flat();
})();
const PERIOD = ORIENT.length / 9;

const FACES: { value: number; n: number[]; u: number[]; v: number[] }[] = [
  { value: 1, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 6, n: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] },
  { value: 2, n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
  { value: 5, n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { value: 3, n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 4, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
];
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const FACE = rrect(1, 1, 0.14);
const FACE_BODY = rrect(1.03, 1.03, 0.03);
const FACE_BEVEL = rrect(0.76, 0.76, 0.1);
const FACE_SHINE = "M-0.34 -0.4H0.2M-0.4 -0.34V0.08";
/** The light, from the top left and in front, in the world. */
const LIGHT = [-0.45, -0.55, 0.7];

interface DiePose {
  m: M3;
  /** The light in the die's frame. */
  l: number[];
}

function useDiePose(m: SharedValue<Move>): SharedValue<DiePose> {
  return useDerivedValue(() => {
    const { a, steps, big } = m.value;
    const k = Math.floor(steps + 1e-6);
    const e = steps - k;
    const j = ((k % 6) + 6) % 6;
    const tip = AXES[j] === 2 ? rotZ((Math.PI / 2) * e) : rotX((Math.PI / 2) * e);
    const o = (((k % PERIOD) + PERIOD) % PERIOD) * 9;
    const rest = ORIENT.slice(o, o + 9);
    // in the round's big jump it spins right round
    const spin = rotY(smooth(big) * TAU);
    const view = mul(VIEW, mul(spin, mul(tip, rest)));
    const r = a + Math.PI / 2;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return {
      m: view,
      l: [c * LIGHT[0] + s * LIGHT[1], -s * LIGHT[0] + c * LIGHT[1], LIGHT[2]],
    };
  });
}

function DieFace({ pose, face }: { pose: SharedValue<DiePose>; face: (typeof FACES)[number] }) {
  const { n, u, v, value } = face;
  const look = useDerivedValue(() => {
    const { m, l } = pose.value;
    const at = (w: number[]) => [
      m[0] * w[0] + m[1] * w[1] + m[2] * w[2],
      m[3] * w[0] + m[4] * w[1] + m[5] * w[2],
      m[6] * w[0] + m[7] * w[1] + m[8] * w[2],
    ];
    const N = at(n);
    const U = at(u);
    const V = at(v);
    const s = EDGE;
    const cx = N[0] * (s / 2);
    const cy = -s * 0.62 + N[1] * (s / 2);
    const lit = N[0] * l[0] + N[1] * l[1] + N[2] * l[2];
    return {
      matrix: [U[0] * s, V[0] * s, 0, cx, U[1] * s, V[1] * s, 0, cy, 0, 0, 1, 0, 0, 0, 0, 1] as unknown as Matrix4,
      shown: Math.min(1, Math.max(0, N[2] * 10)),
      shade: 0.46 * (1 - Math.max(0, lit)) ** 1.2,
    };
  });
  const transform = useDerivedValue(() => [{ matrix: look.value.matrix }]);
  const opacity = useDerivedValue(() => look.value.shown);
  const shade = useDerivedValue(() => look.value.shade);
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={FACE_BODY} color={INK} />
      <Path path={FACE}>
        <LinearGradient start={vec(-0.5, -0.5)} end={vec(0.5, 0.5)} colors={IVORY} />
      </Path>
      <Path path={FACE_BEVEL} style="stroke" strokeWidth={0.04} color={VEIN_IVORY} opacity={0.6} />
      <Path path={FACE_SHINE} style="stroke" strokeWidth={0.07} strokeCap="round" color="#FFFFFF" />
      {PIPS[value].map(([px, py], k) =>
        value === 1 ? (
          <Group key={k}>
            <Circle cx={0} cy={0} r={0.2}>
              <RadialGradient c={vec(-0.06, -0.07)} r={0.27} colors={RUBY} />
            </Circle>
            <Circle cx={-0.06} cy={-0.07} r={0.055} color="#FFFFFFCC" />
          </Group>
        ) : (
          <Circle key={k} cx={px * 0.26} cy={py * 0.26} r={0.11} color="#2A1C0E" />
        ),
      )}
      <Path path={FACE} color="#5A3A14" opacity={shade} />
      <Path path={FACE} style="stroke" strokeWidth={0.085} strokeJoin="round" color={INK} />
    </Group>
  );
}

function DiePiece({ m }: { m: SharedValue<Move> }) {
  const pose = useDiePose(m);
  const place = usePlace(m);
  return (
    <Group transform={place}>
      {FACES.map((face) => (
        <DieFace key={face.value} pose={pose} face={face} />
      ))}
    </Group>
  );
}

// ══ The crown ═════════════════════════════════════════════════════════

/** The middle of the circlet at x. */
const bandMid = (x: number) => -62.3 + (x * x) / 360;
const CROWN_BAND =
  "M-26 -65.12Q0 -68.88 26 -65.12L26.6 -55.72Q0 -59.48 -26.6 -55.72Z";
const CROWN_BODY =
  "M0 -84Q3 -76 7.6 -72.6Q12.5 -77 15 -86.5Q16.5 -76 20.4 -71.4Q26.5 -74.5 30.5 -82.5Q27 -73 25.6 -65.2" +
  "Q0 -68.8 -25.6 -65.2" +
  "Q-27 -73 -30.5 -82.5Q-26.5 -74.5 -20.4 -71.4Q-16.5 -76 -15 -86.5Q-12.5 -77 -7.6 -72.6Q-3 -76 0 -84Z";
const CROWN_VELVET =
  "M-23 -66C-24.5 -79 -13 -85 0 -85C13 -85 24.5 -79 23 -66Z";
const MEDAL = { x: 0, y: -77.2, r: 8.4 };
const MEDAL_FIELD = 6.6;
const FINIAL = { x: 0, y: -87.7, r: 2.1 };
const TIPS: [number, number, number][] = [
  [15, -87.7, 2],
  [-15, -87.7, 2],
  [30.8, -83.7, 1.8],
  [-30.8, -83.7, 1.8],
];
/** All the crown's gold, for the light and the flash. */
const CROWN_METAL = CROWN_BODY + CROWN_BAND + circle(MEDAL.r, MEDAL.x, MEDAL.y);

const crownPicture = once((c) => {
  // its shadow on the board
  const shade = skPath(CROWN_BODY + CROWN_BAND + CROWN_VELVET);
  if (shade) {
    c.save();
    c.translate(1.2, 2.2);
    const paint = brush("#1A0E04", 0.5);
    paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.4, true));
    c.drawPath(shade, paint);
    c.restore();
  }
  // the velvet cap, quilted
  let quilt = "";
  for (const x of [-16, -8, 0, 8, 16]) quilt += `M${P(x, -66)}Q${P(x * 0.95, -78)} ${P(x * 0.35, -84.5)}`;
  engrave(c, {
    d: CROWN_VELVET,
    fill: radial(-8, -80, 30, VELVET),
    ink: "#2A0408",
    width: 0.9,
    vein: quilt,
    veinColor: "#3A0410",
    veinWidth: 0.5,
    veinAlpha: 0.55,
    shine: "M-17 -72Q-15 -80 -7 -83",
    shineWidth: 0.6,
    shineAlpha: 0.4,
  });
  // the points
  engrave(c, {
    d: CROWN_BODY,
    fill: linear(-30, -90, 30, -60, GOLD),
    ink: INK,
    width: 1.1,
    vein:
      "M15 -84.5L14.2 -70M-15 -84.5L-14.2 -70M29.4 -80.5L25.6 -68.6M-29.4 -80.5L-25.6 -68.6" +
      "M7.6 -71.6Q11 -73.6 13.2 -77M-7.6 -71.6Q-11 -73.6 -13.2 -77M20.4 -70.4Q24 -72 26.6 -75.6M-20.4 -70.4Q-24 -72 -26.6 -75.6",
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
    shine: "M-29 -80Q-27.4 -74.4 -26.4 -68.4M-14.6 -83.4L-14 -74",
    shineWidth: 0.6,
  });
  for (const [x, y, r] of TIPS) pearl(c, x, y, r);
  // the circlet, grooved, beaded and set with jewels
  engrave(c, {
    d: CROWN_BAND,
    fill: linear(0, -68, 0, -56, ["#FFF2B8", "#F0CC72", "#E2B04A", "#9A6B1E"]),
    ink: INK,
    width: 1.1,
    vein: "M-26 -63.9Q0 -67.7 26 -63.9M-26.4 -57.2Q0 -60.9 26.4 -57.2",
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
    shine: "M-23 -64.6Q-12 -66.8 -4 -67.2",
    shineWidth: 0.6,
  });
  for (const x of [-24.2, -15.8, -5.9, 5.9, 15.8, 24.2]) pearl(c, x, bandMid(x), 1.15);
  for (const s of [1, -1]) {
    gem(c, s * 11, bandMid(11), 4.6, 4.2, SAPPHIRE, 0.8);
    gem(c, s * 20.4, bandMid(20.4), 3.8, 3.6, EMERALD, 0.7);
  }
  gem(c, 0, bandMid(0), 7.2, 5.4, RUBY, 1);
  // the medallion: a beaded gold rim, a sapphire field, the gold meeple
  let beads = "";
  for (let k = 0; k < 24; k++) {
    const p0 = polar((k / 24) * TAU, MEDAL.r - 0.5);
    const p1 = polar((k / 24) * TAU, MEDAL_FIELD + 0.5);
    beads += `M${P(MEDAL.x + p0.x, MEDAL.y + p0.y)}L${P(MEDAL.x + p1.x, MEDAL.y + p1.y)}`;
  }
  engrave(c, {
    d: circle(MEDAL.r, MEDAL.x, MEDAL.y),
    fill: linear(-8, -86, 8, -69, GOLD),
    ink: INK,
    width: 1.1,
    vein: beads,
    veinColor: VEIN_GOLD,
    veinWidth: 0.45,
    shine: `M${P(-6.6, -79.4)}Q${P(-6, -83.2)} ${P(-2.6, -84.6)}`,
    shineWidth: 0.6,
  });
  let azure = "";
  for (let k = 0; k < 9; k++) azure += `M-7 ${f2(MEDAL.y - 6 + k * 1.5)}H7`;
  engrave(c, {
    d: circle(MEDAL_FIELD, MEDAL.x, MEDAL.y),
    fill: radial(-2, MEDAL.y - 2.4, 9, ["#9AC4FF", "#2E6AD8", "#0E2A6A"]),
    ink: INK,
    width: 0.7,
    vein: azure,
    veinColor: "#0E2A6A",
    veinWidth: 0.3,
    veinAlpha: 0.6,
  });
  c.save();
  c.translate(MEDAL.x, MEDAL.y + 0.15);
  c.scale(0.54, 0.54);
  c.translate(-12, -11.75);
  engrave(c, {
    d: MEEPLE_PATH,
    fill: linear(4, 2, 20, 21, GOLD),
    ink: INK,
    width: 1.2,
    shine: "M9.6 4.6Q10.6 3.3 12.2 3.3M5.4 11.2Q7.4 9.8 9.4 9.4",
    shineWidth: 0.9,
  });
  c.restore();
  // the finial
  pearl(c, FINIAL.x, FINIAL.y, FINIAL.r);
});

/** Radiance behind the crown. */
const RAY_AT = { x: 0, y: -75 };
const raysPicture = once((c) => {
  const clip = skPath(circle(91));
  if (clip) c.clipPath(clip, ClipOp.Intersect, true);
  let d = "";
  for (let k = 0; k <= 14; k++) {
    const a = (-168 + k * 12) * DEG;
    const len = k % 2 ? 19 : 25;
    const b0 = polar(a - 2.6 * DEG, 8);
    const b1 = polar(a + 2.6 * DEG, 8);
    const tip = polar(a, len);
    d += poly([
      [RAY_AT.x + b0.x, RAY_AT.y + b0.y],
      [RAY_AT.x + tip.x, RAY_AT.y + tip.y],
      [RAY_AT.x + b1.x, RAY_AT.y + b1.y],
    ]);
  }
  const path = skPath(d);
  if (path)
    c.drawPath(
      path,
      brush(radial(RAY_AT.x, RAY_AT.y, 25, ["#FFF6D0", "#F6CF6A", "#E2B04A00"], [0.3, 0.65, 1])),
    );
});

function CrownRays({ t }: { t: Clock }) {
  const rays = usePicture(raysPicture);
  const opacity = useDerivedValue(
    () => 0.38 + 0.12 * Math.sin(t.value * 1.4) + 0.5 * flashAt(t.value),
  );
  const transform = useDerivedValue(() => [
    { translateX: RAY_AT.x },
    { translateY: RAY_AT.y },
    { rotate: 0.05 * Math.sin(t.value * 0.5) },
    { scale: 1 + 0.12 * flashAt(t.value) },
    { translateX: -RAY_AT.x },
    { translateY: -RAY_AT.y },
  ]);
  return (
    <Group transform={transform} opacity={opacity}>
      <Picture picture={rays} />
    </Group>
  );
}

/** The crown's flash: its gold goes white-hot, a star bursts from the
 *  medallion. */
const BURST = (() => {
  // eight points: four long on the axes, four short between
  const pts: Pt[] = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU - Math.PI / 2;
    const r = k % 2 ? 1.4 : k % 4 === 0 ? 15 : 7.5;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return poly(pts);
})();

function CrownFlash({ t }: { t: Clock }) {
  const flash = useDerivedValue(() => flashAt(t.value));
  const hot = useDerivedValue(() => flash.value * 0.55);
  const burst = useDerivedValue(() => {
    const f = flash.value;
    return [
      { translateX: MEDAL.x },
      { translateY: MEDAL.y },
      { rotate: (1 - f) * 0.6 },
      { scale: 0.2 + f },
    ];
  });
  return (
    <Group>
      <Path path={CROWN_METAL} color="#FFF8E0" opacity={hot} />
      <Group transform={burst} opacity={flash}>
        <Path path={BURST} color="#FFFFFF">
          <BlurMask blur={0.6} style="solid" />
        </Path>
      </Group>
    </Group>
  );
}

// ══ Confetti ══════════════════════════════════════════════════════════

const CONFETTI = 40;
const CONFETTI_COLOURS = ["#F2C14E", "#D0223C", "#2E6AD8", "#1E9A54", "#FFF2C8"];
const CONFETTI_LIFE = 1.55;
const GRAVITY = 7;
/** Each bit: where it starts, which way it flies and how far (kept
 *  inside the canvas, r < 90), its colour and shape. */
const BITS = Array.from({ length: CONFETTI }, (_, i) => {
  const a = (i / CONFETTI) * TAU + (rnd(i + 11) - 0.5) * 0.14;
  const r0 = 63 + rnd(i + 23) * 6;
  const dir = a + (rnd(i + 37) - 0.5) * 0.7;
  let dist = 12 + rnd(i + 51) * 16;
  const o = polar(a, r0);
  const end = () => {
    const d = polar(dir, dist);
    return Math.hypot(o.x + d.x, o.y + d.y + GRAVITY);
  };
  while (end() > 89 && dist > 2) dist -= 0.5;
  return {
    i,
    x: o.x,
    y: o.y,
    dx: Math.cos(dir) * dist,
    dy: Math.sin(dir) * dist,
    start: 0.03 + rnd(i + 67) * 0.16,
    spin: (rnd(i + 79) - 0.5) * 14,
    flutter: 8 + rnd(i + 91) * 10,
    turn: rnd(i + 103) * TAU,
    colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    round: i % 3 === 2,
    front: i % 2 === 0,
  };
});

function ConfettiBit({ t, bit }: { t: Clock; bit: (typeof BITS)[number] }) {
  const q = useDerivedValue(() => {
    const c = (((t.value + PHASE) % CYCLE) + CYCLE) % CYCLE;
    return (c - bit.start) / CONFETTI_LIFE;
  });
  const transform = useDerivedValue(() => {
    const p = Math.min(1, Math.max(0, q.value));
    const go = 1 - (1 - p) ** 2.4;
    return [
      { translateX: bit.x + bit.dx * go },
      { translateY: bit.y + bit.dy * go + GRAVITY * p * p },
      { rotate: bit.turn + p * bit.spin },
      { scaleY: 0.25 + 0.75 * Math.abs(Math.cos(p * bit.flutter + bit.turn)) },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = q.value;
    if (p <= 0 || p >= 1) return 0;
    return p < 0.06 ? p / 0.06 : (1 - p) ** 0.7;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      {bit.round ? (
        <Circle cx={0} cy={0} r={1.15} color={bit.colour} />
      ) : (
        <Rect x={-1.8} y={-1} width={3.6} height={2} color={bit.colour} />
      )}
    </Group>
  );
}

function Confetti({ t, front }: { t: Clock; front: boolean }) {
  return (
    <Group>
      {BITS.filter((b) => b.front === front).map((bit) => (
        <ConfettiBit key={bit.i} t={t} bit={bit} />
      ))}
    </Group>
  );
}

// ══ The layers ════════════════════════════════════════════════════════

function GrandBack({ t }: { t: Clock }) {
  return (
    <Group>
      <BoardBack t={t} />
      <CrownRays t={t} />
      <Confetti t={t} front={false} />
    </Group>
  );
}

function GrandFront({ t }: { t: Clock }) {
  const board = usePicture(boardPicture);
  const crown = usePicture(crownPicture);
  const m0 = useMove(t, 0);
  const m1 = useMove(t, 1);
  const m2 = useMove(t, 2);
  const m3 = useMove(t, 3);
  const m4 = useMove(t, 4);
  const m5 = useMove(t, 5);
  const start = polar(START * SQ, SQ_MID);
  // the start ruby's slow double beat
  const beat = useDerivedValue(() => {
    const p = (t.value % 2.4) / 2.4;
    const a = Math.exp(-(((p - 0.1) / 0.05) ** 2));
    const b = Math.exp(-(((p - 0.26) / 0.06) ** 2)) * 0.7;
    return 0.12 + 0.8 * Math.max(a, b);
  });
  const shine = polar(-138 * DEG, 64.4);
  const enamel = polar(13 * SQ, SQ_MID);
  return (
    <Group>
      <Picture picture={board} />
      <Sweep t={t} d={TRACK} evenOdd every={4.6} phase={0.6} />
      <Circle cx={start.x} cy={start.y} r={4.6} color="#FF3A4A" opacity={beat} blendMode="screen">
        <BlurMask blur={2.4} style="normal" />
      </Circle>
      <PieceShadow m={m0} w={15} />
      <PieceShadow m={m1} w={11} />
      <PieceShadow m={m2} w={13} />
      <PieceShadow m={m3} w={12} />
      <PieceShadow m={m4} w={11} />
      <PieceShadow m={m5} w={14} />
      <StackPiece m={m5} />
      <KingPiece m={m4} />
      <CardPiece m={m3} />
      <DiePiece m={m2} />
      <CoinPiece t={t} m={m1} i={1} />
      <MascotPiece t={t} m={m0} i={0} />
      <Picture picture={crown} />
      <Sweep t={t} d={CROWN_METAL} every={4.6} />
      <CrownFlash t={t} />
      <Confetti t={t} front />
      <Glint t={t} x={start.x - 0.6} y={start.y - 0.8} size={4.5} phase={0.4} />
      <Glint t={t} x={-1} y={bandMid(0) - 1} size={5} phase={1.5} speed={1.1} />
      <Glint t={t} x={FINIAL.x} y={FINIAL.y} size={4.5} phase={2.7} speed={1.3} />
      <Glint t={t} x={shine.x} y={shine.y} size={4} phase={3.6} speed={1} />
      <Glint t={t} x={enamel.x} y={enamel.y} size={3.5} phase={4.8} speed={0.9} />
    </Group>
  );
}

export const GRANDBOARD_ART: Record<string, ArtBorderDrawing> = {
  "grand-board": { back: GrandBack, front: GrandFront },
};

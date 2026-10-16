// Dragon Coil, King's Crown and Queen's Tiara, enhanced in the house's
// engraved style.
//   Dragon Coil — no head: a serpent body of gold-edged crimson scales
//     winds round an engraved gold ring at the picture's edge, passing
//     over it and under it, a row of gold belly plates along its inner
//     side and spine ridges along its back. Its neck dives away behind
//     the picture; its tail ends in a curl of flame. Over the top, in the
//     gap, it chases a flaming pearl that beats with light. The coil
//     sways gently; a gleam runs down its scales; embers rise.
//   King's Crown — centred on top of the picture: a velvet cap under two
//     pearled arches meeting at an orb and cross, a circlet set with
//     cabochons in gold collets, crosses pattée and fleurs-de-lis along
//     its rim, an ermine band at its foot. Round the picture, a gold ring
//     strung with pearls and set with jewels. The ruby beats.
//   Queen's Tiara — small and tilted at the top right, sitting on the
//     picture: silver filigree frames and scrolls on a pavé band, a pink
//     pear-cut stone in the middle, diamond teardrops either side. Round
//     the picture a fine circlet of pearls with a pink drop at its foot.

import {
  BlurMask,
  Circle,
  ClipOp,
  DashPathEffect,
  FillType,
  Group,
  PaintStyle,
  Path,
  Picture,
  RadialGradient,
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
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const DEG = Math.PI / 180;
const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_SILVER = "#1E242C";
const VEIN_SILVER = "#4A5462";
const RUBY = ["#FF9AA6", "#D0102E", "#5A0410"];
const SAPPHIRE = ["#D8EEFF", "#2E7AE0", "#0A2A6A"];
const EMERALD = ["#C8FFD8", "#1E9A54", "#06401E"];
const DIAMOND = ["#FFFFFF", "#DCEBFA", "#8A9AB8"];
const PINK = ["#FFE0EE", "#F0559E", "#7A1048"];

const f2 = (n: number) => n.toFixed(2);
const P = (x: number, y: number) => `${f2(x)} ${f2(y)}`;
const circle = (r: number, x = 0, y = 0) =>
  `M${P(x + r, y)}A${r} ${r} 0 1 1 ${P(x - r, y)}A${r} ${r} 0 1 1 ${P(x + r, y)}Z`;
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${P(p.x, p.y)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${P(q.x, q.y)}`;
};
const poly = (pts: Pt[], close = true) =>
  `M${pts.map(([x, y]) => P(x, y)).join("L")}${close ? "Z" : ""}`;

/** A path of M/L/C/Q/Z commands, mirrored left to right. */
function mirrorD(d: string) {
  return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_, cmd: string, args: string) => {
    const n = args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
    return cmd + n.map((v, i) => (i % 2 ? v : f2(-Number(v)))).join(" ");
  });
}

// ── drawing straight onto a canvas, for the recorded pictures ─────────

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
        pen(p.shineWidth ?? 0.8, "#FFFFFF", p.shineAlpha ?? 0.75),
      );
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

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

function drawPearl(c: SkCanvas, x: number, y: number, r: number) {
  const o = skPath(circle(r, x, y));
  if (!o) return;
  c.drawPath(
    o,
    brush(
      radial(x - r * 0.35, y - r * 0.4, r * 1.7, [
        "#FFFFFF",
        "#F6F0F2",
        "#CFC4D2",
        "#8E8498",
      ]),
    ),
  );
  c.drawPath(o, pen(Math.min(0.7, r * 0.24), "#4A3E4E", 0.8));
  const shine = skPath(circle(r * 0.28, x - r * 0.36, y - r * 0.38));
  if (shine) c.drawPath(shine, brush("#FFFFFF", 0.95));
}

const cubic = (a: number, b: number, c: number, d: number, u: number) =>
  (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;

/** Points round a gem's girdle: an oval, or a pear (point up). */
function girdle(cut: "oval" | "pear", x: number, y: number, w: number, h: number) {
  const n = 32;
  if (cut === "oval")
    return Array.from({ length: n }, (_, k): Pt => {
      const a = (k / n) * TAU - Math.PI / 2;
      return [x + (Math.cos(a) * w) / 2, y + (Math.sin(a) * h) / 2];
    });
  // the pear: two cubics from the point, round the bottom and back
  const top: Pt = [x, y - h / 2];
  const side = (s: number) =>
    Array.from({ length: n / 2 }, (_, k): Pt => {
      const u = k / (n / 2);
      return [
        cubic(top[0], x + (s * w) / 2, x + (s * w) / 2, x, u),
        cubic(top[1], y - h * 0.1, y + h / 2, y + h / 2, u),
      ];
    });
  const right = side(1);
  const left = side(-1).reverse();
  return [...right, [x, y + h / 2] as Pt, ...left.slice(0, -1)];
}

/** A cut stone in its collet: the setting, the stone, its table and
 *  facets, a highlight. */
function drawGem(
  c: SkCanvas,
  {
    x,
    y,
    w,
    h,
    colors,
    cut = "oval",
    metal = GOLD,
    ink = INK_GOLD,
    collet = 1.3,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    colors: string[];
    cut?: "oval" | "pear";
    metal?: string[];
    ink?: string;
    collet?: number;
  },
) {
  if (collet > 0) {
    const set = girdle(cut, x, y, w + collet * 2, h + collet * 2);
    engrave(c, {
      d: poly(set),
      fill: linear(x - w, y - h, x + w, y + h, metal),
      ink,
      width: 0.6,
    });
  }
  const rim = girdle(cut, x, y, w, h);
  const cy = y + (cut === "pear" ? h * 0.1 : 0);
  const table = girdle(cut, x, cy, w * 0.5, h * 0.5);
  const stone = skPath(poly(rim));
  if (!stone) return;
  c.drawPath(
    stone,
    brush(radial(x - w * 0.2, y - h * 0.25, Math.max(w, h) * 0.9, colors)),
  );
  c.save();
  c.clipPath(stone, ClipOp.Intersect, true);
  let facets = "";
  for (let k = 0; k < rim.length; k += 4)
    facets += `M${P(...table[k])}L${P(...rim[k])}`;
  const f = skPath(facets + poly(table));
  if (f) c.drawPath(f, pen(Math.max(0.25, w * 0.04), colors[2], 0.55));
  const t = skPath(poly(table));
  if (t) c.drawPath(t, brush(colors[0], 0.35));
  const hi = skPath(
    `M${P(x - w * 0.3, y - h * 0.12)}Q${P(x - w * 0.28, y - h * 0.32)} ${P(x - w * 0.08, y - h * 0.36)}`,
  );
  if (hi) c.drawPath(hi, pen(Math.max(0.4, w * 0.1), "#FFFFFF", 0.85));
  c.restore();
  c.drawPath(stone, pen(Math.max(0.35, w * 0.06), colors[2], 0.9));
}

// ══ Dragon Coil ══════════════════════════════════════════════════════

/** The ring the dragon winds round: gold, at the picture's edge. */
const RING_IN = 50.2;
const RING_OUT = 58;
const COIL_RING = circle(RING_OUT) + circle(RING_IN);

/** The body runs clockwise from its neck (behind the picture, top
 *  right) round to its tail (top left), winding over and under the ring
 *  as it goes: in front while it moves from outside the ring to inside,
 *  behind on the way back out. */
const D_FROM = -60 * DEG;
const D_SPAN = 298 * DEG;
const TURNS = 3.62;
const STEPS = 760;

interface BodyPt {
  x: number;
  y: number;
  /** Unit tangent, neck to tail. */
  tx: number;
  ty: number;
  /** Half its width. */
  hw: number;
  /** Arc length from the neck. */
  l: number;
  front: boolean;
}

function buildBody(): BodyPt[] {
  const raw = Array.from({ length: STEPS + 1 }, (_, i) => {
    const s = i / STEPS;
    const phi = Math.PI + TURNS * TAU * s;
    const cp = Math.cos(phi);
    // out to 73, in to 56, round the ring between
    let r = 63 + 8.5 * cp + 1.5 * cp * cp;
    // the neck dives behind the picture
    r -= 20 * Math.max(0, 1 - s / 0.045) ** 2;
    const a = D_FROM + D_SPAN * s;
    return {
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      hw: 1.3 + 7.4 * (1 - s ** 1.7),
      front: Math.sin(phi) > 1e-6,
    };
  });
  let l = 0;
  return raw.map((p, i) => {
    const a = raw[Math.max(i - 1, 0)];
    const b = raw[Math.min(i + 1, STEPS)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    if (i > 0) l += Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y);
    return { ...p, tx: (b.x - a.x) / len, ty: (b.y - a.y) / len, l };
  });
}

/** The point `v` across the body (positive: toward the picture) at `i`. */
const across = (p: BodyPt, v: number): Pt => [p.x - p.ty * v, p.y + p.tx * v];

/** The body cut into runs, each wholly in front of the ring or behind. */
function bodyRuns(body: BodyPt[]) {
  const runs: { from: number; to: number; front: boolean }[] = [];
  let from = 0;
  for (let i = 1; i <= STEPS; i++) {
    if (i === STEPS || body[i].front !== body[from].front) {
      runs.push({ from, to: i, front: body[from].front });
      from = i;
    }
  }
  return runs;
}

const runOutline = (body: BodyPt[], from: number, to: number) => {
  const pts = body.slice(from, to + 1);
  return poly([
    ...pts.map((p) => across(p, -p.hw)),
    ...pts.reverse().map((p) => across(p, p.hw)),
  ]);
};

/** The body at arc length `l`. */
function bodyAt(body: BodyPt[], l: number): BodyPt {
  let lo = 0;
  let hi = STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (body[mid].l < l) lo = mid;
    else hi = mid;
  }
  const a = body[lo];
  const b = body[hi];
  const u = Math.min(1, Math.max(0, (l - a.l) / (b.l - a.l || 1)));
  const mix = (p: number, q: number) => p + (q - p) * u;
  return {
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    tx: mix(a.tx, b.tx),
    ty: mix(a.ty, b.ty),
    hw: mix(a.hw, b.hw),
    l,
    front: a.front,
  };
}

/** The scales, neck to tail: rows across the body, staggered. */
function scaleRows(body: BodyPt[]) {
  const total = body[STEPS].l;
  const rows: { at: BodyPt; step: number; vs: number[] }[] = [];
  let l = 0;
  let k = 0;
  while (l < total - 2) {
    const at = bodyAt(body, l);
    const step = 0.5 * at.hw + 1.25;
    rows.push({
      at,
      step,
      vs: k % 2 ? [-0.34, 0.34] : [-0.68, 0, 0.68],
    });
    l += step;
    k++;
  }
  return rows;
}

const SCALE_FILL = ["#3A0402", "#7A0E0A", "#C8261A", "#F2603A"];

function drawScale(c: SkCanvas, p: BodyPt, v: number, step: number) {
  const a = 0.36 * p.hw + 0.35;
  const len = step * 1.95;
  const b = -0.3 * len;
  const m = 0.28 * len;
  const tip = 0.72 * len;
  const [x, y] = across(p, v * p.hw);
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(p.ty, p.tx) / DEG, 0, 0);
  const d = `M${P(b, -a)}L${P(m, -a)}C${P(tip * 0.92, -a)} ${P(tip, -a * 0.5)} ${P(tip, 0)}C${P(tip, a * 0.5)} ${P(tip * 0.92, a)} ${P(m, a)}L${P(b, a)}Z`;
  const edge = `M${P(m, -a)}C${P(tip * 0.92, -a)} ${P(tip, -a * 0.5)} ${P(tip, 0)}C${P(tip, a * 0.5)} ${P(tip * 0.92, a)} ${P(m, a)}`;
  const body = skPath(d);
  const rim = skPath(edge);
  if (body) c.drawPath(body, brush(linear(b, 0, tip, 0, SCALE_FILL)));
  if (rim) {
    c.drawPath(rim, pen(Math.max(0.5, a * 0.32), "#2A0302", 0.9));
    c.drawPath(rim, pen(Math.max(0.3, a * 0.15), "#F0CC72", 0.95));
  }
  c.restore();
}

/** A spine ridge on the body's back at arc length `l`. */
function spine(body: BodyPt[], l: number) {
  const p = bodyAt(body, l - 1.6);
  const q = bodyAt(body, l + 2.4);
  const t = bodyAt(body, l + 3.6);
  const h = 2.2 + t.hw * 0.42;
  return poly([
    across(p, -p.hw * 0.7),
    across(t, -t.hw - h),
    across(q, -q.hw * 0.7),
  ]);
}

/** A tongue of flame pointing up from (0, 0): wide at the root, waving
 *  once, its tip flicking back the other way. */
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
  return {
    outline: poly([...side(1), ...side(-1).reverse()]),
    vein: `M${mid
      .slice(2, 15)
      .map((p) => P(...p))
      .join("L")}`,
    h,
  };
}

/** A fan of flame tongues, the longest in the middle, pointing along
 *  `dir` (radians from straight up). */
const flameFan = (spec: { rot: number; h: number; b: number; bend: number }[]) =>
  spec.map((f) => ({ rot: f.rot, part: tongue(f.h, f.b, f.bend) }));

/** The tail's end: a tuft of flame. */
const TAIL_FLAMES = flameFan([
  { rot: -0.75, h: 11, b: 5, bend: -1 },
  { rot: 0.75, h: 11, b: 5, bend: 1 },
  { rot: 0, h: 17, b: 6.5, bend: 1 },
]);

function drawFlames(
  c: SkCanvas,
  flames: ReturnType<typeof flameFan>,
  root = 0,
) {
  for (const f of flames) {
    c.save();
    c.rotate(f.rot / DEG, 0, 0);
    c.translate(0, -root);
    engrave(c, {
      d: f.part.outline,
      fill: linear(0, 0, 0, -f.part.h, [
        "#8E130C",
        "#E2541A",
        "#FFB23A",
        "#FFF2B8",
      ]),
      ink: "#4A0C04",
      width: 0.8,
      vein: f.part.vein,
      veinColor: "#FFF2B8",
      veinWidth: 0.5,
      veinAlpha: 0.7,
    });
    c.restore();
  }
}

function drawRun(
  c: SkCanvas,
  body: BodyPt[],
  rows: ReturnType<typeof scaleRows>,
  run: { from: number; to: number; front: boolean },
  isTail: boolean,
) {
  const pts = body.slice(run.from, run.to + 1);
  const l0 = body[run.from].l;
  const l1 = body[run.to].l;
  // spine ridges, their roots under the body
  let spines = "";
  for (let l = Math.ceil((l0 + 2) / 6.5) * 6.5; l < Math.min(l1, l1 - 1); l += 6.5)
    if (l > 26 && l < body[STEPS].l - 14) spines += spine(body, l);
  if (spines)
    engrave(c, {
      d: spines,
      fill: radial(0, 0, 86, ["#F0CC72", "#B3160C", "#5A0606"].reverse()),
      ink: "#2A0302",
      width: 0.8,
    });
  const outline = skPath(runOutline(body, run.from, run.to));
  if (!outline) return;
  if (run.front) {
    // a shadow on the ring beneath
    c.save();
    c.translate(1.2, 1.8);
    c.drawPath(outline, brush("#1A0201", 0.4));
    c.restore();
  }
  c.drawPath(outline, brush("#3A0402"));
  c.save();
  c.clipPath(outline, ClipOp.Intersect, true);
  // scales, tail first, so each one lies over the next toward the tail
  for (let k = rows.length - 1; k >= 0; k--) {
    const row = rows[k];
    if (row.at.l < l0 - 10 || row.at.l > l1 + 4) continue;
    for (const v of row.vs) drawScale(c, row.at, v, row.step);
  }
  // shade along the back, the belly plates along the inner side
  const back = poly([
    ...pts.map((p) => across(p, -p.hw * 1.05)),
    ...[...pts].reverse().map((p) => across(p, -p.hw * 0.45)),
  ]);
  const shade = skPath(back);
  if (shade) c.drawPath(shade, brush("#1A0201", 0.3));
  let plates = "";
  let grooves = "";
  const pl0 = Math.floor(l0 / 2.6) * 2.6;
  for (let l = pl0; l < l1 + 2.6; l += 2.6) {
    const p = bodyAt(body, l);
    const q = bodyAt(body, l + 2.6);
    plates += poly([
      across(p, p.hw * 0.5),
      across(q, q.hw * 0.5),
      across(q, q.hw * 1.1),
      across(p, p.hw * 1.1),
    ]);
    const g0 = across(q, q.hw * 0.5);
    const g1 = across(q, q.hw * 1.1);
    grooves += `M${P(...g0)}L${P(...g1)}`;
  }
  engrave(c, {
    d: plates,
    fill: radial(0, 0, 76, ["#FFF2B8", "#F0CC72", "#E2B04A", "#9A6B1E"]),
    ink: "#3A2408",
    width: 0,
    vein: grooves,
    veinColor: "#5A3A08",
    veinWidth: 0.55,
    veinAlpha: 0.9,
  });
  const plateEdge = skPath(
    `M${pts.map((p) => P(...across(p, p.hw * 0.5))).join("L")}`,
  );
  if (plateEdge) c.drawPath(plateEdge, pen(0.7, "#3A0402", 0.9));
  // one shine down its back
  const shine = skPath(
    `M${pts.map((p) => P(...across(p, -p.hw * 0.2))).join("L")}`,
  );
  if (shine) c.drawPath(shine, pen(0.6, "#FFE6C8", 0.35));
  c.restore();
  // ink along both sides
  const side = (v: number) =>
    skPath(`M${pts.map((p) => P(...across(p, v * p.hw))).join("L")}`);
  const outer = side(-1);
  const inner = side(1);
  if (outer) c.drawPath(outer, pen(1.1, "#2A0302"));
  if (inner) c.drawPath(inner, pen(1.1, "#2A0302"));
  // where it ducks under the ring, a shadowed edge
  if (run.front)
    for (const i of [run.from, run.to]) {
      const p = body[i];
      if (Math.hypot(p.x, p.y) > 62) continue;
      const cut = skPath(`M${P(...across(p, -p.hw))}L${P(...across(p, p.hw))}`);
      if (cut) c.drawPath(cut, pen(1.3, "#1A0201", 0.9));
    }
  if (isTail) {
    const end = body[STEPS];
    c.save();
    c.translate(end.x, end.y);
    // the tuft points on along the body
    c.rotate(Math.atan2(end.ty, end.tx) / DEG + 90, 0, 0);
    c.translate(0, 1.5);
    drawFlames(c, TAIL_FLAMES);
    c.restore();
  }
}

/** Twists cut slantwise round the ring, like a rope. */
const RING_TWISTS = Array.from({ length: 72 }, (_, k) => {
  const a = (k * 360) / 72;
  const p = polar(a * DEG, RING_IN + 2.2);
  const q = polar((a + 3) * DEG, RING_OUT - 2.2);
  return `M${P(p.x, p.y)}L${P(q.x, q.y)}`;
}).join("");

function recordCoilRing() {
  return record((c) => {
    engrave(c, {
      d: COIL_RING,
      evenOdd: true,
      fill: linear(-60, -60, 60, 60, GOLD),
      ink: INK_GOLD,
      width: 1.1,
      vein: RING_TWISTS + circle(RING_IN + 1.3) + circle(RING_OUT - 1.3),
      veinColor: VEIN_GOLD,
      veinWidth: 0.5,
      veinAlpha: 0.7,
      shine: arc(RING_OUT - 0.8, -165, -110),
    });
  });
}

let BODY: BodyPt[] | null = null;
let RUNS: ReturnType<typeof bodyRuns> | null = null;
const dragonBody = () => {
  BODY ??= buildBody();
  RUNS ??= bodyRuns(BODY);
  return { body: BODY, runs: RUNS };
};

function recordCoil(front: boolean) {
  return record((c) => {
    const { body, runs } = dragonBody();
    const rows = scaleRows(body);
    runs.forEach((run, k) => {
      if (run.front === front) drawRun(c, body, rows, run, k === runs.length - 1);
    });
  });
}

const coilRingPicture = once(recordCoilRing);
const coilBackPicture = once(() => recordCoil(false));
const coilFrontPicture = once(() => recordCoil(true));

/** The outline of every run on one side, and their centre lines. */
function coilPaths(front: boolean) {
  const { body, runs } = dragonBody();
  const mine = runs.filter((r) => r.front === front);
  return {
    clip: mine.map((r) => runOutline(body, r.from, r.to)).join(""),
    spine: mine
      .map(
        (r) =>
          `M${body
            .slice(r.from, r.to + 1)
            .map((p) => P(...across(p, -p.hw * 0.25)))
            .join("L")}`,
      )
      .join(""),
  };
}

/** The coil sways a little round the ring, and breathes. */
function useCoilSway(t: Clock) {
  return useDerivedValue(() => [
    { rotate: Math.sin(t.value * 0.8) * 0.03 },
    { scale: 1 + Math.sin(t.value * 1.6) * 0.006 },
  ]);
}

/** A gleam running down the scales, neck to tail. */
function Gleam({ t, front }: { t: Clock; front: boolean }) {
  const paths = useMemo(() => {
    const { clip, spine } = coilPaths(front);
    return { clip: skPath(clip), spine };
  }, [front]);
  const phase = useDerivedValue(() => -t.value * 34);
  if (!paths.clip) return null;
  return (
    <Group clip={paths.clip}>
      <Path
        path={paths.spine}
        style="stroke"
        strokeWidth={6}
        strokeCap="round"
        color="#FFD49A"
        opacity={0.45}
        blendMode="screen"
      >
        <DashPathEffect intervals={[7, 90]} phase={phase} />
      </Path>
    </Group>
  );
}

const PEARL_AT = { x: 0, y: -68.5 };
/** Flames rising off the pearl, fanned out round its top. */
const PEARL_FLAMES = flameFan([
  { rot: -1.55, h: 9, b: 5.5, bend: -1 },
  { rot: 1.55, h: 9, b: 5.5, bend: 1 },
  { rot: -0.95, h: 13.5, b: 6.5, bend: -1 },
  { rot: 0.95, h: 13.5, b: 6.5, bend: 1 },
  { rot: -0.34, h: 19, b: 7.5, bend: 1 },
  { rot: 0.36, h: 16, b: 7, bend: -1 },
]);

function recordPearlFlames() {
  return record((c) => {
    drawFlames(c, PEARL_FLAMES, 3);
  });
}
const pearlFlamesPicture = once(recordPearlFlames);

/** The flaming pearl the dragon chases, over the top. */
function FlamingPearl({ t }: { t: Clock }) {
  const flames = useMemo(() => pearlFlamesPicture(), []);
  // the flames sway and flicker
  const spin = useDerivedValue(() => [
    { translateX: PEARL_AT.x },
    { translateY: PEARL_AT.y },
    { rotate: Math.sin(t.value * 1.7) * 0.08 },
    { scaleY: 1 + 0.08 * Math.sin(t.value * 5.3) * Math.sin(t.value * 2.1) },
  ]);
  const glow = useDerivedValue(() => {
    const p = (t.value % 1.6) / 1.6;
    return 0.35 + 0.5 * Math.max(0, Math.sin(p * TAU)) ** 2;
  });
  const { x, y } = PEARL_AT;
  return (
    <Group>
      <Circle cx={x} cy={y} r={11} color="#FF7A2A" opacity={glow}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Group transform={spin}>
        <Picture picture={flames} />
      </Group>
      <Circle cx={x} cy={y} r={6.4} color="#4A1A10" />
      <Circle cx={x} cy={y} r={5.7}>
        <RadialGradientPearl x={x} y={y} r={5.7} />
      </Circle>
      <Circle cx={x - 2} cy={y - 2.1} r={1.5} color="#FFFFFF" />
      <Glint t={t} x={x - 1.6} y={y - 1.8} size={5} phase={0.4} speed={1} />
    </Group>
  );
}

function DragonBack({ t }: { t: Clock }) {
  const coil = useMemo(() => coilBackPicture(), []);
  const sway = useCoilSway(t);
  const breathe = useDerivedValue(() => 0.42 + 0.12 * Math.sin(t.value * 1.6));
  return (
    <Group>
      <Halo r={94} color="#FF3B1F" opacity={breathe} />
      <Sparks
        t={t}
        count={8}
        from={-Math.PI}
        to={0}
        r={72}
        rise={20}
        size={1.3}
        seed={77}
      />
      <Group transform={sway}>
        <Picture picture={coil} />
        <Gleam t={t} front={false} />
      </Group>
    </Group>
  );
}

function DragonFront({ t }: { t: Clock }) {
  const ring = useMemo(() => coilRingPicture(), []);
  const coil = useMemo(() => coilFrontPicture(), []);
  const sway = useCoilSway(t);
  return (
    <Group>
      <Picture picture={ring} />
      <Sweep t={t} d={COIL_RING} evenOdd every={5} phase={1.1} />
      <Group transform={sway}>
        <Picture picture={coil} />
        <Gleam t={t} front />
      </Group>
      <FlamingPearl t={t} />
      <Sparks
        t={t}
        count={6}
        from={-Math.PI * 0.62}
        to={-Math.PI * 0.38}
        r={72}
        rise={18}
        size={1.2}
        seed={78}
      />
      <Glint t={t} x={-48} y={30} size={3.5} phase={2.2} speed={0.9} />
      <Glint t={t} x={53} y={-6} size={3} phase={4.1} speed={1.1} />
    </Group>
  );
}

function RadialGradientPearl({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <RadialGradient
      c={vec(x - r * 0.35, y - r * 0.4)}
      r={r * 1.7}
      colors={["#FFFFFF", "#FFF0D8", "#F2B88A", "#B86A3A"]}
    />
  );
}

const DragonCoil: ArtBorderDrawing = { back: DragonBack, front: DragonFront };

// ══ King's Crown ═════════════════════════════════════════════════════

/** The circlet's top edge, middle and bottom edge at x. */
const bandTop = (x: number) => -53 + (x * x) / 423;
const bandMid = (x: number) => -47 + (x * x) / 423;
const bandBot = (x: number) => -41 + (x * x) / 423;
const KING_BAND = "M-46 -48Q0 -58 46 -48L46 -36Q0 -46 -46 -36Z";
const KING_ERMINE = (() => {
  const bottom: Pt[] = [];
  for (let x = 45; x >= -45; x -= 1.5)
    bottom.push([x, -34 + (x * x) / 423 + 1 * Math.abs(Math.sin(x * 0.4))]);
  return `M-46 -36Q0 -46 46 -36${bottom.map((p) => `L${P(...p)}`).join("")}Z`;
})();
const KING_VELVET =
  "M-38 -50C-41 -66 -32 -77 -16 -78.5C-8 -79.5 -4 -76.5 0 -76.5C4 -76.5 8 -79.5 16 -78.5C32 -77 41 -66 38 -50Z";

const catmull = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const f = (i: 0 | 1) =>
    0.5 *
    (2 * b[i] +
      (c[i] - a[i]) * u +
      (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u * u +
      (3 * b[i] - a[i] - 3 * c[i] + d[i]) * u * u * u);
  return [f(0), f(1)];
};
/** Evenly spaced points along a smooth curve through `pts`. */
function along(pts: Pt[], gap: number) {
  const dense: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++)
    for (let j = 0; j < 20; j++)
      dense.push(
        catmull(
          pts[Math.max(i - 1, 0)],
          pts[i],
          pts[i + 1],
          pts[Math.min(i + 2, pts.length - 1)],
          j / 20,
        ),
      );
  dense.push(pts[pts.length - 1]);
  const out: Pt[] = [dense[0]];
  let run = 0;
  for (let i = 1; i < dense.length; i++) {
    run += Math.hypot(
      dense[i][0] - dense[i - 1][0],
      dense[i][1] - dense[i - 1][1],
    );
    if (run >= gap) {
      out.push(dense[i]);
      run = 0;
    }
  }
  return out;
}

const ARCH_PTS: Pt[] = [
  [38, -53],
  [40, -63],
  [37, -72],
  [28, -78],
  [14, -79.6],
  [0, -76],
];
const ARCH = ribbon(ARCH_PTS, [4.8, 4.8, 4.6, 4.2, 3.8, 3.6]);
const ARCH_PEARLS = along(ARCH_PTS, 4.3).slice(1, -1);

/** A cross pattée centred at (cx, cy), arms `a` long. */
function crossPattee(cx: number, cy: number, a: number) {
  const n = a * 0.24;
  const w = a * 0.56;
  const q = a * 0.14;
  const R = (x: number, y: number) => P(cx + x, cy + y);
  return (
    `M${R(-n, -n)}L${R(-w, -a)}Q${R(0, -a + q)} ${R(w, -a)}L${R(n, -n)}` +
    `L${R(a, -w)}Q${R(a - q, 0)} ${R(a, w)}L${R(n, n)}` +
    `L${R(w, a)}Q${R(0, a - q)} ${R(-w, a)}L${R(-n, n)}` +
    `L${R(-a, w)}Q${R(-a + q, 0)} ${R(-a, -w)}Z`
  );
}

/** A fleur-de-lis standing on (bx, by), about 14k tall. */
function fleur(bx: number, by: number, k: number) {
  const R = (x: number, y: number) => P(bx + x * k, by + y * k);
  const petal = (s: number) =>
    `M${R(s * 1.3, -4.4)}C${R(s * 2.2, -8.8)} ${R(s * 6.8, -11.4)} ${R(s * 7.3, -7.5)}` +
    `C${R(s * 7.5, -5.4)} ${R(s * 5.9, -4.3)} ${R(s * 4.7, -5.6)}` +
    `C${R(s * 5.3, -4)} ${R(s * 3.6, -2.9)} ${R(s * 1.3, -3.2)}Z`;
  return {
    centre: `M${R(0, -14.5)}C${R(2.9, -10.8)} ${R(3.3, -7)} ${R(1.5, -4.2)}L${R(-1.5, -4.2)}C${R(-3.3, -7)} ${R(-2.9, -10.8)} ${R(0, -14.5)}Z`,
    petals: petal(1) + petal(-1),
    collar: `M${R(-4.2, -4.9)}L${R(4.2, -4.9)}L${R(4.2, -2.7)}L${R(-4.2, -2.7)}Z`,
    foot: `M${R(-1.4, -2.7)}L${R(1.4, -2.7)}L${R(3, 0.4)}L${R(-3, 0.4)}Z`,
    vein: `M${R(0, -12.8)}L${R(0, -5.4)}M${R(1.8, -4.4)}C${R(2.6, -7.6)} ${R(5.4, -9.4)} ${R(6.4, -7.8)}M${R(-1.8, -4.4)}C${R(-2.6, -7.6)} ${R(-5.4, -9.4)} ${R(-6.4, -7.8)}`,
  };
}

const CENTRE_CROSS = { x: 0, a: 7.6 };
const FLEUR_X = 20.5;
const SIDE_CROSS = { x: 38.4, a: 5.4 };
const ORB = { x: 0, y: -80.6, r: 4.6 };

const crossAt = (x: number, a: number) => crossPattee(x, bandTop(x) - a + 0.6, a);

/** All the crown's gold, for the light to cross. */
const KING_METAL = [
  KING_BAND,
  ARCH.outline,
  mirrorD(ARCH.outline),
  crossAt(CENTRE_CROSS.x, CENTRE_CROSS.a),
  crossAt(SIDE_CROSS.x, SIDE_CROSS.a),
  mirrorD(crossAt(SIDE_CROSS.x, SIDE_CROSS.a)),
  ...[1, -1].flatMap((s) => {
    const f = fleur(s * FLEUR_X, bandTop(FLEUR_X) + 0.5, 1);
    return [f.centre, f.petals, f.collar, f.foot];
  }),
  circle(ORB.r, ORB.x, ORB.y),
  crossPattee(ORB.x, ORB.y - ORB.r - 3.4, 3.6),
].join("");

function drawGoldPiece(c: SkCanvas, d: string, vein?: string, shine?: string) {
  engrave(c, {
    d,
    fill: linear(-30, -95, 30, -35, GOLD),
    ink: INK_GOLD,
    width: 0.9,
    vein,
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
    shine,
    shineWidth: 0.6,
  });
}

function recordKingCrown() {
  return record((c) => {
    // the velvet cap, quilted
    let quilt = "";
    for (const x of [-30, -15, 0, 15, 30])
      quilt += `M${P(x, -50)}Q${P(x * 0.95, -68)} ${P(x * 0.4, -77)}`;
    engrave(c, {
      d: KING_VELVET,
      fill: radial(-14, -74, 48, ["#F25A6E", "#B0182E", "#6A0A1A", "#3A0410"]),
      ink: "#2A0408",
      width: 1,
      vein: quilt,
      veinColor: "#3A0410",
      veinWidth: 0.6,
      veinAlpha: 0.55,
      shine: "M-30 -62Q-26 -72 -14 -75.5",
      shineWidth: 0.7,
      shineAlpha: 0.4,
    });
    // the arches, pearled
    for (const s of [1, -1]) {
      const d = s > 0 ? ARCH.outline : mirrorD(ARCH.outline);
      const g = s > 0 ? ARCH.grooves : mirrorD(ARCH.grooves);
      drawGoldPiece(c, d, g);
      for (const [x, y] of ARCH_PEARLS) drawPearl(c, s * x, y, 1.55);
    }
    // the orb and its cross
    const ob = ORB;
    drawGoldPiece(
      c,
      crossPattee(ob.x, ob.y - ob.r - 3.4, 3.6),
      undefined,
      undefined,
    );
    engrave(c, {
      d: circle(ob.r, ob.x, ob.y),
      fill: radial(ob.x - 1.6, ob.y - 1.8, ob.r * 1.8, GOLD),
      ink: INK_GOLD,
      width: 0.9,
      vein: `M${P(ob.x - ob.r, ob.y + 0.4)}Q${P(ob.x, ob.y + 2.2)} ${P(ob.x + ob.r, ob.y + 0.4)}M${P(ob.x, ob.y - ob.r)}L${P(ob.x, ob.y + 1.2)}`,
      veinColor: VEIN_GOLD,
      veinWidth: 0.7,
      shine: `M${P(ob.x - 3.2, ob.y - 1)}Q${P(ob.x - 2.8, ob.y - 3.2)} ${P(ob.x - 0.8, ob.y - 3.8)}`,
    });
    drawGem(c, {
      x: ob.x,
      y: ob.y - ob.r - 3.4,
      w: 2.4,
      h: 2.4,
      colors: SAPPHIRE,
      collet: 0,
    });
    // crosses and fleurs-de-lis along the rim
    const centre = crossAt(CENTRE_CROSS.x, CENTRE_CROSS.a);
    drawGoldPiece(c, centre);
    drawGem(c, {
      x: 0,
      y: bandTop(0) - CENTRE_CROSS.a + 0.6,
      w: 3.4,
      h: 3.4,
      colors: SAPPHIRE,
      collet: 0.7,
    });
    for (const s of [1, -1]) {
      const sx = s * SIDE_CROSS.x;
      drawGoldPiece(c, crossAt(sx, SIDE_CROSS.a));
      drawGem(c, {
        x: sx,
        y: bandTop(sx) - SIDE_CROSS.a + 0.6,
        w: 2.6,
        h: 2.6,
        colors: RUBY,
        collet: 0.5,
      });
      const f = fleur(s * FLEUR_X, bandTop(FLEUR_X) + 0.5, 1);
      drawGoldPiece(c, f.petals, f.vein);
      drawGoldPiece(c, f.centre, f.vein, undefined);
      drawGoldPiece(c, f.foot);
      drawGoldPiece(c, f.collar);
      drawPearl(c, s * FLEUR_X, bandTop(FLEUR_X) + 0.5 - 15.6, 1.5);
    }
    // the circlet, grooved, its jewels set in collets
    const grooves =
      "M-45 -46.3Q0 -56.3 45 -46.3M-45 -37.7Q0 -47.7 45 -37.7";
    engrave(c, {
      d: KING_BAND,
      fill: linear(0, -56, 0, -38, ["#FFF2B8", "#F0CC72", "#E2B04A", "#9A6B1E"]),
      ink: INK_GOLD,
      width: 1.1,
      vein: grooves,
      veinColor: VEIN_GOLD,
      veinWidth: 0.6,
      shine: "M-40 -47.6Q-22 -52.6 -6 -53.2",
      shineWidth: 0.7,
    });
    for (const x of [-42.5, -26, -9, 9, 26, 42.5])
      drawPearl(c, x, bandMid(x), 1.8);
    drawGem(c, { x: 0, y: bandMid(0), w: 11.5, h: 8.6, colors: RUBY });
    for (const s of [1, -1]) {
      drawGem(c, {
        x: s * 17.5,
        y: bandMid(17.5),
        w: 7.6,
        h: 6.6,
        colors: SAPPHIRE,
      });
      drawGem(c, {
        x: s * 34.5,
        y: bandMid(34.5),
        w: 5.8,
        h: 5.4,
        colors: EMERALD,
      });
    }
    // the ermine at its foot
    let fur = "";
    for (let k = 0; k < 70; k++) {
      const x = -44 + rnd(k + 400) * 88;
      const y0 = bandBot(x) + 0.8 + rnd(k + 500) * 4.6;
      fur += `M${P(x, y0)}L${P(x + 0.6, y0 + 1.6)}`;
    }
    engrave(c, {
      d: KING_ERMINE,
      fill: linear(0, -44, 0, -32, IVORY),
      ink: INK_GOLD,
      width: 0.9,
      vein: fur,
      veinColor: "#A08A60",
      veinWidth: 0.4,
      veinAlpha: 0.6,
    });
    for (const x of [-36, -18, 0, 18, 36]) {
      const y0 = bandBot(x) + 1.7;
      const spot = skPath(
        `M${P(x, y0)}C${P(x + 1.8, y0 + 1.6)} ${P(x + 1.1, y0 + 3.9)} ${P(x, y0 + 4.9)}C${P(x - 1.1, y0 + 3.9)} ${P(x - 1.8, y0 + 1.6)} ${P(x, y0)}Z` +
          circle(0.5, x - 1.4, y0 - 0.5) +
          circle(0.5, x, y0 - 1.1) +
          circle(0.5, x + 1.4, y0 - 0.5),
      );
      if (spot) c.drawPath(spot, brush("#17110C"));
    }
  });
}

/** The ring round the picture: gold, strung with pearls, set with
 *  jewels below the crown. */
const KING_RING = circle(56.6) + circle(51.4);
const KING_RING_GEMS: { at: number; colors: string[]; size: number }[] = [
  { at: 0, colors: SAPPHIRE, size: 5.6 },
  { at: 45, colors: EMERALD, size: 5.2 },
  { at: 90, colors: RUBY, size: 6.4 },
  { at: 135, colors: EMERALD, size: 5.2 },
  { at: 180, colors: SAPPHIRE, size: 5.6 },
];

function recordKingRing() {
  return record((c) => {
    engrave(c, {
      d: KING_RING,
      evenOdd: true,
      fill: linear(-50, -60, 50, 60, GOLD),
      ink: INK_GOLD,
      width: 1.1,
      vein: circle(55.5) + circle(52.5),
      veinColor: VEIN_GOLD,
      veinWidth: 0.5,
      shine: arc(56, 150, 200),
      shineWidth: 0.6,
    });
    for (let k = 0; k < 48; k++) {
      const a = k * 7.5;
      if (KING_RING_GEMS.some((g) => Math.abs(g.at - a) < 6)) continue;
      // the crown covers the top
      if (a > 200 && a < 340) continue;
      const p = polar(a * DEG, 54);
      drawPearl(c, p.x, p.y, 1.75);
    }
    for (const g of KING_RING_GEMS) {
      const p = polar(g.at * DEG, 54);
      drawGem(c, { x: p.x, y: p.y, w: g.size, h: g.size, colors: g.colors });
    }
  });
}

const kingCrownPicture = once(recordKingCrown);
const kingRingPicture = once(recordKingRing);

function KingBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.42 + 0.1 * Math.sin(t.value * 1.5));
  return <Halo r={90} color="#FFC94A" opacity={glow} />;
}

function KingFront({ t }: { t: Clock }) {
  const crown = useMemo(() => kingCrownPicture(), []);
  const ring = useMemo(() => kingRingPicture(), []);
  // the great ruby beats slowly
  const beat = useDerivedValue(() => {
    const p = (t.value % 2.4) / 2.4;
    return Math.max(0, Math.sin(p * TAU)) ** 3;
  });
  const ember = useDerivedValue(() => 0.15 + beat.value * 0.6);
  const y = bandMid(0);
  return (
    <Group>
      <Picture picture={ring} />
      <Sweep t={t} d={KING_RING} evenOdd every={4.4} phase={0.4} />
      <Picture picture={crown} />
      <Sweep t={t} d={KING_METAL} every={4.4} />
      <Circle cx={0} cy={y} r={7.5} color="#FF2A3A" opacity={ember}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Glint t={t} x={-2} y={y - 1.6} size={6} phase={0} speed={1.1} />
      <Glint t={t} x={0} y={ORB.y - ORB.r - 3.4} size={4.5} phase={1.9} speed={1.2} />
      <Glint t={t} x={-FLEUR_X} y={bandTop(FLEUR_X) - 15} size={3.5} phase={3.3} speed={1.3} />
      <Glint t={t} x={54} y={0} size={3.5} phase={2.6} speed={0.9} />
      <Glint t={t} x={0} y={54} size={4} phase={4.4} speed={1} />
    </Group>
  );
}

const KingCrown: ArtBorderDrawing = { back: KingBack, front: KingFront };

// ══ Queen's Tiara ════════════════════════════════════════════════════

/** The tiara is drawn with its foot at (0, -40), its band curving up in
 *  the middle; TIARA_PLACE moves it onto the picture's top right. */
const TIARA_BAND = "M-46 -43Q0 -52 46 -43L45 -37Q0 -46 -45 -37Z";
const tiaraTop = (x: number) => -47.5 + (x * x) / 470;
const tiaraMid = (x: number) => -44.5 + (x * x) / 470;

/** A pear-shaped loop of wire, point up, leaning by `lean`. */
function pearFrame(x: number, y: number, w: number, h: number, wire: number) {
  return (
    poly(girdle("pear", x, y, w, h)) +
    poly(girdle("pear", x, y + wire * 0.35, w - wire * 2, h - wire * 2.4))
  );
}

const STONE = { x: 0, y: -64, w: 10.5, h: 16 };
const FRAMES = [
  { x: 0, y: -64.4, w: 16, h: 23.5, wire: 2.4, lean: 0 },
  { x: 19, y: -58.6, w: 11.4, h: 17, wire: 2, lean: 0.08 },
  { x: 33.6, y: -53.4, w: 8.4, h: 12.6, wire: 1.7, lean: 0.15 },
];
const TIARA_SCROLLS = [
  curl(6.6, -48.6, -1.05, 15, 3.6, 2.6, 0.6),
  curl(25, -46.6, -1.1, 11, 3.6, 2.2, 0.6),
  curl(39.4, -44.4, -1.3, 9, 3.6, 1.9, 0.6),
];

/** The openwork plate behind the frames: the tiara's silhouette, a
 *  silver mesh. */
const TIARA_PLATE =
  "M-46 -43Q-41 -55 -32.5 -58.5Q-25 -61.5 -18 -65Q-10 -75.5 0 -75.5Q10 -75.5 18 -65Q25 -61.5 32.5 -58.5Q41 -55 46 -43Z";
const TIARA_MESH = Array.from({ length: 34 }, (_, k) => {
  const x = -60 + k * 3.6;
  return `M${P(x, -40)}L${P(x + 36, -80)}M${P(x + 36, -40)}L${P(x, -80)}`;
}).join("");

/** Every silver part of the right half, for the light to cross. */
const TIARA_RIGHT = [
  ...FRAMES.slice(1).map((f) => pearFrame(f.x, f.y, f.w, f.h, f.wire)),
  ...TIARA_SCROLLS.map((s) => s.outline),
].join("");
const TIARA_METAL =
  TIARA_PLATE +
  TIARA_BAND +
  pearFrame(FRAMES[0].x, FRAMES[0].y, FRAMES[0].w, FRAMES[0].h, FRAMES[0].wire) +
  TIARA_RIGHT +
  mirrorD(TIARA_RIGHT);

function drawSilver(c: SkCanvas, d: string, vein?: string, evenOdd = false) {
  engrave(c, {
    d,
    evenOdd,
    fill: linear(-20, -90, 20, -40, SILVER),
    ink: INK_SILVER,
    width: 0.8,
    vein,
    veinColor: VEIN_SILVER,
    veinWidth: 0.45,
  });
}

function tiaraHalf(c: SkCanvas) {
  for (const s of TIARA_SCROLLS) drawSilver(c, s.outline, s.vein);
  for (const f of FRAMES.slice(1)) {
    c.save();
    c.rotate(f.lean / DEG, f.x, f.y + f.h / 2);
    drawSilver(c, pearFrame(f.x, f.y, f.w, f.h, f.wire), undefined, true);
    drawGem(c, {
      x: f.x,
      y: f.y + f.wire * 0.3,
      w: f.w - f.wire * 2 - 1.4,
      h: f.h - f.wire * 2.4 - 1.4,
      colors: DIAMOND,
      cut: "pear",
      collet: 0,
    });
    drawPearl(c, f.x, f.y - f.h / 2 - 2, f.wire * 1.05);
    c.restore();
    drawGem(c, {
      x: f.x,
      y: (f.y + f.h / 2 + tiaraTop(f.x)) / 2 + 0.6,
      w: 2.2,
      h: 2.2,
      colors: DIAMOND,
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.7,
    });
  }
  // a small diamond in the eye of each scroll
  for (const s of TIARA_SCROLLS) {
    const [x, y] = s.at(0.97).p;
    drawGem(c, {
      x,
      y,
      w: 1.8,
      h: 1.8,
      colors: DIAMOND,
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.5,
    });
  }
}

function recordTiara() {
  return record((c) => {
    engrave(c, {
      d: TIARA_PLATE,
      fill: linear(-20, -80, 20, -42, ["#FFFFFF", "#DDE3EC", "#AEB7C6"]),
      ink: INK_SILVER,
      width: 0.9,
      vein: TIARA_MESH,
      veinColor: INK_SILVER,
      veinWidth: 0.4,
      veinAlpha: 0.35,
    });
    tiaraHalf(c);
    c.save();
    c.scale(-1, 1);
    tiaraHalf(c);
    c.restore();
    // the great frame and its pear-cut stone
    const f = FRAMES[0];
    drawSilver(c, pearFrame(f.x, f.y, f.w, f.h, f.wire), undefined, true);
    drawGem(c, {
      x: STONE.x,
      y: STONE.y,
      w: STONE.w,
      h: STONE.h,
      colors: PINK,
      cut: "pear",
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.9,
    });
    drawGem(c, {
      x: 0,
      y: f.y - f.h / 2 - 2.2,
      w: 2.6,
      h: 2.6,
      colors: DIAMOND,
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.7,
    });
    drawPearl(c, 0, f.y - f.h / 2 - 6.6, 2.7);
    drawGem(c, {
      x: 0,
      y: (f.y + f.h / 2 + tiaraTop(0)) / 2 + 0.4,
      w: 2.6,
      h: 2.6,
      colors: DIAMOND,
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.8,
    });
    // the band, set with a row of small diamonds
    engrave(c, {
      d: TIARA_BAND,
      fill: linear(0, -52, 0, -37, ["#FFFFFF", "#E4E9F0", "#C9D0DA", "#7A8494"]),
      ink: INK_SILVER,
      width: 0.9,
      vein: "M-45 -41.4Q0 -50.4 45 -41.4M-45 -38.6Q0 -47.6 45 -38.6",
      veinColor: VEIN_SILVER,
      veinWidth: 0.4,
      veinAlpha: 0.6,
    });
    for (let x = -40; x <= 40; x += 4.4)
      drawGem(c, {
        x,
        y: tiaraMid(x),
        w: 2.4,
        h: 2.4,
        colors: Math.abs(x) < 1 ? PINK : DIAMOND,
        collet: 0,
      });
  });
}

/** The fine pearl circlet round the picture, a pink drop at its foot. */
function recordCirclet() {
  return record((c) => {
    const chain = skPath(circle(54.6));
    if (chain) {
      c.drawPath(chain, pen(1.6, INK_SILVER, 0.8));
      c.drawPath(chain, pen(0.8, "#C9D0DA"));
    }
    const N = 54;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * 360 + 90;
      const p = polar(a * DEG, 54.6);
      if (k === 0) continue;
      drawPearl(c, p.x, p.y, 2.25);
      const q = polar((a + 180 / N) * DEG, 54.6);
      const bead = skPath(circle(0.75, q.x, q.y));
      if (bead) {
        c.drawPath(bead, brush("#E4E9F0"));
        c.drawPath(bead, pen(0.35, INK_SILVER));
      }
    }
    // the pendant
    drawGem(c, {
      x: 0,
      y: 55.2,
      w: 3,
      h: 3,
      colors: DIAMOND,
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.8,
    });
    drawGem(c, {
      x: 0,
      y: 62.6,
      w: 6,
      h: 9,
      colors: PINK,
      cut: "pear",
      metal: SILVER,
      ink: INK_SILVER,
      collet: 0.9,
    });
  });
}

const tiaraPicture = once(recordTiara);
const circletPicture = once(recordCirclet);

/** The tiara's foot (0, -40) moved onto the picture's top right, tilted
 *  and made smaller: a side tiara sitting on the head. */
const TIARA_PLACE = [
  { translateX: 24 },
  { translateY: -33 },
  { rotate: 0.62 },
  { scale: 0.66 },
  { translateY: 40 },
];

function QueenBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.4 + 0.1 * Math.sin(t.value * 1.4));
  return <Halo r={90} color="#FFB3DA" opacity={glow} />;
}

function QueenFront({ t }: { t: Clock }) {
  const tiara = useMemo(() => tiaraPicture(), []);
  const circlet = useMemo(() => circletPicture(), []);
  // the pink stone glows, slowly
  const glow = useDerivedValue(() => {
    const p = (t.value % 2.8) / 2.8;
    return 0.15 + 0.55 * Math.max(0, Math.sin(p * TAU)) ** 2;
  });
  return (
    <Group>
      <Picture picture={circlet} />
      <Glint t={t} x={-1} y={61} size={4} phase={2.2} speed={1} />
      <Glint t={t} x={-47} y={27} size={3.2} phase={4} speed={1.1} />
      <Glint t={t} x={-38} y={-38} size={3} phase={0.9} speed={0.8} />
      <Group transform={TIARA_PLACE}>
        <Circle cx={STONE.x} cy={STONE.y} r={10} color="#FF5AAE" opacity={glow}>
          <BlurMask blur={6} style="normal" />
        </Circle>
        <Picture picture={tiara} />
        <Sweep t={t} d={TIARA_METAL} every={4} />
        <Glint t={t} x={-2} y={STONE.y - 3} size={8} phase={0.5} speed={1} />
        <Glint t={t} x={-19} y={-59} size={5} phase={2} speed={1.3} />
        <Glint t={t} x={33.6} y={-54} size={4.5} phase={3.3} speed={1.2} />
      </Group>
    </Group>
  );
}

const QueenTiara: ArtBorderDrawing = { back: QueenBack, front: QueenFront };

export const MAJESTY_ART: Record<string, ArtBorderDrawing> = {
  "fire-dragon": DragonCoil,
  "king-crown": KingCrown,
  "queen-crown": QueenTiara,
};

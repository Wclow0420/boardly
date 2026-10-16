// Celestial Throne and Archangel: the grandest borders in the shop,
// engraved in the house style (see crest.tsx and baroque.tsx).
//   Celestial Throne — the picture is the seat. Behind it a tall gold
//     throne back with an ivory panel cut with rays rises between two
//     fluted gold posts topped with flame finials; a medallion crest with
//     a ruby crowns it. Midnight-blue velvet strewn with gold stars hangs
//     behind as a canopy: a scalloped valance with gold fringe, curtains
//     tied back at the sides, tassels swaying. Gold arms scroll out at the
//     lower sides and stand on lion paws. A crown of small stars turns
//     slowly over the crest. A gold ring with a velvet channel set with
//     stars lies over the picture's edge. Every eight seconds light pours
//     down from the canopy and the stars flare.
//   Archangel — a seraph: six engraved ivory-and-gold wings in three
//     pairs, the upper pair raised in an arch over a blazing gold halo,
//     the middle pair spread wide, the lower pair folded below. They open
//     and close in a slow staggered wave. Divine rays break through soft
//     clouds behind. A wreath of ivory feathers tucked under a gold rim
//     lies over the picture's edge, a diamond at its top. Every nine
//     seconds all six wings sweep open together in a burst of light.

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

import {
  FEATHER,
  LEAF,
  curl,
  ribbon,
  type Pt,
} from "@/components/engraved/shapes";

import {
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { RAYS } from "./rimfx";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const INK = "#3A2408";
const VEIN = "#7A5212";
const IVORY_VEIN = "#A08A60";
/** Midnight-blue velvet: its sheen, body and the dark of its folds. */
const VELVET = ["#5A7ACC", "#22357A", "#0C1438"];
const INK_VELVET = "#060A1E";
const RUBY: [string, string, string] = ["#FF9AA6", "#D0102E", "#5A0410"];
const DIAMOND: [string, string, string] = ["#FFFFFF", "#CFEAFF", "#3A6AA8"];
const DEG = Math.PI / 180;

// ── path data ─────────────────────────────────────────────────────────

const f2 = (n: number) => n.toFixed(2);
const pt = (p: { x: number; y: number }) => `${f2(p.x)} ${f2(p.y)}`;
const circle = (r: number, cx = 0, cy = 0) =>
  `M${f2(cx + r)} ${f2(cy)}A${r} ${r} 0 1 1 ${f2(cx - r)} ${f2(cy)}A${r} ${r} 0 1 1 ${f2(cx + r)} ${f2(cy)}Z`;
/** A band from rIn to rOut (fill it even-odd). */
const band = (rOut: number, rIn: number) => circle(rOut) + circle(rIn);
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f2(cx + rx)} ${f2(cy)}A${rx} ${ry} 0 1 1 ${f2(cx - rx)} ${f2(cy)}A${rx} ${ry} 0 1 1 ${f2(cx + rx)} ${f2(cy)}Z`;
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${pt(p)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${pt(q)}`;
};
const line = (pts: Pt[]) =>
  `M${pts.map((p) => `${f2(p[0])} ${f2(p[1])}`).join("L")}`;
/** Mirrors path data made only of absolute x y pairs (M, L, C, Q, Z). */
const mirror = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-x} ${y}`);
/** A star of `n` points, outer radius R, inner r, pointing up. */
const star = (R: number, r: number, n = 5, cx = 0, cy = 0) =>
  `M${Array.from({ length: n * 2 }, (_, k) => {
    const p = polar(-Math.PI / 2 + (k * Math.PI) / n, k % 2 ? r : R);
    return `${f2(cx + p.x)} ${f2(cy + p.y)}`;
  }).join("L")}Z`;

/** A smooth line through `points` (Catmull-Rom), `S` samples a span. */
function smooth(points: Pt[], S = 8): Pt[] {
  const out: Pt[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const a = points[Math.max(i - 1, 0)];
    const b = points[i];
    const c = points[i + 1];
    const d = points[Math.min(i + 2, n - 1)];
    for (let j = 0; j < S; j++) {
      const u = j / S;
      const f = (k: 0 | 1) =>
        0.5 *
        (2 * b[k] +
          (c[k] - a[k]) * u +
          (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u +
          (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u * u * u);
      out.push([f(0), f(1)]);
    }
  }
  out.push(points[n - 1]);
  return out;
}

/** 0 → 1 → 0 over `len` seconds, once every `every`, starting `at`
 *  seconds into the cycle (a still clock, 1.7, falls outside it). */
const moment = (t: number, every: number, len: number, at: number) => {
  "worklet";
  const p = (((t - at) % every) + every) % every;
  if (p > len) return 0;
  const u = p / len;
  if (u < 0.18) return Math.sin(((u / 0.18) * Math.PI) / 2);
  const v = Math.cos((((u - 0.18) / 0.82) * Math.PI) / 2);
  return v * v;
};

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
  positions: number[] | null = null,
) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    cs.map((c) => Skia.Color(c)),
    positions,
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

const toPath = (d: string, evenOdd = false) => {
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
  shine?: string;
  shineWidth?: number;
  /** A shade cast under it, down and to the right. */
  shadow?: number;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = toPath(p.d, p.evenOdd);
  if (!path) return;
  if (p.shadow) {
    c.save();
    c.translate(0.7, 1.1);
    c.drawPath(path, brush("#1A0E02", p.shadow, 0.8));
    c.restore();
  }
  c.drawPath(path, brush(p.fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? toPath(p.vein) : null;
    if (vein)
      c.drawPath(vein, pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, 0.8));
    const shine = p.shine ? toPath(p.shine) : null;
    if (shine) c.drawPath(shine, pen(p.shineWidth ?? 0.9, "#FFFFFF", 0.85));
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

const gold = (x0 = -60, y0 = -70, x1 = 60, y1 = 70) =>
  linear(x0, y0, x1, y1, GOLD);

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-100, -100, 200, 200));
  draw(c);
  return recorder.finishRecordingAsPicture();
}

/** Made once, on first use (never at import: Jest has no Skia). */
function lazy<T>(make: () => T) {
  let made: T | undefined;
  return () => (made ??= make());
}

// ── how it is drawn each frame ────────────────────────────────────────
// Every frame Skia redraws each canvas, so the borders are drawn cheaply:
// whatever stands still (or only moves as a whole: a wing, a curtain, a
// tassel) is baked once into an image, blurs and all, and each layer is
// one picture recorded per frame from a single derived value, which
// places those images and draws the few live shapes (glows, motes,
// glints, the light sweeping the gold) with the same numbers as ever.

/** Pixels per art unit the still parts are baked at: a little finer
 *  than a 100pt avatar shows them, so they stay crisp up to ~130pt. */
const bakeScale = () => Math.max(2, PixelRatio.get()) * 1.2;

/** A drawing baked into an image, and the rect (in art units) it fills. */
interface Baked {
  image: SkImage;
  src: SkRect;
  dst: SkRect;
}

/** Bakes `draw` over the art rect x, y, w, h. Soft things (blurred light)
 *  can take a coarser `scale`. */
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

/** `paint` (opaque) set to alpha `a`, clamped as Skia's opacity is. A
 *  picture keeps a copy of each paint it draws with, so one paint can be
 *  reused at many alphas; never pass one that is also drawn unfaded. */
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

const DEG_W = 180 / Math.PI;

/** A plain fill (or, with `blur`, a soft one) for the live shapes. */
function fill(color: string, blur = 0, screen = false) {
  const paint = brush(color, Skia.Color(color)[3], blur);
  if (screen) paint.setBlendMode(BlendMode.Screen);
  return paint;
}

/** Starts a frame's picture. */
const begin = () => {
  "worklet";
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-100, -100, 200, 200));
  return { recorder, c };
};

/** The shared light sweeping a gold shape: a soft white band, tilted,
 *  crossing the canvas once every `every` seconds (as Sweep in crowns),
 *  drawn as the shape filled with a moving gradient. */
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
interface GlintSpec {
  x: number;
  y: number;
  path: SkPath;
  phase: number;
  speed: number;
}
const glintPath = (size: number) => {
  const w = size * 0.2;
  return toPath(
    `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`,
  )!;
};
const glint = (
  x: number,
  y: number,
  size: number,
  phase: number,
  speed: number,
): GlintSpec => ({ x, y, path: glintPath(size), phase, speed });
const drawGlints = (
  c: SkCanvas,
  glints: GlintSpec[],
  white: SkPaint,
  t: number,
) => {
  "worklet";
  for (const g of glints) {
    const s = Math.max(0, Math.sin(t * g.speed + g.phase));
    if (s <= 0) continue;
    c.save();
    c.translate(g.x, g.y);
    const k = 0.15 + s ** 5;
    c.scale(k, k);
    c.drawPath(g.path, faded(white, s ** 3));
    c.restore();
  }
};

/** A soft glow behind everything (as Halo in kit). */
const halo = (r: number, color: string) =>
  brush(radial(0, 0, r, [color, `${color}00`], [0.55, 1]));

/** A faceted gem (as Gem in crowns): body, darker lower half, highlight. */
function gem(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: [string, string, string],
) {
  c.drawOval(
    Skia.XYWHRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2),
    brush("#5A3A08"),
  );
  c.drawOval(
    Skia.XYWHRect(x - w / 2, y - h / 2, w, h),
    brush(radial(x - w * 0.2, y - h * 0.25, Math.max(w, h), colors)),
  );
  c.drawOval(
    Skia.XYWHRect(x - w * 0.28, y - h * 0.32, w * 0.3, h * 0.22),
    brush("#FFFFFF", 0xcc / 255),
  );
}

/** A small domed stud: a bead, a pearl, a finial's ball. */
function stud(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  colors: string[],
  ink = INK,
  width = 0.5,
) {
  const p = toPath(circle(r, x, y));
  if (!p) return;
  c.drawPath(p, brush(radial(x - r * 0.35, y - r * 0.4, r * 1.6, colors)));
  if (width > 0) c.drawPath(p, pen(width, ink));
}

/** One engraved feather at (x, y), pointing along `dir` (degrees). */
function feather(
  c: SkCanvas,
  x: number,
  y: number,
  dir: number,
  len: number,
  w: number,
  kind: "ivory" | "cream" | "gold",
  ink = 0.9,
) {
  c.save();
  c.translate(x, y);
  c.rotate(dir + 90, 0, 0);
  const barbs = [0.32, 0.5, 0.68]
    .map((s) => {
      const y0 = -len * s;
      return `M${f2(w * 0.08)} ${f2(y0)}L${f2(w * 0.8)} ${f2(y0 - len * 0.1)}M${f2(-w * 0.08)} ${f2(y0 - len * 0.04)}L${f2(-w * 0.7)} ${f2(y0 - len * 0.13)}`;
    })
    .join("");
  const fill =
    kind === "gold"
      ? linear(-w, -len, w, 0, GOLD)
      : linear(
          0,
          0,
          0,
          -len,
          kind === "ivory"
            ? ["#CDBE98", "#F4EEDF", "#FFFFFF"]
            : ["#C8B080", "#F2E4C4", "#FFFBF0"],
        );
  engrave(c, {
    d: FEATHER(len, w),
    fill,
    ink: INK,
    width: ink,
    vein: `M0 -1L${f2(w * 0.06)} ${f2(-len * 0.9)}${barbs}`,
    veinColor: kind === "gold" ? VEIN : IVORY_VEIN,
    veinWidth: 0.55,
    shine: `M${f2(-w * 0.5)} ${f2(-len * 0.22)}L${f2(-w * 0.42)} ${f2(-len * 0.72)}`,
    shineWidth: 0.8,
    shadow: 0.28,
  });
  c.restore();
}

/** A gold tassel hanging from (0, 0): cord, knob, collar, skirt. */
const tasselPicture = lazy(() =>
  record((c) => {
    c.drawPath(toPath("M0 0L0 6")!, pen(2, INK));
    c.drawPath(toPath("M0 0L0 6")!, pen(1, "#F0CC72"));
    stud(c, 0, 7.6, 2.5, GOLD.slice(0, 3), INK, 0.6);
    engrave(c, {
      d: "M-3.4 10.2C-3.4 9.2 3.4 9.2 3.4 10.2L4.8 19.6C2 21 -2 21 -4.8 19.6Z",
      fill: linear(-4, 9, 4, 20, GOLD),
      ink: INK,
      width: 0.7,
      vein: "M-2.4 11L-3.6 19.4M-0.8 11L-1.2 20M0.8 11L1.2 20M2.4 11L3.6 19.4",
      veinColor: VEIN,
      veinWidth: 0.5,
    });
    engrave(c, {
      d: ellipse(0, 10.2, 3.6, 1.4),
      fill: gold(-4, 9, 4, 12),
      ink: INK,
      width: 0.6,
    });
  }),
);

// ══ Celestial Throne ═════════════════════════════════════════════════

// The canopy's curtains, the right one: top under the valance, gathered
// at the tie-back, falling to a hem.
const CURTAIN_OUT: Pt[] = [
  [66, -82],
  [80, -64],
  [87, -38],
  [89, -12],
  [86, 6],
  [89, 28],
  [91, 48],
  [90, 64],
];
const CURTAIN_IN: Pt[] = [
  [28, -82],
  [46, -66],
  [62, -48],
  [72, -24],
  [80, 4],
  [78, 26],
  [74, 46],
  [69, 63],
];
const C_OUT = smooth(CURTAIN_OUT);
const C_IN = smooth(CURTAIN_IN);
/** The hem, inner corner to outer, in two soft scallops. */
const HEM = "Q74 68 79.5 65Q85 69 90 64";
const CURTAIN = `${line(C_IN)}${HEM}${line([...C_OUT].reverse()).replace("M", "L")}Z`;
const FOLDS = [0.2, 0.42, 0.64, 0.84].map((s) =>
  C_IN.map((p, i): Pt => [
    p[0] + (C_OUT[i][0] - p[0]) * s,
    p[1] + (C_OUT[i][1] - p[1]) * s,
  ]),
);
const TIE: Pt = [83, 6];

// The valance across the top: a gold cornice, velvet scalloped below, a
// fringe along the scallops.
const VAL_FROM = -156;
const VAL_TO = -24;
const SCALLOPS = 7;
const VAL_TOP = 88;
const CORNICE = 84.6;
/** The scalloped lower edge: joints at 79, sagging toward the middle. */
const valEdge = (a: number) => {
  const f = ((a - VAL_FROM) / (VAL_TO - VAL_FROM)) * SCALLOPS;
  return 79 - 5 * Math.sin(Math.PI * (f - Math.floor(f)));
};
const valLine = (offset: number) => {
  const N = 140;
  return Array.from({ length: N + 1 }, (_, i) => {
    const a = VAL_FROM + ((VAL_TO - VAL_FROM) * i) / N;
    return pt(polar(a * DEG, valEdge(a) + offset));
  });
};
const VALANCE = `M${valLine(0).join("L")}${arc(VAL_TOP, VAL_TO, VAL_FROM).replace(/^M[^A]+/, "L" + pt(polar(VAL_TO * DEG, VAL_TOP)))}Z`;
const FRINGE = `M${valLine(0).join("L")}L${[...valLine(-3.4)].reverse().join("L")}Z`;
const FRINGE_CUTS = Array.from({ length: 66 }, (_, k) => {
  const a = VAL_FROM + ((VAL_TO - VAL_FROM) * (k + 0.5)) / 66;
  return `M${pt(polar(a * DEG, valEdge(a) - 3.6))}L${pt(polar(a * DEG, valEdge(a) + 0.2))}`;
}).join("");
const CORNICE_BAND = `${arc(VAL_TOP, VAL_FROM, VAL_TO)}${arc(CORNICE, VAL_TO, VAL_FROM).replace("M", "L")}Z`;
/** Where the scallops meet: tassels hang there. */
const VAL_JOINTS = Array.from({ length: SCALLOPS + 1 }, (_, k) => {
  const a = VAL_FROM + ((VAL_TO - VAL_FROM) * k) / SCALLOPS;
  return polar(a * DEG, 78);
});
/** Gold stars embroidered on the velvet, one per scallop. */
const VAL_STARS = Array.from({ length: SCALLOPS }, (_, k) => {
  const a = VAL_FROM + ((VAL_TO - VAL_FROM) * (k + 0.5)) / SCALLOPS;
  return polar(a * DEG, 80);
});

const velvet = (x0: number, y0: number, x1: number, y1: number) =>
  linear(x0, y0, x1, y1, [
    VELVET[2],
    VELVET[1],
    VELVET[0],
    VELVET[1],
    VELVET[2],
  ]);

/** The curtains (both), velvet with gold-trimmed edges and tie-backs. */
const curtainPicture = lazy(() =>
  record((c) => {
    for (const sx of [1, -1]) {
      c.save();
      c.scale(sx, 1);
      const body = toPath(CURTAIN);
      if (!body) continue;
      c.drawPath(body, brush(velvet(30, -20, 92, 10)));
      c.save();
      c.clipPath(body, ClipOp.Intersect, true);
      // folds: a soft sheen beside a dark crease
      for (const fold of FOLDS) {
        const d = toPath(line(fold));
        if (!d) continue;
        c.save();
        c.translate(-1.6, 0);
        c.drawPath(d, pen(3.2, VELVET[0], 0.45));
        c.restore();
        c.drawPath(d, pen(1, INK_VELVET, 0.7));
      }
      // embroidered stars
      for (let k = 0; k < 7; k++) {
        const i = Math.round(((k + 0.5) / 7) * (C_IN.length - 1));
        const s = 0.3 + 0.4 * rnd(k + 11);
        const x = C_IN[i][0] + (C_OUT[i][0] - C_IN[i][0]) * s;
        const y = C_IN[i][1] + (C_OUT[i][1] - C_IN[i][1]) * s;
        c.drawPath(toPath(star(2.2, 0.9, 5, x, y))!, brush("#F0CC72", 0.9));
      }
      c.restore();
      c.drawPath(body, pen(1.1, INK_VELVET));
      // the gold trim down the inner edge and along the hem
      const trim = toPath(`${line(C_IN)}${HEM}`);
      if (trim) {
        c.drawPath(trim, pen(3.6, INK));
        c.drawPath(trim, pen(2.2, "#E2B04A"));
        c.save();
        c.translate(-0.4, -0.4);
        c.drawPath(trim, pen(0.7, "#FFF2B8", 0.9));
        c.restore();
      }
      // the tie-back: a twisted gold cord round the gather
      const cord = ribbon(
        [
          [TIE[0] - 6, TIE[1] - 3],
          [TIE[0], TIE[1] + 1.5],
          [TIE[0] + 7, TIE[1] - 0.5],
        ],
        [3.4, 4.2, 3.4],
      );
      engrave(c, {
        d: cord.outline,
        fill: gold(70, 0, 92, 10),
        ink: INK,
        width: 0.8,
        vein: Array.from({ length: 6 }, (_, k) => {
          const x = TIE[0] - 5 + k * 2.2;
          return `M${f2(x)} ${f2(TIE[1] - 3)}L${f2(x + 1.6)} ${f2(TIE[1] + 4)}`;
        }).join(""),
        veinColor: VEIN,
        veinWidth: 0.55,
        shadow: 0.35,
      });
      c.restore();
    }
  }),
);

const valancePicture = lazy(() =>
  record((c) => {
    const body = toPath(VALANCE);
    if (!body) return;
    // its shade on what hangs behind
    c.save();
    c.translate(0, 2);
    c.drawPath(body, brush("#000814", 0.35, 1.5));
    c.restore();
    c.drawPath(body, brush(velvet(-80, -50, 80, -50)));
    c.save();
    c.clipPath(body, ClipOp.Intersect, true);
    // the velvet's swags: a sheen along the middle of each scallop
    for (let k = 0; k < SCALLOPS; k++) {
      const a0 = VAL_FROM + ((VAL_TO - VAL_FROM) * k) / SCALLOPS;
      const a1 = a0 + (VAL_TO - VAL_FROM) / SCALLOPS;
      const m = (a0 + a1) / 2;
      const swag = `M${pt(polar(a0 * DEG, 82))}Q${pt(polar(m * DEG, 76))} ${pt(polar(a1 * DEG, 82))}`;
      c.drawPath(toPath(swag)!, pen(2.4, VELVET[0], 0.5));
      c.drawPath(
        toPath(`M${pt(polar(a0 * DEG, 84))}L${pt(polar(a0 * DEG, 79))}`)!,
        pen(0.9, INK_VELVET, 0.8),
      );
    }
    for (const s of VAL_STARS)
      c.drawPath(toPath(star(2, 0.8, 5, s.x, s.y))!, brush("#F6D274"));
    c.restore();
    c.drawPath(body, pen(1, INK_VELVET));
    // the fringe
    engrave(c, {
      d: FRINGE,
      fill: gold(-80, -80, 80, -40),
      ink: INK,
      width: 0.7,
      vein: FRINGE_CUTS,
      veinColor: VEIN,
      veinWidth: 0.5,
    });
    // the cornice, beaded
    engrave(c, {
      d: CORNICE_BAND,
      fill: gold(-60, -90, 60, -50),
      ink: INK,
      width: 1,
      vein: arc((VAL_TOP + CORNICE) / 2, VAL_FROM + 1, VAL_TO - 1),
      veinColor: VEIN,
      veinWidth: 0.6,
      shine: arc(VAL_TOP - 0.8, -150, -112),
    });
    for (const j of VAL_JOINTS)
      stud(c, j.x, j.y, 1.5, GOLD.slice(0, 3), INK, 0.45);
  }),
);

// The throne back: a gold frame with an ivory panel, an ogee top rising
// to the crest.
const BACK_OUT =
  "M0 -79C8 -79 12 -69 26 -68C40 -67 52 -64 60 -57L60 46L-60 46L-60 -57C-52 -64 -40 -67 -26 -68C-12 -69 -8 -79 0 -79Z";
const BACK_IN =
  "M0 -73C6 -73 10 -64 25 -63C37 -62 47 -60 54 -55L54 46L-54 46L-54 -55C-47 -60 -37 -62 -25 -63C-10 -64 -6 -73 0 -73Z";
const BACK_GROOVE =
  "M0 -70C5 -70 9 -61.5 24.5 -60.5C36 -59.5 45 -57.5 51.5 -53L51.5 44";
/** Rays engraved into the ivory, fanning from the seat. */
const BACK_RAYS = Array.from({ length: 31 }, (_, k) => {
  const a = (-165 + k * 5) * DEG;
  return `M${pt(polar(a, 52))}L${pt(polar(a, 90))}`;
}).join("");

// A post (the right one): fluted, capped, a flame finial on a ball.
const POST = "M60 -58H72V48H60Z";
const CAPITAL = "M57.5 -63.5H74.5L73 -58H59Z";
const NECK = "M63.5 -67.5H68.5L69.5 -63.5H62.5Z";
const FINIAL_BALL = { x: 66, y: -71.5, r: 4.6 };
// The arm: a scroll curling out and down from the post, a leg below it.
const ARM = curl(70, -2, -0.08, 26, 4.9, 9, 0.55);
const LEG = ribbon(
  [
    [80, 10],
    [77, 24],
    [75, 38],
    [78, 52],
  ],
  [7.5, 6, 5, 6.5],
);
/** A lion's paw, toes forward, resting at its centre. */
const PAW = { x: 79, y: 58 };
/** The paw: a domed foot, three toes along its front, a claw under
 *  each, and a dewclaw toe at the side. */
const PAW_FOOT =
  "M-10 1C-10.6 -6 -5.6 -10.4 0 -10.4C5.6 -10.4 10.6 -6 10 1Q10.4 6.4 6.6 6.4Q4.2 6.4 3.4 4.2Q2.6 7.4 0 7.4Q-2.6 7.4 -3.4 4.2Q-4.2 6.4 -6.6 6.4Q-10.4 6.4 -10 1Z";
const PAW_LINES =
  "M3.4 4.2C3.6 2 3.2 0 2.4 -1.6M-3.4 4.2C-3.6 2 -3.2 0 -2.4 -1.6M-7 -4C-4 -7.6 4 -7.6 7 -4";
const CLAWS = [-6.6, 0, 6.6].map((x, k) => {
  const y = k === 1 ? 7 : 6;
  return `M${f2(x - 1.5)} ${f2(y - 0.4)}Q${f2(x - 0.4)} ${f2(y + 3.6)} ${f2(x + 1.2)} ${f2(y + 3.8)}Q${f2(x + 0.5)} ${f2(y + 1.6)} ${f2(x + 1.5)} ${f2(y - 0.4)}Z`;
});

// The crest: a gold medallion on the back's peak, scrolls either side.
const CREST = { x: 0, y: -72.5 };
const CREST_OUT = ellipse(CREST.x, CREST.y, 8.6, 10.4);
const CREST_IN = ellipse(CREST.x, CREST.y, 6, 7.8);
const CREST_SCROLL = curl(7, -67.5, 0.55, 15, -5.2, 4.6, 0.6);

// The seat under the picture: a velvet cushion on a gold rail.
const CUSHION = "M-60 36C-60 33 60 33 60 36L60 48L-60 48Z";
const RAIL = "M-64 46H64V54C42 54 22 57 0 60C-22 57 -42 54 -64 54Z";

const backPicture = lazy(() =>
  record((c) => {
    // the back's shade on the velvet behind it
    c.save();
    c.translate(1.5, 2.5);
    c.drawPath(toPath(BACK_OUT)!, brush("#05060C", 0.4, 2));
    c.restore();
    engrave(c, {
      d: BACK_OUT,
      fill: gold(-60, -80, 60, 40),
      ink: INK,
      width: 1.3,
      shine: "M-58 -57.5C-50 -63.5 -40 -66 -26 -67",
    });
    engrave(c, {
      d: BACK_IN,
      fill: linear(0, -74, 0, -40, IVORY),
      ink: INK,
      width: 0.9,
      vein: `${BACK_RAYS}${BACK_GROOVE}${mirror(BACK_GROOVE)}`,
      veinColor: "#C2A060",
      veinWidth: 0.55,
    });
  }),
);

const thronePicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: CUSHION,
      fill: linear(0, 33, 0, 48, [VELVET[0], VELVET[1], VELVET[2]]),
      ink: INK_VELVET,
      width: 1,
      shine: "M-56 36.2C-30 34.6 30 34.6 56 36.2",
      shineWidth: 0.7,
      shadow: 0.3,
    });
    engrave(c, {
      d: RAIL,
      fill: gold(-60, 44, 60, 62),
      ink: INK,
      width: 1.2,
      vein: "M-62 49.5H62M-60 52C-40 52 -20 55 0 57.6C20 55 40 52 60 52",
      veinColor: VEIN,
      shine: "M-62 47.6H-30",
      shadow: 0.35,
    });
    for (const sx of [1, -1]) {
      c.save();
      c.scale(sx, 1);
      // the arm and its leg, behind the post
      engrave(c, {
        d: LEG.outline,
        fill: gold(70, 10, 90, 60),
        ink: INK,
        width: 1.1,
        vein: LEG.grooves,
        veinColor: VEIN,
        shine: LEG.shine,
        shadow: 0.3,
      });
      engrave(c, {
        d: ARM.outline,
        fill: gold(60, -10, 95, 20),
        ink: INK,
        width: 1.1,
        vein: ARM.vein,
        veinColor: VEIN,
        veinWidth: 0.7,
        shadow: 0.3,
      });
      // the post
      engrave(c, {
        d: POST,
        fill: linear(60, 0, 72, 0, [
          "#9A6B1E",
          "#FFF2B8",
          "#E2B04A",
          "#9A6B1E",
        ]),
        ink: INK,
        width: 1.1,
        vein: "M63.5 -54V44M66 -54V44M68.5 -54V44",
        veinColor: VEIN,
        veinWidth: 0.6,
        shine: "M61.3 -54V40",
        shadow: 0.35,
      });
      engrave(c, {
        d: CAPITAL,
        fill: gold(57, -64, 75, -58),
        ink: INK,
        width: 1,
        vein: "M58.5 -61H73.5",
        veinColor: VEIN,
        shine: "M59 -62.6H67",
      });
      engrave(c, {
        d: NECK,
        fill: gold(62, -68, 70, -63),
        ink: INK,
        width: 0.9,
      });
      // the flame finial
      c.save();
      c.translate(FINIAL_BALL.x, FINIAL_BALL.y - 3.6);
      engrave(c, {
        d: LEAF(10, 3.6),
        fill: linear(0, 0, 0, -10, ["#9A6B1E", "#E2B04A", "#FFF2B8"]),
        ink: INK,
        width: 0.9,
        vein: "M0 -1.5L0 -8",
        veinColor: VEIN,
      });
      c.restore();
      stud(
        c,
        FINIAL_BALL.x,
        FINIAL_BALL.y,
        FINIAL_BALL.r,
        ["#FFF6D0", "#E2B04A", "#7A5212"],
        INK,
        1,
      );
      // the paw
      c.save();
      c.translate(PAW.x, PAW.y);
      for (const claw of CLAWS)
        engrave(c, {
          d: claw,
          fill: linear(0, 5, 0, 11, IVORY),
          ink: INK,
          width: 0.6,
        });
      engrave(c, {
        d: PAW_FOOT,
        fill: radial(-3, -6, 16, ["#FFF6D0", "#E2B04A", "#8A5A16"]),
        ink: INK,
        width: 1.1,
        vein: PAW_LINES,
        veinColor: VEIN,
        veinWidth: 0.7,
        shine: "M-8.6 -1C-8.8 -5.4 -5.2 -8.8 -1 -9.2",
        shadow: 0.35,
      });
      c.restore();
      // the crest's scroll
      engrave(c, {
        d: CREST_SCROLL.outline,
        fill: gold(0, -80, 20, -60),
        ink: INK,
        width: 0.9,
        vein: CREST_SCROLL.vein,
        veinColor: VEIN,
        shadow: 0.3,
      });
      c.restore();
    }
    // the crest: the medallion, velvet inside it
    engrave(c, {
      d: CREST_OUT,
      fill: gold(-9, -83, 9, -62),
      ink: INK,
      width: 1.1,
      vein: ellipse(CREST.x, CREST.y, 7.3, 9.1),
      veinColor: VEIN,
      shine: "M-7.4 -75.5C-7 -79.5 -4.6 -81.9 -1.4 -82.5",
      shadow: 0.35,
    });
    engrave(c, {
      d: CREST_IN,
      fill: radial(-1.5, -75.5, 9, [VELVET[0], VELVET[1], VELVET[2]]),
      ink: INK,
      width: 0.8,
    });
  }),
);
const THRONE_GOLD =
  RAIL +
  POST +
  mirror(POST) +
  CAPITAL +
  mirror(CAPITAL) +
  ARM.outline +
  mirror(ARM.outline) +
  LEG.outline +
  mirror(LEG.outline) +
  CREST_OUT;

// The ring over the picture's edge: a gold lip, a velvet channel set with
// little gold stars, a cabled gold rim.
const TR_IN = 48.8;
const TR_LIP = 52.2;
const TR_CH = 57;
const TR_OUT = 61.6;
const THRONE_RING = band(TR_OUT, TR_IN);
const RING_STARS = Array.from({ length: 16 }, (_, k) =>
  polar(((k + 0.5) / 16) * TAU, (TR_LIP + TR_CH) / 2),
);

const throneRingPicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: THRONE_RING,
      evenOdd: true,
      fill: gold(),
      ink: INK,
      width: 1.3,
      shine: arc(TR_OUT - 1, -165, -110),
    });
    // the velvet channel
    const ch = toPath(band(TR_CH, TR_LIP), true);
    if (ch) {
      c.drawPath(
        ch,
        brush(
          radial(
            0,
            0,
            TR_CH,
            [VELVET[2], VELVET[0], VELVET[1], VELVET[2]],
            [TR_LIP / TR_CH, (TR_LIP + 1.6) / TR_CH, (TR_LIP + 3.4) / TR_CH, 1],
          ),
        ),
      );
      c.save();
      c.clipPath(ch, ClipOp.Intersect, true);
      c.drawPath(
        toPath(circle((TR_LIP + TR_CH) / 2 - 0.6))!,
        pen(1.4, VELVET[0], 0.55),
      );
      c.restore();
      c.drawPath(ch, pen(0.9, INK));
    }
    for (const s of RING_STARS)
      c.drawPath(toPath(star(1.7, 0.7, 5, s.x, s.y))!, brush("#F6D274"));
    // the cable on the outer rim
    let cable = "";
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * TAU;
      const p0 = polar(a, TR_CH + 0.6);
      const p1 = polar(a + 2.6 * DEG, TR_CH + 2.3);
      const p2 = polar(a + 4.6 * DEG, TR_OUT - 0.6);
      cable += `M${pt(p0)}Q${pt(p1)} ${pt(p2)}`;
    }
    const rim = toPath(band(TR_OUT, TR_CH), true);
    if (rim) {
      c.save();
      c.clipPath(rim, ClipOp.Intersect, true);
      c.drawPath(toPath(cable)!, pen(0.65, VEIN, 0.9));
      c.restore();
    }
    // pearls at the quarters, a gold clasp at the foot
    for (const a of [0, 180]) {
      const p = polar(a * DEG, (TR_LIP + TR_CH) / 2);
      stud(c, p.x, p.y, 3.4, GOLD.slice(0, 3), INK, 0.8);
      stud(c, p.x, p.y, 2.1, ["#FFFFFF", "#F6F0FA", "#B8AEC6"], INK, 0.4);
    }
    engrave(c, {
      d: "M0 51.5C4 52 8 55 8 58C8 61 4 64 0 66C-4 64 -8 61 -8 58C-8 55 -4 52 0 51.5Z",
      fill: gold(-8, 50, 8, 66),
      ink: INK,
      width: 1,
      vein: "M0 54V63M-5 58H5",
      veinColor: VEIN,
      shine: "M-6.4 57C-6 55 -4 53.4 -1.6 53",
      shadow: 0.35,
    });
  }),
);

// The crown of stars over the crest, turning in perspective.
const CROWN_C = { x: 0, y: -88 };
const CROWN_RX = 24;
const CROWN_RY = 3.8;
const CROWN_STARS = 9;
const CROWN_STAR = star(4, 1.7);

const THRONE_EVERY = 8;
const THRONE_AT = 3;
const THRONE_LEN = 3.2;
/** The light pouring from the canopy, widening down over the seat. */
const SHAFT = "M-13 -76L13 -76L70 74L-70 74Z";
/** The beam in front: from under the valance, widening down. */
const BEAM = "M-18 -66L18 -66L72 70L-72 70Z";

/** A soft shape (gradient or colour, blurred), for baking. */
function soft(d: string, fill: SkShader | string, blur: number) {
  return (c: SkCanvas) => {
    const path = toPath(d);
    if (path) c.drawPath(path, brush(fill, 1, blur));
  };
}

const throneBackParts = lazy(() => {
  const curtains = curtainPicture();
  // each curtain on its own, to stir about its own hinge
  const curtain = (x: number) =>
    bake(
      (c) => {
        c.clipRect(Skia.XYWHRect(x, -100, 100, 200), ClipOp.Intersect, true);
        c.drawPicture(curtains);
      },
      x < 0 ? -96 : 0,
      -92,
      96,
      170,
    );
  const screen = Skia.Paint();
  screen.setBlendMode(BlendMode.Screen);
  const joints = VAL_JOINTS.slice(1, -1).map((j, k) => ({
    x: j.x,
    y: j.y,
    phase: k * 0.8,
    scale: 0.62,
  }));
  return {
    plain: Skia.Paint(),
    screen,
    halo: halo(94, "#FFE6A0"),
    curtainR: curtain(0),
    curtainL: curtain(-100),
    shaft: bake(
      soft(
        SHAFT,
        linear(0, -76, 0, 74, ["#FFF8DCFF", "#FFEFB8AA", "#FFE6A000"]),
        6,
      ),
      -92,
      -96,
      184,
      192,
      2,
    ),
    // the throne back, the valance over it, then the throne
    throne: bake(
      (c) => {
        c.drawPicture(backPicture());
        c.drawPicture(valancePicture());
        c.drawPicture(thronePicture());
      },
      -96,
      -94,
      192,
      172,
    ),
    tassel: bake((c) => c.drawPicture(tasselPicture()), -7, -2, 14, 25),
    tassels: [
      ...joints,
      { x: TIE[0] + 4, y: TIE[1] + 2, phase: 0.4, scale: 1 },
      { x: -TIE[0] - 4, y: TIE[1] + 2, phase: 2.1, scale: 1 },
    ],
    gold: toPath(THRONE_GOLD),
    cornice: toPath(CORNICE_BAND),
    sweepColors: SWEEP_COLORS(),
  };
});

function ThroneBack({ t }: { t: Clock }) {
  const P = useMemo(() => own(throneBackParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const pour = moment(T, THRONE_EVERY, THRONE_LEN, THRONE_AT);
    const { recorder, c } = begin();
    c.drawCircle(
      0,
      0,
      94,
      faded(P.halo, 0.3 + 0.08 * Math.sin(T * 1.2) + pour * 0.35),
    );
    // the curtains stir, hinged at the valance
    c.save();
    c.translate(60, -82);
    c.rotate(Math.sin(T * 0.9) * 0.012 * DEG_W, 0, 0);
    c.translate(-60, 82);
    put(c, P.curtainR, P.plain);
    c.restore();
    c.save();
    c.translate(-60, -82);
    c.rotate(Math.sin(T * 0.9 + 1.3) * 0.012 * DEG_W, 0, 0);
    c.translate(60, 82);
    put(c, P.curtainL, P.plain);
    c.restore();
    put(c, P.shaft, faded(P.screen, 0.05 + pour * 0.85));
    put(c, P.throne, P.plain);
    sweep(c, P.gold, P.sweepColors, T, 4.8, 0);
    sweep(c, P.cornice, P.sweepColors, T, 4.8, 0.4);
    // the tassels swing
    for (const s of P.tassels) {
      c.save();
      c.translate(s.x, s.y);
      c.rotate(Math.sin(T * 1.7 + s.phase) * 0.12 * DEG_W, 0, 0);
      c.scale(s.scale, s.scale);
      put(c, P.tassel, P.plain);
      c.restore();
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

const throneFrontParts = lazy(() => {
  const screen = Skia.Paint();
  screen.setBlendMode(BlendMode.Screen);
  // the light on the ring's gold
  const band = pen(TR_OUT - TR_IN, "#FFFFFF");
  band.setShader(linear(0, -62, 0, 40, ["#FFF8DCAA", "#FFF0C000"]));
  band.setBlendMode(BlendMode.Screen);
  // the crown's stars: inked with sharp points
  const starInk = Skia.Paint();
  starInk.setAntiAlias(true);
  starInk.setStyle(PaintStyle.Stroke);
  starInk.setStrokeWidth(0.8);
  starInk.setColor(Skia.Color(INK));
  return {
    plain: Skia.Paint(),
    screen,
    white: fill("#FFFFFF"),
    ring: bake(
      (c) => {
        // the ring's shade on the picture's edge
        const shade = pen(2.2, "#000000", 0.35);
        shade.setMaskFilter(
          Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.4, true),
        );
        c.drawCircle(0.6, 1, TR_IN, shade);
        c.drawPicture(throneRingPicture());
      },
      -66,
      -66,
      132,
      136,
    ),
    ringPath: toPath(THRONE_RING, true),
    sweepColors: SWEEP_COLORS(),
    face: Skia.RRectXY(Skia.XYWHRect(-47, -47, 94, 94), 47, 47),
    beam: bake(
      soft(
        BEAM,
        linear(0, -66, 0, 70, ["#FFF8DCAA", "#FFF0C044", "#FFE6A000"]),
        4,
      ),
      -88,
      -82,
      176,
      168,
      2,
    ),
    band,
    glowEllipse: bake(
      soft(ellipse(0, -66, 36, 6), "#FFF4C8", 5),
      -54,
      -90,
      108,
      48,
      2,
    ),
    dust: Array.from({ length: 12 }, (_, k) => {
      const size = 0.8 + rnd(k + 41) * 0.7;
      return {
        k,
        x0: (k % 2 ? 1 : -1) * (49 + rnd(k + 21) * 13),
        start: rnd(k + 31) * 0.4,
        size,
        glow: fill("#FFE6A0", size * 1.4, true),
      };
    }),
    dustCore: fill("#FFFBE8", 0, true),
    rubyGlow: fill("#FF3A5A", 5),
    // the ruby, and the circlet the stars ride on
    still: record((c) => {
      gem(c, CREST.x, CREST.y, 7.4, 9.6, RUBY);
      c.drawPath(
        toPath(ellipse(CROWN_C.x, CROWN_C.y, CROWN_RX, CROWN_RY))!,
        pen(0.9, "#F6D274", 0.55),
      );
    }),
    star: toPath(CROWN_STAR)!,
    starGlow: fill("#FFE9A0", 3),
    starFill: brush(linear(-3, -3, 3, 3, ["#FFFBE0", "#F0C450", "#B07A1E"])),
    starInk,
    glints: [
      glint(CREST.x - 1, CREST.y - 2, 5.5, 0.4, 1),
      glint(-66, -76, 4.5, 1.6, 1.1),
      glint(66, -76, 4, 3.4, 0.95),
      glint(-79, 58, 4, 2.5, 1.05),
      glint(0, 58, 3.5, 4.6, 0.9),
    ],
  };
});

function ThroneFront({ t }: { t: Clock }) {
  const P = useMemo(() => own(throneFrontParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const pour = moment(T, THRONE_EVERY, THRONE_LEN, THRONE_AT);
    const { recorder, c } = begin();
    put(c, P.ring, P.plain);
    sweep(c, P.ringPath, P.sweepColors, T, 4.8, 0.2);
    // the light pouring from the canopy over the throne, round the
    // face, and the gold dust falling in it
    const lit = pour * 0.9;
    if (lit > 0) {
      c.save();
      c.clipRRect(P.face, ClipOp.Difference, true);
      put(c, P.beam, faded(P.screen, lit));
      c.drawCircle(0, 0, (TR_IN + TR_OUT) / 2, faded(P.band, lit));
      put(c, P.glowEllipse, faded(P.screen, lit));
      const p =
        (((T - THRONE_AT) % THRONE_EVERY) + THRONE_EVERY) % THRONE_EVERY;
      for (const d of P.dust) {
        const u = (p / THRONE_LEN + d.start) % 1;
        const x = d.x0 + Math.sin(u * 7 + d.k) * 2.5;
        const y = -58 + u * 118;
        c.drawCircle(x, y, d.size * 2.4, faded(d.glow, lit * 0.6));
        c.drawCircle(x, y, d.size, faded(P.dustCore, lit));
      }
      c.restore();
    }
    // the crest's ruby
    c.drawCircle(
      CREST.x,
      CREST.y,
      8,
      faded(P.rubyGlow, 0.4 + 0.3 * Math.sin(T * 1.6) + pour * 0.3),
    );
    c.drawPicture(P.still);
    // the crown of stars turning over the crest
    for (let k = 0; k < CROWN_STARS; k++) {
      const a = (k / CROWN_STARS) * TAU + T * 0.32;
      const depth = (Math.sin(a) + 1) / 2;
      const s = (0.55 + 0.45 * depth) * (1 + pour * 0.8);
      const op =
        (0.5 + 0.5 * depth) * (0.85 + 0.15 * Math.sin(T * 3.1 + k * 1.7));
      c.save();
      c.translate(
        CROWN_C.x + Math.cos(a) * CROWN_RX,
        CROWN_C.y + Math.sin(a) * CROWN_RY,
      );
      c.rotate(Math.cos(a) * 0.3 * DEG_W, 0, 0);
      c.scale(s, s);
      c.drawCircle(0, 0, 6, faded(P.starGlow, op * (0.45 + pour * 0.55)));
      c.drawPath(P.star, faded(P.starFill, op));
      c.drawPath(P.star, faded(P.starInk, op));
      c.restore();
    }
    drawGlints(c, P.glints, P.white, T);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

// ══ Archangel ════════════════════════════════════════════════════════

interface Row {
  n: number;
  from: number;
  to: number;
  len: (f: number) => number;
  w: number;
  kind: "ivory" | "cream" | "gold";
}
interface WingSpec {
  /** The shoulder, hidden behind the ring; the wing turns about it. */
  root: { x: number; y: number };
  /** The arm, the wing's leading edge, that the feathers grow along. */
  arm: { x: number; y: number };
  rows: Row[];
  /** Which way the right wing turns to open (+ clockwise). */
  open: 1 | -1;
}

/** A wing's three rows: long ivory flight feathers, cream ones over
 *  them, gold coverts over their roots. Feather k of n grows at k/(n-1)
 *  along the arm, pointing from `from` (at the shoulder) to `to`. */
const rows = (
  n: number,
  from: number,
  to: number,
  len: (f: number) => number,
  w: number,
): Row[] => [
  { n, from, to, len, w, kind: "ivory" },
  {
    n,
    from: from - 4,
    to: to - 4,
    len: (f) => len(f) * 0.7,
    w: w * 0.96,
    kind: "cream",
  },
  {
    n: n - 1,
    from: from - 8,
    to: to - 8,
    len: (f) => len(f) * 0.38 + 1,
    w: w * 0.9,
    kind: "gold",
  },
];

const WINGS: WingSpec[] = [
  // the upper pair, raised either side of the halo
  {
    root: { x: 28, y: -46 },
    arm: { x: 20, y: -26 },
    open: 1,
    rows: rows(10, 34, -22, (f) => 22 + 8 * f, 5.4),
  },
  // the middle pair, spread wide
  {
    root: { x: 50, y: -12 },
    arm: { x: 16, y: -13 },
    open: -1,
    rows: rows(10, 62, 8, (f) => 20 + 6 * f, 5.2),
  },
  // the lower pair, folded below
  {
    root: { x: 36, y: 38 },
    arm: { x: 20, y: 22 },
    open: -1,
    rows: rows(9, 132, 78, (f) => 20 + 6 * f, 5.2),
  },
];

/** One row of one wing, recorded about the wing's shoulder; the coverts
 *  carry the gold arm over their roots. */
function recordRow(wing: WingSpec, row: Row, arm: boolean): SkPicture {
  return record((c) => {
    // the outer feathers first: those nearer the body lie over them
    for (let k = row.n - 1; k >= 0; k--) {
      const f = row.n === 1 ? 0 : k / (row.n - 1);
      const dir = row.from + (row.to - row.from) * f;
      feather(
        c,
        wing.arm.x * f,
        wing.arm.y * f,
        dir,
        row.len(f),
        row.w,
        row.kind,
      );
    }
    if (!arm) return;
    const m = ((row.from + row.to) / 2) * DEG;
    const lead = { x: -Math.cos(m) * 1.6, y: -Math.sin(m) * 1.6 };
    const bone = ribbon(
      [
        [lead.x * 0.5, lead.y * 0.5],
        [wing.arm.x * 0.5 + lead.x, wing.arm.y * 0.5 + lead.y],
        [wing.arm.x * 1.06 + lead.x * 0.6, wing.arm.y * 1.06 + lead.y * 0.6],
      ],
      [4.8, 3.6, 1.6],
    );
    engrave(c, {
      d: bone.outline,
      fill: gold(-10, -10, 20, 20),
      ink: INK,
      width: 0.9,
      vein: bone.grooves,
      veinColor: VEIN,
      veinWidth: 0.55,
      shine: bone.shine,
      shineWidth: 0.7,
      shadow: 0.35,
    });
  });
}
/** A row's extent about the shoulder, room left for shades and ink. */
function rowBounds(wing: WingSpec, row: Row, arm: boolean) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let k = 0; k < row.n; k++) {
    const f = row.n === 1 ? 0 : k / (row.n - 1);
    const dir = (row.from + (row.to - row.from) * f) * DEG;
    const base = { x: wing.arm.x * f, y: wing.arm.y * f };
    const tip = polar(dir, row.len(f) + row.w * 0.3);
    xs.push(base.x, base.x + tip.x);
    ys.push(base.y, base.y + tip.y);
  }
  let m = row.w * 1.2 + 5;
  if (arm) {
    xs.push(0, wing.arm.x * 1.06);
    ys.push(0, wing.arm.y * 1.06);
    m = Math.max(m, 8);
  }
  const x0 = Math.min(...xs) - m;
  const y0 = Math.min(...ys) - m;
  return [x0, y0, Math.max(...xs) + m - x0, Math.max(...ys) + m - y0] as const;
}
/** How far each row turns as the wing opens: the long feathers most. */
const ROW_REACH = [1, 0.7, 0.45];

const ANGEL_EVERY = 9;
const ANGEL_AT = 4;
const ANGEL_LEN = 3.2;

/** Soft clouds behind (the right half): between the wings and under
 *  the ring, gaps between for the rays. Each a few puffs. */
const CLOUD_BANKS = [
  { x: 76, y: 26, s: 7.5 },
  { x: 66, y: 40, s: 6 },
  { x: 74, y: -46, s: 6.5 },
  { x: 84, y: -34, s: 5 },
  { x: 10, y: 80, s: 8 },
  { x: 26, y: 84, s: 6 },
];
const CLOUD_PUFFS = CLOUD_BANKS.flatMap((b, k) =>
  [
    [0, 0, 1],
    [-0.9, 0.35, 0.72],
    [0.95, 0.3, 0.78],
    [0.3, -0.55, 0.7],
    [-0.4, -0.4, 0.55],
  ].map(([dx, dy, ds], j) => ({
    x: b.x + dx * b.s * (0.9 + 0.2 * rnd(k * 7 + j)),
    y: b.y + dy * b.s,
    s: b.s * ds,
  })),
);

const cloudPicture = lazy(() =>
  record((c) => {
    for (const sx of [1, -1]) {
      c.save();
      c.scale(sx, 1);
      // a lilac shade under, the white body lit from above, a warm top
      for (const p of CLOUD_PUFFS)
        c.drawCircle(p.x + 0.8, p.y + 2, p.s, brush("#9C94C8", 0.55, 1.6));
      for (const p of CLOUD_PUFFS)
        c.drawCircle(
          p.x,
          p.y,
          p.s,
          brush(
            radial(p.x - p.s * 0.3, p.y - p.s * 0.5, p.s * 1.8, [
              "#FFFFFF",
              "#F4F0FC",
              "#C8C0E2",
            ]),
            0.92,
            0.8,
          ),
        );
      for (const p of CLOUD_PUFFS)
        c.drawCircle(
          p.x - p.s * 0.2,
          p.y - p.s * 0.4,
          p.s * 0.45,
          brush("#FFF8E2", 0.7, 1.2),
        );
      c.restore();
    }
  }),
);

/** Long and short beams fanning from behind the halo and the ring. */
const BEAMS = Array.from({ length: 24 }, (_, k) => {
  const a = ((k * 360) / 24 + 7.5) * DEG;
  const long = k % 2 === 0;
  const w = long ? 3.4 : 2.2;
  const across = { x: -Math.sin(a) * w, y: Math.cos(a) * w };
  const base = polar(a, 58);
  const tip = polar(a, long ? 94 : 82);
  return `M${f2(base.x + across.x)} ${f2(base.y + across.y)}L${pt(tip)}L${f2(base.x - across.x)} ${f2(base.y - across.y)}Z`;
}).join("");

const angelBackParts = lazy(() => {
  const beams = brush(
    radial(0, 0, 94, ["#FFFFFF", "#FFF4C8", "#FFE08A00"], [0.6, 0.8, 1]),
  );
  beams.setBlendMode(BlendMode.Screen);
  // each row of each wing, baked about its shoulder
  const rowImages = WINGS.map((w) =>
    w.rows.map((r, k) => {
      const arm = k === w.rows.length - 1;
      const pic = recordRow(w, r, arm);
      const [x, y, width, height] = rowBounds(w, r, arm);
      return bake((c) => c.drawPicture(pic), x, y, width, height);
    }),
  );
  // back to front: the lower pair, the upper, then the great middle pair
  const wings = [2, 0, 1].flatMap((i) =>
    ([-1, 1] as const).flatMap((side) =>
      rowImages[i].map((image, r) => ({
        i,
        side,
        image,
        root: WINGS[i].root,
        open: WINGS[i].open,
        reach: ROW_REACH[r],
      })),
    ),
  );
  return {
    plain: Skia.Paint(),
    halo: halo(94, "#FFF1C8"),
    rays: Skia.RuntimeEffect.Make(RAYS),
    // the rays shine only on this ring: no work for the rest
    raysRing: toPath(band(92.5, 49.5), true),
    beamsPath: toPath(BEAMS),
    beams,
    clouds: bake((c) => c.drawPicture(cloudPicture()), -96, -64, 192, 160),
    wings,
  };
});

function AngelBack({ t }: { t: Clock }) {
  const P = useMemo(() => own(angelBackParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const burst = moment(T, ANGEL_EVERY, ANGEL_LEN, ANGEL_AT);
    const { recorder, c } = begin();
    c.drawCircle(
      0,
      0,
      94,
      faded(P.halo, 0.42 + 0.12 * Math.sin(T * 1.1) + burst * 0.3),
    );
    if (P.rays && P.raysRing) {
      const rays = Skia.Paint();
      rays.setAntiAlias(true);
      rays.setShader(P.rays.makeShader([T, 0]));
      c.drawPath(P.raysRing, rays);
    }
    if (P.beamsPath) {
      c.save();
      c.rotate(T * 0.05 * DEG_W, 0, 0);
      c.drawPath(
        P.beamsPath,
        faded(P.beams, 0.45 + 0.2 * Math.sin(T * 0.7) + burst * 0.35),
      );
      c.restore();
    }
    c.save();
    c.rotate(Math.sin(T * 0.25) * 0.04 * DEG_W, 0, 0);
    put(c, P.clouds, P.plain);
    c.restore();
    // a slow wave passes down the pairs, upper to lower; every nine
    // seconds all sweep open together
    const grow = 1 + burst * 0.07;
    for (const w of P.wings) {
      const wave = Math.sin(T * 0.85 - w.i * 1.05 + (w.side < 0 ? 0.25 : 0));
      const turn = w.reach * (w.open * wave * 0.09 - burst * 0.3);
      c.save();
      c.scale(w.side, 1);
      c.translate(w.root.x, w.root.y);
      c.rotate(turn * DEG_W, 0, 0);
      c.scale(grow, grow);
      put(c, w.image, P.plain);
      c.restore();
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

// The ring: a gold band, a wreath of small ivory feathers laid round it
// leaning one way, their tips tucked under a beaded gold rim.
const AR_IN = 49.6;
const AR_OUT = 61.4;
const AR_RIM = 57.6;
const ANGEL_RING = band(AR_OUT, AR_IN);

const angelRingPicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: ANGEL_RING,
      evenOdd: true,
      fill: gold(),
      ink: INK,
      width: 1.2,
    });
    const n = 40;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 360;
      const root = polar(a * DEG, 50.2);
      // leaning round the ring, clockwise
      feather(
        c,
        root.x,
        root.y,
        a + 52,
        11,
        3.6,
        k % 2 ? "cream" : "ivory",
        0.6,
      );
    }
    engrave(c, {
      d: band(AR_OUT, AR_RIM),
      evenOdd: true,
      fill: gold(),
      ink: INK,
      width: 1.1,
      shine: arc(AR_OUT - 1, -166, -112),
      shadow: 0.4,
    });
    for (let k = 0; k < 48; k++) {
      const p = polar((k / 48) * TAU, (AR_OUT + AR_RIM) / 2);
      stud(c, p.x, p.y, 1.15, ["#FFF6D0", "#E2B04A", "#7A5212"], INK, 0.35);
    }
    // the diamond's setting at the top: four gold petals and a collet
    for (const a of [0, 90, 180, 270]) {
      c.save();
      c.translate(0, -60);
      c.rotate(a, 0, 0);
      engrave(c, {
        d: LEAF(9.5, 3.6),
        fill: gold(-4, -10, 4, 0),
        ink: INK,
        width: 0.8,
        vein: "M0 -1.2L0 -7.5",
        veinColor: VEIN,
        shadow: 0.3,
      });
      c.restore();
    }
    stud(c, 0, -60, 6.2, ["#FFF6D0", "#E2B04A", "#7A5212"], INK, 1);
    // a pearl at the foot, where the lower wings meet
    stud(c, 0, 60, 3.6, GOLD.slice(0, 3), INK, 0.8);
    stud(c, 0, 60, 2.3, ["#FFFFFF", "#F6F0FA", "#B8AEC6"], INK, 0.4);
  }),
);

// The halo: an engraved gold ring floating over the head, blazing.
const HALO_Y = -80;
const HALO_RING = ellipse(0, 0, 23, 6.8) + ellipse(0, 0, 17, 3.4);
const haloPicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: HALO_RING,
      evenOdd: true,
      fill: linear(-22, -7, 22, 7, GOLD),
      ink: INK,
      width: 1,
      vein: ellipse(0, 0, 20, 5.1),
      veinColor: VEIN,
      shine: "M-19.8 -2.4Q-13 -6.4 -2 -6.6",
    });
  }),
);
/** Flames of light round the halo: long and short, in two sets. */
const blaze = (long: boolean) =>
  Array.from({ length: 16 }, (_, k) => {
    const a = ((k + (long ? 0 : 0.5)) / 16) * TAU;
    const L = long ? 10 : 6;
    const b0 = { x: Math.cos(a - 0.1) * 22.5, y: Math.sin(a - 0.1) * 6.5 };
    const b1 = { x: Math.cos(a + 0.1) * 22.5, y: Math.sin(a + 0.1) * 6.5 };
    const tip = { x: Math.cos(a) * (23 + L), y: Math.sin(a) * (6.8 + L * 0.6) };
    return `M${pt(b0)}Q${pt({ x: (b0.x + tip.x) / 2 + 0.6, y: (b0.y + tip.y) / 2 })} ${pt(tip)}Q${pt({ x: (b1.x + tip.x) / 2 - 0.6, y: (b1.y + tip.y) / 2 })} ${pt(b1)}Z`;
  }).join("");
const BLAZE_LONG = blaze(true);
const BLAZE_SHORT = blaze(false);

/** The ring of light flung out as the wings open: a 6-wide band blurred
 *  by 4, as a radial gradient (the band's blurred profile, sampled every
 *  unit out to where it fades to nothing). */
const PULSE_REACH = 16;
const pulseStops = () => {
  const erf = (x: number) => {
    // Abramowitz and Stegun 7.1.26
    const s = Math.sign(x);
    const a = Math.abs(x);
    const k = 1 / (1 + 0.3275911 * a);
    const y =
      1 -
      ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k -
        0.284496736) *
        k +
        0.254829592) *
        k *
        Math.exp(-a * a);
    return s * y;
  };
  const cdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
  const ds: number[] = [];
  const colors: Float32Array[] = [];
  for (let d = -PULSE_REACH; d <= PULSE_REACH; d++) {
    const col = Skia.Color("#FFF4C8");
    col[3] = cdf((d + 3) / 4) - cdf((d - 3) / 4);
    ds.push(d);
    colors.push(col);
  }
  return { ds, colors };
};

const angelFrontParts = lazy(() => {
  const plain = Skia.Paint();
  const blaze = (r: number, colors: string[]) =>
    brush(radial(0, 0, r, colors));
  return {
    plain,
    glow: Skia.Paint(),
    white: fill("#FFFFFF"),
    ring: bake(
      (c) => {
        // the ring's shade on the picture's edge
        const shade = pen(2.2, "#000000", 0.3);
        shade.setMaskFilter(
          Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.4, true),
        );
        c.drawCircle(0.6, 1, AR_IN, shade);
        c.drawPicture(angelRingPicture());
      },
      -64,
      -72,
      128,
      138,
    ),
    ringPath: toPath(ANGEL_RING, true),
    sweepColors: SWEEP_COLORS(),
    diamondGlow: fill("#CFEAFF", 5),
    diamond: record((c) => gem(c, 0, -60, 8, 8, DIAMOND)),
    // the halo: its glow, flames of light, the engraved ring
    haloGlow: bake(
      (c) => {
        const glow = pen(10, "#FFE48A");
        glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 6, true));
        c.drawPath(toPath(ellipse(0, 0, 24, 7.6))!, glow);
      },
      -50,
      -34,
      100,
      68,
      2,
    ),
    blazeLong: toPath(BLAZE_LONG)!,
    blazeLongPaint: blaze(34, ["#FFFFFF", "#FFE89A", "#F2B03ACC"]),
    blazeShort: toPath(BLAZE_SHORT)!,
    blazeShortPaint: blaze(30, ["#FFFFFF", "#FFF2C0", "#FFD06ACC"]),
    haloRing: bake((c) => c.drawPicture(haloPicture()), -26, -10, 52, 20),
    haloPath: toPath(HALO_RING, true),
    pulse: pulseStops(),
    motes: Array.from({ length: 22 }, (_, k) => {
      const size = 1.5 + rnd(k + 8) * 1.1;
      return {
        a: (k / 22) * TAU + rnd(k + 5) * 0.25,
        reach: 26 + rnd(k + 2) * 12,
        size,
        glow: fill("#FFE9A0", size * 1.5, true),
      };
    }),
    moteCore: fill("#FFFBEA", 0, true),
    // sparks rising from the top of the ring (as Sparks in kit)
    sparks: Array.from({ length: 6 }, (_, k) => {
      const i = k + 91 * 100;
      const life = 1.3 + rnd(i) * 1.2;
      return {
        i,
        life,
        offset: rnd(i + 3) * life,
        start: polar(-Math.PI + Math.PI * rnd(i + 7), 64),
      };
    }),
    sparkGlow: fill("#FFF0C0", 1.3 * 1.4, true),
    sparkCore: fill("#FFF4D6", 0, true),
    glints: [
      glint(-1, -61, 6, 0.3, 1),
      glint(-12, -83, 4.5, 1.9, 1.1),
      glint(0, 60, 3.5, 3.7, 0.95),
      glint(-84, -30, 4, 2.8, 1.05),
    ],
  };
});

function AngelFront({ t }: { t: Clock }) {
  const P = useMemo(() => own(angelFrontParts()), []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const burst = moment(T, ANGEL_EVERY, ANGEL_LEN, ANGEL_AT);
    const { recorder, c } = begin();
    put(c, P.ring, P.plain);
    sweep(c, P.ringPath, P.sweepColors, T, 4.6, 0);
    // the diamond
    c.drawCircle(
      0,
      -60,
      8,
      faded(P.diamondGlow, 0.5 + 0.35 * Math.sin(T * 2) + burst * 0.3),
    );
    c.drawPicture(P.diamond);
    // the blazing halo, bobbing
    c.save();
    c.translate(0, HALO_Y + Math.sin(T * 1.2) * 1.4);
    const glow = 0.6 + 0.25 * Math.sin(T * 1.7) + burst * 0.4;
    put(c, P.haloGlow, faded(P.glow, glow));
    c.save();
    const long = 1 + 0.07 * Math.sin(T * 3.3) + burst * 0.16;
    c.scale(long, long);
    c.drawPath(P.blazeLong, faded(P.blazeLongPaint, glow));
    c.restore();
    c.save();
    const short = 1 + 0.08 * Math.sin(T * 3.3 + 2.2) + burst * 0.22;
    c.scale(short, short);
    c.drawPath(P.blazeShort, faded(P.blazeShortPaint, glow));
    c.restore();
    put(c, P.haloRing, P.plain);
    sweep(c, P.haloPath, P.sweepColors, T, 4.6, 2.2);
    c.restore();
    // a ring of light and motes flung out as the wings open
    const since =
      (((T - ANGEL_AT) % ANGEL_EVERY) + ANGEL_EVERY) % ANGEL_EVERY;
    const u = since / 1.6;
    const pulse = u > 1 ? 0 : Math.min(1, u * 6) * (1 - u) * 0.9;
    if (pulse > 0) {
      const R = 60 + Math.min(u, 1) * 32;
      const out = R + PULSE_REACH;
      const ring = Skia.Paint();
      ring.setAntiAlias(true);
      ring.setStyle(PaintStyle.Stroke);
      ring.setStrokeWidth(PULSE_REACH * 2);
      ring.setBlendMode(BlendMode.Screen);
      ring.setShader(
        Skia.Shader.MakeRadialGradient(
          Skia.Point(0, 0),
          out,
          P.pulse.colors,
          P.pulse.ds.map((d) => (R + d) / out),
          TileMode.Clamp,
        ),
      );
      ring.setAlphaf(Math.min(1, pulse));
      c.drawCircle(0, 0, R, ring);
    }
    if (since <= 2.2) {
      const m = since / 2.2;
      const op = Math.min(1, m * 8) * (1 - m);
      if (op > 0) {
        const ease = 1 - (1 - m) * (1 - m);
        for (const mote of P.motes) {
          const r = 60 + mote.reach * ease;
          const x = Math.cos(mote.a) * r;
          const y = Math.sin(mote.a) * r - m * 6;
          c.drawCircle(x, y, mote.size * 2.6, faded(mote.glow, op * 0.5));
          c.drawCircle(x, y, mote.size, faded(P.moteCore, op));
        }
      }
    }
    for (const s of P.sparks) {
      const p = ((T + s.offset) % s.life) / s.life;
      const op = Math.sin(p * Math.PI);
      if (op <= 0) continue;
      const x = s.start.x + Math.sin(p * 6 + s.i) * 4;
      const y = s.start.y - p * 20;
      c.drawCircle(x, y, 1.3 * 2.4, faded(P.sparkGlow, op * 0.35));
      c.drawCircle(x, y, 1.3, faded(P.sparkCore, op));
    }
    drawGlints(c, P.glints, P.white, T);
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

export const HEAVENS_ART: Record<string, ArtBorderDrawing> = {
  "celestial-throne": { back: ThroneBack, front: ThroneFront },
  archangel: { back: AngelBack, front: AngelFront },
};

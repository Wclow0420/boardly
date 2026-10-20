// Lunar New Year and Cherry Blossom Shrine: the festival legendaries.
//   Lunar New Year — a red-lacquer ring between two gold rims, a running
//     cloud scroll (祥云) inlaid in gold all round it. On top, a scalloped
//     gold medallion with 福 written upright in gold on crimson enamel;
//     gold cloud scrolls run out from it to the shoulders, and from each
//     curl hangs a red-and-gold lantern with a silk tassel, lit from
//     within and swaying. Dark plum boughs (梅花) hug the ring's lower
//     half, red plum in flower and in bud, a string of firecrackers
//     hanging from each; a red lucky knot (盘长结) hangs at the foot. Gold
//     cash coins tumble down the sides and behind the picture, and now
//     and then a cracker pops. Every 8s the strings go off from the
//     bottom up and a shower of coins falls.
//   Cherry Blossom Shrine — the top tier of Sakura: a vermilion torii
//     frames the picture (lacquered pillars on black feet, the tie beam,
//     the black-capped upswept lintel over the top, a black-and-gold
//     plaque bearing a sakura crest), cherry boughs in flower over its
//     corners. A rose-gold ring with sakura inlays sits on the picture's
//     edge. Below, a pond in a stone kerb where three koi (kohaku, showa
//     and yamabuki) circle, between two stone lanterns (tōrō) glowing
//     warm. Petals swirl round all the time; every 9s a gust whirls a
//     storm of them over the gate and the lanterns flare.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  BlurStyle,
  Circle,
  ClipOp,
  FillType,
  FilterMode,
  Group,
  LinearGradient,
  PaintStyle,
  Path,
  PathOp,
  Picture,
  RadialGradient,
  Rect,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { LEAF, curl, ribbon, type Pt } from "@/components/engraved/shapes";
import {
  Flicker,
  Glint,
  Halo,
  Sparks,
  TAU,
  arcPath,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const DEG = Math.PI / 180;

const f = (n: number) => n.toFixed(2);
const circle = (r: number, cx = 0, cy = 0) =>
  `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z`;
/** A band between two radii, wound so it has a hole however it's
 *  filled (the Sweep clips to it). */
const band = (outer: number, inner: number) =>
  `${circle(outer)}M${inner} 0A${inner} ${inner} 0 1 0 ${-inner} 0A${inner} ${inner} 0 1 0 ${inner} 0Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
/** A point at `d` degrees, radius `r`. */
const at = (d: number, r: number): Pt => [
  Math.cos(d * DEG) * r,
  Math.sin(d * DEG) * r,
];
const line = (pts: Pt[]) =>
  `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}`;
/** A closed wavy circle: radius r, rising and falling `amp`, `waves`
 *  times round. */
const wavy = (r: number, amp: number, waves: number, phase = 0) =>
  `${line(
    Array.from({ length: 241 }, (_, k) => {
      const a = (k / 240) * TAU;
      const rr = r + amp * Math.sin(a * waves + phase);
      return [Math.cos(a) * rr, Math.sin(a) * rr];
    }),
  )}Z`;

// ── drawing straight onto a canvas, for the recorded pictures ─────────

const colorsOf = (cs: string[]) => cs.map((c) => Skia.Color(c));
const linear = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cs: string[],
  pos?: number[],
) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    colorsOf(cs),
    pos ?? null,
    TileMode.Clamp,
  );
const radial = (x: number, y: number, r: number, cs: string[], pos?: number[]) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    colorsOf(cs),
    pos ?? null,
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

/** Strokes `lines` and keeps only what lies inside `within`, as one
 *  shape: the same as stroking them clipped to it, without a clip to
 *  replay every frame. */
function cutIn(lines: SkPath, width: number, within: SkPath) {
  const stroked = lines.copy().stroke({
    width,
    cap: StrokeCap.Round,
    join: StrokeJoin.Round,
    precision: 4,
  });
  return stroked ? Skia.Path.MakeFromOp(stroked, within, PathOp.Intersect) : null;
}

/** Fills a piece, cuts its veins and shine in, inks it round. `cut`
 *  trims the veins and shine to the piece ahead of time instead of
 *  clipping (for pieces drawn afresh every frame). */
function engrave(c: SkCanvas, p: Piece, cut = false) {
  const path = Skia.Path.MakeFromSVGString(p.d);
  if (!path) return;
  if (p.evenOdd) path.setFillType(FillType.EvenOdd);
  c.drawPath(path, brush(p.fill));
  if (cut) {
    const vein = p.vein ? Skia.Path.MakeFromSVGString(p.vein) : null;
    const veinCut = vein ? cutIn(vein, p.veinWidth ?? 0.5, path) : null;
    if (veinCut)
      c.drawPath(veinCut, brush(p.veinColor ?? p.ink, p.veinAlpha ?? 0.75));
    const shine = p.shine ? Skia.Path.MakeFromSVGString(p.shine) : null;
    const shineCut = shine ? cutIn(shine, p.shineWidth ?? 0.8, path) : null;
    if (shineCut) c.drawPath(shineCut, brush("#FFFFFF", p.shineAlpha ?? 0.7));
  } else if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? Skia.Path.MakeFromSVGString(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.5, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? Skia.Path.MakeFromSVGString(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(p.shineWidth ?? 0.8, "#FFFFFF", p.shineAlpha ?? 0.7),
      );
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

/** Several shapes inked as one: every outline first, then every fill
 *  over them, so only the outside of the whole is inked. */
function engraveAll(
  c: SkCanvas,
  ds: string[],
  fill: SkShader | string,
  ink: string,
  width: number,
) {
  const paths = ds
    .map((d) => Skia.Path.MakeFromSVGString(d))
    .filter((p) => p !== null);
  const outline = pen(width, ink);
  for (const p of paths) c.drawPath(p, outline);
  const paint = brush(fill);
  for (const p of paths) c.drawPath(p, paint);
}

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  draw(c);
  return recorder.finishRecordingAsPicture();
}

/** An engraved band, the way the live rings were drawn: filled with its
 *  metal, its veins and shine cut in, inked round. */
function metal(
  c: SkCanvas,
  {
    d,
    colors,
    ink,
    vein,
    veinColor,
    veinWidth = 0.8,
    veinAlpha = 0.75,
    shine,
    width = 1.4,
  }: {
    d: string;
    colors: string[];
    ink: string;
    vein?: string;
    veinColor?: string;
    veinWidth?: number;
    veinAlpha?: number;
    shine?: string;
    width?: number;
  },
) {
  const path = Skia.Path.MakeFromSVGString(d);
  if (!path) return;
  path.setFillType(FillType.EvenOdd);
  c.drawPath(path, brush(linear(-60, -70, 60, 70, colors)));
  c.save();
  c.clipPath(path, ClipOp.Intersect, true);
  const stroke = (lines: string, w: number, color: string, alpha: number) => {
    const p = Skia.Path.MakeFromSVGString(lines);
    if (!p) return;
    const paint = pen(w, color, alpha);
    paint.setStrokeJoin(StrokeJoin.Miter);
    c.drawPath(p, paint);
  };
  if (vein) stroke(vein, veinWidth, veinColor ?? ink, veinAlpha);
  if (shine) stroke(shine, 1.2, "#FFFFFF", 0.85);
  c.restore();
  const outline = pen(width, ink);
  outline.setStrokeCap(StrokeCap.Butt);
  c.drawPath(path, outline);
}

/** A recorded picture drawn as one textured rectangle: Skia rasterises
 *  it once at the scale it's shown at and reuses that, so hundreds of
 *  small engraved shapes cost one draw a frame. `x, y, w, h` must hold
 *  everything the picture draws. */
interface Tile {
  paint: SkPaint;
  x: number;
  y: number;
  w: number;
  h: number;
}
function tile(picture: SkPicture, x: number, y: number, w: number, h: number): Tile {
  const paint = Skia.Paint();
  paint.setShader(
    picture.makeShader(
      TileMode.Decal,
      TileMode.Decal,
      FilterMode.Linear,
      Skia.Matrix().translate(x, y),
      Skia.XYWHRect(x, y, w, h),
    ),
  );
  return { paint, x, y, w, h };
}
function TileRect({ tile: p }: { tile: Tile }) {
  return <Rect x={p.x} y={p.y} width={p.w} height={p.h} paint={p.paint} />;
}

/** The light that crosses the metal every few seconds (crowns' Sweep),
 *  painted straight onto the shape rather than clipped to it. */
function Shine({
  t,
  d,
  every,
  phase = 0,
  evenOdd = false,
  opacity = 1,
}: {
  t: Clock;
  d: string;
  every: number;
  phase?: number;
  evenOdd?: boolean;
  opacity?: number;
}) {
  // the band is 24 across, tilted 0.45 rad, from well clear of one side
  // to well clear of the other
  const dx = 12 * Math.cos(0.45);
  const dy = 12 * Math.sin(0.45);
  const start = useDerivedValue(() => {
    const p = ((t.value + phase) % every) / 1.1;
    return vec((p < 1 ? -110 + p * 220 : 260) - dx, -dy);
  });
  const end = useDerivedValue(() => {
    const p = ((t.value + phase) % every) / 1.1;
    return vec((p < 1 ? -110 + p * 220 : 260) + dx, dy);
  });
  return (
    <Path path={d} fillType={evenOdd ? "evenOdd" : "winding"} opacity={opacity}>
      <LinearGradient
        start={start}
        end={end}
        colors={["#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"]}
      />
    </Path>
  );
}

// ═══ Lunar New Year ══════════════════════════════════════════════════

const LACQUER = ["#FF8A8A", "#D01830", "#7A0614", "#E8485A"];
const INK_RED = "#3A0408";

const LNY_RING = band(61, 50.5);
const LNY_FIELD = band(59.2, 52.3);

/** The running cloud scroll (卷云纹) round the ring: a wave that rises
 *  and curls into a spiral at each crest, drawn along the band and bent
 *  round it. */
function cloudBand(rMid: number, units: number, R: number) {
  const L = (TAU * rMid) / units;
  const bend = ([s, v]: Pt): Pt => {
    const a = s / rMid - Math.PI / 2;
    const r = rMid + v;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number) =>
    Array.from({ length: n + 1 }, (_, i): Pt => {
      const u = i / n;
      const m = 1 - u;
      return [
        m * m * m * p0[0] +
          3 * m * m * u * p1[0] +
          3 * m * u * u * p2[0] +
          u * u * u * p3[0],
        m * m * m * p0[1] +
          3 * m * m * u * p1[1] +
          3 * m * u * u * p2[1] +
          u * u * u * p3[1],
      ];
    });
  let d = "";
  for (let k = 0; k < units; k++) {
    const s0 = k * L;
    const C: Pt = [s0 + 0.6 * L, 0.2];
    const pts: Pt[] = bez(
      [s0 - 0.04 * L, -R - 0.35],
      [s0 + 0.28 * L, -R - 0.35],
      [C[0] - 1.9 * R, C[1] + R],
      [C[0], C[1] + R],
      14,
    );
    for (let i = 1; i <= 30; i++) {
      const u = i / 30;
      const ph = Math.PI / 2 - u * 1.6 * TAU;
      const rr = R * (1 - 0.8 * u);
      pts.push([C[0] + Math.cos(ph) * rr, C[1] + Math.sin(ph) * rr]);
    }
    d += line(pts.map(bend));
    // a small curl on the crest's back, like the tail of a cloud
    const tail: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const ph = -Math.PI * 0.15 + u * 1.25 * TAU;
      const rr = R * 0.55 * (1 - 0.7 * u);
      tail.push([s0 + 0.25 * L + Math.cos(ph) * rr, -0.4 + Math.sin(ph) * rr]);
    }
    d += line(tail.map(bend));
  }
  return d;
}
const CLOUDS = cloudBand(55.75, 16, 2.35);

/** The medallion's scalloped frame: twelve round lobes. */
const SCALLOP = `${line(
  Array.from({ length: 241 }, (_, k) => {
    const a = (k / 240) * TAU;
    const rr = 15 - 1.5 * (1 - Math.abs(Math.sin(a * 6)));
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  }),
)}Z`;
const MEDAL_Y = -68;

/** 福, written in the regular script: 礻 on the left (dot, the
 *  turning sweep, the upright and the short dot), 畐 on the right (the
 *  roof stroke, 口, then 田). Each stroke a ribbon pressed heavier where
 *  the brush lands and turns. In a 20-unit box, upright. */
const FU: [Pt[], number[]][] = [
  [[[-6.9, -9.9], [-6.1, -8.7], [-5.1, -7.5]], [0.5, 1.9, 2.1]],
  [
    [[-9.4, -5.5], [-6.6, -5.8], [-3.5, -6.1], [-4.4, -4.0], [-6.8, -1.0], [-9.9, 1.6]],
    [1.3, 1.3, 2.0, 1.9, 1.4, 0.4],
  ],
  [[[-5.7, -2.8], [-5.65, 3], [-5.6, 9.9]], [2.1, 1.9, 1.8]],
  [[[-4.0, -1.4], [-3.0, 0.0], [-2.3, 1.3]], [0.6, 1.8, 1.7]],
  [[[-0.8, -8.3], [4, -8.7], [9.5, -9.0]], [1.5, 1.25, 1.9]],
  [[[0.9, -6.5], [1.0, -2.0]], [1.8, 1.5]],
  [
    [[0.9, -6.6], [4.5, -6.85], [7.7, -7.0], [7.55, -4.4], [7.4, -2.0]],
    [1.3, 1.2, 1.9, 1.6, 1.5],
  ],
  [[[1.1, -2.35], [7.3, -2.45]], [1.15, 1.2]],
  [[[-0.6, -0.1], [-0.45, 5], [-0.35, 9.9]], [1.95, 1.75, 1.65]],
  [
    [[-0.6, -0.3], [4, -0.5], [8.9, -0.7], [8.7, 4.6], [8.5, 9.9]],
    [1.3, 1.2, 2.0, 1.75, 1.65],
  ],
  [[[4.15, 0.3], [4.15, 9.2]], [1.5, 1.4]],
  [[[-0.2, 4.55], [8.5, 4.4]], [1.15, 1.15]],
  [[[-0.2, 9.0], [8.5, 8.95]], [1.4, 1.4]],
];
const FU_STROKES = FU.map(([p, w]) => ribbon(p, w).outline);

/** An auspicious cloud (祥云) at each shoulder, the lantern hanging
 *  under it: a head of round lobes, each with a spiral cut in, a tail
 *  trailing back to tuck under the medallion and a small curl under the
 *  head. The right one. */
const CLOUD_TAIL = ribbon(
  [
    [11, -72],
    [26, -76.5],
    [40, -77.5],
    [52, -75.5],
  ],
  [1.6, 2.6, 3.6, 4.4],
);
const CLOUD_UNDER = curl(53, -70.4, Math.PI + 0.1, 15, -4.4, 2.6, 0.55);
/** [x, y, r, which way its spiral turns] */
const CLOUD_LOBES: [number, number, number, number][] = [
  [63, -70.6, 4.2, 1],
  [56.4, -75, 4.6, -1],
  [68.6, -74.2, 4.8, 1],
  [62.4, -78.6, 5.4, 1],
];
const lobeSpiral = (x: number, y: number, r: number, turn: number) =>
  line(
    Array.from({ length: 25 }, (_, i): Pt => {
      const u = i / 24;
      const a = -Math.PI / 2 - turn * (0.6 + u * 1.5 * TAU) * 1;
      const rr = r * (0.72 - 0.58 * u);
      return [x + Math.cos(a) * rr, y + 0.3 + Math.sin(a) * rr];
    }),
  );
/** Where the lantern hangs from the cloud. */
const HOOK = { x: 65.6, y: -66.6 };

/** The lantern, hanging from its hook at the origin: a cord, a gold
 *  cap, the round red body ribbed in gold, a gold foot, a bead and a
 *  silk tassel. */
const L_CY = 18.6;
const L_RX = 11.2;
const L_RY = 9.8;
const L_BODY = ellipse(0, L_CY, L_RX, L_RY);
const L_RIBS =
  [-0.74, -0.4, 0, 0.4, 0.74]
    .map((k) =>
      line(
        Array.from({ length: 15 }, (_, i): Pt => {
          const dy = -L_RY + (2 * L_RY * i) / 14;
          return [
            k * L_RX * Math.sqrt(Math.max(0, 1 - (dy / L_RY) ** 2)),
            L_CY + dy,
          ];
        }),
      ),
    )
    .join("") + `M-8.3 ${L_CY - 6.6}H8.3M-8.3 ${L_CY + 6.6}H8.3`;
const L_CAP_TOP = "M-5 6.4H5L5.8 9.6H-5.8Z";
const L_CAP_FOOT = "M-5.8 27.6H5.8L5 30.8H-5Z";
const TASSEL_BIND = "M-1.7 33.4H1.7L1.9 35.8H-1.9Z";
const TASSEL =
  "M-1.9 35.8C-2.3 39.6 -3 43.6 -3.6 47.4Q0 48.8 3.6 47.4C3 43.6 2.3 39.6 1.9 35.8Z";
const TASSEL_THREADS =
  "M-0.9 36.6L-1.8 47.4M0 36.6V47.8M0.9 36.6L1.8 47.4M-1.8 36.4L-3 46.8M1.8 36.4L3 46.8";

function recordLantern() {
  return record((c) => {
    // the cord and its ring
    c.drawLine(0, 1.6, 0, 6.6, pen(1.3, INK_RED));
    c.drawLine(0, 1.6, 0, 6.6, pen(0.6, "#E0485A"));
    const ring = Skia.Path.Make();
    ring.addCircle(0, 0.9, 1.4);
    c.drawPath(ring, pen(1.4, INK_GOLD));
    c.drawPath(ring, pen(0.7, "#F0CC72"));
    engrave(c, {
      d: L_BODY,
      fill: radial(-3.6, 13.6, 16, ["#FF9A8A", "#E0283A", "#A80C22", "#5A0410"], [0, 0.35, 0.75, 1]),
      ink: INK_RED,
      width: 1.1,
      vein: L_RIBS,
      veinColor: "#F2C65A",
      veinWidth: 0.55,
      veinAlpha: 0.95,
      shine: `M-8.6 ${L_CY - 4}Q-9.4 ${L_CY} -8.2 ${L_CY + 4}`,
      shineWidth: 0.9,
      shineAlpha: 0.55,
    });
    for (const d of [L_CAP_TOP, L_CAP_FOOT])
      engrave(c, {
        d,
        fill: linear(-6, 0, 6, 0, GOLD),
        ink: INK_GOLD,
        width: 0.8,
        vein: "M-3 0V40M0 0V40M3 0V40",
        veinColor: VEIN_GOLD,
        veinWidth: 0.4,
      });
    const bead = Skia.Path.Make();
    bead.addCircle(0, 32.1, 1.5);
    c.drawPath(bead, brush(radial(-0.5, 31.6, 2.2, GOLD.slice(0, 3))));
    c.drawPath(bead, pen(0.6, INK_GOLD));
  });
}

function recordTassel() {
  return record((c) => {
    engrave(c, {
      d: TASSEL,
      fill: linear(-3, 36, 3, 48, ["#F25A6A", "#C8142C", "#7A0614"]),
      ink: INK_RED,
      width: 0.8,
      vein: TASSEL_THREADS,
      veinColor: "#5A0410",
      veinWidth: 0.4,
    });
    engrave(c, {
      d: TASSEL_BIND,
      fill: linear(-2, 0, 2, 0, GOLD),
      ink: INK_GOLD,
      width: 0.6,
    });
  });
}

let LANTERN: Tile | null = null;
let TASSEL_PIC: Tile | null = null;

/** The burst every 8s: how far into it we are (the clock set forward
 *  so a still border is caught between bursts). */
const BURST = 8;
const burstU = (T: number) => {
  "worklet";
  return (T + 4) % BURST;
};
/** How bright the burst is, 0 to 1. */
const burstGlow = (T: number) => {
  "worklet";
  const u = burstU(T);
  return u < 2.4 ? Math.sin((Math.PI * u) / 2.4) ** 2 : 0;
};

function Lantern({ t, side }: { t: Clock; side: 1 | -1 }) {
  const pictures = useMemo(() => {
    LANTERN ??= tile(recordLantern(), -14, -2, 28, 38);
    TASSEL_PIC ??= tile(recordTassel(), -6, 31, 12, 20);
    return { lantern: LANTERN, tassel: TASSEL_PIC };
  }, []);
  const i = side > 0 ? 0 : 1;
  const sway = useDerivedValue(() => [
    { translateX: HOOK.x * side },
    { translateY: HOOK.y },
    {
      rotate:
        Math.sin(t.value * 1.1 + i * 2.3) * 0.06 +
        Math.sin(t.value * 2.3 + i) * 0.012,
    },
  ]);
  // the tassel trails a little behind the swing
  const trail = useDerivedValue(() => [
    { translateY: 33.4 },
    { rotate: Math.sin(t.value * 1.1 + i * 2.3 - 0.9) * 0.1 },
    { translateY: -33.4 },
  ]);
  const light = useDerivedValue(
    () =>
      0.55 +
      0.15 * Math.sin(t.value * 7.3 + i * 2) * Math.sin(t.value * 2.9 + i) +
      0.3 * burstGlow(t.value),
  );
  const glow = useDerivedValue(() => 0.35 + light.value * 0.45);
  return (
    <Group transform={sway}>
      <Circle cx={0} cy={L_CY} r={17} color="#FF5A2A" opacity={glow}>
        <BlurMask blur={10} style="normal" />
      </Circle>
      <Group transform={trail}>
        <TileRect tile={pictures.tassel} />
      </Group>
      <TileRect tile={pictures.lantern} />
      {/* lit from within: the glow fades out before the body's edge,
          so filling the body with it needs no clip */}
      <Path path={L_BODY} blendMode="screen" opacity={light}>
        <RadialGradient
          c={vec(0, L_CY + 1)}
          r={L_RX}
          colors={["#FFE6A0", "#FF9A3A88", "#FF5A2A00"]}
        />
      </Path>
    </Group>
  );
}

/** The medallion and the cloud scrolls, recorded once. */
function recordMedallion() {
  return record((c) => {
    const half = () => {
      const gold = linear(40, -86, 74, -62, GOLD);
      engrave(c, {
        d: CLOUD_TAIL.outline,
        fill: linear(10, -82, 54, -70, GOLD),
        ink: INK_GOLD,
        width: 1.1,
        vein: CLOUD_TAIL.grooves,
        veinColor: VEIN_GOLD,
        veinWidth: 0.5,
        shine: CLOUD_TAIL.shine,
        shineAlpha: 0.7,
      });
      engrave(c, {
        d: CLOUD_UNDER.outline,
        fill: gold,
        ink: INK_GOLD,
        width: 1,
        vein: CLOUD_UNDER.vein,
        veinColor: VEIN_GOLD,
        veinWidth: 0.55,
      });
      engraveAll(
        c,
        CLOUD_LOBES.map(([x, y, r]) => circle(r, x, y)),
        gold,
        INK_GOLD,
        2.2,
      );
      const spirals = Skia.Path.MakeFromSVGString(
        CLOUD_LOBES.map(([x, y, r, k]) => lobeSpiral(x, y, r, k)).join(""),
      );
      if (spirals) c.drawPath(spirals, pen(0.7, VEIN_GOLD, 0.9));
      const shine = Skia.Path.MakeFromSVGString(
        arcPath(4.4, -165 * DEG, -100 * DEG),
      );
      if (shine) {
        c.save();
        c.translate(62.4, -78.6);
        c.drawPath(shine, pen(0.9, "#FFFFFF", 0.8));
        c.restore();
      }
    };
    half();
    c.save();
    c.scale(-1, 1);
    half();
    c.restore();
    c.save();
    c.translate(0, MEDAL_Y);
    // the medallion's shadow on the ring
    const shadow = Skia.Path.MakeFromSVGString(SCALLOP);
    if (shadow) {
      c.save();
      c.translate(0.8, 1.4);
      c.drawPath(shadow, brush("#2A0408", 0.45));
      c.restore();
    }
    engrave(c, {
      d: SCALLOP,
      fill: linear(-12, -14, 12, 14, GOLD),
      ink: INK_GOLD,
      width: 1.2,
      vein: circle(13.2),
      veinColor: VEIN_GOLD,
      veinWidth: 0.55,
      shine: arcPath(14, -160 * DEG, -110 * DEG),
      shineAlpha: 0.8,
    });
    engrave(c, {
      d: circle(11.8),
      fill: radial(-2.5, -3, 14, ["#F2485A", "#C8102A", "#6A0412"]),
      ink: INK_GOLD,
      width: 0.9,
      shine: arcPath(10.6, -165 * DEG, -120 * DEG),
      shineAlpha: 0.35,
    });
    c.save();
    c.scale(0.82, 0.82);
    engraveAll(c, FU_STROKES, linear(-8, -10, 8, 10, GOLD), INK_GOLD, 1.0);
    c.restore();
    c.restore();
  });
}
let MEDALLION: Tile | null = null;

// ── the plum boughs ──

const PLUM_WOOD = ["#A07A62", "#5E4030", "#2E1C12", "#84624C"];
const INK_PLUM_WOOD = "#0A0503";
const INK_PLUM = "#5A0A1E";

/** The right bough: from under the knot round the ring's lower right
 *  and up the side, gnarled the way plum grows. Mirrored for the left. */
const PLUM_DEGS = [95, 83, 71, 61, 51, 41, 31, 21, 12, 4];
const PLUM_RS = [65.5, 67.6, 66.2, 68.6, 66.8, 69, 68, 70.2, 69, 70.6];
const PLUM_WS = [5.8, 5.3, 4.7, 4.3, 3.8, 3.3, 2.8, 2.3, 1.8, 1.2];
const PLUM_BOUGH = ribbon(
  PLUM_DEGS.map((d, k) => at(d, PLUM_RS[k])),
  PLUM_WS,
);
/** Short angular twigs off it: [from°, r, to°, r]. */
const PLUM_TWIGS = [
  [66, 67, 58, 76.5],
  [79, 67.5, 74, 75],
  [46, 67.6, 46, 74.5],
  [17, 69.5, 18, 77],
  [8, 69.6, 4, 77],
].map(([a0, r0, a1, r1]) => {
  const p0 = at(a0, r0);
  const p1 = at(a1, r1);
  const mid: Pt = [
    (p0[0] + p1[0]) / 2 + (p1[1] - p0[1]) * 0.18,
    (p0[1] + p1[1]) / 2 - (p1[0] - p0[0]) * 0.18,
  ];
  return ribbon([p0, mid, p1], [2.2, 1.6, 1.1]);
});
/** [angle°, radius, size] blossoms. */
const PLUMS: [number, number, number][] = [
  [72, 73.5, 6.4],
  [66, 63.5, 5.8],
  [58, 77, 5.6],
  [50, 65.5, 6.2],
  [42, 61.5, 5],
  [18, 77.5, 5.6],
  [10, 64, 5.8],
  [22, 66.2, 4.6],
  [81, 81.5, 5],
  [4, 77.4, 4.6],
];
/** [angle°, radius, size] round buds. */
const PLUM_BUDS: [number, number, number][] = [
  [76, 76.5, 1.9],
  [63, 62, 1.7],
  [46, 74.6, 1.8],
  [24, 78, 1.8],
  [14, 75, 1.6],
  [0, 70.4, 1.8],
  [32, 72.5, 1.6],
  [86, 72.5, 1.7],
];

/** A plum petal: round, broadest near its tip. */
const plumPetal = (L: number) =>
  `M0 0C${f(L * 0.55)} ${f(-L * 0.12)} ${f(L * 0.64)} ${f(-L * 0.92)} 0 ${f(-L * 1.02)}C${f(-L * 0.64)} ${f(-L * 0.92)} ${f(-L * 0.55)} ${f(-L * 0.12)} 0 0Z`;

function drawPlum(c: SkCanvas, x: number, y: number, L: number, spin: number) {
  c.save();
  c.translate(x, y);
  c.rotate(spin, 0, 0);
  for (let k = 0; k < 5; k++) {
    c.save();
    c.rotate(k * 72, 0, 0);
    engrave(c, {
      d: plumPetal(L),
      fill: radial(0, 0, L, ["#7A0420", "#C8143E", "#E8486C", "#FF9AB0"], [0, 0.32, 0.72, 1]),
      ink: INK_PLUM,
      width: L >= 6 ? 0.6 : 0.5,
      vein: `M0 ${f(-L * 0.25)}L0 ${f(-L * 0.8)}`,
      veinColor: "#B01840",
      veinWidth: 0.3,
      veinAlpha: 0.55,
    });
    c.restore();
  }
  const eye = Skia.Path.Make();
  eye.addCircle(0, 0, L * 0.22);
  c.drawPath(eye, brush(radial(0, 0, L * 0.22, ["#F8D070", "#9A2A10"])));
  // the long stamens plum is known for, gold-tipped
  const n = 11;
  const stem = pen(0.3, "#FBE6B0", 0.95);
  const tips: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.2;
    const r = L * (0.5 + 0.14 * ((k * 5) % 3) * 0.5);
    const tip = polar(a, r);
    const base = polar(a, L * 0.12);
    c.drawLine(base.x, base.y, tip.x, tip.y, stem);
    tips.push([tip.x, tip.y]);
  }
  for (const [tx, ty] of tips) {
    const dot = Skia.Path.Make();
    dot.addCircle(tx, ty, 0.42);
    c.drawPath(dot, brush("#F6C243"));
    c.drawPath(dot, pen(0.2, "#6A4410"));
  }
  c.restore();
}

function drawPlumBud(c: SkCanvas, x: number, y: number, r: number, out: number) {
  c.save();
  c.translate(x, y);
  c.rotate(out + 90, 0, 0);
  // the dark calyx it sits in
  engrave(c, {
    d: `M${f(-r * 0.9)} ${f(r * 0.5)}Q0 ${f(r * 1.5)} ${f(r * 0.9)} ${f(r * 0.5)}Q0 ${f(r * 0.9)} ${f(-r * 0.9)} ${f(r * 0.5)}Z`,
    fill: "#3A1208",
    ink: INK_PLUM_WOOD,
    width: 0.4,
  });
  engrave(c, {
    d: circle(r, 0, -r * 0.2),
    fill: radial(-r * 0.4, -r * 0.7, r * 1.8, ["#FF9AB0", "#D41E48", "#7A0620"]),
    ink: INK_PLUM,
    width: 0.5,
    vein: `M0 ${f(r * 0.7)}Q${f(r * 0.3)} ${f(-r * 0.2)} 0 ${f(-r * 1.1)}`,
    veinColor: "#8A0A2A",
    veinWidth: 0.3,
  });
  c.restore();
}

function drawPlumHalf(c: SkCanvas) {
  const bark = linear(-20, 40, 80, 80, PLUM_WOOD);
  c.save();
  c.translate(1, 1.6);
  for (const d of [PLUM_BOUGH.outline, ...PLUM_TWIGS.map((t) => t.outline)]) {
    const p = Skia.Path.MakeFromSVGString(d);
    if (p) c.drawPath(p, brush("#1A0408", 0.35));
  }
  c.restore();
  for (const twig of PLUM_TWIGS)
    engrave(c, { d: twig.outline, fill: bark, ink: INK_PLUM_WOOD, width: 0.7 });
  engrave(c, {
    d: PLUM_BOUGH.outline,
    fill: bark,
    ink: INK_PLUM_WOOD,
    width: 1,
    vein: PLUM_BOUGH.grooves,
    veinColor: "#0E0806",
    veinWidth: 0.55,
    shine: PLUM_BOUGH.shine,
    shineAlpha: 0.3,
  });
  for (const [d, r, s] of PLUM_BUDS) {
    const [x, y] = at(d, r);
    drawPlumBud(c, x, y, s, d);
  }
  [...PLUMS]
    .map((b, k) => ({ b, k }))
    .sort((p, q) => p.b[2] - q.b[2])
    .forEach(({ b: [d, r, L], k }) => {
      const [x, y] = at(d, r);
      drawPlum(c, x, y, L, rnd(k + 11) * 72);
    });
}

// ── the firecrackers ──

/** A string of crackers braided on a red cord, hanging from the
 *  origin: eight rows, each a cracker leaning out to either side. */
const ROWS = 8;
const ROW = 4.25;
const ROW0 = 4.4;
const LEAN = 32;
const CRACKER = "M0.6 -1.4H7.1Q7.8 -1.4 7.8 0Q7.8 1.4 7.1 1.4H0.6Z";
const CRACKER_BAND = "M3.3 -1.4H4.5V1.4H3.3Z";
const STRING_END = ROW0 + (ROWS - 1) * ROW + 4.6;
/** Where each cracker's mouth is, from the bottom up. */
const SITES = Array.from({ length: ROWS }, (_, j) => {
  const k = ROWS - 1 - j;
  const y = ROW0 + k * ROW;
  const dx = Math.cos(LEAN * DEG) * 7.6;
  const dy = Math.sin(LEAN * DEG) * 7.6;
  return j % 2
    ? { x: -0.5 - dx, y: y + 2.1 + dy }
    : { x: 0.5 + dx, y: y + dy };
});
/** Where the right string hangs from its bough. */
const HANG = { x: 60.2, y: 33.4 };

function drawCracker(c: SkCanvas, x: number, y: number, angle: number) {
  c.save();
  c.translate(x, y);
  c.rotate(angle, 0, 0);
  engrave(c, {
    d: CRACKER,
    fill: linear(0, -1.4, 0, 1.4, ["#FF9A8A", "#D81E30", "#7A0614"]),
    ink: INK_RED,
    width: 0.55,
    shine: "M1.4 -0.55H6.6",
    shineWidth: 0.45,
    shineAlpha: 0.55,
  });
  engrave(c, {
    d: CRACKER_BAND,
    fill: linear(0, -1.25, 0, 1.25, GOLD),
    ink: INK_GOLD,
    width: 0.35,
  });
  // the paper tube's open end
  const end = Skia.Path.Make();
  end.addOval(Skia.XYWHRect(6.95, -0.75, 0.9, 1.5));
  c.drawPath(end, brush("#F2C890"));
  c.restore();
}

function recordString() {
  return record((c) => {
    c.drawLine(0, 0, 0, 3, pen(1.2, INK_RED));
    for (let k = 0; k < ROWS; k++) {
      const y = ROW0 + k * ROW;
      drawCracker(c, -0.5, y + 2.1, 180 - LEAN);
      drawCracker(c, 0.5, y, LEAN);
    }
    // the braid down the middle, red twisted with gold
    c.drawLine(0, 3, 0, STRING_END - 1, pen(2, INK_RED));
    c.drawLine(0, 3, 0, STRING_END - 1, pen(1.1, "#C8142C"));
    for (let y = 4; y < STRING_END - 1.5; y += 1.6)
      c.drawLine(-0.5, y, 0.5, y + 0.8, pen(0.45, "#F2C65A"));
    // the fuse
    const fuse = Skia.Path.MakeFromSVGString(
      `M0 ${STRING_END - 1}Q1.6 ${STRING_END + 1.2} 0.4 ${STRING_END + 3}`,
    );
    if (fuse) c.drawPath(fuse, pen(0.6, "#3A2A20"));
    // the gold knot it hangs by
    const knot = Skia.Path.Make();
    knot.addCircle(0, 2.6, 1.8);
    c.drawPath(knot, brush(radial(-0.6, 2, 2.6, GOLD.slice(0, 3))));
    c.drawPath(knot, pen(0.6, INK_GOLD));
  });
}
let STRING_PIC: Tile | null = null;

/** How long ago cracker j on this side popped. They go off from the
 *  bottom up in the burst, and between bursts one of the lower three
 *  pops now and then. */
const popAge = (T: number, side: number, j: number) => {
  "worklet";
  const u = burstU(T);
  const tb = 0.25 + j * 0.15 + side * 0.08;
  let age = u >= tb ? u - tb : 99;
  if (u > 2.3 && j < 3) {
    const P = 1.9;
    const m = Math.floor(T / P);
    const who = (m * 5 + 2) % 7;
    if (who < 6 && who % 2 === side && Math.floor(who / 2) === j)
      age = Math.min(age, T - m * P);
  }
  return age;
};

const BITS = 7;

/** Translate (x, y), rotate `rot` radians, scale (sx, sy), then
 *  translate (0, dy): as one matrix, so a frame's picture sets each
 *  particle down with one call instead of four. */
const placed = (
  x: number,
  y: number,
  rot: number,
  sx: number,
  sy: number,
  dy = 0,
) => {
  "worklet";
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return [
    cos * sx,
    -sin * sy,
    x - sin * sy * dy,
    sin * sx,
    cos * sy,
    y + cos * sy * dy,
    0,
    0,
    1,
  ];
};

/** A number for an SVG path built on the UI thread (to 0.001). */
const svgNum = (v: number) => {
  "worklet";
  return Math.round(v * 1000) / 1000;
};
/** A circle as SVG path data. */
const svgCircle = (x: number, y: number, r: number) => {
  "worklet";
  const n = svgNum;
  return `M${n(x + r)} ${n(y)}A${n(r)} ${n(r)} 0 1 1 ${n(x - r)} ${n(y)}A${n(r)} ${n(r)} 0 1 1 ${n(x + r)} ${n(y)}Z`;
};

/** The pops along one string: flash, sparks, smoke and paper, all drawn
 *  into one picture each frame (one node, one derived value). */
function Pops({ t, side }: { t: Clock; side: number }) {
  const paints = useMemo(() => {
    const fill = (color: string, alpha = 1, blur = 0) => {
      const paint = brush(color, alpha);
      if (blur > 0)
        paint.setMaskFilter(
          Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true),
        );
      return paint;
    };
    const sparks = Skia.Paint();
    sparks.setAntiAlias(true);
    sparks.setStyle(PaintStyle.Stroke);
    sparks.setStrokeWidth(0.75);
    sparks.setStrokeCap(StrokeCap.Round);
    sparks.setColor(Skia.Color("#FFE08A"));
    return {
      smoke: fill("#B8AAA0", 0.28, 2.4),
      glow: fill("#FF7A2A", 0.8, 4),
      red: fill("#D8202E"),
      gold: fill("#F6C64A"),
      sparks,
      core: fill("#FFFCE8"),
    };
  }, []);
  const picture = useDerivedValue(() => {
    const T = t.value;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(
      Skia.XYWHRect(LIVE_BOUNDS.x, LIVE_BOUNDS.y, LIVE_BOUNDS.w, LIVE_BOUNDS.h),
    );
    const ages: number[] = [];
    let live = false;
    for (let j = 0; j < SITES.length; j++) {
      ages.push(popAge(T, side, j));
      if (ages[j] < 1.3) live = true;
    }
    if (live) {
      // each shape is written out as SVG and made in one call: far
      // cheaper than hundreds of calls into Skia a frame
      const n = svgNum;
      const ring = svgCircle;
      let glowD = "";
      let coreD = "";
      let sparksD = "";
      let smokeD = "";
      let redD = "";
      let goldD = "";
      for (let j = 0; j < SITES.length; j++) {
        const a = ages[j];
        const { x, y } = SITES[j];
        if (a < 0.26) glowD += ring(x, y, 0.5 + 7 * Math.sin((Math.PI * a) / 0.26));
        if (a < 0.16) {
          // a four-pointed flash
          const s = 0.4 + 3.4 * Math.sin((Math.PI * a) / 0.16);
          const w = s * 0.22;
          coreD +=
            `M${n(x)} ${n(y - s)}Q${n(x + w)} ${n(y - w)} ${n(x + s)} ${n(y)}` +
            `Q${n(x + w)} ${n(y + w)} ${n(x)} ${n(y + s)}` +
            `Q${n(x - w)} ${n(y + w)} ${n(x - s)} ${n(y)}` +
            `Q${n(x - w)} ${n(y - w)} ${n(x)} ${n(y - s)}Z`;
        }
        if (a < 0.45) {
          const q = a / 0.45;
          const reach = 3 + 15 * (1 - (1 - q) * (1 - q));
          const len = 3.2 * (1 - q);
          for (let k = 0; k < 8; k++) {
            const ang = (k / 8) * TAU + rnd(j * 13 + k + side * 7) * 0.6;
            const r0 = reach * (0.75 + rnd(j * 5 + k) * 0.35);
            const x0 = x + Math.cos(ang) * r0;
            const y0 = y + Math.sin(ang) * r0;
            sparksD += `M${n(x0)} ${n(y0)}L${n(x0 - Math.cos(ang) * len)} ${n(y0 - Math.sin(ang) * len)}`;
          }
        }
        if (a < 1.2) {
          const r = (1.6 + 5 * a) * (1 - (a / 1.2) ** 3);
          smokeD += ring(x + a * 2, y - a * 9, r);
        }
        if (a < 1.3) {
          for (let b = 0; b < BITS; b++) {
            const seed = j * 31 + b * 7 + side * 3;
            const ang = rnd(seed) * TAU;
            const v = 16 + rnd(seed + 1) * 22;
            const px = x + Math.cos(ang) * v * a + Math.sin(a * 11 + seed) * 1.4 * a;
            const py = y + (Math.sin(ang) * v - 12) * a + 0.5 * 52 * a * a;
            const isGold = b === 0;
            const s = (isGold ? 0.9 : 1.1) * (1 - Math.max(0, (a - 0.95) / 0.35));
            const rot = rnd(seed + 2) * 6 + a * (rnd(seed + 3) - 0.5) * 18;
            const cx = Math.cos(rot) * s;
            const sx = Math.sin(rot) * s;
            // a scrap of paper, longer than it is wide
            const d =
              `M${n(px + cx - sx * 0.55)} ${n(py + sx + cx * 0.55)}` +
              `L${n(px - cx - sx * 0.55)} ${n(py - sx + cx * 0.55)}` +
              `L${n(px - cx + sx * 0.55)} ${n(py - sx - cx * 0.55)}` +
              `L${n(px + cx + sx * 0.55)} ${n(py + sx - cx * 0.55)}Z`;
            if (isGold) goldD += d;
            else redD += d;
          }
        }
      }
      const draw = (d: string, paint: SkPaint) => {
        if (!d) return;
        const path = Skia.Path.MakeFromSVGString(d);
        if (path) c.drawPath(path, paint);
      };
      draw(smokeD, paints.smoke);
      draw(glowD, paints.glow);
      draw(redD, paints.red);
      draw(goldD, paints.gold);
      draw(sparksD, paints.sparks);
      draw(coreD, paints.core);
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

function FirecrackerString({ t, side }: { t: Clock; side: 1 | -1 }) {
  const picture = useMemo(
    () => (STRING_PIC ??= tile(recordString(), -11, -2, 22, 50)),
    [],
  );
  const s = side > 0 ? 0 : 1;
  const sway = useDerivedValue(() => [
    { translateX: HANG.x * side },
    { translateY: HANG.y },
    { scaleX: side },
    { rotate: Math.sin(t.value * 1.3 + s * 1.9) * 0.035 },
  ]);
  return (
    <Group transform={sway}>
      <TileRect tile={picture} />
      <Pops t={t} side={s} />
    </Group>
  );
}

// ── the lucky knot at the foot ──

const KNOT_Y = 69.2;
const KNOT_SQ = 5.7;
/** The knot's woven body (drawn turned 45°), its two ears, the cord. */
const KNOT_BODY = `M${-KNOT_SQ} ${-KNOT_SQ}H${KNOT_SQ}V${KNOT_SQ}H${-KNOT_SQ}Z`;
const KNOT_WEAVE = [-2.85, 0, 2.85]
  .map((v) => `M${v} ${-KNOT_SQ}V${KNOT_SQ}M${-KNOT_SQ} ${v}H${KNOT_SQ}`)
  .join("");
const KNOT_LIGHT = [-2.85, 0, 2.85]
  .map(
    (v) =>
      `M${v - 0.7} ${-KNOT_SQ}V${KNOT_SQ}M${-KNOT_SQ} ${v - 0.7}H${KNOT_SQ}`,
  )
  .join("");
const EAR =
  "M7.4 0C9.4 -3.8 14.2 -3.4 14 0C14.2 3.4 9.4 3.8 7.4 0Z" +
  "M9.4 0C10.6 -1.7 12.6 -1.6 12.5 0C12.6 1.6 10.6 1.7 9.4 0Z";
const KNOT_TASSEL =
  "M-1.8 13.4C-2.2 16.2 -2.9 19.2 -3.4 21.8Q0 23 3.4 21.8C2.9 19.2 2.2 16.2 1.8 13.4Z";

function recordKnot() {
  return record((c) => {
    c.save();
    c.translate(0, KNOT_Y);
    c.drawLine(0, -10, 0, -7, pen(1.8, INK_RED));
    c.drawLine(0, -10, 0, -7, pen(0.9, "#D81E30"));
    const red = linear(-8, -8, 8, 8, ["#FF7A84", "#D01830", "#7A0614"]);
    for (const s of [1, -1]) {
      c.save();
      c.scale(s, 1);
      engrave(c, { d: EAR, fill: red, ink: INK_RED, width: 0.7, evenOdd: true });
      c.restore();
    }
    // the tassel, its gold bead and binding
    engrave(c, {
      d: KNOT_TASSEL,
      fill: linear(-3, 13, 3, 22, ["#F25A6A", "#C8142C", "#7A0614"]),
      ink: INK_RED,
      width: 0.7,
      vein: "M-0.9 14.2L-1.7 21.8M0 14.2V22.4M0.9 14.2L1.7 21.8M-1.8 14L-2.8 21.4M1.8 14L2.8 21.4",
      veinColor: "#5A0410",
      veinWidth: 0.35,
    });
    engrave(c, {
      d: "M-1.6 11.4H1.6L1.8 13.6H-1.8Z",
      fill: linear(-2, 0, 2, 0, GOLD),
      ink: INK_GOLD,
      width: 0.55,
    });
    const bead = Skia.Path.Make();
    bead.addCircle(0, 9.6, 1.8);
    c.drawPath(bead, brush(radial(-0.6, 9, 2.6, GOLD.slice(0, 3))));
    c.drawPath(bead, pen(0.6, INK_GOLD));
    c.save();
    c.rotate(45, 0, 0);
    engrave(c, {
      d: KNOT_BODY,
      fill: red,
      ink: INK_RED,
      width: 0.9,
      vein: KNOT_WEAVE,
      veinColor: "#5A0410",
      veinWidth: 0.6,
      veinAlpha: 0.9,
      shine: KNOT_LIGHT,
      shineWidth: 0.4,
      shineAlpha: 0.45,
    });
    c.restore();
    // a gold bead on the cord above
    const top = Skia.Path.Make();
    top.addCircle(0, -8.4, 1.3);
    c.drawPath(top, brush(radial(-0.4, -8.8, 2, GOLD.slice(0, 3))));
    c.drawPath(top, pen(0.5, INK_GOLD));
    c.restore();
  });
}
let KNOT: Tile | null = null;

/** The plum boughs, the knot, recorded once. */
function recordLunarGarden() {
  const plums = record((c) => {
    drawPlumHalf(c);
    c.save();
    c.scale(-1, 1);
    drawPlumHalf(c);
    c.restore();
  });
  return plums;
}
let LUNAR_GARDEN: Tile | null = null;

/** The ring: red lacquer between gold rims, gold clouds inlaid. */
function recordLunarRing() {
  return record((c) => {
    metal(c, {
      d: LNY_RING,
      colors: GOLD,
      ink: INK_GOLD,
      width: 1.2,
      vein: circle(60.1) + circle(51.4),
      veinColor: VEIN_GOLD,
      veinWidth: 0.45,
    });
    metal(c, {
      d: LNY_FIELD,
      colors: LACQUER,
      ink: INK_GOLD,
      width: 0.7,
      shine: arcPath(58.2, -160 * DEG, -110 * DEG),
    });
    const clouds = Skia.Path.MakeFromSVGString(CLOUDS);
    if (!clouds) return;
    const inlay = (paint: SkPaint) => {
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      c.drawPath(clouds, paint);
    };
    inlay(pen(1.5, INK_RED, 0.8));
    const gold = pen(0.8, GOLD[0]);
    gold.setShader(linear(-60, -60, 60, 60, GOLD));
    inlay(gold);
  });
}
let LUNAR_RING: Tile | null = null;

// ── the coins ──

const COIN_R = 4.4;
const COIN = circle(COIN_R) + "M-1.25 -1.25H1.25V1.25H-1.25Z";

/** Drawn every frame, two dozen times, so kept to the fewest draws: the
 *  veins and shine lie wholly inside the coin, so they need no clip, and
 *  the four relief marks go down as two strokes. */
function recordCoin() {
  return record((c) => {
    const coin = Skia.Path.MakeFromSVGString(COIN);
    const vein = Skia.Path.MakeFromSVGString(circle(3.5) + "M-2 -2H2V2H-2Z");
    const shine = Skia.Path.MakeFromSVGString(
      arcPath(3.9, -170 * DEG, -110 * DEG),
    );
    if (!coin || !vein || !shine) return;
    coin.setFillType(FillType.EvenOdd);
    c.drawPath(coin, brush(linear(-4, -4, 4, 4, GOLD)));
    c.drawPath(vein, pen(0.4, VEIN_GOLD, 0.75));
    c.drawPath(shine, pen(0.55, "#FFFFFF", 0.7));
    c.drawPath(coin, pen(0.6, INK_GOLD));
    // four characters round the hole, as the old cash had: dots of relief
    const down = Skia.Path.Make();
    const up = Skia.Path.Make();
    for (const [x, y] of [
      [0, -2.75],
      [0, 2.75],
      [-2.75, 0],
      [2.75, 0],
    ]) {
      down.moveTo(x - 0.35, y - 0.35).lineTo(x + 0.35, y + 0.35);
      up.moveTo(x - 0.35, y + 0.35).lineTo(x + 0.35, y - 0.35);
    }
    c.drawPath(down, pen(0.5, VEIN_GOLD, 0.9));
    c.drawPath(up, pen(0.5, VEIN_GOLD, 0.9));
  });
}
let COIN_PIC: SkPicture | null = null;

/** The bounds a frame's live picture is recorded in: everything the
 *  border draws, with room to spare. */
const LIVE_BOUNDS = { x: -200, y: -200, w: 400, h: 400 };

/** Coins in flight, every one drawn into a single picture each frame
 *  (one node, one derived value, however many coins):
 *  - drifting: down slowly from y0 to y1, turning over as it goes;
 *  - in the burst's shower: falling from the top, flipping fast. */
function Coins({
  t,
  drift,
  shower,
}: {
  t: Clock;
  drift: { i: number; x0: number; y0: number; y1: number }[];
  shower: { i: number; x0: number }[];
}) {
  const coin = useMemo(() => (COIN_PIC ??= recordCoin()), []);
  const drifting = useMemo(
    () =>
      drift.map(({ i, x0, y0, y1 }) => {
        const life = 6 + rnd(i) * 3;
        return { i, x0, y0, y1, life, offset: rnd(i + 5) * life };
      }),
    [drift],
  );
  const falling = useMemo(
    () =>
      shower.map(({ i, x0 }) => ({
        i,
        x0,
        start: 0.35 + rnd(i + 40) * 1.2,
        v0: 20 + rnd(i + 41) * 25,
        drift: (rnd(i + 42) - 0.5) * 16,
        spin: 2 + rnd(i) * 3,
      })),
    [shower],
  );
  const picture = useDerivedValue(() => {
    const T = t.value;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(
      Skia.XYWHRect(LIVE_BOUNDS.x, LIVE_BOUNDS.y, LIVE_BOUNDS.w, LIVE_BOUNDS.h),
    );
    for (const k of drifting) {
      const p = ((T + k.offset) % k.life) / k.life;
      c.save();
      c.concat(
        placed(
          k.x0 + Math.sin(p * 4 + k.i) * 3,
          k.y0 + (k.y1 - k.y0) * p,
          Math.sin(T * 0.9 + k.i) * 0.6,
          Math.cos(T * 2.1 + k.i * 1.3) * 0.85,
          0.85,
        ),
      );
      c.drawPicture(coin);
      c.restore();
    }
    const u = burstU(T);
    for (const k of falling) {
      const tau = u - k.start;
      const y = -98 + k.v0 * tau + 0.5 * 130 * tau * tau;
      c.save();
      c.concat(
        placed(
          k.x0 + k.drift * tau,
          tau < 0 ? -200 : y,
          tau * k.spin,
          Math.cos(tau * 9 + k.i),
          1,
        ),
      );
      c.drawPicture(coin);
      c.restore();
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

const FRONT_DRIFT = [
  { i: 1, x0: 82, y0: -24, y1: 96 },
  { i: 2, x0: -84, y0: -20, y1: 96 },
  { i: 3, x0: 87, y0: -10, y1: 96 },
  { i: 4, x0: -80, y0: -28, y1: 96 },
];
const BACK_DRIFT = [
  { i: 5, x0: -30, y0: -98, y1: 98 },
  { i: 6, x0: 14, y0: -98, y1: 98 },
  { i: 7, x0: 38, y0: -98, y1: 98 },
];
const BACK_SHOWER = Array.from({ length: 9 }, (_, k) => ({
  i: 20 + k,
  x0: -52 + k * 13 + (rnd(k + 60) - 0.5) * 8,
}));
const FRONT_SHOWER = Array.from({ length: 6 }, (_, k) => ({
  i: 40 + k,
  x0: (k % 2 ? 1 : -1) * (72 + rnd(k + 70) * 14),
}));

function LunarBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.22 + 0.06 * Math.sin(t.value * 1.2) + 0.22 * burstGlow(t.value),
  );
  return (
    <Group>
      <Halo r={86} color="#FF7A3A" opacity={glow} />
      <Coins t={t} drift={BACK_DRIFT} shower={BACK_SHOWER} />
    </Group>
  );
}

function LunarFront({ t }: { t: Clock }) {
  const pictures = useMemo(() => {
    LUNAR_RING ??= tile(recordLunarRing(), -64, -64, 128, 128);
    LUNAR_GARDEN ??= tile(recordLunarGarden(), -94, -18, 188, 112);
    MEDALLION ??= tile(recordMedallion(), -82, -94, 164, 52);
    KNOT ??= tile(recordKnot(), -17, 56, 34, 40);
    return {
      ring: LUNAR_RING,
      garden: LUNAR_GARDEN,
      medallion: MEDALLION,
      knot: KNOT,
    };
  }, []);
  const knotSway = useDerivedValue(() => [
    { translateY: 60 },
    { rotate: Math.sin(t.value * 1.2 + 0.7) * 0.04 },
    { translateY: -60 },
  ]);
  return (
    <Group>
      <TileRect tile={pictures.ring} />
      <Shine t={t} d={LNY_RING} evenOdd every={4.6} />
      <TileRect tile={pictures.garden} />
      <Group transform={knotSway}>
        <TileRect tile={pictures.knot} />
      </Group>
      <FirecrackerString t={t} side={1} />
      <FirecrackerString t={t} side={-1} />
      <TileRect tile={pictures.medallion} />
      <Group transform={[{ translateY: MEDAL_Y }]}>
        <Shine t={t} d={SCALLOP} every={4.6} phase={0.5} />
      </Group>
      <Lantern t={t} side={1} />
      <Lantern t={t} side={-1} />
      <Coins t={t} drift={FRONT_DRIFT} shower={FRONT_SHOWER} />
      <Sparks
        t={t}
        count={6}
        from={-Math.PI * 0.8}
        to={-Math.PI * 0.2}
        r={66}
        rise={20}
        color="#FFD27A"
        size={1.3}
        seed={51}
      />
      <Glint t={t} x={-9} y={MEDAL_Y - 9} size={5} phase={0.4} />
      <Glint t={t} x={0} y={KNOT_Y + 9.6} size={4} phase={2.2} speed={1} />
      <Glint t={t} x={42} y={-41} size={4} phase={3.4} speed={0.9} />
    </Group>
  );
}

// ═══ Cherry Blossom Shrine ═══════════════════════════════════════════

const ROSE = ["#FFF1EC", "#EDB8A6", "#A86A5C", "#F6D2C4"];
const INK_ROSE = "#4A2018";
const SHRINE_RING = band(58, 50.5);
const SHRINE_PATTERN = circle(56.9) + circle(51.6) + wavy(54.25, 1.1, 40);
/** Sakura inlays round the ring. */
const INLAYS = Array.from({ length: 8 }, (_, k) => at(k * 45 + 22.5, 54.25));

const VERMILION = ["#FF9A70", "#E8442A", "#A61E10", "#F0603A"];
const INK_VERM = "#340A04";
const BLACK_LACQUER = ["#8A827C", "#3A3430", "#100E0C", "#5A524C"];
const INK_BLACK = "#000000";
const STONE = ["#F0ECE4", "#BCB6AC", "#726C62", "#D4CEC4"];
const INK_STONE = "#1E1C18";
const VEIN_STONE = "#5A554C";

// ── the torii ──

const sori = (x: number) => (Math.min(Math.abs(x), 90) / 90) ** 3;
const xsAcross = (from: number, to: number, n = 40) =>
  Array.from({ length: n + 1 }, (_, k) => from + ((to - from) * k) / n);
/** The top lintel (kasagi), sweeping up at its ends, cut slantwise. */
const KASAGI_TOP = xsAcross(-90, 90).map((x): Pt => [x, -84.2 - 5.6 * sori(x)]);
const KASAGI = `${line([
  ...KASAGI_TOP,
  ...xsAcross(86.6, -86.6).map((x): Pt => [x, -78.4 - 4.2 * sori(x)]),
])}Z`;
/** Its black cap. */
const KASAGI_CAP = `${line([
  ...KASAGI_TOP,
  ...xsAcross(89.2, -89.2).map((x): Pt => [x, -81.6 - 5.2 * sori(x)]),
])}Z`;
/** The second lintel under it (shimaki). */
const SHIMAKI = `${line([
  ...xsAcross(-84, 84).map((x): Pt => [x, -78.8 - 3.4 * sori(x)]),
  ...xsAcross(84, -84).map((x): Pt => [x, -74.2 - 2.4 * sori(x)]),
])}Z`;
/** The tie beam (nuki), through the pillars. */
const NUKI = "M-86 -67H86L85.2 -61.6H-85.2Z";
/** A pillar, leaning in a little, and its black foot. */
const PILLAR = "M64.4 -75H72L74.6 64H66Z";
const PILLAR_FOOT = "M65.2 61.8H75.4L76.2 71.2H64.4Z";
const PILLAR_BAND = "M65.8 59.4H74.8L75 61.8H65.6Z";
const PILLAR_GRAIN = "M67.4 -72L69.2 60M70.2 -72L72 60";
const PILLAR_SHINE = "M65.6 -70L67.6 58";
/** The plaque between the lintels. */
const PLAQUE = "M-7 -78.2H7V-59.4H-7Z";
const PLAQUE_FIELD = "M-5.4 -76.6H5.4V-61H-5.4Z";
const PLAQUE_Y = -68.8;
/** All the vermilion, for the light to cross. */
const TORII_RED = [NUKI, PILLAR, "M-64.4 -75H-72L-74.6 64H-66Z", SHIMAKI, KASAGI].join("");

/** A sakura petal, base at the origin, pointing up, notched at its tip. */
const petal = (L: number) => {
  const w = L * 0.48;
  return (
    `M0 0C${f(w * 0.5)} ${f(-L * 0.12)} ${f(w)} ${f(-L * 0.5)} ${f(w * 0.74)} ${f(-L * 0.88)}` +
    `Q${f(w * 0.44)} ${f(-L * 1.04)} ${f(w * 0.15)} ${f(-L * 0.98)}L0 ${f(-L * 0.85)}` +
    `L${f(-w * 0.15)} ${f(-L * 0.98)}Q${f(-w * 0.44)} ${f(-L * 1.04)} ${f(-w * 0.74)} ${f(-L * 0.88)}` +
    `C${f(-w)} ${f(-L * 0.5)} ${f(-w * 0.5)} ${f(-L * 0.12)} 0 0Z`
  );
};
const petalVeins = (L: number) => {
  const w = L * 0.48;
  return (
    `M0 ${f(-L * 0.22)}L0 ${f(-L * 0.76)}` +
    `M0 ${f(-L * 0.3)}Q${f(w * 0.3)} ${f(-L * 0.55)} ${f(w * 0.46)} ${f(-L * 0.78)}` +
    `M0 ${f(-L * 0.3)}Q${f(-w * 0.3)} ${f(-L * 0.55)} ${f(-w * 0.46)} ${f(-L * 0.78)}`
  );
};
const PETAL_FRONT = ["#E24A7E", "#F7A2C0", "#FFE4EE", "#FFFFFF"];
const PETAL_BACK = ["#C8306A", "#EE86AA", "#FBC8DA"];
const INK_PETAL = "#7A2448";

/** A five-petal sakura crest, flat, for the plaque and the inlays. */
function drawCrest(c: SkCanvas, x: number, y: number, L: number, fill: SkShader, ink: string) {
  c.save();
  c.translate(x, y);
  const d = Skia.Path.MakeFromSVGString(petal(L));
  if (d) {
    // the outlines first, then the fills over them: one inked flower
    const outline = pen(L > 3 ? 0.6 : 0.45, ink);
    const paint = brush(fill);
    for (const paintIt of [outline, paint])
      for (let k = 0; k < 5; k++) {
        c.save();
        c.rotate(k * 72, 0, 0);
        c.drawPath(d, paintIt);
        c.restore();
      }
  }
  const eye = Skia.Path.Make();
  eye.addCircle(0, 0, L * 0.24);
  c.drawPath(eye, brush(radial(-L * 0.08, -L * 0.08, L * 0.3, GOLD.slice(0, 3))));
  c.drawPath(eye, pen(0.3, INK_GOLD));
  c.restore();
}

function recordTorii() {
  return record((c) => {
    const verm = (x0: number, x1: number) => linear(x0, 0, x1, 0, VERMILION);
    engrave(c, {
      d: NUKI,
      fill: linear(0, -67, 0, -61.6, VERMILION),
      ink: INK_VERM,
      width: 1,
      vein: "M-84 -64.3H84",
      veinColor: "#7A1608",
      veinWidth: 0.4,
      shine: "M-82 -66H-40",
      shineAlpha: 0.5,
    });
    for (const s of [1, -1]) {
      c.save();
      c.scale(s, 1);
      engrave(c, {
        d: PILLAR,
        fill: verm(64, 74),
        ink: INK_VERM,
        width: 1.1,
        vein: PILLAR_GRAIN,
        veinColor: "#8A1A0A",
        veinWidth: 0.4,
        veinAlpha: 0.5,
        shine: PILLAR_SHINE,
        shineAlpha: 0.55,
      });
      engrave(c, {
        d: PILLAR_FOOT,
        fill: linear(64, 0, 76, 0, BLACK_LACQUER),
        ink: INK_BLACK,
        width: 1,
        shine: "M66 63.4L65.6 69.6",
        shineAlpha: 0.35,
      });
      engrave(c, {
        d: PILLAR_BAND,
        fill: linear(65, 0, 75, 0, GOLD),
        ink: INK_GOLD,
        width: 0.6,
      });
      // the wedge through the tie beam, outside the pillar
      engrave(c, {
        d: "M74.6 -67.6H77V-61H74.4Z",
        fill: linear(74, 0, 77, 0, BLACK_LACQUER),
        ink: INK_BLACK,
        width: 0.6,
      });
      c.restore();
    }
    engrave(c, {
      d: SHIMAKI,
      fill: linear(0, -82, 0, -74, VERMILION),
      ink: INK_VERM,
      width: 1,
      shine: line(xsAcross(-80, -20, 12).map((x): Pt => [x, -77.6 - 3.2 * sori(x)])),
      shineAlpha: 0.45,
    });
    engrave(c, {
      d: KASAGI,
      fill: linear(0, -90, 0, -78, VERMILION),
      ink: INK_VERM,
      width: 1.1,
    });
    engrave(c, {
      d: KASAGI_CAP,
      fill: linear(0, -91, 0, -81, BLACK_LACQUER),
      ink: INK_BLACK,
      width: 1.1,
      shine: line(xsAcross(-88, -10, 16).map((x): Pt => [x, -83.4 - 5.5 * sori(x)])),
      shineAlpha: 0.4,
    });
    // the plaque: gold frame, black field, a gold sakura crest
    engrave(c, {
      d: PLAQUE,
      fill: linear(-7, -78, 7, -59, GOLD),
      ink: INK_GOLD,
      width: 0.9,
      shine: "M-6 -77V-66",
      shineAlpha: 0.7,
    });
    engrave(c, {
      d: PLAQUE_FIELD,
      fill: linear(-5, -77, 5, -61, BLACK_LACQUER),
      ink: INK_GOLD,
      width: 0.6,
    });
    drawCrest(c, 0, PLAQUE_Y + 3.2, 3.6, linear(-4, -72, 4, -64, GOLD), INK_GOLD);
  });
}
let TORII: Tile | null = null;

// ── the cherry boughs over the gate's corners ──

const WOOD = ["#9A6A48", "#5A3826", "#2E1C12", "#7A5034"];
const INK_WOOD = "#140A04";
const LEAF_GREEN = ["#D8F0A0", "#7AB84A", "#2E6A1E", "#9ACC5A"];
const INK_LEAF = "#14300A";

interface Bough {
  root: Pt;
  path: Pt[];
  widths: number[];
  blossoms: [number, number, number][];
  buds: [number, number, number, number][];
  leaves: [number, number, number, number, number][];
}

const BOUGHS: Bough[] = [
  {
    root: [-92, -40],
    path: [
      [-93, -38],
      [-88, -56],
      [-81, -71],
      [-69, -81],
      [-55, -86],
    ],
    widths: [5, 4.2, 3.4, 2.4, 1.4],
    blossoms: [
      [-77, -76, 10.5],
      [-64, -83.6, 8],
      [-84.5, -62, 8.2],
      [-70, -68.5, 6.5],
      [-53, -85.6, 6],
      [-87, -48, 6],
      [-84, -86.4, 5.4],
      [-90.5, -39, 6],
    ],
    buds: [
      [-59, -78.5, 5, 60],
      [-90, -72, 5, -150],
      [-76, -61, 4.6, 110],
    ],
    leaves: [
      [-84, -74, 10, 3.8, -130],
      [-61, -87, 8.5, 3.2, -60],
    ],
  },
  {
    root: [92, -50],
    path: [
      [93, -48],
      [89, -64],
      [80, -76],
      [70, -82],
    ],
    widths: [3.8, 3, 2.2, 1.3],
    blossoms: [
      [80, -76, 8.6],
      [86, -63, 6.8],
      [70, -82, 6],
      [85, -84.4, 5.2],
      [90, -47, 5.6],
    ],
    buds: [
      [74, -72, 4.6, 100],
      [90, -73, 4.6, -40],
    ],
    leaves: [[89, -54, 9, 3.4, -20]],
  },
];

function drawBlossom(c: SkCanvas, x: number, y: number, L: number, spin: number) {
  c.save();
  c.translate(x, y);
  c.rotate(spin, 0, 0);
  const ink = L >= 9 ? 0.75 : 0.6;
  if (L >= 7) {
    const Lb = L * 0.9;
    for (let k = 0; k < 5; k++) {
      c.save();
      c.rotate(36 + k * 72, 0, 0);
      engrave(c, {
        d: petal(Lb),
        fill: radial(0, 0, Lb, PETAL_BACK, [0, 0.45, 1]),
        ink: INK_PETAL,
        width: ink * 0.85,
      });
      c.restore();
    }
  }
  for (let k = 0; k < 5; k++) {
    c.save();
    c.rotate(k * 72, 0, 0);
    engrave(c, {
      d: petal(L),
      fill: radial(0, 0, L, PETAL_FRONT, [0, 0.3, 0.68, 1]),
      ink: INK_PETAL,
      width: ink,
      vein: petalVeins(L),
      veinColor: "#D2608C",
      veinWidth: L >= 9 ? 0.4 : 0.32,
      veinAlpha: 0.6,
    });
    c.restore();
  }
  const eye = Skia.Path.Make();
  eye.addCircle(0, 0, L * 0.2);
  c.drawPath(eye, brush(radial(0, 0, L * 0.2, ["#FF9ABA", "#C22A5A"])));
  const n = L >= 8 ? 9 : 6;
  const stem = pen(L >= 9 ? 0.45 : 0.38, "#B23A60");
  const tips: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.3;
    const r = L * (0.4 + (0.1 * ((k * 7) % 3)) / 2);
    const tip = polar(a, r);
    const base = polar(a, L * 0.1);
    c.drawLine(base.x, base.y, tip.x, tip.y, stem);
    tips.push([tip.x, tip.y]);
  }
  const s = L >= 9 ? 0.75 : 0.6;
  for (const [tx, ty] of tips) {
    const dot = Skia.Path.Make();
    dot.addCircle(tx, ty, s);
    c.drawPath(dot, brush(radial(tx - s * 0.3, ty - s * 0.3, s * 1.6, GOLD.slice(0, 3))));
    c.drawPath(dot, pen(0.25, "#6A4410"));
  }
  c.restore();
}

function drawBud(c: SkCanvas, x: number, y: number, len: number, dir: number) {
  c.save();
  c.translate(x, y);
  c.rotate(dir + 90, 0, 0);
  engrave(c, {
    d: LEAF(len, len * 0.42),
    fill: linear(0, 0, 0, -len, ["#D8406E", "#F48AAE", "#FFDCE8"]),
    ink: INK_PETAL,
    width: 0.6,
    vein: `M0 ${f(-len * 0.3)}Q${f(len * 0.14)} ${f(-len * 0.6)} 0 ${f(-len * 0.92)}`,
    veinColor: "#B03060",
    veinWidth: 0.35,
  });
  const s = len * 0.36;
  engrave(c, {
    d: `M${f(-s)} 0.6Q${f(-s * 1.15)} ${f(-len * 0.3)} ${f(-s * 0.3)} ${f(-len * 0.44)}L0 ${f(-len * 0.22)}L${f(s * 0.3)} ${f(-len * 0.44)}Q${f(s * 1.15)} ${f(-len * 0.3)} ${f(s)} 0.6Z`,
    fill: linear(0, 0, 0, -len * 0.44, ["#5A2418", "#A85040"]),
    ink: "#2A0C06",
    width: 0.5,
  });
  c.restore();
}

function drawLeaf(c: SkCanvas, x: number, y: number, len: number, w: number, dir: number) {
  c.save();
  c.translate(x, y);
  c.rotate(dir + 90, 0, 0);
  const veins = [0.3, 0.5, 0.7]
    .map((s) => {
      const y0 = -len * s;
      return `M0 ${f(y0)}L${f(w * 0.55)} ${f(y0 - len * 0.12)}M0 ${f(y0)}L${f(-w * 0.55)} ${f(y0 - len * 0.12)}`;
    })
    .join("");
  engrave(c, {
    d: LEAF(len, w),
    fill: linear(-w, -len, w, 0, LEAF_GREEN),
    ink: INK_LEAF,
    width: 0.75,
    vein: `M0 -0.5L0 ${f(-len * 0.88)}${veins}`,
    veinColor: "#2E5A16",
    veinWidth: 0.4,
  });
  c.restore();
}

function recordBough(b: Bough) {
  return record((c) => {
    const wood = ribbon(b.path, b.widths);
    engrave(c, {
      d: wood.outline,
      fill: linear(-90, -90, 90, -40, WOOD),
      ink: INK_WOOD,
      width: 1,
      vein: wood.grooves,
      veinColor: "#1A0E08",
      veinWidth: 0.5,
      shine: wood.shine,
      shineAlpha: 0.35,
    });
    for (const [x, y, len, w, dir] of b.leaves) drawLeaf(c, x, y, len, w, dir);
    for (const [x, y, len, dir] of b.buds) drawBud(c, x, y, len, dir);
    [...b.blossoms]
      .map((bl, k) => ({ bl, k }))
      .sort((p, q) => p.bl[2] - q.bl[2])
      .forEach(({ bl: [x, y, L], k }) => drawBlossom(c, x, y, L, rnd(k + 7) * 72));
  });
}
let BOUGH_PICS: Tile[] | null = null;

/** The gust every 9s: how strong it is now (0 to 1), and how far it has
 *  carried things so far (one more for each gust). */
const GUST = 9;
const GUST_LEN = 2.8;
const gust = (T: number) => {
  "worklet";
  const u = (T + 4) % GUST;
  return u < GUST_LEN ? Math.sin((Math.PI * u) / GUST_LEN) ** 2 : 0;
};
const gustTravel = (T: number) => {
  "worklet";
  const k = Math.floor((T + 4) / GUST);
  const u = T + 4 - k * GUST;
  const s =
    u < GUST_LEN
      ? u / GUST_LEN - Math.sin((TAU * u) / GUST_LEN) / TAU
      : 1;
  return k + s;
};

function SwayBough({ t, i }: { t: Clock; i: number }) {
  const pictures = useMemo(
    () =>
      (BOUGH_PICS ??= [
        tile(recordBough(BOUGHS[0]), -112, -104, 74, 82),
        tile(recordBough(BOUGHS[1]), 54, -104, 58, 74),
      ]),
    [],
  );
  const [px, py] = BOUGHS[i].root;
  const sway = useDerivedValue(() => [
    { translateX: px },
    { translateY: py },
    {
      rotate:
        (Math.sin(t.value * 0.9 + i * 2) * 0.012 + gust(t.value) * 0.04) *
        (i ? -1 : 1),
    },
    { translateX: -px },
    { translateY: -py },
  ]);
  return (
    <Group transform={sway}>
      <TileRect tile={pictures[i]} />
    </Group>
  );
}

// ── the stone lanterns ──

const TORO_X = 60;
const TORO_Y = 87.5;
const TORO_BASE = "M-7.2 0H7.2L6.4 -3.2H-6.4Z";
const TORO_SHAFT = "M-2.6 -3.2H2.6L2.2 -13H-2.2Z";
const TORO_DECK = "M-6.8 -13H6.8L7.6 -14.6L5.6 -16.4H-5.6L-7.6 -14.6Z";
const TORO_BOX = "M-5 -16.4H5V-23.6H-5Z";
const TORO_WINDOW = "M-2.8 -17.6H2.8V-22.2H-2.8Z";
const TORO_ROOF =
  "M-11.2 -23.8C-8 -24.4 -5.6 -27 -2.2 -30.6H2.2C5.6 -27 8 -24.4 11.2 -23.8L10.6 -22.6H-10.6Z";
const TORO_NECK = "M-1.3 -30.4H1.3V-32H-1.3Z";
const TORO_JEWEL =
  "M0 -37.6C1.8 -35.8 2.5 -34.6 2.3 -33.6C2.1 -32.2 -2.1 -32.2 -2.3 -33.6C-2.5 -34.6 -1.8 -35.8 0 -37.6Z";
/** Where the light is, from the lantern's foot. */
const TORO_LIGHT_Y = -19.9;

function recordToro() {
  return record((c) => {
    const stone = (y0: number, y1: number) => linear(-8, y0, 8, y1, STONE);
    engrave(c, {
      d: TORO_BASE,
      fill: stone(-3, 0),
      ink: INK_STONE,
      width: 0.8,
      vein: "M-5.6 -1.6H5.6",
      veinColor: VEIN_STONE,
      veinWidth: 0.35,
    });
    engrave(c, {
      d: TORO_SHAFT,
      fill: stone(-13, -3),
      ink: INK_STONE,
      width: 0.8,
      vein: "M-2.6 -6.4H2.6M-2.4 -9.8H2.4",
      veinColor: VEIN_STONE,
      veinWidth: 0.4,
      shine: "M-1.6 -4.4L-1.4 -12",
      shineWidth: 0.5,
      shineAlpha: 0.5,
    });
    engrave(c, {
      d: TORO_DECK,
      fill: stone(-16.4, -13),
      ink: INK_STONE,
      width: 0.8,
      vein: "M-7 -14.6H7",
      veinColor: VEIN_STONE,
      veinWidth: 0.35,
    });
    engrave(c, {
      d: TORO_BOX,
      fill: stone(-23.6, -16.4),
      ink: INK_STONE,
      width: 0.8,
    });
    // the window, dark until it is lit
    const win = Skia.Path.MakeFromSVGString(TORO_WINDOW);
    if (win) {
      c.drawPath(win, brush("#3A1A08"));
      c.drawPath(win, pen(0.6, INK_STONE));
    }
    engrave(c, {
      d: TORO_ROOF,
      fill: linear(-10, -31, 10, -22, STONE),
      ink: INK_STONE,
      width: 0.9,
      vein: "M0 -30L0 -24M-5 -26.6L-7.4 -23.6M5 -26.6L7.4 -23.6",
      veinColor: VEIN_STONE,
      veinWidth: 0.4,
      shine: "M-9.6 -23.8C-7 -24.6 -5 -26.6 -2.4 -29.6",
      shineWidth: 0.6,
      shineAlpha: 0.6,
    });
    engrave(c, {
      d: TORO_NECK,
      fill: stone(-32, -30),
      ink: INK_STONE,
      width: 0.6,
    });
    engrave(c, {
      d: TORO_JEWEL,
      fill: linear(-2, -37, 2, -32, STONE),
      ink: INK_STONE,
      width: 0.7,
      shine: "M-1.2 -34.6Q-1 -35.8 0 -36.6",
      shineWidth: 0.5,
    });
  });
}
let TORO: Tile | null = null;

function Toro({ t, side }: { t: Clock; side: 1 | -1 }) {
  const picture = useMemo(() => (TORO ??= tile(recordToro(), -14, -41, 28, 43)), []);
  const i = side > 0 ? 0 : 1;
  const light = useDerivedValue(
    () =>
      0.7 +
      0.18 * Math.sin(t.value * 8.1 + i * 2) * Math.sin(t.value * 3.3 + i) +
      0.3 * gust(t.value),
  );
  const glow = useDerivedValue(() => 0.25 + light.value * 0.4);
  const flare = useDerivedValue(() => [
    { translateX: 0 },
    { translateY: TORO_LIGHT_Y },
    { scale: 1 + 0.5 * gust(t.value) },
  ]);
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(TORO_WINDOW), []);
  return (
    <Group transform={[{ translateX: TORO_X * side }, { translateY: TORO_Y }]}>
      <Group transform={flare}>
        <Circle cx={0} cy={0} r={10} color="#FFB24A" opacity={glow}>
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Group>
      <TileRect tile={picture} />
      {clip ? (
        <Group clip={clip}>
          <Circle cx={0} cy={TORO_LIGHT_Y} r={4} opacity={light}>
            <RadialGradient
              c={vec(0, TORO_LIGHT_Y + 1)}
              r={4}
              colors={["#FFF6D0", "#FFC062", "#E07A20"]}
            />
          </Circle>
          <Flicker t={t} x={0} y={-18.2} size={3.4} phase={i * 1.9} />
        </Group>
      ) : null}
    </Group>
  );
}

// ── the koi pond ──

const POND_X = 0;
const POND_Y = 73.5;
const POND_RIM = ellipse(POND_X, POND_Y, 44, 15.6) + ellipse(POND_X, POND_Y, 39.6, 12.2);
const POND_WATER = ellipse(POND_X, POND_Y, 39.8, 12.4);
/** The joints between the kerb stones. */
const POND_JOINTS = Array.from({ length: 14 }, (_, k) => {
  const a = (k / 14) * TAU + 0.2;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return `M${f(c * 39.6)} ${f(POND_Y + s * 12.2)}L${f(c * 44)} ${f(POND_Y + s * 15.6)}`;
}).join("");
/** Petals floating on the water: [x, y, angle°]. */
const FLOATING: [number, number, number][] = [
  [-22, 70, 30],
  [-8, 82, -50],
  [16, 68, 110],
  [27, 80, 200],
  [3, 74.5, 160],
];

const KOI_BODY =
  "M6.4 0C6.4 -1.9 4.6 -2.7 2 -2.75C-1.2 -2.7 -3.8 -1.7 -5.6 -0.55L-5.6 0.55C-3.8 1.7 -1.2 2.7 2 2.75C4.6 2.7 6.4 1.9 6.4 0Z";
const KOI_TAIL =
  "M-5.2 -0.5C-6.6 -1.1 -8 -2.4 -9.9 -3.4C-9.2 -1.4 -8.7 -0.4 -8.6 0C-8.7 0.4 -9.2 1.4 -9.9 3.4C-8 2.4 -6.6 1.1 -5.2 0.5Z";
const KOI_FINS =
  "M2.6 -2.4C1.6 -3.9 0.2 -4.7 -1.2 -4.7C-0.4 -3.6 0.6 -2.8 1.2 -2.5Z" +
  "M2.6 2.4C1.6 3.9 0.2 4.7 -1.2 4.7C-0.4 3.6 0.6 2.8 1.2 2.5Z";

interface KoiKind {
  body: string[];
  ink: string;
  patches: { d: string; color: string }[];
}
const KOI: KoiKind[] = [
  // kohaku: white with red
  {
    body: ["#FFFFFF", "#F4EEE6", "#D2C8BA"],
    ink: "#4A2A1A",
    patches: [
      { d: ellipse(3.4, -0.4, 2.4, 2.1), color: "#E2401E" },
      { d: ellipse(-1.8, 0.7, 2.6, 1.9), color: "#E2401E" },
    ],
  },
  // showa: black with red and white
  {
    body: ["#4A4440", "#1E1A18", "#0A0808"],
    ink: "#000000",
    patches: [
      { d: ellipse(3.2, 0.5, 2.3, 1.8), color: "#F06A1E" },
      { d: ellipse(-1.2, -1.1, 2.1, 1.3), color: "#F4F0EA" },
      { d: ellipse(-3.8, 0.7, 1.5, 1), color: "#F06A1E" },
    ],
  },
  // yamabuki: gold-orange with a white saddle
  {
    body: ["#FFD08A", "#F27A1A", "#B04A0A"],
    ink: "#5A2006",
    patches: [{ d: ellipse(-1.6, 0, 2, 3), color: "#FFF6EA" }],
  },
];

function recordKoiBody(k: KoiKind) {
  return record((c) => {
    engrave(c, {
      d: KOI_FINS,
      fill: linear(0, -4.7, 0, 4.7, ["#FFFFFFCC", "#F0D8C8AA", "#FFFFFFCC"]),
      ink: k.ink,
      width: 0.45,
      vein: "M1.6 -2.8L-0.6 -4.2M1.6 2.8L-0.6 4.2",
      veinWidth: 0.25,
      veinAlpha: 0.4,
    }, true);
    const body = Skia.Path.MakeFromSVGString(KOI_BODY);
    if (!body) return;
    c.drawPath(body, brush(linear(0, -2.8, 0, 2.8, k.body)));
    // the patches and lines trimmed to the body ahead of time: the koi
    // are drawn every frame, so they keep no clips
    for (const p of k.patches) {
      const patch = Skia.Path.MakeFromSVGString(p.d);
      const inside = patch
        ? Skia.Path.MakeFromOp(patch, body, PathOp.Intersect)
        : null;
      if (inside) c.drawPath(inside, brush(p.color));
    }
    // the light along its back, the line of its spine
    const lineIn = (d: string, w: number, color: string, alpha: number) => {
      const l = Skia.Path.MakeFromSVGString(d);
      const inside = l ? cutIn(l, w, body) : null;
      if (inside) c.drawPath(inside, brush(color, alpha));
    };
    lineIn("M4.6 -1.2L-3.6 -1", 0.6, "#FFFFFF", 0.55);
    lineIn("M5 0L-4.6 0", 0.3, k.ink, 0.35);
    c.drawPath(body, pen(0.5, k.ink));
  });
}

function recordKoiTail(k: KoiKind) {
  return record((c) => {
    engrave(c, {
      d: KOI_TAIL,
      fill: linear(-5, 0, -10, 0, [k.patches[0].color, "#FFFFFFAA"]),
      ink: k.ink,
      width: 0.45,
      vein: "M-6 0L-9.2 -2.4M-6 0L-9.2 2.4M-6 0L-8.6 0",
      veinWidth: 0.25,
      veinAlpha: 0.45,
    }, true);
  });
}
let KOI_PICS: { body: SkPicture; tail: SkPicture }[] | null = null;

const KOI_RX = 27;
const KOI_RY = 6.4;
const KOI_SPEED = 0.42;

function Koi({ t, i }: { t: Clock; i: number }) {
  const pics = useMemo(
    () =>
      (KOI_PICS ??= KOI.map((k) => ({
        body: recordKoiBody(k),
        tail: recordKoiTail(k),
      })))[i],
    [i],
  );
  const transform = useDerivedValue(() => {
    const T = t.value;
    const th = (i * TAU) / 3 + T * KOI_SPEED + Math.sin(T * 0.7 + i) * 0.15;
    const wob = 1 + 0.08 * Math.sin(T * 0.5 + i * 2);
    return [
      { translateX: POND_X + Math.cos(th) * KOI_RX * wob },
      { translateY: POND_Y + 0.4 + Math.sin(th) * KOI_RY * wob },
      // the pond lies flat: squash the fish onto it
      { scaleY: 0.55 },
      { rotate: th + Math.PI / 2 + Math.sin(T * 3 + i) * 0.08 },
      { scale: 0.92 },
    ];
  });
  const wag = useDerivedValue(() => [
    { translateX: -5.2 },
    { rotate: Math.sin(t.value * 6 + i * 2) * 0.32 },
    { translateX: 5.2 },
  ]);
  return (
    <Group transform={transform}>
      <Group transform={wag}>
        <Picture picture={pics.tail} />
      </Group>
      <Picture picture={pics.body} />
    </Group>
  );
}

/** A ring spreading on the water now and then. */
function Ripple({ t, i }: { t: Clock; i: number }) {
  const life = 3.2 + i * 0.9;
  const transform = useDerivedValue(() => {
    const T = t.value + i * 1.7;
    const k = Math.floor(T / life);
    return [
      { translateX: POND_X + (rnd(k * 3 + i) - 0.5) * 50 },
      { translateY: POND_Y + (rnd(k * 3 + i + 1) - 0.5) * 12 },
      { scaleY: 0.38 },
    ];
  });
  const r = useDerivedValue(() => {
    const p = ((t.value + i * 1.7) % life) / life;
    return 0.5 + p * 9;
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + i * 1.7) % life) / life;
    return (1 - p) * 0.7;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={r} style="stroke" strokeWidth={0.7} color="#E8FBFF" />
    </Group>
  );
}

function recordPondRim() {
  return record((c) => {
    for (const [x, y, a] of FLOATING) {
      c.save();
      c.translate(x, y);
      c.scale(1, 0.55);
      c.rotate(a, 0, 0);
      engrave(c, {
        d: petal(5),
        fill: linear(0, 0, 0, -5, ["#F06A98", "#FFC8DA", "#FFFFFF"]),
        ink: INK_PETAL,
        width: 0.5,
      });
      c.restore();
    }
    engrave(c, {
      d: POND_RIM,
      evenOdd: true,
      fill: linear(-44, 60, 44, 90, STONE),
      ink: INK_STONE,
      width: 0.9,
      vein: POND_JOINTS,
      veinColor: VEIN_STONE,
      veinWidth: 0.5,
      shine: `M-41 ${POND_Y - 3}Q-30 ${POND_Y - 14} 0 ${POND_Y - 14.2}`,
      shineWidth: 0.7,
      shineAlpha: 0.6,
    });
  });
}
let POND_RIM_PIC: Tile | null = null;

function Pond({ t }: { t: Clock }) {
  const rim = useMemo(
    () => (POND_RIM_PIC ??= tile(recordPondRim(), -47, 54, 94, 40)),
    [],
  );
  // the water's edge as an oval, which Skia clips to without a mask
  const clip = useMemo(() => {
    const path = Skia.Path.Make();
    path.addOval(Skia.XYWHRect(POND_X - 39.8, POND_Y - 12.4, 79.6, 24.8));
    return path;
  }, []);
  return (
    <Group>
      <Group clip={clip}>
        <Path path={POND_WATER}>
          <RadialGradient
            c={vec(POND_X, POND_Y - 4)}
            r={40}
            colors={["#5AA6B4", "#2A6A80", "#123A4E"]}
          />
        </Path>
        {/* the sky lying on the water */}
        <Path
          path={`M-30 ${POND_Y - 6}Q0 ${POND_Y - 10} 30 ${POND_Y - 6}`}
          style="stroke"
          strokeWidth={1.2}
          strokeCap="round"
          color="#D8F4FF"
          opacity={0.35}
        />
        {[0, 1, 2].map((i) => (
          <Koi key={i} t={t} i={i} />
        ))}
        {[0, 1].map((i) => (
          <Ripple key={i} t={t} i={i} />
        ))}
      </Group>
      <TileRect tile={rim} />
    </Group>
  );
}

// ── the petals ──

const LOOSE_L = 6;
const LOOSE = petal(LOOSE_L);

/** Loose petals, every one drawn into a single picture each frame (one
 *  node, one derived value, however many petals):
 *  - orbiting: circling the gate, in and out, turning over; the gust
 *    whirls them on;
 *  - in the gust: in from the lower right, up over the gate and down the
 *    far side. */
function Petals({
  t,
  orbit,
  gusting = [],
}: {
  t: Clock;
  orbit: { i: number; R: number; swing: number }[];
  gusting?: number[];
}) {
  const shape = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(LOOSE);
    const fill = brush(
      linear(0, 0, 0, -LOOSE_L, ["#F06A98", "#FFC8DA", "#FFFFFF"]),
    );
    const ink = Skia.Paint();
    ink.setAntiAlias(true);
    ink.setStyle(PaintStyle.Stroke);
    ink.setStrokeWidth(0.5);
    ink.setColor(Skia.Color(INK_PETAL));
    return { path, fill, ink };
  }, []);
  const circling = useMemo(
    () =>
      orbit.map(({ i, R, swing }) => ({
        i,
        R,
        swing,
        a0: rnd(i) * TAU,
        w: 0.16 + rnd(i + 1) * 0.12,
        size: 0.8 + rnd(i + 2) * 0.35,
        sway: 0.4 + rnd(i + 3) * 0.3,
        spin: 0.8 + rnd(i + 4),
      })),
    [orbit],
  );
  const blown = useMemo(
    () =>
      gusting.map((i) => ({
        i,
        delay: (i - 60) * 0.055,
        lift: (rnd(i + 80) - 0.5) * 16,
      })),
    [gusting],
  );
  const picture = useDerivedValue(() => {
    const T = t.value;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(
      Skia.XYWHRect(LIVE_BOUNDS.x, LIVE_BOUNDS.y, LIVE_BOUNDS.w, LIVE_BOUNDS.h),
    );
    const { path, fill, ink } = shape;
    if (path) {
      let alphaNow = -1;
      const draw = (
        x: number,
        y: number,
        rot: number,
        sx: number,
        sy: number,
        alpha: number,
      ) => {
        c.save();
        c.concat(placed(x, y, rot, sx, sy, LOOSE_L / 2));
        if (alpha !== alphaNow) {
          fill.setAlphaf(alpha);
          ink.setAlphaf(alpha);
          alphaNow = alpha;
        }
        c.drawPath(path, fill);
        c.drawPath(path, ink);
        c.restore();
      };
      const g = gust(T);
      const travel = gustTravel(T);
      for (const k of circling) {
        const a = k.a0 + k.w * T + 2.4 * travel;
        const r = k.R + k.swing * Math.sin(T * k.sway + k.i * 1.3) + 5 * g;
        draw(
          Math.cos(a) * r,
          Math.sin(a) * r + Math.sin(T * 0.8 + k.i) * 3,
          a + T * k.spin + k.i,
          Math.cos(T * 2.6 + k.i * 1.7) * k.size,
          k.size,
          1,
        );
      }
      const u = (T + 4) % GUST;
      for (const k of blown) {
        const q = (u - k.delay) / 1.9;
        if (!(q > 0 && q < 1)) continue;
        const pp = Math.min(1, Math.max(0, q));
        const a = 0.55 - pp * 4.3 + k.i * 0.03;
        const r = 90 - 16 * Math.sin(pp * Math.PI) + k.lift;
        draw(
          Math.cos(a) * r,
          Math.sin(a) * r,
          a * 2 + k.i,
          Math.cos(u * 7 + k.i) * 1.15,
          1.15,
          Math.sin(q * Math.PI) ** 0.6,
        );
      }
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

const FRONT_ORBIT = Array.from({ length: 20 }, (_, k) => ({
  i: k + 1,
  R: 64 + rnd(k + 90) * 20,
  swing: 6,
}));
const BACK_ORBIT = Array.from({ length: 8 }, (_, k) => ({
  i: k + 40,
  R: 36 + rnd(k + 95) * 40,
  swing: 10,
}));
const GUST_PETALS = Array.from({ length: 22 }, (_, k) => k + 60);

function ShrineBack({ t }: { t: Clock }) {
  const torii = useMemo(
    () => (TORII ??= tile(recordTorii(), -96, -96, 192, 172)),
    [],
  );
  const glow = useDerivedValue(
    () => 0.14 + 0.04 * Math.sin(t.value * 1.1) + 0.08 * gust(t.value),
  );
  return (
    <Group>
      <Halo r={86} color="#FFC8D4" opacity={glow} />
      <Petals t={t} orbit={BACK_ORBIT} />
      <TileRect tile={torii} />
      <Shine t={t} d={TORII_RED} every={5.2} phase={1.2} opacity={0.45} />
      <Pond t={t} />
      <Toro t={t} side={1} />
      <Toro t={t} side={-1} />
      <SwayBough t={t} i={0} />
      <SwayBough t={t} i={1} />
    </Group>
  );
}

/** The rose-gold ring and its sakura inlays, recorded once. */
function recordShrineRing() {
  return record((c) => {
    metal(c, {
      d: SHRINE_RING,
      colors: ROSE,
      ink: INK_ROSE,
      width: 1.2,
      vein: SHRINE_PATTERN,
      veinColor: "#9A5444",
      veinWidth: 0.6,
      shine: arcPath(57, -150 * DEG, -100 * DEG),
    });
    for (const [x, y] of INLAYS)
      drawCrest(
        c,
        x,
        y,
        2.9,
        radial(x, y, 3, ["#C8306A", "#F7A2C0", "#FFE4EE"], [0, 0.5, 1]),
        INK_PETAL,
      );
  });
}
let SHRINE_RING_PIC: Tile | null = null;

function ShrineFront({ t }: { t: Clock }) {
  const ring = useMemo(
    () => (SHRINE_RING_PIC ??= tile(recordShrineRing(), -61, -61, 122, 122)),
    [],
  );
  const shine = at(300, 55.4);
  return (
    <Group>
      <TileRect tile={ring} />
      <Shine t={t} d={SHRINE_RING} evenOdd every={4.6} />
      <Petals t={t} orbit={FRONT_ORBIT} gusting={GUST_PETALS} />
      <Glint t={t} x={shine[0]} y={shine[1]} size={4.5} phase={0.8} />
      <Glint t={t} x={0} y={PLAQUE_Y + 3.2} size={4.5} phase={2.4} speed={1} />
      <Glint t={t} x={INLAYS[3][0]} y={INLAYS[3][1]} size={3.5} phase={4} speed={0.9} />
    </Group>
  );
}

export const FESTIVAL_ART: Record<string, ArtBorderDrawing> = {
  "lunar-new-year": { back: LunarBack, front: LunarFront },
  "cherry-shrine": { back: ShrineBack, front: ShrineFront },
};

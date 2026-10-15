// The earned borders, redrawn as engraved trophies. None can be bought:
// each comes with a game's legendary badge (EARNED_BORDERS on the server).
//   Seal Keeper's (Seal the Manor) — a bronze seal ring, its runes
//     turning slowly in their channel, crowned by candles on sconces that
//     burn all the way round. A silver moon keeps the night watch at the
//     top; at the foot, a crimson wax seal stamped with a key, its black
//     silk ribbons hanging below.
//   Last Winter (Shelter) — an iron ring, frosted cold at the top and lit
//     warm from below by the fire on its hearth logs. Ice shards bristle
//     off its top, icicles hang from its sides and drip as the fire melts
//     them; snow drifts behind.
//   Spymaster's (Double Agent) — a gunmetal dial: a fixed bezel ruled
//     like a gauge with its teal crosshair, and round it a cipher wheel
//     of pigpen letters that turns. A keyhole plate with a blinking ruby
//     is its index; a magnifier lies over the wheel (its glass really
//     magnifies), a stamped, redacted dossier is tucked behind, and a red
//     scan sweeps round.
//   Legend of the Table (Boardly's 25 wins) — a gold ring with a sapphire
//     enamel channel, a full gold laurel wreath, a jewelled crest with the
//     meeple at the top, a crimson trophy bow with a ruby medal at the
//     foot, and gold glory rays turning behind. The most light of all.
// Static detail is recorded once into pictures. See heraldry.tsx and
// solar.tsx for the house style.

import {
  BlurMask,
  BlurStyle,
  Circle,
  ClipOp,
  FillType,
  Group,
  PaintStyle,
  Path,
  PathOp,
  Picture,
  RadialGradient,
  Skia,
  StrokeCap,
  StrokeJoin,
  SweepGradient,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { curl, ribbon, type Pt } from "@/components/engraved/shapes";
import { Fire } from "@/components/iso";
import { MEEPLE_PATH } from "@/components/tabletop/Meeple";
import { Gem, Sweep } from "./crowns";
import {
  Flicker,
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_STEEL = "#1E242C";
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const CRIMSON = ["#FF9AA6", "#C2203A", "#6A0A18", "#E05A6A"];
const INK_CRIMSON = "#3A0408";
const NIGHT = ["#9AB8E8", "#3A5A9A", "#1A2A5A", "#6A8AC8"];
const INK_NIGHT = "#0A1430";
const WOOD = ["#D09A5E", "#8A5A2E", "#5A3618", "#A8743E"];
const INK_WOOD = "#2A1808";
const RUBY: [string, string, string] = ["#FF9AA6", "#D0102E", "#5A0410"];
const SAPPHIRE: [string, string, string] = ["#D8EEFF", "#2E7AE0", "#0A2A6A"];
const EMERALD: [string, string, string] = ["#C8FFD8", "#1E9A54", "#06401E"];
const DEG = Math.PI / 180;

// ── path data ──────────────────────────────────────────────────────────

const f2 = (n: number) => n.toFixed(2);
const circle = (r: number, cx = 0, cy = 0) =>
  `M${f2(cx + r)} ${f2(cy)}A${r} ${r} 0 1 1 ${f2(cx - r)} ${f2(cy)}A${r} ${r} 0 1 1 ${f2(cx + r)} ${f2(cy)}Z`;
/** A ring between two radii (fill it even-odd). */
const annulus = (r0: number, r1: number) => circle(r1) + circle(r0);
/** An arc of radius r from a0 to a1 (degrees) round (cx, cy), as an
 *  open line. */
const arc = (r: number, a0: number, a1: number, cx = 0, cy = 0) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${f2(cx + p.x)} ${f2(cy + p.y)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${f2(cx + q.x)} ${f2(cy + q.y)}`;
};
const poly = (pts: Pt[], close = true) =>
  `M${pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}${close ? "Z" : ""}`;
/** Points turned by `th` (radians) and moved to (x, y). */
const place = (pts: Pt[], x: number, y: number, th: number): Pt[] => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return pts.map(([u, v]): Pt => [x + u * c - v * s, y + u * s + v * c]);
};
const mirror = (pts: Pt[]) => pts.map(([x, y]): Pt => [-x, y]);
const flipX = (d: string) => {
  const p = Skia.Path.MakeFromSVGString(d);
  if (!p) return d;
  p.transform(Skia.Matrix().scale(-1, 1));
  return p.toSVGString();
};
const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  const f = (i: 0 | 1) =>
    u * u * u * a[i] +
    3 * u * u * t * b[i] +
    3 * u * t * t * c[i] +
    t * t * t * d[i];
  return [f(0), f(1)];
};
/** A teardrop leaf along +x from its stalk, as points (LEAF, lying down). */
function leafPts(len: number, w: number): Pt[] {
  const N = 10;
  const top = Array.from({ length: N + 1 }, (_, i) =>
    cubic([0, 0], [len * 0.25, -w], [len * 0.7, -w], [len, 0], i / N),
  );
  const bottom = Array.from({ length: N - 1 }, (_, i) =>
    cubic([len, 0], [len * 0.7, w], [len * 0.25, w], [0, 0], (i + 1) / N),
  );
  return [...top, ...bottom];
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
/** The house light: from the top left. */
const lit = (cs: string[], s = 70) => linear(-s, -s, s, s, cs);

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

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = Skia.Path.MakeFromSVGString(p.d);
  if (!path) return;
  if (p.evenOdd) path.setFillType(FillType.EvenOdd);
  c.drawPath(path, brush(p.fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? Skia.Path.MakeFromSVGString(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? Skia.Path.MakeFromSVGString(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(p.shineWidth ?? 0.9, "#FFFFFF", p.shineAlpha ?? 0.8),
      );
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

function line(c: SkCanvas, d: string, width: number, color: string, alpha = 1) {
  const path = Skia.Path.MakeFromSVGString(d);
  if (path) c.drawPath(path, pen(width, color, alpha));
}

function dot(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  fill: SkShader | string,
  ink?: string,
  inkWidth = 0.5,
) {
  c.drawCircle(x, y, r, brush(fill));
  if (ink) c.drawCircle(x, y, r, pen(inkWidth, ink));
}

/** A domed stud or bead in a metal. */
function stud(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  cs: string[],
  ink: string,
) {
  dot(
    c,
    x,
    y,
    r,
    radial(x - r * 0.4, y - r * 0.45, r * 1.7, cs),
    ink,
    Math.min(0.6, r * 0.4),
  );
}

/** A soft shadow's paint. */
function shadow(color: string, alpha: number, blur: number) {
  const paint = brush(color, alpha);
  paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  return paint;
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

// ══ Seal Keeper's ═════════════════════════════════════════════════════

const BRONZE = ["#FBE2B0", "#C99050", "#6E4219", "#E6B878"];
const INK_BRONZE = "#2A1606";
const VEIN_BRONZE = "#6A3E14";

const SEAL_RING = annulus(49.5, 60);
const RUNE_R = 54.9;

/** The runes cut round the channel, each a stave with a branch or two. */
const RUNES = (() => {
  const branches: Pt[][] = [
    [
      [0, 2.4],
      [1.8, 0.9],
    ],
    [
      [0, 2.4],
      [-1.8, 0.9],
    ],
    [
      [0, 0.7],
      [1.8, -0.8],
    ],
    [
      [0, 0.7],
      [-1.8, -0.8],
    ],
    [
      [0, -0.6],
      [1.8, 0.9],
    ],
    [
      [-1.8, 2.4],
      [0, 0.8],
      [1.8, 2.4],
    ],
    [
      [0, 1.4],
      [1.6, 0],
      [0, -1.4],
    ],
  ];
  let d = "";
  const n = 30;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const cx = Math.cos(a) * RUNE_R;
    const cy = Math.sin(a) * RUNE_R;
    // u along the ring, v outward
    const to = ([u, v]: Pt): Pt => [
      cx - Math.sin(a) * u + Math.cos(a) * v,
      cy + Math.cos(a) * u + Math.sin(a) * v,
    ];
    d += poly([to([0, -2.4]), to([0, 2.4])], false);
    const b0 = Math.floor(rnd(k + 3) * branches.length);
    d += poly(branches[b0].map(to), false);
    if (rnd(k + 11) > 0.55) {
      const b1 = (b0 + 2 + Math.floor(rnd(k + 17) * 3)) % branches.length;
      d += poly(branches[b1].map(to), false);
    }
    // a point between each rune
    const m = polar(((k + 0.5) / n) * TAU, RUNE_R);
    d += `M${f2(m.x - 0.15)} ${f2(m.y)}L${f2(m.x + 0.15)} ${f2(m.y)}`;
  }
  return d;
})();

const sealRingPicture = once((c) => {
  engrave(c, {
    d: SEAL_RING,
    evenOdd: true,
    fill: lit(BRONZE, 62),
    ink: INK_BRONZE,
    width: 1.3,
    vein: annulus(51.6, 58.2),
    veinColor: VEIN_BRONZE,
    veinWidth: 0.7,
    veinAlpha: 0.9,
    shine: arc(59.1, -165, -112) + arc(50.6, -160, -120),
    shineWidth: 0.8,
  });
  // the channel the runes are cut in, a shade deeper
  const channel = Skia.Path.MakeFromSVGString(annulus(51.9, 57.9));
  if (channel) {
    channel.setFillType(FillType.EvenOdd);
    c.drawPath(channel, brush("#3A2008", 0.22));
  }
  // beads round the outer lip
  for (let k = 0; k < 48; k++) {
    const p = polar((k / 48) * TAU, 59.1);
    stud(c, p.x, p.y, 0.62, ["#FFF0C8", "#C99050", "#5A3412"], INK_BRONZE);
  }
});

const sealRunesPicture = once((c) => {
  // cut in: a dark stroke, its lower edge catching the light
  c.save();
  c.translate(0.35, 0.35);
  line(c, RUNES, 0.45, "#FFE6B0", 0.55);
  c.restore();
  line(c, RUNES, 0.75, "#2A1606", 0.9);
});

/** The candles round the ring: angle (deg), how far out its foot stands,
 *  its height. */
const CANDLES = (
  [
    [-126, 70, 11],
    [-54, 70, 11],
    [-162, 72, 13],
    [-18, 72, 13],
    [162, 75, 12],
    [18, 75, 12],
    [126, 78, 10],
    [54, 78, 10],
  ] as const
).map(([deg, r, h], i) => {
  const p = polar(deg * DEG, r);
  return { deg, x: p.x, y: p.y, h, i };
});

const MOON = { x: 0, y: -79 };

const sealCandlesPicture = once((c) => {
  for (const cd of CANDLES) {
    const a = cd.deg * DEG;
    const from = polar(a, 59.5);
    const to: Pt = [cd.x, cd.y + 1.6];
    const below = Math.sin(a) > 0;
    const ctrl: Pt = below ? [from.x, to[1]] : [to[0], from.y];
    // the sconce's arm, out from the ring
    const arm = `M${f2(from.x)} ${f2(from.y)}Q${f2(ctrl[0])} ${f2(ctrl[1])} ${f2(to[0])} ${f2(to[1])}`;
    line(c, arm, 3.4, INK_BRONZE);
    const armPath = Skia.Path.MakeFromSVGString(arm);
    if (armPath) {
      const p = pen(2, "#C99050");
      p.setShader(lit(BRONZE, 90));
      c.drawPath(armPath, p);
    }
    c.save();
    c.translate(cd.x, cd.y);
    const h = cd.h;
    // the drip pan
    engrave(c, {
      d: "M-5 -0.6Q-5 1.6 -2.6 2.2H2.6Q5 1.6 5 -0.6Z",
      fill: linear(-5, -1, 5, 2, BRONZE),
      ink: INK_BRONZE,
      width: 0.8,
      shine: "M-4 -0.2Q-3.6 1.1 -2 1.5",
      shineWidth: 0.6,
    });
    // the candle, its top melted, wax run down one side
    engrave(c, {
      d: `M-2.7 0V${f2(-h + 1)}Q-2.7 ${f2(-h)} -1.5 ${f2(-h + 0.3)}Q0 ${f2(-h + 1.1)} 1.4 ${f2(-h + 0.2)}Q2.7 ${f2(-h - 0.1)} 2.7 ${f2(-h + 1)}V0Z`,
      fill: linear(-2.7, 0, 2.7, 0, IVORY),
      ink: INK_GOLD,
      width: 0.75,
      vein: `M1.4 ${f2(-h + 2)}V-1`,
      veinColor: "#B8A880",
      veinWidth: 0.5,
      veinAlpha: 0.6,
      shine: `M-1.6 ${f2(-h + 1.6)}V-1.2`,
      shineWidth: 0.7,
    });
    engrave(c, {
      d: `M-2.7 ${f2(-h + 1)}Q-3.7 ${f2(-h + 3)} -3.3 ${f2(-h + 5.2)}Q-2.9 ${f2(-h + 6.4)} -2.5 ${f2(-h + 4.6)}Q-2.2 ${f2(-h + 2)} -1.4 ${f2(-h + 0.4)}Z`,
      fill: "#FFFDF4",
      ink: INK_GOLD,
      width: 0.6,
    });
    line(c, `M0 ${f2(-h + 0.6)}L0.2 ${f2(-h - 1.4)}`, 0.8, "#2A1A0A");
    c.restore();
  }
  // the moon over the watch
  const disc = Skia.Path.MakeFromSVGString(circle(9, MOON.x, MOON.y));
  const bite = Skia.Path.MakeFromSVGString(
    circle(7.6, MOON.x + 3.8, MOON.y - 2.4),
  );
  const crescent =
    disc && bite ? Skia.Path.MakeFromOp(disc, bite, PathOp.Difference) : null;
  if (crescent) {
    const d = crescent.toSVGString();
    c.drawCircle(
      MOON.x,
      MOON.y,
      14,
      brush(radial(MOON.x, MOON.y, 14, ["#DCE8FF55", "#DCE8FF00"])),
    );
    engrave(c, {
      d,
      fill: linear(MOON.x - 9, MOON.y - 4, MOON.x + 4, MOON.y + 9, SILVER),
      ink: INK_STEEL,
      width: 1,
      vein:
        circle(1.2, MOON.x - 5.6, MOON.y + 1.5) +
        circle(0.8, MOON.x - 2.6, MOON.y + 5.4) +
        circle(0.6, MOON.x - 6.6, MOON.y - 3),
      veinColor: "#7A8494",
      veinWidth: 0.5,
      shine: arc(8, 150, 215, MOON.x, MOON.y),
      shineWidth: 0.8,
    });
  }
});

const SEAL = { x: 0, y: 65 };
const SEAL_BLOB = poly(
  Array.from({ length: 72 }, (_, k): Pt => {
    const a = (k / 72) * TAU;
    const r = 12.4 + 1.1 * Math.sin(7 * a + 0.5) + 0.45 * Math.sin(13 * a + 2);
    return [SEAL.x + Math.cos(a) * r, SEAL.y + Math.sin(a) * r];
  }),
);
/** A swallowtail of black silk, hanging right from under the seal. */
const SEAL_TAIL: Pt[] = [
  [1, 70],
  [6.5, 67.5],
  [16.2, 84.8],
  [12.6, 83.4],
  [10.2, 88.4],
];
/** The key the seal is stamped with, in its own little space. */
const KEY =
  "M-0.8 -0.9H0.8V3.6H2.6V4.6H0.8V5.4H2.2V6.4H0.8V7.2H-0.8Z" +
  circle(2.7, 0, -3.3);

const sealWaxPicture = once((c) => {
  for (const tail of [SEAL_TAIL, mirror(SEAL_TAIL)]) {
    engrave(c, {
      d: poly(tail),
      fill: linear(-10, 68, 10, 90, ["#4A5468", "#1A2030", "#0A0E18"]),
      ink: "#05070C",
      width: 0.8,
      vein: poly(
        [
          [(tail[0][0] + tail[1][0]) / 2, (tail[0][1] + tail[1][1]) / 2],
          [tail[3][0], tail[3][1] - 1],
        ],
        false,
      ),
      veinColor: "#6A7488",
      veinWidth: 0.5,
      veinAlpha: 0.7,
    });
  }
  // a shadow under the wax
  const blob = Skia.Path.MakeFromSVGString(SEAL_BLOB);
  if (blob) c.drawPath(blob, shadow("#1A0204", 0.45, 1.6));
  engrave(c, {
    d: SEAL_BLOB,
    fill: radial(SEAL.x - 4, SEAL.y - 5, 17, [
      CRIMSON[0],
      CRIMSON[1],
      CRIMSON[2],
    ]),
    ink: INK_CRIMSON,
    width: 1.1,
    shine: arc(11.2, 195, 245, SEAL.x, SEAL.y),
    shineWidth: 0.9,
    shineAlpha: 0.7,
  });
  // the pressed face: sunk in, so its lower right lip catches the light
  engrave(c, {
    d: circle(8.4, SEAL.x, SEAL.y),
    fill: radial(SEAL.x + 3, SEAL.y + 3, 12, ["#D8364E", "#9A1428", "#5A0614"]),
    ink: "#4A0410",
    width: 0.8,
    shine: arc(7.8, 10, 80, SEAL.x, SEAL.y),
    shineWidth: 0.7,
    shineAlpha: 0.5,
  });
  // the key in relief
  c.save();
  c.translate(SEAL.x, SEAL.y - 1);
  c.scale(1.05, 1.05);
  const key = Skia.Path.MakeFromSVGString(KEY);
  if (key) {
    c.save();
    c.translate(0.5, 0.5);
    c.drawPath(key, brush("#3A0208", 0.75));
    c.restore();
    c.drawPath(
      key,
      brush(linear(-2, -6, 2, 7, ["#FFB0BA", "#E0485E", "#A81A30"])),
    );
    c.drawPath(key, pen(0.4, "#5A0614", 0.8));
  }
  dot(c, 0, -3.3, 1.15, "#5A0614");
  c.restore();
});

function SealKeeperBack({ t }: { t: Clock }) {
  const warm = useDerivedValue(
    () => 0.36 + 0.07 * Math.sin(t.value * 5.3) * Math.sin(t.value * 2.1),
  );
  return (
    <Group>
      <Halo r={86} color="#FFB45E" opacity={warm} />
    </Group>
  );
}

function SealKeeperFront({ t }: { t: Clock }) {
  const ring = usePicture(sealRingPicture);
  const runes = usePicture(sealRunesPicture);
  const candles = usePicture(sealCandlesPicture);
  const wax = usePicture(sealWaxPicture);
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.09 }]);
  return (
    <Group>
      <Picture picture={ring} />
      <Group transform={turn} origin={vec(0, 0)}>
        <Picture picture={runes} />
      </Group>
      <Sweep t={t} d={SEAL_RING} evenOdd every={4.8} />
      <Picture picture={candles} />
      {CANDLES.map((cd) => (
        <Flicker
          key={cd.i}
          t={t}
          x={cd.x + 0.2}
          y={cd.y - cd.h - 0.6}
          size={6.4}
          phase={cd.i * 1.7}
        />
      ))}
      <Picture picture={wax} />
      <Glint
        t={t}
        x={SEAL.x - 4}
        y={SEAL.y - 6}
        size={5}
        phase={0.4}
        speed={0.9}
      />
      <Glint t={t} x={MOON.x - 6} y={MOON.y - 3} size={4} phase={2.2} />
      <Glint t={t} x={-42} y={-38} size={3.5} phase={4.1} />
    </Group>
  );
}

const SealKeeper: ArtBorderDrawing = {
  back: SealKeeperBack,
  front: SealKeeperFront,
};

// ══ Last Winter ═══════════════════════════════════════════════════════

const ICE = ["#FFFFFF", "#D8F2FF", "#86C4EC", "#EAF8FF"];
const INK_ICE = "#16324E";
const VEIN_ICE = "#4A86B4";
/** Iron, frost-pale at the top and lit by the fire below. */
const FIRELIT_IRON = ["#F2F8FF", "#AAB6C6", "#5A6272", "#5A4038", "#C8602A"];

const WINTER_RING = annulus(49.5, 58.5);

/** Ice shards off the ring's top: angle (deg), length. */
const SHARDS: [number, number][] = [
  [-166, 11],
  [-148, 16],
  [-130, 12],
  [-112, 20],
  [-90, 25],
  [-68, 20],
  [-50, 12],
  [-32, 16],
  [-14, 11],
];
const shardPts = (len: number, w: number): Pt[] => [
  [0, -w * 0.8],
  [len * 0.38, -w],
  [len, 0],
  [len * 0.38, w],
  [0, w * 0.8],
];

/** Icicles hanging from the ring's lower sides: angle (deg), length,
 *  width; mirrored on the left. Short near the fire. */
const ICICLES: [number, number, number][] = [
  [12, 14, 2.4],
  [22, 19, 3],
  [32, 12, 2.3],
  [41, 16, 2.6],
  [51, 10, 2.1],
  [61, 7, 1.8],
];
const icicle = (x: number, y: number, len: number, w: number) => {
  const pts: Pt[] = [
    [-w, -3],
    [-w, 0],
    [-w * 0.75, len * 0.3],
    [-w * 0.45, len * 0.45],
    [-w * 0.35, len * 0.62],
    [0, len],
    [w * 0.3, len * 0.66],
    [w * 0.5, len * 0.42],
    [w * 0.8, len * 0.25],
    [w, 0],
    [w, -3],
  ];
  return pts.map(([u, v]): Pt => [x + u, y + v]);
};
/** The snow on the ring's top: lumpy, deepest at the crown. */
const SNOW_CAP = (() => {
  const a0 = -170;
  const a1 = -10;
  const n = 64;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const deg = a0 + ((a1 - a0) * k) / n;
    const s = Math.sin((Math.PI * k) / n);
    const h = 3.4 * Math.pow(s, 0.7) + 0.9 * s * Math.sin(deg * 0.32 + 1);
    const o = polar(deg * DEG, 58.2 + h);
    outer.push([o.x, o.y]);
    const i = polar(deg * DEG, 56.4 + 0.4 * s);
    inner.push([i.x, i.y]);
  }
  return poly([...outer, ...inner.reverse()]);
})();
const SNOW_LINE = arc(58.6, -150, -30);
const ICICLE_FEET = ICICLES.map(([deg, len, w]) => {
  const p = polar(deg * DEG, 57.6);
  return { x: p.x, y: p.y, len, w };
});

const winterFrontPicture = once((c) => {
  // shards, their roots under the ring
  for (const [deg, len] of SHARDS) {
    const a = deg * DEG;
    const root = polar(a, 55);
    const pts = place(shardPts(len, 2.6 + len * 0.04), root.x, root.y, a);
    const vein = place(
      [
        [2, 0],
        [len * 0.92, 0],
      ],
      root.x,
      root.y,
      a,
    );
    engrave(c, {
      d: poly(pts),
      fill: linear(pts[0][0], pts[0][1], pts[2][0], pts[2][1], ICE),
      ink: INK_ICE,
      width: 0.85,
      vein: poly(vein, false) + poly([pts[1], pts[2]], false),
      veinColor: VEIN_ICE,
      veinWidth: 0.5,
      shine: poly(
        place(
          [
            [len * 0.15, -1.2],
            [len * 0.7, -0.6],
          ],
          root.x,
          root.y,
          a,
        ),
        false,
      ),
      shineWidth: 0.6,
    });
    // frost feathers off the long ones
    if (len > 15) {
      for (const side of [-1, 1]) {
        const at = place([[len * 0.55, 0]], root.x, root.y, a)[0];
        const b = a + side * 0.75;
        const twig = place(shardPts(len * 0.3, 1.3), at[0], at[1], b);
        engrave(c, {
          d: poly(twig),
          fill: linear(twig[0][0], twig[0][1], twig[2][0], twig[2][1], ICE),
          ink: INK_ICE,
          width: 0.6,
        });
      }
    }
  }
  // icicles, both sides
  for (const side of [1, -1]) {
    for (const f of ICICLE_FEET) {
      const x = f.x * side;
      const pts = icicle(x, f.y, f.len, f.w);
      engrave(c, {
        d: poly(pts),
        fill: linear(x - f.w, 0, x + f.w, 0, ["#FFFFFF", "#CBEBFF", "#7AB4DC"]),
        ink: INK_ICE,
        width: 0.7,
        vein: `M${f2(x + f.w * 0.15)} ${f2(f.y + 1)}L${f2(x + f.w * 0.05)} ${f2(f.y + f.len * 0.75)}`,
        veinColor: VEIN_ICE,
        veinWidth: 0.4,
        shine: `M${f2(x - f.w * 0.5)} ${f2(f.y + 0.5)}L${f2(x - f.w * 0.3)} ${f2(f.y + f.len * 0.45)}`,
        shineWidth: 0.6,
      });
    }
  }
  // the iron ring, riveted
  engrave(c, {
    d: WINTER_RING,
    evenOdd: true,
    fill: linear(0, -58, 0, 58, FIRELIT_IRON),
    ink: "#0E1218",
    width: 1.3,
    vein: annulus(51.2, 56.8),
    veinColor: "#20262E",
    veinWidth: 0.7,
    veinAlpha: 0.85,
    shine: arc(57.6, -165, -110) + arc(50.4, -150, -118),
    shineWidth: 0.8,
  });
  for (let k = 0; k < 12; k++) {
    const p = polar(((k * 30 + 15) * Math.PI) / 180, 54);
    const warm = p.y > 20;
    stud(
      c,
      p.x,
      p.y,
      1.55,
      warm
        ? ["#FFE0B0", "#B8683A", "#3A2018"]
        : ["#FFFFFF", "#9AA4B4", "#2E3440"],
      "#0E1218",
    );
  }
  // snow lying on the ring's top, the shards standing out of it
  engrave(c, {
    d: SNOW_CAP,
    fill: linear(0, -64, 0, -50, ["#FFFFFF", "#EEF7FF", "#A8CCEC"]),
    ink: INK_ICE,
    width: 0.9,
    vein: SNOW_LINE,
    veinColor: "#8AB4DA",
    veinWidth: 0.5,
    veinAlpha: 0.6,
    shine: arc(59.6, -150, -110),
    shineWidth: 0.8,
  });
});

const LOG = "M-14 -2.7H14A2.7 2.7 0 0 1 14 2.7H-14A2.7 2.7 0 0 1 -14 -2.7Z";
const HEARTH = { x: 0, y: 83 };

const winterHearthPicture = once((c) => {
  // the bed of embers
  c.drawOval(
    Skia.XYWHRect(HEARTH.x - 17, HEARTH.y - 4, 34, 9),
    brush(
      radial(
        HEARTH.x,
        HEARTH.y + 0.5,
        17,
        ["#FFD27A", "#E2541A", "#6A1A0400"],
        [0, 0.5, 1],
      ),
    ),
  );
  for (const turn of [14, -14]) {
    c.save();
    c.translate(HEARTH.x, HEARTH.y);
    c.rotate(turn, 0, 0);
    engrave(c, {
      d: LOG,
      fill: linear(0, -2.7, 0, 2.7, WOOD),
      ink: INK_WOOD,
      width: 0.8,
      vein: "M-11 -0.9H-3M1 -1.2H9M-7 1.1H5",
      veinColor: "#4A2C12",
      veinWidth: 0.5,
      shine: "M-12 -1.9H8",
      shineWidth: 0.5,
      shineAlpha: 0.5,
    });
    // the cut end, its rings, toward the fire's light
    const end = turn > 0 ? 13.6 : -13.6;
    engrave(c, {
      d: `M${end - 1.4} 0A1.4 2.6 0 1 1 ${end + 1.4} 0A1.4 2.6 0 1 1 ${end - 1.4} 0Z`,
      fill: radial(end, 0, 3, ["#F4D0A0", "#C8945A"]),
      ink: INK_WOOD,
      width: 0.6,
      vein: `M${end - 0.6} 0A0.6 1.2 0 1 1 ${end + 0.6} 0A0.6 1.2 0 1 1 ${end - 0.6} 0Z`,
      veinColor: "#8A5A2E",
      veinWidth: 0.4,
    });
    c.restore();
  }
});

const FLAKES = Array.from({ length: 16 }, (_, i) => ({
  i,
  x0: -84 + rnd(i * 3 + 1) * 168,
  speed: 6 + rnd(i * 3 + 2) * 7,
  off: rnd(i * 5 + 3) * 184,
  size: 1 + rnd(i * 7 + 4) * 1.3,
}));

function flakePath(s: number) {
  let d = "";
  for (let k = 0; k < 3; k++) {
    const p = polar((k * Math.PI) / 3, s * 1.5);
    d += `M${f2(-p.x)} ${f2(-p.y)}L${f2(p.x)} ${f2(p.y)}`;
  }
  return d;
}

function Flake({
  t,
  i,
  x0,
  speed,
  off,
  size,
}: {
  t: Clock;
  i: number;
  x0: number;
  speed: number;
  off: number;
  size: number;
}) {
  const d = useMemo(() => flakePath(size), [size]);
  const transform = useDerivedValue(() => {
    const y = -92 + ((t.value * speed + off) % 184);
    const x = x0 + Math.sin(t.value * 0.7 + i) * 5;
    return [
      { translateX: x },
      { translateY: y },
      { rotate: t.value * 0.6 + i },
    ];
  });
  const opacity = useDerivedValue(() => {
    const y = -92 + ((t.value * speed + off) % 184);
    const x = x0 + Math.sin(t.value * 0.7 + i) * 5;
    const r = Math.sqrt(x * x + y * y);
    return Math.max(0, Math.min(1, (90 - r) / 10)) * 0.9;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path
        path={d}
        style="stroke"
        strokeWidth={0.6}
        strokeCap="round"
        color="#F4FBFF"
      />
      <Circle cx={0} cy={0} r={size * 0.45} color="#FFFFFF" />
    </Group>
  );
}

const DROP =
  "M0 -0.4C0.9 0.7 1.3 1.4 1.3 2C1.3 2.8 0.7 3.3 0 3.3C-0.7 3.3 -1.3 2.8 -1.3 2C-1.3 1.4 -0.9 0.7 0 -0.4Z";

/** A drop that swells on an icicle's tip as the fire melts it, and falls. */
function Drip({
  t,
  x,
  y,
  phase,
}: {
  t: Clock;
  x: number;
  y: number;
  phase: number;
}) {
  const transform = useDerivedValue(() => {
    const p = ((t.value + phase) % 3.6) / 3.6;
    const fall = p < 0.82 ? 0 : (p - 0.82) / 0.18;
    const s = p < 0.82 ? 0.25 + 0.75 * (p / 0.82) : 1;
    return [
      { translateX: x },
      { translateY: y + fall * fall * 20 },
      { scale: s },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + phase) % 3.6) / 3.6;
    return p < 0.82 ? 1 : 1 - (p - 0.82) / 0.18;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={DROP} color="#E4F6FF" />
      <Path path={DROP} style="stroke" strokeWidth={0.45} color={INK_ICE} />
      <Circle cx={-0.4} cy={1.6} r={0.35} color="#FFFFFF" />
    </Group>
  );
}

function WinterBack({ t }: { t: Clock }) {
  const hearth = usePicture(winterHearthPicture);
  const warm = useDerivedValue(
    () => 0.62 + 0.16 * Math.sin(t.value * 6.1) * Math.sin(t.value * 2.3),
  );
  return (
    <Group>
      {/* cold above, the fire's warmth below */}
      <Circle cx={0} cy={-26} r={70} opacity={0.32}>
        <RadialGradient
          c={vec(0, -26)}
          r={70}
          colors={["#9AD4FF", "#9AD4FF00"]}
        />
      </Circle>
      <Circle cx={0} cy={60} r={33} opacity={warm}>
        <RadialGradient
          c={vec(0, 60)}
          r={33}
          colors={["#FF8A2A", "#FF8A2A55", "#FF8A2A00"]}
          positions={[0.2, 0.6, 1]}
        />
      </Circle>
      {FLAKES.map((f) => (
        <Flake key={f.i} t={t} {...f} />
      ))}
      <Picture picture={hearth} />
      <Fire x={HEARTH.x} y={HEARTH.y - 1} width={24} height={34} clock={t} />
      <Sparks
        t={t}
        count={5}
        from={Math.PI * 0.38}
        to={Math.PI * 0.62}
        r={72}
        rise={18}
        size={1.2}
        color="#FF9A3A"
        seed={31}
      />
    </Group>
  );
}

function WinterFront({ t }: { t: Clock }) {
  const iron = usePicture(winterFrontPicture);
  const firelight = useDerivedValue(
    () => 0.5 + 0.22 * Math.sin(t.value * 7.3) * Math.sin(t.value * 3.1 + 1),
  );
  const melt = ICICLE_FEET[ICICLE_FEET.length - 2];
  const long = ICICLE_FEET[1];
  return (
    <Group>
      <Picture picture={iron} />
      {/* the fire's light flickering on the iron */}
      <Path
        path={WINTER_RING}
        fillType="evenOdd"
        blendMode="screen"
        opacity={firelight}
      >
        <RadialGradient
          c={vec(0, 72)}
          r={50}
          colors={["#FF9A3A", "#FF7A1A88", "#FF7A1A00"]}
          positions={[0.15, 0.55, 1]}
        />
      </Path>
      <Sweep t={t} d={WINTER_RING} evenOdd every={5.2} phase={1.2} />
      <Drip t={t} x={melt.x} y={melt.y + melt.len} phase={0} />
      <Drip t={t} x={-melt.x} y={melt.y + melt.len} phase={1.8} />
      <Drip t={t} x={-long.x} y={long.y + long.len} phase={2.7} />
      <Glint t={t} x={0} y={-79} size={5} phase={0.5} />
      <Glint t={t} x={-48} y={-52} size={3.5} phase={2.4} />
      <Glint
        t={t}
        x={long.x}
        y={long.y + long.len - 2}
        size={3.5}
        phase={4.2}
      />
    </Group>
  );
}

const LastWinter: ArtBorderDrawing = { back: WinterBack, front: WinterFront };

// ══ Spymaster's ═══════════════════════════════════════════════════════

const GUNMETAL = ["#C4CCD6", "#5E6672", "#252A32", "#8C96A2"];
const INK_GUN = "#0A0D12";
const VEIN_GUN = "#14181E";
const TEAL = "#5FF5DC";

const BEZEL = annulus(49.5, 57.2);
const WHEEL = annulus(58.2, 73.5);
const GLYPH_R = 65.4;

/** The pigpen cipher: nine letters in a grid, nine more with a dot, four
 *  in an X, four more with a dot. Each as strokes in a ±s box, v up. */
const PIGPEN = (() => {
  const s = 2.5;
  const out: { lines: Pt[][]; dot: boolean }[] = [];
  for (const dotted of [false, true]) {
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const lines: Pt[][] = [];
      if (col > 0)
        lines.push([
          [-s, s],
          [-s, -s],
        ]);
      if (col < 2)
        lines.push([
          [s, s],
          [s, -s],
        ]);
      if (row > 0)
        lines.push([
          [-s, s],
          [s, s],
        ]);
      if (row < 2)
        lines.push([
          [-s, -s],
          [s, -s],
        ]);
      out.push({ lines, dot: dotted });
    }
  }
  const vees: Pt[][] = [
    [
      [-s, s],
      [0, -s * 0.6],
      [s, s],
    ],
    [
      [s, -s],
      [-s * 0.6, 0],
      [s, s],
    ],
    [
      [-s, -s],
      [s * 0.6, 0],
      [-s, s],
    ],
    [
      [-s, -s],
      [0, s * 0.6],
      [s, -s],
    ],
  ];
  for (const dotted of [false, true])
    for (const v of vees) out.push({ lines: [v], dot: dotted });
  return out;
})();

const CIPHER = (() => {
  const n = PIGPEN.length;
  let glyphs = "";
  let dots: Pt[] = [];
  let cells = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const cx = Math.cos(a) * GLYPH_R;
    const cy = Math.sin(a) * GLYPH_R;
    const to = ([u, v]: Pt): Pt => [
      cx - Math.sin(a) * u + Math.cos(a) * v,
      cy + Math.cos(a) * u + Math.sin(a) * v,
    ];
    const g = PIGPEN[(k * 7) % n];
    for (const l of g.lines) glyphs += poly(l.map(to), false);
    if (g.dot) dots = [...dots, to([0, 0])];
    const b = ((k + 0.5) / n) * TAU;
    const p0 = polar(b, 60.4);
    const p1 = polar(b, 70.4);
    cells += `M${f2(p0.x)} ${f2(p0.y)}L${f2(p1.x)} ${f2(p1.y)}`;
  }
  let knurl = "";
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * TAU;
    const p0 = polar(a, 71.5);
    const p1 = polar(a, 73.4);
    knurl += `M${f2(p0.x)} ${f2(p0.y)}L${f2(p1.x)} ${f2(p1.y)}`;
  }
  return { glyphs, dots, cells, knurl };
})();

const spyRingPicture = once((c) => {
  // the shadow between bezel and wheel
  const gap = Skia.Path.MakeFromSVGString(annulus(56.8, 58.6));
  if (gap) {
    gap.setFillType(FillType.EvenOdd);
    c.drawPath(gap, brush(INK_GUN));
  }
  engrave(c, {
    d: WHEEL,
    evenOdd: true,
    fill: lit(GUNMETAL, 74),
    ink: INK_GUN,
    width: 1.2,
    vein: annulus(60.2, 70.8),
    veinColor: VEIN_GUN,
    veinWidth: 0.7,
    veinAlpha: 0.9,
    shine: arc(72.6, -168, -112) + arc(59.2, -160, -118),
    shineWidth: 0.8,
  });
  // the bezel, ruled like a gauge
  let ticks = "";
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * TAU;
    const p0 = polar(a, k % 5 ? 54.4 : 52.4);
    const p1 = polar(a, 56.2);
    ticks += `M${f2(p0.x)} ${f2(p0.y)}L${f2(p1.x)} ${f2(p1.y)}`;
  }
  engrave(c, {
    d: BEZEL,
    evenOdd: true,
    fill: lit(["#DCE2EA", "#7A8492", "#2E343E", "#A4AEBA"], 58),
    ink: INK_GUN,
    width: 1.2,
    vein: ticks + circle(51.3),
    veinColor: VEIN_GUN,
    veinWidth: 0.55,
    veinAlpha: 0.9,
    shine: arc(56.4, -160, -115),
    shineWidth: 0.7,
  });
  // the crosshair, in teal enamel
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU;
    const bar = place(
      [
        [47.4, -1.3],
        [58, -1.3],
        [58, 1.3],
        [47.4, 1.3],
      ],
      0,
      0,
      a,
    );
    engrave(c, {
      d: poly(bar),
      fill: linear(bar[0][0], bar[0][1], bar[2][0], bar[2][1], [
        "#C8FFF6",
        TEAL,
        "#0E8A78",
      ]),
      ink: "#04201C",
      width: 0.7,
    });
  }
});

/** What turns: the wheel's cells, its pigpen letters inlaid in teal, its
 *  knurled edge. */
const spyCipherPicture = once((c) => {
  line(c, CIPHER.cells, 0.6, VEIN_GUN, 0.9);
  line(c, CIPHER.knurl, 0.45, VEIN_GUN, 0.85);
  line(c, CIPHER.glyphs, 1.5, "#04201C", 0.9);
  line(c, CIPHER.glyphs, 0.75, TEAL);
  for (const [x, y] of CIPHER.dots) dot(c, x, y, 0.75, TEAL, "#04201C", 0.35);
});

/** The keyhole plate at the top, its point the wheel's index. */
const PLATE =
  "M-7.5 -71L-8.6 -84Q-8.6 -90.4 0 -90.4Q8.6 -90.4 8.6 -84L7.5 -71L0 -63.4Z";
const KEYHOLE = circle(2.3, 0, -82.6) + "M-1 -81.2L-2 -75.4H2L1 -81.2Z";

const LENS = { x: 60, y: 38, r: 11.6 };
const LENS_RIM =
  circle(LENS.r + 2.6, LENS.x, LENS.y) + circle(LENS.r, LENS.x, LENS.y);

const spyFrontPicture = once((c) => {
  engrave(c, {
    d: PLATE,
    fill: lit(GUNMETAL, 90),
    ink: INK_GUN,
    width: 1.1,
    vein: "M-6 -72.5L-6.9 -83.6Q-6.9 -88.6 0 -88.6Q6.9 -88.6 6.9 -83.6L6 -72.5L0 -66.2Z",
    veinColor: VEIN_GUN,
    veinWidth: 0.5,
    shine: "M-7.4 -84Q-7.2 -89 -1 -89.3",
    shineWidth: 0.7,
  });
  const hole = Skia.Path.MakeFromSVGString(KEYHOLE);
  if (hole) {
    c.drawPath(hole, brush("#020304"));
    c.save();
    c.clipPath(hole, ClipOp.Intersect, true);
    c.translate(-0.6, -0.6);
    c.drawPath(hole, pen(0.8, "#8C96A2", 0.6));
    c.restore();
  }
  for (const x of [-5.6, 5.6])
    stud(c, x, -87, 0.9, ["#FFFFFF", "#8C96A2", "#252A32"], INK_GUN);
  // the magnifier's handle, down and out from the lens
  const a = 70 * DEG;
  const start = polar(a, LENS.r + 2.2);
  const sx = LENS.x + start.x;
  const sy = LENS.y + start.y;
  const ferrule = place(
    [
      [0, -2.1],
      [3.6, -2.1],
      [3.6, 2.1],
      [0, 2.1],
    ],
    sx,
    sy,
    a,
  );
  const grip = place(
    [
      [3.4, -2.3],
      [10.2, -2.5],
      [11.2, 0],
      [10.2, 2.5],
      [3.4, 2.3],
    ],
    sx,
    sy,
    a,
  );
  engrave(c, {
    d: poly(grip),
    fill: linear(grip[0][0], grip[0][1], grip[4][0], grip[4][1], [
      "#5A4030",
      "#2A1C14",
      "#140C08",
    ]),
    ink: "#050302",
    width: 0.8,
    shine: poly(
      place(
        [
          [4.4, -1.2],
          [9.6, -1.4],
        ],
        sx,
        sy,
        a,
      ),
      false,
    ),
    shineWidth: 0.6,
    shineAlpha: 0.5,
  });
  engrave(c, {
    d: poly(ferrule),
    fill: linear(
      ferrule[0][0],
      ferrule[0][1],
      ferrule[3][0],
      ferrule[3][1],
      SILVER,
    ),
    ink: INK_STEEL,
    width: 0.7,
    vein: poly(
      place(
        [
          [1.8, -2.1],
          [1.8, 2.1],
        ],
        sx,
        sy,
        a,
      ),
      false,
    ),
    veinColor: "#4A5462",
    veinWidth: 0.4,
  });
});

/** The glass over the lens: a cool tint and the window's reflection. */
const spyGlassPicture = once((c) => {
  const { x, y, r } = LENS;
  c.drawCircle(
    x,
    y,
    r,
    brush(
      radial(x - 3, y - 3, r * 1.4, ["#BFE8FF22", "#6A9AC844", "#1A2A5A77"]),
    ),
  );
  line(
    c,
    `M${f2(x - r * 0.62)} ${f2(y - r * 0.2)}Q${f2(x - r * 0.55)} ${f2(y - r * 0.62)} ${f2(x - r * 0.15)} ${f2(y - r * 0.66)}`,
    1.5,
    "#FFFFFF",
    0.75,
  );
  dot(c, x + r * 0.42, y + r * 0.42, 0.9, "#FFFFFF88");
  engrave(c, {
    d: LENS_RIM,
    evenOdd: true,
    fill: linear(x - r, y - r, x + r, y + r, SILVER),
    ink: INK_STEEL,
    width: 0.9,
    vein: circle(r + 1.3, x, y),
    veinColor: "#4A5462",
    veinWidth: 0.4,
    shine: arc(r + 2, -170, -110, x, y),
    shineWidth: 0.6,
  });
});

/** The dossier tucked behind the wheel: a manila folder, a typed sheet
 *  with lines blacked out, and a red stamp. */
const DOSSIER = { x: -54.4, y: 54.4, turn: 38 };

const spyDossierPicture = once((c) => {
  c.save();
  c.translate(DOSSIER.x, DOSSIER.y);
  c.rotate(DOSSIER.turn, 0, 0);
  // a shadow under it
  c.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-14, -10, 30, 22), 1.5, 1.5),
    shadow("#000000", 0.4, 2),
  );
  engrave(c, {
    d: "M-15 -11V-13.2Q-15 -14 -14.2 -14H-6Q-5.2 -14 -4.8 -13L-4.4 -11H14Q15 -11 15 -10V10Q15 11 14 11H-14Q-15 11 -15 10Z",
    fill: linear(-15, -14, 15, 11, ["#F8E6B4", "#D8B878", "#A88848"]),
    ink: INK_GOLD,
    width: 0.9,
    shine: "M-14.2 -12.6H-6.2",
    shineWidth: 0.6,
  });
  engrave(c, {
    d: "M-12.4 -9.2H12.6V9.4H-12.4Z",
    fill: linear(-12, -9, 12, 9, IVORY),
    ink: "#6A5A40",
    width: 0.6,
    vein: "M-10 -6.6H9M-10 -1.2H-3M3 -1.2H9.6M-10 4.2H-6",
    veinColor: "#8A7A60",
    veinWidth: 0.6,
    veinAlpha: 0.7,
  });
  // redacted
  for (const [x, y, w] of [
    [-3.8, -4.6, 13],
    [-10.2, -2.5, 6.4],
    [-10.2, 1.4, 11],
  ] as const) {
    c.drawRRect(
      Skia.RRectXY(Skia.XYWHRect(x, y, w, 2.4), 0.4, 0.4),
      brush("#0C0C10"),
    );
  }
  // the stamp, struck crooked
  c.save();
  c.translate(5.4, 5.2);
  c.rotate(-14, 0, 0);
  const stamp = pen(0.8, "#C2203A", 0.9);
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-6, -3, 12, 6), 1, 1), stamp);
  c.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-4.9, -1.9, 9.8, 3.8), 0.6, 0.6),
    pen(0.4, "#C2203A", 0.8),
  );
  line(c, "M-3.6 0H-1.4M-0.4 0H1M2 0H3.6", 1.1, "#C2203A", 0.85);
  c.restore();
  // a paper clip
  line(
    c,
    "M8.2 -12.6V-5.4Q8.2 -3.6 9.6 -3.6Q11 -3.6 11 -5.4V-11.4",
    1.5,
    INK_STEEL,
  );
  line(
    c,
    "M8.2 -12.6V-5.4Q8.2 -3.6 9.6 -3.6Q11 -3.6 11 -5.4V-11.4",
    0.7,
    "#DDE3EA",
  );
  c.restore();
});

/** The scan: a thin beam with a short fading wake. */
const SCAN_COLORS = ["#FF303000", "#FF303000", "#FF303018", "#FF303070"];
const SCAN_POS = [0, 0.88, 0.965, 1];

function SpymasterBack({ t }: { t: Clock }) {
  const dossier = usePicture(spyDossierPicture);
  const scan = useDerivedValue(() => [{ rotate: t.value * 1.2 }]);
  return (
    <Group>
      <Halo r={90} color="#2FE3C8" opacity={0.2} />
      <Picture picture={dossier} />
      <Group transform={scan} origin={vec(0, 0)} blendMode="screen">
        <Path path={annulus(56, 90)} fillType="evenOdd">
          <SweepGradient
            c={vec(0, 0)}
            colors={SCAN_COLORS}
            positions={SCAN_POS}
          />
        </Path>
        <Path
          path="M57 0H89"
          style="stroke"
          strokeWidth={0.9}
          color="#FF5A5A"
          opacity={0.9}
        />
      </Group>
    </Group>
  );
}

function SpymasterFront({ t }: { t: Clock }) {
  const ring = usePicture(spyRingPicture);
  const cipher = usePicture(spyCipherPicture);
  const front = usePicture(spyFrontPicture);
  const glass = usePicture(spyGlassPicture);
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.16 }]);
  const scan = useDerivedValue(() => [{ rotate: t.value * 1.2 }]);
  const blink = useDerivedValue(() =>
    Math.sin(t.value * 3.2) > 0.1 ? 0.95 : 0.12,
  );
  const lensClip = useMemo(
    () => Skia.Path.MakeFromSVGString(circle(LENS.r, LENS.x, LENS.y)),
    [],
  );
  const wheel = (
    <Group>
      <Picture picture={ring} />
      <Group transform={turn} origin={vec(0, 0)}>
        <Picture picture={cipher} />
      </Group>
    </Group>
  );
  return (
    <Group>
      {wheel}
      <Group
        transform={scan}
        origin={vec(0, 0)}
        blendMode="screen"
        opacity={0.55}
      >
        <Path path={annulus(49.5, 73.5)} fillType="evenOdd">
          <SweepGradient
            c={vec(0, 0)}
            colors={SCAN_COLORS}
            positions={SCAN_POS}
          />
        </Path>
      </Group>
      <Sweep t={t} d={WHEEL + BEZEL} evenOdd every={5} phase={0.4} />
      <Picture picture={front} />
      {/* the ruby lamp on the plate, blinking */}
      <Gem x={0} y={-68.4} w={4.4} h={4.4} colors={RUBY} />
      <Circle
        cx={0}
        cy={-68.4}
        r={3.4}
        color="#FF3B3B"
        opacity={blink}
        blendMode="screen"
      >
        <BlurMask blur={1.6} style="normal" />
      </Circle>
      {/* the magnifier: what's under the glass, larger */}
      {lensClip ? (
        <Group clip={lensClip}>
          <Circle cx={LENS.x} cy={LENS.y} r={LENS.r} color="#11161C" />
          <Group transform={[{ scale: 1.5 }]} origin={vec(LENS.x, LENS.y)}>
            {wheel}
          </Group>
        </Group>
      ) : null}
      <Picture picture={glass} />
      <Glint
        t={t}
        x={LENS.x - 4}
        y={LENS.y - 5}
        size={5}
        phase={0.8}
        speed={0.9}
      />
      <Glint t={t} x={-6} y={-88} size={3.5} phase={2.6} />
    </Group>
  );
}

const Spymaster: ArtBorderDrawing = {
  back: SpymasterBack,
  front: SpymasterFront,
};

// ══ Legend of the Table ═══════════════════════════════════════════════

const LEGEND_RING = annulus(49.5, 58.5);
const LEGEND_CHANNEL = annulus(52.3, 55.7);

/** One branch of the wreath (the right; the left is its mirror): its
 *  stem along r 64.5 from the foot to under the crest, leaves in pairs. */
const LAUREL = (() => {
  const leaves: { pts: Pt[]; vein: Pt[]; from: Pt; to: Pt }[] = [];
  const berries: Pt[] = [];
  const R = 64.5;
  const leaf = (base: Pt, dir: number, len: number, w: number) => {
    const pts = place(leafPts(len, w), base[0], base[1], dir);
    const vein = place(
      [
        [1, 0],
        [len * 0.85, 0],
      ],
      base[0],
      base[1],
      dir,
    );
    // light on the side facing the top left
    const n: Pt = [-Math.sin(dir) * w, Math.cos(dir) * w];
    const up = n[0] + n[1] < 0 ? 1 : -1;
    const from: Pt = [base[0] + n[0] * up, base[1] + n[1] * up];
    const to: Pt = [base[0] - n[0] * up, base[1] - n[1] * up];
    leaves.push({ pts, vein, from, to });
  };
  for (let k = 0; k < 12; k++) {
    const deg = 80 - k * 12.5;
    const p = polar(deg * DEG, R);
    const phi = (deg - 90) * DEG;
    const len = 13 - k * 0.3;
    const w = 3.9 - k * 0.06;
    leaf([p.x, p.y], phi - 38 * DEG, len * 0.9, w * 0.92);
    leaf([p.x, p.y], phi + 38 * DEG, len, w);
    if (k % 3 === 1) {
      const b = polar((deg - 6) * DEG, R + 4.4);
      berries.push([b.x, b.y]);
    }
  }
  const tip = polar(-58 * DEG, R);
  leaf([tip.x, tip.y], -148 * DEG, 11, 3.2);
  const stem = Array.from({ length: 14 }, (_, k): Pt => {
    const p = polar((86 - k * (144 / 13)) * DEG, R);
    return [p.x, p.y];
  });
  return {
    leaves,
    berries,
    stem: ribbon(
      stem,
      stem.map((_, k) => 2.6 - k * 0.1),
    ),
  };
})();
const LAUREL_D = (() => {
  const right = LAUREL.leaves.map((l) => poly(l.pts)).join("");
  const left = LAUREL.leaves.map((l) => poly(mirror(l.pts))).join("");
  return right + left;
})();

/** The trophy bow at the foot: a loop each side, two tails. */
const BOW_TAIL = ribbon(
  [
    [2, 68],
    [7, 75],
    [11, 82],
    [13.5, 87.5],
  ],
  [4.4, 5, 5.2, 5.2],
);
const BOW_LOOP = ribbon(
  [
    [1, 66.5],
    [7, 60.5],
    [14.5, 59],
    [18, 64.5],
    [12.5, 69.5],
    [2, 67.5],
  ],
  [3, 4.4, 5.2, 5.2, 4.4, 3],
);
const MEDAL = { x: 0, y: 67, r: 5.6 };

const SHIELD =
  "M-13 -88Q0 -91 13 -88L13 -76C13 -67 7 -61 0 -57.5C-7 -61 -13 -67 -13 -76Z";
const FIELD =
  "M-10.6 -85.6Q0 -88 10.6 -85.6L10.6 -76C10.6 -68.6 5.6 -63.4 0 -60.6C-5.6 -63.4 -10.6 -68.6 -10.6 -76Z";
const CREST_CURL = curl(12.6, -82, 0.15, 15, 3.4, 3.4);
const CREST = { x: 0, y: -75.2, scale: 0.74 };

const legendGloryPicture = once((c) => {
  const n = 32;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const r1 = k % 2 ? 77 : 88;
    const b0 = polar(a - 2.4 * DEG, 56);
    const b1 = polar(a + 2.4 * DEG, 56);
    const tip = polar(a, r1);
    d += poly([
      [b0.x, b0.y],
      [tip.x, tip.y],
      [b1.x, b1.y],
    ]);
  }
  const path = Skia.Path.MakeFromSVGString(d);
  if (path)
    c.drawPath(
      path,
      brush(
        radial(0, 0, 88, ["#FFF2B8", "#F0C860", "#E2B04A00"], [0.62, 0.8, 1]),
        0.8,
      ),
    );
});

const legendFrontPicture = once((c) => {
  // the wreath behind everything else, both branches
  for (const flip of [false, true]) {
    const m = (pts: Pt[]) => (flip ? mirror(pts) : pts);
    const mp = (p: Pt): Pt => (flip ? [-p[0], p[1]] : p);
    engrave(c, {
      d: flip ? flipX(LAUREL.stem.outline) : LAUREL.stem.outline,
      fill: lit(GOLD, 70),
      ink: INK_GOLD,
      width: 0.8,
    });
    for (const l of LAUREL.leaves) {
      const from = mp(l.from);
      const to = mp(l.to);
      engrave(c, {
        d: poly(m(l.pts)),
        fill: linear(from[0], from[1], to[0], to[1], [
          "#FFF4C0",
          "#E8BA52",
          "#9A6B1E",
        ]),
        ink: INK_GOLD,
        width: 0.85,
        vein: poly(m(l.vein), false),
        veinColor: VEIN_GOLD,
        veinWidth: 0.5,
      });
    }
    for (const b of LAUREL.berries) {
      const [x, y] = mp(b);
      stud(c, x, y, 1.8, ["#FFFFFF", "#F0C860", "#7A5212"], INK_GOLD);
    }
  }
  // the ring: gold, a sapphire enamel channel set with gold studs
  engrave(c, {
    d: LEGEND_RING,
    evenOdd: true,
    fill: lit(GOLD, 62),
    ink: INK_GOLD,
    width: 1.3,
    vein: annulus(51.1, 56.9),
    veinColor: VEIN_GOLD,
    veinWidth: 0.6,
    shine: arc(57.7, -165, -110) + arc(50.3, -158, -120),
    shineWidth: 0.8,
  });
  engrave(c, {
    d: LEGEND_CHANNEL,
    evenOdd: true,
    fill: lit(NIGHT, 60),
    ink: INK_NIGHT,
    width: 0.7,
    shine: arc(55, -150, -120),
    shineWidth: 0.5,
    shineAlpha: 0.5,
  });
  for (let k = 0; k < 24; k++) {
    const p = polar(((k + 0.5) / 24) * TAU, 54);
    stud(c, p.x, p.y, 1.15, ["#FFFFFF", "#F0C860", "#7A5212"], INK_GOLD);
  }
  // the bow
  for (const flip of [false, true]) {
    const f = (d: string) => (flip ? flipX(d) : d);
    for (const part of [BOW_TAIL, BOW_LOOP]) {
      engrave(c, {
        d: f(part.outline),
        fill: linear(-18, 58, 18, 90, CRIMSON),
        ink: INK_CRIMSON,
        width: 0.9,
        vein: f(part.grooves),
        veinColor: "#7A1020",
        veinWidth: 0.45,
        veinAlpha: 0.7,
        shine: f(part.shine),
        shineWidth: 0.6,
        shineAlpha: 0.6,
      });
    }
  }
  // its medal: a gold star-rayed boss
  let rays = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    const p0 = polar(a, MEDAL.r - 0.3);
    const p1 = polar(a, MEDAL.r - 2.2);
    rays += `M${f2(MEDAL.x + p0.x)} ${f2(MEDAL.y + p0.y)}L${f2(MEDAL.x + p1.x)} ${f2(MEDAL.y + p1.y)}`;
  }
  engrave(c, {
    d: circle(MEDAL.r, MEDAL.x, MEDAL.y),
    fill: radial(MEDAL.x - 2, MEDAL.y - 2, MEDAL.r * 1.8, GOLD.slice(0, 3)),
    ink: INK_GOLD,
    width: 1,
    vein: rays,
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
  });
  // the crest: scrolls, a gold shield, a night-blue field, the meeple
  for (const flip of [false, true]) {
    engrave(c, {
      d: flip ? flipX(CREST_CURL.outline) : CREST_CURL.outline,
      fill: lit(GOLD, 90),
      ink: INK_GOLD,
      width: 0.9,
      vein: flip ? flipX(CREST_CURL.vein) : CREST_CURL.vein,
      veinColor: VEIN_GOLD,
      veinWidth: 0.5,
    });
  }
  engrave(c, {
    d: SHIELD,
    fill: linear(-13, -91, 13, -57, GOLD),
    ink: INK_GOLD,
    width: 1.2,
    shine: "M-12 -87Q-6 -88.8 -1 -89.4M-12 -85V-76",
    shineWidth: 0.8,
  });
  engrave(c, {
    d: FIELD,
    fill: linear(-10, -88, 10, -60, NIGHT),
    ink: INK_GOLD,
    width: 0.8,
    vein: Array.from({ length: 9 }, (_, k) => `M-11 ${-85 + k * 3}H11`).join(
      "",
    ),
    veinColor: "#1A2A5A",
    veinWidth: 0.4,
  });
  c.save();
  c.translate(CREST.x, CREST.y);
  c.scale(CREST.scale, CREST.scale);
  c.translate(-12, -11.75);
  engrave(c, {
    d: MEEPLE_PATH,
    fill: linear(4, 2, 20, 21, GOLD),
    ink: INK_GOLD,
    width: 1.1,
    shine: "M9.6 4.6Q10.6 3.3 12.2 3.3M5.4 11.2Q7.4 9.8 9.4 9.4",
    shineWidth: 1,
  });
  c.restore();
});

function LegendBack({ t }: { t: Clock }) {
  const glory = usePicture(legendGloryPicture);
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.06 }]);
  const glow = useDerivedValue(() => 0.42 + 0.08 * Math.sin(t.value * 1.3));
  return (
    <Group>
      <Halo r={92} color="#FFC94A" opacity={glow} />
      <Group transform={turn} origin={vec(0, 0)}>
        <Picture picture={glory} />
      </Group>
      <Sparks
        t={t}
        count={7}
        from={-Math.PI}
        to={0}
        r={70}
        rise={18}
        color="#FFE08A"
        size={1.4}
        seed={9}
      />
    </Group>
  );
}

function LegendFront({ t }: { t: Clock }) {
  const art = usePicture(legendFrontPicture);
  const beat = useDerivedValue(() => {
    // the ruby's slow double beat
    const p = (t.value % 2.4) / 2.4;
    const a = Math.exp(-(((p - 0.1) / 0.05) ** 2));
    const b = Math.exp(-(((p - 0.26) / 0.06) ** 2)) * 0.7;
    return 0.15 + 0.75 * Math.max(a, b);
  });
  return (
    <Group>
      <Picture picture={art} />
      <Sweep t={t} d={LEGEND_RING} evenOdd every={4.2} />
      <Sweep t={t} d={LAUREL_D} every={4.2} phase={0.35} />
      <Sweep t={t} d={SHIELD} every={4.2} phase={0.7} />
      <Gem x={-8.2} y={-86.4} w={3.6} h={3.4} colors={SAPPHIRE} />
      <Gem x={8.2} y={-86.4} w={3.6} h={3.4} colors={EMERALD} />
      <Gem x={0} y={-62.6} w={3.8} h={3.4} colors={SAPPHIRE} />
      <Circle
        cx={MEDAL.x}
        cy={MEDAL.y}
        r={5}
        color="#FF4A5A"
        opacity={beat}
        blendMode="screen"
      >
        <BlurMask blur={2.2} style="normal" />
      </Circle>
      <Gem x={MEDAL.x} y={MEDAL.y} w={5.6} h={5.6} colors={RUBY} />
      <Glint t={t} x={MEDAL.x - 1} y={MEDAL.y - 1.5} size={5.5} phase={0.2} />
      <Glint t={t} x={0} y={-86} size={6} phase={1.4} />
      <Glint t={t} x={-50} y={-40} size={4.5} phase={2.5} speed={1} />
      <Glint t={t} x={58} y={-24} size={4} phase={3.6} speed={1.1} />
      <Glint t={t} x={-62} y={30} size={3.5} phase={4.7} />
      <Glint t={t} x={44} y={50} size={4} phase={5.6} speed={0.9} />
    </Group>
  );
}

const TableLegend: ArtBorderDrawing = { back: LegendBack, front: LegendFront };

export const HONOURS_ART: Record<string, ArtBorderDrawing> = {
  "seal-halo": SealKeeper,
  "winter-hearth": LastWinter,
  spymaster: Spymaster,
  "table-legend": TableLegend,
};

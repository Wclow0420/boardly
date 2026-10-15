// Sakura and Meeple Parade, engraved.
//   Sakura — a pale rose-gold ring, engraved with a wave between two
//     grooves, hugged by a dark cherry bough: barked wood with the
//     cherry's pale lenticels, a sawn-off limb at the lower left, fresh
//     leaves and closed buds, and layered five-petal blossoms (notched
//     petals, white to pink, veined, gold stamens) bursting into a big
//     cluster on the picture's top-left edge. Petals fall, turning as
//     they go, in a soft warm light.
//   Meeple Parade — a wooden board-game track round the picture, inlaid
//     with gold (two rings and the spaces between, a ruby on the start
//     space), and the app's glossy mascots marching round it in six
//     player colours, hopping each step with a waddle. The leader
//     carries a pennant; now and then one leaps and twirls.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  ClipOp,
  Circle,
  FillType,
  Group,
  LinearGradient,
  Oval,
  Path,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
  type SkPoint,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import type { EmblemPart } from "@/components/engraved/emblem";
import { recordEmblem } from "@/components/engraved/picture";
import { LEAF, ribbon, type Pt } from "@/components/engraved/shapes";
import { EYES, MOUTHS } from "@/features/mascot/parts/face";
import { BOX, lifted } from "@/features/mascot/rig";
import { COLOURS, SKINS } from "@/features/mascot/skins";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  arcPath,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const DEG = Math.PI / 180;

const f = (n: number) => n.toFixed(2);
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
/** A band between two radii, wound so it has a hole however it's
 *  filled (the Sweep clips to it). */
const band = (outer: number, inner: number) =>
  `${circle(outer)}M${inner} 0A${inner} ${inner} 0 1 0 ${-inner} 0A${inner} ${inner} 0 1 0 ${inner} 0Z`;
/** A point at `d` degrees, radius `r`. */
const at = (d: number, r: number): Pt => [
  Math.cos(d * DEG) * r,
  Math.sin(d * DEG) * r,
];
/** A closed wavy circle: radius r, rising and falling `amp`, `waves`
 *  times round. */
const wavy = (r: number, amp: number, waves: number, phase = 0) =>
  `M${Array.from({ length: 241 }, (_, k) => {
    const a = (k / 240) * TAU;
    const rr = r + amp * Math.sin(a * waves + phase);
    return `${f(Math.cos(a) * rr)} ${f(Math.sin(a) * rr)}`;
  }).join("L")}Z`;

/** An engraved piece: filled with its metal, its veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink,
  vein,
  veinColor,
  veinWidth = 0.8,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors: string[];
  ink: string;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: SkPoint;
  to?: SkPoint;
}) {
  const fill = evenOdd ? "evenOdd" : "winding";
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={colors} />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={veinWidth}
              strokeCap="round"
              color={veinColor ?? ink}
              opacity={0.75}
            />
          ) : null}
          {shine ? (
            <Path
              path={shine}
              style="stroke"
              strokeWidth={1.2}
              strokeCap="round"
              color="#FFFFFF"
              opacity={0.85}
            />
          ) : null}
        </Group>
      ) : null}
      <Path
        path={d}
        fillType={fill}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        color={ink}
      />
    </Group>
  );
}

// ── drawing straight onto a canvas, for the recorded pictures ─────────

const colorsOf = (cs: string[]) => cs.map((c) => Skia.Color(c));
const linear = (x0: number, y0: number, x1: number, y1: number, cs: string[], pos?: number[]) =>
  Skia.Shader.MakeLinearGradient(vec(x0, y0), vec(x1, y1), colorsOf(cs), pos ?? null, TileMode.Clamp);
const radial = (x: number, y: number, r: number, cs: string[], pos?: number[]) =>
  Skia.Shader.MakeRadialGradient(vec(x, y), r, colorsOf(cs), pos ?? null, TileMode.Clamp);

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
  c.drawPath(path, brush(p.fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? Skia.Path.MakeFromSVGString(p.vein) : null;
    if (vein)
      c.drawPath(vein, pen(p.veinWidth ?? 0.5, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75));
    const shine = p.shine ? Skia.Path.MakeFromSVGString(p.shine) : null;
    if (shine)
      c.drawPath(shine, pen(p.shineWidth ?? 0.8, "#FFFFFF", p.shineAlpha ?? 0.7));
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

// ── Sakura ───────────────────────────────────────────────────────────

const ROSE = ["#FFF1EC", "#EDB8A6", "#A86A5C", "#F6D2C4"];
const INK_ROSE = "#4A2018";
const SAKURA_RING = band(57, 50.5);
/** Two grooves with a wave running between them. */
const SAKURA_PATTERN = circle(55.7) + circle(51.8) + wavy(53.75, 1.05, 36);

const WOOD = ["#9A6A48", "#5A3826", "#2E1C12", "#7A5034"];
const INK_WOOD = "#140A04";
const LEAF_GREEN = ["#D8F0A0", "#7AB84A", "#2E6A1E", "#9ACC5A"];
const INK_LEAF = "#14300A";
const INK_PETAL = "#7A2448";

/** The bough runs round the ring from the bottom right (34°) to the top
 *  left (232°), thickest at the lower left where the limb was cut. */
const BOUGH_FROM = 34;
const BOUGH_TO = 232;
const boughR = (d: number) => 61 + Math.sin(d * 0.09) * 1.1;
const boughW = (d: number) => 2.2 + 6 * Math.exp(-(((d - 140) / 68) ** 2));
const BOUGH_DEGS = Array.from(
  { length: 23 },
  (_, k) => BOUGH_FROM + ((BOUGH_TO - BOUGH_FROM) * k) / 22,
);
const BOUGH = ribbon(
  BOUGH_DEGS.map((d) => at(d, boughR(d))),
  BOUGH_DEGS.map(boughW),
);
/** The cherry's bark: pale lenticels across the bough. */
const LENTICELS = Array.from({ length: 20 }, (_, k) => {
  const d = BOUGH_FROM + 6 + k * 9.6 + rnd(k + 40) * 3;
  const r = boughR(d);
  const h = boughW(d) * (0.22 + rnd(k + 9) * 0.12);
  const a = at(d, r - h);
  const b = at(d + 0.4, r + h);
  return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
}).join("");
/** The sawn-off limb, out from the lower left. */
const STUB_PTS: Pt[] = [at(137, 60), at(142, 68.5), at(147.5, 76)];
const STUB = ribbon(STUB_PTS, [7.8, 6.6, 6]);
const STUB_END = STUB_PTS[2];
const STUB_DIR =
  Math.atan2(STUB_PTS[2][1] - STUB_PTS[1][1], STUB_PTS[2][0] - STUB_PTS[1][0]) /
  DEG;

/** [angle°, radius, petal length] — the big cluster first, top left. */
const BLOSSOMS: [number, number, number][] = [
  [224, 60, 11.5],
  [244, 58.5, 9.5],
  [207, 64.5, 9.5],
  [236, 53, 6.5],
  [257, 55.5, 7.5],
  [217, 74.5, 7],
  [194, 72, 6],
  // along the bough
  [172, 68, 7],
  [124, 68, 6.5],
  [97, 67.5, 6],
  // a little cluster, bottom right
  [56, 65, 8.5],
  [71, 71.5, 6.5],
  [41, 72, 6],
];
/** [angle°, radius, length] closed buds, pointing out. */
const BUDS: [number, number, number][] = [
  [266, 63, 6],
  [231, 73, 6],
  [203, 80, 5.5],
  [154, 69.5, 5.5],
  [110, 70, 5.5],
  [84, 69.5, 5],
  [29, 67.5, 5.5],
];
/** [angle°, radius, length, width, lean] fresh leaves. */
const LEAVES: [number, number, number, number, number][] = [
  [186, 64, 12, 4.4, -0.75],
  [163, 64.5, 11, 4, 0.6],
  [117, 64.5, 11, 4, -0.65],
  [90, 64, 10, 3.8, 0.7],
  [63, 63.5, 10, 3.6, -0.6],
  [250, 62, 10, 3.6, 0.85],
];
/** A twig from the bough to each blossom and bud standing off it. */
const TWIGS = [...BLOSSOMS, ...BUDS]
  .filter(([, r]) => r > 64)
  .map(([d, r]) => {
    const root = d > 140 ? d - 7 : d + 7;
    const mid = (d + root) / 2;
    return ribbon(
      [at(root, boughR(root)), at(mid, (boughR(root) + r) / 2 + 1.2), at(d, r)],
      [2.4, 1.7, 1.1],
    );
  });

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

function drawBlossom(c: SkCanvas, x: number, y: number, L: number, spin: number) {
  c.save();
  c.translate(x, y);
  c.rotate(spin, 0, 0);
  const ink = L >= 9 ? 0.75 : 0.6;
  // the second layer of petals, behind and between
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
  // the eye and the stamens, gold-tipped
  const eye = Skia.Path.Make();
  eye.addCircle(0, 0, L * 0.2);
  c.drawPath(eye, brush(radial(0, 0, L * 0.2, ["#FF9ABA", "#C22A5A"])));
  const n = L >= 8 ? 9 : 6;
  const stem = pen(L >= 9 ? 0.45 : 0.38, "#B23A60");
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.3;
    const r = L * (0.4 + 0.1 * ((k * 7) % 3) / 2);
    const tip = polar(a, r);
    const base = polar(a, L * 0.1);
    c.drawLine(base.x, base.y, tip.x, tip.y, stem);
  }
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.3;
    const r = L * (0.4 + 0.1 * ((k * 7) % 3) / 2);
    const tip = polar(a, r);
    const s = L >= 9 ? 0.75 : 0.6;
    const dot = Skia.Path.Make();
    dot.addCircle(tip.x, tip.y, s);
    c.drawPath(dot, brush(radial(tip.x - s * 0.3, tip.y - s * 0.3, s * 1.6, GOLD.slice(0, 3))));
    c.drawPath(dot, pen(0.25, "#6A4410"));
  }
  c.restore();
}

function drawBud(c: SkCanvas, d: number, r: number, len: number) {
  const [x, y] = at(d, r);
  c.save();
  c.translate(x, y);
  c.rotate(d + 90, 0, 0);
  engrave(c, {
    d: LEAF(len, len * 0.42),
    fill: linear(0, 0, 0, -len, ["#D8406E", "#F48AAE", "#FFDCE8"]),
    ink: INK_PETAL,
    width: 0.6,
    vein: `M0 ${f(-len * 0.3)}Q${f(len * 0.14)} ${f(-len * 0.6)} 0 ${f(-len * 0.92)}`,
    veinColor: "#B03060",
    veinWidth: 0.35,
    shine: `M${f(-len * 0.2)} ${f(-len * 0.4)}Q${f(-len * 0.22)} ${f(-len * 0.62)} ${f(-len * 0.08)} ${f(-len * 0.8)}`,
    shineWidth: 0.5,
  });
  // the sepals' cup
  const s = len * 0.36;
  engrave(c, {
    d: `M${f(-s)} 0.6Q${f(-s * 1.15)} ${f(-len * 0.3)} ${f(-s * 0.3)} ${f(-len * 0.44)}L0 ${f(-len * 0.22)}L${f(s * 0.3)} ${f(-len * 0.44)}Q${f(s * 1.15)} ${f(-len * 0.3)} ${f(s)} 0.6Z`,
    fill: linear(0, 0, 0, -len * 0.44, ["#5A2418", "#A85040"]),
    ink: "#2A0C06",
    width: 0.5,
  });
  c.restore();
}

function drawLeaf(c: SkCanvas, d: number, r: number, len: number, w: number, lean: number) {
  const [x, y] = at(d, r);
  c.save();
  c.translate(x, y);
  c.rotate(d + 90 + lean / DEG, 0, 0);
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
    shine: `M${f(-w * 0.45)} ${f(-len * 0.3)}Q${f(-w * 0.6)} ${f(-len * 0.6)} ${f(-w * 0.15)} ${f(-len * 0.85)}`,
    shineWidth: 0.55,
  });
  c.restore();
}

/** The bough, its leaves, buds and blossoms, recorded once. */
function recordSakura(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  const bark = linear(-70, -70, 70, 70, WOOD);
  // the bough's shadow on the ring
  c.save();
  c.translate(1.2, 1.8);
  for (const d of [BOUGH.outline, STUB.outline]) {
    const p = Skia.Path.MakeFromSVGString(d);
    if (p) c.drawPath(p, brush("#2A0A10", 0.4));
  }
  c.restore();
  for (const twig of TWIGS)
    engrave(c, { d: twig.outline, fill: bark, ink: INK_WOOD, width: 0.7 });
  engrave(c, {
    d: STUB.outline,
    fill: bark,
    ink: INK_WOOD,
    width: 1,
    vein: STUB.grooves,
    veinColor: "#1A0E08",
    veinWidth: 0.55,
  });
  // the sawn end: pale end grain with its rings
  c.save();
  c.translate(STUB_END[0], STUB_END[1]);
  c.rotate(STUB_DIR, 0, 0);
  const end = Skia.Path.Make();
  end.addOval(Skia.XYWHRect(-1.8, -3.1, 3.6, 6.2));
  c.drawPath(end, brush(radial(-0.4, -0.8, 3.4, ["#F4DAB0", "#C8925A"])));
  const rings = Skia.Path.Make();
  rings.addOval(Skia.XYWHRect(-1.1, -2, 2.2, 4));
  rings.addOval(Skia.XYWHRect(-0.5, -0.9, 1, 1.8));
  c.drawPath(rings, pen(0.35, "#8A5A2E"));
  c.drawPath(end, pen(0.9, INK_WOOD));
  c.restore();
  engrave(c, {
    d: BOUGH.outline,
    fill: bark,
    ink: INK_WOOD,
    width: 1.1,
    vein: BOUGH.grooves,
    veinColor: "#1A0E08",
    veinWidth: 0.6,
    shine: BOUGH.shine,
    shineAlpha: 0.4,
  });
  // the lenticels, cut pale across the bark
  const marks = Skia.Path.MakeFromSVGString(LENTICELS);
  if (marks) c.drawPath(marks, pen(0.75, "#D8B48A", 0.55));
  for (const [d, r, len, w, lean] of LEAVES) drawLeaf(c, d, r, len, w, lean);
  for (const [d, r, len] of BUDS) drawBud(c, d, r, len);
  [...BLOSSOMS]
    .map((b, k) => ({ b, k }))
    .sort((p, q) => p.b[2] - q.b[2])
    .forEach(({ b: [d, r, L], k }) => {
      const [x, y] = at(d, r);
      drawBlossom(c, x, y, L, rnd(k + 3) * 72);
    });
  return recorder.finishRecordingAsPicture();
}

let SAKURA: SkPicture | null = null;
const sakuraPicture = () => (SAKURA ??= recordSakura());

/** A falling petal. */
const LOOSE_L = 6.2;
const LOOSE = petal(LOOSE_L);

function FallingPetal({ t, i, x0, drift }: { t: Clock; i: number; x0: number; drift: number }) {
  const life = 5.5 + rnd(i) * 3;
  const offset = rnd(i + 2) * life;
  const spin = i % 2 ? 1 : -1;
  const transform = useDerivedValue(() => {
    const T = t.value;
    const p = ((T + offset) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 5 + i) * 6 + drift * p },
      { translateY: -80 + p * 160 },
      { rotate: spin * p * 5 + i },
      // turning over as it falls
      { scaleX: Math.cos(T * 3.1 + i * 1.7) },
      { translateY: LOOSE_L / 2 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + offset) % life) / life;
    return Math.sin(p * Math.PI) ** 0.7 * 0.95;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={LOOSE}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, -LOOSE_L)}
          colors={["#F06A98", "#FFC8DA", "#FFFFFF"]}
        />
      </Path>
      <Path path={LOOSE} style="stroke" strokeWidth={0.55} color={INK_PETAL} />
    </Group>
  );
}

/** Petals falling outside the picture, down both sides. */
const FRONT_PETALS = Array.from({ length: 8 }, (_, i) => ({
  i,
  x0: (i % 2 ? 1 : -1) * (60 + rnd(i + 20) * 20),
  drift: (i % 2 ? 1 : -1) * 5,
}));
/** And a few behind it. */
const BACK_PETALS = Array.from({ length: 3 }, (_, i) => ({
  i: i + 10,
  x0: -40 + i * 40 + rnd(i + 30) * 10,
  drift: 6,
}));

function SakuraBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.1 + 0.04 * Math.sin(t.value * 1.1));
  return (
    <Group>
      <Halo r={84} color="#FFD0C0" opacity={glow} />
      {/* warm light round the cluster */}
      <Circle cx={-44} cy={-42} r={30} color="#FFD6C8" opacity={0.4}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      {BACK_PETALS.map((p) => (
        <FallingPetal key={p.i} t={t} {...p} />
      ))}
    </Group>
  );
}

function SakuraFront({ t }: { t: Clock }) {
  const picture = useMemo(() => sakuraPicture(), []);
  const sway = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 0.9) * 0.012 },
  ]);
  const cluster = at(224, 60);
  const shine = at(300, 54);
  return (
    <Group>
      <Metal
        d={SAKURA_RING}
        evenOdd
        colors={ROSE}
        ink={INK_ROSE}
        width={1.2}
        vein={SAKURA_PATTERN}
        veinColor="#9A5444"
        veinWidth={0.6}
        shine={arcPath(56.2, -78 * DEG, -18 * DEG)}
      />
      <Sweep t={t} d={SAKURA_RING} evenOdd every={4.6} />
      <Group transform={sway}>
        <Picture picture={picture} />
      </Group>
      {FRONT_PETALS.map((p) => (
        <FallingPetal key={p.i} t={t} {...p} />
      ))}
      <Glint t={t} x={shine[0]} y={shine[1]} size={4.5} phase={0.8} />
      <Glint t={t} x={cluster[0]} y={cluster[1]} size={5} phase={2.6} speed={1} />
    </Group>
  );
}

// ── Meeple Parade ────────────────────────────────────────────────────

const TRACK_IN = 50.5;
const TRACK_OUT = 61.5;
const TRACK = band(TRACK_OUT, TRACK_IN);
const TRACK_WOOD = ["#DCA86C", "#A06A36", "#5E3A1A", "#BC844A"];
const INK_TRACK = "#2A1808";
/** The grain of the wood, running round. */
const GRAIN =
  wavy(53.9, 0.35, 11, 0.4) +
  wavy(55.3, 0.45, 7, 2.1) +
  wavy(57.1, 0.4, 9, 4.2) +
  wavy(58.4, 0.3, 13, 1.3);
/** The gold inlay: a ring at each edge and the bars between the spaces,
 *  the start space (with its ruby) straight up. */
const INLAY =
  circle(60.25) +
  circle(59.15) +
  circle(52.85) +
  circle(51.75) +
  Array.from({ length: 24 }, (_, k) => {
    const d = k * 15 + 7.5;
    const h = 0.55 / 56;
    const a = at(d - h / DEG, 53.4);
    const b = at(d - h / DEG, 58.6);
    const cc = at(d + h / DEG, 58.6);
    const e = at(d + h / DEG, 53.4);
    return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(cc[0])} ${f(cc[1])}L${f(e[0])} ${f(e[1])}Z`;
  }).join("");

const MARCH_R = 61; // where their feet are
const MARCH_SCALE = 0.235;
const FOOT_Y = 118.4; // the soles, in the mascot's box
const SPEED = 0.22; // radians a second, anticlockwise
const STEP = 7; // the hop's beat
const PARADE = [
  COLOURS.blue,
  COLOURS.red,
  COLOURS.orange,
  COLOURS.yellow,
  COLOURS.green,
  COLOURS.purple,
];
const N = PARADE.length;
const BIG_EVERY = 4.5;

/** A glossy mascot with dot eyes and a smile, inked a little heavier
 *  than usual so it holds up at a fifth of its size. The ground under
 *  it goes: the track draws its own shadow. */
function marcherParts(colour: string): EmblemPart[] {
  const body = SKINS.glossy.draw(colour).slice(1);
  const face = [...EYES.dots.draw({ colour }), ...MOUTHS.smile.draw({ colour })];
  return lifted([...body, ...face]).map((part) =>
    "d" in part && (part.ink ?? 1.5) > 0
      ? { ...part, ink: (part.ink ?? 1.5) * 1.8 }
      : part,
  );
}

const MARCHERS = new Map<string, SkPicture>();
function marcherPicture(colour: string) {
  let picture = MARCHERS.get(colour);
  if (!picture) {
    picture = recordEmblem(marcherParts(colour), undefined, BOX);
    MARCHERS.set(colour, picture);
  }
  return picture;
}

/** Where marcher i is: its angle, how high it is off the track, its
 *  waddle, squash and twirl. */
const pose = (T: number, i: number) => {
  "worklet";
  // the flag bearer leads; the rest follow in rainbow order
  const a = -Math.PI / 2 + (i * TAU) / N - T * SPEED;
  const ph = T * STEP + i * 1.3;
  const s = Math.sin(ph);
  let lift = Math.abs(s) * 2.4;
  let twirl = 1;
  // now and then one of them (never the flag bearer) leaps and twirls
  const slot = Math.floor(T / BIG_EVERY);
  const who = 1 + ((slot * 2) % (N - 1));
  const into = T - slot * BIG_EVERY;
  if (i === who && into < 0.9) {
    const p = into / 0.9;
    lift += Math.sin(p * Math.PI) * 5;
    twirl = Math.cos(p * TAU);
  }
  return {
    a,
    lift,
    tilt: s * 0.12,
    squash: 1 - 0.05 * Math.cos(2 * ph),
    twirl,
  };
};

const PENNANT = "M88 9L122 15.5L112.5 22L122 28.5L88 34Z";
const POLE = "M84 7H88.4V84H84Z";

function Pennant({ t }: { t: Clock }) {
  const wave = useDerivedValue(() => [
    { translateX: 88 },
    { scaleX: 0.86 + 0.14 * Math.sin(t.value * 6) },
    { skewY: 0.08 * Math.sin(t.value * 6 + 1) },
    { translateX: -88 },
  ]);
  return (
    <Group>
      <Metal d={POLE} colors={GOLD} ink={INK_GOLD} width={2.4} from={vec(84, 0)} to={vec(88, 0)} />
      <Group transform={wave}>
        <Metal
          d={PENNANT}
          colors={["#FF9AA6", "#C2203A", "#6A0A18", "#E05A6A"]}
          ink="#3A0408"
          width={2.6}
          from={vec(88, 9)}
          to={vec(122, 34)}
          vein="M92 21.5L114 22"
          veinColor="#7A1020"
          veinWidth={2}
          shine="M91 13L108 16"
        />
      </Group>
      <Circle cx={86.2} cy={5} r={4.4} color={INK_GOLD} />
      <Circle cx={86.2} cy={5} r={3.4}>
        <LinearGradient start={vec(83, 2)} end={vec(89, 8)} colors={GOLD} />
      </Circle>
    </Group>
  );
}

function Marcher({ t, i }: { t: Clock; i: number }) {
  const picture = useMemo(() => marcherPicture(PARADE[i]), [i]);
  const transform = useDerivedValue(() => {
    const p = pose(t.value, i);
    const at0 = polar(p.a, MARCH_R + p.lift);
    return [
      { translateX: at0.x },
      { translateY: at0.y },
      // head out, feet on the track
      { rotate: p.a + Math.PI / 2 + p.tilt },
      { scaleX: MARCH_SCALE * (2 - p.squash) * p.twirl },
      { scaleY: MARCH_SCALE * p.squash },
      { translateX: -50 },
      { translateY: -FOOT_Y },
    ];
  });
  return (
    <Group transform={transform}>
      <Picture picture={picture} />
      {i === 0 ? <Pennant t={t} /> : null}
    </Group>
  );
}

function MarcherShadow({ t, i }: { t: Clock; i: number }) {
  const transform = useDerivedValue(() => {
    const p = pose(t.value, i);
    const g = polar(p.a, MARCH_R - 0.4);
    const k = 1 - p.lift * 0.05;
    return [
      { translateX: g.x },
      { translateY: g.y },
      { rotate: p.a + Math.PI / 2 },
      { scaleX: k },
    ];
  });
  return (
    <Group transform={transform}>
      <Oval x={-6.8} y={-1.5} width={13.6} height={3} color="#1A0E04" opacity={0.45} />
    </Group>
  );
}

function ParadeBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.08 + 0.03 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={92} color="#FFD89A" opacity={glow} />
      {/* the track's thickness */}
      <Group transform={[{ translateX: 1.4 }, { translateY: 2.4 }]}>
        <Path path={TRACK} fillType="evenOdd" color="#1A0E04" opacity={0.7} />
      </Group>
    </Group>
  );
}

function ParadeFront({ t }: { t: Clock }) {
  const ruby = at(270, 56);
  const glint = at(318, 59.7);
  return (
    <Group>
      <Metal
        d={TRACK}
        evenOdd
        colors={TRACK_WOOD}
        ink={INK_TRACK}
        width={1.3}
        vein={GRAIN}
        veinColor="#4A2C12"
        veinWidth={0.55}
      />
      <Metal
        d={INLAY}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        width={0.45}
        shine={arcPath(59.7, -165 * DEG, -110 * DEG)}
      />
      <Sweep t={t} d={TRACK} evenOdd every={4.8} />
      <Circle cx={ruby[0]} cy={ruby[1]} r={3.3} color={INK_GOLD} />
      <Circle cx={ruby[0]} cy={ruby[1]} r={2.6}>
        <LinearGradient start={vec(ruby[0] - 3, ruby[1] - 3)} end={vec(ruby[0] + 3, ruby[1] + 3)} colors={GOLD} />
      </Circle>
      <Gem x={ruby[0]} y={ruby[1]} w={3.8} h={3.8} colors={["#FF9AA6", "#D0102E", "#5A0410"]} />
      {PARADE.map((_, i) => (
        <MarcherShadow key={i} t={t} i={i} />
      ))}
      {PARADE.map((_, i) => (
        <Marcher key={i} t={t} i={i} />
      ))}
      <Glint t={t} x={ruby[0]} y={ruby[1]} size={4.5} phase={0.5} />
      <Glint t={t} x={glint[0]} y={glint[1]} size={3.5} phase={2.7} speed={1} />
    </Group>
  );
}

export const GARDEN_ART: Record<string, ArtBorderDrawing> = {
  sakura: { back: SakuraBack, front: SakuraFront },
  "meeple-parade": { back: ParadeBack, front: ParadeFront },
};

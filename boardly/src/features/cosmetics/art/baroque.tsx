// Baroque Silver: an engraved cartouche. A beaded silver ring with a
// twisted cable sits over the picture's edge; on it two thick acanthus
// bands, cut deep with grooves, meet in a bud at the top and, at the
// foot, in a scallop shell with two pointed leaves below. Great scrolls
// curl out at the upper corners, and leafy fronds fan out at the lower
// sides, swaying one after another. A sapphire in a silver collet sits
// in the bud, and the light runs over all the silver at once.

import {
  BlurMask,
  Circle,
  ClipOp,
  FillType,
  Group,
  PaintStyle,
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

import {
  LEAF,
  acanthus,
  curl,
  fmt,
  frond,
  ribbon,
  type Pt,
} from "@/components/engraved/shapes";

import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const INK = "#1E242C";
const GROOVE = "#3E4856";
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const DEG = Math.PI / 180;

// ── the shapes (the right half; the left is its mirror image) ─────────

/** Mirrors path data made only of absolute M/L points (ribbons, curls). */
const mirror = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-x} ${y}`);
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;

/** The ring under the bands, laid over the picture's edge. */
const RING_IN = 48.5;
const RING_OUT = 59;
const RING = circle(RING_OUT) + circle(RING_IN);

const BAND = ribbon(
  [
    [2, -56],
    [18, -60],
    [36, -54.5],
    [50, -41],
    [58, -23],
    [59, 0],
    [55, 19],
    [46, 35],
    [34, 47],
    [19, 56],
    [6, 63],
    [1, 70],
  ],
  [5, 10, 15, 15, 12, 10, 12, 13, 11, 8, 5, 2],
);

const SCROLLS = [
  // the great scroll at the upper corner
  ...acanthus(50, -34, -1.45, 84, 7.4, 16, true),
  // a smaller one curling out below the side
  ...acanthus(58, 22, 0.3, 50, 6.8, 12, true),
];

/** The fronds fanned at the lower side, from out to down. */
const FRONDS = [
  { dir: -10, len: 46, w: 8 },
  { dir: 18, len: 42, w: 7.5 },
  { dir: 46, len: 36, w: 7 },
  { dir: 74, len: 28, w: 6 },
].map((f) => ({ ...f, dir: f.dir * DEG }));
const FROND_ROOT: Pt = [50, 42];
const LOBES = 5;

/** A frond's midrib and a vein out to every lobe. */
function frondVeins(len: number, w: number) {
  const width = (s: number) =>
    w * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.7);
  let d = `M0 -1L0 ${(-len * 0.9).toFixed(2)}`;
  for (let j = 0; j < LOBES - 1; j++) {
    const s0 = j / LOBES + 0.03;
    const s1 = (j + 0.8) / LOBES;
    const x = width(s1) * 0.72;
    const from = `M0 ${(-len * s0).toFixed(2)}`;
    d += `${from}L${fmt([x, -len * s1])}${from}L${fmt([-x, -len * s1])}`;
  }
  return d;
}

/** The bud on top: two small curls opening out of the bands. */
const BUD = curl(0, -58, -1.75, 22, 4.4, 6);
/** The pointed leaf at the foot, leaning in to meet its twin. */
const FOOT = frond(26, 6, 4);

/** The scallop shell at the foot, hinged on the ring, fanning down over
 *  the place where the two bands meet. */
const SHELL = (() => {
  const hinge: Pt = [0, 51];
  const N = 7;
  const R = 15;
  const a0 = 28 * DEG;
  const a1 = 152 * DEG;
  const at = (a: number, r: number): Pt => [
    hinge[0] + Math.cos(a) * r,
    hinge[1] + Math.sin(a) * r,
  ];
  let outline = `M${fmt(hinge)}L${fmt(at(a0, R * 0.84))}`;
  let ribs = "";
  for (let j = 0; j < N; j++) {
    const s = a0 + ((a1 - a0) * j) / N;
    const e = a0 + ((a1 - a0) * (j + 1)) / N;
    const m = (s + e) / 2;
    outline += `Q${fmt(at(m, R * 1.14))} ${fmt(at(e, R * 0.84))}`;
    ribs += `M${fmt(at(m, 3.2))}L${fmt(at(m, R * 0.98))}`;
  }
  return { outline: `${outline}Z`, ribs };
})();

// ── recording the still silver, once ──────────────────────────────────

const colorsOf = (cs: string[]) => cs.map((c) => Skia.Color(c));
const linear = (x0: number, y0: number, x1: number, y1: number, cs: string[]) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    colorsOf(cs),
    null,
    TileMode.Clamp,
  );
const radial = (x: number, y: number, r: number, cs: string[]) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    colorsOf(cs),
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

const metal = () => linear(-30, -78, 30, 78, SILVER);

/** A line cut into the silver: dark, with light catching its lower
 *  edge. `sx` is -1 on the mirrored half, so the light stays put. */
function cut(c: SkCanvas, d: string, width: number, sx = 1) {
  const p = Skia.Path.MakeFromSVGString(d);
  if (!p) return;
  c.save();
  c.translate(0.5 * sx, 0.6);
  c.drawPath(p, pen(width * 0.85, "#FFFFFF", 0.85));
  c.restore();
  c.drawPath(p, pen(width, GROOVE, 0.95));
}

/** A silver piece: its shadow, the metal, its cuts and shine, the ink. */
function engrave(
  c: SkCanvas,
  d: string,
  opts: {
    vein?: string;
    veinWidth?: number;
    shine?: string;
    width?: number;
    shadow?: boolean;
    evenOdd?: boolean;
    sx?: number;
  } = {},
) {
  const path = Skia.Path.MakeFromSVGString(d);
  if (!path) return;
  const sx = opts.sx ?? 1;
  if (opts.evenOdd) path.setFillType(FillType.EvenOdd);
  if (opts.shadow) {
    c.save();
    c.translate(1 * sx, 1.5);
    c.drawPath(path, brush("#06090E", 0.45));
    c.restore();
  }
  c.drawPath(path, brush(metal()));
  c.save();
  c.clipPath(path, ClipOp.Intersect, true);
  if (opts.vein) cut(c, opts.vein, opts.veinWidth ?? 0.75, sx);
  const shine = opts.shine ? Skia.Path.MakeFromSVGString(opts.shine) : null;
  if (shine) c.drawPath(shine, pen(1.2, "#FFFFFF", 0.85));
  c.restore();
  c.drawPath(path, pen(opts.width ?? 1.2, INK));
}

/** The beaded ring with its twisted cable. */
function drawRing(c: SkCanvas) {
  engrave(c, RING, { evenOdd: true, width: 1.3 });
  // a groove between the beads and the cable
  cut(c, circle(53.7), 0.8);
  // the cable: strands twisting round between two grooves
  const strands = 64;
  let rope = "";
  for (let k = 0; k < strands; k++) {
    const a = (k / strands) * TAU;
    const p0 = polar(a, 54.5);
    const p1 = polar(a + 2.4 * DEG, 56.6);
    const p2 = polar(a + 4.2 * DEG, 58.4);
    rope += `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}Q${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  cut(c, rope, 0.7);
  // the beads round the inner edge, each a domed pearl of silver
  const beads = 56;
  for (let k = 0; k < beads; k++) {
    const p = polar((k / beads) * TAU, 51.5);
    c.drawCircle(p.x + 0.35, p.y + 0.5, 1.5, brush("#141A22", 0.45));
    c.drawCircle(
      p.x,
      p.y,
      1.45,
      brush(radial(p.x - 0.5, p.y - 0.6, 2.4, ["#FFFFFF", "#C9D0DA", "#5A6474"])),
    );
    c.drawCircle(p.x, p.y, 1.45, pen(0.4, INK, 0.8));
  }
}

function drawFrontHalf(c: SkCanvas, sx: number) {
  c.save();
  c.scale(sx, 1);
  engrave(c, BAND.outline, {
    vein: BAND.grooves,
    veinWidth: 0.9,
    shine: BAND.shine,
    width: 1.3,
    shadow: true,
    sx,
  });
  // the foot's pointed leaf
  c.save();
  c.translate(5, 62);
  c.rotate((Math.PI + 0.2) / DEG, 0, 0);
  engrave(c, FOOT, { vein: "M0 -2L0 -22", veinWidth: 0.7, width: 1, sx });
  c.restore();
  engrave(c, BUD.outline, { vein: BUD.vein, width: 1.1, sx });
  c.restore();
}

function recordFront(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  drawRing(c);
  drawFrontHalf(c, 1);
  drawFrontHalf(c, -1);
  engrave(c, SHELL.outline, { vein: SHELL.ribs, width: 1.1, shadow: true });
  // the shell's hinge: a silver pearl
  c.drawCircle(0, 52.5, 2.4, brush(radial(-0.8, 51.6, 3.6, ["#FFFFFF", "#C9D0DA", "#5A6474"])));
  c.drawCircle(0, 52.5, 2.4, pen(0.7, INK));
  // the bud's centre: a leaf rising behind the sapphire, and its collet
  c.save();
  c.translate(0, -56);
  engrave(c, LEAF(20, 6), { vein: "M0 -2L0 -16", width: 1 });
  c.restore();
  const collet = Skia.Path.Make();
  collet.addOval(Skia.XYWHRect(-5.6, -69.6, 11.2, 13.2));
  c.drawPath(collet, brush(metal()));
  c.drawPath(collet, pen(1, INK));
  return recorder.finishRecordingAsPicture();
}

function recordScrolls(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  for (const sx of [1, -1]) {
    c.save();
    c.scale(sx, 1);
    for (const s of SCROLLS)
      engrave(c, s.outline, { vein: s.vein, veinWidth: 0.75, width: 1.2, sx });
    c.restore();
  }
  return recorder.finishRecordingAsPicture();
}

function recordFrond(len: number, w: number): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-12, -52, 24, 56));
  engrave(c, frond(len, w, LOBES), {
    vein: frondVeins(len, w),
    veinWidth: 0.6,
    width: 1.1,
  });
  return recorder.finishRecordingAsPicture();
}

let FRONT: SkPicture | null = null;
let SCROLL_PIC: SkPicture | null = null;
let FROND_PICS: SkPicture[] | null = null;

// The light runs over everything at once, both halves.
const SWEEP_BACK = SCROLLS.map((s) => s.outline + mirror(s.outline)).join("");
const SWEEP_FRONT =
  BAND.outline +
  mirror(BAND.outline) +
  BUD.outline +
  mirror(BUD.outline) +
  SHELL.outline;
const EVERY = 4.5;

// ── the layers ─────────────────────────────────────────────────────────

function Frond({
  t,
  k,
  side,
  picture,
}: {
  t: Clock;
  k: number;
  side: 1 | -1;
  picture: SkPicture;
}) {
  const f = FRONDS[k];
  // a wave passes along the fan, frond after frond
  const transform = useDerivedValue(() => {
    const sway =
      Math.sin(t.value * 1.3 - k * 0.55 + (side < 0 ? 0.9 : 0)) * 0.05;
    return [
      { scaleX: side },
      { translateX: FROND_ROOT[0] },
      { translateY: FROND_ROOT[1] },
      { rotate: f.dir + Math.PI / 2 + sway },
    ];
  });
  return (
    <Group transform={transform}>
      <Picture picture={picture} />
    </Group>
  );
}

function BaroqueBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.32 + 0.1 * Math.sin(t.value * 1.2));
  const scrolls = useMemo(() => (SCROLL_PIC ??= recordScrolls()), []);
  const fronds = useMemo(
    () => (FROND_PICS ??= FRONDS.map((f) => recordFrond(f.len, f.w))),
    [],
  );
  return (
    <Group>
      <Halo r={92} color="#CFE0FF" opacity={glow} />
      {/* the fronds, the ones nearest the foot on top */}
      {([1, -1] as const).map((side) =>
        FRONDS.map((_, k) => (
          <Frond
            key={`${side}-${k}`}
            t={t}
            k={k}
            side={side}
            picture={fronds[k]}
          />
        )),
      )}
      <Picture picture={scrolls} />
      <Sweep t={t} d={SWEEP_BACK} every={EVERY} />
    </Group>
  );
}

function BaroqueFront({ t }: { t: Clock }) {
  const picture = useMemo(() => (FRONT ??= recordFront()), []);
  const shine = useDerivedValue(() => 0.45 + 0.4 * Math.sin(t.value * 2.2));
  return (
    <Group>
      {/* the frame's shadow falling on the picture's edge */}
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
      <Picture picture={picture} />
      <Sweep t={t} d={RING} evenOdd every={EVERY} />
      <Sweep t={t} d={SWEEP_FRONT} every={EVERY} />
      {/* the sapphire */}
      <Circle cx={0} cy={-63} r={7.5} color="#5AA8FF" opacity={shine}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={-63}
        w={7}
        h={9}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
      <Glint t={t} x={0} y={-63} size={5.5} phase={0.5} speed={1} />
      <Glint t={t} x={-38} y={-40} size={4} phase={1.4} speed={1.05} />
      <Glint t={t} x={-62} y={-50} size={4} phase={1.9} speed={1.1} />
      <Glint t={t} x={58} y={10} size={4} phase={3.2} speed={0.9} />
      <Glint t={t} x={0} y={62} size={3.5} phase={4.4} speed={0.95} />
    </Group>
  );
}

export const BAROQUE_ART = {
  "baroque-silver": {
    back: BaroqueBack,
    front: BaroqueFront,
  } satisfies ArtBorderDrawing,
};

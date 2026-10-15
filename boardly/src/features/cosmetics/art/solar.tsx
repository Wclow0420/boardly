// Sun Blaze and Phoenix, enhanced in the house's engraved style.
//   Sun Blaze — the living ring of fire, now rooted on a thin engraved
//     gold solar ring (fine rays cut round it) that the flames lick
//     across. Behind, the sun's flames stream outward through a streaked
//     corona; now and then a flare leaps off the rim in an arc of fire
//     and falls back. Embers rise.
//   Phoenix — burning wings beat slowly behind a gold ring of flame
//     filigree: three rows of cloisonné feathers, crimson through orange
//     to gold, each edged in gold with its quill and barbs cut in and fire
//     at the long ones' tips. The tail fans below, its plumes ending in
//     eye-spots; a ruby sits where it meets the ring. The fire rim and the
//     flame plume burn on top. No head.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  ClipOp,
  FillType,
  Group,
  PaintStyle,
  Picture,
  RadialGradient,
  Rect,
  Shader,
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

import { FEATHER, curl, type Pt } from "@/components/engraved/shapes";
import { Fire } from "@/components/iso";
import { NOISE } from "@/components/iso/noise";
import { Gem, Sweep } from "./crowns";
import { FireRim } from "./rims";
import {
  Flicker,
  Glint,
  Halo,
  Sparks,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_FLAME = "#4A0C04";
const DEG = Math.PI / 180;

const f2 = (n: number) => n.toFixed(2);
const pt = (p: { x: number; y: number }) => `${f2(p.x)} ${f2(p.y)}`;
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
/** An arc of radius r from a0 to a1 (degrees), as an open line. */
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${pt(p)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${pt(q)}`;
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
  /** A gold wire laid along the edge, inside the ink (cloisonné). */
  edge?: string;
  edgeWidth?: number;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = Skia.Path.MakeFromSVGString(p.d);
  if (!path) return;
  if (p.evenOdd) path.setFillType(FillType.EvenOdd);
  c.drawPath(path, brush(p.fill));
  if (p.vein || p.shine || p.edge) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    if (p.edge) c.drawPath(path, pen((p.edgeWidth ?? 1) * 2, p.edge));
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
        pen(p.shineWidth ?? 0.9, "#FFFFFF", p.shineAlpha ?? 0.75),
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

// ══ Sun Blaze ════════════════════════════════════════════════════════

/** The sun behind: a corona streaked outward, the flames streaming off
 *  the rim (as ever), and every few seconds a flare: an arc of fire that
 *  leaps off the rim at some point round it, loops out and falls back. */
const SUN_BACK = `
uniform float t;
${NOISE}
float h1(float n) { return fract(n * 0.618034 + 0.86); }
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 47.0) return half4(0.0);
  vec2 dir = xy / r;

  // the corona: a warm haze, streaked outward, past the flames
  float streak = fbm(dir * 5.0 + vec2(-t * 0.07, t * 0.05));
  float corona = exp(-(r - 50.0) / 15.0) * (0.3 + 0.7 * streak) * 0.6;
  corona *= 1.0 - smoothstep(84.0, 93.0, r);
  vec3 col = vec3(1.0, 0.5, 0.12) * corona;
  float alpha = corona;

  // the flames, streaming outward, seamless all the way round
  float h = (r - 49.0) / 40.0;
  if (h <= 1.0) {
    float s = h * 2.4 - t * 1.5;
    float n = fbm(dir * 2.6 + vec2(s, s * 0.7));
    float tip = 0.42 + 0.58 * fbm(dir * 3.4 + vec2(t * 0.35, -t * 0.2));
    float heat = (1.0 - h / tip) * (0.55 + n * 0.9);
    heat = max(heat, (1.0 - smoothstep(0.0, 0.16, h)) * 0.9);
    vec3 fc = mix(vec3(0.95, 0.18, 0.02), vec3(1.0, 0.62, 0.12), smoothstep(0.15, 0.5, heat));
    fc = mix(fc, vec3(1.0, 0.95, 0.72), smoothstep(0.55, 0.95, heat));
    float a = smoothstep(0.04, 0.32, heat);
    col = fc * a + col * (1.0 - a);
    alpha = a + alpha * (1.0 - a);
  }

  // the flare
  float P = 4.6;
  float k = floor(t / P);
  float q = fract(t / P) / 0.6;
  if (q < 1.0) {
    float ac = h1(k) * 6.2832;
    vec2 cd = vec2(cos(ac), sin(ac));
    float da = atan(cd.x * dir.y - cd.y * dir.x, dot(cd, dir));
    float hw = 0.32 + 0.12 * h1(k + 3.1);
    float u = (da + hw) / (2.0 * hw);
    if (u > 0.0 && u < 1.0) {
      // it leaps up and over, then sinks a little as it drains back
      float H = 28.0 * smoothstep(0.0, 0.4, q) * (0.6 + 0.4 * (1.0 - smoothstep(0.45, 1.0, q)));
      float arch = sin(3.14159 * u);
      float wob = fbm(vec2(u * 3.0 + t * 0.7, k));
      float rc = 54.0 + H * arch + (wob - 0.5) * 6.0 * arch;
      float slope = H * 3.14159 * cos(3.14159 * u) / (2.0 * hw * r);
      float dist = abs(r - rc) / sqrt(1.0 + slope * slope);
      // plasma streaming along it, torn at the edges
      float n = fbm(vec2(u * 9.0 - t * 3.5, r * 0.18 + t * 0.6));
      float n2 = fbm(xy * 0.22 + vec2(t * 1.3, -t));
      // the fire runs out along it from one foot, and drains from it
      float head = smoothstep(0.0, 0.4, q) * 1.15;
      float tail = smoothstep(0.5, 1.0, q) * 1.15 - 0.1;
      float vis = (1.0 - smoothstep(head - 0.15, head, u)) * smoothstep(tail - 0.15, tail, u);
      float th = (4.2 + 2.4 * arch) * (0.55 + 0.9 * n) + (n2 - 0.5) * 3.0;
      float heat = (1.0 - dist / max(th, 0.5)) * (0.55 + 0.9 * n) * vis;
      float ends = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.9, 1.0, u));
      float glow = exp(-dist / 7.0) * 0.45 * vis * ends * (0.5 + 0.7 * n2);
      vec3 fc = mix(vec3(0.9, 0.16, 0.02), vec3(1.0, 0.62, 0.14), smoothstep(0.1, 0.5, heat));
      fc = mix(fc, vec3(1.0, 0.96, 0.78), smoothstep(0.55, 0.95, heat));
      float a = smoothstep(0.03, 0.35, heat);
      col = fc * a + col * (1.0 - a);
      alpha = a + alpha * (1.0 - a);
      // its glow only ever adds light
      col += vec3(1.0, 0.42, 0.08) * glow;
      alpha = min(1.0, alpha + glow);
    }
  }
  return half4(col, alpha);
}`;

/** The ring of fire, rooted on the gold ring: thinner where it crosses
 *  the gold, so the metal shows through, licked across now and then. */
const SUN_RIM = `
uniform float t;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 1.5;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = 4.5 + 7.0 * n;
  float d = abs(r - 54.0 + (n2 - 0.5) * 5.0);
  float heat = (1.0 - d / width) * (0.6 + n * 0.8);
  if (heat <= 0.0) return half4(0.0);
  vec3 color = mix(vec3(0.85, 0.16, 0.02), vec3(1.0, 0.6, 0.12), smoothstep(0.2, 0.55, heat));
  color = mix(color, vec3(1.0, 0.96, 0.76), smoothstep(0.6, 0.95, heat));
  float a = smoothstep(0.04, 0.4, heat);
  float band = 1.0 - smoothstep(2.2, 3.2, abs(r - 52.0));
  float lick = smoothstep(0.4, 0.75, fbm(dir * 6.0 + vec2(-s * 1.2, s)));
  a *= 1.0 - band * (1.0 - lick) * 0.62;
  return half4(color * a, a);
}`;

function Sksl({
  sksl,
  t,
  size,
}: {
  sksl: string;
  t: Clock;
  size: number;
}) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  const uniforms = useDerivedValue(() => ({ t: t.value }));
  if (!source) return null;
  return (
    <Rect x={-size} y={-size} width={size * 2} height={size * 2}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** The solar ring: thin gold at the picture's edge, a groove along each
 *  side, and between them a sunray finish: fine lines cut radiating all
 *  the way round, the gold catching the light in broad turning bands. */
const SOLAR_RING = circle(54.5) + circle(49.5);
const SOLAR_GROOVES = circle(53.55) + circle(50.45);
const SOLAR_RAYS = Array.from({ length: 160 }, (_, k) => {
  const a = (k * 360) / 160;
  return `M${pt(polar(a * DEG, 50.9))}L${pt(polar(a * DEG, 53.1))}`;
}).join("");
const SUNRAY = [
  "#FFF4C4",
  "#E2B04A",
  "#A87424",
  "#E8BC56",
  "#FFF4C4",
  "#D8A040",
  "#9A6B1E",
  "#F0CC72",
  "#FFF4C4",
];

function recordSolarRing() {
  return record((c) => {
    const sweep = Skia.Shader.MakeSweepGradient(
      0,
      0,
      SUNRAY.map((x) => Skia.Color(x)),
      null,
      TileMode.Clamp,
    );
    engrave(c, {
      d: SOLAR_RING,
      evenOdd: true,
      fill: sweep,
      ink: INK_GOLD,
      width: 0.9,
      vein: SOLAR_RAYS,
      veinColor: VEIN_GOLD,
      veinWidth: 0.3,
      veinAlpha: 0.45,
      shine: arc(53.9, -160, -110),
      shineWidth: 0.7,
    });
    const grooves = Skia.Path.MakeFromSVGString(SOLAR_GROOVES);
    if (grooves) c.drawPath(grooves, pen(0.45, VEIN_GOLD, 0.8));
  });
}
let SOLAR_RING_PIC: SkPicture | null = null;
const solarRingPicture = () => (SOLAR_RING_PIC ??= recordSolarRing());

function SunBlazeBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.55 + 0.15 * Math.sin(t.value * 6.1) * Math.sin(t.value * 2.3),
  );
  return (
    <Group>
      <Halo r={94} color="#FF6A1A" opacity={glow} />
      <Sksl sksl={SUN_BACK} t={t} size={93} />
      <Sparks
        t={t}
        count={6}
        from={-Math.PI * 0.95}
        to={-Math.PI * 0.05}
        r={74}
        rise={16}
        size={1.3}
        seed={52}
      />
    </Group>
  );
}

function SunBlazeFront({ t }: { t: Clock }) {
  const ring = useMemo(() => solarRingPicture(), []);
  return (
    <Group>
      <Picture picture={ring} />
      <Sweep t={t} d={SOLAR_RING} evenOdd every={5.2} phase={0.8} />
      <Sksl sksl={SUN_RIM} t={t} size={70} />
      <Sparks
        t={t}
        count={9}
        from={-Math.PI}
        to={0}
        r={56}
        rise={32}
        size={1.6}
        seed={21}
      />
      <Glint t={t} x={-37} y={-37} size={4} phase={0.6} speed={0.9} />
      <Glint t={t} x={40} y={34} size={3.5} phase={2.9} speed={1.1} />
    </Group>
  );
}

const SunBlaze: ArtBorderDrawing = { back: SunBlazeBack, front: SunBlazeFront };

// ══ Phoenix ══════════════════════════════════════════════════════════

/** The right wing's feathers, back row first, fanned from the shoulder
 *  (behind the picture) out and up. `rot` is from straight up, turning
 *  outward. */
const WING_ROOT = { x: 34, y: -24 };
interface Plume {
  rot: number;
  len: number;
  w: number;
}
const row = (from: number, to: number, lens: number[], w: number): Plume[] =>
  lens.map((len, k) => ({
    rot: from + ((to - from) * k) / (lens.length - 1),
    len,
    w,
  }));
const WING_ROWS: { plumes: Plume[]; colors: string[] }[] = [
  {
    plumes: row(0.22, 1.9, [40, 48, 53, 55, 51, 46, 40, 34], 6.6),
    colors: ["#5A0606", "#B3160C", "#E8401A", "#FF8A2A"],
  },
  {
    plumes: row(0.34, 1.8, [29, 34, 37, 37, 34, 30, 26], 6.2),
    colors: ["#8A0C08", "#D8301A", "#FF7A22", "#FFB040"],
  },
  {
    plumes: row(0.48, 1.68, [19, 21, 22, 21, 19, 17], 5.8),
    colors: ["#C8301A", "#FF8A2A", "#FFC24A", "#FFE6A0"],
  },
];
const PRIMARIES = WING_ROWS[0].plumes;

/** A feather's engraving: the quill, a few barbs, a shine down the lit
 *  side. Pointing up from its root. */
function featherCuts(len: number, w: number) {
  const quill = `M0 -1Q${f2(-w * 0.12)} ${f2(-len * 0.5)} ${f2(-w * 0.2)} ${f2(-len * 0.9)}`;
  let barbs = "";
  for (let j = 0; j < 4; j++) {
    const s = 0.22 + j * 0.17;
    const x0 = -w * 0.12 * s;
    barbs += `M${f2(x0)} ${f2(-len * s)}L${f2(w * 0.85)} ${f2(-len * (s + 0.13))}`;
    barbs += `M${f2(x0)} ${f2(-len * (s + 0.06))}L${f2(-w * 0.85)} ${f2(-len * (s + 0.18))}`;
  }
  const shine = `M${f2(-w * 0.62)} ${f2(-len * 0.14)}Q${f2(-w * 0.86)} ${f2(-len * 0.5)} ${f2(-w * 0.42)} ${f2(-len * 0.82)}`;
  return { quill, barbs, shine };
}

function drawFeather(c: SkCanvas, p: Plume, colors: string[]) {
  const d = FEATHER(p.len, p.w);
  const cuts = featherCuts(p.len, p.w);
  c.save();
  c.rotate(p.rot / DEG, 0, 0);
  // a soft shadow on the feather beneath
  c.save();
  c.translate(0.8, 1.2);
  const sh = Skia.Path.MakeFromSVGString(d);
  if (sh) c.drawPath(sh, brush("#2A0402", 0.35));
  c.restore();
  engrave(c, {
    d,
    fill: linear(0, 0, 0, -p.len, colors),
    ink: INK_FLAME,
    width: 1.1,
    edge: "#F6C64A",
    edgeWidth: 0.9,
    vein: cuts.barbs + cuts.quill,
    veinColor: "#5A0A04",
    veinWidth: 0.45,
    veinAlpha: 0.55,
    shine: cuts.shine,
    shineWidth: 0.7,
    shineAlpha: 0.55,
  });
  // the quill, gold
  const quill = Skia.Path.MakeFromSVGString(cuts.quill);
  if (quill) c.drawPath(quill, pen(0.55, "#FFE08A", 0.85));
  c.restore();
}

function recordWing() {
  return record((c) => {
    for (const r of WING_ROWS)
      for (const p of r.plumes) drawFeather(c, p, r.colors);
  });
}

/** The tail: a fan of plumes round the bottom of the ring, each rooted
 *  behind it and ending in an eye, with plain flame feathers between
 *  them. Each points up from its root before it is turned outward. */
const TAIL_R = 57;
const TAIL_EYES = [-39, -26, -13, 0, 13, 26, 39].map((d) => ({
  at: 90 + d,
  len: 32 - Math.abs(d) * 0.17,
  w: 5.5 - Math.abs(d) * 0.012,
}));
const TAIL_FILLERS = [-46, -32.5, -19.5, -6.5, 6.5, 19.5, 32.5, 46].map(
  (d) => ({
    at: 90 + d,
    len: 26 - Math.abs(d) * 0.14,
    w: 4.6,
  }),
);
const TAIL_FILL = ["#6A0808", "#C8201A", "#FF7A22", "#FFC24A"];

const tailPlume = (len: number, w: number) =>
  `M-1.2 0C-2 ${f2(-len * 0.45)} ${f2(-w * 1.15)} ${f2(-len * 0.6)} ${f2(-w)} ${f2(-len * 0.8)}` +
  `C${f2(-w * 0.9)} ${f2(-len * 1.03)} ${f2(w * 0.9)} ${f2(-len * 1.03)} ${f2(w)} ${f2(-len * 0.8)}` +
  `C${f2(w * 1.15)} ${f2(-len * 0.6)} 2 ${f2(-len * 0.45)} 1.2 0Z`;

/** An eye-spot at (x, y), long along `rot` (degrees from straight up): a
 *  gold ring, a crimson one, a night-blue heart with a gleam. */
function drawEye(c: SkCanvas, x: number, y: number, rot: number, w: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot, 0, 0);
  const oval = (rx: number, ry: number) => {
    const o = Skia.Path.Make();
    o.addOval(Skia.XYWHRect(-rx, -ry, rx * 2, ry * 2));
    return o;
  };
  const gold = oval(w * 0.8, w * 0.98);
  c.drawPath(gold, brush(radial(-w * 0.3, -w * 0.4, w * 1.4, GOLD.slice(0, 3))));
  c.drawPath(gold, pen(0.6, INK_GOLD));
  const red = oval(w * 0.56, w * 0.7);
  c.drawPath(red, brush(radial(-w * 0.2, -w * 0.25, w, ["#FF8A6A", "#C2203A", "#6A0A18"])));
  const core = oval(w * 0.32, w * 0.41);
  c.drawPath(core, brush(radial(-w * 0.1, -w * 0.15, w * 0.5, ["#9AB8E8", "#2A4A8A", "#0A1430"])));
  c.drawPath(core, pen(0.4, "#0A1430"));
  const gleam = Skia.Path.Make();
  gleam.addCircle(-w * 0.1, -w * 0.17, w * 0.09);
  c.drawPath(gleam, brush("#FFFFFF", 0.9));
  c.restore();
}

function drawTailPlume(
  c: SkCanvas,
  p: { at: number; len: number; w: number },
  eye: boolean,
) {
  const { len, w } = p;
  c.save();
  c.rotate(p.at + 90, 0, 0);
  c.translate(0, -TAIL_R);
  let barbs = "";
  for (let j = 0; j < 6; j++) {
    const s = 0.12 + j * 0.1;
    barbs += `M0 ${f2(-len * s)}L${f2(w)} ${f2(-len * (s + 0.12))}`;
    barbs += `M0 ${f2(-len * s)}L${f2(-w)} ${f2(-len * (s + 0.12))}`;
  }
  const d = eye ? tailPlume(len, w) : FEATHER(len, w);
  // a soft shadow on what lies beneath
  const sh = Skia.Path.MakeFromSVGString(d);
  if (sh) {
    c.save();
    c.translate(0.6, 1);
    c.drawPath(sh, brush("#2A0402", 0.3));
    c.restore();
  }
  engrave(c, {
    d,
    fill: linear(0, 0, 0, -len, eye ? TAIL_FILL : WING_ROWS[0].colors),
    ink: INK_FLAME,
    width: 1,
    edge: "#F6C64A",
    edgeWidth: 0.8,
    vein: barbs + `M0 -1L0 ${f2(-len * (eye ? 0.7 : 0.88))}`,
    veinColor: "#5A0A04",
    veinWidth: 0.4,
    veinAlpha: 0.5,
  });
  if (eye) drawEye(c, 0, -len * 0.8, 0, w);
  c.restore();
}

function recordTail() {
  return record((c) => {
    for (const p of TAIL_FILLERS) drawTailPlume(c, p, false);
    for (const p of TAIL_EYES) drawTailPlume(c, p, true);
  });
}

/** A tongue of flame, pointing up from (0, 0): wide at the root, waving
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
      const half = (b / 2) * Math.pow(1 - s, 0.85) * (1 + 0.3 * Math.sin(Math.PI * s));
      return [p[0] - ((q[1] - a[1]) / l) * half * k, p[1] + ((q[0] - a[0]) / l) * half * k];
    });
  const left = side(1);
  const right = side(-1).reverse();
  const f = (p: Pt) => `${f2(p[0])} ${f2(p[1])}`;
  return {
    outline: `M${left.map(f).join("L")}L${right.map(f).join("L")}Z`,
    vein: `M${mid.slice(2, 15).map(f).join("L")}`,
  };
}

/** The gold ring the wings and tail spring from, and its flame
 *  filigree: small tongues of gold rising all round its upper half, and
 *  over the top a crest (two tall tongues and two scrolls curling away)
 *  cupping the live flame. */
const PH_RING_OUT = 65.4;
const PH_RING_IN = 61.4;
const PH_RING = circle(PH_RING_OUT) + circle(PH_RING_IN);
const PH_TWISTS = Array.from({ length: 60 }, (_, k) => {
  const a = (k * 360) / 60;
  return `M${pt(polar(a * DEG, 62.4))}L${pt(polar((a + 2.1) * DEG, 64.4))}`;
}).join("");

/** The small tongues round the upper half: where, how tall, which way
 *  they wave. */
const TONGUES = [-162, -144, -126, -108, -72, -54, -36, -18].map((at, k) => ({
  at,
  h: k % 2 ? 9 : 12,
  bend: at < -90 ? -1 : 1,
}));
const CREST = [
  { x: -4, rot: -0.5, h: 18, part: tongue(18, 7, -1) },
  { x: 4, rot: 0.5, h: 18, part: tongue(18, 7, 1) },
];
const CREST_SCROLLS = [
  curl(-6, -1, -Math.PI / 2 - 1.05, 15, -4.2, 4.4, 0.75),
  curl(6, -1, -Math.PI / 2 + 1.05, 15, 4.2, 4.4, 0.75),
];
const FILIGREE_GOLD = ["#9A6B1E", "#E2B04A", "#FFF2B8"];

/** A gold scroll. */
function drawFiligree(
  c: SkCanvas,
  part: { outline: string; vein: string },
  h: number,
) {
  engrave(c, {
    d: part.outline,
    fill: linear(0, 0, 0, -h, FILIGREE_GOLD),
    ink: INK_GOLD,
    width: 0.9,
    vein: part.vein,
    veinColor: VEIN_GOLD,
    veinWidth: 0.5,
  });
}

/** A flame of enamel set in gold wire, like the feathers. */
function drawFlame(
  c: SkCanvas,
  part: { outline: string; vein: string },
  h: number,
) {
  engrave(c, {
    d: part.outline,
    fill: linear(0, 0, 0, -h, ["#B3160C", "#FF6A1E", "#FFC24A", "#FFF2B8"]),
    ink: INK_FLAME,
    width: 0.9,
    edge: "#F6C64A",
    edgeWidth: 0.75,
    vein: part.vein,
    veinColor: "#FFF2B8",
    veinWidth: 0.6,
    veinAlpha: 0.6,
  });
}

function recordPhoenixRing() {
  return record((c) => {
    for (const g of TONGUES) {
      c.save();
      c.rotate(g.at + 90, 0, 0);
      c.translate(0, -PH_RING_OUT + 1.2);
      drawFlame(c, tongue(g.h, 5, g.bend), g.h);
      c.restore();
    }
    c.save();
    c.translate(0, -PH_RING_OUT + 1.6);
    for (const s of CREST_SCROLLS) drawFiligree(c, s, 14);
    for (const g of CREST) {
      c.save();
      c.translate(g.x, 0);
      c.rotate(g.rot / DEG, 0, 0);
      drawFlame(c, g.part, g.h);
      c.restore();
    }
    c.restore();
    engrave(c, {
      d: PH_RING,
      evenOdd: true,
      fill: linear(-60, -70, 60, 70, GOLD),
      ink: INK_GOLD,
      width: 1.1,
      vein: PH_TWISTS,
      veinColor: VEIN_GOLD,
      veinWidth: 0.55,
      shine: arc(PH_RING_OUT - 0.9, -170, -110),
      shineWidth: 0.8,
    });
  });
}

let WING: SkPicture | null = null;
let TAIL_PIC: SkPicture | null = null;
let PH_RING_PIC: SkPicture | null = null;
const wingPicture = () => (WING ??= recordWing());
const tailPicture = () => (TAIL_PIC ??= recordTail());
const phoenixRingPicture = () => (PH_RING_PIC ??= recordPhoenixRing());

function Wing({ t, side }: { t: Clock; side: 1 | -1 }) {
  const picture = useMemo(() => wingPicture(), []);
  // a slow beat: the wing lifts and spreads, then settles
  const beat = useDerivedValue(() => {
    const b = Math.sin(t.value * 1.5);
    return [
      { translateX: side * WING_ROOT.x },
      { translateY: WING_ROOT.y },
      { rotate: side * (-0.02 - b * 0.07) },
      { scaleX: side * (1.05 + b * 0.03) },
      { scaleY: 1.05 + b * 0.03 },
    ];
  });
  return (
    <Group transform={beat}>
      <Picture picture={picture} />
      {PRIMARIES.map((p, k) => (
        <Group key={k} transform={[{ rotate: p.rot }]}>
          <Flicker
            t={t}
            x={0}
            y={-p.len + 3}
            size={8}
            phase={k * 1.3 + side}
            color="#FFB347"
          />
        </Group>
      ))}
    </Group>
  );
}

function Tail({ t }: { t: Clock }) {
  const picture = useMemo(() => tailPicture(), []);
  // the fan swings gently, and spreads a little as the wings lift
  const sway = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.2) * 0.035 },
    { scale: 1 + Math.sin(t.value * 1.5) * 0.012 },
  ]);
  return (
    <Group transform={sway}>
      <Picture picture={picture} />
    </Group>
  );
}

const RUBY: [string, string, string] = ["#FF9AA6", "#D0102E", "#5A0410"];

function PhoenixBack({ t }: { t: Clock }) {
  const ring = useMemo(() => phoenixRingPicture(), []);
  const glow = useDerivedValue(() => 0.5 + 0.1 * Math.sin(t.value * 1.5));
  return (
    <Group>
      <Halo r={92} color="#FF6A1F" opacity={glow} />
      <Sparks
        t={t}
        count={10}
        from={-Math.PI}
        to={0}
        r={70}
        rise={24}
        seed={4}
      />
      <Tail t={t} />
      <Wing t={t} side={-1} />
      <Wing t={t} side={1} />
      <Picture picture={ring} />
      <Sweep t={t} d={PH_RING} evenOdd every={5} phase={1.4} />
      <Glint t={t} x={-44.8} y={-44.8} size={4} phase={2.4} speed={1.1} />
    </Group>
  );
}

/** The ruby on the ring where the tail meets it, glowing slowly. */
function Ruby({ t }: { t: Clock }) {
  const ember = useDerivedValue(() => 0.35 + 0.35 * Math.sin(t.value * 1.5));
  const y = (PH_RING_OUT + PH_RING_IN) / 2;
  return (
    <Group>
      <Circle cx={0} cy={y} r={8.5} color="#FF3A2A" opacity={ember}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={0} cy={y} r={6}>
        <RadialGradient c={vec(-2, y - 2)} r={9} colors={GOLD} />
      </Circle>
      <Circle
        cx={0}
        cy={y}
        r={6}
        style="stroke"
        strokeWidth={1}
        color={INK_GOLD}
      />
      <Gem x={0} y={y} w={7.4} h={7.4} colors={RUBY} />
      <Glint t={t} x={-1.3} y={y - 1.4} size={4.5} phase={0.4} speed={1} />
    </Group>
  );
}

/** A flame rising from the top of the ring, out of the filigree. */
function PhoenixFlame({ t }: { t: Clock }) {
  return (
    <Group>
      <Circle cx={0} cy={-64} r={9} color="#FFB347" opacity={0.6}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Fire x={0} y={-58} width={20} height={30} clock={t} />
    </Group>
  );
}

function PhoenixFront({ t }: { t: Clock }) {
  return (
    <Group>
      <FireRim t={t} />
      <PhoenixFlame t={t} />
      <Ruby t={t} />
      <Sparks
        t={t}
        count={5}
        from={-Math.PI * 0.9}
        to={-Math.PI * 0.1}
        r={56}
        rise={22}
        size={1.3}
        seed={61}
      />
    </Group>
  );
}

const Phoenix: ArtBorderDrawing = { back: PhoenixBack, front: PhoenixFront };

export const SOLAR_ART: Record<string, ArtBorderDrawing> = {
  campfire: SunBlaze,
  phoenix: Phoenix,
};

// The two dearest borders, legendary, in the house's engraved style.
//   Phoenix Reborn — Phoenix's top tier. Huge wings of engraved gold
//     feathers beat slowly behind the picture, four rows deep (gold to
//     flame, crimson enamel, gold coverts), their tips turning to living
//     fire. The tail sweeps all the way round the ring in plumes ending in
//     eye-spots. Over the picture's edge, a rim of small gold feathers
//     between gold wires, fire licking across it; a fire opal (the heart)
//     beats at the top under a flame, a ruby sits below. Every ten seconds
//     the whole bird flares white-hot, collapses into glowing ash and
//     embers, and rises again, its feathers re-forming row by row. No head.
//   Void Emperor — a crown of black obsidian points over the picture,
//     their facets lit violet from below, a dark amethyst in its band;
//     purple lightning jumps between the points. Over the picture's edge,
//     a ring of collapsing space: a churning violet-and-black void, lit at
//     both edges, stars and dust spiralling down into it. Blackened silver
//     filigree holds it together. Every nine seconds the void draws
//     everything in, then lets go in a ring of violet light.
// See heraldry.tsx, solar.tsx and abyss.tsx for the house style.

import {
  BlendMode,
  BlurMask,
  BlurStyle,
  Circle,
  ClipOp,
  FillType,
  FilterMode,
  Group,
  Image,
  MipmapMode,
  Paint,
  PaintStyle,
  Path,
  Picture,
  Rect,
  Shader,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  rect,
  vec,
  type SkCanvas,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkRect,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { PixelRatio } from "react-native";
import { useDerivedValue, type DerivedValue } from "react-native-reanimated";

import {
  FEATHER,
  LEAF,
  acanthus,
  curl,
  type Pt,
} from "@/components/engraved/shapes";
import { Fire } from "@/components/iso";
import { NOISE } from "@/components/iso/noise";
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
const f2 = (n: number) => n.toFixed(2);
const pt = (p: { x: number; y: number }) => `${f2(p.x)} ${f2(p.y)}`;
/** A point at angle `a` (degrees), radius `r`, as path text. */
const at = (a: number, r: number) => pt(polar(a * DEG, r));
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (r: number, hole = false) => {
  const s = hole ? 0 : 1;
  return `M${r} 0A${r} ${r} 0 1 ${s} ${-r} 0A${r} ${r} 0 1 ${s} ${r} 0Z`;
};
/** A band round the centre (a ring under either fill rule). */
const ring = (rOut: number, rIn: number) => disc(rOut) + disc(rIn, true);
/** An arc of radius r from a0 to a1 (degrees), as an open line. */
const arc = (r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${at(a0, r)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${at(a1, r)}`;
};
const poly = (pts: Pt[]) =>
  `M${pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}Z`;

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";

// ── timing ────────────────────────────────────────────────────────────

const clamp01 = (x: number) => {
  "worklet";
  return Math.min(1, Math.max(0, x));
};
/** 0 before a, 1 after b, eased between. */
const ss = (a: number, b: number, x: number) => {
  "worklet";
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

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

const toPath = (d: string, evenOdd = false) => {
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
  shineColor?: string;
  shineWidth?: number;
  shineAlpha?: number;
  /** A wire laid along the edge, inside the ink (cloisonné). */
  edge?: string;
  edgeWidth?: number;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const shape = toPath(p.d, p.evenOdd);
  if (!shape) return;
  c.drawPath(shape, brush(p.fill));
  if (p.vein || p.shine || p.edge) {
    c.save();
    c.clipPath(shape, ClipOp.Intersect, true);
    if (p.edge) c.drawPath(shape, pen((p.edgeWidth ?? 1) * 2, p.edge));
    const vein = p.vein ? toPath(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? toPath(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(
          p.shineWidth ?? 0.9,
          p.shineColor ?? "#FFFFFF",
          p.shineAlpha ?? 0.75,
        ),
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

// ── baked pictures ────────────────────────────────────────────────────
// A picture of hundreds of engraved paths, each clipped for its veins,
// costs too much to draw again every frame, four borders at a time. So
// it's drawn into pixels once instead, a little finer than the screen
// shows a border of up to BAKE_PT points, cut down to what it covers;
// the pixels are what move and fade. (An image takes a group's opacity
// itself, so a fading single picture needs no layer either.)

const BAKE_PT = 130;

interface Baked {
  image: SkImage;
  rect: SkRect;
}

/** What a picture covers, found at one pixel a unit, with a margin. */
function coverage(pic: SkPicture): SkRect | null {
  const surface = Skia.Surface.Make(192, 192);
  if (!surface) return null;
  const c = surface.getCanvas();
  c.translate(96, 96);
  c.drawPicture(pic);
  const px = surface.makeImageSnapshot().readPixels();
  if (!px) return null;
  let x0 = 192;
  let y0 = 192;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < 192; y++)
    for (let x = 0; x < 192; x++)
      if (px[(y * 192 + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  return rect(x0 - 98, y0 - 98, x1 - x0 + 5, y1 - y0 + 5);
}

/** Draws a picture into pixels, `fine` times the screen's density. */
function bake(pic: SkPicture, fine = BAKE_PT / 100): Baked | null {
  const r = coverage(pic);
  if (!r) return null;
  const k = PixelRatio.get() * fine;
  const w = Math.ceil(r.width * k);
  const h = Math.ceil(r.height * k);
  const surface = Skia.Surface.Make(w, h);
  if (!surface) return null;
  const c = surface.getCanvas();
  c.scale(k, k);
  c.translate(-r.x, -r.y);
  c.drawPicture(pic);
  return {
    image: surface.makeImageSnapshot(),
    rect: rect(r.x, r.y, w / k, h / k),
  };
}

/** A picture, baked the first time it's drawn. */
function baked(draw: (c: SkCanvas) => void, fine?: number) {
  let b: Baked | null | undefined;
  return () => (b === undefined ? (b = bake(record(draw), fine)) : b);
}

function Bake({ image }: { image: () => Baked | null }) {
  const b = useMemo(() => image(), [image]);
  if (!b) return null;
  return (
    <Image
      image={b.image}
      rect={b.rect}
      fit="fill"
      sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.Linear }}
    />
  );
}

/** A baked picture that moves with the clock. */
function MovingBake({
  image,
  transform,
}: {
  image: () => Baked | null;
  transform?: ComponentProps<typeof Group>["transform"];
}) {
  return (
    <Group transform={transform}>
      <Bake image={image} />
    </Group>
  );
}

const EVERYWHERE = () => {
  "worklet";
  return rect(-400, -400, 800, 800);
};
const NOWHERE = () => {
  "worklet";
  return rect(0, 0, 0, 0);
};

/** Drawn only while `when` is above zero; otherwise clipped to nothing,
 *  so its blurs and pictures cost nothing. */
function Shown({
  when,
  children,
}: {
  when: DerivedValue<number>;
  children: ReactNode;
}) {
  const clip = useDerivedValue(() =>
    when.value > 0.004 ? EVERYWHERE() : NOWHERE(),
  );
  return <Group clip={clip}>{children}</Group>;
}

/** Fades what it holds (pictures too, which ignore a group's opacity).
 *  Only while half-faded does it pay for a layer: whole, it draws
 *  plainly; gone, it is clipped away. */
function Fade({
  opacity,
  children,
}: {
  opacity: DerivedValue<number>;
  children: ReactNode;
}) {
  const partly = useDerivedValue(() =>
    opacity.value > 0.004 && opacity.value < 0.996 ? EVERYWHERE() : NOWHERE(),
  );
  const whole = useDerivedValue(() =>
    opacity.value >= 0.996 ? EVERYWHERE() : NOWHERE(),
  );
  return (
    <Group>
      <Group clip={partly}>
        <Group layer={<Paint opacity={opacity} />}>{children}</Group>
      </Group>
      <Group clip={whole}>{children}</Group>
    </Group>
  );
}

/** A shader over a rectangle, on the clock. */
function Sksl({
  sksl,
  uniforms,
  x,
  y,
  w,
  h,
}: {
  sksl: string;
  uniforms: DerivedValue<Record<string, number>>;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  if (!source) return null;
  return (
    <Rect x={x} y={y} width={w} height={h}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** A kite (a cut jewel or its setting), pointing up and down. */
const kite = (cx: number, cy: number, w: number, top: number, bottom: number) =>
  poly([
    [cx, cy - top],
    [cx + w, cy],
    [cx, cy + bottom],
    [cx - w, cy],
  ]);

/** A cut jewel: body, facets, a shine; inked round. */
function jewel(
  c: SkCanvas,
  cx: number,
  cy: number,
  w: number,
  top: number,
  bottom: number,
  colors: string[],
  ink: string,
  facet: string,
) {
  engrave(c, {
    d: kite(cx, cy, w, top, bottom),
    fill: radial(cx - w * 0.35, cy - top * 0.4, Math.max(w, top) * 1.6, colors),
    ink,
    width: 0.7,
    vein:
      kite(cx, cy - top * 0.08, w * 0.46, top * 0.46, bottom * 0.5) +
      `M${f2(cx)} ${f2(cy - top)}V${f2(cy - top * 0.54)}M${f2(cx + w)} ${f2(cy)}H${f2(cx + w * 0.46)}M${f2(cx)} ${f2(cy + bottom)}V${f2(cy + bottom * 0.42)}M${f2(cx - w)} ${f2(cy)}H${f2(cx - w * 0.46)}`,
    veinColor: facet,
    veinWidth: 0.4,
    veinAlpha: 0.7,
    shine: `M${f2(cx - w * 0.62)} ${f2(cy - top * 0.12)}L${f2(cx - w * 0.18)} ${f2(cy - top * 0.7)}`,
    shineWidth: 0.7,
    shineAlpha: 0.9,
  });
}

// ══ Phoenix Reborn ═══════════════════════════════════════════════════

// The cycle (seconds into it): calm until 6.2; flaring white-hot to 7.5;
// collapsing into ash to 8.3; the ash crumbling; the feathers re-forming
// row by row from 8.6, the last back by 9.9.
const PH_PERIOD = 10;
const phPhase = (t: number) => {
  "worklet";
  return (t + 3) % PH_PERIOD;
};
/** How white-hot the bird burns. */
const phBurst = (u: number) => {
  "worklet";
  return ss(6.2, 7.2, u) * (1 - ss(7.55, 8.05, u));
};
/** How much of feather row k is there, alive. */
const phAlive = (u: number, k: number) => {
  "worklet";
  return u < 8.3
    ? 1 - ss(7.55, 7.95, u)
    : ss(8.6 + 0.17 * k, 9.3 + 0.17 * k, u);
};
/** Whether the living bird is there at all (it fades out into the ash,
 *  and back in as the first feathers start to grow). */
const phShown = (u: number) => {
  "worklet";
  return u < 8.3 ? 1 - ss(7.55, 7.95, u) : ss(8.6, 8.85, u);
};
/** How much of row k is ash. */
const phAsh = (u: number, k: number) => {
  "worklet";
  return u < 8.3 ? ss(7.45, 7.85, u) : 1 - ss(8.35 + 0.1 * k, 9.0 + 0.1 * k, u);
};
/** How far the wings have drooped in their collapse. */
const phFold = (u: number) => {
  "worklet";
  return u < 8.3 ? ss(7.55, 8.25, u) : 1 - ss(8.6, 9.7, u);
};
/** The fire catching again as the feathers return. */
const phKindle = (u: number) => {
  "worklet";
  return ss(8.5, 9.0, u) * (1 - ss(9.3, 10, u));
};

/** The three states every feather is recorded in. */
type Tone = "flame" | "ash" | "hot";
const ASH_FILL = ["#140C0A", "#2E221C", "#6A5A52"];
const HOT_FILL = ["#FFD27A", "#FFF4D0", "#FFFFFF"];
const toneInk = (tone: Tone, ink: string) =>
  tone === "ash" ? "#060302" : tone === "hot" ? "#C8601A" : ink;

// ── the wings ─────────────────────────────────────────────────────────

/** Each wing springs from behind the picture, its feathers fanned from
 *  straight up (rot 0) outward. Primaries' length by angle (the shader
 *  burning at their tips knows it too). */
const WING_ROOT = { x: 26, y: -32 };
const T0 = 0.32;
const T1 = 2.12;
const tipLen = (th: number) => {
  const s = clamp01((th - T0) / (T1 - T0)) - 0.27;
  return 32 + 40 * Math.exp(-((s / (s < 0 ? 0.26 : 0.4)) ** 2));
};

interface Plume {
  rot: number;
  len: number;
  w: number;
}
const fan = (n: number, from: number, to: number, k: number, w: number) =>
  Array.from({ length: n }, (_, i): Plume => {
    const rot = from + ((to - from) * i) / (n - 1);
    return { rot, len: tipLen(rot) * k, w };
  });

/** Back row first: gold feathers burning at the tips, then shorter gold
 *  ones, crimson enamel set in gold wire, gold coverts. */
const WING_ROWS: {
  plumes: Plume[];
  colors: string[];
  pos: number[];
  ink: string;
  vein: string;
  wire?: string;
}[] = [
  {
    plumes: fan(11, T0, T1, 1, 8),
    colors: ["#8A5A14", "#E2B04A", "#F6CC5A", "#FF8A2A", "#E0360E"],
    pos: [0, 0.32, 0.56, 0.8, 1],
    ink: "#3A1606",
    vein: "#7A3A0A",
  },
  {
    plumes: fan(10, T0 + 0.08, T1 - 0.1, 0.72, 7.4),
    colors: ["#9A6B1E", "#E8BC56", "#F6D27A", "#FF8A2A", "#D8380E"],
    pos: [0, 0.35, 0.6, 0.85, 1],
    ink: "#3A1606",
    vein: "#7A3A0A",
  },
  {
    plumes: fan(9, T0 + 0.16, T1 - 0.2, 0.52, 6.8),
    colors: ["#5A0410", "#B8182E", "#F2502A", "#FFB040"],
    pos: [0, 0.4, 0.78, 1],
    ink: "#3A0408",
    vein: "#FFD08A",
    wire: "#F6C64A",
  },
  {
    plumes: fan(8, T0 + 0.24, T1 - 0.3, 0.38, 6),
    colors: ["#9A6B1E", "#E2B04A", "#FFF2B8", "#F0CC72"],
    pos: [0, 0.4, 0.75, 1],
    ink: INK_GOLD,
    vein: VEIN_GOLD,
  },
];
const PRIMARIES = WING_ROWS[0].plumes;

/** A feather's engraving: the quill, a few barbs, a shine down the lit
 *  side. Pointing up from its root. */
function featherCuts(len: number, w: number) {
  const quill = `M0 -1Q${f2(-w * 0.12)} ${f2(-len * 0.5)} ${f2(-w * 0.2)} ${f2(-len * 0.9)}`;
  let barbs = "";
  for (let j = 0; j < 5; j++) {
    const s = 0.2 + j * 0.14;
    const x0 = -w * 0.12 * s;
    barbs += `M${f2(x0)} ${f2(-len * s)}L${f2(w * 0.85)} ${f2(-len * (s + 0.1))}`;
    barbs += `M${f2(x0)} ${f2(-len * (s + 0.05))}L${f2(-w * 0.85)} ${f2(-len * (s + 0.15))}`;
  }
  const shine = `M${f2(-w * 0.62)} ${f2(-len * 0.14)}Q${f2(-w * 0.86)} ${f2(-len * 0.5)} ${f2(-w * 0.42)} ${f2(-len * 0.82)}`;
  return { quill, barbs, shine };
}

function drawFeather(
  c: SkCanvas,
  p: Plume,
  row: (typeof WING_ROWS)[number],
  tone: Tone,
) {
  const d = FEATHER(p.len, p.w);
  const cuts = featherCuts(p.len, p.w);
  c.save();
  c.rotate(p.rot / DEG, 0, 0);
  if (tone !== "hot") {
    // a soft shadow on the feather beneath
    const sh = toPath(d);
    if (sh) {
      c.save();
      c.translate(0.8, 1.2);
      c.drawPath(sh, brush("#1A0402", 0.35));
      c.restore();
    }
  }
  const fill =
    tone === "flame"
      ? linear(0, 0, 0, -p.len, row.colors, row.pos)
      : linear(0, 0, 0, -p.len, tone === "ash" ? ASH_FILL : HOT_FILL);
  engrave(c, {
    d,
    fill,
    ink: toneInk(tone, row.ink),
    width: 0.85,
    edge: tone === "ash" ? "#FF5A14" : tone === "flame" ? row.wire : undefined,
    edgeWidth: tone === "ash" ? 0.55 : 0.8,
    vein: cuts.barbs + cuts.quill,
    veinColor:
      tone === "ash" ? "#FF7A2A" : tone === "hot" ? "#FFB040" : row.vein,
    veinWidth: 0.45,
    veinAlpha: tone === "ash" ? 0.5 : 0.55,
    shine: tone === "flame" ? cuts.shine : undefined,
    shineWidth: 0.7,
    shineAlpha: 0.6,
  });
  if (tone === "flame") {
    const quill = toPath(cuts.quill);
    if (quill) c.drawPath(quill, pen(0.55, "#FFF2B8", 0.8));
  }
  c.restore();
}

/** One row of one wing, upper feathers laid over the lower. */
const drawRow = (c: SkCanvas, k: number, tone: Tone) => {
  const row = WING_ROWS[k];
  for (let i = row.plumes.length - 1; i >= 0; i--)
    drawFeather(c, row.plumes[i], row, tone);
};
const ROW_FLAME = ([0, 1, 2, 3] as const).map((k) =>
  baked((c) => drawRow(c, k, "flame")),
);
/** The ash rows all crumble as one, so they're baked as one. */
const WING_ASH = baked((c) => {
  for (let k = 0; k < WING_ROWS.length; k++) drawRow(c, k, "ash");
});
const WING_HOT = baked((c) => {
  for (let k = 0; k < WING_ROWS.length; k++) drawRow(c, k, "hot");
});

/** Fire burning off the primaries' tips, in the wing's own space: it
 *  streams outward from where each feather ends. White-hot in the burst,
 *  out while the bird is ash, leaping again as it returns. */
const WING_FIRE = `
uniform float t;
uniform float burst;
uniform float alive;
uniform float kindle;
uniform float seed;
${NOISE}
float tipLen(float th) {
  float s = clamp((th - ${T0.toFixed(2)}) / ${(T1 - T0).toFixed(2)}, 0.0, 1.0);
  float q = (s - 0.27) / (s < 0.27 ? 0.26 : 0.4);
  return 32.0 + 40.0 * exp(-q * q);
}
half4 main(vec2 xy) {
  if (alive < 0.01) return half4(0.0);
  float rho = length(xy);
  float th = atan(xy.x, -xy.y);
  float L = tipLen(th);
  float fanEdge = smoothstep(${(T0 - 0.22).toFixed(2)}, ${(T0 + 0.04).toFixed(2)}, th)
    * (1.0 - smoothstep(${(T1 - 0.02).toFixed(2)}, ${(T1 + 0.26).toFixed(2)}, th));
  if (fanEdge <= 0.0) return half4(0.0);
  float reach = (13.0 + burst * 8.0 + kindle * 6.0) * (0.5 + 0.5 * alive);
  float h = (rho - L * 0.84) / (L * 0.16 + reach);
  if (h < 0.0 || h > 1.0) return half4(0.0);
  float s = h * 2.2 - t * 1.9;
  float n = fbm(vec2(th * 10.0 + seed, s));
  float n2 = fbm(vec2(th * 13.0 - seed, h * 3.0 - t * 2.6));
  float tip = 0.5 + 0.5 * fbm(vec2(th * 4.0 - t * 0.3, t * 0.45 + seed));
  float heat = (1.0 - h / tip) * (0.55 + 0.9 * n) + (n2 - 0.5) * 0.25;
  vec3 col = mix(vec3(0.85, 0.12, 0.02), vec3(1.0, 0.55, 0.1), smoothstep(0.15, 0.5, heat));
  col = mix(col, vec3(1.0, 0.95, 0.72), smoothstep(0.55, 0.95, heat));
  col = mix(col, vec3(1.0, 0.99, 0.94), burst * smoothstep(0.05, 0.6, heat));
  float a = smoothstep(0.04, 0.34, heat) * fanEdge * alive;
  return half4(col * a, a);
}`;

/** A wing: it beats slowly, droops and turns to ash in the collapse,
 *  and re-forms row by row, the long feathers first. */
function RebornWing({ t, side }: { t: Clock; side: 1 | -1 }) {
  const wing = useDerivedValue(() => {
    const u = phPhase(t.value);
    const b = Math.sin(t.value * 1.3);
    const fold = phFold(u);
    const s = (1.02 + b * 0.025) * (1 - 0.16 * fold);
    return [
      { translateX: side * WING_ROOT.x },
      { translateY: WING_ROOT.y },
      { rotate: side * (-0.03 - b * 0.075 + fold * 0.32) },
      { scaleX: side * s },
      { scaleY: s },
    ];
  });
  const fire = useDerivedValue<Record<string, number>>(() => {
    const u = phPhase(t.value);
    return {
      t: t.value,
      burst: phBurst(u),
      alive: phAlive(u, 0),
      kindle: phKindle(u),
      seed: side > 0 ? 0 : 17,
    };
  });
  const hot = useDerivedValue(() => phBurst(phPhase(t.value)) ** 1.5 * 0.92);
  const shown = useDerivedValue(() => phShown(phPhase(t.value)));
  const ash = useDerivedValue(() => phAsh(phPhase(t.value), 0));
  // the ash crumbles: it sinks and shrinks as it fades
  const crumble = useDerivedValue(() => {
    const u = phPhase(t.value);
    const c = u < 8.3 ? 0 : ss(8.3, 9.1, u);
    return [{ translateY: c * 7 }, { scale: 1 - c * 0.08 }];
  });
  return (
    <Group transform={wing}>
      <Sksl sksl={WING_FIRE} uniforms={fire} x={-20} y={-100} w={124} h={140} />
      <Group opacity={ash}>
        <Group transform={crumble}>
          <Bake image={WING_ASH} />
        </Group>
      </Group>
      <Fade opacity={shown}>
        {ROW_FLAME.map((image, k) => (
          <WingRow key={k} t={t} k={k} image={image} />
        ))}
      </Fade>
      <Group opacity={hot}>
        <Bake image={WING_HOT} />
      </Group>
      <Shown when={shown}>
        {PRIMARIES.filter((_, i) => i % 2 === 1).map((p, i) => (
          <TipFlame key={i} t={t} p={p} phase={i * 1.7 + side} />
        ))}
      </Shown>
    </Group>
  );
}

/** A row of feathers; re-forming, each grows back out of the root, the
 *  long ones first. */
function WingRow({
  t,
  k,
  image,
}: {
  t: Clock;
  k: number;
  image: () => Baked | null;
}) {
  const grow = useDerivedValue(() => {
    const u = phPhase(t.value);
    if (u < 8.3) return [{ scale: 1 }];
    const a = phAlive(u, k);
    const s = 0.12 + 0.88 * (1 - (1 - a) ** 3);
    return [{ rotate: (1 - a) * 0.3 }, { scale: s }];
  });
  return <MovingBake image={image} transform={grow} />;
}

const TIP = (() => {
  const s = 7;
  const w = s * 0.42;
  return `M0 ${-s}C${w} ${-s * 0.45} ${w * 1.15} ${-s * 0.05} 0 0C${-w * 1.15} ${-s * 0.05} ${-w} ${-s * 0.45} 0 ${-s}z`;
})();
/** The tongue's soft glow: a blur, baked once rather than blurred
 *  afresh for every tongue every frame (finer, as the tongues grow). */
const TIP_GLOW = baked((c) => {
  const glow = toPath(TIP);
  if (!glow) return;
  const paint = brush("#FF8A2A", 0.55);
  paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 2.4, true));
  c.drawPath(glow, paint);
}, 2.6);

/** A tongue of flame licking off a primary's tip. */
function TipFlame({ t, p, phase }: { t: Clock; p: Plume; phase: number }) {
  const transform = useDerivedValue(() => {
    const k =
      1 +
      0.18 * Math.sin(t.value * 11 + phase) * Math.sin(t.value * 4.3 + phase);
    const u = phPhase(t.value);
    const big = 1 + phBurst(u) * 0.6 + phKindle(u) * 0.3;
    return [
      { rotate: p.rot },
      { translateY: -p.len + 2.5 },
      { scaleY: k * big },
      { scaleX: (2 - k) * big },
    ];
  });
  const opacity = useDerivedValue(() => phAlive(phPhase(t.value), 0));
  return (
    <Group transform={transform} opacity={opacity}>
      <Bake image={TIP_GLOW} />
      <Path path={TIP} color="#FFB347" />
      <Path
        path={TIP}
        color="#FFF3C4"
        transform={[{ translateY: -0.3 }, { scale: 0.5 }]}
      />
    </Group>
  );
}

// ── the tail ──────────────────────────────────────────────────────────

/** The tail sweeps round the ring from the bottom up both sides to the
 *  wings: long plumes ending in eye-spots, plain flame feathers between,
 *  each leaning the way the tail sweeps. The right half (the left is its
 *  mirror) and the middle plume, drawn apart so the halves can fan. */
const TAIL_R = 57.5;
const TAIL_STEP = 8;
const TAIL = Array.from({ length: 19 }, (_, k) => {
  const at0 = 90 - k * TAIL_STEP;
  const eye = k % 2 === 0;
  const len = (30 - (12 * k) / 18) * (eye ? 1 : 0.84);
  return {
    at: at0,
    len,
    w: eye ? 5.4 - k * 0.08 : 4.4 - k * 0.05,
    lean: k === 0 ? 0 : 22 + k * 1.2,
    eye,
  };
});
const TAIL_FILL = ["#6A0808", "#C8201A", "#FF7A22", "#FFC24A"];
const TAIL_FILLER = ["#5A0606", "#B3160C", "#E8401A", "#FF8A2A"];

const tailPlume = (len: number, w: number) =>
  `M-1.2 0C-2 ${f2(-len * 0.45)} ${f2(-w * 1.15)} ${f2(-len * 0.6)} ${f2(-w)} ${f2(-len * 0.8)}` +
  `C${f2(-w * 0.9)} ${f2(-len * 1.03)} ${f2(w * 0.9)} ${f2(-len * 1.03)} ${f2(w)} ${f2(-len * 0.8)}` +
  `C${f2(w * 1.15)} ${f2(-len * 0.6)} 2 ${f2(-len * 0.45)} 1.2 0Z`;

/** An eye-spot: a gold ring, a crimson one, a night-blue heart with a
 *  gleam (or the same in ash, or white-hot). */
function drawEye(c: SkCanvas, y: number, w: number, tone: Tone) {
  const oval = (rx: number, ry: number) => {
    const o = Skia.Path.Make();
    o.addOval(Skia.XYWHRect(-rx, y - ry, rx * 2, ry * 2));
    return o;
  };
  const rings: [number, number, string[]][] =
    tone === "flame"
      ? [
          [0.8, 0.98, GOLD.slice(0, 3)],
          [0.56, 0.7, ["#FF8A6A", "#C2203A", "#6A0A18"]],
          [0.32, 0.41, ["#9AB8E8", "#2A4A8A", "#0A1430"]],
        ]
      : tone === "ash"
        ? [
            [0.8, 0.98, ["#8A7A72", "#4A3C36", "#1A120E"]],
            [0.56, 0.7, ["#FF9A4A", "#C2380A", "#4A0A02"]],
            [0.32, 0.41, ["#3A2C26", "#140C0A", "#000000"]],
          ]
        : [
            [0.8, 0.98, ["#FFFFFF", "#FFF4D0", "#FFD27A"]],
            [0.56, 0.7, ["#FFFFFF", "#FFE6A0", "#FFB040"]],
            [0.32, 0.41, ["#FFFFFF", "#FFF8E8", "#FFE6A0"]],
          ];
  rings.forEach(([rx, ry, cs], i) => {
    const o = oval(w * rx, w * ry);
    c.drawPath(o, brush(radial(-w * 0.3, y - w * 0.4, w * 1.3, cs)));
    if (i !== 1) c.drawPath(o, pen(0.5, toneInk(tone, INK_GOLD)));
  });
  if (tone === "flame") {
    const gleam = Skia.Path.Make();
    gleam.addCircle(-w * 0.1, y - w * 0.17, w * 0.09);
    c.drawPath(gleam, brush("#FFFFFF", 0.9));
  }
}

function drawTailPlume(c: SkCanvas, p: (typeof TAIL)[number], tone: Tone) {
  const { len, w } = p;
  c.save();
  c.rotate(p.at + 90, 0, 0);
  c.translate(0, -TAIL_R);
  c.rotate(-p.lean, 0, 0);
  let barbs = "";
  for (let j = 0; j < 6; j++) {
    const s = 0.12 + j * 0.1;
    barbs += `M0 ${f2(-len * s)}L${f2(w)} ${f2(-len * (s + 0.12))}`;
    barbs += `M0 ${f2(-len * s)}L${f2(-w)} ${f2(-len * (s + 0.12))}`;
  }
  const d = p.eye ? tailPlume(len, w) : FEATHER(len, w);
  if (tone !== "hot") {
    const sh = toPath(d);
    if (sh) {
      c.save();
      c.translate(0.6, 1);
      c.drawPath(sh, brush("#1A0402", 0.3));
      c.restore();
    }
  }
  engrave(c, {
    d,
    fill: linear(
      0,
      0,
      0,
      -len,
      tone === "flame"
        ? p.eye
          ? TAIL_FILL
          : TAIL_FILLER
        : tone === "ash"
          ? ASH_FILL
          : HOT_FILL,
    ),
    ink: toneInk(tone, "#4A0C04"),
    width: 0.95,
    edge: tone === "flame" ? "#F6C64A" : tone === "ash" ? "#FF5A14" : undefined,
    edgeWidth: tone === "ash" ? 0.5 : 0.75,
    vein: barbs + `M0 -1L0 ${f2(-len * (p.eye ? 0.7 : 0.88))}`,
    veinColor: tone === "flame" ? "#5A0A04" : "#FF7A2A",
    veinWidth: 0.4,
    veinAlpha: 0.5,
  });
  if (p.eye) drawEye(c, -len * 0.8, w, tone);
  c.restore();
}

const drawTailHalf = (c: SkCanvas, tone: Tone) => {
  // the plumes higher up lie under the ones below them
  for (let k = TAIL.length - 1; k >= 1; k--) {
    if (!TAIL[k].eye) drawTailPlume(c, TAIL[k], tone);
  }
  for (let k = TAIL.length - 1; k >= 1; k--) {
    if (TAIL[k].eye) drawTailPlume(c, TAIL[k], tone);
  }
};
const TAIL_HALF = baked((c) => drawTailHalf(c, "flame"));
const TAIL_MID = baked((c) => drawTailPlume(c, TAIL[0], "flame"));
/** The whole tail in one (the right half, its mirror, the middle plume),
 *  for the ash and the white heat, which don't fan. */
const wholeTail = (tone: Tone) =>
  baked((c) => {
    const half = record((h) => drawTailHalf(h, tone));
    c.drawPicture(half);
    c.save();
    c.scale(-1, 1);
    c.drawPicture(half);
    c.restore();
    drawTailPlume(c, TAIL[0], tone);
  });
const TAIL_ASH = wholeTail("ash");
const TAIL_HOT = wholeTail("hot");

/** One part of the tail (the right half, the left, or the middle
 *  plume): the halves fan open and shut a little in time with the wings,
 *  and spread back out as the bird re-forms. */
function TailFan({
  t,
  side,
  image,
}: {
  t: Clock;
  side: 1 | -1 | 0;
  image: () => Baked | null;
}) {
  const fanned = useDerivedValue(() => {
    const u = phPhase(t.value);
    const a = u < 8.3 ? 1 : phAlive(u, 1);
    const open = Math.sin(t.value * 1.3 - 0.6) * 0.035;
    const s = 0.7 + 0.3 * (1 - (1 - a) ** 3);
    return [
      { rotate: side * (open + (1 - a) * 0.3) },
      { scaleX: (side === 0 ? 1 : side) * s },
      { scaleY: s },
    ];
  });
  return <MovingBake image={image} transform={fanned} />;
}

function Tail({ t }: { t: Clock }) {
  const shown = useDerivedValue(() => phShown(phPhase(t.value)));
  const ash = useDerivedValue(() => phAsh(phPhase(t.value), 1));
  const crumble = useDerivedValue(() => {
    const u = phPhase(t.value);
    const c = u < 8.3 ? 0 : ss(8.3, 9.1, u);
    return [{ translateY: c * 5 }];
  });
  const hot = useDerivedValue(() => phBurst(phPhase(t.value)) ** 1.5 * 0.9);
  return (
    <Group>
      <Group opacity={ash}>
        <Group transform={crumble}>
          <Bake image={TAIL_ASH} />
        </Group>
      </Group>
      <Fade opacity={shown}>
        <TailFan t={t} side={1} image={TAIL_HALF} />
        <TailFan t={t} side={-1} image={TAIL_HALF} />
        <TailFan t={t} side={0} image={TAIL_MID} />
      </Fade>
      <Group opacity={hot}>
        <Bake image={TAIL_HOT} />
      </Group>
    </Group>
  );
}

// ── the rim of feathers over the picture's edge ───────────────────────

/** Small gold feathers laid round the ring, each pointing up the ring
 *  toward the heart, between two gold wires. The right half; the left is
 *  mirrored into the same picture. */
const RIM_FEATHERS = Array.from({ length: 18 }, (_, k) => ({
  at: 90 - k * 10,
}));
const RIM_IN = ring(51, 49.4);
const RIM_OUT = ring(59.4, 57.4);
const RIM_TWIST = Array.from({ length: 72 }, (_, k) => {
  const a = k * 5;
  return `M${at(a, 57.7)}L${at(a + 2.2, 59.1)}`;
}).join("");
const RIM_FILL = ["#9A6B1E", "#E2B04A", "#F6CC5A", "#FF8A2A", "#D8380E"];

function drawRimFeather(c: SkCanvas, a: number, tone: Tone) {
  const len = 11.5;
  const w = 3.3;
  const d = FEATHER(len, w);
  c.save();
  c.rotate(a + 90, 0, 0);
  c.translate(0, -52.6);
  // lie along the ring, pointing up it, tilted a little outward
  c.rotate(-72, 0, 0);
  engrave(c, {
    d,
    fill:
      tone === "flame"
        ? linear(0, 0, 0, -len, RIM_FILL, [0, 0.3, 0.55, 0.82, 1])
        : linear(0, 0, 0, -len, tone === "ash" ? ASH_FILL : HOT_FILL),
    ink: toneInk(tone, "#3A1606"),
    width: 0.8,
    edge: tone === "ash" ? "#FF5A14" : undefined,
    edgeWidth: 0.45,
    vein: `M0 -0.6L${f2(-w * 0.15)} ${f2(-len * 0.85)}M0 ${f2(-len * 0.3)}L${f2(w * 0.8)} ${f2(-len * 0.45)}M0 ${f2(-len * 0.5)}L${f2(w * 0.8)} ${f2(-len * 0.65)}`,
    veinColor: tone === "flame" ? "#7A3A0A" : "#FF7A2A",
    veinWidth: 0.4,
    veinAlpha: 0.6,
  });
  c.restore();
}

const drawRimFeathers = (c: SkCanvas, tone: Tone) => {
  for (const side of [1, -1]) {
    c.save();
    c.scale(side, 1);
    // from the top down, so each tip lies over the root above it
    for (let k = RIM_FEATHERS.length - 1; k >= 0; k--)
      drawRimFeather(c, RIM_FEATHERS[k].at, tone);
    c.restore();
  }
};
const RIM_PICS = {
  flame: baked((c) => drawRimFeathers(c, "flame")),
  ash: baked((c) => drawRimFeathers(c, "ash")),
  hot: baked((c) => drawRimFeathers(c, "hot")),
};
const RIM_WIRES = baked((c) => {
  engrave(c, {
    d: RIM_OUT,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, GOLD),
    ink: INK_GOLD,
    width: 0.8,
    vein: RIM_TWIST,
    veinColor: VEIN_GOLD,
    veinWidth: 0.45,
    shine: arc(58.9, -165, -110),
    shineWidth: 0.6,
  });
  engrave(c, {
    d: RIM_IN,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, GOLD),
    ink: INK_GOLD,
    width: 0.7,
    shine: arc(50.6, -160, -115),
    shineWidth: 0.5,
  });
});

/** The fire rim: thin where it crosses the feathers, so the gold shows,
 *  licking over them now and then; white-hot and wide in the burst,
 *  sunk to embers while the bird is ash. */
const REBORN_RIM = `
uniform float t;
uniform float burst;
uniform float ash;
uniform float kindle;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 34.0 || r > 76.0) return half4(0.0);
  vec2 dir = xy / r;
  float s = t * 1.5;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = (4.0 + 6.5 * n) * (1.0 + burst * 0.9 + kindle * 0.4) * (1.0 - ash * 0.55);
  float d = abs(r - 54.5 + (n2 - 0.5) * 4.0);
  float heat = (1.0 - d / width) * (0.6 + n * 0.8);
  if (heat <= 0.0) return half4(0.0);
  vec3 col = mix(vec3(0.85, 0.16, 0.02), vec3(1.0, 0.6, 0.12), smoothstep(0.2, 0.55, heat));
  col = mix(col, vec3(1.0, 0.96, 0.76), smoothstep(0.6, 0.95, heat));
  col = mix(col, vec3(1.0, 0.99, 0.95), burst * smoothstep(0.05, 0.7, heat));
  float glow = smoothstep(0.45, 0.8, fbm(dir * 9.0 + vec2(t * 0.25, -t * 0.15)));
  vec3 ember = mix(vec3(0.3, 0.03, 0.0), vec3(1.0, 0.38, 0.06), glow);
  col = mix(col, ember, ash);
  float a = smoothstep(0.04, 0.4, heat);
  float band = 1.0 - smoothstep(2.6, 4.2, abs(r - 54.2));
  float lick = smoothstep(0.4, 0.75, fbm(dir * 6.0 + vec2(-s * 1.2, s)));
  a *= 1.0 - band * (1.0 - lick) * 0.62 * (1.0 - burst);
  a *= 1.0 - ash * (0.55 - 0.45 * glow);
  // never far over the face
  a *= smoothstep(44.5, 49.0, r);
  return half4(col * a, a);
}`;

// ── the heart, the crest and the ruby ─────────────────────────────────

const HEART_Y = -55.5;
/** The fire opal, a flame-shaped stone pointing up, in a gold setting
 *  cupped by two scrolls. */
const HEART_SET = LEAF(17, 8.6);
const HEART_GEM = LEAF(12.5, 6);
const HEART_SCROLLS = [
  curl(-3.5, -3, -Math.PI / 2 - 1.15, 15, -4.3, 4, 0.7),
  curl(3.5, -3, -Math.PI / 2 + 1.15, 15, 4.3, 4, 0.7),
];
const RUBY_Y = 56.5;

const heartSetting = baked((c) => {
  c.save();
  c.translate(0, HEART_Y + 7);
  for (const s of HEART_SCROLLS)
    engrave(c, {
      d: s.outline,
      fill: linear(0, 0, 0, -16, ["#9A6B1E", "#E2B04A", "#FFF2B8"]),
      ink: INK_GOLD,
      width: 0.85,
      vein: s.vein,
      veinColor: VEIN_GOLD,
      veinWidth: 0.5,
    });
  engrave(c, {
    d: HEART_SET,
    fill: linear(-8, -17, 8, 0, GOLD),
    ink: INK_GOLD,
    width: 1,
    shine: "M-5.4 -4Q-6.4 -9 -2.6 -14",
    shineWidth: 0.7,
  });
  c.translate(0, -2.2);
  engrave(c, {
    d: HEART_GEM,
    fill: radial(-1.8, -8.5, 12, [
      "#FFFBE0",
      "#FFC24A",
      "#F2501A",
      "#9A0A0A",
      "#3A0204",
    ]),
    ink: "#3A0204",
    width: 0.8,
    vein: "M0 -1V-11M-4 -5.5L0 -8.2L4 -5.5M-3.2 -2.4L0 -4.4L3.2 -2.4",
    veinColor: "#FFE6A0",
    veinWidth: 0.4,
    veinAlpha: 0.55,
    shine: "M-3 -4.5Q-3.6 -7.5 -1.2 -10.4",
    shineWidth: 0.8,
    shineAlpha: 0.95,
  });
  c.restore();
  // the ruby below, in a gold collet
  const collet = Skia.Path.Make();
  collet.addCircle(0, RUBY_Y, 5.8);
  c.drawPath(collet, brush(radial(-2, RUBY_Y - 2, 9, GOLD)));
  c.drawPath(collet, pen(0.9, INK_GOLD));
  jewel(
    c,
    0,
    RUBY_Y,
    4.2,
    4.6,
    4.6,
    ["#FF9AA6", "#D0102E", "#5A0410"],
    "#3A0408",
    "#FFC0C8",
  );
});

/** The heart beats, lub-dub; in the burst it blazes, and it glows on
 *  alone through the ash until the bird rises from it. */
function Heart({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => {
    const u = phPhase(t.value);
    const q = (t.value % 1.25) / 1.25;
    const lub = Math.exp(-((q - 0.05) ** 2) / 0.002);
    const dub = Math.exp(-((q - 0.24) ** 2) / 0.002) * 0.7;
    const beat = 0.3 + 0.6 * (lub + dub);
    const ashy = phAsh(u, 0);
    return Math.min(1, beat * (1 - ashy) + ashy * 0.95 + phBurst(u));
  });
  const swell = useDerivedValue(() => {
    const u = phPhase(t.value);
    const rise = ss(8.25, 8.6, u) * (1 - ss(8.7, 9.4, u));
    return [{ scale: 1 + phBurst(u) * 0.8 + rise * 1.4 }];
  });
  return (
    <Group transform={[{ translateX: 0 }, { translateY: HEART_Y }]}>
      <Group transform={swell} opacity={glow} blendMode="screen">
        <Circle cx={0} cy={0} r={9} color="#FF6A1A">
          <BlurMask blur={6} style="normal" />
        </Circle>
        <Circle cx={0} cy={0} r={4} color="#FFE6A0">
          <BlurMask blur={2.5} style="normal" />
        </Circle>
      </Group>
    </Group>
  );
}

/** The flame over the heart: it roars in the burst, sinks to a glow in
 *  the ash, and leaps up as the bird rises. */
function CrestFire({ t }: { t: Clock }) {
  const size = useDerivedValue(() => {
    const u = phPhase(t.value);
    const k = 1 + phBurst(u) * 0.3 + phKindle(u) * 0.2 - phAsh(u, 0) * 0.65;
    return [
      { translateY: HEART_Y - 9 },
      { scale: k },
      { translateY: -(HEART_Y - 9) },
    ];
  });
  return (
    <Group transform={size}>
      <Circle cx={0} cy={HEART_Y - 14} r={8} color="#FFB347" opacity={0.5}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Fire x={0} y={HEART_Y - 6} width={17} height={27} clock={t} />
    </Group>
  );
}

// ── embers ────────────────────────────────────────────────────────────

/** Embers the collapse throws off the wings and tail: they burst out,
 *  rise and go out. */
const EMBERS = Array.from({ length: 26 }, (_, i) => {
  if (i < 18) {
    const side = i % 2 ? 1 : -1;
    const rot = 0.4 + rnd(i + 1) * 1.6;
    const rho = 22 + rnd(i + 2) * 34;
    const x = side * (WING_ROOT.x + rho * Math.sin(rot));
    const y = WING_ROOT.y - rho * Math.cos(rot);
    return { x, y };
  }
  const a = (40 + rnd(i + 5) * 100) * DEG;
  const r = 60 + rnd(i + 6) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}).map((p, i) => {
  const l = Math.hypot(p.x, p.y) || 1;
  const speed = 10 + rnd(i + 9) * 14;
  return {
    ...p,
    vx: (p.x / l) * speed,
    vy: (p.y / l) * speed - 14 - rnd(i + 11) * 10,
    delay: rnd(i + 13) * 0.35,
    size: 0.9 + rnd(i + 15) * 0.9,
  };
});

function Ember({ t, i }: { t: Clock; i: number }) {
  const e = EMBERS[i];
  const transform = useDerivedValue(() => {
    const q = clamp01((phPhase(t.value) - 7.6 - e.delay) / 1.7);
    const ease = 1 - (1 - q) * (1 - q);
    return [
      { translateX: e.x + e.vx * ease + Math.sin(q * 7 + i) * 2 },
      { translateY: e.y + e.vy * ease },
    ];
  });
  const opacity = useDerivedValue(() => {
    const q = (phPhase(t.value) - 7.6 - e.delay) / 1.7;
    if (q <= 0 || q >= 1) return 0;
    return (
      Math.sin(Math.PI * Math.sqrt(q)) *
      (0.7 + 0.3 * Math.sin(t.value * 23 + i))
    );
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={e.size * 2.6} color="#FF6A1A" opacity={0.45}>
        <BlurMask blur={e.size * 1.6} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={e.size} color="#FFE6A0" />
    </Group>
  );
}

// ── the layers ────────────────────────────────────────────────────────

function RebornBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => {
    const u = phPhase(t.value);
    return (
      0.42 +
      0.08 * Math.sin(t.value * 1.3) +
      phBurst(u) * 0.45 -
      phAsh(u, 0) * 0.3 +
      phKindle(u) * 0.2
    );
  });
  const bloom = useDerivedValue(() => phBurst(phPhase(t.value)) ** 2 * 0.7);
  return (
    <Group>
      <Halo r={94} color="#FF6A1F" opacity={glow} />
      <Halo r={90} color="#FFF0C0" opacity={bloom} />
      <Sparks
        t={t}
        count={9}
        from={-Math.PI}
        to={0}
        r={72}
        rise={22}
        seed={7}
      />
      <Tail t={t} />
      <RebornWing t={t} side={-1} />
      <RebornWing t={t} side={1} />
    </Group>
  );
}

function RebornFront({ t }: { t: Clock }) {
  const rim = useDerivedValue<Record<string, number>>(() => {
    const u = phPhase(t.value);
    return {
      t: t.value,
      burst: phBurst(u),
      ash: phAsh(u, 0),
      kindle: phKindle(u),
    };
  });
  const ash = useDerivedValue(() => phAsh(phPhase(t.value), 0));
  const hot = useDerivedValue(() => phBurst(phPhase(t.value)) ** 1.5 * 0.9);
  const embers = useDerivedValue<number>(() => {
    const u = phPhase(t.value);
    return u > 7.6 && u < 9.7 ? 1 : 0;
  });
  return (
    <Group>
      <Bake image={RIM_PICS.flame} />
      <Group opacity={ash}>
        <Bake image={RIM_PICS.ash} />
      </Group>
      <Bake image={RIM_WIRES} />
      <Group opacity={hot}>
        <Bake image={RIM_PICS.hot} />
      </Group>
      <Sweep t={t} d={RIM_OUT} evenOdd every={5} phase={1.2} />
      <Sksl sksl={REBORN_RIM} uniforms={rim} x={-76} y={-76} w={152} h={152} />
      <CrestFire t={t} />
      <Bake image={heartSetting} />
      <Heart t={t} />
      <Glint t={t} x={-1.5} y={HEART_Y - 3} size={5} phase={0.4} speed={1} />
      <Glint t={t} x={-1} y={RUBY_Y - 1.5} size={4} phase={2.2} speed={1.1} />
      <Glint t={t} x={-41.5} y={-41.5} size={4} phase={3.6} speed={0.9} />
      <Shown when={embers}>
        {EMBERS.map((_, i) => (
          <Ember key={i} t={t} i={i} />
        ))}
      </Shown>
      <Sparks
        t={t}
        count={5}
        from={-Math.PI * 0.9}
        to={-Math.PI * 0.1}
        r={57}
        rise={22}
        size={1.3}
        seed={63}
      />
    </Group>
  );
}

const PhoenixReborn: ArtBorderDrawing = {
  back: RebornBack,
  front: RebornFront,
};

// ══ Void Emperor ═════════════════════════════════════════════════════

// The cycle: calm until 6.4; the void drawing everything in, faster and
// faster, to 7.6; then it lets go, a ring of violet light leaving it.
const VOID_PERIOD = 9;
const voidPhase = (t: number) => {
  "worklet";
  return (t + 2) % VOID_PERIOD;
};
/** How hard the void is pulling: up to 1, then a recoil below 0. */
const voidPull = (u: number) => {
  "worklet";
  if (u < 6.4) return 0;
  if (u < 7.6) {
    const k = (u - 6.4) / 1.2;
    return k * k * k;
  }
  const q = u - 7.6;
  if (q < 0.12) return 1 - (q / 0.12) * 1.3;
  return -0.3 * (1 - ss(0.12, 1.3, q));
};
/** The light let go. */
const voidFlash = (u: number) => {
  "worklet";
  return u < 7.6 ? 0 : Math.exp(-(u - 7.6) * 3.2);
};

const OBSIDIAN_INK = "#020104";
const BLACK_SILVER = ["#D8D0E8", "#6A6278", "#1E1828", "#8A8298"];
const INK_BLACK = "#08060E";
const AMETHYST = ["#E6CCFF", "#7A2BD0", "#2A0858", "#0E0220"];

/** The void over the picture's edge: black space churning, the inside
 *  turning faster than the outside, violet filaments wound through it,
 *  stars smeared into arcs as they go down. A thin bright line where it
 *  meets the picture, a violet glow outside. Pulling, it tightens and
 *  swallows its own light; letting go, it flares. */
const VOID_RIM = `
uniform float t;
uniform float pull;
uniform float flash;
${NOISE}
vec2 rot(vec2 v, float a) { float c = cos(a); float s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 44.0 || r > 70.0) return half4(0.0);
  vec2 dir = xy / r;
  float R0 = 55.0 - pull * 2.2;
  float spin = t * 0.5 + (64.0 - r) * 0.1 + pull * 1.2;
  vec2 d = rot(dir, spin);
  float n = fbm(d * 3.0 + vec2(r * 0.1, -t * 0.2));
  float n2 = fbm(rot(dir, -t * 0.25 + r * 0.06) * 6.0 + vec2(t * 0.35, r * 0.2));
  float wob = (n - 0.5) * 3.6;
  float halfW = 5.6 + 1.8 * n2 + pull * 1.2;
  float dist = abs(r - R0 + wob);
  float body = 1.0 - smoothstep(halfW - 2.0, halfW, dist);
  // the body's colour only shows inside it: outside, only the lit edges
  vec3 col = vec3(0.0);
  if (body > 0.0) {
    // violet filaments wound through the dark
    float fil = smoothstep(0.52, 0.84, fbm(d * 5.5 + vec2(n * 2.0, r * 0.22 - t * 0.5)));
    col = mix(vec3(0.02, 0.0, 0.04), vec3(0.3, 0.07, 0.55), fil * 0.85);
    col += vec3(0.72, 0.48, 1.0) * fil * fil * fil * 1.05;
    // stars going down, smeared by the turning (one in ten cells)
    vec2 p = rot(xy, spin * 1.4) / 2.6;
    vec2 cell = floor(p);
    float h = hash(cell + 7.0);
    if (h >= 0.9) {
      vec2 off = vec2(hash(cell + 3.1), hash(cell + 9.7)) * 0.6 + 0.2;
      float sd = length((fract(p) - off) * vec2(0.55, 1.0));
      float star = exp(-sd * sd * 60.0) * (0.6 + 0.4 * sin(t * 6.0 + h * 40.0));
      col += vec3(0.9, 0.82, 1.0) * star * body;
    }
  }
  // its edges, lit
  float inner = exp(-pow((r - (R0 - halfW + wob + 0.6)) / 0.7, 2.0));
  float outer = exp(-pow((r - (R0 + halfW + wob - 0.3)) / 1.5, 2.0));
  float glow = (inner * 0.95 + outer * 0.55) * (1.0 - pull * 0.55) + (inner + outer) * flash * 1.2;
  vec3 lit = mix(vec3(0.6, 0.32, 1.0), vec3(0.82, 0.66, 1.0), inner);
  glow = min(glow, 1.0);
  float a = body * 0.97;
  vec3 outc = col * a + lit * glow * (1.0 - a * 0.4);
  return half4(outc, min(1.0, a + glow * (1.0 - a)));
}`;

/** Behind: dust wound into spiral arms and faint stars, drawn slowly in
 *  toward the void; light only, never a dark disc. */
const VOID_DUST = `
uniform float t;
uniform float pull;
uniform float flash;
${NOISE}
vec2 rot(vec2 v, float a) { float c = cos(a); float s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
half4 main(vec2 xy) {
  float r = length(xy);
  if (r < 56.0 || r > 94.0) return half4(0.0);
  float rs = r * (1.0 + pull * 0.14);
  vec2 dir = xy / r;
  float lr = log(rs);
  vec2 d = rot(dir, lr * 6.0 + t * 0.32);
  float fade = smoothstep(57.0, 66.0, rs) * (1.0 - smoothstep(78.0, 93.0, r));
  float dust = 0.0;
  vec3 col = vec3(0.0);
  if (fade > 0.0) {
    float n = fbm(d * 2.2 + vec2(0.0, lr * 4.0 + t * 0.35));
    float arms = smoothstep(0.42, 0.85, n);
    dust = arms * fade * (0.42 + flash * 0.4);
    col = mix(vec3(0.32, 0.1, 0.66), vec3(0.8, 0.62, 1.0), smoothstep(0.6, 0.95, n));
  }
  // faint stars, wound in with the dust (in one cell in fourteen)
  vec2 p = rot(xy, lr * 6.0 + t * 0.32) / 3.2;
  vec2 cell = floor(p);
  float h = hash(cell + 21.0);
  float star = 0.0;
  if (h >= 0.93) {
    vec2 off = vec2(hash(cell + 1.7), hash(cell + 5.3)) * 0.6 + 0.2;
    float sd = length(fract(p) - off);
    star = exp(-sd * sd * 70.0) * (0.55 + 0.45 * sin(t * 2.5 + h * 50.0));
    star *= smoothstep(58.0, 64.0, r) * (1.0 - smoothstep(86.0, 93.0, r));
  }
  vec3 outc = col * dust + vec3(0.92, 0.88, 1.0) * star;
  return half4(outc, min(1.0, dust + star));
}`;

// ── the crown ─────────────────────────────────────────────────────────

/** Seven obsidian points rising from a blackened-silver band over the
 *  ring's top: the middle tallest, long and short between. */
const CROWN_BASE = 63;
const POINTS = [
  { da: -26, h: 13, w: 4 },
  { da: -17.5, h: 20, w: 4.8 },
  { da: -9, h: 15, w: 4 },
  { da: 0, h: 25, w: 5.8 },
  { da: 9, h: 15, w: 4 },
  { da: 17.5, h: 20, w: 4.8 },
  { da: 26, h: 13, w: 4 },
].map((p) => {
  const a = -90 + p.da;
  const top = 66 + p.h;
  const P = (dda: number, r: number): Pt => {
    const q = polar((a + dda) * DEG, r);
    return [q.x, q.y];
  };
  const tip = P(0, top);
  const baseL = P(-p.w, CROWN_BASE);
  const baseR = P(p.w, CROWN_BASE);
  const shL = P(-p.w * 0.88, 66 + p.h * 0.42);
  const shR = P(p.w * 0.82, 66 + p.h * 0.5);
  const ridge = P(p.w * 0.12, CROWN_BASE);
  return {
    a,
    tip,
    outline: poly([baseL, shL, tip, shR, baseR]),
    lit: poly([baseL, shL, tip, ridge]),
    dark: poly([tip, shR, baseR, ridge]),
    shine: `M${f2(baseL[0] * 0.6 + shL[0] * 0.4)} ${f2(baseL[1] * 0.6 + shL[1] * 0.4)}L${f2(shL[0])} ${f2(shL[1])}L${f2(shL[0] * 0.4 + tip[0] * 0.6)} ${f2(shL[1] * 0.4 + tip[1] * 0.6)}`,
    vein: `M${f2(tip[0])} ${f2(tip[1])}L${f2(ridge[0])} ${f2(ridge[1])}M${f2(shL[0])} ${f2(shL[1])}L${f2(ridge[0] * 0.5 + tip[0] * 0.5)} ${f2(ridge[1] * 0.5 + tip[1] * 0.5)}`,
  };
});
/** The band the points stand in: an arc of the ring, grooved, its ends
 *  cut square with a bead. */
const BAND_A0 = -90 - 29.5;
const BAND_A1 = -90 + 29.5;
const CROWN_BAND = `M${at(BAND_A0, 60.5)}A60.5 60.5 0 0 1 ${at(BAND_A1, 60.5)}L${at(BAND_A1, 66.8)}A66.8 66.8 0 0 0 ${at(BAND_A0, 66.8)}Z`;
const BAND_GROOVES =
  arc(61.7, BAND_A0 + 1, BAND_A1 - 1) + arc(65.6, BAND_A0 + 1, BAND_A1 - 1);
const BAND_STUDS = [-25.5, -19, -12.5, 12.5, 19, 25.5].map((da) =>
  polar((-90 + da) * DEG, 63.65),
);
const AM_Y = -63.6;

/** The silver bezel round the void, ticked like a dial. */
const BEZEL = ring(64.2, 61.6);
const BEZEL_TICKS = Array.from({ length: 72 }, (_, k) => {
  const a = k * 5;
  return `M${at(a, 62)}L${at(a, k % 3 === 0 ? 63.9 : 62.9)}`;
}).join("");

const crownImage = baked((c) => {
  // the points, behind the band
  for (const p of POINTS) {
    engrave(c, {
      d: p.outline,
      fill: linear(p.tip[0], p.tip[1], 0, -CROWN_BASE, [
        "#0A0614",
        "#06030C",
        "#2A1450",
      ]),
      ink: OBSIDIAN_INK,
      width: 0.9,
      edge: "#7A4AD0",
      edgeWidth: 0.35,
    });
    // the facet facing the light, lit violet from the void below
    engrave(c, {
      d: p.lit,
      fill: linear(p.tip[0], p.tip[1], 0, -CROWN_BASE, [
        "#2A1648",
        "#6A32C0",
        "#B48CFF",
      ]),
      ink: OBSIDIAN_INK,
      width: 0,
      shine: p.shine,
      shineColor: "#F0E2FF",
      shineWidth: 0.6,
      shineAlpha: 0.9,
    });
    engrave(c, {
      d: p.outline,
      fill: "#00000000",
      ink: OBSIDIAN_INK,
      width: 0.8,
      vein: p.vein,
      veinColor: "#C8A8FF",
      veinWidth: 0.35,
      veinAlpha: 0.55,
    });
  }
  // the band, over their feet
  engrave(c, {
    d: CROWN_BAND,
    fill: linear(-40, -72, 40, -58, BLACK_SILVER),
    ink: INK_BLACK,
    width: 0.9,
    vein: BAND_GROOVES,
    veinColor: "#120E1A",
    veinWidth: 0.45,
    shine: arc(66.1, -117, -99),
    shineWidth: 0.6,
  });
  for (const s of BAND_STUDS) {
    const stud = Skia.Path.Make();
    stud.addCircle(s.x, s.y, 1.25);
    c.drawPath(
      stud,
      brush(radial(s.x - 0.5, s.y - 0.5, 2, ["#FFFFFF", "#8A8298", "#221C2E"])),
    );
    c.drawPath(stud, pen(0.4, INK_BLACK));
  }
  // the amethyst's collet and stone
  engrave(c, {
    d: kite(0, AM_Y, 6.6, 9.4, 8.2),
    fill: linear(-6, -74, 6, -56, BLACK_SILVER),
    ink: INK_BLACK,
    width: 0.8,
  });
  jewel(c, 0, AM_Y, 4.8, 7.4, 6.4, AMETHYST, "#0A0218", "#E6CCFF");
});

const bezelImage = baked((c) => {
  engrave(c, {
    d: BEZEL,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, BLACK_SILVER),
    ink: INK_BLACK,
    width: 0.7,
    vein: BEZEL_TICKS,
    veinColor: "#120E1A",
    veinWidth: 0.4,
    shine: arc(63.7, -165, -128),
    shineWidth: 0.55,
  });
});

// ── the filigree ──────────────────────────────────────────────────────

/** Thin blackened-silver filigree round the bezel: a wire running from
 *  the crown's band down to the pendant, tied to the bezel by beaded
 *  bridges, small scrolls curling off it; acanthus curls away from the
 *  pendant below. The right half. */
const sector = (rIn: number, rOut: number, a0: number, a1: number) =>
  `M${at(a0, rOut)}A${rOut} ${rOut} 0 0 1 ${at(a1, rOut)}L${at(a1, rIn)}A${rIn} ${rIn} 0 0 0 ${at(a0, rIn)}Z`;
const FIL_WIRE = sector(69, 70.8, -60, 80);
const FIL_WIRE_GROOVE = arc(69.9, -58, 78);
const FIL_CURLS = [-46, -18, 10, 38, 62].map((a, k) => {
  const p = polar(a * DEG, 70.4);
  const dir = k % 2 ? -1 : 1;
  return curl(
    p.x,
    p.y,
    (a + dir * 38) * DEG,
    13 - k * 0.6,
    dir * 4.4,
    2.6,
    0.65,
  );
});
const FIL_BRIDGES = [-32, -4, 24, 52].map((a) => ({
  d: sector(64, 69.2, a - 0.9, a + 0.9),
  bead: polar(a * DEG, 66.6),
}));
const FIL_LOW = acanthus(5, 69, 0.18, 42, -4.8, 3.6, true);
const PENDANT = kite(0, 71, 4.2, 4, 9);

const filigreeImage = baked((c) => {
  const silver = (d: string, vein?: string, width = 0.75) =>
    engrave(c, {
      d,
      fill: linear(-20, -80, 40, 80, BLACK_SILVER),
      ink: INK_BLACK,
      width,
      vein,
      veinColor: "#B8A8E0",
      veinWidth: 0.35,
      veinAlpha: 0.55,
    });
  const bead = (x: number, y: number, r: number) => {
    const b = Skia.Path.Make();
    b.addCircle(x, y, r);
    c.drawPath(
      b,
      brush(
        radial(x - r * 0.4, y - r * 0.4, r * 1.6, [
          "#FFFFFF",
          "#8A8298",
          "#221C2E",
        ]),
      ),
    );
    c.drawPath(b, pen(0.45, INK_BLACK));
  };
  const half = () => {
    for (const s of FIL_CURLS) silver(s.outline, s.vein);
    for (const s of FIL_LOW) silver(s.outline, s.vein);
    for (const b of FIL_BRIDGES) silver(b.d, undefined, 0.6);
    silver(FIL_WIRE, FIL_WIRE_GROOVE, 0.7);
    for (const b of FIL_BRIDGES) bead(b.bead.x, b.bead.y, 1.35);
  };
  half();
  c.save();
  c.scale(-1, 1);
  half();
  c.restore();
  // the pendant: an obsidian drop in a silver claw
  engrave(c, {
    d: PENDANT,
    fill: linear(-3, 66, 3, 80, ["#5A2AA0", "#120A20", "#04020A"]),
    ink: OBSIDIAN_INK,
    width: 0.8,
    edge: "#7A4AD0",
    edgeWidth: 0.35,
    vein: "M0 67V79",
    veinColor: "#C8A8FF",
    veinWidth: 0.3,
    veinAlpha: 0.5,
    shine: "M-2.6 71.2L-0.6 68.2",
    shineColor: "#F0E2FF",
    shineWidth: 0.5,
  });
  const claw = Skia.Path.Make();
  claw.addCircle(0, 66.2, 1.8);
  c.drawPath(
    claw,
    brush(radial(-0.6, 65.6, 2.6, ["#FFFFFF", "#8A8298", "#221C2E"])),
  );
  c.drawPath(claw, pen(0.5, INK_BLACK));
});

// ── the lightning ─────────────────────────────────────────────────────

/** Arcs between neighbouring points' tips, and two longer ones across
 *  the middle; each in a few shapes it flickers between. */
const ARC_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [1, 3],
  [3, 5],
];
const ARC_SHAPES = 4;
const arcPath = (i: number, j: number, seed: number) => {
  const a = POINTS[i].tip;
  const b = POINTS[j].tip;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  // bow outward, away from the picture
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const ml = Math.hypot(mx, my) || 1;
  const bow = Math.min(5, l * 0.18);
  const N = 9;
  const pts: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const env = Math.sin(Math.PI * s);
    const jag = k === 0 || k === N ? 0 : (rnd(seed + k * 7.3) - 0.5) * 4.4;
    pts.push([
      a[0] + dx * s + (mx / ml) * bow * env + (-dy / l) * jag,
      a[1] + dy * s + (my / ml) * bow * env + (dx / l) * jag,
    ]);
  }
  return `M${pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}`;
};
const ARCS = ARC_PAIRS.map(([i, j], k) =>
  Array.from({ length: ARC_SHAPES }, (_, s) =>
    arcPath(i, j, k * 31 + s * 7 + 1),
  ),
);

// ── stars falling in ──────────────────────────────────────────────────

const STREAK =
  "M0.8 0Q0.5 1.2 -1.2 1.3L-11 0.3L-11 -0.3L-1.2 -1.3Q0.5 -1.2 0.8 0Z";

/** Stars caught by the void: each spirals in, stretching as it speeds
 *  up, and is gone at the rim. */
const INFALL = Array.from({ length: 12 }, (_, i) => {
  const life = 2.8 + rnd(i) * 1.8;
  const r0 = 84 + rnd(i + 9) * 6;
  return {
    life,
    a0: rnd(i + 3) * TAU,
    r0,
    off: rnd(i + 5) * life,
    fall: r0 - 60,
    pale: i % 3 === 0,
  };
});

// ── the release ───────────────────────────────────────────────────────

/** The ring of violet light the void lets go, its soft glow worked out
 *  per pixel as a blur of sigma 4 would leave a band of width w at
 *  radius r (the difference of two error functions across it), so the
 *  ring can widen and thin every frame without blurring anything. */
const RELEASE_GLOW = `
uniform float r;
uniform float w;
float erf1(float x) {
  float a = abs(x);
  float k = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * exp(-a * a);
  return x < 0.0 ? -y : y;
}
half4 main(vec2 xy) {
  float d = length(xy) - r;
  // 1 / (sigma * sqrt(2)), sigma 4
  float s = 0.17677670;
  float v = 0.5 * (erf1((d + w * 0.5) * s) - erf1((d - w * 0.5) * s));
  return half4(half3(0.60392, 0.35294, 1.0) * v, v);
}`;

// ── how it is drawn each frame ────────────────────────────────────────
// Every frame Skia redraws each canvas, four borders at a time, so: the
// crown, the bezel and the filigree are baked into pixels once; so are
// the glows (the amethyst's, the tips', each lightning shape's halo),
// blurs and all, which then only fade. Each layer is one picture,
// recorded per frame from one derived value with the same numbers as
// ever, placing those images and drawing the few live strokes.

interface Cell {
  image: SkImage;
  src: SkRect;
  dst: SkRect;
}

const voidScale = () => (PixelRatio.get() * BAKE_PT) / 100;

/** `draw` baked into pixels over the art rect x, y, w, h. */
function voidBake(
  draw: (c: SkCanvas) => void,
  x: number,
  y: number,
  w: number,
  h: number,
): Cell | null {
  const k = voidScale();
  const W = Math.ceil(w * k);
  const H = Math.ceil(h * k);
  const surface = Skia.Surface.Make(W, H);
  if (!surface) return null;
  const c = surface.getCanvas();
  c.scale(k, k);
  c.translate(-x, -y);
  draw(c);
  surface.flush();
  return {
    image: surface.makeImageSnapshot(),
    src: Skia.XYWHRect(0, 0, W, H),
    dst: Skia.XYWHRect(x, y, W / k, H / k),
  };
}

const asCell = (b: Baked | null): Cell | null =>
  b
    ? {
        image: b.image,
        src: Skia.XYWHRect(0, 0, b.image.width(), b.image.height()),
        dst: b.rect,
      }
    : null;

/** A soft paint: `blur` is a blur's sigma, in art units. */
function softly(paint: ReturnType<typeof brush>, blur: number) {
  paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  return paint;
}

/** A plain stroke, as a Path with only a width and a round join. */
function line(width: number, color: string) {
  const paint = pen(width, color);
  paint.setStrokeCap(StrokeCap.Butt);
  return paint;
}

const glintStar = (size: number) => {
  const w = size * 0.2;
  return Skia.Path.MakeFromSVGString(
    `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`,
  ) as SkPath;
};
/** A four-pointed glint that flares and fades (as Glint in kit). */
const glintAt = (
  x: number,
  y: number,
  size: number,
  phase: number,
  speed: number,
) => ({ x, y, path: glintStar(size), phase, speed });

const voidParts = (() => {
  let made: ReturnType<typeof makeVoidParts> | undefined;
  return () => (made ??= makeVoidParts());
})();

function makeVoidParts() {
  const screen = Skia.Paint();
  screen.setBlendMode(BlendMode.Screen);
  // each lightning shape's violet halo, baked: one sheet per arc, its
  // shapes side by side
  const halo = softly(pen(3.6, "#8A3AFF"), 2.6);
  const arcPaths = ARCS.map((shapes) =>
    shapes.map((d) => Skia.Path.MakeFromSVGString(d) as SkPath),
  );
  const arcGlows = arcPaths.map((paths) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of paths) {
      const b = p.computeTightBounds();
      x0 = Math.min(x0, b.x);
      y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.width);
      y1 = Math.max(y1, b.y + b.height);
    }
    // past the stroke and three sigmas of its blur
    const m = 10.5;
    x0 -= m;
    y0 -= m;
    const w = x1 - x0 + m;
    const h = y1 - y0 + m;
    const stride = w + 2;
    const sheet = voidBake(
      (c) =>
        paths.forEach((p, s) => {
          c.save();
          c.translate(s * stride, 0);
          c.drawPath(p, halo);
          c.restore();
        }),
      x0,
      y0,
      stride * ARC_SHAPES,
      h,
    );
    const k = voidScale();
    return paths.map((_, s): Cell | null =>
      sheet
        ? {
            image: sheet.image,
            src: Skia.XYWHRect(s * stride * k, 0, w * k, h * k),
            dst: Skia.XYWHRect(x0, y0, w, h),
          }
        : null,
    );
  });
  const tipX = POINTS.map((p) => p.tip[0]);
  const tipY = POINTS.map((p) => p.tip[1]);
  const tx0 = Math.min(...tipX) - 10;
  const ty0 = Math.min(...tipY) - 10;
  const tipGlow = softly(brush("#B07AFF"), 2);
  return {
    plain: Skia.Paint(),
    screen,
    crown: asCell(crownImage()),
    bezel: asCell(bezelImage()),
    filigree: asCell(filigreeImage()),
    bezelPath: toPath(BEZEL, true),
    bandPath: toPath(CROWN_BAND),
    sweepColors: ["#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"].map((col) =>
      Skia.Color(col),
    ),
    amethystGlow: voidBake(
      (c) => c.drawCircle(0, AM_Y, 8, softly(brush("#8A3AFF"), 5)),
      -24,
      AM_Y - 24,
      48,
      48,
    ),
    tipGlow: voidBake(
      (c) =>
        POINTS.forEach((p) => c.drawCircle(p.tip[0], p.tip[1], 2.6, tipGlow)),
      tx0,
      ty0,
      Math.max(...tipX) + 10 - tx0,
      Math.max(...tipY) + 10 - ty0,
    ),
    arcPaths,
    arcGlows,
    arcSeed: ARC_PAIRS.map((_, k) => rnd(k + 40)),
    arcHalo: Skia.Paint(),
    arcMid: line(1.5, "#C9A0FF"),
    arcCore: line(0.6, "#FFFFFF"),
    streak: toPath(STREAK) as SkPath,
    streakPale: brush(
      linear(0.8, 0, -11, 0, ["#FFFFFF", "#E6CCFF", "#9A5AFF00"], [0, 0.25, 1]),
    ),
    streakDeep: brush(
      linear(0.8, 0, -11, 0, ["#FFFFFF", "#B48CFF", "#5A2AD000"], [0, 0.25, 1]),
    ),
    releaseFx: Skia.RuntimeEffect.Make(RELEASE_GLOW),
    releaseGlow: (() => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setStyle(PaintStyle.Stroke);
      paint.setBlendMode(BlendMode.Screen);
      return paint;
    })(),
    releaseLine: (() => {
      const paint = pen(1, "#EADCFF");
      paint.setBlendMode(BlendMode.Screen);
      return paint;
    })(),
    white: brush("#FFFFFF"),
    backGlints: [glintAt(0, 78, 3.5, 1.7, 0.8)],
    crownGlints: [
      glintAt(-1.4, AM_Y - 2, 4.5, 0.5, 0.9),
      glintAt(POINTS[3].tip[0], POINTS[3].tip[1], 4, 2.6, 1.1),
    ],
    rimGlints: [glintAt(-44.5, -44.5, 3.5, 3.8, 0.8)],
  };
}

type VoidParts = ReturnType<typeof makeVoidParts>;

/** `paint` at alpha `a`, clamped as Skia's opacity is. A picture keeps a
 *  copy of each paint it draws with, so one paint serves many alphas. */
const vFaded = (paint: SkPaint, a: number) => {
  "worklet";
  paint.setAlphaf(Math.min(1, Math.max(0, a)));
  return paint;
};

/** A baked image where it belongs, sampled as Bake samples it. */
const vPut = (c: SkCanvas, b: Cell | null, paint: SkPaint) => {
  "worklet";
  if (b)
    c.drawImageRectOptions(
      b.image,
      b.src,
      b.dst,
      FilterMode.Linear,
      MipmapMode.Linear,
      paint,
    );
};

/** The shared light sweeping a shape (as Sweep in crowns): a soft white
 *  band, tilted, crossing once every `every` seconds, drawn as the shape
 *  filled with a moving gradient. */
const vSweep = (
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

const vGlints = (
  c: SkCanvas,
  P: VoidParts,
  list: VoidParts["rimGlints"],
  t: number,
) => {
  "worklet";
  for (const g of list) {
    const s = Math.max(0, Math.sin(t * g.speed + g.phase));
    if (s <= 0) continue;
    c.save();
    c.translate(g.x, g.y);
    const k = 0.15 + s ** 5;
    c.scale(k, k);
    c.drawPath(g.path, vFaded(P.white, s ** 3));
    c.restore();
  }
};

const vBegin = () => {
  "worklet";
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-120, -120, 240, 240));
  return { recorder, c };
};

// ── the layers ────────────────────────────────────────────────────────

/** Behind: the halo and the dust, then the stars falling in and the
 *  filigree, leaning in toward the void as it pulls. */
function VoidBack({ t }: { t: Clock }) {
  const P = useMemo(() => voidParts(), []);
  const uniforms = useDerivedValue<Record<string, number>>(() => {
    const u = voidPhase(t.value);
    return { t: t.value, pull: voidPull(u), flash: voidFlash(u) };
  });
  const glow = useDerivedValue(() => {
    const u = voidPhase(t.value);
    return (
      0.2 +
      0.05 * Math.sin(t.value * 0.9) -
      Math.max(0, voidPull(u)) * 0.12 +
      voidFlash(u) * 0.3
    );
  });
  const picture = useDerivedValue(() => {
    const T = t.value;
    const pull = voidPull(voidPhase(T));
    const { recorder, c } = vBegin();
    // the stars: each spirals in, stretching as it speeds up
    for (const s of INFALL) {
      const p = ((T + s.off) % s.life) / s.life;
      const op = Math.sin(p * Math.PI) ** 0.7;
      if (!(op > 0)) continue;
      const q = Math.min(1, p * p + Math.max(0, pull) * 0.25 * p);
      const a = s.a0 - q * 3.2;
      const r = (s.r0 - q * s.fall) * (1 - pull * 0.05);
      const head = a + Math.atan2(-3.2 * r, -s.fall);
      c.save();
      c.translate(Math.cos(a) * r, Math.sin(a) * r);
      c.rotate((head * 180) / Math.PI, 0, 0);
      c.scale(0.25 + 1.3 * p, 1);
      c.drawPath(P.streak, vFaded(s.pale ? P.streakPale : P.streakDeep, op));
      c.restore();
    }
    const k = 1 - pull * 0.04;
    c.save();
    c.scale(k, k);
    vPut(c, P.filigree, P.plain);
    c.restore();
    vGlints(c, P, P.backGlints, T);
    return recorder.finishRecordingAsPicture();
  });
  return (
    <Group>
      <Halo r={94} color="#7A3AE0" opacity={glow} />
      <Sksl
        sksl={VOID_DUST}
        uniforms={uniforms}
        x={-94}
        y={-94}
        w={188}
        h={188}
      />
      <Picture picture={picture} />
    </Group>
  );
}

/** Over the picture's edge: the void, then the bezel, the crown with its
 *  glows and lightning (leaning in as it pulls), and the release. */
function VoidFront({ t }: { t: Clock }) {
  const P = useMemo(() => voidParts(), []);
  const uniforms = useDerivedValue<Record<string, number>>(() => {
    const u = voidPhase(t.value);
    return { t: t.value, pull: voidPull(u), flash: voidFlash(u) };
  });
  const picture = useDerivedValue(() => {
    const T = t.value;
    const u = voidPhase(T);
    const pull = voidPull(u);
    const flash = voidFlash(u);
    const drawing = Math.max(0, pull);
    const { recorder, c } = vBegin();
    vPut(c, P.bezel, P.plain);
    vSweep(c, P.bezelPath, P.sweepColors, T, 5.6, 0.4);
    const k = 1 - pull * 0.035;
    c.save();
    c.scale(k, k);
    vPut(c, P.crown, P.plain);
    vSweep(c, P.bandPath, P.sweepColors, T, 5.6, 0.9);
    // the amethyst's glow: slow, dark, flaring when the void lets go
    vPut(
      c,
      P.amethystGlow,
      vFaded(P.screen, 0.3 + 0.22 * Math.sin(T * 1.4) + drawing * 0.4 + flash),
    );
    // the points' tips, kindled when lightning leaves them
    vPut(
      c,
      P.tipGlow,
      vFaded(P.screen, 0.35 + 0.2 * Math.sin(T * 3.1) + flash),
    );
    // the lightning, each arc flickering between its shapes
    for (let a = 0; a < ARC_PAIRS.length; a++) {
      const rate = a >= 6 ? 0.31 : 0.47;
      const q = (T * rate + P.arcSeed[a]) % 1;
      const on = q < 0.13 + drawing * 0.25 ? 1 : 0;
      const flick = 0.65 + 0.35 * Math.sin(T * 47 + a);
      const op = Math.min(1, on * flick + flash * 1.4);
      if (!(op > 0.004)) continue;
      const s = Math.floor(T * 14 + a * 3) % ARC_SHAPES;
      vPut(c, P.arcGlows[a][s], vFaded(P.arcHalo, op));
      c.drawPath(P.arcPaths[a][s], vFaded(P.arcMid, op));
      c.drawPath(P.arcPaths[a][s], vFaded(P.arcCore, op));
    }
    vGlints(c, P, P.crownGlints, T);
    c.restore();
    // the ring of violet light the void lets go
    if (u >= 7.6) {
      const q = clamp01((u - 7.6) / 1.3);
      const op = (1 - q) ** 1.6;
      if (op > 0.004 && P.releaseFx) {
        const r = 56 + (1 - (1 - q) ** 2) * 36;
        const w = 6 * (1 - q) + 1;
        P.releaseGlow.setShader(P.releaseFx.makeShader([r, w]));
        P.releaseGlow.setStrokeWidth(w + 28);
        c.drawCircle(0, 0, r, vFaded(P.releaseGlow, op));
        c.drawCircle(0, 0, r, vFaded(P.releaseLine, op));
      }
    }
    vGlints(c, P, P.rimGlints, T);
    return recorder.finishRecordingAsPicture();
  });
  return (
    <Group>
      <Sksl
        sksl={VOID_RIM}
        uniforms={uniforms}
        x={-70}
        y={-70}
        w={140}
        h={140}
      />
      <Picture picture={picture} />
    </Group>
  );
}

const VoidEmperor: ArtBorderDrawing = { back: VoidBack, front: VoidFront };

export const INFERNO_ART: Record<string, ArtBorderDrawing> = {
  "phoenix-reborn": PhoenixReborn,
  "void-emperor": VoidEmperor,
};

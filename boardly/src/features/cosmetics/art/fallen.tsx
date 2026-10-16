// Fallen Angel: the seraph's ring gone dark. A forged iron ring lies
// over the picture's edge: bevelled lips, the outer one knurled, and
// between them a channel where embers crawl, studded with iron rivets
// and glowing coals; a blood-red gem beats at its foot in an iron
// setting. Two black wings hang down from the shoulders, their feathers
// engraved (shaft and barbs), ragged, singed crimson at the edge. A
// cracked halo of tarnished silver slips crooked above, one shard
// sagging out of line; its light gutters and stutters, never quite out.
// Black feathers drift down through the smoke.

import {
  BlurMask,
  Circle,
  ClipOp,
  FillType,
  Group,
  LinearGradient,
  PaintStyle,
  Path,
  Picture,
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
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { fmt, type Pt } from "@/components/engraved/shapes";

import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { AURA_CLOUD, Fx, aura } from "./rimfx";

const DEG = Math.PI / 180;
const INK = "#050307";
const CRIMSON = "#D8304A";
const IRON = ["#9A8A9E", "#4A3E52", "#1A141E", "#6A5A6E"];

// ── drawing straight onto a canvas, for the recorded pictures ─────────

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

function pen(width: number, color: string, alpha = 1, butt = false) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(butt ? StrokeCap.Butt : StrokeCap.Round);
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

const svg = (d: string) => Skia.Path.MakeFromSVGString(d);
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;

// ── the wings ─────────────────────────────────────────────────────────

/** A ragged wing feather pointing up from its root: a narrow leading
 *  vane on the left, a broad trailing one on the right split by a notch
 *  or two where the barbs have parted. Returns its outline, the ragged
 *  edge (singed crimson) and its engraving (shaft and barbs). */
function ragged(len: number, w: number, seed: number) {
  const prof = (s: number) => {
    const grow = Math.min(1, 0.45 + s * 2.4);
    const tip = s > 0.72 ? Math.sqrt(Math.max(0, 1 - ((s - 0.72) / 0.28) ** 2)) : 1;
    return grow * tip;
  };
  const at = (side: number, s: number, k = 1): Pt => [
    side * w * prof(s) * k,
    -len * s,
  ];
  const notches = [0.42 + 0.22 * rnd(seed), 0.7 + 0.12 * rnd(seed + 1)];
  const right: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const s = i / 16;
    for (const n of notches)
      if (s > n && s - 1 / 16 <= n) {
        right.push(at(1, n));
        right.push([w * prof(n) * 0.28, -len * (n - 0.07)]);
        right.push(at(1, n + 0.035, 0.94));
      }
    right.push(at(1, s));
  }
  const lead = 0.58;
  const left: Pt[] = [];
  const leftNotch = rnd(seed + 2) > 0.5 ? 0.55 + 0.2 * rnd(seed + 3) : -1;
  for (let i = 0; i <= 16; i++) {
    const s = i / 16;
    if (s > leftNotch && s - 1 / 16 <= leftNotch) {
      left.push(at(-1, leftNotch, lead));
      left.push([-w * lead * prof(leftNotch) * 0.3, -len * (leftNotch - 0.06)]);
      left.push(at(-1, leftNotch + 0.03, lead * 0.94));
    }
    left.push(at(-1, s, lead));
  }
  const outline = `M${right.map(fmt).join("L")}L${[...left]
    .reverse()
    .map(fmt)
    .join("L")}Z`;
  // the singed edge: the trailing vane from its first notch round the tip
  const from = right.findIndex((p) => p[1] < -len * (notches[0] - 0.02));
  const edge = `M${right.slice(Math.max(0, from)).map(fmt).join("L")}`;
  let barbs = `M0 0L0 ${(-len * 0.93).toFixed(2)}`;
  for (let s = 0.14; s < 0.86; s += 0.11) {
    const [x1, y1] = at(1, s + 0.09, 0.85);
    const [x2, y2] = at(-1, s + 0.07, lead * 0.85);
    const y0 = (-len * s).toFixed(2);
    barbs += `M0 ${y0}L${fmt([x1, y1])}M0 ${y0}L${fmt([x2, y2])}`;
  }
  return { outline, edge, barbs, shaft: `M0 0L0 ${(-len * 0.93).toFixed(2)}` };
}

/** Rows of feathers fanned from the shoulder, longest underneath. A
 *  feather's turn is from straight up: ~1.6 is out over the shoulder,
 *  π is straight down. The longest hang down and out. */
const ROWS = [
  {
    count: 13,
    from: 1.6,
    to: 3.1,
    len: (f: number) => 30 + Math.sin(f * Math.PI * 0.6) * 52,
    w: 8,
    at: 0,
    colors: ["#040306", "#181020", "#3A2236"],
  },
  {
    count: 10,
    from: 1.5,
    to: 2.95,
    len: (f: number) => 26 + Math.sin(f * Math.PI * 0.7) * 14,
    w: 8,
    at: 3,
    colors: ["#06040A", "#1E1628", "#3E2A44"],
  },
  {
    count: 8,
    from: 1.6,
    to: 2.7,
    len: () => 18,
    w: 7.4,
    at: 6,
    colors: ["#08060C", "#241A2C", "#4A3650"],
  },
];

function drawFeather(
  c: SkCanvas,
  f: { len: number; w: number; seed: number; colors: string[] },
) {
  const p = ragged(f.len, f.w, f.seed);
  const path = svg(p.outline);
  if (!path) return;
  // a red rim of light round every feather, so the wing reads on the dark
  c.drawPath(path, pen(2.2, "#B02236", 0.45));
  c.drawPath(path, brush(linear(0, 0, 0, -f.len, f.colors)));
  c.save();
  c.clipPath(path, ClipOp.Intersect, true);
  const barbs = svg(p.barbs);
  if (barbs) c.drawPath(barbs, pen(0.45, "#6A5274", 0.7));
  const shaft = svg(p.shaft);
  if (shaft) c.drawPath(shaft, pen(0.8, "#8A2A3C", 0.9));
  c.restore();
  c.drawPath(path, pen(0.9, INK));
  const edge = svg(p.edge);
  if (edge) c.drawPath(edge, pen(0.75, CRIMSON, 0.9));
}

/** The right wing, rooted at the origin, recorded once. */
function recordWing(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-120, -120, 240, 240));
  ROWS.forEach((row, r) => {
    for (let k = 0; k < row.count; k++) {
      const f = k / (row.count - 1);
      const rot = row.from + (row.to - row.from) * f;
      const seed = r * 17 + k * 5 + 3;
      // ragged: no two the same length
      const len = row.len(f) * (0.84 + 0.28 * rnd(seed));
      c.save();
      c.rotate(rot / DEG, 0, 0);
      c.translate(0, -row.at);
      drawFeather(c, { len, w: row.w, seed, colors: row.colors });
      c.restore();
    }
  });
  return recorder.finishRecordingAsPicture();
}

const SHOULDER: Pt = [52, -36];
const WING_SCALE = 0.72;

function Wing({
  t,
  side,
  picture,
}: {
  t: Clock;
  side: 1 | -1;
  picture: SkPicture;
}) {
  // the wing hangs heavy and sways a little, hinged at the shoulder
  const droop = useDerivedValue(() => [
    { translateX: side * SHOULDER[0] },
    { translateY: SHOULDER[1] },
    { rotate: side * (Math.sin(t.value * 0.9 + (side < 0 ? 0.6 : 0)) * 0.04 + 0.02) },
    { scaleX: side },
    { scale: WING_SCALE },
  ]);
  return (
    <Group transform={droop}>
      <Picture picture={picture} />
    </Group>
  );
}

const LOOSE = ragged(14, 3.4, 9);

/** A black feather drifting down past the wing, turning as it falls. */
function Falling({ t, i }: { t: Clock; i: number }) {
  const life = 4.5 + rnd(i * 3 + 1) * 2.5;
  const side = i % 2 === 0 ? 1 : -1;
  const x0 = side * (58 + rnd(i * 3 + 2) * 24);
  const start = rnd(i * 3 + 3) * life;
  const transform = useDerivedValue(() => {
    const p = ((t.value + start) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 6 + i) * 7 },
      { translateY: -30 + p * 112 },
      { rotate: Math.sin(p * 5 + i) * 0.9 + side * 0.6 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + start) % life) / life;
    return Math.sin(p * Math.PI) * 0.95;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={LOOSE.outline}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, -14)}
          colors={["#0A060E", "#3A2840"]}
        />
      </Path>
      <Path path={LOOSE.outline} style="stroke" strokeWidth={0.6} color={INK} />
      <Path path={LOOSE.edge} style="stroke" strokeWidth={0.6} color={CRIMSON} />
      <Path
        path={LOOSE.shaft}
        style="stroke"
        strokeWidth={0.5}
        color="#8A2A3C"
      />
    </Group>
  );
}

const SMOKE = aura("#06030A", "#3A0C22", "#B02236", 0.45, 0.9);

// ── the iron ring ─────────────────────────────────────────────────────

const R_IN = 49;
const R_OUT = 63;
const RING = circle(R_OUT) + circle(R_IN);
/** The channel between the lips, where the embers crawl. */
const CH_IN = 52.6;
const CH_OUT = 59.6;
const CHANNEL = circle(CH_OUT) + circle(CH_IN);
const STUDS = 24;
/** Every other stud is a coal; the rest are rivets. */
const studAt = (k: number) => polar((k / STUDS) * TAU - Math.PI / 2, 56.1);

/** The setting at the foot. */
const SETTING = "M0 79L13 63L0 48L-13 63z";
const SETTING_BEVEL = "M0 75L9.5 63L0 52L-9.5 63z";

function recordRing(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  const ring = svg(RING);
  if (!ring) return recorder.finishRecordingAsPicture();
  ring.setFillType(FillType.EvenOdd);
  // the ring's shadow on the picture
  c.drawCircle(0.6, 1.2, R_IN - 0.4, pen(2.4, "#000000", 0.35));
  c.drawPath(ring, brush(linear(-50, -63, 50, 63, IRON)));
  // the lips: bevelled, lit from the top left
  const lit = ["#D2C2D6", "#6A5A70", "#140E18", "#4A3C50"];
  const inner = pen(CH_IN - R_IN - 0.6, "#000000");
  inner.setShader(linear(-40, -40, 40, 40, lit));
  c.drawCircle(0, 0, (R_IN + CH_IN) / 2, inner);
  const outer = pen(R_OUT - CH_OUT - 0.6, "#000000");
  outer.setShader(linear(-50, -50, 50, 50, lit));
  c.drawCircle(0, 0, (R_OUT + CH_OUT) / 2, outer);
  // the outer lip knurled: fine cuts all round
  let knurl = "";
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * TAU;
    const p0 = polar(a, CH_OUT + 0.9);
    const p1 = polar(a + 1.2 * DEG, R_OUT - 0.7);
    knurl += `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}L${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  const kn = svg(knurl);
  if (kn) c.drawPath(kn, pen(0.45, "#0A060C", 0.75));
  // a shine along the inner lip's lit side
  const s0 = polar(-170 * DEG, 50.6);
  const s1 = polar(-100 * DEG, 50.6);
  const shine = svg(`M${s0.x} ${s0.y}A50.6 50.6 0 0 1 ${s1.x} ${s1.y}`);
  if (shine) c.drawPath(shine, pen(0.8, "#FFFFFF", 0.55));
  // the ink: round the ring and both sides of the channel
  for (const r of [R_IN, R_OUT]) c.drawCircle(0, 0, r, pen(1.3, INK));
  for (const r of [CH_IN, CH_OUT]) c.drawCircle(0, 0, r, pen(0.9, INK));
  return recorder.finishRecordingAsPicture();
}

/** The rivets and coal cups, over the embers. */
function recordStuds(): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  for (let k = 0; k < STUDS; k++) {
    const p = studAt(k);
    const coal = k % 2 === 0;
    if (k === STUDS / 2) continue; // under the setting at the foot
    const r = coal ? 2.9 : 2.3;
    c.drawCircle(p.x + 0.4, p.y + 0.6, r, brush("#000000", 0.5));
    c.drawCircle(
      p.x,
      p.y,
      r,
      brush(radial(p.x - r * 0.4, p.y - r * 0.45, r * 1.7, ["#A898AE", "#3A3042", "#08050A"])),
    );
    c.drawCircle(p.x, p.y, r, pen(0.55, INK));
    // a coal's cup: a dark hollow for the ember to sit in
    if (coal) c.drawCircle(p.x, p.y, 1.5, brush("#1A0406"));
  }
  // the setting at the foot: forged iron, bevelled, inked
  const setting = svg(SETTING);
  const bevel = svg(SETTING_BEVEL);
  if (setting && bevel) {
    c.drawPath(setting, brush(linear(-13, 48, 13, 79, IRON)));
    c.drawPath(bevel, brush(linear(-9, 52, 9, 75, ["#1A141E", "#4A3E52"])));
    const facets = svg("M0 48L0 52M13 63L9.5 63M0 79L0 75M-13 63L-9.5 63");
    if (facets) c.drawPath(facets, pen(0.6, "#C2B2C6", 0.8));
    c.drawPath(bevel, pen(0.7, INK));
    c.drawPath(setting, pen(1.3, INK));
  }
  return recorder.finishRecordingAsPicture();
}

let RING_PIC: SkPicture | null = null;
let STUD_PIC: SkPicture | null = null;
let WING_PIC: SkPicture | null = null;

/** Embers drifting round the channel, unevenly hot. */
const EMBER = [
  "#140204",
  "#5A0810",
  "#E0301E",
  "#5A0810",
  "#140204",
  "#140204",
  "#2A0406",
  "#9A1418",
  "#2A0406",
  "#140204",
  "#7A0C14",
  "#FF5A2A",
  "#7A0C14",
  "#140204",
  "#140204",
];

/** Three sets of coals, each glowing on its own breath. */
function Coals({ t, set }: { t: Clock; set: number }) {
  const glow = useDerivedValue(
    () =>
      0.55 +
      0.45 * Math.sin(t.value * (2.1 + set * 0.37) + set * 2.1) *
        Math.sin(t.value * 0.83 + set),
  );
  const coals = Array.from({ length: STUDS / 2 }, (_, j) => j * 2)
    .filter((k) => k !== STUDS / 2 && (k / 2) % 3 === set)
    .map(studAt);
  return (
    <Group opacity={glow}>
      {coals.map((p, k) => (
        <Group key={k}>
          <Circle cx={p.x} cy={p.y} r={3.4} color="#FF2A2A" opacity={0.6}>
            <BlurMask blur={2.4} style="normal" />
          </Circle>
          <Circle cx={p.x} cy={p.y} r={1.35} color="#FF6A3A" />
          <Circle cx={p.x - 0.3} cy={p.y - 0.35} r={0.55} color="#FFD8A0" />
        </Group>
      ))}
    </Group>
  );
}

// ── the cracked halo ──────────────────────────────────────────────────

const HALO_RX = 25;
const HALO_RY = 6.4;
/** An arc of the halo's ellipse, from θ0 to θ1 (degrees, 0 = right,
 *  90 = nearest us). */
const halo = (a0: number, a1: number) => {
  const pts: Pt[] = [];
  const n = Math.max(2, Math.ceil((a1 - a0) / 6));
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * DEG;
    pts.push([Math.cos(a) * HALO_RX, Math.sin(a) * HALO_RY]);
  }
  return `M${pts.map(fmt).join("L")}`;
};
/** Two whole pieces, and the shard that has sagged out of line. */
const HALO_FIRM = halo(-52, 38) + halo(152, 298);
const HALO_SHARD = halo(46, 144);
/** The cracks' jagged ends. */
/** Hairline cracks running into the metal just short of each break. */
const crackLines = (ends: number[]) =>
  ends
    .map((a) => {
      const x = Math.cos(a * DEG) * HALO_RX;
      const y = Math.sin(a * DEG) * HALO_RY;
      return `M${fmt([x - 0.3, y - 1.9])}L${fmt([x + 0.7, y - 0.5])}L${fmt([x - 0.6, y + 0.4])}L${fmt([x + 0.3, y + 1.9])}`;
    })
    .join("");
const CRACKS_FIRM = crackLines([-48, 34, 156, 294]);
const CRACKS_SHARD = crackLines([50, 140]);
const CRACKS = [-52, 38, 152, -62].map((a) => ({
  x: Math.cos(a * DEG) * HALO_RX,
  y: Math.sin(a * DEG) * HALO_RY,
}));

function HaloPiece({
  d,
  cracks,
  lit,
}: {
  d: string;
  cracks: string;
  lit: SharedValue<number>;
}) {
  return (
    <Group>
      <Path
        path={d}
        style="stroke"
        strokeWidth={5.2}
        strokeCap="butt"
        strokeJoin="round"
        color="#140A0E"
      />
      <Path path={d} style="stroke" strokeWidth={3.4} strokeCap="butt">
        <LinearGradient
          start={vec(-HALO_RX, -HALO_RY)}
          end={vec(HALO_RX, HALO_RY)}
          colors={["#5E5040", "#D2C29C", "#6E5E48", "#B2A280"]}
        />
      </Path>
      {/* lit: the dying light still in the metal */}
      <Path
        path={d}
        style="stroke"
        strokeWidth={3.4}
        strokeCap="butt"
        color="#FFF2DC"
        opacity={lit}
      />
      <Path
        path={d}
        style="stroke"
        strokeWidth={0.8}
        strokeCap="butt"
        color="#FFFFFF"
        opacity={0.6}
        transform={[{ translateY: -0.9 }]}
      />
      <Path
        path={cracks}
        style="stroke"
        strokeWidth={0.6}
        strokeJoin="miter"
        color="#2A1418"
      />
    </Group>
  );
}

function CrackedHalo({ t }: { t: Clock }) {
  // the light gutters now and then — a run of stutters — and otherwise
  // hums, never steady
  const lit = useDerivedValue(() => {
    const x = t.value;
    const gutter = Math.sin(x * 0.9 + 2.0) * Math.sin(x * 0.37 + 1.1);
    if (gutter > 0.5) {
      return Math.sin(x * 29) * Math.sin(x * 11.3) > 0.1 ? 0.08 : 0.65;
    }
    return 0.78 + 0.12 * Math.sin(x * 23) + 0.1 * Math.sin(x * 37.3 + 1.7);
  });
  const bloom = useDerivedValue(() => lit.value * 0.6);
  const core = useDerivedValue(() => lit.value * 0.8);
  // slipped crooked, rocking a little
  const slip = useDerivedValue(() => [
    { translateY: -77 },
    { rotate: -0.24 + Math.sin(t.value * 0.9) * 0.04 },
  ]);
  // the shard swings on its crack, loose
  const sag = useDerivedValue(() => [
    { translateX: 0.8 },
    { translateY: 3 },
    { rotate: 0.07 + Math.sin(t.value * 1.7 + 0.5) * 0.03 },
  ]);
  const both = HALO_FIRM + HALO_SHARD;
  return (
    <Group transform={slip}>
      {/* its light: a crimson bloom round a pale core */}
      <Path
        path={both}
        style="stroke"
        strokeWidth={7}
        strokeCap="butt"
        color="#FF2A40"
        opacity={bloom}
      >
        <BlurMask blur={4.5} style="normal" />
      </Path>
      <Path
        path={both}
        style="stroke"
        strokeWidth={6}
        strokeCap="butt"
        color="#FFE2C8"
        opacity={core}
      >
        <BlurMask blur={3} style="normal" />
      </Path>
      <HaloPiece d={HALO_FIRM} cracks={CRACKS_FIRM} lit={lit} />
      <Group transform={sag} origin={vec(CRACKS[1].x, CRACKS[1].y)}>
        <HaloPiece d={HALO_SHARD} cracks={CRACKS_SHARD} lit={lit} />
      </Group>
      {/* the cracks spit sparks of the old light */}
      {CRACKS.slice(0, 3).map((p, k) => (
        <Glint
          key={k}
          t={t}
          x={p.x}
          y={p.y}
          size={3.2}
          phase={k * 2.3}
          speed={1.6 + k * 0.3}
        />
      ))}
    </Group>
  );
}

// ── the layers ────────────────────────────────────────────────────────

function FallenBack({ t }: { t: Clock }) {
  const wing = useMemo(() => (WING_PIC ??= recordWing()), []);
  return (
    <Group>
      <Halo r={94} color="#8A1022" opacity={0.5} />
      <Fx sksl={AURA_CLOUD} t={t} values={SMOKE} />
      <Wing t={t} side={-1} picture={wing} />
      <Wing t={t} side={1} picture={wing} />
      {Array.from({ length: 6 }, (_, i) => (
        <Falling key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

function FallenFront({ t }: { t: Clock }) {
  const ring = useMemo(() => (RING_PIC ??= recordRing()), []);
  const studs = useMemo(() => (STUD_PIC ??= recordStuds()), []);
  const channel = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(CHANNEL);
    path?.setFillType(FillType.EvenOdd);
    return path ?? undefined;
  }, []);
  // the embers crawl round the channel
  const crawl = useDerivedValue(() => [{ rotate: t.value * 0.22 }]);
  const heat = useDerivedValue(() => 0.75 + 0.25 * Math.sin(t.value * 1.9));
  // the gem beats: lub-dub, rest
  const beat = useDerivedValue(() => {
    const p = (t.value % 1.6) / 1.6;
    const lub = Math.exp(-(((p - 0.08) / 0.05) ** 2));
    const dub = Math.exp(-(((p - 0.3) / 0.06) ** 2)) * 0.7;
    return 0.35 + 0.65 * Math.max(lub, dub);
  });
  return (
    <Group>
      <Picture picture={ring} />
      {/* the embers in the channel */}
      <Group clip={channel}>
        <Group transform={crawl} opacity={heat}>
          <Circle
            cx={0}
            cy={0}
            r={(CH_IN + CH_OUT) / 2}
            style="stroke"
            strokeWidth={CH_OUT - CH_IN}
          >
            <SweepGradient c={vec(0, 0)} colors={EMBER} />
            <BlurMask blur={1.5} style="normal" />
          </Circle>
        </Group>
      </Group>
      <Picture picture={studs} />
      {[0, 1, 2].map((set) => (
        <Coals key={set} t={t} set={set} />
      ))}
      <Sweep t={t} d={RING} evenOdd every={5.5} />

      <CrackedHalo t={t} />

      {/* the blood-red gem at the foot */}
      <Circle cx={0} cy={63} r={11} color="#FF2A3A" opacity={beat}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={63}
        w={9}
        h={12}
        colors={["#FF9A9A", "#C2101E", "#4A0408"]}
      />
      <Glint t={t} x={0} y={63} size={5} phase={1.2} speed={0.8} />
      <Glint t={t} x={-38} y={-38} size={3.5} phase={2.7} speed={0.9} />
    </Group>
  );
}

export const FALLEN_ART = {
  "fallen-angel": {
    back: FallenBack,
    front: FallenFront,
  } satisfies ArtBorderDrawing,
};

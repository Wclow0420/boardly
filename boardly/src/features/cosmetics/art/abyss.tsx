// Black Hole, Molten Lava, Shadow Flame and Blood Moon, enhanced in the
// house's engraved style. Each keeps the living shader rim it was built
// on (rimfx.tsx) and gains a crafted ring round it:
//   Black Hole — the accretion disc and the event horizon as ever, now
//     set in a thin obsidian bezel between gold wires, cut with orbital
//     ticks, a gold bead orbiting it. Matter streaks in and spirals down,
//     lensed light arcs over and under, and a faint jet leaves the poles.
//   Molten Lava — the lava rim, ringed by cracked basalt blocks whose
//     seams and cracks glow and breathe. Molten drips run off the lower
//     stones, cooling as they fall; embers rise; an obsidian jewel in
//     gold sits at the crown.
//   Shadow Flame — the violet shadow-fire, ringed by blackened silver
//     etched with runes that kindle one after another. Smoke wisps curl
//     off it, and an amethyst glows at its crown.
//   Blood Moon — the crimson rim and its aura, under a full blood moon in
//     a beaded silver bezel (a silver crescent still lit at its edge),
//     carried on iron bat wings. A gothic iron ring (an arcade of pointed
//     arches) holds a ruby below, from which drops of blood fall.
// See heraldry.tsx, solar.tsx and tempest.tsx for the house style.

import {
  BlurMask,
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

import { curl } from "@/components/engraved/shapes";
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
import {
  AURA_CLOUD,
  AURA_FLAME,
  BLACK_HOLE_DISC,
  BLACK_HOLE_RIM,
  Fx,
  LAVA_RIM,
  RIM_GLOW,
  aura,
  rim,
} from "./rimfx";

const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(2);
/** A point at angle `a` (radians), radius `r`, as path text. */
const at = (a: number, r: number, cx = 0, cy = 0) => {
  const p = polar(a, r);
  return `${f(cx + p.x)} ${f(cy + p.y)}`;
};
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (r: number, cx = 0, cy = 0, hole = false) => {
  const s = hole ? 0 : 1;
  return `M${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 ${s} ${f(cx + r)} ${f(cy)}Z`;
};
/** A band round a centre (a ring under either fill rule). */
const ring = (rOut: number, rIn: number, cx = 0, cy = 0) =>
  disc(rOut, cx, cy) + disc(rIn, cx, cy, true);
/** An arc of radius r from a0 to a1 (degrees), as an open line. */
const arc = (r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${at(a0 * DEG, r)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${at(a1 * DEG, r)}`;
};
/** A closed polygon through points. */
const poly = (pts: [number, number][]) =>
  `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
/** A kite (a cut jewel or its setting), pointing up and down. */
const kite = (cx: number, cy: number, w: number, top: number, bottom: number) =>
  poly([
    [cx, cy - top],
    [cx + w, cy],
    [cx, cy + bottom],
    [cx - w, cy],
  ]);

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";

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

function pen(width: number, color: string | SkShader, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  if (typeof color === "string") paint.setColor(Skia.Color(color));
  else paint.setShader(color);
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

const path = (d: string, evenOdd = false) => {
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
  shineWidth?: number;
  shineAlpha?: number;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const shape = path(p.d, p.evenOdd);
  if (!shape) return;
  c.drawPath(shape, brush(p.fill));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(shape, ClipOp.Intersect, true);
    const vein = p.vein ? path(p.vein) : null;
    if (vein)
      c.drawPath(
        vein,
        pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, p.veinAlpha ?? 0.75),
      );
    const shine = p.shine ? path(p.shine) : null;
    if (shine)
      c.drawPath(
        shine,
        pen(p.shineWidth ?? 0.9, "#FFFFFF", p.shineAlpha ?? 0.75),
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

/** A picture recorded once, the first time it's drawn. */
function once(draw: (c: SkCanvas) => void) {
  let pic: SkPicture | null = null;
  return () => (pic ??= record(draw));
}

function Still({ picture }: { picture: () => SkPicture }) {
  const pic = useMemo(() => picture(), [picture]);
  return <Picture picture={pic} />;
}

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
  const d = kite(cx, cy, w, top, bottom);
  engrave(c, {
    d,
    fill: radial(cx - w * 0.35, cy - top * 0.4, Math.max(w, top) * 1.6, colors),
    ink,
    width: 0.7,
    // the table and the facets running to it
    vein:
      kite(cx, cy - top * 0.08, w * 0.46, top * 0.46, bottom * 0.5) +
      `M${f(cx)} ${f(cy - top)}V${f(cy - top * 0.54)}M${f(cx + w)} ${f(cy)}H${f(cx + w * 0.46)}M${f(cx)} ${f(cy + bottom)}V${f(cy + bottom * 0.42)}M${f(cx - w)} ${f(cy)}H${f(cx - w * 0.46)}`,
    veinColor: facet,
    veinWidth: 0.4,
    veinAlpha: 0.7,
    shine: `M${f(cx - w * 0.62)} ${f(cy - top * 0.12)}L${f(cx - w * 0.18)} ${f(cy - top * 0.7)}`,
    shineWidth: 0.7,
    shineAlpha: 0.9,
  });
}

// ══ Black Hole ═══════════════════════════════════════════════════════

/** Which way matter goes round: the way the disc turns (anticlockwise
 *  on screen). */
const SPIN = -1;

/** Matter streaking in: a bright head with a tail, spiralling down to
 *  the horizon, stretching as it speeds up. */
const STREAK = "M0.9 0Q0.6 1.5 -1.4 1.6L-14 0.35L-14 -0.35L-1.4 -1.6Q0.6 -1.5 0.9 0Z";

function Streak({ t, i }: { t: Clock; i: number }) {
  const life = 2.6 + rnd(i) * 1.8;
  const a0 = rnd(i + 3) * TAU;
  const r0 = 82 + rnd(i + 9) * 7;
  const off = rnd(i + 5) * life;
  const fall = r0 - 60;
  const transform = useDerivedValue(() => {
    const p = ((t.value + off) % life) / life;
    const q = p * p;
    const a = a0 + SPIN * q * 3.4;
    const r = r0 - q * fall;
    const head = a + Math.atan2(SPIN * 3.4 * r, -fall);
    return [
      { translateX: Math.cos(a) * r },
      { translateY: Math.sin(a) * r },
      { rotate: head },
      { scaleX: 0.25 + 1.4 * p },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + off) % life) / life;
    return Math.sin(p * Math.PI) ** 0.7;
  });
  const hot = i % 4 === 0;
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={STREAK}>
        <LinearGradient
          start={vec(0.9, 0)}
          end={vec(-14, 0)}
          colors={
            hot
              ? ["#FFFFFF", "#B8C8FF", "#7A5BFF00"]
              : ["#FFFFFF", "#FFC27A", "#FF7A1A00"]
          }
          positions={[0, 0.25, 1]}
        />
      </Path>
    </Group>
  );
}

/** A thin crescent of light along a circle: thick at its middle, fine at
 *  its ends (two arcs between the same points). */
function lens(r: number, a0: number, a1: number, thick: number) {
  const half = ((a1 - a0) / 2) * DEG;
  const chord = r * Math.sin(half);
  const sag = r - r * Math.cos(half) - thick;
  const r2 = (chord * chord + sag * sag) / (2 * sag);
  return `M${at(a0 * DEG, r)}A${r} ${r} 0 0 1 ${at(a1 * DEG, r)}A${f(r2)} ${f(r2)} 0 0 0 ${at(a0 * DEG, r)}Z`;
}

/** Light from behind the hole, bent round it: arcs over and under. */
const LENS_TOP = lens(84, -152, -28, 1.6);
const LENS_TOP2 = lens(88.6, -122, -70, 0.9);
const LENS_BOTTOM = lens(81, 34, 146, 1.2);

function Lensing({ t }: { t: Clock }) {
  const top = useDerivedValue(() => 0.55 + 0.3 * Math.sin(t.value * 0.8));
  const bottom = useDerivedValue(
    () => 0.4 + 0.25 * Math.sin(t.value * 0.8 + 2.2),
  );
  return (
    <Group blendMode="screen">
      <Group opacity={top}>
        <Path path={LENS_TOP + LENS_TOP2} color="#8A6BFF">
          <BlurMask blur={2.6} style="normal" />
        </Path>
        <Path path={LENS_TOP + LENS_TOP2} color="#E8EEFF" />
      </Group>
      <Group opacity={bottom}>
        <Path path={LENS_BOTTOM} color="#8A6BFF">
          <BlurMask blur={2.6} style="normal" />
        </Path>
        <Path path={LENS_BOTTOM} color="#E8EEFF" />
      </Group>
    </Group>
  );
}

/** The jets: faint beams leaving the poles, knots of light running out. */
const JET_A = -Math.PI / 2 + 0.32;
const beam = (a: number) => {
  const o = polar(a + Math.PI / 2, 1);
  const b0 = polar(a, 66);
  const b1 = polar(a, 90.8);
  const c1 = polar(a, 86);
  return {
    d: poly([
      [b0.x + o.x * 1.2, b0.y + o.y * 1.2],
      [b1.x + o.x * 3.4, b1.y + o.y * 3.4],
      [b1.x - o.x * 3.4, b1.y - o.y * 3.4],
      [b0.x - o.x * 1.2, b0.y - o.y * 1.2],
    ]),
    core: `M${f(b0.x)} ${f(b0.y)}L${f(c1.x)} ${f(c1.y)}`,
    from: b0,
    to: b1,
  };
};
const JETS = [beam(JET_A), beam(JET_A + Math.PI)];

function Knot({ t, a, k }: { t: Clock; a: number; k: number }) {
  const transform = useDerivedValue(() => {
    const p = ((t.value * 0.7 + k * 0.5) % 1 + 1) % 1;
    const r = 68 + p * 21;
    return [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value * 0.7 + k * 0.5) % 1 + 1) % 1;
    return Math.sin(p * Math.PI) * 0.9;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={2.6} color="#9AB0FF">
        <BlurMask blur={1.6} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={0.9} color="#FFFFFF" />
    </Group>
  );
}

function Jets({ t }: { t: Clock }) {
  const opacity = useDerivedValue(
    () =>
      0.6 + 0.2 * Math.sin(t.value * 5.3) * Math.sin(t.value * 1.7 + 0.4),
  );
  return (
    <Group blendMode="screen" opacity={opacity}>
      {JETS.map((j, k) => (
        <Group key={k}>
          <Path path={j.d}>
            <LinearGradient
              start={vec(j.from.x, j.from.y)}
              end={vec(j.to.x, j.to.y)}
              colors={["#E8EEFFFF", "#9AABFFAA", "#6A6BFF00"]}
            />
            <BlurMask blur={1.6} style="normal" />
          </Path>
          <Path
            path={j.core}
            style="stroke"
            strokeWidth={0.9}
            strokeCap="round"
            opacity={0.85}
          >
            <LinearGradient
              start={vec(j.from.x, j.from.y)}
              end={vec(j.to.x, j.to.y)}
              colors={["#FFFFFF", "#C8D4FF00"]}
            />
          </Path>
          <Knot t={t} a={JET_A + k * Math.PI} k={0} />
          <Knot t={t} a={JET_A + k * Math.PI} k={1} />
        </Group>
      ))}
    </Group>
  );
}

/** The bezel: obsidian between two gold wires, cut with orbital ticks. */
const BEZEL = ring(68, 61.8);
const OBSIDIAN = ring(66.8, 63);
const BEZEL_TICKS = Array.from({ length: 60 }, (_, k) => {
  const a = k * 6 * DEG;
  const long = k % 5 === 0;
  return `M${at(a, long ? 63.3 : 65)}L${at(a, 66.5)}`;
}).join("");

const bezelPicture = once((c) => {
  engrave(c, {
    d: BEZEL,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, GOLD),
    ink: INK_GOLD,
    width: 0.8,
    shine: arc(67.4, -165, -110),
    shineWidth: 0.6,
  });
  engrave(c, {
    d: OBSIDIAN,
    evenOdd: true,
    fill: linear(-60, -60, 60, 60, [
      "#6A5A8A",
      "#1C1630",
      "#05030A",
      "#2A2040",
      "#4A3E66",
    ]),
    ink: "#000000",
    width: 0.5,
    vein: BEZEL_TICKS,
    veinColor: "#F0C860",
    veinWidth: 0.5,
    veinAlpha: 0.95,
    shine: arc(65.5, -150, -122),
    shineWidth: 0.5,
    shineAlpha: 0.55,
  });
});

/** A gold bead orbiting on the bezel, a trail of light behind it. */
const TRAIL = SPIN > 0 ? arc(64.9, -40, 0) : arc(64.9, 0, 40);
function Orbiter({ t }: { t: Clock }) {
  const transform = useDerivedValue(() => [
    { rotate: SPIN * t.value * 0.55 - 1.2 },
  ]);
  return (
    <Group transform={transform}>
      <Group blendMode="screen">
        <Path
          path={TRAIL}
          style="stroke"
          strokeWidth={2.6}
          strokeCap="round"
          color="#FFD27A"
          opacity={0.55}
        >
          <BlurMask blur={1.4} style="normal" />
        </Path>
      </Group>
      <Circle cx={64.9} cy={0} r={2.7}>
        <RadialGradient
          c={vec(64, -1)}
          r={3.8}
          colors={["#FFFFFF", "#F0CC72", "#9A6B1E"]}
        />
      </Circle>
      <Circle
        cx={64.9}
        cy={0}
        r={2.7}
        style="stroke"
        strokeWidth={0.6}
        color={INK_GOLD}
      />
    </Group>
  );
}

function BlackHoleBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Halo r={94} color="#7A3FD1" opacity={0.45} />
      <Fx sksl={BLACK_HOLE_DISC} t={t} />
      <Lensing t={t} />
      {Array.from({ length: 16 }, (_, i) => (
        <Streak key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

function BlackHoleFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Fx sksl={BLACK_HOLE_RIM} t={t} extent={68} />
      <Still picture={bezelPicture} />
      <Sweep t={t} d={BEZEL} evenOdd every={5.4} phase={0.6} />
      <Orbiter t={t} />
      <Jets t={t} />
      <Glint t={t} x={-46} y={-46} size={4.5} phase={0.8} speed={0.9} />
      <Glint t={t} x={52} y={38} size={3.5} phase={2.9} speed={1.1} />
    </Group>
  );
}

const BlackHole: ArtBorderDrawing = {
  back: BlackHoleBack,
  front: BlackHoleFront,
};

// ══ Molten Lava ══════════════════════════════════════════════════════

const LAVA_AURA = aura("#5A0A02", "#C22A06", "#FF9A2A", 0.5, 0.55);

const B_IN = 58.4;
const B_OUT = 67;
const BLOCKS_N = 13;
const SEAM = 1.3;

/** The basalt: rough blocks round the rim, a seam of lava between each,
 *  a crack or two in each. */
const BASALT = (() => {
  const joints = Array.from({ length: BLOCKS_N }, (_, k) => ({
    a: (-90 + ((k + 0.5) * 360) / BLOCKS_N + (rnd(k + 300) - 0.5) * 8) * DEG,
    slant: (rnd(k + 320) - 0.5) * 6 * DEG,
  }));
  const blocks: string[] = [];
  const cracks: string[] = [];
  for (let k = 0; k < BLOCKS_N; k++) {
    const j0 = joints[k];
    const j1 = joints[(k + 1) % BLOCKS_N];
    let a1 = j1.a;
    if (a1 < j0.a) a1 += TAU;
    const gi = SEAM / 2 / B_IN;
    const go = SEAM / 2 / B_OUT;
    const o0 = j0.a + j0.slant + go;
    const o1 = a1 + j1.slant - go;
    const i0 = j0.a + gi;
    const i1 = a1 - gi;
    const pts: [number, number][] = [];
    const M = 6;
    for (let m = 0; m <= M; m++) {
      const a = o0 + ((o1 - o0) * m) / M;
      const bump = m === 0 || m === M ? -0.9 : (rnd(k * 17 + m) - 0.5) * 1.3;
      const p = polar(a, B_OUT + bump);
      pts.push([p.x, p.y]);
    }
    for (let m = M; m >= 0; m--) {
      const a = i0 + ((i1 - i0) * m) / M;
      const bump = m === 0 || m === M ? 0.6 : (rnd(k * 23 + m + 5) - 0.5) * 0.7;
      const p = polar(a, B_IN + bump);
      pts.push([p.x, p.y]);
    }
    blocks.push(poly(pts));
    // a crack from the outer face in, jagged, sometimes forking
    const n = 1 + (rnd(k + 340) > 0.45 ? 1 : 0);
    for (let c = 0; c < n; c++) {
      const s = 0.25 + 0.5 * rnd(k * 5 + c + 360);
      const a = o0 + (o1 - o0) * s;
      let d = `M${at(a, B_OUT - 0.4)}`;
      let aa = a;
      for (let st = 1; st <= 3; st++) {
        aa += (rnd(k * 7 + c * 3 + st + 380) - 0.5) * 0.08;
        d += `L${at(aa, B_OUT - 0.4 - st * 2.3)}`;
      }
      cracks.push(d);
    }
  }
  return { blocks, cracks: cracks.join("") };
})();
const BASALT_ALL = BASALT.blocks.join("");
const SEAMS = ring(B_OUT + 0.4, B_IN - 0.4);

/** The obsidian jewel at the crown, set in gold. */
const OBS_Y = -65;
const OBS_SET = kite(0, OBS_Y, 9, 13, 11.5);

const basaltPicture = once((c) => {
  // the stone, lit from the top left, warmed from below by the lava
  for (const d of BASALT.blocks)
    engrave(c, {
      d,
      fill: linear(-60, -70, 60, 70, ["#8E8890", "#4C4650", "#221E24", "#5E5662"]),
      ink: "#0A0606",
      width: 0,
    });
  const all = path(BASALT_ALL);
  if (all) {
    c.save();
    c.clipPath(all, ClipOp.Intersect, true);
    const r = B_OUT + 1;
    c.drawCircle(
      0,
      0,
      r,
      brush(
        radial(0, 0, r, ["#FF6A1A00", "#FF6A1A88", "#FF6A1A00"], [
          (B_IN - 1.5) / r,
          (B_IN + 0.3) / r,
          (B_IN + 4.5) / r,
        ]),
      ),
    );
    // a dull glow from inside the cracks, then the cracks themselves
    const cracks = path(BASALT.cracks);
    if (cracks) {
      c.drawPath(cracks, pen(1.4, "#8A1E06", 0.8));
      c.drawPath(cracks, pen(0.6, "#FF8A2A", 0.9));
    }
    // a white shine along the lit top-left faces
    const shine = path(arc(B_OUT - 1.2, -170, -105));
    if (shine) c.drawPath(shine, pen(0.6, "#FFFFFF", 0.5));
    c.restore();
    c.drawPath(all, pen(0.9, "#0A0606"));
  }
  // the obsidian's gold setting and the stone
  engrave(c, {
    d: OBS_SET,
    fill: linear(-9, OBS_Y - 13, 9, OBS_Y + 11, GOLD),
    ink: INK_GOLD,
    width: 1,
    vein: kite(0, OBS_Y, 7.7, 11.2, 9.9),
    veinColor: VEIN_GOLD,
    veinWidth: 0.45,
    shine: `M-7.6 ${OBS_Y - 0.6}L-0.8 ${OBS_Y - 11.6}`,
    shineWidth: 0.6,
  });
  jewel(
    c,
    0,
    OBS_Y,
    6.4,
    9.4,
    8.2,
    ["#C8B8D8", "#2A2032", "#030205"],
    "#000000",
    "#8A7E94",
  );
  // the lava's light caught in its lower facets
  c.drawPath(
    path(poly([[0, OBS_Y + 8.2], [6.4, OBS_Y], [2.9, OBS_Y + 0.6], [0, OBS_Y + 4.1]])) ??
      Skia.Path.Make(),
    brush("#FF5A1A", 0.45),
  );
});

/** A drip of lava running off a stone, cooling as it falls. */
const DROP = "M-3 0C-3 4.5 -3.4 7.9 0 11.2C3.4 7.9 3 4.5 3 0Z";
const DRIPS = [58, 81, 103, 124].map((deg, i) => {
  const o = polar(deg * DEG, 66);
  const room = Math.sqrt(89 * 89 - o.x * o.x) - o.y - 12.5;
  return { o, room, i };
});

function Drip({
  t,
  o,
  room,
  i,
}: {
  t: Clock;
  o: { x: number; y: number };
  room: number;
  i: number;
}) {
  const every = 2.8 + rnd(i + 20) * 1.6;
  const off = rnd(i + 24) * every;
  const transform = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    if (p < 0.6) {
      return [
        { translateX: o.x },
        { translateY: o.y },
        { scaleX: 0.75 + 0.25 * (p / 0.6) },
        { scaleY: 0.25 + 0.8 * (p / 0.6) },
      ];
    }
    const q = (p - 0.6) / 0.4;
    return [
      { translateX: o.x },
      { translateY: o.y + 2 + q * q * (room - 2) },
      { scaleX: 0.8 },
      { scaleY: 0.95 - 0.25 * q },
    ];
  });
  const hot = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    return p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    return p < 0.85 ? 1 : (1 - p) / 0.15;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={DROP}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, 11.2)}
          colors={["#5A1A0A", "#2A0C06"]}
        />
      </Path>
      <Group opacity={hot}>
        <Path path={DROP} color="#FF5A0A" opacity={0.7}>
          <BlurMask blur={2} style="normal" />
        </Path>
        <Path path={DROP}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, 11.2)}
            colors={["#FFE07A", "#FF7A12", "#C2280A"]}
          />
        </Path>
      </Group>
      <Path
        path={DROP}
        style="stroke"
        strokeWidth={0.6}
        color="#2A0804"
        opacity={0.8}
      />
    </Group>
  );
}

function LavaBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.5 + 0.15 * Math.sin(t.value * 2.3));
  return (
    <Group>
      <Halo r={94} color="#FF4A0A" opacity={glow} />
      <Fx sksl={AURA_FLAME} t={t} values={LAVA_AURA} />
    </Group>
  );
}

function LavaFront({ t }: { t: Clock }) {
  const seam = useDerivedValue(
    () => 0.55 + 0.35 * Math.sin(t.value * 2.1) * Math.sin(t.value * 0.7 + 1),
  );
  const crack = useDerivedValue(
    () => 0.45 + 0.45 * Math.sin(t.value * 1.7 + 2) ** 2,
  );
  return (
    <Group>
      <Fx sksl={LAVA_RIM} t={t} extent={70} />
      {/* the lava between the stones, breathing */}
      <Path path={SEAMS} fillType="evenOdd">
        <RadialGradient
          c={vec(0, 0)}
          r={B_OUT + 0.5}
          colors={["#FFE07A", "#FF7A12", "#C2280A"]}
          positions={[B_IN / (B_OUT + 0.5), 0.94, 1]}
        />
      </Path>
      <Path
        path={SEAMS}
        fillType="evenOdd"
        color="#FFF2B0"
        opacity={seam}
        blendMode="screen"
      />
      <Still picture={basaltPicture} />
      <Group opacity={crack} blendMode="screen">
        <Path
          path={BASALT.cracks}
          style="stroke"
          strokeWidth={1.8}
          strokeCap="round"
          color="#FF7A1A"
        >
          <BlurMask blur={1.2} style="normal" />
        </Path>
        <Path
          path={BASALT.cracks}
          style="stroke"
          strokeWidth={0.5}
          strokeCap="round"
          color="#FFF0B0"
        />
      </Group>
      <Sweep t={t} d={OBS_SET} every={4.6} phase={1.4} />
      {DRIPS.map((d) => (
        <Drip key={d.i} t={t} o={d.o} room={d.room} i={d.i} />
      ))}
      <Sparks
        t={t}
        count={9}
        from={-Math.PI}
        to={0}
        r={64}
        rise={24}
        color="#FF8A2A"
        seed={31}
      />
      <Glint t={t} x={-2} y={OBS_Y - 3.6} size={6} phase={0.4} speed={0.9} />
    </Group>
  );
}

const MoltenLava: ArtBorderDrawing = { back: LavaBack, front: LavaFront };

// ══ Shadow Flame ═════════════════════════════════════════════════════

const SHADOW_AURA = aura("#14001F", "#5A16A8", "#E8C2FF", 1.1, 1);
const SHADOW_RIM = rim("#1A0030", "#7A2BE0", "#F2DCFF", 1.4, 11);

const BLACK_SILVER = ["#CEC6DE", "#6A6278", "#221C2E", "#8A8298"];
const INK_BLACK = "#08060E";
const S_IN = 58.4;
const S_OUT = 68;
const S_MID = 63.2;
const SHADOW_RING = ring(S_OUT, S_IN);
/** The channel the runes are inlaid in: violet-black enamel. */
const CHANNEL = ring(66.3, 60.1);

/** Runes in a box 3 wide, 4.4 tall, their top toward the outside. */
const RUNE_GLYPHS = [
  "M-0.9 2.2V-2.2M-0.9 -0.9L1.1 -2.2M-0.9 0.5L1.1 -0.8", // fehu
  "M-1.1 2.2V-2.2L1.1 -1V2.2", // uruz
  "M-0.9 -2.2V2.2M-0.9 -1.1L0.9 0L-0.9 1.1", // thurisaz
  "M-1 2.2V-2.2L1 -0.9L-1 0.3L1 2.2", // raido
  "M1 -2.2L-1 0L1 2.2", // kenaz
  "M-1.2 -2.2L1.2 2.2M1.2 -2.2L-1.2 2.2", // gebo
  "M-1 -2.2V2.2M1 -2.2V2.2M-1 -0.8L1 0.8", // hagalaz
  "M0 2.2V-2.2M-1.2 -2.2L0 -0.6L1.2 -2.2", // algiz
  "M1 -2.2L-1 -0.7L1 0.7L-1 2.2", // sowilo
  "M0 2.2V-2.2M-1.2 -0.9L0 -2.2L1.2 -0.9", // tiwaz
  "M0 -2.2V2.2M-1.1 -0.7L1.1 0.7", // nauthiz
];
/** A glyph placed on the ring at angle `a`, its top outward. */
function placeRune(d: string, a: number) {
  const c = polar(a, S_MID);
  const u = { x: Math.cos(a), y: Math.sin(a) };
  const tx = { x: -u.y, y: u.x };
  return d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_m, x, y) => {
    const X = +x * 1.15;
    const Y = +y * 1.15;
    return `${f(c.x + tx.x * X - u.x * Y)} ${f(c.y + tx.y * X - u.y * Y)}`;
  });
}
/** Glyphs written as absolute points only (V/H expanded first). */
function points(d: string) {
  let x = 0;
  let y = 0;
  return d.replace(/([MLHV])(-?\d*\.?\d+)(?: (-?\d*\.?\d+))?/g, (_m, op, a, b) => {
    if (op === "H") x = +a;
    else if (op === "V") y = +a;
    else {
      x = +a;
      y = +b;
    }
    return `${op === "M" ? "M" : "L"}${x} ${y}`;
  });
}
const RUNES = RUNE_GLYPHS.map((g, k) =>
  placeRune(points(g), (-90 + (k + 1) * 30) * DEG),
);
const RUNE_DOTS = Array.from({ length: 12 }, (_, k) => {
  const a = (-90 + 15 + k * 30) * DEG;
  const c = polar(a, S_MID);
  return kite(c.x, c.y, 0.9, 0.9, 0.9);
}).join("");

/** Silver flame-tongues rising off the ring's outer edge, leaning the
 *  way the fire turns. */
const TONGUE =
  "M-2.8 0C-3.4 -3 -1.2 -4.6 -0.8 -7.4C-0.6 -9 0.6 -10 1.8 -11.2C1.2 -9.4 1.6 -8.2 2.4 -6.6C3.2 -4.8 3.4 -2.4 2.8 0Z";
const TONGUE_VEIN = "M0 -0.6C0 -3 -0.2 -5.4 0.6 -8.6";
const placeTongue = (d: string, a: number, s: number) => {
  const c = polar(a, 67.2);
  const u = { x: Math.cos(a), y: Math.sin(a) };
  return d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_m, x, y) => {
    const X = +x * s * 1.25;
    const Y = +y * s;
    return `${f(c.x - u.y * X - u.x * Y)} ${f(c.y + u.x * X - u.y * Y)}`;
  });
};
const TONGUE_AT = Array.from({ length: 24 }, (_, k) => ({
  a: (-82.5 + k * 15) * DEG,
  // big and small in turn, mirrored about the amethyst
  s: (k % 2 === 0) === k < 12 ? 0.95 : 0.62,
}));
const TONGUES = TONGUE_AT.map(({ a, s }) => placeTongue(TONGUE, a, s)).join("");
const TONGUE_VEINS = TONGUE_AT.map(({ a, s }) =>
  placeTongue(TONGUE_VEIN, a, s),
).join("");

/** The amethyst at the crown, in a pointed setting. */
const AM_Y = -64;
const vesica = (cx: number, cy: number, w: number, h: number) =>
  `M${f(cx)} ${f(cy - h)}Q${f(cx + w * 1.35)} ${f(cy)} ${f(cx)} ${f(cy + h)}Q${f(cx - w * 1.35)} ${f(cy)} ${f(cx)} ${f(cy - h)}Z`;
const AM_SET = vesica(0, AM_Y, 7.6, 12);
const AM_GEM = vesica(0, AM_Y, 5.2, 8.6);

const shadowRingPicture = once((c) => {
  // the flame-tongues: violet enamel in a blackened silver wire
  const tongues = path(TONGUES);
  if (tongues) {
    c.drawPath(
      tongues,
      brush(
        radial(0, 0, 79, ["#3A0A6A", "#8A3AE8", "#F2DCFF"], [0.84, 0.91, 1]),
      ),
    );
    c.save();
    c.clipPath(tongues, ClipOp.Intersect, true);
    const veins = path(TONGUE_VEINS);
    if (veins) c.drawPath(veins, pen(0.6, "#F6E8FF", 0.7));
    c.restore();
    c.drawPath(tongues, pen(1.4, INK_BLACK));
    c.drawPath(tongues, pen(0.7, linear(-60, -70, 60, 70, BLACK_SILVER)));
  }
  engrave(c, {
    d: SHADOW_RING,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, BLACK_SILVER),
    ink: INK_BLACK,
    width: 1,
    shine: arc(S_OUT - 0.7, -168, -112),
    shineWidth: 0.7,
    shineAlpha: 0.75,
  });
  engrave(c, {
    d: CHANNEL,
    evenOdd: true,
    fill: radial(0, 0, 66.3, ["#3A1660", "#1A0A2C", "#2C1048"], [0.9, 0.95, 1]),
    ink: INK_BLACK,
    width: 0.8,
  });
  // the runes inlaid in silver, on a dark bed
  const runes = path(RUNES.join(""));
  if (runes) {
    c.drawPath(runes, pen(1.9, "#06040A", 0.9));
    c.drawPath(runes, pen(0.95, linear(-60, -60, 60, 60, BLACK_SILVER)));
  }
  const dots = path(RUNE_DOTS);
  if (dots) {
    c.drawPath(dots, brush("#D8D0E8"));
    c.drawPath(dots, pen(0.4, INK_BLACK));
  }
  engrave(c, {
    d: AM_SET,
    fill: linear(-7, AM_Y - 12, 7, AM_Y + 12, BLACK_SILVER),
    ink: INK_BLACK,
    width: 1,
    vein: vesica(0, AM_Y, 6.4, 10.4),
    veinColor: "#1A1424",
    veinWidth: 0.45,
    shine: `M-5.6 ${AM_Y + 1}Q-5.2 ${AM_Y - 6} -0.7 ${AM_Y - 10.8}`,
    shineWidth: 0.6,
  });
  engrave(c, {
    d: AM_GEM,
    fill: radial(-1.8, AM_Y - 3.4, 10.5, ["#F6E2FF", "#A848F0", "#5A12A0", "#2A0650"]),
    ink: "#1A0430",
    width: 0.7,
    vein: `M0 ${AM_Y - 8.6}V${AM_Y + 8.6}M-3.6 ${AM_Y}H3.6${vesica(0, AM_Y, 2.4, 4.2)}`,
    veinColor: "#4A107A",
    veinWidth: 0.4,
    veinAlpha: 0.6,
    shine: `M-3 ${AM_Y - 0.6}Q-2.8 ${AM_Y - 4.2} -0.7 ${AM_Y - 6.6}`,
    shineWidth: 0.7,
    shineAlpha: 0.9,
  });
});

function Rune({ t, k }: { t: Clock; k: number }) {
  const n = RUNES.length;
  const opacity = useDerivedValue(() => {
    const x = (((t.value * 1.5 - k) % n) + n) % n;
    const bump = x < 2.4 ? Math.sin((x / 2.4) * Math.PI) : 0;
    return 0.3 + 0.7 * bump;
  });
  return (
    <Group opacity={opacity} blendMode="screen">
      <Path
        path={RUNES[k]}
        style="stroke"
        strokeWidth={3.2}
        strokeCap="round"
        strokeJoin="round"
        color="#B46CFF"
      >
        <BlurMask blur={2} style="normal" />
      </Path>
      <Path
        path={RUNES[k]}
        style="stroke"
        strokeWidth={1}
        strokeCap="round"
        strokeJoin="round"
        color="#FAF0FF"
      />
    </Group>
  );
}

/** A wisp of shadow curling off the ring. */
const WISP = curl(0, 0, -Math.PI / 2, 20, 3.4, 4.6, 0.85);
const WISP_ANGLES = [-162, -128, -104, -76, -52, -18, 12, 168];

function Wisp({ t, i }: { t: Clock; i: number }) {
  const a = WISP_ANGLES[i] * DEG;
  const life = 2.6 + rnd(i + 90) * 1.4;
  const off = rnd(i + 94) * life;
  const flip = i % 2 ? -1 : 1;
  const transform = useDerivedValue(() => {
    const p = ((t.value + off) % life) / life;
    const r = 64 + p * 8;
    return [
      { translateX: Math.cos(a) * r },
      { translateY: Math.sin(a) * r },
      { rotate: a + Math.PI / 2 + Math.sin(p * 3 + i) * 0.15 },
      { scaleX: flip * (0.7 + 0.4 * p) },
      { scaleY: 0.7 + 0.4 * p },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + off) % life) / life;
    return Math.sin(p * Math.PI) * 0.95;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={WISP.outline}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, -16)}
          colors={["#E8D0FF", "#9A4AF0", "#3A107000"]}
        />
        <BlurMask blur={1.6} style="normal" />
      </Path>
      <Path
        path={WISP.vein}
        style="stroke"
        strokeWidth={0.6}
        color="#F0DCFF"
        opacity={0.45}
      >
        <BlurMask blur={0.5} style="normal" />
      </Path>
    </Group>
  );
}

function ShadowBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Halo r={94} color="#7A2BE0" opacity={0.45} />
      <Fx sksl={AURA_FLAME} t={t} values={SHADOW_AURA} />
      {WISP_ANGLES.map((_, i) => (
        <Wisp key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

function ShadowFront({ t }: { t: Clock }) {
  // the amethyst beats: lub-dub
  const beat = useDerivedValue(() => {
    const p = (t.value % 2.2) / 2.2;
    const lub = Math.max(0, 1 - Math.abs(p - 0.05) / 0.07);
    const dub = Math.max(0, 1 - Math.abs(p - 0.2) / 0.08) * 0.7;
    return 0.25 + 0.75 * Math.max(lub, dub);
  });
  return (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={SHADOW_RIM} extent={70} />
      <Still picture={shadowRingPicture} />
      <Sweep t={t} d={SHADOW_RING + TONGUES} every={5.6} phase={2} />
      {RUNES.map((_, k) => (
        <Rune key={k} t={t} k={k} />
      ))}
      <Group blendMode="screen" opacity={beat}>
        <Oval x={-10} y={AM_Y - 14} width={20} height={28}>
          <RadialGradient
            c={vec(0, AM_Y)}
            r={14}
            colors={["#E8B8FFCC", "#9A4AF066", "#7A2BE000"]}
          />
        </Oval>
      </Group>
      <Sparks
        t={t}
        count={7}
        from={-Math.PI}
        to={0}
        r={62}
        rise={26}
        color="#B98CFF"
        size={1.8}
        seed={41}
      />
      <Glint t={t} x={-1.6} y={AM_Y - 3.4} size={6} phase={0.5} speed={0.9} />
    </Group>
  );
}

const ShadowFlame: ArtBorderDrawing = { back: ShadowBack, front: ShadowFront };

// ══ Blood Moon ═══════════════════════════════════════════════════════

const BLOOD_AURA = aura("#120003", "#5A0610", "#E8283A", 0.7, 1);
const BLOOD_RIM = rim("#2A0006", "#B0101E", "#FF7A6A", 0.7, 10);

const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_SILVER = "#1E242C";
const IRON = ["#C2B8C0", "#5E565E", "#221C22", "#827A82"];
const INK_IRON = "#0A0608";
const VEIN_IRON = "#262026";

const M_Y = -73;
const M_R = 13.2;
const BEZEL_R = 16.2;
const MOON_BEZEL = ring(BEZEL_R, M_R, 0, M_Y);
const BEADS = Array.from({ length: 22 }, (_, k) => {
  const p = polar((k / 22) * TAU, 14.7);
  return disc(0.55, p.x, M_Y + p.y);
}).join("");
const CRATERS: [number, number, number][] = [
  [4.2, -4, 2.6],
  [-3.2, 5, 1.9],
  [6.2, 5.2, 1.5],
  [-5.6, -6.4, 1.3],
  [1, 0.6, 1.1],
  [-7.4, 1.4, 1],
];

/** The iron ring: grooves at its edges, an arcade of pointed arches. */
const B_RING_IN = 58.6;
const B_RING_OUT = 64.2;
const IRON_RING = ring(B_RING_OUT, B_RING_IN);
const ARCADE = Array.from({ length: 36 }, (_, k) => {
  const a0 = k * 10 * DEG;
  const a1 = (k + 1) * 10 * DEG;
  const m = (a0 + a1) / 2;
  return `M${at(a0, 59.8)}Q${at(a0 + 0.5 * DEG, 62.2)} ${at(m, 62.9)}Q${at(a1 - 0.5 * DEG, 62.2)} ${at(a1, 59.8)}`;
}).join("");
/** A pierced roundel under each arch. */
const TRACERY = Array.from({ length: 36 }, (_, k) => {
  const p = polar((k * 10 + 5) * DEG, 60.9);
  return disc(0.5, p.x, p.y);
}).join("");

/** The ruby below, point down, and where its drop forms. */
const RUBY_Y = 61.4;
const RUBY_SET = kite(0, RUBY_Y, 5.6, 6, 8.6);
const DRIP_FROM = RUBY_Y + 8.2;

const bloodRingPicture = once((c) => {
  engrave(c, {
    d: IRON_RING,
    evenOdd: true,
    fill: linear(-60, -70, 60, 70, IRON),
    ink: INK_IRON,
    width: 1,
    vein: disc(B_RING_IN + 1) + disc(B_RING_OUT - 1),
    veinColor: VEIN_IRON,
    veinWidth: 0.5,
    veinAlpha: 0.9,
    shine: arc(B_RING_OUT - 0.5, -168, -110),
    shineWidth: 0.6,
    shineAlpha: 0.6,
  });
  // the arcade cut in, silver in the cuts
  const arcade = path(ARCADE);
  if (arcade) {
    c.drawPath(arcade, pen(1.2, INK_IRON, 0.85));
    c.drawPath(arcade, pen(0.5, "#E4DCE4", 0.85));
  }
  const tracery = path(TRACERY);
  if (tracery) c.drawPath(tracery, brush("#E4DCE4", 0.85));
  // the ruby's setting and the ruby
  engrave(c, {
    d: RUBY_SET,
    fill: linear(-6, RUBY_Y - 6, 6, RUBY_Y + 9, IRON),
    ink: INK_IRON,
    width: 0.9,
    vein: kite(0, RUBY_Y, 4.6, 5, 7.4),
    veinColor: VEIN_IRON,
    veinWidth: 0.4,
  });
  jewel(
    c,
    0,
    RUBY_Y,
    3.8,
    4.2,
    6.2,
    ["#FF9AA6", "#D0102E", "#5A0410"],
    "#2A0206",
    "#7A0A18",
  );
  // the moon's bezel, beaded
  engrave(c, {
    d: MOON_BEZEL,
    evenOdd: true,
    fill: linear(-16, M_Y - 16, 16, M_Y + 16, SILVER),
    ink: INK_SILVER,
    width: 0.9,
    vein: BEADS,
    veinColor: "#5A6472",
    veinWidth: 0.5,
    shine: `M${at(-160 * DEG, 15.6, 0, M_Y)}A15.6 15.6 0 0 1 ${at(-105 * DEG, 15.6, 0, M_Y)}`,
    shineWidth: 0.6,
  });
  const beads = path(BEADS);
  if (beads) c.drawPath(beads, brush("#E8EDF4", 0.9));
  // the moon: crimson, cratered
  const moon = path(disc(M_R, 0, M_Y));
  if (!moon) return;
  c.drawPath(
    moon,
    brush(
      radial(-3.6, M_Y - 4, 18, ["#FF9A7A", "#D82A30", "#8A0A18", "#3A0208"], [
        0, 0.35, 0.75, 1,
      ]),
    ),
  );
  c.save();
  c.clipPath(moon, ClipOp.Intersect, true);
  for (const [x, y, r] of CRATERS) {
    c.drawCircle(x, M_Y + y, r, brush("#6A0612", 0.45));
    c.drawCircle(x + r * 0.25, M_Y + y + r * 0.25, r, pen(0.4, "#FF8A7A", 0.4));
    c.drawCircle(x, M_Y + y, r, pen(0.45, "#4A0410", 0.7));
  }
  // the last silver of the moon's edge, not yet in shadow
  const lit = path(disc(M_R, 0, M_Y) + disc(12.6, 2.6, M_Y + 1.6), true);
  if (lit) {
    c.drawPath(
      lit,
      brush(linear(-14, M_Y - 12, 4, M_Y + 6, ["#FFFFFF", "#D8DEE8", "#8A94A4"])),
    );
    const edge = path(disc(12.6, 2.6, M_Y + 1.6));
    if (edge) c.drawPath(edge, pen(0.5, INK_SILVER, 0.8));
  }
  c.restore();
  c.drawPath(moon, pen(0.8, "#2A0206"));
});

/** The bat wing, the right one: a crimson membrane on iron bones,
 *  scalloped between the finger tips. */
const WRIST: [number, number] = [19, -78];
const W_TOP: [number, number] = [12.5, -82];
const W_BOT: [number, number] = [12.5, -66];
const W_TIPS: [number, number][] = [
  [54, -69],
  [polar(-48 * DEG, 70).x, polar(-48 * DEG, 70).y],
  [polar(-60 * DEG, 68.5).x, polar(-60 * DEG, 68.5).y],
  [polar(-71 * DEG, 67).x, polar(-71 * DEG, 67).y],
];
const pt = ([x, y]: [number, number]) => `${f(x)} ${f(y)}`;
/** A scallop between two tips: bowed in toward the wrist. */
const scallop = (a: [number, number], b: [number, number]) => {
  const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c: [number, number] = [
    m[0] + (WRIST[0] - m[0]) * 0.4,
    m[1] + (WRIST[1] - m[1]) * 0.4,
  ];
  return `Q${pt(c)} ${pt(b)}`;
};
const WING =
  `M${pt(W_TOP)}C18 -86 25 -86.6 31 -84.6C40 -82.4 49 -76 ${pt(W_TIPS[0])}` +
  scallop(W_TIPS[0], W_TIPS[1]) +
  scallop(W_TIPS[1], W_TIPS[2]) +
  scallop(W_TIPS[2], W_TIPS[3]) +
  scallop(W_TIPS[3], W_BOT) +
  "Z";
/** The bones: the arm along the leading edge, fingers to the tips. */
const ARM = `M${pt(W_TOP)}L${pt(WRIST)}Q32 -80 ${pt(W_TIPS[0])}`;
const FINGERS = W_TIPS.slice(1)
  .map((tip) => {
    const c: [number, number] = [
      (WRIST[0] + tip[0]) / 2 + 1.5,
      (WRIST[1] + tip[1]) / 2 - 1.5,
    ];
    return `M${pt(WRIST)}Q${pt(c)} ${pt(tip)}`;
  })
  .join("");
/** Creases in the membrane, between the bones. */
const CREASES = [
  [W_TIPS[0], W_TIPS[1]],
  [W_TIPS[1], W_TIPS[2]],
  [W_TIPS[2], W_TIPS[3]],
]
  .map(([a, b]) => {
    const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const e: [number, number] = [
      m[0] + (WRIST[0] - m[0]) * 0.5,
      m[1] + (WRIST[1] - m[1]) * 0.5,
    ];
    return `M${pt(WRIST)}L${pt(e)}`;
  })
  .join("");

function drawWing(c: SkCanvas) {
  engrave(c, {
    d: WING,
    fill: linear(WRIST[0], WRIST[1], 50, -58, ["#A82434", "#5A0A16", "#2A0408"]),
    ink: INK_IRON,
    width: 0,
    vein: CREASES,
    veinColor: "#1E0204",
    veinWidth: 0.5,
    veinAlpha: 0.5,
  });
  const bones = path(ARM + FINGERS);
  if (bones) {
    c.drawPath(bones, pen(2.6, INK_IRON));
    c.drawPath(bones, pen(1.3, linear(10, -86, 50, -56, IRON)));
  }
  const outline = path(WING);
  if (outline) c.drawPath(outline, pen(0.9, INK_IRON));
  const shine = path("M14 -80.6C19 -83.6 25 -84.4 30 -83.2");
  if (shine) c.drawPath(shine, pen(0.6, "#FFFFFF", 0.55));
  c.drawCircle(WRIST[0], WRIST[1], 1.6, brush(radial(18.4, -78.6, 2.4, SILVER)));
  c.drawCircle(WRIST[0], WRIST[1], 1.6, pen(0.5, INK_SILVER));
}

const wingPicture = once(drawWing);
// a plain point (vec() would call into Skia as the file loads)
const WING_ROOT = { x: 13, y: -74 };

/** The two wings, mirrored, beating slowly from their roots. */
function BatWings({ t }: { t: Clock }) {
  const beat = useDerivedValue(() => [
    { rotate: 0.035 * Math.sin(t.value * 1.3) - 0.005 },
  ]);
  const wing = (
    <Group transform={beat} origin={WING_ROOT}>
      <Still picture={wingPicture} />
    </Group>
  );
  return (
    <Group>
      {wing}
      <Group transform={[{ scaleX: -1 }]}>{wing}</Group>
    </Group>
  );
}

/** A drop of blood: forms, swells, falls. */
const BLOOD_DROP =
  "M0 0C1.35 3 3.2 4.9 3.2 7A3.2 3.2 0 0 1 -3.2 7C-3.2 4.9 -1.35 3 0 0Z";
const BLOOD_DRIPS = [
  { x: 0, y: DRIP_FROM, every: 3.4, i: 0 },
  { ...polar(62 * DEG, 64.6), every: 4.2, i: 1 },
  { ...polar(118 * DEG, 64.6), every: 3.8, i: 2 },
].map((d) => ({
  ...d,
  room: Math.sqrt(89.5 * 89.5 - d.x * d.x) - d.y - 11,
}));

function BloodDrop({
  t,
  x,
  y,
  every,
  room,
  i,
}: {
  t: Clock;
  x: number;
  y: number;
  every: number;
  room: number;
  i: number;
}) {
  const off = rnd(i + 60) * every;
  const transform = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    if (p < 0.55) {
      const s = 0.2 + 0.8 * (p / 0.55);
      return [{ translateX: x }, { translateY: y }, { scale: s }];
    }
    const q = (p - 0.55) / 0.45;
    return [
      { translateX: x },
      { translateY: y + q * q * room },
      { scaleX: 0.9 },
      { scaleY: 1.1 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    return p < 0.85 ? 1 : (1 - p) / 0.15;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={BLOOD_DROP}>
        <RadialGradient
          c={vec(-1.1, 5.6)}
          r={6}
          colors={["#FF8A8A", "#C2101E", "#4A0208"]}
        />
      </Path>
      <Path
        path={BLOOD_DROP}
        style="stroke"
        strokeWidth={0.5}
        color="#2A0206"
      />
      <Circle cx={-1.2} cy={5.9} r={0.8} color="#FFFFFF" opacity={0.85} />
    </Group>
  );
}

/** A glint with a red bloom under it. */
function RedGlint({
  t,
  x,
  y,
  size,
  phase,
  speed = 1,
}: {
  t: Clock;
  x: number;
  y: number;
  size: number;
  phase: number;
  speed?: number;
}) {
  const bloom = useDerivedValue(
    () => Math.max(0, Math.sin(t.value * speed + phase)) ** 3 * 0.9,
  );
  return (
    <Group>
      <Group opacity={bloom} blendMode="screen">
        <Circle cx={x} cy={y} r={size * 1.3} color="#FF2A3A">
          <BlurMask blur={size * 0.8} style="normal" />
        </Circle>
      </Group>
      <Glint t={t} x={x} y={y} size={size} phase={phase} speed={speed} />
    </Group>
  );
}

function BloodBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.45 + 0.25 * Math.sin(t.value * 1.1));
  return (
    <Group>
      <Halo r={94} color="#C2101E" opacity={0.45} />
      <Fx sksl={AURA_CLOUD} t={t} values={BLOOD_AURA} />
      <Group opacity={glow} blendMode="screen">
        <Circle cx={0} cy={M_Y} r={26}>
          <RadialGradient
            c={vec(0, M_Y)}
            r={26}
            colors={["#FF4A3AEE", "#C2101E66", "#C2101E00"]}
            positions={[0.45, 0.7, 1]}
          />
        </Circle>
      </Group>
      <BatWings t={t} />
    </Group>
  );
}

function BloodFront({ t }: { t: Clock }) {
  const moonGlow = useDerivedValue(() => 0.2 + 0.2 * Math.sin(t.value * 1.1));
  return (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={BLOOD_RIM} extent={70} />
      <Still picture={bloodRingPicture} />
      <Sweep t={t} d={IRON_RING + MOON_BEZEL} evenOdd every={5.4} phase={0.4} />
      <Group opacity={moonGlow} blendMode="screen">
        <Circle cx={0} cy={M_Y} r={M_R}>
          <RadialGradient
            c={vec(1.5, M_Y + 1.5)}
            r={M_R}
            colors={["#FF6A4A", "#FF2A2A00"]}
          />
        </Circle>
      </Group>
      {BLOOD_DRIPS.map((d) => (
        <BloodDrop
          key={d.i}
          t={t}
          x={d.x}
          y={d.y}
          every={d.every}
          room={d.room}
          i={d.i}
        />
      ))}
      <RedGlint t={t} x={-1.2} y={RUBY_Y - 1} size={4.5} phase={1.6} />
      <RedGlint t={t} x={-9} y={M_Y - 6} size={4} phase={3.8} speed={0.8} />
    </Group>
  );
}

const BloodMoon: ArtBorderDrawing = { back: BloodBack, front: BloodFront };

export const ABYSS_ART: Record<string, ArtBorderDrawing> = {
  "black-hole": BlackHole,
  "molten-lava": MoltenLava,
  "shadow-flame": ShadowFlame,
  "blood-moon": BloodMoon,
};

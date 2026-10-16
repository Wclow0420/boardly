// Seal the Manor's kitchen: a warm, busy manor kitchen. A great hearth in
// the far-right corner (a pale stone chimney breast with an arched
// opening, a log fire on its dogs, a copper hood and flue above an oak
// mantel of copper pots and candles), the cauldron hanging from its iron
// crane over raked-out embers (the prop), copper pans on a rail over a
// stone sink with its pump, a Welsh dresser of blue-and-white plates,
// the servants' bells over the hall door, a scrubbed table laid with a
// loaf, eggs, flour and greens, a shelf of crocks hung with onions, and
// a crate of vegetables, a flour sack, a clock, a stool and a rag rug.
// Built with the iso kit (components/iso); see roomScenes.ts.

import {
  GRAINED,
  INK,
  LEAF,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  flame,
  hoop,
  lightPool,
  line,
  path,
  poly,
  steam,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { disc, prop, shell, tint } from "@/components/iso/room";
import { BRASS, IRONWORK, cabinet, jar, shelfX } from "@/components/iso/furniture";
import { MAHOGANY, filled, leafAt, ringOn, roundel, shadowOf, turned } from "./hall";
import { PEWTER, PINE, crate, flagstones, sack } from "./cellar";
import { LIMESTONE } from "./chapel";
import { rod } from "./belltower";

// ── materials ───────────────────────────────────────────────────────

/** Copper, for pans, pots and the hood: light, body, shadow, the light
 *  thrown back at the far edge. */
const COPPER = ["#FFD3B0", "#D07A48", "#7E3A1A", "#E8986A"];
const COPPER_T: Tones = [COPPER[0], COPPER[1], COPPER[2]];
/** Golden oak, for the dresser, the mantel and the shelves. */
const OAK: Tones = ["#C29462", "#9A6E44", "#6E4C2E"];
GRAINED.add(OAK);
/** A table top scrubbed pale. */
const SCRUBBED: Tones = ["#EEDFBE", "#D2BC92", "#A99068"];
GRAINED.add(SCRUBBED);
/** Iron as a turned piece's sheen. */
const IRON = [tone(IRONWORK[0], 0.25), IRONWORK[1], IRONWORK[2], IRONWORK[0]];
const BRASS4 = [BRASS[0], BRASS[1], BRASS[2], BRASS[0]];
/** Cream stoneware with a blue band; brown-glazed crocks. */
const CREAM = ["#FFF8E8", "#EADBB8", "#B49C70", "#F4E8CC"];
const GLAZE = ["#D8985A", "#94562A", "#542C12", "#B07040"];
const CHINA = ["#FFFFFF", "#EEF2F8", "#A8B4CA"];
const DELFT = "#2E4E9A";
const STEW = "#6F8452";

// ── helpers ─────────────────────────────────────────────────────────

/** Several open polylines as one stroke (cheap engraving). */
const strokes = (lines: V3[][], stroke: string, strokeWidth: number, opacity?: number): Shape => ({
  d: lines.map((pts) => path(pts.map((p) => P(...p)), false)).join(" "),
  stroke,
  strokeWidth,
  opacity,
});

/** A face filled with its own colour, lightest at `from`. */
function lit(pts: V3[], fill: string, from: V3, to: V3, light = 0.16, dark = 0.24): Shape {
  return { ...poly(pts, fill), grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) } };
}

/** The convex hull of points in the drawing. */
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** A dome (a loaf, a cabbage, a heap) on z: the upper half of an
 *  ellipsoid with semi-axes a (x), b (y), c (z), lit from the upper left. */
function dome(at: V3, a: number, b: number, c: number, tones: string[]): Shape {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    for (const v of [0, 0.4, 0.8, 1.2, Math.PI / 2]) {
      pts.push(P(at[0] + Math.cos(t) * Math.cos(v) * a, at[1] + Math.sin(t) * Math.cos(v) * b, at[2] + Math.sin(v) * c));
    }
  }
  const outline = hull(pts);
  const [cx, cy] = P(at[0], at[1], at[2] + c * 0.6);
  const s = Math.max(a, b) * unit();
  return {
    d: path(outline),
    fill: tones[1],
    grad: { colors: tones, from: [cx - s * 0.45, cy - s * 0.35], radius: s * 1.5 },
    stroke: tone(tones[1], -0.6),
    strokeWidth: 0.5,
  };
}

/** A blue-and-white plate standing on edge against the right-hand wall
 *  plane at depth y. */
function plate(u: number, y: number, z: number, r: number): Shape[] {
  const c: V3 = [u, y, z];
  return [
    roundel("y", c, r, CHINA, "#4A5878"),
    { ...line(ringOn("y", [u, y + 0.0005, z], r * 0.78), DELFT, 0.8), dash: "0.8 0.9" },
    roundel("y", [u, y + 0.001, z], r * 0.4, ["#6A8AD0", DELFT, "#1A2E66"], "#1A2E66"),
  ];
}

/** A jug standing at (x, y, z): a turned body with a lip and a handle. */
function jug(x: number, y: number, z: number, h: number, colors: string[], band?: string): Shape[] {
  const r = h * 0.42;
  return [
    line([[x + r * 0.7, y - r * 0.7, z + h * 0.82], [x + r * 1.5, y - r * 1.5, z + h * 0.7], [x + r * 1.2, y - r * 1.2, z + h * 0.3]], tone(colors[2], -0.3), 1.4),
    ...turned(
      [x, y, z],
      [
        [r * 0.7, 0],
        [r, h * 0.3],
        [r * 0.95, h * 0.55],
        [r * 0.62, h * 0.82],
        [r * 0.74, h],
      ],
      colors,
      tone(colors[2], -0.5),
    ),
    ...(band ? [hoop(x, y, z + h * 0.4, r * 0.99, band)] : []),
  ];
}

/** A brass candlestick standing at (x, y, z): a turned foot, stem and
 *  drip pan, a wax candle and its flame. */
function candle(x: number, y: number, z: number, accent: string, stem = 0.04, wax = 0.05): Shape[] {
  return [
    ...turned(
      [x, y, z],
      [
        [0.02, 0],
        [0.019, 0.005],
        [0.008, 0.012],
        [0.005, 0.016],
        [0.006, stem * 0.5],
        [0.004, stem - 0.006],
        [0.014, stem - 0.002],
        [0.013, stem + 0.003],
      ],
      BRASS4,
    ),
    ...cylinder(x, y, z + stem + 0.003, 0.008, wax, ["#FFFFFF", "#F4EEDF", "#D8CCB0"]),
    ...flame([x, y, z + stem + 0.003 + wax], 2, accent),
  ];
}

// ── the hearth ──────────────────────────────────────────────────────

const HX1 = 0.68;
const HX2 = 0.99;
const HD = 0.24;
const MANTEL = 0.44;
const OM = (HX1 + HX2) / 2;
const R = 0.11;
const SPRING = 0.22;
const OX1 = OM - R;
const OX2 = OM + R;
const VOUSSOIR = 0.035;
const STONE_T = LIMESTONE;

/** A log lying from a to b along x at height z, its cut end lit. */
function log(x1: number, x2: number, y: number, z: number, r: number): Shape[] {
  const bark = "#6A4426";
  return [
    line([[x1, y, z], [x2, y, z]], tone(bark, -0.5), r * unit() * 2 + 0.7),
    line([[x1, y, z], [x2, y, z]], bark, r * unit() * 2),
    { ...line([[x1 + 0.01, y, z + r * 0.55], [x2 - 0.01, y, z + r * 0.55]], tone(bark, 0.35), 0.6), opacity: 0.8 },
    roundel("x", [x2, y, z], r, ["#F2D6A4", "#D8B07A", "#9A7046"], "#5A3A1E"),
  ];
}

/** An andiron on the hearth floor: a bar running back, an upright at
 *  the front with a brass ball on top. */
function firedog(x: number, y1: number, y2: number): Shape[] {
  return [
    ...rod([[x, y1, 0.04], [x, y2, 0.04]], IRONWORK[1], 1.1),
    ...rod([[x, y2, 0.026], [x, y2, 0.1]], IRONWORK[1], 1.3),
    ball([x, y2, 0.11], 0.6, BRASS[1], BRASS[2]),
  ];
}

/** The inside of the fireplace: a sooty back with an iron fireback,
 *  the lit inner jamb, ash on the floor, the fire on its dogs. */
function firebox(accent: string): Shape[] {
  const top = SPRING + R;
  const back = (u: number, z: number): V3 => [u, 0.003, z];
  const fb: V3[] = [back(0.77, 0.026), back(0.9, 0.026), back(0.9, 0.17)];
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * Math.PI;
    fb.push(back(0.835 + Math.cos(t) * 0.065, 0.17 + Math.sin(t) * 0.05));
  }
  return [
    filled([back(OX1, 0.025), back(OX2, 0.025), back(OX2, top), back(OX1, top)], ["#5A3A26", "#2A1C14", "#140C08"], back(OM, 0.03), back(OM, top)),
    filled(fb, ["#5A5048", "#2E2A28", "#181614"], back(0.77, 0.2), back(0.9, 0.03), "#0E0C0A"),
    strokes([fb.slice(3).map(([x, , z]): V3 => [x, 0.004, z - 0.012])], "#6A5A4A", 0.5, 0.7),
    // the left jamb's inner face, lit by the fire
    filled([[OX1, 0, 0.025], [OX1, HD, 0.025], [OX1, HD, top - 0.04], [OX1, 0, top - 0.06]], ["#B07A52", "#6A4632", "#2A1C14"], [OX1, HD * 0.6, 0.03], [OX1, 0, top]),
    // ash on the hearth floor
    filled([[OX1, 0, 0.026], [OX2, 0, 0.026], [OX2, HD, 0.026], [OX1, HD, 0.026]], ["#4A3E38", "#3A302C", "#2A221E"], [OM, 0.1, 0.026], [OX2, HD, 0.026]),
    ...firedog(0.765, 0.04, 0.2),
    ...log(0.745, 0.925, 0.09, 0.048, 0.017),
    ...log(0.75, 0.93, 0.14, 0.046, 0.018),
    ...log(0.76, 0.905, 0.115, 0.078, 0.016),
    ...flame([0.8, 0.12, 0.06], 3.2, accent),
    ...flame([0.865, 0.11, 0.06], 2.6, accent),
    ...flame([0.765, 0.13, 0.055], 2, accent),
    ...firedog(0.905, 0.04, 0.2),
  ];
}

/** The chimney breast's lower part: its side, the front with the arched
 *  opening, voussoirs round the arch with a keystone, the joints of the
 *  dressed stone, soot over the arch. */
function breast(): Shape[] {
  const front = (u: number, z: number): V3 => [u, HD, z];
  const arc: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = (i / 14) * Math.PI;
    arc.push(front(OM + Math.cos(t) * R, SPRING + Math.sin(t) * R));
  }
  const face: V3[] = [front(HX1, 0.025), front(OX1, 0.025), ...arc.slice().reverse(), front(OX2, 0.025), front(HX2, 0.025), front(HX2, MANTEL), front(HX1, MANTEL)];
  const shapes: Shape[] = [
    lit([[HX2, 0, 0.025], [HX2, HD, 0.025], [HX2, HD, MANTEL], [HX2, 0, MANTEL]], tone(STONE_T[2], -0.18), [HX2, 0, MANTEL], [HX2, HD, 0.025], 0.06, 0.3),
    lit(face, STONE_T[1], front(HX1, MANTEL), front(HX2, 0.025), 0.16, 0.22),
  ];
  // joints: courses across the piers and spandrels, a few upright joints
  const course = 0.062;
  const out = R + VOUSSOIR;
  const joints: V3[][] = [];
  const shine: V3[][] = [];
  let row = 0;
  for (let z = 0.025 + course; z < MANTEL - 0.01; z += course, row++) {
    const spans: [number, number][] =
      z < SPRING
        ? [[HX1, OX1], [OX2, HX2]]
        : z < SPRING + out
          ? (() => {
              const hw = Math.sqrt(out * out - (z - SPRING) ** 2);
              return [[HX1, OM - hw], [OM + hw, HX2]] as [number, number][];
            })()
          : [[HX1, HX2]];
    for (const [a, b] of spans) {
      if (b - a < 0.006) continue;
      joints.push([front(a, z), front(b, z)]);
      shine.push([front(a + 0.004, z - 0.005), front(b - 0.006, z - 0.005)]);
    }
    const zTop = Math.min(z + course, MANTEL);
    for (const u of row % 2 ? [HX1 + 0.09, OM + 0.02, HX2 - 0.07] : [HX1 + 0.04, OM - 0.06, OM + 0.09]) {
      const inArch = Math.abs(u - OM) < out && z < SPRING + out + 0.02;
      const inOpening = u > OX1 && u < OX2 && z < SPRING + out;
      if (!inArch && !inOpening && u > HX1 + 0.01 && u < HX2 - 0.01) joints.push([front(u, z), front(u, zTop)]);
    }
  }
  row = 0;
  for (let z = 0.025 + course; z < MANTEL - 0.01; z += course, row++) {
    joints.push([[HX2, 0, z], [HX2, HD, z]]);
    const v = row % 2 ? 0.07 : 0.15;
    joints.push([[HX2, v, z], [HX2, v, Math.min(z + course, MANTEL)]]);
  }
  shapes.push(strokes(joints, tone(STONE_T[2], -0.4), 0.5, 0.75), strokes(shine, "#FFFFFF", 0.45, 0.35));
  // soot rising over the arch
  shapes.push(
    tint([front(OM - 0.07, SPRING + R * 0.7), front(OM + 0.07, SPRING + R * 0.7), front(OM + 0.05, MANTEL - 0.01), front(OM - 0.05, MANTEL - 0.01)], "#1A1410", 0.18),
  );
  // the voussoirs and keystone
  const count = 9;
  const vf = (a: number, r: number): V3 => [OM + Math.cos(a) * r, HD + 0.002, SPRING + Math.sin(a) * r];
  for (let i = 0; i < count; i++) {
    const a1 = (i / count) * Math.PI;
    const a2 = ((i + 1) / count) * Math.PI;
    const key = i === (count - 1) / 2;
    const o = out + (key ? 0.022 : 0);
    const fill = key ? tone(STONE_T[0], -0.02) : tone(STONE_T[1], ((i * 37) % 7) / 40 - 0.06);
    shapes.push(lit([vf(a1 + 0.01, R), vf(a2 - 0.01, R), vf(a2 - 0.01, o), vf(a1 + 0.01, o)], fill, vf(a2, o), vf(a1, R), 0.18, 0.22));
  }
  // imposts where the arch springs
  shapes.push(...box(HX1 - 0.004, HD - 0.01, SPRING - 0.014, OX1 - HX1 + 0.008, 0.016, 0.016, STONE_T));
  shapes.push(...box(OX2 - 0.004, HD - 0.01, SPRING - 0.014, HX2 - OX2 + 0.004, 0.016, 0.016, STONE_T));
  return shapes;
}

/** The oak mantel shelf on two corbels. */
function mantel(): Shape[] {
  const corbel = (x: number): Shape[] => [
    ...box(x, HD, MANTEL - 0.05, 0.026, 0.022, 0.05, OAK),
    lit([[x, HD + 0.022, MANTEL - 0.05], [x + 0.026, HD + 0.022, MANTEL - 0.05], [x + 0.013, HD + 0.008, MANTEL - 0.075]], OAK[2], [x, HD, MANTEL], [x, HD, MANTEL - 0.07]),
  ];
  return [
    ...corbel(HX1 + 0.006),
    ...corbel(HX2 - 0.03),
    ...box(HX1 - 0.016, 0, MANTEL, HX2 - HX1 + 0.022, HD + 0.04, 0.03, OAK),
    line([[HX1 - 0.016, HD + 0.041, MANTEL + 0.008], [HX2 + 0.006, HD + 0.041, MANTEL + 0.008], [HX2 + 0.006, 0, MANTEL + 0.008]], tone(OAK[2], -0.3), 0.5),
  ];
}

/** The copper hood rising from the mantel into a copper flue: riveted
 *  seams, a brass band along its foot. */
function hood(): Shape[] {
  const z1 = MANTEL + 0.03;
  const z2 = 0.64;
  const [fy, ty] = [0.2, 0.075];
  const [fa, fb] = [HX1 + 0.012, HX2 - 0.008];
  const [ta, tb] = [0.75, 0.93];
  const on = (f: number, s: number): V3 => {
    // f: 0 at the foot, 1 at the top; s: 0 left, 1 right, across the front
    const a = fa + (ta - fa) * f;
    const b = fb + (tb - fb) * f;
    return [a + (b - a) * s, fy + (ty - fy) * f, z1 + (z2 - z1) * f];
  };
  const side = (f: number, t: number): V3 => {
    const x = fb + (tb - fb) * f;
    const y = fy + (ty - fy) * f;
    return [x, y * t, z1 + (z2 - z1) * f];
  };
  const fx = 0.78;
  const fw = 0.12;
  const fd = 0.07;
  return [
    // the flue to the ceiling, banded
    ...box(fx, 0, z2 - 0.01, fw, fd, 0.8 - z2 + 0.01, ["#2A1A12", COPPER_T[1], COPPER_T[2]]),
    ...[0.7, 0.76].flatMap((z) => [
      line([[fx, fd + 0.001, z], [fx + fw, fd + 0.001, z], [fx + fw, 0, z]], BRASS[2], 1.4),
      { ...line([[fx, fd + 0.002, z + 0.004], [fx + fw, fd + 0.002, z + 0.004]], BRASS[0], 0.5), opacity: 0.8 },
    ]),
    // the hood's side and front
    lit([side(0, 0), side(0, 1), side(1, 1), side(1, 0)], COPPER_T[2], side(1, 0), side(0, 1), 0.12, 0.3),
    {
      ...poly([on(0, 0), on(0, 1), on(1, 1), on(1, 0)], COPPER[1]),
      grad: { colors: [COPPER[0], COPPER[1], COPPER[2], COPPER[3]], from: P(...on(1, 0)), to: P(...on(0, 1)) },
    },
    // seams and rivets
    strokes([0.33, 0.66].map((s) => [on(0.05, s), on(0.95, s)]), tone(COPPER[2], -0.3), 0.5, 0.8),
    { ...strokes([[on(0.86, 0.04), on(0.86, 0.96)], ...[0.33, 0.66].map((s) => [on(0.12, s + 0.015), on(0.9, s + 0.015)])], BRASS[0], 0.9), dash: "0.2 2.2" },
    { ...line([on(0.92, 0.06), on(0.15, 0.04)], "#FFFFFF", 0.7), opacity: 0.5 },
    // the brass band along the foot
    {
      ...poly([on(0, 0), on(0, 1), on(0.11, 1), on(0.11, 0)], BRASS[1]),
      grad: { colors: [BRASS[0], BRASS[1], BRASS[2]], from: P(...on(0.11, 0)), to: P(...on(0, 0)) },
    },
    lit([side(0, 1), side(0.11, 1), side(0.11, 0), side(0, 0)], BRASS[2], side(0.11, 0), side(0, 1)),
    { ...line([on(0.08, 0.03), on(0.08, 0.97)], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

/** What stands on the mantel: candlesticks at the ends, copper pots, a
 *  pewter jug, two plates on edge, a blue-and-white ginger jar. */
function mantelPieces(accent: string): Shape[] {
  const z = MANTEL + 0.03;
  const y = HD - 0.01;
  return [
    ...plate(0.79, 0.205, z + 0.042, 0.04),
    ...plate(0.885, 0.205, z + 0.036, 0.034),
    ...candle(HX1 + 0.022, y, z, accent, 0.045, 0.05),
    ...turned([0.745, y, z], [[0.024, 0], [0.031, 0.008], [0.031, 0.036], [0.029, 0.04]], COPPER, "#3A1A0C"),
    ...turned([0.745, y, z + 0.04], [[0.03, 0], [0.022, 0.008], [0.007, 0.013], [0.009, 0.022]], COPPER),
    ...jug(0.83, y, z, 0.07, [PEWTER[0], PEWTER[1], PEWTER[2], PEWTER[0]]),
    ...turned([0.9, y, z], [[0.018, 0], [0.025, 0.012], [0.026, 0.03], [0.019, 0.044], [0.014, 0.05], [0.016, 0.054]], CHINA, "#1A2240"),
    hoop(0.9, y, z + 0.026, 0.026, DELFT),
    hoop(0.9, y, z + 0.016, 0.024, DELFT),
    ...turned([0.9, y, z + 0.054], [[0.017, 0], [0.012, 0.008], [0.004, 0.012], [0.005, 0.018]], CHINA),
    ...candle(HX2 - 0.026, y, z, accent, 0.045, 0.05),
  ];
}

/** A bundle of herbs hung upside down to dry from (x, y, z). */
function herbs(at: V3, size: number, tones: Tones = LEAF): Shape[] {
  const [cx, cy] = P(...at);
  const s = size * unit() * 0.01;
  const tie: Pt = [cx, cy + 2.2 * s];
  const shapes: Shape[] = [{ d: `M${cx} ${cy} L${tie[0]} ${tie[1]}`, stroke: "#C9A46A", strokeWidth: 0.6 }];
  for (const a of [Math.PI - 0.45, Math.PI + 0.45, Math.PI - 0.15, Math.PI + 0.18]) {
    shapes.push(...leafAt(tie, a, 6.5 * s, 1.7 * s, tones));
  }
  shapes.push({ d: `M${tie[0] - 1.2 * s} ${tie[1] + 0.4 * s} L${tie[0] + 1.2 * s} ${tie[1] + 0.2 * s}`, stroke: "#A8323C", strokeWidth: 1.1 });
  return shapes;
}

/** The iron crane on the left pier, swung out over the hearth with a
 *  pot hook and chain down to the cauldron's bail. */
function crane(hookZ: number, bailZ: number): Shape[] {
  const px = HX1 + 0.018;
  const py = HD + 0.012;
  const top = 0.385;
  const end: V3 = [0.83, 0.37, top];
  const at = (t: number): V3 => [px + (end[0] - px) * t, py + (end[1] - py) * t, top];
  return [
    ...rod([[px, py, 0.03], [px, py, top + 0.025]], IRONWORK[1], 1.9),
    ball([px, py, top + 0.03], 0.55, IRONWORK[0], IRONWORK[2]),
    ...[0.08, top - 0.02].flatMap((z) => box(px - 0.012, HD, z - 0.008, 0.024, 0.008, 0.016, IRONWORK)),
    ...rod([[px, py, 0.22], at(0.6)], IRONWORK[1], 1.2),
    ...rod([[px, py, top], end], IRONWORK[1], 1.9),
    { ...line([end, [end[0] + 0.012, end[1] + 0.012, top - 0.02], [end[0] - 0.002, end[1] - 0.002, top - 0.03]], IRONWORK[0], 0.9) },
    // the pot hook and chain
    ...rod([[0.8, 0.34, hookZ], [0.8, 0.34, hookZ - 0.03]], IRONWORK[1], 0.8),
    { ...line([[0.8, 0.34, hookZ - 0.03], [0.8, 0.34, bailZ]], IRONWORK[0], 1.1), dash: "1.2 0.7" },
  ];
}

// ── the rest of the room ────────────────────────────────────────────

/** A copper pan hung flat against the left-hand wall by its handle from
 *  a rail at z: the base towards us, its inside in shadow. */
function wallPan(y: number, rail: number, r: number, handle: number): Shape[] {
  const zc = rail - 0.02 - handle - r;
  const top = zc + r;
  return [
    line([[0.006, y, rail], [0.012, y, rail - 0.02]], IRONWORK[0], 0.8),
    line([[0.014, y, top], [0.014, y, rail - 0.02]], tone(COPPER[2], -0.4), 1.8),
    line([[0.014, y, top], [0.014, y, rail - 0.02]], COPPER[3], 0.8),
    roundel("x", [0.016, y, zc], r, [COPPER[0], COPPER[1], COPPER[2]], tone(COPPER[2], -0.5)),
    roundel("x", [0.018, y, zc], r * 0.78, [COPPER[2], COPPER[1], COPPER[3]], tone(COPPER[2], -0.3)),
    { ...line(ringOn("x", [0.02, y, zc], r * 0.9, 8, 1.75, 2.75), "#FFFFFF", 0.7), opacity: 0.65 },
  ];
}

/** A ladle hung on the rail. */
function ladle(y: number, rail: number): Shape[] {
  return [
    ...rod([[0.012, y, rail - 0.01], [0.012, y, rail - 0.15]], PEWTER[1], 0.8),
    roundel("x", [0.016, y, rail - 0.17], 0.022, [PEWTER[0], PEWTER[1], PEWTER[2]], tone(PEWTER[2], -0.5)),
  ];
}

/** Blue-and-white tiles on the left-hand wall behind the sink. */
function tiles(y1: number, y2: number, z1: number, z2: number): Shape[] {
  const at = (u: number, z: number): V3 => [0.002, u, z];
  const s = 0.034;
  const grid: V3[][] = [];
  const motif: V3[][] = [];
  for (let u = y1 + s; u < y2 - 0.002; u += s) grid.push([at(u, z1), at(u, z2)]);
  for (let z = z1 + s; z < z2 - 0.002; z += s) grid.push([at(y1, z), at(y2, z)]);
  for (let u = y1 + s / 2; u < y2; u += s) {
    for (let z = z1 + s / 2; z < z2; z += s) {
      motif.push([at(u - 0.007, z), at(u + 0.007, z)], [at(u, z - 0.007), at(u, z + 0.007)]);
    }
  }
  return [
    filled([at(y1, z1), at(y2, z1), at(y2, z2), at(y1, z2)], ["#FFFFFF", "#E8ECF2", "#B4BED0"], at(y2, z2), at(y1, z1), "#5A6880"),
    strokes(grid, "#8A96AC", 0.45, 0.9),
    strokes(motif, DELFT, 0.8, 0.85),
  ];
}

/** A stone sink against the left-hand wall from y1 to y2 on two piers,
 *  a bucket under it and a cast-iron pump at its back. */
function sink(y1: number, y2: number): Shape[] {
  const w = 0.15;
  const z1 = 0.14;
  const z2 = 0.2;
  const STONE_S: Tones = [tone(STONE_T[0], -0.06), tone(STONE_T[1], -0.08), tone(STONE_T[2], -0.1)];
  const py = y1 + 0.035;
  return [
    shadowOf(0, y1, w, y2 - y1),
    // the dark under the sink, a bucket in it
    poly([[0.003, y1, 0], [0.003, y2, 0], [0.003, y2, z1], [0.003, y1, z1]], "#2A2418"),
    ...box(0.02, y1 + 0.01, 0, 0.1, 0.03, z1, STONE_S),
    ...cylinder(0.075, (y1 + y2) / 2 + 0.01, 0, 0.038, 0.085, WOOD),
    hoop(0.075, (y1 + y2) / 2 + 0.01, 0.02, 0.038, IRONWORK[2]),
    hoop(0.075, (y1 + y2) / 2 + 0.01, 0.065, 0.038, IRONWORK[2]),
    disc(0.075, (y1 + y2) / 2 + 0.01, 0.0855, 0.03, "#3A5470"),
    ...box(0.02, y2 - 0.035, 0, 0.1, 0.03, z1, STONE_S),
    // the trough: its slab, the basin sunk in it with water
    ...box(0, y1, z1, w, y2 - y1, z2 - z1, STONE_S),
    lit([[0.02, y1 + 0.02, z2 + 0.001], [w - 0.02, y1 + 0.02, z2 + 0.001], [w - 0.02, y2 - 0.02, z2 + 0.001], [0.02, y2 - 0.02, z2 + 0.001]], tone(STONE_T[2], -0.25), [w, y2, z2], [0, y1, z2], 0.1, 0.3),
    filled([[0.03, y1 + 0.03, z2 + 0.002], [w - 0.025, y1 + 0.03, z2 + 0.002], [w - 0.025, y2 - 0.025, z2 + 0.002], [0.03, y2 - 0.025, z2 + 0.002]], ["#7A9ABA", "#4A6A88", "#2A4258"], [0.03, y1, z2], [w, y2, z2]),
    { ...line([[0.05, y1 + 0.06, z2 + 0.003], [0.09, y1 + 0.1, z2 + 0.003]], "#FFFFFF", 0.6), opacity: 0.6 },
    // the pump: a fluted iron barrel, a spout, a long curved handle
    ...cylinder(0.035, py, z2, 0.022, 0.16, IRONWORK),
    hoop(0.035, py, z2 + 0.04, 0.022, BRASS[1]),
    ...cylinder(0.035, py, z2 + 0.16, 0.026, 0.014, IRONWORK),
    ball([0.035, py, z2 + 0.185], 0.55, BRASS[1], BRASS[2]),
    ...rod([[0.045, py + 0.01, z2 + 0.11], [0.075, py + 0.03, z2 + 0.11], [0.085, py + 0.036, z2 + 0.085]], IRONWORK[1], 1.6),
    ...rod([[0.035, py, z2 + 0.17], [0.035, py + 0.06, z2 + 0.22], [0.035, py + 0.12, z2 + 0.21]], IRONWORK[1], 1.2),
    ball([0.035, py + 0.125, z2 + 0.208], 0.55, IRONWORK[0], IRONWORK[2]),
    // a pewter jug and a scrubbing brush on the rim
    ...jug(0.06, y2 - 0.03, z2, 0.06, [PEWTER[0], PEWTER[1], PEWTER[2], PEWTER[0]]),
    ...box(0.1, y2 - 0.07, z2, 0.035, 0.02, 0.01, OAK),
    { ...line([[0.102, y2 - 0.05, z2 + 0.005], [0.133, y2 - 0.05, z2 + 0.005]], "#E8D8A8", 1), dash: "0.5 0.5" },
  ];
}

/** A Welsh dresser against the right-hand wall (y = 0) from x to x + w:
 *  a cupboard of drawers and doors, and a rack of shelves above it with
 *  blue-and-white plates, jugs and mugs, under a scalloped cornice. */
function dresser(x: number, w: number, accent: string): Shape[] {
  const X = x + w;
  const d = 0.13;
  const base = 0.24;
  const rd = 0.055;
  const top = 0.62;
  const shelves = [0.335, 0.43, 0.525];
  const shapes: Shape[] = [
    ...cabinet(x, 0, w, d, base, { tones: OAK, doors: 2, drawers: 3 }),
    // the rack's back board
    lit([[x + 0.01, 0.003, base], [X - 0.01, 0.003, base], [X - 0.01, 0.003, top], [x + 0.01, 0.003, top]], tone(OAK[2], -0.25), [x, 0, top], [X, 0, base], 0.1, 0.25),
    // on the worktop: a platter on edge, a crock, a jug
    ...plate(x + 0.07, 0.03, base + 0.05, 0.048),
    ...turned([x + 0.15, 0.06, base], [[0.026, 0], [0.032, 0.02], [0.03, 0.05], [0.024, 0.06]], GLAZE, "#2A1408"),
    ...turned([x + 0.15, 0.06, base + 0.06], [[0.026, 0], [0.018, 0.008], [0.006, 0.012], [0.008, 0.02]], GLAZE),
    ...candle(X - 0.05, 0.07, base, accent, 0.04, 0.05),
  ];
  shelves.forEach((z, i) => {
    shapes.push(...box(x + 0.008, 0, z, w - 0.016, rd, 0.012, OAK));
    if (i === 0) {
      // mugs and jugs
      const pieces: [number, number, string[], string?][] = [
        [0.05, 0.06, CREAM, DELFT],
        [0.105, 0.045, COPPER],
        [0.155, 0.065, CREAM, DELFT],
        [0.21, 0.045, GLAZE],
      ];
      for (const [u, h, colors, band] of pieces) shapes.push(...jug(x + u, 0.03, z + 0.012, h, colors, band));
    } else {
      const r = i === 1 ? 0.036 : 0.04;
      for (let k = 0; k < 3; k++) shapes.push(...plate(x + w * (0.2 + k * 0.3), 0.02, z + 0.012 + r, r));
      shapes.push(line([[x + 0.01, rd - 0.004, z + 0.03], [X - 0.01, rd - 0.004, z + 0.03]], OAK[0], 0.9));
    }
  });
  // the sides and the cornice with its scalloped valance
  shapes.push(
    ...box(x, 0, base, 0.016, rd, top - base, OAK),
    ...box(X - 0.016, 0, base, 0.016, rd, top - base, OAK),
    ...box(x - 0.01, 0, top, w + 0.02, rd + 0.016, 0.028, OAK),
  );
  const val: V3[] = [[x, rd + 0.017, top]];
  for (let i = 0; i <= 12; i++) {
    const u = x + (w * i) / 12;
    val.push([u, rd + 0.017, top - (i % 2 ? 0.022 : 0.008)]);
  }
  val.push([X, rd + 0.017, top]);
  shapes.push(lit(val, OAK[1], [x, rd, top], [X, rd, top - 0.02]));
  return shapes;
}

/** The servants' bells over the hall door: a mahogany board with a gilt
 *  edge, and a row of brass bells on coiled springs, each under its
 *  room's little ivory label. */
function bellBoard(x1: number, x2: number, z1: number, z2: number, count: number): Shape[] {
  const at = (u: number, z: number, y = 0.004): V3 => [u, y, z];
  const shapes: Shape[] = [
    filled([at(x1, z1), at(x2, z1), at(x2, z2), at(x1, z2)], [MAHOGANY[0], MAHOGANY[1], MAHOGANY[2]], at(x1, z2), at(x2, z1), tone(MAHOGANY[2], -0.5)),
    line([at(x1 + 0.008, z1 + 0.008, 0.005), at(x2 - 0.008, z1 + 0.008, 0.005), at(x2 - 0.008, z2 - 0.008, 0.005), at(x1 + 0.008, z2 - 0.008, 0.005), at(x1 + 0.008, z1 + 0.008, 0.005)], BRASS[1], 0.7),
  ];
  for (let i = 0; i < count; i++) {
    const u = x1 + ((x2 - x1) * (i + 0.5)) / count;
    const bz = z1 - 0.012;
    shapes.push(
      filled([at(u - 0.02, z2 - 0.032, 0.006), at(u + 0.02, z2 - 0.032, 0.006), at(u + 0.02, z2 - 0.016, 0.006), at(u - 0.02, z2 - 0.016, 0.006)], ["#FFFFFF", "#F4EEDF", "#D8CCB0"], at(u - 0.02, z2), at(u + 0.02, z2 - 0.03), "#6A5A3A"),
      line([at(u, z2 - 0.042, 0.006), at(u, z2 - 0.046, 0.02), at(u + 0.006, z2 - 0.05, 0.026), at(u - 0.006, z2 - 0.056, 0.028), at(u + 0.006, z2 - 0.062, 0.03), at(u - 0.004, z2 - 0.068, 0.032), at(u, bz + 0.03, 0.034)], BRASS[2], 0.7),
      ...turned([u, 0.034, bz], [[0.018, 0], [0.016, 0.004], [0.011, 0.012], [0.009, 0.022], [0.004, 0.03]], BRASS4),
      ball([u, 0.034, bz - 0.004], 0.35, BRASS[2]),
    );
  }
  return shapes;
}

/** A scrubbed kitchen table: square legs, a frieze with a drawer, a pale
 *  top. */
function kitchenTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const t = 0.026;
  return [
    shadowOf(x, y, w, d),
    ...box(X - t - 0.012, y + 0.012, 0, t, t, h - 0.02, PINE),
    ...box(x + 0.012, Y - t - 0.012, 0, t, t, h - 0.02, PINE),
    ...box(x + 0.012, y + 0.012, h - 0.06, w - 0.024, d - 0.024, 0.042, PINE),
    filled([[x + 0.05, Y - 0.011, h - 0.052], [x + 0.16, Y - 0.011, h - 0.052], [x + 0.16, Y - 0.011, h - 0.026], [x + 0.05, Y - 0.011, h - 0.026]], [tone(PINE[1], -0.1), tone(PINE[1], -0.2), tone(PINE[1], -0.05)], [x, Y, h - 0.026], [x, Y, h - 0.05]),
    ball([x + 0.105, Y - 0.01, h - 0.04], 0.45, BRASS[1], BRASS[2]),
    ...box(X - t - 0.012, Y - t - 0.012, 0, t, t, h - 0.02, PINE),
    ...box(x - 0.006, y - 0.006, h - 0.02, w + 0.012, d + 0.012, 0.02, SCRUBBED),
  ];
}

/** A carrot lying on a surface: an orange taper from `at` to its tip,
 *  green leaves out of its top. */
function carrot(at: V3, dx: number, dy: number, len = 0.06): Shape[] {
  const [x, y, z] = at;
  const nx = -dy * 0.008;
  const ny = dx * 0.008;
  const tip: V3 = [x + dx * len, y + dy * len, z];
  return [
    strokes([-0.5, 0, 0.5].map((a): V3[] => [[x, y, z + 0.006], [x - dx * 0.025 + a * dy * 0.02, y - dy * 0.025 - a * dx * 0.02, z + 0.01]]), LEAF[0], 0.7),
    lit([[x + nx, y + ny, z + 0.006], [x - nx, y - ny, z + 0.006], tip], "#E8782A", [x, y, z + 0.01], tip, 0.25, 0.2),
  ];
}

/** What lies on the table: a loaf on its board with the knife, flour
 *  and a rolling pin, a bowl of eggs, a pie, greens and a candle. */
function tableTop(z: number, accent: string): Shape[] {
  return [
    // a candle in its chamberstick at the back
    ...candle(0.585, 0.41, z, accent, 0.022, 0.05),
    // flour and the rolling pin
    disc(0.52, 0.43, z + 0.001, 0.05, "#FFFFFF", undefined, 0.4),
    disc(0.535, 0.445, z + 0.001, 0.025, "#FFFFFF", undefined, 0.35),
    ...rod([[0.48, 0.41, z + 0.01], [0.565, 0.47, z + 0.01]], "#E8D2A6", 2.2),
    ...rod([[0.47, 0.403, z + 0.01], [0.48, 0.41, z + 0.01]], OAK[1], 1),
    ...rod([[0.565, 0.47, z + 0.01], [0.575, 0.477, z + 0.01]], OAK[1], 1),
    // the breadboard, the loaf on it, a cut slice and the knife
    ...cylinder(0.415, 0.46, z, 0.055, 0.009, OAK),
    dome([0.41, 0.455, z + 0.009], 0.045, 0.028, 0.034, ["#F6D08C", "#C8843E", "#6E3E18"]),
    strokes([-0.02, 0, 0.02].map((dx): V3[] => [[0.41 + dx - 0.006, 0.44, z + 0.04], [0.41 + dx + 0.008, 0.468, z + 0.038]]), "#7A4418", 0.7, 0.9),
    { ...disc(0.445, 0.495, z + 0.012, 0.016, "#F4E6C4", "#B07A3A", undefined, 0.8) },
    ...rod([[0.455, 0.515, z + 0.011], [0.505, 0.525, z + 0.011]], PEWTER[0], 1.1),
    ...rod([[0.505, 0.525, z + 0.011], [0.535, 0.532, z + 0.011]], "#4A2A18", 1.6),
    // the pie in its dish
    ...cylinder(0.575, 0.505, z, 0.034, 0.014, [CREAM[0], CREAM[1], CREAM[2]]),
    { ...disc(0.575, 0.505, z + 0.016, 0.028, "#E8B060", "#9A6020", undefined, 0.6) },
    { ...disc(0.575, 0.505, z + 0.016, 0.03, undefined, "#C88A40", undefined, 1.3), dash: "0.6 0.7" },
    strokes([[[0.568, 0.5, z + 0.017], [0.582, 0.51, z + 0.017]], [[0.572, 0.492, z + 0.017], [0.584, 0.5, z + 0.017]]], "#7A4418", 0.6),
    // the bowl of eggs
    ...turned([0.5, 0.565, z], [[0.02, 0], [0.026, 0.006], [0.038, 0.022], [0.042, 0.032]], CREAM, "#5A4630"),
    hoop(0.5, 0.565, z + 0.022, 0.038, DELFT),
    ball([0.488, 0.56, z + 0.038], 0.62, "#F4E6CC", "#9A8A6A"),
    ball([0.51, 0.556, z + 0.04], 0.62, "#D8A878", "#7A5A3A"),
    ball([0.497, 0.575, z + 0.042], 0.62, "#F4E6CC", "#9A8A6A"),
    ball([0.515, 0.574, z + 0.037], 0.6, "#E2B88A", "#7A5A3A"),
    // greens at the front: a cabbage, onions, carrots
    dome([0.385, 0.56, z], 0.032, 0.032, 0.05, ["#C4E09A", "#7FA65A", "#3E6A2E"]),
    strokes([[[0.37, 0.56, z + 0.045], [0.39, 0.575, z + 0.02]], [[0.392, 0.548, z + 0.048], [0.405, 0.57, z + 0.025]]], "#E6F4C8", 0.5, 0.8),
    ball([0.425, 0.585, z + 0.016], 0.75, "#D49A48", "#6A4418"),
    ball([0.445, 0.575, z + 0.014], 0.65, "#C47A3A", "#6A4418"),
    ...carrot([0.43, 0.6, z + 0.002], 0.9, -0.3),
    ...carrot([0.42, 0.61, z + 0.002], 1, 0.1, 0.055),
  ];
}

/** A string of onions hung from a hook at (x, y, z). */
function onions(x: number, y: number, z: number, count: number, skin = "#C8843A"): Shape[] {
  const shapes: Shape[] = [line([[x, y, z], [x, y, z - 0.03 - count * 0.024]], "#C9A46A", 0.9)];
  for (let i = 0; i < count; i++) {
    const s = i % 2 ? 1 : -1;
    shapes.push(ball([x, y + s * 0.012, z - 0.03 - i * 0.024], 0.72 - i * 0.03, i % 3 === 2 ? tone(skin, 0.2) : skin, tone(skin, -0.6)));
  }
  return shapes;
}

/** A crate of vegetables: cabbages, turnips and carrots heaped on top. */
function vegCrate(x: number, y: number, w: number, d: number, h: number): Shape[] {
  return [
    ...crate(x, y, 0, w, d, h),
    dome([x + w * 0.35, y + d * 0.3, h], 0.034, 0.034, 0.045, ["#C4E09A", "#7FA65A", "#3E6A2E"]),
    ...carrot([x + w * 0.65, y + d * 0.25, h + 0.012], 0.6, 0.8),
    ball([x + w * 0.72, y + d * 0.55, h + 0.02], 0.8, "#F0E6F0", "#6A3A5A"),
    ball([x + w * 0.4, y + d * 0.68, h + 0.022], 0.85, "#E8D8E8", "#6A3A5A"),
    ...carrot([x + w * 0.25, y + d * 0.75, h + 0.01], 0.9, 0.2),
    dome([x + w * 0.7, y + d * 0.82, h], 0.03, 0.03, 0.04, ["#B8D88A", "#6E9A4A", "#355E26"]),
    ball([x + w * 0.52, y + d * 0.92, h + 0.016], 0.7, "#D49A48", "#6A4418"),
  ];
}

/** A broom leaning against the left-hand wall at y. */
function broom(y: number): Shape[] {
  const foot: V3 = [0.09, y, 0.0];
  const head: V3 = [0.075, y, 0.05];
  return [
    ...rod([[0.004, y, 0.46], head], WOOD[0], 1.1),
    filled([[0.06, y - 0.03, 0.06], [0.09, y - 0.03, 0.06], [foot[0] + 0.025, y - 0.04, 0], [foot[0] - 0.01, y - 0.04, 0], [foot[0] - 0.01, y + 0.04, 0], [0.06, y + 0.03, 0.06]], ["#E8C878", "#C8A050", "#8A6A30"], [0.06, y + 0.03, 0.06], [0.1, y - 0.04, 0]),
    strokes([-0.025, 0, 0.025].map((o): V3[] => [[0.075, y + o * 0.8, 0.055], [0.095, y + o * 1.3, 0.004]]), "#7A5A20", 0.4, 0.7),
    line([[0.06, y - 0.03, 0.05], [0.06, y + 0.03, 0.05]], "#A8323C", 1),
  ];
}

/** A kitchen clock on the left-hand wall: an oak rim, a brass bezel, an
 *  ivory face with its hours and hands. */
function clock(y: number, z: number, r: number): Shape[] {
  const at = (dy: number, dz: number, x = 0.006): V3 => [x, y + dy, z + dz];
  return [
    roundel("x", at(0, 0, 0.004), r, [OAK[0], OAK[1], OAK[2]], tone(OAK[2], -0.5)),
    roundel("x", at(0, 0), r * 0.78, ["#FFFFFF", "#F4EEDF", "#D8CCB0"], BRASS[2]),
    { ...line(ringOn("x", at(0, 0, 0.007), r * 0.66), "#3A2408", 1.2), dash: "0.3 1.6" },
    line([at(0, 0, 0.008), at(-r * 0.32, r * 0.3, 0.008)], "#1A1410", 0.9),
    line([at(0, 0, 0.008), at(r * 0.05, r * 0.58, 0.008)], "#1A1410", 0.6),
    ball(at(0, 0, 0.009), 0.25, BRASS[1]),
  ];
}

/** A three-legged stool at (x, y). */
function stool(x: number, y: number): Shape[] {
  const h = 0.13;
  const r = 0.042;
  return [
    disc(x + 0.025, y + 0.01, 0, r, INK.night, undefined, 0.28),
    strokes(
      [[-0.7, -0.7], [0.95, -0.2], [-0.2, 0.95]].map(([dx, dy]): V3[] => [[x + dx * r * 0.7, y + dy * r * 0.7, h], [x + dx * r * 1.05, y + dy * r * 1.05, 0]]),
      tone(OAK[2], -0.4),
      2.6,
    ),
    strokes(
      [[0.95, -0.2], [-0.2, 0.95]].map(([dx, dy]): V3[] => [[x + dx * r * 0.7, y + dy * r * 0.7, h], [x + dx * r * 1.05, y + dy * r * 1.05, 0]]),
      OAK[1],
      1.6,
    ),
    ...cylinder(x, y, h, r, 0.016, OAK),
  ];
}

/** A braided rag rug: rings of coloured cloth. */
function ragRug(x: number, y: number, r: number): Shape[] {
  const rings = ["#6A3A2A", "#A8503A", "#C89A5A", "#4A6A6A", "#B4483D", "#D8B878"];
  return [
    disc(x + 0.02, y + 0.01, 0, r * 1.02, INK.night, undefined, 0.25),
    ...rings.map((c, i): Shape => {
      const rr = r * (1 - i / rings.length);
      const [cx, cy] = P(x, y, 0);
      return { ...disc(x, y, 0.001, rr, c, tone(c, -0.45), undefined, 0.4), grad: { colors: [tone(c, 0.18), c, tone(c, -0.2)], from: [cx - rr * unit() * 0.6, cy - rr * unit() * 0.4], radius: rr * unit() * 1.6 } };
    }),
  ];
}

export function kitchen(accent: string): Shape[] {
  const tableH = 0.21;
  const rail = 0.6;
  const hookZ = 0.38;
  const bailZ = 0.257;
  return [
    ...shell(),
    ...flagstones(4, "#7D6F55"),
    // shadow gathered along the foot of the walls
    tint([[0, 0, 0], [0.08, 0.08, 0], [0.08, 1, 0], [0, 1, 0]], "#000000", 0.16),
    tint([[0, 0, 0], [1, 0, 0], [1, 0.08, 0], [0.08, 0.08, 0]], "#000000", 0.14),
    // the servants' bells over the hall door
    ...bellBoard(0.36, 0.64, 0.6, 0.705, 5),
    // copper pans on a rail over the sink, the tiles behind it
    ...tiles(0.172, 0.31, 0.2, 0.4),
    ...rod([[0.01, 0.03, rail], [0.01, 0.31, rail]], IRONWORK[1], 1.1),
    ...[0.04, 0.3].flatMap((y) => rod([[0, y, rail + 0.03], [0.012, y, rail]], IRONWORK[1], 0.8)),
    ...wallPan(0.065, rail, 0.03, 0.05),
    ...wallPan(0.13, rail, 0.044, 0.06),
    ...ladle(0.185, rail),
    ...wallPan(0.235, rail, 0.052, 0.045),
    ...wallPan(0.295, rail, 0.034, 0.07),
    // the dresser in the back corner
    ...dresser(0.06, 0.25, accent),
    // the stone sink with its pump
    ...sink(0.17, 0.31),
    // the shelf of crocks and jars, onions and garlic hung under it
    ...shelfX(0.69, 0.97, 0.46, 0.07, OAK),
    ...turned([0.035, 0.72, 0.478], [[0.02, 0], [0.025, 0.02], [0.024, 0.05], [0.019, 0.058]], GLAZE, "#2A1408"),
    ...jar(0.035, 0.77, 0.478, 0.019, 0.055, INK.red),
    ...jar(0.035, 0.815, 0.478, 0.017, 0.045, "#E8A040"),
    ...turned([0.035, 0.865, 0.478], [[0.022, 0], [0.026, 0.03], [0.022, 0.066], [0.016, 0.072]], CREAM, "#5A4630"),
    hoop(0.035, 0.865, 0.478 + 0.03, 0.026, DELFT),
    ...jar(0.035, 0.915, 0.478, 0.018, 0.05, LEAF[1]),
    ...box(0.012, 0.935, 0.478, 0.05, 0.03, 0.06, OAK),
    ...clock(0.83, 0.625, 0.052),
    ...onions(0.05, 0.73, 0.455, 6),
    ...onions(0.05, 0.795, 0.455, 5, "#EDE2CC"),
    ...herbs([0.05, 0.86, 0.455], 1.1),
    ...onions(0.05, 0.925, 0.455, 6),
    // the vegetable crate, the flour sack, the broom
    ...broom(0.975),
    ...vegCrate(0.03, 0.7, 0.17, 0.15, 0.12),
    ...sack([0.13, 0.93, 0], 3.8, "#E2D6B8", 0.06),
    // the hearth: its stone, the fire inside, the breast, the mantel, the hood
    ...box(HX1 - 0.02, 0, 0, HX2 - HX1 + 0.02, 0.43, 0.025, [tone(STONE_T[1], -0.1), tone(STONE_T[1], -0.2), tone(STONE_T[2], -0.2)]),
    ...firebox(accent),
    ...breast(),
    ...mantel(),
    ...hood(),
    ...mantelPieces(accent),
    ...herbs([HX1 + 0.008, HD + 0.042, MANTEL], 1),
    ...herbs([HX2 - 0.012, HD + 0.042, MANTEL], 1, ["#9AB872", "#6E8E4E", "#4A6A34"]),
    ...lightPool([0.8, 0.45, 0], 0.5),
    // the crane, and the embers raked out under the cauldron
    ...crane(hookZ, bailZ),
    disc(0.8, 0.35, 0.026, 0.07, "#3A302C", "#2A221E"),
    ...log(0.76, 0.84, 0.36, 0.04, 0.012),
    ...[[0.78, 0.33], [0.81, 0.37], [0.83, 0.34], [0.77, 0.37]].map(([x, y]) => ball([x, y, 0.03], 0.5, "#F07A30", "#8A2A10")),
    ...flame([0.785, 0.355, 0.03], 1.7, accent),
    ...flame([0.818, 0.335, 0.03], 2.1, accent),
    // the cauldron on its chain (the room's object)
    ...prop(() => {
      const cz = 0.08;
      const bail: V3[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = (i / 12) * Math.PI;
        bail.push([0.8 + Math.cos(t) * 0.05, 0.34 - Math.cos(t) * 0.05, cz + 0.1 + Math.sin(t) * (bailZ - cz - 0.1)]);
      }
      return [
        ...[[-0.04, 0.02], [0.03, 0.03], [0.01, -0.04]].map(([dx, dy]) => line([[0.8 + dx, 0.34 + dy, cz + 0.01], [0.8 + dx * 1.2, 0.34 + dy * 1.2, cz - 0.03]], IRONWORK[2], 1.6)),
        ...turned(
          [0.8, 0.34, cz],
          [
            [0.035, 0],
            [0.058, 0.016],
            [0.072, 0.042],
            [0.075, 0.062],
            [0.069, 0.087],
            [0.062, 0.097],
            [0.07, 0.104],
          ],
          IRON,
          tone(IRONWORK[2], -0.3),
        ),
        disc(0.8, 0.34, cz + 0.101, 0.06, STEW, tone(STEW, -0.5)),
        ball([0.785, 0.335, cz + 0.104], 0.45, "#B4CC8A"),
        ball([0.815, 0.345, cz + 0.104], 0.35, "#B4CC8A"),
        ball([0.8, 0.355, cz + 0.104], 0.3, "#B4CC8A"),
        hoop(0.8, 0.34, cz + 0.07, 0.074, IRONWORK[0]),
        ball([0.85, 0.29, cz + 0.098], 0.45, IRONWORK[1], IRONWORK[2]),
        ball([0.75, 0.39, cz + 0.098], 0.45, IRONWORK[1], IRONWORK[2]),
        ...rod(bail, IRONWORK[1], 0.9),
      ];
    }),
    ...steam([0.8, 0.34, 0.19], 0.26, 0.46),
    // the scrubbed table and all on it, a stool, a rug before the fire
    ...ragRug(0.66, 0.68, 0.13),
    ...kitchenTable(0.34, 0.38, 0.28, 0.22, tableH),
    ...tableTop(tableH, accent),
    ...stool(0.265, 0.64),
    ...lightPool([0.5, 0.5, 0], 0.3),
  ];
}

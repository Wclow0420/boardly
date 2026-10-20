// Seal the Manor's kitchen: a warm, busy manor kitchen. A great hearth in
// the far-right corner (a pale stone chimney breast with an arched
// opening, a log fire on its dogs, a copper hood and flue above an oak
// mantel of copper pots and candles), the cauldron hanging from its iron
// crane over raked-out embers (the prop), copper pans on a rail over a
// stone sink with its pump, a Welsh dresser of blue-and-white plates,
// the servants' bells over the hall door, a scrubbed table laid with a
// loaf, eggs, flour and greens, a shelf of crocks hung with onions, and
// a crate of vegetables, a flour sack, a clock, a stool and a rag rug.
// The hearth is drawn here; the rest comes from the shared pieces
// (components/iso/pieces). See roomScenes.ts.

import {
  ball,
  box,
  cylinder,
  flame,
  hoop,
  INK,
  LEAF,
  lightPool,
  line,
  P,
  poly,
  steam,
  tone,
  unit,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { disc, prop, shell, tint } from "@/components/iso/room";
import {
  bellBoard,
  BRASS,
  broom,
  carrot,
  CHINA,
  chinaPlate,
  COPPER,
  CREAM,
  DELFT,
  delftTiles,
  dome,
  dresser,
  filled,
  flagstones,
  GLAZE,
  grainSack,
  herbs,
  IRON_SHEEN,
  IRONWORK,
  jar,
  jug,
  kitchenTable,
  ladle,
  LIMESTONE,
  OAK,
  onions,
  PEWTER,
  ragRug,
  rod,
  roundel,
  shaded,
  shelfX,
  sink,
  stool,
  strokes,
  turned,
  turnedCandlestick,
  vegCrate,
  wallClock,
  wallPan,
} from "@/components/iso/pieces";

const COPPER_T: Tones = [COPPER[0], COPPER[1], COPPER[2]];
/** The stew in the cauldron. */
const STEW = "#6F8452";

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
    shaded([[HX2, 0, 0.025], [HX2, HD, 0.025], [HX2, HD, MANTEL], [HX2, 0, MANTEL]], tone(STONE_T[2], -0.18), [HX2, 0, MANTEL], [HX2, HD, 0.025], 0.06, 0.3),
    shaded(face, STONE_T[1], front(HX1, MANTEL), front(HX2, 0.025), 0.16, 0.22),
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
    shapes.push(shaded([vf(a1 + 0.01, R), vf(a2 - 0.01, R), vf(a2 - 0.01, o), vf(a1 + 0.01, o)], fill, vf(a2, o), vf(a1, R), 0.18, 0.22));
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
    shaded([[x, HD + 0.022, MANTEL - 0.05], [x + 0.026, HD + 0.022, MANTEL - 0.05], [x + 0.013, HD + 0.008, MANTEL - 0.075]], OAK[2], [x, HD, MANTEL], [x, HD, MANTEL - 0.07]),
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
    shaded([side(0, 0), side(0, 1), side(1, 1), side(1, 0)], COPPER_T[2], side(1, 0), side(0, 1), 0.12, 0.3),
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
    shaded([side(0, 1), side(0.11, 1), side(0.11, 0), side(0, 0)], BRASS[2], side(0.11, 0), side(0, 1)),
    { ...line([on(0.08, 0.03), on(0.08, 0.97)], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

/** What stands on the mantel: candlesticks at the ends, copper pots, a
 *  pewter jug, two plates on edge, a blue-and-white ginger jar. */
function mantelPieces(accent: string): Shape[] {
  const z = MANTEL + 0.03;
  const y = HD - 0.01;
  return [
    ...chinaPlate(0.79, 0.205, z + 0.042, 0.04),
    ...chinaPlate(0.885, 0.205, z + 0.036, 0.034),
    ...turnedCandlestick(HX1 + 0.022, y, z, accent, 0.045, 0.05),
    ...turned([0.745, y, z], [[0.024, 0], [0.031, 0.008], [0.031, 0.036], [0.029, 0.04]], COPPER, "#3A1A0C"),
    ...turned([0.745, y, z + 0.04], [[0.03, 0], [0.022, 0.008], [0.007, 0.013], [0.009, 0.022]], COPPER),
    ...jug(0.83, y, z, 0.07, [PEWTER[0], PEWTER[1], PEWTER[2], PEWTER[0]]),
    ...turned([0.9, y, z], [[0.018, 0], [0.025, 0.012], [0.026, 0.03], [0.019, 0.044], [0.014, 0.05], [0.016, 0.054]], CHINA, "#1A2240"),
    hoop(0.9, y, z + 0.026, 0.026, DELFT),
    hoop(0.9, y, z + 0.016, 0.024, DELFT),
    ...turned([0.9, y, z + 0.054], [[0.017, 0], [0.012, 0.008], [0.004, 0.012], [0.005, 0.018]], CHINA),
    ...turnedCandlestick(HX2 - 0.026, y, z, accent, 0.045, 0.05),
  ];
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

// ── the room ────────────────────────────────────────────────────────

/** What lies on the table: a loaf on its board with the knife, flour
 *  and a rolling pin, a bowl of eggs, a pie, greens and a candle. */
function tableTop(z: number, accent: string): Shape[] {
  return [
    // a candle in its chamberstick at the back
    ...turnedCandlestick(0.585, 0.41, z, accent, 0.022, 0.05),
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
    ...delftTiles(0.172, 0.31, 0.2, 0.4),
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
    ...wallClock(0.83, 0.625, 0.052),
    ...onions(0.05, 0.73, 0.455, 6),
    ...onions(0.05, 0.795, 0.455, 5, "#EDE2CC"),
    ...herbs([0.05, 0.86, 0.455], 1.1),
    ...onions(0.05, 0.925, 0.455, 6),
    // the vegetable crate, the flour sack, the broom
    ...broom(0.975),
    ...vegCrate(0.03, 0.7, 0.17, 0.15, 0.12),
    ...grainSack([0.13, 0.93, 0], 3.8, "#E2D6B8", 0.06),
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
          IRON_SHEEN,
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

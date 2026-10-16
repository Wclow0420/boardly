// Tables and desks, and the church's altar and lectern.

import {
  ball,
  box,
  cylinder,
  flat,
  GOLD,
  INK,
  inkOf,
  line,
  n,
  P,
  path,
  tone,
  unit,
  WOOD,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { shadow, tint } from "../room";
import {
  BRASS,
  CRIMSON,
  GILT,
  LIMESTONE,
  LINEN,
  MAHOGANY,
  MARBLE,
  PALE_GILT,
  PINE,
  SCRUBBED,
  VELVET,
  WARM_MAHOGANY,
} from "./materials";
import { ellipsePoints, filled, gradPoly, lit, panel, ringOn, shadowOf } from "./helpers";
import { turned } from "./turned";

/** A gilt console table against a wall at (x, y), w × d, its top at h: legs ending in feet, a shelf
 *  low between them, a carved apron with a pendant shell, and a veined
 *  marble top. Its lit face is at y + d. */
export function consoleTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.018;
  const legAt = (lx: number, ly: number): Shape[] => [
    ...box(lx - 0.004, ly - 0.004, 0, leg + 0.008, leg + 0.008, 0.014, GOLD),
    ...box(lx, ly, 0.014, leg, leg, h - 0.07, GOLD),
    ...box(lx - 0.003, ly - 0.003, h * 0.42, leg + 0.006, leg + 0.006, 0.01, GOLD),
  ];
  const apronZ = h - 0.058;
  const midU = (x + X) / 2;
  const scallop: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = x + 0.015 + ((w - 0.03) * i) / 16;
    scallop.push([u, Y + 0.002, apronZ + 0.008 + Math.abs(Math.sin((i / 16) * Math.PI * 4)) * 0.012]);
  }
  return [
    shadowOf(x, y, w, d),
    ...legAt(X - leg - 0.012, y + 0.01),
    ...box(x + 0.02, y + 0.014, 0.05, w - 0.04, d - 0.032, 0.01, GOLD),
    ...legAt(x + 0.012, Y - leg - 0.01),
    ...legAt(X - leg - 0.012, Y - leg - 0.01),
    ...box(x, y, apronZ, w, d, 0.04, GOLD),
    line(scallop, GOLD[2], 0.6),
    { ...line([[x + 0.01, Y + 0.002, apronZ + 0.032], [X - 0.01, Y + 0.002, apronZ + 0.032]], GOLD[2], 0.5), opacity: 0.8 },
    // the pendant shell under the apron
    filled(ringOn("y", [midU, Y + 0.002, apronZ + 0.004], 0.026, 10, Math.PI, Math.PI * 2), [GOLD[0], GOLD[1], GOLD[2]], [midU - 0.02, Y, apronZ], [midU + 0.02, Y, apronZ - 0.026], GOLD[2]),
    ...[-0.6, 0, 0.6].map((a) =>
      line([[midU, Y + 0.003, apronZ + 0.002], [midU + Math.sin(a) * 0.02, Y + 0.003, apronZ - Math.cos(a) * 0.02]], GOLD[2], 0.4),
    ),
    ...box(x - 0.012, y, h - 0.018, w + 0.024, d + 0.012, 0.018, MARBLE),
    { ...line([[x + 0.02, y + 0.03, h], [x + w * 0.4, y + 0.06, h], [x + w * 0.55, Y - 0.01, h]], "#9E9483", 0.45), opacity: 0.6 },
    { ...line([[x + w * 0.6, y + 0.01, h], [x + w * 0.8, y + d * 0.6, h]], "#9E9483", 0.4), opacity: 0.5 },
  ];
}

/** A long dinner table at (x, y), w × d, its top at h: turned mahogany legs under a white cloth that
 *  falls over its edges with a gilt hem and soft folds, and a gold
 *  runner down its length that hangs over the far end with a tassel. */
export function dinnerTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const drop = 0.075;
  const o = 0.012;
  const shapes: Shape[] = [shadowOf(x, y, w, d)];
  const legs: [number, number][] = [
    [X - 0.04, y + 0.03],
    [x + 0.04, Y - 0.03],
    [x + w / 2, Y - 0.03],
    [X - 0.04, Y - 0.03],
  ];
  for (const [lx, ly] of legs) {
    shapes.push(
      ...turned(
        [lx, ly, 0],
        [
          [0.016, 0],
          [0.012, 0.02],
          [0.018, 0.045],
          [0.01, 0.08],
          [0.013, 0.12],
          [0.011, h - drop],
        ],
        [tone(MAHOGANY[0], 0.2), MAHOGANY[1], MAHOGANY[2], tone(MAHOGANY[1], 0.1)],
      ),
    );
  }
  // the cloth: its top and the fall over the two near edges
  shapes.push(...box(x - o, y - o, h - drop, w + 2 * o, d + 2 * o, drop + 0.002, LINEN));
  const top = h + 0.002;
  for (const f of [0.12, 0.3, 0.5, 0.7, 0.88]) {
    const u = x - o + (w + 2 * o) * f;
    shapes.push({ ...line([[u, Y + o + 0.001, top - 0.006], [u + 0.006, Y + o + 0.001, h - drop + 0.004]], LINEN[2], 1.1), opacity: 0.55 });
  }
  for (const f of [0.3, 0.7]) {
    const v = y - o + (d + 2 * o) * f;
    shapes.push({ ...line([[X + o + 0.001, v, top - 0.006], [X + o + 0.001, v + 0.006, h - drop + 0.004]], LINEN[2], 1.1), opacity: 0.55 });
  }
  const hem = h - drop + 0.012;
  shapes.push(
    line([[x - o, Y + o + 0.001, hem], [X + o + 0.001, Y + o + 0.001, hem], [X + o + 0.001, y - o, hem]], GOLD[1], 1),
    { ...line([[x - o, Y + o + 0.001, hem - 0.007], [X + o + 0.001, Y + o + 0.001, hem - 0.007], [X + o + 0.001, y - o, hem - 0.007]], GOLD[2], 1.4), dash: "0.3 1.6" },
  );
  // the runner, and its end hanging over the near end of the table
  const [r1, r2] = [y + d / 2 - 0.026, y + d / 2 + 0.026];
  const rm = (r1 + r2) / 2;
  shapes.push(
    { ...flat(x - o, X + o, r1, r2, top, GOLD[1], GOLD[2]), grad: { colors: [GOLD[0], GOLD[1], GOLD[2]], from: P(x, r1, top), to: P(X, r2, top) } },
    line([[x - o + 0.005, r1 + 0.008, top], [X + o, r1 + 0.008, top]], VELVET[1], 0.55),
    line([[x - o + 0.005, r2 - 0.008, top], [X + o, r2 - 0.008, top]], VELVET[1], 0.55),
    filled([[X + o + 0.002, r1, top], [X + o + 0.002, r2, top], [X + o + 0.002, r2, top - 0.075], [X + o + 0.002, rm, top - 0.1], [X + o + 0.002, r1, top - 0.075]], [GOLD[0], GOLD[1], GOLD[2]], [X, r1, top], [X, r2, top - 0.1], GOLD[2]),
    line([[X + o + 0.003, r1 + 0.008, top], [X + o + 0.003, r1 + 0.008, top - 0.072], [X + o + 0.003, rm, top - 0.09], [X + o + 0.003, r2 - 0.008, top - 0.072], [X + o + 0.003, r2 - 0.008, top]], VELVET[1], 0.55),
    line([[X + o + 0.004, rm, top - 0.1], [X + o + 0.004, rm, top - 0.13]], GOLD[1], 1.6),
  );
  return shapes;
}

/** A writing table at (x, y), w × d, its top at h: slim legs on brass toes, an apron with a drawer on
 *  its lit face, a moulded top with a gilt edge and a leather inset. */
export function writingTable(x: number, y: number, w: number, d: number, h: number, tones: Tones = WARM_MAHOGANY, leather = "#2F5A45"): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.026;
  const apron = 0.055;
  const slab = 0.02;
  const legAt = (lx: number, ly: number) => [
    ...box(lx, ly, 0.012, leg, leg, h - slab - 0.012, tones),
    ...box(lx - 0.002, ly - 0.002, 0, leg + 0.004, leg + 0.004, 0.012, BRASS),
  ];
  return [
    shadow(x, y, w, d),
    ...legAt(x + 0.008, y + 0.008),
    ...legAt(X - 0.008 - leg, y + 0.008),
    ...legAt(x + 0.008, Y - 0.008 - leg),
    ...box(x, y, h - slab - apron, w, d, apron, tones),
    ...panel("lit", Y, x + 0.04, X - 0.04, h - slab - apron + 0.01, h - slab - 0.01, tones[1]),
    ball([(x + X) / 2, Y, h - slab - apron / 2], 0.7, BRASS[1], BRASS[2]),
    ...panel("shade", X, y + 0.03, Y - 0.03, h - slab - apron + 0.01, h - slab - 0.01, tones[2]),
    ...legAt(X - 0.008 - leg, Y - 0.008 - leg),
    ...box(x - 0.012, y - 0.012, h - slab, w + 0.024, d + 0.024, slab, tones),
    line([[x - 0.012, Y + 0.012, h - slab + 0.004], [X + 0.012, Y + 0.012, h - slab + 0.004], [X + 0.012, y - 0.012, h - slab + 0.004]], GILT[1], 0.55),
    gradPoly(
      [[x + 0.008, y + 0.008, h + 0.0005], [X - 0.008, y + 0.008, h + 0.0005], [X - 0.008, Y - 0.008, h + 0.0005], [x + 0.008, Y - 0.008, h + 0.0005]],
      [tone(leather, 0.2), leather, tone(leather, -0.25)],
      [x, y, h],
      [X, Y, h],
      tone(leather, -0.5),
      0.4,
    ),
    { d: path(([[x + 0.018, y + 0.018], [X - 0.018, y + 0.018], [X - 0.018, Y - 0.018], [x + 0.018, Y - 0.018]] as [number, number][]).map(([a, b]) => P(a, b, h + 0.001))), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.8 },
  ];
}

/** A pedestal desk at (x, y), w × d, whose drawers face +y: two pedestals of three drawers
 *  with brass bail pulls, a kneehole with a modesty panel, a drawer over
 *  it, and a moulded top with a gilt-tooled leather inset. Its top is
 *  at h. */
export function pedestalDesk(x: number, y: number, w: number, d: number, h: number, tones: Tones = WARM_MAHOGANY, leather = "#2F5A45"): Shape[] {
  const X = x + w;
  const Y = y + d;
  const slab = 0.026;
  const body = h - slab;
  const ped = w * 0.3;
  const plinth = 0.02;
  const pull = (u: number, z: number): Shape[] => [
    {
      d: (() => {
        const [a, b] = P(u - 0.011, Y + 0.002, z);
        const [c, e] = P(u + 0.011, Y + 0.002, z);
        return `M${n(a)} ${n(b - 0.6)} L${n(a)} ${n(b)} Q${n((a + c) / 2)} ${n((b + e) / 2 + 1.5)} ${n(c)} ${n(e)} L${n(c)} ${n(e - 0.6)}`;
      })(),
      stroke: BRASS[1],
      strokeWidth: 0.8,
    },
  ];
  const pedestal = (px: number): Shape[] => {
    const out: Shape[] = [
      ...box(px - 0.004, y - 0.004, 0, ped + 0.008, d + 0.008, plinth, tones.map((t) => tone(t, -0.15)) as Tones),
      ...box(px, y, plinth, ped, d, body - plinth - 0.004, tones),
      ...panel("shade", px + ped, y + 0.02, Y - 0.02, plinth + 0.02, body - 0.03, tones[2]),
    ];
    const dh = (body - plinth - 0.02) / 3;
    for (let i = 0; i < 3; i++) {
      const z1 = plinth + 0.008 + i * dh;
      out.push(...panel("lit", Y, px + 0.012, px + ped - 0.012, z1 + 0.006, z1 + dh - 0.006, tones[1]), ...pull(px + ped / 2, z1 + dh * 0.55));
    }
    return out;
  };
  return [
    shadow(x - 0.01, y, w + 0.02, d + 0.02),
    // the modesty panel at the back of the kneehole
    ...box(x + ped, y + 0.01, plinth, w - 2 * ped, 0.02, body - plinth, tones.map((t) => tone(t, -0.2)) as Tones),
    ...pedestal(x),
    ...pedestal(X - ped),
    // the drawer over the kneehole
    ...box(x + ped, y, body - 0.05, w - 2 * ped, d, 0.046, tones),
    ...panel("lit", Y, x + ped + 0.012, X - ped - 0.012, body - 0.044, body - 0.01, tones[1]),
    ...pull(x + w / 2, body - 0.026),
    // the top: moulded, its edge gilt, a leather inset tooled in gold
    ...box(x - 0.014, y - 0.014, body, w + 0.028, d + 0.028, slab, tones),
    line([[x - 0.014, Y + 0.014, body + 0.008], [X + 0.014, Y + 0.014, body + 0.008], [X + 0.014, y - 0.014, body + 0.008]], GILT[1], 0.55),
    gradPoly(
      [[x + 0.012, y + 0.012, h + 0.0005], [X - 0.012, y + 0.012, h + 0.0005], [X - 0.012, Y - 0.012, h + 0.0005], [x + 0.012, Y - 0.012, h + 0.0005]],
      [tone(leather, 0.22), leather, tone(leather, -0.28)],
      [x, y, h],
      [X, Y, h],
      tone(leather, -0.55),
      0.45,
    ),
    { d: path(([[x + 0.022, y + 0.022], [X - 0.022, y + 0.022], [X - 0.022, Y - 0.022], [x + 0.022, Y - 0.022]] as [number, number][]).map(([a, b]) => P(a, b, h + 0.001))), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.85 },
  ];
}

/** A round tripod table at (x, y): three splayed feet, a turned column,
 *  a round top at h. */
export function tripodTable(x: number, y: number, r: number, h: number, tones: Tones = WARM_MAHOGANY): Shape[] {
  return [
    { ...shadow(x - r, y - r * 0.8, r * 1.6, r * 1.6) },
    ...[0, 1, 2].map((i) => {
      const a = Math.PI / 4 + (i * 2 * Math.PI) / 3 + Math.PI / 3;
      return line([[x, y, 0.06], [x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, 0]], tones[1], 1.6);
    }),
    ...cylinder(x, y, 0.02, 0.012, 0.08, tones),
    ...cylinder(x, y, 0.06, 0.018, 0.02, tones),
    ...cylinder(x, y, 0.08, 0.009, h - 0.095, tones),
    ...cylinder(x, y, h - 0.015, r, 0.015, tones),
    { ...ring1(x, y, h, r * 0.82), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.8 },
  ];
}

const ring1 = (x: number, y: number, z: number, r: number): Shape => {
  const [cx, cy] = P(x, y, z);
  return { d: path(ellipsePoints(cx, cy, r * unit() * 1.2247, r * unit() * 0.7071, 20)) };
};

/** A scrubbed kitchen table at (x, y), w × d, its top at h: square legs, a frieze with a drawer, a pale
 *  top. */
export function kitchenTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
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

/** An altar on a dais step at z: a carved oak body with sunk panels, a
 *  stone top under an ivory cloth with a gold hem, and a crimson frontal
 *  with a gold border, fringe and cross. Its lit face is at y + d. */
export function altar(x: number, y: number, z: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const top = z + h;
  const cloth = top - 0.055;
  const fx1 = x + w * 0.36;
  const fx2 = X - w * 0.36;
  const oak = WOOD;
  const shapes: Shape[] = [
    ...box(x - 0.01, y - 0.006, z, w + 0.02, d + 0.012, 0.02, LIMESTONE),
    ...box(x, y, z + 0.02, w, d, h - 0.04, oak),
    ...panel("lit", Y, x + 0.016, fx1 - 0.014, z + 0.04, cloth - 0.012, oak[1]),
    ...panel("lit", Y, fx2 + 0.014, X - 0.016, z + 0.04, cloth - 0.012, oak[1]),
    ...panel("shade", X, y + 0.018, Y - 0.018, z + 0.04, cloth - 0.012, oak[2]),
    ball([(x + fx1) / 2, Y, (z + cloth) / 2 + 0.01], 0.45, PALE_GILT[1], inkOf(PALE_GILT[1])),
    ball([(fx2 + X) / 2, Y, (z + cloth) / 2 + 0.01], 0.45, PALE_GILT[1], inkOf(PALE_GILT[1])),
    ...box(x - 0.012, y - 0.008, top - 0.02, w + 0.024, d + 0.016, 0.02, LIMESTONE),
  ];
  const cy = Y + 0.009;
  const cx = X + 0.013;
  // the cloth over the top and down the front and side, with a gold hem
  shapes.push(
    lit([[x - 0.014, y - 0.008, top + 0.002], [X + 0.013, y - 0.008, top + 0.002], [X + 0.013, cy, top + 0.002], [x - 0.014, cy, top + 0.002]], "#F4EEDF", [x, y, top], [X, Y, top], 0.2, 0.08),
    lit([[x - 0.014, cy, cloth], [X + 0.013, cy, cloth], [X + 0.013, cy, top + 0.002], [x - 0.014, cy, top + 0.002]], "#F4EEDF", [x, cy, top], [X, cy, cloth], 0.15, 0.15),
    lit([[cx, y - 0.008, cloth], [cx, cy, cloth], [cx, cy, top + 0.002], [cx, y - 0.008, top + 0.002]], "#D8CCB0", [cx, y, top], [cx, Y, cloth], 0.1, 0.2),
    line([[x - 0.012, cy + 0.001, cloth + 0.008], [X + 0.012, cy + 0.001, cloth + 0.008], [cx + 0.001, y - 0.006, cloth + 0.008]], PALE_GILT[1], 1.1),
    { ...line([[x - 0.012, cy + 0.001, cloth + 0.002], [X + 0.012, cy + 0.001, cloth + 0.002]], PALE_GILT[2], 0.5), dash: "0.6 0.8" },
  );
  // the frontal
  const fy = cy + 0.002;
  shapes.push(
    lit([[fx1, fy, z + 0.035], [fx2, fy, z + 0.035], [fx2, fy, top + 0.002], [fx1, fy, top + 0.002]], CRIMSON, [fx1, fy, top], [fx2, fy, z], 0.25, 0.3),
    line([[fx1 + 0.008, fy + 0.001, z + 0.045], [fx1 + 0.008, fy + 0.001, top - 0.004]], PALE_GILT[1], 0.8),
    line([[fx2 - 0.008, fy + 0.001, z + 0.045], [fx2 - 0.008, fy + 0.001, top - 0.004]], PALE_GILT[1], 0.8),
    line([[fx1 + 0.004, fy + 0.001, z + 0.035], [fx2 - 0.004, fy + 0.001, z + 0.035]], PALE_GILT[1], 1.6),
    { ...line([[fx1 + 0.004, fy + 0.001, z + 0.03], [fx2 - 0.004, fy + 0.001, z + 0.03]], PALE_GILT[0], 1.2), dash: "0.5 0.7" },
  );
  const mx = (fx1 + fx2) / 2;
  const mz = (z + 0.035 + cloth) / 2;
  shapes.push(
    line([[mx, fy + 0.002, mz - 0.05], [mx, fy + 0.002, mz + 0.05]], PALE_GILT[2], 2.2),
    line([[mx - 0.028, fy + 0.002, mz + 0.018], [mx + 0.028, fy + 0.002, mz + 0.018]], PALE_GILT[2], 2.2),
    line([[mx, fy + 0.002, mz - 0.05], [mx, fy + 0.002, mz + 0.05]], PALE_GILT[0], 1.2),
    line([[mx - 0.028, fy + 0.002, mz + 0.018], [mx + 0.028, fy + 0.002, mz + 0.018]], PALE_GILT[0], 1.2),
  );
  return shapes;
}

/** A lectern with an open book, its column standing at (cx, cy) and its
 *  desk at height top: a stepped foot, a turned column with a brass
 *  knop, a gilt-edged desk, the book in crimson boards with a ribbon. */
export function lectern(cx: number, cy: number, top: number): Shape[] {
  const page = (sign: number): V3[] => [
    [cx, cy - 0.028, top + 0.016],
    [cx + sign * 0.045, cy - 0.028, top + 0.006],
    [cx + sign * 0.045, cy + 0.03, top + 0.006],
    [cx, cy + 0.03, top + 0.016],
  ];
  const shapes: Shape[] = [
    tint([[cx - 0.03, cy - 0.015, 0], [cx + 0.08, cy - 0.015, 0], [cx + 0.08, cy + 0.06, 0], [cx - 0.03, cy + 0.06, 0]], INK.night, 0.3),
    ...box(cx - 0.05, cy - 0.045, 0, 0.1, 0.09, 0.02, WOOD.map((c) => tone(c, -0.15)) as Tones),
    ...box(cx - 0.035, cy - 0.032, 0.02, 0.07, 0.064, 0.016, WOOD),
    ...cylinder(cx, cy, 0.036, 0.015, top - 0.07, WOOD),
    ...cylinder(cx, cy, 0.11, 0.019, 0.012, PALE_GILT),
    ...box(cx - 0.028, cy - 0.028, top - 0.045, 0.056, 0.056, 0.022, WOOD),
    ...box(cx - 0.056, cy - 0.042, top - 0.022, 0.112, 0.084, 0.022, WOOD),
    line([[cx - 0.054, cy + 0.043, top - 0.008], [cx + 0.054, cy + 0.043, top - 0.008]], PALE_GILT[1], 0.9),
    flat(cx - 0.05, cx + 0.05, cy - 0.034, cy + 0.036, top + 0.002, CRIMSON),
    lit(page(-1), "#F4EEDF", page(-1)[1], page(-1)[3], 0.15, 0.12),
    lit(page(1), "#F4EEDF", page(1)[0], page(1)[2], 0.1, 0.18),
  ];
  for (const sign of [-1, 1]) {
    for (const f of [0.2, 0.42, 0.64]) {
      const yy = cy - 0.028 + 0.058 * f;
      shapes.push({ ...line([[cx + sign * 0.008, yy, top + 0.0145], [cx + sign * 0.038, yy, top + 0.0075]], "#8A7A5A", 0.45), opacity: 0.8 });
    }
  }
  shapes.push(
    line([[cx + 0.006, cy + 0.03, top + 0.015], [cx + 0.01, cy + 0.04, top - 0.01], [cx + 0.008, cy + 0.04, top - 0.05]], CRIMSON, 1),
    ball([cx + 0.008, cy + 0.04, top - 0.052], 0.28, PALE_GILT[1]),
  );
  return shapes;
}

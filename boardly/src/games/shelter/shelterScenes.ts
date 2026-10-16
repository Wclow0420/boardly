// Shelter's pictures, drawn with the shared isometric kit
// (components/iso) in the engraved style: the log cabin the survivors
// hole up in through the winter, and the places they scavenge
// (scenes/places.ts).
//
// The house is one room on its plinth, snow banked against it: log walls,
// the barricaded front door in the left wall, a frosted window in the
// right, the larder rack along the right wall — stocked with as much food
// as the storeroom really holds — the fire pit in the middle with the pot
// over it, and bedding on the left. The larder, the door and the beds are
// the night posts, and the player taps them to choose. The front of the
// floor (x + y > 1.3) stays clear for the pawns.

import {
  INK,
  P,
  WALL,
  WOOD,
  ball,
  box,
  candle,
  cylinder,
  flame,
  flat,
  hoop,
  inkOf,
  lightPool,
  line,
  live,
  moonShaft,
  n,
  onX,
  onY,
  poly,
  setInk,
  steam,
  tone,
  withView,
  type Effect,
  type Pt,
  type RoomInk,
  type Shape,
  type Tones,
  type V3,
  type View,
} from "@/components/iso/kit";
import {
  BASE,
  THICK,
  disc,
  pawn,
  pawnTop,
  roomOutline,
  setExits,
  shell,
  table,
  tint,
} from "@/components/iso/room";
import { BRASS, IRONWORK, barrel, jar, shelfX } from "@/components/iso/furniture";
import type { Post } from "./logic";
import {
  CHAR,
  EMBER,
  END_GRAIN,
  PINE_BOARD,
  SNOW,
  axeOnWall,
  baguette,
  cheese,
  crate,
  lantern,
  logAt,
  logPile,
  loaf,
  mound,
  sack,
  snowBankX,
  snowBankY,
  snowCap,
  snowshoeOnWall,
  softBox,
  stone,
  tin,
} from "./scenes/pieces";

export { PLACE_HEIGHT, PLACE_WIDTH, placeScene } from "./scenes/places";

export const SCENE_WIDTH = 190;
export const SCENE_HEIGHT = 208;
const SCENE_VIEW: View = { scale: 100, cx: 95, cy: 92 };

/** Honey-coloured logs, a worn plank floor. */
const SHELTER_INK: RoomInk = {
  floor: "#6E5036",
  line: "#3A2A1C",
  lit: "#94704A",
  shade: "#6E5136",
  tile: "#7A5A3E",
};
/** The stones the cabin is set on. */
const FOUNDATION: Tones = ["#8E887C", "#6E695F", "#4E4A43"];
/** Mattress ticking. */
const TICKING: Tones = ["#F1E8D2", "#D8CCB0", "#B4A684"];
/** The light between the logs. */
const CHINK = "#D9C49A";
const NO_DOORS = { left: null, right: null, frontRight: null, frontLeft: null };

export interface ShelterScene {
  shapes: Shape[];
  effects: Effect[];
  /** Where each night post is touched: a circle in the drawing. */
  posts: Record<Post, { x: number; y: number; r: number }>;
  /** Where a pawn stands at each post (floor points). */
  stands: Record<Post, [number, number]>;
}

// ── the cabin itself ────────────────────────────────────────────────

/** Round logs up both back walls, chinked between, each lit along its
 *  top; their sawn ends stand out of the walls' front edges. */
function logWalls(): Shape[] {
  const shapes: Shape[] = [];
  const ink = SHELTER_INK;
  const count = 9;
  const z0 = 0.04;
  const step = (WALL - z0) / count;
  // across a course in the drawing, top to bottom: square to the wall's run
  const across = { x: [0.5, 0.866], y: [-0.5, 0.866] } as const;
  for (const wall of ["x", "y"] as const) {
    const base = wall === "x" ? ink.shade : ink.lit;
    const on = wall === "x" ? onX : onY;
    for (let i = 0; i < count; i++) {
      const a = z0 + i * step;
      const b = a + step;
      const fill = tone(base, (((i * 37) % 5) - 2) * 0.03);
      const [fx, fy] = P(...((wall === "x" ? [0, 0.5, b] : [0.5, 0, b]) as V3));
      const deep = step * 100 * 0.95;
      shapes.push({
        ...on(0, 0, 1, a + 0.003, b - 0.003, fill),
        stroke: tone(base, -0.6),
        strokeWidth: 0.45,
        grad: {
          colors: [tone(fill, 0.22), fill, tone(fill, -0.38)],
          from: [fx, fy],
          to: [fx + across[wall][0] * deep, fy + across[wall][1] * deep],
        },
      });
    }
  }
  for (let i = 0; i <= count; i++) {
    const z = z0 + i * step;
    shapes.push({ ...line([[0, 1, z], [0, 0, z], [1, 0, z]], CHINK, 0.7), opacity: 0.55 });
    if (i < count) {
      shapes.push({ ...line([[0, 1, z + step * 0.72], [0, 0, z + step * 0.72], [1, 0, z + step * 0.72]], "#FFFFFF", 0.45), opacity: 0.22 });
    }
  }
  // knots in the wood
  for (const [wall, u, k] of [["x", 0.16, 6], ["x", 0.72, 2], ["x", 0.9, 5], ["y", 0.3, 7], ["y", 0.58, 1], ["y", 0.95, 4]] as const) {
    const z = z0 + (k + 0.45) * step;
    shapes.push({ ...ball(wall === "x" ? [0.002, u, z] : [u, 0.002, z], 0.5, tone(SHELTER_INK.lit, -0.5)), opacity: 0.7 });
  }
  // the log ends at the walls' front edges
  for (let i = 0; i < count; i++) {
    const z = z0 + (i + 0.5) * step;
    const r = step * 0.5;
    shapes.push(
      ...logAt([-THICK / 2, 0.99, z], [-THICK / 2, 1.025, z], r, { detail: false }),
      ...logAt([0.99, -THICK / 2, z], [1.025, -THICK / 2, z], r, { detail: false }),
    );
  }
  // snow lying along the cut tops of the walls
  shapes.push(...snowCap(-THICK - 0.004, -THICK, THICK + 0.008, 1 + THICK + 0.02, WALL, 0.022));
  shapes.push(...snowCap(0, -THICK - 0.004, 1 + 0.02, THICK + 0.008, WALL, 0.022));
  return shapes;
}

/** Stonework round the plinth's two front faces. */
function foundation(): Shape[] {
  const shapes: Shape[] = [];
  const mid = -BASE / 2;
  for (let i = 0; i < 9; i++) {
    const u = -THICK + 0.06 + i * 0.12;
    const lower = i % 2 ? 0.05 : 0;
    for (const [z1, z2, off] of [[-BASE, mid, lower], [mid, 0, 0.05 - lower]] as const) {
      if (u + off < 1) {
        shapes.push(line([[1, u + off, z1], [1, u + off, z2]], tone(FOUNDATION[2], -0.4), 0.45));
        shapes.push(line([[u + off, 1, z1], [u + off, 1, z2]], tone(FOUNDATION[1], -0.45), 0.45));
      }
    }
  }
  return shapes;
}

/** Snow banked up against the plinth, deepest at the front corner. */
function drifts(): Shape[] {
  return [
    ...snowBankX(1, 0.1, 1, -BASE, 0.045, 0.035),
    ...snowBankY(1, 0.1, 1, -BASE, 0.045, 0.035),
  ];
}

/** Floorboards along x: every other one a shade lighter, butt joints
 *  staggered. */
function floorboards(): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < 8; i++) {
    if (i % 2) shapes.push(tint([[0, i / 8, 0], [1, i / 8, 0], [1, (i + 1) / 8, 0], [0, (i + 1) / 8, 0]], "#FFE0B0", 0.05));
  }
  for (let i = 1; i < 8; i++) shapes.push(line([[0, i / 8, 0], [1, i / 8, 0]], SHELTER_INK.line, 0.55));
  for (let i = 0; i < 8; i++) {
    for (const x of i % 2 ? [0.3, 0.78] : [0.14, 0.56]) {
      shapes.push(line([[x, i / 8, 0], [x, (i + 1) / 8, 0]], SHELTER_INK.line, 0.5));
    }
  }
  return shapes;
}

/** A woven rug on the floor before the fire, from (x0, y0) to (x1, y1):
 *  a red field with bands across it, a cream diamond in the middle, and
 *  a fringe at each end. */
function rug(x0: number, y0: number, x1: number, y1: number): Shape[] {
  const field = "#7A2E32";
  const z = 0.002;
  const ym = (y0 + y1) / 2;
  const xm = (x0 + x1) / 2;
  const shapes: Shape[] = [
    tint([[x0 + 0.02, y0 + 0.02, 0], [x1 + 0.03, y0 + 0.02, 0], [x1 + 0.03, y1 + 0.01, 0], [x0 + 0.02, y1 + 0.01, 0]], INK.night, 0.25),
    { ...flat(x0, x1, y0, y1, z, field, inkOf(field)), grad: { colors: [tone(field, 0.18), field, tone(field, -0.25)], from: P(x0, y0, 0), to: P(x1, y1, 0) } },
  ];
  // bands across the rug near each end
  for (const [f, fill, wide] of [[0.08, "#C9973E", 0.03], [0.16, "#2C3A60", 0.02], [0.84, "#2C3A60", 0.02], [0.92, "#C9973E", 0.03]] as const) {
    const x = x0 + (x1 - x0) * f;
    shapes.push(flat(x - wide / 2, x + wide / 2, y0 + 0.01, y1 - 0.01, z, fill, tone(fill, -0.4)));
  }
  // the diamond, a smaller one inside it
  const dx = (x1 - x0) * 0.24;
  const dy = (y1 - y0) * 0.36;
  shapes.push(
    poly([[xm - dx, ym, z], [xm, ym - dy, z], [xm + dx, ym, z], [xm, ym + dy, z]], "#E3D3AE", "#8A6A44"),
    poly([[xm - dx * 0.55, ym, z], [xm, ym - dy * 0.55, z], [xm + dx * 0.55, ym, z], [xm, ym + dy * 0.55, z]], "#46587E", "#1E2A44"),
    poly([[xm - dx * 0.2, ym, z], [xm, ym - dy * 0.2, z], [xm + dx * 0.2, ym, z], [xm, ym + dy * 0.2, z]], "#C9973E", "#6A4A1E"),
  );
  // the fringe at each end
  for (const [x, dir] of [[x0, -1], [x1, 1]] as const) {
    shapes.push({ ...line(Array.from({ length: 9 }, (_, i) => y0 + 0.015 + ((y1 - y0 - 0.03) * i) / 8).flatMap((y, i) => [[x, y, z], [x + dir * (i % 2 ? 0.022 : 0.016), y + 0.004, z]] as V3[]), "#E3D3AE", 0.5), opacity: 0.9 });
  }
  return shapes;
}

// ── the larder ──────────────────────────────────────────────────────

const RACK = { x0: 0.09, x1: 0.55, y0: 0.02, y1: 0.16, h: 0.64 };
const SHELVES = [0.05, 0.25, 0.45];
const SLOTS = 4;
const SHELF_SLOTS = SHELVES.length * SLOTS;

/** What stands in each place on the larder rack, bottom shelf first,
 *  left to right: sacks and apples below, tins and jars, then bread and
 *  cheese at the top. */
const GOODS: ((x: number, y: number, z: number) => Shape[])[] = [
  (x, y, z) => sack(x, y, z, 0.12),
  (x, y, z) => crate(x - 0.04, y - 0.045, z, 0.08, 0.09, 0.06, ["#C8323A", "#E0503C", "#A82A30"]),
  (x, y, z) => sack(x, y, z, 0.11, ["#FFFFFF", "#F1EADA", "#C9BC9C"], "#5A6FA8"),
  (x, y, z) => [...tin(x - 0.022, y - 0.012, z, 0.021, 0.06, "#C8323A"), ...tin(x + 0.022, y + 0.016, z, 0.021, 0.06, "#3E7A56")],
  (x, y, z) => jar(x, y, z, 0.027, 0.075, "#A8283A"),
  (x, y, z) => [...tin(x, y, z, 0.024, 0.052, "#D9A95B"), ...tin(x, y, z + 0.052, 0.024, 0.052, "#5A6FA8")],
  (x, y, z) => jar(x, y, z, 0.027, 0.085, "#5E8A3A"),
  (x, y, z) => cheese(x, y, z, 0.036, 0.042),
  (x, y, z) => loaf(x, y, z, 0.036),
  (x, y, z) => jar(x, y, z, 0.025, 0.07, "#E0A030"),
  (x, y, z) => [...tin(x - 0.022, y - 0.012, z, 0.021, 0.06, "#46587E"), ...tin(x + 0.022, y + 0.016, z, 0.021, 0.06, "#C9973E")],
  (x, y, z) => baguette(x - 0.045, y + 0.015, z, 0.09, 0.017),
];

/** The larder rack along the right wall: a dark plank back, uprights,
 *  three shelves, holding `food` goods (one to a place); more than it
 *  holds stands on the floor beside it. */
function larder(food: number): Shape[] {
  const { x0, x1, y0, y1, h } = RACK;
  const depth = y1 - y0;
  const post = 0.024;
  const back = "#3A2A1E";
  const shapes: Shape[] = [
    tint([[x0 + 0.02, y0 + 0.03, 0], [x1 + 0.06, y0 + 0.03, 0], [x1 + 0.06, y1 + 0.02, 0], [x0 + 0.02, y1 + 0.02, 0]], INK.night, 0.3),
    { ...onY(0.003, x0, x1, 0, h, back), grad: { colors: [tone(back, 0.1), back, tone(back, -0.3)], from: P(x0, 0, h), to: P(x1, 0, 0) } },
    ...[0.2, 0.4, 0.6, 0.8].map((f) => line([[x0 + (x1 - x0) * f, 0.003, 0], [x0 + (x1 - x0) * f, 0.003, h]], tone(back, -0.5), 0.5)),
    // open sides: a post at each corner
    ...box(x0, y0, 0, post, post, h, WOOD),
    ...box(x0, y1 - post, 0, post, post, h, WOOD),
    ...box(x1 - post, y0, 0, post, post, h, WOOD),
  ];
  const width = (x1 - x0 - post * 2) / SLOTS;
  let placed = 0;
  SHELVES.forEach((z, row) => {
    shapes.push(...box(x0 + post, y0, z, x1 - x0 - post * 2, depth, 0.018, WOOD));
    for (let slot = 0; slot < SLOTS; slot++) {
      if (placed >= Math.min(food, SHELF_SLOTS)) break;
      const x = x0 + post + width * (slot + 0.5);
      shapes.push(...GOODS[row * SLOTS + slot](x, y0 + depth * 0.5, z + 0.018));
      placed += 1;
    }
  });
  shapes.push(
    ...box(x1 - post, y1 - post, 0, post, post, h, WOOD),
    ...box(x0 - 0.012, y0 - 0.006, h, x1 - x0 + 0.024, depth + 0.012, 0.022, WOOD),
  );
  // an empty larder gathers cobwebs
  if (food <= 0) shapes.push(...cobweb(x0 + post, SHELVES[2] + 0.19, 0.08));
  // more than the rack holds: sacks and a crate on the floor beside it
  const over = Math.max(0, food - SHELF_SLOTS);
  if (over > 0) shapes.push(...sack(0.61, 0.1, 0, 0.15));
  if (over > 4) shapes.push(...crate(0.67, 0.04, 0, 0.12, 0.12, 0.1, ["#C9973E", "#B4683C", "#D9B060"]));
  if (over > 8) shapes.push(...sack(0.75, 0.21, 0, 0.13, ["#FFFFFF", "#F1EADA", "#C9BC9C"], "#9A3A3A"));
  return shapes;
}

/** A cobweb in a top corner on the right wall's plane, at (x, z), `r`
 *  across: threads fanning down and to the right, joined in sagging
 *  rings. */
function cobweb(x: number, z: number, r: number): Shape[] {
  const at = (a: number, rr: number): V3 => [x + Math.cos(a) * rr, 0.006, z - Math.sin(a) * rr];
  const spokes = [0, 0.4, 0.8, 1.2, 1.57];
  const silk = "#E8EEF6";
  const shapes: Shape[] = spokes.map((a) => ({ ...line([at(a, 0), at(a, r)], silk, 0.35), opacity: 0.6 }));
  for (const f of [0.35, 0.65, 0.95]) {
    shapes.push({ ...line(spokes.map((a, i) => at(a, r * f * (i % 2 ? 0.9 : 1))), silk, 0.35), opacity: 0.55 });
  }
  return shapes;
}

// ── the walls' furnishings ──────────────────────────────────────────

/** A board nailed across a wall at x = at: from (u1, z1) to (u2, z2) in
 *  the wall's plane, `w` wide, a nail at each end. */
function boardAcross(at: number, u1: number, z1: number, u2: number, z2: number, w: number, fill: string): Shape[] {
  const len = Math.hypot(u2 - u1, z2 - z1);
  const [pu, pz] = [(-(z2 - z1) / len) * (w / 2), ((u2 - u1) / len) * (w / 2)];
  const pts: V3[] = [
    [at, u1 + pu, z1 + pz],
    [at, u2 + pu, z2 + pz],
    [at, u2 - pu, z2 - pz],
    [at, u1 - pu, z1 - pz],
  ];
  // its thickness, showing along the lower edge
  const edge: V3[] = [pts[3], pts[2], [at - 0.012, pts[2][1], pts[2][2]], [at - 0.012, pts[3][1], pts[3][2]]];
  const nail = (u: number, z: number) => ball([at + 0.002, u, z], 0.55, IRONWORK[0], IRONWORK[2]);
  const du = (u2 - u1) / len;
  const dz = (z2 - z1) / len;
  return [
    poly(edge, tone(fill, -0.35)),
    { ...poly(pts, fill), grad: { colors: [tone(fill, 0.25), fill, tone(fill, -0.25)], from: P(...pts[0]), to: P(...pts[3]) } },
    { ...line([[at, u1 + du * 0.02, z1 + dz * 0.02], [at, u2 - du * 0.02, z2 - dz * 0.02]], tone(fill, -0.35), 0.4), opacity: 0.6 },
    nail(u1 + du * 0.025, z1 + dz * 0.025),
    nail(u2 - du * 0.025, z2 - dz * 0.025),
  ];
}

/** The front door in the left wall, boarded up and barred: what the
 *  Infected opens at night. Snow has blown in under it. */
function boardedDoor(): Shape[] {
  const [a, b] = [0.38, 0.62];
  const h = 0.52;
  const shapes: Shape[] = [onX(0, a, b, 0, h, "#120C08")];
  // the door's own planks, weathered
  const planks = 4;
  for (let i = 0; i < planks; i++) {
    const u1 = a + ((b - a) * i) / planks;
    const u2 = a + ((b - a) * (i + 1)) / planks;
    const fill = tone("#6E5034", ((i * 3) % 4) * 0.04 - 0.04);
    shapes.push({
      ...onX(0.003, u1 + 0.002, u2 - 0.002, 0.006, h - 0.004, fill),
      grad: { colors: [tone(fill, 0.2), fill, tone(fill, -0.3)], from: P(0, u2, h), to: P(0, u1, 0) },
    });
  }
  // iron strap hinges, and the cold showing under the door
  for (const z of [0.09, 0.41]) {
    shapes.push(
      { ...onX(0.005, a + 0.004, a + 0.17, z, z + 0.024, IRONWORK[1]), grad: { colors: [IRONWORK[0], IRONWORK[1], IRONWORK[2]], from: P(0, a, z + 0.024), to: P(0, a, z) } },
      ball([0.006, a + 0.06, z + 0.012], 0.5, IRONWORK[0]),
      ball([0.006, a + 0.13, z + 0.012], 0.5, IRONWORK[0]),
    );
  }
  shapes.push({ ...line([[0.006, a + 0.01, 0.004], [0.006, b - 0.01, 0.004]], "#BFD8FF", 0.9), opacity: 0.85 });
  // the frame: posts and a heavy lintel
  shapes.push(
    ...box(0, a - 0.045, 0, 0.024, 0.045, h, WOOD),
    ...box(0, b, 0, 0.024, 0.045, h, WOOD),
    ...box(0, a - 0.06, h, 0.03, b - a + 0.12, 0.05, WOOD),
  );
  // boards nailed across, the bar in its brackets
  shapes.push(
    ...boardAcross(0.036, a - 0.03, 0.1, b + 0.03, 0.42, 0.05, PINE_BOARD[1]),
    ...boardAcross(0.042, a - 0.03, 0.42, b + 0.03, 0.1, 0.05, PINE_BOARD[0]),
    ...box(0.024, a - 0.05, 0.215, 0.034, 0.03, 0.07, IRONWORK),
    ...box(0.024, b + 0.02, 0.215, 0.034, 0.03, 0.07, IRONWORK),
    ...box(0.046, a - 0.075, 0.232, 0.03, b - a + 0.15, 0.034, IRONWORK),
  );
  // snow blown in under it
  shapes.push(...mound([0.06, 0.45, 0], 0.07, 0.03), ...mound([0.07, 0.55, 0], 0.06, 0.022));
  for (const [x, y] of [[0.14, 0.42], [0.12, 0.6], [0.18, 0.52]]) shapes.push(ball([x, y, 0], 0.5, SNOW[0]));
  return shapes;
}

/** The frosted window in the right wall: a night of hills and pines and
 *  a moon through four panes, frost in their corners, a timber frame,
 *  snow on the sill, curtains on a rod, and moonlight falling in. */
function frostedWindow(): Shape[] {
  const [a, b, z0, z1] = [0.64, 0.88, 0.3, 0.56];
  const mid = (a + b) / 2;
  const zm = (z0 + z1) / 2;
  const glass = 0.002;
  const sky = "#1A2A50";
  const shapes: Shape[] = [
    { ...onY(glass, a, b, z0, z1, sky), grad: { colors: ["#0C1430", sky, "#3C5590"], from: P(mid, 0, z1), to: P(mid, 0, z0) } },
    ball([a + 0.17, glass, z1 - 0.06], 1.5, "#F6F0D2"),
    ...[[a + 0.04, z1 - 0.04], [a + 0.09, z1 - 0.09], [b - 0.03, z1 - 0.12]].map(([u, z]) => ball([u, glass, z], 0.35, "#E8EEFF")),
  ];
  // far hills, and pines on them
  const hill: V3[] = [[a, glass, z0], [a, glass, z0 + 0.07], [a + 0.06, glass, z0 + 0.1], [a + 0.13, glass, z0 + 0.075], [b - 0.05, glass, z0 + 0.11], [b, glass, z0 + 0.09], [b, glass, z0]];
  shapes.push({ ...poly(hill, "#B9C8E2"), grad: { colors: ["#E6EEFA", "#B9C8E2", "#8A9CC0"], from: P(a, 0, z0 + 0.11), to: P(a, 0, z0) } });
  for (const [u, base, tall] of [[a + 0.035, z0 + 0.06, 0.09], [a + 0.075, z0 + 0.07, 0.12], [b - 0.07, z0 + 0.08, 0.1]]) {
    shapes.push(poly([[u - 0.018, glass, base], [u + 0.018, glass, base], [u, glass, base + tall]], "#1D2B48", "#121A30"));
  }
  // frost creeping in from the corners of each pane
  for (const [u, z, du, dz] of [[a, z0, 1, 1], [b, z0, -1, 1], [a, zm, 1, 1], [b, zm, -1, 1], [a, z1, 1, -1], [b, z1, -1, -1]]) {
    shapes.push(
      tint([[u, glass, z], [u + du * 0.06, glass, z], [u + du * 0.02, glass, z + dz * 0.02], [u, glass, z + dz * 0.05]], "#FFFFFF", 0.5),
    );
  }
  // the frame and its cross
  shapes.push(
    ...box(a - 0.028, 0, z0, 0.028, 0.03, z1 - z0, WOOD),
    ...box(mid - 0.007, 0, z0, 0.014, 0.016, z1 - z0, WOOD),
    ...box(a, 0, zm - 0.007, b - a, 0.016, 0.014, WOOD),
    ...box(b, 0, z0, 0.028, 0.03, z1 - z0, WOOD),
    ...box(a - 0.04, 0, z1, b - a + 0.08, 0.036, 0.034, WOOD),
    ...box(a - 0.045, 0, z0 - 0.03, b - a + 0.09, 0.056, 0.03, WOOD),
    ...snowCap(a - 0.04, 0.004, b - a + 0.08, 0.05, z0, 0.016),
    ...mound([a + 0.04, 0.03, z0 + 0.006], 0.03, 0.022),
  );
  // curtains on a rod, tied back
  const rodZ = z1 + 0.075;
  shapes.push(line([[a - 0.08, 0.03, rodZ], [b + 0.08, 0.03, rodZ]], IRONWORK[0], 1.1));
  const curtain = (outer: number, inner: number): Shape[] => {
    const tie = outer + (inner - outer) * 0.35;
    const pts: V3[] = [
      [outer, 0.032, rodZ],
      [inner, 0.032, rodZ],
      [tie + (inner - outer) * 0.1, 0.032, z0 + 0.1],
      [outer + (inner - outer) * 0.55, 0.032, z0 - 0.06],
      [outer, 0.032, z0 - 0.07],
    ];
    const fill = "#8E3B3F";
    const sx = Math.sign(inner - outer);
    return [
      { ...poly(pts, fill), grad: { colors: [tone(fill, 0.25), fill, tone(fill, -0.4)], from: P(Math.min(outer, inner), 0, rodZ), to: P(Math.max(outer, inner), 0, z0) } },
      ...[0.3, 0.6].map((f) => ({ ...line([[outer + (inner - outer) * f, 0.033, rodZ - 0.01], [outer + (tie - outer) * f + sx * 0.004, 0.033, z0 + 0.1], [outer + (inner - outer) * 0.5 * f, 0.033, z0 - 0.06]], tone(fill, -0.45), 0.45), opacity: 0.8 })),
      line([[tie - sx * 0.012, 0.034, z0 + 0.11], [tie + sx * 0.03, 0.034, z0 + 0.1]], "#D9A95B", 1),
    ];
  };
  shapes.push(...curtain(a - 0.075, a + 0.01), ...curtain(b + 0.075, b - 0.01));
  // moonlight on the floor, and the shaft it comes down
  const pool: V3[] = [[a, 0.06, 0], [b, 0.06, 0], [b + 0.12, 0.44, 0], [a + 0.12, 0.44, 0]];
  shapes.push(tint(pool, "#BFD8FF", 0.08), ...moonShaft([[a, 0, z1], [b, 0, z1]], [pool[2], pool[3]], "#BFD8FF"));
  return shapes;
}

/** A calendar on the right wall, the days to the rescue crossed off. */
function calendar(x: number, z: number): Shape[] {
  const [w, h] = [0.07, 0.11];
  const shapes: Shape[] = [
    { ...onY(0.004, x, x + w, z, z + h, INK.paper), grad: { colors: ["#FFFFFF", INK.paper, "#C9BC9C"], from: P(x, 0, z + h), to: P(x + w, 0, z) } },
    onY(0.005, x, x + w, z + h - 0.025, z + h, "#9A3A3A"),
    ball([x + w / 2, 0.006, z + h + 0.005], 0.5, IRONWORK[0]),
  ];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const u = x + 0.012 + col * 0.02;
      const zz = z + h - 0.042 - row * 0.024;
      if (row * 3 + col < 7) {
        shapes.push(line([[u, 0.006, zz], [u + 0.012, 0.006, zz + 0.014]], "#B8323A", 0.55), line([[u, 0.006, zz + 0.014], [u + 0.012, 0.006, zz]], "#B8323A", 0.55));
      } else {
        shapes.push(ball([u + 0.006, 0.006, zz + 0.007], 0.3, "#8A7A5A"));
      }
    }
  }
  return shapes;
}

// ── on the floor ────────────────────────────────────────────────────

/** A snow shovel leaning in the back corner. */
function shovel(): Shape[] {
  const blade: V3[] = [[0.02, 0.05, 0.004], [0.075, 0.07, 0.004], [0.07, 0.12, 0.1], [0.018, 0.105, 0.1]];
  return [
    ...logAt([0.012, 0.092, 0.6], [0.045, 0.09, 0.09], 0.008, { bark: ["#C49A62", "#A47A48", "#6A4A2A"], detail: false }),
    { ...poly(blade, "#9AA4B4"), grad: { colors: ["#E4E9F0", "#9AA4B4", "#5A6474"], from: P(0.02, 0.05, 0.1), to: P(0.075, 0.12, 0) }, stroke: "#1E242C" },
    { ...line([[0.024, 0.104, 0.095], [0.068, 0.118, 0.095]], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

/** The fire pit: a ring of field stones round a bed of embers, charred
 *  logs crossed in it, the fire, and an iron pot hung from a tripod of
 *  poles, steaming. */
function firePit(accent: string): Shape[] {
  const [x, y] = [0.42, 0.46];
  const R = 0.1;
  const stones = Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2 + 0.2;
    return { at: [x + R * Math.cos(t), y + R * Math.sin(t), 0.012] as V3, r: 0.026 + ((i * 5) % 3) * 0.004, depth: Math.cos(t) + Math.sin(t) };
  }).sort((p, q) => p.depth - q.depth);
  const apex: V3 = [x, y, 0.45];
  const feet = [200, 320, 80]
    .map((deg) => (deg * Math.PI) / 180)
    .map((t) => [x + 0.16 * Math.cos(t), y + 0.16 * Math.sin(t), 0] as V3)
    .sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  const pole = (foot: V3) => logAt(foot, apex, 0.008, { bark: ["#A07A50", "#7A5A3A", "#4E3826"], detail: false });
  const potZ = 0.18;
  const potR = 0.055;
  const [pcx, pcy] = P(x, y, potZ + 0.08);
  const rx = potR * 100 * 1.2247;
  return [
    disc(x + 0.03, y + 0.02, 0, R + 0.04, INK.night, undefined, 0.3),
    { ...disc(x, y, 0.003, R * 0.95, "#2A1E18"), grad: { colors: ["#7A3A1C", "#3A2418", "#1E140E"], from: P(x, y, 0), radius: R * 120 } },
    ...stones.filter((s) => s.depth < 0).flatMap((s) => stone(s.at, s.r)),
    ...logAt([x - 0.07, y - 0.015, 0.022], [x + 0.06, y + 0.02, 0.03], 0.019, { bark: CHAR, cut: EMBER }),
    ...logAt([x + 0.012, y - 0.07, 0.03], [x - 0.012, y + 0.065, 0.04], 0.018, { bark: CHAR, cut: EMBER }),
    ...[[-0.03, 0.03], [0.03, -0.03], [0.0, 0.045], [0.045, 0.01]].map(([dx, dy]) => ball([x + dx, y + dy, 0.012], 0.7, "#FF8A3D", "#9A3A16")),
    ...flame([x - 0.015, y, 0.045], 2.6, accent),
    ...flame([x + 0.025, y + 0.015, 0.045], 2.1, accent),
    ...flame([x + 0.004, y - 0.025, 0.045], 1.7, accent),
    ...lightPool([x, y, 0], 0.62),
    ...stones.filter((s) => s.depth >= 0).flatMap((s) => stone(s.at, s.r)),
    // the tripod's two back poles, the chain, the pot, the front pole
    ...pole(feet[0]),
    ...pole(feet[1]),
    line([apex, [x, y, potZ + 0.12]], IRONWORK[0], 0.8),
    { ...line([apex, [x, y, potZ + 0.12]], IRONWORK[2], 0.5), dash: "1 1" },
    ...cylinder(x, y, potZ, potR, 0.08, IRONWORK),
    hoop(x, y, potZ + 0.07, potR, IRONWORK[0]),
    disc(x, y, potZ + 0.081, potR * 0.8, "#8A5A2E", "#3A2414"),
    ball([x - 0.012, y, potZ + 0.083], 0.5, "#C9973E"),
    ball([x + 0.015, y + 0.01, potZ + 0.083], 0.45, "#7FA36B"),
    { d: `M${n(pcx - rx)} ${n(pcy)} Q${n(pcx)} ${n(pcy - 9)} ${n(pcx + rx)} ${n(pcy)}`, stroke: IRONWORK[0], strokeWidth: 0.7 },
    ...steam([x, y, potZ + 0.09], 0.22, 0.38),
    ...pole(feet[2]),
    ball(apex, 0.9, "#C4A46C", "#5A3A1E"),
  ];
}

/** A bed on the floor along x from the left wall: a pallet, a ticking
 *  mattress, a plump pillow, and a quilt of `patches` over its foot. */
function bed(y0: number, patches: string[], border: string): Shape[] {
  const [x0, x1] = [0.03, 0.31];
  const d = 0.13;
  const top = 0.058;
  const qx = x0 + 0.1;
  const shapes: Shape[] = [
    tint([[x0 + 0.02, y0 + 0.03, 0], [x1 + 0.04, y0 + 0.03, 0], [x1 + 0.04, y0 + d + 0.01, 0], [x0 + 0.02, y0 + d + 0.01, 0]], INK.night, 0.3),
    ...box(x0, y0, 0, x1 - x0, d, 0.022, WOOD),
    ...box(x0 + 0.004, y0 + 0.004, 0.022, x1 - x0 - 0.008, d - 0.008, 0.03, TICKING),
    ...[0.3, 0.55].map((f) => ({ ...line([[x0 + 0.01, y0 + d * f, 0.052], [qx, y0 + d * f, 0.052]], "#7A8AA8", 0.5), opacity: 0.7 })),
    // the pillow
    ...softBox(x0 + 0.012, y0 + 0.014, 0.05, 0.065, d - 0.028, 0.032, "#F1EADA"),
    // the quilt, its sheet turned down at the top
    ...box(qx, y0 - 0.004, 0.04, x1 - qx + 0.008, d + 0.008, top - 0.04, [border, border, tone(border, -0.25)]),
  ];
  const cols = 3;
  const rows = 2;
  const w = (x1 - qx - 0.012) / cols;
  const pd = (d - 0.004) / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const fill = patches[(c + r * 2) % patches.length];
      const u = qx + 0.02 + c * w;
      const v = y0 + 0.002 + r * pd;
      shapes.push(flat(u, u + w - 0.004, v, v + pd - 0.004, top + 0.0005, fill, tone(fill, -0.45)));
    }
  }
  shapes.push(
    flat(qx, qx + 0.018, y0 - 0.004, y0 + d + 0.004, top + 0.0005, "#F4EEDF", "#B4A684"),
    { ...line([[qx + 0.02, y0 + d / 2, top + 0.001], [x1, y0 + d / 2, top + 0.001]], "#F4EEDF", 0.4), dash: "0.8 0.9", opacity: 0.8 },
  );
  return shapes;
}

/** Over the beds: a little shelf with a candle and a mug, and a pair of
 *  snowshoes crossed on the wall. */
function bedWall(accent: string): Shape[] {
  return [
    ...snowshoeOnWall("x", 0.9, 0.5, 0.1, 0.042, 1.1),
    ...snowshoeOnWall("x", 0.9, 0.5, 0.1, 0.042, 2.05),
    ...shelfX(0.7, 0.83, 0.36, 0.06),
    ...candle(0.03, 0.735, 0.378, 0.05, accent),
    ...cylinder(0.03, 0.78, 0.378, 0.016, 0.03, ["#E8EEF6", "#46587E", "#2C3A60"]),
    ...box(0.012, 0.8, 0.378, 0.04, 0.02, 0.05, ["#C9973E", "#7A2E32", "#57232A"]),
  ];
}

/** The table under the window: a map with the convoy's road marked, the
 *  wireless they listen to, a lantern, a mug; a stump to sit on. */
function tableSet(accent: string): Shape[] {
  const [x, y, w, d, h] = [0.64, 0.24, 0.22, 0.18, 0.2];
  const z = h + 0.001;
  const map: V3[] = [[x + 0.03, y + 0.03, z], [x + 0.15, y + 0.025, z], [x + 0.155, y + 0.13, z], [x + 0.035, y + 0.135, z]];
  const radio: Tones = ["#9A8662", "#6E5E40", "#4A3E2A"];
  return [
    // the stump
    { ...disc(0.6, 0.33, 0, 0.045, INK.night, undefined, 0.3) },
    ...cylinder(0.585, 0.32, 0, 0.036, 0.11, [END_GRAIN[1], "#6E4E34", "#4A3426"]),
    disc(0.585, 0.32, 0.11, 0.02, undefined, END_GRAIN[2], 0.8, 0.45),
    ...table(x, y, w, d, h),
    { ...poly(map, INK.paper), grad: { colors: ["#FFFFFF", INK.paper, "#C9BC9C"], from: P(...map[0]), to: P(...map[2]) } },
    { ...line([[x + 0.05, y + 0.12, z], [x + 0.08, y + 0.08, z], [x + 0.1, y + 0.09, z], [x + 0.13, y + 0.045, z]], "#B8323A", 0.7), dash: "1.2 0.9" },
    line([[x + 0.122, y + 0.038, z], [x + 0.138, y + 0.052, z]], "#B8323A", 0.8),
    line([[x + 0.122, y + 0.052, z], [x + 0.138, y + 0.038, z]], "#B8323A", 0.8),
    { ...line([[x + 0.04, y + 0.06, z], [x + 0.07, y + 0.05, z], [x + 0.09, y + 0.065, z]], "#8A7A5A", 0.4), opacity: 0.7 },
    { ...line([[x + 0.06, y + 0.11, z], [x + 0.1, y + 0.115, z], [x + 0.14, y + 0.1, z]], "#46587E", 0.5), opacity: 0.8 },
    // the wireless
    ...box(x + 0.15, y + 0.03, z, 0.06, 0.07, 0.065, radio),
    ...[0.018, 0.03, 0.042].map((dz) => line([[x + 0.158, y + 0.1, z + dz], [x + 0.185, y + 0.1, z + dz]], "#2A2216", 0.5)),
    ball([x + 0.197, y + 0.1, z + 0.035], 0.8, BRASS[1], BRASS[2]),
    ball([x + 0.197, y + 0.1, z + 0.054], 0.4, "#E0503C"),
    line([[x + 0.2, y + 0.04, z + 0.065], [x + 0.17, y + 0.02, z + 0.2]], IRONWORK[0], 0.6),
    ...lantern(x + 0.04, y + 0.155, z, 0.075, accent),
    ...cylinder(x + 0.19, y + 0.15, z, 0.016, 0.028, ["#E8EEF6", "#3E7A56", "#2B5742"]),
  ];
}

/** A rain barrel by the window, its lid on, a ladle hung on its rim. */
function waterBarrel(): Shape[] {
  const [x, y] = [0.93, 0.1];
  return [
    ...barrel(x, y, 0.052, 0.17),
    ...cylinder(x, y, 0.17, 0.056, 0.012, WOOD),
    line([[x - 0.02, y + 0.04, 0.18], [x - 0.03, y + 0.06, 0.1]], IRONWORK[0], 0.8),
  ];
}

/** The shelter as it stands tonight, holding `food` in its storeroom. */
export function shelterScene(food: number, accent: string): ShelterScene {
  return withView(SCENE_VIEW, () => {
    setInk(SHELTER_INK);
    setExits(NO_DOORS);
    const { drawing, effects } = live(() => [
      ...shell(FOUNDATION, { panelled: false }),
      ...foundation(),
      ...drifts(),
      ...logWalls(),
      ...floorboards(),
      ...rug(0.5, 0.58, 0.9, 0.86),
      // on the walls
      ...frostedWindow(),
      ...calendar(0.925, 0.42),
      ...axeOnWall("x", 0.33, 0.5, 0.18, 0.52),
      ...boardedDoor(),
      ...bedWall(accent),
      // on the floor, back to front
      ...shovel(),
      ...larder(food),
      ...logPile(0.02, 0.18, 0.17, 3, 3, 0.03),
      ...firePit(accent),
      ...tableSet(accent),
      ...waterBarrel(),
      ...bed(0.64, ["#7A2E32", "#C9973E", "#46587E", "#E3D3AE"], "#5A3A2A"),
      ...bed(0.82, ["#3E7A56", "#E3D3AE", "#9A3A3A", "#C9973E"], "#2C3A60"),
    ]);
    const spot = (at: V3, r: number) => {
      const [x, y] = P(...at);
      return { x, y, r };
    };
    return {
      shapes: drawing,
      effects,
      posts: {
        store: spot([0.28, 0.1, 0.32], 20),
        door: spot([0, 0.5, 0.26], 17),
        sleep: spot([0.25, 0.8, 0.04], 18),
      },
      stands: { store: [0.32, 0.3], door: [0.14, 0.5], sleep: [0.33, 0.72] },
    };
  });
}

/** Where a floor point lands in the shelter's drawing. */
export function shelterPoint(x: number, y: number, z = 0): Pt {
  return withView(SCENE_VIEW, () => P(x, y, z));
}

/** A watcher standing on a floor point of the shelter's drawing. */
export function shelterPawn(spot: [number, number], fill: string, edge: string): Shape[] {
  return withView(SCENE_VIEW, () => pawn(spot, fill, edge));
}

/** The top of a pawn's head in the shelter's drawing, for its name. */
export function shelterPawnTop(spot: [number, number]): Pt {
  return withView(SCENE_VIEW, () => pawnTop(spot));
}

/** The shelter's outline, for laying the night over it. */
export const shelterOutline = () => withView(SCENE_VIEW, roomOutline);


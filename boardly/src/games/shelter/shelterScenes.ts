// Shelter's pictures, drawn with the shared isometric kit
// (components/iso): the house the survivors hole up in, and the three
// places they scavenge.
//
// The house is one room on its plinth: the barricaded front door in the
// left wall, a frosted window in the right, the storeroom shelves along
// the right wall — stocked with as much food as the storeroom really
// holds — the fire pit in the middle and bedrolls on the left. Those
// three are the night posts (storeroom, door, bed), and the player taps
// them to choose. The front of the floor stays clear for the pawns.

import {
  GOLD,
  INK,
  STONE,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  flame,
  flat,
  lightPool,
  line,
  live,
  onX,
  onY,
  poly,
  setInk,
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
  CLOTH,
  IRON,
  WAX,
  drum,
  pawn,
  pawnTop,
  planks,
  roomOutline,
  setExits,
  shell,
  solid,
  windowOn,
} from "@/components/iso/room";
import type { Place, Post } from "./logic";

export const SCENE_WIDTH = 190;
export const SCENE_HEIGHT = 208;
const SCENE_VIEW: View = { scale: 100, cx: 95, cy: 92 };

/** Cold walls, a worn wooden floor. */
const SHELTER_INK: RoomInk = {
  floor: "#4A3B2E",
  line: "#6A5644",
  lit: "#3A4256",
  shade: "#2C3345",
  tile: "#55463A",
};

/** Tins, sacks and jars on the shelves, in turn. */
const GOODS: { color: string; height: number }[] = [
  { color: "#C9A25A", height: 0.09 },
  { color: "#D8CCB0", height: 0.12 },
  { color: "#8E3B3F", height: 0.08 },
  { color: "#7FA36B", height: 0.1 },
];
const SHELF_SLOTS = 12;
const NO_DOORS = { left: null, right: null, frontRight: null, frontLeft: null };

export interface ShelterScene {
  shapes: Shape[];
  effects: Effect[];
  /** Where each night post is touched: a circle in the drawing. */
  posts: Record<Post, { x: number; y: number; r: number }>;
  /** Where a pawn stands at each post (floor points). */
  stands: Record<Post, [number, number]>;
}

/** The front door, boarded up: what the Infected opens at night. */
function frontDoor(): Shape[] {
  const [a, b] = [0.38, 0.62];
  const h = 0.52;
  const shapes: Shape[] = [
    onX(0, a - 0.035, b + 0.035, 0, h + 0.035, STONE[1]),
    onX(0, a, b, 0, h, WOOD[1], WOOD[2]),
  ];
  for (const at of [0.44, 0.5, 0.56]) {
    shapes.push(line([[0, at, 0], [0, at, h]], WOOD[2]));
  }
  shapes.push(
    // planks nailed across, and the iron bar
    line([[0, a - 0.02, 0.1], [0, b + 0.02, 0.4]], WOOD[0], 3),
    line([[0, a - 0.02, 0.4], [0, b + 0.02, 0.1]], WOOD[0], 3),
    onX(0, a - 0.05, b + 0.05, 0.22, 0.27, IRON[1], INK.line),
    ball([0, 0.5, 0.245], 1.1, STONE[0], INK.line)
  );
  return shapes;
}

/** Shelves along the right wall, stocked with `food` goods. */
function storeroom(food: number): Shape[] {
  const shapes: Shape[] = [...solid(0.06, 0.02, 0.46, 0.14, 0.62, WOOD)];
  const rows = [0.04, 0.24, 0.44];
  let placed = 0;
  for (const z of rows) {
    shapes.push(onY(0.16, 0.09, 0.49, z + 0.012, z + 0.18, "#2A2018", WOOD[2]));
    shapes.push(onY(0.16, 0.08, 0.5, z, z + 0.012, WOOD[0], WOOD[2]));
  }
  // bottom shelf first, left to right
  for (const z of rows) {
    for (let slot = 0; slot < 4; slot++) {
      if (placed >= Math.min(food, SHELF_SLOTS)) break;
      const good = GOODS[(placed + rows.indexOf(z)) % GOODS.length];
      const x = 0.11 + slot * 0.095;
      shapes.push(onY(0.16, x, x + 0.07, z + 0.012, z + 0.012 + good.height, good.color, INK.iron));
      shapes.push(line([[x, 0.16, z + 0.05], [x + 0.07, 0.16, z + 0.05]], "#00000044", 0.6));
      placed += 1;
    }
  }
  shapes.push(...box(0.05, 0.02, 0.62, 0.48, 0.15, 0.02, WOOD));
  // more than the shelves hold: crates on the floor beside them
  const crates = Math.min(2, Math.ceil(Math.max(0, food - SHELF_SLOTS) / 6));
  for (let i = 0; i < crates; i++) {
    const x = 0.54 + i * 0.16;
    shapes.push(
      ...solid(x, 0.04, 0.13, 0.13, 0.12, WOOD),
      line([[x, 0.17, 0.06], [x + 0.13, 0.17, 0.06]], WOOD[2])
    );
  }
  return shapes;
}

/** Firewood stacked in the back corner. */
function woodpile(): Shape[] {
  const shapes: Shape[] = [...solid(0.03, 0.2, 0.14, 0.15, 0.05, WOOD)];
  for (const [z, y0] of [[0.05, 0.21], [0.1, 0.22]] as [number, number][]) {
    shapes.push(...box(0.04, y0, z, 0.12, 0.12, 0.05, WOOD));
  }
  for (const y of [0.24, 0.28, 0.32]) {
    shapes.push(ball([0.16, y, 0.125], 1.3, "#B58C5E", WOOD[2]));
  }
  return shapes;
}

/** The fire pit, a kettle over it on a tripod. */
function firePit(accent: string): Shape[] {
  const [x, y] = [0.42, 0.46];
  return [
    ...drum(x, y, 0.11, 0.04, STONE),
    ...cylinder(x, y, 0.04, 0.08, 0.002, [INK.night, INK.night, INK.night]),
    line([[x - 0.06, y, 0.045], [x + 0.06, y + 0.02, 0.05]], WOOD[1], 2),
    line([[x, y - 0.06, 0.045], [x + 0.02, y + 0.06, 0.05]], WOOD[1], 2),
    ...flame([x - 0.02, y, 0.05], 2.8, accent),
    ...flame([x + 0.03, y + 0.01, 0.05], 2.2, accent),
    ...lightPool([x, y, 0], 0.62),
    line([[x - 0.12, y - 0.04, 0], [x, y, 0.36]], IRON[1], 1),
    line([[x + 0.1, y - 0.06, 0], [x, y, 0.36]], IRON[1], 1),
    line([[x, y + 0.12, 0], [x, y, 0.36]], IRON[1], 1),
    line([[x, y, 0.36], [x, y, 0.24]], IRON[1], 0.8),
    ...cylinder(x, y, 0.16, 0.045, 0.08, [STONE[2], IRON[1], IRON[1]]),
  ];
}

/** Two bedrolls with their pillows. */
function bedrolls(): Shape[] {
  const roll = (x: number, color: Tones): Shape[] => [
    flat(x, x + 0.13, 0.62, 0.95, 0, color[1], color[2]),
    line([[x, 0.74, 0.002], [x + 0.13, 0.74, 0.002]], color[2]),
    line([[x, 0.84, 0.002], [x + 0.13, 0.84, 0.002]], color[2]),
    ...box(x + 0.015, 0.63, 0, 0.1, 0.07, 0.035, WAX),
  ];
  return [...roll(0.08, CLOTH), ...roll(0.25, ["#5A6FA8", "#3E4F80", "#2C3A60"])];
}

/** The shelter as it stands tonight, holding `food` in its storeroom. */
export function shelterScene(food: number, accent: string): ShelterScene {
  return withView(SCENE_VIEW, () => {
    setInk(SHELTER_INK);
    setExits(NO_DOORS);
    const { drawing, effects } = live(() => [
      ...shell(STONE),
      ...planks(),
      ...frontDoor(),
      ...windowOn("y", 0.62, 0.88, 0.3, 0.5, false, "#1B2440", "#BFD8FF"),
      ...[0.67, 0.74, 0.8, 0.85].map((x, i) => ball([x, 0, 0.36 + (i % 2) * 0.08], 0.5, "#E8EEFF")),
      ...storeroom(food),
      ...woodpile(),
      ...firePit(accent),
      ...bedrolls(),
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

// ------------------------------------------------------------- places

export const PLACE_WIDTH = 120;
export const PLACE_HEIGHT = 110;
const PLACE_VIEW: View = { scale: 66, cx: 60, cy: 26 };

const SNOW_GROUND: Tones = ["#E8EEF6", "#B8C4D6", "#8E9CB4"];
const BARN: Tones = ["#A8494B", "#8E3B3F", "#6E2C31"];
const CONCRETE: Tones = ["#8C93A6", "#6E7588", "#565C6E"];
const CLINIC: Tones = ["#F1F0EA", "#D6D3C8", "#B8B4A8"];

/** A gabled roof over a box, its ridge along x. */
function roof(x: number, y: number, w: number, d: number, z: number, rise: number, tones: Tones): Shape[] {
  const ridge = y + d / 2;
  return [
    poly([[x, ridge, z + rise], [x + w, ridge, z + rise], [x + w, y + d, z], [x, y + d, z]], tones[1]),
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, ridge, z + rise]], tones[2]),
    poly([[x, y, z], [x + w, y, z], [x + w, ridge, z + rise], [x, ridge, z + rise]], tones[0]),
  ];
}

const tile = (): Shape[] => [
  ...box(0, 0, -0.08, 1, 1, 0.08, SNOW_GROUND),
  flat(0.04, 0.96, 0.04, 0.96, 0, "#F4F7FB", "#D6DEEA"),
];

function farm(): Shape[] {
  const shapes: Shape[] = [...tile()];
  for (const y of [0.62, 0.72, 0.82]) {
    shapes.push(line([[0.5, y, 0.002], [0.92, y, 0.002]], "#9BA9BF", 1.4));
  }
  shapes.push(...box(0.12, 0.1, 0, 0.42, 0.34, 0.3, BARN));
  shapes.push(onY(0.44, 0.27, 0.39, 0, 0.2, "#5A2328", INK.line));
  shapes.push(...roof(0.1, 0.08, 0.46, 0.38, 0.3, 0.16, ["#F4F7FB", "#C9D3E2", "#A6B2C6"]));
  shapes.push(...cylinder(0.72, 0.28, 0, 0.1, 0.12, GOLD));
  shapes.push(ball([0.72, 0.28, 0.17], 3.4, "#F4F7FB"));
  for (const x of [0.06, 0.3, 0.54, 0.78]) {
    shapes.push(...box(x, 0.94, 0, 0.03, 0.03, 0.12, WOOD));
  }
  shapes.push(line([[0.07, 0.955, 0.09], [0.8, 0.955, 0.09]], WOOD[0], 1.2));
  return shapes;
}

function market(): Shape[] {
  return [
    ...tile(),
    ...box(0.1, 0.08, 0, 0.62, 0.42, 0.42, CONCRETE),
    onY(0.5, 0.16, 0.66, 0.32, 0.4, "#E8803C", INK.line),
    onY(0.5, 0.16, 0.38, 0.04, 0.26, "#1B2440", INK.line),
    onY(0.5, 0.44, 0.62, 0.04, 0.26, "#1B2440", INK.line),
    line([[0.2, 0.5, 0.06], [0.33, 0.5, 0.22]], "#BFD8FF", 0.8),
    line([[0.5, 0.5, 0.2], [0.58, 0.5, 0.08]], "#BFD8FF", 0.8),
    ...box(0.08, 0.06, 0.42, 0.66, 0.46, 0.03, ["#F4F7FB", "#C9D3E2", "#A6B2C6"]),
    ...solid(0.7, 0.64, 0.14, 0.14, 0.12, WOOD),
    ...solid(0.56, 0.74, 0.12, 0.12, 0.1, WOOD),
    line([[0.3, 0.7, 0.12], [0.42, 0.7, 0.12], [0.44, 0.78, 0.04]], IRON[1], 1),
    ball([0.33, 0.71, 0.02], 1, IRON[1]),
    ball([0.42, 0.71, 0.02], 1, IRON[1]),
  ];
}

function hospital(): Shape[] {
  return [
    ...tile(),
    ...box(0.12, 0.1, 0, 0.6, 0.42, 0.5, CLINIC),
    onY(0.52, 0.37, 0.47, 0.18, 0.4, "#D94A4A"),
    onY(0.52, 0.31, 0.53, 0.25, 0.33, "#D94A4A"),
    onY(0.52, 0.18, 0.28, 0, 0.2, "#5A6FA8", INK.line),
    onX(0.72, 0.18, 0.34, 0.24, 0.38, "#1B2440", INK.line),
    ...box(0.1, 0.08, 0.5, 0.64, 0.46, 0.03, ["#F4F7FB", "#C9D3E2", "#A6B2C6"]),
    ...solid(0.62, 0.66, 0.26, 0.14, 0.12, CLINIC),
    onY(0.8, 0.7, 0.76, 0.03, 0.09, "#D94A4A"),
  ];
}

const PLACE_BUILDERS: Record<Place, () => Shape[]> = { farm, market, hospital };

/** A small snowy picture of a place to scavenge. */
export function placeScene(place: Place): Shape[] {
  return withView(PLACE_VIEW, () => PLACE_BUILDERS[place]());
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

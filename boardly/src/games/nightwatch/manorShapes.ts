// The manor as one connected isometric cutaway: nine rooms on a shared
// floor, tall walls along the two far sides, low walls with door gaps
// between neighbours, and a few solid furnishings in each room. Drawn
// with the shared kit (components/iso/kit.ts); ManorMap shows it. The
// rooms on their own, in full detail, are built in roomScenes.ts.

import {
  BOOKS,
  GOLD,
  INK,
  LEAF,
  LOCK,
  STONE,
  WALL,
  WALLS,
  WOOD,
  CARPET,
  DOOR,
  P,
  arch,
  ball,
  box,
  candle,
  cylinder,
  flame,
  flat,
  hoop,
  k,
  line,
  moon,
  n,
  onX,
  onY,
  paint,
  path,
  setInk,
  setOrigin,
  setView,
  unit,
  withView,
  type Door,
  type Pt,
  type RoomInk,
  type Shape,
  type Tones,
  type View,
} from "@/components/iso/kit";
import { ROOMS, type RoomId } from "./logic";

export type { Door, Pt, Shape, Tones, V3 } from "@/components/iso/kit";

/** How a room's floor is marked (selected, tonight's mission, ...). */
export interface Tint {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  dash?: string;
}

export const MANOR_WIDTH = 300;
export const MANOR_HEIGHT = 226;

export const SCENE_WIDTH = 190;
export const SCENE_HEIGHT = 208;

/** Units per room and where the back corner sits. */
const MANOR_VIEW: View = { scale: 54, cx: 150, cy: 50 };
const SCENE_VIEW: View = { scale: 100, cx: 95, cy: 92 };
const LOW = 0.2;
const THICK = 0.05;

/** The map's cell being drawn: its doors and floor marking. */
let cell = {
  col: 0,
  row: 0,
  doorX: "open" as Door,
  doorY: "open" as Door,
  tint: null as Tint | null,
};

/** Every room is painted in its own colour (see ROOM_COLOR in logic.ts
 *  for the bright version its name is written in), so a room is known
 *  on the map before its name is read. Kept dark: it is night. */
export const ROOM_INK: Record<RoomId, RoomInk> = {
  belltower: { floor: "#7A5514", line: "#A37622", lit: "#644510", shade: "#4F360C", tile: "#8C631A" },
  study: { floor: "#3A6C9E", line: "#5F94C8", lit: "#2F5A85", shade: "#25486B", tile: "#4579AE" },
  chapel: { floor: "#8B8C96", line: "#A9AAB4", lit: "#74757F", shade: "#5F606A", tile: "#9A9BA5" },
  gallery: { floor: "#43306E", line: "#5C4496", lit: "#37285B", shade: "#2B1F49", tile: "#4F3982" },
  hall: { floor: "#5E2529", line: "#84383D", lit: "#4C1E22", shade: "#3C171B", tile: "#702E33" },
  dining: { floor: "#6E3518", line: "#964B24", lit: "#592A13", shade: "#47210F", tile: "#803F1D" },
  cellar: { floor: "#26282E", line: "#3A3D45", lit: "#1E2025", shade: "#17191D", tile: "#2E3037" },
  kitchen: { floor: "#7D6F55", line: "#9A8B6E", lit: "#665A45", shade: "#524837", tile: "#8B7C60" },
  garden: { floor: "#22382F", line: "#2D4A3D", lit: "#22382F", shade: "#1B2C25", tile: "#2D4A3D" },
};

/** Paints the rooms that follow in a room's own colours. */
export function paintAs(room: RoomId) {
  setInk(ROOM_INK[room]);
}

/** A low wall (or hedge) along one of the room's two far edges, with
 *  its doorway: open, locked, or walled up. */
function lowWall(axis: "x" | "y", door: Door, tones: Tones = WALLS, height = LOW): Shape[] {
  const piece = (from: number, to: number, t: Tones, h: number, thick: number) =>
    axis === "x"
      ? box(-thick / 2, from, 0, thick, to - from, h, t)
      : box(from, -thick / 2, 0, to - from, thick, h, t);
  if (door === "shut") return piece(0, 1, tones, height, THICK);
  return [
    ...piece(0, DOOR[0], tones, height, THICK),
    ...(door === "locked" ? piece(DOOR[0], DOOR[1], LOCK, height * 0.85, THICK / 2) : []),
    ...piece(DOOR[1], 1, tones, height, THICK),
  ];
}

/** The floor's marking, if this room has one. */
function floorTint(): Shape[] {
  const tint = cell.tint;
  if (!tint) return [];
  const m = 0.05;
  const d = path([P(m, m), P(1 - m, m), P(1 - m, 1 - m), P(m, 1 - m)]);
  return [
    ...(tint.fill ? [{ d, fill: tint.fill, opacity: tint.fillOpacity ?? 0.3 }] : []),
    ...(tint.stroke ? [{ d, stroke: tint.stroke, strokeWidth: 1.4, dash: tint.dash }] : []),
  ];
}

/** Whether the room's far-left / far-right wall stands full height. */
const tallX = () => cell.col === 0;
const tallY = () => cell.row === 0;

/** Floor and walls: tall along the manor's far sides, low elsewhere. */
function shell(planks = true): Shape[] {
  const shapes: Shape[] = [];
  if (tallX()) shapes.push(onX(0, 0, 1, 0, WALL, paint().shade));
  if (tallY()) shapes.push(onY(0, 0, 1, 0, WALL, paint().lit));
  shapes.push(flat(0, 1, 0, 1, 0, paint().floor));
  if (planks) {
    for (const y of [0.25, 0.5, 0.75]) {
      shapes.push(line([[0, y, 0], [1, y, 0]], paint().line));
    }
  }
  shapes.push(...floorTint());
  if (!tallX()) shapes.push(...lowWall("x", cell.doorX));
  if (!tallY()) shapes.push(...lowWall("y", cell.doorY));
  return shapes;
}

/** Courses of stone on the room's tall walls. */
function courses(): Shape[] {
  const shapes: Shape[] = [];
  for (const z of [0.2, 0.4, 0.6]) {
    if (tallX()) shapes.push(line([[0, 1, z], [0, 0, z]], paint().line));
    if (tallY()) shapes.push(line([[0, 0, z], [1, 0, z]], paint().line));
  }
  return shapes;
}

function belltower(accent: string): Shape[] {
  const [bx, by] = P(0.5, 0.34, 0.36);
  const s = 7 * k();
  return [
    ...shell(),
    ...courses(),
    arch("x", 0.3, 0.7, 0.18, 0.44, INK.night),
    arch("y", 0.3, 0.7, 0.18, 0.44, INK.night),
    moon(P(0.5, 0, 0.5)[0] + 1, P(0.5, 0, 0.5)[1], 2.6),
    // headstock frame: back post, bell, beam, front post
    ...box(0.16, 0.3, 0, 0.06, 0.08, 0.66, WOOD),
    line([[0.5, 0.34, 0.66], [0.5, 0.34, 0.56]], WOOD[0], 1),
    {
      d: `M${n(bx - s * 0.95)} ${n(by + s)} Q${n(bx - s * 0.8)} ${n(by - s * 0.1)} ${n(bx - s * 0.4)} ${n(by - s * 0.75)} Q${n(bx)} ${n(by - s * 1.15)} ${n(bx + s * 0.4)} ${n(by - s * 0.75)} Q${n(bx + s * 0.8)} ${n(by - s * 0.1)} ${n(bx + s * 0.95)} ${n(by + s)} Z`,
      fill: accent,
      stroke: GOLD[2],
      strokeWidth: 0.5,
    },
    {
      d: `M${n(bx - s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx + s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx - s * 0.95)} ${n(by + s)} Z`,
      fill: GOLD[2],
    },
    ball([0.5, 0.34, 0.36 - (s + 1.6 * k()) / unit()], 1.5, GOLD[0]),
    ...box(0.16, 0.3, 0.66, 0.68, 0.08, 0.07, WOOD),
    ...box(0.78, 0.3, 0, 0.06, 0.08, 0.66, WOOD),
    // the bell rope, down to the floor
    line([[0.62, 0.4, 0.66], [0.62, 0.4, 0.04]], INK.paper, 0.7),
  ];
}

function study(accent: string): Shape[] {
  const shapes: Shape[] = [
    ...shell(),
    // bookcase against the right wall
    ...box(0.08, 0.02, 0, 0.56, 0.14, 0.7, WOOD),
  ];
  for (const [row, z] of [0.06, 0.28, 0.5].entries()) {
    shapes.push(onY(0.16, 0.11, 0.61, z, z + 0.17, INK.iron, WOOD[2]));
    for (let i = 0; i < 9; i++) {
      const x = 0.12 + i * 0.054;
      const tall = 0.1 + ((i * 7 + row * 3) % 5) * 0.014;
      shapes.push(onY(0.16, x, x + 0.045, z, z + tall, BOOKS[(i + row * 2) % BOOKS.length], INK.iron));
    }
  }
  shapes.push(
    // desk with an open scroll and a candle
    ...box(0.66, 0.2, 0, 0.26, 0.2, 0.22, WOOD),
    flat(0.7, 0.84, 0.23, 0.35, 0.222, INK.paper, "#B3AB95"),
    ...candle(0.87, 0.26, 0.22, 0.09, accent)
  );
  return shapes;
}

function chapel(accent: string): Shape[] {
  return [
    ...shell(false),
    arch("y", 0.14, 0.3, 0.3, 0.44, INK.glass, true),
    arch("y", 0.7, 0.86, 0.3, 0.44, INK.glass, true),
    // altar with its cloth, a cross and two candles
    ...box(0.32, 0.05, 0, 0.36, 0.17, 0.26, STONE),
    flat(0.32, 0.68, 0.05, 0.22, 0.262, INK.paper, "#B3AB95"),
    ...box(0.485, 0.11, 0.26, 0.03, 0.03, 0.34, GOLD),
    ...box(0.42, 0.11, 0.46, 0.16, 0.03, 0.035, GOLD),
    ...candle(0.37, 0.15, 0.26, 0.1, accent),
    ...candle(0.63, 0.15, 0.26, 0.1, accent),
    // one pew facing the altar
    ...box(0.3, 0.44, 0, 0.4, 0.08, 0.09, WOOD),
    ...box(0.3, 0.52, 0, 0.4, 0.025, 0.17, WOOD),
  ];
}

function gallery(accent: string): Shape[] {
  const frame = (y1: number, y2: number, z1: number, z2: number, canvas: string) => [
    onX(0, y1, y2, z1, z2, GOLD[1], GOLD[2]),
    onX(0, y1 + 0.03, y2 - 0.03, z1 + 0.03, z2 - 0.03, canvas, GOLD[2]),
  ];
  return [
    ...shell(),
    line([[0, 1, 0.24], [0, 0, 0.24]], paint().line),
    ...frame(0.08, 0.3, 0.38, 0.64, LEAF[2]),
    ...frame(0.38, 0.72, 0.32, 0.7, "#2A3152"),
    ...frame(0.8, 0.94, 0.4, 0.6, INK.redDark),
    // a moonlit landscape in the big frame
    ball([0, 0.48, 0.58], 1.8, accent),
    line([[0, 0.66, 0.44], [0, 0.58, 0.52], [0, 0.5, 0.44], [0, 0.44, 0.49]], INK.glass, 0.7),
    // plinth with a bust
    ...box(0.16, 0.2, 0, 0.14, 0.14, 0.26, STONE),
    ...box(0.195, 0.235, 0.26, 0.07, 0.07, 0.06, [INK.paper, "#CFC7B0", "#B3AB95"]),
    ball([0.23, 0.27, 0.4], 2.6, INK.paper, "#B3AB95"),
  ];
}

function hall(accent: string): Shape[] {
  return [
    ...shell(false),
    // checkered floor
    ...[0, 1, 2, 3].flatMap((i) =>
      [0, 1, 2, 3]
        .filter((j) => (i + j) % 2 === 0)
        .map((j) => flat(i * 0.25, i * 0.25 + 0.25, j * 0.25, j * 0.25 + 0.25, 0, paint().tile, paint().line))
    ),
    // carpet runner from door to door
    flat(0.4, 0.6, 0.04, 0.96, 0, CARPET.fill, CARPET.edge),
    flat(0.04, 0.96, 0.4, 0.6, 0, CARPET.fill, CARPET.edge),
    // candle stand
    ...cylinder(0.2, 0.2, 0, 0.05, 0.03, [INK.iron, INK.iron, INK.iron]),
    ...box(0.188, 0.188, 0.03, 0.024, 0.024, 0.34, [GOLD[2], GOLD[2], GOLD[2]]),
    ...cylinder(0.2, 0.2, 0.37, 0.07, 0.02, GOLD),
    ...flame([0.15, 0.2, 0.4], 2.2, accent),
    ...flame([0.25, 0.2, 0.4], 2.2, accent),
    ...flame([0.2, 0.2, 0.43], 2.4, accent),
  ];
}

function dining(accent: string): Shape[] {
  const plate: Tones = [INK.paper, "#CFC7B0", "#B3AB95"];
  return [
    ...shell(),
    // the long table, laid, with a bottle and a candle
    ...box(0.2, 0.16, 0, 0.04, 0.04, 0.2, WOOD),
    ...box(0.76, 0.16, 0, 0.04, 0.04, 0.2, WOOD),
    ...box(0.2, 0.36, 0, 0.04, 0.04, 0.2, WOOD),
    ...box(0.76, 0.36, 0, 0.04, 0.04, 0.2, WOOD),
    ...box(0.16, 0.12, 0.2, 0.68, 0.32, 0.04, WOOD),
    flat(0.2, 0.8, 0.22, 0.34, 0.242, INK.redDark, INK.red),
    ...cylinder(0.3, 0.28, 0.24, 0.045, 0.006, plate),
    ...cylinder(0.7, 0.28, 0.24, 0.045, 0.006, plate),
    ...cylinder(0.58, 0.24, 0.24, 0.025, 0.09, LEAF),
    ...candle(0.46, 0.28, 0.24, 0.09, accent),
  ];
}

function cellar(accent: string): Shape[] {
  const barrel = (x: number, y: number, z = 0): Shape[] => [
    ...cylinder(x, y, z, 0.12, 0.3, WOOD),
    hoop(x, y, z + 0.07, 0.12, INK.iron),
    hoop(x, y, z + 0.23, 0.12, INK.iron),
  ];
  const shapes: Shape[] = [
    ...shell(false),
    ...courses(),
  ];
  // brick joints, staggered course by course
  for (const [row, z] of [0, 0.2, 0.4, 0.6].entries()) {
    for (let a = row % 2 ? 0.125 : 0.25; a < 1; a += 0.25) {
      shapes.push(line([[0, a, z], [0, a, z + 0.2]], paint().line));
    }
  }
  shapes.push(
    // flagstones
    line([[0, 0.5, 0], [1, 0.5, 0]], paint().line),
    line([[0.5, 0, 0], [0.5, 1, 0]], paint().line),
    // barrels along the left wall, one with a lantern on it
    ...barrel(0.16, 0.18),
    ...barrel(0.16, 0.48),
    ...barrel(0.42, 0.2),
    ...flame([0.42, 0.2, 0.3], 2.4, accent)
  );
  return shapes;
}

function kitchen(accent: string): Shape[] {
  return [
    ...shell(),
    // range in the far-right corner, with its chimney
    ...box(0.68, 0.06, 0.34, 0.24, 0.12, 0.2, STONE),
    ...box(0.66, 0.06, 0, 0.28, 0.2, 0.34, STONE),
    onY(0.262, 0.7, 0.9, 0, 0.24, INK.night, STONE[2]),
    ...flame([0.76, 0.262, 0], 2.4, accent),
    ...flame([0.84, 0.262, 0], 2.4, accent),
    ...flame([0.8, 0.262, 0], 3.4, accent),
    // cauldron on the fire
    ...cylinder(0.8, 0.34, 0.08, 0.07, 0.1, [STONE[2], INK.iron, INK.iron]),
  ];
}

function garden(accent: string): Shape[] {
  return [
    flat(0, 1, 0, 1, 0, INK.grass, INK.grassLine),
    ...floorTint(),
    // hedges for walls, with a gate towards the kitchen and the dining room
    ...lowWall("x", cell.doorX, LEAF, 0.22),
    ...lowWall("y", cell.doorY, LEAF, 0.22),
    // stepping stones between the two gates
    ...(
      [[0.12, 0.45], [0.28, 0.45], [0.45, 0.28], [0.45, 0.12]] as [number, number][]
    ).map(([x, y]) => flat(x, x + 0.1, y, y + 0.1, 0, STONE[2], INK.grassLine)),
    // tree
    ...cylinder(0.24, 0.26, 0, 0.035, 0.3, WOOD),
    ball([0.24, 0.26, 0.46], 8, LEAF[2], INK.grassLine),
    ball([0.19, 0.22, 0.53], 5.8, LEAF[1]),
    ball([0.28, 0.28, 0.57], 4.4, LEAF[0]),
    // the well
    ...cylinder(0.76, 0.3, 0, 0.12, 0.12, STONE),
    ...cylinder(0.76, 0.3, 0.115, 0.085, 0.004, [INK.night, INK.night, INK.night]),
    ball([0.74, 0.28, 0.12], 1.1, INK.glass, undefined, 0.8),
    // flowers
    ...(
      [
        [0.9, 0.6], [0.6, 0.9], [0.9, 0.9], [0.12, 0.66], [0.56, 0.1], [0.12, 0.9],
      ] as [number, number][]
    ).map(([x, y], i) => ball([x, y, 0.03], 0.9, i % 2 ? accent : INK.paper)),
  ];
}

const BUILDERS: Record<RoomId, (accent: string) => Shape[]> = {
  belltower,
  study,
  chapel,
  gallery,
  hall,
  dining,
  cellar,
  kitchen,
  garden,
};

/** A collapsed room: dark, with boards nailed across the floor. */
function rubble(): Shape[] {
  const plank = (from: Pt, to: Pt): Shape => ({
    d: path([P(from[0], from[1], 0.04), P(to[0], to[1], 0.04)], false),
    stroke: WOOD[1],
    strokeWidth: 5,
  });
  return [
    { d: path([P(0, 0), P(1, 0), P(1, 1), P(0, 1)]), fill: INK.night, opacity: 0.6 },
    plank([0.5, 0.08], [0.5, 0.92]),
    plank([0.08, 0.5], [0.92, 0.5]),
  ];
}

const COLS = 3;
const colOf = (room: number) => room % COLS;
const rowOf = (room: number) => Math.floor(room / COLS);
const at = (room: number) => {
  cell = { col: colOf(room), row: rowOf(room), doorX: "open", doorY: "open", tint: null };
  setOrigin(cell.col, cell.row);
  paintAs(ROOMS[room]);
};

/** The door between two neighbouring rooms tonight. */
export function doorBetween(
  a: number,
  b: number,
  collapsed: number[],
  lockedDoor: number[] | null
): Door {
  if (collapsed.includes(a) || collapsed.includes(b)) return "shut";
  return lockedDoor?.includes(a) && lockedDoor.includes(b) ? "locked" : "open";
}

export interface ManorOptions {
  accent: string;
  /** Rooms sealed for good. */
  collapsed: number[];
  /** The door locked for the night, as its two rooms. */
  lockedDoor: number[] | null;
  /** Secret doors joining two diagonal rooms. */
  secretDoors: number[][];
  /** Floor markings by room index. */
  tints: Record<number, Tint | undefined>;
}

/** The whole manor, back to front. */
export function manorShapes({ accent, collapsed, lockedDoor, secretDoors, tints }: ManorOptions): Shape[] {
  const door = (a: number, b: number) => doorBetween(a, b, collapsed, lockedDoor);

  setView(MANOR_VIEW);
  at(0);
  const shapes: Shape[] = box(0, 0, -0.1, COLS, COLS, 0.1, STONE);

  // rooms on one anti-diagonal never overlap, so paint diagonal by diagonal
  const order = ROOMS.map((_, room) => room).sort(
    (a, b) => colOf(a) + rowOf(a) - (colOf(b) + rowOf(b))
  );
  for (const room of order) {
    at(room);
    if (cell.col > 0) cell.doorX = door(room - 1, room);
    if (cell.row > 0) cell.doorY = door(room - COLS, room);
    cell.tint = tints[room] ?? null;
    shapes.push(...BUILDERS[ROOMS[room]](accent));
    if (collapsed.includes(room)) shapes.push(...rubble());
  }

  // a secret door: a lit trail across the corner the two rooms share
  for (const [a, b] of secretDoors) {
    at(a);
    const from = P(0.5, 0.5, 0.02);
    at(b);
    const to = P(0.5, 0.5, 0.02);
    shapes.push({ d: path([from, to], false), stroke: INK.glass, strokeWidth: 1.4, dash: "3 3" });
  }
  return shapes;
}

/** Outline of a room's floor, for touch targets. */
export function floorPath(room: number): string {
  setView(MANOR_VIEW);
  at(room);
  return path([P(0, 0), P(1, 0), P(1, 1), P(0, 1)]);
}

/** Where a point of a room's floor lands in the drawing. */
export function floorPoint(room: number, x: number, y: number, z = 0): Pt {
  setView(MANOR_VIEW);
  at(room);
  return P(x, y, z);
}

/** Draws with the single-room view: one room alone, filling the page
 *  (see roomScenes.ts). */
export function inScene<T>(draw: () => T): T {
  return withView(SCENE_VIEW, draw);
}


/** Footprints along the way a player went, room to room: `rooms` in the
 *  order they were in them. Older steps are fainter. */
export function footprints(rooms: number[], color: string): Shape[] {
  const shapes: Shape[] = [];
  const legs = rooms.length - 1;
  for (let leg = 0; leg < legs; leg++) {
    const [a, b] = [rooms[leg], rooms[leg + 1]];
    if (a === b) continue;
    const [x1, y1] = floorPoint(a, 0.5, 0.5);
    const [x2, y2] = floorPoint(b, 0.5, 0.5);
    const length = Math.hypot(x2 - x1, y2 - y1);
    // across the way, for the left and right foot
    const [nx, ny] = [-(y2 - y1) / length, (x2 - x1) / length];
    const steps = Math.floor(length / 7);
    const opacity = 0.25 + (0.6 * (leg + 1)) / legs;
    for (let i = 1; i < steps; i++) {
      const side = i % 2 ? 1.6 : -1.6;
      const [x, y] = [x1 + ((x2 - x1) * i) / steps + nx * side, y1 + ((y2 - y1) * i) / steps + ny * side];
      shapes.push({
        d: `M${n(x - 1.4)} ${n(y)}a1.4 0.9 0 1 0 2.8 0a1.4 0.9 0 1 0 -2.8 0Z`,
        fill: color,
        opacity,
      });
    }
  }
  return shapes;
}

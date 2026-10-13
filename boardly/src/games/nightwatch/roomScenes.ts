// Each room on its own, filling the page: the place the player stands
// in. It is built like a small stage set with the drawing kit of
// manorShapes.ts — a stone plinth, two thick back walls with the real
// doors to the neighbouring rooms, steps down from the two open sides,
// and the room's furniture, every piece standing on another.
//
// One thing in each room works it (the bell, the ledger, the hatch...).
// Its shapes are marked `prop` so RoomScene can move them by themselves;
// what is listed before it is drawn behind it and what comes after in
// front. The glow of every flame is marked `glow` so it can flicker.
//
// The front of the floor (x + y > 1.3) is kept clear in every room:
// that is where the watchers stand.

import { ROOMS, type RoomId } from "./logic";
import {
  BOOKS,
  CARPET,
  DOOR,
  GOLD,
  INK,
  LEAF,
  LOCK,
  STONE,
  WALL,
  WALLS,
  WOOD,
  P,
  arch,
  ball,
  box,
  candle,
  cylinder,
  doorBetween,
  flame,
  flat,
  hoop,
  inScene,
  k,
  line,
  moon,
  n,
  onX,
  onY,
  paint,
  paintAs,
  path,
  unit,
  type Door,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "./manorShapes";

export type Side = "left" | "right" | "frontRight" | "frontLeft";

/** A way out of the room, and where its name goes in the drawing. */
export interface SceneExit {
  side: Side;
  room: number;
  door: Door;
  x: number;
  y: number;
}

/** How the room's object moves when it is touched. Lengths are in
 *  drawing units. */
export type Motion =
  | { kind: "swing"; pivot: Pt; degrees: number }
  | { kind: "pop"; pivot: Pt; scale: number; lift: number }
  | { kind: "slide"; dx: number; dy: number };

export interface Scene {
  back: Shape[];
  prop: Shape[];
  front: Shape[];
  glow: Shape[];
  glow2: Shape[];
  exits: SceneExit[];
  /** The glowing spot over the room's object. */
  touch: { x: number; y: number; r: number };
  motion: Motion;
  /** A book in the room that can be opened and read, if it has one. */
  book: { x: number; y: number; r: number } | null;
}

export interface SceneOptions {
  accent: string;
  collapsed: number[];
  lockedDoor: number[] | null;
}

const BASE = 0.07;
const THICK = 0.05;
const LIGHT = "#FFE3A8";
const CLOTH: Tones = [INK.red, INK.redDark, "#57232A"];
const WAX: Tones = [INK.paper, "#CFC7B0", "#B3AB95"];
const IRON: Tones = ["#2C3454", INK.iron, INK.iron];
const EARTH: Tones = ["#3A4A3A", "#2C3B31", "#222E28"];


/** The doors of the room being drawn; null where there is no room. */
let exits: Record<Side, Door | null> = {
  left: null,
  right: null,
  frontRight: null,
  frontLeft: null,
};

const tagged = (layer: Shape["layer"], shapes: Shape[]): Shape[] =>
  shapes.map((shape) => ({ ...shape, layer }));
const prop = (shapes: Shape[]) => tagged("prop", shapes);

/** A patch of light or shadow: a filled outline with no edge. */
const tint = (pts: V3[], fill: string, opacity: number): Shape => ({
  d: path(pts.map(([x, y, z]) => P(x, y, z))),
  fill,
  opacity,
});

const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0 a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0 Z`;

/** A circle lying flat at height z. */
function disc(
  x: number,
  y: number,
  z: number,
  r: number,
  fill?: string,
  stroke?: string,
  opacity?: number,
  strokeWidth = 0.5
): Shape {
  const [cx, cy] = P(x, y, z);
  return {
    d: oval(cx, cy, r * unit() * 1.2247, r * unit() * 0.7071),
    fill,
    stroke,
    strokeWidth: stroke ? strokeWidth : undefined,
    opacity,
  };
}

/** The shadow a block throws on the floor, away from the light. */
const shadow = (x: number, y: number, w: number, d: number) =>
  tint(
    [
      [x + 0.02, y + 0.03, 0],
      [x + w + 0.05, y + 0.03, 0],
      [x + w + 0.05, y + d, 0],
      [x + 0.02, y + d, 0],
    ],
    INK.night,
    0.3
  );

/** A block standing on the floor, with its shadow. */
const solid = (x: number, y: number, w: number, d: number, h: number, tones: Tones) => [
  shadow(x, y, w, d),
  ...box(x, y, 0, w, d, h, tones),
];

/** A cylinder standing on the floor, with its shadow. */
const drum = (x: number, y: number, r: number, h: number, tones: Tones) => [
  disc(x + 0.035, y + 0.01, 0, r, INK.night, undefined, 0.3),
  ...cylinder(x, y, 0, r, h, tones),
];

/** A table on four legs. */
function table(x: number, y: number, w: number, d: number, h: number, tones: Tones = WOOD): Shape[] {
  const leg = 0.03;
  const top = 0.03;
  return [
    shadow(x, y, w, d),
    ...box(x, y, 0, leg, leg, h - top, tones),
    ...box(x + w - leg, y, 0, leg, leg, h - top, tones),
    ...box(x, y + d - leg, 0, leg, leg, h - top, tones),
    ...box(x + w - leg, y + d - leg, 0, leg, leg, h - top, tones),
    ...box(x, y, h - top, w, d, top, tones),
  ];
}

/** A chair; its back stands along the named edge of the seat. */
function chair(x: number, y: number, back: "y0" | "y1" | "x1", tones: Tones = WOOD): Shape[] {
  const rest =
    back === "y0"
      ? box(x, y, 0.12, 0.1, 0.02, 0.2, tones)
      : back === "y1"
        ? box(x, y + 0.08, 0.12, 0.1, 0.02, 0.2, tones)
        : box(x + 0.08, y, 0.12, 0.02, 0.1, 0.2, tones);
  return [...solid(x, y, 0.1, 0.1, 0.12, tones), ...rest];
}

/** A picture in a gold frame on the left wall (y, z) or the right (x, z). */
function picture(wall: "x" | "y", a1: number, a2: number, z1: number, z2: number, canvas: string): Shape[] {
  const on = wall === "x" ? onX : onY;
  return [
    on(0, a1, a2, z1, z2, GOLD[1], GOLD[2]),
    on(0, a1 + 0.025, a2 - 0.025, z1 + 0.025, z2 - 0.025, canvas, GOLD[2]),
  ];
}

/** A window in an outside wall, its sill, and the moonlight it lets in. */
function windowOn(
  wall: "x" | "y",
  from: number,
  to: number,
  z0: number,
  spring: number,
  pointed = false,
  glass: string = INK.night
): Shape[] {
  const on = wall === "x" ? onX : onY;
  const mid = (from + to) / 2;
  const top = spring + ((to - from) / 2) * (pointed ? 1.5 : 1);
  const at = (a: number, z: number): V3 => (wall === "x" ? [0, a, z] : [a, 0, z]);
  const pool: V3[] =
    wall === "x"
      ? [[0.06, from, 0], [0.06, to, 0], [0.42, to + 0.12, 0], [0.42, from + 0.12, 0]]
      : [[from, 0.06, 0], [to, 0.06, 0], [to + 0.12, 0.42, 0], [from + 0.12, 0.42, 0]];
  return [
    arch(wall, from - 0.025, to + 0.025, z0 - 0.02, spring, STONE[1], pointed),
    arch(wall, from, to, z0, spring, glass, pointed),
    line([at(mid, z0), at(mid, top)], STONE[1], 0.7),
    line([at(from, spring), at(to, spring)], STONE[1], 0.7),
    on(0, from - 0.04, to + 0.04, z0 - 0.045, z0 - 0.02, STONE[0]),
    tint(pool, INK.glass, 0.08),
  ];
}

/** A candle bracket on a wall. */
function sconce(wall: "x" | "y", a: number, z: number, accent: string): Shape[] {
  const [x, y] = wall === "x" ? [0, a - 0.015] : [a - 0.015, 0];
  return [
    ...box(x, y, z, 0.03, 0.03, 0.012, GOLD),
    ...box(x + 0.009, y + 0.009, z + 0.012, 0.012, 0.012, 0.035, WAX),
    ...flame([x + 0.015, y + 0.015, z + 0.047], 1.8, accent),
  ];
}

/** A doorway in a back wall: open, barred for the night, or walled up. */
function wallDoor(wall: "x" | "y", door: Door): Shape[] {
  const on = wall === "x" ? onX : onY;
  const at = (a: number, z: number, depth = 0): V3 =>
    wall === "x" ? [depth, a, z] : [a, depth, z];
  const [a, b] = DOOR;
  const mid = (a + b) / 2;
  const h = 0.5;
  const shapes: Shape[] = [
    on(0, a - 0.035, b + 0.035, 0, h + 0.035, STONE[1]),
    on(0, mid - 0.025, mid + 0.025, h + 0.035, h + 0.07, STONE[0]),
  ];
  if (door === "open") {
    shapes.push(
      on(0, a, b, 0, h, INK.night),
      // the thickness of the wall: the far jamb and the sill
      {
        d: path([at(a, 0, -THICK), at(a, 0), at(a, h), at(a, h, -THICK)].map((p) => P(...p))),
        fill: wall === "x" ? WALLS[1] : WALLS[2],
        stroke: INK.line,
        strokeWidth: 0.5,
      },
      {
        d: path([at(a, 0, -THICK), at(a, 0), at(b, 0), at(b, 0, -THICK)].map((p) => P(...p))),
        fill: STONE[2],
        stroke: INK.line,
        strokeWidth: 0.5,
      },
      // light from the next room, on the sill and across the floor
      tint([at(a + 0.02, 0), at(b - 0.02, 0), at(b - 0.02, h * 0.45), at(a + 0.02, h * 0.45)], LIGHT, 0.1),
      tint(
        [at(a, 0), at(b, 0), at(b + 0.07, 0, 0.32), at(a - 0.07, 0, 0.32)],
        LIGHT,
        0.09
      )
    );
  } else if (door === "locked") {
    shapes.push(on(0, a, b, 0, h, WOOD[1], WOOD[2]));
    for (const plank of [0.25, 0.5, 0.75]) {
      const at1 = a + (b - a) * plank;
      shapes.push(line([at(at1, 0), at(at1, h)], WOOD[2]));
    }
    shapes.push(
      on(0, a - 0.03, b + 0.03, 0.2, 0.25, LOCK[1], LOCK[2]),
      ball(at(mid, 0.225), 1.3, LOCK[0], LOCK[2])
    );
  } else {
    shapes.push(on(0, a, b, 0, h, paint().shade, INK.line));
    for (const z of [0.1, 0.2, 0.3, 0.4]) {
      shapes.push(line([at(a, z), at(b, z)], paint().line));
    }
    shapes.push(
      line([at(a, 0.08), at(b, 0.42)], WOOD[1], 3.2),
      line([at(a, 0.42), at(b, 0.08)], WOOD[0], 3.2)
    );
  }
  return shapes;
}

/** The plinth the room stands on, with a step down at each open side. */
function plinth(tones: Tones): Shape[] {
  const [a, b] = DOOR;
  const steps: Shape[] = [];
  if (exits.frontRight) steps.push(...box(1, a, -BASE, 0.08, b - a, BASE * 0.55, STONE));
  if (exits.frontLeft) steps.push(...box(a, 1, -BASE, b - a, 0.08, BASE * 0.55, STONE));
  return [
    tint(
      [
        [0.02, 0.02, -BASE - 0.04],
        [1.14, 0.02, -BASE - 0.04],
        [1.14, 1.14, -BASE - 0.04],
        [0.02, 1.14, -BASE - 0.04],
      ],
      "#000000",
      0.22
    ),
    ...box(-THICK, -THICK, -BASE, 1 + THICK, 1 + THICK, BASE, tones),
    line(
      [
        [1, -THICK, -BASE / 2],
        [1, 1, -BASE / 2],
        [-THICK, 1, -BASE / 2],
      ],
      INK.line
    ),
    ...steps,
  ];
}

/** A mat inside each front doorway. */
function mats(): Shape[] {
  const [a, b] = DOOR;
  return [
    ...(exits.frontRight ? [flat(0.9, 0.99, a + 0.03, b - 0.03, 0, INK.redDark, INK.red)] : []),
    ...(exits.frontLeft ? [flat(a + 0.03, b - 0.03, 0.9, 0.99, 0, INK.redDark, INK.red)] : []),
  ];
}

/** What stands across a front doorway that can't be used tonight. */
function barriers(): Shape[] {
  const [a, b] = DOOR;
  const across = (side: "frontRight" | "frontLeft", h: number, tones: Tones) =>
    side === "frontRight"
      ? box(0.975, a, 0, 0.025, b - a, h, tones)
      : box(a, 0.975, 0, b - a, 0.025, h, tones);
  return (["frontRight", "frontLeft"] as const).flatMap((side) =>
    exits[side] === "locked"
      ? across(side, 0.1, LOCK)
      : exits[side] === "shut"
        ? across(side, 0.07, WOOD)
        : []
  );
}

/** Plinth, the two thick back walls with their doors, floor and trim. */
function shell(base: Tones = STONE): Shape[] {
  const ink = paint();
  return [
    ...plinth(base),
    ...box(-THICK, -THICK, 0, THICK, 1 + THICK, WALL, [ink.line, ink.lit, ink.shade]),
    ...box(0, -THICK, 0, 1, THICK, WALL, [ink.line, ink.lit, ink.shade]),
    flat(0, 1, 0, 1, 0, ink.floor),
    // skirting and cornice
    onX(0, 0, 1, 0, 0.04, ink.lit, ink.line),
    onY(0, 0, 1, 0, 0.04, ink.tile, ink.line),
    line([[0, 1, 0.75], [0, 0, 0.75], [1, 0, 0.75]], paint().line),
    ...(exits.left ? wallDoor("x", exits.left) : []),
    ...(exits.right ? wallDoor("y", exits.right) : []),
    ...mats(),
  ];
}

/** Floorboards, with their butt joints staggered. */
function planks(): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 1; i < 8; i++) {
    shapes.push(line([[0, i / 8, 0], [1, i / 8, 0]], paint().line));
  }
  for (let i = 0; i < 8; i++) {
    for (const x of i % 2 ? [0.3, 0.78] : [0.14, 0.56]) {
      shapes.push(line([[x, i / 8, 0], [x, (i + 1) / 8, 0]], paint().line));
    }
  }
  return shapes;
}

/** Square flagstones, `count` to a side. */
function flags(count: number): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 1; i < count; i++) {
    shapes.push(
      line([[0, i / count, 0], [1, i / count, 0]], paint().line),
      line([[i / count, 0, 0], [i / count, 1, 0]], paint().line)
    );
  }
  return shapes;
}

/** Courses of stone up the two back walls. */
function courses(): Shape[] {
  return [0.2, 0.4, 0.6].map((z) =>
    line([[0, 1, z], [0, 0, z], [1, 0, z]], paint().line)
  );
}

/** Stars seen through an opening: points on a wall plane. */
const stars = (points: V3[]) => points.map((at) => ball(at, 0.45, INK.glass));

function belltower(accent: string): Shape[] {
  const [bx, by] = P(0.5, 0.34, 0.36);
  const s = 7 * k();
  const opening = (wall: "x" | "y") => [
    arch(wall, 0.27, 0.73, 0.15, 0.44, STONE[1]),
    arch(wall, 0.3, 0.7, 0.18, 0.44, INK.night),
    (wall === "x" ? onX : onY)(0, 0.26, 0.74, 0.13, 0.16, STONE[0]),
  ];
  return [
    ...shell(),
    ...planks(),
    ...courses(),
    // the belfry's two openings on the night
    ...opening("x"),
    ...opening("y"),
    moon(P(0.5, 0, 0.5)[0] + 1, P(0.5, 0, 0.5)[1], 2.6),
    ...stars([[0.38, 0, 0.36], [0.62, 0, 0.3], [0, 0.42, 0.5], [0, 0.6, 0.34], [0, 0.5, 0.26]]),
    tint([[0.3, 0.06, 0], [0.7, 0.06, 0], [0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass, 0.07),
    // a crate of candles with a lantern on it
    ...solid(0.74, 0.06, 0.18, 0.16, 0.13, WOOD),
    line([[0.74, 0.22, 0.09], [0.92, 0.22, 0.09]], WOOD[2]),
    ...box(0.8, 0.11, 0.13, 0.05, 0.05, 0.012, IRON),
    ...box(0.81, 0.12, 0.142, 0.03, 0.03, 0.05, GOLD),
    ...flame([0.825, 0.135, 0.192], 2, accent),
    // headstock frame: back post, bell, beam, front post
    ...solid(0.16, 0.3, 0.06, 0.08, 0.66, WOOD),
    line([[0.22, 0.34, 0.48], [0.36, 0.34, 0.66]], WOOD[0], 1.2),
    ...prop([
      line([[0.5, 0.34, 0.66], [0.5, 0.34, 0.56]], WOOD[0], 1.2),
      {
        d: `M${n(bx - s * 0.95)} ${n(by + s)} Q${n(bx - s * 0.8)} ${n(by - s * 0.1)} ${n(bx - s * 0.4)} ${n(by - s * 0.75)} Q${n(bx)} ${n(by - s * 1.15)} ${n(bx + s * 0.4)} ${n(by - s * 0.75)} Q${n(bx + s * 0.8)} ${n(by - s * 0.1)} ${n(bx + s * 0.95)} ${n(by + s)} Z`,
        fill: accent,
        stroke: GOLD[2],
        strokeWidth: 0.5,
      },
      {
        d: `M${n(bx + s * 0.1)} ${n(by - s * 1.0)} Q${n(bx + s * 0.75)} ${n(by - s * 0.3)} ${n(bx + s * 0.95)} ${n(by + s)} L${n(bx + s * 0.35)} ${n(by + s * 1.25)} Q${n(bx + s * 0.4)} ${n(by)} ${n(bx + s * 0.1)} ${n(by - s * 1.0)} Z`,
        fill: GOLD[2],
        opacity: 0.45,
      },
      {
        d: `M${n(bx - s * 0.62)} ${n(by + s * 0.2)} Q${n(bx)} ${n(by + s * 0.48)} ${n(bx + s * 0.78)} ${n(by + s * 0.2)}`,
        stroke: GOLD[2],
        strokeWidth: 0.5,
      },
      {
        d: `M${n(bx - s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx + s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx - s * 0.95)} ${n(by + s)} Z`,
        fill: GOLD[2],
        stroke: "#7A5A2A",
        strokeWidth: 0.5,
      },
      ball([0.5, 0.34, 0.36 - (s + 1.6 * k()) / unit()], 1.5, GOLD[0], GOLD[2]),
    ]),
    ...box(0.16, 0.3, 0.66, 0.68, 0.08, 0.07, WOOD),
    // an owl keeping watch on the beam
    ball([0.3, 0.34, 0.765], 1.5, STONE[0], INK.line),
    ball([0.293, 0.345, 0.775], 0.35, GOLD[0]),
    ball([0.307, 0.345, 0.775], 0.35, GOLD[0]),
    ...solid(0.78, 0.3, 0.06, 0.08, 0.66, WOOD),
    line([[0.78, 0.38, 0.48], [0.64, 0.38, 0.66]], WOOD[0], 1.2),
    // the bell rope, down to its coil on the floor
    ...drum(0.62, 0.42, 0.045, 0.014, WAX),
    disc(0.62, 0.42, 0.014, 0.022, undefined, "#B3AB95"),
    line([[0.62, 0.38, 0.66], [0.62, 0.42, 0.02]], INK.paper, 0.8),
    // a ladder against the wall
    line([[0.2, 0.8, 0], [0, 0.8, 0.62]], WOOD[0], 1.2),
    ...[0.12, 0.24, 0.36, 0.48].map((z) =>
      line([[0.2 - z / 3.1, 0.8, z], [0.2 - z / 3.1, 0.92, z]], WOOD[1], 0.9)
    ),
    line([[0.2, 0.92, 0], [0, 0.92, 0.62]], WOOD[0], 1.2),
  ];
}

function study(accent: string): Shape[] {
  const shapes: Shape[] = [
    ...shell(),
    ...planks(),
    ...windowOn("y", 0.72, 0.92, 0.32, 0.5),
    moon(P(0.84, 0, 0.5)[0], P(0.84, 0, 0.5)[1], 1.8),
    // bookcase against the right wall
    ...solid(0.08, 0.02, 0.56, 0.14, 0.7, WOOD),
  ];
  for (const [row, z] of [0.06, 0.28, 0.5].entries()) {
    shapes.push(onY(0.16, 0.11, 0.61, z, z + 0.17, INK.iron, WOOD[2]));
    for (let i = 0; i < 9; i++) {
      const x = 0.12 + i * 0.054;
      const tall = 0.1 + ((i * 7 + row * 3) % 5) * 0.014;
      shapes.push(
        onY(0.16, x, x + 0.045, z, z + tall, BOOKS[(i + row * 2) % BOOKS.length], INK.iron)
      );
    }
  }
  shapes.push(
    ...box(0.07, 0.02, 0.7, 0.58, 0.15, 0.02, WOOD),
    // rug, with its border
    flat(0.3, 0.66, 0.44, 0.9, 0, INK.redDark, INK.red),
    flat(0.33, 0.63, 0.47, 0.87, 0, INK.redDark, GOLD[2]),
    // a globe on its stand
    ...drum(0.44, 0.3, 0.04, 0.02, WOOD),
    ...box(0.432, 0.292, 0.02, 0.016, 0.016, 0.13, GOLD),
    ball([0.44, 0.3, 0.215], 3.2, "#3F5A8C", GOLD[1]),
    ball([0.43, 0.3, 0.225], 1.2, LEAF[1]),
    // stool and desk, the records open on it
    ...drum(0.58, 0.3, 0.045, 0.12, WOOD),
    ...solid(0.66, 0.2, 0.26, 0.2, 0.22, WOOD),
    onY(0.4, 0.69, 0.89, 0.07, 0.18, WOOD[1], WOOD[2]),
    line([[0.79, 0.4, 0.07], [0.79, 0.4, 0.18]], WOOD[2]),
    ball([0.74, 0.4, 0.125], 0.6, GOLD[0]),
    ball([0.84, 0.4, 0.125], 0.6, GOLD[0]),
    ...box(0.86, 0.33, 0.22, 0.04, 0.04, 0.03, IRON),
    ...prop([
      flat(0.69, 0.83, 0.23, 0.37, 0.224, INK.paper, "#B3AB95"),
      line([[0.76, 0.23, 0.224], [0.76, 0.37, 0.224]], "#B3AB95", 0.8),
      ...[0.26, 0.29, 0.32].flatMap((y) => [
        line([[0.7, y, 0.224], [0.745, y, 0.224]], "#8C8676"),
        line([[0.775, y, 0.224], [0.82, y, 0.224]], "#8C8676"),
      ]),
      line([[0.76, 0.37, 0.224], [0.775, 0.4, 0.224]], INK.red, 1),
    ]),
    ...candle(0.88, 0.25, 0.22, 0.09, accent),
    // reading chair and a side table
    ...solid(0.06, 0.72, 0.2, 0.2, 0.14, CLOTH),
    ...box(0.06, 0.72, 0.14, 0.05, 0.2, 0.2, CLOTH),
    ...drum(0.36, 0.86, 0.05, 0.14, WOOD),
    flat(0.33, 0.39, 0.83, 0.88, 0.141, BOOKS[3], INK.iron)
  );
  return shapes;
}

function chapel(accent: string): Shape[] {
  const pew = (x: number, y: number): Shape[] => [
    ...solid(x, y, 0.32, 0.08, 0.09, WOOD),
    ...box(x, y + 0.08, 0, 0.32, 0.025, 0.18, WOOD),
  ];
  return [
    ...shell(),
    ...flags(4),
    ...windowOn("y", 0.1, 0.26, 0.3, 0.44, true, INK.glass),
    ...windowOn("y", 0.74, 0.9, 0.3, 0.44, true, INK.glass),
    // rose window over the altar
    ball([0.5, 0, 0.66], 4.4, STONE[1], INK.line),
    ball([0.5, 0, 0.66], 3.6, INK.glass, GOLD[2]),
    line([[0.41, 0, 0.66], [0.59, 0, 0.66]], GOLD[2], 0.6),
    line([[0.5, 0, 0.57], [0.5, 0, 0.75]], GOLD[2], 0.6),
    ...sconce("x", 0.2, 0.4, accent),
    ...sconce("x", 0.8, 0.4, accent),
    // the aisle, and the altar on its dais
    flat(0.43, 0.57, 0.3, 0.99, 0, INK.redDark, INK.red),
    ...box(0.24, 0, 0, 0.52, 0.3, 0.02, STONE),
    ...box(0.32, 0.05, 0.02, 0.36, 0.17, 0.26, STONE),
    flat(0.32, 0.68, 0.05, 0.22, 0.282, INK.paper, "#B3AB95"),
    onY(0.22, 0.44, 0.56, 0.1, 0.28, INK.paper, "#B3AB95"),
    line([[0.5, 0.22, 0.14], [0.5, 0.22, 0.24]], GOLD[1], 0.9),
    line([[0.47, 0.22, 0.2], [0.53, 0.22, 0.2]], GOLD[1], 0.9),
    ...prop([
      ...box(0.485, 0.11, 0.28, 0.03, 0.03, 0.34, GOLD),
      ...box(0.42, 0.11, 0.48, 0.16, 0.03, 0.035, GOLD),
    ]),
    ...candle(0.37, 0.15, 0.28, 0.1, accent),
    ...candle(0.63, 0.15, 0.28, 0.1, accent),
    // the Chapel's record on its lectern
    ...solid(0.12, 0.34, 0.03, 0.03, 0.24, WOOD),
    ...box(0.08, 0.32, 0.24, 0.11, 0.08, 0.02, WOOD),
    flat(0.09, 0.18, 0.33, 0.39, 0.262, INK.paper, "#B3AB95"),
    line([[0.135, 0.33, 0.262], [0.135, 0.39, 0.262]], "#B3AB95"),
    ...pew(0.06, 0.44),
    ...pew(0.62, 0.44),
    ...pew(0.06, 0.66),
    // the font by the door
    ...drum(0.16, 0.9, 0.03, 0.14, STONE),
    ...cylinder(0.16, 0.9, 0.14, 0.065, 0.03, STONE),
    disc(0.16, 0.9, 0.171, 0.05, INK.glass, undefined, 0.75),
  ];
}

function gallery(accent: string): Shape[] {
  const [ix, iy] = P(0.69, 0.2, 0.25);
  const post = (y: number): Shape[] => [
    ...drum(0.14, y, 0.02, 0.01, GOLD),
    ...box(0.134, y - 0.006, 0.01, 0.012, 0.012, 0.16, GOLD),
    ball([0.14, y, 0.185], 0.9, GOLD[0], GOLD[2]),
  ];
  const rope = (y1: number, y2: number) =>
    line([[0.14, y1, 0.17], [0.14, (y1 + y2) / 2, 0.125], [0.14, y2, 0.17]], INK.red, 0.9);
  return [
    ...shell(),
    ...planks(),
    // dado and picture rail
    line([[0, 1, 0.24], [0, 0, 0.24], [1, 0, 0.24]], paint().line),
    line([[0, 1, 0.7], [0, 0, 0.7], [1, 0, 0.7]], paint().line),
    ...picture("x", 0.08, 0.3, 0.38, 0.64, LEAF[2]),
    ...picture("x", 0.38, 0.72, 0.32, 0.68, "#2A3152"),
    ...picture("x", 0.8, 0.94, 0.4, 0.6, INK.redDark),
    // a moonlit landscape in the big frame
    ball([0, 0.48, 0.58], 1.8, accent),
    line([[0, 0.68, 0.42], [0, 0.6, 0.52], [0, 0.52, 0.43], [0, 0.42, 0.5]], INK.glass, 0.7),
    ...picture("y", 0.1, 0.28, 0.38, 0.62, "#3A4A7A"),
    ball([0.19, 0, 0.52], 1.6, INK.paper, "#B3AB95"),
    ...picture("y", 0.72, 0.92, 0.4, 0.6, LEAF[2]),
    // a vase on a pedestal, and the bust
    ...solid(0.1, 0.04, 0.1, 0.1, 0.2, STONE),
    ...cylinder(0.15, 0.09, 0.2, 0.03, 0.08, [INK.glass, "#5A6FA8", "#5A6FA8"]),
    ...solid(0.16, 0.2, 0.14, 0.14, 0.26, STONE),
    ...box(0.195, 0.235, 0.26, 0.07, 0.07, 0.06, WAX),
    ball([0.23, 0.27, 0.4], 2.6, INK.paper, "#B3AB95"),
    // writing desk: paper, the letter box, and a quill in its inkwell
    ...solid(0.66, 0.14, 0.28, 0.18, 0.22, WOOD),
    onY(0.32, 0.69, 0.91, 0.08, 0.18, WOOD[1], WOOD[2]),
    ball([0.8, 0.32, 0.13], 0.6, GOLD[0]),
    flat(0.73, 0.84, 0.17, 0.29, 0.222, INK.paper, "#B3AB95"),
    ...[0.2, 0.225, 0.25].map((y) => line([[0.75, y, 0.222], [0.82, y, 0.222]], "#8C8676")),
    ...box(0.86, 0.16, 0.22, 0.07, 0.07, 0.08, GOLD),
    line([[0.875, 0.195, 0.3], [0.915, 0.195, 0.3]], "#7A5A2A", 0.9),
    ...cylinder(0.69, 0.2, 0.22, 0.018, 0.03, IRON),
    ...prop([
      { d: `M${n(ix)} ${n(iy)} L${n(ix - 5)} ${n(iy - 17)}`, stroke: INK.paper, strokeWidth: 0.7 },
      {
        d: `M${n(ix - 1.6)} ${n(iy - 5.5)} Q${n(ix - 7.5)} ${n(iy - 9)} ${n(ix - 5.4)} ${n(iy - 18.5)} Q${n(ix - 0.2)} ${n(iy - 13)} ${n(ix - 1.6)} ${n(iy - 5.5)} Z`,
        fill: INK.paper,
        stroke: "#B3AB95",
        strokeWidth: 0.5,
      },
    ]),
    ...candle(0.91, 0.29, 0.22, 0.07, accent),
    ...chair(0.75, 0.36, "y1"),
    // rope along the pictures, and a bench to look at them from
    ...post(0.42),
    rope(0.42, 0.66),
    ...post(0.66),
    rope(0.66, 0.9),
    ...post(0.9),
    ...solid(0.3, 0.52, 0.12, 0.3, 0.1, WOOD),
    flat(0.31, 0.41, 0.54, 0.8, 0.101, INK.red, INK.redDark),
  ];
}

function hall(accent: string): Shape[] {
  const stand: Shape[] = [
    ...drum(0.28, 0.28, 0.05, 0.03, IRON),
    ...box(0.268, 0.268, 0.03, 0.024, 0.024, 0.34, [GOLD[2], GOLD[2], "#7A5A2A"]),
    ...cylinder(0.28, 0.28, 0.37, 0.07, 0.02, GOLD),
    ...[0.23, 0.33, 0.28].flatMap((x, i) => [
      ...box(x - 0.008, 0.272, 0.39, 0.016, 0.016, i === 2 ? 0.05 : 0.03, WAX),
      ...flame([x, 0.28, i === 2 ? 0.44 : 0.42], i === 2 ? 2.4 : 2.2, accent),
    ]),
  ];
  const shapes: Shape[] = [
    ...shell(),
    // checkered floor
    ...[0, 1, 2, 3].flatMap((i) =>
      [0, 1, 2, 3]
        .filter((j) => (i + j) % 2 === 0)
        .map((j) =>
          flat(i * 0.25, i * 0.25 + 0.25, j * 0.25, j * 0.25 + 0.25, 0, paint().tile, paint().line)
        )
    ),
    // carpet runners from door to door
    flat(0.4, 0.6, 0, 1, 0, CARPET.fill, CARPET.edge),
    flat(0, 1, 0.4, 0.6, 0, CARPET.fill, CARPET.edge),
    flat(0.4, 0.6, 0.4, 0.6, 0, "#333A5C", GOLD[2]),
    // banners
    onX(0, 0.1, 0.26, 0.34, 0.7, INK.red, INK.redDark),
    ball([0, 0.18, 0.55], 1.6, GOLD[1], GOLD[2]),
    onY(0, 0.12, 0.28, 0.34, 0.7, INK.red, INK.redDark),
    ball([0.2, 0, 0.55], 1.6, GOLD[1], GOLD[2]),
    // console table with flowers, and the long-case clock
    ...table(0.1, 0.03, 0.2, 0.1, 0.2),
    ...cylinder(0.2, 0.08, 0.2, 0.025, 0.06, [INK.glass, "#5A6FA8", "#5A6FA8"]),
    ball([0.19, 0.08, 0.31], 1.5, LEAF[1]),
    ball([0.215, 0.08, 0.33], 1.3, INK.red),
    ball([0.2, 0.08, 0.35], 1.1, INK.paper),
    ...solid(0.74, 0.02, 0.13, 0.09, 0.56, WOOD),
    onY(0.11, 0.775, 0.835, 0.08, 0.34, INK.iron, WOOD[2]),
    line([[0.805, 0.11, 0.34], [0.805, 0.11, 0.16]], GOLD[1], 0.7),
    ball([0.805, 0.11, 0.15], 1, GOLD[0], GOLD[2]),
    ball([0.805, 0.11, 0.46], 2.4, INK.paper, GOLD[1]),
    line([[0.805, 0.11, 0.46], [0.805, 0.11, 0.5]], INK.iron, 0.6),
    line([[0.805, 0.11, 0.46], [0.83, 0.11, 0.46]], INK.iron, 0.6),
    // a potted fern by the door
    ...drum(0.07, 0.26, 0.04, 0.08, STONE),
    ball([0.07, 0.26, 0.15], 3, LEAF[2], INK.grassLine),
    ball([0.06, 0.25, 0.2], 2.2, LEAF[1]),
    ball([0.085, 0.27, 0.22], 1.6, LEAF[0]),
    ...prop(stand),
  ];
  // staircase climbing along the left wall, with its newel and rail
  for (let i = 0; i < 5; i++) {
    shapes.push(...box(0.02, 0.66 + i * 0.066, 0, 0.24, 0.066, 0.5 - i * 0.1, STONE));
    shapes.push(flat(0.05, 0.23, 0.66 + i * 0.066, 0.726 + i * 0.066, 0.5 - i * 0.1, INK.redDark));
  }
  shapes.push(
    line([[0.26, 0.69, 0.62], [0.26, 0.69, 0.5]], WOOD[0], 1.2),
    line([[0.26, 0.69, 0.62], [0.275, 0.975, 0.3]], WOOD[0], 1.4),
    ...solid(0.26, 0.96, 0.03, 0.03, 0.3, WOOD),
    ball([0.275, 0.975, 0.32], 1.2, GOLD[0], GOLD[2])
  );
  return shapes;
}

function dining(accent: string): Shape[] {
  const y = 0.28;
  const goblet = (x: number): Shape[] => [
    ...cylinder(x, y + 0.13, 0.24, 0.014, 0.004, GOLD),
    ...box(x - 0.004, y + 0.126, 0.244, 0.008, 0.008, 0.03, GOLD),
    ...cylinder(x, y + 0.13, 0.274, 0.02, 0.032, GOLD),
    disc(x, y + 0.13, 0.305, 0.014, INK.red),
  ];
  return [
    ...shell(),
    ...planks(),
    ...picture("x", 0.08, 0.28, 0.4, 0.66, "#3A4A7A"),
    ball([0, 0.18, 0.55], 1.8, INK.paper, "#B3AB95"),
    ...picture("x", 0.72, 0.92, 0.4, 0.66, LEAF[2]),
    ...picture("y", 0.72, 0.92, 0.4, 0.66, INK.redDark),
    ball([0.82, 0, 0.55], 1.8, INK.paper, "#B3AB95"),
    ...sconce("y", 0.2, 0.44, accent),
    flat(0.1, 0.9, 0.12, 0.64, 0, INK.redDark, INK.red),
    flat(0.13, 0.87, 0.15, 0.61, 0, INK.redDark, GOLD[2]),
    // chairs along the far side, and the long table, laid
    ...[0.26, 0.45, 0.64].flatMap((x) => chair(x, y - 0.12, "y0")),
    ...table(0.16, y, 0.68, 0.26, 0.24),
    flat(0.2, 0.8, y + 0.09, y + 0.17, 0.242, INK.redDark, INK.red),
    ...cylinder(0.3, y + 0.05, 0.24, 0.04, 0.006, WAX),
    ...cylinder(0.7, y + 0.05, 0.24, 0.04, 0.006, WAX),
    ...candle(0.38, y + 0.13, 0.24, 0.09, accent),
    // two goblets, for the toast
    ...prop([...goblet(0.47), ...goblet(0.54)]),
    ...cylinder(0.63, y + 0.13, 0.24, 0.022, 0.08, LEAF),
    ...cylinder(0.63, y + 0.13, 0.32, 0.008, 0.035, LEAF),
    ...cylinder(0.3, y + 0.21, 0.24, 0.04, 0.006, WAX),
    ...cylinder(0.7, y + 0.21, 0.24, 0.04, 0.006, WAX),
    ...chair(0.86, y + 0.08, "x1"),
    // sideboard with a tureen
    ...solid(0.04, 0.72, 0.14, 0.24, 0.2, WOOD),
    line([[0.18, 0.84, 0], [0.18, 0.84, 0.2]], WOOD[2]),
    ball([0.18, 0.81, 0.11], 0.6, GOLD[0]),
    ball([0.18, 0.87, 0.11], 0.6, GOLD[0]),
    ...cylinder(0.11, 0.84, 0.2, 0.045, 0.04, WAX),
    ball([0.11, 0.84, 0.26], 0.8, GOLD[0]),
  ];
}

function cellar(accent: string): Shape[] {
  const barrel = (x: number, y: number): Shape[] => [
    ...drum(x, y, 0.12, 0.3, WOOD),
    hoop(x, y, 0.07, 0.12, INK.iron),
    hoop(x, y, 0.23, 0.12, INK.iron),
  ];
  const shapes: Shape[] = [...shell(), ...courses()];
  // brick joints, staggered course by course
  for (const [row, z] of [0, 0.2, 0.4, 0.6].entries()) {
    for (let a = row % 2 ? 0.125 : 0.25; a < 1; a += 0.25) {
      shapes.push(line([[0, a, z], [0, a, z + (row === 3 ? 0.15 : 0.2)]], paint().line));
    }
  }
  shapes.push(
    ...flags(4),
    // a barred light high in the wall, and a cobweb in the corner
    onX(0, 0.42, 0.6, 0.54, 0.66, INK.night, STONE[1]),
    ...[0.465, 0.51, 0.555].map((a) => line([[0, a, 0.54], [0, a, 0.66]], STONE[0], 0.8)),
    line([[0, 0.16, 0.75], [0.16, 0, 0.75]], INK.line),
    line([[0, 0.09, 0.69], [0.09, 0, 0.69]], INK.line),
    line([[0, 0, 0.6], [0.08, 0.08, 0.75]], INK.line),
    // wine rack
    ...solid(0.68, 0.02, 0.28, 0.1, 0.46, WOOD),
    ...[0.06, 0.2, 0.34].flatMap((z) => [
      onY(0.12, 0.7, 0.94, z, z + 0.1, INK.iron, WOOD[2]),
      ...[0.74, 0.82, 0.9].map((x) => ball([x, 0.12, z + 0.05], 1.1, LEAF[2], LEAF[1])),
    ]),
    // barrels along the left wall, one with a lantern on it
    ...barrel(0.14, 0.16),
    ...barrel(0.14, 0.42),
    ...box(0.115, 0.395, 0.3, 0.05, 0.05, 0.012, IRON),
    ...box(0.125, 0.405, 0.312, 0.03, 0.03, 0.05, GOLD),
    ...flame([0.14, 0.42, 0.362], 2.2, accent),
    // crates
    ...solid(0.78, 0.28, 0.18, 0.18, 0.16, WOOD),
    line([[0.78, 0.46, 0.08], [0.96, 0.46, 0.08]], WOOD[2]),
    ...box(0.81, 0.31, 0.16, 0.12, 0.12, 0.1, WOOD),
    // the passage under the floor: its curb, the shaft and a ladder
    flat(0.42, 0.7, 0.42, 0.7, 0, STONE[2], INK.line),
    flat(0.44, 0.68, 0.44, 0.68, 0, "#070912"),
    {
      d: path(
        ([[0.44, 0.44, 0], [0.44, 0.68, 0], [0.44, 0.62, -0.07], [0.44, 0.44, -0.07]] as V3[]).map(
          (p) => P(...p)
        )
      ),
      fill: paint().shade,
      stroke: INK.line,
      strokeWidth: 0.5,
    },
    {
      d: path(
        ([[0.44, 0.44, 0], [0.68, 0.44, 0], [0.62, 0.44, -0.07], [0.44, 0.44, -0.07]] as V3[]).map(
          (p) => P(...p)
        )
      ),
      fill: paint().lit,
      stroke: INK.line,
      strokeWidth: 0.5,
    },
    line([[0.5, 0.44, 0], [0.5, 0.44, -0.07]], WOOD[0], 0.9),
    line([[0.58, 0.44, 0], [0.58, 0.44, -0.07]], WOOD[0], 0.9),
    line([[0.5, 0.44, -0.025], [0.58, 0.44, -0.025]], WOOD[0], 0.9),
    line([[0.5, 0.44, -0.055], [0.58, 0.44, -0.055]], WOOD[0], 0.9),
    ...prop([
      ...box(0.44, 0.44, 0, 0.24, 0.24, 0.025, WOOD),
      ...[0.5, 0.56, 0.62].map((x) => line([[x, 0.44, 0.025], [x, 0.68, 0.025]], WOOD[2])),
      flat(0.44, 0.68, 0.48, 0.51, 0.026, INK.iron),
      flat(0.44, 0.68, 0.61, 0.64, 0.026, INK.iron),
      disc(0.56, 0.56, 0.027, 0.028, undefined, STONE[0], undefined, 1),
    ]),
    ...barrel(0.14, 0.76),
    // sacks
    ball([0.36, 0.9, 0.05], 3.6, "#8C7B5A", "#5E5340"),
    ball([0.44, 0.94, 0.045], 3.1, "#9A8964", "#5E5340")
  );
  return shapes;
}

function kitchen(accent: string): Shape[] {
  return [
    ...shell(),
    ...planks(),
    // pans on a rail, and the servants' bells
    line([[0, 0.06, 0.64], [0, 0.32, 0.64]], INK.line, 0.9),
    ...[0.12, 0.24].flatMap((y, i) => [
      line([[0, y, 0.64], [0, y, 0.55]], INK.iron, 0.7),
      ball([0, y, 0.5 - i * 0.01], 1.6 + i * 0.3, INK.iron, STONE[1]),
    ]),
    onX(0, 0.7, 0.94, 0.42, 0.62, WOOD[1], WOOD[2]),
    ...[0.76, 0.82, 0.88].flatMap((y) => [
      ball([0, y, 0.56], 0.8, GOLD[0], GOLD[2]),
      ball([0, y, 0.48], 0.8, GOLD[0], GOLD[2]),
    ]),
    // shelf of jars
    onY(0, 0.08, 0.32, 0.44, 0.465, WOOD[0], WOOD[2]),
    ...[0.12, 0.18, 0.24, 0.29].map((x, i) =>
      onY(0, x - 0.02, x + 0.02, 0.465, 0.52 + (i % 2) * 0.02, i % 2 ? LEAF[1] : INK.glass, INK.iron)
    ),
    // chopping block with a loaf and a knife
    ...solid(0.1, 0.08, 0.22, 0.18, 0.2, WOOD),
    flat(0.13, 0.25, 0.11, 0.22, 0.202, WAX[1], WAX[2]),
    ball([0.18, 0.16, 0.225], 1.5, "#B4683C", "#7A4526"),
    line([[0.25, 0.14, 0.203], [0.3, 0.2, 0.203]], INK.glass, 0.9),
    // range in the far-right corner, with its chimney
    ...box(0.7, 0.06, 0.34, 0.2, 0.12, 0.46, STONE),
    line([[0.7, 0.18, 0.56], [0.9, 0.18, 0.56]], INK.line),
    ...solid(0.66, 0.06, 0.28, 0.2, 0.34, STONE),
    onY(0.262, 0.7, 0.9, 0.02, 0.24, INK.night, STONE[2]),
    ...flame([0.76, 0.262, 0.02], 2.4, accent),
    ...flame([0.84, 0.262, 0.02], 2.4, accent),
    ...flame([0.8, 0.262, 0.02], 3.4, accent),
    // a broom against the wall
    line([[0.07, 0.33, 0.04], [0, 0.33, 0.44]], WOOD[0], 1),
    tint([[0.1, 0.31, 0], [0.1, 0.35, 0], [0.06, 0.34, 0.07], [0.06, 0.32, 0.07]], GOLD[2], 1),
    // the cauldron on its trivet, over the fire
    line([[0.74, 0.34, 0], [0.76, 0.34, 0.09]], INK.iron, 1),
    line([[0.86, 0.34, 0], [0.84, 0.34, 0.09]], INK.iron, 1),
    line([[0.8, 0.4, 0], [0.8, 0.38, 0.09]], INK.iron, 1),
    ...prop([
      ...cylinder(0.8, 0.34, 0.08, 0.07, 0.1, [STONE[2], INK.iron, INK.iron]),
      hoop(0.8, 0.34, 0.165, 0.07, STONE[1]),
      disc(0.8, 0.34, 0.181, 0.055, "#6F8452", INK.iron),
      ball([0.78, 0.33, 0.183], 0.5, "#9DB37A"),
      ball([0.82, 0.35, 0.183], 0.4, "#9DB37A"),
    ]),
    ...tagged("glow2", [
      ball([0.8, 0.34, 0.26], 1.6, INK.paper, undefined, 0.22),
      ball([0.815, 0.34, 0.33], 2.1, INK.paper, undefined, 0.16),
      ball([0.79, 0.34, 0.41], 2.6, INK.paper, undefined, 0.1),
    ]),
    // worktop with a bowl of apples
    ...solid(0.03, 0.68, 0.18, 0.28, 0.24, WOOD),
    line([[0.21, 0.82, 0], [0.21, 0.82, 0.24]], WOOD[2]),
    ...cylinder(0.12, 0.78, 0.24, 0.05, 0.035, STONE),
    ball([0.11, 0.78, 0.29], 1.1, INK.red),
    ball([0.135, 0.785, 0.295], 1.1, "#B4484D"),
    flat(0.07, 0.17, 0.87, 0.93, 0.242, INK.paper, "#B3AB95"),
  ];
}

function garden(accent: string): Shape[] {
  const [a, b] = DOOR;
  const [mx, my] = P(1, 0, 0.72);
  /** A hedge along a back edge, with its gate and gateposts. */
  const hedge = (wall: "x" | "y", door: Door | null): Shape[] => {
    const piece = (from: number, to: number, tones: Tones, h: number, inset = 0) =>
      wall === "x"
        ? box(-THICK + inset, from, 0, THICK - inset * 2, to - from, h, tones)
        : box(from, -THICK + inset, 0, to - from, THICK - inset * 2, h, tones);
    const start = wall === "x" ? -THICK : 0;
    if (!door) return piece(start, 1, LEAF, 0.26);
    const gatepost = (at: number) => [
      ...piece(at - 0.03, at + 0.03, STONE, 0.34),
      ball(wall === "x" ? [-THICK / 2, at, 0.36] : [at, -THICK / 2, 0.36], 1.4, STONE[0], INK.line),
    ];
    return [
      ...piece(start, a - 0.03, LEAF, 0.26),
      ...gatepost(a),
      ...(door === "locked"
        ? piece(a + 0.03, b - 0.03, LOCK, 0.22, 0.015)
        : door === "shut"
          ? piece(a + 0.03, b - 0.03, WOOD, 0.3, 0.01)
          : []),
      ...gatepost(b),
      ...piece(b + 0.03, 1, LEAF, 0.26),
    ];
  };
  const stone = ([x, y]: [number, number]) => flat(x, x + 0.1, y, y + 0.1, 0, STONE[2], INK.grassLine);
  return [
    moon(mx - 8 * k(), my, 4.5),
    ...stars([[0.42, 0, 0.74], [0.16, 0, 0.56], [0.7, 0, 0.5], [0, 0.4, 0.7], [0, 0.82, 0.6], [0, 0.6, 0.46]]),
    ...plinth(EARTH),
    flat(0, 1, 0, 1, 0, INK.grass, INK.grassLine),
    ...[0.2, 0.4, 0.6, 0.8].map((y) => line([[0, y, 0], [1, y, 0]], INK.grassLine)),
    ...hedge("x", exits.left),
    ...hedge("y", exits.right),
    // stepping stones from each gate to the well
    ...([[0.03, 0.45], [0.19, 0.45], [0.35, 0.45], [0.45, 0.03], [0.45, 0.17], [0.52, 0.33]] as [number, number][]).map(stone),
    // a flower bed under the hedge
    flat(0.02, 0.12, 0.7, 0.97, 0, EARTH[2], INK.grassLine),
    ...[0.74, 0.8, 0.86, 0.92].map((y, i) => ball([0.07, y, 0.03], 1, i % 2 ? accent : INK.paper)),
    // a lamp by the gate
    ...drum(0.92, 0.08, 0.025, 0.02, IRON),
    ...box(0.912, 0.072, 0.02, 0.016, 0.016, 0.36, IRON),
    ...box(0.9, 0.06, 0.38, 0.04, 0.04, 0.06, GOLD),
    ...flame([0.92, 0.08, 0.39], 2.2, accent),
    // tree
    ...drum(0.22, 0.24, 0.035, 0.3, WOOD),
    ball([0.22, 0.24, 0.46], 8, LEAF[2], INK.grassLine),
    ball([0.17, 0.2, 0.53], 5.8, LEAF[1]),
    ball([0.26, 0.26, 0.57], 4.4, LEAF[0]),
    ball([0.2, 0.26, 0.42], 0.7, INK.red),
    ball([0.27, 0.22, 0.5], 0.7, INK.red),
    // the well: its wall, the water, the windlass and the bucket
    ...drum(0.76, 0.3, 0.12, 0.12, STONE),
    hoop(0.76, 0.3, 0.06, 0.12, STONE[2]),
    ...cylinder(0.76, 0.3, 0.115, 0.085, 0.004, [INK.night, INK.night, INK.night]),
    ball([0.74, 0.28, 0.12], 1.1, INK.glass, undefined, 0.8),
    ...box(0.645, 0.285, 0.12, 0.025, 0.03, 0.26, WOOD),
    line([[0.76, 0.3, 0.38], [0.76, 0.3, 0.27]], INK.paper, 0.7),
    ...prop([
      ...cylinder(0.76, 0.3, 0.2, 0.034, 0.06, WOOD),
      hoop(0.76, 0.3, 0.225, 0.034, INK.iron),
      line([[0.735, 0.3, 0.26], [0.76, 0.3, 0.3], [0.785, 0.3, 0.26]], INK.iron, 0.7),
    ]),
    ...box(0.645, 0.285, 0.38, 0.235, 0.03, 0.03, WOOD),
    ...box(0.855, 0.285, 0.12, 0.025, 0.03, 0.26, WOOD),
    line([[0.88, 0.3, 0.395], [0.92, 0.3, 0.395], [0.92, 0.3, 0.34]], INK.iron, 0.9),
    ball([0.92, 0.3, 0.34], 0.7, WOOD[0], WOOD[2]),
    // a stone bench
    ...solid(0.12, 0.66, 0.04, 0.1, 0.08, STONE),
    ...solid(0.36, 0.66, 0.04, 0.1, 0.08, STONE),
    ...box(0.1, 0.65, 0.08, 0.32, 0.12, 0.025, STONE),
    // flowers, and fireflies over the grass
    ...([[0.9, 0.56], [0.56, 0.1], [0.3, 0.9], [0.6, 0.62], [0.96, 0.4]] as [number, number][]).map(
      ([x, y], i) => ball([x, y, 0.03], 0.9, i % 2 ? accent : INK.paper)
    ),
    ...tagged(
      "glow2",
      ([[0.5, 0.6, 0.2], [0.34, 0.5, 0.34], [0.86, 0.6, 0.28], [0.6, 0.86, 0.16], [0.44, 0.2, 0.3]] as V3[]).flatMap(
        (at) => [ball(at, 1.6, LIGHT, undefined, 0.2), ball(at, 0.5, LIGHT)]
      )
    ),
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

/** The thing in each room the player touches to use the room, and how
 *  it answers. */
const OBJECT: Record<RoomId, { at: V3; radius: number; motion: () => Motion }> = {
  belltower: {
    at: [0.5, 0.34, 0.36],
    radius: 17,
    motion: () => ({ kind: "swing", pivot: P(0.5, 0.34, 0.66), degrees: 16 }),
  },
  study: {
    at: [0.76, 0.3, 0.24],
    radius: 13,
    motion: () => ({ kind: "pop", pivot: P(0.76, 0.3, 0.224), scale: 1.25, lift: 7 }),
  },
  chapel: {
    at: [0.5, 0.13, 0.46],
    radius: 17,
    motion: () => ({ kind: "pop", pivot: P(0.5, 0.125, 0.28), scale: 1.12, lift: 3 }),
  },
  gallery: {
    at: [0.76, 0.22, 0.28],
    radius: 15,
    motion: () => ({ kind: "swing", pivot: P(0.69, 0.2, 0.25), degrees: 20 }),
  },
  hall: {
    at: [0.28, 0.28, 0.36],
    radius: 13,
    motion: () => ({ kind: "swing", pivot: P(0.28, 0.28, 0), degrees: 5 }),
  },
  dining: {
    at: [0.5, 0.41, 0.3],
    radius: 16,
    motion: () => ({ kind: "pop", pivot: P(0.505, 0.41, 0.24), scale: 1.2, lift: 6 }),
  },
  cellar: {
    at: [0.56, 0.56, 0.02],
    radius: 16,
    motion: () => {
      const [x0, y0] = P(0, 0);
      const [x1, y1] = P(-0.15, 0);
      return { kind: "slide", dx: x1 - x0, dy: y1 - y0 };
    },
  },
  kitchen: {
    at: [0.8, 0.34, 0.16],
    radius: 15,
    motion: () => ({ kind: "swing", pivot: P(0.8, 0.34, 0.08), degrees: 6 }),
  },
  garden: {
    at: [0.76, 0.3, 0.22],
    radius: 16,
    motion: () => ({ kind: "slide", dx: 0, dy: -0.07 * unit() }),
  },
};

/** Where a room keeps a book to read: the Chapel's record on its lectern. */
const BOOK: Partial<Record<RoomId, V3>> = { chapel: [0.135, 0.36, 0.27] };

const COLS = 3;

/** The rooms next door, by the side of the drawing they lie on. */
function neighbours(room: number): Record<Side, number | null> {
  const col = room % COLS;
  const row = Math.floor(room / COLS);
  return {
    left: col > 0 ? room - 1 : null,
    right: row > 0 ? room - COLS : null,
    frontRight: col < COLS - 1 ? room + 1 : null,
    frontLeft: row < COLS - 1 ? room + COLS : null,
  };
}

const SIDES: Side[] = ["left", "right", "frontRight", "frontLeft"];

/** Where each door's name is written: over a back door, under a step. */
const ANCHOR: Record<Side, () => Pt> = {
  left: () => P(0, 0.5, 0.6),
  right: () => P(0.5, 0, 0.6),
  frontRight: () => {
    const [x, y] = P(1.08, 0.5, -BASE);
    return [x, y + 9];
  },
  frontLeft: () => {
    const [x, y] = P(0.5, 1.08, -BASE);
    return [x, y + 9];
  },
};

/** One room in full detail, in the layers RoomScene draws. */
export function buildScene(room: number, { accent, collapsed, lockedDoor }: SceneOptions): Scene {
  const next = neighbours(room);
  return inScene(() => {
    const out: SceneExit[] = [];
    for (const side of SIDES) {
      const other = next[side];
      exits[side] = other === null ? null : doorBetween(room, other, collapsed, lockedDoor);
      if (other !== null) {
        const [x, y] = ANCHOR[side]();
        out.push({ side, room: other, door: exits[side] ?? "open", x, y });
      }
    }

    const id = ROOMS[room];
    paintAs(id);
    const all = [...BUILDERS[id](accent), ...barriers()];
    const solids = all.filter((shape) => shape.layer !== "glow" && shape.layer !== "glow2");
    const first = solids.findIndex((shape) => shape.layer === "prop");
    const count = solids.filter((shape) => shape.layer === "prop").length;

    const object = OBJECT[id];
    const [x, y] = P(...object.at);
    const book = BOOK[id];
    const [bookX, bookY] = book ? P(...book) : [0, 0];
    return {
      back: solids.slice(0, first),
      prop: solids.slice(first, first + count),
      front: solids.slice(first + count),
      glow: all.filter((shape) => shape.layer === "glow"),
      glow2: all.filter((shape) => shape.layer === "glow2"),
      exits: out,
      touch: { x, y, r: object.radius },
      motion: object.motion(),
      book: book ? { x: bookX, y: bookY, r: 9 } : null,
    };
  });
}

/** Where watchers stand, the player's own spot first: three rows across
 *  the clear front of every room, each row standing in the gaps of the
 *  one before it so nobody hides behind anybody. */
export const SPOTS: [number, number][] = [
  [0.86, 0.86],
  [0.98, 0.74],
  [0.74, 0.98],
  [0.81, 0.69],
  [0.69, 0.81],
  [0.93, 0.57],
  [0.57, 0.93],
  [0.65, 0.65],
  [0.77, 0.53],
  [0.53, 0.77],
  [0.89, 0.41],
  [0.41, 0.89],
];

/** A watcher standing on a spot: a turned pawn, lit from the left. */
export function pawnShapes([x, y]: [number, number], fill: string, edge: string): Shape[] {
  return inScene(() => {
    const rx = 0.042 * unit() * 1.2247;
    const ry = 0.042 * unit() * 0.7071;
    const neck = rx * 0.36;
    const [bx, by] = P(x, y, 0);
    const [, ny] = P(x, y, 0.115);
    const [hx, hy] = P(x, y, 0.15);
    return [
      { d: oval(bx + 2.2, by + 0.8, rx * 1.2, ry * 1.2), fill: "#000000", opacity: 0.35 },
      {
        d: `M${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} L${n(bx + neck)} ${n(ny)} L${n(bx - neck)} ${n(ny)} Z`,
        fill,
        stroke: edge,
        strokeWidth: 0.6,
      },
      {
        d: `M${n(bx)} ${n(by + ry)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} L${n(bx + neck)} ${n(ny)} L${n(bx)} ${n(ny)} Z`,
        fill: "#000000",
        opacity: 0.22,
      },
      { d: oval(bx, ny, neck * 1.5, neck * 0.7), fill, stroke: edge, strokeWidth: 0.5 },
      { d: oval(hx, hy, 3.6, 3.6), fill, stroke: edge, strokeWidth: 0.6 },
      { d: oval(hx - 1.1, hy - 1.2, 1.1, 1.1), fill: "#FFFFFF", opacity: 0.35 },
    ];
  });
}

/** The top of a pawn's head, for its name. */
export function pawnTop([x, y]: [number, number]): Pt {
  return inScene(() => P(x, y, 0.19));
}

/** The seal drawn on the floor of tonight's mission room, round the
 *  player's own spot, and the seal lamp standing in it. */
export function sealShapes(color: string): Shape[] {
  return inScene(() => {
    const [x, y] = SPOTS[0];
    const spoke = (angle: number): Shape => {
      const [c, s] = [Math.cos(angle), Math.sin(angle)];
      return line(
        [
          [x + c * 0.13, y + s * 0.13, 0],
          [x + c * 0.17, y + s * 0.17, 0],
        ],
        color,
        0.9
      );
    };
    return [
      disc(x, y, 0, 0.17, color, undefined, 0.14),
      disc(x, y, 0, 0.17, undefined, color, undefined, 1.1),
      disc(x, y, 0, 0.13, undefined, color, undefined, 0.6),
      ...Array.from({ length: 8 }, (_, i) => spoke((i * Math.PI) / 4)),
    ];
  });
}

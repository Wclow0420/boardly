// A room on its own, built like a small stage set: a stone plinth, two
// thick back walls with doors to the rooms beyond, steps down from the
// two open sides, a floor, and the furniture helpers to fill it. Drawn
// with the kit (kit.ts) in the room's own unit square; a game sets the
// camera, the ink and the four ways out, then lists its furniture.
// Seal the Manor's rooms (games/nightwatch/roomScenes.ts) are built so.

import {
  DOOR,
  GOLD,
  INK,
  LOCK,
  STONE,
  WALL,
  WALLS,
  WOOD,
  P,
  arch,
  ball,
  box,
  cylinder,
  flame,
  flat,
  line,
  moonShaft,
  n,
  onX,
  onY,
  paint,
  path,
  setLayer,
  tone,
  unit,
  type Door,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "./kit";

/** The four ways out of a room: two doors in the back walls, two steps
 *  down from the open front. */
export type Side = "left" | "right" | "frontRight" | "frontLeft";

export const BASE = 0.07;
export const THICK = 0.05;
export const LIGHT = "#FFE3A8";
export const CLOTH: Tones = [INK.red, INK.redDark, "#57232A"];
export const WAX: Tones = [INK.paper, "#CFC7B0", "#B3AB95"];
export const IRON: Tones = ["#2C3454", INK.iron, INK.iron];
export const EARTH: Tones = ["#3A4A3A", "#2C3B31", "#222E28"];


/** The doors of the room being drawn; null where there is no room. */
let exits: Record<Side, Door | null> = {
  left: null,
  right: null,
  frontRight: null,
  frontLeft: null,
};

/** Sets the room's four ways out before it is built. */
export function setExits(next: Record<Side, Door | null>) {
  exits = next;
}
export const exitOf = (side: Side) => exits[side];

const tagged = (layer: Shape["layer"], shapes: Shape[]): Shape[] =>
  shapes.map((shape) => ({ ...shape, layer }));
/** The part of a room that moves on its own: drawn in a layer of its
 *  own, with any flame in it moving along. */
export function prop(draw: () => Shape[]): Shape[] {
  setLayer(1);
  const shapes = draw();
  setLayer(2);
  return tagged("prop", shapes);
}

/** A patch of light or shadow: a filled outline with no edge. */
export const tint = (pts: V3[], fill: string, opacity: number): Shape => ({
  d: path(pts.map(([x, y, z]) => P(x, y, z))),
  fill,
  opacity,
});

export const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0 a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0 Z`;

/** A circle lying flat at height z. */
export function disc(
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
export const shadow = (x: number, y: number, w: number, d: number) =>
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
export const solid = (x: number, y: number, w: number, d: number, h: number, tones: Tones) => [
  shadow(x, y, w, d),
  ...box(x, y, 0, w, d, h, tones),
];

/** A cylinder standing on the floor, with its shadow. */
export const drum = (x: number, y: number, r: number, h: number, tones: Tones) => [
  disc(x + 0.035, y + 0.01, 0, r, INK.night, undefined, 0.3),
  ...cylinder(x, y, 0, r, h, tones),
];

/** A table on four legs. */
export function table(x: number, y: number, w: number, d: number, h: number, tones: Tones = WOOD): Shape[] {
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
export function chair(x: number, y: number, back: "y0" | "y1" | "x1", tones: Tones = WOOD): Shape[] {
  const rest =
    back === "y0"
      ? box(x, y, 0.12, 0.1, 0.02, 0.2, tones)
      : back === "y1"
        ? box(x, y + 0.08, 0.12, 0.1, 0.02, 0.2, tones)
        : box(x + 0.08, y, 0.12, 0.02, 0.1, 0.2, tones);
  return [...solid(x, y, 0.1, 0.1, 0.12, tones), ...rest];
}

/** A picture in a gold frame on the left wall (y, z) or the right (x, z). */
export function picture(wall: "x" | "y", a1: number, a2: number, z1: number, z2: number, canvas: string): Shape[] {
  const on = wall === "x" ? onX : onY;
  return [
    on(0, a1, a2, z1, z2, GOLD[1], GOLD[2]),
    on(0, a1 + 0.025, a2 - 0.025, z1 + 0.025, z2 - 0.025, canvas, GOLD[2]),
  ];
}

/** A window in an outside wall, its sill, and the moonlight it lets in. */
export function windowOn(
  wall: "x" | "y",
  from: number,
  to: number,
  z0: number,
  spring: number,
  pointed = false,
  glass: string = INK.night,
  /** The colour of the light it lets in. */
  light: string = INK.glass
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
    ...moonShaft(
      [at(from, top), at(to, top)],
      [pool[2], pool[3]],
      light
    ),
  ];
}

/** A candle bracket on a wall. */
export function sconce(wall: "x" | "y", a: number, z: number, accent: string): Shape[] {
  const [x, y] = wall === "x" ? [0, a - 0.015] : [a - 0.015, 0];
  return [
    ...box(x, y, z, 0.03, 0.03, 0.012, GOLD),
    ...box(x + 0.009, y + 0.009, z + 0.012, 0.012, 0.012, 0.035, WAX),
    ...flame([x + 0.015, y + 0.015, z + 0.047], 1.8, accent),
  ];
}

/** A doorway in a back wall: open, barred for the night, or walled up. */
export function wallDoor(wall: "x" | "y", door: Door): Shape[] {
  const on = wall === "x" ? onX : onY;
  const at = (a: number, z: number, depth = 0): V3 =>
    wall === "x" ? [depth, a, z] : [a, depth, z];
  const [a, b] = DOOR;
  const mid = (a + b) / 2;
  const h = 0.5;
  const shapes: Shape[] = [
    // a carved wooden frame, its lintel crowned by a gold keystone
    { ...on(0, a - 0.04, b + 0.04, 0, h + 0.04, WOOD[1]) },
    { ...line([at(a - 0.025, 0.01), at(a - 0.025, h + 0.025), at(b + 0.025, h + 0.025), at(b + 0.025, 0.01)], tone(WOOD[1], 0.3), 0.5), opacity: 0.7 },
    on(0, mid - 0.03, mid + 0.03, h + 0.03, h + 0.075, GOLD[1]),
    { ...line([at(mid - 0.025, h + 0.07), at(mid + 0.025, h + 0.07)], "#FFFFFF", 0.5), opacity: 0.6 },
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
export function plinth(tones: Tones): Shape[] {
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
export function mats(): Shape[] {
  const [a, b] = DOOR;
  return [
    ...(exits.frontRight ? [flat(0.9, 0.99, a + 0.03, b - 0.03, 0, INK.redDark, INK.red)] : []),
    ...(exits.frontLeft ? [flat(a + 0.03, b - 0.03, 0.9, 0.99, 0, INK.redDark, INK.red)] : []),
  ];
}

/** What stands across a front doorway that can't be used tonight. */
export function barriers(): Shape[] {
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

/** A band along both back walls between heights z1 and z2, filled with
 *  `colors` (top to bottom), inked, with a line of light along its top:
 *  a moulding, a rail. */
function band(z1: number, z2: number, colors: string[], light = 0.45): Shape[] {
  const strip = (on: typeof onX) => {
    const shape = on(0, 0, 1, z1, z2, colors[1]);
    const [ax, ay] = P(0, 0, z2);
    const [, by] = P(0, 0, z1);
    return { ...shape, grad: { colors, from: [ax, ay] as Pt, to: [ax, by] as Pt } };
  };
  return [
    strip(onX),
    strip(onY),
    { ...line([[0, 1, z2], [0, 0, z2], [1, 0, z2]], "#FFFFFF", 0.5), opacity: light },
  ];
}

/** Panelling along the foot of both back walls: a darker dado with
 *  sunk panels (lit on their lower edges, as light falls from above),
 *  under a gilded rail. */
export function wainscot(top = 0.25): Shape[] {
  const ink = paint();
  const dado = tone(ink.lit, -0.14);
  const sunk = tone(ink.lit, -0.24);
  const shapes: Shape[] = [];
  const panels = [0.04, 0.27, 0.5, 0.73];
  for (const [on, axis] of [
    [onX, "x"],
    [onY, "y"],
  ] as const) {
    shapes.push(on(0, 0, 1, 0.04, top, dado));
    for (const a of panels) {
      const b = a + 0.2;
      const z1 = 0.075;
      const z2 = top - 0.035;
      shapes.push(on(0, a + 0.015, b - 0.015, z1, z2, sunk));
      const at = (u: number, z: number): V3 => (axis === "x" ? [0, u, z] : [u, 0, z]);
      shapes.push(
        { ...line([at(a + 0.015, z1), at(b - 0.015, z1), at(b - 0.015, z2)], tone(ink.lit, 0.25), 0.5), opacity: 0.6 },
      );
    }
  }
  shapes.push(...band(top, top + 0.025, [GOLD[0], GOLD[1], GOLD[2]]));
  return shapes;
}

/** Plinth, the two thick back walls with their doors, floor and trim.
 *  `panelled` (the default) dresses the walls with panelling under a
 *  gilded rail and a gilded cornice; plain walls (a cabin, a cellar) get
 *  a simple dark rail instead. */
export function shell(base: Tones = STONE, { panelled = true }: { panelled?: boolean } = {}): Shape[] {
  const ink = paint();
  const floor = flat(0, 1, 0, 1, 0, ink.floor);
  return [
    ...plinth(base),
    ...box(-THICK, -THICK, 0, THICK, 1 + THICK, WALL, [ink.line, ink.lit, ink.shade]),
    ...box(0, -THICK, 0, 1, THICK, WALL, [ink.line, ink.lit, ink.shade]),
    // the floor, lit from the back corner and falling into shadow at the front
    {
      ...floor,
      grad: {
        colors: [tone(ink.floor, 0.16), ink.floor, tone(ink.floor, -0.22)],
        from: P(0, 0, 0),
        to: P(1, 1, 0),
      },
    },
    // skirting, panelling under a gilded rail, and a gilded cornice
    onX(0, 0, 1, 0, 0.04, tone(ink.lit, -0.3)),
    onY(0, 0, 1, 0, 0.04, tone(ink.tile, -0.3)),
    ...(panelled
      ? [...wainscot(), ...band(0.72, 0.76, [GOLD[0], GOLD[1], GOLD[2]], 0.55)]
      : band(0.72, 0.745, [tone(ink.lit, -0.1), tone(ink.lit, -0.25), tone(ink.lit, -0.4)], 0.25)),
    ...(exits.left ? wallDoor("x", exits.left) : []),
    ...(exits.right ? wallDoor("y", exits.right) : []),
    ...mats(),
  ];
}

/** Floorboards, with their butt joints staggered. */
export function planks(): Shape[] {
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
export function flags(count: number): Shape[] {
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
export function courses(): Shape[] {
  return [0.2, 0.4, 0.6].map((z) =>
    line([[0, 1, z], [0, 0, z], [1, 0, z]], paint().line)
  );
}

/** Stars seen through an opening: points on a wall plane. */
export const stars = (points: V3[]) => points.map((at) => ball(at, 0.45, INK.glass));


/** The room's outline as a whole — walls, floor and plinth — for laying
 *  something over the room and nothing else. */
export function roomOutline(): string {
  return path(
    (
      [
        [-THICK, -THICK, WALL],
        [1, -THICK, WALL],
        [1, -THICK, -BASE],
        [1, 1, -BASE],
        [-THICK, 1, -BASE],
        [-THICK, 1, WALL],
      ] as V3[]
    ).map(([x, y, z]) => P(x, y, z))
  );
}

/** A watcher standing on a floor point: a turned pawn, lit from the left. */
export function pawn([x, y]: [number, number], fill: string, edge: string): Shape[] {
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
}

/** The top of a pawn's head on a floor point, for its name. */
export const pawnTop = ([x, y]: [number, number]): Pt => P(x, y, 0.19);

/** Spots where watchers stand, nearest the middle first: three rows across
 *  the clear front of a room (x + y > 1.3), each in the gaps of the last. */
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

// Engraved furniture for the isometric rooms: pieces built from the kit's
// parts with the detail the borders have: panelled doors with brass
// knobs, mouldings, iron bands, glass with a gleam. Each takes world
// units (x right-front, y left-front, z up) and returns shapes back to
// front; the faces the viewer sees are +y (lit) and +x (shaded). Any
// game's rooms can use them (Seal the Manor, Shelter).

import {
  GOLD,
  INK,
  P,
  STONE,
  WOOD,
  ball,
  box,
  cylinder,
  flame,
  hoop,
  line,
  n,
  path,
  poly,
  tone,
  unit,
  type Shape,
  type Tones,
  type V3,
} from "./kit";

/** Dark iron, lit like a metal. */
export const IRONWORK: Tones = ["#5A6276", "#3A4050", "#262A36"];
/** Brass, warmer than gold. */
export const BRASS: Tones = ["#F2D38A", "#C99A44", "#8A6420"];

/** The shadow a piece throws on the floor. */
const shadow = (x: number, y: number, w: number, d: number): Shape => ({
  d: path(
    ([
      [x + 0.02, y + 0.03, 0],
      [x + w + 0.05, y + 0.03, 0],
      [x + w + 0.05, y + d + 0.01, 0],
      [x + 0.02, y + d + 0.01, 0],
    ] as V3[]).map((p) => P(...p)),
  ),
  fill: INK.night,
  opacity: 0.32,
});

/** A sunk panel on a visible face: `face` "lit" is the +y face at y = at,
 *  "shade" the +x face at x = at; u runs along it, z up. Darker than the
 *  face, with light caught along its lower edge. */
export function panel(face: "lit" | "shade", at: number, u1: number, u2: number, z1: number, z2: number, base: string): Shape[] {
  const p = (u: number, z: number): V3 => (face === "lit" ? [u, at, z] : [at, u, z]);
  const sunk = tone(base, -0.18);
  return [
    {
      ...poly([p(u1, z1), p(u2, z1), p(u2, z2), p(u1, z2)], sunk),
      grad: { colors: [tone(sunk, -0.12), sunk, tone(sunk, 0.08)], from: P(...p(u1, z2)), to: P(...p(u2, z1)) },
      strokeWidth: 0.45,
    },
    { ...line([p(u1 + 0.005, z1 + 0.004), p(u2 - 0.004, z1 + 0.004), p(u2 - 0.004, z2 - 0.006)], tone(base, 0.35), 0.45), opacity: 0.7 },
  ];
}

/** A brass knob on a visible face. */
const knob = (at: V3, size = 0.9): Shape => ball(at, size, BRASS[1], BRASS[2]);

/** A cupboard: a low plinth, a panelled body with `doors` doors on its
 *  lit face (and one long panel on its side), brass knobs, and a top
 *  that overhangs a little with a line of light. */
export function cabinet(
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  {
    tones = WOOD,
    doors = 2,
    drawers = 0,
    sidePanels = 1,
    top,
  }: { tones?: Tones; doors?: number; drawers?: number; sidePanels?: number; top?: Tones } = {},
): Shape[] {
  const X = x + w;
  const Y = y + d;
  const base = 0.025;
  const slab = 0.022;
  const bodyTop = h - slab;
  const shapes: Shape[] = [
    shadow(x, y, w, d),
    ...box(x + 0.008, y + 0.008, 0, w - 0.016, d - 0.016, base, tones.map((c) => tone(c, -0.18)) as Tones),
    ...box(x, y, base, w, d, bodyTop - base, tones),
  ];
  // drawers across the top of the front, doors below
  const drawerH = drawers > 0 ? 0.06 : 0;
  for (let i = 0; i < drawers; i++) {
    const u1 = x + 0.02 + ((w - 0.04) * i) / drawers;
    const u2 = x + 0.02 + ((w - 0.04) * (i + 1)) / drawers - 0.01;
    shapes.push(...panel("lit", Y, u1, u2, bodyTop - drawerH, bodyTop - 0.012, tones[1]));
    shapes.push(knob([(u1 + u2) / 2, Y, bodyTop - drawerH / 2 - 0.006], 0.75));
  }
  for (let i = 0; i < doors; i++) {
    const u1 = x + 0.02 + ((w - 0.04) * i) / doors;
    const u2 = x + 0.02 + ((w - 0.04) * (i + 1)) / doors - 0.012;
    const z2 = bodyTop - drawerH - 0.018;
    shapes.push(...panel("lit", Y, u1, u2, base + 0.02, z2, tones[1]));
    const right = i % 2 === 0 && doors > 1;
    shapes.push(knob([right ? u2 - 0.018 : u1 + 0.018, Y, (base + z2) / 2 + 0.01]));
  }
  for (let i = 0; i < sidePanels; i++) {
    const u1 = y + 0.02 + ((d - 0.04) * i) / sidePanels;
    const u2 = y + 0.02 + ((d - 0.04) * (i + 1)) / sidePanels - 0.012;
    shapes.push(...panel("shade", X, u1, u2, base + 0.02, bodyTop - 0.02, tones[2]));
  }
  shapes.push(...box(x - 0.012, y - 0.012, bodyTop, w + 0.024, d + 0.024, slab, top ?? tones));
  return shapes;
}

/** A shelf on the right-hand back wall (y = 0), from x1 to x2 at height
 *  z, on two carved brackets. */
export function shelfY(x1: number, x2: number, z: number, depth = 0.07, tones: Tones = WOOD): Shape[] {
  const bracket = (x: number): Shape => ({
    ...poly(
      [
        [x, 0, z],
        [x, depth * 0.9, z],
        [x, 0.012, z - 0.07],
        [x, 0, z - 0.07],
      ],
      tones[2],
    ),
  });
  return [
    bracket(x1 + 0.03),
    bracket(x2 - 0.03),
    ...box(x1, 0, z, x2 - x1, depth, 0.018, tones),
  ];
}

/** The same on the left-hand back wall (x = 0), from y1 to y2. */
export function shelfX(y1: number, y2: number, z: number, depth = 0.07, tones: Tones = WOOD): Shape[] {
  const bracket = (y: number): Shape => ({
    ...poly(
      [
        [0, y, z],
        [depth * 0.9, y, z],
        [0.012, y, z - 0.07],
        [0, y, z - 0.07],
      ],
      tones[2],
    ),
  });
  return [bracket(y1 + 0.03), bracket(y2 - 0.03), ...box(0, y1, z, depth, y2 - y1, 0.018, tones)];
}

/** A glass jar standing at (x, y, z): its body tinted by what's inside,
 *  a gleam, a brass lid. */
export function jar(x: number, y: number, z: number, r: number, h: number, inside: string): Shape[] {
  return [
    ...cylinder(x, y, z, r, h, [tone(inside, 0.2), inside, tone(inside, -0.3)]),
    ...cylinder(x, y, z + h, r * 0.82, h * 0.16, BRASS),
  ];
}

/** A barrel standing on the floor: staves, two iron hoops. */
export function barrel(x: number, y: number, r: number, h: number, tones: Tones = WOOD): Shape[] {
  return [
    { ...shadow(x - r, y - r, r * 2, r * 2) },
    ...cylinder(x, y, 0, r, h, tones),
    hoop(x, y, h * 0.22, r, IRONWORK[2]),
    hoop(x, y, h * 0.78, r, IRONWORK[2]),
    hoop(x, y, h * 0.22 + 0.006, r, IRONWORK[0]),
    hoop(x, y, h * 0.78 + 0.006, r, IRONWORK[0]),
  ];
}

/** A chest on the floor: wood bound in iron bands, a brass lock plate. */
export function chest(x: number, y: number, w: number, d: number, h: number, tones: Tones = WOOD): Shape[] {
  const X = x + w;
  const Y = y + d;
  return [
    shadow(x, y, w, d),
    ...box(x, y, 0, w, d, h * 0.62, tones),
    ...box(x - 0.006, y - 0.006, h * 0.62, w + 0.012, d + 0.012, h * 0.38, tones),
    ...[0.18, 0.82].flatMap((f) => [
      ...box(x + w * f - 0.012, Y - 0.002, 0, 0.024, 0.006, h, IRONWORK),
      ...box(X - 0.002, y + d * f - 0.012, 0, 0.006, 0.024, h, IRONWORK),
    ]),
    ...box(x + w / 2 - 0.02, Y, h * 0.42, 0.04, 0.006, 0.05, BRASS),
  ];
}

/** A kitchen range against the right-hand wall: a stone hearth, a dark
 *  iron body with an arched firebox (fire behind a brass grate), a brass
 *  rail along its top, a hood above with a gilded band, and a chimney to
 *  the cornice. Its lit face is at y + d. */
export function range(x: number, y: number, w: number, d: number, h: number, accent: string): Shape[] {
  const Y = y + d;
  const X = x + w;
  const fire = { from: x + w * 0.18, to: X - w * 0.18, z0: 0.03, spring: h * 0.42 };
  const at = (u: number, z: number): V3 => [u, Y + 0.002, z];
  // the firebox's arched mouth
  const mouth: V3[] = [at(fire.from, fire.z0), at(fire.to, fire.z0)];
  const r = (fire.to - fire.from) / 2;
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * Math.PI;
    mouth.push(at((fire.from + fire.to) / 2 + Math.cos(t) * r, fire.spring + Math.sin(t) * r * 0.9));
  }
  const grate = [0.25, 0.42, 0.58, 0.75].map((f) => {
    const u = fire.from + (fire.to - fire.from) * f;
    return line([at(u, fire.z0), at(u, fire.spring + r * 0.5)], BRASS[1], 0.9);
  });
  return [
    shadow(x - 0.03, y, w + 0.06, d + 0.03),
    ...box(x - 0.03, y, 0, w + 0.06, d + 0.03, 0.025, STONE),
    ...box(x, y, 0.025, w, d, h - 0.025, IRONWORK),
    { ...poly(mouth, INK.night), stroke: BRASS[2], strokeWidth: 0.9 },
    ...flame([x + w * 0.38, Y, fire.z0], 2.4, accent),
    ...flame([x + w * 0.62, Y, fire.z0], 2.4, accent),
    ...flame([x + w * 0.5, Y, fire.z0], 3.4, accent),
    ...grate,
    line([at(x + 0.01, h - 0.03), at(X - 0.01, h - 0.03)], BRASS[1], 1.3),
    { ...line([at(x + 0.01, h - 0.035), at(X - 0.01, h - 0.035)], "#FFFFFF", 0.4), opacity: 0.5 },
    ...box(x - 0.01, y - 0.01, h, w + 0.02, d + 0.02, 0.02, IRONWORK),
    // the hood, a gilded band along its foot, the chimney to the cornice
    ...box(x + w * 0.22, y, h + 0.2, w * 0.56, d * 0.5, 0.52 - h, STONE),
    ...box(x + 0.01, y, h + 0.1, w - 0.02, d * 0.72, 0.1, STONE),
    {
      ...poly(
        [
          [x + 0.01, y + d * 0.72 + 0.002, h + 0.1],
          [X - 0.01, y + d * 0.72 + 0.002, h + 0.1],
          [X - 0.01, y + d * 0.72 + 0.002, h + 0.118],
          [x + 0.01, y + d * 0.72 + 0.002, h + 0.118],
        ],
        GOLD[1],
      ),
      grad: { colors: [GOLD[0], GOLD[1], GOLD[2]], from: P(x, y + d * 0.72, h + 0.118), to: P(x, y + d * 0.72, h + 0.1) },
    },
  ];
}

/** A pan hanging from a hook on the left-hand wall at (y, z). */
export function hangingPan(y: number, z: number, size: number): Shape[] {
  const [cx, cy] = P(0.012, y, z);
  const r = size * unit() * 0.022;
  return [
    line([[0, y, z + 0.11], [0.012, y, z + 0.035]], IRONWORK[0], 0.7),
    {
      d: `M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r * 0.92)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r * 0.92)} 0 1 0 ${n(-2 * r)} 0 Z`,
      fill: IRONWORK[1],
      grad: { colors: [tone(IRONWORK[1], 0.3), IRONWORK[1], tone(IRONWORK[1], -0.4)], from: [cx - r * 0.4, cy - r * 0.4], radius: r * 1.4 },
      stroke: tone(IRONWORK[1], -0.6),
      strokeWidth: 0.55,
    },
    {
      d: `M${n(cx - r * 0.55)} ${n(cy - r * 0.35)} a${n(r * 0.6)} ${n(r * 0.55)} 0 0 1 ${n(r * 0.6)} ${n(-r * 0.35)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.55,
      opacity: 0.4,
    },
  ];
}

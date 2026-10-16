// Drawing helpers the pieces share: steady randomness, strokes and
// outlines, faces lit with a gradient, round things on a wall plane, the
// shadow a piece throws, a sunk panel, a rod, a bolt. World units: x
// right-front, y left-front, z up; the back walls are x = 0 ("x", the
// left wall, u running along y) and y = 0 ("y", the right, u along x).

import {
  box,
  GOLD,
  INK,
  inkOf,
  k,
  LEAF,
  line,
  n,
  P,
  path,
  poly,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { oval, tint } from "../room";
import { frond, JEWELS, LEAF as LEAF_PATH } from "@/components/engraved/shapes";
import { IRONWORK } from "./materials";

const TAU = Math.PI * 2;

/** A steady pseudo-random number in [0, 1) for a seed. */
export const rnd = (seed: number) => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Several open polylines as one stroke (cheap engraving). */
export const strokes = (lines: V3[][], stroke: string, strokeWidth: number, opacity?: number): Shape => ({
  d: lines.map((pts) => path(pts.map((p) => P(...p)), false)).join(" "),
  stroke,
  strokeWidth,
  opacity,
});

/** The convex hull of points in the drawing. */
export function hull(pts: Pt[]): Pt[] {
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

/** Points round a circle of radius r about c, in the plane across
 *  `axis` (for "x" and "y", t = 0 points along the other floor axis and
 *  t = 90° straight up). On a lying drum, t from -45° to 135° is the
 *  half the viewer sees. */
export function ring3(axis: "x" | "y" | "z", c: V3, r: number, t0 = 0, t1 = TAU, steps = 24): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps;
    const [a, b] = [Math.cos(t) * r, Math.sin(t) * r];
    out.push(
      axis === "x" ? [c[0], c[1] + a, c[2] + b] : axis === "y" ? [c[0] + a, c[1], c[2] + b] : [c[0] + a, c[1] + b, c[2]],
    );
  }
  return out;
}

/** Points round an ellipse in the drawing. */
export const ellipsePoints = (cx: number, cy: number, rx: number, ry: number, steps = 14, from = 0, to = Math.PI * 2): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

/** A world point in the drawing. */
export const Pv = (p: V3) => P(p[0], p[1], p[2]);

// ── lit faces ───────────────────────────────────────────────────────

/** A face filled with a gradient running from `from` (light) to `to`. */
export function shaded(pts: V3[], fill: string, from: V3, to: V3, light = 0.16, dark = 0.24): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
}

/** The same with a brighter light and a softer shadow (dressed stone,
 *  timber, plate). */
export function lit(pts: V3[], fill: string, from: V3, to: V3, light = 0.18, dark = 0.22): Shape {
  return shaded(pts, fill, from, to, light, dark);
}

/** A filled outline of world points, its gradient running between two
 *  world points (lightest at `from`). */
export function filled(pts: V3[], colors: string[], from: V3, to: V3, stroke?: string): Shape {
  const fill = colors[Math.min(1, colors.length - 1)];
  return { ...poly(pts, fill, stroke), grad: { colors, from: P(...from), to: P(...to) } };
}

/** An outline filled with a gradient from `from` to `to`. */
export function gradPoly(pts: V3[], colors: string[], from: V3, to: V3, stroke: string | null = null, strokeWidth = 0.5): Shape {
  return {
    d: path(pts.map((p) => P(...p))),
    fill: colors[Math.floor(colors.length / 2)],
    grad: { colors, from: P(...from), to: P(...to) },
    ...(stroke ? { stroke, strokeWidth } : {}),
  };
}

/** A flat shape on the drawing with a linear gradient between two points. */
export const graded = (d: string, fill: string, from: Pt, to: Pt, light = 0.22, dark = 0.3, stroke?: string): Shape => ({
  d,
  fill,
  grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from, to },
  stroke: stroke ?? inkOf(fill),
  strokeWidth: 0.5,
});

/** The same with a radial gradient, lit from the upper left of a box. */
export const rounded = (d: string, fill: string, at: Pt, radius: number, stroke?: string): Shape => ({
  d,
  fill,
  grad: { colors: [tone(fill, 0.3), fill, tone(fill, -0.35)], from: [at[0] - radius * 0.35, at[1] - radius * 0.4], radius: radius * 1.5 },
  stroke: stroke ?? inkOf(fill),
  strokeWidth: 0.5,
});

// ── on a wall ───────────────────────────────────────────────────────

/** A back wall: "x" is the left wall (x = 0), "y" the right (y = 0). */
export type Wall = "x" | "y";
/** A point on a back wall, `off` out from it; u runs along the wall. */
export const onWall = (wall: Wall, u: number, z: number, off = 0): V3 =>
  wall === "x" ? [off, u, z] : [u, off, z];

/** A point on a wall-like plane: "x" is a plane of constant x (the left
 *  wall, u running along y), "y" a plane of constant y (the right wall,
 *  u running along x). `depth` is how far out from the plane. */
export const wallPoint =
  (wall: "x" | "y", depth = 0) =>
  (u: number, z: number): V3 =>
    wall === "x" ? [depth, u, z] : [u, depth, z];

/** A block standing against a back wall: `u` along it, `out` from it,
 *  `z` up; `wu`, `wo` and `h` its size those ways. */
export const wallBox = (wall: Wall, u: number, out: number, z: number, wu: number, wo: number, h: number, tones: Tones) =>
  wall === "x" ? box(out, u, z, wo, wu, h, tones) : box(u, out, z, wu, wo, h, tones);

/** Points round a circle on a back wall centred at (u, z), `r` round:
 *  `steps` of them, not closed. */
export function circleOn(wall: Wall, u: number, z: number, r: number, steps = 14): V3[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return onWall(wall, u + Math.cos(t) * r, z + Math.sin(t) * r);
  });
}

/** A circle standing on a wall-like plane, as points: centre `c`, radius
 *  `r`, from angle `a0` to `a1` (0 along +u, π/2 straight up). */
export function ringOn(wall: "x" | "y", c: V3, r: number, steps = 24, a0 = 0, a1 = Math.PI * 2): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps;
    const du = Math.cos(t) * r;
    const dz = Math.sin(t) * r;
    pts.push(wall === "x" ? [c[0], c[1] + du, c[2] + dz] : [c[0] + du, c[1], c[2] + dz]);
  }
  return pts;
}

/** A round thing on a wall plane (a dial, a bob, a plate) centred at
 *  `c`, `r` round, in `colors`, lit from the upper left. */
export function roundel(wall: "x" | "y", c: V3, r: number, colors: string[], stroke?: string): Shape {
  const [cx, cy] = P(...c);
  const fill = colors[1];
  return {
    ...poly(ringOn(wall, c, r), fill, stroke),
    grad: { colors, from: [cx - r * unit() * 0.4, cy - r * unit() * 0.45], radius: r * unit() * 1.5 },
  };
}

// ── small parts ─────────────────────────────────────────────────────

/** A path drawn pointing up from (0, 0) (a leaf, a frond) placed at a
 *  point of the drawing, turned by `angle` (radians, clockwise from up)
 *  and scaled. */
export function placed(d: string, [ox, oy]: Pt, angle: number, scale = 1): string {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_, a: string, b: string) => {
    const x = Number(a) * scale;
    const y = Number(b) * scale;
    return `${n(ox + x * c - y * s)} ${n(oy + x * s + y * c)}`;
  });
}

/** A leaf from a point of the drawing, turned by `angle`, `len` long and
 *  `width` wide (`lobes` > 0 serrates it): filled, with its midrib. */
export function leafAt(at: Pt, angle: number, len: number, width: number, tones: Tones = LEAF, lobes = 0): Shape[] {
  const d = lobes ? frond(len, width, lobes) : LEAF_PATH(len, width);
  const tip: Pt = [at[0] + Math.sin(angle) * len, at[1] - Math.cos(angle) * len];
  return [
    {
      d: placed(d, at, angle),
      fill: tones[1],
      grad: { colors: [tones[0], tones[1], tones[2]], from: at, to: tip },
      stroke: inkOf(tones[1]),
      strokeWidth: 0.45,
    },
    {
      d: `M${n(at[0])} ${n(at[1])} L${n(at[0] + (tip[0] - at[0]) * 0.85)} ${n(at[1] + (tip[1] - at[1]) * 0.85)}`,
      stroke: tone(tones[2], -0.3),
      strokeWidth: 0.4,
      opacity: 0.8,
    },
  ];
}

/** A jewel on a face at a world point, `size` 1 for a small one, in
 *  `stone` colours: a lit stone with a glint. */
export function jewel(at: V3, size: number, stone: readonly string[] = JEWELS.ruby): Shape[] {
  const [cx, cy] = P(...at);
  const r = size * unit() * 0.025;
  return [
    {
      d: oval(cx, cy, r, r),
      fill: stone[1],
      grad: { colors: [stone[0], stone[1], stone[2]], from: [cx - r * 0.35, cy - r * 0.4], radius: r * 1.4 },
      stroke: GOLD[2],
      strokeWidth: 0.6,
    },
    { d: oval(cx - r * 0.35, cy - r * 0.38, r * 0.28, r * 0.22), fill: "#FFFFFF", opacity: 0.85 },
  ];
}

/** The shadow a piece of w × d at (x, y) throws on the floor. */
export const shadowOf = (x: number, y: number, w: number, d: number): Shape =>
  tint(
    [
      [x + 0.02, y + 0.03, 0],
      [x + w + 0.05, y + 0.03, 0],
      [x + w + 0.05, y + d + 0.01, 0],
      [x + 0.02, y + d + 0.01, 0],
    ],
    INK.night,
    0.32,
  );

/** A round rod (rope, rail, rung): a dark edge, its colour, and a line
 *  of light along it. */
export function rod(pts: V3[], color: string, width = 1.4): Shape[] {
  return [
    line(pts, inkOf(color), width + 0.7),
    line(pts, color, width),
    { ...line(pts, tone(color, 0.5), Math.max(0.35, width * 0.3)), opacity: 0.75 },
  ];
}

/** A bolt head on a visible face: a small iron boss with a glint. */
export const bolt = (at: V3, size = 0.55): Shape[] => {
  const [cx, cy] = P(...at);
  const r = n(size * k());
  return [
    {
      d: `M${n(cx - r)} ${n(cy)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
      fill: IRONWORK[1],
      grad: { colors: [IRONWORK[0], IRONWORK[1], IRONWORK[2]], from: [cx - r * 0.4, cy - r * 0.4], radius: r * 1.5 },
      stroke: inkOf(IRONWORK[1]),
      strokeWidth: 0.4,
    },
  ];
};

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

// Engraved pieces for a snowed-in cabin and the places round it, built
// from the iso kit (components/iso/kit.ts) the house way: gradient fills
// lit from the upper left, dark ink outlines, a line of light, grain on
// wood. World units: x right-front, y left-front, z up. Generic enough to
// move into components/iso/furniture.ts once another game wants them.

import {
  INK,
  P,
  WOOD,
  ball,
  box,
  cylinder,
  flame,
  hoop,
  inkOf,
  line,
  n,
  path,
  poly,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { oval } from "@/components/iso/room";
import { IRONWORK } from "@/components/iso/furniture";

// ── palettes ────────────────────────────────────────────────────────

/** Rough bark on a log. */
export const BARK: Tones = ["#8A6446", "#5E4230", "#3E2A1E"];
/** A sawn log end: pale wood, mid, the colour of its rings. */
export const END_GRAIN: Tones = ["#F0D29C", "#D6AC6E", "#9E7240"];
/** Charred wood in a fire, its ends glowing. */
export const CHAR: Tones = ["#4A3426", "#2E2018", "#1C130E"];
export const EMBER: Tones = ["#FFD58A", "#F07A32", "#9A3A16"];
/** Field stones, warm grey. */
export const FIELDSTONE: Tones = ["#B9B2A6", "#8F887D", "#5F594F"];
/** Fresh snow, lit and in shade. */
export const SNOW: Tones = ["#FFFFFF", "#E4ECF6", "#A9B8CE"];
/** Pale pine boards (crates, fresh planks). */
export const PINE_BOARD: Tones = ["#D9B07A", "#B88A54", "#8A6236"];
/** Evergreen needles. */
export const NEEDLES: Tones = ["#5E8E68", "#36624A", "#1F3F30"];
/** Tin plate. */
export const TIN: Tones = ["#F4F6FA", "#C9D0DA", "#7A8494"];
/** Burlap. */
export const BURLAP: Tones = ["#E2C894", "#C4A46C", "#8E7046"];
/** Bread crust and crumb. */
export const CRUST: Tones = ["#E2A25E", "#B86E32", "#7A4420"];
export const CRUMB: Tones = ["#FBE8C0", "#EAD09A", "#C9A66A"];

/** Steel, for blades. */
const STEEL = { light: "#FFFFFF", mid: "#C9D0DA", dark: "#7A8494", ink: "#1E242C" };

// ── vector helpers ──────────────────────────────────────────────────

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / Math.hypot(...a));
/** Where the viewer is: a face is seen when its normal points this way. */
const EYE: V3 = [1, 1, 1];

const Pv = (p: V3) => P(p[0], p[1], p[2]);
const d2 = (pts: Pt[], close = true) => path(pts, close);

/** A circle of radius r round centre c, square to `axis`. */
function circle3(c: V3, r: number, axis: V3, steps = 14): V3[] {
  const u = norm(axis);
  const v = norm(Math.abs(u[2]) > 0.9 ? cross(u, [1, 0, 0]) : cross(u, [0, 0, 1]));
  const w = cross(u, v);
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return add(c, add(mul(v, r * Math.cos(t)), mul(w, r * Math.sin(t))));
  });
}

/** The convex hull of points in the drawing. */
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** A flat shape on the drawing with a linear gradient between two points. */
const graded = (d: string, fill: string, from: Pt, to: Pt, light = 0.22, dark = 0.3, stroke?: string): Shape => ({
  d,
  fill,
  grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from, to },
  stroke: stroke ?? inkOf(fill),
  strokeWidth: 0.5,
});

/** The same with a radial gradient, lit from the upper left of a box. */
const rounded = (d: string, fill: string, at: Pt, radius: number, stroke?: string): Shape => ({
  d,
  fill,
  grad: { colors: [tone(fill, 0.3), fill, tone(fill, -0.35)], from: [at[0] - radius * 0.35, at[1] - radius * 0.4], radius: radius * 1.5 },
  stroke: stroke ?? inkOf(fill),
  strokeWidth: 0.5,
});

/** A soft block (a pillow, a cushion, a folded blanket): the outline
 *  of a box with its corners rounded, lit from the upper left, a seam
 *  along its top's near edges. */
export function softBox(x: number, y: number, z: number, w: number, d: number, h: number, fill: string): Shape[] {
  const [X, Y, Z] = [x + w, y + d, z + h];
  const corners = hull(
    ([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z], [X, y, z], [X, Y, z], [x, Y, z]] as V3[]).map(Pv),
  );
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(corners[corners.length - 1], corners[0]);
  let d2s = `M${n(start[0])} ${n(start[1])}`;
  corners.forEach((c, i) => {
    const m = mid(c, corners[(i + 1) % corners.length]);
    d2s += ` Q${n(c[0])} ${n(c[1])} ${n(m[0])} ${n(m[1])}`;
  });
  const [cx, cy] = Pv([x + w * 0.3, y + d * 0.3, Z]);
  const seam = ([[x + w * 0.1, Y - d * 0.06, Z], [X - w * 0.06, Y - d * 0.06, Z], [X - w * 0.06, y + d * 0.1, Z]] as V3[]).map(Pv);
  return [
    { d: d2s + " Z", fill, grad: { colors: [tone(fill, 0.45), fill, tone(fill, -0.3)], from: [cx, cy], radius: Math.max(w, d) * unit() * 1.3 }, stroke: inkOf(fill), strokeWidth: 0.5 },
    { d: `M${n(seam[0][0])} ${n(seam[0][1])} Q${n(seam[1][0])} ${n(seam[1][1] + 0.6)} ${n(seam[2][0])} ${n(seam[2][1])}`, stroke: tone(fill, -0.22), strokeWidth: 0.45, opacity: 0.8 },
  ];
}

// ── logs, stones, snow ──────────────────────────────────────────────

/** A round log (pole, rolled blanket, baguette) lying from a to b with
 *  radius r: bark lit along its upper side, and the end the viewer sees
 *  sawn, with a growth ring. `detail` adds a bark line and the ring. */
export function logAt(
  a: V3,
  b: V3,
  r: number,
  { bark = BARK, cut = END_GRAIN, detail = true }: { bark?: Tones; cut?: Tones; detail?: boolean } = {},
): Shape[] {
  const axis = sub(b, a);
  const ends = [circle3(a, r, axis).map(Pv), circle3(b, r, axis).map(Pv)];
  const [pa, pb] = [Pv(a), Pv(b)];
  // the normal across the log in the drawing, pointing up (toward the light)
  let [nx, ny] = [-(pb[1] - pa[1]), pb[0] - pa[0]];
  const len = Math.hypot(nx, ny) || 1;
  [nx, ny] = [nx / len, ny / len];
  if (ny > 0 || (ny === 0 && nx > 0)) [nx, ny] = [-nx, -ny];
  const R = r * unit();
  const mid: Pt = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
  const shapes: Shape[] = [
    graded(d2(hull([...ends[0], ...ends[1]])), bark[1], [mid[0] + nx * R, mid[1] + ny * R], [mid[0] - nx * R, mid[1] - ny * R], 0.28, 0.4),
  ];
  // a line along the log, `off` radii toward the light (a shine) or away (a crack in the bark)
  const along = (off: number, from = 0.08, to = 0.92): Shape => ({
    d: d2(
      [add(a, mul(axis, from)), add(a, mul(axis, to))].map((p) => {
        const [x, y] = Pv(p);
        return [x + nx * R * off, y + ny * R * off] as Pt;
      }),
      false,
    ),
    stroke: off > 0 ? "#FFFFFF" : tone(bark[1], -0.45),
    strokeWidth: off > 0 ? 0.5 : 0.4,
    opacity: off > 0 ? 0.35 : 0.6,
  });
  if (detail && R > 1.2) shapes.push(along(-0.25, 0.12, 0.8));
  if (R > 1) shapes.push(along(0.6));
  // the sawn end that faces the viewer
  const seen = dot(axis, EYE) >= 0 ? 1 : 0;
  const cap = ends[seen];
  const at = seen ? pb : pa;
  shapes.push(rounded(d2(cap), cut[1], at, R, inkOf(bark[1])));
  if (detail && R > 1.6) {
    shapes.push({ d: d2(circle3(seen ? b : a, r * 0.55, axis, 10).map(Pv)), stroke: cut[2], strokeWidth: 0.4, opacity: 0.8 });
  }
  return shapes;
}

/** Firewood stacked along the floor: `rows` courses of logs lying along
 *  x from x0 to x1, the first course `count` logs across y from y0. */
export function logPile(x0: number, x1: number, y0: number, count: number, rows: number, r: number): Shape[] {
  const shapes: Shape[] = [];
  for (let row = 0; row < rows; row++) {
    const across = count - row;
    for (let i = 0; i < across; i++) {
      const y = y0 + r + r * row + i * r * 2;
      const z = r + row * r * 1.72;
      const wobble = ((i * 7 + row * 3) % 5) * 0.006;
      shapes.push(...logAt([x0 + wobble, y, z], [x1 - wobble * 0.5, y, z], r * (0.92 + ((i + row) % 3) * 0.05)));
    }
  }
  return shapes;
}

/** A field stone lying at a point: a flattened, lit pebble. */
export function stone(at: V3, r: number, tones: Tones = FIELDSTONE): Shape[] {
  const [cx, cy] = Pv(at);
  const rx = r * unit() * 1.15;
  const ry = r * unit() * 0.78;
  return [
    rounded(oval(cx, cy - ry * 0.4, rx, ry), tones[1], [cx, cy - ry * 0.4], Math.max(rx, ry), inkOf(tones[1])),
    { d: `M${n(cx - rx * 0.55)} ${n(cy - ry * 0.85)} Q${n(cx - rx * 0.1)} ${n(cy - ry * 1.25)} ${n(cx + rx * 0.35)} ${n(cy - ry * 1.05)}`, stroke: "#FFFFFF", strokeWidth: 0.45, opacity: 0.45 },
  ];
}

/** A soft heap of snow (a drift, a mound on a sill) centred on a world
 *  point: `rx` world units across, `h` high. */
export function mound(at: V3, rx: number, h: number, tones: Tones = SNOW): Shape[] {
  const [cx, cy] = Pv(at);
  const w = rx * unit() * 1.22;
  const ry = rx * unit() * 0.5;
  const top = h * unit();
  return [
    {
      d: `M${n(cx - w)} ${n(cy)} A${n(w)} ${n(ry)} 0 0 0 ${n(cx + w)} ${n(cy)} C${n(cx + w * 0.7)} ${n(cy - top * 1.1)} ${n(cx - w * 0.6)} ${n(cy - top * 1.35)} ${n(cx - w)} ${n(cy)} Z`,
      fill: tones[1],
      grad: { colors: [tones[0], tones[1], tones[2]], from: [cx - w * 0.3, cy - top], to: [cx + w * 0.6, cy + ry] },
      stroke: tone(tones[2], -0.3),
      strokeWidth: 0.45,
    },
  ];
}

/** A bank of snow piled against a plane x = at (the +x face of a plinth
 *  or wall), along y from y0 to y1: its ridge `h` high above `z`, its
 *  foot `reach` out from the face. Heaps up toward y1 (a corner). */
export function snowBankX(at: number, y0: number, y1: number, z: number, h: number, reach: number): Shape[] {
  const steps = 12;
  const ridge: V3[] = [];
  const foot: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = y0 + (y1 - y0) * t;
    const lump = Math.pow(Math.sin((t * Math.PI) / 2), 0.8) * (0.8 + 0.2 * Math.sin(t * 17));
    ridge.push([at + 0.004, y, z + h * lump]);
    foot.push([at + reach * lump, y, z]);
  }
  const pts = [...ridge, ...foot.reverse()].map(Pv);
  const [a, b] = [Pv([at, (y0 + y1) / 2, z + h]), Pv([at + reach, (y0 + y1) / 2, z])];
  return [
    { ...graded(d2(pts), SNOW[1], a, b, 0.6, 0.18), stroke: tone(SNOW[2], -0.25), strokeWidth: 0.45 },
    { d: d2(ridge.slice(1, -1).map(Pv), false), stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.8 },
  ];
}

/** The same against a plane y = at, along x from x0 to x1. */
export function snowBankY(at: number, x0: number, x1: number, z: number, h: number, reach: number): Shape[] {
  const steps = 12;
  const ridge: V3[] = [];
  const foot: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const lump = Math.pow(Math.sin((t * Math.PI) / 2), 0.8) * (0.8 + 0.2 * Math.sin(t * 13 + 1));
    ridge.push([x, at + 0.004, z + h * lump]);
    foot.push([x, at + reach * lump, z]);
  }
  const pts = [...ridge, ...foot.reverse()].map(Pv);
  const [a, b] = [Pv([(x0 + x1) / 2, at, z + h]), Pv([(x0 + x1) / 2, at + reach, z])];
  return [
    { ...graded(d2(pts), SNOW[1], a, b, 0.6, 0.12), stroke: tone(SNOW[2], -0.25), strokeWidth: 0.45 },
    { d: d2(ridge.slice(1, -1).map(Pv), false), stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.8 },
  ];
}

/** A cap of snow lying along the top of a block (a wall, a fence rail,
 *  a sill) from (x, y) to (x + w, y + d) at height z: a slab with a
 *  lumpy lip over its two visible edges. */
export function snowCap(x: number, y: number, w: number, d: number, z: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const lip = (from: V3, to: V3, seed: number): Shape => {
    const steps = Math.max(3, Math.round(Math.hypot(...sub(to, from)) * 14));
    const pts: V3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = add(from, mul(sub(to, from), t));
      pts.push([p[0], p[1], p[2] - h * (0.6 + 0.55 * Math.abs(Math.sin(t * 9 + seed)))]);
    }
    const top = [to, from];
    return { d: d2([...pts.map(Pv), ...top.map(Pv)]), fill: SNOW[1], stroke: tone(SNOW[2], -0.2), strokeWidth: 0.4 };
  };
  return [
    lip([x, Y, z], [X, Y, z], 0.4),
    lip([X, y, z], [X, Y, z], 2.1),
    {
      ...poly([[x, y, z + h * 0.5], [X, y, z + h * 0.5], [X, Y, z + h * 0.5], [x, Y, z + h * 0.5]], SNOW[0]),
      grad: { colors: ["#FFFFFF", SNOW[1]], from: Pv([x, y, z]), to: Pv([X, Y, z]) },
      stroke: tone(SNOW[2], -0.2),
      strokeWidth: 0.4,
    },
  ];
}

// ── the larder ──────────────────────────────────────────────────────

/** The near half of a band round an upright cylinder, between z1 and z2
 *  (a label round a tin, a strap round a barrel). */
export function bandAround(x: number, y: number, z1: number, z2: number, r: number, fill: string): Shape {
  const rx = r * unit() * 1.2247;
  const ry = r * unit() * 0.7071;
  const [bx, by] = P(x, y, z1);
  const [, ty] = P(x, y, z2);
  return {
    d: `M${n(bx - rx)} ${n(ty)} L${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} L${n(bx + rx)} ${n(ty)} A${n(rx)} ${n(ry)} 0 0 1 ${n(bx - rx)} ${n(ty)} Z`,
    fill,
    grad: { colors: [tone(fill, 0.25), fill, tone(fill, -0.35)], from: [bx - rx * 0.7, ty], to: [bx + rx, ty] },
    stroke: inkOf(fill),
    strokeWidth: 0.45,
  };
}

/** A tin can standing at (x, y, z): tin plate with a paper label. */
export function tin(x: number, y: number, z: number, r: number, h: number, label: string): Shape[] {
  return [
    ...cylinder(x, y, z, r, h, [TIN[0], TIN[1], TIN[2]]).slice(0, 2),
    bandAround(x, y, z + h * 0.18, z + h * 0.78, r, label),
    { ...line([[x - r * 0.3, y + r * 0.3, z + h * 0.48], [x + r * 0.5, y + r * 0.5, z + h * 0.48]], "#FFFFFF", 0.5), opacity: 0.55 },
  ];
}

/** A sack of grain or flour sitting at (x, y, z), `h` tall: a burlap
 *  belly, a tied neck with its frilled top, a fold down its side. */
export function sack(x: number, y: number, z: number, h: number, cloth: Tones = BURLAP, stripe?: string): Shape[] {
  const [cx, cy] = P(x, y, z);
  const s = h * unit();
  const w = s * 0.9;
  const neck = cy - s * 0.78;
  const shapes: Shape[] = [
    { d: oval(cx + s * 0.12, cy + s * 0.02, w * 0.6, s * 0.16), fill: INK.night, opacity: 0.3 },
    // the frill above the tie, behind the neck
    rounded(
      `M${n(cx - w * 0.13)} ${n(neck)} L${n(cx - w * 0.3)} ${n(cy - s)} L${n(cx - w * 0.08)} ${n(cy - s * 0.9)} L${n(cx + w * 0.06)} ${n(cy - s * 1.04)} L${n(cx + w * 0.26)} ${n(cy - s * 0.93)} L${n(cx + w * 0.13)} ${n(neck)} Z`,
      cloth[1],
      [cx, cy - s * 0.9],
      s * 0.3,
    ),
    rounded(
      `M${n(cx - w / 2)} ${n(cy - s * 0.2)} C${n(cx - w / 2)} ${n(cy + s * 0.08)} ${n(cx + w / 2)} ${n(cy + s * 0.08)} ${n(cx + w / 2)} ${n(cy - s * 0.2)} C${n(cx + w * 0.58)} ${n(cy - s * 0.56)} ${n(cx + w * 0.22)} ${n(neck + s * 0.05)} ${n(cx + w * 0.13)} ${n(neck)} L${n(cx - w * 0.13)} ${n(neck)} C${n(cx - w * 0.24)} ${n(neck + s * 0.05)} ${n(cx - w * 0.6)} ${n(cy - s * 0.56)} ${n(cx - w / 2)} ${n(cy - s * 0.2)} Z`,
      cloth[1],
      [cx - w * 0.1, cy - s * 0.42],
      s * 0.55,
    ),
  ];
  if (stripe) {
    const y1 = cy - s * 0.42;
    const y2 = cy - s * 0.3;
    shapes.push({
      d: `M${n(cx - w * 0.52)} ${n(y1)} Q${n(cx)} ${n(y1 + s * 0.1)} ${n(cx + w * 0.52)} ${n(y1)} L${n(cx + w * 0.53)} ${n(y2)} Q${n(cx)} ${n(y2 + s * 0.1)} ${n(cx - w * 0.53)} ${n(y2)} Z`,
      fill: stripe,
      opacity: 0.85,
    });
  }
  shapes.push(
    { d: `M${n(cx + w * 0.1)} ${n(neck + s * 0.06)} Q${n(cx + w * 0.3)} ${n(cy - s * 0.4)} ${n(cx + w * 0.22)} ${n(cy - s * 0.08)}`, stroke: tone(cloth[1], -0.4), strokeWidth: 0.45 },
    { d: `M${n(cx - w * 0.17)} ${n(neck + s * 0.02)} L${n(cx + w * 0.17)} ${n(neck + s * 0.02)}`, stroke: "#5A3A1E", strokeWidth: 0.9 },
    { d: `M${n(cx - w * 0.36)} ${n(cy - s * 0.42)} Q${n(cx - w * 0.36)} ${n(cy - s * 0.62)} ${n(cx - w * 0.2)} ${n(cy - s * 0.68)}`, stroke: "#FFFFFF", strokeWidth: 0.5, opacity: 0.45 },
  );
  return shapes;
}

/** A round loaf sitting at (x, y, z), `r` across: a domed crust with
 *  two scores. */
export function loaf(x: number, y: number, z: number, r: number): Shape[] {
  const [cx, cy] = P(x, y, z);
  const w = r * unit() * 1.22;
  const ry = r * unit() * 0.7;
  const h = r * unit() * 0.95;
  return [
    rounded(
      `M${n(cx - w)} ${n(cy)} A${n(w)} ${n(ry)} 0 0 0 ${n(cx + w)} ${n(cy)} C${n(cx + w)} ${n(cy - h * 1.25)} ${n(cx - w)} ${n(cy - h * 1.25)} ${n(cx - w)} ${n(cy)} Z`,
      CRUST[1],
      [cx, cy - h * 0.5],
      w,
    ),
    { d: `M${n(cx - w * 0.5)} ${n(cy - h * 0.55)} Q${n(cx - w * 0.1)} ${n(cy - h * 0.95)} ${n(cx + w * 0.25)} ${n(cy - h * 0.75)}`, stroke: CRUMB[1], strokeWidth: 0.8 },
    { d: `M${n(cx - w * 0.15)} ${n(cy - h * 0.25)} Q${n(cx + w * 0.25)} ${n(cy - h * 0.62)} ${n(cx + w * 0.6)} ${n(cy - h * 0.42)}`, stroke: CRUMB[1], strokeWidth: 0.8 },
  ];
}

/** A long loaf lying along x from x to x + len, scored across its top. */
export function baguette(x: number, y: number, z: number, len: number, r: number): Shape[] {
  const shapes = logAt([x, y, z + r], [x + len, y, z + r], r, { bark: CRUST, cut: CRUMB, detail: false });
  for (const f of [0.28, 0.5, 0.72]) {
    const u = x + len * f;
    shapes.push(line([[u - 0.012, y - r * 0.4, z + r * 1.9], [u + 0.012, y + r * 0.5, z + r * 1.8]], CRUMB[1], 0.7));
  }
  return shapes;
}

/** A wheel of cheese in red wax, a wedge's worth of pale cut on top. */
export function cheese(x: number, y: number, z: number, r: number, h: number): Shape[] {
  return [...cylinder(x, y, z, r, h, ["#F2CC5A", "#B8323A", "#7A1E26"]), hoop(x, y, z + h * 0.5, r, "#7A1E26")];
}

/** An open crate of pale boards at (x, y, z): slats on its two visible
 *  sides, and `fruit` colours heaped in its top (none: an empty crate
 *  with its lid on). */
export function crate(x: number, y: number, z: number, w: number, d: number, h: number, fruit: string[] = []): Shape[] {
  const X = x + w;
  const Y = y + d;
  const shapes: Shape[] = [...box(x, y, z, w, d, h, PINE_BOARD)];
  for (const f of [0.34, 0.67]) {
    shapes.push(
      line([[x + 0.004, Y, z + h * f], [X - 0.004, Y, z + h * f]], tone(PINE_BOARD[1], -0.45), 0.45),
      line([[X, y + 0.004, z + h * f], [X, Y - 0.004, z + h * f]], tone(PINE_BOARD[2], -0.45), 0.45),
    );
  }
  // corner battens
  shapes.push(
    line([[x + 0.008, Y, z], [x + 0.008, Y, z + h]], tone(PINE_BOARD[1], -0.3), 1),
    line([[X - 0.006, Y, z], [X - 0.006, Y, z + h]], tone(PINE_BOARD[1], -0.3), 1),
  );
  if (fruit.length) {
    shapes.push({ ...poly([[x + 0.008, y + 0.008, z + h], [X - 0.008, y + 0.008, z + h], [X - 0.008, Y - 0.008, z + h], [x + 0.008, Y - 0.008, z + h]], "#3A2414") });
    const r = Math.min(w, d) * 0.2;
    const spots: [number, number][] = [[0.3, 0.3], [0.7, 0.3], [0.5, 0.55], [0.3, 0.75], [0.72, 0.74]];
    spots.forEach(([fx, fy], i) => {
      shapes.push(ball([x + w * fx, y + d * fy, z + h + r * 0.6], r * 40, fruit[i % fruit.length], inkOf(fruit[i % fruit.length])));
    });
  }
  return shapes;
}

// ── light ───────────────────────────────────────────────────────────

/** A storm lantern standing at (x, y, z), `h` tall: an iron base and
 *  cap, a glass with a flame in it, a wire bail. */
export function lantern(x: number, y: number, z: number, h: number, accent: string): Shape[] {
  const r = h * 0.3;
  const [cx] = P(x, y, z + h);
  const [, topY] = P(x, y, z + h * 1.08);
  const rx = r * unit() * 1.2247;
  return [
    ...cylinder(x, y, z, r * 1.05, h * 0.14, IRONWORK).slice(0, 2),
    ...cylinder(x, y, z + h * 0.14, r * 0.8, h * 0.56, ["#FFE9B8", "#F2C46A", "#C98A3A"]).slice(0, 2).map((s) => ({ ...s, opacity: 0.7 })),
    line([[x - r * 0.8, y, z + h * 0.14], [x - r * 0.8, y, z + h * 0.7]], IRONWORK[1], 0.6),
    line([[x + r * 0.8, y + r * 0.2, z + h * 0.14], [x + r * 0.8, y + r * 0.2, z + h * 0.7]], IRONWORK[1], 0.6),
    ...flame([x, y, z + h * 0.2], h * 22, accent),
    ...cylinder(x, y, z + h * 0.7, r * 1.0, h * 0.12, IRONWORK).slice(0, 2),
    ...cylinder(x, y, z + h * 0.82, r * 0.45, h * 0.12, IRONWORK).slice(0, 2),
    { d: `M${n(cx - rx * 0.9)} ${n(topY + h * unit() * 0.1)} Q${n(cx)} ${n(topY - h * unit() * 0.42)} ${n(cx + rx * 0.9)} ${n(topY + h * unit() * 0.1)}`, stroke: IRONWORK[0], strokeWidth: 0.6 },
  ];
}

// ── on the walls ────────────────────────────────────────────────────

/** A point on a back wall: `wall` "x" is the left wall (x = 0, u along
 *  y), "y" the right wall (y = 0, u along x); `off` steps into the room. */
const onWall = (wall: "x" | "y", u: number, z: number, off = 0.004): V3 => (wall === "x" ? [off, u, z] : [u, off, z]);

/** An axe hung on two pegs on a back wall: a hickory handle from (u1, z1)
 *  up to (u2, z2) and a steel head at the top, its edge shining. */
export function axeOnWall(wall: "x" | "y", u1: number, z1: number, u2: number, z2: number): Shape[] {
  const at = (u: number, z: number, off = 0.006) => Pv(onWall(wall, u, z, off));
  const len = Math.hypot(u2 - u1, z2 - z1);
  const [du, dz] = [(u2 - u1) / len, (z2 - z1) / len];
  const [pu, pz] = [-dz, du];
  const t = 0.009;
  const handle = [at(u1 + pu * t, z1 + pz * t), at(u2 + pu * t, z2 + pz * t), at(u2 - pu * t, z2 - pz * t), at(u1 - pu * t, z1 - pz * t)];
  // the head at the top end, in (along, across) the handle: the eye
  // round the handle, the cheek widening to a curved edge
  const local = (s: number, p: number) => at(u2 + du * s + pu * p, z2 + dz * s + pz * p);
  const head = [
    local(0.012, -0.018),
    local(0.012, 0.02),
    local(0.03, 0.068),
    local(0.0, 0.082),
    local(-0.045, 0.074),
    local(-0.03, 0.02),
    local(-0.03, -0.018),
  ];
  return [
    ball(onWall(wall, u1 + (u2 - u1) * 0.3, z1 + (z2 - z1) * 0.3 - 0.02, 0.01), 0.9, WOOD[2], inkOf(WOOD[2])),
    ball(onWall(wall, u1 + (u2 - u1) * 0.72, z1 + (z2 - z1) * 0.72 - 0.02, 0.01), 0.9, WOOD[2], inkOf(WOOD[2])),
    graded(d2(handle), "#B98A55", handle[0], handle[2], 0.3, 0.35),
    graded(d2(head), STEEL.mid, head[0], head[3], 0.5, 0.35, STEEL.ink),
    { d: d2([head[2], head[3], head[4]], false), stroke: "#FFFFFF", strokeWidth: 0.7, opacity: 0.85 },
  ];
}

/** A snowshoe hung on a back wall: a bent-wood oval frame centred at
 *  (u, z), `a` long and `b` wide, tilted `tilt` radians, laced across
 *  with rawhide. */
export function snowshoeOnWall(wall: "x" | "y", u: number, z: number, a: number, b: number, tilt: number): Shape[] {
  const [c, s] = [Math.cos(tilt), Math.sin(tilt)];
  const local = (p: number, q: number) => Pv(onWall(wall, u + p * c - q * s, z + p * s + q * c, 0.006));
  const rim = Array.from({ length: 20 }, (_, i) => {
    const t = (i / 20) * Math.PI * 2;
    // a teardrop: fuller at the toe, a tail at the heel
    const p = a * Math.cos(t);
    const q = b * Math.sin(t) * (Math.cos(t) < 0 ? 0.55 + 0.45 * (1 + Math.cos(t)) : 1);
    return local(p, q);
  });
  const lace: Shape[] = [];
  for (const f of [-0.45, -0.1, 0.25, 0.55]) {
    const half = b * Math.sqrt(Math.max(0, 1 - f * f)) * (f < 0 ? 0.55 + 0.45 * (1 + f) : 1) * 0.92;
    lace.push({ d: d2([local(a * f, -half), local(a * f, half)], false), stroke: "#E8D6A8", strokeWidth: 0.45, opacity: 0.9 });
  }
  for (const q of [-0.4, 0, 0.4]) {
    lace.push({ d: d2([local(-a * 0.75, b * q * 0.6), local(a * 0.85, b * q)], false), stroke: "#E8D6A8", strokeWidth: 0.45, opacity: 0.9 });
  }
  return [
    { d: d2(rim), fill: "#2A1C12", opacity: 0.35 },
    ...lace,
    { d: d2(rim), stroke: "#3A2408", strokeWidth: 2.2 },
    { d: d2(rim), stroke: "#C99A5E", strokeWidth: 1.2 },
    { d: d2([local(a * 0.05, -b * 0.5), local(a * 0.05, b * 0.5)], false), stroke: "#5A3A1E", strokeWidth: 1.4 },
  ];
}

// ── outdoors ────────────────────────────────────────────────────────

/** A snowy pine standing at (x, y, z), `h` tall and `r` round at its
 *  foot: a stub of trunk and three tiers of needles, each capped with
 *  snow on its upper half. */
export function pine(x: number, y: number, z: number, h: number, r: number): Shape[] {
  const shapes: Shape[] = [
    { d: oval(...P(x + r * 0.5, y + r * 0.3, z), r * unit() * 1.1, r * unit() * 0.5), fill: INK.night, opacity: 0.25 },
    ...box(x - r * 0.12, y - r * 0.12, z, r * 0.24, r * 0.24, h * 0.18, WOOD),
  ];
  const tiers = [
    { z0: 0.14, z1: 0.62, rr: 1 },
    { z0: 0.38, z1: 0.84, rr: 0.74 },
    { z0: 0.6, z1: 1, rr: 0.48 },
  ];
  for (const { z0, z1, rr } of tiers) {
    const [ax, ay] = P(x, y, z + h * z1);
    const [bx, by] = P(x, y, z + h * z0);
    const rx = r * rr * unit() * 1.2247;
    const ry = r * rr * unit() * 0.7071;
    shapes.push({
      d: `M${n(ax)} ${n(ay)} L${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} Z`,
      fill: NEEDLES[1],
      grad: { colors: [NEEDLES[0], NEEDLES[1], NEEDLES[2]], from: [bx - rx * 0.7, ay], to: [bx + rx, by] },
      stroke: inkOf(NEEDLES[1]),
      strokeWidth: 0.5,
    });
    // the snow on its upper part, its lower edge hanging in scallops
    const f = 0.55;
    const sy = ay + (by - ay) * f;
    const sx = rx * f;
    let d = `M${n(ax)} ${n(ay)} L${n(bx - sx)} ${n(sy)}`;
    const bumps = 4;
    for (let i = 0; i < bumps; i++) {
      const x1 = bx - sx + ((i + 0.5) / bumps) * sx * 2;
      const x2 = bx - sx + ((i + 1) / bumps) * sx * 2;
      const dip = sy + ry * f * 0.9 * Math.sin(((i + 0.5) / bumps) * Math.PI) + 1.2;
      d += ` Q${n(x1)} ${n(dip)} ${n(x2)} ${n(sy + ry * f * 0.6 * Math.sin(((i + 1) / bumps) * Math.PI))}`;
    }
    shapes.push({
      d: d + " Z",
      fill: SNOW[1],
      grad: { colors: ["#FFFFFF", SNOW[1], SNOW[2]], from: [bx - sx, ay], to: [bx + sx, sy] },
      stroke: tone(SNOW[2], -0.25),
      strokeWidth: 0.4,
    });
  }
  return shapes;
}

/** A post-and-rail fence along x at y, from x0 to x1, snow on its rails
 *  and on each post's top. */
export function fenceX(x0: number, x1: number, y: number, posts: number, h: number): Shape[] {
  const shapes: Shape[] = [];
  const t = 0.022;
  const rail = (z: number) => [
    ...box(x0, y, z, x1 - x0, t * 0.6, t * 0.8, WOOD),
    ...snowCap(x0, y - 0.003, x1 - x0, t * 0.6 + 0.006, z + t * 0.8, 0.012),
  ];
  for (let i = 0; i < posts; i++) {
    const x = x0 + ((x1 - x0 - t) * i) / (posts - 1);
    shapes.push(...box(x, y - t * 0.2, 0, t, t, h, WOOD), ...mound([x + t / 2, y + t / 2, h], 0.014, 0.012));
  }
  shapes.push(...rail(h * 0.35), ...rail(h * 0.75));
  return shapes;
}

/** Icicles hanging from an edge (from a to b in the world), `count` of
 *  them, the longest `len` long. */
export function icicles(a: V3, b: V3, count: number, len: number): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const p = add(a, mul(sub(b, a), t));
    const l = len * (0.45 + 0.55 * Math.abs(Math.sin(i * 2.3 + 1)));
    const w = 0.008;
    const pts = [Pv([p[0] - w, p[1] + w, p[2]]), Pv([p[0] + w, p[1] - w, p[2]]), Pv([p[0], p[1], p[2] - l])];
    shapes.push({ d: d2(pts), fill: "#DCEBFF", stroke: "#7E9CC4", strokeWidth: 0.35 });
  }
  return shapes;
}


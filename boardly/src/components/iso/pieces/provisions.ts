// Food and its keeping: crates, sacks, tins, jars, bread and cheese,
// vegetables, onions and herbs hung to dry.

import {
  ball,
  box,
  cylinder,
  hoop,
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
import { BRASS, BURLAP, CRUMB, CRUST, IRONWORK, PINE, PINE_BOARD, TIN } from "./materials";
import { hull, leafAt, rounded, shaded, strokes } from "./helpers";
import { logAt } from "./outdoor";

/** A shipping crate at (x, y, z), w × d × h in `tones`: boards across its faces, a frame round each face, a
 *  diagonal brace, iron edging nailed down the near corner. */
export function shippingCrate(x: number, y: number, z: number, w: number, d: number, h: number, tones: Tones = PINE): Shape[] {
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  const e = 0.016;
  const seam = tone(tones[1], -0.45);
  const shapes: Shape[] = [
    ...(z === 0 ? [tint([[x + 0.02, y + 0.03, 0], [X + 0.05, y + 0.03, 0], [X + 0.05, Y + 0.01, 0], [x + 0.02, Y + 0.01, 0]], INK.night, 0.32)] : []),
    ...box(x, y, z, w, d, h, tones),
  ];
  const boards: V3[][] = [];
  for (const f of [0.34, 0.67]) {
    boards.push([[x + e, Y, z + h * f], [X - e, Y, z + h * f]], [[X, y + e, z + h * f], [X, Y - e, z + h * f]]);
    boards.push([[x + w * f, y + e, Z], [x + w * f, Y - e, Z]]);
  }
  // the frame boards round each face
  boards.push(
    [[x + e, Y, z + e], [X - e, Y, z + e], [X - e, Y, Z - e], [x + e, Y, Z - e], [x + e, Y, z + e]],
    [[X, y + e, z + e], [X, Y - e, z + e], [X, Y - e, Z - e], [X, y + e, Z - e], [X, y + e, z + e]],
  );
  shapes.push(strokes(boards, seam, 0.45, 0.8));
  // a brace across the front
  shapes.push(
    shaded([[x + e, Y + 0.001, z + e], [x + e + 0.03, Y + 0.001, z + e], [X - e, Y + 0.001, Z - e], [X - e - 0.03, Y + 0.001, Z - e]], tones[1], [x, Y, Z], [X, Y, z], 0.18, 0.1),
  );
  // iron edging down the near corner, nailed
  const iron = tone(IRONWORK[0], 0.1);
  shapes.push(
    shaded([[X - 0.022, Y + 0.002, z], [X, Y + 0.002, z], [X, Y + 0.002, Z], [X - 0.022, Y + 0.002, Z]], iron, [X - 0.022, Y, Z], [X, Y, z], 0.25, 0.25),
    shaded([[X + 0.002, Y - 0.022, z], [X + 0.002, Y, z], [X + 0.002, Y, Z], [X + 0.002, Y - 0.022, Z]], IRONWORK[1], [X, Y - 0.022, Z], [X, Y, z], 0.15, 0.3),
    ...[0.2, 0.5, 0.8].map((f) => ball([X - 0.011, Y + 0.003, z + h * f], 0.28, IRONWORK[2])),
  );
  return shapes;
}

/** An open crate of pale boards at (x, y, z): slats on its two visible
 *  sides, and `fruit` colours heaped in its top (none: an empty crate
 *  with its lid on). */
export function fruitCrate(x: number, y: number, z: number, w: number, d: number, h: number, fruit: string[] = []): Shape[] {
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

/** A crate of vegetables at (x, y), w × d × h: cabbages, turnips and carrots heaped on top. */
export function vegCrate(x: number, y: number, w: number, d: number, h: number): Shape[] {
  return [
    ...shippingCrate(x, y, 0, w, d, h),
    dome([x + w * 0.35, y + d * 0.3, h], 0.034, 0.034, 0.045, ["#C4E09A", "#7FA65A", "#3E6A2E"]),
    ...carrot([x + w * 0.65, y + d * 0.25, h + 0.012], 0.6, 0.8),
    ball([x + w * 0.72, y + d * 0.55, h + 0.02], 0.8, "#F0E6F0", "#6A3A5A"),
    ball([x + w * 0.4, y + d * 0.68, h + 0.022], 0.85, "#E8D8E8", "#6A3A5A"),
    ...carrot([x + w * 0.25, y + d * 0.75, h + 0.01], 0.9, 0.2),
    dome([x + w * 0.7, y + d * 0.82, h], 0.03, 0.03, 0.04, ["#B8D88A", "#6E9A4A", "#355E26"]),
    ball([x + w * 0.52, y + d * 0.92, h + 0.016], 0.7, "#D49A48", "#6A4418"),
  ];
}

/** A grain sack slumped on a floor point `at`, its neck tied with cord:
 *  drawn facing the viewer in `fill`, `size` in drawing units at 40 per
 *  room, leaning by `lean`. */
export function grainSack(at: V3, size: number, fill: string, lean = 0): Shape[] {
  const [cx, by] = P(...at);
  const w = size * k();
  const h = w * 1.45;
  const L = lean * w;
  const p = (u: number, v: number) => `${n(cx + u * w + L * v)} ${n(by - v * h)}`;
  const edge = inkOf(fill);
  return [
    { d: `M${p(-1.1, -0.05)} A${n(w * 1.15)} ${n(w * 0.4)} 0 1 0 ${p(1.15, -0.05)} A${n(w * 1.15)} ${n(w * 0.4)} 0 1 0 ${p(-1.1, -0.05)} Z`, fill: INK.night, opacity: 0.35 },
    {
      d: `M${p(-0.95, 0.12)} C${p(-1.1, 0.62)} ${p(-0.55, 0.9)} ${p(-0.2, 0.94)} L${p(0.2, 0.94)} C${p(0.62, 0.9)} ${p(1.1, 0.62)} ${p(0.95, 0.12)} Q${p(0, -0.14)} ${p(-0.95, 0.12)} Z`,
      fill,
      grad: { colors: [tone(fill, 0.3), fill, tone(fill, -0.42)], from: [cx - w * 0.4, by - h * 0.62], radius: w * 1.6 },
      stroke: edge,
      strokeWidth: 0.6,
    },
    {
      d: `M${p(-0.2, 0.94)} L${p(-0.38, 1.2)} Q${p(-0.05, 1.08)} ${p(0.06, 1.24)} Q${p(0.2, 1.1)} ${p(0.4, 1.18)} L${p(0.2, 0.94)} Z`,
      fill: tone(fill, -0.06),
      stroke: edge,
      strokeWidth: 0.5,
    },
    { d: `M${p(-0.26, 0.96)} Q${p(0, 0.9)} ${p(0.26, 0.96)}`, stroke: "#6E4A26", strokeWidth: 1.1 },
    {
      d: `M${p(-0.5, 0.78)} Q${p(-0.3, 0.45)} ${p(-0.45, 0.15)} M${p(0.35, 0.82)} Q${p(0.5, 0.5)} ${p(0.25, 0.2)} M${p(-0.15, 0.5)} Q${p(0, 0.35)} ${p(0.12, 0.42)}`,
      stroke: edge,
      strokeWidth: 0.45,
      opacity: 0.6,
    },
  ];
}

/** A sack of grain or flour sitting at (x, y, z), `h` tall: a burlap
 *  belly, a tied neck with its frilled top, a fold down its side. */
export function burlapSack(x: number, y: number, z: number, h: number, cloth: Tones = BURLAP, stripe?: string): Shape[] {
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

/** A glass jar standing at (x, y, z): its body tinted by what's inside,
 *  a gleam, a brass lid. */
export function jar(x: number, y: number, z: number, r: number, h: number, inside: string): Shape[] {
  return [
    ...cylinder(x, y, z, r, h, [tone(inside, 0.2), inside, tone(inside, -0.3)]),
    ...cylinder(x, y, z + h, r * 0.82, h * 0.16, BRASS),
  ];
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

/** A wheel of cheese at (x, y, z), `r` round and `h` tall, in red wax, a wedge's worth of pale cut on top. */
export function cheese(x: number, y: number, z: number, r: number, h: number): Shape[] {
  return [...cylinder(x, y, z, r, h, ["#F2CC5A", "#B8323A", "#7A1E26"]), hoop(x, y, z + h * 0.5, r, "#7A1E26")];
}

/** A dome (a loaf, a cabbage, a heap) on z: the upper half of an
 *  ellipsoid with semi-axes a (x), b (y), c (z), lit from the upper left. */
export function dome(at: V3, a: number, b: number, c: number, tones: string[]): Shape {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    for (const v of [0, 0.4, 0.8, 1.2, Math.PI / 2]) {
      pts.push(P(at[0] + Math.cos(t) * Math.cos(v) * a, at[1] + Math.sin(t) * Math.cos(v) * b, at[2] + Math.sin(v) * c));
    }
  }
  const outline = hull(pts);
  const [cx, cy] = P(at[0], at[1], at[2] + c * 0.6);
  const s = Math.max(a, b) * unit();
  return {
    d: path(outline),
    fill: tones[1],
    grad: { colors: tones, from: [cx - s * 0.45, cy - s * 0.35], radius: s * 1.5 },
    stroke: tone(tones[1], -0.6),
    strokeWidth: 0.5,
  };
}

/** A carrot lying on a surface: an orange taper from `at` to its tip,
 *  green leaves out of its top. */
export function carrot(at: V3, dx: number, dy: number, len = 0.06): Shape[] {
  const [x, y, z] = at;
  const nx = -dy * 0.008;
  const ny = dx * 0.008;
  const tip: V3 = [x + dx * len, y + dy * len, z];
  return [
    strokes([-0.5, 0, 0.5].map((a): V3[] => [[x, y, z + 0.006], [x - dx * 0.025 + a * dy * 0.02, y - dy * 0.025 - a * dx * 0.02, z + 0.01]]), LEAF[0], 0.7),
    shaded([[x + nx, y + ny, z + 0.006], [x - nx, y - ny, z + 0.006], tip], "#E8782A", [x, y, z + 0.01], tip, 0.25, 0.2),
  ];
}

/** A string of `count` onions in `skin` hung from a hook at (x, y, z). */
export function onions(x: number, y: number, z: number, count: number, skin = "#C8843A"): Shape[] {
  const shapes: Shape[] = [line([[x, y, z], [x, y, z - 0.03 - count * 0.024]], "#C9A46A", 0.9)];
  for (let i = 0; i < count; i++) {
    const s = i % 2 ? 1 : -1;
    shapes.push(ball([x, y + s * 0.012, z - 0.03 - i * 0.024], 0.72 - i * 0.03, i % 3 === 2 ? tone(skin, 0.2) : skin, tone(skin, -0.6)));
  }
  return shapes;
}

/** A bundle of herbs hung upside down to dry from `at`, `size` 1 for a
 *  small one. */
export function herbs(at: V3, size: number, tones: Tones = LEAF): Shape[] {
  const [cx, cy] = P(...at);
  const s = size * unit() * 0.01;
  const tie: Pt = [cx, cy + 2.2 * s];
  const shapes: Shape[] = [{ d: `M${cx} ${cy} L${tie[0]} ${tie[1]}`, stroke: "#C9A46A", strokeWidth: 0.6 }];
  for (const a of [Math.PI - 0.45, Math.PI + 0.45, Math.PI - 0.15, Math.PI + 0.18]) {
    shapes.push(...leafAt(tie, a, 6.5 * s, 1.7 * s, tones));
  }
  shapes.push({ d: `M${tie[0] - 1.2 * s} ${tie[1] + 0.4 * s} L${tie[0] + 1.2 * s} ${tie[1] + 0.2 * s}`, stroke: "#A8323C", strokeWidth: 1.1 });
  return shapes;
}

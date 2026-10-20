// Out of doors: hedges and a gravel court, a fruit tree, flowers and a
// garden urn, a well, a garden bench; and in the snow, a pine, a fence,
// icicles, logs, field stones, drifts and caps of snow.

import {
  ball,
  box,
  cylinder,
  DOOR,
  flat,
  hoop,
  INK,
  inkOf,
  k,
  line,
  LOCK,
  n,
  P,
  path,
  poly,
  tone,
  unit,
  WOOD,
  type Door,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { disc, oval, tint } from "../room";
import {
  ASHLAR,
  BARK,
  BRASS,
  END_GRAIN,
  FIELDSTONE,
  IRONWORK,
  NEEDLES,
  SHINGLE,
  SNOW,
  YEW,
} from "./materials";
import { graded, hull, Pv, ring3, rnd, rounded, shaded, strokes } from "./helpers";
import { lathe } from "./turned";

const TAU = Math.PI * 2;

const DEG = Math.PI / 180;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / Math.hypot(...a));
/** Where the viewer is: a face is seen when its normal points this way. */
const EYE: V3 = [1, 1, 1];

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

// ── the garden ──────────────────────────────────────────────────────

/** A round clump of leaves in the drawing: a scalloped outline. */
function clump(cx: number, cy: number, r: number, bumps: number, seed: number): string {
  const pts: Pt[] = [];
  const rot = rnd(seed) * TAU;
  for (let i = 0; i < bumps; i++) {
    const a = rot + (i / bumps) * TAU;
    const rr = r * (0.9 + rnd(seed + i) * 0.14);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]);
  }
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < bumps; i++) {
    const a = rot + ((i + 0.5) / bumps) * TAU;
    const bulge = r * (1.22 + rnd(seed * 3 + i) * 0.12);
    const [qx, qy] = [cx + Math.cos(a) * bulge, cy + Math.sin(a) * bulge * 0.9];
    const [ex, ey] = pts[(i + 1) % bumps];
    d += ` Q${n(qx)} ${n(qy)} ${n(ex)} ${n(ey)}`;
  }
  return d + " Z";
}

/** Little leaf marks scattered over a clump: short arcs. */
function leafMarks(cx: number, cy: number, r: number, count: number, seed: number, side: "lit" | "shade"): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    // lit marks gather to the upper left, shaded ones to the lower right
    const a = (side === "lit" ? -150 : 30) * DEG + (rnd(seed + i * 2) - 0.5) * 2.2;
    const f = 0.25 + rnd(seed + i * 5) * 0.62;
    const [x, y] = [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f * 0.9];
    const s = r * 0.13;
    d += ` M${n(x - s)} ${n(y)} Q${n(x)} ${n(y + s * 0.9)} ${n(x + s)} ${n(y - s * 0.2)}`;
  }
  return d;
}

/** A clipped hedge along a back edge (the left, x = 0, or the right,
 *  y = 0), `thick` deep and `h` high, with a gateway between stone
 *  posts where there's a way out: open, a red iron gate locked for the
 *  night, or boarded up. The posts carry stone balls, or urns of
 *  `flowers` when given. */
export function hedge(wall: "x" | "y", door: Door | null, flowers?: string[], h = 0.27, thick = 0.1): Shape[] {
  const [a, b] = DOOR;
  const t0 = -thick / 2;
  const block = (from: number, to: number, z0: number, hh: number, tones: Tones, inset = 0) =>
    wall === "x"
      ? box(t0 + inset, from, z0, thick - inset * 2, to - from, hh, tones)
      : box(from, t0 + inset, z0, to - from, thick - inset * 2, hh, tones);
  const at = (u: number, z: number, depth = thick / 2): V3 => (wall === "x" ? [depth, u, z] : [u, depth, z]);
  /** One clipped stretch: the block, a leafy edge along its top, and
   *  leaf marks over its face. */
  const stretch = (from: number, to: number): Shape[] => {
    if (to - from < 0.02) return [];
    const shapes = block(from, to, 0, h, YEW);
    let bumps = "";
    let crest = "";
    let dark = "";
    let lit = "";
    const steps = Math.max(2, Math.round((to - from) / 0.028));
    for (let i = 0; i <= steps; i++) {
      const u = from + ((to - from) * i) / steps;
      const [x, y] = P(...at(u, h));
      const r = (0.9 + rnd(i * 3 + from * 50) * 0.5) * k();
      bumps += ` M${n(x - r)} ${n(y)} a${n(r)} ${n(r * 0.8)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r * 0.8)} 0 1 0 ${n(-2 * r)} 0 Z`;
      crest += ` M${n(x - r)} ${n(y)} a${n(r)} ${n(r * 0.8)} 0 0 1 ${n(2 * r)} 0`;
    }
    const count = Math.round((to - from) * 70);
    for (let i = 0; i < count; i++) {
      const u = from + rnd(i * 7 + from * 31) * (to - from);
      const z = 0.02 + rnd(i * 11 + from * 17) * (h - 0.05);
      const [x, y] = P(...at(u, z));
      const s = 1.1 * k();
      const mark = ` M${n(x - s)} ${n(y)} Q${n(x)} ${n(y + s)} ${n(x + s)} ${n(y - s * 0.2)}`;
      if (rnd(i * 13 + 5) < 0.45 && z > h * 0.4) lit += mark;
      else dark += mark;
    }
    // marks across the top
    const topCount = Math.round((to - from) * 30);
    for (let i = 0; i < topCount; i++) {
      const u = from + rnd(i * 9 + 3 + from * 7) * (to - from);
      const dep = t0 + 0.015 + rnd(i * 5 + 1) * (thick - 0.03);
      const [x, y] = P(...at(u, h, dep));
      const s = 1.1 * k();
      lit += ` M${n(x - s)} ${n(y)} Q${n(x)} ${n(y + s * 0.8)} ${n(x + s)} ${n(y - s * 0.2)}`;
    }
    shapes.push(
      { d: dark, stroke: tone(YEW[2], -0.4), strokeWidth: 0.45, opacity: 0.75 },
      { d: lit, stroke: tone(YEW[0], 0.35), strokeWidth: 0.45, opacity: 0.7 },
      { d: bumps, fill: YEW[0], grad: { colors: [tone(YEW[0], 0.2), YEW[0]], from: P(...at(from, h + 0.03)), to: P(...at(to, h)) } },
      { d: crest, stroke: inkOf(YEW[0]), strokeWidth: 0.45, opacity: 0.85 },
    );
    return shapes;
  };
  const start = wall === "x" ? -thick / 2 : thick / 2;
  if (!door) return stretch(start, 1);
  const post = 0.07;
  /** A stone gatepost: a plinth, a shaft, a moulded cap and a ball. */
  const gatepost = (u: number): Shape[] => {
    const [x, y] = wall === "x" ? [-post / 2, u - post / 2] : [u - post / 2, -post / 2];
    const c: V3 = wall === "x" ? [0, u, 0] : [u, 0, 0];
    return [
      ...box(x - 0.006, y - 0.006, 0, post + 0.012, post + 0.012, 0.04, ASHLAR),
      ...box(x, y, 0.04, post, post, 0.28, ASHLAR),
      ...box(x - 0.01, y - 0.01, 0.32, post + 0.02, post + 0.02, 0.025, ASHLAR),
      ...box(x + 0.008, y + 0.008, 0.345, post - 0.016, post - 0.016, 0.012, ASHLAR),
      ...(flowers ? flowerUrn(c[0], c[1], 0.357, 0.55, flowers, Math.round(u * 40)) : [ball([c[0], c[1], 0.375], 1.9, ASHLAR[0], inkOf(ASHLAR[1]))]),
    ];
  };
  const gate: Shape[] = [];
  const g1 = a + post / 2;
  const g2 = b - post / 2;
  if (door === "locked") {
    // a wrought-iron gate painted red, shut and padlocked
    const red = LOCK[1];
    const bars: V3[][] = [];
    for (let i = 1; i < 9; i++) {
      const u = g1 + ((g2 - g1) * i) / 9;
      bars.push([at(u, 0.02, 0), at(u, 0.26, 0)]);
    }
    gate.push(
      strokes(bars, tone(red, -0.35), 1.3),
      strokes(bars.map(([p, q]) => [[p[0], p[1], p[2] + 0.01], [q[0], q[1], q[2] - 0.01]] as V3[]), tone(red, 0.3), 0.4, 0.8),
      strokes([[at(g1, 0.05, 0), at(g2, 0.05, 0)], [at(g1, 0.2, 0), at(g2, 0.2, 0)]], tone(red, -0.25), 1.6),
      ...bars.map(([, q]) => ball(q, 0.6, LOCK[0], LOCK[2])),
      ball(at((g1 + g2) / 2, 0.13, 0.004), 0.9, BRASS[1], BRASS[2]),
    );
  } else if (door === "shut") {
    gate.push(...block(g1, g2, 0, 0.3, WOOD, 0.03));
    gate.push(
      strokes(
        [0.25, 0.5, 0.75].map((f) => [at(g1 + (g2 - g1) * f, 0.01, thick / 2 - 0.03), at(g1 + (g2 - g1) * f, 0.29, thick / 2 - 0.03)]),
        WOOD[2],
        0.6,
      ),
      line([at(g1, 0.04, thick / 2 - 0.028), at(g2, 0.26, thick / 2 - 0.028)], WOOD[0], 2.4),
    );
  } else {
    // a worn stone threshold
    gate.push(
      wall === "x"
        ? flat(-0.04, 0.05, g1, g2, 0.002, ASHLAR[2], inkOf(ASHLAR[2]))
        : flat(g1, g2, -0.04, 0.05, 0.002, ASHLAR[2], inkOf(ASHLAR[2])),
    );
  }
  return [...stretch(start, a - post / 2), ...gatepost(a), ...gate, ...gatepost(b), ...stretch(b + post / 2, 1)];
}

/** A gravel court round (cx, cy) with a path in from each open gate
 *  (`gates`: the walls they're in), `width` wide: raked gravel, finely
 *  speckled, edged with a row of small stones. */
export function gravelCourt(cx: number, cy: number, r: number, gates: ("x" | "y")[], width = 0.2): Shape[] {
  const mid = (DOOR[0] + DOOR[1]) / 2;
  const [a, b] = [mid - width / 2, mid + width / 2];
  const fill = "#5F5E5A";
  const grad = { colors: [tone(fill, 0.14), fill, tone(fill, -0.28)], from: P(0, 0, 0), to: P(1, 1, 0) };
  // where a path's edge (at u across it) meets the court
  const meet = (u: number) => cx - Math.sqrt(Math.max(0, r * r - (u - cy) ** 2));
  const pieces: V3[][] = [ring3("z", [cx, cy, 0], r, 0, TAU, 40)];
  if (gates.includes("x")) pieces.push([[0, a, 0], [meet(a) + 0.02, a, 0], [meet(b) + 0.02, b, 0], [0, b, 0]]);
  if (gates.includes("y")) pieces.push([[a, 0, 0], [a, meet(a) + 0.02, 0], [b, meet(b) + 0.02, 0], [b, 0, 0]]);
  const shapes: Shape[] = pieces.map((pts) => ({ d: path(pts.map((p) => P(...p))), fill, grad }));
  // speckles: dark and pale stones
  let dark = "";
  let pale = "";
  const dot = (p: V3, i: number) => {
    const [x, y] = P(...p);
    const d = ` M${n(x)} ${n(y)} l${n(0.35 * k())} ${n(0.1 * k())}`;
    if (i % 2) dark += d;
    else pale += d;
  };
  for (let i = 0; i < 170; i++) {
    const t = rnd(i * 3 + 1) * TAU;
    const rr = Math.sqrt(rnd(i * 7 + 2)) * (r - 0.015);
    dot([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, 0], i);
  }
  for (const g of gates) {
    for (let i = 0; i < 40; i++) {
      const along = 0.05 + rnd(i * 11 + (g === "x" ? 1 : 2)) * (meet(mid) - 0.05);
      const across = a + 0.01 + rnd(i * 13 + (g === "x" ? 3 : 4)) * (width - 0.02);
      dot(g === "x" ? [along, across, 0] : [across, along, 0], i);
    }
  }
  shapes.push(
    { d: dark, stroke: tone(fill, -0.5), strokeWidth: 0.7, opacity: 0.7 },
    { d: pale, stroke: tone(fill, 0.4), strokeWidth: 0.7, opacity: 0.6 },
  );
  // the edging: round the court where no path comes in, and along the paths
  const inPath = ([x, y]: V3) =>
    (gates.includes("x") && y > a && y < b && x < cx) || (gates.includes("y") && x > a && x < b && y < cy);
  const runs: V3[][] = [];
  let run: V3[] = [];
  for (const p of ring3("z", [cx, cy, 0], r, Math.PI * 1.25, Math.PI * 3.25, 80)) {
    if (inPath(p)) {
      if (run.length > 1) runs.push(run);
      run = [];
    } else run.push(p);
  }
  if (run.length > 1) runs.push(run);
  if (gates.includes("x")) runs.push([[0.05, a, 0], [meet(a), a, 0]], [[0.05, b, 0], [meet(b), b, 0]]);
  if (gates.includes("y")) runs.push([[a, 0.05, 0], [a, meet(a), 0]], [[b, 0.05, 0], [b, meet(b), 0]]);
  shapes.push(
    { ...strokes(runs, ASHLAR[2], 1.8), dash: "2 0.8" },
    { ...strokes(runs.map((pts) => pts.map(([x, y, z]) => [x, y, z + 0.005] as V3)), ASHLAR[0], 0.6), dash: "1.4 1.4", opacity: 0.7 },
  );
  return shapes;
}

/** A tree standing at (x, y), forking at `trunk` high under a crown
 *  `crown` round: roots, a barked trunk that forks, and a
 *  crown of leaf clumps from dark at the back to moonlit at the front,
 *  hung with `fruit` (a colour) here and there. */
export function tree(x: number, y: number, trunk: number, crown: number, fruit: string, seed = 1): Shape[] {
  const [bx, by] = P(x, y, 0);
  const [, ty] = P(x, y, trunk);
  const s = unit();
  const wb = 0.05 * s;
  const wt = 0.026 * s;
  const bark = WOOD[1];
  const shapes: Shape[] = [
    disc(x + 0.06, y + 0.04, 0, crown * 0.75, INK.night, undefined, 0.35),
    // roots spreading into the grass
    {
      d: `M${n(bx - wb * 1.9)} ${n(by + 2)} Q${n(bx - wb)} ${n(by - 2)} ${n(bx - wb * 0.7)} ${n(by - 8)} L${n(bx + wb * 0.7)} ${n(by - 8)} Q${n(bx + wb)} ${n(by - 1)} ${n(bx + wb * 2.1)} ${n(by + 3)} Q${n(bx + wb * 0.6)} ${n(by + 1)} ${n(bx + wb * 0.3)} ${n(by + 4)} Q${n(bx - wb * 0.3)} ${n(by + 1.5)} ${n(bx - wb * 1.9)} ${n(by + 2)} Z`,
      fill: tone(bark, -0.1),
      stroke: inkOf(bark),
      strokeWidth: 0.55,
    },
    // the trunk, leaning a little, forking at the top
    {
      d: `M${n(bx - wb)} ${n(by)} C${n(bx - wb * 0.8)} ${n((by + ty) / 2)} ${n(bx - wt * 1.4)} ${n(ty + 10)} ${n(bx - wt * 2.6)} ${n(ty - 6)} L${n(bx - wt * 1.2)} ${n(ty - 8)} Q${n(bx)} ${n(ty + 2)} ${n(bx + wt * 1.4)} ${n(ty - 9)} L${n(bx + wt * 2.4)} ${n(ty - 5)} C${n(bx + wt * 1.2)} ${n(ty + 10)} ${n(bx + wb * 0.8)} ${n((by + ty) / 2)} ${n(bx + wb)} ${n(by)} Z`,
      fill: bark,
      grad: { colors: [tone(bark, 0.3), bark, tone(bark, -0.45)], from: [bx - wb, ty], to: [bx + wb, ty] },
      stroke: inkOf(bark),
      strokeWidth: 0.6,
    },
    // bark: long fissures down the trunk
    {
      d: [-0.55, -0.15, 0.25, 0.6]
        .map((f, i) => {
          const x0 = bx + f * wb * 0.9;
          const wob = (rnd(seed + i) - 0.5) * 3;
          return `M${n(x0 + f * 2)} ${n(ty + 4)} Q${n(x0 + wob)} ${n((by + ty) / 2)} ${n(x0)} ${n(by - 3)}`;
        })
        .join(" "),
      stroke: tone(bark, -0.55),
      strokeWidth: 0.5,
      opacity: 0.8,
    },
    { d: `M${n(bx - wb * 0.62)} ${n(by - 4)} Q${n(bx - wb * 0.55)} ${n((by + ty) / 2)} ${n(bx - wt * 1.2)} ${n(ty + 6)}`, stroke: "#FFFFFF", strokeWidth: 0.5, opacity: 0.3 },
  ];
  // the crown: clumps placed round the top of the trunk, back to front
  const R = crown * s;
  const top = ty - R * 0.55;
  const clumps: [number, number, number, number][] = [
    // dx, dy (in crown radii), size, shade (0 back … 1 front)
    [-0.55, -0.15, 0.55, 0],
    [0.5, -0.3, 0.55, 0],
    [0.0, -0.6, 0.6, 0.1],
    [-0.75, 0.25, 0.48, 0.3],
    [0.72, 0.2, 0.5, 0.3],
    [-0.3, -0.25, 0.58, 0.5],
    [0.32, -0.05, 0.56, 0.6],
    [-0.38, 0.38, 0.5, 0.8],
    [0.25, 0.42, 0.46, 0.9],
    [-0.1, -0.7, 0.4, 0.7],
  ];
  const fruitAt: [number, number][] = [];
  clumps.forEach(([dx, dy, size, shade], i) => {
    const [cx, cy] = [bx + dx * R, top + dy * R];
    const r = size * R;
    const base = tone(YEW[1], -0.3 + shade * 0.38);
    shapes.push(
      {
        d: clump(cx, cy, r, 9, seed * 31 + i * 7),
        fill: base,
        grad: { colors: [tone(base, 0.32), base, tone(base, -0.4)], from: [cx - r * 0.45, cy - r * 0.5], radius: r * 1.6 },
        stroke: inkOf(base),
        strokeWidth: 0.55,
      },
      { d: leafMarks(cx, cy, r, 7, seed * 7 + i * 13, "shade"), stroke: tone(base, -0.45), strokeWidth: 0.45, opacity: 0.8 },
      { d: leafMarks(cx, cy, r, 6, seed * 5 + i * 17, "lit"), stroke: tone(base, 0.45), strokeWidth: 0.45, opacity: 0.8 },
    );
    if (shade >= 0.5) fruitAt.push([cx + r * (rnd(i + 3) - 0.3) * 0.8, cy + r * (rnd(i + 8) * 0.6)]);
  });
  for (const [fx, fy] of fruitAt) {
    const r = 0.85 * k();
    shapes.push(
      {
        d: `M${n(fx - r)} ${n(fy)} a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0 Z`,
        fill: fruit,
        grad: { colors: [tone(fruit, 0.5), fruit, tone(fruit, -0.4)], from: [fx - r * 0.4, fy - r * 0.4], radius: r * 1.4 },
        stroke: inkOf(fruit),
        strokeWidth: 0.45,
      },
      { d: `M${n(fx)} ${n(fy - r)} l${n(0.3 * k())} ${n(-0.6 * k())}`, stroke: WOOD[2], strokeWidth: 0.5 },
    );
  }
  return shapes;
}

/** Flowers in a clump of leaves at a point of the drawing (cx, cy), `r`
 *  round: leaves, then five-petalled blooms in `colours`. */
export function posy(cx: number, cy: number, r: number, colours: string[], seed: number): Shape[] {
  const leaf = tone(YEW[1], 0.05);
  const shapes: Shape[] = [
    {
      d: clump(cx, cy, r, 7, seed),
      fill: leaf,
      grad: { colors: [tone(leaf, 0.3), leaf, tone(leaf, -0.35)], from: [cx - r * 0.4, cy - r * 0.5], radius: r * 1.5 },
      stroke: inkOf(leaf),
      strokeWidth: 0.45,
    },
  ];
  const blooms = Math.max(3, Math.round(r / (1.4 * k())));
  for (let i = 0; i < blooms; i++) {
    const a = rnd(seed + i * 3) * TAU;
    const f = Math.sqrt(rnd(seed + i * 7)) * 0.85;
    const [fx, fy] = [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f * 0.8 - r * 0.15];
    const colour = colours[i % colours.length];
    const p = 0.65 * k();
    let d = "";
    for (let j = 0; j < 5; j++) {
      const t = (j / 5) * TAU - Math.PI / 2;
      const [px, py] = [fx + Math.cos(t) * p, fy + Math.sin(t) * p * 0.85];
      d += ` M${n(px - p * 0.55)} ${n(py)} a${n(p * 0.55)} ${n(p * 0.55)} 0 1 0 ${n(p * 1.1)} 0 a${n(p * 0.55)} ${n(p * 0.55)} 0 1 0 ${n(-p * 1.1)} 0 Z`;
    }
    shapes.push(
      { d, fill: colour, stroke: inkOf(colour), strokeWidth: 0.3 },
      { d: `M${n(fx - p * 0.35)} ${n(fy)} a${n(p * 0.35)} ${n(p * 0.35)} 0 1 0 ${n(p * 0.7)} 0 a${n(p * 0.35)} ${n(p * 0.35)} 0 1 0 ${n(-p * 0.7)} 0 Z`, fill: "#F2C94C" },
    );
  }
  return shapes;
}

/** A stone urn on a square plinth at (x, y, z), `size` scaling it,
 *  spilling flowers in `colours`. */
export function flowerUrn(x: number, y: number, z: number, size: number, colours: string[], seed = 1): Shape[] {
  const s = size;
  const ped = 0.05 * s;
  const shapes: Shape[] = [
    ...(z === 0 ? [disc(x + 0.03, y + 0.02, 0, 0.06 * s, INK.night, undefined, 0.35)] : []),
    ...box(x - ped, y - ped, z, ped * 2, ped * 2, 0.05 * s, ASHLAR),
    ...lathe(
      x,
      y,
      z + 0.05 * s,
      [
        [0, 0.03 * s],
        [0.012 * s, 0.026 * s],
        [0.03 * s, 0.014 * s],
        [0.05 * s, 0.026 * s],
        [0.075 * s, 0.045 * s],
        [0.1 * s, 0.05 * s],
        [0.115 * s, 0.056 * s],
        [0.125 * s, 0.056 * s],
      ],
      ASHLAR,
      [0.075 * s, 0.112 * s],
    ),
  ];
  const [cx, cy] = P(x, y, z + 0.16 * s);
  shapes.push(...posy(cx, cy, 0.075 * s * unit(), colours, seed));
  return shapes;
}

/** The wall of a well at (x, y), radius r: courses of dressed stone, a
 *  coping round the top, dark water inside with the moon in it. */
export function wellHead(x: number, y: number, r: number, h: number): Shape[] {
  const courses = 3;
  const joints: V3[][] = [];
  for (let c = 0; c < courses; c++) {
    const z1 = (h * c) / courses;
    const z2 = (h * (c + 1)) / courses;
    for (let j = 0; j < 7; j++) {
      const t = (-35 + j * 26 + (c % 2) * 13) * DEG;
      if (t > 130 * DEG) continue;
      joints.push([[x + Math.cos(t) * r, y + Math.sin(t) * r, z1], [x + Math.cos(t) * r, y + Math.sin(t) * r, z2]]);
    }
  }
  const cap = r * 1.1;
  const shapes: Shape[] = [
    disc(x + 0.04, y + 0.02, 0, r * 1.15, INK.night, undefined, 0.35),
    ...cylinder(x, y, 0, r, h, ASHLAR),
    ...[1, 2].map((c) => hoop(x, y, (h * c) / courses, r, inkOf(ASHLAR[1]))),
    strokes(joints, inkOf(ASHLAR[1]), 0.55, 0.9),
    ...cylinder(x, y, h, cap, 0.03, [tone(ASHLAR[0], 0.08), tone(ASHLAR[1], 0.1), ASHLAR[2]]),
  ];
  const [wx, wy] = P(x, y, h + 0.03);
  const hole = r * 0.8 * unit();
  shapes.push(
    {
      d: `M${n(wx - hole * 1.2247)} ${n(wy)} a${n(hole * 1.2247)} ${n(hole * 0.7071)} 0 1 0 ${n(2 * hole * 1.2247)} 0 a${n(hole * 1.2247)} ${n(hole * 0.7071)} 0 1 0 ${n(-2 * hole * 1.2247)} 0 Z`,
      fill: "#0A1024",
      grad: { colors: ["#03050C", "#0A1024", "#1C2A55"], from: [wx, wy - hole * 0.7], to: [wx, wy + hole * 0.7] },
      stroke: inkOf(ASHLAR[2]),
      strokeWidth: 0.6,
    },
    disc(x + r * 0.15, y - r * 0.2, h + 0.03, r * 0.22, INK.glass, undefined, 0.55),
    disc(x + r * 0.15, y - r * 0.2, h + 0.03, r * 0.36, undefined, INK.glass, 0.3, 0.4),
    disc(x + r * 0.15, y - r * 0.2, h + 0.03, r * 0.5, undefined, INK.glass, 0.18, 0.4),
  );
  return shapes;
}

/** A well's roof: two posts on the coping, a winch with its rope, and a
 *  shingled roof on top. `half` is "back" (the far post) or "front" (the
 *  winch, the near post, the crank and the roof), so the bucket can hang
 *  between them. */
export function wellRoof(x: number, y: number, r: number, h: number, half: "back" | "front"): Shape[] {
  const post = 0.026;
  const eave = 0.5;
  const ridge = 0.62;
  const x1 = x - r - 0.005;
  const x2 = x + r - post + 0.005;
  if (half === "back") {
    return [
      ...box(x1, y - post / 2, h, post, post, eave - h, WOOD),
      line([[x, y, 0.38], [x, y, 0.27]], "#D8CCB0", 0.7),
    ];
  }
  const ax = x1 + post;
  const shapes: Shape[] = [];
  // the winch: a drum along x with rope wound on it
  const drum = (from: number, to: number, rr: number, tones: Tones) => {
    const a = ring3("x", [from, y, 0.39], rr, 0, TAU, 16).map((p) => P(...p));
    const b = ring3("x", [to, y, 0.39], rr, 0, TAU, 16).map((p) => P(...p));
    // the two ends' outlines joined: top and bottom tangents
    const top = (pts: Pt[]) => pts.reduce((m, p) => (p[1] - p[0] * 0.577 < m[1] - m[0] * 0.577 ? p : m));
    const bot = (pts: Pt[]) => pts.reduce((m, p) => (p[1] - p[0] * 0.577 > m[1] - m[0] * 0.577 ? p : m));
    const [ta, tb, ba, bb] = [top(a), top(b), bot(a), bot(b)];
    return [
      {
        d: path([ta, tb, bb, ba]),
        fill: tones[1],
        grad: { colors: [tone(tones[1], 0.3), tones[1], tone(tones[1], -0.4)], from: [(ta[0] + tb[0]) / 2, (ta[1] + tb[1]) / 2], to: [(ba[0] + bb[0]) / 2, (ba[1] + bb[1]) / 2] },
        stroke: inkOf(tones[1]),
        strokeWidth: 0.5,
      },
      { d: path(b), fill: tones[0], stroke: inkOf(tones[0]), strokeWidth: 0.5 },
    ] as Shape[];
  };
  shapes.push(...drum(ax, x2, 0.018, WOOD));
  shapes.push(...drum(x - 0.035, x + 0.035, 0.024, ["#E4D6B4", "#C8B68E", "#9A8862"]));
  shapes.push(
    strokes(
      [-0.025, -0.012, 0, 0.012, 0.025].map((dx) => ring3("x", [x + dx, y, 0.39], 0.0245, -45 * DEG, 135 * DEG, 6)),
      "#7A6A48",
      0.45,
      0.8,
    ),
  );
  // the near post, the crank
  shapes.push(
    ...box(x2, y - post / 2, h, post, post, eave - h, WOOD),
    line([[x2 + post, y, 0.39], [x2 + post + 0.03, y, 0.39], [x2 + post + 0.03, y + 0.05, 0.34], [x2 + post + 0.03, y + 0.05, 0.31]], IRONWORK[1], 1.1),
    ...box(x2 + post + 0.022, y + 0.042, 0.29, 0.016, 0.016, 0.03, WOOD),
  );
  // the roof: the far slope, the gable, the near slope, shingles
  const [rx1, rx2] = [x1 - 0.035, x2 + post + 0.035];
  const span = 0.13;
  const backSlope: V3[] = [[rx1, y - span, eave], [rx2, y - span, eave], [rx2, y, ridge], [rx1, y, ridge]];
  const frontSlope: V3[] = [[rx1, y, ridge], [rx2, y, ridge], [rx2, y + span, eave], [rx1, y + span, eave]];
  const gable: V3[] = [[x2 + post, y - span + 0.03, eave], [x2 + post, y + span - 0.03, eave], [x2 + post, y, ridge - 0.03]];
  shapes.push(
    shaded(backSlope, SHINGLE[2], [rx1, y, ridge], [rx2, y - span, eave], 0.12, 0.2),
    shaded(gable, WOOD[2], [x2 + post, y, ridge], [x2 + post, y - span, eave], 0.1, 0.25),
    shaded(frontSlope, SHINGLE[1], [rx1, y, ridge], [rx2, y + span, eave], 0.22, 0.25),
  );
  const rows: V3[][] = [];
  for (const f of [0.25, 0.5, 0.75]) {
    rows.push([[rx1 + 0.004, y + span * f, ridge - (ridge - eave) * f], [rx2 - 0.004, y + span * f, ridge - (ridge - eave) * f]]);
  }
  for (let i = 0; i < 4; i++) {
    for (let j = 1; j < 9; j++) {
      const u = rx1 + ((rx2 - rx1) * (j - (i % 2) * 0.5)) / 9;
      if (u <= rx1 + 0.005) continue;
      const [f1, f2] = [i * 0.25, (i + 1) * 0.25];
      rows.push([[u, y + span * f1, ridge - (ridge - eave) * f1], [u, y + span * f2, ridge - (ridge - eave) * f2]]);
    }
  }
  shapes.push(strokes(rows, tone(SHINGLE[1], -0.5), 0.45, 0.8));
  // bargeboards and the ridge board
  shapes.push(
    line([[rx2, y + span, eave], [rx2, y, ridge]], WOOD[0], 1.4),
    line([[rx2, y, ridge], [rx2, y - span, eave]], WOOD[2], 0.8),
    line([[rx1, y, ridge + 0.004], [rx2, y, ridge + 0.004]], WOOD[0], 1.6),
    { ...line([[rx1 + 0.01, y + 0.008, ridge - 0.004], [rx2 - 0.02, y + 0.008, ridge - 0.004]], "#FFFFFF", 0.5), opacity: 0.35 },
  );
  return shapes;
}

/** A garden bench at (x, y), `w` long along x, facing the viewer (+y):
 *  wrought-iron ends with curled arms and feet, wooden slats. */
export function gardenBench(x: number, y: number, w: number): Shape[] {
  const d = 0.1;
  const seat = 0.1;
  const X = x + w;
  const end = (ex: number): Shape[] => {
    const p = (yy: number, z: number): V3 => [ex, y + yy, z];
    const frame: V3[][] = [
      [p(0.0, 0), p(0.005, seat), p(-0.012, 0.26)],
      [p(d, 0), p(d - 0.005, seat), p(d * 0.98, seat + 0.07), p(d * 0.6, seat + 0.085), p(0.01, seat + 0.07)],
      [p(0, seat), p(d, seat)],
    ];
    const [cx, cy] = P(...p(d * 0.98, seat + 0.07));
    const [fx, fy] = P(...p(d, 0));
    const [bx, by] = P(...p(0, 0));
    const c = 1.1 * k();
    return [
      strokes(frame, IRONWORK[2], 1.6),
      strokes(frame, IRONWORK[0], 0.45, 0.7),
      {
        d: `M${n(cx)} ${n(cy)} a${n(c)} ${n(c)} 0 1 0 ${n(c * 1.4)} ${n(c * 0.6)} M${n(fx)} ${n(fy)} q${n(c * 1.2)} 0 ${n(c * 1.2)} ${n(-c)} M${n(bx)} ${n(by)} q${n(-c * 1.2)} 0 ${n(-c * 1.2)} ${n(-c)}`,
        stroke: IRONWORK[2],
        strokeWidth: 1.1,
      },
    ];
  };
  const slat: Tones = WOOD;
  return [
    tint([[x + 0.02, y + 0.02, 0], [X + 0.05, y + 0.02, 0], [X + 0.05, y + d + 0.02, 0], [x + 0.02, y + d + 0.02, 0]], INK.night, 0.32),
    ...end(x),
    // the back: three slats, then the seat
    ...[0.15, 0.19, 0.23].flatMap((z, i) => box(x + 0.004, y - 0.006 - i * 0.004, z, w - 0.008, 0.008, 0.026, slat)),
    ...[0.0, 0.034, 0.068].flatMap((yy) => box(x + 0.004, y + yy + 0.004, seat, w - 0.008, 0.028, 0.01, slat)),
    ...end(X),
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
    graded(path(hull([...ends[0], ...ends[1]])), bark[1], [mid[0] + nx * R, mid[1] + ny * R], [mid[0] - nx * R, mid[1] - ny * R], 0.28, 0.4),
  ];
  // a line along the log, `off` radii toward the light (a shine) or away (a crack in the bark)
  const along = (off: number, from = 0.08, to = 0.92): Shape => ({
    d: path(
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
  shapes.push(rounded(path(cap), cut[1], at, R, inkOf(bark[1])));
  if (detail && R > 1.6) {
    shapes.push({ d: path(circle3(seen ? b : a, r * 0.55, axis, 10).map(Pv)), stroke: cut[2], strokeWidth: 0.4, opacity: 0.8 });
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
    { ...graded(path(pts), SNOW[1], a, b, 0.6, 0.18), stroke: tone(SNOW[2], -0.25), strokeWidth: 0.45 },
    { d: path(ridge.slice(1, -1).map(Pv), false), stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.8 },
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
    { ...graded(path(pts), SNOW[1], a, b, 0.6, 0.12), stroke: tone(SNOW[2], -0.25), strokeWidth: 0.45 },
    { d: path(ridge.slice(1, -1).map(Pv), false), stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.8 },
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
    return { d: path([...pts.map(Pv), ...top.map(Pv)]), fill: SNOW[1], stroke: tone(SNOW[2], -0.2), strokeWidth: 0.4 };
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

/** A post-and-rail fence along x at y, from x0 to x1, `posts` posts
 *  `h` high, snow on its rails
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
    shapes.push({ d: path(pts), fill: "#DCEBFF", stroke: "#7E9CC4", strokeWidth: 0.35 });
  }
  return shapes;
}

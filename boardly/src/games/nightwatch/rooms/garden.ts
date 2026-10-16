// Seal the Manor's garden: a walled garden under the moon. Clipped yew
// hedges with stone gateposts (urns on top) for walls, a gravel court
// with paths in from the two gates, an old apple tree, a stone well with
// a shingled roof, a winch and the bucket (the prop), an iron lamp post,
// a wrought-iron bench, a flower bed, an urn of flowers, fireflies.
// Built with the iso kit (components/iso); see roomScenes.ts.
//
// The pieces below (hedge, tree, wellHead, wellRoof, lampPost, bench,
// urn, gravelCourt) take world units and are written to move into
// components/iso/furniture.ts later.

import {
  DOOR,
  INK,
  LOCK,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  firefly,
  flame,
  flat,
  hoop,
  inkOf,
  k,
  line,
  n,
  path,
  poly,
  tone,
  unit,
  type Door,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { EARTH, disc, exitOf, plinth, prop, tint } from "@/components/iso/room";
import { BRASS, IRONWORK } from "@/components/iso/furniture";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** A steady pseudo-random number in [0, 1) for a seed. */
const rnd = (seed: number) => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Clipped yew, blue-green under the moon. */
export const YEW: Tones = ["#4F8A66", "#3A6B4F", "#2A503B"];
/** Garden stone, warm and pale. */
export const ASHLAR: Tones = ["#9A9C9E", "#7A7D82", "#5E6167"];
/** Grey, weathered shingles. */
export const SHINGLE: Tones = ["#7A6656", "#5E4C40", "#463830"];

/** A face filled with a gradient running from `from` (light) to `to`. */
function shaded(pts: V3[], fill: string, from: V3, to: V3, light = 0.16, dark = 0.24): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
}

/** Several open polylines as one stroke (cheap engraving). */
const strokes = (lines: V3[][], stroke: string, strokeWidth: number, opacity?: number): Shape => ({
  d: lines.map((pts) => path(pts.map((p) => P(...p)), false)).join(" "),
  stroke,
  strokeWidth,
  opacity,
});

/** Points round a circle of radius r about c, flat (z) or upright
 *  across x or y (t = 90° straight up). */
function ring3(axis: "x" | "y" | "z", c: V3, r: number, t0 = 0, t1 = TAU, steps = 24): V3[] {
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
      ...(flowers ? urn(c[0], c[1], 0.357, 0.55, flowers, Math.round(u * 40)) : [ball([c[0], c[1], 0.375], 1.9, ASHLAR[0], inkOf(ASHLAR[1]))]),
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

/** A tree standing at (x, y): roots, a barked trunk that forks, and a
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

/** A turned shape standing at (x, y, z): `profile` is [height, radius]
 *  pairs from the foot up. Lit round from the left, its top an ellipse,
 *  a ring at each `beads` height. */
export function lathe(x: number, y: number, z: number, profile: [number, number][], tones: Tones, beads: number[] = []): Shape[] {
  const s = unit();
  const [cx] = P(x, y, z);
  const yAt = (h: number) => P(x, y, z + h)[1];
  const rx = (r: number) => r * s * 1.2247;
  const ry = (r: number) => r * s * 0.7071;
  const pts: Pt[] = [];
  for (const [h, r] of profile) pts.push([cx - rx(r), yAt(h)]);
  const [ht, rt] = profile[profile.length - 1];
  for (const [h, r] of [...profile].reverse()) pts.push([cx + rx(r), yAt(h)]);
  const [h0, r0] = profile[0];
  for (let i = 1; i < 12; i++) {
    const t = (i / 12) * Math.PI;
    pts.push([cx + Math.cos(t) * rx(r0), yAt(h0) + Math.sin(t) * ry(r0)]);
  }
  const wide = Math.max(...profile.map(([, r]) => r));
  const [top, lit] = tones;
  return [
    {
      d: path(pts),
      fill: lit,
      grad: { colors: [tone(lit, 0.3), lit, tone(lit, -0.45)], from: [cx - rx(wide) * 0.8, yAt(ht)], to: [cx + rx(wide), yAt(ht)] },
      stroke: inkOf(lit),
      strokeWidth: 0.55,
    },
    ...beads.map((h) => {
      const r = profile.reduce((best, p) => (Math.abs(p[0] - h) < Math.abs(best[0] - h) ? p : best))[1];
      return { d: `M${n(cx - rx(r))} ${n(yAt(h))} A${n(rx(r))} ${n(ry(r))} 0 0 0 ${n(cx + rx(r))} ${n(yAt(h))}`, stroke: inkOf(lit), strokeWidth: 0.5, opacity: 0.8 };
    }),
    {
      d: `M${n(cx - rx(rt))} ${n(yAt(ht))} a${n(rx(rt))} ${n(ry(rt))} 0 1 0 ${n(2 * rx(rt))} 0 a${n(rx(rt))} ${n(ry(rt))} 0 1 0 ${n(-2 * rx(rt))} 0 Z`,
      fill: top,
      grad: { colors: [tone(top, 0.2), top, tone(top, -0.15)], from: [cx - rx(rt), yAt(ht) - ry(rt)], to: [cx + rx(rt), yAt(ht) + ry(rt)] },
      stroke: inkOf(top),
      strokeWidth: 0.5,
    },
  ];
}

/** Flowers in a clump of leaves at a point of the drawing: leaves, then
 *  five-petalled blooms in the given colours. */
function posy(cx: number, cy: number, r: number, colours: string[], seed: number): Shape[] {
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

/** A stone urn on a square plinth, spilling flowers. */
export function urn(x: number, y: number, z: number, size: number, colours: string[], seed = 1): Shape[] {
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

/** An iron lamp post at (x, y): a stone footing, a turned iron post with
 *  a collar, scrolls under a glass lantern with a brass cap. */
export function lampPost(x: number, y: number, h: number, accent: string): Shape[] {
  const s = 0.05;
  const lz = h;
  const hgt = 0.07;
  const amber: Tones = ["#FFE6A6", "#F0C36A", "#C08A3A"];
  const [x0, x1, y0, y1] = [x - s / 2, x + s / 2, y - s / 2, y + s / 2];
  const zt = lz + 0.012 + hgt;
  const apex: V3 = [x, y, zt + 0.05];
  const [px, py] = P(x, y, lz - 0.03);
  const c = 1.2 * k();
  return [
    disc(x + 0.03, y + 0.015, 0, 0.05, INK.night, undefined, 0.35),
    ...box(x - 0.035, y - 0.035, 0, 0.07, 0.07, 0.03, ASHLAR),
    ...lathe(
      x,
      y,
      0.03,
      [
        [0, 0.026],
        [0.02, 0.022],
        [0.05, 0.012],
        [0.07, 0.008],
        [h - 0.05, 0.007],
        [h - 0.045, 0.012],
        [h - 0.035, 0.012],
        [h - 0.03, 0.008],
      ],
      IRONWORK,
      [0.02, h - 0.04],
    ),
    // scrolls holding the lantern
    {
      d: `M${n(px)} ${n(py)} q${n(-c * 1.6)} ${n(-c * 0.2)} ${n(-c * 1.5)} ${n(-c * 1.3)} a${n(c * 0.45)} ${n(c * 0.45)} 0 1 1 ${n(c * 0.6)} ${n(c * 0.35)} M${n(px)} ${n(py)} q${n(c * 1.6)} ${n(-c * 0.2)} ${n(c * 1.5)} ${n(-c * 1.3)} a${n(c * 0.45)} ${n(c * 0.45)} 0 1 0 ${n(-c * 0.6)} ${n(c * 0.35)}`,
      stroke: IRONWORK[2],
      strokeWidth: 1,
    },
    ...box(x0, y0, lz, s, s, 0.012, IRONWORK),
    ...box(x0 + 0.005, y0 + 0.005, lz + 0.012, s - 0.01, s - 0.01, hgt, amber),
    ...flame([x, y, lz + 0.018], 1.7, accent),
    strokes(
      [
        [[x1, y1, lz + 0.012], [x1, y1, zt]],
        [[x0, y1, lz + 0.012], [x0, y1, zt]],
        [[x1, y0, lz + 0.012], [x1, y0, zt]],
      ],
      IRONWORK[2],
      1.1,
    ),
    ...box(x0 - 0.006, y0 - 0.006, zt, s + 0.012, s + 0.012, 0.01, IRONWORK),
    shaded([[x0 - 0.006, y1 + 0.006, zt + 0.01], [x1 + 0.006, y1 + 0.006, zt + 0.01], apex], BRASS[1], [x0, y1, zt], apex, 0.25, 0.1),
    shaded([[x1 + 0.006, y1 + 0.006, zt + 0.01], [x1 + 0.006, y0 - 0.006, zt + 0.01], apex], BRASS[2], apex, [x1, y0, zt], 0.15, 0.2),
    ball(apex, 0.8, BRASS[0], BRASS[2]),
  ];
}

/** A garden bench at (x, y), `w` long along x, facing the viewer (+y):
 *  wrought-iron ends with curled arms and feet, wooden slats. */
export function bench(x: number, y: number, w: number): Shape[] {
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

export function garden(accent: string): Shape[] {
  const left = exitOf("left");
  const right = exitOf("right");
  const gates = [...(left ? (["x"] as const) : []), ...(right ? (["y"] as const) : [])];
  // the sky: the moon, and stars over the hedges
  const [mx, my] = P(0.6, -0.035, 0.9);
  const mr = 6 * k();
  const sky: Shape[] = [
    { d: `M${n(mx - mr * 1.45)} ${n(my)} a${n(mr * 1.45)} ${n(mr * 1.45)} 0 1 0 ${n(mr * 2.9)} 0 a${n(mr * 1.45)} ${n(mr * 1.45)} 0 1 0 ${n(-mr * 2.9)} 0 Z`, fill: INK.glass, opacity: 0.07 },
    {
      d: `M${n(mx - mr)} ${n(my)} a${n(mr)} ${n(mr)} 0 1 0 ${n(2 * mr)} 0 a${n(mr)} ${n(mr)} 0 1 0 ${n(-2 * mr)} 0 Z`,
      fill: "#E8E4D4",
      grad: { colors: ["#FFFDF2", "#E4E0D0", "#A9B4CC"], from: [mx - mr * 0.4, my - mr * 0.4], radius: mr * 1.5 },
      stroke: "#7A86A8",
      strokeWidth: 0.6,
    },
    {
      d: [
        [0.3, -0.2, 0.28],
        [-0.35, 0.25, 0.2],
        [0.15, 0.45, 0.14],
        [-0.2, -0.45, 0.12],
      ]
        .map(([dx, dy, r]) => {
          const [cx, cy, rr] = [mx + dx * mr, my + dy * mr, r * mr];
          return `M${n(cx - rr)} ${n(cy)} a${n(rr)} ${n(rr * 0.9)} 0 1 0 ${n(2 * rr)} 0 a${n(rr)} ${n(rr * 0.9)} 0 1 0 ${n(-2 * rr)} 0 Z`;
        })
        .join(" "),
      fill: "#B8C0D4",
      opacity: 0.6,
    },
  ];
  const starAt: [number, number, number][] = [
    [0.45, -0.05, 1.05],
    [0.2, -0.05, 0.85],
    [0.75, -0.05, 0.7],
    [-0.05, 0.35, 1.0],
    [-0.05, 0.75, 0.82],
    [-0.05, 0.55, 0.62],
    [0.05, -0.05, 1.12],
    [-0.05, 0.95, 0.58],
    [0.3, -0.05, 1.18],
    [-0.05, 0.18, 1.12],
    [0.95, -0.05, 0.62],
  ];
  starAt.forEach(([x, y, z], i) => {
    const [sx, sy] = P(x, y, z);
    const r = (i % 3 === 0 ? 1.6 : 0.8) * k();
    sky.push(
      i % 3 === 0
        ? { d: `M${n(sx)} ${n(sy - r)} Q${n(sx)} ${n(sy)} ${n(sx + r)} ${n(sy)} Q${n(sx)} ${n(sy)} ${n(sx)} ${n(sy + r)} Q${n(sx)} ${n(sy)} ${n(sx - r)} ${n(sy)} Q${n(sx)} ${n(sy)} ${n(sx)} ${n(sy - r)} Z`, fill: "#DCE6FF" }
        : ball([x, y, z], 0.4, INK.glass),
    );
  });

  // the lawn, darker toward the front, with tufts of grass
  const lawn = "#2C4A3A";
  let tufts = "";
  let lit = "";
  for (let i = 0; i < 120; i++) {
    const [x, y] = [0.03 + rnd(i * 3 + 7) * 0.94, 0.03 + rnd(i * 5 + 11) * 0.94];
    const [sx, sy] = P(x, y, 0);
    const s = 0.9 * k();
    const blade = ` M${n(sx - s)} ${n(sy)} l${n(s * 0.5)} ${n(-s * 1.4)} M${n(sx)} ${n(sy)} l${n(0)} ${n(-s * 1.8)} M${n(sx + s)} ${n(sy)} l${n(-s * 0.4)} ${n(-s * 1.3)}`;
    if (i % 3) tufts += blade;
    else lit += blade;
  }
  return [
    ...sky,
    ...plinth(EARTH),
    {
      ...flat(0, 1, 0, 1, 0, lawn, INK.grassLine),
      grad: { colors: [tone(lawn, 0.12), lawn, tone(lawn, -0.3)], from: P(0, 0, 0), to: P(1, 1, 0) },
    },
    { d: tufts, stroke: tone(lawn, -0.35), strokeWidth: 0.5, opacity: 0.9 },
    { d: lit, stroke: tone(lawn, 0.35), strokeWidth: 0.5, opacity: 0.8 },
    ...gravelCourt(0.64, 0.64, 0.3, gates as ("x" | "y")[]),
    // the hedges, the lamp by the gate
    ...hedge("x", left, [accent, INK.paper, "#E8A0B8"]),
    ...hedge("y", right, [INK.paper, "#E8A0B8", accent]),
    ...lampPost(0.9, 0.11, 0.42, accent),
    // the old apple tree in the far corner
    ...tree(0.22, 0.22, 0.3, 0.2, "#C2453F"),
    // a flower bed under the left hedge, edged in stone
    ...box(0.06, 0.71, 0, 0.09, 0.26, 0.022, ASHLAR),
    flat(0.07, 0.14, 0.72, 0.96, 0.023, "#2E2418", "#1A140C"),
    ...[0.76, 0.85, 0.93].flatMap((y, i) => {
      const [cx, cy] = P(0.105, y, 0.03);
      return posy(cx, cy, 2.5 * k(), i % 2 ? [INK.paper, accent] : [accent, "#E8A0B8", INK.paper], 50 + i * 9);
    }),
    // the well, and the bucket hanging in it
    ...wellHead(0.76, 0.3, 0.12, 0.12),
    ...wellRoof(0.76, 0.3, 0.12, 0.15, "back"),
    ...prop(() => [
      ...cylinder(0.76, 0.3, 0.2, 0.034, 0.06, WOOD),
      hoop(0.76, 0.3, 0.212, 0.034, IRONWORK[2]),
      hoop(0.76, 0.3, 0.248, 0.034, IRONWORK[2]),
      line([[0.73, 0.3, 0.26], [0.76, 0.3, 0.295], [0.79, 0.3, 0.26]], IRONWORK[1], 0.8),
      line([[0.76, 0.3, 0.295], [0.76, 0.3, 0.33]], "#D8CCB0", 0.7),
    ]),
    ...wellRoof(0.76, 0.3, 0.12, 0.15, "front"),
    // the bench on the lawn, an urn of flowers beside it
    ...bench(0.16, 0.74, 0.24),
    // fireflies over the grass
    ...([[0.5, 0.6, 0.2], [0.34, 0.5, 0.34], [0.86, 0.6, 0.28], [0.6, 0.86, 0.16], [0.44, 0.2, 0.3], [0.2, 0.9, 0.22]] as V3[]).flatMap(firefly),
  ];
}

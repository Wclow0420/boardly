// Seal the Manor's cellar: a vaulted stone cellar under the house. Dressed
// stone up both walls, a brick arch over a niche where three casks lie on
// their cradle, a wine rack of sealed bottles, crates and grain sacks, a
// barred window letting in the moon, a lantern on its bracket, cobwebs in
// the corner, and the trapdoor to the passage under the floor (the prop).
// Built with the iso kit (components/iso); see roomScenes.ts.
//
// The pieces below (masonry, lyingBarrel, wineRack, crate, sack,
// hangingLantern, cobweb, barredWindow, flagstones) take world units and
// are written to move into components/iso/furniture.ts later.

import {
  DOOR,
  GRAINED,
  INK,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  flame,
  flat,
  inkOf,
  k,
  lightPool,
  line,
  moonShaft,
  n,
  paint,
  path,
  poly,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { THICK, disc, exitOf, mats, prop, shell, tint } from "@/components/iso/room";
import { BRASS, IRONWORK, barrel, panel } from "@/components/iso/furniture";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** A steady pseudo-random number in [0, 1) for a seed. */
const rnd = (seed: number) => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Cellar stone: cool and grey. */
export const CELLAR_STONE: Tones = ["#6A6E78", "#50545E", "#3C4049"];
/** Pewter, for jugs and cups. */
export const PEWTER: Tones = ["#D4D9E0", "#9AA2AE", "#6E7684"];
/** Pale deal, for crates. */
export const PINE: Tones = ["#C29A68", "#A07A4E", "#7A5A38"];
GRAINED.add(PINE);

/** A face filled with a gradient running from `from` (light) to `to`. */
function shaded(pts: V3[], fill: string, from: V3, to: V3, light = 0.16, dark = 0.24): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
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

/** The convex hull of points in the drawing. */
function hull(pts: Pt[]): Pt[] {
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

/** Several open polylines as one stroke (cheap engraving). */
const strokes = (lines: V3[][], stroke: string, strokeWidth: number, opacity?: number): Shape => ({
  d: lines.map((pts) => path(pts.map((p) => P(...p)), false)).join(" "),
  stroke,
  strokeWidth,
  opacity,
});

/** Dressed stone blocks laid in staggered courses up a back wall (the
 *  left, x = 0, or the right, y = 0), leaving the `keep` rectangles
 *  ([u1, u2, z1, z2] along the wall) bare, with a line of light along
 *  each block's top. */
export function masonry(wall: "x" | "y", base: string, keep: [number, number, number, number][], seed = 1): Shape[] {
  const at = (u: number, z: number): V3 => (wall === "x" ? [0.001, u, z] : [u, 0.001, z]);
  const shapes: Shape[] = [];
  const shine: V3[][] = [];
  const z0 = 0.045;
  const top = 0.715;
  const rows = 8;
  const ch = (top - z0) / rows;
  for (let r = 0; r < rows; r++) {
    const z1 = z0 + r * ch + 0.004;
    const z2 = z0 + (r + 1) * ch - 0.004;
    // the free stretches of this course
    let free: [number, number][] = [[0, 1]];
    for (const [a, b, c, d] of keep) {
      if (z2 <= c || z1 >= d) continue;
      free = free.flatMap(([f1, f2]) =>
        [[f1, Math.min(f2, a)], [Math.max(f1, b), f2]].filter(([p, q]) => q - p > 0.001) as [number, number][],
      );
    }
    let i = 0;
    for (const [f1, f2] of free) {
      let u = f1 - (r % 2 ? 0.07 : 0);
      while (u < f2) {
        const len = 0.12 + rnd(seed * 101 + r * 17 + i) * 0.09;
        const u1 = Math.max(f1, u) + 0.004;
        const u2 = Math.min(f2, u + len) - 0.004;
        if (u2 - u1 > 0.025) {
          const fill = tone(base, (rnd(seed * 7 + r * 31 + i * 3) - 0.5) * 0.24);
          // lit from the upper left: on the left wall that is high y
          const [lo, hi] = wall === "x" ? [u1, u2] : [u2, u1];
          shapes.push(shaded([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], fill, at(hi, z2), at(lo, z1), 0.14, 0.3));
          shine.push(wall === "x" ? [at(u2 - 0.01, z2 - 0.006), at(u1 + 0.02, z2 - 0.006)] : [at(u1 + 0.01, z2 - 0.006), at(u2 - 0.02, z2 - 0.006)]);
        }
        u += len;
        i++;
      }
    }
  }
  shapes.push(strokes(shine, "#FFFFFF", 0.4, 0.22));
  return shapes;
}

/** A brick arch over a dark niche in the left wall, from y1 to y2,
 *  springing at `spring`: dressed jambs, wedge-shaped voussoirs round
 *  the head with a keystone, the niche falling into shadow. */
export function archNiche(y1: number, y2: number, spring: number, stone: string): Shape[] {
  const mid = (y1 + y2) / 2;
  const R = (y2 - y1) / 2;
  const depth = 0.055;
  const at = (u: number, z: number): V3 => [0.003, u, z];
  const rim = ring3("x", [0.003, mid, spring], R, 0, Math.PI, 16);
  const hollow = [at(y2, 0), ...rim, at(y1, 0)];
  const dark = tone(paint().shade, -0.35);
  const shapes: Shape[] = [
    {
      ...poly(hollow, dark),
      grad: { colors: [tone(dark, -0.4), dark, tone(dark, 0.25)], from: P(0, mid, spring + R), to: P(0, mid, 0) },
    },
    // jambs
    ...[
      [y1 - depth, y1],
      [y2, y2 + depth],
    ].map(([a, b]) => shaded([at(a, 0.04), at(b, 0.04), at(b, spring), at(a, spring)], stone, at(b, spring), at(a, 0.04))),
  ];
  const count = 11;
  for (let i = 0; i < count; i++) {
    const a1 = (i / count) * Math.PI;
    const a2 = ((i + 1) / count) * Math.PI;
    const key = i === (count - 1) / 2;
    const out = R + depth + (key ? 0.022 : 0);
    const p = (a: number, r: number): V3 => at(mid + Math.cos(a) * r, spring + Math.sin(a) * r);
    const fill = key ? tone(stone, 0.12) : tone(stone, (rnd(i + 40) - 0.5) * 0.2);
    shapes.push(
      shaded(
        [p(a1 + 0.012, R), p(a2 - 0.012, R), p(a2 - 0.012, out), p(a1 + 0.012, out)],
        fill,
        p(a2, out),
        p(a1, R),
      ),
    );
  }
  // imposts where the arch springs
  for (const u of [y1 - depth - 0.012, y2 - 0.002]) {
    shapes.push(...box(0, u, spring - 0.012, 0.022, depth + 0.014, 0.022, CELLAR_STONE));
  }
  return shapes;
}

/** A barrel lying on its side along `axis`, its back head centred at
 *  `at`, `len` long: bellied staves, four iron hoops, a boarded head
 *  facing the viewer with its chime and a brass tap. */
export function lyingBarrel(axis: "x" | "y", at: V3, len: number, r: number, tones: Tones = WOOD): Shape[] {
  const c = (f: number): V3 => (axis === "x" ? [at[0] + len * f, at[1], at[2]] : [at[0], at[1] + len * f, at[2]]);
  const belly = (f: number) => r * (0.88 + 0.12 * Math.sin(Math.PI * f));
  const lit = tones[1];
  const body = hull([0, 0.5, 1].flatMap((f) => ring3(axis, c(f), belly(f), 0, TAU, 28).map((p) => P(...p))));
  const [tx, ty] = P(...c(0.5));
  const span = r * unit();
  const shapes: Shape[] = [
    {
      d: path(body),
      fill: lit,
      grad: {
        colors: [tone(lit, 0.04), tone(lit, 0.3), lit, tone(lit, -0.48)],
        from: [tx, ty - span * 1.05],
        to: [tx + span * 0.3, ty + span * 0.95],
      },
      stroke: inkOf(lit),
      strokeWidth: 0.6,
    },
  ];
  // staves along the body
  const staves = [-20, 10, 40, 70, 100].map((d) =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ring3(axis, c(f), belly(f), d * DEG, d * DEG, 1)[0]),
  );
  shapes.push(strokes(staves, tone(lit, -0.42), 0.45, 0.7));
  // hoops: dark iron with a line of light
  const hoops = [0.1, 0.28, 0.72, 0.9];
  shapes.push(
    strokes(hoops.map((f) => ring3(axis, c(f), belly(f) * 1.01, -45 * DEG, 135 * DEG, 14)), IRONWORK[2], 1.7),
    strokes(hoops.map((f) => ring3(axis, c(f + 0.012), belly(f) * 1.012, -10 * DEG, 120 * DEG, 10)), IRONWORK[0], 0.5, 0.8),
  );
  // the head: end grain, boards, the chime round it
  const hr = belly(1) * 0.96;
  const hc = c(1);
  const head = ring3(axis, hc, hr, 0, TAU, 28);
  const [hx, hy] = P(...hc);
  const face = tone(tones[0], -0.08);
  const across = (u: number, v: number): V3 => (axis === "x" ? [hc[0], hc[1] + u, hc[2] + v] : [hc[0] + u, hc[1], hc[2] + v]);
  shapes.push(
    {
      ...poly(head, face),
      grad: { colors: [tone(face, 0.25), face, tone(face, -0.3)], from: [hx - span * 0.4, hy - span * 0.5], radius: span * 1.3 },
    },
    strokes(
      [-0.5, -0.17, 0.17, 0.5].map((f) => {
        const u = f * hr;
        const v = Math.sqrt(hr * hr - u * u) * 0.96;
        return [across(u, -v), across(u, v)];
      }),
      tone(face, -0.45),
      0.45,
      0.75,
    ),
    { d: path(ring3(axis, hc, hr * 0.8, 0, TAU, 24).map((p) => P(...p))), stroke: tone(face, -0.4), strokeWidth: 0.4, opacity: 0.6 },
    { d: path(head.map((p) => P(...p))), stroke: IRONWORK[2], strokeWidth: 1.3 },
    strokes([ring3(axis, hc, hr * 0.93, 95 * DEG, 175 * DEG, 8)], "#FFFFFF", 0.5, 0.35),
  );
  // the tap, low on the head
  const tz = hc[2] - hr * 0.55;
  const s = 0.02;
  shapes.push(
    ...(axis === "x"
      ? [
          ...box(hc[0], hc[1] - s / 2, tz - s / 2, 0.04, s, s, BRASS),
          ...box(hc[0] + 0.022, hc[1] - 0.006, tz + s / 2, 0.012, 0.012, 0.022, BRASS),
          ...box(hc[0] + 0.03, hc[1] - 0.007, tz - s / 2 - 0.026, 0.014, 0.014, 0.026, BRASS),
        ]
      : [
          ...box(hc[0] - s / 2, hc[1], tz - s / 2, s, 0.04, s, BRASS),
          ...box(hc[0] - 0.006, hc[1] + 0.022, tz + s / 2, 0.012, 0.012, 0.022, BRASS),
          ...box(hc[0] - 0.007, hc[1] + 0.03, tz - s / 2 - 0.026, 0.014, 0.014, 0.026, BRASS),
        ]),
  );
  return shapes;
}

/** A wine rack against the right-hand wall (y = 0), x to x + w: a
 *  wooden frame of `cols` × `rows` cubbies, a bottle lying in most,
 *  its dark glass catching the light and its neck sealed in wax or foil. */
export function wineRack(x: number, w: number, d: number, h: number, cols: number, rows: number, seals: string[]): Shape[] {
  const post = 0.02;
  const plank = 0.016;
  const base = 0.035;
  const cw = (w - post * (cols + 1)) / cols;
  const rh = (h - base - plank * (rows + 1)) / rows;
  const X = x + w;
  const glass = "#1F3A2E";
  // inside the cubbies everything is in shadow
  const inside = WOOD.map((c) => tone(c, -0.45)) as Tones;
  const at = (i: number) => x + i * (cw + post);
  const shelf = (j: number) => base + j * (rh + plank);
  const shapes: Shape[] = [
    tint([[x + 0.02, d, 0], [X + 0.05, d, 0], [X + 0.05, d + 0.05, 0], [x + 0.02, d + 0.05, 0]], INK.night, 0.35),
    poly([[x, 0.004, base], [X, 0.004, base], [X, 0.004, h], [x, 0.004, h]], "#0B0C10"),
    ...box(x, 0, 0, w, d, base, WOOD.map((c) => tone(c, -0.15)) as Tones),
  ];
  for (let i = 0; i < cols; i++) shapes.push(...box(at(i), 0, base, post, d, h - base, inside));
  for (let j = 1; j < rows; j++) shapes.push(...box(x, 0, shelf(j), w, d, plank, inside));
  // the fronts of the shelves and the posts, in the light
  const front = (u1: number, u2: number, z1: number, z2: number) =>
    shaded([[u1, d, z1], [u2, d, z1], [u2, d, z2], [u1, d, z2]], WOOD[1], [u1, d, z2], [u2, d, z1], 0.2, 0.2);
  for (let j = 0; j <= rows; j++) shapes.push(front(x, X, shelf(j), shelf(j) + plank));
  for (let i = 0; i < cols; i++) shapes.push(front(at(i), at(i) + post, base, h));
  shapes.push(
    ...box(at(cols), 0, base, post, d, h - base, WOOD),
    ...panel("shade", X + 0.001, 0.02, d - 0.02, base + 0.03, h / 2 - 0.01, WOOD[2]),
    ...panel("shade", X + 0.001, 0.02, d - 0.02, h / 2 + 0.01, h - 0.03, WOOD[2]),
  );
  const gleam: V3[][] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (rnd(i * 13 + j * 7 + 3) < 0.14) continue;
      const cx = at(i) + post + cw / 2;
      const cz = shelf(j) + plank + rh * 0.5;
      const r = Math.min(cw, rh) * 0.4;
      const end = ring3("y", [cx, d + 0.004, cz], r, 0, TAU, 18);
      const [bx, by] = P(cx, d + 0.004, cz);
      const px = r * unit();
      shapes.push({
        ...poly(end, glass),
        grad: { colors: [tone(glass, 0.4), glass, tone(glass, -0.6)], from: [bx - px * 0.4, by - px * 0.4], radius: px * 1.4 },
      });
      const seal = seals[(i + j * 2 + Math.floor(rnd(i + j * 5) * 3)) % seals.length];
      shapes.push({
        ...poly(ring3("y", [cx, d + 0.012, cz], r * 0.45, 0, TAU, 12), seal),
        grad: { colors: [tone(seal, 0.45), seal, tone(seal, -0.35)], from: P(cx - r * 0.3, d, cz + r * 0.3), to: P(cx + r * 0.3, d, cz - r * 0.3) },
      });
      gleam.push(ring3("y", [cx, d + 0.006, cz], r * 0.72, 100 * DEG, 165 * DEG, 4));
    }
  }
  shapes.push(strokes(gleam, "#E8F4EE", 0.6, 0.6));
  // a cornice along the top
  shapes.push(...box(x - 0.012, 0, h, w + 0.024, d + 0.016, 0.024, WOOD.map((c) => tone(c, 0.06)) as Tones));
  return shapes;
}

/** A shipping crate: boards across its faces, a frame round each face, a
 *  diagonal brace, iron edging nailed down the near corner. */
export function crate(x: number, y: number, z: number, w: number, d: number, h: number, tones: Tones = PINE): Shape[] {
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

/** A grain sack slumped on the floor, its neck tied with cord: drawn
 *  facing the viewer, `size` in drawing units at 40 per room. */
export function sack(at: V3, size: number, fill: string, lean = 0): Shape[] {
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

/** A lantern hanging from an iron bracket on the right-hand wall (y = 0)
 *  at x: the arm and its scroll, a chain, a cage of dark iron round warm
 *  glass, a brass cap, and the flame inside. */
export function hangingLantern(x: number, z: number, accent: string): Shape[] {
  const arm = 0.11;
  const ly = arm - 0.01;
  const s = 0.05;
  const lz = z - 0.17;
  const hgt = 0.065;
  const amber: Tones = ["#FFE6A6", "#F0C36A", "#C08A3A"];
  const [x0, x1, y0, y1] = [x - s / 2, x + s / 2, ly - s / 2, ly + s / 2];
  const zt = lz + 0.012 + hgt;
  const apex: V3 = [x, ly, zt + 0.045];
  const [sx, sy] = P(x, 0.055, z - 0.035);
  return [
    // the bracket: an arm, a brace and a scroll
    line([[x, 0, z], [x, arm, z]], IRONWORK[1], 1.6),
    line([[x, 0, z - 0.07], [x, 0.065, z]], IRONWORK[1], 1.1),
    { d: `M${n(sx)} ${n(sy)} a${n(1.1 * k())} ${n(1.1 * k())} 0 1 1 ${n(0.8 * k())} ${n(0.9 * k())}`, stroke: IRONWORK[0], strokeWidth: 0.9 },
    ...box(x - 0.008, -0.004, z - 0.09, 0.016, 0.006, 0.12, IRONWORK),
    // the chain
    { ...line([[x, ly, z], [x, ly, apex[2] + 0.012]], IRONWORK[0], 0.9), dash: "1.6 1" },
    // the lantern
    ...box(x0, y0, lz, s, s, 0.012, IRONWORK),
    ...box(x0 + 0.005, y0 + 0.005, lz + 0.012, s - 0.01, s - 0.01, hgt, amber),
    ...flame([x, ly, lz + 0.016], 1.6, accent),
    strokes(
      [
        [[x1, y1, lz + 0.012], [x1, y1, zt]],
        [[x0, y1, lz + 0.012], [x0, y1, zt]],
        [[x1, y0, lz + 0.012], [x1, y0, zt]],
        [[x0 + 0.004, y1, lz + 0.012 + hgt / 2], [x1, y1, lz + 0.012 + hgt / 2], [x1, y0 + 0.004, lz + 0.012 + hgt / 2]],
      ],
      IRONWORK[2],
      1,
    ),
    ...box(x0 - 0.004, y0 - 0.004, zt, s + 0.008, s + 0.008, 0.01, IRONWORK),
    shaded([[x0 - 0.004, y1 + 0.004, zt + 0.01], [x1 + 0.004, y1 + 0.004, zt + 0.01], apex], BRASS[1], [x0, y1, zt], apex, 0.25, 0.1),
    shaded([[x1 + 0.004, y1 + 0.004, zt + 0.01], [x1 + 0.004, y0 - 0.004, zt + 0.01], apex], BRASS[2], apex, [x1, y0, zt], 0.15, 0.2),
    ball(apex, 0.7, BRASS[0], BRASS[2]),
  ];
}

/** A cobweb strung in the top corner of the two back walls. */
export function cobweb(corner: V3, size: number): Shape {
  const [cx, cy] = P(...corner);
  const s = size * unit();
  const angles = [30, 52, 72, 90, 108, 128, 150].map((d) => d * DEG);
  const lens = angles.map((_, i) => s * (0.85 + rnd(i + 9) * 0.25));
  const pt = (i: number, f: number): Pt => [cx + Math.cos(angles[i]) * lens[i] * f, cy + Math.sin(angles[i]) * lens[i] * f];
  let d = angles.map((_, i) => `M${n(cx)} ${n(cy)} L${n(pt(i, 1)[0])} ${n(pt(i, 1)[1])}`).join(" ");
  for (const f of [0.28, 0.5, 0.72, 0.92]) {
    for (let i = 0; i < angles.length - 1; i++) {
      const [a, b] = [pt(i, f), pt(i + 1, f)];
      const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const sag = 0.82;
      d += ` M${n(a[0])} ${n(a[1])} Q${n(cx + (mx - cx) * sag)} ${n(cy + (my - cy) * sag)} ${n(b[0])} ${n(b[1])}`;
    }
  }
  return { d, stroke: "#C9D0DA", strokeWidth: 0.35, opacity: 0.4 };
}

/** A small barred window high in the left wall (x = 0), from y1 to y2:
 *  its stone surround, the deep reveal, the night beyond with a star,
 *  iron bars, and the moonlight it lets onto the floor. */
export function barredWindow(y1: number, y2: number, z1: number, z2: number, stone: string): Shape[] {
  const T = THICK;
  const at = (y: number, z: number, x = 0): V3 => [x, y, z];
  const pool: V3[] = [[0.24, y1 + 0.16, 0], [0.24, y2 + 0.16, 0], [0.5, y2 + 0.24, 0], [0.5, y1 + 0.24, 0]];
  const bars = [0.25, 0.5, 0.75].map((f) => y1 + (y2 - y1) * f);
  return [
    shaded([at(y1 - 0.03, z1 - 0.03, 0.002), at(y2 + 0.03, z1 - 0.03, 0.002), at(y2 + 0.03, z2 + 0.03, 0.002), at(y1 - 0.03, z2 + 0.03, 0.002)], tone(stone, 0.1), at(y2, z2), at(y1, z1)),
    {
      ...poly([at(y1, z1, 0.003), at(y2, z1, 0.003), at(y2, z2, 0.003), at(y1, z2, 0.003)], INK.night),
      grad: { colors: ["#2A3866", "#141B36", INK.night], from: P(-T, y2, z2), to: P(-T, y1, z1) },
    },
    ball(at(y1 + (y2 - y1) * 0.62, z2 - 0.035, -T), 0.5, INK.glass),
    ball(at(y1 + (y2 - y1) * 0.3, z2 - 0.07, -T), 0.35, INK.glass),
    // the reveal: the jamb facing us and the sill
    shaded([at(y1, z1, -T), at(y1, z1, 0.003), at(y1, z2, 0.003), at(y1, z2, -T)], tone(stone, -0.05), at(y1, z2, -T), at(y1, z1, 0)),
    shaded([at(y1, z1, -T), at(y1, z1, 0.003), at(y2, z1, 0.003), at(y2, z1, -T)], tone(stone, 0.18), at(y2, z1, -T), at(y1, z1, 0)),
    strokes(bars.map((y) => [at(y, z1, -0.022), at(y, z2, -0.022)]), IRONWORK[2], 1.5),
    strokes(bars.map((y) => [at(y + 0.004, z1 + 0.005, -0.02), at(y + 0.004, z2 - 0.005, -0.02)]), IRONWORK[0], 0.45, 0.8),
    line([at(y1, (z1 + z2) / 2, -0.022), at(y2, (z1 + z2) / 2, -0.022)], IRONWORK[2], 1.2),
    tint(pool, INK.glass, 0.07),
    ...moonShaft([at(y1, z2), at(y2, z2)], [pool[2], pool[3]], INK.glass),
  ];
}

/** Square flagstones, `count` to a side, each its own stone, falling
 *  darker toward the front, with a crack or two. */
export function flagstones(count: number, base: string): Shape[] {
  const shapes: Shape[] = [];
  const g = 0.006;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      const [x1, x2, y1, y2] = [i / count + g, (i + 1) / count - g, j / count + g, (j + 1) / count - g];
      const fill = tone(base, 0.08 - ((i + j) / (2 * count)) * 0.2 + (rnd(i * 5 + j * 11) - 0.5) * 0.1);
      shapes.push({
        ...flat(x1, x2, y1, y2, 0, fill),
        grad: { colors: [tone(fill, 0.12), fill, tone(fill, -0.18)], from: P(x1, y1, 0), to: P(x2, y2, 0) },
        strokeWidth: 0.5,
      });
    }
  }
  shapes.push(
    strokes(
      [
        [[0.256, 0.52, 0], [0.29, 0.55, 0], [0.31, 0.6, 0], [0.35, 0.62, 0], [0.37, 0.68, 0]],
        [[0.75, 0.556, 0], [0.79, 0.6, 0], [0.84, 0.61, 0], [0.87, 0.66, 0]],
        [[0.506, 0.82, 0], [0.55, 0.86, 0], [0.6, 0.87, 0]],
      ],
      tone(base, -0.5),
      0.4,
      0.6,
    ),
  );
  return shapes;
}

export function cellar(accent: string): Shape[] {
  const stone = "#4A4E58";
  const [da, db] = DOOR;
  const niche: [number, number, number] = [0.05, 0.66, 0.3];
  const win: [number, number, number, number] = [0.72, 0.92, 0.5, 0.66];
  const nicheR = (niche[1] - niche[0]) / 2;
  const leftKeep: [number, number, number, number][] = [
    [niche[0] - 0.055, niche[1] + 0.055, 0, niche[2] + nicheR + 0.03],
    [win[0] - 0.03, win[1] + 0.03, win[2] - 0.03, win[3] + 0.03],
  ];
  const rightKeep: [number, number, number, number][] = [
    ...(exitOf("right") ? [[da - 0.045, db + 0.045, 0, 0.59] as [number, number, number, number]] : []),
    [0.68, 0.98, 0, 0.62],
  ];
  const casks: [number, number, number, number][] = [
    // y, z, length, radius: two on the cradle and one on top
    [0.2, 0.18, 0.3, 0.125],
    [0.36, 0.385, 0.27, 0.115],
    [0.52, 0.18, 0.3, 0.125],
  ];
  return [
    ...shell(CELLAR_STONE, { panelled: false }),
    ...flagstones(4, "#3E414A"),
    ...mats(),
    // shadow gathered along the foot of the walls
    tint([[0, 0, 0], [0.1, 0.1, 0], [0.1, 1, 0], [0, 1, 0]], "#000000", 0.25),
    tint([[0, 0, 0], [1, 0, 0], [1, 0.1, 0], [0.1, 0.1, 0]], "#000000", 0.22),
    ...masonry("x", tone(stone, -0.12), leftKeep, 3),
    ...masonry("y", stone, rightKeep, 7),
    ...archNiche(niche[0], niche[1], niche[2], "#5C606B"),
    ...barredWindow(win[0], win[1], win[2], win[3], "#5C606B"),
    cobweb([0, 0, 0.712], 0.13),
    cobweb([0, 0.98, 0.712], 0.07),
    // the lantern lighting the casks
    ...hangingLantern(0.2, 0.7, accent),
    ...lightPool([0.36, 0.34, 0], 0.4),
    // the cradle, and the casks on it
    tint([[0.03, 0.06, 0], [0.4, 0.06, 0], [0.4, 0.7, 0], [0.03, 0.7, 0]], INK.night, 0.3),
    ...box(0.07, 0.06, 0, 0.045, 0.62, 0.06, WOOD),
    ...box(0.25, 0.06, 0, 0.045, 0.62, 0.06, WOOD),
    ...casks.flatMap(([y, z, len, r]) => lyingBarrel("x", [0.03 + (0.3 - len) / 2, y, z], len, r)),
    // a drip under the front tap
    disc(0.37, 0.52, 0.002, 0.022, "#3A1C22", undefined, 0.7),
    // the wine rack right of the door
    ...wineRack(0.69, 0.28, 0.13, 0.58, 3, 5, [INK.red, "#E2B04A", INK.red, "#7A2A40", "#C9D0DA"]),
    // a small cask standing before it, a pewter jug and a bottle on its head
    ...barrel(0.85, 0.3, 0.07, 0.19, WOOD),
    disc(0.85, 0.3, 0.191, 0.055, undefined, tone(WOOD[2], -0.3), 0.8),
    ...cylinder(0.83, 0.29, 0.19, 0.022, 0.05, PEWTER),
    ...cylinder(0.83, 0.29, 0.24, 0.016, 0.012, PEWTER),
    line([[0.83, 0.315, 0.232], [0.83, 0.33, 0.222], [0.83, 0.316, 0.2]], PEWTER[2], 0.9),
    ...cylinder(0.875, 0.32, 0.19, 0.017, 0.06, ["#3E6B55", "#1F3A2E", "#152A20"]),
    ...cylinder(0.875, 0.32, 0.25, 0.007, 0.035, ["#3E6B55", "#1F3A2E", "#152A20"]),
    ...cylinder(0.875, 0.32, 0.282, 0.008, 0.008, [tone(INK.red, 0.2), INK.red, INK.redDark]),
    // the passage under the floor: its curb, the shaft and a ladder
    ...box(0.415, 0.415, -0.004, 0.29, 0.29, 0.012, CELLAR_STONE),
    flat(0.44, 0.68, 0.44, 0.68, 0.008, "#070912"),
    {
      d: path(([[0.44, 0.44, 0.008], [0.44, 0.68, 0.008], [0.44, 0.62, -0.06], [0.44, 0.44, -0.06]] as V3[]).map((p) => P(...p))),
      fill: tone(stone, -0.35),
      strokeWidth: 0.5,
      stroke: INK.night,
    },
    {
      d: path(([[0.44, 0.44, 0.008], [0.68, 0.44, 0.008], [0.62, 0.44, -0.06], [0.44, 0.44, -0.06]] as V3[]).map((p) => P(...p))),
      fill: tone(stone, -0.2),
      strokeWidth: 0.5,
      stroke: INK.night,
    },
    strokes(
      [
        [[0.5, 0.441, 0.008], [0.5, 0.441, -0.06]],
        [[0.58, 0.441, 0.008], [0.58, 0.441, -0.06]],
        [[0.5, 0.441, -0.018], [0.58, 0.441, -0.018]],
        [[0.5, 0.441, -0.046], [0.58, 0.441, -0.046]],
      ],
      WOOD[0],
      1,
    ),
    ...prop(() => [
      ...box(0.44, 0.44, 0.008, 0.24, 0.24, 0.026, WOOD),
      strokes([0.5, 0.56, 0.62].map((x) => [[x, 0.445, 0.034], [x, 0.675, 0.034]] as V3[]), tone(WOOD[0], -0.45), 0.5, 0.8),
      strokes([0.5, 0.56, 0.62].map((x) => [[x, 0.68, 0.01], [x, 0.68, 0.032]] as V3[]), tone(WOOD[1], -0.45), 0.5, 0.8),
      // iron straps with rivets
      ...[0.475, 0.605].flatMap((y) => [
        ...box(0.438, y, 0.034, 0.244, 0.04, 0.004, IRONWORK),
        ...[0.46, 0.53, 0.6, 0.66].map((x) => ball([x, y + 0.02, 0.039], 0.35, IRONWORK[0])),
      ]),
      // the ring pull on its staple
      disc(0.56, 0.56, 0.036, 0.03, undefined, IRONWORK[2], undefined, 1.8),
      disc(0.56, 0.56, 0.037, 0.03, undefined, IRONWORK[0], undefined, 0.6),
      ...box(0.55, 0.52, 0.034, 0.02, 0.012, 0.008, IRONWORK),
    ]),
    // crates and sacks by the front of the left wall
    ...crate(0.03, 0.7, 0, 0.21, 0.2, 0.19),
    ...crate(0.06, 0.73, 0.19, 0.14, 0.13, 0.12, WOOD.map((c) => tone(c, 0.08)) as Tones),
    ...sack([0.33, 0.83, 0], 4.2, "#7E6C4A", -0.08),
    ...sack([0.29, 0.93, 0], 3.6, "#8A7752", 0.1),
  ];
}

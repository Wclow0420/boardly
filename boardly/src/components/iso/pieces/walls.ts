// The room's own fabric and what's fixed to its back walls: dressed
// stone, arches, windows (barred, belfry, stained, rose), a reredos, a
// staircase, a timber post, tiles, boards, cobwebs, things hung on pegs.

import {
  ball,
  box,
  flat,
  GOLD,
  INK,
  inkOf,
  line,
  moonShaft,
  n,
  P,
  paint,
  path,
  poly,
  tone,
  unit,
  WOOD,
  type Pt,
  type Shape,
  type V3,
} from "../kit";
import { THICK, tint } from "../room";
import {
  BRASS,
  CELLAR_STONE,
  DELFT,
  IRONWORK,
  LEAD,
  LIMESTONE,
  MAHOGANY,
  MARBLE,
  PALE_GILT,
  RUBY,
  SANDSTONE,
  STAINED_GLASS,
  STEEL,
  VELVET,
} from "./materials";
import {
  bolt,
  circleOn,
  filled,
  graded,
  lit,
  onWall,
  panel,
  Pv,
  ring3,
  rnd,
  shaded,
  shadowOf,
  strokes,
  wallBox,
  type Wall,
} from "./helpers";
import { turned } from "./turned";
import { bellShape } from "./decor";

const DEG = Math.PI / 180;

// ── stonework ───────────────────────────────────────────────────────

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

/** Dressed stone up both back walls: courses `course` high with their
 *  joints staggered (blocks `block` long), and here and there a lighter
 *  block. */
export function ashlarCourses(course = 0.1, block = 0.2): Shape[] {
  const ink = paint().line;
  const shapes: Shape[] = [];
  for (let z = course; z < 0.72; z += course) {
    shapes.push({ ...line([[0, 1, z], [0, 0, z], [1, 0, z]], ink, 0.45), opacity: 0.8 });
  }
  let row = 0;
  for (let z = 0; z < 0.72 - 0.01; z += course, row++) {
    const top = Math.min(z + course, 0.72);
    for (let u = row % 2 ? block / 2 : block; u < 1; u += block) {
      shapes.push({ ...line([[0, u, z], [0, u, top]], ink, 0.4), opacity: 0.7 });
      shapes.push({ ...line([[u, 0, z], [u, 0, top]], ink, 0.4), opacity: 0.7 });
      // a lighter stone now and then, so the wall isn't a grid
      if ((row * 7 + Math.round(u * 10)) % 5 === 0) {
        const u2 = Math.min(u + block, 1);
        shapes.push(tint([[0, u, z], [0, u2, z], [0, u2, top], [0, u, top]], "#FFFFFF", 0.05));
        shapes.push(tint([[u, 0, z], [u2, 0, z], [u2, 0, top], [u, 0, top]], "#FFFFFF", 0.04));
      }
    }
  }
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

// ── windows ─────────────────────────────────────────────────────────

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

/** Points round a half circle on a wall, from u1 over the top to u2. */
function arc(wall: Wall, u1: number, u2: number, spring: number, steps = 10, rise = 1): V3[] {
  const mid = (u1 + u2) / 2;
  const r = (u2 - u1) / 2;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = Math.PI - (i / steps) * Math.PI;
    return onWall(wall, mid + Math.cos(t) * r, spring + Math.sin(t) * r * rise);
  });
}

/** A belfry opening on a back wall, from u1 to u2: a dressed stone
 *  surround of voussoirs under a keystone, the night beyond, a slender
 *  column parting it into two arches under a pierced tympanum, and a
 *  projecting sill. `sky` draws what shows through (moon, stars), between
 *  the night and the stonework. */
export function belfryOpening(wall: Wall, u1: number, u2: number, z0: number, spring: number, sky: Shape[] = []): Shape[] {
  const mid = (u1 + u2) / 2;
  const r = (u2 - u1) / 2;
  const R = r + 0.05;
  const A = (u: number, z: number) => onWall(wall, u, z);
  const outer: V3[] = [A(mid - R, z0 - 0.03), ...arc(wall, mid - R, mid + R, spring, 12), A(mid + R, z0 - 0.03)];
  const inner: V3[] = [A(u1, z0), ...arc(wall, u1, u2, spring, 12), A(u2, z0)];
  const shapes: Shape[] = [
    lit(outer, SANDSTONE[1], A(mid - R, spring + R), A(mid + R, z0), 0.2, 0.25),
    {
      ...poly(inner, INK.night),
      grad: { colors: ["#0A0D1C", "#141B36", "#26335E"], from: P(...A(mid, spring + r)), to: P(...A(mid, z0)) },
    },
    ...sky,
  ];
  // voussoir joints, and the keystone standing proud
  for (let i = 1; i < 9; i++) {
    if (i === 4 || i === 5) continue;
    const t = Math.PI - (i / 9) * Math.PI;
    shapes.push(
      line([A(mid + Math.cos(t) * r, spring + Math.sin(t) * r), A(mid + Math.cos(t) * R, spring + Math.sin(t) * R)], SANDSTONE[2], 0.5),
    );
  }
  for (const z of [z0 + 0.09, z0 + 0.19, spring]) {
    shapes.push(line([A(mid - R, z), A(u1, z)], SANDSTONE[2], 0.5), line([A(u2, z), A(mid + R, z)], SANDSTONE[2], 0.5));
  }
  const kt = 0.045;
  shapes.push(
    lit(
      [A(mid - kt * 0.7, spring + r - 0.005), A(mid + kt * 0.7, spring + r - 0.005), A(mid + kt, spring + R + 0.025), A(mid - kt, spring + R + 0.025)],
      SANDSTONE[0],
      A(mid - kt, spring + R + 0.025),
      A(mid + kt, spring + r),
      0.25,
      0.2,
    ),
  );
  // the tympanum over two little arches, pierced by an oculus
  const sr = (r - 0.015) / 2;
  const sub = spring + 0.04;
  const tympanum: V3[] = [
    A(u1, spring),
    ...arc(wall, u1, u2, spring, 12),
    A(u2, sub),
    ...arc(wall, mid + 0.015, u2, sub, 8).reverse(),
    ...arc(wall, u1, mid - 0.015, sub, 8).reverse(),
    A(u1, sub),
  ];
  shapes.push(lit(tympanum, tone(SANDSTONE[1], -0.08), A(u1, spring + r), A(u2, sub), 0.15, 0.25));
  const oz = (sub + sr + spring + r) / 2;
  const or = Math.min(0.026, (spring + r - sub - sr) / 2 - 0.006);
  shapes.push(
    { ...poly(circleOn(wall, mid, oz, or + 0.008), SANDSTONE[0]), strokeWidth: 0.45 },
    { ...poly(circleOn(wall, mid, oz, or), "#141B36"), stroke: SANDSTONE[2], strokeWidth: 0.45 },
  );
  // the column: base, shaft, carved capital
  shapes.push(
    ...wallBox(wall, mid - 0.024, 0, z0, 0.048, 0.04, 0.022, SANDSTONE),
    ...wallBox(wall, mid - 0.013, 0.006, z0 + 0.022, 0.026, 0.026, sub - z0 - 0.045, SANDSTONE),
    ...wallBox(wall, mid - 0.03, -0.004, sub - 0.023, 0.06, 0.044, 0.023, SANDSTONE),
  );
  // the sill
  shapes.push(...wallBox(wall, mid - R - 0.015, 0, z0 - 0.045, 2 * R + 0.03, 0.045, 0.035, SANDSTONE));
  return shapes;
}

/** The height of an equilateral pointed arch over [from, to] at u. */
function archTop(from: number, to: number, spring: number, u: number): number {
  const w = to - from;
  const c = u <= (from + to) / 2 ? to : from;
  return spring + Math.sqrt(Math.max(0, w * w - (u - c) * (u - c)));
}

/** A pointed opening's outline on a wall, sill to apex and back. */
function pointed(wall: Wall, from: number, to: number, z0: number, spring: number, steps = 12): V3[] {
  const pts: V3[] = [onWall(wall, from, z0), onWall(wall, to, z0)];
  for (let i = 0; i <= steps; i++) {
    const u = to - ((to - from) * i) / steps;
    pts.push(onWall(wall, u, archTop(from, to, spring, u)));
  }
  return pts;
}

/** A stained-glass lancet in a back wall, from u = from to to: a pale
 *  stone surround and sill, panes of jewel glass in lead (`panes`, a
 *  pattern of colours) split by a mullion under a little round light,
 *  and the coloured light it throws across the floor. */
export function stainedWindow(
  wall: Wall,
  from: number,
  to: number,
  z0: number,
  spring: number,
  panes: string[],
  light: string,
): Shape[] {
  const mid = (from + to) / 2;
  const w = to - from;
  const apex = spring + w * 0.866;
  const e = 0.026;
  const A = (u: number, z: number) => onWall(wall, u, z);
  const shapes: Shape[] = [
    lit(pointed(wall, from - e, to + e, z0 - e, spring), LIMESTONE[1], A(from - e, apex + e), A(to + e, z0), 0.2, 0.25),
    { ...poly(pointed(wall, from, to, z0, spring), "#0E1226"), strokeWidth: 0.5 },
  ];
  // the panes: two lights of two columns each, clipped to the arch: a
  // border of alternating glass up the outer edges, the field between,
  // and a medallion in the middle of each light
  const rows = Math.ceil((apex - z0) / 0.04);
  const dz = (apex - z0) / rows;
  const medal = Math.floor(rows * 0.38);
  const cols = 4;
  for (let r = 0; r < rows; r++) {
    const za = z0 + r * dz;
    const zb = za + dz;
    for (let c = 0; c < cols; c++) {
      const u1 = from + (w * c) / cols;
      const u2 = from + (w * (c + 1)) / cols;
      const top = (u: number) => Math.min(zb, archTop(from, to, spring, u));
      if (za >= Math.max(top(u1), top(u2), top((u1 + u2) / 2)) - 0.004) continue;
      const pts: V3[] = [A(u1, za), A(u2, za)];
      for (let i = 0; i <= 4; i++) {
        const u = u2 - ((u2 - u1) * i) / 4;
        pts.push(A(u, Math.max(za, top(u))));
      }
      const outer = c === 0 || c === cols - 1;
      const color = outer
        ? panes[r % 2 ? 2 : 0]
        : r === medal
          ? panes[3]
          : Math.abs(r - medal) === 1
            ? panes[4]
            : panes[1];
      shapes.push({
        ...poly(pts, color),
        grad: { colors: [tone(color, 0.38), color, tone(color, -0.2)], from: P(...A(u1, zb)), to: P(...A(u2, za)) },
        stroke: LEAD,
        strokeWidth: 0.45,
      });
    }
  }
  // the mullion, and a round light in the head
  const oz = spring + (apex - spring) * 0.34;
  const or = w * 0.17;
  shapes.push(
    line([A(mid, z0), A(mid, oz - or)], LIMESTONE[2], 1.6),
    line([A(mid, z0), A(mid, oz - or)], LIMESTONE[0], 0.8),
    { ...poly(circleOn(wall, mid, oz, or + 0.008, 14), LIMESTONE[0]), strokeWidth: 0.45 },
    {
      ...poly(circleOn(wall, mid, oz, or, 14), STAINED_GLASS.amber),
      grad: { colors: ["#FFF0B8", STAINED_GLASS.amber, "#B07A20"], from: P(...A(mid - or * 0.4, oz + or * 0.4)), radius: or * 100 * 1.6 },
      stroke: LEAD,
      strokeWidth: 0.45,
    },
    line([A(mid - or, oz), A(mid + or, oz)], LEAD, 0.4),
    line([A(mid, oz - or), A(mid, oz + or)], LEAD, 0.4),
    { ...line([A(from + 0.012, z0 + 0.02), A(from + 0.012, spring)], "#FFFFFF", 0.5), opacity: 0.35 },
  );
  // the sill
  shapes.push(...wallBox(wall, from - e - 0.012, 0, z0 - e - 0.03, w + 2 * e + 0.024, 0.04, 0.03, LIMESTONE));
  // coloured light on the floor
  const pool: V3[] =
    wall === "x"
      ? [[0.05, from, 0], [0.05, to, 0], [0.4, to + 0.12, 0], [0.4, from + 0.12, 0]]
      : [[from, 0.05, 0], [to, 0.05, 0], [to + 0.12, 0.4, 0], [from + 0.12, 0.4, 0]];
  shapes.push(tint(pool, light, 0.1), ...moonShaft([A(from, apex - 0.04), A(to, apex - 0.04)], [pool[2], pool[3]], light));
  return shapes;
}

/** A rose window on a back wall centred at (u, z), radius r: a pale
 *  stone ring, petals of ruby and sapphire glass in lead round a gold
 *  centre, and a jewel at its heart. */
export function roseWindow(wall: Wall, u: number, z: number, r: number): Shape[] {
  const A = (uu: number, zz: number) => onWall(wall, uu, zz);
  const shapes: Shape[] = [
    lit(circleOn(wall, u, z, r + 0.024, 28), LIMESTONE[1], A(u - r, z + r), A(u + r, z - r), 0.2, 0.25),
    { ...poly(circleOn(wall, u, z, r, 28), "#0E1226"), strokeWidth: 0.5 },
  ];
  const petals = 8;
  const r0 = r * 0.4;
  for (let i = 0; i < petals; i++) {
    const a1 = (i / petals) * Math.PI * 2 + 0.06;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - 0.06;
    const pts: V3[] = [];
    for (let j = 0; j <= 4; j++) {
      const a = a1 + ((a2 - a1) * j) / 4;
      pts.push(A(u + Math.cos(a) * r * 0.92, z + Math.sin(a) * r * 0.92));
    }
    pts.push(A(u + Math.cos((a1 + a2) / 2) * r0 * 1.1, z + Math.sin((a1 + a2) / 2) * r0 * 1.1));
    const color = i % 2 ? STAINED_GLASS.sapphire : STAINED_GLASS.ruby;
    shapes.push({
      ...poly(pts, color),
      grad: { colors: [tone(color, 0.4), color, tone(color, -0.2)], from: P(...A(u, z)), radius: r * 100 * 1.1 },
      stroke: LEAD,
      strokeWidth: 0.45,
    });
  }
  // stone spokes between the petals
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    shapes.push(line([A(u + Math.cos(a) * r0, z + Math.sin(a) * r0), A(u + Math.cos(a) * r, z + Math.sin(a) * r)], LIMESTONE[0], 0.9));
  }
  shapes.push(
    { ...poly(circleOn(wall, u, z, r0, 16), LIMESTONE[0]), strokeWidth: 0.45 },
    {
      ...poly(circleOn(wall, u, z, r0 * 0.78, 16), STAINED_GLASS.amber),
      grad: { colors: ["#FFF2B8", STAINED_GLASS.amber, "#9A6B1E"], from: P(...A(u - r0 * 0.3, z + r0 * 0.3)), radius: r0 * 100 * 1.4 },
      stroke: LEAD,
      strokeWidth: 0.45,
    },
    ball(A(u, z), 0.75, RUBY, inkOf(RUBY)),
    { ...ball(A(u - 0.003, z + 0.004), 0.22, "#FFFFFF"), opacity: 0.85 },
  );
  return shapes;
}

/** A gilded reredos on the right-hand wall (y = 0) behind an altar, from
 *  x1 to x2: three pointed panels of night blue with gold stars, the
 *  middle one taller, in a gilt frame. */
export function reredos(x1: number, x2: number, z1: number, z2: number): Shape[] {
  const w = (x2 - x1) / 3;
  const shapes: Shape[] = [
    lit([[x1, 0.002, z1], [x2, 0.002, z1], [x2, 0.002, z2], [x1, 0.002, z2]], PALE_GILT[1], [x1, 0, z2], [x2, 0, z1], 0.3, 0.25),
  ];
  for (let i = 0; i < 3; i++) {
    const a = x1 + w * i + 0.016;
    const b = x1 + w * (i + 1) - 0.016;
    const spring = z2 - (i === 1 ? 0.04 : 0.07);
    shapes.push(lit(pointed("y", a - 0.012, b + 0.012, z1, spring), PALE_GILT[1], [a, 0, z2], [b, 0, z1], 0.3, 0.25));
    const inner = pointed("y", a, b, z1 + 0.016, spring).map(([x, , z]) => [x, 0.003, z] as V3);
    shapes.push({
      ...poly(inner, "#1E2C5E"),
      grad: { colors: ["#2E4280", "#1E2C5E", "#121A3A"], from: P(a, 0, z2), to: P(b, 0, z1) },
      stroke: PALE_GILT[2],
      strokeWidth: 0.45,
    });
    for (const [fu, fz] of [[0.3, 0.3], [0.7, 0.55], [0.4, 0.75], [0.65, 0.18]]) {
      shapes.push(ball([a + (b - a) * fu, 0.004, z1 + 0.02 + (spring - z1) * fz], 0.2, PALE_GILT[0]));
    }
  }
  shapes.push({ ...line([[x1 + 0.01, 0.003, z1 + 0.006], [x2 - 0.01, 0.003, z1 + 0.006]], "#FFFFFF", 0.5), opacity: 0.4 });
  return shapes;
}

// ── structure ───────────────────────────────────────────────────────

/** A grand staircase climbing toward the back (-y) along a left-hand
 *  wall: panelled mahogany under marble treads, a crimson runner held by
 *  brass rods, turned balusters under a handrail along the open side,
 *  and a newel post at each end with a brass finial. Step 0 is the top,
 *  at y0; each step is `run` deep and `rise` high. */
export function staircase(x: number, y0: number, w: number, count: number, run: number, rise: number): Shape[] {
  const X = x + w;
  const tread = 0.016;
  const nose = 0.008;
  const top = (i: number) => rise * (count - i);
  const [r1, r2] = [x + w * 0.2, x + w * 0.74];
  const shapes: Shape[] = [shadowOf(x, y0, w, count * run)];
  const rod = (i: number): Shape[] => {
    const ry = y0 + (i + 1) * run + 0.006;
    const z = (i < count - 1 ? top(i + 1) : 0) + 0.006;
    return [
      line([[r1 - 0.008, ry, z], [r2 + 0.008, ry, z]], tone(BRASS[2], -0.4), 1.6),
      line([[r1 - 0.008, ry, z], [r2 + 0.008, ry, z]], BRASS[0], 0.8),
      ball([r1 - 0.01, ry, z], 0.5, BRASS[0], BRASS[2]),
      ball([r2 + 0.01, ry, z], 0.5, BRASS[0], BRASS[2]),
    ];
  };
  for (let i = 0; i < count; i++) {
    const y = y0 + i * run;
    const Y = y + run;
    const h = top(i);
    const below = i < count - 1 ? top(i + 1) : 0;
    shapes.push(...box(x, y, 0, w, run, h - tread, MAHOGANY));
    if (h - tread > 0.08) shapes.push(...panel("shade", X, y + 0.008, Y - 0.006, 0.03, h - tread - 0.024, MAHOGANY[2]));
    // the runner down the riser
    shapes.push(filled([[r1, Y + 0.001, below], [r2, Y + 0.001, below], [r2, Y + 0.001, h - tread], [r1, Y + 0.001, h - tread]], [VELVET[0], VELVET[1], VELVET[2]], [r1, Y, h], [r2, Y, below]));
    // the marble tread, its nosing, the runner over it
    shapes.push(...box(x, y, h - tread, w + nose, run + nose, tread, MARBLE));
    shapes.push({ ...flat(r1, r2, y, Y + nose, h, VELVET[0], GOLD[2]), strokeWidth: 0.6 });
    shapes.push(filled([[r1, Y + nose + 0.0005, h - tread], [r2, Y + nose + 0.0005, h - tread], [r2, Y + nose + 0.0005, h], [r1, Y + nose + 0.0005, h]], [VELVET[0], VELVET[1], VELVET[2]], [r1, Y, h], [r2, Y, h - tread]));
    if (i > 0) shapes.push(...rod(i - 1));
  }
  shapes.push(...rod(count - 1));
  // the balustrade along the open side
  const railH = 0.17;
  const yc0 = y0 + run / 2;
  const slope = -rise / run;
  const railAt = (y: number) => top(0) + railH + slope * (y - yc0);
  const bx = X - 0.012;
  const yTop = y0 + 0.016;
  const yEnd = y0 + count * run - 0.016;
  const newel = (ny: number, z: number, h: number): Shape[] => [
    ...box(bx - 0.016, ny - 0.016, z, 0.032, 0.032, h, MAHOGANY),
    ...panel("lit", ny + 0.016, bx - 0.011, bx + 0.011, z + 0.03, z + h - 0.03, MAHOGANY[1]),
    ...box(bx - 0.021, ny - 0.021, z + h, 0.042, 0.042, 0.014, MAHOGANY),
    ...turned([bx, ny, z + h + 0.014], [[0.012, 0], [0.006, 0.008], [0.004, 0.014]], [BRASS[0], BRASS[1], BRASS[2]]),
    ball([bx, ny, z + h + 0.034], 1.25, BRASS[0], BRASS[2]),
  ];
  shapes.push(...newel(yTop, top(0), railAt(yTop) - top(0) + 0.02));
  for (let i = 0; i < count; i++) {
    for (const f of [0.28, 0.74]) {
      const yb = y0 + i * run + run * f;
      if (yb < yTop + 0.02 || yb > yEnd - 0.02) continue;
      const zb = top(i);
      const zt = railAt(yb);
      shapes.push(
        line([[bx, yb, zb], [bx, yb, zt]], tone(MAHOGANY[2], -0.5), 1.5),
        line([[bx, yb, zb], [bx, yb, zt]], MAHOGANY[0], 0.8),
        ball([bx, yb, zb + (zt - zb) * 0.3], 0.5, MAHOGANY[0], tone(MAHOGANY[2], -0.5)),
      );
    }
  }
  const rail: V3[] = [
    [bx, yTop, railAt(yTop)],
    [bx, yEnd, railAt(yEnd)],
  ];
  shapes.push(
    line(rail, tone(MAHOGANY[2], -0.55), 3),
    line(rail, MAHOGANY[0], 2),
    { ...line(rail.map(([a, b, c]): V3 => [a, b, c + 0.005]), "#FFFFFF", 0.5), opacity: 0.4 },
  );
  // the bottom newel stands on the floor in front of the last step
  shapes.push(...newel(yEnd, 0, railAt(yEnd) + 0.02));
  return shapes;
}

/** A heavy oak post with its front corner chamfered (a lighter bevel
 *  with stops at both ends) and an iron strap bolted round it at each
 *  height in `straps`. */
export function chamferedPost(x: number, y: number, z: number, w: number, d: number, h: number, straps: number[] = []): Shape[] {
  const X = x + w;
  const Y = y + d;
  const c = Math.min(w, d) * 0.28;
  const z1 = z + 0.04;
  const z2 = z + h - 0.04;
  const shapes: Shape[] = [
    ...box(x, y, z, w, d, h, WOOD),
    lit([[X - c, Y, z1], [X, Y - c, z1], [X, Y - c, z2], [X - c, Y, z2]], tone(WOOD[0], -0.05), [X - c, Y, z2], [X, Y - c, z1], 0.15, 0.2),
    poly([[X - c, Y, z1], [X, Y, z1 - 0.02], [X, Y - c, z1]], WOOD[1]),
    poly([[X - c, Y, z2], [X, Y, z2 + 0.02], [X, Y - c, z2]], WOOD[0]),
  ];
  for (const sz of straps) {
    // the strap's two faces that show, wrapped round the post
    const Z = sz + 0.016;
    shapes.push(
      lit([[x - 0.002, Y + 0.003, sz], [X + 0.003, Y + 0.003, sz], [X + 0.003, Y + 0.003, Z], [x - 0.002, Y + 0.003, Z]], IRONWORK[1], [x, Y, Z], [X, Y, sz], 0.3, 0.2),
      lit([[X + 0.003, y - 0.002, sz], [X + 0.003, Y + 0.003, sz], [X + 0.003, Y + 0.003, Z], [X + 0.003, y - 0.002, Z]], IRONWORK[2], [X, y, Z], [X, Y, sz], 0.2, 0.2),
      { ...line([[x, Y + 0.003, Z], [X + 0.003, Y + 0.003, Z], [X + 0.003, y, Z]], "#FFFFFF", 0.4), opacity: 0.35 },
    );
    shapes.push(...bolt([x + w * 0.3, Y + 0.004, sz + 0.007], 0.45), ...bolt([X + 0.004, y + d * 0.55, sz + 0.007], 0.45));
  }
  return shapes;
}

// ── on the walls ────────────────────────────────────────────────────

/** A peal board on the right-hand wall (y = 0), x1..x2 and z1..z2: a carved frame round an
 *  ivory panel, a gilded heading with a little bell, lines of lettering. */
export function pealBoard(x1: number, x2: number, z1: number, z2: number): Shape[] {
  const f = 0.016;
  const shapes: Shape[] = [
    lit([[x1, 0.002, z1], [x2, 0.002, z1], [x2, 0.002, z2], [x1, 0.002, z2]], WOOD[1], [x1, 0, z2], [x2, 0, z1]),
    ...panel("lit", 0.003, x1 + f, x2 - f, z1 + f, z2 - f, "#F4EEDF"),
    lit(
      [[x1 + f + 0.008, 0.004, z2 - f - 0.04], [x2 - f - 0.008, 0.004, z2 - f - 0.04], [x2 - f - 0.008, 0.004, z2 - f - 0.012], [x1 + f + 0.008, 0.004, z2 - f - 0.012]],
      "#E2B04A",
      [x1, 0, z2],
      [x2, 0, z2 - 0.05],
      0.3,
      0.25,
    ),
  ];
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const z = z2 - f - 0.06 - i * ((z2 - z1 - 2 * f - 0.08) / rows);
    const end = x2 - f - 0.012 - ((i * 3) % 4) * 0.012;
    shapes.push({ ...line([[x1 + f + 0.012, 0.004, z], [end, 0.004, z]], "#6A5434", 0.55), opacity: 0.85 });
  }
  const [bx, by] = P((x1 + x2) / 2, 0.004, z2 - f - 0.026);
  shapes.push(...bellShape(bx, by, 1.6).slice(3, 5));
  return shapes;
}

/** Blue-and-white tiles on the left-hand wall, y1..y2 and z1..z2 (behind
 *  a sink). */
export function delftTiles(y1: number, y2: number, z1: number, z2: number): Shape[] {
  const at = (u: number, z: number): V3 => [0.002, u, z];
  const s = 0.034;
  const grid: V3[][] = [];
  const motif: V3[][] = [];
  for (let u = y1 + s; u < y2 - 0.002; u += s) grid.push([at(u, z1), at(u, z2)]);
  for (let z = z1 + s; z < z2 - 0.002; z += s) grid.push([at(y1, z), at(y2, z)]);
  for (let u = y1 + s / 2; u < y2; u += s) {
    for (let z = z1 + s / 2; z < z2; z += s) {
      motif.push([at(u - 0.007, z), at(u + 0.007, z)], [at(u, z - 0.007), at(u, z + 0.007)]);
    }
  }
  return [
    filled([at(y1, z1), at(y2, z1), at(y2, z2), at(y1, z2)], ["#FFFFFF", "#E8ECF2", "#B4BED0"], at(y2, z2), at(y1, z1), "#5A6880"),
    strokes(grid, "#8A96AC", 0.45, 0.9),
    strokes(motif, DELFT, 0.8, 0.85),
  ];
}

/** A board nailed across a wall at x = at: from (u1, z1) to (u2, z2) in
 *  the wall's plane, `w` wide, a nail at each end. */
export function boardAcross(at: number, u1: number, z1: number, u2: number, z2: number, w: number, fill: string): Shape[] {
  const len = Math.hypot(u2 - u1, z2 - z1);
  const [pu, pz] = [(-(z2 - z1) / len) * (w / 2), ((u2 - u1) / len) * (w / 2)];
  const pts: V3[] = [
    [at, u1 + pu, z1 + pz],
    [at, u2 + pu, z2 + pz],
    [at, u2 - pu, z2 - pz],
    [at, u1 - pu, z1 - pz],
  ];
  // its thickness, showing along the lower edge
  const edge: V3[] = [pts[3], pts[2], [at - 0.012, pts[2][1], pts[2][2]], [at - 0.012, pts[3][1], pts[3][2]]];
  const nail = (u: number, z: number) => ball([at + 0.002, u, z], 0.55, IRONWORK[0], IRONWORK[2]);
  const du = (u2 - u1) / len;
  const dz = (z2 - z1) / len;
  return [
    poly(edge, tone(fill, -0.35)),
    { ...poly(pts, fill), grad: { colors: [tone(fill, 0.25), fill, tone(fill, -0.25)], from: P(...pts[0]), to: P(...pts[3]) } },
    { ...line([[at, u1 + du * 0.02, z1 + dz * 0.02], [at, u2 - du * 0.02, z2 - dz * 0.02]], tone(fill, -0.35), 0.4), opacity: 0.6 },
    nail(u1 + du * 0.025, z1 + dz * 0.025),
    nail(u2 - du * 0.025, z2 - dz * 0.025),
  ];
}

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
    graded(path(handle), "#B98A55", handle[0], handle[2], 0.3, 0.35),
    graded(path(head), STEEL.mid, head[0], head[3], 0.5, 0.35, STEEL.ink),
    { d: path([head[2], head[3], head[4]], false), stroke: "#FFFFFF", strokeWidth: 0.7, opacity: 0.85 },
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
    lace.push({ d: path([local(a * f, -half), local(a * f, half)], false), stroke: "#E8D6A8", strokeWidth: 0.45, opacity: 0.9 });
  }
  for (const q of [-0.4, 0, 0.4]) {
    lace.push({ d: path([local(-a * 0.75, b * q * 0.6), local(a * 0.85, b * q)], false), stroke: "#E8D6A8", strokeWidth: 0.45, opacity: 0.9 });
  }
  return [
    { d: path(rim), fill: "#2A1C12", opacity: 0.35 },
    ...lace,
    { d: path(rim), stroke: "#3A2408", strokeWidth: 2.2 },
    { d: path(rim), stroke: "#C99A5E", strokeWidth: 1.2 },
    { d: path([local(a * 0.05, -b * 0.5), local(a * 0.05, b * 0.5)], false), stroke: "#5A3A1E", strokeWidth: 1.4 },
  ];
}

/** A cobweb strung in a top corner of the back walls at world point
 *  `corner`, its threads `size` long. */
export function cornerCobweb(corner: V3, size: number): Shape {
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

/** A cobweb in a top corner on the right wall's plane, at (x, z), `r`
 *  across: threads fanning down and to the right, joined in sagging
 *  rings. */
export function wallCobweb(x: number, z: number, r: number): Shape[] {
  const at = (a: number, rr: number): V3 => [x + Math.cos(a) * rr, 0.006, z - Math.sin(a) * rr];
  const spokes = [0, 0.4, 0.8, 1.2, 1.57];
  const silk = "#E8EEF6";
  const shapes: Shape[] = spokes.map((a) => ({ ...line([at(a, 0), at(a, r)], silk, 0.35), opacity: 0.6 }));
  for (const f of [0.35, 0.65, 0.95]) {
    shapes.push({ ...line(spokes.map((a, i) => at(a, r * f * (i % 2 ? 0.9 : 1))), silk, 0.35), opacity: 0.55 });
  }
  return shapes;
}

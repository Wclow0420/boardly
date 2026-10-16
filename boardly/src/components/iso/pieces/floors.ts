// What lies on the floor: patches and inlays, flagstones, runners and
// rugs, a hatch down.

import {
  box,
  flat,
  GOLD,
  INK,
  inkOf,
  line,
  n,
  P,
  paint,
  path,
  poly,
  tone,
  unit,
  WOOD,
  type Shape,
  type V3,
} from "../kit";
import { disc, tint } from "../room";
import { CRIMSON, GILT, IRONWORK, PAGES, PALE_GILT } from "./materials";
import { bolt, gradPoly, lit, rnd, rod, strokes } from "./helpers";

/** A patch of floor, x1..x2 by y1..y2 in `fill` (edged in `stroke`), lit
 *  the way the room's floor is, so a pattern laid
 *  on it keeps the fall of light from the back corner to the front. */
export function floorPatch(x1: number, x2: number, y1: number, y2: number, fill: string, stroke?: string): Shape {
  return {
    ...flat(x1, x2, y1, y2, 0, fill, stroke),
    grad: { colors: [tone(fill, 0.16), fill, tone(fill, -0.22)], from: P(0, 0, 0), to: P(1, 1, 0) },
    strokeWidth: 0.45,
  };
}

/** A compass star inlaid in the floor at (x, y), `r` to its long points:
 *  eight gilt points, each in a
 *  lit and a shaded half, round a jewelled boss. */
export function floorStar(x: number, y: number, r: number, boss: string = INK.red): Shape[] {
  const shapes: Shape[] = [disc(x, y, 0, r * 0.62, tone(paint().floor, -0.3), GOLD[2], 0.9)];
  const at = (a: number, d: number): V3 => [x + Math.cos(a) * d, y + Math.sin(a) * d, 0];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const long = i % 2 === 0 ? r : r * 0.62;
    const side = r * 0.16;
    const tip = at(a, long);
    const l = at(a - Math.PI / 4, side);
    const rr = at(a + Math.PI / 4, side);
    const c: V3 = [x, y, 0];
    shapes.push(poly([c, l, tip], i % 2 ? GOLD[1] : GOLD[0], GOLD[2]), poly([c, tip, rr], i % 2 ? GOLD[2] : GOLD[1], GOLD[2]));
  }
  shapes.push(disc(x, y, 0, r * 0.18, boss, GOLD[2], 1, 0.8), disc(x, y, 0, r * 0.08, GOLD[0], GOLD[2]));
  return shapes;
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

/** A long runner on the floor from y1 to y2, x1..x2 across: a crimson
 *  field inside gilt lines on a dark border, fringed at the ends. */
export function galleryRunner(x1: number, x2: number, y1: number, y2: number, field = "#8E2433", border = "#2A1A3A"): Shape[] {
  const quad = (m: number): V3[] => [[x1 + m, y1, 0], [x2 - m, y1, 0], [x2 - m, y2, 0], [x1 + m, y2, 0]];
  return [
    { ...line([[x1 + 0.008, y2 + 0.01, 0], [x2 - 0.008, y2 + 0.01, 0]], PAGES[1], 1.8), dash: "0.3 1.1", opacity: 0.8 },
    gradPoly(quad(0), [tone(border, 0.2), border, tone(border, -0.3)], [x1, y1, 0], [x2, y2, 0], tone(border, -0.6), 0.5),
    gradPoly(quad(0.018), [tone(field, 0.2), field, tone(field, -0.3)], [x1, y1, 0], [x2, y2, 0], GILT[1], 0.55),
    { ...line([[(x1 + x2) / 2, y1 + 0.03, 0], [(x1 + x2) / 2, y2 - 0.03, 0]], GILT[1], 1.2), dash: "0.1 5", opacity: 0.9 },
  ];
}

/** A runner carpet along y from y1 to y2, x1 to x2: crimson with gold
 *  borders and a row of gold lozenges down the middle. */
export function aisleRunner(x1: number, x2: number, y1: number, y2: number): Shape[] {
  const mid = (x1 + x2) / 2;
  const shapes: Shape[] = [
    lit([[x1, y1, 0.001], [x2, y1, 0.001], [x2, y2, 0.001], [x1, y2, 0.001]], CRIMSON, [x1, y1, 0], [x2, y2, 0], 0.15, 0.3),
    line([[x1 + 0.012, y1 + 0.01, 0.002], [x1 + 0.012, y2 - 0.004, 0.002]], PALE_GILT[1], 0.9),
    line([[x2 - 0.012, y1 + 0.01, 0.002], [x2 - 0.012, y2 - 0.004, 0.002]], PALE_GILT[1], 0.9),
    { ...line([[x1 + 0.022, y1 + 0.01, 0.002], [x1 + 0.022, y2 - 0.004, 0.002]], PALE_GILT[2], 0.45), dash: "1 1" },
    { ...line([[x2 - 0.022, y1 + 0.01, 0.002], [x2 - 0.022, y2 - 0.004, 0.002]], PALE_GILT[2], 0.45), dash: "1 1" },
  ];
  shapes.push({ ...line([[x1 + 0.004, y2 + 0.008, 0.002], [x2 - 0.004, y2 + 0.008, 0.002]], PALE_GILT[1], 1.4), dash: "0.5 0.6" });
  for (let yc = y1 + 0.07; yc < y2 - 0.04; yc += 0.11) {
    shapes.push(
      lit([[mid, yc - 0.03, 0.002], [mid + 0.022, yc, 0.002], [mid, yc + 0.03, 0.002], [mid - 0.022, yc, 0.002]], PALE_GILT[1], [mid, yc - 0.03, 0], [mid, yc + 0.03, 0], 0.3, 0.2),
      flat(mid - 0.006, mid + 0.006, yc - 0.008, yc + 0.008, 0.003, CRIMSON),
    );
  }
  return shapes;
}

/** A rug lying on the floor, x1..x2 by y1..y2: a fringe at each end, a dark outer border,
 *  a crimson field inside gilt lines, a band of lozenges, corner
 *  spandrels and a medallion. */
export function medallionRug(x1: number, x2: number, y1: number, y2: number, field = "#8E2433", border = "#1E2A4E"): Shape[] {
  const mid: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const inset = (m: number): V3[] => [[x1 + m, y1 + m, 0], [x2 - m, y1 + m, 0], [x2 - m, y2 - m, 0], [x1 + m, y2 - m, 0]];
  const gold = GILT[1];
  const shapes: Shape[] = [
    // the fringes along the two short ends
    { ...line([[x1 + 0.01, y2 + 0.012, 0], [x2 - 0.01, y2 + 0.012, 0]], PAGES[1], 2), dash: "0.3 1.2", opacity: 0.85 },
    { ...line([[x1 + 0.01, y1 - 0.012, 0], [x2 - 0.01, y1 - 0.012, 0]], PAGES[1], 2), dash: "0.3 1.2", opacity: 0.85 },
    gradPoly(inset(0), [tone(border, 0.15), border, tone(border, -0.3)], [x1, y1, 0], [x2, y2, 0], tone(border, -0.6), 0.5),
    { d: path(inset(0.012).map((p) => P(...p))), stroke: gold, strokeWidth: 0.5 },
  ];
  // lozenges round the border
  const band = 0.026;
  const diamonds: string[] = [];
  const diamond = (u: number, v: number, s: number) => {
    const pts: V3[] = [[u - s, v, 0], [u, v - s, 0], [u + s, v, 0], [u, v + s, 0]];
    diamonds.push(path(pts.map((p) => P(...p))));
  };
  for (let u = x1 + 0.04; u < x2 - 0.03; u += 0.045) {
    diamond(u, y1 + band, 0.009);
    diamond(u, y2 - band, 0.009);
  }
  for (let v = y1 + 0.07; v < y2 - 0.05; v += 0.045) {
    diamond(x1 + band, v, 0.009);
    diamond(x2 - band, v, 0.009);
  }
  shapes.push({ d: diamonds.join(" "), fill: "#C8692A", stroke: tone("#C8692A", -0.5), strokeWidth: 0.3 });
  shapes.push(
    gradPoly(inset(0.042), [tone(field, 0.18), field, tone(field, -0.28)], [x1, y1, 0], [x2, y2, 0], gold, 0.6),
    { d: path(inset(0.05).map((p) => P(...p))), stroke: tone(field, -0.4), strokeWidth: 0.4 },
  );
  // corner spandrels
  const c = 0.07;
  for (const [cu, cv, su, sv] of [[x1 + 0.042, y1 + 0.042, 1, 1], [x2 - 0.042, y1 + 0.042, -1, 1], [x1 + 0.042, y2 - 0.042, 1, -1], [x2 - 0.042, y2 - 0.042, -1, -1]]) {
    shapes.push({ ...poly([[cu, cv, 0], [cu + su * c, cv, 0], [cu, cv + sv * c, 0]], border, gold), strokeWidth: 0.4 });
  }
  // the medallion
  const [mu, mv] = mid;
  const mr = Math.min(x2 - x1, y2 - y1) * 0.22;
  shapes.push(
    { ...poly([[mu - mr * 1.25, mv, 0], [mu, mv - mr * 1.25, 0], [mu + mr * 1.25, mv, 0], [mu, mv + mr * 1.25, 0]], border, gold), strokeWidth: 0.5 },
    { ...poly([[mu - mr * 0.7, mv, 0], [mu, mv - mr * 0.7, 0], [mu + mr * 0.7, mv, 0], [mu, mv + mr * 0.7, 0]], "#C8692A", gold), strokeWidth: 0.4 },
    { ...poly([[mu - mr * 0.3, mv, 0], [mu, mv - mr * 0.3, 0], [mu + mr * 0.3, mv, 0], [mu, mv + mr * 0.3, 0]], PAGES[1], gold), strokeWidth: 0.4 },
  );
  return shapes;
}

/** A woven rug on the floor before the fire, from (x0, y0) to (x1, y1):
 *  a red field with bands across it, a cream diamond in the middle, and
 *  a fringe at each end. */
export function wovenRug(x0: number, y0: number, x1: number, y1: number): Shape[] {
  const field = "#7A2E32";
  const z = 0.002;
  const ym = (y0 + y1) / 2;
  const xm = (x0 + x1) / 2;
  const shapes: Shape[] = [
    tint([[x0 + 0.02, y0 + 0.02, 0], [x1 + 0.03, y0 + 0.02, 0], [x1 + 0.03, y1 + 0.01, 0], [x0 + 0.02, y1 + 0.01, 0]], INK.night, 0.25),
    { ...flat(x0, x1, y0, y1, z, field, inkOf(field)), grad: { colors: [tone(field, 0.18), field, tone(field, -0.25)], from: P(x0, y0, 0), to: P(x1, y1, 0) } },
  ];
  // bands across the rug near each end
  for (const [f, fill, wide] of [[0.08, "#C9973E", 0.03], [0.16, "#2C3A60", 0.02], [0.84, "#2C3A60", 0.02], [0.92, "#C9973E", 0.03]] as const) {
    const x = x0 + (x1 - x0) * f;
    shapes.push(flat(x - wide / 2, x + wide / 2, y0 + 0.01, y1 - 0.01, z, fill, tone(fill, -0.4)));
  }
  // the diamond, a smaller one inside it
  const dx = (x1 - x0) * 0.24;
  const dy = (y1 - y0) * 0.36;
  shapes.push(
    poly([[xm - dx, ym, z], [xm, ym - dy, z], [xm + dx, ym, z], [xm, ym + dy, z]], "#E3D3AE", "#8A6A44"),
    poly([[xm - dx * 0.55, ym, z], [xm, ym - dy * 0.55, z], [xm + dx * 0.55, ym, z], [xm, ym + dy * 0.55, z]], "#46587E", "#1E2A44"),
    poly([[xm - dx * 0.2, ym, z], [xm, ym - dy * 0.2, z], [xm + dx * 0.2, ym, z], [xm, ym + dy * 0.2, z]], "#C9973E", "#6A4A1E"),
  );
  // the fringe at each end
  for (const [x, dir] of [[x0, -1], [x1, 1]] as const) {
    shapes.push({ ...line(Array.from({ length: 9 }, (_, i) => y0 + 0.015 + ((y1 - y0 - 0.03) * i) / 8).flatMap((y, i) => [[x, y, z], [x + dir * (i % 2 ? 0.022 : 0.016), y + 0.004, z]] as V3[]), "#E3D3AE", 0.5), opacity: 0.9 });
  }
  return shapes;
}

/** A braided rag rug at (x, y), `r` round: rings of coloured cloth. */
export function ragRug(x: number, y: number, r: number): Shape[] {
  const rings = ["#6A3A2A", "#A8503A", "#C89A5A", "#4A6A6A", "#B4483D", "#D8B878"];
  return [
    disc(x + 0.02, y + 0.01, 0, r * 1.02, INK.night, undefined, 0.25),
    ...rings.map((c, i): Shape => {
      const rr = r * (1 - i / rings.length);
      const [cx, cy] = P(x, y, 0);
      return { ...disc(x, y, 0.001, rr, c, tone(c, -0.45), undefined, 0.4), grad: { colors: [tone(c, 0.18), c, tone(c, -0.2)], from: [cx - rr * unit() * 0.6, cy - rr * unit() * 0.4], radius: rr * unit() * 1.6 } };
    }),
  ];
}

/** An open hatch in the floor, x1..x2 by y1..y2: a frame round the dark hole, its lid
 *  standing up on its hinges at the back, and the top of a ladder going
 *  down. */
export function hatch(x1: number, x2: number, y1: number, y2: number): Shape[] {
  const e = 0.014;
  const deep = 0.07;
  const shapes: Shape[] = [
    lit([[x1 - e, y1 - e, 0.001], [x2 + e, y1 - e, 0.001], [x2 + e, y2 + e, 0.001], [x1 - e, y2 + e, 0.001]], WOOD[2], [x1, y1, 0], [x2, y2, 0], 0.15, 0.2),
    { ...poly([[x1, y1, 0.002], [x2, y1, 0.002], [x2, y2, 0.002], [x1, y2, 0.002]], "#0A0806"), strokeWidth: 0.5 },
    // the hole's far sides, falling into the dark
    {
      ...poly([[x1, y1, 0.002], [x1, y2, 0.002], [x1, y2, -deep], [x1, y1, -deep]], WOOD[2]),
      grad: { colors: [WOOD[1], "#0A0806"], from: P(x1, y1, 0), to: P(x1, y1, -deep) },
      stroke: undefined,
    },
    {
      ...poly([[x1, y1, 0.002], [x2, y1, 0.002], [x2, y1, -deep], [x1, y1, -deep]], WOOD[2]),
      grad: { colors: [WOOD[0], "#0A0806"], from: P(x1, y1, 0), to: P(x1, y1, -deep) },
      stroke: undefined,
    },
    // the lid, up on its hinges
    ...box(x1 - e - 0.018, y1 - 0.004, 0.001, 0.018, y2 - y1 + 0.008, x2 - x1, WOOD),
  ];
  const face = x1 - e;
  for (const y of [y1 + 0.03, y2 - 0.03]) {
    shapes.push(
      ...box(face, y - 0.008, 0.002, 0.004, 0.016, (x2 - x1) * 0.8, IRONWORK),
      ...bolt([face + 0.004, y, (x2 - x1) * 0.55], 0.45),
    );
  }
  const [rx, ry] = P(face + 0.004, (y1 + y2) / 2, (x2 - x1) * 0.7);
  shapes.push(
    { d: `M${n(rx - 2.2)} ${n(ry)} a2.2 2.6 0 1 0 4.4 0 a2.2 2.6 0 1 0 -4.4 0`, stroke: inkOf(IRONWORK[0]), strokeWidth: 1.6 },
    { d: `M${n(rx - 2.2)} ${n(ry)} a2.2 2.6 0 1 0 4.4 0 a2.2 2.6 0 1 0 -4.4 0`, stroke: IRONWORK[0], strokeWidth: 0.8 },
  );
  // the ladder's top, coming up out of the hole
  const ya = y1 + 0.035;
  const yb = y2 - 0.045;
  const xr = (z: number) => x1 + 0.05 - z * 0.25;
  shapes.push(...rod([[xr(-deep), ya, -deep], [xr(0.11), ya, 0.11]], WOOD[0], 1.5));
  for (const z of [-0.03, 0.04]) shapes.push(...rod([[xr(z), ya, z], [xr(z), yb, z]], WOOD[1], 1.1));
  shapes.push(...rod([[xr(-deep), yb, -deep], [xr(0.11), yb, 0.11]], WOOD[0], 1.5));
  return shapes;
}

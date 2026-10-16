// Seal the Manor's chapel: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// A chequered stone floor with a crimson runner up to the altar on its
// two-step dais: a carved oak altar (panelled front, ivory cloth, a
// crimson frontal with gold fringe), the gilt cross with its ruby, tall
// candlesticks, a gilded reredos, a rose window over it and stained
// lancets in both walls. Pews with carved ends and book ledges, the
// lectern with the Chapel's open record, and the font by the door.

import {
  INK,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  flame,
  flat,
  hoop,
  inkOf,
  lightPool,
  line,
  moonShaft,
  paint,
  poly,
  tone,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import {
  WAX,
  disc,
  flags,
  prop,
  shell,
  tint,
} from "@/components/iso/room";
import {
  panel,
} from "@/components/iso/furniture";

/** Gilt: the house gold, for church plate. */
export const GILT: Tones = ["#FFE7A0", "#E2B04A", "#9A6B1E"];
/** Pale limestone, for dressed stone, steps and the font. */
export const LIMESTONE: Tones = ["#F1EADA", "#D5CAB0", "#ADA086"];
const CRIMSON = "#A8323C";
const RUBY = "#D0304A";
/** Jewel colours for stained glass. */
export const GLASS = {
  ruby: "#C23B54",
  sapphire: "#3D63C9",
  emerald: "#2E9A6A",
  amber: "#F0B54A",
  violet: "#8A55C0",
};
const LEAD = "#1E1A16";

type Wall = "x" | "y";
/** A point on a back wall: `u` along it, `z` up, `out` into the room. */
const onWall = (wall: Wall, u: number, z: number, out = 0): V3 =>
  wall === "x" ? [out, u, z] : [u, out, z];
const wallBox = (wall: Wall, u: number, out: number, z: number, wu: number, wo: number, h: number, tones: Tones) =>
  wall === "x" ? box(out, u, z, wo, wu, h, tones) : box(u, out, z, wu, wo, h, tones);

/** A filled outline with a gradient from `from` (light) to `to` (dark). */
function lit(pts: V3[], fill: string, from: V3, to: V3, light = 0.18, dark = 0.22): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
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

/** A circle on a wall plane. */
function ringOn(wall: Wall, u: number, z: number, r: number, steps = 20): V3[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return onWall(wall, u + Math.cos(t) * r, z + Math.sin(t) * r);
  });
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
    { ...poly(ringOn(wall, mid, oz, or + 0.008, 14), LIMESTONE[0]), strokeWidth: 0.45 },
    {
      ...poly(ringOn(wall, mid, oz, or, 14), GLASS.amber),
      grad: { colors: ["#FFF0B8", GLASS.amber, "#B07A20"], from: P(...A(mid - or * 0.4, oz + or * 0.4)), radius: or * 100 * 1.6 },
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
    lit(ringOn(wall, u, z, r + 0.024, 28), LIMESTONE[1], A(u - r, z + r), A(u + r, z - r), 0.2, 0.25),
    { ...poly(ringOn(wall, u, z, r, 28), "#0E1226"), strokeWidth: 0.5 },
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
    const color = i % 2 ? GLASS.sapphire : GLASS.ruby;
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
    { ...poly(ringOn(wall, u, z, r0, 16), LIMESTONE[0]), strokeWidth: 0.45 },
    {
      ...poly(ringOn(wall, u, z, r0 * 0.78, 16), GLASS.amber),
      grad: { colors: ["#FFF2B8", GLASS.amber, "#9A6B1E"], from: P(...A(u - r0 * 0.3, z + r0 * 0.3)), radius: r0 * 100 * 1.4 },
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
    lit([[x1, 0.002, z1], [x2, 0.002, z1], [x2, 0.002, z2], [x1, 0.002, z2]], GILT[1], [x1, 0, z2], [x2, 0, z1], 0.3, 0.25),
  ];
  for (let i = 0; i < 3; i++) {
    const a = x1 + w * i + 0.016;
    const b = x1 + w * (i + 1) - 0.016;
    const spring = z2 - (i === 1 ? 0.04 : 0.07);
    shapes.push(lit(pointed("y", a - 0.012, b + 0.012, z1, spring), GILT[1], [a, 0, z2], [b, 0, z1], 0.3, 0.25));
    const inner = pointed("y", a, b, z1 + 0.016, spring).map(([x, , z]) => [x, 0.003, z] as V3);
    shapes.push({
      ...poly(inner, "#1E2C5E"),
      grad: { colors: ["#2E4280", "#1E2C5E", "#121A3A"], from: P(a, 0, z2), to: P(b, 0, z1) },
      stroke: GILT[2],
      strokeWidth: 0.45,
    });
    for (const [fu, fz] of [[0.3, 0.3], [0.7, 0.55], [0.4, 0.75], [0.65, 0.18]]) {
      shapes.push(ball([a + (b - a) * fu, 0.004, z1 + 0.02 + (spring - z1) * fz], 0.2, GILT[0]));
    }
  }
  shapes.push({ ...line([[x1 + 0.01, 0.003, z1 + 0.006], [x2 - 0.01, 0.003, z1 + 0.006]], "#FFFFFF", 0.5), opacity: 0.4 });
  return shapes;
}

/** A gilt candlestick standing at (x, y, z), `h` to the drip pan: a
 *  stepped foot, a turned stem with a knop, a pan, a wax candle and its
 *  flame. `size` scales it (1 for the altar, ~1.8 for a floor stand). */
export function candlestick(x: number, y: number, z: number, h: number, accent: string, size = 1): Shape[] {
  const r = 0.022 * size;
  const foot = 0.012 * size;
  const wax = 0.06 * size;
  return [
    ...cylinder(x, y, z, r, foot, GILT),
    ...cylinder(x, y, z + foot, r * 0.55, foot, GILT),
    ...cylinder(x, y, z + foot * 2, r * 0.22, h - foot * 2, GILT),
    ball([x, y, z + h * 0.42], 0.5 * size, GILT[1], inkOf(GILT[1])),
    ball([x, y, z + h * 0.75], 0.34 * size, GILT[1], inkOf(GILT[1])),
    ...cylinder(x, y, z + h, r * 0.75, 0.007 * size, GILT),
    ...cylinder(x, y, z + h + 0.007 * size, 0.008 * size, wax, WAX),
    ...flame([x, y, z + h + 0.007 * size + wax], 1.9 * Math.sqrt(size), accent),
  ];
}

/** A pew facing the right-hand wall, from x to x + w at depth y: carved
 *  end boards with finials, a panelled back with a capping rail, and a
 *  book ledge with hymn books on it. */
export function pew(x: number, y: number, w: number, tones: Tones = WOOD): Shape[] {
  const t = 0.022;
  const d = 0.1;
  const back = 0.2;
  const endH = 0.235;
  const X = x + w;
  const Y = y + d;
  const shapes: Shape[] = [
    tint([[x + 0.02, y + 0.03, 0], [X + 0.05, y + 0.03, 0], [X + 0.05, Y + 0.02, 0], [x + 0.02, Y + 0.02, 0]], INK.night, 0.3),
    ...box(x, y, 0, t, d, endH, tones),
    ...box(x + t, y, 0.085, w - 2 * t, d - 0.025, 0.02, tones),
    ...box(x + t, Y - 0.025, 0, w - 2 * t, 0.025, back, tones),
  ];
  const panels = Math.max(2, Math.round((w - 2 * t) / 0.1));
  for (let i = 0; i < panels; i++) {
    const u1 = x + t + 0.012 + ((w - 2 * t - 0.024) * i) / panels;
    const u2 = x + t + 0.012 + ((w - 2 * t - 0.024) * (i + 1)) / panels - 0.01;
    shapes.push(...panel("lit", Y, u1, u2, 0.03, back - 0.035, tones[1]));
  }
  shapes.push(
    ...box(x + t - 0.004, Y - 0.032, back, w - 2 * t + 0.008, 0.036, 0.014, tones),
    // the book ledge and its books
    ...box(x + t + 0.01, Y, 0.135, w - 2 * t - 0.02, 0.022, 0.01, tones),
    ...box(x + t + 0.03, Y + 0.002, 0.145, 0.016, 0.016, 0.034, [tone(CRIMSON, 0.15), CRIMSON, tone(CRIMSON, -0.3)]),
    ...box(x + t + 0.048, Y + 0.002, 0.145, 0.014, 0.016, 0.03, ["#4A5E9A", "#33467E", "#25335E"]),
    ...box(X - t - 0.05, Y + 0.002, 0.145, 0.016, 0.016, 0.034, [tone(CRIMSON, 0.15), CRIMSON, tone(CRIMSON, -0.3)]),
    ...box(X - t, y, 0, t, d, endH, tones),
    ...panel("shade", X, y + 0.016, Y - 0.016, 0.03, endH - 0.07, tones[2]),
    ball([X, y + d / 2, endH - 0.04], 0.42, GILT[1], inkOf(GILT[1])),
    ball([x + t / 2, Y - 0.012, endH + 0.008], 0.7, tones[0], inkOf(tones[0])),
    ball([X - t / 2, Y - 0.012, endH + 0.008], 0.7, tones[0], inkOf(tones[0])),
  );
  return shapes;
}

/** A lectern with an open book, its column standing at (cx, cy) and its
 *  desk at height top: a stepped foot, a turned column with a brass
 *  knop, a gilt-edged desk, the book in crimson boards with a ribbon. */
export function lectern(cx: number, cy: number, top: number): Shape[] {
  const page = (sign: number): V3[] => [
    [cx, cy - 0.028, top + 0.016],
    [cx + sign * 0.045, cy - 0.028, top + 0.006],
    [cx + sign * 0.045, cy + 0.03, top + 0.006],
    [cx, cy + 0.03, top + 0.016],
  ];
  const shapes: Shape[] = [
    tint([[cx - 0.03, cy - 0.015, 0], [cx + 0.08, cy - 0.015, 0], [cx + 0.08, cy + 0.06, 0], [cx - 0.03, cy + 0.06, 0]], INK.night, 0.3),
    ...box(cx - 0.05, cy - 0.045, 0, 0.1, 0.09, 0.02, WOOD.map((c) => tone(c, -0.15)) as Tones),
    ...box(cx - 0.035, cy - 0.032, 0.02, 0.07, 0.064, 0.016, WOOD),
    ...cylinder(cx, cy, 0.036, 0.015, top - 0.07, WOOD),
    ...cylinder(cx, cy, 0.11, 0.019, 0.012, GILT),
    ...box(cx - 0.028, cy - 0.028, top - 0.045, 0.056, 0.056, 0.022, WOOD),
    ...box(cx - 0.056, cy - 0.042, top - 0.022, 0.112, 0.084, 0.022, WOOD),
    line([[cx - 0.054, cy + 0.043, top - 0.008], [cx + 0.054, cy + 0.043, top - 0.008]], GILT[1], 0.9),
    flat(cx - 0.05, cx + 0.05, cy - 0.034, cy + 0.036, top + 0.002, CRIMSON),
    lit(page(-1), "#F4EEDF", page(-1)[1], page(-1)[3], 0.15, 0.12),
    lit(page(1), "#F4EEDF", page(1)[0], page(1)[2], 0.1, 0.18),
  ];
  for (const sign of [-1, 1]) {
    for (const f of [0.2, 0.42, 0.64]) {
      const yy = cy - 0.028 + 0.058 * f;
      shapes.push({ ...line([[cx + sign * 0.008, yy, top + 0.0145], [cx + sign * 0.038, yy, top + 0.0075]], "#8A7A5A", 0.45), opacity: 0.8 });
    }
  }
  shapes.push(
    line([[cx + 0.006, cy + 0.03, top + 0.015], [cx + 0.01, cy + 0.04, top - 0.01], [cx + 0.008, cy + 0.04, top - 0.05]], CRIMSON, 1),
    ball([cx + 0.008, cy + 0.04, top - 0.052], 0.28, GILT[1]),
  );
  return shapes;
}

/** A stone font standing at (x, y): a stepped base, a stem banded in
 *  gilt, a carved bowl with a gilt rim, and still water. */
export function font(x: number, y: number): Shape[] {
  return [
    disc(x + 0.035, y + 0.01, 0, 0.075, INK.night, undefined, 0.3),
    ...cylinder(x, y, 0, 0.065, 0.022, LIMESTONE),
    ...cylinder(x, y, 0.022, 0.045, 0.02, LIMESTONE),
    ...cylinder(x, y, 0.042, 0.022, 0.1, LIMESTONE),
    hoop(x, y, 0.09, 0.022, GILT[1]),
    ...cylinder(x, y, 0.135, 0.04, 0.02, LIMESTONE),
    ...cylinder(x, y, 0.155, 0.068, 0.045, LIMESTONE),
    hoop(x, y, 0.168, 0.068, tone(LIMESTONE[2], -0.2)),
    hoop(x, y, 0.198, 0.068, GILT[1]),
    disc(x, y, 0.2, 0.068, undefined, GILT[1], undefined, 0.8),
    {
      ...disc(x, y, 0.2, 0.054, INK.glass, inkOf(LIMESTONE[2])),
      grad: { colors: ["#D8E4FF", "#7E9CE0", "#3E5498"], from: P(x - 0.03, y - 0.02, 0.2), radius: 0.07 * 100 * 1.2 },
    },
    { ...line([[x - 0.03, y + 0.005, 0.2], [x - 0.005, y - 0.025, 0.2]], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

/** An altar on a dais step at z: a carved oak body with sunk panels, a
 *  stone top under an ivory cloth with a gold hem, and a crimson frontal
 *  with a gold border, fringe and cross. Its lit face is at y + d. */
export function altar(x: number, y: number, z: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const top = z + h;
  const cloth = top - 0.055;
  const fx1 = x + w * 0.36;
  const fx2 = X - w * 0.36;
  const oak = WOOD;
  const shapes: Shape[] = [
    ...box(x - 0.01, y - 0.006, z, w + 0.02, d + 0.012, 0.02, LIMESTONE),
    ...box(x, y, z + 0.02, w, d, h - 0.04, oak),
    ...panel("lit", Y, x + 0.016, fx1 - 0.014, z + 0.04, cloth - 0.012, oak[1]),
    ...panel("lit", Y, fx2 + 0.014, X - 0.016, z + 0.04, cloth - 0.012, oak[1]),
    ...panel("shade", X, y + 0.018, Y - 0.018, z + 0.04, cloth - 0.012, oak[2]),
    ball([(x + fx1) / 2, Y, (z + cloth) / 2 + 0.01], 0.45, GILT[1], inkOf(GILT[1])),
    ball([(fx2 + X) / 2, Y, (z + cloth) / 2 + 0.01], 0.45, GILT[1], inkOf(GILT[1])),
    ...box(x - 0.012, y - 0.008, top - 0.02, w + 0.024, d + 0.016, 0.02, LIMESTONE),
  ];
  const cy = Y + 0.009;
  const cx = X + 0.013;
  // the cloth over the top and down the front and side, with a gold hem
  shapes.push(
    lit([[x - 0.014, y - 0.008, top + 0.002], [X + 0.013, y - 0.008, top + 0.002], [X + 0.013, cy, top + 0.002], [x - 0.014, cy, top + 0.002]], "#F4EEDF", [x, y, top], [X, Y, top], 0.2, 0.08),
    lit([[x - 0.014, cy, cloth], [X + 0.013, cy, cloth], [X + 0.013, cy, top + 0.002], [x - 0.014, cy, top + 0.002]], "#F4EEDF", [x, cy, top], [X, cy, cloth], 0.15, 0.15),
    lit([[cx, y - 0.008, cloth], [cx, cy, cloth], [cx, cy, top + 0.002], [cx, y - 0.008, top + 0.002]], "#D8CCB0", [cx, y, top], [cx, Y, cloth], 0.1, 0.2),
    line([[x - 0.012, cy + 0.001, cloth + 0.008], [X + 0.012, cy + 0.001, cloth + 0.008], [cx + 0.001, y - 0.006, cloth + 0.008]], GILT[1], 1.1),
    { ...line([[x - 0.012, cy + 0.001, cloth + 0.002], [X + 0.012, cy + 0.001, cloth + 0.002]], GILT[2], 0.5), dash: "0.6 0.8" },
  );
  // the frontal
  const fy = cy + 0.002;
  shapes.push(
    lit([[fx1, fy, z + 0.035], [fx2, fy, z + 0.035], [fx2, fy, top + 0.002], [fx1, fy, top + 0.002]], CRIMSON, [fx1, fy, top], [fx2, fy, z], 0.25, 0.3),
    line([[fx1 + 0.008, fy + 0.001, z + 0.045], [fx1 + 0.008, fy + 0.001, top - 0.004]], GILT[1], 0.8),
    line([[fx2 - 0.008, fy + 0.001, z + 0.045], [fx2 - 0.008, fy + 0.001, top - 0.004]], GILT[1], 0.8),
    line([[fx1 + 0.004, fy + 0.001, z + 0.035], [fx2 - 0.004, fy + 0.001, z + 0.035]], GILT[1], 1.6),
    { ...line([[fx1 + 0.004, fy + 0.001, z + 0.03], [fx2 - 0.004, fy + 0.001, z + 0.03]], GILT[0], 1.2), dash: "0.5 0.7" },
  );
  const mx = (fx1 + fx2) / 2;
  const mz = (z + 0.035 + cloth) / 2;
  shapes.push(
    line([[mx, fy + 0.002, mz - 0.05], [mx, fy + 0.002, mz + 0.05]], GILT[2], 2.2),
    line([[mx - 0.028, fy + 0.002, mz + 0.018], [mx + 0.028, fy + 0.002, mz + 0.018]], GILT[2], 2.2),
    line([[mx, fy + 0.002, mz - 0.05], [mx, fy + 0.002, mz + 0.05]], GILT[0], 1.2),
    line([[mx - 0.028, fy + 0.002, mz + 0.018], [mx + 0.028, fy + 0.002, mz + 0.018]], GILT[0], 1.2),
  );
  return shapes;
}

/** A runner carpet along y from y1 to y2, x1 to x2: crimson with gold
 *  borders and a row of gold lozenges down the middle. */
export function runner(x1: number, x2: number, y1: number, y2: number): Shape[] {
  const mid = (x1 + x2) / 2;
  const shapes: Shape[] = [
    lit([[x1, y1, 0.001], [x2, y1, 0.001], [x2, y2, 0.001], [x1, y2, 0.001]], CRIMSON, [x1, y1, 0], [x2, y2, 0], 0.15, 0.3),
    line([[x1 + 0.012, y1 + 0.01, 0.002], [x1 + 0.012, y2 - 0.004, 0.002]], GILT[1], 0.9),
    line([[x2 - 0.012, y1 + 0.01, 0.002], [x2 - 0.012, y2 - 0.004, 0.002]], GILT[1], 0.9),
    { ...line([[x1 + 0.022, y1 + 0.01, 0.002], [x1 + 0.022, y2 - 0.004, 0.002]], GILT[2], 0.45), dash: "1 1" },
    { ...line([[x2 - 0.022, y1 + 0.01, 0.002], [x2 - 0.022, y2 - 0.004, 0.002]], GILT[2], 0.45), dash: "1 1" },
  ];
  shapes.push({ ...line([[x1 + 0.004, y2 + 0.008, 0.002], [x2 - 0.004, y2 + 0.008, 0.002]], GILT[1], 1.4), dash: "0.5 0.6" });
  for (let yc = y1 + 0.07; yc < y2 - 0.04; yc += 0.11) {
    shapes.push(
      lit([[mid, yc - 0.03, 0.002], [mid + 0.022, yc, 0.002], [mid, yc + 0.03, 0.002], [mid - 0.022, yc, 0.002]], GILT[1], [mid, yc - 0.03, 0], [mid, yc + 0.03, 0], 0.3, 0.2),
      flat(mid - 0.006, mid + 0.006, yc - 0.008, yc + 0.008, 0.003, CRIMSON),
    );
  }
  return shapes;
}

/** Every other flagstone of a `count`-square floor a shade lighter. */
function chequer(count: number): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if ((i + j) % 2) continue;
      const [a, b, c, d] = [i / count, (i + 1) / count, j / count, (j + 1) / count];
      shapes.push(tint([[a, c, 0], [b, c, 0], [b, d, 0], [a, d, 0]], paint().tile, 0.55));
    }
  }
  return shapes;
}

export function chapel(accent: string): Shape[] {
  // border, field, border, medallion centre, medallion
  const glassA = [GLASS.ruby, GLASS.sapphire, GLASS.amber, GLASS.amber, GLASS.emerald];
  const glassB = [GLASS.amber, GLASS.ruby, GLASS.sapphire, GLASS.amber, GLASS.violet];
  return [
    ...shell(),
    ...chequer(6),
    ...flags(6),
    // stained glass in both walls: the light comes in coloured
    ...stainedWindow("y", 0.07, 0.23, 0.33, 0.47, glassA, "#E7A3C8"),
    ...stainedWindow("y", 0.77, 0.93, 0.33, 0.47, glassB, "#F2C46B"),
    ...stainedWindow("x", 0.07, 0.23, 0.33, 0.47, glassB, "#B9A3F0"),
    ...stainedWindow("x", 0.77, 0.93, 0.33, 0.47, glassA, "#9CC8FF"),
    // the rose window, crowning the cross
    ...roseWindow("y", 0.39, 0.6, 0.08),
    // the runner up the aisle, and the altar on its dais
    ...runner(0.43, 0.57, 0.31, 0.88),
    ...box(0.22, 0, 0, 0.56, 0.32, 0.025, LIMESTONE),
    ...box(0.27, 0, 0.025, 0.46, 0.26, 0.025, LIMESTONE),
    ...altar(0.33, 0.055, 0.05, 0.34, 0.16, 0.23),
    // tall candle stands either side of the altar
    ...candlestick(0.24, 0.25, 0.025, 0.28, accent, 1.4),
    ...candlestick(0.755, 0.1, 0.025, 0.28, accent, 1.4),
    ...candlestick(0.37, 0.15, 0.282, 0.12, accent),
    ...candlestick(0.63, 0.15, 0.282, 0.12, accent),
    ...lightPool([0.5, 0.32, 0], 0.45),
    // the gilt cross, its ruby at the crossing
    ...prop(() => [
      ...box(0.452, 0.09, 0.282, 0.096, 0.07, 0.016, GILT),
      ...box(0.468, 0.1, 0.298, 0.064, 0.05, 0.016, GILT),
      ...box(0.485, 0.11, 0.314, 0.03, 0.03, 0.166, GILT),
      ...box(0.42, 0.11, 0.48, 0.16, 0.03, 0.035, GILT),
      ...box(0.485, 0.11, 0.515, 0.03, 0.03, 0.105, GILT),
      ball([0.414, 0.14, 0.4975], 0.62, GILT[1], inkOf(GILT[1])),
      ball([0.586, 0.14, 0.4975], 0.62, GILT[1], inkOf(GILT[1])),
      ball([0.5, 0.14, 0.626], 0.62, GILT[1], inkOf(GILT[1])),
      ball([0.5, 0.141, 0.4975], 0.85, RUBY, inkOf(RUBY)),
      { ...ball([0.498, 0.141, 0.501], 0.25, "#FFFFFF"), opacity: 0.9 },
    ]),
    // the Chapel's record on its lectern
    ...lectern(0.135, 0.36, 0.25),
    // pews, and the font by the door
    ...pew(0.05, 0.42, 0.32),
    ...pew(0.6, 0.36, 0.22),
    ...pew(0.05, 0.6, 0.32),
    ...font(0.17, 0.88),
  ];
}

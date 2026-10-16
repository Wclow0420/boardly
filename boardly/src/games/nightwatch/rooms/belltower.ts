// Seal the Manor's belltower: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// A stone belfry open to the night through two twin-arched openings, the
// great bronze bell hung in a heavy oak frame (chamfered posts, braces,
// iron straps and bolts), its rope with a striped sally down to a coil,
// handbells on a shelf, a peal board, a lantern on an iron-bound chest,
// a ladder up to the loft and a trapdoor down.

import {
  INK,
  WOOD,
  P,
  box,
  flame,
  inkOf,
  k,
  lightPool,
  line,
  moon,
  moonShaft,
  n,
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
  planks,
  prop,
  shell,
  stars,
  tint,
} from "@/components/iso/room";
import {
  BRASS,
  IRONWORK,
  barrel,
  chest,
  panel,
  shelfX,
} from "@/components/iso/furniture";

/** Warm sandstone, for dressed stone round openings. */
export const SANDSTONE: Tones = ["#D8B878", "#B08C50", "#7E6236"];
/** Bell bronze, lit from the left with a warm reflected light on the right. */
export const BRONZE = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#C99A44"];
const HEMP = "#D8C49A";
const CRIMSON = "#A8323C";

type Wall = "x" | "y";
/** A point on a back wall: `u` along it, `z` up, `out` into the room. */
const onWall = (wall: Wall, u: number, z: number, out = 0): V3 =>
  wall === "x" ? [out, u, z] : [u, out, z];
/** A block standing against a back wall. */
const wallBox = (wall: Wall, u: number, out: number, z: number, wu: number, wo: number, h: number, tones: Tones) =>
  wall === "x" ? box(out, u, z, wo, wu, h, tones) : box(u, out, z, wu, wo, h, tones);

/** A filled outline lit like the house metal: a gradient from its upper
 *  left, and an ink edge. */
function lit(pts: V3[], fill: string, from: V3, to: V3, light = 0.18, dark = 0.22): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
}

/** A round rod (rope, rail, rung): a dark edge, its colour, and a line
 *  of light along it. */
export function rod(pts: V3[], color: string, width = 1.4): Shape[] {
  return [
    line(pts, inkOf(color), width + 0.7),
    line(pts, color, width),
    { ...line(pts, tone(color, 0.5), Math.max(0.35, width * 0.3)), opacity: 0.75 },
  ];
}

/** Dressed stone up both back walls: courses with their joints staggered,
 *  and here and there a lighter block. */
export function ashlar(course = 0.1, block = 0.2): Shape[] {
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

/** Points round a half circle on a wall, from u1 over the top to u2. */
function arc(wall: Wall, u1: number, u2: number, spring: number, steps = 10, rise = 1): V3[] {
  const mid = (u1 + u2) / 2;
  const r = (u2 - u1) / 2;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = Math.PI - (i / steps) * Math.PI;
    return onWall(wall, mid + Math.cos(t) * r, spring + Math.sin(t) * r * rise);
  });
}

/** A circle on a wall plane. */
function ring(wall: Wall, u: number, z: number, r: number, steps = 14): V3[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return onWall(wall, u + Math.cos(t) * r, z + Math.sin(t) * r);
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
    { ...poly(ring(wall, mid, oz, or + 0.008), SANDSTONE[0]), strokeWidth: 0.45 },
    { ...poly(ring(wall, mid, oz, or), "#141B36"), stroke: SANDSTONE[2], strokeWidth: 0.45 },
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

/** An engraved bronze bell in drawing units: its waist at (cx, cy), `s`
 *  from waist to lip. Clapper, flared body, sound-bow band at the lip,
 *  engraved bands with an inscription, canons on the crown, a shine. */
export function bellShape(cx: number, cy: number, s: number): Shape[] {
  const X = (f: number) => n(cx + s * f);
  const Y = (f: number) => n(cy + s * f);
  const S = (f: number) => n(s * f);
  const edge = "#3A2408";
  const band = (y: number, rx: number, width = 0.5, opacity = 0.8, dash?: string): Shape => ({
    d: `M${X(-rx)} ${Y(y)} A${S(rx)} ${S(rx * 0.29)} 0 0 0 ${X(rx)} ${Y(y)}`,
    stroke: edge,
    strokeWidth: width,
    opacity,
    dash,
  });
  const glow = (y: number, rx: number): Shape => ({
    d: `M${X(-rx)} ${Y(y)} A${S(rx)} ${S(rx * 0.29)} 0 0 0 ${X(rx)} ${Y(y)}`,
    stroke: "#FFF2B8",
    strokeWidth: 0.4,
    opacity: 0.55,
  });
  return [
    // the clapper's ball, just showing under the lip
    {
      d: `M${X(-0.2)} ${Y(1.14)} a${S(0.2)} ${S(0.2)} 0 1 0 ${S(0.4)} 0 a${S(0.2)} ${S(0.2)} 0 1 0 ${S(-0.4)} 0 Z`,
      fill: IRONWORK[1],
      grad: { colors: [IRONWORK[0], IRONWORK[1], IRONWORK[2]], from: [cx - s * 0.08, cy + s * 1.06], radius: s * 0.3 },
      stroke: inkOf(IRONWORK[1]),
      strokeWidth: 0.5,
    },
    // the canons: a loop on the crown
    {
      d: `M${X(-0.2)} ${Y(-1.08)} C${X(-0.22)} ${Y(-1.42)} ${X(0.22)} ${Y(-1.42)} ${X(0.2)} ${Y(-1.08)}`,
      stroke: edge,
      strokeWidth: 2.6,
    },
    {
      d: `M${X(-0.2)} ${Y(-1.08)} C${X(-0.22)} ${Y(-1.42)} ${X(0.22)} ${Y(-1.42)} ${X(0.2)} ${Y(-1.08)}`,
      stroke: BRONZE[1],
      strokeWidth: 1.5,
    },
    {
      d: `M${X(-0.98)} ${Y(1)} C${X(-0.86)} ${Y(0.72)} ${X(-0.56)} ${Y(0.42)} ${X(-0.53)} ${Y(-0.3)} C${X(-0.5)} ${Y(-0.88)} ${X(-0.34)} ${Y(-1.12)} ${X(0)} ${Y(-1.12)} C${X(0.34)} ${Y(-1.12)} ${X(0.5)} ${Y(-0.88)} ${X(0.53)} ${Y(-0.3)} C${X(0.56)} ${Y(0.42)} ${X(0.86)} ${Y(0.72)} ${X(0.98)} ${Y(1)} A${S(0.98)} ${S(0.28)} 0 0 1 ${X(-0.98)} ${Y(1)} Z`,
      fill: BRONZE[1],
      grad: { colors: BRONZE, from: [cx - s * 0.95, cy - s * 0.2], to: [cx + s, cy] },
      stroke: edge,
      strokeWidth: 0.75,
    },
    // the sound bow: a heavier band round the lip
    {
      d: `M${X(-0.98)} ${Y(1)} A${S(0.98)} ${S(0.28)} 0 0 0 ${X(0.98)} ${Y(1)} L${X(0.9)} ${Y(0.8)} A${S(0.9)} ${S(0.26)} 0 0 1 ${X(-0.9)} ${Y(0.8)} Z`,
      fill: BRONZE[2],
      grad: { colors: [BRONZE[0], BRONZE[1], BRONZE[2], "#6E4A14"], from: [cx - s, cy + s], to: [cx + s, cy + s] },
      stroke: edge,
      strokeWidth: 0.6,
    },
    // engraved bands: two at the shoulder with the inscription between,
    // two at the waist
    band(-0.66, 0.5),
    glow(-0.63, 0.5),
    band(-0.4, 0.53, 0.6, 0.75, "0.9 0.9"),
    band(-0.24, 0.54),
    glow(-0.21, 0.54),
    band(0.48, 0.72),
    band(0.58, 0.77, 0.4, 0.6),
    // the shine down the lit side
    {
      d: `M${X(-0.32)} ${Y(-0.92)} C${X(-0.44)} ${Y(-0.4)} ${X(-0.5)} ${Y(0.3)} ${X(-0.74)} ${Y(0.8)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.9,
      opacity: 0.6,
    },
    {
      d: `M${X(-0.18)} ${Y(-1.0)} C${X(-0.26)} ${Y(-0.8)} ${X(-0.3)} ${Y(-0.6)} ${X(-0.31)} ${Y(-0.45)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.6,
      opacity: 0.45,
    },
  ];
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

/** A bolt head on a visible face: a small iron boss with a glint. */
const bolt = (at: V3, size = 0.55): Shape[] => {
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

/** A diagonal brace in the front plane y of a timber frame, from a post
 *  at (x1, z1) up to the beam at (x2, z2), `t` thick, with a bolt at each
 *  end. */
function brace(y: number, x1: number, z1: number, x2: number, z2: number, t: number): Shape[] {
  const front: V3[] = [[x1, y, z1], [x1, y, z1 + t * 1.6], [x2 - Math.sign(x2 - x1) * t * 1.6, y, z2], [x2, y, z2]];
  const shapes: Shape[] = [];
  shapes.push(lit(front, WOOD[1], front[1], front[3], 0.16, 0.22));
  shapes.push({ ...line([front[1], front[2]], "#FFFFFF", 0.45), opacity: 0.35 });
  shapes.push(...bolt([x1 + (x2 - x1) * 0.14, y, z1 + (z2 - z1) * 0.14 + t * 0.7]));
  shapes.push(...bolt([x1 + (x2 - x1) * 0.84, y, z1 + (z2 - z1) * 0.84 + t * 0.3]));
  return shapes;
}

/** The iron strap down the front of a frame post under the beam. */
const postStrap = (x: number): Shape[] => [
  ...box(x - 0.011, 0.38, 0.5, 0.022, 0.004, 0.16, IRONWORK),
  ...bolt([x, 0.384, 0.53]),
  ...bolt([x, 0.384, 0.61]),
];

/** A brass lantern standing at (x, y, z): a base, a candle behind four
 *  panes of glass, corner posts, a pyramid roof and a ring. `s` is half
 *  its width. */
export function lantern(x: number, y: number, z: number, s: number, h: number, accent: string): Shape[] {
  const zb = z + 0.012;
  const zt = zb + h;
  const r = s * 1.25;
  const apex: V3 = [x, y, zt + 0.045];
  const glass = (pts: V3[]): Shape => ({ ...poly(pts, INK.glass), opacity: 0.22, stroke: undefined });
  const [ax, ay] = P(...apex);
  return [
    ...box(x - s, y - s, z, 2 * s, 2 * s, 0.012, BRASS),
    ...box(x - 0.008, y - 0.008, zb, 0.016, 0.016, h * 0.45, WAX),
    ...flame([x, y, zb + h * 0.45], 1.7, accent),
    glass([[x - s, y + s, zb], [x + s, y + s, zb], [x + s, y + s, zt], [x - s, y + s, zt]]),
    glass([[x + s, y - s, zb], [x + s, y + s, zb], [x + s, y + s, zt], [x + s, y - s, zt]]),
    { ...line([[x - s * 0.6, y + s, zt - h * 0.15], [x - s * 0.1, y + s, zt - h * 0.6]], "#FFFFFF", 0.5), opacity: 0.6 },
    ...[[x + s, y - s], [x - s, y + s], [x + s, y + s]].flatMap(([px, py]) => rod([[px, py, zb], [px, py, zt]], BRASS[1], 0.7)),
    line([[x - s, y + s, zb + h * 0.5], [x + s, y + s, zb + h * 0.5], [x + s, y - s, zb + h * 0.5]], BRASS[2], 0.5),
    ...box(x - r, y - r, zt, 2 * r, 2 * r, 0.01, BRASS),
    lit([[x - r, y + r, zt + 0.01], [x + r, y + r, zt + 0.01], apex], BRASS[1], [x - r, y + r, zt], apex, 0.25, 0.2),
    lit([[x + r, y - r, zt + 0.01], [x + r, y + r, zt + 0.01], apex], BRASS[2], apex, [x + r, y - r, zt], 0.15, 0.25),
    {
      d: `M${n(ax - 1.4)} ${n(ay - 1.3)} a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0`,
      stroke: BRASS[1],
      strokeWidth: 0.8,
    },
  ];
}

/** A handbell standing on its mouth at (x, y, z), `s` drawing units from
 *  waist to lip, with a leather-bound handle. */
function handbell(x: number, y: number, z: number, s: number): Shape[] {
  const [cx, base] = P(x, y, z);
  const cy = base - s * 1.1;
  const top = cy - s * 1.1;
  return [
    ...bellShape(cx, cy, s).slice(3),
    { d: `M${n(cx)} ${n(top)} L${n(cx)} ${n(top - s * 1.3)}`, stroke: inkOf(CRIMSON), strokeWidth: 2.2 },
    { d: `M${n(cx)} ${n(top)} L${n(cx)} ${n(top - s * 1.3)}`, stroke: CRIMSON, strokeWidth: 1.3 },
    {
      d: `M${n(cx - 0.9)} ${n(top - s * 1.3)} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 Z`,
      fill: WOOD[0],
      stroke: inkOf(WOOD[0]),
      strokeWidth: 0.4,
    },
  ];
}

/** A peal board on the right-hand wall (y = 0): a carved frame round an
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

/** An open hatch in the floor: a frame round the dark hole, its lid
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

export function belltower(accent: string): Shape[] {
  const [bx, by] = P(0.5, 0.34, 0.36);
  const s = 7 * k();
  const [mx, my] = P(0.62, 0, 0.42);
  return [
    ...shell(undefined, { panelled: false }),
    ...planks(),
    ...ashlar(),
    // the belfry's two openings on the night
    ...belfryOpening("y", 0.28, 0.72, 0.15, 0.42, [
      moon(mx, my, 2.6),
      ...stars([[0.36, 0, 0.36], [0.42, 0, 0.22], [0.66, 0, 0.27], [0.55, 0, 0.5], [0.33, 0, 0.5]]),
    ]),
    ...belfryOpening("x", 0.28, 0.72, 0.15, 0.42, stars([[0, 0.38, 0.44], [0, 0.6, 0.34], [0, 0.66, 0.5], [0, 0.42, 0.24], [0, 0.56, 0.2], [0, 0.34, 0.3]])),
    tint([[0.3, 0.06, 0], [0.7, 0.06, 0], [0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass, 0.07),
    ...moonShaft([[0.3, 0, 0.62], [0.7, 0, 0.62]], [[0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass),
    ...moonShaft([[0, 0.3, 0.62], [0, 0.7, 0.62]], [[0.5, 0.86, 0], [0.5, 0.46, 0]], INK.glass),
    // handbells on a shelf, and the peal board
    ...shelfX(0.79, 0.97, 0.4, 0.06),
    ...handbell(0.03, 0.83, 0.418, 2.2),
    ...handbell(0.03, 0.88, 0.418, 2.6),
    ...handbell(0.03, 0.935, 0.418, 3),
    ...barrel(0.1, 0.87, 0.055, 0.15),
    disc(0.1, 0.87, 0.151, 0.042, "#3A4050", IRONWORK[2]),
    ...pealBoard(0.8, 0.96, 0.36, 0.6),
    // an iron-bound chest with a lantern on it
    ...chest(0.74, 0.05, 0.2, 0.15, 0.13),
    ...lantern(0.84, 0.125, 0.13, 0.026, 0.07, accent),
    ...lightPool([0.84, 0.3, 0], 0.4),
    // the bell frame: sole plate and feet, back post and brace
    ...box(0.1, 0.29, 0, 0.8, 0.1, 0.05, WOOD),
    ...box(0.14, 0.23, 0, 0.11, 0.22, 0.055, WOOD),
    ...bolt([0.195, 0.45, 0.03]),
    ...chamferedPost(0.16, 0.3, 0.055, 0.07, 0.08, 0.605, [0.12]),
    ...brace(0.38, 0.23, 0.44, 0.37, 0.66, 0.03),
    ...postStrap(0.195),
    // the bell, swinging from its headstock under the beam
    ...prop(() => [
      ...bellShape(bx, by, s),
      ...box(0.44, 0.315, 0.555, 0.12, 0.05, 0.1, WOOD),
      ...[0.465, 0.535].flatMap((x) => [
        ...box(x - 0.008, 0.364, 0.53, 0.016, 0.004, 0.12, IRONWORK),
        ...bolt([x, 0.369, 0.625]),
      ]),
      ...box(0.425, 0.33, 0.6, 0.015, 0.02, 0.02, BRASS),
      ...box(0.56, 0.33, 0.6, 0.015, 0.02, 0.02, BRASS),
    ]),
    // the beam, with iron over the joints and a brass date plate
    ...box(0.12, 0.3, 0.66, 0.76, 0.08, 0.07, WOOD),
    ...[0.195, 0.805].flatMap((x) => [
      ...box(x - 0.011, 0.38, 0.665, 0.022, 0.004, 0.06, IRONWORK),
      ...bolt([x, 0.384, 0.695]),
    ]),
    lit([[0.45, 0.381, 0.675], [0.55, 0.381, 0.675], [0.55, 0.381, 0.715], [0.45, 0.381, 0.715]], BRASS[1], [0.45, 0.38, 0.715], [0.55, 0.38, 0.675], 0.3, 0.25),
    line([[0.465, 0.382, 0.695], [0.535, 0.382, 0.695]], BRASS[2], 0.5),
    // an owl keeping watch on the beam
    ...owl(0.3, 0.34, 0.73),
    // the front foot, post and brace
    ...box(0.75, 0.23, 0, 0.11, 0.22, 0.055, WOOD),
    ...bolt([0.805, 0.45, 0.03]),
    ...chamferedPost(0.77, 0.3, 0.055, 0.07, 0.08, 0.605, [0.12]),
    ...brace(0.38, 0.77, 0.44, 0.63, 0.66, 0.03),
    ...postStrap(0.805),
    // the bell rope with its striped sally, down to a coil on the floor
    ...ropeCoil(0.64, 0.47),
    ...rod([[0.62, 0.385, 0.66], [0.62, 0.42, 0.06], [0.63, 0.45, 0.02]], HEMP, 1),
    ...sally([0.62, 0.413, 0.18], [0.62, 0.401, 0.3]),
    // the hatch down, open, with the top of a ladder showing
    ...hatch(0.27, 0.43, 0.64, 0.8),
  ];
}

/** The woollen grip on a bell rope: crimson striped with gold and ivory. */
export function sally(from: V3, to: V3): Shape[] {
  const [ax, ay] = P(...from);
  const [bx, by] = P(...to);
  const shapes: Shape[] = [
    { d: `M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`, stroke: inkOf(CRIMSON), strokeWidth: 3.6 },
    { d: `M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`, stroke: CRIMSON, strokeWidth: 2.6 },
  ];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    shapes.push({
      d: `M${n(x - 1.25)} ${n(y + 0.5)} L${n(x + 1.25)} ${n(y - 0.5)}`,
      stroke: i % 2 ? "#F0CC72" : "#F4EEDF",
      strokeWidth: 0.9,
    });
  }
  shapes.push({ d: `M${n(ax - 0.6)} ${n(ay)} L${n(bx - 0.6)} ${n(by)}`, stroke: "#FFFFFF", strokeWidth: 0.4, opacity: 0.45 });
  return shapes;
}

/** A coil of rope lying on the floor. */
function ropeCoil(x: number, y: number): Shape[] {
  return [
    disc(x + 0.02, y + 0.01, 0, 0.06, INK.night, undefined, 0.3),
    ...[0, 0.012, 0.024].flatMap((z, i) => {
      const r = 0.05 - i * 0.008;
      return [
        disc(x, y, z, r, undefined, inkOf(HEMP), undefined, 2.2),
        disc(x, y, z, r, undefined, HEMP, undefined, 1.3),
      ];
    }),
  ];
}

/** A little owl perched at (x, y, z). */
function owl(x: number, y: number, z: number): Shape[] {
  const [cx, base] = P(x, y, z);
  const r = 1.8 * k();
  const cy = base - r * 0.9;
  const body = "#8A7558";
  const edge = inkOf(body);
  return [
    {
      d: `M${n(cx - r * 0.9)} ${n(base)} C${n(cx - r * 1.1)} ${n(cy - r * 0.2)} ${n(cx - r * 0.8)} ${n(cy - r * 1.1)} ${n(cx - r * 0.55)} ${n(cy - r * 1.35)} L${n(cx - r * 0.3)} ${n(cy - r * 1.0)} L${n(cx + r * 0.3)} ${n(cy - r * 1.0)} L${n(cx + r * 0.55)} ${n(cy - r * 1.35)} C${n(cx + r * 0.8)} ${n(cy - r * 1.1)} ${n(cx + r * 1.1)} ${n(cy - r * 0.2)} ${n(cx + r * 0.9)} ${n(base)} Z`,
      fill: body,
      grad: { colors: [tone(body, 0.3), body, tone(body, -0.3)], from: [cx - r, cy - r], to: [cx + r, base] },
      stroke: edge,
      strokeWidth: 0.5,
    },
    {
      d: `M${n(cx - r * 0.45)} ${n(base)} C${n(cx - r * 0.5)} ${n(cy)} ${n(cx + r * 0.5)} ${n(cy)} ${n(cx + r * 0.45)} ${n(base)} Z`,
      fill: "#D8CCB0",
      opacity: 0.8,
    },
    ...[-0.38, 0.38].flatMap((f) => [
      {
        d: `M${n(cx + r * f - r * 0.3)} ${n(cy - r * 0.55)} a${n(r * 0.3)} ${n(r * 0.3)} 0 1 0 ${n(r * 0.6)} 0 a${n(r * 0.3)} ${n(r * 0.3)} 0 1 0 ${n(-r * 0.6)} 0 Z`,
        fill: "#F0C87A",
        stroke: edge,
        strokeWidth: 0.35,
      },
      {
        d: `M${n(cx + r * f - r * 0.12)} ${n(cy - r * 0.55)} a${n(r * 0.12)} ${n(r * 0.12)} 0 1 0 ${n(r * 0.24)} 0 a${n(r * 0.12)} ${n(r * 0.12)} 0 1 0 ${n(-r * 0.24)} 0 Z`,
        fill: "#1A1206",
      },
    ]),
    { d: `M${n(cx - r * 0.1)} ${n(cy - r * 0.35)} L${n(cx + r * 0.1)} ${n(cy - r * 0.35)} L${n(cx)} ${n(cy - r * 0.1)} Z`, fill: "#C99A44" },
  ];
}

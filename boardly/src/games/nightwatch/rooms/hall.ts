// Seal the Manor's hall: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// The pieces below are generic (a staircase, a long-case clock, a
// console table, a vase of flowers, a banner, a gilt frame…) and are
// exported so other rooms can use them, and so they can move into
// furniture.ts later.

import {
  GOLD,
  GRAINED,
  INK,
  LEAF,
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
  n,
  paint,
  poly,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import {
  WAX,
  disc,
  oval,
  prop,
  shell,
  tint,
} from "@/components/iso/room";
import {
  BRASS,
  panel,
} from "@/components/iso/furniture";
import {
  JEWELS,
  LEAF as LEAF_PATH,
  frond,
} from "@/components/engraved/shapes";

// ── materials ───────────────────────────────────────────────────────

/** Dark red mahogany, grained like the kit's wood. */
export const MAHOGANY: Tones = ["#8C4A30", "#6B3422", "#4C2216"];
GRAINED.add(MAHOGANY);
/** Pale veined marble. */
export const MARBLE: Tones = ["#F3EEE3", "#DDD4C3", "#BBB09B"];
/** Polished silver. */
export const SILVER: Tones = ["#F2F4F8", "#C9D0DA", "#8A94A4"];
/** White table linen. */
export const LINEN: Tones = ["#FBF8F0", "#ECE6D6", "#CFC6B0"];
/** Crimson velvet: runners, cushions, banners. */
export const VELVET: Tones = ["#B23A44", "#8E2A33", "#651C24"];
/** The house gold and silver as a turned piece's sheen: light, body,
 *  shadow, and the light thrown back at the far edge. */
export const GILT = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
export const SHEEN = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
/** Night glass, in a clock door or a mirror. */
export const GLASS = ["#4A5E92", "#1E2848", "#0D1020"];

// ── drawing helpers ─────────────────────────────────────────────────

/** A point on a wall-like plane: "x" is a plane of constant x (the left
 *  wall, u running along y), "y" a plane of constant y (the right wall,
 *  u running along x). `depth` is how far out from the plane. */
export const onWall =
  (wall: "x" | "y", depth = 0) =>
  (u: number, z: number): V3 =>
    wall === "x" ? [depth, u, z] : [u, depth, z];

/** A filled outline of world points, its gradient running between two
 *  world points (lightest at `from`). */
export function filled(pts: V3[], colors: string[], from: V3, to: V3, stroke?: string): Shape {
  const fill = colors[Math.min(1, colors.length - 1)];
  return { ...poly(pts, fill, stroke), grad: { colors, from: P(...from), to: P(...to) } };
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

/** A round thing on a wall plane (a dial, a bob, a plate), lit from
 *  the upper left. */
export function roundel(wall: "x" | "y", c: V3, r: number, colors: string[], stroke?: string): Shape {
  const [cx, cy] = P(...c);
  const fill = colors[1];
  return {
    ...poly(ringOn(wall, c, r), fill, stroke),
    grad: { colors, from: [cx - r * unit() * 0.4, cy - r * unit() * 0.45], radius: r * unit() * 1.5 },
  };
}

/** A turned piece standing at `at` (a vase, a goblet, a finial, a
 *  candlestick): `profile` is its radius at each height, bottom to top,
 *  in world units. Drawn as its outline with a sheen across it, a shine
 *  down its lit side, and the ellipse of its top (`top`, a colour: wine
 *  in a glass, the dark of a vase's mouth) when it is open or flat. */
export function turned(at: V3, profile: [number, number][], colors: string[], top?: string): Shape[] {
  const s = unit();
  const rings = profile.map(([r, h]) => {
    const [cx, cy] = P(at[0], at[1], at[2] + h);
    return { cx, cy, rx: Math.max(r, 0.001) * s * 1.2247, ry: Math.max(r, 0.001) * s * 0.7071 };
  });
  const b = rings[0];
  const t = rings[rings.length - 1];
  const wide = Math.max(...rings.map((r) => r.rx));
  const fill = colors[1];
  const left = rings.map((r) => `${n(r.cx - r.rx)} ${n(r.cy)}`).join(" L");
  const right = [...rings]
    .reverse()
    .map((r) => `${n(r.cx + r.rx)} ${n(r.cy)}`)
    .join(" L");
  const shapes: Shape[] = [
    {
      d: `M${left} L${right} A${n(b.rx)} ${n(b.ry)} 0 0 1 ${n(b.cx - b.rx)} ${n(b.cy)} Z`,
      fill,
      grad: { colors, from: [b.cx - wide * 0.8, t.cy], to: [b.cx + wide, t.cy] },
      stroke: inkOf(fill),
      strokeWidth: 0.5,
    },
  ];
  if (wide > 1.6) {
    shapes.push({
      d: rings
        .slice(1, -1)
        .map((r, i) => `${i ? "L" : "M"}${n(r.cx - r.rx * 0.55)} ${n(r.cy)}`)
        .join(" "),
      stroke: "#FFFFFF",
      strokeWidth: 0.5,
      opacity: 0.45,
    });
  }
  if (top) {
    shapes.push({ d: oval(t.cx, t.cy, t.rx, t.ry), fill: top, stroke: inkOf(fill), strokeWidth: 0.45 });
  }
  return shapes;
}

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

/** A leaf from a point of the drawing: filled, with its midrib. */
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

/** A jewel on a face: a lit stone with a glint. */
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

/** The shadow a piece throws on the floor. */
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

/** A patch of floor lit the way the room's floor is, so a pattern laid
 *  on it keeps the fall of light from the back corner to the front. */
export function floorPatch(x1: number, x2: number, y1: number, y2: number, fill: string, stroke?: string): Shape {
  return {
    ...flat(x1, x2, y1, y2, 0, fill, stroke),
    grad: { colors: [tone(fill, 0.16), fill, tone(fill, -0.22)], from: P(0, 0, 0), to: P(1, 1, 0) },
    strokeWidth: 0.45,
  };
}

/** A compass star inlaid in the floor: eight gilt points, each in a
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

// ── wall pieces ─────────────────────────────────────────────────────

/** A banner on a wall, hung from a gilt rod on two cords: a swallowtail
 *  of cloth with a gold border and fringe, and a gilt shield on it. */
export function banner(wall: "x" | "y", u1: number, u2: number, top: number, bottom: number, cloth: Tones = VELVET): Shape[] {
  const at = onWall(wall, 0.004);
  const mid = (u1 + u2) / 2;
  const notch = bottom + (top - bottom) * 0.16;
  const g = 0.014;
  const zs = top - 0.08;
  const sw = (u2 - u1) * 0.24;
  const shield: V3[] = [
    at(mid - sw, zs),
    at(mid + sw, zs),
    at(mid + sw, zs - sw * 1.2),
    at(mid + sw * 0.7, zs - sw * 1.8),
    at(mid, zs - sw * 2.3),
    at(mid - sw * 0.7, zs - sw * 1.8),
    at(mid - sw, zs - sw * 1.2),
  ];
  const cw = sw * 0.68;
  return [
    // cords from the hook to the rod's ends
    line([at(u1 + 0.01, top + 0.012), at(mid, top + 0.07), at(u2 - 0.01, top + 0.012)], GOLD[2], 0.6),
    ball(at(mid, top + 0.07), 0.6, GOLD[0], GOLD[2]),
    filled([at(u1, top), at(u2, top), at(u2, bottom), at(mid, notch), at(u1, bottom)], [tone(cloth[0], 0.12), cloth[1], cloth[2]], at(u1, top), at(u2, bottom)),
    // folds
    ...[0.3, 0.68].map((f): Shape => ({
      ...line([at(u1 + (u2 - u1) * f, top - 0.01), at(u1 + (u2 - u1) * f, bottom + 0.04)], cloth[2], 1.4),
      opacity: 0.45,
    })),
    line([at(u1 + g, top - 0.025), at(u2 - g, top - 0.025), at(u2 - g, bottom + g * 1.4), at(mid, notch + g * 1.3), at(u1 + g, bottom + g * 1.4), at(u1 + g, top - 0.025)], GOLD[1], 0.8),
    { ...line([at(u1 + 0.004, bottom - 0.01), at(mid, notch - 0.01), at(u2 - 0.004, bottom - 0.01)], GOLD[1], 1.8), dash: "0.1 1.7" },
    // the shield, a crimson chevron across it
    filled(shield, [GOLD[0], GOLD[1], GOLD[2]], at(mid - sw, zs), at(mid + sw, zs - sw * 2.3), GOLD[2]),
    filled(
      [at(mid - cw, zs - sw * 1.0), at(mid, zs - sw * 0.45), at(mid + cw, zs - sw * 1.0), at(mid + cw, zs - sw * 1.38), at(mid, zs - sw * 0.85), at(mid - cw, zs - sw * 1.38)],
      [tone(cloth[0], 0.1), cloth[1], cloth[2]],
      at(mid - cw, zs),
      at(mid + cw, zs - sw),
    ),
    { ...line([at(mid - sw * 0.85, zs - 0.006), at(mid - sw * 0.85, zs - sw * 1.15)], "#FFFFFF", 0.5), opacity: 0.55 },
    // the rod and its finials
    line([at(u1 - 0.025, top + 0.008), at(u2 + 0.025, top + 0.008)], tone(GOLD[2], -0.5), 2),
    line([at(u1 - 0.025, top + 0.008), at(u2 + 0.025, top + 0.008)], GOLD[1], 1.1),
    ball(at(u1 - 0.03, top + 0.008), 0.8, GOLD[0], GOLD[2]),
    ball(at(u2 + 0.03, top + 0.008), 0.8, GOLD[0], GOLD[2]),
  ];
}

/** A gilt frame on a wall: a moulded gilt border, a dark lip, a little
 *  crest on top, and whatever `paint` draws on the canvas inside it
 *  (given the canvas's corners). */
export function giltFrame(
  wall: "x" | "y",
  u1: number,
  u2: number,
  z1: number,
  z2: number,
  canvas: (at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number, wall: "x" | "y") => Shape[],
): Shape[] {
  const at = onWall(wall, 0.002);
  const f = 0.022;
  const mid = (u1 + u2) / 2;
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], [GOLD[0], GOLD[1], GOLD[2]], at(u1, z2), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...line([at(u1 + 0.008, z1 + 0.008), at(u1 + 0.008, z2 - 0.008), at(u2 - 0.008, z2 - 0.008)], "#FFFFFF", 0.5), opacity: 0.6 },
    line([at(u1 + f * 0.55, z1 + f * 0.55), at(u2 - f * 0.55, z1 + f * 0.55), at(u2 - f * 0.55, z2 - f * 0.55), at(u1 + f * 0.55, z2 - f * 0.55), at(u1 + f * 0.55, z1 + f * 0.55)], GOLD[2], 0.5),
    ...canvas(onWall(wall, 0.003), u1 + f, u2 - f, z1 + f, z2 - f, wall),
    // the crest: a gilt shell over the top rail
    filled(
      ringOn(wall, at(mid, z2), 0.026, 10, 0, Math.PI),
      [GOLD[0], GOLD[1], GOLD[2]],
      at(mid - 0.02, z2 + 0.02),
      at(mid + 0.02, z2),
      GOLD[2],
    ),
    line([at(mid, z2), at(mid, z2 + 0.022)], GOLD[2], 0.45),
    line([at(mid, z2), at(mid - 0.017, z2 + 0.016)], GOLD[2], 0.45),
    line([at(mid, z2), at(mid + 0.017, z2 + 0.016)], GOLD[2], 0.45),
  ];
}

/** A canvas: the manor's grounds by moonlight. */
export function moonlitLandscape(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], ["#2A3C6E", "#1D2A50", "#3B4A5E"], at(u1, z2), at(u1, z1)),
    ball(at(u1 + w * 0.72, z1 + h * 0.74), 1.1, "#F4EEDF"),
    filled(
      [at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.42), at(u1 + w * 0.7, z1 + h * 0.3), at(u1 + w * 0.35, z1 + h * 0.5), at(u1, z1 + h * 0.36)],
      ["#3E5A48", "#2B4436", "#1A2C22"],
      at(u1, z1 + h * 0.5),
      at(u2, z1),
    ),
    filled([at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.18), at(u1 + w * 0.45, z1 + h * 0.26), at(u1, z1 + h * 0.15)], ["#2A3A2C", "#1C2A20", "#121C15"], at(u1, z1 + h * 0.3), at(u2, z1)),
    // a lit window in a far house
    filled(
      [at(u1 + w * 0.3, z1 + h * 0.4), at(u1 + w * 0.42, z1 + h * 0.4), at(u1 + w * 0.42, z1 + h * 0.5), at(u1 + w * 0.36, z1 + h * 0.57), at(u1 + w * 0.3, z1 + h * 0.5)],
      ["#4A4A5E", "#2E2E3E", "#1E1E2A"],
      at(u1 + w * 0.3, z1 + h * 0.57),
      at(u1 + w * 0.42, z1 + h * 0.4),
    ),
    ball(at(u1 + w * 0.36, z1 + h * 0.46), 0.45, "#FFD98A"),
  ];
}

/** A mirror on a wall: night glass under an arched gilt frame with a
 *  crest, and two gleams across it. */
export function mirror(wall: "x" | "y", u1: number, u2: number, z1: number, spring: number): Shape[] {
  const at = onWall(wall, 0.002);
  const mid = (u1 + u2) / 2;
  const r = (u2 - u1) / 2;
  const archOf = (inset: number): V3[] => [
    at(u1 + inset, z1 + inset),
    at(u2 - inset, z1 + inset),
    ...ringOn(wall, at(mid, spring), r - inset, 12, 0, Math.PI),
  ];
  const topZ = spring + r;
  return [
    filled(archOf(0), [GOLD[0], GOLD[1], GOLD[2]], at(u1, topZ), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...poly(archOf(0.012), GOLD[2]), fill: undefined, strokeWidth: 0.5 },
    filled(archOf(0.02), GLASS, at(u1, topZ), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...line([at(u1 + 0.03, z1 + 0.08), at(u1 + 0.07, spring + 0.02)], "#FFFFFF", 1.4), opacity: 0.18 },
    { ...line([at(u1 + 0.045, z1 + 0.05), at(u1 + 0.1, spring + 0.04)], "#FFFFFF", 0.6), opacity: 0.25 },
    // a gilt crest of two leaves and a shell
    filled(ringOn(wall, at(mid, topZ - 0.004), 0.03, 10, 0, Math.PI), [GOLD[0], GOLD[1], GOLD[2]], at(mid - 0.02, topZ + 0.03), at(mid + 0.02, topZ), GOLD[2]),
    ...[-1, 1].map((s) => line([at(mid, topZ + 0.002), at(mid + s * 0.022, topZ + 0.024)], GOLD[2], 0.45)),
    ball(at(mid, topZ + 0.034), 0.7, GOLD[0], GOLD[2]),
  ];
}

// ── furniture ───────────────────────────────────────────────────────

/** A vase on (x, y, z): a turned porcelain body, blue bands round it. */
export function vase(x: number, y: number, z: number, r: number, h: number, colors = ["#FFFFFF", "#E8EEF6", "#8FA2C2"], band = "#2E4E9A"): Shape[] {
  return [
    ...turned(
      [x, y, z],
      [
        [r * 0.55, 0],
        [r * 0.62, h * 0.05],
        [r * 0.95, h * 0.3],
        [r, h * 0.45],
        [r * 0.85, h * 0.62],
        [r * 0.48, h * 0.82],
        [r * 0.42, h * 0.93],
        [r * 0.58, h],
      ],
      colors,
      "#1A2240",
    ),
    hoop(x, y, z + h * 0.42, r * 1.0, band),
    hoop(x, y, z + h * 0.28, r * 0.93, band),
    hoop(x, y, z + h * 0.84, r * 0.47, band),
  ];
}

/** Flowers standing in a vase whose mouth is at (x, y, z): leaves fanned
 *  out, roses and lilies over them. */
export function bouquet(x: number, y: number, z: number, size = 1): Shape[] {
  const [cx, cy] = P(x, y, z);
  const s = size * unit() * 0.01;
  const shapes: Shape[] = [];
  for (const a of [-1.25, 1.2, -0.75, 0.7]) shapes.push(...leafAt([cx, cy], a, 7 * s, 1.8 * s));
  const blooms: [number, number, number, string][] = [
    [-3.6, -4.2, 1.15, "#F4EEDF"],
    [3.4, -4.6, 1.1, "#E8B850"],
    [0.2, -7.2, 1.25, "#C0303C"],
    [-2.6, -8.6, 1.0, "#F4EEDF"],
    [2.8, -8.2, 1.05, "#C0303C"],
    [0, -10.6, 0.95, "#E8B850"],
    [-0.4, -4.2, 1.2, "#C0303C"],
  ];
  for (const [dx, dy, r, c] of blooms) {
    const bx = cx + dx * s;
    const by = cy + dy * s;
    const rr = r * size * unit() * 0.025;
    shapes.push({
      d: oval(bx, by, rr, rr),
      fill: c,
      grad: { colors: [tone(c, 0.35), c, tone(c, -0.35)], from: [bx - rr * 0.4, by - rr * 0.4], radius: rr * 1.5 },
      stroke: inkOf(c),
      strokeWidth: 0.45,
    });
    // the petals' curl
    shapes.push({
      d: `M${n(bx - rr * 0.45)} ${n(by)} A${n(rr * 0.45)} ${n(rr * 0.45)} 0 1 1 ${n(bx + rr * 0.1)} ${n(by + rr * 0.42)}`,
      stroke: tone(c, -0.45),
      strokeWidth: 0.4,
      opacity: 0.8,
    });
  }
  return shapes;
}

/** A gilt console table against a wall: legs ending in feet, a shelf
 *  low between them, a carved apron with a pendant shell, and a veined
 *  marble top. Its lit face is at y + d. */
export function consoleTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.018;
  const legAt = (lx: number, ly: number): Shape[] => [
    ...box(lx - 0.004, ly - 0.004, 0, leg + 0.008, leg + 0.008, 0.014, GOLD),
    ...box(lx, ly, 0.014, leg, leg, h - 0.07, GOLD),
    ...box(lx - 0.003, ly - 0.003, h * 0.42, leg + 0.006, leg + 0.006, 0.01, GOLD),
  ];
  const apronZ = h - 0.058;
  const midU = (x + X) / 2;
  const scallop: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = x + 0.015 + ((w - 0.03) * i) / 16;
    scallop.push([u, Y + 0.002, apronZ + 0.008 + Math.abs(Math.sin((i / 16) * Math.PI * 4)) * 0.012]);
  }
  return [
    shadowOf(x, y, w, d),
    ...legAt(X - leg - 0.012, y + 0.01),
    ...box(x + 0.02, y + 0.014, 0.05, w - 0.04, d - 0.032, 0.01, GOLD),
    ...legAt(x + 0.012, Y - leg - 0.01),
    ...legAt(X - leg - 0.012, Y - leg - 0.01),
    ...box(x, y, apronZ, w, d, 0.04, GOLD),
    line(scallop, GOLD[2], 0.6),
    { ...line([[x + 0.01, Y + 0.002, apronZ + 0.032], [X - 0.01, Y + 0.002, apronZ + 0.032]], GOLD[2], 0.5), opacity: 0.8 },
    // the pendant shell under the apron
    filled(ringOn("y", [midU, Y + 0.002, apronZ + 0.004], 0.026, 10, Math.PI, Math.PI * 2), [GOLD[0], GOLD[1], GOLD[2]], [midU - 0.02, Y, apronZ], [midU + 0.02, Y, apronZ - 0.026], GOLD[2]),
    ...[-0.6, 0, 0.6].map((a) =>
      line([[midU, Y + 0.003, apronZ + 0.002], [midU + Math.sin(a) * 0.02, Y + 0.003, apronZ - Math.cos(a) * 0.02]], GOLD[2], 0.4),
    ),
    ...box(x - 0.012, y, h - 0.018, w + 0.024, d + 0.012, 0.018, MARBLE),
    { ...line([[x + 0.02, y + 0.03, h], [x + w * 0.4, y + 0.06, h], [x + w * 0.55, Y - 0.01, h]], "#9E9483", 0.45), opacity: 0.6 },
    { ...line([[x + w * 0.6, y + 0.01, h], [x + w * 0.8, y + d * 0.6, h]], "#9E9483", 0.4), opacity: 0.5 },
  ];
}

/** A long-case clock against a wall: a plinth on bracket feet, a waist
 *  with a glass door and the brass pendulum behind it, a hood with brass
 *  columns round a brass dial (chapter ring, hours, hands at ten past
 *  ten), and a bonnet crest with a ruby and gilt finials. Its lit face
 *  is at y + d. */
export function grandfatherClock(x: number, y: number, w: number, d: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const cx = x + w / 2;
  const Yw = Y - 0.012;
  const shapes: Shape[] = [
    shadowOf(x - 0.01, y, w + 0.02, d),
    // bracket feet, the plinth and its moulding
    ...box(X - 0.012, y + 0.01, 0, 0.022, 0.02, 0.022, MAHOGANY),
    ...box(x - 0.01, Y - 0.014, 0, 0.022, 0.022, 0.022, MAHOGANY),
    ...box(X - 0.012, Y - 0.014, 0, 0.022, 0.022, 0.022, MAHOGANY),
    ...box(x - 0.008, y, 0.022, w + 0.016, d + 0.006, 0.1, MAHOGANY),
    ...panel("lit", Y + 0.006, x + 0.008, X - 0.008, 0.042, 0.104, MAHOGANY[1]),
    ...panel("shade", X + 0.008, y + 0.015, Y - 0.01, 0.042, 0.104, MAHOGANY[2]),
    ...box(x - 0.012, y, 0.122, w + 0.024, d + 0.01, 0.014, MAHOGANY),
    // the waist, its glass door and the pendulum
    ...box(x + 0.012, y, 0.136, w - 0.024, d - 0.012, 0.27, MAHOGANY),
    ...panel("shade", X - 0.012, y + 0.015, Yw - 0.012, 0.16, 0.38, MAHOGANY[2]),
    filled([[x + 0.024, Yw, 0.152], [X - 0.024, Yw, 0.152], [X - 0.024, Yw, 0.39], [x + 0.024, Yw, 0.39]], [GOLD[0], GOLD[1], GOLD[2]], [x, Yw, 0.39], [X, Yw, 0.15]),
    filled([[x + 0.03, Yw + 0.001, 0.158], [X - 0.03, Yw + 0.001, 0.158], [X - 0.03, Yw + 0.001, 0.384], [x + 0.03, Yw + 0.001, 0.384]], GLASS, [x, Yw, 0.384], [X, Yw, 0.16]),
    line([[cx, Yw + 0.002, 0.38], [cx, Yw + 0.002, 0.225]], BRASS[1], 0.8),
    roundel("y", [cx, Yw + 0.002, 0.205], 0.022, [GILT[0], GILT[1], GILT[2]], GOLD[2]),
    { ...poly(ringOn("y", [cx, Yw + 0.003, 0.205], 0.013, 16), GOLD[1], GOLD[2]), fill: undefined, strokeWidth: 0.45 },
    { ...line([[x + 0.034, Yw + 0.003, 0.26], [x + 0.07, Yw + 0.003, 0.37]], "#FFFFFF", 0.8), opacity: 0.25 },
    // the hood
    ...box(x - 0.004, y, 0.406, w + 0.008, d + 0.004, 0.016, MAHOGANY),
    ...box(x, y, 0.422, w, d, 0.16, MAHOGANY),
    filled([[x + 0.016, Y + 0.001, 0.434], [X - 0.016, Y + 0.001, 0.434], [X - 0.016, Y + 0.001, 0.57], [x + 0.016, Y + 0.001, 0.57]], [GILT[0], GILT[1], GILT[2]], [x, Y, 0.57], [X, Y, 0.434]),
  ];
  // the dial: chapter ring, hours, hands
  const c: V3 = [cx, Y + 0.002, 0.502];
  const ring = (r: number, a: number): V3 => [cx + Math.cos(a) * r, Y + 0.003, c[2] + Math.sin(a) * r];
  const hour = (h: number) => Math.PI / 2 - (h * Math.PI) / 6;
  shapes.push(
    roundel("y", c, 0.05, [GILT[0], GILT[3], GILT[2]], GOLD[2]),
    roundel("y", [c[0], c[1] + 0.0005, c[2]], 0.043, ["#FFFFFF", "#F2EAD6", "#CDBF9E"], "#7A6440"),
    { ...poly(ringOn("y", [c[0], c[1] + 0.001, c[2]], 0.029, 20), "#E9E0C8"), fill: undefined, stroke: "#9A8A66", strokeWidth: 0.4 },
  );
  for (let h = 0; h < 12; h++) {
    const a = hour(h);
    shapes.push(line([ring(0.031, a), ring(0.04, a)], "#2A1E10", h % 3 === 0 ? 1 : 0.5));
  }
  shapes.push(
    line([ring(0, 0), ring(0.021, hour(10.15))], "#1A1E30", 1.1),
    line([ring(0, 0), ring(0.034, hour(2))], "#1A1E30", 0.75),
    ball(ring(0, 0), 0.45, BRASS[0], BRASS[2]),
    // brass columns at the hood's front corners
    ...[x + 0.007, X - 0.007].flatMap((u) => [
      line([[u, Y + 0.004, 0.426], [u, Y + 0.004, 0.578]], tone(BRASS[2], -0.4), 1.7),
      line([[u, Y + 0.004, 0.426], [u, Y + 0.004, 0.578]], BRASS[1], 0.9),
      { ...line([[u - 0.002, Y + 0.004, 0.43], [u - 0.002, Y + 0.004, 0.574]], "#FFFFFF", 0.35), opacity: 0.6 },
    ]),
    ...box(x - 0.01, y, 0.582, w + 0.02, d + 0.01, 0.018, MAHOGANY),
  );
  // the bonnet crest: an arched board, gilt along its edge, a ruby at its heart
  const crestZ = 0.6;
  const arc = ringOn("y", [cx, Y - 0.004, crestZ + 0.012], w / 2, 14, 0, Math.PI).map(([u, yy, z]): V3 => [u, yy, crestZ + 0.012 + (z - crestZ - 0.012) * 0.75]);
  shapes.push(
    filled([[x, Y - 0.004, crestZ], [X, Y - 0.004, crestZ], ...arc], [tone(MAHOGANY[1], 0.15), MAHOGANY[1], MAHOGANY[2]], [x, Y, crestZ + 0.06], [X, Y, crestZ]),
    line(arc, GOLD[1], 1.1),
    line(arc.map(([u, yy, z]): V3 => [u, yy + 0.001, z - 0.012]), GOLD[2], 0.45),
    ...[x + 0.026, X - 0.026].map((u) => ball([u, Y - 0.003, crestZ + 0.02], 0.85, GOLD[0], GOLD[2])),
    ...jewel([cx, Y - 0.003, crestZ + 0.03], 1.2),
    ...turned([cx, Y - 0.006, crestZ + 0.062], [[0.006, 0], [0.012, 0.008], [0.011, 0.016], [0.004, 0.024], [0.002, 0.03]], GILT),
    ball([cx, Y - 0.006, crestZ + 0.098], 0.7, GOLD[0], GOLD[2]),
    ...[x - 0.004, X + 0.004].flatMap((u) => [
      ...turned([u, Y + 0.004, crestZ], [[0.006, 0], [0.009, 0.008], [0.004, 0.016]], GILT),
      ball([u, Y + 0.004, crestZ + 0.026], 0.75, GOLD[0], GOLD[2]),
    ]),
  );
  return shapes;
}

/** A standing candelabrum: a gilt plinth on three feet, a turned shaft
 *  with knops, a drip bowl, and five candles on curving arms. */
export function torchere(x: number, y: number, accent: string): Shape[] {
  const arm = 0.058;
  const z0 = 0.35;
  const branch = (dx: number, dy: number): Shape[] => {
    const tip: V3 = [x + dx, y + dy, z0 + 0.03];
    const path: V3[] = [
      [x, y, z0],
      [x + dx * 0.45, y + dy * 0.45, z0 - 0.016],
      [x + dx * 0.85, y + dy * 0.85, z0 - 0.004],
      [x + dx, y + dy, z0 + 0.018],
    ];
    return [
      line(path, tone(GOLD[2], -0.5), 2.3),
      line(path, GOLD[1], 1.3),
      ...turned(tip, [[0.006, -0.012], [0.006, 0], [0.016, 0.008]], GILT, GOLD[1]),
      ...cylinder(tip[0], tip[1], tip[2] + 0.008, 0.007, 0.045, WAX),
      ...flame([tip[0], tip[1], tip[2] + 0.053], 2, accent),
    ];
  };
  const feet = [0.6, 2.7, 4.8]
    .map((a): [number, number] => [x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05])
    .sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  return [
    disc(x + 0.03, y + 0.015, 0, 0.06, INK.night, undefined, 0.32),
    ...feet.flatMap(([fx, fy]) => [line([[x, y, 0.024], [fx, fy, 0.008]], tone(GOLD[2], -0.5), 2.4), line([[x, y, 0.024], [fx, fy, 0.008]], GOLD[1], 1.4), ball([fx, fy, 0.008], 0.75, GOLD[0], GOLD[2])]),
    ...turned([x, y, 0.012], [[0.034, 0], [0.036, 0.008], [0.024, 0.02], [0.012, 0.032]], GILT),
    ...turned(
      [x, y, 0.044],
      [
        [0.012, 0],
        [0.009, 0.07],
        [0.022, 0.082],
        [0.023, 0.094],
        [0.009, 0.104],
        [0.008, 0.19],
        [0.019, 0.204],
        [0.008, 0.218],
        [0.008, 0.276],
        [0.016, 0.29],
      ],
      GILT,
    ),
    ...turned([x, y, z0 - 0.02], [[0.014, 0], [0.036, 0.012], [0.042, 0.02]], GILT, GOLD[0]),
    ...branch(0, -arm),
    ...branch(-arm, 0),
    ...turned([x, y, z0], [[0.007, 0], [0.006, 0.03], [0.015, 0.04]], GILT, GOLD[1]),
    ...cylinder(x, y, z0 + 0.04, 0.008, 0.055, WAX),
    ...flame([x, y, z0 + 0.095], 2.3, accent),
    ...branch(arm, 0),
    ...branch(0, arm),
  ];
}

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

/** A stone urn on a square foot, a fern spilling from it. */
export function fernUrn(x: number, y: number, r: number): Shape[] {
  const urnTop = r * 2.3;
  const [cx, cy] = P(x, y, urnTop);
  const s = unit() * 0.01;
  const shapes: Shape[] = [
    disc(x + 0.03, y + 0.012, 0, r * 1.2, INK.night, undefined, 0.32),
    ...box(x - r * 0.75, y - r * 0.75, 0, r * 1.5, r * 1.5, r * 0.4, MARBLE),
    ...turned(
      [x, y, r * 0.4],
      [
        [r * 0.4, 0],
        [r * 0.3, r * 0.3],
        [r * 0.85, r * 0.9],
        [r, r * 1.5],
        [r * 1.12, r * 1.9],
      ],
      [GILT[0], "#B98A3E", "#6E4A1A", "#D4A85A"],
      "#1A1410",
    ),
    hoop(x, y, r * 1.4, r * 0.95, GOLD[2]),
  ];
  const fronds: [number, number][] = [
    [-1.45, 0.8],
    [1.4, 0.8],
    [-1.0, 1],
    [1.0, 1],
    [-0.5, 1.1],
    [0.45, 1.1],
    [0.0, 1.2],
  ];
  for (const [a, l] of fronds) shapes.push(...leafAt([cx, cy], a, 22 * s * l, 3.4 * s, LEAF, 7));
  return shapes;
}

// ── the room ────────────────────────────────────────────────────────

export function hall(accent: string): Shape[] {
  const ink = paint();
  const floor: Shape[] = [
    // a dark inlaid border round a chequer of marble, a gilt star at its heart
    floorPatch(0.03, 0.97, 0.03, 0.97, tone(ink.floor, -0.3), GOLD[2]),
    floorPatch(0.065, 0.935, 0.065, 0.935, ink.floor, GOLD[1]),
  ];
  const N = 6;
  const a = 0.065;
  const cell = (1 - 2 * a) / N;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if ((i + j) % 2) continue;
      floor.push(floorPatch(a + i * cell, a + (i + 1) * cell, a + j * cell, a + (j + 1) * cell, ink.tile, ink.line));
      floor.push({ ...line([[a + i * cell + 0.02, a + j * cell + 0.03, 0], [a + i * cell + cell * 0.6, a + j * cell + cell * 0.55, 0], [a + (i + 1) * cell - 0.02, a + (j + 1) * cell - 0.04, 0]], "#FFFFFF", 0.4), opacity: 0.1 });
    }
  }
  // crimson runners from the two back doors to the star
  for (const along of ["x", "y"] as const) {
    const [x1, x2, y1, y2] = along === "x" ? [0.42, 0.58, 0, 0.4] : [0, 0.4, 0.42, 0.58];
    floor.push(floorPatch(x1, x2, y1, y2, VELVET[1], GOLD[1]));
    floor.push({ ...flat(x1 + 0.015, x2 - 0.015, y1 + 0.015, y2 - 0.015, 0, "none", GOLD[2]), fill: undefined, strokeWidth: 0.5 });
    floor.push({
      ...line(along === "x" ? [[x1 + 0.005, y2 + 0.006, 0], [x2 - 0.005, y2 + 0.006, 0]] : [[x2 + 0.006, y1 + 0.005, 0], [x2 + 0.006, y2 - 0.005, 0]], GOLD[1], 1.6),
      dash: "0.3 1.1",
    });
  }
  floor.push(...floorStar(0.5, 0.5, 0.12));

  return [
    ...shell(),
    ...floor,
    // the left wall: a banner, and a moonlit landscape over the stairs
    ...banner("x", 0.07, 0.27, 0.66, 0.3),
    ...giltFrame("x", 0.75, 0.95, 0.5, 0.68, moonlitLandscape),
    // the right wall: a mirror over a gilt console with a vase of flowers
    ...mirror("y", 0.1, 0.28, 0.32, 0.54),
    ...consoleTable(0.08, 0.02, 0.22, 0.1, 0.21),
    ...vase(0.25, 0.065, 0.21, 0.024, 0.085),
    ...bouquet(0.25, 0.065, 0.295, 1),
    // the long-case clock, and a fern in its urn in the corner
    ...grandfatherClock(0.73, 0.015, 0.14, 0.11),
    // the candelabrum that works the hall
    ...lightPool([0.3, 0.3, 0], 0.42),
    ...prop(() => torchere(0.28, 0.28, accent)),
    // the staircase up the left side
    ...staircase(0.02, 0.68, 0.23, 6, 0.05, 0.08),
  ];
}

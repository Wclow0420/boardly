// Tableware and kitchenware: goblets, a place laid, a tureen, decanters,
// a fruit bowl, jugs, china plates, pans and a ladle, a range, a stone
// sink, a broom.

import {
  ball,
  box,
  cylinder,
  flame,
  GOLD,
  hoop,
  INK,
  line,
  n,
  P,
  path,
  poly,
  STONE,
  tone,
  unit,
  WOOD,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { disc } from "../room";
import {
  BRASS,
  CHINA,
  COPPER,
  DELFT,
  GILT_SHEEN,
  IRONWORK,
  LIMESTONE,
  LINEN,
  OAK,
  PEWTER,
  SILVER,
  SILVER_SHEEN,
} from "./materials";
import { filled, ringOn, rod, roundel, shaded, shadowOf, strokes } from "./helpers";
import { turned } from "./turned";

/** A goblet standing at (x, y, z): a gold foot, stem and knop, a bowl
 *  of wine. */
export function goblet(x: number, y: number, z: number, wine = "#7A1626"): Shape[] {
  return turned(
    [x, y, z],
    [
      [0.016, 0],
      [0.015, 0.004],
      [0.005, 0.008],
      [0.004, 0.018],
      [0.008, 0.022],
      [0.004, 0.027],
      [0.009, 0.034],
      [0.019, 0.048],
      [0.021, 0.064],
    ],
    GILT_SHEEN,
    wine,
  );
}

/** A place laid on a table at (x, y, z): a gilt-rimmed plate, a fork
 *  and a knife either side along y. */
export function placeSetting(x: number, y: number, z: number): Shape[] {
  const [px, py] = P(x, y, z);
  return [
    disc(x + 0.004, y + 0.004, z, 0.034, INK.night, undefined, 0.18),
    { ...disc(x, y, z, 0.032, LINEN[0], GOLD[2], undefined, 0.6), grad: { colors: ["#FFFFFF", LINEN[0], LINEN[2]], from: [px - 3, py - 2], radius: 5 } },
    disc(x, y, z + 0.0005, 0.024, undefined, GOLD[1], undefined, 0.5),
    disc(x, y, z + 0.001, 0.017, LINEN[1]),
    { ...line([[x - 0.012, y - 0.008, z + 0.0015], [x - 0.004, y - 0.016, z + 0.0015]], "#FFFFFF", 0.6), opacity: 0.7 },
    line([[x - 0.046, y - 0.024, z + 0.001], [x - 0.046, y + 0.024, z + 0.001]], SILVER[1], 0.9),
    line([[x + 0.046, y - 0.024, z + 0.001], [x + 0.046, y + 0.024, z + 0.001]], SILVER[1], 0.9),
    line([[x + 0.044, y - 0.024, z + 0.002], [x + 0.044, y + 0.004, z + 0.002]], "#FFFFFF", 0.4),
  ];
}

/** A silver soup tureen at (x, y, z), `r` round: a footed bowl with ring handles
 *  and a domed lid with a finial. */
export function tureen(x: number, y: number, z: number, r: number): Shape[] {
  return [
    ...turned([x, y, z], [[r * 0.55, 0], [r * 0.6, r * 0.12], [r * 0.4, r * 0.22], [r * 0.85, r * 0.42], [r, r * 0.75], [r * 0.95, r * 0.95]], SILVER_SHEEN),
    ...[-1, 1].map((s) => roundel("x", [x, y + s * r * 1.02, z + r * 0.72], r * 0.22, SILVER_SHEEN, SILVER[2])),
    ...turned([x, y, z + r * 0.95], [[r * 1.0, 0], [r * 0.9, r * 0.22], [r * 0.6, r * 0.42], [r * 0.2, r * 0.52], [r * 0.12, r * 0.6], [r * 0.2, r * 0.72]], SILVER_SHEEN),
    hoop(x, y, z + r * 0.95, r, SILVER[2]),
  ];
}

/** A wine decanter at (x, y, z): cut glass over dark wine, a stopper. */
export function decanter(x: number, y: number, z: number, wine = "#7A1626"): Shape[] {
  return [
    ...turned(
      [x, y, z],
      [
        [0.018, 0],
        [0.022, 0.012],
        [0.022, 0.03],
        [0.012, 0.05],
        [0.006, 0.062],
        [0.006, 0.078],
        [0.008, 0.08],
      ],
      [tone(wine, 0.45), wine, tone(wine, -0.35), tone(wine, 0.2)],
    ),
    ...turned([x, y, z + 0.08], [[0.004, 0], [0.009, 0.01], [0.002, 0.02]], ["#FFFFFF", "#C8D8F0", "#7A8AA8"]),
  ];
}

/** A cut-glass decanter of wine at (x, y, z), with its stopper. */
export function glassDecanter(x: number, y: number, z: number): Shape[] {
  const [cx] = P(x, y, z);
  const yAt = (h: number) => P(x, y, z + h)[1];
  const k = unit() * 1.2247;
  const prof: [number, number][] = [[0, 0.018], [0.004, 0.022], [0.03, 0.024], [0.045, 0.016], [0.06, 0.007], [0.075, 0.007], [0.078, 0.01]];
  const side = (sign: number) => prof.map(([h, r]) => [cx + sign * r * k, yAt(h)] as Pt);
  const wine = prof.slice(0, 4).map(([h, r]) => [h, r * 0.86] as [number, number]);
  return [
    { d: path([...side(-1), ...side(1).reverse()]), fill: INK.glass, opacity: 0.35, stroke: "#D8E6FF", strokeWidth: 0.4 },
    {
      d: path([...wine.map(([h, r]) => [cx - r * k, yAt(h)] as Pt), ...wine.map(([h, r]) => [cx + r * k, yAt(h)] as Pt).reverse()]),
      fill: "#8E1A2E",
      grad: { colors: ["#E05A6A", "#8E1A2E", "#3A0410"], from: [cx - 0.02 * k, yAt(0.04)], to: [cx + 0.024 * k, yAt(0.01)] },
    },
    { d: `M${n(cx - 0.014 * k)} ${n(yAt(0.036))} L${n(cx - 0.016 * k)} ${n(yAt(0.012))}`, stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.7 },
    ball([x, y, z + 0.088], 0.6, INK.glass, "#D8E6FF"),
  ];
}

/** A footed silver bowl at (x, y, z) heaped with fruit. */
export function fruitBowl(x: number, y: number, z: number): Shape[] {
  const fruit: [number, number, number, number, string][] = [
    [-0.016, -0.008, 0.05, 1.05, "#6A2A5A"],
    [0.014, -0.01, 0.052, 1.1, "#C0303C"],
    [0.0, 0.0, 0.064, 1.15, "#E8B850"],
    [-0.012, 0.012, 0.054, 1.05, "#7FA34A"],
    [0.014, 0.012, 0.05, 1.0, "#6A2A5A"],
  ];
  return [
    ...turned([x, y, z], [[0.018, 0], [0.018, 0.004], [0.006, 0.012], [0.006, 0.02], [0.03, 0.036], [0.036, 0.046]], SILVER_SHEEN, "#3A3040"),
    ...fruit.map(([dx, dy, dz, r, c]) => {
      const s = roundel("y", [x + dx, y + dy, z + dz], r * 0.012, [tone(c, 0.4), c, tone(c, -0.4)], tone(c, -0.6));
      return s;
    }),
  ];
}

/** A jug standing at (x, y, z), `h` tall: a turned body in `colors` (a
 *  sheen) with a lip and a handle, and a `band` round it if given. */
export function jug(x: number, y: number, z: number, h: number, colors: string[], band?: string): Shape[] {
  const r = h * 0.42;
  return [
    line([[x + r * 0.7, y - r * 0.7, z + h * 0.82], [x + r * 1.5, y - r * 1.5, z + h * 0.7], [x + r * 1.2, y - r * 1.2, z + h * 0.3]], tone(colors[2], -0.3), 1.4),
    ...turned(
      [x, y, z],
      [
        [r * 0.7, 0],
        [r, h * 0.3],
        [r * 0.95, h * 0.55],
        [r * 0.62, h * 0.82],
        [r * 0.74, h],
      ],
      colors,
      tone(colors[2], -0.5),
    ),
    ...(band ? [hoop(x, y, z + h * 0.4, r * 0.99, band)] : []),
  ];
}

/** A blue-and-white plate standing on edge against the right-hand wall
 *  plane at depth y, centred at (u, z) on it, `r` round. */
export function chinaPlate(u: number, y: number, z: number, r: number): Shape[] {
  const c: V3 = [u, y, z];
  return [
    roundel("y", c, r, CHINA, "#4A5878"),
    { ...line(ringOn("y", [u, y + 0.0005, z], r * 0.78), DELFT, 0.8), dash: "0.8 0.9" },
    roundel("y", [u, y + 0.001, z], r * 0.4, ["#6A8AD0", DELFT, "#1A2E66"], "#1A2E66"),
  ];
}

// ── the kitchen ─────────────────────────────────────────────────────

/** A pan hanging from a hook on the left-hand wall at (y, z), `size` 1
 *  for a small one. */
export function hangingPan(y: number, z: number, size: number): Shape[] {
  const [cx, cy] = P(0.012, y, z);
  const r = size * unit() * 0.022;
  return [
    line([[0, y, z + 0.11], [0.012, y, z + 0.035]], IRONWORK[0], 0.7),
    {
      d: `M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r * 0.92)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r * 0.92)} 0 1 0 ${n(-2 * r)} 0 Z`,
      fill: IRONWORK[1],
      grad: { colors: [tone(IRONWORK[1], 0.3), IRONWORK[1], tone(IRONWORK[1], -0.4)], from: [cx - r * 0.4, cy - r * 0.4], radius: r * 1.4 },
      stroke: tone(IRONWORK[1], -0.6),
      strokeWidth: 0.55,
    },
    {
      d: `M${n(cx - r * 0.55)} ${n(cy - r * 0.35)} a${n(r * 0.6)} ${n(r * 0.55)} 0 0 1 ${n(r * 0.6)} ${n(-r * 0.35)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.55,
      opacity: 0.4,
    },
  ];
}

/** A copper pan `r` round hung flat against the left-hand wall at y by
 *  its handle (`handle` long) from a rail at height `rail`: the base towards us, its inside in shadow. */
export function wallPan(y: number, rail: number, r: number, handle: number): Shape[] {
  const zc = rail - 0.02 - handle - r;
  const top = zc + r;
  return [
    line([[0.006, y, rail], [0.012, y, rail - 0.02]], IRONWORK[0], 0.8),
    line([[0.014, y, top], [0.014, y, rail - 0.02]], tone(COPPER[2], -0.4), 1.8),
    line([[0.014, y, top], [0.014, y, rail - 0.02]], COPPER[3], 0.8),
    roundel("x", [0.016, y, zc], r, [COPPER[0], COPPER[1], COPPER[2]], tone(COPPER[2], -0.5)),
    roundel("x", [0.018, y, zc], r * 0.78, [COPPER[2], COPPER[1], COPPER[3]], tone(COPPER[2], -0.3)),
    { ...line(ringOn("x", [0.02, y, zc], r * 0.9, 8, 1.75, 2.75), "#FFFFFF", 0.7), opacity: 0.65 },
  ];
}

/** A ladle hung at y on the left-hand wall's rail at height `rail`. */
export function ladle(y: number, rail: number): Shape[] {
  return [
    ...rod([[0.012, y, rail - 0.01], [0.012, y, rail - 0.15]], PEWTER[1], 0.8),
    roundel("x", [0.016, y, rail - 0.17], 0.022, [PEWTER[0], PEWTER[1], PEWTER[2]], tone(PEWTER[2], -0.5)),
  ];
}

/** A kitchen range against the right-hand wall: a stone hearth, a dark
 *  iron body with an arched firebox (fire behind a brass grate), a brass
 *  rail along its top, a hood above with a gilded band, and a chimney to
 *  the cornice. Its lit face is at y + d. */
export function range(x: number, y: number, w: number, d: number, h: number, accent: string): Shape[] {
  const Y = y + d;
  const X = x + w;
  const fire = { from: x + w * 0.18, to: X - w * 0.18, z0: 0.03, spring: h * 0.42 };
  const at = (u: number, z: number): V3 => [u, Y + 0.002, z];
  // the firebox's arched mouth
  const mouth: V3[] = [at(fire.from, fire.z0), at(fire.to, fire.z0)];
  const r = (fire.to - fire.from) / 2;
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * Math.PI;
    mouth.push(at((fire.from + fire.to) / 2 + Math.cos(t) * r, fire.spring + Math.sin(t) * r * 0.9));
  }
  const grate = [0.25, 0.42, 0.58, 0.75].map((f) => {
    const u = fire.from + (fire.to - fire.from) * f;
    return line([at(u, fire.z0), at(u, fire.spring + r * 0.5)], BRASS[1], 0.9);
  });
  return [
    shadowOf(x - 0.03, y, w + 0.06, d + 0.03),
    ...box(x - 0.03, y, 0, w + 0.06, d + 0.03, 0.025, STONE),
    ...box(x, y, 0.025, w, d, h - 0.025, IRONWORK),
    { ...poly(mouth, INK.night), stroke: BRASS[2], strokeWidth: 0.9 },
    ...flame([x + w * 0.38, Y, fire.z0], 2.4, accent),
    ...flame([x + w * 0.62, Y, fire.z0], 2.4, accent),
    ...flame([x + w * 0.5, Y, fire.z0], 3.4, accent),
    ...grate,
    line([at(x + 0.01, h - 0.03), at(X - 0.01, h - 0.03)], BRASS[1], 1.3),
    { ...line([at(x + 0.01, h - 0.035), at(X - 0.01, h - 0.035)], "#FFFFFF", 0.4), opacity: 0.5 },
    ...box(x - 0.01, y - 0.01, h, w + 0.02, d + 0.02, 0.02, IRONWORK),
    // the hood, a gilded band along its foot, the chimney to the cornice
    ...box(x + w * 0.22, y, h + 0.2, w * 0.56, d * 0.5, 0.52 - h, STONE),
    ...box(x + 0.01, y, h + 0.1, w - 0.02, d * 0.72, 0.1, STONE),
    {
      ...poly(
        [
          [x + 0.01, y + d * 0.72 + 0.002, h + 0.1],
          [X - 0.01, y + d * 0.72 + 0.002, h + 0.1],
          [X - 0.01, y + d * 0.72 + 0.002, h + 0.118],
          [x + 0.01, y + d * 0.72 + 0.002, h + 0.118],
        ],
        GOLD[1],
      ),
      grad: { colors: [GOLD[0], GOLD[1], GOLD[2]], from: P(x, y + d * 0.72, h + 0.118), to: P(x, y + d * 0.72, h + 0.1) },
    },
  ];
}

/** A stone sink against the left-hand wall from y1 to y2 on two piers,
 *  a bucket under it and a cast-iron pump at its back. */
export function sink(y1: number, y2: number): Shape[] {
  const w = 0.15;
  const z1 = 0.14;
  const z2 = 0.2;
  const STONE_S: Tones = [tone(LIMESTONE[0], -0.06), tone(LIMESTONE[1], -0.08), tone(LIMESTONE[2], -0.1)];
  const py = y1 + 0.035;
  return [
    shadowOf(0, y1, w, y2 - y1),
    // the dark under the sink, a bucket in it
    poly([[0.003, y1, 0], [0.003, y2, 0], [0.003, y2, z1], [0.003, y1, z1]], "#2A2418"),
    ...box(0.02, y1 + 0.01, 0, 0.1, 0.03, z1, STONE_S),
    ...cylinder(0.075, (y1 + y2) / 2 + 0.01, 0, 0.038, 0.085, WOOD),
    hoop(0.075, (y1 + y2) / 2 + 0.01, 0.02, 0.038, IRONWORK[2]),
    hoop(0.075, (y1 + y2) / 2 + 0.01, 0.065, 0.038, IRONWORK[2]),
    disc(0.075, (y1 + y2) / 2 + 0.01, 0.0855, 0.03, "#3A5470"),
    ...box(0.02, y2 - 0.035, 0, 0.1, 0.03, z1, STONE_S),
    // the trough: its slab, the basin sunk in it with water
    ...box(0, y1, z1, w, y2 - y1, z2 - z1, STONE_S),
    shaded([[0.02, y1 + 0.02, z2 + 0.001], [w - 0.02, y1 + 0.02, z2 + 0.001], [w - 0.02, y2 - 0.02, z2 + 0.001], [0.02, y2 - 0.02, z2 + 0.001]], tone(LIMESTONE[2], -0.25), [w, y2, z2], [0, y1, z2], 0.1, 0.3),
    filled([[0.03, y1 + 0.03, z2 + 0.002], [w - 0.025, y1 + 0.03, z2 + 0.002], [w - 0.025, y2 - 0.025, z2 + 0.002], [0.03, y2 - 0.025, z2 + 0.002]], ["#7A9ABA", "#4A6A88", "#2A4258"], [0.03, y1, z2], [w, y2, z2]),
    { ...line([[0.05, y1 + 0.06, z2 + 0.003], [0.09, y1 + 0.1, z2 + 0.003]], "#FFFFFF", 0.6), opacity: 0.6 },
    // the pump: a fluted iron barrel, a spout, a long curved handle
    ...cylinder(0.035, py, z2, 0.022, 0.16, IRONWORK),
    hoop(0.035, py, z2 + 0.04, 0.022, BRASS[1]),
    ...cylinder(0.035, py, z2 + 0.16, 0.026, 0.014, IRONWORK),
    ball([0.035, py, z2 + 0.185], 0.55, BRASS[1], BRASS[2]),
    ...rod([[0.045, py + 0.01, z2 + 0.11], [0.075, py + 0.03, z2 + 0.11], [0.085, py + 0.036, z2 + 0.085]], IRONWORK[1], 1.6),
    ...rod([[0.035, py, z2 + 0.17], [0.035, py + 0.06, z2 + 0.22], [0.035, py + 0.12, z2 + 0.21]], IRONWORK[1], 1.2),
    ball([0.035, py + 0.125, z2 + 0.208], 0.55, IRONWORK[0], IRONWORK[2]),
    // a pewter jug and a scrubbing brush on the rim
    ...jug(0.06, y2 - 0.03, z2, 0.06, [PEWTER[0], PEWTER[1], PEWTER[2], PEWTER[0]]),
    ...box(0.1, y2 - 0.07, z2, 0.035, 0.02, 0.01, OAK),
    { ...line([[0.102, y2 - 0.05, z2 + 0.005], [0.133, y2 - 0.05, z2 + 0.005]], "#E8D8A8", 1), dash: "0.5 0.5" },
  ];
}

/** A broom leaning against the left-hand wall at y. */
export function broom(y: number): Shape[] {
  const foot: V3 = [0.09, y, 0.0];
  const head: V3 = [0.075, y, 0.05];
  return [
    ...rod([[0.004, y, 0.46], head], WOOD[0], 1.1),
    filled([[0.06, y - 0.03, 0.06], [0.09, y - 0.03, 0.06], [foot[0] + 0.025, y - 0.04, 0], [foot[0] - 0.01, y - 0.04, 0], [foot[0] - 0.01, y + 0.04, 0], [0.06, y + 0.03, 0.06]], ["#E8C878", "#C8A050", "#8A6A30"], [0.06, y + 0.03, 0.06], [0.1, y - 0.04, 0]),
    strokes([-0.025, 0, 0.025].map((o): V3[] => [[0.075, y + o * 0.8, 0.055], [0.095, y + o * 1.3, 0.004]]), "#7A5A20", 0.4, 0.7),
    line([[0.06, y - 0.03, 0.05], [0.06, y + 0.03, 0.05]], "#A8323C", 1),
  ];
}

// Seal the Manor's dining: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// The pieces below (a dinner table, a high-backed chair, a sideboard, a
// candelabrum, goblets, a tureen, a plate rack…) are generic and
// exported so other rooms can use them, and so they can move into
// furniture.ts later. The shared helpers come from the hall.

import {
  GOLD,
  INK,
  P,
  box,
  cylinder,
  flame,
  flat,
  hoop,
  lightPool,
  line,
  poly,
  tone,
  type Shape,
  type V3,
} from "@/components/iso/kit";
import {
  WAX,
  disc,
  planks,
  prop,
  shell,
} from "@/components/iso/room";
import {
  BRASS,
  panel,
  shelfY,
} from "@/components/iso/furniture";
import {
  GILT,
  LINEN,
  MAHOGANY,
  SHEEN,
  SILVER,
  VELVET,
  bouquet,
  filled,
  floorPatch,
  giltFrame,
  jewel,
  moonlitLandscape,
  onWall,
  ringOn,
  roundel,
  shadowOf,
  turned,
  vase,
} from "./hall";
import {
  JEWELS,
} from "@/components/engraved/shapes";

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
    GILT,
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

/** A silver candelabrum on a table at (x, y, z): a domed foot, a turned
 *  stem, two scrolled arms along x and a taller middle light. */
export function tableCandelabrum(x: number, y: number, z: number, accent: string): Shape[] {
  const spread = 0.045;
  const az = z + 0.1;
  const light = (cx: number, cz: number, h: number): Shape[] => [
    ...turned([cx, y, cz], [[0.005, -0.006], [0.005, 0], [0.012, 0.007]], SHEEN, SILVER[1]),
    ...cylinder(cx, y, cz + 0.007, 0.006, h, WAX),
    ...flame([cx, y, cz + 0.007 + h], 1.8, accent),
  ];
  const arm = (s: number): Shape[] => {
    const pts: V3[] = [
      [x, y, az - 0.012],
      [x + s * spread * 0.5, y, az - 0.026],
      [x + s * spread * 0.92, y, az - 0.012],
      [x + s * spread, y, az + 0.004],
    ];
    return [line(pts, tone(SILVER[2], -0.5), 2), line(pts, SILVER[0], 1.1)];
  };
  return [
    disc(x + 0.012, y + 0.006, z, 0.03, INK.night, undefined, 0.25),
    ...turned(
      [x, y, z],
      [
        [0.026, 0],
        [0.026, 0.006],
        [0.014, 0.016],
        [0.006, 0.024],
        [0.005, 0.05],
        [0.011, 0.058],
        [0.005, 0.066],
        [0.005, 0.09],
        [0.01, 0.098],
      ],
      SHEEN,
    ),
    ...arm(-1),
    ...arm(1),
    ...light(x - spread, az + 0.004, 0.045),
    ...light(x + spread, az + 0.004, 0.045),
    ...turned([x, y, z + 0.098], [[0.006, 0], [0.006, 0.014]], SHEEN),
    ...light(x, az + 0.018, 0.055),
  ];
}

/** A long dinner table: turned mahogany legs under a white cloth that
 *  falls over its edges with a gilt hem and soft folds, and a gold
 *  runner down its length that hangs over the far end with a tassel. */
export function dinnerTable(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const drop = 0.075;
  const o = 0.012;
  const shapes: Shape[] = [shadowOf(x, y, w, d)];
  const legs: [number, number][] = [
    [X - 0.04, y + 0.03],
    [x + 0.04, Y - 0.03],
    [x + w / 2, Y - 0.03],
    [X - 0.04, Y - 0.03],
  ];
  for (const [lx, ly] of legs) {
    shapes.push(
      ...turned(
        [lx, ly, 0],
        [
          [0.016, 0],
          [0.012, 0.02],
          [0.018, 0.045],
          [0.01, 0.08],
          [0.013, 0.12],
          [0.011, h - drop],
        ],
        [tone(MAHOGANY[0], 0.2), MAHOGANY[1], MAHOGANY[2], tone(MAHOGANY[1], 0.1)],
      ),
    );
  }
  // the cloth: its top and the fall over the two near edges
  shapes.push(...box(x - o, y - o, h - drop, w + 2 * o, d + 2 * o, drop + 0.002, LINEN));
  const top = h + 0.002;
  for (const f of [0.12, 0.3, 0.5, 0.7, 0.88]) {
    const u = x - o + (w + 2 * o) * f;
    shapes.push({ ...line([[u, Y + o + 0.001, top - 0.006], [u + 0.006, Y + o + 0.001, h - drop + 0.004]], LINEN[2], 1.1), opacity: 0.55 });
  }
  for (const f of [0.3, 0.7]) {
    const v = y - o + (d + 2 * o) * f;
    shapes.push({ ...line([[X + o + 0.001, v, top - 0.006], [X + o + 0.001, v + 0.006, h - drop + 0.004]], LINEN[2], 1.1), opacity: 0.55 });
  }
  const hem = h - drop + 0.012;
  shapes.push(
    line([[x - o, Y + o + 0.001, hem], [X + o + 0.001, Y + o + 0.001, hem], [X + o + 0.001, y - o, hem]], GOLD[1], 1),
    { ...line([[x - o, Y + o + 0.001, hem - 0.007], [X + o + 0.001, Y + o + 0.001, hem - 0.007], [X + o + 0.001, y - o, hem - 0.007]], GOLD[2], 1.4), dash: "0.3 1.6" },
  );
  // the runner, and its end hanging over the near end of the table
  const [r1, r2] = [y + d / 2 - 0.026, y + d / 2 + 0.026];
  const rm = (r1 + r2) / 2;
  shapes.push(
    { ...flat(x - o, X + o, r1, r2, top, GOLD[1], GOLD[2]), grad: { colors: [GOLD[0], GOLD[1], GOLD[2]], from: P(x, r1, top), to: P(X, r2, top) } },
    line([[x - o + 0.005, r1 + 0.008, top], [X + o, r1 + 0.008, top]], VELVET[1], 0.55),
    line([[x - o + 0.005, r2 - 0.008, top], [X + o, r2 - 0.008, top]], VELVET[1], 0.55),
    filled([[X + o + 0.002, r1, top], [X + o + 0.002, r2, top], [X + o + 0.002, r2, top - 0.075], [X + o + 0.002, rm, top - 0.1], [X + o + 0.002, r1, top - 0.075]], [GOLD[0], GOLD[1], GOLD[2]], [X, r1, top], [X, r2, top - 0.1], GOLD[2]),
    line([[X + o + 0.003, r1 + 0.008, top], [X + o + 0.003, r1 + 0.008, top - 0.072], [X + o + 0.003, rm, top - 0.09], [X + o + 0.003, r2 - 0.008, top - 0.072], [X + o + 0.003, r2 - 0.008, top]], VELVET[1], 0.55),
    line([[X + o + 0.004, rm, top - 0.1], [X + o + 0.004, rm, top - 0.13]], GOLD[1], 1.6),
  );
  return shapes;
}

/** A high-backed dining chair: turned front legs, a crimson cushion
 *  on a mahogany seat, an upholstered back studded in gold between two
 *  stiles with brass finials, under a carved gilt crest. Its back stands
 *  along the named edge of the seat: "y0" faces the viewer's left
 *  (+y), "x1" faces back (-x), showing its carved rear. */
export function highChair(x: number, y: number, back: "y0" | "x1"): Shape[] {
  const s = 0.1;
  const seat = 0.12;
  const top = 0.5;
  const t = 0.014;
  const shapes: Shape[] = [shadowOf(x, y, s, s)];
  const leg = (lx: number, ly: number) => box(lx, ly, 0, t, t, seat, MAHOGANY);
  const finial = (fx: number, fy: number): Shape[] => turned([fx, fy, top], [[0.008, 0], [0.004, 0.006], [0.008, 0.014], [0.003, 0.022]], [BRASS[0], BRASS[1], BRASS[2]]);
  const seatParts = (): Shape[] => [
    ...box(x, y, seat, s, s, 0.02, MAHOGANY),
    ...box(x + 0.008, y + 0.008, seat + 0.02, s - 0.016, s - 0.016, 0.016, VELVET),
  ];
  if (back === "y0") {
    const fy = y + 0.002;
    const crest = ringOn("y", [x + s / 2, fy + t, top - 0.03], s / 2, 12, 0, Math.PI).map(([u, yy, z]): V3 => [u, yy, top - 0.03 + (z - top + 0.03) * 0.5]);
    shapes.push(
      ...box(x, y, 0, t, t, top, MAHOGANY),
      ...box(x + s - t, y, 0, t, t, top, MAHOGANY),
      ...box(x + t, fy, seat + 0.05, s - 2 * t, 0.012, top - seat - 0.09, VELVET),
      { ...line([[x + t + 0.006, fy + 0.0125, seat + 0.056], [x + t + 0.006, fy + 0.0125, top - 0.046], [x + s - t - 0.006, fy + 0.0125, top - 0.046], [x + s - t - 0.006, fy + 0.0125, seat + 0.056]], GOLD[0], 1), dash: "0.1 1.5" },
      filled([[x, fy + t, top - 0.03], [x + s, fy + t, top - 0.03], ...crest], [GOLD[0], GOLD[1], GOLD[2]], [x, fy, top], [x + s, fy, top - 0.03], GOLD[2]),
      line([[x + s / 2, fy + t + 0.001, top - 0.03], [x + s / 2, fy + t + 0.001, top - 0.012]], GOLD[2], 0.45),
      ...finial(x + t / 2, y + t / 2),
      ...finial(x + s - t / 2, y + t / 2),
      ...leg(x, y + s - t),
      ...leg(x + s - t, y + s - t),
      ...seatParts(),
    );
  } else {
    const bx = x + s - t;
    shapes.push(
      ...leg(x, y),
      ...leg(x, y + s - t),
      ...seatParts(),
      ...box(bx, y, 0, t, t, top, MAHOGANY),
      ...box(bx, y + t, seat + 0.05, 0.012, s - 2 * t, top - seat - 0.09, MAHOGANY),
      ...panel("shade", bx + 0.012, y + t + 0.01, y + s - t - 0.01, seat + 0.07, top - 0.06, MAHOGANY[2]),
      ...box(bx, y + s - t, 0, t, t, top, MAHOGANY),
      ...box(bx - 0.002, y, top - 0.03, t + 0.004, s, 0.024, GOLD),
      ...finial(bx + t / 2, y + t / 2),
      ...finial(bx + t / 2, y + s - t / 2),
    );
  }
  return shapes;
}

/** A sideboard against a left-hand wall (x = 0), facing +x: turned feet,
 *  a row of drawers over panelled doors with brass pulls, a gilt bead
 *  under a mahogany top. */
export function sideboard(x: number, y: number, w: number, d: number, h: number, doors = 3): Shape[] {
  const X = x + w;
  const Y = y + d;
  const foot = 0.03;
  const slab = 0.02;
  const body = h - slab;
  const shapes: Shape[] = [shadowOf(x, y, w, d)];
  for (const [fx, fy] of [
    [X - 0.022, y + 0.02],
    [x + 0.02, Y - 0.02],
    [X - 0.022, Y - 0.02],
  ]) {
    shapes.push(...turned([fx, fy, 0], [[0.011, 0], [0.008, 0.012], [0.012, foot]], [tone(MAHOGANY[0], 0.2), MAHOGANY[1], MAHOGANY[2], MAHOGANY[1]]));
  }
  shapes.push(...box(x, y, foot, w, d, body - foot, MAHOGANY));
  const drawer = 0.05;
  for (let i = 0; i < doors; i++) {
    const v1 = y + 0.015 + ((d - 0.03) * i) / doors;
    const v2 = y + 0.015 + ((d - 0.03) * (i + 1)) / doors - 0.01;
    shapes.push(...panel("shade", X, v1, v2, body - drawer, body - 0.01, MAHOGANY[2]));
    shapes.push(...panel("shade", X, v1, v2, foot + 0.02, body - drawer - 0.014, MAHOGANY[2]));
    const vm = (v1 + v2) / 2;
    shapes.push(
      line([[X + 0.001, vm - 0.012, body - drawer / 2 - 0.004], [X + 0.001, vm + 0.012, body - drawer / 2 - 0.004]], BRASS[1], 1.1),
      roundel("x", [X + 0.002, vm, (foot + body - drawer) / 2 + 0.01], 0.008, [BRASS[0], BRASS[1], BRASS[2]], BRASS[2]),
    );
  }
  shapes.push(...panel("lit", Y, x + 0.015, X - 0.015, foot + 0.02, body - 0.01, MAHOGANY[1]));
  shapes.push(line([[x - 0.006, Y + 0.004, body + 0.002], [X + 0.004, Y + 0.004, body + 0.002], [X + 0.004, y, body + 0.002]], GOLD[1], 1.2));
  shapes.push(...box(x - 0.008, y - 0.01, body, w + 0.016, d + 0.02, slab, MAHOGANY));
  return shapes;
}

/** A silver soup tureen at (x, y, z): a footed bowl with ring handles
 *  and a domed lid with a finial. */
export function tureen(x: number, y: number, z: number, r: number): Shape[] {
  return [
    ...turned([x, y, z], [[r * 0.55, 0], [r * 0.6, r * 0.12], [r * 0.4, r * 0.22], [r * 0.85, r * 0.42], [r, r * 0.75], [r * 0.95, r * 0.95]], SHEEN),
    ...[-1, 1].map((s) => roundel("x", [x, y + s * r * 1.02, z + r * 0.72], r * 0.22, SHEEN, SILVER[2])),
    ...turned([x, y, z + r * 0.95], [[r * 1.0, 0], [r * 0.9, r * 0.22], [r * 0.6, r * 0.42], [r * 0.2, r * 0.52], [r * 0.12, r * 0.6], [r * 0.2, r * 0.72]], SHEEN),
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
    ...turned([x, y, z], [[0.018, 0], [0.018, 0.004], [0.006, 0.012], [0.006, 0.02], [0.03, 0.036], [0.036, 0.046]], SHEEN, "#3A3040"),
    ...fruit.map(([dx, dy, dz, r, c]) => {
      const s = roundel("y", [x + dx, y + dy, z + dz], r * 0.012, [tone(c, 0.4), c, tone(c, -0.4)], tone(c, -0.6));
      return s;
    }),
  ];
}

/** A glazed china cabinet against a right-hand wall (y = 0), its lit
 *  face at y + d: a plinth, two glass doors with blue-and-white plates standing on the shelves behind, a brass
 *  escutcheon, a cornice, and an arched pediment with a gilt urn. */
export function chinaCabinet(x: number, y: number, w: number, d: number, h: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const base = 0.045;
  const body = h - 0.03;
  const mid = (x + X) / 2;
  const at = (u: number, z: number): V3 => [u, Y + 0.001, z];
  const shapes: Shape[] = [
    shadowOf(x, y, w, d),
    ...box(x - 0.006, y, 0, w + 0.012, d + 0.006, base, MAHOGANY),
    ...panel("lit", Y + 0.006, x + 0.01, X - 0.01, 0.01, base - 0.01, MAHOGANY[1]),
    ...box(x, y, base, w, d, body - base, MAHOGANY),
    ...panel("shade", X, y + 0.012, Y - 0.012, base + 0.02, body - 0.02, MAHOGANY[2]),
  ];
  const [z1, z2] = [base + 0.02, body - 0.02];
  const shelves = [z1 + (z2 - z1) * 0.36, z1 + (z2 - z1) * 0.7];
  for (const [u1, u2] of [
    [x + 0.012, mid - 0.004],
    [mid + 0.004, X - 0.012],
  ]) {
    // the dark inside, its shelves, the plates on them
    shapes.push(filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], ["#3A2418", "#24160E", "#140C08"], at(u1, z2), at(u2, z1)));
    for (const sz of [z1, ...shelves]) {
      const r = Math.min(0.034, (u2 - u1) * 0.36);
      const c = at((u1 + u2) / 2, sz + 0.006 + r);
      shapes.push(
        roundel("y", c, r, ["#FFFFFF", "#EEF2F8", "#A8B4CA"], "#4A5878"),
        { ...line(ringOn("y", [c[0], c[1] + 0.0005, c[2]], r * 0.8), "#2E4E9A", 1.1), dash: "0.8 0.9" },
        line(ringOn("y", [c[0], c[1] + 0.0005, c[2]], r * 0.45, 16), "#5A7AC0", 0.5),
      );
      if (sz !== z1) shapes.push(line([at(u1, sz), at(u2, sz)], MAHOGANY[0], 1.2));
    }
    // the glass: a gleam, and the door's frame
    shapes.push(
      { ...line([at(u1 + 0.012, z1 + 0.05), at(u1 + 0.04, z2 - 0.04)], "#FFFFFF", 1.2), opacity: 0.18 },
      { ...poly([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], MAHOGANY[0], tone(MAHOGANY[2], -0.4)), fill: undefined, strokeWidth: 1.6 },
      { ...poly([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], GOLD[1]), fill: undefined, strokeWidth: 0.5 },
    );
  }
  shapes.push(
    ...filledKeyhole(at(mid, (z1 + z2) / 2)),
    ...box(x - 0.01, y, body, w + 0.02, d + 0.01, 0.03, MAHOGANY),
    line([[x - 0.01, Y + 0.011, body + 0.008], [X + 0.011, Y + 0.011, body + 0.008], [X + 0.011, y, body + 0.008]], GOLD[1], 1),
  );
  // the pediment: an arched board, gilt along its edge, and an urn
  const pz = h;
  const arc = ringOn("y", [mid, Y - 0.004, pz], w / 2 - 0.01, 14, 0, Math.PI).map(([u, yy, z]): V3 => [u, yy, pz + (z - pz) * 0.55]);
  shapes.push(
    filled([[x + 0.01, Y - 0.004, pz], [X - 0.01, Y - 0.004, pz], ...arc], [tone(MAHOGANY[1], 0.15), MAHOGANY[1], MAHOGANY[2]], [x, Y, pz + 0.06], [X, Y, pz]),
    line(arc, GOLD[1], 1.1),
    ...jewel([mid, Y - 0.003, pz + 0.024], 1, JEWELS.sapphire),
    ...turned([mid, Y - 0.006, pz + 0.058], [[0.006, 0], [0.013, 0.01], [0.012, 0.02], [0.005, 0.028], [0.007, 0.034]], GILT),
  );
  return shapes;
}

/** A brass escutcheon with its keyhole, on a face. */
function filledKeyhole(at: V3): Shape[] {
  return [roundel("y", at, 0.008, [BRASS[0], BRASS[1], BRASS[2]], BRASS[2]), roundel("y", [at[0], at[1] + 0.0005, at[2] + 0.001], 0.0025, ["#000000", "#140C08", "#000000"])];
}

/** A canvas: a ship under sail on an evening sea. */
export function seascape(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  const p = (fu: number, fz: number) => at(u1 + w * fu, z1 + h * fz);
  return [
    filled([p(0, 0), p(1, 0), p(1, 1), p(0, 1)], ["#E8A860", "#B86A48", "#3A3A62"], p(0, 0.4), p(0, 1)),
    filled([p(0, 0), p(1, 0), p(1, 0.36), p(0, 0.36)], ["#3A5A7A", "#24405E", "#16283E"], p(0, 0.36), p(1, 0)),
    { ...line([p(0.1, 0.26), p(0.3, 0.28), p(0.5, 0.25)], "#FFFFFF", 0.5), opacity: 0.4 },
    { ...line([p(0.55, 0.14), p(0.85, 0.16)], "#FFFFFF", 0.5), opacity: 0.35 },
    filled([p(0.3, 0.38), p(0.74, 0.38), p(0.68, 0.3), p(0.36, 0.3)], ["#5A3A26", "#3A2418", "#1E120A"], p(0.3, 0.38), p(0.74, 0.3)),
    line([p(0.52, 0.38), p(0.52, 0.86)], "#2A1A10", 0.7),
    filled([p(0.53, 0.42), p(0.53, 0.84), p(0.7, 0.44)], ["#FFFFFF", "#F4EEDF", "#C8BC9C"], p(0.53, 0.84), p(0.7, 0.42)),
    filled([p(0.51, 0.44), p(0.51, 0.74), p(0.36, 0.46)], ["#FFFFFF", "#F4EEDF", "#C8BC9C"], p(0.51, 0.74), p(0.36, 0.44)),
    roundel("y", p(0.2, 0.78), 0.012, ["#FFF8E0", "#FFE3A8", "#E8B860"]),
  ];
}

/** A plate rack on a right-hand wall (y = 0): a shelf on carved
 *  brackets with a rail, and blue-and-white plates standing on it. */
export function plateRack(x1: number, x2: number, z: number, plates = 3): Shape[] {
  const at = onWall("y", 0.012);
  const r = Math.min(0.036, (x2 - x1) / plates / 2 - 0.006);
  const shapes: Shape[] = [];
  for (let i = 0; i < plates; i++) {
    const u = x1 + ((x2 - x1) * (i + 0.5)) / plates;
    const c = at(u, z + 0.018 + r);
    shapes.push(
      roundel("y", c, r, ["#FFFFFF", "#EEF2F8", "#A8B4CA"], "#4A5878"),
      { ...pathRing(c, r * 0.78, "#2E4E9A", 0.8) },
      roundel("y", [c[0], c[1] + 0.001, c[2]], r * 0.42, ["#6A8AD0", "#2E4E9A", "#1A2E66"], "#1A2E66"),
      { ...line([at(u - r * 0.5, c[2] + r * 0.5), at(u - r * 0.2, c[2] + r * 0.75)], "#FFFFFF", 0.6), opacity: 0.8 },
    );
  }
  shapes.push(...shelfY(x1 - 0.02, x2 + 0.02, z, 0.05, MAHOGANY));
  shapes.push(line([at(x1 - 0.02, z + 0.035), at(x2 + 0.02, z + 0.035)], BRASS[1], 0.9));
  return shapes;
}

/** A ring drawn on the right-hand wall plane round centre `c`. */
function pathRing(c: V3, r: number, stroke: string, width: number): Shape {
  return { ...line(ringOn("y", [c[0], c[1] + 0.001, c[2]], r), stroke, width) };
}

/** A canvas: a still life of fruit and a jug on a dark ground. */
export function stillLife(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number, wall: "x" | "y"): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  const dot = (fu: number, fz: number, r: number, c: string) => roundel(wall, at(u1 + w * fu, z1 + h * fz), r, [tone(c, 0.4), c, tone(c, -0.4)], tone(c, -0.6));
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], ["#4A3A26", "#2E2418", "#1A140E"], at(u1 + w * 0.3, z2), at(u2, z1)),
    filled([at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.3), at(u1, z1 + h * 0.3)], ["#5A4630", "#3E3022", "#2A2016"], at(u1, z1 + h * 0.3), at(u2, z1)),
    filled(
      [at(u1 + w * 0.56, z1 + h * 0.3), at(u1 + w * 0.82, z1 + h * 0.3), at(u1 + w * 0.86, z1 + h * 0.55), at(u1 + w * 0.76, z1 + h * 0.72), at(u1 + w * 0.78, z1 + h * 0.8), at(u1 + w * 0.6, z1 + h * 0.8), at(u1 + w * 0.62, z1 + h * 0.72), at(u1 + w * 0.52, z1 + h * 0.55)],
      ["#C8D0DA", "#8A94A4", "#4A5262"],
      at(u1 + w * 0.5, z1 + h * 0.8),
      at(u1 + w * 0.86, z1 + h * 0.3),
    ),
    dot(0.24, 0.42, 0.024, "#C0303C"),
    dot(0.42, 0.38, 0.02, "#E8B850"),
    dot(0.34, 0.36, 0.016, "#7FA34A"),
  ];
}

export function dining(accent: string): Shape[] {
  const y = 0.28;
  const h = 0.24;
  const top = h + 0.002;
  const rm = y + 0.13;
  return [
    ...shell(),
    ...planks(),
    // the rug under the table: a crimson field in a gold-edged border
    floorPatch(0.08, 0.92, 0.1, 0.68, VELVET[2], GOLD[2]),
    floorPatch(0.11, 0.89, 0.13, 0.65, VELVET[1], GOLD[1]),
    floorPatch(0.16, 0.84, 0.18, 0.6, tone(VELVET[1], -0.12), tone(GOLD[2], -0.2)),
    { ...flat(0.095, 0.905, 0.115, 0.665, 0, "none", GOLD[1]), fill: undefined, dash: "0.6 1.4", strokeWidth: 0.8 },
    // walls: a moonlit landscape and a still life, a plate rack, a portrait over the sideboard
    ...giltFrame("x", 0.07, 0.3, 0.36, 0.62, moonlitLandscape),
    ...giltFrame("y", 0.08, 0.3, 0.38, 0.62, seascape),
    ...chinaCabinet(0.72, 0.012, 0.22, 0.1, 0.56),
    ...giltFrame("x", 0.7, 0.94, 0.38, 0.64, stillLife),
    // the sideboard, a tureen and flowers on it
    ...sideboard(0.03, 0.68, 0.15, 0.28, 0.24),
    ...vase(0.105, 0.73, 0.24, 0.02, 0.07),
    ...bouquet(0.105, 0.73, 0.31, 0.85),
    ...tureen(0.105, 0.84, 0.24, 0.04),
    ...decanter(0.105, 0.92, 0.24),
    // high-backed chairs along the far side, the long table laid for a feast
    ...[0.22, 0.45, 0.68].flatMap((cx) => highChair(cx, y - 0.11, "y0")),
    ...dinnerTable(0.16, y, 0.68, 0.26, h),
    ...[0.27, 0.5, 0.73].flatMap((px) => placeSetting(px, y + 0.05, top)),
    ...lightPool([0.5, 0.42, 0], 0.5),
    ...tableCandelabrum(0.3, rm, top, accent),
    ...fruitBowl(0.39, rm, top),
    // two goblets, for the toast
    ...prop(() => [...goblet(0.47, rm, top), ...goblet(0.54, rm, top)]),
    ...decanter(0.615, rm, top),
    ...tableCandelabrum(0.71, rm, top, accent),
    ...[0.3, 0.5, 0.7].flatMap((px) => placeSetting(px, y + 0.21, top)),
    ...placeSetting(0.795, rm, top),
    // the host's chair at the end
    ...highChair(0.865, y + 0.08, "x1"),
  ];
}

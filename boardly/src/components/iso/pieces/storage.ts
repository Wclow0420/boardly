// Where things are kept: cupboards and shelves, chests and barrels, a
// wine rack, a bookcase and its ladder, a sideboard, a china cabinet, a
// plate rack, a Welsh dresser, a glass case. Built from the kit's parts
// with the detail the borders have (panelled doors with brass knobs,
// mouldings, iron bands, glass with a gleam); the faces the viewer sees
// are +y (lit) and +x (shaded).

import {
  ball,
  box,
  cylinder,
  GOLD,
  hoop,
  INK,
  inkOf,
  line,
  n,
  P,
  path,
  poly,
  tone,
  unit,
  WOOD,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { shadow, tint } from "../room";
import { JEWELS } from "@/components/engraved/shapes";
import {
  BRASS,
  COPPER,
  CREAM,
  DELFT,
  GILT,
  GILT_SHEEN,
  GILT_TONES,
  GLAZE,
  IRONWORK,
  MAHOGANY,
  OAK,
  PAGES,
  WARM_INK,
  WARM_MAHOGANY,
} from "./materials";
import {
  filled,
  gradPoly,
  hull,
  jewel,
  panel,
  ring3,
  ringOn,
  rnd,
  roundel,
  shaded,
  shadowOf,
  strokes,
  wallPoint,
} from "./helpers";
import { turned } from "./turned";
import { greekUrn } from "./decor";
import { turnedCandlestick } from "./lighting";
import { chinaPlate, jug } from "./tableware";

const TAU = Math.PI * 2;

const DEG = Math.PI / 180;

/** A brass knob on a visible face. */
const knob = (at: V3, size = 0.9): Shape => ball(at, size, BRASS[1], BRASS[2]);

/** A cupboard at (x, y), w × d × h: a low plinth, a panelled body with
 *  `doors` doors on its lit face under `drawers` drawers (and
 *  `sidePanels` panels on its side), brass knobs, and a top (in `top`, or
 *  its own `tones`) that overhangs a little with a line of light. */
export function cabinet(
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  {
    tones = WOOD,
    doors = 2,
    drawers = 0,
    sidePanels = 1,
    top,
  }: { tones?: Tones; doors?: number; drawers?: number; sidePanels?: number; top?: Tones } = {},
): Shape[] {
  const X = x + w;
  const Y = y + d;
  const base = 0.025;
  const slab = 0.022;
  const bodyTop = h - slab;
  const shapes: Shape[] = [
    shadowOf(x, y, w, d),
    ...box(x + 0.008, y + 0.008, 0, w - 0.016, d - 0.016, base, tones.map((c) => tone(c, -0.18)) as Tones),
    ...box(x, y, base, w, d, bodyTop - base, tones),
  ];
  // drawers across the top of the front, doors below
  const drawerH = drawers > 0 ? 0.06 : 0;
  for (let i = 0; i < drawers; i++) {
    const u1 = x + 0.02 + ((w - 0.04) * i) / drawers;
    const u2 = x + 0.02 + ((w - 0.04) * (i + 1)) / drawers - 0.01;
    shapes.push(...panel("lit", Y, u1, u2, bodyTop - drawerH, bodyTop - 0.012, tones[1]));
    shapes.push(knob([(u1 + u2) / 2, Y, bodyTop - drawerH / 2 - 0.006], 0.75));
  }
  for (let i = 0; i < doors; i++) {
    const u1 = x + 0.02 + ((w - 0.04) * i) / doors;
    const u2 = x + 0.02 + ((w - 0.04) * (i + 1)) / doors - 0.012;
    const z2 = bodyTop - drawerH - 0.018;
    shapes.push(...panel("lit", Y, u1, u2, base + 0.02, z2, tones[1]));
    const right = i % 2 === 0 && doors > 1;
    shapes.push(knob([right ? u2 - 0.018 : u1 + 0.018, Y, (base + z2) / 2 + 0.01]));
  }
  for (let i = 0; i < sidePanels; i++) {
    const u1 = y + 0.02 + ((d - 0.04) * i) / sidePanels;
    const u2 = y + 0.02 + ((d - 0.04) * (i + 1)) / sidePanels - 0.012;
    shapes.push(...panel("shade", X, u1, u2, base + 0.02, bodyTop - 0.02, tones[2]));
  }
  shapes.push(...box(x - 0.012, y - 0.012, bodyTop, w + 0.024, d + 0.024, slab, top ?? tones));
  return shapes;
}

/** A shelf on the right-hand back wall (y = 0), from x1 to x2 at height
 *  z, on two carved brackets. */
export function shelfY(x1: number, x2: number, z: number, depth = 0.07, tones: Tones = WOOD): Shape[] {
  const bracket = (x: number): Shape => ({
    ...poly(
      [
        [x, 0, z],
        [x, depth * 0.9, z],
        [x, 0.012, z - 0.07],
        [x, 0, z - 0.07],
      ],
      tones[2],
    ),
  });
  return [
    bracket(x1 + 0.03),
    bracket(x2 - 0.03),
    ...box(x1, 0, z, x2 - x1, depth, 0.018, tones),
  ];
}

/** The same on the left-hand back wall (x = 0), from y1 to y2. */
export function shelfX(y1: number, y2: number, z: number, depth = 0.07, tones: Tones = WOOD): Shape[] {
  const bracket = (y: number): Shape => ({
    ...poly(
      [
        [0, y, z],
        [depth * 0.9, y, z],
        [0.012, y, z - 0.07],
        [0, y, z - 0.07],
      ],
      tones[2],
    ),
  });
  return [bracket(y1 + 0.03), bracket(y2 - 0.03), ...box(0, y1, z, depth, y2 - y1, 0.018, tones)];
}

/** A chest on the floor at (x, y), w × d × h: wood bound in iron bands, a brass lock plate. */
export function chest(x: number, y: number, w: number, d: number, h: number, tones: Tones = WOOD): Shape[] {
  const X = x + w;
  const Y = y + d;
  return [
    shadowOf(x, y, w, d),
    ...box(x, y, 0, w, d, h * 0.62, tones),
    ...box(x - 0.006, y - 0.006, h * 0.62, w + 0.012, d + 0.012, h * 0.38, tones),
    ...[0.18, 0.82].flatMap((f) => [
      ...box(x + w * f - 0.012, Y - 0.002, 0, 0.024, 0.006, h, IRONWORK),
      ...box(X - 0.002, y + d * f - 0.012, 0, 0.006, 0.024, h, IRONWORK),
    ]),
    ...box(x + w / 2 - 0.02, Y, h * 0.42, 0.04, 0.006, 0.05, BRASS),
  ];
}

/** A barrel standing on the floor at (x, y), `r` round and `h` tall: staves, two iron hoops. */
export function barrel(x: number, y: number, r: number, h: number, tones: Tones = WOOD): Shape[] {
  return [
    { ...shadowOf(x - r, y - r, r * 2, r * 2) },
    ...cylinder(x, y, 0, r, h, tones),
    hoop(x, y, h * 0.22, r, IRONWORK[2]),
    hoop(x, y, h * 0.78, r, IRONWORK[2]),
    hoop(x, y, h * 0.22 + 0.006, r, IRONWORK[0]),
    hoop(x, y, h * 0.78 + 0.006, r, IRONWORK[0]),
  ];
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

// ── books ───────────────────────────────────────────────────────────

/** Book cloth and leather for spines. */
const SPINES = ["#8E2433", "#2F5A45", "#2A3E6E", "#6A3A1E", "#B4683C", "#4A2A4A", "#7A6A2A", "#8E3B3F", "#24485A"];

/** A book standing upright from x, its spine on the plane y = y2 (the
 *  lit side), pages showing on top, a gilt band across the spine. */
export function book(x: number, y1: number, y2: number, z: number, w: number, h: number, color: string): Shape[] {
  return [
    ...box(x, y1, z, w, y2 - y1, h, [tone(PAGES[1], -0.08), color, tone(color, -0.38)]),
    line([[x + w * 0.12, y2, z + h * 0.8], [x + w * 0.88, y2, z + h * 0.8]], GILT[1], 0.6),
  ];
}

/** A book leaning to the left, its foot at x on z: turned by `lean`
 *  radians about its lower-left corner. */
function leaningBook(x: number, y1: number, y2: number, z: number, w: number, h: number, lean: number, color: string): Shape[] {
  const c = Math.cos(lean);
  const s = Math.sin(lean);
  const at = (u: number, v: number, y: number): V3 => [x + u * c - v * s, y, z + u * s + v * c];
  const side = tone(color, -0.38);
  return [
    poly([at(w, 0, y2), at(w, h, y2), at(w, h, y1), at(w, 0, y1)], side),
    poly([at(0, h, y1), at(w, h, y1), at(w, h, y2), at(0, h, y2)], tone(PAGES[1], -0.08)),
    gradPoly([at(0, 0, y2), at(w, 0, y2), at(w, h, y2), at(0, h, y2)], [tone(color, 0.18), color, tone(color, -0.2)], at(0, h, y2), at(w, 0, y2), tone(color, -0.62), 0.55),
    line([at(w * 0.12, h * 0.85, y2), at(w * 0.88, h * 0.85, y2)], GILT[1], 0.5),
  ];
}

/** One shelf of a bookcase, x1..x2, its front at y2, books standing on
 *  z up to `room` tall. `seed` picks the books and what else is kept
 *  there: a lying stack, a leaning book, a little urn. */
function shelfOfBooks(x1: number, x2: number, y2: number, z: number, room: number, seed: number): Shape[] {
  const out: Shape[] = [];
  const kind = seed % 4;
  let x = x1 + 0.006;
  const end = kind === 0 ? x2 - 0.006 : x2 - (x2 - x1) * 0.3;
  let i = 0;
  while (x < end - 0.02) {
    const w = 0.02 + rnd(seed * 31 + i) * 0.016;
    const h = room * (0.7 + rnd(seed * 17 + i * 3) * 0.3);
    if (x + w > end) break;
    out.push(...book(x, y2 - 0.075, y2 - 0.014 - rnd(i + seed) * 0.008, z, w, h, SPINES[Math.floor(rnd(seed * 7 + i) * SPINES.length)]));
    x += w + (rnd(seed + i * 5) < 0.2 ? 0.004 : 0.0005);
    i++;
  }
  const rest = x2 - x;
  if (kind === 1) {
    // a stack lying flat
    for (let j = 0; j < 3; j++) {
      const lw = Math.min(rest - 0.012, 0.075 - j * 0.008);
      out.push(...box(x + 0.006 + j * 0.003, y2 - 0.08, z + j * 0.016, lw, 0.06, 0.015, [tone(PAGES[1], -0.05), SPINES[(seed + j * 2) % SPINES.length], tone(SPINES[(seed + j * 2) % SPINES.length], -0.38)]));
    }
  } else if (kind === 2) {
    out.push(...leaningBook(x + room * 0.36, y2 - 0.075, y2 - 0.016, z, 0.024, room * 0.82, 0.38, SPINES[(seed * 3) % SPINES.length]));
  } else if (kind === 3) {
    out.push(...greekUrn(x + rest / 2, y2 - 0.045, z, room * 0.8));
  }
  return out;
}

/** A tall bookcase against the right-hand wall (y = 0), from x to x + w,
 *  d deep and h to its top: a plinth, `cols` × `rows` bays of books seen
 *  into their depth, a front frame of stiles carved as pilasters with
 *  gilt capitals, a panelled side, and a two-step cornice with a gilt
 *  astragal and a crest. */
export function bookcase(x: number, w: number, h: number, d = 0.13, cols = 2, rows = 4, tones: Tones = WARM_MAHOGANY): Shape[] {
  const X = x + w;
  const base = 0.05;
  const stile = 0.024;
  const rail = 0.02;
  const top = h - 0.03;
  const colW = (w - 2 * stile - (cols - 1) * rail) / cols;
  const rowH = (top - base - rail - (rows - 1) * rail) / rows;
  const back = 0.006;
  const shapes: Shape[] = [
    shadow(x - 0.01, 0, w + 0.02, d + 0.02),
    // the back of the case, dark between the shelves
    gradPoly([[x, back, base], [X, back, base], [X, back, top], [x, back, top]], [tone(tones[2], -0.35), tone(tones[2], -0.55)], [x, back, top], [x, back, base]),
  ];
  for (let r = 0; r < rows; r++) {
    const z1 = base + rail + r * (rowH + rail);
    for (let c = 0; c < cols; c++) {
      const c1 = x + stile + c * (colW + rail);
      const c2 = c1 + colW;
      shapes.push(
        // the shelf's floor and the bay's left side, in shadow
        poly([[c1, back, z1], [c2, back, z1], [c2, d, z1], [c1, d, z1]], tone(tones[0], -0.25)),
        poly([[c1, back, z1], [c1, d, z1], [c1, d, z1 + rowH], [c1, back, z1 + rowH]], tone(tones[1], -0.3)),
        ...shelfOfBooks(c1, c2, d, z1, rowH - 0.018, r * cols + c + 3),
      );
    }
  }
  // the front frame: stiles and rails
  const front = (u1: number, u2: number, z1: number, z2: number) =>
    gradPoly([[u1, d, z1], [u2, d, z1], [u2, d, z2], [u1, d, z2]], [tone(tones[1], 0.14), tones[1], tone(tones[1], -0.16)], [u1, d, z2], [u2, d, z1], inkOfWood(tones), 0.5);
  shapes.push(front(x, X, 0, base + rail));
  for (let r = 1; r < rows; r++) {
    const z = base + rail + r * (rowH + rail) - rail;
    shapes.push(front(x, X, z, z + rail), { ...line([[x + stile, d, z + rail - 0.003], [X - stile, d, z + rail - 0.003]], "#FFFFFF", 0.4), opacity: 0.3 });
  }
  shapes.push(front(x, X, top, h));
  for (let c = 0; c <= cols; c++) {
    const u1 = c === 0 ? x : c === cols ? X - stile : x + stile + c * (colW + rail) - rail;
    const sw = c === 0 || c === cols ? stile : rail;
    shapes.push(
      front(u1, u1 + sw, 0, h),
      // a pilaster: a fluted strip between a gilt base and capital
      { ...line([[u1 + sw * 0.5, d + 0.001, base + 0.02], [u1 + sw * 0.5, d + 0.001, top - 0.024]], tone(tones[2], -0.35), 0.5), opacity: 0.8 },
      { ...line([[u1 + sw * 0.25, d + 0.001, base + 0.02], [u1 + sw * 0.25, d + 0.001, top - 0.024]], tone(tones[0], 0.25), 0.4), opacity: 0.6 },
      gradPoly([[u1 - 0.002, d + 0.002, base], [u1 + sw + 0.002, d + 0.002, base], [u1 + sw + 0.002, d + 0.002, base + 0.016], [u1 - 0.002, d + 0.002, base + 0.016]], GILT, [u1, d, base + 0.016], [u1 + sw, d, base], WARM_INK, 0.4),
      gradPoly([[u1 - 0.004, d + 0.002, top - 0.024], [u1 + sw + 0.004, d + 0.002, top - 0.024], [u1 + sw + 0.006, d + 0.002, top - 0.002], [u1 - 0.006, d + 0.002, top - 0.002]], GILT, [u1, d, top], [u1 + sw, d, top - 0.024], WARM_INK, 0.4),
    );
  }
  // the plinth and the side, panelled
  shapes.push(
    ...box(x - 0.008, d - 0.004, 0, w + 0.016, 0.014, base - 0.008, tones.map((t) => tone(t, -0.12)) as Tones),
    gradPoly([[X, 0, 0], [X, d, 0], [X, d, h], [X, 0, h]], [tone(tones[2], 0.06), tones[2], tone(tones[2], -0.25)], [X, 0, h], [X, d, 0], inkOfWood(tones), 0.55),
    ...panel("shade", X, 0.018, d - 0.018, base + 0.02, h * 0.45, tones[2]),
    ...panel("shade", X, 0.018, d - 0.018, h * 0.45 + 0.02, top - 0.02, tones[2]),
    // the cornice: a frieze, a gilt astragal, the crown moulding
    ...box(x - 0.01, 0, h, w + 0.02, d + 0.012, 0.022, tones),
    ...box(x - 0.012, 0, h + 0.022, w + 0.024, d + 0.016, 0.006, GILT_TONES),
    ...box(x - 0.024, 0, h + 0.028, w + 0.048, d + 0.03, 0.026, tones),
  );
  // dentils under the crown
  shapes.push({ ...line([[x + 0.004, d + 0.012, h + 0.011], [X - 0.004, d + 0.012, h + 0.011]], tone(tones[1], -0.35), 1.1), dash: "1.1 1.1" });
  // a gilt crest: a shell between two scrolls, on the cornice
  const [cx, cy] = P(x + w / 2, d * 0.6, h + 0.054);
  const sr = 0.034 * unit();
  shapes.push(
    {
      d: `M${n(cx - sr * 1.6)} ${n(cy)} Q${n(cx - sr * 1.5)} ${n(cy - sr * 0.7)} ${n(cx - sr * 0.9)} ${n(cy - sr * 0.4)} A${n(sr)} ${n(sr * 1.1)} 0 0 1 ${n(cx + sr * 0.9)} ${n(cy - sr * 0.4)} Q${n(cx + sr * 1.5)} ${n(cy - sr * 0.7)} ${n(cx + sr * 1.6)} ${n(cy)} Z`,
      fill: GILT[1],
      grad: { colors: GILT, from: [cx - sr, cy - sr * 1.2], to: [cx + sr, cy] },
      stroke: WARM_INK,
      strokeWidth: 0.45,
    },
    {
      d: [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => {
        const a = Math.PI + Math.PI * f;
        return `M${n(cx)} ${n(cy)} L${n(cx + Math.cos(a) * sr * 0.9)} ${n(cy - sr * 0.4 + Math.sin(a) * sr * 0.9)}`;
      }).join(" "),
      stroke: GILT[2],
      strokeWidth: 0.4,
    },
    ball([x + w / 2, d * 0.6, h + 0.06], 0.6, "#2E7AE0", "#0A2A6A"),
  );
  return shapes;
}

const inkOfWood = (tones: Tones) => tone(tones[2], -0.55);

/** A library ladder leaning on a bookcase on the right-hand wall: its
 *  feet at (x, foot) on the floor, its top hooked over a brass rail at
 *  height top, `w` wide. */
export function libraryLadder(x: number, w: number, foot: number, top: number, against: number, tones: Tones = WARM_MAHOGANY): Shape[] {
  const rail = (u: number): V3[] => [[u, foot, 0], [u, against, top]];
  const rungs = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 0.7) / 6.4;
    const yy = foot + (against - foot) * t;
    const zz = top * t;
    return path([P(x, yy, zz), P(x + w, yy, zz)], false);
  }).join(" ");
  return [
    { ...line([[x - 0.02, against, top + 0.01], [x + w + 0.02, against, top + 0.01]], BRASS[1], 1.1) },
    { d: rungs, stroke: tone(tones[2], -0.4), strokeWidth: 1.6 },
    { d: rungs, stroke: tones[0], strokeWidth: 0.8 },
    line(rail(x), tone(tones[2], -0.45), 2.2),
    line(rail(x), tones[0], 1.2),
    line(rail(x + w), tone(tones[2], -0.45), 2.2),
    line(rail(x + w), tones[1], 1.2),
    ball([x, foot, 0.006], 0.55, BRASS[1], BRASS[2]),
    ball([x + w, foot, 0.006], 0.55, BRASS[1], BRASS[2]),
  ];
}

// ── for the table ───────────────────────────────────────────────────

/** A sideboard against a left-hand wall (x = 0) at (x, y), w × d, its top
 *  at h, facing +x: turned feet,
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
    ...turned([mid, Y - 0.006, pz + 0.058], [[0.006, 0], [0.013, 0.01], [0.012, 0.02], [0.005, 0.028], [0.007, 0.034]], GILT_SHEEN),
  );
  return shapes;
}

/** A brass escutcheon with its keyhole, on a face. */
function filledKeyhole(at: V3): Shape[] {
  return [roundel("y", at, 0.008, [BRASS[0], BRASS[1], BRASS[2]], BRASS[2]), roundel("y", [at[0], at[1] + 0.0005, at[2] + 0.001], 0.0025, ["#000000", "#140C08", "#000000"])];
}

/** A plate rack on a right-hand wall (y = 0): a shelf on carved
 *  brackets with a rail, and blue-and-white plates standing on it. */
export function plateRack(x1: number, x2: number, z: number, plates = 3): Shape[] {
  const at = wallPoint("y", 0.012);
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

/** A Welsh dresser against the right-hand wall (y = 0) from x to x + w,
 *  a candle (lit in `accent`) on its worktop:
 *  a cupboard of drawers and doors, and a rack of shelves above it with
 *  blue-and-white plates, jugs and mugs, under a scalloped cornice. */
export function dresser(x: number, w: number, accent: string): Shape[] {
  const X = x + w;
  const d = 0.13;
  const base = 0.24;
  const rd = 0.055;
  const top = 0.62;
  const shelves = [0.335, 0.43, 0.525];
  const shapes: Shape[] = [
    ...cabinet(x, 0, w, d, base, { tones: OAK, doors: 2, drawers: 3 }),
    // the rack's back board
    shaded([[x + 0.01, 0.003, base], [X - 0.01, 0.003, base], [X - 0.01, 0.003, top], [x + 0.01, 0.003, top]], tone(OAK[2], -0.25), [x, 0, top], [X, 0, base], 0.1, 0.25),
    // on the worktop: a platter on edge, a crock, a jug
    ...chinaPlate(x + 0.07, 0.03, base + 0.05, 0.048),
    ...turned([x + 0.15, 0.06, base], [[0.026, 0], [0.032, 0.02], [0.03, 0.05], [0.024, 0.06]], GLAZE, "#2A1408"),
    ...turned([x + 0.15, 0.06, base + 0.06], [[0.026, 0], [0.018, 0.008], [0.006, 0.012], [0.008, 0.02]], GLAZE),
    ...turnedCandlestick(X - 0.05, 0.07, base, accent, 0.04, 0.05),
  ];
  shelves.forEach((z, i) => {
    shapes.push(...box(x + 0.008, 0, z, w - 0.016, rd, 0.012, OAK));
    if (i === 0) {
      // mugs and jugs
      const pieces: [number, number, string[], string?][] = [
        [0.05, 0.06, CREAM, DELFT],
        [0.105, 0.045, COPPER],
        [0.155, 0.065, CREAM, DELFT],
        [0.21, 0.045, GLAZE],
      ];
      for (const [u, h, colors, band] of pieces) shapes.push(...jug(x + u, 0.03, z + 0.012, h, colors, band));
    } else {
      const r = i === 1 ? 0.036 : 0.04;
      for (let k = 0; k < 3; k++) shapes.push(...chinaPlate(x + w * (0.2 + k * 0.3), 0.02, z + 0.012 + r, r));
      shapes.push(line([[x + 0.01, rd - 0.004, z + 0.03], [X - 0.01, rd - 0.004, z + 0.03]], OAK[0], 0.9));
    }
  });
  // the sides and the cornice with its scalloped valance
  shapes.push(
    ...box(x, 0, base, 0.016, rd, top - base, OAK),
    ...box(X - 0.016, 0, base, 0.016, rd, top - base, OAK),
    ...box(x - 0.01, 0, top, w + 0.02, rd + 0.016, 0.028, OAK),
  );
  const val: V3[] = [[x, rd + 0.017, top]];
  for (let i = 0; i <= 12; i++) {
    const u = x + (w * i) / 12;
    val.push([u, rd + 0.017, top - (i % 2 ? 0.022 : 0.008)]);
  }
  val.push([X, rd + 0.017, top]);
  shapes.push(shaded(val, OAK[1], [x, rd, top], [X, rd, top - 0.02]));
  return shapes;
}

/** A glass display case at (x, y), w × d, on a stand `standH` high under
 *  glass `glassH` tall: tapered legs, an apron with a gilt
 *  bead, a moulded base, what `inside` draws, then the glass over it
 *  (tinted, with brass edges and a glare). */
export function vitrine(x: number, y: number, w: number, d: number, standH: number, glassH: number, inside: () => Shape[], tones: Tones = WARM_MAHOGANY): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.022;
  const g0 = standH + 0.02;
  const g1 = g0 + glassH;
  const e = 0.004;
  const glass = (pts: V3[], opacity: number, from: V3, to: V3): Shape => ({
    d: path(pts.map((p) => P(...p))),
    fill: INK.glass,
    grad: { colors: ["#D8E6FF", INK.glass, "#5A7AC0"], from: P(...from), to: P(...to) },
    opacity,
  });
  return [
    shadow(x, y, w, d),
    ...box(x + 0.012, y + 0.012, 0, leg, leg, standH - 0.04, tones),
    ...box(X - 0.012 - leg, y + 0.012, 0, leg, leg, standH - 0.04, tones),
    ...box(x + 0.012, Y - 0.012 - leg, 0, leg, leg, standH - 0.04, tones),
    ...box(X - 0.012 - leg, Y - 0.012 - leg, 0, leg, leg, standH - 0.04, tones),
    ...[[x + 0.012, Y - 0.012 - leg], [X - 0.012 - leg, Y - 0.012 - leg], [X - 0.012 - leg, y + 0.012]].flatMap(([lx, ly]) =>
      box(lx - 0.002, ly - 0.002, 0, leg + 0.004, leg + 0.004, 0.014, [GILT[0], GILT[1], GILT[2]]),
    ),
    ...box(x, y, standH - 0.04, w, d, 0.04, tones),
    ...panel("lit", Y, x + 0.02, X - 0.02, standH - 0.032, standH - 0.008, tones[1]),
    ball([(x + X) / 2, Y, standH - 0.02], 0.6, BRASS[1], BRASS[2]),
    { ...line([[x, Y, standH - 0.038], [X, Y, standH - 0.038], [X, y, standH - 0.038]], GILT[1], 0.7) },
    ...box(x - 0.008, y - 0.008, standH, w + 0.016, d + 0.016, 0.02, tones),
    { ...line([[x - 0.008, Y + 0.008, standH + 0.02], [X + 0.008, Y + 0.008, standH + 0.02], [X + 0.008, y - 0.008, standH + 0.02]], GILT[0], 0.6), opacity: 0.9 },
    // the far edges of the glass, seen through it
    { ...line([[x + e, y + e, g0], [x + e, y + e, g1], [X - e, y + e, g1]], BRASS[1], 0.5), opacity: 0.6 },
    { ...line([[x + e, y + e, g1], [x + e, Y - e, g1]], BRASS[1], 0.5), opacity: 0.6 },
    ...inside(),
    glass([[X - e, y + e, g0], [X - e, Y - e, g0], [X - e, Y - e, g1], [X - e, y + e, g1]], 0.2, [X, y, g1], [X, Y, g0]),
    glass([[x + e, Y - e, g0], [X - e, Y - e, g0], [X - e, Y - e, g1], [x + e, Y - e, g1]], 0.16, [x, Y, g1], [X, Y, g0]),
    glass([[x + e, y + e, g1], [X - e, y + e, g1], [X - e, Y - e, g1], [x + e, Y - e, g1]], 0.28, [x, y, g1], [X, Y, g1]),
    // glare across the front pane
    { ...line([[x + w * 0.2, Y - e, g0 + glassH * 0.25], [x + w * 0.42, Y - e, g1 - glassH * 0.08]], "#FFFFFF", 0.9), opacity: 0.45 },
    { ...line([[x + w * 0.3, Y - e, g0 + glassH * 0.15], [x + w * 0.46, Y - e, g0 + glassH * 0.62]], "#FFFFFF", 0.5), opacity: 0.35 },
    // brass edges
    line([[x + e, Y - e, g0], [x + e, Y - e, g1], [X - e, Y - e, g1], [X - e, y + e, g1], [x + e, y + e, g1], [x + e, Y - e, g1]], BRASS[1], 0.6),
    line([[X - e, Y - e, g0], [X - e, Y - e, g1]], BRASS[1], 0.6),
    line([[X - e, y + e, g0], [X - e, y + e, g1]], BRASS[2], 0.6),
    ...[[x + e, Y - e], [X - e, Y - e], [X - e, y + e], [x + e, y + e]].map(([px, py]) => ball([px, py, g1 + 0.004], 0.38, BRASS[1], BRASS[2])),
  ];
}

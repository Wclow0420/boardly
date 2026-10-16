// Seal the Manor's study: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// The pieces exported here (bookcase, pedestalDesk, globe, wingChair,
// rug, drapes, candlestick, inkwell, decanter, tripodTable, ledger) are
// generic and can move to furniture.ts when another room wants them.
// Frames, sconces, the quill and the materials come from the gallery.

import {
  INK,
  P,
  ball,
  box,
  cylinder,
  flame,
  flat,
  lightPool,
  line,
  moon,
  n,
  path,
  poly,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { planks, prop, shadow, shell, windowOn } from "@/components/iso/room";
import { BRASS, panel } from "@/components/iso/furniture";
import {
  GILT,
  MAHOGANY,
  PAGES,
  VELVET,
  brassSconce,
  gradPoly,
  ornateFrame,
  quill,
  urn,
  bust,
  type Canvas,
} from "./gallery";

const WARM = "#3A2408";
const GOLD_T: Tones = [GILT[0], GILT[1], GILT[2]];
/** Book cloth and leather for spines. */
const SPINES = ["#8E2433", "#2F5A45", "#2A3E6E", "#6A3A1E", "#B4683C", "#4A2A4A", "#7A6A2A", "#8E3B3F", "#24485A"];

/** A repeatable scatter: the same numbers every time it's drawn. */
const rnd = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ── books and the bookcase ──────────────────────────────────────────

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
    out.push(...urn(x + rest / 2, y2 - 0.045, z, room * 0.8));
  }
  return out;
}

/** A tall bookcase against the right-hand wall (y = 0), from x to x + w,
 *  d deep and h to its top: a plinth, `cols` × `rows` bays of books seen
 *  into their depth, a front frame of stiles carved as pilasters with
 *  gilt capitals, a panelled side, and a two-step cornice with a gilt
 *  astragal and a crest. */
export function bookcase(x: number, w: number, h: number, d = 0.13, cols = 2, rows = 4, tones: Tones = MAHOGANY): Shape[] {
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
      gradPoly([[u1 - 0.002, d + 0.002, base], [u1 + sw + 0.002, d + 0.002, base], [u1 + sw + 0.002, d + 0.002, base + 0.016], [u1 - 0.002, d + 0.002, base + 0.016]], GILT, [u1, d, base + 0.016], [u1 + sw, d, base], WARM, 0.4),
      gradPoly([[u1 - 0.004, d + 0.002, top - 0.024], [u1 + sw + 0.004, d + 0.002, top - 0.024], [u1 + sw + 0.006, d + 0.002, top - 0.002], [u1 - 0.006, d + 0.002, top - 0.002]], GILT, [u1, d, top], [u1 + sw, d, top - 0.024], WARM, 0.4),
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
    ...box(x - 0.012, 0, h + 0.022, w + 0.024, d + 0.016, 0.006, GOLD_T),
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
      stroke: WARM,
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

// ── the desk and what's on it ───────────────────────────────────────

/** A pedestal desk whose drawers face +y: two pedestals of three drawers
 *  with brass bail pulls, a kneehole with a modesty panel, a drawer over
 *  it, and a moulded top with a gilt-tooled leather inset. Its top is
 *  at h. */
export function pedestalDesk(x: number, y: number, w: number, d: number, h: number, tones: Tones = MAHOGANY, leather = "#2F5A45"): Shape[] {
  const X = x + w;
  const Y = y + d;
  const slab = 0.026;
  const body = h - slab;
  const ped = w * 0.3;
  const plinth = 0.02;
  const pull = (u: number, z: number): Shape[] => [
    {
      d: (() => {
        const [a, b] = P(u - 0.011, Y + 0.002, z);
        const [c, e] = P(u + 0.011, Y + 0.002, z);
        return `M${n(a)} ${n(b - 0.6)} L${n(a)} ${n(b)} Q${n((a + c) / 2)} ${n((b + e) / 2 + 1.5)} ${n(c)} ${n(e)} L${n(c)} ${n(e - 0.6)}`;
      })(),
      stroke: BRASS[1],
      strokeWidth: 0.8,
    },
  ];
  const pedestal = (px: number): Shape[] => {
    const out: Shape[] = [
      ...box(px - 0.004, y - 0.004, 0, ped + 0.008, d + 0.008, plinth, tones.map((t) => tone(t, -0.15)) as Tones),
      ...box(px, y, plinth, ped, d, body - plinth - 0.004, tones),
      ...panel("shade", px + ped, y + 0.02, Y - 0.02, plinth + 0.02, body - 0.03, tones[2]),
    ];
    const dh = (body - plinth - 0.02) / 3;
    for (let i = 0; i < 3; i++) {
      const z1 = plinth + 0.008 + i * dh;
      out.push(...panel("lit", Y, px + 0.012, px + ped - 0.012, z1 + 0.006, z1 + dh - 0.006, tones[1]), ...pull(px + ped / 2, z1 + dh * 0.55));
    }
    return out;
  };
  return [
    shadow(x - 0.01, y, w + 0.02, d + 0.02),
    // the modesty panel at the back of the kneehole
    ...box(x + ped, y + 0.01, plinth, w - 2 * ped, 0.02, body - plinth, tones.map((t) => tone(t, -0.2)) as Tones),
    ...pedestal(x),
    ...pedestal(X - ped),
    // the drawer over the kneehole
    ...box(x + ped, y, body - 0.05, w - 2 * ped, d, 0.046, tones),
    ...panel("lit", Y, x + ped + 0.012, X - ped - 0.012, body - 0.044, body - 0.01, tones[1]),
    ...pull(x + w / 2, body - 0.026),
    // the top: moulded, its edge gilt, a leather inset tooled in gold
    ...box(x - 0.014, y - 0.014, body, w + 0.028, d + 0.028, slab, tones),
    line([[x - 0.014, Y + 0.014, body + 0.008], [X + 0.014, Y + 0.014, body + 0.008], [X + 0.014, y - 0.014, body + 0.008]], GILT[1], 0.55),
    gradPoly(
      [[x + 0.012, y + 0.012, h + 0.0005], [X - 0.012, y + 0.012, h + 0.0005], [X - 0.012, Y - 0.012, h + 0.0005], [x + 0.012, Y - 0.012, h + 0.0005]],
      [tone(leather, 0.22), leather, tone(leather, -0.28)],
      [x, y, h],
      [X, Y, h],
      tone(leather, -0.55),
      0.45,
    ),
    { d: path(([[x + 0.022, y + 0.022], [X - 0.022, y + 0.022], [X - 0.022, Y - 0.022], [x + 0.022, Y - 0.022]] as [number, number][]).map(([a, b]) => P(a, b, h + 0.001))), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.85 },
  ];
}

/** A brass candlestick standing at (x, y, z): a round foot, a turned
 *  stem, a drip pan, the candle and its flame. */
export function candlestick(x: number, y: number, z: number, accent: string, stem = 0.05, wax = 0.07): Shape[] {
  return [
    ...cylinder(x, y, z, 0.024, 0.008, BRASS),
    ...cylinder(x, y, z + 0.008, 0.012, 0.008, BRASS),
    ...cylinder(x, y, z + 0.016, 0.006, stem, BRASS),
    ...cylinder(x, y, z + 0.016 + stem * 0.45, 0.01, 0.008, BRASS),
    ...cylinder(x, y, z + 0.016 + stem, 0.016, 0.006, BRASS),
    ...box(x - 0.011, y - 0.011, z + 0.022 + stem, 0.022, 0.022, wax, PAGES),
    ...flame([x, y, z + 0.022 + stem + wax], 2.2, accent),
  ];
}

/** An inkwell at (x, y, z): a brass tray with a pen groove, a cut-glass
 *  well of ink under a hinged brass lid, thrown open. */
export function inkwell(x: number, y: number, z: number): Shape[] {
  return [
    ...box(x - 0.03, y - 0.024, z, 0.06, 0.048, 0.006, BRASS),
    line([[x - 0.024, y + 0.016, z + 0.006], [x + 0.024, y + 0.016, z + 0.006]], BRASS[2], 0.6),
    ...cylinder(x - 0.006, y - 0.004, z + 0.006, 0.014, 0.02, ["#3A4A7A", "#1E2A4E", "#0E1630"]),
    { ...ball([x - 0.012, y - 0.004, z + 0.018], 0.3, "#FFFFFF"), opacity: 0.6 },
    ...cylinder(x - 0.006, y - 0.004, z + 0.026, 0.008, 0.004, BRASS),
    gradPoly([[x - 0.014, y - 0.018, z + 0.03], [x + 0.002, y - 0.018, z + 0.03], [x + 0.002, y - 0.022, z + 0.046], [x - 0.014, y - 0.022, z + 0.046]], [BRASS[0], BRASS[1], BRASS[2]], [x - 0.014, y, z + 0.046], [x, y, z + 0.03], tone(BRASS[2], -0.5), 0.4),
  ];
}

/** An open ledger lying at z, its spine along y down the middle of
 *  x..x+w: red leather boards, two blocks of pages curving up to the
 *  gutter, columns of figures and a silk ribbon. */
export function ledger(x: number, y: number, z: number, w: number, d: number): Shape[] {
  const mid = x + w / 2;
  const top = z + 0.012;
  const shapes: Shape[] = [
    ...box(x, y, z, w, d, 0.005, VELVET),
    ...box(x + 0.004, y + 0.005, z + 0.005, w / 2 - 0.005, d - 0.01, 0.007, PAGES),
    ...box(mid + 0.001, y + 0.005, z + 0.005, w / 2 - 0.005, d - 0.01, 0.007, PAGES),
    // the pages lift toward the gutter
    { ...flat(mid - 0.02, mid, y + 0.005, y + d - 0.005, top, "#000000"), stroke: undefined, opacity: 0.1 },
    line([[mid, y + 0.005, top], [mid, y + d - 0.005, top]], "#A89A7A", 0.6),
  ];
  for (const [u1, u2] of [[x + 0.012, mid - 0.01], [mid + 0.01, x + w - 0.012]]) {
    shapes.push(line([[u1, y + 0.018, top], [u2, y + 0.018, top]], "#8E2433", 0.45));
    for (const f of [0.32, 0.46, 0.6, 0.74]) {
      shapes.push(line([[u1, y + d * f, top], [u1 + (u2 - u1) * 0.55, y + d * f, top]], "#7A6E58", 0.35));
      shapes.push(line([[u1 + (u2 - u1) * 0.7, y + d * f, top], [u2, y + d * f, top]], "#7A6E58", 0.35));
    }
  }
  shapes.push(line([[mid + 0.003, y + d * 0.2, top], [mid + 0.006, y + d - 0.004, top], [mid + 0.01, y + d + 0.002, z - 0.03]], "#C2203A", 0.9));
  return shapes;
}

// ── the globe ───────────────────────────────────────────────────────

/** A library globe at (x, y): three splayed legs on a turned column, a
 *  brass horizon ring round its middle, a meridian ring tilted through
 *  its poles, and the sphere — seas and lands, lit from the upper left.
 *  `r` is the sphere's radius, `h` its centre's height. */
export function globe(x: number, y: number, r = 0.065, h = 0.3, tones: Tones = MAHOGANY): Shape[] {
  const [cx, cy] = P(x, y, h);
  const R = r * unit();
  const hr = R * 1.25;
  const tilt = (-23 * Math.PI) / 180;
  const meridian = (from: number, to: number) => {
    const pts = ring(0, 0, R * 1.14 * 0.4, R * 1.14, 16, from, to).map(([px, py]) => [cx + px * Math.cos(tilt) - py * Math.sin(tilt), cy + px * Math.sin(tilt) + py * Math.cos(tilt)] as Pt);
    return pathOf(pts, false);
  };
  const legs = [0, 1, 2].map((i) => {
    const a = Math.PI / 4 + Math.PI / 6 + (i * 2 * Math.PI) / 3;
    return { foot: [x + Math.cos(a) * 0.075, y + Math.sin(a) * 0.075, 0] as V3, a };
  });
  const leg = (foot: V3): Shape[] => [
    line([[x, y, 0.1], [(x + foot[0]) / 2, (y + foot[1]) / 2, 0.05], foot], tone(tones[2], -0.4), 2.2),
    line([[x, y, 0.1], [(x + foot[0]) / 2, (y + foot[1]) / 2, 0.05], foot], tones[0], 1.2),
    ball(foot, 0.6, BRASS[1], BRASS[2]),
  ];
  const back = legs.filter((l) => Math.cos(l.a - Math.PI / 4) < 0);
  const near = legs.filter((l) => Math.cos(l.a - Math.PI / 4) >= 0);
  const land = (pts: [number, number][]) => pathOf(pts.map(([u, v]) => [cx + u * R, cy + v * R] as Pt));
  return [
    { ...shadow(x - 0.07, y - 0.06, 0.12, 0.12) },
    ...back.flatMap((l) => leg(l.foot)),
    ...cylinder(x, y, 0.05, 0.016, 0.07, tones),
    ...cylinder(x, y, 0.11, 0.024, 0.016, tones),
    ...cylinder(x, y, 0.126, 0.01, h - r - 0.14, tones),
    ...cylinder(x, y, h - r - 0.02, 0.02, 0.012, BRASS),
    ...near.flatMap((l) => leg(l.foot)),
    // the back halves of the rings
    { d: meridian(Math.PI * 0.5, Math.PI * 1.5), stroke: BRASS[2], strokeWidth: 1.2 },
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 1 ${n(cx + hr)} ${n(cy)}`, stroke: BRASS[2], strokeWidth: 1.6 },
    // the sphere: sea, lands, a line of latitude
    {
      d: pathOf(ring(cx, cy, R, R, 24)),
      fill: "#2E6A9A",
      grad: { colors: ["#8AC0E8", "#2E6A9A", "#0E2A4A"], from: [cx - R * 0.4, cy - R * 0.45], radius: R * 1.6 },
      stroke: "#0A1A30",
      strokeWidth: 0.5,
    },
    {
      d: [
        land([[-0.7, -0.5], [-0.3, -0.75], [0.05, -0.6], [-0.05, -0.3], [-0.35, -0.1], [-0.3, 0.25], [-0.55, 0.4], [-0.8, 0.0]]),
        land([[0.2, -0.2], [0.55, -0.45], [0.8, -0.2], [0.7, 0.2], [0.45, 0.6], [0.25, 0.35], [0.3, 0.05]]),
        land([[-0.15, 0.55], [0.1, 0.5], [0.05, 0.8], [-0.2, 0.78]]),
      ].join(" "),
      fill: "#C8B47A",
      grad: { colors: ["#F2E2A8", "#C8B47A", "#6A5A2A"], from: [cx - R * 0.4, cy - R * 0.45], radius: R * 1.6 },
      stroke: "#5A4A1E",
      strokeWidth: 0.35,
    },
    { d: `M${n(cx - R)} ${n(cy)} A${n(R)} ${n(R * 0.3)} 0 0 0 ${n(cx + R)} ${n(cy)}`, stroke: "#D8E6FF", strokeWidth: 0.35, opacity: 0.5 },
    { d: `M${n(cx - R * 0.72)} ${n(cy - R * 0.3)} A${n(R * 0.8)} ${n(R * 0.8)} 0 0 1 ${n(cx - R * 0.1)} ${n(cy - R * 0.82)}`, stroke: "#FFFFFF", strokeWidth: 0.7, opacity: 0.6 },
    // the front halves of the rings, the pole pins
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx + hr)} ${n(cy)}`, stroke: tone(BRASS[2], -0.4), strokeWidth: 2.2 },
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx + hr)} ${n(cy)}`, stroke: BRASS[1], strokeWidth: 1.4 },
    { d: `M${n(cx - hr * 0.9)} ${n(cy + hr * 0.12)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx)} ${n(cy + hr * 0.42)}`, stroke: BRASS[0], strokeWidth: 0.45, opacity: 0.8 },
    { d: meridian(-Math.PI * 0.5, Math.PI * 0.5), stroke: tone(BRASS[2], -0.4), strokeWidth: 1.8 },
    { d: meridian(-Math.PI * 0.5, Math.PI * 0.5), stroke: BRASS[1], strokeWidth: 1.0 },
    ...[1, -1].map((s) => {
      const py = s * R * 1.14;
      return { d: pathOf(ring(cx - py * Math.sin(tilt), cy + py * Math.cos(tilt), 1.1, 1.1, 8)), fill: BRASS[0], stroke: BRASS[2], strokeWidth: 0.4 } as Shape;
    }),
  ];
}

const ring = (cx: number, cy: number, rx: number, ry: number, steps = 14, from = 0, to = Math.PI * 2): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });
const pathOf = (pts: Pt[], close = true) =>
  pts.map(([px, py], i) => `${i ? "L" : "M"}${n(px)} ${n(py)}`).join(" ") + (close ? " Z" : "");

// ── the reading corner ──────────────────────────────────────────────

/** A wingback armchair facing +y, its back along y: turned legs on brass
 *  castors, a tufted back with wings, rolled arms with a scroll at the
 *  front, a loose seat cushion, and brass nailheads along the skirt. */
export function wingChair(x: number, y: number, w: number, d: number, cloth: Tones = VELVET, wood: Tones = MAHOGANY): Shape[] {
  const X = x + w;
  const Y = y + d;
  const legH = 0.04;
  const seat = 0.14;
  const armW = 0.045;
  const backD = 0.05;
  const backH = 0.42;
  const darker = cloth.map((c) => tone(c, -0.1)) as Tones;
  const tufts: Shape[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const u = x + armW + 0.025 + ((w - 2 * armW - 0.05) * (j + (i % 2) * 0.5)) / 2.5;
      if (u > X - armW - 0.015) continue;
      const zt = seat + 0.07 + i * 0.07;
      tufts.push(
        { ...line([[u - 0.025, y + backD, zt - 0.035], [u, y + backD, zt], [u + 0.025, y + backD, zt - 0.035]], cloth[2], 0.45), opacity: 0.7 },
        ball([u, y + backD, zt], 0.34, tone(cloth[2], -0.3)),
      );
    }
  }
  // a wing in profile: up from the arm, out to the front, back to the crest
  const wingAt = (yy: number, zz: number): [number, number] => [yy, zz];
  const profile = [
    wingAt(y + backD * 0.5, backH - 0.01),
    wingAt(y + backD + 0.035, backH - 0.025),
    wingAt(y + backD + 0.075, backH - 0.07),
    wingAt(y + backD + 0.095, seat + 0.13),
    wingAt(y + backD + 0.085, seat + 0.05),
  ];
  const wing = (xa: number, xb: number, faceTone: string): Shape[] => {
    const edge = [...profile.map(([py, pz]) => [xa, py, pz] as V3), ...profile.map(([py, pz]) => [xb, py, pz] as V3).reverse()];
    const face: V3[] = [[xb, y + backD * 0.5, seat + 0.05], ...profile.map(([py, pz]) => [xb, py, pz] as V3)];
    return [
      gradPoly(edge, [tone(cloth[0], 0.2), cloth[0]], [xa, y, backH], [xb, Y, seat], tone(cloth[2], -0.5), 0.5),
      gradPoly(face, [tone(faceTone, 0.12), faceTone, tone(faceTone, -0.2)], [xb, y, backH], [xb, Y, seat], tone(cloth[2], -0.5), 0.5),
      { ...line(profile.slice(1, 4).map(([py, pz]) => [xb, py - 0.008, pz - 0.012] as V3), tone(faceTone, -0.3), 0.4), opacity: 0.6 },
    ];
  };
  const rollFront = (ax: number): Shape[] => {
    const [cx, cy] = P(ax + armW / 2, Y - 0.004, seat + 0.03);
    const r = armW * 0.62 * unit();
    return [
      { d: pathOf(ring(cx, cy, r, r * 1.05, 14)), fill: cloth[1], grad: { colors: [tone(cloth[1], 0.25), cloth[1], cloth[2]], from: [cx - r * 0.4, cy - r * 0.5], radius: r * 1.5 }, stroke: tone(cloth[2], -0.5), strokeWidth: 0.45 },
      { d: `M${n(cx + r * 0.5)} ${n(cy)} A${n(r * 0.5)} ${n(r * 0.5)} 0 1 1 ${n(cx)} ${n(cy - r * 0.5)} A${n(r * 0.3)} ${n(r * 0.3)} 0 1 1 ${n(cx - r * 0.2)} ${n(cy + r * 0.1)}`, stroke: tone(cloth[2], -0.35), strokeWidth: 0.4 },
      ball([ax + armW / 2, Y - 0.002, seat + 0.03], 0.3, GILT[1], WARM),
    ];
  };
  return [
    shadow(x, y, w, d),
    // legs and castors
    ...[[x + 0.012, y + 0.012], [X - 0.034, y + 0.012], [x + 0.012, Y - 0.034], [X - 0.034, Y - 0.034]].flatMap(([lx, ly]) => [
      ...box(lx, ly, 0.008, 0.022, 0.022, legH - 0.008, wood),
      ball([lx + 0.011, ly + 0.011, 0.005], 0.45, BRASS[1], BRASS[2]),
    ]),
    // the back, its crest rising in a curve, buttoned
    ...box(x + armW * 0.6, y, legH, w - armW * 1.2, backD, backH - legH, cloth),
    gradPoly(
      [[x + armW * 0.6, y + backD, backH], [x + w * 0.3, y + backD, backH + 0.03], [x + w * 0.7, y + backD, backH + 0.03], [X - armW * 0.6, y + backD, backH]],
      [tone(cloth[1], 0.2), cloth[1]],
      [x, y + backD, backH + 0.03],
      [X, y + backD, backH],
      tone(cloth[2], -0.5),
      0.5,
    ),
    ...tufts,
    // the far wing and arm, the seat, the cushion, the near wing and arm
    ...wing(x, x + armW * 0.8, cloth[1]),
    ...box(x, y + backD * 0.5, legH, armW, d - backD * 0.5, seat + 0.05 - legH, cloth),
    ...rollFront(x),
    ...box(x + armW, y + backD, legH, w - 2 * armW, d - backD, seat - legH, darker),
    { ...line([[x + armW + 0.006, Y, legH + 0.02], [X - armW - 0.006, Y, legH + 0.02]], GILT[1], 0.9), dash: "0.1 1.9" },
    ...box(x + armW + 0.004, y + backD + 0.004, seat, w - 2 * armW - 0.008, d - backD - 0.01, 0.035, cloth),
    line([[x + armW + 0.004, Y - 0.006, seat + 0.035], [X - armW - 0.004, Y - 0.006, seat + 0.035]], tone(cloth[0], 0.25), 0.5),
    ...wing(X - armW * 0.8, X, cloth[2]),
    ...box(X - armW, y + backD * 0.5, legH, armW, d - backD * 0.5, seat + 0.05 - legH, cloth),
    ...rollFront(X - armW),
    { ...line([[X, y + backD, legH + 0.02], [X, Y - 0.01, legH + 0.02]], GILT[1], 0.9), dash: "0.1 1.9" },
  ];
}

/** A library ladder leaning on a bookcase on the right-hand wall: its
 *  feet at (x, foot) on the floor, its top hooked over a brass rail at
 *  height top, `w` wide. */
export function libraryLadder(x: number, w: number, foot: number, top: number, against: number, tones: Tones = MAHOGANY): Shape[] {
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

/** A round tripod table at (x, y): three splayed feet, a turned column,
 *  a round top at h. */
export function tripodTable(x: number, y: number, r: number, h: number, tones: Tones = MAHOGANY): Shape[] {
  return [
    { ...shadow(x - r, y - r * 0.8, r * 1.6, r * 1.6) },
    ...[0, 1, 2].map((i) => {
      const a = Math.PI / 4 + (i * 2 * Math.PI) / 3 + Math.PI / 3;
      return line([[x, y, 0.06], [x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, 0]], tones[1], 1.6);
    }),
    ...cylinder(x, y, 0.02, 0.012, 0.08, tones),
    ...cylinder(x, y, 0.06, 0.018, 0.02, tones),
    ...cylinder(x, y, 0.08, 0.009, h - 0.095, tones),
    ...cylinder(x, y, h - 0.015, r, 0.015, tones),
    { ...ring1(x, y, h, r * 0.82), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.8 },
  ];
}
const ring1 = (x: number, y: number, z: number, r: number): Shape => {
  const [cx, cy] = P(x, y, z);
  return { d: pathOf(ring(cx, cy, r * unit() * 1.2247, r * unit() * 0.7071, 20)) };
};

/** A cut-glass decanter of wine at (x, y, z), with its stopper. */
export function decanter(x: number, y: number, z: number): Shape[] {
  const [cx] = P(x, y, z);
  const yAt = (h: number) => P(x, y, z + h)[1];
  const k = unit() * 1.2247;
  const prof: [number, number][] = [[0, 0.018], [0.004, 0.022], [0.03, 0.024], [0.045, 0.016], [0.06, 0.007], [0.075, 0.007], [0.078, 0.01]];
  const side = (sign: number) => prof.map(([h, r]) => [cx + sign * r * k, yAt(h)] as Pt);
  const wine = prof.slice(0, 4).map(([h, r]) => [h, r * 0.86] as [number, number]);
  return [
    { d: pathOf([...side(-1), ...side(1).reverse()]), fill: INK.glass, opacity: 0.35, stroke: "#D8E6FF", strokeWidth: 0.4 },
    {
      d: pathOf([...wine.map(([h, r]) => [cx - r * k, yAt(h)] as Pt), ...wine.map(([h, r]) => [cx + r * k, yAt(h)] as Pt).reverse()]),
      fill: "#8E1A2E",
      grad: { colors: ["#E05A6A", "#8E1A2E", "#3A0410"], from: [cx - 0.02 * k, yAt(0.04)], to: [cx + 0.024 * k, yAt(0.01)] },
    },
    { d: `M${n(cx - 0.014 * k)} ${n(yAt(0.036))} L${n(cx - 0.016 * k)} ${n(yAt(0.012))}`, stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.7 },
    ball([x, y, z + 0.088], 0.6, INK.glass, "#D8E6FF"),
  ];
}

/** A rug lying on the floor: a fringe at each end, a dark outer border,
 *  a crimson field inside gilt lines, a band of lozenges, corner
 *  spandrels and a medallion. */
export function rug(x1: number, x2: number, y1: number, y2: number, field = "#8E2433", border = "#1E2A4E"): Shape[] {
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

/** Velvet drapes either side of a window on the right-hand wall (y = 0),
 *  from x1 to x2, under a gilt pelmet at z2, tied back with gold cords. */
export function drapes(x1: number, x2: number, z1: number, z2: number, cloth: Tones = VELVET): Shape[] {
  const span = 0.06;
  const tie = z1 + (z2 - z1) * 0.38;
  const drape = (a: number, dir: number): Shape[] => {
    const inner = a + dir * span;
    const pts: V3[] = [
      [a, 0.006, z2],
      [inner, 0.006, z2],
      [a + dir * span * 0.35, 0.012, tie],
      [a + dir * span * 0.85, 0.01, z1],
      [a, 0.006, z1],
    ];
    const folds = [0.3, 0.6].map((f) =>
      line([[a + dir * span * f, 0.008, z2 - 0.01], [a + dir * span * f * 0.4, 0.012, tie], [a + dir * span * f * 0.9, 0.01, z1 + 0.01]], cloth[2], 0.45),
    );
    return [
      gradPoly(pts, [tone(cloth[0], 0.12), cloth[1], cloth[2]], [a, 0, z2], [inner, 0, z1], tone(cloth[2], -0.5), 0.5),
      ...folds,
      line([[a + dir * span * 0.08, 0.014, tie + 0.01], [a + dir * span * 0.42, 0.014, tie - 0.004]], GILT[1], 1.1),
      ball([a + dir * span * 0.4, 0.016, tie - 0.012], 0.65, GILT[1], WARM),
      line([[a + dir * span * 0.4, 0.016, tie - 0.02], [a + dir * span * 0.4, 0.016, tie - 0.05]], GILT[1], 0.8),
    ];
  };
  return [
    ...drape(x1, 1),
    ...drape(x2, -1),
    // the pelmet: gilt, with a scalloped lower edge
    ...box(x1 - 0.012, 0, z2, x2 - x1 + 0.024, 0.026, 0.032, GOLD_T),
    {
      d: path(
        Array.from({ length: 13 }, (_, i) => {
          const u = x1 - 0.012 + ((x2 - x1 + 0.024) * i) / 12;
          return P(u, 0.026, z2 - (i % 2 ? 0.014 : 0.002));
        }).concat([P(x2 + 0.012, 0.026, z2), P(x1 - 0.012, 0.026, z2)]),
      ),
      fill: GILT[1],
      grad: { colors: GILT, from: P(x1, 0.026, z2), to: P(x1, 0.026, z2 - 0.016) },
      stroke: WARM,
      strokeWidth: 0.4,
    },
  ];
}

/** A sea chart on parchment, with a compass rose. */
const seaChart: Canvas = (at, w, h) => {
  const p = (pts: [number, number][]) => path(pts.map(([s, t]) => P(...at(s, t))));
  const [rx, ry] = P(...at(0.72, 0.32));
  const rr = Math.min(w, h) * 0.18 * unit();
  return [
    { d: p([[0, 0], [1, 0], [1, 1], [0, 1]]), fill: "#E9DCB8", grad: { colors: ["#F6ECCC", "#E2D2A8", "#B89E6A"], from: P(...at(0.2, 0.9)), to: P(...at(1, 0)) } },
    { d: p([[0, 0.5], [0.12, 0.62], [0.3, 0.58], [0.4, 0.8], [0.3, 1], [0, 1]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: p([[0.55, 1], [0.6, 0.82], [0.78, 0.76], [0.9, 0.86], [1, 0.8], [1, 1]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: p([[0.12, 0.12], [0.3, 0.08], [0.36, 0.26], [0.2, 0.3]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: `M${n(rx)} ${n(ry - rr)} L${n(rx + rr * 0.22)} ${n(ry)} L${n(rx)} ${n(ry + rr)} L${n(rx - rr * 0.22)} ${n(ry)} Z M${n(rx - rr)} ${n(ry)} L${n(rx)} ${n(ry - rr * 0.22)} L${n(rx + rr)} ${n(ry)} L${n(rx)} ${n(ry + rr * 0.22)} Z`, fill: "#8E2433", stroke: "#5A1A10", strokeWidth: 0.3 },
    { d: p([[0.1, 0.4], [0.5, 0.45], [0.86, 0.6]]).replace(/ Z$/, ""), stroke: "#8E2433", strokeWidth: 0.4, dash: "1 1" },
  ];
};

// ── the room ────────────────────────────────────────────────────────

export function study(accent: string): Shape[] {
  return [
    ...shell(),
    ...planks(),
    // the rug in the middle of the floor
    ...rug(0.28, 0.62, 0.36, 0.76),
    // the window behind the desk, drapes and pelmet, the moon
    ...windowOn("y", 0.7, 0.9, 0.34, 0.5),
    moon(P(0.84, 0, 0.5)[0], P(0.84, 0, 0.5)[1], 1.8),
    ...drapes(0.64, 0.96, 0.28, 0.65),
    // a sea chart over the globe, a sconce over the armchair
    ...ornateFrame("x", 0.05, 0.27, 0.42, 0.62, seaChart, { crest: false, width: 0.022 }),
    ...brassSconce("x", 0.84, 0.46, accent),
    // the bookcase along the right wall
    ...bookcase(0.18, 0.42, 0.62),
    ...bust(0.29, 0.075, 0.676, 0.11),
    ...urn(0.52, 0.07, 0.676, 0.085, ["#9AB8E8", "#3A5A9A", "#1A2A5A"]),
    ...libraryLadder(0.46, 0.08, 0.34, 0.58, 0.15),
    // the globe in the far corner
    ...globe(0.11, 0.21, 0.062, 0.31),
    // the desk under the window, its books, the ledger, the candle
    ...pedestalDesk(0.65, 0.18, 0.28, 0.22, 0.224),
    ...box(0.652, 0.175, 0.224, 0.072, 0.08, 0.013, [tone(PAGES[1], -0.05), "#2A3E6E", tone("#2A3E6E", -0.38)]),
    ...box(0.658, 0.18, 0.237, 0.06, 0.07, 0.011, [tone(PAGES[1], -0.05), "#6A3A1E", tone("#6A3A1E", -0.38)]),
    ...prop(() => ledger(0.69, 0.23, 0.224, 0.14, 0.14)),
    ...inkwell(0.88, 0.37, 0.224),
    ...quill(P(0.874, 0.366, 0.25)[0], P(0.874, 0.366, 0.25)[1], 0.75, 1),
    ...candlestick(0.895, 0.22, 0.224, accent),
    ...lightPool([0.78, 0.46, 0], 0.4),
    // the reading corner: the armchair, a table with wine
    ...wingChair(0.04, 0.68, 0.22, 0.22),
    ...tripodTable(0.36, 0.84, 0.055, 0.2),
    ...decanter(0.35, 0.83, 0.2),
    ...cylinder(0.38, 0.86, 0.2, 0.01, 0.02, [INK.glass, "#8E1A2E", "#5A0E1A"]),
  ];
}

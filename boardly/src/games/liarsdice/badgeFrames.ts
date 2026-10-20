// Liar's Dice badge frames, one per level, richer at each: the tavern's
// barrel. A ring of wooden staves bound by a metal hoop holds the disc.
// Bronze is a tavern token with a die and two hop sprigs; silver wears a
// hop wreath and ivory pips for studs; gold adds hop cones, two tankards
// clinking over the top, dice on the hoop and a ruby; diamond is a
// platinum hoop on a crystal star, set with gems and crystal dice.

import type { EmblemData } from "@/components/engraved/emblem";
import { mirrorPath } from "@/components/engraved/emblem";
import { INKS, frond, type Material, type Pt } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, arc, at, beads, circle, disc, gem, rays, ring, type Shape } from "@/components/badges/frames/kit";

const FACE = 26;
const f = (n: number) => +n.toFixed(2);

/** Path data (absolute M/L/C/Q/Z only) moved by `fn`, point by point. */
function move(d: string, fn: (p: Pt) => Pt) {
  return d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_, x, y) => {
    const [a, b] = fn([+x, +y]);
    return `${f(a)} ${f(b)}`;
  });
}

/** Local drawing (stalk at 0,0, pointing up) placed at (x, y), turned
 *  `deg` clockwise and scaled by `k`. */
const place = (x: number, y: number, deg: number, k = 1) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return ([px, py]: Pt): Pt => [x + (px * c - py * s) * k, y + (px * s + py * c) * k];
};

const mirror = (parts: EmblemData): EmblemData =>
  parts.map((p) => {
    if ("d" in p)
      return {
        ...p,
        d: mirrorPath(p.d, 120),
        vein: p.vein && mirrorPath(p.vein, 120),
        shine: p.shine && mirrorPath(p.shine, 120),
      };
    if ("line" in p) return { ...p, line: mirrorPath(p.line, 120) };
    if ("dark" in p) return { ...p, dark: mirrorPath(p.dark, 120) };
    return { ...p, x: 120 - p.x };
  });

// ── the barrel ──────────────────────────────────────────────────────

/** Wooden staves in a ring, their seams cut radially. */
function staves(outer: number, inner: number, n: number): Shape {
  const seams = Array.from({ length: n }, (_, i) => {
    const deg = (360 * i) / n + 6;
    const [x0, y0] = at(deg, inner + 0.6);
    const [x1, y1] = at(deg, outer - 0.6);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join("");
  return {
    d: circle(outer) + circle(inner),
    m: "wood",
    evenOdd: true,
    vein: seams,
    vw: 0.8,
    shine: arc(outer - 1.3, -64, -26),
    sw: 0.9,
    ink: 1.1,
  };
}

/** The metal hoop binding the staves, with its rivets. */
function hoop(outer: number, inner: number, m: Material, rivets: number, offset = 0): EmblemData {
  return [ring(outer, inner, m), ...beads((outer + inner) / 2, rivets, 1.15, m, offset, offset + 360)];
}

/** Ivory studs on the hoop, set like a die's pips. */
const studs = (r: number, n: number, offset = 0, size = 1.5): EmblemData =>
  beads(r, n, size, "ivory", offset, offset + 360).map((p) => ({ ...p, ink: 0.7 }));

/** The thin metal lip round the disc. */
const lip = (m: Material): Shape => ({
  d: circle(FACE + 3) + circle(FACE + 0.5),
  m,
  evenOdd: true,
  ink: 0.9,
});

// ── dice ────────────────────────────────────────────────────────────

const PIPS: Record<number, Pt[]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

/** A die seen face-on, `s` wide at (x, y), turned `deg`, showing `face`.
 *  A one is a big red pip; the rest are black (crystal dice: sapphire). */
function die(x: number, y: number, s: number, deg: number, face: number, m: Material = "ivory"): EmblemData {
  const h = s / 2;
  const k = s * 0.22;
  const to = place(x, y, deg);
  const body =
    `M${-h + k} ${-h}L${h - k} ${-h}Q${h} ${-h} ${h} ${-h + k}L${h} ${h - k}Q${h} ${h} ${h - k} ${h}` +
    `L${-h + k} ${h}Q${-h} ${h} ${-h} ${h - k}L${-h} ${-h + k}Q${-h} ${-h} ${-h + k} ${-h}Z`;
  const parts: EmblemData = [
    {
      d: move(body, to),
      m,
      round: true,
      ink: s > 10 ? 1 : 0.8,
      shine: move(`M${-h + k * 0.9} ${-h + s * 0.12}L${-h * 0.1} ${-h + s * 0.12}`, to),
      sw: 0.8,
    },
  ];
  const off = s * 0.27;
  for (const [px, py] of PIPS[face]) {
    const [cx, cy] = to([px * off, py * off]);
    if (face === 1) parts.push({ d: circle(s * 0.17, cx, cy), m: m === "ivory" ? "crimson" : "night", round: true, ink: 0.5 });
    else if (m === "ivory") parts.push({ dark: circle(s * 0.095, cx, cy) });
    else parts.push({ jewel: "sapphire", x: f(cx), y: f(cy), r: f(s * 0.1) });
  }
  return parts;
}

// ── hops ────────────────────────────────────────────────────────────

/** A hop leaf: a serrated frond on its stalk at (x, y), leaning `deg`. */
function hopLeaf(x: number, y: number, deg: number, len: number, w: number, m: Material): Shape {
  const to = place(x, y, deg);
  return {
    d: move(frond(len, w, 3), to),
    m,
    vein: move(`M0 -1L0 ${f(-len + 2)}`, to),
    ink: 0.8,
    vw: 0.5,
  };
}

/** A hop cone hanging from (x, y) toward `deg`: overlapping scales. */
function hopCone(x: number, y: number, deg: number, len: number, w: number, m: Material): Shape {
  const to = place(x, y, deg);
  const d = `M0 0C${w} ${-len * 0.15} ${w * 1.05} ${-len * 0.6} 0 ${-len}C${-w * 1.05} ${-len * 0.6} ${-w} ${-len * 0.15} 0 0Z`;
  const scales = [0.3, 0.55, 0.78]
    .map((s) => `M${-w * 0.8} ${-len * (s - 0.12)}L0 ${-len * s}L${w * 0.8} ${-len * (s - 0.12)}`)
    .join("");
  return { d: move(d, to), m, round: true, vein: move(scales, to), ink: 0.8, vw: 0.5 };
}

/** A hop bine following radius `r` from `a0` to `a1`: a stem with leaves
 *  either side, leaning the way it grows, cones hung at `cones`
 *  (fractions along it), and a leaf at its tip. */
function hopBine(
  r: number,
  a0: number,
  a1: number,
  n: number,
  len: number,
  w: number,
  m: Material,
  cones: number[] = [],
): EmblemData {
  const dir = Math.sign(a1 - a0);
  const parts: EmblemData = [
    { line: arc(r, Math.min(a0, a1), Math.max(a0, a1)), color: INKS[m].vein, w: 1.5 },
  ];
  for (let i = 0; i < n; i++) {
    const deg = a0 + ((a1 - a0) * (i + 0.35)) / n;
    const [ox, oy] = at(deg, r + 0.5);
    const [ix, iy] = at(deg, r - 0.5);
    parts.push(hopLeaf(ox, oy, deg + dir * 52, len, w, m), hopLeaf(ix, iy, deg + dir * 128, len * 0.85, w * 0.9, m));
  }
  for (const s of cones) {
    const deg = a0 + (a1 - a0) * s;
    const [x, y] = at(deg, r + 0.5);
    parts.push(hopCone(x, y, deg + dir * 75, len * 0.85, w * 0.55, m));
  }
  const [tx, ty] = at(a1, r);
  parts.push(hopLeaf(tx, ty, a1 + dir * 90, len, w, m));
  return parts;
}

// ── a tankard ───────────────────────────────────────────────────────

/** A wooden tankard bound in metal, ale foaming over its top, standing
 *  at (x, y) and leaning `deg`. Drawn with its handle on the right. */
function tankard(x: number, y: number, deg: number, k: number, m: Material): EmblemData {
  const to = place(x, y, deg, k);
  const mv = (d: string) => move(d, to);
  const body = "M-6 0C-7 -6 -7 -11 -5.6 -16L5.6 -16C7 -11 7 -6 6 0Z";
  const band = (y0: number, y1: number, w0: number, w1: number) =>
    `M${-w0} ${y0}L${w0} ${y0}L${w1} ${y1}L${-w1} ${y1}Z`;
  return [
    // the handle
    {
      d: mv("M5.6 -13.5C12.5 -13.5 12.5 -3 5.6 -3L5.8 -5.6C9.4 -5.6 9.4 -11 5.6 -11Z"),
      m,
      ink: 0.9,
      shine: mv("M8.4 -12.2C10 -11.4 10.4 -9.4 10.2 -8"),
      sw: 0.7,
    },
    {
      d: mv(body),
      m: "wood",
      vein: mv("M-2.6 -1L-2.4 -15M1 -1L1 -15M4 -1L3.8 -15"),
      vw: 0.6,
      ink: 1,
    },
    { d: mv(band(-2, -4.4, 6.5, 6.7)), m, ink: 0.8, shine: mv("M-5.6 -3.2L-2 -3.2"), sw: 0.6 },
    { d: mv(band(-11.6, -14, 6.6, 6.3)), m, ink: 0.8, shine: mv("M-5.4 -12.8L-1.8 -12.8"), sw: 0.6 },
    // the foam, spilling over
    {
      d: mv(
        "M-6.6 -15.2C-8.6 -17.8 -6.2 -21.4 -3 -20C-1.8 -23 2.6 -23.2 3.8 -20.2C6.6 -21.6 9 -18.2 6.6 -15.2" +
          "C6 -14.2 5.4 -13 4.6 -13.4C4 -13.8 4.2 -14.6 3.6 -14.8L-6 -14.8Z",
      ),
      m: "ivory",
      round: true,
      ink: 0.8,
      shine: mv("M-5.6 -17.8C-5.2 -19.2 -4 -19.6 -3 -19.2"),
      sw: 0.7,
    },
  ];
}

// ── the levels ──────────────────────────────────────────────────────

function bronze(): BadgeFrame {
  const band = hoop(38, 33.5, "bronze", 12, 15);
  const sprig = hopBine(42.5, 168, 116, 2, 10, 4.6, "bronze", [0.5]);
  return {
    back: [
      ...sprig,
      ...mirror(sprig),
      staves(33.5, FACE + 2.5, 14),
      ...band,
      lip("bronze"),
      disc(FACE + 0.5),
    ],
    front: die(C, 99, 13, -10, 1),
    face: FACE,
    sweep: band[0] && "d" in band[0] ? band[0].d : "",
    glints: [[38, 33, 4]],
  };
}

function silver(): BadgeFrame {
  const band = hoop(39, 34, "silver", 12, 15);
  const bine = hopBine(45, 196, 324, 5, 11.5, 5, "silver");
  return {
    back: [
      ...bine,
      ...mirror(bine),
      staves(34, FACE + 2.5, 16),
      band[0],
      ...studs(36.5, 12, 15, 1.8),
      lip("silver"),
      disc(FACE + 0.5),
    ],
    front: die(C, 101, 14, 8, 3),
    face: FACE,
    sweep: "d" in band[0] ? band[0].d : "",
    glints: [
      [36, 33, 4.5],
      [88, 82, 3],
    ],
  };
}

function gold(): BadgeFrame {
  const band = hoop(39.5, 34.5, "gold", 16, 11.25);
  const bine = hopBine(46, 196, 318, 5, 12.5, 5.6, "gold", [0.3, 0.72]);
  const mug = tankard(...at(26, 30), -4, 1.22, "gold");
  return {
    back: [
      ...bine,
      ...mirror(bine),
      // two tankards clinking over the top
      ...mirror(mug),
      ...mug,
      staves(34.5, FACE + 2.5, 16),
      band[0],
      ...studs(37, 16, 11.25, 1.3),
      lip("gold"),
      disc(FACE + 0.5),
    ],
    front: [
      ...die(...at(270, 37), 11, -12, 5),
      ...die(...at(90, 37), 11, 12, 2),
      { d: circle(6, C, 98), m: "gold", round: true, ink: 1 },
      { jewel: "ruby", x: C, y: 98, r: 4.4 },
    ],
    face: FACE,
    sweep: "d" in band[0] ? band[0].d : "",
    glints: [
      [56, 96, 3.5],
      [36, 33, 4.5],
      [60, 14, 3.5],
    ],
  };
}

function diamond(): BadgeFrame {
  const band = hoop(40, 35, "platinum", 16, 11.25);
  const bine = hopBine(46, 198, 304, 4, 10, 4.6, "platinum");
  const set = [45, 135, 225, 315].map((deg) => {
    const [x, y] = at(deg, 37.5);
    return { jewel: "diamond" as const, x, y, r: 2.7 };
  });
  return {
    back: [
      // a star of crystal behind a platinum hop bine
      ...rays(8, 38, 58, 11, "platinum", 22.5),
      ...rays(4, 38, 54, 16, "platinum", 45),
      ...bine,
      ...mirror(bine),
      staves(35, FACE + 2.5, 16),
      band[0],
      ...studs(37.5, 16, 0, 1.3),
      lip("platinum"),
      disc(FACE + 0.5),
    ],
    front: [
      ...set,
      ...die(...at(270, 39), 13, -12, 6, "platinum"),
      ...die(...at(90, 39), 13, 12, 4, "platinum"),
      ...die(...at(180, 39), 13, 0, 1, "platinum"),
      ...gem(C, 16, 18),
    ],
    face: FACE,
    sweep: "d" in band[0] ? band[0].d : "",
    glints: [
      [C, 8, 5],
      [30, 30, 4],
      [92, 32, 3.5],
      [26, 88, 3],
      [94, 90, 4],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

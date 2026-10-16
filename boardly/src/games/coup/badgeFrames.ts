// Hustle's badge frames: a street hustle in an art-deco city. Each level
// is a coin with a reeded (milled) edge, richer at each step: a bronze
// street coin on two stacks of coins; silver on a stepped deco sunburst;
// gold with a fanned hand of cards, wings and an emerald; diamond a
// platinum medallion on crystal, winged, set with diamonds.

import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import {
  C,
  arc,
  at,
  circle,
  disc,
  gem,
  rays,
  type Shape,
} from "@/components/badges/frames/kit";
import { mirrorPath, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { FEATHER, type Material } from "@/components/engraved/shapes";

const FACE = 27;
const f = (n: number) => +n.toFixed(2);

/** A coin's milled edge: a ring cut with fine grooves across it, the
 *  groove round its middle and a line of light on its upper left. */
function reeded(outer: number, inner: number, m: Material, n = 56): Shape {
  const ticks = Array.from({ length: n }, (_, i) => {
    const deg = (360 * i) / n;
    const [x0, y0] = at(deg, inner + 1.6);
    const [x1, y1] = at(deg, outer - 1.6);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join("");
  return {
    d: circle(outer) + circle(inner),
    m,
    evenOdd: true,
    vein: ticks,
    shine: arc(outer - 1, -72, -18),
    ink: 1.3,
    vw: 0.55,
    sw: 1.2,
  };
}

/** A thin plain band just inside the milled edge. */
const band = (outer: number, inner: number, m: Material): Shape => ({
  d: circle(outer) + circle(inner),
  m,
  evenOdd: true,
  ink: 0.9,
});

/** A stack of coins seen a little from above, standing at (x, y): each
 *  coin's milled side, and the face of the top one. `lean` nudges each
 *  coin sideways so the stack looks piled by hand. */
function stack(x: number, y: number, n: number, m: Material, lean: number[] = []): EmblemData {
  const a = 8;
  const ry = 2.6;
  const h = 3.4;
  const parts: EmblemData = [];
  for (let i = 0; i < n; i++) {
    const cx = f(x + (lean[i] ?? 0));
    const base = f(y - i * h);
    const top = f(base - h);
    const ticks = [0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9]
      .map((th) => {
        const tx = f(cx + a * Math.cos(th));
        const dy = ry * Math.sin(th);
        return `M${tx} ${f(top + dy + 0.5)}L${tx} ${f(base + dy - 0.5)}`;
      })
      .join("");
    parts.push({
      d: `M${cx - a} ${top}L${cx - a} ${base}A${a} ${ry} 0 0 0 ${cx + a} ${base}L${cx + a} ${top}A${a} ${ry} 0 0 1 ${cx - a} ${top}Z`,
      m,
      vein: ticks,
      ink: 0.8,
      vw: 0.4,
    });
    if (i === n - 1)
      parts.push({
        d: `M${cx - a} ${top}A${a} ${ry} 0 1 1 ${cx + a} ${top}A${a} ${ry} 0 1 1 ${cx - a} ${top}Z`,
        m,
        vein: `M${cx - a + 2.2} ${top}A${a - 2.2} ${ry - 0.8} 0 1 1 ${cx + a - 2.2} ${top}A${a - 2.2} ${ry - 0.8} 0 1 1 ${cx - a + 2.2} ${top}Z`,
        shine: `M${cx - 4.5} ${f(top - 1.2)}L${cx - 1} ${f(top - 1.9)}`,
        ink: 0.8,
        vw: 0.4,
        sw: 0.8,
        round: true,
      });
  }
  return parts;
}

/** Two stacks at the foot of the badge, the left one taller. */
const stacks = (m: Material, left: number, right: number): EmblemData => [
  ...stack(31, 107, left, m, [0, 1, -0.6, 0.8, 0]),
  ...stack(89, 107, right, m, [0, -0.8, 0.6, -1, 0]),
];

/** A deco ray stepped like a skyscraper, pointing out from radius `r`
 *  at `deg`: `len` long, `w` wide at its foot. */
function stepped(deg: number, r: number, len: number, w: number, m: Material): EmblemPart {
  const [x, y] = at(deg, r);
  const h = w / 2;
  const d =
    `M${-h} 0V${f(-len * 0.42)}H${f(-h * 0.64)}V${f(-len * 0.74)}H${f(-h * 0.3)}V${-len}` +
    `H${f(h * 0.3)}V${f(-len * 0.74)}H${f(h * 0.64)}V${f(-len * 0.42)}H${h}V0Z`;
  return {
    d,
    m,
    vein: `M0 -1V${f(-len + 1.5)}`,
    ink: 0.8,
    vw: 0.45,
    t: `translate(${x} ${y}) rotate(${f(deg)})`,
  };
}

/** A sunburst of `n` stepped rays round the rim, long and short in
 *  turn, leaving out those `skip` names (to clear room for the coins). */
function sunburst(
  n: number,
  r: number,
  long: number,
  short: number,
  w: number,
  m: Material,
  skip: (deg: number) => boolean = () => false,
): EmblemData {
  return Array.from({ length: n }, (_, i) => (360 * i) / n)
    .filter((deg) => !skip(deg))
    .map((deg) => ({ deg, odd: Math.round(deg / (360 / n)) % 2 === 1 }))
    // short rays first so the long ones lie over their shoulders
    .sort((p, q) => Number(q.odd) - Number(p.odd))
    .map(({ deg, odd }) => stepped(deg, r, odd ? short : long, odd ? w * 0.8 : w, m));
}

/** One playing card, standing on its foot at the pivot and turned `deg`
 *  about it: ivory face, a metal border, and a pip at its top. */
function card(deg: number, px: number, py: number, rise: number, pip: "diamond" | "spade" | "back", edge: Material): EmblemData {
  const w = 19;
  const hgt = 30;
  const x0 = -w / 2;
  const y1 = -rise;
  const y0 = -rise - hgt;
  const r = 2.4;
  const t = `translate(${px} ${py}) rotate(${deg})`;
  const body = `M${x0 + r} ${y0}H${-x0 - r}Q${-x0} ${y0} ${-x0} ${y0 + r}V${y1}H${x0}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
  const inset = `M${x0 + 2.4} ${y0 + 2.4}H${-x0 - 2.4}V${y1}M${x0 + 2.4} ${y0 + 2.4}V${y1}`;
  const cy = y0 + 8.5;
  if (pip === "back") {
    // the back: night-blue, a deco lozenge in a border of metal
    const lattice =
      `M${x0 + 2.4} ${y0 + 2.4}H${-x0 - 2.4}V${y1}M${x0 + 2.4} ${y0 + 2.4}V${y1}` +
      `M0 ${y0 + 5}L${-x0 - 4.5} ${y0 + 14}L0 ${y0 + 23}L${x0 + 4.5} ${y0 + 14}Z` +
      `M0 ${y0 + 9}L${-x0 - 7.5} ${y0 + 14}L0 ${y0 + 19}L${x0 + 7.5} ${y0 + 14}Z`;
    return [
      { d: body, m: "night", vein: lattice, shine: `M${x0 + 1.4} ${y0 + 4}V${y0 + 14}`, ink: 0.9, vw: 0.5, sw: 0.8, t },
      { line: lattice, color: "#DCE7F2", w: 0.45, op: 0.8, t },
    ];
  }
  const parts: EmblemData = [
    { d: body, m: "ivory", vein: inset, shine: `M${x0 + 1.4} ${y0 + 4}V${y0 + 14}`, ink: 0.9, vw: 0.5, sw: 0.8, t },
  ];
  if (pip === "diamond")
    parts.push({ d: `M0 ${cy - 4.6}L3.4 ${cy}L0 ${cy + 4.6}L-3.4 ${cy}Z`, m: "crimson", ink: 0.6, t });
  else
    parts.push({
      dark: `M0 ${cy - 4.6}C2 ${cy - 2.4} 4.2 ${cy - 1} 4.2 ${cy + 1.2}C4.2 ${cy + 3} 2 ${cy + 3.4} 0.7 ${cy + 2.2}L1.6 ${cy + 4.6}H-1.6L-0.7 ${cy + 2.2}C-2 ${cy + 3.4} -4.2 ${cy + 3} -4.2 ${cy + 1.2}C-4.2 ${cy - 1} -2 ${cy - 2.4} 0 ${cy - 4.6}Z`,
      t,
    });
  // a thin metal line round the face, the card's gilt edge
  parts.push({ line: body, color: edge === "gold" ? "#B8862E" : "#8EA3BC", w: 0.5, t });
  return parts;
}

/** A hand of cards fanned behind the top of the badge. */
function hand(degs: number[], edge: Material, backs = false): EmblemData {
  return degs.flatMap((deg, i) =>
    card(deg, C, 62, 27, backs && i % 2 ? "back" : i % 2 || i === 2 ? "diamond" : "spade", edge),
  );
}

/** A wing on the right of the badge: long feathers swept up and out,
 *  shorter ones over their roots further down; mirrored for the left. */
function wing(m: Material, n: number, long: number, side: 1 | -1): EmblemData {
  const parts: EmblemData = [];
  for (let i = 0; i < n; i++) {
    // from the top feather (up and out) to the lowest (out and down)
    const s = i / (n - 1);
    const dir = 38 + s * 86;
    const len = long - s * long * 0.45;
    const [x, y] = at(62 + s * 62, 31);
    const deg = side * dir;
    const px = side === 1 ? x : f(2 * C - x);
    // the left wing's feathers are the right's turned over, not just turned
    const d = FEATHER(len, 3.6);
    parts.push({
      d: side === 1 ? d : mirrorPath(d, 0),
      m,
      vein: `M0 -2L${f(side * 0.3)} ${f(-len + 3)}`,
      ink: 0.85,
      vw: 0.45,
      t: `translate(${px} ${y}) rotate(${f(deg)})`,
    });
  }
  return parts;
}

const wings = (m: Material, n: number, long: number) => [
  ...wing(m, n, long, 1),
  ...wing(m, n, long, -1),
];

function bronze(): BadgeFrame {
  const rim = reeded(37, FACE + 3, "bronze", 48);
  return {
    back: [
      ...stacks("bronze", 3, 2),
      // deco notches at the top and sides, stepped like a skyline
      ...[0, 90, 270].map((deg) => stepped(deg, 34, 12, 13, "bronze")),
      rim,
      band(FACE + 3, FACE + 1.2, "bronze"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [[38, 33, 4]],
  };
}

function silver(): BadgeFrame {
  const rim = reeded(38, FACE + 3, "silver");
  return {
    back: [
      ...sunburst(12, 35.5, 19, 12.5, 13, "silver", (deg) => deg > 130 && deg < 230),
      ...stacks("silver", 4, 3),
      rim,
      band(FACE + 3, FACE + 1.2, "silver"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [37, 32, 4.5],
      [88, 84, 3],
    ],
  };
}

function gold(): BadgeFrame {
  const rim = reeded(39, FACE + 3, "gold");
  return {
    back: [
      ...wings("gold", 6, 30),
      ...hand([-32, -16, 0, 16, 32], "gold"),
      ...stacks("gold", 4, 3),
      rim,
      band(FACE + 3, FACE + 1.2, "gold"),
      disc(FACE + 0.5),
    ],
    front: [
      { jewel: "emerald", x: C, y: 21, r: 4.8 },
      { jewel: "ruby", x: at(270, 34.5)[0], y: C, r: 2.6 },
      { jewel: "ruby", x: at(90, 34.5)[0], y: C, r: 2.6 },
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [55, 16, 4],
      [36, 34, 4.5],
      [96, 46, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const rim = reeded(39.5, FACE + 3, "platinum");
  const set = [45, 135, 225, 315, 90, 270].map((deg) => {
    const [x, y] = at(deg, 34.7);
    return { jewel: "diamond" as const, x, y, r: 2.5 };
  });
  return {
    back: [
      // crystal shards fanned out below, between the wings
      ...rays(18, 37, 55, 15, "platinum", 0).slice(16, 22),
      ...wings("platinum", 7, 30),
      ...hand([-38, -19, 0, 19, 38], "platinum", true),
      ...stacks("platinum", 4, 4),
      rim,
      band(FACE + 3, FACE + 1.2, "platinum"),
      disc(FACE + 0.5),
    ],
    front: [...set, { jewel: "emerald", x: C, y: 20.5, r: 5.2 }, ...gem(C, 106, 18)],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 8, 5],
      [32, 30, 4],
      [100, 44, 3.5],
      [22, 92, 3],
      [94, 92, 4],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

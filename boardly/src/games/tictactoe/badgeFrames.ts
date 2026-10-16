// Tic-Tac-Toe's badge frames: the medal sits in the middle square of a
// wooden board, X's and O's inlaid in the corner squares (X's diagonal
// runs through the medal: it is the winning move). Richer at each level:
// bronze, a small tile with bronze marks; silver, the full board with
// its # grid inlaid in a silver edge; gold, a gilt moulding, brass
// corner guards and a ruby between scrolls; diamond, all in platinum on
// a star of crystal, diamonds set in the corners, round the rim and on
// top.

import { mirrorPath, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { curl, type Material } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, at, beads, circle, disc, gem, ring, type Shape } from "@/components/badges/frames/kit";

const FACE = 26;
const f = (n: number) => +n.toFixed(2);

/** An arc of radius `r` round (cx, cy), `a0` to `a1` degrees from the top. */
function arcAt(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = at(a0, r, cx, cy);
  const [x1, y1] = at(a1, r, cx, cy);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** A square `h` either side of the centre with corners rounded `r`. */
function square(h: number, r: number) {
  const a = C - h;
  const b = C + h;
  return (
    `M${a + r} ${a}H${b - r}A${r} ${r} 0 0 1 ${b} ${a + r}V${b - r}` +
    `A${r} ${r} 0 0 1 ${b - r} ${b}H${a + r}A${r} ${r} 0 0 1 ${a} ${b - r}` +
    `V${a + r}A${r} ${r} 0 0 1 ${a + r} ${a}Z`
  );
}

/** The wooden board, its grain running across. */
function board(h: number, r: number): Shape {
  const grain = [-0.78, -0.55, 0.55, 0.8]
    .map((k, i) => {
      const y = f(C + h * k);
      const w = i % 2 ? 1.6 : -1.4;
      return `M${f(C - h + 4)} ${y}C${f(C - h / 2)} ${f(y + w)} ${f(C + h / 2)} ${f(y - w)} ${f(C + h - 4)} ${y}`;
    })
    .join("");
  return {
    d: square(h, r),
    m: "wood",
    vein: grain,
    shine: `M${f(C - h + 1.6)} ${f(C - h + r + 2)}V${f(C - h / 3)}M${f(C - h + r + 2)} ${f(C - h + 1.6)}H${f(C - h / 3)}`,
    ink: 1.3,
    vw: 0.45,
    sw: 0.9,
  };
}

/** A moulding round the board: a band between two rounded squares. */
function moulding(outer: number, inner: number, m: Material, r = 10): Shape {
  const mid = (outer + inner) / 2;
  return {
    d: square(outer, r) + square(inner, r - (outer - inner)),
    m,
    evenOdd: true,
    vein: square(mid, r - (outer - mid)),
    shine: `M${f(C - outer + 1.3)} ${f(C + 12)}V${f(C - outer + r)}A${r - 1.3} ${r - 1.3} 0 0 1 ${f(C - outer + r)} ${f(C - outer + 1.3)}H${f(C - 12)}`,
    ink: 1.3,
    vw: 0.6,
    sw: 1,
  };
}

/** The # grid inlaid in the board: two bars each way (the rim hides
 *  where they cross). */
function grid(h: number, m: Material): EmblemData {
  const g = f((h * 2) / 6);
  const w = 1.5;
  const end = h - 1;
  return [-g, g].flatMap((o) => [
    { d: `M${f(C + o - w)} ${C - end}H${f(C + o + w)}V${C + end}H${f(C + o - w)}Z`, m, ink: 0.6 },
    { d: `M${C - end} ${f(C + o - w)}V${f(C + o + w)}H${C + end}V${f(C + o - w)}Z`, m, ink: 0.6 },
  ]);
}

/** An X piece at (x, y): two bars crossed, `l` from the centre to each
 *  round end, `t` half their width. */
function cross(x: number, y: number, l: number, t: number, m: Material, ink = 0.8): Shape {
  const c = Math.SQRT1_2;
  const p = (u: number, v: number) => `${f(x + (u - v) * c)} ${f(y + (u + v) * c)}`;
  const A = `A${t} ${t} 0 0 1 `;
  const d =
    `M${p(-t, -l)}${A}${p(t, -l)}L${p(t, -t)}L${p(l, -t)}${A}${p(l, t)}` +
    `L${p(t, t)}L${p(t, l)}${A}${p(-t, l)}L${p(-t, t)}L${p(-l, t)}${A}${p(-l, -t)}L${p(-t, -t)}Z`;
  return {
    d,
    m,
    vein: `M${p(0, -l + 1.2)}L${p(0, l - 1.2)}M${p(-l + 1.2, 0)}L${p(l - 1.2, 0)}`,
    shine: `M${p(-l + 0.6, -t + 0.7)}L${p(-t - 0.4, -t + 0.7)}`,
    ink,
    vw: 0.45,
    sw: 0.7,
  };
}

/** An O piece at (x, y): a ring `r` out, `w` thick. */
function nought(x: number, y: number, r: number, w: number, m: Material, ink = 0.8): Shape {
  return {
    d: circle(r, x, y) + circle(r - w, x, y),
    m,
    evenOdd: true,
    vein: circle(r - w / 2, x, y),
    shine: arcAt(x, y, r - 0.7, -75, -15),
    ink,
    vw: 0.45,
    sw: 0.7,
  };
}

/** The four corner squares' pieces: X top left and bottom right (the
 *  diagonal through the medal), O in the other two. `d` is how far in
 *  from the centre each sits along x and y. */
function pieces(d: number, s: number, m: Material, ink = 0.8): EmblemData {
  const t = s * 0.3;
  return [
    cross(C - d, C - d, s, t, m, ink),
    nought(C + d, C - d, s * 0.92, t * 1.9, m, ink),
    nought(C - d, C + d, s * 0.92, t * 1.9, m, ink),
    cross(C + d, C + d, s, t, m, ink),
  ];
}

/** Metal corner guards on the board, `h` out: an L round each corner
 *  with pointed arms and (`stud`) a boss at the bend. */
function corners(h: number, arm: number, t: number, m: Material, stud = true): EmblemData {
  const out: EmblemData = [];
  const R = 11;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const p = (u: number, v: number) => `${f(C + sx * (h - u))} ${f(C + sy * (h - v))}`;
    const sweep = sx * sy > 0 ? 1 : 0;
    const d =
      `M${p(arm, 0)}L${p(arm + t * 0.9, t / 2)}L${p(arm, t)}L${p(t, t)}L${p(t, arm)}` +
      `L${p(t / 2, arm + t * 0.9)}L${p(0, arm)}L${p(0, R)}A${R} ${R} 0 0 ${sweep} ${p(R, 0)}Z`;
    const lit = [
      sy < 0 ? `M${p(arm - 1, 0.7)}L${p(R, 0.7)}` : "",
      sx < 0 ? `M${p(0.7, R)}L${p(0.7, arm - 1)}` : "",
    ].join("");
    out.push({ d, m, vein: `M${p(arm - 0.5, t / 2)}L${p(t / 2, t / 2)}L${p(t / 2, arm - 0.5)}`, shine: lit || undefined, ink: 0.9, vw: 0.5, sw: 0.8 });
    if (stud) out.push({ d: circle(t * 0.55, ...corner(h, t, sx, sy)), m, round: true, ink: 0.6 });
  }
  return out;
}

/** Where a corner guard's boss sits. */
const corner = (h: number, t: number, sx: number, sy: number): [number, number] => [
  f(C + sx * (h - t * 0.95)),
  f(C + sy * (h - t * 0.95)),
];

/** A pair of scrolls along the top of the moulding, curling down onto it from
 *  either side of the jewel there. */
function scrolls(m: Material): EmblemData {
  const c = curl(67, 11.5, -0.35, 16, 4.6, 4.2, 0.7);
  const right = { d: c.outline, m, vein: c.vein, ink: 0.8, vw: 0.45 };
  return [right, { ...right, d: mirrorPath(c.outline, 120), vein: mirrorPath(c.vein, 120) }];
}

function bronze(): BadgeFrame {
  const rim = ring(36, FACE + 2, "bronze");
  return {
    back: [
      board(42, 12),
      ...pieces(29, 7.2, "bronze", 1),
      rim,
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [[37, 34, 4]],
  };
}

function silver(): BadgeFrame {
  const rim = ring(36.5, FACE + 2, "silver");
  return {
    back: [
      board(45, 8),
      ...grid(44, "silver"),
      moulding(47, 43.5, "silver", 9),
      ...pieces(33.5, 7.4, "silver"),
      rim,
      ...beads(32.3, 16, 1.05, "silver"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [36, 33, 4.5],
      [94, 88, 3],
    ],
  };
}

function gold(): BadgeFrame {
  const rim = ring(37, FACE + 2, "gold");
  const frame = moulding(50, 44, "gold");
  return {
    back: [
      board(45, 6),
      ...grid(44, "gold"),
      frame,
      ...corners(52, 20, 7, "gold"),
      ...pieces(33, 7.2, "gold"),
      rim,
      ...beads(32.5, 18, 1.05, "gold"),
      disc(FACE + 0.5),
      ...scrolls("gold"),
      // the ruby's setting on the moulding
      { d: circle(6.8, C, 13), m: "gold", round: true, ink: 1 },
    ],
    front: [{ jewel: "ruby", x: C, y: 13, r: 4.6 }],
    face: FACE,
    sweep: frame.d + rim.d,
    glints: [
      [55, 9, 4],
      [36, 33, 4.5],
      [96, 70, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const rim = ring(37.5, FACE + 2, "platinum");
  const frame = moulding(50, 44, "platinum");
  // a burst of crystal from each corner: a long shard between two short
  const shard = (deg: number, r0: number, r1: number, w: number): EmblemPart[] => {
    const [tx, ty] = at(deg, r1);
    const [lx, ly] = at(deg - w / 2, r0);
    const [rx, ry] = at(deg + w / 2, r0);
    const [mx, my] = at(deg, r0 - 4);
    return [
      { d: `M${mx} ${my}L${lx} ${ly}L${tx} ${ty}Z`, m: "platinum", ink: 0.8 },
      { d: `M${mx} ${my}L${tx} ${ty}L${rx} ${ry}Z`, m: "#9CB8D8", ink: 0.8 },
    ];
  };
  const bursts = [
    ...[45, 135, 225, 315].flatMap((deg) => shard(deg, 58, 78, 18)),
    ...[90, 180, 270].flatMap((deg) => shard(deg, 44, 55.5, 20)),
  ];
  const set = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const [x, y] = at(deg, 32.8);
    return { jewel: "diamond" as const, x, y, r: 2.5 };
  });
  return {
    back: [
      ...bursts,
      board(45, 6),
      ...grid(44, "platinum"),
      frame,
      ...corners(52, 20, 7, "platinum", false),
      ...scrolls("platinum"),
      ...pieces(33, 7.4, "platinum"),
      rim,
      disc(FACE + 0.5),
    ],
    front: [
      ...set,
      ...([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sy]) => {
        const [x, y] = corner(52, 7, sx, sy);
        return { jewel: "diamond" as const, x, y, r: 3.4 };
      }),
      ...gem(C, 11, 15),
    ],
    face: FACE,
    sweep: frame.d + rim.d,
    glints: [
      [C, 5, 5],
      [8, 8, 4],
      [112, 10, 3.5],
      [33, 33, 4],
      [108, 108, 4],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

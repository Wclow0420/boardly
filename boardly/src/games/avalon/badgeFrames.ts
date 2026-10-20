// Double Agent's badge frames, one per level, richer at each: a bronze
// agency token, a crosshair through it; a silver scope on a night-blue
// octagon; a gold agency seal over crossed daggers with a sapphire; a
// platinum seal on a star of crystal, a reticle of diamonds round it.
// See BadgeFrame (components/badges/types) and frames/boardly.ts.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import type { Material } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, arc, at, circle, disc, gem, rays, ring, type Shape } from "@/components/badges/frames/kit";

const FACE = 27;
const f = (n: number) => +n.toFixed(2);

/** A point in a frame turned to `deg` (from the top, clockwise): `a`
 *  across (to the right of the way it points), `s` out from the centre. */
function local(deg: number, a: number, s: number): [number, number] {
  const r = ((deg - 90) * Math.PI) / 180;
  const ux = Math.cos(r);
  const uy = Math.sin(r);
  return [f(C + ux * s - uy * a), f(C + uy * s + ux * a)];
}
const poly = (deg: number, pts: [number, number][]) =>
  `M${pts.map(([a, s]) => local(deg, a, s).join(" ")).join("L")}Z`;
const path = (deg: number, pts: [number, number][]) =>
  `M${pts.map(([a, s]) => local(deg, a, s).join(" ")).join("L")}`;

/** An octagon `r` to its corners, its flats facing up, down and across. */
const octagon = (r: number, rot = 22.5) =>
  `M${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => at(rot + i * 45, r).join(" ")).join("L")}Z`;

/** A line of light along the octagon's upper-left flat. */
function octShine(r: number, rot: number) {
  const [x0, y0] = at(270 + rot, r);
  const [x1, y1] = at(315 + rot, r);
  const k = 0.22;
  return `M${f(x0 + (x1 - x0) * k)} ${f(y0 + (y1 - y0) * k)}L${f(x1 - (x1 - x0) * k)} ${f(y1 - (y1 - y0) * k)}`;
}

/** An octagonal frame between two sizes (even-odd), bevelled. */
function octFrame(outer: number, inner: number, m: Material, rot = 22.5): Shape {
  return {
    d: octagon(outer, rot) + octagon(inner, rot),
    m,
    evenOdd: true,
    vein: octagon((outer + inner) / 2, rot),
    shine: octShine(outer - 1.8, rot === 0 ? 0 : 22.5),
    ink: 1.3,
    vw: 0.7,
    sw: 1.2,
  };
}

/** The rim: a ring engraved like a scope's dial, a tick every 15°, long
 *  ones on the diagonals. */
function dial(outer: number, inner: number, m: Material): Shape {
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15)
    .filter((deg) => deg % 90 !== 0)
    .map((deg) => {
      const long = deg % 45 === 0;
      return path(deg, [
        [0, outer - 1.2],
        [0, long ? inner + 1.2 : outer - (outer - inner) * 0.45],
      ]);
    })
    .join("");
  return {
    d: circle(outer) + circle(inner),
    m,
    evenOdd: true,
    vein: ticks,
    shine: arc(outer - 1.4, -70, -20),
    ink: 1.3,
    vw: 0.8,
    sw: 1.2,
  };
}

/** The four crosshair posts of a reticle, from `r0` out to `r1`. */
function posts(r0: number, r1: number, w: number, m: Material, top = r1, tip = 0.35): EmblemPart[] {
  return [0, 90, 180, 270].map((deg) => ({ deg, r1: deg === 0 ? top : r1 })).map(({ deg, r1 }) => ({
    d: poly(deg, [
      [-w / 2, r0],
      [-w * tip, r1],
      [w * tip, r1],
      [w / 2, r0],
    ]),
    m,
    vein: path(deg, [
      [0, r0 + 1.5],
      [0, r1 - 1.5],
    ]),
    ink: 1,
    vw: 0.6,
  }));
}

/** A dagger behind the badge, its blade out toward `deg` and its hilt
 *  across the centre the other way: only the tip and the hilt show. */
function dagger(deg: number, blade: Material, hilt: Material, len = 70, out = 0): EmblemData {
  const b = deg;
  const h = deg + 180;
  const o = out;
  return [
    {
      d: poly(b, [
        [-5.4, 30],
        [-5, len - 15],
        [0, len],
        [5, len - 15],
        [5.4, 30],
      ]),
      m: blade,
      vein: path(b, [
        [0, 32],
        [0, len - 7],
      ]),
      shine: path(b, [
        [-3.2, 40],
        [-3, len - 15],
      ]),
      ink: 1.1,
      vw: 0.7,
      sw: 0.9,
    },
    {
      d: poly(h, [
        [-2.6, 30],
        [-2.6, 61 + o],
        [2.6, 61 + o],
        [2.6, 30],
      ]),
      m: "wood",
      vein: [52, 55, 58].map((s) => path(h, [[-2.4, s + o], [2.4, s + o - 1]])).join(""),
      ink: 1,
      vw: 0.6,
    },
    {
      d: poly(h, [
        [-10, 46.5 + o],
        [-11, 49 + o],
        [-9, 51 + o],
        [9, 51 + o],
        [11, 49 + o],
        [10, 46.5 + o],
      ]),
      m: hilt,
      vein: path(h, [
        [-8.5, 48.8 + o],
        [8.5, 48.8 + o],
      ]),
      ink: 1,
      vw: 0.5,
    },
    { d: circle(3.8, ...local(h, 0, 64.5 + o)), m: hilt, round: true, ink: 1 },
  ];
}

/** Round studs on the octagon's eight corners (or only some). */
const rivets = (r: number, size: number, m: Material, degs = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]): EmblemPart[] =>
  degs.map((deg) => ({ d: circle(size, ...at(deg, r)), m, round: true, ink: 0.7 }));

/** Small beads round the night band, kept clear of the posts. */
const studs = (r: number, size: number, m: Material): EmblemPart[] =>
  Array.from({ length: 24 }, (_, i) => i * 15 + 7.5)
    .filter((deg) => Math.abs(((deg + 45) % 90) - 45) > 10)
    .map((deg) => ({ d: circle(size, ...at(deg, r)), m, round: true, ink: 0.5 }));

/** A gold collet the focal jewel sits in, on the top post. */
const collet = (y: number, r: number, m: Material): EmblemPart => ({
  d: circle(r, C, y),
  m,
  round: true,
  ink: 1,
  vein: circle(r - 1.6, C, y),
  vw: 0.5,
});

function bronze(): BadgeFrame {
  const plate = octFrame(42, FACE + 1, "bronze");
  return {
    back: [
      ...posts(36, 48, 6.5, "bronze"),
      plate,
      ...rivets(38.6, 1.6, "bronze"),
      { ...dial(34, FACE + 2, "bronze"), ink: 1 },
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: plate.d,
    glints: [[37, 30, 4]],
  };
}

function silver(): BadgeFrame {
  const rim = dial(38, FACE + 2, "silver");
  return {
    back: [
      { d: octagon(49), m: "night", ink: 1.3 },
      octFrame(49, 44.5, "silver"),
      ...rivets(46.8, 1.5, "silver"),
      ...posts(36, 54, 7, "silver"),
      rim,
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [36, 33, 4.5],
      [88, 82, 3],
    ],
  };
}

function gold(): BadgeFrame {
  const rim = dial(38, FACE + 2, "gold");
  return {
    back: [
      ...dagger(315, "silver", "gold"),
      ...dagger(45, "silver", "gold"),
      { d: octagon(50), m: "night", ink: 1.3 },
      octFrame(50, 45, "gold"),
      ...studs(41.5, 1.1, "gold"),
      ...posts(36, 54.5, 8, "gold", 46),
      collet(12.5, 7, "gold"),
      rim,
      disc(FACE + 0.5),
    ],
    front: [{ jewel: "sapphire", x: C, y: 12.5, r: 4.8 }],
    face: FACE,
    sweep: rim.d,
    glints: [
      [57, 9, 4],
      [36, 33, 4.5],
      [107, 13, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const lip = ring(39.5, 36.6, "platinum");
  const rim: Shape = { ...dial(37, FACE + 2, "night"), shine: undefined };
  // a reticle of cut diamonds set round the night-blue dial
  const set = [0, 45, 90, 135, 180, 225, 270, 315].flatMap((deg) => {
    const [x, y] = at(deg, 32.8);
    return gem(x, y, deg % 90 ? 6 : 7.5);
  });
  return {
    back: [
      // a star of crystal between the posts and the blades
      ...rays(8, 40, 60, 24, "platinum", 22.5),
      ...dagger(315, "platinum", "platinum", 74, 4.5),
      ...dagger(45, "platinum", "platinum", 74, 4.5),
      { d: octagon(51, 0), m: "platinum", ink: 1.3 },
      octFrame(51, 45.5, "platinum", 0),
      ...studs(42.5, 1.2, "platinum"),
      ...posts(36, 55, 8.5, "platinum", 46),
      lip,
      rim,
      { ...ring(FACE + 3.6, FACE + 2, "platinum"), vein: undefined, shine: undefined, ink: 0.9 },
      disc(FACE + 0.5),
    ],
    front: [...set, ...gem(C, 12, 17)],
    face: FACE,
    sweep: octFrame(51, 45.5, "platinum", 0).d + lip.d,
    glints: [
      [C, 5, 5],
      [34, 32, 4],
      [108, 12, 3.5],
      [14, 106, 3],
      [92, 92, 4],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

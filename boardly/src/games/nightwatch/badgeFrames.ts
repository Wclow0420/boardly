// Seal the Manor's badge frames, one per level, in the manor's gothic:
// a bronze watcher's token cut as a quatrefoil; a silver quatrefoil on
// wrought-iron scrolls, sealed in crimson wax; a gold tracery of
// stained-glass lancets lit by two candles, the seal set with a ruby;
// and a platinum rose window on crystal, set with diamonds.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import { LEAF, curl, type Material } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, at, beads, circle, disc, gem, rays, ring, type Shape } from "@/components/badges/frames/kit";

const FACE = 26;
const f = (n: number) => +n.toFixed(2);

/** A closed outline round the centre, `R(deg)` from it at each angle
 *  (degrees from the top, clockwise). */
function polar(R: (deg: number) => number, n = 240, cx = C, cy = C) {
  const pts = Array.from({ length: n }, (_, i) => at((360 * i) / n, R((360 * i) / n), cx, cy));
  return `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
}

/** The same outline, open, from `a0` to `a1` degrees: for shines. */
function polarArc(R: (deg: number) => number, a0: number, a1: number, n = 24, cx = C, cy = C) {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const deg = a0 + ((a1 - a0) * i) / n;
    return at(deg, R(deg), cx, cy);
  });
  return `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}`;
}

/** How far from `deg` to the nearest of `n` evenly spaced angles from
 *  `from`, in degrees (signed). */
function offset(deg: number, n: number, from = 0) {
  const step = 360 / n;
  return ((((deg - from) % step) + step * 1.5) % step) - step / 2;
}

/** A quatrefoil's edge: four round lobes `d` out, radius `rl`, with a
 *  pointed cusp `tip` out between each pair. */
function quatrefoil(d: number, rl: number, tip: number) {
  return (deg: number) => {
    let r = 0;
    for (let k = 0; k < 4; k++) {
      const a = ((deg - k * 90) * Math.PI) / 180;
      const disc = rl * rl - d * d * Math.sin(a) ** 2;
      if (disc >= 0) r = Math.max(r, d * Math.cos(a) + Math.sqrt(disc));
    }
    const cusp = tip - Math.abs(offset(deg, 4, 45)) * 1.2;
    return Math.max(r, cusp);
  };
}

/** Pointed gothic lobes, `n` of them: from `r0` between them out to
 *  `r1` at their points. */
function foils(n: number, r0: number, r1: number, from = 0, sharp = 0.55) {
  return (deg: number) => {
    const s = Math.abs(offset(deg, n, from)) / (180 / n);
    return r0 + (r1 - r0) * Math.pow(1 - s, sharp);
  };
}

/** A lancet of stained glass pointing out at `deg`: a pointed arch from
 *  `r0` to `r1`, `w` degrees wide at its foot, its lead lines engraved. */
function lancet(deg: number, r0: number, r1: number, w: number, m: Material): Shape {
  const [lx, ly] = at(deg - w / 2, r0);
  const [rx, ry] = at(deg + w / 2, r0);
  const [sx, sy] = at(deg - w / 2, r0 + (r1 - r0) * 0.5);
  const [ex, ey] = at(deg + w / 2, r0 + (r1 - r0) * 0.5);
  const [tx, ty] = at(deg, r1);
  const [cx1, cy1] = at(deg - w * 0.42, r1 - (r1 - r0) * 0.12);
  const [cx2, cy2] = at(deg + w * 0.42, r1 - (r1 - r0) * 0.12);
  const [mx, my] = at(deg, r0 + (r1 - r0) * 0.48);
  return {
    d: `M${lx} ${ly}L${sx} ${sy}Q${cx1} ${cy1} ${tx} ${ty}Q${cx2} ${cy2} ${ex} ${ey}L${rx} ${ry}Z`,
    m,
    round: true,
    // the leading: across the middle and up the centre
    vein: `M${sx} ${sy}L${ex} ${ey}M${f((lx + rx) / 2)} ${f((ly + ry) / 2)}L${mx} ${my}`,
    ink: 1.1,
    vw: 0.8,
  };
}

/** A crimson wax seal at (x, y): a pooled, notched edge round a pressed
 *  face, a ruby or a quatrefoil pressed into it. */
function seal(x: number, y: number, r: number, ruby: boolean): EmblemData {
  const edge = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return r * (1 + 0.075 * Math.sin(a * 9) + 0.035 * Math.sin(a * 5 + 1.3));
  };
  const face = r * 0.64;
  const mark = quatrefoil(face * 0.3, face * 0.42, face * 0.78);
  return [
    {
      d: polar(edge, 90, x, y),
      m: "crimson",
      round: true,
      ink: 1.1,
      shine: polarArc((deg) => edge(deg) * 0.8, -80, -25, 12, x, y),
      sw: 1,
    },
    {
      d: circle(face, x, y),
      m: "crimson",
      vein: ruby ? undefined : polar(mark, 72, x, y),
      ink: 0.8,
      vw: 0.7,
    },
    ...(ruby ? [{ jewel: "ruby" as const, x, y, r: face * 0.62 }] : []),
  ];
}

/** A candle standing at (x, y) on a little metal sconce, `h` tall, its
 *  flame above. */
function candle(x: number, y: number, h: number, m: Material): EmblemData {
  const w = 3.2;
  const top = y - h;
  return [
    // the sconce: a drip pan on a stem
    { d: `M${x - 6} ${y}Q${x} ${y + 5.5} ${x + 6} ${y}Z`, m, ink: 0.9, shine: `M${x - 4} ${y + 0.9}L${x - 1} ${y + 1.6}`, sw: 0.8 },
    {
      d: `M${x - w} ${y}V${top + 1.2}Q${x - w} ${top} ${x - w + 1.2} ${top}H${x + w - 1.2}Q${x + w} ${top} ${x + w} ${top + 1.2}V${y}Z`,
      m: "ivory",
      // a run of wax down its side
      vein: `M${x + 1.2} ${top + 0.4}V${top + h * 0.45}`,
      shine: `M${x - w + 1.1} ${top + 2}V${y - 2}`,
      ink: 0.9,
      vw: 0.7,
      sw: 0.9,
    },
    { line: `M${x} ${top}V${top - 1.6}`, color: "#2A1808", w: 0.9 },
    { d: LEAF(8.5, 3.6), m: "flame", vein: "M0 -1.5L0 -5", ink: 0.7, vw: 0.6, t: `translate(${x} ${top - 0.8})` },
  ];
}

/** Both candles, mirrored across the badge. */
const candles = (x: number, y: number, h: number, m: Material) => [
  ...candle(x, y, h, m),
  ...candle(120 - x, y, h, m),
];

/** A quatrefoil plate round the disc, the rim itself: grooved, lit on
 *  its upper left. */
function plate(R: (deg: number) => number, hole: number, m: Material): Shape {
  return {
    d: polar(R) + circle(hole),
    m,
    evenOdd: true,
    vein: polar((deg) => R(deg) - 3.2) + circle(hole + 2.6),
    shine: polarArc((deg) => R(deg) - 1.4, -78, -12),
    ink: 1.3,
    vw: 0.7,
    sw: 1.2,
  };
}

/** Wrought-iron scrolls on the diagonals: a pair curling apart at each. */
function ironwork(r: number, len: number, w: number, spread = 1.2): EmblemData {
  return [45, 135, 225, 315].flatMap((deg) => {
    const [x, y] = at(deg, r);
    const out = ((deg - 90) * Math.PI) / 180;
    return [1, -1].map((side): EmblemPart => {
      const p = curl(x, y, out + side * spread, len, side * 4.2, w, 0.55);
      return { d: p.outline, m: "iron", vein: p.vein, ink: 0.9, vw: 0.5 };
    });
  });
}

function bronze(): BadgeFrame {
  const R = quatrefoil(16, 24, 41);
  const token = plate(R, FACE + 2, "bronze");
  return {
    back: [
      token,
      // a stud in each lobe
      ...[0, 90, 270].map((deg): EmblemPart => {
        const [x, y] = at(deg, 34);
        return { d: circle(2.3, x, y), m: "bronze", round: true, ink: 0.8 };
      }),
      disc(FACE + 0.5),
    ],
    front: seal(C, 94, 7.5, false),
    face: FACE,
    sweep: token.d,
    glints: [[36, 30, 4]],
  };
}

function silver(): BadgeFrame {
  const R = quatrefoil(17, 25, 45);
  const rim = plate(R, FACE + 2, "silver");
  // a ball on each cusp's point
  const finials = [45, 135, 225, 315].map((deg): EmblemPart => {
    const [x, y] = at(deg, 46);
    return { d: circle(2.6, x, y), m: "silver", round: true, ink: 0.8 };
  });
  return {
    back: [
      ...ironwork(42, 20, 4.4),
      rim,
      ...finials,
      ...beads(31.8, 16, 1, "silver"),
      disc(FACE + 0.5),
    ],
    front: seal(C, 98, 9, false),
    face: FACE,
    sweep: rim.d,
    glints: [
      [34, 28, 4.5],
      [89, 88, 3],
    ],
  };
}

/** Stained glass: `n` lancets round the badge in turning colours. */
function glass(n: number, r0: number, r1: number, w: number, from: number, colours: Material[]) {
  return Array.from({ length: n }, (_, i) =>
    lancet(from + (360 * i) / n, r0, r1, w, colours[i % colours.length]),
  );
}

function gold(): BadgeFrame {
  const tracery: Shape = {
    d: polar(foils(8, 41, 54.5, 0)),
    m: "gold",
    vein: polar(foils(8, 42.5, 51.5, 0)),
    shine: polarArc((deg) => foils(8, 41, 54.5, 0)(deg) - 1.4, -60, -30),
    ink: 1.2,
    sw: 1,
  };
  const rim = ring(39, FACE + 2, "gold");
  return {
    back: [
      tracery,
      ...glass(8, 37, 48.5, 27, 0, ["night", "crimson", "leaf", "crimson"]),
      rim,
      ...beads(33.5, 18, 1.1, "gold"),
      disc(FACE + 0.5),
    ],
    front: [...candles(99, 84, 13, "gold"), ...seal(C, 99, 10, true)],
    face: FACE,
    sweep: rim.d,
    glints: [
      [35, 32, 4.5],
      [C, 9, 3.5],
      [92, 30, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const R = foils(12, 41, 54, 0, 0.5);
  const rose: Shape = {
    d: polar(R),
    m: "platinum",
    shine: polarArc((deg) => R(deg) - 1.4, -62, -28),
    ink: 1.2,
    sw: 1,
  };
  const rim = ring(40, FACE + 2, "platinum");
  const set = [45, 90, 135, 225, 270, 315].flatMap((deg) => {
    const [x, y] = at(deg, 34);
    return gem(x, y + 0.6, 7.4);
  });
  return {
    back: [
      // crystal between the rose's points
      ...rays(12, 44, 57, 10, "platinum", 15),
      rose,
      ...glass(12, 38, 49.5, 18, 0, ["night", "crimson", "leaf", "crimson"]),
      rim,
      disc(FACE + 0.5),
    ],
    front: [...set, ...candles(100, 86, 13, "platinum"), ...seal(C, 100, 10, true), ...gem(C, 15, 15)],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 8, 5],
      [30, 30, 4],
      [93, 33, 3.5],
      [22, 70, 3],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

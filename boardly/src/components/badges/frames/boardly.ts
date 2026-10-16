// Boardly's own badge frames, one per level, richer at each: a beaded
// bronze medal; silver in a laurel wreath; gold in a fuller wreath with
// scrolled corners and a crested ruby; diamond in platinum on a star of crystal, gems set round
// it. Every game's badges follow the same ladder in their own style.

import type { EmblemData } from "@/components/engraved/emblem";
import { curl } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "../types";
import { C, at, beads, circle, disc, gem, laurel, rays, ring } from "./kit";

const FACE = 27;

function bronze(): BadgeFrame {
  const rim = ring(37, FACE + 2, "bronze");
  return {
    back: [
      ...laurel(44, 178, 228, 3, 9, 3.6, "bronze"),
      ...laurel(44, 182, 132, 3, 9, 3.6, "bronze"),
      ...beads(40.5, 22, 1.7, "bronze"),
      rim,
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [[38, 34, 4]],
  };
}

function silver(): BadgeFrame {
  const rim = ring(38, FACE + 2, "silver");
  const leaves = [
    ...laurel(45, 186, 322, 7, 11, 4.2, "silver"),
    ...laurel(45, 174, 38, 7, 11, 4.2, "silver"),
  ];
  return {
    back: [
      ...leaves,
      // the stems crossed under a silver boss
      { d: circle(4.2, C, 104), m: "silver", round: true, ink: 1 },
      rim,
      ...beads(33.5, 16, 1.1, "silver"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [37, 33, 4.5],
      [87, 80, 3],
    ],
  };
}

/** Small scrolls on the rim's four diagonals, a pair curling apart at
 *  each, like the corners of a frame. */
function scrolls(): EmblemData {
  return [45, 135, 225, 315].flatMap((deg) => {
    const [x, y] = at(deg, 40);
    const out = ((deg - 90) * Math.PI) / 180;
    return [1, -1].map((side) => {
      const p = curl(x, y, out + side * 0.9, 13, side * 3.6, 4.2, 0.6);
      return { d: p.outline, m: "gold" as const, vein: p.vein, ink: 0.8, vw: 0.45 };
    });
  });
}

/** A crest on top: three leaves fanned behind a ruby. */
function crest(): EmblemData {
  const leaf = (deg: number, len: number) => ({
    d: `M0 0C5 -${len * 0.3} 5 -${len * 0.75} 0 -${len}C-5 -${len * 0.75} -5 -${len * 0.3} 0 0Z`,
    m: "gold" as const,
    vein: `M0 -2L0 -${len - 2}`,
    ink: 0.9,
    vw: 0.5,
    t: `translate(${C} 23) rotate(${deg})`,
  });
  return [leaf(-38, 15), leaf(38, 15), leaf(0, 19)];
}

function gold(): BadgeFrame {
  const rim = ring(39, FACE + 2, "gold");
  const [lx, ly] = at(270, 34);
  const [rx, ry] = at(90, 34);
  return {
    back: [
      ...laurel(47, 188, 318, 7, 13, 5, "gold"),
      ...laurel(47, 172, 42, 7, 13, 5, "gold"),
      ...scrolls(),
      ...crest(),
      rim,
      ...beads(34, 20, 1.1, "gold", 20, 340),
      disc(FACE + 0.5),
    ],
    front: [
      { jewel: "ruby", x: C, y: 21, r: 4.6 },
      { jewel: "sapphire", x: lx, y: ly, r: 3 },
      { jewel: "sapphire", x: rx, y: ry, r: 3 },
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [56, 17, 4],
      [36, 34, 4.5],
      [90, 70, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const rim = ring(39.5, FACE + 2, "platinum");
  const set = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const [x, y] = at(deg, 34.2);
    return { jewel: "diamond" as const, x, y, r: 2.7 };
  });
  return {
    back: [
      // a star of crystal, long shards between short
      ...rays(8, 36, 50, 13, "platinum", 0),
      ...rays(8, 36, 56, 22, "platinum", 22.5),
      rim,
      disc(FACE + 0.5),
    ],
    front: [...set, ...gem(C, 14, 16)],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 8, 5],
      [30, 30, 4],
      [92, 34, 3.5],
      [26, 86, 3],
      [94, 90, 4],
    ],
  };
}

export const BOARDLY_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

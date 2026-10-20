// Midnight Manor's badge frames: a night kept by the clock until dawn.
// Every level is a clock face (an ivory chapter ring with its twelve
// hour marks, the XII at the top) in a metal bezel, richer at each:
//   bronze  — a pocket watch: milled bezel, winding crown and bow;
//   silver  — a long-case clock: the moon dial in its arch above, the
//             pendulum below;
//   gold    — the same in gold, scrolls at the arch's feet, candles in
//             sconces either side, a sapphire at XII;
//   diamond — platinum on a star of crystal, diamonds at the hours, the
//             arch showing the dawn sun, a cut diamond above.

import { mirrorPath, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { acanthus, curl, type Material } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, arc, at, beads, circle, disc, rays, ring, type Shape } from "@/components/badges/frames/kit";

const FACE = 27;
const f = (n: number) => +n.toFixed(2);

/** A radial bar from r0 to r1 at `deg`, `w` wide: an hour mark. */
function bar(deg: number, r0: number, r1: number, w: number): string {
  const d = (r: number) => ((w / 2 / r) * 180) / Math.PI;
  const a = at(deg - d(r0), r0);
  const b = at(deg + d(r0), r0);
  const c = at(deg + d(r1), r1);
  const e = at(deg - d(r1), r1);
  return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}L${e[0]} ${e[1]}Z`;
}

/** The ivory chapter ring between `inner` and `outer`, a minute track
 *  engraved near its edge, and its twelve hour marks: a pair at XII, a
 *  heavier bar at the quarters, a short one at the rest. */
function chapter(outer: number, inner: number): EmblemData {
  const r0 = inner + 1;
  const marks: EmblemPart[] = Array.from({ length: 12 }, (_, i) => {
    const deg = i * 30;
    if (i === 0) {
      const g = (1.5 / ((inner + outer) / 2)) * (180 / Math.PI);
      return [
        { dark: bar(-g, r0, outer - 1.6, 1.2) },
        { dark: bar(g, r0, outer - 1.6, 1.2) },
      ];
    }
    return [{ dark: bar(deg, r0, outer - (i % 3 ? 2.6 : 1.6), i % 3 ? 1.1 : 1.8) }];
  }).flat();
  return [
    {
      d: circle(outer) + circle(inner),
      m: "ivory",
      evenOdd: true,
      vein: circle(outer - 1.1),
      shine: arc(outer - 0.8, -62, -28),
      ink: 1,
      vw: 0.45,
      sw: 0.9,
    },
    ...marks,
  ];
}

/** The metal bezel round the chapter ring. */
function bezel(outer: number, inner: number, m: Material): Shape {
  return { ...ring(outer, inner, m), vein: circle(inner + 1.1), vw: 0.55 };
}

/** A crescent moon at (x, y), `r` across its outer edge, its horns to
 *  the upper right. */
function crescent(x: number, y: number, r: number, m: Material): Shape {
  const t1 = at(32, r, x, y);
  const t2 = at(148, r, x, y);
  const r2 = r * 0.9;
  return {
    d: `M${t1[0]} ${t1[1]}A${r} ${r} 0 1 0 ${t2[0]} ${t2[1]}A${f(r2)} ${f(r2)} 0 0 1 ${t1[0]} ${t1[1]}Z`,
    m,
    shine: `M${at(250, r - 1.1, x, y).join(" ")}A${r - 1.1} ${r - 1.1} 0 0 1 ${at(310, r - 1.1, x, y).join(" ")}`,
    ink: 0.8,
    sw: 0.7,
  };
}

/** A four-pointed star twinkle, `s` from its centre to a point. */
function star(x: number, y: number, s: number, m: Material): Shape {
  const k = s * 0.3;
  return {
    d: `M${x} ${f(y - s)}L${f(x + k)} ${f(y - k)}L${f(x + s)} ${y}L${f(x + k)} ${f(y + k)}L${x} ${f(y + s)}L${f(x - k)} ${f(y + k)}L${f(x - s)} ${y}L${f(x - k)} ${f(y - k)}Z`,
    m,
    ink: 0.6,
  };
}

/** The arch above the face, like a long-case clock's moon dial: a metal
 *  frame round a window of night sky, centred `cy`; the bezel covers
 *  its lower half. */
function arch(cy: number, m: Material): EmblemData {
  return [
    {
      d: circle(20, C, cy),
      m,
      round: true,
      shine: arcAt(18.8, -60, -24, cy),
      ink: 1.2,
      sw: 1,
    },
    { d: circle(16.5, C, cy), m: "night", round: true, vein: circle(15.3, C, cy), ink: 1, vw: 0.5 },
  ];
}

/** An arc round (C, cy) rather than the badge's centre. */
function arcAt(r: number, a0: number, a1: number, cy: number) {
  const [x0, y0] = at(a0, r, C, cy);
  const [x1, y1] = at(a1, r, C, cy);
  return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
}

/** The pendulum hanging below the face: a rod and a round bob with an
 *  engraved sunburst. */
function pendulum(m: Material, by: number, br: number): EmblemData {
  const burst = Array.from({ length: 8 }, (_, i) => {
    const [x0, y0] = at(i * 45, br * 0.32, C, by);
    const [x1, y1] = at(i * 45, br * 0.72, C, by);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join("");
  return [
    { d: `M58.4 90H61.6V${by - br + 1}H58.4Z`, m, ink: 0.9 },
    {
      d: circle(br, C, by),
      m,
      round: true,
      vein: circle(br * 0.25, C, by) + burst,
      ink: 1.1,
      vw: 0.55,
    },
  ];
}

/** A candle in its dish at (x, top), wax `h` tall, its flame above. */
function candle(x: number, top: number, h: number, m: Material): EmblemData {
  const w = 3.4;
  const fy = top - 1;
  return [
    // the wax, a drip down its lit side
    {
      d: `M${x - w} ${top + 1.5}Q${x - w} ${top} ${x - w + 1.5} ${top}H${x + w - 1.5}Q${x + w} ${top} ${x + w} ${top + 1.5}V${top + h}H${x - w}Z`,
      m: "ivory",
      vein: `M${x - w + 1.6} ${top + 1}V${top + 6.5}`,
      shine: `M${x - w + 1.2} ${top + 8}V${top + h - 2}`,
      ink: 0.9,
      vw: 1,
      sw: 0.8,
    },
    { line: `M${x} ${top}V${fy - 1}`, color: "#2A1808", w: 0.9 },
    // the flame
    {
      d: `M${x} ${fy}C${x - 4.2} ${fy - 2.8} ${x - 3.4} ${fy - 8} ${x} ${fy - 14}C${x + 3.4} ${fy - 8} ${x + 4.2} ${fy - 2.8} ${x} ${fy}Z`,
      m: "flame",
      round: true,
      vein: `M${x} ${fy - 1.5}C${x - 1.2} ${fy - 3} ${x - 0.8} ${fy - 5} ${x} ${fy - 7}`,
      ink: 0.8,
      vw: 0.6,
    },
    // the dish
    {
      d: `M${x - 7} ${top + h - 0.5}H${x + 7}Q${x + 6} ${top + h + 4} ${x} ${top + h + 4}Q${x - 6} ${top + h + 4} ${x - 7} ${top + h - 0.5}Z`,
      m,
      shine: `M${x - 5} ${top + h + 1}H${x - 1}`,
      ink: 0.9,
      sw: 0.8,
    },
  ];
}

/** Both of a left-side part list's mirror images joined: draws a pair. */
function pair(left: EmblemData): EmblemData {
  const right = left.map((p): EmblemPart => {
    if ("jewel" in p) return { ...p, x: f(2 * C - p.x) };
    if ("dark" in p) return { ...p, dark: mirror(p.dark) };
    if ("line" in p) return { ...p, line: mirror(p.line) };
    return { ...p, d: mirror(p.d), vein: p.vein && mirror(p.vein), shine: p.shine && mirror(p.shine) };
  });
  return [...left, ...right];
}

const mirror = (d: string) => mirrorPath(d, 2 * C);

// ---------------------------------------------------------------- levels

function bronze(): BadgeFrame {
  const rim = bezel(37.5, 34, "bronze");
  return {
    back: [
      // the bow, then the crown and its stem over it
      { d: circle(6.2, C, 10.8) + circle(3.8, C, 10.8), m: "bronze", evenOdd: true, round: true, shine: arcAt(5.4, -70, -20, 10.8), ink: 1, sw: 0.8 },
      { d: `M57 16H63V24H57Z`, m: "bronze", ink: 0.9 },
      {
        d: `M53.5 14.6Q53.5 12.6 55.5 12.6H64.5Q66.5 12.6 66.5 14.6V17.6Q66.5 19.6 64.5 19.6H55.5Q53.5 19.6 53.5 17.6Z`,
        m: "bronze",
        vein: `M56.3 13.6V18.6M58.7 13.6V18.6M61.3 13.6V18.6M63.7 13.6V18.6`,
        ink: 1,
        vw: 0.6,
      },
      // the milled edge
      ...beads(39.6, 28, 1.5, "bronze").slice(1),
      rim,
      ...chapter(34, FACE + 1.5),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [[37, 34, 4], [64, 12, 3]],
  };
}

function silver(): BadgeFrame {
  const rim = bezel(38.5, 35, "silver");
  return {
    back: [
      ...shoulders("silver", false),
      ...arch(25, "silver"),
      crescent(57, 15, 5.2, "silver"),
      star(68, 12.5, 2.4, "silver"),
      star(49, 11, 1.7, "silver"),
      ...pendulum("silver", 108.5, 6.8),
      rim,
      ...chapter(35, FACE + 1.5),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [[36, 33, 4.5], [55, 12, 3], [64, 104, 3]],
  };
}

/** Scrolls from under the arch's sides, out over the bezel's shoulders:
 *  a plain volute at silver, leafed acanthus curling up at gold. */
function shoulders(m: Material, lush: boolean): EmblemData {
  const parts = lush
    ? acanthus(45, 28, Math.PI * 1.04, 30, 3.2, 6.5, true)
    : [curl(43, 18, Math.PI * 0.96, 19, -4.0, 4.8, 0.6)];
  return pair(parts.map((p) => ({ d: p.outline, m, vein: p.vein, ink: 0.85, vw: 0.45 })));
}

/** A sconce arm from the bezel out to a candle's dish. */
function sconces(m: Material, top: number, h: number): EmblemData {
  // out from under the bezel, beneath the dish, curling down
  const p = curl(28, 80, Math.PI, 23, -4.3, 4.6, 0.6);
  return pair([{ d: p.outline, m, vein: p.vein, ink: 0.85, vw: 0.45 }, ...candle(12, top, h, m)]);
}

function gold(): BadgeFrame {
  const rim = bezel(39, 35.5, "gold");
  return {
    back: [
      ...shoulders("gold", true),
      ...arch(25, "gold"),
      crescent(56.5, 13.8, 5, "gold"),
      star(67.5, 11.5, 2.4, "gold"),
      star(70, 17.5, 1.4, "gold"),
      star(48.5, 11.5, 1.5, "gold"),
      ...sconces("gold", 56, 22),
      ...pendulum("gold", 108.5, 7),
      rim,
      ...chapter(35.5, FACE + 1.5),
      disc(FACE + 0.5),
    ],
    front: [{ jewel: "sapphire", x: C, y: 23.3, r: 3.4 }],
    face: FACE,
    sweep: rim.d,
    glints: [[57, 21, 4], [12, 40, 3.5], [108, 40, 3.5], [36, 34, 4]],
  };
}

/** The dawn sun rising in the arch's window: a disc of flame and its
 *  rays, cut off by the bezel below. */
function dawn(cy: number): EmblemData {
  const sy = cy - 3;
  const rayParts: EmblemPart[] = [-60, -30, 0, 30, 60].map((deg) => {
    const [tx, ty] = at(deg, 11.5, C, sy);
    const [lx, ly] = at(deg - 9, 6.8, C, sy);
    const [rx, ry] = at(deg + 9, 6.8, C, sy);
    return { d: `M${lx} ${ly}L${tx} ${ty}L${rx} ${ry}Z`, m: "flame", ink: 0.6 };
  });
  return [
    ...rayParts,
    { d: circle(6, C, sy), m: "flame", round: true, ink: 0.9 },
  ];
}

function diamond(): BadgeFrame {
  const rim = bezel(39.5, 35.5, "platinum");
  const set = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = at(i * 30, 37.5);
    return { jewel: "diamond" as const, x, y, r: 1.9 };
  }).slice(1);
  return {
    back: [
      // a star of crystal between the hours
      ...[318, 42, 138, 222].flatMap((deg) => rays(1, 37, 57, 16, "platinum", deg)),
      ...[162, 198].flatMap((deg) => rays(1, 37, 51, 11, "platinum", deg)),
      ...arch(25, "platinum"),
      ...dawn(25),
      star(48.5, 12, 1.7, "platinum"),
      star(71.5, 12, 1.7, "platinum"),
      ...sconces("platinum", 56, 22),
      ...pendulum("platinum", 108.5, 7),
      rim,
      ...chapter(35.5, FACE + 1.5),
      disc(FACE + 0.5),
    ],
    front: [...set, { jewel: "sapphire", x: C, y: 23, r: 3.6 }],
    face: FACE,
    sweep: rim.d,
    glints: [[C, 20, 5], [30, 30, 4], [92, 34, 3.5], [12, 40, 3.5], [94, 90, 4]],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();


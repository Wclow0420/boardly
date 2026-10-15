// Seal the Manor's icons as engraved emblems, second half: the dining
// room's goblet to the hourglass. Plain data in the house style (see
// src/components/engraved/emblem.ts), each in a 48 × 48 box and bold
// enough to read at text size. Look them over with
// `node scripts/emblem-sheet.mjs src/games/nightwatch/emblems/part2.ts out.png`.

import type { IconName } from "../icons";
import { disc, ring, type EmblemData } from "@/components/engraved/emblem";
import { LEAF, ribbon, type Pt } from "@/components/engraved/shapes";

const f = (n: number) => n.toFixed(2);

/** A star of `n` points round (cx, cy), tips at `R`, notches at `r`. */
function star(cx: number, cy: number, R: number, r: number, n = 5, turn = -90) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((turn + (i * 180) / n) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    pts.push(`${f(cx + Math.cos(a) * k)} ${f(cy + Math.sin(a) * k)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** A four-pointed sparkle with curved sides. */
function sparkle(cx: number, cy: number, R: number, pinch = 0.14) {
  const k = R * pinch;
  return (
    `M${f(cx)} ${f(cy - R)}Q${f(cx + k)} ${f(cy - k)} ${f(cx + R)} ${f(cy)}` +
    `Q${f(cx + k)} ${f(cy + k)} ${f(cx)} ${f(cy + R)}` +
    `Q${f(cx - k)} ${f(cy + k)} ${f(cx - R)} ${f(cy)}` +
    `Q${f(cx - k)} ${f(cy - k)} ${f(cx)} ${f(cy - R)}Z`
  );
}

/** A band along a circle's arc, from `a0` to `a1` degrees. */
function arcBand(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a0: number,
  a1: number,
) {
  const p = (r: number, a: number) => {
    const t = (a * Math.PI) / 180;
    return `${f(cx + Math.cos(t) * r)} ${f(cy + Math.sin(t) * r)}`;
  };
  return `M${p(r2, a0)}A${r2} ${r2} 0 0 1 ${p(r2, a1)}L${p(r1, a1)}A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`;
}

/** The circle (cx, cy, R) with the circle (ox, oy, r) bitten out. */
function crescent(
  cx: number,
  cy: number,
  R: number,
  ox: number,
  oy: number,
  r: number,
) {
  const dx = ox - cx;
  const dy = oy - cy;
  const d = Math.hypot(dx, dy);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const bx = cx + (dx * a) / d;
  const by = cy + (dy * a) / d;
  const p1 = `${f(bx - (dy * h) / d)} ${f(by + (dx * h) / d)}`;
  const p2 = `${f(bx + (dy * h) / d)} ${f(by - (dx * h) / d)}`;
  return `M${p1}A${R} ${R} 0 ${a > 0 ? 1 : 0} 1 ${p2}A${r} ${r} 0 ${a > d ? 1 : 0} 0 ${p1}Z`;
}

/** A meeple centred on (24, 24), 32 wide and 36 tall. */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";
const meeple = (x: number, y: number, s: number, m: "gold" | "silver") => ({
  d: MEEPLE,
  m,
  ink: 1.5 / s,
  shine: "M20.5 10.5A4 4 0 0 1 23 8.4M11 22.6Q14 20.6 18 20",
  t: `translate(${x} ${y}) scale(${s}) translate(-24 -24)`,
});

/** A wisp of steam or fog: a ribbon through `points`. */
const wisp = (points: Pt[], widths: number[]) => ribbon(points, widths);

const steamL = wisp(
  [
    [17, 15.5],
    [14.5, 11],
    [18, 7],
    [15.5, 2.5],
  ],
  [3.4, 3.8, 3, 1.4],
);
const steamR = wisp(
  [
    [30, 15.5],
    [27.5, 11],
    [31, 7],
    [28.5, 2.5],
  ],
  [3.4, 3.8, 3, 1.4],
);

const fogBand = (y: number, x0: number, x1: number) => {
  const w = x1 - x0;
  return wisp(
    [
      [x0, y],
      [x0 + w * 0.25, y - 2.4],
      [x0 + w * 0.5, y],
      [x0 + w * 0.75, y - 2.4],
      [x1, y - 0.6],
    ],
    [2.6, 7.6, 8, 7.6, 2.6],
  );
};
const fog1 = fogBand(11.5, 4, 37);
const fog2 = fogBand(24.5, 11, 44);
const fog3 = fogBand(37.5, 4, 33);

/** Where the dizzy stars ride: an orbit tilted round (24, 25). */
const TILT = (-14 * Math.PI) / 180;
const orbit = (deg: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  const x = Math.cos(t) * 18.5;
  const y = Math.sin(t) * 9;
  return [
    24 + x * Math.cos(TILT) - y * Math.sin(TILT),
    25 + x * Math.sin(TILT) + y * Math.cos(TILT),
  ];
};
const [s1x, s1y] = orbit(190);
const [s2x, s2y] = orbit(310);
const [s3x, s3y] = orbit(75);

export const EMBLEMS: Partial<Record<IconName, EmblemData>> = {
  /** The dining room: a gold goblet brimming with wine. */
  goblet: [
    {
      d: "M13 44Q13.5 38.5 24 37.5Q34.5 38.5 35 44Z",
      shine: "M16.5 42Q18 39.8 22 39.4",
    },
    { d: "M21.8 24H26.2V38H21.8Z", ink: 1.2 },
    {
      d: "M8.5 5H39.5C39.5 18 33 26.5 24 26.5C15 26.5 8.5 18 8.5 5Z",
      shine: "M12.4 9C12.8 14.6 15 19 18 21.6",
    },
    {
      d: "M11.5 9.5H36.5C35.6 17.6 30.6 23.4 24 23.4C17.4 23.4 12.4 17.6 11.5 9.5Z",
      m: "crimson",
      ink: 1.1,
      shine: "M14.6 12.6C15.4 16 17 18.6 19 20.2",
    },
    { jewel: "ruby", x: 24, y: 31.5, r: 2.8 },
  ],

  /** The kitchen: an iron cauldron on its feet, steaming. */
  cauldron: [
    { d: steamL.outline, m: "ivory", ink: 1.1 },
    { d: steamR.outline, m: "ivory", ink: 1.1 },
    {
      d: "M12.5 37L9 44.5H14.5L18 39ZM35.5 37L39 44.5H33.5L30 39Z",
      m: "iron",
      ink: 1.2,
    },
    {
      d: "M7.5 21H40.5C41.5 34 34.5 42.5 24 42.5C13.5 42.5 6.5 34 7.5 21Z",
      m: "iron",
      shine: "M11 25.5C11.4 31.5 13.8 35.6 17.2 38",
    },
    {
      d: "M6.5 16.5H41.5Q43.5 16.5 43.5 18.5V21.5Q43.5 23.5 41.5 23.5H6.5Q4.5 23.5 4.5 21.5V18.5Q4.5 16.5 6.5 16.5Z",
      shine: "M7 18.6H40",
    },
  ],

  /** Fog: three drifting silver bands. */
  fog: [
    { d: fog1.outline, m: "silver", shine: fog1.shine, ink: 1.3 },
    { d: fog2.outline, m: "silver", shine: fog2.shine, ink: 1.3 },
    { d: fog3.outline, m: "silver", shine: fog3.shine, ink: 1.3 },
  ],

  /** The garden: a gold crescent moon and a silver star. */
  moon: [
    {
      d: crescent(21, 25, 19, 31, 17, 15.5),
      shine: "M6.5 28A15 15 0 0 0 13 38.6",
    },
    { d: star(37, 30, 6.5, 2.7, 5), m: "silver", ink: 1.2 },
  ],

  /** Blackout: the new moon, black but for a last silver edge, in a
   *  gold rim. */
  dark: [
    { dark: disc(24, 24, 17) },
    { d: crescent(24, 24, 16.5, 21, 22.5, 15), m: "silver", ink: 0 },
    {
      d: ring(24, 24, 20.5, 16.5),
      evenOdd: true,
      shine: "M8.2 19A16 16 0 0 1 13 11.2",
    },
  ],

  /** The chapel: ivory walls under a gold roof, a cross on top. */
  church: [
    { d: "M22.5 2H25.5V5.5H29V8.5H25.5V13H22.5V8.5H19V5.5H22.5Z", ink: 1.2 },
    { d: "M10 43V28L24 16L38 28V43Z", m: "ivory", shine: "M12.5 30V40.5" },
    {
      d: "M4.5 27.5L24 10.5L43.5 27.5L40.5 30.8L24 16.6L7.5 30.8Z",
      shine: "M8.2 27.4L23.6 14",
    },
    {
      d: "M19 43V35A5 5 0 0 1 29 35V43Z",
      m: "wood",
      vein: "M24 30.4V43",
      ink: 1.2,
    },
    { jewel: "sapphire", x: 24, y: 24.5, r: 2.9 },
    { d: "M6 41.5H42V45.5H6Z", m: "silver", ink: 1.2 },
  ],

  /** Hush: a hand raised, one finger up, in a gold cuff. */
  hush: [
    { d: "M15 26V7.5A4 4 0 0 1 23 7.5V26Z", m: "ivory", shine: "M17.2 8.5V21" },
    {
      d: "M12 24.5Q12 20 16.5 20H32Q36 20 36 24V32.5Q36 37.5 31 37.5H17Q12 37.5 12 32.5Z",
      m: "ivory",
      vein: "M27.5 20.4V25.6M32 20.4V25.6",
    },
    {
      d: "M12.4 27Q19 25.4 23.5 28.6Q25.6 30.4 23.6 32.2Q21.6 33.6 18.6 31.6Q15.6 30.4 12.4 31.6Z",
      m: "ivory",
      ink: 1.2,
    },
    {
      d: "M14 36.5H34V44.5H14Z",
      vein: "M14.5 40.5H33.5",
      shine: "M15.5 38.4H32.5",
    },
    { jewel: "ruby", x: 24, y: 40.5, r: 2.4 },
  ],

  /** Blocked: a crimson ring struck through. */
  blocked: [
    { d: "M9.5 21.2H38.5V26.8H9.5Z", m: "crimson", t: "rotate(45 24 24)" },
    {
      d: ring(24, 24, 19.5, 14),
      m: "crimson",
      evenOdd: true,
      shine: "M7.6 19A17 17 0 0 1 13 10.6",
    },
  ],

  /** Dizzy: gold and silver stars spinning on a silver orbit. */
  dizzy: [
    {
      d: `M43.5 25A19.5 10.5 0 1 1 4.5 25A19.5 10.5 0 1 1 43.5 25ZM40 25A16 7 0 1 0 8 25A16 7 0 1 0 40 25Z`,
      m: "silver",
      evenOdd: true,
      ink: 1.3,
      shine: "M8.6 20.6Q16 16 26 15.8",
      t: "rotate(-14 24 25)",
    },
    { d: star(s1x, s1y, 10, 4.2), ink: 1.3 },
    { d: star(s2x, s2y, 9, 3.8), m: "silver", ink: 1.3 },
    {
      d: star(s3x, s3y, 12.5, 5.2),
      shine: `M${f(s3x - 2.8)} ${f(s3y - 3.4)}L${f(s3x)} ${f(s3y - 8.6)}`,
    },
  ],

  /** The map: a folded ivory map, a route to a ruby. */
  map: [
    { d: "M4 10L17 5.5V38.5L4 43Z", m: "ivory", shine: "M6.5 13V38" },
    {
      d: "M17 5.5L31 10V43L17 38.5Z",
      m: "ivory",
      vein: "M19 31Q22 29 23.5 26M25.5 22.5Q27.5 19.5 30 18.5",
    },
    {
      d: "M31 10L44 5.5V38.5L31 43Z",
      m: "ivory",
      vein: "M8 36Q11 34 13 32M15 29.5L17 27",
    },
    { jewel: "ruby", x: 36.8, y: 17.5, r: 3.6 },
  ],

  /** The news: a printed broadsheet, its headline in black. */
  news: [
    { d: "M33 13H42V39.5Q42 44 37.5 44H33Z", m: "ivory", ink: 1.3 },
    {
      d: "M5 6H36V44H9.5Q5 44 5 39.5Z",
      m: "ivory",
      vein: "M9.5 23H31.5M9.5 28H31.5M9.5 33H31.5M9.5 38H23",
    },
    { dark: "M9.5 10.5H31.5V18H9.5Z" },
  ],

  /** The hall: an ivory candle in a gold holder, lit. */
  candle: [
    { d: ring(40, 37.5, 4.5, 2.2), evenOdd: true, ink: 1.2 },
    {
      d: "M18.5 20.5Q18.5 18.5 20.5 18.5H27.5Q29.5 18.5 29.5 20.5V39H18.5Z",
      m: "ivory",
      vein: "M25.5 18.8V24.5",
      shine: "M20.8 22V35.5",
    },
    {
      d: "M6 37.5H42Q41.5 43.5 35 43.5H13Q6.5 43.5 6 37.5Z",
      shine: "M9.5 39.4H24",
    },
    { dark: "M23.3 14.5H24.7V18.6H23.3Z" },
    { d: LEAF(14.5, 6.6), m: "flame", ink: 1.2, t: "translate(24 16.5)" },
    { d: LEAF(7, 3), m: "ivory", ink: 0, t: "translate(24 15.5)" },
  ],

  /** The prophet's orb: a night-blue crystal on a gold stand. */
  orb: [
    {
      d: "M11 44.5L15.5 34.5H32.5L37 44.5Z",
      vein: "M13.6 40H34.4",
      shine: "M15 42.5L17.6 36.8",
    },
    {
      d: disc(24, 20, 16.5),
      m: "night",
      shine: "M12.4 14.6A12.5 12.5 0 0 1 18.6 8.6",
    },
    { d: sparkle(29, 24, 5.5, 0.16), m: "silver", ink: 0.9 },
    { d: sparkle(19.5, 27.5, 3, 0.16), m: "silver", ink: 0.7 },
  ],

  /** Next: a gold arrow up to a silver bar. */
  next: [
    { d: "M4 20H21V11L36.5 24L21 37V28H4Z", shine: "M6 22.2H22.5V15.6" },
    { d: "M39 7.5H44V40.5H39Z", m: "silver", ink: 1.3, shine: "M40.7 10V38" },
  ],

  /** The echo: a gold herald's horn, the sound rolling out. */
  horn: [
    { d: "M13 28.5L16.5 39H21L18.5 29.5Z", m: "wood", ink: 1.2 },
    { d: "M3.5 19H9.5V29H3.5Z", m: "wood", ink: 1.2 },
    { d: "M9 18.5L27 8V40L9 29.5Z", shine: "M11.5 20.5L24.5 13" },
    {
      d: "M27 8C29.5 8 30.5 16 30.5 24C30.5 32 29.5 40 27 40C24.5 40 23.5 32 23.5 24C23.5 16 24.5 8 27 8Z",
      m: "silver",
      ink: 1.3,
    },
    {
      d:
        arcBand(29, 24, 6.5, 9, -36, 36) + arcBand(29, 24, 11.5, 14.5, -40, 40),
      m: "silver",
      ink: 1.2,
    },
  ],

  /** People: two meeples, silver and gold. */
  people: [meeple(16, 21, 0.7, "silver"), meeple(31, 27, 0.75, "gold")],

  /** Calm: two green leaves on the wind. */
  leaf: [
    {
      d: LEAF(19, 8),
      m: "leaf",
      vein: "M0 -2L0 -15",
      ink: 1.3,
      t: "translate(13 39) rotate(-25)",
    },
    {
      d: LEAF(33, 13),
      m: "leaf",
      vein: "M0 -2L0 -29",
      shine: "M-5.5 -8C-6.8 -14 -5.8 -20 -2.8 -25",
      t: "translate(13 39) rotate(48)",
    },
    {
      d: "M13 39Q10 42.5 5 44.5L5.6 45.8Q11.4 44 14.2 40Z",
      m: "wood",
      ink: 1.1,
    },
  ],

  /** No: a crimson cross. */
  cross: [
    {
      d: "M19 3H29V19H45V29H29V45H19V29H3V19H19Z",
      m: "crimson",
      shine: "M21 6V20",
      t: "rotate(45 24 24) translate(24 24) scale(0.92) translate(-24 -24)",
      ink: 1.6,
    },
  ],

  /** Something to touch: a gold sparkle with two small ones. */
  spark: [
    { d: sparkle(19.5, 23, 17.5), shine: "M17.5 11L18.6 19.6" },
    { d: sparkle(37.5, 36.5, 7.5), m: "silver", ink: 1.2 },
    { d: sparkle(37.5, 10.5, 5.5), ink: 1.1 },
  ],

  /** A letter: an ivory envelope under a crimson seal. */
  letter: [
    {
      d: "M6.5 10H41.5Q44 10 44 12.5V35.5Q44 38 41.5 38H6.5Q4 38 4 35.5V12.5Q4 10 6.5 10Z",
      m: "ivory",
      vein: "M5 37L18.5 25M43 37L29.5 25",
    },
    { d: "M5 11L24 27L43 11Z", m: "ivory", ink: 1.3, shine: "M9 12.6L22 23.4" },
    {
      d: star(24, 27, 7, 6, 12),
      m: "crimson",
      ink: 1.2,
      vein: disc(24, 27, 3.8),
    },
  ],

  /** Done: a bold green tick. */
  check: [
    {
      d: "M4.5 25.5L11 19L19 27L37 9L43.5 15.5L19 40Z",
      m: "leaf",
      ink: 1.6,
      shine: "M7.6 25.4L11 22.2M21.4 29L36.8 13.4",
    },
  ],

  /** A storm: an iron cloud and a gold bolt. */
  storm: [
    {
      d: "M11 32A7 7 0 0 1 9.2 18.4A7.5 7.5 0 0 1 19.4 11.2A10 10 0 0 1 37 14.4A8.8 8.8 0 0 1 37 32Z",
      m: "iron",
      shine:
        "M7.6 23.4A4.6 4.6 0 0 1 10.6 19.6M22.4 9.6A7.6 7.6 0 0 1 28.6 7.4",
    },
    {
      d: "M26 21L16.5 35H23L19 45.5L32 29.5H25.5L30.5 21Z",
      shine: "M25.4 22.6L19.6 32.6",
    },
  ],

  /** Waiting: an hourglass, its gold sand running. */
  wait: [
    {
      d: "M13 8H35C35 17 26.5 20 26.5 24C26.5 28 35 31 35 40H13C13 31 21.5 28 21.5 24C21.5 20 13 17 13 8Z",
      m: "silver",
      shine: "M15.5 10.5C16 15.5 18.5 18 20.5 19.6",
    },
    {
      d: "M16.5 14H31.5C30.5 18 25.5 20.5 24 22.2C22.5 20.5 17.5 18 16.5 14Z",
      ink: 1,
    },
    {
      d: "M15.2 39.2C15.6 34 21 31.4 24 30.2C27 31.4 32.4 34 32.8 39.2Z",
      ink: 1,
    },
    { dark: "M23.4 22H24.6V31H23.4Z" },
    {
      d: "M9.5 3.5H38.5Q40 3.5 40 5V8.5H8V5Q8 3.5 9.5 3.5Z",
      m: "wood",
      ink: 1.3,
    },
    {
      d: "M8 39.5H40V43Q40 44.5 38.5 44.5H9.5Q8 44.5 8 43Z",
      m: "wood",
      ink: 1.3,
    },
  ],
};

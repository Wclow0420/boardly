// The emoji Hustle (games/coup) and Double Agent (games/avalon) use as
// pictures, as engraved emblems in the house style (see "The house
// drawing style" in AGENTS.md): the roles, the moves and the sides.
// People are meeples told apart by what they wear and carry, never by a
// face. Keyed by emoji without U+FE0F. Look them over with
//   node scripts/emblem-sheet.mjs src/components/engraved/emoji/spies.ts out.png

import { disc, ring, type EmblemData, type EmblemPart } from "../emblem";
import { fmt, ribbon, type Material, type Pt } from "../shapes";

/** The house meeple, centred on (24, 24): 32 wide, 36 tall. */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";

/** Moves a meeple-space point (the 48 box) to where the meeple stands. */
const place = (x: number, y: number, s: number) =>
  `translate(${x} ${y}) scale(${s}) translate(-24 -24)`;

/** A meeple standing at (x, y), `s` of its full size. */
const meeple = (
  x: number,
  y: number,
  s: number,
  m: Material,
  vein?: string,
): EmblemPart => ({
  d: MEEPLE,
  m,
  ink: 1.5 / s,
  vein,
  shine: "M20.5 10.5A4 4 0 0 1 23 8.4M11 22.6Q14 20.6 18 20",
  t: place(x, y, s),
});

/** A point `r` from (24, 24) at `deg` degrees (SVG: clockwise from +x). */
const polar = (r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [24 + Math.cos(a) * r, 24 + Math.sin(a) * r];
};
const arcPts = (r: number, from: number, to: number, n = 20): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => polar(r, from + ((to - from) * i) / n));

/** A curved arrow round (24, 24), clockwise from `a0` to its head. */
function arcArrow(a0: number, a1: number) {
  const outer = arcPts(18, a0, a1);
  const inner = arcPts(12, a1, a0);
  const head = [polar(22.2, a1), polar(15, a1 + 30), polar(7.8, a1)];
  return {
    d: `M${[...outer, ...head, ...inner].map(fmt).join("L")}Z`,
    vein: `M${arcPts(15, a0 + 8, a1 - 4, 12).map(fmt).join("L")}`,
    shine: `M${arcPts(16.6, a0 + 10, a0 + 60, 10).map(fmt).join("L")}`,
  };
}

/** A five-pointed star of radius `r` at (cx, cy). */
const star = (cx: number, cy: number, r: number, inner = 0.42) =>
  `M${Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const q = k % 2 ? r * inner : r;
    return fmt([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
  }).join("L")}Z`;

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** The heart, cracked down the middle: its left and right halves. */
const CRACK = "L21.5 21L26.5 27L22 33L24 42";
const HEART_L = `M24 15C21 9 14 7 9.5 10C4.5 13.5 4.5 21 8 26C11.5 31 18 36 24 42L22 33L26.5 27L21.5 21Z`;
const HEART_R = `M24 15${CRACK}C30 36 36.5 31 40 26C43.5 21 43.5 13.5 38.5 10C34 7 27 9 24 15Z`;

const TAIL = ribbon(
  [
    [37, 37],
    [42, 40],
    [45, 36],
    [44, 30],
    [41.5, 27.5],
  ],
  [4, 3.4, 2.6, 2, 1.4],
);

const BOOM = ribbon(
  [
    [9, 38],
    [12.5, 42],
    [19, 42.8],
    [24, 41.4],
  ],
  [2.6, 2.4, 2.2, 2],
);

const STREAM_A = ribbon(
  [
    [21, 19],
    [22, 12],
    [27, 10],
    [28, 4.5],
  ],
  [3.8, 3.8, 3.4, 2.8],
);
const STREAM_B = ribbon(
  [
    [29, 27],
    [36, 26],
    [38, 20],
    [44, 18],
  ],
  [3.8, 3.8, 3.4, 2.8],
);

export const EMBLEMS: Record<string, EmblemData> = {
  /** A challenge: a gold thunderbolt, a spark either side. */
  "⚡": [
    { d: star(8, 11, 4.2, 0.45) + star(41.5, 37, 3.8, 0.45), m: "silver", ink: 1 },
    {
      d: "M27.5 2.5L7 28H19.5L13 46L42 17H28.5L38 2.5Z",
      vein: "M30.6 6.5L16.5 24M26 23L19.2 39",
      shine: "M27.4 5.4L12 24.4",
    },
  ],

  /** You won: a party popper, streamers and confetti bursting out. */
  "🎉": [
    { d: STREAM_A.outline, m: "crimson", ink: 1.1, shine: STREAM_A.shine },
    { d: STREAM_B.outline, m: "night", ink: 1.1, shine: STREAM_B.shine },
    { d: star(38, 9, 5.2), ink: 1.1 },
    { d: disc(14, 10, 2.6) + disc(43, 31, 2.2), m: "leaf", ink: 1 },
    {
      d: "M5 43.5L16 17.5C21 18.5 28.5 24.5 30.5 32Z",
      m: "ivory",
      vein: "M9.4 33.2L20 37.8M12.6 25.6L25 34.6",
      shine: "M8 39L15.6 21",
    },
    {
      d: "M16 17.5C21 18.5 28.5 24.5 30.5 32C26.5 33 18 27 16 17.5Z",
      m: "flame",
      ink: 1.2,
    },
  ],

  /** The Handler: headphones on a silver band, a mic at the cheek. */
  "🎧": [
    {
      d: "M5 30A19 19 0 0 1 43 30H37.4A13.4 13.4 0 0 0 10.6 30Z",
      m: "silver",
      vein: "M7.8 28.6A16.2 16.2 0 0 1 40.2 28.6",
      shine: "M10 20A15 15 0 0 1 20 11",
    },
    { d: BOOM.outline, m: "iron", ink: 1.1 },
    { d: rrect(4, 25, 10, 18, 4), m: "iron", shine: "M6.6 29V38" },
    { d: rrect(34, 25, 10, 18, 4), m: "iron" },
    { d: rrect(6.5, 28.5, 5, 11, 2.5) + rrect(36.5, 28.5, 5, 11, 2.5), ink: 1 },
    { jewel: "ruby", x: 25.4, y: 41.2, r: 2.6 },
  ],

  /** A mission begins: a clapperboard, its striped arm raised. */
  "🎬": [
    {
      d: rrect(5, 20, 38, 24, 2),
      m: "iron",
      vein: "M9 29H39M9 36H39M24 29V43",
      shine: "M7.4 23V41",
    },
    {
      d: "M5 15H43V20.5H5Z",
      m: "ivory",
      ink: 1.3,
    },
    { dark: "M9 15.5H14L11 20H6ZM19 15.5H24L21 20H16ZM29 15.5H34L31 20H26ZM39 15.5H42.5V16.5L40 20H36Z" },
    {
      d: "M5 13.5L41 3L42.5 8.2L6.5 18.7Z",
      m: "ivory",
      ink: 1.3,
    },
    {
      dark: "M10.4 12L15.3 10.6L17.5 15.3L12.6 16.7ZM20.2 9.2L25.1 7.8L27.3 12.5L22.4 13.9ZM30 6.4L34.9 5L37.1 9.7L32.2 11.1Z",
    },
    { d: disc(6.5, 16.5, 2.6), ink: 1.1 },
  ],

  /** The moles: a rat in iron, ear up and tail curled. */
  "🐀": [
    {
      d: TAIL.outline,
      m: "ivory",
      ink: 1.1,
    },
    {
      d: "M3.5 33.5C6 28.5 11 23.5 17 22C21.5 19.5 27 19 32 21C38.5 23.5 41.5 30 40.5 36C40 40 36.5 42 32.5 42H16C11 42 7.5 37.5 3.5 33.5Z",
      m: "iron",
      vein: "M25 25Q31 25 35 30",
      shine: "M9 28.5Q14 23.5 20 22.6",
    },
    {
      d: "M12 42.5Q12 38.5 15.5 38.5Q18.5 38.5 18 42.5ZM28 42.5Q28 38.5 31.5 38.5Q34.5 38.5 34 42.5Z",
      m: "iron",
      ink: 1.1,
    },
    { d: disc(18.5, 20, 5), m: "ivory", ink: 1.3, vein: "M15.6 21.6A3 3 0 0 1 18.6 17.4" },
    { dark: disc(11.4, 28.6, 1.3) + disc(4.4, 33.4, 1.5) },
  ],

  /** The Enforcer: a fist in a gold knuckle-duster. */
  "👊": [
    {
      d: "M10 20H38.5V35Q38.5 41 32.5 41H16Q10 41 10 35Z",
      m: "ivory",
    },
    {
      d:
        rrect(10, 8, 7.4, 20, 3.7) +
        rrect(17.2, 6.5, 7.4, 21, 3.7) +
        rrect(24.4, 6.5, 7.4, 21, 3.7) +
        rrect(31.6, 8.5, 7.4, 19, 3.7),
      m: "ivory",
      shine: "M12.3 12V18",
    },
    {
      d: "M7.5 30.5Q7 25 12.5 24.5H27Q31 24.5 31 28Q31 31.5 27 31.5H12.5Q9 32 7.5 30.5Z",
      m: "ivory",
      vein: "M24 26.5Q26 28 24 30",
    },
    {
      d: rrect(8.5, 13, 32, 7, 2.5),
      vein: "M17.2 13V20M24.4 13V20M31.6 13V20",
      shine: "M11 15H38",
    },
    {
      d: "M14 40H35V45H14Z",
      m: "crimson",
      ink: 1.3,
    },
  ],

  /** The steal: a crimson coin purse, its gold clasp kissing shut. */
  "👛": [
    { d: disc(20.6, 10, 3.6) + disc(27.4, 10, 3.6), ink: 1.2 },
    {
      d: "M8 21C9 31 6 42 14 43H34C42 42 39 31 40 21Z",
      m: "crimson",
      vein: "M11 27Q24 31 37 27",
      shine: "M10.5 26Q10 33 12 39",
    },
    {
      d: "M6.5 21Q6.5 14 14 13.5H34Q41.5 14 41.5 21Q41.5 23.5 39 23.5H9Q6.5 23.5 6.5 21Z",
      vein: "M9 19Q10 16.5 14 16.3H34Q38 16.5 39 19",
      shine: "M9.4 18.4Q10.4 15.6 14 15.4H22",
    },
    { jewel: "emerald", x: 24, y: 33, r: 3.2 },
  ],

  /** The Auntie: a meeple with her hair in a bun, a fringed shawl
   *  round her shoulders and a handbag on her arm. */
  "👵": [
    { d: disc(23, 7.6, 3.8), m: "silver", ink: 1.2, vein: "M20.6 6.4Q23 5 25.4 6.4" },
    meeple(23, 26, 0.9, "ivory"),
    {
      d: "M7 23.6C8 20 13.5 18.4 19 17.4H27C32.5 18.4 38 20 39 23.6C38.6 26.4 34.4 28 30.4 29L23 37L15.6 29C11.6 28 7.4 26.4 7 23.6Z",
      m: "crimson",
      vein: "M9 26.2L8.4 28.4M12 27.6L11.6 29.8M15.6 29L15.2 31.4M37 26.2L37.6 28.4M34 27.6L34.4 29.8M30.4 29L30.8 31.4M18.6 32.4L18 34.6M27.4 32.4L28 34.6",
      shine: "M10 22.6Q14 19.8 19 19.2",
    },
    {
      d: "M34 31V28Q34 24.5 38 24.5Q42 24.5 42 28V31H40V28Q40 26.5 38 26.5Q36 26.5 36 28V31Z",
      ink: 1.1,
    },
    {
      d: rrect(31.5, 30, 13, 11, 2.5),
      m: "wood",
      vein: "M31.5 34H44.5",
      shine: "M33.6 36V39",
    },
    { d: disc(38, 34, 1.5), ink: 0.9 },
  ],

  /** A lost card: a crimson heart cracked in two. */
  "💔": [
    {
      d: HEART_L,
      m: "crimson",
      shine: "M8.4 20Q8.6 13.6 13.6 12",
      t: "rotate(-9 24 42) translate(-1.2 0)",
    },
    {
      d: HEART_R,
      m: "crimson",
      vein: "M36 14Q39.4 16 39.2 20",
      t: "rotate(9 24 42) translate(1.2 0)",
    },
  ],

  /** The day job: a leather briefcase, gold handle and clasps. */
  "💼": [
    {
      d: "M17 16V11Q17 7.5 20.5 7.5H27.5Q31 7.5 31 11V16H27.8V11.6Q27.8 10.7 26.9 10.7H21.1Q20.2 10.7 20.2 11.6V16Z",
      shine: "M18.6 14V11.4Q18.6 9.2 20.6 9.2",
    },
    {
      d: rrect(4.5, 15, 39, 28, 3.5),
      m: "wood",
      vein: "M4.5 25H43.5",
      shine: "M7.4 19V39",
    },
    {
      d: rrect(11, 22, 5, 7, 1) + rrect(32, 22, 5, 7, 1),
      ink: 1.1,
    },
    { d: rrect(20, 21.5, 8, 8, 1.5), ink: 1.2, vein: "M24 24V27" },
  ],

  /** A swap: two arrows chasing round, gold and silver. */
  "🔄": [
    { ...arcArrow(195, 318), m: "gold" },
    { ...arcArrow(195, 318), m: "silver", t: "rotate(180 24 24)" },
  ],

  /** The Boss: a meeple in a dark suit, gold top hat and cane. */
  "🕴": [
    meeple(22, 28.5, 0.86, "iron"),
    { d: "M22 18.6L18.6 21.6L22 30L25.4 21.6Z", m: "ivory", ink: 1 },
    { d: "M22 21L20.8 22.4L22 28.4L23.2 22.4Z", m: "crimson", ink: 0.8 },
    {
      d: "M16.5 3.5H27.5V12H31Q32 12 32 13Q32 14.5 30.5 14.5H13.5Q12 14.5 12 13Q12 12 13 12H16.5Z",
      vein: "M16.5 9.4H27.5",
      shine: "M18.6 5.4V10",
    },
    {
      d: "M36.5 22.5Q36.5 19 39.5 19Q42.5 19 42.5 22V44H40.4V22.2Q40.4 21 39.5 21Q38.5 21 38.5 22.5Z",
      ink: 1.1,
    },
  ],

  /** A field agent: a meeple in a belted trench coat and fedora,
   *  a magnifying glass in hand. */
  "🕵": [
    meeple(
      21,
      27.5,
      0.88,
      "gold",
      "M24 18.2L20 23M24 18.2L28 23M24 27.5V35",
    ),
    { d: "M13 29.5H29V32.5H13Z", m: "wood", ink: 1 },
    {
      d: "M14 13.5Q12 13.5 12.5 12Q13.5 10.5 16.5 10.5Q17 5 21 5Q25 5 25.5 10.5Q28.5 10.5 29.5 12Q30 13.5 28 13.5Z",
      m: "iron",
      vein: "M16.6 9.6H25.4",
      shine: "M18.8 8.4Q19.4 6.6 21 6.4",
    },
    {
      d: "M39.6 33.2L42 31.2L46 37.4Q46.4 39.4 44.4 39.8Z",
      m: "wood",
      ink: 1.1,
    },
    { d: disc(36.5, 26.5, 5.4), m: "night", ink: 0, shine: "M33.6 25A3.4 3.4 0 0 1 35.4 23.2" },
    { d: ring(36.5, 26.5, 7.6, 5.4), evenOdd: true, m: "silver", ink: 1.2 },
  ],

  /** The Bodyguard: a heater shield, gold-rimmed, silver and blue. */
  "🛡": [
    {
      d: "M24 7.5C29 10 34 11 38 11V22C38 31.5 31.5 37.5 24 41C16.5 37.5 10 31.5 10 22V11C14 11 19 10 24 7.5Z",
      m: "silver",
      shine: "M13 14V22Q13 28 16.4 32",
    },
    {
      d: "M24 7.5C29 10 34 11 38 11V22C38 31.5 31.5 37.5 24 41Z",
      m: "night",
      ink: 0,
    },
    {
      d: "M24 3.5C30 6.5 36 7.5 42 7.5V22C42 34 33.5 41 24 45C14.5 41 6 34 6 22V7.5C12 7.5 18 6.5 24 3.5Z" +
        "M24 7.5C19 10 14 11 10 11V22C10 31.5 16.5 37.5 24 41C31.5 37.5 38 31.5 38 22V11C34 11 29 10 24 7.5Z",
      evenOdd: true,
      shine: "M8.4 10V22Q8.4 28 11 32",
    },
    { d: "M22.5 8.4H25.5V40H22.5Z", ink: 1 },
    { jewel: "ruby", x: 24, y: 22, r: 4 },
  ],

  /** Rough-up: a crimson boxing glove, white laced cuff. */
  "🥊": [
    {
      d: "M14 34.5C9 35 5.5 32 5.5 27.5C5.5 23 8.5 20.5 12 21C14.5 21.4 15.6 23.4 16 26Z",
      m: "crimson",
      shine: "M7.6 27Q7.8 23.8 10.6 23",
    },
    {
      d: "M13 34C9.5 26 9 16 14 10.5C18 6 27 4.5 33.5 7C40.5 9.5 43 16.5 42 23.5C41.5 28.5 39 32 35.5 34Z",
      m: "crimson",
      vein: "M17 19Q26 14.5 37 17.5",
      shine: "M14 22Q13.6 14.5 18.4 10.6",
    },
    {
      d: "M12 33.5H36.5V43.5Q36.5 45 35 45H13.5Q12 45 12 43.5Z",
      m: "ivory",
      vein: "M21 36.5L27 40M27 36.5L21 40M21 40L27 43.5M27 40L21 43.5",
      shine: "M14.4 36V42.6",
    },
  ],

  /** The Pickpocket: a dark leather glove, fingers spread, gold cuff. */
  "🧤": [
    {
      d: "M15 38L13.5 30.5L7 23.6A2.8 2.8 0 0 1 11 19.7L15.5 24.2L14.6 11A2.8 2.8 0 0 1 20.2 11L20.6 21.5L20.8 7A2.8 2.8 0 0 1 26.4 7L26.6 21.5L27 8.6A2.8 2.8 0 0 1 32.6 8.6L32.4 22.4L33.6 13A2.5 2.5 0 0 1 38.6 13.2L37.8 27C37.4 32 35.6 35 34 38Z",
      m: "iron",
      vein: "M19.4 27.5V33.5M24.6 27.5V33.5M29.8 27.5V33.5",
      shine: "M16.6 12.6L17.2 22",
    },
    {
      d: "M14 36.5H35L36.6 44.5H12.4Z",
      vein: "M13.4 40.5H35.6",
      shine: "M15.6 38.4H22",
    },
    { jewel: "ruby", x: 24.5, y: 40.5, r: 2.2 },
  ],

  /** Rent or tax: a gold coin on its edge, milled rim, a star. */
  "🪙": [
    {
      d: disc(24, 26.5, 18.5),
      vein: Array.from({ length: 9 }, (_, i) => {
        const x = 24 + Math.cos(Math.PI * (0.1 + i * 0.1)) * 18.5;
        const y = 26.5 + Math.sin(Math.PI * (0.1 + i * 0.1)) * 18.5;
        return `M${x.toFixed(2)} ${(y - 3.4).toFixed(2)}V${(y - 0.4).toFixed(2)}`;
      }).join(""),
    },
    {
      d: disc(24, 22.5, 18.5),
      vein: "M38.4 22.5A14.4 14.4 0 1 1 38.4 22.4",
      shine: "M10 18A14.6 14.6 0 0 1 19.5 8.6",
    },
    { d: star(24, 22.5, 8.6), m: "silver", ink: 1.1 },
  ],

  /** Borrowing: an open hand held out palm up, a coin on offer. */
  "🫴": [
    {
      d: "M3.5 26.5H12.5V42H3.5Z",
      m: "night",
      vein: "M3.5 30H12.5",
      ink: 1.3,
    },
    {
      d: "M12 29C18 31 24 32 30 31L40.5 29.3C43.6 28.9 45 32 42.8 33.6C37.5 37.2 30 40 22 40.5L12 40Z",
      m: "ivory",
      vein: "M27 36.6Q34 35.2 41 32.4M24 38.6Q31 37.8 37.6 35.4",
      shine: "M15 31.6Q20 33 25 33.2",
    },
    {
      d: "M14.5 30C13.5 25 15.5 21 18.6 20.4C21.2 20 22.6 22.4 21.6 24.6L19.6 31.2Z",
      m: "ivory",
      ink: 1.3,
    },
    {
      d: disc(31, 18.5, 7),
      vein: "M36 18.5A5 5 0 1 1 36 18.4",
      shine: "M26.4 17.2A4.8 4.8 0 0 1 29.4 13.6",
    },
    { d: star(43, 9.5, 3.2), m: "silver", ink: 0.9 },
  ],
};

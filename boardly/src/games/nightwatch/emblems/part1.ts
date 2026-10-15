// Seal the Manor's icons in the house style, first half: the lantern,
// the mask, the bricks and the rest of what the game's text is written
// with, from night to eye. Plain emblem data in a 48 × 48 box (see
// components/engraved/emblem.ts); look them over with
//   node scripts/emblem-sheet.mjs src/games/nightwatch/emblems/part1.ts out.png

import type { IconName } from "../icons";
import { disc, ring, type EmblemData } from "@/components/engraved/emblem";
import { FEATHER } from "@/components/engraved/shapes";

/** A meeple, centred on (24, 24), 32 wide and 36 tall. */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";

/** A shoe print, sole and heel, its sole's top at (x, y). */
const print = (x: number, y: number) =>
  `M${x} ${y}C${x + 4.6} ${y} ${x + 6.6} ${y + 4.4} ${x + 6.6} ${y + 9}C${x + 6.6} ${y + 13.6} ${x + 4.4} ${y + 17} ${x + 0.4} ${y + 17}C${x - 3.6} ${y + 17} ${x - 6.4} ${y + 14} ${x - 6.4} ${y + 9}C${x - 6.4} ${y + 4} ${x - 4} ${y} ${x} ${y}Z` +
  `M${x - 5.4} ${y + 19.5}H${x + 5.6}V${y + 22.5}A5.5 4.5 0 0 1 ${x - 5.4} ${y + 22.5}Z`;

/** The light behind the chapel's cross: a twelve-pointed burst. */
const RAYS = `M${Array.from({ length: 24 }, (_, i) => {
  const t = ((i * 15 - 90) * Math.PI) / 180;
  const r = i % 2 ? 9.5 : 16.5;
  return `${(24 + Math.cos(t) * r).toFixed(2)} ${(17 + Math.sin(t) * r).toFixed(2)}`;
}).join("L")}Z`;

/** The thumb: a fist in its cuff, thumb up. */
const THUMB: EmblemData = [
  {
    d: "M14 22.5L20 20.5L24.6 9.2C25.3 7.4 26.8 6 28.6 6C31.2 6 32.8 8.2 32.4 11L31.2 19.5H39.8C42.6 19.5 44.3 21.8 43.8 24.4L41.2 39.6C40.8 42 39 43.5 36.6 43.5H14Z",
    m: "tint",
    vein: "M31.4 26.8H42.6M31.2 32.6H41.6M31 38.2H40.6",
    shine: "M26.6 10.4L22.4 21.6",
  },
  {
    d: "M5.5 21H14.5V45H5.5Z",
    vein: "M5.5 25H14.5M5.5 41H14.5",
    shine: "M8 27V39",
  },
];
const KEY = "translate(24 24) scale(1.12) rotate(-45) translate(-24 -24)";
const FLIP = "translate(0 48) scale(1 -1)";

export const EMBLEMS: Partial<Record<IconName, EmblemData>> = {
  /** A night: the watch's lantern, its flame lit behind dark glass. */
  night: [
    { d: ring(24, 5.5, 3, 1.4), evenOdd: true, ink: 1.1 },
    { d: "M14 12.5H34V36H14Z", m: "night" },
    {
      d: "M24 15C29.4 21 31 25 31 28.4A7 7 0 0 1 17 28.4C17 25 18.6 21 24 15Z",
      m: "flame",
      shine: "M21.4 27.6A3 3 0 0 1 22.6 24",
      ink: 1.2,
    },
    {
      d: "M10 13.5L16 7.5H32L38 13.5ZM10 13H15.5V36H10ZM32.5 13H38V36H32.5Z",
      shine: "M12.2 16V33",
    },
    {
      d: "M8 35H40V37.5L35 43H13L8 37.5Z",
      vein: "M9.5 37.6H38.5",
      ink: 1.4,
    },
  ],

  /** A role, a decoy: a masquerade mask on its stick, plumed. */
  mask: [
    {
      d: FEATHER(17, 3.6),
      m: "ivory",
      ink: 1.1,
      t: "translate(37 17.5) rotate(30)",
      vein: "M0 -2V-15",
    },
    {
      d: FEATHER(15, 3.2),
      m: "ivory",
      ink: 1.1,
      t: "translate(34 17) rotate(6)",
      vein: "M0 -2V-13",
    },
    { d: "M32.5 30L35.6 29L41.8 43.2Q40.4 45 38.6 44.2Z", m: "wood", ink: 1.2 },
    {
      d: "M24 21C28 16 36 14 43 16C44 23 40.5 31 33 31.5C29 31.8 26 29.5 24 27.5C22 29.5 19 31.8 15 31.5C7.5 31 4 23 5 16C12 14 20 16 24 21Z",
      vein: "M24 24.2C27.6 20 34.4 18.2 40.4 19.2M24 24.2C20.4 20 13.6 18.2 7.6 19.2",
      shine: "M7.4 21.4Q8.4 26.6 12.6 28.6",
    },
    {
      dark: "M9.5 22.5Q15 18 20.5 23Q15 26.6 9.5 22.5ZM38.5 22.5Q33 18 27.5 23Q33 26.6 38.5 22.5Z",
    },
    { jewel: "ruby", x: 24, y: 24.5, r: 2.4 },
  ],

  /** A collapse: a brick wall, three courses in mortar. */
  bricks: [
    { d: "M4.5 8.5H43.5V40.5H4.5Z", m: "ivory", ink: 1.4 },
    {
      d:
        "M6 10H16.5V18.8H6ZM18 10H30V18.8H18ZM31.5 10H42V18.8H31.5Z" +
        "M6 20.3H10.5V29.7H6ZM12 20.3H23.2V29.7H12ZM24.8 20.3H36V29.7H24.8ZM37.5 20.3H42V29.7H37.5Z" +
        "M6 31.2H16.5V39H6ZM18 31.2H30V39H18ZM31.5 31.2H42V39H31.5Z",
      m: "crimson",
      ink: 1.1,
      shine: "M19.5 12H28.5M13.5 22.3H21.6",
    },
  ],

  /** Walking: a meeple striding on, a rush of air behind it. */
  walk: [
    {
      d: "M3 15.5H12.5Q14.4 17 12.5 18.5H3ZM5 22.5H11Q12.9 24 11 25.5H5ZM3 29.5H10.5Q12.4 31 10.5 32.5H3Z",
      m: "silver",
      ink: 1.1,
    },
    {
      d: MEEPLE,
      t: "translate(28 24.5) rotate(12) scale(0.9) translate(-24 -24)",
      ink: 1.6,
      shine: "M20.5 10.5A4 4 0 0 1 23 8.4M11 22.6Q14 20.6 18 20",
    },
  ],

  /** A door: arched oak in a gold frame, iron-strapped. */
  door: [
    {
      d: "M13 44V20.5A11 11 0 0 1 35 20.5V44Z",
      m: "wood",
      vein: "M18.5 11.6V44M24 9.6V44M29.5 11.6V44",
    },
    { d: "M13 26.5H35V29.5H13Z", m: "iron", ink: 1.2 },
    { d: "M13 36.5H35V39.5H13Z", m: "iron", ink: 1.2 },
    { d: ring(30.5, 33, 2.8, 1.4), evenOdd: true, ink: 1.1 },
    {
      d: "M9 44V20A15 15 0 0 1 39 20V44H35V20.5A11 11 0 0 0 13 20.5V44Z",
      shine: "M11 19A13 13 0 0 1 17 9",
    },
    { d: "M6.5 43.5H41.5V46.5H6.5Z", m: "silver", ink: 1.2 },
  ],

  /** A letter, the gallery: a gilt frame round a moonlit hill. */
  frame: [
    { d: "M10 12H38V36H10Z", m: "night", ink: 0 },
    { d: disc(31, 19, 3), m: "ivory", ink: 1 },
    { d: "M10 36V29L17.5 21.5L24 28L29 23.5L38 31.5V36Z", m: "leaf", ink: 1.1 },
    {
      d: "M5 7H43V41H5ZM11 13V35H37V13Z",
      evenOdd: true,
      vein: "M8 10H40V38H8Z",
      shine: "M7 32V10H30",
    },
  ],

  /** The library: an open book in a red cover. */
  book: [
    {
      d: "M3 13H7.5V37.5C14 37 20 37.5 24 40.5C28 37.5 34 37 40.5 37.5V13H45V41.5H27.5Q24 44 20.5 41.5H3Z",
      m: "crimson",
      ink: 1.4,
    },
    {
      d: "M24 13C19 9 12.5 8.5 6 9.5V37C12.5 36 19 36.5 24 40Z",
      m: "ivory",
      vein: "M10 15.5Q15 14.5 20.5 16.5M10 21Q15 20 20.5 22M10 26.5Q15 25.5 20.5 27.5",
      shine: "M8.4 12V33",
    },
    {
      d: "M24 13C29 9 35.5 8.5 42 9.5V37C35.5 36 29 36.5 24 40Z",
      m: "ivory",
      vein: "M27.5 16.5Q33 14.5 38 15.5M27.5 22Q33 20 38 21M27.5 27.5Q33 25.5 38 26.5",
    },
  ],

  /** A mission: a target, red and white in a gold rim. */
  target: [
    {
      d: ring(24, 24, 21, 17.5),
      evenOdd: true,
      shine: "M8.2 17A17 17 0 0 1 17 8.2",
    },
    { d: disc(24, 24, 17.5), m: "crimson", ink: 1.2 },
    { d: disc(24, 24, 12.5), m: "ivory", ink: 1.2 },
    { d: disc(24, 24, 7.5), m: "crimson", ink: 1.2 },
    { jewel: "ruby", x: 24, y: 24, r: 3.4 },
  ],

  /** The bell: gold, on a silver rim, its clapper swinging. */
  bell: [
    { d: ring(24, 5.5, 3, 1.4), evenOdd: true, m: "silver", ink: 1.1 },
    { d: disc(26, 41.5, 3.4), m: "iron", ink: 1.2 },
    {
      d: "M24 7.5C31 7.5 34 13 34 19.5C34 27 36 31 40.5 34.5H7.5C12 31 14 27 14 19.5C14 13 17 7.5 24 7.5Z",
      vein: "M14.6 24H33.4M13.4 29H34.6",
      shine: "M17.6 27Q17 18 20 12.6",
    },
    {
      d: "M6.5 33.5H41.5Q43.5 33.5 43.5 35.5V36.5Q43.5 38.5 41.5 38.5H6.5Q4.5 38.5 4.5 36.5V35.5Q4.5 33.5 6.5 33.5Z",
      m: "silver",
      ink: 1.3,
    },
  ],

  /** A notice: parchment on gold rollers, sealed in red. */
  scroll: [
    {
      d: "M14 10H34Q32.5 24 34 38H14Q15.5 24 14 10Z",
      m: "ivory",
      vein: "M18 16.5H30M18 21H30M18 25.5H27M18 30H24",
    },
    ...[9, 39].flatMap((y): EmblemData => [
      { d: disc(10.5, y, 2.2) + disc(37.5, y, 2.2), m: "wood", ink: 1.2 },
      {
        d: `M13 ${y - 3}H35A3 3 0 0 1 35 ${y + 3}H13A3 3 0 0 1 13 ${y - 3}Z`,
        shine: `M14 ${y - 1.4}H33`,
      },
    ]),
    { d: "M28.4 35L26.8 42.5L29.2 41L30.8 43L31.6 35Z", m: "crimson", ink: 1 },
    { jewel: "ruby", x: 30, y: 33.5, r: 4 },
  ],

  /** A ghost: a sheet with nobody in it but two dark holes. */
  ghost: [
    {
      d: "M9 42V21A15 15 0 0 1 39 21V42C37 44.5 35.4 44.5 33.8 41.6C32.4 39 30.6 39 29.2 41.8C27.8 44.6 25.6 44.6 24 41.8C22.4 39 20.6 39 19 41.8C17.6 44.6 15.6 44.6 14.2 41.8C12.8 39 10.8 39.6 9 42Z",
      m: "ivory",
      vein: "M17 30Q16.4 35 17.6 39.6M31 30Q31.6 35 30.4 39.6",
      shine: "M12.4 26A12 12 0 0 1 17.6 11",
    },
    {
      dark: "M16.4 20.5A2.7 3.6 0 1 0 21.8 20.5A2.7 3.6 0 1 0 16.4 20.5ZM26.2 20.5A2.7 3.6 0 1 0 31.6 20.5A2.7 3.6 0 1 0 26.2 20.5Z",
    },
  ],

  /** Following: two shoe prints, one after the other. */
  steps: [
    {
      d: print(14.5, 3),
      t: "rotate(-8 14.5 15)",
      shine: "M10.2 9A5 5 0 0 1 13 5.2",
    },
    {
      d: print(33.5, 18),
      t: "rotate(8 33.5 30)",
      shine: "M29.2 24A5 5 0 0 1 32 20.2",
    },
  ],

  /** The crown: gold points, jewels on its band. */
  crown: [
    {
      d: "M8 35L4.5 14.5L15.5 23.5L24 8.5L32.5 23.5L43.5 14.5L40 35Z",
      vein: "M24 14V33M15.5 28V33M32.5 28V33",
      shine: "M7.6 18L10 32",
    },
    {
      d: disc(4.5, 13.5, 2.6) + disc(24, 7, 2.8) + disc(43.5, 13.5, 2.6),
      ink: 1.2,
    },
    {
      d: "M8 33.5H40Q41.5 33.5 41.5 35V41Q41.5 42.5 40 42.5H8Q6.5 42.5 6.5 41V35Q6.5 33.5 8 33.5Z",
      shine: "M9 35.6H38",
    },
    { jewel: "sapphire", x: 14, y: 38, r: 2.3 },
    { jewel: "ruby", x: 24, y: 38, r: 2.8 },
    { jewel: "emerald", x: 34, y: 38, r: 2.3 },
  ],

  /** Prayer: a gold cross in a burst of light. */
  pray: [
    { d: RAYS, m: "ivory", ink: 1.2 },
    {
      d: "M21 3H27V14H37V20H27V44.5H21V20H11V14H21Z",
      vein: "M24 6V11.5M24 23V41.5M14 17H18.5M29.5 17H34",
      shine: "M22.5 23V41",
    },
    { jewel: "ruby", x: 24, y: 17, r: 2.8 },
  ],

  /** The vote: a ballot, ticked, going into an oak box. */
  ballot: [
    { d: "M15 4H33V24H15Z", m: "ivory", shine: "M16.8 6V20" },
    { d: "M17.5 13.5L21 17L29 9L31.5 11.5L21 22L15 16Z", m: "leaf", ink: 1.1 },
    {
      d: "M7 24H41V43.5H7Z",
      m: "wood",
      vein: "M7 30.5H41M7 37H41",
    },
    {
      d: "M5 20.5H43V25.5H5Z",
      shine: "M7 22.2H13",
    },
    { dark: "M15 22.2H33V23.8H15Z" },
  ],

  /** A dagger: a steel blade on a gold guard. */
  dagger: [
    {
      d: "M24 2.5L28.2 9.5V28.5H19.8V9.5Z",
      m: "silver",
      vein: "M24 7V26.5",
      shine: "M21.6 11V26.5",
    },
    {
      d: "M21.5 32H26.5V39.5H21.5Z",
      m: "wood",
      vein: "M21.5 34.5H26.5M21.5 37H26.5",
      ink: 1.2,
    },
    {
      d: "M11 28H37Q40 28 40 30.2Q40 32.4 37 32.4H11Q8 32.4 8 30.2Q8 28 11 28Z",
      shine: "M11 29.4H22",
    },
    { d: disc(24, 42, 3.4), ink: 1.2 },
    { jewel: "ruby", x: 24, y: 42, r: 2 },
  ],

  /** A key: an old iron key, a ruby in its bow. */
  key: [
    {
      d: "M22.4 21H25.6V42.5Q24 44.5 22.4 42.5Z",
      m: "silver",
      vein: "M24 23V41",
      t: KEY,
    },
    { d: "M25.6 33H31V35.5H29V37.5H31V40.5H25.6Z", m: "silver", t: KEY },
    { d: "M20 18.6H28V22H20Z", t: KEY },
    {
      d: "M20 7A4 4 0 1 1 28 7A4 4 0 1 1 28 15A4 4 0 1 1 20 15A4 4 0 1 1 20 7Z",
      shine: "M17.6 9.6A3.4 3.4 0 0 1 20.4 5",
      t: KEY,
    },
    { jewel: "ruby", x: 24, y: 11, r: 2.9, t: KEY },
  ],

  /** The cellar: a ladder down into a stone-rimmed hole. */
  hole: [
    {
      d: "M4 33A20 9 0 1 0 44 33A20 9 0 1 0 4 33ZM9.5 33A14.5 5.5 0 1 0 38.5 33A14.5 5.5 0 1 0 9.5 33Z",
      m: "silver",
      evenOdd: true,
    },
    { dark: "M9.5 33A14.5 5.5 0 1 0 38.5 33A14.5 5.5 0 1 0 9.5 33Z" },
    {
      d: "M16.5 4H20V35H16.5ZM28 4H31.5V35H28ZM20 9H28V12H20ZM20 17H28V20H20ZM20 25H28V28H20Z",
      m: "wood",
      ink: 1.2,
      shine: "M17.6 6V30",
    },
    {
      d: "M4 33A20 9 0 0 0 44 33H38.5A14.5 5.5 0 0 1 9.5 33Z",
      m: "silver",
      vein: "M14 39.4L15.2 36.4M24 41.4V38.5M34 39.4L32.8 36.4",
      shine: "M7 36.6Q12 40.6 19 41.4",
    },
  ],

  /** Locked: a gold padlock on a steel shackle. */
  lock: [
    {
      d: "M14 25V16A10 10 0 0 1 34 16V25H30V16A6 6 0 0 0 18 16V25Z",
      m: "silver",
      shine: "M16.3 14A8 8 0 0 1 21 8.6",
    },
    {
      d: "M14 22H34Q38 22 38 26V40Q38 44 34 44H14Q10 44 10 40V26Q10 22 14 22Z",
      vein: "M15 25.5H33Q34.5 25.5 34.5 27V39Q34.5 40.5 33 40.5H15Q13.5 40.5 13.5 39V27Q13.5 25.5 15 25.5Z",
      shine: "M12.2 27V37",
    },
    {
      dark: "M24 28.5A3 3 0 0 1 25.6 34L26.6 38.5H21.4L22.4 34A3 3 0 0 1 24 28.5Z",
    },
  ],

  /** The notebook: blue boards on a gold spine, a label on the front. */
  notebook: [
    { d: "M14 6.5H41.5V42.5H14Z", m: "ivory", ink: 1.2, vein: "M41.5 10V39" },
    {
      d: "M12 4H36.5Q39.5 4 39.5 7V41Q39.5 44 36.5 44H12Z",
      m: "night",
      shine: "M37 8V22",
    },
    {
      d: "M17.5 12H34V22H17.5Z",
      m: "ivory",
      ink: 1.2,
      vein: "M20.5 15.6H31M20.5 18.6H28",
    },
    {
      d: "M7.5 4H14V44H7.5Z",
      vein: "M7.5 10H14M7.5 38H14",
      shine: "M9.4 13V35",
    },
  ],

  /** Yes: a thumb up, in the colour it's shown in. */
  up: THUMB,

  /** No: a thumb down. */
  down: THUMB.map((part) => ({ ...part, t: FLIP })),

  /** Watching: a gold-lidded eye, a sapphire for its iris. */
  eye: [
    {
      d: "M3 24C10 13.5 17 10 24 10C31 10 38 13.5 45 24C38 34.5 31 38 24 38C17 38 10 34.5 3 24ZM8.5 24C13 17.5 18 15 24 15C30 15 35 17.5 39.5 24C35 30.5 30 33 24 33C18 33 13 30.5 8.5 24Z",
      evenOdd: true,
      shine: "M8.4 19.6Q14 12.4 22 11.4",
    },
    {
      d: "M8.5 24C13 17.5 18 15 24 15C30 15 35 17.5 39.5 24C35 30.5 30 33 24 33C18 33 13 30.5 8.5 24Z",
      m: "ivory",
      ink: 0,
    },
    { jewel: "sapphire", x: 24, y: 24, r: 7.4 },
    { dark: disc(24, 24, 2.8) },
  ],
};

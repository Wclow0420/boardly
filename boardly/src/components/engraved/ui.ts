// The app's everyday icons as engraved emblems (data; see ./emblem):
// the bell, search, add, sort, arrows, more, info, bot, copy, link, mail
// and star. components/icons draws them under their old names.

import { disc, ring, type EmblemData } from "./emblem";

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";

/** A chain link, centred on (cx, 24), lying flat. */
const link = (cx: number) =>
  rrect(cx - 12, 17, 24, 14, 7) + rrect(cx - 7.5, 21.5, 15, 5, 2.5);

/** Eight flame rays round (24, 24), for the sun. */
const SUN_RAYS = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  const p = (r: number, da: number) =>
    `${(24 + Math.cos(a + da) * r).toFixed(2)} ${(24 + Math.sin(a + da) * r).toFixed(2)}`;
  return `M${p(10, -0.32)}L${p(21.5, 0)}L${p(10, 0.32)}Z`;
}).join("");

/** A five-pointed star of radius 6 at (24, 31.5), for the medal. */
const STAR_SMALL = `M${Array.from({ length: 10 }, (_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5;
  const r = k % 2 ? 2.6 : 6.4;
  return `${(24 + Math.cos(a) * r).toFixed(2)} ${(31.5 + Math.sin(a) * r).toFixed(2)}`;
}).join("L")}Z`;

export const UI_EMBLEMS = {
  bell: [
    { d: ring(24, 6, 2.8, 1.3), evenOdd: true, ink: 1.1 },
    { jewel: "ruby", x: 24, y: 40.5, r: 3.6 },
    {
      d: "M24 7.5C31 7.5 35 12.5 35 19.5V28L39.2 34.4Q40.3 36.6 37.8 36.6H10.2Q7.7 36.6 8.8 34.4L13 28V19.5C13 12.5 17 7.5 24 7.5Z",
      vein: "M12.4 31.6H35.6",
      shine: "M16.8 15Q18 11 21.6 9.8",
    },
  ],
  plus: [
    {
      d: "M20.5 7Q20.5 5.5 22 5.5H26Q27.5 5.5 27.5 7V20.5H41Q42.5 20.5 42.5 22V26Q42.5 27.5 41 27.5H27.5V41Q27.5 42.5 26 42.5H22Q20.5 42.5 20.5 41V27.5H7Q5.5 27.5 5.5 26V22Q5.5 20.5 7 20.5H20.5Z",
      shine: "M23 8.4V18.6M8.4 23H18.6",
    },
    { jewel: "emerald", x: 24, y: 24, r: 3.4 },
  ],
  search: [
    {
      d: "M29 32.5L32.5 29L42.6 39.1Q44.2 40.7 42.6 42.3L42.3 42.6Q40.7 44.2 39.1 42.6Z",
      m: "wood",
      vein: "M34.6 34.6L40.6 40.6",
    },
    {
      d: disc(20, 20, 10),
      m: "silver",
      ink: 0,
      shine: "M13.6 17A7 7 0 0 1 17 13.6",
    },
    {
      d: ring(20, 20, 14, 10),
      evenOdd: true,
      shine: "M8.6 15A12.4 12.4 0 0 1 15 8.6",
    },
  ],
  sort: [
    { d: rrect(6, 9, 36, 7, 3.5), shine: "M10 11.4H38" },
    { d: rrect(6, 20.5, 27, 7, 3.5), m: "silver", shine: "M10 22.9H29" },
    { d: rrect(6, 32, 18, 7, 3.5), m: "wood" },
  ],
  chevronRight: [
    {
      d: "M15 6.5L33.5 24L15 41.5L9.5 36L21.5 24L9.5 12Z",
      shine: "M13 9.6L28.6 24",
    },
  ],
  back: [
    {
      d: "M33 6.5L14.5 24L33 41.5L38.5 36L26.5 24L38.5 12Z",
      shine: "M35 9.6L19.4 24",
    },
  ],
  dots: [
    { d: disc(10, 24, 5), shine: "M7.4 22A3 3 0 0 1 9.6 20.4", ink: 1.3 },
    { d: disc(24, 24, 5), shine: "M21.4 22A3 3 0 0 1 23.6 20.4", ink: 1.3 },
    { d: disc(38, 24, 5), shine: "M35.4 22A3 3 0 0 1 37.6 20.4", ink: 1.3 },
  ],
  info: [
    { d: disc(24, 24, 19), shine: "M9 18A15.6 15.6 0 0 1 18 9" },
    { d: disc(24, 24, 14.5), m: "night", ink: 1.2 },
    {
      d: `${disc(24, 15.5, 3.2)}${rrect(20.6, 21, 6.8, 15, 2)}`,
      m: "ivory",
      ink: 1.1,
    },
  ],
  bot: [
    {
      d: MEEPLE,
      m: "iron",
      vein: "M15.5 28.2H32.5",
      shine: "M20.5 10.5A4 4 0 0 1 23 8.4",
    },
    // its wind-up key
    { d: "M37 20.5H42V23.5H37Z", m: "gold", ink: 1.1 },
    {
      d: `${ring(44, 17.5, 3.4, 1.4)}${ring(44, 26.5, 3.4, 1.4)}`,
      evenOdd: true,
      ink: 1.1,
    },
    { jewel: "sapphire", x: 24, y: 12.5, r: 2.4 },
  ],
  copy: [
    {
      d: rrect(17, 5, 25, 30, 3),
      m: "ivory",
      vein: "M22 13H37M22 18.5H37M22 24H32",
    },
    {
      d: rrect(7, 13, 25, 30, 3),
      m: "ivory",
      vein: "M12 21H27M12 26.5H27M12 32H22",
      shine: "M9.6 16V39",
    },
  ],
  link: [
    {
      d: link(17.5),
      evenOdd: true,
      t: "rotate(-45 24 24)",
      shine: "M8.6 20.6Q8.6 18.6 10.6 18.6",
    },
    { d: link(30.5), evenOdd: true, m: "silver", t: "rotate(-45 24 24)" },
  ],
  mail: [
    {
      d: rrect(5, 11, 38, 27, 3),
      m: "ivory",
      vein: "M6 36L19 24.5M42 36L29 24.5",
    },
    { d: "M5.6 12.4L24 28L42.4 12.4", m: "ivory", ink: 1.5 },
    { jewel: "ruby", x: 24, y: 27.5, r: 4.2 },
  ],
  star: [
    {
      d: "M24 4.5L29.6 17.6L43.6 18.8L33 28.2L36.2 42L24 34.8L11.8 42L15 28.2L4.4 18.8L18.4 17.6Z",
      shine: "M21 13.6L24 7",
      vein: "M24 10L24 30",
    },
  ],
  // ── for emoji the screens used as pictures ──
  die: [
    { d: "M7 15L24 24V43L7 34Z", m: "ivory" },
    { d: "M24 24L41 15V34L24 43Z", m: "ivory" },
    { d: "M24 6L41 15L24 24L7 15Z", m: "ivory", shine: "M11.6 15L24 8.6" },
    {
      jewel: "ruby",
      x: 24,
      y: 15,
      r: 3.2,
      t: "translate(0 6.3) scale(1 0.58)",
    },
    {
      dark: `${disc(19.75, 26.5, 1.9)}${disc(11.25, 31.5, 1.9)}${disc(37.6, 20.6, 1.9)}${disc(32.5, 29, 1.9)}${disc(27.4, 37.4, 1.9)}`,
    },
  ],
  chair: [
    { d: "M14 10H18V27H14ZM30 10H34V27H30Z", m: "wood", ink: 1.3 },
    { d: "M18 15H30V19H18Z", m: "wood", ink: 1.2 },
    {
      d: "M13.5 4.5H34.5Q36 4.5 36 6V10.5H12V6Q12 4.5 13.5 4.5Z",
      m: "wood",
      shine: "M14 7H34",
    },
    { d: "M12 31H16.5V43.5H12ZM31.5 31H36V43.5H31.5Z", m: "wood", ink: 1.3 },
    { d: rrect(9, 25.5, 30, 6.5, 2.5), m: "crimson", shine: "M12 27.6H36" },
  ],
  hand: [
    {
      d: `${rrect(15, 7, 5.6, 20, 2.8)}${rrect(21.2, 4, 5.6, 22, 2.8)}${rrect(27.4, 5.5, 5.6, 21, 2.8)}${rrect(33.4, 10, 5, 17, 2.5)}`,
      m: "ivory",
      t: "rotate(14 24 30)",
      ink: 1.3,
    },
    {
      d: rrect(10, 19, 5.6, 17, 2.8),
      m: "ivory",
      t: "rotate(14 24 30) rotate(-38 13 35)",
      ink: 1.3,
    },
    {
      d: "M14 25Q14 21 18 21H34Q38.5 21 38.5 26V33Q38.5 41 29 41H23Q14 41 14 33Z",
      m: "ivory",
      t: "rotate(14 24 30)",
      shine: "M17 26V34",
    },
    { d: rrect(17, 39.5, 19, 6, 2), t: "rotate(14 24 30)", ink: 1.3 },
  ],
  trophy: [
    {
      d: "M13 9H8.2Q5 9 5.6 13.2Q6.8 20.4 14 21.4V17.8Q9.4 17 9 13.2Q9 12.6 9.6 12.6H13ZM35 9H39.8Q43 9 42.4 13.2Q41.2 20.4 34 21.4V17.8Q38.6 17 39 13.2Q39 12.6 38.4 12.6H35Z",
      ink: 1.2,
    },
    { d: "M21.5 26H26.5V33.5H21.5Z", ink: 1.2 },
    { d: "M13 33H35V36.5H13Z", ink: 1.2 },
    { d: rrect(11, 36, 26, 8, 2), m: "wood", vein: "M17 40H31" },
    {
      d: "M12.5 5H35.5V15Q35.5 27.5 24 27.5Q12.5 27.5 12.5 15Z",
      vein: "M14 8.4H34",
      shine: "M16 11V17Q16.4 21.6 19.6 24",
    },
    { jewel: "ruby", x: 24, y: 16, r: 3.4 },
  ],
  pact: [
    {
      d: MEEPLE,
      m: "silver",
      t: "translate(15 25) scale(0.62) translate(-24 -24)",
      ink: 2.2,
    },
    {
      d: MEEPLE,
      t: "translate(33 25) scale(0.62) translate(-24 -24)",
      ink: 2.2,
    },
    { d: ring(24, 24.6, 3.2, 1.6), evenOdd: true, ink: 1 },
  ],
  sun: [
    { d: SUN_RAYS, m: "flame", ink: 1.2 },
    { d: disc(24, 24, 11), shine: "M16.4 20A8 8 0 0 1 20 16.4" },
  ],
  close: [
    {
      d: "M20.5 7Q20.5 5.5 22 5.5H26Q27.5 5.5 27.5 7V20.5H41Q42.5 20.5 42.5 22V26Q42.5 27.5 41 27.5H27.5V41Q27.5 42.5 26 42.5H22Q20.5 42.5 20.5 41V27.5H7Q5.5 27.5 5.5 26V22Q5.5 20.5 7 20.5H20.5Z",
      m: "silver",
      t: "rotate(45 24 24)",
      shine: "M23 8.4V18.6",
    },
  ],
  check: [
    {
      d: "M5.5 25.5L12 19L20 27L36 9L42.5 15.5L20 40Z",
      shine: "M8.6 25.4L12 22M22 33L38.6 14.6",
    },
  ],
  crown: [
    {
      d: "M7 17L15.5 26L24 11L32.5 26L41 17L37.5 37H10.5Z",
      vein: "M24 18V31",
      shine: "M10 21L14 29",
    },
    { d: rrect(9.5, 34, 29, 7.5, 2), shine: "M12 36.4H36" },
    {
      d: `${disc(7, 15.5, 2.8)}${disc(24, 9.5, 2.8)}${disc(41, 15.5, 2.8)}`,
      ink: 1.2,
    },
    { jewel: "ruby", x: 24, y: 37.8, r: 2.8 },
    { jewel: "sapphire", x: 15, y: 37.8, r: 2.2 },
    { jewel: "sapphire", x: 33, y: 37.8, r: 2.2 },
  ],
  camera: [
    { d: "M16 15L19.5 8.5H28.5L32 15Z", m: "iron", ink: 1.3 },
    {
      d: rrect(5, 14, 38, 27, 4),
      m: "iron",
      vein: "M5.5 20H42.5",
      shine: "M8 17V37",
    },
    { d: ring(24, 28, 10, 6), evenOdd: true, m: "silver" },
    {
      d: disc(24, 28, 6),
      m: "night",
      ink: 1,
      shine: "M20.6 26A4 4 0 0 1 22.6 24",
    },
    { jewel: "ruby", x: 36.5, y: 20.5, r: 2.2 },
  ],
  medal: [
    { d: "M13 4H21L28 22H20ZM35 4H27L20 22H28Z", m: "crimson", ink: 1.2 },
    { d: disc(24, 31.5, 12), shine: "M14.6 27A10 10 0 0 1 19.6 21.8" },
    { d: STAR_SMALL, m: "ivory", ink: 1 },
  ],
  // the wardrobe: an oak cupboard, doors ajar on a hanging coat
  wardrobe: [
    { d: rrect(7, 6, 34, 36, 3), m: "wood", vein: "M24 9V39", shine: "M10 9V38" },
    { d: "M13.6 11H34.4V37H13.6Z", m: "#3A2418", ink: 1 },
    { d: "M24 13.4V16.4M18 21.4Q24 15.4 30 21.4", m: "silver", ink: 0 },
    { line: "M24 13.6V16.4M17.4 21.6L24 16.4L30.6 21.6", color: "#C9D0DA", w: 1.4 },
    { d: "M17.6 21.4H30.4L32 36H16Z", m: "#C2203A", ink: 1.1, round: true },
    { d: "M7 6H16.6L19 42H7Z", m: "wood", t: "skewY(-8) translate(0 1)", ink: 1.2, shine: "M9.6 9V38" },
    { d: "M31.4 6H41V42H29Z", m: "wood", t: "skewY(8) translate(0 -6.6)", ink: 1.2 },
    { d: `${disc(16.4, 25, 1.3)}${disc(31.6, 25, 1.3)}`, ink: 0.8 },
    { d: rrect(5, 41, 38, 3.6, 1.4), m: "wood", ink: 1.1 },
  ],
  // Tic-Tac-Toe's ⭕: a little board, a gold X and a silver O on it
  noughts: [
    { d: rrect(4, 4, 40, 40, 6), m: "wood", vein: "M17.3 7V41M30.7 7V41M7 17.3H41M7 30.7H41", shine: "M7 9V39" },
    { d: "M8.6 6.4L10.8 8.6L13 6.4L15.2 8.6L13 10.8L15.2 13L13 15.2L10.8 13L8.6 15.2L6.4 13L8.6 10.8L6.4 8.6Z", ink: 1, t: "translate(13.4 13.4) scale(1.15) translate(-10.8 -10.8)" },
    { d: ring(24, 24, 5.6, 3), evenOdd: true, m: "silver", ink: 1.1 },
    { d: "M8.6 6.4L10.8 8.6L13 6.4L15.2 8.6L13 10.8L15.2 13L13 15.2L10.8 13L8.6 15.2L6.4 13L8.6 10.8L6.4 8.6Z", ink: 1, t: "translate(34.6 34.6) scale(1.15) translate(-10.8 -10.8)" },
    { d: ring(34.6, 13.4, 5.6, 3), evenOdd: true, m: "silver", ink: 1.1 },
  ],
  ticket: [
    {
      d: "M6 13H42V21A3 3 0 0 0 42 27V35H6V27A3 3 0 0 0 6 21Z",
      m: "ivory",
      t: "rotate(-10 24 24)",
      vein: "M31 15.4V18.6M31 22.4V25.6M31 29.4V32.6M10.5 19.6H26M10.5 24H24M10.5 28.4H21",
    },
    { jewel: "ruby", x: 36.6, y: 24, r: 3.2, t: "rotate(-10 24 24)" },
  ],
} satisfies Record<string, EmblemData>;

export type UiEmblemName = keyof typeof UI_EMBLEMS;
export const EMBLEMS: Record<string, EmblemData> = UI_EMBLEMS;

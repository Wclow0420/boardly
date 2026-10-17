// The lead figure standing on each floor of the lift (the Games tab):
// a game's own leading role, its faceless meeple portrait from the
// game's emblems, and for the two games without roles a meeple drawn
// here in the same style, holding the game's piece. Each is EmblemData
// in a 48 × 48 box, head and shoulders; look them over with
//   node scripts/emblem-sheet.mjs src/features/games/lift/leads.ts out.png LEADS

import { ROLE_EMBLEMS as AVALON } from "@/games/avalon/emblems";
import { ROLE_EMBLEMS as COUP } from "@/games/coup/emblems";
import { ROLE_EMBLEMS as MANOR } from "@/games/manor/emblems";
import { ROLE_EMBLEMS as NIGHTWATCH } from "@/games/nightwatch/emblems/roles";
import { ROLE_EMBLEMS as SHELTER } from "@/games/shelter/roleEmblems";
import { disc, ring, type EmblemData, type EmblemPart, type Shade } from "@/components/engraved/emblem";

const f = (n: number) => +n.toFixed(2);

const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

/** The meeple's head, a round knob `r` wide at (cx, cy). */
const headPath = (cx: number, cy: number, r = 8) =>
  `M${cx} ${cy - r}C${f(cx + r * 0.6)} ${cy - r} ${cx + r} ${f(cy - r * 0.56)} ${cx + r} ${cy}C${cx + r} ${f(cy + r * 0.56)} ${f(cx + r * 0.6)} ${cy + r} ${cx} ${cy + r}C${f(cx - r * 0.6)} ${cy + r} ${cx - r} ${f(cy + r * 0.56)} ${cx - r} ${cy}C${cx - r} ${f(cy - r * 0.56)} ${f(cx - r * 0.6)} ${cy - r} ${cx} ${cy - r}Z`;

const head = (cx: number, cy: number, r = 8): EmblemPart => ({
  d: headPath(cx, cy, r),
  m: "gold",
  round: true,
  shine: `M${f(cx - r * 0.66)} ${f(cy - r * 0.18)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(cx - r * 0.2)} ${f(cy - r * 0.66)}`,
});

const shouldersPath = (cx: number, top: number, w = 19) =>
  `M${cx} ${top}C${cx + 6} ${top} ${f(cx + w * 0.6)} ${top + 1} ${f(cx + w * 0.78)} ${top + 3}C${f(cx + w * 0.97)} ${top + 5} ${cx + w} ${top + 9} ${cx + w} ${top + 13}V44H${cx - w}V${top + 13}C${cx - w} ${top + 9} ${f(cx - w * 0.97)} ${top + 5} ${f(cx - w * 0.78)} ${top + 3}C${f(cx - w * 0.6)} ${top + 1} ${cx - 6} ${top} ${cx} ${top}Z`;

const jacket = (m: Shade, cx = 24, top = 21, w = 19): EmblemPart => ({
  d: shouldersPath(cx, top, w),
  m,
  vein: `M${cx - 5} ${top + 0.5}L${cx - 2} ${top + 14}M${cx + 5} ${top + 0.5}L${cx + 2} ${top + 14}M${cx - w + 6} ${top + 10}V44`,
  shine: `M${cx - w + 2.2} ${top + 12}C${cx - w + 2.4} ${top + 8} ${cx - w + 4} ${top + 5} ${cx - w + 7} ${top + 3.4}`,
});

const NAVY = "#24456A";
const OXBLOOD = "#5A1A1A";
const TWEED = "#5A4632";
const LEATHER = "#7A4A26";

/** Tic-Tac-Toe's parlour player: a navy coat and a crimson bow tie, the
 *  gold nought (an annulet set with a ruby) held up beside the head. */
const PARLOUR: EmblemData = [
  jacket(NAVY, 21, 21, 18),
  { d: "M16.8 21.4L21 31.6L25.2 21.4Z", m: "ivory", ink: 1.1, vein: "M21 25V31", vw: 0.5 },
  // the bow tie
  { d: "M17 21.8L21 23.6L17 25.8Z", m: "crimson", ink: 0.9 },
  { d: "M25 21.8L21 23.6L25 25.8Z", m: "crimson", ink: 0.9 },
  { d: disc(21, 23.7, 1.3), m: "crimson", round: true, ink: 0.7 },
  head(21, 13.5),
  // the sleeve up from the foot of the box, the hand round the ring
  { d: "M33.2 44L34.2 27.4H40.2L41.2 44Z", m: NAVY, ink: 1.2, vein: "M34.8 31H39.8", vw: 0.6, shine: "M35.2 41V30", sw: 0.8 },
  { d: rrect(33.8, 26.6, 6.8, 2.6, 1.1), m: "ivory", ink: 0.8 },
  {
    d: ring(37.2, 14.6, 7, 4),
    evenOdd: true,
    m: "gold",
    round: true,
    ink: 1.2,
    vein: `M37.2 14.6m-5.5 0a5.5 5.5 0 1 1 11 0a5.5 5.5 0 1 1 -11 0`,
    vw: 0.5,
    shine: "M31.6 12.4A6 6 0 0 1 34.6 8.6",
    sw: 0.8,
  },
  { jewel: "ruby", x: 37.2, y: 7.8, r: 1.9 },
  { d: disc(37.2, 24.2, 2.8), m: "gold", round: true, ink: 1.1 },
];

/** Liar's Dice's dice shaker: a flat cap, an oxblood waistcoat over a
 *  shirt, the leather cup held up, a die tumbling out of it. */
const SHAKER: EmblemData = [
  jacket("ivory", 21, 21, 18),
  // the waistcoat over the shirt, its buttons
  {
    d: "M13.6 22.6L17 21.6Q21 30 25 21.6L28.4 22.6Q29 30 32.6 33V44H9.4V33Q13 30 13.6 22.6Z",
    m: OXBLOOD,
    ink: 1.2,
    vein: "M21 31V44M12 37V44M30 37V44",
    vw: 0.55,
    shine: "M11.6 34Q13.6 31 14.4 25.6",
    sw: 0.8,
  },
  { d: disc(21, 34, 0.9) + disc(21, 38, 0.9) + disc(21, 42, 0.9), m: "gold", round: true, ink: 0.5 },
  head(21, 13.6),
  // the cap
  {
    d: "M13.2 12C13 7 16.6 5 21 5C25.4 5 29 7 28.8 11.4Q21 9.2 13.2 12Z",
    m: TWEED,
    ink: 1.1,
    vein: "M21 5.4V10.2M16.4 7Q21 6.2 25.6 7",
    vw: 0.5,
    shine: "M15 9Q16.4 6.4 19.6 6",
    sw: 0.8,
  },
  { d: "M12.4 12.2Q21 8.8 31.6 11.4L30.8 13.2Q21 11 13 13.8Z", m: TWEED, ink: 1 },
  // the sleeve, the cup above the hand
  { d: "M33.2 44L34 30.4H40.4L41.2 44Z", m: "ivory", ink: 1.1, vein: "M34.6 33.6H40", vw: 0.5 },
  {
    d: "M31.4 13.4H42.8L41 28.4H33.2Z",
    m: LEATHER,
    ink: 1.2,
    vein: "M33.6 17.4H40.6M34.2 24.4H40",
    vw: 0.6,
    shine: "M33 15.4L34.4 27",
    sw: 0.8,
  },
  { d: rrect(30.6, 11.6, 13, 3, 1.2), m: "gold", ink: 0.9 },
  { d: rrect(32.6, 27, 9, 2.4, 1), m: "gold", ink: 0.8 },
  { d: disc(37.1, 30.4, 2.8), m: "gold", round: true, ink: 1.1 },
  // a die tumbling out over the rim
  { d: rrect(37.6, 3.2, 7.4, 7.4, 1.8), m: "ivory", ink: 1, t: "rotate(18 41.3 6.9)" },
  { dark: disc(39.6, 5.2, 0.8) + disc(41.3, 6.9, 0.8) + disc(43, 8.6, 0.8), t: "rotate(18 41.3 6.9)" },
];

/** A plain meeple in a brown coat, for a game with no lead drawn. */
export const MEEPLE: EmblemData = [
  jacket("#6A4528", 24, 21, 19),
  { d: "M19.6 21.4L24 31L28.4 21.4Z", m: "ivory", ink: 1.1 },
  head(24, 13.5),
];

/** Each game's lead, by game key. */
export const LEADS: Record<string, EmblemData> = {
  tictactoe: PARLOUR,
  avalon: AVALON.merlin,
  coup: COUP.duke,
  liarsdice: SHAKER,
  manor: MANOR.butler,
  nightwatch: NIGHTWATCH.prophet,
  shelter: SHELTER.survivor,
};

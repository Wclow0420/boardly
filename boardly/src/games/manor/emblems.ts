// Midnight Manor's people as engraved portraits (see "Roles" in the root
// CLAUDE.md and "The house drawing style" in AGENTS.md): each a faceless
// Boardly meeple, head and shoulders, told apart by what it wears and
// holds on a stormy night in the old house. The household dresses in
// black, navy and teal with silver and gold; the intruder in black with
// crimson. The old man the household protects is drawn too (`OWNER`).
// Drawn in a 48 × 48 box as EmblemData; look them over with
//   node scripts/emblem-sheet.mjs src/games/manor/emblems.ts out.png PORTRAITS

import { disc, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { ribbon } from "@/components/engraved/shapes";
import type { Role } from "./logic";

const f = (n: number) => +n.toFixed(2);

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

/** An oval drawn as a path (an <ellipse> loses its gradient in Skia). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx + rx)} ${cy}A${rx} ${ry} 0 1 1 ${f(cx - rx)} ${cy}A${rx} ${ry} 0 1 1 ${f(cx + rx)} ${cy}Z`;

/** The meeple's head, a round knob `r` wide at (cx, cy). */
const headPath = (cx: number, cy: number, r = 8) =>
  `M${cx} ${cy - r}C${f(cx + r * 0.6)} ${cy - r} ${cx + r} ${f(cy - r * 0.56)} ${cx + r} ${cy}C${cx + r} ${f(cy + r * 0.56)} ${f(cx + r * 0.6)} ${cy + r} ${cx} ${cy + r}C${f(cx - r * 0.6)} ${cy + r} ${cx - r} ${f(cy + r * 0.56)} ${cx - r} ${cy}C${cx - r} ${f(cy - r * 0.56)} ${f(cx - r * 0.6)} ${cy - r} ${cx} ${cy - r}Z`;

/** The meeple's gold head, its shine on the upper left. */
const head = (cx: number, cy: number, r = 8): EmblemPart => ({
  d: headPath(cx, cy, r),
  m: "gold",
  round: true,
  shine: `M${f(cx - r * 0.66)} ${f(cy - r * 0.18)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(cx - r * 0.2)} ${f(cy - r * 0.66)}`,
});

/** Shoulders and chest from a neck at (cx, top), out to the box's foot. */
const shouldersPath = (cx: number, top: number, w = 19) =>
  `M${cx} ${top}C${cx + 6} ${top} ${f(cx + w * 0.6)} ${top + 1} ${f(cx + w * 0.78)} ${top + 3}C${f(cx + w * 0.97)} ${top + 5} ${cx + w} ${top + 9} ${cx + w} ${top + 13}V44H${cx - w}V${top + 13}C${cx - w} ${top + 9} ${f(cx - w * 0.97)} ${top + 5} ${f(cx - w * 0.78)} ${top + 3}C${f(cx - w * 0.6)} ${top + 1} ${cx - 6} ${top} ${cx} ${top}Z`;

/** A coat over the shoulders, lapels engraved, lit on the left. */
const coat = (m: `#${string}`, cx: number, top: number, w: number): EmblemPart => ({
  d: shouldersPath(cx, top, w),
  m,
  vein: `M${cx - 5} ${top + 0.5}L${cx - 2} ${top + 14}M${cx + 5} ${top + 0.5}L${cx + 2} ${top + 14}M${cx - w + 6} ${top + 10}V44M${cx + w - 6} ${top + 10}V44`,
  shine: `M${cx - w + 2.2} ${top + 12}C${cx - w + 2.4} ${top + 8} ${cx - w + 4} ${top + 5} ${cx - w + 7} ${top + 3.4}`,
});

/** A white-gloved hand, a round knuckle at (x, y). */
const glove = (x: number, y: number, r = 2.8): EmblemPart => ({
  d: disc(x, y, r),
  m: "ivory",
  round: true,
  ink: 1.1,
  vein: `M${f(x - r * 0.5)} ${f(y - r * 0.2)}H${f(x + r * 0.5)}`,
  vw: 0.5,
});

// The cloth: the butler's tails, the guard's navy, the guest's teal
// travelling coat, the intruder's black, the old man's green velvet.
const TAILS = "#24232C";
const NAVY = "#26375A";
const TEAL = "#2C6266";
const BLACK = "#202128";
const VELVET = "#2E5240";

// --- The Butler: tails, a bow tie, a silver tray held high ---

const ARM = ribbon(
  [
    [30, 32],
    [34, 26],
    [36, 19],
  ],
  [5.4, 4.6, 4.2],
);

const TRAY = "translate(0 1.2)";

const BUTLER: EmblemData = [
  coat(TAILS, 19, 22, 15),
  // the starched shirt front, the waistcoat's gold buttons
  { d: "M14 22.4L19 37L24 22.4Z", m: "ivory", ink: 1.1, vein: "M19 27V36", vw: 0.5 },
  { d: disc(19, 31, 0.9) + disc(19, 34.4, 0.9), m: "gold", ink: 0.6 },
  head(19, 14),
  // the bow tie
  {
    d: "M19 24.4L14.4 22.2Q13.6 24.6 14.4 27L19 24.8L23.6 27Q24.4 24.6 23.6 22.2Z",
    m: TEAL,
    ink: 1,
    vein: "M15.6 23.6V25.8M22.4 23.6V25.8",
    vw: 0.5,
  },
  { d: rrect(17.8, 23.2, 2.4, 2.8, 0.8), m: TEAL, ink: 0.9 },
  // the silver tray balanced on a gloved hand, a cloche on it
  { d: ARM.outline, m: TAILS, ink: 1.2, shine: ARM.shine, sw: 0.6 },
  { d: "M33.6 17.4Q36 18.6 38.4 17.4L38.6 19.6Q36 20.8 33.4 19.6Z", m: "ivory", ink: 0.9 },
  glove(36, 16, 2.6),
  {
    d: "M28.8 12.2C28.8 6.6 31.8 4 36 4C40.2 4 43.2 6.6 43.2 12.2Z",
    m: "silver",
    t: TRAY,
    ink: 1.2,
    shine: "M30.8 10.6C31 7.6 32.6 6 34.6 5.6",
    sw: 0.9,
    vein: "M30.4 11.2Q36 12.6 41.6 11.2",
    vw: 0.5,
  },
  { d: disc(36, 3.9, 1.3) + "M35.4 4.6H36.6V5.4H35.4Z", m: "silver", t: TRAY, round: true, ink: 0.8 },
  {
    d: oval(36, 13.4, 8.4, 2),
    m: "silver",
    t: TRAY,
    ink: 1.2,
    vein: oval(36, 13.2, 6.6, 1.1),
    vw: 0.5,
    shine: "M29.4 12.8Q32 11.8 35 11.7",
    sw: 0.7,
  },
];

// --- The Guard: a peaked cap with a badge, a torch's beam ---

const BEAM = "M38.8 24.6L33.4 4.2Q39 3 44 6.2Z";
const TORCH = ribbon(
  [
    [33.6, 38],
    [36.4, 31],
    [38.4, 26.4],
  ],
  [3.4, 3.4, 3.4],
);

const GUARD: EmblemData = [
  // the beam, thrown up into the dark
  { d: BEAM, m: "flame", ink: 0, op: 0.4 },
  { d: "M38.8 24.6L36.2 5.6Q39.4 5 41.8 6.6Z", m: "ivory", ink: 0, op: 0.7 },
  coat(NAVY, 20, 22, 16),
  // the epaulettes and the silver buttons down the front
  { d: "M6.4 25.8Q9.6 23.2 13.2 23.6L13.6 26.2Q10 26.4 7.2 28.4Z", m: "gold", ink: 0.9, vein: "M8.6 25.4L9.4 27.4M10.8 24.6L11.4 26.6", vw: 0.4 },
  { d: disc(20, 31, 1) + disc(20, 35.4, 1) + disc(20, 39.8, 1), m: "silver", ink: 0.6 },
  { d: "M15.8 22.6L20 27.2L24.2 22.6Z", m: "#C9D6E6", ink: 0.9 },
  head(20, 15),
  // the cap: a crown, a gold band, a black peak
  {
    d: "M10.8 9.4C10.8 6 15 4 20 4C25 4 29.2 6 29.2 9.4L27.8 12.4H12.2Z",
    m: NAVY,
    ink: 1.3,
    shine: "M13.2 8.4Q15 6.2 18.4 5.6",
    sw: 0.9,
  },
  { d: "M12.2 11.2H27.8V13.8H12.2Z", m: "gold", ink: 1, vein: "M13 12.5H27", vw: 0.4 },
  {
    d: "M11.6 13.6H28.4Q29 16.6 20 16.6Q11 16.6 11.6 13.6Z",
    m: "iron",
    ink: 1.1,
    shine: "M13.4 14.4Q16 15.2 19 15.2",
    sw: 0.7,
  },
  {
    d: "M20 5.8L22.6 6.8V9.2Q22.6 11 20 12Q17.4 11 17.4 9.2V6.8Z",
    m: "gold",
    ink: 0.9,
    vein: "M20 6.8V10.8",
    vw: 0.4,
  },
  // the torch in a gloved fist
  { d: TORCH.outline, m: "iron", ink: 1.1, vein: TORCH.grooves, vw: 0.4 },
  {
    d: "M36.6 25.4L40.6 27.2L41.8 23.4L37.8 21.4Z",
    m: "silver",
    ink: 1.1,
    shine: "M38.2 22.4L37.4 24.6",
    sw: 0.6,
  },
  { d: oval(39.8, 22.4, 2.2, 1.2), m: "ivory", t: "rotate(25 39.8 22.4)", ink: 0.8 },
  { d: disc(34.8, 34, 3), m: "iron", round: true, ink: 1.1, vein: "M33 33.2H36.6M33 34.8H36.6", vw: 0.4 },
];

// --- The Guest: a bowler, an opera scarf, a suitcase in hand ---

const GUEST: EmblemData = [
  coat(TEAL, 22, 22, 18),
  // the opera scarf: round the neck, its ends down the coat
  {
    d: "M16.6 21.6L13.4 36.4L16.8 37.4L20.4 24.4Z",
    m: "ivory",
    ink: 1.1,
    vein: "M14 35.6L16.6 36.4",
    vw: 0.5,
  },
  { line: "M13.8 37.6V39.4M15.4 38V40M17 37.8V39.6", color: "#A08A60", w: 0.8 },
  head(22, 14.6),
  {
    d: "M14.6 20.2Q22 25.4 29.4 20.2L30.2 23.6Q22 29.4 13.8 23.6Z",
    m: "ivory",
    ink: 1.2,
    shine: "M15.8 21.6Q19 23.8 22.4 24.2",
    sw: 0.8,
  },
  // the bowler hat
  {
    d: "M15 10.6C15 6 18 4 22 4C26 4 29 6 29 10.6Z",
    m: "#3A3236",
    ink: 1.3,
    shine: "M16.8 9.4C17 7 18.4 5.8 20.4 5.4",
    sw: 0.9,
  },
  { d: "M15 8.6H29V10.6H15Z", m: "#5A2E46", ink: 0.9 },
  {
    d: "M11.6 11.6C11.6 10 15 9.8 22 9.8C29 9.8 32.4 10 32.4 11.6C32.4 13 29.6 12.8 22 12.8C14.4 12.8 11.6 13 11.6 11.6Z",
    m: "#3A3236",
    ink: 1.2,
    shine: "M13.6 11.2Q17 10.6 21 10.6",
    sw: 0.7,
  },
  // the suitcase: leather, brass corners, a strap round it
  {
    d: "M30 26.4Q30 23.4 33 23.4H35.4Q38.4 23.4 38.4 26.4",
    m: "wood",
    ink: 1.1,
  },
  {
    d: rrect(27.4, 26, 16.6, 17.4, 2.4),
    m: "wood",
    ink: 1.3,
    vein: "M27.8 29.4H43.6",
    vw: 0.6,
    shine: "M29.2 31V40.6",
    sw: 0.9,
  },
  { d: rrect(27.4, 33.6, 16.6, 2.6, 0.4), m: "#5A3618", ink: 0.8 },
  { d: rrect(33.8, 32.8, 3.8, 4.2, 0.6), m: "gold", ink: 0.8 },
  {
    d:
      "M27.4 28.6V26.4Q27.4 26 27.8 26H30V27.4H28.8V28.6Z" +
      "M44 28.6V26.4Q44 26 43.6 26H41.4V27.4H42.6V28.6Z" +
      "M27.4 40.8V43Q27.4 43.4 27.8 43.4H30V42H28.8V40.8Z" +
      "M44 40.8V43Q44 43.4 43.6 43.4H41.4V42H42.6V40.8Z",
    m: "gold",
    ink: 0.6,
  },
];

// --- The Intruder: a black hood and balaclava, a knife raised ---

const INTRUDER: EmblemData = [
  // the hood behind the head, its crimson lining
  {
    d: "M20 3.8C27.6 3.8 30.8 9.6 30.6 16.6L30.4 23H9.6L9.4 16.6C9.2 9.6 12.4 3.8 20 3.8Z",
    m: BLACK,
    ink: 1.3,
    shine: "M11.6 15C11.8 10 14 6.6 17.6 5.6",
    sw: 0.9,
  },
  coat(BLACK, 20, 22, 16),
  { d: "M20 22.4L14.6 23L17.2 30.6L20 25.4L22.8 30.6L25.4 23Z", m: "crimson", ink: 1 },
  {
    d: headPath(20, 14.6, 7.8),
    m: "iron",
    round: true,
    shine: "M14 13.4A5.6 5.6 0 0 1 16.2 10",
    vein: "M15 19.6Q20 21.4 25 19.6",
    vw: 0.6,
  },
  // the eye slit: the gold meeple glimpsed through the wool
  { d: rrect(14.2, 12.6, 11.6, 3.2, 1.6), m: "gold", ink: 1 },
  // the knife, held up in a black glove
  {
    d: "M35.6 25.4L35.4 15.4Q35.6 10.6 39.4 7Q40.6 11.6 40 16L39.8 25.4Z",
    m: "silver",
    ink: 1.2,
    vein: "M37.6 24.6L37.8 13",
    vw: 0.5,
    shine: "M36.2 22.6L36.1 15.6Q36.4 12.8 38 10.8",
    sw: 0.7,
  },
  { d: rrect(33, 24.4, 9.4, 2.6, 1.2), m: "gold", ink: 1 },
  {
    d: rrect(35.6, 26.6, 4.2, 9.4, 1.4),
    m: "crimson",
    ink: 1.1,
    vein: "M35.8 29L39.6 28M35.8 31.6L39.6 30.6M35.8 34.2L39.6 33.2",
    vw: 0.5,
  },
  { d: disc(37.7, 31.6, 3.2), m: "iron", round: true, ink: 1.1, vein: "M35.6 30.8H39.8M35.6 32.4H39.8", vw: 0.4 },
  { d: disc(37.7, 37.4, 1.4), m: "gold", round: true, ink: 0.8 },
];

// --- The old man of the house: white tufts, a velvet smoking jacket, a cane ---

/** A tuft of white hair, three soft lobes, at (x, y); `dir` -1 faces left. */
const tuft = (x: number, y: number, dir: 1 | -1): EmblemPart => {
  const s = (dx: number) => f(x + dx * dir);
  return {
    d: `M${s(0)} ${y - 4}C${s(-2.6)} ${y - 4.2} ${s(-3.6)} ${y - 2} ${s(-2.6)} ${y - 0.6}C${s(-4)} ${y} ${s(-3.8)} ${y + 2.6} ${s(-2)} ${y + 2.8}C${s(-2.4)} ${y + 4.6} ${s(0)} ${y + 5.4} ${s(1)} ${y + 4}Z`,
    m: "ivory",
    round: true,
    ink: 1,
    vein: `M${s(-0.4)} ${y - 2.4}Q${s(-1.8)} ${y} ${s(-0.6)} ${y + 2.6}`,
    vw: 0.5,
  };
};

const OWNER: EmblemData = [
  coat(VELVET, 21, 22, 17),
  // the quilted gold shawl collar and the frogging across the front
  {
    d: "M14.6 22.6Q12.6 30 18.2 38L21 31.4L15.8 22.2Z",
    m: "gold",
    ink: 1,
    vein: "M15 26.4L17 26M15.6 30.4L18.4 29.8",
    vw: 0.5,
  },
  {
    d: "M27.4 22.6Q29.4 30 23.8 38L21 31.4L26.2 22.2Z",
    m: "gold",
    ink: 1,
    vein: "M27 26.4L25 26M26.4 30.4L23.6 29.8",
    vw: 0.5,
  },
  { line: "M15.8 39.6H26.2M15.8 42.4H26.2", color: "#E2B04A", w: 1.1 },
  // the cravat, a ruby pin in it
  {
    d: "M17.6 22.4L21 30.6L24.4 22.4Q21 24 17.6 22.4Z",
    m: "ivory",
    ink: 1,
    vein: "M21 24.4V29",
    vw: 0.5,
  },
  { jewel: "ruby", x: 21, y: 26.2, r: 1.3 },
  head(21, 14.4),
  tuft(13.4, 15.6, 1),
  tuft(28.6, 15.6, -1),
  // the cane: a turned shaft, a gold knob, held in an old hand
  {
    d: rrect(36.2, 13, 2.8, 31, 1.2),
    m: "wood",
    ink: 1.1,
    vein: "M37.6 16V42",
    vw: 0.5,
    shine: "M36.9 16V30",
    sw: 0.6,
  },
  { d: rrect(35.6, 12, 4, 2.2, 0.8), m: "gold", ink: 0.8 },
  {
    d: disc(37.6, 8.6, 3.6),
    m: "gold",
    round: true,
    ink: 1.1,
    vein: "M35 9.4Q37.6 11 40.2 9.4",
    vw: 0.5,
  },
  { d: rrect(34.2, 21.4, 6.8, 5.6, 2.6), m: "gold", round: true, ink: 1.1, vein: "M36 21.8V26.6M37.6 21.6V26.8M39.2 21.8V26.6", vw: 0.45 },
];

/** Every role's portrait, keyed by the engine's role id. */
export const ROLE_EMBLEMS: Record<Role, EmblemData> = {
  butler: BUTLER,
  guard: GUARD,
  guest: GUEST,
  intruder: INTRUDER,
};

/** The old man of the house, whom the household protects. */
export const OWNER_EMBLEM: EmblemData = OWNER;

/** Every portrait, the old man's too: for the sheet. */
export const PORTRAITS: Record<Role | "owner", EmblemData> = { ...ROLE_EMBLEMS, owner: OWNER };

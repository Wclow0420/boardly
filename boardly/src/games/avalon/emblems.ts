// Double Agent's role portraits as engraved emblems (see "The house
// drawing style" in AGENTS.md): each role a faceless Boardly meeple,
// head and shoulders, told apart by what it wears and holds. The agents
// lean on the agency's steel and teal, the moles on crimson. Drawn in a
// 48 × 48 box as EmblemData; look them over with
//   node scripts/emblem-sheet.mjs src/games/avalon/emblems.ts out.png ROLE_EMBLEMS

import { disc, ring, type EmblemData, type EmblemPart, type Shade } from "@/components/engraved/emblem";
import { FEATHER, fmt, ribbon, type Pt } from "@/components/engraved/shapes";
import type { Role } from "./logic";

const f = (n: number) => +n.toFixed(2);

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

/** A five-pointed star of radius `r` at (cx, cy). */
const star = (cx: number, cy: number, r: number, inner = 0.42) =>
  `M${Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const q = k % 2 ? r * inner : r;
    return fmt([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
  }).join("L")}Z`;

/** A point `r` from (cx, cy) at `deg` (SVG: clockwise from +x). */
const polar = (cx: number, cy: number, r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
};

/** The meeple's head, a round knob `r` wide at (cx, cy). */
const headPath = (cx: number, cy: number, r = 8) =>
  `M${cx} ${cy - r}C${f(cx + r * 0.6)} ${cy - r} ${cx + r} ${f(cy - r * 0.56)} ${cx + r} ${cy}C${cx + r} ${f(cy + r * 0.56)} ${f(cx + r * 0.6)} ${cy + r} ${cx} ${cy + r}C${f(cx - r * 0.6)} ${cy + r} ${cx - r} ${f(cy + r * 0.56)} ${cx - r} ${cy}C${cx - r} ${f(cy - r * 0.56)} ${f(cx - r * 0.6)} ${cy - r} ${cx} ${cy - r}Z`;

/** The meeple's gold head, its shine on the upper left. */
const head = (cx: number, cy: number, r = 8, t?: string): EmblemPart => ({
  d: headPath(cx, cy, r),
  m: "gold",
  round: true,
  shine: `M${f(cx - r * 0.66)} ${f(cy - r * 0.18)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(cx - r * 0.2)} ${f(cy - r * 0.66)}`,
  t,
});

/** Shoulders and chest from a neck at (cx, top), out to the box's foot. */
const shouldersPath = (cx: number, top: number, w = 19) =>
  `M${cx} ${top}C${cx + 6} ${top} ${f(cx + w * 0.6)} ${top + 1} ${f(cx + w * 0.78)} ${top + 3}C${f(cx + w * 0.97)} ${top + 5} ${cx + w} ${top + 9} ${cx + w} ${top + 13}V44H${cx - w}V${top + 13}C${cx - w} ${top + 9} ${f(cx - w * 0.97)} ${top + 5} ${f(cx - w * 0.78)} ${top + 3}C${f(cx - w * 0.6)} ${top + 1} ${cx - 6} ${top} ${cx} ${top}Z`;

/** A jacket over the shoulders, its lapels engraved, lit on the left. */
const jacket = (
  m: `#${string}`,
  cx = 24,
  top = 21,
  w = 19,
): EmblemPart => ({
  d: shouldersPath(cx, top, w),
  m,
  vein: `M${cx - 5} ${top + 0.5}L${cx - 2} ${top + 14}M${cx + 5} ${top + 0.5}L${cx + 2} ${top + 14}M${cx - w + 6} ${top + 10}V44M${cx + w - 6} ${top + 10}V44`,
  shine: `M${cx - w + 2.2} ${top + 12}C${cx - w + 2.4} ${top + 8} ${cx - w + 4} ${top + 5} ${cx - w + 7} ${top + 3.4}`,
});

/** A shirt's V at the throat and a tie down it. */
const shirtAndTie = (cx: number, top: number, tie: Shade): EmblemPart[] => [
  { d: `M${cx - 4.6} ${top + 0.4}L${cx} ${top + 11}L${cx + 4.6} ${top + 0.4}Z`, m: "ivory", ink: 1.1 },
  {
    d: `M${cx} ${top + 1.6}L${cx - 1.8} ${top + 3.4}L${cx - 1} ${top + 9.4}L${cx} ${top + 11}L${cx + 1} ${top + 9.4}L${cx + 1.8} ${top + 3.4}Z`,
    m: tie,
    ink: 0.9,
  },
];

// The cloth: the agents' steel-teal and steel suits and tan trench; the
// moles' black, plum and dusk.
const TEAL_SUIT = "#21474C";
const STEEL_SUIT = "#46566A";
const TRENCH = "#B98A4E";
const BLACK = "#2A2C34";
const PLUM = "#5A2848";
const DUSK = "#3A3446";

// --- The Handler: on the line, a headset and mic, a brass dial behind ---

const DIAL_C: Pt = [35.4, 12.6];
const DIAL_TICKS = Array.from({ length: 9 }, (_, i) => {
  const deg = -200 + i * 25;
  const [x0, y0] = polar(DIAL_C[0], DIAL_C[1], 5.6, deg);
  const [x1, y1] = polar(DIAL_C[0], DIAL_C[1], 7.1, deg);
  return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
}).join("");
const BOOM = ribbon(
  [
    [14.6, 18],
    [15.6, 21.4],
    [18.4, 23],
    [21.2, 22.8],
  ],
  [1.9, 1.8, 1.6, 1.5],
);

const HANDLER: EmblemData = [
  { d: disc(DIAL_C[0], DIAL_C[1], 8.2), vein: DIAL_TICKS, shine: "M29.8 9.8A6.2 6.2 0 0 1 33 6.6", ink: 1.3 },
  { d: disc(DIAL_C[0], DIAL_C[1], 3.8), m: "iron", ink: 1, vein: "M35.4 12.6L39 9.4", vw: 1.1 },
  jacket(TEAL_SUIT),
  ...shirtAndTie(24, 21, "night"),
  head(24, 13.5),
  {
    d: "M13.6 14.5A10.4 10.4 0 0 1 34.4 14.5H32.4A8.4 8.4 0 0 0 15.6 14.5Z",
    m: "silver",
    ink: 1.2,
    shine: "M16.4 9.6A9 9 0 0 1 21 5.4",
    sw: 0.9,
  },
  { d: BOOM.outline, m: "iron", ink: 0.9 },
  { d: rrect(12, 10.4, 5.4, 9.4, 2.6), m: "iron", ink: 1.2, shine: "M13.7 12.6V17" },
  { d: rrect(30.6, 10.4, 5.4, 9.4, 2.6), m: "iron", ink: 1.2 },
  { jewel: "emerald", x: 21.6, y: 22.6, r: 1.9 },
];

// --- The Bodyguard: a shield raised before him, the agency's star on it ---

/** Path data of absolute points only (M L Q C Z), scaled about (cx, cy). */
const scaled = (d: string, cx: number, cy: number, k: number) => {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const c = i++ % 2 ? cy : cx;
    return String(f(c + (Number(n) - c) * k));
  });
};

const SHIELD_HALF = "M21 19.6Q27 22 33 21.4L33 30C33 37 27.6 41.6 21 44.4Z";
const SHIELD = scaled("M9 21.4Q15 22 21 19.6Q27 22 33 21.4L33 30C33 37 27.6 41.6 21 44.4C14.4 41.6 9 37 9 30Z", 21, 44.4, 1.12);
const SHIELD_IN = scaled(SHIELD, 21, 30.6, 0.8);
const SHIELD_T = "rotate(-6 21 32)";
const BODYGUARD: EmblemData = [
  jacket(STEEL_SUIT, 25, 21),
  head(25, 13),
  // the earpiece's coiled wire, from the ear down into the collar
  { line: "M32.6 15.6Q34.4 17 33.2 18.2Q32 19.4 33.8 20.6Q35.4 21.8 34 23.4", color: "#1E242C", w: 0.9 },
  { d: SHIELD_IN, m: "silver", t: SHIELD_T, ink: 0, shine: "M11.6 23V30Q11.6 34.6 14.2 38", sw: 1 },
  {
    d: scaled(scaled(SHIELD_HALF, 21, 44.4, 1.12), 21, 30.6, 0.8),
    m: "night",
    t: SHIELD_T,
    ink: 0,
  },
  { d: SHIELD + SHIELD_IN, evenOdd: true, t: SHIELD_T, shine: "M9.2 21V29Q9.2 33.6 11.4 37", sw: 0.9 },
  { d: star(21, 30.4, 6.4, 0.44), t: SHIELD_T, ink: 1.1, vein: "M21 25.4V30.4", vw: 0.7 },
];

// --- The Field Agent: a fedora and a trench, its collar turned up ---

const FIELD_AGENT: EmblemData = [
  {
    d: shouldersPath(24, 21, 19),
    m: TRENCH,
    vein: "M18 22L22.4 35M30 22L25.6 35M10.5 33V44M37.5 33V44",
    shine: "M7.2 33C7.4 29 9 26 12 24.4",
  },
  { d: disc(20.6, 38, 1.3) + disc(27.4, 38, 1.3), ink: 0.8 },
  head(24, 14.5),
  // the collar, turned up round the jaw
  {
    d: "M17.4 18.4L12.4 15.6L11.2 24.6L19.6 28L22 22.6Z",
    m: TRENCH,
    ink: 1.2,
    vein: "M13 17.8L13.2 23.4",
    vw: 0.7,
    shine: "M12.6 17L12 22.6",
    sw: 0.8,
  },
  {
    d: "M30.6 18.4L35.6 15.6L36.8 24.6L28.4 28L26 22.6Z",
    m: TRENCH,
    ink: 1.2,
    vein: "M35 17.8L34.8 23.4",
    vw: 0.7,
  },
  // the fedora: a pinched crown, a teal band, a wide brim
  {
    d: "M16 11.2C16 6.4 17 4 20 4.4C22 4.6 23 5.8 24 5.8C25 5.8 26 4.6 28 4.4C31 4 32 6.4 32 11.2Z",
    m: "#3A4048",
    ink: 1.3,
    vein: "M24 6.6V10.4",
    vw: 0.8,
    shine: "M17.8 10.4C17.8 7.8 18.4 6.4 19.6 6.2",
    sw: 0.9,
  },
  { d: "M16 8.4H32V11.2H16Z", m: "#1F8A80", ink: 1 },
  {
    d: "M9.4 12.6C9.4 10.6 14 10 24 10C34 10 38.6 10.6 38.6 12.6C38.6 14.4 34.6 14.2 24 14.2C13.4 14.2 9.4 14.4 9.4 12.6Z",
    m: "#3A4048",
    ink: 1.3,
    shine: "M11.6 12.2C14 11.4 18 11.2 22 11.2",
    sw: 0.8,
  },
];

// --- The Hitman: a balaclava and beanie, framed in a scope's crosshair ---

const HITMAN: EmblemData = [
  jacket(BLACK, 24, 23),
  {
    d: headPath(24, 15, 8.4),
    m: "iron",
    round: true,
    vein: "M18.4 21.4Q24 23.4 29.6 21.4",
    shine: "M17.4 14.2A6 6 0 0 1 19.6 10.6",
  },
  // the eye slit: the gold meeple seen through the wool
  { d: rrect(17.4, 13.4, 13.2, 3.4, 1.7), m: "gold", ink: 1 },
  {
    d: rrect(15, 8.6, 18, 4.2, 2),
    m: "iron",
    ink: 1.1,
    vein: "M18.4 9V12.4M21.4 9V12.4M24.4 9V12.4M27.4 9V12.4M30.4 9V12.4",
    vw: 0.6,
  },
  {
    d: ring(24, 24, 19.2, 16.9),
    evenOdd: true,
    m: "silver",
    ink: 1.2,
    vein: "M24 24m-18.05 0a18.05 18.05 0 1 1 36.1 0a18.05 18.05 0 1 1 -36.1 0",
    vw: 0.6,
    shine: "M8.6 16.6A17 17 0 0 1 16.6 8.6",
  },
  {
    d:
      "M22.6 3.6H25.4L24.8 9.4H23.2Z" +
      "M22.6 44.4H25.4L24.8 38.6H23.2Z" +
      "M3.6 22.6V25.4L9.4 24.8V23.2Z" +
      "M44.4 22.6V25.4L38.6 24.8V23.2Z",
    m: "crimson",
    ink: 1,
  },
];

// --- The Decoy: a masquerade mask on a stick, held up to the face ---

/** A feather `len` long from its root at (x, y), leaning `deg`. */
const plume = (x: number, y: number, deg: number, len: number, w: number, m: "ivory" | "gold" | "crimson"): EmblemPart => ({
  d: FEATHER(len, w),
  m,
  ink: 1,
  vein: `M0 -0.6Q${f(w * 0.15)} ${f(-len * 0.5)} 0 ${f(-len + 1.2)}`,
  vw: 0.7,
  t: `translate(${x} ${y}) rotate(${deg})`,
});

const DECOY: EmblemData = [
  jacket(PLUM, 22, 22, 18),
  head(22, 14),
  plume(32.4, 12.2, 72, 9.6, 2.2, "crimson"),
  plume(32, 11.6, 46, 10.6, 2.6, "ivory"),
  // the gilt stick and the gloved hand that holds it
  { d: "M32.2 17.4L34.2 16.8L38.8 30.2L36.8 30.8Z", ink: 1, shine: "M33 18L36.8 29", sw: 0.6 },
  { d: disc(37.6, 30.6, 2.8), m: "ivory", round: true, ink: 1.1 },
  {
    d: "M11.6 12.4C14.6 9.6 19 10.2 22 12C25 10.2 29.4 9.6 32.4 12.4C33.6 14.4 33 17.6 30.6 18.8C27.4 20.4 24 18.6 22 16.8C20 18.6 16.6 20.4 13.4 18.8C11 17.6 10.4 14.4 11.6 12.4Z",
    m: "crimson",
    ink: 1.3,
    vein: "M13 17.4Q11.8 15 13.2 13M31 17.4Q32.2 15 30.8 13",
    vw: 0.7,
    shine: "M13.4 12.6Q16.4 10.8 19.6 11.8",
    sw: 0.9,
  },
  { dark: "M14.6 14.8Q17.2 12.8 19.8 14.8Q17.2 16.8 14.6 14.8ZM24.2 14.8Q26.8 12.8 29.4 14.8Q26.8 16.8 24.2 14.8Z" },
  { jewel: "ruby", x: 22, y: 12.2, r: 1.6 },
];

// --- The Sleeper: head nodding, a sleep mask on, "Zz" rising ---

const NOD = "rotate(-12 22 15)";
const SLEEP_MASK = "#B8A6E4";
const SLEEPER: EmblemData = [
  jacket(BLACK, 22, 22, 18),
  ...shirtAndTie(22, 22, "crimson"),
  head(22, 15, 8, NOD),
  // the strap round the head, then the padded mask over the eyes
  { d: "M14 13.2Q22 11.4 30 13.2L30.2 15.4Q22 13.8 13.8 15.4Z", m: SLEEP_MASK, t: NOD, ink: 0.9 },
  {
    d: "M12.4 13.4C14.6 11.6 19.4 11.8 22 13C24.6 11.8 29.4 11.6 31.6 13.4C32.8 16.2 31 19.2 27 19.2C24.8 19.2 23 18.2 22 17.4C21 18.2 19.2 19.2 17 19.2C13 19.2 11.2 16.2 12.4 13.4Z",
    m: SLEEP_MASK,
    t: NOD,
    ink: 1.2,
    shine: "M14 13.6Q16.8 12.4 19.6 13",
    sw: 0.8,
  },
  // closed eyes stitched on the mask
  {
    line: "M14.6 15.8Q17 17.6 19.4 15.8M24.6 15.8Q27 17.6 29.4 15.8M15.4 16.6L14.8 17.6M17 17.1V18.2M18.6 16.6L19.2 17.6M25.4 16.6L24.8 17.6M27 17.1V18.2M28.6 16.6L29.2 17.6",
    color: "#2A1E4A",
    w: 0.8,
    t: NOD,
  },
  {
    d: "M33.6 3.6H43.4V6.4L37.6 11.6H43.6V14.4H33.4V11.6L39.2 6.4H33.6Z",
    m: "ivory",
    ink: 1.1,
    shine: "M35 5H41",
    sw: 0.8,
  },
  {
    d: "M33.4 17H39.6V18.8L36 22H39.8V23.8H33.2V22L36.8 18.8H33.4Z",
    m: "ivory",
    ink: 0.9,
  },
];

// --- The Wildcard: a joker card held up beside the head ---

const CARD_T = "translate(-2.6 1.8) rotate(12 36 15)";
const WILDCARD: EmblemData = [
  jacket(DUSK, 19, 22, 15),
  head(18, 14),
  {
    d: rrect(28.6, 3.4, 15, 21, 2.2),
    m: "ivory",
    t: CARD_T,
    ink: 1.3,
    shine: "M30.6 6V12",
    sw: 0.9,
  },
  { d: rrect(30.6, 5.4, 11, 17, 1.2), m: "ivory", t: CARD_T, ink: 0.6 },
  // the jester's cap: three points curling over, bells at their tips
  {
    d: "M32 18C31.8 14.6 30.6 12.2 30.6 9.8C32.4 11 33.6 13 34.4 14.6C34.8 11.4 35.6 9 36.1 7.4C36.6 9 37.4 11.4 37.8 14.6C38.6 13 39.8 11 41.6 9.8C41.6 12.2 40.4 14.6 40.2 18Z",
    m: "crimson",
    t: CARD_T,
    ink: 0.9,
  },
  { d: "M34.4 14.6C34.8 11.4 35.6 9 36.1 7.4C36.6 9 37.4 11.4 37.8 14.6L37 18H35.2Z", m: "night", t: CARD_T, ink: 0.8 },
  { d: rrect(31.4, 17.4, 9.4, 2.6, 1), t: CARD_T, ink: 0.8 },
  { d: disc(30.6, 9.4, 1.4) + disc(36.1, 6.8, 1.4) + disc(41.6, 9.4, 1.4), round: true, t: CARD_T, ink: 0.7 },
  { d: disc(31.6, 27.4, 2.8), m: "ivory", round: true, ink: 1.1 },
];

// --- The Mole: a dark hood, dark glasses, a crimson wax seal ---

const SEAL_EDGE = `M${Array.from({ length: 24 }, (_, i) => fmt(polar(24, 35, i % 2 ? 5.4 : 6.2, i * 15))).join("L")}Z`;
const MOLE: EmblemData = [
  {
    d: "M24 3.6C32.6 3.6 36.6 10 36.4 18.4C40.2 21 43 25.4 43.4 31L44 44H4L4.6 31C5 25.4 7.8 21 11.6 18.4C11.4 10 15.4 3.6 24 3.6Z",
    m: BLACK,
    vein: "M12.6 24Q14 32 13.6 44M35.4 24Q34 32 34.4 44",
    shine: "M13.6 16C13.8 10.6 16.4 6.8 20.6 5.6",
  },
  // the face in the hood's shadow, its crimson lining
  { d: "M24 7.8C29.6 7.8 32.4 12.2 32.4 17C32.4 22.4 28.8 25.6 24 25.6C19.2 25.6 15.6 22.4 15.6 17C15.6 12.2 18.4 7.8 24 7.8Z", m: "crimson", ink: 1.2 },
  { d: headPath(24, 17.6, 6.8), m: "gold", round: true, ink: 1 },
  { d: "M17.2 11.4C19 9.4 21.4 8.8 24 8.8C26.6 8.8 29 9.4 30.8 11.4C29 12.4 27 12.8 24 12.8C21 12.8 19 12.4 17.2 11.4Z", m: BLACK, ink: 0.9, op: 0.9 },
  // the dark glasses
  { line: "M16.6 15.6H31.4", color: "#1E242C", w: 1.1 },
  { d: rrect(17.2, 14.2, 6, 4.2, 1.8) + rrect(24.8, 14.2, 6, 4.2, 1.8), m: "night", ink: 1, shine: "M18.6 15.4L20 15.2M26.2 15.4L27.6 15.2", sw: 0.9 },
  // the wax seal on the cloak's clasp
  { d: SEAL_EDGE, m: "crimson", ink: 1.1, round: true, vein: disc(24, 35, 3.4), vw: 0.7 },
  { d: star(24, 35, 2.4, 0.45), m: "crimson", ink: 0.7 },
];

/** Every role's portrait, keyed by the engine's role id. */
export const ROLE_EMBLEMS: Record<Role, EmblemData> = {
  merlin: HANDLER,
  percival: BODYGUARD,
  servant: FIELD_AGENT,
  assassin: HITMAN,
  morgana: DECOY,
  mordred: SLEEPER,
  oberon: WILDCARD,
  minion: MOLE,
};

// Seal the Manor's role portraits as engraved emblems (see "The house
// drawing style" in AGENTS.md and "Roles" in the root CLAUDE.md): each
// role a faceless Boardly meeple, head and shoulders, told apart by what
// it wears and holds, in the manor's night: candlelight, moonlit silver,
// old wood. The watchers lean on ivory, teal and warm wood; the ghosts
// on violet, ash and crimson. Drawn in a 48 × 48 box as EmblemData; look
// them over with
//   node scripts/emblem-sheet.mjs src/games/nightwatch/emblems/roles.ts out.png ROLE_EMBLEMS

import { disc, ring, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { LEAF, curl, ribbon, type Pt } from "@/components/engraved/shapes";
import type { Role } from "../logic";

const f = (n: number) => +n.toFixed(2);

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

/** An oval as path data (Skia's SVG reader blacks out a gradient on an
 *  <ellipse>, so ovals are paths). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx)} ${f(cy)}Z`;

/** A four-pointed sparkle of radius `r` at (cx, cy). */
const sparkle = (cx: number, cy: number, r: number, k = 0.22) =>
  `M${f(cx)} ${f(cy - r)}Q${f(cx + r * k)} ${f(cy - r * k)} ${f(cx + r)} ${f(cy)}Q${f(cx + r * k)} ${f(cy + r * k)} ${f(cx)} ${f(cy + r)}Q${f(cx - r * k)} ${f(cy + r * k)} ${f(cx - r)} ${f(cy)}Q${f(cx - r * k)} ${f(cy - r * k)} ${f(cx)} ${f(cy - r)}Z`;

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

/** A gold hand (a little round knob, like the head). */
const hand = (cx: number, cy: number, r = 2.6): EmblemPart => ({ d: disc(cx, cy, r), m: "gold", round: true, ink: 1.1 });

/** Shoulders and chest from a neck at (cx, top), out to the box's foot. */
const shouldersPath = (cx: number, top: number, w = 19) =>
  `M${cx} ${top}C${cx + 6} ${top} ${f(cx + w * 0.6)} ${top + 1} ${f(cx + w * 0.78)} ${top + 3}C${f(cx + w * 0.97)} ${top + 5} ${cx + w} ${top + 9} ${cx + w} ${top + 13}V44H${cx - w}V${top + 13}C${cx - w} ${top + 9} ${f(cx - w * 0.97)} ${top + 5} ${f(cx - w * 0.78)} ${top + 3}C${f(cx - w * 0.6)} ${top + 1} ${cx - 6} ${top} ${cx} ${top}Z`;

/** A coat over the shoulders, its lapels engraved, lit on the left. */
const coat = (m: `#${string}`, cx = 24, top = 21, w = 19): EmblemPart => ({
  d: shouldersPath(cx, top, w),
  m,
  vein: `M${cx - 5} ${top + 0.5}L${cx - 2} ${top + 14}M${cx + 5} ${top + 0.5}L${cx + 2} ${top + 14}M${cx - w + 6} ${top + 10}V44M${cx + w - 6} ${top + 10}V44`,
  shine: `M${cx - w + 2.2} ${top + 12}C${cx - w + 2.4} ${top + 8} ${cx - w + 4} ${top + 5} ${cx - w + 7} ${top + 3.4}`,
});

/** A shirt's ivory V at the throat. */
const shirt = (cx: number, top: number, deep = 10): EmblemPart => ({
  d: `M${cx - 4.6} ${top + 0.4}L${cx} ${top + deep}L${cx + 4.6} ${top + 0.4}Z`,
  m: "ivory",
  ink: 1.1,
});

/** Short strokes of light round something lit, from `a0` to `a1`
 *  degrees (SVG: clockwise from +x), between radii `r0` and `r1`. */
const rays = (cx: number, cy: number, r0: number, r1: number, n: number, a0: number, a1: number, color: string, w = 0.9): EmblemPart => ({
  line: Array.from({ length: n }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / Math.max(n - 1, 1)) * Math.PI) / 180;
    return `M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}`;
  }).join(""),
  color,
  w,
});

/** A hooded cloak down to the box's foot, its peak at (24, top). */
const hoodPath = (top: number, peak = 0) =>
  `M${24 + peak} ${top}C32.6 ${top} 36.6 ${top + 6.4} 36.4 18.4C40.2 21 43 25.4 43.4 31L44 44H4L4.6 31C5 25.4 7.8 21 11.6 18.4C11.4 ${top + 6.4} 15.4 ${top} ${24 + peak} ${top}Z`;

// The cloth. Watchers: ivory, a scholar's oxblood, a tracker's olive
// oilskin, a steward's bottle green, the watch's teal. Ghosts: violet,
// ash and a black-crimson.
const OXBLOOD = "#6E3424";
const OLIVE = "#6A5A30";
const LEATHER = "#5A3818";
const BOTTLE = "#24503E";
const TEAL = "#1F5458";
const VIOLET = "#4E2E6E";
const ASH = "#58546A";
const GRAVE = "#3A1626";
const SHADOW = "#1C1626";

// --- The Prophet: an ivory hood, a crystal ball glowing in the hands ---

const PROPHET: EmblemData = [
  {
    d: hoodPath(3.6),
    m: "ivory",
    vein: "M12.6 24Q14 32 13.6 44M35.4 24Q34 32 34.4 44",
    shine: "M13.6 16C13.8 10.6 16.4 6.8 20.6 5.6",
  },
  // the face in the hood's shadow
  { d: oval(24, 16.8, 8.6, 9.2), m: SHADOW, ink: 1.2 },
  { d: headPath(24, 17.8, 6.6), m: "gold", round: true, ink: 1, shine: "M19.6 16.6A4.6 4.6 0 0 1 22.6 13.4" },
  // the hood's gold hem round the face
  { d: oval(24, 16.8, 9.8, 10.4) + oval(24, 16.8, 8.4, 9), evenOdd: true, m: "gold", ink: 1, shine: "M15.6 12A9 9 0 0 1 20 7.4", sw: 0.8 },
  // the crystal ball, its light spilling on the robe
  rays(24, 33.4, 8.6, 11, 5, 200, 340, "#BFF4FA", 0.9),
  { d: disc(24, 33.4, 7.2), m: "night", round: true, ink: 1.3, shine: "M18.8 31A5.6 5.6 0 0 1 22 27.6" },
  { d: sparkle(26.6, 35, 3.4), m: "silver", ink: 0.7 },
  { d: sparkle(21.4, 36.4, 1.8), m: "silver", ink: 0.5 },
  hand(16.6, 37.6, 2.8),
  hand(31.4, 37.6, 2.8),
];

// --- The Apprentice: a scholar's cap, an open book held up ---

const APPRENTICE: EmblemData = [
  coat(OXBLOOD, 24, 22),
  shirt(24, 22, 8),
  head(24, 15),
  // the mortarboard: a skullcap under a flat square seen edge-on
  { d: "M16.4 9.8Q24 7.4 31.6 9.8V13Q24 11 16.4 13Z", m: "#2A2A34", ink: 1.1 },
  {
    d: "M7.4 9.6L24 4.4L40.6 9.6L24 14.6Z",
    m: "#2A2A34",
    ink: 1.3,
    vein: "M11 9.6L24 5.6",
    vw: 0.6,
    shine: "M10.4 9.4L22.6 5.6",
    sw: 0.8,
  },
  { line: "M24 9.4L37.6 10.6L37.6 16.4", color: "#E2B04A", w: 1 },
  { d: "M36.4 15.8H38.8L39.6 20H35.6Z", ink: 0.9 },
  { d: disc(24, 9.4, 1.3), ink: 0.8, round: true },
  // the open book, its crimson cover behind the pages
  { d: "M24 29.4Q17 26.6 10.4 28.2V41.6Q17 40.2 24 42.8Q31 40.2 37.6 41.6V28.2Q31 26.6 24 29.4Z", m: "crimson", ink: 1.2 },
  {
    d: "M24 30Q18 27.2 12 28.8V40Q18 38.8 24 41.4Z",
    m: "ivory",
    ink: 1.1,
    vein: "M14.4 31.6Q18 30.6 21.8 32.2M14.4 34.4Q18 33.4 21.8 35M14.4 37.2Q18 36.2 21.8 37.8",
    vw: 0.6,
    shine: "M13.2 30.2V38",
    sw: 0.7,
  },
  {
    d: "M24 30Q30 27.2 36 28.8V40Q30 38.8 24 41.4Z",
    m: "ivory",
    ink: 1.1,
    vein: "M26.2 32.2Q30 30.6 33.6 31.6M26.2 35Q30 33.4 33.6 34.4M26.2 37.8Q30 36.2 33.6 37.2",
    vw: 0.6,
  },
  { d: "M28.6 29.4L30.6 28.8V33.6L29.6 32.6L28.6 33.6Z", m: "crimson", ink: 0.7 },
  hand(10.6, 38.4, 2.6),
  hand(37.4, 38.4, 2.6),
];

// --- The Tracker: a wide-brimmed hat, an oilskin coat, a glass held up
// to read the trail ---

const GLASS: Pt = [35.4, 27];
const TRACKER: EmblemData = [
  coat(OLIVE, 21, 22, 17),
  shirt(21, 22, 7),
  { d: "M16.8 23.4Q21 27.6 25.2 23.4L26 26.2Q21 30.6 16 26.2Z", m: "crimson", ink: 1 },
  head(21, 15.4),
  // the hat: a dented crown, a band, a brim tipped down at the front
  {
    d: "M13.4 12C13 7.4 14.6 5 18 5C19.4 5 20 6 21 6C22 6 22.6 5 24 5C27.4 5 28.6 7.4 28.2 12Z",
    m: LEATHER,
    ink: 1.3,
    vein: "M20.8 6.8V10.8",
    vw: 0.7,
    shine: "M15.2 11C15 8.4 15.6 7 16.8 6.6",
    sw: 0.8,
  },
  { d: "M13.2 9.6H28.4V12H13.2Z", m: "#2A1A0E", ink: 0.9 },
  {
    d: "M4.4 13.4C4.4 11.2 10 10.6 20.8 10.6C31.6 10.6 37.2 11.2 37.2 13.4C37.2 15.4 32 15.2 20.8 15.6C9.6 15.2 4.4 15.4 4.4 13.4Z",
    m: LEATHER,
    ink: 1.3,
    shine: "M6.6 13C9 12.2 13 12 17 12",
    sw: 0.8,
  },
  // the magnifying glass: a wooden handle, a gold rim, the lens catching
  // the moon
  { d: "M30.6 33.6L33 35.6L27.4 43.4Q25.4 44 24.6 42Z", m: "wood", ink: 1.1, shine: "M30.4 35.4L26.4 41.2", sw: 0.6 },
  { d: disc(GLASS[0], GLASS[1], 6.4), m: "night", round: true, ink: 0, op: 0.9 },
  { d: "M32.4 24.6Q34.6 22.4 37.6 22.8L33 28.6Z", m: "silver", ink: 0, op: 0.8 },
  {
    d: ring(GLASS[0], GLASS[1], 8, 6.2),
    evenOdd: true,
    ink: 1.2,
    shine: "M29.6 24.6A7 7 0 0 1 33.4 20.4",
    sw: 0.8,
  },
  hand(27.6, 39.6, 2.6),
];

// --- The Keeper: a steward's waistcoat, a great ring of keys ---

/** A key hanging from (0, 0) on its ring, `k` its scale. */
const key = (m: "gold" | "iron" | "silver", k: number, t: string): EmblemPart => ({
  d:
    ring(0, 0, 2.4 * k, 1.1 * k) +
    `M${f(-0.75 * k)} ${f(2.2 * k)}H${f(0.75 * k)}V${f(8.4 * k)}H${f(3 * k)}V${f(9.6 * k)}H${f(2 * k)}V${f(10.8 * k)}H${f(3 * k)}V${f(12 * k)}H${f(-0.75 * k)}Z`,
  evenOdd: true,
  m,
  ink: 0.9,
  t,
});

const RING_C: Pt = [34.4, 24];
const KEEPER: EmblemData = [
  coat(BOTTLE, 22, 22, 18),
  // the waistcoat's ivory front and its buttons
  { d: "M17.6 22.6L22 33L26.4 22.6Q24.4 22 22 22Q19.6 22 17.6 22.6Z", m: "ivory", ink: 1 },
  { d: "M18.4 30L22 36.6L25.6 30V44H18.4Z", m: "#A8743E", ink: 1, vein: "M22 37V44", vw: 0.6 },
  { d: disc(22, 39.6, 0.8) + disc(22, 42.4, 0.8), ink: 0.6 },
  head(22, 14.6),
  // the keys hanging from the ring, then the ring, then the hand on it
  key("iron", 0.92, `translate(${RING_C[0] - 4} ${RING_C[1] + 5}) rotate(30)`),
  key("silver", 0.9, `translate(${RING_C[0] + 3.6} ${RING_C[1] + 5.2}) rotate(-16)`),
  key("gold", 1.1, `translate(${RING_C[0]} ${RING_C[1] + 6}) rotate(-2)`),
  {
    d: ring(RING_C[0], RING_C[1], 7, 5.4),
    evenOdd: true,
    m: "gold",
    ink: 1.1,
    shine: "M28.4 22A6.2 6.2 0 0 1 31.6 18.6",
    sw: 0.8,
  },
  hand(RING_C[0] + 5.4, RING_C[1] - 4.2, 2.8),
];

// --- The Watcher: the watch's cap and teal coat, a lantern held high ---

const LANTERN: Pt = [34.8, 14];
const ARM = ribbon(
  [
    [29.6, 28],
    [33, 21],
    [34.8, 9.6],
  ],
  [5.4, 4.4, 3.6],
);
const WATCHER: EmblemData = [
  coat(TEAL, 20, 22, 16),
  shirt(20, 22, 8),
  { d: disc(20, 33, 1) + disc(20, 37, 1), ink: 0.6 },
  head(20, 15),
  // the watchman's cap: a dark crown, a gold band and badge, a peak
  {
    d: "M11.4 11.2C11 6.8 14.4 4.4 20 4.4C25.6 4.4 29 6.8 28.6 11.2Z",
    m: "#1E2A4A",
    ink: 1.3,
    shine: "M13.4 9.8C13.6 7.4 15.4 5.8 18 5.4",
    sw: 0.8,
  },
  { d: "M11.2 9.4H28.8V11.6H11.2Z", ink: 1 },
  { d: sparkle(20, 7.4, 2.2, 0.3), m: "silver", ink: 0.6 },
  { d: "M11 11.4H29.4Q29 14 22 14.2Q13.4 14 11 11.4Z", m: "#14182A", ink: 1.1 },
  // the arm raised, the hand round the bail
  { d: ARM.outline, m: TEAL, ink: 1.1, vein: ARM.grooves, vw: 0.5 },
  rays(LANTERN[0], LANTERN[1] + 1, 7.2, 9, 5, -60, 40, "#FFD27A", 1),
  { line: "M32 8.6Q34.8 3.8 37.6 8.6", color: "#3A2408", w: 1 },
  // the lantern: a gold cap, glass with the flame in it, a gold foot
  { d: "M30.8 8.4H38.8L37.6 10.6H32Z", ink: 1, shine: "M32.4 9.4H35.4", sw: 0.6 },
  { d: rrect(31.2, 10.6, 7.2, 8.4, 1), m: "#2A2030", ink: 1.1 },
  { d: LEAF(6.8, 2.8), m: "flame", ink: 0.7, t: "translate(34.8 18.2)" },
  { d: LEAF(3, 1.2), m: "ivory", ink: 0, t: "translate(34.8 17.6)" },
  { line: "M33.2 10.8V18.8M36.4 10.8V18.8", color: "#9A6B1E", w: 0.6 },
  { d: "M30.6 19H39V21H30.6Z", ink: 1 },
  hand(34.8, 6.6, 2.3),
];

// --- The Double: a violet coat and a silver domino mask, its decoy
// standing pale and hollow behind it ---

const DOUBLE: EmblemData = [
  // the decoy: the same meeple, pale and hollow, one step behind
  { d: shouldersPath(15, 20, 11), m: "#A8A2C4", ink: 1, op: 0.8, vein: "M10.6 32V44M19.4 32V44", vw: 0.6 },
  { d: headPath(15, 12.4, 6.8), m: "silver", round: true, ink: 1, op: 0.85 },
  coat(VIOLET, 29, 23, 14),
  shirt(29, 23, 8),
  { d: disc(29, 33.6, 1) + disc(29, 37.6, 1), ink: 0.6 },
  head(29, 15.6),
  // the domino mask over the eyes, a ruby at its brow
  {
    d: "M20.8 14.6C23 12.6 26.6 12.8 29 14C31.4 12.8 35 12.6 37.2 14.6C38.2 17 36.6 19.6 33.6 19.6C31.6 19.6 30 18.6 29 17.8C28 18.6 26.4 19.6 24.4 19.6C21.4 19.6 19.8 17 20.8 14.6Z",
    m: "silver",
    ink: 1.2,
    shine: "M22.4 14.8Q24.8 13.6 27 14.2",
    sw: 0.8,
  },
  { dark: "M22.6 16.4Q25 14.4 27.4 16.4Q25 18.2 22.6 16.4ZM30.6 16.4Q33 14.4 35.4 16.4Q33 18.2 30.6 16.4Z" },
  { jewel: "ruby", x: 29, y: 13.4, r: 1.6 },
];

// --- The Hermit: a deep ashen hood, a crooked staff, fog round the feet ---

const FOG_LOW = ribbon(
  [
    [4.6, 39.4],
    [13, 36.8],
    [24, 39.6],
    [35, 37],
    [43.4, 38.6],
  ],
  [1.2, 3.4, 3.8, 3.2, 1.2],
);
const FOG_HIGH = ribbon(
  [
    [16, 31.4],
    [26, 29.2],
    [36, 31.6],
    [43.2, 30.2],
  ],
  [1.2, 3, 2.8, 1],
);
const HERMIT: EmblemData = [
  // the staff behind, a crook at its head
  { d: "M8.6 44L9.6 12.8H11.8L11 44Z", m: "wood", ink: 1, shine: "M9.6 16V40", sw: 0.6 },
  { d: curl(10.6, 13.6, -1.75, 13, 3.4, 2.6, 0.5).outline, m: "wood", ink: 1 },
  {
    d: "M24.6 3.8C31.6 4.8 36.6 10.8 36.4 18.4C40.2 21 43 25.4 43.4 31L44 44H4L4.6 31C5 25.4 7.8 21 11.6 18.4C11.4 10.4 16.8 5.2 24.6 3.8Z",
    m: ASH,
    vein: "M12.6 24Q14 32 13.6 44M35.4 24Q34 32 34.4 44M24 25V44",
    shine: "M13.8 16C14 10.6 16.8 6.6 21 4.8",
  },
  // the face lost deep in the hood: a sliver of the meeple's head
  { d: oval(24, 18.2, 7.2, 7.8), m: SHADOW, ink: 1.2 },
  { d: headPath(24, 21.6, 5), m: "gold", round: true, ink: 0.9, op: 0.75 },
  { d: "M16.4 15.4C17.6 11.6 20.4 10 24 10C27.6 10 30.4 11.6 31.6 15.4C29 14.6 26.6 14.4 24 14.4C21.4 14.4 19 14.6 16.4 15.4Z", m: ASH, ink: 1 },
  // the hand on the staff, fog drifting over the hem
  hand(10.8, 24.6, 2.6),
  { d: FOG_HIGH.outline, m: "silver", ink: 1, shine: FOG_HIGH.shine, sw: 0.7, op: 0.92 },
  { d: FOG_LOW.outline, m: "silver", ink: 1.1, shine: FOG_LOW.shine, sw: 0.7, op: 0.95 },
];

// --- The Possessed: a ghost's pale sheet over a black-crimson coat, a
// ruby at its clasp ---

// the ghost: a pale sheet draped over the meeple, the gold showing
// through it, its hem fluttering across the chest
const HEM = Array.from({ length: 5 }, (_, i) => {
  const x0 = 39.4 - i * 6.16;
  const x1 = x0 - 6.16;
  const y = 31 + (i % 2 ? -0.6 : 0.4);
  return `C${f(x0 - 1.2)} ${f(y + 4.4)} ${f(x1 + 1.8)} ${f(y + 4.4)} ${f(x1)} ${f(y)}`;
}).join("");
const SHEET = `M11.4 17.4A12.6 12.6 0 0 1 36.6 17.4C37 22 37.8 27 39.4 31${HEM}C10.2 27 11 22 11.4 17.4Z`;
const SMOKE = "#E6E0F6";
const POSSESSED: EmblemData = [
  coat(GRAVE, 24, 23),
  head(24, 15),
  {
    d: SHEET,
    m: SMOKE,
    ink: 1.1,
    op: 0.9,
    vein: "M18 22Q17 27 17.6 32.4M30 22Q31 27 30.4 32.4M24 27V33",
    vw: 0.6,
    shine: "M14 15.6A10.4 10.4 0 0 1 19.4 7.2",
    sw: 1,
  },
  // the gold meeple, faint through the sheet
  { d: headPath(24, 15, 7.4), m: "gold", round: true, ink: 0, op: 0.35 },
  // the crimson clasp of the coat below the hem
  { d: "M20.4 35.6H27.6L24 40.4Z", m: "crimson", ink: 0.9 },
  { jewel: "ruby", x: 24, y: 37.4, r: 2.2 },
];

/** Every role's portrait, keyed by the engine's role id. */
export const ROLE_EMBLEMS: Record<Role, EmblemData> = {
  prophet: PROPHET,
  apprentice: APPRENTICE,
  tracker: TRACKER,
  keeper: KEEPER,
  watcher: WATCHER,
  double: DOUBLE,
  hermit: HERMIT,
  possessed: POSSESSED,
};


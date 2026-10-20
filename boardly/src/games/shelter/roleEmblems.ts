// Shelter's two roles as engraved portraits (see "Roles" in the root
// CLAUDE.md and "The house drawing style" in AGENTS.md): a faceless
// Boardly meeple, head and shoulders, dressed for a snowed-in winter
// house. The Survivor wears a knit beanie and scarf, a pack strap over
// the shoulder and a tin of food in a mitten; the Infected is the same
// survivor gone wrong: the scarf torn, green spots on the coat, a
// bandaged head and a crimson stain, spores rising. Drawn in a 48 × 48
// box as EmblemData; look them over with
//   node scripts/emblem-sheet.mjs src/games/shelter/roleEmblems.ts out.png ROLE_EMBLEMS

import { disc, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";
import { ribbon } from "@/components/engraved/shapes";
import type { Role } from "./logic";

const f = (n: number) => +n.toFixed(2);

/** A rounded rectangle. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

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

// The cloth: a canvas winter coat, a teal knit beanie, a cream scarf with
// teal stripes; for the Infected the coat gone sallow.
const COAT = "#8A6438";
const SALLOW = "#7C7438";
const KNIT = "#2E7D6B";
const SCARF = "#EFE4CC";
const STRIPE = "#2E7D6B";
const PACK = "#3E4E66";

/** A winter coat: a front seam, pockets, a line of light on the left. */
const coat = (m: `#${string}`): EmblemPart => ({
  d: shouldersPath(24, 22, 19),
  m,
  vein: "M24 30V44M10.6 35V44M37.4 35V44M14 38H20M28 38H34",
  shine: "M7.2 34C7.4 30 9 27 12 25.4",
});

/** The knit beanie: a dome, a ribbed cuff, an ivory pompom on top. */
const beanie = (t?: string): EmblemPart[] => [
  {
    d: "M16 11.6C16 7.6 19 5.6 24 5.6C29 5.6 32 7.6 32 11.6Z",
    m: KNIT,
    t,
    ink: 1.3,
    vein: "M19.8 7Q19 8.8 19.2 11.2M24 6.2V11.2M28.2 7Q29 8.8 28.8 11.2",
    vw: 0.7,
    shine: "M17.6 10.4Q18 8.2 20.4 7",
    sw: 0.9,
  },
  {
    d: rrect(15, 9.8, 18, 4.2, 2),
    m: KNIT,
    t,
    ink: 1.2,
    vein: "M17.6 10.2V13.6M20 10.2V13.6M22.4 10.2V13.6M24.8 10.2V13.6M27.2 10.2V13.6M29.6 10.2V13.6",
    vw: 0.6,
  },
  {
    d: disc(24, 6.2, 2.2),
    m: "ivory",
    t,
    round: true,
    ink: 1.1,
    vein: "M22.8 5.4L23.5 6M25.2 5.4L24.5 6M24 7.6V6.8",
    vw: 0.5,
  },
];

/** The scarf wound round the neck, its knit ribbed across. */
const SCARF_WRAP: EmblemPart = {
  d: "M14.4 20.6Q24 25.6 33.6 20.6L34.4 25.4Q24 30.8 13.6 25.4Z",
  m: SCARF,
  ink: 1.3,
  vein: "M18 23.8L17.6 27.4M21.4 24.8L21.2 28.6M27 24.8L26.8 28.6M30.4 23.8L30.8 27.4",
  vw: 0.6,
  shine: "M15.6 21.8Q19.4 24 23.6 24.6",
  sw: 0.8,
};

// --- The Survivor: beanie and scarf, a pack strap, a tin in a mitten ---

const TAIL = ribbon(
  [
    [28.6, 26.4],
    [30, 32],
    [29.6, 39.6],
  ],
  [5.4, 5, 4.8],
);
const STRAP = ribbon(
  [
    [13.2, 24],
    [14.6, 33],
    [15.4, 44],
  ],
  [3.2, 3.2, 3.2],
);

/** The rucksack on the back, peeking over the left shoulder, its strap
 *  down the front with a tin buckle. */
const pack = (buckle: "silver" | "iron"): EmblemPart[] => [
  {
    d: rrect(4.4, 15.6, 12, 18, 4),
    m: PACK,
    ink: 1.2,
    vein: "M6.4 22.4H14.4",
    vw: 0.6,
    shine: "M6 25V19.4Q6 17.4 8 17.2",
    sw: 0.9,
  },
  { d: "M5.6 17.6Q10.4 14.6 15.2 17.6L15 21.8Q10.4 23.2 5.8 21.8Z", m: PACK, ink: 1, vein: "M10.4 19.6V22.6", vw: 0.6 },
];
const strap = (buckle: "silver" | "iron"): EmblemPart[] => [
  { d: STRAP.outline, m: "wood", ink: 1.1, vein: STRAP.grooves, vw: 0.5 },
  { d: rrect(12.4, 31.4, 4.8, 3.6, 0.8), m: buckle, ink: 0.9, shine: "M13.4 32.4H15.6", sw: 0.6 },
];

const SURVIVOR: EmblemData = [
  ...pack("silver"),
  coat(COAT),
  ...strap("silver"),
  head(24, 15.4),
  ...beanie(),
  // the scarf's tail down the chest, striped, fringed
  { d: TAIL.outline, m: SCARF, ink: 1.2 },
  { line: "M27.4 31.4L32.4 31M27.4 33.6L32.4 33.4", color: STRIPE, w: 1.2 },
  { line: "M27.6 40.4V42.2M29.6 40.6V42.6M31.6 40.4V42.2", color: "#7A6A48", w: 0.8 },
  SCARF_WRAP,
  { line: "M15.6 22.6Q24 26.8 32.4 22.6", color: STRIPE, w: 1.1 },
  // a tin of food held up in a knit mitten
  {
    d: "M34.4 25.8H43.2V37.4C43.2 38.4 41.2 39 38.8 39C36.4 39 34.4 38.4 34.4 37.4Z",
    m: "silver",
    ink: 1.2,
    vein: "M34.6 28.2Q38.8 29.2 43 28.2M34.6 35.4Q38.8 36.4 43 35.4",
    vw: 0.6,
    shine: "M35.8 28.8V35",
    sw: 0.9,
  },
  { d: "M34.4 29.2Q38.8 30.4 43.2 29.2V34.4Q38.8 35.6 34.4 34.4Z", m: "night", ink: 0.8 },
  { d: "M37 31.4Q38.8 30.6 40.6 31.8Q38.8 33.2 37 32.6Z", m: "ivory", ink: 0.6 },
  {
    d: "M34.4 25.8C34.4 24.8 36.4 24.2 38.8 24.2C41.2 24.2 43.2 24.8 43.2 25.8C43.2 26.8 41.2 27.4 38.8 27.4C36.4 27.4 34.4 26.8 34.4 25.8Z",
    m: "silver",
    ink: 1,
    vein: "M36.4 25.8Q38.8 26.6 41.2 25.8",
    vw: 0.5,
  },
  {
    d: "M33.2 36C33.2 34 35.4 33.2 38.6 33.2C41.6 33.2 44 34 44 36.4C44 39.6 41.8 41.6 38.6 41.6C35.4 41.6 33.2 39.4 33.2 36Z",
    m: KNIT,
    round: true,
    ink: 1.2,
    vein: "M35.2 36.4V40M37.6 36V41M40 36V41M42.2 36.4V39.8",
    vw: 0.5,
    shine: "M34.6 35.2Q36 34.2 38 34.2",
    sw: 0.8,
  },
];

// --- The Infected: the same survivor gone wrong ---

const TILT = "rotate(10 24 16)";
// the scarf's tail torn short, ragged at the end
const TORN =
  "M26 26.2L31.2 26C31.8 28.6 32 30.6 31.8 32.6L30.6 31.4L30.2 34L28.8 32.4L28 35.2L27 33L26.2 34.4C26 31.4 25.8 28.6 26 26.2Z";
// the sickly green blotches on the cloth
const SPOTS = [
  [19.8, 32, 2],
  [10.8, 39.8, 1.7],
  [35.4, 31.8, 2.2],
  [37.8, 39.8, 1.6],
  [24.2, 40.4, 1.5],
] as const;
/** A sickly blotch, lumpy round its edge. */
const blot = (x: number, y: number, r: number, seed: number) =>
  `M${Array.from({ length: 20 }, (_, k) => {
    const a = (k / 20) * Math.PI * 2;
    const q = r * (1 + 0.1 * Math.sin(2 * a + seed * 1.7) + 0.07 * Math.sin(5 * a + seed));
    return `${f(x + Math.cos(a) * q)} ${f(y + Math.sin(a) * q)}`;
  }).join("L")}Z`;
// a sticking plaster crossed on the temple
const PLASTER = rrect(25.6, 15.2, 9, 3, 1.4);

const INFECTED: EmblemData = [
  ...pack("iron"),
  coat(SALLOW),
  ...strap("iron"),
  ...SPOTS.map(([x, y, r], i): EmblemPart => ({ d: blot(x, y, r, i), m: "leaf", round: true, ink: 0.8 })),
  head(24, 16.4, 8, TILT),
  ...beanie(TILT),
  { d: PLASTER, m: "ivory", t: `${TILT} rotate(38 30.1 16.7)`, ink: 0.9 },
  { d: PLASTER, m: "ivory", t: `${TILT} rotate(-38 30.1 16.7)`, ink: 0.9, vein: "M28.6 16.7H31.6", vw: 0.4 },
  { d: disc(30.1, 16.7, 1.2), m: "crimson", t: TILT, ink: 0.5 },
  { d: TORN, m: SCARF, ink: 1.1 },
  { line: "M26.2 29.8L31.6 29.4", color: STRIPE, w: 1.1 },
  SCARF_WRAP,
  { line: "M15.6 22.6Q24 26.8 32.4 22.6", color: STRIPE, w: 1.1 },
  // a crimson stain soaked into the scarf
  { d: "M18.6 24.2Q20.6 23.4 21.6 25.2Q22 27.4 19.8 27.6Q18 27.2 18.6 24.2Z", m: "crimson", ink: 0.6 },
  // spores rising off the shoulder
  { d: disc(39, 22.6, 2.4), m: "leaf", round: true, ink: 0.9 },
  { d: disc(41.8, 16.8, 1.8), m: "leaf", round: true, ink: 0.8 },
  { d: disc(39, 11.8, 1.3), m: "leaf", round: true, ink: 0.7 },
];

/** Every role's portrait, keyed by the engine's role id. */
export const ROLE_EMBLEMS: Record<Role, EmblemData> = {
  survivor: SURVIVOR,
  infected: INFECTED,
};

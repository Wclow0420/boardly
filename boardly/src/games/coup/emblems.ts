// Hustle's role portraits as engraved emblems (see "The house drawing
// style" in AGENTS.md and "Roles" in the root CLAUDE.md): each role a
// faceless Boardly meeple, head and shoulders, told apart by what it
// wears and holds, dressed for a Chinatown gambling den at night (red
// lacquer, jade, gold, mahjong). Each wears its role's tint (ROLE_TINT,
// its card's window) as the accent. Drawn in a 48 × 48 box as
// EmblemData; look them over with
//   node scripts/emblem-sheet.mjs src/games/coup/emblems.ts out.png ROLE_EMBLEMS

import { disc, type EmblemData, type EmblemPart, type Shade } from "@/components/engraved/emblem";
import { ribbon, type Pt } from "@/components/engraved/shapes";
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

/** A jacket over the shoulders, its lapels engraved, lit on the left. */
const jacket = (m: Shade, cx = 24, top = 21, w = 19, extra = ""): EmblemPart => ({
  d: shouldersPath(cx, top, w),
  m,
  vein: `M${cx - 5} ${top + 0.5}L${cx - 2} ${top + 14}M${cx + 5} ${top + 0.5}L${cx + 2} ${top + 14}M${cx - w + 6} ${top + 10}V44M${cx + w - 6} ${top + 10}V44${extra}`,
  shine: `M${cx - w + 2.2} ${top + 12}C${cx - w + 2.4} ${top + 8} ${cx - w + 4} ${top + 5} ${cx - w + 7} ${top + 3.4}`,
});

/** The meeple's gold hand, a round knob. */
const hand = (x: number, y: number, r = 2.8): EmblemPart => ({ d: disc(x, y, r), m: "gold", round: true, ink: 1.1 });

// The den's cloth and accents.
const LACQUER_BLACK = "#24202A";
const JADE = "#1E9A62";
const JADE_DEEP = "#147048";
const TWEED = "#B8742E";
const CHARCOAL = "#3A3A44";
const VIOLET = "#4E3A92";
const ROSE = "#C8457F";

// --- The Boss: a black suit, a fat gold chain with a cash coin on it,
// a cigar smouldering, its smoke curling up ---

/** A chain of round gold links along `pts`. */
const chain = (pts: Pt[], r: number) => pts.map(([x, y]) => disc(f(x), f(y), r)).join("");
const chainLinks = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

const CIGAR_T = "rotate(14 30 18)";
const SMOKE = ribbon(
  [
    [41.4, 16.4],
    [42.6, 12.6],
    [40.4, 9.6],
    [41.6, 6.8],
    [40.4, 5],
  ],
  [0.6, 1.4, 1.6, 1.1, 0.4],
);
const BOSS: EmblemData = [
  jacket(LACQUER_BLACK, 23, 21, 19, "M10 34V44M14 33V44M33 33V44M36 34V44"),
  // a crimson silk shirt open at the throat, a pocket square to match
  { d: "M18.4 21.4L23 31.4L27.6 21.4Z", m: "crimson", ink: 1.1 },
  { d: "M31.2 31.6L36.6 31L36 34.2L31.6 34.6Z", m: "crimson", ink: 0.9 },
  head(23, 13.5),
  // the cigar, from the mouth's side, a gold band and a live ember
  { d: rrect(29.6, 16.4, 11, 3.2, 1.6), m: "#7A4A26", t: CIGAR_T, ink: 1, vein: "M32.6 16.6V19.4", vw: 0.6 },
  { d: rrect(31.4, 16.3, 1.6, 3.4, 0.4), m: "gold", t: CIGAR_T, ink: 0.7 },
  { d: rrect(39.2, 16.6, 2, 2.8, 1), m: "flame", t: CIGAR_T, ink: 0.8 },
  { d: SMOKE.outline, m: "ivory", ink: 0.6, op: 0.85 },
  // the chain, heavy round links round the collar, and the coin
  { d: chain(chainLinks(23, 22, 7.4, 8.2, 160, 20, 9), 1.15), round: true, ink: 0.8 },
  {
    d: disc(23, 33.6, 4.8) + rrect(21.5, 32.1, 3, 3, 0.3),
    evenOdd: true,
    round: true,
    ink: 1.2,
    vein: `M23 33.6m-3.6 0a3.6 3.6 0 1 1 7.2 0a3.6 3.6 0 1 1 -7.2 0`,
    vw: 0.6,
    shine: "M19.6 32.4A3.8 3.8 0 0 1 21.4 30",
    sw: 0.8,
  },
];

// --- The Enforcer: a jade bandana, a white vest, a fist raised in a
// steel knuckle-duster ---

const FIST_X = 30;
const FIST_Y = 17;
const ENFORCER: EmblemData = [
  // bare gold shoulders, then the vest over them
  { d: shouldersPath(21, 21, 18), m: "gold", round: true, ink: 1.4 },
  {
    d: "M13.6 22.4L16.6 21.6Q21 29.8 25.4 21.6L28.4 22.4Q29 28.6 33.4 32.4V44H8.6V32.4Q13 28.6 13.6 22.4Z",
    m: "ivory",
    ink: 1.2,
    vein: "M11 36V44M31 36V44",
    vw: 0.6,
    shine: "M11 33.4Q13.6 30.4 14.4 25.6",
    sw: 0.9,
  },
  head(21, 13.5),
  // the bandana over the crown, knotted at the side, two tails
  {
    d: "M13.4 12.6C13.2 7.8 16.4 5.4 21 5.4C25.6 5.4 28.8 7.8 28.6 12.6Q21 9.6 13.4 12.6Z",
    m: JADE,
    ink: 1.2,
    vein: "M15.6 10.4Q21 8.4 26.4 10.4",
    vw: 0.6,
    shine: "M15.2 9.2Q16.6 6.6 20 6.2",
    sw: 0.8,
  },
  { d: "M13.6 11.2L8.4 9.4L9.6 12.6L7.2 15.4L13.4 13.4Z", m: JADE_DEEP, ink: 1 },
  { d: disc(13.6, 12.2, 1.7), m: JADE_DEEP, ink: 0.9 },
  // the forearm, up from the foot of the box
  { d: `M${FIST_X + 2} 44L${FIST_X + 2.4} ${FIST_Y + 10}H${FIST_X + 11}L${FIST_X + 11.6} 44Z`, m: "gold", ink: 1.2, shine: `M${FIST_X + 3.8} 42V${FIST_Y + 13}`, sw: 0.8 },
  // the fist from the front: the back of the hand, four fingers curled
  // over it, the thumb across them
  { d: rrect(FIST_X, FIST_Y + 3, 13.6, 10.4, 3.6), m: "gold", round: true, ink: 1.3 },
  ...[0, 1, 2, 3].map(
    (i): EmblemPart => ({
      d: rrect(FIST_X - 0.2 + i * 3.5, FIST_Y - 0.6 + (i === 0 || i === 3 ? 0.8 : 0), 3.5, 8.6, 1.75),
      m: "gold",
      round: true,
      ink: 1,
    }),
  ),
  {
    d: rrect(FIST_X - 0.6, FIST_Y + 7.6, 9.6, 3.8, 1.9),
    m: "gold",
    round: true,
    ink: 1.1,
    t: `rotate(-12 ${FIST_X + 4} ${FIST_Y + 9.5})`,
    shine: `M${FIST_X + 1} ${FIST_Y + 8.6}H${FIST_X + 5}`,
    sw: 0.7,
  },
  // the knuckle-duster: a steel ring round each finger, joined
  {
    d: [0, 1, 2, 3].map((i) => rrect(FIST_X - 0.7 + i * 3.5, FIST_Y + 2.2 - (i === 1 || i === 2 ? 0.3 : 0), 4.5, 3.6, 1.6)).join(""),
    m: "silver",
    ink: 1.1,
    vein: `M${FIST_X + 3.3} ${FIST_Y + 2.4}V${FIST_Y + 5.6}M${FIST_X + 6.8} ${FIST_Y + 2.2}V${FIST_Y + 5.6}M${FIST_X + 10.3} ${FIST_Y + 2.4}V${FIST_Y + 5.6}`,
    vw: 0.7,
    shine: `M${FIST_X + 0.6} ${FIST_Y + 3.2}H${FIST_X + 5}`,
    sw: 0.8,
  },
];

// --- The Pickpocket: a tweed flat cap pulled low, a black glove
// lifting a crimson purse ---

const CAP_T = "rotate(-8 24 10)";
const PICKPOCKET: EmblemData = [
  jacket(CHARCOAL, 22, 22, 18),
  { d: "M17.4 22.4L22 30L26.6 22.4Z", m: "ivory", ink: 1 },
  // a scarf knotted at the throat
  { d: "M16.6 21.6Q22 25.4 27.4 21.6L27.8 24Q22 28 16.2 24Z", m: TWEED, ink: 1, vein: "M18.6 23.4L19.2 25.4M22 24.6V26.6M25.4 23.4L24.8 25.4", vw: 0.5 },
  head(22, 14.6),
  // the flat cap: a soft crown swelling forward over a short peak
  {
    d: "M12.6 13C12 8 15.6 5 22.6 4.8C29.6 4.6 33.8 6.8 33.6 10.4C33.4 12 32.2 12.8 30.4 13Z",
    m: TWEED,
    t: CAP_T,
    ink: 1.3,
    vein: "M15.2 9.6Q22 7.4 31.4 8.4M14.4 12Q14.6 8.4 17.6 6.6M19.4 12.4Q19.2 8.2 21.6 5.6M24.8 12.6Q25 8.6 26.6 5.4",
    vw: 0.55,
    shine: "M14.4 10Q15.4 6.6 19.6 5.8",
    sw: 0.8,
  },
  {
    d: "M11.6 13.2Q20 11 31 12.6Q32.6 13.6 30.6 14.8Q20 14.6 12.6 15.6Q10.6 14.8 11.6 13.2Z",
    m: "#7A4A1E",
    t: CAP_T,
    ink: 1.1,
  },
  { d: disc(23.6, 5.4, 1.1), m: "#7A4A1E", t: CAP_T, ink: 0.7 },
  // the purse, its gold kiss-lock and two ball clasps
  {
    d: "M31 30.6H42.6Q44 36 41.6 40.4Q36.8 42.6 32 40.4Q29.6 36 31 30.6Z",
    m: "crimson",
    round: true,
    ink: 1.2,
    vein: "M33.2 33.4Q36.8 34.6 40.4 33.4",
    vw: 0.6,
    shine: "M32 32.4Q31.6 35.6 32.8 38.4",
    sw: 0.8,
  },
  { d: "M30.6 29.4Q36.8 27.2 43 29.4L42.6 31.4Q36.8 29.6 31 31.4Z", ink: 1 },
  { d: disc(35.6, 27.8, 1.1) + disc(38, 27.8, 1.1), round: true, ink: 0.7 },
  // the black glove holding it up by the clasp, stitches down its back
  {
    d: "M33.4 22.6C33.4 20 35.2 18.6 37.6 18.6C40 18.6 41.6 20.2 41.6 22.6L41.4 26.6C41.2 28.4 39.8 29.4 37.6 29.4C35.4 29.4 33.8 28.4 33.6 26.6Z",
    m: "iron",
    round: true,
    ink: 1.2,
    shine: "M35 21.6Q35.6 19.8 37.2 19.6",
    sw: 0.8,
  },
  { d: rrect(31.2, 23.4, 3.2, 5.6, 1.6), m: "iron", t: "rotate(-28 32.8 26.2)", ink: 1 },
  { line: "M36.2 21.4V25.2M37.8 21.2V25.2M39.4 21.4V25.2", color: "#C9D0DA", w: 0.5 },
];

// --- The Fixer: shirtsleeves and a violet waistcoat, a lacquer phone
// held to the ear by the shoulder, two cards fanned in the other hand ---

const CORD = "M14.6 25.6Q12 27 13.4 28.4Q15 29.8 12.6 31Q10.4 32.4 12.4 33.8Q14 35 11.8 36.4Q10 37.6 11.6 39";
const card = (deg: number, pip: Shade): EmblemPart[] => {
  const t = `rotate(${deg} 35 40)`;
  return [
    { d: rrect(30.2, 24.4, 9.6, 14, 1.4), m: "ivory", t, ink: 1.1, shine: "M31.6 26.6V30", sw: 0.7 },
    { d: "M35 28.4L37.4 31.4L35 34.4L32.6 31.4Z", m: pip, t, ink: 0.7 },
  ];
};
const FIXER: EmblemData = [
  // the shirt's sleeves at the shoulders, the waistcoat over the chest
  { d: shouldersPath(23, 21, 19), m: "ivory", ink: 1.4, vein: "M8 32Q9 38 8.6 44M38 32Q37 38 37.4 44", vw: 0.6, shine: "M6.2 33C6.4 29 8 26 11 24.4" },
  {
    d: "M16.4 21.6L23 31L29.6 21.6Q32.4 22.4 33.4 24.4Q32.4 34 33.6 44H12.4Q13.6 34 12.6 24.4Q13.6 22.4 16.4 21.6Z",
    m: VIOLET,
    ink: 1.2,
    vein: "M23 31V44",
    vw: 0.7,
  },
  { d: disc(23, 34.6, 0.9) + disc(23, 38.4, 0.9) + disc(23, 42.2, 0.9), round: true, ink: 0.6 },
  // the tie, loosened
  { d: "M23 22.6L21.4 24.2L22.2 30.6L23.6 31.8L24.6 30.4L24.4 24.2Z", m: "crimson", ink: 0.9 },
  head(23, 13.5),
  // the lacquer handset at the ear, its coiled cord
  { line: CORD, color: "#5A0A18", w: 1 },
  {
    d: "M14.6 5.6C11 6.6 9.8 10 10.6 13.4L12.4 22C13 25 14.8 26.6 17.4 26.2L18.2 23.4C16.6 23 15.4 21.8 15 20L13.8 13.6C13.4 11.4 14.2 9.6 15.8 8.6Z",
    m: "crimson",
    ink: 1.2,
    shine: "M11.8 10.6L13.4 19",
    sw: 0.8,
  },
  { d: rrect(12.4, 4.2, 6, 4.4, 2), m: "crimson", t: "rotate(-24 15.4 6.4)", ink: 1.1 },
  { d: rrect(14.4, 23, 6, 4.4, 2), m: "crimson", t: "rotate(-30 17.4 25.2)", ink: 1.1 },
  // the two cards and the hand that holds them
  ...card(-14, "crimson"),
  ...card(10, "#7A5AD8"),
  hand(35, 39.6, 3),
];

// --- The Auntie: silver hair in a bun, a jade pin through it, a rose
// cardigan and pearls, a mahjong tile held up ---

const TILE_T = "rotate(10 36.4 31)";
const AUNTIE: EmblemData = [
  jacket(ROSE, 22, 24, 18, "M17.4 32V44"),
  // the blouse's round collar and the pearls
  { d: "M15.6 24.6Q18.6 23.6 22 24.6Q19.6 28.6 15.6 27.6Z", m: "ivory", ink: 1 },
  { d: "M28.4 24.6Q25.4 23.6 22 24.6Q24.4 28.6 28.4 27.6Z", m: "ivory", ink: 1 },
  {
    d: chain(chainLinks(22, 24.6, 6.4, 5, 170, 10, 9), 0.95),
    m: "ivory",
    round: true,
    ink: 0.6,
  },
  { d: disc(17.6, 34, 0.9) + disc(17.6, 38, 0.9) + disc(17.6, 42, 0.9), m: "ivory", round: true, ink: 0.6 },
  head(22, 16.4),
  // the hair, swept up into the bun, the jade pin through it
  {
    d: "M14 17.4C13.4 11.4 17 8.2 22 8.2C27 8.2 30.6 11.4 30 17.4C29 13.6 26.2 12 22 12.2C17.8 12 15 13.6 14 17.4Z",
    m: "silver",
    ink: 1.1,
    vein: "M17 13.2Q19 10.4 22 10.2M27 13.2Q25 10.4 22 10.2",
    vw: 0.6,
    shine: "M15.2 14.2Q16.2 10.4 19.6 9.4",
    sw: 0.8,
  },
  { line: "M15.6 5.2L29.4 9.4", color: "#0E5A36", w: 2 },
  { line: "M15.6 5.2L29.4 9.4", color: "#5AD49A", w: 0.8 },
  {
    d: disc(22, 7.8, 3.4),
    m: "silver",
    round: true,
    ink: 1.1,
    vein: "M22 7.8m-1.8 0a1.8 1.8 0 1 1 3.6 0",
    vw: 0.6,
  },
  { line: "M20.4 6.8L28.2 9.2", color: "#0E5A36", w: 2 },
  { line: "M20.4 6.8L28.2 9.2", color: "#5AD49A", w: 0.8 },
  { jewel: "emerald", x: 30.2, y: 9.6, r: 1.6 },
  // the mahjong tile: its jade back, the ivory face, a red 中
  { d: rrect(31.4, 22.6, 11, 15, 2), m: JADE, t: TILE_T, ink: 1.1 },
  { d: rrect(30.2, 22, 10.6, 14.4, 1.8), m: "ivory", t: TILE_T, ink: 1.1, shine: "M31.6 24.4V29", sw: 0.7 },
  { line: "M32.6 26.8H38.4V31.4H32.6Z", color: "#C2203A", w: 1, t: TILE_T },
  { line: "M35.5 24.6V34", color: "#C2203A", w: 1.2, t: TILE_T },
  hand(34.6, 37.4, 2.9),
];

/** Every role's portrait, keyed by the engine's role id. */
export const ROLE_EMBLEMS: Record<Role, EmblemData> = {
  duke: BOSS,
  assassin: ENFORCER,
  captain: PICKPOCKET,
  ambassador: FIXER,
  contessa: AUNTIE,
};

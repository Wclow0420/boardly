// Shelter's icons as engraved emblems (the house style: see "The house
// drawing style" in AGENTS.md), one for each of the thin-line GLYPHS in
// ./icons and meaning the same thing. Plain data in a 48 × 48 box, drawn
// by the shared emblem renderer. People are meeple silhouettes told
// apart by what they carry, never by a face. Look them over with
// `node scripts/emblem-sheet.mjs src/games/shelter/emblems.ts out.png`.

import type { IconName } from "./icons";
import {
  disc,
  ring,
  type EmblemData,
  type EmblemPart,
} from "@/components/engraved/emblem";
import {
  LEAF,
  fmt,
  type Material,
  type Pt,
} from "@/components/engraved/shapes";

/** The house meeple, centred on (24, 24): 32 wide, 36 tall. */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";

/** A meeple standing at (x, y), `scale` of its full size. */
const meeple = (
  x: number,
  y: number,
  scale: number,
  m: Material | "tint",
): EmblemPart => ({
  d: MEEPLE,
  m,
  ink: 1.5 / scale,
  shine: "M20.5 10.5A4 4 0 0 1 23 8.4M11 22.6Q14 20.6 18 20",
  t: `translate(${x} ${y}) scale(${scale}) translate(-24 -24)`,
});

/** A fire's outline, standing on (24, 45): 30 wide, 38.5 tall. */
const FLAME =
  "M24 45C14.5 45 9 38.5 9 31C9 22 16 17 18 6.5C21 12 24 14 26 15C26 12 27 9.5 28.5 7C35 13 39 21 39 30.5C39 38.5 33.5 45 24 45Z";

/** A circle sampled as points, for walking round arcs. */
const arc = (
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  n = 24,
): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/** A disc with a bite taken out of it by a second disc that overlaps
 *  its edge: the moon's crescent, a biohazard lobe. */
function crescent(co: Pt, R: number, ci: Pt, r: number) {
  const phi = Math.atan2(ci[1] - co[1], ci[0] - co[0]);
  const e = Math.hypot(ci[0] - co[0], ci[1] - co[1]);
  const a0 = Math.acos((R * R + e * e - r * r) / (2 * R * e));
  const g0 = Math.acos((r * r + e * e - R * R) / (2 * r * e));
  const outer = arc(co[0], co[1], R, phi + a0, phi + 2 * Math.PI - a0, 40);
  const inner = arc(
    ci[0],
    ci[1],
    r,
    phi + Math.PI + g0,
    phi + Math.PI - g0,
    24,
  );
  return `M${[...outer, ...inner].map(fmt).join("L")}Z`;
}

/** A Z for the sleepy: `s` wide, top left at (x, y). */
const zed = (x: number, y: number, s: number) => {
  const p = (u: number, v: number) =>
    `${(x + u * s).toFixed(2)} ${(y + v * s).toFixed(2)}`;
  return `M${p(0, 0)}L${p(1, 0)}L${p(1, 0.24)}L${p(0.4, 0.76)}L${p(1, 0.76)}L${p(1, 1)}L${p(0, 1)}L${p(0, 0.76)}L${p(0.6, 0.24)}L${p(0, 0.24)}Z`;
};

/** The market's awning: five scalloped stripes, red and white. */
const awning = (): EmblemData =>
  Array.from({ length: 5 }, (_, i) => {
    const b0 = 4 + 8 * i;
    const b1 = b0 + 8;
    const t0 = 8 + 6.4 * i;
    const t1 = t0 + 6.4;
    return {
      d: `M${t0} 7L${t1} 7L${b1} 20A4 4 0 0 1 ${b0} 20Z`,
      m: i % 2 ? "ivory" : "crimson",
      ink: 1.2,
    } satisfies EmblemPart;
  });

/** The eye that sees: gold lids, a sapphire iris. */
const EYE_OUTER =
  "M2 24C8.5 13 16 8 24 8C32 8 39.5 13 46 24C39.5 35 32 40 24 40C16 40 8.5 35 2 24Z";
const EYE_INNER =
  "M7.5 24C12.5 16.5 18 13 24 13C30 13 35.5 16.5 40.5 24C35.5 31.5 30 35 24 35C18 35 12.5 31.5 7.5 24Z";

/** A bone, lying along the x axis through (24, 24). */
const BONE =
  "M6 21.5A2.5 2.5 0 0 1 10 19.8L11.5 22H36.5L38 19.8A2.5 2.5 0 0 1 42 21.5V26.5A2.5 2.5 0 0 1 38 28.2L36.5 26H11.5L10 28.2A2.5 2.5 0 0 1 6 26.5Z";

/** The sun's rays: a star of `n` points round (24, 24). */
const rays = (n: number, outer: number, inner: number) =>
  `M${Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    return fmt([24 + Math.cos(a) * r, 24 + Math.sin(a) * r]);
  }).join("L")}Z`;

/** A germ: a disc with a wavy rim. */
const germ = (
  cx: number,
  cy: number,
  r: number,
  bumps: number,
  depth: number,
) =>
  `M${Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const k = r + depth * Math.sin(a * bumps);
    return fmt([cx + Math.cos(a) * k, cy + Math.sin(a) * k]);
  }).join("L")}Z`;

export const EMBLEMS: Partial<Record<IconName, EmblemData>> = {
  // ── resources ──────────────────────────────────────────────────────
  /** A crusty loaf in its tin (the tin takes the food colour). */
  food: [
    {
      d: "M6 27C5 17 13 10 24 10C35 10 43 17 42 27Z",
      vein: "M14.5 15.5L17.5 21M22.5 13L25.5 19M30.5 15L33.5 21",
      shine: "M10 22C10 17.5 13.5 14.5 17.5 13.2",
    },
    {
      d: "M5 25H43L40.2 42Q39.8 43.8 38 43.8H10Q8.2 43.8 7.8 42Z",
      m: "tint",
      vein: "M6 29H42",
      shine: "M10.5 32.5L11.5 40",
    },
  ],
  /** A medicine bottle, a red cross on its label. */
  medicine: [
    {
      d: "M14 12.5H34Q38 12.5 38 17V40Q38 44 34 44H14Q10 44 10 40V17Q10 12.5 14 12.5Z",
      m: "ivory",
      shine: "M13.2 18V38",
    },
    {
      d: "M15 4H33Q34.5 4 34.5 5.5V13H13.5V5.5Q13.5 4 15 4Z",
      m: "silver",
      vein: "M18 6.5V10.5M22 6.5V10.5M26 6.5V10.5M30 6.5V10.5",
    },
    { d: "M21 19H27V25H33V31H27V37H21V31H15V25H21Z", m: "crimson", ink: 1.3 },
  ],
  /** A fire, its white-hot heart inside. */
  fire: [
    {
      d: FLAME,
      m: "flame",
      shine: "M13 31C13 26 15.5 22 18.2 17",
    },
    {
      d: "M24 42.5C19.5 42.5 17 39.5 17 36C17 31.5 20 29.5 21.5 25C23 27.8 24 28.4 25 28.4C25 26.4 25.8 24.4 27.2 22.6C29.6 26.4 31 31 31 35.5C31 39.5 28.5 42.5 24 42.5Z",
      ink: 1.2,
    },
  ],

  // ── places ─────────────────────────────────────────────────────────
  /** A red barn and two ears of wheat. */
  farm: [
    { d: "M2.5 42.5H45.5V46H2.5Z", m: "wood", ink: 1.2 },
    { d: "M32.4 43V25H33.8V43ZM40.4 43V29H41.8V43Z", ink: 1 },
    {
      d: LEAF(17, 5),
      vein: "M0 -2L0 -14M0 -5L-2.6 -8M0 -5L2.6 -8M0 -9.5L-2.2 -12M0 -9.5L2.2 -12",
      ink: 1.2,
      t: "translate(33 26) rotate(-6)",
    },
    {
      d: LEAF(14, 4.4),
      vein: "M0 -2L0 -11.5M0 -4.5L-2.2 -7M0 -4.5L2.2 -7M0 -8L-1.8 -10M0 -8L1.8 -10",
      ink: 1.2,
      t: "translate(41 30) rotate(10)",
    },
    {
      d: "M4 43V24L14 15L24 24V43Z",
      m: "crimson",
      shine: "M6.5 26V40",
    },
    {
      d: "M9 43V32H19V43Z",
      m: "ivory",
      vein: "M9 32L19 43M19 32L9 43",
      ink: 1.2,
    },
    {
      d: "M1.5 25L14 11.5L26.5 25L24 27.5L14 17L4 27.5Z",
      m: "iron",
      ink: 1.3,
    },
  ],
  /** A shopfront under a striped awning. */
  market: [
    { d: "M7 20H41V44H7Z", m: "wood", vein: "M7 32H41", shine: "M9.5 23V41" },
    { dark: "M19.5 44V30.5Q19.5 28 22 28H26Q28.5 28 28.5 30.5V44Z" },
    ...awning(),
    { d: "M6.5 3.5H41.5V7.5H6.5Z", shine: "M8.5 5.2H38", ink: 1.2 },
  ],
  /** A white hospital, a red cross over its door. */
  hospital: [
    { d: "M7 44V19L24 6.5L41 19V44Z", m: "ivory", shine: "M9.8 22V41" },
    {
      d: "M21.5 15.5H26.5V21H32V26H26.5V31.5H21.5V26H16V21H21.5Z",
      m: "crimson",
      ink: 1.3,
    },
    {
      d: "M19.5 44V36Q19.5 34.5 21 34.5H27Q28.5 34.5 28.5 36V44Z",
      m: "wood",
      vein: "M24 34.5V44",
      ink: 1.2,
    },
    {
      d: "M3 20.5L24 4.5L45 20.5L42.8 23.2L24 9L5.2 23.2Z",
      m: "silver",
      ink: 1.3,
    },
  ],

  // ── night posts ────────────────────────────────────────────────────
  /** The store: a braced wooden crate in an iron frame. */
  store: [
    { d: "M7 8H41V42H7Z", m: "wood", vein: "M7 19.5H41M7 30.5H41" },
    {
      d: "M10 37.5L35 11H38.5V13.5L13.5 40H10Z",
      m: "wood",
      shine: "M13 36L35.5 12.5",
      ink: 1.2,
    },
    {
      d: "M5 6H43V44H5ZM10 11V39H38V11Z",
      m: "iron",
      evenOdd: true,
      shine: "M7.5 9V40",
    },
    {
      dark: `${disc(7.5, 8.5, 1)}${disc(40.5, 8.5, 1)}${disc(7.5, 41.5, 1)}${disc(40.5, 41.5, 1)}`,
    },
  ],
  /** The door, boarded up. */
  door: [
    { d: "M12 44V8H36V44Z", m: "wood", vein: "M18 8V44M24 8V44M30 8V44" },
    {
      d: "M8 44V7Q8 4 11 4H37Q40 4 40 7V44H36V8H12V44Z",
      m: "silver",
      shine: "M10 40V8",
    },
    {
      d: "M4 21H44V27.5H4Z",
      m: "ivory",
      vein: "M6 24.2H42",
      ink: 1.3,
      t: "rotate(-38 24 25)",
    },
    {
      d: "M4 21H44V27.5H4Z",
      m: "ivory",
      vein: "M6 24.2H42",
      ink: 1.3,
      t: "rotate(38 24 25)",
    },
    { d: "M4.5 42H43.5V45.8H4.5Z", m: "iron", ink: 1.2 },
  ],
  /** A bed: pillow, blanket, head- and footboard. */
  sleep: [
    {
      d: "M3.5 44V13Q3.5 10 6.75 10Q10 10 10 13V44Z",
      m: "wood",
      shine: "M5.5 14V40",
    },
    { d: "M9 26H40V34H9Z", m: "ivory" },
    {
      d: "M10.5 26V21Q10.5 18.5 13 18.5H19.5Q22 18.5 22 21V26Z",
      m: "ivory",
      ink: 1.2,
    },
    {
      d: "M19 34V24Q19 22 21 22H40V34Z",
      m: "night",
      vein: "M19.5 27H40",
      shine: "M22 24.5H37",
    },
    { d: "M38 44V25Q38 22.5 40.5 22.5H42Q44.5 22.5 44.5 25V44Z", m: "wood" },
    { d: "M6 33H41V38.5H6Z", m: "wood", ink: 1.3 },
  ],

  // ── the Infected's acts ────────────────────────────────────────────
  /** A hand reaching to take. */
  steal: [
    {
      d: "M11.5 22H36V32.5C36 39.5 31 44 24 44C18.5 44 15.5 42 13 38L6 28.5C5 26.8 6 25 8 24.8C9.4 24.7 10.6 25.5 11.4 26.6L11.5 27Z",
      m: "ivory",
      shine: "M15 37.5Q18 41.5 23 41.8",
    },
    { d: "M11.5 27V12.5A3 3 0 0 1 17.5 12.5V27Z", m: "ivory", ink: 1.3 },
    { d: "M17.5 27V8.5A3 3 0 0 1 23.5 8.5V27Z", m: "ivory", ink: 1.3 },
    { d: "M23.5 27V9.5A3 3 0 0 1 29.5 9.5V27Z", m: "ivory", ink: 1.3 },
    { d: "M29.5 28V14.5A3 3 0 0 1 35.5 14.5V28Z", m: "ivory", ink: 1.3 },
  ],
  /** A door left open on the dark. */
  open: [
    { dark: "M13 44V9H27V44Z" },
    { d: "M9 44V5H31V44H27V9H13V44Z", shine: "M11 40V7.5" },
    { d: "M5 42.5H32V46H5Z", m: "iron", ink: 1.2 },
    { d: "M27 9L40.5 4V46.5L27 44Z", m: "wood", vein: "M33.7 7V45" },
    { d: disc(37.5, 26, 1.6), ink: 1 },
  ],
  /** Sabotage: a skull over crossed bones. */
  sabotage: [
    { d: BONE, m: "ivory", ink: 1.3, t: "rotate(35 24 31)" },
    { d: BONE, m: "ivory", ink: 1.3, t: "rotate(-35 24 31)" },
    {
      d: "M24 4C33 4 39 10 39 18.5C39 23.5 36.5 26.5 34 28V33Q34 35 32 35H16Q14 35 14 33V28C11.5 26.5 9 23.5 9 18.5C9 10 15 4 24 4Z",
      m: "tint",
      vein: "M20 30V35M24 30V35M28 30V35",
      shine: "M12.5 15A12 12 0 0 1 19 7.5",
    },
    { dark: `${disc(18.5, 19, 4)}${disc(29.5, 19, 4)}M24 23.5L26 27.5H22Z` },
  ],
  /** Stealth: an eye struck through — not seen. */
  stealth: [
    { d: EYE_OUTER, m: "silver" },
    { d: EYE_INNER, m: "ivory", ink: 1.2 },
    { jewel: "sapphire", x: 24, y: 24, r: 8 },
    { d: "M2 21.8H46V26.8H2Z", m: "crimson", ink: 1.3, t: "rotate(40 24 24)" },
  ],

  // ── people and states ──────────────────────────────────────────────
  /** A survivor, and the flame of hope beside them. */
  survivor: [
    meeple(21, 26, 0.85, "gold"),
    {
      d: FLAME,
      m: "flame",
      ink: 1.2 / 0.46,
      t: "translate(38 21) scale(0.46) translate(-24 -45)",
    },
  ],
  /** Infected: the biohazard sign. */
  infected: [
    ...[-90, 30, 150].map((deg): EmblemPart => {
      const a = (deg * Math.PI) / 180;
      const c: Pt = [24 + Math.cos(a) * 9.5, 25.5 + Math.sin(a) * 9.5];
      const h: Pt = [24 + Math.cos(a) * 14.8, 25.5 + Math.sin(a) * 14.8];
      return { d: crescent(c, 12, h, 8.5), m: "tint", ink: 1.3 };
    }),
    { d: ring(24, 25.5, 7.6, 4.5), m: "tint", evenOdd: true, ink: 1.2 },
  ],
  /** A cough: someone sending droplets flying. */
  cough: [
    meeple(18.5, 27, 0.82, "ivory"),
    {
      d: `${disc(34, 13.5, 2.5)}${disc(40.5, 18.5, 3)}${disc(34.5, 23, 2.1)}${disc(42.5, 10, 1.6)}${disc(43.5, 26.5, 1.7)}`,
      m: "leaf",
      ink: 1,
    },
  ],
  /** Injured: a sticking plaster, blood on its pad. */
  injured: [
    {
      d: "M9 17H39A7 7 0 0 1 39 31H9A7 7 0 0 1 9 17Z",
      m: "ivory",
      shine: "M7 21.5Q8 19.5 10.5 19.2",
      t: "rotate(-45 24 24)",
    },
    { d: "M17 18.5H31V29.5H17Z", m: "tint", ink: 1.2, t: "rotate(-45 24 24)" },
    {
      dark: `${disc(8.5, 21.5, 0.9)}${disc(8.5, 26.5, 0.9)}${disc(12, 24, 0.9)}${disc(36, 24, 0.9)}${disc(39.5, 21.5, 0.9)}${disc(39.5, 26.5, 0.9)}`,
      t: "rotate(-45 24 24)",
    },
  ],
  /** Hungry: someone holding out an empty bowl. */
  hungry: [
    meeple(24, 20, 0.74, "silver"),
    {
      d: "M9 30H39Q39 44 24 44Q9 44 9 30Z",
      m: "wood",
      shine: "M12.5 33.5Q14 39 19 41",
    },
    { dark: "M10.5 30A13.5 2.6 0 0 0 37.5 30A13.5 2.6 0 0 0 10.5 30Z" },
  ],
  /** Fallen: a gravestone on its mound. */
  fallen: [
    {
      d: "M11 42V18A13 13 0 0 1 37 18V42Z",
      m: "silver",
      vein: "M14.5 40V18.5A9.5 9.5 0 0 1 33.5 18.5V40",
      shine: "M13.6 17A10.5 10.5 0 0 1 18.5 9.2",
    },
    { dark: "M22.5 14H25.5V19H30V22H25.5V33H22.5V22H18V19H22.5Z" },
    {
      d: "M2.5 46C4.5 40.5 12 38 24 38C36 38 43.5 40.5 45.5 46Z",
      m: "leaf",
      shine: "M9 41.5Q15 39.6 21 39.4",
    },
  ],
  /** Tired: Z, z, z. */
  tired: [
    { d: zed(4, 22, 21), m: "ivory", shine: "M6.5 24.6H22" },
    { d: zed(26, 13, 12.5), m: "silver", ink: 1.3 },
    { d: zed(37.5, 4.5, 8), m: "silver", ink: 1.1 },
  ],
  /** Saw: an open eye. */
  saw: [
    { d: EYE_OUTER, shine: "M8 20.5Q14 12.5 22 10.4" },
    { d: EYE_INNER, m: "ivory", ink: 1.2 },
    { jewel: "sapphire", x: 24, y: 24, r: 8.5 },
    { dark: disc(24, 24, 3) },
  ],

  // ── the morning ────────────────────────────────────────────────────
  /** Vote: a ballot going into the box. */
  vote: [
    {
      d: "M6.5 24H41.5V44H6.5Z",
      m: "wood",
      vein: "M6.5 34H41.5",
      shine: "M9 27V41",
    },
    { d: "M15 23V4.5H33V23Z", m: "ivory", ink: 1.3 },
    {
      d: "M18.3 12.8L21 10.2L23.6 12.8L29.5 6.8L32 9.4L23.6 17.8Z",
      m: "leaf",
      ink: 1.1,
    },
    { d: "M4 20.5H44V26H4Z", shine: "M6 22.4H41", ink: 1.3 },
    { dark: "M14 22.4H34V24.4H14Z" },
  ],
  /** Exile: out through the door. */
  exile: [
    {
      d: "M22 5H8.5Q6 5 6 7.5V40.5Q6 43 8.5 43H22V38H11V10H22Z",
      m: "silver",
      shine: "M8.5 9V39",
    },
    {
      d: "M15 20.5H30.5V12.5L44 24L30.5 35.5V27.5H15Z",
      m: "crimson",
      shine: "M17 22.5H31",
    },
  ],
  /** Rescue: the relief truck. */
  rescue: [
    { d: "M2 9H29V35H2Z", m: "ivory", shine: "M4.5 12V32" },
    {
      d: "M13 13.5H18V19.5H24V24.5H18V30.5H13V24.5H7V19.5H13Z",
      m: "crimson",
      ink: 1.2,
    },
    { d: "M29 16H37.5L45 25.5V35H29Z" },
    { d: "M32 19H36.5L41 25H32Z", m: "silver", ink: 1.1 },
    { d: "M2 34H46V38.5H2Z", m: "iron", ink: 1.2 },
    { d: disc(11, 39.5, 5), m: "iron" },
    { d: disc(37, 39.5, 5), m: "iron" },
    { d: `${disc(11, 39.5, 1.8)}${disc(37, 39.5, 1.8)}`, m: "silver", ink: 1 },
  ],
  /** Day: the sun. */
  day: [
    { d: rays(12, 22.5, 13), m: "flame", ink: 1.2 },
    { d: disc(24, 24, 11.5), shine: "M16 20A8.5 8.5 0 0 1 20.5 15.6" },
  ],
  /** Night: the moon and a star. */
  night: [
    {
      d: crescent([21, 25], 18, [30.5, 17.5], 15),
      m: "silver",
      shine: "M7.5 28A14 14 0 0 0 16 39.5",
    },
    {
      d: "M37 26L38.6 30.4L43 32L38.6 33.6L37 38L35.4 33.6L31 32L35.4 30.4Z",
      ink: 1,
    },
  ],
  /** Wait: an hourglass. */
  wait: [
    {
      d: "M12.5 9H35.5C35.5 18 27 20.5 27 24C27 27.5 35.5 30 35.5 39H12.5C12.5 30 21 27.5 21 24C21 20.5 12.5 18 12.5 9Z",
      m: "silver",
      shine: "M15.5 11.5Q16.5 16.5 21 19.5",
    },
    {
      d: "M16 14H32C30.5 18.5 25.5 20.5 24 23C22.5 20.5 17.5 18.5 16 14Z",
      ink: 1,
    },
    {
      d: "M15 38.5C16.5 33.5 21.5 31.5 24 31C26.5 31.5 31.5 33.5 33 38.5Z",
      ink: 1,
    },
    { d: "M23.4 22.5H24.6V31.5H23.4Z", ink: 0 },
    { d: "M7.5 4H40.5V9.5H7.5Z", m: "wood", ink: 1.3, shine: "M9.5 5.8H38" },
    { d: "M7.5 38.5H40.5V44H7.5Z", m: "wood", ink: 1.3 },
  ],
  /** A zombie, shambling with its arms out, rot on it. */
  zombie: [
    {
      d: "M14 14.2L35 13.4Q39.5 13.3 39.5 16.8Q39.5 20.2 35 20.2L14 20.5Z",
      m: "tint",
      ink: 1.3,
    },
    {
      d: "M9.5 20Q9.5 16.5 13 16.5H21L38 17.2Q43.5 17.5 43.5 21.6Q43.5 25.6 38 25.6L26.5 25.2L27.5 30.5L33.5 40.5Q35 44 31.5 44H28Q26.3 44 25.5 42.5L20.5 35L17.5 42.5Q16.8 44 15 44H11.5Q8.4 44 9.4 40.5L12.8 30.5L10.4 25.5Q9.5 23 9.5 20Z",
      m: "tint",
      shine: "M12.2 21Q12 25 14 29",
    },
    { d: disc(16.5, 10, 6.5), m: "tint", shine: "M12 8.5A5 5 0 0 1 15 5.2" },
    {
      d: `${disc(19, 28, 2.2)}${disc(31, 21.4, 1.7)}${disc(13.8, 12, 1.6)}`,
      m: "leaf",
      ink: 0.9,
    },
  ],
  /** Mould: a germ, spotted. */
  mold: [
    {
      d: germ(24, 24, 17, 9, 2.2),
      m: "tint",
      shine: "M11.5 19A13 13 0 0 1 18 11.5",
    },
    {
      d: `${disc(18.5, 19, 3.6)}${disc(29, 21, 2.6)}${disc(22, 30.5, 3)}${disc(31, 30, 2)}`,
      m: "leaf",
      ink: 1,
    },
  ],
  /** Empty: nothing there. */
  empty: [
    {
      d: ring(24, 24, 19.5, 14.5),
      m: "silver",
      evenOdd: true,
      shine: "M8 18A16.5 16.5 0 0 1 16 8.8",
    },
    {
      d: "M2.5 21.6H45.5V26.4H2.5Z",
      m: "crimson",
      ink: 1.3,
      t: "rotate(-45 24 24)",
    },
  ],
};

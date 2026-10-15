// The Boardly mascot: the meeple from the logo, come to life. A chubby
// game piece with the thickness of a real wooden meeple, glossy like the
// splash; its colour is who you are, and a face says how it feels.
// Drawn in a 100 × 110 box as emblem data (SVG anywhere, a Skia picture
// on a canvas).
//
// Draft: one body, four faces to choose between, the player colours.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import { shade } from "@/components/engraved/shapes";

export const MASCOT_BOX: [number, number] = [100, 110];

type Hex = `#${string}`;
export type MascotFace = "dots" | "googly" | "visor" | "happy";

const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}Z`;

/** The piece: a big round head, arms out, two short stout legs. */
const BODY =
  "M50 8C62 8 70.4 16.6 70.4 27.4C70.4 32.6 68.6 36.8 65.8 40C75.2 41.4 85.6 44.8 87.6 51.2C89.4 57.8 82 61 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2L81.4 88.4C83.4 94 80.4 98.4 74.4 98.4H60.6C57.6 98.4 55.4 96.8 54.4 94.2L50 83.2L45.6 94.2C44.6 96.8 42.4 98.4 39.4 98.4H25.6C19.6 98.4 16.6 94 18.6 88.4L27.8 64.2C28.2 63.2 27.8 62.2 26.6 62C18 61 10.6 57.8 12.4 51.2C14.4 44.8 24.8 41.4 34.2 40C31.4 36.8 29.6 32.6 29.6 27.4C29.6 16.6 38 8 50 8Z";

const FACES: Record<MascotFace, (color: string) => EmblemPart[]> = {
  // two dot eyes with a glint, rosy cheeks, a small smile
  dots: () => [
    { dark: `${ell(43.4, 28, 2.8, 3.6)}${ell(56.6, 28, 2.8, 3.6)}` },
    { d: `${ell(42.4, 26.6, 1.1, 1.1)}${ell(55.6, 26.6, 1.1, 1.1)}`, m: "ivory", ink: 0 },
    { d: `${ell(37.6, 33.4, 3.2, 1.8)}${ell(62.4, 33.4, 3.2, 1.8)}`, m: "#FF8A8A" as Hex, ink: 0, op: 0.55 },
    { dark: "M46.6 33.6C48.4 35.6 51.6 35.6 53.4 33.6C52.8 36.8 47.2 36.8 46.6 33.6Z" },
  ],
  // big round eyes looking up and aside: a little surprised, always game
  googly: () => [
    { d: `${ell(43.2, 27, 5.6, 6.4)}${ell(56.8, 27, 5.6, 6.4)}`, m: "ivory", ink: 1 },
    { dark: `${ell(44.6, 27.4, 2.8, 3.2)}${ell(58.2, 27.4, 2.8, 3.2)}` },
    { d: `${ell(43.8, 26.2, 0.9, 0.9)}${ell(57.4, 26.2, 0.9, 0.9)}`, m: "ivory", ink: 0 },
    { dark: "M47.8 35.4C49 36.4 51 36.4 52.2 35.4C51.8 37.4 48.2 37.4 47.8 35.4Z" },
  ],
  // a glossy visor across the face: the face of no one, so anyone
  visor: () => [
    {
      d: "M34.6 25.4C34.6 20.6 40.6 18.2 50.4 18.2C60.2 18.2 66 20.6 66 25.4V29.4C66 34.4 60 36.6 50.4 36.6C40.6 36.6 34.6 34.4 34.6 29.4Z",
      m: "#7FC8E8" as Hex,
      ink: 1.3,
      round: true,
      shine: "M39.6 23.2C42.6 21.6 47 21 51 21.2",
      sw: 1.8,
    },
  ],
  // eyes closed in a happy curve: pleased with the last move
  happy: () => [
    { dark: "M39.4 29.4C40.6 25.4 46 25.4 47.2 29.4L45.8 29.8C44.8 27.6 41.8 27.6 40.8 29.8Z" },
    { dark: "M52.8 29.4C54 25.4 59.4 25.4 60.6 29.4L59.2 29.8C58.2 27.6 55.2 27.6 54.2 29.8Z" },
    { d: `${ell(37.6, 33.4, 3.2, 1.8)}${ell(62.4, 33.4, 3.2, 1.8)}`, m: "#FF8A8A" as Hex, ink: 0, op: 0.55 },
    { dark: "M46 33C48 36.6 52 36.6 54 33C53.4 38 46.6 38 46 33Z" },
  ],
};

export function drawMascot({ color, face }: { color: string; face: MascotFace }): EmblemData {
  const c = color as Hex;
  return [
    // the floor under it
    { d: ell(50, 100, 31, 4.2), m: "#000000" as Hex, ink: 0, op: 0.22 },
    // the piece's thickness, like a wooden meeple's edge
    { d: BODY, m: shade(color, -0.42) as Hex, ink: 1.4, t: "translate(1.8 2.6)" },
    // the piece itself, lit like something round
    { d: BODY, m: c, ink: 1.4, round: true },
    // shade on the far side and the belly, light on the near shoulder
    {
      d: "M66 40C75.2 41.4 85.6 44.8 87.6 51.2C89.4 57.8 82 61 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2L81.4 88.4C83.4 94 80.4 98.4 74.4 98.4H66C71 97 73.6 93.6 71.8 88.4L63 63C68 58 69 48 66 40Z",
      m: shade(color, -0.45) as Hex,
      ink: 0,
      op: 0.22,
    },
    // the gloss: a soft spot on the head, a streak down the arm
    { d: ell(41, 17.6, 6.4, 3.2), m: "ivory", ink: 0, op: 0.6, t: "rotate(-32 41 17.6)" },
    { d: "M17.2 50C19.4 46.6 25 44.6 30.8 43.4C25.6 45.4 21.4 47.6 19.4 51.4Z", m: "ivory", ink: 0, op: 0.5 },
    ...FACES[face](color),
  ];
}

// ── the cookie: a gingerbread meeple ───────────────────────────────────

/** Flecks of spice in the dough, and specks of sugar: [x, y, size].
 *  Scattered inside the body, clear of the face. */
const SPICE: [number, number, number][] = [
  [61.5, 15.4, 0.66], [39.8, 14.2, 0.65], [44.3, 82.6, 0.5], [34, 21.8, 0.5], [35.4, 81.6, 0.52],
  [56.2, 65.9, 0.6], [53.6, 14.6, 0.47], [27.7, 69.6, 0.62], [35.9, 61.1, 0.63], [65.1, 30.7, 0.68],
  [51.9, 86.9, 0.74], [33.9, 96.2, 0.5], [43.8, 76.4, 0.51], [49.2, 12.5, 0.72], [70.1, 60, 0.8],
  [35.8, 70.9, 0.69], [56.1, 49.6, 0.79], [83.8, 51.2, 0.72], [41.3, 68.5, 0.46], [30.8, 43.8, 0.8],
  [18.1, 49, 0.67], [43.6, 40.9, 0.8], [29.7, 52.2, 0.69], [64.5, 54.9, 0.7], [41.8, 44.5, 0.49],
  [38.4, 41.4, 0.5], [47.4, 52.1, 0.48], [23.1, 57.3, 0.46], [24.7, 77.7, 0.66], [29, 81.2, 0.84],
  [76.8, 80.7, 0.78], [51.3, 40.6, 0.46], [31.7, 70.6, 0.83], [48.4, 67.1, 0.77], [69, 51.5, 0.52],
  [72.9, 95.5, 0.61], [42.5, 93.3, 0.74], [23.5, 89.5, 0.77], [23.1, 82.6, 0.84], [62, 40.2, 0.67],
  [45, 86.6, 0.78], [34.3, 30.4, 0.68], [38.9, 49.8, 0.68], [52.4, 55.6, 0.46], [25.1, 51.1, 0.74],
  [33, 77.7, 0.65],
];
const SUGAR: [number, number, number][] = [
  [54.7, 76.6, 0.67], [45.7, 63.5, 0.55], [50.9, 70.7, 0.54], [52.5, 51.5, 0.68], [65.1, 87, 0.68],
  [31.7, 58.8, 0.68], [21.2, 48.3, 0.42], [62.9, 78.8, 0.67], [28.7, 93.8, 0.52], [44.8, 54.9, 0.5],
  [54.1, 48.2, 0.41], [37.2, 64.5, 0.55], [71.9, 95.5, 0.43], [44.3, 15.4, 0.68], [60.2, 80.3, 0.43],
  [77.6, 49.4, 0.5],
];
const dots = (at: [number, number, number][]) => at.map(([x, y, r]) => ell(x, y, r, r * 0.8)).join("");

/** Piped icing: zigzags at the wrists and ankles. */
const ICING_TRIM =
  "M21.4 45.2L24 47.6L21 50L24 52.4L21 54.8L24 57.2L21.6 59.4" +
  "M78.6 45.2L76 47.6L79 50L76 52.4L79 54.8L76 57.2L78.4 59.4" +
  "M21.4 90.6L24.6 88.4L27.8 90.6L31 88.4L34.2 90.6L37.4 88.4L40.6 90.6L43.4 88.8" +
  "M78.6 90.6L75.4 88.4L72.2 90.6L69 88.4L65.8 90.6L62.6 88.4L59.4 90.6L56.6 88.8";
/** The classic iced face: two dots and a smile. */
const ICING_EYES = `${ell(43.6, 27.6, 2.3, 2.6)}${ell(56.4, 27.6, 2.3, 2.6)}`;
const ICING_SMILE = "M44 33.2C47.4 37.2 52.6 37.2 56 33.2";
const ICING = "#FFF8EE";

/** Icing, raised: its shadow on the dough, then the icing. */
const piped = (line: string, dough: string, w: number): EmblemPart[] => [
  { line, color: shade(dough, -0.5), w, op: 0.35, t: "translate(0.5 0.9)" },
  { line, color: ICING, w },
];

export function drawCookie({
  dough,
  face = "icing",
}: {
  dough: string;
  face?: MascotFace | "icing";
}): EmblemData {
  const d = dough as Hex;
  return [
    { d: ell(50, 100, 31, 4.2), m: "#000000" as Hex, ink: 0, op: 0.22 },
    // the cookie's baked side
    { d: BODY, m: shade(dough, -0.4) as Hex, ink: 1.3, t: "translate(1.6 2.4)" },
    // baked darker at the rim...
    { d: BODY, m: shade(dough, -0.16) as Hex, ink: 1.3 },
    // ...and paler in the middle, where the dough rose
    {
      d: BODY,
      m: shade(dough, 0.1) as Hex,
      ink: 0,
      round: true,
      op: 0.9,
      t: "translate(50 54) scale(0.88) translate(-50 -54)",
    },
    // spice flecks and sugar specks
    { d: dots(SPICE), m: shade(dough, -0.55) as Hex, ink: 0, op: 0.55 },
    { d: dots(SUGAR), m: shade(dough, 0.5) as Hex, ink: 0, op: 0.7 },
    ...piped(ICING_TRIM, dough, 1.7),
    // gumdrop buttons
    { jewel: "ruby", x: 50, y: 50.4, r: 2.6 },
    { jewel: "emerald", x: 50, y: 60.4, r: 2.6 },
    ...(face === "icing"
      ? [
          { d: ICING_EYES, m: shade(dough, -0.5) as Hex, ink: 0, op: 0.35, t: "translate(0.5 0.8)" },
          { d: ICING_EYES, m: "#FFF8EE" as Hex, ink: 0 },
          ...piped(ICING_SMILE, dough, 1.8),
        ]
      : FACES[face](dough)),
  ];
}

/** Cookie flavours, one for each player at a table. */
export const FLAVOURS: Record<string, string> = {
  gingerbread: "#B8743A",
  chocolate: "#6A3E24",
  matcha: "#8AAA5A",
  strawberry: "#E8909E",
  "red velvet": "#B03A42",
  "butterfly pea": "#5A7AC8",
  lemon: "#E2BE52",
  taro: "#9A7ABA",
  vanilla: "#E6C694",
  orange: "#E28A3A",
  mint: "#72C2A2",
  "black sesame": "#4E4A4E",
};

export const COOKIES: Record<string, EmblemData> = Object.fromEntries(
  Object.entries(FLAVOURS).map(([name, dough]) => [name, drawCookie({ dough })]),
);

/** Player colours, like a table's pieces. */
export const COLOURS: Record<string, string> = {
  orange: "#F5922E",
  red: "#E0403A",
  blue: "#3A78D8",
  green: "#3AA65A",
  yellow: "#F2CA3A",
  pink: "#F27AB0",
  purple: "#8A5AD0",
  cyan: "#3AC4D0",
  white: "#EDEDED",
  black: "#3A3A44",
  brown: "#8A5A3A",
  lime: "#9ADA3A",
};

/** The gingerbread mascot with its iced face and the other faces, and
 *  the glossy piece it started as. */
export const EMBLEMS: Record<string, EmblemData> = {
  gingerbread: drawCookie({ dough: FLAVOURS.gingerbread }),
  "gingerbread (dots)": drawCookie({ dough: FLAVOURS.gingerbread, face: "dots" }),
  "gingerbread (happy)": drawCookie({ dough: FLAVOURS.gingerbread, face: "happy" }),
  "gingerbread (googly)": drawCookie({ dough: FLAVOURS.gingerbread, face: "googly" }),
  glossy: drawMascot({ color: COLOURS.orange, face: "dots" }),
};

/** Every colour with one face, as a table would look. */
export const LINEUP: Record<string, EmblemData> = Object.fromEntries(
  Object.entries(COLOURS).map(([name, color]) => [name, drawMascot({ color, face: "dots" })]),
);

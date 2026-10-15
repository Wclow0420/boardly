// The mascot's skin: the glossy game piece in any colour (free), or a
// set — a whole new body, like a gingerbread cookie — bought with coins.
// Faces and clothes go on top of either.

import type { EmblemPart } from "@/components/engraved/emblem";
import { shade } from "@/components/engraved/shapes";
import { BODY, ell, shadeOver, type Hex } from "./rig";

export interface SkinDef {
  name: string;
  price: number;
  /** The body (in body units), coloured `colour` where the skin takes a
   *  colour at all. */
  draw: (colour: string) => EmblemPart[];
}

/** The floor under the feet. */
const GROUND: EmblemPart = { d: ell(50, 100, 31, 4.2), m: "#000000", ink: 0, op: 0.22 };

/** The glossy piece: a wooden meeple's thickness, lit like something
 *  round, with a gloss on the head and arm. */
function glossy(colour: string): EmblemPart[] {
  return [
    GROUND,
    { d: BODY, m: shade(colour, -0.42) as Hex, ink: 1.4, t: "translate(1.8 2.6)" },
    { d: BODY, m: colour as Hex, ink: 1.4, round: true },
    shadeOver(
      "M66 40C75.2 41.4 85.6 44.8 87.6 51.2C89.4 57.8 82 61 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2L81.4 88.4C83.4 94 80.4 98.4 74.4 98.4H66C71 97 73.6 93.6 71.8 88.4L63 63C68 58 69 48 66 40Z",
      shade(colour, -0.45),
      0.22,
    ),
    { d: ell(41, 17.6, 6.4, 3.2), m: "ivory", ink: 0, op: 0.6, t: "rotate(-32 41 17.6)" },
    shadeOver("M17.2 50C19.4 46.6 25 44.6 30.8 43.4C25.6 45.4 21.4 47.6 19.4 51.4Z", "#FFFFFF", 0.5),
  ];
}

// ── the gingerbread set ──────────────────────────────────────────────

/** Flecks of spice in the dough, and specks of sugar: [x, y, size]. */
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
const dots = (at: [number, number, number][]) =>
  at.map(([x, y, r]) => ell(x, y, r, r * 0.8)).join("");

/** Piped icing: zigzags at the wrists and ankles. */
const ICING_TRIM =
  "M21.4 45.2L24 47.6L21 50L24 52.4L21 54.8L24 57.2L21.6 59.4" +
  "M78.6 45.2L76 47.6L79 50L76 52.4L79 54.8L76 57.2L78.4 59.4" +
  "M21.4 90.6L24.6 88.4L27.8 90.6L31 88.4L34.2 90.6L37.4 88.4L40.6 90.6L43.4 88.8" +
  "M78.6 90.6L75.4 88.4L72.2 90.6L69 88.4L65.8 90.6L62.6 88.4L59.4 90.6L56.6 88.8";
const ICING = "#FFF8EE";

function gingerbread(): EmblemPart[] {
  const dough = "#B8743A";
  return [
    GROUND,
    { d: BODY, m: shade(dough, -0.4) as Hex, ink: 1.3, t: "translate(1.6 2.4)" },
    { d: BODY, m: shade(dough, -0.16) as Hex, ink: 1.3 },
    {
      d: BODY,
      m: shade(dough, 0.1) as Hex,
      ink: 0,
      round: true,
      op: 0.9,
      t: "translate(50 54) scale(0.88) translate(-50 -54)",
    },
    shadeOver(dots(SPICE), shade(dough, -0.55), 0.55),
    shadeOver(dots(SUGAR), shade(dough, 0.5), 0.7),
    { line: ICING_TRIM, color: shade(dough, -0.5), w: 1.7, op: 0.35, t: "translate(0.5 0.9)" },
    { line: ICING_TRIM, color: ICING, w: 1.7 },
    { jewel: "ruby", x: 50, y: 50.4, r: 2.6 },
    { jewel: "emerald", x: 50, y: 60.4, r: 2.6 },
  ];
}

export const SKINS: Record<string, SkinDef> = {
  glossy: { name: "Game piece", price: 0, draw: glossy },
  gingerbread: { name: "Gingerbread", price: 3000, draw: gingerbread },
};

/** The free colours of the glossy piece. */
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

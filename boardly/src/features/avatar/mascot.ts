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

/** The four faces in Boardly orange, for choosing. */
export const EMBLEMS: Record<string, EmblemData> = Object.fromEntries(
  (["dots", "googly", "visor", "happy"] as MascotFace[]).map((face) => [
    face,
    drawMascot({ color: COLOURS.orange, face }),
  ]),
);

/** Every colour with one face, as a table would look. */
export const LINEUP: Record<string, EmblemData> = Object.fromEntries(
  Object.entries(COLOURS).map(([name, color]) => [name, drawMascot({ color, face: "dots" })]),
);

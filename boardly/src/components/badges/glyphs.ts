// Emblems shared by badges of games without an icon set of their own,
// and by Boardly's own badges. 24-unit grid, the same line weight as the
// games' icons.

import { MEEPLE_PATH } from "@/components/tabletop/Meeple";
import type { Glyph } from "./types";

/** A circle as path data. */
const o = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

export const BADGE_GLYPHS = {
  meeple: { fill: MEEPLE_PATH },
  die: {
    line: "M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z",
    fill: `${o(8.5, 8.5, 1.4)}${o(12, 12, 1.4)}${o(15.5, 15.5, 1.4)}`,
  },
  trophy: {
    line: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M10 17h4v3h-4zM8 20h8",
  },
  crown: {
    line: "M4 17.5L3 8l5 4 4-7 4 7 5-4-1 9.5zM4 20.5h16",
    fill: `${o(12, 13, 1.3)}`,
  },
  flame: {
    line: "M12 21a6 6 0 0 1-6-6c0-4 3-6 4-10 1 2 2 3 3 3 0-1 .5-2 1-3 2 2 4 5 4 10a6 6 0 0 1-6 6z",
    fill: "M12 14c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z",
  },
  people: {
    line: `${o(9, 8, 3)}M3 20a6 6 0 0 1 12 0${o(17, 9, 2.5)}M15.5 14.2A5 5 0 0 1 21 19`,
  },
  star: {
    fill: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z",
  },
  // a wreath: two branches of leaves, a small star between them
  laurel: {
    line: "M9 20.5C5 18.5 3.5 14 4.5 8.5M15 20.5c4-2 5.5-6.5 4.5-12M9.5 20.5h5",
    fill: `${o(4.1, 10, 1.3)}${o(4.5, 13.6, 1.3)}${o(6, 16.8, 1.3)}${o(8.3, 19.2, 1.2)}${o(19.9, 10, 1.3)}${o(19.5, 13.6, 1.3)}${o(18, 16.8, 1.3)}${o(15.7, 19.2, 1.2)}M12 6l1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.3z`,
  },
  mask: {
    line: "M3 9c3-2 6-2 9 0 3-2 6-2 9 0 0 5-3 8-5 8-2 0-3-2-4-2s-2 2-4 2c-2 0-5-3-5-8z",
    fill: `${o(8, 11, 1.6)}${o(16, 11, 1.6)}`,
  },
  target: {
    line: `${o(12, 12, 8)}${o(12, 12, 4)}M12 2v4M12 18v4M2 12h4M18 12h4`,
    fill: o(12, 12, 1.4),
  },
  sunrise: {
    line: "M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 6v3M5.6 9.6l2 2M18.4 9.6l-2 2M2.5 14h2.5M19 14h2.5M8 21h8",
  },
  coins: {
    line: "M5 7a7 2.5 0 1 0 14 0a7 2.5 0 1 0-14 0zM5 7v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7M5 11v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4",
  },
  cards: {
    line: "M3.5 7.5l8-3 3.2 9-8 3zM12.5 5l6-1.2 2 10-7.3 1.6",
    fill: o(8.8, 10.5, 1.3),
  },
  cup: {
    line: "M6 4h12l-2 16H8zM5 4h14M9 9h6",
    fill: `${o(10.5, 13.5, 1)}${o(13.5, 15.5, 1)}`,
  },
  xo: { line: `M3.5 3.5l6 6M9.5 3.5l-6 6${o(17, 17, 3.3)}M12 2v20M2 12h20` },
} satisfies Record<string, Glyph>;

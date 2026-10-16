// Seal the Manor's dining: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  GOLD,
  INK,
  LEAF,
  WOOD,
  ball,
  box,
  candle,
  cylinder,
  flat,
  line,
  type Shape,
} from "@/components/iso/kit";
import {
  WAX,
  chair,
  disc,
  picture,
  planks,
  prop,
  sconce,
  shell,
  solid,
  table,
} from "@/components/iso/room";

export function dining(accent: string): Shape[] {
  const y = 0.28;
  const goblet = (x: number): Shape[] => [
    ...cylinder(x, y + 0.13, 0.24, 0.014, 0.004, GOLD),
    ...box(x - 0.004, y + 0.126, 0.244, 0.008, 0.008, 0.03, GOLD),
    ...cylinder(x, y + 0.13, 0.274, 0.02, 0.032, GOLD),
    disc(x, y + 0.13, 0.305, 0.014, INK.red),
  ];
  return [
    ...shell(),
    ...planks(),
    ...picture("x", 0.08, 0.28, 0.4, 0.66, "#3A4A7A"),
    ball([0, 0.18, 0.55], 1.8, INK.paper, "#B3AB95"),
    ...picture("x", 0.72, 0.92, 0.4, 0.66, LEAF[2]),
    ...picture("y", 0.72, 0.92, 0.4, 0.66, INK.redDark),
    ball([0.82, 0, 0.55], 1.8, INK.paper, "#B3AB95"),
    ...sconce("y", 0.2, 0.44, accent),
    flat(0.1, 0.9, 0.12, 0.64, 0, INK.redDark, INK.red),
    flat(0.13, 0.87, 0.15, 0.61, 0, INK.redDark, GOLD[2]),
    // chairs along the far side, and the long table, laid
    ...[0.26, 0.45, 0.64].flatMap((x) => chair(x, y - 0.12, "y0")),
    ...table(0.16, y, 0.68, 0.26, 0.24),
    flat(0.2, 0.8, y + 0.09, y + 0.17, 0.242, INK.redDark, INK.red),
    ...cylinder(0.3, y + 0.05, 0.24, 0.04, 0.006, WAX),
    ...cylinder(0.7, y + 0.05, 0.24, 0.04, 0.006, WAX),
    ...candle(0.38, y + 0.13, 0.24, 0.09, accent),
    // two goblets, for the toast
    ...prop(() => [...goblet(0.47), ...goblet(0.54)]),
    ...cylinder(0.63, y + 0.13, 0.24, 0.022, 0.08, LEAF),
    ...cylinder(0.63, y + 0.13, 0.32, 0.008, 0.035, LEAF),
    ...cylinder(0.3, y + 0.21, 0.24, 0.04, 0.006, WAX),
    ...cylinder(0.7, y + 0.21, 0.24, 0.04, 0.006, WAX),
    ...chair(0.86, y + 0.08, "x1"),
    // sideboard with a tureen
    ...solid(0.04, 0.72, 0.14, 0.24, 0.2, WOOD),
    line([[0.18, 0.84, 0], [0.18, 0.84, 0.2]], WOOD[2]),
    ball([0.18, 0.81, 0.11], 0.6, GOLD[0]),
    ball([0.18, 0.87, 0.11], 0.6, GOLD[0]),
    ...cylinder(0.11, 0.84, 0.2, 0.045, 0.04, WAX),
    ball([0.11, 0.84, 0.26], 0.8, GOLD[0]),
  ];
}

// Seal the Manor's chapel: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  GOLD,
  INK,
  STONE,
  WOOD,
  ball,
  box,
  candle,
  cylinder,
  flat,
  line,
  onY,
  type Shape,
} from "@/components/iso/kit";
import {
  disc,
  drum,
  flags,
  prop,
  sconce,
  shell,
  solid,
  windowOn,
} from "@/components/iso/room";

export function chapel(accent: string): Shape[] {
  const pew = (x: number, y: number): Shape[] => [
    ...solid(x, y, 0.32, 0.08, 0.09, WOOD),
    ...box(x, y + 0.08, 0, 0.32, 0.025, 0.18, WOOD),
  ];
  return [
    ...shell(),
    ...flags(4),
    // stained glass: the light comes in coloured
    ...windowOn("y", 0.1, 0.26, 0.3, 0.44, true, INK.glass, "#E7A3C8"),
    ...windowOn("y", 0.74, 0.9, 0.3, 0.44, true, INK.glass, "#F2C46B"),
    // rose window over the altar
    ball([0.5, 0, 0.66], 4.4, STONE[1], INK.line),
    ball([0.5, 0, 0.66], 3.6, INK.glass, GOLD[2]),
    line([[0.41, 0, 0.66], [0.59, 0, 0.66]], GOLD[2], 0.6),
    line([[0.5, 0, 0.57], [0.5, 0, 0.75]], GOLD[2], 0.6),
    ...sconce("x", 0.2, 0.4, accent),
    ...sconce("x", 0.8, 0.4, accent),
    // the aisle, and the altar on its dais
    flat(0.43, 0.57, 0.3, 0.99, 0, INK.redDark, INK.red),
    ...box(0.24, 0, 0, 0.52, 0.3, 0.02, STONE),
    ...box(0.32, 0.05, 0.02, 0.36, 0.17, 0.26, STONE),
    flat(0.32, 0.68, 0.05, 0.22, 0.282, INK.paper, "#B3AB95"),
    onY(0.22, 0.44, 0.56, 0.1, 0.28, INK.paper, "#B3AB95"),
    line([[0.5, 0.22, 0.14], [0.5, 0.22, 0.24]], GOLD[1], 0.9),
    line([[0.47, 0.22, 0.2], [0.53, 0.22, 0.2]], GOLD[1], 0.9),
    ...prop(() => [
      ...box(0.485, 0.11, 0.28, 0.03, 0.03, 0.34, GOLD),
      ...box(0.42, 0.11, 0.48, 0.16, 0.03, 0.035, GOLD),
    ]),
    ...candle(0.37, 0.15, 0.28, 0.1, accent),
    ...candle(0.63, 0.15, 0.28, 0.1, accent),
    // the Chapel's record on its lectern
    ...solid(0.12, 0.34, 0.03, 0.03, 0.24, WOOD),
    ...box(0.08, 0.32, 0.24, 0.11, 0.08, 0.02, WOOD),
    flat(0.09, 0.18, 0.33, 0.39, 0.262, INK.paper, "#B3AB95"),
    line([[0.135, 0.33, 0.262], [0.135, 0.39, 0.262]], "#B3AB95"),
    ...pew(0.06, 0.44),
    ...pew(0.62, 0.44),
    ...pew(0.06, 0.66),
    // the font by the door
    ...drum(0.16, 0.9, 0.03, 0.14, STONE),
    ...cylinder(0.16, 0.9, 0.14, 0.065, 0.03, STONE),
    disc(0.16, 0.9, 0.171, 0.05, INK.glass, undefined, 0.75),
  ];
}

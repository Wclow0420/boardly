// Seal the Manor's gallery: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  GOLD,
  INK,
  LEAF,
  STONE,
  WOOD,
  P,
  ball,
  box,
  candle,
  cylinder,
  flat,
  line,
  n,
  onY,
  paint,
  type Shape,
} from "@/components/iso/kit";
import {
  IRON,
  WAX,
  chair,
  drum,
  picture,
  planks,
  prop,
  shell,
  solid,
} from "@/components/iso/room";

export function gallery(accent: string): Shape[] {
  const [ix, iy] = P(0.69, 0.2, 0.25);
  const post = (y: number): Shape[] => [
    ...drum(0.14, y, 0.02, 0.01, GOLD),
    ...box(0.134, y - 0.006, 0.01, 0.012, 0.012, 0.16, GOLD),
    ball([0.14, y, 0.185], 0.9, GOLD[0], GOLD[2]),
  ];
  const rope = (y1: number, y2: number) =>
    line([[0.14, y1, 0.17], [0.14, (y1 + y2) / 2, 0.125], [0.14, y2, 0.17]], INK.red, 0.9);
  return [
    ...shell(),
    ...planks(),
    // dado and picture rail
    line([[0, 1, 0.24], [0, 0, 0.24], [1, 0, 0.24]], paint().line),
    line([[0, 1, 0.7], [0, 0, 0.7], [1, 0, 0.7]], paint().line),
    ...picture("x", 0.08, 0.3, 0.38, 0.64, LEAF[2]),
    ...picture("x", 0.38, 0.72, 0.32, 0.68, "#2A3152"),
    ...picture("x", 0.8, 0.94, 0.4, 0.6, INK.redDark),
    // a moonlit landscape in the big frame
    ball([0, 0.48, 0.58], 1.8, accent),
    line([[0, 0.68, 0.42], [0, 0.6, 0.52], [0, 0.52, 0.43], [0, 0.42, 0.5]], INK.glass, 0.7),
    ...picture("y", 0.1, 0.28, 0.38, 0.62, "#3A4A7A"),
    ball([0.19, 0, 0.52], 1.6, INK.paper, "#B3AB95"),
    ...picture("y", 0.72, 0.92, 0.4, 0.6, LEAF[2]),
    // a vase on a pedestal, and the bust
    ...solid(0.1, 0.04, 0.1, 0.1, 0.2, STONE),
    ...cylinder(0.15, 0.09, 0.2, 0.03, 0.08, [INK.glass, "#5A6FA8", "#5A6FA8"]),
    ...solid(0.16, 0.2, 0.14, 0.14, 0.26, STONE),
    ...box(0.195, 0.235, 0.26, 0.07, 0.07, 0.06, WAX),
    ball([0.23, 0.27, 0.4], 2.6, INK.paper, "#B3AB95"),
    // writing desk: paper, the letter box, and a quill in its inkwell
    ...solid(0.66, 0.14, 0.28, 0.18, 0.22, WOOD),
    onY(0.32, 0.69, 0.91, 0.08, 0.18, WOOD[1], WOOD[2]),
    ball([0.8, 0.32, 0.13], 0.6, GOLD[0]),
    flat(0.73, 0.84, 0.17, 0.29, 0.222, INK.paper, "#B3AB95"),
    ...[0.2, 0.225, 0.25].map((y) => line([[0.75, y, 0.222], [0.82, y, 0.222]], "#8C8676")),
    ...box(0.86, 0.16, 0.22, 0.07, 0.07, 0.08, GOLD),
    line([[0.875, 0.195, 0.3], [0.915, 0.195, 0.3]], "#7A5A2A", 0.9),
    ...cylinder(0.69, 0.2, 0.22, 0.018, 0.03, IRON),
    ...prop(() => [
      { d: `M${n(ix)} ${n(iy)} L${n(ix - 5)} ${n(iy - 17)}`, stroke: INK.paper, strokeWidth: 0.7 },
      {
        d: `M${n(ix - 1.6)} ${n(iy - 5.5)} Q${n(ix - 7.5)} ${n(iy - 9)} ${n(ix - 5.4)} ${n(iy - 18.5)} Q${n(ix - 0.2)} ${n(iy - 13)} ${n(ix - 1.6)} ${n(iy - 5.5)} Z`,
        fill: INK.paper,
        stroke: "#B3AB95",
        strokeWidth: 0.5,
      },
    ]),
    ...candle(0.91, 0.29, 0.22, 0.07, accent),
    ...chair(0.75, 0.36, "y1"),
    // rope along the pictures, and a bench to look at them from
    ...post(0.42),
    rope(0.42, 0.66),
    ...post(0.66),
    rope(0.66, 0.9),
    ...post(0.9),
    ...solid(0.3, 0.52, 0.12, 0.3, 0.1, WOOD),
    flat(0.31, 0.41, 0.54, 0.8, 0.101, INK.red, INK.redDark),
  ];
}

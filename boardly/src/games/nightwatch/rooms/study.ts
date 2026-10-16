// Seal the Manor's study: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  BOOKS,
  GOLD,
  INK,
  LEAF,
  WOOD,
  P,
  ball,
  box,
  candle,
  flat,
  line,
  moon,
  onY,
  type Shape,
} from "@/components/iso/kit";
import {
  CLOTH,
  IRON,
  drum,
  planks,
  prop,
  shell,
  solid,
  windowOn,
} from "@/components/iso/room";

export function study(accent: string): Shape[] {
  const shapes: Shape[] = [
    ...shell(),
    ...planks(),
    ...windowOn("y", 0.72, 0.92, 0.32, 0.5),
    moon(P(0.84, 0, 0.5)[0], P(0.84, 0, 0.5)[1], 1.8),
    // bookcase against the right wall
    ...solid(0.08, 0.02, 0.56, 0.14, 0.7, WOOD),
  ];
  for (const [row, z] of [0.06, 0.28, 0.5].entries()) {
    shapes.push(onY(0.16, 0.11, 0.61, z, z + 0.17, INK.iron, WOOD[2]));
    for (let i = 0; i < 9; i++) {
      const x = 0.12 + i * 0.054;
      const tall = 0.1 + ((i * 7 + row * 3) % 5) * 0.014;
      shapes.push(
        onY(0.16, x, x + 0.045, z, z + tall, BOOKS[(i + row * 2) % BOOKS.length], INK.iron)
      );
    }
  }
  shapes.push(
    ...box(0.07, 0.02, 0.7, 0.58, 0.15, 0.02, WOOD),
    // rug, with its border
    flat(0.3, 0.66, 0.44, 0.9, 0, INK.redDark, INK.red),
    flat(0.33, 0.63, 0.47, 0.87, 0, INK.redDark, GOLD[2]),
    // a globe on its stand
    ...drum(0.44, 0.3, 0.04, 0.02, WOOD),
    ...box(0.432, 0.292, 0.02, 0.016, 0.016, 0.13, GOLD),
    ball([0.44, 0.3, 0.215], 3.2, "#3F5A8C", GOLD[1]),
    ball([0.43, 0.3, 0.225], 1.2, LEAF[1]),
    // stool and desk, the records open on it
    ...drum(0.58, 0.3, 0.045, 0.12, WOOD),
    ...solid(0.66, 0.2, 0.26, 0.2, 0.22, WOOD),
    onY(0.4, 0.69, 0.89, 0.07, 0.18, WOOD[1], WOOD[2]),
    line([[0.79, 0.4, 0.07], [0.79, 0.4, 0.18]], WOOD[2]),
    ball([0.74, 0.4, 0.125], 0.6, GOLD[0]),
    ball([0.84, 0.4, 0.125], 0.6, GOLD[0]),
    ...box(0.86, 0.33, 0.22, 0.04, 0.04, 0.03, IRON),
    ...prop(() => [
      flat(0.69, 0.83, 0.23, 0.37, 0.224, INK.paper, "#B3AB95"),
      line([[0.76, 0.23, 0.224], [0.76, 0.37, 0.224]], "#B3AB95", 0.8),
      ...[0.26, 0.29, 0.32].flatMap((y) => [
        line([[0.7, y, 0.224], [0.745, y, 0.224]], "#8C8676"),
        line([[0.775, y, 0.224], [0.82, y, 0.224]], "#8C8676"),
      ]),
      line([[0.76, 0.37, 0.224], [0.775, 0.4, 0.224]], INK.red, 1),
    ]),
    ...candle(0.88, 0.25, 0.22, 0.09, accent),
    // reading chair and a side table
    ...solid(0.06, 0.72, 0.2, 0.2, 0.14, CLOTH),
    ...box(0.06, 0.72, 0.14, 0.05, 0.2, 0.2, CLOTH),
    ...drum(0.36, 0.86, 0.05, 0.14, WOOD),
    flat(0.33, 0.39, 0.83, 0.88, 0.141, BOOKS[3], INK.iron)
  );
  return shapes;
}

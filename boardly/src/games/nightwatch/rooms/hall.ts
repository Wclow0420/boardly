// Seal the Manor's hall: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  CARPET,
  GOLD,
  INK,
  LEAF,
  STONE,
  WOOD,
  ball,
  box,
  cylinder,
  flame,
  flat,
  line,
  onX,
  onY,
  paint,
  type Shape,
} from "@/components/iso/kit";
import {
  IRON,
  WAX,
  drum,
  prop,
  shell,
  solid,
  table,
} from "@/components/iso/room";

export function hall(accent: string): Shape[] {
  const stand = (): Shape[] => [
    ...drum(0.28, 0.28, 0.05, 0.03, IRON),
    ...box(0.268, 0.268, 0.03, 0.024, 0.024, 0.34, [GOLD[2], GOLD[2], "#7A5A2A"]),
    ...cylinder(0.28, 0.28, 0.37, 0.07, 0.02, GOLD),
    ...[0.23, 0.33, 0.28].flatMap((x, i) => [
      ...box(x - 0.008, 0.272, 0.39, 0.016, 0.016, i === 2 ? 0.05 : 0.03, WAX),
      ...flame([x, 0.28, i === 2 ? 0.44 : 0.42], i === 2 ? 2.4 : 2.2, accent),
    ]),
  ];
  const shapes: Shape[] = [
    ...shell(),
    // checkered floor
    ...[0, 1, 2, 3].flatMap((i) =>
      [0, 1, 2, 3]
        .filter((j) => (i + j) % 2 === 0)
        .map((j) =>
          flat(i * 0.25, i * 0.25 + 0.25, j * 0.25, j * 0.25 + 0.25, 0, paint().tile, paint().line)
        )
    ),
    // carpet runners from door to door
    flat(0.4, 0.6, 0, 1, 0, CARPET.fill, CARPET.edge),
    flat(0, 1, 0.4, 0.6, 0, CARPET.fill, CARPET.edge),
    flat(0.4, 0.6, 0.4, 0.6, 0, "#333A5C", GOLD[2]),
    // banners
    onX(0, 0.1, 0.26, 0.34, 0.7, INK.red, INK.redDark),
    ball([0, 0.18, 0.55], 1.6, GOLD[1], GOLD[2]),
    onY(0, 0.12, 0.28, 0.34, 0.7, INK.red, INK.redDark),
    ball([0.2, 0, 0.55], 1.6, GOLD[1], GOLD[2]),
    // console table with flowers, and the long-case clock
    ...table(0.1, 0.03, 0.2, 0.1, 0.2),
    ...cylinder(0.2, 0.08, 0.2, 0.025, 0.06, [INK.glass, "#5A6FA8", "#5A6FA8"]),
    ball([0.19, 0.08, 0.31], 1.5, LEAF[1]),
    ball([0.215, 0.08, 0.33], 1.3, INK.red),
    ball([0.2, 0.08, 0.35], 1.1, INK.paper),
    ...solid(0.74, 0.02, 0.13, 0.09, 0.56, WOOD),
    onY(0.11, 0.775, 0.835, 0.08, 0.34, INK.iron, WOOD[2]),
    line([[0.805, 0.11, 0.34], [0.805, 0.11, 0.16]], GOLD[1], 0.7),
    ball([0.805, 0.11, 0.15], 1, GOLD[0], GOLD[2]),
    ball([0.805, 0.11, 0.46], 2.4, INK.paper, GOLD[1]),
    line([[0.805, 0.11, 0.46], [0.805, 0.11, 0.5]], INK.iron, 0.6),
    line([[0.805, 0.11, 0.46], [0.83, 0.11, 0.46]], INK.iron, 0.6),
    // a potted fern by the door
    ...drum(0.07, 0.26, 0.04, 0.08, STONE),
    ball([0.07, 0.26, 0.15], 3, LEAF[2], INK.grassLine),
    ball([0.06, 0.25, 0.2], 2.2, LEAF[1]),
    ball([0.085, 0.27, 0.22], 1.6, LEAF[0]),
    ...prop(stand),
  ];
  // staircase climbing along the left wall, with its newel and rail
  for (let i = 0; i < 5; i++) {
    shapes.push(...box(0.02, 0.66 + i * 0.066, 0, 0.24, 0.066, 0.5 - i * 0.1, STONE));
    shapes.push(flat(0.05, 0.23, 0.66 + i * 0.066, 0.726 + i * 0.066, 0.5 - i * 0.1, INK.redDark));
  }
  shapes.push(
    line([[0.26, 0.69, 0.62], [0.26, 0.69, 0.5]], WOOD[0], 1.2),
    line([[0.26, 0.69, 0.62], [0.275, 0.975, 0.3]], WOOD[0], 1.4),
    ...solid(0.26, 0.96, 0.03, 0.03, 0.3, WOOD),
    ball([0.275, 0.975, 0.32], 1.2, GOLD[0], GOLD[2])
  );
  return shapes;
}

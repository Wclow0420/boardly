// Seal the Manor's cellar: its furniture and the one thing that works it
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
  flame,
  flat,
  hoop,
  line,
  onX,
  onY,
  paint,
  path,
  type Shape,
  type V3,
} from "@/components/iso/kit";
import {
  IRON,
  courses,
  disc,
  drum,
  flags,
  prop,
  shell,
  solid,
} from "@/components/iso/room";

export function cellar(accent: string): Shape[] {
  const barrel = (x: number, y: number): Shape[] => [
    ...drum(x, y, 0.12, 0.3, WOOD),
    hoop(x, y, 0.07, 0.12, INK.iron),
    hoop(x, y, 0.23, 0.12, INK.iron),
  ];
  const shapes: Shape[] = [...shell(), ...courses()];
  // brick joints, staggered course by course
  for (const [row, z] of [0, 0.2, 0.4, 0.6].entries()) {
    for (let a = row % 2 ? 0.125 : 0.25; a < 1; a += 0.25) {
      shapes.push(line([[0, a, z], [0, a, z + (row === 3 ? 0.15 : 0.2)]], paint().line));
    }
  }
  shapes.push(
    ...flags(4),
    // a barred light high in the wall, and a cobweb in the corner
    onX(0, 0.42, 0.6, 0.54, 0.66, INK.night, STONE[1]),
    ...[0.465, 0.51, 0.555].map((a) => line([[0, a, 0.54], [0, a, 0.66]], STONE[0], 0.8)),
    line([[0, 0.16, 0.75], [0.16, 0, 0.75]], INK.line),
    line([[0, 0.09, 0.69], [0.09, 0, 0.69]], INK.line),
    line([[0, 0, 0.6], [0.08, 0.08, 0.75]], INK.line),
    // wine rack
    ...solid(0.68, 0.02, 0.28, 0.1, 0.46, WOOD),
    ...[0.06, 0.2, 0.34].flatMap((z) => [
      onY(0.12, 0.7, 0.94, z, z + 0.1, INK.iron, WOOD[2]),
      ...[0.74, 0.82, 0.9].map((x) => ball([x, 0.12, z + 0.05], 1.1, LEAF[2], LEAF[1])),
    ]),
    // barrels along the left wall, one with a lantern on it
    ...barrel(0.14, 0.16),
    ...barrel(0.14, 0.42),
    ...box(0.115, 0.395, 0.3, 0.05, 0.05, 0.012, IRON),
    ...box(0.125, 0.405, 0.312, 0.03, 0.03, 0.05, GOLD),
    ...flame([0.14, 0.42, 0.362], 2.2, accent),
    // crates
    ...solid(0.78, 0.28, 0.18, 0.18, 0.16, WOOD),
    line([[0.78, 0.46, 0.08], [0.96, 0.46, 0.08]], WOOD[2]),
    ...box(0.81, 0.31, 0.16, 0.12, 0.12, 0.1, WOOD),
    // the passage under the floor: its curb, the shaft and a ladder
    flat(0.42, 0.7, 0.42, 0.7, 0, STONE[2], INK.line),
    flat(0.44, 0.68, 0.44, 0.68, 0, "#070912"),
    {
      d: path(
        ([[0.44, 0.44, 0], [0.44, 0.68, 0], [0.44, 0.62, -0.07], [0.44, 0.44, -0.07]] as V3[]).map(
          (p) => P(...p)
        )
      ),
      fill: paint().shade,
      stroke: INK.line,
      strokeWidth: 0.5,
    },
    {
      d: path(
        ([[0.44, 0.44, 0], [0.68, 0.44, 0], [0.62, 0.44, -0.07], [0.44, 0.44, -0.07]] as V3[]).map(
          (p) => P(...p)
        )
      ),
      fill: paint().lit,
      stroke: INK.line,
      strokeWidth: 0.5,
    },
    line([[0.5, 0.44, 0], [0.5, 0.44, -0.07]], WOOD[0], 0.9),
    line([[0.58, 0.44, 0], [0.58, 0.44, -0.07]], WOOD[0], 0.9),
    line([[0.5, 0.44, -0.025], [0.58, 0.44, -0.025]], WOOD[0], 0.9),
    line([[0.5, 0.44, -0.055], [0.58, 0.44, -0.055]], WOOD[0], 0.9),
    ...prop(() => [
      ...box(0.44, 0.44, 0, 0.24, 0.24, 0.025, WOOD),
      ...[0.5, 0.56, 0.62].map((x) => line([[x, 0.44, 0.025], [x, 0.68, 0.025]], WOOD[2])),
      flat(0.44, 0.68, 0.48, 0.51, 0.026, INK.iron),
      flat(0.44, 0.68, 0.61, 0.64, 0.026, INK.iron),
      disc(0.56, 0.56, 0.027, 0.028, undefined, STONE[0], undefined, 1),
    ]),
    ...barrel(0.14, 0.76),
    // sacks
    ball([0.36, 0.9, 0.05], 3.6, "#8C7B5A", "#5E5340"),
    ball([0.44, 0.94, 0.045], 3.1, "#9A8964", "#5E5340")
  );
  return shapes;
}

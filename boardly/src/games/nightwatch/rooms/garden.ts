// Seal the Manor's garden: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  DOOR,
  GOLD,
  INK,
  LEAF,
  LOCK,
  STONE,
  WOOD,
  P,
  ball,
  box,
  cylinder,
  firefly,
  flame,
  flat,
  hoop,
  k,
  line,
  moon,
  type Door,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import {
  EARTH,
  IRON,
  THICK,
  drum,
  exitOf,
  plinth,
  prop,
  solid,
  stars,
} from "@/components/iso/room";

export function garden(accent: string): Shape[] {
  const [a, b] = DOOR;
  const [mx, my] = P(1, 0, 0.72);
  /** A hedge along a back edge, with its gate and gateposts. */
  const hedge = (wall: "x" | "y", door: Door | null): Shape[] => {
    const piece = (from: number, to: number, tones: Tones, h: number, inset = 0) =>
      wall === "x"
        ? box(-THICK + inset, from, 0, THICK - inset * 2, to - from, h, tones)
        : box(from, -THICK + inset, 0, to - from, THICK - inset * 2, h, tones);
    const start = wall === "x" ? -THICK : 0;
    if (!door) return piece(start, 1, LEAF, 0.26);
    const gatepost = (at: number) => [
      ...piece(at - 0.03, at + 0.03, STONE, 0.34),
      ball(wall === "x" ? [-THICK / 2, at, 0.36] : [at, -THICK / 2, 0.36], 1.4, STONE[0], INK.line),
    ];
    return [
      ...piece(start, a - 0.03, LEAF, 0.26),
      ...gatepost(a),
      ...(door === "locked"
        ? piece(a + 0.03, b - 0.03, LOCK, 0.22, 0.015)
        : door === "shut"
          ? piece(a + 0.03, b - 0.03, WOOD, 0.3, 0.01)
          : []),
      ...gatepost(b),
      ...piece(b + 0.03, 1, LEAF, 0.26),
    ];
  };
  const stone = ([x, y]: [number, number]) => flat(x, x + 0.1, y, y + 0.1, 0, STONE[2], INK.grassLine);
  return [
    moon(mx - 8 * k(), my, 4.5),
    ...stars([[0.42, 0, 0.74], [0.16, 0, 0.56], [0.7, 0, 0.5], [0, 0.4, 0.7], [0, 0.82, 0.6], [0, 0.6, 0.46]]),
    ...plinth(EARTH),
    flat(0, 1, 0, 1, 0, INK.grass, INK.grassLine),
    ...[0.2, 0.4, 0.6, 0.8].map((y) => line([[0, y, 0], [1, y, 0]], INK.grassLine)),
    ...hedge("x", exitOf("left")),
    ...hedge("y", exitOf("right")),
    // stepping stones from each gate to the well
    ...([[0.03, 0.45], [0.19, 0.45], [0.35, 0.45], [0.45, 0.03], [0.45, 0.17], [0.52, 0.33]] as [number, number][]).map(stone),
    // a flower bed under the hedge
    flat(0.02, 0.12, 0.7, 0.97, 0, EARTH[2], INK.grassLine),
    ...[0.74, 0.8, 0.86, 0.92].map((y, i) => ball([0.07, y, 0.03], 1, i % 2 ? accent : INK.paper)),
    // a lamp by the gate
    ...drum(0.92, 0.08, 0.025, 0.02, IRON),
    ...box(0.912, 0.072, 0.02, 0.016, 0.016, 0.36, IRON),
    ...box(0.9, 0.06, 0.38, 0.04, 0.04, 0.06, GOLD),
    ...flame([0.92, 0.08, 0.39], 2.2, accent),
    // tree
    ...drum(0.22, 0.24, 0.035, 0.3, WOOD),
    ball([0.22, 0.24, 0.46], 8, LEAF[2], INK.grassLine),
    ball([0.17, 0.2, 0.53], 5.8, LEAF[1]),
    ball([0.26, 0.26, 0.57], 4.4, LEAF[0]),
    ball([0.2, 0.26, 0.42], 0.7, INK.red),
    ball([0.27, 0.22, 0.5], 0.7, INK.red),
    // the well: its wall, the water, the windlass and the bucket
    ...drum(0.76, 0.3, 0.12, 0.12, STONE),
    hoop(0.76, 0.3, 0.06, 0.12, STONE[2]),
    ...cylinder(0.76, 0.3, 0.115, 0.085, 0.004, [INK.night, INK.night, INK.night]),
    ball([0.74, 0.28, 0.12], 1.1, INK.glass, undefined, 0.8),
    ...box(0.645, 0.285, 0.12, 0.025, 0.03, 0.26, WOOD),
    line([[0.76, 0.3, 0.38], [0.76, 0.3, 0.27]], INK.paper, 0.7),
    ...prop(() => [
      ...cylinder(0.76, 0.3, 0.2, 0.034, 0.06, WOOD),
      hoop(0.76, 0.3, 0.225, 0.034, INK.iron),
      line([[0.735, 0.3, 0.26], [0.76, 0.3, 0.3], [0.785, 0.3, 0.26]], INK.iron, 0.7),
    ]),
    ...box(0.645, 0.285, 0.38, 0.235, 0.03, 0.03, WOOD),
    ...box(0.855, 0.285, 0.12, 0.025, 0.03, 0.26, WOOD),
    line([[0.88, 0.3, 0.395], [0.92, 0.3, 0.395], [0.92, 0.3, 0.34]], INK.iron, 0.9),
    ball([0.92, 0.3, 0.34], 0.7, WOOD[0], WOOD[2]),
    // a stone bench
    ...solid(0.12, 0.66, 0.04, 0.1, 0.08, STONE),
    ...solid(0.36, 0.66, 0.04, 0.1, 0.08, STONE),
    ...box(0.1, 0.65, 0.08, 0.32, 0.12, 0.025, STONE),
    // flowers, and fireflies over the grass
    ...([[0.9, 0.56], [0.56, 0.1], [0.3, 0.9], [0.6, 0.62], [0.96, 0.4]] as [number, number][]).map(
      ([x, y], i) => ball([x, y, 0.03], 0.9, i % 2 ? accent : INK.paper)
    ),
    ...([[0.5, 0.6, 0.2], [0.34, 0.5, 0.34], [0.86, 0.6, 0.28], [0.6, 0.86, 0.16], [0.44, 0.2, 0.3]] as V3[]).flatMap(
      firefly
    ),
  ];
}

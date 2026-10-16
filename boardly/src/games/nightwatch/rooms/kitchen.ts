// Seal the Manor's kitchen: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  GOLD,
  INK,
  LEAF,
  WOOD,
  ball,
  cylinder,
  flat,
  hoop,
  lightPool,
  line,
  onX,
  steam,
  type Shape,
} from "@/components/iso/kit";
import {
  WAX,
  disc,
  planks,
  prop,
  shell,
  tint,
} from "@/components/iso/room";
import {
  BRASS,
  IRONWORK,
  cabinet,
  hangingPan,
  jar,
  panel,
  range,
  shelfY,
} from "@/components/iso/furniture";

export function kitchen(accent: string): Shape[] {
  return [
    ...shell(),
    ...planks(),
    // copper pans on a rail, and the servants' bells on their board
    line([[0, 0.05, 0.66], [0, 0.34, 0.66]], BRASS[1], 1.1),
    ...hangingPan(0.12, 0.54, 1.5),
    ...hangingPan(0.25, 0.53, 1.8),
    onX(0, 0.7, 0.94, 0.42, 0.62, WOOD[1]),
    ...panel("shade", 0.002, 0.715, 0.925, 0.435, 0.605, WOOD[1]),
    ...[0.76, 0.82, 0.88].flatMap((y) => [
      ball([0.004, y, 0.57], 0.9, BRASS[0], BRASS[2]),
      ball([0.004, y, 0.49], 0.9, BRASS[0], BRASS[2]),
    ]),
    // a shelf of jars on carved brackets
    ...shelfY(0.06, 0.34, 0.44),
    ...[0.1, 0.16, 0.22, 0.28].flatMap((x, i) =>
      jar(x, 0.035, 0.458, 0.022, 0.05 + (i % 2) * 0.016, i % 2 ? LEAF[1] : "#7A9AD8"),
    ),
    // the dresser: a cupboard with drawers, a loaf and a knife on its board
    ...cabinet(0.08, 0.06, 0.24, 0.18, 0.22, { doors: 2, drawers: 2 }),
    flat(0.12, 0.26, 0.1, 0.21, 0.222, WAX[1]),
    ball([0.18, 0.16, 0.245], 1.6, "#B4683C", "#7A4526"),
    line([[0.25, 0.14, 0.223], [0.3, 0.2, 0.223]], "#C9D0DA", 1),
    // the range in the far-right corner
    ...range(0.66, 0.06, 0.28, 0.2, 0.3, accent),
    ...lightPool([0.78, 0.5, 0], 0.46),
    // a broom against the wall
    line([[0.07, 0.36, 0.04], [0, 0.36, 0.44]], WOOD[0], 1.1),
    tint([[0.1, 0.34, 0], [0.1, 0.38, 0], [0.06, 0.37, 0.07], [0.06, 0.35, 0.07]], GOLD[2], 1),
    // the cauldron on its trivet, over the fire
    line([[0.74, 0.34, 0], [0.76, 0.34, 0.09]], IRONWORK[1], 1.1),
    line([[0.86, 0.34, 0], [0.84, 0.34, 0.09]], IRONWORK[1], 1.1),
    line([[0.8, 0.4, 0], [0.8, 0.38, 0.09]], IRONWORK[1], 1.1),
    ...prop(() => [
      ...cylinder(0.8, 0.34, 0.08, 0.07, 0.1, IRONWORK),
      hoop(0.8, 0.34, 0.165, 0.07, BRASS[1]),
      disc(0.8, 0.34, 0.181, 0.055, "#6F8452", IRONWORK[2]),
      ball([0.78, 0.33, 0.183], 0.5, "#9DB37A"),
      ball([0.82, 0.35, 0.183], 0.4, "#9DB37A"),
    ]),
    ...steam([0.8, 0.34, 0.19], 0.26, 0.46),
    // the worktop, a bowl of apples and a cloth on it
    ...cabinet(0.03, 0.66, 0.18, 0.3, 0.24, { doors: 1, sidePanels: 2 }),
    ...cylinder(0.12, 0.78, 0.24, 0.05, 0.035, ["#E8E2D0", "#C8C0A8", "#9A9278"]),
    ball([0.11, 0.78, 0.29], 1.2, INK.red),
    ball([0.135, 0.785, 0.295], 1.2, "#B4484D"),
    flat(0.07, 0.17, 0.87, 0.93, 0.242, INK.paper),
  ];
}

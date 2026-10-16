// Seal the Manor's cellar: a vaulted stone cellar under the house. Dressed
// stone up both walls, a brick arch over a niche where three casks lie on
// their cradle, a wine rack of sealed bottles, crates and grain sacks, a
// barred window letting in the moon, a lantern on its bracket, cobwebs in
// the corner, and the trapdoor to the passage under the floor (the prop).
// Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import {
  ball,
  box,
  cylinder,
  DOOR,
  flat,
  INK,
  lightPool,
  line,
  P,
  path,
  tone,
  WOOD,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { disc, exitOf, mats, prop, shell, tint } from "@/components/iso/room";
import {
  archNiche,
  barredWindow,
  barrel,
  CELLAR_STONE,
  cornerCobweb,
  flagstones,
  grainSack,
  hangingLantern,
  IRONWORK,
  lyingBarrel,
  masonry,
  PEWTER,
  shippingCrate,
  strokes,
  wineRack,
} from "@/components/iso/pieces";

export function cellar(accent: string): Shape[] {
  const stone = "#4A4E58";
  const [da, db] = DOOR;
  const niche: [number, number, number] = [0.05, 0.66, 0.3];
  const win: [number, number, number, number] = [0.72, 0.92, 0.5, 0.66];
  const nicheR = (niche[1] - niche[0]) / 2;
  const leftKeep: [number, number, number, number][] = [
    [niche[0] - 0.055, niche[1] + 0.055, 0, niche[2] + nicheR + 0.03],
    [win[0] - 0.03, win[1] + 0.03, win[2] - 0.03, win[3] + 0.03],
  ];
  const rightKeep: [number, number, number, number][] = [
    ...(exitOf("right") ? [[da - 0.045, db + 0.045, 0, 0.59] as [number, number, number, number]] : []),
    [0.68, 0.98, 0, 0.62],
  ];
  const casks: [number, number, number, number][] = [
    // y, z, length, radius: two on the cradle and one on top
    [0.2, 0.18, 0.3, 0.125],
    [0.36, 0.385, 0.27, 0.115],
    [0.52, 0.18, 0.3, 0.125],
  ];
  return [
    ...shell(CELLAR_STONE, { panelled: false }),
    ...flagstones(4, "#3E414A"),
    ...mats(),
    // shadow gathered along the foot of the walls
    tint([[0, 0, 0], [0.1, 0.1, 0], [0.1, 1, 0], [0, 1, 0]], "#000000", 0.25),
    tint([[0, 0, 0], [1, 0, 0], [1, 0.1, 0], [0.1, 0.1, 0]], "#000000", 0.22),
    ...masonry("x", tone(stone, -0.12), leftKeep, 3),
    ...masonry("y", stone, rightKeep, 7),
    ...archNiche(niche[0], niche[1], niche[2], "#5C606B"),
    ...barredWindow(win[0], win[1], win[2], win[3], "#5C606B"),
    cornerCobweb([0, 0, 0.712], 0.13),
    cornerCobweb([0, 0.98, 0.712], 0.07),
    // the lantern lighting the casks
    ...hangingLantern(0.2, 0.7, accent),
    ...lightPool([0.36, 0.34, 0], 0.4),
    // the cradle, and the casks on it
    tint([[0.03, 0.06, 0], [0.4, 0.06, 0], [0.4, 0.7, 0], [0.03, 0.7, 0]], INK.night, 0.3),
    ...box(0.07, 0.06, 0, 0.045, 0.62, 0.06, WOOD),
    ...box(0.25, 0.06, 0, 0.045, 0.62, 0.06, WOOD),
    ...casks.flatMap(([y, z, len, r]) => lyingBarrel("x", [0.03 + (0.3 - len) / 2, y, z], len, r)),
    // a drip under the front tap
    disc(0.37, 0.52, 0.002, 0.022, "#3A1C22", undefined, 0.7),
    // the wine rack right of the door
    ...wineRack(0.69, 0.28, 0.13, 0.58, 3, 5, [INK.red, "#E2B04A", INK.red, "#7A2A40", "#C9D0DA"]),
    // a small cask standing before it, a pewter jug and a bottle on its head
    ...barrel(0.85, 0.3, 0.07, 0.19, WOOD),
    disc(0.85, 0.3, 0.191, 0.055, undefined, tone(WOOD[2], -0.3), 0.8),
    ...cylinder(0.83, 0.29, 0.19, 0.022, 0.05, PEWTER),
    ...cylinder(0.83, 0.29, 0.24, 0.016, 0.012, PEWTER),
    line([[0.83, 0.315, 0.232], [0.83, 0.33, 0.222], [0.83, 0.316, 0.2]], PEWTER[2], 0.9),
    ...cylinder(0.875, 0.32, 0.19, 0.017, 0.06, ["#3E6B55", "#1F3A2E", "#152A20"]),
    ...cylinder(0.875, 0.32, 0.25, 0.007, 0.035, ["#3E6B55", "#1F3A2E", "#152A20"]),
    ...cylinder(0.875, 0.32, 0.282, 0.008, 0.008, [tone(INK.red, 0.2), INK.red, INK.redDark]),
    // the passage under the floor: its curb, the shaft and a ladder
    ...box(0.415, 0.415, -0.004, 0.29, 0.29, 0.012, CELLAR_STONE),
    flat(0.44, 0.68, 0.44, 0.68, 0.008, "#070912"),
    {
      d: path(([[0.44, 0.44, 0.008], [0.44, 0.68, 0.008], [0.44, 0.62, -0.06], [0.44, 0.44, -0.06]] as V3[]).map((p) => P(...p))),
      fill: tone(stone, -0.35),
      strokeWidth: 0.5,
      stroke: INK.night,
    },
    {
      d: path(([[0.44, 0.44, 0.008], [0.68, 0.44, 0.008], [0.62, 0.44, -0.06], [0.44, 0.44, -0.06]] as V3[]).map((p) => P(...p))),
      fill: tone(stone, -0.2),
      strokeWidth: 0.5,
      stroke: INK.night,
    },
    strokes(
      [
        [[0.5, 0.441, 0.008], [0.5, 0.441, -0.06]],
        [[0.58, 0.441, 0.008], [0.58, 0.441, -0.06]],
        [[0.5, 0.441, -0.018], [0.58, 0.441, -0.018]],
        [[0.5, 0.441, -0.046], [0.58, 0.441, -0.046]],
      ],
      WOOD[0],
      1,
    ),
    ...prop(() => [
      ...box(0.44, 0.44, 0.008, 0.24, 0.24, 0.026, WOOD),
      strokes([0.5, 0.56, 0.62].map((x) => [[x, 0.445, 0.034], [x, 0.675, 0.034]] as V3[]), tone(WOOD[0], -0.45), 0.5, 0.8),
      strokes([0.5, 0.56, 0.62].map((x) => [[x, 0.68, 0.01], [x, 0.68, 0.032]] as V3[]), tone(WOOD[1], -0.45), 0.5, 0.8),
      // iron straps with rivets
      ...[0.475, 0.605].flatMap((y) => [
        ...box(0.438, y, 0.034, 0.244, 0.04, 0.004, IRONWORK),
        ...[0.46, 0.53, 0.6, 0.66].map((x) => ball([x, y + 0.02, 0.039], 0.35, IRONWORK[0])),
      ]),
      // the ring pull on its staple
      disc(0.56, 0.56, 0.036, 0.03, undefined, IRONWORK[2], undefined, 1.8),
      disc(0.56, 0.56, 0.037, 0.03, undefined, IRONWORK[0], undefined, 0.6),
      ...box(0.55, 0.52, 0.034, 0.02, 0.012, 0.008, IRONWORK),
    ]),
    // crates and sacks by the front of the left wall
    ...shippingCrate(0.03, 0.7, 0, 0.21, 0.2, 0.19),
    ...shippingCrate(0.06, 0.73, 0.19, 0.14, 0.13, 0.12, WOOD.map((c) => tone(c, 0.08)) as Tones),
    ...grainSack([0.33, 0.83, 0], 4.2, "#7E6C4A", -0.08),
    ...grainSack([0.29, 0.93, 0], 3.6, "#8A7752", 0.1),
  ];
}

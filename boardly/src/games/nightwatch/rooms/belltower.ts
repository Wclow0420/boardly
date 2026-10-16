// Seal the Manor's belltower: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.

import {
  GOLD,
  INK,
  STONE,
  WOOD,
  P,
  arch,
  ball,
  box,
  flame,
  k,
  line,
  moon,
  moonShaft,
  n,
  onX,
  onY,
  unit,
  type Shape,
} from "@/components/iso/kit";
import {
  IRON,
  WAX,
  courses,
  disc,
  drum,
  planks,
  prop,
  shell,
  solid,
  stars,
  tint,
} from "@/components/iso/room";

export function belltower(accent: string): Shape[] {
  const [bx, by] = P(0.5, 0.34, 0.36);
  const s = 7 * k();
  const opening = (wall: "x" | "y") => [
    arch(wall, 0.27, 0.73, 0.15, 0.44, STONE[1]),
    arch(wall, 0.3, 0.7, 0.18, 0.44, INK.night),
    (wall === "x" ? onX : onY)(0, 0.26, 0.74, 0.13, 0.16, STONE[0]),
  ];
  return [
    ...shell(),
    ...planks(),
    ...courses(),
    // the belfry's two openings on the night
    ...opening("x"),
    ...opening("y"),
    moon(P(0.5, 0, 0.5)[0] + 1, P(0.5, 0, 0.5)[1], 2.6),
    ...stars([[0.38, 0, 0.36], [0.62, 0, 0.3], [0, 0.42, 0.5], [0, 0.6, 0.34], [0, 0.5, 0.26]]),
    tint([[0.3, 0.06, 0], [0.7, 0.06, 0], [0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass, 0.07),
    ...moonShaft([[0.3, 0, 0.64], [0.7, 0, 0.64]], [[0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass),
    ...moonShaft([[0, 0.3, 0.64], [0, 0.7, 0.64]], [[0.5, 0.86, 0], [0.5, 0.46, 0]], INK.glass),
    // a crate of candles with a lantern on it
    ...solid(0.74, 0.06, 0.18, 0.16, 0.13, WOOD),
    line([[0.74, 0.22, 0.09], [0.92, 0.22, 0.09]], WOOD[2]),
    ...box(0.8, 0.11, 0.13, 0.05, 0.05, 0.012, IRON),
    ...box(0.81, 0.12, 0.142, 0.03, 0.03, 0.05, GOLD),
    ...flame([0.825, 0.135, 0.192], 2, accent),
    // headstock frame: back post, bell, beam, front post
    ...solid(0.16, 0.3, 0.06, 0.08, 0.66, WOOD),
    line([[0.22, 0.34, 0.48], [0.36, 0.34, 0.66]], WOOD[0], 1.2),
    ...prop(() => [
      line([[0.5, 0.34, 0.66], [0.5, 0.34, 0.56]], WOOD[0], 1.2),
      {
        d: `M${n(bx - s * 0.95)} ${n(by + s)} Q${n(bx - s * 0.8)} ${n(by - s * 0.1)} ${n(bx - s * 0.4)} ${n(by - s * 0.75)} Q${n(bx)} ${n(by - s * 1.15)} ${n(bx + s * 0.4)} ${n(by - s * 0.75)} Q${n(bx + s * 0.8)} ${n(by - s * 0.1)} ${n(bx + s * 0.95)} ${n(by + s)} Z`,
        fill: accent,
        stroke: GOLD[2],
        strokeWidth: 0.5,
      },
      {
        d: `M${n(bx + s * 0.1)} ${n(by - s * 1.0)} Q${n(bx + s * 0.75)} ${n(by - s * 0.3)} ${n(bx + s * 0.95)} ${n(by + s)} L${n(bx + s * 0.35)} ${n(by + s * 1.25)} Q${n(bx + s * 0.4)} ${n(by)} ${n(bx + s * 0.1)} ${n(by - s * 1.0)} Z`,
        fill: GOLD[2],
        opacity: 0.45,
      },
      {
        d: `M${n(bx - s * 0.62)} ${n(by + s * 0.2)} Q${n(bx)} ${n(by + s * 0.48)} ${n(bx + s * 0.78)} ${n(by + s * 0.2)}`,
        stroke: GOLD[2],
        strokeWidth: 0.5,
      },
      {
        d: `M${n(bx - s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx + s * 0.95)} ${n(by + s)} A${n(s * 0.95)} ${n(s * 0.3)} 0 0 0 ${n(bx - s * 0.95)} ${n(by + s)} Z`,
        fill: GOLD[2],
        stroke: "#7A5A2A",
        strokeWidth: 0.5,
      },
      ball([0.5, 0.34, 0.36 - (s + 1.6 * k()) / unit()], 1.5, GOLD[0], GOLD[2]),
    ]),
    ...box(0.16, 0.3, 0.66, 0.68, 0.08, 0.07, WOOD),
    // an owl keeping watch on the beam
    ball([0.3, 0.34, 0.765], 1.5, STONE[0], INK.line),
    ball([0.293, 0.345, 0.775], 0.35, GOLD[0]),
    ball([0.307, 0.345, 0.775], 0.35, GOLD[0]),
    ...solid(0.78, 0.3, 0.06, 0.08, 0.66, WOOD),
    line([[0.78, 0.38, 0.48], [0.64, 0.38, 0.66]], WOOD[0], 1.2),
    // the bell rope, down to its coil on the floor
    ...drum(0.62, 0.42, 0.045, 0.014, WAX),
    disc(0.62, 0.42, 0.014, 0.022, undefined, "#B3AB95"),
    line([[0.62, 0.38, 0.66], [0.62, 0.42, 0.02]], INK.paper, 0.8),
    // a ladder against the wall
    line([[0.2, 0.8, 0], [0, 0.8, 0.62]], WOOD[0], 1.2),
    ...[0.12, 0.24, 0.36, 0.48].map((z) =>
      line([[0.2 - z / 3.1, 0.8, z], [0.2 - z / 3.1, 0.92, z]], WOOD[1], 0.9)
    ),
    line([[0.2, 0.92, 0], [0, 0.92, 0.62]], WOOD[0], 1.2),
  ];
}

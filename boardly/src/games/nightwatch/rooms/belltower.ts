// Seal the Manor's belltower: a stone belfry open to the night through
// two twin-arched openings, the great bronze bell (marked prop) hung in a
// heavy oak frame (chamfered posts, braces, iron straps and bolts), its
// rope with a striped sally down to a coil, handbells on a shelf, a peal
// board, a lantern on an iron-bound chest, and a trapdoor down.
// Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import {
  box,
  INK,
  inkOf,
  k,
  lightPool,
  line,
  moon,
  moonShaft,
  n,
  P,
  tone,
  WOOD,
  type Shape,
  type V3,
} from "@/components/iso/kit";
import { disc, planks, prop, shell, stars, tint } from "@/components/iso/room";
import {
  ashlarCourses,
  barrel,
  belfryOpening,
  bellShape,
  bolt,
  BRASS,
  brassLantern,
  chamferedPost,
  chest,
  handbell,
  hatch,
  HEMP,
  IRONWORK,
  lit,
  pealBoard,
  rod,
  ropeCoil,
  sally,
  shelfX,
} from "@/components/iso/pieces";

/** A diagonal brace in the front plane y of a timber frame, from a post
 *  at (x1, z1) up to the beam at (x2, z2), `t` thick, with a bolt at each
 *  end. */
function brace(y: number, x1: number, z1: number, x2: number, z2: number, t: number): Shape[] {
  const front: V3[] = [[x1, y, z1], [x1, y, z1 + t * 1.6], [x2 - Math.sign(x2 - x1) * t * 1.6, y, z2], [x2, y, z2]];
  const shapes: Shape[] = [];
  shapes.push(lit(front, WOOD[1], front[1], front[3], 0.16, 0.22));
  shapes.push({ ...line([front[1], front[2]], "#FFFFFF", 0.45), opacity: 0.35 });
  shapes.push(...bolt([x1 + (x2 - x1) * 0.14, y, z1 + (z2 - z1) * 0.14 + t * 0.7]));
  shapes.push(...bolt([x1 + (x2 - x1) * 0.84, y, z1 + (z2 - z1) * 0.84 + t * 0.3]));
  return shapes;
}

/** The iron strap down the front of a frame post under the beam. */
const postStrap = (x: number): Shape[] => [
  ...box(x - 0.011, 0.38, 0.5, 0.022, 0.004, 0.16, IRONWORK),
  ...bolt([x, 0.384, 0.53]),
  ...bolt([x, 0.384, 0.61]),
];

export function belltower(accent: string): Shape[] {
  const [bx, by] = P(0.5, 0.34, 0.36);
  const s = 7 * k();
  const [mx, my] = P(0.62, 0, 0.42);
  return [
    ...shell(undefined, { panelled: false }),
    ...planks(),
    ...ashlarCourses(),
    // the belfry's two openings on the night
    ...belfryOpening("y", 0.28, 0.72, 0.15, 0.42, [
      moon(mx, my, 2.6),
      ...stars([[0.36, 0, 0.36], [0.42, 0, 0.22], [0.66, 0, 0.27], [0.55, 0, 0.5], [0.33, 0, 0.5]]),
    ]),
    ...belfryOpening("x", 0.28, 0.72, 0.15, 0.42, stars([[0, 0.38, 0.44], [0, 0.6, 0.34], [0, 0.66, 0.5], [0, 0.42, 0.24], [0, 0.56, 0.2], [0, 0.34, 0.3]])),
    tint([[0.3, 0.06, 0], [0.7, 0.06, 0], [0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass, 0.07),
    ...moonShaft([[0.3, 0, 0.62], [0.7, 0, 0.62]], [[0.86, 0.5, 0], [0.46, 0.5, 0]], INK.glass),
    ...moonShaft([[0, 0.3, 0.62], [0, 0.7, 0.62]], [[0.5, 0.86, 0], [0.5, 0.46, 0]], INK.glass),
    // handbells on a shelf, and the peal board
    ...shelfX(0.79, 0.97, 0.4, 0.06),
    ...handbell(0.03, 0.83, 0.418, 2.2),
    ...handbell(0.03, 0.88, 0.418, 2.6),
    ...handbell(0.03, 0.935, 0.418, 3),
    ...barrel(0.1, 0.87, 0.055, 0.15),
    disc(0.1, 0.87, 0.151, 0.042, "#3A4050", IRONWORK[2]),
    ...pealBoard(0.8, 0.96, 0.36, 0.6),
    // an iron-bound chest with a lantern on it
    ...chest(0.74, 0.05, 0.2, 0.15, 0.13),
    ...brassLantern(0.84, 0.125, 0.13, 0.026, 0.07, accent),
    ...lightPool([0.84, 0.3, 0], 0.4),
    // the bell frame: sole plate and feet, back post and brace
    ...box(0.1, 0.29, 0, 0.8, 0.1, 0.05, WOOD),
    ...box(0.14, 0.23, 0, 0.11, 0.22, 0.055, WOOD),
    ...bolt([0.195, 0.45, 0.03]),
    ...chamferedPost(0.16, 0.3, 0.055, 0.07, 0.08, 0.605, [0.12]),
    ...brace(0.38, 0.23, 0.44, 0.37, 0.66, 0.03),
    ...postStrap(0.195),
    // the bell, swinging from its headstock under the beam
    ...prop(() => [
      ...bellShape(bx, by, s),
      ...box(0.44, 0.315, 0.555, 0.12, 0.05, 0.1, WOOD),
      ...[0.465, 0.535].flatMap((x) => [
        ...box(x - 0.008, 0.364, 0.53, 0.016, 0.004, 0.12, IRONWORK),
        ...bolt([x, 0.369, 0.625]),
      ]),
      ...box(0.425, 0.33, 0.6, 0.015, 0.02, 0.02, BRASS),
      ...box(0.56, 0.33, 0.6, 0.015, 0.02, 0.02, BRASS),
    ]),
    // the beam, with iron over the joints and a brass date plate
    ...box(0.12, 0.3, 0.66, 0.76, 0.08, 0.07, WOOD),
    ...[0.195, 0.805].flatMap((x) => [
      ...box(x - 0.011, 0.38, 0.665, 0.022, 0.004, 0.06, IRONWORK),
      ...bolt([x, 0.384, 0.695]),
    ]),
    lit([[0.45, 0.381, 0.675], [0.55, 0.381, 0.675], [0.55, 0.381, 0.715], [0.45, 0.381, 0.715]], BRASS[1], [0.45, 0.38, 0.715], [0.55, 0.38, 0.675], 0.3, 0.25),
    line([[0.465, 0.382, 0.695], [0.535, 0.382, 0.695]], BRASS[2], 0.5),
    // an owl keeping watch on the beam
    ...owl(0.3, 0.34, 0.73),
    // the front foot, post and brace
    ...box(0.75, 0.23, 0, 0.11, 0.22, 0.055, WOOD),
    ...bolt([0.805, 0.45, 0.03]),
    ...chamferedPost(0.77, 0.3, 0.055, 0.07, 0.08, 0.605, [0.12]),
    ...brace(0.38, 0.77, 0.44, 0.63, 0.66, 0.03),
    ...postStrap(0.805),
    // the bell rope with its striped sally, down to a coil on the floor
    ...ropeCoil(0.64, 0.47),
    ...rod([[0.62, 0.385, 0.66], [0.62, 0.42, 0.06], [0.63, 0.45, 0.02]], HEMP, 1),
    ...sally([0.62, 0.413, 0.18], [0.62, 0.401, 0.3]),
    // the hatch down, open, with the top of a ladder showing
    ...hatch(0.27, 0.43, 0.64, 0.8),
  ];
}

/** A little owl perched at (x, y, z). */
function owl(x: number, y: number, z: number): Shape[] {
  const [cx, base] = P(x, y, z);
  const r = 1.8 * k();
  const cy = base - r * 0.9;
  const body = "#8A7558";
  const edge = inkOf(body);
  return [
    {
      d: `M${n(cx - r * 0.9)} ${n(base)} C${n(cx - r * 1.1)} ${n(cy - r * 0.2)} ${n(cx - r * 0.8)} ${n(cy - r * 1.1)} ${n(cx - r * 0.55)} ${n(cy - r * 1.35)} L${n(cx - r * 0.3)} ${n(cy - r * 1.0)} L${n(cx + r * 0.3)} ${n(cy - r * 1.0)} L${n(cx + r * 0.55)} ${n(cy - r * 1.35)} C${n(cx + r * 0.8)} ${n(cy - r * 1.1)} ${n(cx + r * 1.1)} ${n(cy - r * 0.2)} ${n(cx + r * 0.9)} ${n(base)} Z`,
      fill: body,
      grad: { colors: [tone(body, 0.3), body, tone(body, -0.3)], from: [cx - r, cy - r], to: [cx + r, base] },
      stroke: edge,
      strokeWidth: 0.5,
    },
    {
      d: `M${n(cx - r * 0.45)} ${n(base)} C${n(cx - r * 0.5)} ${n(cy)} ${n(cx + r * 0.5)} ${n(cy)} ${n(cx + r * 0.45)} ${n(base)} Z`,
      fill: "#D8CCB0",
      opacity: 0.8,
    },
    ...[-0.38, 0.38].flatMap((f) => [
      {
        d: `M${n(cx + r * f - r * 0.3)} ${n(cy - r * 0.55)} a${n(r * 0.3)} ${n(r * 0.3)} 0 1 0 ${n(r * 0.6)} 0 a${n(r * 0.3)} ${n(r * 0.3)} 0 1 0 ${n(-r * 0.6)} 0 Z`,
        fill: "#F0C87A",
        stroke: edge,
        strokeWidth: 0.35,
      },
      {
        d: `M${n(cx + r * f - r * 0.12)} ${n(cy - r * 0.55)} a${n(r * 0.12)} ${n(r * 0.12)} 0 1 0 ${n(r * 0.24)} 0 a${n(r * 0.12)} ${n(r * 0.12)} 0 1 0 ${n(-r * 0.24)} 0 Z`,
        fill: "#1A1206",
      },
    ]),
    { d: `M${n(cx - r * 0.1)} ${n(cy - r * 0.35)} L${n(cx + r * 0.1)} ${n(cy - r * 0.35)} L${n(cx)} ${n(cy - r * 0.1)} Z`, fill: "#C99A44" },
  ];
}

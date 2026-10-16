// Seal the Manor's garden: a walled garden under the moon. Clipped yew
// hedges with stone gateposts (urns on top) for walls, a gravel court
// with paths in from the two gates, an old apple tree, a stone well with
// a shingled roof, a winch and the bucket (the prop), an iron lamp post,
// a wrought-iron bench, a flower bed, fireflies.
// Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import {
  ball,
  box,
  cylinder,
  firefly,
  flat,
  hoop,
  INK,
  k,
  line,
  n,
  P,
  tone,
  WOOD,
  type Shape,
  type V3,
} from "@/components/iso/kit";
import { EARTH, exitOf, plinth, prop } from "@/components/iso/room";
import {
  ASHLAR,
  gardenBench,
  gravelCourt,
  hedge,
  IRONWORK,
  lampPost,
  posy,
  rnd,
  tree,
  wellHead,
  wellRoof,
} from "@/components/iso/pieces";

export function garden(accent: string): Shape[] {
  const left = exitOf("left");
  const right = exitOf("right");
  const gates = [...(left ? (["x"] as const) : []), ...(right ? (["y"] as const) : [])];
  // the sky: the moon, and stars over the hedges
  const [mx, my] = P(0.6, -0.035, 0.9);
  const mr = 6 * k();
  const sky: Shape[] = [
    { d: `M${n(mx - mr * 1.45)} ${n(my)} a${n(mr * 1.45)} ${n(mr * 1.45)} 0 1 0 ${n(mr * 2.9)} 0 a${n(mr * 1.45)} ${n(mr * 1.45)} 0 1 0 ${n(-mr * 2.9)} 0 Z`, fill: INK.glass, opacity: 0.07 },
    {
      d: `M${n(mx - mr)} ${n(my)} a${n(mr)} ${n(mr)} 0 1 0 ${n(2 * mr)} 0 a${n(mr)} ${n(mr)} 0 1 0 ${n(-2 * mr)} 0 Z`,
      fill: "#E8E4D4",
      grad: { colors: ["#FFFDF2", "#E4E0D0", "#A9B4CC"], from: [mx - mr * 0.4, my - mr * 0.4], radius: mr * 1.5 },
      stroke: "#7A86A8",
      strokeWidth: 0.6,
    },
    {
      d: [
        [0.3, -0.2, 0.28],
        [-0.35, 0.25, 0.2],
        [0.15, 0.45, 0.14],
        [-0.2, -0.45, 0.12],
      ]
        .map(([dx, dy, r]) => {
          const [cx, cy, rr] = [mx + dx * mr, my + dy * mr, r * mr];
          return `M${n(cx - rr)} ${n(cy)} a${n(rr)} ${n(rr * 0.9)} 0 1 0 ${n(2 * rr)} 0 a${n(rr)} ${n(rr * 0.9)} 0 1 0 ${n(-2 * rr)} 0 Z`;
        })
        .join(" "),
      fill: "#B8C0D4",
      opacity: 0.6,
    },
  ];
  const starAt: [number, number, number][] = [
    [0.45, -0.05, 1.05],
    [0.2, -0.05, 0.85],
    [0.75, -0.05, 0.7],
    [-0.05, 0.35, 1.0],
    [-0.05, 0.75, 0.82],
    [-0.05, 0.55, 0.62],
    [0.05, -0.05, 1.12],
    [-0.05, 0.95, 0.58],
    [0.3, -0.05, 1.18],
    [-0.05, 0.18, 1.12],
    [0.95, -0.05, 0.62],
  ];
  starAt.forEach(([x, y, z], i) => {
    const [sx, sy] = P(x, y, z);
    const r = (i % 3 === 0 ? 1.6 : 0.8) * k();
    sky.push(
      i % 3 === 0
        ? { d: `M${n(sx)} ${n(sy - r)} Q${n(sx)} ${n(sy)} ${n(sx + r)} ${n(sy)} Q${n(sx)} ${n(sy)} ${n(sx)} ${n(sy + r)} Q${n(sx)} ${n(sy)} ${n(sx - r)} ${n(sy)} Q${n(sx)} ${n(sy)} ${n(sx)} ${n(sy - r)} Z`, fill: "#DCE6FF" }
        : ball([x, y, z], 0.4, INK.glass),
    );
  });

  // the lawn, darker toward the front, with tufts of grass
  const lawn = "#2C4A3A";
  let tufts = "";
  let lit = "";
  for (let i = 0; i < 120; i++) {
    const [x, y] = [0.03 + rnd(i * 3 + 7) * 0.94, 0.03 + rnd(i * 5 + 11) * 0.94];
    const [sx, sy] = P(x, y, 0);
    const s = 0.9 * k();
    const blade = ` M${n(sx - s)} ${n(sy)} l${n(s * 0.5)} ${n(-s * 1.4)} M${n(sx)} ${n(sy)} l${n(0)} ${n(-s * 1.8)} M${n(sx + s)} ${n(sy)} l${n(-s * 0.4)} ${n(-s * 1.3)}`;
    if (i % 3) tufts += blade;
    else lit += blade;
  }
  return [
    ...sky,
    ...plinth(EARTH),
    {
      ...flat(0, 1, 0, 1, 0, lawn, INK.grassLine),
      grad: { colors: [tone(lawn, 0.12), lawn, tone(lawn, -0.3)], from: P(0, 0, 0), to: P(1, 1, 0) },
    },
    { d: tufts, stroke: tone(lawn, -0.35), strokeWidth: 0.5, opacity: 0.9 },
    { d: lit, stroke: tone(lawn, 0.35), strokeWidth: 0.5, opacity: 0.8 },
    ...gravelCourt(0.64, 0.64, 0.3, gates as ("x" | "y")[]),
    // the hedges, the lamp by the gate
    ...hedge("x", left, [accent, INK.paper, "#E8A0B8"]),
    ...hedge("y", right, [INK.paper, "#E8A0B8", accent]),
    ...lampPost(0.9, 0.11, 0.42, accent),
    // the old apple tree in the far corner
    ...tree(0.22, 0.22, 0.3, 0.2, "#C2453F"),
    // a flower bed under the left hedge, edged in stone
    ...box(0.06, 0.71, 0, 0.09, 0.26, 0.022, ASHLAR),
    flat(0.07, 0.14, 0.72, 0.96, 0.023, "#2E2418", "#1A140C"),
    ...[0.76, 0.85, 0.93].flatMap((y, i) => {
      const [cx, cy] = P(0.105, y, 0.03);
      return posy(cx, cy, 2.5 * k(), i % 2 ? [INK.paper, accent] : [accent, "#E8A0B8", INK.paper], 50 + i * 9);
    }),
    // the well, and the bucket hanging in it
    ...wellHead(0.76, 0.3, 0.12, 0.12),
    ...wellRoof(0.76, 0.3, 0.12, 0.15, "back"),
    ...prop(() => [
      ...cylinder(0.76, 0.3, 0.2, 0.034, 0.06, WOOD),
      hoop(0.76, 0.3, 0.212, 0.034, IRONWORK[2]),
      hoop(0.76, 0.3, 0.248, 0.034, IRONWORK[2]),
      line([[0.73, 0.3, 0.26], [0.76, 0.3, 0.295], [0.79, 0.3, 0.26]], IRONWORK[1], 0.8),
      line([[0.76, 0.3, 0.295], [0.76, 0.3, 0.33]], "#D8CCB0", 0.7),
    ]),
    ...wellRoof(0.76, 0.3, 0.12, 0.15, "front"),
    // the bench on the lawn, an urn of flowers beside it
    ...gardenBench(0.16, 0.74, 0.24),
    // fireflies over the grass
    ...([[0.5, 0.6, 0.2], [0.34, 0.5, 0.34], [0.86, 0.6, 0.28], [0.6, 0.86, 0.16], [0.44, 0.2, 0.3], [0.2, 0.9, 0.22]] as V3[]).flatMap(firefly),
  ];
}

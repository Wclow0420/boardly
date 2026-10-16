// The three places Shelter's survivors scavenge, each a small snowy
// diorama on a block of frozen earth, drawn with the iso kit and the
// shared pieces (components/iso/pieces): the farm, the market and the
// hospital.

import {
  ball,
  box,
  cylinder,
  hoop,
  INK,
  line,
  n,
  onX,
  onY,
  P,
  poly,
  tone,
  withView,
  WOOD,
  type Shape,
  type Tones,
  type V3,
  type View,
} from "@/components/iso/kit";
import { tint } from "@/components/iso/room";
import {
  barrel,
  burlapSack,
  fenceX,
  fruitCrate,
  icicles,
  IRONWORK,
  mound,
  pine,
  SNOW,
  snowCap,
} from "@/components/iso/pieces";
import type { Place } from "../logic";

export const PLACE_WIDTH = 120;
export const PLACE_HEIGHT = 110;
const PLACE_VIEW: View = { scale: 62, cx: 60, cy: 36 };

/** Frozen earth under the snow. */
const EARTH: Tones = ["#EEF3FA", "#6B5444", "#4E3C30"];
const BARN: Tones = ["#B8504E", "#963F40", "#6E2C31"];
const PLASTER: Tones = ["#F1E6CE", "#DCCBA6", "#B09C78"];
const CLINIC: Tones = ["#FBFAF6", "#E4E0D6", "#BDB7A8"];
const SLATE: Tones = ["#5E6A82", "#46506A", "#323A50"];
const GLASS = "#22305A";
const CROSS = "#D23C3C";

// ── shared parts ────────────────────────────────────────────────────

/** The block of earth a place stands on, its top deep in snow that
 *  hangs over the two front edges. */
const ground = (): Shape[] => [
  tint([[0.04, 0.04, -0.14], [1.12, 0.04, -0.14], [1.12, 1.12, -0.14], [0.04, 1.12, -0.14]], "#000000", 0.25),
  ...box(0, 0, -0.1, 1, 1, 0.1, EARTH),
  // strata and stones in the earth
  line([[1, 0.02, -0.06], [1, 0.4, -0.07], [1, 0.7, -0.055], [1, 0.98, -0.065]], tone(EARTH[2], -0.35), 0.45),
  line([[0.02, 1, -0.065], [0.35, 1, -0.055], [0.7, 1, -0.07], [0.98, 1, -0.06]], tone(EARTH[1], -0.35), 0.45),
  ...[[1, 0.22, -0.085], [1, 0.62, -0.04], [0.3, 1, -0.085], [0.82, 1, -0.04]].map((at) => ball(at as V3, 0.7, "#8F887D", "#4E4A43")),
  ...snowCap(0, 0, 1, 1, 0, 0.03),
];

/** A gabled roof under snow over the block (c0..c1 across the ridge,
 *  l0..l1 along it) at height z, `rise` to the ridge, `over` beyond the
 *  walls. `ridge` "y" puts the gable end facing the viewer's left (+y),
 *  "x" facing the right (+x). The roof's own colour shows in its edges,
 *  icicles hang from the near eave. */
function gableRoof(ridge: "x" | "y", c0: number, c1: number, l0: number, l1: number, z: number, rise: number, over: number, tones: Tones): Shape[] {
  const at = (c: number, l: number, h: number): V3 => (ridge === "y" ? [c, l, h] : [l, c, h]);
  const cm = (c0 + c1) / 2;
  const zr = z + rise;
  const ze = z - (over * rise) / (cm - c0);
  const t = 0.022;
  const [a0, a1, b0, b1] = [c0 - over, c1 + over, l0 - over, l1 + over];
  const back = [at(a0, b0, ze), at(cm, b0, zr), at(cm, b1, zr), at(a0, b1, ze)];
  const front = [at(cm, b0, zr), at(a1, b0, ze), at(a1, b1, ze), at(cm, b1, zr)];
  const snow = (pts: V3[], light: number): Shape => ({
    ...poly(pts, SNOW[1]),
    grad: { colors: [tone(SNOW[1], light), SNOW[1], SNOW[2]], from: P(...pts[1]), to: P(...pts[3]) },
    stroke: tone(SNOW[2], -0.3),
    strokeWidth: 0.45,
  });
  const strip = (p: V3, q: V3, fill: string): Shape => poly([p, q, [q[0], q[1], q[2] - t], [p[0], p[1], p[2] - t]], fill);
  // the near slope: shingles, snow lying over its upper part in scallops
  const shingle = { ...poly(front, tones[1]), grad: { colors: [tones[0], tones[1], tones[2]], from: P(...front[0]), to: P(...front[2]) } };
  const rows = [0.62, 0.8].map((f) =>
    line([at(cm + (a1 - cm) * f, b0, zr + (ze - zr) * f), at(cm + (a1 - cm) * f, b1, zr + (ze - zr) * f)], tone(tones[2], -0.3), 0.45),
  );
  const cover = 0.55;
  const steps = 9;
  const edge: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const f = cover + 0.09 * Math.abs(Math.sin(t * Math.PI * steps * 0.5));
    edge.push(at(cm + (a1 - cm) * f, b1 + (b0 - b1) * t, zr + (ze - zr) * f));
  }
  const frontSnow = snow([at(cm, b1, zr), ...edge, at(cm, b0, zr)], ridge === "y" ? 0.3 : 0.7);
  return [
    snow(back, ridge === "y" ? 0.8 : 0.4),
    shingle,
    ...rows,
    frontSnow,
    // the roof's edges: the gable's two rakes and the near eave
    strip(at(a0, b1, ze), at(cm, b1, zr), tones[1]),
    strip(at(cm, b1, zr), at(a1, b1, ze), tones[2]),
    strip(at(a1, b0, ze), at(a1, b1, ze), tones[2]),
    { ...line([at(a0 + 0.01, b1, ze + 0.004), at(cm, b1, zr + 0.004), at(a1 - 0.01, b1, ze + 0.004)], "#FFFFFF", 0.8), opacity: 0.9 },
    ...icicles(at(a1, b0 + 0.02, ze - t), at(a1, b1 - 0.02, ze - t), 7, 0.05),
  ];
}

/** The gable end of a block under a gableRoof: its triangle of wall. */
function gable(ridge: "x" | "y", c0: number, c1: number, l1: number, z: number, rise: number, fill: string): Shape {
  const at = (c: number, h: number): V3 => (ridge === "y" ? [c, l1, h] : [l1, c, h]);
  const pts = [at(c0, z), at(c1, z), at((c0 + c1) / 2, z + rise)];
  return { ...poly(pts, fill), grad: { colors: [tone(fill, 0.15), fill, tone(fill, -0.2)], from: P(...pts[2]), to: P(...pts[1]) } };
}

/** A window on a block's visible face: `face` "y" is the +y face at
 *  y = at, "x" the +x face; a white frame, a cross, a gleam. */
function windowOn(face: "x" | "y", at: number, u1: number, u2: number, z1: number, z2: number, glass = GLASS, frame = "#F4EEDF"): Shape[] {
  const on = face === "y" ? onY : onX;
  const p = (u: number, z: number): V3 => (face === "y" ? [u, at + 0.002, z] : [at + 0.002, u, z]);
  const um = (u1 + u2) / 2;
  const zm = (z1 + z2) / 2;
  return [
    on(at + 0.001, u1 - 0.012, u2 + 0.012, z1 - 0.012, z2 + 0.012, frame),
    { ...on(at + 0.002, u1, u2, z1, z2, glass), grad: { colors: [tone(glass, 0.35), glass, tone(glass, -0.3)], from: P(...p(u1, z2)), to: P(...p(u2, z1)) } },
    line([p(um, z1), p(um, z2)], frame, 0.7),
    line([p(u1, zm), p(u2, zm)], frame, 0.7),
    { ...line([p(u1 + (u2 - u1) * 0.15, z2 - (z2 - z1) * 0.1), p(u1 + (u2 - u1) * 0.4, zm + (z2 - z1) * 0.12)], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

/** A red cross on a block's visible face, centred at (u, z), `s` tall. */
function redCross(face: "x" | "y", at: number, u: number, z: number, s: number): Shape[] {
  const on = face === "y" ? onY : onX;
  const w = s * 0.34;
  return [
    on(at + 0.003, u - s / 2, u + s / 2, z - w / 2, z + w / 2, CROSS, "#7A1E1E"),
    on(at + 0.003, u - w / 2, u + w / 2, z - s / 2, z + s / 2, CROSS, "#7A1E1E"),
    on(at + 0.004, u - s / 2 + 0.006, u + s / 2 - 0.006, z - w / 2 + 0.006, z + w / 2 - 0.006, CROSS),
  ];
}

// ── the farm ────────────────────────────────────────────────────────

function farm(): Shape[] {
  const [x, y, w, d, h] = [0.1, 0.1, 0.36, 0.34, 0.26];
  const [X, Y] = [x + w, y + d];
  const rise = 0.17;
  const shapes: Shape[] = [...ground()];
  // the field: furrows showing through the snow
  for (const fy of [0.6, 0.68, 0.76, 0.84]) {
    shapes.push(line([[0.54, fy, 0.016], [0.93, fy, 0.016]], "#7A6250", 1.3), { ...line([[0.54, fy + 0.02, 0.017], [0.93, fy + 0.02, 0.017]], "#FFFFFF", 0.8), opacity: 0.8 });
  }
  // footprints from the barn door
  shapes.push({ ...line([[0.28, Y + 0.04, 0.016], [0.32, 0.66, 0.016], [0.42, 0.95, 0.016]], "#8E9CB4", 1), dash: "0.8 1.6" });
  // the pines behind and the silo
  shapes.push(...pine(0.86, 0.1, 0.015, 0.42, 0.09));
  shapes.push(
    ...cylinder(0.66, 0.2, 0, 0.085, 0.34, ["#D8D0C0", "#B4AA96", "#7A7264"]),
    ...[0.08, 0.17, 0.26].map((z) => hoop(0.66, 0.2, z, 0.085, "#5E584F")),
  );
  {
    // its domed tin cap, snow on top
    const [cx, cy] = P(0.66, 0.2, 0.34);
    const rx = 0.09 * 62 * 1.2247;
    const ry = 0.09 * 62 * 0.7071;
    shapes.push(
      {
        d: `M${n(cx - rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(cy)} C${n(cx + rx)} ${n(cy - rx * 0.9)} ${n(cx - rx)} ${n(cy - rx * 0.9)} ${n(cx - rx)} ${n(cy)} Z`,
        fill: "#C9D0DA",
        grad: { colors: ["#FFFFFF", "#C9D0DA", "#7A8494"], from: [cx - rx * 0.4, cy - rx * 0.4], radius: rx * 1.4 },
        stroke: "#1E242C",
        strokeWidth: 0.5,
      },
      {
        d: `M${n(cx - rx * 0.62)} ${n(cy - rx * 0.42)} C${n(cx - rx * 0.4)} ${n(cy - rx * 0.86)} ${n(cx + rx * 0.4)} ${n(cy - rx * 0.86)} ${n(cx + rx * 0.62)} ${n(cy - rx * 0.42)} Q${n(cx + rx * 0.3)} ${n(cy - rx * 0.3)} ${n(cx)} ${n(cy - rx * 0.4)} Q${n(cx - rx * 0.3)} ${n(cy - rx * 0.28)} ${n(cx - rx * 0.62)} ${n(cy - rx * 0.42)} Z`,
        fill: "#FFFFFF",
        stroke: tone(SNOW[2], -0.2),
        strokeWidth: 0.4,
      },
    );
  }
  // the barn: red boards, white trim, the big doors in its gable end
  shapes.push(...box(x, y, 0, w, d, h, BARN), gable("y", x, X, Y, h, rise, BARN[1]));
  for (let i = 1; i < 9; i++) {
    const u = x + (w * i) / 9;
    const top = h + rise * (1 - Math.abs(u - (x + X) / 2) / (w / 2));
    shapes.push({ ...line([[u, Y, 0.01], [u, Y, top - 0.01]], tone(BARN[1], -0.4), 0.4), opacity: 0.7 });
  }
  for (let i = 1; i < 8; i++) {
    const v = y + (d * i) / 8;
    shapes.push({ ...line([[X, v, 0.01], [X, v, h - 0.01]], tone(BARN[2], -0.4), 0.4), opacity: 0.7 });
  }
  const [d1, d2] = [x + 0.08, X - 0.08];
  shapes.push(
    line([[x + 0.004, Y, 0], [x + 0.004, Y, h]], "#F4EEDF", 1),
    line([[X, Y, 0], [X, Y, h]], "#F4EEDF", 1),
    { ...onY(Y + 0.001, d1, d2, 0, 0.2, "#7A2E32"), grad: { colors: ["#963F40", "#7A2E32", "#57232A"], from: P(d1, Y, 0.2), to: P(d2, Y, 0) } },
    line([[d1, Y + 0.002, 0], [d1, Y + 0.002, 0.2], [d2, Y + 0.002, 0.2], [d2, Y + 0.002, 0]], "#F4EEDF", 1),
    line([[(d1 + d2) / 2, Y + 0.002, 0], [(d1 + d2) / 2, Y + 0.002, 0.2]], "#F4EEDF", 0.8),
    line([[d1, Y + 0.002, 0], [(d1 + d2) / 2, Y + 0.002, 0.2], [d2, Y + 0.002, 0]], "#F4EEDF", 0.8),
    line([[d1, Y + 0.002, 0.2], [(d1 + d2) / 2, Y + 0.002, 0], [d2, Y + 0.002, 0.2]], "#F4EEDF", 0.8),
    // the hayloft door, hay showing
    onY(Y + 0.001, (x + X) / 2 - 0.04, (x + X) / 2 + 0.04, h + 0.0, h + 0.08, "#2A1C14", "#F4EEDF"),
    ...[-0.02, 0, 0.02].map((du) => line([[(x + X) / 2 + du, Y + 0.002, h], [(x + X) / 2 + du * 1.6, Y + 0.002, h + 0.03]], "#E2B04A", 0.8)),
    ...mound([X - 0.02, Y + 0.02, 0], 0.07, 0.04),
  );
  shapes.push(...gableRoof("y", x, X, y, Y, h, rise, 0.035, ["#7A3A2A", "#5A2A20", "#3E1C16"]));
  // a haystack under snow, the fence round the field, the pines in front
  shapes.push(
    ...mound([0.66, 0.44, 0.015], 0.08, 0.1, ["#F2D58A", "#D9A95B", "#9A6B1E"]),
    ...mound([0.665, 0.435, 0.07], 0.06, 0.05),
    ...fenceX(0.5, 0.96, 0.52, 4, 0.1),
    ...pine(0.1, 0.66, 0.015, 0.44, 0.1),
    ...pine(0.22, 0.86, 0.015, 0.28, 0.07),
  );
  return shapes;
}

// ── the market ──────────────────────────────────────────────────────

function market(): Shape[] {
  const [x, y, w, d, h] = [0.08, 0.1, 0.58, 0.32, 0.3];
  const [X, Y] = [x + w, y + d];
  const rise = 0.13;
  const shapes: Shape[] = [...ground(), ...pine(0.88, 0.12, 0.015, 0.4, 0.09)];
  // the shop: plaster between dark timbers, the gable end to the right
  shapes.push(...box(x, y, 0, w, d, h, PLASTER), gable("x", y, Y, X, h, rise, PLASTER[2]));
  const beam = "#5A3A26";
  for (const u of [x + 0.006, x + w * 0.5, X - 0.004]) shapes.push(line([[u, Y, 0], [u, Y, h]], beam, 1.2));
  shapes.push(line([[x, Y, h * 0.92], [X, Y, h * 0.92]], beam, 1.2), line([[X, y, h * 0.92], [X, Y, h * 0.92]], beam, 1.2));
  shapes.push(line([[X, y + 0.004, 0], [X, y + 0.004, h]], beam, 1.2));
  // the shop window full of goods, the door
  const [w1, w2] = [x + 0.05, x + 0.27];
  const [g1, g2] = [0.03, 0.15];
  shapes.push(
    onY(Y + 0.001, w1 - 0.015, w2 + 0.015, g1 - 0.015, g2 + 0.012, beam),
    { ...onY(Y + 0.002, w1, w2, g1, g2, "#3A2A1E"), grad: { colors: ["#7A5A3A", "#3A2A1E", "#22180F"], from: P(w1, Y, g2), to: P(w2, Y, g1) } },
    line([[w1, Y + 0.003, 0.09], [w2, Y + 0.003, 0.09]], "#8A6A44", 0.7),
    ...[w1 + 0.03, w1 + 0.07, w1 + 0.11, w1 + 0.15, w1 + 0.19].flatMap((u, i) => [
      ball([u, Y + 0.004, 0.058], 1.3, ["#E0A030", "#C8323A", "#5E8A3A", "#D9A95B", "#46587E"][i]),
      ball([u + 0.01, Y + 0.004, 0.112], 1.1, ["#C8323A", "#E0A030", "#F4EEDF", "#5E8A3A", "#C9973E"][i]),
    ]),
    { ...line([[w1 + 0.02, Y + 0.004, 0.14], [w1 + 0.07, Y + 0.004, 0.04]], "#FFFFFF", 0.5), opacity: 0.7 },
    ...box(x + 0.34, Y, 0, 0.1, 0.006, 0.19, WOOD),
    ...windowOn("y", Y + 0.006, x + 0.365, x + 0.415, 0.11, 0.165, "#22305A", "#9A7250"),
    ball([x + 0.43, Y + 0.008, 0.09], 0.8, "#E2B04A"),
  );
  // the striped awning over the window and door
  const [a0, a1] = [x + 0.03, x + 0.46];
  const [zt, zb, out] = [0.27, 0.235, 0.075];
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    const u1 = a0 + ((a1 - a0) * i) / stripes;
    const u2 = a0 + ((a1 - a0) * (i + 1)) / stripes;
    const fill = i % 2 ? "#F4EEDF" : "#E07A34";
    shapes.push({ ...poly([[u1, Y, zt], [u2, Y, zt], [u2, Y + out, zb], [u1, Y + out, zb]], fill), grad: { colors: [tone(fill, 0.2), fill, tone(fill, -0.2)], from: P(u1, Y, zt), to: P(u1, Y + out, zb) } });
    const [sx, sy] = P(u1, Y + out, zb);
    const [ex, ey] = P(u2, Y + out, zb);
    shapes.push({
      d: `M${n(sx)} ${n(sy)} L${n(ex)} ${n(ey)} L${n(ex)} ${n(ey + 1.6)} Q${n((sx + ex) / 2)} ${n((sy + ey) / 2 + 3.6)} ${n(sx)} ${n(sy + 1.6)} Z`,
      fill,
      stroke: tone(fill, -0.5),
      strokeWidth: 0.4,
    });
  }
  shapes.push({
    ...poly([[a0, Y, zt + 0.004], [a1, Y, zt + 0.004], [a1, Y + out * 0.55, zt - (zt - zb) * 0.55 + 0.006], [a0, Y + out * 0.55, zt - (zt - zb) * 0.55 + 0.006]], SNOW[0]),
    stroke: tone(SNOW[2], -0.2),
  });
  shapes.push(...gableRoof("x", y, Y, x, X, h, rise, 0.03, SLATE));
  // a brick chimney through the ridge, snow on its cap
  const ch = x + w * 0.3;
  shapes.push(
    ...box(ch, y + d / 2 - 0.03, h + rise - 0.04, 0.06, 0.06, 0.1, ["#B4683C", "#963F2E", "#6E2C22"]),
    ...[0.03, 0.06].map((dz) => line([[ch, y + d / 2 + 0.03, h + rise - 0.04 + dz], [ch + 0.06, y + d / 2 + 0.03, h + rise - 0.04 + dz]], "#5A2418", 0.4)),
    ...snowCap(ch - 0.006, y + d / 2 - 0.036, 0.072, 0.072, h + rise + 0.06, 0.016),
  );
  // a sign hung from a bracket at the corner: a gold loaf on a board
  const [sx, sy] = [X - 0.03, Y + 0.004];
  shapes.push(
    line([[sx, sy, 0.27], [sx, sy + 0.1, 0.27]], IRONWORK[0], 0.9),
    line([[sx, sy + 0.06, 0.27], [sx, sy + 0.06, 0.245]], IRONWORK[0], 0.5),
    line([[sx, sy + 0.1, 0.27], [sx, sy + 0.1, 0.245]], IRONWORK[0], 0.5),
    { ...onX(sx, sy + 0.04, sy + 0.125, 0.15, 0.245, "#7A5A3A"), grad: { colors: ["#9A7250", "#74533A", "#53392A"], from: P(sx, sy + 0.125, 0.245), to: P(sx, sy + 0.04, 0.15) } },
    ball([sx + 0.002, sy + 0.082, 0.197], 1, "#E2B04A", "#9A6B1E"),
  );
  // what's left outside: crates, sacks, a barrel, drifts
  shapes.push(
    ...barrel(0.78, 0.34, 0.05, 0.14),
    ...mound([0.78, 0.34, 0.14], 0.045, 0.03),
    ...fruitCrate(0.6, 0.56, 0.015, 0.13, 0.12, 0.1, ["#C8323A", "#E0503C", "#5E8A3A"]),
    ...fruitCrate(0.74, 0.5, 0.015, 0.11, 0.11, 0.09),
    ...snowCap(0.74, 0.5, 0.11, 0.11, 0.105, 0.016),
    ...fruitCrate(0.755, 0.515, 0.12, 0.08, 0.08, 0.07),
    ...snowCap(0.755, 0.515, 0.08, 0.08, 0.19, 0.016),
    ...burlapSack(0.56, 0.72, 0.015, 0.12),
    ...pine(0.12, 0.74, 0.015, 0.4, 0.09),
  );
  return shapes;
}

// ── the hospital ────────────────────────────────────────────────────

function hospital(): Shape[] {
  const [x, y, w, d, h] = [0.12, 0.08, 0.54, 0.38, 0.4];
  const [X, Y] = [x + w, y + d];
  const shapes: Shape[] = [...ground(), ...pine(0.9, 0.1, 0.015, 0.36, 0.08)];
  shapes.push(...box(x, y, 0, w, d, h, CLINIC));
  // a band of colour along the foot, windows in two rows on both faces
  shapes.push(onY(Y + 0.001, x, X, 0, 0.04, "#9AA6BC"), onX(X + 0.001, y, Y, 0, 0.04, "#7A869C"));
  for (const z of [0.08, 0.25]) {
    for (const u of [x + 0.04, x + 0.13, x + 0.38, x + 0.47]) {
      const lit = z > 0.2 && u > x + 0.4;
      shapes.push(...windowOn("y", Y, u, u + 0.055, z, z + 0.09, lit ? "#F2C46A" : GLASS));
    }
    for (const v of [y + 0.05, y + 0.16, y + 0.27]) shapes.push(...windowOn("x", X, v, v + 0.06, z, z + 0.09));
  }
  // the red cross over the doors, the canopy on its posts
  shapes.push(...redCross("y", Y, x + w / 2, 0.29, 0.1));
  shapes.push(
    { ...onY(Y + 0.002, x + 0.22, x + 0.32, 0, 0.17, "#22305A"), grad: { colors: ["#4A62A0", "#22305A", "#141C38"], from: P(x + 0.22, Y, 0.17), to: P(x + 0.32, Y, 0) } },
    line([[x + 0.27, Y + 0.003, 0], [x + 0.27, Y + 0.003, 0.17]], "#C9D0DA", 0.8),
    ...box(x + 0.195, Y + 0.08, 0, 0.012, 0.012, 0.19, IRONWORK),
    ...box(x + 0.335, Y + 0.08, 0, 0.012, 0.012, 0.19, IRONWORK),
    ...box(x + 0.18, Y, 0.19, 0.18, 0.1, 0.022, CLINIC),
    ...snowCap(x + 0.18, Y, 0.18, 0.1, 0.212, 0.016),
  );
  // the roof: a parapet, deep snow, a rooftop sign
  shapes.push(
    ...snowCap(x - 0.005, y - 0.005, w + 0.01, d + 0.01, h, 0.03),
    ...box(x + 0.16, y + 0.12, h + 0.015, 0.2, 0.012, 0.09, CLINIC),
    ...redCross("y", y + 0.132, x + 0.26, h + 0.06, 0.06),
    ...icicles([X + 0.005, y + 0.02, h - 0.01], [X + 0.005, Y - 0.02, h - 0.01], 6, 0.04),
  );
  // an ambulance in the snow
  const [ax, ay] = [0.56, 0.62];
  const [aw, ad, ah] = [0.24, 0.13, 0.12];
  const wheel = (u: number, v: number) => ball([u, v, 0.045], 1.5, "#1E2230", "#0B0E16");
  shapes.push(
    tint([[ax + 0.02, ay + 0.03, 0.015], [ax + aw + 0.12, ay + 0.03, 0.015], [ax + aw + 0.12, ay + ad + 0.02, 0.015], [ax + 0.02, ay + ad + 0.02, 0.015]], INK.night, 0.3),
    wheel(ax + aw + 0.03, ay + 0.02),
    ...box(ax, ay, 0.04, aw, ad, ah, CLINIC),
    ...box(ax + aw, ay + 0.005, 0.04, 0.075, ad - 0.01, ah * 0.72, CLINIC),
    { ...onX(ax + aw + 0.076, ay + 0.02, ay + ad - 0.02, 0.04 + ah * 0.4, 0.04 + ah * 0.66, "#46587E"), grad: { colors: ["#8AA0D0", "#46587E", "#2C3A60"], from: P(ax + aw, ay, 0.12), to: P(ax + aw, ay + ad, 0.08) } },
    onY(ay + ad + 0.001, ax, ax + aw + 0.075, 0.07, 0.085, CROSS, "#7A1E1E"),
    ...redCross("y", ay + ad, ax + 0.12, 0.12, 0.05),
    ...box(ax + 0.08, ay + 0.04, 0.04 + ah, 0.035, 0.05, 0.018, ["#FF6A6A", CROSS, "#7A1E1E"]),
    ...box(ax + 0.12, ay + 0.04, 0.04 + ah, 0.035, 0.05, 0.018, ["#8AB4FF", "#4A72C8", "#2C4A8A"]),
    ...snowCap(ax + 0.005, ay + 0.005, aw * 0.4, ad - 0.01, 0.04 + ah, 0.014),
    wheel(ax + 0.05, ay + ad + 0.002),
    wheel(ax + aw + 0.02, ay + ad + 0.002),
    ...mound([ax + 0.1, ay + ad + 0.05, 0.015], 0.08, 0.035),
  );
  shapes.push(
    ...mound([x + 0.1, Y + 0.05, 0.015], 0.07, 0.03),
    ...pine(0.12, 0.72, 0.015, 0.4, 0.09),
    ...pine(0.28, 0.88, 0.015, 0.24, 0.06),
  );
  return shapes;
}

const PLACE_BUILDERS: Record<Place, () => Shape[]> = { farm, market, hospital };

/** A small snowy picture of a place to scavenge. */
export function placeScene(place: Place): Shape[] {
  return withView(PLACE_VIEW, () => PLACE_BUILDERS[place]());
}

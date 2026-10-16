// Pictures to hang in a frame. Two kinds:
//  - a Canvas (ornateFrame's): painted with `at(s, t)`, s across and t
//    up the canvas, both 0..1;
//  - a wall painter (giltFrame's): (at, u1, u2, z1, z2, wall), painting
//    on the wall plane between u1..u2 and z1..z2.

import { ball, line, n, P, path, tone, unit, type Shape, type V3 } from "../kit";
import { filled, roundel } from "./helpers";

// ── for ornateFrame ─────────────────────────────────────────────────

/** Where a point of a canvas lands: s across (left to right as seen),
 *  t up, both 0..1. */
export type At = (s: number, t: number) => V3;
/** Paints a picture onto a canvas `w` × `h` world units. */
export type Canvas = (at: At, w: number, h: number) => Shape[];

function patch(at: At, pts: [number, number][], fill: string, grad?: { colors: string[]; from: [number, number]; to: [number, number] }): Shape {
  return {
    d: path(pts.map(([s, t]) => P(...at(s, t)))),
    fill,
    ...(grad ? { grad: { colors: grad.colors, from: P(...at(...grad.from)), to: P(...at(...grad.to)) } } : {}),
  };
}
const blob = (cs: number, ct: number, rs: number, rt: number, steps = 12): [number, number][] =>
  Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cs + Math.cos(a) * rs, ct + Math.sin(a) * rt];
  });

/** The corners of a canvas, in (s, t). */
export const CANVAS_CORNERS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** A moonlit valley: dusk sky, blue hills, a lake, a dark tree. */
export const landscape: Canvas = (at, w, h) => [
  patch(at, CANVAS_CORNERS, "#3A4A82", { colors: ["#1C2656", "#46568E", "#E9A97A"], from: [0.5, 1], to: [0.5, 0.36] }),
  patch(at, blob(0.72, 0.8, 0.032 / w, 0.032 / h), "#FFF2C8"),
  patch(at, [[0, 0.42], [0.14, 0.62], [0.26, 0.5], [0.44, 0.7], [0.62, 0.47], [0.8, 0.6], [1, 0.44], [1, 0.3], [0, 0.3]], "#5A6898", {
    colors: ["#8A96C0", "#5A6898", "#46527E"],
    from: [0.44, 0.7],
    to: [0.44, 0.3],
  }),
  patch(at, [[0, 0.36], [0.22, 0.47], [0.46, 0.34], [0.72, 0.43], [1, 0.33], [1, 0], [0, 0]], "#3E6B4A", {
    colors: ["#6A9A62", "#3E6B4A", "#22402E"],
    from: [0.5, 0.47],
    to: [0.5, 0.05],
  }),
  patch(at, [[0.34, 0.24], [0.84, 0.24], [0.92, 0.13], [0.28, 0.13]], "#8AA8D8", {
    colors: ["#E9C8A8", "#8AA8D8", "#4A6698"],
    from: [0.6, 0.24],
    to: [0.6, 0.13],
  }),
  patch(at, [[0, 0.16], [0.3, 0.07], [0.62, 0.1], [1, 0.04], [1, 0], [0, 0]], "#1E3A28"),
  patch(at, [[0.17, 0.08], [0.2, 0.08], [0.2, 0.36], [0.17, 0.36]], "#3A2A1E"),
  patch(at, blob(0.185, 0.44, 0.06 / w, 0.07 / h), "#2C5238", { colors: ["#4E8456", "#2C5238", "#1A3424"], from: [0.15, 0.5], to: [0.24, 0.36] }),
];

/** The manor itself by moonlight: a dark house with lit windows and a
 *  tower, under a night sky, a lawn before it. */
export const manor: Canvas = (at, w, h) => [
  patch(at, CANVAS_CORNERS, "#24306A", { colors: ["#121A44", "#2A3A78", "#6A6AA0"], from: [0.5, 1], to: [0.5, 0.3] }),
  patch(at, blob(0.78, 0.8, 0.026 / w, 0.026 / h), "#FFF2C8"),
  patch(at, [[0, 0.24], [0.3, 0.3], [0.7, 0.28], [1, 0.22], [1, 0], [0, 0]], "#1E3A2A", { colors: ["#3E6A4A", "#1E3A2A", "#0E1E14"], from: [0.5, 0.3], to: [0.5, 0] }),
  patch(at, [[0.14, 0.26], [0.14, 0.5], [0.3, 0.6], [0.46, 0.5], [0.46, 0.62], [0.52, 0.72], [0.58, 0.62], [0.58, 0.5], [0.74, 0.6], [0.88, 0.5], [0.88, 0.26]], "#1A1426"),
  ...([[0.2, 0.36], [0.28, 0.36], [0.36, 0.36], [0.66, 0.36], [0.74, 0.36], [0.82, 0.36], [0.52, 0.56], [0.24, 0.46], [0.78, 0.46]] as [number, number][]).map(([s, t]) =>
    patch(at, [[s - 0.025, t - 0.035], [s + 0.025, t - 0.035], [s + 0.025, t + 0.035], [s - 0.025, t + 0.035]], "#FFC870"),
  ),
  patch(at, [[0.46, 0.26], [0.58, 0.26], [0.58, 0.38], [0.52, 0.42], [0.46, 0.38]], "#FF9A4D"),
];

/** A classical ruin at sunset: three columns under a broken lintel,
 *  a golden sky, cypresses, a dark foreground. */
export const ruin: Canvas = (at, w, h) => {
  const column = (s: number, top: number): Shape[] => [
    patch(at, [[s - 0.06, 0.18], [s + 0.06, 0.18], [s + 0.06, top], [s - 0.06, top]], "#E9E2CF", { colors: ["#FFF6E0", "#E9E2CF", "#A89878"], from: [s - 0.06, 0.5], to: [s + 0.06, 0.5] }),
    patch(at, [[s - 0.085, top], [s + 0.085, top], [s + 0.085, top + 0.04], [s - 0.085, top + 0.04]], "#D8CCB0"),
  ];
  return [
    patch(at, CANVAS_CORNERS, "#E9A060", { colors: ["#5A4A8A", "#C87A6A", "#F6C878"], from: [0.5, 1], to: [0.5, 0.25] }),
    patch(at, blob(0.5, 0.36, 0.04 / w, 0.04 / h), "#FFF2C8"),
    patch(at, [[0, 0.22], [1, 0.26], [1, 0], [0, 0]], "#3A2A2A", { colors: ["#6A4A3A", "#3A2A2A", "#1A1010"], from: [0.5, 0.26], to: [0.5, 0] }),
    ...column(0.24, 0.66),
    ...column(0.5, 0.62),
    ...column(0.76, 0.44),
    patch(at, [[0.14, 0.7], [0.62, 0.66], [0.6, 0.74], [0.14, 0.78]], "#D8CCB0", { colors: ["#F4EEDF", "#C8BC9C"], from: [0.3, 0.78], to: [0.3, 0.66] }),
    patch(at, [[0.86, 0.18], [0.9, 0.5], [0.94, 0.18]], "#1E3A28"),
    patch(at, [[0.04, 0.18], [0.08, 0.56], [0.12, 0.18]], "#1E3A28"),
  ];
};

/** A still life: a blue vase of flowers and fruit on a ledge. */
export const flowerStillLife = (ground = "#22382E"): Canvas => (at, w, h) => [
  patch(at, CANVAS_CORNERS, ground, { colors: [tone(ground, 0.25), ground, tone(ground, -0.5)], from: [0.2, 0.9], to: [0.8, 0.1] }),
  patch(at, [[0, 0], [1, 0], [1, 0.22], [0, 0.22]], "#6A4A2E", { colors: ["#8E6A42", "#6A4A2E", "#3A2A1A"], from: [0.5, 0.22], to: [0.5, 0] }),
  patch(at, [[0.38, 0.22], [0.62, 0.22], [0.66, 0.38], [0.58, 0.5], [0.56, 0.58], [0.44, 0.58], [0.42, 0.5], [0.34, 0.38]], "#3A5A9A", {
    colors: ["#9AB8E8", "#3A5A9A", "#1A2A5A"],
    from: [0.38, 0.5],
    to: [0.66, 0.25],
  }),
  ...([
    [0.36, 0.72, "#C2203A"],
    [0.52, 0.8, "#F0CC72"],
    [0.66, 0.7, "#E05A6A"],
    [0.46, 0.66, "#F4EEDF"],
    [0.6, 0.62, "#C2203A"],
  ] as [number, number, string][]).map(([s, t, c]) =>
    patch(at, blob(s, t, 0.022 / w, 0.022 / h, 8), c, { colors: [tone(c, 0.4), c, tone(c, -0.35)], from: [s - 0.04, t + 0.04], to: [s + 0.05, t - 0.04] }),
  ),
  patch(at, blob(0.2, 0.27, 0.026 / w, 0.026 / h, 8), "#C8692A", { colors: ["#F2A86A", "#C8692A", "#6A3010"], from: [0.15, 0.31], to: [0.26, 0.22] }),
  patch(at, blob(0.8, 0.26, 0.022 / w, 0.022 / h, 8), "#7A9A3A", { colors: ["#C8E08A", "#7A9A3A", "#3A5018"], from: [0.76, 0.3], to: [0.85, 0.22] }),
];

/** A ship under sail on a moonlit sea. */
export const moonlitSeascape: Canvas = (at, w, h) => [
  patch(at, CANVAS_CORNERS, "#2A3A6E", { colors: ["#141E46", "#2A3A6E", "#5A6A9E"], from: [0.5, 1], to: [0.5, 0.4] }),
  patch(at, blob(0.24, 0.76, 0.035 / w, 0.035 / h), "#FFF2C8"),
  patch(at, [[0, 0.4], [1, 0.4], [1, 0], [0, 0]], "#1E3A5E", { colors: ["#4A6A9A", "#1E3A5E", "#0E1A30"], from: [0.5, 0.4], to: [0.5, 0] }),
  patch(at, [[0.2, 0.38], [0.28, 0.38], [0.32, 0.06], [0.16, 0.06]], "#E9E2CF", { colors: ["#FFF6D8", "#C8C0A8"], from: [0.24, 0.38], to: [0.24, 0.06] }),
  patch(at, [[0.5, 0.36], [0.86, 0.36], [0.8, 0.28], [0.56, 0.28]], "#3A2418"),
  patch(at, [[0.6, 0.38], [0.66, 0.38], [0.66, 0.78], [0.6, 0.72]], "#F4EEDF", { colors: ["#FFFFFF", "#D8CCB0"], from: [0.6, 0.78], to: [0.66, 0.4] }),
  patch(at, [[0.69, 0.38], [0.79, 0.38], [0.71, 0.7], [0.69, 0.7]], "#F4EEDF", { colors: ["#FFFFFF", "#D8CCB0"], from: [0.69, 0.7], to: [0.79, 0.4] }),
  patch(at, [[0.52, 0.4], [0.62, 0.4], [0.62, 0.6]], "#E9E2CF"),
];

/** A sea chart on parchment, with a compass rose. */
export const seaChart: Canvas = (at, w, h) => {
  const p = (pts: [number, number][]) => path(pts.map(([s, t]) => P(...at(s, t))));
  const [rx, ry] = P(...at(0.72, 0.32));
  const rr = Math.min(w, h) * 0.18 * unit();
  return [
    { d: p([[0, 0], [1, 0], [1, 1], [0, 1]]), fill: "#E9DCB8", grad: { colors: ["#F6ECCC", "#E2D2A8", "#B89E6A"], from: P(...at(0.2, 0.9)), to: P(...at(1, 0)) } },
    { d: p([[0, 0.5], [0.12, 0.62], [0.3, 0.58], [0.4, 0.8], [0.3, 1], [0, 1]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: p([[0.55, 1], [0.6, 0.82], [0.78, 0.76], [0.9, 0.86], [1, 0.8], [1, 1]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: p([[0.12, 0.12], [0.3, 0.08], [0.36, 0.26], [0.2, 0.3]]), fill: "#B8A070", stroke: "#6A5430", strokeWidth: 0.35 },
    { d: `M${n(rx)} ${n(ry - rr)} L${n(rx + rr * 0.22)} ${n(ry)} L${n(rx)} ${n(ry + rr)} L${n(rx - rr * 0.22)} ${n(ry)} Z M${n(rx - rr)} ${n(ry)} L${n(rx)} ${n(ry - rr * 0.22)} L${n(rx + rr)} ${n(ry)} L${n(rx)} ${n(ry + rr * 0.22)} Z`, fill: "#8E2433", stroke: "#5A1A10", strokeWidth: 0.3 },
    { d: p([[0.1, 0.4], [0.5, 0.45], [0.86, 0.6]]).replace(/ Z$/, ""), stroke: "#8E2433", strokeWidth: 0.4, dash: "1 1" },
  ];
};

// ── for giltFrame ───────────────────────────────────────────────────

/** A canvas: the manor's grounds by moonlight. */
export function moonlitLandscape(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], ["#2A3C6E", "#1D2A50", "#3B4A5E"], at(u1, z2), at(u1, z1)),
    ball(at(u1 + w * 0.72, z1 + h * 0.74), 1.1, "#F4EEDF"),
    filled(
      [at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.42), at(u1 + w * 0.7, z1 + h * 0.3), at(u1 + w * 0.35, z1 + h * 0.5), at(u1, z1 + h * 0.36)],
      ["#3E5A48", "#2B4436", "#1A2C22"],
      at(u1, z1 + h * 0.5),
      at(u2, z1),
    ),
    filled([at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.18), at(u1 + w * 0.45, z1 + h * 0.26), at(u1, z1 + h * 0.15)], ["#2A3A2C", "#1C2A20", "#121C15"], at(u1, z1 + h * 0.3), at(u2, z1)),
    // a lit window in a far house
    filled(
      [at(u1 + w * 0.3, z1 + h * 0.4), at(u1 + w * 0.42, z1 + h * 0.4), at(u1 + w * 0.42, z1 + h * 0.5), at(u1 + w * 0.36, z1 + h * 0.57), at(u1 + w * 0.3, z1 + h * 0.5)],
      ["#4A4A5E", "#2E2E3E", "#1E1E2A"],
      at(u1 + w * 0.3, z1 + h * 0.57),
      at(u1 + w * 0.42, z1 + h * 0.4),
    ),
    ball(at(u1 + w * 0.36, z1 + h * 0.46), 0.45, "#FFD98A"),
  ];
}

/** A canvas: a ship under sail on an evening sea. */
export function eveningSeascape(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  const p = (fu: number, fz: number) => at(u1 + w * fu, z1 + h * fz);
  return [
    filled([p(0, 0), p(1, 0), p(1, 1), p(0, 1)], ["#E8A860", "#B86A48", "#3A3A62"], p(0, 0.4), p(0, 1)),
    filled([p(0, 0), p(1, 0), p(1, 0.36), p(0, 0.36)], ["#3A5A7A", "#24405E", "#16283E"], p(0, 0.36), p(1, 0)),
    { ...line([p(0.1, 0.26), p(0.3, 0.28), p(0.5, 0.25)], "#FFFFFF", 0.5), opacity: 0.4 },
    { ...line([p(0.55, 0.14), p(0.85, 0.16)], "#FFFFFF", 0.5), opacity: 0.35 },
    filled([p(0.3, 0.38), p(0.74, 0.38), p(0.68, 0.3), p(0.36, 0.3)], ["#5A3A26", "#3A2418", "#1E120A"], p(0.3, 0.38), p(0.74, 0.3)),
    line([p(0.52, 0.38), p(0.52, 0.86)], "#2A1A10", 0.7),
    filled([p(0.53, 0.42), p(0.53, 0.84), p(0.7, 0.44)], ["#FFFFFF", "#F4EEDF", "#C8BC9C"], p(0.53, 0.84), p(0.7, 0.42)),
    filled([p(0.51, 0.44), p(0.51, 0.74), p(0.36, 0.46)], ["#FFFFFF", "#F4EEDF", "#C8BC9C"], p(0.51, 0.74), p(0.36, 0.44)),
    roundel("y", p(0.2, 0.78), 0.012, ["#FFF8E0", "#FFE3A8", "#E8B860"]),
  ];
}

/** A canvas: a still life of fruit and a jug on a dark ground. */
export function jugStillLife(at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number, wall: "x" | "y"): Shape[] {
  const w = u2 - u1;
  const h = z2 - z1;
  const dot = (fu: number, fz: number, r: number, c: string) => roundel(wall, at(u1 + w * fu, z1 + h * fz), r, [tone(c, 0.4), c, tone(c, -0.4)], tone(c, -0.6));
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], ["#4A3A26", "#2E2418", "#1A140E"], at(u1 + w * 0.3, z2), at(u2, z1)),
    filled([at(u1, z1), at(u2, z1), at(u2, z1 + h * 0.3), at(u1, z1 + h * 0.3)], ["#5A4630", "#3E3022", "#2A2016"], at(u1, z1 + h * 0.3), at(u2, z1)),
    filled(
      [at(u1 + w * 0.56, z1 + h * 0.3), at(u1 + w * 0.82, z1 + h * 0.3), at(u1 + w * 0.86, z1 + h * 0.55), at(u1 + w * 0.76, z1 + h * 0.72), at(u1 + w * 0.78, z1 + h * 0.8), at(u1 + w * 0.6, z1 + h * 0.8), at(u1 + w * 0.62, z1 + h * 0.72), at(u1 + w * 0.52, z1 + h * 0.55)],
      ["#C8D0DA", "#8A94A4", "#4A5262"],
      at(u1 + w * 0.5, z1 + h * 0.8),
      at(u1 + w * 0.86, z1 + h * 0.3),
    ),
    dot(0.24, 0.42, 0.024, "#C0303C"),
    dot(0.42, 0.38, 0.02, "#E8B850"),
    dot(0.34, 0.36, 0.016, "#7FA34A"),
  ];
}

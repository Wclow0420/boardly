// Seal the Manor's gallery: its furniture and the one thing that works it
// (marked prop). Built with the iso kit (components/iso) and the
// engraved furniture (components/iso/furniture.ts); see roomScenes.ts.
//
// The pieces exported here (ornateFrame and its paintings, brassSconce,
// marblePlinth, urn, bust, stanchion, velvetRope, vitrine, crown, bench,
// writingTable, openBook, quill) are generic and can move to
// furniture.ts when another room wants them.

import {
  GRAINED,
  INK,
  P,
  ball,
  box,
  cylinder,
  flame,
  flat,
  lightPool,
  line,
  n,
  paint,
  path,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "@/components/iso/kit";
import { flags, prop, shadow, shell, tint } from "@/components/iso/room";
import { BRASS, panel } from "@/components/iso/furniture";
import { curl } from "@/components/engraved/shapes";

// ── materials ───────────────────────────────────────────────────────

/** The house gold, brighter than the kit's GOLD: light, body, shadow. */
export const GILT = ["#FFF2B8", "#E2B04A", "#9A6B1E"];
/** Warm ink for gold and ivory. */
const WARM = "#3A2408";
export const MARBLE: Tones = ["#F4F0E6", "#D9D2C3", "#ABA291"];
export const VELVET: Tones = ["#B8384A", "#8E2433", "#5E1420"];
export const MAHOGANY: Tones = ["#8E4E34", "#6C3826", "#4A2418"];
export const PAGES: Tones = ["#FBF6E8", "#E9E2CF", "#CFC5AA"];
GRAINED.add(MAHOGANY);

// ── small helpers ───────────────────────────────────────────────────

/** A back wall: "x" is the left wall (x = 0), "y" the right (y = 0). */
export type Wall = "x" | "y";
/** A point on a back wall, `off` out from it; u runs along the wall. */
export const onWall = (wall: Wall, u: number, z: number, off = 0): V3 =>
  wall === "x" ? [off, u, z] : [u, off, z];
/** Which way along a wall the viewer's right is. */
const rightward = (wall: Wall) => (wall === "x" ? -1 : 1);

/** An outline filled with a gradient from `from` to `to`. */
export function gradPoly(pts: V3[], colors: string[], from: V3, to: V3, stroke: string | null = null, strokeWidth = 0.5): Shape {
  return {
    d: path(pts.map((p) => P(...p))),
    fill: colors[Math.floor(colors.length / 2)],
    grad: { colors, from: P(...from), to: P(...to) },
    ...(stroke ? { stroke, strokeWidth } : {}),
  };
}

/** Points round an ellipse in the drawing. */
const ring = (cx: number, cy: number, rx: number, ry: number, steps = 14, from = 0, to = Math.PI * 2): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });
const pathOf = (pts: Pt[], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join(" ") + (close ? " Z" : "");

/** A turned (round) body standing at (x, y, z): `profile` gives its
 *  radius at heights up it, bottom to top. Lit from the left. */
export function turned(x: number, y: number, z: number, profile: [number, number][], colors: string[], ink: string): Shape {
  const [cx] = P(x, y, z);
  const k = unit() * 1.2247;
  const left = profile.map(([h, r]) => [cx - r * k, P(x, y, z + h)[1]] as Pt);
  const right = profile.map(([h, r]) => [cx + r * k, P(x, y, z + h)[1]] as Pt).reverse();
  const top = P(x, y, z + profile[profile.length - 1][0]);
  const widest = Math.max(...profile.map(([, r]) => r)) * k;
  return {
    d: pathOf([...left, ...right]),
    fill: colors[1],
    grad: { colors, from: [cx - widest * 0.8, top[1]], to: [cx + widest, top[1]] },
    stroke: ink,
    strokeWidth: 0.5,
  };
}

// ── paintings ───────────────────────────────────────────────────────

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
const RECT: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** A moonlit valley: dusk sky, blue hills, a lake, a dark tree. */
export const landscape: Canvas = (at, w, h) => [
  patch(at, RECT, "#3A4A82", { colors: ["#1C2656", "#46568E", "#E9A97A"], from: [0.5, 1], to: [0.5, 0.36] }),
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
  patch(at, RECT, "#24306A", { colors: ["#121A44", "#2A3A78", "#6A6AA0"], from: [0.5, 1], to: [0.5, 0.3] }),
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
    patch(at, RECT, "#E9A060", { colors: ["#5A4A8A", "#C87A6A", "#F6C878"], from: [0.5, 1], to: [0.5, 0.25] }),
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
export const stillLife = (ground = "#22382E"): Canvas => (at, w, h) => [
  patch(at, RECT, ground, { colors: [tone(ground, 0.25), ground, tone(ground, -0.5)], from: [0.2, 0.9], to: [0.8, 0.1] }),
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
export const seascape: Canvas = (at, w, h) => [
  patch(at, RECT, "#2A3A6E", { colors: ["#141E46", "#2A3A6E", "#5A6A9E"], from: [0.5, 1], to: [0.5, 0.4] }),
  patch(at, blob(0.24, 0.76, 0.035 / w, 0.035 / h), "#FFF2C8"),
  patch(at, [[0, 0.4], [1, 0.4], [1, 0], [0, 0]], "#1E3A5E", { colors: ["#4A6A9A", "#1E3A5E", "#0E1A30"], from: [0.5, 0.4], to: [0.5, 0] }),
  patch(at, [[0.2, 0.38], [0.28, 0.38], [0.32, 0.06], [0.16, 0.06]], "#E9E2CF", { colors: ["#FFF6D8", "#C8C0A8"], from: [0.24, 0.38], to: [0.24, 0.06] }),
  patch(at, [[0.5, 0.36], [0.86, 0.36], [0.8, 0.28], [0.56, 0.28]], "#3A2418"),
  patch(at, [[0.6, 0.38], [0.66, 0.38], [0.66, 0.78], [0.6, 0.72]], "#F4EEDF", { colors: ["#FFFFFF", "#D8CCB0"], from: [0.6, 0.78], to: [0.66, 0.4] }),
  patch(at, [[0.69, 0.38], [0.79, 0.38], [0.71, 0.7], [0.69, 0.7]], "#F4EEDF", { colors: ["#FFFFFF", "#D8CCB0"], from: [0.69, 0.7], to: [0.79, 0.4] }),
  patch(at, [[0.52, 0.4], [0.62, 0.4], [0.62, 0.6]], "#E9E2CF"),
];

// ── frames and wall pieces ──────────────────────────────────────────

/** An ornate gilt frame on a back wall, from u1 to u2 along it and z1 to
 *  z2 up: its shadow, an outer moulding lit from the upper left, a bead,
 *  a sunk lip, rosettes at the corners, a shell crest with scrolls (if
 *  `crest`), and the picture `canvas` paints inside. */
export function ornateFrame(wall: Wall, u1: number, u2: number, z1: number, z2: number, canvas?: Canvas, { crest = true, width = 0.028 } = {}): Shape[] {
  const r = rightward(wall);
  const W = u2 - u1;
  const H = z2 - z1;
  const uL = r > 0 ? u1 : u2;
  const at = (s: number, t: number, off: number, inset = 0): V3 =>
    onWall(wall, uL + r * (inset + s * (W - 2 * inset)), z1 + inset + t * (H - 2 * inset), off);
  const rect = (off: number, inset: number) => [at(0, 0, off, inset), at(1, 0, off, inset), at(1, 1, off, inset), at(0, 1, off, inset)];
  const inner = width * 0.62;
  const shapes: Shape[] = [
    // its shadow on the wall, down and to the right
    {
      d: path([0, 1, 2, 3].map((i) => {
        const [s, t] = RECT[i];
        return P(...onWall(wall, uL + r * (s * W + 0.012), z1 + t * H - 0.016, 0.001));
      })),
      fill: INK.night,
      opacity: 0.4,
    },
    gradPoly(rect(0.008, 0), GILT, at(0, 1, 0.008), at(1, 0, 0.008), WARM, 0.55),
    { d: path(rect(0.008, 0.009).map((p) => P(...p))), stroke: GILT[0], strokeWidth: 0.4, opacity: 0.75 },
    gradPoly(rect(0.008, inner), [GILT[2], GILT[1], GILT[0]], at(0, 1, 0.008, inner), at(1, 0, 0.008, inner), WARM, 0.4),
  ];
  if (canvas) {
    const cw = W - 2 * width;
    const ch = H - 2 * width;
    shapes.push(...canvas((s, t) => at(s, t, 0.006, width), cw, ch));
    // the frame's shadow over the top of the picture
    shapes.push({ ...gradPoly([at(0, 0.9, 0.006, width), at(1, 0.9, 0.006, width), at(1, 1, 0.006, width), at(0, 1, 0.006, width)], ["#000000", "#000000"], at(0, 1, 0, width), at(0, 0.9, 0, width)), opacity: 0.3 });
    shapes.push({ d: path(rect(0.008, width).map((p) => P(...p))), stroke: WARM, strokeWidth: 0.45 });
  }
  // rosettes at the corners
  for (const [s, t] of RECT) {
    const p = at(s, t, 0.01, width * 0.42);
    shapes.push(ball(p, 0.72, GILT[1], WARM), ball(p, 0.22, GILT[2]));
  }
  // a line of light along the top and left
  shapes.push({ ...line([at(0, 0.04, 0.008, 0.004), at(0, 1, 0.008, 0.004), at(0.96, 1, 0.008, 0.004)], "#FFFFFF", 0.55), opacity: 0.6 });
  if (crest) {
    // a shell over the top rail, with a scroll to each side
    const [cx, cy] = P(...at(0.5, 1, 0.01));
    const sr = Math.min(0.04, W * 0.14) * unit();
    for (const side of [-1, 1]) {
      const c = curl(cx + side * sr * 0.7, cy - sr * 0.15, side > 0 ? -0.15 : Math.PI + 0.15, sr * 2.1, side * 2.6, sr * 0.42);
      shapes.push({ d: c.outline, fill: GILT[1], grad: { colors: GILT, from: [cx, cy - sr], to: [cx, cy + sr * 0.4] }, stroke: WARM, strokeWidth: 0.4 });
    }
    const fan = ring(cx, cy, sr, sr * 1.05, 8, Math.PI, Math.PI * 2);
    shapes.push({
      d: pathOf(fan),
      fill: GILT[1],
      grad: { colors: GILT, from: [cx - sr * 0.4, cy - sr], to: [cx + sr * 0.6, cy] },
      stroke: WARM,
      strokeWidth: 0.45,
    });
    shapes.push({
      d: [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => {
        const a = Math.PI + Math.PI * f;
        return `M${n(cx)} ${n(cy)} L${n(cx + Math.cos(a) * sr * 0.86)} ${n(cy + Math.sin(a) * sr * 0.9)}`;
      }).join(" "),
      stroke: GILT[2],
      strokeWidth: 0.4,
    });
    shapes.push(ball(at(0.5, 1, 0.012), 0.5, GILT[0], WARM));
  }
  return shapes;
}

/** A candle sconce on a back wall at u, z: a gilt back plate, a curved
 *  arm out from the wall, a drip pan, the candle and its flame. */
export function brassSconce(wall: Wall, u: number, z: number, accent: string): Shape[] {
  const out = 0.05;
  const [px, py] = P(...onWall(wall, u, z + 0.02, 0.002));
  const [x, y] = wall === "x" ? [out, u] : [u, out];
  const pr = 0.022 * unit();
  return [
    {
      d: pathOf(ring(px, py, pr * 0.62, pr * 1.15, 12)),
      fill: GILT[1],
      grad: { colors: GILT, from: [px - pr * 0.4, py - pr], to: [px + pr * 0.4, py + pr] },
      stroke: WARM,
      strokeWidth: 0.45,
    },
    {
      ...line([onWall(wall, u, z + 0.035, 0), onWall(wall, u, z - 0.01, out * 0.5), [x, y, z]], GILT[2], 1.4),
    },
    { ...line([onWall(wall, u, z + 0.035, 0), onWall(wall, u, z - 0.01, out * 0.5), [x, y, z]], GILT[0], 0.5), opacity: 0.8 },
    ...cylinder(x, y, z, 0.017, 0.008, [GILT[0], GILT[1], GILT[2]]),
    ...box(x - 0.008, y - 0.008, z + 0.008, 0.016, 0.016, 0.04, [PAGES[0], PAGES[1], PAGES[2]]),
    ...flame([x, y, z + 0.048], 1.8, accent),
  ];
}

// ── sculpture ───────────────────────────────────────────────────────

/** A marble plinth: a moulded foot, a shaft with sunk panels and a vein
 *  or two, a gilt fillet and a moulded cap. Its top is at h. */
export function marblePlinth(x: number, y: number, w: number, d: number, h: number, tones: Tones = MARBLE): Shape[] {
  const X = x + w;
  const Y = y + d;
  const darker = tones.map((c) => tone(c, -0.08)) as Tones;
  const vein = tone(tones[2], -0.25);
  return [
    shadow(x - 0.01, y - 0.01, w + 0.02, d + 0.02),
    ...box(x - 0.014, y - 0.014, 0, w + 0.028, d + 0.028, 0.035, darker),
    ...box(x, y, 0.035, w, d, h - 0.07, tones),
    ...panel("lit", Y, x + 0.016, X - 0.016, 0.06, h - 0.06, tones[1]),
    ...panel("shade", X, y + 0.016, Y - 0.016, 0.06, h - 0.06, tones[2]),
    { ...line([[x + w * 0.2, Y, h * 0.7], [x + w * 0.45, Y, h * 0.55], [x + w * 0.4, Y, h * 0.32], [x + w * 0.7, Y, h * 0.15]], vein, 0.35), opacity: 0.55 },
    { ...line([[X, y + d * 0.3, h * 0.6], [X, y + d * 0.6, h * 0.42], [X, y + d * 0.5, h * 0.2]], vein, 0.35), opacity: 0.45 },
    ...box(x - 0.006, y - 0.006, h - 0.035, w + 0.012, d + 0.012, 0.008, [GILT[0], GILT[1], GILT[2]]),
    ...box(x - 0.016, y - 0.016, h - 0.027, w + 0.032, d + 0.032, 0.027, darker),
  ];
}

/** A Greek urn standing at (x, y, z), `h` tall: terracotta with a black
 *  band, a dark mouth and two looping handles. */
export function urn(x: number, y: number, z: number, h: number, body: string[] = ["#F0A070", "#C2643A", "#6A2E14"]): Shape[] {
  const k = unit() * 1.2247;
  const s = h / 0.16;
  const prof: [number, number][] = [
    [0, 0.03], [0.012, 0.03], [0.02, 0.014], [0.035, 0.02], [0.06, 0.046], [0.085, 0.05], [0.11, 0.04],
    [0.128, 0.022], [0.142, 0.018], [0.152, 0.03], [0.16, 0.032],
  ].map(([a, b]) => [a * s, b * s]);
  const [cx] = P(x, y, z);
  const yAt = (hz: number) => P(x, y, z + hz)[1];
  const band = (h1: number, h2: number, r1: number, r2: number): Shape => ({
    d: `M${n(cx - r1 * k)} ${n(yAt(h1))} A${n(r1 * k)} ${n(r1 * k * 0.5)} 0 0 0 ${n(cx + r1 * k)} ${n(yAt(h1))} L${n(cx + r2 * k)} ${n(yAt(h2))} A${n(r2 * k)} ${n(r2 * k * 0.5)} 0 0 1 ${n(cx - r2 * k)} ${n(yAt(h2))} Z`,
    fill: "#1E140E",
    grad: { colors: ["#4A3A2E", "#1E140E", "#0A0604"], from: [cx - r1 * k, yAt(h2)], to: [cx + r1 * k, yAt(h2)] },
  });
  const handle = (side: number): Shape => ({
    d: `M${n(cx + side * 0.03 * s * k)} ${n(yAt(0.128 * s))} C${n(cx + side * 0.075 * s * k)} ${n(yAt(0.15 * s))} ${n(cx + side * 0.08 * s * k)} ${n(yAt(0.1 * s))} ${n(cx + side * 0.045 * s * k)} ${n(yAt(0.088 * s))}`,
    stroke: side < 0 ? body[1] : body[2],
    strokeWidth: 1.3,
  });
  const mouth = 0.032 * s * k;
  return [
    handle(1),
    turned(x, y, z, prof, body, tone(body[2], -0.5)),
    band(0.055 * s, 0.09 * s, 0.045 * s, 0.049 * s),
    // a zigzag round the band
    {
      d: `M${n(cx - 0.04 * s * k)} ${n(yAt(0.073 * s))} ${Array.from({ length: 8 }, (_, i) => `l${n(0.01 * s * k)} ${n((i % 2 ? 1 : -1) * 0.009 * s * unit())}`).join(" ")}`,
      stroke: body[0],
      strokeWidth: 0.4,
    },
    handle(-1),
    { d: pathOf(ring(cx, yAt(0.16 * s), mouth, mouth * 0.42, 14)), fill: "#1A0C06", stroke: tone(body[2], -0.4), strokeWidth: 0.45 },
    { d: `M${n(cx - mouth * 0.9)} ${n(yAt(0.16 * s))} A${n(mouth * 0.9)} ${n(mouth * 0.38)} 0 0 0 ${n(cx + mouth * 0.9)} ${n(yAt(0.16 * s))}`, stroke: body[0], strokeWidth: 0.5, opacity: 0.7 },
    { d: `M${n(cx - 0.03 * s * k)} ${n(yAt(0.1 * s))} L${n(cx - 0.034 * s * k)} ${n(yAt(0.065 * s))}`, stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.45 },
  ];
}

/** A marble bust on a round socle, standing at (x, y, z), `h` tall: a
 *  chest cut in a curve with a drape over one shoulder, the neck, and a
 *  head with curled hair bound up behind (a classical marble, no
 *  features cut). */
export function bust(x: number, y: number, z: number, h: number, tones: Tones = MARBLE): Shape[] {
  const [cx, by] = P(x, y, z);
  const u = (h / 0.17) * unit();
  const ink = tone(tones[2], -0.55);
  const colors = [tones[0], tones[1], tones[2]];
  const at = (dx: number, dz: number): Pt => [cx + dx * u, by - dz * u];
  const pts = (list: [number, number][]) => list.map(([dx, dz]) => at(dx, dz));
  const fill = (d: string, from: Pt, to: Pt, c = colors): Shape => ({ d, fill: c[1], grad: { colors: c, from, to }, stroke: ink, strokeWidth: 0.45 });
  const [hx, hy] = at(0, 0.132);
  const rx = 0.025 * u;
  const ry = 0.031 * u;
  const hair = [tone(tones[1], -0.06), tone(tones[2], -0.04), tone(tones[2], -0.2)];
  return [
    turned(x, y, z, ([[0, 0.03], [0.01, 0.03], [0.016, 0.017], [0.026, 0.014], [0.032, 0.024], [0.036, 0.024]] as [number, number][]).map(([a, b]) => [(a * h) / 0.17, (b * h) / 0.17]), colors, ink),
    // the chest, cut away in a curve below
    fill(
      `M${pathOf(pts([[-0.05, 0.036], [-0.062, 0.062], [-0.06, 0.082], [-0.046, 0.092], [-0.016, 0.1], [0.016, 0.1], [0.046, 0.092], [0.06, 0.082], [0.062, 0.062], [0.05, 0.036]]), false).slice(1)} Q${n(at(0, 0.052)[0])} ${n(at(0, 0.052)[1])} ${n(at(-0.05, 0.036)[0])} ${n(at(-0.05, 0.036)[1])} Z`,
      at(-0.05, 0.1),
      at(0.06, 0.04),
    ),
    // a drape over the left shoulder, falling across the chest
    fill(pathOf(pts([[-0.06, 0.082], [-0.046, 0.092], [-0.02, 0.098], [0.018, 0.07], [0.05, 0.036], [0.026, 0.044], [-0.05, 0.036], [-0.062, 0.062]])), at(-0.05, 0.09), at(0.04, 0.04)),
    {
      d: [[[-0.05, 0.075], [-0.02, 0.07], [0.012, 0.058]], [[-0.054, 0.058], [-0.02, 0.052], [0.02, 0.046]], [[-0.04, 0.088], [-0.01, 0.082]]]
        .map((l) => pathOf(pts(l as [number, number][]), false))
        .join(" "),
      stroke: ink,
      strokeWidth: 0.35,
      opacity: 0.55,
    },
    fill(pathOf(pts([[-0.012, 0.096], [-0.013, 0.118], [0.013, 0.118], [0.012, 0.096]])), at(-0.012, 0.12), at(0.013, 0.096)),
    { d: pathOf(pts([[-0.012, 0.1], [0, 0.094], [0.012, 0.1]]), false), stroke: ink, strokeWidth: 0.35, opacity: 0.5 },
    fill(pathOf(ring(hx, hy, rx, ry, 18)), [hx - rx * 0.6, hy - ry * 0.7], [hx + rx, hy + ry]),
    // curled hair over the crown, gathered in a knot behind
    fill(pathOf(ring(hx + rx * 0.75, hy - ry * 0.55, rx * 0.42, rx * 0.42, 10)), [hx + rx * 0.5, hy - ry], [hx + rx, hy - ry * 0.3], hair),
    fill(
      pathOf([
        ...ring(hx, hy, rx * 1.06, ry * 1.04, 12, Math.PI * 0.94, Math.PI * 2.06),
        [hx + rx * 0.82, hy - ry * 0.05],
        [hx + rx * 0.5, hy - ry * 0.32],
        [hx + rx * 0.2, hy - ry * 0.22],
        [hx - rx * 0.15, hy - ry * 0.38],
        [hx - rx * 0.5, hy - ry * 0.24],
        [hx - rx * 0.86, hy - ry * 0.02],
      ]),
      [hx - rx, hy - ry],
      [hx + rx, hy],
      hair,
    ),
    {
      d: [-0.5, -0.05, 0.4].map((f) => `M${n(hx + f * rx)} ${n(hy - ry * 0.95)} q${n(rx * 0.25)} ${n(ry * 0.25)} ${n(rx * 0.05)} ${n(ry * 0.55)}`).join(" "),
      stroke: ink,
      strokeWidth: 0.35,
      opacity: 0.5,
    },
    { d: `M${n(hx - rx * 0.7)} ${n(hy - ry * 0.45)} Q${n(hx - rx * 0.55)} ${n(hy - ry * 0.95)} ${n(hx + rx * 0.05)} ${n(hy - ry * 1.0)}`, stroke: "#FFFFFF", strokeWidth: 0.55, opacity: 0.65 },
    { d: `M${n(at(-0.055, 0.07)[0])} ${n(at(-0.055, 0.07)[1])} Q${n(at(-0.052, 0.088)[0])} ${n(at(-0.052, 0.088)[1])} ${n(at(-0.03, 0.095)[0])} ${n(at(-0.03, 0.095)[1])}`, stroke: "#FFFFFF", strokeWidth: 0.55, opacity: 0.6 },
  ];
}

// ── the rope line ───────────────────────────────────────────────────

/** A brass stanchion standing at (x, y), `h` tall: a stepped round
 *  foot, a slim post with a collar, and a ball finial. */
export function stanchion(x: number, y: number, h: number): Shape[] {
  return [
    { ...shadow(x - 0.03, y - 0.02, 0.04, 0.03) },
    ...cylinder(x, y, 0, 0.028, 0.01, BRASS),
    ...cylinder(x, y, 0.01, 0.018, 0.012, BRASS),
    ...cylinder(x, y, 0.022, 0.0065, h - 0.04, BRASS),
    ...cylinder(x, y, h - 0.05, 0.011, 0.012, BRASS),
    ball([x, y, h - 0.012], 1.15, BRASS[1], BRASS[2]),
    { ...ball([x - 0.004, y, h - 0.006], 0.38, "#FFFFFF"), opacity: 0.7 },
  ];
}

/** A velvet rope from one world point to another, hanging `sag` low in
 *  the middle: deep crimson with a sheen, brass hooks at the ends. */
export function velvetRope(a: V3, b: V3, sag: number): Shape[] {
  const pts: V3[] = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)];
  });
  return [
    line(pts, "#4A0A14", 2.2),
    line(pts, VELVET[0], 1.4),
    { ...line(pts.map(([x, y, z]) => [x, y, z + 0.004] as V3), "#FF9AA6", 0.45), opacity: 0.55 },
    ball(a, 0.55, BRASS[1], BRASS[2]),
    ball(b, 0.55, BRASS[1], BRASS[2]),
  ];
}

// ── furniture ───────────────────────────────────────────────────────

/** A glass display case on a stand: tapered legs, an apron with a gilt
 *  bead, a moulded base, what `inside` draws, then the glass over it
 *  (tinted, with brass edges and a glare). */
export function vitrine(x: number, y: number, w: number, d: number, standH: number, glassH: number, inside: () => Shape[], tones: Tones = MAHOGANY): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.022;
  const g0 = standH + 0.02;
  const g1 = g0 + glassH;
  const e = 0.004;
  const glass = (pts: V3[], opacity: number, from: V3, to: V3): Shape => ({
    d: path(pts.map((p) => P(...p))),
    fill: INK.glass,
    grad: { colors: ["#D8E6FF", INK.glass, "#5A7AC0"], from: P(...from), to: P(...to) },
    opacity,
  });
  return [
    shadow(x, y, w, d),
    ...box(x + 0.012, y + 0.012, 0, leg, leg, standH - 0.04, tones),
    ...box(X - 0.012 - leg, y + 0.012, 0, leg, leg, standH - 0.04, tones),
    ...box(x + 0.012, Y - 0.012 - leg, 0, leg, leg, standH - 0.04, tones),
    ...box(X - 0.012 - leg, Y - 0.012 - leg, 0, leg, leg, standH - 0.04, tones),
    ...[[x + 0.012, Y - 0.012 - leg], [X - 0.012 - leg, Y - 0.012 - leg], [X - 0.012 - leg, y + 0.012]].flatMap(([lx, ly]) =>
      box(lx - 0.002, ly - 0.002, 0, leg + 0.004, leg + 0.004, 0.014, [GILT[0], GILT[1], GILT[2]]),
    ),
    ...box(x, y, standH - 0.04, w, d, 0.04, tones),
    ...panel("lit", Y, x + 0.02, X - 0.02, standH - 0.032, standH - 0.008, tones[1]),
    ball([(x + X) / 2, Y, standH - 0.02], 0.6, BRASS[1], BRASS[2]),
    { ...line([[x, Y, standH - 0.038], [X, Y, standH - 0.038], [X, y, standH - 0.038]], GILT[1], 0.7) },
    ...box(x - 0.008, y - 0.008, standH, w + 0.016, d + 0.016, 0.02, tones),
    { ...line([[x - 0.008, Y + 0.008, standH + 0.02], [X + 0.008, Y + 0.008, standH + 0.02], [X + 0.008, y - 0.008, standH + 0.02]], GILT[0], 0.6), opacity: 0.9 },
    // the far edges of the glass, seen through it
    { ...line([[x + e, y + e, g0], [x + e, y + e, g1], [X - e, y + e, g1]], BRASS[1], 0.5), opacity: 0.6 },
    { ...line([[x + e, y + e, g1], [x + e, Y - e, g1]], BRASS[1], 0.5), opacity: 0.6 },
    ...inside(),
    glass([[X - e, y + e, g0], [X - e, Y - e, g0], [X - e, Y - e, g1], [X - e, y + e, g1]], 0.2, [X, y, g1], [X, Y, g0]),
    glass([[x + e, Y - e, g0], [X - e, Y - e, g0], [X - e, Y - e, g1], [x + e, Y - e, g1]], 0.16, [x, Y, g1], [X, Y, g0]),
    glass([[x + e, y + e, g1], [X - e, y + e, g1], [X - e, Y - e, g1], [x + e, Y - e, g1]], 0.28, [x, y, g1], [X, Y, g1]),
    // glare across the front pane
    { ...line([[x + w * 0.2, Y - e, g0 + glassH * 0.25], [x + w * 0.42, Y - e, g1 - glassH * 0.08]], "#FFFFFF", 0.9), opacity: 0.45 },
    { ...line([[x + w * 0.3, Y - e, g0 + glassH * 0.15], [x + w * 0.46, Y - e, g0 + glassH * 0.62]], "#FFFFFF", 0.5), opacity: 0.35 },
    // brass edges
    line([[x + e, Y - e, g0], [x + e, Y - e, g1], [X - e, Y - e, g1], [X - e, y + e, g1], [x + e, y + e, g1], [x + e, Y - e, g1]], BRASS[1], 0.6),
    line([[X - e, Y - e, g0], [X - e, Y - e, g1]], BRASS[1], 0.6),
    line([[X - e, y + e, g0], [X - e, y + e, g1]], BRASS[2], 0.6),
    ...[[x + e, Y - e], [X - e, Y - e], [X - e, y + e], [x + e, y + e]].map(([px, py]) => ball([px, py, g1 + 0.004], 0.38, BRASS[1], BRASS[2])),
  ];
}

/** A jewelled crown on a velvet cushion, centred at (x, y) on a surface
 *  at z, `r` round: a velvet cap under an orb and cross, five pearl-tipped
 *  points, a gold band set with a ruby between two sapphires. Drawn
 *  facing the viewer, like an emblem, so it reads when small. */
export function crown(x: number, y: number, z: number, r = 0.036): Shape[] {
  const cushion = 0.024;
  const [cx, cy] = P(x, y, z + cushion + 0.002);
  const w = r * unit() * 1.2247;
  const ry = w * 0.5;
  const bandH = w * 0.5;
  const top = cy - bandH;
  const gold = (d: string, from: Pt, to: Pt, colors = GILT): Shape => ({ d, fill: GILT[1], grad: { colors, from, to }, stroke: WARM, strokeWidth: 0.4 });
  const gem = (gx: number, gy: number, size: number, c: readonly string[]): Shape[] => [
    { d: pathOf(ring(gx, gy, size, size, 10)), fill: c[1], grad: { colors: [...c], from: [gx - size * 0.4, gy - size * 0.5], radius: size * 1.6 }, stroke: c[2], strokeWidth: 0.35 },
    { d: pathOf(ring(gx - size * 0.35, gy - size * 0.35, size * 0.28, size * 0.28, 6)), fill: "#FFFFFF", opacity: 0.85 },
  ];
  const points = [-1, -0.5, 0, 0.5, 1].flatMap((s): Shape[] => {
    const px = cx + s * w * 0.9;
    const base = top + ry * Math.sqrt(1 - Math.min(1, s * s) * 0.8);
    const tip = base - w * (s === 0 ? 0.95 : 0.75);
    const half = w * 0.2;
    return [
      gold(`M${n(px - half)} ${n(base)} L${n(px)} ${n(tip)} L${n(px + half)} ${n(base)} Z`, [px - half, tip], [px + half, base]),
      { d: pathOf(ring(px, tip, w * 0.1, w * 0.1, 8)), fill: "#FFFFFF", grad: { colors: ["#FFFFFF", "#F4EEDF", "#B8AC90"], from: [px - w * 0.04, tip - w * 0.05], radius: w * 0.16 }, stroke: "#8C7A58", strokeWidth: 0.3 },
    ];
  });
  return [
    // the cushion, with gold tassels at its corners
    ...box(x - 0.05, y - 0.045, z, 0.1, 0.09, cushion, VELVET),
    { ...line([[x - 0.05, y + 0.045, z + cushion], [x + 0.05, y + 0.045, z + cushion], [x + 0.05, y - 0.045, z + cushion]], GILT[1], 0.5) },
    ...[[x + 0.05, y + 0.045], [x - 0.05, y + 0.045], [x + 0.05, y - 0.045]].map(([tx, ty]) => ball([tx, ty, z + cushion * 0.4], 0.45, GILT[1], WARM)),
    // the velvet cap, and the orb and cross over it
    {
      d: `M${n(cx - w * 0.88)} ${n(top)} A${n(w * 0.88)} ${n(w * 1.05)} 0 0 1 ${n(cx + w * 0.88)} ${n(top)} Z`,
      fill: VELVET[0],
      grad: { colors: ["#E86A7A", VELVET[0], VELVET[2]], from: [cx - w * 0.3, top - w * 0.8], radius: w * 1.4 },
      stroke: VELVET[2],
      strokeWidth: 0.4,
    },
    gold(`M${n(cx - w * 0.06)} ${n(top - w * 1.0)} L${n(cx - w * 0.06)} ${n(top - w * 0.5)} L${n(cx + w * 0.06)} ${n(top - w * 0.5)} L${n(cx + w * 0.06)} ${n(top - w * 1.0)} Z`, [cx, top - w], [cx, top - w * 0.5]),
    gold(pathOf(ring(cx, top - w * 1.1, w * 0.17, w * 0.17, 10)), [cx - w * 0.1, top - w * 1.2], [cx + w * 0.15, top - w]),
    gold(`M${n(cx - w * 0.04)} ${n(top - w * 1.5)} h${n(w * 0.08)} v${n(w * 0.1)} h${n(w * 0.1)} v${n(w * 0.08)} h${n(-w * 0.1)} v${n(w * 0.12)} h${n(-w * 0.08)} v${n(-w * 0.12)} h${n(-w * 0.1)} v${n(-w * 0.08)} h${n(w * 0.1)} Z`, [cx, top - w * 1.5], [cx, top - w * 1.2]),
    // the far rim of the band, seen inside
    { d: `M${n(cx - w)} ${n(top)} A${n(w)} ${n(ry)} 0 0 1 ${n(cx + w)} ${n(top)}`, stroke: GILT[2], strokeWidth: 0.8 },
    ...points,
    gold(
      `M${n(cx - w)} ${n(top)} L${n(cx - w)} ${n(cy)} A${n(w)} ${n(ry)} 0 0 0 ${n(cx + w)} ${n(cy)} L${n(cx + w)} ${n(top)} A${n(w)} ${n(ry)} 0 0 1 ${n(cx - w)} ${n(top)} Z`,
      [cx - w, top],
      [cx + w, top],
      ["#F6D88A", GILT[1], GILT[2]],
    ),
    { d: `M${n(cx - w * 0.9)} ${n(top + ry * 0.75)} A${n(w)} ${n(ry)} 0 0 0 ${n(cx + w * 0.2)} ${n(top + ry * 1.05)}`, stroke: "#FFFFFF", strokeWidth: 0.5, opacity: 0.6 },
    ...gem(cx, cy - bandH * 0.45 + ry, w * 0.2, ["#FF9AA6", "#D0102E", "#5A0410"]),
    ...gem(cx - w * 0.6, cy - bandH * 0.45 + ry * 0.78, w * 0.13, ["#D8EEFF", "#2E7AE0", "#0A2A6A"]),
    ...gem(cx + w * 0.6, cy - bandH * 0.45 + ry * 0.78, w * 0.13, ["#D8EEFF", "#2E7AE0", "#0A2A6A"]),
  ];
}

/** A long gallery bench along y: turned legs with gilt feet, a moulded
 *  frame and a velvet cushion with piping, buttons and corner tassels. */
export function bench(x: number, y: number, w: number, d: number, h: number, tones: Tones = MAHOGANY, cushion: Tones = VELVET): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.022;
  const seat = h - 0.05;
  const legAt = (lx: number, ly: number) => [
    ...box(lx, ly, 0.014, leg, leg, seat - 0.014, tones),
    ...box(lx - 0.002, ly - 0.002, 0, leg + 0.004, leg + 0.004, 0.014, [GILT[0], GILT[1], GILT[2]]),
  ];
  const top = h + 0.012;
  return [
    shadow(x, y, w, d),
    ...legAt(x + 0.01, y + 0.01),
    ...legAt(X - 0.01 - leg, y + 0.01),
    // a stretcher between the near legs
    ...box(X - 0.01 - leg * 0.75, y + 0.03, 0.06, leg * 0.5, d - 0.06, 0.012, tones),
    ...legAt(x + 0.01, Y - 0.01 - leg),
    ...legAt(X - 0.01 - leg, Y - 0.01 - leg),
    ...box(x, y, seat, w, d, 0.034, tones),
    ...panel("shade", X, y + 0.025, Y - 0.025, seat + 0.006, seat + 0.026, tones[2]),
    line([[x, Y, seat + 0.002], [X, Y, seat + 0.002], [X, y, seat + 0.002]], GILT[1], 0.6),
    ...box(x + 0.004, y + 0.004, seat + 0.034, w - 0.008, d - 0.008, top - seat - 0.034, cushion),
    line([[x + 0.004, Y - 0.004, top], [X - 0.004, Y - 0.004, top], [X - 0.004, y + 0.004, top]], GILT[1], 0.6),
    // buttons down the middle, and the creases between them
    { ...line([[x + w / 2, y + 0.04, top], [x + w / 2, Y - 0.04, top]], cushion[2], 1.3), dash: "0.1 4.2" },
    { ...line([[x + w / 2 - 0.003, y + 0.04, top], [x + w / 2 - 0.003, Y - 0.04, top]], GILT[0], 0.7), dash: "0.1 4.2" },
    ...[[X - 0.004, Y - 0.004], [x + 0.004, Y - 0.004], [X - 0.004, y + 0.004]].flatMap(([tx, ty]) => [
      line([[tx, ty, top - 0.004], [tx, ty, top - 0.04]], GILT[1], 0.8),
      ball([tx, ty, top - 0.044], 0.5, GILT[1], WARM),
    ]),
  ];
}

/** A writing table: slim legs on brass toes, an apron with a drawer on
 *  its lit face, a moulded top with a gilt edge and a leather inset. */
export function writingTable(x: number, y: number, w: number, d: number, h: number, tones: Tones = MAHOGANY, leather = "#2F5A45"): Shape[] {
  const X = x + w;
  const Y = y + d;
  const leg = 0.026;
  const apron = 0.055;
  const slab = 0.02;
  const legAt = (lx: number, ly: number) => [
    ...box(lx, ly, 0.012, leg, leg, h - slab - 0.012, tones),
    ...box(lx - 0.002, ly - 0.002, 0, leg + 0.004, leg + 0.004, 0.012, BRASS),
  ];
  return [
    shadow(x, y, w, d),
    ...legAt(x + 0.008, y + 0.008),
    ...legAt(X - 0.008 - leg, y + 0.008),
    ...legAt(x + 0.008, Y - 0.008 - leg),
    ...box(x, y, h - slab - apron, w, d, apron, tones),
    ...panel("lit", Y, x + 0.04, X - 0.04, h - slab - apron + 0.01, h - slab - 0.01, tones[1]),
    ball([(x + X) / 2, Y, h - slab - apron / 2], 0.7, BRASS[1], BRASS[2]),
    ...panel("shade", X, y + 0.03, Y - 0.03, h - slab - apron + 0.01, h - slab - 0.01, tones[2]),
    ...legAt(X - 0.008 - leg, Y - 0.008 - leg),
    ...box(x - 0.012, y - 0.012, h - slab, w + 0.024, d + 0.024, slab, tones),
    line([[x - 0.012, Y + 0.012, h - slab + 0.004], [X + 0.012, Y + 0.012, h - slab + 0.004], [X + 0.012, y - 0.012, h - slab + 0.004]], GILT[1], 0.55),
    gradPoly(
      [[x + 0.008, y + 0.008, h + 0.0005], [X - 0.008, y + 0.008, h + 0.0005], [X - 0.008, Y - 0.008, h + 0.0005], [x + 0.008, Y - 0.008, h + 0.0005]],
      [tone(leather, 0.2), leather, tone(leather, -0.25)],
      [x, y, h],
      [X, Y, h],
      tone(leather, -0.5),
      0.4,
    ),
    { d: path(([[x + 0.018, y + 0.018], [X - 0.018, y + 0.018], [X - 0.018, Y - 0.018], [x + 0.018, Y - 0.018]] as [number, number][]).map(([a, b]) => P(a, b, h + 0.001))), stroke: GILT[1], strokeWidth: 0.4, opacity: 0.8 },
  ];
}

/** A book lying open at z, its spine along y down the middle of x..x+w:
 *  leather boards, two blocks of pages, lines of writing and a ribbon. */
export function openBook(x: number, y: number, z: number, w: number, d: number, cover: Tones = VELVET, ribbon = "#C2203A"): Shape[] {
  const mid = x + w / 2;
  const top = z + 0.014;
  const writing = (u1: number, u2: number) =>
    [0.25, 0.4, 0.55, 0.7].map((f) =>
      line([[u1, y + d * f, top], [u2 - (f === 0.7 ? (u2 - u1) * 0.4 : 0), y + d * f, top]], "#8C7E66", 0.35),
    );
  return [
    ...box(x, y, z, w, d, 0.006, cover),
    ...box(x + 0.005, y + 0.005, z + 0.006, w / 2 - 0.006, d - 0.01, 0.008, PAGES),
    ...box(mid + 0.001, y + 0.005, z + 0.006, w / 2 - 0.006, d - 0.01, 0.008, PAGES),
    line([[mid, y + 0.005, top], [mid, y + d - 0.005, top]], "#A89A7A", 0.6),
    ...writing(x + 0.015, mid - 0.01),
    ...writing(mid + 0.01, x + w - 0.015),
    line([[mid + 0.004, y + d * 0.3, top], [mid + 0.008, y + d - 0.004, top], [mid + 0.01, y + d, z - 0.02]], ribbon, 0.9),
  ];
}

/** A quill standing in an inkwell whose mouth is at the drawing point
 *  (x, y): the nib, the shaft, and an engraved vane of ivory. It leans
 *  to the left (`dir` -1) or the right (1). */
export function quill(x: number, y: number, size = 1, dir = -1): Shape[] {
  const s = size;
  const tipX = x + dir * 6 * s;
  const tipY = y - 19 * s;
  const along = (t: number, side: number, wide: number): Pt => [
    x + (tipX - x) * t - dir * side * wide * 0.96,
    y + (tipY - y) * t + side * wide * 0.3,
  ];
  const vane: Pt[] = [along(0.22, 0, 0), along(0.4, -1, 2.6 * s), along(0.7, -1, 3.2 * s), along(0.95, -1, 1.6 * s), along(1, 0, 0), along(0.9, 1, 1.2 * s), along(0.6, 1, 1.6 * s), along(0.35, 1, 1 * s)];
  return [
    { d: `M${n(x - dir * 0.6)} ${n(y + 2.4)} L${n(x)} ${n(y)}`, stroke: "#1E1A16", strokeWidth: 0.9 },
    {
      d: pathOf(vane),
      fill: "#F4EEDF",
      grad: { colors: ["#FFFFFF", "#F4EEDF", "#C8BC9C"], from: along(0.7, -1, 3 * s), to: along(0.6, 1, 1.6 * s) },
      stroke: WARM,
      strokeWidth: 0.45,
    },
    {
      d: [0.45, 0.6, 0.75, 0.88].map((t) => {
        const [ax, ay] = along(t, 0, 0);
        const [bx, by] = along(t + 0.06, -1, 2.6 * s * (1 - Math.abs(t - 0.7)));
        return `M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`;
      }).join(" "),
      stroke: "#A08A60",
      strokeWidth: 0.35,
    },
    { d: `M${n(x)} ${n(y)} L${n(tipX)} ${n(tipY)}`, stroke: "#A08A60", strokeWidth: 0.55 },
  ];
}

// ── the room ────────────────────────────────────────────────────────

/** A checkered marble floor: every other square lighter. */
function checkerFloor(count = 8): Shape[] {
  const out: Shape[] = [];
  const s = 1 / count;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if ((i + j) % 2) continue;
      out.push(tint([[i * s, j * s, 0], [(i + 1) * s, j * s, 0], [(i + 1) * s, (j + 1) * s, 0], [i * s, (j + 1) * s, 0]], paint().tile, 0.75));
    }
  }
  return [...out, ...flags(count)];
}

/** A long runner on the floor from y1 to y2, x1..x2 across: a crimson
 *  field inside gilt lines on a dark border, fringed at the ends. */
export function runner(x1: number, x2: number, y1: number, y2: number, field = "#8E2433", border = "#2A1A3A"): Shape[] {
  const quad = (m: number): V3[] => [[x1 + m, y1, 0], [x2 - m, y1, 0], [x2 - m, y2, 0], [x1 + m, y2, 0]];
  return [
    { ...line([[x1 + 0.008, y2 + 0.01, 0], [x2 - 0.008, y2 + 0.01, 0]], PAGES[1], 1.8), dash: "0.3 1.1", opacity: 0.8 },
    gradPoly(quad(0), [tone(border, 0.2), border, tone(border, -0.3)], [x1, y1, 0], [x2, y2, 0], tone(border, -0.6), 0.5),
    gradPoly(quad(0.018), [tone(field, 0.2), field, tone(field, -0.3)], [x1, y1, 0], [x2, y2, 0], GILT[1], 0.55),
    { ...line([[(x1 + x2) / 2, y1 + 0.03, 0], [(x1 + x2) / 2, y2 - 0.03, 0]], GILT[1], 1.2), dash: "0.1 5", opacity: 0.9 },
  ];
}

export function gallery(accent: string): Shape[] {
  const [ix, iy] = P(0.69, 0.2, 0.25);
  const ropeZ = 0.15;
  return [
    ...shell(),
    ...checkerFloor(),
    // a runner from the door to the front
    ...runner(0.47, 0.61, 0.0, 0.97),
    // the long wall: a portrait, the great landscape, a still life
    ...ornateFrame("x", 0.07, 0.27, 0.36, 0.6, manor),
    ...brassSconce("x", 0.315, 0.42, accent),
    ...ornateFrame("x", 0.36, 0.72, 0.3, 0.64, landscape, { width: 0.032 }),
    ...brassSconce("x", 0.765, 0.42, accent),
    ...ornateFrame("x", 0.81, 0.95, 0.38, 0.58, ruin, { crest: false }),
    // the right wall: a small portrait, and a ship over the desk
    ...ornateFrame("y", 0.09, 0.27, 0.5, 0.67, stillLife("#4A2A3A"), { crest: false }),
    ...ornateFrame("y", 0.72, 0.95, 0.36, 0.62, seascape),
    // sculpture in the far corner: an urn, and a bust on a taller plinth
    ...marblePlinth(0.05, 0.05, 0.1, 0.1, 0.32),
    ...bust(0.1, 0.1, 0.32, 0.19),
    ...marblePlinth(0.2, 0.04, 0.08, 0.08, 0.16),
    ...urn(0.24, 0.08, 0.16, 0.15),
    // the rope keeping visitors off the long wall
    ...stanchion(0.17, 0.3, 0.19),
    ...velvetRope([0.17, 0.3, ropeZ + 0.02], [0.17, 0.57, ropeZ + 0.02], 0.05),
    ...stanchion(0.17, 0.57, 0.19),
    ...velvetRope([0.17, 0.57, ropeZ + 0.02], [0.17, 0.84, ropeZ + 0.02], 0.05),
    ...stanchion(0.17, 0.84, 0.19),
    // the crown in its case, and a bench to look at the pictures from
    ...vitrine(0.27, 0.29, 0.18, 0.15, 0.17, 0.11, () => [
      { ...flat(0.275, 0.445, 0.295, 0.435, 0.19, VELVET[1]), grad: { colors: [VELVET[0], VELVET[1], VELVET[2]], from: P(0.27, 0.29, 0.19), to: P(0.45, 0.44, 0.19) } },
      ...crown(0.335, 0.385, 0.19, 0.04),
    ]),
    ...bench(0.3, 0.54, 0.12, 0.3, 0.12),
    // the visitors' book on its table, the inkwell and the quill
    ...writingTable(0.66, 0.14, 0.28, 0.18, 0.22),
    ...openBook(0.74, 0.17, 0.221, 0.12, 0.11),
    ...box(0.665, 0.175, 0.221, 0.05, 0.05, 0.006, BRASS),
    ...cylinder(0.69, 0.2, 0.227, 0.017, 0.022, ["#3A4A7A", "#1E2A4E", "#0E1630"]),
    ...cylinder(0.69, 0.2, 0.249, 0.009, 0.004, BRASS),
    ...prop(() => quill(ix, iy)),
    ...cylinder(0.905, 0.28, 0.221, 0.02, 0.006, BRASS),
    ...cylinder(0.905, 0.28, 0.227, 0.006, 0.04, BRASS),
    ...cylinder(0.905, 0.28, 0.267, 0.013, 0.005, BRASS),
    ...box(0.893, 0.268, 0.272, 0.024, 0.024, 0.06, PAGES),
    ...flame([0.905, 0.28, 0.332], 2.2, accent),
    ...lightPool([0.8, 0.4, 0], 0.4),
  ];
}

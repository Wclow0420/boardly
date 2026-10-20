// Ornaments: frames, banners and mirrors for the walls, vases and
// flowers, urns, sculpture and the rope line round it, a crown, the
// things on a desk (books, a quill, an inkwell, a globe), drapes, a
// clock, a font, bells.

import {
  ball,
  box,
  cylinder,
  flat,
  GOLD,
  hoop,
  INK,
  inkOf,
  LEAF,
  line,
  n,
  P,
  path,
  poly,
  tone,
  unit,
  WOOD,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { disc, oval, shadow } from "../room";
import { curl } from "@/components/engraved/shapes";
import {
  BRASS,
  BRASS_SHEEN,
  BRONZE,
  CRIMSON,
  DEEP_VELVET,
  GILT,
  GILT_SHEEN,
  GILT_TONES,
  HEMP,
  IRONWORK,
  LIMESTONE,
  MAHOGANY,
  MARBLE,
  NIGHT_GLASS,
  OAK,
  PAGES,
  PALE_GILT,
  STATUARY_MARBLE,
  VELVET,
  WARM_INK,
  WARM_MAHOGANY,
} from "./materials";
import {
  ellipsePoints,
  filled,
  gradPoly,
  jewel,
  leafAt,
  onWall,
  panel,
  ringOn,
  roundel,
  shadowOf,
  wallPoint,
  type Wall,
} from "./helpers";
import { turned, turnedBody } from "./turned";
import { CANVAS_CORNERS, type Canvas } from "./paintings";

// ── frames and wall pieces ──────────────────────────────────────────

/** Which way along a wall the viewer's right is. */
const rightward = (wall: Wall) => (wall === "x" ? -1 : 1);

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
        const [s, t] = CANVAS_CORNERS[i];
        return P(...onWall(wall, uL + r * (s * W + 0.012), z1 + t * H - 0.016, 0.001));
      })),
      fill: INK.night,
      opacity: 0.4,
    },
    gradPoly(rect(0.008, 0), GILT, at(0, 1, 0.008), at(1, 0, 0.008), WARM_INK, 0.55),
    { d: path(rect(0.008, 0.009).map((p) => P(...p))), stroke: GILT[0], strokeWidth: 0.4, opacity: 0.75 },
    gradPoly(rect(0.008, inner), [GILT[2], GILT[1], GILT[0]], at(0, 1, 0.008, inner), at(1, 0, 0.008, inner), WARM_INK, 0.4),
  ];
  if (canvas) {
    const cw = W - 2 * width;
    const ch = H - 2 * width;
    shapes.push(...canvas((s, t) => at(s, t, 0.006, width), cw, ch));
    // the frame's shadow over the top of the picture
    shapes.push({ ...gradPoly([at(0, 0.9, 0.006, width), at(1, 0.9, 0.006, width), at(1, 1, 0.006, width), at(0, 1, 0.006, width)], ["#000000", "#000000"], at(0, 1, 0, width), at(0, 0.9, 0, width)), opacity: 0.3 });
    shapes.push({ d: path(rect(0.008, width).map((p) => P(...p))), stroke: WARM_INK, strokeWidth: 0.45 });
  }
  // rosettes at the corners
  for (const [s, t] of CANVAS_CORNERS) {
    const p = at(s, t, 0.01, width * 0.42);
    shapes.push(ball(p, 0.72, GILT[1], WARM_INK), ball(p, 0.22, GILT[2]));
  }
  // a line of light along the top and left
  shapes.push({ ...line([at(0, 0.04, 0.008, 0.004), at(0, 1, 0.008, 0.004), at(0.96, 1, 0.008, 0.004)], "#FFFFFF", 0.55), opacity: 0.6 });
  if (crest) {
    // a shell over the top rail, with a scroll to each side
    const [cx, cy] = P(...at(0.5, 1, 0.01));
    const sr = Math.min(0.04, W * 0.14) * unit();
    for (const side of [-1, 1]) {
      const c = curl(cx + side * sr * 0.7, cy - sr * 0.15, side > 0 ? -0.15 : Math.PI + 0.15, sr * 2.1, side * 2.6, sr * 0.42);
      shapes.push({ d: c.outline, fill: GILT[1], grad: { colors: GILT, from: [cx, cy - sr], to: [cx, cy + sr * 0.4] }, stroke: WARM_INK, strokeWidth: 0.4 });
    }
    const fan = ellipsePoints(cx, cy, sr, sr * 1.05, 8, Math.PI, Math.PI * 2);
    shapes.push({
      d: path(fan),
      fill: GILT[1],
      grad: { colors: GILT, from: [cx - sr * 0.4, cy - sr], to: [cx + sr * 0.6, cy] },
      stroke: WARM_INK,
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
    shapes.push(ball(at(0.5, 1, 0.012), 0.5, GILT[0], WARM_INK));
  }
  return shapes;
}

/** A gilt frame on a wall, u1..u2 along it and z1..z2 up: a moulded
 *  gilt border, a dark lip, a little crest on top, and what `canvas` (a
 *  wall painter from paintings.ts) paints inside it. */
export function giltFrame(
  wall: "x" | "y",
  u1: number,
  u2: number,
  z1: number,
  z2: number,
  canvas: (at: (u: number, z: number) => V3, u1: number, u2: number, z1: number, z2: number, wall: "x" | "y") => Shape[],
): Shape[] {
  const at = wallPoint(wall, 0.002);
  const f = 0.022;
  const mid = (u1 + u2) / 2;
  return [
    filled([at(u1, z1), at(u2, z1), at(u2, z2), at(u1, z2)], [GOLD[0], GOLD[1], GOLD[2]], at(u1, z2), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...line([at(u1 + 0.008, z1 + 0.008), at(u1 + 0.008, z2 - 0.008), at(u2 - 0.008, z2 - 0.008)], "#FFFFFF", 0.5), opacity: 0.6 },
    line([at(u1 + f * 0.55, z1 + f * 0.55), at(u2 - f * 0.55, z1 + f * 0.55), at(u2 - f * 0.55, z2 - f * 0.55), at(u1 + f * 0.55, z2 - f * 0.55), at(u1 + f * 0.55, z1 + f * 0.55)], GOLD[2], 0.5),
    ...canvas(wallPoint(wall, 0.003), u1 + f, u2 - f, z1 + f, z2 - f, wall),
    // the crest: a gilt shell over the top rail
    filled(
      ringOn(wall, at(mid, z2), 0.026, 10, 0, Math.PI),
      [GOLD[0], GOLD[1], GOLD[2]],
      at(mid - 0.02, z2 + 0.02),
      at(mid + 0.02, z2),
      GOLD[2],
    ),
    line([at(mid, z2), at(mid, z2 + 0.022)], GOLD[2], 0.45),
    line([at(mid, z2), at(mid - 0.017, z2 + 0.016)], GOLD[2], 0.45),
    line([at(mid, z2), at(mid + 0.017, z2 + 0.016)], GOLD[2], 0.45),
  ];
}

/** A mirror on a wall, u1..u2 along it from z1 up, its arch springing
 *  at `spring`: night glass under an arched gilt frame with a crest, and
 *  two gleams across it. */
export function mirror(wall: "x" | "y", u1: number, u2: number, z1: number, spring: number): Shape[] {
  const at = wallPoint(wall, 0.002);
  const mid = (u1 + u2) / 2;
  const r = (u2 - u1) / 2;
  const archOf = (inset: number): V3[] => [
    at(u1 + inset, z1 + inset),
    at(u2 - inset, z1 + inset),
    ...ringOn(wall, at(mid, spring), r - inset, 12, 0, Math.PI),
  ];
  const topZ = spring + r;
  return [
    filled(archOf(0), [GOLD[0], GOLD[1], GOLD[2]], at(u1, topZ), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...poly(archOf(0.012), GOLD[2]), fill: undefined, strokeWidth: 0.5 },
    filled(archOf(0.02), NIGHT_GLASS, at(u1, topZ), at(u2, z1), tone(GOLD[2], -0.4)),
    { ...line([at(u1 + 0.03, z1 + 0.08), at(u1 + 0.07, spring + 0.02)], "#FFFFFF", 1.4), opacity: 0.18 },
    { ...line([at(u1 + 0.045, z1 + 0.05), at(u1 + 0.1, spring + 0.04)], "#FFFFFF", 0.6), opacity: 0.25 },
    // a gilt crest of two leaves and a shell
    filled(ringOn(wall, at(mid, topZ - 0.004), 0.03, 10, 0, Math.PI), [GOLD[0], GOLD[1], GOLD[2]], at(mid - 0.02, topZ + 0.03), at(mid + 0.02, topZ), GOLD[2]),
    ...[-1, 1].map((s) => line([at(mid, topZ + 0.002), at(mid + s * 0.022, topZ + 0.024)], GOLD[2], 0.45)),
    ball(at(mid, topZ + 0.034), 0.7, GOLD[0], GOLD[2]),
  ];
}

/** A banner on a wall, u1..u2 along it, hung from a gilt rod at `top`
 *  on two cords: a swallowtail of `cloth` down to `bottom` with a gold
 *  border and fringe, and a gilt shield on it. */
export function banner(wall: "x" | "y", u1: number, u2: number, top: number, bottom: number, cloth: Tones = VELVET): Shape[] {
  const at = wallPoint(wall, 0.004);
  const mid = (u1 + u2) / 2;
  const notch = bottom + (top - bottom) * 0.16;
  const g = 0.014;
  const zs = top - 0.08;
  const sw = (u2 - u1) * 0.24;
  const shield: V3[] = [
    at(mid - sw, zs),
    at(mid + sw, zs),
    at(mid + sw, zs - sw * 1.2),
    at(mid + sw * 0.7, zs - sw * 1.8),
    at(mid, zs - sw * 2.3),
    at(mid - sw * 0.7, zs - sw * 1.8),
    at(mid - sw, zs - sw * 1.2),
  ];
  const cw = sw * 0.68;
  return [
    // cords from the hook to the rod's ends
    line([at(u1 + 0.01, top + 0.012), at(mid, top + 0.07), at(u2 - 0.01, top + 0.012)], GOLD[2], 0.6),
    ball(at(mid, top + 0.07), 0.6, GOLD[0], GOLD[2]),
    filled([at(u1, top), at(u2, top), at(u2, bottom), at(mid, notch), at(u1, bottom)], [tone(cloth[0], 0.12), cloth[1], cloth[2]], at(u1, top), at(u2, bottom)),
    // folds
    ...[0.3, 0.68].map((f): Shape => ({
      ...line([at(u1 + (u2 - u1) * f, top - 0.01), at(u1 + (u2 - u1) * f, bottom + 0.04)], cloth[2], 1.4),
      opacity: 0.45,
    })),
    line([at(u1 + g, top - 0.025), at(u2 - g, top - 0.025), at(u2 - g, bottom + g * 1.4), at(mid, notch + g * 1.3), at(u1 + g, bottom + g * 1.4), at(u1 + g, top - 0.025)], GOLD[1], 0.8),
    { ...line([at(u1 + 0.004, bottom - 0.01), at(mid, notch - 0.01), at(u2 - 0.004, bottom - 0.01)], GOLD[1], 1.8), dash: "0.1 1.7" },
    // the shield, a crimson chevron across it
    filled(shield, [GOLD[0], GOLD[1], GOLD[2]], at(mid - sw, zs), at(mid + sw, zs - sw * 2.3), GOLD[2]),
    filled(
      [at(mid - cw, zs - sw * 1.0), at(mid, zs - sw * 0.45), at(mid + cw, zs - sw * 1.0), at(mid + cw, zs - sw * 1.38), at(mid, zs - sw * 0.85), at(mid - cw, zs - sw * 1.38)],
      [tone(cloth[0], 0.1), cloth[1], cloth[2]],
      at(mid - cw, zs),
      at(mid + cw, zs - sw),
    ),
    { ...line([at(mid - sw * 0.85, zs - 0.006), at(mid - sw * 0.85, zs - sw * 1.15)], "#FFFFFF", 0.5), opacity: 0.55 },
    // the rod and its finials
    line([at(u1 - 0.025, top + 0.008), at(u2 + 0.025, top + 0.008)], tone(GOLD[2], -0.5), 2),
    line([at(u1 - 0.025, top + 0.008), at(u2 + 0.025, top + 0.008)], GOLD[1], 1.1),
    ball(at(u1 - 0.03, top + 0.008), 0.8, GOLD[0], GOLD[2]),
    ball(at(u2 + 0.03, top + 0.008), 0.8, GOLD[0], GOLD[2]),
  ];
}

/** Velvet drapes either side of a window on the right-hand wall (y = 0),
 *  from x1 to x2, under a gilt pelmet at z2, tied back with gold cords. */
export function drapes(x1: number, x2: number, z1: number, z2: number, cloth: Tones = DEEP_VELVET): Shape[] {
  const span = 0.06;
  const tie = z1 + (z2 - z1) * 0.38;
  const drape = (a: number, dir: number): Shape[] => {
    const inner = a + dir * span;
    const pts: V3[] = [
      [a, 0.006, z2],
      [inner, 0.006, z2],
      [a + dir * span * 0.35, 0.012, tie],
      [a + dir * span * 0.85, 0.01, z1],
      [a, 0.006, z1],
    ];
    const folds = [0.3, 0.6].map((f) =>
      line([[a + dir * span * f, 0.008, z2 - 0.01], [a + dir * span * f * 0.4, 0.012, tie], [a + dir * span * f * 0.9, 0.01, z1 + 0.01]], cloth[2], 0.45),
    );
    return [
      gradPoly(pts, [tone(cloth[0], 0.12), cloth[1], cloth[2]], [a, 0, z2], [inner, 0, z1], tone(cloth[2], -0.5), 0.5),
      ...folds,
      line([[a + dir * span * 0.08, 0.014, tie + 0.01], [a + dir * span * 0.42, 0.014, tie - 0.004]], GILT[1], 1.1),
      ball([a + dir * span * 0.4, 0.016, tie - 0.012], 0.65, GILT[1], WARM_INK),
      line([[a + dir * span * 0.4, 0.016, tie - 0.02], [a + dir * span * 0.4, 0.016, tie - 0.05]], GILT[1], 0.8),
    ];
  };
  return [
    ...drape(x1, 1),
    ...drape(x2, -1),
    // the pelmet: gilt, with a scalloped lower edge
    ...box(x1 - 0.012, 0, z2, x2 - x1 + 0.024, 0.026, 0.032, GILT_TONES),
    {
      d: path(
        Array.from({ length: 13 }, (_, i) => {
          const u = x1 - 0.012 + ((x2 - x1 + 0.024) * i) / 12;
          return P(u, 0.026, z2 - (i % 2 ? 0.014 : 0.002));
        }).concat([P(x2 + 0.012, 0.026, z2), P(x1 - 0.012, 0.026, z2)]),
      ),
      fill: GILT[1],
      grad: { colors: GILT, from: P(x1, 0.026, z2), to: P(x1, 0.026, z2 - 0.016) },
      stroke: WARM_INK,
      strokeWidth: 0.4,
    },
  ];
}

/** A long-case clock against a wall, w × d at (x, y): a plinth on bracket feet, a waist
 *  with a glass door and the brass pendulum behind it, a hood with brass
 *  columns round a brass dial (chapter ring, hours, hands at ten past
 *  ten), and a bonnet crest with a ruby and gilt finials. Its lit face
 *  is at y + d. */
export function grandfatherClock(x: number, y: number, w: number, d: number): Shape[] {
  const X = x + w;
  const Y = y + d;
  const cx = x + w / 2;
  const Yw = Y - 0.012;
  const shapes: Shape[] = [
    shadowOf(x - 0.01, y, w + 0.02, d),
    // bracket feet, the plinth and its moulding
    ...box(X - 0.012, y + 0.01, 0, 0.022, 0.02, 0.022, MAHOGANY),
    ...box(x - 0.01, Y - 0.014, 0, 0.022, 0.022, 0.022, MAHOGANY),
    ...box(X - 0.012, Y - 0.014, 0, 0.022, 0.022, 0.022, MAHOGANY),
    ...box(x - 0.008, y, 0.022, w + 0.016, d + 0.006, 0.1, MAHOGANY),
    ...panel("lit", Y + 0.006, x + 0.008, X - 0.008, 0.042, 0.104, MAHOGANY[1]),
    ...panel("shade", X + 0.008, y + 0.015, Y - 0.01, 0.042, 0.104, MAHOGANY[2]),
    ...box(x - 0.012, y, 0.122, w + 0.024, d + 0.01, 0.014, MAHOGANY),
    // the waist, its glass door and the pendulum
    ...box(x + 0.012, y, 0.136, w - 0.024, d - 0.012, 0.27, MAHOGANY),
    ...panel("shade", X - 0.012, y + 0.015, Yw - 0.012, 0.16, 0.38, MAHOGANY[2]),
    filled([[x + 0.024, Yw, 0.152], [X - 0.024, Yw, 0.152], [X - 0.024, Yw, 0.39], [x + 0.024, Yw, 0.39]], [GOLD[0], GOLD[1], GOLD[2]], [x, Yw, 0.39], [X, Yw, 0.15]),
    filled([[x + 0.03, Yw + 0.001, 0.158], [X - 0.03, Yw + 0.001, 0.158], [X - 0.03, Yw + 0.001, 0.384], [x + 0.03, Yw + 0.001, 0.384]], NIGHT_GLASS, [x, Yw, 0.384], [X, Yw, 0.16]),
    line([[cx, Yw + 0.002, 0.38], [cx, Yw + 0.002, 0.225]], BRASS[1], 0.8),
    roundel("y", [cx, Yw + 0.002, 0.205], 0.022, [GILT_SHEEN[0], GILT_SHEEN[1], GILT_SHEEN[2]], GOLD[2]),
    { ...poly(ringOn("y", [cx, Yw + 0.003, 0.205], 0.013, 16), GOLD[1], GOLD[2]), fill: undefined, strokeWidth: 0.45 },
    { ...line([[x + 0.034, Yw + 0.003, 0.26], [x + 0.07, Yw + 0.003, 0.37]], "#FFFFFF", 0.8), opacity: 0.25 },
    // the hood
    ...box(x - 0.004, y, 0.406, w + 0.008, d + 0.004, 0.016, MAHOGANY),
    ...box(x, y, 0.422, w, d, 0.16, MAHOGANY),
    filled([[x + 0.016, Y + 0.001, 0.434], [X - 0.016, Y + 0.001, 0.434], [X - 0.016, Y + 0.001, 0.57], [x + 0.016, Y + 0.001, 0.57]], [GILT_SHEEN[0], GILT_SHEEN[1], GILT_SHEEN[2]], [x, Y, 0.57], [X, Y, 0.434]),
  ];
  // the dial: chapter ring, hours, hands
  const c: V3 = [cx, Y + 0.002, 0.502];
  const ring = (r: number, a: number): V3 => [cx + Math.cos(a) * r, Y + 0.003, c[2] + Math.sin(a) * r];
  const hour = (h: number) => Math.PI / 2 - (h * Math.PI) / 6;
  shapes.push(
    roundel("y", c, 0.05, [GILT_SHEEN[0], GILT_SHEEN[3], GILT_SHEEN[2]], GOLD[2]),
    roundel("y", [c[0], c[1] + 0.0005, c[2]], 0.043, ["#FFFFFF", "#F2EAD6", "#CDBF9E"], "#7A6440"),
    { ...poly(ringOn("y", [c[0], c[1] + 0.001, c[2]], 0.029, 20), "#E9E0C8"), fill: undefined, stroke: "#9A8A66", strokeWidth: 0.4 },
  );
  for (let h = 0; h < 12; h++) {
    const a = hour(h);
    shapes.push(line([ring(0.031, a), ring(0.04, a)], "#2A1E10", h % 3 === 0 ? 1 : 0.5));
  }
  shapes.push(
    line([ring(0, 0), ring(0.021, hour(10.15))], "#1A1E30", 1.1),
    line([ring(0, 0), ring(0.034, hour(2))], "#1A1E30", 0.75),
    ball(ring(0, 0), 0.45, BRASS[0], BRASS[2]),
    // brass columns at the hood's front corners
    ...[x + 0.007, X - 0.007].flatMap((u) => [
      line([[u, Y + 0.004, 0.426], [u, Y + 0.004, 0.578]], tone(BRASS[2], -0.4), 1.7),
      line([[u, Y + 0.004, 0.426], [u, Y + 0.004, 0.578]], BRASS[1], 0.9),
      { ...line([[u - 0.002, Y + 0.004, 0.43], [u - 0.002, Y + 0.004, 0.574]], "#FFFFFF", 0.35), opacity: 0.6 },
    ]),
    ...box(x - 0.01, y, 0.582, w + 0.02, d + 0.01, 0.018, MAHOGANY),
  );
  // the bonnet crest: an arched board, gilt along its edge, a ruby at its heart
  const crestZ = 0.6;
  const arc = ringOn("y", [cx, Y - 0.004, crestZ + 0.012], w / 2, 14, 0, Math.PI).map(([u, yy, z]): V3 => [u, yy, crestZ + 0.012 + (z - crestZ - 0.012) * 0.75]);
  shapes.push(
    filled([[x, Y - 0.004, crestZ], [X, Y - 0.004, crestZ], ...arc], [tone(MAHOGANY[1], 0.15), MAHOGANY[1], MAHOGANY[2]], [x, Y, crestZ + 0.06], [X, Y, crestZ]),
    line(arc, GOLD[1], 1.1),
    line(arc.map(([u, yy, z]): V3 => [u, yy + 0.001, z - 0.012]), GOLD[2], 0.45),
    ...[x + 0.026, X - 0.026].map((u) => ball([u, Y - 0.003, crestZ + 0.02], 0.85, GOLD[0], GOLD[2])),
    ...jewel([cx, Y - 0.003, crestZ + 0.03], 1.2),
    ...turned([cx, Y - 0.006, crestZ + 0.062], [[0.006, 0], [0.012, 0.008], [0.011, 0.016], [0.004, 0.024], [0.002, 0.03]], GILT_SHEEN),
    ball([cx, Y - 0.006, crestZ + 0.098], 0.7, GOLD[0], GOLD[2]),
    ...[x - 0.004, X + 0.004].flatMap((u) => [
      ...turned([u, Y + 0.004, crestZ], [[0.006, 0], [0.009, 0.008], [0.004, 0.016]], GILT_SHEEN),
      ball([u, Y + 0.004, crestZ + 0.026], 0.75, GOLD[0], GOLD[2]),
    ]),
  );
  return shapes;
}

/** A kitchen clock on the left-hand wall at (y, z), `r` round: an oak
 *  rim, a brass bezel, an ivory face with its hours and hands. */
export function wallClock(y: number, z: number, r: number): Shape[] {
  const at = (dy: number, dz: number, x = 0.006): V3 => [x, y + dy, z + dz];
  return [
    roundel("x", at(0, 0, 0.004), r, [OAK[0], OAK[1], OAK[2]], tone(OAK[2], -0.5)),
    roundel("x", at(0, 0), r * 0.78, ["#FFFFFF", "#F4EEDF", "#D8CCB0"], BRASS[2]),
    { ...line(ringOn("x", at(0, 0, 0.007), r * 0.66), "#3A2408", 1.2), dash: "0.3 1.6" },
    line([at(0, 0, 0.008), at(-r * 0.32, r * 0.3, 0.008)], "#1A1410", 0.9),
    line([at(0, 0, 0.008), at(r * 0.05, r * 0.58, 0.008)], "#1A1410", 0.6),
    ball(at(0, 0, 0.009), 0.25, BRASS[1]),
  ];
}

/** A board of servants' bells on the right-hand wall, x1..x2 and z1..z2:
 *  mahogany with a gilt edge, and a row of `count` brass bells on coiled
 *  springs, each under its room's little ivory label. */
export function bellBoard(x1: number, x2: number, z1: number, z2: number, count: number): Shape[] {
  const at = (u: number, z: number, y = 0.004): V3 => [u, y, z];
  const shapes: Shape[] = [
    filled([at(x1, z1), at(x2, z1), at(x2, z2), at(x1, z2)], [MAHOGANY[0], MAHOGANY[1], MAHOGANY[2]], at(x1, z2), at(x2, z1), tone(MAHOGANY[2], -0.5)),
    line([at(x1 + 0.008, z1 + 0.008, 0.005), at(x2 - 0.008, z1 + 0.008, 0.005), at(x2 - 0.008, z2 - 0.008, 0.005), at(x1 + 0.008, z2 - 0.008, 0.005), at(x1 + 0.008, z1 + 0.008, 0.005)], BRASS[1], 0.7),
  ];
  for (let i = 0; i < count; i++) {
    const u = x1 + ((x2 - x1) * (i + 0.5)) / count;
    const bz = z1 - 0.012;
    shapes.push(
      filled([at(u - 0.02, z2 - 0.032, 0.006), at(u + 0.02, z2 - 0.032, 0.006), at(u + 0.02, z2 - 0.016, 0.006), at(u - 0.02, z2 - 0.016, 0.006)], ["#FFFFFF", "#F4EEDF", "#D8CCB0"], at(u - 0.02, z2), at(u + 0.02, z2 - 0.03), "#6A5A3A"),
      line([at(u, z2 - 0.042, 0.006), at(u, z2 - 0.046, 0.02), at(u + 0.006, z2 - 0.05, 0.026), at(u - 0.006, z2 - 0.056, 0.028), at(u + 0.006, z2 - 0.062, 0.03), at(u - 0.004, z2 - 0.068, 0.032), at(u, bz + 0.03, 0.034)], BRASS[2], 0.7),
      ...turned([u, 0.034, bz], [[0.018, 0], [0.016, 0.004], [0.011, 0.012], [0.009, 0.022], [0.004, 0.03]], BRASS_SHEEN),
      ball([u, 0.034, bz - 0.004], 0.35, BRASS[2]),
    );
  }
  return shapes;
}

// ── vases, urns, sculpture ──────────────────────────────────────────

/** A vase on (x, y, z), `r` round and `h` tall: a turned porcelain body
 *  in `colors`, `band` colour round it. */
export function vase(x: number, y: number, z: number, r: number, h: number, colors = ["#FFFFFF", "#E8EEF6", "#8FA2C2"], band = "#2E4E9A"): Shape[] {
  return [
    ...turned(
      [x, y, z],
      [
        [r * 0.55, 0],
        [r * 0.62, h * 0.05],
        [r * 0.95, h * 0.3],
        [r, h * 0.45],
        [r * 0.85, h * 0.62],
        [r * 0.48, h * 0.82],
        [r * 0.42, h * 0.93],
        [r * 0.58, h],
      ],
      colors,
      "#1A2240",
    ),
    hoop(x, y, z + h * 0.42, r * 1.0, band),
    hoop(x, y, z + h * 0.28, r * 0.93, band),
    hoop(x, y, z + h * 0.84, r * 0.47, band),
  ];
}

/** Flowers standing in a vase whose mouth is at (x, y, z): leaves fanned
 *  out, roses and lilies over them. */
export function bouquet(x: number, y: number, z: number, size = 1): Shape[] {
  const [cx, cy] = P(x, y, z);
  const s = size * unit() * 0.01;
  const shapes: Shape[] = [];
  for (const a of [-1.25, 1.2, -0.75, 0.7]) shapes.push(...leafAt([cx, cy], a, 7 * s, 1.8 * s));
  const blooms: [number, number, number, string][] = [
    [-3.6, -4.2, 1.15, "#F4EEDF"],
    [3.4, -4.6, 1.1, "#E8B850"],
    [0.2, -7.2, 1.25, "#C0303C"],
    [-2.6, -8.6, 1.0, "#F4EEDF"],
    [2.8, -8.2, 1.05, "#C0303C"],
    [0, -10.6, 0.95, "#E8B850"],
    [-0.4, -4.2, 1.2, "#C0303C"],
  ];
  for (const [dx, dy, r, c] of blooms) {
    const bx = cx + dx * s;
    const by = cy + dy * s;
    const rr = r * size * unit() * 0.025;
    shapes.push({
      d: oval(bx, by, rr, rr),
      fill: c,
      grad: { colors: [tone(c, 0.35), c, tone(c, -0.35)], from: [bx - rr * 0.4, by - rr * 0.4], radius: rr * 1.5 },
      stroke: inkOf(c),
      strokeWidth: 0.45,
    });
    // the petals' curl
    shapes.push({
      d: `M${n(bx - rr * 0.45)} ${n(by)} A${n(rr * 0.45)} ${n(rr * 0.45)} 0 1 1 ${n(bx + rr * 0.1)} ${n(by + rr * 0.42)}`,
      stroke: tone(c, -0.45),
      strokeWidth: 0.4,
      opacity: 0.8,
    });
  }
  return shapes;
}

/** A stone urn on a square foot at (x, y), `r` round, a fern spilling
 *  from it. */
export function fernUrn(x: number, y: number, r: number): Shape[] {
  const urnTop = r * 2.3;
  const [cx, cy] = P(x, y, urnTop);
  const s = unit() * 0.01;
  const shapes: Shape[] = [
    disc(x + 0.03, y + 0.012, 0, r * 1.2, INK.night, undefined, 0.32),
    ...box(x - r * 0.75, y - r * 0.75, 0, r * 1.5, r * 1.5, r * 0.4, MARBLE),
    ...turned(
      [x, y, r * 0.4],
      [
        [r * 0.4, 0],
        [r * 0.3, r * 0.3],
        [r * 0.85, r * 0.9],
        [r, r * 1.5],
        [r * 1.12, r * 1.9],
      ],
      [GILT_SHEEN[0], "#B98A3E", "#6E4A1A", "#D4A85A"],
      "#1A1410",
    ),
    hoop(x, y, r * 1.4, r * 0.95, GOLD[2]),
  ];
  const fronds: [number, number][] = [
    [-1.45, 0.8],
    [1.4, 0.8],
    [-1.0, 1],
    [1.0, 1],
    [-0.5, 1.1],
    [0.45, 1.1],
    [0.0, 1.2],
  ];
  for (const [a, l] of fronds) shapes.push(...leafAt([cx, cy], a, 22 * s * l, 3.4 * s, LEAF, 7));
  return shapes;
}

/** A Greek urn standing at (x, y, z), `h` tall: terracotta with a black
 *  band, a dark mouth and two looping handles. */
export function greekUrn(x: number, y: number, z: number, h: number, body: string[] = ["#F0A070", "#C2643A", "#6A2E14"]): Shape[] {
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
    turnedBody(x, y, z, prof, body, tone(body[2], -0.5)),
    band(0.055 * s, 0.09 * s, 0.045 * s, 0.049 * s),
    // a zigzag round the band
    {
      d: `M${n(cx - 0.04 * s * k)} ${n(yAt(0.073 * s))} ${Array.from({ length: 8 }, (_, i) => `l${n(0.01 * s * k)} ${n((i % 2 ? 1 : -1) * 0.009 * s * unit())}`).join(" ")}`,
      stroke: body[0],
      strokeWidth: 0.4,
    },
    handle(-1),
    { d: path(ellipsePoints(cx, yAt(0.16 * s), mouth, mouth * 0.42, 14)), fill: "#1A0C06", stroke: tone(body[2], -0.4), strokeWidth: 0.45 },
    { d: `M${n(cx - mouth * 0.9)} ${n(yAt(0.16 * s))} A${n(mouth * 0.9)} ${n(mouth * 0.38)} 0 0 0 ${n(cx + mouth * 0.9)} ${n(yAt(0.16 * s))}`, stroke: body[0], strokeWidth: 0.5, opacity: 0.7 },
    { d: `M${n(cx - 0.03 * s * k)} ${n(yAt(0.1 * s))} L${n(cx - 0.034 * s * k)} ${n(yAt(0.065 * s))}`, stroke: "#FFFFFF", strokeWidth: 0.6, opacity: 0.45 },
  ];
}

/** A marble plinth at (x, y), w × d: a moulded foot, a shaft with sunk panels and a vein
 *  or two, a gilt fillet and a moulded cap. Its top is at h. */
export function marblePlinth(x: number, y: number, w: number, d: number, h: number, tones: Tones = STATUARY_MARBLE): Shape[] {
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

/** A marble bust on a round socle, standing at (x, y, z), `h` tall: a
 *  chest cut in a curve with a drape over one shoulder, the neck, and a
 *  head with curled hair bound up behind (a classical marble, no
 *  features cut). */
export function bust(x: number, y: number, z: number, h: number, tones: Tones = STATUARY_MARBLE): Shape[] {
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
    turnedBody(x, y, z, ([[0, 0.03], [0.01, 0.03], [0.016, 0.017], [0.026, 0.014], [0.032, 0.024], [0.036, 0.024]] as [number, number][]).map(([a, b]) => [(a * h) / 0.17, (b * h) / 0.17]), colors, ink),
    // the chest, cut away in a curve below
    fill(
      `M${path(pts([[-0.05, 0.036], [-0.062, 0.062], [-0.06, 0.082], [-0.046, 0.092], [-0.016, 0.1], [0.016, 0.1], [0.046, 0.092], [0.06, 0.082], [0.062, 0.062], [0.05, 0.036]]), false).slice(1)} Q${n(at(0, 0.052)[0])} ${n(at(0, 0.052)[1])} ${n(at(-0.05, 0.036)[0])} ${n(at(-0.05, 0.036)[1])} Z`,
      at(-0.05, 0.1),
      at(0.06, 0.04),
    ),
    // a drape over the left shoulder, falling across the chest
    fill(path(pts([[-0.06, 0.082], [-0.046, 0.092], [-0.02, 0.098], [0.018, 0.07], [0.05, 0.036], [0.026, 0.044], [-0.05, 0.036], [-0.062, 0.062]])), at(-0.05, 0.09), at(0.04, 0.04)),
    {
      d: [[[-0.05, 0.075], [-0.02, 0.07], [0.012, 0.058]], [[-0.054, 0.058], [-0.02, 0.052], [0.02, 0.046]], [[-0.04, 0.088], [-0.01, 0.082]]]
        .map((l) => path(pts(l as [number, number][]), false))
        .join(" "),
      stroke: ink,
      strokeWidth: 0.35,
      opacity: 0.55,
    },
    fill(path(pts([[-0.012, 0.096], [-0.013, 0.118], [0.013, 0.118], [0.012, 0.096]])), at(-0.012, 0.12), at(0.013, 0.096)),
    { d: path(pts([[-0.012, 0.1], [0, 0.094], [0.012, 0.1]]), false), stroke: ink, strokeWidth: 0.35, opacity: 0.5 },
    fill(path(ellipsePoints(hx, hy, rx, ry, 18)), [hx - rx * 0.6, hy - ry * 0.7], [hx + rx, hy + ry]),
    // curled hair over the crown, gathered in a knot behind
    fill(path(ellipsePoints(hx + rx * 0.75, hy - ry * 0.55, rx * 0.42, rx * 0.42, 10)), [hx + rx * 0.5, hy - ry], [hx + rx, hy - ry * 0.3], hair),
    fill(
      path([
        ...ellipsePoints(hx, hy, rx * 1.06, ry * 1.04, 12, Math.PI * 0.94, Math.PI * 2.06),
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
    line(pts, DEEP_VELVET[0], 1.4),
    { ...line(pts.map(([x, y, z]) => [x, y, z + 0.004] as V3), "#FF9AA6", 0.45), opacity: 0.55 },
    ball(a, 0.55, BRASS[1], BRASS[2]),
    ball(b, 0.55, BRASS[1], BRASS[2]),
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
  const gold = (d: string, from: Pt, to: Pt, colors = GILT): Shape => ({ d, fill: GILT[1], grad: { colors, from, to }, stroke: WARM_INK, strokeWidth: 0.4 });
  const gem = (gx: number, gy: number, size: number, c: readonly string[]): Shape[] => [
    { d: path(ellipsePoints(gx, gy, size, size, 10)), fill: c[1], grad: { colors: [...c], from: [gx - size * 0.4, gy - size * 0.5], radius: size * 1.6 }, stroke: c[2], strokeWidth: 0.35 },
    { d: path(ellipsePoints(gx - size * 0.35, gy - size * 0.35, size * 0.28, size * 0.28, 6)), fill: "#FFFFFF", opacity: 0.85 },
  ];
  const points = [-1, -0.5, 0, 0.5, 1].flatMap((s): Shape[] => {
    const px = cx + s * w * 0.9;
    const base = top + ry * Math.sqrt(1 - Math.min(1, s * s) * 0.8);
    const tip = base - w * (s === 0 ? 0.95 : 0.75);
    const half = w * 0.2;
    return [
      gold(`M${n(px - half)} ${n(base)} L${n(px)} ${n(tip)} L${n(px + half)} ${n(base)} Z`, [px - half, tip], [px + half, base]),
      { d: path(ellipsePoints(px, tip, w * 0.1, w * 0.1, 8)), fill: "#FFFFFF", grad: { colors: ["#FFFFFF", "#F4EEDF", "#B8AC90"], from: [px - w * 0.04, tip - w * 0.05], radius: w * 0.16 }, stroke: "#8C7A58", strokeWidth: 0.3 },
    ];
  });
  return [
    // the cushion, with gold tassels at its corners
    ...box(x - 0.05, y - 0.045, z, 0.1, 0.09, cushion, DEEP_VELVET),
    { ...line([[x - 0.05, y + 0.045, z + cushion], [x + 0.05, y + 0.045, z + cushion], [x + 0.05, y - 0.045, z + cushion]], GILT[1], 0.5) },
    ...[[x + 0.05, y + 0.045], [x - 0.05, y + 0.045], [x + 0.05, y - 0.045]].map(([tx, ty]) => ball([tx, ty, z + cushion * 0.4], 0.45, GILT[1], WARM_INK)),
    // the velvet cap, and the orb and cross over it
    {
      d: `M${n(cx - w * 0.88)} ${n(top)} A${n(w * 0.88)} ${n(w * 1.05)} 0 0 1 ${n(cx + w * 0.88)} ${n(top)} Z`,
      fill: DEEP_VELVET[0],
      grad: { colors: ["#E86A7A", DEEP_VELVET[0], DEEP_VELVET[2]], from: [cx - w * 0.3, top - w * 0.8], radius: w * 1.4 },
      stroke: DEEP_VELVET[2],
      strokeWidth: 0.4,
    },
    gold(`M${n(cx - w * 0.06)} ${n(top - w * 1.0)} L${n(cx - w * 0.06)} ${n(top - w * 0.5)} L${n(cx + w * 0.06)} ${n(top - w * 0.5)} L${n(cx + w * 0.06)} ${n(top - w * 1.0)} Z`, [cx, top - w], [cx, top - w * 0.5]),
    gold(path(ellipsePoints(cx, top - w * 1.1, w * 0.17, w * 0.17, 10)), [cx - w * 0.1, top - w * 1.2], [cx + w * 0.15, top - w]),
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

/** A stone font standing at (x, y): a stepped base, a stem banded in
 *  gilt, a carved bowl with a gilt rim, and still water. */
export function font(x: number, y: number): Shape[] {
  return [
    disc(x + 0.035, y + 0.01, 0, 0.075, INK.night, undefined, 0.3),
    ...cylinder(x, y, 0, 0.065, 0.022, LIMESTONE),
    ...cylinder(x, y, 0.022, 0.045, 0.02, LIMESTONE),
    ...cylinder(x, y, 0.042, 0.022, 0.1, LIMESTONE),
    hoop(x, y, 0.09, 0.022, PALE_GILT[1]),
    ...cylinder(x, y, 0.135, 0.04, 0.02, LIMESTONE),
    ...cylinder(x, y, 0.155, 0.068, 0.045, LIMESTONE),
    hoop(x, y, 0.168, 0.068, tone(LIMESTONE[2], -0.2)),
    hoop(x, y, 0.198, 0.068, PALE_GILT[1]),
    disc(x, y, 0.2, 0.068, undefined, PALE_GILT[1], undefined, 0.8),
    {
      ...disc(x, y, 0.2, 0.054, INK.glass, inkOf(LIMESTONE[2])),
      grad: { colors: ["#D8E4FF", "#7E9CE0", "#3E5498"], from: P(x - 0.03, y - 0.02, 0.2), radius: 0.07 * 100 * 1.2 },
    },
    { ...line([[x - 0.03, y + 0.005, 0.2], [x - 0.005, y - 0.025, 0.2]], "#FFFFFF", 0.5), opacity: 0.6 },
  ];
}

// ── on a desk ───────────────────────────────────────────────────────

/** A book lying open at z, its spine along y down the middle of x..x+w:
 *  leather boards, two blocks of pages, lines of writing and a ribbon. */
export function openBook(x: number, y: number, z: number, w: number, d: number, cover: Tones = DEEP_VELVET, ribbon = "#C2203A"): Shape[] {
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
      d: path(vane),
      fill: "#F4EEDF",
      grad: { colors: ["#FFFFFF", "#F4EEDF", "#C8BC9C"], from: along(0.7, -1, 3 * s), to: along(0.6, 1, 1.6 * s) },
      stroke: WARM_INK,
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

/** An inkwell at (x, y, z): a brass tray with a pen groove, a cut-glass
 *  well of ink under a hinged brass lid, thrown open. */
export function inkwell(x: number, y: number, z: number): Shape[] {
  return [
    ...box(x - 0.03, y - 0.024, z, 0.06, 0.048, 0.006, BRASS),
    line([[x - 0.024, y + 0.016, z + 0.006], [x + 0.024, y + 0.016, z + 0.006]], BRASS[2], 0.6),
    ...cylinder(x - 0.006, y - 0.004, z + 0.006, 0.014, 0.02, ["#3A4A7A", "#1E2A4E", "#0E1630"]),
    { ...ball([x - 0.012, y - 0.004, z + 0.018], 0.3, "#FFFFFF"), opacity: 0.6 },
    ...cylinder(x - 0.006, y - 0.004, z + 0.026, 0.008, 0.004, BRASS),
    gradPoly([[x - 0.014, y - 0.018, z + 0.03], [x + 0.002, y - 0.018, z + 0.03], [x + 0.002, y - 0.022, z + 0.046], [x - 0.014, y - 0.022, z + 0.046]], [BRASS[0], BRASS[1], BRASS[2]], [x - 0.014, y, z + 0.046], [x, y, z + 0.03], tone(BRASS[2], -0.5), 0.4),
  ];
}

/** An open ledger lying at z, its spine along y down the middle of
 *  x..x+w: red leather boards, two blocks of pages curving up to the
 *  gutter, columns of figures and a silk ribbon. */
export function ledger(x: number, y: number, z: number, w: number, d: number): Shape[] {
  const mid = x + w / 2;
  const top = z + 0.012;
  const shapes: Shape[] = [
    ...box(x, y, z, w, d, 0.005, DEEP_VELVET),
    ...box(x + 0.004, y + 0.005, z + 0.005, w / 2 - 0.005, d - 0.01, 0.007, PAGES),
    ...box(mid + 0.001, y + 0.005, z + 0.005, w / 2 - 0.005, d - 0.01, 0.007, PAGES),
    // the pages lift toward the gutter
    { ...flat(mid - 0.02, mid, y + 0.005, y + d - 0.005, top, "#000000"), stroke: undefined, opacity: 0.1 },
    line([[mid, y + 0.005, top], [mid, y + d - 0.005, top]], "#A89A7A", 0.6),
  ];
  for (const [u1, u2] of [[x + 0.012, mid - 0.01], [mid + 0.01, x + w - 0.012]]) {
    shapes.push(line([[u1, y + 0.018, top], [u2, y + 0.018, top]], "#8E2433", 0.45));
    for (const f of [0.32, 0.46, 0.6, 0.74]) {
      shapes.push(line([[u1, y + d * f, top], [u1 + (u2 - u1) * 0.55, y + d * f, top]], "#7A6E58", 0.35));
      shapes.push(line([[u1 + (u2 - u1) * 0.7, y + d * f, top], [u2, y + d * f, top]], "#7A6E58", 0.35));
    }
  }
  shapes.push(line([[mid + 0.003, y + d * 0.2, top], [mid + 0.006, y + d - 0.004, top], [mid + 0.01, y + d + 0.002, z - 0.03]], "#C2203A", 0.9));
  return shapes;
}

/** A library globe at (x, y): three splayed legs on a turned column, a
 *  brass horizon ring round its middle, a meridian ring tilted through
 *  its poles, and the sphere — seas and lands, lit from the upper left.
 *  `r` is the sphere's radius, `h` its centre's height. */
export function globe(x: number, y: number, r = 0.065, h = 0.3, tones: Tones = WARM_MAHOGANY): Shape[] {
  const [cx, cy] = P(x, y, h);
  const R = r * unit();
  const hr = R * 1.25;
  const tilt = (-23 * Math.PI) / 180;
  const meridian = (from: number, to: number) => {
    const pts = ellipsePoints(0, 0, R * 1.14 * 0.4, R * 1.14, 16, from, to).map(([px, py]) => [cx + px * Math.cos(tilt) - py * Math.sin(tilt), cy + px * Math.sin(tilt) + py * Math.cos(tilt)] as Pt);
    return path(pts, false);
  };
  const legs = [0, 1, 2].map((i) => {
    const a = Math.PI / 4 + Math.PI / 6 + (i * 2 * Math.PI) / 3;
    return { foot: [x + Math.cos(a) * 0.075, y + Math.sin(a) * 0.075, 0] as V3, a };
  });
  const leg = (foot: V3): Shape[] => [
    line([[x, y, 0.1], [(x + foot[0]) / 2, (y + foot[1]) / 2, 0.05], foot], tone(tones[2], -0.4), 2.2),
    line([[x, y, 0.1], [(x + foot[0]) / 2, (y + foot[1]) / 2, 0.05], foot], tones[0], 1.2),
    ball(foot, 0.6, BRASS[1], BRASS[2]),
  ];
  const back = legs.filter((l) => Math.cos(l.a - Math.PI / 4) < 0);
  const near = legs.filter((l) => Math.cos(l.a - Math.PI / 4) >= 0);
  const land = (pts: [number, number][]) => path(pts.map(([u, v]) => [cx + u * R, cy + v * R] as Pt));
  return [
    { ...shadow(x - 0.07, y - 0.06, 0.12, 0.12) },
    ...back.flatMap((l) => leg(l.foot)),
    ...cylinder(x, y, 0.05, 0.016, 0.07, tones),
    ...cylinder(x, y, 0.11, 0.024, 0.016, tones),
    ...cylinder(x, y, 0.126, 0.01, h - r - 0.14, tones),
    ...cylinder(x, y, h - r - 0.02, 0.02, 0.012, BRASS),
    ...near.flatMap((l) => leg(l.foot)),
    // the back halves of the rings
    { d: meridian(Math.PI * 0.5, Math.PI * 1.5), stroke: BRASS[2], strokeWidth: 1.2 },
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 1 ${n(cx + hr)} ${n(cy)}`, stroke: BRASS[2], strokeWidth: 1.6 },
    // the sphere: sea, lands, a line of latitude
    {
      d: path(ellipsePoints(cx, cy, R, R, 24)),
      fill: "#2E6A9A",
      grad: { colors: ["#8AC0E8", "#2E6A9A", "#0E2A4A"], from: [cx - R * 0.4, cy - R * 0.45], radius: R * 1.6 },
      stroke: "#0A1A30",
      strokeWidth: 0.5,
    },
    {
      d: [
        land([[-0.7, -0.5], [-0.3, -0.75], [0.05, -0.6], [-0.05, -0.3], [-0.35, -0.1], [-0.3, 0.25], [-0.55, 0.4], [-0.8, 0.0]]),
        land([[0.2, -0.2], [0.55, -0.45], [0.8, -0.2], [0.7, 0.2], [0.45, 0.6], [0.25, 0.35], [0.3, 0.05]]),
        land([[-0.15, 0.55], [0.1, 0.5], [0.05, 0.8], [-0.2, 0.78]]),
      ].join(" "),
      fill: "#C8B47A",
      grad: { colors: ["#F2E2A8", "#C8B47A", "#6A5A2A"], from: [cx - R * 0.4, cy - R * 0.45], radius: R * 1.6 },
      stroke: "#5A4A1E",
      strokeWidth: 0.35,
    },
    { d: `M${n(cx - R)} ${n(cy)} A${n(R)} ${n(R * 0.3)} 0 0 0 ${n(cx + R)} ${n(cy)}`, stroke: "#D8E6FF", strokeWidth: 0.35, opacity: 0.5 },
    { d: `M${n(cx - R * 0.72)} ${n(cy - R * 0.3)} A${n(R * 0.8)} ${n(R * 0.8)} 0 0 1 ${n(cx - R * 0.1)} ${n(cy - R * 0.82)}`, stroke: "#FFFFFF", strokeWidth: 0.7, opacity: 0.6 },
    // the front halves of the rings, the pole pins
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx + hr)} ${n(cy)}`, stroke: tone(BRASS[2], -0.4), strokeWidth: 2.2 },
    { d: `M${n(cx - hr)} ${n(cy)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx + hr)} ${n(cy)}`, stroke: BRASS[1], strokeWidth: 1.4 },
    { d: `M${n(cx - hr * 0.9)} ${n(cy + hr * 0.12)} A${n(hr)} ${n(hr * 0.42)} 0 0 0 ${n(cx)} ${n(cy + hr * 0.42)}`, stroke: BRASS[0], strokeWidth: 0.45, opacity: 0.8 },
    { d: meridian(-Math.PI * 0.5, Math.PI * 0.5), stroke: tone(BRASS[2], -0.4), strokeWidth: 1.8 },
    { d: meridian(-Math.PI * 0.5, Math.PI * 0.5), stroke: BRASS[1], strokeWidth: 1.0 },
    ...[1, -1].map((s) => {
      const py = s * R * 1.14;
      return { d: path(ellipsePoints(cx - py * Math.sin(tilt), cy + py * Math.cos(tilt), 1.1, 1.1, 8)), fill: BRASS[0], stroke: BRASS[2], strokeWidth: 0.4 } as Shape;
    }),
  ];
}

// ── bells ───────────────────────────────────────────────────────────

/** An engraved bronze bell in drawing units: its waist at (cx, cy), `s`
 *  from waist to lip. Clapper, flared body, sound-bow band at the lip,
 *  engraved bands with an inscription, canons on the crown, a shine. */
export function bellShape(cx: number, cy: number, s: number): Shape[] {
  const X = (f: number) => n(cx + s * f);
  const Y = (f: number) => n(cy + s * f);
  const S = (f: number) => n(s * f);
  const edge = "#3A2408";
  const band = (y: number, rx: number, width = 0.5, opacity = 0.8, dash?: string): Shape => ({
    d: `M${X(-rx)} ${Y(y)} A${S(rx)} ${S(rx * 0.29)} 0 0 0 ${X(rx)} ${Y(y)}`,
    stroke: edge,
    strokeWidth: width,
    opacity,
    dash,
  });
  const glow = (y: number, rx: number): Shape => ({
    d: `M${X(-rx)} ${Y(y)} A${S(rx)} ${S(rx * 0.29)} 0 0 0 ${X(rx)} ${Y(y)}`,
    stroke: "#FFF2B8",
    strokeWidth: 0.4,
    opacity: 0.55,
  });
  return [
    // the clapper's ball, just showing under the lip
    {
      d: `M${X(-0.2)} ${Y(1.14)} a${S(0.2)} ${S(0.2)} 0 1 0 ${S(0.4)} 0 a${S(0.2)} ${S(0.2)} 0 1 0 ${S(-0.4)} 0 Z`,
      fill: IRONWORK[1],
      grad: { colors: [IRONWORK[0], IRONWORK[1], IRONWORK[2]], from: [cx - s * 0.08, cy + s * 1.06], radius: s * 0.3 },
      stroke: inkOf(IRONWORK[1]),
      strokeWidth: 0.5,
    },
    // the canons: a loop on the crown
    {
      d: `M${X(-0.2)} ${Y(-1.08)} C${X(-0.22)} ${Y(-1.42)} ${X(0.22)} ${Y(-1.42)} ${X(0.2)} ${Y(-1.08)}`,
      stroke: edge,
      strokeWidth: 2.6,
    },
    {
      d: `M${X(-0.2)} ${Y(-1.08)} C${X(-0.22)} ${Y(-1.42)} ${X(0.22)} ${Y(-1.42)} ${X(0.2)} ${Y(-1.08)}`,
      stroke: BRONZE[1],
      strokeWidth: 1.5,
    },
    {
      d: `M${X(-0.98)} ${Y(1)} C${X(-0.86)} ${Y(0.72)} ${X(-0.56)} ${Y(0.42)} ${X(-0.53)} ${Y(-0.3)} C${X(-0.5)} ${Y(-0.88)} ${X(-0.34)} ${Y(-1.12)} ${X(0)} ${Y(-1.12)} C${X(0.34)} ${Y(-1.12)} ${X(0.5)} ${Y(-0.88)} ${X(0.53)} ${Y(-0.3)} C${X(0.56)} ${Y(0.42)} ${X(0.86)} ${Y(0.72)} ${X(0.98)} ${Y(1)} A${S(0.98)} ${S(0.28)} 0 0 1 ${X(-0.98)} ${Y(1)} Z`,
      fill: BRONZE[1],
      grad: { colors: BRONZE, from: [cx - s * 0.95, cy - s * 0.2], to: [cx + s, cy] },
      stroke: edge,
      strokeWidth: 0.75,
    },
    // the sound bow: a heavier band round the lip
    {
      d: `M${X(-0.98)} ${Y(1)} A${S(0.98)} ${S(0.28)} 0 0 0 ${X(0.98)} ${Y(1)} L${X(0.9)} ${Y(0.8)} A${S(0.9)} ${S(0.26)} 0 0 1 ${X(-0.9)} ${Y(0.8)} Z`,
      fill: BRONZE[2],
      grad: { colors: [BRONZE[0], BRONZE[1], BRONZE[2], "#6E4A14"], from: [cx - s, cy + s], to: [cx + s, cy + s] },
      stroke: edge,
      strokeWidth: 0.6,
    },
    // engraved bands: two at the shoulder with the inscription between,
    // two at the waist
    band(-0.66, 0.5),
    glow(-0.63, 0.5),
    band(-0.4, 0.53, 0.6, 0.75, "0.9 0.9"),
    band(-0.24, 0.54),
    glow(-0.21, 0.54),
    band(0.48, 0.72),
    band(0.58, 0.77, 0.4, 0.6),
    // the shine down the lit side
    {
      d: `M${X(-0.32)} ${Y(-0.92)} C${X(-0.44)} ${Y(-0.4)} ${X(-0.5)} ${Y(0.3)} ${X(-0.74)} ${Y(0.8)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.9,
      opacity: 0.6,
    },
    {
      d: `M${X(-0.18)} ${Y(-1.0)} C${X(-0.26)} ${Y(-0.8)} ${X(-0.3)} ${Y(-0.6)} ${X(-0.31)} ${Y(-0.45)}`,
      stroke: "#FFFFFF",
      strokeWidth: 0.6,
      opacity: 0.45,
    },
  ];
}

/** A handbell standing on its mouth at (x, y, z), `s` drawing units from
 *  waist to lip, with a leather-bound handle. */
export function handbell(x: number, y: number, z: number, s: number): Shape[] {
  const [cx, base] = P(x, y, z);
  const cy = base - s * 1.1;
  const top = cy - s * 1.1;
  return [
    ...bellShape(cx, cy, s).slice(3),
    { d: `M${n(cx)} ${n(top)} L${n(cx)} ${n(top - s * 1.3)}`, stroke: inkOf(CRIMSON), strokeWidth: 2.2 },
    { d: `M${n(cx)} ${n(top)} L${n(cx)} ${n(top - s * 1.3)}`, stroke: CRIMSON, strokeWidth: 1.3 },
    {
      d: `M${n(cx - 0.9)} ${n(top - s * 1.3)} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 Z`,
      fill: WOOD[0],
      stroke: inkOf(WOOD[0]),
      strokeWidth: 0.4,
    },
  ];
}

/** The woollen grip on a bell rope, from one world point to another:
 *  crimson striped with gold and ivory. */
export function sally(from: V3, to: V3): Shape[] {
  const [ax, ay] = P(...from);
  const [bx, by] = P(...to);
  const shapes: Shape[] = [
    { d: `M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`, stroke: inkOf(CRIMSON), strokeWidth: 3.6 },
    { d: `M${n(ax)} ${n(ay)} L${n(bx)} ${n(by)}`, stroke: CRIMSON, strokeWidth: 2.6 },
  ];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    shapes.push({
      d: `M${n(x - 1.25)} ${n(y + 0.5)} L${n(x + 1.25)} ${n(y - 0.5)}`,
      stroke: i % 2 ? "#F0CC72" : "#F4EEDF",
      strokeWidth: 0.9,
    });
  }
  shapes.push({ d: `M${n(ax - 0.6)} ${n(ay)} L${n(bx - 0.6)} ${n(by)}`, stroke: "#FFFFFF", strokeWidth: 0.4, opacity: 0.45 });
  return shapes;
}

/** A coil of rope lying on the floor at (x, y). */
export function ropeCoil(x: number, y: number): Shape[] {
  return [
    disc(x + 0.02, y + 0.01, 0, 0.06, INK.night, undefined, 0.3),
    ...[0, 0.012, 0.024].flatMap((z, i) => {
      const r = 0.05 - i * 0.008;
      return [
        disc(x, y, z, r, undefined, inkOf(HEMP), undefined, 2.2),
        disc(x, y, z, r, undefined, HEMP, undefined, 1.3),
      ];
    }),
  ];
}

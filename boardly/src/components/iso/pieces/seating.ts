// Somewhere to sit: chairs, a pew, benches, a stool, and a soft cushion.

import {
  ball,
  box,
  cylinder,
  GOLD,
  INK,
  inkOf,
  line,
  n,
  P,
  path,
  tone,
  unit,
  WOOD,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { disc, shadow, tint } from "../room";
import {
  BRASS,
  CRIMSON,
  DEEP_VELVET,
  GILT,
  MAHOGANY,
  OAK,
  PALE_GILT,
  VELVET,
  WARM_INK,
  WARM_MAHOGANY,
} from "./materials";
import {
  ellipsePoints,
  filled,
  gradPoly,
  hull,
  panel,
  Pv,
  ringOn,
  shadowOf,
  strokes,
} from "./helpers";
import { turned } from "./turned";

/** A high-backed dining chair, its seat's corner at (x, y): turned front legs, a crimson cushion
 *  on a mahogany seat, an upholstered back studded in gold between two
 *  stiles with brass finials, under a carved gilt crest. Its back stands
 *  along the named edge of the seat: "y0" faces the viewer's left
 *  (+y), "x1" faces back (-x), showing its carved rear. */
export function highChair(x: number, y: number, back: "y0" | "x1"): Shape[] {
  const s = 0.1;
  const seat = 0.12;
  const top = 0.5;
  const t = 0.014;
  const shapes: Shape[] = [shadowOf(x, y, s, s)];
  const leg = (lx: number, ly: number) => box(lx, ly, 0, t, t, seat, MAHOGANY);
  const finial = (fx: number, fy: number): Shape[] => turned([fx, fy, top], [[0.008, 0], [0.004, 0.006], [0.008, 0.014], [0.003, 0.022]], [BRASS[0], BRASS[1], BRASS[2]]);
  const seatParts = (): Shape[] => [
    ...box(x, y, seat, s, s, 0.02, MAHOGANY),
    ...box(x + 0.008, y + 0.008, seat + 0.02, s - 0.016, s - 0.016, 0.016, VELVET),
  ];
  if (back === "y0") {
    const fy = y + 0.002;
    const crest = ringOn("y", [x + s / 2, fy + t, top - 0.03], s / 2, 12, 0, Math.PI).map(([u, yy, z]): V3 => [u, yy, top - 0.03 + (z - top + 0.03) * 0.5]);
    shapes.push(
      ...box(x, y, 0, t, t, top, MAHOGANY),
      ...box(x + s - t, y, 0, t, t, top, MAHOGANY),
      ...box(x + t, fy, seat + 0.05, s - 2 * t, 0.012, top - seat - 0.09, VELVET),
      { ...line([[x + t + 0.006, fy + 0.0125, seat + 0.056], [x + t + 0.006, fy + 0.0125, top - 0.046], [x + s - t - 0.006, fy + 0.0125, top - 0.046], [x + s - t - 0.006, fy + 0.0125, seat + 0.056]], GOLD[0], 1), dash: "0.1 1.5" },
      filled([[x, fy + t, top - 0.03], [x + s, fy + t, top - 0.03], ...crest], [GOLD[0], GOLD[1], GOLD[2]], [x, fy, top], [x + s, fy, top - 0.03], GOLD[2]),
      line([[x + s / 2, fy + t + 0.001, top - 0.03], [x + s / 2, fy + t + 0.001, top - 0.012]], GOLD[2], 0.45),
      ...finial(x + t / 2, y + t / 2),
      ...finial(x + s - t / 2, y + t / 2),
      ...leg(x, y + s - t),
      ...leg(x + s - t, y + s - t),
      ...seatParts(),
    );
  } else {
    const bx = x + s - t;
    shapes.push(
      ...leg(x, y),
      ...leg(x, y + s - t),
      ...seatParts(),
      ...box(bx, y, 0, t, t, top, MAHOGANY),
      ...box(bx, y + t, seat + 0.05, 0.012, s - 2 * t, top - seat - 0.09, MAHOGANY),
      ...panel("shade", bx + 0.012, y + t + 0.01, y + s - t - 0.01, seat + 0.07, top - 0.06, MAHOGANY[2]),
      ...box(bx, y + s - t, 0, t, t, top, MAHOGANY),
      ...box(bx - 0.002, y, top - 0.03, t + 0.004, s, 0.024, GOLD),
      ...finial(bx + t / 2, y + t / 2),
      ...finial(bx + t / 2, y + s - t / 2),
    );
  }
  return shapes;
}

/** A wingback armchair at (x, y), w × d, facing +y, its back along y: turned legs on brass
 *  castors, a tufted back with wings, rolled arms with a scroll at the
 *  front, a loose seat cushion, and brass nailheads along the skirt. */
export function wingChair(x: number, y: number, w: number, d: number, cloth: Tones = DEEP_VELVET, wood: Tones = WARM_MAHOGANY): Shape[] {
  const X = x + w;
  const Y = y + d;
  const legH = 0.04;
  const seat = 0.14;
  const armW = 0.045;
  const backD = 0.05;
  const backH = 0.42;
  const darker = cloth.map((c) => tone(c, -0.1)) as Tones;
  const tufts: Shape[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const u = x + armW + 0.025 + ((w - 2 * armW - 0.05) * (j + (i % 2) * 0.5)) / 2.5;
      if (u > X - armW - 0.015) continue;
      const zt = seat + 0.07 + i * 0.07;
      tufts.push(
        { ...line([[u - 0.025, y + backD, zt - 0.035], [u, y + backD, zt], [u + 0.025, y + backD, zt - 0.035]], cloth[2], 0.45), opacity: 0.7 },
        ball([u, y + backD, zt], 0.34, tone(cloth[2], -0.3)),
      );
    }
  }
  // a wing in profile: up from the arm, out to the front, back to the crest
  const wingAt = (yy: number, zz: number): [number, number] => [yy, zz];
  const profile = [
    wingAt(y + backD * 0.5, backH - 0.01),
    wingAt(y + backD + 0.035, backH - 0.025),
    wingAt(y + backD + 0.075, backH - 0.07),
    wingAt(y + backD + 0.095, seat + 0.13),
    wingAt(y + backD + 0.085, seat + 0.05),
  ];
  const wing = (xa: number, xb: number, faceTone: string): Shape[] => {
    const edge = [...profile.map(([py, pz]) => [xa, py, pz] as V3), ...profile.map(([py, pz]) => [xb, py, pz] as V3).reverse()];
    const face: V3[] = [[xb, y + backD * 0.5, seat + 0.05], ...profile.map(([py, pz]) => [xb, py, pz] as V3)];
    return [
      gradPoly(edge, [tone(cloth[0], 0.2), cloth[0]], [xa, y, backH], [xb, Y, seat], tone(cloth[2], -0.5), 0.5),
      gradPoly(face, [tone(faceTone, 0.12), faceTone, tone(faceTone, -0.2)], [xb, y, backH], [xb, Y, seat], tone(cloth[2], -0.5), 0.5),
      { ...line(profile.slice(1, 4).map(([py, pz]) => [xb, py - 0.008, pz - 0.012] as V3), tone(faceTone, -0.3), 0.4), opacity: 0.6 },
    ];
  };
  const rollFront = (ax: number): Shape[] => {
    const [cx, cy] = P(ax + armW / 2, Y - 0.004, seat + 0.03);
    const r = armW * 0.62 * unit();
    return [
      { d: path(ellipsePoints(cx, cy, r, r * 1.05, 14)), fill: cloth[1], grad: { colors: [tone(cloth[1], 0.25), cloth[1], cloth[2]], from: [cx - r * 0.4, cy - r * 0.5], radius: r * 1.5 }, stroke: tone(cloth[2], -0.5), strokeWidth: 0.45 },
      { d: `M${n(cx + r * 0.5)} ${n(cy)} A${n(r * 0.5)} ${n(r * 0.5)} 0 1 1 ${n(cx)} ${n(cy - r * 0.5)} A${n(r * 0.3)} ${n(r * 0.3)} 0 1 1 ${n(cx - r * 0.2)} ${n(cy + r * 0.1)}`, stroke: tone(cloth[2], -0.35), strokeWidth: 0.4 },
      ball([ax + armW / 2, Y - 0.002, seat + 0.03], 0.3, GILT[1], WARM_INK),
    ];
  };
  return [
    shadow(x, y, w, d),
    // legs and castors
    ...[[x + 0.012, y + 0.012], [X - 0.034, y + 0.012], [x + 0.012, Y - 0.034], [X - 0.034, Y - 0.034]].flatMap(([lx, ly]) => [
      ...box(lx, ly, 0.008, 0.022, 0.022, legH - 0.008, wood),
      ball([lx + 0.011, ly + 0.011, 0.005], 0.45, BRASS[1], BRASS[2]),
    ]),
    // the back, its crest rising in a curve, buttoned
    ...box(x + armW * 0.6, y, legH, w - armW * 1.2, backD, backH - legH, cloth),
    gradPoly(
      [[x + armW * 0.6, y + backD, backH], [x + w * 0.3, y + backD, backH + 0.03], [x + w * 0.7, y + backD, backH + 0.03], [X - armW * 0.6, y + backD, backH]],
      [tone(cloth[1], 0.2), cloth[1]],
      [x, y + backD, backH + 0.03],
      [X, y + backD, backH],
      tone(cloth[2], -0.5),
      0.5,
    ),
    ...tufts,
    // the far wing and arm, the seat, the cushion, the near wing and arm
    ...wing(x, x + armW * 0.8, cloth[1]),
    ...box(x, y + backD * 0.5, legH, armW, d - backD * 0.5, seat + 0.05 - legH, cloth),
    ...rollFront(x),
    ...box(x + armW, y + backD, legH, w - 2 * armW, d - backD, seat - legH, darker),
    { ...line([[x + armW + 0.006, Y, legH + 0.02], [X - armW - 0.006, Y, legH + 0.02]], GILT[1], 0.9), dash: "0.1 1.9" },
    ...box(x + armW + 0.004, y + backD + 0.004, seat, w - 2 * armW - 0.008, d - backD - 0.01, 0.035, cloth),
    line([[x + armW + 0.004, Y - 0.006, seat + 0.035], [X - armW - 0.004, Y - 0.006, seat + 0.035]], tone(cloth[0], 0.25), 0.5),
    ...wing(X - armW * 0.8, X, cloth[2]),
    ...box(X - armW, y + backD * 0.5, legH, armW, d - backD * 0.5, seat + 0.05 - legH, cloth),
    ...rollFront(X - armW),
    { ...line([[X, y + backD, legH + 0.02], [X, Y - 0.01, legH + 0.02]], GILT[1], 0.9), dash: "0.1 1.9" },
  ];
}

/** A pew facing the right-hand wall, from x to x + w at depth y: carved
 *  end boards with finials, a panelled back with a capping rail, and a
 *  book ledge with hymn books on it. */
export function pew(x: number, y: number, w: number, tones: Tones = WOOD): Shape[] {
  const t = 0.022;
  const d = 0.1;
  const back = 0.2;
  const endH = 0.235;
  const X = x + w;
  const Y = y + d;
  const shapes: Shape[] = [
    tint([[x + 0.02, y + 0.03, 0], [X + 0.05, y + 0.03, 0], [X + 0.05, Y + 0.02, 0], [x + 0.02, Y + 0.02, 0]], INK.night, 0.3),
    ...box(x, y, 0, t, d, endH, tones),
    ...box(x + t, y, 0.085, w - 2 * t, d - 0.025, 0.02, tones),
    ...box(x + t, Y - 0.025, 0, w - 2 * t, 0.025, back, tones),
  ];
  const panels = Math.max(2, Math.round((w - 2 * t) / 0.1));
  for (let i = 0; i < panels; i++) {
    const u1 = x + t + 0.012 + ((w - 2 * t - 0.024) * i) / panels;
    const u2 = x + t + 0.012 + ((w - 2 * t - 0.024) * (i + 1)) / panels - 0.01;
    shapes.push(...panel("lit", Y, u1, u2, 0.03, back - 0.035, tones[1]));
  }
  shapes.push(
    ...box(x + t - 0.004, Y - 0.032, back, w - 2 * t + 0.008, 0.036, 0.014, tones),
    // the book ledge and its books
    ...box(x + t + 0.01, Y, 0.135, w - 2 * t - 0.02, 0.022, 0.01, tones),
    ...box(x + t + 0.03, Y + 0.002, 0.145, 0.016, 0.016, 0.034, [tone(CRIMSON, 0.15), CRIMSON, tone(CRIMSON, -0.3)]),
    ...box(x + t + 0.048, Y + 0.002, 0.145, 0.014, 0.016, 0.03, ["#4A5E9A", "#33467E", "#25335E"]),
    ...box(X - t - 0.05, Y + 0.002, 0.145, 0.016, 0.016, 0.034, [tone(CRIMSON, 0.15), CRIMSON, tone(CRIMSON, -0.3)]),
    ...box(X - t, y, 0, t, d, endH, tones),
    ...panel("shade", X, y + 0.016, Y - 0.016, 0.03, endH - 0.07, tones[2]),
    ball([X, y + d / 2, endH - 0.04], 0.42, PALE_GILT[1], inkOf(PALE_GILT[1])),
    ball([x + t / 2, Y - 0.012, endH + 0.008], 0.7, tones[0], inkOf(tones[0])),
    ball([X - t / 2, Y - 0.012, endH + 0.008], 0.7, tones[0], inkOf(tones[0])),
  );
  return shapes;
}

/** A long gallery bench along y at (x, y), w × d, its seat at h: turned legs with gilt feet, a moulded
 *  frame and a velvet cushion with piping, buttons and corner tassels. */
export function galleryBench(x: number, y: number, w: number, d: number, h: number, tones: Tones = WARM_MAHOGANY, cushion: Tones = DEEP_VELVET): Shape[] {
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
      ball([tx, ty, top - 0.044], 0.5, GILT[1], WARM_INK),
    ]),
  ];
}

/** A three-legged stool at (x, y). */
export function stool(x: number, y: number): Shape[] {
  const h = 0.13;
  const r = 0.042;
  return [
    disc(x + 0.025, y + 0.01, 0, r, INK.night, undefined, 0.28),
    strokes(
      [[-0.7, -0.7], [0.95, -0.2], [-0.2, 0.95]].map(([dx, dy]): V3[] => [[x + dx * r * 0.7, y + dy * r * 0.7, h], [x + dx * r * 1.05, y + dy * r * 1.05, 0]]),
      tone(OAK[2], -0.4),
      2.6,
    ),
    strokes(
      [[0.95, -0.2], [-0.2, 0.95]].map(([dx, dy]): V3[] => [[x + dx * r * 0.7, y + dy * r * 0.7, h], [x + dx * r * 1.05, y + dy * r * 1.05, 0]]),
      OAK[1],
      1.6,
    ),
    ...cylinder(x, y, h, r, 0.016, OAK),
  ];
}

/** A soft block (a pillow, a cushion, a folded blanket): the outline
 *  of a box with its corners rounded, lit from the upper left, a seam
 *  along its top's near edges. */
export function softBox(x: number, y: number, z: number, w: number, d: number, h: number, fill: string): Shape[] {
  const [X, Y, Z] = [x + w, y + d, z + h];
  const corners = hull(
    ([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z], [X, y, z], [X, Y, z], [x, Y, z]] as V3[]).map(Pv),
  );
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(corners[corners.length - 1], corners[0]);
  let d2s = `M${n(start[0])} ${n(start[1])}`;
  corners.forEach((c, i) => {
    const m = mid(c, corners[(i + 1) % corners.length]);
    d2s += ` Q${n(c[0])} ${n(c[1])} ${n(m[0])} ${n(m[1])}`;
  });
  const [cx, cy] = Pv([x + w * 0.3, y + d * 0.3, Z]);
  const seam = ([[x + w * 0.1, Y - d * 0.06, Z], [X - w * 0.06, Y - d * 0.06, Z], [X - w * 0.06, y + d * 0.1, Z]] as V3[]).map(Pv);
  return [
    { d: d2s + " Z", fill, grad: { colors: [tone(fill, 0.45), fill, tone(fill, -0.3)], from: [cx, cy], radius: Math.max(w, d) * unit() * 1.3 }, stroke: inkOf(fill), strokeWidth: 0.5 },
    { d: `M${n(seam[0][0])} ${n(seam[0][1])} Q${n(seam[1][0])} ${n(seam[1][1] + 0.6)} ${n(seam[2][0])} ${n(seam[2][1])}`, stroke: tone(fill, -0.22), strokeWidth: 0.45, opacity: 0.8 },
  ];
}

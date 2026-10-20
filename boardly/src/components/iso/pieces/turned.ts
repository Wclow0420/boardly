// Turned (round) bodies drawn from a profile: three lathes that each
// draw a little differently, so each keeps the rooms that use it looking
// as they do.
//  - turned: the house sheen (four stops), a shine down the lit side and
//    an open top; profile is [radius, height] (vases, goblets, finials).
//  - turnedBody: one shape lit from the left; profile [height, radius]
//    (the Greek urn, a bust's socle).
//  - lathe: stone or iron tones, a top ellipse and rings at `beads`;
//    profile [height, radius] (a garden urn, a lamp post).

import {
  inkOf,
  n,
  P,
  path,
  tone,
  unit,
  type Pt,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { oval } from "../room";

/** A turned piece standing at `at` (a vase, a goblet, a finial, a
 *  candlestick): `profile` is its radius at each height, bottom to top,
 *  in world units. Drawn as its outline with a sheen across it, a shine
 *  down its lit side, and the ellipse of its top (`top`, a colour: wine
 *  in a glass, the dark of a vase's mouth) when it is open or flat. */
export function turned(at: V3, profile: [number, number][], colors: string[], top?: string): Shape[] {
  const s = unit();
  const rings = profile.map(([r, h]) => {
    const [cx, cy] = P(at[0], at[1], at[2] + h);
    return { cx, cy, rx: Math.max(r, 0.001) * s * 1.2247, ry: Math.max(r, 0.001) * s * 0.7071 };
  });
  const b = rings[0];
  const t = rings[rings.length - 1];
  const wide = Math.max(...rings.map((r) => r.rx));
  const fill = colors[1];
  const left = rings.map((r) => `${n(r.cx - r.rx)} ${n(r.cy)}`).join(" L");
  const right = [...rings]
    .reverse()
    .map((r) => `${n(r.cx + r.rx)} ${n(r.cy)}`)
    .join(" L");
  const shapes: Shape[] = [
    {
      d: `M${left} L${right} A${n(b.rx)} ${n(b.ry)} 0 0 1 ${n(b.cx - b.rx)} ${n(b.cy)} Z`,
      fill,
      grad: { colors, from: [b.cx - wide * 0.8, t.cy], to: [b.cx + wide, t.cy] },
      stroke: inkOf(fill),
      strokeWidth: 0.5,
    },
  ];
  if (wide > 1.6) {
    shapes.push({
      d: rings
        .slice(1, -1)
        .map((r, i) => `${i ? "L" : "M"}${n(r.cx - r.rx * 0.55)} ${n(r.cy)}`)
        .join(" "),
      stroke: "#FFFFFF",
      strokeWidth: 0.5,
      opacity: 0.45,
    });
  }
  if (top) {
    shapes.push({ d: oval(t.cx, t.cy, t.rx, t.ry), fill: top, stroke: inkOf(fill), strokeWidth: 0.45 });
  }
  return shapes;
}

/** A turned (round) body standing at (x, y, z): `profile` gives its
 *  radius at heights up it, bottom to top. Lit from the left. */
export function turnedBody(x: number, y: number, z: number, profile: [number, number][], colors: string[], ink: string): Shape {
  const [cx] = P(x, y, z);
  const k = unit() * 1.2247;
  const left = profile.map(([h, r]) => [cx - r * k, P(x, y, z + h)[1]] as Pt);
  const right = profile.map(([h, r]) => [cx + r * k, P(x, y, z + h)[1]] as Pt).reverse();
  const top = P(x, y, z + profile[profile.length - 1][0]);
  const widest = Math.max(...profile.map(([, r]) => r)) * k;
  return {
    d: path([...left, ...right]),
    fill: colors[1],
    grad: { colors, from: [cx - widest * 0.8, top[1]], to: [cx + widest, top[1]] },
    stroke: ink,
    strokeWidth: 0.5,
  };
}

/** A turned shape standing at (x, y, z): `profile` is [height, radius]
 *  pairs from the foot up. Lit round from the left, its top an ellipse,
 *  a ring at each `beads` height. */
export function lathe(x: number, y: number, z: number, profile: [number, number][], tones: Tones, beads: number[] = []): Shape[] {
  const s = unit();
  const [cx] = P(x, y, z);
  const yAt = (h: number) => P(x, y, z + h)[1];
  const rx = (r: number) => r * s * 1.2247;
  const ry = (r: number) => r * s * 0.7071;
  const pts: Pt[] = [];
  for (const [h, r] of profile) pts.push([cx - rx(r), yAt(h)]);
  const [ht, rt] = profile[profile.length - 1];
  for (const [h, r] of [...profile].reverse()) pts.push([cx + rx(r), yAt(h)]);
  const [h0, r0] = profile[0];
  for (let i = 1; i < 12; i++) {
    const t = (i / 12) * Math.PI;
    pts.push([cx + Math.cos(t) * rx(r0), yAt(h0) + Math.sin(t) * ry(r0)]);
  }
  const wide = Math.max(...profile.map(([, r]) => r));
  const [top, lit] = tones;
  return [
    {
      d: path(pts),
      fill: lit,
      grad: { colors: [tone(lit, 0.3), lit, tone(lit, -0.45)], from: [cx - rx(wide) * 0.8, yAt(ht)], to: [cx + rx(wide), yAt(ht)] },
      stroke: inkOf(lit),
      strokeWidth: 0.55,
    },
    ...beads.map((h) => {
      const r = profile.reduce((best, p) => (Math.abs(p[0] - h) < Math.abs(best[0] - h) ? p : best))[1];
      return { d: `M${n(cx - rx(r))} ${n(yAt(h))} A${n(rx(r))} ${n(ry(r))} 0 0 0 ${n(cx + rx(r))} ${n(yAt(h))}`, stroke: inkOf(lit), strokeWidth: 0.5, opacity: 0.8 };
    }),
    {
      d: `M${n(cx - rx(rt))} ${n(yAt(ht))} a${n(rx(rt))} ${n(ry(rt))} 0 1 0 ${n(2 * rx(rt))} 0 a${n(rx(rt))} ${n(ry(rt))} 0 1 0 ${n(-2 * rx(rt))} 0 Z`,
      fill: top,
      grad: { colors: [tone(top, 0.2), top, tone(top, -0.15)], from: [cx - rx(rt), yAt(ht) - ry(rt)], to: [cx + rx(rt), yAt(ht) + ry(rt)] },
      stroke: inkOf(top),
      strokeWidth: 0.5,
    },
  ];
}

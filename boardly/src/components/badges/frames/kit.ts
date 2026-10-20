// Pieces for badge frames, as EmblemData in the 120 × 120 badge box
// (centre 60, 60): rings, beads, laurel, crystal rays, cut gems. Angles
// are in degrees from the top, clockwise. See frames/boardly.ts for how
// they go together, and BadgeFrame (../types) for what a frame is.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import { INKS, LEAF, type Material } from "@/components/engraved/shapes";

export const C = 60;
const f = (n: number) => +n.toFixed(2);

/** The point `r` from the centre at `deg` from the top. */
export function at(deg: number, r: number, cx = C, cy = C): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)];
}

/** A circle as path data. */
export const circle = (r: number, cx = C, cy = C) =>
  `M${f(cx - r)} ${cy}A${r} ${r} 0 1 0 ${f(cx + r)} ${cy}A${r} ${r} 0 1 0 ${f(cx - r)} ${cy}Z`;

/** An arc along radius `r` from `a0` to `a1` degrees (clockwise). */
export function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = at(a0, r);
  const [x1, y1] = at(a1, r);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** A ring between two radii (draw even-odd), with its engraved groove
 *  and the line of light on its upper left. */
/** An engraved shape part (not a jewel, hole or line). */
export type Shape = Extract<EmblemPart, { d: string }>;

export function ring(outer: number, inner: number, m: Material): Shape {
  return {
    d: circle(outer) + circle(inner),
    m,
    evenOdd: true,
    vein: circle((outer + inner) / 2),
    shine: arc(outer - 1.4, -70, -20),
    ink: 1.3,
    vw: 0.7,
    sw: 1.2,
  };
}

/** The enamel disc the emblem sits on (takes the game's colour). */
export const disc = (r: number): EmblemPart => ({
  d: circle(r),
  m: "tint",
  round: true,
  ink: 1.2,
});

/** `n` beads round radius `r`, from `a0` to `a1` (a full turn by default). */
export function beads(
  r: number,
  n: number,
  size: number,
  m: Material,
  a0 = 0,
  a1 = 360,
): EmblemPart[] {
  const full = a1 - a0 >= 360;
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = at(a0 + ((a1 - a0) * i) / (full ? n : n - 1), r);
    return { d: circle(size, x, y), m, round: true, ink: 0.6 };
  });
}

/** A branch of laurel following radius `r` from `a0` to `a1` degrees:
 *  a stem with `n` pairs of leaves, one either side, leaning the way it
 *  grows, and a leaf at its tip. */
export function laurel(
  r: number,
  a0: number,
  a1: number,
  n: number,
  len: number,
  w: number,
  m: Material,
): EmblemPart[] {
  const dir = Math.sign(a1 - a0);
  const leaf = (deg: number, rr: number, lean: number): EmblemPart => {
    const [x, y] = at(deg, rr);
    return {
      d: LEAF(len, w),
      m,
      vein: `M0 -1L0 ${-len + 2}`,
      ink: 0.8,
      vw: 0.5,
      // along the stem, the way it grows (+90 clockwise), leaning out or in
      t: `translate(${x} ${y}) rotate(${f(deg + dir * 90 + lean * dir)})`,
    };
  };
  const parts: EmblemPart[] = [
    { line: arc(r, Math.min(a0, a1), Math.max(a0, a1)), color: INKS[m].vein, w: 1.6 },
  ];
  for (let i = 0; i < n; i++) {
    const deg = a0 + ((a1 - a0) * (i + 0.3)) / n;
    parts.push(leaf(deg, r + 0.6, -38), leaf(deg, r - 0.6, 38));
  }
  parts.push(leaf(a1, r, 0));
  return parts;
}

/** A star of crystal shards behind the badge: `n` rays from `r0` out
 *  to `r1`, each `w` degrees wide at its base, starting at `from`
 *  degrees. Each is cut down its middle: a lit face (`m`) and a shaded
 *  one (`shade`). */
export function rays(
  n: number,
  r0: number,
  r1: number,
  w: number,
  m: Material,
  from = 0,
  shade: Material | `#${string}` = "#9CB8D8",
): EmblemPart[] {
  return Array.from({ length: n }, (_, i) => {
    const deg = from + (360 * i) / n;
    const [tx, ty] = at(deg, r1);
    const [lx, ly] = at(deg - w / 2, r0);
    const [rx, ry] = at(deg + w / 2, r0);
    const [mx, my] = at(deg, r0 - 4);
    return [
      { d: `M${mx} ${my}L${lx} ${ly}L${tx} ${ty}Z`, m, ink: 0.8 },
      { d: `M${mx} ${my}L${tx} ${ty}L${rx} ${ry}Z`, m: shade, ink: 0.8 },
    ] as EmblemPart[];
  }).flat();
}

/** A cut gem (a brilliant seen face-on): its table, crown facets and a
 *  sparkle, `w` wide at (x, y). */
export function gem(x: number, y: number, w: number, m: Material = "platinum"): EmblemData {
  const h = w * 0.82;
  const top = y - h * 0.42;
  const girdle = y - h * 0.1;
  const tip = y + h * 0.58;
  const outline = `M${f(x - w * 0.3)} ${f(top)}H${f(x + w * 0.3)}L${f(x + w / 2)} ${f(girdle)}L${x} ${f(tip)}L${f(x - w / 2)} ${f(girdle)}Z`;
  const facets =
    `M${f(x - w / 2)} ${f(girdle)}H${f(x + w / 2)}` +
    `M${f(x - w * 0.3)} ${f(top)}L${f(x - w * 0.12)} ${f(girdle)}L${x} ${f(tip)}` +
    `M${f(x + w * 0.3)} ${f(top)}L${f(x + w * 0.12)} ${f(girdle)}L${x} ${f(tip)}` +
    `M${f(x - w * 0.12)} ${f(girdle)}L${x} ${f(top)}L${f(x + w * 0.12)} ${f(girdle)}`;
  return [
    { d: outline, m, vein: facets, shine: `M${f(x - w * 0.22)} ${f(top + 1.2)}L${f(x - w * 0.05)} ${f(top + 1.2)}`, ink: 1, vw: 0.55 },
  ];
}

/** Every path's outline in some parts, joined: what the light sweeps. */
export const outlines = (parts: EmblemData) =>
  parts.map((p) => ("d" in p && !p.t ? p.d : "")).join("");

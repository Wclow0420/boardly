// Gilt panels as SVG markup, shared by the app's framed pages and
// popups (the badge hall, a game's popup): gradients, a gilded moulding
// with its groove and shine, and the corner pieces (a beaded rosette
// set with a jewel, acanthus along both edges, a fan of leaves).

import { toSvgBody, type EmblemData } from "./emblem";
import { INKS, LEAF, MATERIALS, acanthus, curl, type Jewel } from "./shapes";
import { rrect } from "./trim";

const f = (n: number) => +n.toFixed(2);

export const stops = (colors: readonly string[], opacity?: number[]) =>
  colors
    .map(
      (c, i) =>
        `<stop offset="${f(i / Math.max(1, colors.length - 1))}" stop-color="${c}"${opacity ? ` stop-opacity="${opacity[i]}"` : ""}/>`,
    )
    .join("");
export const linear = (id: string, colors: readonly string[], vertical = true, opacity?: number[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors, opacity)}</linearGradient>`;
export const radial = (id: string, colors: readonly string[], opacity?: number[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, opacity)}</radialGradient>`;

/** A corner piece (top-left; mirror it for the others): a beaded gold
 *  rosette set with a ruby on the corner, acanthus running out along both
 *  edges, and a fan of leaves behind. */
function cornerParts(jewel: Jewel): EmblemData {
  const gold = (p: { outline: string; vein: string }) => ({
    d: p.outline,
    m: "gold" as const,
    vein: p.vein,
    ink: 1,
    vw: 0.55,
  });
  const edge = [
    ...acanthus(24, 17, -0.08, 84, 2.5, 9, true),
    curl(24, 20, 0.5, 35, 3.6, 5, 0.6),
  ].map(gold);
  // the same along the other edge: mirrored across the diagonal
  const swap = (d: string) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${y} ${x}`);
  const down = edge.map((p) => ({ ...p, d: swap(p.d), vein: swap(p.vein) }));
  const fan = [-28, 0, 28].map((a) => ({
    d: LEAF(a ? 20 : 26, a ? 6 : 7.5),
    m: "gold" as const,
    vein: `M0 -1L0 ${a ? -18 : -24}`,
    ink: 0.9,
    vw: 0.5,
    t: `translate(14 14) rotate(${135 + a})`,
  }));
  const beads = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x = f(14 + Math.cos(a) * 8.2);
    const y = f(14 + Math.sin(a) * 8.2);
    return { d: `M${f(x - 1.2)} ${y}A1.2 1.2 0 1 0 ${f(x + 1.2)} ${y}A1.2 1.2 0 1 0 ${f(x - 1.2)} ${y}Z`, m: "gold" as const, round: true, ink: 0.4 };
  });
  return [
    ...fan,
    ...edge,
    ...down,
    { d: "M14 3A11 11 0 1 0 14.01 3Z", m: "gold", round: true, ink: 1.1 },
    ...beads,
    { jewel, x: 14, y: 14, r: 4.6 },
  ];
}

/** Corner pieces in all four corners of a w × h box, `inset` in,
 *  drawn at `scale`. */
export function corners(w: number, h: number, inset: number, scale: number, id: string, jewel: Jewel = "ruby") {
  const body = toSvgBody(cornerParts(jewel), undefined, id);
  const at = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx * scale)} ${f(sy * scale)})">${body}</g>`;
  return [
    at(inset, inset, 1, 1),
    at(w - inset, inset, -1, 1),
    at(inset, h - inset, 1, -1),
    at(w - inset, h - inset, -1, -1),
  ].join("");
}

/** A gilded moulding (a rounded frame `t` thick) with its groove, ink and
 *  one shine, as markup. */
export function moulding(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  t: number,
  id: string,
  metal: "gold" | "silver" = "gold",
) {
  const outer = rrect(x, y, w, h, r);
  const inner = rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(1, r - t));
  const groove = rrect(x + t / 2, y + t / 2, w - t, h - t, Math.max(1, r - t / 2));
  const { ink, vein } = INKS[metal];
  return (
    `<defs>${linear(id, MATERIALS[metal], false)}</defs>` +
    `<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#${id})"/>` +
    `<path d="${groove}" fill="none" stroke="${vein}" stroke-width="0.7" stroke-opacity="0.9"/>` +
    `<path d="M${f(x + r)} ${f(y + t * 0.4)}H${f(x + w * 0.4)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.9"/>` +
    `<path d="${outer}" fill="none" stroke="${ink}" stroke-width="1.3"/>` +
    `<path d="${inner}" fill="none" stroke="${ink}" stroke-width="0.9"/>`
  );
}


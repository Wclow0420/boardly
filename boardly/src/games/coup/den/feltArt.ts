// The gambling felt my turn is played on: green baize in a gilt rail
// with a crimson cushion, the layout printed on it in gold like a
// baccarat table — a box for each action, the safe ones along the top,
// the bluffs (each claiming a role) in the middle, the Shut Down across
// the foot. As SVG markup, baked once per size by Felt.

import { MATERIALS, INKS } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.5, cy = 0.4, r = 0.7) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const RAIL = 9;
const GAP = 7;

/** Where the boxes sit on a felt w × h: rows of two, the last row whole. */
export function feltLayout(w: number, h: number, rows: number[]) {
  const ix = RAIL + 8;
  const iy = RAIL + 8;
  const iw = w - 2 * ix;
  const ih = h - 2 * iy;
  const bh = (ih - GAP * (rows.length - 1)) / rows.length;
  const boxes: Box[] = [];
  rows.forEach((n, r) => {
    const bw = (iw - GAP * (n - 1)) / n;
    for (let i = 0; i < n; i++) boxes.push({ x: ix + i * (bw + GAP), y: iy + r * (bh + GAP), w: bw, h: bh });
  });
  return boxes;
}

/** The felt: the rail, the baize with its sheen, and the gold boxes
 *  (`claims[i]`: the box is a bluff, drawn with a double line). */
export function feltArt(w: number, h: number, boxes: Box[], claims: boolean[]) {
  const printed = boxes
    .map((b, i) => {
      const outer = `<path d="${rr(b.x, b.y, b.w, b.h, 9)}" fill="#000" fill-opacity="0.12" stroke="#E8C25A" stroke-opacity="0.85" stroke-width="1.3"/>`;
      const inner = claims[i]
        ? `<path d="${rr(b.x + 3.5, b.y + 3.5, b.w - 7, b.h - 7, 6)}" fill="none" stroke="#E8C25A" stroke-opacity="0.45" stroke-width="0.8"/>`
        : "";
      return outer + inner;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${lin("rail", ["#E04A52", "#A8182A", "#4A0610"])}
${lin("g", MATERIALS.gold, false)}
${rad("baize", ["#2E8A5A", "#1A6040", "#0C3420"])}
${rad("vig", ["#000000", "#000000"], [0, 0.55], 0.5, 0.45, 0.75)}
</defs>
<path d="${rr(1, 4, w - 2, h - 4, 22)}" fill="#000" fill-opacity="0.5"/>
<path d="${rr(0, 0, w, h - 3, 22)}" fill="url(#rail)" stroke="${INK}" stroke-width="1.2"/>
<path d="${rr(3, 3, w - 6, h - 9, 19)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1"/>
<path d="${rr(RAIL - 2, RAIL - 2, w - 2 * RAIL + 4, h - 2 * RAIL - 3 + 4, 16)}" fill="url(#g)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rr(RAIL, RAIL, w - 2 * RAIL, h - 2 * RAIL - 3, 14)}" fill="url(#baize)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rr(RAIL, RAIL, w - 2 * RAIL, h - 2 * RAIL - 3, 14)}" fill="url(#vig)"/>
${printed}
</svg>`;
}

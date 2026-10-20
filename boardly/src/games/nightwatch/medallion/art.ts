// Tonight's event medallion, hung in the arch's stone beside the windows:
// a round gold bezel on a little bail, beaded round its outer edge with a
// groove down the band, holding a glass dome over the night's emblem. As
// SVG markup, baked once by EventMedallion: the back (the nail in the
// stone, the bail, the bezel and the dark glass bed), the dome (its
// highlights, laid over the emblem) and the pips (one small garnet for
// each lasting effect of an earlier night).

import { INKS, JEWELS, MATERIALS } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
/** A circle as path data (Skia's SVG reader fills gradients on paths). */
const o = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/** Where the medallion's parts sit in its own box, for a bezel of outer
 *  radius `R`. */
export function medallionLayout(R: number) {
  const pad = 4;
  const bail = 10;
  const w = 2 * R + 2 * pad;
  const h = 2 * R + bail + 2 * pad;
  const cx = w / 2;
  const cy = pad + bail + R;
  /** The glass inside the bezel. */
  const g = R - Math.max(5, R * 0.24);
  return {
    w,
    h,
    cx,
    cy,
    R,
    g,
    /** Where it hangs from (it sways about this point). */
    pivot: { x: cx, y: pad + 3 },
    /** The lasting events' pips, along the bezel's lower left. */
    pips: [0, 1, 2].map((k) => {
      const a = ((128 + k * 19) * Math.PI) / 180;
      return { x: cx + Math.cos(a) * (R - 0.5), y: cy + Math.sin(a) * (R - 0.5) };
    }),
  };
}
export type MedallionLayout = ReturnType<typeof medallionLayout>;

/** The nail, the bail, the bezel and the dark glass bed. */
export function medallionBack(M: MedallionLayout) {
  const { w, h, cx, cy, R, g, pivot } = M;
  const mid = (R + g) / 2;
  const beads: string[] = [];
  const n = Math.round((2 * Math.PI * (R - 1.4)) / 3.6);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    beads.push(o(cx + Math.cos(a) * (R - 1.5), cy + Math.sin(a) * (R - 1.5), 1.05));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${lin("mg", MATERIALS.gold)}
${lin("mgv", MATERIALS.gold, 0, 1)}
${rad("bed", ["#3A5290", "#1A2754", "#070C1E"], undefined, 0.42, 0.36, 0.7)}
${rad("sh", ["#000000", "#000000"], [0.55, 0], 0.5, 0.5, 0.5)}
</defs>
<path d="${o(cx + 1.2, cy + 3, R + 2.5)}" fill="url(#sh)"/>
<path d="${o(pivot.x, pivot.y, 3.4)}" fill="url(#mg)" stroke="${INK}" stroke-width="0.8"/>
<path d="${o(pivot.x, pivot.y, 1.1)}" fill="#2A1A08"/>
<path d="M${f(cx)} ${f(pivot.y + 1.5)}c-4.6 0 -4.6 7.4 0 7.4c4.6 0 4.6 -7.4 0 -7.4Z" fill="none" stroke="${INK}" stroke-width="3"/>
<path d="M${f(cx)} ${f(pivot.y + 1.5)}c-4.6 0 -4.6 7.4 0 7.4c4.6 0 4.6 -7.4 0 -7.4Z" fill="none" stroke="url(#mgv)" stroke-width="1.7"/>
<path d="M${f(cx - 3.4)} ${f(cy - R + 1.5)}l1 -5.4h4.8l1 5.4Z" fill="url(#mgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="${o(cx, cy, R)}${o(cx, cy, g)}" fill="url(#mg)" fill-rule="evenodd" stroke="${INK}" stroke-width="1.2"/>
<path d="${beads.join("")}" fill="#FFF2B8" stroke="${VEIN}" stroke-width="0.45"/>
<path d="${o(cx, cy, mid - 0.6)}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
<path d="${o(cx, cy, mid + 0.6)}" fill="none" stroke="#FFF6D0" stroke-opacity="0.7" stroke-width="0.5"/>
<path d="M${f(cx - Math.cos(0.5) * (R - 3.4))} ${f(cy - Math.sin(0.5) * (R - 3.4))}A${f(R - 3.4)} ${f(R - 3.4)} 0 0 1 ${f(cx + Math.cos(2.0) * (R - 3.4))} ${f(cy - Math.sin(2.0) * (R - 3.4))}" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-opacity="0.9" transform="rotate(-62 ${f(cx)} ${f(cy)})"/>
<path d="${o(cx, cy, g)}" fill="url(#bed)" stroke="${INK}" stroke-width="1"/>
</svg>`;
}

/** The glass dome: dark at its rim, a broad soft highlight on the upper
 *  left, a bright point and a thin reflection on the lower right. */
export function medallionDome(M: MedallionLayout) {
  const { w, h, cx, cy, g } = M;
  const r = g - 0.6;
  // the broad highlight: a crescent hugging the upper left
  const a0 = (200 * Math.PI) / 180;
  const a1 = (300 * Math.PI) / 180;
  const p = (a: number, rr: number, ox = 0, oy = 0) => `${f(cx + ox + Math.cos(a) * rr)} ${f(cy + oy + Math.sin(a) * rr)}`;
  const crescent = `M${p(a0, r * 0.9)}A${f(r * 0.9)} ${f(r * 0.9)} 0 0 1 ${p(a1, r * 0.9)}A${f(r * 1.05)} ${f(r * 1.05)} 0 0 0 ${p(a0, r * 0.9)}Z`;
  const inner = `M${p(a0 + 0.12, r * 0.86)}A${f(r * 0.86)} ${f(r * 0.86)} 0 0 1 ${p(a1 - 0.1, r * 0.86)}A${f(r * 0.62)} ${f(r * 0.62)} 0 0 0 ${p(a0 + 0.12, r * 0.86)}Z`;
  const low0 = (25 * Math.PI) / 180;
  const low1 = (75 * Math.PI) / 180;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${rad("rim", ["#000000", "#000000", "#000000"], [0, 0.08, 0.5], 0.5, 0.5, 0.5)}
<linearGradient id="hl" x1="0" y1="0" x2="1" y2="1">${stops(["#FFFFFF", "#FFFFFF"], [0.75, 0.05])}</linearGradient>
</defs>
<path d="${o(cx, cy, r)}" fill="url(#rim)"/>
<path d="${inner}" fill="url(#hl)"/>
<path d="${crescent}" fill="#FFFFFF" fill-opacity="0.35"/>
<path d="${o(cx - r * 0.42, cy - r * 0.5, Math.max(1.2, r * 0.09))}" fill="#FFFFFF" fill-opacity="0.95"/>
<path d="M${p(low0, r * 0.84)}A${f(r * 0.84)} ${f(r * 0.84)} 0 0 1 ${p(low1, r * 0.84)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;
}

/** `n` small garnets set in gold on the bezel's lower left (up to 3). */
export function medallionPips(M: MedallionLayout, n: number) {
  const { w, h } = M;
  const [light, body, deep] = JEWELS.ruby;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${lin("pg", MATERIALS.gold)}
${rad("pj", [light, body, deep], undefined, 0.36, 0.3, 0.75)}
</defs>
${M.pips
  .slice(0, Math.min(3, n))
  .map(
    ({ x, y }) =>
      `<path d="${o(x, y, 3.6)}" fill="url(#pg)" stroke="${INK}" stroke-width="0.8"/><path d="${o(x, y, 2.2)}" fill="url(#pj)" stroke="#3A0408" stroke-width="0.5"/><path d="${o(x - 0.7, y - 0.8, 0.6)}" fill="#FFFFFF"/>`,
  )
  .join("")}
</svg>`;
}

// The badge hall's crest, the art across the top of the screen, as SVG
// markup in parts (baked once into images by HallCrest, and looked over
// with scripts/hall-sheet.mjs): a night-iron canopy arching down to the
// middle with a gold trim, a fan of gold wings either side, a crimson
// enamel sign in a gilded frame with acanthus off its ends, a crown with
// a ruby above it, and a row of lamps beneath. What moves (the wings'
// sway, the ruby's glow, the lamps, the light, the glints) is HallCrest's.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { FEATHER, INKS, LEAF, MATERIALS, curl } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[]) =>
  colors.map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"/>`).join("");
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[]) =>
  `<radialGradient id="${id}" cx="0.36" cy="0.3" r="0.75">${stops(colors)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

/** Where everything sits, for a crest `w` wide whose content starts at
 *  `top` (below the status bar). */
export function crestLayout(w: number, top: number) {
  const signW = Math.min(224, w - 170);
  const signH = 48;
  const cx = w / 2;
  const signY = top + 40;
  const cy = signY + signH / 2;
  return {
    w,
    h: top + 140,
    cx,
    cy,
    sign: { x: cx - signW / 2, y: signY, w: signW, h: signH },
    // the wings grow from just inside the sign's ends
    root: { x: signW / 2 - 18, y: cy + 2 },
    // the palmette's foot, where the ruby is set
    crown: { x: cx, y: signY - 4 },
    ruby: { x: cx, y: signY - 7, r: 6.2 },
    lamps: [-2, -1, 0, 1, 2].map((k) => ({ x: cx + k * 22, y: signY + signH + 12 })),
    edge: top + 98,
    dip: top + 132,
  };
}
export type CrestLayout = ReturnType<typeof crestLayout>;

/** The canopy: night iron arching down to the middle, a gold trim along
 *  its lower edge with rivets, a fine engraved border pattern. */
export function canopy(L: CrestLayout) {
  const { w, h, edge, dip, cx } = L;
  const curve = `M0 ${edge}Q${f(cx * 0.55)} ${edge} ${cx} ${dip}Q${f(w - cx * 0.55)} ${edge} ${w} ${edge}`;
  const shape = `M0 0H${w}V${edge}Q${f(w - cx * 0.55)} ${edge} ${cx} ${dip}Q${f(cx * 0.55)} ${edge} 0 ${edge}Z`;
  const rivets = Array.from({ length: 13 }, (_, i) => {
    const t = (i + 0.5) / 13;
    // along the curve (quadratic: two halves)
    const half = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [x0, y0, x1, y1, x2, y2] =
      t < 0.5 ? [0, edge, cx * 0.55, edge, cx, dip] : [cx, dip, w - cx * 0.55, edge, w, edge];
    const x = (1 - half) ** 2 * x0 + 2 * (1 - half) * half * x1 + half ** 2 * x2;
    const y = (1 - half) ** 2 * y0 + 2 * (1 - half) * half * y1 + half ** 2 * y2;
    return `<circle cx="${f(x)}" cy="${f(y - 9)}" r="2.2" fill="url(#cv)" stroke="${INK}" stroke-width="0.6"/>`;
  }).join("");
  return svg(
    w,
    h,
    `<defs>${lin("night", ["#2A2E3A", "#1A1C26", "#101118"])}${lin("cg", MATERIALS.gold)}${rad("cv", ["#FFF6D0", "#E2B04A", "#7A5212"])}</defs>
<path d="${shape}" fill="url(#night)"/>
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="10" transform="translate(0 4)" clip-path="none"/>
<path d="${curve}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="9" transform="translate(0 4)"/>
<path d="${curve}" fill="none" stroke="${INK}" stroke-width="8.4"/>
<path d="${curve}" fill="none" stroke="url(#cg)" stroke-width="6"/>
<path d="${curve}" fill="none" stroke="${VEIN}" stroke-width="0.8" transform="translate(0 0.4)"/>
<path d="${curve}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.9" transform="translate(0 -1.8)"/>
${rivets}`,
  );
}

/** One wing (the right; HallCrest mirrors it for the left), drawn about
 *  its root at (0, 0): seven gold feathers fanning from up-and-out to
 *  down-and-out, the long ones behind, and a band over their roots.
 *  Returns the art in a box `size` square centred on the root. */
export function wing(size = 210) {
  const fan: [number, number, number][] = [
    // [angle from up, clockwise; length; width]
    [124, 50, 8],
    [109, 66, 9],
    [95, 80, 9.5],
    [81, 88, 10],
    [67, 84, 10],
    [53, 72, 9.5],
    [40, 56, 8.5],
    [29, 40, 7],
  ];
  const feathers: EmblemData = fan.map(([a, len, wd], i) => ({
    d: FEATHER(len, wd),
    m: i % 2 ? ("gold" as const) : ("ivory" as const),
    vein: `M0 -2L0 ${-len + 6}`,
    shine: `M${-wd * 0.45} ${-len * 0.25}L${-wd * 0.5} ${-len * 0.7}`,
    ink: 1,
    vw: 0.7,
    sw: 0.8,
    t: `translate(${size / 2} ${size / 2}) rotate(${a})`,
  }));
  // the long ones (the middle) drawn first, so they sit behind
  const order = [3, 4, 2, 5, 1, 6, 0, 7].map((i) => feathers[i]);
  const band: EmblemData = [
    {
      d: `M${size / 2 - 4} ${size / 2 - 11}C${size / 2 + 12} ${size / 2 - 14} ${size / 2 + 18} ${size / 2 + 2} ${size / 2 + 12} ${size / 2 + 13}C${size / 2 + 4} ${size / 2 + 16} ${size / 2 - 6} ${size / 2 + 10} ${size / 2 - 6} ${size / 2}Z`,
      m: "gold",
      vein: `M${size / 2 - 1} ${size / 2 - 8}C${size / 2 + 10} ${size / 2 - 9} ${size / 2 + 13} ${size / 2 + 3} ${size / 2 + 8} ${size / 2 + 10}`,
      round: true,
      ink: 1.1,
    },
  ];
  return svg(size, size, toSvgBody([...order, ...band], undefined, "w"));
}

/** The sign (crimson enamel in a gilded frame, acanthus off its ends),
 *  the crown above it with its ruby, and the lamps' gold cups. */
export function signArt(L: CrestLayout) {
  const { sign, cx, crown, ruby, lamps, w, h } = L;
  const { x, y, w: sw, h: sh } = sign;
  const t = 5;
  const outer = rrect(x, y, sw, sh, 14);
  const inner = rrect(x + t, y + t, sw - 2 * t, sh - 2 * t, 10);
  const groove = rrect(x + t / 2, y + t / 2, sw - t, sh - t, 12);
  // a palmette over the sign: five gold leaves fanned up from the ruby,
  // a scroll curling off each side at its foot
  const base = { x: cx, y: crown.y };
  const leaves: EmblemData = [-56, -28, 0, 28, 56].map((a) => {
    const len = a === 0 ? 42 : Math.abs(a) === 28 ? 34 : 24;
    const wd = a === 0 ? 9 : 8;
    return {
      d: LEAF(len, wd),
      m: "gold" as const,
      vein: `M0 -2L0 ${-len + 3}`,
      ink: 1,
      vw: 0.6,
      t: `translate(${base.x} ${base.y}) rotate(${a})`,
    };
  });
  const curls: EmblemData = [1, -1].map((side) => {
    const p = curl(base.x + side * 6, base.y + 1, side > 0 ? -0.1 : Math.PI + 0.1, 36, side * -3.7, 7, 0.6);
    return { d: p.outline, m: "gold" as const, vein: p.vein, ink: 0.9, vw: 0.5 };
  });
  const palmette = toSvgBody([...curls, ...leaves], undefined, "pm");
  const cups = lamps
    .map((l) => `<circle cx="${l.x}" cy="${l.y}" r="5.6" fill="url(#g)" stroke="${INK}" stroke-width="0.9"/><circle cx="${l.x}" cy="${l.y}" r="3.8" fill="#5A1A04"/>`)
    .join("");
  return svg(
    w,
    h,
    `<defs>${lin("g", MATERIALS.gold, false)}${lin("enamel", ["#D2384A", "#9A1828", "#5A0812"])}${rad("rb", ["#FF9AA6", "#D0102E", "#5A0410"])}</defs>
${palmette}
<path d="${outer}" fill="#000" fill-opacity="0.45" transform="translate(0 3)"/>
<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#g)"/>
<path d="${inner}" fill="url(#enamel)"/>
<path d="M${f(x + 16)} ${y + 10}H${f(x + sw * 0.5)}" stroke="#fff" stroke-opacity="0.3" stroke-width="2.4" stroke-linecap="round"/>
<path d="${groove}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
<path d="M${f(x + 14)} ${y + 2.2}H${f(x + sw * 0.42)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
<path d="${outer}" fill="none" stroke="${INK}" stroke-width="1.3"/>
<path d="${inner}" fill="none" stroke="#3A0408" stroke-width="1"/>
<circle cx="${ruby.x}" cy="${ruby.y}" r="${ruby.r + 2}" fill="url(#g)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${ruby.x}" cy="${ruby.y}" r="${ruby.r}" fill="url(#rb)" stroke="${INK}" stroke-width="0.7"/>
<circle cx="${ruby.x - 1.7}" cy="${ruby.y - 1.8}" r="1.3" fill="#fff" fill-opacity="0.9"/>
${cups}`,
  );
}

/** The gold the light sweeps across: the sign's frame and the crown. */
export function sweepPath(L: CrestLayout) {
  const { x, y, w: sw, h: sh } = L.sign;
  return rrect(x, y, sw, sh, 14) + rrect(x + 5, y + 5, sw - 10, sh - 10, 10);
}

// The badge hall's still art, as SVG markup (drawn once by SvgXml, and
// looked over with scripts/hall-sheet.mjs): the velvet wall with its gold
// damask and gilded frame, the glass showcase with its pedestals, and
// the gold plates the collection sits on. Nothing here moves.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, LEAF, MATERIALS, curl } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";

const f = (n: number) => +n.toFixed(2);
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], opacity?: number[]) =>
  colors
    .map(
      (c, i) =>
        `<stop offset="${f(i / Math.max(1, colors.length - 1))}" stop-color="${c}"${opacity ? ` stop-opacity="${opacity[i]}"` : ""}/>`,
    )
    .join("");
const linear = (id: string, colors: readonly string[], vertical = true, opacity?: number[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors, opacity)}</linearGradient>`;
const radial = (id: string, colors: readonly string[], opacity?: number[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, opacity)}</radialGradient>`;

/** A gold scroll pair for one corner of a frame (top-left; mirror it). */
function cornerParts(size: number): EmblemData {
  const w = size * 0.3;
  return [
    curl(2, size + 6, -Math.PI / 2, size, 3.7, w, 0.55),
    curl(size + 6, 2, Math.PI, size, -3.7, w, 0.55),
    curl(4, 4, Math.PI / 4, size * 0.9, 0.45, size * 0.38, "leaf"),
  ].map((p) => ({ d: p.outline, m: "gold" as const, vein: p.vein, ink: 1, vw: 0.6 }));
}

/** Gold scrolls in all four corners of a w × h box, `inset` in. */
function corners(w: number, h: number, inset: number, size: number, id: string) {
  const body = toSvgBody(cornerParts(size), undefined, id);
  return [
    `<g transform="translate(${inset} ${inset})">${body}</g>`,
    `<g transform="translate(${f(w - inset)} ${inset}) scale(-1 1)">${body}</g>`,
    `<g transform="translate(${inset} ${f(h - inset)}) scale(1 -1)">${body}</g>`,
    `<g transform="translate(${f(w - inset)} ${f(h - inset)}) scale(-1 -1)">${body}</g>`,
  ].join("");
}

/** A gilded moulding (a rounded frame `t` thick) with its groove, ink and
 *  one shine, as markup. */
function moulding(x: number, y: number, w: number, h: number, r: number, t: number, id: string) {
  const outer = rrect(x, y, w, h, r);
  const inner = rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(1, r - t));
  const groove = rrect(x + t / 2, y + t / 2, w - t, h - t, Math.max(1, r - t / 2));
  return (
    `<defs>${linear(id, GOLD, false)}</defs>` +
    `<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#${id})"/>` +
    `<path d="${groove}" fill="none" stroke="${VEIN}" stroke-width="0.7" stroke-opacity="0.9"/>` +
    `<path d="M${f(x + r)} ${f(y + t * 0.4)}H${f(x + w * 0.4)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.9"/>` +
    `<path d="${outer}" fill="none" stroke="${INK}" stroke-width="1.3"/>` +
    `<path d="${inner}" fill="none" stroke="${INK}" stroke-width="0.9"/>`
  );
}

/** One damask flower: four leaves round a bead, for the wall's pattern. */
function damask(s: number) {
  const leaf = LEAF(s * 0.42, s * 0.16);
  return (
    [0, 90, 180, 270]
      .map((a) => `<path d="${leaf}" transform="translate(${s / 2} ${s / 2}) rotate(${a})"/>`)
      .join("") +
    [45, 135, 225, 315]
      .map((a) => `<path d="${LEAF(s * 0.22, s * 0.08)}" transform="translate(${s / 2} ${s / 2}) rotate(${a})"/>`)
      .join("") +
    `<circle cx="${s / 2}" cy="${s / 2}" r="${f(s * 0.07)}"/>`
  );
}

/** The hall's wall: deep velvet with a faint gold damask, a pool of light
 *  from above, and a gilded frame round the screen with scrolled corners. */
export function hallBackdrop(w: number, h: number, top = 0) {
  const tile = 44;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${linear("velvet", ["#2E0F1E", "#40152B", "#2A0C1B", "#16060E"])}
${radial("light", ["#FFD58A", "#FFD58A"], [0.22, 0], 0.5, 0, 0.75)}
${radial("shade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.45, 0.75)}
<pattern id="damask" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">
<g fill="#E2B04A" fill-opacity="0.07">${damask(tile)}</g>
<g fill="#E2B04A" fill-opacity="0.05" transform="translate(${tile / 2} ${tile / 2}) scale(0.5) translate(${-tile / 2} ${-tile / 2})">${damask(tile)}</g>
</pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#velvet)"/>
<rect width="${w}" height="${h}" fill="url(#damask)"/>
<rect width="${w}" height="${h}" fill="url(#light)"/>
<rect width="${w}" height="${h}" fill="url(#shade)"/>
<g transform="translate(0 ${top})">
${moulding(8, 8, w - 16, h - top - 16, 22, 5, "frame")}
${corners(w, h - top, 13, 30, "c")}
</g>
</svg>`;
}

/** The showcase: a gilded case lined in crimson velvet, `slots` pedestals
 *  in a row along its floor, each lit from above. Returns the case (drawn
 *  under the badges) and its glass (drawn over them). `pedestal` says
 *  where each pedestal's top sits, for the badges to stand on. */
export function showcaseCase(w: number, h: number, slots = 4) {
  const t = 7;
  const r = 20;
  const floor = h - 30;
  const slot = (w - 2 * t - 16) / slots;
  const centres = Array.from({ length: slots }, (_, i) => f(t + 8 + slot * (i + 0.5)));
  const pw = Math.min(slot * 0.62, 56);
  const pedestal = (cx: number) => {
    const top = floor - 16;
    return (
      // the plinth: a stepped gold drum, its top an ellipse
      `<path d="M${f(cx - pw / 2)} ${f(top)}L${f(cx - pw / 2 + 4)} ${floor}H${f(cx + pw / 2 - 4)}L${f(cx + pw / 2)} ${f(top)}Z" fill="url(#gp)" stroke="${INK}" stroke-width="1"/>` +
      `<path d="M${f(cx - pw / 2 + 5)} ${f(top + 7)}H${f(cx + pw / 2 - 5)}" stroke="${VEIN}" stroke-width="0.8"/>` +
      `<ellipse cx="${cx}" cy="${f(top)}" rx="${f(pw / 2)}" ry="5" fill="url(#gt)" stroke="${INK}" stroke-width="1"/>` +
      // a cone of light on it, from above
      `<path d="M${f(cx - 10)} ${t + 2}L${f(cx - pw / 2 - 6)} ${f(top)}H${f(cx + pw / 2 + 6)}L${f(cx + 10)} ${t + 2}Z" fill="url(#beam)"/>`
    );
  };
  const caseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${radial("lining", ["#6A1430", "#3A0818", "#1E040C"], undefined, 0.5, 0.35, 0.8)}
${linear("gp", ["#F0CC72", "#C8902E", "#7A5212"], false)}
${linear("gt", ["#FFF2B8", "#E2B04A"])}
${linear("beam", ["#FFE7B0", "#FFE7B0"], true, [0.16, 0])}
${linear("floor", ["#2A0610", "#14030A"])}
</defs>
<path d="${rrect(0, 3, w, h, r)}" fill="#000" fill-opacity="0.4"/>
<path d="${rrect(t, t, w - 2 * t, h - 2 * t, r - t)}" fill="url(#lining)"/>
<path d="M${t} ${floor}H${w - t}V${h - t - 6}Q${w - t} ${h - t} ${w - t - 6} ${h - t}H${t + 6}Q${t} ${h - t} ${t} ${h - t - 6}Z" fill="url(#floor)"/>
<path d="M${t} ${floor}H${w - t}" stroke="${VEIN}" stroke-width="1"/>
${centres.map(pedestal).join("")}
${moulding(0, 0, w, h, r, t, "case")}
</svg>`;
  const glass = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${linear("pane", ["#FFFFFF", "#FFFFFF"], false, [0.12, 0])}</defs>
<path d="M${t + 10} ${t}L${f(t + 10 + h * 0.5)} ${t}L${t + 10} ${f(t + h * 0.55)}Z" fill="url(#pane)"/>
<path d="M${f(w * 0.55)} ${t}L${f(w * 0.55 + 18)} ${t}L${f(w * 0.55 - h * 0.5 + 18)} ${h - t}L${f(w * 0.55 - h * 0.5)} ${h - t}Z" fill="#FFFFFF" fill-opacity="0.05"/>
</svg>`;
  return { caseSvg, glass, centres, standAt: floor - 16 };
}

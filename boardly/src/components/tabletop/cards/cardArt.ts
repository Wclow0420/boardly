// Playing cards in the house style, as SVG markup in a 100 × 140 box
// (baked once into images by PlayingCard): the ivory stock, the back (a
// game's own colours and pattern, a gold frame, and always the Boardly
// meeple in gold as the medallion in the middle) and the front's frame
// (a gilt border, a window at the top for the card's picture, a plaque
// for its name). After the cards of the Card Fan border.

import { INKS, MATERIALS } from "@/components/engraved/shapes";

export const CARD_W = 100;
export const CARD_H = 140;

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.38, cy = 0.32, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
const svg = (body: string, pad = 3) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W + 2 * pad}" height="${CARD_H + 2 * pad}" viewBox="${-pad} ${-pad} ${CARD_W + 2 * pad} ${CARD_H + 2 * pad}">${body}</svg>`;

export function rrect(x: number, y: number, w: number, h: number, r: number) {
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}

/** The Boardly meeple, in a 48 box (as the app's emblem draws it). */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";

/** The card's outline and the soft shadow under it. */
const stock = (id: string) =>
  `<path d="${rrect(0.8, 2.2, CARD_W, CARD_H, 7)}" fill="#000" fill-opacity="0.35"/>
<path d="${rrect(0, 0, CARD_W, CARD_H, 7)}" fill="url(#${id})"/>`;

/** A pattern across a back: a lattice, scales, stars or waves. */
export type BackPattern = "lattice" | "scales" | "stars" | "tracery";

export interface BackStyle {
  /** The panel's colours, light to dark. */
  colors: readonly string[];
  pattern?: BackPattern;
  /** The jewel in the meeple's heart. */
  jewel?: readonly [string, string, string];
}

function pattern(kind: BackPattern, x: number, y: number, w: number, h: number) {
  const lines: string[] = [];
  if (kind === "lattice") {
    for (let k = -14; k < 30; k++) {
      const c = x + k * 7;
      lines.push(`M${c} ${y}L${c + h} ${y + h}M${c} ${y + h}L${c + h} ${y}`);
    }
    return `<path d="${lines.join("")}" stroke="#F0CC72" stroke-opacity="0.38" stroke-width="0.6"/>`;
  }
  if (kind === "scales") {
    const out: string[] = [];
    for (let row = 0; row * 6 < h + 6; row++)
      for (let col = -1; col * 9 < w + 9; col++) {
        const cx = x + col * 9 + (row % 2) * 4.5;
        const cy = y + row * 6;
        out.push(`M${f(cx - 4.5)} ${f(cy)}A4.5 4.5 0 0 0 ${f(cx + 4.5)} ${f(cy)}`);
      }
    return `<path d="${out.join("")}" fill="none" stroke="#F0CC72" stroke-opacity="0.36" stroke-width="0.6"/>`;
  }
  if (kind === "stars") {
    const out: string[] = [];
    for (let row = 0; row * 11 < h + 11; row++)
      for (let col = 0; col * 11 < w + 11; col++) {
        const cx = x + col * 11 + (row % 2) * 5.5;
        const cy = y + row * 11;
        out.push(`M${f(cx)} ${f(cy - 2.2)}L${f(cx + 0.6)} ${f(cy - 0.6)}L${f(cx + 2.2)} ${f(cy)}L${f(cx + 0.6)} ${f(cy + 0.6)}L${f(cx)} ${f(cy + 2.2)}L${f(cx - 0.6)} ${f(cy + 0.6)}L${f(cx - 2.2)} ${f(cy)}L${f(cx - 0.6)} ${f(cy - 0.6)}Z`);
      }
    return `<path d="${out.join("")}" fill="#F0CC72" fill-opacity="0.42"/>`;
  }
  // tracery: pointed gothic arches in rows
  const out: string[] = [];
  for (let row = 0; row * 14 < h + 14; row++)
    for (let col = -1; col * 10 < w + 10; col++) {
      const cx = x + col * 10 + (row % 2) * 5;
      const by = y + row * 14;
      out.push(`M${f(cx - 4)} ${f(by + 6)}V${f(by)}Q${f(cx - 4)} ${f(by - 5)} ${f(cx)} ${f(by - 7)}Q${f(cx + 4)} ${f(by - 5)} ${f(cx + 4)} ${f(by)}V${f(by + 6)}`);
    }
  return `<path d="${out.join("")}" fill="none" stroke="#F0CC72" stroke-opacity="0.34" stroke-width="0.6"/>`;
}

/** A card's back: ivory edge, a panel in the game's colours with its
 *  pattern and a light along its edge, a double gold frame with corner
 *  studs, and the Boardly meeple in gold with a jewel at its heart,
 *  inside a ring of beads. */
export function cardBack({ colors, pattern: kind = "lattice", jewel = ["#FF9AA6", "#D0102E", "#5A0410"] }: BackStyle) {
  const px = 6;
  const py = 6;
  const pw = CARD_W - 12;
  const ph = CARD_H - 12;
  const panel = rrect(px, py, pw, ph, 4);
  const frame = rrect(px + 4.5, py + 4.5, pw - 9, ph - 9, 2.6);
  const cx = CARD_W / 2;
  const cy = CARD_H / 2;
  const m = 0.92; // the meeple's scale in its 48 box
  const beads = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle cx="${f(cx + Math.cos(a) * 27)}" cy="${f(cy + Math.sin(a) * 27)}" r="1.25" fill="url(#bd)" stroke="${VEIN}" stroke-width="0.35"/>`;
  }).join("");
  const studs = [
    [px + 9, py + 9],
    [px + pw - 9, py + 9],
    [px + 9, py + ph - 9],
    [px + pw - 9, py + ph - 9],
  ]
    .map(([x, y]) => `<path d="M${x} ${y - 3.2}L${x + 2.4} ${y}L${x} ${y + 3.2}L${x - 2.4} ${y}Z" fill="url(#g)" stroke="${INK}" stroke-width="0.5"/>`)
    .join("");
  return svg(`<defs>
${lin("iv", MATERIALS.ivory)}
${lin("pn", colors, 0.6, 1)}
${lin("g", MATERIALS.gold)}
${rad("bd", ["#FFF6D0", "#E2B04A", "#8A5A16"])}
${rad("me", ["#FFF6D0", "#F0CC72", "#B07A22", "#7A5212"])}
${rad("jw", jewel)}
${rad("halo", [colors[0], colors[0]], [0.65, 0], 0.5, 0.5, 0.5)}
<clipPath id="pc"><path d="${panel}"/></clipPath>
</defs>
${stock("iv")}
<path d="${rrect(2.4, 2.4, CARD_W - 4.8, CARD_H - 4.8, 5.6)}" fill="none" stroke="#C8B890" stroke-width="0.6"/>
<path d="${panel}" fill="url(#pn)"/>
<g clip-path="url(#pc)">
${pattern(kind, px, py, pw, ph)}
<circle cx="${cx}" cy="${cy}" r="34" fill="url(#halo)"/>
<path d="M${px + 2} ${py + ph - 10}V${py + 2.5}H${px + pw - 12}" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.9" fill="none" stroke-linecap="round"/>
</g>
<path d="${frame}" fill="none" stroke="${INK}" stroke-width="2"/>
<path d="${frame}" fill="none" stroke="url(#g)" stroke-width="1.2"/>
<path d="${panel}" fill="none" stroke="${INK}" stroke-width="0.9"/>
${studs}
<circle cx="${cx}" cy="${cy}" r="29.5" fill="${colors[colors.length - 1]}" fill-opacity="0.55" stroke="url(#g)" stroke-width="1.6"/>
<circle cx="${cx}" cy="${cy}" r="29.5" fill="none" stroke="${INK}" stroke-width="0.5"/>
${beads}
<g transform="translate(${f(cx - 24 * m)} ${f(cy - 24 * m - 1)}) scale(${m})">
<path d="${MEEPLE}" fill="#000" fill-opacity="0.35" transform="translate(0.8 1.6)"/>
<path d="${MEEPLE}" fill="url(#me)" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M17.5 12.6C17.6 9.4 20 6.9 23.4 6.6M10.8 22.4C12 20.6 15.4 19.4 19.6 18.4" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<path d="M24 36L24 28M16 24.6C19 24 21.4 24.6 24 24.6C26.6 24.6 29 24 32 24.6" stroke="${VEIN}" stroke-width="0.7" fill="none" stroke-linecap="round"/>
<circle cx="24" cy="22.4" r="3.4" fill="url(#jw)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="22.9" cy="21.3" r="1" fill="#FFFFFF" fill-opacity="0.9"/>
</g>`);
}

export interface FrontStyle {
  /** The window's enamel behind the card's picture, light to dark. */
  window: readonly string[];
  /** The plaque's colours (for the name), light to dark. */
  plaque: readonly string[];
  /** The window's top: a gothic point, a round arch or flat. */
  arch?: "pointed" | "round";
}

/** Where a front's parts sit (in the 100 × 140 box), for the text and
 *  the picture laid over it. */
export const FRONT = {
  window: { x: 16, y: 12, w: 68, h: 50 },
  plaque: { x: 10, y: 60, w: 80, h: 15 },
  body: { x: 12, y: 78, w: 76, h: 50 },
};

function windowPath(arch: "pointed" | "round", x: number, y: number, w: number, h: number, k = 0) {
  const l = x + k;
  const r = x + w - k;
  const t = y + k;
  const b = y + h - k;
  const m = (l + r) / 2;
  if (arch === "round") {
    const rr = (r - l) / 2;
    return `M${f(l)} ${f(b)}V${f(t + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(r)} ${f(t + rr)}V${f(b)}Z`;
  }
  const s = t + (r - l) * 0.5;
  return `M${f(l)} ${f(b)}V${f(s)}Q${f(l)} ${f(t + (r - l) * 0.08)} ${f(m)} ${f(t)}Q${f(r)} ${f(t + (r - l) * 0.08)} ${f(r)} ${f(s)}V${f(b)}Z`;
}

/** A card's front frame: ivory stock with a fine gilt border and corner
 *  ornaments, a window at the top (enamel, framed in gold, lit from the
 *  top), and a plaque across under it for the name. The picture and the
 *  words are laid over by PlayingCard's children. */
export function cardFront({ window: win, plaque, arch = "pointed" }: FrontStyle) {
  const W = FRONT.window;
  const P = FRONT.plaque;
  const border = rrect(4.5, 4.5, CARD_W - 9, CARD_H - 9, 4);
  const inner = rrect(7, 7, CARD_W - 14, CARD_H - 14, 2.8);
  const flourish = (x: number, y: number, sx: number, sy: number) =>
    `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 9Q0 0 9 0M3 9Q3 3 9 3M0 9Q2 12 4 11" fill="none" stroke="${VEIN}" stroke-width="0.7" stroke-linecap="round"/>`;
  return svg(`<defs>
${lin("iv", ["#FFFDF6", "#F6EFDC", "#E2D6B8"])}
${lin("g", MATERIALS.gold)}
${lin("wn", win, 0, 1)}
${lin("pq", plaque, 0, 1)}
${rad("wl", ["#FFFFFF", "#FFFFFF"], [0.35, 0], 0.5, 0.15, 0.7)}
</defs>
${stock("iv")}
<path d="${border}" fill="none" stroke="${INK}" stroke-width="1.6"/>
<path d="${border}" fill="none" stroke="url(#g)" stroke-width="1"/>
<path d="${inner}" fill="none" stroke="#C8B890" stroke-width="0.5"/>
${flourish(9, 9, 1, 1)}${flourish(CARD_W - 9, 9, -1, 1)}${flourish(9, CARD_H - 9, 1, -1)}${flourish(CARD_W - 9, CARD_H - 9, -1, -1)}
<path d="${windowPath(arch, W.x - 2.5, W.y - 2.5, W.w + 5, W.h + 5)}" fill="url(#g)" stroke="${INK}" stroke-width="1.1"/>
<path d="${windowPath(arch, W.x, W.y, W.w, W.h)}" fill="url(#wn)" stroke="${INK}" stroke-width="0.8"/>
<path d="${windowPath(arch, W.x, W.y, W.w, W.h)}" fill="url(#wl)"/>
<path d="M${W.x + 3} ${W.y + W.h - 6}V${W.y + W.w * 0.45}" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${P.x} ${P.y + P.h / 2}L${P.x + 6} ${P.y}H${P.x + P.w - 6}L${P.x + P.w} ${P.y + P.h / 2}L${P.x + P.w - 6} ${P.y + P.h}H${P.x + 6}Z" fill="url(#g)" stroke="${INK}" stroke-width="1"/>
<path d="M${P.x + 2.6} ${P.y + P.h / 2}L${P.x + 7.4} ${P.y + 2.2}H${P.x + P.w - 7.4}L${P.x + P.w - 2.6} ${P.y + P.h / 2}L${P.x + P.w - 7.4} ${P.y + P.h - 2.2}H${P.x + 7.4}Z" fill="url(#pq)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${P.x + 9} ${P.y + 3.4}H${P.x + P.w * 0.45}" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.7" stroke-linecap="round"/>
<path d="M${CARD_W / 2 - 14} ${CARD_H - 13}H${CARD_W / 2 + 14}" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${CARD_W / 2} ${CARD_H - 15.5}l2.4 2.5l-2.4 2.5l-2.4 -2.5Z" fill="url(#g)" stroke="${INK}" stroke-width="0.4"/>`);
}

// Hustle's header: the eave of the back-room den behind the night market.
// A roof of dark glazed barrel tiles ends in a row of gilt tile-end discs;
// under it a crimson lacquered beam with a gold key-fret band, then the
// den's dark lattice screen. A crimson signboard in a gilt frame with
// cloud-scroll corners and a jade boss hangs from the beam (whose turn
// it is, written over it), two red silk lanterns hang at the ends, and
// along the bottom a mahjong rack holds one tile per player: an ivory
// face with a crimson pip for each card still hidden and the player's
// cash, or turned down to its jade back once they're out.
// As SVG markup, baked once (den, lantern, each kind of tile) by DenSign.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, MATERIALS, curl } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.38, cy = 0.32, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

const LACQUER = ["#E04A52", "#A8182A", "#5A0810"];
const JADE = ["#9AF0C0", "#2E9A62", "#0C4A2A"];
const ROOF = ["#3E4C48", "#222C2A", "#121816"];
const WOOD = ["#3A2216", "#24140C", "#160A06"];

export const TILE_W = 28;
export const TILE_H = 38;
export const LANTERN_W = 34;
export const LANTERN_H = 74;

/** Where everything sits, for a header `w` wide whose content starts at
 *  `top` (below the status bar), with `n` players. */
export function denLayout(w: number, top: number, n: number) {
  const eave = top + 14;
  const beam = { y: eave + 3, h: 13 };
  const sign = { x: 64, y: eave + 11, w: w - 128, h: 50 };
  const rackY = sign.y + sign.h + 8;
  const slot = Math.min(58, (w - 96) / Math.max(n, 1));
  const span = slot * n;
  const tiles = Array.from({ length: n }, (_, i) => ({
    x: w / 2 - span / 2 + slot * (i + 0.5) - TILE_W / 2,
    y: rackY,
    slot,
  }));
  return {
    w,
    h: rackY + TILE_H + 22,
    top,
    eave,
    beam,
    sign,
    rack: { x: w / 2 - span / 2 - 8, y: rackY + TILE_H - 5, w: span + 16 },
    tiles,
    // the lanterns hang from the beam's ends, clear of the corner studs
    lanterns: [
      { x: 30, y: beam.y + beam.h },
      { x: w - 30, y: beam.y + beam.h },
    ],
    screenBottom: rackY + TILE_H + 8,
  };
}
export type DenLayout = ReturnType<typeof denLayout>;

/** A cloud scroll (two curls back to back) as engraved gold parts, for
 *  the sign's corners. */
function cloud(x: number, y: number, side: number, id: string, size = 1) {
  const parts: EmblemData = [
    curl(x, y, side > 0 ? 0 : Math.PI, 15 * size, side * 3.6, 3.6 * size, 0.7),
    curl(x, y, side > 0 ? Math.PI / 2 : Math.PI / 2, 10 * size, side * -3.2, 3 * size, 0.7),
  ].map((p) => ({ d: p.outline, m: "gold", vein: p.vein, ink: 0.7, vw: 0.4 }));
  return toSvgBody(parts, undefined, id);
}

/** The key-fret (回纹) along the beam: a running meander in gold. */
function fret(x0: number, x1: number, y: number) {
  const d: string[] = [];
  for (let x = x0; x + 10 <= x1; x += 12) {
    d.push(`M${x} ${y + 3}V${y - 3}H${x + 8}V${y + 1.5}H${x + 3}V${y - 1}`);
  }
  return `<path d="${d.join("")}" fill="none" stroke="url(#gs)" stroke-width="1.1" stroke-linejoin="round"/>`;
}

/** The den's eave, w × h: roof, tile ends, beam, the lattice screen,
 *  the signboard (no text) and the empty rack. */
export function denArt(L: DenLayout) {
  const { w, h, eave, beam, sign, rack, screenBottom } = L;
  // the roof: barrel tiles running down to the eave
  const barrels: string[] = [];
  for (let x = -4; x < w + 8; x += 13) {
    barrels.push(`<path d="M${x} 0V${eave - 4}" stroke="#0A0E0D" stroke-width="5" stroke-opacity="0.55"/>`);
    barrels.push(`<path d="M${x + 6.5} 0V${eave - 4}" stroke="#56645F" stroke-width="5.5" stroke-opacity="0.6" stroke-linecap="round"/>`);
    barrels.push(`<path d="M${x + 5} 0V${eave - 6}" stroke="#A8BCB4" stroke-width="0.8" stroke-opacity="0.35"/>`);
  }
  for (let y = 6; y < eave - 4; y += 7) barrels.push(`<path d="M0 ${y}H${w}" stroke="#0A0E0D" stroke-width="0.7" stroke-opacity="0.5"/>`);
  // the tile ends: gilt discs with a shou (longevity) ring
  const ends: string[] = [];
  for (let x = 2.5; x < w + 8; x += 13) {
    ends.push(
      `<circle cx="${x + 4}" cy="${eave}" r="5.6" fill="url(#gd)" stroke="${INK}" stroke-width="0.8"/>` +
        `<circle cx="${x + 4}" cy="${eave}" r="3" fill="none" stroke="${VEIN}" stroke-width="0.6"/>` +
        `<circle cx="${x + 2.6}" cy="${eave - 1.6}" r="1" fill="#FFFFFF" fill-opacity="0.75"/>`,
    );
  }
  // the lattice screen behind the sign and the rack
  const lattice: string[] = [];
  const top = beam.y + beam.h;
  for (let x = 6; x < w; x += 22) {
    for (let y = top + 6; y < screenBottom - 4; y += 22) {
      lattice.push(`M${x} ${y}h14v14h-14ZM${x + 4} ${y + 4}h6v6h-6Z`);
    }
  }
  const screen = `M0 ${top}H${w}V${screenBottom}H0Z`;
  // the screen's foot: a gilt rail with a crimson underside, scalloped
  const scallops: string[] = [];
  for (let x = 0; x < w; x += 16) scallops.push(`M${x} ${screenBottom + 3}q8 8 16 0`);
  const s = sign;
  const frame = rr(s.x, s.y, s.w, s.h, 5);
  const inner = rr(s.x + 5, s.y + 5, s.w - 10, s.h - 10, 3);
  const corner = (x: number, y: number, side: number, up: number, k: string) =>
    `<g transform="translate(${x} ${y}) scale(${side} ${up})">${cloud(0, 0, 1, k, 0.9)}</g>`;
  return svg(
    w,
    h,
    `<defs>
${lin("roof", ROOF)}
${lin("lac", LACQUER)}
${lin("wood", WOOD)}
${lin("gs", MATERIALS.gold, false)}
${lin("gv", MATERIALS.gold)}
${rad("gd", ["#FFF6D0", "#E2B04A", "#8A5A16"])}
${rad("jd", JADE)}
${lin("sg", ["#E8404C", "#B01E30", "#6A0A16"])}
${rad("shade", ["#000000", "#000000"], [0, 0.5], 0.5, 0.0, 1.1)}
</defs>
<path d="M0 0H${w}V${eave}H0Z" fill="url(#roof)"/>
${barrels.join("")}
<path d="${screen}" fill="url(#wood)"/>
<path d="${lattice.join("")}" fill="none" stroke="#C89A4A" stroke-opacity="0.16" stroke-width="1.2"/>
<path d="${screen}" fill="url(#shade)"/>
<path d="M0 ${screenBottom}H${w}V${screenBottom + 3}H0Z" fill="url(#gv)" stroke="${INK}" stroke-width="0.6"/>
<path d="${scallops.join("")}" fill="url(#lac)" stroke="${INK}" stroke-width="0.6"/>
<path d="M0 ${beam.y}H${w}V${beam.y + beam.h}H0Z" fill="url(#lac)" stroke="${INK}" stroke-width="0.9"/>
<path d="M0 ${beam.y + 2}H${w}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8"/>
${fret(4, w - 4, beam.y + beam.h / 2)}
${ends.join("")}
<path d="M0 ${top + 1.5}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="3"/>
<path d="M${s.x + 18} ${beam.y + beam.h}V${s.y}M${s.x + s.w - 18} ${beam.y + beam.h}V${s.y}" stroke="url(#gs)" stroke-width="2.4"/>
<path d="${rr(s.x + 1, s.y + 3.5, s.w, s.h, 5)}" fill="#000" fill-opacity="0.5"/>
<path d="${frame}" fill="url(#gv)" stroke="${INK}" stroke-width="1.2"/>
<path d="${rr(s.x + 2.6, s.y + 2.6, s.w - 5.2, s.h - 5.2, 4)}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="${inner}" fill="url(#sg)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rr(s.x + 8, s.y + 8, s.w - 16, s.h - 16, 2)}" fill="none" stroke="#F0CC72" stroke-opacity="0.45" stroke-width="0.6"/>
<path d="M${s.x + 9} ${s.y + 7.5}H${s.x + s.w * 0.42}" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.9" stroke-linecap="round"/>
${corner(s.x + 2, s.y + 2, 1, 1, "c1")}${corner(s.x + s.w - 2, s.y + 2, -1, 1, "c2")}
${corner(s.x + 2, s.y + s.h - 2, 1, -1, "c3")}${corner(s.x + s.w - 2, s.y + s.h - 2, -1, -1, "c4")}
<circle cx="${w / 2}" cy="${s.y}" r="6.5" fill="url(#gd)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${w / 2}" cy="${s.y}" r="4" fill="url(#jd)" stroke="${INK}" stroke-width="0.7"/>
<circle cx="${w / 2 - 1.4}" cy="${s.y - 1.4}" r="1.1" fill="#FFFFFF" fill-opacity="0.9"/>
<path d="M${rack.x} ${rack.y}h${rack.w}v7h${-rack.w}Z" fill="#000" fill-opacity="0.45" transform="translate(0 2.5)"/>
<path d="M${rack.x} ${rack.y}h${rack.w}l-3 7h${-(rack.w - 6)}Z" fill="url(#lac)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${rack.x} ${rack.y}h${rack.w}" stroke="url(#gs)" stroke-width="2"/>
<path d="M${rack.x + 4} ${rack.y + 0.4}H${rack.x + rack.w * 0.4}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.7"/>`,
  );
}

/** A red silk lantern on its cord (LANTERN_W × LANTERN_H, hung from the
 *  middle of its top edge): gold caps, gold ribs, a tassel. The glow
 *  behind it is DenSign's. */
export function lanternArt() {
  const W = LANTERN_W;
  const cx = W / 2;
  const top = 14;
  const bot = 54;
  const rw = 15.5;
  const body = `M${cx - 9} ${top}C${cx - rw - 4} ${top + 4} ${cx - rw - 4} ${bot - 4} ${cx - 9} ${bot}H${cx + 9}C${cx + rw + 4} ${bot - 4} ${cx + rw + 4} ${top + 4} ${cx + 9} ${top}Z`;
  const ribs = [-0.62, -0.25, 0.25, 0.62]
    .map((k) => `M${f(cx + k * 9)} ${top}C${f(cx + k * (rw + 6))} ${top + 6} ${f(cx + k * (rw + 6))} ${bot - 6} ${f(cx + k * 9)} ${bot}`)
    .join("");
  return svg(
    W,
    LANTERN_H,
    `<defs>
${rad("silk", ["#FFE0A0", "#F2543A", "#B0142A", "#5A0410"], undefined, 0.42, 0.42, 0.7)}
${lin("cap", MATERIALS.gold, false)}
${lin("ts", ["#F2543A", "#A8102A"])}
</defs>
<path d="M${cx} 0V${top - 3}" stroke="#2A1A0A" stroke-width="1.2"/>
<path d="${body}" fill="url(#silk)" stroke="#3A0408" stroke-width="1"/>
<path d="${ribs}" fill="none" stroke="#F0CC72" stroke-opacity="0.75" stroke-width="0.7"/>
<path d="M${cx - 8} ${top + 7}C${cx - 13} ${top + 13} ${cx - 13} ${bot - 14} ${cx - 9} ${bot - 8}" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.1" stroke-linecap="round"/>
<path d="${rr(cx - 10, top - 4, 20, 5, 1.5)}" fill="url(#cap)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rr(cx - 10, bot - 1, 20, 5, 1.5)}" fill="url(#cap)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${cx} ${bot + 4}V${bot + 8}" stroke="url(#cap)" stroke-width="2"/>
<circle cx="${cx}" cy="${bot + 9}" r="2.2" fill="url(#cap)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${cx - 3} ${bot + 11}h6l1.5 ${LANTERN_H - bot - 13}h-9Z" fill="url(#ts)" stroke="#3A0408" stroke-width="0.6"/>
<path d="M${cx - 1.5} ${bot + 12}V${LANTERN_H - 3}M${cx + 1.5} ${bot + 12}V${LANTERN_H - 3}" stroke="#5A0410" stroke-width="0.5"/>`,
  );
}

export type TileKind = "two" | "one" | "out";

/** A player's tile on the rack (TILE_W × TILE_H): ivory face on a jade
 *  back, a crimson pip per card still hidden and a hollow one per card
 *  lost; or, once they're out, turned face down to its jade back. */
export function tileArt(kind: TileKind) {
  const W = TILE_W;
  const H = TILE_H;
  if (kind === "out") {
    return svg(
      W,
      H,
      `<defs>${lin("jb", ["#5ABA88", "#1E6A44", "#0C3A22"])}${lin("g", MATERIALS.gold)}</defs>
<path d="${rr(1.5, 6, W - 3, H - 7, 4)}" fill="#000" fill-opacity="0.45"/>
<path d="${rr(1, 4, W - 2, H - 6, 4)}" fill="url(#jb)" stroke="#06200F" stroke-width="1"/>
<path d="${rr(4.5, 7.5, W - 9, H - 13, 2.5)}" fill="none" stroke="url(#g)" stroke-width="0.8" stroke-opacity="0.8"/>
<path d="M${W / 2} ${H / 2 - 4}l3.5 4.5l-3.5 4.5l-3.5 -4.5Z" fill="url(#g)" stroke="${INK}" stroke-width="0.5"/>
<path d="M4 7H${W * 0.5}" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="0.8" stroke-linecap="round"/>`,
    );
  }
  const pips = [0, 1]
    .map((i) => {
      const x = W / 2 + (i - 0.5) * 10;
      const held = kind === "two" || i === 0;
      return held
        ? `<circle cx="${x}" cy="11.5" r="4.2" fill="url(#pip)" stroke="#3A0408" stroke-width="0.8"/><circle cx="${x - 1.4}" cy="10.1" r="1.1" fill="#FFFFFF" fill-opacity="0.85"/>`
        : `<circle cx="${x}" cy="11.5" r="3.8" fill="none" stroke="#A89A80" stroke-width="1.1"/><path d="M${x - 2.4} ${9.1}l4.8 4.8" stroke="#A89A80" stroke-width="1"/>`;
    })
    .join("");
  return svg(
    W,
    H,
    `<defs>${lin("jb", ["#5ABA88", "#1E6A44", "#0C3A22"])}${lin("iv", MATERIALS.ivory)}${rad("pip", ["#FF9AA6", "#D0102E", "#5A0410"])}</defs>
<path d="${rr(1.5, 6, W - 3, H - 7, 4)}" fill="#000" fill-opacity="0.45"/>
<path d="${rr(1, 6, W - 2, H - 6, 4)}" fill="url(#jb)" stroke="#06200F" stroke-width="0.9"/>
<path d="${rr(1, 1, W - 2, H - 9, 4)}" fill="url(#iv)" stroke="${INK}" stroke-width="0.9"/>
<path d="M4 3.4H${W * 0.55}" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round"/>
<path d="M5 19.5H${W - 5}" stroke="#C8B890" stroke-width="0.6"/>
${pips}`,
  );
}

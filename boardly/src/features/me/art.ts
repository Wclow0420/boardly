// The Me page's still art, as SVG markup recorded once into pictures
// (stillSvg): the ground-floor lobby of the Boardly building, seen flat
// on. Walnut panelling with gilt beading and a brass dado rail, the
// cornice along the ceiling, the marquee sign hung from it (crimson
// enamel in a gold moulding, a stepped crest with an emerald, a ring of
// glass bulbs), the lift's door in the Games tab's language (a brass
// sunburst behind the floor dial, the chevron frieze on the lintel,
// fluted pilasters, a pair of closed brass leaves with a sunburst across
// the seam), the wall lamps' bodies, a marble floor running toward us
// with the brass medallion set in it, the spotlight's beam and pool.
// Drawn in the house style:
// gradients lit from the upper left, an ink outline, grooves and one
// line of shine. What moves (the bulbs, the lamps' light, the needle,
// the dust in the beam, the sweep) is drawn live by LobbyLife.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { MeLayout } from "./layout";

const f = (n: number) => +n.toFixed(2);
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;
/** A gradient across a box in the drawing's own units. */
const lit = (id: string, colors: readonly string[], x0: number, y0: number, x1: number, y1: number, opacity?: number[]) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${opacity ? ` stop-opacity="${opacity[i]}"` : ""}/>`)
    .join("")}</linearGradient>`;
/** A point `r` from (cx, cy) at `deg` (0 = up, clockwise). */
const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)] as const;
};
/** An annular band from `a0` to `a1` degrees, radii r0 < r1. */
function band(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [ox0, oy0] = pt(cx, cy, r1, a0);
  const [ox1, oy1] = pt(cx, cy, r1, a1);
  const [ix1, iy1] = pt(cx, cy, r0, a1);
  const [ix0, iy0] = pt(cx, cy, r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${ox0} ${oy0}A${r1} ${r1} 0 ${big} 1 ${ox1} ${oy1}L${ix1} ${iy1}A${r0} ${r0} 0 ${big} 0 ${ix0} ${iy0}Z`;
}
const halfDisc = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 0 1 ${f(cx + r)} ${f(cy)}Z`;
/** An oval as a path (Skia's SVG reader fills a gradient <ellipse> black). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
const stud = (x: number, y: number, r: number) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#msv)" stroke="${INK}" stroke-width="0.6"/>`;

/** The dial's stops, in degrees from straight up: L first, then 1–7. */
export const DIAL_STOPS = [-78, -56, -33, -11, 11, 33, 56, 78];
/** Where the needle rests: the lobby, L. */
export const NEEDLE_REST = DIAL_STOPS[0];

const COMMON_DEFS = `
${linear("mgold", GOLD, false)}
${linear("mgoldv", GOLD)}
${radial("msv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${linear("mivory", MATERIALS.ivory)}
${linear("menamel", ["#D2384A", "#9A1828", "#5A0812"])}
${linear("mfrieze", ["#1A2234", "#0C1018"])}
${radial("mface", ["#2A3550", "#141A2A", "#080B12"], undefined, 0.5, 0.75, 0.8)}`;

// ------------------------------------------------------------- the lobby

/** The whole lobby, w × h, everything that never moves. */
export function lobbyArt(L: MeLayout) {
  const { w, h, cx, frame, opening: O, floorY, dado, horizon, dial, medallion: M, beam } = L;
  const R = dial.R;

  const defs = `<defs>${COMMON_DEFS}
${lit("mwall", ["#5E3C22", "#4A2E1A", "#3A2414"], 0, 0, 0, h)}
${lit("mpanel", ["#8A5A34", "#6E4526", "#55341C"], 0, 0, 60, 120)}
${lit("mwains", ["#4A2E18", "#341F10", "#24150A"], 0, dado, 0, floorY)}
${linear("mwpanel", ["#5A381E", "#3E2614", "#2E1C0E"])}
${lit("mpil", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#C8902E"], 0, 0, frame.pil, 0)}
${lit("mleaf", ["#3E2716", "#2A180C", "#1E1008"], 0, O.y, 0, O.y + O.h)}
${lit("mray", ["#F0CC72", "#E2B04A", "#9A6B1E"], 0, dial.y - L.fan, 0, dial.y)}
${linear("mbronze", ["#E2A266", "#C27A3E", "#6E3A16"])}
${linear("mwalnut", ["#4A2C18", "#2E1A0E", "#1E1008"])}
${lit("mcream", ["#E6D6B8", "#CDB894", "#A8946E"], 0, floorY, 0, h)}
${lit("mdark", ["#5A3A22", "#3E2716", "#24150A"], 0, floorY, 0, h)}
${lit("mceil", ["#120A04", "#24160C"], 0, 0, 0, L.cornice)}
${lit("mbeam", ["#FFE7B0", "#FFE7B0", "#FFE7B0"], 0, beam.top, 0, beam.foot, [0, 0.075, 0.04])}
${lit("mshine", ["#FFD58A", "#FFD58A"], 0, floorY, 0, h, [0.22, 0])}
${radial("mpool", ["#FFE7B0", "#FFE7B0"], [0.42, 0])}
${radial("mshadow", ["#000000", "#000000"], [0.55, 0])}
${radial("mvign", ["#000000", "#000000"], [0, 0.62], 0.5, 0.42, 0.78)}
${radial("mlamp", ["#FFD58A", "#FFD58A"], [0.32, 0])}
${radial("mbulb", ["#FFF6E0", "#C8A060", "#5A3A10"], undefined, 0.35, 0.3, 0.75)}
${radial("mstone", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], undefined, 0.4, 0.3, 0.8)}
</defs>`;

  // ---- the wall: walnut, tall raised panels with gilt beading above the
  // brass dado rail, square ones in the wainscot below
  const wallTop = L.cornice + 10;
  const pw = 58;
  const n = Math.ceil(w / pw) + 1;
  const x0 = cx - (n * pw) / 2;
  const upper = Array.from({ length: n }, (_, i) => {
    const x = x0 + i * pw + 7;
    const y = wallTop + 14;
    const ph = dado - 12 - y;
    if (ph < 20) return "";
    return `<path d="${rrect(x, y + 2, pw - 14, ph, 3)}" fill="#000" fill-opacity="0.35"/><path d="${rrect(x, y, pw - 14, ph, 3)}" fill="url(#mpanel)" stroke="#1E1008" stroke-width="1"/><path d="${rrect(x + 4, y + 4, pw - 22, ph - 8, 2)}" fill="none" stroke="url(#mgold)" stroke-width="1.1"/><path d="${rrect(x + 4, y + 4, pw - 22, ph - 8, 2)}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="0.4"/><path d="M${f(x + 2)} ${f(y + 1.6)}H${f(x + pw * 0.5)}" stroke="#fff" stroke-opacity="0.25" stroke-width="0.9" stroke-linecap="round"/>`;
  }).join("");
  const grain = Array.from({ length: Math.ceil(w / 9) }, (_, i) => {
    const x = i * 9 + ((i * 37) % 5);
    return `<path d="M${x} ${wallTop}C${x + 3} ${f(dado * 0.4)} ${x - 3} ${f(dado * 0.7)} ${x + 1} ${dado}" fill="none" stroke="#1A0E06" stroke-opacity="${i % 3 ? 0.14 : 0.22}" stroke-width="0.8"/>`;
  }).join("");
  const lower = Array.from({ length: n }, (_, i) => {
    const x = x0 + i * pw + 6;
    const y = dado + 12;
    const ph = floorY - 12 - y;
    if (ph < 10) return "";
    return `<path d="${rrect(x, y, pw - 12, ph, 2)}" fill="url(#mwpanel)" stroke="#120804" stroke-width="1"/><path d="M${f(x + 2)} ${f(y + 1.5)}H${f(x + pw * 0.45)}" stroke="#fff" stroke-opacity="0.16" stroke-width="0.8" stroke-linecap="round"/>`;
  }).join("");
  const wall = `
<rect width="${w}" height="${h}" fill="url(#mwall)"/>
${grain}
${upper}
<rect y="${dado}" width="${w}" height="${f(floorY - dado)}" fill="url(#mwains)"/>
${lower}
<rect y="${dado - 3}" width="${w}" height="7" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.9"/>
<path d="M0 ${dado + 0.5}H${w}" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M0 ${dado - 1.6}H${w}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.8"/>
<rect y="${floorY - 10}" width="${w}" height="10" fill="#1A0E06"/>
<path d="M0 ${floorY - 10}H${w}" stroke="url(#mgold)" stroke-width="1.6"/>`;

  // ---- the ceiling and its cornice: a gilt moulding with dentils
  const dentils = Array.from({ length: Math.ceil(w / 10) }, (_, i) =>
    `<rect x="${i * 10 + 2}" y="${L.cornice + 4}" width="6" height="5" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.5"/>`,
  ).join("");
  const ceiling = `
<rect width="${w}" height="${L.cornice}" fill="url(#mceil)"/>
<rect y="${L.cornice}" width="${w}" height="${wallTop - L.cornice}" fill="#24140A"/>
<rect y="${L.cornice - 2}" width="${w}" height="5" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.8"/>
${dentils}
<path d="M0 ${wallTop}H${w}" stroke="url(#mgold)" stroke-width="1.6"/>
<path d="M0 ${wallTop + 2}H${w}" stroke="#000" stroke-opacity="0.45" stroke-width="3"/>`;

  // ---- the floor: marble squares running toward us, cream and walnut
  const depth = floorY - horizon;
  const tile = depth * 0.17;
  const rows: number[] = [floorY];
  for (let k = 1; rows[rows.length - 1] < h && k < 30; k++) rows.push(horizon + depth / (1 - k * 0.1));
  const J = Math.ceil(w / 2 / tile) + 2;
  const at = (j: number, y: number) => cx + j * tile * ((y - horizon) / depth);
  let cream = "";
  let dark = "";
  for (let k = 0; k < rows.length - 1; k++) {
    const y0 = rows[k];
    const y1 = Math.min(rows[k + 1], h + 40);
    for (let j = -J; j < J; j++) {
      const d = `M${f(at(j, y0))} ${f(y0)}L${f(at(j + 1, y0))} ${f(y0)}L${f(at(j + 1, y1))} ${f(y1)}L${f(at(j, y1))} ${f(y1)}Z`;
      if ((j + k) % 2 === 0) cream += d;
      else dark += d;
    }
  }
  const joints =
    rows.map((y) => `M0 ${f(y)}H${w}`).join("") +
    Array.from({ length: 2 * J + 1 }, (_, i) => {
      const j = i - J;
      return `M${f(at(j, floorY))} ${floorY}L${f(at(j, h + 40))} ${h + 40}`;
    }).join("");
  // a few soft veins across the cream stones
  const veins = Array.from({ length: 7 }, (_, i) => {
    const y = floorY + ((i * 53) % Math.max(1, h - floorY));
    const x = (i * 97) % w;
    return `<path d="M${x} ${f(y)}c18 4 30 -6 52 2s30 10 46 4" fill="none" stroke="#A89878" stroke-opacity="0.25" stroke-width="0.8"/>`;
  }).join("");
  const floor = `
<rect y="${floorY}" width="${w}" height="${f(h - floorY)}" fill="url(#mdark)"/>
<path d="${cream}" fill="url(#mcream)"/>
<path d="${dark}" fill="url(#mdark)"/>
${veins}
<path d="${joints}" stroke="#1A0E06" stroke-opacity="0.55" stroke-width="0.8" fill="none"/>
<rect x="${f(O.x - 20)}" y="${floorY}" width="${f(O.w + 40)}" height="${f(h - floorY)}" fill="url(#mshine)"/>
<rect y="${floorY}" width="${w}" height="6" fill="#000" fill-opacity="0.3"/>`;

  // ---- the lift's door
  const fx = frame.x;
  const fw = frame.w;
  const pil = frame.pil;
  const ly = frame.lintel;
  const lh = frame.lintelH;

  // the sunburst fanning up behind the dial, in a gold rim
  const fan = L.fan;
  const rays = Array.from({ length: 19 }, (_, i) => {
    const deg = -90 + (180 * (i + 0.5)) / 19;
    const [x0r, y0r] = pt(cx, dial.y, R + 4, deg - 1.6);
    const [x1r, y1r] = pt(cx, dial.y, fan - 6, deg - 3.6);
    const [x2r, y2r] = pt(cx, dial.y, fan - 6, deg + 3.6);
    const [x3r, y3r] = pt(cx, dial.y, R + 4, deg + 1.6);
    return `<path d="M${x0r} ${y0r}L${x1r} ${y1r}L${x2r} ${y2r}L${x3r} ${y3r}Z" fill="url(#mray)" fill-opacity="${i % 2 ? 0.55 : 0.9}" stroke="${INK}" stroke-width="0.6"/>`;
  }).join("");
  const sunburst = `
<path d="${halfDisc(cx, dial.y + 3, fan + 2)}" fill="#000" fill-opacity="0.45"/>
<path d="${halfDisc(cx, dial.y, fan)}" fill="url(#mwalnut)"/>
${rays}
<path d="${band(cx, dial.y, fan - 6, fan, -90, 90)}" fill="url(#mgold)" stroke="${INK}" stroke-width="1"/>
<path d="M${f(cx - fan + 3)} ${dial.y}A${fan - 3} ${fan - 3} 0 0 1 ${f(cx + fan - 3)} ${dial.y}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${pt(cx, dial.y, fan - 1.5, -64).join(" ")}A${fan - 1.5} ${fan - 1.5} 0 0 1 ${pt(cx, dial.y, fan - 1.5, -30).join(" ")}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`;

  // the dial: a gold rim, the ivory chapter ring, the night-blue face with
  // fine guilloché, a tick at each floor and a star at the lobby
  const ring0 = R - 6;
  const ring1 = R - 16;
  const ticks = DIAL_STOPS.map((deg, i) => {
    const [a, b] = pt(cx, dial.y, ring1 + 1.5, deg);
    const [c, d] = pt(cx, dial.y, ring0 - 1.5, deg);
    const pip = i === 0 ? "" : `<circle cx="${pt(cx, dial.y, (ring0 + ring1) / 2, deg)[0]}" cy="${pt(cx, dial.y, (ring0 + ring1) / 2, deg)[1]}" r="1.7" fill="${INK}"/>`;
    return `<path d="M${a} ${b}L${c} ${d}" stroke="${INK}" stroke-width="${i === 0 ? 0 : 0.9}"/>${pip}`;
  }).join("");
  const [sx, sy] = pt(cx, dial.y, (ring0 + ring1) / 2, DIAL_STOPS[0]);
  const star = starPath(sx, sy, 4.2);
  const guilloche = Array.from({ length: 4 }, (_, i) => {
    const r = ring1 - 5 - i * 6;
    return r > 6 ? `<path d="M${f(cx - r)} ${dial.y}A${r} ${r} 0 0 1 ${f(cx + r)} ${dial.y}" fill="none" stroke="#C8A050" stroke-opacity="0.22" stroke-width="0.5"/>` : "";
  }).join("");
  const dialArt = `
<path d="${halfDisc(cx, dial.y + 2.5, R + 1.5)}" fill="#000" fill-opacity="0.5"/>
<path d="${halfDisc(cx, dial.y, ring1)}" fill="url(#mface)"/>
${guilloche}
<path d="${band(cx, dial.y, ring1, ring0, -90, 90)}" fill="url(#mivory)" stroke="${INK}" stroke-width="0.8"/>
${ticks}
<path d="${star}" fill="url(#msv)" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
<path d="${band(cx, dial.y, ring0, R, -90, 90)}" fill="url(#mgold)"/>
<path d="M${f(cx - R + 3)} ${dial.y}A${R - 3} ${R - 3} 0 0 1 ${f(cx + R - 3)} ${dial.y}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${pt(cx, dial.y, R - 1.4, -62).join(" ")}A${R - 1.4} ${R - 1.4} 0 0 1 ${pt(cx, dial.y, R - 1.4, -24).join(" ")}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
<path d="${halfDisc(cx, dial.y, R)}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;

  // the lintel: a frieze of gold chevrons between gilt mouldings, a
  // stepped crown at each end
  const chev: string[] = [];
  for (let x = fx - 4; x < fx + fw + 4; x += 12) {
    chev.push(`M${f(x)} ${f(ly + lh * 0.74)}L${f(x + 6)} ${f(ly + lh * 0.3)}L${f(x + 12)} ${f(ly + lh * 0.74)}`);
  }
  const steps = (x: number, k: number) =>
    [0, 1, 2]
      .map((s) => {
        const sw = pil + 10 - s * 6;
        return `<rect x="${f(x - sw / 2)}" y="${f(ly - 5 - s * 5)}" width="${f(sw)}" height="5" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.7"/>`;
      })
      .join("") + stud(x, ly - 17, 2.4 + k * 0);
  const lintel = `
<rect x="${f(fx - 6)}" y="${f(ly + 3)}" width="${f(fw + 12)}" height="${lh}" fill="#000" fill-opacity="0.45"/>
<clipPath id="mlin"><rect x="${f(fx - 6)}" y="${ly}" width="${f(fw + 12)}" height="${lh}"/></clipPath>
<rect x="${f(fx - 6)}" y="${ly}" width="${f(fw + 12)}" height="${lh}" fill="url(#mfrieze)"/>
<g clip-path="url(#mlin)"><path d="${chev.join("")}" fill="none" stroke="${INK}" stroke-width="3.2"/><path d="${chev.join("")}" fill="none" stroke="url(#mgoldv)" stroke-width="1.8"/></g>
${[ly, ly + lh - 4].map((y) => `<rect x="${f(fx - 8)}" y="${y}" width="${f(fw + 16)}" height="4" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(fx - 6)} ${y + 1}H${f(fx + fw * 0.5)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`).join("")}
${steps(fx + pil / 2, 0)}${steps(fx + fw - pil / 2, 1)}`;

  // fluted brass pilasters down both sides of the opening
  const top0 = ly + lh;
  const bot0 = floorY;
  const pilaster = (x: number) => {
    const flutes = [0.3, 0.52, 0.74]
      .map((k) => {
        const fl = x + pil * k;
        return `<rect x="${f(fl - 1.3)}" y="${top0 + 12}" width="2.6" height="${f(bot0 - top0 - 26)}" rx="1.3" fill="#5A3A0E" fill-opacity="0.75"/><path d="M${f(fl + 1.4)} ${top0 + 13}V${f(bot0 - 14)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>`;
      })
      .join("");
    const cap = (y: number, dir: number) =>
      [0, 1].map((k) => `<rect x="${f(x - 2.5 + k * 2)}" y="${f(y + dir * k * 4 - (dir < 0 ? 4 : 0))}" width="${f(pil + 5 - k * 4)}" height="4" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.7"/>`).join("");
    return `<rect x="${x + 2}" y="${top0}" width="${pil}" height="${f(bot0 - top0)}" fill="#000" fill-opacity="0.4"/><rect x="${x}" y="${top0}" width="${pil}" height="${f(bot0 - top0)}" fill="url(#mpil)" stroke="${INK}" stroke-width="1"/>${flutes}${cap(top0 + 1, 1)}${cap(bot0 - 1, -1)}<path d="M${x + 1.4} ${top0 + 10}V${f(bot0 - 10)}" stroke="#fff" stroke-opacity="0.75" stroke-width="0.9"/>`;
  };

  // the doors: two brass-framed walnut leaves, shut; a sunburst inlaid
  // across the seam, fluting below it and a brass kick plate
  const seam = cx;
  const my = O.y + O.h * 0.3;
  const sr = Math.min(O.w * 0.27, O.h * 0.16);
  const leaf = (x: number, lw: number) => {
    const t = 5;
    return `<rect x="${f(x)}" y="${O.y}" width="${f(lw)}" height="${f(O.h)}" fill="url(#mgoldv)" stroke="${INK}" stroke-width="1"/><rect x="${f(x + t)}" y="${O.y + t}" width="${f(lw - 2 * t)}" height="${f(O.h - 2 * t - 18)}" fill="url(#mleaf)" stroke="${INK}" stroke-width="0.9"/><rect x="${f(x + t)}" y="${f(O.y + O.h - t - 16)}" width="${f(lw - 2 * t)}" height="16" fill="url(#mgold)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(x + t + 3)} ${f(O.y + O.h - t - 13)}H${f(x + lw - t - 3)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/><path d="M${f(x + 1.5)} ${O.y + 2}V${f(O.y + O.h - 2)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.8"/>`;
  };
  // long gold rays and short bronze ones between, a sunrise in brass
  const doorRays = Array.from({ length: 32 }, (_, i) => {
    const deg = (360 * i) / 32;
    const long = i % 2 === 0;
    const r1 = long ? sr : sr * 0.78;
    const [a0, b0] = pt(seam, my, sr * 0.3, deg - 2.4);
    const [a1, b1] = pt(seam, my, r1, deg - (long ? 5.2 : 4));
    const [a2, b2] = pt(seam, my, r1, deg + (long ? 5.2 : 4));
    const [a3, b3] = pt(seam, my, sr * 0.3, deg + 2.4);
    return `<path d="M${a0} ${b0}L${a1} ${b1}L${a2} ${b2}L${a3} ${b3}Z" fill="${long ? "url(#mray)" : "url(#mbronze)"}" stroke="${INK}" stroke-width="0.5"/>`;
  }).join("");
  const flutes = [-0.32, -0.2, 0.2, 0.32]
    .map((k) => {
      const x = seam + O.w * k;
      return `<path d="M${f(x)} ${f(my + sr + 12)}V${f(O.y + O.h - 30)}" stroke="${INK}" stroke-width="2.6"/><path d="M${f(x)} ${f(my + sr + 12)}V${f(O.y + O.h - 30)}" stroke="url(#mgoldv)" stroke-width="1.4"/>`;
    })
    .join("");
  // stepped chevrons over the sunburst
  const crest = [0, 1, 2]
    .map((k) => {
      const y = my - sr - 10 - k * 7;
      const wd = sr * (0.9 - k * 0.25);
      return `<path d="M${f(seam - wd)} ${f(y + 5)}L${seam} ${f(y - 2)}L${f(seam + wd)} ${f(y + 5)}" fill="none" stroke="${INK}" stroke-width="3"/><path d="M${f(seam - wd)} ${f(y + 5)}L${seam} ${f(y - 2)}L${f(seam + wd)} ${f(y + 5)}" fill="none" stroke="url(#mgoldv)" stroke-width="1.7"/>`;
    })
    .join("");
  const doors = `
<rect x="${O.x}" y="${O.y}" width="${O.w}" height="${O.h}" fill="#0C0704"/>
${leaf(O.x, O.w / 2)}${leaf(seam, O.w / 2)}
${crest}
<circle cx="${seam}" cy="${f(my + 1.5)}" r="${f(sr + 2)}" fill="#000" fill-opacity="0.4"/>
<circle cx="${seam}" cy="${f(my)}" r="${f(sr + 2)}" fill="#1A0E06"/>
${doorRays}
<path d="${oval(seam, my, sr + 4.5, sr + 4.5)}${oval(seam, my, sr, sr)}" fill-rule="evenodd" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.9"/>
${Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return `<circle cx="${f(seam + Math.cos(a) * (sr + 2.25))}" cy="${f(my + Math.sin(a) * (sr + 2.25))}" r="1.1" fill="url(#msv)" stroke="${VEIN}" stroke-width="0.3"/>`;
  }).join("")}
<circle cx="${seam}" cy="${f(my)}" r="${f(sr * 0.3)}" fill="url(#msv)" stroke="${INK}" stroke-width="1"/>
${flutes}
<path d="M${seam} ${O.y}V${O.y + O.h}" stroke="#0C0704" stroke-width="2"/>
<path d="M${seam + 1.6} ${O.y + 4}V${f(O.y + O.h - 4)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>
<rect x="${O.x}" y="${O.y}" width="${O.w}" height="8" fill="#000" fill-opacity="0.35"/>`;

  // the sill: a brass threshold under the doors
  const sill = `<rect x="${f(fx - 2)}" y="${floorY - 2}" width="${f(fw + 4)}" height="7" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.9"/><path d="M${fx} ${floorY - 0.6}H${f(fx + fw * 0.6)}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/>`;

  // the lamps on the pilasters: a stepped brass plate and a frosted shell
  const sconces = L.sconces
    .map(({ x, y }) => {
      const sw = 26;
      const shell = `M${f(x - sw / 2)} ${f(y)}A${sw / 2} ${sw / 2 + 2} 0 0 0 ${f(x + sw / 2)} ${f(y)}Z`;
      const ribs = [-0.6, -0.2, 0.2, 0.6]
        .map((k) => `<path d="M${f(x + (k * sw) / 2)} ${f(y + 1)}L${f(x + k * 3)} ${f(y + sw / 2 - 1)}" stroke="#C8B080" stroke-width="0.6"/>`)
        .join("");
      return `<circle cx="${x}" cy="${f(y + 2)}" r="34" fill="url(#mlamp)"/>
<path d="${rrect(x - 6, y - 4, 12, 26, 3)}" fill="url(#mgold)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${x - 4} ${y + 22}L${x} ${y + 30}L${x + 4} ${y + 22}Z" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.7"/>
<path d="${shell}" fill="url(#mstone)" stroke="${INK}" stroke-width="0.9"/>
${ribs}
<rect x="${f(x - sw / 2 - 1)}" y="${f(y - 1.5)}" width="${sw + 2}" height="3" rx="1.5" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.7"/>`;
    })
    .join("");

  // the medallion in the floor: a gold ring round walnut, an ivory disc
  // with an eight-point compass star, a gold boss
  const { x: mx, y: mmy, rx, ry } = M;
  const k = ry / rx;
  const at8 = (r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${f(mx + Math.cos(a) * r)} ${f(mmy + Math.sin(a) * r * k)}`;
  };
  const point = (deg: number, long: number, half: number) =>
    `M${at8(long, deg)}L${at8(half, deg + 22.5)}L${at8(0, 0)}L${at8(half, deg - 22.5)}Z`;
  const starParts = [0, 90, 180, 270].map((d) => point(d + 45, rx * 0.5, rx * 0.14)).join("");
  const starMain = [0, 90, 180, 270].map((d) => point(d, rx * 0.66, rx * 0.16)).join("");
  const medallion = `
<path d="${oval(mx, mmy, rx * 1.9, ry * 2.1)}" fill="url(#mpool)"/>
<path d="${oval(mx, mmy + 2, rx + 2, ry + 2)}" fill="#000" fill-opacity="0.4"/>
<path d="${oval(mx, mmy, rx, ry)}${oval(mx, mmy, rx * 0.88, ry * 0.88)}" fill-rule="evenodd" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.9"/>
<path d="${oval(mx, mmy, rx * 0.94, ry * 0.94)}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="${oval(mx, mmy, rx * 0.88, ry * 0.88)}" fill="url(#mwalnut)"/>
<path d="${oval(mx, mmy, rx * 0.74, ry * 0.74)}" fill="url(#mivory)" stroke="${INK}" stroke-width="0.7"/>
<path d="${starParts}" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
<path d="${starMain}" fill="url(#mgold)" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
<path d="${oval(mx, mmy, rx * 0.12, ry * 0.12)}" fill="url(#msv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(mx - rx * 0.86)} ${f(mmy - ry * 0.2)}A${f(rx * 0.94)} ${f(ry * 0.94)} 0 0 1 ${f(mx - rx * 0.3)} ${f(mmy - ry * 0.9)}" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="1"/>
<path d="${oval(mx, mmy, rx * 1.2, ry * 1.25)}" fill="url(#mpool)"/>
<path d="${oval(mx, mmy + 2, rx * 0.5, ry * 0.42)}" fill="url(#mshadow)"/>`;

  // the spotlight's beam from the lintel down onto the medallion: three
  // cones, one inside the other, so its edges are soft
  const cone = (s: number) =>
    `<path d="M${f(cx - (beam.topW * s) / 2)} ${f(beam.top)}L${f(cx + (beam.topW * s) / 2)} ${f(beam.top)}L${f(cx + (beam.footW * s) / 2)} ${f(beam.foot)}L${f(cx - (beam.footW * s) / 2)} ${f(beam.foot)}Z" fill="url(#mbeam)"/>`;
  const light = [1, 0.8, 0.58, 0.36].map(cone).join("");

  // the marquee: crimson enamel in a gold moulding, hung on two rods,
  // a stepped crest with an emerald, glass bulbs all round
  const Q = L.marquee;
  const rods = [-0.32, 0.32]
    .map((kk) => {
      const x = cx + Q.w * kk;
      return `<path d="M${f(x)} ${L.cornice + 8}V${Q.y}" stroke="${INK}" stroke-width="3"/><path d="M${f(x)} ${L.cornice + 8}V${Q.y}" stroke="url(#mgold)" stroke-width="1.6"/>${stud(x, L.cornice + 9, 2.2)}`;
    })
    .join("");
  const crestSteps = [0, 1, 2]
    .map((s) => {
      const sw = Q.w * (0.46 - s * 0.13);
      return `<path d="${rrect(cx - sw / 2, Q.y - 6 - s * 6, sw, 8, 2)}" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(cx - sw / 2 + 3)} ${f(Q.y - 4.6 - s * 6)}H${f(cx)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`;
    })
    .join("");
  const crestFan = Array.from({ length: 7 }, (_, i) => {
    const deg = -90 + (180 * (i + 0.5)) / 7;
    const r0 = 4;
    const r1 = 13;
    const [a, b] = pt(cx, Q.y - 18, r0, deg - 6);
    const [c, d] = pt(cx, Q.y - 18, r1, deg - 9);
    const [e, g] = pt(cx, Q.y - 18, r1, deg + 9);
    const [p, q] = pt(cx, Q.y - 18, r0, deg + 6);
    return `<path d="M${a} ${b}L${c} ${d}L${e} ${g}L${p} ${q}Z" fill="url(#mgold)" stroke="${INK}" stroke-width="0.6"/>`;
  }).join("");
  const bulbs = L.bulbs
    .map((b) => `<circle cx="${b.x}" cy="${b.y}" r="3.4" fill="url(#mgoldv)" stroke="${INK}" stroke-width="0.5"/><circle cx="${b.x}" cy="${b.y}" r="2.4" fill="url(#mbulb)"/>`)
    .join("");
  const marquee = `
${rods}
${crestFan}
${toSvgBody([{ jewel: "emerald", x: cx, y: Q.y - 19, r: 4 }], undefined, "mq")}
${crestSteps}
<path d="${rrect(Q.x, Q.y + 3, Q.w, Q.h, 9)}" fill="#000" fill-opacity="0.5"/>
${moulding(Q.x, Q.y, Q.w, Q.h, 9, 5, "mqm")}
<path d="${rrect(Q.x + 5, Q.y + 5, Q.w - 10, Q.h - 10, 5)}" fill="#3A0408"/>
<path d="${rrect(Q.x + 9, Q.y + 9, Q.w - 18, Q.h - 18, 4)}" fill="url(#menamel)" stroke="#2A0206" stroke-width="0.9"/>
<path d="M${f(Q.x + 14)} ${Q.y + 11.5}H${f(Q.x + Q.w * 0.5)}" stroke="#fff" stroke-opacity="0.28" stroke-width="1.6" stroke-linecap="round"/>
${bulbs}`;


  return svg(
    w,
    h,
    `${defs}
${wall}
${ceiling}
${floor}
<rect width="${w}" height="${h}" fill="url(#mvign)"/>
${sunburst}
${dialArt}
${doors}
${pilaster(fx)}${pilaster(fx + fw - pil)}
${lintel}
${sill}
${light}
${sconces}
${medallion}
${marquee}`,
  );
}

/** A five-pointed star at (x, y), `r` to its points. */
function starPath(x: number, y: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.45 : r;
    return `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`;
  });
  return `M${pts.join("L")}Z`;
}

// ------------------------------------------------------------- the pieces

/** A round button on the wall, size × (size + 14): a beaded gold rim
 *  round an enamel face of `face`, rays on the enamel, the emblem in
 *  the middle; a little walnut plate for its name under it. */
export function buttonArt(size: number, face: string, emblem: { data: EmblemData; tint?: string } | null) {
  const c = size / 2;
  const r = c - 2;
  const fr = r - size * 0.12;
  const beads = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    const d = (r + fr) / 2;
    return `<circle cx="${f(c + Math.cos(a) * d)}" cy="${f(c + Math.sin(a) * d)}" r="${f(size * 0.024)}" fill="url(#bb)" stroke="${VEIN}" stroke-width="0.4"/>`;
  }).join("");
  const rays = Array.from({ length: 16 }, (_, i) => {
    const deg = (360 * i) / 16;
    const [a0, b0] = pt(c, c, fr * 0.35, deg);
    const [a1, b1] = pt(c, c, fr - 1, deg);
    return `M${a0} ${b0}L${a1} ${b1}`;
  }).join("");
  const es = size * 0.6;
  const em = emblem
    ? `<g transform="translate(${f(c - es / 2)} ${f(c - es / 2)}) scale(${f(es / 48)})">${toSvgBody(emblem.data, emblem.tint, "be")}</g>`
    : "";
  const lightFace = shadeHex(face, 0.35);
  const deepFace = shadeHex(face, -0.45);
  return svg(
    size,
    size + 3,
    `<defs>${linear("bg", GOLD)}${radial("bb", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.35, 0.3, 0.75)}${radial("bf", [lightFace, face, deepFace], undefined, 0.38, 0.3, 0.85)}</defs>
<circle cx="${c}" cy="${c + 3}" r="${r}" fill="#000" fill-opacity="0.45"/>
<circle cx="${c}" cy="${c}" r="${r}" fill="url(#bg)" stroke="${INK}" stroke-width="1.2"/>
${beads}
<circle cx="${c}" cy="${c}" r="${f(fr)}" fill="url(#bf)" stroke="${INK}" stroke-width="1"/>
<path d="${rays}" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>
<path d="M${f(c + Math.cos(-2.5) * (r - 1.6))} ${f(c + Math.sin(-2.5) * (r - 1.6))}A${f(r - 1.6)} ${f(r - 1.6)} 0 0 1 ${f(c + Math.cos(-1.7) * (r - 1.6))} ${f(c + Math.sin(-1.7) * (r - 1.6))}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
<path d="M${f(c + Math.cos(-2.4) * (fr - 2.5))} ${f(c + Math.sin(-2.4) * (fr - 2.5))}A${f(fr - 2.5)} ${f(fr - 2.5)} 0 0 1 ${f(c + Math.cos(-1.5) * (fr - 2.5))} ${f(c + Math.sin(-1.5) * (fr - 2.5))}" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="1.4" stroke-linecap="round"/>
${em}`,
  );
}

/** A colour lightened (amount > 0) or darkened. */
function shadeHex(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** The little plate a button's name sits on, w × h. */
export function labelArt(w: number, h: number) {
  return svg(
    w,
    h + 2,
    `<defs>${linear("lw", ["#4A2C18", "#2E1A0E"])}</defs>
<path d="${rrect(0.5, 2, w - 1, h - 1, h / 2)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(0.5, 0.5, w - 1, h - 1, h / 2)}" fill="url(#lw)"/>
${moulding(0.5, 0.5, w - 1, h - 1, h / 2, 1.8, "lm")}`,
  );
}

/** My name plate beside my avatar, w × h: walnut in a gold moulding. */
export function plateArt(w: number, h: number) {
  return svg(
    w,
    h + 3,
    `<defs>${linear("pw", ["#4A2C18", "#2E1A0E", "#1E1008"])}</defs>
<path d="${rrect(0, 3, w, h, 10)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(1, 1, w - 2, h - 2, 9)}" fill="url(#pw)"/>
${moulding(0, 0, w, h, 10, 3, "pm")}`,
  );
}

/** Room drawn above the PLAY button for its crest. */
export const PLAY_PAD = 8;

/** The big PLAY button, w × h (drawn PLAY_PAD down in its picture): orange enamel in a gold moulding, a fan
 *  of gold rays in each end, a chevron crest on its top edge. */
export function playArt(w: number, h: number) {
  const r = 16;
  const t = 5;
  const fan = (x: number, sx: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const a0 = -90 + (i * 180) / 5;
      const a1 = a0 + 180 / 5 - 6;
      const rr = h * 0.36;
      const p = (a: number, q: number) => {
        const tt = (a * Math.PI) / 180;
        return `${f(x + sx * Math.cos(tt) * q * 0.6)} ${f(h / 2 + Math.sin(tt) * q)}`;
      };
      return `<path d="M${p(a0, 4)}L${p(a0, rr)}L${p(a1, rr)}L${p(a1, 4)}Z" fill="url(#pg)" fill-opacity="0.85" stroke="${INK}" stroke-width="0.6"/>`;
    }).join("");
  const cx = w / 2;
  return svg(
    w,
    h + PLAY_PAD + 4,
    `<defs>${linear("pg", GOLD, false)}${linear("pe", ["#FFC46A", "#F9A23B", "#E9781C", "#B4540E"])}${radial("pl", ["#FFFFFF", "#FFFFFF"], [0.32, 0], 0.4, 0.15, 0.6)}${radial("pc", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}</defs><g transform="translate(0 ${PLAY_PAD})">
<path d="${rrect(0, 4, w, h, r)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(t, t, w - 2 * t, h - 2 * t, r - t)}" fill="url(#pe)"/>
<path d="${rrect(t, t, w - 2 * t, h - 2 * t, r - t)}" fill="url(#pl)"/>
${fan(t + 4, 1)}${fan(w - t - 4, -1)}
<path d="M${f(t + r)} ${f(h - t - 3)}H${f(w - t - r)}" stroke="#7A2A04" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>
${moulding(0, 0, w, h, r, t, "pm")}
<path d="M${f(cx - 26)} 1L${cx} -7L${f(cx + 26)} 1L${f(cx + 19)} 6L${cx} 0L${f(cx - 19)} 6Z" fill="url(#pg)" stroke="${INK}" stroke-width="0.9" transform="translate(0 4)"/>
<circle cx="${cx}" cy="2.5" r="3" fill="url(#pc)" stroke="${INK}" stroke-width="0.7"/></g>`,
  );
}

/** The room key above PLAY, w × h: a walnut fob in a gold moulding, a
 *  brass ring with a little key at its left end. */
export function keyArt(w: number, h: number) {
  const r = h / 2;
  const kx = r;
  const ky = h / 2;
  const key: EmblemData = [
    { d: `M${kx - 1} ${ky - 2.2}H${kx + 15}V${ky + 2.2}H${kx - 1}Z`, m: "gold", ink: 0.9, shine: `M${kx} ${ky - 1}H${kx + 13}` },
    { d: `M${kx + 10} ${ky + 2}V${ky + 7}H${kx + 13}V${ky + 2}ZM${kx + 14} ${ky + 2}V${ky + 5.5}H${kx + 15.5}V${ky + 2}Z`, m: "gold", ink: 0.8 },
    { d: `M${kx - 9} ${ky}A7 7 0 1 1 ${kx + 5} ${ky}A7 7 0 1 1 ${kx - 9} ${ky}ZM${kx - 5.5} ${ky}A3.5 3.5 0 1 0 ${kx + 1.5} ${ky}A3.5 3.5 0 1 0 ${kx - 5.5} ${ky}Z`, m: "gold", evenOdd: true, round: true, ink: 1, shine: `M${kx - 7} ${ky - 2}A5.4 5.4 0 0 1 ${kx - 3} ${ky - 5.6}` },
  ];
  return svg(
    w,
    h + 3,
    `<defs>${linear("kw", ["#4A2C18", "#2E1A0E", "#1E1008"])}</defs>
<path d="${rrect(0, 3, w, h, r)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(1, 1, w - 2, h - 2, r - 1)}" fill="url(#kw)"/>
${moulding(0, 0, w, h, r, 3, "km")}
<circle cx="${f(w - r)}" cy="${f(ky)}" r="3.4" fill="#120804" stroke="${VEIN}" stroke-width="0.7"/>
${toSvgBody(key, undefined, "kk")}`,
  );
}

/** A small ruby set in gold: the dot that says there's mail. */
export function dotArt(s: number) {
  const c = s / 2;
  return svg(
    s,
    s,
    `<defs>${radial("dg", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.75)}${radial("dr", ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.35, 0.3, 0.75)}</defs>
<circle cx="${c}" cy="${c}" r="${c - 0.6}" fill="url(#dg)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${c}" cy="${c}" r="${f(c - 3)}" fill="url(#dr)" stroke="${INK}" stroke-width="0.6"/>`,
  );
}

// The lift's still art (the Games tab), as SVG markup baked once into
// images: the cab front (a walnut panel with a brass sunburst across the
// top, the floor dial set in it, the lintel with its chevron frieze and
// the page's sign, the side plates for the call buttons and the players
// counter, fluted brass pilasters down the opening, the threshold, the
// floor's plaque), the dial's needle and its jewelled hub, the steel
// girder between floors and each floor's landing (wall, wainscot, boards
// and the light falling on them). Drawn in the house style: gradients lit
// from the upper left, an ink outline, grooves and one line of shine.
// What moves (the needle, the jewel, the gate, the lead, the light) is
// drawn live by LiftDial and LiftShaft.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { hallWall } from "@/features/badges/hall/art";
import type { LiftLayout } from "./layout";

const f = (n: number) => +n.toFixed(2);
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const WALNUT = ["#4A2C18", "#2E1A0E", "#1E1008"];

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;
/** A gradient lit from the upper left across a box (userSpace). */
const lit = (id: string, colors: readonly string[], x0: number, y0: number, x1: number, y1: number) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;
const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)] as const;
};
/** An annular band from `a0` to `a1` degrees (0 = up), radii r0 < r1. */
function band(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [ox0, oy0] = pt(cx, cy, r1, a0);
  const [ox1, oy1] = pt(cx, cy, r1, a1);
  const [ix1, iy1] = pt(cx, cy, r0, a1);
  const [ix0, iy0] = pt(cx, cy, r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${ox0} ${oy0}A${r1} ${r1} 0 ${big} 1 ${ox1} ${oy1}L${ix1} ${iy1}A${r0} ${r0} 0 ${big} 0 ${ix0} ${iy0}Z`;
}
/** A half disc standing on its diameter. */
const halfDisc = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 0 1 ${f(cx + r)} ${f(cy)}Z`;

/** A small round brass stud. */
const stud = (x: number, y: number, r: number, id = "lsv") =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#${id})" stroke="${INK}" stroke-width="0.6"/>`;

// ------------------------------------------------------------- the cab

/** Everything on the page that never moves, w × h: the planks, the cab
 *  front with the dial (each floor's emblem round it), the side plates,
 *  the pilasters, the threshold and the plaque. */
export function cabArt(L: LiftLayout, emblems: { data: EmblemData; tint?: string }[]) {
  const { w, h, cx, cy, R, lintel, sign, headerH, panels, margin, pilaster, plaque, opening, sill, stops } = L;
  const defs = `<defs>
${lit("lwal", WALNUT, 0, 0, w * 0.4, headerH * 1.4)}
${linear("lgold", GOLD, false)}
${linear("lgoldv", GOLD)}
${lit("lpil", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#C8902E"], 0, 0, pilaster, 0)}
<radialGradient id="lray" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(w * 0.62)}"><stop offset="0" stop-color="#F0CC72"/><stop offset="0.4" stop-color="#E2B04A"/><stop offset="1" stop-color="#9A6B1E" stop-opacity="0.25"/></radialGradient>
${radial("lsv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("lface", ["#2A3550", "#141A2A", "#080B12"], undefined, 0.5, 0.75, 0.8)}
${linear("livory", MATERIALS.ivory)}
${linear("lenamel", ["#D2384A", "#9A1828", "#5A0812"])}
${linear("lfrieze", ["#1A2234", "#0C1018"])}
${linear("lplank", ["#3E2716", "#2A180C"])}
${radial("lglow", ["#FFE7B0", "#FFE7B0"], [0.2, 0], 0.5, 1, 0.9)}
${radial("lshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.45, 0.75)}
<clipPath id="lhead"><rect width="${w}" height="${headerH}"/></clipPath>
<clipPath id="lplq"><path d="${rrect(plaque.x + 7, plaque.y + 7, plaque.w - 14, plaque.h - 14, 10)}"/></clipPath>
</defs>`;

  // the walnut panel across the top, grain running across, and the brass
  // sunburst fanning up from behind the dial
  const grain = Array.from({ length: Math.ceil(headerH / 7) }, (_, i) => {
    const y = 4 + i * 7 + ((i * 37) % 5);
    return `<path d="M0 ${f(y)}C${f(w * 0.3)} ${f(y - 2)} ${f(w * 0.6)} ${f(y + 2.5)} ${w} ${f(y)}" fill="none" stroke="${i % 3 ? "#120804" : "#7A5030"}" stroke-opacity="${i % 3 ? 0.3 : 0.14}" stroke-width="0.8"/>`;
  }).join("");
  const rays = Array.from({ length: 25 }, (_, i) => {
    const deg = -90 + (180 * (i + 0.5)) / 25;
    const far = w;
    const [x0, y0] = pt(cx, cy, R + 4, deg - 1.1);
    const [x1, y1] = pt(cx, cy, far, deg - 2.2);
    const [x2, y2] = pt(cx, cy, far, deg + 2.2);
    const [x3, y3] = pt(cx, cy, R + 4, deg + 1.1);
    const [v0, v1] = pt(cx, cy, R + 8, deg);
    const [v2, v3] = pt(cx, cy, far, deg);
    return `<path d="M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z" fill="url(#lray)" fill-opacity="${i % 2 ? 0.5 : 0.8}" stroke="${INK}" stroke-width="0.6"/><path d="M${v0} ${v1}L${v2} ${v3}" stroke="${VEIN}" stroke-width="0.5"/>`;
  }).join("");

  // the dial: a gold rim, the ivory chapter ring the numbers sit on, the
  // night-blue face with fine guilloché, each floor's emblem inside
  const ring0 = R - 7;
  const ring1 = R - 31;
  const ticks = stops
    .map((s, i) => {
      const [a, b] = pt(cx, cy, ring1 + 1, s.deg);
      const [c, d] = pt(cx, cy, ring1 + 5, s.deg);
      const half =
        i < stops.length - 1
          ? (() => {
              const m = (s.deg + stops[i + 1].deg) / 2;
              const [e, g] = pt(cx, cy, ring0 - 1, m);
              const [k, l] = pt(cx, cy, ring0 - 6, m);
              return `<path d="M${e} ${g}L${k} ${l}" stroke="${INK}" stroke-width="1"/>`;
            })()
          : "";
      return `<path d="M${a} ${b}L${c} ${d}" stroke="${INK}" stroke-width="1.4"/>${half}`;
    })
    .join("");
  const guilloche =
    Array.from({ length: 5 }, (_, i) => {
      const r = ring1 - 8 - i * 9;
      return r > 14 ? `<path d="M${f(cx - r)} ${cy}A${r} ${r} 0 0 1 ${f(cx + r)} ${cy}" fill="none" stroke="#C8A050" stroke-opacity="0.22" stroke-width="0.6"/>` : "";
    }).join("") +
    Array.from({ length: 36 }, (_, i) => {
      const deg = -90 + (180 * (i + 0.5)) / 36;
      const [a, b] = pt(cx, cy, 16, deg);
      const [c, d] = pt(cx, cy, ring1 - 2, deg);
      return `<path d="M${a} ${b}L${c} ${d}" stroke="#C8A050" stroke-opacity="0.12" stroke-width="0.5"/>`;
    }).join("");
  const emblemSize = 25;
  const emblemMarks = stops
    .map((s, i) => {
      const e = emblems[i];
      if (!e) return "";
      const k = emblemSize / 48;
      const { x, y } = s.emblem;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${emblemSize * 0.62}" fill="url(#lglowe)"/><g transform="translate(${f(x - emblemSize / 2)} ${f(y - emblemSize / 2)}) scale(${f(k)})">${toSvgBody(e.data, e.tint, `le${i}`)}</g>`;
    })
    .join("");
  const dial = `
<path d="${halfDisc(cx, cy + 3, R + 2)}" fill="#000" fill-opacity="0.5"/>
<path d="${halfDisc(cx, cy, ring1)}" fill="url(#lface)"/>
${guilloche}
<defs>${radial("lglowe", ["#FFE7B0", "#FFE7B0"], [0.34, 0], 0.5, 0.5, 0.5)}</defs>
${emblemMarks}
<path d="${band(cx, cy, ring1, ring0, -90, 90)}" fill="url(#livory)"/>
<path d="${band(cx, cy, ring1, ring0, -90, 90)}" fill="none" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(cx - ring0 + 3)} ${cy}A${ring0 - 3} ${ring0 - 3} 0 0 1 ${f(cx + ring0 - 3)} ${cy}" fill="none" stroke="${INKS.ivory.vein}" stroke-width="0.6"/>
${ticks}
<path d="${band(cx, cy, ring0, R, -90, 90)}" fill="url(#lgold)"/>
<path d="M${f(cx - R + 3.5)} ${cy}A${R - 3.5} ${R - 3.5} 0 0 1 ${f(cx + R - 3.5)} ${cy}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
<path d="M${pt(cx, cy, R - 1.6, -62).join(" ")}A${R - 1.6} ${R - 1.6} 0 0 1 ${pt(cx, cy, R - 1.6, -20).join(" ")}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
<path d="${halfDisc(cx, cy, R)}" fill="none" stroke="${INK}" stroke-width="1.4"/>
<path d="M${f(cx - ring1)} ${cy}A${ring1} ${ring1} 0 0 1 ${f(cx + ring1)} ${cy}" fill="none" stroke="${INK}" stroke-width="1"/>
${[-1, 1].map((s) => stud(cx + s * (R - 3.5), cy - 3, 2.6)).join("")}`;

  // the lintel: gold mouldings round a frieze of chevrons, the sign
  const ly = lintel.y;
  const lh = lintel.h;
  const chevrons: string[] = [];
  for (let x = -6; x < w + 12; x += 14) {
    chevrons.push(`M${x} ${f(ly + lh * 0.72)}L${x + 7} ${f(ly + lh * 0.3)}L${x + 14} ${f(ly + lh * 0.72)}`);
  }
  const lintelArt = `
<rect x="0" y="${ly}" width="${w}" height="${lh}" fill="url(#lfrieze)"/>
<path d="${chevrons.join("")}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="miter"/>
<path d="${chevrons.join("")}" fill="none" stroke="url(#lgoldv)" stroke-width="2" stroke-linejoin="miter"/>
${[ly, ly + lh - 6].map((y) => `<rect x="-2" y="${y}" width="${w + 4}" height="6" fill="url(#lgoldv)" stroke="${INK}" stroke-width="0.9"/><path d="M0 ${y + 3}H${w}" stroke="${VEIN}" stroke-width="0.6"/><path d="M0 ${y + 1.2}H${w}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>`).join("")}
<path d="M0 ${ly + lh}H${w}" stroke="#000" stroke-opacity="0.45" stroke-width="6" transform="translate(0 3)"/>
<path d="${rrect(sign.x, sign.y + 3, sign.w, sign.h, 9)}" fill="#000" fill-opacity="0.45"/>
${moulding(sign.x, sign.y, sign.w, sign.h, 9, 4, "lsg")}
<path d="${rrect(sign.x + 4, sign.y + 4, sign.w - 8, sign.h - 8, 6)}" fill="url(#lenamel)" stroke="#3A0408" stroke-width="0.9"/>
<path d="M${f(sign.x + 12)} ${sign.y + 8}H${f(sign.x + sign.w * 0.5)}" stroke="#fff" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round"/>
${[-1, 1].map((s) => {
    // a stepped deco fin off each end of the sign
    const x = s < 0 ? sign.x : sign.x + sign.w;
    const d = `M${x} ${sign.y + 7}L${f(x + s * 14)} ${sign.y + 7}L${f(x + s * 14)} ${sign.y + 11}L${f(x + s * 24)} ${sign.y + 11}L${f(x + s * 24)} ${sign.y + sign.h - 11}L${f(x + s * 14)} ${sign.y + sign.h - 11}L${f(x + s * 14)} ${sign.y + sign.h - 7}L${x} ${sign.y + sign.h - 7}Z`;
    return `<path d="${d}" fill="url(#lgoldv)" stroke="${INK}" stroke-width="0.9"/>`;
  }).join("")}`;

  // the side plates: brass round a walnut face; the call buttons on the
  // left, the players counter on the right
  const plate = (p: { x: number; y: number; w: number; h: number }, id: string) =>
    `<path d="${rrect(p.x, p.y + 3, p.w, p.h, 10)}" fill="#000" fill-opacity="0.5"/>${moulding(p.x, p.y, p.w, p.h, 10, 4, id)}<path d="${rrect(p.x + 4, p.y + 4, p.w - 8, p.h - 8, 7)}" fill="url(#lplank)" stroke="${INK}" stroke-width="0.8"/>${[p.y + 9, p.y + p.h - 9].map((y) => stud(p.x + 9, y, 1.8) + stud(p.x + p.w - 9, y, 1.8)).join("")}`;
  const callButton = (x: number, y: number, up: boolean) => {
    const tri = up ? `M${x} ${y - 6}L${x + 6.5} ${y + 4.5}H${x - 6.5}Z` : `M${x} ${y + 6}L${x + 6.5} ${y - 4.5}H${x - 6.5}Z`;
    return `<circle cx="${x}" cy="${y + 1.5}" r="15" fill="#000" fill-opacity="0.45"/><circle cx="${x}" cy="${y}" r="15" fill="url(#lsv)" stroke="${INK}" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r="11.5" fill="#3A1A08" stroke="${VEIN}" stroke-width="0.7"/><circle cx="${x}" cy="${y}" r="10.4" fill="url(#lamber)"/><path d="${tri}" fill="url(#livory)" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/><path d="M${x - 9} ${y - 3}A9.6 9.6 0 0 1 ${x - 3} ${y - 9}" stroke="#fff" stroke-opacity="0.7" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  };
  const knob = (x: number, y: number, plus: boolean) =>
    `<circle cx="${x}" cy="${y + 1.5}" r="12" fill="#000" fill-opacity="0.45"/><circle cx="${x}" cy="${y}" r="12" fill="url(#lsv)" stroke="${INK}" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r="8.6" fill="none" stroke="${VEIN}" stroke-width="0.7"/><path d="M${x - 5} ${y}H${x + 5}${plus ? `M${x} ${y - 5}V${y + 5}` : ""}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M${x - 8} ${y - 3}A8.4 8.4 0 0 1 ${x - 3} ${y - 8}" stroke="#fff" stroke-opacity="0.8" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  const { left, right } = panels;
  const panelArt = `
${plate(left, "lpl")}
${callButton(left.x + left.w / 2, left.y + 46, true)}
${callButton(left.x + left.w / 2, left.y + 84, false)}
${plate(right, "lpr")}
${knob(right.x + right.w / 2, right.y + 40, true)}
<path d="${rrect(right.x + 8, right.y + 56, right.w - 16, 24, 4)}" fill="url(#livory)" stroke="${INK}" stroke-width="1"/>
<path d="M${right.x + 11} ${right.y + 58.4}H${f(right.x + right.w * 0.55)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
${knob(right.x + right.w / 2, right.y + 94, false)}`;

  // fluted brass pilasters either side of the opening, capitals and bases
  const top0 = headerH;
  const bot0 = opening.y + opening.h + sill;
  const pil = (x: number) => {
    const flutes = [0.3, 0.5, 0.7]
      .map((k) => {
        const fx = x + pilaster * k;
        return `<rect x="${f(fx - 1.6)}" y="${top0 + 18}" width="3.2" height="${f(bot0 - top0 - 36)}" rx="1.6" fill="#5A3A0E" fill-opacity="0.75"/><path d="M${f(fx + 1.7)} ${top0 + 19}V${f(bot0 - 19)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.7"/>`;
      })
      .join("");
    const step = (y: number, dir: number) =>
      [0, 1].map((k) => `<rect x="${f(x - 3 + k * 2)}" y="${f(y + dir * k * 5 - (dir < 0 ? 5 : 0))}" width="${f(pilaster + 6 - k * 4)}" height="5" fill="url(#lgoldv)" stroke="${INK}" stroke-width="0.8"/>`).join("");
    return `<rect x="${x + 2}" y="${top0}" width="${pilaster}" height="${f(bot0 - top0)}" fill="#000" fill-opacity="0.4"/><rect x="${x}" y="${top0}" width="${pilaster}" height="${f(bot0 - top0)}" fill="url(#lpil)" stroke="${INK}" stroke-width="1.1"/>${flutes}${step(top0 + 2, 1)}${step(bot0 - 2, -1)}<path d="M${x + 1.6} ${top0 + 14}V${f(bot0 - 14)}" stroke="#fff" stroke-opacity="0.8" stroke-width="1"/>`;
  };
  // the threshold: a brass sill with the gate's track cut in it
  const sy = opening.y + opening.h;
  const sillArt = `
<rect x="${margin + pilaster - 2}" y="${sy}" width="${f(opening.w + 4)}" height="${sill}" fill="url(#lgoldv)" stroke="${INK}" stroke-width="1"/>
<rect x="${opening.x + 4}" y="${sy + 6}" width="${f(opening.w - 8)}" height="4" rx="2" fill="#2A1A06"/>
<path d="M${opening.x + 4} ${sy + 11}H${f(opening.x + opening.w - 4)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8"/>
<path d="M${opening.x} ${sy + 1.4}H${f(opening.x + opening.w * 0.5)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
<path d="M${margin + pilaster - 2} ${sy + sill}H${f(margin + pilaster + opening.w + 2)}" stroke="#000" stroke-opacity="0.45" stroke-width="6" transform="translate(0 3)"/>`;

  // the plaque: walnut in a brass moulding, a quarter sunburst in each
  // top corner and a chevron crest on its top edge
  const P = plaque;
  const fan = (x: number, y: number, s: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a0 = (i * 90) / 6;
      const a1 = a0 + 90 / 6 - 2;
      const r = 26;
      const p = (a: number, rr: number) => {
        const t = (a * Math.PI) / 180;
        return `${f(x + s * Math.cos(t) * rr)} ${f(y + Math.sin(t) * rr)}`;
      };
      return `<path d="M${p(a0, 4)}L${p(a0, r)}L${p(a1, r)}L${p(a1, 4)}Z" fill="url(#lgold)" fill-opacity="0.75" stroke="${INK}" stroke-width="0.5"/>`;
    }).join("");
  const planks = Array.from({ length: Math.ceil(P.w / 34) }, (_, i) =>
    `<rect x="${f(P.x + i * 34)}" y="${P.y}" width="34" height="${P.h}" fill="${i % 2 ? "#3A2414" : "#432A17"}"/><rect x="${f(P.x + i * 34 + 32.5)}" y="${P.y}" width="1.5" height="${P.h}" fill="#1A0E06"/>`,
  ).join("");
  const plaqueArt = `
<path d="${rrect(P.x, P.y + 4, P.w, P.h, 16)}" fill="#000" fill-opacity="0.5"/>
<g clip-path="url(#lplq)">${planks}<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="url(#lshade)"/>${fan(P.x + 7, P.y + 7, 1)}${fan(P.x + P.w - 7, P.y + 7, -1)}</g>
${moulding(P.x, P.y, P.w, P.h, 16, 7, "lpm")}
<path d="M${f(cx - 30)} ${P.y + 1}L${cx} ${P.y - 9}L${f(cx + 30)} ${P.y + 1}L${f(cx + 22)} ${P.y + 7}L${cx} ${P.y}L${f(cx - 22)} ${P.y + 7}Z" fill="url(#lgoldv)" stroke="${INK}" stroke-width="1"/>
${stud(cx, P.y - 1.5, 3.2)}`;

  return svg(
    w,
    h,
    `${defs}
<defs>${radial("lamber", ["#7A3A10", "#4A1E06", "#2A1004"], undefined, 0.38, 0.32, 0.75)}</defs>
<g clip-path="url(#lhead)">
<rect width="${w}" height="${headerH}" fill="url(#lwal)"/>
${grain}
${rays}
<rect width="${w}" height="${headerH}" fill="url(#lglow)"/>
</g>
${dial}
${panelArt}
${lintelArt}
${pil(margin)}${pil(w - margin - pilaster)}
${sillArt}
${plaqueArt}`,
  );
}

/** The planks behind it all (the badge hall's wall, the app's wood). */
export const wallArt = (w: number, h: number) => hallWall(w, h);

// ------------------------------------------------------------- the dial

export const NEEDLE_W = 26;
/** The needle, pointing up from its pivot at (NEEDLE_W / 2, len), with
 *  a counterweight below; the box is NEEDLE_W × (len + 18). */
export function needleArt(len: number) {
  const c = NEEDLE_W / 2;
  const p = len;
  const tip = 2;
  const d = `M${c} ${tip}L${c + 5.5} ${tip + 13}L${c + 2.2} ${tip + 12}L${c + 2.6} ${f(p * 0.55)}L${c + 4.4} ${f(p * 0.62)}L${c + 2.4} ${f(p * 0.69)}L${c + 3} ${p}L${c - 3} ${p}L${c - 2.4} ${f(p * 0.69)}L${c - 4.4} ${f(p * 0.62)}L${c - 2.6} ${f(p * 0.55)}L${c - 2.2} ${tip + 12}L${c - 5.5} ${tip + 13}Z`;
  const tail = `M${c - 3} ${p}L${c - 7} ${p + 9}A7 7 0 0 0 ${c + 7} ${p + 9}L${c + 3} ${p}Z`;
  return svg(
    NEEDLE_W,
    len + 18,
    `<defs>${lit("ng", GOLD, c - 6, 0, c + 6, 10)}</defs>
<path d="${d}" fill="#000" fill-opacity="0.35" transform="translate(1.6 2.4)"/>
<path d="${tail}" fill="url(#ng)" stroke="${INK}" stroke-width="1"/>
<path d="${d}" fill="url(#ng)" stroke="${INK}" stroke-width="1"/>
<path d="M${c} ${tip + 6}V${p - 2}" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${c - 1.6} ${tip + 14}V${f(p * 0.52)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.8"/>`,
  );
}

export const HUB = 34;
/** The needle's hub, HUB square: a beaded gold boss set with a ruby. */
export function hubArt() {
  const c = HUB / 2;
  const beads = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return `<circle cx="${f(c + Math.cos(a) * 11.6)}" cy="${f(c + Math.sin(a) * 11.6)}" r="1.5" fill="url(#hb)" stroke="${INK}" stroke-width="0.4"/>`;
  }).join("");
  return svg(
    HUB,
    HUB,
    `<defs>${radial("hb", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.75)}${radial("hr", ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.35, 0.3, 0.75)}</defs>
<circle cx="${c + 1}" cy="${c + 2}" r="14.6" fill="#000" fill-opacity="0.4"/>
<circle cx="${c}" cy="${c}" r="14.4" fill="url(#hb)" stroke="${INK}" stroke-width="1.1"/>
${beads}
<circle cx="${c}" cy="${c}" r="8.6" fill="url(#hb)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${c}" cy="${c}" r="6" fill="url(#hr)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${c - 2}" cy="${c - 2.2}" r="1.5" fill="#fff" fill-opacity="0.9"/>`,
  );
}

// ------------------------------------------------------------- the shaft

/** The steel girder between two floors, w × SLAB: riveted dark iron
 *  with a brass number band edge. */
export function slabArt(w: number, h: number) {
  const rivets = Array.from({ length: Math.ceil(w / 18) }, (_, i) =>
    `<circle cx="${9 + i * 18}" cy="${f(h / 2)}" r="1.6" fill="url(#sr)" stroke="#0E1014" stroke-width="0.5"/>`,
  ).join("");
  return svg(
    w,
    h,
    `<defs>${linear("si", ["#5A606A", "#2A2E36", "#14161A"])}${radial("sr", ["#C9D0DA", "#5A606A", "#1E2128"], undefined, 0.35, 0.3, 0.7)}${linear("sg", GOLD)}</defs>
<rect width="${w}" height="${h}" fill="url(#si)"/>
<rect y="0" width="${w}" height="2" fill="url(#sg)"/>
<rect y="${h - 2}" width="${w}" height="2" fill="url(#sg)"/>
<path d="M0 0.5H${w}M0 ${h - 0.5}H${w}" stroke="#0E1014" stroke-width="1"/>
${rivets}`,
  );
}

export interface LandingLook {
  /** The wall, top to foot. */
  wall: [string, string];
  /** The wainscot and the boards. */
  wood: string;
  /** The light falling on the landing. */
  light: string;
}

/** A floor's landing, w × h, seen through the gate: its wall in the
 *  game's colours with a gilt picture rail, a panelled wainscot and the
 *  boards, a light falling from above. The game's own things are drawn
 *  over it (floors.ts), then `landingShade`. */
export function landingArt(w: number, h: number, look: LandingLook) {
  const rail = h * 0.6;
  const floorY = h * 0.84;
  const panels = Math.max(3, Math.round(w / 80));
  const pw = w / panels;
  const wood = look.wood;
  const panelArt = Array.from({ length: panels }, (_, i) => {
    const x = i * pw + 7;
    return `<path d="${rrect(x, rail + 12, pw - 14, floorY - rail - 22, 3)}" fill="${shade(wood, -0.18)}" stroke="${shade(wood, -0.6)}" stroke-width="1"/><path d="M${f(x + 2)} ${f(rail + 13.5)}H${f(x + pw - 18)}" stroke="#fff" stroke-opacity="0.18" stroke-width="0.8"/>`;
  }).join("");
  const boards = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const xb = -w * 0.3 + t * w * 1.6;
    const xt = w * 0.2 + t * w * 0.6;
    return `<path d="M${f(xt)} ${f(floorY)}L${f(xb)} ${h}" stroke="${shade(wood, -0.6)}" stroke-opacity="0.6" stroke-width="1"/>`;
  }).join("");
  return svg(
    w,
    h,
    `<defs>
${linear("dw", look.wall)}
${lit("dk", [shade(wood, 0.15), wood, shade(wood, -0.35)], 0, rail, 0, floorY)}
${linear("df", [shade(wood, -0.1), shade(wood, -0.45)])}
${linear("dg", GOLD)}
${radial("dl", [look.light, look.light], [0.45, 0], 0.5, 0.05, 0.75)}
</defs>
<rect width="${w}" height="${rail}" fill="url(#dw)"/>
${Array.from({ length: Math.ceil(w / 22) }, (_, i) => `<rect x="${i * 22 + 10}" y="0" width="2" height="${f(rail)}" fill="#000" fill-opacity="0.1"/>`).join("")}
<rect y="${f(rail)}" width="${w}" height="${f(floorY - rail)}" fill="url(#dk)"/>
${panelArt}
<rect y="${f(rail - 2)}" width="${w}" height="5" fill="url(#dg)" stroke="${INK}" stroke-width="0.8"/>
<path d="M0 ${f(rail - 0.6)}H${w}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>
<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#df)"/>
${boards}
<rect y="${f(floorY - 4)}" width="${w}" height="5" fill="${shade(wood, -0.5)}" stroke="${shade(wood, -0.7)}" stroke-width="0.6"/>
<rect width="${w}" height="${h}" fill="url(#dl)"/>`,
  );
}

/** Laid over a landing after its things: dark at the sides and the foot,
 *  so the lead stands out and the gate reads against it. */
export function landingShade(w: number, h: number) {
  return svg(
    w,
    h,
    `<defs>${radial("ls", ["#000000", "#000000"], [0, 0.45], 0.5, 0.35, 0.8)}${linear("lf", ["#000000", "#000000"], true, [0, 0.35])}</defs>
<rect width="${w}" height="${h}" fill="url(#ls)"/>
<rect y="${f(h * 0.7)}" width="${w}" height="${f(h * 0.3)}" fill="url(#lf)"/>`,
  );
}

/** The dial's gold rim, for the light to sweep across. */
export const dialRim = (L: LiftLayout) => band(L.cx, L.cy, L.R - 7, L.R, -90, 90);

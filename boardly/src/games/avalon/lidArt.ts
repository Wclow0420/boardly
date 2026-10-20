// Double Agent's box lid, as engraved SVG (baked once by BoxArt.tsx):
// the face-off. Late at the agency, behind a gilt window with its blinds
// half drawn, the Handler and a Mole stand either side of the desk, the
// window lit sea-green behind the one and crimson behind the other. On
// the desk between them lies the case file, tied, a red band across it
// and a wax seal. Over the window's arch, the agency crest: silver rays,
// laurel, a gold medallion with its keyhole and the emerald on top.
//
// Drawn in a 190 × 208 box, the size of the other games' lids (the box
// shows its foot under the game's name, so what matters sits above ~150).

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, JEWELS, LEAF, MATERIALS } from "@/components/engraved/shapes";
import { ROLE_EMBLEMS } from "./emblems";
import {
  GOLD,
  INK,
  MANILA,
  MANILA_BACK,
  SILVER,
  TEAL,
  circle,
  f,
  lin,
  part,
  rad,
  rrect,
} from "./stage/svg";

export const LID_W = 190;
export const LID_H = 208;

const VEIN = INKS.gold.vein;

/** The Handler without the brass dial behind his head (at this size it
 *  reads as a second head). */
const HANDLER = ROLE_EMBLEMS.merlin.slice(2);
const WOOD = MATERIALS.wood;

/** A segmental arch: straight sides from `bottom` up to `spring`, an arc
 *  between them rising to `apex`. */
function arch(x0: number, x1: number, spring: number, apex: number, bottom: number) {
  const half = (x1 - x0) / 2;
  const rise = spring - apex;
  const R = (half * half + rise * rise) / (2 * rise);
  return `M${f(x0)} ${f(bottom)}V${f(spring)}A${f(R)} ${f(R)} 0 0 1 ${f(x1)} ${f(spring)}V${f(bottom)}Z`;
}

/** The window's arch, inset by `k` from its gilt frame. */
const WIN = { x0: 20, x1: 170, spring: 74, apex: 38, bottom: 150 };
const winArch = (k: number) => arch(WIN.x0 + k, WIN.x1 - k, WIN.spring, WIN.apex + k, WIN.bottom);

/** A laurel branch hugging the medallion at (x, y) on one side. */
function laurel(x: number, y: number, R: number, dir: number) {
  const leaves: string[] = [];
  const stem: string[] = [];
  const from = 160;
  const to = 58;
  const N = 6;
  const deg = Math.PI / 180;
  for (let i = 0; i <= N; i++) {
    const a = (from + ((to - from) * i) / N) * deg;
    const px = x + dir * Math.sin(a) * R;
    const py = y - Math.cos(a) * R;
    stem.push(`${f(px)} ${f(py)}`);
    if (i === 0) continue;
    const along = dir > 0 ? a / deg - 90 : 90 - a / deg;
    const tilt = i % 2 ? 34 : -34;
    const len = 10 - (i / N) * 3;
    leaves.push(
      part(LEAF(len, len * 0.4), "url(#lgold)", INK, 0.7, {
        vein: `M0 -1V${f(-len * 0.8)}`,
        veinColor: VEIN,
        vw: 0.45,
      }).replace(/<path /g, `<path transform="translate(${f(px)} ${f(py)}) rotate(${f(along + tilt)})" `),
    );
  }
  return `<path d="M${stem.join("L")}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${stem.join("L")}" fill="none" stroke="url(#lgold)" stroke-width="1.3" stroke-linecap="round"/>${leaves.join("")}`;
}

/** The agency crest at (x, y): silver rays, laurel, the gold medallion
 *  with its sea-green keyhole, an emerald in a crown mount on top. */
function crest(x: number, y: number, r: number) {
  const rays: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const R = long ? r + 12 : r + 7;
    const wdt = long ? 4.6 : 3.4;
    const tip = [x + Math.cos(a) * R, y + Math.sin(a) * R];
    const l = [x + Math.cos(a - Math.PI / 2) * wdt, y + Math.sin(a - Math.PI / 2) * wdt];
    const rr = [x + Math.cos(a + Math.PI / 2) * wdt, y + Math.sin(a + Math.PI / 2) * wdt];
    rays.push(
      part(`M${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}L${f(rr[0])} ${f(rr[1])}Z`, "url(#lsilver)", "#1E242C", 0.8, {
        vein: `M${f(x)} ${f(y)}L${f(tip[0])} ${f(tip[1])}`,
        veinColor: "#4A5462",
        vw: 0.55,
      }),
    );
  }
  const beads = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return `<circle cx="${f(x + Math.cos(a) * (r - 1.8))}" cy="${f(y + Math.sin(a) * (r - 1.8))}" r="1" fill="#FFF2B8" stroke="${VEIN}" stroke-width="0.35"/>`;
  }).join("");
  const key = `${circle(x, y - 2, 3.4)}M${f(x - 1.8)} ${f(y)}L${f(x - 3.1)} ${f(y + 7)}H${f(x + 3.1)}L${f(x + 1.8)} ${f(y)}Z`;
  const jy = y - r - 3;
  const mount = `M${f(x - 6.6)} ${f(jy + 3.8)}L${f(x - 4.8)} ${f(jy - 2.6)}L${f(x - 2.2)} ${f(jy + 0.7)}L${f(x)} ${f(jy - 4.6)}L${f(x + 2.2)} ${f(jy + 0.7)}L${f(x + 4.8)} ${f(jy - 2.6)}L${f(x + 6.6)} ${f(jy + 3.8)}Z`;
  return `${rays.join("")}
${laurel(x, y, r + 7, -1)}${laurel(x, y, r + 7, 1)}
<path d="${circle(x + 1, y + 2, r)}" fill="#000" fill-opacity="0.4"/>
${part(circle(x, y, r), "url(#lgoldR)", INK, 1.2, { shine: `M${f(x - r * 0.72)} ${f(y - r * 0.3)}Q${f(x - r * 0.55)} ${f(y - r * 0.72)} ${f(x - r * 0.1)} ${f(y - r * 0.86)}` })}
${beads}
${part(circle(x, y, r - 4), "url(#lteal)", "#06201E", 0.9)}
${part(key, "url(#lgold)", INK, 0.7)}
<path d="M${f(x - 1.1)} ${f(y - 4)}l1 -0.7" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>
${part(mount, "url(#lgold)", INK, 0.8)}
<circle cx="${x}" cy="${f(jy)}" r="4" fill="url(#lemerald)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${f(x - 1.3)}" cy="${f(jy - 1.4)}" r="1.05" fill="#fff" fill-opacity="0.9"/>`;
}

/** The line of light down the frame's lit (left) side and round the
 *  first part of its arch, just inside its edge. */
function frameShine() {
  const half = (WIN.x1 - WIN.x0) / 2;
  const rise = WIN.spring - WIN.apex;
  const R0 = (half * half + rise * rise) / (2 * rise);
  const R = R0 - 2.4;
  const cx = (WIN.x0 + WIN.x1) / 2;
  const cy = WIN.apex + R0;
  const at = (deg: number) => `${f(cx - Math.sin((deg * Math.PI) / 180) * R)} ${f(cy - Math.cos((deg * Math.PI) / 180) * R)}`;
  const from = (Math.asin((half - 2.4) / R) * 180) / Math.PI;
  return `M${f(WIN.x0 + 2.4)} ${WIN.bottom - 8}V${f(cy - Math.cos((from * Math.PI) / 180) * R)}A${f(R)} ${f(R)} 0 0 1 ${at(22)}`;
}

/** The window: a gilt arch, night glass lit sea-green on the agents'
 *  side and crimson on the moles', the blinds half drawn. */
function windowArt() {
  const glass = winArch(6);
  const slats: string[] = [];
  for (let y = WIN.apex + 4; y < WIN.bottom; y += 9) {
    slats.push(`M0 ${f(y)}H${LID_W}V${f(y + 5.2)}H0Z`);
  }
  const lines = Array.from({ length: Math.ceil((WIN.bottom - WIN.apex) / 9) }, (_, k) => WIN.apex + 4 + k * 9 + 5.2)
    .map((y) => `M0 ${f(y)}H${LID_W}`)
    .join("");
  const studs = [
    [WIN.x0 + 3, 96],
    [WIN.x0 + 3, 132],
    [WIN.x1 - 3, 96],
    [WIN.x1 - 3, 132],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.6"/>`)
    .join("");
  return `<path d="${winArch(-2)}" fill="#000" fill-opacity="0.4" transform="translate(2 4)"/>
${part(winArch(0), "url(#lgold)", INK, 1.4, { shine: frameShine() })}
<path d="${winArch(3)}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
${studs}
<clipPath id="lglass"><path d="${glass}"/></clipPath>
<path d="${glass}" fill="url(#lnight)"/>
<g clip-path="url(#lglass)">
<path d="${slats.join("")}" fill="url(#lslat)"/>
<path d="${lines}" stroke="#05090C" stroke-opacity="0.55" stroke-width="0.9"/>
<rect x="0" y="0" width="${LID_W / 2}" height="${LID_H}" fill="url(#lgreenGlow)"/>
<rect x="${LID_W / 2}" y="0" width="${LID_W / 2}" height="${LID_H}" fill="url(#lredGlow)"/>
<rect x="0" y="0" width="${LID_W}" height="${LID_H}" fill="url(#lvignette)"/>
</g>
<path d="${glass}" fill="none" stroke="${INK}" stroke-width="1.1"/>`;
}

/** An oval as a path (a gradient on an <ellipse> comes out black in
 *  Skia's SVG reader). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** A role's portrait (its 48-box emblem) at (x, y), `s` times its size,
 *  leaning `lean` degrees about the foot of the bust, a shadow cast on
 *  the glass behind it. */
function figure(data: EmblemData, x: number, y: number, s: number, lean: number, id: string) {
  const at = (d: number) => `translate(${f(x + d)} ${f(y + d)}) scale(${s}) rotate(${lean} 24 44)`;
  const shadow = data.flatMap((p) => ("d" in p ? [{ d: p.d, m: "#000000" as const, ink: 0, t: p.t }] : []));
  return `<g transform="${at(3)}" opacity="0.4">${toSvgBody(shadow, undefined, `${id}s`)}</g>
<g transform="${at(0)}">${toSvgBody(data, undefined, id)}</g>`;
}

/** The desk across the foot, seen a little from above: a walnut top
 *  with a gilt edge, an apron with two drawers and brass pulls, turned
 *  legs on brass feet. */
function desk() {
  const top = "M16 122H174L188 140H2Z";
  const grain = "M20 126.4Q70 125 120 126.6T172 126M12 131.6Q60 130 110 131.8T180 131.2M8 136.4Q70 135.2 150 136.6";
  const leg = (x: number) => {
    const d = `M${x - 6} 158H${x + 6}L${x + 4.4} 194H${x - 4.4}Z`;
    return `${part(d, "url(#lwoodH)", INKS.wood.ink, 1, { vein: `M${x} 160V192`, veinColor: INKS.wood.vein, vw: 0.6, shine: `M${x - 3.6} 172L${x - 2.8} 190` })}
${part(rrect(x - 7, 164, 14, 4, 1.2), "url(#lgold)", INK, 0.8, { shine: `M${x - 5} 165.2H${x + 1}` })}
${part(rrect(x - 6, 193, 12, 5, 1.6), "url(#lgold)", INK, 0.8)}`;
  };
  const drawer = (x: number) =>
    `${part(rrect(x, 147, 72, 12, 1.8), "url(#lwoodD)", INKS.wood.ink, 0.9, { shine: `M${x + 3} 148.6H${x + 30}` })}
<path d="${oval(x + 36, 153, 6, 2.4)}" fill="none" stroke="${INK}" stroke-width="2.6"/>
<path d="${oval(x + 36, 153, 6, 2.4)}" fill="none" stroke="url(#lgold)" stroke-width="1.4"/>
<circle cx="${x + 30}" cy="151.6" r="1.6" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.5"/>
<circle cx="${x + 42}" cy="151.6" r="1.6" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.5"/>`;
  return `<path d="${oval(95, 200, 92, 5)}" fill="url(#lfloor)"/>
${leg(20)}${leg(170)}
${part(rrect(8, 142, 174, 20, 2), "url(#lwood)", INKS.wood.ink, 1.1)}
${drawer(14)}${drawer(104)}
${part(top, "url(#lwoodH)", INKS.wood.ink, 1.2, { vein: grain, veinColor: INKS.wood.vein, vw: 0.55 })}
<path d="${oval(95, 131, 64, 9)}" fill="url(#lpool)"/>
${part(rrect(1, 139.4, 188, 4.6, 1.4), "url(#lgold)", INK, 1, { shine: "M6 140.6H124" })}
<path d="M8 144.4H182" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>`;
}

/** The case file lying on the desk between them: its back cover and
 *  tab, the papers peeking out, the manila front tied with string, a
 *  red band across it with its words in block capitals. */
function dossier() {
  const x = 60;
  const w = 70;
  const y0 = 116; // the far edge
  const y1 = 137; // the near edge
  const sk = 5; // the far edge is narrower by this each side
  const quad = (xa: number, xb: number, ya: number, yb: number, k: number) => `M${f(xa + k)} ${f(ya)}H${f(xb - k)}L${f(xb)} ${f(yb)}H${f(xa)}Z`;
  const back = `M${f(x + sk)} ${f(y0)}H${f(x + 12)}L${f(x + 14)} ${f(y0 - 5)}H${f(x + 32)}L${f(x + 34)} ${f(y0)}H${f(x + w - sk)}L${f(x + w)} ${f(y1)}H${f(x)}Z`;
  const paper = quad(x + 5, x + w - 1, y0 - 1.5, y1 - 8, 4.4);
  const paper2 = quad(x + 9, x + w - 5, y0 - 3, y1 - 10, 4.4);
  const front = quad(x - 1, x + w + 1, y0 + 6, y1 + 1, 4);
  // the band runs corner to corner, low on the left
  const band = (k: number) => [x - 6, y1 - 3 + k, x + w + 6, y0 + 6 + k] as const;
  const [bx0, by0, bx1, by1] = band(0);
  const bandPath = `M${bx0} ${by0}L${bx1} ${by1}L${bx1} ${by1 + 7}L${bx0} ${by0 + 7}Z`;
  const slope = (by1 - by0) / (bx1 - bx0);
  // "TOP SECRET" in block capitals along the band: three letters, a
  // space, six
  const type = Array.from({ length: 9 }, (_, i) => {
    const px = x + 13 + (i + (i > 2 ? 1.4 : 0)) * 4.1;
    const py = by0 + 5.1 + (px - bx0) * slope;
    return `M${f(px)} ${f(py)}l2.6 ${f(2.6 * slope)}l0 -3.2l-2.6 ${f(-2.6 * slope)}Z`;
  }).join("");
  return `<path d="${back}" fill="#000" fill-opacity="0.45" transform="translate(2 2.6)"/>
${part(back, "url(#lmanilaB)", INK, 1)}
${part(paper, "url(#lpaper)", "#8A7A5A", 0.6)}
${part(paper2, "#FFFDF4", "#8A7A5A", 0.6)}
${[0, 1, 2].map((k) => `<path d="M${x + 16} ${f(y0 + 0.4 + k * 2.2)}H${f(x + w - 16 - (k === 2 ? 14 : 0))}" stroke="#4A4436" stroke-opacity="0.6" stroke-width="0.9" stroke-dasharray="2.4 1"/>`).join("")}
${part(front, "url(#lmanila)", INK, 1.2, { shine: `M${x + 5} ${y0 + 7.6}H${x + 36}` })}
<clipPath id="lfront"><path d="${front}"/></clipPath>
<g clip-path="url(#lfront)">
<path d="${bandPath}" fill="url(#lband)"/>
<path d="M${bx0} ${f(by0 + 1.2)}L${bx1} ${f(by1 + 1.2)}M${bx0} ${f(by0 + 5.8)}L${bx1} ${f(by1 + 5.8)}" stroke="#FFD8DC" stroke-opacity="0.7" stroke-width="0.6"/>
<path d="M${bx0} ${by0}L${bx1} ${by1}M${bx0} ${by0 + 7}L${bx1} ${by1 + 7}" stroke="#4A0410" stroke-width="0.9"/>
<path d="${type}" fill="#FFE8EA" fill-opacity="0.9"/>
</g>
<circle cx="${x + w - 12}" cy="${y1 - 4}" r="2.4" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${x + w - 12} ${y1 - 4}C${x + w - 6} ${y1 + 1} ${x + w - 2} ${y1 - 7} ${x + w + 4} ${y1 - 2}" fill="none" stroke="#7A2A18" stroke-width="1"/>`;
}

/** The whole lid, LID_W × LID_H, `w` wide. */
export function lidArt(w = LID_W) {
  const h = (w * LID_H) / LID_W;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${LID_W} ${LID_H}">
<defs>
${lin("lgold", GOLD)}
${rad("lgoldR", GOLD)}
${lin("lsilver", SILVER)}
${lin("lpaper", ["#FFFFFF", "#EEE6D2"], 0, 1)}
${lin("lmanila", MANILA)}
${lin("lmanilaB", MANILA_BACK)}
${rad("lteal", TEAL)}
${rad("lemerald", JEWELS.emerald)}
${lin("lband", ["#E04A5A", "#A01428"], 0, 1)}
${lin("lwood", [WOOD[2], "#3A220E"], 0, 1)}
${lin("lwoodD", ["#4A2C12", "#2E1A08"], 0, 1)}
${lin("lwoodH", [WOOD[0], WOOD[1], WOOD[3]], 1, 0)}
${lin("lnight", ["#1A3A40", "#0C1A20", "#081014"], 0, 1)}
${lin("lslat", ["#E8F0E6", "#9AB0AC"], 0, 1, [0.5, 0.18])}
${rad("lgreenGlow", ["#2DD4BF", "#1E8A80", "#0A3A36"], [0.6, 0.3, 0], 0.5, 0.55, 0.7)}
${rad("lredGlow", ["#F0605D", "#B8182E", "#5A0612"], [0.68, 0.36, 0], 0.5, 0.55, 0.7)}
${rad("lvignette", ["#000000", "#000000"], [0, 0.55], 0.5, 0.45, 0.75)}
${rad("lpool", ["#FFE7B0", "#FFE7B0"], [0.4, 0], 0.5, 0.5, 0.5)}
${rad("lfloor", ["#000000", "#000000"], [0.45, 0], 0.5, 0.5, 0.5)}
</defs>
${windowArt()}
${crest(LID_W / 2, 40, 15)}
${figure(HANDLER, 8, 60, 1.74, 4, "lh")}
${figure(ROLE_EMBLEMS.minion, 98, 60, 1.74, -4, "lm")}
${desk()}
${dossier()}
</svg>`;
}

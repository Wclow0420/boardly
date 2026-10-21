// Liar's Dice's box lid, as engraved SVG (baked once by BoxArt.tsx): the
// pub's back bar after hours. Pewter tankards hang by their handles from
// the oak beam, a gold medallion at its middle set with a die showing its
// one (a ruby for the pip). Behind the bar, smoky mirrors between oak
// pilasters and a glass shelf of bottles; in front of them the dice
// shaker (the lift's lead) rattles his cup, a die flying out of it. On
// the mahogany counter a rival's cup is slammed down, hiding its dice;
// another lies tipped over beside the five it was hiding (the slate in
// the bay behind has the call chalked on it: three fives); steins of beer
// stand at both ends.
//
// Drawn in a 190 × 208 box, the size of the other games' lids (the box
// shows its foot under the game's name, so what matters sits above ~150).

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { linear, radial } from "@/components/engraved/panel";
import { INKS, JEWELS, MATERIALS, frond } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { LEADS } from "@/features/games/lift/leads";
import { cupArt, dieBody, steinArt } from "./art";

export const LID_W = 190;
export const LID_H = 208;

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const DARK = "#160A04";

const OAK = ["#5A3420", "#3E2214", "#24130A"];
const MAHOGANY = ["#9A4426", "#5A2212", "#2E0E06"];
const MIRROR = ["#7A6E5E", "#3E362C", "#1C1610"];

/** A filled, inked shape with an optional engraved vein and shine. */
function part(
  d: string,
  fill: string,
  ink: string,
  inkW = 1,
  extra: { vein?: string; veinColor?: string; vw?: number; shine?: string; sw?: number } = {},
) {
  return [
    `<path d="${d}" fill="${fill}"/>`,
    extra.vein
      ? `<path d="${extra.vein}" fill="none" stroke="${extra.veinColor ?? VEIN}" stroke-width="${extra.vw ?? 0.7}" stroke-linecap="round"/>`
      : "",
    extra.shine
      ? `<path d="${extra.shine}" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="${extra.sw ?? 0.9}" stroke-linecap="round"/>`
      : "",
    inkW > 0 ? `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>` : "",
  ].join("");
}

const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
/** An oval as a path (a gradient on an <ellipse> comes out black in
 *  Skia's SVG reader). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** Another drawing's markup without its <svg> wrapper, its ids kept
 *  apart by `p`. */
const inner = (svg: string, p: string) =>
  svg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/id="([^"]+)"/g, `id="${p}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`);

/** A little seeded random, so the grain is the same every time. */
function seeded(seed: number) {
  let k = seed;
  return () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
}

/** Fine grain across a piece of wood. */
function grain(x: number, y: number, w: number, h: number, step: number, seed: number) {
  const rnd = seeded(seed);
  const lines: string[] = [];
  for (let yy = y + step * 0.6; yy < y + h; yy += step * (0.7 + rnd() * 0.6)) {
    const a = 0.4 + rnd();
    const p = rnd() * 6;
    const pts: string[] = [];
    for (let xx = x; xx <= x + w + 8; xx += 8) pts.push(`${f(xx)} ${f(yy + Math.sin(xx / 23 + p) * a)}`);
    const light = rnd() > 0.6;
    lines.push(
      `<path d="M${pts.join("L")}" fill="none" stroke="${light ? "#C88A5A" : "#120804"}" stroke-opacity="${light ? 0.2 : 0.4}" stroke-width="${f(0.4 + rnd() * 0.4)}"/>`,
    );
  }
  return lines.join("");
}

// ------------------------------------------------------------- the beam

const BEAM = { y: 14, h: 10 };

/** A hop cone hanging from (x, y). */
const hop = (x: number, y: number, s: number, rot: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="M0 0C-6 -4 -7 -12 0 -16C7 -12 6 -4 0 0Z" fill="url(#lhop)" stroke="#14300A" stroke-width="0.8"/><path d="M-4 -5Q0 -7 4 -5M-4.6 -9.5Q0 -11.5 4.6 -9.5M-3 -13.4Q0 -15 3 -13.4" fill="none" stroke="#2E5A16" stroke-width="0.7"/><path d="M-1 -3Q-2.6 -8 -0.6 -13" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.8" fill="none"/></g>`;
/** A serrated hop leaf from (x, y), pointing rot degrees from up. */
const leaf = (x: number, y: number, s: number, rot: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="${frond(20, 8, 3)}" fill="url(#lleaf)" stroke="#14300A" stroke-width="0.8"/><path d="M0 -2V-17" stroke="#2E5A16" stroke-width="0.7"/></g>`;

/** A pewter tankard hung by its handle from a brass hook under the beam,
 *  swinging a little. */
function hanging(x: number, w: number, tilt: number, id: string) {
  const y = BEAM.y + BEAM.h;
  const h = w * 1.3;
  const hook = `M${f(x)} ${y}V${f(y + 9)}Q${f(x)} ${f(y + 12)} ${f(x + 2.4)} ${f(y + 11.4)}`;
  return `<path d="${hook}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="${hook}" fill="none" stroke="url(#lgoldV)" stroke-width="1.1" stroke-linecap="round"/>
<circle cx="${f(x)}" cy="${y + 0.6}" r="1.6" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.5"/>
<g transform="rotate(${tilt} ${f(x + 1.6)} ${f(y + 11)}) translate(${f(x + 1.6 - w * 0.9)} ${f(y + 10 - h * 0.3)})">${inner(steinArt(0, false, w), id)}</g>`;
}

/** The oak beam across the top, strapped in iron, hop sprigs at its
 *  ends, the tankards hanging under it and the gold medallion at its
 *  middle, a die in it showing one, its pip a ruby. */
function beam() {
  const { y, h } = BEAM;
  const straps = [26, 70, 113, 157]
    .map(
      (x) =>
        `<path d="M${x} ${y - 0.5}h6v${h + 1}h-6Z" fill="url(#liron)" stroke="#06080A" stroke-width="0.6"/><circle cx="${x + 3}" cy="${y + 2.6}" r="0.9" fill="#A8AEB8"/><circle cx="${x + 3}" cy="${y + h - 2.6}" r="0.9" fill="#A8AEB8"/>`,
    )
    .join("");
  const cx = 95;
  const cy = y + h / 2;
  const s = 13;
  const [jl, jb, jd] = JEWELS.ruby;
  return `<path d="M2 ${y + 3}H188V${y + h + 3}H2Z" fill="#000" fill-opacity="0.45"/>
<path d="M2 ${y}H188V${y + h}H2Z" fill="url(#loakV)" stroke="${DARK}" stroke-width="0.9"/>
<clipPath id="lbeam"><path d="M2 ${y}H188V${y + h}H2Z"/></clipPath>
<g clip-path="url(#lbeam)">${grain(2, y, 186, h, 2.4, 9)}</g>
<path d="M3 ${y + 1.4}H140" stroke="#FFD8B0" stroke-opacity="0.3" stroke-width="0.8"/>
${straps}
${leaf(10, y + h - 1, 0.62, 150)}${leaf(14, y + h, 0.55, 205)}${hop(19, y + h + 1, 0.5, 185)}
${leaf(180, y + h - 1, 0.62, -150)}${leaf(176, y + h, 0.55, -205)}${hop(171, y + h + 1, 0.5, 175)}
${hanging(40, 16, 9, "lt1")}${hanging(58, 14, -3, "lt2")}${hanging(130, 14, 4, "lt3")}${hanging(149, 16, -8, "lt4")}
<path d="${circle(cx + 1, cy + 2.5, 12.5)}" fill="#000" fill-opacity="0.45"/>
${part(circle(cx, cy, 12.5), "url(#lgoldR)", INK, 1.1, { shine: `M${cx - 9.6} ${cy - 3}A10 10 0 0 1 ${cx - 4} ${cy - 9}` })}
${Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle cx="${f(cx + Math.cos(a) * 10.6)}" cy="${f(cy + Math.sin(a) * 10.6)}" r="0.85" fill="#FFF2B8" stroke="${VEIN}" stroke-width="0.3"/>`;
  }).join("")}
<g transform="rotate(-10 ${cx} ${cy})">
<rect x="${cx - s / 2 + 0.4}" y="${cy - s / 2 + 0.9}" width="${s}" height="${s}" rx="2.6" fill="#000" fill-opacity="0.35"/>
${part(rrect(cx - s / 2, cy - s / 2, s, s, 2.6), "url(#livory)", INK, 0.8, { shine: `M${cx - 4} ${cy - s / 2 + 0.7}H${cx + 1.5}`, sw: 0.7 })}
</g>
<circle cx="${cx}" cy="${cy}" r="3" fill="url(#lruby)" stroke="#3A0408" stroke-width="0.7"/>
<circle cx="${cx - 1}" cy="${cy - 1.1}" r="0.85" fill="#FFFFFF" fill-opacity="0.9"/>
<defs>${radial("lruby", [jl, jb, jd], undefined, 0.35, 0.3, 0.8)}</defs>`;
}

// ------------------------------------------------------------- the back bar

const BAR = { x0: 8, x1: 182, top: 34, bottom: 118 };
const BAYS = [
  [20, 62],
  [70, 120],
  [128, 170],
] as const;

/** A bottle standing on the shelf at (x, y), h tall. */
function bottle(kind: "wine" | "amber" | "gin" | "port", x: number, y: number, h: number) {
  const outline = `stroke="${DARK}" stroke-width="0.7" stroke-linejoin="round"`;
  const label = (lx: number, ly: number, lw: number, lh: number) =>
    `<rect x="${f(lx)}" y="${f(ly)}" width="${f(lw)}" height="${f(lh)}" fill="url(#livory)" stroke="${INK}" stroke-width="0.4"/><path d="M${f(lx + 1)} ${f(ly + lh / 2)}H${f(lx + lw - 1)}" stroke="#9A1828" stroke-width="0.7"/>`;
  const shine = (x0: number, y0: number, y1: number) =>
    `<path d="M${f(x0)} ${f(y0)}V${f(y1)}" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="0.8" stroke-linecap="round"/>`;
  if (kind === "port") {
    const r = h * 0.3;
    const cy = y - r;
    return `<path d="M${f(x - 1.8)} ${f(cy - r + 1)}V${f(y - h)}H${f(x + 1.8)}V${f(cy - r + 1)}Z" fill="url(#lport)" ${outline}/><path d="${circle(x, cy, r)}" fill="url(#lport)" ${outline}/><circle cx="${f(x)}" cy="${f(y - h - 0.6)}" r="2" fill="url(#lgoldV)" stroke="${INK}" stroke-width="0.4"/><path d="M${f(x - r * 0.65)} ${f(cy - r * 0.2)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(x - r * 0.1)} ${f(cy - r * 0.68)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="0.8" stroke-linecap="round"/>`;
  }
  if (kind === "gin") {
    const bw = 5;
    return `<path d="M${f(x - bw)} ${f(y)}V${f(y - h * 0.7)}L${f(x - 2)} ${f(y - h * 0.8)}V${f(y - h)}H${f(x + 2)}V${f(y - h * 0.8)}L${f(x + bw)} ${f(y - h * 0.7)}V${f(y)}Z" fill="url(#lclear)" ${outline}/><rect x="${f(x - bw + 0.4)}" y="${f(y - h * 0.62)}" width="${f(bw * 2 - 0.8)}" height="${f(h * 0.6)}" fill="url(#lbeer)" fill-opacity="0.5"/>${label(x - bw + 1.2, y - h * 0.5, bw * 2 - 2.4, h * 0.2)}<rect x="${f(x - 2.3)}" y="${f(y - h - 1)}" width="4.6" height="3" rx="0.8" fill="url(#lgoldV)" stroke="${INK}" stroke-width="0.4"/>${shine(x - bw + 1.4, y - h * 0.68, y - 2)}`;
  }
  const bw = 4.4;
  const glass = kind === "wine" ? "lgreen" : "lamber";
  const d = `M${f(x - bw)} ${f(y)}V${f(y - h * 0.55)}Q${f(x - bw)} ${f(y - h * 0.7)} ${f(x - 1.5)} ${f(y - h * 0.76)}V${f(y - h)}H${f(x + 1.5)}V${f(y - h * 0.76)}Q${f(x + bw)} ${f(y - h * 0.7)} ${f(x + bw)} ${f(y - h * 0.55)}V${f(y)}Z`;
  return `<path d="${d}" fill="url(#${glass})" ${outline}/>${label(x - bw + 1, y - h * 0.46, bw * 2 - 2, h * 0.24)}<rect x="${f(x - 1.9)}" y="${f(y - h - 0.5)}" width="3.8" height="${f(h * 0.14)}" fill="url(#lred)" stroke="${DARK}" stroke-width="0.5"/>${shine(x - bw + 1.4, y - h * 0.54, y - 2)}`;
}

/** The slate hung in the right-hand bay, the last call chalked on it:
 *  three fives. */
function slate() {
  const x = 133;
  const y = 86;
  const w = 30;
  const h = 17;
  const chalk = `stroke="#F4EEDF" stroke-opacity="0.9" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const pips = [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ]
    .map(([i, j]) => `<circle cx="${f(x + 21.6 + i * 1.9)}" cy="${f(y + 6.1 + j * 1.9)}" r="0.6" fill="#F4EEDF"/>`)
    .join("");
  return `<path d="M${x + 6} ${y}L${x + w / 2} ${y - 6}L${x + w - 6} ${y}" fill="none" stroke="#2A1A0A" stroke-width="0.7"/>
<path d="${rrect(x + 1, y + 2, w, h, 2)}" fill="#000" fill-opacity="0.45"/>
${part(rrect(x, y, w, h, 2), "url(#loakH)", INK, 0.9)}
<path d="${rrect(x + 2.4, y + 2.4, w - 4.8, h - 4.8, 1)}" fill="url(#lslate)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${x + 5} ${y + 5.6}Q${x + 7.6} ${y + 4} ${x + 9.4} ${y + 5.6}Q${x + 10} ${y + 7.4} ${x + 7.4} ${y + 8.2}Q${x + 10.4} ${y + 8.8} ${x + 9.8} ${y + 11}Q${x + 8} ${y + 12.8} ${x + 5} ${y + 11.4}" ${chalk}/>
<path d="M${x + 13} ${y + 6.6}l3.6 3.6m0 -3.6l-3.6 3.6" ${chalk}/>
<path d="${rrect(x + 20, y + 4.6, 7, 7, 1.2)}" stroke="#F4EEDF" stroke-opacity="0.9" stroke-width="0.8" fill="none"/>
${pips}
<circle cx="${x + w / 2}" cy="${y - 6}" r="1.1" fill="url(#lgoldR)" stroke="${INK}" stroke-width="0.4"/>`;
}

/** The back bar: an oak case with a dentil cornice, three bays of smoky
 *  mirror between fluted pilasters, a glass shelf across with bottles in
 *  the side bays, a lamp's warm light in the middle one. */
function backBar() {
  const { x0, x1, top, bottom } = BAR;
  const mirrors = BAYS.map(([a, b], i) => {
    const rise = 7;
    const d = `M${a} ${bottom}V${top + 10 + rise}Q${(a + b) / 2} ${top + 10 - rise} ${b} ${top + 10 + rise}V${bottom}Z`;
    const streak = `M${a + (b - a) * 0.2} ${bottom}L${a + (b - a) * 0.2 + 26} ${top + 8}H${a + (b - a) * 0.2 + 36}L${a + (b - a) * 0.2 + 10} ${bottom}Z`;
    return `<path d="${d}" fill="url(#lmirror)"/>
<clipPath id="lmc${i}"><path d="${d}"/></clipPath>
<g clip-path="url(#lmc${i})"><path d="${streak}" fill="#FFFFFF" fill-opacity="0.06"/></g>
<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.4"/>
<path d="${d}" fill="none" stroke="url(#lgoldV)" stroke-width="1.3"/>`;
  }).join("");
  const pilaster = (x: number, w: number) =>
    `${part(`M${x} ${top + 6}H${x + w}V${bottom}H${x}Z`, "url(#loakH)", DARK, 0.9, {
      vein: `M${x + w * 0.35} ${top + 14}V${bottom - 4}M${x + w * 0.65} ${top + 14}V${bottom - 4}`,
      veinColor: "#120804",
      vw: 0.8,
      shine: `M${x + 1.4} ${top + 10}V${bottom - 2}`,
      sw: 0.7,
    })}
${part(rrect(x - 1.5, top + 8, w + 3, 4, 1), "url(#lgoldV)", INK, 0.6)}`;
  const dentils: string[] = [];
  for (let x = x0 + 2; x < x1 - 3; x += 5) dentils.push(`M${x} ${top + 5}h2.8v3.4h-2.8Z`);
  // the glass shelf with its bottles in the side bays
  const shelfY = 81;
  const left = [
    bottle("wine", 25.5, shelfY, 26),
    bottle("gin", 36, shelfY, 22),
    bottle("port", 46.5, shelfY, 20),
    bottle("amber", 56.5, shelfY, 25),
  ];
  const right = [bottle("amber", 135, shelfY, 24), bottle("port", 145.5, shelfY, 19), bottle("wine", 157, shelfY, 27), bottle("gin", 166, shelfY, 21)];
  return `<path d="M${x0 + 2} ${top + 4}H${x1 + 2}V${bottom + 4}H${x0 + 2}Z" fill="#000" fill-opacity="0.45"/>
<path d="M${x0} ${top}H${x1}V${bottom}H${x0}Z" fill="url(#loak)" stroke="${DARK}" stroke-width="0.9"/>
<clipPath id="lcase"><path d="M${x0} ${top}H${x1}V${bottom}H${x0}Z"/></clipPath>
<g clip-path="url(#lcase)">${grain(x0, top, x1 - x0, bottom - top, 5, 5)}</g>
${mirrors}
<path d="${circle(95, 70, 40)}" fill="url(#lwarm)"/>
${pilaster(x0 + 2, 9)}${pilaster(62, 8)}${pilaster(120, 8)}${pilaster(x1 - 11, 9)}
<path d="M${x0 - 2} ${top - 1}H${x1 + 2}V${top + 5}H${x0 - 2}Z" fill="url(#loakV)" stroke="${DARK}" stroke-width="0.7"/>
<path d="${dentils.join("")}" fill="#6A4024" stroke="${DARK}" stroke-width="0.5"/>
${part(`M${x0 - 3} ${top - 2.4}H${x1 + 3}V${top + 0.6}H${x0 - 3}Z`, "url(#lgoldV)", INK, 0.7, { shine: `M${x0} ${top - 1.4}H${x0 + 80}`, sw: 0.6 })}
<path d="M${x0 + 10} ${shelfY}H${x1 - 10}V${shelfY + 2.4}H${x0 + 10}Z" fill="#C8E0E8" fill-opacity="0.5" stroke="#1E2A30" stroke-width="0.6"/>
<path d="M${x0 + 10} ${shelfY + 2.4}H${x1 - 10}V${shelfY + 6}H${x0 + 10}Z" fill="#000" fill-opacity="0.25"/>
${left.join("")}${right.join("")}
${slate()}`;
}

// ------------------------------------------------------------- the shaker

/** The lead's portrait (its 48-box emblem) at (x, y), `s` times its
 *  size, its shadow cast on the mirror behind. */
function figure(data: EmblemData, x: number, y: number, s: number, id: string) {
  const at = (d: number) => `translate(${f(x + d)} ${f(y + d)}) scale(${s})`;
  const shadow = data.flatMap((p) => ("d" in p ? [{ d: p.d, m: "#000000" as const, ink: 0, t: p.t }] : []));
  return `<g transform="${at(3)}" opacity="0.4">${toSvgBody(shadow, undefined, `${id}s`)}</g>
<g transform="${at(0)}">${toSvgBody(data, undefined, id)}</g>`;
}

// ------------------------------------------------------------- the counter

const TOP_Y = 106;
const EDGE_Y = 124;

/** The bar counter: a mahogany top seen a little from above under a
 *  brass edge, raised panels down its front, a brass foot rail. */
function counter() {
  const panels: string[] = [];
  const pw = 174 / 4;
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * pw;
    panels.push(
      part(rrect(x + 5, EDGE_Y + 10, pw - 10, 30, 2), "url(#lmahD)", DARK, 0.9) +
        part(rrect(x + 9, EDGE_Y + 14, pw - 18, 22, 1.5), "url(#lmah)", DARK, 0.6, { shine: `M${x + 10.4} ${EDGE_Y + 34}V${EDGE_Y + 16}`, sw: 0.6 }),
    );
  }
  const rail = EDGE_Y + 48;
  const foot = EDGE_Y + 58;
  return `<path d="${oval(95, foot + 3, 92, 5)}" fill="url(#lfloor)"/>
${part(`M6 ${EDGE_Y + 4}H184V${foot}H6Z`, "url(#lmahV)", DARK, 1)}
${panels.join("")}
<path d="M6 ${EDGE_Y + 4}H184V${foot}H6Z" fill="url(#lunder)"/>
<path d="M6 ${foot - 6}H184V${foot}H6Z" fill="#1A0804" stroke="${DARK}" stroke-width="0.6"/>
${[30, 95, 160].map((x) => `<path d="M${x - 2} ${rail - 7}h4v7h-4Z" fill="url(#lgoldV)" stroke="${INK}" stroke-width="0.6"/>`).join("")}
${part(rrect(4, rail - 2.6, 182, 5.2, 2.6), "url(#lgoldV)", INK, 0.8, { shine: `M8 ${rail - 1.4}H120`, sw: 0.7 })}
${part(`M14 ${TOP_Y}H176L186 ${EDGE_Y}H4Z`, "url(#ltop)", DARK, 1)}
<clipPath id="ltopc"><path d="M14 ${TOP_Y}H176L186 ${EDGE_Y}H4Z"/></clipPath>
<g clip-path="url(#ltopc)">${grain(4, TOP_Y, 182, EDGE_Y - TOP_Y, 3, 13)}</g>
<path d="M14 ${TOP_Y}H176L186 ${EDGE_Y}H4Z" fill="url(#lpool)"/>
<path d="M16 ${TOP_Y + 1.2}H174" stroke="#FFD8B0" stroke-opacity="0.35" stroke-width="0.8"/>
${part(rrect(2, EDGE_Y - 1, 186, 5, 2), "url(#lgoldV)", INK, 0.9, { shine: `M6 ${EDGE_Y}H124` })}
<path d="M5 ${EDGE_Y + 5}H185" stroke="#000" stroke-opacity="0.45" stroke-width="2"/>`;
}

/** A stein of beer standing on the counter, its foot at (x, y). */
const stein = (x: number, y: number, w: number, id: string) =>
  `<g transform="translate(${f(x - w * 0.42)} ${f(y - w * 1.3 * 0.92)})">${inner(steinArt(0.86, false, w), id)}</g>`;

/** A cup slammed down mouth first, its foot at (x, y). */
const slammed = (x: number, y: number, w: number, id: string) =>
  `<g transform="translate(${f(x - w / 2)} ${f(y - w * 1.15 * 0.92)})">${inner(cupArt(w), id)}</g>`;

/** A cup lying on its side, its mouth to the left and turned a little
 *  toward us, the dark inside showing; (x, y) where its crown rests. */
function tipped(x: number, y: number, w: number, id: string) {
  const h = w * 1.15;
  const mouthY = h * 0.9 + w * 0.04;
  return `<path d="${oval(x - h * 0.45, y + 1, h * 0.55, 2.6)}" fill="#000" fill-opacity="0.45"/>
<g transform="translate(${f(x)} ${f(y - w * 0.47)}) rotate(78) translate(${f(-w / 2)} ${f(-h * 0.06)})">
${inner(cupArt(w, false), id)}
<path d="${oval(w / 2, mouthY, w * 0.46, w * 0.15)}" fill="url(#linside)" stroke="#2A0404" stroke-width="0.9"/>
</g>`;
}

/** The five dice the tipped cup was hiding, spilled on the counter. */
function dice() {
  const at: [number, number, number, number, number][] = [
    // face, x, y, size, turn
    [5, 94, 101, 11, -12],
    [5, 107, 102, 11, 8],
    [1, 88, 110, 11.5, 6],
    [5, 101, 112, 11.5, -5],
    [3, 114, 110, 11, 14],
  ];
  return at
    .map(([face, x, y, s, rot], i) => `<g transform="rotate(${rot} ${f(x + s / 2)} ${f(y + s / 2)})">${dieBody(face, x, y, s, "plain", `ld${i}`)}</g>`)
    .join("");
}

/** The whole lid, LID_W × LID_H, `w` wide. */
export function lidArt(w = LID_W) {
  const h = (w * LID_H) / LID_W;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${LID_W} ${LID_H}">
<defs>
${linear("lgoldV", MATERIALS.gold)}
${radial("lgoldR", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${linear("livory", MATERIALS.ivory)}
${linear("liron", MATERIALS.iron, false)}
${linear("loak", OAK)}
${linear("loakV", OAK)}
${linear("loakH", OAK, false)}
${linear("lmirror", MIRROR)}
${linear("lslate", ["#3E454E", "#262B32", "#14171C"])}
${linear("lmah", MAHOGANY)}
${linear("lmahD", ["#4A1A0C", "#2E0E06"])}
${linear("lmahV", MAHOGANY)}
${linear("ltop", ["#B85E36", "#7A3018", "#4E1A0C"])}
${linear("lhop", ["#E8F8B0", "#9ACC5A", "#4A7A1E"])}
${linear("lleaf", MATERIALS.leaf)}
${linear("lgreen", ["#7AD89A", "#1E6A3A", "#0A2A16"], false)}
${linear("lamber", ["#FFC870", "#B8661A", "#4A2006"], false)}
${linear("lclear", ["#EEF4F8", "#9AAAB8", "#4A5864"], false)}
${linear("lport", ["#FF8A9A", "#8A1426", "#34040A"], false)}
${linear("lbeer", ["#FFD27A", "#C8781E"])}
${linear("lred", ["#E04A52", "#A8182A", "#5A0810"])}
${radial("lwarm", ["#FFC870", "#FFC870"], [0.55, 0], 0.5, 0.5, 0.5)}
${radial("lpool", ["#FFE7B0", "#FFE7B0"], [0.3, 0], 0.55, 0.3, 0.55)}
${radial("linside", ["#2A0A06", "#120302"], undefined, 0.5, 0.5, 0.6)}
${radial("lfloor", ["#000000", "#000000"], [0.45, 0])}
${linear("lunder", ["#000000", "#000000"], true, [0.5, 0.15])}
</defs>
${backBar()}
${figure(LEADS.liarsdice, 53, 37, 1.66, "lsh")}
${beam()}
${counter()}
${stein(20, 121, 28, "ls1")}
${slammed(54, 122, 30, "lc1")}
${dice()}
${tipped(157, 118, 26, "lc2")}
${stein(176, 121, 24, "ls2")}
</svg>`;
}

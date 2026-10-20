// Double Agent's room on its floor of the lift: the agency's briefing
// room, seen flat on. Teal steel panelling over a walnut wainscot; three
// world clocks over the lift's door; a big map of the world on the back
// wall, pins in the cities and red string between them; a window with
// its venetian blinds half down, the street's light slanting through the
// slats across the wall; the house rules on the case board, a TOP SECRET
// slip pinned over it and a file's tab peeking out, the agency's seal for
// the count; the long walnut briefing table on steel pedestals, a black
// telephone at one end and a banker's lamp at the other, a dossier
// standing for each player; a dark teal carpet; green enamel pendant
// lamps hung from the steel girder. As SVG markup, baked once
// (RoomScene). Hustle's den (../rooms.ts) is the model.

import { linear, radial } from "@/components/engraved/panel";
import { INKS, JEWELS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { boardsArt, doorArt, lit, svg } from "../art";
import type { RoomLayout } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const STEEL_INK = INKS.silver.ink;
const TEAL = ["#3E7A7A", "#1E4E52", "#10302F"];
const WALNUT = ["#6A4028", "#4A2A18", "#2E1A0E"];
const MANILA = ["#FFF2CC", "#F0D49A", "#C9A45A"];
const STAMP = "#C8202E";

/** An oval as a path (a gradient on an <ellipse> bakes black). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** A steel rivet. */
const rivet = (x: number, y: number, r = 1.2) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#arv)" stroke="${STEEL_INK}" stroke-width="0.4"/>`;

// ------------------------------------------------------------ the map

/** The continents, as (longitude, latitude) outlines, drawn plain. */
const LANDS: [number, number][][] = [
  // the Americas
  [[-165, 68], [-140, 70], [-120, 72], [-95, 72], [-80, 68], [-62, 60], [-55, 50], [-66, 44], [-76, 36], [-81, 27], [-80, 25], [-90, 30], [-97, 26], [-97, 20], [-87, 21], [-83, 10], [-78, 8], [-90, 14], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-80, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -42], [-68, -55], [-74, -50], [-72, -30], [-70, -18], [-80, -5]],
  [[-55, 80], [-25, 80], [-20, 72], [-40, 62], [-50, 64], [-58, 76]],
  // Eurasia
  [[-10, 36], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 55], [6, 62], [15, 69], [28, 71], [42, 68], [60, 70], [80, 73], [100, 76], [115, 73], [140, 72], [160, 70], [180, 68], [180, 64], [165, 60], [160, 55], [142, 53], [140, 46], [132, 42], [128, 38], [122, 40], [120, 32], [122, 25], [110, 21], [106, 10], [100, 13], [98, 16], [92, 22], [88, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [58, 20], [52, 15], [44, 12], [40, 20], [34, 28], [35, 36], [28, 37], [26, 40], [23, 36], [20, 40], [15, 38], [12, 44], [8, 44], [3, 42], [-5, 36]],
  [[-6, 50], [2, 51], [-2, 57], [-5, 59], [-6, 55]],
  [[130, 32], [141, 36], [142, 44], [140, 41], [135, 34]],
  // Africa
  [[-17, 21], [-16, 12], [-8, 5], [5, 5], [9, 4], [10, -2], [13, -12], [12, -18], [18, -34], [26, -34], [33, -26], [40, -15], [40, -5], [51, 12], [43, 12], [37, 20], [32, 31], [20, 32], [10, 37], [-6, 36], [-10, 30]],
  [[44, -25], [50, -15], [48, -13], [43, -18]],
  // Australia and the islands
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [141, -38], [132, -32], [115, -34]],
  [[95, 5], [104, -2], [106, -6], [100, -2]],
  [[108, -7], [115, -8], [122, -9], [114, -6]],
  [[110, 1], [118, 6], [119, -2], [112, -3]],
];

/** The cities pinned on the map, and the strings between them. */
const PINS: [number, number][] = [[0, 51], [-74, 41], [37, 55], [114, 22], [31, 30], [-43, -23], [151, -34]];
const STRINGS: [number, number][] = [[0, 1], [0, 2], [2, 3], [0, 4], [1, 5], [3, 6]];

function worldMap(x: number, y: number, w: number, h: number) {
  const fr = 3.5;
  const ix = x + fr;
  const iy = y + fr;
  const iw = w - 2 * fr;
  const ih = h - 2 * fr;
  const at = ([lon, lat]: [number, number]) => [ix + ((lon + 180) / 360) * iw, iy + ((80 - lat) / 140) * ih] as const;
  const lands = LANDS.map((pts) => `M${pts.map((p) => at(p).map(f).join(" ")).join("L")}Z`).join("");
  const grid = [
    ...Array.from({ length: 11 }, (_, i) => `M${f(ix + ((i + 1) * iw) / 12)} ${f(iy)}V${f(iy + ih)}`),
    ...Array.from({ length: 6 }, (_, i) => `M${f(ix)} ${f(iy + ((i + 1) * ih) / 7)}H${f(ix + iw)}`),
  ].join("");
  const strings = STRINGS.map(([a, b]) => {
    const [x0, y0] = at(PINS[a]);
    const [x1, y1] = at(PINS[b]);
    const sag = Math.abs(x1 - x0) * 0.12 + 3;
    return `M${f(x0)} ${f(y0)}Q${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 + sag)} ${f(x1)} ${f(y1)}`;
  }).join("");
  const pins = PINS.map((p, i) => {
    const [px, py] = at(p);
    const gold = i === 3;
    return `<circle cx="${f(px + 0.8)}" cy="${f(py + 1.4)}" r="2.3" fill="#000" fill-opacity="0.45"/><circle cx="${f(px)}" cy="${f(py)}" r="2.3" fill="url(#${gold ? "apg" : "apr"})" stroke="${gold ? INK : "#3A0408"}" stroke-width="0.5"/><circle cx="${f(px - 0.7)}" cy="${f(py - 0.8)}" r="0.7" fill="#fff" fill-opacity="0.9"/>`;
  }).join("");
  // the target circled in red over the gold pin
  const [tx, ty] = at(PINS[3]);
  return `
<path d="${rrect(x + 1.5, y + 3, w, h, 2)}" fill="#000" fill-opacity="0.5"/>
<rect x="${f(ix)}" y="${f(iy)}" width="${f(iw)}" height="${f(ih)}" fill="url(#asea)"/>
<path d="${grid}" stroke="#8AE8DA" stroke-opacity="0.16" stroke-width="0.5"/>
<path d="${lands}" fill="url(#aland)" stroke="#5A4420" stroke-width="0.6" stroke-linejoin="round"/>
<path d="${lands}" fill="none" stroke="#FFF8E0" stroke-opacity="0.35" stroke-width="0.4" stroke-linejoin="round" transform="translate(-0.4 -0.4)"/>
<path d="${strings}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1" transform="translate(0.6 1)"/>
<path d="${strings}" fill="none" stroke="#E0303E" stroke-width="0.8"/>
<circle cx="${f(tx)}" cy="${f(ty)}" r="6" fill="none" stroke="${STAMP}" stroke-width="0.9" stroke-dasharray="2.2 1.4"/>
${pins}
<rect x="${f(ix)}" y="${f(iy)}" width="${f(iw)}" height="${f(ih)}" fill="url(#aglass)"/>
<path d="${rrect(x, y, w, h, 2)}M${f(ix)} ${f(iy)}V${f(iy + ih)}H${f(ix + iw)}V${f(iy)}Z" fill="url(#asteel)" fill-rule="evenodd" stroke="${STEEL_INK}" stroke-width="0.8"/>
<path d="M${f(x + 1.5)} ${f(y + 1.2)}H${f(x + w * 0.55)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>
${[[x + 1.8, y + 1.8], [x + w - 1.8, y + 1.8], [x + 1.8, y + h - 1.8], [x + w - 1.8, y + h - 1.8]].map(([a, b]) => rivet(a, b, 1)).join("")}`;
}

// ------------------------------------------------------------ TOP SECRET

/** Block letters drawn in strokes on a 4 × 6 grid. */
const GLYPH: Record<string, string> = {
  T: "M0 0H4M2 0V6",
  O: "M0.4 0H3.6Q4 0 4 0.4V5.6Q4 6 3.6 6H0.4Q0 6 0 5.6V0.4Q0 0 0.4 0Z",
  P: "M0 6V0H3.4Q4 0 4 0.6V2.4Q4 3 3.4 3H0",
  S: "M4 0H0.6Q0 0 0 0.6V2.4Q0 3 0.6 3H3.4Q4 3 4 3.6V5.4Q4 6 3.4 6H0",
  E: "M4 0H0V6H4M0 3H3",
  C: "M4 0H0.6Q0 0 0 0.6V5.4Q0 6 0.6 6H4",
  R: "M0 6V0H3.4Q4 0 4 0.6V2.4Q4 3 3.4 3H0M2 3L4 6",
};

/** A word in stroked block letters, `size` tall, from x (left), y (top). */
function word(text: string, x: number, y: number, size: number, color: string) {
  const k = size / 6;
  const adv = 5.6;
  const d = [...text]
    .map((ch, i) => (GLYPH[ch] ? `<path d="${GLYPH[ch]}" transform="translate(${f(x + i * adv * k)} ${f(y)}) scale(${f(k)})"/>` : ""))
    .join("");
  return `<g fill="none" stroke="${color}" stroke-width="${f(1.25 / k)}" stroke-linecap="square" stroke-linejoin="miter">${d}</g>`;
}
const wordWidth = (text: string, size: number) => ((text.length - 1) * 5.6 + 4) * (size / 6);

// ------------------------------------------------------------ the room

function briefingRoom(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, door: D, board: B, table: T, spots } = R;
  const rail = Math.min(floorY - 40, B.y + B.h + 12);

  // the teal steel panels, riveted at their corners
  const cols = Math.max(4, Math.round(w / 64));
  const pw = w / cols;
  const panels = Array.from({ length: cols }, (_, i) => {
    const x = i * pw;
    return `<path d="${rrect(x + 3, wallTop + 3, pw - 6, rail - wallTop - 6, 2)}" fill="url(#apanel)" stroke="#06181A" stroke-width="0.9"/><path d="M${f(x + 4.5)} ${f(wallTop + 5)}V${f(rail - 5)}" stroke="#8AE8DA" stroke-opacity="0.12" stroke-width="0.8"/>${[[x + 7, wallTop + 7], [x + pw - 7, wallTop + 7], [x + 7, rail - 7], [x + pw - 7, rail - 7]].map(([a, b]) => rivet(a, b, 1.1)).join("")}`;
  }).join("");
  // the walnut wainscot under the steel rail
  const wains = Array.from({ length: cols }, (_, i) => {
    const x = i * pw;
    return `<path d="${rrect(x + 6, rail + 8, pw - 12, floorY - rail - 20, 2)}" fill="#000" fill-opacity="0.22" stroke="#140A04" stroke-width="0.8"/><path d="M${f(x + 7)} ${f(floorY - 12.5)}H${f(x + pw - 7)}" stroke="#fff" stroke-opacity="0.1" stroke-width="0.7"/>`;
  }).join("");

  // three world clocks over the lift's door
  const cr = Math.min(11.5, D.w * 0.12);
  const clock = (cx: number, cy: number, hr: number, mn: number) => {
    const ha = ((hr % 12) + mn / 60) * 30 - 90;
    const ma = mn * 6 - 90;
    const hand = (deg: number, len: number) => `L${f(cx + Math.cos((deg * Math.PI) / 180) * len)} ${f(cy + Math.sin((deg * Math.PI) / 180) * len)}`;
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const r0 = cr - (i % 3 ? 3.4 : 4.6);
      return `M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * (cr - 2.6))} ${f(cy + Math.sin(a) * (cr - 2.6))}`;
    }).join("");
    return `<circle cx="${f(cx + 0.8)}" cy="${f(cy + 1.6)}" r="${f(cr + 0.6)}" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="url(#arv)" stroke="${STEEL_INK}" stroke-width="0.8"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr - 2)}" fill="url(#aivory)" stroke="${STEEL_INK}" stroke-width="0.6"/>
<path d="${ticks}" stroke="#2A2A2E" stroke-width="0.6"/>
<path d="M${f(cx)} ${f(cy)}${hand(ha, cr * 0.45)}M${f(cx)} ${f(cy)}${hand(ma, cr * 0.7)}" stroke="#14181C" stroke-width="1" stroke-linecap="round"/>
<path d="M${f(cx)} ${f(cy)}${hand(ma + 140, cr * 0.72)}" stroke="${STAMP}" stroke-width="0.5"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="0.9" fill="#14181C"/>
<path d="M${f(cx - cr * 0.7)} ${f(cy - cr * 0.45)}A${f(cr - 1)} ${f(cr - 1)} 0 0 1 ${f(cx - cr * 0.2)} ${f(cy - cr * 0.85)}" stroke="#fff" stroke-width="0.8" fill="none" stroke-linecap="round"/>
<path d="${rrect(cx - 7, cy + cr + 3, 14, 4.6, 1)}" fill="url(#agv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(cx - 4)} ${f(cy + cr + 5.3)}H${f(cx + 4)}" stroke="#3A2408" stroke-width="0.9" stroke-dasharray="1.4 0.8"/>`;
  };
  const clockY = wallTop + 8 + cr;
  const clocks = [-1, 0, 1].map((k, i) => clock(D.x + D.w / 2 + k * (cr * 2 + 6), clockY, [9, 2, 22][i], [40, 15, 5][i])).join("");

  // the map and the window with its blinds
  const bw = Math.min(88, w * 0.21);
  const bx = w - 12 - bw;
  const by = wallTop + 5;
  const bh = B.y - 7 - by;
  const mapX = D.x + D.w + 12;
  const mapY = wallTop + 7;
  const mapW = bx - 10 - mapX;
  const mapH = B.y - 10 - mapY;
  const slats = Math.floor((bh * 0.66) / 4.2);
  const blindsBottom = by + 4 + slats * 4.2;
  const lights = Array.from({ length: 9 }, (_, i) => {
    const lx = bx + 6 + ((i * 37) % (bw - 12));
    const ly = blindsBottom + 3 + ((i * 13) % Math.max(4, by + bh - blindsBottom - 8));
    return `<circle cx="${f(lx)}" cy="${f(ly)}" r="${f(0.7 + (i % 3) * 0.35)}" fill="${i % 2 ? "#FFE7A0" : "#FFB86A"}" fill-opacity="0.8"/>`;
  }).join("");
  const blindsArt = `
<path d="${rrect(bx + 1.5, by + 3, bw, bh, 2)}" fill="#000" fill-opacity="0.5"/>
<rect x="${f(bx + 4)}" y="${f(by + 4)}" width="${f(bw - 8)}" height="${f(bh - 8)}" fill="url(#anight)"/>
<path d="M${f(bx + 4)} ${f(by + bh - 12)}h8v-10h6v6h7v-14h9v18h6v-8h8v10h10v-6h${f(bw - 68)}V${f(by + bh - 4)}H${f(bx + 4)}Z" fill="#081418"/>
${lights}
${Array.from({ length: slats }, (_, i) => {
    const y = by + 4 + i * 4.2;
    return `<path d="M${f(bx + 3)} ${f(y)}H${f(bx + bw - 3)}L${f(bx + bw - 4)} ${f(y + 3.4)}H${f(bx + 4)}Z" fill="url(#aslat)" stroke="#3A4248" stroke-width="0.4"/>`;
  }).join("")}
<path d="${rrect(bx + 2.5, blindsBottom - 1, bw - 5, 3, 1)}" fill="url(#asteel)" stroke="${STEEL_INK}" stroke-width="0.5"/>
<path d="M${f(bx + bw * 0.3)} ${f(by + 4)}V${f(blindsBottom)}M${f(bx + bw * 0.7)} ${f(by + 4)}V${f(blindsBottom)}" stroke="#E8E0C8" stroke-opacity="0.6" stroke-width="0.5"/>
<path d="M${f(bx + bw - 8)} ${f(by + 4)}V${f(blindsBottom + 16)}" stroke="#E8E0C8" stroke-width="0.6"/>
<circle cx="${f(bx + bw - 8)}" cy="${f(blindsBottom + 17.5)}" r="1.6" fill="url(#aivory)" stroke="#5A4A2A" stroke-width="0.4"/>
<path d="${rrect(bx, by, bw, bh, 2)}M${f(bx + 4)} ${f(by + 4)}V${f(by + bh - 4)}H${f(bx + bw - 4)}V${f(by + 4)}Z" fill="url(#asteel)" fill-rule="evenodd" stroke="${STEEL_INK}" stroke-width="0.8"/>
<path d="M${f(bx + 1.5)} ${f(by + 1.2)}H${f(bx + bw * 0.6)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>`;
  // the street's light through the slats, slanting down the wall
  const beams = Array.from({ length: 7 }, (_, i) => {
    const y0 = blindsBottom + 10 + i * 9;
    const x0 = bx + bw - 6;
    const x1 = bx - w * 0.42;
    const drop = w * 0.2;
    return `<path d="M${f(x0)} ${f(y0)}L${f(x0 - 30)} ${f(y0)}L${f(x1)} ${f(y0 + drop)}L${f(x1 + 46)} ${f(y0 + drop)}Z" fill="#F2E2B0" fill-opacity="0.08"/>`;
  }).join("");

  // the case board: a file's tab peeking out, a TOP SECRET slip pinned
  // over it, the agency's seal for the count
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const beads = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 23.7)}" cy="${f(my + Math.sin(a) * 23.7)}" r="1.1" fill="url(#arv)" stroke="${STEEL_INK}" stroke-width="0.3"/>`;
  }).join("");
  const stampSize = 6.4;
  const sw = wordWidth("TOP SECRET", stampSize) + 14;
  const slipX = B.x + B.w - 60 - sw;
  const slipY = B.y - 9;
  const boardArt = `
<path d="M${f(B.x + 16)} ${f(B.y + 6)}V${f(B.y - 4)}Q${f(B.x + 16)} ${f(B.y - 7)} ${f(B.x + 19)} ${f(B.y - 7)}H${f(B.x + 52)}L${f(B.x + 57)} ${f(B.y - 1)}V${f(B.y + 6)}Z" fill="url(#amanila)" stroke="${INK}" stroke-width="0.7"/>
<rect x="${f(B.x + 30)}" y="${f(B.y - 7)}" width="7" height="${f(13)}" fill="${STAMP}"/>
<path d="${rrect(B.x + 1.5, B.y + 3.5, B.w, B.h, 3)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(B.x, B.y, B.w, B.h, 3)}" fill="url(#asteel)" stroke="${STEEL_INK}" stroke-width="1.1"/>
<path d="M${f(B.x + 2)} ${f(B.y + 1.2)}H${f(B.x + B.w * 0.5)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>
<path d="${rrect(B.x + 4.5, B.y + 4.5, B.w - 9, B.h - 9, 1.5)}" fill="url(#afelt)" stroke="#040C0E" stroke-width="0.9"/>
<path d="${rrect(B.x + 7, B.y + 7, B.w - 14, B.h - 14, 1)}" fill="none" stroke="#7FE6D6" stroke-opacity="0.18" stroke-width="0.6"/>
${[[B.x + 2.4, B.y + 2.4], [B.x + B.w - 2.4, B.y + 2.4], [B.x + 2.4, B.y + B.h - 2.4], [B.x + B.w - 2.4, B.y + B.h - 2.4]].map(([a, b]) => rivet(a, b, 1.2)).join("")}
<g transform="rotate(-3.5 ${f(slipX + sw / 2)} ${f(slipY + 8)})">
<path d="${rrect(slipX + 1, slipY + 2, sw, 16, 1)}" fill="#000" fill-opacity="0.4"/>
<path d="${rrect(slipX, slipY, sw, 16, 1)}" fill="url(#amanila)" stroke="${INK}" stroke-width="0.6"/>
<path d="${rrect(slipX + 3, slipY + 2.6, sw - 6, 10.8, 1)}" fill="none" stroke="${STAMP}" stroke-width="1" stroke-opacity="0.9"/>
${word("TOP SECRET", slipX + 7, slipY + 4.8, stampSize, STAMP)}
<circle cx="${f(slipX + sw / 2 + 0.6)}" cy="${f(slipY + 1.6)}" r="2.2" fill="#000" fill-opacity="0.4"/>
<circle cx="${f(slipX + sw / 2)}" cy="${f(slipY + 0.8)}" r="2.2" fill="url(#apr)" stroke="#3A0408" stroke-width="0.5"/>
<circle cx="${f(slipX + sw / 2 - 0.7)}" cy="${f(slipY + 0.1)}" r="0.7" fill="#fff"/>
</g>
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="26" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="26" fill="url(#arv)" stroke="${STEEL_INK}" stroke-width="1.1"/>
${beads}
<circle cx="${f(mx)}" cy="${f(my)}" r="21.6" fill="url(#ateal)" stroke="${STEEL_INK}" stroke-width="0.7"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="19.8" fill="url(#aivory)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(mx - 15.4)} ${f(my - 7)}A16.8 16.8 0 0 1 ${f(mx - 6)} ${f(my - 16)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

  // the long briefing table: walnut, a green leather top, steel pedestals
  const top = T.y;
  const railY = top + 12;
  const apronH = 20;
  const ped = (x: number) =>
    `<rect x="${f(x)}" y="${f(railY + apronH)}" width="12" height="${f(floorY - railY - apronH - 3)}" fill="url(#agunh)" stroke="${STEEL_INK}" stroke-width="0.7"/><path d="M${f(x + 2)} ${f(railY + apronH + 2)}V${f(floorY - 5)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/><path d="${rrect(x - 5, floorY - 4, 22, 4, 1.2)}" fill="url(#agun)" stroke="${STEEL_INK}" stroke-width="0.6"/>`;
  const ccx = T.x + T.w / 2;
  const ccy = railY + apronH / 2 + 1.5;
  // a black telephone at the left end
  const px = T.x + 8;
  const phone = `
<path d="${oval(px + 12, top + 4, 14, 2.4)}" fill="#000" fill-opacity="0.4"/>
<path d="M${f(px + 2)} ${f(top + 4)}L${f(px + 5)} ${f(top - 7)}H${f(px + 19)}L${f(px + 22)} ${f(top + 4)}Z" fill="url(#ablack)" stroke="#000" stroke-width="0.7"/>
<circle cx="${f(px + 12)}" cy="${f(top - 1.4)}" r="4" fill="url(#arv)" stroke="${STEEL_INK}" stroke-width="0.5"/>
<circle cx="${f(px + 12)}" cy="${f(top - 1.4)}" r="1.4" fill="#14181C"/>
<path d="M${f(px)} ${f(top - 9.5)}Q${f(px + 12)} ${f(top - 13)} ${f(px + 24)} ${f(top - 9.5)}L${f(px + 24)} ${f(top - 7.2)}Q${f(px + 12)} ${f(top - 10)} ${f(px)} ${f(top - 7.2)}Z" fill="url(#ablack)" stroke="#000" stroke-width="0.6"/>
<path d="${rrect(px - 1.5, top - 10.5, 6, 4, 1.6)}${rrect(px + 19.5, top - 10.5, 6, 4, 1.6)}" fill="url(#ablack)" stroke="#000" stroke-width="0.6"/>
<path d="M${f(px + 3)} ${f(top - 10.8)}Q${f(px + 12)} ${f(top - 13)} ${f(px + 20)} ${f(top - 10.8)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>
<path d="M${f(px + 6)} ${f(top - 5)}L${f(px + 5)} ${f(top + 2)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>`;
  // a banker's lamp at the right end, lit
  const lx = T.x + T.w - 22;
  const lampArt = `
<path d="${oval(lx, top + 4, 11, 2.2)}" fill="#000" fill-opacity="0.4"/>
<path d="${rrect(lx - 8, top + 0.5, 16, 3.5, 1.5)}" fill="url(#agv)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(lx - 1)} ${f(top + 1)}V${f(top - 11)}H${f(lx + 1)}V${f(top + 1)}Z" fill="url(#agv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(lx - 10)} ${f(top - 10)}Q${f(lx - 10)} ${f(top - 17)} ${f(lx)} ${f(top - 17)}Q${f(lx + 10)} ${f(top - 17)} ${f(lx + 10)} ${f(top - 10)}Z" fill="url(#ashade)" stroke="#04200F" stroke-width="0.7"/>
<path d="${oval(lx, top - 10, 10, 1.4)}" fill="#FFF2C0"/>
<path d="M${f(lx - 7)} ${f(top - 12)}Q${f(lx - 6)} ${f(top - 15.5)} ${f(lx - 1)} ${f(top - 16)}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7" fill="none"/>`;
  const tableArt = `
<path d="M${f(T.x + 6)} ${f(floorY + 2)}H${f(T.x + T.w - 6)}" stroke="#000" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
${ped(T.x + 16)}${ped(T.x + T.w - 28)}
<path d="M${f(T.x + 14)} ${f(top)}H${f(T.x + T.w - 14)}L${f(T.x + T.w)} ${f(railY)}H${f(T.x)}Z" fill="url(#atop)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(T.x + 20)} ${f(top + 2.5)}H${f(T.x + T.w - 20)}L${f(T.x + T.w - 10)} ${f(railY - 2.5)}H${f(T.x + 10)}Z" fill="url(#aleather)" stroke="#C8A050" stroke-opacity="0.6" stroke-width="0.6"/>
<rect x="${f(T.x - 2)}" y="${f(railY)}" width="${f(T.w + 4)}" height="${apronH}" fill="url(#aapron)" stroke="${INK}" stroke-width="0.9"/>
${[0, 1].map((i) => `<path d="${rrect(i ? ccx + 14 : T.x + 6, railY + 5, ccx - 14 - T.x - 6, apronH - 8, 1.5)}" fill="#000" fill-opacity="0.2" stroke="#140A04" stroke-width="0.6"/>`).join("")}
<rect x="${f(T.x - 3)}" y="${f(railY - 1.5)}" width="${f(T.w + 6)}" height="3.5" rx="1.2" fill="url(#asteel)" stroke="${STEEL_INK}" stroke-width="0.6"/>
<path d="M${f(T.x)} ${f(railY - 0.6)}H${f(T.x + T.w * 0.45)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.7" stroke-linecap="round"/>
<circle cx="${f(ccx)}" cy="${f(ccy)}" r="7.4" fill="url(#agd)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${f(ccx)}" cy="${f(ccy)}" r="4.8" fill="url(#ateal)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(ccx)} ${f(ccy - 3.2)}L${f(ccx + 1)} ${f(ccy - 0.6)}L${f(ccx + 3.2)} ${f(ccy - 0.6)}L${f(ccx + 1.4)} ${f(ccy + 0.9)}L${f(ccx + 2)} ${f(ccy + 3.2)}L${f(ccx)} ${f(ccy + 1.8)}L${f(ccx - 2)} ${f(ccy + 3.2)}L${f(ccx - 1.4)} ${f(ccy + 0.9)}L${f(ccx - 3.2)} ${f(ccy - 0.6)}L${f(ccx - 1)} ${f(ccy - 0.6)}Z" fill="url(#agv)" stroke="${INK}" stroke-width="0.3"/>
${phone}
${lampArt}`;

  // a dark teal carpet where everyone stands, a silver border round it
  const ry0 = floorY + 12;
  const ry1 = h - 6;
  const rx = (v: number, side: number) => w / 2 + side * (w * 0.33 + w * 0.17 * v);
  const quad = (inset: number) => {
    const v0 = (inset * 0.6) / (ry1 - ry0);
    const v1 = 1 - inset / (ry1 - ry0);
    return `M${f(rx(v0, -1) + inset)} ${f(ry0 + inset * 0.6)}H${f(rx(v0, 1) - inset)}L${f(rx(v1, 1) - inset * 1.4)} ${f(ry1 - inset)}H${f(rx(v1, -1) + inset * 1.4)}Z`;
  };
  const rcx = w / 2;
  const rcy = (ry0 + ry1) / 2;
  const star = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const len = i % 2 ? 0.5 : 1;
    const R0 = Math.min(w * 0.22, (ry1 - ry0) * 0.42);
    const tip = [rcx + Math.cos(a) * R0 * len * 1.25, rcy + Math.sin(a) * R0 * len * 0.62];
    const l = [rcx + Math.cos(a - 0.35) * R0 * 0.18 * 1.25, rcy + Math.sin(a - 0.35) * R0 * 0.18 * 0.62];
    const r = [rcx + Math.cos(a + 0.35) * R0 * 0.18 * 1.25, rcy + Math.sin(a + 0.35) * R0 * 0.18 * 0.62];
    return `M${f(rcx)} ${f(rcy)}L${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}L${f(r[0])} ${f(r[1])}Z`;
  }).join("");
  const carpet = `
<path d="${quad(0)}" fill="#000" fill-opacity="0.35" transform="translate(0 3)"/>
<path d="${quad(0)}" fill="url(#acarpet)" stroke="#040C0E" stroke-width="0.9"/>
<path d="${quad(5)}" fill="none" stroke="url(#asteelh)" stroke-width="1.6"/>
<path d="${quad(11)}" fill="none" stroke="#7FE6D6" stroke-opacity="0.22" stroke-width="0.8" stroke-dasharray="8 3"/>
<path d="${quad(16)}" fill="none" stroke="url(#asteelh)" stroke-width="1"/>
<path d="${star}" fill="#7FE6D6" fill-opacity="0.07" stroke="#7FE6D6" stroke-opacity="0.16" stroke-width="0.6"/>
<path d="${quad(0)}" fill="url(#arugv)"/>`;

  // the ceiling's tiles and the steel girder, a clamp for each lamp
  const tiles = Array.from({ length: Math.ceil(w / 22) }, (_, i) => `M${f(i * 22 + 11)} 0V${f(roof)}`).join("");
  const girderRivets = Array.from({ length: Math.ceil(w / 14) }, (_, i) => rivet(i * 14 + 7, beam.y + beam.h / 2, 1.1)).join("");
  const clampY = beam.y + beam.h;
  const clamps = spots
    .map((s) => `<path d="${rrect(s.lantern.x - 4, clampY - 2, 8, 4.5, 1.2)}" fill="url(#asteel)" stroke="${STEEL_INK}" stroke-width="0.5"/>`)
    .join("");

  return svg(
    w,
    h,
    `<defs>
${linear("apanel", TEAL)}
${linear("awall", ["#163234", "#0C1E20"])}
${lit("awain", WALNUT, 0, rail, 0, floorY)}
${linear("asteel", MATERIALS.silver)}
${linear("asteelh", MATERIALS.silver, false)}
${radial("arv", ["#FFFFFF", "#C9D0DA", "#5A6474"], undefined, 0.35, 0.3, 0.75)}
${linear("aivory", MATERIALS.ivory)}
${linear("agv", MATERIALS.gold)}
${radial("agd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("ateal", ["#8AE8DA", "#1E8A80", "#0A3A36"], undefined, 0.38, 0.32, 0.8)}
${radial("apr", JEWELS.ruby, undefined, 0.38, 0.32, 0.75)}
${radial("apg", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${linear("asea", ["#1E5458", "#123A3E", "#0A2628"])}
${linear("aland", ["#F2E4BC", "#DCC690", "#B89A5A"])}
${linear("aglass", ["#FFFFFF", "#FFFFFF"], true, [0.12, 0])}
${linear("amanila", MANILA)}
${linear("anight", ["#0A1A2E", "#1A3450", "#2A3A48"])}
${linear("aslat", ["#F4F0E4", "#D8D2C0", "#A8A290"])}
${linear("afelt", ["#1C3034", "#12221F", "#0A1416"])}
${lit("atop", ["#7A4C30", "#5A3420", "#3A2010"], 0, T.y, 0, T.y + 12)}
${linear("aleather", ["#2E7A56", "#1E5A3E", "#123A28"])}
${lit("aapron", WALNUT, 0, T.y + 12, 0, T.y + 32)}
${linear("ablack", ["#4A4E56", "#1A1C20", "#08090A"])}
${linear("ashade", ["#7AE0A0", "#1E8A50", "#0A3A20"])}
${linear("acarpet", ["#16363A", "#0F282B", "#081A1C"])}
${radial("arugv", ["#000000", "#000000"], [0, 0.5], 0.5, 0.2, 0.9)}
${radial("ashadow", ["#000000", "#000000"], [0, 0.6], 0.5, 0.12, 1)}
<radialGradient id="adesk" gradientUnits="userSpaceOnUse" cx="${f(lx)}" cy="${f(top - 6)}" r="70"><stop offset="0" stop-color="#FFE6A0" stop-opacity="0.4"/><stop offset="1" stop-color="#FFE6A0" stop-opacity="0"/></radialGradient>
<radialGradient id="astreet" gradientUnits="userSpaceOnUse" cx="${f(bx + bw / 2)}" cy="${f(by + bh)}" r="${f(w * 0.5)}"><stop offset="0" stop-color="#9CD8FF" stop-opacity="0.14"/><stop offset="1" stop-color="#9CD8FF" stop-opacity="0"/></radialGradient>
${linear("agun", ["#B8C0CA", "#6A7480", "#3A424C"])}
${linear("agunh", ["#B8C0CA", "#6A7480", "#3A424C", "#8A94A0"], false)}
${linear("agirder", ["#DDE3EA", "#9AA4B0", "#5A6470", "#B8C0CA"])}
</defs>
<rect y="${f(wallTop)}" width="${w}" height="${f(rail - wallTop)}" fill="url(#awall)"/>
${panels}
<rect y="${f(rail)}" width="${w}" height="${f(floorY - rail)}" fill="url(#awain)"/>
${wains}
<rect y="${f(rail - 2.5)}" width="${w}" height="5" fill="url(#asteel)" stroke="${STEEL_INK}" stroke-width="0.7"/>
<path d="M0 ${f(rail - 1.6)}H${w}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#ashadow)"/>
${beams}
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#astreet)"/>
${clocks}
${worldMap(mapX, mapY, mapW, mapH)}
${blindsArt}
${boardsArt(w, floorY, h, "#3A2C24")}
<rect y="${f(floorY - 8)}" width="${w}" height="8" fill="url(#agun)" stroke="${STEEL_INK}" stroke-width="0.7"/>
<path d="M0 ${f(floorY - 7)}H${w}" stroke="#fff" stroke-opacity="0.3" stroke-width="0.6"/>
${carpet}
${doorArt(R, floor, floors)}
<rect y="${f(wallTop)}" width="${w}" height="${f(h - wallTop)}" fill="url(#adesk)"/>
${tableArt}
<rect width="${w}" height="${roof}" fill="#142224"/>
<path d="${tiles}" stroke="#06100F" stroke-width="1"/>
<path d="M0 ${f(roof / 2)}H${w}" stroke="#06100F" stroke-width="0.8"/>
<rect y="${f(roof)}" width="${w}" height="${f(beam.y - roof)}" fill="#0A1214"/>
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<path d="M0 ${beam.y}H${w}V${beam.y + beam.h}H0Z" fill="url(#agirder)" stroke="${STEEL_INK}" stroke-width="0.9"/>
<path d="M0 ${f(beam.y + 2.6)}H${w}M0 ${f(beam.y + beam.h - 2.6)}H${w}" stroke="#3A4450" stroke-width="0.8"/>
<path d="M0 ${f(beam.y + 1.2)}H${w}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7"/>
${girderRivets}
${clamps}
${boardArt}`,
  );
}

// ------------------------------------------------------------ the lamps

const LAMP_W = 32;
const LAMP_H = 46;

/** A green enamel pendant lamp: a steel socket, the shade white inside;
 *  lit, the bulb and the shade's inside glow. */
function pendantArt(on: boolean) {
  const c = LAMP_W / 2;
  const bulb = on ? ["#FFFFFF", "#FFF2B8", "#F0C050"] : ["#9A9C9E", "#55585C", "#2A2C2E"];
  const inner = on ? ["#FFFBE8", "#FFE7A0"] : ["#A8B0AC", "#6A726E"];
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${linear("pe", ["#7AE0A8", "#2E8A5A", "#0E3A24"], false)}${linear("ps", MATERIALS.silver, false)}${radial("pb", bulb, undefined, 0.4, 0.35, 0.7)}${linear("pi", inner)}</defs>
<path d="M${c} 0V12" stroke="#14181C" stroke-width="1.2"/>
<path d="${rrect(c - 3.6, 10, 7.2, 8, 1.5)}" fill="url(#ps)" stroke="${STEEL_INK}" stroke-width="0.6"/>
<path d="M${c - 3.6} 13H${c + 3.6}" stroke="#4A5462" stroke-width="0.5"/>
<path d="${oval(c, 33, 14.4, 3)}" fill="url(#pi)"/>
<circle cx="${c}" cy="35.6" r="4.6" fill="url(#pb)" stroke="#2A2C2E" stroke-width="0.6"/>
<path d="M${c - 2.2} 34A2.6 2.6 0 0 1 ${c - 0.4} 32.4" stroke="#fff" stroke-width="0.7" fill="none" stroke-linecap="round"/>
<path d="M${c - 5} 17H${c + 5}L${c + 15} 32Q${c + 15.5} 34 ${c + 13.6} 33.4Q${c} 30 ${c - 13.6} 33.4Q${c - 15.5} 34 ${c - 15} 32Z" fill="url(#pe)" stroke="#04200F" stroke-width="0.8"/>
<path d="M${c - 4} 19L${c - 11} 30" stroke="#fff" stroke-opacity="0.6" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${c - 14} 33.2Q${c} 29.6 ${c + 14} 33.2" stroke="url(#ps)" stroke-width="1.4" fill="none"/>`,
  );
}

// ------------------------------------------------------------ the piece

const FILE_W = 26;
const FILE_H = 32;

/** A player's dossier standing on the table: manila, a tab, the red
 *  band across it, the agency's seal on its cover. */
function dossierArt() {
  const W = FILE_W;
  const H = FILE_H;
  return svg(
    W,
    H,
    `<defs>${linear("dm", MANILA)}${linear("db", ["#E8CC8A", "#C9A45A", "#8A6A2E"])}${radial("dt", ["#8AE8DA", "#1E8A80", "#0A3A36"], undefined, 0.38, 0.32, 0.8)}${radial("dg", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}<clipPath id="dc"><path d="${rrect(2, 6, W - 4, H - 8, 1.5)}"/></clipPath></defs>
<path d="M2 5H12L14 2H21L23 5H${W - 2}V${H - 2}H2Z" fill="url(#db)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rrect(4.5, 3.5, W - 9, 10, 0.8)}" fill="#FFFDF4" stroke="#8A7A5A" stroke-width="0.4"/>
<path d="${rrect(2, 6, W - 4, H - 8, 1.5)}" fill="url(#dm)" stroke="${INK}" stroke-width="0.9"/>
<g clip-path="url(#dc)"><path d="M-2 ${H - 6}L${W + 2} ${H - 14}V${H - 9}L-2 ${H - 1}Z" fill="${STAMP}" stroke="#4A0410" stroke-width="0.5"/></g>
<circle cx="${W / 2}" cy="14.5" r="5" fill="url(#dg)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${W / 2}" cy="14.5" r="3.2" fill="url(#dt)" stroke="${INK}" stroke-width="0.4"/>
<path d="M4 8H${W * 0.55}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>`,
  );
}

export const ROOM: RoomLook = {
  light: "#F2DCA0",
  art: briefingRoom,
  lamp: { lit: () => pendantArt(true), out: () => pendantArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: dossierArt, w: FILE_W, h: FILE_H },
  board: { title: "#7FE6D6", text: "#EEF4F3" },
  popup: { enamel: ["#3AB0A2", "#16645C", "#08302C"], jewel: "ruby", glow: "#F2DCA0" },
};

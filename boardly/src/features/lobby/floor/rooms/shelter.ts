// Shelter's room on its floor of the lift: the snowed-in house's
// storeroom, seen flat on. Rough pine boards on a fieldstone footing; a
// small window over the lift's door with the night's snow drifted up
// outside and frost ferns in its corners (the cold side); a long shelf of
// tins, jars, bottles and sacks across the wall; the pot-bellied stove in
// the right-hand corner, glowing through its grate, its pipe up through
// the ceiling (the warm side); the house rules chalked on a slate hung
// from the shelf, a tin lid nailed on for the count; the rough plank
// table with a loaf on it and a tin can for each player; a braided rag
// rug on the boards; hurricane lanterns hung on iron hooks under the hewn
// beam. As SVG markup, baked once (RoomScene). Hustle's den (../rooms.ts)
// is the model.

import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, frond, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { boardsArt, doorArt, lit, svg } from "../art";
import type { RoomLayout } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const IRON_INK = INKS.iron.ink;
const PINE = ["#B8946A", "#8A6A48", "#5A422C"];
const IRON = ["#8A8E96", "#4A4E56", "#202228"];
const TIN = ["#F4F6F8", "#B8C0CA", "#6A7480", "#D8DEE6"];
const FLAME = ["#FFF6C8", "#FFC85A", "#F07A22", "#8A2A08"];
const SNOW = ["#FFFFFF", "#E4EEF8", "#A8BED6"];

/** The same numbers every time: a little roughness that doesn't move. */
const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** An oval as a path (a gradient on an <ellipse> bakes black). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** A nail head. */
const nail = (x: number, y: number, r = 1.1) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#2A2420"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.4)}" fill="#C8C0B0" fill-opacity="0.6"/>`;

// ------------------------------------------------------------ the larder

/** A tin can standing at x (its left) on y: tin, a paper label, ribs. */
function tin(x: number, y: number, w: number, h: number, label: string) {
  const top = y - h;
  const ry = Math.min(1.8, w * 0.16);
  const lb = top + h * 0.3;
  const lh = h * 0.46;
  return `<path d="M${f(x)} ${f(top)}V${f(y - ry)}A${f(w / 2)} ${ry} 0 0 0 ${f(x + w)} ${f(y - ry)}V${f(top)}Z" fill="url(#stin)" stroke="${IRON_INK}" stroke-width="0.6"/>
<path d="M${f(x)} ${f(lb)}H${f(x + w)}V${f(lb + lh)}H${f(x)}Z" fill="${label}"/>
<path d="M${f(x)} ${f(lb + lh * 0.38)}H${f(x + w)}" stroke="#F4EEDF" stroke-width="${f(lh * 0.22)}" stroke-opacity="0.85"/>
<path d="M${f(x)} ${f(lb)}H${f(x + w)}M${f(x)} ${f(lb + lh)}H${f(x + w)}" stroke="${shade(label, -0.5)}" stroke-width="0.5"/>
<path d="${oval(x + w / 2, top, w / 2, ry)}" fill="url(#stinv)" stroke="${IRON_INK}" stroke-width="0.6"/>
<path d="M${f(x + w * 0.22)} ${f(top + 1.5)}V${f(y - 1.5)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.7"/>`;
}

/** A glass jar of preserves with a tin lid. */
function jar(x: number, y: number, w: number, h: number, fill: string) {
  const top = y - h;
  const body = rrect(x, top + 2.5, w, h - 2.5, 2.4);
  return `<path d="${body}" fill="${shade(fill, -0.15)}" stroke="#1A1410" stroke-width="0.6"/>
<path d="${rrect(x + 0.8, top + h * 0.32, w - 1.6, h * 0.68 - 0.8, 1.8)}" fill="${fill}"/>
<path d="${rrect(x + 0.8, top + h * 0.32, w - 1.6, 2, 1)}" fill="${shade(fill, 0.35)}" fill-opacity="0.8"/>
<path d="${body}" fill="#DCE8F0" fill-opacity="0.14"/>
<path d="${rrect(x - 0.5, top, w + 1, 3.4, 1)}" fill="url(#stinv)" stroke="${IRON_INK}" stroke-width="0.5"/>
<path d="M${f(x + 1.8)} ${f(top + 5)}V${f(y - 2.5)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8" stroke-linecap="round"/>`;
}

/** A dark glass bottle, corked. */
function bottle(x: number, y: number, w: number, h: number) {
  const top = y - h;
  const c = x + w / 2;
  const nk = w * 0.2;
  const d = `M${f(c - nk)} ${f(top + 2)}V${f(top + h * 0.34)}Q${f(x)} ${f(top + h * 0.4)} ${f(x)} ${f(top + h * 0.5)}V${f(y - 1)}Q${f(x)} ${f(y)} ${f(x + 1)} ${f(y)}H${f(x + w - 1)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y - 1)}V${f(top + h * 0.5)}Q${f(x + w)} ${f(top + h * 0.4)} ${f(c + nk)} ${f(top + h * 0.34)}V${f(top + 2)}Z`;
  return `<path d="${d}" fill="url(#sbtl)" stroke="#0A1A10" stroke-width="0.6"/>
<path d="${rrect(c - nk - 0.3, top, nk * 2 + 0.6, 3, 0.8)}" fill="#A8784A" stroke="#3A2408" stroke-width="0.4"/>
<path d="${rrect(x + 0.6, top + h * 0.56, w - 1.2, h * 0.22, 0.5)}" fill="#E8DCC0"/>
<path d="M${f(x + 1.4)} ${f(top + h * 0.5)}V${f(y - 2)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>`;
}

/** A burlap sack, tied at the neck. */
function sack(x: number, y: number, w: number, h: number) {
  const top = y - h;
  const c = x + w / 2;
  const d = `M${f(c - 2.5)} ${f(top + 3)}Q${f(x - 1)} ${f(top + h * 0.45)} ${f(x + 0.5)} ${f(y - 1)}Q${f(c)} ${f(y + 1)} ${f(x + w - 0.5)} ${f(y - 1)}Q${f(x + w + 1)} ${f(top + h * 0.45)} ${f(c + 2.5)} ${f(top + 3)}Z`;
  return `<path d="${d}" fill="url(#ssack)" stroke="#3A2408" stroke-width="0.6"/>
<path d="M${f(c - 3.2)} ${f(top)}L${f(c - 2)} ${f(top + 3.6)}H${f(c + 2)}L${f(c + 3.2)} ${f(top)}Z" fill="#B89060" stroke="#3A2408" stroke-width="0.5"/>
<path d="M${f(c - 3)} ${f(top + 3.4)}H${f(c + 3)}" stroke="#5A3A18" stroke-width="1"/>
<path d="M${f(x + 3)} ${f(top + h * 0.55)}Q${f(c)} ${f(top + h * 0.62)} ${f(x + w - 3)} ${f(top + h * 0.55)}" stroke="#7A2A18" stroke-width="1.4" fill="none" stroke-opacity="0.75"/>
<path d="M${f(x + 2.5)} ${f(top + h * 0.4)}Q${f(x + 2)} ${f(y - 4)} ${f(x + 3.5)} ${f(y - 2)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>`;
}

/** The shelf's load, packed from x0 to x1 on y (left out of [skip0, skip1]). */
function larder(x0: number, x1: number, y: number) {
  const LABELS = ["#E8803C", "#4A78B8", "#C2203A", "#5A9A4A", "#D8A030"];
  const FILLS = ["#A8243A", "#E0962A", "#6A8A3A", "#C84A2A"];
  const kinds = ["jar", "tin", "tin", "bottle", "sack", "tin2", "jar", "tin", "bottle", "jar", "tin2", "sack"];
  const out: string[] = [];
  let x = x0 + 3;
  for (let i = 0; ; i++) {
    const kind = kinds[i % kinds.length];
    const j = rnd(i + 3);
    const size = { jar: [11, 15], tin: [9, 12], tin2: [8, 16], bottle: [6, 20], sack: [15, 16] }[kind] as number[];
    const w = size[0];
    if (x + w > x1 - 3) break;
    const h = size[1] + Math.round(j * 2);
    if (kind === "jar") out.push(jar(x, y, w, h, FILLS[i % FILLS.length]));
    else if (kind === "bottle") out.push(bottle(x, y, w, h));
    else if (kind === "sack") out.push(sack(x, y, w, h));
    else if (kind === "tin" && j > 0.5) {
      // two tins stacked
      out.push(tin(x, y, w, h * 0.7, LABELS[i % LABELS.length]));
      out.push(tin(x + 0.5, y - h * 0.7, w - 1, h * 0.62, LABELS[(i + 2) % LABELS.length]));
    } else out.push(tin(x, y, w, h, LABELS[i % LABELS.length]));
    x += w + 2 + Math.round(rnd(i + 11) * 3);
  }
  return out.join("");
}

// ------------------------------------------------------------ the room

function storeroom(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, door: D, board: B, table: T, spots } = R;

  // the back wall: rough pine boards, each a little different
  const planks: string[] = [];
  for (let x = 0, i = 0; x < w; i++) {
    const pw = 17 + Math.round(rnd(i) * 7);
    const tone = shade(["#4E3E30", "#463729", "#54432F", "#4A3A2A"][i % 4], (rnd(i + 40) - 0.5) * 0.12);
    planks.push(`<rect x="${f(x)}" y="${f(wallTop)}" width="${pw}" height="${f(floorY - wallTop)}" fill="${tone}"/>`);
    planks.push(`<path d="M${f(x + 0.6)} ${f(wallTop)}V${f(floorY)}" stroke="#fff" stroke-opacity="0.07" stroke-width="0.8"/>`);
    planks.push(`<path d="M${f(x + pw)} ${f(wallTop)}V${f(floorY)}" stroke="#140C06" stroke-opacity="0.8" stroke-width="1.2"/>`);
    // grain, and a knot here and there
    for (let g = 0; g < 2; g++) {
      const gx = x + pw * (0.3 + g * 0.35);
      planks.push(`<path d="M${f(gx)} ${f(wallTop)}C${f(gx + 1.5)} ${f(wallTop + 60)} ${f(gx - 1.5)} ${f(floorY - 90)} ${f(gx + 0.8)} ${f(floorY)}" stroke="#1E140A" stroke-opacity="0.22" stroke-width="0.6" fill="none"/>`);
    }
    if (rnd(i + 7) > 0.55) {
      const ky = wallTop + 30 + rnd(i + 9) * (floorY - wallTop - 60);
      planks.push(`<path d="${oval(x + pw / 2, ky, 2.2, 3.2)}" fill="#24180E" fill-opacity="0.55"/><path d="${oval(x + pw / 2, ky, 3.6, 5)}" fill="none" stroke="#24180E" stroke-opacity="0.3" stroke-width="0.6"/>`);
    }
    x += pw;
  }
  // battens across the boards, nailed
  const batten = (y: number) => {
    const nails = Array.from({ length: Math.ceil(w / 21) }, (_, i) => nail(i * 21 + 9, y + 3.5)).join("");
    return `<rect x="0" y="${f(y)}" width="${w}" height="7" fill="url(#sbat)" stroke="#140C06" stroke-width="0.7"/><path d="M0 ${f(y + 1)}H${w}" stroke="#fff" stroke-opacity="0.14" stroke-width="0.7"/>${nails}`;
  };
  const midBatten = B.y + B.h + Math.max(8, (T.y - B.y - B.h) * 0.45);

  // the fieldstone footing along the wall's foot
  const stoneTop = floorY - 30;
  const stones: string[] = [];
  for (let row = 0; row < 2; row++) {
    const y0 = stoneTop + row * 15;
    for (let x = row ? -12 : -4, i = row * 40; x < w; i++) {
      const sw = 20 + Math.round(rnd(i + 70) * 14);
      stones.push(`<path d="${rrect(x + 1, y0 + 1, sw - 2, 13, 5)}" fill="url(#sstone)" stroke="#16161A" stroke-width="0.8"/><path d="M${f(x + 4)} ${f(y0 + 2.6)}H${f(x + sw * 0.55)}" stroke="#fff" stroke-opacity="0.22" stroke-width="0.7" stroke-linecap="round"/>`);
      x += sw;
    }
  }

  // the window over the lift's door: night and snow outside, frost
  const ww = Math.min(66, D.w * 0.66);
  const wx = D.x + D.w / 2 - ww / 2;
  const wy = wallTop + 9;
  const wh = Math.max(34, D.y - 26 - wy);
  const fr = 5;
  const gx = wx + fr;
  const gy = wy + fr;
  const gw = ww - 2 * fr;
  const gh = wh - 2 * fr;
  const flakes = Array.from({ length: 22 }, (_, i) =>
    `<circle cx="${f(gx + rnd(i + 100) * gw)}" cy="${f(gy + rnd(i + 200) * gh * 0.7)}" r="${f(0.5 + rnd(i + 300) * 0.9)}" fill="#fff" fill-opacity="${f(0.55 + rnd(i + 400) * 0.45)}"/>`,
  ).join("");
  const fir = (x: number, base: number, s: number) =>
    `<path d="M${f(x)} ${f(base - 16 * s)}L${f(x + 5 * s)} ${f(base - 8 * s)}H${f(x + 3 * s)}L${f(x + 7 * s)} ${f(base)}H${f(x - 7 * s)}L${f(x - 3 * s)} ${f(base - 8 * s)}H${f(x - 5 * s)}Z" fill="#14223A"/><path d="M${f(x)} ${f(base - 16 * s)}L${f(x + 3 * s)} ${f(base - 11 * s)}L${f(x - 3 * s)} ${f(base - 11 * s)}Z" fill="#E4EEF8" fill-opacity="0.8"/>`;
  const drift = `M${f(gx)} ${f(gy + gh * 0.62)}Q${f(gx + gw * 0.28)} ${f(gy + gh * 0.44)} ${f(gx + gw * 0.55)} ${f(gy + gh * 0.66)}T${f(gx + gw)} ${f(gy + gh * 0.56)}V${f(gy + gh)}H${f(gx)}Z`;
  const frost = (x: number, y: number, base: number) =>
    [-26, 0, 26]
      .map((a, i) => `<path d="${frond([10, 14, 9][i], 3.4, 4)}" transform="translate(${f(x)} ${f(y)}) rotate(${base + a})" fill="#F4FAFF" fill-opacity="0.42" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.35"/>`)
      .join("");
  const windowArt = `
<path d="${rrect(wx + 1.5, wy + 3, ww, wh + 4, 2)}" fill="#000" fill-opacity="0.45"/>
<clipPath id="sglass"><rect x="${f(gx)}" y="${f(gy)}" width="${f(gw)}" height="${f(gh)}"/></clipPath>
<g clip-path="url(#sglass)">
<rect x="${f(gx)}" y="${f(gy)}" width="${f(gw)}" height="${f(gh)}" fill="url(#ssky)"/>
<circle cx="${f(gx + gw * 0.78)}" cy="${f(gy + gh * 0.2)}" r="${f(gh * 0.1)}" fill="#F4F0DC" fill-opacity="0.9"/>
${fir(gx + gw * 0.2, gy + gh * 0.66, 0.9)}${fir(gx + gw * 0.72, gy + gh * 0.7, 1.1)}${fir(gx + gw * 0.46, gy + gh * 0.68, 0.7)}
<path d="${drift}" fill="url(#ssnow)"/>
<path d="M${f(gx)} ${f(gy + gh * 0.62)}Q${f(gx + gw * 0.28)} ${f(gy + gh * 0.44)} ${f(gx + gw * 0.55)} ${f(gy + gh * 0.66)}" stroke="#fff" stroke-width="1" fill="none"/>
${flakes}
${frost(gx, gy + gh, 50)}${frost(gx + gw, gy + gh, -50)}${frost(gx, gy, 130)}${frost(gx + gw, gy, -130)}
<rect x="${f(gx)}" y="${f(gy)}" width="${f(gw)}" height="${f(gh)}" fill="url(#sfog)"/>
</g>
<path d="${rrect(wx, wy, ww, wh, 2)}M${f(gx)} ${f(gy)}V${f(gy + gh)}H${f(gx + gw)}V${f(gy)}Z" fill="url(#spine)" fill-rule="evenodd" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(gx + gw / 2)} ${f(gy)}V${f(gy + gh)}M${f(gx)} ${f(gy + gh / 2)}H${f(gx + gw)}" stroke="#3A2414" stroke-width="3.4"/>
<path d="M${f(gx + gw / 2)} ${f(gy)}V${f(gy + gh)}M${f(gx)} ${f(gy + gh / 2)}H${f(gx + gw)}" stroke="#8A6A48" stroke-width="2"/>
<path d="M${f(wx + 1.5)} ${f(wy + 1.4)}H${f(wx + ww * 0.6)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8" stroke-linecap="round"/>
<path d="${rrect(wx - 4, wy + wh - 1, ww + 8, 5, 1.2)}" fill="url(#spine)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(wx - 2)} ${f(wy + wh)}H${f(wx + ww * 0.5)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>
<path d="M${f(wx - 3)} ${f(wy + wh - 1)}Q${f(wx + 6)} ${f(wy + wh - 4)} ${f(wx + 14)} ${f(wy + wh - 1)}Z" fill="url(#ssnow)" stroke="#8AA0BA" stroke-width="0.4"/>`;

  // the shelf of provisions across the wall over the board
  const shelfY = B.y - 13;
  const sx0 = D.x + D.w + 8;
  const sx1 = w - 64;
  const shelfArt = `
${larder(sx0, sx1, shelfY)}
<path d="M${f(sx0)} ${f(shelfY + 6.5)}H${f(sx1)}" stroke="#000" stroke-opacity="0.45" stroke-width="4"/>
<path d="${rrect(sx0, shelfY, sx1 - sx0, 5, 1)}" fill="url(#spine)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(sx0 + 2)} ${f(shelfY + 1)}H${f(sx0 + (sx1 - sx0) * 0.45)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>
${[sx0 + 7, sx1 - 9].map((x) => `<path d="M${f(x)} ${f(shelfY + 5)}V${f(shelfY + 14)}L${f(x + 3)} ${f(shelfY + 14)}L${f(x + 3)} ${f(shelfY + 10)}Q${f(x + 3)} ${f(shelfY + 8)} ${f(x + 7)} ${f(shelfY + 8)}V${f(shelfY + 5)}Z" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.6"/>`).join("")}`;

  // the pot-bellied stove in the corner, its pipe up through the ceiling
  const sw = 38;
  const sx = w - 12 - sw;
  const sc = sx + sw / 2;
  const sb = floorY + 2;
  const belly = `M${f(sx + 7)} ${f(sb - 13)}C${f(sx - 1)} ${f(sb - 18)} ${f(sx - 2)} ${f(sb - 40)} ${f(sx + 6)} ${f(sb - 47)}Q${f(sx + 9)} ${f(sb - 50)} ${f(sx + 11)} ${f(sb - 50)}H${f(sx + sw - 11)}Q${f(sx + sw - 9)} ${f(sb - 50)} ${f(sx + sw - 6)} ${f(sb - 47)}C${f(sx + sw + 2)} ${f(sb - 40)} ${f(sx + sw + 1)} ${f(sb - 18)} ${f(sx + sw - 7)} ${f(sb - 13)}Z`;
  const SK = 1.2;
  const pipeTop = sb - 60 * SK;
  const joints = Array.from({ length: Math.floor(pipeTop / 34) }, (_, i) => {
    const y = pipeTop - 26 - i * 34;
    return `<rect x="${f(sc - 5.5)}" y="${f(y)}" width="11" height="3" rx="1" fill="url(#sironh)" stroke="${IRON_INK}" stroke-width="0.5"/>`;
  }).join("");
  const legs = [sx + 6, sc, sx + sw - 6]
    .map((x, i) => `<path d="M${f(x - 2.5)} ${f(sb - 8)}H${f(x + 2.5)}L${f(x + (i - 1) * 2 + 1.5)} ${f(sb)}H${f(x + (i - 1) * 2 - 1.5)}Z" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.6"/>`)
    .join("");
  const gy0 = sb - 37;
  const stoveArt = `
<rect x="${f(sc - 4.5)}" y="0" width="9" height="${f(pipeTop + 2)}" fill="url(#sironh)" stroke="${IRON_INK}" stroke-width="0.7"/>
<path d="M${f(sc - 2.6)} 0V${f(pipeTop)}" stroke="#fff" stroke-opacity="0.22" stroke-width="0.8"/>
${joints}
<rect x="${f(sc - 7)}" y="${f(sb - 80)}" width="14" height="2.4" rx="1" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.5"/>
<g transform="translate(${f(sc)} ${f(sb)}) scale(${SK}) translate(${f(-sc)} ${f(-sb)})">
<path d="${oval(sc, sb + 1, sw * 0.75, 4)}" fill="#000" fill-opacity="0.5"/>
${legs}
<path d="${rrect(sx + 3, sb - 14, sw - 6, 7, 1.5)}" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.7"/>
<path d="${belly}" fill="url(#sbelly)" stroke="${IRON_INK}" stroke-width="0.9"/>
<path d="${belly}" fill="url(#shot)"/>
<path d="M${f(sx + 4)} ${f(sb - 40)}Q${f(sx + 1.5)} ${f(sb - 30)} ${f(sx + 4)} ${f(sb - 20)}" stroke="#fff" stroke-opacity="0.35" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="${rrect(sc - 9, gy0, 18, 13, 2.5)}" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.8"/>
<path d="${rrect(sc - 7, gy0 + 2, 14, 9, 1.5)}" fill="url(#sfire)" stroke="#2A0A02" stroke-width="0.6"/>
<path d="M${f(sc - 3.5)} ${f(gy0 + 2)}V${f(gy0 + 11)}M${f(sc)} ${f(gy0 + 2)}V${f(gy0 + 11)}M${f(sc + 3.5)} ${f(gy0 + 2)}V${f(gy0 + 11)}" stroke="#2A1408" stroke-width="1.2"/>
<circle cx="${f(sc + 11)}" cy="${f(gy0 + 6.5)}" r="1.4" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.4"/>
<path d="${rrect(sx + 4, sb - 54, sw - 8, 5, 1.5)}" fill="url(#sironh)" stroke="${IRON_INK}" stroke-width="0.7"/>
${[sx + 7, sc, sx + sw - 7].map((x) => `<circle cx="${f(x)}" cy="${f(sb - 51.5)}" r="0.9" fill="#C8CCD4"/>`).join("")}
<path d="${rrect(sx + 8, sb - 60, sw - 16, 6, 1.5)}" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.7"/>
<path d="M${f(sx + 10)} ${f(sb - 59)}H${f(sc)}" stroke="#fff" stroke-opacity="0.4" stroke-width="0.7"/>
</g>`;

  // the plank table, the stove beside it
  const tx0 = T.x;
  const tx1 = T.x + T.w - 40;
  const top = T.y;
  const railY = top + 12;
  const apronH = 18;
  const legOf = (x: number, out: number) =>
    `<path d="M${f(x - 4)} ${f(railY + apronH - 1)}H${f(x + 4)}L${f(x + 4 + out)} ${f(floorY + 1)}H${f(x - 4 + out)}Z" fill="url(#sleg)" stroke="${INK}" stroke-width="0.7"/><path d="M${f(x - 2.5)} ${f(railY + apronH + 1)}L${f(x - 2.5 + out)} ${f(floorY - 1)}" stroke="#fff" stroke-opacity="0.16" stroke-width="0.7"/>`;
  const loafX = tx0 + 10;
  const tableArt = `
<path d="M${f(tx0 + 6)} ${f(floorY + 2)}H${f(tx1 - 6)}" stroke="#000" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
<rect x="${f(tx0 + 12)}" y="${f(floorY - 16)}" width="${f(tx1 - tx0 - 24)}" height="5" fill="url(#sleg)" stroke="${INK}" stroke-width="0.6"/>
${legOf(tx0 + 12, -5)}${legOf(tx1 - 12, 5)}
<path d="M${f(tx0 + 10)} ${f(top)}H${f(tx1 - 10)}L${f(tx1)} ${f(railY)}H${f(tx0)}Z" fill="url(#stop)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(tx0 + 7)} ${f(top + 4)}H${f(tx1 - 7)}M${f(tx0 + 3.5)} ${f(top + 8)}H${f(tx1 - 3.5)}" stroke="#2A1A0C" stroke-opacity="0.6" stroke-width="0.7"/>
<path d="M${f(tx0 + 14)} ${f(top + 1.4)}H${f(tx1 - 40)}" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/>
<rect x="${f(tx0 - 2)}" y="${f(railY)}" width="${f(tx1 - tx0 + 4)}" height="${apronH}" fill="url(#sapron)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(tx0)} ${f(railY + 1)}H${f(tx0 + (tx1 - tx0) * 0.5)}" stroke="#fff" stroke-opacity="0.4" stroke-width="0.8" stroke-linecap="round"/>
${[0.25, 0.6].map((k) => `<path d="M${f(tx0)} ${f(railY + apronH * k + 3)}C${f(tx0 + 60)} ${f(railY + apronH * k + 1)} ${f(tx1 - 60)} ${f(railY + apronH * k + 5)} ${f(tx1)} ${f(railY + apronH * k + 3)}" stroke="#2A1A0C" stroke-opacity="0.35" stroke-width="0.6" fill="none"/>`).join("")}
${[tx0 + 4, tx1 - 4].map((x) => `${nail(x, railY + 5)}${nail(x, railY + apronH - 5)}`).join("")}
<path d="${oval(loafX + 10, top + 4, 11, 2.5)}" fill="#000" fill-opacity="0.35"/>
<path d="M${f(loafX)} ${f(top + 4)}C${f(loafX)} ${f(top - 9)} ${f(loafX + 20)} ${f(top - 9)} ${f(loafX + 20)} ${f(top + 4)}Z" fill="url(#sloaf)" stroke="#3A1A08" stroke-width="0.7"/>
<path d="M${f(loafX + 5)} ${f(top - 2)}L${f(loafX + 8)} ${f(top - 5)}M${f(loafX + 9.5)} ${f(top - 1.5)}L${f(loafX + 12.5)} ${f(top - 4.5)}M${f(loafX + 14)} ${f(top - 1)}L${f(loafX + 17)} ${f(top - 4)}" stroke="#F4D8A0" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${f(loafX + 3)} ${f(top - 1)}Q${f(loafX + 4)} ${f(top - 5)} ${f(loafX + 8)} ${f(top - 6)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7" fill="none"/>`;

  // a braided rag rug on the boards where everyone stands
  const ry0 = floorY + 12;
  const ry1 = h - 6;
  const rcx = w / 2;
  const rcy = (ry0 + ry1) / 2;
  const rrx = w * 0.47;
  const rry = (ry1 - ry0) / 2;
  const RINGS = ["#4A2C22", "#33363C", "#5E5240", "#3A3E30", "#52342A", "#34343A", "#6A5C46"];
  const rings = RINGS.map((c, i) => {
    const k = 1 - i / RINGS.length;
    const mid = k - 0.5 / RINGS.length;
    // each round of the braid: its colour, a twist of light down its
    // middle, a dark line between rounds
    return `<path d="${oval(rcx, rcy, rrx * k, rry * k)}" fill="${c}"/><path d="${oval(rcx, rcy, rrx * mid, rry * mid)}" fill="none" stroke="${shade(c, 0.25)}" stroke-opacity="0.45" stroke-width="${f(rrx / 40)}" stroke-dasharray="5 3"/><path d="${oval(rcx, rcy, rrx * k, rry * k)}" fill="none" stroke="${shade(c, -0.6)}" stroke-width="0.8"/>`;
  }).join("");
  const rug = `<path d="${oval(rcx, rcy + 3, rrx, rry)}" fill="#000" fill-opacity="0.35"/>${rings}<path d="${oval(rcx, rcy, rrx, rry)}" fill="url(#srugv)"/>`;

  // the ceiling: the boards of the floor above; the hewn beam, strapped,
  // an iron hook under it for each lantern
  const ceiling = Array.from({ length: Math.ceil(roof / 6) }, (_, i) => `<path d="M0 ${f(i * 6 + 5)}H${w}" stroke="#0A0604" stroke-opacity="0.7" stroke-width="0.8"/>`).join("");
  const adze = Array.from({ length: Math.ceil(w / 14) }, (_, i) => {
    const x = i * 14 + rnd(i + 500) * 6;
    return `<path d="M${f(x)} ${f(beam.y + 3 + rnd(i + 600) * 4)}q4 2 8 0" stroke="#24160A" stroke-opacity="0.45" stroke-width="0.7" fill="none"/>`;
  }).join("");
  const strapN = Math.max(2, Math.round(w / 110));
  const straps = Array.from({ length: strapN }, (_, i) => {
    const x = ((i + 0.5) * w) / strapN - 4;
    return `<rect x="${f(x)}" y="${f(beam.y - 1)}" width="8" height="${f(beam.h + 2)}" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.6"/>${nail(x + 4, beam.y + 3, 1.2)}${nail(x + 4, beam.y + beam.h - 3, 1.2)}`;
  }).join("");
  const hookY = beam.y + beam.h;
  const hooks = spots
    .map((s) => {
      const x = s.lantern.x;
      return `<path d="${rrect(x - 3.5, hookY - 3, 7, 3.5, 1)}" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.5"/><path d="M${f(x)} ${f(hookY)}V${f(hookY + 3)}" stroke="#2A2E36" stroke-width="1.6" stroke-linecap="round"/>`;
    })
    .join("");

  // the slate the house rules are chalked on, hung on cords from the
  // shelf; a tin lid nailed on its right for the count
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const crimp = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    return `M${f(mx + Math.cos(a) * 18.6)} ${f(my + Math.sin(a) * 18.6)}L${f(mx + Math.cos(a) * 22)} ${f(my + Math.sin(a) * 22)}`;
  }).join("");
  const smudges = [0.2, 0.45, 0.68]
    .map((k, i) => `<path d="M${f(B.x + 10 + (B.w - 70) * k)} ${f(B.y + B.h - 10 - i * 4)}q${f(14 + i * 6)} ${f(-8 - i * 2)} ${f(30 + i * 8)} -2" stroke="#E8EEF2" stroke-opacity="${0.06 + i * 0.02}" stroke-width="${5 - i}" fill="none" stroke-linecap="round"/>`)
    .join("");
  const bracket = (x: number, y: number, sx: number, sy: number) =>
    `<path d="M${f(x)} ${f(y)}h${f(sx * 11)}v${f(sy * 3.6)}h${f(-sx * 7.4)}v${f(sy * 7.4)}h${f(-sx * 3.6)}Z" fill="url(#siron)" stroke="${IRON_INK}" stroke-width="0.6"/>${nail(x + sx * 1.9, y + sy * 1.9, 0.9)}`;
  const boardArt = `
<path d="M${f(B.x + 30)} ${f(shelfY + 5)}L${f(B.x + 36)} ${f(B.y + 1)}M${f(B.x + B.w - 70)} ${f(shelfY + 5)}L${f(B.x + B.w - 76)} ${f(B.y + 1)}" stroke="#7A6040" stroke-width="1.3"/>
<path d="${rrect(B.x + 1.5, B.y + 3.5, B.w, B.h, 3)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(B.x, B.y, B.w, B.h, 3)}" fill="url(#spine)" stroke="${INK}" stroke-width="1.1"/>
<path d="M${f(B.x + 2)} ${f(B.y + 1.3)}H${f(B.x + B.w * 0.5)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8" stroke-linecap="round"/>
<path d="${rrect(B.x + 5.5, B.y + 5.5, B.w - 11, B.h - 11, 1.5)}" fill="url(#sslate)" stroke="#120C06" stroke-width="0.9"/>
<path d="M${f(B.x + 7)} ${f(B.y + 7)}H${f(B.x + B.w - 7)}" stroke="#000" stroke-opacity="0.35" stroke-width="1.4"/>
${smudges}
<path d="${rrect(B.x + 14, B.y + B.h - 4.4, 9, 2.6, 1.2)}" fill="#F4F4EE" stroke="#8A8A80" stroke-width="0.3"/>
${bracket(B.x, B.y, 1, 1)}${bracket(B.x + B.w, B.y, -1, 1)}${bracket(B.x, B.y + B.h, 1, -1)}${bracket(B.x + B.w, B.y + B.h, -1, -1)}
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="23" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="23" fill="url(#slid)" stroke="${IRON_INK}" stroke-width="1"/>
<path d="${crimp}" stroke="#5A646E" stroke-width="0.8"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="18.4" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="17.4" fill="url(#sivory)" stroke="#4A5462" stroke-width="0.8"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>
${nail(mx, my - 20.4, 1.2)}`;

  return svg(
    w,
    h,
    `<defs>
${linear("stin", TIN, false)}
${linear("stinv", TIN)}
${linear("sbtl", ["#5A9A6A", "#1E4A2E", "#0C2416"], false)}
${linear("ssack", ["#E0C090", "#B8905A", "#7A5A30"], false)}
${linear("sbat", ["#5A4634", "#3A2A1C"])}
${linear("sstone", ["#9A948A", "#746E66", "#4E4A46"])}
${linear("spine", PINE)}
${linear("ssky", ["#0E1830", "#24406A", "#4A6A9A"])}
${linear("ssnow", SNOW)}
${linear("sfog", ["#DCEBFA", "#DCEBFA"], true, [0.02, 0.16])}
${linear("siron", IRON)}
${linear("sironh", IRON, false)}
${radial("sbelly", ["#7A7C84", "#3A3C42", "#16171B"], undefined, 0.32, 0.3, 0.8)}
${radial("shot", ["#FF7A2A", "#FF7A2A"], [0.42, 0], 0.5, 0.75, 0.55)}
${radial("sfire", FLAME, undefined, 0.5, 0.65, 0.7)}
${linear("sleg", ["#5A422C", "#3A2A1A"], false)}
${lit("stop", ["#A8845C", "#7A5A3A", "#5A422A"], 0, T.y, 0, T.y + 12)}
${lit("sapron", ["#8A6A48", "#6A4E32", "#4A3420"], 0, T.y + 12, 0, T.y + 30)}
${radial("sloaf", ["#F0C070", "#C07830", "#7A3A10"], undefined, 0.4, 0.3, 0.8)}
${radial("srugv", ["#000000", "#000000"], [0.05, 0.55], 0.5, 0.3, 0.75)}
${linear("sslate", ["#4A545E", "#333B44", "#22282E"])}
${radial("slid", ["#FFFFFF", "#C9D0DA", "#7A8494"], undefined, 0.35, 0.3, 0.8)}
${linear("sivory", MATERIALS.ivory)}
${linear("sbeam", ["#7A5C40", "#5A4230", "#3A2A1C"])}
<radialGradient id="scold" gradientUnits="userSpaceOnUse" cx="${f(wx + ww / 2)}" cy="${f(wy + wh / 2)}" r="${f(w * 0.42)}"><stop offset="0" stop-color="#9CC8FF" stop-opacity="0.24"/><stop offset="1" stop-color="#9CC8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="swarm" gradientUnits="userSpaceOnUse" cx="${f(sc)}" cy="${f(sb - (sb - gy0 - 6) * SK)}" r="${f(w * 0.5)}"><stop offset="0" stop-color="#FF8A3A" stop-opacity="0.62"/><stop offset="0.35" stop-color="#FF8A3A" stop-opacity="0.16"/><stop offset="1" stop-color="#FF8A3A" stop-opacity="0"/></radialGradient>
${radial("sshade", ["#000000", "#000000"], [0, 0.6], 0.5, 0.15, 1)}
</defs>
${planks.join("")}
${batten(wallTop + 4)}${batten(midBatten)}
${stones.join("")}
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#sshade)"/>
${windowArt}
${boardsArt(w, floorY, h, "#3E342A")}
<rect y="${f(wallTop)}" width="${w}" height="${f(h - wallTop)}" fill="url(#scold)"/>
${rug}
${doorArt(R, floor, floors)}
${shelfArt}
${stoveArt}
<rect y="${f(wallTop)}" width="${w}" height="${f(h - wallTop)}" fill="url(#swarm)"/>
${tableArt}
<rect width="${w}" height="${roof}" fill="#2A221C"/>
${ceiling}
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<rect y="${f(roof)}" width="${w}" height="${f(beam.y - roof)}" fill="#1A120C"/>
<path d="M0 ${beam.y}H${w}V${beam.y + beam.h}H0Z" fill="url(#sbeam)" stroke="${INK}" stroke-width="0.9"/>
<path d="M0 ${beam.y + 1.6}H${w}" stroke="#fff" stroke-opacity="0.22" stroke-width="0.8"/>
${adze}
${straps}
${hooks}
${boardArt}`,
  );
}

// ------------------------------------------------------------ the lamps

const LAMP_W = 30;
const LAMP_H = 62;

/** A hurricane lantern on its bail: a tin cap and fount, wire guards
 *  round the glass; lit, the globe glows round its flame. */
function lanternArt(on: boolean) {
  const c = LAMP_W / 2;
  const glass = on ? ["#FFF8D8", "#FFC85A", "#E8822A", "#8A3A10"] : ["#6A625A", "#3E3832", "#1E1A16"];
  const globe = `M${c - 6} 23C${c - 13} 27 ${c - 13} 42 ${c - 7} 47H${c + 7}C${c + 13} 42 ${c + 13} 27 ${c + 6} 23Z`;
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${radial("lg", glass, undefined, 0.5, 0.6, 0.7)}${linear("lt", TIN, false)}${linear("ltv", TIN)}${radial("lf", FLAME, undefined, 0.5, 0.7, 0.6)}</defs>
<circle cx="${c}" cy="3.4" r="2.4" fill="none" stroke="#2A2E36" stroke-width="1.2"/>
<path d="M${c - 11} 22Q${c - 11} 6 ${c} 5.6Q${c + 11} 6 ${c + 11} 22" fill="none" stroke="#2A2E36" stroke-width="1.1"/>
<path d="${globe}" fill="url(#lg)" stroke="#1A1410" stroke-width="0.8"/>
${on ? `<path d="M${c} 30C${c + 3} 34 ${c + 3} 39 ${c} 40C${c - 3} 39 ${c - 3} 34 ${c} 30Z" fill="url(#lf)" stroke="#8A2A08" stroke-width="0.4"/>` : ""}
<path d="M${c - 1.2} 40H${c + 1.2}V43H${c - 1.2}Z" fill="#2A2420"/>
<path d="M${c - 8} 27Q${c - 10.5} 34 ${c - 8} 42" stroke="#fff" stroke-opacity="${on ? 0.7 : 0.45}" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="M${c - 9} 21C${c - 15} 30 ${c - 15} 40 ${c - 9} 48M${c + 9} 21C${c + 15} 30 ${c + 15} 40 ${c + 9} 48" fill="none" stroke="#2A2E36" stroke-width="1.1"/>
<path d="${rrect(c - 8, 13, 16, 4, 1.2)}" fill="url(#ltv)" stroke="${IRON_INK}" stroke-width="0.6"/>
<path d="M${c - 9.5} 17H${c + 9.5}L${c + 7} 23H${c - 7}Z" fill="url(#lt)" stroke="${IRON_INK}" stroke-width="0.7"/>
<path d="M${c - 6} 18.5L${c - 4.5} 22" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7"/>
<path d="M${c - 11} 47H${c + 11}L${c + 12} 56Q${c + 12} 58 ${c + 10} 58H${c - 10}Q${c - 12} 58 ${c - 12} 56Z" fill="url(#lt)" stroke="${IRON_INK}" stroke-width="0.8"/>
<path d="M${c - 11.5} 51.5H${c + 11.5}" stroke="#4A5462" stroke-width="0.6"/>
<path d="M${c - 9} 48.5V56.5" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/>
<circle cx="${c + 12.6}" cy="50" r="1.6" fill="url(#ltv)" stroke="${IRON_INK}" stroke-width="0.5"/>`,
  );
}

// ------------------------------------------------------------ the piece

const CAN_W = 22;
const CAN_H = 28;

/** A player's tin can on the table: tin, a red-and-cream label. */
function canArt() {
  const W = CAN_W;
  return svg(
    W,
    CAN_H,
    `<defs>${linear("stin", TIN, false)}${linear("stinv", TIN)}</defs>
<path d="${oval(W / 2, CAN_H - 2, W / 2 - 0.5, 2)}" fill="#000" fill-opacity="0.35"/>
${tin(1.5, CAN_H - 1.5, W - 3, CAN_H - 4, "#D8502A")}`,
  );
}

export const ROOM: RoomLook = {
  light: "#FFB25A",
  art: storeroom,
  lamp: { lit: () => lanternArt(true), out: () => lanternArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: canArt, w: CAN_W, h: CAN_H },
  board: { title: "#BFD8EE", text: "#F6F2EA" },
  popup: { enamel: ["#5A7AA8", "#2E4A72", "#14243C"], jewel: "amber", glow: "#FFB25A" },
};

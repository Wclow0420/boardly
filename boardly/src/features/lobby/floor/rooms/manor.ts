// Midnight Manor's room on its floor of the lift (../rooms.ts has
// Hustle's den, the model): the old man's drawing room on a night of
// storm. Plum damask paper under an ivory plaster cornice and a gilt
// picture rail with egg-and-dart, mahogany wainscot with raised panels; a
// round-headed window of rain-streaked glass, lightning splitting the
// sky behind it, between wine velvet drapes on gold tiebacks under a
// fringed pelmet; the old man's portrait in an oval gilt frame; the house
// rules on a brass-framed placard screwed to the wall, the count on a
// clock face; a mahogany sideboard with a marble top, the silver
// teapot, the security monitor showing a camera's grainy room, and a
// teacup on its saucer for each player; a chevron parquet floor. The
// lamps are brass pendants with fringed silk shades. As SVG markup, baked
// once (RoomScene).

import { toSvgBody } from "@/components/engraved/emblem";
import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { OWNER_EMBLEM } from "@/games/manor/emblems";
import { doorArt, lit, svg } from "../art";
import type { RoomLayout } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const SILVER_INK = INKS.silver.ink;

const PAPER = ["#5A2A4E", "#3E1A36", "#260E22"];
const MAHOGANY = ["#7A3422", "#521E14", "#2E0E08"];
const VELVET = ["#9A2A44", "#6A1428", "#3A0612"];
const STORM = ["#2A2450", "#1A1636", "#0C0A1C"];

/** An oval as a path (an <ellipse> loses its gradient in Skia). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx)} ${f(cy)}Z`;

/** A slotted brass screw head (needs "msv"). */
const screw = (x: number, y: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a) * r * 0.7;
  const dy = Math.sin(a) * r * 0.7;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#msv)" stroke="${INK}" stroke-width="0.6"/><path d="M${f(x - dx)} ${f(y - dy)}L${f(x + dx)} ${f(y + dy)}" stroke="${INK}" stroke-width="0.9"/>`;
};

/** The x in lo..hi furthest from every lamp, so a picture there isn't
 *  hidden behind one. */
function clearest(R: RoomLayout, lo: number, hi: number) {
  let best = (lo + hi) / 2;
  let room = -1;
  for (let x = lo; x <= hi; x += 1) {
    const d = Math.min(...R.spots.map((s) => Math.abs(s.lantern.x - x)));
    if (d > room) {
      room = d;
      best = x;
    }
  }
  return best;
}

/** A round-headed window, x..x+w, y..y+h: the stormy sky with
 *  lightning and its glow, a roofline far off, rain down the glass, the
 *  sashes and glazing bars in white-painted wood. */
function windowArt(x: number, y: number, w: number, h: number) {
  const r = w / 2;
  const shape = `M${f(x)} ${f(y + h)}V${f(y + r * 0.62)}A${f(r)} ${f(r * 0.62)} 0 0 1 ${f(x + w)} ${f(y + r * 0.62)}V${f(y + h)}Z`;
  const t = 4;
  const ix = x + t;
  const iy = y + t;
  const iw = w - 2 * t;
  const ih = h - 2 * t;
  const ir = iw / 2;
  const inner = `M${f(ix)} ${f(iy + ih)}V${f(iy + ir * 0.62)}A${f(ir)} ${f(ir * 0.62)} 0 0 1 ${f(ix + iw)} ${f(iy + ir * 0.62)}V${f(iy + ih)}Z`;
  // lightning: a forked bolt from the cloud
  const bx = ix + iw * 0.66;
  const bolt = `M${f(bx)} ${f(iy + 2)}L${f(bx - 7)} ${f(iy + ih * 0.34)}L${f(bx - 1.5)} ${f(iy + ih * 0.36)}L${f(bx - 10)} ${f(iy + ih * 0.74)}L${f(bx + 0.5)} ${f(iy + ih * 0.3)}L${f(bx - 4.5)} ${f(iy + ih * 0.28)}L${f(bx + 3)} ${f(iy + 2)}Z`;
  const fork = `M${f(bx - 3.5)} ${f(iy + ih * 0.33)}L${f(bx + 6)} ${f(iy + ih * 0.5)}`;
  const rain: string[] = [];
  for (let k = 0; k < 34; k++) {
    const rx = ix + ((k * 37) % 100) / 100 * iw;
    const ry = iy + ((k * 53) % 100) / 100 * ih;
    const len = 5 + ((k * 7) % 5);
    rain.push(`M${f(rx)} ${f(ry)}l${f(-len * 0.28)} ${f(len)}`);
  }
  // a roofline and a bare tree against the glow
  const sil = `M${f(ix)} ${f(iy + ih)}V${f(iy + ih * 0.8)}H${f(ix + iw * 0.12)}V${f(iy + ih * 0.7)}L${f(ix + iw * 0.2)} ${f(iy + ih * 0.62)}L${f(ix + iw * 0.28)} ${f(iy + ih * 0.7)}V${f(iy + ih * 0.78)}H${f(ix + iw * 0.42)}V${f(iy + ih * 0.84)}H${f(ix + iw * 0.7)}V${f(iy + ih * 0.76)}H${f(ix + iw * 0.74)}V${f(iy + ih * 0.66)}H${f(ix + iw * 0.77)}V${f(iy + ih * 0.76)}H${f(ix + iw)}V${f(iy + ih)}Z`;
  const tree = `M${f(ix + iw * 0.88)} ${f(iy + ih)}V${f(iy + ih * 0.55)}M${f(ix + iw * 0.88)} ${f(iy + ih * 0.7)}L${f(ix + iw * 0.8)} ${f(iy + ih * 0.52)}M${f(ix + iw * 0.88)} ${f(iy + ih * 0.62)}L${f(ix + iw * 0.97)} ${f(iy + ih * 0.46)}M${f(ix + iw * 0.84)} ${f(iy + ih * 0.6)}L${f(ix + iw * 0.83)} ${f(iy + ih * 0.48)}`;
  // the glazing bars: two uprights, a meeting rail, a fan in the head
  const bars: string[] = [];
  [1, 2].forEach((k) => bars.push(`M${f(ix + (iw * k) / 3)} ${f(iy + ir * 0.62)}V${f(iy + ih)}`));
  const rail = iy + ih * 0.58;
  bars.push(`M${f(ix)} ${f(rail)}H${f(ix + iw)}M${f(ix)} ${f(iy + ir * 0.62)}H${f(ix + iw)}`);
  [-0.6, -0.2, 0.2, 0.6].forEach((k) => {
    const a = Math.PI * (1.5 + k * 0.5);
    bars.push(`M${f(ix + ir)} ${f(iy + ir * 0.62)}L${f(ix + ir + Math.cos(a) * ir)} ${f(iy + ir * 0.62 + Math.sin(a) * ir * 0.62)}`);
  });
  return `<defs><clipPath id="mwc"><path d="${inner}"/></clipPath></defs>
<path d="${shape}" fill="#000" fill-opacity="0.45" transform="translate(1.5 2.5)"/>
<path d="${shape}" fill="url(#mframe)" stroke="${INK}" stroke-width="1"/>
<path d="${inner}" fill="url(#mstorm)"/>
<g clip-path="url(#mwc)">
<circle cx="${f(bx - 2)}" cy="${f(iy + ih * 0.3)}" r="${f(iw * 0.55)}" fill="url(#mflash)"/>
<path d="M${f(ix - 6)} ${f(iy + 8)}q${f(iw * 0.2)} -10 ${f(iw * 0.4)} -2q${f(iw * 0.2)} -9 ${f(iw * 0.45)} 0q${f(iw * 0.2)} -6 ${f(iw * 0.3)} 4V${f(iy - 4)}H${f(ix - 6)}Z" fill="#0C0A1C" fill-opacity="0.6"/>
<path d="${bolt}" fill="none" stroke="#B8A8FF" stroke-opacity="0.5" stroke-width="4" stroke-linejoin="round"/>
<path d="${fork}" stroke="#B8A8FF" stroke-opacity="0.5" stroke-width="3.4" stroke-linecap="round"/>
<path d="${bolt}" fill="#FFFBE8" stroke="#E8E0FF" stroke-width="0.8" stroke-linejoin="round"/>
<path d="${fork}" stroke="#FFFBE8" stroke-width="1.3" stroke-linecap="round"/>
<path d="${sil}" fill="#0A0814"/>
<path d="${tree}" stroke="#0A0814" stroke-width="1.6" stroke-linecap="round"/>
<path d="${rain.join("")}" stroke="#D8D0FF" stroke-opacity="0.4" stroke-width="0.7" stroke-linecap="round"/>
<path d="M${f(ix + 3)} ${f(iy + ih - 2)}V${f(iy + ir * 0.62)}Q${f(ix + 4)} ${f(iy + ir * 0.12)} ${f(ix + ir * 0.6)} ${f(iy + 2)}" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="1"/>
</g>
<path d="${bars.join("")}" stroke="#1A0E14" stroke-width="3"/>
<path d="${bars.join("")}" stroke="url(#msash)" stroke-width="1.8"/>
<path d="${inner}" fill="none" stroke="#1A0E14" stroke-width="1.1"/>
<path d="M${f(x - 5)} ${f(y + h)}h${f(w + 10)}v4.5h${f(-(w + 10))}Z" fill="url(#mmarble)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(x - 4)} ${f(y + h + 1)}H${f(x + w * 0.5)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7"/>`;
}

/** A velvet drape falling from the pelmet to `bottom`, gathered at a
 *  gold tieback; `side` -1 hangs on the left of the window, 1 on the
 *  right (its inner edge at `edge`). */
function drape(edge: number, top: number, bottom: number, side: number, id: string) {
  const outW = 22;
  const xOut = edge + side * outW;
  const xIn = edge - side * 5;
  const tie = top + (bottom - top) * 0.6;
  const tieIn = edge + side * outW * 0.45;
  const d = `M${f(xOut)} ${f(top)}H${f(xIn)}C${f(xIn)} ${f(top + (tie - top) * 0.45)} ${f(tieIn - side * 4)} ${f(tie - 8)} ${f(tieIn)} ${f(tie)}C${f(tieIn - side * 3)} ${f(tie + 8)} ${f(edge - side * 1)} ${f(bottom - 8)} ${f(edge - side * 3)} ${f(bottom)}H${f(xOut + side * 2)}C${f(xOut + side * 1)} ${f(bottom - 10)} ${f(xOut - side * 1)} ${f(tie + 6)} ${f(xOut)} ${f(tie)}C${f(xOut + side * 1)} ${f(tie - 10)} ${f(xOut)} ${f(top + 10)} ${f(xOut)} ${f(top)}Z`;
  const folds = [0.3, 0.62]
    .map((k) => {
      const a = xOut + (xIn - xOut) * k;
      const b = xOut + (tieIn - xOut) * k;
      const c = xOut + side * 2 + (edge - side * 3 - xOut - side * 2) * k;
      return `M${f(a)} ${f(top + 2)}Q${f(a + (b - a) * 0.4)} ${f(tie - 6)} ${f(b)} ${f(tie)}Q${f(b + (c - b) * 0.3)} ${f(tie + 10)} ${f(c)} ${f(bottom - 1)}`;
    })
    .join("");
  return `<path d="${d}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>
<path d="${d}" fill="url(#${id})" stroke="#2A0410" stroke-width="0.9"/>
<path d="${folds}" fill="none" stroke="#2A0410" stroke-opacity="0.7" stroke-width="1"/>
<path d="${folds}" fill="none" stroke="#FF9AB0" stroke-opacity="0.22" stroke-width="0.7" transform="translate(${-side * 1.4} 0)"/>
<path d="M${f(tieIn + side * 1)} ${f(tie - 1)}Q${f((tieIn + xOut) / 2)} ${f(tie + 4)} ${f(xOut - side * 1)} ${f(tie - 1)}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
<path d="M${f(tieIn + side * 1)} ${f(tie - 1)}Q${f((tieIn + xOut) / 2)} ${f(tie + 4)} ${f(xOut - side * 1)} ${f(tie - 1)}" fill="none" stroke="url(#mgv)" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="${f(xOut - side * 1)}" cy="${f(tie - 1)}" r="2.6" fill="url(#mgd)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(xOut - side * 1 - 2)} ${f(tie + 1)}h4l1 7h-6Z" fill="url(#mgv)" stroke="${INK}" stroke-width="0.5"/>`;
}

function drawingRoom(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, board: B, table: T, door: D } = R;

  // the damask: an ogee lattice of gold, a flower in each cell
  const damask: string[] = [];
  const cw = 28;
  const ch = 34;
  for (let r = 0, y = wallTop - 6; y < floorY; r++, y += ch / 2) {
    for (let x = (r % 2) * (cw / 2) - cw; x < w + cw; x += cw) {
      const cx = x + cw / 2;
      damask.push(`M${f(cx)} ${f(y)}C${f(cx + 6)} ${f(y + 4)} ${f(cx + 8)} ${f(y + 9)} ${f(cx + 3)} ${f(y + 13)}C${f(cx + 1)} ${f(y + 15)} ${f(cx)} ${f(y + 16)} ${f(cx)} ${f(y + 17)}C${f(cx)} ${f(y + 16)} ${f(cx - 1)} ${f(y + 15)} ${f(cx - 3)} ${f(y + 13)}C${f(cx - 8)} ${f(y + 9)} ${f(cx - 6)} ${f(y + 4)} ${f(cx)} ${f(y)}Z`);
      damask.push(`M${f(cx - 2)} ${f(y + 7)}Q${f(cx)} ${f(y + 3)} ${f(cx + 2)} ${f(y + 7)}Q${f(cx)} ${f(y + 11)} ${f(cx - 2)} ${f(y + 7)}Z`);
    }
  }

  // the cornice: ivory plaster, a cove and a row of dentils
  const dentils: string[] = [];
  for (let x = 1; x < w; x += 7) dentils.push(`M${f(x)} ${f(roof - 7)}h4v5h-4Z`);
  // egg-and-dart along the gilt picture rail
  const eggs: string[] = [];
  const darts: string[] = [];
  for (let x = 4; x < w; x += 10) {
    eggs.push(oval(x + 3, beam.y + beam.h / 2 + 0.5, 3.2, 4));
    darts.push(`M${f(x + 8)} ${f(beam.y + 2.5)}L${f(x + 9)} ${f(beam.y + beam.h / 2)}L${f(x + 8)} ${f(beam.y + beam.h - 2)}L${f(x + 7)} ${f(beam.y + beam.h / 2)}Z`);
  }

  // the window over the board, between its drapes, under the pelmet
  const winX = B.x + 30;
  const winW = Math.min(150, B.w - 120);
  const winTop = wallTop + 10;
  const winH = B.y - 10 - winTop;
  const pelmet = (() => {
    const x0 = winX - 30;
    const x1 = winX + winW + 30;
    const y0 = wallTop + 2;
    const y1 = y0 + 10;
    const swags: string[] = [];
    const n = 4;
    const sw = (x1 - x0) / n;
    for (let k = 0; k < n; k++) swags.push(`Q${f(x0 + sw * (k + 0.5))} ${f(y1 + 9)} ${f(x0 + sw * (k + 1))} ${f(y1)}`);
    const tassels = Array.from({ length: n + 1 }, (_, k) => {
      const tx = x0 + sw * k;
      return `<path d="M${f(tx)} ${f(y1)}V${f(y1 + 4)}" stroke="url(#mgv)" stroke-width="1"/><path d="M${f(tx - 2)} ${f(y1 + 4)}h4l1.2 7h-6.4Z" fill="url(#mgv)" stroke="${INK}" stroke-width="0.5"/><circle cx="${f(tx)}" cy="${f(y1 + 4)}" r="1.8" fill="url(#mgd)" stroke="${INK}" stroke-width="0.5"/>`;
    }).join("");
    const swagPath = `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}${swags
      .map((_, k) => {
        const kk = n - 1 - k;
        return `Q${f(x0 + sw * (kk + 0.5))} ${f(y1 + 9)} ${f(x0 + sw * kk)} ${f(y1)}`;
      })
      .join("")}Z`;
    return `<path d="${swagPath}" fill="#000" fill-opacity="0.4" transform="translate(1 2)"/>
<path d="${swagPath}" fill="url(#mvelp)" stroke="#2A0410" stroke-width="0.9"/>
<path d="M${f(x0)} ${f(y1)}${swags.join("")}" fill="none" stroke="url(#mgs)" stroke-width="1.6"/>
<rect x="${f(x0 - 3)}" y="${f(y0 - 2)}" width="${f(x1 - x0 + 6)}" height="4" rx="1.5" fill="url(#mgv)" stroke="${INK}" stroke-width="0.7"/>
${tassels}`;
  })();
  const glow = `<circle cx="${f(winX + winW * 0.6)}" cy="${f(winTop + winH * 0.4)}" r="${f(winW * 0.95)}" fill="url(#mstormglow)"/>`;

  // the old man's portrait in an oval gilt frame, clear of the lamps
  const pcx = clearest(R, D.x + 34, B.x + 6);
  const pry = Math.min(30, (D.y - 22 - wallTop - 8) / 2);
  const prx = pry * 0.8;
  const pcy = wallTop + 6 + pry;
  const ps = pry * 1.9;
  const beadsP = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    return `<circle cx="${f(pcx + Math.cos(a) * (prx - 2.6))}" cy="${f(pcy + Math.sin(a) * (pry - 2.6))}" r="1.1" fill="url(#mgd)" stroke="${INK}" stroke-width="0.3"/>`;
  }).join("");
  const portrait = `
<path d="M${f(pcx)} ${f(pcy - pry - 9)}L${f(pcx - prx * 0.55)} ${f(pcy - pry * 0.7)}M${f(pcx)} ${f(pcy - pry - 9)}L${f(pcx + prx * 0.55)} ${f(pcy - pry * 0.7)}" stroke="#1A0E06" stroke-width="0.9"/>
<path d="${oval(pcx + 1.2, pcy + 2.4, prx + 1, pry + 1)}" fill="#000" fill-opacity="0.45"/>
<path d="${oval(pcx, pcy, prx, pry)}" fill="url(#mgv)" stroke="${INK}" stroke-width="1"/>
${beadsP}
<path d="${oval(pcx, pcy, prx - 5, pry - 5)}" fill="url(#mcanvas)" stroke="${INK}" stroke-width="0.8"/>
<defs><clipPath id="mpc"><path d="${oval(pcx, pcy, prx - 5, pry - 5)}"/></clipPath></defs>
<g clip-path="url(#mpc)"><g transform="translate(${f(pcx - ps / 2)} ${f(pcy - ps * 0.42)}) scale(${f(ps / 48)})">${toSvgBody(OWNER_EMBLEM, undefined, "mown")}</g></g>
<path d="${oval(pcx, pcy, prx - 5, pry - 5)}" fill="url(#mvarnish)"/>
<path d="M${f(pcx - prx + 2)} ${f(pcy - pry * 0.3)}A${f(prx - 1.5)} ${f(pry - 1.5)} 0 0 1 ${f(pcx - prx * 0.3)} ${f(pcy - pry + 2)}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
<path d="M${f(pcx - 5)} ${f(pcy - pry - 2)}Q${f(pcx)} ${f(pcy - pry - 10)} ${f(pcx + 5)} ${f(pcy - pry - 2)}Z" fill="url(#mgv)" stroke="${INK}" stroke-width="0.7"/>
<circle cx="${f(pcx)}" cy="${f(pcy - pry - 4)}" r="1.6" fill="url(#mrub)" stroke="${INK}" stroke-width="0.4"/>
<path d="${rrect(pcx - 8, pcy + pry - 4, 16, 6, 1.5)}" fill="url(#mgv)" stroke="${INK}" stroke-width="0.6"/>`;

  // the wainscot: a chair rail, mahogany raised panels
  const panelTop = B.y + B.h + 12;
  const panels: string[] = [];
  const pw = 40;
  for (let x = 4; x + pw - 6 < w; x += pw) {
    const py = panelTop + 7;
    const ph = floorY - 12 - py;
    panels.push(
      `<path d="${rrect(x + 3, py, pw - 6, ph, 1)}" fill="url(#mpanel)" stroke="#1A0604" stroke-width="0.8"/><path d="${rrect(x + 7, py + 4, pw - 14, ph - 8, 1)}" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.7"/><path d="M${f(x + 7.5)} ${f(py + 4.6)}H${f(x + pw - 8)}" stroke="#F0B090" stroke-opacity="0.3" stroke-width="0.6"/>`,
    );
  }

  // the chevron parquet, towards you
  const g = (v: number) => v ** 1.25;
  const P = (u: number, v: number) => {
    const vv = g(Math.max(0, Math.min(1, v)));
    const xt = w * 0.15 + u * w * 0.7;
    const xb = -w * 0.35 + u * w * 1.7;
    return `${f(xt + (xb - xt) * vv)} ${f(floorY + (h - floorY) * vv)}`;
  };
  const light: string[] = [];
  const dark: string[] = [];
  const cu = 0.055;
  const pitch = 0.05;
  for (let c = 0, u0 = -0.4; u0 < 1.4; c++, u0 += cu) {
    const u1 = u0 + cu;
    for (let j = -2, a = -0.12; a < 1; j++, a += pitch) {
      const rise = cu * 0.9;
      const [l0, r0] = c % 2 ? [a + rise, a] : [a, a + rise];
      const d = `M${P(u0, l0)}L${P(u1, r0)}L${P(u1, r0 + pitch)}L${P(u0, l0 + pitch)}Z`;
      ((j + c) % 2 ? light : dark).push(d);
    }
  }

  // the brass-framed placard screwed to the wall, a gilt shell on top
  // with a ruby, the count on a clock face
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const hook = { x: B.x + (B.w - 50) / 2 };
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 ? 15.2 : 13.8;
    return `M${f(mx + Math.cos(a) * r0)} ${f(my + Math.sin(a) * r0)}L${f(mx + Math.cos(a) * 16.6)} ${f(my + Math.sin(a) * 16.6)}`;
  }).join("");
  const boardArt = `
<path d="${rrect(B.x + 1.5, B.y + 3.5, B.w, B.h, 6)}" fill="#000" fill-opacity="0.5"/>
${moulding(B.x, B.y, B.w, B.h, 6, 5, "mbm")}
<path d="${rrect(B.x + 5, B.y + 5, B.w - 10, B.h - 10, 3)}" fill="url(#mface)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rrect(B.x + 8, B.y + 8, B.w - 16, B.h - 16, 2)}" fill="none" stroke="#F5B544" stroke-opacity="0.35" stroke-width="0.6"/>
<path d="M${f(B.x + 9)} ${f(B.y + 7.5)}H${f(B.x + B.w * 0.4)}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="0.9" stroke-linecap="round"/>
${screw(B.x + 9, B.y + 9, 2.4, 30)}${screw(B.x + 9, B.y + B.h - 9, 2.4, -20)}${screw(B.x + B.w - 60, B.y + 9, 2.4, 60)}${screw(B.x + B.w - 60, B.y + B.h - 9, 2.4, 10)}
<path d="M${f(hook.x - 12)} ${f(B.y + 1)}Q${f(hook.x)} ${f(B.y - 13)} ${f(hook.x + 12)} ${f(B.y + 1)}Z" fill="url(#mgv)" stroke="${INK}" stroke-width="0.9"/>
${[-0.6, -0.2, 0.2, 0.6].map((k) => `<path d="M${f(hook.x)} ${f(B.y)}L${f(hook.x + k * 13)} ${f(B.y - 8 + Math.abs(k) * 6)}" stroke="${VEIN}" stroke-width="0.6"/>`).join("")}
<circle cx="${f(hook.x)}" cy="${f(B.y - 1)}" r="2.6" fill="url(#mrub)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${f(hook.x - 0.8)}" cy="${f(B.y - 1.9)}" r="0.7" fill="#fff" fill-opacity="0.9"/>
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="24" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="24" fill="url(#mgd)" stroke="${INK}" stroke-width="1.1"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="21" fill="none" stroke="${VEIN}" stroke-width="0.8"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="17.4" fill="url(#mivory)" stroke="${INK}" stroke-width="0.9"/>
<path d="${ticks}" stroke="#3A2408" stroke-width="1" stroke-linecap="round"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<circle cx="${f(mx)}" cy="${f(my - 25.5)}" r="2.8" fill="url(#mgd)" stroke="${INK}" stroke-width="0.6"/>`;

  // the sideboard: a marble top, a moulded edge, three drawers with
  // brass pulls, cupboard doors, short cabriole feet; the teapot and
  // the security monitor on it
  const top = T.y;
  const edgeY = top + 11;
  const bodyY = edgeY + 5;
  const bodyX0 = T.x + 3;
  const bodyX1 = T.x + T.w - 3;
  const drawerH = 13;
  const doorsY = bodyY + drawerH + 2;
  const feet = floorY - 7;
  const drawers = [0, 1, 2]
    .map((k) => {
      const dw = (bodyX1 - bodyX0 - 8) / 3;
      const dx = bodyX0 + 4 + k * dw;
      return `<path d="${rrect(dx + 1, bodyY + 2, dw - 2, drawerH - 3, 1)}" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.7"/><path d="M${f(dx + dw / 2 - 5)} ${f(bodyY + drawerH / 2 - 1)}q5 5 10 0" fill="none" stroke="url(#mgs)" stroke-width="1.4"/><circle cx="${f(dx + dw / 2 - 5)}" cy="${f(bodyY + drawerH / 2 - 1)}" r="1.3" fill="url(#mgd)" stroke="${INK}" stroke-width="0.3"/><circle cx="${f(dx + dw / 2 + 5)}" cy="${f(bodyY + drawerH / 2 - 1)}" r="1.3" fill="url(#mgd)" stroke="${INK}" stroke-width="0.3"/>`;
    })
    .join("");
  const doorN = 3;
  const doors = Array.from({ length: doorN }, (_, k) => {
    const dw = (bodyX1 - bodyX0 - 8) / doorN;
    const dx = bodyX0 + 4 + k * dw;
    const dh = feet - 3 - doorsY;
    return `<path d="${rrect(dx + 1, doorsY, dw - 2, dh, 1)}" fill="url(#mpanel)" stroke="#1A0604" stroke-width="0.7"/><path d="M${f(dx + 6)} ${f(doorsY + dh)}V${f(doorsY + 9)}Q${f(dx + 6)} ${f(doorsY + 4)} ${f(dx + dw / 2)} ${f(doorsY + 4)}Q${f(dx + dw - 6)} ${f(doorsY + 4)} ${f(dx + dw - 6)} ${f(doorsY + 9)}V${f(doorsY + dh)}" fill="none" stroke="#1A0604" stroke-width="0.8"/><circle cx="${f(k < doorN / 2 ? dx + dw - 5 : dx + 5)}" cy="${f(doorsY + dh / 2)}" r="1.5" fill="url(#mgd)" stroke="${INK}" stroke-width="0.4"/>`;
  }).join("");
  const foot = (x: number, s: number) =>
    `<path d="M${f(x)} ${f(feet - 1)}C${f(x + s * 1)} ${f(feet + 3)} ${f(x - s * 2)} ${f(floorY - 3)} ${f(x + s * 1)} ${f(floorY)}H${f(x + s * 6)}C${f(x + s * 3)} ${f(floorY - 3)} ${f(x + s * 6)} ${f(feet + 2)} ${f(x + s * 8)} ${f(feet - 1)}Z" fill="url(#mmahh)" stroke="#1A0604" stroke-width="0.8"/>`;
  // the silver teapot
  const tpx = T.x + 22;
  const tpy = edgeY + 1;
  const teapot = `
<path d="M${f(tpx - 12)} ${f(tpy - 7)}C${f(tpx - 17)} ${f(tpy - 9)} ${f(tpx - 18)} ${f(tpy - 15)} ${f(tpx - 20)} ${f(tpy - 17)}L${f(tpx - 18)} ${f(tpy - 18)}C${f(tpx - 15)} ${f(tpy - 14)} ${f(tpx - 13)} ${f(tpy - 12)} ${f(tpx - 9)} ${f(tpy - 12)}Z" fill="url(#msil)" stroke="${SILVER_INK}" stroke-width="0.7"/>
<path d="M${f(tpx + 9)} ${f(tpy - 15)}C${f(tpx + 17)} ${f(tpy - 15)} ${f(tpx + 16)} ${f(tpy - 4)} ${f(tpx + 9)} ${f(tpy - 5)}" fill="none" stroke="${SILVER_INK}" stroke-width="3"/>
<path d="M${f(tpx + 9)} ${f(tpy - 15)}C${f(tpx + 17)} ${f(tpy - 15)} ${f(tpx + 16)} ${f(tpy - 4)} ${f(tpx + 9)} ${f(tpy - 5)}" fill="none" stroke="url(#msil)" stroke-width="1.6"/>
<path d="M${f(tpx - 10)} ${f(tpy - 3)}C${f(tpx - 13)} ${f(tpy - 10)} ${f(tpx - 10)} ${f(tpy - 17)} ${f(tpx)} ${f(tpy - 17)}C${f(tpx + 10)} ${f(tpy - 17)} ${f(tpx + 13)} ${f(tpy - 10)} ${f(tpx + 10)} ${f(tpy - 3)}Z" fill="url(#msilr)" stroke="${SILVER_INK}" stroke-width="0.8"/>
<path d="M${f(tpx - 6)} ${f(tpy - 17)}Q${f(tpx)} ${f(tpy - 23)} ${f(tpx + 6)} ${f(tpy - 17)}Z" fill="url(#msil)" stroke="${SILVER_INK}" stroke-width="0.7"/>
<circle cx="${f(tpx)}" cy="${f(tpy - 22)}" r="1.8" fill="url(#mgd)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(tpx - 9)} ${f(tpy - 7)}H${f(tpx + 9)}" stroke="url(#mgs)" stroke-width="1.2"/>
<path d="M${f(tpx - 7)} ${f(tpy - 13)}Q${f(tpx - 8)} ${f(tpy - 8)} ${f(tpx - 6)} ${f(tpy - 5)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="M${f(tpx - 8)} ${f(tpy - 3)}H${f(tpx + 8)}L${f(tpx + 6)} ${f(tpy)}H${f(tpx - 6)}Z" fill="url(#msil)" stroke="${SILVER_INK}" stroke-width="0.6"/>`;
  // the security monitor: a wooden cabinet, a curved grey screen with
  // a camera's view of a room in scan lines, a red light
  const mw = 34;
  const mh = 26;
  const mox = T.x + T.w - 6 - mw;
  const moy = edgeY + 1 - mh;
  const scan = Array.from({ length: 7 }, (_, i) => `M${f(mox + 5)} ${f(moy + 5 + i * 2.4)}H${f(mox + mw - 11)}`).join("");
  const monitor = `
<path d="${rrect(mox + 1, moy + 2, mw, mh, 3)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(mox, moy, mw, mh, 3)}" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.9"/>
<path d="M${f(mox + 2)} ${f(moy + 1.4)}H${f(mox + mw * 0.6)}" stroke="#F0B090" stroke-opacity="0.45" stroke-width="0.7"/>
<path d="${rrect(mox + 3.5, moy + 3.5, mw - 13, mh - 7, 4)}" fill="#0A0E0C" stroke="#1A0604" stroke-width="0.7"/>
<path d="${rrect(mox + 4.5, moy + 4.5, mw - 15, mh - 9, 3.4)}" fill="url(#mscreen)"/>
<path d="M${f(mox + 6)} ${f(moy + mh - 6)}L${f(mox + 10)} ${f(moy + 9)}H${f(mox + mw - 14)}L${f(mox + mw - 11)} ${f(moy + mh - 6)}" fill="none" stroke="#C8E8D0" stroke-opacity="0.45" stroke-width="0.8"/>
<path d="M${f(mox + 13)} ${f(moy + mh - 6)}v-5h3v5" fill="#C8E8D0" fill-opacity="0.35"/>
<path d="${scan}" stroke="#000" stroke-opacity="0.3" stroke-width="0.6"/>
<path d="M${f(mox + 6)} ${f(moy + 6.5)}Q${f(mox + 9)} ${f(moy + 5)} ${f(mox + 13)} ${f(moy + 5.2)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8" fill="none" stroke-linecap="round"/>
<circle cx="${f(mox + mw - 5)}" cy="${f(moy + 7)}" r="1.9" fill="url(#mgd)" stroke="${INK}" stroke-width="0.4"/>
<circle cx="${f(mox + mw - 5)}" cy="${f(moy + 13)}" r="1.9" fill="url(#mgd)" stroke="${INK}" stroke-width="0.4"/>
<circle cx="${f(mox + mw - 5)}" cy="${f(moy + 19.5)}" r="1.5" fill="url(#mrub)" stroke="#3A0408" stroke-width="0.4"/>
<circle cx="${f(mox + 7.5)}" cy="${f(moy + 7.5)}" r="1" fill="#FF4A4A"/>
<path d="M${f(mox + 6)} ${f(moy + mh)}h4v2h-4ZM${f(mox + mw - 10)} ${f(moy + mh)}h4v2h-4Z" fill="#1A0604"/>`;
  const sideboard = `
<path d="M${f(T.x + 4)} ${f(floorY + 2)}H${f(T.x + T.w - 4)}" stroke="#000" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
${foot(bodyX0 + 4, 1)}${foot(bodyX1 - 4, -1)}
<rect x="${f(bodyX0)}" y="${f(bodyY)}" width="${f(bodyX1 - bodyX0)}" height="${f(feet - bodyY)}" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.9"/>
${drawers}
${doors}
<path d="M${f(bodyX0)} ${f(doorsY - 1)}H${f(bodyX1)}" stroke="url(#mgs)" stroke-width="1"/>
<rect x="${f(bodyX0 - 1)}" y="${f(feet - 4)}" width="${f(bodyX1 - bodyX0 + 2)}" height="4" fill="url(#mmahh)" stroke="#1A0604" stroke-width="0.7"/>
<path d="M${f(T.x + 8)} ${f(top)}H${f(T.x + T.w - 8)}L${f(T.x + T.w)} ${f(edgeY)}H${f(T.x)}Z" fill="url(#mmarble)" stroke="#5A5048" stroke-width="0.8"/>
<path d="M${f(T.x + 30)} ${f(top + 2)}q14 4 22 2t26 5M${f(T.x + T.w * 0.55)} ${f(top + 3)}q10 3 20 1t18 5M${f(T.x + T.w * 0.3)} ${f(top + 6)}q16 -1 26 3" fill="none" stroke="#8A8278" stroke-opacity="0.45" stroke-width="0.6"/>
<rect x="${f(T.x - 3)}" y="${f(edgeY)}" width="${f(T.w + 6)}" height="5" rx="1.5" fill="url(#mmarblev)" stroke="#5A5048" stroke-width="0.8"/>
<path d="M${f(T.x)} ${f(edgeY + 1.1)}H${f(T.x + T.w * 0.5)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.7" stroke-linecap="round"/>
${teapot}
${monitor}`;

  return svg(
    w,
    h,
    `<defs>
${lit("mpaper", PAPER, 0, wallTop, w * 0.3, floorY + 40)}
${linear("mceil", ["#2A1226", "#1A0A18"])}
${linear("mcornice", ["#F4EEDF", "#D8CCB0", "#A8987A"])}
${linear("mgv", MATERIALS.gold)}
${linear("mgs", MATERIALS.gold, false)}
${radial("mgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("msv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("mrub", ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.38, 0.32, 0.75)}
${linear("mivory", MATERIALS.ivory)}
${linear("msil", MATERIALS.silver)}
${radial("msilr", ["#FFFFFF", "#C9D0DA", "#6A7484"], undefined, 0.35, 0.3, 0.8)}
${linear("mframe", ["#F4EEDF", "#D8CCB0", "#A8987A"])}
${linear("msash", ["#F4EEDF", "#C8BCA0"])}
${linear("mstorm", STORM)}
${radial("mflash", ["#E8E0FF", "#9A88E8", "#4A3A9A"], [0.75, 0.35, 0])}
${radial("mstormglow", ["#B8A8FF", "#B8A8FF"], [0.14, 0])}
${linear("mvel", VELVET, false)}
${linear("mvelp", VELVET)}
${linear("mcanvas", ["#3A3446", "#22202E", "#141220"])}
${radial("mvarnish", ["#FFE7B0", "#000000"], [0.12, 0.35], 0.4, 0.3, 0.8)}
${linear("mpanel", ["#5A2418", "#3A140C", "#240A06"])}
${linear("mmahv", MAHOGANY)}
${linear("mmahh", MAHOGANY, false)}
${lit("mmarble", ["#FFFFFF", "#E8E2DA", "#BCB4A8"], 0, T.y, 0, T.y + 11)}
${linear("mmarblev", ["#F4F0EA", "#C8C0B4", "#9A9288"])}
${linear("mface", ["#3A1A1E", "#24100E", "#160806"])}
${radial("mscreen", ["#8AB098", "#3A5A48", "#142A1E"], undefined, 0.45, 0.4, 0.8)}
${linear("mfloor", ["#7A4A2A", "#5A341C", "#3A2010"])}
${radial("mwarm", ["#FFC870", "#FFC870"], [0.14, 0], 0.5, 0.95, 0.65)}
${radial("mshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.15, 1)}
${radial("mvig", ["#000000", "#000000"], [0, 0.6], 0.5, 0.2, 0.85)}
${linear("mwallsh", ["#000000", "#000000"], true, [0.55, 0])}
</defs>
<rect width="${w}" height="${f(floorY)}" fill="url(#mpaper)"/>
<path d="${damask.join("")}" fill="#E2B04A" fill-opacity="0.1" stroke="#E2B04A" stroke-opacity="0.12" stroke-width="0.6"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#mshade)"/>
${glow}
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#mwarm)"/>
${windowArt(winX, winTop, winW, winH)}
${drape(winX + 2, wallTop + 6, B.y - 6, -1, "mvel")}${drape(winX + winW - 2, wallTop + 6, B.y - 6, 1, "mvel")}
${pelmet}
${portrait}
<rect y="${f(panelTop)}" width="${w}" height="${f(floorY - panelTop)}" fill="url(#mmahv)"/>
${panels.join("")}
<rect x="-2" y="${f(panelTop - 3)}" width="${w + 4}" height="6" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.8"/>
<path d="M0 ${f(panelTop + 1.6)}H${w}" stroke="url(#mgs)" stroke-width="1.2"/>
<path d="M0 ${f(panelTop - 2)}H${w}" stroke="#F0B090" stroke-opacity="0.4" stroke-width="0.7"/>
<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#mfloor)"/>
<path d="${light.join("")}" fill="#C08A5A" fill-opacity="0.13"/>
<path d="${dark.join("")}" fill="#000" fill-opacity="0.1"/>
<path d="${[...light, ...dark].join("")}" fill="none" stroke="#1E0E06" stroke-opacity="0.4" stroke-width="0.6"/>
<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#mvig)"/>
<rect y="${f(floorY)}" width="${w}" height="26" fill="url(#mwallsh)"/>
<rect y="${f(floorY - 9)}" width="${w}" height="9" fill="url(#mmahv)" stroke="#1A0604" stroke-width="0.8"/>
<path d="M0 ${f(floorY - 8)}H${w}" stroke="#F0B090" stroke-opacity="0.3" stroke-width="0.7"/>
${doorArt(R, floor, floors)}
${sideboard}
<rect width="${w}" height="${roof}" fill="url(#mceil)"/>
<rect y="${f(roof - 14)}" width="${w}" height="14" fill="url(#mcornice)"/>
<path d="M0 ${f(roof - 13)}H${w}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>
<path d="M0 ${f(roof - 8)}H${w}" stroke="${INKS.ivory.vein}" stroke-width="0.8"/>
<path d="${dentils.join("")}" fill="#D8CCB0" stroke="#7A6440" stroke-width="0.6"/>
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<rect x="-2" y="${beam.y}" width="${w + 4}" height="${beam.h}" fill="url(#mgv)" stroke="${INK}" stroke-width="0.9"/>
<path d="${eggs.join("")}" fill="url(#mgd)" stroke="${INK}" stroke-width="0.6"/>
<path d="${darts.join("")}" fill="${VEIN}"/>
<path d="M0 ${beam.y + 1.2}H${w}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>
${boardArt}`,
  );
}

// ------------------------------------------------------------- the lamp

const LAMP_W = 32;
const LAMP_H = 64;

/** A brass pendant with a fringed silk shade: lit, the silk glows
 *  amber; out, it hangs dark plum. */
function pendantArt(on: boolean) {
  const c = LAMP_W / 2;
  const s0 = 22;
  const s1 = 44;
  const silk = on ? ["#FFF4D0", "#FFC870", "#D8742A"] : ["#6A3A5A", "#3E1E36", "#1E0E1A"];
  const scallop = Array.from({ length: 6 }, (_, k) => {
    const x0 = c - 15 + k * 5;
    return `Q${f(x0 + 2.5)} ${f(s1 + 3)} ${f(x0 + 5)} ${f(s1)}`;
  }).join("");
  const shapeD = `M${c - 7} ${s0}H${c + 7}L${c + 15} ${s1}H${c - 15}Z`;
  const scallopD = `M${c - 15} ${s1}${scallop}`;
  const fringe = Array.from({ length: 11 }, (_, k) => {
    const x = c - 14 + k * 2.8;
    return `M${f(x)} ${s1 + 1}v${4 + (k % 2) * 1.5}`;
  }).join("");
  const pleats = [-0.6, -0.2, 0.2, 0.6].map((k) => `M${f(c + k * 7)} ${s0 + 1}L${f(c + k * 15)} ${s1 - 1}`).join("");
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${radial("ps", silk, undefined, 0.5, 0.75, 0.8)}${linear("pb", MATERIALS.gold, false)}${radial("pd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}</defs>
<path d="M${c} 0V12" stroke="#2A1A0A" stroke-width="1.2"/>
<circle cx="${c}" cy="13" r="2.4" fill="url(#pd)" stroke="${INK}" stroke-width="0.6"/>
<path d="${rrect(c - 3, 15, 6, 5, 1.4)}" fill="url(#pb)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${c - 6} ${s0 + 0.5}H${c + 6}L${c + 4} 19H${c - 4}Z" fill="url(#pb)" stroke="${INK}" stroke-width="0.7"/>
${on ? `<path d="M${c - 15} ${s1}H${c + 15}L${c + 9} ${s1 + 8}H${c - 9}Z" fill="#FFE7A0" fill-opacity="0.5"/>` : ""}
<path d="${shapeD}" fill="url(#ps)" stroke="${on ? "#7A3A0A" : "#1A0612"}" stroke-width="0.9"/>
<path d="${scallopD}" fill="url(#ps)" stroke="${on ? "#7A3A0A" : "#1A0612"}" stroke-width="0.7"/>
<path d="${pleats}" stroke="${on ? "#C8641E" : "#140410"}" stroke-opacity="0.55" stroke-width="0.6"/>
<path d="M${c - 5} ${s0 + 2}L${c - 12} ${s1 - 2}" stroke="#fff" stroke-opacity="${on ? 0.6 : 0.25}" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${c - 7.4} ${s0 - 0.6}H${c + 7.4}" stroke="url(#pb)" stroke-width="1.8"/>
<path d="M${c - 15} ${s1}H${c + 15}" stroke="url(#pb)" stroke-width="1.6"/>
<path d="${fringe}" stroke="url(#pb)" stroke-width="0.9"/>
<path d="M${c} ${s1 + 2}V${s1 + 10}" stroke="url(#pb)" stroke-width="0.9"/>
<circle cx="${c}" cy="${s1 + 11}" r="2" fill="url(#pd)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${c - 1.8} ${s1 + 12.5}h3.6l0.9 5h-5.4Z" fill="url(#pb)" stroke="${INK}" stroke-width="0.4"/>`,
  );
}

// ------------------------------------------------------------- the piece

const CUP_W = 24;
const CUP_H = 26;
const CUP_K = 1.1;

/** A porcelain teacup on its saucer, a gold rim and a plum band, a
 *  wisp of steam. */
function cupArt() {
  const c = CUP_W / 2 - 1;
  return svg(
    CUP_W,
    CUP_H,
    `<defs>${linear("cp", MATERIALS.ivory, false)}${radial("cs", ["#FFFFFF", "#F4EEDF", "#C8BCA0"], undefined, 0.4, 0.3, 0.8)}${linear("cg", MATERIALS.gold, false)}${linear("ct", ["#7A3A1A", "#4A1E0A"])}</defs>
<path d="M${c - 2} 9q-2 -3 0 -5t0 -4M${c + 3} 9q-2 -3 0 -5t0 -3" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${c + 7.6} 13.5C${c + 12.5} 13 ${c + 12.5} 19 ${c + 6.4} 19" fill="none" stroke="${INK}" stroke-width="2.6"/>
<path d="M${c + 7.6} 13.5C${c + 12.5} 13 ${c + 12.5} 19 ${c + 6.4} 19" fill="none" stroke="url(#cp)" stroke-width="1.4"/>
<path d="M1 22.5Q${c} 20.5 ${CUP_W - 1} 22.5Q${CUP_W - 2} 25.5 ${c} 25.6Q2 25.5 1 22.5Z" fill="url(#cs)" stroke="${INK}" stroke-width="0.7"/>
<path d="M2.4 22.6Q${c} 21.4 ${c + 4} 21.6" fill="none" stroke="#fff" stroke-width="0.6"/>
<path d="M1.6 23.6Q${c} 25.8 ${CUP_W - 1.6} 23.6" fill="none" stroke="url(#cg)" stroke-width="0.8"/>
<path d="M${c - 8.5} 11.5H${c + 8.5}C${c + 8.5} 18 ${c + 5} 22.4 ${c} 22.4C${c - 5} 22.4 ${c - 8.5} 18 ${c - 8.5} 11.5Z" fill="url(#cp)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${c - 8.2} 14.4H${c + 8.2}" stroke="#6A2A5A" stroke-width="1.6"/>
<path d="M${c - 8.2} 15.4H${c + 8.2}" stroke="url(#cg)" stroke-width="0.5"/>
<path d="M${c - 8.5} 11.5Q${c} 13.4 ${c + 8.5} 11.5Q${c} 10 ${c - 8.5} 11.5Z" fill="url(#ct)" stroke="url(#cg)" stroke-width="0.9"/>
<path d="M${c - 6.6} 16.5Q${c - 6} 20 ${c - 3} 21.4" fill="none" stroke="#fff" stroke-width="0.9" stroke-linecap="round"/>`,
  );
}

export const ROOM: RoomLook = {
  light: "#FFC870",
  art: drawingRoom,
  lamp: { lit: () => pendantArt(true), out: () => pendantArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: cupArt, w: CUP_W * CUP_K, h: CUP_H * CUP_K },
  board: { title: "#F5B544", text: "#FFF2E0" },
  popup: { enamel: ["#9A5AB8", "#5A2A78", "#2A0E3A"], jewel: "emerald", glow: "#FFC870" },
};

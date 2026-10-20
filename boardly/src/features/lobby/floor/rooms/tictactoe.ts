// Tic-Tac-Toe's room on its floor of the lift: a gentlemen's games
// parlour for two, seen flat on. A plaster cornice and a gilt moulding;
// navy silk on the walls with a faint diaper of noughts and crosses over
// a walnut wainscot; a marble chimneypiece whose frieze is the board the
// house rules are written on (a malachite panel in a gilt bead, a gold
// medallion for the count), on its mantel the crest in a gilt frame, a
// bracket clock and a decanter of port; a fire in the cast-iron grate
// between tiles painted with crosses and noughts; the round card table in
// front with a silver cross and a gold nought standing on it and a glass
// of port set out for each player; a wing chair behind each of the two
// spots, the cross's in navy velvet and the nought's in crimson, an oval
// rug between them, a chequered parquet; and over each spot a little
// brass candelabrum with a crimson tassel, its two candles lit once its
// player is ready. As SVG markup, baked once (RoomScene).

import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { FIELD, markBody } from "@/games/tictactoe/art";
import { doorArt, lit, svg } from "../art";
import type { RoomLayout, Spot } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const DARK = "#140A04";

const SILK = ["#2F5D8A", "#21466C", "#16304E"];
const WALNUT = ["#7A4E2C", "#56341C", "#341E0E"];
const MARBLE = ["#FFFFFF", "#ECE6DA", "#C8BEAC"];
const MALACHITE = ["#2E9A6A", "#13704A", "#06402A"];
const IRON = ["#3A3E46", "#22252A", "#121418"];

/** An oval as a path (Skia's SVG reader drops gradients on <ellipse>). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** A little seeded random, so the room is the same every time. */
function seeded(seed: number) {
  let k = seed;
  return () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
}

/** A small gilt rosette (needs "tcbr"). */
const rosette = (x: number, y: number, r = 2.4) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#tcbr)" stroke="${INK}" stroke-width="0.6"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.45)}" fill="none" stroke="${VEIN}" stroke-width="0.4"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.28)}" fill="#fff" fill-opacity="0.85"/>`;

// ------------------------------------------------------------- floor

/** A chequered parquet of oak and walnut squares from `y` to the foot,
 *  running away from you, as a board is. */
function parquet(w: number, y: number, h: number) {
  const rnd = seeded(23);
  const rows = 7;
  const cols = 8;
  const xAt = (t: number, v: number) => {
    const xt = w * 0.15 + t * w * 0.7;
    const xb = -w * 0.35 + t * w * 1.7;
    return xt + (xb - xt) * v;
  };
  const tiles: string[] = [];
  for (let r = 0; r < rows; r++) {
    const v0 = (r / rows) ** 1.4;
    const v1 = ((r + 1) / rows) ** 1.4;
    const y0 = y + (h - y) * v0;
    const y1 = y + (h - y) * v1;
    for (let c = -3; c < cols + 3; c++) {
      const t0 = c / cols;
      const t1 = (c + 1) / cols;
      const a = xAt(t0, v0);
      const b = xAt(t1, v0);
      const cc = xAt(t1, v1);
      const d = xAt(t0, v1);
      if (Math.max(b, cc) < 0 || Math.min(a, d) > w) continue;
      const dark = (r + c + 100) % 2 === 1;
      const tile = `M${f(a)} ${f(y0)}L${f(b)} ${f(y0)}L${f(cc)} ${f(y1)}L${f(d)} ${f(y1)}Z`;
      // the grain runs across the light squares, along the dark ones
      const grain = dark
        ? [0.3, 0.6]
            .map((k) => `M${f(a + (b - a) * k)} ${f(y0)}L${f(d + (cc - d) * k)} ${f(y1)}`)
            .join("")
        : [0.35, 0.7]
            .map((k) => {
              const yy = y0 + (y1 - y0) * k;
              const xl = a + (d - a) * k;
              const xr = b + (cc - b) * k;
              return `M${f(xl)} ${f(yy)}L${f(xr)} ${f(yy)}`;
            })
            .join("");
      tiles.push(
        `<path d="${tile}" fill="url(#${dark ? "tcpd" : "tcpl"})" stroke="#1A0E06" stroke-width="0.7"/>` +
          `<path d="${grain}" stroke="#1A0E06" stroke-opacity="0.18" stroke-width="0.6"/>` +
          `<path d="${tile}" fill="#000" fill-opacity="${f(rnd() * 0.08)}"/>`,
      );
    }
  }
  return `${tiles.join("")}
<rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#tcvig)"/>
<rect y="${f(y)}" width="${w}" height="26" fill="url(#tcwallsh)"/>`;
}

/** The oval rug between the chairs: a navy field, a crimson border, gold
 *  lines and a medallion. */
function rug(w: number, floorY: number, h: number) {
  const cx = w / 2;
  const cy = floorY + (h - floorY) * 0.5;
  const rx = w * 0.44;
  const ry = (h - floorY) * 0.36;
  return `
<path d="${oval(cx, cy + 4, rx, ry)}" fill="#000" fill-opacity="0.35"/>
<path d="${oval(cx, cy, rx, ry)}" fill="url(#tcrugb)" stroke="${INK}" stroke-width="0.9"/>
<path d="${oval(cx, cy, rx - 6, ry - 4)}" fill="none" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="1.2"/>
<path d="${oval(cx, cy, rx - 12, ry - 8)}" fill="url(#tcrug)" stroke="#E2B04A" stroke-opacity="0.6" stroke-width="0.8"/>
<path d="${oval(cx, cy, rx - 17, ry - 11.5)}" fill="none" stroke="#E2B04A" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="5 3 1.5 3"/>
<path d="${oval(cx, cy, rx * 0.26, ry * 0.36)}" fill="url(#tcrugb)" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="1.2"/>
<path d="${oval(cx, cy, rx * 0.2, ry * 0.27)}" fill="none" stroke="#E2B04A" stroke-opacity="0.45" stroke-width="0.8" stroke-dasharray="3 2"/>
<path d="M${f(cx - rx * 0.13)} ${f(cy)}L${f(cx)} ${f(cy - ry * 0.17)}L${f(cx + rx * 0.13)} ${f(cy)}L${f(cx)} ${f(cy + ry * 0.17)}Z" fill="#1E3A64" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="1"/>
<path d="M${f(cx - rx * 0.05)} ${f(cy)}L${f(cx)} ${f(cy - ry * 0.07)}L${f(cx + rx * 0.05)} ${f(cy)}L${f(cx)} ${f(cy + ry * 0.07)}Z" fill="#E2B04A" fill-opacity="0.8"/>
<path d="${oval(cx, cy, rx, ry)}" fill="url(#tcrugv)"/>`;
}

// ------------------------------------------------------------- chairs

/** A wing chair standing behind a spot, in the mark's velvet: a buttoned
 *  back with wings, rolled arms, a cushion, turned legs. */
function wingChair(s: Spot, velvet: string) {
  const k = s.size / 80;
  const x = s.x;
  const by = s.y - 12 * k;
  const P = (dx: number, dy: number) => `${f(x + dx * k)} ${f(by + dy * k)}`;
  const backD = `M${P(-36, -30)}L${P(-38, -84)}Q${P(-38, -104)} ${P(0, -106)}Q${P(38, -104)} ${P(38, -84)}L${P(36, -30)}Z`;
  const wing = (side: number) =>
    `M${P(side * 34, -86)}Q${P(side * 54, -84)} ${P(side * 52, -62)}L${P(side * 48, -40)}L${P(side * 32, -40)}Z`;
  const armD = (side: number) =>
    `M${P(side * 30, -50)}L${P(side * 50, -52)}Q${P(side * 60, -51)} ${P(side * 58, -40)}L${P(side * 54, -12)}L${P(side * 32, -12)}Z`;
  const buttons: string[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = -2; c <= 2; c++) {
      if ((r + c) % 2) continue;
      buttons.push(`<circle cx="${f(x + c * 11 * k)}" cy="${f(by + (-92 + r * 16) * k)}" r="${f(1.3 * k)}" fill="#000" fill-opacity="0.45"/>`);
    }
  }
  const leg = (dx: number) =>
    `<path d="M${P(dx - 2.6, -2)}L${P(dx + 2.6, -2)}L${P(dx + 1.6, 10)}L${P(dx - 1.6, 10)}Z" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.6"/><circle cx="${f(x + dx * k)}" cy="${f(by + 10.5 * k)}" r="${f(1.9 * k)}" fill="url(#tcbr)" stroke="${INK}" stroke-width="0.4"/>`;
  return `
<path d="${oval(x, by + 11 * k, 56 * k, 5 * k)}" fill="#000" fill-opacity="0.4"/>
${leg(-46)}${leg(46)}
<path d="${backD}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
${buttons.join("")}
<path d="M${P(-30, -96)}Q${P(-12, -103)} ${P(10, -102)}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="${f(1.2 * k)}" fill="none" stroke-linecap="round"/>
<path d="${wing(-1)}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
<path d="${wing(1)}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
<path d="${rrect(x - 40 * k, by - 34 * k, 80 * k, 26 * k, 6 * k)}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
<path d="${armD(-1)}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
<path d="${armD(1)}" fill="url(#${velvet})" stroke="${DARK}" stroke-width="0.9"/>
<path d="M${P(-52, -48)}Q${P(-56, -46)} ${P(-55, -38)}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="${f(1.1 * k)}" fill="none" stroke-linecap="round"/>
${[-1, 1].map((side) => `<path d="M${P(side * 33, -12)}L${P(side * 55, -12)}" stroke="#C8902E" stroke-width="${f(1.6 * k)}"/>`).join("")}
${[-50, -44, -38, -32].flatMap((dx) => [dx, -dx]).map((dx) => `<circle cx="${f(x + dx * k)}" cy="${f(by - 13 * k)}" r="${f(0.9 * k)}" fill="#E2B04A"/>`).join("")}`;
}

// ------------------------------------------------------------- mantel

/** The bracket clock on the mantel, its feet on (x, y). */
function clock(x: number, y: number) {
  const w = 26;
  const h = 36;
  const l = x - w / 2;
  const t = y - h;
  return `
<path d="M${f(l + 1)} ${f(y)}H${f(l + w - 1)}V${f(t + 12)}Q${f(l + w - 1)} ${f(t)} ${f(x)} ${f(t)}Q${f(l + 1)} ${f(t)} ${f(l + 1)} ${f(t + 12)}Z" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.9"/>
<path d="M${f(l + 3)} ${f(y - 2)}V${f(t + 12)}" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="0.8"/>
<rect x="${f(l - 1)}" y="${f(y - 3)}" width="${w + 2}" height="3" rx="1" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${f(x)}" cy="${f(t + 15)}" r="9.4" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${f(x)}" cy="${f(t + 15)}" r="7.4" fill="url(#tciv)" stroke="${INK}" stroke-width="0.6"/>
${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<path d="M${f(x + Math.cos(a) * 6.6)} ${f(t + 15 + Math.sin(a) * 6.6)}L${f(x + Math.cos(a) * 5.6)} ${f(t + 15 + Math.sin(a) * 5.6)}" stroke="${INK}" stroke-width="${i % 3 ? 0.4 : 0.8}"/>`;
  }).join("")}
<path d="M${f(x)} ${f(t + 15)}L${f(x - 2.6)} ${f(t + 11.4)}M${f(x)} ${f(t + 15)}L${f(x + 4)} ${f(t + 13.6)}" stroke="${DARK}" stroke-width="0.8" stroke-linecap="round"/>
<path d="M${f(x - 5.2)} ${f(t + 11)}A7 7 0 0 1 ${f(x - 1)} ${f(t + 8.2)}" stroke="#fff" stroke-width="0.7" fill="none" stroke-linecap="round"/>
<path d="${rrect(x - 6, t + 27, 12, 5, 1)}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x - 3)} ${f(t + 1)}L${f(x)} ${f(t - 6)}L${f(x + 3)} ${f(t + 1)}Z" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.6"/>
${rosette(x, t - 6.5, 1.8)}`;
}

/** The crest in a gilt frame standing on the mantel at (x, y): a shield
 *  per pale, the saltire on night blue and the annulet on crimson. */
function crest(x: number, y: number) {
  const w = 34;
  const h = 38;
  const l = x - w / 2;
  const t = y - h;
  const sw = 20;
  const st = t + 8;
  const sh = 23;
  const shield = `M${f(x - sw / 2)} ${f(st)}H${f(x + sw / 2)}V${f(st + sh * 0.45)}Q${f(x + sw / 2)} ${f(st + sh * 0.85)} ${f(x)} ${f(st + sh)}Q${f(x - sw / 2)} ${f(st + sh * 0.85)} ${f(x - sw / 2)} ${f(st + sh * 0.45)}Z`;
  return `
<path d="${rrect(l + 1.5, t + 2.5, w, h, 3)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(l, t, w, h, 3)}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rrect(l + 1.8, t + 1.8, w - 3.6, h - 3.6, 2)}" fill="none" stroke="${VEIN}" stroke-width="0.5"/>
<path d="${rrect(l + 4, t + 4, w - 8, h - 8, 1.5)}" fill="url(#tcsilk)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(l + 3)} ${f(t + 1.2)}H${f(l + w * 0.55)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.7" stroke-linecap="round"/>
<clipPath id="tccl"><rect x="${f(x - sw / 2)}" y="${f(st)}" width="${f(sw / 2)}" height="${sh}"/></clipPath>
<clipPath id="tccr"><rect x="${f(x)}" y="${f(st)}" width="${f(sw / 2)}" height="${sh}"/></clipPath>
<path d="${shield}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="${shield}" fill="url(#tcnight)" clip-path="url(#tccl)" transform="translate(${f(x * 0.12)} ${f(st * 0.12)}) scale(0.88)"/>
<path d="${shield}" fill="url(#tccrim)" clip-path="url(#tccr)" transform="translate(${f(x * 0.12)} ${f(st * 0.12)}) scale(0.88)"/>
<path d="M${f(x)} ${f(st + 1.5)}V${f(st + sh - 2)}" stroke="#E2B04A" stroke-width="1"/>
${markBody("X", x - 4.4, st + 9, 9.5, "tcsx")}
${markBody("O", x + 4.4, st + 9, 9.5, "tcso")}
${rosette(x, t, 2.2)}`;
}

/** A decanter of port with its stopper, its foot on (x, y). */
function decanter(x: number, y: number) {
  const r = 8.5;
  const cy = y - r - 1;
  return `
<path d="M${f(x - r - 2)} ${f(y)}H${f(x + r + 8)}" stroke="#000" stroke-opacity="0.4" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${f(x - 3)} ${f(cy - r + 2)}V${f(cy - r - 7)}H${f(x + 3)}V${f(cy - r + 2)}Z" fill="url(#tcglass)" stroke="${INKS.silver.ink}" stroke-width="0.6"/>
<path d="${oval(x, cy, r, r)}" fill="url(#tcglass)" stroke="${INKS.silver.ink}" stroke-width="0.7"/>
<path d="M${f(x - r + 0.8)} ${f(cy + 1)}A${r - 0.8} ${r - 0.8} 0 0 0 ${f(x + r - 0.8)} ${f(cy + 1)}Z" fill="url(#tcport)"/>
<path d="${rrect(x - 4, y - 2, 8, 2.4, 1)}" fill="url(#tcglass)" stroke="${INKS.silver.ink}" stroke-width="0.5"/>
<circle cx="${f(x)}" cy="${f(cy - r - 9)}" r="3.2" fill="url(#tcglass)" stroke="${INKS.silver.ink}" stroke-width="0.6"/>
<path d="M${f(x - r * 0.62)} ${f(cy - r * 0.2)}A${f(r * 0.68)} ${f(r * 0.68)} 0 0 1 ${f(x - r * 0.1)} ${f(cy - r * 0.68)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="0.9" stroke-linecap="round"/>
${/* a glass beside it */ ""}
<path d="M${f(x + r + 3)} ${f(y - 14)}H${f(x + r + 10)}L${f(x + r + 9)} ${f(y - 8)}Q${f(x + r + 6.5)} ${f(y - 6)} ${f(x + r + 4)} ${f(y - 8)}Z" fill="url(#tcglass)" stroke="${INKS.silver.ink}" stroke-width="0.5"/>
<path d="M${f(x + r + 3.6)} ${f(y - 11)}H${f(x + r + 9.4)}L${f(x + r + 9)} ${f(y - 8)}Q${f(x + r + 6.5)} ${f(y - 6.3)} ${f(x + r + 4)} ${f(y - 8)}Z" fill="url(#tcport)"/>
<path d="M${f(x + r + 6.5)} ${f(y - 7)}V${f(y - 1)}M${f(x + r + 4.4)} ${f(y - 0.6)}H${f(x + r + 8.6)}" stroke="${INKS.silver.ink}" stroke-width="0.8"/>`;
}

// ------------------------------------------------------------- the room

function parlour(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, board: B, table: T, spots } = R;
  const dado = floorY - 64;

  // the walls: navy silk with a faint diaper of crosses and noughts,
  // a walnut wainscot under a gilt dado rail
  const diaper: string[] = [];
  for (let y = wallTop + 12, r = 0; y < dado - 4; y += 16, r++) {
    for (let x = (r % 2) * 12 + 6; x < w; x += 24) {
      diaper.push(
        (r + Math.floor(x / 24)) % 2
          ? `<circle cx="${x}" cy="${f(y)}" r="2.4" fill="none" stroke="#E2B04A" stroke-opacity="0.14" stroke-width="0.9"/>`
          : `<path d="M${x - 2.2} ${f(y - 2.2)}l4.4 4.4m0 -4.4l-4.4 4.4" stroke="#E2B04A" stroke-opacity="0.14" stroke-width="0.9" stroke-linecap="round"/>`,
      );
    }
  }
  const wainscot: string[] = [];
  const pw = 34;
  for (let x = 2; x < w; x += pw) {
    wainscot.push(
      `<path d="${rrect(x + 3, dado + 8, pw - 6, floorY - dado - 22, 2)}" fill="url(#tcwald)" stroke="${DARK}" stroke-width="0.8"/><path d="M${f(x + 4)} ${f(floorY - 15)}H${f(x + pw - 3)}V${f(dado + 9)}" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="0.7" fill="none"/>`,
    );
  }

  // the chimneypiece: marble jambs and mantel; its frieze is the board
  const cx0 = B.x;
  const cx1 = B.x + B.w;
  const ccx = (cx0 + cx1) / 2;
  // the grate and three columns of tiles each side; the marble jambs
  // take whatever width is left
  const ts = 11;
  const archW = Math.min(150, B.w * 0.5);
  const jamb = Math.max(22, Math.min(64, (B.w - archW - 2 * (3 * ts + 10)) / 2));
  const shelfY = B.y - 7;
  const friezeBottom = B.y + B.h;
  const openL = cx0 + jamb;
  const openR = cx1 - jamb;
  const tcx = T.x + T.w / 2;
  const nFlutes = Math.max(3, Math.floor((jamb - 8) / 5));
  const flutes = Array.from({ length: nFlutes }, (_, i) => 5 + ((jamb - 10) * i) / (nFlutes - 1));
  // the cast-iron insert: tiles each side of an arched grate
  const aL = tcx - archW / 2;
  const aR = tcx + archW / 2;
  const springY = friezeBottom + 26;
  const archD = `M${f(aL)} ${f(floorY - 4)}V${f(springY)}Q${f(aL)} ${f(friezeBottom + 8)} ${f(tcx)} ${f(friezeBottom + 8)}Q${f(aR)} ${f(friezeBottom + 8)} ${f(aR)} ${f(springY)}V${f(floorY - 4)}Z`;
  const tiles: string[] = [];
  [
    [openL + 4, aL - 4],
    [aR + 4, openR - 4],
  ].forEach(([x0, x1], side) => {
    const n = Math.max(1, Math.min(3, Math.floor((x1 - x0) / ts)));
    const tx0 = side ? x0 : x1 - n * ts;
    for (let i = 0; i < n; i++) {
      for (let y = friezeBottom + 6, j = 0; y + ts <= floorY - 6; y += ts, j++) {
        const x = tx0 + i * ts;
        const mx = x + ts / 2;
        const my = y + ts / 2;
        tiles.push(
          `<rect x="${f(x)}" y="${f(y)}" width="${ts}" height="${ts}" fill="url(#tctile)" stroke="#0A1A30" stroke-width="0.6"/>` +
            ((i + j) % 2
              ? `<circle cx="${f(mx)}" cy="${f(my)}" r="2.4" fill="none" stroke="#E2B04A" stroke-opacity="0.75" stroke-width="0.9"/>`
              : `<path d="M${f(mx - 2.2)} ${f(my - 2.2)}l4.4 4.4m0 -4.4l-4.4 4.4" stroke="#E2B04A" stroke-opacity="0.75" stroke-width="0.9" stroke-linecap="round"/>`) +
            `<path d="M${f(x + 1)} ${f(y + 1)}H${f(x + ts - 2)}" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="0.6"/>`,
        );
      }
    }
  });
  // the fire in its basket: coals, flames, the glow on the iron
  const flames = [
    [-30, 16, 0.8],
    [-14, 26, 1],
    [2, 32, 1.1],
    [18, 24, 1],
    [32, 15, 0.8],
  ]
    .map(([dx, fh, s]) => {
      const x = tcx + dx;
      const yb = floorY - 18;
      const fw = 7 * s;
      return `<path d="M${f(x - fw)} ${f(yb)}C${f(x - fw)} ${f(yb - fh * 0.5)} ${f(x - fw * 0.2)} ${f(yb - fh * 0.6)} ${f(x + fw * 0.2)} ${f(yb - fh)}C${f(x + fw * 0.4)} ${f(yb - fh * 0.55)} ${f(x + fw)} ${f(yb - fh * 0.45)} ${f(x + fw)} ${f(yb)}Z" fill="url(#tcflame)" stroke="#7A2A08" stroke-width="0.6"/>`;
    })
    .join("");
  const coals = Array.from({ length: 9 }, (_, i) => {
    const x = tcx - 40 + i * 10;
    return `<circle cx="${f(x)}" cy="${f(floorY - 16 + (i % 2) * 2)}" r="5.4" fill="url(#tccoal)" stroke="#2A0A04" stroke-width="0.5"/>`;
  }).join("");
  const basket = Array.from({ length: 8 }, (_, i) => {
    const x = tcx - 46 + i * (92 / 7);
    return `M${f(x)} ${f(floorY - 20)}V${f(floorY - 7)}`;
  }).join("");
  const fireplace = `
<rect x="${f(cx0 + 3)}" y="${f(shelfY + 2)}" width="${f(B.w)}" height="${f(floorY - shelfY)}" fill="#000" fill-opacity="0.4"/>
<rect x="${f(openL)}" y="${f(friezeBottom)}" width="${f(openR - openL)}" height="${f(floorY - friezeBottom)}" fill="url(#tciron)" stroke="${DARK}" stroke-width="0.8"/>
${tiles.join("")}
<path d="${archD}" fill="#0A0604" stroke="${DARK}" stroke-width="1"/>
<path d="${archD}" fill="url(#tcfireglow)"/>
${flames}${coals}
<path d="${basket}" stroke="#0A0A0C" stroke-width="2.6" stroke-linecap="round"/>
<path d="M${f(tcx - 50)} ${f(floorY - 8)}H${f(tcx + 50)}M${f(tcx - 50)} ${f(floorY - 20)}H${f(tcx + 50)}" stroke="#16181C" stroke-width="2.4" stroke-linecap="round"/>
<path d="${archD}" fill="none" stroke="${INK}" stroke-width="3.4"/>
<path d="${archD}" fill="none" stroke="url(#tcgh)" stroke-width="2"/>
${[0, 1].map((side) => {
    const jx = side ? openR : cx0;
    return `<rect x="${f(jx)}" y="${f(friezeBottom)}" width="${jamb}" height="${f(floorY - friezeBottom)}" fill="url(#tcmarb)" stroke="${INK}" stroke-width="0.9"/>
<path d="${flutes.map((fx) => `M${f(jx + fx)} ${f(friezeBottom + 12)}V${f(floorY - 14)}`).join("")}" stroke="#A89C88" stroke-width="1.4" stroke-linecap="round"/>
<path d="${flutes.map((fx) => `M${f(jx + fx + 1)} ${f(friezeBottom + 12)}V${f(floorY - 14)}`).join("")}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.6"/>
<rect x="${f(jx - 2)}" y="${f(friezeBottom)}" width="${jamb + 4}" height="8" fill="url(#tcmarb)" stroke="${INK}" stroke-width="0.8"/>
${rosette(jx + jamb / 2, friezeBottom + 4, 2.4)}
<rect x="${f(jx - 2)}" y="${f(floorY - 10)}" width="${jamb + 4}" height="10" fill="url(#tcmarb)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(jx + 1.4)} ${f(friezeBottom + 9)}V${f(floorY - 11)}" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="0.8"/>`;
  }).join("")}
<path d="${rrect(cx0 - 8, shelfY, B.w + 16, 6, 1.5)}" fill="url(#tcmarb)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(cx0 - 6)} ${f(shelfY + 1.2)}H${f(cx0 + B.w * 0.5)}" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round"/>
<path d="M${f(cx0 - 6)} ${f(shelfY + 6)}H${f(cx1 + 6)}" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>
<path d="M${f(cx0 - 14)} ${f(floorY - 1)}H${f(cx1 + 14)}L${f(cx1 + 26)} ${f(floorY + 12)}H${f(cx0 - 26)}Z" fill="url(#tcmarb)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(cx0 - 12)} ${f(floorY + 0.4)}H${f(ccx)}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.7"/>
<rect x="${f(cx0 - 26)}" y="${f(floorY - 1)}" width="${f(B.w + 52)}" height="14" fill="url(#tchearth)"/>
<path d="M${f(aL - 18)} ${f(floorY + 9)}H${f(aR + 18)}" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/>
<rect x="${f(aL - 18)}" y="${f(floorY + 7.4)}" width="${f(archW + 36)}" height="3.4" rx="1.7" fill="url(#tcgv)"/>
${[aL - 18, aR + 18].map((x) => `<circle cx="${f(x)}" cy="${f(floorY + 8.6)}" r="3.4" fill="url(#tcbr)" stroke="${INK}" stroke-width="0.6"/>`).join("")}`;

  // the frieze: marble round a malachite panel in a gilt bead; a gold
  // medallion with an ivory face at its right end for the count
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const bands = [0.3, 0.5, 0.72, 0.9]
    .map(
      (k, i) =>
        `<path d="M${f(B.x + 8)} ${f(B.y + B.h * k)}C${f(B.x + B.w * 0.25)} ${f(B.y + B.h * (k - 0.22))} ${f(B.x + B.w * 0.5)} ${f(B.y + B.h * (k + 0.2))} ${f(B.x + B.w - 8)} ${f(B.y + B.h * (k - 0.1))}" fill="none" stroke="${i % 2 ? "#06301E" : "#6ADBA0"}" stroke-opacity="${i % 2 ? 0.45 : 0.22}" stroke-width="${2.4 - i * 0.4}"/>`,
    )
    .join("");
  const frieze = `
<path d="${rrect(B.x, B.y, B.w, B.h, 2)}" fill="url(#tcmarb)" stroke="${INK}" stroke-width="1.1"/>
<path d="M${f(B.x + 3)} ${f(B.y + 1.4)}H${f(B.x + B.w * 0.4)}" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round"/>
<path d="${rrect(B.x + 4, B.y + 4, B.w - 8, B.h - 8, 2)}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rrect(B.x + 6.5, B.y + 6.5, B.w - 13, B.h - 13, 1.5)}" fill="url(#tcmal)" stroke="${INK}" stroke-width="0.8"/>
<clipPath id="tcmc"><path d="${rrect(B.x + 6.5, B.y + 6.5, B.w - 13, B.h - 13, 1.5)}"/></clipPath>
<g clip-path="url(#tcmc)">${bands}</g>
<path d="${rrect(B.x + 9.5, B.y + 9.5, B.w - 19, B.h - 19, 1)}" fill="none" stroke="#F0CC72" stroke-opacity="0.45" stroke-width="0.6"/>
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="24" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="24" fill="url(#tcgd)" stroke="${INK}" stroke-width="1.1"/>
${Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 20.6)}" cy="${f(my + Math.sin(a) * 20.6)}" r="1.35" fill="#FFF2B8" stroke="${INK}" stroke-width="0.35"/>`;
  }).join("")}
<circle cx="${f(mx)}" cy="${f(my)}" r="17.4" fill="url(#tciv)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>
${[0, 1].map((side) => rosette(side ? B.x + B.w - 2.5 : B.x + 2.5, my, 2.6)).join("")}`;

  // on the mantel: the crest, the clock, the decanter
  const mantel = `${crest(tcx - 74, shelfY)}${clock(tcx, shelfY)}${decanter(tcx + 64, shelfY)}`;

  // the card table: a round top with a baize field and a gilt edge on a
  // turned pedestal and three splayed legs; the cross and the nought
  // stand at its ends
  const tw = Math.min(150, T.w * 0.62);
  const ty = T.y;
  const ped = `M${f(tcx - 4)} ${f(ty + 14)}H${f(tcx + 4)}L${f(tcx + 6)} ${f(ty + 22)}Q${f(tcx + 11)} ${f(ty + 30)} ${f(tcx + 5)} ${f(ty + 40)}V${f(floorY - 14)}H${f(tcx - 5)}V${f(ty + 40)}Q${f(tcx - 11)} ${f(ty + 30)} ${f(tcx - 6)} ${f(ty + 22)}Z`;
  const legD = (side: number) =>
    `M${f(tcx + side * 3)} ${f(floorY - 20)}Q${f(tcx + side * 22)} ${f(floorY - 16)} ${f(tcx + side * 34)} ${f(floorY + 4)}L${f(tcx + side * 30)} ${f(floorY + 6)}Q${f(tcx + side * 18)} ${f(floorY - 8)} ${f(tcx + side * 2)} ${f(floorY - 10)}Z`;
  const table = `
<path d="${oval(tcx, floorY + 7, 44, 4)}" fill="#000" fill-opacity="0.45"/>
<path d="${legD(-1)}" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.8"/>
<path d="${legD(1)}" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.8"/>
${[-1, 1].map((side) => `<circle cx="${f(tcx + side * 32)}" cy="${f(floorY + 5.5)}" r="2.6" fill="url(#tcbr)" stroke="${INK}" stroke-width="0.5"/>`).join("")}
<path d="${ped}" fill="url(#tcwalh)" stroke="${DARK}" stroke-width="0.8"/>
<path d="${rrect(tcx - 8, ty + 30, 16, 3, 1.4)}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(tcx - 7)} ${f(floorY - 16)}H${f(tcx + 7)}L${f(tcx + 9)} ${f(floorY - 9)}H${f(tcx - 9)}Z" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.7"/>
<path d="M${f(tcx - 2)} ${f(ty + 42)}V${f(floorY - 18)}" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="0.9"/>
<path d="${oval(tcx, ty + 5, tw / 2, 7)}" fill="url(#tcwal)" stroke="${DARK}" stroke-width="0.8"/>
<path d="${oval(tcx, ty + 4.4, tw / 2 - 6, 4.6)}" fill="url(#tcbaize)" stroke="#06200F" stroke-width="0.6"/>
<path d="M${f(tcx - tw / 2)} ${f(ty + 5)}V${f(ty + 10)}A${f(tw / 2)} 7 0 0 0 ${f(tcx + tw / 2)} ${f(ty + 10)}V${f(ty + 5)}A${f(tw / 2)} 7 0 0 1 ${f(tcx - tw / 2)} ${f(ty + 5)}Z" fill="url(#tcwalh)" stroke="${DARK}" stroke-width="0.8"/>
<path d="M${f(tcx - tw / 2 + 1)} ${f(ty + 7.4)}A${f(tw / 2)} 7 0 0 0 ${f(tcx + tw / 2 - 1)} ${f(ty + 7.4)}" fill="none" stroke="#E2B04A" stroke-width="1.2"/>
<path d="M${f(tcx - tw / 2 + 8)} ${f(ty + 1.6)}Q${f(tcx - tw / 4)} ${f(ty - 1)} ${f(tcx)} ${f(ty - 1.4)}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="0.8" fill="none"/>
${markBody("X", tcx - tw / 2 + 18, ty - 6, 25, "tctx")}
${markBody("O", tcx + tw / 2 - 18, ty - 6, 25, "tcto")}`;

  // the ceiling: a plaster cornice with egg and dart over a gilt moulding
  const eggs: string[] = [];
  for (let x = 4; x < w; x += 10) {
    eggs.push(
      `<path d="${oval(x + 2.5, beam.y + beam.h / 2, 3, 4)}" fill="url(#tcivory)" stroke="${INK}" stroke-width="0.5"/><path d="M${f(x + 6.4)} ${f(beam.y + 2.6)}H${f(x + 8.6)}L${f(x + 7.5)} ${f(beam.y + beam.h - 2)}Z" fill="${VEIN}"/>`,
    );
  }
  const dentils: string[] = [];
  for (let x = 2; x < w; x += 7) dentils.push(`M${x} ${f(roof - 9)}h4v7h-4Z`);

  // the chairs: the cross's in navy velvet, the nought's in crimson
  const front = spots.filter((s) => s.row === 1).sort((a, b) => a.x - b.x);
  const chairs = front.map((s, i) => wingChair(s, i % 2 ? "tcvo" : "tcvx")).join("");

  return svg(
    w,
    h,
    `<defs>
${linear("tcsilk", SILK)}
${lit("tcwal", WALNUT, 0, 0, w * 0.4, h)}
${linear("tcwalh", WALNUT, false)}
${linear("tcwald", ["#4A2C16", "#2E1A0C"])}
${linear("tcpl", ["#B0784A", "#8A5A34", "#6A4224"])}
${linear("tcpd", ["#5A341C", "#422412", "#2A160A"])}
${linear("tcmarb", MARBLE)}
${linear("tcmal", MALACHITE)}
${linear("tciron", IRON)}
${linear("tctile", ["#3A6AA0", "#264C78", "#183456"])}
${linear("tcgv", MATERIALS.gold)}
${linear("tcgh", MATERIALS.gold, false)}
${linear("tciv", MATERIALS.ivory)}
${linear("tcivory", MATERIALS.ivory)}
${linear("tcnight", FIELD.X)}
${linear("tccrim", FIELD.O)}
${linear("tcglass", ["#F4FAFF", "#B8C8D8", "#7A8898"], false)}
${linear("tcport", ["#C8203A", "#7A0A1E", "#3A0410"])}
${linear("tcbaize", ["#2A7A50", "#1E6A44", "#14502F"])}
${lit("tcvx", ["#5A8AD0", "#2A4E8A", "#122A54"], 0, 0, w * 0.5, h)}
${lit("tcvo", ["#E05A6A", "#A8182E", "#5A0812"], w * 0.5, 0, w, h)}
${linear("tcflame", MATERIALS.flame)}
${radial("tccoal", ["#FFD27A", "#E2541A", "#5A1004"], undefined, 0.4, 0.35, 0.7)}
${radial("tcfireglow", ["#FFB45A", "#FFB45A"], [0.55, 0], 0.5, 0.9, 0.8)}
${radial("tchearth", ["#FFB45A", "#FFB45A"], [0.3, 0], 0.5, 0.2, 0.6)}
${radial("tcbr", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("tcgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${linear("tcrug", ["#1E3A64", "#16304E", "#0E1E34"])}
${linear("tcrugb", ["#A8182E", "#7A0A1E", "#4A0410"])}
${radial("tcrugv", ["#000000", "#000000"], [0, 0.45], 0.5, 0.3, 0.7)}
${radial("tcwarm", ["#FFD9A0", "#FFD9A0"], [0.18, 0], 0.62, 0.62, 0.6)}
${radial("tcshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.15, 1)}
${radial("tcvig", ["#000000", "#000000"], [0, 0.6], 0.5, 0.2, 0.85)}
${linear("tcwallsh", ["#000000", "#000000"], true, [0.55, 0])}
${linear("tcceil", ["#C8BCA0", "#8A7E66"])}
</defs>
<rect width="${w}" height="${f(dado)}" fill="url(#tcsilk)"/>
${diaper.join("")}
<rect y="${f(dado)}" width="${w}" height="${f(floorY - dado)}" fill="url(#tcwal)"/>
${wainscot.join("")}
<rect y="${f(dado - 2.5)}" width="${w}" height="5" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M0 ${f(dado - 1.4)}H${w}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.6"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#tcwarm)"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#tcshade)"/>
${parquet(w, floorY, h)}
<rect y="${f(floorY - 8)}" width="${w}" height="8" fill="#2A160A" stroke="${DARK}" stroke-width="0.8"/>
${rug(w, floorY, h)}
${doorArt(R, floor, floors)}
${fireplace}
${frieze}
${mantel}
${table}
${chairs}
<rect width="${w}" height="${roof + 4}" fill="url(#tcceil)"/>
<path d="${dentils.join("")}" fill="url(#tcivory)" stroke="#5A4A30" stroke-width="0.5"/>
<path d="M0 ${f(roof - 1)}H${w}" stroke="#5A4A30" stroke-width="1"/>
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<rect y="${beam.y}" width="${w}" height="${beam.h}" fill="url(#tcgv)" stroke="${INK}" stroke-width="0.9"/>
${eggs.join("")}
<path d="M0 ${beam.y + 1.2}H${w}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.7"/>`,
  );
}

// ------------------------------------------------------------- the lamp

const LAMP_K = 1.25;
const LAMP_W = 40 * LAMP_K;
const LAMP_H = 58 * LAMP_K;

/** A little brass candelabrum on its chain: a ring, a stem down to a
 *  bowl, two arms curling up to candle cups, a crimson tassel under it;
 *  its two candles lit, or snuffed. */
function candelabrumArt(on: boolean) {
  const c = 20;
  const cup = (x: number) =>
    `<path d="M${f(x - 4.2)} 26H${f(x + 4.2)}L${f(x + 2.4)} 30H${f(x - 2.4)}Z" fill="url(#cg)" stroke="${INK}" stroke-width="0.6"/>`;
  const candle = (x: number) =>
    `<rect x="${f(x - 1.9)}" y="13" width="3.8" height="13" rx="0.8" fill="url(#cv)" stroke="${INK}" stroke-width="0.5"/><path d="M${f(x - 1)} 14V25" stroke="#FFFFFF" stroke-width="0.6"/><path d="M${f(x)} 13V10.6" stroke="#1A0E06" stroke-width="0.7"/>`;
  const flame = (x: number) =>
    `<path d="M${f(x)} 1.5C${f(x + 1.4)} 4.5 ${f(x + 2.8)} 7 ${f(x + 2.6)} 9.2A2.6 2.6 0 0 1 ${f(x - 2.6)} 9.2C${f(x - 2.8)} 7 ${f(x - 1.4)} 4.5 ${f(x)} 1.5Z" fill="url(#cf)" stroke="#7A2A08" stroke-width="0.4"/><path d="M${f(x)} 6C${f(x + 0.8)} 7.4 ${f(x + 1.1)} 8.6 ${f(x)} 9.8C${f(x - 1.1)} 8.6 ${f(x - 0.8)} 7.4 ${f(x)} 6Z" fill="#FFFFFF" fill-opacity="0.85"/>`;
  const arm = (side: number) =>
    `M${c} 33C${f(c + side * 8)} 36 ${f(c + side * 14)} 34 ${f(c + side * 14)} 30`;
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${linear("cg", MATERIALS.gold, false)}${linear("cv", MATERIALS.ivory, false)}${linear("cf", MATERIALS.flame)}${linear("ct", ["#E04A52", "#A8182A", "#5A0810"])}</defs><g transform="scale(${LAMP_K})">
<path d="M${c} 0V6" stroke="#2A1A0A" stroke-width="1.2"/>
<circle cx="${c}" cy="7.5" r="2.4" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="${c}" cy="7.5" r="2.4" fill="none" stroke="url(#cg)" stroke-width="1"/>
<path d="M${c - 1.2} 10H${c + 1.2}V33H${c - 1.2}Z" fill="url(#cg)" stroke="${INK}" stroke-width="0.5"/>
<path d="${oval(c, 18, 2.6, 2.2)}" fill="url(#cg)" stroke="${INK}" stroke-width="0.5"/>
${[-1, 1].map((side) => `<path d="${arm(side)}" fill="none" stroke="${INK}" stroke-width="3"/><path d="${arm(side)}" fill="none" stroke="url(#cg)" stroke-width="1.6"/>`).join("")}
${cup(c - 14)}${cup(c + 14)}
${candle(c - 14)}${candle(c + 14)}
${on ? `${flame(c - 14)}${flame(c + 14)}` : ""}
<path d="M${c - 7} 31Q${c} 41 ${c + 7} 31Z" fill="url(#cg)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${c - 5} 32.4Q${c - 3} 35.6 ${c} 36.4" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.6" fill="none"/>
<circle cx="${c}" cy="39.6" r="1.8" fill="url(#cg)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${c - 1.6} 41.4H${c + 1.6}L${c + 3.6} 47L${c + 4} 56H${c - 4}L${c - 3.6} 47Z" fill="url(#ct)" stroke="#3A0408" stroke-width="0.6"/>
<path d="M${c - 2.6} 48V55.4M${c - 0.9} 48V55.6M${c + 0.9} 48V55.6M${c + 2.6} 48V55.4" stroke="#3A0408" stroke-opacity="0.55" stroke-width="0.5"/>
<rect x="${c - 3.8}" y="46" width="7.6" height="2" rx="0.8" fill="url(#cg)" stroke="${INK}" stroke-width="0.4"/></g>`,
  );
}

// ------------------------------------------------------------- the piece

const GLASS_W = 22;
const GLASS_H = 36;

/** A glass of port set out for a player: a tulip bowl, the wine in it, a
 *  stem and a foot. */
function portGlassArt() {
  const c = GLASS_W / 2;
  const bowl = `M${c - 7} 3H${c + 7}C${c + 7.6} 12 ${c + 6} 18 ${c} 19.5C${c - 6} 18 ${c - 7.6} 12 ${c - 7} 3Z`;
  const wine = `M${c - 7.2} 9H${c + 7.2}C${c + 7} 14 ${c + 5.4} 17.8 ${c} 19C${c - 5.4} 17.8 ${c - 7} 14 ${c - 7.2} 9Z`;
  return svg(
    GLASS_W,
    GLASS_H,
    `<defs>${linear("pg", ["#F4FAFF", "#B8C8D8", "#7A8898"], false)}${linear("pw", ["#E8405A", "#8A0A22", "#3A0410"])}</defs>
<path d="M${c - 8} ${GLASS_H - 1.6}H${c + 9}" stroke="#000" stroke-opacity="0.45" stroke-width="2.4" stroke-linecap="round"/>
<path d="${bowl}" fill="url(#pg)" fill-opacity="0.55"/>
<path d="${wine}" fill="url(#pw)"/>
<path d="M${c - 7.2} 9Q${c} 10.6 ${c + 7.2} 9" fill="none" stroke="#FF9AA6" stroke-opacity="0.7" stroke-width="0.6"/>
<path d="${bowl}" fill="none" stroke="${INKS.silver.ink}" stroke-width="0.8"/>
<path d="M${c - 5} 5V13" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1" stroke-linecap="round"/>
<path d="M${c - 1} 19.4H${c + 1}V${GLASS_H - 5}H${c - 1}Z" fill="url(#pg)" stroke="${INKS.silver.ink}" stroke-width="0.6"/>
<circle cx="${c}" cy="24" r="1.6" fill="url(#pg)" stroke="${INKS.silver.ink}" stroke-width="0.5"/>
<path d="M${c - 6.4} ${GLASS_H - 2.4}Q${c} ${GLASS_H - 6.4} ${c + 6.4} ${GLASS_H - 2.4}Z" fill="url(#pg)" stroke="${INKS.silver.ink}" stroke-width="0.6"/>
<path d="M${c - 6} 3.2H${c + 6}" stroke="#E2B04A" stroke-width="0.9"/>`,
  );
}

export const ROOM: RoomLook = {
  light: "#FFD9A0",
  art: parlour,
  lamp: { lit: () => candelabrumArt(true), out: () => candelabrumArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: portGlassArt, w: GLASS_W, h: GLASS_H },
  board: { title: "#F0CC72", text: "#FFF6E0" },
  popup: { enamel: ["#4A7AC0", "#2F5D8A", "#16304E"], jewel: "sapphire", glow: "#FFD9A0" },
};

// Liar's Dice's room on its floor of the lift: the back bar of the pub
// where the dice are shaken, seen flat on. A hop garland swagged along
// the oak beam; the carved back bar with its smoky mirror in three bays
// and a glass shelf of bottles and steins across it; the chalk slate the
// house rules are written on, a beer mat for the count, a stick of chalk
// on its ledge; the long mahogany counter with its brass edge and foot
// rail, the beer pulls at its end, a dice cup set out on it for each
// player; flagstones underfoot; and over every spot a pub lamp, a green
// cased-glass shade over an Edison bulb that glows amber once its player
// is ready. As SVG markup, baked once (RoomScene).

import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, frond } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { cupArt, dieBody } from "@/games/liarsdice/art";
import { doorArt, lit, svg } from "../art";
import type { RoomLayout } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const DARK = "#160A04";

const OAK = ["#4E2E1A", "#331C0E", "#1C0E06"];
const MAHOGANY = ["#8A3C22", "#5A2212", "#2E0E06"];
const MIRROR = ["#5E6872", "#2E353E", "#161A20"];
const SLATE = ["#3E454E", "#262B32", "#14171C"];
const STONE = ["#7E6E5C", "#625444", "#463A2E"];

/** A little seeded random, so the bar is the same every time. */
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
    const a = 0.6 + rnd() * 1.4;
    const p = rnd() * 6;
    const pts: string[] = [];
    for (let xx = x; xx <= x + w + 12; xx += 12) pts.push(`${f(xx)} ${f(yy + Math.sin(xx / 41 + p) * a)}`);
    const light = rnd() > 0.6;
    lines.push(
      `<path d="M${pts.join("L")}" fill="none" stroke="${light ? "#B07A4A" : "#120804"}" stroke-opacity="${light ? 0.12 : 0.3}" stroke-width="${f(0.5 + rnd() * 0.6)}"/>`,
    );
  }
  return lines.join("");
}

// ------------------------------------------------------------- hops

/** A hop cone hanging from (x, y), s its scale, turned by rot degrees. */
const hop = (x: number, y: number, s: number, rot: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="M0 0C-6 -4 -7 -12 0 -16C7 -12 6 -4 0 0Z" fill="url(#ldhop)" stroke="#14300A" stroke-width="0.8"/><path d="M-4 -5Q0 -7 4 -5M-4.6 -9.5Q0 -11.5 4.6 -9.5M-3 -13.4Q0 -15 3 -13.4" fill="none" stroke="#2E5A16" stroke-width="0.7"/><path d="M-1 -3Q-2.6 -8 -0.6 -13" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.8" fill="none"/></g>`;

/** A serrated hop leaf from (x, y), pointing rot degrees from up. */
const leaf = (x: number, y: number, s: number, rot: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="${frond(20, 8, 3)}" fill="url(#ldleaf)" stroke="#14300A" stroke-width="0.8"/><path d="M0 -2V-17" stroke="#2E5A16" stroke-width="0.7"/><path d="M-2 -4Q-4 -10 -2.4 -15" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.6" fill="none"/></g>`;

/** The hop garland swagged along the beam: a twine bine sagging between
 *  brass hooks, leaves along it, cones hanging at the low points. */
function garland(w: number, y: number) {
  const span = Math.max(64, w / Math.round(w / 78));
  const out: string[] = [];
  for (let x0 = 0, i = 0; x0 < w; x0 += span, i++) {
    const x1 = x0 + span;
    const sag = 11;
    const at = (t: number) => [
      (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * ((x0 + x1) / 2) + t * t * x1,
      y + 2 * t * (1 - t) * sag * 2,
    ];
    const d = `M${f(x0)} ${f(y)}Q${f((x0 + x1) / 2)} ${f(y + sag * 2)} ${f(x1)} ${f(y)}`;
    out.push(
      `<path d="${d}" fill="none" stroke="#14300A" stroke-width="3.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#5A8A2A" stroke-width="2" stroke-linecap="round"/>`,
    );
    [0.14, 0.32, 0.5, 0.68, 0.86].forEach((t, j) => {
      const [x, yy] = at(t);
      const side = j % 2 ? 1 : -1;
      out.push(leaf(x, yy, 0.62 + ((i + j) % 3) * 0.06, 180 + side * (40 + j * 6)));
    });
    [0.42, 0.58].forEach((t, j) => {
      const [x, yy] = at(t);
      out.push(hop(x, yy + 1, 0.5 + j * 0.08, 180 + (j ? 10 : -14)));
    });
    // the brass hook it hangs from
    out.push(
      `<circle cx="${f(x0)}" cy="${f(y - 1)}" r="2.4" fill="url(#ldbr)" stroke="${INK}" stroke-width="0.6"/><circle cx="${f(x0 - 0.7)}" cy="${f(y - 1.8)}" r="0.7" fill="#fff" fill-opacity="0.85"/>`,
    );
  }
  return out.join("");
}

// ------------------------------------------------------------- bottles

const GLASS: Record<string, readonly string[]> = {
  green: ["#7AD89A", "#1E6A3A", "#0A2A16"],
  amber: ["#FFC870", "#B8661A", "#4A2006"],
  clear: ["#EEF4F8", "#9AAAB8", "#4A5864"],
  port: ["#FF8A9A", "#8A1426", "#34040A"],
};

/** A bottle or a stein standing on the shelf at (x, y), h tall. */
function bottle(kind: number, x: number, y: number, h: number) {
  const glass = ["ldgreen", "ldamber", "ldclear", "ldport"][kind % 4];
  const outline = `stroke="${DARK}" stroke-width="0.7" stroke-linejoin="round"`;
  const label = (lx: number, ly: number, lw: number, lh: number) =>
    `<rect x="${f(lx)}" y="${f(ly)}" width="${f(lw)}" height="${f(lh)}" fill="url(#ldivory)" stroke="${INK}" stroke-width="0.4"/><path d="M${f(lx + 1)} ${f(ly + lh / 2)}H${f(lx + lw - 1)}" stroke="#9A1828" stroke-width="0.7"/>`;
  const shine = (x0: number, y0: number, y1: number) =>
    `<path d="M${f(x0)} ${f(y0)}V${f(y1)}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.8" stroke-linecap="round"/>`;
  switch (kind % 6) {
    case 0:
    case 3: {
      // a wine bottle: round shoulders, a long neck, a foil cap
      const bw = 4.6;
      const d = `M${f(x - bw)} ${f(y)}V${f(y - h * 0.55)}Q${f(x - bw)} ${f(y - h * 0.7)} ${f(x - 1.5)} ${f(y - h * 0.76)}V${f(y - h)}H${f(x + 1.5)}V${f(y - h * 0.76)}Q${f(x + bw)} ${f(y - h * 0.7)} ${f(x + bw)} ${f(y - h * 0.55)}V${f(y)}Z`;
      return `<path d="${d}" fill="url(#${glass})" ${outline}/>${label(x - bw + 1, y - h * 0.46, bw * 2 - 2, h * 0.24)}<rect x="${f(x - 1.9)}" y="${f(y - h - 0.5)}" width="3.8" height="${f(h * 0.14)}" fill="url(#ldred)" stroke="${DARK}" stroke-width="0.5"/>${shine(x - bw + 1.4, y - h * 0.54, y - 2)}`;
    }
    case 1:
    case 4: {
      // a glass stein of beer under its foam, a gold band, its handle
      const sw = 10;
      const sh = h * 0.62;
      const bx = x - sw / 2;
      const by = y - sh;
      return `<path d="M${f(bx + sw)} ${f(by + 2.5)}C${f(bx + sw + 5.5)} ${f(by + 2)} ${f(bx + sw + 5.5)} ${f(by + sh - 3)} ${f(bx + sw)} ${f(by + sh - 3.5)}" fill="none" stroke="${INKS.silver.ink}" stroke-width="2.6"/><path d="M${f(bx + sw)} ${f(by + 2.5)}C${f(bx + sw + 5.5)} ${f(by + 2)} ${f(bx + sw + 5.5)} ${f(by + sh - 3)} ${f(bx + sw)} ${f(by + sh - 3.5)}" fill="none" stroke="url(#ldsilver)" stroke-width="1.4"/>
<rect x="${f(bx)}" y="${f(by)}" width="${sw}" height="${f(sh)}" rx="1.2" fill="url(#ldbeer)" ${outline}/>
${[0.2, 0.5, 0.8].map((k) => `<circle cx="${f(bx + sw * k)}" cy="${f(by + 0.6)}" r="2.3" fill="url(#ldfoam)"/>`).join("")}
<rect x="${f(bx - 0.4)}" y="${f(by + sh - 3.2)}" width="${f(sw + 0.8)}" height="1.8" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.35"/>
${shine(bx + 1.6, by + 3, by + sh - 4)}`;
    }
    case 2: {
      // a square gin bottle, clear, a short neck
      const bw = 5.2;
      return `<path d="M${f(x - bw)} ${f(y)}V${f(y - h * 0.7)}L${f(x - 2)} ${f(y - h * 0.8)}V${f(y - h)}H${f(x + 2)}V${f(y - h * 0.8)}L${f(x + bw)} ${f(y - h * 0.7)}V${f(y)}Z" fill="url(#ldclear)" ${outline}/><rect x="${f(x - bw + 0.4)}" y="${f(y - h * 0.62)}" width="${f(bw * 2 - 0.8)}" height="${f(h * 0.6)}" fill="url(#ldamberL)" fill-opacity="0.55"/>${label(x - bw + 1.2, y - h * 0.5, bw * 2 - 2.4, h * 0.2)}<rect x="${f(x - 2.3)}" y="${f(y - h - 1)}" width="4.6" height="3" rx="0.8" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.4"/>${shine(x - bw + 1.4, y - h * 0.68, y - 2)}`;
    }
    default: {
      // a round flask of port
      const r = h * 0.3;
      const cy = y - r;
      return `<path d="M${f(x - 1.8)} ${f(cy - r + 1)}V${f(y - h)}H${f(x + 1.8)}V${f(cy - r + 1)}Z" fill="url(#ldport)" ${outline}/><circle cx="${f(x)}" cy="${f(cy)}" r="${f(r)}" fill="url(#ldport)" ${outline}/><circle cx="${f(x)}" cy="${f(y - h - 0.6)}" r="2" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.4"/><path d="M${f(x - r * 0.65)} ${f(cy - r * 0.2)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(x - r * 0.1)} ${f(cy - r * 0.68)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="0.8" stroke-linecap="round"/>`;
    }
  }
}

// ------------------------------------------------------------- floor

/** Flagstones from `y` to the foot, in courses running away from you,
 *  each slab its own shade, the mortar dark between them. */
function flags(w: number, y: number, h: number) {
  const rnd = seeded(17);
  const rows = 6;
  const cols = 7;
  const xAt = (t: number, v: number) => {
    const xt = w * 0.15 + t * w * 0.7;
    const xb = -w * 0.35 + t * w * 1.7;
    return xt + (xb - xt) * v;
  };
  const slabs: string[] = [];
  for (let r = 0; r < rows; r++) {
    const v0 = (r / rows) ** 1.45;
    const v1 = ((r + 1) / rows) ** 1.45;
    const y0 = y + (h - y) * v0;
    const y1 = y + (h - y) * v1;
    const gap = 0.7 + r * 0.35;
    const s = (r % 2) * 0.5;
    for (let c = -3; c < cols + 3; c++) {
      const t0 = (c + s) / cols;
      const t1 = (c + 1 + s) / cols;
      const a = xAt(t0, v0) + gap;
      const b = xAt(t1, v0) - gap;
      const cc = xAt(t1, v1) - gap * 1.4;
      const d = xAt(t0, v1) + gap * 1.4;
      if (Math.max(b, cc) < 0 || Math.min(a, d) > w) continue;
      const slab = `M${f(a)} ${f(y0 + gap * 0.6)}L${f(b)} ${f(y0 + gap * 0.6)}L${f(cc)} ${f(y1 - gap * 0.6)}L${f(d)} ${f(y1 - gap * 0.6)}Z`;
      const tone = rnd();
      slabs.push(
        `<path d="${slab}" fill="url(#ldstone)" stroke="#120E0A" stroke-width="0.6"/>` +
          `<path d="${slab}" fill="${tone > 0.5 ? "#FFF2D8" : "#000"}" fill-opacity="${f(Math.abs(tone - 0.5) * 0.22)}"/>` +
          `<path d="M${f(a + 1)} ${f(y0 + gap * 0.6 + 0.8)}L${f(b - 1)} ${f(y0 + gap * 0.6 + 0.8)}" stroke="#FFF2D8" stroke-opacity="0.1" stroke-width="0.8"/>`,
      );
    }
  }
  return `<rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="#120E0A"/>
${slabs.join("")}
<rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#ldvig)"/>
<rect y="${f(y)}" width="${w}" height="28" fill="url(#ldwallsh)"/>`;
}

// ------------------------------------------------------------- the room

function pubRoom(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, board: B, table: T, door: D } = R;

  // the back bar: a carved cornice, three bays of smoky mirror between
  // oak pilasters, a glass shelf of bottles across them
  const bx0 = D.x + D.w + 4;
  const bx1 = w - 4;
  const corniceY = wallTop + 4;
  const mirrorTop = corniceY + 12;
  const mirrorBottom = T.y + 4;
  const bays = 3;
  const pil = 8;
  const bayW = (bx1 - bx0 - pil) / bays;
  const rise = 14;
  const mirrors = Array.from({ length: bays }, (_, i) => {
    const x = bx0 + pil + i * bayW;
    const mw = bayW - pil;
    const streaks = [0.15, 0.55]
      .map(
        (k, j) =>
          `<path d="M${f(x + mw * k)} ${f(mirrorBottom)}L${f(x + mw * k + 34)} ${f(mirrorTop)}H${f(x + mw * k + 34 + (j ? 7 : 14))}L${f(x + mw * k + (j ? 7 : 14))} ${f(mirrorBottom)}Z" fill="#FFFFFF" fill-opacity="${j ? 0.035 : 0.05}"/>`,
      )
      .join("");
    return `<rect x="${f(x)}" y="${f(mirrorTop)}" width="${f(mw)}" height="${f(mirrorBottom - mirrorTop)}" fill="url(#ldmirror)"/>
<clipPath id="ldmc${i}"><rect x="${f(x)}" y="${f(mirrorTop)}" width="${f(mw)}" height="${f(mirrorBottom - mirrorTop)}"/></clipPath>
<g clip-path="url(#ldmc${i})">${streaks}</g>
<rect x="${f(x)}" y="${f(mirrorTop)}" width="${f(mw)}" height="${f(mirrorBottom - mirrorTop)}" fill="url(#ldglint)"/>
<path d="M${f(x)} ${f(mirrorTop + rise)}V${f(mirrorBottom)}H${f(x + mw)}V${f(mirrorTop + rise)}" fill="none" stroke="url(#ldgv)" stroke-width="1.6"/>
<path d="M${f(x)} ${f(mirrorTop)}H${f(x + mw)}V${f(mirrorTop + rise)}Q${f(x + mw / 2)} ${f(mirrorTop + 4 - rise)} ${f(x)} ${f(mirrorTop + rise)}Z" fill="url(#ldoak)" stroke="${DARK}" stroke-width="0.6"/>
<path d="M${f(x)} ${f(mirrorTop + rise)}Q${f(x + mw / 2)} ${f(mirrorTop + 4 - rise)} ${f(x + mw)} ${f(mirrorTop + rise)}" fill="none" stroke="${INK}" stroke-width="2.6"/>
<path d="M${f(x)} ${f(mirrorTop + rise)}Q${f(x + mw / 2)} ${f(mirrorTop + 4 - rise)} ${f(x + mw)} ${f(mirrorTop + rise)}" fill="none" stroke="url(#ldgh)" stroke-width="1.6"/>
<circle cx="${f(x + mw / 2)}" cy="${f(mirrorTop + 2.6)}" r="2.6" fill="url(#ldbr)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x)} ${f(mirrorTop + rise)}V${f(mirrorBottom)}H${f(x + mw)}V${f(mirrorTop + rise)}" fill="none" stroke="${INK}" stroke-width="0.5"/>`;
  }).join("");
  const pilasters = Array.from({ length: bays + 1 }, (_, i) => {
    const x = bx0 + i * bayW;
    return `<rect x="${f(x)}" y="${f(mirrorTop)}" width="${pil}" height="${f(floorY - mirrorTop)}" fill="url(#ldoakh)" stroke="${DARK}" stroke-width="0.8"/>
<path d="M${f(x + pil / 2)} ${f(mirrorTop + 10)}V${f(floorY - 8)}" stroke="${DARK}" stroke-opacity="0.7" stroke-width="1"/>
<path d="M${f(x + 1.4)} ${f(mirrorTop + 4)}V${f(floorY - 4)}" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="0.8"/>
<rect x="${f(x - 1.5)}" y="${f(mirrorTop)}" width="${pil + 3}" height="4.5" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.6"/>`;
  }).join("");
  const dentils: string[] = [];
  for (let x = bx0; x < bx1 - 3; x += 6) dentils.push(`M${f(x)} ${f(corniceY + 6)}h3.4v4.2h-3.4Z`);
  const cornice = `
<rect x="${f(bx0 - 5)}" y="${f(corniceY)}" width="${f(bx1 - bx0 + 10)}" height="12" fill="url(#ldoak)" stroke="${DARK}" stroke-width="0.8"/>
<path d="${dentils.join("")}" fill="#5A341C" stroke="${DARK}" stroke-width="0.5"/>
<rect x="${f(bx0 - 6)}" y="${f(corniceY - 1)}" width="${f(bx1 - bx0 + 12)}" height="4" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(bx0 - 4)} ${f(corniceY)}H${f(bx0 + (bx1 - bx0) * 0.4)}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>
<rect x="${f(bx0 - 4)}" y="${f(corniceY + 11)}" width="${f(bx1 - bx0 + 8)}" height="2.4" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.5"/>`;

  // the glass shelf over the slate, its bottles and steins
  const shelfY = B.y - 7;
  const kinds = [0, 1, 2, 3, 5, 1, 0, 2, 4, 3, 5, 1, 0, 4];
  const heights = [32, 24, 27, 30, 22, 24, 33, 26, 24, 31, 22, 24, 30, 24];
  const items: string[] = [];
  for (let x = bx0 + pil + 9, i = 0; x < bx1 - pil - 6; x += 15, i++) {
    items.push(bottle(kinds[i % kinds.length], x, shelfY, heights[i % heights.length]));
  }
  const shelf = `
<rect x="${f(bx0 + 2)}" y="${f(shelfY)}" width="${f(bx1 - bx0 - 4)}" height="3" fill="#C8E0E8" fill-opacity="0.45" stroke="#1E2A30" stroke-width="0.6"/>
<path d="M${f(bx0 + 4)} ${f(shelfY + 0.8)}H${f(bx1 - 4)}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.6"/>
<rect x="${f(bx0 + 2)}" y="${f(shelfY + 3)}" width="${f(bx1 - bx0 - 4)}" height="5" fill="#000" fill-opacity="0.25"/>
${Array.from({ length: bays + 1 }, (_, i) => {
    const x = bx0 + i * bayW + pil / 2;
    return `<path d="M${f(x - 6)} ${f(shelfY + 3)}H${f(x + 6)}L${f(x)} ${f(shelfY + 10)}Z" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.6"/>`;
  }).join("")}`;

  // the slate: oak in a gilt bead, chalk-dusted, a brass rosette at each
  // corner, a ledge with a stick of chalk; hop sprigs at its corner; a
  // beer mat pinned at its right end for the count
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const rosette = (x: number, y: number) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="2.3" fill="url(#ldbr)" stroke="${INK}" stroke-width="0.6"/><circle cx="${f(x - 0.7)}" cy="${f(y - 0.7)}" r="0.7" fill="#fff" fill-opacity="0.9"/>`;
  const smudges = [0.2, 0.45, 0.68]
    .map((k, i) => `<path d="M${f(B.x + B.w * k)} ${f(B.y + 14 + i * 9)}q14 -4 30 1" stroke="#F4EEDF" stroke-opacity="0.05" stroke-width="7" fill="none" stroke-linecap="round"/>`)
    .join("");
  const mat = `
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="23.5" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="23.5" fill="url(#ldgd)" stroke="${INK}" stroke-width="1.1"/>
${Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 20.8)}" cy="${f(my + Math.sin(a) * 20.8)}" r="1.25" fill="url(#ldgd)" stroke="${INK}" stroke-width="0.3"/>`;
  }).join("")}
<circle cx="${f(mx)}" cy="${f(my)}" r="19" fill="url(#ldred)" stroke="${INK}" stroke-width="0.9"/>
${Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 17.9)}" cy="${f(my + Math.sin(a) * 17.9)}" r="0.55" fill="#FFE8C8" fill-opacity="0.85"/>`;
  }).join("")}
<circle cx="${f(mx)}" cy="${f(my)}" r="16.8" fill="url(#ldivory)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  const sprig = (x: number, y: number, side: number) =>
    `${leaf(x, y, 0.62, side * 62)}${leaf(x, y, 0.55, side * 112)}${hop(x + side * 7, y + 4, 0.48, side * 160)}`;
  const slate = `
<path d="${rrect(B.x + 1, B.y + 3.5, B.w, B.h, 5)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(B.x, B.y, B.w, B.h, 5)}" fill="url(#ldoak)" stroke="${INK}" stroke-width="1.2"/>
<path d="${rrect(B.x + 2.6, B.y + 2.6, B.w - 5.2, B.h - 5.2, 4)}" fill="none" stroke="url(#ldgv)" stroke-width="1.4"/>
<path d="M${f(B.x + 6)} ${f(B.y + 1.4)}H${f(B.x + B.w * 0.42)}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="0.8" stroke-linecap="round"/>
<path d="${rrect(B.x + 5.5, B.y + 5.5, B.w - 11, B.h - 11, 3)}" fill="url(#ldslate)" stroke="${INK}" stroke-width="0.9"/>
${smudges}
<path d="${rrect(B.x + 9, B.y + 9, B.w - 18, B.h - 18, 2)}" fill="none" stroke="#F4EEDF" stroke-opacity="0.2" stroke-width="0.8" stroke-dasharray="4 2.5"/>
${rosette(B.x + 3, B.y + 3)}${rosette(B.x + B.w - 3, B.y + 3)}${rosette(B.x + 3, B.y + B.h - 3)}${rosette(B.x + B.w - 3, B.y + B.h - 3)}
<rect x="${f(B.x + 18)}" y="${f(B.y + B.h - 1)}" width="${f(B.w * 0.5)}" height="4.6" rx="1" fill="url(#ldoak)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(B.x + 19)} ${f(B.y + B.h + 3.2)}H${f(B.x + 17 + B.w * 0.5)}" stroke="#C8902E" stroke-width="1.2"/>
<rect x="${f(B.x + 28)}" y="${f(B.y + B.h - 3.2)}" width="11" height="2.6" rx="1.2" fill="#F4EEDF" stroke="#8A7A60" stroke-width="0.4"/>
<rect x="${f(B.x + 18 + B.w * 0.5 - 22)}" y="${f(B.y + B.h - 5.6)}" width="13" height="5" rx="1" fill="#3A2A1A" stroke="${DARK}" stroke-width="0.5"/>
<rect x="${f(B.x + 18 + B.w * 0.5 - 22)}" y="${f(B.y + B.h - 2.4)}" width="13" height="2" fill="#C8C0B0" fill-opacity="0.8"/>
${mat}
${sprig(B.x + 4, B.y + 6, 1)}`;

  // the bar counter: mahogany top under a brass edge, raised panels down
  // its front, a brass foot rail; the beer pulls at its far end, a stein
  // and two dice at its near end
  const cx0 = T.x - 6;
  const cx1 = w + 4;
  const top = T.y;
  const edgeY = top + 10;
  const frontTop = edgeY + 4;
  const panelW = (cx1 - cx0) / Math.max(3, Math.round((cx1 - cx0) / 56));
  const panels: string[] = [];
  for (let x = cx0; x < cx1 - 4; x += panelW) {
    const py = frontTop + 7;
    const ph = floorY - 14 - py - 6;
    panels.push(
      `<path d="${rrect(x + 6, py, panelW - 12, ph, 2)}" fill="url(#ldmahd)" stroke="${DARK}" stroke-width="0.9"/>` +
        `<path d="${rrect(x + 10, py + 4, panelW - 20, ph - 8, 1.5)}" fill="url(#ldmah)" stroke="${DARK}" stroke-width="0.6"/>` +
        `<path d="M${f(x + 7)} ${f(py + ph - 1)}H${f(x + panelW - 7)}V${f(py + 1)}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="0.8" fill="none"/>` +
        `<circle cx="${f(x)}" cy="${f(frontTop + 4)}" r="1.8" fill="url(#ldbr)" stroke="${INK}" stroke-width="0.5"/>`,
    );
  }
  const railY = floorY - 12;
  const brackets: string[] = [];
  for (let x = cx0 + 22; x < cx1; x += 64) {
    brackets.push(`<path d="M${f(x - 2)} ${f(railY - 6)}H${f(x + 2)}V${f(railY)}H${f(x - 2)}Z" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.6"/>`);
  }
  // a beer pull: an ivory handle banded in gold on a brass stem
  const pull = (x: number, hh: number) =>
    `<rect x="${f(x - 3.5)}" y="${f(top + 4)}" width="7" height="4" rx="1" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${f(x - 1.4)}" y="${f(top + 4 - hh * 0.3)}" width="2.8" height="${f(hh * 0.3)}" fill="url(#ldgh)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x - 2.4)} ${f(top + 4 - hh * 0.3)}L${f(x - 3.4)} ${f(top + 4 - hh)}Q${f(x)} ${f(top + 2 - hh)} ${f(x + 3.4)} ${f(top + 4 - hh)}L${f(x + 2.4)} ${f(top + 4 - hh * 0.3)}Z" fill="url(#ldivoryh)" stroke="${INK}" stroke-width="0.7"/>
<rect x="${f(x - 3.2)}" y="${f(top + 4 - hh * 0.62)}" width="6.4" height="2" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.4"/>
<circle cx="${f(x)}" cy="${f(top + 3 - hh)}" r="2.2" fill="url(#ldbr)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x - 2)} ${f(top + 2 - hh * 0.9)}V${f(top + 2 - hh * 0.4)}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>`;
  const pullX = T.x + T.w - 12;
  const counter = `
<rect x="${f(cx0 - 4)}" y="${f(floorY - 3)}" width="${f(cx1 - cx0 + 8)}" height="12" fill="url(#ldcsh)"/>
<rect x="${f(cx0)}" y="${f(frontTop)}" width="${f(cx1 - cx0)}" height="${f(floorY - frontTop)}" fill="url(#ldmahv)" stroke="${DARK}" stroke-width="0.9"/>
${panels.join("")}
<rect x="${f(cx0)}" y="${f(floorY - 7)}" width="${f(cx1 - cx0)}" height="7" fill="#1A0804" stroke="${DARK}" stroke-width="0.6"/>
${brackets.join("")}
<rect x="${f(cx0 + 8)}" y="${f(railY - 2.4)}" width="${f(cx1 - cx0)}" height="4.8" rx="2.4" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(cx0 + 11)} ${f(railY - 1.3)}H${f(cx1)}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.7"/>
<path d="M${f(cx0 + 5)} ${f(top)}H${f(cx1)}V${f(edgeY)}H${f(cx0)}Z" fill="url(#ldtop)" stroke="${DARK}" stroke-width="0.8"/>
<path d="M${f(cx0 + 10)} ${f(top + 2.6)}H${f(cx1)}" stroke="#FFD8B0" stroke-opacity="0.22" stroke-width="1"/>
<rect x="${f(cx0 - 1.5)}" y="${f(edgeY)}" width="${f(cx1 - cx0 + 2)}" height="4.4" rx="2" fill="url(#ldgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(cx0 + 1)} ${f(edgeY + 1)}H${f(cx0 + (cx1 - cx0) * 0.45)}" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8" stroke-linecap="round"/>
<path d="M${f(cx0)} ${f(edgeY + 4.4)}H${f(cx1)}" stroke="#000" stroke-opacity="0.45" stroke-width="2"/>
${pull(pullX - 13, 30)}${pull(pullX, 34)}
${bottle(1, T.x + 14, top + 9, 26)}
${dieBody(5, T.x + 25, top + 1, 7.5, "plain", "ldd1")}${dieBody(1, T.x + 34, top + 2.5, 6.5, "plain", "ldd2")}`;

  // the ceiling: dark boards over an oak beam strapped in iron
  const boards: string[] = [];
  for (let x = 4; x < w; x += 9) boards.push(`M${x} 0V${roof}`);
  const straps: string[] = [];
  for (let x = 30; x < w; x += 70) {
    straps.push(
      `<rect x="${f(x)}" y="${f(beam.y - 0.5)}" width="7" height="${f(beam.h + 1)}" fill="url(#ldiron)" stroke="#06080A" stroke-width="0.6"/><circle cx="${f(x + 3.5)}" cy="${f(beam.y + 3)}" r="1.1" fill="#8A929C"/><circle cx="${f(x + 3.5)}" cy="${f(beam.y + beam.h - 3)}" r="1.1" fill="#8A929C"/>`,
    );
  }

  // the wall's oak boarding either side of the bar
  const boarding: string[] = [];
  for (let x = 7; x < w; x += 14) boarding.push(`M${x} ${f(wallTop)}V${f(floorY)}`);

  return svg(
    w,
    h,
    `<defs>
${lit("ldoak", OAK, 0, 0, w * 0.5, h)}
${linear("ldoakh", OAK, false)}
${linear("ldmirror", MIRROR)}
${linear("ldmah", MAHOGANY)}
${linear("ldmahd", ["#4A1A0C", "#2E0E06"])}
${lit("ldmahv", MAHOGANY, 0, frontTop, 0, floorY)}
${linear("ldtop", ["#B05A34", "#7A3018", "#4E1A0C"])}
${linear("ldslate", SLATE)}
${linear("ldstone", STONE)}
${linear("ldgv", MATERIALS.gold)}
${linear("ldgh", MATERIALS.gold, false)}
${linear("ldsilver", MATERIALS.silver, false)}
${linear("ldiron", MATERIALS.iron, false)}
${linear("ldivory", MATERIALS.ivory)}
${linear("ldivoryh", MATERIALS.ivory, false)}
${linear("ldred", ["#E04A52", "#A8182A", "#5A0810"])}
${linear("ldhop", ["#E8F8B0", "#9ACC5A", "#4A7A1E"])}
${linear("ldleaf", MATERIALS.leaf)}
${linear("ldgreen", GLASS.green, false)}
${linear("ldamber", GLASS.amber, false)}
${linear("ldamberL", ["#FFD27A", "#C8781E"])}
${linear("ldclear", GLASS.clear, false)}
${linear("ldport", GLASS.port, false)}
${linear("ldbeer", ["#FFD27A", "#E89A2A", "#A85A10"])}
${radial("ldfoam", MATERIALS.ivory, undefined, 0.4, 0.3, 0.8)}
${radial("ldbr", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("ldgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("ldglint", ["#FFD890", "#FFD890"], [0.14, 0], 0.5, 0.25, 0.6)}
${radial("ldshade", ["#000000", "#000000"], [0, 0.6], 0.5, 0.15, 1)}
${radial("ldwarm", ["#FFC870", "#FFC870"], [0.16, 0], 0.6, 0.35, 0.65)}
${radial("ldvig", ["#000000", "#000000"], [0, 0.6], 0.5, 0.2, 0.85)}
${linear("ldwallsh", ["#000000", "#000000"], true, [0.6, 0])}
${linear("ldcsh", ["#000000", "#000000"], true, [0.55, 0])}
${linear("ldceil", ["#1E120A", "#120A04"])}
</defs>
<rect width="${w}" height="${f(floorY)}" fill="url(#ldoak)"/>
<path d="${boarding.join("")}" stroke="${DARK}" stroke-opacity="0.6" stroke-width="1"/>
${grain(0, wallTop, w, floorY - wallTop, 7, 5)}
${mirrors}
${pilasters}
${cornice}
${shelf}
${items.join("")}
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#ldwarm)"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#ldshade)"/>
${flags(w, floorY, h)}
<rect y="${f(floorY - 8)}" width="${w}" height="8" fill="#22120A" stroke="${DARK}" stroke-width="0.8"/>
${doorArt(R, floor, floors)}
${slate}
${counter}
<rect width="${w}" height="${roof + 4}" fill="url(#ldceil)"/>
<path d="${boards.join("")}" stroke="#000" stroke-opacity="0.6" stroke-width="1"/>
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<rect y="${beam.y}" width="${w}" height="${beam.h}" fill="url(#ldoak)" stroke="${DARK}" stroke-width="0.9"/>
${grain(0, beam.y, w, beam.h, 3.2, 9)}
<path d="M0 ${beam.y + 1.6}H${w}" stroke="#FFD8B0" stroke-opacity="0.22" stroke-width="0.8"/>
${straps.join("")}
${garland(w, beam.y + beam.h - 1)}`,
  );
}

// ------------------------------------------------------------- the lamp

const LAMP_W = 34;
const LAMP_H = 60;

/** A pub lamp on its rod: a green cased-glass shade on a brass cap, a
 *  brass rim, and under it an Edison bulb, amber and glowing when lit. */
function lampArt(on: boolean) {
  const c = LAMP_W / 2;
  const shadeColors = on ? ["#9AF0B8", "#2E9A5A", "#0C4A26"] : ["#4E7A5C", "#1E4A2E", "#0A2414"];
  const inside = on ? ["#FFF6D8", "#FFD890"] : ["#4A5048", "#2A2E28"];
  const bulb = on ? ["#FFFBE8", "#FFC870", "#E0802A"] : ["#C8C0B0", "#7A746A", "#3A3630"];
  const dome = `M${c - 4} 16C${c - 10} 17 ${c - 15} 25 ${c - 16} 37H${c + 16}C${c + 15} 25 ${c + 10} 17 ${c + 4} 16Z`;
  const bulbD = `M${c - 2.6} 43C${c - 2.6} 45 ${c - 6.2} 46.5 ${c - 6.2} 50.5A6.2 6.2 0 0 0 ${c + 6.2} 50.5C${c + 6.2} 46.5 ${c + 2.6} 45 ${c + 2.6} 43Z`;
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${linear("ls", shadeColors, false)}${linear("li", inside)}${radial("lb", bulb, undefined, 0.45, 0.4, 0.7)}${linear("lg", MATERIALS.gold, false)}</defs>
<path d="M${c} 0V12" stroke="#2A1A0A" stroke-width="1.6"/>
<path d="${rrect(c - 3.6, 10, 7.2, 6.5, 1.6)}" fill="url(#lg)" stroke="${INK}" stroke-width="0.7"/>
<path d="${dome}" fill="url(#ls)" stroke="#06200F" stroke-width="0.9"/>
<path d="M${c - 6} 19C${c - 11} 22 ${c - 13} 27 ${c - 13.6} 33" stroke="#FFFFFF" stroke-opacity="${on ? 0.7 : 0.35}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<path d="M${c - 16} 37Q${c} 43 ${c + 16} 37Z" fill="url(#li)" stroke="#06200F" stroke-width="0.6"/>
<path d="${rrect(c - 16.8, 35.6, 33.6, 3, 1.4)}" fill="url(#lg)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${c - 15} 36.4H${c - 2}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>
<circle cx="${c}" cy="16" r="2" fill="url(#lg)" stroke="${INK}" stroke-width="0.6"/>
<path d="${rrect(c - 2.8, 39.6, 5.6, 4, 1)}" fill="url(#lg)" stroke="${INK}" stroke-width="0.6"/>
<path d="${bulbD}" fill="url(#lb)" fill-opacity="${on ? 1 : 0.8}" stroke="${on ? "#7A3A08" : "#2A2620"}" stroke-width="0.7"/>
<path d="M${c - 1.2} 44V48M${c + 1.2} 44V48M${c - 2.4} 50l1.2 -2l1.2 2l1.2 -2l1.2 2" fill="none" stroke="${on ? "#FFFDF0" : "#4A443C"}" stroke-width="${on ? 0.8 : 0.6}" stroke-linejoin="round"/>
<path d="M${c - 4.4} 49A4.6 4.6 0 0 1 ${c - 2.2} 46" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="0.8" fill="none" stroke-linecap="round"/>`,
  );
}

const CUP_W = 34;

export const ROOM: RoomLook = {
  light: "#FFC870",
  art: pubRoom,
  lamp: { lit: () => lampArt(true), out: () => lampArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: () => cupArt(CUP_W), w: CUP_W, h: CUP_W * 1.15 },
  board: { title: "#E8DFC4", text: "#FFFDF4" },
  popup: { enamel: ["#3E9A62", "#1E6A3E", "#0C3A1E"], jewel: "amber", glow: "#FFC870" },
};

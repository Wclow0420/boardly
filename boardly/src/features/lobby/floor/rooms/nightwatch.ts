// Seal the Manor's room on its floor of the lift (../rooms.ts has
// Hustle's den, the model): the night watch's chapel in the haunted
// manor. Blue-grey ashlar under a vaulted corbel table and a dark oak tie
// beam strapped in iron, moonlit tracery windows of leaded diamond panes
// with jewelled borders, a rose window over the lift's door, clustered
// stone shafts at either side, linenfold oak panelling with a cresting of
// blind arches; the house rules on an oak board hung on chains from the
// beam, its face night-blue enamel under a carved gable with a gold
// quatrefoil, the count on a moon in a beaded silver ring; a long
// refectory table on trestles with a crimson runner, the rite's book and
// bell, and a candle in a chamberstick for each player; the floor of
// flagstones with the brass seal of the rite let into it. The lamps are
// iron candle-lanterns. As SVG markup, baked once (RoomScene).

import { toSvgBody } from "@/components/engraved/emblem";
import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { EMBLEMS } from "@/games/nightwatch/emblems";
import { doorArt, lit, svg } from "../art";
import type { RoomLayout } from "../layout";
import type { RoomLook } from "../roomTypes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const STONE_INK = "#141A2E";
const LEAD = "#10131E";
/** A steady pseudo-random number in 0..1 for `i`. */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const STONE = ["#56618A", "#3E4870", "#2A3254"];
const STONE_LIGHT = ["#9AA6CA", "#66729C", "#3E4870"];
const OAK = ["#7A5432", "#4E3220", "#2E1C10"];
const IRON = MATERIALS.iron;
const NIGHT = ["#2E4684", "#1A2A5A", "#0C1634"];
const MOONLIT = ["#B8D0F4", "#6A88C4", "#2E4684"];
const GLASS = {
  ruby: "#C2203A",
  amber: "#F2A03A",
  green: "#4E9A3A",
  blue: "#3A6AC8",
};

/** A pointed arch, x..x+w wide, its point at y, its sides springing
 *  `s` below the point and running down to y + h. */
const arch = (x: number, y: number, w: number, h: number, s: number) =>
  `M${f(x)} ${f(y + h)}V${f(y + s)}C${f(x)} ${f(y + s * 0.45)} ${f(x + w * 0.3)} ${f(y + s * 0.12)} ${f(x + w / 2)} ${f(y)}C${f(x + w * 0.7)} ${f(y + s * 0.12)} ${f(x + w)} ${f(y + s * 0.45)} ${f(x + w)} ${f(y + s)}V${f(y + h)}Z`;

/** The x in lo..hi furthest from every lamp, so what hangs there isn't
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

/** Where a point of the floor is on the screen: u across (0..1), v from
 *  the wall's foot (0) to the front (1), as the boards run (art.ts). */
const onFloor = (w: number, y0: number, h: number) => (u: number, v: number) => {
  const xt = w * 0.15 + u * w * 0.7;
  const xb = -w * 0.35 + u * w * 1.7;
  return [f(xt + (xb - xt) * v), f(y0 + (h - y0) * v)] as const;
};

/** A two-light tracery window: a stone surround, two lancets of leaded
 *  diamond panes in moonlit blue with a border of coloured glass, a
 *  quatrefoil in the head; the moon behind one of them. */
function windowArt(x: number, y: number, w: number, h: number, i: number, moon: boolean) {
  const s = w * 0.5;
  const t = 4.5;
  const mull = 4;
  const lw = (w - 2 * t - mull) / 2;
  const ly = y + s * 0.62;
  const lh = y + h - t - ly;
  const out: string[] = [];
  out.push(`<path d="${arch(x - 2, y - 2, w + 4, h + 5, s + 1)}" fill="#000" fill-opacity="0.4" transform="translate(1.2 2)"/>`);
  out.push(`<path d="${arch(x, y, w, h, s)}" fill="url(#nsl)" stroke="${STONE_INK}" stroke-width="1"/>`);
  // the head behind the lancets: dark glass with a quatrefoil
  out.push(`<path d="${arch(x + t, y + t, w - 2 * t, h - 2 * t, s - t * 0.6)}" fill="url(#nnight)" stroke="${STONE_INK}" stroke-width="0.8"/>`);
  const qx = x + w / 2;
  const qy = y + t + (ly - y - t) * 0.48;
  const qr = Math.min(lw * 0.36, (ly - y - t) * 0.26);
  const foils = [0, 1, 2, 3]
    .map((k) => {
      const a = (k * Math.PI) / 2 - Math.PI / 2;
      const c = k % 2 ? GLASS.ruby : GLASS.blue;
      return `<circle cx="${f(qx + Math.cos(a) * qr)}" cy="${f(qy + Math.sin(a) * qr)}" r="${f(qr * 0.92)}" fill="${c}" stroke="${LEAD}" stroke-width="0.8"/>`;
    })
    .join("");
  out.push(
    `<circle cx="${f(qx)}" cy="${f(qy)}" r="${f(qr * 2.15)}" fill="url(#nsl)" stroke="${STONE_INK}" stroke-width="0.8"/>${foils}<circle cx="${f(qx)}" cy="${f(qy)}" r="${f(qr * 0.7)}" fill="url(#namb)" stroke="${LEAD}" stroke-width="0.8"/><circle cx="${f(qx - qr * 0.25)}" cy="${f(qy - qr * 0.3)}" r="${f(qr * 0.2)}" fill="#fff" fill-opacity="0.8"/>`,
  );
  // the two lancets
  for (let k = 0; k < 2; k++) {
    const lx = x + t + k * (lw + mull);
    const ls = lw * 0.62;
    const id = `nlc${i}${k}`;
    const shape = arch(lx, ly, lw, lh, ls);
    const b = 2.6;
    // the coloured border, then the quarries inside it
    const border: string[] = [];
    const cols = [GLASS.ruby, GLASS.amber, GLASS.green, GLASS.amber];
    for (let yy = ly + ls, n = 0; yy < ly + lh - 1; yy += 5, n++) {
      const c = cols[(n + k + i) % cols.length];
      border.push(`<rect x="${f(lx)}" y="${f(yy)}" width="${b}" height="5" fill="${c}"/><rect x="${f(lx + lw - b)}" y="${f(yy)}" width="${b}" height="5" fill="${cols[(n + 2 + k + i) % cols.length]}"/>`);
    }
    const quarry: string[] = [];
    const step = 6;
    for (let d = -lh; d < lw + lh; d += step) {
      quarry.push(`M${f(lx + d)} ${f(ly)}L${f(lx + d + lh * 0.62)} ${f(ly + lh)}M${f(lx + d)} ${f(ly)}L${f(lx + d - lh * 0.62)} ${f(ly + lh)}`);
    }
    const moonArt =
      moon && k === 1
        ? `<circle cx="${f(lx + lw * 0.55)}" cy="${f(ly + ls * 1.1)}" r="${f(lw * 0.9)}" fill="url(#nmoonglow)"/><circle cx="${f(lx + lw * 0.55)}" cy="${f(ly + ls * 1.1)}" r="${f(lw * 0.3)}" fill="#F4F6FF" fill-opacity="0.85"/>`
        : "";
    out.push(`<defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
<path d="${shape}" fill="url(#nglass)"/>
<g clip-path="url(#${id})">${moonArt}<path d="${quarry.join("")}" stroke="${LEAD}" stroke-opacity="0.8" stroke-width="0.6"/>${border.join("")}<path d="M${f(lx + b)} ${f(ly + ls)}V${f(ly + lh)}M${f(lx + lw - b)} ${f(ly + ls)}V${f(ly + lh)}" stroke="${LEAD}" stroke-width="0.6"/></g>
<path d="${shape}" fill="none" stroke="${LEAD}" stroke-width="1.1"/>
<path d="M${f(lx + 1.4)} ${f(ly + lh - 3)}V${f(ly + ls)}Q${f(lx + 1.6)} ${f(ly + ls * 0.4)} ${f(lx + lw * 0.42)} ${f(ly + 2)}" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="0.8" stroke-linecap="round"/>`);
  }
  // the mullion between, the sill under
  out.push(
    `<rect x="${f(x + t + lw)}" y="${f(ly + lw * 0.3)}" width="${mull}" height="${f(lh - lw * 0.3)}" fill="url(#nslh)" stroke="${STONE_INK}" stroke-width="0.7"/>`,
    `<path d="M${f(x - 4)} ${f(y + h)}h${f(w + 8)}v4h${f(-(w + 8))}Z" fill="url(#nslh)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
    `<path d="M${f(x - 3)} ${f(y + h + 0.9)}H${f(x + w * 0.5)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>`,
    `<path d="${arch(x, y, w, h, s)}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="0.8" transform="translate(0.8 0.8)"/>`,
  );
  return out.join("");
}

/** The rose window over the lift's door: a stone ring, eight petals of
 *  coloured glass round an amber roundel. */
function roseArt(cx: number, cy: number, r: number) {
  const petals = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
    const c = [GLASS.ruby, GLASS.blue, GLASS.amber, GLASS.blue][k % 4];
    const px = cx + Math.cos(a) * r * 0.52;
    const py = cy + Math.sin(a) * r * 0.52;
    return `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.24)}" fill="${c}" stroke="${LEAD}" stroke-width="0.8"/><path d="M${f(cx + Math.cos(a) * r * 0.28)} ${f(cy + Math.sin(a) * r * 0.28)}L${f(cx + Math.cos(a) * r * 0.78)} ${f(cy + Math.sin(a) * r * 0.78)}" stroke="${STONE_INK}" stroke-width="1"/>`;
  }).join("");
  return `<circle cx="${f(cx + 1.2)}" cy="${f(cy + 2)}" r="${f(r + 1)}" fill="#000" fill-opacity="0.4"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#nsl)" stroke="${STONE_INK}" stroke-width="1"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.8)}" fill="url(#nglass)" stroke="${STONE_INK}" stroke-width="0.9"/>
${petals}
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.24)}" fill="url(#namb)" stroke="${LEAD}" stroke-width="0.8"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.9)}" fill="none" stroke="${STONE_INK}" stroke-opacity="0.6" stroke-width="0.6"/>
${Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2;
    return `<circle cx="${f(cx + Math.cos(a) * r * 0.9)}" cy="${f(cy + Math.sin(a) * r * 0.9)}" r="0.9" fill="#C8D0EA" fill-opacity="0.6"/>`;
  }).join("")}
<path d="M${f(cx - r * 0.8)} ${f(cy - r * 0.45)}A${f(r * 0.93)} ${f(r * 0.93)} 0 0 1 ${f(cx - r * 0.3)} ${f(cy - r * 0.88)}" stroke="#fff" stroke-opacity="0.55" stroke-width="1" fill="none" stroke-linecap="round"/>
<circle cx="${f(cx - r * 0.07)}" cy="${f(cy - r * 0.08)}" r="${f(r * 0.07)}" fill="#fff" fill-opacity="0.85"/>`;
}

/** A clustered stone shaft down one side, a leafy capital, a base. */
function shaft(x: number, top: number, bottom: number) {
  const W = 13;
  return `<rect x="${f(x)}" y="${f(top)}" width="${W}" height="${f(bottom - top)}" fill="url(#nshaft)" stroke="${STONE_INK}" stroke-width="0.8"/>
<path d="M${f(x + 4.3)} ${f(top + 8)}V${f(bottom - 8)}M${f(x + 8.7)} ${f(top + 8)}V${f(bottom - 8)}" stroke="${STONE_INK}" stroke-opacity="0.7" stroke-width="0.9"/>
<path d="M${f(x + 1.6)} ${f(top + 8)}V${f(bottom - 8)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8"/>
<path d="M${f(x - 2.5)} ${f(top)}H${f(x + W + 2.5)}L${f(x + W)} ${f(top + 8)}H${f(x)}Z" fill="url(#nslh)" stroke="${STONE_INK}" stroke-width="0.8"/>
<path d="M${f(x + 1)} ${f(top + 7)}q2.2 -5 4.4 0q2.2 -5 4.4 0" fill="none" stroke="${STONE_INK}" stroke-width="0.7"/>
<path d="M${f(x - 2.5)} ${f(bottom)}H${f(x + W + 2.5)}L${f(x + W)} ${f(bottom - 8)}H${f(x)}Z" fill="url(#nslh)" stroke="${STONE_INK}" stroke-width="0.8"/>`;
}

function chapel(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, board: B, table: T, door: D } = R;
  const toFloor = onFloor(w, floorY, h);

  // the ashlar: courses of blocks, each a shade apart, the joints dark
  const blocks: string[] = [];
  const joints: string[] = [];
  const course = 15;
  for (let r = 0, y = wallTop; y < floorY; r++, y += course) {
    joints.push(`M0 ${f(y)}H${w}`);
    const off = r % 2 ? 0 : 18;
    for (let x = -off, c = 0; x < w; x += 36, c++) {
      const v = rnd(r * 31 + c);
      if (v > 0.55) blocks.push(`<rect x="${f(x)}" y="${f(y)}" width="36" height="${course}" fill="${v > 0.8 ? "#fff" : "#000"}" fill-opacity="${v > 0.8 ? 0.05 : 0.08}"/>`);
      joints.push(`M${f(x)} ${f(y)}v${course}`);
    }
  }

  // the corbel table under the vault: little blind arches along the roof
  const corbels: string[] = [];
  for (let x = -6; x < w + 16; x += 16) corbels.push(`M${f(x)} ${f(roof - 1)}V${f(roof - 6)}Q${f(x)} ${f(roof - 13)} ${f(x + 8)} ${f(roof - 15)}Q${f(x + 16)} ${f(roof - 13)} ${f(x + 16)} ${f(roof - 6)}`);
  const ribs: string[] = [];
  for (let x = -30; x < w + 30; x += 44) ribs.push(`M${f(x)} 0L${f(x + 44)} ${f(roof - 8)}M${f(x + 44)} 0L${f(x)} ${f(roof - 8)}`);

  // the tie beam: dark oak, iron straps with rivets, gold rosettes
  const straps: string[] = [];
  const rosettes: string[] = [];
  for (let x = 30, k = 0; x < w - 10; x += 62, k++) {
    straps.push(
      `<rect x="${f(x - 4)}" y="${f(beam.y - 1)}" width="8" height="${f(beam.h + 2)}" fill="url(#niron)" stroke="#0E1014" stroke-width="0.7"/><circle cx="${f(x)}" cy="${f(beam.y + 3)}" r="1.1" fill="#C8CCD4"/><circle cx="${f(x)}" cy="${f(beam.y + beam.h - 3)}" r="1.1" fill="#C8CCD4"/>`,
    );
    const rx = x + 31;
    if (rx < w - 10)
      rosettes.push(
        `${[0, 1, 2, 3].map((q) => `<circle cx="${f(rx + Math.cos((q * Math.PI) / 2) * 2.4)}" cy="${f(beam.y + beam.h / 2 + Math.sin((q * Math.PI) / 2) * 2.4)}" r="2.2" fill="url(#ngd)" stroke="${INK}" stroke-width="0.5"/>`).join("")}<circle cx="${f(rx)}" cy="${f(beam.y + beam.h / 2)}" r="1.5" fill="${k % 2 ? GLASS.ruby : GLASS.amber}" stroke="${INK}" stroke-width="0.4"/>`,
      );
  }

  // the windows across the upper wall, over the board
  const winTop = wallTop + 8;
  const winH = B.y - 10 - winTop;
  const span = { x0: B.x + 4, x1: w - 22 };
  const n = 3;
  const gap = 20;
  const ww = Math.min(78, (span.x1 - span.x0 - gap * (n - 1)) / n);
  const total = n * ww + (n - 1) * gap;
  const wx0 = span.x0 + (span.x1 - span.x0 - total) / 2;
  const windows = Array.from({ length: n }, (_, i) => windowArt(wx0 + i * (ww + gap), winTop, ww, winH, i, i === 1)).join("");
  // moonlight falling from them, faint, down to the floor
  const shafts = Array.from({ length: n }, (_, i) => {
    const x = wx0 + i * (ww + gap);
    return `<path d="M${f(x + 6)} ${f(winTop + winH * 0.4)}H${f(x + ww - 6)}L${f(x + ww - 40)} ${f(h)}H${f(x - 60)}Z" fill="url(#nshaftlight)"/>`;
  }).join("");
  const roseR = Math.min(24, D.w * 0.24, (D.y - 20 - wallTop) / 2 - 3);
  // over the lift's door, where the lamps leave it most room
  const roseX = clearest(R, D.x + roseR + 4, D.x + D.w + 4);
  const rose = roseArt(roseX, wallTop + 6 + roseR + ((D.y - 20 - wallTop) - 2 * roseR - 6) / 2, roseR);

  // linenfold panelling along the wall's foot, a cresting of arches
  const panelTop = B.y + B.h + 12;
  const pw = 30;
  const panels: string[] = [];
  for (let x = 4; x + pw - 4 < w; x += pw) {
    const px = x + 3;
    const py = panelTop + 9;
    const ph = floorY - 12 - py;
    const folds = [0.25, 0.5, 0.75]
      .map(
        (k) =>
          `<path d="M${f(px + (pw - 6) * k - 1.5)} ${f(py + 5)}V${f(py + ph - 5)}" stroke="#1A0E06" stroke-width="1.2"/><path d="M${f(px + (pw - 6) * k + 0.4)} ${f(py + 5)}V${f(py + ph - 5)}" stroke="#C89A6A" stroke-opacity="0.35" stroke-width="0.8"/>`,
      )
      .join("");
    panels.push(
      `<path d="${rrect(px, py, pw - 6, ph, 2)}" fill="#24140A" fill-opacity="0.55" stroke="#140A04" stroke-width="0.8"/>${folds}<path d="M${f(px + 2)} ${f(py + 5)}q${f((pw - 10) / 4)} -3.5 ${f((pw - 10) / 2)} 0q${f((pw - 10) / 4)} -3.5 ${f((pw - 10) / 2)} 0M${f(px + 2)} ${f(py + ph - 5)}q${f((pw - 10) / 4)} 3.5 ${f((pw - 10) / 2)} 0q${f((pw - 10) / 4)} 3.5 ${f((pw - 10) / 2)} 0" fill="none" stroke="#1A0E06" stroke-width="0.9"/>`,
    );
  }
  const cresting: string[] = [];
  for (let x = 0; x < w; x += 10) cresting.push(`M${f(x)} ${f(panelTop + 8)}V${f(panelTop + 5)}Q${f(x)} ${f(panelTop + 1.5)} ${f(x + 5)} ${f(panelTop)}Q${f(x + 10)} ${f(panelTop + 1.5)} ${f(x + 10)} ${f(panelTop + 5)}`);

  // the flagstones: rows growing towards you, staggered, each its tone
  const rows = 6;
  const vAt = (k: number) => (k / rows) ** 1.35;
  const flags: string[] = [];
  const grout: string[] = [];
  for (let r = 0; r < rows; r++) {
    const v0 = vAt(r);
    const v1 = vAt(r + 1);
    const across = 8;
    const off = r % 2 ? 0.5 / across : 0;
    for (let c = -1; c <= across; c++) {
      const u0 = Math.max(-0.4, c / across + off);
      const u1 = Math.min(1.4, (c + 1) / across + off);
      if (u1 <= u0) continue;
      const a = toFloor(u0, v0);
      const b = toFloor(u1, v0);
      const cc = toFloor(u1, v1);
      const d = toFloor(u0, v1);
      const tone = rnd(r * 17 + c * 5 + 3);
      flags.push(`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${cc[0]} ${cc[1]}L${d[0]} ${d[1]}Z" fill="${tone > 0.5 ? "#fff" : "#000"}" fill-opacity="${f(0.03 + Math.abs(tone - 0.5) * 0.12)}"/>`);
      grout.push(`M${a[0]} ${a[1]}L${d[0]} ${d[1]}`);
      grout.push(`M${f(a[0] + 1)} ${f(a[1] + 1.2)}L${f(b[0] - 1)} ${f(b[1] + 1.2)}`);
    }
    const l = toFloor(-0.4, v0);
    const rr = toFloor(1.4, v0);
    grout.push(`M${l[0]} ${l[1]}L${rr[0]} ${rr[1]}`);
  }

  // the seal of the rite let into the floor in brass: two rings, the
  // marks between them, a seven-pointed star
  const ring = (ru: number, rv: number, cu = 0.5, cv = 0.52) =>
    `M${Array.from({ length: 73 }, (_, i) => {
      const a = (i / 72) * Math.PI * 2;
      const p = toFloor(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv);
      return `${p[0]} ${p[1]}`;
    }).join("L")}Z`;
  const star = (() => {
    const pts = Array.from({ length: 7 }, (_, i) => {
      const a = ((i * 3) / 7) * Math.PI * 2 - Math.PI / 2;
      return toFloor(0.5 + Math.cos(a) * 0.17, 0.52 + Math.sin(a) * 0.125);
    });
    return `M${pts.map((p) => `${p[0]} ${p[1]}`).join("L")}Z`;
  })();
  const marks = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const p = toFloor(0.5 + Math.cos(a) * 0.2, 0.52 + Math.sin(a) * 0.148);
    const q = toFloor(0.5 + Math.cos(a) * 0.218, 0.52 + Math.sin(a) * 0.162);
    return `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
  }).join("");
  const seal = `
<path d="${ring(0.235, 0.172)}" fill="#000" fill-opacity="0.18"/>
<g transform="translate(0 1.4)" stroke="#120A04" stroke-opacity="0.7" fill="none"><path d="${ring(0.235, 0.172)}" stroke-width="2.6"/><path d="${ring(0.19, 0.138)}" stroke-width="1.8"/><path d="${star}" stroke-width="1.6" stroke-linejoin="round"/></g>
<path d="${ring(0.235, 0.172)}" fill="none" stroke="url(#nbrass)" stroke-width="1.8"/>
<path d="${ring(0.19, 0.138)}" fill="none" stroke="url(#nbrass)" stroke-width="1.1"/>
<path d="${marks}" stroke="#E2B04A" stroke-opacity="0.7" stroke-width="0.9"/>
<path d="${star}" fill="none" stroke="url(#nbrass)" stroke-width="1" stroke-linejoin="round"/>
<path d="${ring(0.05, 0.037)}" fill="url(#namb)" fill-opacity="0.28" stroke="url(#nbrass)" stroke-width="1"/>`;

  // the house rules board: oak hung on iron chains, a gilt fillet round
  // its night-blue face, iron corner straps, a carved gable with a gold
  // quatrefoil and an amber; the count on a moon in a beaded silver ring
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const gx = B.x + (B.w - 50) / 2;
  const chains = [B.x + 24, B.x + B.w - 54]
    .map(
      (x) =>
        `<path d="M${f(x)} ${f(beam.y + beam.h)}V${f(B.y + 2)}" stroke="#0E1014" stroke-width="3" stroke-dasharray="3.2 1.4"/><path d="M${f(x)} ${f(beam.y + beam.h)}V${f(B.y + 2)}" stroke="#9AA2AE" stroke-width="1.4" stroke-dasharray="2.2 2.4"/>`,
    )
    .join("");
  const strap = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})"><path d="M0 0H13L10 3.5H3.5V10L0 13Z" fill="url(#niron)" stroke="#0E1014" stroke-width="0.7"/><circle cx="2" cy="2" r="0.9" fill="#D8DCE4"/><circle cx="7.5" cy="1.8" r="0.7" fill="#D8DCE4"/><circle cx="1.8" cy="7.5" r="0.7" fill="#D8DCE4"/></g>`;
  const gable = `M${f(gx - 22)} ${f(B.y + 1)}C${f(gx - 12)} ${f(B.y - 1)} ${f(gx - 5)} ${f(B.y - 6)} ${f(gx)} ${f(B.y - 17)}C${f(gx + 5)} ${f(B.y - 6)} ${f(gx + 12)} ${f(B.y - 1)} ${f(gx + 22)} ${f(B.y + 1)}Z`;
  const crockets = [-1, 1]
    .map((k) => [0.35, 0.68].map((tt) => `<circle cx="${f(gx + k * 22 * (1 - tt) )}" cy="${f(B.y + 1 - 18 * tt * tt)}" r="1.8" fill="url(#ngd)" stroke="${INK}" stroke-width="0.5"/>`).join(""))
    .join("");
  const quat = [0, 1, 2, 3]
    .map((q) => `<circle cx="${f(gx + Math.cos((q * Math.PI) / 2) * 3.2)}" cy="${f(B.y - 5 + Math.sin((q * Math.PI) / 2) * 3.2)}" r="2.9" fill="url(#ngd)" stroke="${INK}" stroke-width="0.6"/>`)
    .join("");
  const beads = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 20.6)}" cy="${f(my + Math.sin(a) * 20.6)}" r="1.4" fill="url(#nsv)" stroke="${INKS.silver.ink}" stroke-width="0.35"/>`;
  }).join("");
  const boardArt = `
${chains}
<path d="${rrect(B.x + 1.5, B.y + 3.5, B.w, B.h, 4)}" fill="#000" fill-opacity="0.5"/>
<path d="${gable}" fill="url(#noakv)" stroke="#1A0E06" stroke-width="0.9"/>
<path d="${gable}" fill="none" stroke="#E8C8A0" stroke-opacity="0.25" stroke-width="0.7" transform="translate(0.6 1.4) scale(1 1)"/>
${crockets}
<circle cx="${f(gx)}" cy="${f(B.y - 18)}" r="2.2" fill="url(#ngd)" stroke="${INK}" stroke-width="0.6"/>
<path d="${rrect(B.x, B.y, B.w, B.h, 4)}" fill="url(#noakv)" stroke="#1A0E06" stroke-width="1.2"/>
<path d="${rrect(B.x + 2.4, B.y + 2.4, B.w - 4.8, B.h - 4.8, 3)}" fill="none" stroke="#1A0E06" stroke-opacity="0.8" stroke-width="0.7"/>
<path d="M${f(B.x + 6)} ${f(B.y + 1.6)}H${f(B.x + B.w * 0.42)}" stroke="#F0D0A8" stroke-opacity="0.4" stroke-width="0.9" stroke-linecap="round"/>
<path d="${rrect(B.x + 5, B.y + 5, B.w - 10, B.h - 10, 2.5)}" fill="url(#ngv)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rrect(B.x + 7, B.y + 7, B.w - 14, B.h - 14, 2)}" fill="url(#nface)" stroke="${INK}" stroke-width="0.8"/>
<path d="${rrect(B.x + 9.5, B.y + 9.5, B.w - 19, B.h - 19, 1.5)}" fill="none" stroke="#9AB8E8" stroke-opacity="0.22" stroke-width="0.6"/>
<path d="M${f(B.x + 10)} ${f(B.y + 9)}H${f(B.x + B.w * 0.4)}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="0.9" stroke-linecap="round"/>
${strap(B.x - 1, B.y - 1, 1, 1)}${strap(B.x - 1, B.y + B.h + 1, 1, -1)}${strap(B.x + B.w - 52, B.y - 1, -1, 1)}${strap(B.x + B.w - 52, B.y + B.h + 1, -1, -1)}
${quat}
<circle cx="${f(gx)}" cy="${f(B.y - 5)}" r="2.3" fill="url(#namb)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${f(gx - 0.8)}" cy="${f(B.y - 5.9)}" r="0.7" fill="#fff" fill-opacity="0.9"/>
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="24" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="24" fill="url(#nsv)" stroke="${INKS.silver.ink}" stroke-width="1.1"/>
${beads}
<circle cx="${f(mx)}" cy="${f(my)}" r="17.4" fill="url(#nmoon)" stroke="${INKS.silver.ink}" stroke-width="0.9"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="15.6" fill="none" stroke="#8EA3BC" stroke-opacity="0.5" stroke-width="0.6"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

  // the refectory table: a thick oak top, its edge, an apron carved with
  // blind arches, trestle ends on wide feet, a pegged stretcher; the
  // crimson runner down its middle; the rite's book and bell
  const top = T.y;
  const edgeY = top + 11;
  const apronY = edgeY + 7;
  const apronH = 17;
  const legW = 13;
  const legs = [T.x + 14, T.x + T.w - 14 - legW];
  const arches: string[] = [];
  for (let x = T.x + 10; x + 16 <= T.x + T.w - 8; x += 18) arches.push(`M${f(x)} ${f(apronY + apronH - 3)}V${f(apronY + 8)}Q${f(x)} ${f(apronY + 3.5)} ${f(x + 8)} ${f(apronY + 2.5)}Q${f(x + 16)} ${f(apronY + 3.5)} ${f(x + 16)} ${f(apronY + 8)}V${f(apronY + apronH - 3)}`);
  const cx = T.x + T.w / 2;
  const runW = Math.min(46, T.w * 0.17);
  const runner = `
<path d="M${f(cx - runW / 2 + 3)} ${f(top)}H${f(cx + runW / 2 - 3)}L${f(cx + runW / 2)} ${f(edgeY)}H${f(cx - runW / 2)}Z" fill="url(#nrun)" stroke="#3A0408" stroke-width="0.7"/>
<path d="M${f(cx - runW / 2)} ${f(edgeY)}H${f(cx + runW / 2)}V${f(apronY + apronH + 4)}L${f(cx)} ${f(apronY + apronH + 12)}L${f(cx - runW / 2)} ${f(apronY + apronH + 4)}Z" fill="url(#nrunv)" stroke="#3A0408" stroke-width="0.8"/>
<path d="M${f(cx - runW / 2 + 3)} ${f(edgeY + 2)}V${f(apronY + apronH + 3)}L${f(cx)} ${f(apronY + apronH + 9.5)}L${f(cx + runW / 2 - 3)} ${f(apronY + apronH + 3)}V${f(edgeY + 2)}" fill="none" stroke="url(#ngs)" stroke-width="1"/>
<circle cx="${f(cx)}" cy="${f(apronY + apronH + 12.5)}" r="2.2" fill="url(#ngd)" stroke="${INK}" stroke-width="0.6"/>
${[0, 1, 2, 3].map((q) => `<circle cx="${f(cx + Math.cos((q * Math.PI) / 2 + Math.PI / 4) * 3)}" cy="${f(apronY + 8 + Math.sin((q * Math.PI) / 2 + Math.PI / 4) * 3)}" r="2.6" fill="url(#ngd)" stroke="${INK}" stroke-width="0.5"/>`).join("")}
<circle cx="${f(cx)}" cy="${f(apronY + 8)}" r="1.8" fill="url(#nrub)" stroke="${INK}" stroke-width="0.5"/>`;
  const emblem = (name: "book" | "bell", x: number, s: number) => {
    const e = EMBLEMS[name];
    return e ? `<g transform="translate(${f(x - s / 2)} ${f(edgeY + 2 - s)}) scale(${f(s / 48)})">${toSvgBody(e, undefined, `n${name}`)}</g>` : "";
  };
  const tableArt = `
<path d="M${f(T.x + 4)} ${f(floorY + 2)}H${f(T.x + T.w - 4)}" stroke="#000" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
<rect x="${f(legs[0] + legW / 2)}" y="${f(floorY - 24)}" width="${f(legs[1] - legs[0])}" height="6" fill="url(#noakh)" stroke="#1A0E06" stroke-width="0.8"/>
${legs
    .map(
      (x) => `<path d="M${f(x)} ${f(apronY + apronH)}H${f(x + legW)}V${f(floorY - 9)}H${f(x + legW + 7)}Q${f(x + legW + 10)} ${f(floorY - 9)} ${f(x + legW + 10)} ${f(floorY - 5)}V${f(floorY + 1)}H${f(x - 10)}V${f(floorY - 5)}Q${f(x - 10)} ${f(floorY - 9)} ${f(x - 7)} ${f(floorY - 9)}H${f(x)}Z" fill="url(#noakh)" stroke="#1A0E06" stroke-width="0.9"/>
<path d="M${f(x + 2)} ${f(apronY + apronH + 2)}V${f(floorY - 11)}" stroke="#F0D0A8" stroke-opacity="0.25" stroke-width="0.8"/>
<path d="M${f(x + legW / 2)} ${f(apronY + apronH + 8)}l3 6l-3 6l-3 -6Z" fill="#1A0E06" fill-opacity="0.6"/>
<circle cx="${f(x + legW / 2)}" cy="${f(floorY - 21)}" r="1.6" fill="url(#niron)" stroke="#0E1014" stroke-width="0.5"/>`,
    )
    .join("")}
<path d="M${f(T.x + 9)} ${f(top)}H${f(T.x + T.w - 9)}L${f(T.x + T.w)} ${f(edgeY)}H${f(T.x)}Z" fill="url(#noaktop)" stroke="#1A0E06" stroke-width="0.8"/>
<path d="M${f(T.x + 5)} ${f(top + 4)}H${f(T.x + T.w - 5)}M${f(T.x + 2.5)} ${f(top + 7.6)}H${f(T.x + T.w - 2.5)}" stroke="#1A0E06" stroke-opacity="0.45" stroke-width="0.7"/>
<rect x="${f(T.x - 3)}" y="${f(edgeY)}" width="${f(T.w + 6)}" height="7" rx="1.5" fill="url(#noakv)" stroke="#1A0E06" stroke-width="0.9"/>
<path d="M${f(T.x)} ${f(edgeY + 1.2)}H${f(T.x + T.w * 0.5)}" stroke="#F0D0A8" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>
<rect x="${f(T.x + 4)}" y="${f(apronY)}" width="${f(T.w - 8)}" height="${apronH}" fill="url(#noakv)" stroke="#1A0E06" stroke-width="0.8"/>
<path d="${arches.join("")}" fill="none" stroke="#1A0E06" stroke-width="1.1"/>
<path d="${arches.join("")}" fill="none" stroke="#E8C8A0" stroke-opacity="0.22" stroke-width="0.7" transform="translate(0.8 0.8)"/>
${runner}
${emblem("book", T.x + 20, 22)}${emblem("bell", T.x + T.w - 17, 17)}`;

  return svg(
    w,
    h,
    `<defs>
${lit("nstone", STONE, 0, wallTop, w * 0.3, floorY + 60)}
${linear("nsl", STONE_LIGHT)}
${linear("nslh", STONE_LIGHT, false)}
${lit("nshaft", ["#9AA6CA", "#66729C", "#3E4870", "#56618A"], 0, 0, 13, 0)}
${linear("nroof", ["#222A46", "#161C32", "#0C1020"])}
${linear("nnight", ["#22356A", "#0C1634"])}
${lit("nglass", MOONLIT, 0, wallTop, 0, R.board.y)}
${radial("nmoonglow", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.9, 0.4, 0])}
${radial("namb", ["#FFF4C4", "#FFB23A", "#A8481A"], undefined, 0.38, 0.32, 0.75)}
${radial("nrub", ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.38, 0.32, 0.75)}
${linear("nface", NIGHT)}
${linear("noakv", OAK)}
${linear("noakh", OAK, false)}
${linear("noaktop", ["#8A6440", "#6A4A2C", "#4E3420"])}
${linear("niron", IRON)}
${linear("ngv", MATERIALS.gold)}
${linear("ngs", MATERIALS.gold, false)}
${linear("nbrass", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"], false)}
${radial("ngd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("nsv", ["#FFFFFF", "#C9D0DA", "#6A7484"], undefined, 0.38, 0.32, 0.75)}
${radial("nmoon", ["#FFFFFF", "#F2F4FA", "#C8D0E2"], undefined, 0.4, 0.35, 0.75)}
${linear("nrun", ["#B01E30", "#8A1424"])}
${linear("nrunv", ["#C2203A", "#8A1424", "#4A0610"])}
${linear("npan", ["#4E3220", "#3A2416", "#24140A"])}
${linear("nfloor", ["#4A4E62", "#3A3E52", "#262A3A"])}
${linear("nshaftlight", ["#B8D0F4", "#B8D0F4"], true, [0.07, 0])}
${radial("nmoonwall", ["#9AB8E8", "#9AB8E8"], [0.16, 0], 0.62, 0.0, 0.6)}
${radial("nwarm", ["#FFB066", "#FFB066"], [0.13, 0], 0.55, 0.95, 0.6)}
${radial("nshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.15, 1)}
${radial("nvig", ["#000000", "#000000"], [0, 0.6], 0.5, 0.2, 0.85)}
${linear("nwallsh", ["#000000", "#000000"], true, [0.55, 0])}
</defs>
<rect width="${w}" height="${f(floorY)}" fill="url(#nstone)"/>
${blocks.join("")}
<path d="${joints.join("")}" stroke="${STONE_INK}" stroke-opacity="0.55" stroke-width="0.9"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#nmoonwall)"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#nshade)"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#nwarm)"/>
${windows}
${rose}
<rect y="${f(panelTop)}" width="${w}" height="${f(floorY - panelTop)}" fill="url(#npan)" stroke="#140A04" stroke-width="0.8"/>
${panels.join("")}
<path d="${cresting.join("")}" fill="none" stroke="#140A04" stroke-width="1"/>
<path d="${cresting.join("")}" fill="none" stroke="#C89A6A" stroke-opacity="0.3" stroke-width="0.6" transform="translate(0.6 0.8)"/>
<rect x="-2" y="${f(panelTop - 3)}" width="${w + 4}" height="5" fill="url(#noakv)" stroke="#140A04" stroke-width="0.8"/>
<path d="M0 ${f(panelTop - 2)}H${w}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>
${shaft(0, wallTop, floorY)}${shaft(w - 13, wallTop, floorY)}
<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#nfloor)"/>
${flags.join("")}
<path d="${grout.join("")}" stroke="#12141E" stroke-opacity="0.65" stroke-width="1"/>
${seal}
<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#nvig)"/>
<rect y="${f(floorY)}" width="${w}" height="26" fill="url(#nwallsh)"/>
<rect y="${f(floorY - 9)}" width="${w}" height="9" fill="url(#nslh)" stroke="${STONE_INK}" stroke-width="0.8"/>
<path d="M0 ${f(floorY - 8)}H${w}" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/>
${doorArt(R, floor, floors)}
${tableArt}
${shafts}
<rect width="${w}" height="${roof}" fill="url(#nroof)"/>
<path d="${ribs.join("")}" stroke="#4A5578" stroke-opacity="0.5" stroke-width="1.6"/>
<path d="${corbels.join("")}" fill="none" stroke="#0A0E1A" stroke-width="2.2"/>
<path d="${corbels.join("")}" fill="none" stroke="#7A86AE" stroke-width="1"/>
<rect y="${f(roof - 3)}" width="${w}" height="3" fill="url(#nslh)"/>
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<rect x="-2" y="${beam.y}" width="${w + 4}" height="${beam.h}" fill="url(#noakv)" stroke="#140A04" stroke-width="0.9"/>
<path d="M0 ${beam.y + 2}H${w}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.8"/>
${straps.join("")}
${rosettes.join("")}
${boardArt}`,
  );
}

// ------------------------------------------------------------- the lamp

const LAMP_W = 30;
const LAMP_H = 68;

/** An iron candle-lantern: a ring and a pointed roof, four panes of
 *  glass in an iron frame round a candle, a turned foot; lit, the glass
 *  warm with the flame, out, dark with the moon on it. */
function lanternArt(on: boolean) {
  const c = LAMP_W / 2;
  const g0 = 24;
  const g1 = 51;
  const glass = on ? ["#FFF6D0", "#FFC46A", "#E07A2A", "#7A2A08"] : ["#5A6A8A", "#2A3450", "#141A2A", "#0A0E18"];
  return svg(
    LAMP_W,
    LAMP_H,
    `<defs>${radial("lg", glass, undefined, 0.5, 0.5, 0.7)}${linear("li", IRON, false)}${linear("lw", MATERIALS.ivory, false)}${radial("lf", ["#FFFFFF", "#FFE07A", "#FF8A2A"], undefined, 0.5, 0.65, 0.6)}</defs>
<circle cx="${c}" cy="4" r="3" fill="none" stroke="#0E1014" stroke-width="2.2"/>
<circle cx="${c}" cy="4" r="3" fill="none" stroke="#8A909A" stroke-width="0.9"/>
<path d="M${c} 7L${c + 11} 19H${c - 11}Z" fill="url(#li)" stroke="#0E1014" stroke-width="0.9"/>
<path d="M${c - 1} 9L${c - 8} 17.5" stroke="#fff" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>
<path d="${rrect(c - 12, 19, 24, 5, 1)}" fill="url(#li)" stroke="#0E1014" stroke-width="0.8"/>
<rect x="${c - 10}" y="${g0}" width="20" height="${g1 - g0}" fill="url(#lg)"/>
${
  on
    ? `<circle cx="${c}" cy="${g0 + 9}" r="7" fill="#FFF2B0" fill-opacity="0.45"/><rect x="${c - 2.6}" y="${g0 + 14}" width="5.2" height="${g1 - g0 - 15}" rx="1" fill="url(#lw)" stroke="#8A7A5A" stroke-width="0.5"/><path d="M${c} ${g0 + 5}C${c + 3} ${g0 + 9} ${c + 2.4} ${g0 + 13} ${c} ${g0 + 13.5}C${c - 2.4} ${g0 + 13} ${c - 3} ${g0 + 9} ${c} ${g0 + 5}Z" fill="url(#lf)"/>`
    : `<rect x="${c - 2.6}" y="${g0 + 14}" width="5.2" height="${g1 - g0 - 15}" rx="1" fill="#8A8678" stroke="#3A3428" stroke-width="0.5"/><path d="M${c} ${g0 + 14}v-2.5" stroke="#1A1410" stroke-width="0.8"/><path d="M${c - 7} ${g0 + 3}L${c - 3} ${g0 + 3}L${c - 7} ${g0 + 12}Z" fill="#B8D0F4" fill-opacity="0.25"/>`
}
<path d="M${c - 10} ${g0}V${g1}M${c + 10} ${g0}V${g1}" stroke="#0E1014" stroke-width="2.6"/>
<path d="M${c - 10} ${g0}V${g1}M${c + 10} ${g0}V${g1}" stroke="url(#li)" stroke-width="1.4"/>
<path d="M${c} ${g0}V${g1}M${c - 10} ${(g0 + g1) / 2 + 4}H${c + 10}" stroke="#0E1014" stroke-width="1" stroke-opacity="0.85"/>
<path d="M${c - 8.5} ${g0 + 2}V${g1 - 4}" stroke="#fff" stroke-opacity="${on ? 0.55 : 0.3}" stroke-width="0.8"/>
<path d="${rrect(c - 12, g1, 24, 5, 1)}" fill="url(#li)" stroke="#0E1014" stroke-width="0.8"/>
<path d="M${c - 7} ${g1 + 5}H${c + 7}L${c + 2} ${g1 + 11}H${c - 2}Z" fill="url(#li)" stroke="#0E1014" stroke-width="0.8"/>
<circle cx="${c}" cy="${g1 + 13.5}" r="2.6" fill="url(#li)" stroke="#0E1014" stroke-width="0.7"/>
<path d="M${c - 10} ${g0 + 0.6}H${c + 2}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>`,
  );
}

// ------------------------------------------------------------- the piece

const CANDLE_W = 18;
const CANDLE_H = 42;

/** A candle in a brass chamberstick, alight. */
function candleArt() {
  const c = CANDLE_W / 2;
  return svg(
    CANDLE_W,
    CANDLE_H,
    `<defs>${radial("ch", ["#FFE2A0", "#FFB060", "#FFB060"], [0.8, 0.3, 0])}${linear("cw", MATERIALS.ivory, false)}${linear("cb", MATERIALS.gold)}${radial("cf", ["#FFFFFF", "#FFE07A", "#FF8A2A"], undefined, 0.5, 0.65, 0.6)}</defs>
<circle cx="${c}" cy="8" r="8" fill="url(#ch)"/>
<path d="M${c - 3.2} 14.5H${c + 3.2}V35H${c - 3.2}Z" fill="url(#cw)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${c + 3.2} 15.5q-1.6 1.4 -1 4.6q0.4 1.6 1 0.6" fill="#F4EEDF" stroke="${VEIN}" stroke-width="0.4"/>
<path d="M${c - 2.2} 16V33" stroke="#fff" stroke-opacity="0.9" stroke-width="0.8"/>
<path d="M${c} 14.5v-2" stroke="#2A1A08" stroke-width="0.8"/>
<path d="M${c} 3C${c + 3.2} 7.5 ${c + 2.6} 12 ${c} 12.6C${c - 2.6} 12 ${c - 3.2} 7.5 ${c} 3Z" fill="url(#cf)" stroke="#C8501A" stroke-width="0.4"/>
<path d="M${c - 5} 34.5H${c + 5}L${c + 4} 37H${c - 4}Z" fill="url(#cb)" stroke="${INK}" stroke-width="0.6"/>
<path d="M1 37.5Q${c} 35.5 ${CANDLE_W - 1} 37.5Q${CANDLE_W} 40.5 ${c} 41Q0 40.5 1 37.5Z" fill="url(#cb)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${CANDLE_W - 1} 38.4q2.2 0.2 1.6 1.8" fill="none" stroke="url(#cb)" stroke-width="1.2"/>
<path d="M2.6 37.6Q${c} 36.4 ${c + 2} 36.8" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.6"/>`,
  );
}

export const ROOM: RoomLook = {
  light: "#FFB066",
  art: chapel,
  lamp: { lit: () => lanternArt(true), out: () => lanternArt(false), w: LAMP_W, h: LAMP_H },
  piece: { art: candleArt, w: CANDLE_W, h: CANDLE_H },
  board: { title: "#F0CC72", text: "#EEF2FF" },
  popup: { enamel: ["#5A78B8", "#22356A", "#0C1634"], jewel: "amber", glow: "#FFB066" },
};

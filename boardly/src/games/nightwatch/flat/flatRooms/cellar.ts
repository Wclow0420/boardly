// Seal the Manor's cellar, seen flat on (the iso one is rooms/cellar.ts):
// a stone cellar under the house under a brick barrel vault. In the back
// wall a brick-arched niche where three casks lie on their cradle, their
// heads towards you (iron hoops, a brass tap, chalk tallies); a rack of
// sealed bottles beside it; a barred window high up letting in the moon;
// an iron lantern hung from the vault; crates and grain sacks along the
// left wall, cobwebs in the corners, water dripping from the vault into
// puddles on the flagstones. In the middle of the floor the trapdoor to
// the passage under the house — the thing that works the room: touched,
// its lid slides away from the dark shaft and its ladder. As SVG markup,
// baked once (FlatRoom); the lid, the lantern's flame, the moonlight and
// the drips live.

import { Skia } from "@shopify/react-native-skia";

import { linear, radial } from "@/components/engraved/panel";
import { MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { Side } from "../../roomScenes";
import { manorMapArt, notebookArt, notebookOn } from "../keepsakes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  f,
  floorShade,
  partDefs,
  plateBox,
  poly,
  rnd,
  spillArt,
  svg,
  type P2,
} from "../parts";
import {
  ashlar,
  cobweb,
  crate,
  disc,
  face,
  flagFloor,
  flameAt,
  floorShadow,
  lunette,
  metalDefs,
  oval,
  partBDefs,
  stoneSideWall,
  vaultArt,
  type Flame,
  type P3,
} from "./partsB";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const STONE = ["#4C505C", "#424652", "#565A66", "#484C58", "#3E4250"];
const FLAGS = ["#3E424C", "#363A44", "#454950", "#3A3E48"];
const BRICK = ["#5A3228", "#4A2820", "#64382C", "#522E26"];
const LIGHT = "#FFB45E";

/** Where the cellar's pieces stand, for a layout. */
export function cellarPlan(L: FlatLayout, _exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, vx, at, k } = L;
  const W = bx1 - bx0;
  const spring = Math.round(ceil + wallH * 0.3);
  // the niche of casks in the middle of the back wall
  const nr = Math.min(W * 0.21, (L.doors.right.x - 10 - vx) * 1.0 + 8);
  const niche = { cx: vx - 6, r: nr, spring: floorY - wallH * 0.3 };
  const cr = nr * 0.43;
  const casks = [
    { x: niche.cx - cr * 1.02, y: floorY - 8 - cr, r: cr, tap: true },
    { x: niche.cx + cr * 1.02, y: floorY - 8 - cr, r: cr, tap: true },
    { x: niche.cx, y: floorY - 8 - cr * 2.72, r: cr * 0.92, tap: false },
  ];
  // the wine rack left of it
  const rack = { x0: bx0 + 6, x1: niche.cx - nr - 12, y0: floorY - wallH * 0.56, y1: floorY - 4 };
  // the barred window high in the lunette
  const win = { x: niche.cx - W * 0.075, y: niche.spring - nr - 14 - wallH * 0.17, w: W * 0.15, h: wallH * 0.14 };
  // the lantern hung from the vault
  const lz = 44;
  const [lx, ly] = at(niche.cx - nr * 1.25, ceil + wallH * 0.37, lz);
  const ls = k(lz) * 1.35;
  const flames: Flame[] = [flameAt(lx, ly + 2 * ls, ls * 0.95)];
  // the trapdoor in the floor
  const td = { x0: vx - W * 0.14, x1: vx + W * 0.14, z0: 12, z1: 74 };
  const corners = [
    at(td.x0, floorY, td.z0),
    at(td.x1, floorY, td.z0),
    at(td.x1, floorY, td.z1),
    at(td.x0, floorY, td.z1),
  ];
  const px0 = Math.floor(corners[3][0] - 3);
  const py0 = Math.floor(corners[0][1] - 4);
  const prop = { x: px0, y: py0, w: Math.ceil(corners[2][0] + 3 - px0), h: Math.ceil(corners[2][1] + 6 - py0) };
  const [tx, ty] = at(vx, floorY, (td.z0 + td.z1) / 2);
  // where the vault drips, and the puddles under the drips
  const drips = [
    { x: vx + W * 0.22, z: 40 },
    { x: vx - W * 0.3, z: 128 },
    { x: vx + W * 0.08, z: 150 },
  ].map((d) => {
    const [x, y1] = at(d.x, floorY, d.z);
    const r = W / 2;
    const u = (d.x - vx) / r;
    const [, y0] = at(d.x, spring - Math.sqrt(Math.max(0, 1 - u * u)) * r * 0.62, d.z);
    return { x, y0, y1, s: k(d.z) };
  });
  // the manor's map chalked on a slate hung from a nail high on the back
  // wall, left of the lantern under the vault; the notebook left on the
  // top crate by the left wall
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  const r = W / 2;
  const vault = (x: number) => spring - Math.sqrt(Math.max(0, 1 - ((x - vx) / r) ** 2)) * r * 0.62;
  const sx0 = bx0 + 5;
  const sx1 = lx - 8 * ls;
  const mw = Math.round(Math.min(36 * u, sx1 - sx0));
  const mh = Math.round(mw * 0.98);
  const mx = Math.round(sx0 + (sx1 - sx0 - mw) / 2);
  const my = Math.round(Math.min(Math.max(vault(mx + 2) - mh * 0.2 + 4, vault(mx + mw / 2) + 2), rack.y0 - 6 - mh));
  const map = { x: mx, y: my, w: mw, h: mh };
  const [nx, ny] = at(bx0 + 12, floorY - 54, 38);
  const notebook = notebookOn(nx + 1, ny + 1, 21 * k(38));
  return {
    map,
    notebook,
    spring,
    niche,
    casks,
    rack,
    win,
    lantern: { x: lx, y: ly, s: ls, z: lz },
    flames,
    td,
    corners,
    prop,
    touch: { x: tx, y: ty, rx: (corners[2][0] - corners[3][0]) * 0.62, ry: (corners[2][1] - corners[0][1]) * 1.25 + 6 },
    drips,
    shaft: shaftBox(L, win),
    cam: { vx, vy: L.vy, F: L.F, floorY },
  };
}
export type CellarPlan = ReturnType<typeof cellarPlan>;

/** The box the moonlight falls through: from the window down to the
 *  boards before the casks. */
function shaftBox(L: FlatLayout, win: { x: number; y: number; w: number; h: number }) {
  const [ax] = L.at(win.x - 6, L.floorY, 50);
  const [bx, by] = L.at(win.x + win.w + 30, L.floorY, 130);
  const x = Math.floor(Math.min(win.x, ax) - 10);
  const y = Math.floor(win.y + win.h * 0.4);
  return { x, y, w: Math.ceil(Math.max(win.x + win.w, bx) + 10 - x), h: Math.ceil(by + 8 - y) };
}

/** A cask's head towards you: oak boards in an iron hoop, the chime, a
 *  brass tap low on it, a chalk tally. */
function caskHead(x: number, y: number, r: number, tap: boolean, i: number) {
  const chords: string[] = [];
  for (let j = -2; j <= 2; j++) {
    const dx = j * r * 0.3;
    const hc = Math.sqrt(Math.max(0, (r * 0.86) ** 2 - dx * dx));
    chords.push(`M${f(x + dx)} ${f(y - hc)}V${f(y + hc)}`);
  }
  const out = [
    `<circle cx="${f(x + 2)}" cy="${f(y + 3)}" r="${f(r + 2)}" fill="#000" fill-opacity="0.45"/>`,
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#ccask)" stroke="${WOOD_INK}" stroke-width="1"/>`,
    `<path d="${chords.join("")}" stroke="${WOOD_INK}" stroke-opacity="0.7" stroke-width="0.8"/>`,
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.86)}" fill="none" stroke="${WOOD_INK}" stroke-width="1.1"/>`,
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.97)}" fill="none" stroke="#0E1014" stroke-width="${f(r * 0.1 + 1)}"/>`,
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.97)}" fill="none" stroke="url(#piron)" stroke-width="${f(r * 0.08)}"/>`,
    `<path d="M${f(x - r * 0.72)} ${f(y - r * 0.52)}A${f(r * 0.9)} ${f(r * 0.9)} 0 0 1 ${f(x - r * 0.1)} ${f(y - r * 0.88)}" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="0.9" stroke-linecap="round"/>`,
  ];
  // rivets round the hoop
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    out.push(`<circle cx="${f(x + Math.cos(t) * r * 0.97)}" cy="${f(y + Math.sin(t) * r * 0.97)}" r="0.8" fill="#C8CCD4"/>`);
  }
  // a chalk tally: strokes and a cross through them
  const ty = y - r * 0.38;
  const tally = [0, 1, 2, 3].slice(0, 2 + (i % 3)).map((j) => `M${f(x - r * 0.3 + j * 3)} ${f(ty - 3)}v6`).join("");
  out.push(
    `<path d="${tally}M${f(x - r * 0.36)} ${f(ty + 2.5)}l${f(r * 0.36)} -5" stroke="#E8E4D8" stroke-opacity="0.75" stroke-width="0.9" stroke-linecap="round"/>`,
  );
  if (tap) {
    const tyy = y + r * 0.5;
    out.push(
      `<rect x="${f(x - 2.4)}" y="${f(tyy - 2.4)}" width="4.8" height="4.8" rx="1" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<path d="M${f(x)} ${f(tyy + 2)}v4.6h2.6" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
      `<path d="M${f(x)} ${f(tyy + 2)}v4.6h2.6" fill="none" stroke="url(#pgv)" stroke-width="1.3" stroke-linecap="round"/>`,
      `<path d="M${f(x - 3)} ${f(tyy - 4)}h6" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
      `<path d="M${f(x - 3)} ${f(tyy - 4)}h6" stroke="url(#pgh)" stroke-width="1" stroke-linecap="round"/>`,
    );
  }
  return out.join("");
}

/** The niche in the back wall: a ring of brick round a dark recess, the
 *  oak cradle and the three casks on it. */
function nicheArt(L: FlatLayout, P: CellarPlan) {
  const { cx, r, spring } = P.niche;
  const fy = L.floorY;
  const t = 9;
  const out: string[] = [];
  const opening = `M${f(cx - r)} ${f(fy)}V${f(spring)}A${f(r)} ${f(r)} 0 0 1 ${f(cx + r)} ${f(spring)}V${f(fy)}Z`;
  const ring = `M${f(cx - r - t)} ${f(fy)}V${f(spring)}A${f(r + t)} ${f(r + t)} 0 0 1 ${f(cx + r + t)} ${f(spring)}V${f(fy)}Z`;
  out.push(
    `<path d="${ring}" fill="#000" fill-opacity="0.4" transform="translate(2 2)"/>`,
    `<path d="${ring}" fill="url(#cbrick)" stroke="#24100A" stroke-width="0.9"/>`,
  );
  // the bricks of the arch, radiating
  const joints: string[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (Math.PI * i) / 14;
    joints.push(
      `M${f(cx + Math.cos(a) * r)} ${f(spring + Math.sin(a) * r)}L${f(cx + Math.cos(a) * (r + t))} ${f(spring + Math.sin(a) * (r + t))}`,
    );
  }
  for (let y = spring + 7; y < fy; y += 7) {
    joints.push(`M${f(cx - r - t)} ${f(y)}h${t}M${f(cx + r)} ${f(y)}h${t}`);
  }
  out.push(
    `<path d="${joints.join("")}" stroke="#24100A" stroke-opacity="0.7" stroke-width="0.7"/>`,
    `<path d="${opening}" fill="url(#cniche)" stroke="#120806" stroke-width="1"/>`,
  );
  // the cradle: two oak beams on the floor of the niche
  const cy = fy - 8;
  out.push(
    `<rect x="${f(cx - r + 3)}" y="${f(cy)}" width="${f(2 * r - 6)}" height="8" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="M${f(cx - r + 4)} ${f(cy + 1)}H${f(cx + r - 4)}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.6"/>`,
  );
  P.casks.forEach((c, i) => {
    out.push(caskHead(c.x, c.y, c.r, c.tap, i));
  });
  // a wedge under each lower cask, a dark drip stain under the left tap
  for (const c of P.casks.slice(0, 2)) {
    out.push(
      `<path d="M${f(c.x - c.r * 0.7)} ${f(cy)}l4 -6l4 6Z M${f(c.x + c.r * 0.7 - 8)} ${f(cy)}l4 -6l4 6Z" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
    );
  }
  out.push(`<path d="${oval(P.casks[0].x + 1, fy + 3, 9, 2.2)}" fill="#2A0E14" fill-opacity="0.7"/>`);
  // keystone
  out.push(
    `<path d="M${f(cx - 5)} ${f(spring - r - t - 1)}h10l-2 ${f(t + 3)}h-6Z" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>`,
  );
  return out.join("");
}

/** The rack of bottles: an oak frame, a lattice of diamonds, the necks
 *  of the bottles towards you, foil on each in red, gold or green. */
function rackArt(P: CellarPlan) {
  const { x0, x1, y0, y1 } = P.rack;
  const out: string[] = [];
  const t = 4;
  out.push(
    `<rect x="${f(x0 + 2)}" y="${f(y0 + 3)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" fill="#000" fill-opacity="0.45"/>`,
    `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<rect x="${f(x0 + t)}" y="${f(y0 + t)}" width="${f(x1 - x0 - 2 * t)}" height="${f(y1 - y0 - 2 * t)}" fill="#0E0806"/>`,
  );
  const ix0 = x0 + t;
  const iy0 = y0 + t;
  const iw = x1 - x0 - 2 * t;
  const ih = y1 - y0 - 2 * t;
  const cols = Math.max(3, Math.round(iw / 11));
  const cw = iw / cols;
  const rows = Math.max(4, Math.round(ih / cw));
  const ch = ih / rows;
  const foils = ["#A01A2E", "#E2B04A", "#A01A2E", "#2E5A3A", "#7A2A40"];
  const bottles: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = ix0 + cw * (c + 0.5);
      const by = iy0 + ch * (r + 0.5);
      if (rnd(r * 13 + c * 7) > 0.86) continue;
      const fo = foils[Math.floor(rnd(r * 5 + c * 11) * foils.length)];
      const br = Math.min(cw, ch) * 0.36;
      bottles.push(
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="url(#cbottle)" stroke="#05080A" stroke-width="0.6"/>`,
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br * 0.52)}" fill="${fo}" stroke="#05080A" stroke-width="0.5"/>`,
        `<circle cx="${f(bx - br * 0.4)}" cy="${f(by - br * 0.4)}" r="${f(br * 0.22)}" fill="#fff" fill-opacity="0.55"/>`,
      );
    }
  }
  out.push(bottles.join(""));
  // the lattice over them
  const lat: string[] = [];
  for (let c = 0; c <= cols; c++) lat.push(`M${f(ix0 + cw * c)} ${f(iy0)}V${f(iy0 + ih)}`);
  for (let r = 0; r <= rows; r++) lat.push(`M${f(ix0)} ${f(iy0 + ch * r)}H${f(ix0 + iw)}`);
  out.push(
    `<path d="${lat.join("")}" stroke="${WOOD_INK}" stroke-width="2"/>`,
    `<path d="${lat.join("")}" stroke="#7A5432" stroke-width="0.9"/>`,
    `<path d="M${f(x0 + 1.2)} ${f(y1 - 1)}V${f(y0 + 1.2)}H${f(x1 - 2)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.8"/>`,
  );
  return out.join("");
}

/** The barred window: a deep reveal in the stone, the night with the
 *  moon in it, four iron bars, moss on the sill, a stain of damp below. */
function windowArt(P: CellarPlan) {
  const { x, y, w, h } = P.win;
  const r = w / 2;
  const opening = `M${f(x)} ${f(y + h)}V${f(y + r * 0.6)}Q${f(x + r)} ${f(y - r * 0.5)} ${f(x + w)} ${f(y + r * 0.6)}V${f(y + h)}Z`;
  const bars: string[] = [];
  for (let i = 1; i < 5; i++) bars.push(`M${f(x + (w * i) / 5)} ${f(y - 2)}V${f(y + h)}`);
  bars.push(`M${f(x)} ${f(y + h * 0.55)}H${f(x + w)}`);
  return `<defs><clipPath id="cwc"><path d="${opening}"/></clipPath></defs>
<path d="M${f(x + w * 0.2)} ${f(y + h)}c-1 12 3 22 1 40c3 -12 2 -26 5 -40Z" fill="#1E2A22" fill-opacity="0.5"/>
<path d="M${f(x - 5)} ${f(y + h + 4)}V${f(y + r * 0.5)}Q${f(x + r)} ${f(y - r * 0.8)} ${f(x + w + 5)} ${f(y + r * 0.5)}V${f(y + h + 4)}Z" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.9"/>
<path d="${opening}" fill="url(#csky)"/>
<g clip-path="url(#cwc)">
<circle cx="${f(x + w * 0.66)}" cy="${f(y + h * 0.42)}" r="${f(w * 0.42)}" fill="url(#cmg)"/>
<circle cx="${f(x + w * 0.66)}" cy="${f(y + h * 0.42)}" r="${f(w * 0.15)}" fill="url(#cmoon)" stroke="#8EA3BC" stroke-width="0.5"/>
<circle cx="${f(x + w * 0.2)}" cy="${f(y + h * 0.3)}" r="0.6" fill="#fff"/><circle cx="${f(x + w * 0.38)}" cy="${f(y + h * 0.7)}" r="0.5" fill="#fff"/>
<path d="M${f(x)} ${f(y + h)}h${f(w)}v-3c-4 -3 -8 1 -12 -1s-8 2 -${f(w - 12)} 0Z" fill="#14201A"/>
</g>
<path d="${bars.join("")}" stroke="#0E1014" stroke-width="2.8"/>
<path d="${bars.join("")}" stroke="url(#pironh)" stroke-width="1.3"/>
<path d="M${f(x - 6)} ${f(y + h)}h${f(w + 12)}v4h${f(-(w + 12))}Z" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>
<path d="M${f(x - 4)} ${f(y + h + 0.5)}c3 -3 6 -2 8 0c2 -3 5 -3 7 0" fill="#3E6A3A" stroke="#14300A" stroke-width="0.5"/>`;
}

/** The iron lantern hung on its chain from the vault: a pierced cap and
 *  ring, four panes of glass round the candle, a dish under it. */
function lanternArt(L: FlatLayout, P: CellarPlan) {
  const { x, y, s, z } = P.lantern;
  const r = (L.bx1 - L.bx0) / 2;
  const lx = L.vx + (x - L.vx) / s;
  const uu = (lx - L.vx) / r;
  const [, vy] = L.at(lx, P.spring - Math.sqrt(Math.max(0, 1 - uu * uu)) * r * 0.62, z);
  const w = 11 * s;
  const h = 16 * s;
  const top = y - h * 0.62;
  return `<path d="M${f(x)} ${f(vy)}V${f(top - 6 * s)}" stroke="#0E1014" stroke-width="2.4" stroke-dasharray="2.2 1.3"/>
<path d="M${f(x)} ${f(vy)}V${f(top - 6 * s)}" stroke="#7A808A" stroke-width="0.9" stroke-dasharray="1.4 2.1"/>
<circle cx="${f(x)}" cy="${f(top - 6.5 * s)}" r="${f(2 * s)}" fill="none" stroke="#0E1014" stroke-width="1.4"/>
<path d="M${f(x - w / 2 - 1.5 * s)} ${f(top)}L${f(x)} ${f(top - 5 * s)}L${f(x + w / 2 + 1.5 * s)} ${f(top)}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.8"/>
<rect x="${f(x - w / 2)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" fill="#FFD27A" fill-opacity="0.28" stroke="#0E1014" stroke-width="0.9"/>
<path d="M${f(x - w / 2 + 1)} ${f(top + 1.5)}V${f(top + h - 1)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>
<path d="M${f(x)} ${f(top)}V${f(top + h)}M${f(x - w / 2)} ${f(top + h * 0.5)}H${f(x + w / 2)}" stroke="#0E1014" stroke-opacity="0.5" stroke-width="0.6"/>
<path d="M${f(x - w / 2)} ${f(top)}V${f(top + h)}M${f(x + w / 2)} ${f(top)}V${f(top + h)}" stroke="url(#pironh)" stroke-width="1.6"/>
<rect x="${f(x - 1.4 * s)}" y="${f(y + 2 * s + 9 * s)}" width="${f(2.8 * s)}" height="${f(top + h - (y + 11 * s) - 1)}" fill="url(#bciv)" stroke="${INK}" stroke-width="0.4"/>
<path d="M${f(x - w / 2 - 2 * s)} ${f(top + h)}h${f(w + 4 * s)}l${f(-2 * s)} ${f(3 * s)}h${f(-w)}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.8"/>
<circle cx="${f(x)}" cy="${f(top + h + 4.5 * s)}" r="${f(1.3 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.4"/>`;
}

/** A grain sack slumped on the floor at (x, z) of the room. */
function sack(L: FlatLayout, x: number, z: number, h: number, tone: string) {
  const [sx, sy] = L.at(x, L.floorY, z);
  const s = L.k(z);
  const w = h * 0.8 * s;
  const hh = h * s;
  const d = `M${f(sx - w / 2)} ${f(sy)}C${f(sx - w * 0.62)} ${f(sy - hh * 0.6)} ${f(sx - w * 0.3)} ${f(sy - hh * 0.9)} ${f(sx - w * 0.12)} ${f(sy - hh * 0.92)}L${f(sx - w * 0.2)} ${f(sy - hh * 1.08)}L${f(sx + w * 0.2)} ${f(sy - hh * 1.08)}L${f(sx + w * 0.12)} ${f(sy - hh * 0.92)}C${f(sx + w * 0.3)} ${f(sy - hh * 0.9)} ${f(sx + w * 0.62)} ${f(sy - hh * 0.6)} ${f(sx + w / 2)} ${f(sy)}Z`;
  return `<path d="${oval(sx, sy, w * 0.6, 3 * s)}" fill="#000" fill-opacity="0.45"/>
<path d="${d}" fill="${tone}" stroke="#2A1E0E" stroke-width="0.8"/>
<path d="M${f(sx - w * 0.16)} ${f(sy - hh * 0.92)}h${f(w * 0.32)}" stroke="#4A3A1E" stroke-width="${f(1.6 * s)}"/>
<path d="M${f(sx - w * 0.3)} ${f(sy - hh * 0.2)}Q${f(sx)} ${f(sy - hh * 0.32)} ${f(sx + w * 0.25)} ${f(sy - hh * 0.6)}" fill="none" stroke="#2A1E0E" stroke-opacity="0.4" stroke-width="0.7"/>
<path d="M${f(sx - w * 0.42)} ${f(sy - hh * 0.3)}Q${f(sx - w * 0.38)} ${f(sy - hh * 0.7)} ${f(sx - w * 0.14)} ${f(sy - hh * 0.86)}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8"/>`;
}

/** The whole cellar, still: everything but what lives. */
export function cellarArt(L: FlatLayout, P: CellarPlan, exits: FlatExit[]) {
  const { w, h, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall under the vault: dressed stone, lit by the lantern
  const wall = lunette(L, P.spring);
  const top = Math.min(...wall.map((p) => p[1]));
  out.push(
    `<defs><clipPath id="cbw"><path d="${poly(wall)}"/></clipPath></defs>`,
    `<path d="${poly(wall)}" fill="${STONE[1]}"/>`,
    `<g clip-path="url(#cbw)">${ashlar(bx0, top, bx1, floorY, STONE, 13, 3)}</g>`,
    `<path d="${poly(wall)}" fill="url(#cwarm)"/>`,
    `<rect x="${f(bx0)}" y="${f(top)}" width="${f(bx1 - bx0)}" height="${f((floorY - top) * 0.5)}" fill="url(#cdark)"/>`,
  );
  // the vault and the side walls
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(stoneSideWall(L, A.wall, STONE, e ? { box: A, door: e.door, color: e.color } : null, P.spring));
  }
  out.push(vaultArt(L, P.spring, BRICK));
  out.push(`<path d="${poly(wall)}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="2"/>`);
  // the floor, damp, the trapdoor's curb of stone
  out.push(flagFloor(L, FLAGS, 2));
  const { td } = P;
  out.push(
    `<path d="${face(L, [[td.x0 - 7, floorY, td.z0 - 6], [td.x1 + 7, floorY, td.z0 - 6], [td.x1 + 7, floorY, td.z1 + 7], [td.x0 - 7, floorY, td.z1 + 7]])}" fill="url(#pstone)" stroke="#1A1C24" stroke-width="0.9"/>`,
    `<path d="${face(L, [[td.x0 - 1, floorY, td.z0 - 1], [td.x1 + 1, floorY, td.z0 - 1], [td.x1 + 1, floorY, td.z1 + 1], [td.x0 - 1, floorY, td.z1 + 1]])}" fill="#05060A"/>`,
  );
  // puddles where the vault drips
  for (const d of P.drips) {
    const zz = L.zAtFloor(d.y1);
    out.push(
      `<path d="${disc(L, L.vx + (d.x - L.vx) / L.k(zz), floorY, zz, 13 * d.s, 6)}" fill="url(#cpud)" stroke="#8A9AB8" stroke-opacity="0.3" stroke-width="0.6"/>`,
    );
  }
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(
      spillArt(x + (back ? 0 : e.side === "frontLeft" ? 16 : -16), y + (back ? 8 : 4), back ? 34 : 30, back ? 11 : 16, e.color, `spill${e.side}`),
    );
  }
  // what stands against the back wall
  out.push(windowArt(P), nicheArt(L, P), rackArt(P));
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(backDoorArt(L.doors[side], e.door, e.color, `bd${side[0]}`));
  }
  // damp: moss along the foot of the walls, streaks down the stone
  const moss: string[] = [];
  for (let i = 0; i < 22; i++) {
    const x = bx0 + rnd(i * 3 + 5) * (bx1 - bx0);
    moss.push(`M${f(x)} ${f(floorY - 1)}c1 -${f(2 + rnd(i) * 4)} 3 -${f(2 + rnd(i * 7) * 4)} 5 0Z`);
  }
  out.push(`<path d="${moss.join("")}" fill="#2E4A30" fill-opacity="0.8"/>`);
  // crates and sacks along the left wall
  out.push(
    floorShadow(L, bx0, bx0 + 36, 20, 76, 0.45),
    crate(L, bx0, bx0 + 30, floorY - 30, 22, 52),
    crate(L, bx0, bx0 + 24, floorY - 54, 28, 48),
    crate(L, bx0, bx0 + 28, floorY - 26, 56, 80),
    sack(L, bx0 + 26, 100, 26, "#8A7752"),
    sack(L, bx0 + 14, 112, 22, "#7E6C4A"),
  );
  // a small cask standing by the door, a jug on it
  const [kx, ky] = L.at(bx1 - 20, floorY, 30);
  const ks = L.k(30);
  out.push(
    `<path d="${oval(kx, ky, 12 * ks, 3 * ks)}" fill="#000" fill-opacity="0.45"/>`,
    `<path d="M${f(kx - 10 * ks)} ${f(ky)}C${f(kx - 12 * ks)} ${f(ky - 12 * ks)} ${f(kx - 12 * ks)} ${f(ky - 18 * ks)} ${f(kx - 10 * ks)} ${f(ky - 28 * ks)}H${f(kx + 10 * ks)}C${f(kx + 12 * ks)} ${f(ky - 18 * ks)} ${f(kx + 12 * ks)} ${f(ky - 12 * ks)} ${f(kx + 10 * ks)} ${f(ky)}Z" fill="url(#ccaskh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(kx - 11.4 * ks)} ${f(ky - 7 * ks)}H${f(kx + 11.4 * ks)}M${f(kx - 11.4 * ks)} ${f(ky - 21 * ks)}H${f(kx + 11.4 * ks)}" stroke="#0E1014" stroke-width="${f(2.4 * ks)}"/>`,
    `<path d="${oval(kx, ky - 28 * ks, 10 * ks, 2.6 * ks)}" fill="#4E3220" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
    `<path d="M${f(kx - 4 * ks)} ${f(ky - 28 * ks)}c0 -6 1 -9 4 -9s4 3 4 9Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.6"/>`,
    `<path d="M${f(kx + 3.6 * ks)} ${f(ky - 34 * ks)}c3 0 3 4 0 5" fill="none" stroke="url(#psv)" stroke-width="1.2"/>`,
  );
  // cobwebs in the corners under the vault
  const [cl, ct] = L.at(bx0, P.spring, 0);
  const [cr] = L.at(bx1, P.spring, 0);
  out.push(cobweb(cl, ct, 30, 1), cobweb(cr, ct, 20, -1), cobweb(0, P.spring - 30, 40, 1));
  out.push(lanternArt(L, P));
  for (const e of exits) {
    const p = exitPlate(L, e.side);
    if ("wall" in p && p.wall !== undefined) out.push(bracketArt(p.wall, p.x, p.y, p.w, p.h));
    out.push(plateBox(p.x, p.y, p.w, p.h, `pl${e.side}`));
  }
  out.push(floorShade(L));
  return svg(
    w,
    h,
    `<defs>
${partDefs(L)}
${partBDefs()}
${linear("psv", MATERIALS.silver)}
${radial("cwarm", [LIGHT, LIGHT], [0.22, 0], (P.lantern.x - bx0) / (bx1 - bx0), 0.55, 0.6)}
${linear("cbrick", BRICK)}
${radial("cniche", ["#2A1A14", "#140A08", "#080404"], undefined, 0.5, 0.75, 0.75)}
${radial("ccask", ["#B07A48", "#7A4E2A", "#3E2414"], undefined, 0.36, 0.3, 0.8)}
${linear("ccaskh", ["#9A6A3E", "#6A4426", "#3E2414"], false)}
${radial("cbottle", ["#3E6B55", "#1F3A2E", "#0A140E"], undefined, 0.35, 0.3, 0.75)}
${linear("csky", ["#0C1634", "#1A2A5A", "#2E4684"])}
${radial("cmg", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.9, 0.35, 0])}
${radial("cmoon", ["#FFFFFF", "#F2F4FA", "#C8D0E2"], undefined, 0.4, 0.35, 0.75)}
${radial("cpud", ["#8A9AC0", "#3A4660", "#1A1E28"], [0.9, 0.8, 0.7], 0.4, 0.4, 0.6)}
${linear("cdark", ["#000000", "#000000"], true, [0.45, 0])}
</defs>
${out.join("\n")}`,
  );
}

/** Enough of the layout to draw the trapdoor from the plan alone. */
function camOf(cam: { vx: number; vy: number; F: number; floorY: number }) {
  const k = (z: number) => cam.F / (cam.F - z);
  const at = (x: number, y: number, z: number): [number, number] => [cam.vx + (x - cam.vx) * k(z), cam.vy + (y - cam.vy) * k(z)];
  return { ...cam, k, at };
}

/** The dark shaft under the trapdoor (the prop's image, under the lid):
 *  its far wall falling away, the top of the ladder. */
export function shaftArt(P: CellarPlan) {
  const L = camOf(P.cam);
  const { x, y, w, h } = P.prop;
  const { td } = P;
  const loc = (pts: P2[]) => pts.map((p) => [p[0] - x, p[1] - y] as const);
  const q = (pts: readonly P3[]) => poly(loc(pts.map((p) => L.at(p[0], p[1], p[2]))));
  const fy = L.floorY;
  const hole: P3[] = [
    [td.x0, fy, td.z0],
    [td.x1, fy, td.z0],
    [td.x1, fy, td.z1],
    [td.x0, fy, td.z1],
  ];
  const far: P3[] = [
    [td.x0, fy, td.z0],
    [td.x1, fy, td.z0],
    [td.x1, fy + 40, td.z0],
    [td.x0, fy + 40, td.z0],
  ];
  const rails = [-8, 8].map((dx) => [
    [L.vx + dx, fy - 6, td.z0 + 3],
    [L.vx + dx * 1.15, fy + 40, td.z0 + 10],
  ] as P3[]);
  const rungs: P3[][] = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    rungs.push([
      [L.vx - 8 - t * 1.2, fy - 2 + t * 40, td.z0 + 3 + t * 7],
      [L.vx + 8 + t * 1.2, fy - 2 + t * 40, td.z0 + 3 + t * 7],
    ]);
  }
  const ln = (pts: P3[]) =>
    loc(pts.map((p) => L.at(p[0], p[1], p[2])))
      .map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`)
      .join("");
  return svg(
    w,
    h,
    `<defs>${metalDefs()}${linear("csh", ["#2A2E38", "#0A0C12", "#020306"])}${linear("poakh", ["#7A5432", "#4E3220", "#2E1C10"], false)}<clipPath id="ch"><path d="${q(hole)}"/></clipPath></defs>
<path d="${q(hole)}" fill="#020306"/>
<g clip-path="url(#ch)">
<path d="${q(far)}" fill="url(#csh)"/>
<path d="${rungs.map(ln).join("")}" stroke="${WOOD_INK}" stroke-width="2.4"/>
<path d="${rungs.map(ln).join("")}" stroke="url(#poakh)" stroke-width="1.2"/>
<path d="${rails.map(ln).join("")}" stroke="${WOOD_INK}" stroke-width="3.2" stroke-linecap="round"/>
<path d="${rails.map(ln).join("")}" stroke="url(#poakh)" stroke-width="1.8" stroke-linecap="round"/>
</g>`,
  );
}

/** The trapdoor's lid, in the prop's box: oak planks running away from
 *  you, two iron straps with rivets, the ring pull, its near edge. */
export function lidArt(P: CellarPlan) {
  const L = camOf(P.cam);
  const { x, y, w, h } = P.prop;
  const { td } = P;
  const fy = L.floorY;
  const at = (px: number, pz: number, dy = 0) => {
    const [sx, sy] = L.at(px, fy, pz);
    return [sx - x, sy - y - dy] as const;
  };
  const lift = 2.5;
  const top = [at(td.x0, td.z0, lift), at(td.x1, td.z0, lift), at(td.x1, td.z1, lift), at(td.x0, td.z1, lift)];
  const edge = [at(td.x0, td.z1, lift), at(td.x1, td.z1, lift), at(td.x1, td.z1), at(td.x0, td.z1)];
  const planks: string[] = [];
  for (let i = 1; i < 5; i++) {
    const px = td.x0 + ((td.x1 - td.x0) * i) / 5;
    const a = at(px, td.z0, lift);
    const b = at(px, td.z1, lift);
    planks.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
  }
  const straps = [td.z0 + 9, td.z1 - 9].map((z) => [
    at(td.x0 - 1, z - 3, lift),
    at(td.x1 + 1, z - 3, lift),
    at(td.x1 + 1, z + 3, lift),
    at(td.x0 - 1, z + 3, lift),
  ]);
  const rivets: string[] = [];
  for (const z of [td.z0 + 9, td.z1 - 9]) {
    for (let i = 0; i < 4; i++) {
      const [rx, ry] = at(td.x0 + 5 + ((td.x1 - td.x0 - 10) * i) / 3, z, lift);
      rivets.push(`<circle cx="${f(rx)}" cy="${f(ry)}" r="0.9" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.3"/>`);
    }
  }
  const [cx, cy] = at(L.vx, (td.z0 + td.z1) / 2, lift);
  const ringW = (td.x1 - td.x0) * 0.16 * L.k(td.z1);
  return svg(
    w,
    h,
    `<defs>${metalDefs()}${linear("clid", ["#8A6440", "#6A4A2C", "#4E3420"])}${linear("poakd", ["#4E3220", "#341F12", "#1E1008"])}</defs>
<path d="${poly(edge)}" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="${poly(top)}" fill="url(#clid)" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="${planks.join("")}" stroke="${WOOD_INK}" stroke-opacity="0.75" stroke-width="0.8"/>
${straps.map((s) => `<path d="${poly(s)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>`).join("")}
${rivets.join("")}
<path d="${oval(cx, cy + 1, ringW, ringW * 0.32)}" fill="none" stroke="#0E1014" stroke-width="2.4"/>
<path d="${oval(cx, cy + 1, ringW, ringW * 0.32)}" fill="none" stroke="#9AA2AE" stroke-width="1"/>
<path d="${rrect(cx - 2.5, cy - 2.4, 5, 2.8, 0.8)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.5"/>
<path d="M${f(top[0][0] + 2)} ${f(top[0][1] + 1)}L${f(top[1][0] - 2)} ${f(top[1][1] + 1)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>`,
  );
}

/** The moonlight from the barred window, its own image. */
function moonArt(L: FlatLayout, P: CellarPlan) {
  const S = P.shaft;
  const { win } = P;
  const X = (x: number) => f(x - S.x);
  const Y = (y: number) => f(y - S.y);
  const patch = [
    L.at(win.x - 2, L.floorY, 56),
    L.at(win.x + win.w + 2, L.floorY, 56),
    L.at(win.x + win.w + 26, L.floorY, 124),
    L.at(win.x + 10, L.floorY, 124),
  ];
  const bars: string[] = [];
  for (let i = 1; i < 5; i++) {
    const a = L.at(win.x + (win.w * i) / 5, L.floorY, 56);
    const b = L.at(win.x + (win.w * i) / 5 + 14, L.floorY, 124);
    bars.push(`M${X(a[0])} ${Y(a[1])}L${X(b[0])} ${Y(b[1])}`);
  }
  return svg(
    S.w,
    S.h,
    `<defs>${linear("ms", ["#B8D0F4", "#B8D0F4", "#B8D0F4"], true, [0.1, 0.12, 0.02])}${radial("mp", ["#C8DCFF", "#C8DCFF"], [0.36, 0])}</defs>
<path d="M${X(win.x + 2)} ${Y(win.y + win.h * 0.6)}H${X(win.x + win.w - 2)}L${X(patch[2][0])} ${Y(patch[2][1])}H${X(patch[3][0])}Z" fill="url(#ms)"/>
<path d="M${patch.map((p) => `${X(p[0])} ${Y(p[1])}`).join("L")}Z" fill="url(#mp)"/>
<path d="${bars.join("")}" stroke="#000" stroke-opacity="0.22" stroke-width="2.6"/>`,
  );
}

/** The lid sliding off the shaft (and shifting while the cellar waits). */
function slide(fx: FlatFrame, P: CellarPlan) {
  "worklet";
  const pr = P.prop;
  const v = Math.max(0, fx.move);
  fx.draw(fx.img.lid, pr.x - v * (pr.w + 4), pr.y, pr.w, pr.h);
}

/** The moonlight breathing, motes in it, water dripping from the vault
 *  into the puddles and rings spreading on them. */
function cellarUnder(fx: FlatFrame, P: CellarPlan) {
  "worklet";
  const { c, time, draw, img } = fx;
  const S = P.shaft;
  fx.screen[0].setAlphaf(0.75 + 0.25 * Math.sin(time * 0.4));
  draw(img.moon, S.x, S.y, S.w, S.h, fx.screen[0]);
  fx.fill.setColor(Skia.Color("#DCE8FF"));
  for (let i = 0; i < 7; i++) {
    const u = (i * 0.618 + time * 0.014 * (1 + (i % 3) * 0.4)) % 1;
    const mx = P.win.x + P.win.w * (0.15 + 0.7 * ((i * 0.37) % 1)) + u * 22 + Math.sin(time * 0.6 + i) * 3;
    const my = P.win.y + P.win.h + u * S.h * 0.8;
    fx.fill.setAlphaf(0.45 * Math.sin(Math.PI * u));
    c.drawCircle(mx, my, 0.6 + (i % 3) * 0.25, fx.fill);
  }
  // drips: a drop falls, then a ring spreads where it lands
  fx.fill.setColor(Skia.Color("#B8C8E8"));
  fx.stroke.setColor(Skia.Color("#B8C8E8"));
  fx.stroke.setStrokeWidth(0.7);
  for (let i = 0; i < P.drips.length; i++) {
    const d = P.drips[i];
    const period = 2.6 + i * 0.9;
    const t = ((time + i * 1.3) % period) / period;
    const fall = 0.4;
    if (t < fall) {
      const q = t / fall;
      const y = d.y0 + (d.y1 - d.y0) * q * q;
      fx.fill.setAlphaf(0.8);
      c.drawOval(Skia.XYWHRect(d.x - 0.9 * d.s, y - 1.6 * d.s, 1.8 * d.s, 3.2 * d.s), fx.fill);
    } else {
      const q = (t - fall) / (1 - fall);
      const r = 2 + q * 11 * d.s;
      fx.stroke.setAlphaf(0.6 * (1 - q));
      c.drawOval(Skia.XYWHRect(d.x - r, d.y1 - r * 0.32, r * 2, r * 0.64), fx.stroke);
    }
  }
}

export const cellar = flatRoom({
  id: "cellar",
  light: LIGHT,
  plan: cellarPlan,
  art: cellarArt,
  propArt: shaftArt,
  mapArt: (P) => manorMapArt(P.map.w, P.map.h, "slate"),
  notebookArt: (P) => notebookArt(P.notebook.w, P.notebook.h, -4),
  // the lid slides (onProp); the shaft under it stays put
  motion: () => ({ kind: "pop", lift: 0, scale: 0 }),
  payoff: { burst: { kind: "puff", size: 44, color: "#05060B", duration: 1400, dark: true }, haptic: "thud" },
  images: (L, P) => ({
    lid: { w: P.prop.w, h: P.prop.h, art: () => lidArt(P) },
    moon: { w: P.shaft.w, h: P.shaft.h, art: () => moonArt(L, P) },
  }),
  under: cellarUnder,
  onProp: slide,
});

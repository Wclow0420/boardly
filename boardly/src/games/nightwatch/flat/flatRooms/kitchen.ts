// Seal the Manor's kitchen, seen flat on (the iso one is rooms/kitchen.ts):
// a warm, busy manor kitchen of lime-washed walls over a dado of blue-and-
// white tiles, under smoke-dark beams. The great hearth fills the middle
// of the back wall — a pale stone chimney breast, an arched opening black
// with soot, a log fire on its dogs, and over it on the iron crane the
// cauldron: the thing that works the room (touched, it swings on its hook
// and puffs steam). An oak mantel of copper pots and candles over it;
// copper pans hung from a rack under the beams; the servants' bells over
// the hall door; the long scrubbed table down the left wall with a loaf,
// greens and the notebook left at its far end, a rack of plates and strings of onions over
// it; a rag rug on the flags before the fire. As SVG markup, baked once
// (FlatRoom); the cauldron, the fire, the steam and the sparks live.

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
} from "../parts";
import {
  ashlar,
  box,
  candle,
  face,
  flagFloor,
  flameAt,
  floorShadow,
  metalDefs,
  oval,
  partBDefs,
  plainSideWall,
  stroke,
  type Flame,
  type P3,
} from "./partsB";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const PLASTER = ["#EADFC4", "#D4C49E", "#A89270"];
const FLAGS = ["#7A6650", "#6A5844", "#84705A", "#725E4A"];
const LIMESTONE = ["#D8CCB0", "#C8BA9A", "#E2D6BC", "#BEB090"];
const COPPER = ["#FFC89A", "#D07A40", "#7A3A16"];
const LIGHT = "#FF9A4A";

/** Where the kitchen's pieces stand, for a layout. */
export function kitchenPlan(L: FlatLayout, _exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, vx, at, k } = L;
  const W = bx1 - bx0;
  const dado = Math.round(floorY - wallH * 0.2);
  // the chimney breast and its opening, between the two doors
  const bw = Math.min(W * 0.26, L.doors.right.x - 14 - vx);
  const breast = { x0: vx - bw, x1: vx + bw, z: 12 };
  const ow = bw * 0.8;
  const open = { x0: vx - ow, x1: vx + ow, spring: floorY - wallH * 0.36, rise: wallH * 0.08 };
  const mantel = { y: open.spring - open.rise - 10 };
  // the fire on its dogs
  const [fx, fy] = at(vx, floorY - 8, 4);
  const s = k(4);
  const flames: Flame[] = [
    flameAt(fx - ow * 0.42, fy - 8, 1.7 * s),
    flameAt(fx - ow * 0.18, fy - 12, 2.5 * s),
    flameAt(fx + ow * 0.06, fy - 13, 2.8 * s),
    flameAt(fx + ow * 0.3, fy - 11, 2.2 * s),
    flameAt(fx + ow * 0.5, fy - 7, 1.5 * s),
  ];
  // candles on the mantel
  const [, my] = at(vx, mantel.y, breast.z + 10);
  const mantelCandles = [-1, 1].map((side) => ({ x: vx + side * (bw + 1), y: my }));
  mantelCandles.forEach((c) => flames.push(flameAt(c.x, c.y - 12, 0.9)));
  // the cauldron on the crane's hook
  const potW = Math.round(ow * 0.98);
  const hookY = open.spring - open.rise * 0.2;
  const potTop = floorY - wallH * 0.25;
  const prop = { x: vx - potW / 2 - 4, y: hookY, w: potW + 8, h: Math.round(potTop + potW * 0.68 - hookY) };
  // the pans' rack under the beams, the long table down the left wall
  const rack = { z: 62, y: ceil + wallH * 0.1, x0: vx - W * 0.24, x1: vx + W * 0.19 };
  const table = { x0: bx0 + 4, x1: bx0 + 44, top: floorY - wallH * 0.2, z0: 36, z1: Math.min(132, L.zEdge * 1.02) };
  const fire = { x: fx - ow * 1.3, y: fy - 60, w: ow * 2.6, h: 120 };
  // the manor's map pinned up on the lime-wash high on the left, clear of
  // the pans and the door's plate; the notebook on the far end of the
  // long table
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  const D = L.doors.left;
  const [rx0] = at(rack.x0, rack.y, rack.z);
  const mx0 = bx0 + 6;
  const mx1 = rx0 - 10;
  const mw = Math.round(Math.min(36 * u, mx1 - mx0));
  const mh = Math.round(mw * 0.8);
  const mapRoom = D.y - 11 - 9 - 6 - (ceil + 10);
  const map = { x: Math.round(mx0 + (mx1 - mx0 - mw) / 2), y: Math.round(ceil + 10 + Math.max(0, (mapRoom - mh) * 0.45)), w: mw, h: mh };
  const nz = table.z0 + 10;
  const [nx, ny] = at((table.x0 + table.x1) / 2, table.top, nz);
  const notebook = notebookOn(nx, ny + 1, 18 * k(nz));
  return {
    map,
    notebook,
    dado,
    breast,
    open,
    mantel,
    mantelCandles,
    flames,
    potW,
    potTop,
    hook: { x: vx, y: hookY },
    prop,
    touch: { x: vx, y: potTop + potW * 0.3, rx: potW * 0.85, ry: potW * 0.62 },
    rack,
    table,
    fire,
    floorFire: { x: vx - W * 0.45, y: floorY - 6, w: W * 0.9, h: (L.h - floorY) * 0.55 },
    embers: { x0: fx - ow * 0.4, x1: fx + ow * 0.4, y0: fy - 10, y1: open.spring - open.rise },
    steam: { x: vx, y: potTop - 2, w: potW },
  };
}
export type KitchenPlan = ReturnType<typeof kitchenPlan>;

/** The beamed ceiling: dark plaster between heavy oak beams running
 *  across the room, each a box seen from below. */
function beamsArt(L: FlatLayout) {
  const { w, ceil, at, bx0, bx1 } = L;
  const zTop = L.F * (1 - (L.vy - ceil) / L.vy);
  const out: string[] = [`<rect width="${w}" height="${f(ceil)}" fill="#2A1E14"/>`];
  for (const z of [6, zTop * 0.32, zTop * 0.68, zTop * 1.05]) {
    const d = 9;
    const under = [at(bx0 - 600, ceil, z), at(bx1 + 600, ceil, z), at(bx1 + 600, ceil, z + d), at(bx0 - 600, ceil, z + d)];
    const [, fy] = at(0, ceil, z + d);
    out.push(
      `<path d="${poly(under)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
      `<rect x="0" y="${f(fy)}" width="${w}" height="${f(5 * L.k(z))}" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
      `<path d="M0 ${f(fy + 1)}H${w}" stroke="#F0D0A8" stroke-opacity="0.25" stroke-width="0.7"/>`,
    );
  }
  out.push(`<rect x="${f(bx0)}" y="${f(ceil - 3)}" width="${f(bx1 - bx0)}" height="4" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.7"/>`);
  return out.join("");
}

/** A Delft tile's mark (a little windmill of four petals) at (x, y). */
const tileMark = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y - r)}Q${f(x + r * 0.5)} ${f(y - r * 0.2)} ${f(x)} ${f(y)}Q${f(x - r * 0.5)} ${f(y - r * 0.2)} ${f(x)} ${f(y - r)}ZM${f(x + r)} ${f(y)}Q${f(x + r * 0.2)} ${f(y + r * 0.5)} ${f(x)} ${f(y)}Q${f(x + r * 0.2)} ${f(y - r * 0.5)} ${f(x + r)} ${f(y)}ZM${f(x)} ${f(y + r)}Q${f(x - r * 0.5)} ${f(y + r * 0.2)} ${f(x)} ${f(y)}Q${f(x + r * 0.5)} ${f(y + r * 0.2)} ${f(x)} ${f(y + r)}ZM${f(x - r)} ${f(y)}Q${f(x - r * 0.2)} ${f(y - r * 0.5)} ${f(x)} ${f(y)}Q${f(x - r * 0.2)} ${f(y + r * 0.5)} ${f(x - r)} ${f(y)}Z`;

/** The hearth: the chimney breast of pale stone, the arched opening with
 *  its soot-black firebrick, the raised hearthstone, the fire dogs and
 *  logs, the iron crane, the oak mantel and what stands on it. */
function hearthArt(L: FlatLayout, P: KitchenPlan) {
  const { floorY, ceil, at, vx } = L;
  const { breast, open, mantel } = P;
  const z = breast.z;
  const out: string[] = [];
  const [bx0, by0] = at(breast.x0, ceil, z);
  const [bx1] = at(breast.x1, floorY, z);
  const [, by1] = at(breast.x1, floorY, z);
  // its shadow on the wall each side, the breast's face of dressed stone
  out.push(
    `<rect x="${f(bx0 - 4)}" y="${f(by0)}" width="${f(bx1 - bx0 + 8)}" height="${f(by1 - by0)}" fill="#000" fill-opacity="0.25"/>`,
    `<defs><clipPath id="kbr"><rect x="${f(bx0)}" y="${f(by0)}" width="${f(bx1 - bx0)}" height="${f(by1 - by0)}"/></clipPath></defs>`,
    `<rect x="${f(bx0)}" y="${f(by0)}" width="${f(bx1 - bx0)}" height="${f(by1 - by0)}" fill="${LIMESTONE[1]}" stroke="#4A3E2A" stroke-width="0.9"/>`,
    `<g clip-path="url(#kbr)">${ashlar(bx0, by0, bx1, by1, LIMESTONE, 12, 5)}</g>`,
    `<rect x="${f(bx0)}" y="${f(by0)}" width="${f(bx1 - bx0)}" height="${f((by1 - by0) * 0.55)}" fill="url(#ksoot)"/>`,
  );
  // the opening: a flat arch over soot and firebrick
  const [ox0] = at(open.x0, 0, z);
  const [ox1] = at(open.x1, 0, z);
  const [, os] = at(0, open.spring, z);
  const [, orise] = at(0, open.spring - open.rise, z);
  const rise = os - orise;
  const opening = `M${f(ox0)} ${f(by1)}V${f(os)}Q${f((ox0 + ox1) / 2)} ${f(os - rise * 2)} ${f(ox1)} ${f(os)}V${f(by1)}Z`;
  const bricks: string[] = [];
  for (let r = 0, y = by1 - 10; y > orise - 6; r++, y -= 6) {
    for (let x = ox0 - (r % 2 ? 6 : 0); x < ox1; x += 12) bricks.push(`M${f(x)} ${f(y)}h12`);
    for (let x = ox0 - (r % 2 ? 6 : 0); x < ox1; x += 12) bricks.push(`M${f(x)} ${f(y)}v-6`);
  }
  out.push(
    `<defs><clipPath id="kop"><path d="${opening}"/></clipPath></defs>`,
    `<path d="${opening}" fill="url(#kback)"/>`,
    `<g clip-path="url(#kop)"><path d="${bricks.join("")}" stroke="#000" stroke-opacity="0.5" stroke-width="0.7"/>`,
    `<rect x="${f(ox0)}" y="${f(orise - 4)}" width="${f(ox1 - ox0)}" height="${f((by1 - orise) * 0.6)}" fill="url(#ksootin)"/></g>`,
  );
  // the voussoirs of the flat arch, a keystone
  const vous: string[] = [];
  const t = 9;
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const x = ox0 + (ox1 - ox0) * u;
    const y = os - rise * 2 * 2 * u * (1 - u);
    vous.push(`M${f(x)} ${f(y)}l${f((u - 0.5) * 6)} ${f(-t)}`);
  }
  const archBand = `M${f(ox0 - 5)} ${f(os + 2)}Q${f((ox0 + ox1) / 2)} ${f(os - rise * 2 - t * 2)} ${f(ox1 + 5)} ${f(os + 2)}L${f(ox1)} ${f(os)}Q${f((ox0 + ox1) / 2)} ${f(os - rise * 2)} ${f(ox0)} ${f(os)}Z`;
  out.push(
    `<path d="${archBand}" fill="url(#pstone)" stroke="#3A2E22" stroke-width="0.8"/>`,
    `<path d="${vous.join("")}" stroke="#3A2E22" stroke-width="0.7"/>`,
    `<path d="M${f(vx - 5)} ${f(orise - t - 3)}h10l-1.5 ${f(t + 3)}h-7Z" fill="url(#pstone)" stroke="#3A2E22" stroke-width="0.8"/>`,
    `<path d="${opening}" fill="none" stroke="#120A04" stroke-width="1.2"/>`,
  );
  // the hearthstone and the fire dogs, the logs, the bed of embers
  const hy = by1;
  out.push(
    box(L, open.x0 - 10, open.x1 + 10, floorY - 5, floorY, 0, z + 10, { front: "url(#pstoneh)", top: "url(#pstone)", ink: "#3A2E22" }),
    `<path d="${oval(vx, hy - 8, (ox1 - ox0) * 0.38, 4)}" fill="url(#kembers)"/>`,
  );
  const logs = [
    [vx - (ox1 - ox0) * 0.3, hy - 11, vx + (ox1 - ox0) * 0.18, hy - 14],
    [vx - (ox1 - ox0) * 0.12, hy - 14, vx + (ox1 - ox0) * 0.32, hy - 10],
  ];
  for (const [ax, ay, bx2, by2] of logs) {
    out.push(
      `<path d="M${f(ax)} ${f(ay)}L${f(bx2)} ${f(by2)}" stroke="${WOOD_INK}" stroke-width="8.4" stroke-linecap="round"/>`,
      `<path d="M${f(ax)} ${f(ay)}L${f(bx2)} ${f(by2)}" stroke="#5A3A20" stroke-width="6.4" stroke-linecap="round"/>`,
      `<path d="M${f(ax)} ${f(ay + 2)}L${f(bx2)} ${f(by2 + 2)}" stroke="#FF7A2A" stroke-opacity="0.7" stroke-width="1.4" stroke-linecap="round"/>`,
      `<circle cx="${f(bx2)}" cy="${f(by2)}" r="3.2" fill="#8A5A30" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
    );
  }
  for (const side of [-1, 1]) {
    const dx = vx + side * (ox1 - ox0) * 0.36;
    out.push(
      `<path d="M${f(dx - 4)} ${f(hy - 5)}l2 -9h4l2 9" fill="none" stroke="#0E1014" stroke-width="2.2"/>`,
      `<circle cx="${f(dx)}" cy="${f(hy - 16)}" r="2.6" fill="url(#pgd)" stroke="${INK}" stroke-width="0.6"/>`,
    );
  }
  // the crane: an iron post on the left jamb, its arm out over the fire,
  // a brace, the hook the cauldron hangs from
  const px = ox0 + 6;
  const hy2 = P.hook.y;
  const arm = `M${f(px)} ${f(hy2 - 2)}H${f(vx + 6)}`;
  const brace = `M${f(px)} ${f(hy2 + 22)}L${f(px + (vx - px) * 0.6)} ${f(hy2 - 1)}`;
  const post = `M${f(px)} ${f(hy - 4)}V${f(hy2 - 6)}`;
  out.push(
    `<path d="${post}${arm}${brace}" fill="none" stroke="#05070A" stroke-width="3.8" stroke-linecap="round"/>`,
    `<path d="${post}${arm}${brace}" fill="none" stroke="url(#pironh)" stroke-width="1.8" stroke-linecap="round"/>`,
    `<path d="M${f(px - 3)} ${f(hy2 + 6)}h6M${f(px - 3)} ${f(hy - 20)}h6" stroke="#05070A" stroke-width="2.4"/>`,
    `<path d="M${f(vx + 6)} ${f(hy2 - 4)}c2 0 3 3 0 5" fill="none" stroke="#05070A" stroke-width="1.8"/>`,
  );
  // the mantel: an oak beam out from the breast, plates and pots on it
  const my = mantel.y;
  out.push(
    box(L, breast.x0 - 6, breast.x1 + 6, my, my + 7, z, z + 12, { front: "url(#poakh)", top: "url(#poak)" }),
  );
  const [, mtop] = at(vx, my, z + 8);
  const k = L.k(z + 8);
  // three plates leaning on the breast, a row of copper pots between
  for (const dx of [-0.42, 0, 0.42]) {
    const px2 = vx + dx * (breast.x1 - breast.x0);
    out.push(
      `<circle cx="${f(px2)}" cy="${f(mtop - 9 * k)}" r="${f(9 * k)}" fill="url(#bchina)" stroke="#3A4250" stroke-width="0.6"/>`,
      `<circle cx="${f(px2)}" cy="${f(mtop - 9 * k)}" r="${f(6 * k)}" fill="none" stroke="#2A5AA8" stroke-width="0.9"/>`,
      `<path d="${tileMark(px2, mtop - 9 * k, 3 * k)}" fill="#2A5AA8" fill-opacity="0.8"/>`,
    );
  }
  for (const dx of [-0.24, 0.2]) {
    const cx = vx + dx * (breast.x1 - breast.x0);
    const r = 5.5 * k;
    out.push(
      `<path d="M${f(cx - r)} ${f(mtop)}Q${f(cx - r * 1.15)} ${f(mtop - r * 1.6)} ${f(cx - r * 0.7)} ${f(mtop - r * 1.8)}H${f(cx + r * 0.7)}Q${f(cx + r * 1.15)} ${f(mtop - r * 1.6)} ${f(cx + r)} ${f(mtop)}Z" fill="url(#kcop)" stroke="#3A1A08" stroke-width="0.7"/>`,
      `<path d="M${f(cx - r * 0.8)} ${f(mtop - r * 1.8)}h${f(r * 1.6)}" stroke="#FFE0C0" stroke-width="0.8"/>`,
      `<path d="M${f(cx - r * 0.6)} ${f(mtop - r * 0.4)}Q${f(cx - r * 0.85)} ${f(mtop - r)} ${f(cx - r * 0.5)} ${f(mtop - r * 1.5)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`,
    );
  }
  for (const c of P.mantelCandles) {
    out.push(
      `<path d="M${f(c.x - 3.4)} ${f(c.y)}h6.8l-2 -3h-2.8Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<rect x="${f(c.x - 0.9)}" y="${f(c.y - 7)}" width="1.8" height="4" fill="url(#pgh)" stroke="${INK}" stroke-width="0.4"/>`,
      candle(c.x, c.y - 5, 8, 1),
    );
  }
  return out.join("");
}

/** The servants' bells over the hall door: brass bells on coiled springs
 *  along a board. */
function bellsArt(L: FlatLayout) {
  const D = L.doors.right;
  const y = D.y - 34;
  const x0 = D.x - 2;
  const x1 = D.x + D.w + 2;
  const out = [
    `<rect x="${f(x0)}" y="${f(y - 4)}" width="${f(x1 - x0)}" height="5" rx="1" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  ];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const bx = x0 + 6 + ((x1 - x0 - 12) * i) / (n - 1);
    const by = y + 8 + (i % 2) * 2;
    out.push(
      `<path d="M${f(bx)} ${f(y + 1)}c-2 1 2 2 0 3s2 2 0 3" fill="none" stroke="#7A808A" stroke-width="0.7"/>`,
      `<path d="M${f(bx - 3.2)} ${f(by + 4)}Q${f(bx - 3)} ${f(by - 2)} ${f(bx)} ${f(by - 2)}Q${f(bx + 3)} ${f(by - 2)} ${f(bx + 3.2)} ${f(by + 4)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<circle cx="${f(bx)}" cy="${f(by + 5)}" r="0.9" fill="${INK}"/>`,
      `<path d="M${f(bx - 1.6)} ${f(by)}Q${f(bx - 1.8)} ${f(by + 2)} ${f(bx - 2.2)} ${f(by + 3)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>`,
    );
  }
  return out.join("");
}

/** The rack of copper pans hung from the beams on chains. */
function rackArt(L: FlatLayout, P: KitchenPlan) {
  const { at, ceil } = L;
  const R = P.rack;
  const s = L.k(R.z);
  const [ax, ay] = at(R.x0, R.y, R.z);
  const [bx] = at(R.x1, R.y, R.z);
  const [, cy] = at(R.x0, ceil, R.z);
  const out: string[] = [];
  const chains = [ax + 4, bx - 4].map((x) => `M${f(x)} ${f(cy)}V${f(ay)}`).join("");
  out.push(
    `<path d="${chains}" stroke="#05070A" stroke-width="2" stroke-dasharray="2 1.2"/>`,
    `<path d="${chains}" stroke="#7A808A" stroke-width="0.8" stroke-dasharray="1.2 2"/>`,
    `<rect x="${f(ax)}" y="${f(ay - 2)}" width="${f(bx - ax)}" height="4" rx="2" fill="url(#pironh)" stroke="#05070A" stroke-width="0.8"/>`,
  );
  // what hangs from it: pans of every size, a ladle, a skillet, herbs
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = ax + 10 + ((bx - ax - 20) * i) / (n - 1);
    const kind = i % 3;
    const hookY = ay + 2;
    out.push(`<path d="M${f(x)} ${f(hookY)}v4" stroke="#05070A" stroke-width="1.2"/>`);
    if (kind === 0 || kind === 2) {
      const r = (kind === 0 ? 8 : 6) * s * (0.9 + rnd(i) * 0.25);
      const handle = 11 * s;
      const top = hookY + 4;
      out.push(
        `<rect x="${f(x - 1.6 * s)}" y="${f(top)}" width="${f(3.2 * s)}" height="${f(handle)}" rx="1" fill="url(#kcoph)" stroke="#3A1A08" stroke-width="0.6"/>`,
        `<circle cx="${f(x)}" cy="${f(top + handle + r)}" r="${f(r)}" fill="url(#kcop)" stroke="#3A1A08" stroke-width="0.8"/>`,
        `<circle cx="${f(x)}" cy="${f(top + handle + r)}" r="${f(r * 0.72)}" fill="none" stroke="#7A3A16" stroke-opacity="0.6" stroke-width="0.7"/>`,
        `<path d="M${f(x - r * 0.65)} ${f(top + handle + r * 0.6)}A${f(r * 0.8)} ${f(r * 0.8)} 0 0 1 ${f(x - r * 0.1)} ${f(top + handle + r * 0.2)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8" stroke-linecap="round"/>`,
      );
    } else if (i === 1) {
      // a ladle
      out.push(
        `<path d="M${f(x)} ${f(hookY + 4)}V${f(hookY + 22 * s)}" stroke="#1E242C" stroke-width="2.2"/>`,
        `<path d="M${f(x)} ${f(hookY + 4)}V${f(hookY + 22 * s)}" stroke="url(#psvh)" stroke-width="1.1"/>`,
        `<path d="M${f(x - 4 * s)} ${f(hookY + 22 * s)}a${f(4 * s)} ${f(3.4 * s)} 0 0 0 ${f(8 * s)} 0Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.6"/>`,
      );
    } else {
      // a bunch of dried herbs
      const leaves: string[] = [];
      for (let j = 0; j < 7; j++) {
        const a = -0.6 + (j / 6) * 1.2;
        leaves.push(`M${f(x)} ${f(hookY + 6)}q${f(Math.sin(a) * 6 * s)} ${f(8 * s)} ${f(Math.sin(a) * 4 * s)} ${f(16 * s)}`);
      }
      out.push(
        `<path d="${leaves.join("")}" fill="none" stroke="#14300A" stroke-width="2.6" stroke-linecap="round"/>`,
        `<path d="${leaves.join("")}" fill="none" stroke="#6A8A3A" stroke-width="1.4" stroke-linecap="round"/>`,
        `<path d="M${f(x - 2)} ${f(hookY + 7)}h4" stroke="#C2453F" stroke-width="2"/>`,
      );
    }
  }
  return out.join("");
}

/** The long scrubbed table down the left wall, what's on it, the plate
 *  rack and the strings of onions on the wall over it. */
function tableArt(L: FlatLayout, P: KitchenPlan) {
  const { at, floorY, k } = L;
  const T = P.table;
  const out: string[] = [];
  const wx = L.bx0;
  // the plate rack on the wall: a shelf, plates standing on edge
  const shelfY = P.dado - L.wallH * 0.22;
  const pr: string[] = [];
  for (let z = T.z0 + 6; z < T.z1 - 4; z += 13) {
    const r = 5.4;
    const pts: P3[] = Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return [wx + 3, shelfY - r - 1 + Math.sin(a) * r, z + Math.cos(a) * r];
    });
    const inner = pts.map(([x, y, zz]) => [x, shelfY - r - 1 + (y - (shelfY - r - 1)) * 0.6, z + (zz - z) * 0.6] as P3);
    pr.push(
      `<path d="${face(L, pts)}" fill="url(#bchina)" stroke="#3A4250" stroke-width="0.6"/>`,
      `<path d="${face(L, inner)}" fill="none" stroke="#2A5AA8" stroke-width="0.9"/>`,
    );
  }
  out.push(
    pr.join(""),
    box(L, wx, wx + 9, shelfY, shelfY + 3, T.z0, T.z1, { front: "url(#poakh)", top: "url(#poak)", side: "url(#poak)" }),
    `<path d="${stroke(L, [[wx + 8, shelfY - 2.5, T.z0], [wx + 8, shelfY - 2.5, T.z1]])}" stroke="${WOOD_INK}" stroke-width="1.4"/>`,
  );
  // a string of onions hanging from the shelf's end
  const [ox, oy] = at(wx + 6, shelfY + 3, T.z1 - 6);
  const os = k(T.z1);
  const onions: string[] = [];
  for (let i = 0; i < 6; i++) {
    const y = oy + 4 * os + i * 5.4 * os;
    const x = ox + (i % 2 ? 2.6 : -2.6) * os;
    onions.push(
      `<path d="M${f(x)} ${f(y - 3.4 * os)}c${f(3.4 * os)} ${f(1 * os)} ${f(3.4 * os)} ${f(6 * os)} 0 ${f(6 * os)}c${f(-3.4 * os)} 0 ${f(-3.4 * os)} ${f(-5 * os)} 0 ${f(-6 * os)}Z" fill="url(#konion)" stroke="#4A2A0A" stroke-width="0.6"/>`,
    );
  }
  out.push(
    `<path d="M${f(ox)} ${f(oy)}V${f(oy + 34 * os)}" stroke="#B89A6A" stroke-width="1"/>`,
    onions.join(""),
  );
  // the table: legs, the stretcher, the scrubbed top
  out.push(floorShadow(L, T.x0, T.x1 + 6, T.z0, T.z1 + 6, 0.45));
  const legs = [
    [T.x1 - 3, T.z1 - 3],
    [T.x1 - 3, T.z0 + 3],
    [T.x0 + 3, T.z1 - 3],
  ].map(([x, z]) => stroke(L, [[x, T.top + 5, z], [x, floorY, z]]));
  out.push(
    `<path d="${legs.join("")}" stroke="${WOOD_INK}" stroke-width="4.6" stroke-linecap="round"/>`,
    `<path d="${legs.join("")}" stroke="url(#poakh)" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="${stroke(L, [[T.x1 - 3, floorY - 12, T.z0 + 3], [T.x1 - 3, floorY - 12, T.z1 - 3]])}" stroke="${WOOD_INK}" stroke-width="2.6"/>`,
    box(L, T.x0, T.x1, T.top, T.top + 5, T.z0, T.z1, { front: "url(#ktoph)", top: "url(#ktop)", side: "url(#ktoph)" }),
  );
  // what's on it: a loaf on its board, a cabbage, a brown jug (and at its
  // far end the notebook, drawn live)
  const item = (x: number, z: number) => ({ p: at(x, T.top, z), s: k(z) });
  const len = T.z1 - T.z0;
  const loaf = item((T.x0 + T.x1) / 2 + 4, T.z0 + len * 0.4);
  const cab = item((T.x0 + T.x1) / 2 + 6, T.z0 + len * 0.7);
  const jug = item((T.x0 + T.x1) / 2 - 4, T.z1 - 10);
  {
    const [x, y] = loaf.p;
    const s = loaf.s;
    out.push(
      `<path d="${oval(x, y, 11 * s, 3 * s)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
      `<path d="M${f(x - 9 * s)} ${f(y - 1)}C${f(x - 9 * s)} ${f(y - 9 * s)} ${f(x + 9 * s)} ${f(y - 9 * s)} ${f(x + 9 * s)} ${f(y - 1)}Z" fill="url(#kloaf)" stroke="#4A2408" stroke-width="0.7"/>`,
      `<path d="M${f(x - 4 * s)} ${f(y - 6 * s)}l2 2M${f(x)} ${f(y - 7 * s)}l2 2M${f(x + 4 * s)} ${f(y - 6 * s)}l2 2" stroke="#F0D0A0" stroke-width="0.8"/>`,
    );
  }
  {
    const [x, y] = cab.p;
    const s = cab.s;
    out.push(
      `<circle cx="${f(x)}" cy="${f(y - 5 * s)}" r="${f(5.6 * s)}" fill="#6AAA3A" stroke="#14300A" stroke-width="0.7"/>`,
      `<path d="M${f(x - 4 * s)} ${f(y - 6 * s)}q4 -4 8 0M${f(x - 3 * s)} ${f(y - 3 * s)}q3 -3 6 0" fill="none" stroke="#2E6A1E" stroke-width="0.7"/>`,
      `<path d="M${f(x - 3 * s)} ${f(y - 8 * s)}q2 -2 4 -1" fill="none" stroke="#D8F0A0" stroke-width="0.7"/>`,
    );
  }
  {
    const [x, y] = jug.p;
    const s = jug.s;
    out.push(
      `<path d="M${f(x - 5 * s)} ${f(y)}C${f(x - 7 * s)} ${f(y - 8 * s)} ${f(x - 4 * s)} ${f(y - 12 * s)} ${f(x - 3 * s)} ${f(y - 16 * s)}H${f(x + 3 * s)}C${f(x + 4 * s)} ${f(y - 12 * s)} ${f(x + 7 * s)} ${f(y - 8 * s)} ${f(x + 5 * s)} ${f(y)}Z" fill="url(#kjug)" stroke="#3A1A08" stroke-width="0.7"/>`,
      `<path d="M${f(x + 4 * s)} ${f(y - 13 * s)}c4 0 5 6 1 8" fill="none" stroke="#3A1A08" stroke-width="${f(2 * s)}"/>`,
      `<path d="M${f(x - 3.6 * s)} ${f(y - 4 * s)}Q${f(x - 4.6 * s)} ${f(y - 9 * s)} ${f(x - 2.4 * s)} ${f(y - 13 * s)}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`,
    );
  }
  return out.join("");
}

/** A flour sack and a crate of vegetables on the flags by the right wall,
 *  a broom leaning on it. */
function cornerArt(L: FlatLayout) {
  const { at, floorY, k, bx1 } = L;
  const z = Math.min(124, L.zEdge * 0.96) + 4;
  const out: string[] = [];
  const [sx, sy] = at(bx1 - 14, floorY, z);
  const s = k(z);
  out.push(
    `<path d="${oval(sx, sy, 14 * s, 3.4 * s)}" fill="#000" fill-opacity="0.45"/>`,
    `<path d="M${f(sx - 11 * s)} ${f(sy)}C${f(sx - 13 * s)} ${f(sy - 16 * s)} ${f(sx - 8 * s)} ${f(sy - 22 * s)} ${f(sx - 4 * s)} ${f(sy - 24 * s)}L${f(sx - 6 * s)} ${f(sy - 28 * s)}H${f(sx + 6 * s)}L${f(sx + 4 * s)} ${f(sy - 24 * s)}C${f(sx + 8 * s)} ${f(sy - 22 * s)} ${f(sx + 13 * s)} ${f(sy - 16 * s)} ${f(sx + 11 * s)} ${f(sy)}Z" fill="#E8DCC0" stroke="#5A4A2A" stroke-width="0.8"/>`,
    `<path d="M${f(sx - 4 * s)} ${f(sy - 24 * s)}h${f(8 * s)}" stroke="#8A6A3A" stroke-width="${f(1.8 * s)}"/>`,
    `<path d="M${f(sx - 5 * s)} ${f(sy - 12 * s)}h${f(10 * s)}M${f(sx - 4 * s)} ${f(sy - 9 * s)}h${f(8 * s)}" stroke="#2A5AA8" stroke-width="${f(1.1 * s)}"/>`,
    `<path d="M${f(sx - 9 * s)} ${f(sy - 4 * s)}Q${f(sx - 10 * s)} ${f(sy - 14 * s)} ${f(sx - 5 * s)} ${f(sy - 21 * s)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>`,
  );
  // the broom against the wall behind it
  const [b0x, b0y] = at(bx1 - 2, floorY - 70, z - 22);
  const [b1x, b1y] = at(bx1 - 16, floorY, z - 22);
  out.push(
    `<path d="M${f(b0x)} ${f(b0y)}L${f(b1x)} ${f(b1y - 14)}" stroke="${WOOD_INK}" stroke-width="3"/>`,
    `<path d="M${f(b0x)} ${f(b0y)}L${f(b1x)} ${f(b1y - 14)}" stroke="#C8A06A" stroke-width="1.6"/>`,
    `<path d="M${f(b1x - 2)} ${f(b1y - 15)}l-5 15h12l-2 -15Z" fill="#C8A040" stroke="#5A3A10" stroke-width="0.7"/>`,
    `<path d="M${f(b1x - 4)} ${f(b1y - 8)}l-2 8M${f(b1x)} ${f(b1y - 8)}v8M${f(b1x + 3)} ${f(b1y - 8)}l1 8" stroke="#7A5A20" stroke-width="0.6"/>`,
  );
  return out.join("");
}

/** The rag rug on the flags before the fire. */
function rugArt(L: FlatLayout) {
  const { vx, floorY } = L;
  const W = L.bx1 - L.bx0;
  const q = (x0: number, x1: number, z0: number, z1: number) =>
    face(L, [
      [x0, floorY, z0],
      [x1, floorY, z0],
      [x1, floorY, z1],
      [x0, floorY, z1],
    ]);
  const stripes: string[] = [];
  const cols = ["#A04A3A", "#3A5A8A", "#C89A4A", "#5A7A4A"];
  for (let i = 0; i < 8; i++) {
    const z0 = 40 + i * 12;
    stripes.push(`<path d="${q(vx - W * 0.28, vx + W * 0.28, z0, z0 + 12)}" fill="${cols[i % cols.length]}" fill-opacity="0.85"/>`);
  }
  return `<path d="${q(vx - W * 0.28, vx + W * 0.28, 40, 136)}" fill="#000" fill-opacity="0.3" transform="translate(0 2)"/>
${stripes.join("")}
<path d="${q(vx - W * 0.28, vx + W * 0.28, 40, 136)}" fill="none" stroke="#2A1A0E" stroke-width="0.9"/>`;
}

/** The whole kitchen, still: everything but what lives. */
export function kitchenArt(L: FlatLayout, P: KitchenPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: lime-wash over a dado of tiles
  const tiles: string[] = [];
  const marks: string[] = [];
  const ts = 10;
  for (let y = floorY - 8; y > P.dado + 0.1; y -= ts) {
    for (let x = bx0; x < bx1; x += ts) {
      tiles.push(`M${f(x + 0.5)} ${f(y - ts + 0.5)}h${ts - 1}v${ts - 1}h${-(ts - 1)}Z`);
      marks.push(tileMark(x + ts / 2, y - ts / 2, 2.6));
    }
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#kwall)"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#kwarm)"/>`,
    `<path d="${tiles.join("")}" fill="#EEF2F6" stroke="#8A96A8" stroke-width="0.5"/>`,
    `<path d="${marks.join("")}" fill="#2A5AA8" fill-opacity="0.75"/>`,
    `<rect x="${f(bx0)}" y="${f(P.dado - 2)}" width="${f(bx1 - bx0)}" height="3" fill="#2A5AA8"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 8)}" width="${f(bx1 - bx0)}" height="8" fill="#3A2A1A"/>`,
    `<rect x="${f(bx0)}" y="${f(P.dado)}" width="${f(bx1 - bx0)}" height="${f(floorY - P.dado)}" fill="url(#kwarm)"/>`,
  );
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(plainSideWall(L, A.wall, PLASTER, P.dado, e ? { box: A, door: e.door, color: e.color } : null));
  }
  out.push(beamsArt(L));
  out.push(flagFloor(L, FLAGS, 4), rugArt(L));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(
      spillArt(x + (back ? 0 : e.side === "frontLeft" ? 16 : -16), y + (back ? 8 : 4), back ? 34 : 30, back ? 11 : 16, e.color, `spill${e.side}`),
    );
  }
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(backDoorArt(L.doors[side], e.door, e.color, `bd${side[0]}`));
  }
  if (exit("right")) out.push(bellsArt(L));
  out.push(hearthArt(L, P));
  out.push(tableArt(L, P), cornerArt(L));
  out.push(rackArt(L, P));
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
${linear("psv", MATERIALS.silver)}${linear("psvh", MATERIALS.silver, false)}
${linear("kwall", PLASTER)}
${radial("kwarm", [LIGHT, LIGHT], [0.35, 0], 0.5, 0.85, 0.6)}
${linear("ksoot", ["#000000", "#000000"], true, [0.55, 0])}
${linear("ksootin", ["#000000", "#000000"], true, [0.8, 0])}
${radial("kback", ["#7A3A1A", "#3A1A0A", "#140804"], undefined, 0.5, 0.9, 0.8)}
${radial("kembers", ["#FFE07A", "#FF7A2A", "#7A1A04"], [1, 0.9, 0], 0.5, 0.5, 0.5)}
${radial("kcop", COPPER, undefined, 0.35, 0.3, 0.8)}
${linear("kcoph", COPPER, false)}
${linear("ktop", ["#E8D8B8", "#D0BC98", "#B09A78"])}
${linear("ktoph", ["#B89A70", "#8A6A48"])}
${radial("konion", ["#F0C080", "#C0782A", "#7A3A0A"], undefined, 0.35, 0.3, 0.8)}
${radial("kloaf", ["#E8A860", "#B06A28", "#6A3A10"], undefined, 0.4, 0.3, 0.8)}
${linear("kjug", ["#A0603A", "#7A4220", "#4A2410"], false)}
</defs>
${out.join("\n")}`,
  );
}

/** The cauldron hanging from the hook, in the prop's box: its bail up to
 *  the hook, the black iron belly, the stew at its brim with bubbles. */
export function cauldronArt(P: KitchenPlan) {
  const { w, h } = P.prop;
  const cx = w / 2;
  const pw = P.potW;
  const top = P.potTop - P.prop.y;
  const r = pw / 2;
  const belly = `M${f(cx - r)} ${f(top)}C${f(cx - r * 1.2)} ${f(top + pw * 0.45)} ${f(cx - r * 0.6)} ${f(top + pw * 0.66)} ${f(cx)} ${f(top + pw * 0.66)}C${f(cx + r * 0.6)} ${f(top + pw * 0.66)} ${f(cx + r * 1.2)} ${f(top + pw * 0.45)} ${f(cx + r)} ${f(top)}Z`;
  const bubbles = [-0.4, -0.1, 0.25, 0.5]
    .map((u, i) => `<path d="${oval(cx + u * r, top + 0.4, 1.6 + (i % 2), 0.8 + (i % 2) * 0.4)}" fill="none" stroke="#A8C080" stroke-width="0.6"/>`)
    .join("");
  return svg(
    w,
    h,
    `<defs>${metalDefs()}${radial("kpot", ["#5A606A", "#2A2E36", "#0A0C10"], undefined, 0.32, 0.25, 0.85)}${radial("kstew", ["#9AAA6A", "#6F8452", "#3A4A2A"], undefined, 0.4, 0.4, 0.7)}</defs>
<path d="M${f(cx - r * 0.92)} ${f(top + 1)}Q${f(cx - r * 0.85)} 4 ${f(cx)} 2Q${f(cx + r * 0.85)} 4 ${f(cx + r * 0.92)} ${f(top + 1)}" fill="none" stroke="#05070A" stroke-width="2.4"/>
<path d="M${f(cx - r * 0.92)} ${f(top + 1)}Q${f(cx - r * 0.85)} 4 ${f(cx)} 2Q${f(cx + r * 0.85)} 4 ${f(cx + r * 0.92)} ${f(top + 1)}" fill="none" stroke="url(#pironh)" stroke-width="1"/>
<path d="${belly}" fill="url(#kpot)" stroke="#05070A" stroke-width="1"/>
<path d="M${f(cx - r * 0.55)} ${f(top + pw * 0.62)}l-2 4M${f(cx + r * 0.55)} ${f(top + pw * 0.62)}l2 4M${f(cx)} ${f(top + pw * 0.66)}v4" stroke="#05070A" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${f(cx - r * 0.8)} ${f(top + pw * 0.12)}Q${f(cx - r * 0.9)} ${f(top + pw * 0.36)} ${f(cx - r * 0.45)} ${f(top + pw * 0.52)}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round"/>
<path d="M${f(cx - r * 1.04)} ${f(top + pw * 0.2)}h${f(pw * 1.04)}" stroke="#05070A" stroke-opacity="0.6" stroke-width="1"/>
<path d="${oval(cx, top, r, r * 0.22)}" fill="url(#kstew)" stroke="#05070A" stroke-width="1.4"/>
${bubbles}
<path d="${rrect(cx - r - 3, top - 2, 4, 4, 1)}" fill="url(#piron)" stroke="#05070A" stroke-width="0.6"/>
<path d="${rrect(cx + r - 1, top - 2, 4, 4, 1)}" fill="url(#piron)" stroke="#05070A" stroke-width="0.6"/>`,
  );
}

/** The fire's light: a warm wash round the hearth and over the flags,
 *  flickering; sparks going up the chimney; steam off the stew. */
function kitchenUnder(fx: FlatFrame, P: KitchenPlan) {
  "worklet";
  const { c, time, draw, img } = fx;
  const flick = 0.75 + 0.12 * Math.sin(time * 6.3) + 0.08 * Math.sin(time * 13.7) + 0.05 * Math.sin(time * 2.1);
  fx.screen[0].setAlphaf(0.55 * flick);
  draw(img.fire, P.fire.x, P.fire.y, P.fire.w, P.fire.h, fx.screen[0]);
  fx.screen[1].setAlphaf(0.4 * flick);
  draw(img.fire, P.floorFire.x, P.floorFire.y, P.floorFire.w, P.floorFire.h, fx.screen[1]);
  // sparks rising from the logs
  const E = P.embers;
  fx.fill.setColor(Skia.Color("#FFB84A"));
  for (let i = 0; i < 9; i++) {
    const u = (i * 0.37 + time * (0.3 + (i % 3) * 0.08)) % 1;
    const x = E.x0 + (E.x1 - E.x0) * ((i * 0.618) % 1) + Math.sin(time * 3 + i * 2) * 4 * u;
    const y = E.y0 + (E.y1 - E.y0) * u;
    fx.fill.setAlphaf(0.9 * (1 - u));
    c.drawCircle(x, y, 0.9 * (1 - u * 0.5), fx.fill);
  }
  // steam curling up off the stew
  const S = P.steam;
  for (let i = 0; i < 7; i++) {
    const u = (i / 7 + time * 0.2) % 1;
    const x = S.x + (((i * 0.53) % 1) - 0.5) * S.w * 0.6 + Math.sin(time * 1.4 + i * 1.7) * 6 * u;
    const y = S.y - u * S.w * 1.5;
    const r = S.w * (0.22 + u * 0.3);
    fx.screen[2].setAlphaf(0.5 * Math.sin(Math.PI * u) * (1 - u * 0.3));
    draw(img.puff, x - r, y - r, r * 2, r * 2, fx.screen[2]);
  }
}

export const kitchen = flatRoom({
  id: "kitchen",
  light: LIGHT,
  plan: kitchenPlan,
  art: kitchenArt,
  propArt: cauldronArt,
  mapArt: (P) => manorMapArt(P.map.w, P.map.h, "pinned"),
  notebookArt: (P) => notebookArt(P.notebook.w, P.notebook.h, 8),
  motion: (P) => ({ kind: "swing", x: P.hook.x, y: P.hook.y, degrees: 7, ring: true }),
  payoff: {
    burst: { kind: "puff", size: 38, color: "#EDE8DC", duration: 1200 },
    haptic: "tick",
    at: (P) => [P.steam.x, P.steam.y - 6],
  },
  images: () => ({
    puff: {
      w: 48,
      h: 48,
      key: "",
      art: () =>
        svg(48, 48, `<defs>${radial("kp", ["#F4F0E6", "#E8E4DA", "#E8E4DA"], [0.55, 0.22, 0])}</defs><rect width="48" height="48" fill="url(#kp)"/>`),
    },
    fire: {
      w: 160,
      h: 120,
      key: "",
      art: () =>
        svg(160, 120, `<defs>${radial("kf", [LIGHT, "#FF7A2A", "#FF7A2A"], [0.7, 0.25, 0])}</defs><rect width="160" height="120" fill="url(#kf)"/>`),
    },
  }),
  under: kitchenUnder,
});

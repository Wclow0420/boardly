// Seal the Manor's study, seen flat on (the iso study is rooms/study.ts):
// night-blue damask over an oak wainscot under a coffered ceiling, a tall
// round-headed window with the moon in it between crimson velvet drapes,
// and under it the pedestal desk with the room's ledger open on its
// reading slope — the record of last night's cards, the thing that works
// the room — a three-branched candelabrum, a chamberstick, the inkwell.
// The door to the left (a gilt sea chart there when the room has none);
// the tall bookcase on the right, its ladder leaning on it, the globe on
// top. As
// SVG markup, baked once (FlatRoom); what moves (the ledger, the flames,
// the moonlight) is drawn over it each frame.

import { Skia } from "@shopify/react-native-skia";

import { linear, radial } from "@/components/engraved/panel";
import { MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { Side } from "../../roomScenes";
import { manorMapArt, notebookArt, notebookOn } from "../keepsakes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  VEIN,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  ceilingArt,
  f,
  floorArt,
  floorShade,
  lit,
  partDefs,
  plateBox,
  poly,
  rnd,
  sideWallArt,
  spillArt,
  svg,
  type P2,
} from "../parts";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

export type { FlatExit };

const PAPER = ["#34548A", "#22396A", "#142448"];
const VELVET = ["#C2203A", "#8A1424", "#4A0610"];
const SKY = ["#0C1634", "#1A2A5A", "#2E4684"];
const LEATHER = ["#3E7A4E", "#24563A", "#123222"];
const STUDY_LIGHT = "#FFB066";

/** Where the study's pieces stand, for a layout: the art and the live
 *  canvas both read it. */
export function studyPlan(L: FlatLayout, exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, at } = L;
  const has = (side: Side) => exits.some((e) => e.side === side);
  const D = L.doors.left;
  // the bookcase takes the right end of the wall unless a door is there
  const caseW = Math.round((bx1 - bx0) * 0.24);
  const bookcase = has("right")
    ? null
    : {
        x: bx1 - caseW - 3,
        y: ceil + 30,
        w: caseW,
        h: floorY - ceil - 30,
        d: 13,
      };
  const left = D.x + D.w + 8;
  const right = bookcase ? bookcase.x - 4 : L.doors.right.x - 8;
  const cx = (left + right) / 2;
  const rail = Math.round(floorY - wallH * 0.27);
  // on a wider wall the window, the desk and the ledger grow with it
  const u = Math.min(1.35, Math.max(1, (right - left) / 100));
  const winW = Math.round(50 * u);
  const win = {
    x: cx - winW / 2,
    y: ceil + 24,
    w: winW,
    h: Math.round(floorY - wallH * 0.36 - (ceil + 24)),
  };
  // the desk: a box against the wall, its top seen from above
  const deskW = Math.min(112 * u, right - left + 6);
  const desk = {
    x0: cx - deskW / 2,
    x1: cx + deskW / 2,
    top: floorY - 38,
    z0: 2,
    z1: 30,
  };
  const [, topFront] = at(cx, desk.top, desk.z1);
  // the ledger on its slope, in the middle of the desk
  const ledger = { w: Math.round(82 * u), h: Math.round(44 * u) };
  const lx = cx - ledger.w / 2;
  const ly = topFront - ledger.h - 2;
  // the flames: three on the candelabrum, one in the chamberstick
  const [clx] = at(desk.x0 + 9, desk.top, 10);
  const [crx, crFoot] = at(desk.x1 - 7, desk.top, 18);
  const [, cTop] = at(cx, desk.top, 10);
  const flames = [
    { x: clx - 7.5, y: cTop - 37, s: 1 },
    { x: clx, y: cTop - 44, s: 1.1 },
    { x: clx + 7.5, y: cTop - 37, s: 1 },
    { x: crx, y: crFoot - 24, s: 0.9 },
  ];
  // the manor's map propped in a gilt frame on the bookcase's second
  // shelf, the notebook lying on its fourth, both clear of the ladder
  let map: { x: number; y: number; w: number; h: number } | undefined;
  let notebook: typeof map;
  if (bookcase) {
    const [fx0, fy0] = at(bookcase.x, bookcase.y, bookcase.d);
    const [fx1, fy1] = at(bookcase.x + bookcase.w, floorY, bookcase.d);
    const inX0 = fx0 + 5;
    const inX1 = fx1 - 5;
    const iw = inX1 - inX0;
    const sh = (fy1 - fy0 - 24) / 5;
    const base = (s: number) => fy0 + 12 + sh * (s + 1) - 2.5;
    const mw = Math.round(Math.min(34, iw * 0.52));
    const mh = Math.round(Math.min(sh - 4, mw * 0.82));
    map = { x: Math.round(inX1 - mw), y: Math.round(base(1) - mh + 1), w: mw, h: mh };
    notebook = notebookOn(inX1 - iw * 0.26, base(3) + 1, Math.min(24, iw * 0.46));
  }
  return {
    map,
    notebook,
    bookcase,
    cx,
    rail,
    win,
    desk,
    topFront,
    ledger: { ...ledger, x: lx, y: ly },
    prop: { ...ledger, x: lx, y: ly },
    flames,
    stick: { x: crx, y: crFoot },
    D,
    has,
  };
}
export type StudyPlan = ReturnType<typeof studyPlan>;

/** A small damask motif: a pointed lozenge, two leaves, a gold dot. */
function damask(x: number, y: number, s: number) {
  return `M${f(x)} ${f(y - s)}C${f(x + s * 0.55)} ${f(y - s * 0.35)} ${f(x + s * 0.55)} ${f(y + s * 0.35)} ${f(x)} ${f(y + s)}C${f(x - s * 0.55)} ${f(y + s * 0.35)} ${f(x - s * 0.55)} ${f(y - s * 0.35)} ${f(x)} ${f(y - s)}Z
M${f(x + s * 0.5)} ${f(y)}q${f(s * 0.5)} ${f(-s * 0.55)} ${f(s * 0.9)} ${f(-s * 0.1)}q${f(-s * 0.35)} ${f(s * 0.45)} ${f(-s * 0.9)} ${f(s * 0.1)}Z
M${f(x - s * 0.5)} ${f(y)}q${f(-s * 0.5)} ${f(-s * 0.55)} ${f(-s * 0.9)} ${f(-s * 0.1)}q${f(s * 0.35)} ${f(s * 0.45)} ${f(s * 0.9)} ${f(s * 0.1)}Z`;
}

/** The round-headed window: an oak casing with gold beading, the night
 *  sky with stars and the moon, glazing bars and a fanlight, the sill. */
function windowArt(W: StudyPlan["win"]) {
  const { x, y, w, h } = W;
  const r = w / 2;
  const opening = `M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`;
  const t = 5;
  const casing = `M${f(x - t)} ${f(y + h + 2)}V${f(y + r)}A${f(r + t)} ${f(r + t)} 0 0 1 ${f(x + w + t)} ${f(y + r)}V${f(y + h + 2)}Z`;
  const mx = x + w * 0.7;
  const my = y + r * 0.95;
  const stars = Array.from({ length: 14 }, (_, i) => {
    const sx = x + 3 + rnd(i * 3 + 1) * (w - 6);
    const sy = y + r * 0.4 + rnd(i * 7 + 2) * (h * 0.7);
    return `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(0.4 + rnd(i) * 0.5)}" fill="#fff" fill-opacity="${f(0.5 + rnd(i * 5) * 0.5)}"/>`;
  }).join("");
  // glazing bars: a mullion, transoms, the fanlight's spokes
  const bars: string[] = [`M${f(x + w / 2)} ${f(y + h)}V${f(y)}`];
  for (const k of [0.36, 0.66]) bars.push(`M${f(x)} ${f(y + r + (h - r) * k)}H${f(x + w)}`);
  bars.push(`M${f(x)} ${f(y + r)}H${f(x + w)}`);
  for (const a of [-60, -30, 30, 60]) {
    const rad = ((a - 90) * Math.PI) / 180;
    bars.push(`M${f(x + r)} ${f(y + r)}L${f(x + r + Math.cos(rad) * r)} ${f(y + r + Math.sin(rad) * r)}`);
  }
  bars.push(`M${f(x + r - 7)} ${f(y + r)}A7 7 0 0 1 ${f(x + r + 7)} ${f(y + r)}`);
  return `<defs>${linear("wsky", SKY)}${radial("wmg", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.9, 0.35, 0])}${radial("wmn", ["#FFFFFF", "#F2F4FA", "#C8D0E2"], undefined, 0.4, 0.35, 0.75)}<clipPath id="wclip"><path d="${opening}"/></clipPath></defs>
<path d="${casing}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>
<path d="${casing}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="${opening}" fill="url(#wsky)"/>
<g clip-path="url(#wclip)">
${stars}
<circle cx="${f(mx)}" cy="${f(my)}" r="${f(w * 0.5)}" fill="url(#wmg)"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="${f(w * 0.13)}" fill="url(#wmn)" stroke="#8EA3BC" stroke-width="0.5"/>
<circle cx="${f(mx - 1.6)}" cy="${f(my + 1)}" r="1.4" fill="#C8D0E2" fill-opacity="0.7"/>
<path d="M${f(x - 4)} ${f(y + h * 0.62)}q${f(w * 0.3)} -5 ${f(w * 0.55)} -1q${f(w * 0.3)} 3 ${f(w * 0.6)} -2" fill="none" stroke="#6A88C4" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
<path d="${bars.join("")}" stroke="#05070E" stroke-width="2.6"/>
<path d="${bars.join("")}" stroke="url(#poakh)" stroke-width="1.4"/>
<path d="M${f(x + 2)} ${f(y + h - 3)}V${f(y + r)}" stroke="#fff" stroke-opacity="0.22" stroke-width="1.2"/>
</g>
<path d="${opening}" fill="none" stroke="url(#pgv)" stroke-width="1.2"/>
<path d="${opening}" fill="none" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x - t - 3)} ${f(y + h)}h${f(w + 2 * t + 6)}v5h${f(-(w + 2 * t + 6))}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(x - t - 2)} ${f(y + h + 1)}H${f(x + w * 0.6)}" stroke="#F0D0A8" stroke-opacity="0.4" stroke-width="0.7"/>`;
}

/** The window's panes as lightning lights them (drawn with the flash). */
export function windowFlashArt(P: StudyPlan) {
  const { w, h } = P.win;
  const r = w / 2;
  const pad = 30;
  return svg(
    w + pad * 2,
    h + pad * 2,
    `<defs>${radial("fl", ["#E8F0FF", "#B8CCFF", "#B8CCFF"], [0.6, 0.25, 0])}</defs>
<rect width="${w + pad * 2}" height="${h + pad * 2}" fill="url(#fl)"/>
<path d="M${pad} ${pad + h}V${pad + r}A${r} ${r} 0 0 1 ${pad + w} ${pad + r}V${pad + h}Z" fill="#F4F8FF" fill-opacity="0.85"/>`,
  );
}

/** Crimson velvet drapes either side of the window, gathered by gold
 *  tie-backs, under a swagged pelmet with a fringe and tassels. */
function drapesArt(W: StudyPlan["win"], top: number, bottom: number) {
  const out: string[] = [];
  const { x, w } = W;
  for (const side of [-1, 1]) {
    const inner = side < 0 ? x + 9 : x + w - 9;
    const outer = side < 0 ? x - 19 : x + w + 19;
    const tie = top + (bottom - top) * 0.52;
    const waist = side < 0 ? x - 6 : x + w + 6;
    const d = `M${f(outer)} ${f(top)}L${f(inner)} ${f(top)}C${f(inner)} ${f(top + 30)} ${f(waist + side * -2)} ${f(tie - 16)} ${f(waist)} ${f(tie)}C${f(waist - side * 3)} ${f(tie + 20)} ${f(inner - side * 4)} ${f(bottom - 8)} ${f(inner - side * 8)} ${f(bottom)}L${f(outer)} ${f(bottom)}Z`;
    const folds = [0.25, 0.5, 0.75]
      .map((k) => {
        const tx = outer + (inner - outer) * k;
        const bx = outer + (inner - side * 8 - outer) * k;
        const wx = outer + (waist - outer) * k;
        return `M${f(tx)} ${f(top + 2)}C${f(tx)} ${f(top + 30)} ${f(wx)} ${f(tie - 10)} ${f(wx)} ${f(tie)}C${f(wx)} ${f(tie + 14)} ${f(bx)} ${f(bottom - 20)} ${f(bx)} ${f(bottom)}`;
      })
      .join("");
    out.push(
      `<path d="${d}" fill="#000" fill-opacity="0.4" transform="translate(${side * 1.5} 2)"/>`,
      `<path d="${d}" fill="url(#dvel)" stroke="#2A0408" stroke-width="0.9"/>`,
      `<path d="${folds}" fill="none" stroke="#3A0610" stroke-opacity="0.8" stroke-width="1.4"/>`,
      `<path d="${folds}" fill="none" stroke="#FF9AA6" stroke-opacity="0.22" stroke-width="0.7" transform="translate(1.4 0)"/>`,
      // the tie-back and its tassel
      `<path d="M${f(outer)} ${f(tie - 2)}Q${f(waist)} ${f(tie + 4)} ${f(waist + side * 3)} ${f(tie - 1)}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`,
      `<path d="M${f(outer)} ${f(tie - 2)}Q${f(waist)} ${f(tie + 4)} ${f(waist + side * 3)} ${f(tie - 1)}" fill="none" stroke="url(#pgh)" stroke-width="2.2" stroke-linecap="round"/>`,
      `<circle cx="${f(waist + side * 3)}" cy="${f(tie)}" r="2.6" fill="url(#pgd)" stroke="${INK}" stroke-width="0.6"/>`,
      `<path d="M${f(waist + side * 3 - 2.4)} ${f(tie + 2)}h4.8l1.2 9h-7.2Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<path d="M${f(waist + side * 3 - 2)} ${f(tie + 5)}v5.5M${f(waist + side * 3)} ${f(tie + 5)}v6M${f(waist + side * 3 + 2)} ${f(tie + 5)}v5.5" stroke="${VEIN}" stroke-width="0.5"/>`,
    );
  }
  // the pelmet: a gilt board, a swag of velvet, a fringe
  const px0 = x - 23;
  const px1 = x + w + 23;
  const swag = `M${f(px0)} ${f(top - 2)}H${f(px1)}V${f(top + 6)}C${f(px1 - 8)} ${f(top + 16)} ${f(x + w * 0.62)} ${f(top + 16)} ${f(x + w / 2)} ${f(top + 9)}C${f(x + w * 0.38)} ${f(top + 16)} ${f(px0 + 8)} ${f(top + 16)} ${f(px0)} ${f(top + 6)}Z`;
  const fringe: string[] = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const fx = px0 + (px1 - px0) * t;
    const fy = top + 6 + Math.abs(Math.sin(Math.PI * 2 * t)) * 8.5;
    fringe.push(`M${f(fx)} ${f(fy)}v3`);
  }
  out.push(
    `<path d="${swag}" fill="#000" fill-opacity="0.4" transform="translate(0 2)"/>`,
    `<path d="${swag}" fill="url(#dvel)" stroke="#2A0408" stroke-width="0.9"/>`,
    `<path d="${fringe.join("")}" stroke="#E2B04A" stroke-width="1.1"/>`,
    `<rect x="${f(px0 - 3)}" y="${f(top - 7)}" width="${f(px1 - px0 + 6)}" height="6" rx="1" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>`,
    `<path d="M${f(px0)} ${f(top - 5.8)}H${f(x + w / 2)}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7"/>`,
    `<circle cx="${f(x + w / 2)}" cy="${f(top - 4)}" r="2.4" fill="url(#dsap)" stroke="${INK}" stroke-width="0.6"/>`,
  );
  return out.join("");
}

/** A gilt-framed sea chart: parchment, a coast, rhumb lines from a
 *  compass rose. */
function chartArt(x: number, y: number, w: number, h: number) {
  const cx = x + w * 0.62;
  const cy = y + h * 0.55;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a) * w)} ${f(cy + Math.sin(a) * w)}`;
  }).join("");
  const star = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 2.4 : 6;
    return `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
  });
  return `<defs><clipPath id="chc"><rect x="${f(x + 4)}" y="${f(y + 4)}" width="${f(w - 8)}" height="${f(h - 8)}"/></clipPath></defs>
<rect x="${f(x + 1.5)}" y="${f(y + 2.5)}" width="${f(w)}" height="${f(h)}" fill="#000" fill-opacity="0.45"/>
<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.9"/>
<rect x="${f(x + 4)}" y="${f(y + 4)}" width="${f(w - 8)}" height="${f(h - 8)}" fill="url(#civ)" stroke="${INK}" stroke-width="0.7"/>
<g clip-path="url(#chc)">
<path d="${rays}" stroke="#8A6A3A" stroke-opacity="0.35" stroke-width="0.4"/>
<path d="M${f(x + 4)} ${f(y + h * 0.3)}c6 2 8 -3 13 1s5 8 10 7s4 9 2 14l-2 ${f(h)}H${f(x + 4)}Z" fill="#C8B488" fill-opacity="0.7" stroke="#6A4A1A" stroke-width="0.6"/>
<path d="M${star.join("L")}Z" fill="#9A1828" stroke="#3A0408" stroke-width="0.4"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="1" fill="#F0CC72"/>
</g>
<path d="M${f(x + 1.2)} ${f(y + h - 2)}V${f(y + 1.2)}H${f(x + w * 0.6)}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/>
${[
  [x, y],
  [x + w, y],
  [x, y + h],
  [x + w, y + h],
]
  .map(
    ([px, py]) => `<circle cx="${f(px)}" cy="${f(py)}" r="2.2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
  )
  .join("")}`;
}

/** The bookcase: an oak carcass with a gilt cornice, its left side seen
 *  in perspective, five shelves of books in leather with gold bands, a
 *  brass rail along the top with the ladder hooked on it, the globe on
 *  top. */
function bookcaseArt(L: FlatLayout, B: NonNullable<StudyPlan["bookcase"]>) {
  const { at } = L;
  const out: string[] = [];
  const front = (x: number, y: number) => at(x, y, B.d);
  const [fx0, fy0] = front(B.x, B.y);
  const [fx1, fy1] = front(B.x + B.w, L.floorY);
  // the left side, seen as it runs back to the wall
  const sideFace = [at(B.x, B.y, 0), front(B.x, B.y), front(B.x, L.floorY), at(B.x, L.floorY, 0)];
  out.push(
    `<path d="${poly([at(B.x - 4, L.floorY, 0), front(B.x - 4, L.floorY), front(B.x + B.w + 6, L.floorY), at(B.x + B.w + 6, L.floorY, 0)])}" fill="#000" fill-opacity="0.45"/>`,
    `<path d="${poly(sideFace)}" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
  );
  const inX0 = fx0 + 5;
  const inX1 = fx1 - 5;
  const inY0 = fy0 + 12;
  const inY1 = fy1 - 12;
  out.push(`<rect x="${f(inX0)}" y="${f(inY0)}" width="${f(inX1 - inX0)}" height="${f(inY1 - inY0)}" fill="#1A0E06"/>`);
  const shelves = 5;
  const sh = (inY1 - inY0) / shelves;
  const COLS = ["#8A1424", "#22396A", "#2E5A3A", "#6A3A1E", "#A87A2A", "#3A2A4E", "#5A1A1A"];
  let n = 0;
  for (let s = 0; s < shelves; s++) {
    const base = inY0 + sh * (s + 1) - 2.5;
    let bx = inX0 + 1;
    while (bx < inX1 - 3) {
      n++;
      const bw = 3.2 + rnd(n * 3.1) * 3.4;
      if (bx + bw > inX1 - 1) break;
      const bh = sh * (0.62 + rnd(n * 1.7) * 0.3);
      const c = COLS[Math.floor(rnd(n * 5.3) * COLS.length)];
      // now and then a book lies flat, or leans
      if (rnd(n * 9.1) > 0.9 && bx + 14 < inX1) {
        out.push(
          `<rect x="${f(bx)}" y="${f(base - 4)}" width="13" height="4" fill="${c}" stroke="${WOOD_INK}" stroke-width="0.5"/><rect x="${f(bx + 1)}" y="${f(base - 7.5)}" width="11" height="3.5" fill="${COLS[(n + 2) % COLS.length]}" stroke="${WOOD_INK}" stroke-width="0.5"/>`,
        );
        bx += 14;
        continue;
      }
      out.push(
        `<rect x="${f(bx)}" y="${f(base - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${c}" stroke="${WOOD_INK}" stroke-width="0.5"/>`,
        `<path d="M${f(bx + 0.4)} ${f(base - bh * 0.82)}h${f(bw - 0.8)}M${f(bx + 0.4)} ${f(base - bh * 0.24)}h${f(bw - 0.8)}" stroke="#E2B04A" stroke-opacity="0.85" stroke-width="0.7"/>`,
        `<path d="M${f(bx + 0.8)} ${f(base - bh + 1)}V${f(base - 1)}" stroke="#fff" stroke-opacity="0.18" stroke-width="0.6"/>`,
      );
      bx += bw + 0.3;
    }
    // the shelf's front edge
    out.push(
      `<rect x="${f(inX0 - 1)}" y="${f(base)}" width="${f(inX1 - inX0 + 2)}" height="3" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
      `<path d="M${f(inX0)} ${f(base + 0.7)}H${f(inX1)}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.5"/>`,
    );
  }
  // a shade in the top of each shelf
  out.push(
    `<rect x="${f(inX0)}" y="${f(inY0)}" width="${f(inX1 - inX0)}" height="${f(inY1 - inY0)}" fill="url(#bksh)"/>`,
  );
  // cornice and plinth
  out.push(
    `<path d="M${f(fx0 - 4)} ${f(fy0 + 9)}H${f(fx1 + 4)}L${f(fx1 + 2)} ${f(fy0)}H${f(fx0 - 2)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<rect x="${f(fx0 - 4)}" y="${f(fy0 + 7)}" width="${f(fx1 - fx0 + 8)}" height="2.4" fill="url(#pgv)"/>`,
    `<rect x="${f(fx0 - 2)}" y="${f(fy1 - 10)}" width="${f(fx1 - fx0 + 4)}" height="10" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(fx0)} ${f(fy1 - 9)}H${f(fx1)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>`,
    `<path d="M${f(fx0 + 1.2)} ${f(fy1 - 11)}V${f(fy0 + 10)}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.8"/>`,
  );
  // the brass rail and the ladder hooked on it
  const railY = inY0 + 2;
  out.push(
    `<rect x="${f(inX0 - 2)}" y="${f(railY - 1.4)}" width="${f(inX1 - inX0 + 4)}" height="2.8" rx="1.4" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
  );
  const [lbx, lby] = at(B.x + B.w * 0.22, L.floorY, B.d + 34);
  const lt = { x: inX0 + (inX1 - inX0) * 0.36, y: railY };
  const rails = [-6, 6].map((dx) => `M${f(lt.x + dx * 0.8)} ${f(lt.y)}L${f(lbx + dx * 1.3)} ${f(lby)}`).join("");
  const rungs: string[] = [];
  for (let i = 1; i < 11; i++) {
    const t = i / 11;
    const y = lt.y + (lby - lt.y) * t;
    const x = lt.x + (lbx - lt.x) * t;
    const hw = 4.8 + t * 3;
    rungs.push(`M${f(x - hw)} ${f(y)}H${f(x + hw)}`);
  }
  out.push(
    `<path d="${rungs.join("")}" stroke="${WOOD_INK}" stroke-width="2.4"/>`,
    `<path d="${rungs.join("")}" stroke="url(#poakh)" stroke-width="1.3"/>`,
    `<path d="${rails}" stroke="${WOOD_INK}" stroke-width="3.6" stroke-linecap="round"/>`,
    `<path d="${rails}" stroke="url(#poakh)" stroke-width="2.2" stroke-linecap="round"/>`,
    `<path d="M${f(lt.x - 5)} ${f(lt.y - 2.5)}a2.4 2.4 0 0 1 0 5M${f(lt.x + 5)} ${f(lt.y - 2.5)}a2.4 2.4 0 0 1 0 5" fill="none" stroke="url(#pgv)" stroke-width="1.2"/>`,
  );
  // the globe on top: a turned brass foot, the meridian ring, the sphere
  const gx = (fx0 + fx1) / 2;
  const gr = Math.min(13, (fx1 - fx0) * 0.24);
  const gy = fy0 - gr - 9;
  out.push(
    `<path d="M${f(gx - 9)} ${f(fy0)}h18l-3 -4h-12Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<path d="M${f(gx - 1.6)} ${f(fy0 - 4)}V${f(gy + gr + 1)}h3.2V${f(fy0 - 4)}Z" fill="url(#pgh)" stroke="${INK}" stroke-width="0.6"/>`,
    `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(gr)}" fill="url(#gsea)" stroke="#0A1430" stroke-width="0.9"/>`,
    `<path d="M${f(gx - gr * 0.7)} ${f(gy - gr * 0.3)}c3 -3 6 -1 7 -4s4 1 3 4s-4 2 -3 6s-3 5 -5 2s-4 -4 -2 -8Z" fill="url(#civ)" fill-opacity="0.85" stroke="#3A2408" stroke-width="0.4"/>`,
    `<path d="M${f(gx + gr * 0.15)} ${f(gy + gr * 0.1)}c2 -2 5 -1 6 1s-1 5 -3 6s-4 -1 -4 -3Z" fill="url(#civ)" fill-opacity="0.85" stroke="#3A2408" stroke-width="0.4"/>`,
    `<path d="M${f(gx - gr)} ${f(gy)}Q${f(gx)} ${f(gy + gr * 0.35)} ${f(gx + gr)} ${f(gy)}" fill="none" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="0.6"/>`,
    `<path d="M${f(gx - gr - 2.2)} ${f(gy + 3)}A${f(gr + 2.4)} ${f(gr + 2.4)} 0 1 1 ${f(gx + gr + 2.2)} ${f(gy + 3)}" fill="none" stroke="${INK}" stroke-width="3"/>`,
    `<path d="M${f(gx - gr - 2.2)} ${f(gy + 3)}A${f(gr + 2.4)} ${f(gr + 2.4)} 0 1 1 ${f(gx + gr + 2.2)} ${f(gy + 3)}" fill="none" stroke="url(#pgv)" stroke-width="1.6"/>`,
    `<path d="M${f(gx - gr * 0.65)} ${f(gy - gr * 0.55)}A${f(gr * 0.85)} ${f(gr * 0.85)} 0 0 1 ${f(gx - gr * 0.05)} ${f(gy - gr * 0.85)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round"/>`,
  );
  return out.join("");
}

/** The pedestal desk against the wall under the window, its top seen
 *  from above: green leather tooled in gold, drawers with brass pulls
 *  in each pedestal, the kneehole between; the reading slope for the
 *  ledger, the candelabrum and the chamberstick, the inkwell. */
function deskArt(L: FlatLayout, P: StudyPlan) {
  const { at, floorY } = L;
  const { x0, x1, top, z0, z1 } = P.desk;
  const out: string[] = [];
  const A = (x: number, y: number, z: number) => at(x, y, z);
  const [fx0, fy0] = A(x0, top, z1);
  const [fx1, fy1] = A(x1, floorY, z1);
  // its shadow on the boards
  out.push(
    `<path d="${poly([A(x0 - 6, floorY, z0), A(x1 + 6, floorY, z0), A(x1 + 10, floorY, z1 + 10), A(x0 - 10, floorY, z1 + 10)])}" fill="#000" fill-opacity="0.45"/>`,
  );
  // the top: the slab seen from above, the leather inset
  const topFace = [A(x0 - 2, top, z0), A(x1 + 2, top, z0), A(x1 + 2, top, z1 + 2), A(x0 - 2, top, z1 + 2)];
  const inset = [A(x0 + 6, top, z0 + 4), A(x1 - 6, top, z0 + 4), A(x1 - 6, top, z1 - 3), A(x0 + 6, top, z1 - 3)];
  out.push(
    `<path d="${poly(topFace)}" fill="url(#dtop)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="${poly(inset)}" fill="url(#dleather)" stroke="#0A1A10" stroke-width="0.7"/>`,
    `<path d="${poly(inset)}" fill="none" stroke="#E2B04A" stroke-opacity="0.7" stroke-width="0.6" transform="translate(0 0)"/>`,
  );
  // the front: an edge, the apron, two pedestals of drawers, the kneehole
  const [, edgeY] = A(x0, top + 5, z1 + 2);
  out.push(
    `<rect x="${f(fx0 - 2.5)}" y="${f(fy0)}" width="${f(fx1 - fx0 + 5)}" height="${f(edgeY - fy0)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="M${f(fx0)} ${f(fy0 + 1)}H${f(fx0 + (fx1 - fx0) * 0.5)}" stroke="#F0D0A8" stroke-opacity="0.45" stroke-width="0.8"/>`,
  );
  const pedW = (fx1 - fx0) * 0.3;
  const kneeTop = edgeY + 10;
  out.push(
    `<rect x="${f(fx0)}" y="${f(edgeY)}" width="${f(fx1 - fx0)}" height="${f(fy1 - edgeY)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<rect x="${f(fx0 + pedW)}" y="${f(kneeTop)}" width="${f(fx1 - fx0 - 2 * pedW)}" height="${f(fy1 - kneeTop)}" fill="#120804"/>`,
    `<path d="M${f(fx0 + pedW)} ${f(kneeTop)}H${f(fx1 - pedW)}" stroke="#F0D0A8" stroke-opacity="0.2" stroke-width="0.7"/>`,
  );
  // the drawer across the apron, and three in each pedestal
  const drawer = (x: number, y: number, w: number, h: number) =>
    `<path d="${rrect(x, y, w, h, 1)}" fill="#24140A" fill-opacity="0.4" stroke="${WOOD_INK}" stroke-width="0.7"/>
<path d="M${f(x + w / 2 - 3)} ${f(y + h / 2)}a3 2 0 0 0 6 0" fill="none" stroke="url(#pgv)" stroke-width="1.2"/>
<circle cx="${f(x + w / 2 - 3)}" cy="${f(y + h / 2)}" r="0.9" fill="url(#pgd)"/><circle cx="${f(x + w / 2 + 3)}" cy="${f(y + h / 2)}" r="0.9" fill="url(#pgd)"/>`;
  out.push(drawer(fx0 + pedW + 3, edgeY + 2, fx1 - fx0 - 2 * pedW - 6, kneeTop - edgeY - 4));
  for (const px of [fx0 + 2.5, fx1 - pedW + 0.5]) {
    const dh = (fy1 - edgeY - 8) / 3;
    for (let i = 0; i < 3; i++) out.push(drawer(px, edgeY + 2 + i * (dh + 1), pedW - 3, dh));
  }
  out.push(
    `<rect x="${f(fx0 - 1.5)}" y="${f(fy1 - 4)}" width="${f(fx1 - fx0 + 3)}" height="4" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  );

  // on the desk: the reading slope (the ledger lies on it, drawn live)
  const { x: lx, y: ly, w: lw, h: lh } = P.ledger;
  const slope = `M${f(lx + 6)} ${f(ly + 8)}H${f(lx + lw - 6)}L${f(lx + lw + 1)} ${f(ly + lh + 2)}H${f(lx - 1)}Z`;
  out.push(
    `<path d="M${f(lx - 2)} ${f(ly + lh + 4)}H${f(lx + lw + 2)}" stroke="#000" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="${slope}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<rect x="${f(lx - 2)}" y="${f(ly + lh)}" width="${f(lw + 4)}" height="3.2" rx="1.2" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
  );
  // the candelabrum: a turned brass stem, three arms, ivory candles
  const [cfx] = A(x0 + 9, top, 10);
  const [, cfy] = A(x0 + 9, top, 10);
  const fl = P.flames;
  const armY = cfy - 22;
  out.push(
    `<path d="M${f(cfx - 7)} ${f(cfy)}h14l-2.5 -3.5h-9Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<path d="M${f(cfx - 1.6)} ${f(cfy - 3.5)}V${f(armY - 6)}h3.2V${f(cfy - 3.5)}Z" fill="url(#pgh)" stroke="${INK}" stroke-width="0.6"/>`,
    `<circle cx="${f(cfx)}" cy="${f(cfy - 9)}" r="2.6" fill="url(#pgd)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="M${f(fl[0].x)} ${f(fl[0].y + 15)}Q${f(fl[0].x)} ${f(armY + 4)} ${f(cfx)} ${f(armY)}Q${f(fl[2].x)} ${f(armY + 4)} ${f(fl[2].x)} ${f(fl[2].y + 15)}" fill="none" stroke="${INK}" stroke-width="3.2"/>`,
    `<path d="M${f(fl[0].x)} ${f(fl[0].y + 15)}Q${f(fl[0].x)} ${f(armY + 4)} ${f(cfx)} ${f(armY)}Q${f(fl[2].x)} ${f(armY + 4)} ${f(fl[2].x)} ${f(fl[2].y + 15)}" fill="none" stroke="url(#pgv)" stroke-width="1.8"/>`,
  );
  for (const c of fl) {
    const base = c === fl[3] ? P.stick.y - 2 : c === fl[1] ? armY - 5 : fl[0].y + 15;
    const top2 = c.y + 7;
    out.push(
      `<path d="M${f(c.x - 3.6)} ${f(base + 1.5)}h7.2l-1 -3h-5.2Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<rect x="${f(c.x - 2.1)}" y="${f(top2)}" width="4.2" height="${f(base - 1.5 - top2)}" fill="url(#civh)" stroke="${INK}" stroke-width="0.55"/>`,
      `<path d="M${f(c.x - 1.3)} ${f(top2 + 1.5)}V${f(base - 3)}" stroke="#fff" stroke-opacity="0.9" stroke-width="0.6"/>`,
      `<path d="M${f(c.x)} ${f(top2)}v-1.8" stroke="#2A1A08" stroke-width="0.7"/>`,
    );
  }
  // the chamberstick's dish
  const sy = P.stick.y;
  out.push(
    `<path d="M${f(fl[3].x - 7)} ${f(sy - 1)}Q${f(fl[3].x)} ${f(sy - 3.5)} ${f(fl[3].x + 7)} ${f(sy - 1)}Q${f(fl[3].x + 8)} ${f(sy + 1.8)} ${f(fl[3].x)} ${f(sy + 2)}Q${f(fl[3].x - 8)} ${f(sy + 1.8)} ${f(fl[3].x - 7)} ${f(sy - 1)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/><path d="M${f(fl[3].x + 7)} ${f(sy - 0.5)}q2.4 0.4 1.8 2.2" fill="none" stroke="url(#pgv)" stroke-width="1.2"/>`,
  );
  // the inkwell, a stack of books between ledger and chamberstick
  const [ix, iy] = A(x0 + 28, top, 14);
  out.push(
    `<path d="${rrect(ix - 4.5, iy - 7, 9, 7, 1.5)}" fill="url(#dink)" stroke="#05070E" stroke-width="0.6"/>`,
    `<rect x="${f(ix - 3)}" y="${f(iy - 9)}" width="6" height="2.4" rx="0.8" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`,
    `<path d="M${f(ix - 2.6)} ${f(iy - 5.5)}V${f(iy - 1.5)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>`,
  );
  const [bx, by] = A(x1 - 26, top, 14);
  out.push(
    `<rect x="${f(bx - 9)}" y="${f(by - 4)}" width="18" height="4" rx="0.6" fill="#22396A" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
    `<rect x="${f(bx - 8)}" y="${f(by - 7.6)}" width="15" height="3.6" rx="0.6" fill="#8A1424" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
    `<path d="M${f(bx - 8)} ${f(by - 2)}h16M${f(bx - 7)} ${f(by - 5.8)}h13" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="0.5"/>`,
  );
  return out.join("");
}

/** The medallion rug on the boards: a crimson field in a night-blue
 *  border with a gold line, a medallion in the middle, a fringe. */
function rugArt(L: FlatLayout) {
  const { at, floorY, vx } = L;
  const X0 = vx - (L.bx1 - L.bx0) * 0.42;
  const X1 = vx + (L.bx1 - L.bx0) * 0.42;
  const Z0 = 44;
  const Z1 = L.zFront * 0.86;
  const q = (x0: number, x1: number, z0: number, z1: number) =>
    poly([at(x0, floorY, z0), at(x1, floorY, z0), at(x1, floorY, z1), at(x0, floorY, z1)]);
  const bw = (X1 - X0) * 0.08;
  const bz = (Z1 - Z0) * 0.07;
  const ring = (rx: number, rz: number) => {
    const zc = (Z0 + Z1) / 2;
    const pts: P2[] = Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return at(vx + Math.cos(a) * rx, floorY, zc + Math.sin(a) * rz);
    });
    return poly(pts);
  };
  const fringe: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = X0 + ((X1 - X0) * i) / 30;
    const a = at(x, floorY, Z1);
    const b = at(x, floorY, Z1 + 5);
    fringe.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
  }
  return `<path d="${q(X0, X1, Z0, Z1)}" fill="#000" fill-opacity="0.3" transform="translate(0 2)"/>
<path d="${q(X0, X1, Z0, Z1)}" fill="url(#rnavy)" stroke="#0A1430" stroke-width="0.8"/>
<path d="${q(X0 + bw, X1 - bw, Z0 + bz, Z1 - bz)}" fill="url(#rcrim)" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="1"/>
<path d="${q(X0 + bw * 0.45, X1 - bw * 0.45, Z0 + bz * 0.45, Z1 - bz * 0.45)}" fill="none" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="0.7" stroke-dasharray="3 2"/>
<path d="${ring((X1 - X0) * 0.2, (Z1 - Z0) * 0.24)}" fill="url(#rnavy)" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="0.9"/>
<path d="${ring((X1 - X0) * 0.12, (Z1 - Z0) * 0.14)}" fill="#8A1424" stroke="#E2B04A" stroke-opacity="0.7" stroke-width="0.7"/>
<path d="${ring((X1 - X0) * 0.04, (Z1 - Z0) * 0.05)}" fill="#E2B04A" fill-opacity="0.8"/>
<path d="${fringe.join("")}" stroke="#E8DCC0" stroke-opacity="0.55" stroke-width="0.7"/>`;
}

/** The whole study, still: everything but what lives. */
export function studyArt(L: FlatLayout, P: StudyPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: damask paper, the wainscot under a gilt rail
  const motifs: string[] = [];
  const dots: string[] = [];
  for (let r = 0, y = ceil + 14; y < P.rail; r++, y += 15) {
    for (let x = bx0 + (r % 2 ? 9 : 0); x < bx1 + 6; x += 18) {
      motifs.push(damask(x, y, 5));
      dots.push(`M${f(x + 9)} ${f(y + 7.5)}h0.01`);
    }
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bwall)"/>`,
    `<path d="${motifs.join("")}" fill="#5A7AB8" fill-opacity="0.22"/>`,
    `<path d="${dots.join("")}" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>`,
    // moonlight from the window, candlelight round the desk
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bmoon)"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bwarm)"/>`,
  );
  const panels: string[] = [];
  const pw = 22;
  for (let x = bx0 + 3; x + pw - 3 < bx1; x += pw) {
    panels.push(
      `<path d="${rrect(x + 2, P.rail + 7, pw - 4, floorY - 12 - P.rail - 7, 1.5)}" fill="#24140A" fill-opacity="0.5" stroke="${WOOD_INK}" stroke-width="0.8"/><path d="M${f(x + 3)} ${f(floorY - 13)}V${f(P.rail + 8)}H${f(x + pw - 3)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.22" stroke-width="0.6"/>`,
    );
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(P.rail)}" width="${f(bx1 - bx0)}" height="${f(floorY - P.rail)}" fill="url(#poak)"/>`,
    panels.join(""),
    `<rect x="${f(bx0)}" y="${f(P.rail - 2)}" width="${f(bx1 - bx0)}" height="4.4" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<path d="M${f(bx0)} ${f(P.rail - 1)}H${f(bx1)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.6"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 8)}" width="${f(bx1 - bx0)}" height="8" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  );
  // the side walls, their archways
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(sideWallArt(L, A.wall, PAPER, e ? { box: A, door: e.door, color: e.color } : null, P.rail));
  }
  // the ceiling over it all
  out.push(ceilingArt(L));
  // the floor, the rug, the light through the open ways
  out.push(floorArt(L), rugArt(L));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(
      spillArt(
        x + (back ? 0 : e.side === "frontLeft" ? 16 : -16),
        y + (back ? 8 : 4),
        back ? 34 : 30,
        back ? 11 : 16,
        e.color,
        `spill${e.side}`,
      ),
    );
  }
  // the back wall's doors, or a chart where there's none
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    const D = L.doors[side];
    if (e) out.push(backDoorArt(D, e.door, e.color, `bd${side[0]}`));
    else if (side === "left") out.push(chartArt(D.x, D.y + 16, D.w, D.w * 0.8));
  }
  if (P.bookcase) out.push(bookcaseArt(L, P.bookcase));
  out.push(windowArt(P.win), drapesArt(P.win, ceil + 15, P.desk.top + 4));
  out.push(deskArt(L, P));
  // the name plates over the ways out (the names are written live)
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
${lit("bwall", PAPER, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("bmoon", ["#9AB8E8", "#9AB8E8"], [0.22, 0], (P.cx - bx0) / (bx1 - bx0), 0.25, 0.5)}
${radial("bwarm", [STUDY_LIGHT, STUDY_LIGHT], [0.2, 0], (P.cx - bx0) / (bx1 - bx0), 0.85, 0.55)}
${linear("dvel", VELVET, false)}
${radial("dsap", ["#BFE0FF", "#3A6AC8", "#0C1E5A"], undefined, 0.38, 0.32, 0.75)}
${linear("dtop", ["#8A6440", "#6A4A2C", "#4E3420"])}
${linear("dleather", LEATHER)}
${radial("dink", ["#4A5A8A", "#141A2E", "#05070E"], undefined, 0.35, 0.3, 0.8)}
${linear("civ", MATERIALS.ivory)}
${linear("civh", MATERIALS.ivory, false)}
${radial("gsea", ["#9AC8F0", "#3A6AC8", "#0C1E5A"], undefined, 0.35, 0.3, 0.8)}
${linear("bksh", ["#000000", "#000000"], true, [0.35, 0])}
${linear("rnavy", ["#2E4684", "#1A2A5A", "#0C1634"])}
${linear("rcrim", ["#A01A2E", "#7A1020", "#4A0610"])}
</defs>
${out.join("\n")}`,
  );
}

// --------------------------------------------------------- the ledger

/** The ledger, open, w × h: two pages of ivory on a crimson leather
 *  binding with gold corners, lines of the record in ink, a column of
 *  marks, a ribbon down the gutter. Drawn live: it lifts and glows
 *  when the study is used. */
export function ledgerArt(w: number, h: number) {
  const c = w / 2;
  const topInset = 5;
  const cover = `M${f(topInset - 2)} 1H${f(w - topInset + 2)}L${f(w)} ${f(h - 1)}H0Z`;
  const page = (k: -1 | 1) => {
    const outerTop = k < 0 ? topInset + 1 : w - topInset - 1;
    const outerBot = k < 0 ? 2.5 : w - 2.5;
    return `M${f(c)} 4.5Q${f(c + k * (w * 0.2))} 1.5 ${f(outerTop)} 3.5L${f(outerBot)} ${f(h - 4)}Q${f(c + k * (w * 0.22))} ${f(h - 7)} ${f(c)} ${f(h - 3)}Z`;
  };
  const lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 9 + i * ((h - 16) / 6);
    const k = (y - 3.5) / (h - 7);
    const l0 = topInset + 4 - k * (topInset - 1);
    lines.push(`M${f(l0 + 1)} ${f(y)}h${f((c - l0 - 4) * (0.6 + rnd(i) * 0.35))}`);
  }
  const marks: string[] = [];
  const ticks: string[] = [];
  for (let i = 0; i < 5; i++) {
    const y = 10 + i * ((h - 18) / 5);
    marks.push(`M${f(c + 5)} ${f(y)}h${f(w * 0.22)}`);
    const mx = c + w * 0.33;
    if (i % 3 === 1) ticks.push(`M${f(mx - 2)} ${f(y - 2)}l4 4M${f(mx + 2)} ${f(y - 2)}l-4 4`);
    else ticks.push(`M${f(mx - 2.2)} ${f(y)}l1.6 1.8l3 -3.6`);
  }
  return svg(
    w,
    h,
    `<defs>${linear("lc", ["#B01E30", "#7A1020", "#4A0610"])}${lit("lp", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], 0, 0, w * 0.6, h * 1.3)}${linear("lg", ["#000000", "#000000", "#000000"], false, [0, 0.28, 0])}${linear("lgd", MATERIALS.gold)}</defs>
<path d="${cover}" fill="url(#lc)" stroke="#2A0408" stroke-width="1"/>
<path d="${page(-1)}" fill="url(#lp)" stroke="${INK}" stroke-width="0.7"/>
<path d="${page(1)}" fill="url(#lp)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(c - 2)} 4L${f(c - 2)} ${f(h - 3)}" stroke="#D8CCB0" stroke-width="0.6"/>
<path d="M${f(c + 2)} 4L${f(c + 2)} ${f(h - 3)}" stroke="#D8CCB0" stroke-width="0.6"/>
<rect x="${f(c - 7)}" y="3" width="14" height="${f(h - 6)}" fill="url(#lg)"/>
<path d="${lines.join("")}" stroke="#2A1A3A" stroke-opacity="0.75" stroke-width="0.8" stroke-linecap="round"/>
<path d="${marks.join("")}" stroke="#2A1A3A" stroke-opacity="0.55" stroke-width="0.6"/>
<path d="${ticks.join("")}" fill="none" stroke="#8A1424" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M${f(c + w * 0.27)} 6V${f(h - 6)}" stroke="#8A1424" stroke-opacity="0.35" stroke-width="0.5"/>
<path d="M${f(c)} ${f(h - 4)}l-2 ${f(9)}l2 -2l2 2Z" fill="#C2203A" stroke="#3A0408" stroke-width="0.5"/>
<path d="M${f(c - 1)} 4v${f(h - 8)}" stroke="#C2203A" stroke-width="1.6"/>
${[
  [topInset - 2, 1, 1],
  [w - topInset + 2, 1, -1],
  [0, h - 1, 1],
  [w, h - 1, -1],
]
  .map(
    ([x, y, k], i) =>
      `<path d="M${f(x)} ${f(y)}h${f(k * 6)}l${f(-k * 6)} ${f(i < 2 ? 5 : -5)}Z" fill="url(#lgd)" stroke="${INK}" stroke-width="0.5"/>`,
  )
  .join("")}
<path d="M${f(topInset + 2)} 4.5Q${f(c * 0.6)} 2.5 ${f(c - 3)} 5" fill="none" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>`,
  );
}

/** One leaf of the ledger, w × h (half the book), for the pages riffling
 *  over when it's read: ivory, lines of writing. */
export function leafArt(w: number, h: number) {
  const lines = Array.from(
    { length: 6 },
    (_, i) => `M3 ${f(8 + i * ((h - 14) / 6))}h${f((w - 8) * (0.55 + rnd(i + 9) * 0.35))}`,
  ).join("");
  return svg(
    w,
    h,
    `<defs>${lit("lf", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], 0, 0, w, h)}</defs>
<path d="M0.5 4.5Q${f(w * 0.4)} 1.5 ${f(w - 5)} 3.5L${f(w - 2.5)} ${f(h - 4)}Q${f(w * 0.45)} ${f(h - 7)} 0.5 ${f(h - 3)}Z" fill="url(#lf)" stroke="${INK}" stroke-width="0.7"/>
<path d="${lines}" stroke="#2A1A3A" stroke-opacity="0.6" stroke-width="0.7"/>`,
  );
}

/** The moonlight falling from the window to the boards in front of the
 *  desk, its own box: a pale shaft, the panes' light on the floor. */
export function moonShaft(L: FlatLayout, P: StudyPlan) {
  const { win } = P;
  const [ax] = L.at(win.x + 6, L.floorY, 70);
  const [bx, by] = L.at(win.x + win.w + 16, L.floorY, 150);
  const x0 = Math.min(win.x, ax) - 20;
  const x1 = Math.max(win.x + win.w, bx) + 30;
  const y0 = win.y + win.w / 2;
  const y1 = by + 10;
  const w = x1 - x0;
  const h = y1 - y0;
  const X = (x: number) => f(x - x0);
  const Y = (y: number) => f(y - y0);
  const patch = [
    L.at(win.x + 2, L.floorY, 72),
    L.at(win.x + win.w + 2, L.floorY, 72),
    L.at(win.x + win.w + 22, L.floorY, 150),
    L.at(win.x + 8, L.floorY, 150),
  ];
  const shaft = `M${X(win.x + 4)} ${Y(win.y + win.w / 2 + 4)}H${X(win.x + win.w - 4)}L${X(patch[2][0])} ${Y(patch[2][1])}H${X(patch[3][0])}Z`;
  const mull = [L.at(win.x + win.w / 2 + 2, L.floorY, 72), L.at(win.x + win.w / 2 + 14, L.floorY, 150)];
  return {
    x: x0,
    y: y0,
    w,
    h,
    art: () =>
      svg(
        w,
        h,
        `<defs>${linear("ms", ["#B8D0F4", "#B8D0F4", "#B8D0F4"], true, [0.07, 0.15, 0.03])}${radial("mp", ["#C8DCFF", "#C8DCFF"], [0.42, 0])}</defs>
<path d="${shaft}" fill="url(#ms)"/>
<path d="M${patch.map((p) => `${X(p[0])} ${Y(p[1])}`).join("L")}Z" fill="url(#mp)"/>
<path d="M${X(mull[0][0])} ${Y(mull[0][1])}L${X(mull[1][0])} ${Y(mull[1][1])}" stroke="#000" stroke-opacity="0.18" stroke-width="2.4"/>`,
      ),
  };
}

export const STUDY = { light: STUDY_LIGHT };

/** The study's moonlight, breathing, motes drifting in it, and the
 *  window lit up by lightning. */
function studyUnder(fx: FlatFrame, P: StudyPlan & { shaft: { x: number; y: number; w: number; h: number }; floorY: number }) {
  "worklet";
  const { c, time, draw, img } = fx;
  const sh = P.shaft;
  fx.screen[0].setAlphaf(0.8 + 0.2 * Math.sin(time * 0.35));
  draw(img.shaft, sh.x, sh.y, sh.w, sh.h, fx.screen[0]);
  fx.fill.setColor(Skia.Color("#DCE8FF"));
  for (let i = 0; i < 9; i++) {
    const u = (i * 0.618 + time * 0.012 * (1 + (i % 3) * 0.4)) % 1;
    const mx = P.win.x + P.win.w * (0.2 + 0.7 * ((i * 0.37) % 1)) + u * 26 + Math.sin(time * 0.6 + i) * 3;
    const my = P.win.y + P.win.h * 0.5 + u * (P.floorY - P.win.y) * 0.9;
    fx.fill.setAlphaf(0.5 * Math.sin(Math.PI * u));
    c.drawCircle(mx, my, 0.7 + (i % 3) * 0.25, fx.fill);
  }
  if (fx.flash > 0.01) {
    fx.screen[1].setAlphaf(Math.min(1, fx.flash));
    draw(img.winFlash, P.win.x - 30, P.win.y - 30, P.win.w + 60, P.win.h + 60, fx.screen[1]);
  }
}

/** The ledger's leaves riffling over, right to left, after a touch. */
function studyLeaves(fx: FlatFrame, P: StudyPlan) {
  "worklet";
  const lp = fx.touched;
  if (lp >= 1) return;
  const led = P.ledger;
  const { c } = fx;
  c.save();
  c.translate(led.x + led.w / 2, led.y + led.h);
  for (let k = 0; k < 3; k++) {
    const q = Math.min(1, Math.max(0, lp * 1.7 - k * 0.32));
    if (q <= 0 || q >= 1) continue;
    const sx = Math.cos(Math.PI * q);
    c.save();
    c.scale(sx, 1);
    fx.fill.setAlphaf(0.75 + 0.25 * Math.abs(sx));
    fx.draw(fx.img.leaf, 0, -led.h, led.w / 2, led.h, fx.fill);
    c.restore();
  }
  c.restore();
}

export const study = flatRoom({
  id: "study",
  mapArt: (P) => (P.map ? manorMapArt(P.map.w, P.map.h, "gilt") : ""),
  notebookArt: (P) => (P.notebook ? notebookArt(P.notebook.w, P.notebook.h) : ""),
  light: STUDY_LIGHT,
  plan: (L, exits) => {
    const P = studyPlan(L, exits);
    const sh = moonShaft(L, P);
    return { ...P, shaft: { x: sh.x, y: sh.y, w: sh.w, h: sh.h }, floorY: L.floorY };
  },
  art: studyArt,
  propArt: (P) => ledgerArt(P.ledger.w, P.ledger.h),
  motion: () => ({ kind: "pop", lift: 12, scale: 0.25 }),
  payoff: { burst: { kind: "glow", size: 46, color: "#FFE3A8", duration: 900 }, haptic: "tick" },
  images: (L, P) => {
    const sh = moonShaft(L, P);
    return {
      leaf: { w: P.ledger.w / 2, h: P.ledger.h, art: () => leafArt(P.ledger.w / 2, P.ledger.h), key: "" },
      shaft: { w: sh.w, h: sh.h, art: sh.art },
      winFlash: { w: P.win.w + 60, h: P.win.h + 60, art: () => windowFlashArt(P), key: "" },
    };
  },
  under: studyUnder,
  onProp: studyLeaves,
});

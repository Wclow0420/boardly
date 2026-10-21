// Seal the Manor's gallery, seen flat on (the iso one is
// rooms/gallery.ts): plum silk walls hung with a gold trellis over an oak
// wainscot, under the coffered ceiling, a long violet carpet running up
// the chequered marble to the great landscape in its gilt frame (the
// manor on its hill under the moon), a brass sconce either side; the
// manor's map in gilt over the crown in its glass case on the left (the
// notebook left on the case), behind a velvet rope on brass stanchions;
// a marble bust on its column; and in the middle the gilt writing table
// with the visitors' book open on it, the inkwell and the quill that
// works the room (touched, it dips and writes, sparks of violet). As SVG
// markup, baked once (FlatRoom); the quill, the flames, the map, the
// notebook and a slow light across the gilt are drawn live.

import { linear, radial } from "@/components/engraved/panel";
import { rrect } from "@/components/engraved/trim";
import type { Side } from "../../roomScenes";
import {
  MARBLE,
  candlestick,
  chequerFloor,
  fittingDefs,
  footShadow,
  giltFrame,
  runnerArt,
  sconce,
} from "../fittings";
import { manorMapArt, notebookArt, notebookOn } from "../keepsakes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  ceilingArt,
  f,
  floorShade,
  lit,
  partDefs,
  plateBox,
  poly,
  rnd,
  sideWallArt,
  spillArt,
  svg,
} from "../parts";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const SILK = ["#7A4A80", "#56305E", "#32183A"];
const CARPET = ["#8A5AC8", "#5A3490", "#341A5A"];
const LIGHT = "#FFC98A";
const FLOOR_LIGHT = ["#D8D0C0", "#B4AA96", "#857B68"];
const FLOOR_DARK = ["#4A3A50", "#34283C", "#201828"];

export function galleryPlan(L: FlatLayout, exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, at } = L;
  const has = (side: Side) => exits.some((e) => e.side === side);
  const W = bx1 - bx0;
  const cx = (bx0 + bx1) / 2;
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  const rail = Math.round(floorY - wallH * 0.25);
  // the writing table in the middle, its top seen from above
  const table = { x0: cx - 52 * u, x1: cx + 52 * u, top: floorY - 36 * u, z0: 4, z1: 26 };
  const [, topFront] = at(cx, table.top, table.z1);
  // the visitors' book open on it, the inkwell and the quill to its right
  const book = { w: 60 * u, h: 22 * u };
  const bookBox = { x: cx - 10 * u - book.w / 2, y: topFront - book.h - 1, ...book };
  const ink = { x: cx + 34 * u, y: topFront - 4 * u };
  const quillH = Math.round(66 * u);
  const quillW = Math.round(26 * u);
  const prop = { x: Math.round(ink.x - quillW * 0.8), y: Math.round(ink.y - quillH), w: quillW, h: quillH };
  // the great landscape over it
  const picW = Math.round(Math.min(124 * u, W * 0.44));
  const pic = { x: Math.round(cx - picW / 2), y: ceil + 30, w: picW, h: Math.round(Math.min(picW * 0.9, rail - 16 - (ceil + 30))) };
  const sconces = [sconce(pic.x - 11 * u, pic.y + pic.h * 0.82, u), sconce(pic.x + pic.w + 11 * u, pic.y + pic.h * 0.82, u)];
  const stick = candlestick(table.x0 + 12 * u, topFront - 1, 12 * u, 13 * u, 0.85 * u);
  // the left: the still life over the crown's case, the rope before them
  const leftX0 = bx0 + 8;
  const leftX1 = pic.x - 28 * u;
  const caseBox = { x: (leftX0 + leftX1) / 2, w: Math.min(48 * u, leftX1 - leftX0 - 6), foot: floorY };
  // the right: a bust on its column, between the table and the door
  const bustX = has("right") ? (table.x1 + L.doors.right.x - 6) / 2 : bx1 - 34 * u;
  // the left: the manor's map in gilt among the pictures, over the
  // crown's case; the notebook left lying on the case's top
  let map: { x: number; y: number; w: number; h: number } | undefined;
  let notebook: typeof map;
  if (!has("left")) {
    const sw = Math.round(Math.min(46 * u, leftX1 - leftX0 - 8));
    map = { x: Math.round((leftX0 + leftX1) / 2 - sw / 2), y: Math.round(ceil + 62), w: sw, h: Math.round(sw * 0.86) };
    const [sx, sy] = at(caseBox.x, floorY, 16);
    const caseTop = sy - 46 * u - 34 * u;
    notebook = notebookOn(sx + caseBox.w * 0.2, caseTop - 3.5, Math.min(21 * u, caseBox.w * 0.56));
  }
  return {
    map,
    notebook,
    has,
    u,
    cx,
    rail,
    table,
    topFront,
    bookBox,
    ink,
    prop,
    touch: { x: (bookBox.x + ink.x + 6) / 2, y: topFront - 20 * u, rx: 58 * u, ry: 34 * u },
    pic,
    sconces,
    stick,
    flames: [...sconces.map((s) => s.flame), stick.flame],
    leftX0,
    leftX1,
    caseBox,
    bustX,
    floorY,
  };
}
export type GalleryPlan = ReturnType<typeof galleryPlan>;

// ------------------------------------------------------------ the quill

/** The quill in its own box, its nib at the bottom right (in the
 *  inkwell): a long white feather curving up and left, the vane barbed
 *  and veined, grey at the tip, a gold nib band. */
export function quillArt(P: GalleryPlan) {
  const { w, h } = P.prop;
  const bx = w * 0.8;
  const by = h - 1;
  const tx = w * 0.12;
  const ty = 2;
  // the shaft, a gentle curve from nib to tip
  const cx1 = w * 0.78;
  const cy1 = h * 0.45;
  const at = (t: number) => {
    const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx1 + t * t * tx;
    const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy1 + t * t * ty;
    return [x, y] as const;
  };
  const left: string[] = [];
  const right: string[] = [];
  const barbs: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = 0.22 + (i / 16) * 0.78;
    const [x, y] = at(t);
    const width = Math.sin(Math.PI * Math.min(1, (t - 0.22) / 0.78) * 0.95 + 0.12) * w * 0.32;
    left.push(`${f(x - width)} ${f(y + width * 0.25)}`);
    right.push(`${f(x + width * 0.5)} ${f(y - width * 0.1)}`);
    if (i % 2 === 0 && i > 0 && i < 16) barbs.push(`M${f(x)} ${f(y)}L${f(x - width * 0.9)} ${f(y + width * 0.4)}`);
  }
  const vane = `M${left.join("L")}L${right.reverse().join("L")}Z`;
  const [ax, ay] = at(0.22);
  const shaft = `M${f(bx)} ${f(by)}Q${f(cx1)} ${f(cy1)} ${f(tx)} ${f(ty)}`;
  return svg(
    w,
    h,
    `<defs>${linear("qv", ["#FFFFFF", "#F4EEDF", "#B8B0A8"], false)}${linear("qt", ["#B8B0C8", "#7A7090"])}</defs>
<path d="${vane}" fill="url(#qv)" stroke="#3A2408" stroke-width="0.8"/>
<path d="M${f(tx)} ${f(ty)}L${left[left.length - 3]}L${f(at(0.86)[0])} ${f(at(0.86)[1])}Z" fill="url(#qt)" fill-opacity="0.7"/>
<path d="${barbs.join("")}" stroke="#A08A60" stroke-opacity="0.7" stroke-width="0.5"/>
<path d="${shaft}" fill="none" stroke="#3A2408" stroke-width="1.8" stroke-linecap="round"/>
<path d="${shaft}" fill="none" stroke="#F4EEDF" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${f(bx)} ${f(by)}L${f(ax)} ${f(ay)}" stroke="#E2B04A" stroke-width="2.2" stroke-linecap="round"/>
<path d="M${f(bx - 0.5)} ${f(by)}l-0.6 -3" stroke="#3A2408" stroke-width="0.8"/>`,
  );
}

// ------------------------------------------------------------ the art

/** The landscape in the great frame: the night sky, the moon, rolling
 *  hills, the manor on the hill with its tower and lit windows, a lake
 *  with the moon in it. */
function landscapeArt(x: number, y: number, w: number, h: number) {
  const hill = (y0: number, amp: number, k: number) =>
    `M${f(x)} ${f(y + h)}V${f(y0)}C${f(x + w * 0.25)} ${f(y0 - amp)} ${f(x + w * 0.45)} ${f(y0 + amp * k)} ${f(x + w * 0.7)} ${f(y0 - amp * 0.6)}S${f(x + w)} ${f(y0)} ${f(x + w)} ${f(y0 - amp * 0.2)}V${f(y + h)}Z`;
  const mx = x + w * 0.74;
  const my = y + h * 0.22;
  const hx = x + w * 0.36;
  const hy = y + h * 0.56;
  const s = w / 120;
  const house = `M${f(hx - 16 * s)} ${f(hy)}V${f(hy - 10 * s)}L${f(hx - 8 * s)} ${f(hy - 16 * s)}L${f(hx)} ${f(hy - 10 * s)}V${f(hy - 22 * s)}L${f(hx + 3 * s)} ${f(hy - 28 * s)}L${f(hx + 6 * s)} ${f(hy - 22 * s)}V${f(hy - 10 * s)}L${f(hx + 14 * s)} ${f(hy - 16 * s)}L${f(hx + 22 * s)} ${f(hy - 10 * s)}V${f(hy)}Z`;
  const windows = [
    [-12, -6],
    [-5, -6],
    [2.2, -15],
    [10, -6],
    [17, -6],
  ]
    .map(([dx, dy]) => `<rect x="${f(hx + dx * s)}" y="${f(hy + dy * s)}" width="${f(2.2 * s)}" height="${f(3 * s)}" fill="#FFD27A"/>`)
    .join("");
  const stars = Array.from({ length: 12 }, (_, i) => `<circle cx="${f(x + rnd(i * 3 + 7) * w)}" cy="${f(y + rnd(i * 5 + 2) * h * 0.4)}" r="0.6" fill="#fff" fill-opacity="${f(0.4 + rnd(i) * 0.5)}"/>`).join("");
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#gsky)"/>
${stars}
<circle cx="${f(mx)}" cy="${f(my)}" r="${f(h * 0.3)}" fill="url(#gmg)"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="${f(h * 0.07)}" fill="#F4F6FF"/>
<path d="${hill(y + h * 0.58, h * 0.12, 0.4)}" fill="#24345A"/>
<path d="${house}" fill="#141C34" stroke="#0A0E1A" stroke-width="0.5"/>
${windows}
<path d="${hill(y + h * 0.7, h * 0.08, 0.8)}" fill="#1A2440"/>
<path d="M${f(x + w * 0.12)} ${f(y + h * 0.72)}v${f(-h * 0.14)}" stroke="#0A0E1A" stroke-width="${f(2 * s)}"/>
<path d="M${f(x + w * 0.12)} ${f(y + h * 0.44)}c${f(9 * s)} 0 ${f(12 * s)} ${f(8 * s)} ${f(8 * s)} ${f(13 * s)}c${f(4 * s)} ${f(5 * s)} ${f(-2 * s)} ${f(10 * s)} ${f(-8 * s)} ${f(8 * s)}c${f(-6 * s)} ${f(2 * s)} ${f(-12 * s)} ${f(-3 * s)} ${f(-8 * s)} ${f(-8 * s)}c${f(-4 * s)} ${f(-5 * s)} ${f(0)} ${f(-13 * s)} ${f(8 * s)} ${f(-13 * s)}Z" fill="#101830" stroke="#0A0E1A" stroke-width="0.5"/>
<rect x="${f(x)}" y="${f(y + h * 0.8)}" width="${f(w)}" height="${f(h * 0.2)}" fill="#22305A"/>
<path d="M${f(mx - 6 * s)} ${f(y + h * 0.84)}h${f(12 * s)}M${f(mx - 4 * s)} ${f(y + h * 0.89)}h${f(8 * s)}M${f(mx - 2 * s)} ${f(y + h * 0.94)}h${f(4 * s)}" stroke="#DCE8FF" stroke-opacity="0.75" stroke-width="1"/>
<path d="M${f(x)} ${f(y + h * 0.8)}H${f(x + w)}" stroke="#0A0E1A" stroke-opacity="0.6" stroke-width="0.8"/>
<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#gvarn)"/>`;
}

/** The crown in its glass case: a marble pedestal, a case of glass with
 *  gilt corners, a violet cushion, the gold crown set with jewels. */
function crownCaseArt(L: FlatLayout, P: GalleryPlan) {
  const { x, w, foot } = P.caseBox;
  const u = P.u;
  const [sx, sy] = L.at(x, foot, 16);
  const ped = { w: w * 0.7, h: 46 * u };
  const caseH = 34 * u;
  const caseTop = sy - ped.h - caseH;
  const cw = w * 0.86;
  const cushionY = sy - ped.h - 4 * u;
  const crown = (cx: number, base: number, s: number) => {
    const pts = [-1, -0.5, 0, 0.5, 1]
      .map((k, i) => `${f(cx + k * 10 * s)} ${f(base - (i % 2 ? 9 : 14) * s)}`)
      .join(" L");
    return `<path d="M${f(cx - 11 * s)} ${f(base)}L${f(cx - 10 * s)} ${f(base - 14 * s)}L${pts}L${f(cx + 11 * s)} ${f(base)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<rect x="${f(cx - 11 * s)}" y="${f(base - 4 * s)}" width="${f(22 * s)}" height="${f(4 * s)}" fill="url(#pgh)" stroke="${INK}" stroke-width="0.5"/>
${[-1, 0, 1].map((k) => `<circle cx="${f(cx + k * 7 * s)}" cy="${f(base - 2 * s)}" r="${f(1.3 * s)}" fill="${k ? "#3A6AC8" : "#C2203A"}"/>`).join("")}
${[-1, -0.5, 0, 0.5, 1].map((k, i) => `<circle cx="${f(cx + k * 10 * s)}" cy="${f(base - (i % 2 ? 9 : 14) * s - 1)}" r="${f(1.3 * s)}" fill="#FFF6D0" stroke="${INK}" stroke-width="0.3"/>`).join("")}`;
  };
  return `${footShadow(L, x - ped.w / 2, x + ped.w / 2, 6, 28)}
<path d="M${f(sx - ped.w / 2 - 3)} ${f(sy)}h${f(ped.w + 6)}v-5h${f(-(ped.w + 6))}Z" fill="url(#fmar)" stroke="#5A5040" stroke-width="0.7"/>
<rect x="${f(sx - ped.w / 2)}" y="${f(sy - ped.h)}" width="${f(ped.w)}" height="${f(ped.h - 5)}" fill="url(#fmarh)" stroke="#5A5040" stroke-width="0.8"/>
<path d="M${f(sx - ped.w / 2 + 4)} ${f(sy - ped.h + 6)}V${f(sy - 10)}M${f(sx + ped.w / 2 - 4)} ${f(sy - ped.h + 6)}V${f(sy - 10)}" stroke="#8A8070" stroke-opacity="0.6" stroke-width="0.7"/>
<path d="M${f(sx - ped.w / 2 - 3)} ${f(sy - ped.h)}h${f(ped.w + 6)}v-4h${f(-(ped.w + 6))}Z" fill="url(#fmar)" stroke="#5A5040" stroke-width="0.7"/>
<path d="M${f(sx - cw * 0.36)} ${f(cushionY + 4 * u)}Q${f(sx)} ${f(cushionY - 2 * u)} ${f(sx + cw * 0.36)} ${f(cushionY + 4 * u)}Z" fill="#5A3490" stroke="#1A0A30" stroke-width="0.6"/>
${crown(sx, cushionY + 1, 0.95 * u)}
<rect x="${f(sx - cw / 2)}" y="${f(caseTop)}" width="${f(cw)}" height="${f(caseH)}" fill="#C8E0FF" fill-opacity="0.14" stroke="#1E242C" stroke-width="0.8"/>
<path d="M${f(sx - cw / 2 + 3)} ${f(caseTop + caseH - 4)}L${f(sx - cw / 2 + 12 * u)} ${f(caseTop + 3)}M${f(sx - cw / 2 + 8)} ${f(caseTop + caseH - 4)}L${f(sx - cw / 2 + 16 * u)} ${f(caseTop + 8)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8"/>
<rect x="${f(sx - cw / 2 - 2)}" y="${f(caseTop - 4)}" width="${f(cw + 4)}" height="4" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
${[sx - cw / 2, sx + cw / 2].map((cx) => `<rect x="${f(cx - 1.4)}" y="${f(caseTop)}" width="2.8" height="${f(caseH)}" fill="url(#pgh)" stroke="${INK}" stroke-width="0.4"/>`).join("")}
<circle cx="${f(sx)}" cy="${f(caseTop - 6)}" r="2.2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`;
}

/** A velvet rope on brass stanchions along the floor before the case. */
function ropeArt(L: FlatLayout, x0: number, x1: number, z: number) {
  const posts = [x0, (x0 + x1) / 2, x1].map((x) => L.at(x, L.floorY, z));
  const k = L.k(z);
  const ph = 30 * k;
  const out: string[] = [];
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, ay] = posts[i];
    const [bx, by] = posts[i + 1];
    out.push(
      `<path d="M${f(ax)} ${f(ay - ph + 3)}Q${f((ax + bx) / 2)} ${f((ay + by) / 2 - ph + 14 * k)} ${f(bx)} ${f(by - ph + 3)}" fill="none" stroke="#2A0408" stroke-width="${f(3.6 * k)}" stroke-linecap="round"/>`,
      `<path d="M${f(ax)} ${f(ay - ph + 3)}Q${f((ax + bx) / 2)} ${f((ay + by) / 2 - ph + 14 * k)} ${f(bx)} ${f(by - ph + 3)}" fill="none" stroke="#B01E30" stroke-width="${f(2.2 * k)}" stroke-linecap="round"/>`,
    );
  }
  for (const [x, y] of posts) {
    out.push(
      `<path d="M${f(x - 6 * k)} ${f(y + 1)}h${f(12 * k)}" stroke="#000" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>`,
      `<path d="M${f(x - 5 * k)} ${f(y)}Q${f(x)} ${f(y - 5 * k)} ${f(x + 5 * k)} ${f(y)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<rect x="${f(x - 1.4 * k)}" y="${f(y - ph)}" width="${f(2.8 * k)}" height="${f(ph - 3)}" fill="url(#pgh)" stroke="${INK}" stroke-width="0.5"/>`,
      `<circle cx="${f(x)}" cy="${f(y - ph - 1)}" r="${f(2.6 * k)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
    );
  }
  return out.join("");
}

/** A marble bust on a fluted column: the head and shoulders of a figure
 *  turned away, seen as a smooth form with no face (only the avatar
 *  figures have faces), a laurel wreath in its hair. */
function bustArt(L: FlatLayout, P: GalleryPlan) {
  const u = P.u * 1.35;
  const [x, foot] = L.at(P.bustX, L.floorY, 10);
  const colW = 14 * u;
  const colH = 40 * u;
  const top = foot - colH;
  const flutes = [-0.25, 0, 0.25].map((k) => `M${f(x + k * colW)} ${f(top + 6)}V${f(foot - 7)}`).join("");
  const hw = 12 * u;
  const by = top - 3;
  return `${footShadow(L, P.bustX - 10 * u, P.bustX + 10 * u, 6, 24)}
<path d="M${f(x - colW / 2 - 3)} ${f(foot)}h${f(colW + 6)}v-6h${f(-(colW + 6))}Z" fill="url(#fmar)" stroke="#5A5040" stroke-width="0.7"/>
<rect x="${f(x - colW / 2)}" y="${f(top)}" width="${f(colW)}" height="${f(colH - 6)}" fill="url(#fmarh)" stroke="#5A5040" stroke-width="0.8"/>
<path d="${flutes}" stroke="#8A8070" stroke-opacity="0.7" stroke-width="0.8"/>
<path d="M${f(x - colW / 2 - 3)} ${f(top)}h${f(colW + 6)}v-4h${f(-(colW + 6))}Z" fill="url(#fmar)" stroke="#5A5040" stroke-width="0.7"/>
<path d="M${f(x - hw)} ${f(by)}Q${f(x - hw)} ${f(by - 10 * u)} ${f(x - 4 * u)} ${f(by - 12 * u)}L${f(x - 3.6 * u)} ${f(by - 16 * u)}H${f(x + 3.6 * u)}L${f(x + 4 * u)} ${f(by - 12 * u)}Q${f(x + hw)} ${f(by - 10 * u)} ${f(x + hw)} ${f(by)}Z" fill="url(#fmarh)" stroke="#5A5040" stroke-width="0.8"/>
<path d="M${f(x - 6.5 * u)} ${f(by - 22 * u)}C${f(x - 7 * u)} ${f(by - 31 * u)} ${f(x + 7 * u)} ${f(by - 31 * u)} ${f(x + 6.5 * u)} ${f(by - 22 * u)}C${f(x + 6 * u)} ${f(by - 17 * u)} ${f(x - 6 * u)} ${f(by - 17 * u)} ${f(x - 6.5 * u)} ${f(by - 22 * u)}Z" fill="url(#fmarh)" stroke="#5A5040" stroke-width="0.8"/>
<path d="M${f(x - 6.6 * u)} ${f(by - 25 * u)}Q${f(x)} ${f(by - 29 * u)} ${f(x + 6.6 * u)} ${f(by - 25 * u)}" fill="none" stroke="#7A9A5A" stroke-width="${f(1.8 * u)}" stroke-dasharray="2 1"/>
<path d="M${f(x - 4.6 * u)} ${f(by - 27 * u)}q-1 4 0 7M${f(x - hw + 2)} ${f(by - 2)}q1 -7 6 -9" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.8"/>
<rect x="${f(x - 7 * u)}" y="${f(top - 3)}" width="${f(14 * u)}" height="3" fill="url(#pgv)" stroke="${INK}" stroke-width="0.4"/>`;
}

/** The gilt writing table: its top seen from above with a violet leather
 *  inset, the apron with gilt mounts, slender cabriole legs; on it the
 *  visitors' book open, the inkwell, a candlestick. */
function tableArt(L: FlatLayout, P: GalleryPlan) {
  const { at, floorY } = L;
  const { x0, x1, top, z0, z1 } = P.table;
  const u = P.u;
  const out: string[] = [];
  const [fx0, fy0] = at(x0, top, z1);
  const [fx1] = at(x1, top, z1);
  const [, footY] = at(x0, floorY, z1);
  out.push(footShadow(L, x0, x1, z0, z1 + 10, 0.4));
  // the back legs, seen under the apron
  for (const x of [x0 + 6, x1 - 6]) {
    const [lx, ly] = at(x, floorY, z0 + 2);
    out.push(`<path d="M${f(lx - 1.5)} ${f(fy0 + 8)}V${f(ly)}h3V${f(fy0 + 8)}Z" fill="#4A3010" stroke="${WOOD_INK}" stroke-width="0.6"/>`);
  }
  // the front legs: cabriole, gilt
  for (const [x, k] of [
    [fx0 + 4, 1],
    [fx1 - 4, -1],
  ] as const) {
    out.push(
      `<path d="M${f(x - 2.5 * k)} ${f(fy0 + 9)}C${f(x + 4 * k)} ${f(fy0 + 18 * u)} ${f(x - 6 * k)} ${f(footY - 12 * u)} ${f(x - 1 * k)} ${f(footY - 2)}h${f(4 * k)}C${f(x - 2 * k)} ${f(footY - 12 * u)} ${f(x + 8 * k)} ${f(fy0 + 18 * u)} ${f(x + 2.5 * k)} ${f(fy0 + 9)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    );
  }
  // the top and the apron
  const topFace = [at(x0 - 3, top, z0), at(x1 + 3, top, z0), at(x1 + 3, top, z1 + 2), at(x0 - 3, top, z1 + 2)];
  const inset = [at(x0 + 5, top, z0 + 3), at(x1 - 5, top, z0 + 3), at(x1 - 5, top, z1 - 3), at(x0 + 5, top, z1 - 3)];
  out.push(
    `<path d="${poly(topFace)}" fill="url(#gtop)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="${poly(inset)}" fill="url(#gleather)" stroke="#E2B04A" stroke-opacity="0.75" stroke-width="0.7"/>`,
    `<rect x="${f(fx0 - 3)}" y="${f(fy0)}" width="${f(fx1 - fx0 + 6)}" height="${f(10 * u)}" fill="url(#gtop)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="M${f(fx0 - 2)} ${f(fy0 + 1)}H${f(fx0 + (fx1 - fx0) * 0.55)}" stroke="#F0D0A8" stroke-opacity="0.45" stroke-width="0.7"/>`,
    `<path d="M${f((fx0 + fx1) / 2 - 10 * u)} ${f(fy0 + 5 * u)}c${f(4 * u)} ${f(-5 * u)} ${f(16 * u)} ${f(-5 * u)} ${f(20 * u)} 0c${f(-4 * u)} ${f(4 * u)} ${f(-16 * u)} ${f(4 * u)} ${f(-20 * u)} 0Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
    ...[fx0 + 1, fx1 - 7].map((x) => `<path d="${rrect(x, fy0 + 2, 6, 6 * u, 1)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`),
  );
  // the visitors' book, open
  const { x, y, w, h } = P.bookBox;
  const c = x + w / 2;
  const lines: string[] = [];
  for (let i = 0; i < 4; i++) {
    const ly = y + 5 + i * ((h - 9) / 4);
    lines.push(`M${f(x + 5)} ${f(ly)}h${f((w / 2 - 9) * (0.6 + rnd(i + 4) * 0.35))}M${f(c + 4)} ${f(ly)}h${f((w / 2 - 9) * (0.5 + rnd(i + 9) * 0.4))}`);
  }
  out.push(
    `<path d="M${f(x - 2)} ${f(y + h + 2)}H${f(x + w + 2)}" stroke="#000" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M${f(x + 1)} ${f(y + 1)}H${f(x + w - 1)}L${f(x + w + 1)} ${f(y + h + 1)}H${f(x - 1)}Z" fill="#5A3490" stroke="#1A0A30" stroke-width="0.8"/>`,
    `<path d="M${f(c)} ${f(y + 2.5)}Q${f(c - w * 0.22)} ${f(y)} ${f(x + 3)} ${f(y + 2)}L${f(x + 1)} ${f(y + h - 1)}Q${f(c - w * 0.22)} ${f(y + h - 3)} ${f(c)} ${f(y + h)}Z" fill="url(#gpage)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="M${f(c)} ${f(y + 2.5)}Q${f(c + w * 0.22)} ${f(y)} ${f(x + w - 3)} ${f(y + 2)}L${f(x + w - 1)} ${f(y + h - 1)}Q${f(c + w * 0.22)} ${f(y + h - 3)} ${f(c)} ${f(y + h)}Z" fill="url(#gpage)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="${lines.join("")}" stroke="#2A1A3A" stroke-opacity="0.65" stroke-width="0.7" stroke-linecap="round"/>`,
    `<path d="M${f(c)} ${f(y + 2.5)}V${f(y + h)}" stroke="#A08A60" stroke-width="0.6"/>`,
    `<path d="M${f(c + 2)} ${f(y + h)}l-1.4 6l1.4 -1.5l1.4 1.5Z" fill="#8A5AC8" stroke="#1A0A30" stroke-width="0.4"/>`,
  );
  // the inkwell: a cut-glass pot of night-blue ink in a gilt tray
  const ix = P.ink.x;
  const iy = P.ink.y;
  out.push(
    `<path d="M${f(ix - 10 * u)} ${f(iy + 3 * u)}h${f(20 * u)}l-2 ${f(-2.5 * u)}h${f(-16 * u)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="${rrect(ix - 5.5 * u, iy - 7 * u, 11 * u, 8 * u, 2)}" fill="url(#gink)" stroke="#05070E" stroke-width="0.7"/>`,
    `<rect x="${f(ix - 3.6 * u)}" y="${f(iy - 9 * u)}" width="${f(7.2 * u)}" height="${f(2.4 * u)}" rx="0.8" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`,
    `<path d="M${f(ix - 3.8 * u)} ${f(iy - 5.5 * u)}V${f(iy - 1)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.7"/>`,
  );
  out.push(P.stick.markup);
  return out.join("");
}

/** The whole gallery, still: everything but what lives. */
export function galleryArt(L: FlatLayout, P: GalleryPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: plum silk with a gold trellis, the wainscot under a rail
  const trellis: string[] = [];
  const dots: string[] = [];
  for (let x = bx0 - 40; x < bx1 + 40; x += 16) {
    trellis.push(`M${f(x)} ${f(ceil + 6)}L${f(x + (P.rail - ceil))} ${f(P.rail)}M${f(x)} ${f(ceil + 6)}L${f(x - (P.rail - ceil))} ${f(P.rail)}`);
  }
  for (let r = 0, y = ceil + 14; y < P.rail - 4; r++, y += 8) {
    for (let x = bx0 + (r % 2 ? 8 : 0); x < bx1; x += 16) dots.push(`M${f(x)} ${f(y)}h0.01`);
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#gwall)"/>`,
    `<defs><clipPath id="gtc"><rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(P.rail - ceil)}"/></clipPath></defs>`,
    `<g clip-path="url(#gtc)"><path d="${trellis.join("")}" stroke="#E2B04A" stroke-opacity="0.16" stroke-width="0.7"/></g>`,
    `<path d="${dots.join("")}" stroke="#E2B04A" stroke-opacity="0.35" stroke-width="1.4" stroke-linecap="round"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#gwarm)"/>`,
  );
  const panels: string[] = [];
  const pw = 24;
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
    // the picture rail under the cornice
    `<rect x="${f(bx0)}" y="${f(ceil + 10)}" width="${f(bx1 - bx0)}" height="2.4" fill="url(#pgv)"/>`,
  );
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(sideWallArt(L, A.wall, SILK, e ? { box: A, door: e.door, color: e.color } : null, P.rail));
  }
  out.push(ceilingArt(L));
  out.push(chequerFloor(L, FLOOR_LIGHT, FLOOR_DARK, 15, "gchq"));
  out.push(runnerArt(L, P.cx - 30 * P.u, P.cx + 30 * P.u, P.table.z1 + 4, L.zFront + 10, CARPET, "#1A0A30", "grun"));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(spillArt(x + (back ? 0 : e.side === "frontLeft" ? 16 : -16), y + (back ? 8 : 4), back ? 34 : 30, back ? 11 : 16, e.color, `spill${e.side}`));
  }
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(backDoorArt(L.doors[side], e.door, e.color, `bd${side[0]}`));
  }
  // the pictures, the sconces
  const { pic } = P;
  out.push(giltFrame(pic.x, pic.y, pic.w, pic.h, landscapeArt(pic.x, pic.y, pic.w, pic.h), "gpic", true));
  out.push(...P.sconces.map((s) => s.markup));
  if (!P.has("left")) {
    out.push(crownCaseArt(L, P));
    out.push(ropeArt(L, P.leftX0 + 4, P.leftX1 - 4, 40));
  }
  out.push(bustArt(L, P));
  out.push(tableArt(L, P));
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
${fittingDefs()}
${lit("gwall", SILK, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("gwarm", [LIGHT, LIGHT], [0.24, 0], 0.5, 0.55, 0.55)}
${linear("gsky", ["#0C1634", "#1A2A5A", "#3A5A9A"])}
${radial("gmg", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.8, 0.3, 0])}
${linear("gvarn", ["#FFE0A0", "#000000"], true, [0.08, 0.15])}
${linear("gtop", ["#8A6440", "#6A4A2C", "#4E3420"])}
${linear("gleather", ["#8A5AC8", "#5A3490", "#341A5A"])}
${lit("gpage", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], 0, 0, w, h)}
${radial("gink", ["#4A5A8A", "#141A2E", "#05070E"], undefined, 0.35, 0.3, 0.8)}
${linear("gmarble", MARBLE)}
</defs>
${out.join("\n")}`,
  );
}

/** A slow light across the great frame's gilt, every few seconds. */
function galleryUnder(fx: FlatFrame, P: GalleryPlan) {
  "worklet";
  const k = (fx.time % 7) / 7;
  if (k > 0.35) return;
  const p = k / 0.35;
  const { pic } = P;
  const x = pic.x - 30 + (pic.w + 60) * p;
  fx.screen[0].setAlphaf(0.5 * Math.sin(Math.PI * p));
  fx.draw(fx.img.sweep, x - 14, pic.y - 6, 28, pic.h + 12, fx.screen[0]);
}

export const gallery = flatRoom({
  id: "gallery",
  light: LIGHT,
  plan: galleryPlan,
  art: galleryArt,
  propArt: quillArt,
  mapArt: (P) => (P.map ? manorMapArt(P.map.w, P.map.h, "gilt") : ""),
  notebookArt: (P) => (P.notebook ? notebookArt(P.notebook.w, P.notebook.h) : ""),
  motion: (P) => ({ kind: "swing", x: P.ink.x, y: P.ink.y - 2, degrees: 20 }),
  payoff: {
    burst: { kind: "sparks", size: 40, color: "#B58CFF", duration: 900 },
    haptic: "tick",
    at: (P) => [P.ink.x, P.ink.y - 12 * P.u],
  },
  images: (_L, P) => ({
    sweep: {
      w: 28,
      h: P.pic.h + 12,
      key: "",
      art: () =>
        svg(28, P.pic.h + 12, `<defs>${linear("sw", ["#FFF6D0", "#FFF6D0", "#FFF6D0"], false, [0, 0.55, 0])}</defs><path d="M10 0H22L18 ${f(P.pic.h + 12)}H6Z" fill="url(#sw)"/>`),
    },
  }),
  under: galleryUnder,
});

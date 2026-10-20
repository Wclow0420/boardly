// Seal the Manor's chapel, seen flat on (the iso one is rooms/chapel.ts;
// the lobby's room, features/lobby/floor/rooms/nightwatch.ts, is the
// watch's chapel too, and lends it its stone): blue-grey ashlar under a
// ribbed vault, a great tracery window of stained glass — two lancets
// and a rose — over the altar on its two stone steps; the altar in an
// ivory cloth over a crimson frontal with a gold fringe, a gilded
// reredos behind it, and on it the gilt cross with its ruby, the thing
// that works the room (touched, it lifts in a beam of light); tall
// candlesticks at the altar's corners and on the steps; the lectern
// with the Chapel's record open on it under a lancet of its own; the
// crimson runner up the aisle on the chequered floor. As SVG markup, baked once (FlatRoom); the cross, the flames and
// the coloured light from the glass are drawn over it live.

import { linear, radial } from "@/components/engraved/panel";
import type { Side } from "../../roomScenes";
import {
  ASHLAR,
  GLASS,
  STONE_INK,
  ashlar,
  candlestick,
  chequerFloor,
  fittingDefs,
  footShadow,
  lancetArt,
  pointed,
  roseArt,
  runnerArt,
  stoneSideWall,
  vaultArt,
} from "../fittings";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  f,
  floorShade,
  lit,
  partDefs,
  plateBox,
  poly,
  spillArt,
  svg,
} from "../parts";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const LIGHT = "#FFD07A";
const FLOOR_LIGHT = ["#B8B4CA", "#9894AE", "#6E6A88"];
const FLOOR_DARK = ["#4A4662", "#383450", "#24203A"];
const FRONTAL = ["#C2203A", "#8A1424", "#4A0610"];

export function chapelPlan(L: FlatLayout, exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, at } = L;
  const has = (side: Side) => exits.some((e) => e.side === side);
  const W = bx1 - bx0;
  const cx = (bx0 + bx1) / 2;
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  // the dais: two steps of pale stone, the altar on the upper one
  const dais = { x0: cx - 74 * u, x1: cx + 74 * u, z: 30, h: 5 };
  const altar = { x0: cx - 44 * u, x1: cx + 44 * u, z0: 4, z1: 20, h: 30 * u };
  const [, altarFoot] = at(cx, floorY - 2 * dais.h, altar.z1);
  const altarTop = altarFoot - altar.h;
  const [, topFront] = at(cx, altarTop, altar.z1);
  // the great window over it, up into the vault
  const winW = Math.round(Math.min(104 * u, W * 0.38));
  const win = { x: Math.round(cx - winW / 2), y: ceil + 18, w: winW, h: Math.round(altarTop - 40 * u - (ceil + 18)) };
  // the gilt cross on the altar, its ruby at the crossing
  const crossH = Math.round(64 * u);
  const crossW = Math.round(40 * u);
  const prop = { x: Math.round(cx - crossW / 2 - 4), y: Math.round(topFront - crossH - 2), w: crossW + 8, h: crossH + 4 };
  // candles: two on the altar, a tall stick at each corner of the dais
  const onAltar = [candlestick(cx - 32 * u, topFront - 1, 18 * u, 13 * u, 0.85 * u), candlestick(cx + 32 * u, topFront - 1, 18 * u, 13 * u, 0.85 * u)];
  const [lx, lfoot] = at(dais.x0 + 9, floorY - dais.h, dais.z - 6);
  const [rx, rfoot] = at(dais.x1 - 9, floorY - dais.h, dais.z - 6);
  const tall = [candlestick(lx, lfoot, 52 * u, 15 * u, 1.05 * u), candlestick(rx, rfoot, 52 * u, 15 * u, 1.05 * u)];
  // the lectern and the record, on the right when the wall is free there
  const lecternX = has("right") ? null : bx1 - 34 * u;
  const lec = lecternX === null ? null : { x: lecternX, foot: at(lecternX, floorY, 14)[1], h: 52 * u };
  const book = lec ? { x: lec.x - 2, y: lec.foot - lec.h - 4, r: 12 * u } : undefined;
  // the side lancet over the lectern, a second one over the left when no door
  const lancets = [
    has("left") ? null : { x: bx0 + 26 * u, y: ceil + 46, w: 24 * u, h: 110 * u },
    has("right") ? null : { x: bx1 - 46 * u, y: ceil + 46, w: 24 * u, h: Math.min(110 * u, (lec ? lec.foot - lec.h - 30 : floorY - 60) - (ceil + 46)) },
  ];
  return {
    has,
    u,
    cx,
    dais,
    altar,
    altarTop,
    topFront,
    win,
    prop,
    touch: { x: cx, y: prop.y + prop.h * 0.45, rx: crossW * 0.95, ry: crossH * 0.62 },
    onAltar,
    tall,
    flames: [...tall, ...onAltar].map((c) => c.flame),
    lec,
    book,
    lancets,
    floorY,
    // the coloured light from the window, its own box
    glow: { x: cx - W * 0.5, y: win.y + win.w * 0.5, w: W, h: at(0, floorY, 170)[1] - (win.y + win.w * 0.5) },
  };
}
export type ChapelPlan = ReturnType<typeof chapelPlan>;

// ------------------------------------------------------------ the cross

/** The gilt cross in its own box: a stepped foot, the shaft, the arms
 *  with trefoil ends, a ruby at the crossing, a shine down the lit edge. */
export function crossArt(P: ChapelPlan) {
  const { w, h } = P.prop;
  const u = P.u;
  const c = w / 2;
  const t = 6 * u;
  const armY = h * 0.3;
  const footY = h - 2;
  const shaftTop = 6 * u;
  const arm = 18 * u;
  const trefoil = (x: number, y: number) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(t * 0.78)}" fill="url(#cg)" stroke="${INK}" stroke-width="0.8"/>`;
  return svg(
    w,
    h,
    `<defs>${linear("cg", ["#FFF2B8", "#F0CC72", "#B8862E"], false)}${linear("cgv", ["#FFF6D0", "#E2B04A", "#9A6B1E"])}${radial("cr", ["#FFC8D0", "#E0304A", "#4A0610"], undefined, 0.38, 0.32, 0.75)}</defs>
<path d="M${f(c - 13 * u)} ${f(footY)}h${f(26 * u)}l-3 ${f(-5 * u)}h${f(-20 * u + 6)}Z" fill="url(#cgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(c - 8 * u)} ${f(footY - 5 * u)}h${f(16 * u)}l-2 ${f(-5 * u)}h${f(-12 * u)}Z" fill="url(#cgv)" stroke="${INK}" stroke-width="0.8"/>
${trefoil(c, shaftTop)}${trefoil(c - arm, armY)}${trefoil(c + arm, armY)}
<path d="M${f(c - t / 2)} ${f(footY - 10 * u)}V${f(armY + t / 2)}H${f(c - arm)}V${f(armY - t / 2)}H${f(c - t / 2)}V${f(shaftTop)}H${f(c + t / 2)}V${f(armY - t / 2)}H${f(c + arm)}V${f(armY + t / 2)}H${f(c + t / 2)}V${f(footY - 10 * u)}Z" fill="url(#cg)" stroke="${INK}" stroke-width="1"/>
<path d="M${f(c - t / 2 + 1.1)} ${f(footY - 11 * u)}V${f(armY + t / 2 + 1)}M${f(c - arm + 1)} ${f(armY - t / 2 + 1.1)}H${f(c - t / 2)}M${f(c - t / 2 + 1.1)} ${f(armY - t / 2)}V${f(shaftTop + 1)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.8"/>
<path d="M${f(c)} ${f(armY + t)}V${f(footY - 12 * u)}" stroke="#7A5212" stroke-opacity="0.6" stroke-width="0.6"/>
<circle cx="${f(c)}" cy="${f(armY)}" r="${f(t * 0.95)}" fill="url(#cg)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${f(c)}" cy="${f(armY)}" r="${f(t * 0.62)}" fill="url(#cr)" stroke="#3A0408" stroke-width="0.6"/>
<circle cx="${f(c - t * 0.2)}" cy="${f(armY - t * 0.22)}" r="${f(t * 0.18)}" fill="#fff" fill-opacity="0.9"/>`,
  );
}

// ------------------------------------------------------------ the glass

/** The great window: a pointed arch of stone, two lancets of coloured
 *  glass under a rose in the head, a mullion, the sill. */
function greatWindowArt(W: ChapelPlan["win"]) {
  const { x, y, w, h } = W;
  const s = w * 0.62;
  const t = 5;
  const mull = 4;
  const lw = (w - 2 * t - mull) / 2;
  const roseR = lw * 0.82;
  const ly = y + s * 0.5 + roseR * 0.9;
  const lh = y + h - t - ly;
  const out: string[] = [
    `<path d="${pointed(x - 3, y - 3, w + 6, h + 6, s + 2)}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2.5)"/>`,
    `<path d="${pointed(x - 3, y - 3, w + 6, h + 6, s + 2)}" fill="url(#fsl)" stroke="${STONE_INK}" stroke-width="1"/>`,
    `<path d="${pointed(x + t, y + t, w - 2 * t, h - 2 * t, s - t * 0.6)}" fill="url(#cnight)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
  ];
  out.push(roseArt(x + w / 2, y + t + s * 0.42 + 2, roseR, 8));
  out.push(lancetArt(x + t, ly, lw, lh, GLASS.blue, GLASS.ruby, "cwl"));
  out.push(lancetArt(x + t + lw + mull, ly, lw, lh, GLASS.violet, GLASS.amber, "cwr"));
  out.push(
    `<rect x="${f(x + t + lw)}" y="${f(ly + lw * 0.4)}" width="${mull}" height="${f(lh - lw * 0.4)}" fill="url(#fslh)" stroke="${STONE_INK}" stroke-width="0.7"/>`,
    `<path d="M${f(x - 6)} ${f(y + h + 3)}h${f(w + 12)}v5h${f(-(w + 12))}Z" fill="url(#fslh)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
    `<path d="M${f(x - 5)} ${f(y + h + 4)}H${f(x + w * 0.5)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>`,
    `<path d="${pointed(x - 3, y - 3, w + 6, h + 6, s + 2)}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="0.8" transform="translate(0.8 0.8)"/>`,
  );
  return out.join("");
}

/** The window as lightning lights it, in the coloured light's box. */
export function chapelFlash(P: ChapelPlan) {
  const { x: gx, y: gy, w, h } = P.glow;
  const { x, y, w: ww, h: wh } = P.win;
  return svg(
    w,
    h,
    `<defs>${radial("fl", ["#E8F0FF", "#B8CCFF", "#B8CCFF"], [0.6, 0.25, 0])}</defs>
<rect x="${f(x - gx - 40)}" y="0" width="${f(ww + 80)}" height="${f(wh * 0.8)}" fill="url(#fl)"/>
<path d="${pointed(x - gx + 5, Math.max(0, y - gy), ww - 10, wh * 0.7, ww * 0.55)}" fill="#F4F8FF" fill-opacity="0.6"/>`,
  );
}

/** The coloured light from the glass falling on the steps and the floor:
 *  two soft beams, patches of ruby, blue and amber where they land. */
export function chapelGlow(L: FlatLayout, P: ChapelPlan) {
  const { x: gx, y: gy, w, h } = P.glow;
  const X = (x: number) => f(x - gx);
  const Y = (y: number) => f(y - gy);
  const { win } = P;
  const beams: string[] = [];
  const patches: string[] = [];
  const cols = [GLASS.blue, GLASS.ruby, GLASS.amber, GLASS.violet];
  for (let k = 0; k < 2; k++) {
    const x0 = win.x + 8 + k * win.w * 0.5;
    const x1 = x0 + win.w * 0.5 - 14;
    const a = L.at(x0 - 18 + k * 30, L.floorY, 120);
    const b = L.at(x1 - 4 + k * 30, L.floorY, 160);
    beams.push(`<path d="M${X(x0)} ${Y(win.y + win.h * 0.45)}H${X(x1)}L${X(b[0])} ${Y(b[1])}H${X(a[0])}Z" fill="url(#cb${k})"/>`);
    for (let i = 0; i < 3; i++) {
      const z = 92 + i * 26;
      const px = x0 - 10 + k * 26 + i * 8;
      const p = L.at(px, L.floorY, z);
      const q = L.at(px + 18, L.floorY, z + 20);
      patches.push(`<ellipse cx="${X((p[0] + q[0]) / 2)}" cy="${Y((p[1] + q[1]) / 2)}" rx="${f((q[0] - p[0]) * 0.8)}" ry="${f((q[1] - p[1]) * 0.6)}" fill="${cols[(i + k * 2) % 4]}" fill-opacity="0.22"/>`);
    }
  }
  return svg(
    w,
    h,
    `<defs>${linear("cb0", ["#9AB8FF", "#9AB8FF", "#9AB8FF"], true, [0.1, 0.12, 0.02])}${linear("cb1", ["#E8A0D8", "#E8A0D8", "#E8A0D8"], true, [0.1, 0.12, 0.02])}</defs>${beams.join("")}${patches.join("")}`,
  );
}

// ------------------------------------------------------------ the altar

/** The dais and the altar on it: two steps of pale stone; the altar's
 *  top seen from above in an ivory cloth hanging over the ends, a crimson
 *  frontal with a gold fringe and a gold cross in a roundel; the
 *  candlesticks on it. */
function altarArt(L: FlatLayout, P: ChapelPlan) {
  const { at, floorY } = L;
  const { dais, altar, u, cx } = P;
  const out: string[] = [];
  // the steps: each a slab with its top seen and its front
  for (let s = 0; s < 2; s++) {
    const inset = s * 16 * u;
    const z = dais.z - s * 10;
    const y0 = floorY - s * dais.h;
    const top = [at(dais.x0 + inset, y0 - dais.h, 0), at(dais.x1 - inset, y0 - dais.h, 0), at(dais.x1 - inset, y0 - dais.h, z), at(dais.x0 + inset, y0 - dais.h, z)];
    const [fx0, fy0] = at(dais.x0 + inset, y0 - dais.h, z);
    const [fx1, fy1] = at(dais.x1 - inset, y0, z);
    if (s === 0) out.push(footShadow(L, dais.x0, dais.x1, 4, dais.z + 12, 0.4));
    out.push(
      `<path d="${poly(top)}" fill="url(#fslh)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
      `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#cstep)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
      `<path d="M${f(fx0 + 1)} ${f(fy0 + 0.8)}H${f(fx0 + (fx1 - fx0) * 0.55)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`,
    );
  }
  // the reredos: a gilt triptych behind the altar
  const ry1 = P.altarTop + 4;
  const ry0 = P.win.y + P.win.h + 12;
  const rw = (altar.x1 - altar.x0) * 1.08;
  const rx0 = cx - rw / 2;
  const panel = (x: number, w: number, peak: number) =>
    `M${f(x)} ${f(ry1)}V${f(ry0 + peak)}L${f(x + w / 2)} ${f(ry0)}L${f(x + w)} ${f(ry0 + peak)}V${f(ry1)}Z`;
  const pw = rw / 3;
  out.push(
    `<path d="${panel(rx0 - 2, rw + 4, 10)}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>`,
    ...[0, 1, 2].map((i) => {
      const x = rx0 + i * pw;
      const lift = i === 1 ? -6 : 0;
      return `<path d="M${f(x)} ${f(ry1)}V${f(ry0 + 10 + lift)}L${f(x + pw / 2)} ${f(ry0 + lift)}L${f(x + pw)} ${f(ry0 + 10 + lift)}V${f(ry1)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="${pointed(x + 4, ry0 + 8 + lift, pw - 8, ry1 - (ry0 + 8 + lift), (pw - 8) * 0.6)}" fill="url(#cnight)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x + pw / 2)} ${f(ry0 + 13 + lift)}v${f(Math.max(4, ry1 - ry0 - 18))}" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="0.7"/>`;
    }),
  );
  // the altar: its top seen from above, the cloth, the frontal
  const y1 = floorY - 2 * dais.h;
  const top = P.altarTop;
  const topFace = [at(altar.x0 - 3, top, altar.z0), at(altar.x1 + 3, top, altar.z0), at(altar.x1 + 3, top, altar.z1 + 2), at(altar.x0 - 3, top, altar.z1 + 2)];
  const [fx0, fy0] = at(altar.x0, top, altar.z1);
  const [fx1, fy1] = at(altar.x1, y1, altar.z1);
  out.push(
    `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#cstep)" stroke="${STONE_INK}" stroke-width="0.9"/>`,
  );
  // the frontal: crimson, a gold border and fringe, a cross in a roundel
  const fw = fx1 - fx0 - 12 * u;
  const fxs = fx0 + 6 * u;
  const fy = fy0 + 5;
  const fh = (fy1 - fy0) * 0.8;
  const fringe: string[] = [];
  for (let x = fxs + 1; x < fxs + fw; x += 2.2) fringe.push(`M${f(x)} ${f(fy + fh)}v2.8`);
  const rcx = fxs + fw / 2;
  const rcy = fy + fh * 0.46;
  const rr = Math.min(fh * 0.32, 9 * u);
  out.push(
    `<rect x="${f(fxs)}" y="${f(fy)}" width="${f(fw)}" height="${f(fh)}" fill="url(#cfront)" stroke="#2A0408" stroke-width="0.8"/>`,
    `<rect x="${f(fxs + 2)}" y="${f(fy + 2)}" width="${f(fw - 4)}" height="${f(fh - 4)}" fill="none" stroke="#E2B04A" stroke-opacity="0.85" stroke-width="0.9"/>`,
    `<path d="${fringe.join("")}" stroke="#E2B04A" stroke-width="1"/>`,
    `<circle cx="${f(rcx)}" cy="${f(rcy)}" r="${f(rr)}" fill="none" stroke="url(#pgv)" stroke-width="1.6"/>`,
    `<path d="M${f(rcx)} ${f(rcy - rr * 0.7)}V${f(rcy + rr * 0.7)}M${f(rcx - rr * 0.5)} ${f(rcy - rr * 0.15)}H${f(rcx + rr * 0.5)}" stroke="#F0CC72" stroke-width="1.6" stroke-linecap="round"/>`,
    // the ivory cloth over the top, hanging at the ends
    `<path d="${poly(topFace)}" fill="url(#fciv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<path d="M${f(fx0 - 4)} ${f(fy0)}H${f(fx1 + 4)}V${f(fy0 + 4)}H${f(fx0 - 4)}Z" fill="url(#fciv)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="M${f(fx0 - 4)} ${f(fy0 + 4)}V${f(fy0 + fh * 0.75)}l3 1.5V${f(fy0 + 4)}ZM${f(fx1 + 4)} ${f(fy0 + 4)}V${f(fy0 + fh * 0.75)}l-3 1.5V${f(fy0 + 4)}Z" fill="url(#fciv)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="M${f(fx0 - 3)} ${f(fy0 + 1)}H${f(fx0 + (fx1 - fx0) * 0.6)}" stroke="#fff" stroke-width="0.7"/>`,
  );
  out.push(...P.onAltar.map((c) => c.markup), ...P.tall.map((c) => c.markup));
  return out.join("");
}

/** The lectern: a turned oak post on a cross foot, a sloped desk with
 *  the Chapel's record open on it, a crimson marker. */
function lecternArt(P: ChapelPlan) {
  const L = P.lec;
  if (!L) return "";
  const { x, foot, h } = L;
  const u = P.u;
  const deskY = foot - h;
  const dw = 30 * u;
  const bw = 26 * u;
  const bh = 9 * u;
  return `<path d="M${f(x - 16 * u)} ${f(foot + 1.5)}h${f(32 * u)}" stroke="#000" stroke-opacity="0.45" stroke-width="4" stroke-linecap="round"/>
<path d="M${f(x - 14 * u)} ${f(foot)}h${f(28 * u)}l-3 -4h${f(-28 * u + 6)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<rect x="${f(x - 2.6 * u)}" y="${f(deskY + 6)}" width="${f(5.2 * u)}" height="${f(h - 10)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.7"/>
${[0.35, 0.7].map((k) => `<path d="M${f(x - 4.2 * u)} ${f(foot - h * k)}Q${f(x)} ${f(foot - h * k - 4)} ${f(x + 4.2 * u)} ${f(foot - h * k)}Q${f(x)} ${f(foot - h * k + 4)} ${f(x - 4.2 * u)} ${f(foot - h * k)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.6"/>`).join("")}
<path d="M${f(x - dw / 2)} ${f(deskY + 9)}L${f(x - dw / 2 + 3)} ${f(deskY)}H${f(x + dw / 2 - 3)}L${f(x + dw / 2)} ${f(deskY + 9)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(x - bw / 2)} ${f(deskY + 2)}Q${f(x - bw / 4)} ${f(deskY - 1)} ${f(x)} ${f(deskY + 1)}Q${f(x + bw / 4)} ${f(deskY - 1)} ${f(x + bw / 2)} ${f(deskY + 2)}L${f(x + bw / 2 + 1)} ${f(deskY + bh)}Q${f(x + bw / 4)} ${f(deskY + bh - 2)} ${f(x)} ${f(deskY + bh)}Q${f(x - bw / 4)} ${f(deskY + bh - 2)} ${f(x - bw / 2 - 1)} ${f(deskY + bh)}Z" fill="url(#fciv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(x)} ${f(deskY + 1)}V${f(deskY + bh)}" stroke="#A08A60" stroke-width="0.6"/>
<path d="M${f(x - bw * 0.42)} ${f(deskY + 3.5)}h${f(bw * 0.32)}M${f(x - bw * 0.42)} ${f(deskY + 5.5)}h${f(bw * 0.26)}M${f(x + bw * 0.1)} ${f(deskY + 3.5)}h${f(bw * 0.3)}M${f(x + bw * 0.1)} ${f(deskY + 5.5)}h${f(bw * 0.22)}" stroke="#2A1A3A" stroke-opacity="0.6" stroke-width="0.6"/>
<path d="M${f(x + 0.5)} ${f(deskY + bh)}l-1.2 6l1.2 -1.4l1.2 1.4Z" fill="#C2203A" stroke="#3A0408" stroke-width="0.4"/>`;
}

/** The whole chapel, still: everything but what lives. */
export function chapelArt(L: FlatLayout, P: ChapelPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: ashlar, a moulded string course, the glow of the glass
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#cwall)"/>`,
    ashlar(bx0, ceil + 4, bx1, floorY, 15, 34, 5),
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#cglass)"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#cwarm)"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 7)}" width="${f(bx1 - bx0)}" height="7" fill="url(#fslh)" stroke="${STONE_INK}" stroke-width="0.7"/>`,
  );
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(stoneSideWall(L, A.wall, ASHLAR, e ? { box: A, door: e.door, color: e.color } : null, 15));
  }
  out.push(vaultArt(L));
  out.push(chequerFloor(L, FLOOR_LIGHT, FLOOR_DARK, 11, "cchq"));
  out.push(runnerArt(L, P.cx - 22 * P.u, P.cx + 22 * P.u, P.dais.z, L.zFront + 10, FRONTAL, "#2A1A3A", "crun"));
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
  P.lancets.forEach((l, i) => {
    if (l) out.push(lancetArt(l.x, l.y, l.w, l.h, i ? GLASS.green : GLASS.blue, i ? GLASS.ruby : GLASS.amber, `cl${i}`));
  });
  out.push(greatWindowArt(P.win));
  out.push(altarArt(L, P));
  out.push(lecternArt(P));
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
${lit("cwall", ASHLAR, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("cglass", ["#B8A0F0", "#B8A0F0"], [0.24, 0], 0.5, 0.3, 0.5)}
${radial("cwarm", [LIGHT, LIGHT], [0.22, 0], 0.5, 0.88, 0.5)}
${linear("cnight", ["#2E4684", "#1A2A5A", "#0C1634"])}
${linear("cstep", ["#D8D4E4", "#A8A4BC", "#7A7690"])}
${linear("cfront", FRONTAL)}
</defs>
${out.join("\n")}`,
  );
}

/** The coloured light from the glass breathing, lightning in the window. */
function chapelUnder(fx: FlatFrame, P: ChapelPlan) {
  "worklet";
  const { time, draw, img } = fx;
  const g = P.glow;
  fx.screen[0].setAlphaf(0.75 + 0.25 * Math.sin(time * 0.4));
  draw(img.glow, g.x, g.y, g.w, g.h, fx.screen[0]);
  if (fx.flash > 0.01) {
    fx.screen[1].setAlphaf(Math.min(1, fx.flash));
    draw(img.flash, g.x, g.y, g.w, g.h, fx.screen[1]);
  }
}

export const chapel = flatRoom({
  id: "chapel",
  light: LIGHT,
  plan: chapelPlan,
  art: chapelArt,
  propArt: crossArt,
  motion: () => ({ kind: "pop", lift: 6, scale: 0.12 }),
  payoff: { burst: { kind: "beam", size: 70, color: "#FFD98A", duration: 1800 }, haptic: "bless" },
  images: (L, P) => ({
    glow: { w: P.glow.w, h: P.glow.h, art: () => chapelGlow(L, P) },
    flash: { w: P.glow.w, h: P.glow.h, art: () => chapelFlash(P) },
  }),
  under: chapelUnder,
});

// Seal the Manor's bell tower, seen flat on (the iso one is
// rooms/belltower.ts): a belfry of weathered stone under an open timber
// roof, two tall round-headed openings on the night (the moon in one,
// louvre boards in their feet), and in the middle, in a heavy oak frame
// strapped and bolted in iron, the great bronze bell on its headstock
// with the wheel behind it — the thing that works the room: touched, it
// swings and rings, back and forth, dying away, and the rope runs up and
// down the wheel, its striped sally rising and falling. Handbells and a
// candle on a shelf, the peal board, an iron-bound chest with a lantern
// on it, a barrel of lamp oil by the wall. As
// SVG markup, baked once (FlatRoom); the bell, the rope, the flames, the
// moonlight and the lightning in the openings are drawn over it live.

import { Skia } from "@shopify/react-native-skia";

import { linear, radial } from "@/components/engraved/panel";
import { rrect } from "@/components/engraved/trim";
import type { Side } from "../../roomScenes";
import {
  BRONZE,
  ashlar,
  candlestick,
  fittingDefs,
  footShadow,
  rafterArt,
  rounded,
  stoneSideWall,
} from "../fittings";
import { manorMapArt, notebookArt, notebookOn } from "../keepsakes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  f,
  floorArt,
  floorShade,
  lit,
  partDefs,
  plateBox,
  poly,
  rnd,
  spillArt,
  svg,
} from "../parts";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const STONE = ["#8C8698", "#625C70", "#3A3448"];
const SKY = ["#0C1634", "#1A2A5A", "#2E4684"];
const BELL_INK = "#3A1E08";
const HEMP = "#C8A870";
const LIGHT = "#FFB45E";

export function belltowerPlan(L: FlatLayout, exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH } = L;
  const has = (side: Side) => exits.some((e) => e.side === side);
  const W = bx1 - bx0;
  const cx = (bx0 + bx1) / 2;
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  // the bell on its headstock, the wheel behind, hung from the frame's beam
  // the bell a little larger than the frame's scale: it is the room
  const b = u * 1.15;
  const R = Math.round(33 * b);
  const pivot = { x: cx, y: Math.round(ceil + 34 + 46 * u) };
  const bell = { top: pivot.y + 9 * b, h: 88 * b, s: 26 * b, lip: 48 * b };
  const beam = { y: pivot.y - R - 18 * u, h: 13 * u };
  const postX = 92 * u;
  const postW = 12 * u;
  const posts = [cx - postX - postW / 2, cx + postX - postW / 2];
  // the openings either side of the frame, clear of the plates
  const sideW = posts[0] - bx0;
  const winW = Math.round(Math.min(34 * u, sideW * 0.56));
  const winTop = ceil + 52;
  const winH = Math.round(floorY - wallH * 0.4 - winTop);
  const wins = [
    { x: Math.round(bx0 + sideW / 2 - winW / 2), y: winTop, w: winW, h: winH },
    { x: Math.round(bx1 - sideW / 2 - winW / 2), y: winTop, w: winW, h: winH },
  ];
  // the working object: wheel, headstock and bell, one image
  const propW = Math.round(bell.lip * 2 + 8);
  const prop = {
    x: Math.round(cx - propW / 2),
    y: Math.round(pivot.y - R - 3),
    w: propW,
    h: Math.round(R + 3 + 9 * b + bell.h + 12 * b),
  };
  // the rope down the wheel's left rim, its sally, its tail coiled
  const ropeX = pivot.x - R + 1;
  const sallyH = Math.round(24 * u);
  const sallyY = floorY - 66 * u;
  const coil = { x: ropeX + 10, y: floorY + 10 };
  // a shelf of handbells on the left, the chest and lantern on the right
  const shelf = { x0: bx0 + 6, x1: posts[0] - 6, y: floorY - 70 };
  const chest = { x0: posts[1] + postW + 6, x1: bx1 - 6, h: 24 };
  const [, chestTop] = L.at(0, floorY - chest.h, 14);
  const lantern = { x: (chest.x0 + chest.x1) / 2, foot: chestTop - 1 };
  const stick = candlestick(shelf.x1 - 9, shelf.y, 10, 12, 0.8);
  const flames = [{ x: lantern.x, y: lantern.foot - 21, s: 0.85 }, stick.flame];
  // the manor's map nailed to the frame's right post, the notebook left
  // on the lid of the oil barrel
  const mapW = Math.round(30 * u);
  const mapH = Math.round(24 * u);
  const map = { x: Math.round(posts[1] + postW / 2 - mapW / 2), y: Math.round(winTop + winH * 0.42), w: mapW, h: mapH };
  const barrelX = (shelf.x0 + shelf.x1) / 2 - 4;
  const [bx, bfoot] = L.at(barrelX, floorY, 12);
  const notebook = has("left") ? undefined : notebookOn(bx + 1, bfoot - 32 * L.k(12) + 4, 21 * u);
  // the moonlight from the openings, its own box
  const shaft = { x: bx0 - 30, y: winTop + winW / 2, w: W + 60, h: L.at(0, floorY, 150)[1] + 12 - (winTop + winW / 2) };
  return {
    has,
    u,
    b,
    cx,
    R,
    pivot,
    bell,
    beam,
    posts,
    postW,
    wins,
    prop,
    touch: { x: cx, y: bell.top + bell.h * 0.52, rx: bell.lip * 1.05, ry: bell.h * 0.64 },
    flames,
    ropeX,
    ropeTop: pivot.y,
    sallyY,
    sallyH,
    coil,
    shelf,
    chest,
    chestTop,
    lantern,
    stick,
    shaft,
    floorY,
    map,
    barrelX,
    notebook,
  };
}
export type BelltowerPlan = ReturnType<typeof belltowerPlan>;

// ------------------------------------------------------------- the bell

/** The bell's outline, its crown at (cx, top): shoulder, waist, the
 *  flare of the sound bow, the lip curving under. */
function bellPath(cx: number, top: number, B: BelltowerPlan["bell"], u: number) {
  const { s, lip } = B;
  const Y = (y: number) => f(top + y * u);
  const X = (x: number) => f(cx + x);
  const S = s;
  const right = `L${X(S)} ${Y(6)}C${X(S + 3 * u)} ${Y(8)} ${X(S + 3 * u)} ${Y(14)} ${X(S + 3.5 * u)} ${Y(22)}C${X(S + 4 * u)} ${Y(40)} ${X(S + 8 * u)} ${Y(58)} ${X(S + 14 * u)} ${Y(70)}C${X(S + 18 * u)} ${Y(76)} ${X(lip)} ${Y(80)} ${X(lip)} ${Y(84)}L${X(lip)} ${Y(88)}`;
  const bottom = `Q${X(0)} ${Y(93)} ${X(-lip)} ${Y(88)}`;
  const left = `L${X(-lip)} ${Y(84)}C${X(-lip)} ${Y(80)} ${X(-(S + 18 * u))} ${Y(76)} ${X(-(S + 14 * u))} ${Y(70)}C${X(-(S + 8 * u))} ${Y(58)} ${X(-(S + 4 * u))} ${Y(40)} ${X(-(S + 3.5 * u))} ${Y(22)}C${X(-(S + 3 * u))} ${Y(14)} ${X(-(S + 3 * u))} ${Y(8)} ${X(-S)} ${Y(6)}Z`;
  return `M${X(0)} ${Y(6)}${right}${bottom}${left}`;
}

/** The bell's half-width at depth y (in its 0–88 units). */
function bellHalf(B: BelltowerPlan["bell"], y: number, u: number) {
  const pts: [number, number][] = [
    [6, B.s],
    [22, B.s + 3.5 * u],
    [40, B.s + 4.6 * u],
    [58, B.s + 8.5 * u],
    [70, B.s + 14 * u],
    [80, B.lip - 1],
    [88, B.lip],
  ];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][0]) {
      const k = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
    }
  }
  return B.lip;
}

/** The working object, in its own box: the oak wheel behind (spokes, a
 *  grooved rim), the headstock with its iron straps, the bronze bell with
 *  its crown, mouldings and inscription band, the clapper under the lip,
 *  the brass boss on the axle. */
export function bellArt(P: BelltowerPlan) {
  const { prop, pivot, R, bell: B, b: u } = P;
  const ox = -prop.x;
  const oy = -prop.y;
  const cx = pivot.x + ox;
  const py = pivot.y + oy;
  const top = B.top + oy;
  const out: string[] = [];
  // the wheel: rim, groove, six spokes, the hub
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    return `M${f(cx + Math.cos(a) * 5 * u)} ${f(py + Math.sin(a) * 5 * u)}L${f(cx + Math.cos(a) * (R - 3 * u))} ${f(py + Math.sin(a) * (R - 3 * u))}`;
  }).join("");
  out.push(
    `<path d="${spokes}" stroke="${WOOD_INK}" stroke-width="${f(4.4 * u)}" stroke-linecap="round"/>`,
    `<path d="${spokes}" stroke="url(#bwoodh)" stroke-width="${f(2.6 * u)}" stroke-linecap="round"/>`,
    `<circle cx="${f(cx)}" cy="${f(py)}" r="${f(R - 2.2 * u)}" fill="none" stroke="${WOOD_INK}" stroke-width="${f(6.4 * u)}"/>`,
    `<circle cx="${f(cx)}" cy="${f(py)}" r="${f(R - 2.2 * u)}" fill="none" stroke="url(#bwood)" stroke-width="${f(4.6 * u)}"/>`,
    `<circle cx="${f(cx)}" cy="${f(py)}" r="${f(R - 2.2 * u)}" fill="none" stroke="${WOOD_INK}" stroke-opacity="0.7" stroke-width="0.7"/>`,
    `<path d="M${f(cx - R * 0.86)} ${f(py - R * 0.4)}A${f(R - 1)} ${f(R - 1)} 0 0 1 ${f(cx - R * 0.25)} ${f(py - R * 0.94)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.45" stroke-width="0.8"/>`,
  );
  // iron stays from the headstock round the crown
  const hw = 32 * u;
  const hh = 7 * u;
  // the bell
  const body = bellPath(cx, top, B, u);
  const groove = (y: number, k = 1) => {
    const hwid = bellHalf(B, y, u) - 0.6;
    return `M${f(cx - hwid)} ${f(top + y * u)}Q${f(cx)} ${f(top + (y + 3 * k) * u)} ${f(cx + hwid)} ${f(top + y * u)}`;
  };
  const dots: string[] = [];
  for (let i = -4; i <= 4; i++) {
    const half = bellHalf(B, 30, u);
    const x = cx + (i / 4.6) * half;
    dots.push(`<rect x="${f(x - 1.3 * u)}" y="${f(top + (29 + Math.abs(i) * 0.12) * u)}" width="${f(2.6 * u)}" height="${f(2.2 * u)}" rx="0.4" fill="#5A3010" fill-opacity="0.55"/>`);
  }
  out.push(
    // the clapper's ball, just under the lip
    `<circle cx="${f(cx)}" cy="${f(top + 92 * u)}" r="${f(5 * u)}" fill="url(#biron)" stroke="#0E1014" stroke-width="0.8"/>`,
    `<path d="${body}" fill="#000" fill-opacity="0.35" transform="translate(2 2.5)"/>`,
    `<path d="${body}" fill="url(#bbrz)" stroke="${BELL_INK}" stroke-width="${f(1.3 * u)}"/>`,
    `<path d="${body}" fill="url(#bbrzv)"/>`,
    `<path d="${groove(14)}${groove(24)}${groove(35)}${groove(66, 2)}${groove(74, 2.4)}${groove(80, 2.6)}" fill="none" stroke="${BELL_INK}" stroke-opacity="0.7" stroke-width="${f(0.9 * u)}"/>`,
    `<path d="${groove(15.2)}${groove(67.3, 2)}${groove(81.3, 2.6)}" fill="none" stroke="#FFE8C8" stroke-opacity="0.45" stroke-width="${f(0.7 * u)}"/>`,
    dots.join(""),
    // the shine down the lit side
    `<path d="M${f(cx - B.s + 5 * u)} ${f(top + 12 * u)}C${f(cx - B.s + 3 * u)} ${f(top + 38 * u)} ${f(cx - B.s)} ${f(top + 58 * u)} ${f(cx - B.s - 8 * u)} ${f(top + 74 * u)}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="${f(1.6 * u)}" stroke-linecap="round"/>`,
    `<path d="M${f(cx - B.lip + 4 * u)} ${f(top + 85 * u)}Q${f(cx - B.lip * 0.4)} ${f(top + 88.5 * u)} ${f(cx)} ${f(top + 89 * u)}" fill="none" stroke="#FFE8C8" stroke-opacity="0.6" stroke-width="${f(0.9 * u)}"/>`,
  );
  // the crown: a block and its canons, the straps over the shoulders
  out.push(
    `<path d="M${f(cx - 11 * u)} ${f(top + 6.5 * u)}V${f(top + 1 * u)}Q${f(cx)} ${f(top - 2.5 * u)} ${f(cx + 11 * u)} ${f(top + 1 * u)}V${f(top + 6.5 * u)}Z" fill="url(#bbrz)" stroke="${BELL_INK}" stroke-width="0.9"/>`,
    ...[-1, 1].map(
      (k) =>
        `<path d="M${f(cx + k * 20 * u)} ${f(py + hh - 1)}L${f(cx + k * 24 * u)} ${f(top + 16 * u)}" stroke="#0E1014" stroke-width="${f(4.2 * u)}" stroke-linecap="round"/><path d="M${f(cx + k * 20 * u)} ${f(py + hh - 1)}L${f(cx + k * 24 * u)} ${f(top + 16 * u)}" stroke="url(#bironh)" stroke-width="${f(2.4 * u)}" stroke-linecap="round"/><circle cx="${f(cx + k * 23.2 * u)}" cy="${f(top + 13 * u)}" r="${f(1.3 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
    ),
  );
  // the headstock: a block of elm across the axle, chamfered
  out.push(
    `<path d="M${f(cx - hw)} ${f(py - hh)}H${f(cx + hw)}L${f(cx + hw + 3 * u)} ${f(py + hh)}H${f(cx - hw - 3 * u)}Z" fill="url(#bwood)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(cx - hw + 1)} ${f(py - hh + 1.2)}H${f(cx + hw * 0.4)}" stroke="#F0D0A8" stroke-opacity="0.45" stroke-width="0.8"/>`,
    `<path d="M${f(cx - hw - 1.5 * u)} ${f(py + 1.5)}H${f(cx + hw + 1.5 * u)}" stroke="${WOOD_INK}" stroke-opacity="0.5" stroke-width="0.7"/>`,
    ...[-hw + 6 * u, hw - 6 * u].map(
      (dx) => `<circle cx="${f(cx + dx)}" cy="${f(py - 1)}" r="${f(1.6 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.5"/>`,
    ),
    // the axle's brass boss
    `<circle cx="${f(cx)}" cy="${f(py)}" r="${f(5.4 * u)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.8"/>`,
    `<circle cx="${f(cx)}" cy="${f(py)}" r="${f(2 * u)}" fill="#6A4A16" stroke="${INK}" stroke-width="0.5"/>`,
    `<circle cx="${f(cx - 1.8 * u)}" cy="${f(py - 1.8 * u)}" r="${f(1.1 * u)}" fill="#fff" fill-opacity="0.85"/>`,
  );
  return svg(
    prop.w,
    prop.h,
    `<defs>${linear("bbrz", BRONZE, false)}${linear("bbrzv", ["#000000", "#000000", "#000000"], true, [0, 0, 0.3])}${linear("bwood", ["#8A6440", "#5A3C22", "#3A2414"])}${linear("bwoodh", ["#8A6440", "#5A3C22", "#3A2414"], false)}${linear("biron", ["#A8AEB8", "#5A606A", "#2A2E36"])}${linear("bironh", ["#A8AEB8", "#5A606A", "#2A2E36"], false)}${radial("pgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}</defs>
${out.join("\n")}`,
  );
}

/** The sally: the rope's woollen grip in stripes of crimson, ivory and
 *  blue, w × h (drawn live, rising and falling with the bell). */
export function sallyArt(w: number, h: number) {
  const bands: string[] = [];
  const cols = ["#C2203A", "#F4EEDF", "#2A4A9A", "#F4EEDF"];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const y = 2 + ((h - 4) * i) / n;
    bands.push(`<path d="M1 ${f(y + 1.2)}L${f(w - 1)} ${f(y)}V${f(y + (h - 4) / n)}L1 ${f(y + (h - 4) / n + 1.2)}Z" fill="${cols[i % 4]}"/>`);
  }
  return svg(
    w,
    h,
    `<defs><clipPath id="sc"><path d="${rrect(1, 1, w - 2, h - 2, (w - 2) / 2)}"/></clipPath>${linear("ss", ["#000000", "#000000"], false, [0, 0.35])}</defs>
<g clip-path="url(#sc)">${bands.join("")}<rect width="${w}" height="${h}" fill="url(#ss)"/></g>
<path d="${rrect(1, 1, w - 2, h - 2, (w - 2) / 2)}" fill="none" stroke="#2A0408" stroke-width="0.7"/>
<path d="M${f(w * 0.32)} 3V${f(h - 3)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>`,
  );
}

// -------------------------------------------------------- the belfry

/** A belfry opening: a stone surround with a keystone, the night sky
 *  (stars, the moon), louvre boards across its foot, the stone sill. */
function openingArt(W: { x: number; y: number; w: number; h: number }, i: number, moon: boolean) {
  const { x, y, w, h } = W;
  const t = 5;
  const opening = rounded(x, y, w, h);
  const outer = rounded(x - t, y - t, w + 2 * t, h + t);
  const id = `bo${i}`;
  const stars = Array.from({ length: 10 }, (_, k) => {
    const sx = x + 2 + rnd(k * 3 + i * 17 + 1) * (w - 4);
    const sy = y + 4 + rnd(k * 7 + i * 5 + 2) * h * 0.55;
    return `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(0.4 + rnd(k + i) * 0.5)}" fill="#fff" fill-opacity="${f(0.5 + rnd(k * 5) * 0.5)}"/>`;
  }).join("");
  const louvreTop = y + h * 0.56;
  const louvres: string[] = [];
  for (let yy = louvreTop; yy < y + h - 4; yy += 7) {
    louvres.push(
      `<path d="M${f(x)} ${f(yy)}L${f(x + w)} ${f(yy + 2)}L${f(x + w)} ${f(yy + 6)}L${f(x)} ${f(yy + 4)}Z" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
      `<path d="M${f(x)} ${f(yy + 0.6)}L${f(x + w * 0.6)} ${f(yy + 1.8)}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.5"/>`,
    );
  }
  const voussoirs: string[] = [];
  for (let k = 1; k < 7; k++) {
    const a = Math.PI + (Math.PI * k) / 7;
    const r0 = w / 2;
    const r1 = w / 2 + t;
    voussoirs.push(
      `M${f(x + w / 2 + Math.cos(a) * r0)} ${f(y + w / 2 + Math.sin(a) * r0)}L${f(x + w / 2 + Math.cos(a) * r1)} ${f(y + w / 2 + Math.sin(a) * r1)}`,
    );
  }
  return `<defs><clipPath id="${id}"><path d="${opening}"/></clipPath></defs>
<path d="${outer}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>
<path d="${outer}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.9"/>
<path d="${opening}" fill="url(#bsky)"/>
<g clip-path="url(#${id})">${stars}${
    moon
      ? `<circle cx="${f(x + w * 0.62)}" cy="${f(y + w * 0.75)}" r="${f(w * 0.75)}" fill="url(#bmg)"/><circle cx="${f(x + w * 0.62)}" cy="${f(y + w * 0.75)}" r="${f(w * 0.2)}" fill="url(#bmn)" stroke="#8EA3BC" stroke-width="0.5"/>`
      : ""
  }<path d="M${f(x - 2)} ${f(y + h * 0.42)}q${f(w * 0.4)} -4 ${f(w * 0.7)} -1q${f(w * 0.2)} 2 ${f(w * 0.5)} -1" fill="none" stroke="#6A88C4" stroke-opacity="0.35" stroke-width="2.6" stroke-linecap="round"/>${louvres.join("")}</g>
<path d="${opening}" fill="none" stroke="#2A2638" stroke-width="1"/>
<path d="${voussoirs.join("")}" stroke="#2A2638" stroke-width="0.8"/>
<path d="M${f(x + w / 2 - 3.5)} ${f(y - t - 1)}h7l-1.2 ${f(t + 3)}h-4.6Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(x - t - 3)} ${f(y + h)}h${f(w + 2 * t + 6)}v5h${f(-(w + 2 * t + 6))}Z" fill="url(#pstoneh)" stroke="#2A2638" stroke-width="0.8"/>
<path d="M${f(x - t - 2)} ${f(y + h + 1)}H${f(x + w * 0.6)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>`;
}

/** The oak frame the bell hangs in: a sole plate on the boards, two
 *  chamfered posts, braces to the beam, iron straps and bolts, a brass
 *  date plate on the beam. */
function frameArt(L: FlatLayout, P: BelltowerPlan) {
  const { at, floorY } = L;
  const { posts, postW, beam, u, cx } = P;
  const out: string[] = [];
  const x0 = posts[0] - 10 * u;
  const x1 = posts[1] + postW + 10 * u;
  // the sole plate, a beam on the floor, its top seen from above
  const top = [at(x0, floorY - 9, 2), at(x1, floorY - 9, 2), at(x1, floorY - 9, 24), at(x0, floorY - 9, 24)];
  const [fx0, fy0] = at(x0, floorY - 9, 24);
  const [fx1, fy1] = at(x1, floorY, 24);
  out.push(
    footShadow(L, x0, x1, 4, 34),
    `<path d="${poly(top)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(fx0 + 1)} ${f(fy0 + 1)}H${f(fx0 + (fx1 - fx0) * 0.5)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>`,
  );
  // the posts and the beam
  const postTop = beam.y;
  for (const px of posts) {
    out.push(
      `<rect x="${f(px + 2)}" y="${f(postTop + 2)}" width="${f(postW)}" height="${f(floorY - 9 - postTop)}" fill="#000" fill-opacity="0.4"/>`,
      `<rect x="${f(px)}" y="${f(postTop)}" width="${f(postW)}" height="${f(floorY - 9 - postTop)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
      `<path d="M${f(px + 2.4 * u)} ${f(postTop + 16)}V${f(floorY - 18)}M${f(px + postW - 2.4 * u)} ${f(postTop + 16)}V${f(floorY - 18)}" stroke="${WOOD_INK}" stroke-opacity="0.6" stroke-width="0.7"/>`,
      `<path d="M${f(px + 1.2)} ${f(postTop + 16)}V${f(floorY - 14)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.8"/>`,
    );
    // an iron strap and its bolts at the foot and the head
    for (const sy of [floorY - 36, postTop + beam.h + 6]) {
      out.push(
        `<rect x="${f(px - 1)}" y="${f(sy)}" width="${f(postW + 2)}" height="${f(14 * u)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>`,
        `<circle cx="${f(px + postW / 2)}" cy="${f(sy + 3.5 * u)}" r="${f(1.4 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
        `<circle cx="${f(px + postW / 2)}" cy="${f(sy + 10.5 * u)}" r="${f(1.4 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
      );
    }
  }
  // braces from the posts up to the beam
  const braces = [
    [posts[0] + postW, beam.y + beam.h + 46 * u, posts[0] + postW + 34 * u, beam.y + beam.h],
    [posts[1], beam.y + beam.h + 46 * u, posts[1] - 34 * u, beam.y + beam.h],
  ];
  for (const [ax, ay, bx, by] of braces) {
    const d = `M${f(ax)} ${f(ay)}L${f(ax)} ${f(ay - 9 * u)}L${f(bx - Math.sign(bx - ax) * 9 * u)} ${f(by)}L${f(bx)} ${f(by)}Z`;
    out.push(
      `<path d="${d}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
      `<path d="M${f(ax)} ${f(ay - 9 * u)}L${f(bx - Math.sign(bx - ax) * 9 * u)} ${f(by)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>`,
      `<circle cx="${f(ax + (bx - ax) * 0.2)}" cy="${f(ay - 6 * u + (by - ay) * 0.2)}" r="${f(1.4 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
    );
  }
  // the beam across, iron over its joints
  const bx0 = posts[0] - 8 * u;
  const bx1 = posts[1] + postW + 8 * u;
  out.push(
    `<rect x="${f(bx0 + 2)}" y="${f(beam.y + 3)}" width="${f(bx1 - bx0)}" height="${f(beam.h)}" fill="#000" fill-opacity="0.4"/>`,
    `<rect x="${f(bx0)}" y="${f(beam.y)}" width="${f(bx1 - bx0)}" height="${f(beam.h)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(bx0 + 1)} ${f(beam.y + 1.2)}H${f(bx1 - 1)}" stroke="#F0D0A8" stroke-opacity="0.4" stroke-width="0.8"/>`,
    ...posts.map(
      (px) =>
        `<rect x="${f(px - 1)}" y="${f(beam.y - 1)}" width="${f(postW + 2)}" height="${f(beam.h + 2)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/><circle cx="${f(px + postW / 2)}" cy="${f(beam.y + beam.h / 2)}" r="${f(1.5 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
    ),
    `<path d="${rrect(cx - 14 * u, beam.y + 2.5 * u, 28 * u, beam.h - 5 * u, 1)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="M${f(cx - 9 * u)} ${f(beam.y + beam.h / 2)}h${f(18 * u)}" stroke="#7A5212" stroke-width="0.7" stroke-dasharray="2 1.2"/>`,
  );
  // the hangers from the beam down to the axle's bearings, behind the wheel
  const hy = P.pivot.y;
  for (const k of [-1, 1]) {
    const hx = cx + k * (P.R + 5 * u);
    out.push(
      `<path d="M${f(hx)} ${f(beam.y + beam.h)}V${f(hy + 4 * u)}" stroke="#0E1014" stroke-width="${f(5 * u)}"/>`,
      `<path d="M${f(hx)} ${f(beam.y + beam.h)}V${f(hy + 4 * u)}" stroke="url(#pironh)" stroke-width="${f(3.2 * u)}"/>`,
      `<path d="${rrect(hx - 5 * u, hy - 4 * u, 10 * u, 10 * u, 2)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>`,
      `<circle cx="${f(hx)}" cy="${f(beam.y + beam.h + 4 * u)}" r="${f(1.3 * u)}" fill="#C8CCD4" stroke="#0E1014" stroke-width="0.4"/>`,
    );
  }
  return out.join("");
}

/** A shelf on iron brackets with three handbells (bronze, leather
 *  handles) and a candlestick. */
function shelfArt(P: BelltowerPlan) {
  const { x0, x1, y } = P.shelf;
  const out: string[] = [
    `<rect x="${f(x0 + 1.5)}" y="${f(y + 2)}" width="${f(x1 - x0)}" height="4" fill="#000" fill-opacity="0.4"/>`,
    `<rect x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="4" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  ];
  for (const bx of [x0 + 5, x1 - 5]) {
    out.push(`<path d="M${f(bx)} ${f(y + 4)}V${f(y + 14)}M${f(bx)} ${f(y + 13)}Q${f(bx + (bx < (x0 + x1) / 2 ? 7 : -7))} ${f(y + 12)} ${f(bx + (bx < (x0 + x1) / 2 ? 7 : -7))} ${f(y + 4)}" fill="none" stroke="#0E1014" stroke-width="1.6"/>`);
  }
  const n = 3;
  for (let i = 0; i < n; i++) {
    const s = 0.75 + i * 0.13;
    const bx = x0 + 7 + i * 10;
    if (bx + 6 > x1 - 16) break;
    const h = 11 * s;
    const w = 6 * s;
    out.push(
      `<path d="M${f(bx - 1)} ${f(y - h - 7)}h2v7h-2Z" fill="#5A3418" stroke="${WOOD_INK}" stroke-width="0.5"/>`,
      `<path d="M${f(bx - w * 0.45)} ${f(y - h)}Q${f(bx - w * 0.5)} ${f(y - h * 0.4)} ${f(bx - w)} ${f(y - 0.5)}H${f(bx + w)}Q${f(bx + w * 0.5)} ${f(y - h * 0.4)} ${f(bx + w * 0.45)} ${f(y - h)}Z" fill="url(#fbrzh)" stroke="${BELL_INK}" stroke-width="0.6"/>`,
      `<path d="M${f(bx - w * 0.6)} ${f(y - h * 0.5)}Q${f(bx - w * 0.7)} ${f(y - h * 0.2)} ${f(bx - w * 0.85)} ${f(y - 1.5)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>`,
    );
  }
  out.push(P.stick.markup);
  return out.join("");
}

/** The peal board: dark oak, a gilt border, a crest and lines of the
 *  peals rung, in gold. */
function pealBoardArt(x: number, y: number, w: number, h: number) {
  const lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    const ly = y + 13 + i * ((h - 17) / 6);
    lines.push(`M${f(x + 5)} ${f(ly)}h${f((w - 10) * (0.5 + rnd(i + 3) * 0.45))}`);
  }
  return `<rect x="${f(x + 1.5)}" y="${f(y + 2.5)}" width="${f(w)}" height="${f(h)}" fill="#000" fill-opacity="0.45"/>
<path d="M${f(x)} ${f(y + 6)}Q${f(x + w / 2)} ${f(y - 4)} ${f(x + w)} ${f(y + 6)}V${f(y + h)}H${f(x)}Z" fill="#2A160A" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="M${f(x + 2)} ${f(y + 7)}Q${f(x + w / 2)} ${f(y - 1.5)} ${f(x + w - 2)} ${f(y + 7)}V${f(y + h - 2)}H${f(x + 2)}Z" fill="none" stroke="url(#pgv)" stroke-width="1"/>
<path d="${lines.join("")}" stroke="#E2B04A" stroke-opacity="0.75" stroke-width="0.8"/>
<circle cx="${f(x + w / 2)}" cy="${f(y + 5.5)}" r="2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`;
}

/** The iron-bound chest on the boards and the lantern on it. */
function chestArt(L: FlatLayout, P: BelltowerPlan) {
  const { at, floorY } = L;
  const { x0, x1, h } = P.chest;
  const [fx0, fy0] = at(x0, floorY - h, 14);
  const [fx1, fy1] = at(x1, floorY, 14);
  const lid = [at(x0, floorY - h, 0), at(x1, floorY - h, 0), at(x1, floorY - h, 14), at(x0, floorY - h, 14)];
  const out: string[] = [
    footShadow(L, x0, x1, 2, 22),
    `<path d="${poly(lid)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
  ];
  for (const k of [0.2, 0.8]) {
    const bx = fx0 + (fx1 - fx0) * k;
    out.push(`<rect x="${f(bx - 2.5)}" y="${f(fy0)}" width="5" height="${f(fy1 - fy0)}" fill="url(#piron)" stroke="#0E1014" stroke-width="0.6"/>`);
  }
  out.push(
    `<rect x="${f(fx0)}" y="${f(fy0 + 3)}" width="${f(fx1 - fx0)}" height="3" fill="url(#pironh)" stroke="#0E1014" stroke-width="0.5"/>`,
    `<path d="${rrect((fx0 + fx1) / 2 - 3.5, fy0 + 5, 7, 7, 1.2)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
    `<circle cx="${f((fx0 + fx1) / 2)}" cy="${f(fy0 + 8.5)}" r="0.9" fill="${INK}"/>`,
  );
  // the lantern: an iron cage with a ring on top, glass sides, a candle
  const { x, foot } = P.lantern;
  const lw = 13;
  const lh = 22;
  out.push(
    `<path d="M${f(x - lw / 2 - 1)} ${f(foot)}h${f(lw + 2)}v-3h${f(-(lw + 2))}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.6"/>`,
    `<rect x="${f(x - lw / 2)}" y="${f(foot - lh)}" width="${lw}" height="${f(lh - 3)}" fill="#FFD890" fill-opacity="0.22" stroke="#0E1014" stroke-width="0.6"/>`,
    `<rect x="${f(x - 1.8)}" y="${f(foot - 12)}" width="3.6" height="9" fill="url(#fciv)" stroke="${INK}" stroke-width="0.5"/>`,
    `<path d="M${f(x - lw / 2)} ${f(foot - lh)}V${f(foot - 3)}M${f(x + lw / 2)} ${f(foot - lh)}V${f(foot - 3)}M${f(x)} ${f(foot - lh)}V${f(foot - 3)}" stroke="#1A1E24" stroke-width="1.2"/>`,
    `<path d="M${f(x - lw / 2 - 2)} ${f(foot - lh)}L${f(x)} ${f(foot - lh - 7)}L${f(x + lw / 2 + 2)} ${f(foot - lh)}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>`,
    `<circle cx="${f(x)}" cy="${f(foot - lh - 10)}" r="2.6" fill="none" stroke="#2A2E36" stroke-width="1.2"/>`,
    `<path d="M${f(x - lw / 2 + 1.5)} ${f(foot - lh + 2)}V${f(foot - 5)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`,
  );
  return out.join("");
}

/** An oak barrel by the wall (lamp oil, grease for the bearings): bulging
 *  staves, three iron hoops, its lid seen from above. */
function barrelArt(L: FlatLayout, cx: number, bw: number, bh: number) {
  const { at, floorY } = L;
  const [x, foot] = at(cx, floorY, 12);
  const k = L.k(12);
  const w = bw * k;
  const h = bh * k;
  const top = foot - h;
  const bulge = w * 0.1;
  const body = `M${f(x - w / 2)} ${f(top + 3)}Q${f(x - w / 2 - bulge)} ${f(top + h / 2)} ${f(x - w / 2)} ${f(foot - 2)}Q${f(x)} ${f(foot + 3)} ${f(x + w / 2)} ${f(foot - 2)}Q${f(x + w / 2 + bulge)} ${f(top + h / 2)} ${f(x + w / 2)} ${f(top + 3)}Z`;
  const staves = [-0.3, -0.1, 0.1, 0.3]
    .map((t) => `M${f(x + w * t)} ${f(top + 4)}Q${f(x + w * t * 1.2)} ${f(top + h / 2)} ${f(x + w * t)} ${f(foot - 1)}`)
    .join("");
  const hoop = (y: number, wide: number) =>
    `M${f(x - wide / 2)} ${f(y)}Q${f(x)} ${f(y + 3)} ${f(x + wide / 2)} ${f(y)}`;
  const hoops = `${hoop(top + h * 0.16, w + bulge * 0.7)}${hoop(top + h * 0.5, w + bulge * 1.9)}${hoop(top + h * 0.86, w + bulge * 0.7)}`;
  return `<path d="M${f(x - w / 2 - 4)} ${f(foot + 1)}h${f(w + 8)}" stroke="#000" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>
<path d="${body}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="${staves}" fill="none" stroke="${WOOD_INK}" stroke-opacity="0.6" stroke-width="0.7"/>
<path d="${hoops}" fill="none" stroke="#0E1014" stroke-width="3"/>
<path d="${hoops}" fill="none" stroke="url(#pironh)" stroke-width="1.6"/>
<path d="M${f(x - w / 2)} ${f(top + 3)}Q${f(x)} ${f(top - 2)} ${f(x + w / 2)} ${f(top + 3)}Q${f(x)} ${f(top + 7)} ${f(x - w / 2)} ${f(top + 3)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(x - w / 2 + 3)} ${f(top + h * 0.3)}Q${f(x - w / 2 - bulge * 0.6)} ${f(top + h / 2)} ${f(x - w / 2 + 2)} ${f(top + h * 0.75)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.4" stroke-width="0.8"/>`;
}

/** The coil of the rope's tail on the boards. */
function coilArt(x: number, y: number) {
  const loops = [0, 1, 2]
    .map((k) => `M${f(x - 10 + k)} ${f(y - k * 2.2)}a${f(10 - k)} ${f(3.4 - k * 0.4)} 0 1 0 ${f(20 - 2 * k)} 0a${f(10 - k)} ${f(3.4 - k * 0.4)} 0 1 0 ${f(-20 + 2 * k)} 0`)
    .join("");
  return `<path d="M${f(x - 12)} ${f(y + 2)}h24" stroke="#000" stroke-opacity="0.45" stroke-width="4" stroke-linecap="round"/>
<path d="${loops}" fill="none" stroke="#3A2408" stroke-width="3.4"/>
<path d="${loops}" fill="none" stroke="${HEMP}" stroke-width="2"/>`;
}

/** The whole bell tower, still: everything but what lives. */
export function belltowerArt(L: FlatLayout, P: BelltowerPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: weathered stone, moonlight high, lamplight low
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bwall)"/>`,
    ashlar(bx0, ceil + 4, bx1, floorY, 14, 30, 3),
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bmoon)"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#bwarm)"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 7)}" width="${f(bx1 - bx0)}" height="7" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.7"/>`,
  );
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(stoneSideWall(L, A.wall, STONE, e ? { box: A, door: e.door, color: e.color } : null, 14));
  }
  out.push(rafterArt(L));
  out.push(floorArt(L));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(spillArt(x + (back ? 0 : e.side === "frontLeft" ? 16 : -16), y + (back ? 8 : 4), back ? 34 : 30, back ? 11 : 16, e.color, `spill${e.side}`));
  }
  // a back door where the room has one (the tower has none tonight)
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(backDoorArt(L.doors[side], e.door, e.color, `bd${side[0]}`));
  }
  if (!P.has("left")) out.push(openingArt(P.wins[0], 0, true));
  if (!P.has("right")) out.push(openingArt(P.wins[1], 1, false));
  if (!P.has("right")) out.push(pealBoardArt(P.chest.x0 + 4, P.wins[1].y + P.wins[1].h + 12, P.chest.x1 - P.chest.x0 - 8, 34));
  out.push(frameArt(L, P));
  if (!P.has("left")) out.push(shelfArt(P), barrelArt(L, P.barrelX, 22, 32));
  if (!P.has("right")) out.push(chestArt(L, P));
  out.push(coilArt(P.coil.x, P.coil.y));
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
${lit("bwall", STONE, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("bmoon", ["#9AB8E8", "#9AB8E8"], [0.2, 0], 0.15, 0.3, 0.45)}
${radial("bwarm", [LIGHT, LIGHT], [0.16, 0], 0.85, 0.85, 0.4)}
${linear("bsky", SKY)}
${radial("bmg", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.9, 0.35, 0])}
${radial("bmn", ["#FFFFFF", "#F2F4FA", "#C8D0E2"], undefined, 0.4, 0.35, 0.75)}
</defs>
${out.join("\n")}`,
  );
}

/** The moonlight falling from the openings to the boards, its own box. */
export function belltowerShaft(L: FlatLayout, P: BelltowerPlan) {
  const { x: x0, y: y0, w, h } = P.shaft;
  const X = (x: number) => f(x - x0);
  const Y = (y: number) => f(y - y0);
  const beams = P.wins
    .map((win, i) => {
      if (P.has(i ? "right" : "left")) return "";
      const dir = i ? -1 : 1;
      const a = L.at(win.x + (dir > 0 ? 4 : -14), L.floorY, 60);
      const b = L.at(win.x + win.w + (dir > 0 ? 18 : 2), L.floorY, 140);
      const patch = [L.at(win.x + (dir > 0 ? 2 : -10), L.floorY, 62), L.at(win.x + win.w + (dir > 0 ? 6 : -2), L.floorY, 62), b, L.at(win.x + (dir > 0 ? 10 : -22), L.floorY, 140)];
      return `<path d="M${X(win.x + 3)} ${Y(win.y + win.w / 2 + 2)}H${X(win.x + win.w - 3)}L${X(b[0])} ${Y(b[1])}H${X(a[0] - 6)}Z" fill="url(#ms)"/>
<path d="M${patch.map((p) => `${X(p[0])} ${Y(p[1])}`).join("L")}Z" fill="url(#mp)"/>`;
    })
    .join("");
  return svg(
    w,
    h,
    `<defs>${linear("ms", ["#B8D0F4", "#B8D0F4", "#B8D0F4"], true, [0.08, 0.14, 0.03])}${radial("mp", ["#C8DCFF", "#C8DCFF"], [0.4, 0])}</defs>${beams}`,
  );
}

/** Both openings as lightning lights them, in the shaft's box. */
export function belltowerFlash(P: BelltowerPlan) {
  const { x: x0, y: y0, w, h } = P.shaft;
  const lights = P.wins
    .map((win) => {
      const x = win.x - x0;
      const y = win.y - y0;
      return `<rect x="${f(x - 30)}" y="${f(Math.max(0, y - 10))}" width="${f(win.w + 60)}" height="${f(win.h + 50)}" fill="url(#fl)"/><path d="${rounded(x, y, win.w, win.h * 0.56)}" fill="#F4F8FF" fill-opacity="0.85"/>`;
    })
    .join("");
  return svg(w, h, `<defs>${radial("fl", ["#E8F0FF", "#B8CCFF", "#B8CCFF"], [0.55, 0.22, 0])}</defs>${lights}`);
}

/** The moonlight breathing, a lightning flash in the openings, the rope
 *  running on the wheel with its sally rising and falling. */
function belltowerUnder(fx: FlatFrame, P: BelltowerPlan) {
  "worklet";
  const { c, time, draw, img } = fx;
  const sh = P.shaft;
  fx.screen[0].setAlphaf(0.8 + 0.2 * Math.sin(time * 0.3));
  draw(img.shaft, sh.x, sh.y, sh.w, sh.h, fx.screen[0]);
  if (fx.flash > 0.01) {
    fx.screen[1].setAlphaf(Math.min(1, fx.flash));
    draw(img.flash, sh.x, sh.y, sh.w, sh.h, fx.screen[1]);
  }
  // the rope runs with the wheel: a turn of θ pulls R·θ of it up
  const lift = (P.R * (16 * fx.move * Math.PI)) / 180;
  const sallyTop = P.sallyY - lift;
  const tailY = sallyTop + P.sallyH;
  const s = fx.stroke;
  s.setAlphaf(1);
  s.setColor(Skia.Color("#2A1A08"));
  s.setStrokeWidth(3.2);
  c.drawLine(P.ropeX, P.ropeTop, P.ropeX, sallyTop + 2, s);
  c.drawLine(P.ropeX, tailY - 2, P.coil.x - 6, P.coil.y - 5, s);
  s.setColor(Skia.Color("#C8A870"));
  s.setStrokeWidth(1.8);
  c.drawLine(P.ropeX, P.ropeTop, P.ropeX, sallyTop + 2, s);
  c.drawLine(P.ropeX, tailY - 2, P.coil.x - 6, P.coil.y - 5, s);
  draw(img.sally, P.ropeX - 3.5 * P.u, sallyTop, 7 * P.u, P.sallyH);
}

export const belltower = flatRoom({
  id: "belltower",
  light: LIGHT,
  plan: belltowerPlan,
  art: belltowerArt,
  propArt: bellArt,
  mapArt: (P) => manorMapArt(P.map.w, P.map.h, "pinned"),
  notebookArt: (P) => (P.notebook ? notebookArt(P.notebook.w, P.notebook.h) : ""),
  motion: (P) => ({ kind: "swing", x: P.pivot.x, y: P.pivot.y, degrees: 16, ring: true }),
  payoff: {
    burst: { kind: "rings", size: 60, color: "#F0C87A", duration: 1400 },
    haptic: "ring",
    at: (P) => [P.cx, P.bell.top + P.bell.h * 0.55],
  },
  images: (L, P) => ({
    shaft: { w: P.shaft.w, h: P.shaft.h, art: () => belltowerShaft(L, P) },
    flash: { w: P.shaft.w, h: P.shaft.h, art: () => belltowerFlash(P) },
    sally: { w: 7 * P.u, h: P.sallyH, art: () => sallyArt(7 * P.u, P.sallyH), key: "" },
  }),
  under: belltowerUnder,
});

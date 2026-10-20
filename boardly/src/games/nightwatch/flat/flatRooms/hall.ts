// Seal the Manor's great hall, seen flat on (the iso one is
// rooms/hall.ts): warm stone walls panelled in gilt mouldings under the
// coffered ceiling, and in the middle of the back wall a great arch of
// pale stone opening on the staircase — a crimson-carpeted flight rising
// away from you between turned balusters to a landing under a tall
// moonlit window, its first steps spilling out into the hall between
// two newel posts with glass lamps. Over it all hangs the chandelier,
// the thing that works the room: tiers of gilt arms, ivory candles and
// crystal drops on a long chain; touched, it sways and dies away, a
// glow of candlelight. A door either side of the arch, an archway in
// each wall, a crimson runner across the chequered marble. As SVG
// markup, baked once (FlatRoom); the chandelier, the flames and the
// moonlight are drawn over it live.

import { linear, radial } from "@/components/engraved/panel";
import { rrect } from "@/components/engraved/trim";
import type { Side } from "../../roomScenes";
import {
  STONE_INK,
  chequerFloor,
  fittingDefs,
  rounded,
  runnerArt,
  sconce,
} from "../fittings";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  ceilingArt,
  f,
  floorShade,
  line,
  lit,
  partDefs,
  plateBox,
  poly,
  sideWallArt,
  spillArt,
  svg,
  type P2,
} from "../parts";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const WALL = ["#A8977A", "#7E6E56", "#524636"];
const CARPET = ["#C2203A", "#8A1424", "#4A0610"];
const LIGHT = "#FFB45E";
const FLOOR_LIGHT = ["#E4DCCC", "#C4B8A2", "#948870"];
const FLOOR_DARK = ["#3A3036", "#2A2228", "#181418"];
const STEP = 14;
const STEPS = 12;

export function hallPlan(L: FlatLayout, exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, at } = L;
  const has = (side: Side) => exits.some((e) => e.side === side);
  const W = bx1 - bx0;
  const cx = (bx0 + bx1) / 2;
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  const rail = Math.round(floorY - wallH * 0.25);
  // the great arch on the staircase, between the doors
  const half = Math.round(Math.min(62 * u, (L.doors.right.x - L.doors.left.x - L.doors.left.w) / 2 - 16));
  const arch = { x0: cx - half, x1: cx + half, crown: ceil + 30 };
  // the flight: steps rising away from you, the first two out in the hall
  const rise = Math.min(9 * u, (floorY - L.vy - 2) / STEPS);
  const stairHalf = half - 12 * u;
  const deep = STEP * u * (STEPS - 2) + 46 * u;
  // the chandelier on its chain from the ceiling
  const pivot = { x: cx, y: Math.round(ceil * 0.35) };
  const bodyY = ceil + 52 * u;
  const R = 46 * u;
  const prop = { x: Math.round(cx - R - 12 * u), y: pivot.y, w: Math.round(2 * R + 24 * u), h: Math.round(bodyY + 44 * u - pivot.y) };
  // its candles: a lower ring of six, an upper ring of three
  const ring = (n: number, r: number, y: number, h: number, s: number, phase: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = phase + (i / n) * Math.PI * 2;
      return { x: cx + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.24, front: Math.sin(a) > 0, h, s };
    });
  const lower = ring(6, R, bodyY + 4 * u, 12 * u, 1.0 * u, 0);
  const upper = ring(3, R * 0.5, bodyY - 18 * u, 10 * u, 0.85 * u, -Math.PI / 2);
  const candles = [...upper, ...lower];
  const propFlames = candles.map((c) => ({ x: c.x, y: c.y - c.h - 9 * c.s, s: c.s }));
  // the newel posts at the foot of the stair, a lamp on each
  const [nlx, nly] = at(cx - stairHalf - 6 * u, floorY, 30);
  const [nrx] = at(cx + stairHalf + 6 * u, floorY, 30);
  const newelH = 40 * u;
  const lamps = [nlx, nrx].map((x) => ({ x, foot: nly, top: nly - newelH }));
  // sconces on the wall over the doors' outer sides
  const sconces = [
    has("left") ? null : sconce(L.doors.left.x + L.doors.left.w / 2, floorY - wallH * 0.48, u),
    has("right") ? null : sconce(L.doors.right.x + L.doors.right.w / 2, floorY - wallH * 0.48, u),
  ].filter((s) => s !== null);
  return {
    has,
    u,
    cx,
    rail,
    arch,
    half,
    rise,
    stairHalf,
    deep,
    pivot,
    bodyY,
    R,
    prop,
    touch: { x: cx, y: bodyY - 4 * u, rx: R * 1.25, ry: 30 * u },
    candles,
    propFlames,
    lamps,
    sconces,
    flames: [...lamps.map((l) => ({ x: l.x, y: l.top - 12 * u, s: 0.9 * u })), ...sconces.map((s) => s.flame)],
    floorY,
  };
}
export type HallPlan = ReturnType<typeof hallPlan>;

// --------------------------------------------------------- the chandelier

/** The chandelier in its own box: the chain from the ceiling rose, a
 *  gilt stem with knops, a lower ring of six curled arms and an upper
 *  ring of three, each with a drip pan and an ivory candle, crystal
 *  drops between, a pendant under it all. */
export function chandelierArt(P: HallPlan) {
  const { prop, u, R, bodyY } = P;
  const ox = -prop.x;
  const oy = -prop.y;
  const cx = P.cx + ox;
  const by = bodyY + oy;
  const out: string[] = [];
  // the chain: links down to the crown
  const chainTop = P.pivot.y + oy;
  const crownY = by - 30 * u;
  const links: string[] = [];
  for (let y = chainTop, i = 0; y < crownY - 4; y += 5 * u, i++) {
    links.push(i % 2 ? `<rect x="${f(cx - 0.8)}" y="${f(y)}" width="1.6" height="${f(5.4 * u)}" rx="0.8" fill="url(#hgv)" stroke="${INK}" stroke-width="0.4"/>` : `<ellipse cx="${f(cx)}" cy="${f(y + 2.7 * u)}" rx="${f(1.8 * u)}" ry="${f(2.8 * u)}" fill="none" stroke="${INK}" stroke-width="1.6"/><ellipse cx="${f(cx)}" cy="${f(y + 2.7 * u)}" rx="${f(1.8 * u)}" ry="${f(2.8 * u)}" fill="none" stroke="#F0CC72" stroke-width="0.8"/>`);
  }
  out.push(links.join(""));
  const arm = (c: HallPlan["candles"][number], fromY: number) => {
    const x = c.x + ox;
    const y = c.y + oy;
    const mx = (cx + x) / 2;
    const d = `M${f(cx)} ${f(fromY)}C${f(mx)} ${f(fromY + 10 * u)} ${f(x)} ${f(y + 8 * u)} ${f(x)} ${f(y)}`;
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(3.4 * u)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#hgh)" stroke-width="${f(1.9 * u)}" stroke-linecap="round"/>`;
  };
  const candle = (c: HallPlan["candles"][number]) => {
    const x = c.x + ox;
    const y = c.y + oy;
    const s = c.s;
    return `<path d="M${f(x - 5 * s)} ${f(y)}H${f(x + 5 * s)}L${f(x + 3 * s)} ${f(y + 2.6 * s)}H${f(x - 3 * s)}Z" fill="url(#hgv)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${f(x - 2.1 * s)}" y="${f(y - c.h)}" width="${f(4.2 * s)}" height="${f(c.h)}" fill="url(#hiv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x - 1.1 * s)} ${f(y - c.h + 1.5)}V${f(y - 2)}" stroke="#fff" stroke-opacity="0.9" stroke-width="0.6"/>
<path d="M${f(x)} ${f(y - c.h)}v-1.6" stroke="#2A1A08" stroke-width="0.7"/>`;
  };
  const drop = (x: number, y: number, s: number) =>
    `<path d="M${f(x)} ${f(y)}l${f(-2 * s)} ${f(4 * s)}l${f(2 * s)} ${f(4 * s)}l${f(2 * s)} ${f(-4 * s)}Z" fill="url(#hcry)" stroke="#5A7090" stroke-width="0.4"/><circle cx="${f(x - 0.5 * s)}" cy="${f(y + 3 * s)}" r="${f(0.7 * s)}" fill="#fff"/>`;
  // the back of the lower ring, then the stem, then the front
  const lowerBack = P.candles.slice(3).filter((c) => !c.front);
  const lowerFront = P.candles.slice(3).filter((c) => c.front);
  const upperAll = P.candles.slice(0, 3);
  out.push(...lowerBack.map((c) => arm(c, by + 2 * u)), ...lowerBack.map(candle));
  // the stem: a crown, knops, the bowl the arms rise from
  out.push(
    `<path d="M${f(cx - 7 * u)} ${f(crownY + 4 * u)}Q${f(cx)} ${f(crownY - 4 * u)} ${f(cx + 7 * u)} ${f(crownY + 4 * u)}Z" fill="url(#hgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<rect x="${f(cx - 2 * u)}" y="${f(crownY + 3 * u)}" width="${f(4 * u)}" height="${f(by - crownY)}" fill="url(#hgh)" stroke="${INK}" stroke-width="0.6"/>`,
    ...[crownY + 12 * u, by - 10 * u].map((y) => `<circle cx="${f(cx)}" cy="${f(y)}" r="${f(4 * u)}" fill="url(#hgd)" stroke="${INK}" stroke-width="0.6"/>`),
  );
  out.push(...upperAll.map((c) => arm(c, by - 14 * u)), ...upperAll.map(candle));
  out.push(
    `<path d="M${f(cx - 16 * u)} ${f(by)}Q${f(cx)} ${f(by - 6 * u)} ${f(cx + 16 * u)} ${f(by)}Q${f(cx + 12 * u)} ${f(by + 13 * u)} ${f(cx)} ${f(by + 16 * u)}Q${f(cx - 12 * u)} ${f(by + 13 * u)} ${f(cx - 16 * u)} ${f(by)}Z" fill="url(#hgv)" stroke="${INK}" stroke-width="0.8"/>`,
    `<path d="M${f(cx - 13 * u)} ${f(by + 2 * u)}Q${f(cx - 10 * u)} ${f(by + 10 * u)} ${f(cx - 2 * u)} ${f(by + 13 * u)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/>`,
    `<path d="M${f(cx - 16 * u)} ${f(by + 1)}H${f(cx + 16 * u)}" stroke="#7A5212" stroke-width="0.6" stroke-dasharray="1.6 1.2"/>`,
  );
  out.push(...lowerFront.map((c) => arm(c, by + 2 * u)), ...lowerFront.map(candle));
  // crystal drops along the ring, the pendant under the bowl
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.sin(a) < -0.2) continue;
    out.push(drop(cx + Math.cos(a) * R * 0.72, by + 6 * u + Math.sin(a) * R * 0.18, u * 0.9));
  }
  out.push(drop(cx, by + 16 * u, u * 1.5), drop(cx, by + 27 * u, u * 1.1));
  return svg(
    prop.w,
    prop.h,
    `<defs>${linear("hgv", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"])}${linear("hgh", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"], false)}${radial("hgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}${linear("hiv", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], false)}${linear("hcry", ["#FFFFFF", "#DCE7F2", "#8EA3BC"], false)}</defs>
${out.join("\n")}`,
  );
}

// --------------------------------------------------------- the staircase

/** The staircase through the arch: the stair hall's walls running back
 *  to its far wall and the tall window there, the landing, the flight
 *  in crimson carpet with gilt stair rods, the balustrades. Clipped to
 *  the arch (its first steps are drawn in front, stairFootArt). */
function stairHallArt(L: FlatLayout, P: HallPlan) {
  const { at, floorY, ceil } = L;
  const { u, cx, half, rise, stairHalf, deep, arch } = P;
  const xl = cx - half;
  const xr = cx + half;
  const zFar = -deep - 40 * u;
  const topY = floorY - STEPS * rise;
  const out: string[] = [];
  const opening = rounded(arch.x0, arch.crown, arch.x1 - arch.x0, floorY - arch.crown);
  out.push(`<defs><clipPath id="hac"><path d="${opening}"/></clipPath></defs><g clip-path="url(#hac)">`);
  // the stair hall: ceiling dark, side walls, far wall with its window
  out.push(`<path d="${opening}" fill="#120E10"/>`);
  for (const x of [xl, xr]) {
    const q = [at(x, ceil - 40, 0), at(x, ceil - 40, zFar), at(x, floorY, zFar), at(x, floorY, 0)];
    out.push(`<path d="${poly(q)}" fill="url(#hsw${x < cx ? "l" : "r"})"/>`);
    // a portrait on each side wall, foreshortened
    const z0 = -deep * 0.35;
    const z1 = -deep * 0.62;
    const fy0 = topY - 70 * u;
    const fy1 = topY - 32 * u;
    const fr = [at(x, fy0, z0), at(x, fy0, z1), at(x, fy1, z1), at(x, fy1, z0)];
    out.push(`<path d="${poly(fr)}" fill="url(#hgf)" stroke="${INK}" stroke-width="0.7"/>`);
    const inset = [at(x, fy0 + 4, z0 - 4), at(x, fy0 + 4, z1 + 4), at(x, fy1 - 4, z1 + 4), at(x, fy1 - 4, z0 - 4)];
    out.push(`<path d="${poly(inset)}" fill="#2A1A20" stroke="${INK}" stroke-width="0.5"/>`);
  }
  const [fx0, fy0] = at(xl, ceil - 40, zFar);
  const [fx1, fy1] = at(xr, floorY, zFar);
  out.push(`<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#hfar)"/>`);
  // the tall window on the far wall, the moon in it
  const k = L.k(zFar);
  const [wcx, wy1] = at(cx, topY - 8 * u, zFar);
  const ww = 34 * u * k;
  const wh = 96 * u * k;
  const wx = wcx - ww / 2;
  const wy = wy1 - wh;
  out.push(
    `<path d="${rounded(wx - 3, wy - 3, ww + 6, wh + 3)}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.7"/>`,
    `<path d="${rounded(wx, wy, ww, wh)}" fill="url(#hsky)"/>`,
    `<circle cx="${f(wx + ww * 0.62)}" cy="${f(wy + ww * 0.8)}" r="${f(ww * 0.5)}" fill="url(#hmg)"/>`,
    `<circle cx="${f(wx + ww * 0.62)}" cy="${f(wy + ww * 0.8)}" r="${f(ww * 0.16)}" fill="#F4F6FF"/>`,
    `<path d="M${f(wcx)} ${f(wy)}V${f(wy + wh)}M${f(wx)} ${f(wy + ww / 2)}H${f(wx + ww)}M${f(wx)} ${f(wy + wh * 0.6)}H${f(wx + ww)}" stroke="#141018" stroke-width="1.4"/>`,
  );
  // the landing at the top of the flight
  const land = [at(xl, topY, -deep), at(xr, topY, -deep), at(xr, topY, zFar), at(xl, topY, zFar)];
  out.push(`<path d="${poly(land)}" fill="url(#hland)"/>`);
  // the flight, far to near: each step's tread then its riser
  const sx0 = cx - stairHalf;
  const sx1 = cx + stairHalf;
  const cw = stairHalf * 0.62;
  const rods: string[] = [];
  for (let i = STEPS - 1; i >= 2; i--) {
    const zf = 28 * u - i * STEP * u;
    const zb = zf - STEP * u;
    const y = floorY - (i + 1) * rise;
    const tread = [at(sx0, y, zb), at(sx1, y, zb), at(sx1, y, zf), at(sx0, y, zf)];
    const riser = [at(sx0, y, zf), at(sx1, y, zf), at(sx1, y + rise, zf), at(sx0, y + rise, zf)];
    const cTread = [at(cx - cw, y, zb), at(cx + cw, y, zb), at(cx + cw, y, zf), at(cx - cw, y, zf)];
    const cRiser = [at(cx - cw, y, zf), at(cx + cw, y, zf), at(cx + cw, y + rise, zf), at(cx - cw, y + rise, zf)];
    out.push(
      `<path d="${poly(tread)}" fill="url(#htread)" stroke="${STONE_INK}" stroke-width="0.5"/>`,
      `<path d="${poly(riser)}" fill="url(#hriser)" stroke="${STONE_INK}" stroke-width="0.5"/>`,
      `<path d="${poly(cTread)}" fill="#A01A2E"/>`,
      `<path d="${poly(cRiser)}" fill="url(#hcarpet)"/>`,
    );
    rods.push(line([at(cx - cw - 1, y + 0.6, zf), at(cx + cw + 1, y + 0.6, zf)]));
  }
  out.push(`<path d="${rods.join("")}" stroke="#E2B04A" stroke-width="1"/>`);
  // the balustrades: a baluster on every step, the handrail over them
  for (const x of [sx0 + 2, sx1 - 2]) {
    const tops: P2[] = [];
    const balusters: string[] = [];
    for (let i = 2; i < STEPS; i++) {
      const z = 28 * u - (i + 0.5) * STEP * u;
      const y = floorY - (i + 1) * rise;
      const [bx, bTop] = at(x, y - 24 * u, z);
      const [, bFoot] = at(x, y, z);
      balusters.push(`M${f(bx)} ${f(bFoot)}V${f(bTop)}`);
      tops.push([bx, bTop]);
    }
    tops.push(at(x, topY - 24 * u, -deep - 4));
    out.push(
      `<path d="${balusters.join("")}" stroke="${WOOD_INK}" stroke-width="2.4"/>`,
      `<path d="${balusters.join("")}" stroke="#F0E8D8" stroke-width="1.2"/>`,
      `<path d="${line(tops)}" fill="none" stroke="${WOOD_INK}" stroke-width="3.6" stroke-linecap="round"/>`,
      `<path d="${line(tops)}" fill="none" stroke="url(#poakh)" stroke-width="2.2" stroke-linecap="round"/>`,
    );
  }
  out.push(`</g>`);
  return out.join("");
}

/** The great arch of pale stone round the staircase: voussoirs, a gilt
 *  keystone, pilasters with capitals either side. */
function archArtHall(L: FlatLayout, P: HallPlan) {
  const { floorY } = L;
  const { arch, u } = P;
  const w = arch.x1 - arch.x0;
  const t = 9 * u;
  const outer = rounded(arch.x0 - t, arch.crown - t, w + 2 * t, floorY - arch.crown + t);
  const inner = rounded(arch.x0, arch.crown, w, floorY - arch.crown);
  const r = w / 2;
  const ccx = arch.x0 + r;
  const ccy = arch.crown + r;
  const joints: string[] = [];
  for (let i = 1; i < 11; i++) {
    const a = Math.PI + (Math.PI * i) / 11;
    joints.push(`M${f(ccx + Math.cos(a) * r)} ${f(ccy + Math.sin(a) * r)}L${f(ccx + Math.cos(a) * (r + t))} ${f(ccy + Math.sin(a) * (r + t))}`);
  }
  const pil = (x: number) =>
    `<rect x="${f(x)}" y="${f(ccy)}" width="${f(t)}" height="${f(floorY - ccy)}" fill="url(#pstoneh)" stroke="#2A2638" stroke-width="0.8"/>
<path d="M${f(x + t * 0.35)} ${f(ccy + 10)}V${f(floorY - 10)}M${f(x + t * 0.68)} ${f(ccy + 10)}V${f(floorY - 10)}" stroke="#2A2638" stroke-opacity="0.6" stroke-width="0.7"/>
<rect x="${f(x - 2)}" y="${f(ccy - 2)}" width="${f(t + 4)}" height="6" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<rect x="${f(x - 2)}" y="${f(floorY - 8)}" width="${f(t + 4)}" height="8" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.7"/>`;
  return `<path d="${outer}" fill="#000" fill-opacity="0.35" transform="translate(2 2.5)"/>
<path d="${outer} ${inner}" fill-rule="evenodd" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.9"/>
<path d="${joints.join("")}" stroke="#2A2638" stroke-width="0.8"/>
${pil(arch.x0 - t)}${pil(arch.x1)}
<path d="M${f(ccx - 6 * u)} ${f(arch.crown - t - 2)}h${f(12 * u)}l-2 ${f(t + 5)}h${f(-12 * u + 4)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(arch.x0 - t + 1.5)} ${f(floorY - 9)}V${f(ccy)}A${f(r + t - 1.5)} ${f(r + t - 1.5)} 0 0 1 ${f(ccx - r * 0.3)} ${f(arch.crown - t + 2)}" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="0.8"/>`;
}

/** The first two steps out in the hall, wider and bullnosed, the
 *  newel posts at their ends with a glass lamp on each. */
function stairFootArt(L: FlatLayout, P: HallPlan) {
  const { at, floorY } = L;
  const { u, cx, rise, stairHalf } = P;
  const out: string[] = [];
  for (let i = 1; i >= 0; i--) {
    const zf = 28 * u - i * STEP * u;
    const zb = zf - STEP * u;
    const y = floorY - (i + 1) * rise;
    const wide = stairHalf + (2 - i) * 4 * u;
    const tread = [at(cx - wide, y, zb), at(cx + wide, y, zb), at(cx + wide, y, zf), at(cx - wide, y, zf)];
    const [rx0, ry0] = at(cx - wide, y, zf);
    const [rx1, ry1] = at(cx + wide, y + rise, zf);
    const cw = stairHalf * 0.62;
    const ct = [at(cx - cw, y, zb), at(cx + cw, y, zb), at(cx + cw, y, zf), at(cx - cw, y, zf)];
    const [cx0] = at(cx - cw, y, zf);
    const [cx1] = at(cx + cw, y, zf);
    out.push(
      `<path d="${poly(tread)}" fill="url(#htread)" stroke="${STONE_INK}" stroke-width="0.6"/>`,
      `<path d="${rrect(rx0, ry0, rx1 - rx0, ry1 - ry0, 3)}" fill="url(#hriser)" stroke="${STONE_INK}" stroke-width="0.6"/>`,
      `<path d="${poly(ct)}" fill="#A01A2E"/>`,
      `<rect x="${f(cx0)}" y="${f(ry0)}" width="${f(cx1 - cx0)}" height="${f(ry1 - ry0)}" fill="url(#hcarpet)"/>`,
      `<path d="M${f(cx0 - 1)} ${f(ry0 + 0.6)}H${f(cx1 + 1)}" stroke="#E2B04A" stroke-width="1.1"/>`,
      `<path d="M${f(rx0 + 2)} ${f(ry0 + 0.8)}H${f(cx0 - 2)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.7"/>`,
    );
  }
  // the newel posts and their lamps
  for (const lamp of P.lamps) {
    const { x, foot, top } = lamp;
    const pw = 9 * u;
    out.push(
      `<path d="M${f(x - pw)} ${f(foot + 1.5)}h${f(pw * 2)}" stroke="#000" stroke-opacity="0.45" stroke-width="4" stroke-linecap="round"/>`,
      `<rect x="${f(x - pw / 2 - 2)}" y="${f(foot - 7)}" width="${f(pw + 4)}" height="7" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
      `<rect x="${f(x - pw / 2)}" y="${f(top + 6)}" width="${f(pw)}" height="${f(foot - 7 - top - 6)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
      `<path d="${rrect(x - pw / 2 + 2, top + 12, pw - 4, foot - top - 26, 1)}" fill="none" stroke="url(#pgv)" stroke-width="0.8"/>`,
      `<rect x="${f(x - pw / 2 - 2)}" y="${f(top + 2)}" width="${f(pw + 4)}" height="5" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
      // the lamp: a gilt stand, a glass globe, a candle in it
      `<path d="M${f(x - 4 * u)} ${f(top + 2)}h${f(8 * u)}l-2 -3h${f(-8 * u + 4)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`,
      `<rect x="${f(x - 1.8 * u)}" y="${f(top - 10 * u)}" width="${f(3.6 * u)}" height="${f(9 * u)}" fill="url(#fciv)" stroke="${INK}" stroke-width="0.5"/>`,
      `<path d="M${f(x - 6 * u)} ${f(top - 2)}C${f(x - 9 * u)} ${f(top - 12 * u)} ${f(x - 5 * u)} ${f(top - 20 * u)} ${f(x - 3 * u)} ${f(top - 22 * u)}H${f(x + 3 * u)}C${f(x + 5 * u)} ${f(top - 20 * u)} ${f(x + 9 * u)} ${f(top - 12 * u)} ${f(x + 6 * u)} ${f(top - 2)}Z" fill="#FFE8B8" fill-opacity="0.2" stroke="#8A6A3A" stroke-opacity="0.8" stroke-width="0.6"/>`,
      `<path d="M${f(x - 5.5 * u)} ${f(top - 6 * u)}Q${f(x - 7 * u)} ${f(top - 13 * u)} ${f(x - 4 * u)} ${f(top - 18 * u)}" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="0.7"/>`,
    );
  }
  return out.join("");
}

/** The whole hall, still: everything but what lives. */
export function hallArt(L: FlatLayout, P: HallPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: warm stone in gilt-moulded panels over a dado
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#hwall)"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#hwarm)"/>`,
  );
  const panel = (x0: number, x1: number, y0: number, y1: number) =>
    `<path d="${rrect(x0, y0, x1 - x0, y1 - y0, 3)}" fill="#000" fill-opacity="0.06" stroke="url(#pgv)" stroke-width="1.2"/><path d="${rrect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6, 2)}" fill="none" stroke="#3A2408" stroke-opacity="0.35" stroke-width="0.6"/>`;
  const ax0 = P.arch.x0 - 9 * P.u;
  const ax1 = P.arch.x1 + 9 * P.u;
  // tall panels between the doors and the arch, over the doors
  const dl = L.doors.left;
  const dr = L.doors.right;
  const topPanel = ceil + 18;
  for (const [x0, x1] of [
    [bx0 + 6, ax0 - 8],
    [ax1 + 8, bx1 - 6],
  ]) {
    if (x1 - x0 > 16) out.push(panel(x0, x1, topPanel, dl.y - 34));
  }
  const panels: string[] = [];
  const pw = 22;
  for (let x = bx0 + 3; x + pw - 3 < bx1; x += pw) {
    if (x + pw > ax0 && x < ax1) continue;
    if (exit("left") && x + pw > dl.x - 6 && x < dl.x + dl.w + 6) continue;
    if (exit("right") && x + pw > dr.x - 6 && x < dr.x + dr.w + 6) continue;
    panels.push(`<path d="${rrect(x + 2, P.rail + 7, pw - 4, floorY - 12 - P.rail - 7, 1.5)}" fill="#24140A" fill-opacity="0.45" stroke="${WOOD_INK}" stroke-width="0.8"/>`);
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(P.rail)}" width="${f(bx1 - bx0)}" height="${f(floorY - P.rail)}" fill="url(#poak)"/>`,
    panels.join(""),
    `<rect x="${f(bx0)}" y="${f(P.rail - 2)}" width="${f(bx1 - bx0)}" height="4.4" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 8)}" width="${f(bx1 - bx0)}" height="8" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  );
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(sideWallArt(L, A.wall, WALL, e ? { box: A, door: e.door, color: e.color } : null, P.rail));
  }
  out.push(ceilingArt(L));
  // a ceiling rose over the chandelier's chain
  out.push(
    `<circle cx="${f(P.cx)}" cy="${f(P.pivot.y)}" r="${f(7 * P.u)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<circle cx="${f(P.cx)}" cy="${f(P.pivot.y)}" r="${f(3 * P.u)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
  );
  out.push(chequerFloor(L, FLOOR_LIGHT, FLOOR_DARK, 13, "hchq"));
  out.push(runnerArt(L, P.cx - P.stairHalf * 0.62 - 6, P.cx + P.stairHalf * 0.62 + 6, 28 * P.u, L.zFront + 10, CARPET, "#2A0A10", "hrun"));
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
  out.push(...P.sconces.map((s) => s.markup));
  out.push(stairHallArt(L, P), archArtHall(L, P), stairFootArt(L, P));
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
${lit("hwall", WALL, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("hwarm", [LIGHT, LIGHT], [0.3, 0], 0.5, 0.15, 0.6)}
${lit("hswl", ["#4A3A30", "#2A2020", "#120E10"], P.arch.x0, 0, P.cx, 0)}
${lit("hswr", ["#120E10", "#2A2020", "#4A3A30"], P.cx, 0, P.arch.x1, 0)}
${linear("hfar", ["#2A2226", "#3A2E2E", "#241C1E"])}
${linear("hsky", ["#0C1634", "#1A2A5A", "#2E4684"])}
${radial("hmg", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.85, 0.3, 0])}
${linear("hland", ["#4A3A34", "#6A5446"])}
${linear("htread", ["#C8BCA8", "#E4DACA"])}
${linear("hriser", ["#9A8E7A", "#7A6E5C"])}
${linear("hcarpet", ["#B01E30", "#7A1020"])}
${linear("hgf", ["#FFF2B8", "#E2B04A", "#9A6B1E"])}
</defs>
${out.join("\n")}`,
  );
}

/** The chandelier's glow on the walls round it, breathing with its
 *  flames. */
function hallUnder(fx: FlatFrame, P: HallPlan) {
  "worklet";
  const r = P.R * 3.2;
  fx.screen[0].setAlphaf(0.32 + 0.05 * Math.sin(fx.time * 3.1) + 0.03 * Math.sin(fx.time * 7.3));
  fx.draw(fx.img.glow, P.cx - r, P.bodyY - r * 0.7, r * 2, r * 1.6, fx.screen[0]);
}

export const hall = flatRoom({
  id: "hall",
  light: LIGHT,
  plan: hallPlan,
  art: hallArt,
  propArt: chandelierArt,
  motion: (P) => ({ kind: "swing", x: P.pivot.x, y: P.pivot.y, degrees: 5, ring: true }),
  payoff: {
    burst: { kind: "glow", size: 80, color: "#FFB45E", duration: 900 },
    haptic: "tick",
    at: (P) => [P.cx, P.bodyY],
  },
  images: () => ({
    glow: {
      w: 120,
      h: 120,
      key: "",
      art: () => svg(120, 120, `<defs>${radial("g", [LIGHT, LIGHT, LIGHT], [0.7, 0.25, 0])}</defs><rect width="120" height="120" fill="url(#g)"/>`),
    },
  }),
  under: hallUnder,
});

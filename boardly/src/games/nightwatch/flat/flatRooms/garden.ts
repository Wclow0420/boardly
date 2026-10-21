// Seal the Manor's garden, seen flat on (the iso one is rooms/garden.ts):
// a walled garden under the moon. The sky in place of a ceiling, stars and
// the moon in it, the dark roofs of the manor and its trees over the far
// wall; clipped yew hedges for side walls, flowers at their feet; a brick
// garden wall at the back with two iron gates between stone piers (the
// ways to the kitchen and the dining room; a gate stands open, is chained
// shut or is boarded and grown over with ivy); a gravel court on the lawn
// and in it the old well under its shingled roof, its winch and its
// bucket — the thing that works the room: touched, the winch turns and
// the bucket comes up, rings spreading on the water. An iron lamp post,
// fireflies over the grass. As SVG markup, baked once (FlatRoom); the
// bucket, the rope and the winch, the lamp, the stars and the fireflies
// live.

import { Skia } from "@shopify/react-native-skia";

import { linear, radial } from "@/components/engraved/panel";
import { MATERIALS } from "@/components/engraved/shapes";
import type { Side } from "../../roomScenes";
import { manorMapArt, notebookArt, notebookOn } from "../keepsakes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  WOOD_INK,
  f,
  partDefs,
  plateBox,
  poly,
  rnd,
  spillArt,
  svg,
  type P2,
} from "../parts";
import {
  disc,
  face,
  flameAt,
  floorShadow,
  gateArt,
  hedgeSideWall,
  metalDefs,
  oval,
  partBDefs,
  stroke,
  type Flame,
} from "./partsB";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const LAWN = ["#3A6048", "#2C4A3A", "#1A3024"];
const BRICK = ["#7A4A3A", "#6A3E30", "#845444", "#5E3628"];
const LIGHT = "#FFD27A";

/** Where the garden's pieces stand, for a layout. */
export function gardenPlan(L: FlatLayout, _exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, vx, at, k } = L;
  const W = bx1 - bx0;
  const wallTop = Math.round(floorY - wallH * 0.4);
  const hedgeTop = Math.round(floorY - wallH * 0.56);
  // the well in the middle of the court
  const well = { x: vx, z: 62, r: W * 0.1, rim: floorY - wallH * 0.14, post: floorY - wallH * 0.58 };
  const ws = k(well.z);
  const [, axleY] = at(vx, well.post + 16, well.z);
  const [ax0] = at(vx - well.r - 2, 0, well.z);
  const [ax1] = at(vx + well.r + 2, 0, well.z);
  const bw = Math.round(well.r * 0.62 * ws);
  const bh = Math.round(bw * 0.86);
  const [, rimY] = at(vx, well.rim, well.z);
  const bucketFoot = rimY - 6 * ws;
  const prop = { x: vx - bw / 2 - 4, y: Math.round(bucketFoot - bh - 9), w: bw + 8, h: bh + 9 };
  // the lamp post between the kitchen's gate and the well
  const lz = 18;
  const [lx, lfoot] = at(vx - W * 0.235, floorY, lz);
  const ls = k(lz);
  const lampH = wallH * 0.5 * ls;
  const flames: Flame[] = [flameAt(lx, lfoot - lampH - 6 * ls, ls * 1.05)];
  // the sky: the moon, stars, some of them twinkling
  const moon = { x: vx + W * 0.24, y: ceil + wallH * 0.05, r: Math.max(11, W * 0.05) };
  const stars = Array.from({ length: 34 }, (_, i) => ({
    x: rnd(i * 3 + 1) * L.w,
    y: rnd(i * 7 + 2) * (wallTop - 60),
    r: 0.4 + rnd(i * 5) * 0.7,
  })).filter((s) => Math.hypot(s.x - moon.x, s.y - moon.y) > moon.r * 2.6);
  const flies = Array.from({ length: 7 }, (_, i) => {
    const z = 30 + rnd(i * 11 + 4) * 150;
    const x = bx0 + 10 + rnd(i * 13 + 5) * (W - 20);
    const [sx, sy] = at(x, floorY - 18 - rnd(i * 17) * 40, z);
    return { x: sx, y: sy, s: k(z) };
  });
  // the manor's map on a weathered board on an oak post between the well
  // and the dining room's gate, under a little shingled roof; the
  // notebook left on the board's ledge
  const u = Math.min(1.25, Math.max(0.85, W / 290));
  const bz = 20;
  const bk = k(bz);
  const [wellPost] = at(vx + well.r + 1, 0, well.z);
  const gate = L.doors.right.x - 7;
  const mapW = Math.round(Math.min(30 * u, gate - wellPost - 6));
  const mapH = Math.round(mapW * 0.8);
  const bcx = (wellPost + gate) / 2 + 1;
  const [, bfoot] = at(vx, floorY, bz);
  const bBottom = Math.round(bfoot - wallH * 0.36 * bk);
  const map = { x: Math.round(bcx - mapW / 2), y: bBottom - mapH, w: mapW, h: mapH };
  const shelfY = bBottom + Math.round(16 * u);
  const notebook = notebookOn(bcx, shelfY, Math.min(22 * u, mapW * 0.8));
  return {
    map,
    mapTap: { x: map.x - 7, y: map.y - Math.round(11 * u), w: map.w + 14, h: map.h + Math.round(11 * u) + 2 },
    notebook,
    noteTap: { x: notebook.x - 8, y: bBottom + 2, w: notebook.w + 16, h: shelfY + 8 - (bBottom + 2) },
    board: { x: bcx, foot: bfoot, bottom: bBottom, w: mapW, h: mapH, shelf: shelfY, u },
    wallTop,
    hedgeTop,
    well,
    ws,
    axle: { y: axleY, x0: ax0, x1: ax1 },
    bucket: { w: bw, h: bh, foot: bucketFoot },
    rimY,
    prop,
    touch: { x: vx, y: bucketFoot - bh * 0.5, rx: bw * 1.5, ry: bh * 1.4 },
    lamp: { x: lx, foot: lfoot, s: ls, h: lampH },
    flames,
    moon,
    stars: stars.slice(0, 26),
    flies,
  };
}
export type GardenPlan = ReturnType<typeof gardenPlan>;

/** The night over the garden: the sky, the moon in its halo, the stars,
 *  a wisp of cloud, the manor's dark roofs and chimneys and the trees
 *  over the far wall. */
function skyArt(L: FlatLayout, P: GardenPlan) {
  const { w } = L;
  const { moon } = P;
  const out: string[] = [
    `<rect width="${w}" height="${f(P.wallTop + 2)}" fill="url(#gsky)"/>`,
    `<circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r * 4)}" fill="url(#ghalo)"/>`,
  ];
  out.push(
    ...P.stars.map((s, i) =>
      i % 5 === 0
        ? `<path d="M${f(s.x)} ${f(s.y - s.r * 3)}Q${f(s.x)} ${f(s.y)} ${f(s.x + s.r * 3)} ${f(s.y)}Q${f(s.x)} ${f(s.y)} ${f(s.x)} ${f(s.y + s.r * 3)}Q${f(s.x)} ${f(s.y)} ${f(s.x - s.r * 3)} ${f(s.y)}Q${f(s.x)} ${f(s.y)} ${f(s.x)} ${f(s.y - s.r * 3)}Z" fill="#DCE6FF"/>`
        : `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.r)}" fill="#fff" fill-opacity="${f(0.5 + rnd(i) * 0.5)}"/>`,
    ),
  );
  // the moon: pale, a few seas on it, a line of shine
  out.push(
    `<circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r)}" fill="url(#gmoon)" stroke="#7A86A8" stroke-width="0.7"/>`,
    ...[
      [0.3, -0.2, 0.26],
      [-0.35, 0.25, 0.2],
      [0.15, 0.45, 0.14],
      [-0.2, -0.45, 0.12],
    ].map(
      ([dx, dy, r]) =>
        `<circle cx="${f(moon.x + dx * moon.r)}" cy="${f(moon.y + dy * moon.r)}" r="${f(r * moon.r)}" fill="#B8C0D4" fill-opacity="0.6"/>`,
    ),
    `<path d="M${f(moon.x - moon.r * 0.75)} ${f(moon.y - moon.r * 0.35)}A${f(moon.r * 0.85)} ${f(moon.r * 0.85)} 0 0 1 ${f(moon.x - moon.r * 0.2)} ${f(moon.y - moon.r * 0.8)}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`,
    `<path d="M${f(moon.x - moon.r * 3.4)} ${f(moon.y + moon.r * 1.1)}q${f(moon.r * 1.4)} -5 ${f(moon.r * 2.8)} -1q${f(moon.r * 1.6)} 4 ${f(moon.r * 3.6)} -2" fill="none" stroke="#6A88C4" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>`,
  );
  // the manor beyond the wall: a long roof, a gable, chimneys, two lit windows
  const base = P.wallTop + 2;
  const m0 = L.bx1 - (L.bx1 - L.bx0) * 0.46;
  const m1 = w + 10;
  const ridge = base - L.wallH * 0.3;
  const gx = m0 + (m1 - m0) * 0.25;
  const house = `M${f(m0)} ${f(base)}V${f(ridge + 16)}L${f(m0 + 14)} ${f(ridge)}H${f(gx - 16)}L${f(gx)} ${f(ridge - 22)}L${f(gx + 16)} ${f(ridge)}H${f(m1)}V${f(base)}Z`;
  const chimneys = [m0 + 28, gx + 40, gx + 78]
    .map((cx) => `M${f(cx)} ${f(ridge + 1)}v-16h8v16Z`)
    .join("");
  out.push(
    `<path d="${house}${chimneys}" fill="#141C30" stroke="#0A0E1A" stroke-width="0.8"/>`,
    `<path d="M${f(m0 + 14)} ${f(ridge)}H${f(gx - 16)}L${f(gx)} ${f(ridge - 22)}L${f(gx + 16)} ${f(ridge)}H${f(m1)}" fill="none" stroke="#5A6A9A" stroke-opacity="0.5" stroke-width="0.9"/>`,
    `<rect x="${f(gx - 4)}" y="${f(ridge - 6)}" width="8" height="10" rx="4" fill="#FFC86A" fill-opacity="0.85"/>`,
    `<rect x="${f(gx + 34)}" y="${f(ridge + 10)}" width="7" height="9" fill="#FFC86A" fill-opacity="0.6"/>`,
  );
  // the trees over the left of the wall: round dark crowns, an apple tree
  // nearer with fruit catching the moon
  const crowns: string[] = [];
  for (let i = 0; i < 9; i++) {
    const cx = -10 + i * ((L.w * 0.55) / 8);
    const cr = 16 + rnd(i * 3) * 12;
    crowns.push(`M${f(cx - cr)} ${f(base)}a${f(cr)} ${f(cr * 1.1)} 0 0 1 ${f(cr * 2)} 0Z`);
  }
  out.push(`<path d="${crowns.join("")}" fill="#0E1C1A" stroke="#06100E" stroke-width="0.8"/>`);
  const tx = L.vx - (L.bx1 - L.bx0) * 0.2;
  const leaves: string[] = [];
  const lit: string[] = [];
  for (let i = 0; i < 70; i++) {
    const a = rnd(i * 7 + 1) * Math.PI;
    const rr = Math.sqrt(rnd(i * 11 + 2)) * 34;
    const lx = tx + Math.cos(a) * rr * 1.4;
    const ly = base - 26 - Math.sin(a) * rr * 0.8;
    const d = `M${f(lx)} ${f(ly - 3.4)}c3 0 3 6 0 6.8c-3 -0.8 -3 -6.8 0 -6.8Z`;
    if (rnd(i * 13) > 0.65) lit.push(d);
    else leaves.push(d);
  }
  out.push(
    `<path d="M${f(tx - 3)} ${f(base)}C${f(tx - 2)} ${f(base - 14)} ${f(tx - 10)} ${f(base - 22)} ${f(tx - 18)} ${f(base - 30)}M${f(tx + 2)} ${f(base)}C${f(tx + 4)} ${f(base - 14)} ${f(tx + 14)} ${f(base - 24)} ${f(tx + 24)} ${f(base - 28)}" fill="none" stroke="#1A120A" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M${f(tx)} ${f(base - 26)}m-50 0a50 30 0 0 1 100 0Z" fill="#1E3A2A" stroke="#0A1A10" stroke-width="0.8"/>`,
    `<path d="${leaves.join("")}" fill="#2A4E36"/>`,
    `<path d="${lit.join("")}" fill="#5A8A64" fill-opacity="0.75"/>`,
    ...Array.from({ length: 9 }, (_, i) => {
      const ax = tx - 40 + rnd(i * 19 + 3) * 80;
      const ay = base - 30 + rnd(i * 23 + 1) * 22;
      return `<circle cx="${f(ax)}" cy="${f(ay)}" r="2" fill="#C2453F" stroke="#3A0408" stroke-width="0.5"/>`;
    }),
  );
  return out.join("");
}

/** The brick wall across the back, its stone coping, ivy on it. */
function backWallArt(L: FlatLayout, P: GardenPlan) {
  const { bx0, bx1, floorY } = L;
  const y0 = P.wallTop;
  const out: string[] = [
    `<rect x="${f(bx0)}" y="${f(y0)}" width="${f(bx1 - bx0)}" height="${f(floorY - y0)}" fill="${BRICK[1]}"/>`,
  ];
  const bricks: string[] = [];
  for (let r = 0, y = floorY; y > y0 + 0.1; r++, y -= 6) {
    for (let x = bx0 - (r % 2 ? 6 : 0); x < bx1; x += 12) {
      const a = Math.max(bx0, x);
      const b = Math.min(bx1, x + 12);
      bricks.push(
        `<rect x="${f(a + 0.4)}" y="${f(y - 5.6)}" width="${f(b - a - 0.8)}" height="5.2" fill="${BRICK[Math.floor(rnd(r * 7 + x) * BRICK.length)]}"/>`,
      );
    }
  }
  out.push(bricks.join(""));
  out.push(
    `<rect x="${f(bx0)}" y="${f(y0)}" width="${f(bx1 - bx0)}" height="${f(floorY - y0)}" fill="url(#gwsh)"/>`,
    `<rect x="${f(bx0 - 2)}" y="${f(y0 - 5)}" width="${f(bx1 - bx0 + 4)}" height="6" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>`,
    `<path d="M${f(bx0)} ${f(y0 - 4)}H${f(bx1)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>`,
  );
  // ivy climbing it
  const ivy: string[] = [];
  const vines: string[] = [];
  for (const [vx0, len] of [
    [bx0 + 40, 0.9],
    [L.vx + 46, 0.7],
    [bx1 - 70, 0.55],
  ]) {
    let x = vx0;
    let y = floorY;
    const pts: P2[] = [[x, y]];
    for (let i = 0; i < 12; i++) {
      x += Math.sin(i * 1.7 + vx0) * 5;
      y -= ((floorY - y0) * len) / 12;
      pts.push([x, y]);
      for (const s of [-1, 1]) {
        if (rnd(i * 5 + vx0 + s) > 0.35) {
          const lx = x + s * 4;
          ivy.push(`M${f(lx)} ${f(y)}c${f(s * 2.4)} -2 ${f(s * 3.6)} 1 ${f(s * 1.6)} 3.4c-1 -0.4 -2 -1.2 ${f(-s * 1.6)} -3.4Z`);
        }
      }
    }
    vines.push(`M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}`);
  }
  out.push(
    `<path d="${vines.join("")}" fill="none" stroke="#1A2A14" stroke-width="1.2"/>`,
    `<path d="${ivy.join("")}" fill="#3E6A3A" stroke="#14300A" stroke-width="0.5"/>`,
  );
  return out.join("");
}

/** The lawn, darker towards you, tufts of grass, the gravel court round
 *  the well and the paths in to it from the gates. */
function groundArt(L: FlatLayout, P: GardenPlan, exits: FlatExit[]) {
  const { w, h, floorY, at, vx } = L;
  const out: string[] = [`<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#glawn)"/>`];
  const { well } = P;
  const gravel = "url(#ggravel)";
  for (const e of exits) {
    if (e.side !== "left" && e.side !== "right") continue;
    const D = L.doors[e.side];
    const toward = e.side === "left" ? -1 : 1;
    out.push(
      `<path d="${face(L, [
        [D.x + 2, floorY, 0],
        [D.x + D.w - 2, floorY, 0],
        [vx + toward * well.r * (toward < 0 ? 0.4 : 1.8), floorY, well.z - well.r * 0.8],
        [vx + toward * well.r * (toward < 0 ? 1.8 : 0.4), floorY, well.z - well.r * 0.8],
      ])}" fill="${gravel}" stroke="#4A4A42" stroke-width="0.6"/>`,
    );
  }
  // the path on towards you, and the court
  out.push(
    `<path d="${face(L, [
      [vx - well.r * 1.3, floorY, well.z],
      [vx + well.r * 1.3, floorY, well.z],
      [vx + well.r * 1.7, floorY, L.zFront + 30],
      [vx - well.r * 1.7, floorY, L.zFront + 30],
    ])}" fill="${gravel}" stroke="#4A4A42" stroke-width="0.6"/>`,
    `<path d="${disc(L, vx, floorY, well.z, well.r * 2.1, well.r * 1.7)}" fill="${gravel}" stroke="#5A5A50" stroke-width="0.8"/>`,
    `<path d="${disc(L, vx, floorY, well.z, well.r * 2.1, well.r * 1.7)}" fill="none" stroke="url(#pstone)" stroke-width="2.2"/>`,
  );
  // pebbles on the gravel, tufts in the grass
  const pebbles: string[] = [];
  for (let i = 0; i < 90; i++) {
    const a = rnd(i * 3 + 9) * Math.PI * 2;
    const rr = Math.sqrt(rnd(i * 5 + 1)) * well.r * 2;
    const [px, py] = at(vx + Math.cos(a) * rr, floorY, well.z + Math.sin(a) * rr * 0.8);
    pebbles.push(`M${f(px)} ${f(py)}h0.01`);
  }
  out.push(`<path d="${pebbles.join("")}" stroke="#2A2A26" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="round"/>`);
  const dark: string[] = [];
  const light: string[] = [];
  for (let i = 0; i < 150; i++) {
    const x = L.bx0 - 80 + rnd(i * 3 + 7) * (L.bx1 - L.bx0 + 160);
    const z = rnd(i * 5 + 11) ** 0.8 * L.zFront;
    if (Math.abs(x - vx) < well.r * 2.2 && Math.abs(z - well.z) < well.r * 1.8) continue;
    const [sx, sy] = at(x, floorY, z);
    const s = 1.1 * L.k(z);
    const blade = `M${f(sx - s)} ${f(sy)}l${f(s * 0.5)} ${f(-s * 1.6)}M${f(sx)} ${f(sy)}v${f(-s * 2)}M${f(sx + s)} ${f(sy)}l${f(-s * 0.4)} ${f(-s * 1.5)}`;
    if (i % 3) dark.push(blade);
    else light.push(blade);
  }
  out.push(
    `<path d="${dark.join("")}" stroke="#14281C" stroke-width="0.7" stroke-opacity="0.9"/>`,
    `<path d="${light.join("")}" stroke="#6A9A72" stroke-width="0.6" stroke-opacity="0.7"/>`,
  );
  return out.join("");
}

/** Flowers along the foot of a hedge: white, pink and gold heads on the
 *  dark leaves. */
function bedArt(L: FlatLayout, wall: "left" | "right") {
  const wx = wall === "left" ? L.bx0 + 5 : L.bx1 - 5;
  const cols = ["#F4EEDF", "#E8A0B8", "#F0CC72", "#B8A0E8"];
  const out: string[] = [];
  for (let z = 4; z < L.zEdge * 1.1; z += 7) {
    const i = Math.round(z);
    const [x, y] = L.at(wx, L.floorY - 3 - rnd(i) * 6, z);
    const s = L.k(z);
    out.push(
      `<circle cx="${f(x)}" cy="${f(y + 2 * s)}" r="${f(3.4 * s)}" fill="#1E3A26"/>`,
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.5 * s)}" fill="${cols[i % cols.length]}" stroke="#2A2010" stroke-width="0.3"/>`,
    );
  }
  return out.join("");
}

/** The lamp post: a fluted iron column on a stepped base, the lantern on
 *  top (its flame lives). */
function lampArt(P: GardenPlan) {
  const { x, foot, s, h } = P.lamp;
  const top = foot - h;
  const lw = 9 * s;
  const lh = 13 * s;
  return `<path d="${oval(x, foot, 7 * s, 2 * s)}" fill="#000" fill-opacity="0.45"/>
<path d="M${f(x - 4.5 * s)} ${f(foot)}h${f(9 * s)}l${f(-1.5 * s)} ${f(-6 * s)}h${f(-6 * s)}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>
<rect x="${f(x - 1.4 * s)}" y="${f(top)}" width="${f(2.8 * s)}" height="${f(h - 6 * s)}" fill="url(#pironh)" stroke="#0E1014" stroke-width="0.6"/>
<path d="M${f(x - 5 * s)} ${f(top + 6 * s)}c2 -3 3 -5 5 -5s3 2 5 5" fill="none" stroke="#0E1014" stroke-width="1.2"/>
<path d="M${f(x - lw / 2 - 1.5 * s)} ${f(top - lh)}L${f(x)} ${f(top - lh - 5 * s)}L${f(x + lw / 2 + 1.5 * s)} ${f(top - lh)}Z" fill="url(#piron)" stroke="#0E1014" stroke-width="0.7"/>
<rect x="${f(x - lw / 2)}" y="${f(top - lh)}" width="${f(lw)}" height="${f(lh)}" fill="#FFD27A" fill-opacity="0.3" stroke="#0E1014" stroke-width="0.9"/>
<path d="M${f(x - lw / 2)} ${f(top - lh)}V${f(top)}M${f(x + lw / 2)} ${f(top - lh)}V${f(top)}" stroke="url(#pironh)" stroke-width="1.4"/>
<path d="M${f(x - lw / 2 - 1)} ${f(top)}h${f(lw + 2)}" stroke="#0E1014" stroke-width="1.8"/>
<circle cx="${f(x)}" cy="${f(top - lh - 5.5 * s)}" r="${f(1.3 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.4"/>`;
}

/** The map's board: an oak post, a weathered backboard (the map is drawn
 *  on it live), a little shingled roof, the ledge under it on two
 *  brackets. */
function boardArt(P: GardenPlan) {
  const { x, foot, bottom, w, h, shelf, u } = P.board;
  const top = bottom - h;
  const pw = 3.6 * u;
  const roofW = w / 2 + 5 * u;
  const lw = w / 2 + 2;
  return `<path d="${oval(x, foot, 8 * u, 2.2 * u)}" fill="#000" fill-opacity="0.45"/>
<rect x="${f(x - pw / 2)}" y="${f(top - 3)}" width="${f(pw)}" height="${f(foot - top + 2)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.7"/>
<path d="M${f(x - pw / 2 + 0.8)} ${f(shelf + 6)}V${f(foot - 2)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.6"/>
<rect x="${f(x - w / 2 - 2)}" y="${f(top - 2)}" width="${f(w + 4)}" height="${f(h + 4)}" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(x - roofW)} ${f(top - 2)}L${f(x)} ${f(top - 10 * u)}L${f(x + roofW)} ${f(top - 2)}Z" fill="url(#gshingle)" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(x - roofW * 0.66)} ${f(top - 4.6 * u)}H${f(x + roofW * 0.66)}M${f(x - roofW * 0.33)} ${f(top - 7.3 * u)}H${f(x + roofW * 0.33)}" stroke="${WOOD_INK}" stroke-opacity="0.6" stroke-width="0.6"/>
<path d="M${f(x - roofW + 1)} ${f(top - 2.6)}L${f(x)} ${f(top - 9.4 * u)}" stroke="#F0B890" stroke-opacity="0.45" stroke-width="0.7"/>
<path d="M${f(x - lw + 3)} ${f(shelf + 1)}L${f(x - pw / 2)} ${f(shelf + 7)}M${f(x + lw - 3)} ${f(shelf + 1)}L${f(x + pw / 2)} ${f(shelf + 7)}" stroke="${WOOD_INK}" stroke-width="1.6"/>
<rect x="${f(x - lw)}" y="${f(shelf)}" width="${f(lw * 2)}" height="2.6" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.6"/>`;
}

/** The well: a ring of dressed stone round the dark water, two oak posts,
 *  the winch between them, the shingled roof over it. */
function wellArt(L: FlatLayout, P: GardenPlan) {
  const { at, floorY, vx } = L;
  const { well } = P;
  const { r, z, rim, post } = well;
  const out: string[] = [];
  const half = (y: number, rr: number, from: number, to: number) =>
    Array.from({ length: 17 }, (_, i) => {
      const a = from + ((to - from) * i) / 16;
      return at(vx + Math.cos(a) * rr, y, z + Math.sin(a) * rr) as P2;
    });
  out.push(floorShadow(L, vx - r * 1.3, vx + r * 1.5, z - r, z + r * 1.4, 0.45));
  // the far half of the rim's top, the mouth, the water in it
  out.push(
    `<path d="${disc(L, vx, rim, z, r)}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>`,
    `<path d="${disc(L, vx, rim, z, r * 0.76)}" fill="#05080E" stroke="#1A1E28" stroke-width="0.8"/>`,
    `<path d="${disc(L, vx, rim + 10, z, r * 0.62)}" fill="url(#gwater)"/>`,
  );
  // the posts behind the mouth
  const p0 = vx - r - 1;
  const p1 = vx + r + 1;
  const postArt = (x: number) => {
    const [a, ay] = at(x - 2.4, post - 4, z);
    const [b, by] = at(x + 2.4, rim, z);
    return `<rect x="${f(a)}" y="${f(ay)}" width="${f(b - a)}" height="${f(by - ay)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.8"/><path d="M${f(a + 1)} ${f(by)}V${f(ay + 1)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.7"/>`;
  };
  out.push(postArt(p0), postArt(p1));
  // the winch: an axle with a drum of rope, the crank on the right
  const { axle } = P;
  const dr = 4.6 * P.ws;
  out.push(
    `<rect x="${f(axle.x0)}" y="${f(axle.y - 1.4)}" width="${f(axle.x1 - axle.x0)}" height="2.8" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.6"/>`,
    `<rect x="${f(vx - r * 0.5 * P.ws)}" y="${f(axle.y - dr)}" width="${f(r * P.ws)}" height="${f(dr * 2)}" rx="${f(dr * 0.5)}" fill="url(#gdrum)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
    `<path d="${Array.from({ length: 8 }, (_, i) => `M${f(vx - r * 0.45 * P.ws + i * ((r * 0.9 * P.ws) / 7))} ${f(axle.y - dr + 0.6)}l1.6 ${f(dr * 2 - 1.2)}`).join("")}" stroke="#8A7A5A" stroke-width="0.6"/>`,
  );
  // the body of the well, its front half: stone courses
  const top = half(rim, r, 0, Math.PI);
  const bottom = half(floorY, r, Math.PI, 0);
  const body = [...top, ...bottom];
  const courses: string[] = [];
  for (let k = 1; k < 4; k++) {
    const y = rim + ((floorY - rim) * k) / 4;
    courses.push(`M${half(y, r, 0, Math.PI).map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}`);
  }
  const joints: string[] = [];
  for (let k = 0; k < 4; k++) {
    const y0 = rim + ((floorY - rim) * k) / 4;
    const y1 = rim + ((floorY - rim) * (k + 1)) / 4;
    for (let j = 1; j < 6; j++) {
      const a = (Math.PI * (j + (k % 2) * 0.5)) / 6;
      joints.push(stroke(L, [[vx + Math.cos(a) * r, y0, z + Math.sin(a) * r], [vx + Math.cos(a) * r, y1, z + Math.sin(a) * r]]));
    }
  }
  out.push(
    `<path d="${poly(body)}" fill="url(#gstone)" stroke="#1E1A28" stroke-width="0.9"/>`,
    `<path d="${courses.join("")}${joints.join("")}" fill="none" stroke="#1E1A28" stroke-opacity="0.6" stroke-width="0.7"/>`,
    `<path d="${poly([...half(rim, r, 0, Math.PI), ...half(rim, r * 0.76, Math.PI, 0)])}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>`,
    `<path d="M${half(rim, r, Math.PI * 0.55, Math.PI * 0.95).map((p) => `${f(p[0])} ${f(p[1] - 0.8)}`).join("L")}" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="0.8"/>`,
  );
  // moss at its foot
  const moss = half(floorY, r * 1.02, 0.2, Math.PI - 0.2)
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => `M${f(p[0] - 3)} ${f(p[1])}c1 -${f(2 + rnd(i) * 3)} 4 -${f(2 + rnd(i * 3) * 3)} 6 0Z`);
  out.push(`<path d="${moss.join("")}" fill="#3E6A3A"/>`);
  // the roof: a gable of shingles on the posts, its ridge running back
  const [gx0, gy] = at(vx - r - 10, post, z + r * 0.4);
  const [gx1] = at(vx + r + 10, post, z + r * 0.4);
  const apex = gy - r * 0.95 * P.ws;
  const gcx = (gx0 + gx1) / 2;
  const gable = `M${f(gx0)} ${f(gy)}L${f(gcx)} ${f(apex)}L${f(gx1)} ${f(gy)}Z`;
  const rows: string[] = [];
  for (let k = 1; k < 5; k++) {
    const t = k / 5;
    const y = apex + (gy - apex) * t;
    const half2 = ((gx1 - gx0) / 2) * t;
    for (let x = gcx - half2; x < gcx + half2 - 2; x += 5) rows.push(`M${f(x)} ${f(y)}q2.5 2.6 5 0`);
  }
  out.push(
    `<path d="${gable}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>`,
    `<path d="${gable}" fill="url(#gshingle)" stroke="#1A0E08" stroke-width="0.9"/>`,
    `<path d="${rows.join("")}" fill="none" stroke="#1A0E08" stroke-opacity="0.7" stroke-width="0.7"/>`,
    `<path d="M${f(gx0 - 3)} ${f(gy + 2)}L${f(gcx)} ${f(apex - 3)}L${f(gx1 + 3)} ${f(gy + 2)}" fill="none" stroke="${WOOD_INK}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M${f(gx0 - 3)} ${f(gy + 2)}L${f(gcx)} ${f(apex - 3)}L${f(gx1 + 3)} ${f(gy + 2)}" fill="none" stroke="url(#poakh)" stroke-width="2.4" stroke-linejoin="round"/>`,
    `<circle cx="${f(gcx)}" cy="${f(apex - 5)}" r="2.2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
    `<path d="M${f(gx0 - 2)} ${f(gy + 1)}L${f(gcx)} ${f(apex - 2)}" stroke="#F0D0A8" stroke-opacity="0.5" stroke-width="0.7"/>`,
  );
  return out.join("");
}

/** The whole garden, still: everything but what lives. */
export function gardenArt(L: FlatLayout, P: GardenPlan, exits: FlatExit[]) {
  const { w, h } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [skyArt(L, P), backWallArt(L, P)];
  out.push(groundArt(L, P, exits));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    out.push(spillArt(x, y + 8, 34, 11, e.color, `spill${e.side}`));
  }
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(gateArt(L.doors[side], e.door, e.color, `gt${side[0]}`, L.floorY));
  }
  out.push(hedgeSideWall(L, "left", P.hedgeTop), hedgeSideWall(L, "right", P.hedgeTop));
  out.push(bedArt(L, "left"), bedArt(L, "right"));
  out.push(lampArt(P), wellArt(L, P), boardArt(P));
  for (const e of exits) {
    const p = exitPlate(L, e.side);
    out.push(plateBox(p.x, p.y, p.w, p.h, `pl${e.side}`));
  }
  out.push(
    `<rect y="${f(L.floorY)}" width="${L.w}" height="${f(L.h - L.floorY)}" fill="url(#pvig)"/>`,
  );
  return svg(
    w,
    h,
    `<defs>
${partDefs(L)}
${partBDefs()}
${linear("gsky", ["#060C20", "#0E1A3E", "#1E3264"])}
${radial("ghalo", ["#C8DCFF", "#9AB8E8", "#9AB8E8"], [0.4, 0.12, 0])}
${radial("gmoon", ["#FFFDF2", "#E4E0D0", "#A9B4CC"], undefined, 0.38, 0.32, 0.8)}
${linear("gwsh", ["#000000", "#000000"], true, [0.15, 0.5])}
${linear("glawn", LAWN)}
${linear("ggravel", ["#8A887A", "#64625A", "#3E3C36"])}
${linear("gstone", ["#B8B4C8", "#8A86A0", "#5A5672"], false)}
${radial("gwater", ["#4A6A9A", "#1A2A4A", "#05080E"], undefined, 0.6, 0.4, 0.6)}
${linear("gdrum", ["#D8C8A0", "#A8946A", "#6A5A3A"])}
${linear("gshingle", ["#6A3A28", "#4A2618", "#2A140A"])}
${linear("psv", MATERIALS.silver)}
</defs>
${out.join("\n")}`,
  );
}

/** The bucket on its rope (the prop): oak staves in two iron hoops, an
 *  iron bail. */
export function bucketArt(P: GardenPlan) {
  const { w, h } = P.prop;
  const bw = P.bucket.w;
  const bh = P.bucket.h;
  const cx = w / 2;
  const top = h - bh;
  const body = `M${f(cx - bw / 2)} ${f(top)}L${f(cx - bw * 0.4)} ${f(h - 0.5)}H${f(cx + bw * 0.4)}L${f(cx + bw / 2)} ${f(top)}Z`;
  const staves = [-0.25, 0, 0.25].map((u) => `M${f(cx + u * bw)} ${f(top + 1)}L${f(cx + u * bw * 0.85)} ${f(h - 1)}`).join("");
  const hoop = (t: number) => {
    const y = top + bh * t;
    const hw = bw / 2 - (bw * 0.1 * t) / 1;
    return `M${f(cx - hw)} ${f(y)}H${f(cx + hw)}`;
  };
  return svg(
    w,
    h,
    `<defs>${metalDefs()}${linear("gbk", ["#B07A48", "#7A4E2A", "#3E2414"], false)}</defs>
<path d="M${f(cx - bw / 2 + 1)} ${f(top + 1)}Q${f(cx)} -4 ${f(cx + bw / 2 - 1)} ${f(top + 1)}" fill="none" stroke="#0E1014" stroke-width="2"/>
<path d="M${f(cx - bw / 2 + 1)} ${f(top + 1)}Q${f(cx)} -4 ${f(cx + bw / 2 - 1)} ${f(top + 1)}" fill="none" stroke="url(#pironh)" stroke-width="0.9"/>
<path d="${body}" fill="url(#gbk)" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="${staves}" stroke="${WOOD_INK}" stroke-opacity="0.6" stroke-width="0.6"/>
<path d="${hoop(0.22)}${hoop(0.78)}" stroke="#0E1014" stroke-width="2.4"/>
<path d="${hoop(0.22)}${hoop(0.78)}" stroke="url(#pironh)" stroke-width="1.1"/>
<path d="${oval(cx, top, bw / 2, 1.8)}" fill="#1A2A4A" stroke="${WOOD_INK}" stroke-width="0.8"/>
<path d="M${f(cx - bw * 0.38)} ${f(top + 3)}L${f(cx - bw * 0.32)} ${f(h - 3)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8"/>`,
  );
}

/** The rope from the winch's drum to the bucket's bail, shortening as it
 *  winds up; the crank turning; the stars twinkling; the fireflies. */
function gardenUnder(fx: FlatFrame, P: GardenPlan & { lift: number }) {
  "worklet";
  const { c, time, draw, img } = fx;
  const v = Math.max(0, fx.move);
  // the stars
  fx.fill.setColor(Skia.Color("#FFFFFF"));
  for (let i = 0; i < P.stars.length; i += 3) {
    const s = P.stars[i];
    fx.fill.setAlphaf(0.35 + 0.65 * Math.max(0, Math.sin(time * (0.8 + (i % 5) * 0.3) + i)));
    c.drawCircle(s.x, s.y, s.r + 0.3, fx.fill);
  }
  // the rope and the crank
  const top = P.prop.y + 1 - P.lift * v;
  fx.stroke.setColor(Skia.Color("#D8CCB0"));
  fx.stroke.setAlphaf(1);
  fx.stroke.setStrokeWidth(1);
  c.drawLine(P.well.x, P.axle.y + 3, P.well.x, top, fx.stroke);
  const a = v * Math.PI * 4 + 0.6;
  const cr = 6 * P.ws;
  const hx = P.axle.x1 + 2;
  const ex = hx + Math.cos(a) * cr;
  const ey = P.axle.y + Math.sin(a) * cr;
  fx.stroke.setColor(Skia.Color("#0E1014"));
  fx.stroke.setStrokeWidth(2.4);
  c.drawLine(hx, P.axle.y, ex, ey, fx.stroke);
  c.drawLine(ex, ey, ex + 4 * P.ws, ey, fx.stroke);
  fx.stroke.setColor(Skia.Color("#8A6A3A"));
  fx.stroke.setStrokeWidth(1.2);
  c.drawLine(ex, ey, ex + 4 * P.ws, ey, fx.stroke);
  // fireflies drifting over the grass
  for (let i = 0; i < P.flies.length; i++) {
    const fl = P.flies[i];
    const x = fl.x + Math.sin(time * 0.5 + i * 2.3) * 16 * fl.s + Math.sin(time * 1.3 + i) * 4;
    const y = fl.y + Math.sin(time * 0.7 + i * 1.7) * 8 * fl.s;
    const glow = Math.max(0, Math.sin(time * 1.6 + i * 2.9));
    if (glow < 0.05) continue;
    const g = 16 * fl.s;
    fx.screen[0].setAlphaf(0.75 * glow);
    draw(img.fly, x - g / 2, y - g / 2, g, g, fx.screen[0]);
  }
}

const LIFT = 16;

export const garden = flatRoom({
  id: "garden",
  light: LIGHT,
  plan: (L, exits) => ({ ...gardenPlan(L, exits), lift: Math.round(LIFT * L.k(62)) }),
  art: gardenArt,
  propArt: bucketArt,
  mapArt: (P) => manorMapArt(P.map.w, P.map.h, "iron"),
  notebookArt: (P) => notebookArt(P.notebook.w, P.notebook.h),
  motion: (P) => ({ kind: "pop", lift: P.lift, scale: 0 }),
  payoff: {
    burst: { kind: "ripples", size: 30, color: "#9CB8FF", duration: 1300 },
    haptic: "ripple",
    at: (P) => [P.well.x, P.rimY + 4],
  },
  images: () => ({
    fly: {
      w: 24,
      h: 24,
      key: "",
      art: () =>
        svg(24, 24, `<defs>${radial("gf", ["#FFFFE0", "#E8FF8A", "#B8F060"], [1, 0.5, 0])}</defs><rect width="24" height="24" fill="url(#gf)"/>`),
    },
  }),
  under: gardenUnder,
});

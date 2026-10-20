// The parts every flat-on room of the manor shares, as SVG markup baked
// once (FlatRoom): the floorboards and the coffered ceiling running away
// to the back wall, the side walls with their archways, the back wall's
// doors, the name plates over the ways out, and the live pieces' still
// images (a flame, the seal of the mission, a shadow in the dark). Drawn
// in the house style: gradients lit from the upper left, an ink outline,
// grooves, one line of shine. A room's own wall and furniture are in
// flatRooms/<room>.ts.

import type { Door } from "@/components/iso/kit";
import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { lit, svg } from "@/features/lobby/floor/art";
import { BODY, LIFT } from "@/features/mascot/rig";
import type { ArchBox, DoorBox, FlatLayout } from "./layout";

export const f = (n: number) => +n.toFixed(2);
export const INK = INKS.gold.ink;
export const VEIN = INKS.gold.vein;
export const OAK = ["#7A5432", "#4E3220", "#2E1C10"];
export const OAK_DARK = ["#4E3220", "#341F12", "#1E1008"];
export const IRON = MATERIALS.iron;
export const GOLD = MATERIALS.gold;
export const STONE = ["#B8B4C8", "#8A86A0", "#5A5672"];
export const WOOD_INK = "#140A04";
/** How deep the head of a back door's architrave is (its plate sits in it). */
export const DOOR_HEAD = 22;

/** A steady pseudo-random number in 0..1 for `i`. */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type P2 = readonly [number, number];
export const poly = (pts: readonly P2[]) => `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z`;
export const line = (pts: readonly P2[]) => `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}`;

export { lit, svg };

/** The gradients the shared parts use (put once in the room's defs). */
export function partDefs(L: FlatLayout) {
  return `${linear("pgv", GOLD)}${linear("pgh", GOLD, false)}
${linear("poak", OAK)}${linear("poakh", OAK, false)}${linear("poakd", OAK_DARK)}
${linear("piron", IRON)}${linear("pironh", IRON, false)}
${linear("pstone", STONE)}${linear("pstoneh", STONE, false)}
${radial("pgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${linear("pplate", ["#3A2A1A", "#22160C"])}
${linear("pdark", ["#0C1020", "#05070E"])}
${lit("pfloor", ["#6A4628", "#4A2E18", "#2A180A"], 0, L.floorY, 0, L.h)}
${linear("pceil", ["#1A100A", "#2E1C10", "#3E2616"])}
${radial("pvig", ["#000000", "#000000"], [0, 0.6], 0.5, 0.2, 0.85)}
${linear("pwallsh", ["#000000", "#000000"], true, [0.5, 0])}`;
}

// ------------------------------------------------------------ the floor

/** Oak boards from the back wall to the front, running away from you;
 *  the board ends stepped across the courses; the skirting's shadow. */
export function floorArt(L: FlatLayout) {
  const { w, h, floorY, at, zFront } = L;
  const span = (L.bx1 - L.bx0) * 1.2;
  const n = 15;
  const ink = shade(OAK[2], -0.5);
  const boards: string[] = [];
  const joints: string[] = [];
  const xs = Array.from({ length: n + 1 }, (_, i) => L.vx - span + (2 * span * i) / n);
  for (const x of xs) {
    const a = at(x, floorY, 0);
    const b = at(x, floorY, zFront);
    boards.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
  }
  // courses of board ends, each staggered
  const courses = 9;
  for (let c = 1; c <= courses; c++) {
    const z0 = (zFront * (c - 1)) / courses;
    const z1 = (zFront * c) / courses;
    for (let i = 0; i < n; i++) {
      const z = z0 + (z1 - z0) * rnd(c * 13 + i * 7);
      const a = at(xs[i], floorY, z);
      const b = at(xs[i + 1], floorY, z);
      joints.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
    }
  }
  // a shade of tone on every other board
  const tones = xs.slice(0, -1).map((x, i) => {
    const v = rnd(i * 5 + 2);
    const pts = [at(x, floorY, 0), at(xs[i + 1], floorY, 0), at(xs[i + 1], floorY, zFront), at(x, floorY, zFront)];
    return `<path d="${poly(pts)}" fill="${v > 0.5 ? "#fff" : "#000"}" fill-opacity="${f(0.02 + Math.abs(v - 0.5) * 0.1)}"/>`;
  });
  return `<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#pfloor)"/>
${tones.join("")}
<path d="${boards.join("")}" stroke="${ink}" stroke-opacity="0.7" stroke-width="1"/>
<path d="${joints.join("")}" stroke="${ink}" stroke-opacity="0.5" stroke-width="0.8"/>`;
}

/** The floor's shading over everything on it: dark at the edges, the
 *  wall's shadow along its foot. */
export const floorShade = (L: FlatLayout) =>
  `<rect y="${f(L.floorY)}" width="${L.w}" height="${f(L.h - L.floorY)}" fill="url(#pvig)"/>
<rect x="${L.bx0}" y="${f(L.floorY)}" width="${f(L.bx1 - L.bx0)}" height="16" fill="url(#pwallsh)"/>`;

// ---------------------------------------------------------- the ceiling

/** The coffered oak ceiling over the room: beams running back to the
 *  wall, cross beams, a gold rosette in every coffer. */
export function ceilingArt(L: FlatLayout) {
  const { w, ceil, at, bx0, bx1 } = L;
  // the ceiling reaches the top of the box at this depth
  const zTop = L.F * (1 - (L.vy - ceil) / L.vy);
  const out: string[] = [`<rect width="${w}" height="${f(ceil)}" fill="url(#pceil)"/>`];
  const beams: string[] = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const x = bx0 + ((bx1 - bx0) * i) / n;
    const a = at(x, ceil, 0);
    const b = at(x, ceil, zTop * 1.3);
    beams.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
  }
  out.push(
    `<path d="${beams.join("")}" stroke="#0E0804" stroke-width="5"/><path d="${beams.join("")}" stroke="url(#poakh)" stroke-width="3"/>`,
  );
  // a cross beam half way up
  const zc = zTop * 0.55;
  const beam = [at(bx0 - 400, ceil, zc - 5), at(bx1 + 400, ceil, zc - 5), at(bx1 + 400, ceil, zc + 5), at(bx0 - 400, ceil, zc + 5)];
  const [, by] = at(0, ceil, zc + 5);
  out.push(
    `<path d="${poly(beam)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M0 ${f(by + 1)}H${w}" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>`,
  );
  for (let i = 0; i < n; i++) {
    const x = bx0 + ((bx1 - bx0) * (i + 0.5)) / n;
    const [cx, cy] = at(x, ceil, zc * 0.5);
    const s = 1.6 * L.k(zc * 0.5);
    out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`);
  }
  // the gilt cornice along the top of the back wall
  out.push(`<rect x="${f(bx0 - 2)}" y="${f(ceil - 2)}" width="${f(bx1 - bx0 + 4)}" height="6" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(bx0)} ${f(ceil - 0.8)}H${f(bx1)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`);
  const eggs: string[] = [];
  for (let x = bx0 + 3; x < bx1 - 2; x += 6) eggs.push(`M${f(x)} ${f(ceil + 4)}q3 5 6 0`);
  out.push(`<path d="${eggs.join("")}" fill="none" stroke="${VEIN}" stroke-width="0.8"/>`);
  return out.join("");
}

// ------------------------------------------------------- the side walls

/** One side wall: its paper and its oak wainscot in perspective, the
 *  gilt rail, the cornice, and its archway (or none). `paper` is the
 *  wall's colours, light to dark. */
export function sideWallArt(
  L: FlatLayout,
  wall: "left" | "right",
  paper: readonly string[],
  arch: { box: ArchBox; door: Door; color: string } | null,
  rail: number,
) {
  const { at, ceil, floorY, w, h } = L;
  const wx = wall === "left" ? L.bx0 : L.bx1;
  const zFar = L.zFront;
  const edge = wall === "left" ? 0 : w;
  const id = `sw${wall[0]}`;
  const pts = [at(wx, ceil, 0), at(wx, ceil, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  const out: string[] = [];
  out.push(
    `<defs>${lit(`${id}p`, paper, wall === "left" ? 0 : w, 0, wall === "left" ? L.bx0 * 1.4 : w - L.bx0 * 1.4, h * 0.3)}</defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}p)"/>`,
  );
  // pinstripes on the paper, each a step further along the wall
  const stripes: string[] = [];
  for (let z = 6; z < L.zEdge * 1.2; z += 9) {
    const a = at(wx, ceil, z);
    const b = at(wx, rail, z);
    stripes.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
  }
  out.push(`<path d="${stripes.join("")}" stroke="#E2B04A" stroke-opacity="0.16" stroke-width="0.7"/>`);
  // the wainscot: oak panels between rail and skirting
  const panels: string[] = [];
  const pz = 16;
  for (let z = 2; z < L.zEdge * 1.15; z += pz) {
    if (arch && z + pz > arch.box.z0 - 7 && z < arch.box.z1 + 7) continue;
    const a = at(wx, rail + 6, z + 2);
    const b = at(wx, rail + 6, z + pz - 2);
    const c = at(wx, floorY - 12, z + pz - 2);
    const d = at(wx, floorY - 12, z + 2);
    panels.push(
      `<path d="${poly([a, b, c, d])}" fill="#24140A" fill-opacity="0.55" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    );
  }
  const wain = [at(wx, rail, 0), at(wx, rail, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  out.push(`<path d="${poly(wain)}" fill="url(#poak)"/>`, panels.join(""));
  // the rail and the skirting, lines running back to the wall
  const rl = [at(wx, rail, 0), at(wx, rail, zFar)];
  const sk = [at(wx, floorY - 8, 0), at(wx, floorY - 8, zFar)];
  out.push(
    `<path d="${line(rl)}" stroke="${WOOD_INK}" stroke-width="4.2"/><path d="${line(rl)}" stroke="url(#pgv)" stroke-width="2.4"/>`,
    `<path d="${line(sk)}" stroke="${WOOD_INK}" stroke-opacity="0.8" stroke-width="1"/>`,
  );
  if (arch) out.push(archArt(L, arch.box, arch.door, arch.color));
  // the corner where it meets the back wall, and a shade towards the edge
  const c0 = at(wx, ceil, 0);
  const c1 = at(wx, floorY, 0);
  out.push(
    `<path d="M${f(c0[0])} ${f(c0[1])}L${f(c1[0])} ${f(c1[1])}" stroke="#000" stroke-opacity="0.45" stroke-width="2"/>`,
    `<defs><linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${f(wx)}" y1="0" x2="${f(edge)}" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}s)"/>`,
  );
  return out.join("");
}

/** The outline of an archway in a side wall, offset `t` outward (a
 *  stone ring round it), as points on the screen. */
function archOutline(L: FlatLayout, A: ArchBox, t: number, x?: number) {
  const wx = x ?? (A.wall === "left" ? L.bx0 : L.bx1);
  const r = (A.z1 - A.z0) / 2 + t;
  const zc = (A.z0 + A.z1) / 2;
  const pts: P2[] = [L.at(wx, L.floorY, zc - r)];
  for (let i = 0; i <= 24; i++) {
    const th = (Math.PI * i) / 24;
    pts.push(L.at(wx, A.spring - Math.sin(th) * r, zc - Math.cos(th) * r));
  }
  pts.push(L.at(wx, L.floorY, zc + r));
  return pts;
}

/** An archway in a side wall: a ring of pale stone voussoirs with a key
 *  stone, and through it, as tonight has it: the way open (a dark
 *  passage, the next room's light at its end, spilling on the floor),
 *  locked (an iron grille with a padlock) or shut for good (stones piled
 *  up, two planks nailed across). */
export function archArt(L: FlatLayout, A: ArchBox, door: Door, color: string) {
  const wx = A.wall === "left" ? L.bx0 : L.bx1;
  const out: string[] = [];
  const outer = archOutline(L, A, 6);
  const inner = archOutline(L, A, 0);
  const id = `ar${A.wall[0]}`;
  out.push(
    `<path d="${poly(outer)}" fill="#000" fill-opacity="0.35" transform="translate(${A.wall === "left" ? 1.5 : -1.5} 1.5)"/>`,
  );
  out.push(`<path d="${poly(outer)}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.9"/>`);
  if (door === "open") {
    // the passage beyond, seen slantwise through the arch: its far wall
    // and its floor running out to the next room, lit by it at the end
    const dir = A.wall === "left" ? -1 : 1;
    const deep = wx + dir * 140;
    const T = wx + dir * 9;
    const top = A.spring - (A.z1 - A.z0) / 2 - 8;
    const [nx] = L.at(T, 0, A.z0);
    // lit towards the far side of the opening, where the passage meets the next room
    const [dx] = L.at(wx, 0, A.z1);
    const passWall = [L.at(T, L.floorY, A.z0), L.at(T, top, A.z0), L.at(deep, top, A.z0), L.at(deep, L.floorY, A.z0)];
    const passFloor = [L.at(T, L.floorY, A.z0), L.at(deep, L.floorY, A.z0), L.at(deep, L.floorY, A.z1), L.at(wx, L.floorY, A.z1)];
    const rv = [L.at(wx, L.floorY, A.z0), L.at(wx, top, A.z0), L.at(T, top, A.z0), L.at(T, L.floorY, A.z0)];
    const flags: string[] = [];
    for (let x = T + dir * 14; Math.abs(x - wx) < 140; x += dir * 16) flags.push(line([L.at(x, L.floorY, A.z0), L.at(x, L.floorY, A.z1)]));
    out.push(
      `<defs><clipPath id="${id}c"><path d="${poly(inner)}"/></clipPath><linearGradient id="${id}w" gradientUnits="userSpaceOnUse" x1="${f(nx)}" y1="0" x2="${f(dx)}" y2="0"><stop offset="0" stop-color="#141826"/><stop offset="0.45" stop-color="${shade(color, -0.6)}"/><stop offset="1" stop-color="${shade(color, -0.1)}"/></linearGradient><linearGradient id="${id}f" gradientUnits="userSpaceOnUse" x1="${f(nx)}" y1="0" x2="${f(dx)}" y2="0"><stop offset="0" stop-color="#0C0E16"/><stop offset="1" stop-color="${shade(color, -0.35)}"/></linearGradient></defs>`,
      `<path d="${poly(inner)}" fill="url(#pdark)"/>`,
      `<g clip-path="url(#${id}c)">`,
      `<path d="${poly(passWall)}" fill="url(#${id}w)"/>`,
      `<path d="${poly(passFloor)}" fill="url(#${id}f)"/>`,
      `<path d="${flags.join("")}" stroke="#000" stroke-opacity="0.35" stroke-width="0.8"/>`,
      `<path d="${poly(rv)}" fill="url(#pstoneh)" stroke="#2A2638" stroke-width="0.6"/>`,
      `<path d="${poly(rv)}" fill="#000" fill-opacity="0.35"/>`,
      `</g>`,
    );

  } else if (door === "locked") {
    out.push(`<path d="${poly(inner)}" fill="url(#pdark)"/>`);
    // an iron grille: bars, two bands, a padlock on the middle bar
    const bars: string[] = [];
    const n = 6;
    for (let i = 1; i < n; i++) {
      const z = A.z0 + ((A.z1 - A.z0) * i) / n;
      const r = (A.z1 - A.z0) / 2;
      const zc = (A.z0 + A.z1) / 2;
      const top = A.spring - Math.sqrt(Math.max(0, r * r - (z - zc) ** 2));
      bars.push(line([L.at(wx, L.floorY, z), L.at(wx, top, z)]));
    }
    const band = (y: number) => line([L.at(wx, y, A.z0), L.at(wx, y, A.z1)]);
    const bands = [band(A.spring + 6), band(L.floorY - 16)];
    const [lx, ly] = L.at(wx, (A.spring + L.floorY) / 2, (A.z0 + A.z1) / 2);
    out.push(
      `<path d="${[...bars, ...bands].join("")}" stroke="#0E1014" stroke-width="3"/>`,
      `<path d="${[...bars, ...bands].join("")}" stroke="url(#pironh)" stroke-width="1.6"/>`,
      `<path d="M${f(lx - 3)} ${f(ly - 3)}a3 3.4 0 0 1 6 0" fill="none" stroke="#9AA2AE" stroke-width="1.4"/>`,
      `<path d="${rrect(lx - 4.6, ly - 3, 9.2, 8, 1.6)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
      `<circle cx="${f(lx)}" cy="${f(ly + 0.6)}" r="1" fill="${INK}"/>`,
    );
  } else {
    out.push(`<path d="${poly(inner)}" fill="#3A3448"/>`);
    // stones piled up to the head
    const stones: string[] = [];
    for (let r = 0, y = L.floorY; y > A.spring - (A.z1 - A.z0) / 2; r++, y -= 9) {
      for (let z = A.z0 - (r % 2 ? 6 : 0); z < A.z1; z += 12) {
        const pts = [L.at(wx, y, z), L.at(wx, y, z + 12), L.at(wx, y - 9, z + 12), L.at(wx, y - 9, z)];
        stones.push(
          `<path d="${poly(pts)}" fill="${rnd(r * 9 + z) > 0.5 ? "#6A6480" : "#524C66"}" stroke="#1E1A28" stroke-width="0.6"/>`,
        );
      }
    }
    out.push(
      `<defs><clipPath id="${id}c"><path d="${poly(inner)}"/></clipPath></defs><g clip-path="url(#${id}c)">${stones.join("")}</g>`,
    );
    const plank = (y0: number, y1: number) => line([L.at(wx, y0, A.z0 - 4), L.at(wx, y1, A.z1 + 4)]);
    const p1 = plank(L.floorY - 10, A.spring - 4);
    const p2 = plank(A.spring - 4, L.floorY - 10);
    out.push(
      `<path d="${p1}${p2}" stroke="${WOOD_INK}" stroke-width="7" stroke-linecap="round"/>`,
      `<path d="${p1}${p2}" stroke="url(#poakh)" stroke-width="5" stroke-linecap="round"/>`,
    );
  }
  // the voussoirs and the key stone over it all
  const joints: string[] = [];
  const r = (A.z1 - A.z0) / 2;
  const zc = (A.z0 + A.z1) / 2;
  for (let i = 1; i < 9; i++) {
    const th = (Math.PI * i) / 9;
    joints.push(
      line([
        L.at(wx, A.spring - Math.sin(th) * r, zc - Math.cos(th) * r),
        L.at(wx, A.spring - Math.sin(th) * (r + 6), zc - Math.cos(th) * (r + 6)),
      ]),
    );
  }
  const key = [
    L.at(wx, A.spring - r + 1, zc - 3),
    L.at(wx, A.spring - r - 8, zc - 4.5),
    L.at(wx, A.spring - r - 8, zc + 4.5),
    L.at(wx, A.spring - r + 1, zc + 3),
  ];
  out.push(
    `<path d="${joints.join("")}" stroke="#2A2638" stroke-width="0.8"/>`,
    `<path d="${poly(inner)}" fill="none" stroke="#2A2638" stroke-width="1"/>`,
    `<path d="${poly(key)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>`,
    `<path d="${line(inner.slice(1, 12))}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8" transform="translate(${A.wall === "left" ? 1 : -1} 0.8)"/>`,
  );
  return out.join("");
}

/** The light from an open way out lying on the floor before it, in the
 *  next room's colour. */
export function spillArt(x: number, y: number, rx: number, ry: number, color: string, id: string) {
  return `<defs>${radial(id, [color, color, color], [0.3, 0.12, 0])}</defs>
<rect x="${f(x - rx)}" y="${f(y - ry)}" width="${f(rx * 2)}" height="${f(ry * 2)}" fill="url(#${id})"/>`;
}

// -------------------------------------------------------- the back doors

/** A doorway in the back wall: an oak architrave with a gold fillet and
 *  a cornice over it, and through it, as tonight has it: open (the door
 *  swung back, a dark passage with the next room's light at its end),
 *  locked (the door shut, an iron bar across it and a padlock) or shut
 *  for good (bricked up, two planks nailed across). */
export function backDoorArt(D: DoorBox, door: Door, color: string, id: string) {
  const { x, y, w, h } = D;
  const t = 6;
  const head = DOOR_HEAD;
  const out: string[] = [];
  out.push(
    `<rect x="${f(x - t + 2)}" y="${f(y - head - 6 + 3)}" width="${f(w + 2 * t)}" height="${f(h + head + 6)}" fill="#000" fill-opacity="0.4"/>`,
    // the architrave, its head deep enough for the name plate
    `<rect x="${f(x - t)}" y="${f(y - head)}" width="${f(w + 2 * t)}" height="${f(h + head)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<rect x="${f(x - t + 2)}" y="${f(y - head + 2)}" width="${f(w + 2 * t - 4)}" height="${f(h + head - 2)}" fill="none" stroke="url(#pgv)" stroke-width="1"/>`,
    `<path d="M${f(x - t + 1.2)} ${f(y + h)}V${f(y - head + 1.2)}H${f(x + w * 0.5)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.8"/>`,
    `<path d="M${f(x - 1)} ${f(y - 1)}H${f(x + w + 1)}" stroke="${WOOD_INK}" stroke-width="1.2"/>`,
    // the cornice over it
    `<path d="M${f(x - t - 5)} ${f(y - head)}H${f(x + w + t + 5)}L${f(x + w + t + 2)} ${f(y - head - 6)}H${f(x - t - 2)}Z" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<rect x="${f(x - t - 5)}" y="${f(y - head - 1.6)}" width="${f(w + 2 * t + 10)}" height="2" fill="url(#pgv)"/>`,
  );
  if (door === "open") {
    // the passage: walls running back to the next room's lit door
    const fx0 = x + w * 0.3;
    const fx1 = x + w * 0.7;
    const fy0 = y + h * 0.28;
    const fy1 = y + h * 0.82;
    out.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#pdark)"/>`,
      `<path d="M${f(x)} ${f(y + h)}L${f(fx0)} ${f(fy1)}H${f(fx1)}L${f(x + w)} ${f(y + h)}Z" fill="#1A1420"/>`,
      `<defs><radialGradient id="${id}g" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="${color}" stop-opacity="0.9"/><stop offset="1" stop-color="${color}" stop-opacity="0.35"/></radialGradient>${radial(`${id}h`, [color, color], [0.4, 0])}</defs>`,
      `<rect x="${f(fx0 - 14)}" y="${f(fy0 - 14)}" width="${f(fx1 - fx0 + 28)}" height="${f(fy1 - fy0 + 22)}" fill="url(#${id}h)"/>`,
      `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="url(#${id}g)" stroke="#05070E" stroke-width="0.8"/>`,
      `<path d="M${f(x)} ${f(y)}L${f(fx0)} ${f(fy0)}M${f(x + w)} ${f(y)}L${f(fx1)} ${f(fy0)}" stroke="#05070E" stroke-opacity="0.8" stroke-width="0.8"/>`,
      // the door swung back against the reveal
      `<path d="M${f(x + w)} ${f(y)}L${f(x + w - 9)} ${f(y + 5)}V${f(y + h - 3)}L${f(x + w)} ${f(y + h)}Z" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
      `<circle cx="${f(x + w - 6.5)}" cy="${f(y + h * 0.55)}" r="1.4" fill="url(#pgd)" stroke="${INK}" stroke-width="0.4"/>`,
    );
  } else if (door === "locked") {
    const panel = (px: number, py: number, pw: number, ph: number) =>
      `<path d="${rrect(px, py, pw, ph, 1.5)}" fill="#24140A" fill-opacity="0.5" stroke="${WOOD_INK}" stroke-width="0.8"/><path d="M${f(px + 1)} ${f(py + ph - 1)}V${f(py + 1)}H${f(px + pw - 1)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.6"/>`;
    const pw = (w - 12) / 2;
    out.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
      panel(x + 4, y + 5, pw, h * 0.38),
      panel(x + 8 + pw, y + 5, pw, h * 0.38),
      panel(x + 4, y + h * 0.5, pw, h * 0.44),
      panel(x + 8 + pw, y + h * 0.5, pw, h * 0.44),
      // the iron bar and its padlock
      `<rect x="${f(x - 4)}" y="${f(y + h * 0.42)}" width="${f(w + 8)}" height="5" fill="url(#piron)" stroke="#0E1014" stroke-width="0.8"/>`,
      `<circle cx="${f(x - 1)}" cy="${f(y + h * 0.42 + 2.5)}" r="1" fill="#C8CCD4"/><circle cx="${f(x + w + 1)}" cy="${f(y + h * 0.42 + 2.5)}" r="1" fill="#C8CCD4"/>`,
      `<path d="M${f(x + w / 2 - 3)} ${f(y + h * 0.42 + 5)}a3 3.4 0 0 1 6 0" fill="none" stroke="#9AA2AE" stroke-width="1.4" transform="translate(0 3)"/>`,
      `<path d="${rrect(x + w / 2 - 5, y + h * 0.42 + 7, 10, 9, 1.8)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
      `<circle cx="${f(x + w / 2)}" cy="${f(y + h * 0.42 + 11)}" r="1.1" fill="${INK}"/>`,
    );
  } else {
    // bricked up
    const bricks: string[] = [];
    for (let r = 0, yy = y + h - 7; yy > y - 7; r++, yy -= 7) {
      for (let xx = x - (r % 2 ? 7 : 0); xx < x + w; xx += 14) {
        bricks.push(
          `<rect x="${f(xx)}" y="${f(yy)}" width="14" height="7" fill="${rnd(r * 11 + xx) > 0.5 ? "#6A4A3E" : "#5A3A30"}" stroke="#24140E" stroke-width="0.6"/>`,
        );
      }
    }
    out.push(
      `<defs><clipPath id="${id}c"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath></defs>`,
      `<g clip-path="url(#${id}c)">${bricks.join("")}</g>`,
      `<path d="M${f(x - 3)} ${f(y + h * 0.15)}L${f(x + w + 3)} ${f(y + h * 0.75)}M${f(x - 3)} ${f(y + h * 0.75)}L${f(x + w + 3)} ${f(y + h * 0.15)}" stroke="${WOOD_INK}" stroke-width="7" stroke-linecap="round"/>`,
      `<path d="M${f(x - 3)} ${f(y + h * 0.15)}L${f(x + w + 3)} ${f(y + h * 0.75)}M${f(x - 3)} ${f(y + h * 0.75)}L${f(x + w + 3)} ${f(y + h * 0.15)}" stroke="url(#poakh)" stroke-width="5" stroke-linecap="round"/>`,
    );
  }
  out.push(
    `<rect x="${f(x - 1)}" y="${f(y + h - 2)}" width="${f(w + 2)}" height="3" fill="url(#pstoneh)" stroke="#2A2638" stroke-width="0.5"/>`,
  );
  return out.join("");
}

// ------------------------------------------------------ the name plates

/** A name plate (its name is written over it): dark wood in a gold
 *  moulding, a brass stud at each end; centred on (x, y). */
export function plateBox(x: number, y: number, w: number, h: number, id: string) {
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  return `<path d="${rrect(x0 + 1, y0 + 2.5, w, h, 5)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(x0, y0, w, h, 5)}" fill="url(#pplate)"/>
${moulding(x0, y0, w, h, 5, 1.8, id)}`;
}

/** The iron bracket a side wall's plate hangs from: a bar out of the
 *  wall over the plate, a scroll under it, two short chains. */
export function bracketArt(wallX: number, x: number, y: number, w: number, h: number) {
  const dir = x > wallX ? 1 : -1;
  const far = x + (dir * w) / 2;
  const by = y - h / 2 - 7;
  const scroll = `M${f(wallX)} ${f(by + 12)}C${f(wallX + dir * 10)} ${f(by + 12)} ${f(wallX + dir * 18)} ${f(by + 2)} ${f(wallX + dir * 28)} ${f(by + 1)}`;
  const curl = `M${f(wallX + dir * 6)} ${f(by + 9)}c${f(dir * -3)} 3 ${f(dir * 1)} 6 ${f(dir * 3.5)} 3.5`;
  const chains = [x - (dir * w) / 2 + dir * 8, far - dir * 8]
    .map((cx) => `M${f(cx)} ${f(by + 1)}V${f(y - h / 2 + 1)}`)
    .join("");
  return `<rect x="${f(Math.min(wallX, far) - 1)}" y="${f(by - 1.5)}" width="${f(Math.abs(far - wallX) + 2)}" height="3" rx="1.5" fill="url(#pironh)" stroke="#0E1014" stroke-width="0.7"/>
<path d="${scroll}${curl}" fill="none" stroke="#0E1014" stroke-width="2.6" stroke-linecap="round"/>
<path d="${scroll}${curl}" fill="none" stroke="#7A808A" stroke-width="1.1" stroke-linecap="round"/>
<path d="M${f(wallX)} ${f(by - 5)}V${f(by + 15)}" stroke="#0E1014" stroke-width="3.4" stroke-linecap="round"/>
<path d="${chains}" stroke="#0E1014" stroke-width="2.2" stroke-dasharray="2 1.2"/>
<path d="${chains}" stroke="#9AA2AE" stroke-width="0.9" stroke-dasharray="1.4 1.8"/>
<circle cx="${f(far)}" cy="${f(by)}" r="2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`;
}

// ---------------------------------------------------- the live pieces

/** A candle flame, w × h: white heart, gold body, an orange lick. */
export function flameArt(w: number, h: number) {
  const c = w / 2;
  return svg(
    w,
    h,
    `<defs>${radial("ff", ["#FFFFFF", "#FFE07A", "#FF9A2A", "#E0501A"], undefined, 0.5, 0.72, 0.62)}</defs>
<path d="M${c} 0.5C${f(c + w * 0.36)} ${f(h * 0.38)} ${f(c + w * 0.46)} ${f(h * 0.78)} ${c} ${f(h - 0.5)}C${f(c - w * 0.46)} ${f(h * 0.78)} ${f(c - w * 0.36)} ${f(h * 0.38)} ${c} 0.5Z" fill="url(#ff)"/>
<path d="M${c} ${f(h * 0.45)}C${f(c + w * 0.16)} ${f(h * 0.62)} ${f(c + w * 0.16)} ${f(h * 0.86)} ${c} ${f(h * 0.9)}C${f(c - w * 0.16)} ${f(h * 0.86)} ${f(c - w * 0.16)} ${f(h * 0.62)} ${c} ${f(h * 0.45)}Z" fill="#fff" fill-opacity="0.85"/>`,
  );
}

/** The seal of the mission room laid on the floor, size square, seen
 *  from above (it is squashed and turned on the canvas): a glowing ring
 *  of runes in `color`. */
export function sealArt(size: number, color: string) {
  const c = size / 2;
  const R = size * 0.42;
  const runes: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = (r: number, t = 0): [number, number] => [
      c + Math.cos(a) * r - Math.sin(a) * t,
      c + Math.sin(a) * r + Math.cos(a) * t,
    ];
    if (i % 2 === 0) {
      const [ax, ay] = p(R * 0.95);
      const [bx, by] = p(R * 0.89, R * 0.05);
      const [cx2, cy2] = p(R * 0.83);
      const [dx, dy] = p(R * 0.89, -R * 0.05);
      runes.push(`M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}L${f(cx2)} ${f(cy2)}L${f(dx)} ${f(dy)}Z`);
    } else {
      const [ax, ay] = p(R * 0.96);
      const [bx, by] = p(R * 0.82);
      const [cx2, cy2] = p(R * 0.9, R * 0.05);
      const [dx, dy] = p(R * 0.9, -R * 0.05);
      runes.push(`M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}M${f(cx2)} ${f(cy2)}L${f(dx)} ${f(dy)}`);
    }
  }
  const ring = (r: number) =>
    `<circle cx="${c}" cy="${c}" r="${f(r)}" fill="none" stroke="${color}" stroke-width="${f(size * 0.018)}"/>`;
  return svg(
    size,
    size,
    `<defs>${radial("sg", [color, color, color], [0.5, 0.18, 0])}</defs>
<rect width="${size}" height="${size}" fill="url(#sg)"/>
${ring(R)}${ring(R * 0.78)}
<path d="${runes.join("")}" fill="none" stroke="${color}" stroke-width="${f(size * 0.02)}" stroke-linejoin="round"/>
${ring(R * 1.02).replace(`stroke="${color}"`, 'stroke="#fff" stroke-opacity="0.35"')}`,
  );
}

/** Someone in the dark whose face can't be made out: a meeple's shape
 *  in shadow, in the mascot's box (100 × 130, `w` wide). */
export function shadowArt(w: number) {
  const h = (w * 130) / 100;
  const k = w / 100;
  return svg(
    w,
    h,
    `<defs>${linear("sh", ["#3A4263", "#1E2438", "#0E1220"])}</defs>
<g transform="scale(${f(k)}) translate(0 ${LIFT})">
<path d="${BODY}" fill="url(#sh)" fill-opacity="0.92" stroke="#6C769C" stroke-opacity="0.5" stroke-width="${f(1.4 / k)}"/>
</g>`,
  );
}

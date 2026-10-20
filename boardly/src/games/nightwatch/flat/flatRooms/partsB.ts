// Parts the dining room, cellar, kitchen and garden share when they are
// drawn flat on (beside the parts every room shares, ../parts.ts): a box
// in the room's perspective (a table, a dresser, a cask), a candle with
// its flame's place, plates and goblets seen from the side, stone walls
// and a vaulted ceiling, the garden's night sky, its hedges and its
// gates. SVG markup, baked once with the room.

import type { Door } from "@/components/iso/kit";
import { linear, radial } from "@/components/engraved/panel";
import { MATERIALS, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { ArchBox, DoorBox, FlatLayout } from "../layout";
import { INK, WOOD_INK, archArt, f, line, poly, rnd, type P2 } from "../parts";

export type P3 = readonly [number, number, number];

/** Points of the room on the screen. */
export const proj = (L: FlatLayout, pts: readonly P3[]): P2[] => pts.map((p) => L.at(p[0], p[1], p[2]));
/** A face of the room (four or more points) as a closed path. */
export const face = (L: FlatLayout, pts: readonly P3[]) => poly(proj(L, pts));
/** A line through points of the room. */
export const stroke = (L: FlatLayout, pts: readonly P3[]) => line(proj(L, pts));

export interface BoxPaint {
  front: string;
  top?: string;
  side?: string;
  bottom?: string;
  ink?: string;
  width?: number;
}

/** A box in the room: x0..x1 across, yt..yb from top to bottom (screen
 *  down, on the back wall's plane), z0..z1 out from the back wall. Only
 *  the faces the eye can see are drawn, the far ones first. */
export function box(L: FlatLayout, x0: number, x1: number, yt: number, yb: number, z0: number, z1: number, p: BoxPaint) {
  const ink = p.ink ?? WOOD_INK;
  const sw = p.width ?? 0.8;
  const out: string[] = [];
  const paint = (d: string, fill: string) =>
    `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  if (x0 > L.vx)
    out.push(paint(face(L, [[x0, yt, z0], [x0, yt, z1], [x0, yb, z1], [x0, yb, z0]]), p.side ?? p.front));
  if (x1 < L.vx)
    out.push(paint(face(L, [[x1, yt, z0], [x1, yt, z1], [x1, yb, z1], [x1, yb, z0]]), p.side ?? p.front));
  if (yt > L.vy) out.push(paint(face(L, [[x0, yt, z0], [x1, yt, z0], [x1, yt, z1], [x0, yt, z1]]), p.top ?? p.front));
  if (yb < L.vy)
    out.push(paint(face(L, [[x0, yb, z0], [x1, yb, z0], [x1, yb, z1], [x0, yb, z1]]), p.bottom ?? p.side ?? p.front));
  out.push(paint(face(L, [[x0, yt, z1], [x1, yt, z1], [x1, yb, z1], [x0, yb, z1]]), p.front));
  return out.join("");
}

/** A soft shadow on the floor under something standing there. */
export const floorShadow = (L: FlatLayout, x0: number, x1: number, z0: number, z1: number, o = 0.4) =>
  `<path d="${face(L, [[x0, L.floorY, z0], [x1, L.floorY, z0], [x1, L.floorY, z1], [x0, L.floorY, z1]])}" fill="#000" fill-opacity="${o}"/>`;

/** A flame's place over a candle whose top is at (x, y), `s` its scale
 *  (FlatRoom draws the flame from y down to y + 11·s, the glow round it). */
export const flameAt = (x: number, top: number, s: number) => ({ x, y: top - 7 * s, s });
export type Flame = ReturnType<typeof flameAt>;

/** An ivory candle standing at (x, foot) on the screen, h tall, with a
 *  brass cup; returns its markup (the flame is drawn live). */
export function candle(x: number, foot: number, h: number, s = 1, cup = true) {
  const w = 4.2 * s;
  const top = foot - h;
  return `${cup ? `<path d="M${f(x - 3.6 * s)} ${f(foot + 1.5 * s)}h${f(7.2 * s)}l${f(-1 * s)} ${f(-3 * s)}h${f(-5.2 * s)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>` : ""}
<rect x="${f(x - w / 2)}" y="${f(top)}" width="${f(w)}" height="${f(h - (cup ? 1.5 * s : 0))}" fill="url(#bciv)" stroke="${INK}" stroke-width="0.55"/>
<path d="M${f(x - w * 0.3)} ${f(top + 1.5)}V${f(foot - 3)}" stroke="#fff" stroke-opacity="0.9" stroke-width="0.6"/>
<path d="M${f(x)} ${f(top)}v${f(-1.8 * s)}" stroke="#2A1A08" stroke-width="0.7"/>`;
}

/** A plate seen from the side and a little above: rim and well, w wide. */
export function plate(x: number, y: number, w: number, fill = "url(#bchina)") {
  const h = w * 0.3;
  return `<path d="${oval(x, y + 1, w / 2, h / 2)}" fill="#000" fill-opacity="0.3"/>
<path d="${oval(x, y, w / 2, h / 2)}" fill="${fill}" stroke="#3A3428" stroke-width="0.5"/>
<path d="${oval(x, y + h * 0.06, w * 0.3, h * 0.28)}" fill="none" stroke="#2A5AA8" stroke-opacity="0.6" stroke-width="0.6"/>`;
}

/** An oval as a path (Skia's SVG reader fills an <ellipse>'s gradient black). */
export const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** A goblet standing at (x, foot), h tall: a cup of glass with wine in
 *  it, a gilt rim, a knop on the stem, a round foot. `fill` the bowl's
 *  paint. */
export function goblet(x: number, foot: number, h: number, wine = "url(#bwine)") {
  const s = h / 24;
  const cupTop = foot - h;
  const cupW = 6.4 * s;
  const cupBot = cupTop + 11 * s;
  const cup = `M${f(x - cupW)} ${f(cupTop)}C${f(x - cupW)} ${f(cupTop + 8 * s)} ${f(x - 2.2 * s)} ${f(cupBot)} ${f(x)} ${f(cupBot)}C${f(x + 2.2 * s)} ${f(cupBot)} ${f(x + cupW)} ${f(cupTop + 8 * s)} ${f(x + cupW)} ${f(cupTop)}Z`;
  const wineTop = cupTop + 3.6 * s;
  const wineD = `M${f(x - cupW * 0.93)} ${f(wineTop)}C${f(x - cupW * 0.9)} ${f(cupTop + 8.4 * s)} ${f(x - 2 * s)} ${f(cupBot - 0.6 * s)} ${f(x)} ${f(cupBot - 0.6 * s)}C${f(x + 2 * s)} ${f(cupBot - 0.6 * s)} ${f(x + cupW * 0.9)} ${f(cupTop + 8.4 * s)} ${f(x + cupW * 0.93)} ${f(wineTop)}Z`;
  const stem = `M${f(x - 0.9 * s)} ${f(cupBot)}V${f(foot - 2.4 * s)}h${f(1.8 * s)}V${f(cupBot)}Z`;
  const base = `M${f(x - 5 * s)} ${f(foot)}Q${f(x)} ${f(foot - 3.6 * s)} ${f(x + 5 * s)} ${f(foot)}Z`;
  return `<path d="${cup}" fill="url(#bglass)" stroke="#1E242C" stroke-width="${f(0.5 * s)}"/>
<path d="${wineD}" fill="${wine}"/>
<path d="${oval(x, wineTop, cupW * 0.93, 1.1 * s)}" fill="#C2203A" stroke="#4A0610" stroke-width="${f(0.3 * s)}"/>
<path d="${stem}" fill="url(#pgh)" stroke="${INK}" stroke-width="${f(0.45 * s)}"/>
<circle cx="${f(x)}" cy="${f(cupBot + (foot - cupBot) * 0.45)}" r="${f(1.6 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="${f(0.4 * s)}"/>
<path d="${base}" fill="url(#pgv)" stroke="${INK}" stroke-width="${f(0.45 * s)}"/>
<path d="${oval(x, cupTop, cupW, 1.4 * s)}" fill="#E8F0FF" fill-opacity="0.25" stroke="url(#pgh)" stroke-width="${f(0.9 * s)}"/>
<path d="M${f(x - cupW * 0.6)} ${f(cupTop + 2 * s)}Q${f(x - cupW * 0.62)} ${f(cupTop + 7 * s)} ${f(x - 2.4 * s)} ${f(cupBot - 2 * s)}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${f(0.7 * s)}" stroke-linecap="round"/>`;
}

/** A flat ring in the room (a plate, a tray, a well's mouth): a circle
 *  of radius r lying at height y round (cx, cz), as a closed path. */
export function disc(L: FlatLayout, cx: number, y: number, cz: number, r: number, ry = r) {
  const pts: P3[] = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * ry];
  });
  return face(L, pts);
}

/** The gold and silver gradients the parts use, for a small image of its
 *  own (a goblet, a lid) baked apart from the room. */
export const metalDefs = () =>
  `${linear("pgv", MATERIALS.gold)}${linear("pgh", MATERIALS.gold, false)}${radial("pgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}${linear("psv", MATERIALS.silver)}${linear("psvh", MATERIALS.silver, false)}${linear("piron", MATERIALS.iron)}${linear("pironh", MATERIALS.iron, false)}`;

/** The gradients these parts use (put once in the room's defs). */
export const partBDefs = () => `<linearGradient id="bciv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F4EEDF"/><stop offset="1" stop-color="#C8BC9E"/></linearGradient>
${radial("bchina", ["#FFFFFF", "#EEF2F8", "#B8C4D4"], undefined, 0.4, 0.35, 0.7)}
<linearGradient id="bglass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8F0FF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#9AB0D0" stop-opacity="0.25"/><stop offset="1" stop-color="#5A6A8A" stop-opacity="0.5"/></linearGradient>
<linearGradient id="bwine" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#C2203A"/><stop offset="0.6" stop-color="#7A0A1E"/><stop offset="1" stop-color="#3A0408"/></linearGradient>`;

// --------------------------------------------------------- stone walls

/** Dressed stone courses over a face of the back wall, x0..x1, y0..y1. */
export function ashlar(x0: number, y0: number, x1: number, y1: number, tones: readonly string[], course = 14, seed = 1) {
  const out: string[] = [];
  for (let r = 0, y = y1; y > y0 - 0.1; r++, y -= course) {
    const top = Math.max(y0, y - course);
    let x = x0 - (r % 2 ? course * 0.9 : 0);
    let i = 0;
    while (x < x1) {
      const bw = course * (1.4 + rnd(seed * 31 + r * 7 + i) * 1.1);
      const a = Math.max(x0, x);
      const b = Math.min(x1, x + bw);
      if (b - a > 1) {
        const t = tones[Math.floor(rnd(seed * 13 + r * 5 + i * 3) * tones.length)];
        out.push(
          `<path d="${rrect(a + 0.6, top + 0.6, b - a - 1.2, y - top - 1.2, 1.2)}" fill="${t}"/>`,
          `<path d="M${f(a + 1.4)} ${f(y - 1.6)}V${f(top + 1.4)}H${f(b - 2)}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="0.7"/>`,
          `<path d="M${f(a + 1)} ${f(y - 0.8)}H${f(b - 0.8)}V${f(top + 1.4)}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="0.7"/>`,
        );
      }
      x += bw;
      i++;
    }
  }
  return out.join("");
}

/** A side wall of stone (the cellar's, the kitchen's), its courses in
 *  perspective, the archway in it (or none); `top` and `bottom` the wall's
 *  height on the back wall's plane. */
export function stoneSideWall(
  L: FlatLayout,
  wall: "left" | "right",
  tones: readonly string[],
  arch: { box: ArchBox; door: Door; color: string } | null,
  top = L.ceil,
) {
  const { at, floorY, w } = L;
  const wx = wall === "left" ? L.bx0 : L.bx1;
  const zFar = L.zFront;
  const edge = wall === "left" ? 0 : w;
  const id = `bsw${wall[0]}`;
  const pts = [at(wx, top, 0), at(wx, top, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  const out: string[] = [`<path d="${poly(pts)}" fill="${tones[1]}"/>`];
  const course = 14;
  const zs: number[] = [];
  for (let z = 0; z < L.zEdge * 1.25; ) {
    zs.push(z);
    z += 15 + (z / L.zEdge) * 4;
  }
  for (let r = 0, y = floorY; y > top - 0.1; r++, y -= course) {
    const yt = Math.max(top, y - course);
    for (let i = 0; i < zs.length - 1; i++) {
      const off = r % 2 ? (zs[i + 1] - zs[i]) * 0.5 : 0;
      const z0 = zs[i] + off;
      const z1 = zs[i + 1] + off;
      const t = tones[Math.floor(rnd(r * 17 + i * 5 + (wall === "left" ? 3 : 9)) * tones.length)];
      const q = [at(wx, yt + 0.6, z0 + 0.6), at(wx, yt + 0.6, z1 - 0.6), at(wx, y - 0.6, z1 - 0.6), at(wx, y - 0.6, z0 + 0.6)];
      out.push(`<path d="${poly(q)}" fill="${t}" stroke="#000" stroke-opacity="0.28" stroke-width="0.6"/>`);
    }
  }
  if (arch) out.push(archArt(L, arch.box, arch.door, arch.color));
  const c0 = at(wx, top, 0);
  const c1 = at(wx, floorY, 0);
  out.push(
    `<path d="M${f(c0[0])} ${f(c0[1])}L${f(c1[0])} ${f(c1[1])}" stroke="#000" stroke-opacity="0.5" stroke-width="2"/>`,
    `<defs><linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${f(wx)}" y1="0" x2="${f(edge)}" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}s)"/>`,
  );
  return out.join("");
}

/** A barrel vault of brick over the room, springing from the side walls
 *  at `spring` (on the back wall's plane) and running towards you, its
 *  ribs every so often; the back wall's lunette is left to the room. */
export function vaultArt(L: FlatLayout, spring: number, tones: readonly string[]) {
  const { at, bx0, bx1, vx } = L;
  const r = (bx1 - bx0) / 2;
  const zFar = L.zFront * 1.2;
  const out: string[] = [];
  const arc = (z: number, n = 24): P2[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const th = Math.PI - (Math.PI * i) / n;
      return at(vx + Math.cos(th) * r, spring - Math.sin(th) * r * 0.62, z);
    });
  // the vault's surface in bands, from the back wall out
  const zs = [0, 10, 22, 36, 52, 72, 96, 126, 170, zFar];
  for (let i = 0; i < zs.length - 1; i++) {
    const a = arc(zs[i]);
    const b = arc(zs[i + 1]).reverse();
    out.push(`<path d="${poly([...a, ...b])}" fill="${tones[i % tones.length]}" stroke="#000" stroke-opacity="0.25" stroke-width="0.6"/>`);
    // the bricks' joints along the band
    const joints: string[] = [];
    for (let k = 1; k < 12; k++) {
      const th = Math.PI - (Math.PI * (k + (i % 2) * 0.5)) / 12;
      const x = vx + Math.cos(th) * r;
      const y = spring - Math.sin(th) * r * 0.62;
      joints.push(line([at(x, y, zs[i]), at(x, y, zs[i + 1])]));
    }
    out.push(`<path d="${joints.join("")}" stroke="#000" stroke-opacity="0.22" stroke-width="0.6"/>`);
  }
  // stone ribs across it
  for (const z of [36, 126]) {
    const a = arc(z - 4);
    const b = arc(z + 4).reverse();
    out.push(`<path d="${poly([...a, ...b])}" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.8"/>`);
    out.push(`<path d="${line(arc(z - 3.4))}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/>`);
  }
  // darker up in the crown
  out.push(
    `<defs><linearGradient id="bvsh" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${f(spring)}"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`,
    `<path d="${poly([...arc(0), ...arc(zFar).reverse()])}" fill="url(#bvsh)"/>`,
  );
  return out.join("");
}

/** The back wall's outline under the vault: its round head. */
export function lunette(L: FlatLayout, spring: number): P2[] {
  const r = (L.bx1 - L.bx0) / 2;
  const pts: P2[] = [[L.bx0, L.floorY]];
  for (let i = 0; i <= 24; i++) {
    const th = Math.PI - (Math.PI * i) / 24;
    pts.push([L.vx + Math.cos(th) * r, spring - Math.sin(th) * r * 0.62]);
  }
  pts.push([L.bx1, L.floorY]);
  return pts;
}

// --------------------------------------------------------- the garden

/** A gate in the garden's back wall where a door would be: stone piers
 *  with urns, a wrought-iron arch over it (its name plate hangs there),
 *  and the gate as tonight has it: swung open (the path beyond, the next
 *  room's light at its end), shut and chained, or overgrown and boarded. */
export function gateArt(D: DoorBox, door: Door, color: string, id: string, floorY: number) {
  const { x, w } = D;
  const y = D.y + 8;
  const h = floorY - y;
  const pw = 9;
  const out: string[] = [];
  const pier = (px: number) => {
    const top = y - 12;
    return `<rect x="${f(px + 2)}" y="${f(top + 3)}" width="${pw}" height="${f(floorY - top)}" fill="#000" fill-opacity="0.4"/>
<rect x="${f(px)}" y="${f(top)}" width="${pw}" height="${f(floorY - top)}" fill="url(#pstoneh)" stroke="#2A2638" stroke-width="0.8"/>
${[0.25, 0.5, 0.75].map((k) => `<path d="M${f(px)} ${f(top + (floorY - top) * k)}h${pw}" stroke="#2A2638" stroke-opacity="0.6" stroke-width="0.6"/>`).join("")}
<rect x="${f(px - 1.5)}" y="${f(top - 3)}" width="${pw + 3}" height="4" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.7"/>
<path d="M${f(px + pw / 2 - 4)} ${f(top - 3)}h8l-1.5 -2.5c3 -1 3 -6 -0.5 -8.5h-4c-3.5 2.5 -3.5 7.5 -0.5 8.5Z" fill="url(#pstone)" stroke="#2A2638" stroke-width="0.7"/>
<path d="M${f(px + pw / 2 - 2.6)} ${f(top - 13)}c-1 -3 1.5 -5 2.6 -6c1.1 1 3.6 3 2.6 6Z" fill="#3E6A3A" stroke="#14300A" stroke-width="0.5"/>
<path d="M${f(px + 1.2)} ${f(floorY - 1)}V${f(top + 1)}" stroke="#fff" stroke-opacity="0.3" stroke-width="0.7"/>`;
  };
  const gx0 = x;
  const gx1 = x + w;
  if (door === "open") {
    // the path running out between dark hedges to the next room's light
    const fx0 = x + w * 0.38;
    const fx1 = x + w * 0.62;
    const fy = y + h * 0.42;
    out.push(
      `<defs>${radial(`${id}g`, [color, color, color], [0.85, 0.35, 0])}<linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, -0.3)}"/><stop offset="1" stop-color="#2A2A30"/></linearGradient></defs>`,
      `<rect x="${f(gx0)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#0A1418"/>`,
      `<rect x="${f(fx0 - 16)}" y="${f(fy - 26)}" width="${f(fx1 - fx0 + 32)}" height="40" fill="url(#${id}g)"/>`,
      `<path d="M${f(gx0)} ${f(y + h)}L${f(fx0)} ${f(fy)}H${f(fx1)}L${f(gx1)} ${f(y + h)}Z" fill="url(#${id}p)"/>`,
      `<path d="M${f(gx0)} ${f(y)}H${f(fx0 - 2)}V${f(fy)}L${f(gx0)} ${f(y + h)}Z" fill="#14281C"/>`,
      `<path d="M${f(gx1)} ${f(y)}H${f(fx1 + 2)}V${f(fy)}L${f(gx1)} ${f(y + h)}Z" fill="#102016"/>`,
    );
    // the gate leaves swung back against the piers
    for (const side of [-1, 1]) {
      const hx = side < 0 ? gx0 : gx1;
      const ex = hx - side * 7;
      out.push(
        `<path d="M${f(hx)} ${f(y + 2)}L${f(ex)} ${f(y + 6)}V${f(y + h - 4)}L${f(hx)} ${f(y + h - 2)}" fill="none" stroke="#0E1014" stroke-width="2.4"/>`,
        `<path d="M${f(hx - side * 2.3)} ${f(y + 3)}V${f(y + h - 3)}M${f(hx - side * 4.6)} ${f(y + 4.5)}V${f(y + h - 3.5)}" stroke="#1A1E24" stroke-width="1.2"/>`,
      );
    }
  } else {
    out.push(`<rect x="${f(gx0)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#0C1612"/>`);
    // the gate shut: iron bars with spear heads, two rails, scrolls
    const bars: string[] = [];
    const heads: string[] = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const bx = gx0 + 2 + ((w - 4) * i) / n;
      const top = y + 6 + Math.abs(i - n / 2) * 1.6;
      bars.push(`M${f(bx)} ${f(top)}V${f(y + h - 1)}`);
      heads.push(`M${f(bx - 1.6)} ${f(top + 1)}L${f(bx)} ${f(top - 3.4)}L${f(bx + 1.6)} ${f(top + 1)}Z`);
    }
    const rails = `M${f(gx0)} ${f(y + 16)}H${f(gx1)}M${f(gx0)} ${f(y + h - 10)}H${f(gx1)}`;
    const scrolls = [gx0 + w * 0.25, gx0 + w * 0.75]
      .map((sx) => `M${f(sx - 6)} ${f(y + 26)}c0 -6 6 -6 6 -2c0 -4 6 -4 6 2`)
      .join("");
    out.push(
      `<path d="${bars.join("")}${rails}${scrolls}" fill="none" stroke="#0E1014" stroke-width="2.6"/>`,
      `<path d="${bars.join("")}${rails}${scrolls}" fill="none" stroke="url(#pironh)" stroke-width="1.2"/>`,
      `<path d="${heads.join("")}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`,
      `<path d="M${f(gx0 + w / 2)} ${f(y + 6)}V${f(y + h)}" stroke="#05070A" stroke-width="1"/>`,
    );
    if (door === "locked") {
      // a chain round the two leaves, a padlock on it
      const cy = y + h * 0.5;
      const links: string[] = [];
      for (let i = -3; i <= 3; i++) links.push(`<path d="${oval(gx0 + w / 2 + i * 3.4, cy + Math.abs(i) * 0.6, 2.2, 1.3)}" fill="none" stroke="#C8CCD4" stroke-width="0.9"/>`);
      out.push(
        links.join(""),
        `<path d="M${f(gx0 + w / 2 - 3)} ${f(cy + 4)}a3 3.4 0 0 1 6 0" fill="none" stroke="#9AA2AE" stroke-width="1.4"/>`,
        `<path d="${rrect(gx0 + w / 2 - 5, cy + 4, 10, 9, 1.8)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
        `<circle cx="${f(gx0 + w / 2)}" cy="${f(cy + 8.5)}" r="1.1" fill="${INK}"/>`,
      );
    } else {
      // shut for good: planks across, ivy grown over
      const pk = `M${f(gx0 - 3)} ${f(y + h * 0.3)}L${f(gx1 + 3)} ${f(y + h * 0.7)}M${f(gx0 - 3)} ${f(y + h * 0.7)}L${f(gx1 + 3)} ${f(y + h * 0.3)}`;
      const ivy: string[] = [];
      for (let i = 0; i < 26; i++) {
        const lx = gx0 + rnd(i * 3 + 1) * w;
        const ly = y + h * 0.15 + rnd(i * 5 + 2) * h * 0.85;
        ivy.push(`M${f(lx)} ${f(ly)}c-2 -2 -1 -4 0 -4c1 0 2 2 0 4Z`);
      }
      out.push(
        `<path d="${pk}" stroke="${WOOD_INK}" stroke-width="7" stroke-linecap="round"/>`,
        `<path d="${pk}" stroke="url(#poakh)" stroke-width="5" stroke-linecap="round"/>`,
        `<path d="${ivy.join("")}" fill="#3E7A3E" stroke="#14300A" stroke-width="0.5"/>`,
      );
    }
  }
  // the iron arch over the gate, where its plate hangs
  const ay = y - 14;
  out.push(
    pier(gx0 - pw),
    pier(gx1),
    `<path d="M${f(gx0)} ${f(y - 2)}Q${f(x + w / 2)} ${f(ay - 22)} ${f(gx1)} ${f(y - 2)}" fill="none" stroke="#0E1014" stroke-width="3"/>`,
    `<path d="M${f(gx0)} ${f(y - 2)}Q${f(x + w / 2)} ${f(ay - 22)} ${f(gx1)} ${f(y - 2)}" fill="none" stroke="url(#pironh)" stroke-width="1.4"/>`,
    `<path d="M${f(gx0)} ${f(y + 3)}H${f(gx1)}" stroke="#0E1014" stroke-width="2.4"/>`,
    `<path d="M${f(gx0)} ${f(y + 3)}H${f(gx1)}" stroke="#7A808A" stroke-width="1"/>`,
  );
  return out.join("");
}

/** A clipped yew hedge as a side wall, running from the back wall to the
 *  front, `top` its height on the back wall's plane: dark leaves in
 *  perspective, lit along its top, its foot in shadow. */
export function hedgeSideWall(L: FlatLayout, wall: "left" | "right", top: number) {
  const { at, floorY, w } = L;
  const wx = wall === "left" ? L.bx0 : L.bx1;
  const zFar = L.zFront;
  const id = `bhd${wall[0]}`;
  const edge = wall === "left" ? 0 : w;
  const pts = [at(wx, top, 0), at(wx, top, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  const out: string[] = [
    `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(wx)}" y1="0" x2="${f(edge)}" y2="0"><stop offset="0" stop-color="#2E5A3A"/><stop offset="0.5" stop-color="#1E4430"/><stop offset="1" stop-color="#0E2418"/></linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id})"/>`,
  ];
  // tufts of leaves over it, smaller further back
  const tufts: string[] = [];
  const lit: string[] = [];
  for (let i = 0; i < 260; i++) {
    const z = rnd(i * 7 + 1) ** 0.8 * L.zEdge * 1.3;
    const y = top + rnd(i * 11 + 3) * (floorY - top);
    const [sx, sy] = at(wx, y, z);
    const s = 2.4 * L.k(z);
    const d = `M${f(sx)} ${f(sy - s)}c${f(s)} 0 ${f(s)} ${f(s * 1.6)} 0 ${f(s * 1.6)}c${f(-s)} 0 ${f(-s)} ${f(-s * 1.6)} 0 ${f(-s * 1.6)}Z`;
    if (rnd(i * 13) > 0.6) lit.push(d);
    else tufts.push(d);
  }
  out.push(
    `<path d="${tufts.join("")}" fill="#14301E" fill-opacity="0.8"/>`,
    `<path d="${lit.join("")}" fill="#4A8A5A" fill-opacity="0.45"/>`,
    `<path d="${line([at(wx, top, 0), at(wx, top, zFar)])}" stroke="#7AB88A" stroke-opacity="0.5" stroke-width="1.4"/>`,
    `<path d="${line([at(wx, floorY - 4, 0), at(wx, floorY - 4, zFar)])}" stroke="#000" stroke-opacity="0.5" stroke-width="5"/>`,
  );
  return out.join("");
}

/** Flagstones over the floor: big slabs in courses running towards you,
 *  each a shade of its own, the joints dark. */
export function flagFloor(L: FlatLayout, tones: readonly string[], seed = 1) {
  const { w, h, floorY, at, zFront } = L;
  const span = (L.bx1 - L.bx0) * 1.3;
  const out: string[] = [`<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="${tones[1]}"/>`];
  const n = 9;
  const xs = Array.from({ length: n + 1 }, (_, i) => L.vx - span + (2 * span * i) / n);
  const zs: number[] = [0];
  for (let z = 0; z < zFront; ) {
    z += 22 + z * 0.18;
    zs.push(Math.min(z, zFront + 40));
  }
  for (let r = 0; r < zs.length - 1; r++) {
    for (let i = 0; i < n + 1; i++) {
      const off = r % 2 ? 0.5 : 0;
      const x0 = xs[0] + ((2 * span) / n) * (i - off);
      const x1 = x0 + (2 * span) / n;
      const t = tones[Math.floor(rnd(seed * 7 + r * 11 + i * 3) * tones.length)];
      const pts = [at(x0 + 1, floorY, zs[r] + 0.8), at(x1 - 1, floorY, zs[r] + 0.8), at(x1 - 1, floorY, zs[r + 1] - 0.8), at(x0 + 1, floorY, zs[r + 1] - 0.8)];
      out.push(`<path d="${poly(pts)}" fill="${t}" stroke="#0A0C10" stroke-opacity="0.6" stroke-width="0.9"/>`);
      const [a] = pts;
      const b = pts[1];
      out.push(`<path d="M${f(a[0])} ${f(a[1] + 0.8)}L${f(b[0])} ${f(b[1] + 0.8)}" stroke="#fff" stroke-opacity="0.07" stroke-width="0.8"/>`);
    }
  }
  return out.join("");
}

/** A wooden crate in the room (planks, a cross brace, nail heads). */
export function crate(L: FlatLayout, x0: number, x1: number, yt: number, z0: number, z1: number) {
  const yb = L.floorY;
  const out = [box(L, x0, x1, yt, yb, z0, z1, { front: "url(#poakh)", top: "url(#poak)", side: "url(#poakd)" })];
  const front: P3[] = [
    [x0 + 2, yt + 2, z1],
    [x1 - 2, yb - 2, z1],
  ];
  const back: P3[] = [
    [x1 - 2, yt + 2, z1],
    [x0 + 2, yb - 2, z1],
  ];
  out.push(
    `<path d="${stroke(L, front)}${stroke(L, back)}" stroke="${WOOD_INK}" stroke-width="2.6"/>`,
    `<path d="${stroke(L, front)}" stroke="url(#poakh)" stroke-width="1.4"/>`,
  );
  for (const y of [yt + (yb - yt) / 3, yt + (2 * (yb - yt)) / 3])
    out.push(`<path d="${stroke(L, [[x0, y, z1], [x1, y, z1]])}" stroke="${WOOD_INK}" stroke-opacity="0.6" stroke-width="0.6"/>`);
  return out.join("");
}

/** A cobweb in a corner of the screen at (x, y), opening `dir` (±1)
 *  across and down, r in size. */
export function cobweb(x: number, y: number, r: number, dir: 1 | -1) {
  const spokes: string[] = [];
  const rings: string[] = [];
  const n = 6;
  const ang = (i: number) => (Math.PI / 2) * (i / (n - 1));
  for (let i = 0; i < n; i++) {
    const a = ang(i);
    spokes.push(`M${f(x)} ${f(y)}L${f(x + dir * Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`);
  }
  for (const k of [0.3, 0.55, 0.8]) {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = ang(i);
      return [x + dir * Math.cos(a) * r * k, y + Math.sin(a) * r * k] as const;
    });
    rings.push(
      `M${f(pts[0][0])} ${f(pts[0][1])}` +
        pts
          .slice(1)
          .map((p, i) => `Q${f((p[0] + pts[i][0]) / 2 + dir * -1.5 * k * 3)} ${f((p[1] + pts[i][1]) / 2 - 1.5 * k * 3)} ${f(p[0])} ${f(p[1])}`)
          .join(""),
    );
  }
  return `<path d="${spokes.join("")}${rings.join("")}" fill="none" stroke="#E8ECF4" stroke-opacity="0.35" stroke-width="0.5"/>`;
}

/** A plain side wall (the kitchen's lime-wash): its plaster in
 *  perspective, a band of tiles from the floor to `dado`, the skirting,
 *  the archway in it (or none). `plaster` light to dark; `tile` draws a
 *  tile's motif at a point of the wall (or none). */
export function plainSideWall(
  L: FlatLayout,
  wall: "left" | "right",
  plaster: readonly string[],
  dado: number,
  arch: { box: ArchBox; door: Door; color: string } | null,
) {
  const { at, ceil, floorY, w, h } = L;
  const wx = wall === "left" ? L.bx0 : L.bx1;
  const zFar = L.zFront;
  const edge = wall === "left" ? 0 : w;
  const id = `bpw${wall[0]}`;
  const pts = [at(wx, ceil, 0), at(wx, ceil, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  const out: string[] = [
    `<defs><linearGradient id="${id}p" gradientUnits="userSpaceOnUse" x1="${f(wall === "left" ? 0 : w)}" y1="0" x2="${f(wall === "left" ? L.bx0 * 1.4 : w - L.bx0 * 1.4)}" y2="${f(h * 0.3)}">${plaster
      .map((c, i) => `<stop offset="${f(i / (plaster.length - 1))}" stop-color="${c}"/>`)
      .join("")}</linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}p)"/>`,
  ];
  // the tiles: a grid of white squares with a blue mark, in perspective
  const tiles: string[] = [];
  const marks: string[] = [];
  const ts = 9;
  for (let y = floorY - 8; y > dado + 0.1; y -= ts) {
    for (let z = 0; z < L.zEdge * 1.2; z += ts) {
      if (arch && z + ts > arch.box.z0 - 6 && z < arch.box.z1 + 6) continue;
      const q = [at(wx, y - ts + 0.5, z + 0.5), at(wx, y - ts + 0.5, z + ts - 0.5), at(wx, y - 0.5, z + ts - 0.5), at(wx, y - 0.5, z + 0.5)];
      tiles.push(poly(q));
      const [mx, my] = at(wx, y - ts / 2, z + ts / 2);
      const r = 1.6 * L.k(z);
      marks.push(`M${f(mx)} ${f(my - r)}L${f(mx + r * 0.5)} ${f(my)}L${f(mx)} ${f(my + r)}L${f(mx - r * 0.5)} ${f(my)}Z`);
    }
  }
  out.push(
    `<path d="${tiles.join("")}" fill="#EEF2F6" stroke="#8A96A8" stroke-width="0.5"/>`,
    `<path d="${marks.join("")}" fill="#2A5AA8" fill-opacity="0.8"/>`,
    `<path d="${line([at(wx, dado, 0), at(wx, dado, zFar)])}" stroke="#2A5AA8" stroke-width="1.6"/>`,
    `<path d="${line([at(wx, floorY - 4, 0), at(wx, floorY - 4, zFar)])}" stroke="#3A2A1A" stroke-width="5"/>`,
  );
  if (arch) out.push(archArt(L, arch.box, arch.door, arch.color));
  const c0 = at(wx, ceil, 0);
  const c1 = at(wx, floorY, 0);
  out.push(
    `<path d="M${f(c0[0])} ${f(c0[1])}L${f(c1[0])} ${f(c1[1])}" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>`,
    `<defs><linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${f(wx)}" y1="0" x2="${f(edge)}" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}s)"/>`,
  );
  return out.join("");
}

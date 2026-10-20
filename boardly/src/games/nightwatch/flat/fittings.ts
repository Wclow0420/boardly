// More parts the flat-on rooms share (parts.ts has the first ones): side
// walls of dressed stone, floors of marble chequer and of flagstones, a
// ribbed stone vault and an open timber roof, pointed and round arches,
// stained glass, candlesticks, sconces and gilt frames. SVG markup in the
// house style (gradients lit from the upper left, an ink outline, one
// line of shine), baked once with the room.

import { linear, radial } from "@/components/engraved/panel";
import { shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { Door } from "@/components/iso/kit";
import type { ArchBox, FlatLayout } from "./layout";
import { INK, WOOD_INK, archArt, f, line, lit, poly, rnd, type P2 } from "./parts";

export const STONE_INK = "#141A2E";
export const LEAD = "#10131E";
/** Blue-grey ashlar, light to dark (the lobby's chapel). */
export const ASHLAR = ["#56618A", "#3E4870", "#2A3254"];
export const ASHLAR_LIGHT = ["#9AA6CA", "#66729C", "#3E4870"];
export const MARBLE = ["#F4F0E6", "#D8D0BE", "#B0A690"];
export const BRONZE = ["#FCD9B0", "#C27A3E", "#6E3A16", "#E2A266"];
export const GLASS = {
  ruby: "#C2203A",
  amber: "#F2A03A",
  green: "#4E9A3A",
  blue: "#3A6AC8",
  violet: "#7A4AB8",
};

/** The gradients these parts use (put once in the room's defs, beside
 *  partDefs). */
export const fittingDefs = () =>
  `${linear("fsl", ASHLAR_LIGHT)}${linear("fslh", ASHLAR_LIGHT, false)}
${linear("fmar", MARBLE)}${linear("fmarh", MARBLE, false)}
${linear("fbrz", BRONZE)}${linear("fbrzh", BRONZE, false)}
${linear("fciv", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], false)}
${linear("fnight", ["#2E4684", "#1A2A5A", "#0C1634"])}
${linear("fglass", ["#B8D0F4", "#6A88C4", "#2E4684"])}
${radial("famb", ["#FFF2C8", "#F2A03A", "#9A4A10"], undefined, 0.4, 0.35, 0.7)}
${radial("fmoonglow", ["#F4F6FF", "#B8D0F4", "#B8D0F4"], [0.9, 0.35, 0])}
${radial("fruby", ["#FFC8D0", "#C2203A", "#4A0610"], undefined, 0.38, 0.32, 0.75)}`;

// ---------------------------------------------------------- arches

/** A pointed arch, x..x+w wide, its point at y, its sides springing `s`
 *  below the point and running down to y + h. */
export const pointed = (x: number, y: number, w: number, h: number, s: number) =>
  `M${f(x)} ${f(y + h)}V${f(y + s)}C${f(x)} ${f(y + s * 0.45)} ${f(x + w * 0.3)} ${f(y + s * 0.12)} ${f(x + w / 2)} ${f(y)}C${f(x + w * 0.7)} ${f(y + s * 0.12)} ${f(x + w)} ${f(y + s * 0.45)} ${f(x + w)} ${f(y + s)}V${f(y + h)}Z`;

/** A round-headed opening x..x+w, its crown at y, down to y + h. */
export const rounded = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y + h)}V${f(y + w / 2)}A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)}V${f(y + h)}Z`;

// ------------------------------------------------------- the back wall

/** Courses of dressed stone over a box: blocks a shade apart, dark
 *  joints, a lit edge on every other block. */
export function ashlar(x0: number, y0: number, x1: number, y1: number, course = 15, block = 34, seed = 1) {
  const tones: string[] = [];
  const joints: string[] = [];
  const shine: string[] = [];
  for (let r = 0, y = y0; y < y1; r++, y += course) {
    joints.push(`M${f(x0)} ${f(y)}H${f(x1)}`);
    const off = r % 2 ? 0 : block / 2;
    for (let x = x0 - off, c = 0; x < x1; x += block, c++) {
      const v = rnd(r * 31 + c + seed * 7);
      const bx = Math.max(x0, x);
      const bw = Math.min(x1, x + block) - bx;
      const bh = Math.min(course, y1 - y);
      if (v > 0.5)
        tones.push(
          `<rect x="${f(bx)}" y="${f(y)}" width="${f(bw)}" height="${f(bh)}" fill="${v > 0.8 ? "#fff" : "#000"}" fill-opacity="${v > 0.8 ? 0.06 : 0.1}"/>`,
        );
      if (x > x0) joints.push(`M${f(x)} ${f(y)}v${f(bh)}`);
      if (v < 0.4) shine.push(`M${f(bx + 1.5)} ${f(y + 1.6)}h${f(Math.max(0, bw - 6))}`);
    }
  }
  return `${tones.join("")}<path d="${joints.join("")}" stroke="${STONE_INK}" stroke-opacity="0.8" stroke-width="0.9"/><path d="${shine.join("")}" stroke="#fff" stroke-opacity="0.12" stroke-width="0.7"/>`;
}

// ------------------------------------------------------ the side walls

/** A side wall of dressed stone in perspective (the coursing running back
 *  to the corner), its archway (or none), the shade towards the edge.
 *  `colors` light to dark. */
export function stoneSideWall(
  L: FlatLayout,
  wall: "left" | "right",
  colors: readonly string[],
  arch: { box: ArchBox; door: Door; color: string } | null,
  course = 15,
) {
  const { at, ceil, floorY, w, h } = L;
  const wx = wall === "left" ? L.bx0 : L.bx1;
  const zFar = L.zFront;
  const edge = wall === "left" ? 0 : w;
  const id = `fsw${wall[0]}`;
  const pts = [at(wx, ceil, 0), at(wx, ceil, zFar), at(wx, floorY, zFar), at(wx, floorY, 0)];
  const out: string[] = [
    `<defs>${lit(`${id}p`, colors, wall === "left" ? 0 : w, 0, wall === "left" ? L.bx0 * 1.4 : w - L.bx0 * 1.4, h * 0.3)}</defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}p)"/>`,
  ];
  // the courses, and the joints between blocks, staggered
  const lines: string[] = [];
  const tones: string[] = [];
  const zs: number[] = [];
  for (let z = 0; z < zFar; z += 26) zs.push(z);
  for (let r = 0, y = ceil + 6; y < floorY; r++, y += course) {
    lines.push(line([at(wx, y, 0), at(wx, y, zFar)]));
    for (let i = 0; i < zs.length; i++) {
      const z = zs[i] + (r % 2 ? 13 : 0);
      lines.push(line([at(wx, y, z), at(wx, Math.min(floorY, y + course), z)]));
      const v = rnd(r * 17 + i * 5 + (wall === "left" ? 3 : 9));
      if (v > 0.62) {
        const q = [at(wx, y, z), at(wx, y, z + 26), at(wx, Math.min(floorY, y + course), z + 26), at(wx, Math.min(floorY, y + course), z)];
        tones.push(`<path d="${poly(q)}" fill="${v > 0.85 ? "#fff" : "#000"}" fill-opacity="${v > 0.85 ? 0.05 : 0.1}"/>`);
      }
    }
  }
  out.push(tones.join(""), `<path d="${lines.join("")}" stroke="${STONE_INK}" stroke-opacity="0.7" stroke-width="0.8"/>`);
  if (arch) out.push(archArt(L, arch.box, arch.door, arch.color));
  const c0 = at(wx, ceil, 0);
  const c1 = at(wx, floorY, 0);
  out.push(
    `<path d="M${f(c0[0])} ${f(c0[1])}L${f(c1[0])} ${f(c1[1])}" stroke="#000" stroke-opacity="0.45" stroke-width="2"/>`,
    `<defs><linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${f(wx)}" y1="0" x2="${f(edge)}" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient></defs>`,
    `<path d="${poly(pts)}" fill="url(#${id}s)"/>`,
  );
  return out.join("");
}

// ------------------------------------------------------------ floors

/** The floor as a chequer of two stones, tiles square in the room's
 *  perspective, a fine joint and a sheen on the light ones. */
export function chequerFloor(L: FlatLayout, light: readonly string[], dark: readonly string[], across = 11, id = "fchq") {
  const { w, h, floorY, at, zFront } = L;
  const span = (L.bx1 - L.bx0) * 1.25;
  const size = (2 * span) / across;
  const xs = Array.from({ length: across + 1 }, (_, i) => L.vx - span + size * i);
  const out: string[] = [
    `<defs>${lit(`${id}d`, dark, 0, floorY, 0, h)}${lit(`${id}l`, light, 0, floorY, w * 0.4, h)}</defs>`,
    `<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#${id}d)"/>`,
  ];
  const lights: string[] = [];
  const joints: string[] = [];
  for (let r = 0, z = 0; z < zFront + size; r++, z += size) {
    for (let i = 0; i < across; i++) {
      if ((i + r) % 2) continue;
      lights.push(poly([at(xs[i], floorY, z), at(xs[i + 1], floorY, z), at(xs[i + 1], floorY, z + size), at(xs[i], floorY, z + size)]));
    }
    joints.push(line([at(L.vx - span * 2, floorY, z), at(L.vx + span * 2, floorY, z)]));
  }
  for (const x of xs) joints.push(line([at(x, floorY, 0), at(x, floorY, zFront + size)]));
  out.push(
    `<path d="${lights.join("")}" fill="url(#${id}l)"/>`,
    `<path d="${joints.join("")}" stroke="#000" stroke-opacity="0.35" stroke-width="0.8"/>`,
  );
  return out.join("");
}

/** Flagstones: courses running across, each stone its own size and tone,
 *  the grout dark. */
export function flagFloor(L: FlatLayout, colors: readonly string[], id = "fflag") {
  const { w, h, floorY, at, zFront } = L;
  const span = (L.bx1 - L.bx0) * 1.3;
  const out: string[] = [
    `<defs>${lit(id, colors, 0, floorY, w * 0.3, h)}</defs>`,
    `<rect y="${f(floorY)}" width="${w}" height="${f(h - floorY)}" fill="url(#${id})"/>`,
  ];
  const grout: string[] = [];
  const tones: string[] = [];
  let z = 0;
  for (let r = 0; z < zFront; r++) {
    const d = 26 + rnd(r * 3.3) * 18;
    let x = L.vx - span - rnd(r * 7.1) * 30;
    for (let c = 0; x < L.vx + span; c++) {
      const sw = 34 + rnd(r * 11 + c * 3) * 30;
      const v = rnd(r * 13 + c * 7 + 1);
      const q = [at(x, floorY, z), at(x + sw, floorY, z), at(x + sw, floorY, z + d), at(x, floorY, z + d)];
      tones.push(`<path d="${poly(q)}" fill="${v > 0.5 ? "#fff" : "#000"}" fill-opacity="${f(0.03 + Math.abs(v - 0.5) * 0.14)}"/>`);
      grout.push(line([at(x, floorY, z), at(x, floorY, z + d)]));
      x += sw;
    }
    grout.push(line([at(L.vx - span * 1.6, floorY, z), at(L.vx + span * 1.6, floorY, z)]));
    z += d;
  }
  out.push(tones.join(""), `<path d="${grout.join("")}" stroke="#05070E" stroke-opacity="0.55" stroke-width="0.9"/>`);
  return out.join("");
}

/** A runner on the floor from the back wall towards you, x0..x1 wide,
 *  z0..z1 deep: its field, a border in `edge`, a gold line, a fringe. */
export function runnerArt(L: FlatLayout, x0: number, x1: number, z0: number, z1: number, field: readonly string[], edge: string, id: string) {
  const { at, floorY } = L;
  const q = (a: number, b: number, c: number, d: number) => poly([at(a, floorY, c), at(b, floorY, c), at(b, floorY, d), at(a, floorY, d)]);
  const bw = (x1 - x0) * 0.1;
  const fringe: string[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = x0 + ((x1 - x0) * i) / 14;
    fringe.push(line([at(x, floorY, z1), at(x, floorY, z1 + 5)]));
  }
  return `<defs>${linear(id, field)}</defs>
<path d="${q(x0, x1, z0, z1)}" fill="#000" fill-opacity="0.3" transform="translate(0 2)"/>
<path d="${q(x0, x1, z0, z1)}" fill="${edge}" stroke="#0A0610" stroke-width="0.8"/>
<path d="${q(x0 + bw, x1 - bw, z0, z1 - 4)}" fill="url(#${id})" stroke="#E2B04A" stroke-opacity="0.85" stroke-width="1"/>
<path d="${q(x0 + bw * 0.45, x1 - bw * 0.45, z0, z1 - 2)}" fill="none" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="0.7" stroke-dasharray="3 2"/>
<path d="${fringe.join("")}" stroke="#E8DCC0" stroke-opacity="0.55" stroke-width="0.7"/>`;
}

// ----------------------------------------------------------- ceilings

/** A ribbed stone vault over the room: the cells in dusk blue, ribs of
 *  pale stone meeting in gold bosses, a corbel table along the wall. */
export function vaultArt(L: FlatLayout) {
  const { w, ceil, bx0, bx1, at } = L;
  const zTop = L.F * (1 - (L.vy - ceil) / L.vy);
  const out: string[] = [`<defs>${linear("fvault", ["#0C1230", "#1A2448", "#2A3460"])}</defs><rect width="${w}" height="${f(ceil)}" fill="url(#fvault)"/>`];
  const ribs: string[] = [];
  const bosses: string[] = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const xa = bx0 + ((bx1 - bx0) * i) / n;
    const xb = bx0 + ((bx1 - bx0) * (i + 1)) / n;
    const a = at(xa, ceil, 0);
    const b = at(xb, ceil, 0);
    const c = at((xa + xb) / 2, ceil, zTop * 1.4);
    const ca = at(xa, ceil, zTop * 1.6);
    ribs.push(`M${f(a[0])} ${f(a[1])}Q${f((a[0] + c[0]) / 2)} ${f(a[1] - 4)} ${f(c[0])} ${f(c[1])}Q${f((b[0] + c[0]) / 2)} ${f(b[1] - 4)} ${f(b[0])} ${f(b[1])}`);
    ribs.push(line([a, ca]));
    bosses.push(`<circle cx="${f(c[0])}" cy="${f(Math.max(4, c[1]))}" r="2.6" fill="url(#pgd)" stroke="${INK}" stroke-width="0.6"/>`);
  }
  ribs.push(line([at(bx1, ceil, 0), at(bx1, ceil, zTop * 1.6)]));
  out.push(
    `<path d="${ribs.join("")}" fill="none" stroke="${STONE_INK}" stroke-width="4.2"/>`,
    `<path d="${ribs.join("")}" fill="none" stroke="url(#fslh)" stroke-width="2.4"/>`,
    bosses.join(""),
  );
  // the corbel table along the top of the back wall
  const corbels: string[] = [];
  for (let x = bx0; x < bx1 - 2; x += 12) corbels.push(`M${f(x)} ${f(ceil + 7)}V${f(ceil + 4)}Q${f(x)} ${f(ceil - 1)} ${f(x + 6)} ${f(ceil - 2)}Q${f(x + 12)} ${f(ceil - 1)} ${f(x + 12)} ${f(ceil + 4)}`);
  out.push(
    `<rect x="${f(bx0 - 2)}" y="${f(ceil - 3)}" width="${f(bx1 - bx0 + 4)}" height="5" fill="url(#fslh)" stroke="${STONE_INK}" stroke-width="0.8"/>`,
    `<path d="${corbels.join("")}" fill="none" stroke="${STONE_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(bx0)} ${f(ceil - 2)}H${f(bx1)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.6"/>`,
  );
  return out.join("");
}

/** An open timber roof: the dark of the eaves, rafters running back to
 *  the wall plate, a tie beam strapped in iron. */
export function rafterArt(L: FlatLayout) {
  const { w, ceil, bx0, bx1, at } = L;
  const zTop = L.F * (1 - (L.vy - ceil) / L.vy);
  const out: string[] = [`<defs>${linear("froof", ["#06080E", "#100C10", "#1A1210"])}</defs><rect width="${w}" height="${f(ceil)}" fill="url(#froof)"/>`];
  const rafters: string[] = [];
  for (let i = -2; i <= 9; i++) {
    const x = bx0 + ((bx1 - bx0) * i) / 7;
    rafters.push(line([at(x, ceil, 0), at(x, ceil, zTop * 1.4)]));
  }
  out.push(
    `<path d="${rafters.join("")}" stroke="#05030A" stroke-width="5.5"/>`,
    `<path d="${rafters.join("")}" stroke="url(#poakh)" stroke-width="3.2"/>`,
  );
  // the wall plate along the top of the back wall, iron straps on it
  const straps: string[] = [];
  for (let x = bx0 + 20; x < bx1 - 10; x += 48)
    straps.push(
      `<rect x="${f(x - 3)}" y="${f(ceil - 5)}" width="6" height="10" fill="url(#piron)" stroke="#0E1014" stroke-width="0.6"/><circle cx="${f(x)}" cy="${f(ceil - 2)}" r="0.9" fill="#C8CCD4"/><circle cx="${f(x)}" cy="${f(ceil + 2.4)}" r="0.9" fill="#C8CCD4"/>`,
    );
  out.push(
    `<rect x="${f(bx0 - 3)}" y="${f(ceil - 5)}" width="${f(bx1 - bx0 + 6)}" height="9" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="M${f(bx0)} ${f(ceil - 4)}H${f(bx1)}" stroke="#F0D0A8" stroke-opacity="0.3" stroke-width="0.7"/>`,
    straps.join(""),
  );
  return out.join("");
}

// ------------------------------------------------------- stained glass

/** A lancet of stained glass, a pointed light x..x+w from y to y + h: a
 *  stone surround, a border of coloured quarries, a field of `field`
 *  glass leaded in diamonds, a roundel of `jewel` in the middle; lit
 *  from behind by the night. */
export function lancetArt(x: number, y: number, w: number, h: number, field: string, jewel: string, id: string) {
  const s = w * 0.62;
  const t = 3.5;
  const shape = pointed(x, y, w, h, s);
  const inner = pointed(x + t, y + t, w - 2 * t, h - t, s - t * 0.6);
  const ix = x + t;
  const iw = w - 2 * t;
  const quarry: string[] = [];
  for (let d = -h; d < w + h; d += 6) quarry.push(`M${f(x + d)} ${f(y)}L${f(x + d + h * 0.6)} ${f(y + h)}M${f(x + d)} ${f(y)}L${f(x + d - h * 0.6)} ${f(y + h)}`);
  const border: string[] = [];
  const cols = [GLASS.ruby, GLASS.amber, GLASS.green, GLASS.amber, GLASS.blue];
  const b = Math.max(2.2, iw * 0.14);
  for (let yy = y + s, n = 0; yy < y + h - 1; yy += 6, n++) {
    border.push(
      `<rect x="${f(ix)}" y="${f(yy)}" width="${f(b)}" height="6" fill="${cols[n % cols.length]}"/><rect x="${f(ix + iw - b)}" y="${f(yy)}" width="${f(b)}" height="6" fill="${cols[(n + 2) % cols.length]}"/>`,
    );
  }
  const rx = x + w / 2;
  const ry = y + h * 0.52;
  const rr = Math.min(iw * 0.24, h * 0.1);
  return `<defs><clipPath id="${id}"><path d="${inner}"/></clipPath>${radial(`${id}g`, ["#FFFFFF", field, shade(field, -0.55)], [0.85, 1, 1], 0.4, 0.3, 0.8)}</defs>
<path d="${shape}" fill="#000" fill-opacity="0.4" transform="translate(1.2 2)"/>
<path d="${shape}" fill="url(#fsl)" stroke="${STONE_INK}" stroke-width="0.9"/>
<path d="${inner}" fill="url(#${id}g)"/>
<g clip-path="url(#${id})">
<path d="${quarry.join("")}" stroke="${LEAD}" stroke-opacity="0.75" stroke-width="0.6"/>
${border.join("")}
<path d="M${f(ix + b)} ${f(y + s)}V${f(y + h)}M${f(ix + iw - b)} ${f(y + s)}V${f(y + h)}" stroke="${LEAD}" stroke-width="0.6"/>
<circle cx="${f(rx)}" cy="${f(ry)}" r="${f(rr + 1.5)}" fill="${LEAD}"/>
<circle cx="${f(rx)}" cy="${f(ry)}" r="${f(rr)}" fill="${jewel}" stroke="${LEAD}" stroke-width="0.6"/>
<circle cx="${f(rx - rr * 0.3)}" cy="${f(ry - rr * 0.35)}" r="${f(rr * 0.25)}" fill="#fff" fill-opacity="0.7"/>
</g>
<path d="${inner}" fill="none" stroke="${LEAD}" stroke-width="1"/>
<path d="M${f(x + 1.2)} ${f(y + h - 2)}V${f(y + s)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>`;
}

/** A rose window: a stone ring, petals of coloured glass round an amber
 *  roundel, tracery spokes. */
export function roseArt(cx: number, cy: number, r: number, petals = 8) {
  const ps = Array.from({ length: petals }, (_, k) => {
    const a = (k / petals) * Math.PI * 2 - Math.PI / 2;
    const c = [GLASS.ruby, GLASS.blue, GLASS.amber, GLASS.blue][k % 4];
    const px = cx + Math.cos(a) * r * 0.52;
    const py = cy + Math.sin(a) * r * 0.52;
    return `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * (petals > 8 ? 0.2 : 0.24))}" fill="${c}" stroke="${LEAD}" stroke-width="0.8"/><path d="M${f(cx + Math.cos(a) * r * 0.28)} ${f(cy + Math.sin(a) * r * 0.28)}L${f(cx + Math.cos(a) * r * 0.78)} ${f(cy + Math.sin(a) * r * 0.78)}" stroke="${STONE_INK}" stroke-width="1"/>`;
  }).join("");
  return `<circle cx="${f(cx + 1.2)}" cy="${f(cy + 2)}" r="${f(r + 1)}" fill="#000" fill-opacity="0.4"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#fsl)" stroke="${STONE_INK}" stroke-width="1"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.8)}" fill="url(#fglass)" stroke="${STONE_INK}" stroke-width="0.9"/>
${ps}
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.24)}" fill="url(#famb)" stroke="${LEAD}" stroke-width="0.8"/>
<path d="M${f(cx - r * 0.8)} ${f(cy - r * 0.45)}A${f(r * 0.93)} ${f(r * 0.93)} 0 0 1 ${f(cx - r * 0.3)} ${f(cy - r * 0.88)}" stroke="#fff" stroke-opacity="0.55" stroke-width="1" fill="none" stroke-linecap="round"/>`;
}

// ------------------------------------------------------- candlesticks

/** A tall gilt candlestick standing on (x, foot): a three-footed base, a
 *  turned stem with knops, a drip pan, an ivory candle `ch` tall. Returns
 *  the markup and where its flame burns. */
export function candlestick(x: number, foot: number, height: number, ch = 14, s = 1) {
  const panY = foot - height;
  const top = panY - ch;
  const knops = [0.3, 0.62].map((k) => {
    const y = foot - height * k;
    return `<path d="M${f(x - 3.4 * s)} ${f(y)}Q${f(x)} ${f(y - 4 * s)} ${f(x + 3.4 * s)} ${f(y)}Q${f(x)} ${f(y + 4 * s)} ${f(x - 3.4 * s)} ${f(y)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>`;
  });
  const markup = `<path d="M${f(x - 9 * s)} ${f(foot + 1.5)}H${f(x + 9 * s)}" stroke="#000" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
<path d="M${f(x - 8 * s)} ${f(foot)}Q${f(x - 7 * s)} ${f(foot - 5 * s)} ${f(x - 2 * s)} ${f(foot - 8 * s)}H${f(x + 2 * s)}Q${f(x + 7 * s)} ${f(foot - 5 * s)} ${f(x + 8 * s)} ${f(foot)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<rect x="${f(x - 1.5 * s)}" y="${f(panY)}" width="${f(3 * s)}" height="${f(height - 8 * s)}" fill="url(#pgh)" stroke="${INK}" stroke-width="0.6"/>
${knops.join("")}
<path d="M${f(x - 5.5 * s)} ${f(panY)}H${f(x + 5.5 * s)}L${f(x + 3.5 * s)} ${f(panY + 2.6 * s)}H${f(x - 3.5 * s)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${f(x - 2.2 * s)}" y="${f(top)}" width="${f(4.4 * s)}" height="${f(ch)}" fill="url(#fciv)" stroke="${INK}" stroke-width="0.55"/>
<path d="M${f(x - 1.2 * s)} ${f(top + 1.5)}V${f(panY - 2)}" stroke="#fff" stroke-opacity="0.9" stroke-width="0.6"/>
<path d="M${f(x)} ${f(top)}v-1.8" stroke="#2A1A08" stroke-width="0.7"/>`;
  return { markup, flame: { x, y: top - 9 * s, s } };
}

/** A gilt wall sconce on the wall at (x, y): a back plate, a curled arm,
 *  a cup and an ivory candle. Returns the markup and its flame. */
export function sconce(x: number, y: number, s = 1) {
  const cupY = y + 4 * s;
  const top = cupY - 10 * s;
  const markup = `<path d="${rrect(x - 3 * s, y - 2 * s, 6 * s, 16 * s, 3 * s)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x)} ${f(y + 10 * s)}C${f(x + 6 * s)} ${f(y + 13 * s)} ${f(x + 7 * s)} ${f(y + 7 * s)} ${f(x)} ${f(cupY + 2 * s)}" fill="none" stroke="${INK}" stroke-width="2.8"/>
<path d="M${f(x)} ${f(y + 10 * s)}C${f(x + 6 * s)} ${f(y + 13 * s)} ${f(x + 7 * s)} ${f(y + 7 * s)} ${f(x)} ${f(cupY + 2 * s)}" fill="none" stroke="url(#pgh)" stroke-width="1.5"/>
<path d="M${f(x - 4.5 * s)} ${f(cupY)}H${f(x + 4.5 * s)}L${f(x + 2.5 * s)} ${f(cupY + 3 * s)}H${f(x - 2.5 * s)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${f(x - 2 * s)}" y="${f(top)}" width="${f(4 * s)}" height="${f(cupY - top)}" fill="url(#fciv)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x)} ${f(top)}v-1.6" stroke="#2A1A08" stroke-width="0.7"/>`;
  return { markup, flame: { x, y: top - 9 * s, s: 0.8 * s } };
}

// --------------------------------------------------------- gilt frames

/** A gilt frame x, y, w × h round `inner` (markup drawn in the opening,
 *  clipped), a moulding with a bead, corner rosettes, an optional crest. */
export function giltFrame(x: number, y: number, w: number, h: number, inner: string, id: string, crest = false) {
  const t = Math.max(4, Math.min(w, h) * 0.09);
  const crestArt = crest
    ? `<path d="M${f(x + w / 2 - 10)} ${f(y + 1)}C${f(x + w / 2 - 9)} ${f(y - 7)} ${f(x + w / 2 - 3)} ${f(y - 9)} ${f(x + w / 2)} ${f(y - 12)}C${f(x + w / 2 + 3)} ${f(y - 9)} ${f(x + w / 2 + 9)} ${f(y - 7)} ${f(x + w / 2 + 10)} ${f(y + 1)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/><circle cx="${f(x + w / 2)}" cy="${f(y - 4)}" r="2.2" fill="url(#fruby)" stroke="${INK}" stroke-width="0.5"/>`
    : "";
  return `<defs><clipPath id="${id}"><rect x="${f(x + t)}" y="${f(y + t)}" width="${f(w - 2 * t)}" height="${f(h - 2 * t)}"/></clipPath></defs>
<rect x="${f(x + 1.8)}" y="${f(y + 3)}" width="${f(w)}" height="${f(h)}" fill="#000" fill-opacity="0.45"/>
<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.9"/>
<rect x="${f(x + t * 0.45)}" y="${f(y + t * 0.45)}" width="${f(w - t * 0.9)}" height="${f(h - t * 0.9)}" fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.7" stroke-dasharray="1.2 1.4"/>
<g clip-path="url(#${id})">${inner}</g>
<rect x="${f(x + t)}" y="${f(y + t)}" width="${f(w - 2 * t)}" height="${f(h - 2 * t)}" fill="none" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(x + 1)} ${f(y + h - 2)}V${f(y + 1)}H${f(x + w * 0.6)}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/>
${[
  [x + t / 2, y + t / 2],
  [x + w - t / 2, y + t / 2],
  [x + t / 2, y + h - t / 2],
  [x + w - t / 2, y + h - t / 2],
]
  .map(([px, py]) => `<circle cx="${f(px)}" cy="${f(py)}" r="${f(t * 0.38)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`)
  .join("")}
${crestArt}`;
}

/** A shadow on the floor under something standing at the wall, from x0
 *  to x1, reaching out to z. */
export const footShadow = (L: FlatLayout, x0: number, x1: number, z0: number, z1: number, opacity = 0.45) => {
  const pts: P2[] = [L.at(x0, L.floorY, z0), L.at(x1, L.floorY, z0), L.at(x1 + 4, L.floorY, z1), L.at(x0 - 4, L.floorY, z1)];
  return `<path d="${poly(pts)}" fill="#000" fill-opacity="${opacity}"/>`;
};

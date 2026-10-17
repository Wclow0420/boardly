// The floor lobby's still art, as SVG markup baked once into images: the
// landing sign across the top (the lift's walnut and brass sunburst, the
// chevron frieze with the floor's crimson sign and its stepped fins, the
// corner studs, the brass room-number plate with the table's code and
// the QR button beside it), and the parts every game's room shares: the
// lift's door on the back wall (fluted brass pilasters, the chevron
// lintel with a little floor dial, the cab's walnut inside; the folding
// gate itself is drawn live, gate.ts), the boards, the name plates, the
// dashed meeple of a free spot, the pools of lamplight. Drawn in the
// house style: gradients lit from the upper left, an ink outline,
// grooves and one line of shine. A game's own room (its wall, its table)
// is in rooms.ts.

import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { BODY, LIFT } from "@/features/mascot/rig";
import type { RoomLayout, SignLayout } from "./layout";

const f = (n: number) => +n.toFixed(2);
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const WALNUT = ["#4A2C18", "#2E1A0E", "#1E1008"];

export const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;

/** A gradient lit from the upper left across a box (userSpace). */
export const lit = (id: string, colors: readonly string[], x0: number, y0: number, x1: number, y1: number) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)] as const;
};

/** A small round brass stud (needs the "fsv" gradient). */
const stud = (x: number, y: number, r: number) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#fsv)" stroke="${INK}" stroke-width="0.6"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.28)}" fill="#fff" fill-opacity="0.8"/>`;

/** A slotted screw head in brass (needs "fsv"). */
const screw = (x: number, y: number, r: number, deg: number) => {
  const [a, b] = pt(x, y, r * 0.7, deg);
  const [c, d] = pt(x, y, r * 0.7, deg + 180);
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#fsv)" stroke="${INK}" stroke-width="0.7"/><path d="M${a} ${b}L${c} ${d}" stroke="${INK}" stroke-width="1"/>`;
};

/** The chevron frieze between two gold mouldings, across x0..x1. */
function frieze(x0: number, x1: number, y: number, h: number, id: string) {
  const chevrons: string[] = [];
  for (let x = x0 - 6; x < x1 + 12; x += 14) {
    chevrons.push(`M${f(x)} ${f(y + h * 0.72)}L${f(x + 7)} ${f(y + h * 0.3)}L${f(x + 14)} ${f(y + h * 0.72)}`);
  }
  const band = (yy: number) =>
    `<rect x="${f(x0 - 2)}" y="${f(yy)}" width="${f(x1 - x0 + 4)}" height="5" fill="url(#${id}g)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(x0)} ${f(yy + 1.1)}H${f(x1)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`;
  return `<defs>${linear(`${id}f`, ["#1A2234", "#0C1018"])}${linear(`${id}g`, GOLD)}<clipPath id="${id}c"><rect x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="${f(h)}"/></clipPath></defs>
<rect x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="${f(h)}" fill="url(#${id}f)"/>
<g clip-path="url(#${id}c)"><path d="${chevrons.join("")}" fill="none" stroke="${INK}" stroke-width="3.2"/><path d="${chevrons.join("")}" fill="none" stroke="url(#${id}g)" stroke-width="1.8"/></g>
${band(y)}${band(y + h - 5)}`;
}

// --------------------------------------------------------- the landing

/** The landing sign, w × h: walnut and the brass sunburst behind the
 *  status bar, the chevron frieze with the floor's sign (no text: the
 *  page writes it) and the corner studs' bezels, the room-number plate
 *  and the QR button. */
export function signArt(L: SignLayout) {
  const { w, h, frieze: fr, sign, studs, plate: P, qr } = L;
  const cx = w / 2;
  const fy = fr.y + fr.h;
  // rays fanning up from behind the sign
  const rays = Array.from({ length: 23 }, (_, i) => {
    const deg = -90 + (180 * (i + 0.5)) / 23;
    const [x0, y0] = pt(cx, fy, 30, deg - 1.4);
    const [x1, y1] = pt(cx, fy, w, deg - 2.6);
    const [x2, y2] = pt(cx, fy, w, deg + 2.6);
    const [x3, y3] = pt(cx, fy, 30, deg + 1.4);
    return `<path d="M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z" fill="url(#fray)" fill-opacity="${i % 2 ? 0.4 : 0.7}" stroke="${INK}" stroke-width="0.5"/>`;
  }).join("");
  const grain = Array.from({ length: Math.ceil(h / 7) }, (_, i) => {
    const y = 3 + i * 7 + ((i * 37) % 5);
    return `<path d="M0 ${f(y)}C${f(w * 0.3)} ${f(y - 2)} ${f(w * 0.6)} ${f(y + 2.5)} ${w} ${f(y)}" fill="none" stroke="${i % 3 ? "#120804" : "#7A5030"}" stroke-opacity="${i % 3 ? 0.3 : 0.14}" stroke-width="0.8"/>`;
  }).join("");

  // the sign: a crimson enamel in a gold moulding, stepped fins each end
  const s = sign;
  const fins = [-1, 1]
    .map((k) => {
      const x = k < 0 ? s.x : s.x + s.w;
      const d = `M${x} ${s.y + 6}L${f(x + k * 10)} ${s.y + 6}L${f(x + k * 10)} ${s.y + 10}L${f(x + k * 17)} ${s.y + 10}L${f(x + k * 17)} ${f(s.y + s.h - 10)}L${f(x + k * 10)} ${f(s.y + s.h - 10)}L${f(x + k * 10)} ${f(s.y + s.h - 6)}L${x} ${f(s.y + s.h - 6)}Z`;
      return `<path d="${d}" fill="url(#fgv)" stroke="${INK}" stroke-width="0.9"/>`;
    })
    .join("");
  const signArtBody = `
<path d="${rrect(s.x, s.y + 3, s.w, s.h, 8)}" fill="#000" fill-opacity="0.45"/>
${fins}
${moulding(s.x, s.y, s.w, s.h, 8, 4, "fsg")}
<path d="${rrect(s.x + 4, s.y + 4, s.w - 8, s.h - 8, 5)}" fill="url(#fenamel)" stroke="#3A0408" stroke-width="0.9"/>
<path d="${rrect(s.x + 7, s.y + 7, s.w - 14, s.h - 14, 3)}" fill="none" stroke="#F0CC72" stroke-opacity="0.35" stroke-width="0.6"/>
<path d="M${f(s.x + 12)} ${s.y + 7.5}H${f(s.x + s.w * 0.45)}" stroke="#fff" stroke-opacity="0.32" stroke-width="1.8" stroke-linecap="round"/>`;

  // the corner studs' bezels: brass rings round dark iron faces
  const studArt = [studs.left, studs.right]
    .map(
      (c) => `<circle cx="${f(c.x + 0.8)}" cy="${f(c.y + 2)}" r="${studs.r + 1}" fill="#000" fill-opacity="0.5"/>
<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${studs.r}" fill="url(#fsv)" stroke="${INK}" stroke-width="1.1"/>
<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${studs.r - 3.6}" fill="url(#firon)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(studs.r - 1.8)}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${pt(c.x, c.y, studs.r - 1.2, -70).join(" ")}A${studs.r - 1.2} ${studs.r - 1.2} 0 0 1 ${pt(c.x, c.y, studs.r - 1.2, -18).join(" ")}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-opacity="0.85"/>`,
    )
    .join("");

  // the room-number plate: brushed brass in a moulding, a groove round
  // its face, a slotted screw at each end; and the QR button beside it
  const brushed = Array.from({ length: Math.floor((P.h - 10) / 2.2) }, (_, i) =>
    `<path d="M${P.x + 6} ${f(P.y + 6 + i * 2.2)}H${f(P.x + P.w - 6)}" stroke="${i % 2 ? "#FFF6D0" : "#8A5A16"}" stroke-opacity="${i % 2 ? 0.18 : 0.12}" stroke-width="0.6"/>`,
  ).join("");
  const plateArt = `
<path d="${rrect(P.x + 1, P.y + 3.5, P.w, P.h, 9)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(P.x, P.y, P.w, P.h, 9)}" fill="url(#fplate)"/>
${brushed}
${moulding(P.x, P.y, P.w, P.h, 9, 3, "fpm")}
<path d="${rrect(P.x + 6, P.y + 6, P.w - 12, P.h - 12, 5)}" fill="none" stroke="${VEIN}" stroke-width="0.8"/>
<path d="${rrect(P.x + 6.8, P.y + 6.8, P.w - 12, P.h - 12, 5)}" fill="none" stroke="#FFF6D0" stroke-opacity="0.5" stroke-width="0.6"/>
${screw(P.x + 13, P.y + P.h / 2, 3.6, 30)}${screw(P.x + P.w - 13, P.y + P.h / 2, 3.6, -20)}`;
  const qs = qr.s;
  // a little QR glyph: three finder squares and a scatter of modules
  const m = (qs - 16) / 7;
  const qx = qr.x + 8;
  const qy = qr.y + 8;
  const cell = (cx2: number, cy2: number) => `M${f(qx + cx2 * m)} ${f(qy + cy2 * m)}h${f(m)}v${f(m)}h${f(-m)}Z`;
  const finder = (cx2: number, cy2: number) =>
    `M${f(qx + cx2 * m)} ${f(qy + cy2 * m)}h${f(3 * m)}v${f(3 * m)}h${f(-3 * m)}Z M${f(qx + (cx2 + 0.7) * m)} ${f(qy + (cy2 + 0.7) * m)}v${f(1.6 * m)}h${f(1.6 * m)}v${f(-1.6 * m)}Z`;
  const glyph = [finder(0, 0), finder(4, 0), finder(0, 4), cell(4, 4), cell(6, 4), cell(5, 5), cell(4, 6), cell(6, 6), cell(3.5, 1.5)].join("");
  const qrArt = `
<path d="${rrect(qr.x + 1, qr.y + 3, qs, qs, 9)}" fill="#000" fill-opacity="0.5"/>
${moulding(qr.x, qr.y, qs, qs, 9, 3.5, "fqm")}
<path d="${rrect(qr.x + 3.5, qr.y + 3.5, qs - 7, qs - 7, 6)}" fill="url(#fivory)" stroke="${INK}" stroke-width="0.8"/>
<path d="${glyph}" fill="#2A1A08" fill-rule="evenodd"/>
<path d="M${qr.x + 8} ${qr.y + 5.5}H${f(qr.x + qs * 0.55)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`;

  return svg(
    w,
    h,
    `<defs>
${lit("fwal", WALNUT, 0, 0, w * 0.4, h * 1.4)}
<radialGradient id="fray" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(fy)}" r="${f(w * 0.6)}"><stop offset="0" stop-color="#F0CC72"/><stop offset="0.4" stop-color="#E2B04A"/><stop offset="1" stop-color="#9A6B1E" stop-opacity="0.2"/></radialGradient>
${radial("fsv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("firon", ["#4A5268", "#262A38", "#12141C"], undefined, 0.35, 0.3, 0.8)}
${linear("fgv", GOLD)}
${linear("fenamel", ["#D2384A", "#9A1828", "#5A0812"])}
${linear("fivory", MATERIALS.ivory)}
${lit("fplate", ["#FFF2B8", "#E8BC5C", "#C8902E", "#E2B04A"], P.x, P.y, P.x + P.w * 0.6, P.y + P.h * 1.6)}
${radial("fglow", ["#FFE7B0", "#FFE7B0"], [0.18, 0], 0.5, 0.9, 0.7)}
</defs>
<rect width="${w}" height="${h}" fill="url(#fwal)"/>
${grain}
<g>${rays}</g>
<rect width="${w}" height="${h}" fill="url(#fglow)"/>
<rect x="0" y="${f(fy)}" width="${w}" height="${f(h - fy)}" fill="url(#fwal)" fill-opacity="0.82"/>
<path d="M0 ${f(fy + 3)}H${w}" stroke="#000" stroke-opacity="0.45" stroke-width="5"/>
${frieze(0, w, fr.y, fr.h, "ffz")}
${signArtBody}
${studArt}
${plateArt}
${qrArt}
<rect x="-2" y="${f(h - 5)}" width="${w + 4}" height="5" fill="url(#fgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M0 ${f(h - 3.9)}H${w}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`,
  );
}

/** The sign's gold moulding, for the light to sweep across. */
export const signRim = (L: SignLayout) => {
  const s = L.sign;
  return `${rrect(s.x, s.y, s.w, s.h, 8)}${rrect(s.x + 4, s.y + 4, s.w - 8, s.h - 8, 5)}`;
};

// --------------------------------------------------------- the room

/** The lift's door on the back wall: brass pilasters and the chevron
 *  lintel with its floor dial (the needle on `floor` of `floors`), the
 *  cab's walnut inside, lit from above, a brass handrail across, the
 *  sill. The gate over the opening is drawn live. */
export function doorArt(R: RoomLayout, floor: number, floors: number) {
  const { door: D, opening: O, floorY } = R;
  const pil = O.x - D.x;
  const lintelY = D.y;
  const lintelH = O.y - D.y;
  const pilaster = (x: number) => {
    const flutes = [0.32, 0.68]
      .map((k) => {
        const fx = x + pil * k;
        return `<rect x="${f(fx - 1)}" y="${f(O.y + 6)}" width="2" height="${f(floorY - O.y - 12)}" rx="1" fill="#5A3A0E" fill-opacity="0.75"/><path d="M${f(fx + 1.1)} ${f(O.y + 7)}V${f(floorY - 7)}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6"/>`;
      })
      .join("");
    return `<rect x="${f(x)}" y="${f(O.y)}" width="${pil}" height="${f(floorY - O.y)}" fill="url(#dpil)" stroke="${INK}" stroke-width="0.9"/>${flutes}<path d="M${f(x + 1.3)} ${f(O.y + 4)}V${f(floorY - 4)}" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/>`;
  };
  // the dial: a gold half disc over the lintel, an ivory face with ticks
  // for every floor, the needle on this one
  const dcx = D.x + D.w / 2;
  const dcy = lintelY + 2;
  const dr = Math.min(17, D.w * 0.18);
  const span = floors <= 1 ? 0 : Math.min(70, 12 * (floors - 1));
  const degOf = (i: number) => (floors <= 1 ? 0 : -span + (2 * span * i) / (floors - 1));
  const ticks = Array.from({ length: floors }, (_, i) => {
    const [a, b] = pt(dcx, dcy, dr - 3, degOf(i));
    const [c, d] = pt(dcx, dcy, dr - 6.5, degOf(i));
    return `<path d="M${a} ${b}L${c} ${d}" stroke="${INK}" stroke-width="${i === floor - 1 ? 1.4 : 0.8}"/>`;
  }).join("");
  const [nx, ny] = pt(dcx, dcy, dr - 4, degOf(Math.max(0, floor - 1)));
  const dial = `
<path d="M${f(dcx - dr - 1)} ${f(dcy + 1.5)}A${dr + 1} ${dr + 1} 0 0 1 ${f(dcx + dr + 1)} ${f(dcy + 1.5)}Z" fill="#000" fill-opacity="0.45"/>
<path d="M${f(dcx - dr)} ${f(dcy)}A${dr} ${dr} 0 0 1 ${f(dcx + dr)} ${f(dcy)}Z" fill="url(#dgv)" stroke="${INK}" stroke-width="1"/>
<path d="M${f(dcx - dr + 2.6)} ${f(dcy)}A${dr - 2.6} ${dr - 2.6} 0 0 1 ${f(dcx + dr - 2.6)} ${f(dcy)}Z" fill="url(#divory)" stroke="${INK}" stroke-width="0.7"/>
${ticks}
<path d="M${f(dcx)} ${f(dcy)}L${nx} ${ny}" stroke="#9A1828" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="${f(dcx)}" cy="${f(dcy)}" r="2.6" fill="url(#dsv)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${pt(dcx, dcy, dr - 1.2, -64).join(" ")}A${dr - 1.2} ${dr - 1.2} 0 0 1 ${pt(dcx, dcy, dr - 1.2, -24).join(" ")}" fill="none" stroke="#fff" stroke-width="0.9" stroke-linecap="round"/>`;
  // the cab inside: walnut panels, light from the ceiling, the handrail
  const panels = [0, 1]
    .map((i) => {
      const pw = (O.w - 12) / 2;
      const x = O.x + 4 + i * (pw + 4);
      return `<path d="${rrect(x, O.y + 10, pw, O.h * 0.5, 2)}" fill="#24140A" fill-opacity="0.6" stroke="#0E0804" stroke-width="0.8"/><path d="${rrect(x, O.y + 16 + O.h * 0.5, pw, O.h * 0.42 - 16, 2)}" fill="#24140A" fill-opacity="0.6" stroke="#0E0804" stroke-width="0.8"/>`;
    })
    .join("");
  const railY = O.y + O.h * 0.56;
  const cab = `
<rect x="${f(O.x)}" y="${f(O.y)}" width="${f(O.w)}" height="${f(O.h)}" fill="url(#dcab)"/>
${panels}
<rect x="${f(O.x)}" y="${f(O.y)}" width="${f(O.w)}" height="${f(O.h)}" fill="url(#dlamp)"/>
<rect x="${f(O.x + 3)}" y="${f(railY)}" width="${f(O.w - 6)}" height="3.2" rx="1.6" fill="url(#dgv)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${f(O.x)}" y="${f(O.y)}" width="${f(O.w)}" height="6" fill="#000" fill-opacity="0.45"/>
<rect x="${f(O.x - 1)}" y="${f(O.y + O.h)}" width="${f(O.w + 2)}" height="6" fill="url(#dgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(O.x + 2)} ${f(O.y + O.h + 1.3)}H${f(O.x + O.w * 0.5)}" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>`;
  return `<defs>
${lit("dpil", ["#FFF2B8", "#E2B04A", "#9A6B1E", "#C8902E"], 0, 0, pil * 3, 0)}
${linear("dgv", GOLD)}
${linear("divory", MATERIALS.ivory)}
${radial("dsv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${linear("dcab", ["#5A3620", "#3A2214", "#24140A"])}
${radial("dlamp", ["#FFE7B0", "#FFE7B0"], [0.42, 0], 0.5, 0.0, 0.95)}
</defs>
<rect x="${f(D.x + 3)}" y="${f(D.y + 4)}" width="${f(D.w)}" height="${f(floorY - D.y)}" fill="#000" fill-opacity="0.45"/>
${cab}
${pilaster(D.x)}${pilaster(D.x + D.w - pil)}
${frieze(D.x - 2, D.x + D.w + 2, lintelY, lintelH, "dlz")}
${[D.x + 6, D.x + D.w - 6].map((x) => stud(x, lintelY + lintelH / 2, 2.2)).join("")}
${dial}`;
}

/** Floorboards from `y` to the foot, running away from you to a point
 *  far behind the wall; the skirting along the wall's foot, the shadow
 *  the wall throws. */
export function boardsArt(w: number, y: number, h: number, wood: string) {
  const boards = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    const xb = -w * 0.35 + t * w * 1.7;
    const xt = w * 0.15 + t * w * 0.7;
    return `<path d="M${f(xt)} ${f(y)}L${f(xb)} ${h}" stroke="${shade(wood, -0.62)}" stroke-opacity="0.75" stroke-width="1.1"/><path d="M${f(xt + 1.2)} ${f(y)}L${f(xb + 2.4)} ${h}" stroke="#fff" stroke-opacity="0.06" stroke-width="0.8"/>`;
  }).join("");
  // the board ends, stepped across the courses
  const joints = Array.from({ length: 7 }, (_, k) => {
    const yy = y + ((h - y) * (k + 1) ** 1.35) / 8 ** 1.35;
    return Array.from({ length: 16 }, (_, i) => {
      if ((i + k) % 3) return "";
      const t0 = i / 16;
      const t1 = (i + 1) / 16;
      const v = (yy - y) / (h - y);
      const xa = w * 0.15 + t0 * w * 0.7 + v * (-w * 0.5 + t0 * w);
      const xb2 = w * 0.15 + t1 * w * 0.7 + v * (-w * 0.5 + t1 * w);
      return `<path d="M${f(xa)} ${f(yy)}L${f(xb2)} ${f(yy)}" stroke="${shade(wood, -0.62)}" stroke-opacity="0.55" stroke-width="0.9"/>`;
    }).join("");
  }).join("");
  return `<defs>${linear("bfl", [shade(wood, 0.05), shade(wood, -0.25), shade(wood, -0.5)])}${linear("bsh", ["#000000", "#000000"], true, [0.55, 0])}${radial("bvig", ["#000000", "#000000"], [0, 0.55], 0.5, 0.25, 0.85)}</defs>
<rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#bfl)"/>
${boards}
${joints}
<rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#bvig)"/>
<rect y="${f(y)}" width="${w}" height="26" fill="url(#bsh)"/>`;
}

/** The skirting along the foot of the back wall. */
export const skirting = (w: number, y: number, wood: string) =>
  `<rect y="${f(y - 9)}" width="${w}" height="9" fill="${shade(wood, -0.35)}" stroke="${shade(wood, -0.7)}" stroke-width="0.8"/><path d="M0 ${f(y - 8)}H${w}" stroke="#fff" stroke-opacity="0.16" stroke-width="0.8"/>`;

// --------------------------------------------------------- live pieces

/** A name plate, w × h: dark wood in a gold moulding (the name is
 *  written over it). */
export function plateArt(w: number, h: number) {
  return svg(
    w,
    h,
    `<defs>${linear("pw", ["#3A2A1A", "#22160C"])}</defs>
<path d="${rrect(0.5, 1.5, w - 1, h - 1.5, 6)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(0.5, 0.5, w - 1, h - 2, 6)}" fill="url(#pw)"/>
${moulding(0.5, 0.5, w - 1, h - 2, 6, 1.8, "pm")}`,
  );
}

/** A free spot: the meeple drawn in a dashed cream line, a faint fill,
 *  and a brass "+" on its chest; in the mascot's box (100 × 130, `w`
 *  wide). */
export function emptySpotArt(w: number) {
  const h = (w * 130) / 100;
  const k = w / 100;
  return svg(
    w,
    h,
    `<defs>${radial("esv", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}</defs>
<g transform="scale(${f(k)}) translate(0 ${LIFT})">
<path d="${BODY}" fill="#F6E9D2" fill-opacity="0.07"/>
<path d="${BODY}" fill="none" stroke="#F6E9D2" stroke-opacity="0.55" stroke-width="${f(2.2 / k)}" stroke-dasharray="${f(5 / k)} ${f(4 / k)}" stroke-linecap="round"/>
</g>
<circle cx="${f(w / 2)}" cy="${f(h * 0.56)}" r="${f(w * 0.13)}" fill="url(#esv)" stroke="${INK}" stroke-width="1"/>
<path d="M${f(w / 2 - w * 0.065)} ${f(h * 0.56)}H${f(w / 2 + w * 0.065)}M${f(w / 2)} ${f(h * 0.56 - w * 0.065)}V${f(h * 0.56 + w * 0.065)}" stroke="${INK}" stroke-width="${f(Math.max(1.6, w * 0.028))}" stroke-linecap="round"/>
<path d="M${f(w / 2 - w * 0.09)} ${f(h * 0.56 - w * 0.05)}A${f(w * 0.1)} ${f(w * 0.1)} 0 0 1 ${f(w / 2 - w * 0.03)} ${f(h * 0.56 - w * 0.1)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.9" fill="none" stroke-linecap="round"/>`,
  );
}

/** A soft warm glow, size square (a lamp's halo, drawn with `screen`). */
export function glowArt(size: number, color: string) {
  return svg(size, size, `<defs>${radial("g", [color, color, color], [0.85, 0.32, 0])}</defs><rect width="${size}" height="${size}" fill="url(#g)"/>`);
}

/** A pool of lamplight on the boards, w × h (an ellipse's worth). */
export function poolArt(w: number, h: number, color: string) {
  return svg(
    w,
    h,
    `<defs><radialGradient id="p" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${color}" stop-opacity="0.95"/><stop offset="0.5" stop-color="${color}" stop-opacity="0.42"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#p)"/>`,
  );
}

/** A lamp's beam falling to the boards, w × h: narrow at the lamp, wide
 *  at the foot, brightest near the lamp and soft at its edges (layered
 *  trapezoids, drawn with screen). */
export function beamArt(top: number, w: number, h: number, color: string) {
  const layers = Array.from({ length: 6 }, (_, i) => {
    const k = 1 - i / 6;
    const t2 = (top * k) / 2;
    const b2 = (w * k) / 2;
    return `<path d="M${f(w / 2 - t2)} 0H${f(w / 2 + t2)}L${f(w / 2 + b2)} ${f(h)}H${f(w / 2 - b2)}Z" fill="url(#bm)"/>`;
  }).join("");
  return svg(
    w,
    h,
    `<defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.08"/><stop offset="0.6" stop-color="${color}" stop-opacity="0.07"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${layers}`,
  );
}

/** A brass round button, size square, its face dark walnut (an emblem
 *  goes over it): the bot bell on the plinth. */
export function knobArt(size: number) {
  const c = size / 2;
  return svg(
    size,
    size,
    `<defs>${radial("ks", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.75)}${radial("kf", ["#5A3620", "#2E1A0E", "#1A0E06"], undefined, 0.4, 0.3, 0.8)}</defs>
<circle cx="${c + 0.6}" cy="${c + 2}" r="${c - 1}" fill="#000" fill-opacity="0.5"/>
<circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="url(#ks)" stroke="${INK}" stroke-width="1.1"/>
<circle cx="${c}" cy="${c}" r="${c - 5.5}" fill="url(#kf)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${c}" cy="${c}" r="${f(c - 3.4)}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="M${pt(c, c, c - 2.6, -70).join(" ")}A${c - 2.6} ${c - 2.6} 0 0 1 ${pt(c, c, c - 2.6, -20).join(" ")}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-opacity="0.85"/>`,
  );
}

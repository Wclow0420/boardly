// The penny arcade round the lift (the Me page), as SVG markup in the
// page's own points, recorded once with the rest of the room (art.ts):
// the striped wall with a brass rail and strings of warm bulbs, the
// machines along it (a claw crane with a case of prizes, a faceless
// meeple fortune teller in her booth, an upright pinball with its
// backglass, a picture viewer on its pedestal, a shelf of prizes) and
// the patterned carpet. Drawn in the house style: gradients lit from the
// upper left, an ink outline, one line of shine; cherry wood, gold trim,
// crimson enamel, night glass and a touch of jade. What moves (the
// claw, the chasing bulbs, the glints) is drawn by LobbyLife.

import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { Machine, MeLayout, Pos } from "./layout";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

/** An oval as a path (Skia's SVG reader fills a gradient <ellipse> black). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
const disc = (cx: number, cy: number, r: number) => oval(cx, cy, r, r);
const star = (x: number, y: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.45 : r;
    return `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`;
  });
  return `M${pts.join("L")}Z`;
};
/** A faceless meeple standing on (x, y), `s` tall. */
const meeple = (x: number, y: number, s: number) => {
  const k = s / 40;
  const p = (dx: number, dy: number) => `${f(x + dx * k)} ${f(y + dy * k)}`;
  return `M${p(0, -40)}C${p(5, -40)} ${p(7, -36)} ${p(7, -32)}C${p(7, -29)} ${p(5.5, -27)} ${p(4.5, -26.5)}C${p(10, -25.5)} ${p(16, -24)} ${p(16, -21)}C${p(16, -18.5)} ${p(12, -17.5)} ${p(8, -17)}L${p(13, -2)}C${p(13.5, 0)} ${p(12.5, 0)} ${p(11, 0)}H${p(3, 0).split(" ")[0]}L${p(0, -7)}L${p(-3, 0)}H${p(-11, 0).split(" ")[0]}C${p(-12.5, 0)} ${p(-13.5, 0)} ${p(-13, -2)}L${p(-8, -17)}C${p(-12, -17.5)} ${p(-16, -18.5)} ${p(-16, -21)}C${p(-16, -24)} ${p(-10, -25.5)} ${p(-4.5, -26.5)}C${p(-5.5, -27)} ${p(-7, -29)} ${p(-7, -32)}C${p(-7, -36)} ${p(-5, -40)} ${p(0, -40)}Z`;
};
const box = (x: number, y: number, w: number, h: number, fill: string, ink = 0.9, r = 0) =>
  `<path d="${rrect(x, y, w, h, r)}" fill="${fill}" stroke="${INK}" stroke-width="${ink}"/>`;
/** A line of shine along a lit top edge. */
const shine = (x0: number, x1: number, y: number, op = 0.6) =>
  `<path d="M${f(x0)} ${f(y)}H${f(x1)}" stroke="#fff" stroke-opacity="${op}" stroke-width="0.8" stroke-linecap="round"/>`;
/** A glass bulb in its brass socket, softly on. */
const bulb = (x: number, y: number, r = 2.2) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 1)}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.4"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#abulb)"/>`;
const glow = (x: number, y: number, r: number) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#aglow)"/>`;
/** A small brass coin slot. */
const slot = (x: number, y: number, s: number) =>
  `${box(x - s, y - s * 0.7, 2 * s, 1.4 * s, "url(#agold)", 0.6, 1)}<rect x="${f(x - 0.6)}" y="${f(y - s * 0.45)}" width="1.2" height="${f(s * 0.9)}" fill="#1A0E06"/>`;
/** A cabinet of cherry wood in a gold moulding, with an inset panel. */
const cabinet = (x: number, y: number, w: number, h: number) =>
  `${box(x, y, w, h, "url(#awood)", 1, 2)}<path d="${rrect(x + 3, y + 3, w - 6, h - 6, 1.5)}" fill="none" stroke="url(#agold)" stroke-width="1.2"/><path d="${rrect(x + 3, y + 3, w - 6, h - 6, 1.5)}" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="0.4"/>${shine(x + 2, x + w * 0.5, y + 1.2, 0.35)}`;
const feet = (x: number, w: number, y: number) =>
  [x + 3, x + w - 9].map((fx) => box(fx, y - 3, 6, 3, "url(#agoldv)", 0.6, 1)).join("");

export const ARCADE_DEFS = `
${linear("awood", ["#9A5232", "#743A1E", "#4A2210"], false)}
${linear("agold", MATERIALS.gold, false)}
${linear("agoldv", MATERIALS.gold)}
${linear("acrim", ["#D2384A", "#9A1828", "#5A0812"])}
${linear("aglass", ["#2E4070", "#16203E", "#0A1020"])}
${linear("ajade", ["#9ADCB8", "#2E8A68", "#145040"])}
${linear("aivory", MATERIALS.ivory)}
${linear("airon", MATERIALS.iron, false)}
${linear("ahood", ["#3A2A20", "#1A120C", "#0A0604"])}
${radial("abulb", ["#FFFBEA", "#FFD98A", "#C8902E"], undefined, 0.4, 0.35, 0.75)}
${radial("aglow", ["#FFD98A", "#FFB23A"], [0.38, 0])}
${radial("aball", ["#FFFFFF", "#FFFFFF"], [0.7, 0], 0.35, 0.3, 0.6)}
${radial("aorb", ["#D8EEFF", "#5A8AD0", "#14244A"], undefined, 0.38, 0.32, 0.75)}
${radial("ashadow", ["#000000", "#000000"], [0.55, 0])}`;

// ------------------------------------------------------------- the machines

function claw({ x, y, w, h }: Machine) {
  const cx = x + w / 2;
  const signH = Math.round(h * 0.13 * 2) / 2;
  const c0 = y + signH + 4;
  const c1 = y + h * 0.62;
  // a pile of prizes: balls in the house colours, a little jade meeple, a star
  const colors = ["url(#acrim)", "url(#ajade)", "url(#agoldv)", "url(#aivory)"];
  const balls: string[] = [];
  const br = Math.max(3.2, w * 0.07);
  for (let row = 0; row < 3; row++) {
    const n = Math.floor((w - 12) / (br * 2)) - row;
    for (let i = 0; i < n; i++) {
      const bx = x + 6 + br + row * br + i * br * 2 + ((row + i) % 2) * 0.6;
      const by = c1 - 4 - br - row * br * 1.6;
      if (bx > x + w - 6 - br) continue;
      const fill = colors[(i * 3 + row * 2) % 4];
      balls.push(`<path d="${disc(bx, by, br)}" fill="${fill}" stroke="${INK}" stroke-width="0.6"/><path d="${disc(bx, by, br)}" fill="url(#aball)"/>`);
    }
  }
  const prize = `<path d="${meeple(x + w * 0.3, c1 - 4 - br * 3.4, br * 3)}" fill="url(#ajade)" stroke="${INK}" stroke-width="0.7"/><path d="${star(x + w * 0.66, c1 - 6 - br * 3.4, br * 1.4)}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>`;
  const chute = box(x + w - 5 - w * 0.28, c1 - h * 0.09, w * 0.28, h * 0.09, "url(#agold)", 0.7, 1);
  const deck = c1;
  return `
<path d="${oval(cx, y + h, w * 0.55, 3.5)}" fill="url(#ashadow)"/>
${cabinet(x + 2, deck + 6, w - 4, y + h - 4 - deck - 6)}
<path d="${rrect(x + w * 0.3, deck + 14, w * 0.4, (y + h - deck) * 0.42, 2)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.6"/>
${slot(cx, y + h - 16, 3.2)}
${box(x, deck, w, 7, "url(#agoldv)", 0.8, 1)}${shine(x + 2, x + w * 0.6, deck + 1.4)}
<path d="M${f(x + w * 0.3)} ${f(deck + 1)}V${f(deck - 6)}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="${disc(x + w * 0.3, deck - 7, 2.6)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.6"/>
<path d="${disc(x + w * 0.62, deck + 3.5, 2)}" fill="url(#ajade)" stroke="${INK}" stroke-width="0.5"/>
${feet(x, w, y + h)}
<rect x="${f(x + 2)}" y="${f(c0)}" width="${f(w - 4)}" height="${f(c1 - c0)}" fill="url(#aglass)"/>
<path d="M${f(x + 4)} ${f(c0 + 5)}H${f(x + w - 4)}" stroke="url(#agoldv)" stroke-width="2.4"/><path d="M${f(x + 4)} ${f(c0 + 5)}H${f(x + w - 4)}" stroke="${INK}" stroke-width="0.4" stroke-dasharray="2 3"/>
${balls.join("")}
${prize}
${chute}
<path d="M${f(x + 6)} ${f(c1 - 2)}L${f(x + w * 0.42)} ${f(c0 + 8)}M${f(x + w * 0.5)} ${f(c1 - 4)}L${f(x + w - 6)} ${f(c0 + 22)}" stroke="#fff" stroke-opacity="0.12" stroke-width="3"/>
${[x, x + w - 3].map((px) => box(px, c0 - 1, 3, c1 - c0 + 2, "url(#agold)", 0.6)).join("")}
${box(x - 1, y + 4, w + 2, signH, "url(#agoldv)", 1, 3)}
<path d="${rrect(x + 2, y + 6.5, w - 4, signH - 5, 2)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.6"/>
${[0.3, 0.5, 0.7].map((k) => `<path d="${star(x + w * k, y + 4 + signH * 0.45, signH * 0.17)}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.4"/>`).join("")}
${shine(x + 4, x + w * 0.45, y + 8, 0.35)}
<path d="M${f(cx - 8)} ${f(y + 5)}A8 8 0 0 1 ${f(cx + 8)} ${f(y + 5)}Z" fill="url(#agold)" stroke="${INK}" stroke-width="0.7"/>
<path d="${disc(cx, y + 1.8, 2.4)}" fill="url(#ajade)" stroke="${INK}" stroke-width="0.5"/>`;
}

function fortune({ x, y, w, h }: Machine) {
  const cx = x + w / 2;
  const ar = w / 2;
  const win0 = y + ar * 0.55;
  const win1 = y + h * 0.58;
  const ww = w - 8;
  // the arched window: a crimson curtain either side, the fortune teller
  // (a faceless meeple in a jade turban) over her crystal ball
  const arch = `M${f(x + 4)} ${f(win1)}V${f(win0 + ww / 2)}A${f(ww / 2)} ${f(ww / 2)} 0 0 1 ${f(x + w - 4)} ${f(win0 + ww / 2)}V${f(win1)}Z`;
  const s = (win1 - win0) * 0.62;
  const fy = win1 - (win1 - win0) * 0.16;
  const head = s * 0.24;
  const teller = `
<path d="M${f(cx - s * 0.42)} ${f(win1)}C${f(cx - s * 0.42)} ${f(fy - s * 0.28)} ${f(cx - s * 0.2)} ${f(fy - s * 0.4)} ${f(cx)} ${f(fy - s * 0.4)}C${f(cx + s * 0.2)} ${f(fy - s * 0.4)} ${f(cx + s * 0.42)} ${f(fy - s * 0.28)} ${f(cx + s * 0.42)} ${f(win1)}Z" fill="url(#acrim)" stroke="${INK}" stroke-width="0.7"/>
<path d="${disc(cx, fy - s * 0.4 - head * 0.75, head)}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(cx - head * 1.1)} ${f(fy - s * 0.4 - head * 1.15)}C${f(cx - head * 1.05)} ${f(fy - s * 0.4 - head * 2.3)} ${f(cx + head * 1.05)} ${f(fy - s * 0.4 - head * 2.3)} ${f(cx + head * 1.1)} ${f(fy - s * 0.4 - head * 1.15)}Z" fill="url(#ajade)" stroke="${INK}" stroke-width="0.7"/>
<path d="${disc(cx, fy - s * 0.4 - head * 1.5, head * 0.26)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.4"/>
${glow(cx, fy - s * 0.06, s * 0.36)}
<path d="M${f(cx - s * 0.16)} ${f(fy + s * 0.08)}H${f(cx + s * 0.16)}L${f(cx + s * 0.1)} ${f(fy)}H${f(cx - s * 0.1)}Z" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.5"/>
<path d="${disc(cx, fy - s * 0.07, s * 0.14)}" fill="url(#aorb)" stroke="${INK}" stroke-width="0.6"/>
<path d="${disc(cx - s * 0.05, fy - s * 0.12, s * 0.035)}" fill="#fff" fill-opacity="0.9"/>`;
  const curtain = (side: number) => {
    const ex = side < 0 ? x + 4 : x + w - 4;
    const ix = cx + side * (ww * 0.24);
    return `<path d="M${f(ex)} ${f(win0 + ww * 0.2)}Q${f(ix)} ${f(win0 + ww * 0.3)} ${f(ix + side * 3)} ${f(win1)}H${f(ex)}Z" fill="url(#acrim)" stroke="${INK}" stroke-width="0.6"/><path d="M${f(ex + side * -3)} ${f(win0 + ww * 0.35)}Q${f(ex - side * 5)} ${f((win0 + win1) / 2)} ${f(ex - side * 4)} ${f(win1)}" fill="none" stroke="#3A0408" stroke-width="0.6"/>`;
  };
  const stars = [
    [0.3, 0.42, 1.6],
    [0.7, 0.36, 1.3],
    [0.5, 0.22, 1.8],
  ]
    .map(([k, j, r]) => `<path d="${star(x + w * k, y + ar * j * 2, r * 1.2)}" fill="url(#agoldv)"/>`)
    .join("");
  return `
<path d="${oval(cx, y + h, w * 0.55, 3.5)}" fill="url(#ashadow)"/>
<path d="M${f(x)} ${f(y + h - 4)}V${f(y + ar)}A${f(ar)} ${f(ar)} 0 0 1 ${f(x + w)} ${f(y + ar)}V${f(y + h - 4)}Z" fill="url(#awood)" stroke="${INK}" stroke-width="1"/>
<path d="M${f(x + 2)} ${f(y + ar)}A${f(ar - 2)} ${f(ar - 2)} 0 0 1 ${f(x + w - 2)} ${f(y + ar)}" fill="url(#aglass)" stroke="url(#agold)" stroke-width="2.2"/>
${stars}
<path d="${arch}" fill="#1A0A06" stroke="url(#agold)" stroke-width="2"/>
${teller}
${curtain(-1)}${curtain(1)}
<path d="M${f(x + 6)} ${f(win1 - 4)}L${f(x + w * 0.5)} ${f(win0 + ww * 0.3)}" stroke="#fff" stroke-opacity="0.1" stroke-width="3"/>
<path d="${arch}" fill="none" stroke="${INK}" stroke-width="0.6"/>
${box(x - 1, win1, w + 2, 5, "url(#agoldv)", 0.8, 1)}
<path d="${rrect(x + w * 0.2, win1 + 10, w * 0.6, (y + h - win1) * 0.32, 1.5)}" fill="url(#aivory)" stroke="${INK}" stroke-width="0.6"/>
${[0.35, 0.55, 0.75].map((k) => `<path d="M${f(x + w * 0.27)} ${f(win1 + 10 + (y + h - win1) * 0.32 * k)}H${f(x + w * 0.73)}" stroke="#A08A60" stroke-width="0.6"/>`).join("")}
${slot(cx, y + h - 14, 3)}
${feet(x, w, y + h)}
<path d="M${f(x + 1)} ${f(y + ar)}V${f(y + h - 6)}" stroke="#fff" stroke-opacity="0.25" stroke-width="0.8"/>
<path d="M${f(cx - 6)} ${f(y + 2)}L${f(cx)} ${f(y - 4)}L${f(cx + 6)} ${f(y + 2)}Z" fill="url(#agold)" stroke="${INK}" stroke-width="0.6"/>`;
}

function pinball({ x, y, w, h }: Machine) {
  const cx = x + w / 2;
  const g1 = y + h * 0.42;
  const neck = g1 + h * 0.05;
  const field1 = neck + h * 0.12;
  const cab1 = field1 + h * 0.18;
  // the backglass: night glass with a gold sunburst rising from its foot,
  // a star, two score windows
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 9;
    const r0 = 4;
    const r1 = (g1 - y) * 0.75;
    const bx = cx;
    const by = g1 - 12;
    const p = (rr: number, da: number) => `${f(bx + Math.cos(a + da) * rr)} ${f(by + Math.sin(a + da) * rr)}`;
    return `M${p(r0, -0.05)}L${p(r1, -0.09)}L${p(r1, 0.09)}L${p(r0, 0.05)}Z`;
  }).join("");
  const scoreW = (w - 20) / 2;
  const legs = [x + w * 0.16, x + w * 0.84 - 3]
    .map((lx) => `<path d="M${f(lx)} ${f(cab1)}L${f(lx + 1)} ${f(y + h - 3)}H${f(lx + 3)}L${f(lx + 4)} ${f(cab1)}Z" fill="url(#airon)" stroke="${INKS.iron.ink}" stroke-width="0.5"/>${box(lx - 1, y + h - 4, 6, 3, "url(#agoldv)", 0.5, 1)}`)
    .join("");
  const bumpers = [
    [0.35, 0.4],
    [0.65, 0.4],
    [0.5, 0.65],
  ]
    .map(([k, j]) => {
      const bx = x + w * k;
      const by = neck + (field1 - neck) * j;
      return `<path d="${oval(bx, by, w * 0.07, w * 0.04)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.5"/><path d="${oval(bx, by - 0.6, w * 0.035, w * 0.02)}" fill="url(#aivory)"/>`;
    })
    .join("");
  return `
<path d="${oval(cx, y + h, w * 0.55, 3.5)}" fill="url(#ashadow)"/>
${legs}
${cabinet(x, field1, w, cab1 - field1)}
${box(cx - w * 0.16, field1 + 5, w * 0.32, (cab1 - field1) * 0.6, "url(#agold)", 0.6, 1)}
${[cx - w * 0.07, cx + w * 0.07].map((sx) => `<rect x="${f(sx - 0.6)}" y="${f(field1 + 8)}" width="1.2" height="${f((cab1 - field1) * 0.3)}" fill="#1A0E06"/>`).join("")}
<path d="M${f(x + w * 0.1)} ${f(neck)}H${f(x + w * 0.9)}L${f(x + w)} ${f(field1)}H${f(x)}Z" fill="url(#aglass)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(x + w * 0.1)} ${f(neck)}H${f(x + w * 0.9)}L${f(x + w)} ${f(field1)}H${f(x)}Z" fill="url(#ajade)" fill-opacity="0.35"/>
${bumpers}
${box(x - 1, field1 - 2, w + 2, 4, "url(#agoldv)", 0.7, 1)}
${box(x + w * 0.12, g1 - 1, w * 0.76, neck - g1 + 1, "url(#awood)", 0.8)}
${box(x, y, w, g1 - y, "url(#agoldv)", 1, 3)}
<clipPath id="apbg"><path d="${rrect(x + 7, y + 7, w - 14, g1 - y - 14, 2)}"/></clipPath>
<path d="${rrect(x + 7, y + 7, w - 14, g1 - y - 14, 2)}" fill="url(#aglass)" stroke="${INK}" stroke-width="0.6"/>
<g clip-path="url(#apbg)"><path d="${rays}" fill="url(#agold)" fill-opacity="0.85" stroke="${INK}" stroke-width="0.4"/></g>
<path d="${star(cx, y + (g1 - y) * 0.36, Math.min(w * 0.13, 8))}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
${[x + 10, x + 10 + scoreW].map((sx) => box(sx, g1 - 18, scoreW - 2, 6, "url(#aivory)", 0.5, 1)).join("")}
<path d="M${f(x + 9)} ${f(g1 - 22)}L${f(x + w * 0.4)} ${f(y + 9)}" stroke="#fff" stroke-opacity="0.12" stroke-width="3"/>
${shine(x + 3, x + w * 0.5, y + 1.4)}`;
}

function viewer({ x, y, w, h }: Machine, side: 1 | -1) {
  const cx = x + w / 2;
  const hood1 = y + h * 0.17;
  const body1 = y + h * 0.52;
  // the body leaves room at one side for the crank
  const bw = w - 18;
  const bcx = cx - side * 5;
  const crankX = side > 0 ? bcx + bw / 2 : bcx - bw / 2;
  return `
<path d="${oval(cx, y + h, w * 0.5, 3)}" fill="url(#ashadow)"/>
${box(cx - w * 0.36, y + h - 8, w * 0.72, 5, "url(#agoldv)", 0.7, 1)}
<path d="M${f(cx - w * 0.12)} ${f(body1)}L${f(cx - w * 0.2)} ${f(y + h - 8)}H${f(cx + w * 0.2)}L${f(cx + w * 0.12)} ${f(body1)}Z" fill="url(#airon)" stroke="${INKS.iron.ink}" stroke-width="0.7"/>
${[-0.07, 0, 0.07].map((k) => `<path d="M${f(cx + w * k)} ${f(body1 + 3)}L${f(cx + w * k * 1.6)} ${f(y + h - 10)}" stroke="${INKS.iron.vein}" stroke-width="0.7"/>`).join("")}
<path d="M${f(crankX)} ${f((hood1 + body1) / 2)}h${f(side * 6)}v${f(8)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M${f(crankX)} ${f((hood1 + body1) / 2)}h${f(side * 6)}v${f(8)}" fill="none" stroke="url(#agoldv)" stroke-width="1.4" stroke-linecap="round"/>
<path d="${disc(crankX + side * 6, (hood1 + body1) / 2 + 9, 2.2)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(bcx - bw / 2)} ${f(body1)}V${f(hood1 + 6)}Q${f(bcx - bw / 2)} ${f(hood1)} ${f(bcx - bw / 2 + 6)} ${f(hood1)}H${f(bcx + bw / 2 - 6)}Q${f(bcx + bw / 2)} ${f(hood1)} ${f(bcx + bw / 2)} ${f(hood1 + 6)}V${f(body1)}Z" fill="url(#acrim)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rrect(bcx - bw * 0.32, hood1 + (body1 - hood1) * 0.3, bw * 0.64, (body1 - hood1) * 0.42, 1.5)}" fill="url(#aivory)" stroke="url(#agold)" stroke-width="1.2"/>
${[0.45, 0.6].map((k) => `<path d="M${f(bcx - bw * 0.22)} ${f(hood1 + (body1 - hood1) * k)}H${f(bcx + bw * 0.22)}" stroke="#A08A60" stroke-width="0.6"/>`).join("")}
${box(bcx - bw / 2 - 1, body1 - 2, bw + 2, 4, "url(#agoldv)", 0.7, 1)}
<path d="M${f(cx - w * 0.3)} ${f(hood1 + 1)}L${f(cx - w * 0.22)} ${f(y + 3)}H${f(cx + w * 0.22)}L${f(cx + w * 0.3)} ${f(hood1 + 1)}Z" fill="url(#ahood)" stroke="${INK}" stroke-width="0.8"/>
${box(cx - w * 0.24, y + 1, w * 0.48, 4, "url(#agoldv)", 0.6, 2)}
${shine(bcx - bw / 2 + 4, bcx, hood1 + 1.5, 0.4)}`;
}

/** The prize shelf: two cherry shelves on gold brackets, prizes on them. */
function shelf({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  if (h < 30 || w < 24) return "";
  const s0 = y + h * 0.48;
  const s1 = y + h - 3;
  const plank = (sy: number) =>
    `${[x + 5, x + w - 8].map((bx) => `<path d="M${f(bx)} ${f(sy + 3)}h3v2.4l-3 3.6Z" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.4"/>`).join("")}${box(x, sy, w, 3.5, "url(#awood)", 0.7, 1)}${shine(x + 1, x + w * 0.6, sy + 0.8, 0.3)}`;
  const u = Math.min(w / 4, (s0 - y) * 0.7);
  return `
${plank(s0)}${plank(s1)}
<path d="${meeple(x + w * 0.28, s0, u * 1.1)}" fill="url(#ajade)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x + w * 0.62)} ${f(s0)}h${f(u * 0.7)}l${f(-u * 0.12)} ${f(-u * 0.3)}h${f(-u * 0.46)}Z" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.5"/>
<path d="${star(x + w * 0.62 + u * 0.35, s0 - u * 0.62, u * 0.34)}" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>
<path d="${disc(x + w * 0.3, s1 - u * 0.4, u * 0.4)}" fill="url(#acrim)" stroke="${INK}" stroke-width="0.5"/><path d="${disc(x + w * 0.3, s1 - u * 0.4, u * 0.4)}" fill="url(#aball)"/>
${box(x + w * 0.56, s1 - u * 0.7, u * 0.8, u * 0.7, "url(#aivory)", 0.5, 1)}<path d="M${f(x + w * 0.56 + u * 0.4)} ${f(s1 - u * 0.7)}V${f(s1)}" stroke="url(#acrim)" stroke-width="1.4"/>`;
}

// ------------------------------------------------------------- the room

/** The arcade's wall behind everything: wine-dark stripes, a brass rail,
 *  a low cherry wainscot behind the machines. */
export function arcadeWall(L: MeLayout) {
  const { w, h, rail, floorY } = L;
  const stripes = Array.from({ length: Math.ceil(w / 16) + 1 }, (_, i) =>
    `<rect x="${i * 16}" y="0" width="7" height="${f(rail)}" fill="#5A2A1C" fill-opacity="0.32"/><path d="M${i * 16 + 3.5} 0V${f(rail)}" stroke="#C8902E" stroke-opacity="0.08" stroke-width="0.6"/>`,
  ).join("");
  return `
<rect width="${w}" height="${h}" fill="url(#awall)"/>
${stripes}
<rect y="${f(rail)}" width="${w}" height="${f(floorY - rail)}" fill="url(#awains)"/>
<rect y="${f(rail - 3)}" width="${w}" height="6" fill="url(#agoldv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M0 ${f(rail - 1.4)}H${w}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>
<rect y="${f(floorY - 8)}" width="${w}" height="8" fill="#1A0E06"/>
<path d="M0 ${f(floorY - 8)}H${w}" stroke="url(#agold)" stroke-width="1.4"/>`;
}

/** The strings of warm bulbs scalloped along the rail. */
function festoon(points: Pos[]) {
  if (points.length < 2) return "";
  const runs: Pos[][] = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[i - 1].x) runs.push([]);
    runs[runs.length - 1].push(points[i]);
  }
  const wire = runs
    .map((run) => `M${run.map((p) => `${f(p.x)} ${f(p.y - 2)}`).join("L")}`)
    .join("");
  return `<path d="${wire}" fill="none" stroke="#1A0E06" stroke-width="1"/>${points.map((p) => glow(p.x, p.y, 7)).join("")}${points.map((p) => bulb(p.x, p.y, 1.9)).join("")}`;
}

/** Every machine, the shelf, the strings of bulbs, and the sockets of
 *  the bulbs that chase (LobbyLife lights them). */
export function arcadeMachines(L: MeLayout) {
  const drawn = L.machines
    .map((m) => {
      if (m.kind === "claw") return claw(m);
      if (m.kind === "fortune") return fortune(m);
      if (m.kind === "pinball") return pinball(m);
      return viewer(m, 1);
    })
    .join("");
  return `${festoon(L.festoon)}${shelf(L.shelf)}${drawn}${L.chase.map((p) => bulb(p.x, p.y, 1.9)).join("")}`;
}

/** The carpet: crimson, a gold lozenge at every crossing of its pattern
 *  and a jade one in every square, running toward us. */
export function arcadeFloor(L: MeLayout) {
  const { w, h, cx, floorY, horizon } = L;
  const depth = floorY - horizon;
  const tile = depth * 0.2;
  const rows: number[] = [floorY];
  for (let k = 1; rows[rows.length - 1] < h && k < 30; k++) rows.push(horizon + depth / (1 - k * 0.1));
  const J = Math.ceil(w / 2 / tile) + 3;
  const at = (j: number, y: number) => cx + j * tile * ((y - horizon) / depth);
  const scale = (y: number) => (y - horizon) / depth;
  const lozenge = (x: number, y: number, s: number) =>
    `M${f(x)} ${f(y - s * 0.5)}L${f(x + s)} ${f(y)}L${f(x)} ${f(y + s * 0.5)}L${f(x - s)} ${f(y)}Z`;
  let gold = "";
  let jade = "";
  let lines = "";
  for (let k = 0; k < rows.length; k++) {
    const y = rows[k];
    const sc = scale(y);
    lines += `M0 ${f(y)}H${w}`;
    for (let j = -J; j <= J; j++) gold += lozenge(at(j, y), y, 3.2 * sc);
    if (k < rows.length - 1) {
      const ym = (y + rows[k + 1]) / 2;
      const sm = scale(ym);
      for (let j = -J; j < J; j++) jade += lozenge((at(j, ym) + at(j + 1, ym)) / 2, ym, 4 * sm);
    }
  }
  for (let j = -J; j <= J; j++) lines += `M${f(at(j, floorY))} ${floorY}L${f(at(j, h + 40))} ${h + 40}`;
  return `
<rect y="${floorY}" width="${w}" height="${f(h - floorY)}" fill="url(#acarpet)"/>
<path d="${lines}" stroke="#C8902E" stroke-opacity="0.22" stroke-width="0.7" fill="none"/>
<path d="${jade}" fill="url(#ajade)" fill-opacity="0.75"/>
<path d="${gold}" fill="url(#agoldv)" stroke="${VEIN}" stroke-width="0.3"/>
<rect y="${floorY}" width="${w}" height="${f(h - floorY)}" fill="url(#adepth)"/>
<rect y="${floorY}" width="${w}" height="6" fill="#000" fill-opacity="0.35"/>`;
}

/** The arcade's own gradients that depend on the page (the wall and the
 *  carpet run its height). */
export function arcadeDefs(L: MeLayout) {
  const { h, rail, floorY } = L;
  const userY = (id: string, colors: string[], y0: number, y1: number, op?: number[]) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y0)}" x2="0" y2="${f(y1)}">${colors
      .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
      .join("")}</linearGradient>`;
  return `${ARCADE_DEFS}
${userY("awall", ["#3E1E14", "#30160E", "#22100A"], 0, rail)}
${userY("awains", ["#4A2414", "#2E160A"], rail, floorY)}
${userY("acarpet", ["#5A121A", "#7A1C24", "#8A222A"], floorY, h)}
${userY("adepth", ["#000000", "#000000"], floorY, h, [0.45, 0])}`;
}

/** The crane's claw, s × s, hung from the top centre: a gold hub, three
 *  prongs curling in (LobbyLife swings it on its cable). */
export function clawArt(s: number) {
  const c = s / 2;
  const prong = (k: number) => {
    const x0 = c + k * s * 0.12;
    const x1 = c + k * s * 0.42;
    const x2 = c + k * s * 0.22;
    return `<path d="M${f(x0)} ${f(s * 0.36)}C${f(x1)} ${f(s * 0.42)} ${f(x1 + k * s * 0.02)} ${f(s * 0.78)} ${f(x2)} ${f(s * 0.95)}" fill="none" stroke="${INK}" stroke-width="${f(s * 0.16)}" stroke-linecap="round"/><path d="M${f(x0)} ${f(s * 0.36)}C${f(x1)} ${f(s * 0.42)} ${f(x1 + k * s * 0.02)} ${f(s * 0.78)} ${f(x2)} ${f(s * 0.95)}" fill="none" stroke="url(#cg)" stroke-width="${f(s * 0.09)}" stroke-linecap="round"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><defs>${linear("cg", MATERIALS.gold, false)}${radial("ch", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.75)}</defs>
${prong(-1)}${prong(1)}
<path d="M${f(c)} ${f(s * 0.36)}V${f(s * 0.9)}" stroke="${INK}" stroke-width="${f(s * 0.14)}" stroke-linecap="round"/><path d="M${f(c)} ${f(s * 0.36)}V${f(s * 0.9)}" stroke="url(#cg)" stroke-width="${f(s * 0.07)}" stroke-linecap="round"/>
<path d="${rrect(c - s * 0.2, s * 0.08, s * 0.4, s * 0.3, s * 0.08)}" fill="url(#ch)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(c - s * 0.12)} ${f(s * 0.13)}H${f(c + s * 0.04)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/></svg>`;
}

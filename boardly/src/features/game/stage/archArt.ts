// The stained-glass arch across the top of the stage: a carved stone
// canopy whose lower edge rises to a pointed arch over the scene, a gilt
// moulding along it, five lancet windows (one a night, the glass telling
// how it went), a stone tablet hanging at the arch's point for the
// night's name, and a candle on a corbel at each end. As SVG markup,
// baked once per state by NightArch; the candles' flames and tonight's
// glow are NightArch's.

import { INKS, MATERIALS } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.5, cy = 0.45, r = 0.6) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;

export type Pane = "won" | "lost" | "now" | "ahead";

/** The glass of each kind of night: light, body, depth. */
export const GLASS: Record<Pane, [string, string, string]> = {
  won: ["#E4F7B0", "#79B83E", "#2E5E1A"],
  lost: ["#FFA0AA", "#B81E36", "#3E0610"],
  now: ["#FFF4C4", "#FFB23A", "#A8481A"],
  ahead: ["#5A78B8", "#22356A", "#0C1634"],
};

/** Where everything sits, for an arch `w` wide whose content starts at
 *  `top` (below the status bar), with `n` windows. */
export function archLayout(w: number, top: number, n = 5) {
  const cx = w / 2;
  const lw = 34;
  const gap = 9;
  const span = n * lw + (n - 1) * gap;
  const winTop = top + 16;
  const winBottom = top + 84;
  return {
    w,
    h: top + 158,
    cx,
    edge: top + 142,
    point: top + 104,
    windows: Array.from({ length: n }, (_, i) => {
      const x = cx - span / 2 + i * (lw + gap);
      return { x, y: winTop, w: lw, h: winBottom - winTop, mid: x + lw / 2 };
    }),
    tablet: { x: cx - 92, y: top + 93, w: 184, h: 40 },
    // a candle on a corbel close beside the outer windows
    candles: [
      { x: cx - span / 2 - 22, y: top + 74 },
      { x: cx + span / 2 + 22, y: top + 74 },
    ],
    frieze: top - 4,
  };
}
export type ArchLayout = ReturnType<typeof archLayout>;

/** A lancet: a tall window with a pointed top, x..x+w, y..y+h, shrunk
 *  evenly by k. */
export function lancet(x: number, y: number, w: number, h: number, k = 0) {
  const l = x + k;
  const r = x + w - k;
  const t = y + k;
  const b = y + h - k;
  const shoulder = t + (r - l) * 0.62;
  const m = (l + r) / 2;
  return `M${f(l)} ${f(b)}V${f(shoulder)}Q${f(l)} ${f(t + (r - l) * 0.12)} ${f(m)} ${f(t)}Q${f(r)} ${f(t + (r - l) * 0.12)} ${f(r)} ${f(shoulder)}V${f(b)}Z`;
}

/** The leading inside a window of a kind: a roundel near the top
 *  holding the night's sign, diamond quarries below, fine lead cames
 *  with a glint along them. */
function leading(win: { x: number; y: number; w: number; h: number; mid: number }, kind: Pane) {
  const { x, y, w, h, mid } = win;
  const lead = "#1A1410";
  const cy = y + w * 0.62;
  const r = w * 0.3;
  const glass = GLASS[kind];
  // diamond quarries in the lights below the roundel
  const q: string[] = [];
  const top = cy + r + 2;
  const bottom = y + h - 2;
  const step = (x + w - 3 - (x + 3)) / 2;
  for (let k = -2; k <= 4; k++) {
    const o = k * step * 0.9;
    q.push(`M${f(x + 3)} ${f(top + o)}L${f(x + w - 3)} ${f(top + o + step * 1.6)}`);
    q.push(`M${f(x + w - 3)} ${f(top + o)}L${f(x + 3)} ${f(top + o + step * 1.6)}`);
  }
  let sign = "";
  if (kind === "won")
    sign = `<path d="M${f(mid - 5.5)} ${f(cy + 0.5)}l3.8 4l7.4 -8" fill="none" stroke="#FFFBE0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  else if (kind === "lost")
    sign = `<path d="M${f(mid - 4)} ${f(cy - 6.5)}l3.2 5l-2.6 3.2l4.6 5.6M${f(mid + 0.8)} ${f(cy - 1.5)}l4.4 -1.6" fill="none" stroke="#2A0208" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  else if (kind === "now")
    sign = `<path d="M${f(mid + 1.6)} ${f(cy - 6.4)}a6.4 6.4 0 1 0 0.01 12.8a4.8 5.8 0 1 1 0 -12.8Z" fill="#FFFDF0" stroke="#A8481A" stroke-width="0.7"/>`;
  else
    sign = `<path d="M${f(mid)} ${f(cy - 4.5)}l1.3 3.1l3.2 0.3l-2.4 2.1l0.8 3.2l-2.9 -1.7l-2.9 1.7l0.8 -3.2l-2.4 -2.1l3.2 -0.3Z" fill="#9AB8E8" opacity="0.85"/>`;
  return `<defs>${rad(`rd${x}`, [glass[0], glass[1]], undefined, 0.4, 0.35, 0.7)}<clipPath id="q${x}"><path d="${lancet(x, y, w, h, 1)}"/></clipPath></defs>
<g clip-path="url(#q${x})"><path d="${q.join("")}" stroke="${lead}" stroke-opacity="0.75" stroke-width="0.7"/></g>
<path d="M${f(mid)} ${f(top)}V${f(bottom)}" stroke="${lead}" stroke-width="1"/>
<circle cx="${f(mid)}" cy="${f(cy)}" r="${f(r + 1.6)}" fill="${lead}"/>
<circle cx="${f(mid)}" cy="${f(cy)}" r="${f(r)}" fill="url(#rd${x})"/>
${sign}
<circle cx="${f(mid)}" cy="${f(cy)}" r="${f(r + 0.8)}" fill="none" stroke="#C8A060" stroke-opacity="0.5" stroke-width="0.5"/>`;
}

/** A band of quatrefoils between two gilt string courses, across the
 *  top of the canopy. */
function frieze(L: ArchLayout) {
  const y = L.frieze;
  const quatrefoil = (x: number) => {
    const r = 4.2;
    return [0, 90, 180, 270]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return `<circle cx="${f(x + Math.cos(rad) * r * 0.75)}" cy="${f(y + Math.sin(rad) * r * 0.75)}" r="${r * 0.62}" fill="#1E2438" stroke="#7A86AE" stroke-width="0.6"/>`;
      })
      .join("") + `<circle cx="${x}" cy="${y}" r="1.4" fill="url(#gt)"/>`;
  };
  const marks: string[] = [];
  for (let x = 14; x < L.w; x += 26) marks.push(quatrefoil(x));
  const course = (yy: number) =>
    `<rect x="0" y="${yy - 1.6}" width="${L.w}" height="3.2" fill="url(#gold)" stroke="${INK}" stroke-width="0.6"/>`;
  return `<rect x="0" y="${y - 9}" width="${L.w}" height="18" fill="#2A3150"/>${marks.join("")}${course(y - 9)}${course(y + 9)}`;
}

/** The arch, w × h: canopy, gilt edge, windows (glass by `panes`),
 *  tablet, corbels with their candles (unlit: the flames are live). */
export function nightArch(L: ArchLayout, panes: Pane[]) {
  const { w, h, cx, edge, point, tablet } = L;
  const canopy = `M0 0H${w}V${edge}Q${f(w * 0.8)} ${edge} ${f(cx + 8)} ${f(point + 4)}L${cx} ${point}L${f(cx - 8)} ${f(point + 4)}Q${f(w * 0.2)} ${edge} 0 ${edge}Z`;
  const rim = `M0 ${edge}Q${f(w * 0.2)} ${edge} ${f(cx - 8)} ${f(point + 4)}L${cx} ${point}L${f(cx + 8)} ${f(point + 4)}Q${f(w * 0.8)} ${edge} ${w} ${edge}`;
  // ashlar: courses of stone with staggered joints
  const courses: string[] = [];
  for (let row = 0; row * 16 < edge; row++) {
    const yy = row * 16 + 4;
    courses.push(`M0 ${yy}H${w}`);
    for (let x = (row % 2) * 26; x < w; x += 52) courses.push(`M${x} ${yy}V${yy + 16}`);
  }
  const windows = L.windows
    .map((win, i) => {
      const kind = panes[i] ?? "ahead";
      const [light, body, deep] = GLASS[kind];
      const glass = `g${i}`;
      return `<defs>${lin(glass, [light, body, deep])}</defs>
<path d="${lancet(win.x - 4, win.y - 4, win.w + 8, win.h + 8)}" fill="url(#sill)" stroke="#1A1E2C" stroke-width="1"/>
<path d="${lancet(win.x, win.y, win.w, win.h)}" fill="url(#${glass})" stroke="#1A1E2C" stroke-width="1"/>
${leading(win, kind)}
<path d="M${f(win.x + 4)} ${f(win.y + win.h * 0.32)}Q${f(win.x + 5)} ${f(win.y + 8)} ${f(win.mid - 2)} ${f(win.y + 4)}" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="M${f(win.x - 5)} ${f(win.y + win.h + 4)}h${f(win.w + 10)}v3.5h${f(-(win.w + 10))}Z" fill="url(#sill)" stroke="#1A1E2C" stroke-width="0.8"/>`;
    })
    .join("");
  const corbel = ({ x, y }: { x: number; y: number }) =>
    `<path d="M${x - 11} ${y}h22l-4 9h-14Z M${x - 7} ${y + 9}h14l-7 9Z" fill="url(#sill)" stroke="#1A1E2C" stroke-width="0.9"/>
<rect x="${x - 7}" y="${y - 3}" width="14" height="3" rx="1" fill="url(#gt)" stroke="${INK}" stroke-width="0.6"/>
<rect x="${x - 4}" y="${y - 26}" width="8" height="23" rx="1.6" fill="url(#wax)" stroke="#8A7A5A" stroke-width="0.6"/>
<path d="M${x - 4} ${y - 23}q2 3 1 6" stroke="#E8DCC0" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M${x} ${y - 26}v-3" stroke="#2A1A08" stroke-width="0.9"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${lin("stone", ["#4A5578", "#343D5E", "#252C46"])}
${lin("sill", ["#8A96BC", "#5A6690", "#3A4468"], false)}
${lin("gold", MATERIALS.gold, false)}
${lin("gt", MATERIALS.gold)}
${lin("tab", ["#F4EEDF", "#E2D6B8", "#C8B890"])}
${lin("wax", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], false)}
${rad("shade", ["#000000", "#000000"], [0, 0.45], 0.5, 0.2, 0.9)}
</defs>
<path d="${canopy}" fill="url(#stone)"/>
<path d="${courses.join("")}" stroke="#141A2E" stroke-opacity="0.55" stroke-width="0.8" clip-path="url(#cc)"/>
<clipPath id="cc"><path d="${canopy}"/></clipPath>
<path d="${canopy}" fill="url(#shade)"/>
${frieze(L)}
${windows}
<path d="${rim}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="11" transform="translate(0 5)"/>
<path d="${rim}" fill="none" stroke="${INK}" stroke-width="8.6"/>
<path d="${rim}" fill="none" stroke="url(#gold)" stroke-width="6.4"/>
<path d="${rim}" fill="none" stroke="${VEIN}" stroke-width="0.8"/>
<path d="${rim}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="1" transform="translate(0 -2)"/>
${L.candles.map(corbel).join("")}
<path d="M${f(tablet.x)} ${f(tablet.y + 4)}h${tablet.w}v${tablet.h}h${-tablet.w}Z" fill="#000" fill-opacity="0.45"/>
<rect x="${tablet.x}" y="${tablet.y}" width="${tablet.w}" height="${tablet.h}" rx="5" fill="url(#gold)" stroke="${INK}" stroke-width="1.1"/>
<rect x="${tablet.x + 4}" y="${tablet.y + 4}" width="${tablet.w - 8}" height="${tablet.h - 8}" rx="3" fill="url(#tab)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${tablet.x + 10} ${tablet.y + 2}H${tablet.x + tablet.w * 0.45}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
${[tablet.x + 9, tablet.x + tablet.w - 9].map((x) => `<circle cx="${x}" cy="${tablet.y + tablet.h / 2}" r="2.2" fill="url(#gt)" stroke="${INK}" stroke-width="0.6"/>`).join("")}
</svg>`;
}

// Tic-Tac-Toe's still art, as SVG markup (each baked once into an image
// by the pieces that show it): the parlour crest across the top of the
// stage, the inlaid board, the two marks — the cross as a silver saltire
// with a sapphire at its crossing, the nought as a gold annulet set with
// a ruby — the studs that count the moves, and the medal of the ending.
// Drawn in the house style: gradients lit from the upper left, an ink
// outline, a groove and one line of shine.

import { INKS, MATERIALS, acanthus, type Pt } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const GOLD_INK = INKS.gold.ink;
const GOLD_VEIN = INKS.gold.vein;
const SILVER_INK = INKS.silver.ink;

export type Mark = "X" | "O";

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
/** A gradient lit from the upper left, in the user space of the box
 *  (x0,y0)–(x1,y1), so pieces turned at an angle keep the same light. */
const lit = (id: string, colors: readonly string[], x0: number, y0: number, x1: number, y1: number) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${stops(colors)}</linearGradient>`;
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.38, cy = 0.32, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;

/** The enamel each mark is set on: the cross's night blue, the
 *  nought's crimson. */
export const FIELD: Record<Mark, readonly string[]> = {
  X: MATERIALS.night,
  O: MATERIALS.crimson,
};
/** Each mark's colour, for light and text. */
export const MARK_LIGHT: Record<Mark, string> = { X: "#9CC8FF", O: "#FF9AA6" };

const WALNUT = ["#6A4428", "#4A2C18", "#2E1A0C"];

/** Fine grain across a piece of wood, w × h from (x, y): long wavy
 *  lines, darker and lighter. */
function grain(x: number, y: number, w: number, h: number, step = 7, seed = 1) {
  const lines: string[] = [];
  let k = seed;
  const rnd = () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
  for (let yy = y + step * 0.6; yy < y + h; yy += step * (0.7 + rnd() * 0.6)) {
    const a = 0.6 + rnd() * 1.4;
    const p = rnd() * 6;
    const pts: string[] = [];
    for (let xx = x; xx <= x + w + 12; xx += 12) pts.push(`${f(xx)} ${f(yy + Math.sin(xx / 37 + p) * a)}`);
    const light = rnd() > 0.6;
    lines.push(
      `<path d="M${pts.join("L")}" fill="none" stroke="${light ? "#C08A5A" : "#1A0E06"}" stroke-opacity="${light ? 0.16 : 0.32}" stroke-width="${f(0.5 + rnd() * 0.6)}"/>`,
    );
  }
  return lines.join("");
}

// ------------------------------------------------------------- marks

/** A mark centred on (cx, cy), `s` across (its 100 box scaled), with its
 *  own gradients named after `id`. */
export function markBody(kind: Mark, cx: number, cy: number, s: number, id: string) {
  const k = s / 100;
  const P = (x: number, y: number) => `${f(cx + (x - 50) * k)} ${f(cy + (y - 50) * k)}`;
  const x0 = cx - 50 * k;
  const y0 = cy - 50 * k;
  if (kind === "X") {
    // two bars, a little flared at the ends; the second crosses over the
    // first; a sapphire in a gold collet where they meet
    const bar = (a: Pt, b: Pt) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy);
      const nx = -dy / l;
      const ny = dx / l;
      const end = 10.5;
      const mid = 7;
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const pt = (p: Pt, w: number, side: number) => P(p[0] + nx * w * side, p[1] + ny * w * side);
      const q = (p: Pt, w: number, side: number) => P(p[0] + nx * w * side - (dx / l) * 2, p[1] + ny * w * side - (dy / l) * 2);
      return (
        `M${pt(a, end, 1)}Q${q(m, mid, 1)} ${pt(b, end, 1)}` +
        `Q${P(b[0] + (dx / l) * 4, b[1] + (dy / l) * 4)} ${pt(b, end, -1)}` +
        `Q${q(m, mid, -1)} ${pt(a, end, -1)}` +
        `Q${P(a[0] - (dx / l) * 4, a[1] - (dy / l) * 4)} ${pt(a, end, 1)}Z`
      );
    };
    const groove = (a: Pt, b: Pt, from: number, to: number) =>
      `M${P(a[0] + (b[0] - a[0]) * from, a[1] + (b[1] - a[1]) * from)}L${P(a[0] + (b[0] - a[0]) * to, a[1] + (b[1] - a[1]) * to)}`;
    const A: [Pt, Pt] = [
      [17, 17],
      [83, 83],
    ];
    const B: [Pt, Pt] = [
      [83, 17],
      [17, 83],
    ];
    const sw = (n: number) => f(Math.max(0.6, n * k));
    return `<defs>${lit(`${id}s`, MATERIALS.silver, x0 + 10 * k, y0 + 10 * k, x0 + 90 * k, y0 + 90 * k)}${rad(`${id}j`, ["#D8EEFF", "#2E7AE0", "#0A2A6A"], undefined, 0.35, 0.3, 0.8)}${lit(`${id}g`, MATERIALS.gold, x0 + 38 * k, y0 + 38 * k, x0 + 62 * k, y0 + 62 * k)}</defs>
<path d="${bar(...A)}" fill="#000" fill-opacity="0.35" transform="translate(${f(2 * k)} ${f(4 * k)})"/>
<path d="${bar(...B)}" fill="#000" fill-opacity="0.35" transform="translate(${f(2 * k)} ${f(4 * k)})"/>
<path d="${bar(...A)}" fill="url(#${id}s)" stroke="${SILVER_INK}" stroke-width="${sw(3)}" stroke-linejoin="round"/>
<path d="${groove(...A, 0.08, 0.4)}${groove(...A, 0.6, 0.92)}" stroke="${INKS.silver.vein}" stroke-width="${sw(1.6)}" stroke-linecap="round"/>
<path d="${bar(...B)}" fill="url(#${id}s)" stroke="${SILVER_INK}" stroke-width="${sw(3)}" stroke-linejoin="round"/>
<path d="${groove(...B, 0.08, 0.4)}${groove(...B, 0.6, 0.92)}" stroke="${INKS.silver.vein}" stroke-width="${sw(1.6)}" stroke-linecap="round"/>
<path d="M${P(80, 13)}L${P(56, 37)}M${P(14, 21)}L${P(36, 43)}" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="${sw(2.2)}" stroke-linecap="round"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(12 * k)}" fill="url(#${id}g)" stroke="${GOLD_INK}" stroke-width="${sw(2.4)}"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(7.6 * k)}" fill="url(#${id}j)" stroke="#06183A" stroke-width="${sw(1.4)}"/>
<circle cx="${f(cx - 2.6 * k)}" cy="${f(cy - 2.8 * k)}" r="${f(2.2 * k)}" fill="#FFFFFF" fill-opacity="0.9"/>`;
  }
  // the annulet: a broad gold ring, a groove round its middle, beads
  // between, a ruby set at its crown
  const R = 33 * k;
  const r = 19 * k;
  const ring = (dx = 0, dy = 0) =>
    `M${f(cx + dx + R)} ${f(cy + dy)}A${f(R)} ${f(R)} 0 1 0 ${f(cx + dx - R)} ${f(cy + dy)}A${f(R)} ${f(R)} 0 1 0 ${f(cx + dx + R)} ${f(cy + dy)}Z` +
    `M${f(cx + dx + r)} ${f(cy + dy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx + dx - r)} ${f(cy + dy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx + dx + r)} ${f(cy + dy)}Z`;
  const beads = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) / 10) * Math.PI * 2;
    if (Math.abs(a + Math.PI / 2) < 0.4) return "";
    return `<circle cx="${f(cx + Math.cos(a) * 26 * k)}" cy="${f(cy + Math.sin(a) * 26 * k)}" r="${f(1.7 * k)}" fill="${GOLD_VEIN}"/>`;
  }).join("");
  const sw = (n: number) => f(Math.max(0.6, n * k));
  const shine = `M${f(cx - Math.cos(0.5) * 30 * k)} ${f(cy - Math.sin(0.5) * 30 * k)}A${f(30 * k)} ${f(30 * k)} 0 0 1 ${f(cx - Math.cos(1.45) * 30 * k)} ${f(cy - Math.sin(1.45) * 30 * k)}`;
  return `<defs>${lit(`${id}g`, MATERIALS.gold, x0 + 14 * k, y0 + 14 * k, x0 + 86 * k, y0 + 86 * k)}${rad(`${id}j`, ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.35, 0.3, 0.8)}</defs>
<path d="${ring(2 * k, 4 * k)}" fill="#000" fill-opacity="0.35" fill-rule="evenodd"/>
<path d="${ring()}" fill="url(#${id}g)" fill-rule="evenodd" stroke="${GOLD_INK}" stroke-width="${sw(3)}"/>
${beads}
<path d="${shine}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="${sw(2.4)}" stroke-linecap="round"/>
<circle cx="${f(cx)}" cy="${f(cy - 26 * k)}" r="${f(9.5 * k)}" fill="url(#${id}g)" stroke="${GOLD_INK}" stroke-width="${sw(2.2)}"/>
<circle cx="${f(cx)}" cy="${f(cy - 26 * k)}" r="${f(6 * k)}" fill="url(#${id}j)" stroke="#3A0408" stroke-width="${sw(1.3)}"/>
<circle cx="${f(cx - 2 * k)}" cy="${f(cy - 28.4 * k)}" r="${f(1.8 * k)}" fill="#FFFFFF" fill-opacity="0.9"/>`;
}

/** A mark on its own, s × s. */
export const markArt = (kind: Mark, s: number) => svg(s, s, markBody(kind, s / 2, s / 2, s * 0.9, `m${kind}`));

/** A stud counting the moves: an empty iron socket, or a bead of the
 *  mark's jewel (sapphire for the cross, ruby for the nought). */
export function studArt(kind: Mark | null, s: number) {
  const c = s / 2;
  const jewel = kind === "X" ? ["#D8EEFF", "#2E7AE0", "#0A2A6A"] : ["#FF9AA6", "#D0102E", "#5A0410"];
  return svg(
    s,
    s,
    `<defs>${rad("st", kind ? jewel : ["#6A5A48", "#2A2018", "#120C08"])}${lin("sg", MATERIALS.gold, false)}</defs>
<circle cx="${c}" cy="${c}" r="${f(s * 0.46)}" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<circle cx="${c}" cy="${c}" r="${f(s * 0.3)}" fill="url(#st)" stroke="${kind ? "#06102A" : "#120C08"}" stroke-width="0.6"/>
${kind ? `<circle cx="${f(c - s * 0.1)}" cy="${f(c - s * 0.1)}" r="${f(s * 0.08)}" fill="#FFFFFF" fill-opacity="0.9"/>` : ""}`,
  );
}

// ------------------------------------------------------------- crest

/** Where everything on the crest sits, for a crest `w` wide whose
 *  content starts at `top` (below the status bar). */
export function crestLayout(w: number, top: number) {
  const cx = w / 2;
  const plaque = { x: cx - 98, y: top + 86, w: 196, h: 48 };
  return {
    w,
    h: top + 150,
    cx,
    top,
    /** The canopy's lower edge at the sides, and the tongue's foot. */
    edge: top + 106,
    foot: top + 142,
    tongue: 112,
    shield: { cx, y: top + 2, w: 62, h: 74 },
    medallions: [
      { x: cx - 116, y: top + 46, r: 25 },
      { x: cx + 116, y: top + 46, r: 25 },
    ],
    plaque,
    /** The nine studs along the plaque, one a move. */
    studs: Array.from({ length: 9 }, (_, i) => ({ x: cx + (i - 4) * 15, y: plaque.y + 35 })),
    frieze: top - 4,
  };
}
export type CrestLayout = ReturnType<typeof crestLayout>;

/** The canopy's lower edge, from left to right: along the sides, then
 *  down round the tongue that holds the plaque. */
function edgePath(L: CrestLayout) {
  const { w, cx, edge, foot, tongue } = L;
  const r = 12;
  return (
    `M0 ${edge}H${f(cx - tongue - r)}Q${f(cx - tongue)} ${edge} ${f(cx - tongue)} ${f(edge + r)}` +
    `V${f(foot - r)}Q${f(cx - tongue)} ${foot} ${f(cx - tongue + r)} ${foot}` +
    `H${f(cx + tongue - r)}Q${f(cx + tongue)} ${foot} ${f(cx + tongue)} ${f(foot - r)}` +
    `V${f(edge + r)}Q${f(cx + tongue)} ${edge} ${f(cx + tongue + r)} ${edge}H${w}`
  );
}

/** A heater shield, shrunk evenly by `k`. */
function shieldPath(s: CrestLayout["shield"], k = 0) {
  const l = s.cx - s.w / 2 + k;
  const r = s.cx + s.w / 2 - k;
  const t = s.y + k;
  const b = s.y + s.h - k * 1.4;
  return `M${f(l)} ${f(t)}H${f(r)}V${f(t + (b - t) * 0.42)}Q${f(r)} ${f(t + (b - t) * 0.82)} ${f(s.cx)} ${f(b)}Q${f(l)} ${f(t + (b - t) * 0.82)} ${f(l)} ${f(t + (b - t) * 0.42)}Z`;
}

/** A medallion: a gold rim set with beads round an enamel field, the
 *  mark on it. */
function medallion(m: { x: number; y: number; r: number }, kind: Mark, id: string) {
  const { x, y, r } = m;
  const field = FIELD[kind];
  const beads = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<circle cx="${f(x + Math.cos(a) * (r - 3.4))}" cy="${f(y + Math.sin(a) * (r - 3.4))}" r="1.3" fill="#FFF2B8" stroke="${GOLD_INK}" stroke-width="0.4"/>`;
  }).join("");
  return `<defs>${lit(`${id}r`, MATERIALS.gold, x - r, y - r, x + r, y + r)}${rad(`${id}f`, [field[0], field[1], field[2]], undefined, 0.36, 0.3, 0.85)}</defs>
<circle cx="${f(x + 1.5)}" cy="${f(y + 3.5)}" r="${r}" fill="#000" fill-opacity="0.45"/>
<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}r)" stroke="${GOLD_INK}" stroke-width="1.2"/>
${beads}
<circle cx="${x}" cy="${y}" r="${f(r - 6.6)}" fill="url(#${id}f)" stroke="${GOLD_INK}" stroke-width="1"/>
<path d="M${f(x - (r - 1.5) * 0.8)} ${f(y - (r - 1.5) * 0.6)}A${f(r - 1.5)} ${f(r - 1.5)} 0 0 1 ${f(x + (r - 1.5) * 0.2)} ${f(y - (r - 1.5) * 0.98)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>
${markBody(kind, x, y, (r - 7) * 1.85, `${id}m`)}`;
}

/** The crest across the top of the stage, w × h: a carved walnut canopy
 *  with a frieze of inlaid noughts and crosses along its top, a gilt
 *  moulding round its lower edge and the tongue that holds the plaque;
 *  in the middle a shield per pale, the saltire on blue and the annulet
 *  on crimson, between acanthus scrolls; a medallion for each player
 *  (the cross on the left, the nought on the right); and the ivory
 *  plaque for whose turn it is, with nine empty sockets for the moves.
 *  The studs, the names and the turn's glow are the Crest's. */
export function crestArt(L: CrestLayout) {
  const { w, h, cx, edge, foot, tongue, shield, plaque, top } = L;
  const edgeD = edgePath(L);
  const body = `${edgeD}V0H0Z`;
  // the frieze: little ivory crosses and noughts inlaid in turn
  const frieze: string[] = [];
  const y = L.frieze;
  let i = 0;
  for (let x = 12; x < w; x += 20, i++) {
    frieze.push(
      i % 2
        ? `<circle cx="${x}" cy="${y}" r="3.4" fill="none" stroke="#F4EEDF" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="3.4" fill="none" stroke="#3A2408" stroke-width="0.4"/>`
        : `<path d="M${x - 3} ${y - 3}L${x + 3} ${y + 3}M${x + 3} ${y - 3}L${x - 3} ${y + 3}" stroke="#F4EEDF" stroke-width="1.8" stroke-linecap="round"/>`,
    );
  }
  const course = (yy: number) =>
    `<rect x="0" y="${f(yy - 1.6)}" width="${w}" height="3.2" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="0.6"/>`;
  // acanthus out of each side of the shield, toward the medallions
  const leaves = acanthus(cx + 30, shield.y + 36, -0.3, 54, 3.8, 9, true);
  const scroll = leaves
    .map(
      (p) =>
        `<path d="${p.outline}" fill="url(#gl)" stroke="${GOLD_INK}" stroke-width="0.9" stroke-linejoin="round"/><path d="${p.vein}" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.6"/>`,
    )
    .join("");
  const both = `<g>${scroll}</g><g transform="translate(${2 * cx} 0) scale(-1 1)">${scroll}</g>`;
  const sh = shieldPath(shield);
  const inner = shieldPath(shield, 3.4);
  const half = shield.w / 2;
  return svg(
    w,
    h,
    `<defs>
${lin("wood", WALNUT)}
${lin("gold", MATERIALS.gold, false)}
${lit("gl", MATERIALS.gold, cx - 80, top, cx + 80, top + 80)}
${lit("sg", MATERIALS.gold, cx - half, shield.y, cx + half, shield.y + shield.h)}
${lit("blue", MATERIALS.night, cx - half, shield.y, cx, shield.y + shield.h)}
${lit("red", MATERIALS.crimson, cx, shield.y, cx + half, shield.y + shield.h)}
${lin("ivory", MATERIALS.ivory)}
${rad("shade", ["#000000", "#000000"], [0, 0.5], 0.5, 0.15, 0.95)}
<clipPath id="cc"><path d="${body}"/></clipPath>
<clipPath id="lh"><rect x="0" y="0" width="${cx}" height="${h}"/></clipPath>
<clipPath id="rh"><rect x="${cx}" y="0" width="${cx}" height="${h}"/></clipPath>
</defs>
<path d="${body}" fill="url(#wood)"/>
<g clip-path="url(#cc)">${grain(0, 0, w, foot, 6, 7)}</g>
<path d="${body}" fill="url(#shade)"/>
<rect x="0" y="${y - 9}" width="${w}" height="18" fill="#2A180C"/>
${frieze.join("")}${course(y - 9)}${course(y + 9)}
${both}
<path d="${sh}" fill="#000" fill-opacity="0.45" transform="translate(2 4)"/>
<path d="${sh}" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="1.2"/>
<path d="${inner}" fill="url(#blue)" clip-path="url(#lh)"/>
<path d="${inner}" fill="url(#red)" clip-path="url(#rh)"/>
<path d="${inner}" fill="none" stroke="${GOLD_INK}" stroke-width="0.9"/>
<path d="M${cx} ${shield.y + 3}V${f(shield.y + shield.h - 5)}" stroke="url(#sg)" stroke-width="2.4"/>
<path d="M${cx} ${shield.y + 3}V${f(shield.y + shield.h - 5)}" stroke="${GOLD_INK}" stroke-width="0.5" stroke-dasharray="0"/>
${markBody("X", cx - half / 2 + 1, shield.y + 28, 24, "shx")}
${markBody("O", cx + half / 2 - 1, shield.y + 28, 24, "sho")}
<path d="M${f(cx - half + 4)} ${shield.y + 2}H${f(cx - 6)}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>
${medallion(L.medallions[0], "X", "mx")}
${medallion(L.medallions[1], "O", "mo")}
<path d="${edgeD}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="10" transform="translate(0 5)"/>
<path d="${edgeD}" fill="none" stroke="${GOLD_INK}" stroke-width="8"/>
<path d="${edgeD}" fill="none" stroke="url(#gold)" stroke-width="5.8"/>
<path d="${edgeD}" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.8"/>
<path d="${edgeD}" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.9" transform="translate(0 -1.8)"/>
<rect x="${f(cx - tongue + 8)}" y="${f(edge - 2)}" width="${f(tongue * 2 - 16)}" height="${f(foot - edge - 4)}" rx="6" fill="#000" fill-opacity="0.12"/>
<rect x="${plaque.x}" y="${plaque.y + 3}" width="${plaque.w}" height="${plaque.h}" rx="6" fill="#000" fill-opacity="0.45"/>
<rect x="${plaque.x}" y="${plaque.y}" width="${plaque.w}" height="${plaque.h}" rx="6" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="1.1"/>
<rect x="${plaque.x + 4}" y="${plaque.y + 4}" width="${plaque.w - 8}" height="${plaque.h - 8}" rx="4" fill="url(#ivory)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<path d="M${plaque.x + 26} ${plaque.y + 27.5}H${plaque.x + plaque.w - 26}" stroke="${GOLD_VEIN}" stroke-opacity="0.5" stroke-width="0.6"/>
<path d="M${plaque.x + 10} ${plaque.y + 2}H${f(plaque.x + plaque.w * 0.45)}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
${[plaque.x + 10, plaque.x + plaque.w - 10].map((x) => `<circle cx="${x}" cy="${plaque.y + plaque.h / 2}" r="2.4" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="0.6"/>`).join("")}`,
  );
}

// ------------------------------------------------------------- board

/** The board, s × s: a gold moulding with a jewel at each corner round a
 *  walnut field; the grid inlaid in brass, a gold boss where its bars
 *  cross; each square a shallow well. */
export function boardArt(s: number) {
  const fr = s * 0.07;
  const inner = s - fr * 2;
  const cell = inner / 3;
  const corner = s * 0.06;
  const wells = Array.from({ length: 9 }, (_, i) => {
    const x = fr + (i % 3) * cell + 7;
    const y = fr + Math.floor(i / 3) * cell + 7;
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(cell - 14)}" height="${f(cell - 14)}" rx="7" fill="url(#well)"/>
<path d="M${f(x + 4)} ${f(y + cell - 14)}H${f(x + cell - 18)}" stroke="#E8B878" stroke-opacity="0.18" stroke-width="1"/>`;
  }).join("");
  const bar = (x1: number, y1: number, x2: number, y2: number) => {
    const d = `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
    return `<path d="${d}" stroke="#000" stroke-opacity="0.4" stroke-width="7" stroke-linecap="round" transform="translate(1 2)"/>
<path d="${d}" stroke="${GOLD_INK}" stroke-width="6.4" stroke-linecap="round"/>
<path d="${d}" stroke="url(#brass)" stroke-width="4.4" stroke-linecap="round"/>
<path d="${d}" stroke="#FFF6D0" stroke-opacity="0.55" stroke-width="0.9" stroke-linecap="round" transform="translate(-0.8 -0.8)"/>`;
  };
  const a = fr + cell;
  const b = fr + cell * 2;
  const m = 10;
  const bars = [
    bar(a, fr + m, a, s - fr - m),
    bar(b, fr + m, b, s - fr - m),
    bar(fr + m, a, s - fr - m, a),
    bar(fr + m, b, s - fr - m, b),
  ].join("");
  const boss = (x: number, y: number) =>
    `<circle cx="${f(x + 1)}" cy="${f(y + 2)}" r="6.4" fill="#000" fill-opacity="0.4"/>
<circle cx="${f(x)}" cy="${f(y)}" r="6.4" fill="url(#bossg)" stroke="${GOLD_INK}" stroke-width="1"/>
<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.6"/>
<circle cx="${f(x - 2)}" cy="${f(y - 2)}" r="1.2" fill="#FFFFFF"/>`;
  const jewel = (x: number, y: number, kind: Mark, id: string) =>
    `<defs>${rad(id, kind === "X" ? ["#D8EEFF", "#2E7AE0", "#0A2A6A"] : ["#FF9AA6", "#D0102E", "#5A0410"], undefined, 0.35, 0.3, 0.8)}</defs>
<circle cx="${f(x)}" cy="${f(y)}" r="${f(corner * 0.62)}" fill="url(#bossg)" stroke="${GOLD_INK}" stroke-width="1"/>
<circle cx="${f(x)}" cy="${f(y)}" r="${f(corner * 0.4)}" fill="url(#${id})" stroke="#1A0A10" stroke-width="0.7"/>
<circle cx="${f(x - corner * 0.12)}" cy="${f(y - corner * 0.14)}" r="${f(corner * 0.1)}" fill="#FFFFFF"/>`;
  // beads along the middle of the moulding
  const beads: string[] = [];
  const n = Math.round(s / 12);
  for (let k = 1; k < n; k++) {
    const t = fr / 2 + ((s - fr) * k) / n;
    if (t < fr * 1.6 || t > s - fr * 1.6) continue;
    for (const [x, y] of [
      [t, fr / 2],
      [t, s - fr / 2],
      [fr / 2, t],
      [s - fr / 2, t],
    ])
      beads.push(`<circle cx="${f(x)}" cy="${f(y)}" r="1.25" fill="${GOLD_VEIN}"/>`);
  }
  return svg(
    s,
    s,
    `<defs>
${lit("fg", MATERIALS.gold, 0, 0, s, s)}
${lit("brass", ["#FFF2B8", "#D8A848", "#8A5E1A", "#E8C268"], 0, 0, s, s)}
${lin("bossg", MATERIALS.gold, false)}
${lit("field", ["#6E4A2C", "#553620", "#3A2212"], 0, 0, s, s)}
${rad("well", ["#000000", "#000000"], [0.32, 0.12], 0.5, 0.35, 0.75)}
${rad("vig", ["#000000", "#000000"], [0, 0.4], 0.5, 0.45, 0.8)}
<clipPath id="fc"><rect x="${f(fr)}" y="${f(fr)}" width="${f(inner)}" height="${f(inner)}" rx="6"/></clipPath>
</defs>
<rect x="3" y="7" width="${f(s - 6)}" height="${f(s - 6)}" rx="${f(s * 0.06)}" fill="#000" fill-opacity="0.5"/>
<rect x="1" y="1" width="${f(s - 2)}" height="${f(s - 2)}" rx="${f(s * 0.06)}" fill="url(#fg)" stroke="${GOLD_INK}" stroke-width="1.6"/>
<rect x="${f(fr * 0.42)}" y="${f(fr * 0.42)}" width="${f(s - fr * 0.84)}" height="${f(s - fr * 0.84)}" rx="${f(s * 0.045)}" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.8"/>
${beads.join("")}
<path d="M${f(s * 0.08)} 2.6H${f(s * 0.62)}M2.6 ${f(s * 0.08)}V${f(s * 0.5)}" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.2" stroke-linecap="round"/>
<rect x="${f(fr - 1.2)}" y="${f(fr - 1.2)}" width="${f(inner + 2.4)}" height="${f(inner + 2.4)}" rx="7" fill="${GOLD_INK}"/>
<rect x="${f(fr)}" y="${f(fr)}" width="${f(inner)}" height="${f(inner)}" rx="6" fill="url(#field)"/>
<g clip-path="url(#fc)">${grain(fr, fr, inner, inner, 5.5, 11)}</g>
<rect x="${f(fr)}" y="${f(fr)}" width="${f(inner)}" height="${f(inner)}" rx="6" fill="url(#vig)"/>
${wells}
${bars}
${boss(a, a)}${boss(b, a)}${boss(a, b)}${boss(b, b)}
${jewel(fr / 2 + 1, fr / 2 + 1, "X", "j1")}${jewel(s - fr / 2 - 1, fr / 2 + 1, "O", "j2")}${jewel(fr / 2 + 1, s - fr / 2 - 1, "O", "j3")}${jewel(s - fr / 2 - 1, s - fr / 2 - 1, "X", "j4")}`,
  );
}

/** Where square `i`'s centre is on a board s across, and the size of a
 *  square. */
export function cellAt(s: number, i: number) {
  const fr = s * 0.07;
  const cell = (s - fr * 2) / 3;
  return { x: fr + (i % 3) * cell + cell / 2, y: fr + Math.floor(i / 3) * cell + cell / 2, cell, fr };
}

// ------------------------------------------------------------- ending

/** The ending's medal, s × s: a wreath of gold leaves round a beaded
 *  rim, the field in the winner's enamel with their mark; for a draw,
 *  the field per pale with both. */
export function medalArt(kind: Mark | "draw", s: number) {
  const c = s / 2;
  const R = s * 0.34;
  // two laurel branches rising from a boss at the foot round to the top,
  // leaves on both sides of each stem, leaning up along it
  const rr = s * 0.425;
  const leaf = (x: number, y: number, deg: number, len: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})"><path d="M0 0C${f(len * 0.4)} ${f(-len * 0.25)} ${f(len * 0.4)} ${f(-len * 0.72)} 0 ${f(-len)}C${f(-len * 0.4)} ${f(-len * 0.72)} ${f(-len * 0.4)} ${f(-len * 0.25)} 0 0Z" fill="url(#lg)" stroke="${GOLD_INK}" stroke-width="0.9"/><path d="M0 ${f(-len * 0.12)}L0 ${f(-len * 0.85)}" stroke="${GOLD_VEIN}" stroke-width="0.6"/></g>`;
  const branch = (side: number) => {
    const from = Math.PI / 2 - side * 0.1;
    const to = Math.PI / 2 - side * 2.45;
    const at = (t: number) => from + (to - from) * t;
    const p = (a: number, r = rr): Pt => [c + Math.cos(a) * r, c + Math.sin(a) * r];
    const stem = Array.from({ length: 13 }, (_, i) => p(at(i / 12)));
    const parts: string[] = [
      `<path d="M${stem.map((q) => `${f(q[0])} ${f(q[1])}`).join("L")}" fill="none" stroke="${GOLD_INK}" stroke-width="3.2" stroke-linecap="round"/>`,
      `<path d="M${stem.map((q) => `${f(q[0])} ${f(q[1])}`).join("L")}" fill="none" stroke="#E2B04A" stroke-width="1.6" stroke-linecap="round"/>`,
    ];
    for (let i = 0; i < 8; i++) {
      const t = 0.06 + i * 0.12;
      const a = at(t);
      const q = p(a);
      // the way up the stem, in degrees, and the leaf leaning off it
      const up = (Math.atan2(Math.cos(a) * -side, -Math.sin(a) * -side) * 180) / Math.PI;
      const len = s * (0.12 - i * 0.006);
      parts.push(leaf(q[0], q[1], up - 38 * side + 180, len), leaf(q[0], q[1], up + 38 * side + 180, len * 0.92));
    }
    const tip = p(at(1));
    parts.push(leaf(tip[0], tip[1], (Math.atan2(Math.cos(to) * -side, -Math.sin(to) * -side) * 180) / Math.PI + 180, s * 0.08));
    return parts.join("");
  };
  const right = branch(1);
  const wreath = [right, `<g transform="translate(${s} 0) scale(-1 1)">${right}</g>`, `<circle cx="${c}" cy="${f(c + rr)}" r="${f(s * 0.032)}" fill="url(#lg)" stroke="${GOLD_INK}" stroke-width="0.9"/>`];
  const beads = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return `<circle cx="${f(c + Math.cos(a) * (R - 5))}" cy="${f(c + Math.sin(a) * (R - 5))}" r="1.9" fill="#FFF2B8" stroke="${GOLD_INK}" stroke-width="0.5"/>`;
  }).join("");
  const fieldR = R - 10;
  const field =
    kind === "draw"
      ? `<clipPath id="ml"><rect x="0" y="0" width="${c}" height="${s}"/></clipPath><clipPath id="mr"><rect x="${c}" y="0" width="${c}" height="${s}"/></clipPath>
<circle cx="${c}" cy="${c}" r="${f(fieldR)}" fill="url(#fx)" clip-path="url(#ml)"/><circle cx="${c}" cy="${c}" r="${f(fieldR)}" fill="url(#fo)" clip-path="url(#mr)"/>
<path d="M${c} ${f(c - fieldR)}V${f(c + fieldR)}" stroke="${GOLD_INK}" stroke-width="2.6"/><path d="M${c} ${f(c - fieldR)}V${f(c + fieldR)}" stroke="#E2B04A" stroke-width="1.4"/>
${markBody("X", c - fieldR * 0.46, c, fieldR * 0.78, "dx")}${markBody("O", c + fieldR * 0.46, c, fieldR * 0.78, "do")}`
      : `<circle cx="${c}" cy="${c}" r="${f(fieldR)}" fill="url(#${kind === "X" ? "fx" : "fo"})"/>${markBody(kind, c, c, fieldR * 1.5, "mm")}`;
  return svg(
    s,
    s,
    `<defs>${lit("lg", MATERIALS.gold, 0, 0, s, s)}${lit("rg", MATERIALS.gold, c - R, c - R, c + R, c + R)}${rad("fx", FIELD.X.slice(0, 3), undefined, 0.38, 0.3, 0.85)}${rad("fo", FIELD.O.slice(0, 3), undefined, 0.38, 0.3, 0.85)}</defs>
${wreath.join("")}
<circle cx="${f(c + 2)}" cy="${f(c + 5)}" r="${f(R)}" fill="#000" fill-opacity="0.45"/>
<circle cx="${c}" cy="${c}" r="${f(R)}" fill="url(#rg)" stroke="${GOLD_INK}" stroke-width="1.8"/>
${beads}
<circle cx="${c}" cy="${c}" r="${f(fieldR + 1)}" fill="${GOLD_INK}"/>
${field}
<path d="M${f(c - R * 0.78)} ${f(c - R * 0.5)}A${f(R - 1.5)} ${f(R - 1.5)} 0 0 1 ${f(c + R * 0.1)} ${f(c - R + 1.6)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.4" stroke-linecap="round"/>`,
  );
}

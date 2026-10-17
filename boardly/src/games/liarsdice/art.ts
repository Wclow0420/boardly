// Liar's Dice's still art, as SVG markup (each baked once into an image
// by the pieces that show it): the dice den's back bar across the top of
// the stage (a frieze of inlaid dice, a plaque between hop leaves, a
// shelf of glass steins, one a player, filling as they drink), the ivory
// dice, the leather cups they're shaken in, the slate the call is chalked
// on, and the gold tankard of the ending. Drawn in the house style:
// gradients lit from the upper left, an ink outline, grooves and a line
// of shine.

import { INKS, JEWELS, MATERIALS, curl, frond } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const GOLD_INK = INKS.gold.ink;
const GOLD_VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
/** A gradient lit from the upper left over the box (x0,y0)–(x1,y1). */
const lit = (id: string, colors: readonly string[], x0: number, y0: number, x1: number, y1: number) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${stops(colors)}</linearGradient>`;
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.38, cy = 0.32, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;

const OAK = ["#5A3420", "#3E2214", "#24130A"];

/** Fine grain across a piece of wood. */
function grain(x: number, y: number, w: number, h: number, step = 6, seed = 3) {
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
    for (let xx = x; xx <= x + w + 12; xx += 12) pts.push(`${f(xx)} ${f(yy + Math.sin(xx / 41 + p) * a)}`);
    const light = rnd() > 0.6;
    lines.push(
      `<path d="M${pts.join("L")}" fill="none" stroke="${light ? "#B07A4A" : "#120804"}" stroke-opacity="${light ? 0.16 : 0.34}" stroke-width="${f(0.5 + rnd() * 0.6)}"/>`,
    );
  }
  return lines.join("");
}

// ------------------------------------------------------------- dice

/** Where the pips sit on a 3 × 3 grid, by face. */
export const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export type DieTone = "plain" | "lit" | "dim";

/** A die s × s: carved ivory with rounded corners, inked pips (the one and
 *  the four in red, as dice are in a Chinese bar), a shine on its upper
 *  edge. `lit`: it counts — set in a gold rim with a warm glow; `dim`:
 *  it doesn't. */
export function dieBody(face: number, x: number, y: number, s: number, tone: DieTone, id: string) {
  const r = s * 0.2;
  const red = face === 1 || face === 4;
  const pip = s * (face === 1 ? 0.15 : 0.1);
  const cells = (PIPS[face] ?? []).map((i) => {
    const px = x + s * (0.27 + (i % 3) * 0.23);
    const py = y + s * (0.27 + Math.floor(i / 3) * 0.23);
    return `<circle cx="${f(px)}" cy="${f(py)}" r="${f(pip)}" fill="url(#${id}p)"/><circle cx="${f(px - pip * 0.3)}" cy="${f(py - pip * 0.35)}" r="${f(pip * 0.28)}" fill="#FFFFFF" fill-opacity="0.35"/>`;
  });
  const ivory = tone === "dim" ? ["#E8E2D6", "#B8B0A0", "#8A8272"] : tone === "lit" ? ["#FFFFFF", "#FFF4D8", "#F0D8A0"] : MATERIALS.ivory;
  const ink = tone === "lit" ? GOLD_INK : "#3A2408";
  const pipColor = red ? ["#FF6A6A", "#C81E2A", "#6A0A10"] : ["#5A4A3A", "#1A120A", "#000000"];
  return `<defs>${lit(`${id}f`, ivory, x, y, x + s, y + s)}${rad(`${id}p`, pipColor, undefined, 0.35, 0.3, 0.9)}</defs>
${tone === "lit" ? `<rect x="${f(x - s * 0.07)}" y="${f(y - s * 0.07)}" width="${f(s * 1.14)}" height="${f(s * 1.14)}" rx="${f(r * 1.3)}" fill="url(#${id}g)" stroke="${GOLD_INK}" stroke-width="${f(Math.max(0.6, s * 0.025))}"/><defs>${lit(`${id}g`, MATERIALS.gold, x, y, x + s, y + s)}</defs>` : ""}
<rect x="${f(x + s * 0.03)}" y="${f(y + s * 0.07)}" width="${f(s)}" height="${f(s)}" rx="${f(r)}" fill="#000" fill-opacity="${tone === "dim" ? 0.2 : 0.35}"/>
<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(r)}" fill="url(#${id}f)" stroke="${ink}" stroke-width="${f(Math.max(0.7, s * 0.035))}"/>
<rect x="${f(x + s * 0.08)}" y="${f(y + s * 0.08)}" width="${f(s * 0.84)}" height="${f(s * 0.84)}" rx="${f(r * 0.7)}" fill="none" stroke="#A08A60" stroke-opacity="0.35" stroke-width="${f(Math.max(0.5, s * 0.015))}"/>
${cells.join("")}
<path d="M${f(x + r)} ${f(y + s * 0.045)}H${f(x + s * 0.62)}" stroke="#FFFFFF" stroke-width="${f(Math.max(0.6, s * 0.03))}" stroke-linecap="round"/>`;
}

export const dieArt = (face: number, s: number, tone: DieTone = "plain") => {
  const pad = s * 0.1;
  return svg(s + pad * 2, s + pad * 2, dieBody(face, pad, pad, s, tone, `d${face}${tone}`));
};

// ------------------------------------------------------------- cup

/** A dice cup turned mouth down, w × w*1.15: tooled crimson leather
 *  stitched round, two gold bands, a gold boss on its crown; `shadow`:
 *  with its shadow on the table under its mouth. */
export function cupArt(w: number, shadow = true) {
  const h = w * 1.15;
  const top = w * 0.26;
  const bot = w * 0.47;
  const cx = w / 2;
  const y0 = h * 0.08;
  const y1 = h * 0.9;
  const body = `M${f(cx - top)} ${f(y0 + w * 0.05)}Q${f(cx)} ${f(y0 - w * 0.06)} ${f(cx + top)} ${f(y0 + w * 0.05)}L${f(cx + bot)} ${f(y1)}Q${f(cx)} ${f(y1 + w * 0.1)} ${f(cx - bot)} ${f(y1)}Z`;
  const band = (t: number, k: number) => {
    const y = y0 + (y1 - y0) * t;
    const half = top + (bot - top) * t;
    return `<path d="M${f(cx - half)} ${f(y)}Q${f(cx)} ${f(y + w * 0.07)} ${f(cx + half)} ${f(y)}L${f(cx + half + 0.6)} ${f(y + k)}Q${f(cx)} ${f(y + k + w * 0.07)} ${f(cx - half - 0.6)} ${f(y + k)}Z" fill="url(#cg)" stroke="${GOLD_INK}" stroke-width="${f(Math.max(0.6, w * 0.018))}"/>`;
  };
  const stitch = (t: number) => {
    const y = y0 + (y1 - y0) * t;
    const half = top + (bot - top) * t - w * 0.04;
    return `<path d="M${f(cx - half)} ${f(y)}Q${f(cx)} ${f(y + w * 0.07)} ${f(cx + half)} ${f(y)}" fill="none" stroke="#F0C8A0" stroke-opacity="0.55" stroke-width="${f(w * 0.012)}" stroke-dasharray="${f(w * 0.03)} ${f(w * 0.025)}"/>`;
  };
  return svg(
    w,
    h,
    `<defs>${lit("cl", ["#C84A3A", "#8A1E1A", "#4A0A0A"], cx - bot, 0, cx + bot, h)}${lit("cg", MATERIALS.gold, cx - bot, 0, cx + bot, h)}</defs>
${shadow ? `<path d="M${f(cx - bot - 1)} ${f(y1 + w * 0.06)}Q${f(cx)} ${f(y1 + w * 0.2)} ${f(cx + bot + 1)} ${f(y1 + w * 0.06)}" fill="none" stroke="#000" stroke-opacity="0.4" stroke-width="${f(w * 0.08)}" stroke-linecap="round"/>` : ""}
<path d="${body}" fill="url(#cl)" stroke="#2A0404" stroke-width="${f(Math.max(0.8, w * 0.025))}" stroke-linejoin="round"/>
${stitch(0.42)}${stitch(0.6)}
${band(0.16, w * 0.07)}${band(0.8, w * 0.08)}
<path d="M${f(cx - top * 0.55)} ${f(y0 + w * 0.12)}L${f(cx - bot * 0.62)} ${f(y1 - w * 0.12)}" stroke="#FFC8B0" stroke-opacity="0.45" stroke-width="${f(w * 0.03)}" stroke-linecap="round"/>
<circle cx="${f(cx)}" cy="${f(y0 + w * 0.01)}" r="${f(w * 0.085)}" fill="url(#cg)" stroke="${GOLD_INK}" stroke-width="${f(Math.max(0.6, w * 0.02))}"/>
<circle cx="${f(cx - w * 0.025)}" cy="${f(y0 - w * 0.015)}" r="${f(w * 0.022)}" fill="#FFFFFF"/>`,
  );
}

// ------------------------------------------------------------- stein

/** A glass stein, w × w*1.3: a pewter lid with its thumb-piece, a pewter
 *  handle, gold bands; amber beer up to `level` (0..1) under a head of
 *  foam. `out`: full to the brim and spilling, a crimson seal on it. */
export function steinArt(level: number, out: boolean, w: number) {
  const h = w * 1.3;
  const bx = w * 0.12;
  const bw = w * 0.6;
  const by = h * 0.24;
  const bh = h * 0.68;
  const r = w * 0.08;
  const glass = `M${f(bx)} ${f(by)}H${f(bx + bw)}V${f(by + bh - r)}Q${f(bx + bw)} ${f(by + bh)} ${f(bx + bw - r)} ${f(by + bh)}H${f(bx + r)}Q${f(bx)} ${f(by + bh)} ${f(bx)} ${f(by + bh - r)}Z`;
  const full = out ? 1 : Math.max(0, Math.min(1, level));
  const beerTop = by + bh * 0.08 + (bh * 0.88) * (1 - full);
  const foam =
    full > 0
      ? Array.from({ length: 5 }, (_, i) => {
          const x = bx + bw * (0.1 + i * 0.2);
          return `<circle cx="${f(x)}" cy="${f(beerTop - w * 0.01)}" r="${f(w * 0.085)}" fill="url(#sf)"/>`;
        }).join("") +
        (out
          ? `<path d="M${f(bx + bw * 0.1)} ${f(by - w * 0.02)}q${f(-w * 0.12)} ${f(w * 0.04)} ${f(-w * 0.08)} ${f(w * 0.2)}q${f(w * 0.05)} ${f(w * 0.06)} ${f(w * 0.1)} 0Z" fill="url(#sf)"/>`
          : "")
      : "";
  const handle = `M${f(bx + bw)} ${f(by + bh * 0.16)}C${f(w * 0.98)} ${f(by + bh * 0.12)} ${f(w * 0.98)} ${f(by + bh * 0.72)} ${f(bx + bw)} ${f(by + bh * 0.7)}`;
  const band = (y: number) =>
    `<rect x="${f(bx - w * 0.02)}" y="${f(y)}" width="${f(bw + w * 0.04)}" height="${f(w * 0.065)}" rx="${f(w * 0.02)}" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="${f(Math.max(0.5, w * 0.015))}"/>`;
  return svg(
    w,
    h,
    `<defs>${lit("gl", ["#F4FAFF", "#B8C8D8", "#7A8898"], bx, by, bx + bw, by + bh)}${lin("beer", ["#FFD27A", "#E89A2A", "#A85A10"])}${rad("sf", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], undefined, 0.4, 0.3, 0.8)}${lit("sg", MATERIALS.gold, 0, 0, w, h)}${lit("pw", MATERIALS.silver, 0, 0, w, h)}<clipPath id="sc"><path d="${glass}"/></clipPath></defs>
<path d="M${f(bx + w * 0.04)} ${f(by + bh + w * 0.03)}H${f(bx + bw + w * 0.04)}" stroke="#000" stroke-opacity="0.45" stroke-width="${f(w * 0.06)}" stroke-linecap="round"/>
<path d="${handle}" fill="none" stroke="${INKS.silver.ink}" stroke-width="${f(w * 0.11)}" stroke-linecap="round"/>
<path d="${handle}" fill="none" stroke="url(#pw)" stroke-width="${f(w * 0.07)}" stroke-linecap="round"/>
<path d="${glass}" fill="url(#gl)" fill-opacity="0.55"/>
${full > 0 ? `<rect x="${f(bx)}" y="${f(beerTop)}" width="${f(bw)}" height="${f(by + bh - beerTop)}" fill="url(#beer)" clip-path="url(#sc)"/>` : ""}
<g clip-path="url(#sc)">${foam}</g>
${out ? foam : ""}
<path d="${glass}" fill="none" stroke="${INKS.silver.ink}" stroke-width="${f(Math.max(0.7, w * 0.03))}"/>
<path d="M${f(bx + w * 0.07)} ${f(by + bh * 0.2)}V${f(by + bh * 0.82)}" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="${f(w * 0.035)}" stroke-linecap="round"/>
${band(by + bh * 0.06)}${band(by + bh - w * 0.1)}
<path d="M${f(bx - w * 0.04)} ${f(by + w * 0.02)}Q${f(bx + bw / 2)} ${f(by - w * 0.2)} ${f(bx + bw + w * 0.04)} ${f(by + w * 0.02)}Z" fill="url(#pw)" stroke="${INKS.silver.ink}" stroke-width="${f(Math.max(0.6, w * 0.022))}"/>
<path d="M${f(bx + bw * 0.62)} ${f(by - w * 0.08)}l${f(w * 0.22)} ${f(-w * 0.12)}l${f(w * 0.04)} ${f(w * 0.07)}Z" fill="url(#pw)" stroke="${INKS.silver.ink}" stroke-width="${f(Math.max(0.5, w * 0.018))}"/>
<circle cx="${f(bx + bw / 2)}" cy="${f(by - w * 0.09)}" r="${f(w * 0.05)}" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="${f(Math.max(0.4, w * 0.012))}"/>
${out ? `<circle cx="${f(bx + bw / 2)}" cy="${f(by + bh * 0.55)}" r="${f(w * 0.15)}" fill="#B8182E" stroke="#3A0408" stroke-width="${f(w * 0.025)}"/><path d="M${f(bx + bw / 2 - w * 0.06)} ${f(by + bh * 0.55 - w * 0.06)}l${f(w * 0.12)} ${f(w * 0.12)}m0 ${f(-w * 0.12)}l${f(-w * 0.12)} ${f(w * 0.12)}" stroke="#FFE0E0" stroke-width="${f(w * 0.03)}" stroke-linecap="round"/>` : ""}`,
  );
}

// ------------------------------------------------------------- the den

/** Where everything on the back bar sits, for one `w` wide whose content
 *  starts at `top`, with `n` steins on the shelf. */
export function denLayout(w: number, top: number, n: number) {
  const cx = w / 2;
  const shelfY = top + 118;
  const each = Math.min(56, (w - 24) / n);
  const stein = Math.min(40, each * 0.8);
  return {
    w,
    h: top + 152,
    cx,
    top,
    plaque: { x: cx - 92, y: top + 6, w: 184, h: 48 },
    shelfY,
    stein,
    steins: Array.from({ length: n }, (_, i) => ({
      x: cx + (i - (n - 1) / 2) * each,
      y: shelfY - stein * 1.3 + 2,
      each,
    })),
    frieze: top - 4,
  };
}
export type DenLayout = ReturnType<typeof denLayout>;

/** The back bar, w × h: dark oak, a frieze of inlaid dice along its top,
 *  the plaque for the round between hop leaves, and a gilt-edged shelf
 *  across for the steins (drawn on it by the Den). */
export function denArt(L: DenLayout) {
  const { w, h, cx, plaque, shelfY } = L;
  const edge = h - 8;
  // the frieze: little ivory dice, each showing the next face
  const fy = L.frieze;
  const dice: string[] = [];
  for (let x = 14, i = 0; x < w; x += 22, i++) dice.push(dieBody((i % 6) + 1, x - 5.5, fy - 5.5, 11, "plain", `fz${i}`));
  const course = (yy: number) =>
    `<rect x="0" y="${f(yy - 1.6)}" width="${w}" height="3.2" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="0.6"/>`;
  // hops: leaves and cones trailing from the plaque's ends
  const hop = (x: number, y: number, s: number, rot: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="M0 0C-6 -4 -7 -12 0 -16C7 -12 6 -4 0 0Z" fill="url(#hopg)" stroke="#14300A" stroke-width="0.7"/><path d="M-4 -5Q0 -7 4 -5M-4.6 -9.5Q0 -11.5 4.6 -9.5M-3 -13.4Q0 -15 3 -13.4" fill="none" stroke="#2E5A16" stroke-width="0.6"/><path d="M-1 -3Q-2.6 -8 -0.6 -13" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.7" fill="none"/></g>`;
  const leaf = (x: number, y: number, s: number, rot: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="${frond(22, 9, 3)}" fill="url(#leafg)" stroke="#14300A" stroke-width="0.8"/><path d="M0 -2V-19" stroke="#2E5A16" stroke-width="0.7"/></g>`;
  const vine = (side: number) => {
    const x0 = cx + side * (plaque.w / 2 + 2);
    const y0 = plaque.y + plaque.h * 0.5;
    const bine = `M${f(x0)} ${f(y0)}C${f(x0 + side * 22)} ${f(y0 - 18)} ${f(x0 + side * 44)} ${f(y0 + 16)} ${f(x0 + side * 70)} ${f(y0 - 2)}`;
    return `<path d="${bine}" fill="none" stroke="#14300A" stroke-width="3.4" stroke-linecap="round"/><path d="${bine}" fill="none" stroke="#6AAA3A" stroke-width="1.8" stroke-linecap="round"/>
${leaf(x0 + side * 18, y0 - 8, 0.9, side * 60)}${leaf(x0 + side * 46, y0 + 8, 0.8, side * 120)}${leaf(x0 + side * 66, y0 - 4, 0.7, side * 70)}
${hop(x0 + side * 30, y0 + 2, 0.85, side * 170)}${hop(x0 + side * 56, y0 + 6, 0.75, side * 190)}`;
  };
  return svg(
    w,
    h,
    `<defs>
${lin("oak", OAK)}
${lin("gold", MATERIALS.gold, false)}
${lit("pg", MATERIALS.gold, plaque.x, plaque.y, plaque.x + plaque.w, plaque.y + plaque.h)}
${lin("ivory", MATERIALS.ivory)}
${lin("hopg", ["#E8F8B0", "#9ACC5A", "#4A7A1E"])}
${lin("leafg", MATERIALS.leaf)}
${lin("shelf", ["#6A4024", "#3E2214"])}
${rad("shade", ["#000000", "#000000"], [0, 0.5], 0.5, 0.15, 0.95)}
<clipPath id="cc"><rect width="${w}" height="${edge}"/></clipPath>
</defs>
<rect width="${w}" height="${edge}" fill="url(#oak)"/>
<g clip-path="url(#cc)">${grain(0, 0, w, edge, 6, 5)}</g>
<rect width="${w}" height="${edge}" fill="url(#shade)"/>
<rect x="0" y="${fy - 9}" width="${w}" height="18" fill="#1E0E06"/>
${dice.join("")}${course(fy - 9)}${course(fy + 9)}
${vine(1)}${vine(-1)}
<rect x="${plaque.x}" y="${plaque.y + 3}" width="${plaque.w}" height="${plaque.h}" rx="6" fill="#000" fill-opacity="0.45"/>
<rect x="${plaque.x}" y="${plaque.y}" width="${plaque.w}" height="${plaque.h}" rx="6" fill="url(#pg)" stroke="${GOLD_INK}" stroke-width="1.1"/>
<rect x="${plaque.x + 4}" y="${plaque.y + 4}" width="${plaque.w - 8}" height="${plaque.h - 8}" rx="4" fill="url(#ivory)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<path d="M${plaque.x + 10} ${plaque.y + 2}H${f(plaque.x + plaque.w * 0.45)}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
${[plaque.x + 10, plaque.x + plaque.w - 10].map((x) => `<circle cx="${x}" cy="${plaque.y + plaque.h / 2}" r="2.4" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="0.6"/>`).join("")}
<rect x="0" y="${shelfY}" width="${w}" height="${f(edge - shelfY)}" fill="url(#shelf)"/>
<rect x="0" y="${shelfY + 6}" width="${w}" height="${f(edge - shelfY - 6)}" fill="#000" fill-opacity="0.25"/>
<rect x="0" y="${f(shelfY - 1.8)}" width="${w}" height="3.6" fill="url(#gold)" stroke="${GOLD_INK}" stroke-width="0.6"/>
<path d="M0 ${edge}H${w}" stroke="#000" stroke-opacity="0.45" stroke-width="10" transform="translate(0 5)"/>
<path d="M0 ${edge}H${w}" stroke="${GOLD_INK}" stroke-width="8"/>
<path d="M0 ${edge}H${w}" stroke="url(#gold)" stroke-width="5.8"/>
<path d="M0 ${edge}H${w}" stroke="${GOLD_VEIN}" stroke-width="0.8"/>
<path d="M0 ${f(edge - 1.8)}H${w}" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="0.9"/>`,
  );
}

// ------------------------------------------------------------- slate

/** The slate the call is chalked on, w × h: dark slate in a gold moulding
 *  with a ruby at the top and rivets at the corners. */
export function slateArt(w: number, h: number) {
  const fr = 6;
  const corner = (x: number, y: number) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="0.7"/><circle cx="${f(x - 0.8)}" cy="${f(y - 0.8)}" r="0.8" fill="#FFFFFF"/>`;
  const [jl, jb, jd] = JEWELS.ruby;
  return svg(
    w,
    h + 6,
    `<defs>${lit("sg", MATERIALS.gold, 0, 0, w, h)}${lit("sl", ["#3A4048", "#24282E", "#16191E"], 0, 0, w, h)}${rad("sr", [jl, jb, jd], undefined, 0.35, 0.3, 0.8)}</defs>
<rect x="2" y="8" width="${f(w - 4)}" height="${f(h - 4)}" rx="10" fill="#000" fill-opacity="0.5"/>
<rect x="1" y="4" width="${f(w - 2)}" height="${f(h - 2)}" rx="10" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="1.3"/>
<rect x="${fr}" y="${fr + 3}" width="${f(w - fr * 2)}" height="${f(h - fr * 2)}" rx="6" fill="url(#sl)" stroke="${GOLD_INK}" stroke-width="1"/>
<path d="M${fr + 6} ${f(h - fr - 2)}Q${f(w * 0.3)} ${f(h - fr - 8)} ${f(w * 0.45)} ${f(h - fr - 3)}M${f(w * 0.62)} ${f(fr + 12)}Q${f(w * 0.8)} ${f(fr + 8)} ${f(w - fr - 8)} ${f(fr + 14)}" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M14 5.4H${f(w * 0.5)}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>
${corner(fr - 0.5, fr + 2.5)}${corner(w - fr + 0.5, fr + 2.5)}${corner(fr - 0.5, h - fr + 3.5)}${corner(w - fr + 0.5, h - fr + 3.5)}
<circle cx="${f(w / 2)}" cy="5" r="6.4" fill="url(#sg)" stroke="${GOLD_INK}" stroke-width="0.9"/>
<circle cx="${f(w / 2)}" cy="5" r="4" fill="url(#sr)" stroke="#3A0408" stroke-width="0.7"/>
<circle cx="${f(w / 2 - 1.2)}" cy="3.6" r="1.1" fill="#FFFFFF"/>`,
  );
}

// ------------------------------------------------------------- ending

/** The ending's tankard, s × s: a gold tankard brimming with foam, a ruby
 *  on its lid, the lid thrown open. */
export function tankardArt(s: number) {
  const bx = s * 0.24;
  const bw = s * 0.42;
  const by = s * 0.3;
  const bh = s * 0.58;
  const body = `M${f(bx)} ${f(by)}H${f(bx + bw)}L${f(bx + bw - s * 0.02)} ${f(by + bh)}Q${f(bx + bw / 2)} ${f(by + bh + s * 0.03)} ${f(bx + s * 0.02)} ${f(by + bh)}Z`;
  const handle = `M${f(bx + bw - s * 0.01)} ${f(by + bh * 0.15)}C${f(s * 0.9)} ${f(by + bh * 0.1)} ${f(s * 0.9)} ${f(by + bh * 0.75)} ${f(bx + bw - s * 0.015)} ${f(by + bh * 0.72)}`;
  const foam = [
    [0.08, 0.02, 0.09],
    [0.28, -0.04, 0.11],
    [0.52, -0.05, 0.12],
    [0.76, -0.02, 0.1],
    [0.94, 0.03, 0.08],
    [0.42, -0.1, 0.08],
  ]
    .map(([u, v, r]) => `<circle cx="${f(bx + bw * u)}" cy="${f(by + s * v)}" r="${f(s * r)}" fill="url(#tf)" stroke="#A08A60" stroke-width="0.8"/>`)
    .join("");
  const ring = (t: number) =>
    `<path d="M${f(bx + s * 0.005)} ${f(by + bh * t)}H${f(bx + bw - s * 0.005)}" stroke="${GOLD_INK}" stroke-width="${f(s * 0.035)}"/><path d="M${f(bx + s * 0.005)} ${f(by + bh * t)}H${f(bx + bw - s * 0.005)}" stroke="#FFF2B8" stroke-width="${f(s * 0.016)}"/>`;
  const [jl, jb, jd] = JEWELS.ruby;
  return svg(
    s,
    s,
    `<defs>${lit("tg", MATERIALS.gold, bx, by, bx + bw, by + bh)}${lit("th", MATERIALS.gold, 0, 0, s, s)}${rad("tf", MATERIALS.ivory, undefined, 0.4, 0.3, 0.8)}${rad("tr", [jl, jb, jd], undefined, 0.35, 0.3, 0.8)}</defs>
<path d="M${f(bx - s * 0.02)} ${f(by + bh + s * 0.04)}H${f(bx + bw + s * 0.06)}" stroke="#000" stroke-opacity="0.45" stroke-width="${f(s * 0.05)}" stroke-linecap="round"/>
<path d="${handle}" fill="none" stroke="${GOLD_INK}" stroke-width="${f(s * 0.085)}" stroke-linecap="round"/>
<path d="${handle}" fill="none" stroke="url(#th)" stroke-width="${f(s * 0.055)}" stroke-linecap="round"/>
<path d="M${f(bx + bw * 0.7)} ${f(by - s * 0.02)}L${f(bx + bw + s * 0.06)} ${f(by - s * 0.2)}L${f(bx + bw + s * 0.13)} ${f(by - s * 0.14)}L${f(bx + bw + s * 0.02)} ${f(by + s * 0.01)}Z" fill="url(#th)" stroke="${GOLD_INK}" stroke-width="1.1"/>
<circle cx="${f(bx + bw + s * 0.095)}" cy="${f(by - s * 0.17)}" r="${f(s * 0.035)}" fill="url(#tr)" stroke="#3A0408" stroke-width="0.8"/>
<path d="${body}" fill="url(#tg)" stroke="${GOLD_INK}" stroke-width="1.4"/>
${ring(0.12)}${ring(0.88)}
<path d="M${f(bx + bw * 0.5)} ${f(by + bh * 0.3)}l${f(s * 0.06)} ${f(s * 0.08)}l${f(-s * 0.06)} ${f(s * 0.08)}l${f(-s * 0.06)} ${f(-s * 0.08)}Z" fill="url(#tr)" stroke="#3A0408" stroke-width="0.9"/>
<path d="M${f(bx + bw * 0.5 - s * 0.012)} ${f(by + bh * 0.3 + s * 0.04)}l${f(s * 0.018)} ${f(-s * 0.02)}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
<path d="M${f(bx + s * 0.04)} ${f(by + bh * 0.2)}V${f(by + bh * 0.8)}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="${f(s * 0.018)}" stroke-linecap="round"/>
${foam}
<path d="M${f(bx + bw * 0.16)} ${f(by - s * 0.07)}q${f(s * 0.04)} ${f(-s * 0.03)} ${f(s * 0.08)} ${f(-s * 0.02)}" stroke="#FFFFFF" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  );
}

// ------------------------------------------------------------- my board

/** The board my own dice sit on, hung on two gold chains from the den's
 *  shelf: its size, where the chains meet it and where each die lies. */
export const BOARD = { die: 30, gap: 7, padX: 19, padY: 11, chain: 32 } as const;
export function boardLayout() {
  const { die, gap, padX, padY, chain } = BOARD;
  const w = 5 * die + 4 * gap + padX * 2;
  const bh = die + padY * 2;
  return {
    w,
    /** The whole picture: the chains, the board and its shadow. */
    h: chain + bh + 6,
    chain,
    bh,
    /** Where the chains hang, across. */
    hooks: [w * 0.17, w * 0.83],
    /** Each die's top-left corner, left to right. */
    slots: Array.from({ length: 5 }, (_, i) => ({ x: padX + i * (die + gap), y: chain + padY })),
  };
}

/** An oval as a path (Skia's SVG reader drops gradients on <ellipse>). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** The hanging board: an oak frame in a gold moulding, a green felt bed
 *  with five hollows for the dice, gold corner bosses, and at the top two
 *  scrolled brackets each holding a chain of gold links rising out of
 *  sight behind the shelf. */
export function boardArt() {
  const L = boardLayout();
  const { w, chain, bh } = L;
  const y0 = chain;
  const y1 = chain + bh;
  const m = 6; // the oak between the moulding and the felt
  const r = 9;
  const shape = (x0: number, yy0: number, x1: number, yy1: number, rr: number) =>
    `M${f(x0 + rr)} ${f(yy0)}H${f(x1 - rr)}Q${f(x1)} ${f(yy0)} ${f(x1)} ${f(yy0 + rr)}V${f(yy1 - rr)}Q${f(x1)} ${f(yy1)} ${f(x1 - rr)} ${f(yy1)}H${f(x0 + rr)}Q${f(x0)} ${f(yy1)} ${f(x0)} ${f(yy1 - rr)}V${f(yy0 + rr)}Q${f(x0)} ${f(yy0)} ${f(x0 + rr)} ${f(yy0)}Z`;
  const outer = shape(1, y0, w - 1, y1, r);
  const wood = shape(4, y0 + 3, w - 4, y1 - 3, r - 2);
  const felt = shape(4 + m, y0 + 3 + m - 1, w - 4 - m, y1 - 3 - m + 1, r - 5);
  const { die } = BOARD;
  const wells = L.slots
    .map(
      (s) =>
        `<rect x="${f(s.x - 1.5)}" y="${f(s.y - 1.5)}" width="${f(die + 3)}" height="${f(die + 3)}" rx="${f(die * 0.24)}" fill="#06180E" fill-opacity="0.55"/>` +
        `<path d="M${f(s.x + die * 0.2)} ${f(s.y + die + 1.6)}H${f(s.x + die * 0.86)}" stroke="#7ACB9A" stroke-opacity="0.35" stroke-width="0.8" stroke-linecap="round"/>`,
    )
    .join("");
  // a chain: links face on (rings) and edge on (bars), rising to the top
  const chainAt = (x: number) => {
    const links: string[] = [];
    for (let y = y0 - 3, i = 0; y > -8; y -= 5.2, i++) {
      if (i % 2 === 0) {
        const d = oval(x, y, 2.6, 3.6);
        links.push(
          `<path d="${d}" fill="none" stroke="${GOLD_INK}" stroke-width="2.9"/><path d="${d}" fill="none" stroke="url(#bg)" stroke-width="1.6"/>`,
        );
      } else {
        links.push(
          `<path d="M${f(x)} ${f(y - 3.6)}V${f(y + 3.6)}" stroke="${GOLD_INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M${f(x)} ${f(y - 3.2)}V${f(y + 3.2)}" stroke="url(#bg)" stroke-width="1.3" stroke-linecap="round"/>`,
        );
      }
    }
    return links.join("");
  };
  // the bracket: a gold plate with an eye, a scroll curling off each side
  const bracket = (x: number) => {
    const scrolls = [-1, 1]
      .map((side) => {
        const c = curl(x + side * 3, y0 + 2.2, side < 0 ? Math.PI : 0, 15, side * -4.4, 3.4);
        return `<path d="${c.outline}" fill="url(#bg)" stroke="${GOLD_INK}" stroke-width="0.7"/><path d="${c.vein}" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.45"/>`;
      })
      .join("");
    return `${scrolls}<path d="M${f(x - 5)} ${f(y0 + 5.5)}L${f(x - 3.6)} ${f(y0 - 1.4)}Q${f(x)} ${f(y0 - 3.6)} ${f(x + 3.6)} ${f(y0 - 1.4)}L${f(x + 5)} ${f(y0 + 5.5)}Z" fill="url(#bg)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<circle cx="${f(x)}" cy="${f(y0 + 1.2)}" r="1.5" fill="#2A1404"/><circle cx="${f(x - 0.5)}" cy="${f(y0 - 0.6)}" r="0.6" fill="#FFFFFF" fill-opacity="0.85"/>`;
  };
  const boss = (x: number, y: number) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="url(#bg)" stroke="${GOLD_INK}" stroke-width="0.6"/><circle cx="${f(x - 0.7)}" cy="${f(y - 0.7)}" r="0.7" fill="#FFFFFF"/>`;
  return svg(
    w,
    L.h,
    `<defs>${lit("bg", MATERIALS.gold, 0, 0, w, L.h)}${lit("bo", ["#7A4A2A", "#4A2A16", "#24130A"], 0, y0, w, y1)}${rad("bf", ["#3E8A5E", "#1E5A3A", "#0E2E1C"], undefined, 0.4, 0.3, 0.9)}<clipPath id="bw"><path d="${wood}"/></clipPath></defs>
${L.hooks.map(chainAt).join("")}
<path d="${outer}" fill="#000" fill-opacity="0.45" transform="translate(1.5 4)"/>
<path d="${outer}" fill="url(#bg)" stroke="${GOLD_INK}" stroke-width="1.2"/>
<path d="M${f(r + 3)} ${f(y0 + 1.4)}H${f(w * 0.48)}" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="0.9" stroke-linecap="round"/>
<path d="${wood}" fill="url(#bo)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<g clip-path="url(#bw)">${grain(4, y0 + 3, w - 8, bh - 6, 3.4, 11)}</g>
<path d="${felt}" fill="url(#bf)" stroke="${GOLD_INK}" stroke-width="0.9"/>
<path d="${felt}" fill="none" stroke="#E8C890" stroke-opacity="0.35" stroke-width="0.6" stroke-dasharray="2 1.6" transform="translate(0 0)"/>
${wells}
${boss(4 + m / 2 + 0.2, y0 + 3 + m / 2 + 0.2)}${boss(w - 4 - m / 2 - 0.2, y0 + 3 + m / 2 + 0.2)}${boss(4 + m / 2 + 0.2, y1 - 3 - m / 2 - 0.2)}${boss(w - 4 - m / 2 - 0.2, y1 - 3 - m / 2 - 0.2)}
${L.hooks.map(bracket).join("")}`,
  );
}

// ------------------------------------------------------------- the shake

/** The shadow a cup throws on the mat under its mouth, w × h. */
export function cupShadowArt(w: number, h: number) {
  return svg(
    w,
    h,
    `<defs>${rad("cs", ["#000000", "#000000"], [0.6, 0], 0.5, 0.5, 0.5)}</defs><path d="${oval(w / 2, h / 2, w / 2, h / 2)}" fill="url(#cs)"/>`,
  );
}

/** The felt mat the cup is shaken on, w × h (an oval seen from the
 *  front): a gold rim round green baize, stitched, its shadow under it. */
export function matArt(w: number, h: number) {
  const cx = w / 2;
  const cy = h * 0.46;
  const rx = w / 2 - 3;
  const ry = h * 0.42;
  return svg(
    w,
    h,
    `<defs>${lit("mg", MATERIALS.gold, 0, 0, w, h)}${rad("mf", ["#3E8A5E", "#1E5A3A", "#0A2414"], undefined, 0.45, 0.35, 0.75)}</defs>
<path d="${oval(cx + 2, cy + h * 0.07, rx, ry)}" fill="#000" fill-opacity="0.5"/>
<path d="${oval(cx, cy, rx, ry)}" fill="url(#mg)" stroke="${GOLD_INK}" stroke-width="1.3"/>
<path d="${oval(cx, cy + 1, rx - 6, ry - 5)}" fill="url(#mf)" stroke="${GOLD_INK}" stroke-width="1"/>
<path d="${oval(cx, cy + 1, rx - 12, ry - 10)}" fill="none" stroke="#E8C890" stroke-opacity="0.4" stroke-width="0.9" stroke-dasharray="4 3"/>
<path d="M${f(cx - rx * 0.78)} ${f(cy - ry * 0.55)}Q${f(cx - rx * 0.35)} ${f(cy - ry * 1.02)} ${f(cx + rx * 0.1)} ${f(cy - ry * 0.98)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.2" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.2)} ${f(cy + ry * 0.92)}Q${f(cx + rx * 0.62)} ${f(cy + ry * 0.8)} ${f(cx + rx * 0.86)} ${f(cy + ry * 0.4)}" fill="none" stroke="${GOLD_VEIN}" stroke-width="0.8" stroke-linecap="round"/>`,
  );
}

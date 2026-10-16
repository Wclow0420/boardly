// The game stage's still art, as SVG markup (baked once into images by
// the stage's parts): the sign that hangs on two chains over the scene,
// the seals along it, and the plinth the main button stands on. Drawn in
// the house style; the enamel takes the game's colours.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, MATERIALS, curl } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map((c, i) => `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`)
    .join("");
const lin = (id: string, colors: readonly string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.36, cy = 0.3, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

/** The sign's shape: a plaque whose top rises to a pointed gothic arch in
 *  the middle, shrunk evenly by `k` (for the enamel inside the gilt). */
function signPath(w: number, h: number, k = 0) {
  const top = 22;
  const r = 12 - k * 0.5;
  const cx = w / 2;
  return (
    `M${f(k)} ${f(top + r)}Q${f(k)} ${f(top + k)} ${f(k + r)} ${f(top + k)}` +
    `H${f(cx - 34 + k * 0.4)}Q${f(cx - 12)} ${f(top + k)} ${f(cx)} ${f(k * 1.3 + 2)}` +
    `Q${f(cx + 12)} ${f(top + k)} ${f(cx + 34 - k * 0.4)} ${f(top + k)}` +
    `H${f(w - k - r)}Q${f(w - k)} ${f(top + k)} ${f(w - k)} ${f(top + r)}` +
    `V${f(h - k - r)}Q${f(w - k)} ${f(h - k)} ${f(w - k - r)} ${f(h - k)}` +
    `H${f(k + r)}Q${f(k)} ${f(h - k)} ${f(k)} ${f(h - k - r)}Z`
  );
}

export interface SignLayout {
  w: number;
  h: number;
  /** Where the chains hang from (above the sign) and meet it. */
  chains: [number, number];
  /** The chains' length above the sign. */
  drop: number;
}

export function signLayout(w: number, drop = 30): SignLayout {
  return { w, h: 108, chains: [w * 0.2, w * 0.8], drop };
}

/** The hanging sign, w × (drop + h): two gold chains, iron scroll
 *  brackets where they meet the sign, a gilded plaque with a gothic arch
 *  over its middle, enamel in the game's colours (`enamel`, top to
 *  bottom), a lantern finial on the arch's point. */
export function hangingSign(L: SignLayout, enamel: readonly string[]) {
  const { w, h, chains, drop } = L;
  const chain = (x: number) =>
    Array.from({ length: Math.ceil(drop / 7) }, (_, i) => {
      const y = i * 7;
      return i % 2
        ? `<rect x="${f(x - 1.6)}" y="${y}" width="3.2" height="8" rx="1.6" fill="url(#cg)" stroke="${INK}" stroke-width="0.6"/>`
        : `<ellipse cx="${x}" cy="${y + 4}" rx="3.4" ry="4.4" fill="none" stroke="url(#cg)" stroke-width="2"/><ellipse cx="${x}" cy="${y + 4}" rx="3.4" ry="4.4" fill="none" stroke="${INK}" stroke-width="0.5"/>`;
    }).join("");
  const bracket = (x: number, side: number) =>
    toSvgBody(
      [curl(x, drop + 24, side > 0 ? -0.3 : Math.PI + 0.3, 26, side * -3.4, 5, 0.6)].map(
        (p): EmblemData[number] => ({ d: p.outline, m: "gold", vein: p.vein, ink: 0.8, vw: 0.45 }),
      ),
      undefined,
      `br${side}`,
    );
  const outer = signPath(w, h);
  const inner = signPath(w, h, 6);
  const groove = signPath(w, h, 3);
  return svg(
    w,
    drop + h + 6,
    `<defs>${lin("cg", MATERIALS.gold, false)}${lin("sg", MATERIALS.gold, false)}${lin("en", enamel)}${rad("fl", ["#FFF6C8", "#FFB23A", "#E2541A"])}</defs>
${chain(chains[0])}${chain(chains[1])}
<g transform="translate(0 ${drop})">
<path d="${outer}" fill="#000" fill-opacity="0.45" transform="translate(0 4)"/>
<path d="${outer}" fill="url(#sg)"/>
<path d="${inner}" fill="url(#en)"/>
<path d="${groove}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
<path d="M14 ${24.2}H${f(w / 2 - 40)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.9"/>
<path d="${outer}" fill="none" stroke="${INK}" stroke-width="1.3"/>
<path d="${inner}" fill="none" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(w / 2 - 34)} ${h - 30}H${f(w / 2 + 34)}" stroke="#C8902E" stroke-opacity="0.5" stroke-width="0.8"/>
</g>
${[chains[0], chains[1]].map((x) => `<circle cx="${x}" cy="${drop + 22}" r="4" fill="url(#cg)" stroke="${INK}" stroke-width="0.8"/>`).join("")}
${bracket(chains[0], -1)}${bracket(chains[1], 1)}`,
  );
}

export type SealKind = "won" | "lost" | "now" | "ahead";

/** One seal on the sign's track, 30 square: won is green wax, lost is
 *  cracked crimson, the night now is a gold socket lit by the lantern,
 *  nights ahead are empty sockets. */
export function sealArt(kind: SealKind) {
  const s = 30;
  const c = s / 2;
  const notches = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    const r = i % 2 ? 12.6 : 13.6;
    return `${i ? "L" : "M"}${f(c + Math.cos(a) * r)} ${f(c + Math.sin(a) * r)}`;
  }).join("") + "Z";
  const body =
    kind === "won"
      ? `<defs>${rad("w", ["#B8F0A0", "#3A9A4A", "#14401E"])}</defs><path d="${notches}" fill="url(#w)" stroke="#0A2A10" stroke-width="0.9"/><path d="M${c - 4.5} ${c}l3 3.4l6.4 -7" fill="none" stroke="#E8FFD8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
      : kind === "lost"
        ? `<defs>${rad("w", ["#FF9AA6", "#B0102A", "#4A0410"])}</defs><path d="${notches}" fill="url(#w)" stroke="#3A0408" stroke-width="0.9"/><path d="M${c - 5} ${c - 6}l3 5l-2 3l4 4" fill="none" stroke="#2A0206" stroke-width="1.4" stroke-linecap="round"/>`
        : kind === "now"
          ? `<defs>${lin("g", MATERIALS.gold, false)}${rad("gl", ["#FFD58A", "#FFD58A"], [0.85, 0], 0.5, 0.5, 0.5)}</defs><circle cx="${c}" cy="${c}" r="${c}" fill="url(#gl)"/><circle cx="${c}" cy="${c}" r="10.5" fill="#1A1008" stroke="url(#g)" stroke-width="3"/><circle cx="${c}" cy="${c}" r="12" fill="none" stroke="${INK}" stroke-width="0.7"/>`
          : `<defs>${lin("g", MATERIALS.gold, false)}</defs><circle cx="${c}" cy="${c}" r="10" fill="#0E0A06" fill-opacity="0.7" stroke="url(#g)" stroke-width="2"/><circle cx="${c}" cy="${c}" r="11" fill="none" stroke="${INK}" stroke-width="0.6"/>`;
  return svg(s, s, body);
}

/** The plinth across the foot of the stage, w × h: a dark carved ledge
 *  whose top edge rises in a shallow arch, a gold rim along it with a
 *  groove and rivets, and a soft shadow cast up onto the scene. */
export function plinth(w: number, h: number) {
  const rise = 26;
  const edge = `M0 ${rise + 8}Q${w / 2} ${-rise + 8} ${w} ${rise + 8}`;
  const shape = `${edge}V${h}H0Z`;
  const rivets = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 0.5) / 9;
    const x = w * t;
    const y = (1 - t) ** 2 * (rise + 8) + 2 * (1 - t) * t * (-rise + 8) + t ** 2 * (rise + 8);
    return `<circle cx="${f(x)}" cy="${f(y + 11)}" r="2" fill="url(#rv)" stroke="${INK}" stroke-width="0.5"/>`;
  }).join("");
  return svg(
    w,
    h,
    `<defs>${lin("st", ["#2E2620", "#1A1410", "#0E0A08"])}${lin("rg", MATERIALS.gold, false)}${rad("rv", ["#FFF6D0", "#E2B04A", "#7A5212"])}</defs>
<path d="${edge}" fill="none" stroke="#000" stroke-opacity="0.4" stroke-width="16" transform="translate(0 -8)"/>
<path d="${shape}" fill="url(#st)"/>
<path d="${edge}" fill="none" stroke="${INK}" stroke-width="7.4"/>
<path d="${edge}" fill="none" stroke="url(#rg)" stroke-width="5.4"/>
<path d="${edge}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
<path d="${edge}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.9" transform="translate(0 -1.8)"/>
${rivets}
${Array.from({ length: 6 }, (_, i) => `<path d="M${f(w * (0.1 + i * 0.16))} ${rise + 40}V${h}" stroke="#000" stroke-opacity="0.25" stroke-width="1"/>`).join("")}`,
  );
}


/** A soft pool of light, size square: `color` fading out from the middle. */
export function glowArt(size: number, color: string, alpha = 0.16) {
  return svg(
    size,
    size,
    `<defs>${rad("gw", [color, color], [alpha, 0], 0.5, 0.5, 0.5)}</defs><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#gw)"/>`,
  );
}

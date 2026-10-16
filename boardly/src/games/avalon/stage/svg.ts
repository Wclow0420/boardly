// Small SVG helpers shared by Double Agent's drawings (the header, the
// dossier, the stamps, the ending's seal): numbers, gradients, a wax
// blob, a four-point glint. Everything is plain markup, baked once into
// images by the components that show it.

import { MATERIALS } from "@/components/engraved/shapes";

export const f = (n: number) => +n.toFixed(2);

export const stops = (colors: readonly string[], op?: number[]) =>
  colors
    .map(
      (c, i) =>
        `<stop offset="${f(i / Math.max(colors.length - 1, 1))}" stop-color="${c}"${op ? ` stop-opacity="${op[i]}"` : ""}/>`,
    )
    .join("");

/** A linear gradient, top-left to bottom-right unless told otherwise. */
export const lin = (id: string, colors: readonly string[], x2 = 1, y2 = 1, op?: number[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(colors, op)}</linearGradient>`;

/** A radial gradient lit from the upper left. */
export const rad = (id: string, colors: readonly string[], op?: number[], cx = 0.38, cy = 0.32, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, op)}</radialGradient>`;

export const GOLD = MATERIALS.gold;
export const IVORY = MATERIALS.ivory;
export const IRON = MATERIALS.iron;
export const SILVER = MATERIALS.silver;

/** The case files' card stock. */
export const MANILA = ["#FFF2CC", "#F0D49A", "#C9A45A"] as const;
export const MANILA_BACK = ["#E8CC8A", "#C9A45A", "#8A6A2E"] as const;
/** Red sealing wax, light to deep. */
export const WAX = ["#F05A6A", "#B8182E", "#5A0612"] as const;
/** The agency's enamel: deep sea-green. */
export const TEAL = ["#8AE8DA", "#1E8A80", "#0A3A36"] as const;
/** Green stamp ink and enamel. */
export const GREEN = ["#9CF0B8", "#22A058", "#0C4A26"] as const;

export const INK = "#3A2408";
export const STEEL_INK = "#0E1418";

/** A wobbly circle round (cx, cy): wax spreading under a stamp. */
export function blob(cx: number, cy: number, r: number, wobble: number, lobes: number, phase: number) {
  const n = 60;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r + Math.sin(a * lobes + phase) * wobble + Math.sin(a * (lobes + 3) + phase * 2) * wobble * 0.45;
    return `${f(cx + Math.cos(a) * k)} ${f(cy + Math.sin(a) * k)}`;
  });
  return `M${pts.join("L")}Z`;
}

/** A circle as a path (Skia's SVG reader fills paths and circles alike;
 *  a path can join others in one outline). */
export const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;

/** A rounded rectangle as a path. */
export function rrect(x: number, y: number, w: number, h: number, r: number) {
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}

/** A four-pointed glint at (x, y), `r` long. */
export const glintPath = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y - r)}Q${f(x + r * 0.12)} ${f(y - r * 0.12)} ${f(x + r)} ${f(y)}Q${f(x + r * 0.12)} ${f(y + r * 0.12)} ${f(x)} ${f(y + r)}Q${f(x - r * 0.12)} ${f(y + r * 0.12)} ${f(x - r)} ${f(y)}Q${f(x - r * 0.12)} ${f(y - r * 0.12)} ${f(x)} ${f(y - r)}Z`;

/** A filled, inked shape with an optional engraved vein and shine. */
export function part(
  d: string,
  fill: string,
  ink: string,
  inkW = 1,
  extra: { vein?: string; veinColor?: string; vw?: number; shine?: string; sw?: number; evenOdd?: boolean } = {},
) {
  const rule = extra.evenOdd ? ` fill-rule="evenodd"` : "";
  return [
    `<path d="${d}" fill="${fill}"${rule}/>`,
    extra.vein
      ? `<path d="${extra.vein}" fill="none" stroke="${extra.veinColor ?? "#7A5212"}" stroke-width="${extra.vw ?? 0.7}" stroke-linecap="round"/>`
      : "",
    extra.shine
      ? `<path d="${extra.shine}" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="${extra.sw ?? 0.9}" stroke-linecap="round"/>`
      : "",
    inkW > 0 ? `<path d="${d}" fill="none"${rule} stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>` : "",
  ].join("");
}

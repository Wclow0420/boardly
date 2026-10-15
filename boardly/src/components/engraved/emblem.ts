// Emblems as plain data: a list of engraved parts in a 48 × 48 box. One
// renderer draws them in the app (EmblemGlyph.tsx), and toSvg draws the
// same data as an SVG file, so a whole set can be looked over at once
// (scripts/emblem-sheet.mjs). Game icon sets are written this way.

import {
  INKS,
  JEWELS,
  MATERIALS,
  cloth,
  enamel,
  type Jewel,
  type Material,
} from "./shapes";

/** A part's fill: a material; "tint", the colour the emblem is shown in
 *  (a room's colour, the text's) as enamel; or any colour ("#E8B88A")
 *  as cloth, skin or hair. */
export type Shade = Material | "tint" | `#${string}`;

export type EmblemPart =
  /** An engraved shape: filled, its veins and shine cut in, inked. */
  | {
      d: string;
      m?: Shade;
      vein?: string;
      shine?: string;
      evenOdd?: boolean;
      /** Outline width (default 1.5; 0 for none). */
      ink?: number;
      /** Widths of the vein and shine lines (default 0.9 and 1.1). */
      vw?: number;
      sw?: number;
      /** Lit like something round (light from the upper left) rather
       *  than a flat sheen. */
      round?: boolean;
      /** See-through: for soft shadows and highlights laid over. */
      op?: number;
      /** An SVG transform, e.g. "rotate(-45 24 24)". */
      t?: string;
    }
  /** A round cabochon. */
  | { jewel: Jewel; x: number; y: number; r: number; t?: string }
  /** A flat dark fill: keyholes, pips, slits. */
  | { dark: string; t?: string }
  /** A piped line (icing, stitching): a round-ended stroke of `color`. */
  | { line: string; color: string; w: number; op?: number; t?: string };

export type EmblemData = EmblemPart[];

/** Where the light falls on a round part, as fractions of its bounds:
 *  the brightest point and how far the light spreads. */
export const LIGHT = { cx: 0.36, cy: 0.3, r: 0.85 };

/** Path data reflected left to right across a box `width` wide, by
 *  rewriting its coordinates (a mirrored transform would break round
 *  gradients on some renderers). */
export function mirrorPath(d: string, width: number) {
  const out: string[] = [];
  for (const [, cmd, args] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    const rel = cmd === cmd.toLowerCase();
    const x = (v: number) => (rel ? -v : width - v);
    const up = cmd.toUpperCase();
    const flipped = n.map((v, i) => {
      if (up === "H") return x(v);
      if (up === "V" || up === "Z") return v;
      if (up === "A") {
        const k = i % 7;
        if (k === 2) return -v; // the ellipse's tilt
        if (k === 4) return 1 - v; // the sweep turns the other way
        if (k === 5) return x(v);
        return v;
      }
      return i % 2 === 0 ? x(v) : v;
    });
    out.push(cmd + flipped.map((v) => +v.toFixed(3)).join(" "));
  }
  return out.join("");
}

/** A transform list reflected the same way: rotations turn back, and
 *  their centres move across. */
export function mirrorTransform(t: string, width: number) {
  return t.replace(/(\w+)\(([^)]*)\)/g, (all, op: string, args: string) => {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (op === "rotate") return n.length === 3 ? `rotate(${-n[0]} ${width - n[1]} ${n[2]})` : `rotate(${-n[0]})`;
    if (op === "translate") return `translate(${-n[0]} ${n[1] ?? 0})`;
    return all;
  });
}

/** A circle as path data. */
export const disc = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z`;
/** A ring (use with evenOdd). */
export const ring = (cx: number, cy: number, r: number, hole: number) =>
  disc(cx, cy, r) + disc(cx, cy, hole);

/** A shade's colours, outline and engraving. */
export function shadeOf(m: Shade | undefined, tint: string | undefined) {
  if (m === "tint") return enamel(tint ?? "#E2B04A");
  if (m?.startsWith("#")) return cloth(m);
  const material = (m ?? "gold") as Material;
  return { colors: [...MATERIALS[material]], ...INKS[material] };
}

/** The emblem as an SVG document, `size` points wide; `box` is the
 *  drawing's own size (48 × 48 for icons). */
export function toSvg(
  data: EmblemData,
  size: number,
  tint?: string,
  box: [number, number] = [48, 48],
) {
  const [w, h] = box;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${(size * h) / w}" viewBox="0 0 ${w} ${h}">${toSvgBody(data, tint, "e")}</svg>`;
}

/** The emblem's parts as SVG elements; `id` keeps gradient ids apart. */
export function toSvgBody(
  data: EmblemData,
  tint: string | undefined,
  id: string,
) {
  return data
    .map((part, i) => {
      const t = part.t ? ` transform="${part.t}"` : "";
      if ("dark" in part) return `<path d="${part.dark}" fill="#1A1008"${t}/>`;
      if ("line" in part)
        return `<path d="${part.line}" fill="none" stroke="${part.color}" stroke-width="${part.w}" stroke-linecap="round" stroke-linejoin="round"${part.op !== undefined ? ` opacity="${part.op}"` : ""}${t}/>`;
      if ("jewel" in part) {
        const [light, body, deep] = JEWELS[part.jewel];
        const g = `${id}j${i}`;
        const { x, y, r } = part;
        return `<g${t}><defs><radialGradient id="${g}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="${light}"/><stop offset="0.45" stop-color="${body}"/><stop offset="1" stop-color="${deep}"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="#3A2408" stroke-width="1.2"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.25}" fill="#fff" opacity="0.9"/></g>`;
      }
      const { colors, ink, vein } = shadeOf(part.m, tint);
      const g = `${id}g${i}`;
      const rule = part.evenOdd ? "evenodd" : "nonzero";
      const stops = colors
        .map(
          (c, k) =>
            `<stop offset="${k / (colors.length - 1)}" stop-color="${c}"/>`,
        )
        .join("");
      const op = part.op !== undefined ? ` opacity="${part.op}"` : "";
      const gradient = part.round
        ? `<radialGradient id="${g}" cx="${LIGHT.cx}" cy="${LIGHT.cy}" r="${LIGHT.r}">${stops}</radialGradient>`
        : `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`;
      return [
        `<g${t}${op}><defs>${gradient}</defs>`,
        `<path d="${part.d}" fill="url(#${g})" fill-rule="${rule}"/>`,
        part.vein
          ? `<path d="${part.vein}" fill="none" stroke="${vein}" stroke-width="${part.vw ?? 0.9}" stroke-linecap="round"/>`
          : "",
        part.shine
          ? `<path d="${part.shine}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${part.sw ?? 1.1}" stroke-linecap="round"/>`
          : "",
        (part.ink ?? 1.5) > 0
          ? `<path d="${part.d}" fill="none" fill-rule="${rule}" stroke="${ink}" stroke-width="${part.ink ?? 1.5}" stroke-linejoin="round"/>`
          : "",
        `</g>`,
      ].join("");
    })
    .join("");
}

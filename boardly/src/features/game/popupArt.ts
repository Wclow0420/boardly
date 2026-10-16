// The game popup's panel as SVG markup, baked once per size and look:
// the game's dark card lit warm from the top, a hairline of gold inset
// round it, the gilded moulding, and a jewelled corner piece in each
// corner.

import { corners, linear, moulding, radial } from "@/components/engraved/panel";
import type { Jewel } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";

export const POPUP_RIM = 6;
export const POPUP_RADIUS = 18;

export function popupPanel(w: number, h: number, fill: readonly [string, string], glow: string, jewel: Jewel) {
  const t = POPUP_RIM;
  const r = POPUP_RADIUS;
  const inner = rrect(t, t, w - 2 * t, h - 2 * t, r - t);
  const hair = rrect(t + 7, t + 7, w - 2 * t - 14, h - 2 * t - 14, Math.max(2, r - t - 5));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${linear("gf", fill)}
${radial("gl", [glow, glow], [0.2, 0], 0.5, 0.0, 0.75)}
${radial("gv", ["#000000", "#000000"], [0, 0.5], 0.5, 0.45, 0.85)}
${linear("gh", ["#F0CC72", "#9A6B1E"], true, [0.55, 0.3])}
<clipPath id="gc"><path d="${inner}"/></clipPath>
</defs>
<g clip-path="url(#gc)"><rect width="${w}" height="${h}" fill="url(#gf)"/><rect width="${w}" height="${h}" fill="url(#gl)"/><rect width="${w}" height="${h}" fill="url(#gv)"/></g>
<path d="${hair}" fill="none" stroke="url(#gh)" stroke-width="1"/>
${moulding(0, 0, w, h, r, t, "gm")}
${corners(w, h, -2, 0.5, "gk", jewel)}
</svg>`;
}

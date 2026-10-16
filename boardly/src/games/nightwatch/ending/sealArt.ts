// The manor's seal, stamped at the end of the game, as SVG in a 160 box:
// a blob of crimson wax with a rolled edge, a gold ring set with beads
// and engraved round, and the emblem pressed in the middle — the lantern
// when the seal holds; when the ghosts break free, the wax is darker,
// split by cracks, and a ghost is pressed in it instead.

import { toSvgBody } from "@/components/engraved/emblem";
import { emblemData } from "@/components/icons";

export const SEAL = 160;
const C = SEAL / 2;
const f = (n: number) => +n.toFixed(2);

/** A wobbly circle: wax spreading unevenly under the stamp. */
function blob(r: number, wobble: number, lobes: number, phase: number) {
  const n = 72;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r + Math.sin(a * lobes + phase) * wobble + Math.sin(a * (lobes + 3) + phase * 2) * wobble * 0.45;
    return `${f(C + Math.cos(a) * k)} ${f(C + Math.sin(a) * k)}`;
  });
  return `M${pts.join("L")}Z`;
}

export function sealArt(broken: boolean) {
  const wax = broken ? ["#B02840", "#6A0A1A", "#2A0208"] : ["#F05A6A", "#B8182E", "#5A0612"];
  const emblem = emblemData(broken ? "👻" : "🏮");
  const pressed = emblem ? toSvgBody(emblem.data, emblem.tint, "se") : "";
  const beads = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return `<circle cx="${f(C + Math.cos(a) * 52)}" cy="${f(C + Math.sin(a) * 52)}" r="2.3" fill="url(#sg)" stroke="#3A2408" stroke-width="0.6"/>`;
  }).join("");
  const cracks = broken
    ? [
        `M${C - 4} ${C - 74}L${C + 2} ${C - 50}L${C - 6} ${C - 30}L${C + 4} ${C - 8}L${C - 2} ${C + 16}`,
        `M${C + 70} ${C + 12}L${C + 46} ${C + 6}L${C + 30} ${C + 20}L${C + 8} ${C + 14}`,
        `M${C - 62} ${C + 40}L${C - 40} ${C + 28}L${C - 30} ${C + 40}L${C - 10} ${C + 30}`,
        `M${C + 30} ${C - 64}L${C + 22} ${C - 44}L${C + 34} ${C - 30}`,
      ]
        .map((d) => `<path d="${d}" fill="none" stroke="#120004" stroke-width="3.2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FF6A7A" stroke-opacity="0.45" stroke-width="0.9" transform="translate(1 1)"/>`)
        .join("")
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SEAL}" height="${SEAL}" viewBox="0 0 ${SEAL} ${SEAL}">
<defs>
<radialGradient id="sw" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="${wax[0]}"/><stop offset="0.5" stop-color="${wax[1]}"/><stop offset="1" stop-color="${wax[2]}"/></radialGradient>
<radialGradient id="sr" cx="0.62" cy="0.7" r="0.7"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
<linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#9A6B1E"/><stop offset="1" stop-color="#F0CC72"/></linearGradient>
</defs>
<path d="${blob(76, 3.4, 7, 0.4)}" fill="#000" fill-opacity="0.35" transform="translate(2 4)"/>
<path d="${blob(76, 3.4, 7, 0.4)}" fill="url(#sw)" stroke="#2A0208" stroke-width="1.4"/>
<path d="${blob(66, 1.6, 9, 1.1)}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="5"/>
<path d="${blob(66, 1.6, 9, 1.1)}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="1.6" transform="translate(-1.2 -1.2)"/>
<circle cx="${C}" cy="${C}" r="58" fill="none" stroke="url(#sg)" stroke-width="7"/>
<circle cx="${C}" cy="${C}" r="58" fill="none" stroke="#7A5212" stroke-width="0.7" stroke-dasharray="1.5 2.2"/>
<circle cx="${C}" cy="${C}" r="61.5" fill="none" stroke="#3A2408" stroke-width="1"/>
<circle cx="${C}" cy="${C}" r="54.5" fill="none" stroke="#3A2408" stroke-width="1"/>
${beads}
<circle cx="${C}" cy="${C}" r="45" fill="url(#sw)" stroke="#2A0208" stroke-width="1"/>
<circle cx="${C}" cy="${C}" r="45" fill="url(#sr)"/>
<g transform="translate(${C - 36} ${C - 36}) scale(1.5)">${pressed}</g>
${cracks}
<path d="M${C - 50} ${C - 34}Q${C - 40} ${C - 52} ${C - 18} ${C - 58}" stroke="#fff" stroke-opacity="0.85" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</svg>`;
}

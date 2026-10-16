// Tonight's announcement as a letter, in SVG (baked once per size): the
// envelope it comes in — folded ivory with its flap shut — and the
// parchment it's written on, a deckled sheet browned at the edges, ruled
// round in gold with scrolls in its corners and a gilt rule under its
// head. The wax seal on the envelope is the manor's (ending/sealArt.ts).

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { cornerScrolls } from "@/components/engraved/trim";

const f = (n: number) => +n.toFixed(1);

/** A rectangle whose edges wander a little, like torn paper. */
function deckle(x: number, y: number, w: number, h: number, step = 9, wobble = 1.6) {
  const pts: string[] = [];
  const jitter = (i: number) => Math.sin(i * 12.9898) * 43758.5453 % 1;
  let i = 0;
  const push = (px: number, py: number) => pts.push(`${f(px)} ${f(py)}`);
  for (let k = 0; k <= w; k += step) push(x + k, y + jitter(i++) * wobble);
  for (let k = 0; k <= h; k += step) push(x + w + jitter(i++) * wobble, y + k);
  for (let k = w; k >= 0; k -= step) push(x + k, y + h + jitter(i++) * wobble);
  for (let k = h; k >= 0; k -= step) push(x + jitter(i++) * wobble, y + k);
  return `M${pts.join("L")}Z`;
}

/** The parchment, w × h. `head` is how far down its gilt rule runs. */
export function parchment(w: number, h: number, head: number) {
  const scrolls = cornerScrolls(18);
  const corner: EmblemData = scrolls.map((c) => ({ d: c.outline, m: "gold", vein: c.vein, ink: 0.8, vw: 0.5 }));
  const body = toSvgBody(corner, undefined, "pc");
  const at = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})">${body}</g>`;
  const inset = 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<radialGradient id="pp" cx="0.45" cy="0.4" r="0.75"><stop offset="0" stop-color="#FBF4E2"/><stop offset="0.6" stop-color="#EEDDB8"/><stop offset="1" stop-color="#C9A874"/></radialGradient>
<linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9A6B1E" stop-opacity="0"/><stop offset="0.2" stop-color="#C8902E"/><stop offset="0.5" stop-color="#F0CC72"/><stop offset="0.8" stop-color="#C8902E"/><stop offset="1" stop-color="#9A6B1E" stop-opacity="0"/></linearGradient>
</defs>
<path d="${deckle(4, 6, w - 8, h - 10)}" fill="#000" fill-opacity="0.4" transform="translate(1 3)"/>
<path d="${deckle(4, 4, w - 8, h - 10)}" fill="url(#pp)" stroke="#8A6A3A" stroke-width="0.8"/>
<rect x="${inset}" y="${inset}" width="${w - 2 * inset}" height="${h - 2 * inset - 4}" rx="3" fill="none" stroke="#B8862E" stroke-width="1.1"/>
<rect x="${inset + 3}" y="${inset + 3}" width="${w - 2 * inset - 6}" height="${h - 2 * inset - 10}" rx="2" fill="none" stroke="#B8862E" stroke-opacity="0.55" stroke-width="0.6"/>
${at(inset + 2, inset + 2, 1, 1)}${at(w - inset - 2, inset + 2, -1, 1)}${at(inset + 2, h - inset - 6, 1, -1)}${at(w - inset - 2, h - inset - 6, -1, -1)}
<path d="M${w * 0.18} ${head}H${w * 0.82}" stroke="url(#pg)" stroke-width="2"/>
<path d="M${w / 2 - 5} ${head}L${w / 2} ${head - 5}L${w / 2 + 5} ${head}L${w / 2} ${head + 5}Z" fill="#E2B04A" stroke="#3A2408" stroke-width="0.8"/>
</svg>`;
}

/** The envelope, w × h, its flap shut down to the middle. */
export function envelope(w: number, h: number) {
  const tip = h * 0.58;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="eb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6EBD0"/><stop offset="1" stop-color="#CDB384"/></linearGradient>
<linearGradient id="ef" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF3DE"/><stop offset="1" stop-color="#DCC598"/></linearGradient>
</defs>
<rect x="2" y="5" width="${w - 4}" height="${h - 6}" rx="6" fill="#000" fill-opacity="0.4"/>
<rect x="1" y="2" width="${w - 2}" height="${h - 6}" rx="6" fill="url(#eb)" stroke="#6A4A1E" stroke-width="1.2"/>
<path d="M2 ${h - 6}L${w / 2} ${h * 0.5}L${w - 2} ${h - 6}" fill="none" stroke="#8A6A3A" stroke-width="1"/>
<path d="M2 ${h - 6}L${w / 2} ${h * 0.5}L${w - 2} ${h - 6}Z" fill="#000" fill-opacity="0.06"/>
<path d="M1 6Q1 2 6 2H${w - 6}Q${w - 1} 2 ${w - 1} 6L${w / 2 + 8} ${tip - 4}Q${w / 2} ${tip + 3} ${w / 2 - 8} ${tip - 4}Z" fill="url(#ef)" stroke="#6A4A1E" stroke-width="1.2"/>
<path d="M14 7H${w * 0.4}" stroke="#fff" stroke-opacity="0.85" stroke-width="1.2" stroke-linecap="round"/>
<rect x="8" y="8" width="${w - 16}" height="${h - 20}" rx="3" fill="none" stroke="#B8862E" stroke-opacity="0.5" stroke-width="0.8" stroke-dasharray="3 3"/>
</svg>`;
}

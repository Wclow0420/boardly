// The bare stage's still art, as SVG (baked once per size): the boards,
// planks running back with a gilt edge along the front; and the lighting
// rig across the top, a gilded bar with a lamp hanging over each player.

const f = (n: number) => +n.toFixed(1);
const GOLD =
  '<stop offset="0" stop-color="#FFF2B8"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#9A6B1E"/><stop offset="1" stop-color="#F0CC72"/>';

/** Where the rig's bar runs, from the top. */
export const RIG_Y = 8;

export function floorArt(w: number, h: number) {
  const n = 14;
  const planks = Array.from({ length: n }, (_, i) => {
    const top = (i / n) * w * 0.7 + w * 0.15;
    const top2 = ((i + 1) / n) * w * 0.7 + w * 0.15;
    const bot = (i / n) * (w + 80) - 40;
    const bot2 = ((i + 1) / n) * (w + 80) - 40;
    return `<path d="M${f(top)} 0L${f(top2)} 0L${f(bot2)} ${h - 8}L${f(bot)} ${h - 8}Z" fill="${i % 2 ? "#4A2C16" : "#563420"}" stroke="#1E1006" stroke-width="1"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.8"/><stop offset="0.6" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
<linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">${GOLD}</linearGradient>
</defs>
${planks}
<rect width="${w}" height="${h - 8}" fill="url(#fd)"/>
<rect x="0" y="${h - 9}" width="${w}" height="9" fill="url(#fg)" stroke="#3A2408" stroke-width="1"/>
<path d="M8 ${h - 6.5}H${f(w * 0.45)}" stroke="#fff" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>
</svg>`;
}

/** The rig, w wide: the bar, and a lamp at each x — a bracket, an iron
 *  can tipped down, a gold rim round its dark lens. */
export function rigArt(w: number, xs: number[]) {
  const y = RIG_Y;
  const lamps = xs
    .map((x) => {
      const cy = y + 14;
      return (
        `<path d="M${f(x - 1.2)} ${y + 4}H${f(x + 1.2)}V${y + 9}H${f(x - 1.2)}Z" fill="#2A2E36"/>` +
        `<path d="M${f(x - 6)} ${y + 7}H${f(x + 6)}L${f(x + 8.5)} ${cy + 6}H${f(x - 8.5)}Z" fill="url(#can)" stroke="#0E1014" stroke-width="1"/>` +
        `<path d="M${f(x - 4.5)} ${y + 9}L${f(x - 6)} ${cy + 4}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8"/>` +
        `<path d="M${f(x - 10)} ${cy + 6}H${f(x + 10)}V${cy + 8.5}H${f(x - 10)}Z" fill="url(#rg)" stroke="#3A2408" stroke-width="0.8"/>`
      );
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${y + 30}" viewBox="0 0 ${w} ${y + 30}">
<defs>
<linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">${GOLD}</linearGradient>
<linearGradient id="can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A606A"/><stop offset="0.4" stop-color="#2A2E36"/><stop offset="1" stop-color="#14161C"/></linearGradient>
</defs>
<path d="M0 ${y - 3}H${w}V${y + 4}H0Z" fill="url(#rg)" stroke="#3A2408" stroke-width="1"/>
<path d="M0 ${y + 0.5}H${w}" stroke="#7A5212" stroke-width="0.7"/>
<path d="M10 ${y - 1.6}H${f(w * 0.45)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.9" stroke-linecap="round"/>
${lamps}
</svg>`;
}

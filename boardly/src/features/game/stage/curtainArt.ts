// The stage curtain's still art, as SVG markup (baked once per size by
// StageCurtain): crimson velvet panels in deep pleats, a braided gold
// edge where they meet, gold fringe along their scalloped hems; and the
// valance over them — swags of the same velvet hung from a gilt rod
// with finials, tassels where the swags meet, and a crest set with a
// jewel at its middle.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, JEWELS, MATERIALS, curl, type Jewel } from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(1);
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;

/** Velvet, light to dark. */
export const VELVET = { light: "#F06070", mid: "#B0182E", deep: "#62061A", dark: "#2A0208" };

const goldDefs = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${GOLD.map(
    (c, i) => `<stop offset="${f(i / (GOLD.length - 1))}" stop-color="${c}"/>`,
  ).join("")}</linearGradient>`;

/** The fringe hanging from a hem: short gold threads along `pts`. */
function fringe(pts: [number, number][], len: number) {
  return pts
    .map(([x, y], i) => `<path d="M${f(x)} ${f(y)}V${f(y + len + (i % 3) * 1.2)}" stroke="${i % 2 ? "#C8902E" : "#F0CC72"}" stroke-width="1.6" stroke-linecap="round"/>`)
    .join("");
}

/** One curtain panel, w × h. `side` is the edge it meets the other one
 *  on (the left panel's inner edge is on its right). */
export function curtainPanel(w: number, h: number, side: "left" | "right") {
  const fold = 24;
  const n = Math.ceil(w / fold) + 1;
  const hem = h - 22;
  const folds: string[] = [];
  const lines: string[] = [];
  const hemPts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x0 = i * fold;
    const x1 = x0 + fold;
    const drop = i % 2 ? 5 : 0;
    // each pleat rounds off at the hem
    folds.push(
      `<path d="M${x0} 0H${x1}V${hem + drop}Q${f(x0 + fold / 2)} ${hem + drop + 9} ${x0} ${hem + drop}Z" fill="url(#pleat)"/>`,
    );
    lines.push(
      `<path d="M${x0} 0V${hem + drop}" stroke="${VELVET.dark}" stroke-opacity="0.75" stroke-width="1.2"/>`,
      `<path d="M${f(x0 + fold * 0.42)} 6V${hem + drop - 2}" stroke="#fff" stroke-opacity="0.13" stroke-width="2"/>`,
    );
    for (let k = 0; k < 6; k++) {
      const u = k / 6;
      const x = x0 + u * fold;
      const y = hem + drop + Math.sin(u * Math.PI) * 8.5;
      hemPts.push([x, y]);
    }
  }
  // the braid where the panels meet
  const edge = side === "left" ? w - 7 : 0;
  const braid = Array.from({ length: Math.ceil(h / 9) }, (_, i) => {
    const y = i * 9;
    return `<path d="M${edge} ${y + 4.5}L${edge + 3.5} ${y}L${edge + 7} ${y + 4.5}L${edge + 3.5} ${y + 9}Z" fill="url(#gold)" stroke="${INK}" stroke-width="0.7"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="pleat" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${VELVET.dark}"/><stop offset="0.22" stop-color="${VELVET.deep}"/><stop offset="0.45" stop-color="${VELVET.light}"/><stop offset="0.6" stop-color="${VELVET.mid}"/><stop offset="1" stop-color="${VELVET.dark}"/>
</linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.18" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/>
</linearGradient>
<linearGradient id="side" x1="${side === "left" ? 0 : 1}" y1="0" x2="${side === "left" ? 1 : 0}" y2="0">
<stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/>
</linearGradient>
${goldDefs("gold")}
</defs>
${folds.join("")}${lines.join("")}
<rect width="${w}" height="${h}" fill="url(#shade)"/>
<rect width="${w}" height="${h}" fill="url(#side)"/>
<path d="M${hemPts.map(([x, y]) => `${f(x)} ${f(y - 3)}`).join("L")}" fill="none" stroke="url(#gold)" stroke-width="3.2"/>
<path d="M${hemPts.map(([x, y]) => `${f(x)} ${f(y - 3)}`).join("L")}" fill="none" stroke="${INK}" stroke-width="0.6" stroke-dasharray="2 2.4"/>
${fringe(hemPts, 8)}
${braid}
</svg>`;
}

/** A tassel hanging from (x, y): a gold knob, a waist, a skirt of threads. */
function tassel(x: number, y: number, s = 1) {
  const k = (n: number) => f(n * s);
  const threads = Array.from({ length: 7 }, (_, i) => {
    const tx = x + k(-5 + (i * 10) / 6);
    return `<path d="M${tx} ${f(y + k(11))}L${f(tx + (i - 3) * 0.5 * s)} ${f(y + k(24))}" stroke="${i % 2 ? "#C8902E" : "#F6D88A"}" stroke-width="${k(1.5)}" stroke-linecap="round"/>`;
  }).join("");
  return (
    `<path d="M${x} ${y}V${f(y + k(4))}" stroke="${INK}" stroke-width="1"/>` +
    threads +
    `<circle cx="${x}" cy="${f(y + k(7))}" r="${k(4.3)}" fill="url(#gold)" stroke="${INK}" stroke-width="0.9"/>` +
    `<path d="M${f(x - k(5.6))} ${f(y + k(10.4))}H${f(x + k(5.6))}V${f(y + k(12.6))}H${f(x - k(5.6))}Z" fill="url(#gold)" stroke="${INK}" stroke-width="0.8"/>`
  );
}

/** The valance across the top, w × h: the rod, the swags, their tassels
 *  and fringe, the crest at the middle. */
export function valance(w: number, h: number, jewel: Jewel) {
  const rod = 12;
  const swags = Math.max(3, Math.round(w / 110));
  const sw = w / swags;
  const parts: string[] = [];
  for (let i = 0; i < swags; i++) {
    const x0 = i * sw;
    const x1 = x0 + sw;
    const mx = x0 + sw / 2;
    const low = h - 40;
    // a swag: a deep crescent of velvet, folds curving across it
    parts.push(
      `<path d="M${f(x0 - 4)} ${rod - 2}Q${f(mx)} ${f(rod + 10)} ${f(x1 + 4)} ${rod - 2}L${f(x1 + 2)} ${f(rod + 8)}Q${f(mx)} ${f(low + 14)} ${f(x0 - 2)} ${f(rod + 8)}Z" fill="url(#swag)" stroke="${VELVET.dark}" stroke-width="1.2"/>`,
    );
    for (let k = 1; k <= 3; k++) {
      const y = rod + 4 + k * ((low - rod) / 4.2);
      parts.push(
        `<path d="M${f(x0 + 4 + k * 3)} ${f(rod + 8 + k * 2)}Q${f(mx)} ${f(y + 8)} ${f(x1 - 4 - k * 3)} ${f(rod + 8 + k * 2)}" fill="none" stroke="${VELVET.dark}" stroke-opacity="0.7" stroke-width="1.1"/>`,
        `<path d="M${f(x0 + 8 + k * 3)} ${f(rod + 6 + k * 2)}Q${f(mx)} ${f(y + 4)} ${f(x1 - 8 - k * 3)} ${f(rod + 6 + k * 2)}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1.6"/>`,
      );
    }
    // its gold-trimmed hem and fringe
    const hem: [number, number][] = Array.from({ length: 22 }, (_, k) => {
      const u = k / 21;
      const x = x0 - 2 + u * (sw + 4);
      const y = (1 - u) * (1 - u) * (rod + 8) + 2 * (1 - u) * u * (low + 14) + u * u * (rod + 8);
      return [x, y];
    });
    parts.push(
      `<path d="M${hem.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}" fill="none" stroke="url(#gold)" stroke-width="3"/>`,
      fringe(hem.slice(2, -2), 6),
    );
  }
  // tassels where the swags meet, and at both ends
  for (let i = 0; i <= swags; i++) parts.push(tassel(Math.min(w - 8, Math.max(8, i * sw)), rod - 1, 1));
  // the gilt rod with its finials
  const rodBar =
    `<rect x="0" y="0" width="${w}" height="${rod}" fill="url(#gold)" stroke="${INK}" stroke-width="1.1"/>` +
    `<path d="M0 ${rod / 2}H${w}" stroke="${INKS.gold.vein}" stroke-width="0.7"/>` +
    `<path d="M10 2.6H${f(w * 0.45)}" stroke="#fff" stroke-opacity="0.85" stroke-width="1" stroke-linecap="round"/>`;
  // the crest at the middle: a gold cartouche with scrolls and a jewel
  const cx = w / 2;
  const scroll = curl(cx - 10, 6, Math.PI * 0.95, 20, 3.6, 4.4);
  const crest: EmblemData = [
    { d: scroll.outline, m: "gold", vein: scroll.vein, ink: 1, vw: 0.6 },
    {
      d: scroll.outline.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${f(2 * cx - Number(x))} ${y}`),
      m: "gold",
      ink: 1,
    },
    { d: `M${cx - 13} 1Q${cx} -6 ${cx + 13} 1L${cx + 10} 18Q${cx} 25 ${cx - 10} 18Z`, m: "gold", vein: `M${cx - 8} 4Q${cx} 0 ${cx + 8} 4`, ink: 1.2 },
    { jewel, x: cx, y: 10, r: 5.6 },
  ];
  const [, body] = JEWELS[jewel];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 -14 ${w} ${h}">
<defs>
${goldDefs("gold")}
<linearGradient id="swag" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${VELVET.deep}"/><stop offset="0.35" stop-color="${VELVET.light}"/><stop offset="0.7" stop-color="${VELVET.mid}"/><stop offset="1" stop-color="${VELVET.dark}"/>
</linearGradient>
</defs>
${parts.join("")}
${rodBar}
<circle cx="${cx}" cy="10" r="22" fill="${body}" fill-opacity="0.16"/>
<g transform="translate(${cx} 10) scale(1.45) translate(${-cx} -10)">${toSvgBody(crest, undefined, "vc")}</g>
</svg>`;
}

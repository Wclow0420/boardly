// The badge hall's still art, as SVG markup (drawn once by SvgXml, and
// looked over with scripts/hall-sheet.mjs): the velvet wall with its gold
// damask and gilded frame, the glass showcase with its pedestals, and
// the gold plates the collection sits on. Nothing here moves.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { INKS, LEAF, MATERIALS, acanthus, curl } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";

const f = (n: number) => +n.toFixed(2);

export const HALL_RIM = 6;
export const HALL_RADIUS = 22;
const GOLD = MATERIALS.gold;
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

const stops = (colors: readonly string[], opacity?: number[]) =>
  colors
    .map(
      (c, i) =>
        `<stop offset="${f(i / Math.max(1, colors.length - 1))}" stop-color="${c}"${opacity ? ` stop-opacity="${opacity[i]}"` : ""}/>`,
    )
    .join("");
const linear = (id: string, colors: readonly string[], vertical = true, opacity?: number[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops(colors, opacity)}</linearGradient>`;
const radial = (id: string, colors: readonly string[], opacity?: number[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(colors, opacity)}</radialGradient>`;

/** A corner piece (top-left; mirror it for the others): a beaded gold
 *  rosette set with a ruby on the corner, acanthus running out along both
 *  edges, and a fan of leaves behind. */
function cornerParts(): EmblemData {
  const gold = (p: { outline: string; vein: string }) => ({
    d: p.outline,
    m: "gold" as const,
    vein: p.vein,
    ink: 1,
    vw: 0.55,
  });
  const edge = [
    ...acanthus(24, 17, -0.08, 84, 2.5, 9, true),
    curl(24, 20, 0.5, 35, 3.6, 5, 0.6),
  ].map(gold);
  // the same along the other edge: mirrored across the diagonal
  const swap = (d: string) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${y} ${x}`);
  const down = edge.map((p) => ({ ...p, d: swap(p.d), vein: swap(p.vein) }));
  const fan = [-28, 0, 28].map((a) => ({
    d: LEAF(a ? 20 : 26, a ? 6 : 7.5),
    m: "gold" as const,
    vein: `M0 -1L0 ${a ? -18 : -24}`,
    ink: 0.9,
    vw: 0.5,
    t: `translate(14 14) rotate(${135 + a})`,
  }));
  const beads = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x = f(14 + Math.cos(a) * 8.2);
    const y = f(14 + Math.sin(a) * 8.2);
    return { d: `M${f(x - 1.2)} ${y}A1.2 1.2 0 1 0 ${f(x + 1.2)} ${y}A1.2 1.2 0 1 0 ${f(x - 1.2)} ${y}Z`, m: "gold" as const, round: true, ink: 0.4 };
  });
  return [
    ...fan,
    ...edge,
    ...down,
    { d: "M14 3A11 11 0 1 0 14.01 3Z", m: "gold", round: true, ink: 1.1 },
    ...beads,
    { jewel: "ruby", x: 14, y: 14, r: 4.6 },
  ];
}

/** Corner pieces in all four corners of a w × h box, `inset` in,
 *  drawn at `scale`. */
export function corners(w: number, h: number, inset: number, scale: number, id: string) {
  const body = toSvgBody(cornerParts(), undefined, id);
  const at = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx * scale)} ${f(sy * scale)})">${body}</g>`;
  return [
    at(inset, inset, 1, 1),
    at(w - inset, inset, -1, 1),
    at(inset, h - inset, 1, -1),
    at(w - inset, h - inset, -1, -1),
  ].join("");
}

/** A gilded moulding (a rounded frame `t` thick) with its groove, ink and
 *  one shine, as markup. */
function moulding(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  t: number,
  id: string,
  metal: "gold" | "silver" = "gold",
) {
  const outer = rrect(x, y, w, h, r);
  const inner = rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(1, r - t));
  const groove = rrect(x + t / 2, y + t / 2, w - t, h - t, Math.max(1, r - t / 2));
  const { ink, vein } = INKS[metal];
  return (
    `<defs>${linear(id, MATERIALS[metal], false)}</defs>` +
    `<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#${id})"/>` +
    `<path d="${groove}" fill="none" stroke="${vein}" stroke-width="0.7" stroke-opacity="0.9"/>` +
    `<path d="M${f(x + r)} ${f(y + t * 0.4)}H${f(x + w * 0.4)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.9"/>` +
    `<path d="${outer}" fill="none" stroke="${ink}" stroke-width="1.3"/>` +
    `<path d="${inner}" fill="none" stroke="${ink}" stroke-width="0.9"/>`
  );
}

/** A badge card, w × h (drawn with 4 to spare round it for its shadow):
 *  dark wood in a metal moulding, the tag it hangs from at the top;
 *  dimmer when the badge isn't earned. */
export function cardArt(w: number, h: number, metal: "gold" | "silver", dim: boolean) {
  const p = 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * p}" height="${h + 2 * p}" viewBox="${-p} ${-p} ${w + 2 * p} ${h + 2 * p}">
<defs>${linear("cf", dim ? ["#2E2620", "#1E1812"] : ["#4A2E1A", "#2E1A0E"])}</defs>
<path d="${rrect(0, 3, w, h, 12)}" fill="#000" fill-opacity="0.45"/>
<path d="${rrect(1, 1, w - 2, h - 2, 11)}" fill="url(#cf)"/>
${moulding(0, 0, w, h, 12, 3, "cm", metal)}
<path d="${rrect(w / 2 - 9, 3, 18, 5, 2.5)}" fill="#1A0E06" stroke="#C8902E" stroke-width="1"/>
</svg>`;
}

/** The hall's wall: tall wooden planks, the grain running down them,
 *  nailed top and bottom, darker toward the edges. */
export function hallWall(w: number, h: number) {
  const plank = 46;
  const n = Math.ceil(w / plank);
  const planks = Array.from({ length: n }, (_, i) => {
    const x = i * plank;
    const tone = ["#7A4E2C", "#6E4526", "#835532", "#704828"][i % 4];
    // a few grain lines down the plank, gently waving
    const grain = [0.22, 0.48, 0.71]
      .map((k, g) => {
        const gx = x + plank * k;
        const wave = 3 + ((i + g) % 3);
        return `<path d="M${f(gx)} 0C${f(gx + wave)} ${f(h * 0.25)} ${f(gx - wave)} ${f(h * 0.6)} ${f(gx + wave * 0.5)} ${h}" fill="none" stroke="#3A2010" stroke-opacity="0.22" stroke-width="1"/>`;
      })
      .join("");
    const knot = (i * 37) % 5 === 0
      ? `<ellipse cx="${f(x + plank * 0.6)}" cy="${f((i * 173) % h)}" rx="4" ry="7" fill="none" stroke="#3A2010" stroke-opacity="0.3" stroke-width="1.2"/>`
      : "";
    const nails = [40, h - 40]
      .map((y) => `<circle cx="${f(x + plank / 2)}" cy="${y}" r="2.6" fill="url(#nail)" stroke="#1E1208" stroke-width="0.8"/>`)
      .join("");
    return (
      `<rect x="${x}" y="0" width="${plank}" height="${h}" fill="${tone}"/>` +
      grain +
      knot +
      // the gap between planks, and the lit edge of the next
      `<rect x="${x + plank - 2}" y="0" width="2" height="${h}" fill="#24140A"/>` +
      `<rect x="${x}" y="0" width="1" height="${h}" fill="#C08A5A" fill-opacity="0.35"/>` +
      nails
    );
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${radial("nail", ["#E8D0A0", "#8A6A3A", "#3A2A14"], undefined, 0.35, 0.3, 0.7)}
${radial("shade", ["#000000", "#000000"], [0, 0.6], 0.5, 0.4, 0.8)}
${radial("light", ["#FFD58A", "#FFD58A"], [0.16, 0], 0.5, 0.15, 0.6)}
</defs>
${planks}
<rect width="${w}" height="${h}" fill="url(#light)"/>
<rect width="${w}" height="${h}" fill="url(#shade)"/>
</svg>`;
}

/** The hall's header, w × h: a riveted iron plate with a gold trim along
 *  its foot, gold rails running in from both sides to a sign in the
 *  middle: crimson enamel in a gilded frame, scrolls off its ends, and a
 *  row of lamps beneath. Returns the art and where the sign's face is,
 *  for the title to sit on. */
export function hallHeader(w: number, h: number) {
  const sw = Math.min(250, w - 120);
  const sh = 50;
  const sx = (w - sw) / 2;
  const sy = 12;
  const cy = sy + sh / 2;
  const rivets = Array.from({ length: Math.floor(w / 26) }, (_, i) => {
    const x = 13 + i * 26;
    return `<circle cx="${x}" cy="${h - 13}" r="2.3" fill="url(#rivet)" stroke="#0E1014" stroke-width="0.7"/>`;
  }).join("");
  const rail = (x0: number, x1: number, y: number) =>
    `<rect x="${f(x0)}" y="${f(y - 3)}" width="${f(x1 - x0)}" height="6" fill="url(#railg)" stroke="${INK}" stroke-width="0.9"/>` +
    [0.3, 0.7]
      .map((k) => {
        const x = x0 + (x1 - x0) * k;
        return `<rect x="${f(x - 3)}" y="${f(y - 5)}" width="6" height="10" rx="1.5" fill="url(#gold)" stroke="${INK}" stroke-width="0.9"/>`;
      })
      .join("");
  const lamps = [-2, -1, 0, 1, 2]
    .map((k) => {
      const x = w / 2 + k * 22;
      const y = sy + sh + 10;
      return (
        `<circle cx="${f(x)}" cy="${y}" r="5.4" fill="url(#gold)" stroke="${INK}" stroke-width="0.9"/>` +
        `<circle cx="${f(x)}" cy="${y}" r="3.8" fill="url(#lamp)" stroke="#5A1A04" stroke-width="0.6"/>` +
        `<circle cx="${f(x - 1.2)}" cy="${y - 1.3}" r="1" fill="#fff" fill-opacity="0.9"/>`
      );
    })
    .join("");
  const scroll = toSvgBody(
    [
      ...acanthus(4, sh / 2 - 2, Math.PI + 0.25, 46, 3.8, 11, true),
    ].map((p) => ({ d: p.outline, m: "gold" as const, vein: p.vein, ink: 0.9, vw: 0.5 })),
    undefined,
    "hs",
  );
  const face = rrect(sx + 5, sy + 5, sw - 10, sh - 10, 9);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${linear("plate", ["#4A505A", "#2E323A", "#1E2128"])}
${linear("gold", GOLD, false)}
${linear("railg", ["#FFF2B8", "#E2B04A", "#9A6B1E"])}
${linear("enamel", ["#C2303E", "#8A1424", "#5A0812"])}
${radial("rivet", ["#C9D0DA", "#5A606A", "#1E2128"], undefined, 0.35, 0.3, 0.7)}
${radial("lamp", ["#FFF6C8", "#FFB23A", "#C0540A"], undefined, 0.4, 0.35, 0.7)}
</defs>
<rect width="${w}" height="${h - 6}" fill="url(#plate)"/>
<path d="M0 ${f(h * 0.42)}H${w}" stroke="#14161A" stroke-width="1.2"/>
<path d="M0 ${f(h * 0.42 + 1.2)}H${w}" stroke="#6A707A" stroke-opacity="0.5" stroke-width="0.8"/>
${rivets}
${moulding(-HALL_RADIUS, h - 8, w + 2 * HALL_RADIUS, 8, 2, 4, "trim")}
${rail(46, sx - 30, cy)}
${rail(sx + sw + 30, w, cy)}
<g transform="translate(${f(sx)} ${sy})">${scroll}</g>
<g transform="translate(${f(sx + sw)} ${sy}) scale(-1 1)">${scroll}</g>
<path d="${rrect(sx, sy + 3, sw, sh, 13)}" fill="#000" fill-opacity="0.45"/>
${moulding(sx, sy, sw, sh, 13, 5, "sign")}
<path d="${face}" fill="url(#enamel)"/>
<path d="${face}" fill="none" stroke="#3A0408" stroke-width="0.9"/>
<path d="M${f(sx + 14)} ${sy + 9}H${f(sx + sw * 0.5)}" stroke="#fff" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>
${lamps}
</svg>`;
  return { svg, sign: { x: sx + 5, y: sy + 5, w: sw - 10, h: sh - 10 } };
}

/** The gilded frame round the hall (w × h), drawn over everything:
 *  a moulding `HALL_RIM` thick with a corner piece at each corner. */
export function hallFrame(w: number, h: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${moulding(0, 0, w, h, HALL_RADIUS, HALL_RIM, "frame")}
${corners(w, h, -3, 0.82, "c")}
</svg>`;
}

/** The showcase: a gilded case lined in crimson velvet, `slots` pedestals
 *  in a row along its floor, each lit from above. Returns the case (drawn
 *  under the badges) and its glass (drawn over them). `pedestal` says
 *  where each pedestal's top sits, for the badges to stand on. */
export function showcaseCase(w: number, h: number, slots = 4) {
  const t = 7;
  const r = 20;
  const floor = h - 30;
  const slot = (w - 2 * t - 16) / slots;
  const centres = Array.from({ length: slots }, (_, i) => f(t + 8 + slot * (i + 0.5)));
  const pw = Math.min(slot * 0.62, 56);
  const pedestal = (cx: number) => {
    const top = floor - 16;
    return (
      // the plinth: a stepped gold drum, its top an ellipse
      `<path d="M${f(cx - pw / 2)} ${f(top)}L${f(cx - pw / 2 + 4)} ${floor}H${f(cx + pw / 2 - 4)}L${f(cx + pw / 2)} ${f(top)}Z" fill="url(#gp)" stroke="${INK}" stroke-width="1"/>` +
      `<path d="M${f(cx - pw / 2 + 5)} ${f(top + 7)}H${f(cx + pw / 2 - 5)}" stroke="${VEIN}" stroke-width="0.8"/>` +
      `<ellipse cx="${cx}" cy="${f(top)}" rx="${f(pw / 2)}" ry="5" fill="url(#gt)" stroke="${INK}" stroke-width="1"/>` +
      // a cone of light on it, from above
      `<path d="M${f(cx - 10)} ${t + 2}L${f(cx - pw / 2 - 6)} ${f(top)}H${f(cx + pw / 2 + 6)}L${f(cx + 10)} ${t + 2}Z" fill="url(#beam)"/>`
    );
  };
  const caseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${radial("lining", ["#6A1430", "#3A0818", "#1E040C"], undefined, 0.5, 0.35, 0.8)}
${linear("gp", ["#F0CC72", "#C8902E", "#7A5212"], false)}
${linear("gt", ["#FFF2B8", "#E2B04A"])}
${linear("beam", ["#FFE7B0", "#FFE7B0"], true, [0.16, 0])}
${linear("floor", ["#2A0610", "#14030A"])}
</defs>
<path d="${rrect(0, 3, w, h, r)}" fill="#000" fill-opacity="0.4"/>
<path d="${rrect(t, t, w - 2 * t, h - 2 * t, r - t)}" fill="url(#lining)"/>
<path d="M${t} ${floor}H${w - t}V${h - t - 6}Q${w - t} ${h - t} ${w - t - 6} ${h - t}H${t + 6}Q${t} ${h - t} ${t} ${h - t - 6}Z" fill="url(#floor)"/>
<path d="M${t} ${floor}H${w - t}" stroke="${VEIN}" stroke-width="1"/>
${centres.map(pedestal).join("")}
${moulding(0, 0, w, h, r, t, "case")}
</svg>`;
  const glass = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${linear("pane", ["#FFFFFF", "#FFFFFF"], false, [0.12, 0])}</defs>
<path d="M${t + 10} ${t}L${f(t + 10 + h * 0.5)} ${t}L${t + 10} ${f(t + h * 0.55)}Z" fill="url(#pane)"/>
<path d="M${f(w * 0.55)} ${t}L${f(w * 0.55 + 18)} ${t}L${f(w * 0.55 - h * 0.5 + 18)} ${h - t}L${f(w * 0.55 - h * 0.5)} ${h - t}Z" fill="#FFFFFF" fill-opacity="0.05"/>
</svg>`;
  return { caseSvg, glass, centres, standAt: floor - 16 };
}

/** A game's badge board, w × h: dark planks in a riveted iron frame with
 *  gold brackets on its corners (the cards hang inside, the game's name
 *  on a plate over the top edge). */
export function boardArt(w: number, h: number) {
  const t = 8;
  const r = 14;
  const iron = ["#8A909A", "#4A505A", "#24282E", "#6A707A"];
  const outer = rrect(0, 0, w, h, r);
  const inner = rrect(t, t, w - 2 * t, h - 2 * t, r - t);
  const planks = Array.from({ length: Math.ceil(w / 38) }, (_, i) => {
    const x = t + i * 38;
    return `<rect x="${x}" y="${t}" width="38" height="${h - 2 * t}" fill="${i % 2 ? "#3A2414" : "#432A17"}"/><rect x="${x + 36.5}" y="${t}" width="1.5" height="${h - 2 * t}" fill="#1A0E06"/>`;
  }).join("");
  const rivetsAlong = (x0: number, y0: number, x1: number, y1: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const k = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * k;
      const y = y0 + (y1 - y0) * k;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="1.9" fill="url(#bv)" stroke="#0E1014" stroke-width="0.6"/>`;
    }).join("");
  const nx = Math.max(2, Math.round(w / 34));
  const ny = Math.max(2, Math.round(h / 34));
  // a gold L-bracket on each corner, with a stud
  const bracket = `<path d="M2 2H28L22 8H8V22L2 28Z" fill="url(#bg)" stroke="${INK}" stroke-width="1"/><circle cx="6.5" cy="6.5" r="2.6" fill="url(#bv2)" stroke="${INK}" stroke-width="0.7"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${linear("bi", iron, false)}
${linear("bg", GOLD, false)}
${radial("bv", ["#C9D0DA", "#5A606A", "#1E2128"], undefined, 0.35, 0.3, 0.7)}
${radial("bv2", ["#FFF6D0", "#E2B04A", "#7A5212"], undefined, 0.35, 0.3, 0.7)}
${radial("bsh", ["#000000", "#000000"], [0, 0.5], 0.5, 0.45, 0.75)}
<clipPath id="bc"><path d="${inner}"/></clipPath>
</defs>
<path d="${outer}" fill="#000" fill-opacity="0.45" transform="translate(0 4)"/>
<g clip-path="url(#bc)">${planks}<rect x="0" y="0" width="${w}" height="${h}" fill="url(#bsh)"/></g>
<path d="${outer}${inner}" fill-rule="evenodd" fill="url(#bi)"/>
<path d="${rrect(t / 2, t / 2, w - t, h - t, r - t / 2)}" fill="none" stroke="#24282E" stroke-width="0.8"/>
<path d="M${r} 1.6H${f(w * 0.45)}" stroke="#fff" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/>
<path d="${outer}" fill="none" stroke="#0E1014" stroke-width="1.3"/>
<path d="${inner}" fill="none" stroke="#0E1014" stroke-width="1"/>
${rivetsAlong(30, t / 2, w - 30, t / 2, nx)}
${rivetsAlong(30, h - t / 2, w - 30, h - t / 2, nx)}
${rivetsAlong(t / 2, 30, t / 2, h - 30, ny)}
${rivetsAlong(w - t / 2, 30, w - t / 2, h - 30, ny)}
${bracket}
<g transform="translate(${w} 0) scale(-1 1)">${bracket}</g>
<g transform="translate(0 ${h}) scale(1 -1)">${bracket}</g>
<g transform="translate(${w} ${h}) scale(-1 -1)">${bracket}</g>
</svg>`;
}

/** The badge popup's card, w × h: dark planks in a gilded moulding with a
 *  corner piece at each corner. */
export function popupArt(w: number, h: number) {
  const t = 6;
  const r = 18;
  const inner = rrect(t, t, w - 2 * t, h - 2 * t, r - t);
  const planks = Array.from({ length: Math.ceil(w / 40) }, (_, i) =>
    `<rect x="${i * 40}" y="0" width="40" height="${h}" fill="${i % 2 ? "#3E2716" : "#47301B"}"/><rect x="${i * 40 + 38.5}" y="0" width="1.5" height="${h}" fill="#1E1208"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${radial("pl", ["#FFD58A", "#FFD58A"], [0.14, 0], 0.5, 0.25, 0.7)}
${radial("pv", ["#000000", "#000000"], [0, 0.55], 0.5, 0.45, 0.8)}
<clipPath id="pc"><path d="${inner}"/></clipPath>
</defs>
<g clip-path="url(#pc)">${planks}<rect width="${w}" height="${h}" fill="url(#pl)"/><rect width="${w}" height="${h}" fill="url(#pv)"/></g>
${moulding(0, 0, w, h, r, t, "pm")}
${corners(w, h, -2, 0.55, "pk")}
</svg>`;
}

/** Rays of light fanning round a point, for behind a badge (size square,
 *  centred). */
export function raysArt(size: number, color: string) {
  const c = size / 2;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const da = 0.09;
    const p = (ang: number) => `${f(c + Math.cos(ang) * c)} ${f(c + Math.sin(ang) * c)}`;
    return `M${c} ${c}L${p(a - da)}L${p(a + da)}Z`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs>${radial("rg", [color, color], [0.55, 0], 0.5, 0.5, 0.5)}</defs>
<path d="${rays}" fill="url(#rg)"/>
<circle cx="${c}" cy="${c}" r="${f(c * 0.42)}" fill="url(#rg)" fill-opacity="0.5"/>
</svg>`;
}

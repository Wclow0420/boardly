// Hustle's box lid, as engraved SVG (baked once by BoxArt.tsx): the den
// behind the night market. Under the den's glazed roof with its swept-up
// eaves, gilt tile ends and the crimson beam with its key-fret and jade
// boss, between two lacquered pillars, a round moon window glows jade
// with the night: the full moon over a pagoda. Red silk lanterns
// hang either side. The Boss (cigar, gold chain) and the Enforcer (jade
// bandana, knuckle-duster raised) face off across the green baize: his
// two cards face down, the Enforcer's claim face up, the pot of cash
// coins between them and a pair of mahjong tiles stood at the rail.
//
// Drawn in a 190 × 208 box, the size of the other games' lids (the box
// shows its foot under the game's name, so what matters sits above ~150).

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { linear, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, curl } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { CARD_H, CARD_W, cardBack, cardFront, type BackStyle, type FrontStyle } from "@/components/tabletop/cards/cardArt";
import { lanternArt, LANTERN_W } from "./den/denArt";
import { ROLE_EMBLEMS } from "./emblems";

export const LID_W = 190;
/** How far the roof and beam sit down from the top (the lid's top edge
 *  crops the art a little). */
const TOP = 8;
/** The underside of the beam, where the wall, pillars and lanterns hang. */
const BEAM = 42 + TOP;
export const LID_H = 208;

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;
const LAC_INK = "#3A0408";

const LACQUER = ["#E04A52", "#A8182A", "#5A0810"];
const ROOF = ["#4E5E58", "#2A3532", "#121816"];
const SCREEN = ["#3A2216", "#24140C", "#160A06"];
const JADE = ["#9AF0C0", "#2E9A62", "#0C4A2A"];

/** The cards' looks, as in cards.tsx (HUSTLE_BACK, ROLE_FRONT): kept
 *  here so the lid renders without React Native. */
const BACK: BackStyle = {
  colors: ["#C8303F", "#7A0E1E", "#3A040C"],
  pattern: "lattice",
  jewel: ["#C8FFE0", "#1E9A5A", "#08361C"],
};
const ENFORCER_FRONT: FrontStyle = { window: ["#7AE8B0", "#1E8A54", "#06301A"], plaque: ["#4A5468", "#262C3C", "#10141E"] };

/** A filled, inked shape with an optional engraved vein and shine. */
function part(
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
      ? `<path d="${extra.vein}" fill="none" stroke="${extra.veinColor ?? VEIN}" stroke-width="${extra.vw ?? 0.7}" stroke-linecap="round"/>`
      : "",
    extra.shine
      ? `<path d="${extra.shine}" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="${extra.sw ?? 0.9}" stroke-linecap="round"/>`
      : "",
    inkW > 0 ? `<path d="${d}" fill="none"${rule} stroke="${ink}" stroke-width="${inkW}" stroke-linejoin="round"/>` : "",
  ].join("");
}

const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
/** An oval as a path (a gradient on an <ellipse> comes out black in
 *  Skia's SVG reader). */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/** Another drawing's markup without its <svg> wrapper, its ids kept
 *  apart by `p`. */
const inner = (svg: string, p: string) =>
  svg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/id="([^"]+)"/g, `id="${p}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`);

// ------------------------------------------------------------- the roof

/** The roof's outline: the ridge across the top, the glazed slope
 *  sweeping down to the eave and up again at both corners. */
const ROOF_D =
  "M36 10H154Q170 13 188 13Q185 21 170 28.6Q162 31 150 31H40Q28 31 20 28.6Q5 21 2 13Q20 13 36 10Z";

function roof() {
  // barrel tiles fanning from the ridge to the eave
  const barrels: string[] = [];
  const grooves: string[] = [];
  for (let x = -6; x <= 196; x += 8) {
    const top = 95 + (x - 95) * 0.72;
    barrels.push(`M${f(top)} 9L${f(x)} 32`);
    grooves.push(`M${f(top + 4)} 9L${f(x + 4)} 32`);
  }
  const courses = [15, 20, 25].map((y) => `M0 ${y}H190`).join("");
  // the gilt tile ends along the eave, a ring cut in each
  const ends: string[] = [];
  for (let x = 28; x <= 162; x += 7.4) {
    ends.push(
      `<circle cx="${x}" cy="31" r="3.1" fill="url(#cgd)" stroke="${INK}" stroke-width="0.65"/><circle cx="${x}" cy="31" r="1.5" fill="none" stroke="${VEIN}" stroke-width="0.5"/><circle cx="${f(x - 1.1)}" cy="29.9" r="0.75" fill="#FFFFFF" fill-opacity="0.8"/>`,
    );
  }
  // and up each swept corner
  [
    [21, 28.4],
    [13.4, 24.4],
    [7.4, 19.4],
    [169, 28.4],
    [176.6, 24.4],
    [182.6, 19.4],
  ].forEach(([x, y]) =>
    ends.push(`<circle cx="${x}" cy="${y}" r="3" fill="url(#cgd)" stroke="${INK}" stroke-width="0.6"/><circle cx="${f(x - 0.9)}" cy="${f(y - 0.9)}" r="0.6" fill="#FFFFFF" fill-opacity="0.8"/>`),
  );
  // the ridge, gold scrolls curling up off its ends, a jade pearl
  const scroll = (x: number, side: number) => {
    const c = curl(x, 8, side > 0 ? -0.35 : Math.PI + 0.35, 14, side * -4.2, 3.6, 0.7);
    return part(c.outline, "url(#cgold)", INK, 0.8, { vein: c.vein, vw: 0.45 });
  };
  return `<path d="${ROOF_D}" fill="#000" fill-opacity="0.45" transform="translate(1.5 3)"/>
<path d="${ROOF_D}" fill="url(#croof)"/>
<clipPath id="croofc"><path d="${ROOF_D}"/></clipPath>
<g clip-path="url(#croofc)">
<path d="${barrels.join("")}" stroke="#070A09" stroke-opacity="0.7" stroke-width="2.4"/>
<path d="${grooves.join("")}" stroke="#9AB8AC" stroke-opacity="0.32" stroke-width="1.6"/>
<path d="${courses}" stroke="#070A09" stroke-opacity="0.45" stroke-width="0.7"/>
</g>
<path d="${ROOF_D}" fill="none" stroke="#070A09" stroke-width="1.1"/>
<path d="M5 14.4Q20 14.4 36 11.4" stroke="#C8E0D8" stroke-opacity="0.55" stroke-width="0.8" fill="none" stroke-linecap="round"/>
${scroll(34, -1)}${scroll(156, 1)}
${part(rrect(32, 5, 126, 6, 2.4), "url(#croof)", "#070A09", 1, { shine: "M36 6.4H96" })}
<path d="M33 8.6H157" stroke="url(#cgoldH)" stroke-width="1.1"/>
${part(circle(95, 4.4, 3.4), "url(#cjade)", "#06200F", 0.8)}
<path d="${oval(95, 8.4, 6, 1.6)}" fill="url(#cgold)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="93.9" cy="3.3" r="0.9" fill="#FFFFFF" fill-opacity="0.9"/>
${ends.join("")}`;
}

/** The key-fret (回纹) along the beam. */
function fret(x0: number, x1: number, y: number) {
  const d: string[] = [];
  for (let x = x0; x + 7 <= x1; x += 9) d.push(`M${x} ${y + 2.2}V${y - 2.2}H${x + 6}V${y + 1.1}H${x + 2.2}V${y - 0.7}`);
  return `<path d="${d.join("")}" fill="none" stroke="url(#cgoldH)" stroke-width="0.9" stroke-linejoin="round"/>`;
}

/** The crimson beam under the eave, the jade boss at its middle. */
function beam() {
  return `<path d="M12 35H178V44H12Z" fill="#000" fill-opacity="0.45"/>
${part("M12 32H178V42H12Z", "url(#clac)", LAC_INK, 0.9, { shine: "M14 33.6H120" })}
${fret(16, 84, 37)}${fret(106, 176, 37)}
<path d="M12 42H178" stroke="url(#cgoldH)" stroke-width="1.6"/>
${part(circle(95, 37, 6.2), "url(#cgd)", INK, 0.9)}
${part(circle(95, 37, 3.8), "url(#cjade)", "#06200F", 0.7)}
<circle cx="93.7" cy="35.7" r="1.05" fill="#FFFFFF" fill-opacity="0.9"/>`;
}

/** A lacquered pillar from the beam to the floor, gilt at its head and
 *  a bracket scroll under the beam toward the middle. */
function pillar(x: number, side: number) {
  const w = 10;
  const c = curl(x + (side > 0 ? w : 0), BEAM + 4, side > 0 ? -0.2 : Math.PI + 0.2, 13, side * -3.8, 3.2, 0.7);
  return `${part(`M${x} ${BEAM}H${x + w}V196H${x}Z`, "url(#clacH)", LAC_INK, 1, { shine: `M${x + 2.2} ${BEAM + 8}V190`, sw: 1 })}
${part(rrect(x - 1.5, BEAM, w + 3, 5, 1), "url(#cgold)", INK, 0.8, { shine: `M${x} ${BEAM + 1.2}H${x + 6}` })}
${part(c.outline, "url(#cgold)", INK, 0.7, { vein: c.vein, vw: 0.4 })}`;
}

// ------------------------------------------------------------- the wall

/** The lattice screen between the pillars and the moon window in it:
 *  a crimson ring and a gilt rim round night glass lit jade, the full
 *  moon over a pagoda and the market's rooftops. */
const MOON = { x: 95, y: 96, r: 44 };

function wall() {
  const lattice: string[] = [];
  for (let x = 28; x < 162; x += 16) {
    for (let y = BEAM + 4; y < 146; y += 16) lattice.push(`M${x} ${y}h12v12h-12ZM${x + 3.5} ${y + 3.5}h5v5h-5Z`);
  }
  const { x, y, r } = MOON;
  // the night outside: a pagoda's tiered roofs and the market's
  // rooftops dark against it, a few windows still lit
  const tier = (cx: number, y0: number, w: number) =>
    `M${f(cx - w - 4)} ${f(y0 - 1.6)}Q${f(cx - w)} ${f(y0 + 1)} ${f(cx - w + 3)} ${f(y0 + 1.4)}H${f(cx + w - 3)}Q${f(cx + w)} ${f(y0 + 1)} ${f(cx + w + 4)} ${f(y0 - 1.6)}Q${f(cx + w * 0.4)} ${f(y0 - 3)} ${f(cx)} ${f(y0 - 7)}Q${f(cx - w * 0.4)} ${f(y0 - 3)} ${f(cx - w - 4)} ${f(y0 - 1.6)}Z` +
    `M${f(cx - w + 4)} ${f(y0 + 1.4)}H${f(cx + w - 4)}V${f(y0 + 9)}H${f(cx - w + 4)}Z`;
  const px = x + 3;
  const pagoda =
    tier(px, y - 14, 6) +
    tier(px, y - 4, 8.4) +
    tier(px, y + 6, 10.8) +
    tier(px, y + 16, 13) +
    `M${f(px - 0.6)} ${f(y - 28)}H${f(px + 0.6)}V${f(y - 20)}H${f(px - 0.6)}Z` +
    `M${f(px - 12)} ${f(y + 24)}H${f(px + 12)}V${f(y + r)}H${f(px - 12)}Z`;
  const roofs =
    `M${x - r} ${y + 18}L${x - 34} ${y + 12}L${x - 20} ${y + 16}V${y + r}H${x - r}Z` +
    `M${x + 6} ${y + 22}L${x + 18} ${y + 14}L${x + 32} ${y + 20}L${x + 40} ${y + 10}L${x + r} ${y + 14}V${y + r}H${x + 6}Z`;
  const windows = [
    [px - 1.4, y - 10],
    [px + 2.2, y],
    [px - 3, y + 10],
    [x - 30, y + 20],
    [x + 26, y + 24],
    [x + 36, y + 18],
  ]
    .map(([a, b]) => `M${f(a)} ${f(b)}h1.8v2.4h-1.8Z`)
    .join("");
  return `<path d="M27 ${BEAM}H163V150H27Z" fill="url(#cscreen)"/>
<path d="${lattice.join("")}" fill="none" stroke="#C89A4A" stroke-opacity="0.16" stroke-width="1"/>
<path d="M27 ${BEAM}H163V150H27Z" fill="url(#cshade)"/>
<path d="${circle(x + 1.5, y + 3, r + 6)}" fill="#000" fill-opacity="0.45"/>
${part(circle(x, y, r + 6), "url(#clac)", LAC_INK, 1)}
${part(circle(x, y, r + 1.6), "url(#cgold)", INK, 1, { shine: `M${f(x - r * 0.86)} ${f(y - r * 0.4)}A${r} ${r} 0 0 1 ${f(x - r * 0.3)} ${f(y - r * 0.93)}` })}
<clipPath id="cglass"><path d="${circle(x, y, r - 1)}"/></clipPath>
<path d="${circle(x, y, r - 1)}" fill="url(#cnight)"/>
<g clip-path="url(#cglass)">
<path d="${circle(x - 4, y - 31, 19)}" fill="url(#cmoonGlow)"/>
<path d="${circle(x - 4, y - 31, 10)}" fill="url(#cmoon)"/>
<path d="${circle(x - 7.4, y - 33.6, 2)}${circle(x - 1, y - 28.4, 1.5)}" fill="#C8B070" fill-opacity="0.35"/>
<path d="${roofs}" fill="#0A1E16" fill-opacity="0.85"/>
<path d="${pagoda}" fill="#06140E"/>
<path d="${windows}" fill="#FFC870" fill-opacity="0.85"/>
<path d="${circle(x, y, r - 1)}" fill="url(#cvig)"/>
</g>
<path d="${circle(x, y, r - 1)}" fill="none" stroke="${INK}" stroke-width="1"/>
<path d="${circle(x, y, r + 3.8)}" fill="none" stroke="${VEIN}" stroke-width="0.5"/>`;
}

/** A red silk lantern hung from the beam at x, its glow behind it. */
function lantern(x: number, y: number, s: number, id: string) {
  return `<path d="${circle(x, y + 34 * s, 26 * s + 8)}" fill="url(#cglow)"/>
<g transform="translate(${f(x - (LANTERN_W / 2) * s)} ${y}) scale(${s})">${inner(lanternArt(), id)}</g>`;
}

// ------------------------------------------------------------- the players

/** A role's portrait (its 48-box emblem) at (x, y), `s` times its size,
 *  leaning `lean` degrees about the foot of the bust, a shadow cast on
 *  the screen behind it. */
function figure(data: EmblemData, x: number, y: number, s: number, lean: number, id: string) {
  const at = (d: number) => `translate(${f(x + d)} ${f(y + d)}) scale(${s}) rotate(${lean} 24 44)`;
  const shadow = data.flatMap((p) => ("d" in p ? [{ d: p.d, m: "#000000" as const, ink: 0, t: p.t }] : []));
  return `<g transform="${at(3)}" opacity="0.45">${toSvgBody(shadow, undefined, `${id}s`)}</g>
<g transform="${at(0)}">${toSvgBody(data, undefined, id)}</g>`;
}

// ------------------------------------------------------------- the table

/** The gaming table: a crimson rail round green baize seen a little from
 *  above, a gilt bead between, the lamp's pool on the cloth; a lacquered
 *  apron with a gold fret and curved legs on gold feet. */
function table() {
  const rail = "M26 112H164L188 146H2Z";
  const felt = "M31 115.6H159L178.6 141.6H11.4Z";
  const leg = (x: number, side: number) => {
    const d = `M${x - 6} 158H${x + 6}Q${x + 5} 176 ${x + 1 + side * 4} 192H${x - 3 + side * 4}Q${x - 3} 176 ${x - 6} 158Z`;
    return `${part(d, "url(#clacH)", LAC_INK, 1, { shine: `M${x - 3.4} 162Q${x - 2.6} 176 ${x - 0.6 + side * 3} 188`, sw: 0.8 })}
${part(rrect(x - 5 + side * 4, 190, 10, 5, 1.6), "url(#cgold)", INK, 0.8)}`;
  };
  return `<path d="${oval(95, 199, 90, 5)}" fill="url(#cfloor)"/>
${leg(20, -1)}${leg(170, 1)}
${part(rrect(6, 145, 178, 15, 2), "url(#clac)", LAC_INK, 1.1)}
${fret(12, 178, 152.6)}
<path d="M8 158.4H182" stroke="url(#cgoldH)" stroke-width="1.2"/>
${part(rail, "url(#clacH)", LAC_INK, 1.2)}
<path d="M29 113.4H161" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>
${part("M29.4 114H160.6L181 143.4H9Z", "url(#cgold)", INK, 0.8)}
${part(felt, "url(#cbaize)", "#06200F", 0.8)}
<path d="${felt}" fill="url(#cpool)"/>
<path d="M36 119H154L168 137.6H22Z" fill="none" stroke="#E8C25A" stroke-opacity="0.5" stroke-width="0.7"/>
${part(rrect(1, 143.6, 188, 4.2, 1.4), "url(#cgold)", INK, 0.9, { shine: "M6 144.6H120" })}
<path d="M6 148.8H184" stroke="#000" stroke-opacity="0.4" stroke-width="1.6"/>`;
}

/** A card lying on the baize: its art squashed by the angle we see the
 *  table at, turned `rot` degrees about its middle. */
function lyingCard(svg: string, cx: number, cy: number, w: number, rot: number, id: string) {
  const s = w / CARD_W;
  return `<g transform="translate(${f(cx)} ${f(cy)}) scale(1 0.5) rotate(${rot}) translate(${f((-CARD_W / 2) * s)} ${f((-CARD_H / 2) * s)}) scale(${f(s)})">${inner(svg, id)}</g>`;
}

/** The Enforcer's card, face up: its frame and his portrait in the
 *  window (as faceSvg in cards.tsx draws it). */
function enforcerCard() {
  const size = 50;
  const portrait = `<g transform="translate(25 ${f(60 - (44 * size) / 48)}) scale(${f(size / 48)})">${toSvgBody(ROLE_EMBLEMS.assassin, undefined, "cef")}</g>`;
  return cardFront(ENFORCER_FRONT).replace(/<\/svg>\s*$/, `${portrait}</svg>`);
}

/** A stack of `n` cash coins lying on the cloth, the top one showing its
 *  square hole. */
function coins(cx: number, cy: number, n: number, rx = 6.4) {
  const ry = rx * 0.42;
  const out: string[] = [`<path d="${oval(cx + 1.2, cy + 1.6, rx + 0.6, ry + 0.6)}" fill="#000" fill-opacity="0.4"/>`];
  for (let i = 0; i < n; i++) {
    const y = cy - i * 1.9;
    out.push(`<path d="M${f(cx - rx)} ${f(y)}V${f(y + 1.9)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(y + 1.9)}V${f(y)}Z" fill="url(#cgoldEdge)" stroke="${INK}" stroke-width="0.55"/>`);
    out.push(`<path d="${oval(cx, y, rx, ry)}" fill="url(#cgold)" stroke="${INK}" stroke-width="0.6"/>`);
  }
  const top = cy - (n - 1) * 1.9;
  out.push(
    `<path d="${oval(cx, top, rx * 0.66, ry * 0.66)}" fill="none" stroke="${VEIN}" stroke-width="0.45"/>`,
    `<path d="M${f(cx - 1.8)} ${f(top)}L${f(cx)} ${f(top - 0.9)}L${f(cx + 1.8)} ${f(top)}L${f(cx)} ${f(top + 0.9)}Z" fill="#2A1404"/>`,
    `<path d="M${f(cx - rx * 0.7)} ${f(top - ry * 0.5)}Q${f(cx - rx * 0.2)} ${f(top - ry * 0.95)} ${f(cx + rx * 0.2)} ${f(top - ry * 0.9)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="0.6" stroke-linecap="round"/>`,
  );
  return out.join("");
}

/** A mahjong tile stood on the cloth: its jade back, the ivory face, and
 *  a red 中 on it (or green bamboo). */
function tile(x: number, y: number, kind: "zhong" | "bamboo") {
  const w = 10;
  const h = 13;
  const mark =
    kind === "zhong"
      ? `<path d="M${x + 2.6} ${y + 4.4}H${x + 7.4}V${y + 8.2}H${x + 2.6}Z" fill="none" stroke="#C2203A" stroke-width="0.9"/><path d="M${x + 5} ${y + 2.6}V${y + 10.6}" stroke="#C2203A" stroke-width="1.1" stroke-linecap="round"/>`
      : `<path d="M${x + 3.4} ${y + 2.8}V${y + 10.4}M${x + 6.6} ${y + 2.8}V${y + 10.4}" stroke="#1E8A54" stroke-width="1.5" stroke-linecap="round"/><path d="M${x + 2.4} ${y + 6.6}H${x + 4.4}M${x + 5.6} ${y + 6.6}H${x + 7.6}" stroke="#0C4A2A" stroke-width="0.6"/>`;
  return `<path d="${rrect(x + 1.2, y + 2.4, w, h, 1.8)}" fill="#000" fill-opacity="0.4"/>
${part(rrect(x + 1.4, y + 1.2, w, h, 1.8), "url(#cjadeT)", "#06200F", 0.7)}
${part(rrect(x, y, w, h - 1, 1.8), "url(#civory)", INK, 0.8, { shine: `M${x + 1.6} ${y + 1.2}H${x + 6}`, sw: 0.6 })}
${mark}`;
}

/** What lies on the baize. */
function onTheFelt() {
  const back = cardBack(BACK);
  return `${lyingCard(back, 46, 125, 24, -24, "cb1")}
${lyingCard(back, 60, 129, 24, -6, "cb2")}
${lyingCard(enforcerCard(), 136, 127, 25, 14, "cf1")}
${coins(86, 130, 5)}${coins(101, 132, 3)}${coins(94, 122.6, 4, 5.6)}
${coins(110, 124, 1, 5.2)}
${tile(150, 116.4, "zhong")}${tile(161.6, 117.4, "bamboo")}`;
}

/** The whole lid, LID_W × LID_H, `w` wide. */
export function lidArt(w = LID_W) {
  const h = (w * LID_H) / LID_W;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${LID_W} ${LID_H}">
<defs>
${linear("cgold", MATERIALS.gold, false)}
${linear("cgoldH", MATERIALS.gold, false)}
${linear("cgoldEdge", ["#C8902E", "#8A5A16", "#5A3A0A"])}
${radial("cgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("cjade", JADE, undefined, 0.38, 0.32, 0.75)}
${linear("cjadeT", ["#5ABA88", "#1E6A44", "#0C3A22"])}
${linear("civory", MATERIALS.ivory)}
${linear("croof", ROOF)}
${linear("clac", LACQUER)}
${linear("clacH", LACQUER, false)}
${linear("cscreen", SCREEN)}
${radial("cshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.1, 1)}
${radial("cnight", ["#3AA878", "#14583C", "#082418"], undefined, 0.62, 0.36, 0.75)}
${radial("cmoon", ["#FFFBE6", "#F4E2A8", "#C8A85A"], undefined, 0.4, 0.35, 0.75)}
${radial("cmoonGlow", ["#FFF2C0", "#FFF2C0"], [0.55, 0])}
${radial("cvig", ["#000000", "#000000"], [0, 0.5], 0.5, 0.45, 0.6)}
${radial("cglow", ["#FF9A4A", "#E0402A", "#E0402A"], [0.5, 0.18, 0])}
${radial("cbaize", ["#3A9A68", "#1A6040", "#0C3420"], undefined, 0.5, 0.35, 0.7)}
${radial("cpool", ["#FFE7B0", "#FFE7B0"], [0.32, 0], 0.5, 0.45, 0.55)}
${radial("cfloor", ["#000000", "#000000"], [0.45, 0])}
</defs>
${wall()}
${pillar(19, 1)}${pillar(161, -1)}
${figure(ROLE_EMBLEMS.duke, 6, 48, 1.74, 3, "cbo")}
${figure(ROLE_EMBLEMS.assassin, 92, 48, 1.74, -3, "cen")}
<g transform="translate(0 ${TOP})">${beam()}${roof()}</g>
${lantern(10, TOP + 20, 0.48, "cl1")}${lantern(180, TOP + 20, 0.48, "cl2")}
${table()}
${onTheFelt()}
</svg>`;
}

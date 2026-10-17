// The dock's still art, as SVG markup (baked once into images by
// Dock.tsx): the leather satchel on the plinth's right end that holds the
// lookup tools, with a rolled map and a quill peeking out over its brass
// clasp; the small gold info stud at the end of the plinth's hint line.
// Drawn in the house style: gradients lit from the upper left, an ink
// outline, a white shine, stitching and grooves engraved in.

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import {
  INKS,
  JEWELS,
  MATERIALS,
  curl,
  type Jewel,
} from "@/components/engraved/shapes";

const f = (n: number) => +n.toFixed(2);

const stops = (colors: readonly string[]) =>
  colors
    .map(
      (c, i) =>
        `<stop offset="${f(i / (colors.length - 1))}" stop-color="${c}"/>`,
    )
    .join("");
const lin = (id: string, colors: readonly string[], x2 = 0.35, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(colors)}</linearGradient>`;
const rad = (id: string, colors: readonly string[]) =>
  `<radialGradient id="${id}" cx="0.36" cy="0.3" r="0.75">${stops(colors)}</radialGradient>`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

/** Saddle leather, lit from the upper left. */
const LEATHER = ["#C48A4E", "#8E5628", "#5A3214", "#9A6232"];
const FLAP = ["#D69A5A", "#A0662E", "#6A3C18"];
const LEATHER_INK = "#2A1606";
const GOLD_INK = INKS.gold.ink;

/** The satchel's box: 64 × 60. */
export const SATCHEL_BOX = [64, 60] as const;

/** A leather satchel, 64 × 60: a carrying strap over the top, a rolled
 *  map and a quill standing out of it behind the flap, the flap stitched
 *  round its curve and shut with a brass clasp set with one jewel. */
export function satchelArt(jewel: Jewel = "amber") {
  const [w, h] = SATCHEL_BOX;
  const strap = "M17 22C16 4 48 4 47 22L42.4 22C43 10.5 21 10.5 21.6 22Z";
  const map =
    "M9.6 25.4L15.2 9.2Q16 7 18.2 7.8L21.4 9Q23.4 9.8 22.7 12L18.4 26.8Z";
  const mapCurl =
    "M15.2 9.2Q16 7 18.2 7.8L21.4 9Q23.4 9.8 22.7 12Q20.4 12.4 18.6 11.6Q16 10.6 15.2 9.2Z";
  const quill =
    "M44.6 25.2Q47 15 55.4 3.4Q57.2 2.2 57.4 4.4Q55.6 15.4 47.6 26.4Z";
  const quillVein = "M46 25.8Q49.6 14 56.4 3.6";
  const body =
    "M6.4 22.4H57.6Q61.2 22.4 60.8 26.2L58 53.6Q57.6 57.8 53.4 57.8H10.6Q6.4 57.8 6 53.6L3.2 26.2Q2.8 22.4 6.4 22.4Z";
  const flap =
    "M5.4 21.6H58.6Q61.6 21.6 61 25.4L57.8 39.6Q32 49.4 6.2 39.6L3 25.4Q2.4 21.6 5.4 21.6Z";
  const stitch = "M8.6 37Q32 45.2 55.4 37";
  const buckle =
    "M26.2 38.6Q26.2 37 27.8 37H36.2Q37.8 37 37.8 38.6V47Q37.8 48.6 36.2 48.6H27.8Q26.2 48.6 26.2 47Z";
  const tongue =
    "M29.6 47.6V52.6Q29.6 53.8 30.8 53.8H33.2Q34.4 53.8 34.4 52.6V47.6Z";
  return svg(
    w,
    h,
    `<defs>${lin("lt", LEATHER)}${lin("fl", FLAP)}${lin("st", LEATHER, 1, 0.2)}${lin("au", MATERIALS.gold, 0.6)}${lin("iv", MATERIALS.ivory, 0.8, 0.6)}${rad("jw", JEWELS[jewel])}${lin("sh", ["#000000", "#000000"])}</defs>
<path d="${body}" fill="#000" fill-opacity="0.35" transform="translate(1.4 2.2)"/>
<path d="${strap}" fill="url(#st)" stroke="${LEATHER_INK}" stroke-width="1.1"/>
<path d="M19.4 20C19.6 8.4 44.4 8.4 44.6 20" fill="none" stroke="#F4E2C0" stroke-opacity="0.45" stroke-width="0.6" stroke-dasharray="1.6 1.4"/>
<path d="${map}" fill="url(#iv)" stroke="${GOLD_INK}" stroke-width="0.9"/>
<path d="${mapCurl}" fill="#D8CCB0" stroke="${GOLD_INK}" stroke-width="0.7"/>
<path d="M12.4 22L16.6 10.6" stroke="#A08A60" stroke-width="0.5"/>
<path d="M14.2 18.4L19.6 20.2M15.4 15.2L20.6 17" stroke="#B0302A" stroke-opacity="0.7" stroke-width="0.6"/>
<path d="${quill}" fill="url(#iv)" stroke="${GOLD_INK}" stroke-width="0.9"/>
<path d="${quillVein}" fill="none" stroke="#A08A60" stroke-width="0.55"/>
<path d="M47.4 17.6L50.6 18.8M49 13.6L52.4 14.6M50.8 9.6L54 10.4" stroke="#A08A60" stroke-width="0.45"/>
<circle cx="19.3" cy="22.4" r="2.4" fill="url(#au)" stroke="${GOLD_INK}" stroke-width="0.7"/>
<circle cx="44.7" cy="22.4" r="2.4" fill="url(#au)" stroke="${GOLD_INK}" stroke-width="0.7"/>
<path d="${body}" fill="url(#lt)" stroke="${LEATHER_INK}" stroke-width="1.3"/>
<path d="M13 44.4V56M51 44.4V56" stroke="${LEATHER_INK}" stroke-opacity="0.55" stroke-width="0.8"/>
<path d="M9.4 44.6L10.6 55.2M54.6 44.6L53.4 55.2" stroke="#F4E2C0" stroke-opacity="0.32" stroke-width="0.6" stroke-dasharray="1.6 1.4"/>
<path d="M9 56.2H55" stroke="#F4E2C0" stroke-opacity="0.18" stroke-width="0.7"/>
<path d="${flap}" fill="url(#fl)" stroke="${LEATHER_INK}" stroke-width="1.3"/>
<path d="${stitch}" fill="none" stroke="#F4E2C0" stroke-opacity="0.6" stroke-width="0.8" stroke-dasharray="1.8 1.5"/>
<path d="M7.4 25.2L9.6 36" stroke="#F4E2C0" stroke-opacity="0.35" stroke-width="0.7" stroke-dasharray="1.8 1.5"/>
<path d="M56.6 25.2L54.4 36" stroke="#F4E2C0" stroke-opacity="0.35" stroke-width="0.7" stroke-dasharray="1.8 1.5"/>
<path d="M7 23.6H31" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1" stroke-linecap="round"/>
<path d="${tongue}" fill="url(#st)" stroke="${LEATHER_INK}" stroke-width="0.9"/>
<path d="${buckle}" fill="url(#au)" stroke="${GOLD_INK}" stroke-width="1"/>
<path d="M28.4 39.4H35.6V46.2H28.4Z" fill="none" stroke="${INKS.gold.vein}" stroke-width="0.6"/>
<path d="M27.6 38.4H33" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>
<circle cx="32" cy="42.8" r="2.9" fill="url(#jw)" stroke="${GOLD_INK}" stroke-width="0.7"/>
<circle cx="31" cy="41.8" r="0.9" fill="#FFFFFF" fill-opacity="0.9"/>`,
  );
}

/** The info stud at the end of the hint line, 18 square: a gold ring,
 *  night enamel, an ivory "i". */
export function infoArt() {
  const s = 18;
  const c = s / 2;
  return svg(
    s,
    s,
    `<defs>${lin("au", MATERIALS.gold, 0.6)}${rad("en", ["#5A6EA8", "#1E2A50", "#0E1430"])}${lin("iv", MATERIALS.ivory)}</defs>
<circle cx="${c}" cy="${c}" r="8.2" fill="url(#au)" stroke="${GOLD_INK}" stroke-width="0.8"/>
<circle cx="${c}" cy="${c}" r="6" fill="url(#en)" stroke="${GOLD_INK}" stroke-width="0.6"/>
<circle cx="${c}" cy="5.6" r="1.25" fill="url(#iv)"/>
<path d="M7.7 7.9H10V12.6H11V13.4H7V12.6H8.1V8.7H7.7Z" fill="url(#iv)"/>
<path d="M4.6 6.4Q6 3.6 9 3.2" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>`,
  );
}

/** The finial at the hint cartouche's right end, 28 × 24 (mirrored for
 *  the left): a gold scroll curling up off the plinth's rim, and a
 *  smaller one curling down. Its root is at (1, 12). */
export function finialArt() {
  const up = curl(1, 12, 0, 21, -4.6, 5.2, 0.8);
  const down = curl(2, 12.6, 0.2, 13, 3.8, 3.2, 0.8);
  const parts: EmblemData = [down, up].map((p) => ({
    d: p.outline,
    m: "gold",
    vein: p.vein,
    ink: 0.8,
    vw: 0.45,
  }));
  return svg(28, 24, toSvgBody(parts, undefined, "fin"));
}

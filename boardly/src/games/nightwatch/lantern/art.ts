// The lanterns of the vote and the mission, as engraved SVG in a
// 120 × 210 box: a hexagonal carriage lantern hanging from its chain —
// a ring and finial, a ribbed dome under a flared eave with scrolls, a
// band set with a jewel, three panes of glass between grooved posts
// (gothic tracery in the front one), a candle inside, a tapered base
// ending in a drop. Drawn in two layers so the flame burns between
// them: `back` (the dark inside and the candle) and `front` (the glass
// and the metalwork). Baked once each; the light is drawn live.
//
//   good — gold, an emerald: Approve, Success
//   bad  — blackened iron with thorns, a ruby: Reject, Fail
//   seal — the manor's own, gold with an amber: the one everyone fills

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { curl, type Jewel, type Material } from "@/components/engraved/shapes";

export const LANTERN_W = 120;
export const LANTERN_H = 210;
export type LanternKind = "good" | "bad" | "seal";

/** Where the light sits: the middle of the glass, and the wick. */
export const GLASS = { cx: 60, cy: 118, rx: 30, ry: 40 };
export const WICK = { x: 60, y: 139 };

const METAL: Record<LanternKind, Material> = { good: "gold", bad: "iron", seal: "gold" };
const JEWEL: Record<LanternKind, Jewel> = { good: "emerald", bad: "ruby", seal: "amber" };

const f = (n: number) => +n.toFixed(2);
const ring = (cx: number, cy: number, r: number, inner: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z` +
  `M${cx - inner} ${cy}A${inner} ${inner} 0 1 0 ${cx + inner} ${cy}A${inner} ${inner} 0 1 0 ${cx - inner} ${cy}Z`;
const disc = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
const oval = (cx: number, cy: number, rx: number, ry: number, irx: number, iry: number) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z` +
  `M${cx - irx} ${cy}A${irx} ${iry} 0 1 0 ${cx + irx} ${cy}A${irx} ${iry} 0 1 0 ${cx - irx} ${cy}Z`;
/** Mirror a path across the lantern's middle (x = 60). */
const mirror = (d: string) =>
  d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${f(120 - Number(x))} ${y}`);

/** The posts between the panes, left to right: [left, right] at top and bottom. */
const POSTS = [
  [28, 34, 29, 35],
  [42, 47, 42, 47],
  [73, 78, 73, 78],
  [86, 92, 85, 91],
];
const TOP = 83;
const FOOT = 157;

function metalwork(kind: LanternKind): EmblemData {
  const m = METAL[kind];
  const parts: EmblemData = [];
  // the chain: links seen face on and edge on, in turn
  for (let i = 0; i < 3; i++) {
    const y = 3 + i * 7.2;
    parts.push(
      i % 2 === 0
        ? { d: oval(60, y + 3, 3.2, 4.6, 1.5, 2.8), m, evenOdd: true, ink: 0.8 }
        : { d: `M59 ${y - 1}H61V${y + 7}H59Z`, m, ink: 0.8 },
    );
  }
  parts.push(
    // the ring it hangs by, and the finial under it
    { d: ring(60, 27, 7.2, 4.4), m, evenOdd: true, round: true, ink: 1, shine: "M55 23.5Q57.5 21 61 21.2", sw: 0.9 },
    { d: disc(60, 38.5, 4.2), m, round: true, ink: 1 },
    // the dome, ribbed
    {
      d: "M37 67C37 54 48 47 55 43.5Q60 40.5 65 43.5C72 47 83 54 83 67Z",
      m,
      vein: "M60 45V65M51 49Q46.5 57 45.5 65.5M69 49Q73.5 57 74.5 65.5",
      shine: "M43 60Q45.5 51.5 52.5 47",
      ink: 1.3,
      vw: 0.8,
    },
  );
  if (kind === "bad") {
    // thorns round the dome
    for (const x of [44, 52, 60, 68, 76]) {
      const h = x === 60 ? 13 : x === 52 || x === 68 ? 10 : 7;
      const base = x === 60 ? 43 : x === 52 || x === 68 ? 47 : 54;
      parts.push({ d: `M${x - 2.4} ${base + 2}L${x} ${base - h}L${x + 2.4} ${base + 2}Z`, m, ink: 0.9 });
    }
  }
  // the scrolls off the eave's ends, curling under
  const scroll = curl(27, 72, Math.PI * 0.62, 17, -4.2, 3.6);
  parts.push(
    { d: scroll.outline, m, vein: scroll.vein, ink: 1, vw: 0.6 },
    { d: mirror(scroll.outline), m, vein: mirror(scroll.vein), ink: 1, vw: 0.6 },
    // the eave, flared
    {
      d: "M22 71Q27 64.5 38 64.5H82Q93 64.5 98 71Q93 75.5 82 75.5H38Q27 75.5 22 71Z",
      m,
      vein: "M28 70.2H92",
      shine: "M33 66.6H72",
      ink: 1.3,
    },
    // the band under it, grooved, and its jewel's setting
    { d: `M29 75H91V${TOP}H29Z`, m, vein: "M31 77.6H89M31 80.4H89", ink: 1.1, vw: 0.6 },
    { d: disc(60, 79, 6.6), m, round: true, ink: 1 },
    { jewel: JEWEL[kind], x: 60, y: 79, r: 4.5 },
  );
  // the posts, grooved down the middle
  for (const [a, b, c, d] of POSTS) {
    parts.push({
      d: `M${a} ${TOP}H${b}L${d} ${FOOT}H${c}Z`,
      m,
      vein: `M${f((a + b) / 2)} ${TOP + 2}L${f((c + d) / 2)} ${FOOT - 2}`,
      ink: 1,
      vw: 0.6,
    });
  }
  // the front pane's gothic tracery and the bar across all three
  parts.push(
    {
      d: "M47 104Q47 91 60 86.5Q73 91 73 104H70.5Q70.5 93.5 60 89.5Q49.5 93.5 49.5 104Z",
      m,
      ink: 0.8,
    },
    { d: `M34 131H42V134H34ZM47 131H73V134H47ZM78 131H86V134H78Z`, m, ink: 0.8 },
    // the scrolls off the posts at the lantern's sides
    ...[curl(28.5, 112, Math.PI * 0.95, 15, 4, 3.4)].flatMap((c) => [
      { d: c.outline, m, vein: c.vein, ink: 0.9, vw: 0.55 },
      { d: mirror(c.outline), m, vein: mirror(c.vein), ink: 0.9, vw: 0.55 },
    ]),
    // the band at the foot, the tapering base, its ring and the drop
    { d: `M27 ${FOOT}H93V${FOOT + 8}H27Z`, m, vein: `M29 ${FOOT + 2.7}H91M29 ${FOOT + 5.4}H91`, ink: 1.1, vw: 0.6 },
    {
      d: `M30 ${FOOT + 8}H90L79 ${FOOT + 23}H41Z`,
      m,
      vein: `M50 ${FOOT + 10}L52 ${FOOT + 21}M60 ${FOOT + 10}V${FOOT + 21}M70 ${FOOT + 10}L68 ${FOOT + 21}`,
      shine: `M36 ${FOOT + 10}H62`,
      ink: 1.2,
      vw: 0.6,
    },
    { d: `M40 ${FOOT + 22}H80Q82 ${FOOT + 25} 80 ${FOOT + 28}H40Q38 ${FOOT + 25} 40 ${FOOT + 22}Z`, m, ink: 1 },
    { d: `M51 ${FOOT + 28}H69Q67 ${FOOT + 38} 60 ${FOOT + 46}Q53 ${FOOT + 38} 51 ${FOOT + 28}Z`, m, vein: `M60 ${FOOT + 30}V${FOOT + 42}`, ink: 1, vw: 0.6 },
  );
  return parts;
}

/** A length of chain, `n` links (7.2 each) in an 8 wide strip, to hang
 *  a lantern lower than its own chain reaches. */
export const LINK = 7.2;
export function chainStrip(kind: LanternKind, n: number) {
  const m = METAL[kind];
  const parts: EmblemData = Array.from({ length: n }, (_, i) => {
    const y = i * LINK;
    return i % 2 === 0
      ? { d: oval(4, y + 3.6, 3.2, 4.6, 1.5, 2.8), m, evenOdd: true, ink: 0.8 }
      : { d: `M3 ${y - 0.6}H5V${y + 7.8}H3Z`, m, ink: 0.8 };
  });
  const h = n * LINK + 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="${h}" viewBox="0 -1 8 ${h}">${toSvgBody(parts, undefined, `ch${kind}`)}</svg>`;
}

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LANTERN_W}" height="${LANTERN_H}" viewBox="0 0 ${LANTERN_W} ${LANTERN_H}">${body}</svg>`;

/** The dark inside behind the glass, and the candle. */
export function lanternBack(kind: LanternKind) {
  const inside = kind === "bad" ? "#140608" : kind === "good" ? "#08140C" : "#140E06";
  const candle: EmblemData = [
    {
      d: `M53.5 ${WICK.y + 2}Q53.5 ${WICK.y - 1} 56 ${WICK.y}Q57 ${WICK.y + 4} 58 ${WICK.y}H66.5V${FOOT}H53.5Z`,
      m: "ivory",
      vein: `M56 ${WICK.y + 4}V${WICK.y + 10}`,
      ink: 0.9,
      vw: 0.6,
    },
    { d: `M59.4 ${WICK.y + 0.5}H60.6V${WICK.y - 3}H59.4Z`, m: "#2A1A0A", ink: 0 },
  ];
  return svg(
    `<path d="M29 ${TOP}H91L90 ${FOOT}H30Z" fill="${inside}"/>` + toSvgBody(candle, undefined, `lb${kind}`),
  );
}

/** The glass and all the metalwork. */
export function lanternFront(kind: LanternKind) {
  const tint = kind === "bad" ? "#FFB0B8" : kind === "good" ? "#C8FFD8" : "#FFE8B8";
  const glass =
    `<defs><linearGradient id="gl${kind}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${tint}" stop-opacity="0.28"/><stop offset="0.5" stop-color="${tint}" stop-opacity="0.06"/><stop offset="1" stop-color="${tint}" stop-opacity="0.16"/></linearGradient></defs>` +
    // the side panes turn away: darker
    `<path d="M34 ${TOP}H42V${FOOT}H35Z" fill="#000" fill-opacity="0.38"/>` +
    `<path d="M78 ${TOP}H86L85 ${FOOT}H78Z" fill="#000" fill-opacity="0.38"/>` +
    `<path d="M47 ${TOP}H73V${FOOT}H47Z" fill="url(#gl${kind})"/>` +
    // a reflection across the front pane
    `<path d="M49 ${TOP + 26}L58 ${TOP + 8}H62L51 ${TOP + 34}Z" fill="#fff" fill-opacity="0.22"/>` +
    `<path d="M64 ${FOOT - 20}L71 ${FOOT - 36}V${FOOT - 28}L67 ${FOOT - 20}Z" fill="#fff" fill-opacity="0.12"/>`;
  return svg(glass + toSvgBody(metalwork(kind), undefined, `lf${kind}`));
}

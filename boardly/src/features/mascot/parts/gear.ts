// Hats, held items (in the right hand) and things worn on the back, in
// body units (see ../rig). Hats sit on the head (its top is y 8) and may
// rise to y -18; held items are drawn round the grip (86, 54) and swing
// from it; back items go behind the body, with any straps or clasps as
// `front` parts over it.

import { FEATHER, fmt, type Pt } from "@/components/engraved/shapes";
import { mirrorPath, type EmblemPart } from "@/components/engraved/emblem";
import { both, ell, GRIP, type Hex, type PartDef } from "../rig";

type Shape = Extract<EmblemPart, { d: string }>;

/** A closed polygon through `pts`. */
const poly = (pts: Pt[]) => `M${pts.map(fmt).join("L")}Z`;

/** A star of `n` points round (cx, cy); `k` is the inner radius as a
 *  share of the outer. */
function star(cx: number, cy: number, r: number, k = 0.45, n = 5, turn = 0) {
  return poly(
    Array.from({ length: n * 2 }, (_, i): Pt => {
      const a = (i * Math.PI) / n + (turn * Math.PI) / 180 - Math.PI / 2;
      const rr = i % 2 ? r * k : r;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    }),
  );
}

/** A flower of `n` round petals. */
function bloom(cx: number, cy: number, r: number, n = 5, turn = 0) {
  return poly(
    Array.from({ length: 72 }, (_, i): Pt => {
      const a = (i / 72) * Math.PI * 2;
      const rr =
        r *
        (0.5 +
          0.5 * Math.abs(Math.cos((n * (a - (turn * Math.PI) / 180)) / 2)));
      return [cx + Math.sin(a) * rr, cy - Math.cos(a) * rr];
    }),
  );
}

/** A spiral out from (cx, cy) to radius r, `turns` times round. */
function spiral(cx: number, cy: number, r: number, turns: number) {
  const N = 90;
  return `M${Array.from({ length: N + 1 }, (_, i): Pt => {
    const s = i / N;
    const a = s * turns * Math.PI * 2;
    return [cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s];
  })
    .map(fmt)
    .join("L")}`;
}

/** A part drawn at the origin, placed at (x, y) and turned by `a` on the
 *  left, with its mirror image on the right (both() can't mirror a
 *  transform). */
function pairAt(part: Shape, x: number, y: number, a: number): EmblemPart[] {
  return [
    { ...part, t: `translate(${x} ${y}) rotate(${a})` },
    {
      ...part,
      d: mirrorPath(part.d, 0),
      ...(part.vein ? { vein: mirrorPath(part.vein, 0) } : {}),
      ...(part.shine ? { shine: mirrorPath(part.shine, 0) } : {}),
      t: `translate(${100 - x} ${y}) rotate(${-a})`,
    },
  ];
}

/** Parts turned round the grip, so a held thing can lean. */
const lean = (deg: number, parts: EmblemPart[]): EmblemPart[] =>
  parts.map((part) => ({
    ...part,
    t: `rotate(${deg} ${GRIP[0]} ${GRIP[1]})${part.t ? ` ${part.t}` : ""}`,
  }));

/** Parts drawn at the origin, placed at (x, y) and turned by `a`. */
const placed = (
  x: number,
  y: number,
  a: number,
  parts: EmblemPart[],
): EmblemPart[] =>
  parts.map((part) => ({ ...part, t: `translate(${x} ${y}) rotate(${a})` }));

/** Parts grown by `k` round a point. */
const grown = (
  k: number,
  x: number,
  y: number,
  parts: EmblemPart[],
): EmblemPart[] =>
  parts.map((part) => ({
    ...part,
    t: `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})${part.t ? ` ${part.t}` : ""}`,
  }));

/** Parts turned round a point. */
const turned = (
  deg: number,
  x: number,
  y: number,
  parts: EmblemPart[],
): EmblemPart[] =>
  parts.map((part) => ({
    ...part,
    t: `rotate(${deg} ${x} ${y})${part.t ? ` ${part.t}` : ""}`,
  }));

// ── Hats ────────────────────────────────────────────────────────────────

const VELVET: Hex = "#B0183A";
const WITCH: Hex = "#3A2E4E";

export const HATS: Record<string, PartDef> = {
  none: { name: "None", price: 0, draw: () => [] },
  tophat: {
    name: "Top hat",
    price: 600,
    draw: () => [
      {
        d: "M36.4 -12H63.6V12.6H36.4Z",
        m: "#2A2A30",
        ink: 1.2,
        round: true,
        shine: "M39.4 -9V8",
        sw: 1,
      },
      { d: "M36.4 4H63.6V9.4H36.4Z", m: "#C2203A", ink: 1 },
      { d: ell(50, 12.6, 23, 4.4), m: "#2A2A30", ink: 1.2, round: true },
    ],
  },
  beanie: {
    name: "Beanie",
    price: 300,
    draw: () => [
      {
        d: "M29.4 25C29.4 12 38.6 4 50 4C61.4 4 70.6 12 70.6 25Z",
        m: "#3AA65A",
        ink: 1.2,
        round: true,
        vein: "M40 6.6V24M50 4.4V24M60 6.6V24",
        vw: 0.6,
      },
      {
        d: "M28 20.6H72V26.6Q50 29.4 28 26.6Z",
        m: "#2E7A44",
        ink: 1.2,
        round: true,
      },
      { d: ell(50, 2.6, 4.2, 4.2), m: "#F4F0E8", ink: 1, round: true },
    ],
  },
  cap: {
    name: "Baseball cap",
    price: 400,
    draw: () => [
      {
        d: "M30.2 20.6C30.2 9 38.6 2.4 50 2.4C61.4 2.4 69.8 9 69.8 20.6Q50 17.4 30.2 20.6Z",
        m: "#D8283A",
        ink: 1.2,
        round: true,
        vein: "M50 3V17.6M41 4.6Q37.4 11 37 18.6M59 4.6Q62.6 11 63 18.6",
        vw: 0.6,
      },
      { d: ell(50, 2.4, 2.6, 1.6), m: "#D8283A", ink: 1, round: true },
      { d: ell(50, 11, 4.6, 4.4), m: "ivory", ink: 1, round: true },
      { d: star(50, 11.2, 3.2), m: "gold", ink: 0.6 },
      {
        d: "M27.6 21.6Q50 15.2 75.4 20.2Q81.4 22 77.4 24.6Q50 20.8 28.6 25Q24.6 23.6 27.6 21.6Z",
        m: "#A81A2A",
        ink: 1.2,
        shine: "M33 21.4Q50 17.6 70 20",
        sw: 0.8,
      },
    ],
  },
  bow: {
    name: "Big bow",
    price: 400,
    draw: () =>
      turned(-10, 50, 8, [
        ...both({
          d: "M48 10L41.4 25.4L44.6 24.2L46.4 27.4L51 10.6Z",
          m: "#F0507E",
          ink: 1.1,
        }),
        ...both({
          d: "M50 8C43 -2 32 -7 27.6 -2C23.4 3 25 13.6 30.4 16.8C35.6 19.6 43.4 14.4 50 8Z",
          m: "#F0507E",
          ink: 1.2,
          round: true,
          vein: "M47 8.4Q38 2.6 31.4 4.4M46.6 9.6Q38.6 12.6 32.6 13.4",
          vw: 0.6,
        }),
        {
          d: ell(50, 8.4, 5, 5.8),
          m: "#D8306A",
          ink: 1.2,
          round: true,
          vein: "M48.4 5V12M51.6 5V12",
          vw: 0.5,
        },
      ]),
  },
  party: {
    name: "Party hat",
    price: 300,
    draw: () =>
      turned(
        12,
        50,
        12,
        grown(1.12, 50, 14, [
          {
            d: "M36.6 12.6L50 -12.4L63.4 12.6Q50 16.4 36.6 12.6Z",
            m: "#3A9AE0",
            ink: 1.2,
            shine: "M47.2 -5.6L41 7",
            sw: 1,
          },
          {
            line: "M43.4 1.4L56.6 1.4M39.6 8L60.4 8",
            color: "#FFD23A",
            w: 2.4,
          },
          {
            d: `${ell(47.6, -2.6, 1.3, 1.3)}${ell(54.2, 4, 1.5, 1.5)}${ell(44.4, 11.6, 1.4, 1.4)}`,
            m: "#F0507E",
            ink: 0,
          },
          {
            d: "M36 11.4Q38 14 40.4 12.2Q42.6 15.2 45.2 13Q47.6 16 50 13.4Q52.4 16 54.8 13Q57.4 15.2 59.6 12.2Q62 14 64 11.4L64.6 14.6Q50 18.4 35.4 14.6Z",
            m: "gold",
            ink: 1,
          },
          { d: bloom(50, -13.4, 4.2, 7), m: "#FF7AA8", ink: 1, round: true },
        ]),
      ),
  },
  chef: {
    name: "Chef's hat",
    price: 600,
    draw: () => [
      {
        d: "M34 9C25.4 7 25.4 -8.6 35.4 -8.4C35.6 -17.6 46 -19.6 50 -13.2C54 -19.6 64.4 -17.6 64.6 -8.4C74.6 -8.6 74.6 7 66 9Z",
        m: "ivory",
        ink: 1.2,
        round: true,
        vein: "M41.4 8V-2.6M50 8V-6M58.6 8V-2.6",
        vw: 0.7,
        shine: "M31.6 -2Q31 -6.6 35 -7.2",
      },
      {
        d: "M33.4 7.4Q50 10 66.6 7.4L67 17.4Q50 20.6 33 17.4Z",
        m: "ivory",
        ink: 1.2,
        vein: "M33.6 12.4Q50 15.2 66.4 12.4",
        vw: 0.6,
      },
    ],
  },
  wizard: {
    name: "Wizard hat",
    price: 1200,
    draw: () => [
      {
        d: ell(50, 14.6, 25.4, 5),
        m: "night",
        ink: 1.2,
        shine: "M30 13Q38 10.6 44 10.4",
        sw: 0.8,
      },
      {
        d: "M35 14C38 3 43 -8.4 52 -15.4L60.6 -18.6L58.4 -12.2C58 -2.6 61.4 6.4 65 14Q50 17 35 14Z",
        m: "night",
        ink: 1.2,
        shine: "M40 8Q43 -2.6 49 -10",
        vein: "M58.6 -12.4L53.4 -13.6",
        vw: 0.6,
      },
      {
        d: "M35.8 10.2Q50 12.8 64.2 10.2L65 14Q50 17 35 14Z",
        m: "gold",
        ink: 1,
      },
      { d: star(47.4, 0.8, 4.6), m: "gold", ink: 0.9 },
      { d: star(57.2, -6.4, 2.8), m: "gold", ink: 0.8 },
      { d: star(56.4, 5.6, 2.2), m: "gold", ink: 0.7 },
      {
        d: "M44.4 -9.4A3.8 3.8 0 1 0 49.2 -4.6A3 3 0 1 1 44.4 -9.4Z",
        m: "silver",
        ink: 0.7,
      },
    ],
  },
  witch: {
    name: "Witch hat",
    price: 900,
    draw: () => [
      {
        d: ell(50, 15, 28.4, 5.2),
        m: WITCH,
        ink: 1.2,
        shine: "M27 13.6Q36 10.6 44 10.4",
        sw: 0.8,
      },
      {
        d: "M37.4 14C39.6 3 42.6 -7.6 47.4 -13C51.4 -17.4 59.6 -16.4 66.4 -8.4C60.6 -11 55.6 -10.6 53.6 -6.6C52.2 -0.6 58.4 7.4 62.6 14Q50 16.6 37.4 14Z",
        m: WITCH,
        ink: 1.2,
        round: true,
        shine: "M42 7Q43.6 -3 47 -9",
      },
      {
        d: "M38.6 8.6Q50 11 61.4 8.6L62.6 14Q50 16.6 37.4 14Z",
        m: "#7A3AB0",
        ink: 1,
      },
      { d: "M45.6 8.4H54.4V15.4H45.6Z", m: "gold", ink: 1 },
      { dark: "M48 10.2H52V13.6H48Z" },
    ],
  },
  crown: {
    name: "Crown",
    price: 2500,
    draw: () => [
      {
        d: "M34 14C36 3 44 -1 50 -1C56 -1 64 3 66 14Z",
        m: VELVET,
        ink: 1,
        round: true,
      },
      {
        d: "M32.6 21.6L30.4 3.4L37.8 10.4L41.6 -1.8L46.4 8.6L50 -6.4L53.6 8.6L58.4 -1.8L62.2 10.4L69.6 3.4L67.4 21.6Q50 25.2 32.6 21.6Z",
        m: "gold",
        ink: 1.2,
        shine: "M33.2 7L34.6 17.4",
        vein: "M41.6 2V12M58.4 2V12M50 -2V10",
        vw: 0.6,
      },
      {
        d: "M32 14.6Q50 18.2 68 14.6L67.4 21.8Q50 25.4 32.6 21.8Z",
        m: "gold",
        ink: 1.1,
        vein: "M32.8 16.2Q50 19.8 67.2 16.2",
        vw: 0.5,
      },
      {
        d: `${ell(30.4, 2.4, 2, 2)}${ell(69.6, 2.4, 2, 2)}${ell(41.6, -3, 1.9, 1.9)}${ell(58.4, -3, 1.9, 1.9)}`,
        m: "ivory",
        ink: 0.9,
        round: true,
      },
      { jewel: "emerald", x: 50, y: -7.4, r: 2.4 },
      { jewel: "ruby", x: 50, y: 19.6, r: 2.8 },
      { jewel: "sapphire", x: 40.4, y: 18.8, r: 1.9 },
      { jewel: "sapphire", x: 59.6, y: 18.8, r: 1.9 },
    ],
  },
  viking: {
    name: "Viking helmet",
    price: 1000,
    draw: () => [
      ...both({
        d: "M33 15.6C26 15 19.6 10.4 17.6 -1.4C17 -5.6 19.4 -7.6 21 -4.6C22.6 3.4 27.4 7.6 34.6 8.6Z",
        m: "ivory",
        ink: 1.2,
        round: true,
        vein: "M20 2.2L23.6 0.8M22.6 7L26.6 5M27 11L30.4 8.4",
        vw: 0.7,
      }),
      {
        d: "M29.8 21C29.8 9 38.6 2.4 50 2.4C61.4 2.4 70.2 9 70.2 21Z",
        m: "silver",
        ink: 1.2,
        round: true,
        shine: "M35 13Q37 7 42 5",
      },
      {
        d: "M47.6 2.8H52.4V18.6H47.6Z",
        m: "gold",
        ink: 1,
        vein: "M50 4V17.6",
        vw: 0.5,
      },
      {
        d: "M28.6 17.2Q50 20.8 71.4 17.2L71.4 22.6Q50 26.2 28.6 22.6Z",
        m: "gold",
        ink: 1.1,
        vein: "M29 19.8Q50 23.4 71 19.8",
        vw: 0.5,
      },
      {
        d: `${ell(34, 21.4, 1, 1)}${ell(42, 22.6, 1, 1)}${ell(58, 22.6, 1, 1)}${ell(66, 21.4, 1, 1)}`,
        m: "iron",
        ink: 0,
      },
    ],
  },
  flowers: {
    name: "Flower crown",
    price: 700,
    draw: () => {
      const along: [number, number, number][] = [
        [30.6, 20.4, -62],
        [35.4, 14.6, -40],
        [42.4, 11.4, -16],
        [50, 10.4, 0],
        [57.6, 11.4, 16],
        [64.6, 14.6, 40],
        [69.4, 20.4, 62],
      ];
      const leaves = along.flatMap(([x, y, a]): EmblemPart[] => [
        {
          d: "M0 0C3 -2 4.4 -6 0 -9C-4.4 -6 -3 -2 0 0Z",
          m: "leaf",
          ink: 0.8,
          vein: "M0 -1V-7.6",
          vw: 0.4,
          t: `translate(${x} ${y}) rotate(${a - 70})`,
        },
        {
          d: "M0 0C3 -2 4.4 -6 0 -9C-4.4 -6 -3 -2 0 0Z",
          m: "leaf",
          ink: 0.8,
          vein: "M0 -1V-7.6",
          vw: 0.4,
          t: `translate(${x} ${y}) rotate(${a + 70})`,
        },
      ]);
      const flowers: [number, number, number, Hex][] = [
        [31.6, 19.4, 5, "#FFFFFF"],
        [40.2, 12.4, 6, "#FF8AB8"],
        [50, 10, 6.6, "#FFD23A"],
        [59.8, 12.4, 6, "#FF8AB8"],
        [68.4, 19.4, 5, "#FFFFFF"],
      ];
      return [
        { d: "M30.6 22.4Q50 4.4 69.4 22.4", m: "leaf", ink: 0 },
        { line: "M30.6 21.4Q50 5.4 69.4 21.4", color: "#2E6A1E", w: 2.6 },
        ...leaves,
        ...flowers.flatMap(([x, y, r, c], i): EmblemPart[] => [
          { d: bloom(x, y, r, 5, i * 17), m: c, ink: 0.9, round: true },
          {
            d: ell(x, y, r * 0.3, r * 0.3),
            m: c === "#FFD23A" ? "flame" : "gold",
            ink: 0.6,
            round: true,
          },
        ]),
      ];
    },
  },
  cat: {
    name: "Cat ears",
    price: 500,
    draw: ({ colour }) => [
      ...both({
        d: "M32 18.6C29 10 28.4 2.6 30.4 -1.6C37 0 42.4 4 46 9.4C40.6 10.4 35.6 13.6 32 18.6Z",
        m: colour as Hex,
        ink: 1.2,
        round: true,
      }),
      ...both({
        d: "M33.8 13.6C32.4 8.6 32.2 4.6 33.2 2.2C37 3.6 40 6 42 8.6C38.8 9.6 36 11.4 33.8 13.6Z",
        m: "#FF9AB4",
        ink: 0,
        round: true,
      }),
    ],
  },
  halo: {
    name: "Halo",
    price: 1800,
    draw: () => [
      {
        d: `${ell(50, 2, 16.6, 5)}${ell(50, 2, 12, 2.8)}`,
        m: "gold",
        ink: 1.1,
        evenOdd: true,
        round: true,
        shine: "M37.6 -1.6Q43 -3.6 50 -3.6",
        sw: 0.9,
      },
      { d: star(30.2, -4.8, 2.6, 0.3, 4), m: "ivory", ink: 0.5 },
      { d: star(70.6, -6.2, 2, 0.3, 4), m: "ivory", ink: 0.5 },
    ],
  },
};

// ── Held items (the grip is the right hand, (86, 54)) ──────────────────

export const HANDS: Record<string, PartDef> = {
  none: { name: "Empty", price: 0, draw: () => [] },
  sword: {
    name: "Sword",
    price: 800,
    draw: () =>
      lean(18, [
        {
          d: "M84.6 50V16L86 11.6L87.4 16V50Z",
          m: "silver",
          ink: 1,
          vein: "M86 14V49",
          vw: 0.5,
        },
        { d: "M79.6 49.6H92.4V53.2H79.6Z", m: "gold", ink: 1 },
        { d: "M84.6 53.2H87.4V62.4H84.6Z", m: "wood", ink: 1 },
        { d: ell(86, 63.8, 2.2, 2.2), m: "gold", ink: 1 },
      ]),
  },
  wand: {
    name: "Magic wand",
    price: 900,
    draw: () =>
      lean(8, [
        {
          d: "M84.4 63V30H87.6V63Z",
          m: "iron",
          ink: 1,
          shine: "M85.4 32V60",
          sw: 0.6,
        },
        { d: "M84.6 30H87.4V34.4H84.6Z", m: "ivory", ink: 0.9 },
        {
          d: star(86, 22.6, 10, 0.46, 5),
          m: "gold",
          ink: 1.1,
          shine: "M84 18.6L86 16.4",
        },
        { jewel: "sapphire", x: 86, y: 23.6, r: 2.4 },
        { d: star(76.6, 15, 2.6, 0.28, 4), m: "ivory", ink: 0.5 },
        { d: star(95, 32.4, 2, 0.28, 4), m: "ivory", ink: 0.5 },
        { d: star(93.6, 12.4, 1.6, 0.28, 4), m: "ivory", ink: 0.4 },
      ]),
  },
  magnifier: {
    name: "Magnifying glass",
    price: 500,
    draw: () =>
      lean(6, [
        {
          d: "M84.2 64.4V45H87.8V64.4Q86 66 84.2 64.4Z",
          m: "wood",
          ink: 1,
          shine: "M85.2 47V62",
          sw: 0.6,
        },
        { d: "M83.6 42.6H88.4V45.6H83.6Z", m: "gold", ink: 0.9 },
        { d: ell(86, 31.6, 8, 8), m: "#BFE4F8", ink: 0, op: 0.7 },
        { d: "M81.2 28.6Q82.6 25.4 86 24.8", m: "ivory", ink: 0 },
        { line: "M81.4 29.6Q82.4 26 85.8 25", color: "#FFFFFF", w: 1.4 },
        {
          d: `${ell(86, 31.6, 10.6, 10.6)}${ell(86, 31.6, 8, 8)}`,
          m: "gold",
          ink: 1.1,
          evenOdd: true,
          round: true,
        },
      ]),
  },
  flag: {
    name: "Flag",
    price: 400,
    draw: () =>
      lean(-12, [
        {
          d: "M84.4 65V-6H87.6V65Z",
          m: "wood",
          ink: 1,
          shine: "M85.4 -4V62",
          sw: 0.6,
        },
        {
          d: "M87.6 -5C93 -8.4 99 -1.6 106 -5V12C99 15.4 93 8.6 87.6 12Z",
          m: "crimson",
          ink: 1.1,
          vein: "M98 -3.6Q99 3.4 98.2 13",
          vw: 0.5,
        },
        { d: star(96.4, 3.6, 4.6), m: "gold", ink: 0.8 },
        { d: ell(86, -7.6, 2.4, 2.4), m: "gold", ink: 1, round: true },
      ]),
  },
  lollipop: {
    name: "Giant lollipop",
    price: 300,
    draw: () =>
      lean(5, [
        { d: "M84.8 64V26H87.2V64Z", m: "ivory", ink: 1 },
        { d: ell(86, 15, 12, 12), m: "#FF5A8C", ink: 1.2, round: true },
        { line: spiral(86, 15, 10.6, 2.6), color: "#FFF4F8", w: 2.4 },
        { d: ell(86, 15, 12, 12), m: "#FFFFFF", ink: 0, op: 0.12 },
        {
          d: "M86 27.6L80.2 24.2L80.4 31.2ZM86 27.6L91.8 24.2L91.6 31.2Z",
          m: "#3AB0E0",
          ink: 0.8,
        },
        { d: ell(86, 27.6, 1.6, 1.6), m: "#3AB0E0", ink: 0.8 },
      ]),
  },
  balloon: {
    name: "Balloon",
    price: 300,
    draw: () => [
      {
        line: "M86 55C83 48 89 42 86 36C83.4 31 87 28 85 24.4",
        color: "#3A2408",
        w: 0.8,
      },
      ...lean(4, [
        { d: "M83.6 25.4L85 22.4L86.4 25.4Z", m: "crimson", ink: 0.8 },
        {
          d: "M85 22.6C77 22.6 72.6 15 72.6 8.4C72.6 0.6 78.2 -4.4 85 -4.4C91.8 -4.4 97.4 0.6 97.4 8.4C97.4 15 93 22.6 85 22.6Z",
          m: "crimson",
          ink: 1.2,
          round: true,
          shine: "M77.6 4Q78.6 -0.4 82.6 -1.4",
          sw: 1.4,
        },
      ]),
    ],
  },
  umbrella: {
    name: "Umbrella",
    price: 600,
    draw: () =>
      lean(-8, [
        { d: "M84.8 62V-14H87.2V62Z", m: "silver", ink: 0.9 },
        {
          d: "M84.6 60H87.4V64.6C87.4 69.4 80 69.4 80 64.6V63H82.4V64.6C82.4 66.4 84.6 66.4 84.6 64.6Z",
          m: "wood",
          ink: 1,
        },
        {
          d: "M66 2.6C66 -9.4 75 -17 86 -17C97 -17 106 -9.4 106 2.6Q101 -0.6 96 2.6Q91 -0.6 86 2.6Q81 -0.6 76 2.6Q71 -0.6 66 2.6Z",
          m: "#3A9AE0",
          ink: 1.2,
          round: true,
          vein: "M86 -16.4Q79 -9 76 2M86 -16.4V2M86 -16.4Q93 -9 96 2",
          vw: 0.7,
          shine: "M70 -4Q73 -11.6 80 -14.6",
        },
        {
          d: "M86 -17Q81 -9 76 2.6Q71 -0.6 66 2.6C66 -9.4 75 -17 86 -17Z",
          m: "#F0F4F8",
          ink: 1,
        },
        {
          d: "M86 -17Q91 -9 96 2.6Q101 -0.6 106 2.6C106 -9.4 97 -17 86 -17Z",
          m: "#F0F4F8",
          ink: 1,
        },
        { d: ell(86, -18.2, 1.6, 1.6), m: "gold", ink: 0.8 },
      ]),
  },
  spatula: {
    name: "Spatula",
    price: 300,
    draw: () =>
      lean(10, [
        {
          d: "M84.6 66V36H87.4V66Q86 67.4 84.6 66Z",
          m: "wood",
          ink: 1,
          shine: "M85.4 38V63",
          sw: 0.6,
        },
        {
          d: "M84.6 37.4C80.6 36 77.4 32 77.4 25.4V18.6C77.4 14.6 80 12.4 86 12.4C92 12.4 94.6 14.6 94.6 18.6V25.4C94.6 32 91.4 36 87.4 37.4Z",
          m: "#C68A4E",
          ink: 1.2,
          shine: "M79.6 17V29",
          sw: 0.8,
        },
        {
          dark: "M82 17.6Q83 16.6 84 17.6V28.6Q83 29.6 82 28.6ZM88 17.6Q89 16.6 90 17.6V28.6Q89 29.6 88 28.6Z",
        },
      ]),
  },
  shield: {
    name: "Shield",
    price: 1000,
    draw: () =>
      lean(-4, [
        {
          d: "M71.4 43.6Q84 40.4 96.6 43.6V57.6C96.6 67.6 90.4 74.6 84 78.4C77.6 74.6 71.4 67.6 71.4 57.6Z",
          m: "silver",
          ink: 1.2,
          round: true,
        },
        {
          d: "M74.4 46.4Q84 44 93.6 46.4V57.6C93.6 65.8 88.8 71.6 84 74.8C79.2 71.6 74.4 65.8 74.4 57.6Z",
          m: "crimson",
          ink: 0.9,
          round: true,
          shine: "M76.4 49V58",
          sw: 0.8,
        },
        {
          d: "M82.2 45.2H85.8V74H82.2ZM74.6 54.4H93.4V58H74.6Z",
          m: "gold",
          ink: 0.9,
        },
        { jewel: "sapphire", x: 84, y: 56.2, r: 3 },
      ]),
  },
  lantern: {
    name: "Lantern",
    price: 700,
    draw: () =>
      grown(1.2, 86, 54, [
        {
          d: "M79.8 59.6C79.8 50.6 92.2 50.6 92.2 59.6H90.4C90.4 53 81.6 53 81.6 59.6Z",
          m: "iron",
          ink: 0.8,
        },
        { d: "M79 59.6H93L95 63H77Z", m: "gold", ink: 1 },
        { d: "M78.8 63H93.2V78.4H78.8Z", m: "#FFE8A0", ink: 0, round: true },
        { d: ell(86, 71, 6, 6.6), m: "flame", ink: 0, op: 0.55 },
        {
          d: "M86 64.6C88.6 68.4 89.4 71.4 89 73.4C88.6 75.6 87.4 76.6 86 76.6C84.6 76.6 83.4 75.6 83 73.4C82.6 71.4 83.4 68.4 86 64.6Z",
          m: "flame",
          ink: 0.6,
          round: true,
        },
        {
          d: "M78 63H80.2V78.4H78ZM91.8 63H94V78.4H91.8ZM85.2 63H86.8V65.4H85.2Z",
          m: "gold",
          ink: 0.8,
        },
        { d: "M77 78.4H95L93 82.4H79Z", m: "gold", ink: 1 },
      ]),
  },
};

// ── Back ────────────────────────────────────────────────────────────────

const PACK = "#8A5A3A";
const STRAP = "#5A3A22";

/** A wing feather, `len` long and `w` across, pointing up from its root. */
const feather = (len: number, w: number, m: Shape["m"] = "ivory"): Shape => ({
  d: FEATHER(len, w),
  m,
  ink: 1,
  vein: `M0 -2V${-len * 0.86}`,
  vw: 0.6,
});

/** One row of wing feathers rooted along a wing's arm from the shoulder
 *  to the wrist, turning (and growing) from `turn[0]` to `turn[1]` along
 *  it; drawn from the wrist down, so each lies over the one above. */
function wingRow(
  n: number,
  shoulder: Pt,
  wrist: Pt,
  turn: [number, number],
  len: [number, number],
  w: number,
  m: Shape["m"],
): EmblemPart[] {
  const at = (a: number, b: number, s: number) => +(a + (b - a) * s).toFixed(2);
  return Array.from({ length: n }, (_, k) => 1 - k / (n - 1)).flatMap((s) =>
    pairAt(
      feather(at(len[0], len[1], s), w, m),
      at(shoulder[0], wrist[0], s),
      at(shoulder[1], wrist[1], s),
      at(turn[0], turn[1], s),
    ),
  );
}

/** Wing part `d` with a copy shrunk toward the root: an inlay. */
const inlay = (x: number, y: number, k: number) =>
  `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`;

const BUTTERFLY_TOP =
  "M43 44C38 30 28 10 14.4 1.4C6.6 -3.6 1.6 2.4 2.6 12C3.6 22.8 16 34.4 38 48Z";
const BUTTERFLY_LOW =
  "M38 54C30 58 18 62 12.4 71.6C8.6 78.6 14.4 84.6 21.4 81C28 77.6 33.6 68 38 60Z";

export const BACKS: Record<
  string,
  PartDef & { front?: () => ReturnType<PartDef["draw"]> }
> = {
  none: { name: "None", price: 0, draw: () => [] },
  backpack: {
    name: "Backpack",
    price: 500,
    draw: () => [
      {
        d: "M28.6 38Q28.6 31 35 31H65Q71.4 31 71.4 38V76H28.6Z",
        m: PACK,
        ink: 1.2,
        round: true,
      },
    ],
    front: () => [
      { line: "M37.4 41.6L32.6 66", color: STRAP, w: 3.4 },
      { line: "M62.6 41.6L67.4 66", color: STRAP, w: 3.4 },
    ],
  },
  wings: {
    name: "Angel wings",
    price: 2500,
    // rows of feathers rooted along each wing's arm, from behind the
    // shoulder up to the wrist beside the head: the long ones first (the
    // top one highest), the shorter rows over their roots
    draw: () => [
      ...wingRow(6, [36, 41], [20.4, 12.4], [-94, -20], [27, 32], 6.2, "ivory"),
      ...wingRow(5, [36, 41], [24, 17.4], [-90, -28], [19, 23], 5.6, "ivory"),
      ...wingRow(5, [36.6, 40], [26.4, 19], [-82, -32], [11, 13], 4.6, "gold"),
    ],
  },
  bat: {
    name: "Bat wings",
    price: 1800,
    draw: () =>
      both({
        d: "M41 46C35 30 26 14 15.6 0.8L14.4 -4.6L18.4 -1.4L2.4 11.4Q12 18.6 2.6 30Q14.6 32.6 11.6 46.4Q26 43.8 40 52Z",
        m: "#4A3A66",
        ink: 1.2,
        vein: "M16.4 1.6L4.4 11.6M16.4 1.6Q10 16 4.6 28.6M16.4 1.6Q16.4 24 12.6 44.4M16.4 1.6Q26 22 38 48",
        vw: 0.9,
        shine: "M36 36Q28 20 19.4 6",
        sw: 0.8,
      }),
  },
  butterfly: {
    name: "Butterfly wings",
    price: 2000,
    draw: () => [
      ...both({ d: BUTTERFLY_LOW, m: "night", ink: 1.2, round: true }),
      {
        d: BUTTERFLY_LOW,
        m: "#4AB8F0",
        ink: 0.6,
        round: true,
        t: inlay(38, 57, 0.72),
      },
      {
        d: mirrorPath(BUTTERFLY_LOW, 100),
        m: "#4AB8F0",
        ink: 0.6,
        round: true,
        t: inlay(62, 57, 0.72),
      },
      ...both({ d: BUTTERFLY_TOP, m: "night", ink: 1.2, round: true }),
      {
        d: BUTTERFLY_TOP,
        m: "#4AB8F0",
        ink: 0.7,
        round: true,
        vein: "M40 42Q26 22 14 8M40 42Q22 30 8 18",
        vw: 1,
        t: inlay(41, 46, 0.74),
      },
      {
        d: mirrorPath(BUTTERFLY_TOP, 100),
        m: "#4AB8F0",
        ink: 0.7,
        round: true,
        vein: mirrorPath("M40 42Q26 22 14 8M40 42Q22 30 8 18", 100),
        vw: 1,
        t: inlay(59, 46, 0.74),
      },
      ...both({
        d: `${ell(6.2, 6.8, 1.7, 1.7)}${ell(5, 15, 1.5, 1.5)}${ell(13.6, 3.2, 1.4, 1.4)}${ell(9.6, 24, 1.3, 1.3)}${ell(14.6, 77, 1.4, 1.4)}`,
        m: "ivory",
        ink: 0,
      }),
    ],
  },
  cape: {
    name: "Cape",
    price: 1200,
    draw: () => [
      {
        d: "M34 37.6Q50 35 66 37.6C76 44 82 52 84 62L95 101.4Q88 99 82 103.4Q75 100 68 104.4Q59 101 50 104.6Q41 101 32 104.4Q25 100 18 103.4Q12 99 5 101.4L16 62C18 52 24 44 34 37.6Z",
        m: "crimson",
        ink: 1.2,
        vein: "M22 62L12 98M30 70L26 100M70 70L74 100M78 62L88 98",
        vw: 0.8,
      },
      {
        line: "M5.6 100.6Q12 98.2 18 102.6Q25 99.2 32 103.6Q41 100.2 50 103.8Q59 100.2 68 103.6Q75 99.2 82 102.6Q88 98.2 94.4 100.6",
        color: "#E2B04A",
        w: 1.4,
      },
    ],
    front: () => [
      ...both({
        d: "M34.6 39.6Q39 41.6 44.4 41.4L41.4 46.4Q35.6 44.8 31.6 41.6Z",
        m: "crimson",
        ink: 1,
      }),
      { line: "M41.4 43.6Q50 46.4 58.6 43.6", color: "#E2B04A", w: 1.2 },
      ...both({
        d: ell(41.4, 43.4, 2.6, 2.6),
        m: "gold",
        ink: 0.9,
        round: true,
      }),
    ],
  },
  jetpack: {
    name: "Jetpack",
    price: 1500,
    draw: () => [
      ...both({
        d: "M18.6 66Q17.4 77 24.2 92Q31 77 29.8 66Z",
        m: "flame",
        ink: 0.9,
        round: true,
      }),
      ...both({
        d: "M21 66Q21 74 24.2 82Q27.4 74 27.4 66Z",
        m: "#FFF6C8",
        ink: 0,
      }),
      ...both({ d: "M19.4 59H29L31 66.4H17.4Z", m: "iron", ink: 1 }),
      ...both({
        d: "M16.6 30H31.8V59.6Q24.2 62 16.6 59.6Z",
        m: "silver",
        ink: 1.2,
        round: true,
        shine: "M19.2 33V56",
      }),
      ...both({
        d: "M16.6 30C16.6 22 20 17 24.2 14C28.4 17 31.8 22 31.8 30Z",
        m: "crimson",
        ink: 1.1,
        round: true,
      }),
      ...both({ d: "M16.4 36.4H32V40H16.4Z", m: "gold", ink: 0.9 }),
    ],
    front: () => [
      { line: "M37.4 41.6L33 64", color: "#3A3E46", w: 3.2 },
      { line: "M62.6 41.6L67 64", color: "#3A3E46", w: 3.2 },
      { line: "M35.4 53H64.6", color: "#3A3E46", w: 2.6 },
      { d: "M46.4 50.4H53.6V55.6H46.4Z", m: "gold", ink: 0.9 },
    ],
  },
  quiver: {
    name: "Quiver",
    price: 800,
    // a long quiver slung from behind the right shoulder to the left hip
    draw: () =>
      placed(72, 22, 52, [
        ...[-3.4, 0, 3.4].flatMap((x, i): EmblemPart[] => [
          { d: `M${x - 0.7} 2V-12H${x + 0.7}V2Z`, m: "wood", ink: 0.6 },
          {
            d: `M${x} -9L${x - 3.2} -12.6V-19L${x} -16L${x + 3.2} -19V-12.6Z`,
            m: i === 1 ? "ivory" : "crimson",
            ink: 0.9,
            vein: `M${x} -9.6V-16`,
            vw: 0.5,
          },
        ]),
        {
          d: "M-6 0H6V70Q6 76 0 76Q-6 76 -6 70Z",
          m: "#8A4A2A",
          ink: 1.2,
          round: true,
          shine: "M-3.6 4V68",
          vein: "M2 8V66",
          vw: 0.6,
        },
        { d: "M-6.6 -1.4H6.6V4H-6.6Z", m: "gold", ink: 1 },
        { d: "M-6.2 60H6.2V64H-6.2Z", m: "gold", ink: 1 },
      ]),
    front: () => [
      { line: "M65 41L35 65", color: STRAP, w: 3.2 },
      {
        d: "M47.4 50.6H53.4V56.6H47.4Z",
        m: "gold",
        ink: 0.9,
        t: "rotate(-38 50.4 53.6)",
      },
      { dark: "M49.2 52.4H51.6V54.8H49.2Z", t: "rotate(-38 50.4 53.6)" },
    ],
  },
};

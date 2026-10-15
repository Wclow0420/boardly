// The emoji Liar's Dice and Manor use as pictures, drawn as engraved
// emblems in the house style (see "The house drawing style" in
// AGENTS.md): the beer cups that are lives, the split axe, the leopard
// die, and Manor's rooms, owner, butler, torch and camera. Plain data in
// a 48 × 48 box, keyed by the emoji without its U+FE0F. People are
// meeples told apart by what they wear and hold, never by a face. Look
// them over with
//   node scripts/emblem-sheet.mjs src/components/engraved/emoji/manor.ts out.png

import {
  disc,
  ring,
  type EmblemData,
  type EmblemPart,
  type Shade,
} from "../emblem";
import { FEATHER, LEAF, fmt, ribbon, type Pt } from "../shapes";

/** The house meeple, centred on (24, 24): 32 wide, 36 tall. */
const MEEPLE =
  "M24 6C28 6 30.5 9 30.5 12.5C30.5 14.8 29.4 16.4 28.2 17.4C33 18.4 39 19.6 40 22.2C41 24.8 37.4 26 33 26.8C32.4 27 32.2 27.6 32.5 28.2L37.5 38.5C38.4 40.4 37.2 42 35 42H28C26.8 42 26 41.2 25.6 40.2L24 36L22.4 40.2C22 41.2 21.2 42 20 42H13C10.8 42 9.6 40.4 10.5 38.5L15.5 28.2C15.8 27.6 15.6 27 15 26.8C10.6 26 7 24.8 8 22.2C9 19.6 15 18.4 19.8 17.4C18.6 16.4 17.5 14.8 17.5 12.5C17.5 9 20 6 24 6Z";
const MEEPLE_SHINE = "M20.5 10.5A4 4 0 0 1 23 8.4M11 22.6Q14 20.6 18 20";

/** A meeple standing at (x, y), `scale` of its full size. */
const meeple = (
  x: number,
  y: number,
  scale: number,
  m: Shade,
  ink = 1.5,
): EmblemPart => ({
  d: MEEPLE,
  m,
  ink: ink / scale,
  shine: MEEPLE_SHINE,
  t: `translate(${x} ${y}) scale(${scale}) translate(-24 -24)`,
});

/** The meeple's outline as points: its lines and curves walked in
 *  small steps (for the hidden one's dotted edge). */
function meepleOutline(): Pt[] {
  const tokens = MEEPLE.match(/[MCLHZ]|-?[\d.]+/g) ?? [];
  const pts: Pt[] = [];
  let cur: Pt = [0, 0];
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cur = [num(), num()];
      pts.push(cur);
    } else if (cmd === "L" || cmd === "H") {
      const to: Pt = cmd === "L" ? [num(), num()] : [num(), cur[1]];
      for (let k = 1; k <= 8; k++)
        pts.push([
          cur[0] + ((to[0] - cur[0]) * k) / 8,
          cur[1] + ((to[1] - cur[1]) * k) / 8,
        ]);
      cur = to;
    } else if (cmd === "C") {
      const a: Pt = [num(), num()];
      const b: Pt = [num(), num()];
      const to: Pt = [num(), num()];
      for (let k = 1; k <= 12; k++) {
        const u = k / 12;
        const v = 1 - u;
        const f = (j: 0 | 1) =>
          v * v * v * cur[j] +
          3 * v * v * u * a[j] +
          3 * v * u * u * b[j] +
          u * u * u * to[j];
        pts.push([f(0), f(1)]);
      }
      cur = to;
    }
  }
  return pts;
}

/** Dots every `step` along the meeple's edge, as one path. */
function dottedMeeple(step: number, r: number) {
  const pts = meepleOutline();
  let d = "";
  let carry = 0;
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1];
    const [bx, by] = pts[k];
    const len = Math.hypot(bx - ax, by - ay);
    let s = carry;
    while (s < len) {
      d += disc(ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len, r);
      s += step;
    }
    carry = s - len;
  }
  return d;
}

/** Points round a circle, from one angle to another. */
const arc = (
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  n = 24,
): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/** A regular polygon round (24, 24), its first corner at `turn`. */
const polygon = (n: number, r: number, turn: number) =>
  `M${Array.from({ length: n }, (_, i) => {
    const a = turn + (i * 2 * Math.PI) / n;
    return fmt([24 + Math.cos(a) * r, 24 + Math.sin(a) * r]);
  }).join("L")}Z`;

/** A heart, its notch at (24, 11.5) and point at (24, 42). */
const HEART =
  "M24 42C14 34.5 4.5 27 4.5 17C4.5 10.5 9.5 6 15 6C19 6 22.3 8.3 24 11.5C25.7 8.3 29 6 33 6C38.5 6 43.5 10.5 43.5 17C43.5 27 34 34.5 24 42Z";
const INSET = (s: number) =>
  `translate(24 ${24 - 0.6 * (1 - s)}) scale(${s}) translate(-24 -24)`;

/** A bone along the x axis through (24, 24), 36 long. */
const BONE =
  "M10.5 21.6H37.5C38 18 43 17.4 44 20.6C44.4 22 43.6 23.4 42.6 24C43.6 24.6 44.4 26 44 27.4C43 30.6 38 30 37.5 26.4H10.5C10 30 5 30.6 4 27.4C3.6 26 4.4 24.6 5.4 24C4.4 23.4 3.6 22 4 20.6C5 17.4 10 18 10.5 21.6Z";

/** The beer tankard's parts: amber glass, a silver handle, a head of
 *  foam. `full` false leaves it empty, in dull iron. */
const MUG_BODY = "M10 15H32V40Q32 43 29 43H13Q10 43 10 40Z";
const MUG_HANDLE =
  "M31 18H36.5Q42 18 42 23.5V30.5Q42 36 36.5 36H31V31.5H36Q37.5 31.5 37.5 30V24Q37.5 22.5 36 22.5H31Z";
const FOAM =
  "M8.2 16.4C6.4 12.4 9.4 8.6 13 9.4C14 5.8 18.6 4.6 21.2 7.2C23.6 4.6 28.2 5 29.8 8.2C33.4 7.6 35.6 10.8 34.4 14.4C34.4 15.6 33.4 17 31.6 17H31.4V21.5Q31.4 23 30 23Q28.6 23 28.6 21.5V17H11C9.6 17 8.6 17 8.2 16.4Z";
const mug = (t: string, scale: number): EmblemPart[] => [
  {
    d: MUG_HANDLE,
    m: "silver",
    ink: 1.4 / scale,
    t,
  },
  {
    d: MUG_BODY,
    m: "flame",
    vein: "M16 20V39M21 20V39M26 20V39",
    shine: "M13 20V38.5",
    ink: 1.5 / scale,
    t,
  },
  {
    d: "M9 38.5H33V41Q33 44 30 44H12Q9 44 9 41Z",
    m: "gold",
    ink: 1.2 / scale,
    t,
  },
  {
    d: FOAM,
    m: "ivory",
    shine: "M11 13.5Q11 11 13.6 11",
    ink: 1.4 / scale,
    t,
  },
];

/** A ring sector, for a leopard's rosettes. */
const sector = (
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
) => {
  const outer = arc(cx, cy, r1, a0, a1, 6);
  const inner = arc(cx, cy, r0, a1, a0, 6);
  return `M${[...outer, ...inner].map(fmt).join("L")}Z`;
};
/** A rosette: three broken arcs round a hollow, `s` across. */
const rosette = (cx: number, cy: number, s: number, turn: number) =>
  [0, 1, 2]
    .map((k) => {
      const a = turn + (k * 2 * Math.PI) / 3;
      return sector(cx, cy, s * 0.42, s, a, a + 1.6);
    })
    .join("");
/** The leopard's coat on one face of the die: drawn in a 20 × 20
 *  square, carried onto the face by `t`. */
const coat = (seed: number) =>
  rosette(6, 6, 3.6, seed) +
  rosette(14.5, 9, 3.4, seed + 1.3) +
  rosette(8, 15, 3.4, seed + 2.4) +
  disc(16, 16.5, 1.4) +
  disc(14, 2.6, 1.1);
const TOP = "matrix(0.9 -0.5 0.9 0.5 6 14)";
const LEFT = "matrix(0.9 0.5 0 1 6 14)";
const RIGHT = "matrix(0.9 -0.5 0 1 24 24)";

/** The skip arrow: an arc over the bottom, its head at the right. */
const SKIP = (() => {
  const pts = arc(24, 30, 17.5, Math.PI * 0.97, Math.PI * 1.82, 20);
  const band = ribbon(
    pts,
    pts.map(() => 5.6),
  );
  const th = Math.PI * 1.82;
  const end = pts[pts.length - 1];
  const tan: Pt = [-Math.sin(th), Math.cos(th)];
  const nor: Pt = [Math.cos(th), Math.sin(th)];
  const head = [
    [end[0] + nor[0] * 7, end[1] + nor[1] * 7],
    [end[0] + tan[0] * 9, end[1] + tan[1] * 9],
    [end[0] - nor[0] * 7, end[1] - nor[1] * 7],
    [end[0] - tan[0] * 1.5, end[1] - tan[1] * 1.5],
  ] as Pt[];
  return { band, head: `M${head.map(fmt).join("L")}Z` };
})();

/** The old owner's cane: a wooden crook in his hand. */
const CANE = ribbon(
  [
    [33.5, 25.5],
    [34.5, 20.5],
    [38.5, 19],
    [41.5, 22.5],
    [41.2, 33],
    [40.8, 44.5],
  ],
  [2.6, 3, 3, 3, 3, 3],
);

/** A dizzy swirl over the drunk's cup: a spiral winding in to (cx,
 *  cy) from radius `r`, as a tapering band. */
const SWIRL = (() => {
  const cx = 15;
  const cy = 12.5;
  const r = 9.5;
  const turns = 1.75;
  const n = 40;
  const pts: Pt[] = Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    const a = Math.PI * 0.9 + s * turns * 2 * Math.PI;
    const k = r * (1 - 0.82 * s);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
  });
  return ribbon(
    pts,
    pts.map((_, i) => 3.6 - (2 * i) / n),
  );
})();

/** Dawn's rays fanned over the horizon. */
const DAWN_RAYS = [-168, -135, -102, -78, -45, -12]
  .map((deg) => {
    const a = (deg * Math.PI) / 180;
    const w = 0.15;
    const p = (r: number, da: number): Pt => [
      24 + Math.cos(a + da) * r,
      31 + Math.sin(a + da) * r,
    ];
    return `M${fmt(p(13, -w))}L${fmt(p(24, 0))}L${fmt(p(13, w))}Z`;
  })
  .join("");

/** A die face's pips, dark, on a square from (x, y), `s` wide. */
const pips = (x: number, y: number, s: number, n: number) => {
  const at = (u: number, v: number) =>
    disc(x + u * s, y + v * s, s * 0.11);
  const spots: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [
      [0.27, 0.27],
      [0.73, 0.73],
    ],
    3: [
      [0.25, 0.25],
      [0.5, 0.5],
      [0.75, 0.75],
    ],
    5: [
      [0.26, 0.26],
      [0.74, 0.26],
      [0.5, 0.5],
      [0.26, 0.74],
      [0.74, 0.74],
    ],
  };
  return spots[n].map(([u, v]) => at(u, v)).join("");
};
const rounded = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** The checkbox's gilt frame, round an ivory field. */
const BOX_FRAME = rounded(5, 5, 38, 38, 6) + rounded(10.5, 10.5, 27, 27, 2.5);

/** A book lying on its side, its spine toward us. */
const book = (
  x: number,
  y: number,
  w: number,
  h: number,
  m: Shade,
): EmblemPart => ({
  d: rounded(x, y, w, h, 1.6),
  m,
  vein: `M${x + 4} ${y + 1}V${y + h - 1}M${x + 6} ${y + 1}V${y + h - 1}M${x + w - 5} ${y + 1}V${y + h - 1}`,
  shine: `M${x + 9} ${y + 2.4}H${x + w - 9}`,
  ink: 1.3,
});

export const EMBLEMS: Record<string, EmblemData> = {
  // ── ticks and marks ───────────────────────────────────────────────
  /** Unticked: an empty ivory field in a gilt frame. */
  "☐": [
    { d: rounded(10, 10, 28, 28, 3), m: "ivory", ink: 0 },
    {
      d: BOX_FRAME,
      evenOdd: true,
      shine: "M7.6 35V11.5Q7.6 7.6 11.5 7.6H30",
    },
  ],
  /** Ticked: the field gone green, a bold white tick leaping out. */
  "☑": [
    { d: rounded(10, 10, 28, 28, 3), m: "leaf", ink: 0 },
    {
      d: BOX_FRAME,
      evenOdd: true,
      shine: "M7.6 35V11.5Q7.6 7.6 11.5 7.6H30",
    },
    {
      d: "M9 25.2L14.6 20.2L22 27.6L38.8 4.4L45 9.2L22.6 38.4Z",
      m: "ivory",
      shine: "M12.4 23.6L14.6 21.8M23 31L38.6 7.8",
      ink: 1.6,
    },
  ],
  /** Poison: a green vial, crossed bones on its belly, corked. */
  "☠": [
    {
      d: "M19.5 3.5H28.5V10H19.5Z",
      m: "wood",
      vein: "M22 5V8.5M26 5V8.5",
      ink: 1.2,
    },
    {
      d: "M20 11H28V17.5C35 19.5 38.5 24.5 38.5 30.5C38.5 38.5 32 44.5 24 44.5C16 44.5 9.5 38.5 9.5 30.5C9.5 24.5 13 19.5 20 17.5Z",
      m: "leaf",
      shine: "M13.6 28Q14.4 23.2 18.8 21",
    },
    { d: "M18.5 9H29.5V12.5H18.5Z", m: "silver", ink: 1.2 },
    {
      d: BONE,
      m: "ivory",
      ink: 1.2 / 0.5,
      t: "translate(24 31) rotate(35) scale(0.5) translate(-24 -24)",
    },
    {
      d: BONE,
      m: "ivory",
      ink: 1.2 / 0.5,
      t: "translate(24 31) rotate(-35) scale(0.5) translate(-24 -24)",
    },
  ],
  /** Accuse: the scales of justice, silver pans on a gold beam. */
  "⚖": [
    { d: "M8 13L3.5 29M8 13L12.5 29M40 13L35.5 29M40 13L44.5 29", ink: 1 },
    {
      d: "M22.4 9.5H25.6V40.5H22.4Z",
      vein: "M24 14V38",
      ink: 1.3,
    },
    {
      d: "M6 11.2H42Q43.6 11.2 43.6 12.8Q43.6 14.4 42 14.4H6Q4.4 14.4 4.4 12.8Q4.4 11.2 6 11.2Z",
      shine: "M7 12.2H21",
      ink: 1.3,
    },
    {
      d: "M1.8 28.5H14.2C14.2 32.4 11.4 35 8 35C4.6 35 1.8 32.4 1.8 28.5Z",
      m: "silver",
      ink: 1.3,
    },
    {
      d: "M33.8 28.5H46.2C46.2 32.4 43.4 35 40 35C36.6 35 33.8 32.4 33.8 28.5Z",
      m: "silver",
      ink: 1.3,
    },
    {
      d: "M14 40H34Q36 40 36 42V44.5H12V42Q12 40 14 40Z",
      shine: "M15 41.6H25",
      ink: 1.3,
    },
    { jewel: "ruby", x: 24, y: 8, r: 3.2 },
  ],
  /** An attack coming: a gilt warning triangle, amber within. */
  "⚠": [
    {
      d: "M24 4.5C25.5 4.5 26.5 5.3 27.3 6.7L44.2 37.5C45.6 40 44 43 41 43H7C4 43 2.4 40 3.8 37.5L20.7 6.7C21.5 5.3 22.5 4.5 24 4.5Z",
      m: "flame",
      shine: "M8.4 37.5L21.5 13.5",
    },
    {
      d: "M24 4.5C25.5 4.5 26.5 5.3 27.3 6.7L44.2 37.5C45.6 40 44 43 41 43H7C4 43 2.4 40 3.8 37.5L20.7 6.7C21.5 5.3 22.5 4.5 24 4.5ZM24 12.5L9.6 38.5H38.4Z",
      evenOdd: true,
      shine: "M6.6 37.5L21.8 9.4",
    },
    {
      dark: "M21.6 17.5H26.4L25.4 29.5H22.6Z" + disc(24, 33.6, 2.4),
    },
  ],
  /** A scream: a crimson exclamation, ringing out in gold. */
  "❗": [
    {
      d: "M5.5 12.5L11.5 15.5L10.5 18L4.5 15ZM4 24.5H10.5V27H4ZM42.5 12.5L36.5 15.5L37.5 18L43.5 15ZM44 24.5H37.5V27H44Z",
      ink: 1.1,
    },
    {
      d: "M24 3.5C28 3.5 30.6 6.4 30.2 10.2L27.6 29.6C27.4 31.2 25.9 32.4 24 32.4C22.1 32.4 20.6 31.2 20.4 29.6L17.8 10.2C17.4 6.4 20 3.5 24 3.5Z",
      m: "crimson",
      shine: "M21 9Q21 6.6 23 6",
    },
    { d: disc(24, 39.5, 5), m: "crimson", shine: "M21.4 38A3 3 0 0 1 23 36.4" },
  ],

  // ── the owner's life ───────────────────────────────────────────────
  /** A hit point left: a crimson heart in a gilt rim. */
  "❤": [
    { d: HEART, shine: "M8 17C8 12 11 9.2 15 9.2" },
    {
      d: HEART,
      m: "crimson",
      ink: 1.2 / 0.76,
      shine: "M10 17C10 13 12.5 10.5 15.5 10.5",
      t: INSET(0.76),
    },
  ],
  /** A hit point lost: the heart gone to cracked iron. */
  "🖤": [
    { d: HEART, m: "silver", shine: "M8 17C8 12 11 9.2 15 9.2" },
    {
      d: HEART,
      m: "iron",
      ink: 1.2 / 0.76,
      t: INSET(0.76),
    },
    {
      d: "M24 11.5L21 18.5L26 23.5L21.5 30L24.5 35.5L22.8 39.5",
      ink: 1.8,
      m: "silver",
    },
  ],

  // ── places and times ──────────────────────────────────────────────
  /** Dawn: the sun lifting out of a night sea, its rays fanned. */
  "🌅": [
    { d: DAWN_RAYS, ink: 1.1 },
    {
      d: `M${arc(24, 31, 11, Math.PI, 2 * Math.PI, 24).map(fmt).join("L")}Z`,
      m: "flame",
      shine: "M15.6 27.4A9 9 0 0 1 20 22.6",
    },
    {
      d: "M3 31H45V40.5Q45 43.5 42 43.5H6Q3 43.5 3 40.5Z",
      m: "night",
      vein: "M10 35.5H20M26 35.5H38M15 39.5H33",
      shine: "M5.4 33.4H14",
    },
  ],
  /** The garden: a leafy sprig. */
  "🌿": [
    {
      d: "M18.8 45.2C20.8 34 23 22 27.6 6.4L29.2 6.9C25 22.4 22.8 34.2 21.2 45.6Z",
      m: "wood",
      ink: 1.1,
    },
    ...(
      [
        [21, 39.5, -62],
        [22.4, 32, 58],
        [23.9, 24.5, -55],
        [25.6, 17, 52],
        [28.2, 7.6, 14],
      ] as const
    ).map(
      ([x, y, r], i): EmblemPart => ({
        d: LEAF(i === 4 ? 12 : 16, i === 4 ? 4.6 : 5.6),
        m: "leaf",
        vein: i === 4 ? "M0 -1.5V-9.5" : "M0 -1.5V-13",
        shine: i % 2 ? undefined : "M-2.6 -4Q-3.2 -8 -1.6 -11",
        ink: 1.2,
        t: `translate(${x} ${y}) rotate(${r})`,
      }),
    ),
  ],
  /** The zhai rule: meat on the bone. */
  "🍖": [
    {
      d: "M14 -2.4H28C28.6 -5.8 33.6 -6.6 34.6 -3.2C35 -1.8 34.2 -0.4 33.2 0C34.2 0.4 35 1.8 34.6 3.2C33.6 6.6 28.6 5.8 28 2.4H14Z",
      m: "ivory",
      shine: "M18 -0.8H27",
      ink: 1.4,
      t: "translate(15.5 15.5) rotate(45)",
    },
    {
      d: "M-13 0C-13 -8.5 -6 -12 1.5 -11.5C9.5 -11 15.5 -5.5 19.5 -2.8V2.8C15.5 5.5 9.5 11 1.5 11.5C-6 12 -13 8.5 -13 0Z",
      m: "wood",
      vein: "M-6 -6Q0 -8.5 7 -6.5M-8 1Q-1 -1.5 9 0.5M-5 7Q2 5 8 6.5",
      shine: "M-10 -2Q-9.5 -7.5 -4.5 -9",
      t: "translate(15.5 15.5) rotate(45)",
    },
  ],
  /** The kitchen: an egg frying in an iron pan. */
  "🍳": [
    {
      d: "M33 18.4H48.5Q51 18.4 51 21Q51 23.6 48.5 23.6H33Z",
      m: "wood",
      vein: "M40 19.5V22.5M43 19.5V22.5",
      ink: 1.3,
      t: "rotate(40 20 21)",
    },
    {
      d: disc(20, 21, 16),
      m: "iron",
      vein: "M33 21A13 13 0 0 1 7 21A13 13 0 0 1 33 21",
      shine: "M7.6 15A13.5 13.5 0 0 1 14 8.4",
    },
    {
      d: "M19 11C23.5 10.4 28.6 12.6 28.6 17.5C31 20.5 29.5 27.5 24.5 28.5C21 31 13.5 30.5 12 26C9 23.5 10 15.5 13.6 14C15 12 16.5 11.4 19 11Z",
      m: "ivory",
      ink: 1.2,
    },
    {
      d: disc(20.5, 20.5, 4.6),
      m: "flame",
      shine: "M18 19.4A2.8 2.8 0 0 1 19.6 17.6",
      ink: 1.2,
    },
  ],
  /** A life: a tankard of beer under its head of foam. */
  "🍺": mug("", 1),
  /** Cheers: two tankards clinking. */
  "🍻": [
    {
      d: disc(24, 6.5, 2.6) + disc(18.6, 8.6, 1.7) + disc(29.4, 8.6, 1.7),
      m: "ivory",
      ink: 1,
    },
    ...mug(
      "translate(14 28.5) rotate(16) scale(-0.72 0.72) translate(-26 -24)",
      0.72,
    ),
    ...mug(
      "translate(34 28.5) rotate(-16) scale(0.72) translate(-26 -24)",
      0.72,
    ),
  ],
  /** A leopard: a die whose pips have turned to a leopard's coat. */
  "🐆": [
    {
      d: "M24 4L42 14L24 24L6 14Z",
      m: "gold",
      shine: "M10 14L24 6.4",
      ink: 1.4,
    },
    { d: "M6 14L24 24V44L6 34Z", m: "flame", ink: 1.4 },
    { d: "M24 24L42 14V34L24 44Z", m: "wood", ink: 1.4 },
    { dark: coat(0.3), t: TOP },
    { dark: coat(1.1), t: LEFT },
    { dark: coat(2.2), t: RIGHT },
  ],
  /** The old owner: a crimson meeple in a top hat, on his cane. */
  "👴": [
    meeple(23, 28.5, 0.86, "crimson"),
    { d: CANE.outline, m: "wood", vein: CANE.shine, ink: 1.3 },
    { d: disc(41, 44, 1.8), m: "silver", ink: 1 },
    {
      d: "M17.6 4.4Q23 3 28.4 4.4L28.8 13.6H17.2Z",
      m: "iron",
      shine: "M19.6 6V12",
      ink: 1.4,
    },
    { d: "M17.4 10.2H28.6V12.6H17.4Z", ink: 1.1 },
    {
      d: "M13.2 13.8Q23 11.6 32.8 13.8Q33.6 16 32 16.2Q23 14.6 14 16.2Q12.4 16 13.2 13.8Z",
      m: "iron",
      ink: 1.3,
    },
  ],
  /** The study: three books stacked, a quill on top. */
  "📚": [
    {
      d: FEATHER(20, 3.6),
      m: "ivory",
      vein: "M0 -1V-18",
      ink: 1.1,
      t: "translate(30 15.5) rotate(28)",
    },
    book(4.5, 34, 38, 10, "crimson"),
    book(8, 24, 34, 10, "night"),
    book(6, 14, 30, 10, "leaf"),
  ],
  /** Camera footage: a tape cassette, its reels behind a window. */
  "📼": [
    {
      d: rounded(3.5, 10, 41, 28, 3),
      m: "iron",
      shine: "M6 13V34",
    },
    {
      d: rounded(8, 13, 32, 7.5, 1.2),
      m: "ivory",
      vein: "M11 16.8H30",
      ink: 1.2,
    },
    {
      d: rounded(11, 23, 26, 11.5, 2),
      m: "night",
      ink: 1.2,
    },
    {
      d: ring(17.5, 28.7, 4.4, 1.5) + ring(30.5, 28.7, 4.4, 1.5),
      m: "silver",
      evenOdd: true,
      vein: "M17.5 24.8V26.8M14.2 30.6L15.8 29.6M20.8 30.6L19.2 29.6M30.5 24.8V26.8M27.2 30.6L28.8 29.6M33.8 30.6L32.2 29.6",
      ink: 1.1,
    },
    { jewel: "ruby", x: 35.6, y: 16.8, r: 2.4 },
  ],
  /** A torch: a silver lamp throwing its beam. */
  "🔦": [
    {
      d: "M30 19.5L44 11.5V36.5L30 28.5Z",
      m: "ivory",
      ink: 0.9,
      t: "rotate(-38 24 24)",
    },
    {
      d: "M3.5 21Q3.5 20 4.5 20H21.5V28H4.5Q3.5 28 3.5 27Z",
      m: "iron",
      vein: "M7 20.5V27.5M9.5 20.5V27.5M12 20.5V27.5",
      shine: "M5 21.6H19",
      t: "rotate(-38 24 24)",
    },
    {
      d: "M21 20L27 16.5H31V31.5H27L21 28Z",
      m: "silver",
      shine: "M23 20.4L27.2 18",
      t: "rotate(-38 24 24)",
    },
    {
      d: "M15 18.4H18.6V20.2H15Z",
      ink: 1,
      t: "rotate(-38 24 24)",
    },
  ],
  /** A knife: a steel blade on a riveted wooden handle. */
  "🔪": [
    {
      d: "M20.5 19.5H47C42 26.5 33.5 30.5 20.5 30.5Z",
      m: "silver",
      vein: "M23 22.4H38",
      shine: "M24 28.4Q34 27.8 41 23",
      t: "translate(24 24) scale(1.08) rotate(-45) translate(-26 -24)",
    },
    {
      d: "M3.5 22Q3.5 20.5 5 20.5H18V29.5H5Q3.5 29.5 3.5 28Z",
      m: "wood",
      shine: "M5.5 22.4H15",
      t: "translate(24 24) scale(1.08) rotate(-45) translate(-26 -24)",
    },
    {
      d: disc(8.4, 25, 1.3) + disc(13.6, 25, 1.3),
      ink: 0.9,
      t: "translate(24 24) scale(1.08) rotate(-45) translate(-26 -24)",
    },
    {
      d: "M17.2 18.5H21.4V31.5H17.2Z",
      ink: 1.2,
      t: "translate(24 24) scale(1.08) rotate(-45) translate(-26 -24)",
    },
  ],
  /** The hall clock: a tall oak case, its pendulum behind glass. */
  "🕰": [
    {
      d: "M10.5 45V40.5H13.5V21H10V10Q24 0 38 10V21H34.5V40.5H37.5V45Z",
      m: "wood",
      vein: "M10 21H38M13.5 40.5H34.5",
      shine: "M12.4 19V11.4",
    },
    { d: rounded(18, 24, 12, 14.5, 1.8), m: "night", ink: 1.2 },
    {
      d: "M23.2 24.5H24.8V32H23.2Z" + disc(24, 33.6, 3.2),
      shine: "M22.4 32.8A1.8 1.8 0 0 1 23.4 31.6",
      ink: 1.1,
    },
    { d: ring(24, 12.6, 8.6, 6.6), evenOdd: true, ink: 1.2 },
    { d: disc(24, 12.6, 6.6), m: "ivory", ink: 0 },
    { dark: "M23.3 7.4H24.7V13.2H23.3ZM24 12L28.2 14.6L27.5 15.7L23.3 13.2Z" },
  ],
  /** The security room: a monitor glowing on its stand. */
  "🖥": [
    {
      d: "M20.5 33H27.5L29 39.5H19Z",
      m: "silver",
      ink: 1.2,
    },
    {
      d: rounded(3.5, 6.5, 41, 28.5, 3),
      m: "iron",
      shine: "M6 9V32",
    },
    {
      d: rounded(7.5, 10, 33, 20, 1.5),
      m: "night",
      vein: "M9 15H39M9 20H39M9 25H39",
      shine: "M11 27L19 13",
      ink: 1.2,
    },
    {
      d: "M13 39H35Q37 39 37 41V43.5H11V41Q11 39 13 39Z",
      m: "silver",
      ink: 1.3,
    },
    { jewel: "emerald", x: 37.8, y: 32.6, r: 1.6 },
  ],
  /** The game over: a stop sign, silver-rimmed, a bar across. */
  "🛑": [
    {
      d: polygon(8, 21, Math.PI / 8),
      m: "silver",
      shine: "M8.6 17.6L17.6 8.6",
    },
    { d: polygon(8, 17, Math.PI / 8), m: "crimson", ink: 1.2 },
    {
      d: "M12.5 21H35.5V27H12.5Z",
      m: "ivory",
      shine: "M14.4 22.6H26",
      ink: 1.2,
    },
  ],
  /** The butler: a meeple in black tails, white front, bow tie. */
  "🤵": [
    {
      d: "M16.5 25L7 44L15.5 40.5ZM31.5 25L41 44L32.5 40.5Z",
      m: "iron",
      ink: 1.2,
    },
    meeple(24, 25, 1, "iron"),
    {
      d: "M20.6 18.8L27.4 18.8L24 31.5Z",
      m: "ivory",
      ink: 1.1,
    },
    {
      d: "M24 19.6L18.6 16.6V22.6ZM24 19.6L29.4 16.6V22.6Z",
      m: "crimson",
      ink: 1.1,
    },
    { d: disc(24, 19.6, 1.6), m: "crimson", ink: 1 },
  ],
  /** Skip: an arrow leaping over a meeple. */
  "🤷": [
    meeple(24, 34.5, 0.56, "ivory", 1.3),
    {
      d: SKIP.band.outline,
      vein: SKIP.band.grooves,
      shine: SKIP.band.shine,
      ink: 1.3,
    },
    { d: SKIP.head, ink: 1.3 },
  ],
  /** Show your dice: the cup lifted off a pair of dice. */
  "🥤": [
    {
      d: rounded(4, 29, 15, 15, 2.5),
      m: "ivory",
      ink: 1.3,
    },
    { dark: pips(4, 29, 15, 5) },
    {
      d: rounded(19.5, 31.5, 12.5, 12.5, 2.2),
      m: "ivory",
      ink: 1.3,
      t: "rotate(12 25.75 37.75)",
    },
    { dark: pips(19.5, 31.5, 12.5, 3), t: "rotate(12 25.75 37.75)" },
    {
      dark: "M13.5 26.5Q24 31.5 34.5 26.5Q24 23.5 13.5 26.5Z",
      t: "translate(1 -2) rotate(20 30 15)",
    },
    {
      d: "M15 5.5Q24 3 33 5.5L35 25H13Z",
      m: "wood",
      vein: "M19.5 13V22.5M24 12.4V22.5M28.5 13V22.5",
      shine: "M16.6 22L17.6 12",
      t: "translate(1 -2) rotate(20 30 15)",
    },
    {
      d: "M14.6 6.5Q24 4 33.4 6.5L33.8 10.5Q24 8 14.2 10.5Z",
      ink: 1.2,
      t: "translate(1 -2) rotate(20 30 15)",
    },
    {
      d: "M13.5 23.5Q24 21.5 34.5 23.5L35.5 26.5Q24 24.5 12.5 26.5Z",
      ink: 1.2,
      t: "translate(1 -2) rotate(20 30 15)",
    },
  ],
  /** Drunk and out: a tankard keeling over, the room spinning. */
  "🥴": [
    { d: SWIRL.outline, m: "silver", shine: SWIRL.shine, ink: 1.2 },
    { d: disc(33, 6.5, 1.8) + disc(38.5, 9.5, 1.2), m: "ivory", ink: 1 },
    ...mug("translate(28 30) rotate(-24) scale(0.74) translate(-26 -24)", 0.74),
  ],
  /** A suitcase: crimson leather, strapped, gilt corners. */
  "🧳": [
    {
      d: "M18 15V10Q18 7 21 7H27Q30 7 30 10V15H27V10.5H21V15Z",
      ink: 1.3,
    },
    {
      d: rounded(4, 14, 40, 29, 3.5),
      m: "crimson",
      shine: "M6.6 17.5V39.5",
    },
    {
      d: "M12.5 14H17V43H12.5ZM31 14H35.5V43H31Z",
      m: "wood",
      vein: "M14.75 16V41M33.25 16V41",
      ink: 1.2,
    },
    {
      d: "M4 20V17.5Q4 14 7.5 14H10V16.5H7.5Q6.5 16.5 6.5 17.5V20ZM44 20V17.5Q44 14 40.5 14H38V16.5H40.5Q41.5 16.5 41.5 17.5V20ZM4 37V39.5Q4 43 7.5 43H10V40.5H7.5Q6.5 40.5 6.5 39.5V37ZM44 37V39.5Q44 43 40.5 43H38V40.5H40.5Q41.5 40.5 41.5 39.5V37Z",
      ink: 1,
    },
    {
      d: "M11.8 26H17.7V30.5H11.8ZM30.3 26H36.2V30.5H30.3Z",
      ink: 1.1,
    },
  ],
  /** Split: an axe, a steel head on an oak haft. */
  "🪓": [
    {
      d: "M21.6 6H26.4L27.4 43.5Q27.4 45.5 25.4 45.5H22.6Q20.6 45.5 20.6 43.5Z",
      m: "wood",
      vein: "M24 24V43",
      shine: "M22.4 26V43",
      t: "rotate(-12 24 26)",
    },
    {
      d: "M16.5 7.5H21V18H16.5Q15 18 15 16.5V9Q15 7.5 16.5 7.5Z",
      m: "iron",
      ink: 1.3,
      t: "rotate(-12 24 26)",
    },
    {
      d: "M20.5 6H30C34 6 38.5 3.5 42.5 2C45 8.5 45 18 42.5 24.5C38.5 22.5 34 19.5 30 19.5H20.5Z",
      m: "silver",
      vein: "M39.6 4.6Q42 13 39.6 21.8",
      shine: "M23 8.4H30",
      t: "rotate(-12 24 26)",
    },
    {
      d: "M20 5H28V20.5H20Z",
      ink: 1.2,
      vein: "M20 9H28M20 16.5H28",
      t: "rotate(-12 24 26)",
    },
  ],
  /** Hiding: a ghost of a meeple, only its dotted edge left. */
  "🫥": [
    {
      d: MEEPLE,
      m: "night",
      ink: 0,
      t: "translate(24 24.5) scale(0.8) translate(-24 -24)",
    },
    { d: dottedMeeple(4.2, 1.7), m: "ivory", ink: 0.9 },
  ],
  /** An empty cup slot: a dull iron tankard, nothing in it. */
  "▫": [
    {
      d: MUG_HANDLE,
      m: "iron",
      ink: 1.3,
    },
    {
      d: "M10 15H32V40Q32 43 29 43H13Q10 43 10 40Z",
      m: "iron",
      vein: "M16 21V39M21 21V39M26 21V39",
    },
    { dark: "M12 15.4Q21 19.4 30 15.4Q21 12.6 12 15.4Z" },
    {
      d: "M10 15H32",
      ink: 1.4,
      m: "iron",
    },
  ],
};

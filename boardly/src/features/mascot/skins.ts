// The mascot's skin: the glossy game piece in any colour (free), or a
// set — a whole new body, like a gingerbread cookie — bought with coins.
// Faces and clothes go on top of either.

import type { EmblemPart } from "@/components/engraved/emblem";
import { acanthus, shade, type Pt } from "@/components/engraved/shapes";
import { BODY, both, ell, shadeOver, type Hex } from "./rig";

export interface SkinDef {
  name: string;
  price: number;
  /** The body (in body units), coloured `colour` where the skin takes a
   *  colour at all. */
  draw: (colour: string) => EmblemPart[];
}

/** The floor under the feet. */
const GROUND: EmblemPart = { d: ell(50, 100, 31, 4.2), m: "#000000", ink: 0, op: 0.22 };

/** The side away from the light: the right arm and leg. */
const FAR_SIDE =
  "M66 40C75.2 41.4 85.6 44.8 87.6 51.2C89.4 57.8 82 61 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2L81.4 88.4C83.4 94 80.4 98.4 74.4 98.4H66C71 97 73.6 93.6 71.8 88.4L63 63C68 58 69 48 66 40Z";
/** A gloss along the top of the left arm. */
const ARM_GLOSS = "M17.2 50C19.4 46.6 25 44.6 30.8 43.4C25.6 45.4 21.4 47.6 19.4 51.4Z";

/** The glossy piece: a wooden meeple's thickness, lit like something
 *  round, with a gloss on the head and arm. */
function glossy(colour: string): EmblemPart[] {
  return [
    GROUND,
    { d: BODY, m: shade(colour, -0.42) as Hex, ink: 1.4, t: "translate(1.8 2.6)" },
    { d: BODY, m: colour as Hex, ink: 1.4, round: true },
    shadeOver(FAR_SIDE, shade(colour, -0.45), 0.22),
    { d: ell(41, 17.6, 6.4, 3.2), m: "ivory", ink: 0, op: 0.6, t: "rotate(-32 41 17.6)" },
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.5),
  ];
}

// ── shared by the sets ───────────────────────────────────────────────

/** The body's thickness: a darker copy, set back and down. */
const SIDE = "translate(1.6 2.4)";
/** A copy shrunk about the middle, for a rim darker (or lighter) than
 *  the middle. */
const INNER = "translate(50 54) scale(0.88) translate(-50 -54)";

/** The usual start of a set: the floor, the thickness, the body. */
const slab = (side: string, fill: string, ink = 1.3): EmblemPart[] => [
  GROUND,
  { d: BODY, m: side as Hex, ink, t: SIDE },
  { d: BODY, m: fill as Hex, ink },
];

/** The silhouette as a polygon, for keeping markings inside it. */
const OUTLINE: Pt[] = (() => {
  const out: Pt[] = [];
  let p: Pt = [0, 0];
  for (const [, c, a] of BODY.matchAll(/([MCLHZ])([^MCLHZ]*)/g)) {
    const n = (a.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (c === "M" || c === "L") p = [n[0], n[1]];
    else if (c === "H") p = [n[0], p[1]];
    else if (c === "C") {
      const [x1, y1, x2, y2, x, y] = n;
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const u = 1 - t;
        out.push([
          u * u * u * p[0] + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
          u * u * u * p[1] + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
        ]);
      }
      p = [x, y];
    } else continue;
    out.push(p);
  }
  return out;
})();

/** Where faces go: markings stay out of it. */
const inFace = (x: number, y: number) => x > 35 && x < 65 && y > 19 && y < 40;

/** Inside the body, at least `margin` from its edge (and off the face). */
function inside(x: number, y: number, margin = 1.5) {
  if (inFace(x, y)) return false;
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [ax, ay] = OUTLINE[i];
    const [bx, by] = OUTLINE[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) hit = !hit;
    const l = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l));
    if (Math.hypot(x - ax - k * (bx - ax), y - ay - k * (by - ay)) < margin) return false;
  }
  return hit;
}

/** A repeatable run of random numbers. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` specks strewn over the body: [x, y, size]. `where` narrows it. */
function strew(
  seed: number,
  n: number,
  size: [number, number],
  margin = 2,
  where: (x: number, y: number) => boolean = () => true,
): [number, number, number][] {
  const r = rng(seed);
  const out: [number, number, number][] = [];
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const x = 12 + r() * 76;
    const y = 8 + r() * 90;
    const s = size[0] + r() * (size[1] - size[0]);
    if (inside(x, y, margin + s) && where(x, y)) out.push([x, y, s]);
  }
  return out;
}

const dots = (at: [number, number, number][]) =>
  at.map(([x, y, r]) => ell(x, y, r, r * 0.8)).join("");

/** A line traced through `points`, kept to the parts inside the body. */
function within(points: Pt[], margin = 1.6) {
  let d = "";
  let open = false;
  for (const [x, y] of points) {
    if (inside(x, y, margin)) {
      d += `${open ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
      open = true;
    } else open = false;
  }
  return d;
}

/** A four-pointed twinkle. */
const twinkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

// ── gingerbread ──────────────────────────────────────────────────────

/** Flecks of spice in the dough, and specks of sugar: [x, y, size]. */
const SPICE: [number, number, number][] = [
  [61.5, 15.4, 0.66], [39.8, 14.2, 0.65], [44.3, 82.6, 0.5], [34, 21.8, 0.5], [35.4, 81.6, 0.52],
  [56.2, 65.9, 0.6], [53.6, 14.6, 0.47], [27.7, 69.6, 0.62], [35.9, 61.1, 0.63], [65.1, 30.7, 0.68],
  [51.9, 86.9, 0.74], [33.9, 96.2, 0.5], [43.8, 76.4, 0.51], [49.2, 12.5, 0.72], [70.1, 60, 0.8],
  [35.8, 70.9, 0.69], [56.1, 49.6, 0.79], [83.8, 51.2, 0.72], [41.3, 68.5, 0.46], [30.8, 43.8, 0.8],
  [18.1, 49, 0.67], [43.6, 40.9, 0.8], [29.7, 52.2, 0.69], [64.5, 54.9, 0.7], [41.8, 44.5, 0.49],
  [38.4, 41.4, 0.5], [47.4, 52.1, 0.48], [23.1, 57.3, 0.46], [24.7, 77.7, 0.66], [29, 81.2, 0.84],
  [76.8, 80.7, 0.78], [51.3, 40.6, 0.46], [31.7, 70.6, 0.83], [48.4, 67.1, 0.77], [69, 51.5, 0.52],
  [72.9, 95.5, 0.61], [42.5, 93.3, 0.74], [23.5, 89.5, 0.77], [23.1, 82.6, 0.84], [62, 40.2, 0.67],
  [45, 86.6, 0.78], [34.3, 30.4, 0.68], [38.9, 49.8, 0.68], [52.4, 55.6, 0.46], [25.1, 51.1, 0.74],
  [33, 77.7, 0.65],
];
const SUGAR: [number, number, number][] = [
  [54.7, 76.6, 0.67], [45.7, 63.5, 0.55], [50.9, 70.7, 0.54], [52.5, 51.5, 0.68], [65.1, 87, 0.68],
  [31.7, 58.8, 0.68], [21.2, 48.3, 0.42], [62.9, 78.8, 0.67], [28.7, 93.8, 0.52], [44.8, 54.9, 0.5],
  [54.1, 48.2, 0.41], [37.2, 64.5, 0.55], [71.9, 95.5, 0.43], [44.3, 15.4, 0.68], [60.2, 80.3, 0.43],
  [77.6, 49.4, 0.5],
];

/** Piped icing: zigzags at the wrists and ankles. */
const ICING_TRIM =
  "M21.4 45.2L24 47.6L21 50L24 52.4L21 54.8L24 57.2L21.6 59.4" +
  "M78.6 45.2L76 47.6L79 50L76 52.4L79 54.8L76 57.2L78.4 59.4" +
  "M21.4 90.6L24.6 88.4L27.8 90.6L31 88.4L34.2 90.6L37.4 88.4L40.6 90.6L43.4 88.8" +
  "M78.6 90.6L75.4 88.4L72.2 90.6L69 88.4L65.8 90.6L62.6 88.4L59.4 90.6L56.6 88.8";
const ICING = "#FFF8EE";

function gingerbread(): EmblemPart[] {
  const dough = "#B8743A";
  return [
    GROUND,
    { d: BODY, m: shade(dough, -0.4) as Hex, ink: 1.3, t: SIDE },
    { d: BODY, m: shade(dough, -0.16) as Hex, ink: 1.3 },
    { d: BODY, m: shade(dough, 0.1) as Hex, ink: 0, round: true, op: 0.9, t: INNER },
    shadeOver(dots(SPICE), shade(dough, -0.55), 0.55),
    shadeOver(dots(SUGAR), shade(dough, 0.5), 0.7),
    { line: ICING_TRIM, color: shade(dough, -0.5), w: 1.7, op: 0.35, t: "translate(0.5 0.9)" },
    { line: ICING_TRIM, color: ICING, w: 1.7 },
    { jewel: "ruby", x: 50, y: 50.4, r: 2.6 },
    { jewel: "emerald", x: 50, y: 60.4, r: 2.6 },
  ];
}

// ── mochi ────────────────────────────────────────────────────────────

const POWDER = dots(strew(11, 90, [0.3, 0.7], 1.2));

/** Flour settled on the top of the head, the arms and the toes. */
const DUSTING =
  ell(44, 13.6, 8, 3.4) +
  "M15.4 49.2C18.6 45.6 25.6 43.6 31.4 42.8C27.6 45 22.4 46.4 19 49.8C17.6 51 15.8 50.8 15.4 49.2Z" +
  "M84.6 49.2C81.4 45.6 74.4 43.6 68.6 42.8C72.4 45 77.6 46.4 81 49.8C82.4 51 84.2 50.8 84.6 49.2Z";

/** A five-petalled blossom, for the mochi's head. */
function blossom(x: number, y: number, r: number, pink: string): EmblemPart[] {
  const petals = [0, 72, 144, 216, 288]
    .map((a) => {
      const t = ((a - 90) * Math.PI) / 180;
      return ell(x + Math.cos(t) * r * 0.62, y + Math.sin(t) * r * 0.62, r * 0.46, r * 0.46);
    })
    .join("");
  return [
    { d: petals, m: pink as Hex, ink: 0.6 },
    { d: ell(x, y, r * 0.24, r * 0.24), m: "#FFE27A", ink: 0.4 },
  ];
}

/** A soft rice cake, dusted with flour; tinted by the colour, so a pale
 *  peach, matcha or black-sesame mochi. */
function mochi(colour: string): EmblemPart[] {
  const rice = shade(colour, 0.72);
  const blush = "#F7A0B4";
  return [
    ...slab(shade(colour, 0.45), shade(rice, -0.05), 1.1),
    { d: BODY, m: shade(rice, 0.55) as Hex, ink: 0, round: true, op: 0.85, t: INNER },
    shadeOver(`${ell(15.6, 53.4, 3.6, 3)}${ell(84.4, 53.4, 3.6, 3)}`, blush, 0.45),
    shadeOver(`${ell(31.6, 90.4, 6, 3.2)}${ell(68.4, 90.4, 6, 3.2)}`, blush, 0.32),
    shadeOver(DUSTING, "#FFFFFF", 0.6),
    shadeOver(POWDER, "#FFFFFF", 0.9),
    ...blossom(63.4, 13, 6.6, shade("#F27AB0", 0.25)),
  ];
}

// ── robot ────────────────────────────────────────────────────────────

/** Brushed metal: fine strokes across the plates. */
const BRUSHED = Array.from({ length: 44 }, (_, i) => {
  const y = 9 + i * 2.05;
  const r = rng(300 + i);
  return within(
    Array.from({ length: 40 }, (_, k): Pt => [12 + k * 2, y + (r() - 0.5) * 0.2]),
    1.4,
  );
}).join("");

const SEAMS =
  "M35.2 41.6C42 43.8 58 43.8 64.8 41.6" + // the neck
  "M30.4 42.8C29.2 48.6 29.4 55.6 30.6 61.4" + // the shoulders
  "M69.6 42.8C70.8 48.6 70.6 55.6 69.4 61.4" +
  "M28.4 65C40 67.6 60 67.6 71.6 65" + // the waist
  "M50 67.6V82" + // between the legs
  "M24.4 80.6C28.8 81.6 34.6 81.6 39 80.6M61 80.6C65.4 81.6 71.2 81.6 75.6 80.6" + // the knees
  "M37.4 15.4C44 12.6 56 12.6 62.6 15.4"; // the crown plate
const RIVETS: Pt[] = [
  [38, 45.4], [62, 45.4], [33.2, 48], [33.2, 58], [66.8, 48], [66.8, 58],
  [33.4, 68.4], [66.6, 68.4], [26.8, 84.4], [36.6, 84.4], [63.4, 84.4], [73.2, 84.4],
  [39.6, 17.4], [60.4, 17.4], [17.4, 53.6], [82.6, 53.6],
];

function robot(): EmblemPart[] {
  const steel = "#B8C2CE";
  return [
    // the antenna, behind the head
    { line: "M50 9V1.6", color: "#4A5462", w: 1.6 },
    ...slab(shade(steel, -0.48), steel, 1.3),
    { d: BODY, m: "silver", ink: 0, round: true, op: 0.75, t: INNER },
    { line: BRUSHED, color: "#FFFFFF", w: 0.3, op: 0.35 },
    { line: SEAMS, color: "#FFFFFF", w: 0.7, op: 0.7, t: "translate(0.5 0.6)" },
    { line: SEAMS, color: "#4A5462", w: 0.8 },
    // the ear bolts
    ...both({ d: ell(30, 28.4, 2.6, 4.2), m: "iron", ink: 0.9 }),
    ...both({ d: ell(29.6, 27.6, 1, 1.8), m: "silver", ink: 0 }),
    // the chest plate and its light
    {
      d: "M42.4 46.6H57.6Q59.6 46.6 59.6 48.6V58.8Q59.6 60.8 57.6 60.8H42.4Q40.4 60.8 40.4 58.8V48.6Q40.4 46.6 42.4 46.6Z",
      m: "iron",
      ink: 0.9,
      shine: "M42.6 47.8H57",
      sw: 0.5,
    },
    shadeOver(ell(50, 52.4, 5.4, 5.4), "#6AE4FF", 0.35),
    { jewel: "sapphire", x: 50, y: 52.4, r: 3.1 },
    { line: "M44.4 57.6H55.6M44.4 59.2H55.6", color: "#1E242C", w: 0.6 },
    ...RIVETS.map(([x, y]): EmblemPart => ({ d: ell(x, y, 0.95, 0.95), m: "silver", ink: 0.45, round: true })),
    // a shine down the lit side
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.7),
    shadeOver(ell(41, 13.6, 4.4, 1.6), "#FFFFFF", 0.6),
    { jewel: "ruby", x: 50, y: 1.6, r: 2.1 },
  ];
}

// ── golden statue ────────────────────────────────────────────────────

/** Scrollwork engraved across the chest, either side of the gem. */
const SCROLL = acanthus(50, 52, 2.8, 24, 3.8, 3.4, true);

function statue(): EmblemPart[] {
  return [
    ...slab("#6A4810", "#E2B04A", 1.3),
    { d: BODY, m: "gold", ink: 0, round: true, op: 0.9, t: INNER },
    shadeOver(FAR_SIDE, "#6A4810", 0.28),
    // fluting down the legs, cut and catching the light
    {
      line: "M31.4 69L25.4 88M36.6 69.6L33.4 90M68.6 69L74.6 88M63.4 69.6L66.6 90",
      color: "#9A6B1E",
      w: 0.7,
      op: 0.8,
    },
    {
      line: "M31.9 69.2L25.9 88.2M37.1 69.8L33.9 90.2M69.1 69.2L75.1 88.2M63.9 69.8L67.1 90.2",
      color: "#FFF2B8",
      w: 0.5,
      op: 0.8,
    },
    ...SCROLL.flatMap((s) => both({ d: s.outline, m: "gold", vein: s.vein, ink: 0.7, vw: 0.5 })),
    // a girdle at the waist
    {
      d: "M28.6 63.2C40 66.4 60 66.4 71.4 63.2L72.2 66C60 69.4 40 69.4 27.8 66Z",
      m: "gold",
      ink: 0.8,
      vein: "M30 65C40 67.6 60 67.6 70 65",
      vw: 0.5,
    },
    { jewel: "ruby", x: 50, y: 51.6, r: 3.3 },
    // the polish
    { d: ell(41, 16.8, 6.2, 2.6), m: "#FFFFFF", ink: 0, op: 0.7, t: "rotate(-32 41 16.8)" },
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.8),
    shadeOver("M22.6 87C24.4 81 26.4 75.6 28.8 70.4C27.4 75.8 25.8 81.4 24.4 87.6Z", "#FFFFFF", 0.6),
  ];
}

// ── galaxy ───────────────────────────────────────────────────────────

const STARDUST = strew(23, 46, [0.22, 0.6], 1.4);
const TWINKLES: [number, number, number][] = [
  [24, 50.4, 2.6], [61.4, 49, 2], [39.4, 87.6, 2.2], [70.6, 80, 2.8], [58.6, 13.4, 2.2], [36.4, 61.4, 1.6],
  [81.6, 53, 1.6],
];

/** Faint clouds of gas: [x, y, rx, ry, colour]. */
const NEBULA: [number, number, number, number, string][] = [
  [31, 78, 6, 9, "#3AC4D0"], [35, 70, 6, 5, "#3AC4D0"], [27.4, 87, 4.4, 5, "#7AE0E8"],
  [75, 52.4, 8, 4.4, "#E06AB0"], [69.6, 56, 5, 4, "#E06AB0"], [64.6, 86, 4.4, 6, "#8A5AD0"],
];

function galaxy(): EmblemPart[] {
  const sky = "#1C2152";
  return [
    ...slab(shade(sky, -0.5), shade(sky, -0.15), 1.3),
    { d: BODY, m: shade(sky, 0.12) as Hex, ink: 0, round: true, op: 0.9, t: INNER },
    // the milky way, slung from the left hand to the right foot
    {
      d: "M14 51.2C22 50.4 30 51 37 53.6C45 56.6 50.4 60.6 56.4 66.6C62.4 72.6 66.6 80 71.6 92.8C68.8 94 66 94.4 63.2 93.8C59.4 82.6 55.4 75.4 50.2 70C44.8 64.6 40 61.4 33.8 59.6C27.6 57.8 20.4 57.6 15.2 57.8C13 56 12.6 53 14 51.2Z",
      m: "#7A5AC8",
      ink: 0,
      op: 0.38,
    },
    { line: "M18 54.4C26 54 33 55.4 39.6 58.2C46.4 61.2 51.6 65.8 56.6 71.6C61 76.8 64.4 83.8 67.4 92", color: "#F2A8E8", w: 2.6, op: 0.35 },
    { line: "M20 54.8C27 54.6 33.4 55.8 39.4 58.4C46 61.4 51 65.8 55.8 71.4C60 76.4 63.4 83 66.2 91", color: "#FFFFFF", w: 0.8, op: 0.45 },
    // each cloud in soft steps, so it fades out at the edge
    ...NEBULA.flatMap(([x, y, rx, ry, c]) =>
      [1, 0.72, 0.44].map((k) => shadeOver(ell(x, y, rx * k, ry * k), c, 0.07)),
    ),
    shadeOver(ell(42, 14, 6.4, 3.4), "#B08AF0", 0.3),
    shadeOver(dots(STARDUST), "#FFFFFF", 0.85),
    // a ringed planet on the chest
    { d: ell(43.6, 47.6, 2.6, 2.6), m: "#F2B85A", ink: 0.5, round: true },
    { line: "M39.4 48.8C41.6 47.4 46.4 45.8 47.8 46.4", color: "#FFE6B8", w: 0.6 },
    ...TWINKLES.map(([x, y, r]): EmblemPart => ({ d: twinkle(x, y, r), m: "#FFFFFF", ink: 0, op: 0.95 })),
    shadeOver(ARM_GLOSS, "#9AB8E8", 0.5),
  ];
}

// ── ice ──────────────────────────────────────────────────────────────

/** The cut faces: light and dark planes across the body. */
const FACETS_LIGHT =
  "M34.2 42L50 47.2L41.4 56.6Z" +
  "M50 47.2L65.8 42L66.4 52.4Z" +
  "M50 64.8L58.6 56.6L69.6 62.6Z" +
  "M28.4 66.4L39 67.2L30.4 82.6Z" +
  "M61 67.2L71.6 66.4L77 82Z" +
  "M14.2 51.4L25 46.2L22.4 58.4Z" +
  "M41.4 10.6L50 9.4L45.4 18.4Z";
const FACETS_DARK =
  "M41.4 56.6L50 47.2L58.6 56.6L50 64.8Z" +
  "M66.4 52.4L86.4 52.6L73.4 61.2Z" +
  "M39 67.2L47 70L42 89.6L30.4 82.6Z" +
  "M61 67.2L77 82L66.8 90.4Z" +
  "M50 9.4L61.6 12.2L54.4 18.2Z";
const FACET_EDGES =
  "M34.2 42L50 47.2L65.8 42M50 47.2L41.4 56.6L50 64.8L58.6 56.6L50 47.2M41.4 56.6L30.4 61.6M58.6 56.6L69.6 62.6" +
  "M50 64.8V82M39 67.2L30.4 82.6L42 89.6M61 67.2L77 82L66.8 90.4M25 46.2L22.4 58.4M75 46.2L73.4 61.2" +
  "M41.4 10.6L45.4 18.4L54.4 18.2L61.6 12.2";
/** Frost, gathered at the hands, the feet and the crown. */
const FROST = strew(41, 54, [0.25, 0.6], 1.3, (x, y) => Math.abs(x - 50) > 22 || y > 82 || y < 18);

function ice(): EmblemPart[] {
  const ice = "#BFE6F7";
  return [
    ...slab("#5E9EC4", shade(ice, 0.45), 1.2),
    // the rim frosted, the heart of it clear and deeper
    { d: BODY, m: "#8CCCEC", ink: 0, round: true, op: 0.6, t: INNER },
    shadeOver(FACETS_DARK, "#4A90C0", 0.22),
    shadeOver(FACETS_LIGHT, "#FFFFFF", 0.4),
    { line: FACET_EDGES, color: "#FFFFFF", w: 0.55, op: 0.75 },
    // translucent highlights
    shadeOver("M31.4 31C30 22 35 13.6 43.4 10.6C37.6 15 34.4 22 34.6 30.4Z", "#FFFFFF", 0.75),
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.85),
    shadeOver("M21.6 88C23.6 82 25.6 76.6 28 71.4C26.6 76.8 25 82.4 23.6 88.6Z", "#FFFFFF", 0.7),
    shadeOver(dots(FROST), "#FFFFFF", 0.95),
    ...[[23.4, 91.4, 2.4], [78.6, 47.8, 2.2], [64.6, 14.6, 2]].map(
      ([x, y, r]): EmblemPart => ({ d: twinkle(x, y, r), m: "#FFFFFF", ink: 0 }),
    ),
  ];
}

// ── lava ─────────────────────────────────────────────────────────────

/** The cracks, where the fire shows through. */
const CRACKS =
  "M50 43.6L48.2 48.6L52 52.6L48.8 57.6L51.2 62.6L49.4 68L50.6 74" +
  "M48.2 48.6L42.4 50.2L38.4 47.4L35.4 48.6" +
  "M52 52.6L57.8 54.6L62.4 51.4L67.2 53.4" +
  "M31.6 46L27 50.4L21.6 49.2L16.6 52.8" +
  "M27 50.4L28.4 56" +
  "M69 47.4L73.4 51.6L78.6 50.4L83.4 53.6" +
  "M36.2 66.6L33.4 72.6L35.6 77.6L30.4 83.6L27.4 91.4" +
  "M35.6 77.6L40.6 81.4" +
  "M63.2 67.4L66.2 73.6L63.6 79.4L68.4 85.6L71 93" +
  "M44.2 9.4L46 13.6L42.8 17.4" +
  "M68.6 24L66 28.4L68 32.4";
const ASH = strew(57, 34, [0.3, 0.8], 1.6);
const EMBERS = strew(58, 14, [0.3, 0.6], 2.4);

function lava(): EmblemPart[] {
  const rock = "#3E2C28";
  return [
    ...slab(shade(rock, -0.5), shade(rock, -0.1), 1.3),
    { d: BODY, m: shade(rock, 0.14) as Hex, ink: 0, round: true, op: 0.9, t: INNER },
    // the soles, glowing where they meet the ground
    shadeOver(
      "M19.6 92.6C21 96.4 23 97.6 25.6 97.6H39.4C41.8 97.6 43.4 96.4 44.4 94.4L41 93C34 94.4 26 94 19.6 92.6Z" +
        "M80.4 92.6C79 96.4 77 97.6 74.4 97.6H60.6C58.2 97.6 56.6 96.4 55.6 94.4L59 93C66 94.4 74 94 80.4 92.6Z",
      "#FF6A1A",
      0.55,
    ),
    shadeOver(dots(ASH), shade(rock, -0.45), 0.7),
    { line: CRACKS, color: "#FF4A10", w: 3.4, op: 0.35 },
    { line: CRACKS, color: "#FF8A1A", w: 1.5 },
    { line: CRACKS, color: "#FFE27A", w: 0.55 },
    shadeOver(dots(EMBERS), "#FFB23A", 0.85),
    shadeOver(ell(41, 16.4, 5.4, 2.2), "#FFFFFF", 0.14),
  ];
}

// ── panda onesie ─────────────────────────────────────────────────────

/** The white of the suit: the hood and the body, down to the hem. The
 *  sleeves and legs are left black. */
const SUIT =
  "M34.2 40C31.4 36.8 29.6 32.6 29.6 27.4C29.6 16.6 38 8 50 8C62 8 70.4 16.6 70.4 27.4C70.4 32.6 68.6 36.8 65.8 40" +
  "C69.4 45.6 71.6 53.4 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2" +
  "C64 69.4 36 69.4 27.8 64.2C28.2 63.2 27.8 62.2 26.6 62C28.4 53.4 30.6 45.6 34.2 40Z";

function panda(): EmblemPart[] {
  const fur = "#2C2C36";
  const white = "#F4F2EE";
  const ear = (x: number): EmblemPart[] => [
    { d: ell(x, 12.4, 6.2, 6), m: shade(fur, -0.5) as Hex, ink: 1.2, t: SIDE },
    { d: ell(x, 12.4, 6.2, 6), m: fur as Hex, ink: 1.2, round: true },
    { d: ell(x + (x < 50 ? 0.6 : -0.6), 13.2, 3, 2.8), m: "#5A5462", ink: 0 },
  ];
  return [
    GROUND,
    ...ear(33.6),
    ...ear(66.4),
    { d: BODY, m: shade(fur, -0.5) as Hex, ink: 1.3, t: SIDE },
    { d: BODY, m: fur as Hex, ink: 1.3, round: true },
    { d: SUIT, m: white as Hex, ink: 1, round: true },
    // the hood's opening, stitched round the face
    { line: ell(50, 28.6, 17.2, 14.8), color: "#C8C2B8", w: 0.8 },
    // the tummy patch
    { d: ell(50, 54.6, 8.6, 7.6), m: "#F8E8D2", ink: 0.7, round: true },
    { line: ell(50, 54.6, 7, 6), color: "#D8C4A6", w: 0.45 },
    // paw pads on the soles and palms
    ...both({ d: ell(15.6, 54, 2.4, 2.8), m: "#F2A8B8", ink: 0.5 }),
    ...both({ d: ell(32.4, 93.4, 3.6, 2), m: "#F2A8B8", ink: 0.5 }),
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.3),
    shadeOver(ell(41, 14.6, 5.4, 2.4), "#FFFFFF", 0.7),
  ];
}

// ── wooden piece ─────────────────────────────────────────────────────

/** The knot the grain flows round. */
const KNOT: Pt = [62.4, 72.6];
/** Grain running head to foot, bending round the knot. */
const GRAIN = Array.from({ length: 26 }, (_, i) => {
  const x0 = 13 + i * 3;
  return within(
    Array.from({ length: 92 }, (_, k): Pt => {
      const y = 8 + k;
      const dx = x0 - KNOT[0];
      const bend = 3.6 * Math.sign(dx || 1) * Math.exp(-((y - KNOT[1]) ** 2) / 60) * Math.exp(-Math.abs(dx) / 7);
      return [x0 + 0.7 * Math.sin(y / 9 + i * 1.3) + bend, y];
    }),
    1.4,
  );
}).join("");

function wood(): EmblemPart[] {
  const maple = "#C88A4E";
  return [
    ...slab(shade(maple, -0.45), shade(maple, -0.08), 1.3),
    { d: BODY, m: shade(maple, 0.12) as Hex, ink: 0, round: true, op: 0.85, t: INNER },
    { line: GRAIN, color: shade(maple, -0.4), w: 0.45, op: 0.55 },
    { d: ell(KNOT[0], KNOT[1], 2.4, 1.6), m: shade(maple, -0.35) as Hex, ink: 0.5 },
    { line: ell(KNOT[0], KNOT[1], 3.6, 2.6), color: shade(maple, -0.4), w: 0.45, op: 0.7 },
    // a lacquer gloss
    { d: ell(41, 17.6, 6.4, 3.2), m: "ivory", ink: 0, op: 0.5, t: "rotate(-32 41 17.6)" },
    shadeOver(ARM_GLOSS, "#FFFFFF", 0.45),
  ];
}

export const SKINS: Record<string, SkinDef> = {
  glossy: { name: "Game piece", price: 0, draw: glossy },
  wood: { name: "Carved wood", price: 2000, draw: wood },
  mochi: { name: "Mochi", price: 2500, draw: mochi },
  gingerbread: { name: "Gingerbread", price: 3000, draw: gingerbread },
  panda: { name: "Panda onesie", price: 3500, draw: panda },
  ice: { name: "Ice crystal", price: 4000, draw: ice },
  robot: { name: "Robot", price: 4000, draw: robot },
  lava: { name: "Magma", price: 4500, draw: lava },
  galaxy: { name: "Galaxy", price: 5000, draw: galaxy },
  statue: { name: "Golden statue", price: 6000, draw: statue },
};

/** The free colours of the glossy piece. */
export const COLOURS: Record<string, string> = {
  orange: "#F5922E",
  red: "#E0403A",
  blue: "#3A78D8",
  green: "#3AA65A",
  yellow: "#F2CA3A",
  pink: "#F27AB0",
  purple: "#8A5AD0",
  cyan: "#3AC4D0",
  white: "#EDEDED",
  black: "#3A3A44",
  brown: "#8A5A3A",
  lime: "#9ADA3A",
};

// Faces: eyes, mouths and noses, in body units (see ../rig). Eyes are
// their own layer, so they can blink. The body can be any colour (white,
// black, yellow…), so features are dark with ivory highlights, or carry
// their own outline.

import type { EmblemPart } from "@/components/engraved/emblem";
import { shade } from "@/components/engraved/shapes";
import { both, ell, type Hex, type PartDef } from "../rig";

// ── pieces ───────────────────────────────────────────────────────────

/** The colour of the dark features (as `{ dark }`), for piped lines. */
const INK = "#1A1008";
const n = (v: number) => +v.toFixed(2);

/** A bold round-ended dark line: brows, lids, closed eyes, mouths. */
const stroke = (line: string, w = 1.4): EmblemPart => ({ line, color: INK, w });
/** A little ivory catch-light. */
const glint = (x: number, y: number, rx: number, ry = rx): EmblemPart => ({
  d: ell(x, y, rx, ry),
  m: "ivory",
  ink: 0,
});

const BLUSH: EmblemPart = {
  d: `${ell(37.6, 33.4, 3.2, 1.8)}${ell(62.4, 33.4, 3.2, 1.8)}`,
  m: "#FF8A8A",
  ink: 0,
  op: 0.55,
};

/** A star with `points` points, one straight up. */
function star(cx: number, cy: number, R: number, r: number, points = 5) {
  const at = Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const k = i % 2 ? r : R;
    return `${n(cx + k * Math.cos(a))} ${n(cy + k * Math.sin(a))}`;
  });
  return `M${at.join("L")}Z`;
}

/** A heart about 2.2·s wide, its point at the bottom. */
function heart(cx: number, cy: number, s: number) {
  const x = (k: number) => n(cx + k * s);
  const y = (k: number) => n(cy + k * s);
  return (
    `M${x(0)} ${y(1)}` +
    `C${x(-0.5)} ${y(0.62)} ${x(-1.1)} ${y(0.15)} ${x(-1.1)} ${y(-0.32)}` +
    `C${x(-1.1)} ${y(-0.95)} ${x(-0.3)} ${y(-1.1)} ${x(0)} ${y(-0.5)}` +
    `C${x(0.3)} ${y(-1.1)} ${x(1.1)} ${y(-0.95)} ${x(1.1)} ${y(-0.32)}` +
    `C${x(1.1)} ${y(0.15)} ${x(0.5)} ${y(0.62)} ${x(0)} ${y(1)}Z`
  );
}

/** A four-pointed twinkle. */
const twinkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

/** A drop of water, its tip at (x, tip) and `h` tall. */
const drop = (x: number, tip: number, h: number): string => {
  const w = h * 0.36;
  const b = tip + h;
  return `M${x} ${tip}C${n(x + w * 0.5)} ${n(tip + h * 0.4)} ${n(x + w)} ${n(b - h * 0.42)} ${n(x + w)} ${n(b - w)}C${n(x + w)} ${n(b - w * 0.2)} ${n(x + w * 0.5)} ${b} ${x} ${b}C${n(x - w * 0.5)} ${b} ${n(x - w)} ${n(b - w * 0.2)} ${n(x - w)} ${n(b - w)}C${n(x - w)} ${n(b - h * 0.42)} ${n(x - w * 0.5)} ${n(tip + h * 0.4)} ${x} ${tip}Z`;
};
const WATER = "#8AD0FF" as Hex;
const TONGUE = "#F2707E" as Hex;
const PINK = "#F27A9A" as Hex;

/** `a` mixed `k` of the way toward `b`. */
const mix = (a: string, b: string, k: number): Hex => {
  const ch = (hex: string, i: number) => parseInt(hex.replace("#", "").slice(i, i + 2), 16);
  return `#${[0, 2, 4]
    .map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k).toString(16).padStart(2, "0"))
    .join("")}`;
};

/** Is this body colour dark (so a mark on it should be lighter)? */
const isDark = (hex: string) => {
  const c = [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16));
  return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] < 96;
};

// ── eyes (centres (43.4, 28) and (56.6, 28)) ─────────────────────────

/** The plain open eye, for the dots and the wink. */
const DOT_EYE: EmblemPart[] = [{ dark: ell(43.4, 28, 2.8, 3.6) }, glint(42.4, 26.6, 1.1)];

export const EYES: Record<string, PartDef> = {
  dots: {
    name: "Dots",
    price: 0,
    draw: () => [...DOT_EYE.flatMap(both), BLUSH],
  },
  googly: {
    name: "Googly",
    price: 0,
    draw: () => [
      ...both({ d: ell(43.2, 27, 5.6, 6.4), m: "ivory", ink: 1 }),
      { dark: `${ell(44.6, 27.4, 2.8, 3.2)}${ell(58.2, 27.4, 2.8, 3.2)}` },
      { d: `${ell(43.8, 26.2, 0.9, 0.9)}${ell(57.4, 26.2, 0.9, 0.9)}`, m: "ivory", ink: 0 },
    ],
  },
  happy: {
    name: "Happy",
    price: 200,
    draw: () => [
      ...both({ dark: "M39.4 29.4C40.6 25.4 46 25.4 47.2 29.4L45.8 29.8C44.8 27.6 41.8 27.6 40.8 29.8Z" }),
      BLUSH,
    ],
  },
  icing: {
    name: "Icing",
    price: 300,
    draw: () => [
      ...both({ d: ell(43.6, 27.6, 2.3, 2.6), m: "#000000", ink: 0, op: 0.3, t: "translate(0.5 0.8)" }),
      ...both({ d: ell(43.6, 27.6, 2.3, 2.6), m: "#FFF8EE", ink: 0 }),
    ],
  },
  sleepy: {
    name: "Sleepy",
    price: 150,
    draw: () => [
      // the lower half of the eye, under a heavy drooping lid
      // shut, curving down, with a lash at the corner
      ...both(stroke("M39.8 27.8Q43.4 31.4 47 27.8", 1.7)),
      ...both(stroke("M40.4 28.6L39 29.8", 1.1)),
      // a little "z" drifting off
      stroke("M62.4 15.6H65.4L62.4 18.6H65.4", 1),
      stroke("M66.8 11.4H68.6L66.8 13.2H68.6", 0.8),
    ],
  },
  wink: {
    name: "Wink",
    price: 200,
    draw: () => [
      ...DOT_EYE,
      stroke("M53 29Q56.6 24.6 60.2 29", 1.7),
      BLUSH,
    ],
  },
  cute: {
    name: "Squee",
    price: 200,
    draw: () => [...both(stroke("M40.2 24.8L46 28L40.2 31.2", 1.7)), BLUSH],
  },
  surprised: {
    name: "Surprised",
    price: 150,
    draw: () => [
      ...both({ d: ell(43.4, 27.8, 4.2, 4.8), m: "ivory", ink: 1 }),
      ...both({ dark: ell(43.4, 28.2, 1.3, 1.5) }),
      ...both(stroke("M39.8 20.2Q43.4 18.2 47 20.2", 1.4)),
    ],
  },
  determined: {
    name: "Determined",
    price: 200,
    draw: () => [
      // the brow presses the top of the eye flat, down toward the nose
      ...both({ dark: "M40.2 25.8L46.6 27.4C46.8 30.6 45.4 32.2 43.4 32.2C41.4 32.2 40 30.2 40.2 25.8Z" }),
      ...both(glint(42.2, 28.2, 0.9)),
      ...both(stroke("M39.2 22.6L47.2 25", 2)),
    ],
  },
  sad: {
    name: "Teary",
    price: 250,
    draw: () => [
      ...both({ dark: ell(43.4, 28.6, 3, 3.6) }),
      ...both(glint(42.2, 27.2, 1.3)),
      ...both(glint(44.7, 30.3, 0.65)),
      ...both({ line: "M41.4 31Q43.4 32.2 45.4 31", color: "#FFF8EE", w: 0.5, op: 0.8 }),
      ...both(stroke("M39.8 24.4Q43.2 24.2 46.6 22.4", 1.4)),
      // one tear, rolling down the cheek
      { d: drop(39.6, 31.6, 4.4), m: WATER, ink: 0.7, round: true },
      glint(39, 34.2, 0.45, 0.6),
    ],
  },
  cool: {
    name: "Smug",
    price: 250,
    draw: () => [
      // narrow, half shut, both looking off to the side
      ...both({ d: "M39.6 28.4C41.4 27.2 45.6 27 47.2 27.8C46 30.2 41.6 30.6 39.6 28.4Z", m: "ivory", ink: 0.8 }),
      { dark: `${ell(45.2, 28.6, 1.4, 1.35)}${ell(58.6, 28.6, 1.4, 1.35)}` },
      glint(44.7, 28.2, 0.45),
      glint(58.1, 28.2, 0.45),
      ...both(stroke("M39 28.6C40.6 26.8 45.6 26.4 47.8 27.6", 1.7)),
      ...both(stroke("M40 23.8Q43.4 23 47 23.8", 1.2)),
    ],
  },
  sparkly: {
    name: "Sparkly",
    price: 400,
    draw: () => [
      ...both({ dark: ell(43.4, 27.6, 3.7, 4.7) }),
      ...both({ d: ell(43.4, 29.6, 2.6, 2.3), m: "#6A5AE0", ink: 0, op: 0.9 }),
      ...both({ dark: ell(43.4, 28.4, 1.4, 1.6) }),
      ...both(glint(41.9, 25.6, 1.6, 1.8)),
      ...both(glint(45.1, 30.2, 0.75)),
      ...both(stroke("M40 24L38.4 22.6", 1.2)),
      { d: twinkle(64.6, 21.6, 2.2), m: "ivory", ink: 0.5 },
      BLUSH,
    ],
  },
  heart: {
    name: "Smitten",
    price: 400,
    draw: () => [
      ...both({ d: heart(43.4, 27.4, 3.6), m: "crimson", ink: 0.9, round: true }),
      ...both(glint(41.6, 26, 0.9, 0.7)),
      BLUSH,
    ],
  },
  star: {
    name: "Starstruck",
    price: 450,
    draw: () => [
      ...both({ d: star(43.4, 28.2, 5.3, 2.4), m: "gold", ink: 0.9, round: true }),
      ...both(glint(42.4, 26.6, 0.75)),
    ],
  },
};

// ── mouths (centre x 50, y ~34) ──────────────────────────────────────

export const MOUTHS: Record<string, PartDef> = {
  smile: {
    name: "Smile",
    price: 0,
    draw: () => [{ dark: "M46.6 33.6C48.4 35.6 51.6 35.6 53.4 33.6C52.8 36.8 47.2 36.8 46.6 33.6Z" }],
  },
  flat: {
    name: "Meh",
    price: 0,
    draw: () => [stroke("M46.2 34.6H53.8", 1.6)],
  },
  grin: {
    name: "Grin",
    price: 200,
    draw: () => [
      { dark: "M44.6 33C47 38.4 53 38.4 55.4 33Z" },
      { d: "M46.4 33.6H53.6Q53.4 35 52.6 35.6H47.4Q46.6 35 46.4 33.6Z", m: "ivory", ink: 0 },
    ],
  },
  icing: {
    name: "Iced smile",
    price: 300,
    draw: () => [
      { line: "M44 33.2C47.4 37.2 52.6 37.2 56 33.2", color: "#000000", w: 1.8, op: 0.3, t: "translate(0.5 0.9)" },
      { line: "M44 33.2C47.4 37.2 52.6 37.2 56 33.2", color: "#FFF8EE", w: 1.8 },
    ],
  },
  oh: {
    name: "Oh!",
    price: 150,
    draw: () => [
      { dark: ell(50, 35.4, 2.5, 3) },
      { d: ell(50, 36.9, 1.4, 0.85), m: TONGUE, ink: 0 },
    ],
  },
  cat: {
    name: "Kitty",
    price: 200,
    draw: () => [stroke("M44.8 33.2Q47.4 37.2 50 33.8Q52.6 37.2 55.2 33.2", 1.5)],
  },
  wavy: {
    name: "Nervous",
    price: 200,
    draw: () => [
      stroke("M44.6 34.6Q45.95 32.9 47.3 34.6T50 34.6T52.7 34.6T55.4 34.6", 1.4),
      // a bead of sweat at the temple
      { d: drop(64.2, 18.6, 5), m: WATER, ink: 0.7, round: true },
      glint(63.5, 21.6, 0.45, 0.7),
    ],
  },
  tongue: {
    name: "Cheeky",
    price: 250,
    draw: () => [
      {
        d: "M49.2 34.8H53.6C53.6 38.6 52.8 39.6 51.4 39.6C50 39.6 49.2 38.6 49.2 34.8Z",
        m: TONGUE,
        ink: 0.8,
        round: true,
        vein: "M51.4 35.6V37.8",
        vw: 0.6,
      },
      stroke("M45 33.2Q50 37.8 55 33.2", 1.5),
    ],
  },
  laugh: {
    name: "Laugh",
    price: 250,
    draw: () => [
      { dark: "M43.8 32.4H56.2C55.8 38.2 53.2 40.2 50 40.2C46.8 40.2 44.2 38.2 43.8 32.4Z" },
      {
        d: "M46.2 38.2C47.4 36.4 52.6 36.4 53.8 38.2C52.8 39.5 51.4 39.9 50 39.9C48.6 39.9 47.2 39.5 46.2 38.2Z",
        m: TONGUE,
        ink: 0,
      },
    ],
  },
  fang: {
    name: "Fang",
    price: 300,
    draw: () => [
      { d: "M50.8 34.6L54.2 34Q53.8 36.4 52.7 38.2Q51.7 36.4 50.8 34.6Z", m: "ivory", ink: 0.7 },
      stroke("M45 33.2Q50 37.4 55 33.2", 1.5),
    ],
  },
  kiss: {
    name: "Smooch",
    price: 300,
    draw: () => [
      stroke("M49 32.4Q52.6 32.8 50.4 34.6Q52.8 36 49 36.8", 1.5),
      { d: heart(56.6, 36.6, 1.6), m: "crimson", ink: 0.6, round: true },
    ],
  },
};

// ── noses (about (50, 31.4)) ─────────────────────────────────────────

/** Freckles over the nose and cheeks (the left half). */
const FRECKLES: [number, number, number][] = [
  [40.8, 31.4, 0.62], [42.4, 32.8, 0.66], [44.2, 32, 0.6], [46.2, 31, 0.55], [46, 32.8, 0.5],
];

export const NOSES: Record<string, PartDef> = {
  none: { name: "None", price: 0, draw: () => [] },
  dot: {
    name: "Dot",
    price: 0,
    draw: () => [{ d: ell(50, 31.4, 1.3, 0.9), m: "#000000", ink: 0, op: 0.35 }],
  },
  button: {
    name: "Button",
    price: 0,
    draw: () => [{ dark: ell(50, 31.3, 1.9, 1.35) }, glint(49.3, 30.7, 0.6, 0.4)],
  },
  round: {
    name: "Round",
    price: 150,
    draw: ({ colour }) => [
      { d: ell(50.4, 32.6, 3, 1.1), m: "#000000", ink: 0, op: 0.28 },
      { d: ell(50, 31, 3, 2.5), m: mix(colour, "#F0705A", 0.45), ink: 0.5, round: true },
      { d: ell(48.9, 29.9, 1.3, 0.8), m: "#FFFFFF", ink: 0, op: 0.75 },
    ],
  },
  freckles: {
    name: "Freckles",
    price: 200,
    draw: ({ colour }) => [
      ...both({
        d: FRECKLES.map(([x, y, r]) => ell(x, y, r, r * 0.85)).join(""),
        m: (isDark(colour) ? "#E0A882" : shade(colour, -0.55)) as Hex,
        ink: 0,
      }),
      { d: ell(50, 31.4, 1, 0.7), m: "#000000", ink: 0, op: 0.3 },
    ],
  },
  clown: {
    name: "Clown",
    price: 250,
    draw: () => [
      { d: ell(50, 31, 2.8, 2.6), m: "crimson", ink: 0.8, round: true },
      glint(49, 29.9, 0.85, 0.6),
    ],
  },
  heart: {
    name: "Heart",
    price: 300,
    draw: () => [
      { d: heart(50, 30.9, 1.9), m: PINK, ink: 0.8, round: true },
      glint(49, 30.2, 0.45, 0.35),
    ],
  },
  kitty: {
    name: "Whiskers",
    price: 300,
    draw: () => [
      ...both(stroke("M38.4 31.4L32.4 30.4", 0.8)),
      ...both(stroke("M38.4 33.4L32.2 33.8", 0.8)),
      { d: "M48.1 30.7Q50 29.9 51.9 30.7Q51 32.6 50 32.6Q49 32.6 48.1 30.7Z", m: PINK, ink: 0.7, round: true },
    ],
  },
};

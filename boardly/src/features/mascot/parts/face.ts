// Faces: eyes, mouths and noses, in body units (see ../rig). Eyes are
// their own layer, so they can blink.

import { both, ell, type Hex, type PartDef } from "../rig";

const BLUSH = { d: `${ell(37.6, 33.4, 3.2, 1.8)}${ell(62.4, 33.4, 3.2, 1.8)}`, m: "#FF8A8A" as Hex, ink: 0, op: 0.55 };

export const EYES: Record<string, PartDef> = {
  dots: {
    name: "Dots",
    price: 0,
    draw: () => [
      ...both({ dark: ell(43.4, 28, 2.8, 3.6) }),
      ...both({ d: ell(42.4, 26.6, 1.1, 1.1), m: "ivory", ink: 0 }),
      BLUSH,
    ],
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
};

export const MOUTHS: Record<string, PartDef> = {
  smile: {
    name: "Smile",
    price: 0,
    draw: () => [{ dark: "M46.6 33.6C48.4 35.6 51.6 35.6 53.4 33.6C52.8 36.8 47.2 36.8 46.6 33.6Z" }],
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
};

export const NOSES: Record<string, PartDef> = {
  none: { name: "None", price: 0, draw: () => [] },
  dot: {
    name: "Dot",
    price: 0,
    draw: () => [{ d: ell(50, 31.4, 1.3, 0.9), m: "#000000", ink: 0, op: 0.35 }],
  },
};

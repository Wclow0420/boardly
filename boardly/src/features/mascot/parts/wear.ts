// Clothes: tops, bottoms and shoes, cut to the meeple (see ../rig for
// where its arms, waist and legs are).

import { both, ell, type PartDef } from "../rig";

export const TOPS: Record<string, PartDef> = {
  tee: {
    name: "Tee",
    price: 0,
    draw: () => [
      {
        d: "M34.2 40C29.6 40.7 26.6 41.6 24 42.6L23.4 61.6C24.6 61.8 25.6 61.9 26.6 62C27.8 62.2 28.2 63.2 27.8 64.2L26.8 67H73.2L72.2 64.2C71.8 63.2 72.2 62.2 73.4 62C74.4 61.9 75.4 61.8 76.6 61.6L76 42.6C73.4 41.6 70.4 40.7 65.8 40C62.6 43.2 56.6 45 50 45C43.4 45 37.4 43.2 34.2 40Z",
        m: "#F4F0E8",
        ink: 1.2,
        round: true,
        vein: "M24.6 46V59M75.4 46V59",
        vw: 0.6,
      },
    ],
  },
  sweater: {
    name: "Sweater",
    price: 400,
    draw: () => [
      {
        d: "M34.2 40C27.4 41 21.6 42.8 18 45.6L18.6 60.8C21.4 61.4 24 61.8 26.6 62C27.8 62.2 28.2 63.2 27.8 64.2L26.6 67.6H73.4L72.2 64.2C71.8 63.2 72.2 62.2 73.4 62C76 61.8 78.6 61.4 81.4 60.8L82 45.6C78.4 42.8 72.6 41 65.8 40C62.6 43.4 56.6 45.2 50 45.2C43.4 45.2 37.4 43.4 34.2 40Z",
        m: "#C2203A",
        ink: 1.2,
        round: true,
        vein: "M21 46.4V60.4M79 46.4V60.4M28.4 64.6H71.6M36 45.6C40 47.6 60 47.6 64 45.6",
        vw: 0.6,
      },
    ],
  },
};

export const BOTTOMS: Record<string, PartDef> = {
  pants: {
    name: "Pants",
    price: 0,
    draw: () => [
      {
        d: "M27.1 66H72.9L81.4 88.4C82.4 91 82.2 93 81.2 94.6H54.9L50 83.2L45.1 94.6H18.8C17.8 93 17.6 91 18.6 88.4Z",
        m: "#3A4A6A",
        ink: 1.2,
        round: true,
        vein: "M50 68V80M36 72L31 92M64 72L69 92",
        vw: 0.6,
      },
    ],
  },
  skirt: {
    name: "Skirt",
    price: 300,
    draw: () => [
      {
        d: "M28.2 62.6H71.8L81.6 86.4Q50 92 18.4 86.4Z",
        m: "#E07AA8",
        ink: 1.2,
        round: true,
        vein: "M38 64L33 88M50 64V90M62 64L67 88",
        vw: 0.6,
      },
    ],
  },
};

export const SHOES: Record<string, PartDef> = {
  none: { name: "Barefoot", price: 0, draw: () => [] },
  sneakers: {
    name: "Sneakers",
    price: 0,
    draw: () =>
      both({
        d: "M18 90.4H47.1L45.6 94.2C44.6 96.8 42.4 98.4 39.4 98.4H25.6C19.6 98.4 16.6 94 18 90.4Z",
        m: "#F4F0E8",
        ink: 1.2,
        round: true,
        vein: "M17.6 95.4H45",
        vw: 0.7,
        shine: "M22 92.6H30",
        sw: 0.8,
      }),
  },
};

export { ell };

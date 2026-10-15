// A player's figure, in the house style: a little engraved person built
// from parts — back hair, body, clothes, head, face, front hair — each
// chosen and coloured from a Look. Drawn in a 100 × 160 box as emblem
// data, so it shows as still SVG anywhere and can be drawn on a canvas.
//
// First draft: the two base bodies with one choice of each part.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import { shade } from "@/components/engraved/shapes";

export const FIGURE_BOX: [number, number] = [100, 160];

export interface Look {
  body: "male" | "female";
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
}

/** An ellipse as path data. */
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}Z`;

/** The mirror image of a left-side part, on the right. */
const MIRROR = "translate(100 0) scale(-1 1)";
const both = (part: EmblemPart): EmblemPart[] => [part, { ...part, t: MIRROR }];

const HEAD = {
  male: "M24 46C24 27 36 18 50 18C64 18 76 27 76 46C76 62 69 76 50 79C31 76 24 62 24 46Z",
  female: "M25 46C25 27 37 18 50 18C63 18 75 27 75 46C75 63 65 77 50 80C35 77 25 63 25 46Z",
};

const TORSO = {
  male: "M27 90Q34 84 43 84Q50 89 57 84Q66 84 73 90L76 122Q50 127 24 122Z",
  female:
    "M31 90Q37 85 43 84Q50 89 57 84Q63 85 69 90L66 106Q72 114 72 122Q50 127 28 122Q28 114 34 106Z",
};

export function drawFigure(look: Look): EmblemData {
  const male = look.body === "male";
  const skin = look.skin as `#${string}`;
  const hair = look.hair as `#${string}`;
  const top = look.top as `#${string}`;
  const bottom = look.bottom as `#${string}`;
  const shoes = look.shoes as `#${string}`;
  const neck = shade(look.skin, -0.12) as `#${string}`;
  const dark = { ink: 0 } as const;

  return [
    // behind everything: long hair falls behind the shoulders
    ...(male
      ? []
      : [
          {
            d: "M21 46C18 20 34 9 50 9C66 9 82 20 79 46C80 64 82 82 86 96Q76 104 66 96L66 70L34 70L34 96Q24 104 14 96C18 82 20 64 21 46Z",
            m: hair,
            vein: "M28 56C27 72 26 84 22 94M72 56C73 72 74 84 78 94",
          },
        ]),

    // legs and shoes
    ...(male
      ? [
          {
            d: "M27 121H73L71 150H53.5L50 131L46.5 150H29Z",
            m: bottom,
            vein: "M50 124V130M38 128L38.5 148M62 128L61.5 148",
          },
          ...both({
            d: "M28 148H47Q49 156 44 157H30Q25 156.5 28 148Z",
            m: shoes,
            shine: "M30 151H38",
          }),
        ]
      : [
          ...both({ d: "M37 138H45L44.5 152H37.5Z", m: skin }),
          ...both({
            d: "M35 150H46Q47.5 156 43.5 156.5H36Q32.5 156 35 150Z",
            m: shoes,
            shine: "M37 152.4H42",
          }),
          {
            d: "M28 121H72L79 141Q50 147 21 141Z",
            m: bottom,
            vein: "M38 124L34 142M50 124V145M62 124L66 142",
          },
        ]),

    // arms: a sleeve, a forearm, a hand
    ...both({ d: "M18.6 110L27.2 110L26.6 121Q22.6 124 18.8 121Z", m: skin }),
    ...both({ d: `${ell(22.8, 123.5, 4.3, 4.3)}`, m: skin }),
    ...both({
      d: "M28.5 89Q20 92 18.8 105L18.4 112L27.4 112L28.4 104Q29.2 98 32.5 94Z",
      m: top,
    }),

    // the body and its collar
    { d: "M43 70H57V89H43Z", m: neck },
    {
      d: TORSO[look.body],
      m: top,
      vein: "M43 84L50 92.5L57 84M50 92.5V121",
      shine: "M30 94L28 116",
    },

    // the head: ears behind the face, then the face
    ...both({ d: ell(25, 50, 4.6, 7), m: skin }),
    {
      d: HEAD[look.body],
      m: skin,
      vein: "M50.5 52Q48 58 51 59.5",
      shine: "M29 40Q30 30 37 25",
    },

    // the face
    ...both({
      d: male
        ? "M33 42.5Q39 38.5 45.5 41.5L45 43.4Q39 41 33.6 44.4Z"
        : "M34 41.8Q39.5 38.4 45 40.6L44.7 41.8Q39.5 40 34.4 43Z",
      m: hair,
      ...dark,
    }),
    ...both({
      dark: male ? ell(39.5, 50, 3.2, 4) : ell(39.5, 50, 3.6, 4.6),
    }),
    ...(male
      ? []
      : both({ dark: "M36.2 47.2L32.4 45.2L33.4 48Z" })),
    ...both({ d: ell(38.4, 48.4, 1.2, 1.2), m: "ivory", ink: 0 }),
    ...(male
      ? []
      : both({ d: ell(35, 58, 4, 2.4), m: "#F4A9A0", ink: 0 })),
    male
      ? { d: "M43.5 64.5Q50 71 56.5 64.5Q50 67 43.5 64.5Z", m: "#B8485A", ink: 1 }
      : {
          d: "M43 64.5Q46.5 62.4 50 63.8Q53.5 62.4 57 64.5Q50 71.5 43 64.5Z",
          m: "#C83E5C",
          ink: 1,
        },

    // the hair over the brow
    male
      ? {
          d: "M22.5 46C20 23 34 13 50 13C67 13 81 24 77.5 46C76 39 73 34 70 31C62 35 50 33 42 28C38 33 30 36 25.5 38C24.2 40.5 23.2 43 22.5 46Z",
          m: hair,
          vein: "M36 20Q44 17 52 18M58 19Q66 21 72 27",
          shine: "M30 24Q38 17 48 16",
        }
      : {
          d: "M24 47C22 24 36 12.5 50 12.5C64 12.5 78 24 76 47C73 38 68 31 61 28C55 33 44 35 33 33C29 37 26 41 24 47Z",
          m: hair,
          vein: "M40 18Q50 15 60 18M30 28Q36 22 44 20",
          shine: "M32 22Q40 15 50 15",
        },
  ];
}

/** The two base figures, for looking over. */
export const EMBLEMS: Record<string, EmblemData> = {
  male: drawFigure({
    body: "male",
    skin: "#F0C29E",
    hair: "#3A2618",
    top: "#3A5A9A",
    bottom: "#3A3A48",
    shoes: "#6A4022",
  }),
  female: drawFigure({
    body: "female",
    skin: "#F4CBAA",
    hair: "#6A3A1E",
    top: "#C2203A",
    bottom: "#2E4A7A",
    shoes: "#5A2A1A",
  }),
  "male (deep skin)": drawFigure({
    body: "male",
    skin: "#8A5A3A",
    hair: "#1A120C",
    top: "#2E6A3A",
    bottom: "#4A3A2A",
    shoes: "#2A1A10",
  }),
  "female (fair)": drawFigure({
    body: "female",
    skin: "#FAD9C0",
    hair: "#E2B04A",
    top: "#7A4AA8",
    bottom: "#3A3A48",
    shoes: "#3A2A3A",
  }),
};

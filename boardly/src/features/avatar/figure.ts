// A player's figure, in the house style: a little engraved chibi built
// from parts (back hair, legs, body, arms, head, face, front hair), each
// chosen and coloured from a Look. A big round head on a small body,
// dot eyes set low, rosy cheeks: about 60% head. Drawn in a 100 × 120
// box as emblem data, so it shows as still SVG anywhere and can be drawn
// on a canvas too.
//
// Draft: a boy and a girl, and two animal heads (panda, fox) on the same
// body, one choice of each part.

import {
  mirrorPath,
  mirrorTransform,
  type EmblemData,
  type EmblemPart,
} from "@/components/engraved/emblem";
import { shade } from "@/components/engraved/shapes";

export const FIGURE_BOX: [number, number] = [100, 120];

type Hex = `#${string}`;

export interface Look {
  /** Who's under the clothes: a person, or an animal. */
  kind: "boy" | "girl" | "panda" | "fox";
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
}

const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}Z`;

/** A left-side part and its mirror image on the right. */
const W = FIGURE_BOX[0];
const flipT = (part: EmblemPart) => (part.t ? { t: mirrorTransform(part.t, W) } : {});
const both = (part: EmblemPart): EmblemPart[] => [
  part,
  "dark" in part
    ? { ...part, dark: mirrorPath(part.dark, W), ...flipT(part) }
    : "jewel" in part
      ? { ...part, x: W - part.x, ...flipT(part) }
      : {
          ...part,
          d: mirrorPath(part.d, W),
          ...(part.vein ? { vein: mirrorPath(part.vein, W) } : {}),
          ...(part.shine ? { shine: mirrorPath(part.shine, W) } : {}),
          ...flipT(part),
        },
];

const HEAD =
  "M17 44C17 22 31 10 50 10C69 10 83 22 83 44C83 62 69 74.5 50 74.5C31 74.5 17 62 17 44Z";
const BLACK = "#2A2A30" as Hex;

// ── the body: stubby and small ───────────────────────────────────────

function body(look: Look): EmblemPart[] {
  const skin = look.skin as Hex;
  const top = look.top as Hex;
  const shoes = look.shoes as Hex;
  const dress = look.kind === "girl";
  const paw = look.kind === "panda" ? BLACK : skin;
  return [
    // legs and shoes
    ...(dress
      ? both({ d: "M41.5 96H47.5V105H41.5Z", m: skin, ink: 1 })
      : [
          {
            d: "M38 94H62V105H51.6L50 99.5L48.4 105H38Z",
            m: (look.kind === "panda" ? BLACK : look.bottom) as Hex,
            ink: 1.1,
          },
        ]),
    ...both({
      d: "M36.4 103.4H49.4Q50.6 110 46.2 111H38.4Q34.4 110.4 36.4 103.4Z",
      m: shoes,
      ink: 1.1,
      shine: "M38.6 105.8H44",
      sw: 0.9,
    }),
    // arms: a round hand under a sleeve
    ...both({ d: ell(31.6, 90.4, 3.4, 3.4), m: paw, ink: 1 }),
    ...both({
      d: "M38.4 75.6C33.4 77.4 30.6 82.6 30.4 88.4C31.6 90.8 34.6 91.2 36 89.8L38.6 84Z",
      m: top,
      ink: 1.1,
    }),
    // the body
    dress
      ? {
          d: "M38.6 72L61.4 72L67.4 97.4Q50 100.8 32.6 97.4Z",
          m: top,
          ink: 1.1,
          vein: "M44 82L41 97M50 80V99M56 82L59 97",
          vw: 0.6,
          shine: "M40 77L37 94",
          sw: 0.9,
        }
      : {
          d: "M37.6 72C37 80 36.6 88 37.6 96L62.4 96C63.4 88 63 80 62.4 72Z",
          m: top,
          ink: 1.1,
          vein: "M44.6 74C46.4 78 53.6 78 55.4 74",
          vw: 0.6,
          shine: "M40.6 77V92",
          sw: 0.9,
        },
  ];
}

// ── heads ────────────────────────────────────────────────────────────

/** Dot eyes with two glints, low on the face. */
const EYES: EmblemPart[] = [
  ...both({ dark: ell(38, 50.5, 4.3, 5.3) }),
  ...both({ d: ell(36.4, 48.6, 1.7, 1.7), m: "ivory", ink: 0 }),
  ...both({ d: ell(39.6, 53.2, 0.75, 0.75), m: "ivory", ink: 0 }),
];
const CHEEKS = both({ d: ell(29.6, 59, 4.6, 2.7), m: "#F6A3A0", ink: 0 });

function person(look: Look): EmblemPart[] {
  const skin = look.skin as Hex;
  const girl = look.kind === "girl";
  return [
    ...both({ d: ell(17.4, 47.5, 4, 6), m: skin, ink: 1 }),
    { d: HEAD, m: skin, ink: 1.1 },
    ...CHEEKS,
    ...EYES,
    ...(girl ? both({ dark: "M34 46.4L30.6 44.2L32.4 47.6Z" }) : []),
    // brows, a little arched
    ...both({
      d: "M33.6 40.2C36 38.8 39.6 38.6 42.2 39.6L42 40.8C39.6 40.1 36.4 40.3 34.1 41.4Z",
      m: shade(look.hair, -0.2) as Hex,
      ink: 0,
    }),
    // a tiny nose and a small smile
    { d: ell(50, 57.4, 1.2, 0.8), m: shade(look.skin, -0.22) as Hex, ink: 0 },
    girl
      ? {
          d: "M46.4 61.6C48 63.8 52 63.8 53.6 61.6C52.8 65 47.2 65 46.4 61.6Z",
          m: "#D8566C",
          ink: 0.7,
        }
      : {
          d: "M46.2 61.4C48.2 63.6 51.8 63.6 53.8 61.4C52.8 64.6 47.2 64.6 46.2 61.4Z",
          m: "#B85A5A",
          ink: 0.7,
        },
  ];
}

const HAIR = {
  boy: {
    d: "M15.4 46.4C12 20 29 6 50 6C71 6 88 20 84.6 46.4C83.6 39 81.6 33.4 78.6 29.4C77.2 32.4 75.2 34.4 72.6 35.2C73 32 72.2 29.8 70.8 28.4C66.2 32 59.8 33.4 53.2 33C54.8 31.2 55.4 29.2 55 27.4C48.8 31.6 40.2 33.6 31.2 32.4C26.4 35.6 22.4 40.8 20.6 46.8C18.6 46.4 17 46.4 15.4 46.4Z",
    vein: "M28 18C34 13 42 11 50 11M56 12C64 13 71 16 76 21M38 22C44 19 50 18 56 18",
    shine: "M27 22C31 16 37 12.6 44 11.6",
  },
  girl: {
    back: "M14 46C11 20 29 9.4 50 9.4C71 9.4 89 20 86 46C87 62 88.4 78 86.4 92C84.6 98 76.4 98.4 74.4 92.4Q50 82 25.6 92.4C23.6 98.4 15.4 98 13.6 92C11.6 78 13 62 14 46Z",
    front:
      "M15.6 47C13 20 30 7.6 50 7.6C70 7.6 87 20 84.4 47C83 40 80.6 34.6 77 30.6C75.4 34 73 36.2 69.8 37C70.4 33.8 70 31.4 68.6 29.6C63.6 33.4 57.4 35.2 50.4 35.2C51.8 33.4 52.4 31.2 52 29.4C45.6 34 37.6 37 29.6 36.8C25.4 39.8 22.6 43.8 21.4 48.6L20.4 64C17 59 15.6 53 15.6 47Z",
    vein: "M30 18C36 13.6 43 11.6 50 11.6M58 12.6C66 14 72 17.6 77 23",
    shine: "M26 22C30 16 37 12.4 45 11.4",
  },
};

function panda(): EmblemPart[] {
  return [
    ...both({ d: ell(25, 18, 9, 9), m: BLACK, ink: 1.1 }),
    { d: HEAD, m: "ivory", ink: 1.1 },
    ...both({ d: ell(37, 51, 7, 8.6), m: BLACK, ink: 0, t: "rotate(-22 37 51)" }),
    ...both({ d: ell(38.4, 49.4, 2.4, 2.4), m: "ivory", ink: 0 }),
    ...both({ d: ell(36.8, 53.4, 0.8, 0.8), m: "ivory", ink: 0 }),
    ...CHEEKS,
    {
      d: "M45.6 58.6Q50 56.6 54.4 58.6Q52.6 62.8 50 62.8Q47.4 62.8 45.6 58.6Z",
      m: BLACK,
      ink: 0,
    },
    {
      dark: "M47 65.4Q48.6 66.8 50 64.6Q51.4 66.8 53 65.4L52.6 66.2Q51.2 67.4 50 66Q48.8 67.4 47.4 66.2Z",
    },
  ];
}

function fox(): EmblemPart[] {
  const orange = "#E8822A" as Hex;
  return [
    ...both({ d: "M18.6 34L22 4.6L42.4 17.4Z", m: orange, ink: 1.1 }),
    ...both({ d: "M23.4 27L25 11.4L35.6 18.4Z", m: "#3A2418" as Hex, ink: 0 }),
    {
      d: "M17 44C17 22 31 10 50 10C69 10 83 22 83 44C83 52 81 58 76 64C70 71 60 74.5 50 74.5C40 74.5 30 71 24 64C19 58 17 52 17 44Z",
      m: orange,
      ink: 1.1,
    },
    {
      d: "M22.6 54C28 64 38 73 50 73C62 73 72 64 77.4 54C70 59.4 60 60 50 56.6C40 60 30 59.4 22.6 54Z",
      m: "ivory",
      ink: 0.9,
    },
    ...EYES,
    ...CHEEKS,
    {
      d: "M46.6 58.4Q50 56.8 53.4 58.4Q52 61.4 50 61.4Q48 61.4 46.6 58.4Z",
      m: "#2A1A12" as Hex,
      ink: 0,
    },
    {
      dark: "M47.4 64.2Q48.8 65.6 50 63.6Q51.2 65.6 52.6 64.2L52.2 65Q51 66.2 50 64.8Q49 66.2 47.8 65Z",
    },
  ];
}

// ── light and shade: what makes it look round ─────────────────────────

/** A soft shadow of `base`'s darker self, or a soft light, laid over. */
const shadow = (d: string, base: string, op = 0.3): EmblemPart => ({
  d,
  m: shade(base, -0.45) as Hex,
  ink: 0,
  op,
});
const light = (d: string, op = 0.45): EmblemPart => ({ d, m: "ivory", ink: 0, op });

/** The ground under the feet. */
const GROUND: EmblemPart = { d: ell(50, 110.6, 19, 3.6), m: "#000000" as Hex, ink: 0, op: 0.22 };

/** Shade on a face lit from the upper left: under the fringe, down the
 *  far cheek and jaw; and a glint on the nose. */
const faceShade = (skin: string, fringe?: string): EmblemPart[] => [
  // the fringe's own shape, cast a little down and away from the light
  ...(fringe ? [{ ...shadow(fringe, skin, 0.3), t: "translate(0.8 2.8)" }] : []),
  shadow("M83 44C83 62 69 74.5 50 74.5C40 74.5 31 71 25 65C34 70 44 72 52 71.4C68 70 79 60 83 44Z", skin, 0.2),
  light(ell(48.8, 56.4, 1, 0.7), 0.7),
];

/** Shade on the body: the head's shadow on the chest, the far side. */
const bodyShade = (top: string): EmblemPart[] => [
  shadow(ell(50, 73.6, 13, 4.2), top, 0.4),
  shadow("M56.4 74L62.4 72C63 80 63.4 88 62.4 96.4L58 96.4C59.4 88 59.2 80 56.4 74Z", top, 0.26),
];

/** The glossy band across the hair. */
const HAIR_RING = light("M26.4 25C34 17.4 46 14.2 59 15.2C69 16 75.6 19 79.4 23.4C74 20.2 67.6 18.4 59 17.8C47 17.2 35.4 19.6 26.4 25Z", 0.34);

// ── the whole figure ─────────────────────────────────────────────────

/** Every filled part lit as something round. */
const rounded = (parts: EmblemPart[]): EmblemPart[] =>
  parts.map((part) => ("d" in part && part.op === undefined ? { ...part, round: true } : part));

export function drawFigure(look: Look, flat = false): EmblemData {
  const lit = drawLit(look, flat);
  return flat ? lit : rounded(lit);
}

function drawLit(look: Look, flat: boolean): EmblemData {
  const hair = look.hair as Hex;
  const girl = look.kind === "girl";
  const head =
    look.kind === "panda"
      ? panda()
      : look.kind === "fox"
        ? fox()
        : [
            ...person(look),
            look.kind === "boy"
              ? { ...HAIR.boy, m: hair, ink: 1.1, vw: 0.6, sw: 1 }
              : {
                  d: HAIR.girl.front,
                  m: hair,
                  ink: 1.1,
                  vein: HAIR.girl.vein,
                  vw: 0.6,
                  shine: HAIR.girl.shine,
                  sw: 1,
                },
          ];
  if (flat)
    return [
      ...(girl ? [{ d: HAIR.girl.back, m: hair, ink: 1.1 }] : []),
      ...body(look),
      ...head,
    ];
  // the face's shade goes over the skin, under the eyes and hair
  const human = look.kind === "boy" || look.kind === "girl";
  const at = head.findIndex((part) => "d" in part && part.d === HEAD) + 1;
  const shaded = human
    ? [
        ...head.slice(0, at),
        ...faceShade(look.skin, look.kind === "boy" ? HAIR.boy.d : HAIR.girl.front),
        ...head.slice(at),
      ]
    : [...head, ...faceShade(look.skin).slice(0, 1)];
  return [
    GROUND,
    ...(girl ? [{ d: HAIR.girl.back, m: hair, ink: 1.1 }] : []),
    ...body(look),
    ...bodyShade(look.top),
    ...shaded,
    ...(human ? [HAIR_RING] : []),
  ];
}

/** The draft figures, for looking over. */
export const EMBLEMS: Record<string, EmblemData> = {
  boy: drawFigure({
    kind: "boy",
    skin: "#F6D0B0",
    hair: "#3A2618",
    top: "#3A6AB8",
    bottom: "#3A3A48",
    shoes: "#7A3A22",
  }),
  girl: drawFigure({
    kind: "girl",
    skin: "#F8D6BC",
    hair: "#6A3A20",
    top: "#E05A78",
    bottom: "#3A3A48",
    shoes: "#7A2A3A",
  }),
  "girl (flat)": drawFigure(
    {
      kind: "girl",
      skin: "#F8D6BC",
      hair: "#6A3A20",
      top: "#E05A78",
      bottom: "#3A3A48",
      shoes: "#7A2A3A",
    },
    true,
  ),
  "girl (golden)": drawFigure({
    kind: "girl",
    skin: "#FBE2D0",
    hair: "#E8B850",
    top: "#5AA0D8",
    bottom: "#3A3A48",
    shoes: "#3A4A7A",
  }),
  "boy (deep)": drawFigure({
    kind: "boy",
    skin: "#A26A44",
    hair: "#1A120C",
    top: "#E8A03A",
    bottom: "#3A4A3A",
    shoes: "#2A1A10",
  }),
  panda: drawFigure({
    kind: "panda",
    skin: "#F4EEDF",
    hair: "#2A2A30",
    top: "#F4EEDF",
    bottom: "#2A2A30",
    shoes: "#2A2A30",
  }),
  fox: drawFigure({
    kind: "fox",
    skin: "#E8822A",
    hair: "#E8822A",
    top: "#4A8A5A",
    bottom: "#3A3A48",
    shoes: "#5A3A22",
  }),
};

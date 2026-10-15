// Hats, held items (in the right hand) and things worn on the back.

import { FEATHER } from "@/components/engraved/shapes";
import { mirrorPath, type EmblemPart } from "@/components/engraved/emblem";
import { ell, type PartDef } from "../rig";

export const HATS: Record<string, PartDef> = {
  none: { name: "None", price: 0, draw: () => [] },
  tophat: {
    name: "Top hat",
    price: 600,
    draw: () => [
      { d: "M36.4 -12H63.6V12.6H36.4Z", m: "#2A2A30", ink: 1.2, round: true, shine: "M39.4 -9V8", sw: 1 },
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
      { d: "M28 20.6H72V26.6Q50 29.4 28 26.6Z", m: "#2E7A44", ink: 1.2, round: true },
      { d: ell(50, 2.6, 4.2, 4.2), m: "#F4F0E8", ink: 1, round: true },
    ],
  },
};

export const HANDS: Record<string, PartDef> = {
  none: { name: "Empty", price: 0, draw: () => [] },
  sword: {
    name: "Sword",
    price: 800,
    draw: () => {
      const parts: EmblemPart[] = [
        { d: "M84.6 50V16L86 11.6L87.4 16V50Z", m: "silver", ink: 1, vein: "M86 14V49", vw: 0.5 },
        { d: "M79.6 49.6H92.4V53.2H79.6Z", m: "gold", ink: 1 },
        { d: "M84.6 53.2H87.4V62.4H84.6Z", m: "wood", ink: 1 },
        { d: ell(86, 63.8, 2.2, 2.2), m: "gold", ink: 1 },
      ];
      return parts.map((part) => ({ ...part, t: "rotate(18 86 54)" }));
    },
  },
};

const PACK = "#8A5A3A";

export const BACKS: Record<string, PartDef & { front?: () => ReturnType<PartDef["draw"]> }> = {
  none: { name: "None", price: 0, draw: () => [] },
  backpack: {
    name: "Backpack",
    price: 500,
    draw: () => [
      { d: "M28.6 38Q28.6 31 35 31H65Q71.4 31 71.4 38V76H28.6Z", m: PACK, ink: 1.2, round: true },
    ],
    front: () => [
      { line: "M37.4 41.6L32.6 66", color: "#5A3A22", w: 3.4 },
      { line: "M62.6 41.6L67.4 66", color: "#5A3A22", w: 3.4 },
    ],
  },
  wings: {
    name: "Wings",
    price: 1500,
    // feathers fanned up and out from each shoulder, the right a mirror
    draw: () =>
      [
        { len: 30, turn: -22 },
        { len: 26, turn: -46 },
        { len: 21, turn: -70 },
        { len: 16, turn: -94 },
      ].flatMap((f): EmblemPart[] => [
        { d: FEATHER(f.len, 5), m: "ivory", ink: 1, t: `translate(36 46) rotate(${f.turn})` },
        {
          d: mirrorPath(FEATHER(f.len, 5), 0),
          m: "ivory",
          ink: 1,
          t: `translate(64 46) rotate(${-f.turn})`,
        },
      ]),
  },
};

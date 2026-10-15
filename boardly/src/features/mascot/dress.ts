// A player's mascot as they've dressed it: a skin (the glossy piece in a
// colour, or a set) and a part in every slot, put together in layers.
// The layers are kept apart so a canvas can move them on their own: the
// eyes blink, the held item swings, the whole figure breathes.

import type { EmblemData } from "@/components/engraved/emblem";
import { EYES, MOUTHS, NOSES } from "./parts/face";
import { BACKS, HANDS, HATS } from "./parts/gear";
import { BOTTOMS, SHOES, TOPS } from "./parts/wear";
import { lifted, type PartDef } from "./rig";
import { COLOURS, SKINS } from "./skins";

export { BOX } from "./rig";

/** Every slot and what can go in it. */
export const CATALOG = {
  eyes: EYES,
  mouth: MOUTHS,
  nose: NOSES,
  hat: HATS,
  top: TOPS,
  bottom: BOTTOMS,
  shoes: SHOES,
  hand: HANDS,
  back: BACKS,
} satisfies Record<string, Record<string, PartDef>>;
export type Slot = keyof typeof CATALOG;

export interface Look {
  skin: string;
  /** The glossy piece's colour (a set ignores it). */
  colour: string;
  /** The part in each slot; a slot left out is empty. */
  wear: Partial<Record<Slot, string>>;
}

export const STARTER: Look = {
  skin: "glossy",
  colour: COLOURS.orange,
  wear: { eyes: "dots", mouth: "smile", nose: "none" },
};

export interface Layers {
  back: EmblemData;
  body: EmblemData;
  eyes: EmblemData;
  hat: EmblemData;
  hand: EmblemData;
}

const part = (look: Look, slot: Slot) => {
  const id = look.wear[slot];
  const def = id ? (CATALOG[slot] as Record<string, PartDef>)[id] : undefined;
  return def ? def.draw({ colour: look.colour }) : [];
};

export function dressLayers(look: Look): Layers {
  const skin = SKINS[look.skin] ?? SKINS.glossy;
  const back = look.wear.back ? BACKS[look.wear.back] : undefined;
  return {
    back: lifted(part(look, "back")),
    body: lifted([
      ...skin.draw(look.colour),
      ...part(look, "bottom"),
      ...part(look, "shoes"),
      ...part(look, "top"),
      ...(back?.front?.() ?? []),
      ...part(look, "nose"),
      ...part(look, "mouth"),
    ]),
    eyes: lifted(part(look, "eyes")),
    hat: lifted(part(look, "hat")),
    hand: lifted(part(look, "hand")),
  };
}

/** The whole figure as one drawing, in a BOX-sized box. */
export function dress(look: Look): EmblemData {
  const l = dressLayers(look);
  return [...l.back, ...l.body, ...l.eyes, ...l.hat, ...l.hand];
}

/** Some looks, for looking over. */
export const EMBLEMS: Record<string, EmblemData> = {
  starter: dress(STARTER),
  wizard: dress({
    skin: "glossy",
    colour: COLOURS.purple,
    wear: { eyes: "sparkly", mouth: "smile", hat: "wizard", top: "cardigan", bottom: "skirt", shoes: "boots", hand: "wand", back: "cape" },
  }),
  knight: dress({
    skin: "robot",
    colour: COLOURS.orange,
    wear: { eyes: "determined", mouth: "flat", hat: "viking", hand: "sword", back: "wings" },
  }),
  chef: dress({
    skin: "glossy",
    colour: COLOURS.white,
    wear: { eyes: "happy", mouth: "laugh", nose: "freckles", hat: "chef", top: "tee", bottom: "pants", shoes: "slippers", hand: "spatula" },
  }),
  royal: dress({
    skin: "statue",
    colour: COLOURS.orange,
    wear: { eyes: "cool", mouth: "smile", hat: "crown", hand: "shield", back: "cape" },
  }),
  cookie: dress({
    skin: "gingerbread",
    colour: COLOURS.orange,
    wear: { eyes: "icing", mouth: "icing", hat: "party", hand: "balloon" },
  }),
  student: dress({
    skin: "glossy",
    colour: COLOURS.pink,
    wear: { eyes: "sparkly", mouth: "cat", nose: "heart", hat: "bow", top: "sailor", bottom: "pleated", shoes: "dress", back: "backpack" },
  }),
  qipao: dress({
    skin: "mochi",
    colour: COLOURS.red,
    wear: { eyes: "wink", mouth: "kiss", hat: "flowers", top: "qipao", bottom: "skirt", shoes: "sandals", hand: "umbrella" },
  }),
  space: dress({
    skin: "galaxy",
    colour: COLOURS.blue,
    wear: { eyes: "star", mouth: "oh", hat: "halo", back: "jetpack" },
  }),
};

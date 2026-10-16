// Contact sheets for the wardrobe: the mascot wearing each item of a
// slot, or in each skin. For scripts/emblem-sheet.mjs, e.g.
//
//   node scripts/emblem-sheet.mjs src/features/mascot/preview.ts out.png HAT 100x130

import type { EmblemData } from "@/components/engraved/emblem";
import { CATALOG, STARTER, dress, type Look, type Slot } from "./dress";
import { COLOURS, SKINS } from "./skins";

/** Each item of a slot, worn by the starter mascot (or `on`). */
function sheet(slot: Slot, on: Partial<Look["wear"]> = {}): Record<string, EmblemData> {
  return Object.fromEntries(
    Object.keys(CATALOG[slot]).map((id) => [
      id,
      dress({ ...STARTER, wear: { ...STARTER.wear, ...on, [slot]: id } }),
    ]),
  );
}

export const EYES = sheet("eyes");
export const MOUTH = sheet("mouth");
export const NOSE = sheet("nose");
export const HAT = sheet("hat");
export const TOP = sheet("top", { bottom: "pants" });
export const BOTTOM = sheet("bottom", { top: "tee" });
export const SHOES = sheet("shoes", { bottom: "pants" });
export const HAND = sheet("hand");
export const BACK = sheet("back");
export const SKIN = Object.fromEntries(
  Object.keys(SKINS).map((id) => [id, dress({ ...STARTER, skin: id })]),
);
export const COLOUR = Object.fromEntries(
  Object.entries(COLOURS).map(([id, colour]) => [id, dress({ ...STARTER, colour })]),
);

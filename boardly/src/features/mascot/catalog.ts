// What the server needs to know of the wardrobe: every item's key
// ("hat:crown", "skin:gingerbread") and price, and the free colours.
// scripts/export-mascot-catalog.mjs writes it to
// backend/app/mascot_catalog.json; a test keeps the two in step.

import { CATALOG, type Slot } from "./dress";
import type { PartDef } from "./rig";
import { COLOURS, SKINS } from "./skins";

export interface CatalogPrices {
  colours: string[];
  items: Record<string, number>;
}

export function catalogPrices(): CatalogPrices {
  const items: Record<string, number> = {};
  for (const [id, skin] of Object.entries(SKINS)) items[`skin:${id}`] = skin.price;
  for (const [slot, parts] of Object.entries(CATALOG) as [Slot, Record<string, PartDef>][]) {
    for (const [id, part] of Object.entries(parts)) items[`${slot}:${id}`] = part.price;
  }
  return { colours: Object.values(COLOURS), items };
}

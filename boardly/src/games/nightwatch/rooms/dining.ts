// Seal the Manor's dining room: the long table laid for a feast under
// candelabra, high-backed chairs, the sideboard and the china cabinet,
// pictures, and the two goblets for the toast that work it (marked prop).
// Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import { flat, GOLD, lightPool, tone, type Shape } from "@/components/iso/kit";
import { planks, prop, shell } from "@/components/iso/room";
import {
  bouquet,
  chinaCabinet,
  decanter,
  dinnerTable,
  eveningSeascape,
  floorPatch,
  fruitBowl,
  giltFrame,
  goblet,
  highChair,
  jugStillLife,
  moonlitLandscape,
  placeSetting,
  sideboard,
  tableCandelabrum,
  tureen,
  vase,
  VELVET,
} from "@/components/iso/pieces";

export function dining(accent: string): Shape[] {
  const y = 0.28;
  const h = 0.24;
  const top = h + 0.002;
  const rm = y + 0.13;
  return [
    ...shell(),
    ...planks(),
    // the rug under the table: a crimson field in a gold-edged border
    floorPatch(0.08, 0.92, 0.1, 0.68, VELVET[2], GOLD[2]),
    floorPatch(0.11, 0.89, 0.13, 0.65, VELVET[1], GOLD[1]),
    floorPatch(0.16, 0.84, 0.18, 0.6, tone(VELVET[1], -0.12), tone(GOLD[2], -0.2)),
    { ...flat(0.095, 0.905, 0.115, 0.665, 0, "none", GOLD[1]), fill: undefined, dash: "0.6 1.4", strokeWidth: 0.8 },
    // walls: a moonlit landscape and a still life, a plate rack, a portrait over the sideboard
    ...giltFrame("x", 0.07, 0.3, 0.36, 0.62, moonlitLandscape),
    ...giltFrame("y", 0.08, 0.3, 0.38, 0.62, eveningSeascape),
    ...chinaCabinet(0.72, 0.012, 0.22, 0.1, 0.56),
    ...giltFrame("x", 0.7, 0.94, 0.38, 0.64, jugStillLife),
    // the sideboard, a tureen and flowers on it
    ...sideboard(0.03, 0.68, 0.15, 0.28, 0.24),
    ...vase(0.105, 0.73, 0.24, 0.02, 0.07),
    ...bouquet(0.105, 0.73, 0.31, 0.85),
    ...tureen(0.105, 0.84, 0.24, 0.04),
    ...decanter(0.105, 0.92, 0.24),
    // high-backed chairs along the far side, the long table laid for a feast
    ...[0.22, 0.45, 0.68].flatMap((cx) => highChair(cx, y - 0.11, "y0")),
    ...dinnerTable(0.16, y, 0.68, 0.26, h),
    ...[0.27, 0.5, 0.73].flatMap((px) => placeSetting(px, y + 0.05, top)),
    ...lightPool([0.5, 0.42, 0], 0.5),
    ...tableCandelabrum(0.3, rm, top, accent),
    ...fruitBowl(0.39, rm, top),
    // two goblets, for the toast
    ...prop(() => [...goblet(0.47, rm, top), ...goblet(0.54, rm, top)]),
    ...decanter(0.615, rm, top),
    ...tableCandelabrum(0.71, rm, top, accent),
    ...[0.3, 0.5, 0.7].flatMap((px) => placeSetting(px, y + 0.21, top)),
    ...placeSetting(0.795, rm, top),
    // the host's chair at the end
    ...highChair(0.865, y + 0.08, "x1"),
  ];
}

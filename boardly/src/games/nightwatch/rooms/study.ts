// Seal the Manor's study: a bookcase and its ladder, the globe, a desk
// under the draped window, a reading corner, and the ledger that works it
// (marked prop). Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import { box, cylinder, INK, lightPool, moon, P, tone, type Shape } from "@/components/iso/kit";
import { planks, prop, shell, windowOn } from "@/components/iso/room";
import {
  bookcase,
  brassCandlestick,
  brassSconce,
  bust,
  drapes,
  glassDecanter,
  globe,
  greekUrn,
  inkwell,
  ledger,
  libraryLadder,
  medallionRug,
  ornateFrame,
  PAGES,
  pedestalDesk,
  quill,
  seaChart,
  tripodTable,
  wingChair,
} from "@/components/iso/pieces";

export function study(accent: string): Shape[] {
  return [
    ...shell(),
    ...planks(),
    // the rug in the middle of the floor
    ...medallionRug(0.28, 0.62, 0.36, 0.76),
    // the window behind the desk, drapes and pelmet, the moon
    ...windowOn("y", 0.7, 0.9, 0.34, 0.5),
    moon(P(0.84, 0, 0.5)[0], P(0.84, 0, 0.5)[1], 1.8),
    ...drapes(0.64, 0.96, 0.28, 0.65),
    // a sea chart over the globe, a sconce over the armchair
    ...ornateFrame("x", 0.05, 0.27, 0.42, 0.62, seaChart, { crest: false, width: 0.022 }),
    ...brassSconce("x", 0.84, 0.46, accent),
    // the bookcase along the right wall
    ...bookcase(0.18, 0.42, 0.62),
    ...bust(0.29, 0.075, 0.676, 0.11),
    ...greekUrn(0.52, 0.07, 0.676, 0.085, ["#9AB8E8", "#3A5A9A", "#1A2A5A"]),
    ...libraryLadder(0.46, 0.08, 0.34, 0.58, 0.15),
    // the globe in the far corner
    ...globe(0.11, 0.21, 0.062, 0.31),
    // the desk under the window, its books, the ledger, the candle
    ...pedestalDesk(0.65, 0.18, 0.28, 0.22, 0.224),
    ...box(0.652, 0.175, 0.224, 0.072, 0.08, 0.013, [tone(PAGES[1], -0.05), "#2A3E6E", tone("#2A3E6E", -0.38)]),
    ...box(0.658, 0.18, 0.237, 0.06, 0.07, 0.011, [tone(PAGES[1], -0.05), "#6A3A1E", tone("#6A3A1E", -0.38)]),
    ...prop(() => ledger(0.69, 0.23, 0.224, 0.14, 0.14)),
    ...inkwell(0.88, 0.37, 0.224),
    ...quill(P(0.874, 0.366, 0.25)[0], P(0.874, 0.366, 0.25)[1], 0.75, 1),
    ...brassCandlestick(0.895, 0.22, 0.224, accent),
    ...lightPool([0.78, 0.46, 0], 0.4),
    // the reading corner: the armchair, a table with wine
    ...wingChair(0.04, 0.68, 0.22, 0.22),
    ...tripodTable(0.36, 0.84, 0.055, 0.2),
    ...glassDecanter(0.35, 0.83, 0.2),
    ...cylinder(0.38, 0.86, 0.2, 0.01, 0.02, [INK.glass, "#8E1A2E", "#5A0E1A"]),
  ];
}

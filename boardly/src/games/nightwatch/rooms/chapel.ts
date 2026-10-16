// Seal the Manor's chapel: a chequered stone floor with a crimson runner
// up to the altar on its two-step dais: a carved oak altar (panelled
// front, ivory cloth, a crimson frontal with gold fringe), the gilt cross
// with its ruby (marked prop), tall candlesticks, a gilded reredos, a rose
// window over it and stained lancets in both walls. Pews with carved ends
// and book ledges, the lectern with the Chapel's open record, and the
// font by the door. Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import { ball, box, inkOf, lightPool, paint, type Shape } from "@/components/iso/kit";
import { flags, prop, shell, tint } from "@/components/iso/room";
import {
  aisleRunner,
  altar,
  font,
  giltCandlestick,
  lectern,
  LIMESTONE,
  PALE_GILT,
  pew,
  roseWindow,
  RUBY,
  STAINED_GLASS,
  stainedWindow,
} from "@/components/iso/pieces";

/** Every other flagstone of a `count`-square floor a shade lighter. */
function chequer(count: number): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if ((i + j) % 2) continue;
      const [a, b, c, d] = [i / count, (i + 1) / count, j / count, (j + 1) / count];
      shapes.push(tint([[a, c, 0], [b, c, 0], [b, d, 0], [a, d, 0]], paint().tile, 0.55));
    }
  }
  return shapes;
}

export function chapel(accent: string): Shape[] {
  // border, field, border, medallion centre, medallion
  const glassA = [STAINED_GLASS.ruby, STAINED_GLASS.sapphire, STAINED_GLASS.amber, STAINED_GLASS.amber, STAINED_GLASS.emerald];
  const glassB = [STAINED_GLASS.amber, STAINED_GLASS.ruby, STAINED_GLASS.sapphire, STAINED_GLASS.amber, STAINED_GLASS.violet];
  return [
    ...shell(),
    ...chequer(6),
    ...flags(6),
    // stained glass in both walls: the light comes in coloured
    ...stainedWindow("y", 0.07, 0.23, 0.33, 0.47, glassA, "#E7A3C8"),
    ...stainedWindow("y", 0.77, 0.93, 0.33, 0.47, glassB, "#F2C46B"),
    ...stainedWindow("x", 0.07, 0.23, 0.33, 0.47, glassB, "#B9A3F0"),
    ...stainedWindow("x", 0.77, 0.93, 0.33, 0.47, glassA, "#9CC8FF"),
    // the rose window, crowning the cross
    ...roseWindow("y", 0.39, 0.6, 0.08),
    // the runner up the aisle, and the altar on its dais
    ...aisleRunner(0.43, 0.57, 0.31, 0.88),
    ...box(0.22, 0, 0, 0.56, 0.32, 0.025, LIMESTONE),
    ...box(0.27, 0, 0.025, 0.46, 0.26, 0.025, LIMESTONE),
    ...altar(0.33, 0.055, 0.05, 0.34, 0.16, 0.23),
    // tall candle stands either side of the altar
    ...giltCandlestick(0.24, 0.25, 0.025, 0.28, accent, 1.4),
    ...giltCandlestick(0.755, 0.1, 0.025, 0.28, accent, 1.4),
    ...giltCandlestick(0.37, 0.15, 0.282, 0.12, accent),
    ...giltCandlestick(0.63, 0.15, 0.282, 0.12, accent),
    ...lightPool([0.5, 0.32, 0], 0.45),
    // the gilt cross, its ruby at the crossing
    ...prop(() => [
      ...box(0.452, 0.09, 0.282, 0.096, 0.07, 0.016, PALE_GILT),
      ...box(0.468, 0.1, 0.298, 0.064, 0.05, 0.016, PALE_GILT),
      ...box(0.485, 0.11, 0.314, 0.03, 0.03, 0.166, PALE_GILT),
      ...box(0.42, 0.11, 0.48, 0.16, 0.03, 0.035, PALE_GILT),
      ...box(0.485, 0.11, 0.515, 0.03, 0.03, 0.105, PALE_GILT),
      ball([0.414, 0.14, 0.4975], 0.62, PALE_GILT[1], inkOf(PALE_GILT[1])),
      ball([0.586, 0.14, 0.4975], 0.62, PALE_GILT[1], inkOf(PALE_GILT[1])),
      ball([0.5, 0.14, 0.626], 0.62, PALE_GILT[1], inkOf(PALE_GILT[1])),
      ball([0.5, 0.141, 0.4975], 0.85, RUBY, inkOf(RUBY)),
      { ...ball([0.498, 0.141, 0.501], 0.25, "#FFFFFF"), opacity: 0.9 },
    ]),
    // the Chapel's record on its lectern
    ...lectern(0.135, 0.36, 0.25),
    // pews, and the font by the door
    ...pew(0.05, 0.42, 0.32),
    ...pew(0.6, 0.36, 0.22),
    ...pew(0.05, 0.6, 0.32),
    ...font(0.17, 0.88),
  ];
}

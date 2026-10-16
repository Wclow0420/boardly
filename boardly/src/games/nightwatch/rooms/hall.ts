// Seal the Manor's hall: a chequered marble floor with crimson runners
// and a gilt star, a banner and a moonlit landscape, a mirror over a gilt
// console, the long-case clock, the staircase, and the candelabrum that
// works it (marked prop). Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import { flat, GOLD, lightPool, line, paint, tone, type Shape } from "@/components/iso/kit";
import { prop, shell } from "@/components/iso/room";
import {
  banner,
  bouquet,
  consoleTable,
  floorPatch,
  floorStar,
  giltFrame,
  grandfatherClock,
  mirror,
  moonlitLandscape,
  staircase,
  torchere,
  vase,
  VELVET,
} from "@/components/iso/pieces";

export function hall(accent: string): Shape[] {
  const ink = paint();
  const floor: Shape[] = [
    // a dark inlaid border round a chequer of marble, a gilt star at its heart
    floorPatch(0.03, 0.97, 0.03, 0.97, tone(ink.floor, -0.3), GOLD[2]),
    floorPatch(0.065, 0.935, 0.065, 0.935, ink.floor, GOLD[1]),
  ];
  const N = 6;
  const a = 0.065;
  const cell = (1 - 2 * a) / N;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if ((i + j) % 2) continue;
      floor.push(floorPatch(a + i * cell, a + (i + 1) * cell, a + j * cell, a + (j + 1) * cell, ink.tile, ink.line));
      floor.push({ ...line([[a + i * cell + 0.02, a + j * cell + 0.03, 0], [a + i * cell + cell * 0.6, a + j * cell + cell * 0.55, 0], [a + (i + 1) * cell - 0.02, a + (j + 1) * cell - 0.04, 0]], "#FFFFFF", 0.4), opacity: 0.1 });
    }
  }
  // crimson runners from the two back doors to the star
  for (const along of ["x", "y"] as const) {
    const [x1, x2, y1, y2] = along === "x" ? [0.42, 0.58, 0, 0.4] : [0, 0.4, 0.42, 0.58];
    floor.push(floorPatch(x1, x2, y1, y2, VELVET[1], GOLD[1]));
    floor.push({ ...flat(x1 + 0.015, x2 - 0.015, y1 + 0.015, y2 - 0.015, 0, "none", GOLD[2]), fill: undefined, strokeWidth: 0.5 });
    floor.push({
      ...line(along === "x" ? [[x1 + 0.005, y2 + 0.006, 0], [x2 - 0.005, y2 + 0.006, 0]] : [[x2 + 0.006, y1 + 0.005, 0], [x2 + 0.006, y2 - 0.005, 0]], GOLD[1], 1.6),
      dash: "0.3 1.1",
    });
  }
  floor.push(...floorStar(0.5, 0.5, 0.12));

  return [
    ...shell(),
    ...floor,
    // the left wall: a banner, and a moonlit landscape over the stairs
    ...banner("x", 0.07, 0.27, 0.66, 0.3),
    ...giltFrame("x", 0.75, 0.95, 0.5, 0.68, moonlitLandscape),
    // the right wall: a mirror over a gilt console with a vase of flowers
    ...mirror("y", 0.1, 0.28, 0.32, 0.54),
    ...consoleTable(0.08, 0.02, 0.22, 0.1, 0.21),
    ...vase(0.25, 0.065, 0.21, 0.024, 0.085),
    ...bouquet(0.25, 0.065, 0.295, 1),
    // the long-case clock, and a fern in its urn in the corner
    ...grandfatherClock(0.73, 0.015, 0.14, 0.11),
    // the candelabrum that works the hall
    ...lightPool([0.3, 0.3, 0], 0.42),
    ...prop(() => torchere(0.28, 0.28, accent)),
    // the staircase up the left side
    ...staircase(0.02, 0.68, 0.23, 6, 0.05, 0.08),
  ];
}

// Seal the Manor's gallery: pictures in ornate frames along the walls,
// sculpture on plinths behind a rope line, the crown in its glass case,
// a bench, and the visitors' book with the quill that works it (marked
// prop). Furnished from the shared pieces (components/iso/pieces); see roomScenes.ts.

import { box, cylinder, flame, flat, lightPool, P, paint, type Shape } from "@/components/iso/kit";
import { flags, prop, shell, tint } from "@/components/iso/room";
import {
  BRASS,
  brassSconce,
  bust,
  crown,
  DEEP_VELVET,
  flowerStillLife,
  galleryBench,
  galleryRunner,
  greekUrn,
  landscape,
  manor,
  marblePlinth,
  moonlitSeascape,
  openBook,
  ornateFrame,
  PAGES,
  quill,
  ruin,
  stanchion,
  velvetRope,
  vitrine,
  writingTable,
} from "@/components/iso/pieces";

/** A checkered marble floor: every other square lighter. */
function checkerFloor(count = 8): Shape[] {
  const out: Shape[] = [];
  const s = 1 / count;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if ((i + j) % 2) continue;
      out.push(tint([[i * s, j * s, 0], [(i + 1) * s, j * s, 0], [(i + 1) * s, (j + 1) * s, 0], [i * s, (j + 1) * s, 0]], paint().tile, 0.75));
    }
  }
  return [...out, ...flags(count)];
}

export function gallery(accent: string): Shape[] {
  const [ix, iy] = P(0.69, 0.2, 0.25);
  const ropeZ = 0.15;
  return [
    ...shell(),
    ...checkerFloor(),
    // a runner from the door to the front
    ...galleryRunner(0.47, 0.61, 0.0, 0.97),
    // the long wall: a portrait, the great landscape, a still life
    ...ornateFrame("x", 0.07, 0.27, 0.36, 0.6, manor),
    ...brassSconce("x", 0.315, 0.42, accent),
    ...ornateFrame("x", 0.36, 0.72, 0.3, 0.64, landscape, { width: 0.032 }),
    ...brassSconce("x", 0.765, 0.42, accent),
    ...ornateFrame("x", 0.81, 0.95, 0.38, 0.58, ruin, { crest: false }),
    // the right wall: a small portrait, and a ship over the desk
    ...ornateFrame("y", 0.09, 0.27, 0.5, 0.67, flowerStillLife("#4A2A3A"), { crest: false }),
    ...ornateFrame("y", 0.72, 0.95, 0.36, 0.62, moonlitSeascape),
    // sculpture in the far corner: an urn, and a bust on a taller plinth
    ...marblePlinth(0.05, 0.05, 0.1, 0.1, 0.32),
    ...bust(0.1, 0.1, 0.32, 0.19),
    ...marblePlinth(0.2, 0.04, 0.08, 0.08, 0.16),
    ...greekUrn(0.24, 0.08, 0.16, 0.15),
    // the rope keeping visitors off the long wall
    ...stanchion(0.17, 0.3, 0.19),
    ...velvetRope([0.17, 0.3, ropeZ + 0.02], [0.17, 0.57, ropeZ + 0.02], 0.05),
    ...stanchion(0.17, 0.57, 0.19),
    ...velvetRope([0.17, 0.57, ropeZ + 0.02], [0.17, 0.84, ropeZ + 0.02], 0.05),
    ...stanchion(0.17, 0.84, 0.19),
    // the crown in its case, and a bench to look at the pictures from
    ...vitrine(0.27, 0.29, 0.18, 0.15, 0.17, 0.11, () => [
      { ...flat(0.275, 0.445, 0.295, 0.435, 0.19, DEEP_VELVET[1]), grad: { colors: [DEEP_VELVET[0], DEEP_VELVET[1], DEEP_VELVET[2]], from: P(0.27, 0.29, 0.19), to: P(0.45, 0.44, 0.19) } },
      ...crown(0.335, 0.385, 0.19, 0.04),
    ]),
    ...galleryBench(0.3, 0.54, 0.12, 0.3, 0.12),
    // the visitors' book on its table, the inkwell and the quill
    ...writingTable(0.66, 0.14, 0.28, 0.18, 0.22),
    ...openBook(0.74, 0.17, 0.221, 0.12, 0.11),
    ...box(0.665, 0.175, 0.221, 0.05, 0.05, 0.006, BRASS),
    ...cylinder(0.69, 0.2, 0.227, 0.017, 0.022, ["#3A4A7A", "#1E2A4E", "#0E1630"]),
    ...cylinder(0.69, 0.2, 0.249, 0.009, 0.004, BRASS),
    ...prop(() => quill(ix, iy)),
    ...cylinder(0.905, 0.28, 0.221, 0.02, 0.006, BRASS),
    ...cylinder(0.905, 0.28, 0.227, 0.006, 0.04, BRASS),
    ...cylinder(0.905, 0.28, 0.267, 0.013, 0.005, BRASS),
    ...box(0.893, 0.268, 0.272, 0.024, 0.024, 0.06, PAGES),
    ...flame([0.905, 0.28, 0.332], 2.2, accent),
    ...lightPool([0.8, 0.4, 0], 0.4),
  ];
}

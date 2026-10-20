// The mascot's rig: the meeple's body and the fixed points everything is
// fitted to, so any hat, shirt or wing sits on any skin. Parts are drawn
// in the body's own units (below); the figure is shown in a 100 × 130 box
// with the body lowered by LIFT, leaving room above the head for hats.
//
//   head      centre (50, 27.4), radius ~20.4 — top at y 8, chin ~y 44
//   face      eyes on y ~28 (x 43.4 and 56.6), mouth y ~34, cheeks y 33.4
//   neck      where the head meets the body: y 40 (x 34.2 to 65.8)
//   arms      out sideways; top edge y ~41–51, underside y ~62
//   hands     the arm ends, centred (14, 54) and (86, 54)
//   waist     y ~64–67 (x 27.4 to 72.6)
//   legs      from the waist down to the feet; crotch at (50, 83.2)
//   feet      soles at y 98.4; left foot x 18.6–45.6, right 54.4–81.4

import { mirrorPath, type EmblemData, type EmblemPart } from "@/components/engraved/emblem";

export type Hex = `#${string}`;

export const BOX: [number, number] = [100, 130];
/** How far the body sits below the top of the box: room for hats. */
export const LIFT = 20;

export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}Z`;

/** The piece: a big round head, arms out, two short stout legs. */
export const BODY =
  "M50 8C62 8 70.4 16.6 70.4 27.4C70.4 32.6 68.6 36.8 65.8 40C75.2 41.4 85.6 44.8 87.6 51.2C89.4 57.8 82 61 73.4 62C72.2 62.2 71.8 63.2 72.2 64.2L81.4 88.4C83.4 94 80.4 98.4 74.4 98.4H60.6C57.6 98.4 55.4 96.8 54.4 94.2L50 83.2L45.6 94.2C44.6 96.8 42.4 98.4 39.4 98.4H25.6C19.6 98.4 16.6 94 18.6 88.4L27.8 64.2C28.2 63.2 27.8 62.2 26.6 62C18 61 10.6 57.8 12.4 51.2C14.4 44.8 24.8 41.4 34.2 40C31.4 36.8 29.6 32.6 29.6 27.4C29.6 16.6 38 8 50 8Z";

/** The head alone (for hats that sit on it, or a hood). */
export const HEAD = ell(50, 27.4, 20.4, 19.4);

/** Where the held item is gripped: the right hand. */
export const GRIP: [number, number] = [86, 54];

/** A left-side part and its mirror image on the right. */
export function both(part: EmblemPart): EmblemPart[] {
  const W = BOX[0];
  if ("dark" in part) return [part, { ...part, dark: mirrorPath(part.dark, W) }];
  if ("line" in part) return [part, { ...part, line: mirrorPath(part.line, W) }];
  if ("jewel" in part) return [part, { ...part, x: W - part.x }];
  return [
    part,
    {
      ...part,
      d: mirrorPath(part.d, W),
      ...(part.vein ? { vein: mirrorPath(part.vein, W) } : {}),
      ...(part.shine ? { shine: mirrorPath(part.shine, W) } : {}),
    },
  ];
}

/** A soft see-through shade or light, laid over. */
export const shadeOver = (d: string, color: string, op: number): EmblemPart => ({
  d,
  m: color as Hex,
  ink: 0,
  op,
});

/** One wearable thing. `draw` gets the look's body colour (for things
 *  that match it) and returns parts in body units. */
export interface PartDef {
  name: string;
  /** In coins; 0 for the free starters. */
  price: number;
  draw: (body: { colour: string }) => EmblemPart[];
}

/** Every part moved down to sit in the box. */
export const lifted = (parts: EmblemData): EmblemData =>
  parts.map((part) => ({
    ...part,
    t: part.t ? `translate(0 ${LIFT}) ${part.t}` : `translate(0 ${LIFT})`,
  }));

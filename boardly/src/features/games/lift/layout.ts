// Where everything on the lift (the Games tab) sits, for a page w × h
// (above the tab bar) whose content starts at `top` (below the status
// bar). Plain numbers, shared by the art (art.ts), the canvases and the
// views laid over them.

import { BANK_SIZE } from "./banks";

export const SLAB = 12;
export const PEEK = 26;

/** The round brass studs either side of the bank's sign, and the hand
 *  button on the right plate. */
export const STUD_R = 13;
export const DIR_R = 17;

export function liftLayout(w: number, h: number, top: number) {
  const floors = BANK_SIZE;
  const cx = w / 2;
  // the floor dial: a semicircle over the lintel
  const R = Math.max(92, Math.min(122, (w - 160) / 2));
  const cy = top + 14 + R;
  const lintel = { y: cy, h: 40 };
  // the bank's sign under the dial, a stud either side to flip banks
  const sign = { x: cx - 70, y: cy + 6, w: 140, h: 30 };
  const studs = {
    left: { x: sign.x - STUD_R - 6, y: sign.y + sign.h / 2 },
    right: { x: sign.x + sign.w + STUD_R + 6, y: sign.y + sign.h / 2 },
  };
  const headerH = lintel.y + lintel.h;
  // the side plates either side of the dial: the call buttons, and the
  // way to the directory with the players chosen
  const pw = 62;
  const ph = 112;
  const side = (w / 2 - R) / 2;
  const panels = {
    left: { x: side - pw / 2 + 2, y: cy - ph - 2, w: pw, h: ph },
    right: { x: w - side - pw / 2 - 2, y: cy - ph - 2, w: pw, h: ph },
  };
  // the cab below: fluted pilasters either side of the opening, the sill
  const margin = 12;
  const pilaster = 22;
  const plaqueH = 172;
  const plaque = { x: margin + 2, y: h - plaqueH - 10, w: w - 2 * (margin + 2), h: plaqueH };
  const sill = 18;
  const opening = {
    x: margin + pilaster,
    y: headerH,
    w: w - 2 * (margin + pilaster),
    h: Math.max(160, plaque.y - 10 - sill - headerH),
  };
  const floorH = opening.h - 2 * (SLAB + PEEK);
  // the floors round the dial: from lower left to lower right
  const span = floors <= 1 ? 0 : Math.min(78, 13 * (floors - 1));
  // the emblems inside the number ring, smaller on a small dial
  const emblem = Math.min(25, R * 0.2);
  const emblemR = R - 35 - emblem * 0.5;
  // the bank's name in the dial's middle, on a cartouche over the hub
  const cw = Math.min(98, R * 0.8);
  const centre = { x: cx - cw / 2, y: cy - 21 - 17, w: cw, h: 17 };
  const stops = Array.from({ length: floors }, (_, i) => {
    const deg = floors <= 1 ? 0 : -span + (2 * span * i) / (floors - 1);
    const a = ((deg - 90) * Math.PI) / 180;
    return {
      deg,
      num: { x: cx + Math.cos(a) * (R - 19), y: cy + Math.sin(a) * (R - 19) },
      emblem: { x: cx + Math.cos(a) * emblemR, y: cy + Math.sin(a) * emblemR },
    };
  });
  return {
    w,
    h,
    top,
    cx,
    cy,
    R,
    lintel,
    sign,
    studs,
    centre,
    emblem,
    headerH,
    panels,
    margin,
    pilaster,
    plaque,
    sill,
    opening,
    floorH,
    pitch: floorH + SLAB,
    stops,
    span,
  };
}
export type LiftLayout = ReturnType<typeof liftLayout>;

/** The needle's angle (degrees from straight up) at a floor position. */
export function needleAngle(pos: number, floors: number, span: number) {
  "worklet";
  if (floors <= 1) return 0;
  return -span + (2 * span * pos) / (floors - 1);
}

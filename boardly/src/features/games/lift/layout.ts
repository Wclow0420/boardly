// Where everything on the lift (the Games tab) sits, for a page w × h
// (above the tab bar) whose content starts at `top` (below the status
// bar). Plain numbers, shared by the art (art.ts), the canvases and the
// views laid over them.

export const SLAB = 12;
export const PEEK = 26;

export function liftLayout(w: number, h: number, top: number, floors: number) {
  const cx = w / 2;
  // the floor dial: a semicircle over the lintel
  const R = Math.max(92, Math.min(122, (w - 176) / 2));
  const cy = top + 14 + R;
  const lintel = { y: cy, h: 40 };
  const sign = { x: cx - 78, y: cy + 6, w: 156, h: 30 };
  const headerH = lintel.y + lintel.h;
  // the side panels either side of the dial: call buttons, players
  const pw = 58;
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
  const stops = Array.from({ length: floors }, (_, i) => {
    const deg = floors <= 1 ? 0 : -span + (2 * span * i) / (floors - 1);
    const a = ((deg - 90) * Math.PI) / 180;
    return {
      deg,
      num: { x: cx + Math.cos(a) * (R - 19), y: cy + Math.sin(a) * (R - 19) },
      emblem: { x: cx + Math.cos(a) * (R - 46), y: cy + Math.sin(a) * (R - 46) },
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

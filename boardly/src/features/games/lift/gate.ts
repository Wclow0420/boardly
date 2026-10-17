// The lift's folding brass gate (the Games tab), drawn live: upright
// pickets with a scissor lattice between them, pinned where the straps
// cross, running in a brass channel top and foot, a knob on the leading
// picket. Folded open (`open` 0 → 1) the pickets bunch to the left and
// the straps stand steeper. Every strap is one path, stroked three times
// (ink, brass, a line of shine), so the whole gate is a handful of draws.

import { Skia, StrokeCap, PaintStyle, TileMode, type SkCanvas, type SkPaint, type SkPath } from "@shopify/react-native-skia";

const PICKETS = 7;
const RAIL = 7;

export interface GatePaths {
  pickets: SkPath;
  links: SkPath;
  pins: SkPath;
  knob: { x: number; y: number };
}

/** The gate's lattice for an opening w × h, folded `open` (0 shut). */
export function gatePaths(w: number, h: number, open: number): GatePaths {
  "worklet";
  const top = RAIL;
  const bot = h - RAIL;
  const shut = (w - 8) / (PICKETS - 1);
  const bay = shut * (1 - 0.86 * open);
  const rows = Math.max(4, Math.round((bot - top) / (shut * 1.75)));
  const rowH = (bot - top) / rows;
  const pickets = Skia.Path.Make();
  const links = Skia.Path.Make();
  const pins = Skia.Path.Make();
  for (let i = 0; i < PICKETS; i++) {
    const x = 4 + i * bay;
    pickets.moveTo(x, top - 2);
    pickets.lineTo(x, bot + 2);
    if (i === PICKETS - 1) break;
    const x2 = x + bay;
    for (let k = 0; k < rows; k++) {
      const y0 = top + k * rowH;
      const y1 = y0 + rowH;
      links.moveTo(x, y0);
      links.lineTo(x2, y1);
      links.moveTo(x, y1);
      links.lineTo(x2, y0);
      pins.addCircle((x + x2) / 2, (y0 + y1) / 2, 1.5);
    }
  }
  for (let i = 0; i < PICKETS; i++) {
    for (let k = 0; k <= rows; k++) pins.addCircle(4 + i * bay, top + k * rowH, 1.9);
  }
  return { pickets, links, pins, knob: { x: 4 + (PICKETS - 1) * bay, y: h * 0.52 } };
}

export interface GatePaints {
  inkLink: SkPaint;
  inkPicket: SkPaint;
  brassLink: SkPaint;
  brassPicket: SkPaint;
  shine: SkPaint;
  pin: SkPaint;
  pinInk: SkPaint;
  rail: SkPaint;
  railInk: SkPaint;
}

/** The gate's paints for an opening `h` tall (made once). */
export function gatePaints(h: number): GatePaints {
  const stroke = (color: string, width: number) => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeCap(StrokeCap.Round);
    p.setStrokeWidth(width);
    p.setColor(Skia.Color(color));
    return p;
  };
  const gold = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72", "#C8902E"].map((c) => Skia.Color(c));
  const brass = (width: number) => {
    const p = stroke("#E2B04A", width);
    p.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: 0, y: h }, gold, null, TileMode.Clamp));
    return p;
  };
  const shine = stroke("#FFFFFF", 0.7);
  shine.setAlphaf(0.7);
  const pin = Skia.Paint();
  pin.setAntiAlias(true);
  pin.setColor(Skia.Color("#F0CC72"));
  const pinInk = stroke("#3A2408", 0.6);
  const rail = Skia.Paint();
  rail.setAntiAlias(true);
  rail.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: 0, y: RAIL }, gold.slice(0, 3), null, TileMode.Mirror));
  return {
    inkLink: stroke("#3A2408", 3.4),
    inkPicket: stroke("#3A2408", 6),
    brassLink: brass(1.8),
    brassPicket: brass(4),
    shine, pin, pinInk, rail, railInk: stroke("#3A2408", 1) };
}

/** Draws the gate (its paths for this fold) over an opening w × h. */
export function drawGate(c: SkCanvas, g: GatePaths, P: GatePaints, w: number, h: number) {
  "worklet";
  // the straps, then the pickets over them, each inked, brass, shone
  c.drawPath(g.links, P.inkLink);
  c.drawPath(g.links, P.brassLink);
  c.drawPath(g.pickets, P.inkPicket);
  c.drawPath(g.pickets, P.brassPicket);
  c.save();
  c.translate(-1.2, 0);
  c.drawPath(g.pickets, P.shine);
  c.restore();
  c.drawPath(g.pins, P.pin);
  c.drawPath(g.pins, P.pinInk);
  // the channels it runs in, and the knob on the leading picket
  for (const y of [0, h - RAIL]) {
    c.drawRect(Skia.XYWHRect(0, y, w, RAIL), P.rail);
    c.drawRect(Skia.XYWHRect(0.5, y + 0.5, w - 1, RAIL - 1), P.railInk);
  }
  c.drawCircle(g.knob.x, g.knob.y, 5.4, P.pin);
  c.drawCircle(g.knob.x, g.knob.y, 5.4, P.railInk);
  c.drawCircle(g.knob.x - 1.6, g.knob.y - 1.8, 1.4, P.shine);
}

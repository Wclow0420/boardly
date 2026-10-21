// Where everything stands on the Me page, for a page w × h whose content
// starts `top` down (under the status bar): the lobby of the Boardly
// building, seen flat on. The marquee under the header, the floor dial
// over the lift's door, the door between its brass pilasters, the floor
// running toward us, and my meeple on the brass medallion in the
// spotlight, the hero of the page, the lift a low backdrop behind it.
// The side columns of round buttons, the room key and the
// PLAY button sit over it. Plain numbers (no Skia), shared by the art,
// the live layer and the page.

import { BOX } from "@/features/mascot/rig";

/** Where the feet stand in the mascot's box, as a share of its height. */
export const FEET_K = 118.4 / BOX[1];

export interface Pos {
  x: number;
  y: number;
}

export interface MeLayout {
  w: number;
  h: number;
  top: number;
  cx: number;
  /** The cornice along the ceiling. */
  cornice: number;
  /** The marquee sign's face (its stepped crest stands above it). */
  marquee: { x: number; y: number; w: number; h: number };
  /** The marquee's bulbs, round its moulding. */
  bulbs: Pos[];
  /** The floor dial: a half disc standing on (cx, dial.y), radius R. */
  dial: { y: number; R: number };
  /** The sunburst fanning up behind the dial. */
  fan: number;
  /** The door's frame: lintel, pilasters, and the opening between. */
  frame: { x: number; w: number; lintel: number; lintelH: number; pil: number };
  opening: { x: number; y: number; w: number; h: number };
  /** Where the wall meets the floor, and the top of the wainscot. */
  floorY: number;
  dado: number;
  /** The horizon the floor's lines run to. */
  horizon: number;
  /** The brass medallion in the floor (centre, radii). */
  medallion: { x: number; y: number; rx: number; ry: number };
  /** My meeple: its box's top-left and width. */
  mascot: { x: number; y: number; w: number; h: number };
  /** The spotlight: its top edge (narrow) and its foot (wide). */
  beam: { top: number; topW: number; foot: number; footW: number };
  /** The two wall lamps on the pilasters. */
  sconces: Pos[];
  /** The round buttons down each side: centres, size. */
  button: number;
  left: Pos[];
  right: Pos[];
  /** The big PLAY button and the room key above it. */
  play: { x: number; y: number; w: number; h: number };
  key: { x: number; y: number; w: number; h: number };
}

const r = (n: number) => Math.round(n * 2) / 2;

export function meLayout(w: number, h: number, top: number): MeLayout {
  const cx = w / 2;
  const wide = w >= 400;

  // the bottom: PLAY, the key over it, the medallion over the key
  const playW = Math.min(268, Math.round(w * 0.62));
  const playH = 60;
  const play = { x: r(cx - playW / 2), y: h - playH - 14, w: playW, h: playH };
  const keyW = Math.min(236, Math.round(w * 0.58));
  const keyH = 36;
  const key = { x: r(cx - keyW / 2), y: play.y - keyH - 8, w: keyW, h: keyH };

  // the lift behind me: a low door with the marquee hung over its
  // sunburst, clear of the header; the floor meets the wall a little
  // behind my feet
  const marqueeH = 44;
  const marqueeTop = top + 80; // its crest clears the name plate
  const R = wide ? 30 : 28;
  const fan = R + 34;
  const pil = 13;
  const lintelH = 14;
  // where it all stands for a meeple `mw` wide
  const place = (mw: number) => {
    const mh = (mw * BOX[1]) / BOX[0];
    const rx = r(mw * 0.58);
    const ry = r(rx * 0.26);
    const medY = r(key.y - ry - 12);
    const floorY = r(medY - Math.max(56, mh * 0.2));
    const wanted = Math.max(150, Math.min(246, (floorY - (marqueeTop + marqueeH)) * 0.66));
    // the dial stays under the marquee
    const dialY = r(Math.max(floorY - wanted - lintelH, marqueeTop + marqueeH + 8 + fan));
    return { mh, rx, ry, medY, floorY, dialY };
  };
  // me, the hero: a big meeple on the medallion just above the key, its
  // hat just under the lift's dial so the dial still shows
  let mw = Math.round(Math.min(w * 0.62, 260, (h - top) * 0.36));
  let at = place(mw);
  for (let i = 0; i < 3 && at.medY + 4 - at.mh * FEET_K < at.dialY - 2; i++) {
    const room = at.medY + 4 - (at.dialY - 2);
    mw = Math.floor((room / FEET_K) * (BOX[0] / BOX[1]));
    at = place(mw);
  }
  const { mh, rx, ry, medY, floorY, dialY } = at;
  const mascot = { x: r(cx - mw / 2), y: r(medY + 4 - mh * FEET_K), w: mw, h: mh };
  const medallion = { x: cx, y: medY, rx, ry };

  const doorH = floorY - dialY - lintelH;
  const openingY = dialY + lintelH;
  const frameW = Math.min(Math.round(w * 0.42), 184);
  const frame = { x: r(cx - frameW / 2), w: frameW, lintel: dialY, lintelH, pil };
  const opening = { x: frame.x + pil, y: openingY, w: frameW - 2 * pil, h: doorH };
  const dado = r(floorY - Math.min(80, doorH * 0.32));
  const horizon = r(opening.y + opening.h * 0.42);

  // the marquee hung just over the sunburst
  const marqueeW = Math.min(268, w - 156);
  const marquee = {
    x: r(cx - marqueeW / 2),
    y: r(dialY - fan - 8 - marqueeH),
    w: marqueeW,
    h: marqueeH,
  };

  const beam = { top: opening.y + 2, topW: opening.w * 0.42, foot: medY, footW: rx * 2.1 };

  // the marquee's bulbs, every ~15 points round its moulding
  const bulbs: Pos[] = [];
  const inset = 5;
  const bx0 = marquee.x + inset;
  const by0 = marquee.y + inset;
  const bw = marquee.w - 2 * inset;
  const bh = marquee.h - 2 * inset;
  const across = Math.max(6, Math.round(bw / 15));
  const down = Math.max(2, Math.round(bh / 15));
  for (let i = 0; i <= across; i++) bulbs.push({ x: r(bx0 + (bw * i) / across), y: by0 });
  for (let i = 1; i <= down; i++) bulbs.push({ x: bx0 + bw, y: r(by0 + (bh * i) / down) });
  for (let i = across - 1; i >= 0; i--) bulbs.push({ x: r(bx0 + (bw * i) / across), y: by0 + bh });
  for (let i = down - 1; i >= 1; i--) bulbs.push({ x: bx0, y: r(by0 + (bh * i) / down) });

  const sconceY = r(opening.y + Math.min(48, opening.h * 0.24));
  const sconces = [
    { x: frame.x + pil / 2, y: sconceY },
    { x: frame.x + frameW - pil / 2, y: sconceY },
  ];

  // the round buttons: small, in two neat columns under the header
  const button = wide ? 48 : 44;
  const col = 16 + button / 2 + 4;
  const first = top + 76 + button / 2;
  const step = button + 30;
  const left = [0, 1, 2].map((i) => ({ x: col, y: first + i * step }));
  const right = [0, 1, 2].map((i) => ({ x: w - col, y: first + i * step }));

  return {
    w,
    h,
    top,
    cx,
    cornice: top - 2,
    marquee,
    bulbs,
    dial: { y: dialY, R },
    fan,
    frame,
    opening,
    floorY,
    dado,
    horizon,
    medallion,
    mascot,
    beam,
    sconces,
    button,
    left,
    right,
    play,
    key,
  };
}

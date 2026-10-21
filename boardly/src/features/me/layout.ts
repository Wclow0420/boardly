// Where everything stands on the Me page, for a page w × h whose content
// starts `top` down (under the status bar): the lobby of the Boardly
// building, seen flat on. The marquee under the header, the floor dial
// over the lift's door, the door between its brass pilasters, the floor
// running toward us, and my meeple on the brass medallion in the
// spotlight. The side columns of round buttons, the room key and the
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
  /** The palms in the two bottom corners: the planter's foot, centre. */
  palms: { x: number; y: number; s: number; flip: boolean }[];
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
  const medY = r(key.y - Math.max(30, h * 0.045));

  // the top: the marquee under the header, the dial under the marquee
  const marqueeW = Math.min(268, w - 148);
  const marquee = { x: r(cx - marqueeW / 2), y: top + 66, w: marqueeW, h: 44 };
  const R = wide ? 40 : 36;
  const dialY = marquee.y + marquee.h + 12 + R;

  // the door from under the dial down to the floor
  const floorY = r(medY - Math.max(78, h * 0.115));
  const frameW = Math.min(Math.round(w * 0.46), 200);
  const pil = 14;
  const lintelH = 16;
  const frame = { x: r(cx - frameW / 2), w: frameW, lintel: dialY, lintelH, pil };
  const opening = {
    x: frame.x + pil,
    y: dialY + lintelH,
    w: frameW - 2 * pil,
    h: floorY - (dialY + lintelH),
  };
  const dado = r(floorY - Math.min(96, (floorY - opening.y) * 0.3));
  const horizon = r(opening.y + opening.h * 0.42);

  // me, on the medallion
  const mw = Math.round(Math.min(w * 0.4, 172, (medY - opening.y) * 0.52));
  const mh = (mw * BOX[1]) / BOX[0];
  const mascot = { x: r(cx - mw / 2), y: r(medY + 4 - mh * FEET_K), w: mw, h: mh };
  const rx = r(mw * 0.74);
  const medallion = { x: cx, y: medY, rx, ry: r(rx * 0.27) };

  const beam = { top: opening.y + 2, topW: opening.w * 0.42, foot: medY, footW: rx * 2.3 };

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

  const sconceY = r(opening.y + Math.min(70, opening.h * 0.24));
  const sconces = [
    { x: frame.x + pil / 2, y: sconceY },
    { x: frame.x + frameW - pil / 2, y: sconceY },
  ];

  const ps = wide ? 1 : 0.88;
  const palmY = r(Math.min(h - 6, medY + 64 * ps));
  const palms = [
    { x: r(30 * ps + 4), y: palmY, s: ps, flip: false },
    { x: r(w - 30 * ps - 4), y: palmY, s: ps, flip: true },
  ];

  const button = wide ? 62 : 56;
  const col = 14 + button / 2;
  const first = top + 80 + button / 2;
  const step = button + 34;
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
    fan: Math.min(frameW / 2 + 18, R + 70),
    frame,
    opening,
    floorY,
    dado,
    horizon,
    medallion,
    mascot,
    beam,
    sconces,
    palms,
    button,
    left,
    right,
    play,
    key,
  };
}

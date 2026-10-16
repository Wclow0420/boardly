// Still art made once and kept: SVG markup baked into images, and
// badges recorded into pictures, remembered for as long as the app runs.
// Opening a page again costs nothing to redraw, and a board of badges is
// one canvas drawing a handful of images instead of dozens of views. 

import { Skia, type SkImage, type SkPicture, type SkSVG } from "@shopify/react-native-skia";
import { PixelRatio } from "react-native";

import { toSvg, toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { emblemData } from "@/components/icons";
import type { BadgeArt, BadgeStyle, BadgeTier } from "./types";

const images = new Map<string, SkImage | null>();

/** `markup` (w × h) baked into an image, crisp at the screen's density;
 *  made once per `key`. */
export function bakedSvg(key: string, w: number, h: number, markup: () => string): SkImage | null {
  const k = `${key}|${Math.round(w)}x${Math.round(h)}`;
  if (images.has(k)) return images.get(k)!;
  const scale = Math.max(2, PixelRatio.get());
  // the markup's own size would win over the size asked for: say w × h
  const svg = Skia.SVG.MakeFromString(
    markup().replace(/^(\s*<svg\b[^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, `$1 width="${w}" height="${h}"`),
  );
  const surface = Skia.Surface.Make(Math.ceil(w * scale), Math.ceil(h * scale));
  let image: SkImage | null = null;
  if (svg && surface) {
    const c = surface.getCanvas();
    c.scale(scale, scale);
    c.drawSvg(svg, w, h);
    surface.flush();
    image = surface.makeImageSnapshot();
  }
  images.set(k, image);
  return image;
}

// ── badges ──────────────────────────────────────────────────────────

/** A locked badge, struck in dark iron: its own light and shade, grey
 *  and dim, a little cool. */
export const IRON = [
  0.16, 0.5, 0.05, 0, 0.02,
  0.17, 0.52, 0.05, 0, 0.02,
  0.18, 0.56, 0.06, 0, 0.03,
  0, 0, 0, 1, 0,
];

const styleIds = new WeakMap<BadgeStyle, number>();
let nextStyle = 0;
const styleId = (frames: BadgeStyle) => {
  if (!styleIds.has(frames)) styleIds.set(frames, nextStyle++);
  return styleIds.get(frames)!;
};

const svgs = new Map<string, SkSVG | null>();
const svgOnce = (key: string, make: () => string) => {
  if (!svgs.has(key)) svgs.set(key, Skia.SVG.MakeFromString(make()));
  return svgs.get(key)!;
};
const box120 = (data: EmblemData, tint: string, id: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${toSvgBody(data, tint, id)}</svg>`;

export interface BadgeLook {
  art: BadgeArt;
  tier: BadgeTier;
  frames: BadgeStyle;
  /** The disc's enamel. */
  tint: string;
}

/** A badge's parts as SVG, parsed once each: the frame under the emblem,
 *  over it, and the emblem (`box` wide, centred on the disc). */
export function badgeSvgs({ art, tier, frames, tint }: BadgeLook) {
  const frame = frames(tier);
  const base = `${styleId(frames)}|${tier}|${tint}`;
  const found = art.emoji ? emblemData(art.emoji) : null;
  const box = frame.face * 1.5;
  return {
    frame,
    box,
    back: svgOnce(`${base}|back`, () => box120(frame.back, tint, "b")),
    front: frame.front ? svgOnce(`${base}|front`, () => box120(frame.front!, tint, "f")) : null,
    emblem: found
      ? svgOnce(`e|${art.emoji}|${box}`, () => toSvg(found.data, box, found.tint))
      : null,
  };
}

const pictures = new Map<string, SkPicture>();

/** A still badge (in the 120 box), recorded once: its frame, emblem and
 *  front, struck in iron when `locked`. */
export function badgePicture(look: BadgeLook, locked: boolean): SkPicture {
  const key = `${styleId(look.frames)}|${look.tier}|${look.tint}|${look.art.emoji}|${locked}`;
  const cached = pictures.get(key);
  if (cached) return cached;
  const { back, front, emblem, box } = badgeSvgs(look);
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, 120, 120));
  if (locked) {
    const paint = Skia.Paint();
    paint.setColorFilter(Skia.ColorFilter.MakeMatrix(IRON));
    c.saveLayer(paint);
  }
  if (back) c.drawSvg(back, 120, 120);
  if (emblem) {
    c.save();
    c.translate(60 - box / 2, 60 - box / 2);
    c.drawSvg(emblem, box, box);
    c.restore();
  }
  if (front) c.drawSvg(front, 120, 120);
  if (locked) c.restore();
  const picture = recorder.finishRecordingAsPicture();
  pictures.set(key, picture);
  return picture;
}

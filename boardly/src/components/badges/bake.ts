// Still art made once and kept: SVG markup baked into images, and
// badges recorded into pictures, remembered for as long as the app runs.
// Opening a page again costs nothing to redraw, and a board of badges is
// one canvas drawing a handful of images instead of dozens of views. 

import { onMemoryWarning } from "@/utils/memory";
import { Skia, type SkCanvas, type SkImage, type SkPicture, type SkSVG } from "@shopify/react-native-skia";
import { PixelRatio } from "react-native";

import { toSvg, toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { emblemData } from "@/components/icons";
import type { BadgeArt, BadgeStyle, BadgeTier } from "./types";

const images = new Map<string, { image: SkImage | null; bytes: number }>();
let held = 0;
/** How much baked art is kept, in bytes of pixels: past it the images
 *  least recently asked for are let go (anything still on screen keeps
 *  its own). Keeps a long evening of games from filling the memory. */
const BUDGET = 64 * 1024 * 1024;

/** `markup` (w × h) baked into an image, crisp at the screen's density;
 *  made once per `key` and size, and kept while there's room. */
/** A drawing (made on a canvas in w × h points) baked into an image,
 *  crisp at the screen's density; made once per `key` and size and kept
 *  with the rest, within the same budget. */
export function bakedDrawing(key: string, w: number, h: number, draw: (canvas: SkCanvas) => void): SkImage | null {
  const k = `draw|${key}|${Math.round(w)}x${Math.round(h)}`;
  const hit = images.get(k);
  if (hit) {
    images.delete(k);
    images.set(k, hit);
    return hit.image;
  }
  const scale = Math.max(2, PixelRatio.get());
  const surface = Skia.Surface.Make(Math.ceil(w * scale), Math.ceil(h * scale));
  let image: SkImage | null = null;
  if (surface) {
    const c = surface.getCanvas();
    c.scale(scale, scale);
    draw(c);
    surface.flush();
    image = surface.makeImageSnapshot();
  }
  keep(k, image, Math.ceil(w * scale) * Math.ceil(h * scale) * 4);
  return image;
}

function keep(k: string, image: SkImage | null, bytes: number) {
  images.set(k, { image, bytes });
  held += bytes;
  while (held > BUDGET && images.size > 1) {
    const [oldest, entry] = images.entries().next().value!;
    images.delete(oldest);
    held -= entry.bytes;
  }
}

/** The markup's own size would win over the size asked for: say w × h. */
const sized = (markup: string, w: number, h: number) =>
  markup.replace(/^(\s*<svg\b[^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, `$1 width="${w}" height="${h}"`);

export function bakedSvg(key: string, w: number, h: number, markup: () => string): SkImage | null {
  const k = `${key}|${Math.round(w)}x${Math.round(h)}`;
  const hit = images.get(k);
  if (hit) {
    images.delete(k);
    images.set(k, hit);
    return hit.image;
  }
  const scale = Math.max(2, PixelRatio.get());
  const svg = Skia.SVG.MakeFromString(sized(markup(), w, h));
  const surface = Skia.Surface.Make(Math.ceil(w * scale), Math.ceil(h * scale));
  let image: SkImage | null = null;
  if (svg && surface) {
    const c = surface.getCanvas();
    c.scale(scale, scale);
    c.drawSvg(svg, w, h);
    surface.flush();
    image = surface.makeImageSnapshot();
  }
  keep(k, image, Math.ceil(w * scale) * Math.ceil(h * scale) * 4);
  return image;
}

// ── still pictures ──────────────────────────────────────────────────

/** Recorded drawings, kept like the images but costing next to nothing:
 *  a picture is the list of what to draw, not its pixels. */
const stills = new Map<string, SkPicture | null>();
const STILLS = 160;

function keepStill(k: string, picture: SkPicture | null) {
  stills.set(k, picture);
  while (stills.size > STILLS) stills.delete(stills.keys().next().value!);
}

/** `markup` (w × h) recorded once into a picture, for a canvas that draws
 *  it once and never again (still, or moved only by native transforms of
 *  its view). Such a canvas already holds the pixels it drew: a baked
 *  image of the same art would be a second copy (and a third, uploaded to
 *  the GPU) kept for nothing. Parsed once per `key` and size and kept, so
 *  a page opens as fast as with an image. A canvas that redraws every
 *  frame (something on it moves) wants `bakedSvg` instead. */
export function stillSvg(key: string, w: number, h: number, markup: () => string): SkPicture | null {
  const k = `${key}|${Math.round(w)}x${Math.round(h)}`;
  if (stills.has(k)) {
    const hit = stills.get(k)!;
    stills.delete(k);
    stills.set(k, hit);
    return hit;
  }
  const svg = Skia.SVG.MakeFromString(sized(markup(), w, h));
  let picture: SkPicture | null = null;
  if (svg) {
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, w, h));
    c.drawSvg(svg, w, h);
    picture = recorder.finishRecordingAsPicture();
  }
  keepStill(k, picture);
  return picture;
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
onMemoryWarning(() => {
  images.clear();
  held = 0;
  stills.clear();
  svgs.clear();
  pictures.clear();
});

/** A still badge (in the 120 box), recorded once: its frame, emblem and
 *  front, struck in iron when `locked`. */
/** A still badge baked into an image `size` points square: what a grid
 *  or a card of badges draws (one image each, kept). */
export function badgeImage(look: BadgeLook, locked: boolean, size: number): SkImage | null {
  const key = `badge|${styleId(look.frames)}|${look.tier}|${look.tint}|${look.art.emoji}|${locked}`;
  return bakedDrawing(key, size, size, (c) => {
    c.scale(size / 120, size / 120);
    c.drawPicture(badgePicture(look, locked));
  });
}

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

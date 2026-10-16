// A still drawing of shapes, for pictures that never move (box lids,
// thumbnails, rules pages, choice cards): recorded once and baked into an
// image, kept with the app's other baked art, so a screen of them costs
// one image each — not, as plain SVG did, hundreds of native views per
// picture rebuilt every time a screen opens.

import { Canvas, Image } from "@shopify/react-native-skia";
import { View } from "react-native";

import { bakedDrawing } from "@/components/badges/bake";
import { recordShapes } from "./IsoCanvas";
import type { Shape } from "./kit";

/** Ids for drawings without a key of their own: one per shapes array. */
const ids = new WeakMap<Shape[], string>();
const keyFor = (shapes: Shape[]) => {
  let key = ids.get(shapes);
  if (!key) {
    key = `iso${next++}`;
    ids.set(shapes, key);
  }
  return key;
};
let next = 0;

/** The width a picture shown `size` wide is baked at. */
export const bakeWidth = (size: number) => [128, 256, 384].find((w) => w >= size) ?? Math.ceil(size);

export function IsoPicture({
  shapes,
  width,
  height,
  size,
  cacheKey,
}: {
  /** The shapes, or how to make them: then they are only made when the
   *  picture isn't already baked (give it a `cacheKey`). */
  shapes: Shape[] | (() => Shape[]);
  /** The drawing's own size. */
  width: number;
  height: number;
  /** Width on the page; the height follows. */
  size: number;
  /** What the drawing is ("room|chapel"): the same key is baked once for
   *  every screen showing it. Without one, it's baked once per array. */
  cacheKey?: string;
}) {
  const h = (size * height) / width;
  const key = cacheKey ?? (typeof shapes === "function" ? "unkeyed" : keyFor(shapes));
  // baked at the next of a few set widths and drawn scaled down, so a box
  // on the shelf and the same box on the profile share one image
  const bw = bakeWidth(size);
  const bh = (bw * height) / width;
  const image = bakedDrawing(`isopic|${key}`, bw, bh, (canvas) => {
    canvas.scale(bw / width, bw / width);
    canvas.drawPicture(recordShapes(typeof shapes === "function" ? shapes() : shapes));
  });
  return (
    <View style={{ width: size, height: h }} pointerEvents="none">
      <Canvas style={{ width: size, height: h }}>
        {image ? <Image image={image} x={0} y={0} width={size} height={h} /> : null}
      </Canvas>
    </View>
  );
}

// A still mascot, drawn as one recorded Skia picture: a single draw
// however much it wears, where the same figure in SVG is ~100 native
// views with a gradient each. For grids of mascots (the wardrobe's
// cards). Pictures are kept by look, so a card that didn't change is
// never drawn twice.

import { onMemoryWarning } from "@/utils/memory";
import { Canvas, Group, Picture, type SkPicture } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";

import { recordEmblem } from "@/components/engraved/picture";
import { dress, type Look } from "./dress";
import { BOX } from "./rig";

const CACHE = new Map<string, SkPicture>();
const LIMIT = 80;
onMemoryWarning(() => CACHE.clear());

/** The look's picture, from the cache or recorded now. */
export function pictureOf(look: Look): SkPicture {
  const key = JSON.stringify(look);
  let picture = CACHE.get(key);
  if (!picture) {
    picture = recordEmblem(dress(look), undefined, BOX);
    if (CACHE.size >= LIMIT) CACHE.delete(CACHE.keys().next().value as string);
    CACHE.set(key, picture);
  }
  return picture;
}

export const MascotThumb = memo(function MascotThumb({ look, width }: { look: Look; width: number }) {
  const picture = useMemo(() => pictureOf(look), [look]);
  const scale = width / BOX[0];
  return (
    <Canvas style={{ width, height: BOX[1] * scale }} pointerEvents="none">
      <Group transform={[{ scale }]}>
        <Picture picture={picture} />
      </Group>
    </Canvas>
  );
});

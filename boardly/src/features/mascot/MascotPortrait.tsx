// A mascot's head and shoulders, still: for the profile circle, friend
// lists, the lobby and the tab bar. One cached Skia picture (shared with
// the wardrobe's cards), so a long list of circles costs one draw each
// rather than ~100 SVG views apiece.

import { Canvas, Group, Picture } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";

import type { MascotLook } from "@/api/client";
import { PORTRAIT, asLook } from "./dress";
import { pictureOf } from "./MascotThumb";

export const MascotPortrait = memo(function MascotPortrait({
  look,
  size,
}: {
  look?: MascotLook | null;
  size: number;
}) {
  const picture = useMemo(() => pictureOf(asLook(look)), [look]);
  const [x, y, w, h] = PORTRAIT;
  const scale = size / w;
  return (
    <Canvas style={{ width: size, height: h * scale }} pointerEvents="none">
      <Group transform={[{ scale }, { translateX: -x }, { translateY: -y }]}>
        <Picture picture={picture} />
      </Group>
    </Canvas>
  );
});

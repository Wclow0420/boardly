// Liar's Dice's box lid: the pub's back bar, the dice shaker behind the
// counter, a cup slammed down and another tipped over beside its dice
// (art in lidArt.ts). Still: baked once at a few set widths and shared
// by every lid showing it.

import { Canvas, Image } from "@shopify/react-native-skia";
import { View } from "react-native";

import { bakedSvg } from "@/components/badges/bake";
import { LID_H, LID_W, lidArt } from "./lidArt";

/** The width a lid shown `size` wide is baked at (as IsoPicture does):
 *  a box on the felt and the same box on a profile share one image. */
const bakeWidth = (size: number) => [128, 256, 384].find((w) => w >= size) ?? Math.ceil(size);

export function PubBoxArt({ width }: { width: number }) {
  const height = (width * LID_H) / LID_W;
  const bw = bakeWidth(width);
  const image = bakedSvg("liarsdice-box", bw, (bw * LID_H) / LID_W, () => lidArt(bw));
  return (
    <View style={{ width, height }} pointerEvents="none">
      <Canvas style={{ width, height }}>
        {image ? <Image image={image} x={0} y={0} width={width} height={height} /> : null}
      </Canvas>
    </View>
  );
}

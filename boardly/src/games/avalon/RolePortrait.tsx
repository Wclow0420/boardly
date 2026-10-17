// A role as the game draws it: the top of its card face — the arched
// window with the role's engraved portrait, over the brass plaque —
// cropped so the portrait reads at the size of a rules card. One baked
// picture per role and size.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { View } from "react-native";

import { bakedSvg } from "@/components/badges/bake";
import { faceSvg } from "./cards";
import type { Role } from "./logic";

/** The part of the card shown, in the card's own units. */
const CROP = { x: 9, y: 5, w: 82, h: 72 };

/** The role's card window, `size` wide. */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  const h = Math.round((size * CROP.h) / CROP.w);
  const face = bakedSvg(`agency-window|${role}`, size, h, () =>
    faceSvg(role).replace(
      /^<svg([^>]*?)\swidth="[^"]*"\s+height="[^"]*"\s+viewBox="[^"]*"/,
      `<svg$1 width="${CROP.w}" height="${CROP.h}" viewBox="${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}"`,
    ),
  );
  return (
    <View style={{ width: size, height: h }} pointerEvents="none">
      <Canvas style={{ width: size, height: h }}>
        {face ? <SkImage image={face} x={0} y={0} width={size} height={h} /> : null}
      </Canvas>
    </View>
  );
}

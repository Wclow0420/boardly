import { Image, StyleSheet, View } from "react-native";

// The painted surface used across the app: soft cloudy mottling with a
// fine crinkle, like the hand-painted panels. It is a transparent image
// of light and dark marks only, so it sits over any fill colour. Replace
// assets/ui/textures/painted.png to change the material everywhere.
const TEXTURES = {
  painted: require("../../../assets/ui/textures/painted.png"),
  // Woven cloth, for the blue felt panels
  felt: require("../../../assets/ui/textures/felt.png"),
};

export type TextureKind = keyof typeof TEXTURES;

const DEFAULT_OPACITY: Record<TextureKind, number> = { painted: 0.5, felt: 0.45 };

export interface TextureProps {
  /** Which material (default "painted"). */
  kind?: TextureKind;
  /** How strongly the material shows. */
  opacity?: number;
  /** Corner radius of the surface it covers, inside any border. */
  radius?: number;
}

/** Material laid over a surface's fill. Put it first inside the surface
 *  so the content draws on top. */
export function Texture({
  kind = "painted",
  opacity,
  radius = 0,
}: TextureProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.fill,
        { borderRadius: radius, opacity: opacity ?? DEFAULT_OPACITY[kind] },
      ]}
    >
      <Image
        source={TEXTURES[kind]}
        resizeMode="repeat"
        style={styles.image}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
});

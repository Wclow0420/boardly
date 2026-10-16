// A playing card in the house style, for any game: the back in the
// game's colours with the Boardly meeple in the middle (the same on every
// card in the app), the front a gilt frame with a window for the card's
// picture and a plaque for its name (cardArt.ts). The art is baked once;
// `flip` (0 back, 1 front) turns it over in 3D on the native thread.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { CARD_H, CARD_W, cardBack, cardFront, type BackStyle, type FrontStyle } from "./cardArt";

export { FRONT, type BackStyle, type FrontStyle } from "./cardArt";

const PAD = 3;

function Art({ markup, keyOf, width }: { markup: () => string; keyOf: string; width: number }) {
  const s = width / CARD_W;
  const w = (CARD_W + 2 * PAD) * s;
  const h = (CARD_H + 2 * PAD) * s;
  const image = bakedSvg(keyOf, w, h, markup);
  return (
    <Canvas style={{ position: "absolute", left: -PAD * s, top: -PAD * s, width: w, height: h }} pointerEvents="none">
      {image ? <SkImage image={image} x={0} y={0} width={w} height={h} /> : null}
    </Canvas>
  );
}

/** The back of a card on its own. */
export function CardBack({ width, back }: { width: number; back: BackStyle }) {
  return (
    <View style={{ width, height: (width * CARD_H) / CARD_W }}>
      <Art width={width} keyOf={`cardback|${back.colors.join()}|${back.pattern}`} markup={() => cardBack(back)} />
    </View>
  );
}

/** The front of a card: its frame, and `children` laid over in the
 *  card's own units scaled to `width` (place them with FRONT). */
export function CardFront({
  width,
  front,
  children,
}: {
  width: number;
  front: FrontStyle;
  children?: ReactNode;
}) {
  return (
    <View style={{ width, height: (width * CARD_H) / CARD_W }}>
      <Art
        width={width}
        keyOf={`cardfront|${front.window.join()}|${front.plaque.join()}|${front.arch}`}
        markup={() => cardFront(front)}
      />
      {children}
    </View>
  );
}

/** A card that can be turned over: `flip` runs 0 (back up) to 1 (face up). */
export function PlayingCard({
  width,
  back,
  front,
  flip,
  children,
  style,
}: {
  width: number;
  back: BackStyle;
  front: FrontStyle;
  flip: SharedValue<number>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const height = (width * CARD_H) / CARD_W;
  const backSide = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const frontSide = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180 - 180}deg` }],
  }));
  return (
    <View style={[{ width, height }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, backSide]}>
        <CardBack width={width} back={back} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, frontSide]}>
        <CardFront width={width} front={front}>
          {children}
        </CardFront>
      </Animated.View>
    </View>
  );
}

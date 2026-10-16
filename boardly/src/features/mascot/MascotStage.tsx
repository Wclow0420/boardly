// The mascot, alive: its layers recorded once and baked into images,
// moved on the UI thread. It breathes, blinks, sways what it holds and flutters
// what it wears on its back. MascotFigure is the figure on its own (for
// a game scene, a card); MascotStage adds the hop when you tap it. Both
// stand still with reduced motion, or when `paused`.

import { Canvas, Image, Skia, type SkImage, type SkPicture } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { PixelRatio, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { recordEmblem } from "@/components/engraved/picture";
import { tapHaptic } from "@/utils/haptics";
import { dressLayers, type Look } from "./dress";
import { BOX, GRIP, LIFT } from "./rig";

/** Where the feet stand, the eyes are, and the held item is gripped, in
 *  the box. */
export const FEET = { x: 50, y: LIFT + 98.4 };
const EYE_LINE = LIFT + 28;
const HOLD = { x: GRIP[0], y: GRIP[1] + LIFT };

/** Room drawn round the box, in its units, so nothing that moves out of
 *  it is cut off: the hop and a tall hat above, wide wings and a swung
 *  sword at the sides. The figure's place on the page stays its box. */
const PAD = { x: 22, top: 30, bottom: 6 };

/** A layer's picture painted once into an image covering the box and the
 *  room round it, at `scale` points per unit and the screen's density:
 *  each frame then draws an image, not every shape of the outfit. */
function bakeLayer(picture: SkPicture, scale: number): SkImage | null {
  const density = scale * Math.min(PixelRatio.get(), 2.5);
  const w = BOX[0] + 2 * PAD.x;
  const h = BOX[1] + PAD.top + PAD.bottom;
  const surface = Skia.Surface.Make(Math.ceil(w * density), Math.ceil(h * density));
  if (!surface) return null;
  const c = surface.getCanvas();
  c.scale(density, density);
  c.translate(PAD.x, PAD.top);
  c.drawPicture(picture);
  surface.flush();
  return surface.makeImageSnapshot();
}

/** A number from a string, so each mascot keeps its own rhythm. */
const seedOf = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 997;
  return h / 997;
};

export function MascotFigure({
  look,
  width,
  seed = "",
  paused = false,
  hop,
}: {
  look: Look;
  width: number;
  /** Anything that tells mascots apart (a user id): they breathe and
   *  blink out of step with each other. */
  seed?: string;
  paused?: boolean;
  /** 0 → 1 runs a hop. */
  hop?: SharedValue<number>;
}) {
  const still = useReducedMotion() || paused;
  const scale = width / BOX[0];
  const layers = useMemo(() => {
    const dressed = dressLayers(look);
    const bake = (data: Parameters<typeof recordEmblem>[0]) =>
      bakeLayer(recordEmblem(data, undefined, BOX), scale);
    return {
      back: bake(dressed.back),
      body: bake(dressed.body),
      eyes: bake(dressed.eyes),
      hat: bake(dressed.hat),
      hand: bake(dressed.hand),
    };
  }, [look, scale]);

  const offset = seedOf(seed) * 10;
  const t = useSharedValue(offset);
  useFrameCallback((frame) => {
    t.set(offset + frame.timeSinceFirstFrame / 1000);
  }, !still);

  const height = (width * BOX[1]) / BOX[0];
  // the canvas area round the box, in points, and points of the rig in it
  const area = {
    left: -PAD.x * scale,
    top: -PAD.top * scale,
    width: width + 2 * PAD.x * scale,
    height: height + (PAD.top + PAD.bottom) * scale,
  };
  const at = (x: number, y: number): [number, number, number] => [(x + PAD.x) * scale, (y + PAD.top) * scale, 0];

  // Each layer is a still canvas, drawn once; the living is done by
  // native transforms of those views, which cost next to nothing a frame.
  const whole = useAnimatedStyle(() => {
    const breath = Math.sin(t.get() * 2.4);
    const h = hop?.get() ?? 0;
    // up and back down in an arc, squashed as it lands
    const lift = Math.sin(h * Math.PI) * 16 * scale;
    const squash = h > 0.85 ? (1 - h) * 6 * 0.06 : 0;
    return {
      transform: [
        { translateY: -lift },
        { scaleX: 1 - breath * 0.008 + squash },
        { scaleY: 1 + breath * 0.018 - squash },
      ],
    };
  });
  const blink = useAnimatedStyle(() => {
    const phase = t.get() % 3.6;
    const shut = phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) * 0.9 : 0;
    return { transform: [{ scaleY: 1 - shut }] };
  });
  const sway = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(t.get() * 1.6) * 0.09}rad` }],
  }));
  const flutter = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + Math.sin(t.get() * 3) * 0.035 }],
  }));

  const layer = (image: SkImage | null, style?: object, origin?: [number, number, number]) => (
    <Animated.View style={[StyleSheet.absoluteFill, origin ? { transformOrigin: origin } : null, style]}>
      <StillLayer image={image} width={area.width} height={area.height} />
    </Animated.View>
  );

  return (
    // the canvases spill past the box on every side; the box is the layout
    <View style={{ width, height }} pointerEvents="none">
      <Animated.View style={[styles.area, area, { transformOrigin: at(FEET.x, FEET.y) }, whole]}>
        {layer(layers.back, flutter, at(50, FEET.y))}
        {layer(layers.body)}
        {layer(layers.eyes, blink, at(50, EYE_LINE))}
        {layer(layers.hat)}
        {layer(layers.hand, sway, at(HOLD.x, HOLD.y))}
      </Animated.View>
    </View>
  );
}

/** A baked layer on a canvas of its own, drawn once. */
function StillLayer({ image, width, height }: { image: SkImage | null; width: number; height: number }) {
  return (
    <Canvas style={{ width, height }}>
      {image ? <Image image={image} x={0} y={0} width={width} height={height} /> : null}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  area: { position: "absolute" },
});

/** The mascot on show: tap it and it hops. */
export function MascotStage({ look, width }: { look: Look; width: number }) {
  const still = useReducedMotion();
  const hop = useSharedValue(0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your mascot"
      onPress={() => {
        if (still) return;
        tapHaptic();
        hop.set(0);
        hop.set(
          withSequence(
            withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 0 }),
          ),
        );
      }}
    >
      <MascotFigure look={look} width={width} hop={hop} />
    </Pressable>
  );
}

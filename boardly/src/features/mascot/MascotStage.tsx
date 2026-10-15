// The mascot, alive: its layers recorded once as Skia pictures, moved on
// the UI thread. It breathes, blinks, sways what it holds and flutters
// what it wears on its back. MascotFigure is the figure on its own (for
// a game scene, a card); MascotStage adds the hop when you tap it. Both
// stand still with reduced motion, or when `paused`.

import { Canvas, Group, Picture } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import {
  Easing,
  useDerivedValue,
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
  const pictures = useMemo(() => {
    const layers = dressLayers(look);
    return {
      back: recordEmblem(layers.back, undefined, BOX),
      body: recordEmblem(layers.body, undefined, BOX),
      eyes: recordEmblem(layers.eyes, undefined, BOX),
      hat: recordEmblem(layers.hat, undefined, BOX),
      hand: recordEmblem(layers.hand, undefined, BOX),
    };
  }, [look]);

  const offset = seedOf(seed) * 10;
  const t = useSharedValue(offset);
  useFrameCallback((frame) => {
    t.set(offset + frame.timeSinceFirstFrame / 1000);
  }, !still);

  const scale = width / BOX[0];
  const height = (width * BOX[1]) / BOX[0];
  const whole = useDerivedValue(() => {
    const breath = Math.sin(t.get() * 2.4);
    const h = hop?.get() ?? 0;
    // up and back down in an arc, squashed as it lands
    const lift = Math.sin(h * Math.PI) * 16;
    const squash = h > 0.85 ? (1 - h) * 6 * 0.06 : 0;
    return [
      { scale },
      { translateX: PAD.x },
      { translateY: PAD.top },
      { translateX: FEET.x },
      { translateY: FEET.y - lift },
      { scaleX: 1 - breath * 0.008 + squash },
      { scaleY: 1 + breath * 0.018 - squash },
      { translateX: -FEET.x },
      { translateY: -FEET.y },
    ];
  });
  const blink = useDerivedValue(() => {
    const phase = t.get() % 3.6;
    const shut = phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) * 0.9 : 0;
    return [
      { translateY: EYE_LINE },
      { scaleY: 1 - shut },
      { translateY: -EYE_LINE },
    ];
  });
  const sway = useDerivedValue(() => [
    { translateX: HOLD.x },
    { translateY: HOLD.y },
    { rotate: Math.sin(t.get() * 1.6) * 0.09 },
    { translateX: -HOLD.x },
    { translateY: -HOLD.y },
  ]);
  const flutter = useDerivedValue(() => [
    { translateX: 50 },
    { scaleX: 1 + Math.sin(t.get() * 3) * 0.035 },
    { translateX: -50 },
  ]);

  return (
    // the canvas spills past the box on every side; the box is the layout
    <View style={{ width, height }} pointerEvents="none">
      <Canvas
        style={{
          position: "absolute",
          left: -PAD.x * scale,
          top: -PAD.top * scale,
          width: width + 2 * PAD.x * scale,
          height: height + (PAD.top + PAD.bottom) * scale,
        }}
      >
        <Group transform={whole}>
          <Group transform={flutter}>
            <Picture picture={pictures.back} />
          </Group>
          <Picture picture={pictures.body} />
          <Group transform={blink}>
            <Picture picture={pictures.eyes} />
          </Group>
          <Picture picture={pictures.hat} />
          <Group transform={sway}>
            <Picture picture={pictures.hand} />
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}

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

// The mascot, alive: its layers recorded once as Skia pictures, moved on
// the UI thread. It breathes, blinks, sways what it holds and flutters
// what it wears on its back; tap it and it hops. Still when the reader
// asks for reduced motion.

import { Canvas, Group, Picture } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Pressable } from "react-native";
import {
  Easing,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { recordEmblem } from "@/components/engraved/picture";
import { tapHaptic } from "@/utils/haptics";
import { dressLayers, type Look } from "./dress";
import { BOX, GRIP, LIFT } from "./rig";

/** Where the feet stand, the eyes are, and the held item is gripped, in
 *  the box. */
const FEET = { x: 50, y: LIFT + 98.4 };
const EYE_LINE = LIFT + 28;
const HOLD = { x: GRIP[0], y: GRIP[1] + LIFT };

export function MascotStage({ look, width }: { look: Look; width: number }) {
  const still = useReducedMotion();
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

  const t = useSharedValue(0);
  const hop = useSharedValue(0);
  useFrameCallback((frame) => {
    if (!still) t.set(frame.timeSinceFirstFrame / 1000);
  });

  const scale = width / BOX[0];
  const whole = useDerivedValue(() => {
    const breath = Math.sin(t.get() * 2.4);
    const h = hop.get();
    // up and back down in an arc, squashed as it lands
    const lift = Math.sin(h * Math.PI) * 16;
    const squash = h > 0.85 ? (1 - h) * 6 * 0.06 : 0;
    return [
      { scale },
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
      <Canvas style={{ width, height: (width * BOX[1]) / BOX[0] }}>
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
    </Pressable>
  );
}

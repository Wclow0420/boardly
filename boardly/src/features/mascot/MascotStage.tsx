// The mascot, alive: its layers recorded once into pictures, each drawn
// once on a still view of its own and moved on the UI thread. It
// breathes, blinks, sways what it holds and flutters what it wears on its
// back. MascotFigure is the figure on its own (for a game scene, a card);
// MascotStage adds the hop when you tap it. Both stand still with reduced
// motion, or when `paused`.

import { onMemoryWarning } from "@/utils/memory";
import type { SkPicture } from "@shopify/react-native-skia";
import { useEffect, useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  cancelAnimation,
  withRepeat,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { recordEmblem } from "@/components/engraved/picture";
import { StillPicture, record } from "@/components/ui/StillPicture";
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

/** What a look is, as a string: two looks that read the same are the same
 *  look, even when the server sends them as new objects every update. */
export const lookKey = (look: Look) =>
  `${look.skin}|${look.colour}|${Object.entries(look.wear)
    .filter(([, id]) => id)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, id]) => `${slot}:${id}`)
    .join(",")}`;

type Layers = { back: SkPicture | null; body: SkPicture | null; eyes: SkPicture | null; hat: SkPicture | null; hand: SkPicture | null };

/** Each look's layers recorded into pictures, shared by every copy on
 *  screen at any size and kept across screens and games — the oldest let
 *  go past a limit, so a long evening of rematches doesn't fill the
 *  memory. A layer's canvas draws its picture once and keeps the pixels
 *  (the living is native transforms of the views), so there's no baked
 *  image to hold as well: a picture is a list of shapes, not pixels. */
const RECORDED = new Map<string, Layers>();
const KEEP = 64;
onMemoryWarning(() => RECORDED.clear());
function recordedFigure(look: Look): Layers {
  const key = lookKey(look);
  const hit = RECORDED.get(key);
  if (hit) {
    // most recently used goes to the back of the line
    RECORDED.delete(key);
    RECORDED.set(key, hit);
    return hit;
  }
  const dressed = dressLayers(look);
  const layer = (data: Parameters<typeof recordEmblem>[0]) => (data.length ? recordEmblem(data, undefined, BOX) : null);
  const made = {
    back: layer(dressed.back),
    body: layer(dressed.body),
    eyes: layer(dressed.eyes),
    hat: layer(dressed.hat),
    hand: layer(dressed.hand),
  };
  RECORDED.set(key, made);
  while (RECORDED.size > KEEP) RECORDED.delete(RECORDED.keys().next().value!);
  return made;
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
  const key = lookKey(look);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the look
  const layers = useMemo(() => recordedFigure(look), [key]);

  const offset = seedOf(seed) * 10;
  // its own time, in seconds: a steady run on the UI thread, started once
  // (an update to the screen doesn't restart it)
  const t = useSharedValue(offset);
  useEffect(() => {
    if (still) {
      cancelAnimation(t);
      return;
    }
    const from = t.get();
    const HOUR = 3600;
    t.set(withRepeat(withTiming(from + HOUR, { duration: HOUR * 1000, easing: Easing.linear }), -1));
    return () => cancelAnimation(t);
  }, [still, t]);

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
  // each layer a still view, moved by native transforms; nothing worn in
  // a slot: no view for it (nor a motion to run)
  const fixed = (picture: SkPicture | null) =>
    picture ? (
      <View style={StyleSheet.absoluteFill}>
        <StillLayer picture={picture} scale={scale} width={area.width} height={area.height} />
      </View>
    ) : null;
  const moving = (picture: SkPicture | null, motion: Motion, origin: [number, number, number]) =>
    picture ? (
      <MovingLayer t={t} motion={motion} origin={origin}>
        <StillLayer picture={picture} scale={scale} width={area.width} height={area.height} />
      </MovingLayer>
    ) : null;

  return (
    // the canvases spill past the box on every side; the box is the layout
    <View style={{ width, height }} pointerEvents="none">
      <Animated.View style={[styles.area, area, { transformOrigin: at(FEET.x, FEET.y) }, whole]}>
        {moving(layers.back, "flutter", at(50, FEET.y))}
        {fixed(layers.body)}
        {moving(layers.eyes, "blink", at(50, EYE_LINE))}
        {fixed(layers.hat)}
        {moving(layers.hand, "sway", at(HOLD.x, HOLD.y))}
      </Animated.View>
    </View>
  );
}

/** How a layer moves of its own: the eyes blink, what's held sways, what's
 *  worn on the back flutters. */
type Motion = "blink" | "sway" | "flutter";

/** A layer that moves by itself, on the figure's own time `t`. */
function MovingLayer({
  t,
  motion,
  origin,
  children,
}: {
  t: SharedValue<number>;
  motion: Motion;
  origin: [number, number, number];
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const now = t.get();
    if (motion === "blink") {
      const phase = now % 3.6;
      const shut = phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) * 0.9 : 0;
      return { transform: [{ scaleY: 1 - shut }] };
    }
    if (motion === "sway") return { transform: [{ rotate: `${Math.sin(now * 1.6) * 0.09}rad` }] };
    return { transform: [{ scaleX: 1 + Math.sin(now * 3) * 0.035 }] };
  });
  return <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: origin }, style]}>{children}</Animated.View>;
}

/** A layer on a still view of its own, drawn once: the box `scale`
 *  points a unit, with the room round it. */
function StillLayer({ picture, scale, width, height }: { picture: SkPicture; scale: number; width: number; height: number }) {
  const placed = useMemo(
    () =>
      record((c) => {
        c.scale(scale, scale);
        c.translate(PAD.x, PAD.top);
        c.drawPicture(picture);
      }),
    [picture, scale],
  );
  return <StillPicture picture={placed} style={{ width, height }} />;
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

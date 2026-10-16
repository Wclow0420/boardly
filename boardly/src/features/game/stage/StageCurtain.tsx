// The stage's red curtain. Whenever what's on the stage changes (its
// `sceneKey`), the valance drops, the two velvet panels sweep shut with
// a little bounce, the new scene is put in place behind them, and they
// draw open again. The art is baked once per size (curtainArt.ts); the
// panels move by native transforms, gathering toward their sides as they
// open. With reduce motion on, the scene simply changes.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { bakedSvg } from "@/components/badges/bake";
import type { Jewel } from "@/components/engraved/shapes";
import { useBox } from "@/components/ui";
import { moveHaptic } from "@/utils/haptics";
import { curtainPanel, valance } from "./curtainArt";

const VALANCE_H = 96;
/** How far each panel reaches past the middle, so they overlap. */
const OVERLAP = 14;

export function StageCurtain({
  sceneKey,
  children,
  jewel = "amber",
  onSwap,
}: {
  sceneKey: string;
  children: ReactNode;
  jewel?: Jewel;
  /** The curtain is shut and the new scene is going in (so whatever
   *  else changes with it, the main move, can change now too). */
  onSwap?: (key: string) => void;
}) {
  const still = useReducedMotion();
  const [{ w, h }, onLayout] = useBox();
  // what is on the stage: the scene for `held.key`, kept as it was while
  // the curtain closes on it
  const [held, setHeld] = useState<{ key: string; node: ReactNode }>(() => ({ key: sceneKey, node: children }));
  if (held.key === sceneKey && held.node !== children) setHeld({ key: sceneKey, node: children });
  const changing = held.key !== sceneKey;

  const shut = useSharedValue(0);
  const drop = useSharedValue(0);

  useEffect(() => {
    if (!changing) return;
    const swap = () => {
      setHeld({ key: sceneKey, node: null });
      onSwap?.(sceneKey);
      // the new scene settles in behind the curtain, then it opens
      shut.set(
        withDelay(
          still ? 0 : 340,
          withTiming(0, { duration: still ? 0 : 760, easing: Easing.out(Easing.cubic) }, (done) => {
            if (done) drop.set(withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }));
          }),
        ),
      );
    };
    const closed = () => {
      if (!still) moveHaptic();
      swap();
    };
    cancelAnimation(shut);
    drop.set(withTiming(1, { duration: still ? 0 : 260, easing: Easing.out(Easing.quad) }));
    shut.set(
      withTiming(1, { duration: still ? 0 : 560, easing: Easing.bezier(0.5, 0, 0.35, 1.18) }, (done) => {
        if (done) scheduleOnRN(closed);
      }),
    );
  }, [changing, sceneKey, still, shut, drop, onSwap]);

  const half = w / 2 + OVERLAP;
  const left = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(1 - shut.value) * half * 0.86 },
      { scaleX: 0.14 + 0.86 * shut.value },
    ],
  }));
  const right = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - shut.value) * half * 0.86 },
      { scaleX: 0.14 + 0.86 * shut.value },
    ],
  }));
  const top = useAnimatedStyle(() => ({ transform: [{ translateY: -(1 - drop.value) * (VALANCE_H + 10) }] }));
  const shown = useAnimatedStyle(() => ({ opacity: shut.value > 0.001 || drop.value > 0.001 ? 1 : 0 }));

  const panelL = w > 0 ? bakedSvg(`curtain|left`, half, h, () => curtainPanel(half, h, "left")) : null;
  const panelR = w > 0 ? bakedSvg(`curtain|right`, half, h, () => curtainPanel(half, h, "right")) : null;
  const pelmet = w > 0 ? bakedSvg(`valance|${jewel}`, w, VALANCE_H, () => valance(w, VALANCE_H, jewel)) : null;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {changing ? held.node : children}
      {w > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, shown]} pointerEvents={changing ? "auto" : "none"}>
          <Animated.View style={[styles.panel, { left: 0, width: half, height: h, transformOrigin: [0, h / 2, 0] }, left]}>
            <Canvas style={StyleSheet.absoluteFill}>
              {panelL ? <SkImage image={panelL} x={0} y={0} width={half} height={h} /> : null}
            </Canvas>
          </Animated.View>
          <Animated.View style={[styles.panel, { right: 0, width: half, height: h, transformOrigin: [half, h / 2, 0] }, right]}>
            <Canvas style={StyleSheet.absoluteFill}>
              {panelR ? <SkImage image={panelR} x={0} y={0} width={half} height={h} /> : null}
            </Canvas>
          </Animated.View>
          <Animated.View style={[styles.valance, { width: w, height: VALANCE_H }, top]}>
            <Canvas style={StyleSheet.absoluteFill}>
              {pelmet ? <SkImage image={pelmet} x={0} y={0} width={w} height={VALANCE_H} /> : null}
            </Canvas>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: "absolute", top: 0 },
  valance: { position: "absolute", left: 0, top: -6 },
});

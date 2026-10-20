// The game stage's parts (see app/dev/stage.tsx for them together): the
// sign hanging over the scene on two chains, swaying a little, with the
// night's seals along it; the tools down the side (just the emblem and
// its name); the plinth the main button stands on. Their art is baked
// once (components/badges/bake.ts); the sway is one native transform.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { AppText } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { glowArt, hangingSign, plinth, sealArt, signLayout, type SealKind } from "./art";

const SEAL = 30;

/** A gentle back-and-forth, `deg` each way over `ms`, while showing. */
function useSway(deg: number, ms: number) {
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const a = useSharedValue(0);
  useEffect(() => {
    if (still || !onScreen) return;
    a.value = withRepeat(
      withSequence(
        withTiming(deg, { duration: ms / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(-deg, { duration: ms / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(a);
  }, [still, onScreen, deg, ms, a]);
  return a;
}

export function HangingSign({
  width,
  title,
  subtitle,
  seals,
  enamel,
  drop = 30,
}: {
  width: number;
  /** How far the chains hang above the sign (up to the screen's top). */
  drop?: number;
  title: string;
  subtitle?: string;
  /** One per night (or round): how it went. */
  seals: { kind: SealKind; label?: string }[];
  /** The plaque's enamel, top to bottom, in the game's colours. */
  enamel: readonly string[];
}) {
  const L = signLayout(width, drop);
  const h = L.drop + L.h + 6;
  const image = bakedSvg(`sign|${enamel.join()}|${drop}`, width, h, () => hangingSign(L, enamel));
  const sway = useSway(1.4, 5200);
  const style = useAnimatedStyle(() => ({
    transformOrigin: "top",
    transform: [{ rotate: `${sway.value}deg` }],
  }));
  return (
    <Animated.View style={[{ width, height: h }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} x={0} y={0} width={width} height={h} /> : null}
        {seals.map((seal, i) => {
          const img = bakedSvg(`seal|${seal.kind}`, SEAL, SEAL, () => sealArt(seal.kind));
          const x = width / 2 + (i - (seals.length - 1) / 2) * (SEAL + 4) - SEAL / 2;
          return img ? <SkImage key={i} image={img} x={x} y={L.drop + 64} width={SEAL} height={SEAL} /> : null;
        })}
      </Canvas>
      <View style={[styles.signText, { top: L.drop + 26 }]}>
        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {seals.map((seal, i) =>
        seal.label ? (
          <AppText
            key={i}
            style={[
              styles.sealLabel,
              {
                left: width / 2 + (i - (seals.length - 1) / 2) * (SEAL + 4) - SEAL / 2,
                top: L.drop + 64 + SEAL / 2 - 8,
              },
            ]}
          >
            {seal.label}
          </AppText>
        ) : null,
      )}
    </Animated.View>
  );
}

/** A tool down the side of the stage: the emblem and its name, no box. */
export function ToolButton({
  emoji,
  label,
  onPress,
  badge,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  /** Something new behind it (a dot). */
  badge?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.tool, pressed && styles.pressed]}
    >
      <View>
        <Emblem emoji={emoji} size={36} />
        {badge ? <View style={styles.dot} /> : null}
      </View>
      <AppText style={styles.toolLabel} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** The plinth across the foot of the stage, holding its children (the
 *  main button), `inset` in from each end (40, or clear of a dock). */
export function Plinth({
  width,
  height,
  inset,
  children,
}: {
  width: number;
  height: number;
  inset?: { left: number; right: number };
  children: ReactNode;
}) {
  const image = bakedSvg("plinth", width, height, () => plinth(width, height));
  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {image ? <SkImage image={image} x={0} y={0} width={width} height={height} /> : null}
      </Canvas>
      <View style={[styles.plinthBody, inset ? { paddingLeft: inset.left, paddingRight: inset.right } : null]}>
        {children}
      </View>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  signText: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 2,
    color: "#FFE7C8",
    textTransform: "uppercase",
    ...shadow,
  },
  subtitle: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#E8D2B4", ...shadow },
  sealLabel: {
    position: "absolute",
    width: SEAL,
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 16,
    color: "#E8C88A",
  },
  tool: { alignItems: "center", width: 62, gap: 1 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  toolLabel: { fontFamily: fontFamily.semiBold, fontSize: 10.5, lineHeight: 13, color: "#F1E6D2", ...shadow },
  dot: {
    position: "absolute",
    right: -2,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F28B4B",
    borderWidth: 1.5,
    borderColor: "#2A1206",
  },
  plinthBody: { position: "absolute", left: 0, right: 0, top: 46, alignItems: "center", paddingHorizontal: 40 },
});

/** A soft pool of the game's light behind the scene. */
export function Glow({ size, color, style }: { size: number; color: string; style?: object }) {
  const image = bakedSvg(`glow|${color}`, size, size, () => glowArt(size, color));
  return (
    <Canvas style={[{ position: "absolute", width: size, height: size }, style]} pointerEvents="none">
      {image ? <SkImage image={image} x={0} y={0} width={size} height={size} /> : null}
    </Canvas>
  );
}

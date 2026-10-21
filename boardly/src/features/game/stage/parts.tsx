// The game stage's parts (see app/dev/stage.tsx for them together): the
// sign hanging over the scene on two chains, swaying a little, with the
// night's seals along it; the tools down the side (just the emblem and
// its name); the plinth the main button stands on. Their art is baked
// once (components/badges/bake.ts); the sway is one native transform.

import { Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, type ReactNode } from "react";
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

import { bakedSvg, stillSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { AppText, StillPicture, record } from "@/components/ui";
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
  // drawn once (the sway is the view's): a picture, not a baked copy of
  // its pixels
  const base = stillSvg(`sign|${enamel.join()}|${drop}`, width, h, () => hangingSign(L, enamel));
  const kinds = seals.map((seal) => seal.kind).join();
  const picture = useMemo(
    () =>
      record((c) => {
        if (base) c.drawPicture(base);
        seals.forEach((seal, i) => {
          const img = stillSvg(`seal|${seal.kind}`, SEAL, SEAL, () => sealArt(seal.kind));
          const x = width / 2 + (i - (seals.length - 1) / 2) * (SEAL + 4) - SEAL / 2;
          if (!img) return;
          c.save();
          c.translate(x, L.drop + 64);
          c.drawPicture(img);
          c.restore();
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `kinds` stands for `seals`
    [base, kinds, width, L.drop],
  );
  const sway = useSway(1.4, 5200);
  const style = useAnimatedStyle(() => ({
    transformOrigin: "top",
    transform: [{ rotate: `${sway.value}deg` }],
  }));
  return (
    <Animated.View style={[{ width, height: h }, style]} pointerEvents="none">
      <StillPicture picture={picture} />
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
  // a still view keeps the pixels it drew: it's handed a picture, not a
  // baked image (which would be a second copy)
  const picture = stillSvg("plinth", width, height, () => plinth(width, height));
  return (
    <View style={{ width, height }}>
      <StillPicture picture={picture} />
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

/** How much smaller the glow is drawn than it shows: a soft gradient looks
 *  the same stretched, and a full-size canvas and image cost ~30 MB. */
const GLOW_SHRINK = 4;

/** A soft pool of the game's light behind the scene. */
export function Glow({ size, color, style }: { size: number; color: string; style?: object }) {
  const s = Math.round(size / GLOW_SHRINK);
  const image = bakedSvg(`glow|${color}`, s, s, () => glowArt(s, color));
  const picture = useMemo(
    () =>
      record((c) => {
        if (image) c.drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(0, 0, s, s), Skia.Paint());
      }),
    [image, s],
  );
  return (
    <View style={[{ position: "absolute", width: size, height: size }, style]} pointerEvents="none">
      <StillPicture
        picture={picture}
        style={{
          position: "absolute",
          width: s,
          height: s,
          left: (size - s) / 2,
          top: (size - s) / 2,
          transform: [{ scale: size / s }],
        }}
      />
    </View>
  );
}

// The button you hold to cast your vote or play your card: an enamel bar
// in a gold bezel that fills with light while held, ticking faster and
// harder in the hand as it fills; let go early and it drains away. It
// shares its `progress` (0..1) with the lantern being filled. A line under
// the label says to hold it, and a quick tap (someone who didn't know)
// shakes it and says to keep holding.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { BezelOverlay, LightSweep } from "@/components/ui";
import { fontFamily } from "@/theme";
import {
  heavyHaptic,
  moveHaptic,
  tapHaptic,
  tickHaptic,
} from "@/utils/haptics";
import { GameText as AppText } from "../GameText";

const HOLD_MS = 1600;

const ENAMEL = {
  good: {
    fill: ["#7AE8A0", "#22A058", "#0E5228"],
    light: ["#E8FFE0", "#9CFFB8"],
    text: "#06240F",
  },
  bad: {
    fill: ["#FF7A86", "#B8182E", "#520612"],
    light: ["#FFE0E0", "#FF8A94"],
    text: "#FFF2F0",
  },
  plain: {
    fill: ["#FFB27A", "#F28B4B", "#C2602A"],
    light: ["#FFF6D8", "#FFD08A"],
    text: "#2A1206",
  },
} as const;

export function HoldButton({
  label,
  tone,
  progress,
  disabled = false,
  onDone,
}: {
  label: string;
  tone: keyof typeof ENAMEL;
  /** 0..1 while held; 1 once done. */
  progress: SharedValue<number>;
  disabled?: boolean;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const look = ENAMEL[tone];
  const done = useRef(false);
  const [nudged, setNudged] = useState(false);
  const nudge = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake = useSharedValue(0);
  useEffect(() => () => {
    if (nudge.current) clearTimeout(nudge.current);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTicks = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTicks, []);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    stopTicks();
    heavyHaptic();
    onDone();
  };
  // the hand feels it fill: faint ticks, quicker and firmer toward the end
  const tick = () => {
    const p = progress.get();
    if (p < 0.45) tickHaptic();
    else if (p < 0.8) tapHaptic();
    else moveHaptic();
    timer.current = setTimeout(tick, 210 - 160 * p);
  };
  const start = () => {
    if (disabled || done.current) return;
    tick();
    progress.set(
      withTiming(
        1,
        {
          duration: HOLD_MS * (1 - progress.get()),
          easing: Easing.inOut(Easing.quad),
        },
        (finished) => {
          if (finished) scheduleOnRN(finish);
        },
      ),
    );
  };
  const release = () => {
    if (done.current) return;
    // let go before a third: they tapped it, not knowing to hold
    if (progress.get() < 0.35) {
      moveHaptic();
      shake.set(
        withSequence(
          withTiming(-7, { duration: 60 }),
          withTiming(7, { duration: 90 }),
          withTiming(-4, { duration: 80 }),
          withTiming(0, { duration: 70 }),
        ),
      );
      setNudged(true);
      if (nudge.current) clearTimeout(nudge.current);
      nudge.current = setTimeout(() => setNudged(false), 2600);
    }
    stopTicks();
    cancelAnimation(progress);
    progress.set(
      withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }),
    );
  };

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const press = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: 1 - 0.03 * Math.min(1, progress.value * 4) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      // a screen reader can't hold: a double tap casts it
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={finish}
      disabled={disabled}
      onPressIn={start}
      onPressOut={release}
      style={styles.wrap}
    >
      <Animated.View style={[styles.button, press, disabled && styles.off]}>
        <LinearGradient
          colors={look.fill as unknown as [string, string, string]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.fill, fill]}>
          <LinearGradient
            colors={look.light as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <LightSweep r={16} />
        <BezelOverlay r={16} t={4} />
        <View style={styles.face} pointerEvents="none">
          <AppText
            style={[styles.label, { color: look.text }]}
            numberOfLines={1}
          >
            {label}
          </AppText>
          <AppText style={[styles.cue, { color: look.text }, nudged && styles.cueNudged]} numberOfLines={1}>
            {nudged ? t("common.holdNudge") : t("common.holdCue")}
          </AppText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch" },
  button: {
    height: 60,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  off: { opacity: 0.5 },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, opacity: 0.75 },
  face: { alignItems: "center", paddingHorizontal: 10 },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 0.5,
  },
  cue: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 14, opacity: 0.72 },
  cueNudged: { opacity: 1, fontFamily: fontFamily.bold },
});

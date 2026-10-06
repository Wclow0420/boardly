// Press-and-hold button: the action only fires after the button has
// been held for the full duration, with a fill sweeping across as
// progress. Letting go early cancels. Used for playing quest cards, so
// a stray tap can't send the wrong one.

import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export const HOLD_MS = 2000;

export interface HoldButtonProps {
  label: string;
  onComplete: () => void;
  variant?: "primary" | "danger";
  disabled?: boolean;
  holdMs?: number;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function HoldButton({
  label,
  onComplete,
  variant = "primary",
  disabled = false,
  holdMs = HOLD_MS,
  accessibilityHint,
  style,
}: HoldButtonProps) {
  const { colors, radius, typography } = useTheme();
  const progress = useAnimatedValue(0);
  // A timer decides when the hold is complete; the animation is only
  // the visual. (Animations follow the display's frame rate, which a
  // backgrounded or throttled screen slows down — the timer doesn't.)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const start = () => {
    if (timer.current) return;
    tapHaptic();
    Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.linear,
      // Animates width, which the native driver can't do
      useNativeDriver: false,
    }).start();
    timer.current = setTimeout(() => {
      timer.current = null;
      progress.stopAnimation();
      progress.setValue(0);
      onComplete();
    }, holdMs);
  };

  const cancel = () => {
    if (!timer.current) return; // already completed
    clearTimeout(timer.current);
    timer.current = null;
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const base = variant === "danger" ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPressIn={start}
      onPressOut={cancel}
      style={[
        styles.base,
        {
          borderRadius: radius.md,
          backgroundColor: base,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
      <AppText
        style={{
          fontFamily: typography.label.fontFamily,
          fontSize: 14,
          color: colors.primaryContrast,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    overflow: "hidden",
    // Web: a long press must not select the label or open a menu
    userSelect: "none",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
});

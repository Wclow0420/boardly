import { useEffect } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { useTheme } from "@/theme";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Corner radius (default theme sm). Ignored when `circle`. */
  radius?: number;
  /** Render as a circle — width is used as the diameter. */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Loading placeholder with a soft opacity pulse.
 * Every async screen shows skeletons that mirror its real layout —
 * never a bare spinner (see NEW_PROJECT_PLAYBOOK.md).
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius,
  circle = false,
  style,
}: SkeletonProps) {
  const { colors, radius: themeRadius } = useTheme();
  const pulse = useAnimatedValue(0.5);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const size = circle ? { width, height: width as DimensionValue } : { width, height };

  return (
    <Animated.View
      style={[
        {
          ...size,
          borderRadius: circle ? 999 : (radius ?? themeRadius.xs),
          backgroundColor: colors.chip,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** Skeleton mirroring a list row (avatar + two text lines). */
export function SkeletonListItem({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      <Skeleton circle width={44} />
      <View style={styles.lines}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
    </View>
  );
}

/** Skeleton mirroring a card (cover + title + subtitle). */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Skeleton height={66} radius={radius.sm} />
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={11} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  lines: { flex: 1, gap: 8 },
});

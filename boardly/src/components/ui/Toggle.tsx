import { useEffect } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const KNOB_SIZE = 24;
const PADDING = 3;

/** Animated switch — yellow track when on, per the design sheet. */
export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const { colors } = useTheme();
  const anim = useAnimatedValue(value ? 1 : 0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - KNOB_SIZE - PADDING * 2],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onValueChange(!value);
      }}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.accent : colors.toggleOff,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[styles.knob, { transform: [{ translateX }] }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: "center",
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

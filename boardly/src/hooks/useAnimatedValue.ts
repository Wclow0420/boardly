import { useState } from "react";
import { Animated } from "react-native";

/**
 * Cross-platform replacement for RN's `useAnimatedValue`, which
 * react-native-web (0.21) doesn't export. Lazy useState keeps the same
 * instance across renders and satisfies the react-hooks/refs lint rule.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}

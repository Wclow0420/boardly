import { forwardRef, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { TABLE, fontFamily } from "@/theme";

import { CoinIcon } from "./CoinIcon";

const COUNT_MS = 900;

/** The player's coin balance. When the amount goes up it counts up to
 *  the new number and gives a little bounce. The ref points at the pill
 *  so flying coins know where to land. */
export const CoinPill = forwardRef<View, { amount: number }>(function CoinPill(
  { amount },
  ref,
) {
  const [shown, setShown] = useState(amount);
  const shownRef = useRef(amount);
  const bounce = useAnimatedValue(0);

  useEffect(() => {
    const from = shownRef.current;
    if (amount === from) return;
    // Spending just snaps to the new number; earning counts up
    if (amount < from) {
      shownRef.current = amount;
      setShown(amount);
      return;
    }

    Animated.sequence([
      Animated.timing(bounce, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(bounce, {
        toValue: 0,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const started = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / COUNT_MS);
      const value = Math.round(from + (amount - from) * (1 - (1 - t) ** 3));
      shownRef.current = value;
      setShown(value);
      if (t >= 1) clearInterval(timer);
    }, 40);
    return () => {
      clearInterval(timer);
      shownRef.current = amount;
    };
  }, [amount, bounce]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: bounce.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.18],
            }),
          },
        ],
      }}
    >
      <View
        ref={ref}
        collapsable={false}
        accessibilityLabel={`${amount} coins`}
        style={styles.pill}
      >
        <CoinIcon size={18} />
        <AppText style={styles.amount}>{shown.toLocaleString()}</AppText>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 5,
    paddingRight: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(20,12,6,0.72)",
    borderWidth: 1.5,
    borderColor: TABLE.yellow.border,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    color: TABLE.yellow.fill[0],
  },
});

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { CoinIcon } from "./CoinIcon";

interface Point {
  x: number;
  y: number;
}

interface Flight {
  id: number;
  progress: Animated.Value;
  from: Point;
  to: Point;
  /** How far the coin swings out sideways and up on its way. */
  sway: number;
  lift: number;
}

export interface CoinFlyHandle {
  /** Send a burst of coins from one view to another (both measured on
   *  screen). `onLand` fires as the first coin arrives, `onDone` after
   *  the last. */
  fly: (
    from: View | null,
    to: View | null,
    options?: { coins?: number; onLand?: () => void; onDone?: () => void },
  ) => void;
}

const COIN = 22;
const FLIGHT_MS = 650;
const STAGGER_MS = 70;

function centreOf(view: View | null): Promise<Point | null> {
  return new Promise((resolve) => {
    if (!view) return resolve(null);
    view.measureInWindow((x, y, width, height) =>
      resolve(width || height ? { x: x + width / 2, y: y + height / 2 } : null),
    );
  });
}

/** The high point of a coin's arc. Coins normally toss upward; when the
 *  start and end are too close to the top of the screen for that, they
 *  dip down first and swoop up instead, so they never leave the screen. */
function peakY(from: Point, to: Point, lift: number) {
  const above = Math.min(from.y, to.y) - lift;
  return above >= COIN ? above : Math.max(from.y, to.y) + lift;
}

/** Full-screen layer that coins fly across. Put it last inside the
 *  screen so it draws over everything; it never blocks touches. */
export const CoinFly = forwardRef<CoinFlyHandle>(function CoinFly(_props, ref) {
  const layer = useRef<View>(null);
  const nextId = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);

  useImperativeHandle(ref, () => ({
    fly: async (fromView, toView, { coins = 8, onLand, onDone } = {}) => {
      const [origin, from, to] = await Promise.all([
        new Promise<Point>((resolve) => {
          if (!layer.current) return resolve({ x: 0, y: 0 });
          layer.current.measureInWindow((x, y) => resolve({ x, y }));
        }),
        centreOf(fromView),
        centreOf(toView),
      ]);
      // Nothing to aim at (view not on screen): skip the show
      if (!from || !to) {
        onLand?.();
        onDone?.();
        return;
      }

      const batch: Flight[] = Array.from({ length: coins }, () => ({
        id: nextId.current++,
        progress: new Animated.Value(0),
        from: {
          x: from.x - origin.x + (Math.random() - 0.5) * 36,
          y: from.y - origin.y + (Math.random() - 0.5) * 14,
        },
        to: { x: to.x - origin.x, y: to.y - origin.y },
        sway: (Math.random() - 0.5) * 90,
        lift: 30 + Math.random() * 50,
      }));
      setFlights((current) => [...current, ...batch]);

      setTimeout(() => onLand?.(), FLIGHT_MS - 80);
      Animated.stagger(
        STAGGER_MS,
        batch.map((flight) =>
          Animated.timing(flight.progress, {
            toValue: 1,
            duration: FLIGHT_MS,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ).start(() => {
        const done = new Set(batch.map((flight) => flight.id));
        setFlights((current) =>
          current.filter((flight) => !done.has(flight.id)),
        );
        onDone?.();
      });
    },
  }));

  return (
    <View
      ref={layer}
      collapsable={false}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {flights.map(({ id, progress, from, to, sway, lift }) => (
        <Animated.View
          key={id}
          style={[
            styles.coin,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.08, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.45, 1],
                    outputRange: [from.x, (from.x + to.x) / 2 + sway, to.x],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [from.y, peakY(from, to, lift), to.y],
                  }),
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.5, 1.25, 0.75],
                  }),
                },
              ],
            },
          ]}
        >
          <CoinIcon size={COIN} />
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  // Anchored so the transform's x/y are the coin's centre
  coin: {
    position: "absolute",
    left: -COIN / 2,
    top: -COIN / 2,
    width: COIN,
    height: COIN,
  },
});

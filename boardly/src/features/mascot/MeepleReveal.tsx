// Into a screen and out again through the meeple, the way the app opens:
// the screen shows through a meeple-shaped window that rushes open from
// where the mascot stands, and closes back into it on the way out. Quick
// (under half a second), on the UI thread; with reduced motion, the
// screen simply comes and goes.

import { Canvas, Group, Image, Rect, useImage } from "@shopify/react-native-skia";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, StyleSheet, useWindowDimensions } from "react-native";
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { TABLE } from "@/theme";

const meeple = require("../../../assets/images/splash-icon.png");
/** The picture's size, and the point of it the window grows from. */
const SIZE = 300;
const CHEST = { x: 0.5, y: 0.47 };
/** The window's size at shut and wide open (by then it covers all). */
const SHUT = Math.log(0.02);
const OPEN = Math.log(14);

export interface Reveal {
  /** 0 shut, 1 open. */
  progress: SharedValue<number>;
  /** The window is still part-way: the overlay is drawn. */
  moving: boolean;
  /** Shut the window, then leave. */
  close: () => void;
}

export function useMeepleReveal(onClosed: () => void): Reveal {
  const still = useReducedMotion();
  const progress = useSharedValue(still ? 1 : 0);
  const [moving, setMoving] = useState(!still);

  useEffect(() => {
    if (still) return;
    progress.set(
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(setMoving, false);
      }),
    );
  }, [still, progress]);

  const close = useCallback(() => {
    if (still) {
      onClosed();
      return;
    }
    setMoving(true);
    progress.set(
      withTiming(0, { duration: 280, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(onClosed);
      }),
    );
  }, [still, progress, onClosed]);

  // Android's back button leaves the same way
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  return { progress, moving, close };
}

/** The night round the window. Put it last in the screen, over all. */
export function MeepleReveal({ progress, moving }: Reveal) {
  const { width, height } = useWindowDimensions();
  const image = useImage(meeple);
  const x = (width - SIZE) / 2;
  // the window opens from where the mascot stands
  const y = height * 0.32 - SIZE * CHEST.y;
  const origin = { x: x + SIZE * CHEST.x, y: y + SIZE * CHEST.y };
  const transform = useDerivedValue(() => [
    { scale: Math.exp(SHUT + (OPEN - SHUT) * progress.get()) },
  ]);
  if (!moving) return null;
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group layer>
        <Rect x={0} y={0} width={width} height={height} color={TABLE.table[1]} />
        {image ? (
          <Group transform={transform} origin={origin}>
            <Image
              image={image}
              x={x}
              y={y}
              width={SIZE}
              height={SIZE}
              blendMode="dstOut"
            />
          </Group>
        ) : null}
      </Group>
    </Canvas>
  );
}

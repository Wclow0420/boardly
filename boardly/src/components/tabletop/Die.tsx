// A real die for the table: ivory, rounded, pips in place. `roll()`
// throws it — it hops, spins and tumbles through faces with a tick on
// every turn, then lands on a face and settles. With reduce motion on it
// just shows the new face.

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { tickHaptic } from "@/utils/haptics";

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

/** Which cells of a 3×3 grid hold a pip, per face. */
const PIPS: Record<DieFace, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const randomFace = (not?: DieFace) => {
  let face: DieFace;
  do face = (1 + Math.floor(Math.random() * 6)) as DieFace;
  while (face === not);
  return face;
};

export interface DieHandle {
  /** Throws the die; resolves once it has settled on its face. */
  roll: () => Promise<DieFace>;
}

export interface DieProps {
  size?: number;
  /** The face it shows before the first roll. */
  face?: DieFace;
  /** Its resting tilt, in degrees. */
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}

/** How long a throw takes. */
const ROLL_MS = 900;

export const Die = forwardRef<DieHandle, DieProps>(function Die(
  { size = 52, face: initial = 5, tilt = -8, style },
  ref,
) {
  const still = useReducedMotion();
  const [face, setFace] = useState<DieFace>(initial);
  const faceRef = useRef(face);
  const spin = useSharedValue(tilt);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    roll: () =>
      new Promise<DieFace>((resolve) => {
        const landing = randomFace(faceRef.current);
        const show = (next: DieFace) => {
          faceRef.current = next;
          setFace(next);
        };
        if (still) {
          show(landing);
          resolve(landing);
          return;
        }
        // up, over and down, turning all the while
        hop.set(
          withSequence(
            withTiming(-size * 0.55, {
              duration: ROLL_MS * 0.38,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, {
              duration: ROLL_MS * 0.32,
              easing: Easing.in(Easing.quad),
            }),
            withTiming(-size * 0.12, {
              duration: ROLL_MS * 0.12,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, {
              duration: ROLL_MS * 0.12,
              easing: Easing.in(Easing.quad),
            }),
          ),
        );
        // two full turns on from last time look the same: start again from 0
        spin.set(tilt);
        spin.set(
          withSequence(
            withTiming(tilt + 540 + Math.random() * 90, {
              duration: ROLL_MS * 0.8,
              easing: Easing.out(Easing.cubic),
            }),
            // it tips over onto its face and settles square
            withTiming(tilt + 720, {
              duration: ROLL_MS * 0.3,
              easing: Easing.out(Easing.back(1.6)),
            }),
          ),
        );
        // it thuds on each landing
        squash.set(
          withSequence(
            withTiming(1, { duration: ROLL_MS * 0.7 }),
            withTiming(0.86, { duration: 70 }),
            withSpring(1, { damping: 6, stiffness: 260 }),
          ),
        );
        // tumbling through faces, slower as it comes to rest
        const turns = [70, 140, 220, 310, 410, 520, 640];
        const timers = turns.map((at, i) =>
          setTimeout(() => {
            tickHaptic();
            show(
              i === turns.length - 1 ? landing : randomFace(faceRef.current),
            );
          }, at),
        );
        setTimeout(() => {
          timers.forEach(clearTimeout);
          show(landing);
          resolve(landing);
        }, ROLL_MS);
      }),
  }));

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateY: hop.value },
      { rotate: `${spin.value}deg` },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
    ],
  }));

  const pip = size * 0.15;
  return (
    <Animated.View
      style={[
        styles.die,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          padding: size * 0.14,
        },
        motion,
        style,
      ]}
    >
      {/* the lower edge in shadow, for depth */}
      <View
        style={[
          styles.edge,
          { borderRadius: size * 0.22, borderBottomWidth: size * 0.07 },
        ]}
        pointerEvents="none"
      />
      <View style={styles.grid}>
        {Array.from({ length: 9 }, (_, cell) => (
          <View key={cell} style={styles.cell}>
            {PIPS[face].includes(cell) ? (
              <View
                style={[
                  styles.pip,
                  { width: pip, height: pip, borderRadius: pip / 2 },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  die: {
    backgroundColor: "#FFF9EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  edge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: "rgba(120,86,40,0.22)",
  },
  grid: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "33.333%",
    height: "33.333%",
    alignItems: "center",
    justifyContent: "center",
  },
  pip: { backgroundColor: "#2A1C10" },
});

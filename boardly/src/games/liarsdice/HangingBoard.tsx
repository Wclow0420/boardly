// My own dice, on a board hung by two gold chains from the den's shelf
// (art in art.ts, baked once). It sits at the top of the stage, in front
// of the curtain, so my dice stay in sight from scene to scene; it swings
// a hair on its chains, jolts when the dice land in it, and is drawn up
// out of sight behind the shelf while a reveal or the ending has the
// stage. At the start of a round its hollows are empty until the dice fly
// up into it from the cup (`flight`, in window coordinates).

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { bakedSvg } from "@/components/badges/bake";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { moveHaptic } from "@/utils/haptics";
import { BOARD, boardArt, boardLayout, type DieTone } from "./art";
import { dieBox, dieImage } from "./pieces";

const L = boardLayout();
/** How far the board's picture reaches up behind the den's shelf. */
export const BOARD_TUCK = 14;
/** How far below the den's bottom edge the board reaches. */
export const BOARD_DROP = L.h - BOARD_TUCK;
const FLY_MS = 900;

/** Where each die starts its flight, in window coordinates (its centre,
 *  its size, its tilt), in the order of `faces`. */
export interface Flight {
  from: { x: number; y: number; size: number; rot: number }[];
}

/** The order the board lays dice out in (low to high), as each die's
 *  place on it. */
function placesOf(faces: number[]) {
  const order = faces.map((face, i) => ({ face, i })).sort((a, b) => a.face - b.face || a.i - b.i);
  const place: number[] = [];
  order.forEach((o, k) => {
    place[o.i] = k;
  });
  return place;
}

function FlightDie({
  face,
  from,
  to,
  go,
  i,
}: {
  face: number;
  from: Flight["from"][number];
  to: { x: number; y: number };
  go: SharedValue<number>;
  i: number;
}) {
  const s = BOARD.die;
  const image = dieImage(face, s);
  const style = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (go.value - i * 0.07) / 0.72));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const x = from.x + (to.x - from.x) * e + Math.sin(Math.PI * e) * (i - 2) * 9;
    const y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * 26;
    const scale = (from.size + (s - from.size) * e) / s;
    const rot = from.rot * (1 - e) + Math.sin(Math.PI * e) * (i % 2 === 0 ? 1.4 : -1.2);
    return {
      transform: [{ translateX: x - s * 0.6 }, { translateY: y - s * 0.6 }, { rotate: `${rot}rad` }, { scale }],
    };
  });
  return (
    <Animated.View style={[styles.flier, { width: s * 1.2, height: s * 1.2 }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} {...dieBox(s * 0.1, s * 0.1, s)} /> : null}
      </Canvas>
    </Animated.View>
  );
}

export function HangingBoard({
  width,
  top,
  faces,
  tones,
  empty = false,
  drunk,
  away = false,
  flight = null,
  onLanded,
  label,
  paused = false,
}: {
  width: number;
  /** The window y the board's picture starts at (its chains, tucked
   *  behind the den's shelf). */
  top: number;
  /** My dice. */
  faces: number[];
  /** Each die's look, in the order of `faces`. */
  tones?: DieTone[];
  /** The hollows are empty: the dice are still in the cup. */
  empty?: boolean;
  /** Knocked out: this line on the felt instead of dice. */
  drunk?: string;
  /** A reveal or the ending has the stage: drawn up out of sight. */
  away?: boolean;
  /** The dice flying up into it from the cup. */
  flight?: Flight | null;
  onLanded?: () => void;
  /** What a screen reader says. */
  label: string;
  paused?: boolean;
}) {
  const still = useReducedMotion();
  const image = bakedSvg("ld-board", L.w, L.h, boardArt);
  const x0 = (width - L.w) / 2;

  // laid out low to high
  const place = useMemo(() => placesOf(faces), [faces]);
  const shown = faces.map((face, i) => ({ face, tone: tones?.[i] ?? "plain", at: place[i] }));

  // drawn up behind the shelf while a moment has the stage
  const up = useSharedValue(away ? 1 : 0);
  useEffect(() => {
    up.set(withTiming(away ? 1 : 0, { duration: still ? 0 : 520, easing: Easing.inOut(Easing.cubic) }));
  }, [away, up, still]);

  // a hair of sway on the chains, and a jolt when the dice land
  const sway = useSharedValue(0);
  const jolt = useSharedValue(0);
  const resting = paused || still || away;
  useEffect(() => {
    if (resting) {
      cancelAnimation(sway);
      sway.set(withTiming(0, { duration: 400 }));
      return;
    }
    sway.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(sway);
  }, [resting, sway]);
  const boardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -up.value * (L.h + 6) }, { rotate: `${sway.value * 0.014 + jolt.value}rad` }],
  }));

  // the flight up from the cup
  const go = useSharedValue(0);
  const landedRef = useRef(onLanded);
  useEffect(() => {
    landedRef.current = onLanded;
  });
  useEffect(() => {
    if (!flight) return;
    const land = () => {
      moveHaptic();
      jolt.set(withSequence(withTiming(0.045, { duration: 90 }), withSpring(0, { damping: 6, stiffness: 140 })));
      landedRef.current?.();
    };
    go.set(0);
    go.set(
      withTiming(1, { duration: FLY_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(land);
      }),
    );
  }, [flight, go, jolt]);

  return (
    <>
      <Animated.View
        style={[styles.board, { left: x0, top, width: L.w, height: L.h, transformOrigin: [L.w / 2, 0, 0] }, boardStyle]}
        pointerEvents="none"
        accessible
        accessibilityLabel={label}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {image ? <SkImage image={image} x={0} y={0} width={L.w} height={L.h} /> : null}
          {empty || drunk
            ? null
            : shown.map(({ face, tone, at }, i) => {
                const img = dieImage(face, BOARD.die, tone);
                const slot = L.slots[at];
                return img && slot ? <SkImage key={i} image={img} {...dieBox(slot.x, slot.y, BOARD.die)} /> : null;
              })}
        </Canvas>
        {drunk ? (
          <View style={[styles.drunk, { top: L.chain, height: L.bh }]}>
            <AppText style={styles.drunkText} numberOfLines={1}>
              {drunk}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
      {flight
        ? faces.map((face, i) => {
            const from = flight.from[i];
            const slot = L.slots[place[i]];
            if (!from || !slot) return null;
            return (
              <FlightDie
                key={i}
                i={place[i]}
                face={face}
                from={from}
                to={{ x: x0 + slot.x + BOARD.die / 2, y: top + slot.y + BOARD.die / 2 }}
                go={go}
              />
            );
          })
        : null}
    </>
  );
}

const styles = StyleSheet.create({
  board: { position: "absolute" },
  flier: { position: "absolute", left: 0, top: 0 },
  drunk: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  drunkText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
    color: "#E8F4EA",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

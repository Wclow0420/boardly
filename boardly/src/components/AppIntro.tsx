// The way in: when the native splash goes, this overlay is drawn exactly
// like it (the same night-blue and the meeple, 300 wide, centred), so
// the hand-off can't be seen. Then the meeple dips, and rushes at the
// camera: its silhouette is a window cut in the night, its orange fades,
// and the app opens up through it — we fly in through the logo.
//
// Mounted once, over everything, on a cold start (not on the web). It
// hides the native splash itself, once its own picture is ready to take
// over, and waits for `ready` (the session known) before it flies in.

import {
  Canvas,
  Group,
  Image,
  Rect,
  useImage,
} from "@shopify/react-native-skia";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import {
  Image as Picture,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/** Mirrors the expo-splash-screen plugin in app.config.js. */
const SPLASH_BACKGROUND = "#18202B";
const SPLASH_WIDTH = 300;
/** The meeple's chest, as a fraction of the picture: the point we fly at
 *  (solid all round, so the window grows over the whole screen). */
const CHEST = { x: 0.5, y: 0.47 };
/** How far the meeple grows: by then its body covers every corner. */
const THROUGH = 40;
/** The dip before the rush. */
const DIP = 0.88;

const splash = require("../../assets/images/splash-icon.png");

/** The flight, shared with the app so it can zoom along: the meeple's
 *  size, and whether we're flying at all. The app only ever zooms while
 *  `flying` is 1; once the intro is over (or gave up, or was cut short by
 *  the app going to the background) it is 0 and the app is at its own
 *  size whatever the size was left at. Both start at their resting
 *  values, since React may put back the first style it rendered. */
export interface IntroFlight {
  scale: SharedValue<number>;
  flying: SharedValue<number>;
}

export function useIntroFlight(): IntroFlight {
  const scale = useSharedValue(THROUGH);
  const flying = useSharedValue(0);
  return { scale, flying };
}

/** The app's own zoom while we fly in: a little close, settling to 1;
 *  at 1 always once we're through. */
export function useIntroAppStyle({ scale, flying }: IntroFlight) {
  return useAnimatedStyle(() => ({
    flex: 1,
    transform: [
      {
        scale:
          flying.value === 1
            ? interpolate(scale.value, [DIP, THROUGH], [1.12, 1], Extrapolation.CLAMP)
            : 1,
      },
    ],
  }));
}

/** The longest the way in may take before the app is simply shown. */
const GIVE_UP_MS = 4000;

export function AppIntro({
  ready,
  flight,
}: {
  /** The app underneath is ready to be seen. */
  ready: boolean;
  /** Shared with the app so it can zoom along. */
  flight: IntroFlight;
}) {
  const { scale, flying } = flight;
  const { width, height } = useWindowDimensions();
  const image = useImage(splash);
  const still = useReducedMotion();
  const [done, setDone] = useState(false);
  const fade = useSharedValue(1);
  // log of the meeple's size, which the flight animates
  const depth = useSharedValue(0);
  useAnimatedReaction(
    () => depth.value,
    (d) => scale.set(Math.exp(d)),
  );
  const [gaveUp, setGaveUp] = useState(false);
  // While we hold, the splash is copied by a plain view and picture,
  // drawn the way the native splash is, so swapping them can't be seen.
  // The native splash goes once that picture is on screen (or after a
  // wait: a missing picture must never hold the app shut), and the copy
  // goes when we take off — the canvas below has long been drawn by then.
  const [held, setHeld] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    if (onScreen) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setGaveUp(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onScreen]);
  const shown = image !== null && onScreen;
  // the way in is taken once, whichever way it goes
  const started = useRef(false);

  useEffect(() => {
    // wait for the app, and for the meeple (or for giving up on it)
    if (started.current || !ready || (!shown && !gaveUp)) return;
    started.current = true;
    const finish = () => {
      // whatever happened on the way, the app ends at its own size
      flying.set(0);
      scale.set(THROUGH);
      setDone(true);
    };
    // and never later than this, whatever happens to the animation
    setTimeout(finish, GIVE_UP_MS);
    if (still || !shown) {
      // no flight: the night simply lifts
      scale.set(THROUGH);
      fade.set(
        withTiming(0, { duration: 300 }, (ok) => {
          if (ok) scheduleOnRN(finish);
        }),
      );
      return;
    }
    flying.set(1);
    // a breath on the splash, so the hand-off isn't a jump, then lift off
    // (not cleared: once started, the copy must always go)
    setTimeout(() => setHeld(false), 300);
    // Flight is in steps of the logarithm of the size: an even pace in
    // it reads as an even speed, so easing it in is a real speed-up.
    depth.set(
      withSequence(
        withDelay(
          300,
          withTiming(Math.log(DIP), {
            duration: 260,
            easing: Easing.out(Easing.quad),
          }),
        ),
        // then a slow approach that turns into a rush through
        withTiming(
          Math.log(THROUGH),
          { duration: 900, easing: Easing.in(Easing.quad) },
          (ok) => {
            if (ok) scheduleOnRN(finish);
          },
        ),
      ),
    );
  }, [ready, still, shown, gaveUp, scale, flying, fade, depth]);

  const x = (width - SPLASH_WIDTH) / 2;
  const y = (height - SPLASH_WIDTH) / 2;
  const origin = {
    x: x + SPLASH_WIDTH * CHEST.x,
    y: y + SPLASH_WIDTH * CHEST.y,
  };
  const transform = useDerivedValue(() => [{ scale: scale.value }]);
  // the orange melts away as it nears, leaving only the window
  const fill = useDerivedValue(() =>
    interpolate(scale.value, [1, 2.6], [1, 0], Extrapolation.CLAMP),
  );
  // without a flight, everything simply fades
  const lift = useAnimatedStyle(() => ({ opacity: fade.value }));
  // and the last of the night goes as we pass through
  const night = useDerivedValue(() =>
    interpolate(
      scale.value,
      [THROUGH * 0.6, THROUGH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  );

  if (done) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, lift]}>
      {/* p3, as iOS draws the native splash: the colours must match */}
      <Canvas style={StyleSheet.absoluteFill} colorSpace="p3">
        <Group opacity={night}>
          {/* the night, with the meeple cut out of it */}
          <Group layer>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              color={SPLASH_BACKGROUND}
            />
            {image ? (
              <Group transform={transform} origin={origin}>
                <Image
                  image={image}
                  x={x}
                  y={y}
                  width={SPLASH_WIDTH}
                  height={SPLASH_WIDTH}
                  blendMode="dstOut"
                />
              </Group>
            ) : null}
          </Group>
          {/* the meeple itself, until it melts */}
          {image ? (
            <Group transform={transform} origin={origin} opacity={fill}>
              <Image
                image={image}
                x={x}
                y={y}
                width={SPLASH_WIDTH}
                height={SPLASH_WIDTH}
              />
            </Group>
          ) : null}
        </Group>
      </Canvas>
      {held ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: SPLASH_BACKGROUND },
          ]}
        >
          <Picture
            source={splash}
            onLoad={() => setOnScreen(true)}
            onError={() => setGaveUp(true)}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: SPLASH_WIDTH,
              height: SPLASH_WIDTH,
            }}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

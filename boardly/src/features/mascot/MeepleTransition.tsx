// Moving between screens through the meeple, the way the app opens: the
// screen you leave closes down into a meeple-shaped window (zoom in),
// the move happens in the dark, and the next screen opens back out of it
// (zoom out). Always both, one after the other. One layer over the whole
// app, tab bar and all; `go(move)` runs a move through it, in 1.5
// seconds (0.6 in, 0.9 out). Always at the middle of the screen, both
// ways, where the opening's meeple stands (a centred picture's chest),
// whoever calls it and wherever their own meeple is. On the UI thread;
// with reduced motion, the move simply happens.

import { Canvas, Group, Image, Rect, useImage } from "@shopify/react-native-skia";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { TABLE } from "@/theme";

const meeple = require("../../../assets/images/splash-icon.png");
/** The picture's size, and the point of it the window grows from. */
const SIZE = 300;
const CHEST = { x: 0.5, y: 0.47 };
/** The window's size shut, small, and wide open (by then it covers all),
 *  as logarithms: an even pace in them reads as an even speed. 0 on the
 *  scale is shut, 1 wide open. */
const SHUT = Math.log(0.015);
const SMALL = Math.log(0.32);
const OPEN = Math.log(14);
const at = (size: number) => (size - SHUT) / (OPEN - SHUT);
const AT_SMALL = at(SMALL);

type Go = (move: () => void) => void;
const Context = createContext<Go>((move) => move());

/** Runs a move (a navigation) through the meeple. */
export const useMeepleTransition = () => useContext(Context);

export function MeepleTransitionProvider({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const image = useImage(meeple);
  const progress = useSharedValue(1);
  const [moving, setMoving] = useState(false);
  const busy = useRef(false);

  const go = useCallback<Go>(
    (move) => {
      if (still || !image) {
        move();
        return;
      }
      if (busy.current) return;
      busy.current = true;
      setMoving(true);
      const done = () => {
        busy.current = false;
        setMoving(false);
      };
      // the next screen gets a moment in the dark to draw itself
      const thenOpen = () => {
        move();
        setTimeout(() => {
          progress.set(
            withSequence(
              // out of the dark to the mascot's size, a breath, then the rush
              withTiming(AT_SMALL, { duration: 210, easing: Easing.out(Easing.quad) }),
              withTiming(AT_SMALL * 0.88, { duration: 130, easing: Easing.inOut(Easing.quad) }),
              withTiming(1, { duration: 510, easing: Easing.in(Easing.quad) }, (ok) => {
                if (ok) scheduleOnRN(done);
              }),
            ),
          );
        }, 50);
      };
      // zoom in: the screen closes down into the meeple
      progress.set(1);
      progress.set(
        withSequence(
          withTiming(AT_SMALL, { duration: 420, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }, (ok) => {
            if (ok) scheduleOnRN(thenOpen);
          }),
        ),
      );
    },
    [still, image, progress],
  );

  // the window closes to and opens from the middle: the chest of a meeple
  // picture centred on the screen, as the app's opening draws it
  const cx = width / 2;
  const cy = height / 2 + SIZE * (CHEST.y - 0.5);
  const transform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: cy },
    { scale: Math.exp(SHUT + (OPEN - SHUT) * progress.get()) },
  ]);

  const value = useMemo(() => go, [go]);
  return (
    <Context.Provider value={value}>
      {children}
      {moving && image ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Group layer>
            <Rect x={0} y={0} width={width} height={height} color={TABLE.table[1]} />
            <Group transform={transform}>
              <Image image={image} x={-SIZE * CHEST.x} y={-SIZE * CHEST.y} width={SIZE} height={SIZE} blendMode="dstOut" />
            </Group>
          </Group>
        </Canvas>
      ) : null}
    </Context.Provider>
  );
}

// The shake, at the start of every round: my leather cup turned down on a
// green baize mat with my five dice under it. A tap (on the cup or the
// plinth) shakes it — the cup rattles, lifted off the mat, with a run of
// ticks in the hand, and lands with a thud. Then I drag the cup up (or tap
// it) to peek at what the server rolled. Five different faces (散骰) must
// be shaken again; otherwise Start sends the cup flying off and the dice
// fly up into the board hanging from the den (HangingBoard draws that
// flight). The steps live in `useShake` so the plinth can drive them.
// Still parts are baked once (art.ts); the cup moves by native
// transforms. With reduce motion on, the cup only fades.

import { Canvas, Group, Image as SkImage } from "@shopify/react-native-skia";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
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
import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { AppText, useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { heavyHaptic, moveHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";
import { cupArt, cupShadowArt, matArt } from "./art";
import type { Flight } from "./HangingBoard";
import { dieImage } from "./pieces";

export type ShakeStep = "closed" | "shaking" | "shaken" | "open" | "leaving";
type Measure = (done: (from: Flight["from"]) => void) => void;

const SHAKE_MS = 1400;
const STILL_MS = 450;
const LIFT_MS = 420;
const OFF_MS = 480;

/** Where the five dice lie under the cup, in dice from the mat's middle
 *  (their centres), and how each is turned. */
const CLUSTER = [
  { x: -0.6, y: -0.98, r: -0.18 },
  { x: 0.58, y: -1.02, r: 0.12 },
  { x: -1.18, y: 0.02, r: 0.1 },
  { x: 0.02, y: 0.08, r: -0.06 },
  { x: 1.2, y: 0.0, r: 0.2 },
];

/** The shake's steps and its moving parts, for the scene and the plinth.
 *  `initial` opens it part way (the dev page's samples). */
export function useShake(round: number, initial: ShakeStep = "closed") {
  const still = useReducedMotion();
  const [at, setAt] = useState({ round, step: initial });
  const step: ShakeStep = at.round === round ? at.step : "closed";
  const rattle = useSharedValue(0);
  const lift = useSharedValue(initial === "open" ? 1 : 0);
  const off = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Set by the scene: where its dice are in the window now. */
  const measure = useRef<Measure | null>(null);
  const setMeasure = useCallback((fn: Measure | null) => {
    measure.current = fn;
  }, []);

  // a new round starts with the cup down
  const [seen, setSeen] = useState(round);
  if (seen !== round) {
    setSeen(round);
    setAt({ round, step: "closed" });
  }
  useEffect(() => {
    if (step !== "closed") return;
    rattle.set(0);
    off.set(0);
  }, [step, round, rattle, off]);
  const firstRound = useRef(round);
  useEffect(() => {
    if (round === firstRound.current) return;
    lift.set(0);
  }, [round, lift]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const go = (s: ShakeStep) => setAt({ round, step: s });

  const shake = () => {
    if (step !== "closed") return;
    go("shaking");
    const ms = still ? STILL_MS : SHAKE_MS;
    // the dice rattling in the hand: a quick uneven run of ticks and taps
    let t = 0;
    for (let n = 0; t < ms - 200; n++) {
      later(n % 5 === 3 ? moveHaptic : n % 2 ? tapHaptic : tickHaptic, t);
      t += 50 + ((n * 37) % 60);
    }
    later(heavyHaptic, ms - 40);
    later(() => go("shaken"), ms);
    rattle.set(0);
    rattle.set(withTiming(1, { duration: ms, easing: Easing.linear }));
  };
  const raise = () => {
    if (step !== "shaken") return;
    tapHaptic();
    lift.set(withTiming(1, { duration: LIFT_MS, easing: Easing.out(Easing.cubic) }));
    later(() => go("open"), LIFT_MS - 120);
  };
  /** Back down over the dice, to be shaken again (散骰). */
  const lower = () => {
    if (step !== "open") return;
    lift.set(withTiming(0, { duration: 360, easing: Easing.in(Easing.quad) }));
    later(moveHaptic, 340);
    go("closed");
  };
  /** The cup flies off; then the dice are handed to `fly`, or with
   *  reduce motion on the round simply starts (`done`). */
  const leave = (fly: (from: Flight["from"]) => void, done: () => void) => {
    if (step !== "open") return;
    go("leaving");
    if (still) {
      done();
      return;
    }
    tapHaptic();
    off.set(withTiming(1, { duration: OFF_MS, easing: Easing.in(Easing.quad) }));
    later(() => (measure.current ? measure.current(fly) : done()), OFF_MS * 0.55);
  };
  return { step, still, rattle, lift, off, setMeasure, shake, raise, lower, leave };
}
export type Shake = ReturnType<typeof useShake>;

/** Two gold chevrons pointing up: drag the cup up. */
const chevronArt = (w: number, h: number) => {
  const g = MATERIALS.gold;
  const one = (y: number) =>
    `<path d="M${w * 0.18} ${y + h * 0.3}L${w / 2} ${y}L${w * 0.82} ${y + h * 0.3}L${w * 0.82} ${y + h * 0.44}L${w / 2} ${y + h * 0.16}L${w * 0.18} ${y + h * 0.44}Z" fill="url(#cv)" stroke="${INKS.gold.ink}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="cv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="0.5" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient></defs>${one(h * 0.04)}${one(h * 0.5)}</svg>`;
};

function Chevrons({ x, y }: { x: number; y: number }) {
  const w = 26;
  const h = 30;
  const image = bakedSvg("ld-chevrons", w, h, () => chevronArt(w, h));
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1));
  }, [bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 6 }], opacity: 0.55 + bob.value * 0.45 }));
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.at, { left: x - w / 2, top: y - h, width: w, height: h }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>{image ? <SkImage image={image} x={0} y={0} width={w} height={h} /> : null}</Canvas>
    </Animated.View>
  );
}

/** The cup's shadow on the mat: it fades and spreads as the cup leaves
 *  the baize. */
function CupShadow({ shake, x, y, w }: { shake: Shake; x: number; y: number; w: number }) {
  const h = w * 0.3;
  const image = bakedSvg("ld-cup-shadow", w, h, () => cupShadowArt(w, h));
  const { rattle, lift, off } = shake;
  const style = useAnimatedStyle(() => {
    const k = rattle.value;
    const env = k <= 0 || k >= 1 ? 0 : Math.min(1, k / 0.1, (1 - k) / 0.07);
    const away = Math.max(env * 0.6, lift.value, off.value);
    return { opacity: 1 - away, transform: [{ scale: 1 + away * 0.25 }] };
  });
  return (
    <Animated.View style={[styles.at, { left: x - w / 2, top: y - h / 2, width: w, height: h }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>{image ? <SkImage image={image} x={0} y={0} width={w} height={h} /> : null}</Canvas>
    </Animated.View>
  );
}

function Cup({
  shake,
  w,
  h,
  left,
  top,
  lift,
  stageW,
}: {
  shake: Shake;
  w: number;
  h: number;
  left: number;
  top: number;
  lift: number;
  stageW: number;
}) {
  const image = bakedSvg("ld-cup-bare", w, h, () => cupArt(w, false));
  const { rattle, off, still } = shake;
  const up: SharedValue<number> = shake.lift;
  const style = useAnimatedStyle(() => {
    const k = rattle.value;
    const env = k <= 0 || k >= 1 ? 0 : Math.min(1, k / 0.1, (1 - k) / 0.07);
    const u = up.value;
    const o = off.value;
    if (still) {
      return {
        opacity: (1 - 0.45 * Math.sin(Math.PI * Math.max(0, Math.min(1, k)))) * (1 - u * 0.9) * (1 - o),
        transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: "0rad" }],
      };
    }
    const tx = Math.sin(k * Math.PI * 16) * 9 * env - u * lift * 0.08 + o * stageW * 0.75;
    const ty = -env * 22 - Math.abs(Math.sin(k * Math.PI * 16)) * 5 * env - u * lift - o * 150;
    const rot = Math.sin(k * Math.PI * 20 + 0.6) * 0.13 * env - u * 0.16 + o * 1.2;
    return {
      opacity: 1 - o * o,
      transform: [{ translateX: tx }, { translateY: ty }, { rotate: `${rot}rad` }],
    };
  });
  return (
    <Animated.View style={[styles.at, { left, top, width: w, height: h, transformOrigin: [w / 2, h * 0.9, 0] }, style]}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {image ? <SkImage image={image} x={0} y={0} width={w} height={h} /> : null}
      </Canvas>
    </Animated.View>
  );
}

export function ShakeScene({
  shake,
  faces,
  top,
  flying,
  scattered,
  canShake,
  tag,
}: {
  shake: Shake;
  /** My dice, as the server rolled them. */
  faces: number[];
  /** Room left clear at the top (the hanging board). */
  top: number;
  /** The dice are on their way up to the board. */
  flying: boolean;
  /** All five different: they must be shaken again. */
  scattered: boolean;
  /** The cup may be shaken now (not while a reshake is on its way). */
  canShake: boolean;
  /** The 散骰 tag shown under the mat. */
  tag: string;
}) {
  const [{ w, h }, onLayout] = useBox();
  const ref = useRef<View>(null);
  const { step, lift: up, raise, shake: doShake, setMeasure } = shake;

  // the sizes, from the room there is
  const d = Math.max(22, Math.min(34, (h - top - 16) / 9.2));
  const cupW = d * 4.55;
  const cupH = cupW * 1.15;
  const lift = d * 3.2;
  const cx = w / 2;
  const span = d * 9.2;
  const my = top + 8 + d * 7.1 + Math.max(0, (h - top - 16 - span) / 2);
  const matW = d * 7.4;
  const matH = d * 3.3;
  const dice = CLUSTER.map((c) => ({ x: cx + c.x * d, y: my + c.y * d, r: c.r }));
  const mat = bakedSvg("ld-mat", matW, matH, () => matArt(matW, matH));

  // where the dice are in the window, for their flight to the board
  const dicePlaces = JSON.stringify(dice.map((p) => [Math.round(p.x), Math.round(p.y)]));
  useEffect(() => {
    const places = JSON.parse(dicePlaces) as [number, number][];
    setMeasure((done) => {
      ref.current?.measureInWindow((ox, oy) =>
        done(places.map(([x, y], i) => ({ x: ox + x, y: oy + y, size: d, rot: CLUSTER[i].r }))),
      );
    });
    return () => setMeasure(null);
  }, [dicePlaces, d, setMeasure]);

  // drag the cup up to look; or tap it (shake when it's down and still)
  const crossed = useSharedValue(0);
  const pan = Gesture.Pan()
    .enabled(step === "shaken")
    .onUpdate((e) => {
      const u = Math.max(0, Math.min(1, -e.translationY / lift));
      up.set(u);
      if (u > 0.4 && crossed.get() === 0) {
        crossed.set(1);
        scheduleOnRN(tickHaptic);
      } else if (u < 0.3) crossed.set(0);
    })
    .onEnd((e) => {
      if (up.get() > 0.4 || e.velocityY < -600) scheduleOnRN(raise);
      else up.set(withSpring(0, { damping: 14, stiffness: 180 }));
    });
  const tap = Gesture.Tap()
    .enabled((step === "closed" && canShake) || step === "shaken")
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(step === "closed" ? doShake : raise);
    });
  const gesture = Gesture.Race(pan, tap);

  const cupLeft = cx - cupW / 2;
  const cupTop = my + d * 0.8 - cupH * 0.9;

  return (
    <View ref={ref} style={StyleSheet.absoluteFill} onLayout={onLayout} collapsable={false}>
      {w > 0 ? (
        <>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
              {mat ? <SkImage image={mat} x={cx - matW / 2} y={my + d * 0.05 - matH * 0.46} width={matW} height={matH} /> : null}
              {/* (in the air while the cup rattles, so nothing shows under it) */}
              {flying || step === "shaking"
                ? null
                : faces.slice(0, CLUSTER.length).map((face, i) => {
                    const img = dieImage(face, d);
                    const p = dice[i];
                    return img ? (
                      <Group key={i} transform={[{ translateX: p.x }, { translateY: p.y }, { rotate: p.r }]}>
                        <SkImage image={img} x={-d * 0.6} y={-d * 0.6} width={d * 1.2} height={d * 1.2} />
                      </Group>
                    ) : null;
                  })}
            </Canvas>
          </View>
          {step === "open" && scattered ? (
            <Animated.View entering={FadeIn.duration(300)} style={[styles.tagAt, { top: my + matH * 0.62 }]} pointerEvents="none">
              <View style={styles.tag}>
                <AppText style={styles.tagText}>{tag}</AppText>
              </View>
            </Animated.View>
          ) : null}
          {step === "shaken" ? <Chevrons x={cx} y={cupTop - 6} /> : null}
          <CupShadow shake={shake} x={cx + 2} y={cupTop + cupH * 0.93} w={cupW * 1.1} />
          <GestureDetector gesture={gesture}>
            <Cup shake={shake} w={cupW} h={cupH} left={cupLeft} top={cupTop} lift={lift} stageW={w} />
          </GestureDetector>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  at: { position: "absolute" },
  tagAt: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 9,
    borderWidth: 1,
    backgroundColor: "#9A1828",
    borderColor: "#FF8A94",
  },
  tagText: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 17, letterSpacing: 0.5, color: "#FFF2F0" },
});

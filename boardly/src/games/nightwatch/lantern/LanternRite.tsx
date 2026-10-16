// The vote and the mission, played with lanterns in the middle of the
// stage. Three views, all on one canvas with one clock:
//
//   choose — two lanterns hang side by side, the good one (gold, an
//            emerald, a green flame) and the bad (black iron and thorns,
//            a ruby, a red flame), swinging a little. Tap one to pick it;
//            holding the button (HoldButton, sharing `hold`) pours light
//            up into it until it bursts into its aura — Shadow Flame's
//            fire, or Blood Moon's smoke.
//   gather — the manor's own lantern, a candle under it for each player
//            taking part: a candle lights as its player finishes, and a
//            stream of light rises into the lantern. Nothing tells whose
//            choice was which.
//   reveal — every candle's light pours in, and the lantern breaks into
//            the result: gold with green fire, or black iron in red
//            smoke. For a vote, each candle takes its player's colour.

import { Canvas } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { BezelOverlay, useBox } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic } from "@/utils/haptics";
import { GameText as AppText } from "../GameText";
import { GLASS, LANTERN_H, LANTERN_W } from "./art";
import { LIGHT } from "./fx";
import { Burst, Candle, Lantern, Motes } from "./Lantern";

export type Side = "good" | "bad";

/** A player taking part: whether they've finished, and the colour their
 *  candle shows (0 gold, 1 green, -1 red). */
export interface RiteSeat {
  seat: number;
  name: string;
  done: boolean;
  tint: number;
}

export type RiteView =
  | {
      kind: "choose";
      labels: Record<Side, string>;
      /** A lantern I may not pick (a watcher can't fail a mission). */
      locked: Side | null;
      picked: Side | null;
      /** What I've cast (the hold finished). */
      cast: Side | null;
      onPick: (side: Side) => void;
    }
  | { kind: "gather"; seats: RiteSeat[] }
  | { kind: "reveal"; seats: RiteSeat[]; result: Side; key: string };

export function LanternRite({
  view,
  hold,
  paused,
}: {
  view: RiteView;
  hold: SharedValue<number>;
  paused: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {w > 0 ? (
        view.kind === "choose" ? (
          <Choose view={view} hold={hold} clock={clock} w={w} h={h} />
        ) : (
          <Gather
            key={view.kind === "reveal" ? view.key : "gather"}
            view={view}
            clock={clock}
            w={w}
            h={h}
          />
        )
      ) : null}
    </View>
  );
}

// ── choose ──────────────────────────────────────────────────────────

function Choose({
  view,
  hold,
  clock,
  w,
  h,
}: {
  view: Extract<RiteView, { kind: "choose" }>;
  hold: SharedValue<number>;
  clock: SharedValue<number>;
  w: number;
  h: number;
}) {
  const { picked, locked, cast } = view;
  // as big as the stage allows, hanging so the pair sits in the middle
  const s = Math.min(((h - 60) * 0.8) / LANTERN_H, (w * 0.44) / LANTERN_W);
  const drop = Math.max(0, (h - LANTERN_H * s - 44) * 0.42);
  const at = { good: w * 0.27, bad: w * 0.73 };
  const glassY = drop + GLASS.cy * s - 6;

  // they swing in from the sides
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.set(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.2)) }),
    );
  }, [enter]);
  const shiftGood = useDerivedValue(() => -(1 - enter.value) * w * 0.5);
  const shiftBad = useDerivedValue(() => (1 - enter.value) * w * 0.5);

  const shownOf = (side: Side) =>
    side === locked ? 0.3 : picked && picked !== side ? 0.4 : 1;
  const goodShown = useSharedValue(shownOf("good"));
  const badShown = useSharedValue(shownOf("bad"));
  useEffect(() => {
    goodShown.set(withTiming(shownOf("good"), { duration: 350 }));
    badShown.set(withTiming(shownOf("bad"), { duration: 350 }));
  });
  const goodLit = useSharedValue(locked === "good" ? 0 : 0.6);
  const badLit = useSharedValue(locked === "bad" ? 0 : 0.5);
  const goodPower = useDerivedValue(
    () => (picked === "good" ? hold.value : 0),
    [picked],
  );
  const badPower = useDerivedValue(
    () => (picked === "bad" ? hold.value : 0),
    [picked],
  );
  const flow = useDerivedValue(
    () => (picked && !cast ? Math.min(1, hold.value * 1.6) : 0),
    [picked, cast],
  );

  // the moment it's cast: a ring of light flies off it
  const burst = useSharedValue(0);
  useEffect(() => {
    if (cast) {
      burst.set(0);
      burst.set(
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [cast, burst]);

  const target = picked
    ? { x: at[picked], y: glassY }
    : { x: w / 2, y: glassY };
  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Lantern
          kind="good"
          x={at.good}
          y={-6}
          drop={drop}
          scale={s}
          clock={clock}
          lit={goodLit}
          power={goodPower}
          shown={goodShown}
          shift={shiftGood}
          seed={1}
        />
        <Lantern
          kind="bad"
          x={at.bad}
          y={-6}
          drop={drop}
          scale={s}
          clock={clock}
          lit={badLit}
          power={badPower}
          shown={badShown}
          shift={shiftBad}
          seed={2}
        />
        <Motes
          clock={clock}
          flow={flow}
          from={{ x0: w * 0.15, x1: w * 0.85, y: h + 60 }}
          to={target}
          color={picked ? LIGHT[picked].glow : "#FFC870"}
        />
        {cast ? (
          <Burst
            x={at[cast]}
            y={glassY}
            go={burst}
            color={LIGHT[cast].glow}
            size={w * 0.4}
          />
        ) : null}
      </Canvas>
      {(["good", "bad"] as const).map((side) => (
        <View
          key={side}
          style={[
            styles.choice,
            { left: at[side] - (LANTERN_W * s) / 2, width: LANTERN_W * s },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={view.labels[side]}
            accessibilityState={{
              selected: picked === side,
              disabled: locked === side,
            }}
            disabled={locked === side || cast !== null}
            onPress={() => view.onPick(side)}
            style={{ width: "100%", height: drop + LANTERN_H * s }}
          >
            {locked === side ? (
              <View style={[styles.lock, { top: glassY - 18 }]}>
                <Emblem emoji="🔒" size={34} />
              </View>
            ) : null}
          </Pressable>
          <Plate
            side={side}
            label={view.labels[side]}
            on={picked === side}
            dim={locked === side || (picked !== null && picked !== side)}
          />
        </View>
      ))}
    </>
  );
}

const PLATE = {
  good: ["#5ED88A", "#1E8A4A", "#0C4622"],
  bad: ["#E8485A", "#9A1428", "#44060E"],
} as const;

/** The lantern's name on an enamel plate under it. */
function Plate({
  side,
  label,
  on,
  dim,
}: {
  side: Side;
  label: string;
  on: boolean;
  dim: boolean;
}) {
  return (
    <View style={[styles.plate, dim && styles.dim, on && styles.on]}>
      <LinearGradient
        colors={PLATE[side] as unknown as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      <BezelOverlay r={10} t={3} />
      <AppText style={styles.plateText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

// ── gather and reveal ───────────────────────────────────────────────

function Gather({
  view,
  clock,
  w,
  h,
}: {
  view: Exclude<RiteView, { kind: "choose" }>;
  clock: SharedValue<number>;
  w: number;
  h: number;
}) {
  const seats = view.seats;
  const reveal = view.kind === "reveal" ? view : null;
  const done = seats.filter((seat) => seat.done).length;
  const share = seats.length ? done / seats.length : 0;
  const s = Math.min((h - 124) / LANTERN_H, (w * 0.46) / LANTERN_W);
  const drop = Math.max(0, (h - 118 - LANTERN_H * s) * 0.55);
  const glassY = drop + GLASS.cy * s - 6;
  const cx = w / 2;

  // the candles stand in a gentle curve under the lantern
  const span = Math.min(w * 0.86, Math.max(seats.length - 1, 1) * 64);
  const candles = seats.map((seat, i) => {
    const u = seats.length > 1 ? (i / (seats.length - 1)) * 2 - 1 : 0;
    return { ...seat, x: cx + (u * span) / 2, y: h - 34 - 14 * u * u };
  });

  const appear = useSharedValue(0);
  const sealLit = useSharedValue(0.3);
  const sealPower = useSharedValue(0);
  const resultIn = useSharedValue(0);
  const sealShown = useDerivedValue(
    () => appear.value * (reveal ? 1 - resultIn.value : 1),
  );
  const resultPower = useSharedValue(0);
  const flow = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    appear.set(withTiming(1, { duration: 600 }));
  }, [appear]);

  // each player who finishes sends a stream of light up into it
  useEffect(() => {
    if (reveal) return;
    sealLit.set(withTiming(0.3 + 0.7 * share, { duration: 700 }));
    if (done > 0) {
      flow.set(
        withSequence(
          withTiming(0.8, { duration: 250 }),
          withTiming(0, { duration: 1200 }),
        ),
      );
      sealPower.set(
        withSequence(
          withTiming(0.18 + 0.2 * share, { duration: 300 }),
          withTiming(0, { duration: 1400 }),
        ),
      );
    }
  }, [done, share, reveal, sealLit, flow, sealPower]);

  // the reveal: everything pours in, then it breaks into the result
  useEffect(() => {
    if (!reveal) return;
    const pour = 1400;
    sealLit.set(withTiming(1, { duration: pour }));
    sealPower.set(
      withTiming(0.85, { duration: pour, easing: Easing.in(Easing.quad) }),
    );
    flow.set(
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(pour - 500, withTiming(0, { duration: 400 })),
      ),
    );
    resultIn.set(withDelay(pour, withTiming(1, { duration: 450 })));
    resultPower.set(withDelay(pour, withTiming(1, { duration: 600 })));
    burst.set(
      withDelay(
        pour,
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
      ),
    );
    const thud = setTimeout(() => {
      heavyHaptic();
      if (reveal.result === "good") successHaptic();
      else errorHaptic();
    }, pour);
    return () => clearTimeout(thud);
  }, [reveal, sealLit, sealPower, flow, resultIn, resultPower, burst]);

  const resultLit = useDerivedValue(() => resultIn.value);
  const first = candles[0];
  const last = candles[candles.length - 1];
  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Lantern
          kind="seal"
          x={cx}
          y={-6}
          drop={drop}
          scale={s}
          clock={clock}
          lit={sealLit}
          power={sealPower}
          shown={sealShown}
          seed={3}
        />
        {reveal ? (
          <Lantern
            kind={reveal.result}
            x={cx}
            y={-6}
          drop={drop}
            scale={s}
            clock={clock}
            lit={resultLit}
            power={resultPower}
            shown={resultIn}
            seed={3}
          />
        ) : null}
        {candles.length > 0 ? (
          <Motes
            clock={clock}
            flow={flow}
            from={{
              x0: first.x,
              x1: last.x,
              y: Math.min(...candles.map((c) => c.y)) - 46,
            }}
            to={{ x: cx, y: glassY }}
            color="#FFD58A"
            count={30}
          />
        ) : null}
        {reveal ? (
          <Burst
            x={cx}
            y={glassY}
            go={burst}
            color={LIGHT[reveal.result].glow}
            size={w * 0.55}
          />
        ) : null}
        {candles.map((c, i) => (
          <Candle
            key={c.seat}
            x={c.x}
            y={c.y}
            clock={clock}
            done={c.done || reveal !== null}
            tint={reveal ? c.tint : 0}
            delay={reveal ? 1500 + i * 140 : 0}
            seed={i}
          />
        ))}
      </Canvas>
      {candles.map((c) => (
        <AppText
          key={c.seat}
          numberOfLines={1}
          style={[
            styles.name,
            {
              left: c.x - 34,
              top: c.y + 1,
              opacity: c.done || reveal ? 1 : 0.55,
            },
          ]}
        >
          {c.name}
        </AppText>
      ))}
    </>
  );
}

/** The lines under the stage during a reveal, fading in as it breaks. */
export function RevealTitle({
  title,
  detail,
  good,
}: {
  title: string;
  detail?: string;
  good: boolean;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(1400).duration(500)}
      style={styles.reveal}
    >
      <AppText
        style={[styles.revealTitle, { color: good ? "#8CFFB0" : "#FF8A94" }]}
        numberOfLines={1}
      >
        {title}
      </AppText>
      {detail ? (
        <AppText style={styles.revealDetail} numberOfLines={2}>
          {detail}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  choice: { position: "absolute", top: 0, alignItems: "center" },
  lock: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  plate: {
    marginTop: -2,
    minWidth: 104,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  dim: { opacity: 0.45 },
  on: { transform: [{ scale: 1.08 }] },
  plateText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 1,
    color: "#FFF6E6",
    textTransform: "uppercase",
    ...shadow,
  },
  name: {
    position: "absolute",
    width: 68,
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: "#F1E6D2",
    ...shadow,
  },
  reveal: { alignItems: "center", gap: 2 },
  revealTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    ...shadow,
  },
  revealDetail: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    ...shadow,
  },
});

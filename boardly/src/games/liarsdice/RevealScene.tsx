// The reveal, played once on each device: the call that was challenged
// chalked on the slate, then every cup lifted off its dice one after
// another, the dice that count for the call lit in gold one by one as the
// tally climbs toward it (a tick in the hand with each), the cup that is
// a 豹子 counting its extra one (a 大豹子 two). Then the verdict: a lie or the
// call stands, and the one who drinks lit red, the cups they drink
// stamped on their row ("out" if it was their last).

import { Canvas, Group, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { AppText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic, tickHaptic } from "@/utils/haptics";
import { cupArt } from "./art";
import { Call, Slate, dieBox, dieImage } from "./pieces";
import { leopardBonus, myCount, type Reveal } from "./logic";

const LIFT_MS = 900;

/** One player's cup lifting off their dice. */
function LiftedCup({ x, y, w, lift, delay }: { x: number; y: number; w: number; lift: SharedValue<number>; delay: number }) {
  const h = w * 1.15;
  const image = bakedSvg("ld-cup", w, h, () => cupArt(w));
  const transform = useDerivedValue(() => {
    const k = Math.max(0, Math.min(1, (lift.value * LIFT_MS * 2 - delay) / LIFT_MS));
    return [{ translateX: x }, { translateY: y - k * k * 60 }, { rotate: -k * 0.25 }];
  });
  const opacity = useDerivedValue(() => {
    const k = Math.max(0, Math.min(1, (lift.value * LIFT_MS * 2 - delay) / LIFT_MS));
    return 1 - k;
  });
  return image ? (
    <Group transform={transform}>
      <SkImage image={image} x={0} y={0} width={w} height={h} opacity={opacity} />
    </Group>
  ) : null;
}

export function RevealScene({
  reveal,
  nameOf,
  heading,
  mySeat,
  onCounted,
}: {
  reveal: Reveal;
  nameOf: (seat: number) => string;
  /** Who challenged whose call, and how. */
  heading: string;
  mySeat: number;
  /** The count is done and the verdict is in. */
  onCounted: () => void;
}) {
  const { t } = useTranslation();
  const still = useReducedMotion();
  const { width } = useWindowDimensions();
  const { bid } = reveal;
  const rows = reveal.dice
    .map((hand, seat) => ({ seat, hand: [...hand].sort((a, b) => a - b) }))
    .filter((r) => r.hand.length > 0);
  const two = rows.length > 5;
  const die = two ? 21 : 30;
  const gap = two ? 3 : 5;
  const colW = two ? (width - 24) / 2 : Math.min(width - 32, 330);
  const rowH = die * 1.2 + (two ? 22 : 10);
  const nameW = two ? colW - 5 * (die + gap) - 12 : 92;

  // what counts, in the order it's counted: each die, and a cup of five of
  // a kind its extra one
  const order: { row: number; die: number }[] = [];
  rows.forEach((r, k) => {
    r.hand.forEach((d, i) => {
      if (myCount([d], bid.face, bid.zhai) > 0) order.push({ row: k, die: i });
    });
    // 豹子 one more, 大豹子 two
    for (let b = 1; b <= leopardBonus(r.hand, bid.face, bid.zhai); b++) order.push({ row: k, die: -b });
  });
  const [counted, setCounted] = useState(still ? order.length : 0);
  const done = counted >= order.length;
  const lift = useSharedValue(still ? 1 : 0);
  const told = useRef(false);
  const doneRef = useRef(onCounted);
  useEffect(() => {
    doneRef.current = onCounted;
  });

  useEffect(() => {
    if (still) return;
    lift.set(withTiming(1, { duration: LIFT_MS + rows.length * 120, easing: Easing.out(Easing.quad) }));
    const each = Math.max(140, Math.min(320, 2600 / Math.max(1, order.length)));
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let k = 1; k <= order.length; k++) {
      timers.push(
        setTimeout(() => {
          tickHaptic();
          setCounted(k);
        }, LIFT_MS + 300 + k * each),
      );
    }
    timers.push(setTimeout(() => setCounted(order.length), LIFT_MS + 300 + order.length * each + 10));
    return () => timers.forEach(clearTimeout);
    // the reveal plays once, as it was when it opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!done || told.current) return;
    told.current = true;
    const lost = reveal.loser === mySeat;
    const thud = setTimeout(() => {
      heavyHaptic();
      if (mySeat >= 0) (lost ? errorHaptic : successHaptic)();
      doneRef.current();
    }, still ? 0 : 450);
    return () => clearTimeout(thud);
  }, [done, reveal.loser, mySeat, still]);

  const shown = order.slice(0, counted);
  const isLit = (row: number, i: number) => shown.some((o) => o.row === row && o.die === i);
  const bonus = (row: number) => shown.filter((o) => o.row === row && o.die < 0).length;
  const tallied = done ? reveal.found : shown.length;
  const lie = reveal.found < bid.quantity;

  const cols = two ? 2 : 1;
  const perCol = Math.ceil(rows.length / cols);
  const gridW = cols * colW + (cols - 1) * 8;
  const gridH = perCol * rowH + (perCol - 1) * 6;
  const at = (k: number) => ({
    x: Math.floor(k / perCol) * (colW + 8),
    y: (k % perCol) * (rowH + 6),
  });
  const diceX = (k: number, i: number) => at(k).x + (two ? 8 : nameW + 8) + i * (die + gap) + die * 0.1;
  const diceY = (k: number) => at(k).y + (two ? 18 : 5) + die * 0.1;

  return (
    <View style={styles.scene}>
      <Slate width={Math.min(width - 32, 300)} height={92}>
        <AppText style={styles.heading} numberOfLines={1}>
          {heading}
        </AppText>
        <Call quantity={bid.quantity} face={bid.face} zhai={bid.zhai} size={30} />
        <AppText style={[styles.tally, done && (lie ? styles.red : styles.green)]}>
          {t("liarsdice.stage.counted", { count: tallied, need: bid.quantity })}
        </AppText>
      </Slate>

      <View style={{ width: gridW, height: gridH }}>
        {rows.map((r, k) => {
          const loser = done && r.seat === reveal.loser;
          return (
            <View key={r.seat} style={[styles.row, { left: at(k).x, top: at(k).y, width: colW, height: rowH }]}>
              <LinearGradient
                colors={loser ? ["#9A1828", "#5A0812"] : ["#2A1A10", "#1A100A"]}
                style={StyleSheet.absoluteFill}
              />
              <BezelOverlay r={9} t={2} metal={loser ? "gold" : "silver"} />
              <AppText
                style={[styles.name, two ? styles.nameTop : { width: nameW, top: rowH / 2 - 9 }, r.seat === mySeat && styles.me]}
                numberOfLines={1}
              >
                {nameOf(r.seat)}
                {bonus(k) ? <AppText style={styles.bonus}>{`  🐆+${bonus(k)}`}</AppText> : null}
              </AppText>
              {loser ? (
                <Animated.View entering={ZoomIn.duration(320)} style={[styles.stamp, { top: two ? 1 : rowH / 2 - 11 }]}>
                  <AppText style={styles.stampText}>{`🍺 +${reveal.drink}${reveal.out ? ` · ${t("liarsdice.stage.out")}` : ""}`}</AppText>
                </Animated.View>
              ) : null}
            </View>
          );
        })}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            {rows.map((r, k) =>
              r.hand.map((d, i) => {
                const lit = isLit(k, i);
                const counts = myCount([d], bid.face, bid.zhai) > 0;
                const img = dieImage(d, die, lit ? "lit" : done && !counts ? "dim" : "plain");
                return img ? <SkImage key={`${k}-${i}`} image={img} {...dieBox(diceX(k, i) - die * 0.1, diceY(k) - die * 0.1, die)} /> : null;
              }),
            )}
            {rows.map((r, k) => (
              <LiftedCup
                key={r.seat}
                x={diceX(k, 2) - die * 0.1 - die * 0.3}
                y={diceY(k) - die * 0.7}
                w={die * 1.6}
                lift={lift}
                delay={k * 120}
              />
            ))}
          </Canvas>
        </View>
      </View>

      {done ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.verdict}>
          <AppText style={[styles.verdictTitle, lie ? styles.red : styles.green]} numberOfLines={1}>
            {t(lie ? "liarsdice.stage.lie" : "liarsdice.stage.stands")}
          </AppText>
          <AppText style={styles.verdictLine} numberOfLines={2}>
            {`${t("liarsdice.found", { count: reveal.found, face: bid.face })} · ${t("liarsdice.drinks", { name: nameOf(reveal.loser), count: reveal.drink })}${reveal.out ? ` ${t("liarsdice.drunkOut")}` : ""}`}
          </AppText>
        </Animated.View>
      ) : (
        <View style={styles.verdict} />
      )}
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  scene: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  heading: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 15, color: "#E8D2B4", ...shadow },
  tally: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 17, color: "#FFD58A", ...shadow },
  red: { color: "#FF8A94" },
  green: { color: "#8CFFB0" },
  row: { position: "absolute", borderRadius: 9, overflow: "hidden" },
  name: { position: "absolute", left: 10, fontFamily: fontFamily.semiBold, fontSize: 12.5, lineHeight: 17, color: "#F1E6D2", ...shadow },
  nameTop: { top: 2, right: 60, fontSize: 11, lineHeight: 15 },
  me: { color: "#FFE7A8", fontFamily: fontFamily.bold },
  bonus: { fontFamily: fontFamily.bold, color: "#FFD58A" },
  stamp: { position: "absolute", right: 6, paddingHorizontal: 6, borderRadius: 6, backgroundColor: "#2A0408" },
  stampText: { fontFamily: fontFamily.bold, fontSize: 11.5, lineHeight: 20, color: "#FFE0E0" },
  verdict: { minHeight: 46, alignItems: "center", paddingHorizontal: 20 },
  verdictTitle: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 25, letterSpacing: 1.2, textTransform: "uppercase", ...shadow },
  verdictLine: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, color: "#F1E6D2", textAlign: "center", ...shadow },
});

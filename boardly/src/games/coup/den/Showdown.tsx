// A challenge, settled in front of everyone: the claimed card held up
// face down under the lamps; a beat; then it turns over — the role it
// claimed, in a burst of gold, when the claim was true — or it shakes and
// a red BLUFF is stamped across it when it wasn't. Under it, the two of
// them on the stage, the loser's light turned red.

import { Canvas } from "@shopify/react-native-skia";
import { memo, useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { AppText, useBox } from "@/components/ui";
import { Burst } from "@/features/game/stage/light";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic } from "@/utils/haptics";
import { ROLE_TINT } from "../art";
import { FlipCard } from "../cards";
import type { Role } from "../logic";

const CARD = 120;
/** The least room the lineup under the card needs: two rows of players
 *  past five, one row otherwise. */
const LINEUP_MIN = { one: 190, two: 270 };
/** The title, the verdict and the gaps round the card. */
const WORDS_H = 135;
const TURN_AT = 900;

export const Showdown = memo(function Showdown({
  title,
  role,
  caught,
  verdict,
  lineup,
  crowd = false,
}: {
  /** "Ming calls Hua's bluff" */
  title: string;
  role: Role;
  /** The claim was a bluff. */
  caught: boolean;
  /** What follows: who loses a card. */
  verdict: string;
  lineup: ReactNode;
  /** Two rows of players under the card. */
  crowd?: boolean;
}) {
  const [{ w }, onLayout] = useBox();
  // the card shrinks on a short stage, so the players under it stay clear
  // of the verdict
  const [{ h: tall }, onWrap] = useBox();
  const card = tall > 0 ? Math.max(84, Math.min(CARD, (tall - WORDS_H - LINEUP_MIN[crowd ? "two" : "one"]) / 1.4 - 20)) : CARD;
  const flip = useSharedValue(0);
  const shake = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    if (caught) {
      shake.set(
        withDelay(
          TURN_AT - 300,
          withSequence(
            ...[1, -1, 1, -1, 0.5, 0].map((k) => withTiming(k, { duration: 60 })),
          ),
        ),
      );
    } else {
      flip.set(withDelay(TURN_AT, withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) })));
      burst.set(withDelay(TURN_AT + 300, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) })));
    }
    const thud = setTimeout(() => {
      heavyHaptic();
      if (caught) errorHaptic();
      else successHaptic();
    }, TURN_AT + 260);
    return () => clearTimeout(thud);
  }, [caught, flip, shake, burst]);
  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value * 7 }, { rotate: `${shake.value * 3}deg` }] }));
  const cardH = (card * 140) / 100;
  return (
    <View style={styles.wrap} onLayout={onWrap}>
      <AppText style={styles.title} numberOfLines={2}>
        {title}
      </AppText>
      <View style={[styles.stage, { height: cardH + 20 }]} onLayout={onLayout}>
        {w > 0 ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
              <Burst x={w / 2} y={(cardH + 20) / 2} go={burst} color={ROLE_TINT[role]} size={w * 0.45} />
            </Canvas>
          </View>
        ) : null}
        <Animated.View style={shaking}>
          <FlipCard role={role} width={card} flip={flip} />
          {caught ? (
            <Animated.View entering={ZoomIn.delay(TURN_AT + 200).duration(260)} style={styles.stampAt} pointerEvents="none">
              <View style={styles.stamp}>
                <AppText style={[styles.stampText, { fontSize: (22 * card) / CARD, lineHeight: (28 * card) / CARD }]} numberOfLines={1}>
                  BLUFF
                </AppText>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(TURN_AT + 500).duration(400)}>
        <AppText style={[styles.verdict, { color: caught ? "#FF9AA6" : "#FFE08A" }]} numberOfLines={3}>
          {verdict}
        </AppText>
      </Animated.View>
      <View style={styles.lineup}>{lineup}</View>
    </View>
  );
});

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 8 },
  title: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 23, color: "#FFF2D8", textAlign: "center", paddingHorizontal: 20, ...shadow },
  stage: { alignItems: "center", justifyContent: "center", marginTop: 4 },
  stampAt: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  stamp: {
    borderWidth: 3,
    borderColor: "#E8182E",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(40,4,8,0.55)",
    transform: [{ rotate: "-16deg" }],
  },
  stampText: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: 2, color: "#FF4A5A" },
  verdict: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 19, textAlign: "center", paddingHorizontal: 24, ...shadow },
  lineup: { flex: 1, marginTop: 2 },
});

// The end of a game of Double Agent, on the stage. The verdict comes down
// from high above: the agency's crest in a blaze of green fire when the
// agents win; the moles' red wax seal in a churn of smoke when they do.
// Then the verdict and why, and every player's personnel card dealt
// face up — the Handler's lit, the one the Hitman named marked with a
// target — and then what follows a game (coins, badges), handed in by
// the game screen.

import { Canvas, Group, Image as SkImage, Rect, Shader } from "@shopify/react-native-skia";
import { useContext, useEffect, useMemo, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { shader } from "@/components/iso/shaders";
import { AppText } from "@/components/ui";
import { Burst } from "@/features/game/stage/light";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic } from "@/utils/haptics";
import { markArt } from "./dossier/art";
import { AURA, LIGHT, rgb } from "./dossier/fx";
import { sideOf, type AvalonState } from "./logic";
import { MiniRoleCard } from "./RoleCard";
import { StageInsets, useStageSize } from "./stage/AgencyStage";
import { crestArt } from "./stage/headerArt";

const STAGE_H = 230;
const CARD = 64;

export function Ending({
  state,
  mySeat,
  nameOf,
  afterGame,
  paused,
}: {
  state: AvalonState;
  mySeat: number;
  nameOf: (seat: number) => string;
  afterGame?: ReactNode;
  paused: boolean;
}) {
  const { t } = useTranslation();
  const insets = useContext(StageInsets);
  const { width } = useStageSize();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const good = state.winner !== "evil";
  const roles = state.roles;
  const handler = roles ? roles.indexOf("merlin") : -1;
  const myRole = roles?.[mySeat];
  const iWon = state.winner !== null && myRole ? sideOf(myRole) === state.winner : null;

  const cx = width / 2;
  const cy = STAGE_H / 2 + 4;
  const size = 160;
  const image = good
    ? bakedSvg("agency-crest-end", size, size, () => crestArt(size))
    : bakedSvg("dossier-mark|seal", size * 0.9, size * 0.9, () => markArt("seal"));
  const fx = shader(AURA);
  const light = good ? LIGHT.approve : LIGHT.seal;
  const colors = useMemo(() => light.aura.map(rgb), [light]);

  // the slam: from high above, down hard, a little bounce
  const fall = useSharedValue(0);
  const power = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    const drop = 420;
    fall.set(
      withSequence(
        withDelay(250, withTiming(1, { duration: drop, easing: Easing.in(Easing.quad) })),
        withTiming(1.06, { duration: 110 }),
        withTiming(1, { duration: 160 }),
      ),
    );
    burst.set(withDelay(250 + drop, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) })));
    power.set(withDelay(250 + drop, withTiming(state.winner ? 1 : 0.3, { duration: 900 })));
    const thud = setTimeout(() => {
      heavyHaptic();
      if (good) successHaptic();
      else errorHaptic();
    }, 250 + drop);
    return () => clearTimeout(thud);
  }, [good, fall, burst, power, state.winner]);

  const s = good ? size : size * 0.9;
  const transform = useDerivedValue(() => {
    const k = fall.value;
    const scale = k <= 1 ? 2.6 - 1.6 * k : k;
    return [{ translateX: cx }, { translateY: cy }, { scale }, { translateX: -s / 2 }, { translateY: -s / 2 }];
  });
  const opacity = useDerivedValue(() => Math.min(1, fall.value * 2.5));
  const uniforms = useDerivedValue(() => ({
    t: clock.value,
    c: [cx, cy],
    R: [s * 0.5, s * 0.5],
    power: power.value,
    mode: light.mode,
    c0: colors[0],
    c1: colors[1],
    c2: colors[2],
  }));

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 10 }}
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: STAGE_H }}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {fx ? (
            <Rect x={0} y={0} width={width} height={STAGE_H} blendMode="screen">
              <Shader source={fx} uniforms={uniforms} />
            </Rect>
          ) : null}
          <Burst x={cx} y={cy} go={burst} color={light.glow} size={width * 0.5} />
          <Group transform={transform}>
            {image ? <SkImage image={image} x={0} y={0} width={s} height={s} opacity={opacity} /> : null}
          </Group>
        </Canvas>
      </View>

      <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.verdict}>
        <AppText style={[styles.title, { color: good ? "#8CFFB0" : "#FF8A94" }]} numberOfLines={2}>
          {state.winner ? t(`avalon.result.${state.winner}`) : t("avalon.result.none")}
        </AppText>
        <AppText style={styles.reason}>
          {t(`avalon.reasons.${state.winReason ?? "abandoned"}`, {
            name: state.assassinTarget !== null ? nameOf(state.assassinTarget) : "",
          })}
        </AppText>
        {iWon !== null ? (
          <AppText style={[styles.mine, { color: iWon ? "#8CFFB0" : "#FFB0B8" }]}>
            {t(iWon ? "avalon.result.youWon" : "avalon.result.youLost")}
          </AppText>
        ) : null}
      </Animated.View>

      {roles ? (
        <View style={styles.cards}>
          {roles.map((role, seat) => (
            <Animated.View
              key={seat}
              entering={FadeInDown.delay(1300 + seat * 140).duration(450)}
              style={[styles.card, { transform: [{ rotate: `${(seat % 2 ? 1 : -1) * 2.5}deg` }] }]}
            >
              <View>
                {seat === handler ? <View style={styles.handlerGlow} /> : null}
                <MiniRoleCard role={role} width={CARD} />
                {seat === state.assassinTarget ? (
                  <View style={styles.target}>
                    <Emblem emoji="🎯" size={26} />
                  </View>
                ) : null}
              </View>
              <AppText style={styles.player} numberOfLines={1}>
                {nameOf(seat)}
              </AppText>
              <AppText
                style={[styles.role, { color: sideOf(role) === "evil" ? "#FF9AA6" : "#9CF0D8" }]}
                numberOfLines={1}
              >
                {t(`avalon.roles.${role}.name`)}
              </AppText>
            </Animated.View>
          ))}
        </View>
      ) : null}

      {afterGame ? (
        <Animated.View entering={FadeIn.delay(1300 + (roles?.length ?? 0) * 140).duration(500)} style={styles.after}>
          {afterGame}
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  verdict: { alignItems: "center", paddingHorizontal: 24, gap: 4 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    ...shadow,
  },
  reason: { fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 19, color: "#F1E6D2", textAlign: "center", ...shadow },
  mine: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20, marginTop: 2, ...shadow },
  cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 18, paddingHorizontal: 12 },
  card: { alignItems: "center", width: CARD + 10 },
  handlerGlow: {
    position: "absolute",
    left: -8,
    top: -8,
    right: -8,
    bottom: -8,
    borderRadius: 14,
    backgroundColor: "rgba(140,255,200,0.22)",
    shadowColor: "#6CFFB0",
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  target: { position: "absolute", right: -8, top: -8 },
  player: { fontFamily: fontFamily.semiBold, fontSize: 11.5, lineHeight: 15, color: "#F1E6D2", marginTop: 4, ...shadow },
  role: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 13, ...shadow },
  after: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
});

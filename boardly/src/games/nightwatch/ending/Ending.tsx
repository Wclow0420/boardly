// The end of the game, on the stage. The manor's seal slams down: whole,
// in a blaze of golden fire, when the watchers win; cracked, a ghost
// pressed in it, in a churn of red smoke, when the ghosts break free.
// The verdict and the reason under it, then every player's role card
// dealt face up — the Prophet's lit, the one the assassin named marked
// with a dagger — and then what follows a game (coins, badges, play
// again), handed in by the game screen.

import { Canvas, Group, Image as SkImage, Rect, Shader } from "@shopify/react-native-skia";
import { useEffect, useMemo, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
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
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic } from "@/utils/haptics";
import { GameText as AppText } from "../GameText";
import { AURA, LIGHT, rgb } from "../lantern/fx";
import { Burst } from "../lantern/Lantern";
import { sideOf, type NightwatchState } from "../logic";
import { MiniRoleCard } from "../RoleCardFace";
import { sealArt } from "./sealArt";
import { shader } from "@/components/iso/shaders";

const STAGE_H = 230;
const CARD = 64;

export function Ending({
  state,
  mySeat,
  nameOf,
  afterGame,
  paused,
}: {
  state: NightwatchState;
  mySeat: number;
  nameOf: (seat: number) => string;
  afterGame?: ReactNode;
  paused: boolean;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const good = state.winner !== "evil";
  const roles = state.roles;
  const prophet = roles ? roles.indexOf("prophet") : -1;
  const myRole = roles?.[mySeat];
  const iWon = state.winner !== null && myRole ? sideOf(myRole) === state.winner : null;

  const cx = width / 2;
  const cy = STAGE_H / 2 + 4;
  const size = 150;
  const image = bakedSvg(`manor-seal|${good ? "whole" : "broken"}`, size, size, () => sealArt(!good));
  const aura = shader(AURA);
  const light = good ? LIGHT.seal : LIGHT.bad;
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
    power.set(withDelay(250 + drop, withTiming(1, { duration: 900 })));
    const thud = setTimeout(() => {
      heavyHaptic();
      if (good) successHaptic();
      else errorHaptic();
    }, 250 + drop);
    return () => clearTimeout(thud);
  }, [good, fall, burst, power]);

  const transform = useDerivedValue(() => {
    const k = fall.value;
    const scale = k <= 1 ? 2.6 - 1.6 * k : k;
    return [{ translateX: cx }, { translateY: cy }, { scale }, { translateX: -size / 2 }, { translateY: -size / 2 }];
  });
  const opacity = useDerivedValue(() => Math.min(1, fall.value * 2.5));
  const uniforms = useDerivedValue(() => ({
    t: clock.value,
    c: [cx, cy],
    R: [size * 0.62, size * 0.62],
    power: power.value,
    mode: light.mode,
    c0: colors[0],
    c1: colors[1],
    c2: colors[2],
  }));

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={{ height: STAGE_H }}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {aura ? (
            <Rect x={0} y={0} width={width} height={STAGE_H} blendMode="screen">
              <Shader source={aura} uniforms={uniforms} />
            </Rect>
          ) : null}
          <Burst x={cx} y={cy} go={burst} color={light.glow} size={width * 0.5} />
          <Group transform={transform}>
            {image ? <SkImage image={image} x={0} y={0} width={size} height={size} opacity={opacity} /> : null}
          </Group>
        </Canvas>
      </View>

      <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.verdict}>
        <AppText style={[styles.title, { color: good ? "#FFD58A" : "#FF8A94" }]} numberOfLines={2}>
          {state.winner ? t(`nightwatch.result.${state.winner}`) : t("nightwatch.result.none")}
        </AppText>
        {state.winReason ? (
          <AppText style={styles.reason}>
            {t(`nightwatch.reasons.${state.winReason}`, {
              name: state.assassinTarget !== null ? nameOf(state.assassinTarget) : "",
              prophet: prophet >= 0 ? nameOf(prophet) : "",
            })}
          </AppText>
        ) : null}
        {iWon !== null ? (
          <AppText style={[styles.mine, { color: iWon ? "#8CFFB0" : "#FFB0B8" }]}>
            {t(iWon ? "nightwatch.result.youWon" : "nightwatch.result.youLost")}
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
                {seat === prophet ? <View style={styles.prophetGlow} /> : null}
                <MiniRoleCard role={role} width={CARD} />
                {seat === state.assassinTarget ? (
                  <View style={styles.dagger}>
                    <Emblem emoji="🗡️" size={26} />
                  </View>
                ) : null}
              </View>
              <AppText style={styles.player} numberOfLines={1}>
                {nameOf(seat)}
              </AppText>
              <AppText style={styles.role} numberOfLines={1}>
                {t(`nightwatch.roles.${role}.name`)}
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
  scroll: { paddingBottom: 30 },
  verdict: { alignItems: "center", paddingHorizontal: 24, gap: 4 },
  title: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 32, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", ...shadow },
  reason: { fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 19, color: "#F1E6D2", textAlign: "center", ...shadow },
  mine: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20, marginTop: 2, ...shadow },
  cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 18, paddingHorizontal: 12 },
  card: { alignItems: "center", width: CARD + 10 },
  prophetGlow: {
    position: "absolute",
    left: -8,
    top: -8,
    right: -8,
    bottom: -8,
    borderRadius: 14,
    backgroundColor: "rgba(255,200,112,0.28)",
    shadowColor: "#FFC870",
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  dagger: { position: "absolute", right: -8, top: -8 },
  player: { fontFamily: fontFamily.semiBold, fontSize: 11.5, lineHeight: 15, color: "#F1E6D2", marginTop: 4, ...shadow },
  role: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 13, color: "#C8C2B0", ...shadow },
  after: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
});

// "New badge!" — when a game ends, every badge it earned stamps down in
// the middle of the screen, one at a time: it falls from above, lands
// with a thud and a ring of light in its tier's colour, rays turning
// behind it. Then the next badge to work towards, and how far is left.
// Each is remembered as shown, so the player card won't stamp it again.

import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import type { BadgeRecord } from "@/api/client";
import { Badge, TIER_METAL } from "@/components/badges/Badge";
import { useIsoClock } from "@/components/iso";
import { AppText, Button } from "@/components/ui";
import { useGameName } from "@/games/names";
import { fontFamily } from "@/theme";
import { heavyHaptic, successHaptic } from "@/utils/haptics";
import { badgeArt } from "./art";
import { NextBadge } from "./NextBadge";
import { badgeText } from "./strings";

/** Twelve soft rays fanning out from the middle. */
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const w = 0.09;
  const p = (r: number, d: number) =>
    `${50 + Math.cos(a + d) * r} ${50 + Math.sin(a + d) * r}`;
  return `M50 50L${p(50, -w)}L${p(50, w)}z`;
}).join("");

export function BadgeCelebration({
  badges,
  next,
  onShown,
  onProfile,
}: {
  /** The badges to celebrate, in order; empty shows nothing. */
  badges: BadgeRecord[];
  /** The next badge to work towards, shown under the last one. */
  next: BadgeRecord | null;
  /** Called with each badge's key once it has been shown. */
  onShown: (key: string) => void;
  onProfile: () => void;
}) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const { width } = useWindowDimensions();
  const still = useReducedMotion();
  const [index, setIndex] = useState(0);
  const badge = badges[index] ?? null;
  const clock = useIsoClock(badge === null);
  const drop = useSharedValue(0);
  const flash = useSharedValue(0);
  const spin = useSharedValue(0);

  const key = badge?.key;
  useEffect(() => {
    if (!key) return;
    onShown(key);
    if (still) {
      drop.set(1);
      successHaptic();
      return;
    }
    drop.set(0);
    flash.set(0);
    // held high, then slammed down onto the table
    drop.set(
      withDelay(
        250,
        withSequence(
          withTiming(1.05, { duration: 330, easing: Easing.in(Easing.cubic) }),
          withSpring(1, { damping: 6, stiffness: 300 }),
        ),
      ),
    );
    flash.set(
      withDelay(
        560,
        withSequence(
          withTiming(1, { duration: 1 }),
          withTiming(0, { duration: 900 }),
        ),
      ),
    );
    spin.set(
      withRepeat(
        withTiming(360, { duration: 24000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    const thud = setTimeout(heavyHaptic, 580);
    const cheer = setTimeout(successHaptic, 900);
    return () => {
      clearTimeout(thud);
      clearTimeout(cheer);
    };
  }, [key, still, onShown, drop, flash, spin]);

  const stamp = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 2.5),
    transform: [
      { scale: 1 + (1 - Math.min(drop.value, 1)) * 1.8 },
      { rotate: `${(1 - Math.min(drop.value, 1)) * -24}deg` },
    ],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 1.9 - flash.value * 0.9 }],
  }));
  const rays = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value) * 0.55,
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  const rise = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, (drop.value - 0.6) * 2.5)),
  }));

  if (!badge) return null;
  const last = index === badges.length - 1;
  const { art, face } = badgeArt(badge.key, badge.gameType);
  const text = badgeText(t, badge.key);
  const metal = TIER_METAL[badge.tier];
  const size = Math.min(240, width * 0.6);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setIndex(badges.length)}
    >
      {/* anywhere on the screen moves on to the next badge */}
      <Pressable
        style={styles.backdrop}
        disabled={last}
        accessibilityRole={last ? undefined : "button"}
        onPress={() => setIndex(index + 1)}
      >
        <AppText style={[styles.kicker, { color: metal.glow }]}>
          {t("badges.celebrate.newBadge")}
        </AppText>

        <View
          style={{
            width: size * 1.6,
            height: size * 1.25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.center, rays]}
            pointerEvents="none"
          >
            <Svg width={size * 1.6} height={size * 1.6} viewBox="0 0 100 100">
              <Path d={RAYS} fill={metal.glow} opacity={0.35} />
            </Svg>
          </Animated.View>
          <Animated.View style={stamp}>
            <Badge
              art={art}
              face={face}
              tier={badge.tier}
              size={size}
              clock={clock}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ring,
                { borderColor: metal.glow, borderRadius: size },
                ring,
              ]}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.words, rise]}>
          <AppText style={styles.name}>{text.name}</AppText>
          <AppText style={[styles.tier, { color: metal.glow }]}>
            {`${t(`badges.tiers.${badge.tier}`)}${badge.gameType ? `  ·  ${gameName(badge.gameType)}` : ""}`}
          </AppText>
          <AppText style={styles.desc}>{text.desc}</AppText>

          {last ? (
            <>
              {next ? (
                <View style={styles.next}>
                  <NextBadge badge={next} clock={clock} />
                </View>
              ) : null}
              <View style={styles.actions}>
                <Button
                  label={t("badges.celebrate.viewProfile")}
                  variant="secondary"
                  size="md"
                  style={styles.grow}
                  onPress={() => {
                    setIndex(badges.length);
                    onProfile();
                  }}
                />
                <Button
                  label={t("badges.celebrate.nice")}
                  size="md"
                  style={styles.grow}
                  onPress={() => setIndex(badges.length)}
                />
              </View>
            </>
          ) : (
            <View style={styles.more}>
              <AppText style={styles.moreText}>
                {`${t("badges.celebrate.tapNext")}  ·  ${index + 1}/${badges.length}`}
              </AppText>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,5,2,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  center: { alignItems: "center", justifyContent: "center" },
  kicker: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: 1,
    marginBottom: 4,
  },
  ring: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: "14%",
    bottom: "24%",
    borderWidth: 4,
  },
  words: { alignItems: "center", alignSelf: "stretch", gap: 4 },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: "#FFF6E6",
    textAlign: "center",
  },
  tier: { fontFamily: fontFamily.semiBold, fontSize: 13, letterSpacing: 0.5 },
  desc: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: "rgba(255,246,230,0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  next: {
    alignSelf: "stretch",
    marginTop: 22,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,246,230,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,246,230,0.12)",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 18,
  },
  grow: { flex: 1 },
  more: { marginTop: 22, paddingVertical: 10, paddingHorizontal: 16 },
  moreText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: "rgba(255,246,230,0.75)",
  },
});

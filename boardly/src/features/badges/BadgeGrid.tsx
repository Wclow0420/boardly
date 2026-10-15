// The player card's badges: earned ones first, rarest first; then the
// ones still to earn, closest first. A badge earned since this device
// last looked stamps down onto the card — once. Tapping one shows it
// large, with what it is for and when it was earned.

import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import type { BadgeRecord } from "@/api/client";
import { Badge, TIER_METAL } from "@/components/badges/Badge";
import { AppText, EmblemText } from "@/components/ui";
import { Popup } from "@/features/game/Popup";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { badgeArt } from "./art";
import { NextBadge } from "./NextBadge";
import { nextLevel, sortBadges } from "./order";
import { badgeText } from "./strings";

const COLUMNS = 4;

export function BadgeGrid({
  badges,
  clock,
  still,
  fresh,
  onStamped,
}: {
  badges: BadgeRecord[];
  clock: SharedValue<number>;
  /** A clock that never moves, for badges that don't need one. */
  still: SharedValue<number>;
  /** Earned badges this device hasn't shown yet. */
  fresh: Set<string>;
  onStamped: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState<BadgeRecord | null>(null);
  const sorted = useMemo(() => sortBadges(badges), [badges]);
  // four to a row, across whatever room the grid is given
  const [gridWidth, setGridWidth] = useState(0);
  const cell = Math.floor(gridWidth / COLUMNS);

  // the new ones stamp down one after another, then count as seen
  const stamping = useMemo(
    () => sorted.filter((b) => fresh.has(b.key)).map((b) => b.key),
    [sorted, fresh],
  );
  useEffect(() => {
    if (stamping.length === 0) return;
    const done = setTimeout(
      () => onStamped(stamping),
      600 + stamping.length * STAMP_GAP + 400,
    );
    return () => clearTimeout(done);
  }, [stamping, onStamped]);

  return (
    <View
      style={styles.grid}
      onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
    >
      {cell > 0 &&
        sorted.map((badge, index) => (
          <BadgeCell
            key={badge.key}
            badge={badge}
            size={cell}
            clock={badge.unlockedAt ? clock : still}
            phase={index * 0.83}
            stampOrder={stamping.indexOf(badge.key)}
            onPress={() => {
              tapHaptic();
              setOpen(badge);
            }}
          />
        ))}
      <BadgeDetail
        badge={open}
        badges={badges}
        clock={clock}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

/** Between one new badge stamping down and the next. */
const STAMP_GAP = 650;

function BadgeCell({
  badge,
  size,
  clock,
  phase,
  stampOrder,
  onPress,
}: {
  badge: BadgeRecord;
  size: number;
  clock: SharedValue<number>;
  phase: number;
  /** Its turn to stamp down, or -1 when it isn't new. */
  stampOrder: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { art, face } = badgeArt(badge.key, badge.gameType);
  const locked = !badge.unlockedAt;
  const fresh = stampOrder >= 0;
  const drop = useSharedValue(fresh ? 0 : 1);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (!fresh) return;
    const delay = 600 + stampOrder * STAMP_GAP;
    // held above the card, then pressed down hard, with a ring of light
    drop.set(
      withDelay(
        delay,
        withSequence(
          withTiming(1.06, { duration: 260, easing: Easing.in(Easing.cubic) }),
          withSpring(1, { damping: 7, stiffness: 320 }),
        ),
      ),
    );
    flash.set(
      withDelay(
        delay + 240,
        withSequence(
          withTiming(1, { duration: 1 }),
          withTiming(0, { duration: 650 }),
        ),
      ),
    );
    const thud = setTimeout(heavyHaptic, delay + 250);
    return () => clearTimeout(thud);
  }, [fresh, stampOrder, drop, flash]);

  const stamp = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 3),
    transform: [
      { scale: 1 + (1 - Math.min(drop.value, 1)) * 1.4 },
      { rotate: `${(1 - Math.min(drop.value, 1)) * -18}deg` },
    ],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 1.6 - flash.value * 0.8 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badgeText(t, badge.key).name}
      onPress={onPress}
      style={({ pressed }) => [
        { width: size },
        styles.cell,
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={stamp}>
        <Badge
          art={art}
          face={face}
          tier={badge.tier}
          size={size}
          clock={clock}
          phase={phase}
          locked={locked}
          progress={badge.progress / badge.goal}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            { borderColor: TIER_METAL[badge.tier].glow, borderRadius: size },
            ring,
          ]}
        />
      </Animated.View>
      <AppText
        variant="tiny"
        align="center"
        numberOfLines={2}
        style={[styles.name, locked && styles.dim]}
      >
        {badgeText(t, badge.key).name}
      </AppText>
      {locked && badge.goal > 1 ? (
        <AppText variant="tiny" align="center" style={styles.progress}>
          {t("profile.card.progress", { n: badge.progress, goal: badge.goal })}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function BadgeDetail({
  badge,
  badges,
  clock,
  onClose,
}: {
  badge: BadgeRecord | null;
  /** All of them, to find the next level up. */
  badges: BadgeRecord[];
  clock: SharedValue<number>;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const gameName = useGameName();
  if (!badge) return null;
  const { art, face } = badgeArt(badge.key, badge.gameType);
  const text = badgeText(t, badge.key);
  const metal = TIER_METAL[badge.tier];
  const earned = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  // the first level above this one still to earn (skipping any already won)
  let up = earned ? nextLevel(badges, badge) : null;
  while (up?.unlockedAt) up = nextLevel(badges, up);
  const top = earned && badge.series !== null && up === null;
  return (
    <Popup visible title={text.name} onClose={onClose}>
      <View style={styles.detail}>
        <Badge
          art={art}
          face={face}
          tier={badge.tier}
          size={190}
          clock={clock}
          locked={!earned}
          progress={badge.progress / badge.goal}
        />
        <AppText style={[styles.tier, { color: metal.glow }]}>
          {`${t(`badges.tiers.${badge.tier}`)}${badge.gameType ? `  ·  ${gameName(badge.gameType)}` : ""}`}
        </AppText>
        <AppText variant="body" align="center">
          {text.desc}
        </AppText>
        {earned ? (
          <>
            <AppText variant="caption" color="textMuted" align="center">
              {t("profile.card.earned", { date: earned })}
            </AppText>
            {up ? (
              <View style={styles.up}>
                <NextBadge
                  badge={up}
                  clock={clock}
                  label={t("badges.celebrate.nextLevel")}
                />
              </View>
            ) : top ? (
              <EmblemText style={[styles.tier, { color: metal.glow }]}>
                {`★  ${t("badges.celebrate.topLevel")}`}
              </EmblemText>
            ) : null}
          </>
        ) : (
          <View style={styles.barWrap}>
            <View style={styles.bar}>
              <View
                style={[
                  styles.fill,
                  { width: `${(badge.progress / badge.goal) * 100}%` },
                ]}
              />
            </View>
            <AppText variant="caption" color="textMuted">
              {`${t("profile.card.progress", { n: badge.progress, goal: badge.goal })}  ·  `}
              <AppText variant="caption" style={styles.toGo}>
                {t("badges.celebrate.toGo", { n: badge.goal - badge.progress })}
              </AppText>
            </AppText>
          </View>
        )}
      </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 6,
  },
  cell: { alignItems: "center", paddingBottom: 4 },
  pressed: { opacity: 0.8 },
  name: {
    color: TABLE.cream,
    marginTop: -4,
    paddingHorizontal: 2,
    fontFamily: fontFamily.medium,
  },
  dim: { color: TABLE.creamMuted, opacity: 0.75 },
  progress: { color: "#F2B630" },
  ring: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: "14%",
    bottom: "24%",
    borderWidth: 3,
  },
  detail: { alignItems: "center", gap: 8, paddingBottom: 4 },
  tier: { fontFamily: fontFamily.semiBold, fontSize: 13, letterSpacing: 0.5 },
  up: {
    alignSelf: "stretch",
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  toGo: { color: "#F2B630", fontFamily: fontFamily.semiBold },
  barWrap: { alignSelf: "stretch", alignItems: "center", gap: 6, marginTop: 4 },
  bar: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: "#F2B630" },
});

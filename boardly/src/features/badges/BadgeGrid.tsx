// The player card's badges: earned ones first, highest level first; then
// the ones still to earn, closest first. Each shows the level it has
// reached in its frame (struck in iron before bronze) and how far it is
// to the next. A level reached since this device last looked stamps
// down onto the card, once. Tapping a badge shows its four levels.

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Badge, TIER_GLOW } from "@/components/badges/Badge";
import { TIERS } from "@/components/badges/types";
import { AppText } from "@/components/ui";
import { Popup } from "@/features/game/Popup";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { badgeArt } from "./art";
import { goalOf, levelId, nextTier, sortBadges, toNext } from "./order";
import { badgeText } from "./strings";

const COLUMNS = 4;

export function BadgeGrid({
  badges,
  clock,
  still,
  fresh,
  onStamped,
  action,
}: {
  badges: BadgeRecord[];
  clock: SharedValue<number>;
  /** A clock that never moves, for badges that don't need one. */
  still: SharedValue<number>;
  /** Levels reached that this device hasn't shown yet (levelId). */
  fresh: Set<string>;
  onStamped: (ids: string[]) => void;
  /** Something to do with an open badge (show it on my card). */
  action?: (badge: BadgeRecord, close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState<BadgeRecord | null>(null);
  const sorted = useMemo(() => sortBadges(badges), [badges]);
  // four to a row, across whatever room the grid is given
  const [gridWidth, setGridWidth] = useState(0);
  const cell = Math.floor(gridWidth / COLUMNS);

  // the new levels stamp down one after another, then count as seen
  const stamping = useMemo(
    () =>
      sorted
        .filter((b) => b.tier && fresh.has(levelId(b.key, b.tier)))
        .map((b) => levelId(b.key, b.tier!)),
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
    <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
      {cell > 0 &&
        sorted.map((badge) => (
          <BadgeCell
            key={badge.key}
            badge={badge}
            size={cell}
            still={still}
            stampOrder={badge.tier ? stamping.indexOf(levelId(badge.key, badge.tier)) : -1}
            onPress={() => {
              tapHaptic();
              setOpen(badge);
            }}
          />
        ))}
      <BadgeDetail
        badge={open}
        clock={clock}
        still={still}
        onClose={() => setOpen(null)}
        action={open && action ? action(open, () => setOpen(null)) : null}
      />
    </View>
  );
}

/** Between one new level stamping down and the next. */
const STAMP_GAP = 650;

function BadgeCell({
  badge,
  size,
  still,
  stampOrder,
  onPress,
}: {
  badge: BadgeRecord;
  size: number;
  still: SharedValue<number>;
  /** Its turn to stamp down, or -1 when it isn't new. */
  stampOrder: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { art, face, frames } = badgeArt(badge.key, badge.gameType);
  const next = nextTier(badge);
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
        withSequence(withTiming(1, { duration: 1 }), withTiming(0, { duration: 650 })),
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
      style={({ pressed }) => [{ width: size }, styles.cell, pressed && styles.pressed]}
    >
      <Animated.View style={stamp}>
        <Badge
          art={art}
          face={face}
          frames={frames}
          tier={badge.tier ?? "bronze"}
          size={size}
          clock={still}
          locked={!badge.tier}
          alive={false}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            { borderColor: TIER_GLOW[badge.tier ?? "bronze"], borderRadius: size },
            ring,
          ]}
        />
      </Animated.View>
      <AppText
        variant="tiny"
        align="center"
        numberOfLines={2}
        style={[styles.name, !badge.tier && styles.dim]}
      >
        {badgeText(t, badge.key).name}
      </AppText>
      {next ? (
        <AppText variant="tiny" align="center" style={styles.progress}>
          {t("profile.card.progress", { n: badge.progress ?? 0, goal: goalOf(badge, next) })}
        </AppText>
      ) : (
        <AppText variant="tiny" align="center" style={[styles.progress, { color: TIER_GLOW.diamond }]}>
          {t("badges.tiers.diamond")}
        </AppText>
      )}
    </Pressable>
  );
}

/** A badge large, its four levels, and how far it is to the next. */
export function BadgeDetail({
  badge,
  clock,
  still,
  onClose,
  action,
}: {
  badge: BadgeRecord | null;
  clock: SharedValue<number>;
  still: SharedValue<number>;
  onClose: () => void;
  /** Under it all: something to do with it. */
  action?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const gameName = useGameName();
  if (!badge) return null;
  const { art, face, frames } = badgeArt(badge.key, badge.gameType);
  const next = nextTier(badge);
  const goal = goalOf(badge, next ?? "diamond");
  const text = badgeText(t, badge.key, goal);
  const progress = badge.progress;
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: "numeric", month: "short" });
  const glow = TIER_GLOW[badge.tier ?? "bronze"];
  return (
    <Popup visible title={text.name} onClose={onClose}>
      <View style={styles.detail}>
        <Badge
          art={art}
          face={face}
          frames={frames}
          tier={badge.tier ?? "bronze"}
          size={170}
          clock={clock}
          locked={!badge.tier}
        />
        <AppText style={[styles.tier, { color: badge.tier ? glow : TABLE.creamMuted }]}>
          {`${badge.tier ? t(`badges.tiers.${badge.tier}`) : t("profile.card.locked")}${badge.gameType ? `  ·  ${gameName(badge.gameType)}` : ""}`}
        </AppText>
        <AppText variant="body" align="center">
          {text.desc}
        </AppText>

        {/* the ladder: every level, its goal, and when it was reached */}
        <View style={styles.ladder}>
          {TIERS.map((tier) => {
            const at = badge.unlocked[tier];
            return (
              <View key={tier} style={styles.rung}>
                <Badge
                  art={art}
                  face={face}
                  frames={frames}
                  tier={tier}
                  size={62}
                  clock={still}
                  locked={!at}
                  alive={false}
                />
                <AppText style={[styles.rungGoal, { color: at ? TIER_GLOW[tier] : TABLE.creamMuted }]}>
                  {goalOf(badge, tier).toLocaleString()}
                </AppText>
                <AppText variant="tiny" style={styles.rungWhen}>
                  {at ? date(at) : t(`badges.tiers.${tier}`)}
                </AppText>
              </View>
            );
          })}
        </View>

        {progress === undefined ? null : next ? (
          <View style={styles.barWrap}>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${Math.max(3, toNext(badge) * 100)}%` }]} />
            </View>
            <AppText variant="caption" color="textMuted">
              {`${t("profile.card.progress", { n: progress, goal })}  ·  `}
              <AppText variant="caption" style={styles.toGo}>
                {t("badges.celebrate.toLevel", {
                  n: goal - progress,
                  level: t(`badges.tiers.${next}`),
                })}
              </AppText>
            </AppText>
          </View>
        ) : (
          <AppText style={[styles.tier, { color: TIER_GLOW.diamond }]}>
            {`★  ${t("badges.celebrate.topLevel")}`}
          </AppText>
        )}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", rowGap: 6 },
  cell: { alignItems: "center", paddingBottom: 4 },
  pressed: { opacity: 0.8 },
  name: { color: TABLE.cream, marginTop: -2, paddingHorizontal: 2, fontFamily: fontFamily.medium },
  dim: { color: TABLE.creamMuted, opacity: 0.75 },
  progress: { color: "#F2B630" },
  ring: {
    position: "absolute",
    left: "16%",
    right: "16%",
    top: "16%",
    bottom: "16%",
    borderWidth: 3,
  },
  detail: { alignItems: "center", gap: 8, paddingBottom: 4 },
  tier: { fontFamily: fontFamily.semiBold, fontSize: 13, letterSpacing: 0.5 },
  ladder: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  rung: { alignItems: "center", flex: 1 },
  rungGoal: { fontFamily: fontFamily.bold, fontSize: 14, marginTop: -2 },
  rungWhen: { color: TABLE.creamMuted },
  toGo: { color: "#F2B630", fontFamily: fontFamily.semiBold },
  action: { alignSelf: "stretch", marginTop: 8 },
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

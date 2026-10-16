// The badge hall: a velvet room with a gilded frame. At the top, the
// showcase, the (up to four) badges my card shows on lit pedestals;
// under it, how many badges stand at each level; then every badge,
// Boardly's own first and then each game's, on gold-framed boards. Tap a
// badge for its four levels and to show it on my card (or take it off).
// It opens and closes through the meeple, like the wardrobe.
//
// Only the four in the showcase move, and only while this is the screen
// showing; the rest are still pictures.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

import { api, type BadgeRecord } from "@/api/client";
import { Badge, TIER_GLOW } from "@/components/badges/Badge";
import { BOARDLY_FRAMES } from "@/components/badges/frames/boardly";
import { TIERS } from "@/components/badges/types";
import { BackIcon } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, Button, Frame, IconButton, SectionTitle, TitlePlaque } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { BadgeDetail, BadgeGrid } from "@/features/badges/BadgeGrid";
import { BOARDLY_FACE } from "@/features/badges/art";
import { hallBackdrop } from "@/features/badges/hall/art";
import { SHOWCASE_SIZE, Showcase } from "@/features/badges/hall/Showcase";
import { levelId } from "@/features/badges/order";
import { useSeenBadges } from "@/features/badges/useSeenBadges";
import { lidColors } from "@/features/games/GameBox";
import { useMeepleTransition } from "@/features/mascot/MeepleTransition";
import { useGameName } from "@/games/names";
import { useOnScreen } from "@/hooks/useOnScreen";
import { TABLE, fontFamily } from "@/theme";
import { errorHaptic, successHaptic } from "@/utils/haptics";

export default function BadgesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gameName = useGameName();
  const { width, height } = useWindowDimensions();
  const { user, setShowcase } = useSession();
  const onScreen = useOnScreen();
  const [open, setOpen] = useState<BadgeRecord | null>(null);
  const [busy, setBusy] = useState(false);
  // the showcase moves; the rest stand still
  const clock = useIsoClock(!onScreen);
  const still = useIsoClock(true);

  // out through the meeple, like the way in (and Android's back button)
  const go = useMeepleTransition();
  const close = useCallback(() => go(() => router.back()), [go, router]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  const stats = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => (await api.auth.stats()).stats,
    enabled: user !== null,
  });
  const card = stats.data;
  const badges = useMemo(() => card?.badges ?? [], [card]);
  const byKey = useMemo(() => new Map(badges.map((b) => [b.key, b])), [badges]);
  const shown = (card?.showcase ?? []).map((k) => byKey.get(k)).filter(Boolean) as BadgeRecord[];
  const earned = badges.filter((b) => b.tier);

  // Boardly's own first, then each game's
  const groups = useMemo(() => {
    const out = new Map<string | null, BadgeRecord[]>();
    for (const b of badges) out.set(b.gameType, [...(out.get(b.gameType) ?? []), b]);
    return [...out.entries()].sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : 0));
  }, [badges]);

  // levels reached since this device last looked stamp down, once
  const { seen, markSeen } = useSeenBadges(user?.id);
  const fresh = useMemo(() => {
    if (!seen || !onScreen) return new Set<string>();
    return new Set(
      earned
        .filter((b) => !seen.has(levelId(b.key, b.tier!)))
        .map((b) => levelId(b.key, b.tier!)),
    );
  }, [earned, seen, onScreen]);
  const onStamped = useCallback((ids: string[]) => markSeen(ids), [markSeen]);

  /** Show a badge on my card (first, pushing the last off when full), or
   *  take it off. My picks start from what the card shows now. */
  const toggle = async (badge: BadgeRecord, after: () => void) => {
    const current = card?.showcase ?? [];
    const next = current.includes(badge.key)
      ? current.filter((k) => k !== badge.key)
      : [badge.key, ...current].slice(0, SHOWCASE_SIZE);
    setBusy(true);
    try {
      await setShowcase(next);
      await queryClient.invalidateQueries({ queryKey: ["stats", user?.id] });
      successHaptic();
      after();
    } catch {
      errorHaptic();
    } finally {
      setBusy(false);
    }
  };
  const action = (badge: BadgeRecord, after: () => void) =>
    badge.tier ? (
      <Button
        size="md"
        variant={card?.showcase.includes(badge.key) ? "secondary" : "primary"}
        loading={busy}
        label={
          card?.showcase.includes(badge.key)
            ? t("badges.hall.takeOff")
            : t("badges.hall.showOff")
        }
        onPress={() => toggle(badge, after)}
      />
    ) : null;

  const inner = width - 32;
  const backdrop = useMemo(() => hallBackdrop(width, height), [width, height]);

  return (
    <View style={styles.screen}>
      <SvgXml xml={backdrop} width={width} height={height} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={["top"]} style={styles.grow}>
        <View style={styles.header}>
          <IconButton accessibilityLabel={t("common.back")} onPress={close}>
            <BackIcon size={20} />
          </IconButton>
          <TitlePlaque label={t("badges.hall.title")} />
          <View style={styles.grow} />
          <AppText style={styles.count}>
            {t("profile.card.unlocked", { n: earned.length, total: badges.length })}
          </AppText>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* how many stand at each level */}
          <View style={styles.tally}>
            {TIERS.map((tier) => (
              <View key={tier} style={styles.tallyItem}>
                <Badge
                  art={{ glyph: {}, emoji: "★", loop: "pulse" }}
                  face={BOARDLY_FACE}
                  frames={BOARDLY_FRAMES}
                  tier={tier}
                  size={46}
                  clock={still}
                  alive={false}
                />
                <AppText style={[styles.tallyN, { color: TIER_GLOW[tier] }]}>
                  {badges.filter((b) => b.tier === tier).length}
                </AppText>
                <AppText variant="tiny" style={styles.tallyName}>
                  {t(`badges.tiers.${tier}`)}
                </AppText>
              </View>
            ))}
          </View>

          <SectionTitle label={t("badges.hall.showcase")} colors={TABLE.ribbonRed} />
          <Showcase width={inner} badges={shown} clock={clock} onOpen={setOpen} />
          <AppText variant="tiny" align="center" style={styles.hint}>
            {t("badges.hall.hint")}
          </AppText>

          {groups.map(([game, list]) => (
            <View key={game ?? "boardly"} style={styles.group}>
              <SectionTitle
                label={game ? gameName(game) : "Boardly"}
                colors={game ? [lidColors(game)[0], lidColors(game)[1]] : TABLE.ribbonGold}
                right={
                  <AppText style={styles.groupCount}>
                    {`${list.filter((b) => b.tier).length}/${list.length}`}
                  </AppText>
                }
              />
              <Frame tone="dark" style={styles.board}>
                <BadgeGrid
                  badges={list}
                  clock={clock}
                  still={still}
                  fresh={fresh}
                  onStamped={onStamped}
                  action={action}
                />
              </Frame>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
      <BadgeDetail
        badge={open}
        clock={clock}
        still={still}
        onClose={() => setOpen(null)}
        action={open ? action(open, () => setOpen(null)) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#2A0C1B" },
  grow: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingTop: 6 },
  count: { color: TABLE.cream, fontFamily: fontFamily.semiBold, fontSize: 12 },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 10 },
  tally: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  tallyItem: { alignItems: "center" },
  tallyN: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 22, marginTop: -4 },
  tallyName: { color: TABLE.creamMuted },
  hint: { color: TABLE.creamMuted, marginTop: -2 },
  group: { marginTop: 10 },
  groupCount: { color: TABLE.cream, fontFamily: fontFamily.semiBold, fontSize: 12 },
  board: { paddingTop: 14, paddingHorizontal: 8 },
});

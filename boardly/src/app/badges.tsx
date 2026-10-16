// The badge hall: a wooden room in a gilded frame. An iron header with
// the hall's sign, a strip saying how many badges stand at each level,
// then the showcase (the four badges friends see on my card, on lit
// pedestals) and the collection: every badge on a framed card, Boardly's
// own first and then each game's. Tap a badge for its four levels and to
// show it on my card (or take it off). It opens and closes through the
// meeple, like the wardrobe. The frame is drawn over the page and the
// scrolling is clipped inside it.
//
// Only the four in the showcase move, and only while this is the screen
// showing; the rest are still pictures.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";

import { api, type BadgeRecord } from "@/api/client";
import { Badge, TIER_GLOW } from "@/components/badges/Badge";
import { BOARDLY_FRAMES } from "@/components/badges/frames/boardly";
import { TIERS } from "@/components/badges/types";
import { BackIcon } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, BezelOverlay, Button, IconButton, SectionTitle } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { BadgeDetail } from "@/features/badges/BadgeGrid";
import { BOARDLY_FACE } from "@/features/badges/art";
import { hallWall } from "@/features/badges/hall/art";
import { GameBoard } from "@/features/badges/hall/GameBoard";
import { HallCrest } from "@/features/badges/hall/HallCrest";
import { SHOWCASE_SIZE, Showcase } from "@/features/badges/hall/Showcase";
import { levelId } from "@/features/badges/order";
import { useSeenBadges } from "@/features/badges/useSeenBadges";
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

  const insets = useSafeAreaInsets();
  const wall = useMemo(() => hallWall(width, height), [width, height]);
  const crestH = insets.top + 140;
  const inner = width - 28;

  return (
    <View style={styles.screen}>
      <SvgXml xml={wall} width={width} height={height} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: crestH - 4 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle label={t("badges.hall.showcase")} colors={TABLE.ribbonRed} />
        <AppText variant="tiny" style={styles.hint}>
          {t("badges.hall.hint")}
        </AppText>
        <Showcase width={inner} badges={shown} clock={clock} onOpen={setOpen} />

        <SectionTitle
          label={t("badges.hall.collection")}
          colors={TABLE.ribbonGold}
          style={styles.section}
          right={
            // how many stand at each level, and how many earned
            <View style={styles.tally}>
              {TIERS.map((tier) => (
                <View key={tier} style={styles.tallyItem}>
                  <Badge
                    art={{ glyph: {}, emoji: "★", loop: "pulse" }}
                    face={BOARDLY_FACE}
                    frames={BOARDLY_FRAMES}
                    tier={tier}
                    size={24}
                    clock={still}
                    alive={false}
                  />
                  <AppText style={[styles.tallyN, { color: TIER_GLOW[tier] }]}>
                    {badges.filter((b) => b.tier === tier).length}
                  </AppText>
                </View>
              ))}
              <AppText style={styles.tallyTotal}>{`${earned.length}/${badges.length}`}</AppText>
            </View>
          }
        />
        <AppText variant="tiny" style={styles.hint}>
          {t("badges.hall.collectionHint")}
        </AppText>
        {groups.map(([game, list]) => (
          <GameBoard
            key={game ?? "boardly"}
            name={game ? gameName(game) : "Boardly"}
            badges={list}
            clock={clock}
            still={still}
            fresh={fresh}
            onStamped={onStamped}
            action={action}
          />
        ))}
      </ScrollView>

      {/* the crest over the top; the page scrolls under it */}
      <View style={styles.crest} pointerEvents="box-none">
        <HallCrest width={width} top={insets.top} clock={clock} title={t("badges.hall.title")} />
        <IconButton
          accessibilityLabel={t("common.back")}
          onPress={close}
          size={40}
          style={[styles.back, { top: insets.top + 6 }]}
        >
          <LinearGradient colors={["#5A606A", "#24282E"]} style={styles.backFace} />
          <BezelOverlay r={20} t={3.2} />
          <BackIcon size={18} />
        </IconButton>
      </View>

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
  screen: { flex: 1, backgroundColor: "#140A04" },
  grow: { flex: 1 },
  crest: { position: "absolute", left: 0, right: 0, top: 0 },
  back: { position: "absolute", left: 12 },
  backFace: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20 },
  tally: { flexDirection: "row", alignItems: "center", gap: 4 },
  tallyItem: { flexDirection: "row", alignItems: "center" },
  tallyN: { fontFamily: fontFamily.bold, fontSize: 12.5, marginLeft: -1 },
  tallyTotal: { color: TABLE.cream, fontFamily: fontFamily.bold, fontSize: 12.5, marginLeft: 4 },
  body: { paddingHorizontal: 14, paddingBottom: 60, gap: 8 },
  section: { marginTop: 14 },
  hint: {
    color: TABLE.cream,
    opacity: 0.85,
    marginTop: -4,
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
});

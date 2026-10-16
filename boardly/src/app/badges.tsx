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
import { BadgeDetail, BadgeGrid } from "@/features/badges/BadgeGrid";
import { BOARDLY_FACE } from "@/features/badges/art";
import {
  HALL_RADIUS,
  HALL_RIM,
  hallFrame,
  hallHeader,
  hallWall,
} from "@/features/badges/hall/art";
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
  // the frame's box, and the room inside its moulding
  const box = {
    left: 6,
    top: insets.top + 2,
    width: width - 12,
    height: height - insets.top - 2 - Math.max(insets.bottom, 8),
  };
  const room = {
    left: box.left + HALL_RIM - 1,
    top: box.top + HALL_RIM - 1,
    width: box.width - 2 * (HALL_RIM - 1),
    height: box.height - 2 * (HALL_RIM - 1),
  };
  const HEAD = 104;
  const art = useMemo(
    () => ({
      wall: hallWall(room.width, room.height),
      head: hallHeader(room.width, HEAD),
      frame: hallFrame(box.width, box.height),
    }),
    [room.width, room.height, box.width, box.height],
  );
  const inner = room.width - 24;

  return (
    <View style={styles.screen}>
      <View style={[styles.room, room]}>
        <SvgXml xml={art.wall} width={room.width} height={room.height} style={StyleSheet.absoluteFill} />
        {/* the header: the iron plate and its sign */}
        <View style={{ height: HEAD }}>
          <SvgXml xml={art.head.svg} width={room.width} height={HEAD} style={StyleSheet.absoluteFill} />
          <View
            style={[
              styles.sign,
              { left: art.head.sign.x, top: art.head.sign.y, width: art.head.sign.w, height: art.head.sign.h },
            ]}
          >
            <AppText style={styles.signText} numberOfLines={1} adjustsFontSizeToFit>
              {t("badges.hall.title")}
            </AppText>
          </View>
          {/* back: an iron stud in a gold rim, on the left rail */}
          <IconButton
            accessibilityLabel={t("common.back")}
            onPress={close}
            size={40}
            style={[styles.back, { top: art.head.sign.y + art.head.sign.h / 2 - 20 }]}
          >
            <LinearGradient colors={["#5A606A", "#24282E"]} style={styles.backFace} />
            <BezelOverlay r={20} t={3.2} />
            <BackIcon size={18} />
          </IconButton>
        </View>

        {/* the strip: badges at each level, and how many earned */}
        <View style={styles.strip}>
          <LinearGradient colors={["#3A2414", "#24160C"]} style={StyleSheet.absoluteFill} />
          <BezelOverlay r={14} t={3} />
          <AppText style={styles.stripLabel}>{t("badges.hall.levels")}</AppText>
          {TIERS.map((tier) => (
            <View key={tier} style={styles.tallyItem}>
              <Badge
                art={{ glyph: {}, emoji: "★", loop: "pulse" }}
                face={BOARDLY_FACE}
                frames={BOARDLY_FRAMES}
                tier={tier}
                size={30}
                clock={still}
                alive={false}
              />
              <AppText style={[styles.tallyN, { color: TIER_GLOW[tier] }]}>
                {badges.filter((b) => b.tier === tier).length}
              </AppText>
            </View>
          ))}
          <View style={styles.grow} />
          <AppText style={styles.stripCount}>
            {`${earned.length}/${badges.length}`}
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <SectionTitle label={t("badges.hall.showcase")} colors={TABLE.ribbonRed} />
          <AppText variant="tiny" style={styles.hint}>
            {t("badges.hall.hint")}
          </AppText>
          <Showcase width={inner} badges={shown} clock={clock} onOpen={setOpen} />

          <SectionTitle
            label={t("badges.hall.collection")}
            colors={TABLE.ribbonGold}
            style={styles.collection}
          />
          <AppText variant="tiny" style={styles.hint}>
            {t("badges.hall.collectionHint")}
          </AppText>
          {groups.map(([game, list]) => (
            <View key={game ?? "boardly"} style={styles.group}>
              <View style={styles.groupHead}>
                <AppText style={styles.groupName}>{game ? gameName(game) : "Boardly"}</AppText>
                <View style={styles.groupRule} />
                <AppText style={styles.groupCount}>
                  {`${list.filter((b) => b.tier).length}/${list.length}`}
                </AppText>
              </View>
              <BadgeGrid
                badges={list}
                clock={clock}
                still={still}
                fresh={fresh}
                onStamped={onStamped}
                action={action}
                columns={3}
                cards
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* the gilded frame, over the page */}
      <SvgXml
        xml={art.frame}
        width={box.width}
        height={box.height}
        style={[styles.frame, box]}
        pointerEvents="none"
      />
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
  room: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: HALL_RADIUS - HALL_RIM,
  },
  frame: { position: "absolute" },
  grow: { flex: 1 },
  sign: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  signText: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 2,
    color: "#FFF2D0",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    textTransform: "uppercase",
  },
  back: { position: "absolute", left: 8 },
  backFace: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20 },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
  },
  stripLabel: { color: TABLE.creamMuted, fontFamily: fontFamily.semiBold, fontSize: 11, marginRight: 2 },
  tallyItem: { flexDirection: "row", alignItems: "center" },
  tallyN: { fontFamily: fontFamily.bold, fontSize: 14, marginLeft: -1 },
  stripCount: { color: TABLE.cream, fontFamily: fontFamily.bold, fontSize: 14 },
  body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 48, gap: 8 },
  hint: { color: TABLE.cream, opacity: 0.8, marginTop: -4, marginBottom: 2, textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  collection: { marginTop: 14 },
  group: { marginTop: 6, gap: 6 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  groupName: {
    color: "#FFE7B0",
    fontFamily: fontFamily.bold,
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  groupRule: { flex: 1, height: 2, borderRadius: 1, backgroundColor: "rgba(226,176,74,0.55)" },
  groupCount: { color: TABLE.cream, fontFamily: fontFamily.semiBold, fontSize: 12 },
});

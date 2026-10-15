// The profile is the player's card: who they are and the title their
// rarest badge gives them, their numbers as tokens, every badge (alive,
// on one clock), and how they do in each game. Settings sit behind the
// gear.

import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useReducedMotion, useSharedValue } from "react-native-reanimated";

import { api } from "@/api/client";
import { TIER_METAL } from "@/components/badges/Badge";
import { GearEmblem } from "@/components/engraved";
import { useIsoClock } from "@/components/iso";
import {
  AppText,
  Frame,
  GorhomBottomSheetModal,
  IconButton,
  Ribbon,
  Screen,
  TableBackdrop,
  Texture,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { BadgeGrid } from "@/features/badges/BadgeGrid";
import { NextBadge } from "@/features/badges/NextBadge";
import { nextBadge, titleBadge } from "@/features/badges/order";
import { badgeText } from "@/features/badges/strings";
import { useSeenBadges } from "@/features/badges/useSeenBadges";
import { CoinPill } from "@/features/coins/CoinPill";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useEquippedBorder } from "@/features/cosmetics/store";
import { ChangePasswordSheet } from "@/features/profile/ChangePasswordSheet";
import { DeleteAccountSheet } from "@/features/profile/DeleteAccountSheet";
import { GameRecords } from "@/features/profile/GameRecords";
import { LanguageSheet } from "@/features/profile/LanguageSheet";
import { PhotoSheet } from "@/features/profile/PhotoSheet";
import {
  SettingsSheet,
  type SettingKey,
} from "@/features/profile/SettingsSheet";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { openLegalPage } from "@/utils/legal";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useSession();
  const borderId = useEquippedBorder();
  const { spacing } = useTheme();
  const settingsRef = useRef<GorhomBottomSheetModal>(null);
  const languageSheetRef = useRef<GorhomBottomSheetModal>(null);
  const passwordSheetRef = useRef<GorhomBottomSheetModal>(null);
  const deleteSheetRef = useRef<GorhomBottomSheetModal>(null);
  const photoSheetRef = useRef<GorhomBottomSheetModal>(null);

  const statsQuery = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => (await api.auth.stats()).stats,
    enabled: user !== null,
  });
  const card = statsQuery.data;

  // One clock for every badge; it stops when nobody is looking
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const watch = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => watch.remove();
  }, []);
  const clock = useIsoClock(!focused || !active || reduceMotion);
  const still = useSharedValue(0);

  // Badges earned since this device last showed them stamp down, once
  const { seen, markSeen } = useSeenBadges(user?.id);
  const fresh = useMemo(() => {
    if (!card || !seen || !focused) return new Set<string>();
    return new Set(
      card.badges
        .filter((b) => b.unlockedAt && !seen.has(b.key))
        .map((b) => b.key),
    );
  }, [card, seen, focused]);
  const onStamped = useCallback((keys: string[]) => markSeen(keys), [markSeen]);

  const title = card ? titleBadge(card.badges) : null;
  const next = card ? nextBadge(card.badges) : null;
  const earned = card?.badges.filter((b) => b.unlockedAt).length ?? 0;
  const tokens = [
    { label: t("profile.gamesPlayed"), value: card?.gamesPlayed },
    { label: t("profile.wins"), value: card?.wins },
    {
      label: t("profile.card.winRate"),
      value: card
        ? card.gamesPlayed
          ? `${Math.round((card.wins / card.gamesPlayed) * 100)}%`
          : "–"
        : undefined,
    },
    { label: t("profile.card.bestStreak"), value: card?.bestStreak },
  ];

  const openSetting = (key: SettingKey) => {
    if (key === "borders") router.push("/borders");
    else if (key === "language") languageSheetRef.current?.present();
    else if (key === "password") passwordSheetRef.current?.present();
    else if (key === "privacy" || key === "terms") openLegalPage(key);
    else if (key === "logout") logout();
    else deleteSheetRef.current?.present();
  };

  return (
    <Screen
      scroll={false}
      style={styles.screen}
      backdrop={<TableBackdrop dim={0.45} />}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Ribbon
            label={t("profile.title")}
            colors={TABLE.ribbonGold}
            standalone
          />
          <IconButton
            accessibilityLabel={t("profile.settings")}
            onPress={() => {
              tapHaptic();
              settingsRef.current?.present();
            }}
          >
            <GearEmblem size={32} />
          </IconButton>
        </View>

        {/* The player card */}
        <Frame tone="wood" style={styles.card}>
          <View style={styles.identity}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.photo.title")}
              onPress={() => {
                tapHaptic();
                photoSheetRef.current?.present();
              }}
            >
              <AvatarBorder
                name={user?.username ?? "?"}
                size={64}
                borderId={borderId}
                avatarUrl={user?.avatarUrl}
              />
              <View style={styles.editBadge}>
                <AppText style={styles.editIcon}>📷</AppText>
              </View>
            </Pressable>
            <View style={styles.who}>
              <AppText numberOfLines={1} style={styles.username}>
                {user?.username ?? ""}
              </AppText>
              <AppText
                numberOfLines={1}
                style={[
                  styles.title,
                  {
                    color: title
                      ? TIER_METAL[title.tier].glow
                      : TABLE.creamMuted,
                  },
                ]}
              >
                {title
                  ? badgeText(t, title.key).name
                  : t("profile.card.newcomer")}
              </AppText>
              <View style={styles.coins}>
                <CoinPill amount={user?.coins ?? 0} />
              </View>
            </View>
          </View>
          <View style={styles.tokens}>
            {tokens.map((token) => (
              <View key={token.label} style={styles.tokenWrap}>
                <LinearGradient colors={TABLE.woodButton} style={styles.token}>
                  <Texture radius={26} />
                  <AppText style={styles.tokenValue}>
                    {token.value ?? "–"}
                  </AppText>
                </LinearGradient>
                <AppText
                  variant="tiny"
                  align="center"
                  numberOfLines={2}
                  style={styles.tokenLabel}
                >
                  {token.label}
                </AppText>
              </View>
            ))}
          </View>
          {next ? (
            <View style={styles.next}>
              <NextBadge badge={next} clock={still} />
            </View>
          ) : null}
        </Frame>

        {/* Badges */}
        <View style={[styles.sectionHead, { marginTop: spacing.xl }]}>
          <Ribbon label={t("profile.card.badges")} colors={TABLE.ribbonRed} />
          {card ? (
            <AppText variant="tiny" style={styles.count}>
              {t("profile.card.unlocked", {
                n: earned,
                total: card.badges.length,
              })}
            </AppText>
          ) : null}
        </View>
        <Frame tone="blue" stitched style={styles.badges}>
          {card ? (
            <BadgeGrid
              badges={card.badges}
              clock={clock}
              still={still}
              fresh={fresh}
              onStamped={onStamped}
            />
          ) : null}
        </Frame>

        {/* By game */}
        <Ribbon
          label={t("profile.card.byGame")}
          colors={TABLE.ribbonGreen}
          style={{ marginTop: spacing.xl }}
        />
        <Frame tone="wood" style={styles.games}>
          {card ? <GameRecords games={card.games} /> : null}
        </Frame>
      </ScrollView>

      <SettingsSheet ref={settingsRef} onPick={openSetting} />
      <PhotoSheet ref={photoSheetRef} />
      <LanguageSheet ref={languageSheetRef} />
      <ChangePasswordSheet ref={passwordSheetRef} />
      <DeleteAccountSheet ref={deleteSheetRef} />
    </Screen>
  );
}

const TOKEN = 52;

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: { marginTop: 14, paddingTop: 16, gap: 16 },
  // room round the avatar for its border, which draws outside it
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingLeft: 6,
    paddingTop: 6,
  },
  editBadge: {
    position: "absolute",
    right: -8,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2D6BF",
  },
  editIcon: { fontSize: 12, lineHeight: 15 },
  who: { flex: 1, gap: 1 },
  username: { fontFamily: fontFamily.bold, fontSize: 19, color: TABLE.cream },
  title: { fontFamily: fontFamily.semiBold, fontSize: 13, letterSpacing: 0.3 },
  coins: { alignSelf: "flex-start", marginTop: 6 },
  tokens: { flexDirection: "row", justifyContent: "space-between" },
  tokenWrap: { flex: 1, alignItems: "center", gap: 4 },
  // each number on a round wooden token
  token: {
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: TABLE.woodButtonBorder,
  },
  tokenValue: { fontFamily: fontFamily.bold, fontSize: 16, color: TABLE.cream },
  tokenLabel: { color: TABLE.creamMuted },
  next: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,230,190,0.14)",
    paddingTop: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  count: { color: TABLE.creamMuted, marginTop: 8 },
  badges: { paddingTop: 20, paddingHorizontal: 6 },
  games: { paddingTop: 16 },
});

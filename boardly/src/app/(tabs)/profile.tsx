// The profile is the player's card: who they are and the title their
// best badge gives them, their numbers on gold medallions, the four
// badges they show (the way into the badge hall), and how they do in
// each game. Settings sit behind the gear.

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Emblem } from "@/components/icons";
import { TIER_GLOW } from "@/components/badges/Badge";
import { FrameEmblem, GearEmblem } from "@/components/engraved";
import {
  AppText,
  AvatarStage,
  Medallion,
  Frame,
  GorhomBottomSheetModal,
  IconButton,
  SectionTitle, TitlePlaque,
  Screen,
  TableBackdrop,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { ShowcaseRow } from "@/features/badges/ShowcaseRow";
import { titleBadge } from "@/features/badges/order";
import { badgeText } from "@/features/badges/strings";
import { useMeepleTransition } from "@/features/mascot/MeepleTransition";
import { CoinPill } from "@/features/coins/CoinPill";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useEquippedBorder } from "@/features/cosmetics/store";
import { ChangePasswordSheet } from "@/features/profile/ChangePasswordSheet";
import { DeleteAccountSheet } from "@/features/profile/DeleteAccountSheet";
import { GameRecords } from "@/features/profile/GameRecords";
import { LanguageSheet } from "@/features/profile/LanguageSheet";
import { PhotoSheet } from "@/features/profile/PhotoSheet";
import { statsQuery as playerCardQuery } from "@/features/profile/warm";
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

  // usually already fetched by the time the profile opens (useWarmProfile)
  const statsQuery = useQuery(playerCardQuery(user?.id));
  const card = statsQuery.data;
  // into the badge hall through the meeple, like the wardrobe
  const go = useMeepleTransition();


  const title = card ? titleBadge(card.badges) : null;
  const earned = card?.badges.filter((b) => b.tier).length ?? 0;
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
    if (key === "language") languageSheetRef.current?.present();
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
        {/* bordered avatars draw over everything on the page */}
        <AvatarStage>
          <View style={styles.header}>
            <TitlePlaque label={t("profile.title")} />
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
                  mascot={user?.mascot}
                >
                  <View style={styles.editBadge}>
                    <Emblem emoji="📷" size={16} />
                  </View>
                </AvatarBorder>
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
                        ? TIER_GLOW[title.tier ?? "bronze"]
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
                  <Medallion size={TOKEN}>
                    <AppText style={styles.tokenValue}>
                      {token.value ?? "–"}
                    </AppText>
                  </Medallion>
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
            {card ? (
              <View style={styles.next}>
                <ShowcaseRow
                  badges={card.showcase
                    .map((k) => card.badges.find((b) => b.key === k))
                    .filter((b) => b !== undefined)}
                  count={earned}
                  total={card.badges.length}
                  onOpen={() => go(() => router.push("/badges"))}
                />
              </View>
            ) : null}
            {/* how the card looks: the border now; later its background
                and a title (drawn last, so nothing on the card covers it) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.style")}
              hitSlop={6}
              onPress={() => {
                tapHaptic();
                router.push("/borders");
              }}
              style={({ pressed }) => [styles.style, pressed && styles.pressed]}
            >
              <FrameEmblem size={26} />
              <AppText style={styles.styleText}>{t("profile.style")}</AppText>
            </Pressable>
          </Frame>

          {/* By game */}
          <SectionTitle
            label={t("profile.card.byGame")}
            colors={TABLE.ribbonGreen}
            style={{ marginTop: spacing.xl }}
          />
          <Frame tone="wood" style={styles.games}>
            {card ? <GameRecords games={card.games} /> : null}
          </Frame>
        </AvatarStage>
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
  style: { position: "absolute", top: 10, right: 12, zIndex: 2, alignItems: "center" },
  pressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  styleText: { fontFamily: fontFamily.semiBold, fontSize: 10, lineHeight: 13, color: TABLE.cream },
  username: { fontFamily: fontFamily.bold, fontSize: 19, color: TABLE.cream },
  title: { fontFamily: fontFamily.semiBold, fontSize: 13, letterSpacing: 0.3 },
  coins: { alignSelf: "flex-start", marginTop: 6 },
  tokens: { flexDirection: "row", justifyContent: "space-between" },
  tokenWrap: { flex: 1, alignItems: "center", gap: 4 },
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

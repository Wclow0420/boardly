import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BellIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import {
  AppText,
  GorhomBottomSheetModal,
  IconButton,
  Screen,
  SkeletonCard,
  TableBackdrop,
  Texture,
} from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useSession } from "@/context/SessionContext";
import {
  CHAIR,
  CROWN_COIN,
  DICE,
  HOME,
  INVITE_DICE,
  MEEPLE,
  QUICK_PANEL,
  QUICK_PANEL_RATIO,
  SCENE_TOP,
} from "@/features/home/art";
import { Frame, Ribbon } from "@/features/home/frames";
import { JoinTableSheet } from "@/features/home/JoinTableSheet";
import { TableCard } from "@/features/home/TableCard";
import {
  useAlreadyInRoomRedirect,
  useCreateRoom,
  useMyTables,
  useOnlineFriends,
} from "@/features/home/hooks";
import { useGamesQuery } from "@/features/games/hooks";
import { fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useSession();
  const { colors, spacing } = useTheme();
  const { tables, isLoading: tablesLoading } = useMyTables();
  const onlineFriends = useOnlineFriends();
  const games = useGamesQuery();
  const createRoom = useCreateRoom();
  const redirectIfInRoom = useAlreadyInRoomRedirect();
  const joinSheetRef = useRef<GorhomBottomSheetModal>(null);

  const quickPlay = () => {
    const catalogue = games.data ?? [];
    if (catalogue.length === 0 || createRoom.isPending) return;
    tapHaptic();
    const game = catalogue[Math.floor(Math.random() * catalogue.length)];
    createRoom.mutate(game.id, {
      onSuccess: ({ room }) => router.push(`/lobby/${room.code}`),
      onError: (err) => redirectIfInRoom(err),
    });
  };

  const quickContent = (
    <>
      {DICE ? (
        <Image source={DICE} style={styles.dice} contentFit="contain" />
      ) : (
        <AppText style={styles.diceEmoji}>🎲</AppText>
      )}
      <View style={styles.grow}>
        <AppText style={styles.quickTitle}>{t("home.quickPlay")}</AppText>
        <AppText
          style={styles.quickSubtitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {t("home.quickPlaySubtitle")}
        </AppText>
      </View>
      <LinearGradient colors={HOME.button} style={styles.startButton}>
        <AppText style={styles.startText}>{t("home.start")}</AppText>
        <ChevronRightIcon size={12} color="#FFFFFF" strokeWidth={2.6} />
      </LinearGradient>
    </>
  );

  return (
    // Everything fits one screen: nothing scrolls. The sections stack from
    // the top; any spare height is left empty at the bottom.
    <Screen scroll={false} backdrop={<TableBackdrop />} style={styles.screen}>
      {SCENE_TOP ? (
        <Image
          source={SCENE_TOP}
          style={styles.sceneTop}
          contentFit="cover"
          pointerEvents="none"
        />
      ) : null}

      {/* Greeting */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText
            variant="h2"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={styles.shrink}
          >
            {t("home.greeting", { name: user?.username ?? "" })}
          </AppText>
          <AppText style={styles.wave}>👋</AppText>
        </View>
        <View>
          <IconButton accessibilityLabel="Notifications">
            <BellIcon size={22} color={colors.icon} />
          </IconButton>
          <View style={styles.badge} />
        </View>
      </View>

      {/* Quick start */}
      <View style={{ marginTop: spacing.md }}>
        <Ribbon label={t("home.quickStart")} colors={HOME.ribbonRed} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.quickPlay")}
          onPress={quickPlay}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {QUICK_PANEL ? (
            <View style={[styles.quickArt, { aspectRatio: QUICK_PANEL_RATIO }]}>
              <Image
                source={QUICK_PANEL}
                style={StyleSheet.absoluteFill}
                contentFit="fill"
              />
              {quickContent}
            </View>
          ) : (
            <Frame tone="yellow" style={styles.quick}>
              {quickContent}
            </Frame>
          )}
        </Pressable>
      </View>

      {/* Join with a code */}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          tapHaptic();
          joinSheetRef.current?.present();
        }}
        style={({ pressed }) => [styles.joinWrap, pressed && styles.pressed]}
      >
        <LinearGradient colors={HOME.woodButton} style={styles.join}>
          <Texture radius={11} />
          <AppText style={styles.joinIcon}>{"</>"}</AppText>
          <AppText style={styles.joinText}>{t("home.joinWithCode")}</AppText>
        </LinearGradient>
      </Pressable>

      {/* My tables */}
      <View style={styles.tablesSection}>
        <View style={styles.sectionRow}>
          <Ribbon label={t("home.yourTables")} colors={HOME.ribbonBlue} />
          <Pressable
            onPress={() => tapHaptic()}
            hitSlop={8}
            style={styles.seeAll}
          >
            <AppText style={styles.seeAllText}>{t("common.seeAll")}</AppText>
            <ChevronRightIcon size={10} color={HOME.cream} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Frame tone="blue" stitched style={styles.tablesFrame}>
          {tablesLoading ? (
            <View style={styles.tables}>
              <SkeletonCard style={styles.grow} />
              <SkeletonCard style={styles.grow} />
            </View>
          ) : tables.length === 0 ? (
            <View style={styles.empty}>
              {CROWN_COIN ? (
                <Image source={CROWN_COIN} style={styles.coin} contentFit="contain" />
              ) : null}
              {MEEPLE ? (
                <Image source={MEEPLE} style={styles.meeple} contentFit="contain" />
              ) : null}
              {CHAIR ? (
                <Image source={CHAIR} style={styles.chair} contentFit="contain" />
              ) : (
                <AppText style={styles.chairEmoji}>🪑</AppText>
              )}
              <AppText variant="title" align="center" style={{ marginTop: spacing.xs }}>
                {t("home.noTablesTitle")}
              </AppText>
              <AppText variant="caption" color="textMuted" align="center">
                {t("home.noTablesSubtitle")}
              </AppText>
            </View>
          ) : (
            <View style={styles.tables}>
              {tables.slice(0, 2).map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onPress={() => router.push(`/lobby/${table.code}`)}
                />
              ))}
            </View>
          )}
        </Frame>
      </View>

      {/* Friends online */}
      <View style={{ marginTop: spacing.lg }}>
        <Ribbon label={t("home.friendsOnline")} colors={HOME.ribbonGreen} />
        <Frame tone="wood" style={styles.friendsFrame}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friends}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                tapHaptic();
                router.push("/friends");
              }}
              style={styles.invite}
            >
              <View style={styles.inviteTile}>
                {INVITE_DICE ? (
                  <Image
                    source={INVITE_DICE}
                    style={styles.inviteArt}
                    contentFit="contain"
                  />
                ) : (
                  <AppText style={styles.inviteEmoji}>🎲</AppText>
                )}
              </View>
              <View style={styles.inviteText}>
                <AppText variant="caption" numberOfLines={2}>
                  {t("home.inviteTitle")}
                </AppText>
                <AppText variant="tiny" color="textMuted" numberOfLines={2}>
                  {t("home.inviteSubtitle")}
                </AppText>
              </View>
            </Pressable>

            {onlineFriends.slice(0, 6).map((friend) => (
              <View key={friend.id} style={styles.friend}>
                <AvatarBorder
                  name={friend.name}
                  borderId={friend.borderId}
                  size={44}
                  presence={friend.presence}
                  ringColor={
                    friend.presence === "inGame" ? "#E9A92B" : "#5FBF55"
                  }
                />
                <AppText variant="tiny" numberOfLines={1} style={styles.friendName}>
                  {friend.name}
                </AppText>
                <AppText
                  variant="tiny"
                  numberOfLines={1}
                  style={{
                    color: friend.presence === "inGame" ? "#E9A92B" : "#7FD672",
                  }}
                >
                  {t(`friends.status.${friend.presence ?? "online"}`)}
                </AppText>
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                tapHaptic();
                router.push("/friends");
              }}
              style={styles.friend}
            >
              <View style={styles.more}>
                <PlusIcon size={15} color={HOME.creamMuted} />
              </View>
              <AppText variant="tiny" color="textMuted" numberOfLines={1}>
                {t("home.inviteMore")}
              </AppText>
            </Pressable>
          </ScrollView>
        </Frame>
      </View>

      <JoinTableSheet ref={joinSheetRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  pressed: { opacity: 0.88 },
  screen: { paddingBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  greeting: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  wave: { fontSize: 18, lineHeight: 24 },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F2542D",
    borderWidth: 2,
    borderColor: "#1A120C",
  },
  sceneTop: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.9,
  },

  quick: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 },
  quickArt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
  },
  dice: { width: 56, height: 56, marginLeft: -4 },
  diceEmoji: { fontSize: 38, lineHeight: 48 },
  quickTitle: { fontFamily: fontFamily.bold, fontSize: 17, color: HOME.ink },
  quickSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: "rgba(58,36,8,0.75)",
    marginTop: 1,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: HOME.buttonBorder,
    justifyContent: "center",
  },
  startText: { fontFamily: fontFamily.bold, fontSize: 12.5, color: "#FFFFFF" },

  joinWrap: { alignSelf: "center", marginTop: 14 },
  join: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: HOME.woodButtonBorder,
  },
  joinIcon: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: HOME.cream,
    borderWidth: 1.5,
    borderColor: HOME.cream,
    borderRadius: 4,
    paddingHorizontal: 3,
    overflow: "hidden",
  },
  joinText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: HOME.cream },

  // Sized by its tables; gives way first when the screen is short
  tablesSection: { flexShrink: 1, marginTop: 14, minHeight: 0 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: "#16263D",
    borderWidth: 1,
    borderColor: "#2E4A70",
  },
  seeAllText: { fontFamily: fontFamily.semiBold, fontSize: 11, color: HOME.cream },
  // Sized by its content, but allowed to shrink on a short screen
  tablesFrame: {
    flexShrink: 1,
    minHeight: 0,
    paddingTop: 20,
    overflow: "hidden",
  },
  tables: { flexDirection: "row", gap: 10 },
  empty: { alignItems: "center", paddingVertical: 10 },
  chair: { width: 58, height: 58 },
  chairEmoji: { fontSize: 36, lineHeight: 46 },
  coin: { position: "absolute", left: -6, bottom: -10, width: 40, height: 40 },
  meeple: { position: "absolute", right: -8, bottom: -10, width: 48, height: 48 },

  friendsFrame: { paddingTop: 18, paddingBottom: 10, paddingHorizontal: 0 },
  friends: { alignItems: "flex-start", gap: 12, paddingHorizontal: 14 },
  invite: { flexDirection: "row", alignItems: "center", gap: 8, width: 168 },
  inviteTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#7A5232",
    borderWidth: 2,
    borderColor: "#3A2414",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteArt: { width: 36, height: 36 },
  inviteEmoji: { fontSize: 22, lineHeight: 28 },
  inviteText: { flex: 1, gap: 1 },
  friend: { alignItems: "center", gap: 2, width: 64 },
  friendName: { color: HOME.cream, marginTop: 2 },
  more: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: HOME.creamMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});

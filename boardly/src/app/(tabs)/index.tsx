import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BellIcon, ChevronRightIcon, Emblem, PlusIcon } from "@/components/icons";
import {
  AppText,
  BezelOverlay,
  GorhomBottomSheetModal,
  LightSweep,
  IconButton,
  Screen,
  SkeletonCard,
  TableBackdrop,
  Texture,
} from "@/components/ui";
import { Die, type DieHandle } from "@/components/tabletop/Die";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useSession } from "@/context/SessionContext";
import { ClaimRewards } from "@/features/coins/ClaimRewards";
import { CoinFly, type CoinFlyHandle } from "@/features/coins/CoinFly";
import { CoinPill } from "@/features/coins/CoinPill";
import {
  CHAIR,
  CROWN_COIN,
  DICE,
  HOME,
  INVITE_DICE,
  MEEPLE,
  SCENE_TOP,
} from "@/features/home/art";
import { Frame, SectionTitle } from "@/features/home/frames";
import { JoinTableSheet } from "@/features/home/JoinTableSheet";
import { TableCard } from "@/features/home/TableCard";
import {
  useAlreadyInRoomRedirect,
  useCreateRoom,
  useMyTables,
  useOnlineFriends,
} from "@/features/home/hooks";
import { useGamesQuery } from "@/features/games/hooks";
import { useGameName } from "@/games/names";
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
  const coinPillRef = useRef<View>(null);
  const coinFlyRef = useRef<CoinFlyHandle>(null);

  const gameName = useGameName();
  const dieRef = useRef<DieHandle>(null);
  // the roll under way, and the game it came up with
  const [rolling, setRolling] = useState(false);
  const [rolled, setRolled] = useState<string | null>(null);

  // Quick play throws the die: the table is opened while it tumbles,
  // and we sit down once it has landed on the game.
  const quickPlay = () => {
    const catalogue = games.data ?? [];
    if (catalogue.length === 0 || createRoom.isPending || rolling) return;
    tapHaptic();
    const game = catalogue[Math.floor(Math.random() * catalogue.length)];
    setRolling(true);
    setRolled(null);
    const landed = (dieRef.current?.roll() ?? Promise.resolve()).then(() => {
      setRolled(gameName(game.id, game.name));
    });
    const settle = () => {
      setRolling(false);
      setRolled(null);
    };
    createRoom.mutate(game.id, {
      onSuccess: ({ room }) => {
        // a beat on the result before the lobby opens
        landed
          .then(() => new Promise((done) => setTimeout(done, 450)))
          .then(() => {
            settle();
            router.push(`/lobby/${room.code}`);
          });
      },
      onError: (err) => {
        landed.then(settle);
        redirectIfInRoom(err);
      },
    });
  };

  const quickContent = (
    <>
      {DICE ? (
        <Image source={DICE} style={styles.dice} contentFit="contain" />
      ) : (
        <Die ref={dieRef} size={46} style={styles.die} />
      )}
      <View style={styles.grow}>
        <AppText style={styles.quickTitle}>{t("home.quickPlay")}</AppText>
        <AppText
          style={styles.quickSubtitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {rolled
            ? `🎲 ${rolled}!`
            : rolling
              ? t("home.rolling")
              : t("home.quickPlaySubtitle")}
        </AppText>
      </View>
      <LinearGradient colors={HOME.button} style={styles.startButton}>
        <BezelOverlay r={22} t={3.2} />
        <LightSweep r={22} />
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

      {/* Me (opens my profile), coins, notifications */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={user?.username ?? t("tabs.profile")}
          hitSlop={8}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <AvatarBorder
            name={user?.username ?? "?"}
            borderId={user?.borderId}
            avatarUrl={user?.avatarUrl}
            mascot={user?.mascot}
            size={42}
          />
        </Pressable>
        <View style={styles.grow} />
        <CoinPill ref={coinPillRef} amount={user?.coins ?? 0} />
        <View>
          <IconButton accessibilityLabel="Notifications">
            <BellIcon size={22} color={colors.icon} />
          </IconButton>
          <View style={styles.badge} />
        </View>
      </View>

      {/* Winnings waiting to be claimed */}
      <ClaimRewards target={coinPillRef} fly={coinFlyRef} />

      {/* Quick start */}
      <View style={{ marginTop: spacing.md }}>
        <SectionTitle label={t("home.quickStart")} colors={HOME.ribbonRed} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.quickPlay")}
          onPress={quickPlay}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Frame tone="yellow" ornate style={styles.quick}>
            {quickContent}
          </Frame>
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
          <Texture radius={13} />
          <BezelOverlay r={13} t={3} metal="silver" />
          <Emblem emoji="🎟" size={28} />
          <AppText style={styles.joinText}>{t("home.joinWithCode")}</AppText>
        </LinearGradient>
      </Pressable>

      {/* My tables */}
      <View style={styles.tablesSection}>
        <SectionTitle
          label={t("home.yourTables")}
          colors={HOME.ribbonBlue}
          right={
            <Pressable
              onPress={() => tapHaptic()}
              hitSlop={8}
              style={styles.seeAll}
            >
              <BezelOverlay r={10} t={2.4} metal="silver" />
              <AppText style={styles.seeAllText}>{t("common.seeAll")}</AppText>
              <ChevronRightIcon size={10} color={HOME.cream} strokeWidth={2.4} />
            </Pressable>
          }
        />
        <Frame tone="blue" stitched style={styles.tablesFrame}>
          {tablesLoading ? (
            <View style={styles.tables}>
              <SkeletonCard style={styles.grow} />
              <SkeletonCard style={styles.grow} />
            </View>
          ) : tables.length === 0 ? (
            <View style={styles.empty}>
              {CROWN_COIN ? (
                <Image
                  source={CROWN_COIN}
                  style={styles.coin}
                  contentFit="contain"
                />
              ) : null}
              {MEEPLE ? (
                <Image
                  source={MEEPLE}
                  style={styles.meeple}
                  contentFit="contain"
                />
              ) : null}
              {CHAIR ? (
                <Image
                  source={CHAIR}
                  style={styles.chair}
                  contentFit="contain"
                />
              ) : (
                <Emblem emoji="🪑" size={46} />
              )}
              <AppText
                variant="title"
                align="center"
                style={{ marginTop: spacing.xs }}
              >
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
              {/* room on the felt for another: fetch a box from the shelf */}
              {tables.length === 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("home.newTable")}
                  onPress={() => {
                    tapHaptic();
                    router.push("/games");
                  }}
                  style={({ pressed }) => [
                    styles.newTable,
                    pressed && styles.pressed,
                  ]}
                >
                  <PlusIcon size={20} color={HOME.creamMuted} />
                  <AppText
                    variant="tiny"
                    align="center"
                    style={{ color: HOME.creamMuted }}
                  >
                    {t("home.newTable")}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          )}
        </Frame>
      </View>

      {/* Friends online */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionTitle label={t("home.friendsOnline")} colors={HOME.ribbonGreen} />
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
                  <Emblem emoji="🎲" size={30} />
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
                  avatarUrl={friend.avatarUrl}
                  mascot={friend.mascot}
                  size={44}
                  presence={friend.presence}
                  ringColor={
                    friend.presence === "inGame" ? "#E9A92B" : "#5FBF55"
                  }
                />
                <AppText
                  variant="tiny"
                  numberOfLines={1}
                  style={styles.friendName}
                >
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
      {/* Coins fly across this layer when winnings are claimed */}
      <CoinFly ref={coinFlyRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  pressed: { opacity: 0.88 },
  screen: { paddingBottom: 12 },
  // Padding leaves room for the avatar's border, which draws outside it
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 6,
  },
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

  quick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  dice: { width: 56, height: 56, marginLeft: -4 },
  die: { marginHorizontal: 4 },
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
    justifyContent: "center",
  },
  startText: { fontFamily: fontFamily.bold, fontSize: 12.5, color: "#FFFFFF" },

  joinWrap: { alignSelf: "center", marginTop: 14 },
  join: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 13,
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
  joinText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: HOME.cream,
  },

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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#16263D",
  },
  seeAllText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: HOME.cream,
  },
  // Sized by its content, but allowed to shrink on a short screen
  tablesFrame: {
    flexShrink: 1,
    minHeight: 0,
    paddingTop: 20,
    overflow: "hidden",
  },
  tables: { flexDirection: "row", gap: 10 },
  newTable: {
    flex: 1,
    maxWidth: "50%",
    aspectRatio: 1.6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: HOME.creamMuted,
  },
  empty: { alignItems: "center", paddingVertical: 10 },
  chair: { width: 58, height: 58 },
  chairEmoji: { fontSize: 36, lineHeight: 46 },
  coin: { position: "absolute", left: -6, bottom: -10, width: 40, height: 40 },
  meeple: {
    position: "absolute",
    right: -8,
    bottom: -10,
    width: 48,
    height: 48,
  },

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

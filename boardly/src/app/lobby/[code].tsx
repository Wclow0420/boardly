import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  BackIcon,
  CopyIcon,
  FriendsIcon,
  LinkIcon,
} from "@/components/icons";
import {
  AppText,
  Button,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  GorhomBottomSheetModal,
  IconButton,
  Screen,
  Skeleton,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import {
  RulesButton,
  RulesSheet,
  useHasRules,
} from "@/features/game/RulesSheet";
import { ConfettiBackdrop } from "@/features/lobby/ConfettiBackdrop";
import { InviteFriendsSheet } from "@/features/lobby/InviteFriendsSheet";
import { InviteSlotCard, PlayerCard } from "@/features/lobby/PlayerCard";
import {
  useLeaveRoom,
  useRoom,
  useSetReady,
  useStartGame,
} from "@/features/lobby/hooks";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import { fontFamily, palette, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";
import { shareOrCopy } from "@/utils/share";

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const gameName = useGameName();
  const leaveSheetRef = useRef<GorhomBottomSheetModal>(null);
  const inviteSheetRef = useRef<GorhomBottomSheetModal>(null);

  const roomCode = (code ?? "").toUpperCase();
  const roomQuery = useRoom(roomCode);
  const room = roomQuery.data;
  const startGame = useStartGame(room?.id);
  const setReady = useSetReady(room?.id, roomCode);
  const leaveRoom = useLeaveRoom(room?.id);

  const hasRules = useHasRules(room?.gameType);
  // Games with their own look bring their art into the lobby header
  const skin = room ? getGame(room.gameType)?.skin : undefined;
  const heroInk = skin ? "#FFFFFF" : palette.ink;
  const me = room?.players.find((p) => p.userId === user?.id);
  const isHost = user?.id === room?.hostId;
  const isMember = me !== undefined;

  // The moment the game starts (host's tap or the socket broadcast),
  // everyone in the lobby moves to the game screen.
  const status = room?.status;
  useEffect(() => {
    if (status === "playing" && isMember) {
      successHaptic();
      router.replace(`/game/${roomCode}`);
    }
  }, [status, isMember, roomCode, router]);

  const copyCode = async () => {
    tapHaptic();
    await Clipboard.setStringAsync(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = async () => {
    if (!room) return;
    const link = Linking.createURL(`join/${room.code}`);
    const outcome = await shareOrCopy(
      t("lobby.shareMessage", {
        game: gameName(room.gameType, room.game?.name),
        code: room.code,
        link,
      }),
      link
    ).catch(() => "dismissed" as const);
    // No share sheet (desktop browsers): the link went to the clipboard
    if (outcome === "copied") {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleBack = () => {
    // Leaving an active lobby means leaving the table — confirm first.
    if (isMember && room?.status === "waiting") {
      leaveSheetRef.current?.present();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Opened directly (web link / refresh): nothing to go back to
      router.replace("/");
    }
  };

  const confirmLeave = () => {
    leaveRoom.mutate(undefined, {
      onSuccess: () => {
        leaveSheetRef.current?.dismiss();
        router.dismissTo("/");
      },
    });
  };

  const minPlayers = room?.game?.minPlayers ?? 2;
  const maxPlayers = room?.game?.maxPlayers ?? 2;
  // Host is ready by definition (also tolerates pre-migration rows)
  const everyoneReady =
    room?.players.every((p) => p.ready || p.userId === room.hostId) ?? false;
  const canStart =
    room?.status === "waiting" &&
    (room?.players.length ?? 0) >= minPlayers &&
    everyoneReady;

  const isClosed = room?.status === "closed" || room?.status === "finished";

  return (
    // Fixed header and footer; only the player list in between scrolls
    <Screen
      scroll={false}
      padded={false}
      inset={false}
      background={colors.surface}
    >
      {/* Header — brand gradient stays identical in dark mode */}
      <LinearGradient
        colors={
          skin
            ? [skin.colors.background ?? "#0B1114", skin.colors.background ?? "#0B1114"]
            : ["#FFD24A", "#FFB627"]
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        {skin ? (
          <>
            {skin.backdropImage ? (
              <Image
                source={skin.backdropImage}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : null}
            <View style={[StyleSheet.absoluteFill, styles.heroShade]} />
          </>
        ) : (
          <ConfettiBackdrop />
        )}
        <View style={styles.heroNav}>
          <IconButton accessibilityLabel="Back" onPress={handleBack}>
            <BackIcon size={20} color={heroInk} />
          </IconButton>
          {hasRules ? (
            <RulesButton color={heroInk} onPress={() => setRulesOpen(true)} />
          ) : (
            <View />
          )}
        </View>

        <View style={styles.heroBody}>
          {skin?.logo ? (
            <Image
              source={skin.logo}
              style={styles.heroLogo}
              contentFit="contain"
              accessibilityLabel={
                room ? gameName(room.gameType, room.game?.name) : undefined
              }
            />
          ) : (
            <>
              <AppText style={styles.heroEmoji}>
                {room?.game?.emoji ?? "🎲"}
              </AppText>
              <AppText
                style={{
                  fontFamily: fontFamily.bold,
                  fontSize: 30,
                  lineHeight: 40,
                  color: heroInk,
                  marginTop: 8,
                }}
              >
                {room ? gameName(room.gameType, room.game?.name) : " "}
              </AppText>
            </>
          )}
          <AppText
            style={{
              fontFamily: fontFamily.medium,
              fontSize: 11,
              color: skin ? "rgba(255,255,255,0.7)" : "rgba(24,32,43,0.6)",
              marginTop: 10,
            }}
          >
            {copied ? t("lobby.codeCopied") : t("lobby.tableCode")}
          </AppText>
          <Pressable
            onPress={copyCode}
            style={[styles.codePill, skin ? styles.codePillDark : null]}
          >
            <AppText
              style={{
                fontFamily: fontFamily.bold,
                fontSize: 16,
                color: heroInk,
                letterSpacing: 1,
              }}
            >
              {roomCode}
            </AppText>
            <CopyIcon size={15} color={heroInk} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Player grid / closed state */}
      <View
        style={[
          styles.playersSheet,
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.playersScroll}
        >
        {roomQuery.isPending ? (
          <View style={styles.playersGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <View key={i} style={styles.playerCell}>
                <Skeleton height={150} radius={radius.xl} />
              </View>
            ))}
          </View>
        ) : roomQuery.isError ? (
          <ErrorState
            title={t("common.errorTitle")}
            subtitle={t("common.errorSubtitle")}
            retryLabel={t("common.retry")}
            onRetry={() => roomQuery.refetch()}
          />
        ) : isClosed ? (
          <EmptyState
            emoji="🚪"
            title={t("lobby.closedTitle")}
            subtitle={t("lobby.closedSubtitle")}
            actionLabel={t("game.backHome")}
            onAction={() => router.dismissTo("/")}
          />
        ) : (
          <View style={styles.playersGrid}>
            {room?.players.map((player) => (
              <View key={player.userId} style={styles.playerCell}>
                <PlayerCard
                  player={{
                    id: player.userId,
                    name: player.username,
                    borderId: player.borderId,
                    isHost: player.userId === room.hostId,
                    ready: player.ready,
                  }}
                />
              </View>
            ))}
            {(room?.players.length ?? 0) < maxPlayers ? (
              <View style={styles.playerCell}>
                <InviteSlotCard
                  onPress={() => inviteSheetRef.current?.present()}
                />
              </View>
            ) : null}
          </View>
        )}
        </ScrollView>
      </View>

      {/* Footer */}
      {!isClosed && !roomQuery.isError ? (
        <View style={[styles.footer, { paddingHorizontal: spacing.xxl }]}>
          <View style={styles.count}>
            <FriendsIcon size={22} color={colors.icon} />
            <AppText variant="title" style={{ fontSize: 14 }}>
              {t("lobby.playersCount", {
                current: room?.players.length ?? 0,
                max: maxPlayers,
              })}
            </AppText>
          </View>

          {isHost ? (
            <Button
              label={t("lobby.startGame")}
              size="lg"
              style={{ marginTop: spacing.lg }}
              disabled={!canStart}
              loading={startGame.isPending}
              onPress={() => startGame.mutate()}
            />
          ) : (
            <Button
              label={me?.ready ? t("lobby.unready") : t("lobby.imReady")}
              size="lg"
              variant={me?.ready ? "secondary" : "primary"}
              style={{ marginTop: spacing.lg }}
              disabled={!isMember || room?.status !== "waiting"}
              loading={setReady.isPending}
              onPress={() => setReady.mutate(!me?.ready)}
            />
          )}

          <Button
            label={linkCopied ? t("lobby.linkCopied") : t("lobby.shareInvite")}
            variant="secondary"
            size="md"
            leftIcon={<LinkIcon size={16} color={colors.primary} />}
            style={{ marginTop: spacing.md, borderRadius: 999, paddingVertical: 15 }}
            onPress={shareInvite}
          />
        </View>
      ) : null}

      {room && hasRules ? (
        <RulesSheet
          gameKey={room.gameType}
          gameName={gameName(room.gameType, room.game?.name)}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
      <InviteFriendsSheet ref={inviteSheetRef} onShareLink={shareInvite} />
      <ConfirmSheet
        ref={leaveSheetRef}
        title={isHost ? t("lobby.closeTitle") : t("lobby.leaveTitle")}
        message={isHost ? t("lobby.closeMessage") : t("lobby.leaveMessage")}
        confirmLabel={isHost ? t("lobby.closeConfirm") : t("lobby.leaveConfirm")}
        cancelLabel={t("lobby.stay")}
        destructive
        loading={leaveRoom.isPending}
        onConfirm={confirmLeave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 34,
    overflow: "hidden",
  },
  heroNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  heroBody: { alignItems: "center", paddingTop: 6 },
  heroEmoji: { fontSize: 44, lineHeight: 52 },
  heroLogo: { width: 250, height: 118 },
  heroShade: { backgroundColor: "rgba(0,0,0,0.55)" },
  codePillDark: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  playersSheet: {
    flex: 1,
    marginTop: -22,
    marginHorizontal: 14,
    overflow: "hidden",
  },
  playersScroll: { padding: 16 },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  playerCell: {
    width: "47%",
    flexGrow: 1,
  },
  footer: { paddingTop: 18 },
  count: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

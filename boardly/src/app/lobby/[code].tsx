import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  BackIcon,
  CopyIcon,
  DotsIcon,
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
import { ConfettiBackdrop } from "@/features/lobby/ConfettiBackdrop";
import { InviteSlotCard, PlayerCard } from "@/features/lobby/PlayerCard";
import {
  useLeaveRoom,
  useRoom,
  useSetReady,
  useStartGame,
} from "@/features/lobby/hooks";
import { fontFamily, palette, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();
  const [copied, setCopied] = useState(false);
  const leaveSheetRef = useRef<GorhomBottomSheetModal>(null);

  const roomCode = (code ?? "").toUpperCase();
  const roomQuery = useRoom(roomCode);
  const room = roomQuery.data;
  const startGame = useStartGame(room?.id);
  const setReady = useSetReady(room?.id, roomCode);
  const leaveRoom = useLeaveRoom(room?.id);

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

  const shareInvite = () => {
    if (!room) return;
    Share.share({
      message: t("lobby.shareMessage", {
        game: room.game?.name ?? room.gameType,
        code: room.code,
        link: Linking.createURL(`join/${room.code}`),
      }),
    }).catch(() => {});
  };

  const handleBack = () => {
    // Leaving an active lobby means leaving the table — confirm first.
    if (isMember && room?.status === "waiting") {
      leaveSheetRef.current?.present();
    } else {
      router.back();
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
    <Screen scroll padded={false} inset={false} background={colors.surface}>
      {/* Header — brand gradient stays identical in dark mode */}
      <LinearGradient
        colors={["#FFD24A", "#FFB627"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        <ConfettiBackdrop />
        <View style={styles.heroNav}>
          <IconButton accessibilityLabel="Back" onPress={handleBack}>
            <BackIcon size={20} color={palette.ink} />
          </IconButton>
          <IconButton accessibilityLabel="Options">
            <DotsIcon size={20} color={palette.ink} />
          </IconButton>
        </View>

        <View style={styles.heroBody}>
          <AppText style={styles.heroEmoji}>{room?.game?.emoji ?? "🎲"}</AppText>
          <AppText
            style={{
              fontFamily: fontFamily.bold,
              fontSize: 30,
              lineHeight: 40,
              color: palette.ink,
              marginTop: 8,
            }}
          >
            {room?.game?.name ?? " "}
          </AppText>
          <AppText
            style={{
              fontFamily: fontFamily.medium,
              fontSize: 11,
              color: "rgba(24,32,43,0.6)",
              marginTop: 10,
            }}
          >
            {copied ? t("lobby.codeCopied") : t("lobby.tableCode")}
          </AppText>
          <Pressable onPress={copyCode} style={styles.codePill}>
            <AppText
              style={{
                fontFamily: fontFamily.bold,
                fontSize: 16,
                color: palette.ink,
                letterSpacing: 1,
              }}
            >
              {roomCode}
            </AppText>
            <CopyIcon size={15} color={palette.ink} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Player grid / closed state */}
      <View
        style={[
          styles.playersSheet,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.xxl,
          },
        ]}
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
                    isHost: player.userId === room.hostId,
                    ready: player.ready,
                  }}
                />
              </View>
            ))}
            {(room?.players.length ?? 0) < maxPlayers ? (
              <View style={styles.playerCell}>
                <InviteSlotCard onPress={shareInvite} />
              </View>
            ) : null}
          </View>
        )}
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
            label={t("lobby.shareInvite")}
            variant="secondary"
            size="md"
            leftIcon={<LinkIcon size={16} color={colors.primary} />}
            style={{ marginTop: spacing.md, borderRadius: 999, paddingVertical: 15 }}
            onPress={shareInvite}
          />
        </View>
      ) : null}

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
    marginTop: -22,
    marginHorizontal: 14,
    padding: 16,
  },
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

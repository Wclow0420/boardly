// Deep-link landing: boardly-dev://join/CODE (and the "Join with code"
// share links). Shows a table preview and handles every conflict case:
// already a member -> open it; already at another table -> offer to
// leave (forfeiting a running game) and join; full/started/not found ->
// clear error states.

import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api, ApiError } from "@/api/client";
import {
  AppText,
  Avatar,
  AvatarStack,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useJoinRoom, useMyTables } from "@/features/home/hooks";
import { useLeaveRoom } from "@/features/lobby/hooks";
import { fontFamily, useTheme } from "@/theme";

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);

  const roomCode = (code ?? "").toUpperCase();

  const preview = useQuery({
    queryKey: ["joinPreview", roomCode],
    queryFn: async () => (await api.getRoomByCode(roomCode)).room,
    enabled: roomCode.length > 0,
  });
  const { tables } = useMyTables();
  const join = useJoinRoom();

  const room = preview.data;
  const isMember = room?.players.some((p) => p.userId === user?.id) ?? false;
  // My active table, if it's a different one than this link points to
  const otherTable = tables.find((table) => table.code !== roomCode);
  const leaveOther = useLeaveRoom(otherTable?.id);

  const goToRoom = () => router.replace(`/lobby/${roomCode}`);

  const handleJoin = () => {
    setError(null);
    join.mutate(
      { code: roomCode },
      {
        onSuccess: goToRoom,
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? t([`errors.${err.code}`, err.message])
              : t("common.errorTitle")
          );
        },
      }
    );
  };

  const handleLeaveAndJoin = () => {
    setError(null);
    leaveOther.mutate(undefined, {
      onSuccess: handleJoin,
      onError: () => setError(t("common.errorTitle")),
    });
  };

  if (preview.isPending) {
    return (
      <Screen>
        <Skeleton height={28} width="60%" />
        <Skeleton height={180} style={{ marginTop: 24 }} radius={20} />
      </Screen>
    );
  }

  if (preview.isError || !room || room.status === "closed") {
    return (
      <Screen>
        <EmptyState
          emoji="🔍"
          title={t("errors.room_not_found")}
          actionLabel={t("game.backHome")}
          onAction={() => router.dismissTo("/")}
        />
      </Screen>
    );
  }

  const host = room.players.find((p) => p.userId === room.hostId);
  const joinable = room.status === "waiting" && !isMember;
  const blockedByOtherTable = joinable && otherTable !== undefined;

  return (
    <Screen>
      <AppText variant="h2">{t("join.title")}</AppText>

      {/* Table preview */}
      <Card radius={radius.xl} style={[styles.preview, { marginTop: spacing.xl }]}>
        <View
          style={[
            styles.tile,
            {
              borderRadius: radius.md,
              backgroundColor: room.game?.tileColor ?? colors.well,
            },
          ]}
        >
          <AppText style={styles.emoji}>{room.game?.emoji ?? "🎲"}</AppText>
        </View>
        <AppText
          style={{ fontFamily: fontFamily.bold, fontSize: 20, marginTop: 12 }}
        >
          {room.game?.name ?? room.gameType}
        </AppText>
        {host ? (
          <AppText variant="caption" color="textSubtle" style={{ marginTop: 4 }}>
            {t("join.hostedBy", { name: host.username })}
          </AppText>
        ) : null}
        <View style={{ marginTop: spacing.md }}>
          <AvatarStack names={room.players.map((p) => p.username)} max={4} size={28} />
        </View>
        <AppText variant="tiny" color="textSubtle" style={{ marginTop: spacing.sm }}>
          {t("lobby.playersCount", {
            current: room.players.length,
            max: room.game?.maxPlayers ?? room.players.length,
          })}
        </AppText>
      </Card>

      {error ? (
        <AppText variant="caption" color="danger" align="center" style={{ marginTop: spacing.lg }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {isMember ? (
          <Button label={t("join.openTable")} size="lg" onPress={goToRoom} />
        ) : !joinable ? (
          <>
            <AppText variant="body" color="textSubtle" align="center">
              {t("errors.game_started")}
            </AppText>
            <Button
              label={t("game.backHome")}
              variant="secondary"
              onPress={() => router.dismissTo("/")}
            />
          </>
        ) : blockedByOtherTable ? (
          <>
            <AppText variant="body" color="textSubtle" align="center">
              {t("join.alreadyMessage", { game: otherTable.gameName })}
            </AppText>
            <Button
              label={t("join.leaveAndJoin")}
              variant="danger"
              loading={leaveOther.isPending || join.isPending}
              onPress={handleLeaveAndJoin}
            />
            <Button
              label={t("join.backToMine")}
              variant="secondary"
              onPress={() => router.replace(`/lobby/${otherTable.code}`)}
            />
          </>
        ) : (
          <Button
            label={t("join.cta")}
            size="lg"
            loading={join.isPending}
            onPress={handleJoin}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: "center", paddingVertical: 24 },
  tile: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 30, lineHeight: 38 },
});

// Deep-link landing: https://boardly.lol/join/CODE in the store app,
// boardly-dev://join/CODE in development (and the "Join with code"
// share links). Shows a table preview and handles every conflict case:
// already a member -> open it; already at another table -> the one-table
// sheet (go back to it, or leave it and join this one; useOneTable);
// full/started/not found -> clear error states.

import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api, assetUrl, ApiError } from "@/api/client";
import {
  AppText,
  AvatarStack,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  TableBackdrop,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useJoinRoom } from "@/features/home/hooks";
import { useOneTable } from "@/features/home/OneTable";
import { GameBadge } from "@/features/games/GameBadge";
import { useGameName } from "@/games/names";
import { fontFamily, useTheme } from "@/theme";

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);
  const gameName = useGameName();

  const roomCode = (code ?? "").toUpperCase();

  const preview = useQuery({
    queryKey: ["joinPreview", roomCode],
    queryFn: async () => (await api.getRoomByCode(roomCode)).room,
    enabled: roomCode.length > 0,
  });
  const join = useJoinRoom();
  const oneTable = useOneTable();

  const room = preview.data;
  const isMember = room?.players.some((p) => p.userId === user?.id) ?? false;
  const goToRoom = () => router.replace(`/lobby/${roomCode}`);

  const handleJoin = () => {
    setError(null);
    oneTable
      .run(
        async () => {
          await join.mutateAsync({ code: roomCode });
          goToRoom();
        },
        { except: roomCode }
      )
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? t([`errors.${err.code}`, err.message])
            : t("common.errorTitle")
        );
      });
  };

  if (preview.isPending) {
    return (
      <Screen backdrop={<TableBackdrop dim={0.45} />}>
        <Skeleton height={28} width="60%" />
        <Skeleton height={180} style={{ marginTop: 24 }} radius={20} />
      </Screen>
    );
  }

  if (preview.isError || !room || room.status === "closed") {
    return (
      <Screen backdrop={<TableBackdrop dim={0.45} />}>
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

  return (
    <Screen backdrop={<TableBackdrop dim={0.45} />}>
      <AppText variant="h2">{t("join.title")}</AppText>

      {/* Table preview */}
      <Card radius={radius.xl} style={[styles.preview, { marginTop: spacing.xl }]}>
        <GameBadge
          gameKey={room.gameType}
          emoji={room.game?.emoji}
          tileColor={room.game?.tileColor ?? colors.well}
          size={84}
          radius={radius.md}
        />
        <AppText
          style={{ fontFamily: fontFamily.bold, fontSize: 20, marginTop: 12 }}
        >
          {gameName(room.gameType, room.game?.name)}
        </AppText>
        {host ? (
          <AppText variant="caption" color="textSubtle" style={{ marginTop: 4 }}>
            {t("join.hostedBy", { name: host.username })}
          </AppText>
        ) : null}
        <View style={{ marginTop: spacing.md }}>
          <AvatarStack
            names={room.players.map((p) => p.username)}
            mascots={room.players.map((p) => p.mascot)}
            imageUris={room.players.map((p) => assetUrl(p.avatarUrl ?? null))}
            max={4}
            size={28}
          />
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

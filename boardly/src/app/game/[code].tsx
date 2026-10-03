import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BackIcon } from "@/components/icons";
import {
  AppText,
  Avatar,
  Button,
  Card,
  ErrorState,
  IconButton,
  Screen,
  Skeleton,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useMakeMove } from "@/features/game/hooks";
import { useRoom } from "@/features/lobby/hooks";
import { getGame } from "@/games/registry";
import { fontFamily, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();

  const roomCode = (code ?? "").toUpperCase();
  const roomQuery = useRoom(roomCode);
  const room = roomQuery.data;
  const session = room?.session ?? null;
  const makeMove = useMakeMove(roomCode, room);

  const gameDef = room ? getGame(room.gameType) : undefined;

  // Celebrate the result once when the game ends
  const sessionStatus = session?.status;
  const winnerId = session?.winnerUserId;
  useEffect(() => {
    if (sessionStatus === "finished") {
      if (winnerId && winnerId === user?.id) successHaptic();
      else tapHaptic();
    }
  }, [sessionStatus, winnerId, user?.id]);

  if (roomQuery.isPending) {
    return (
      <Screen>
        <Skeleton height={28} width="50%" />
        <Skeleton height={70} style={{ marginTop: 20 }} />
        <Skeleton height={300} style={{ marginTop: 20 }} radius={20} />
      </Screen>
    );
  }

  if (roomQuery.isError || !room || !gameDef || !session) {
    return (
      <Screen>
        <ErrorState
          title={t("common.errorTitle")}
          subtitle={t("common.errorSubtitle")}
          retryLabel={t("common.retry")}
          onRetry={() => roomQuery.refetch()}
        />
      </Screen>
    );
  }

  const state = session.state as never;
  const Board = gameDef.Board;
  const mySeat =
    room.players.find((p) => p.userId === user?.id)?.seat ?? -1;
  const currentSeat = gameDef.currentSeat(state);
  const currentPlayer = room.players.find((p) => p.seat === currentSeat);
  const inProgress = session.status === "in_progress";
  const isMyTurn = inProgress && mySeat === currentSeat;

  const winner =
    session.winnerUserId !== null
      ? room.players.find((p) => p.userId === session.winnerUserId)
      : null;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={() => router.back()}>
          <BackIcon size={20} color={colors.icon} />
        </IconButton>
        <View style={styles.headerTitle}>
          <AppText style={styles.headerEmoji}>{room.game?.emoji ?? "🎲"}</AppText>
          <AppText variant="title">{room.game?.name ?? room.gameType}</AppText>
        </View>
        <AppText variant="tiny" color="textSubtle">
          {roomCode}
        </AppText>
      </View>

      {/* Players */}
      <View style={[styles.players, { marginTop: spacing.xl }]}>
        {room.players.map((player) => {
          const active = inProgress && player.seat === currentSeat;
          return (
            <Card
              key={player.userId}
              style={[
                styles.playerChip,
                active && { borderColor: colors.primary, borderWidth: 1.5 },
              ]}
            >
              <Avatar name={player.username} size={34} />
              <View style={styles.playerText}>
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{ fontFamily: fontFamily.semiBold }}
                >
                  {player.userId === user?.id ? t("game.you") : player.username}
                </AppText>
                <AppText variant="tiny" color="textSubtle">
                  {String(
                    (state as { symbols?: string[] }).symbols?.[player.seat] ?? ""
                  )}
                </AppText>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Turn / result banner */}
      <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
        {inProgress ? (
          <AppText variant="title" color={isMyTurn ? "primary" : "text"}>
            {isMyTurn
              ? t("game.yourTurn")
              : t("game.turn", { name: currentPlayer?.username ?? "…" })}
          </AppText>
        ) : (
          <AppText style={styles.resultEmoji}>
            {winner ? "🏆" : "🤝"}
          </AppText>
        )}
        {!inProgress ? (
          <AppText variant="title" style={{ marginTop: spacing.xs }}>
            {winner
              ? winner.userId === user?.id
                ? t("game.youWin")
                : t("game.winner", { name: winner.username })
              : t("game.draw")}
          </AppText>
        ) : null}
      </View>

      {/* Board */}
      <View
        style={[
          styles.boardWrap,
          {
            marginTop: spacing.xl,
            borderRadius: radius.xl,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Board
          state={state}
          mySeat={mySeat}
          isMyTurn={isMyTurn && !makeMove.isPending}
          onMove={(move) => makeMove.mutate(move)}
        />
      </View>

      {!inProgress ? (
        <Button
          label={t("game.backHome")}
          style={{ marginTop: spacing.xxl }}
          onPress={() => router.replace("/")}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerEmoji: { fontSize: 20, lineHeight: 26 },
  players: { flexDirection: "row", gap: 12 },
  playerChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playerText: { flex: 1 },
  resultEmoji: { fontSize: 40, lineHeight: 48 },
  boardWrap: {
    borderWidth: 1,
    paddingVertical: 24,
    alignItems: "center",
  },
});

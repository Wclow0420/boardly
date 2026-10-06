import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import { BackIcon } from "@/components/icons";
import {
  AppText,
  Button,
  Card,
  ConfirmSheet,
  ErrorState,
  GorhomBottomSheetModal,
  IconButton,
  Screen,
  Skeleton,
} from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useSession } from "@/context/SessionContext";
import { useMakeMove, useRematch } from "@/features/game/hooks";
import {
  RulesButton,
  RulesSheet,
  useHasRules,
} from "@/features/game/RulesSheet";
import { useAlreadyInRoomRedirect } from "@/features/home/hooks";
import { useLeaveRoom, useRoom } from "@/features/lobby/hooks";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import { ThemeScope, fontFamily, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

/** Wraps the screen in the game's own theme when it has a skin, so the
 *  whole screen — including sheets and overlays — follows it. */
export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = (code ?? "").toUpperCase();
  // The one subscription to the room; the body below receives it
  const roomQuery = useRoom(roomCode);
  const skin = roomQuery.data
    ? getGame(roomQuery.data.gameType)?.skin
    : undefined;

  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <GameScreenBody roomCode={roomCode} roomQuery={roomQuery} />
    </ThemeScope>
  );
}

function GameScreenBody({
  roomCode,
  roomQuery,
}: {
  roomCode: string;
  roomQuery: ReturnType<typeof useRoom>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { user } = useSession();

  const room = roomQuery.data;
  const session = room?.session ?? null;
  const makeMove = useMakeMove(roomCode, room);
  const rematch = useRematch(room);
  const leaveRoom = useLeaveRoom(room?.id);
  const leaveSheetRef = useRef<GorhomBottomSheetModal>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const gameName = useGameName();
  const hasRules = useHasRules(room?.gameType);
  const redirectIfInRoom = useAlreadyInRoomRedirect();

  const gameDef = room ? getGame(room.gameType) : undefined;

  // Celebrate the result once when the game ends
  const sessionStatus = session?.status;
  const iWon =
    user !== null && (session?.winnerUserIds ?? []).includes(user.id);
  useEffect(() => {
    if (sessionStatus === "finished") {
      if (iWon) successHaptic();
      else tapHaptic();
    }
  }, [sessionStatus, iWon]);

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

  // The game screen replaces the lobby, so there is no screen to go
  // "back" to — the arrow always leads home. Walking out of a running
  // game ends it for the table, so that needs a confirmation first.
  const handleBack = () => {
    if (inProgress && mySeat >= 0) leaveSheetRef.current?.present();
    else router.dismissTo("/");
  };

  const leaveSheet = (
    <ConfirmSheet
      ref={leaveSheetRef}
      title={t("game.leaveTitle")}
      message={t("game.leaveMessage")}
      confirmLabel={t("game.leaveConfirm")}
      cancelLabel={t("game.keepPlaying")}
      destructive
      loading={leaveRoom.isPending}
      onConfirm={() =>
        leaveRoom.mutate(undefined, {
          onSuccess: () => {
            leaveSheetRef.current?.dismiss();
            router.dismissTo("/");
          },
        })
      }
    />
  );

  const header = (
    <View style={styles.header}>
      <IconButton accessibilityLabel="Back" onPress={handleBack}>
        <BackIcon size={20} color={colors.icon} />
      </IconButton>
      <View style={styles.headerTitle}>
        <AppText style={styles.headerEmoji}>{room.game?.emoji ?? "🎲"}</AppText>
        <AppText variant="title">
          {gameName(room.gameType, room.game?.name)}
        </AppText>
      </View>
      <View style={styles.headerRight}>
        <AppText variant="tiny" color="textSubtle">
          {roomCode}
        </AppText>
        {hasRules ? (
          <RulesButton color={colors.icon} onPress={() => setRulesOpen(true)} />
        ) : null}
      </View>
      {hasRules ? (
        <RulesSheet
          gameKey={room.gameType}
          gameName={gameName(room.gameType, room.game?.name)}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
    </View>
  );

  const skin = gameDef.skin;
  const needsMe =
    inProgress && (gameDef.needsMe?.(state, mySeat) ?? isMyTurn);

  // Skinned games: art backdrop, big title, "your move" badge
  const skinHeader = skin ? (
    <>
      <View style={styles.backdrop} pointerEvents="none">
        {skin.backdropImage ? (
          <Image
            source={skin.backdropImage}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
        <LinearGradient
          colors={
            skin.backdropImage
              ? ["rgba(0,0,0,0.6)", "rgba(0,0,0,0.45)", colors.surface]
              : [skin.backdrop[0], skin.backdrop[1]]
          }
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={handleBack}>
          <BackIcon size={22} color={colors.icon} />
        </IconButton>
        <View style={styles.skinTitle}>
          {skin.logo ? (
            <Image source={skin.logo} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={styles.headerTitle}>
              <AppText style={styles.skinEmoji}>
                {room.game?.emoji ?? "🎲"}
              </AppText>
              <AppText variant="h1" numberOfLines={1}>
                {gameName(room.gameType, room.game?.name)}
              </AppText>
            </View>
          )}
          {skin.taglineKey && !skin.logo ? (
            <AppText
              variant="tiny"
              color="textSubtle"
              style={styles.tagline}
              numberOfLines={1}
            >
              {t(skin.taglineKey)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          {hasRules ? (
            <RulesButton color={colors.icon} onPress={() => setRulesOpen(true)} />
          ) : null}
        </View>
      </View>
      {needsMe ? (
        <View
          style={[
            styles.movePill,
            {
              borderColor: colors.primary,
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <AppText variant="label" color="primary">
            {`⏳ ${t("game.yourMove")}`}
          </AppText>
        </View>
      ) : null}
      {hasRules ? (
        <RulesSheet
          gameKey={room.gameType}
          gameName={gameName(room.gameType, room.game?.name)}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
    </>
  ) : null;

  const board = (
    <Board
      state={state}
      mySeat={mySeat}
      isMyTurn={isMyTurn && !makeMove.isPending}
      players={room.players.map((p) => ({
        seat: p.seat,
        userId: p.userId,
        username: p.username,
        borderId: p.borderId,
      }))}
      busy={makeMove.isPending}
      finished={!inProgress}
      onMove={(move) => makeMove.mutate(move)}
    />
  );

  // After the game: play again at a fresh table with the same people,
  // or leave. Someone else may already have opened the rematch table.
  const backHome = !inProgress ? (
    <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
      {mySeat >= 0 ? (
        <>
          {room.rematchCode ? (
            <AppText variant="caption" color="textMuted" align="center">
              {t("game.rematchOpen")}
            </AppText>
          ) : null}
          <Button
            label={t(room.rematchCode ? "game.joinRematch" : "game.playAgain")}
            loading={rematch.isPending}
            onPress={() =>
              rematch.mutate(undefined, {
                onSuccess: (next) => router.replace(`/lobby/${next.code}`),
                onError: (err) => redirectIfInRoom(err),
              })
            }
          />
          {rematch.isError ? (
            <AppText variant="caption" color="danger" align="center">
              {rematch.error instanceof ApiError
                ? t([`errors.${rematch.error.code}`, rematch.error.message])
                : t("common.errorTitle")}
            </AppText>
          ) : null}
        </>
      ) : null}
      <Button
        label={t("game.backHome")}
        variant={mySeat >= 0 ? "secondary" : "primary"}
        onPress={() => router.dismissTo("/")}
      />
    </View>
  ) : null;

  // Games that draw their own table (players, status, result)
  if (gameDef.layout === "custom") {
    return (
      <Screen>
        {skinHeader ?? header}
        <View style={{ marginTop: spacing.xl }}>{board}</View>
        {makeMove.isError ? (
          <AppText
            variant="caption"
            color="danger"
            align="center"
            style={{ marginTop: spacing.md }}
          >
            {makeMove.error instanceof ApiError
              ? makeMove.error.message
              : t("common.errorTitle")}
          </AppText>
        ) : null}
        {backHome}
        {leaveSheet}
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

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
              <AvatarBorder
                name={player.username}
                borderId={player.borderId}
                size={34}
              />
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
        {board}
      </View>

      {backHome}
      {leaveSheet}
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  skinTitle: { flex: 1, alignItems: "center" },
  skinEmoji: { fontSize: 26, lineHeight: 34 },
  logo: { width: 230, height: 108 },
  tagline: { letterSpacing: 2.5, marginTop: 2 },
  movePill: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
  },
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

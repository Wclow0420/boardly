// A table's lobby: the game's own floor of the lift (features/lobby/floor).
// This screen holds the server's side (the room's query and socket, the
// moves) and the sheets; FloorLobby draws the floor. When the table
// starts, the lamps go down and everyone moves on to the game.

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RoomPlayerInfo } from "@/api/client";
import { BackIcon } from "@/components/icons";
import {
  ConfirmSheet,
  EmptyState,
  ErrorState,
  GorhomBottomSheetModal,
  IconButton,
  Screen,
  TableBackdrop,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { RulesSheet, useHasRules } from "@/features/game/RulesSheet";
import { AddBotsSheet } from "@/features/lobby/AddBots";
import { FloorLobby } from "@/features/lobby/floor/FloorLobby";
import { useLiftFloor } from "@/features/lobby/floor/useLiftFloor";
import {
  useLeaveRoom,
  useRemoveBot,
  useRoom,
  useSetReady,
  useSetRoomOptions,
  useStartGame,
} from "@/features/lobby/hooks";
import { InviteFriendsSheet } from "@/features/lobby/InviteFriendsSheet";
import { usePlayerCard } from "@/features/players/PlayerCardProvider";
import { useGameName } from "@/games/names";
import { useTheme } from "@/theme";
import { successHaptic } from "@/utils/haptics";
import { inviteLink, shareOrCopy } from "@/utils/share";

/** How long the lamps take to go down before the game opens. */
const LAMPS_DOWN_MS = 600;

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useSession();
  const [linkCopied, setLinkCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const gameName = useGameName();
  const playerCard = usePlayerCard();
  const leaveSheetRef = useRef<GorhomBottomSheetModal>(null);
  const inviteSheetRef = useRef<GorhomBottomSheetModal>(null);
  const botsSheetRef = useRef<GorhomBottomSheetModal>(null);

  const roomCode = (code ?? "").toUpperCase();
  const roomQuery = useRoom(roomCode);
  const room = roomQuery.data;
  const startGame = useStartGame(room?.id);
  const setReady = useSetReady(room?.id, roomCode);
  const setOptions = useSetRoomOptions(room?.id, roomCode);
  const leaveRoom = useLeaveRoom(room?.id);
  const removeBot = useRemoveBot(room?.id);
  const { floor, floors } = useLiftFloor(room?.gameType);

  const hasRules = useHasRules(room?.gameType);
  const isHost = user?.id === room?.hostId;
  const isMember = room?.players.some((p) => p.userId === user?.id) ?? false;
  // the host can fill seats with bots where the backend offers them
  const canAddBots = isHost && room?.botsAvailable === true && room.status === "waiting";
  const minPlayers = room?.game?.minPlayers ?? 2;
  const maxPlayers = room?.game?.maxPlayers ?? 2;

  // The moment the game starts (the host's hold or the socket's word),
  // everyone in the lobby moves on to the game: the lamps go down first.
  // Opening the lobby of a table already playing goes straight on.
  const status = room?.status;
  const [sawWaiting, setSawWaiting] = useState(false);
  if (status === "waiting" && !sawWaiting) setSawWaiting(true);
  const starting = status === "playing" && isMember && sawWaiting;
  useEffect(() => {
    if (status !== "playing" || !isMember) return;
    if (!sawWaiting) {
      router.replace(`/game/${roomCode}`);
      return;
    }
    successHaptic();
    const go = setTimeout(() => router.replace(`/game/${roomCode}`), LAMPS_DOWN_MS);
    return () => clearTimeout(go);
  }, [status, isMember, sawWaiting, roomCode, router]);

  const name = room ? gameName(room.gameType, room.game?.name) : "";
  const link = useMemo(() => inviteLink(roomCode), [roomCode]);

  const shareInvite = useCallback(async () => {
    if (!room) return;
    const outcome = await shareOrCopy(
      t("lobby.shareMessage", { game: name, code: room.code, link }),
      link,
    ).catch(() => "dismissed" as const);
    // No share sheet (desktop browsers): the link went to the clipboard
    if (outcome === "copied") {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [room, name, link, t]);

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

  const showPlayer = (player: RoomPlayerInfo) =>
    playerCard.show({
      id: player.userId,
      name: player.username,
      borderId: player.borderId,
      avatarUrl: player.avatarUrl,
      mascot: player.mascot,
    });

  const isClosed = room?.status === "closed" || room?.status === "finished";

  return (
    <View style={styles.screen}>
      {room && !isClosed ? (
        <FloorLobby
          room={room}
          meId={user?.id}
          floor={floor}
          floors={floors}
          gameName={name}
          link={link}
          onBack={handleBack}
          onRules={hasRules ? () => setRulesOpen(true) : undefined}
          onReady={(ready) => setReady.mutate(ready)}
          readyBusy={setReady.isPending}
          onStart={() => startGame.mutate()}
          startBusy={startGame.isPending}
          onRemoveBot={(id) => removeBot.mutate(id)}
          onSetOption={(option, choice) => setOptions.mutate({ [option]: choice })}
          optionsBusy={setOptions.isPending}
          onInvite={() => inviteSheetRef.current?.present()}
          onBots={canAddBots ? () => botsSheetRef.current?.present() : undefined}
          onShare={shareInvite}
          shared={linkCopied}
          onPlayer={showPlayer}
          starting={starting}
        />
      ) : (
        <LobbyMessage onBack={handleBack}>
          {roomQuery.isPending ? (
            <ActivityIndicator size="large" color="#F7C948" />
          ) : roomQuery.isError ? (
            <ErrorState
              title={t("common.errorTitle")}
              subtitle={t("common.errorSubtitle")}
              retryLabel={t("common.retry")}
              onRetry={() => roomQuery.refetch()}
            />
          ) : (
            <EmptyState
              emoji="🚪"
              title={t("lobby.closedTitle")}
              subtitle={t("lobby.closedSubtitle")}
              actionLabel={t("game.backHome")}
              onAction={() => router.dismissTo("/")}
            />
          )}
        </LobbyMessage>
      )}

      {room && hasRules ? (
        <RulesSheet
          gameKey={room.gameType}
          gameName={name}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
      <InviteFriendsSheet ref={inviteSheetRef} onShareLink={shareInvite} />
      {room && canAddBots ? (
        <AddBotsSheet
          ref={botsSheetRef}
          room={room}
          minPlayers={minPlayers}
          maxPlayers={maxPlayers}
        />
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
    </View>
  );
}

/** While the table loads, can't be reached or has closed: the app's own
 *  table with a word in the middle and the way back. */
function LobbyMessage({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Screen scroll={false} padded={false} inset={false} backdrop={<TableBackdrop dim={0.3} />}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <IconButton accessibilityLabel="Back" onPress={onBack}>
          <BackIcon size={20} color={colors.icon} />
        </IconButton>
      </View>
      <View style={styles.message}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#140A04" },
  nav: { paddingHorizontal: 14 },
  message: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 80 },
});

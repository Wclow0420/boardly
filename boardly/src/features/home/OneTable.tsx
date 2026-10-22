// One table at a time. Whenever a player goes to start or join another
// table (Quick Play, stepping out of the lift, Practice, a code, an
// invite, Play Again) while they still sit at one, they are asked:
// "You're at 3F · Hustle (4/6 · waiting). Go back to that table, or leave
// it?" Go back opens that table (its lobby, or the game under way); Leave
// leaves it (a game under way ends, as the server does it) and carries on
// with what they were doing.
//
// Usage: const oneTable = useOneTable();
//        const outcome = await oneTable.run(() => openMyTable());
// run() looks at my tables first (/rooms/mine) and asks before calling
// the action; if the server still answers already_in_room, it asks then
// and tries again after a Leave. It resolves "done" once the action ran,
// "back" when the player went back to their table, "cancelled" when they
// closed the sheet. Any other error from the action is thrown.

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api, ApiError, type RoomInfo } from "@/api/client";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useLiftFloor } from "@/features/lobby/floor/useLiftFloor";
import { useGameName } from "@/games/names";
import { useTheme } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { decide, type Choice, type OneTableOutcome } from "./oneTableFlow";

export type { OneTableOutcome } from "./oneTableFlow";

export interface OneTableOptions {
  /** The table being joined: being at it already is no conflict. */
  except?: string | null;
  /** Called just before the sheet opens (e.g. to put away a sheet the
   *  action was started from). */
  onConflict?: () => void;
}

export interface OneTableApi {
  run: (
    action: () => Promise<unknown>,
    options?: OneTableOptions,
  ) => Promise<OneTableOutcome>;
}

// Without the provider (tests, previews) the action just runs
const PASS_THROUGH: OneTableApi = {
  run: async (action) => {
    await action();
    return "done";
  },
};

const OneTableContext = createContext<OneTableApi>(PASS_THROUGH);

export function useOneTable(): OneTableApi {
  return useContext(OneTableContext);
}

const ACTIVE = new Set(["waiting", "playing"]);
const GONE = new Set(["not_in_room", "room_not_found"]);

/** Where a table is: its lobby while it waits, the game once it plays. */
export function tablePath(room: Pick<RoomInfo, "code" | "status">): string {
  return room.status === "playing" ? `/game/${room.code}` : `/lobby/${room.code}`;
}

export function OneTableProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [table, setTable] = useState<RoomInfo | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);
  // the run waiting on the player's choice
  const pending = useRef<((choice: Choice) => void) | null>(null);

  const answer = useCallback((choice: Choice) => {
    const resolve = pending.current;
    pending.current = null;
    resolve?.(choice);
  }, []);

  const ask = useCallback(
    (room: RoomInfo) =>
      new Promise<Choice>((resolve) => {
        // a run still asking gives way to the newer one
        pending.current?.("cancel");
        pending.current = resolve;
        setTable(room);
        setFailed(false);
        setLeaving(false);
        heavyHaptic();
        sheetRef.current?.present();
      }),
    [],
  );

  const run = useCallback<OneTableApi["run"]>(
    (action, options = {}) =>
      decide(action, {
        other: async () => {
          const { rooms } = await api.myRooms().catch(() => ({ rooms: [] as RoomInfo[] }));
          return rooms.find((r) => ACTIVE.has(r.status) && r.code !== options.except) ?? null;
        },
        ask: (room) => {
          options.onConflict?.();
          return ask(room);
        },
      }),
    [ask],
  );

  const goBack = useCallback(() => {
    if (!table) return;
    tapHaptic();
    answer("back");
    sheetRef.current?.dismiss();
    router.push(tablePath(table) as never);
  }, [table, answer, router]);

  const leave = useCallback(async () => {
    if (!table || leaving) return;
    tapHaptic();
    setLeaving(true);
    setFailed(false);
    try {
      // gone already (the table closed meanwhile) counts as left
      await api.leaveRoom(table.id).catch((err: unknown) => {
        if (!(err instanceof ApiError && GONE.has(err.code))) throw err;
      });
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
      answer("leave");
      sheetRef.current?.dismiss();
    } catch {
      setFailed(true);
    } finally {
      setLeaving(false);
    }
  }, [table, leaving, queryClient, answer]);

  const value = useMemo(() => ({ run }), [run]);

  return (
    <OneTableContext.Provider value={value}>
      {children}
      <BottomSheetModal
        ref={sheetRef}
        title={t("oneTable.title")}
        onDismiss={() => answer("cancel")}
      >
        {table ? (
          <OneTableBody
            table={table}
            leaving={leaving}
            failed={failed}
            onBack={goBack}
            onLeave={leave}
          />
        ) : null}
      </BottomSheetModal>
    </OneTableContext.Provider>
  );
}

/** What the sheet says: where I am, and the two ways on. Mounted only
 *  while the sheet is asked for (it reads the lift's building). */
function OneTableBody({
  table,
  leaving,
  failed,
  onBack,
  onLeave,
}: {
  table: RoomInfo;
  leaving: boolean;
  failed: boolean;
  onBack: () => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { user } = useSession();
  const gameName = useGameName();
  const { floor } = useLiftFloor(table.gameType);
  const playing = table.status === "playing";
  const hosting = table.hostId === user?.id && table.players.length > 1;

  const where = t("oneTable.where", {
    sign: t("lobby.floor.sign", { floor, game: gameName(table.gameType, table.game?.name) }),
    count: table.players.length,
    max: table.game?.maxPlayers ?? table.players.length,
    status: t(playing ? "oneTable.playing" : "oneTable.waiting"),
  });

  return (
    <View style={[styles.body, { gap: spacing.md }]}>
      <AppText variant="body">{where}</AppText>
      <AppText variant="body" color="textMuted">
        {t("oneTable.question")}
      </AppText>
      {playing ? (
        <AppText variant="caption" color="danger">
          {t("oneTable.playingWarning")}
        </AppText>
      ) : hosting ? (
        <AppText variant="caption" color="textMuted">
          {t("oneTable.hostWarning")}
        </AppText>
      ) : null}
      {failed ? (
        <AppText variant="caption" color="danger">
          {t("common.errorTitle")}
        </AppText>
      ) : null}
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button label={t("oneTable.back")} onPress={onBack} disabled={leaving} />
        <Button
          label={t(playing ? "oneTable.leaveGame" : "oneTable.leave")}
          variant="danger"
          loading={leaving}
          onPress={onLeave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
});

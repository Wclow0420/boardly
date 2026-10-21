// The Games tab: a brass lift with one floor per game (features/games/
// lift). Ride to a game, step out to open a table of it (the lobby), or
// read its rules. The games I've played most (my stats) make the lift's
// first bank.
//
// Practice mode: opened as `/(tabs)/games?practice=1` (the Me page's
// Practice button), the lift's sign reads "Practice" and stepping out
// opens a table already filled with bots, ready to start. Tapping the
// Games tab again leaves practice mode.

import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import type { GameCatalogEntry } from "@/data/types";
import { RulesSheet } from "@/features/game/RulesSheet";
import { useGamesQuery } from "@/features/games/hooks";
import { usePlayed } from "@/features/games/lift/building";
import { LiftPage } from "@/features/games/lift/LiftPage";
import { useCreateRoom } from "@/features/home/hooks";
import { useOneTable } from "@/features/home/OneTable";
import { useGameName } from "@/games/names";

const NONE: GameCatalogEntry[] = [];

export default function GamesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { practice: practiceParam } = useLocalSearchParams<{ practice?: string }>();
  const practice = practiceParam === "1";
  const games = useGamesQuery();
  const createRoom = useCreateRoom();
  const oneTable = useOneTable();
  const gameName = useGameName();
  const [rulesFor, setRulesFor] = useState<GameCatalogEntry | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { isPending, mutateAsync } = createRoom;
  const played = usePlayed();

  // Coming back to the tab through its button: the lift as ever
  useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        navigation.setParams({ practice: undefined } as never);
      }),
    [navigation],
  );

  const openTable = useCallback(
    async (game: GameCatalogEntry) => {
      if (isPending) throw new Error("busy");
      let code: string | null = null;
      const outcome = await oneTable.run(async () => {
        const { room } = await mutateAsync(
          practice ? { gameType: game.id, practice: true } : game.id,
        );
        code = room.code;
      });
      // gone back to the table I was at, or thought better of it: the
      // gate closes again behind me
      if (outcome !== "done" || code === null) throw new Error(outcome);
      router.push(`/lobby/${code}`);
    },
    [isPending, mutateAsync, oneTable, practice, router],
  );

  return (
    <>
      <LiftPage
        games={games.data ?? NONE}
        loading={games.isPending}
        error={games.isError}
        onRetry={() => games.refetch()}
        busy={isPending}
        played={played}
        practice={practice}
        onOpenTable={openTable}
        onRules={(game) => {
          setRulesFor(game);
          setRulesOpen(true);
        }}
      />
      {/* kept after closing, so the sheet slides away with its pages */}
      {rulesFor ? (
        <RulesSheet
          gameKey={rulesFor.id}
          gameName={gameName(rulesFor.id, rulesFor.name)}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
    </>
  );
}

// The Games tab: a brass lift with one floor per game (features/games/
// lift). Ride to a game, step out to open a table of it (the lobby), or
// read its rules.

import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import type { GameCatalogEntry } from "@/data/types";
import { RulesSheet } from "@/features/game/RulesSheet";
import { useGamesQuery } from "@/features/games/hooks";
import { LiftPage } from "@/features/games/lift/LiftPage";
import { useAlreadyInRoomRedirect, useCreateRoom } from "@/features/home/hooks";
import { useGameName } from "@/games/names";

const NONE: GameCatalogEntry[] = [];

export default function GamesScreen() {
  const router = useRouter();
  const games = useGamesQuery();
  const createRoom = useCreateRoom();
  const redirectIfInRoom = useAlreadyInRoomRedirect();
  const gameName = useGameName();
  const [rulesFor, setRulesFor] = useState<GameCatalogEntry | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { isPending, mutate } = createRoom;

  const openTable = useCallback(
    (game: GameCatalogEntry) =>
      new Promise<void>((resolve, reject) => {
        if (isPending) return reject(new Error("busy"));
        mutate(game.id, {
          onSuccess: ({ room }) => {
            resolve();
            router.push(`/lobby/${room.code}`);
          },
          onError: (err) => {
            reject(err);
            redirectIfInRoom(err);
          },
        });
      }),
    [isPending, mutate, router, redirectIfInRoom],
  );

  return (
    <>
      <LiftPage
        games={games.data ?? NONE}
        loading={games.isPending}
        error={games.isError}
        onRetry={() => games.refetch()}
        busy={isPending}
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

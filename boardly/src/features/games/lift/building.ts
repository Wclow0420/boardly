// The lift's building for the signed-in player: the catalogue from the
// server, each game's kind from its GameDefinition (or the server's
// category for a game this build doesn't know), and the games I've played
// most from my stats, made into banks (banks.ts). Shared by the Games
// tab and anything that names a game's floor (the lobby's landing sign:
// floorOfGame).

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useSession } from "@/context/SessionContext";
import type { GameCatalogEntry } from "@/data/types";
import { useGamesQuery } from "@/features/games/hooks";
import { statsQuery } from "@/features/profile/warm";
import { getGame } from "@/games/registry";
import type { GameType } from "@/games/types";
import { buildBanks, typeFromServer, type Building } from "./banks";

/** A game's kind: its own, else from the server's category. */
export const typeOfGame = (g: GameCatalogEntry): GameType => getGame(g.id)?.category ?? typeFromServer(g.category);
export const isNewGame = (g: GameCatalogEntry) => getGame(g.id)?.isNew ?? false;

const NONE: GameCatalogEntry[] = [];

/** How many times I've played each game, by id (my stats). */
export function usePlayed(): Record<string, number> {
  const userId = useSession().user?.id;
  const records = useQuery({ ...statsQuery(userId), staleTime: 30_000 }).data?.games;
  return useMemo(() => Object.fromEntries((records ?? []).map((r) => [r.gameType, r.played])), [records]);
}

/** The building as the Games tab shows it to me. */
export function useLiftBuilding(): Building {
  const games = useGamesQuery().data ?? NONE;
  const played = usePlayed();
  return useMemo(() => buildBanks(games, { typeOf: typeOfGame, played, isNew: isNewGame }), [games, played]);
}

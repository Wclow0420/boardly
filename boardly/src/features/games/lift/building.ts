// The lift's building for the signed-in player: the catalogue from the
// server, each game's kind from its GameDefinition (or the server's
// category for a game this build doesn't know), made into banks by kind
// (banks.ts). Shared by the Games tab and anything that names a game's
// floor (the lobby's landing sign: floorOfGame).

import { useMemo } from "react";

import type { GameCatalogEntry } from "@/data/types";
import { useGamesQuery } from "@/features/games/hooks";
import { getGame } from "@/games/registry";
import type { GameType } from "@/games/types";
import { buildBanks, typeFromServer, type Building } from "./banks";

/** A game's kind: its own, else from the server's category. */
export const typeOfGame = (g: GameCatalogEntry): GameType => getGame(g.id)?.category ?? typeFromServer(g.category);
export const isNewGame = (g: GameCatalogEntry) => getGame(g.id)?.isNew ?? false;

const NONE: GameCatalogEntry[] = [];

/** The building as the Games tab shows it to me. */
export function useLiftBuilding(): Building {
  const games = useGamesQuery().data ?? NONE;
  return useMemo(() => buildBanks(games, { typeOf: typeOfGame, isNew: isNewGame }), [games]);
}

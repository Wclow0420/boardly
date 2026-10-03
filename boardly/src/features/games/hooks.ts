// Data hooks for the Games catalogue — now backed by the real API.

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { api, type GameInfo } from "@/api/client";
import type { GameCatalogEntry, GameCategory } from "@/data/types";

export type GameFilter = "all" | GameCategory;

export const GAME_FILTERS: GameFilter[] = [
  "all",
  "strategy",
  "party",
  "classic",
  "custom",
];

const KNOWN_TAGS = ["classic", "card", "strategy", "party"] as const;
const KNOWN_CATEGORIES = ["strategy", "party", "classic", "custom"] as const;

function toCatalogEntry(game: GameInfo): GameCatalogEntry {
  return {
    id: game.key,
    name: game.name,
    emoji: game.emoji,
    tileColor: game.tileColor,
    category: (KNOWN_CATEGORIES as readonly string[]).includes(game.category)
      ? (game.category as GameCategory)
      : "classic",
    tagKey: (KNOWN_TAGS as readonly string[]).includes(game.tag)
      ? (game.tag as GameCatalogEntry["tagKey"])
      : "classic",
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
  };
}

/** Raw catalogue query — shared by the Games screen and Quick Play. */
export function useGamesQuery() {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { games } = await api.listGames();
      return games.map(toCatalogEntry);
    },
  });
}

export function useGameCatalog() {
  const [filter, setFilter] = useState<GameFilter>("all");
  const query = useGamesQuery();

  const games = useMemo(() => {
    const all = query.data ?? [];
    return filter === "all" ? all : all.filter((g) => g.category === filter);
  }, [query.data, filter]);

  return {
    games,
    filter,
    setFilter,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

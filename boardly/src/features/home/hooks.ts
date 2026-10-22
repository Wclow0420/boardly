// Data hooks for the Home screen — tables and friends come from the
// real API.
// Identity comes from the session's Bearer token — no usernames in
// request bodies.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, type RoomInfo } from "@/api/client";
import { useSession } from "@/context/SessionContext";
import type { Friend, TableSummary } from "@/data/types";
import { useFriendsQuery } from "@/features/friends/hooks";

function toTableSummary(room: RoomInfo): TableSummary {
  return {
    id: room.id,
    code: room.code,
    gameKey: room.gameType,
    gameName: room.game?.name ?? room.gameType,
    coverColor: room.game?.tileColor ?? "#FFF2D6",
    players: room.players.map((p) => p.username),
    maxPlayers: room.game?.maxPlayers ?? room.players.length,
    status: room.status === "playing" ? "inProgress" : room.status,
  };
}

export function useMyTables() {
  const { user, status } = useSession();

  const query = useQuery({
    queryKey: ["myTables", user?.id],
    queryFn: async () => {
      const { rooms } = await api.myRooms();
      return rooms.map(toTableSummary);
    },
    enabled: status === "signedIn",
  });

  return {
    tables: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Open a table: a game's key, or `{ gameType, practice: true }` for a
 *  practice table (already filled with bots). Run it through
 *  useOneTable().run so a player at another table is asked first. */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: string | { gameType: string; practice?: boolean }) =>
      typeof input === "string"
        ? api.createRoom(input)
        : api.createRoom(input.gameType, { practice: input.practice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code }: { code: string }) => api.joinRoom(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
    },
  });
}

export function useOnlineFriends(): Friend[] {
  const { data } = useFriendsQuery();
  return useMemo(
    () => (data?.friends ?? []).filter((f) => f.presence !== "offline"),
    [data]
  );
}

// Data hooks for the Home screen — tables come from the real API;
// friends stay mocked until the friends feature has backend support.
// Identity comes from the session's Bearer token — no usernames in
// request bodies.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { api, ApiError, type RoomInfo } from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { MOCK_FRIENDS } from "@/data/mock";
import type { Friend, TableSummary } from "@/data/types";

function toTableSummary(room: RoomInfo): TableSummary {
  return {
    id: room.id,
    code: room.code,
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

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameType: string) => api.createRoom(gameType),
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

/** One table at a time: when the backend answers already_in_room,
 *  send the user to their active table instead of showing an error. */
export function useAlreadyInRoomRedirect() {
  const router = useRouter();
  return useCallback(
    async (err: unknown): Promise<boolean> => {
      if (err instanceof ApiError && err.code === "already_in_room") {
        const { rooms } = await api.myRooms().catch(() => ({ rooms: [] }));
        if (rooms[0]) {
          router.push(`/lobby/${rooms[0].code}`);
          return true;
        }
      }
      return false;
    },
    [router]
  );
}

export function useOnlineFriends(): Friend[] {
  return useMemo(
    () => MOCK_FRIENDS.filter((f) => f.presence !== "offline"),
    []
  );
}

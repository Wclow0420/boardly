// Gameplay data: sending moves. The mover is the authenticated user —
// the backend derives it from the Bearer token. Room/session state
// comes from features/lobby/hooks.ts useRoom(code), kept live by the
// socket.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type RoomInfo } from "@/api/client";

/** Play again with the same people: opens the rematch table, or joins
 *  it if another player already did. Resolves to the new room. */
export function useRematch(room: RoomInfo | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!room) throw new Error("Room not loaded");
      return (await api.rematch(room.id)).room;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["room", next.code], next);
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
    },
  });
}

export function useMakeMove(code: string, room: RoomInfo | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (move: Record<string, unknown>) => {
      if (!room) throw new Error("Room not loaded");
      return api.makeMove(room.id, move);
    },
    onSuccess: ({ session }) => {
      // Update our own cache immediately; the other players get the
      // same session via the game_updated socket broadcast.
      // (the socket may already have brought a newer one)
      queryClient.setQueryData(["room", code], (prev: RoomInfo | undefined) =>
        !prev
          ? prev
          : prev.session?.id === session.id && (prev.session.version ?? -1) > (session.version ?? 0)
            ? prev
            : { ...prev, session }
      );
    },
  });
}

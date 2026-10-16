// Lobby data: room-by-code query kept live by Socket.IO — the backend
// broadcasts room_updated / game_started / game_updated to the room
// channel, and each event invalidates the query.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api, type GameSessionInfo, type RoomInfo } from "@/api/client";
import { getSocket, joinRoomChannel, leaveRoomChannel } from "@/api/socket";
import { useSession } from "@/context/SessionContext";

export function useRoom(code: string) {
  const queryClient = useQueryClient();
  const me = useSession().user?.id;

  const query = useQuery({
    queryKey: ["room", code],
    queryFn: async () => {
      const { room } = await api.getRoomByCode(code);
      return room;
    },
    enabled: code.length > 0,
    // Belt-and-braces alongside the socket: phone connections drop when
    // the app backgrounds, so poll while the table is still active.
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === "waiting" || status === "playing") return 4000;
      // After the game: watch for someone opening a rematch table
      return status === "finished" ? 6000 : false;
    },
  });

  const roomId = query.data?.id;

  useEffect(() => {
    if (roomId === undefined) return;

    const socket = getSocket();
    joinRoomChannel(roomId);
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["room", code] });
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
    };
    // A move: players at the table are sent their own view of the new
    // state with it, so it goes straight in, no refetch. The table's own
    // channel says only that it changed, for anyone watching.
    const moved = (event?: { session?: GameSessionInfo; seated?: boolean }) => {
      if (event?.session) {
        const next = event.session;
        queryClient.setQueryData(["room", code], (prev: RoomInfo | undefined) =>
          prev && prev.session?.id === next.id && (prev.session.version ?? -1) >= (next.version ?? 0)
            ? prev
            : prev
              ? { ...prev, session: next }
              : prev,
        );
        return;
      }
      const room = queryClient.getQueryData<RoomInfo>(["room", code]);
      if (event?.seated && room?.players.some((p) => p.userId === me)) return;
      queryClient.invalidateQueries({ queryKey: ["room", code] });
    };
    socket.on("room_updated", refresh);
    socket.on("game_started", refresh);
    socket.on("game_updated", moved);
    socket.on("room_closed", refresh);

    return () => {
      socket.off("room_updated", refresh);
      socket.off("game_started", refresh);
      socket.off("game_updated", moved);
      socket.off("room_closed", refresh);
      leaveRoomChannel(roomId);
    };
  }, [roomId, code, queryClient, me]);

  return query;
}

export function useSetReady(roomId: string | undefined, code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ready: boolean) => {
      if (roomId === undefined) throw new Error("Room not loaded");
      return api.setReady(roomId, ready);
    },
    onSuccess: ({ room }) => {
      queryClient.setQueryData(["room", code], room);
    },
  });
}

/** The host changes the game's settings while the table waits. */
export function useSetRoomOptions(roomId: string | undefined, code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: Record<string, string>) => {
      if (roomId === undefined) throw new Error("Room not loaded");
      return api.setRoomOptions(roomId, options);
    },
    onSuccess: ({ room }) => {
      queryClient.setQueryData(["room", code], room);
    },
  });
}

export function useLeaveRoom(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (roomId === undefined) throw new Error("Room not loaded");
      return api.leaveRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTables"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });
}

/** The host fills seats with bot players. */
export function useAddBots(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number) => api.addBots(roomId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });
}

/** The host takes a bot off the table before the game starts. */
export function useRemoveBot(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      if (roomId === undefined) throw new Error("Room not loaded");
      return api.removeBot(roomId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });
}

export function useStartGame(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (roomId === undefined) throw new Error("Room not loaded");
      return api.startGame(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });
}

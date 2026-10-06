// Lobby data: room-by-code query kept live by Socket.IO — the backend
// broadcasts room_updated / game_started / game_updated to the room
// channel, and each event invalidates the query.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "@/api/client";
import { getSocket, joinRoomChannel, leaveRoomChannel } from "@/api/socket";

export function useRoom(code: string) {
  const queryClient = useQueryClient();

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
    socket.on("room_updated", refresh);
    socket.on("game_started", refresh);
    socket.on("game_updated", refresh);
    socket.on("room_closed", refresh);

    return () => {
      socket.off("room_updated", refresh);
      socket.off("game_started", refresh);
      socket.off("game_updated", refresh);
      socket.off("room_closed", refresh);
      leaveRoomChannel(roomId);
    };
  }, [roomId, code, queryClient]);

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

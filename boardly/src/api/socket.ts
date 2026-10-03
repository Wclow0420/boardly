// Socket.IO client — real-time room/game updates from the backend.
// The backend emits: room_updated, game_started, game_updated.

import { io, type Socket } from "socket.io-client";

import { API_URL } from "./client";

let socket: Socket | null = null;

// Channels this client wants to be in. Server-side socket rooms are
// lost on every disconnect (common on phones when backgrounding), so
// we re-join them all whenever the socket (re)connects.
const joinedRooms = new Set<string>();

export function getSocket(): Socket {
  if (!socket) {
    // Let the transport negotiate (polling -> websocket upgrade) so it
    // works against both the dev server and production eventlet.
    socket = io(API_URL);
    socket.on("connect", () => {
      joinedRooms.forEach((roomId) => {
        socket?.emit("join_room", { roomId });
      });
    });
  }
  return socket;
}

export function joinRoomChannel(roomId: string) {
  joinedRooms.add(roomId);
  getSocket().emit("join_room", { roomId });
}

export function leaveRoomChannel(roomId: string) {
  joinedRooms.delete(roomId);
  getSocket().emit("leave_room", { roomId });
}

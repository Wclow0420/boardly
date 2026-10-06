// Socket.IO client — real-time room/game updates from the backend.
// The backend emits: room_updated, game_started, game_updated to room
// channels, and friends_updated / table_invite to the signed-in user.

import { io, type Socket } from "socket.io-client";

import { api, API_URL, getAccessToken } from "./client";

let socket: Socket | null = null;

// Channels this client wants to be in. Server-side socket rooms are
// lost on every disconnect (common on phones when backgrounding), so
// we re-join them all whenever the socket (re)connects and identifies.
const joinedRooms = new Set<string>();

// Whether a user is signed in — the socket then identifies itself on
// every (re)connect, which is what marks the user online for friends.
let signedIn = false;

function authenticate(retry = true) {
  const token = getAccessToken();
  if (!socket || !signedIn || !token) return;
  socket.emit("authenticate", { token }, async (ack?: { ok: boolean }) => {
    if (ack?.ok) {
      // Room channels are members-only, so (re)join once identified
      joinedRooms.forEach((roomId) => {
        socket?.emit("join_room", { roomId });
      });
      return;
    }
    if (!retry) return;
    // Access token expired: any API call refreshes it, then try once more.
    try {
      await api.auth.me();
      authenticate(false);
    } catch {
      // Signed out or offline — the next reconnect tries again.
    }
  });
}

export function getSocket(): Socket {
  if (!socket) {
    // Let the transport negotiate (polling -> websocket upgrade) so it
    // works against both the dev server and production eventlet.
    socket = io(API_URL);
    socket.on("connect", () => authenticate());
  }
  return socket;
}

/** Call on sign-in: connect and go online. */
export function connectUserSocket() {
  signedIn = true;
  const current = getSocket();
  if (current.connected) authenticate();
  else current.connect();
}

/** Call on sign-out: dropping the connection takes the user offline. */
export function disconnectUserSocket() {
  signedIn = false;
  socket?.disconnect();
}

export function joinRoomChannel(roomId: string) {
  joinedRooms.add(roomId);
  getSocket().emit("join_room", { roomId });
}

export function leaveRoomChannel(roomId: string) {
  joinedRooms.delete(roomId);
  getSocket().emit("leave_room", { roomId });
}

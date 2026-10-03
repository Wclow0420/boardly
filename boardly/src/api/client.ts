// REST client for the Flask backend (/api/v1).
// Identity comes from the Bearer access token; on 401 the client
// refreshes once (rotating both tokens) and retries the request.
// EXPO_PUBLIC_API_URL is set per build profile in eas.json;
// defaults to the local dev backend.

import { tokenStorage } from "./tokenStorage";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5005";

const API_BASE = `${API_URL}/api/v1`;

/** Error envelope: {"error": {"code": "...", "message": "..."}} */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

// In-memory access token (mirrors tokenStorage; avoids an async read
// per request). SessionProvider seeds it on bootstrap/login.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Called when a request stays unauthorized after a refresh attempt —
// SessionProvider registers a handler that signs the user out.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...options,
    headers,
  });
  const body = await res.json();
  if (!res.ok) {
    const err = body?.error ?? {};
    throw new ApiError(
      err.code ?? "unknown",
      err.message ?? `Request failed (${res.status})`,
      res.status
    );
  }
  return body as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const result = await rawRequest<AuthResult>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    accessToken = result.accessToken;
    await tokenStorage.setTokens(result.accessToken, result.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && accessToken) {
      if (await tryRefresh()) {
        return rawRequest<T>(path, options);
      }
      onUnauthorized?.();
    }
    throw err;
  }
}

export interface AuthUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface GameInfo {
  key: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  emoji: string;
  tileColor: string;
  category: string;
  tag: string;
}

export interface RoomPlayerInfo {
  userId: string;
  username: string;
  seat: number;
  ready: boolean;
}

export interface RoomInfo {
  id: string;
  code: string;
  gameType: string;
  hostId: string;
  status: "waiting" | "playing" | "finished" | "closed";
  players: RoomPlayerInfo[];
  game: GameInfo | null;
  session?: GameSessionInfo | null;
}

export interface GameSessionInfo {
  id: string;
  roomId: string;
  gameType: string;
  state: Record<string, unknown>;
  status: "in_progress" | "finished";
  winnerUserId: string | null;
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      rawRequest<AuthResult>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    login: (username: string, password: string) =>
      rawRequest<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    me: () => request<{ user: AuthUser }>("/auth/me"),
  },

  listGames: () => request<{ games: GameInfo[] }>("/games"),

  createRoom: (gameType: string) =>
    request<{ room: RoomInfo }>("/rooms", {
      method: "POST",
      body: JSON.stringify({ gameType }),
    }),

  joinRoom: (code: string) =>
    request<{ room: RoomInfo }>("/rooms/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  myRooms: () => request<{ rooms: RoomInfo[] }>("/rooms/mine"),

  getRoomByCode: (code: string) =>
    request<{ room: RoomInfo }>(`/rooms/code/${encodeURIComponent(code)}`),

  getRoom: (roomId: string) => request<{ room: RoomInfo }>(`/rooms/${roomId}`),

  startGame: (roomId: string) =>
    request<{ session: GameSessionInfo }>(`/rooms/${roomId}/start`, {
      method: "POST",
    }),

  setReady: (roomId: string, ready: boolean) =>
    request<{ room: RoomInfo }>(`/rooms/${roomId}/ready`, {
      method: "POST",
      body: JSON.stringify({ ready }),
    }),

  leaveRoom: (roomId: string) =>
    request<{ room: RoomInfo }>(`/rooms/${roomId}/leave`, {
      method: "POST",
    }),

  makeMove: (roomId: string, move: Record<string, unknown>) =>
    request<{ session: GameSessionInfo; result: unknown }>(
      `/rooms/${roomId}/move`,
      {
        method: "POST",
        body: JSON.stringify({ move }),
      }
    ),
};

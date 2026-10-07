// REST client for the Flask backend (/api/v1).
// Identity comes from the Bearer access token; on 401 the client
// refreshes once (rotating both tokens) and retries the request.
// EXPO_PUBLIC_API_URL comes from the EAS environment of the build
// profile (set on expo.dev), or from .env.local on your own machine;
// without it the app talks to the local dev backend.

import { tokenStorage } from "./tokenStorage";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5005";

const API_BASE = `${API_URL}/api/v1`;

/** Full address of a file the API serves (e.g. an avatarUrl path). */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:/.test(path) ? path : `${API_URL}${path}`;
}

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

export function getAccessToken(): string | null {
  return accessToken;
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
  /** Profile picture path (see assetUrl), or null for the initial. */
  avatarUrl: string | null;
  /** Profile border worn around the avatar. */
  borderId: string;
  /** Coin balance. Only sent for your own account. */
  coins?: number;
  /** Paid borders you have unlocked. Only sent for your own account. */
  ownedBorders?: string[];
}

export interface CoinRewardInfo {
  id: string;
  sessionId: string;
  gameType: string;
  amount: number;
  reason: "win" | "played";
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
  borderId: string | null;
  avatarUrl?: string | null;
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
  /** Code of the open "play again" table for this finished room. */
  rematchCode: string | null;
  session?: GameSessionInfo | null;
}

export interface GameSessionInfo {
  id: string;
  roomId: string;
  gameType: string;
  state: Record<string, unknown>;
  status: "in_progress" | "finished";
  /** Set when there is exactly one winner. */
  winnerUserId: string | null;
  /** Every winner (team games have several); empty for no winner. */
  winnerUserIds: string[];
}

export type FriendRelation = "friend" | "incoming" | "outgoing" | "none";

/** A person as the friends endpoints list them. `presence` is only
 *  shared between friends; `requestId` is set while a request is pending. */
export interface FriendUser extends AuthUser {
  relation: FriendRelation;
  requestId: string | null;
  presence: "online" | "inGame" | "offline" | null;
}

export interface FriendsListing {
  friends: FriendUser[];
  incoming: FriendUser[];
  outgoing: FriendUser[];
  recent: FriendUser[];
}

/** Socket payload of `table_invite`. */
export interface TableInvite {
  from: AuthUser;
  code: string;
  game: GameInfo | null;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  friends: number;
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

    stats: () => request<{ stats: UserStats }>("/auth/me/stats"),

    buyBorder: (borderId: string) =>
      request<{ user: AuthUser }>(
        `/auth/me/borders/${encodeURIComponent(borderId)}/buy`,
        { method: "POST" }
      ),

    setBorder: (borderId: string) =>
      request<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ borderId }),
      }),

    /** `image`: base64 JPEG, PNG or WebP (the app sends a small square). */
    uploadAvatar: (image: string) =>
      request<{ user: AuthUser }>("/auth/me/avatar", {
        method: "PUT",
        body: JSON.stringify({ image }),
      }),

    removeAvatar: () =>
      request<{ user: AuthUser }>("/auth/me/avatar", { method: "DELETE" }),

    /** Signs out every other device; returns fresh tokens for this one. */
    changePassword: (currentPassword: string, newPassword: string) =>
      request<AuthResult>("/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    deleteAccount: (password: string) =>
      request<{ ok: true }>("/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }),
  },

  rewards: {
    list: () =>
      request<{ rewards: CoinRewardInfo[]; total: number }>("/rewards"),

    /** Moves every waiting reward onto the coin balance. */
    claim: () =>
      request<{ claimed: number; user: AuthUser }>("/rewards/claim", {
        method: "POST",
      }),
  },

  friends: {
    list: () => request<FriendsListing>("/friends"),

    search: (q: string) =>
      request<{ users: FriendUser[] }>(
        `/friends/search?q=${encodeURIComponent(q)}`
      ),

    sendRequest: (userId: string) =>
      request<{ user: FriendUser }>("/friends/requests", {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),

    acceptRequest: (requestId: string) =>
      request<{ user: FriendUser }>(`/friends/requests/${requestId}/accept`, {
        method: "POST",
      }),

    /** Decline a received request or cancel a sent one. */
    removeRequest: (requestId: string) =>
      request<{ ok: true }>(`/friends/requests/${requestId}`, {
        method: "DELETE",
      }),

    remove: (userId: string) =>
      request<{ ok: true }>(`/friends/${userId}`, { method: "DELETE" }),

    /** Invite an online friend to the table I'm waiting at. */
    invite: (userId: string) =>
      request<{ ok: true; code: string }>(`/friends/${userId}/invite`, {
        method: "POST",
      }),
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

  /** Play again: opens (or joins) the rematch table for a finished room. */
  rematch: (roomId: string) =>
    request<{ room: RoomInfo }>(`/rooms/${roomId}/rematch`, {
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

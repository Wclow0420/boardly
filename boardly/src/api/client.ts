// REST client for the Flask backend (/api/v1).
// Identity comes from the Bearer access token; on 401 the client
// refreshes once (rotating both tokens) and retries the request.
// EXPO_PUBLIC_API_URL comes from the EAS environment of the build
// profile (set on expo.dev), or from .env.local on your own machine;
// without it the app talks to the local dev backend.

import { tokenStorage } from "./tokenStorage";

// A trailing slash is dropped so paths can be appended as "/api/v1/...".
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5005"
).replace(/\/+$/, "");

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
  /** Their mascot as dressed (features/mascot). */
  mascot?: MascotLook;
  /** Mascot items you have bought ("hat:crown"). Your own account only. */
  ownedMascot?: string[];
  /** The badges you picked to show on your card (empty: the four best).
   *  Your own account only. */
  showcaseBadges?: string[];
  /** A bot the server plays. */
  isBot?: boolean;
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
  /** Lobby settings the host can pick: {name: [choices]}, first = default. */
  options?: Record<string, string[]>;
}

/** A mascot's look: its skin, colour and what it wears in each slot. */
export interface MascotLook {
  skin: string;
  colour: string;
  wear: Record<string, string>;
}

export interface RoomPlayerInfo {
  userId: string;
  username: string;
  borderId: string | null;
  mascot?: MascotLook;
  avatarUrl?: string | null;
  seat: number;
  ready: boolean;
  /** A bot player the server plays (seated by the host). */
  isBot?: boolean;
}

export interface RoomInfo {
  id: string;
  code: string;
  gameType: string;
  hostId: string;
  status: "waiting" | "playing" | "finished" | "closed";
  players: RoomPlayerInfo[];
  game: GameInfo | null;
  /** The host's current settings for this table's game. */
  options?: Record<string, string>;
  /** Code of the open "play again" table for this finished room. */
  rematchCode: string | null;
  /** The host can fill seats with bot players (see backend/app/bots.py). */
  botsAvailable?: boolean;
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
  /** The game a friend is playing right now (friends only). */
  playing: string | null;
  together: Together | null;
}

/** The finished games two people both sat at. */
export interface Together {
  games: number;
  lastGameType: string | null;
  /** ISO time the latest one ended. */
  lastPlayedAt: string | null;
}

/** Someone's player card: their numbers, the badges they've earned, and
 *  how we know each other. Presence is only shared between friends. */
export interface FriendCard {
  user: AuthUser;
  relation: FriendRelation;
  /** The pending request between us, to accept or cancel. */
  requestId: string | null;
  gamesPlayed: number;
  wins: number;
  bestStreak: number;
  favourite: string | null;
  /** Only the badges they show on their card (up to four). */
  badges: BadgeRecord[];
  /** How many badges they have earned in all. */
  badgeCount: number;
  together: Together | null;
  presence: "online" | "inGame" | "offline" | null;
  playing: string | null;
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

export interface SideRecord {
  played: number;
  wins: number;
}

/** One game's line on the player card. */
export interface GameRecord {
  gameType: string;
  played: number;
  wins: number;
  /** "good" / "evil", for games with hidden sides. */
  sides: Partial<Record<"good" | "evil", SideRecord>>;
}

export type BadgeLevel = "bronze" | "silver" | "gold" | "diamond";

/** A mission, earned in four levels. */
export interface BadgeRecord {
  /** "<game key>.<name>", or "boardly.<name>" for Boardly's own. */
  key: string;
  gameType: string | null;
  /** What it takes to reach bronze, silver, gold and diamond. */
  goals: [number, number, number, number];
  /** How far I am (my own card only; capped at the diamond goal). */
  progress?: number;
  /** The highest level reached, null before bronze. */
  tier: BadgeLevel | null;
  /** When each level reached was reached (ISO). */
  unlocked: Partial<Record<BadgeLevel, string>>;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  friends: number;
  streak: number;
  bestStreak: number;
  favourite: string | null;
  games: GameRecord[];
  badges: BadgeRecord[];
  /** The keys of the (up to four) badges my card shows. */
  showcase: string[];
  /** When the latest finished game ended (ISO); levels reached at
   *  exactly this time were reached in it. */
  lastGameAt: string | null;
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

    /** Dress the mascot in things already owned. */
    wearMascot: (look: MascotLook) =>
      request<{ user: AuthUser }>("/auth/me/mascot", {
        method: "PUT",
        body: JSON.stringify({ look }),
      }),

    /** Buy what the look wears that isn't owned yet, and put it on. */
    buyMascot: (look: MascotLook) =>
      request<{ user: AuthUser }>("/auth/me/mascot/buy", {
        method: "POST",
        body: JSON.stringify({ look }),
      }),

    /** The badges (up to four, earned) to show on my card; [] for the
     *  four best. */
    setShowcase: (badges: string[]) =>
      request<{ user: AuthUser }>("/auth/me/showcase", {
        method: "PUT",
        body: JSON.stringify({ badges }),
      }),

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

    /** The player card of a friend, or of someone I've shared a table with. */
    card: (userId: string) => request<{ card: FriendCard }>(`/friends/${userId}/card`),

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

  setRoomOptions: (roomId: string, options: Record<string, string>) =>
    request<{ room: RoomInfo }>(`/rooms/${roomId}/options`, {
      method: "PATCH",
      body: JSON.stringify({ options }),
    }),

  addBots: (roomId: string, count: number) =>
    request<{ added: number; room: RoomInfo }>(`/rooms/${roomId}/bots`, {
      method: "POST",
      body: JSON.stringify({ count }),
    }),

  removeBot: (roomId: string, userId: string) =>
    request<{ room: RoomInfo }>(`/rooms/${roomId}/bots/${userId}`, {
      method: "DELETE",
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

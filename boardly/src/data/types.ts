import type { Together } from "@/api/client";
import type { PresenceStatus } from "@/components/ui";

export type TableStatus = "inProgress" | "waiting" | "finished" | "closed";
export type GameCategory = "faction" | "strategy" | "party" | "classic" | "custom";

export interface GameCatalogEntry {
  id: string;
  /** i18n-independent display name (proper noun). */
  name: string;
  emoji: string;
  /** Pastel tile color behind the emoji. */
  tileColor: string;
  category: GameCategory;
  /** Tag chip: i18n key under games.tags.* */
  tagKey: "classic" | "card" | "strategy" | "party" | "faction";
  minPlayers: number;
  maxPlayers: number;
  /** Community rating — not provided by the backend yet. */
  rating?: number;
}

export interface TableSummary {
  id: string;
  code: string;
  /** Registry key, used to look up the localized name. */
  gameKey: string;
  /** Backend display name — fallback when there is no translation. */
  gameName: string;
  coverColor: string;
  players: string[];
  maxPlayers: number;
  status: TableStatus;
}

export type FriendRelation = "friend" | "incoming" | "outgoing" | "none";

export interface Friend {
  /** User id. */
  id: string;
  name: string;
  /** Profile border they wear. */
  borderId?: string;
  avatarUrl?: string | null;
  relation: FriendRelation;
  /** Only known for friends. */
  presence?: PresenceStatus;
  /** Pending request id (incoming / outgoing). */
  requestId?: string;
  /** The game they're playing now (friends only). */
  playing?: string | null;
  /** What we've played together. */
  together?: Together | null;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  borderId?: string | null;
  avatarUrl?: string | null;
  isHost: boolean;
  ready: boolean;
  /** A bot player the server plays. */
  isBot?: boolean;
}

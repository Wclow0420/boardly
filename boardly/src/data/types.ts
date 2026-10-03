import type { PresenceStatus } from "@/components/ui";

export type TableStatus = "inProgress" | "waiting" | "finished" | "closed";
export type GameCategory = "strategy" | "party" | "classic" | "custom";

export interface GameCatalogEntry {
  id: string;
  /** i18n-independent display name (proper noun). */
  name: string;
  emoji: string;
  /** Pastel tile color behind the emoji. */
  tileColor: string;
  category: GameCategory;
  /** Tag chip: i18n key under games.tags.* */
  tagKey: "classic" | "card" | "strategy" | "party";
  minPlayers: number;
  maxPlayers: number;
  /** Community rating — not provided by the backend yet. */
  rating?: number;
}

export interface TableSummary {
  id: string;
  code: string;
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
  relation: FriendRelation;
  /** Only known for friends. */
  presence?: PresenceStatus;
  /** Pending request id (incoming / outgoing). */
  requestId?: string;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
}

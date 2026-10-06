// Placeholder data matching the design mock. Screens read this through
// feature hooks (src/features/*/hooks.ts), so swapping in the real API
// (src/api/client.ts) later only touches the hooks — not the UI.

import type {
  GameCatalogEntry,
  LobbyPlayer,
  TableSummary,
} from "./types";

export const MOCK_TABLES: TableSummary[] = [
  {
    id: "t1",
    code: "BRD1234",
    gameKey: "monopoly",
    gameName: "Monopoly",
    coverColor: "#FFF2D6",
    players: ["Weng", "Alex", "Sam", "Jia Yi"],
    maxPlayers: 6,
    status: "inProgress",
  },
  {
    id: "t2",
    code: "BRD5678",
    gameKey: "uno",
    gameName: "UNO",
    coverColor: "#EDE4FF",
    players: ["Jia Yi", "Weng", "Rachel"],
    maxPlayers: 4,
    status: "waiting",
  },
];

export const MOCK_GAMES: GameCatalogEntry[] = [
  {
    id: "monopoly",
    name: "Monopoly",
    emoji: "🎩",
    tileColor: "#FFF2D6",
    category: "classic",
    tagKey: "classic",
    minPlayers: 4,
    maxPlayers: 6,
    rating: 4.8,
  },
  {
    id: "uno",
    name: "UNO",
    emoji: "🃏",
    tileColor: "#EDE4FF",
    category: "party",
    tagKey: "card",
    minPlayers: 2,
    maxPlayers: 4,
    rating: 4.6,
  },
  {
    id: "catan",
    name: "Catan",
    emoji: "🏝️",
    tileColor: "#FFEBD6",
    category: "strategy",
    tagKey: "strategy",
    minPlayers: 3,
    maxPlayers: 4,
    rating: 4.9,
  },
  {
    id: "ludo",
    name: "Ludo",
    emoji: "🎲",
    tileColor: "#E3F0FF",
    category: "classic",
    tagKey: "classic",
    minPlayers: 2,
    maxPlayers: 4,
    rating: 4.4,
  },
];

export const MOCK_LOBBY = {
  gameName: "Monopoly",
  gameEmoji: "🎩",
  code: "BRD1234",
  maxPlayers: 6,
  players: [
    { id: "p1", name: "Weng", isHost: true, ready: true },
    { id: "p2", name: "Alex", isHost: false, ready: true },
    { id: "p3", name: "Sam", isHost: false, ready: true },
  ] as LobbyPlayer[],
};

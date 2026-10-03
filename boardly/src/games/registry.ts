// Game registry — mirrors backend/app/games/__init__.py.
// To add a game: create src/games/<key>/ with logic + UI, export a
// GameDefinition from its index.ts, and register it here.

import type { GameDefinition } from "./types";
import { tictactoe } from "./tictactoe";

export const GAMES: Record<string, GameDefinition<any>> = {
  [tictactoe.key]: tictactoe,
};

export function getGame(key: string): GameDefinition<any> | undefined {
  return GAMES[key];
}

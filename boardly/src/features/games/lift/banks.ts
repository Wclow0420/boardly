// The lift's floors, grouped into banks (the Games tab). The dial shows
// one bank at a time, BANK_SIZE floors round its half circle; riding past
// a bank's last floor turns the dial over to the next. First "Your
// floors", the games I've played most (only once I've played one); then
// a bank for each kind of game in a fixed order, each holding the
// server's order, a kind with more games than a bank holds running on
// into a second bank of it. The floors count up through the building
// across the banks; a game in Your floors is on its own kind's bank too.
// Plain data, no React.

import type { GameCatalogEntry, GameCategory } from "@/data/types";
import type { GameType } from "@/games/types";

export const BANK_SIZE = 7;

/** The order the kinds' banks come in. */
export const TYPE_ORDER: GameType[] = ["deduction", "bluff", "strategy", "party", "duel", "classic"];

/** A kind for a game this build doesn't know, from the server's
 *  category. */
const FROM_SERVER: Record<GameCategory, GameType> = {
  faction: "deduction",
  strategy: "strategy",
  party: "party",
  classic: "classic",
  custom: "classic",
};
export const typeFromServer = (category: GameCategory): GameType => FROM_SERVER[category] ?? "classic";

export type BankKind = "often" | GameType;

export interface LiftBank {
  kind: BankKind;
  /** Which bank of its kind (a kind with more than BANK_SIZE games runs
   *  on into a second): 0, 1… */
  part: number;
  /** Its first floor's index. */
  start: number;
  size: number;
}

export interface LiftFloor {
  game: GameCatalogEntry;
  /** Its bank's index. */
  bank: number;
  /** Where it is round the dial (0 at the lower left). */
  slot: number;
  /** One of the games I play most (a star by it). */
  often: boolean;
  isNew: boolean;
}

export interface Building {
  floors: LiftFloor[];
  banks: LiftBank[];
}

export interface BuildOptions {
  /** Each game's kind. */
  typeOf: (game: GameCatalogEntry) => GameType;
  /** How many times I've played each game, by id. */
  played?: Record<string, number>;
  isNew?: (game: GameCatalogEntry) => boolean;
}

/** The games I play most, most played first, up to a bank's worth. */
export function oftenPlayed(games: GameCatalogEntry[], played: Record<string, number> = {}) {
  return games
    .map((game, i) => ({ game, i, n: played[game.id] ?? 0 }))
    .filter((g) => g.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, BANK_SIZE)
    .map((g) => g.game);
}

export function buildBanks(games: GameCatalogEntry[], { typeOf, played, isNew }: BuildOptions): Building {
  const often = oftenPlayed(games, played);
  const starred = new Set(often.map((g) => g.id));
  const groups: { kind: BankKind; games: GameCatalogEntry[] }[] = [];
  if (often.length) groups.push({ kind: "often", games: often });
  const byType = new Map<GameType, GameCatalogEntry[]>();
  for (const g of games) {
    const t = typeOf(g);
    byType.set(t, [...(byType.get(t) ?? []), g]);
  }
  const order = [...TYPE_ORDER, ...[...byType.keys()].filter((t) => !TYPE_ORDER.includes(t))];
  for (const t of order) {
    const list = byType.get(t);
    if (list?.length) groups.push({ kind: t, games: list });
  }
  const floors: LiftFloor[] = [];
  const banks: LiftBank[] = [];
  for (const { kind, games: list } of groups) {
    for (let part = 0; part * BANK_SIZE < list.length; part++) {
      const chunk = list.slice(part * BANK_SIZE, (part + 1) * BANK_SIZE);
      const bank = banks.length;
      banks.push({ kind, part, start: floors.length, size: chunk.length });
      chunk.forEach((game, slot) =>
        floors.push({ game, bank, slot, often: starred.has(game.id), isNew: isNew?.(game) ?? false }),
      );
    }
  }
  return { floors, banks };
}

/** Where the lift was left, to find it again: the bank's kind and the
 *  game ("often|coup"). */
export const floorKey = (b: Building, i: number) => {
  const f = b.floors[i];
  return f ? `${b.banks[f.bank].kind}|${f.game.id}` : "";
};

/** The floor a remembered key names: the same game on the same kind of
 *  bank, else the game anywhere, else the ground floor. Keys from before
 *  the banks were just the game's id. */
export function findFloor(b: Building, key: string | null) {
  if (!key) return 0;
  const [kind, id] = key.includes("|") ? key.split("|") : [null, key];
  const exact = b.floors.findIndex((f) => f.game.id === id && b.banks[f.bank].kind === kind);
  if (exact >= 0) return exact;
  return Math.max(0, b.floors.findIndex((f) => f.game.id === id));
}

/** The first floor of bank `bank` whose game fits, going `dir` from it
 *  through the banks; -1 if none does. */
export function bankEntry(b: Building, fits: boolean[], bank: number, dir: 1 | -1) {
  for (let k = bank; k >= 0 && k < b.banks.length; k += dir) {
    const { start, size } = b.banks[k];
    for (let i = start; i < start + size; i++) if (fits[i]) return i;
  }
  return -1;
}

/** The floor (from 1) a game is on in its own kind's bank, as the dial
 *  numbers it (the lobby's landing sign reads the same "8F"); 1 if it
 *  isn't in the building. */
export function floorOfGame(b: Building, id: string) {
  const i = b.floors.findIndex((f) => f.game.id === id && b.banks[f.bank].kind !== "often");
  return i >= 0 ? i + 1 : 1;
}

// Client-side Avalon helpers — mirrors backend
// (backend/app/games/avalon/game.py). The backend is authoritative and
// only ever sends this player's *view* of the game: secret roles,
// votes in progress and played quest cards never reach the client.

export type Role =
  | "merlin"
  | "percival"
  | "servant"
  | "assassin"
  | "morgana"
  | "mordred"
  | "oberon"
  | "minion";

export type Side = "good" | "evil";
export type Phase = "team" | "vote" | "quest" | "assassinate" | "finished";
export type WinReason =
  | "quests"
  | "assassination"
  | "failedQuests"
  | "rejections"
  | "abandoned";

export interface QuestResult {
  team: number[];
  fails: number;
  success: boolean;
}

export interface VoteRecord {
  quest: number;
  leader: number;
  team: number[];
  /** By seat. */
  votes: boolean[];
  approved: boolean;
}

/** What a player learned in the night phase about another seat:
 *  "evil" = on the evil team, "merlin" = Merlin or Morgana. */
export interface Knowledge {
  seat: number;
  as: "evil" | "merlin";
}

export interface AvalonState {
  numPlayers: number;
  phase: Phase;
  /** Current quest index, 0-4. */
  quest: number;
  leader: number;
  /** Rejected teams in a row (5 = evil wins). */
  rejections: number;
  team: number[];
  questSizes: number[];
  failsRequired: number[];
  questResults: QuestResult[];
  history: VoteRecord[];
  rolesInGame: Role[];
  /** By seat: has voted on the current team (not how). */
  voted: boolean[];
  /** Seats that have played their quest card (not which). */
  questPlayed: number[];
  myVote: boolean | null;
  myCard: "success" | "fail" | null;
  myRole: Role | null;
  known: Knowledge[];
  /** Revealed for the assassination and at the end. */
  evilSeats: number[] | null;
  assassinSeat: number | null;
  assassinTarget: number | null;
  winner: Side | null;
  winReason: WinReason | null;
  /** By seat — only once the game is over. */
  roles: Role[] | null;
}

export const EVIL_ROLES: readonly Role[] = [
  "assassin",
  "morgana",
  "mordred",
  "oberon",
  "minion",
];

export const MAX_REJECTIONS = 5;

export function sideOf(role: Role): Side {
  return EVIL_ROLES.includes(role) ? "evil" : "good";
}

/** Players the leader must pick for the current quest. */
export function teamSize(state: AvalonState): number {
  return state.questSizes[state.quest] ?? 0;
}

/** Tap-to-select for team building: toggles a seat, ignoring taps that
 *  would exceed `max`. */
export function toggleSeat(
  selected: number[],
  seat: number,
  max: number
): number[] {
  if (selected.includes(seat)) return selected.filter((s) => s !== seat);
  if (selected.length >= max) return selected;
  return [...selected, seat].sort((a, b) => a - b);
}

export type PendingAction = "propose" | "vote" | "quest" | "assassinate";

/** What this player has to do right now, if anything. */
export function pendingAction(
  state: AvalonState,
  mySeat: number
): PendingAction | null {
  if (mySeat < 0) return null;
  switch (state.phase) {
    case "team":
      return state.leader === mySeat ? "propose" : null;
    case "vote":
      return state.voted[mySeat] ? null : "vote";
    case "quest":
      return state.team.includes(mySeat) && !state.questPlayed.includes(mySeat)
        ? "quest"
        : null;
    case "assassinate":
      return state.assassinSeat === mySeat ? "assassinate" : null;
    default:
      return null;
  }
}

/** Seats the Assassin may name: everyone who isn't evil. */
export function assassinTargets(state: AvalonState): number[] {
  const evil = state.evilSeats ?? [];
  return Array.from({ length: state.numPlayers }, (_, seat) => seat).filter(
    (seat) => !evil.includes(seat)
  );
}

export function questScore(state: AvalonState): { good: number; evil: number } {
  const good = state.questResults.filter((r) => r.success).length;
  return { good, evil: state.questResults.length - good };
}

/** Seat whose move everyone is waiting on, or -1 during simultaneous
 *  phases (voting, questing). */
export function currentSeat(state: AvalonState): number {
  if (state.phase === "team") return state.leader;
  if (state.phase === "assassinate") return state.assassinSeat ?? -1;
  return -1;
}

/** A moment worth announcing to the whole table. */
export type Reveal =
  | { kind: "vote"; id: string; record: VoteRecord }
  | { kind: "quest"; id: string; quest: number; result: QuestResult }
  | { kind: "end"; id: string; winner: Side; reason: WinReason };

/** How much of the game this client has already announced. */
export interface Seen {
  votes: number;
  quests: number;
  ended: boolean;
}

export function seenOf(state: AvalonState): Seen {
  return {
    votes: state.history.length,
    quests: state.questResults.length,
    ended: state.winner !== null,
  };
}

/** Announcements owed since `seen`, in the order they happened: the
 *  latest finished vote, the latest finished quest, then the game's end.
 *  (If several votes went by unseen, only the newest is announced.) */
export function newReveals(seen: Seen, state: AvalonState): Reveal[] {
  const reveals: Reveal[] = [];
  const votes = state.history.length;
  const quests = state.questResults.length;

  if (votes > seen.votes) {
    reveals.push({
      kind: "vote",
      id: `vote:${votes}`,
      record: state.history[votes - 1],
    });
  }
  if (quests > seen.quests) {
    reveals.push({
      kind: "quest",
      id: `quest:${quests}`,
      quest: quests - 1,
      result: state.questResults[quests - 1],
    });
  }
  if (!seen.ended && state.winner !== null && state.winReason !== null) {
    reveals.push({
      kind: "end",
      id: "end",
      winner: state.winner,
      reason: state.winReason,
    });
  }
  return reveals;
}

// --- Setup tables, mirrored from the backend engine (ROLE_SETS and
// QUEST_SIZES in backend/app/games/avalon/game.py). Used by the rules
// pages; during a game the sizes come from the server's view instead.

export const PLAYER_COUNTS = [5, 6, 7, 8, 9, 10] as const;

export const ROLE_SETS: Record<number, Role[]> = {
  5: ["merlin", "percival", "servant", "assassin", "morgana"],
  6: ["merlin", "percival", "servant", "servant", "assassin", "morgana"],
  7: ["merlin", "percival", "servant", "servant", "assassin", "morgana", "oberon"],
  8: ["merlin", "percival", "servant", "servant", "servant", "assassin", "morgana", "minion"],
  9: ["merlin", "percival", "servant", "servant", "servant", "servant", "assassin", "morgana", "mordred"],
  10: ["merlin", "percival", "servant", "servant", "servant", "servant", "assassin", "morgana", "mordred", "oberon"],
};

export const QUEST_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

/** Fail cards needed to fail an operation (0-based index). */
export function failsNeeded(numPlayers: number, quest: number): number {
  return numPlayers >= 7 && quest === 3 ? 2 : 1;
}

/** Every role, good side first — the order the rules list them in. */
export const ALL_ROLES: Role[] = [
  "merlin",
  "percival",
  "servant",
  "assassin",
  "morgana",
  "mordred",
  "oberon",
  "minion",
];

/** Placeholder glyph per role, until the game has its own art. */
export const ROLE_EMOJI: Record<Role, string> = {
  merlin: "🎧",
  percival: "🛡️",
  servant: "🕵️",
  assassin: "🎯",
  morgana: "🎭",
  mordred: "💤",
  oberon: "🃏",
  minion: "🐀",
};

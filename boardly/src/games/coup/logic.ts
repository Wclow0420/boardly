// Client-side Coup helpers — mirrors backend
// (backend/app/games/coup/game.py). The backend is authoritative and
// only sends this player's *view*: other players' face-down cards and
// the deck never reach the client.

export type Role = "duke" | "assassin" | "captain" | "ambassador" | "contessa";

export type ActionType =
  | "income"
  | "foreignAid"
  | "coup"
  | "tax"
  | "assassinate"
  | "steal"
  | "exchange";

export type Phase =
  | "action"
  | "challengeAction"
  | "block"
  | "challengeBlock"
  | "loseInfluence"
  | "exchange"
  | "finished";

export interface CoupCard {
  revealed: boolean;
  /** null = someone else's face-down card. */
  role: Role | null;
}

export interface CoupPlayer {
  coins: number;
  alive: boolean;
  cards: CoupCard[];
}

export type LoseWhy = "challenge" | "coup" | "assassinate";

export type LogEvent =
  | { t: "action"; actor: number; action: ActionType; target: number | null }
  | {
      t: "challenge";
      challenger: number;
      claimant: number;
      role: Role;
      /** true = the claimant was bluffing. */
      caught: boolean;
    }
  | { t: "block"; seat: number; role: Role }
  | { t: "blocked"; seat: number }
  /** `why`: lost a challenge, or the target of a coup / assassination
   *  (absent in games started before the server said). */
  | { t: "lose"; seat: number; role: Role; why?: LoseWhy }
  | { t: "out"; seat: number };

export interface CoupState {
  numPlayers: number;
  players: CoupPlayer[];
  deckCount: number;
  turn: number;
  phase: Phase;
  action: {
    type: ActionType;
    actor: number;
    target: number | null;
    claim: Role | null;
  } | null;
  block: { seat: number; role: Role } | null;
  passed: number[];
  /** Seats the game is waiting on right now. */
  waitingOn: number[];
  /** Cards to choose from — only sent to the player exchanging. */
  exchange: Role[] | null;
  /** Who is turning a card over right now, and why. */
  losing?: { seat: number; why: LoseWhy | null } | null;
  log: LogEvent[];
  winner: number | null;
}

export interface ActionSpec {
  type: ActionType;
  cost: number;
  /** Role the player claims to have (can be challenged). */
  claim: Role | null;
  needsTarget: boolean;
  /** Roles that block this action. */
  blockers: Role[];
}

export const COUP_COST = 7;
export const FORCED_COUP_AT = 10;

export const ACTIONS: ActionSpec[] = [
  { type: "income", cost: 0, claim: null, needsTarget: false, blockers: [] },
  { type: "foreignAid", cost: 0, claim: null, needsTarget: false, blockers: ["duke"] },
  { type: "tax", cost: 0, claim: "duke", needsTarget: false, blockers: [] },
  { type: "steal", cost: 0, claim: "captain", needsTarget: true, blockers: ["captain", "ambassador"] },
  { type: "exchange", cost: 0, claim: "ambassador", needsTarget: false, blockers: [] },
  { type: "assassinate", cost: 3, claim: "assassin", needsTarget: true, blockers: ["contessa"] },
  { type: "coup", cost: COUP_COST, claim: null, needsTarget: true, blockers: [] },
];

export function specOf(type: ActionType): ActionSpec {
  return ACTIONS.find((a) => a.type === type) as ActionSpec;
}

/** Whether `seat` may choose this action right now (coins, forced coup). */
export function canTake(state: CoupState, seat: number, type: ActionType): boolean {
  const coins = state.players[seat]?.coins ?? 0;
  if (coins >= FORCED_COUP_AT) return type === "coup";
  return coins >= specOf(type).cost;
}

/** Everyone else still in the game. */
export function targetsFor(state: CoupState, seat: number): number[] {
  return state.players.flatMap((player, s) =>
    s !== seat && player.alive ? [s] : []
  );
}

/** Indices of my face-down cards. */
export function handOf(state: CoupState, seat: number): number[] {
  return (state.players[seat]?.cards ?? []).flatMap((card, i) =>
    card.revealed ? [] : [i]
  );
}

export type Task =
  | "action"
  | "challengeAction"
  | "block"
  | "challengeBlock"
  | "reveal"
  | "exchange";

/** What this player has to do right now, if anything. */
export function taskFor(state: CoupState, seat: number): Task | null {
  if (seat < 0 || !state.waitingOn.includes(seat)) return null;
  switch (state.phase) {
    case "loseInfluence":
      return "reveal";
    case "finished":
      return null;
    default:
      return state.phase;
  }
}

/** Tap-to-select for the exchange: toggles an option, ignoring taps
 *  that would keep more than `max` cards. */
export function toggleKeep(selected: number[], index: number, max: number): number[] {
  if (selected.includes(index)) return selected.filter((i) => i !== index);
  if (selected.length >= max) return selected;
  return [...selected, index].sort((a, b) => a - b);
}

/** Seat whose move everyone is waiting on, or -1 when several players
 *  are responding at once. */
export function currentSeat(state: CoupState): number {
  return state.waitingOn.length === 1 ? state.waitingOn[0] : -1;
}

export const ROLES: Role[] = ["duke", "assassin", "captain", "ambassador", "contessa"];

/** Who has to respond to the claim on the table now (everyone the game
 *  is waiting on in a challenge or block window). */
export function claimWindow(state: CoupState): boolean {
  return state.phase === "challengeAction" || state.phase === "block" || state.phase === "challengeBlock";
}

/** Who can still answer the claim on the table: those waited on plus
 *  those who've already let it go. */
export function respondersOf(state: CoupState): number[] {
  return [...new Set([...state.passed, ...state.waitingOn])].sort((a, b) => a - b);
}

/** How many turns have been taken (each action starts one). */
export function turnCount(state: CoupState): number {
  return state.log.filter((e) => e.t === "action").length;
}

/** Players still holding a face-down card. */
export function aliveCount(state: CoupState): number {
  return state.players.filter((p) => p.alive).length;
}

/** The claim on the table right now: who claims which role, and for what. */
export function claimOf(state: CoupState): { seat: number; role: Role | null; block: boolean } | null {
  if (state.phase === "challengeBlock" && state.block) return { seat: state.block.seat, role: state.block.role, block: true };
  if (state.action && claimWindow(state)) return { seat: state.action.actor, role: state.action.claim, block: false };
  return null;
}

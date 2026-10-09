// Client-side Liar's Dice (大话骰) helpers — mirrors backend
// (backend/app/games/liarsdice/game.py). The backend is authoritative
// and only sends each player their own dice.

export interface Bid {
  quantity: number;
  face: number;
  /** 1s no longer wild (斋). */
  zhai: boolean;
  seat: number;
}

export interface Reveal {
  round: number;
  /** Everyone's dice that round, by seat. */
  dice: number[][];
  bid: Bid;
  challenger: number;
  /** open (开) = 1 cup, split (劈) = 2, counter (反劈) = 4. */
  kind: "open" | "split" | "counter";
  found: number;
  loser: number;
  drink: number;
  out: boolean;
}

export interface LiarsDiceState {
  numPlayers: number;
  /** knockout: out at maxCups; endless: nobody is out, vote to stop. */
  mode: "knockout" | "endless";
  /** "split": someone split (劈) the bid, waiting on the bidder. */
  phase: "bidding" | "split" | "finished";
  turn: number;
  round: number;
  cups: number[];
  /** Cups that knock you out; null in endless games. */
  maxCups: number | null;
  diceEach: number;
  myDice: number[];
  diceCount: number[];
  bid: Bid | null;
  bids: Bid[];
  split: { by: number } | null;
  /** Endless: seats voting to stop. */
  endVotes: number[];
  reveal: Reveal | null;
  winner: number | null;
  /** Endless: fewest cups when the table stopped (ties share it). */
  winners: number[] | null;
}

/** 1 is the top face: 2 < 3 < 4 < 5 < 6 < 1. */
export function faceRank(face: number): number {
  return face === 1 ? 7 : face;
}

export function isOut(state: LiarsDiceState, seat: number): boolean {
  return state.maxCups !== null && state.cups[seat] >= state.maxCups;
}

export function activeSeats(state: LiarsDiceState): number[] {
  return state.cups.map((_, seat) => seat).filter((seat) => !isOut(state, seat));
}

/** Whether this player may split (劈) the bid on the table now. */
export function canSplit(state: LiarsDiceState, mySeat: number): boolean {
  return (
    state.phase === "bidding" &&
    state.bid !== null &&
    mySeat >= 0 &&
    state.bid.seat !== mySeat &&
    !isOut(state, mySeat)
  );
}

/** What the game is waiting on from this player, if anything. */
export function taskFor(state: LiarsDiceState, mySeat: number): "bid" | "answer" | null {
  if (mySeat < 0 || state.phase === "finished") return null;
  if (state.phase === "split") return state.bid?.seat === mySeat ? "answer" : null;
  return state.turn === mySeat ? "bid" : null;
}

export function totalDice(state: LiarsDiceState): number {
  return state.diceCount.reduce((a, b) => a + b, 0);
}

/** Smallest count that breaks the fast (开斋) after a zhai bid. */
export function breakZhaiMin(state: LiarsDiceState): number | null {
  return state.bid?.zhai ? state.bid.quantity * 2 : null;
}

/** Smallest opening count: above the player count, or equal to it zhai. */
export function openingMin(state: LiarsDiceState, zhai: boolean): number {
  const players = activeSeats(state).length;
  return zhai ? players : players + 1;
}

/** Whether (quantity, face, zhai) is a legal next bid. */
export function isValidBid(
  state: LiarsDiceState,
  quantity: number,
  face: number,
  zhai: boolean
): boolean {
  if (face < 1 || face > 6 || quantity < 1 || quantity > totalDice(state)) return false;
  const last = state.bid;
  const isZhai = zhai || face === 1;
  if (last === null) return quantity >= openingMin(state, isZhai);
  // Breaking the fast: 1s are wild again, at double the dice
  if (last.zhai && !isZhai) return quantity >= last.quantity * 2;
  const next = [quantity, faceRank(face)];
  const prev = [last.quantity, faceRank(last.face)];
  const higher = next[0] > prev[0] || (next[0] === prev[0] && next[1] > prev[1]);
  const same = next[0] === prev[0] && next[1] === prev[1];
  return higher || (isZhai && !last.zhai && (higher || same));
}

/** A sensible starting point for the bid picker: the smallest raise. */
export function suggestedBid(state: LiarsDiceState): { quantity: number; face: number } {
  // (a zhai round keeps going zhai unless the player breaks it)
  const last = state.bid;
  if (last === null) {
    return { quantity: activeSeats(state).length + 1, face: state.myDice[0] === 1 ? 2 : state.myDice[0] ?? 2 };
  }
  if (last.face !== 1) return { quantity: last.quantity, face: last.face === 6 ? 1 : last.face + 1 };
  return { quantity: last.quantity + 1, face: 2 };
}

/** How many of my dice count for a face. */
export function myCount(dice: number[], face: number, zhai: boolean): number {
  return dice.filter((d) => d === face || (!zhai && face !== 1 && d === 1)).length;
}

export function currentSeat(state: LiarsDiceState): number {
  if (state.phase === "finished") return -1;
  if (state.phase === "split") return state.bid?.seat ?? -1;
  return state.turn;
}

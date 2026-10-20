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

/** The way of calling the host picked in the lobby (backend rules.py):
 *  几几几 (South China / HK / Macau), classic (经典), or no zhai (不玩斋). */
export type Calling = "jijiji" | "classic" | "nozhai";

export interface LiarsDiceState {
  numPlayers: number;
  /** knockout: out at maxCups; endless: nobody is out, vote to stop. */
  mode: "knockout" | "endless";
  /** Missing in games saved before it existed: those play classic. */
  calling?: Calling;
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
  /** This round's 散骰 rerolls, with the faces each cup showed. */
  rerolls: { seat: number; dice: number[] }[];
  reveal: Reveal | null;
  winner: number | null;
  /** Endless: fewest cups when the table stopped (ties share it). */
  winners: number[] | null;
}

/** Dice in every cup. */
export const DICE_EACH = 5;
/** Cups that knock you out in a knockout game. */
export const KNOCKOUT_CUPS = 5;
/** Cups the loser drinks: open (开), split (劈), counter-split (反劈). */
export const DRINKS = { open: 1, split: 2, counter: 4 } as const;
/** The table sizes the game plays at. */
export const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
/** The ways of calling, in the lobby's order. */
export const CALLINGS: Calling[] = ["jijiji", "classic", "nozhai"];

/** 几几几's thresholds by the players still in: [ONE, ZHAI, FEI]. From ONE
 *  only 1s, from ZHAI any face zhai, from FEI kaizhai too. 2-4 are the
 *  owner's house rule; 5+ "fei at least 1.5x the players, rounded up". */
export const JIJIJI: Record<number, readonly [number, number, number]> = {
  2: [2, 3, 3],
  3: [3, 4, 5],
  4: [4, 5, 7],
  5: [5, 6, 8],
  6: [6, 7, 9],
  7: [7, 8, 11],
  8: [8, 9, 12],
  9: [9, 10, 14],
  10: [10, 11, 15],
};

/** 几几几's [ONE, ZHAI, FEI] for this many players still in. */
export function thresholds(players: number): readonly [number, number, number] {
  return JIJIJI[Math.max(2, Math.min(10, players))];
}

/** The table's way of calling (classic for games saved before it). */
export function callingOf(state: Pick<LiarsDiceState, "calling">): Calling {
  return state.calling && CALLINGS.includes(state.calling) ? state.calling : "classic";
}

/** Classic's smallest first call with this many players in: above the
 *  player count, or equal to it zhai. */
export function openingFor(players: number, zhai: boolean): number {
  return zhai ? players : players + 1;
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

/** 散骰: all five faces different. */
export function isScattered(dice: number[]): boolean {
  return dice.length === 5 && new Set(dice).size === 5;
}

/** A scattered cup may be shown and shaken again before your first bid. */
export function canReroll(state: LiarsDiceState, mySeat: number): boolean {
  return (
    state.phase === "bidding" &&
    mySeat >= 0 &&
    !isOut(state, mySeat) &&
    isScattered(state.myDice) &&
    !state.bids.some((b) => b.seat === mySeat)
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

/** Why a call can't be made (or null when it can): what the screen says
 *  under a greyed call and over the plinth. */
export type BidProblem =
  | { code: "total"; total: number }
  | { code: "min"; min: number }
  | { code: "onesOnly"; min: number }
  | { code: "fei"; min: number }
  | { code: "double"; min: number }
  | { code: "kaizhaiRound" }
  | { code: "onesZhai" }
  | { code: "noOnes" }
  | { code: "noZhai" }
  | { code: "raise" };

/** The kind a call is stored as: 1s are always zhai (and can't be called
 *  at all with no zhai). */
export function storedZhai(state: LiarsDiceState, face: number, zhai: boolean): boolean {
  return zhai || (face === 1 && callingOf(state) !== "nozhai");
}

/** Whether the round is kaizhai (开斋): 1s wild, and no going back. With
 *  no zhai every round is. */
export function isKaizhai(state: LiarsDiceState): boolean {
  return callingOf(state) === "nozhai" || (state.bid !== null && !state.bid.zhai);
}

/** Why (quantity, face, zhai) can't be called next — the server's
 *  rules.bid_error, mirrored — leaving aside how many dice there are. */
function ruleProblem(state: LiarsDiceState, quantity: number, face: number, zhaiAsked: boolean): BidProblem | null {
  const calling = callingOf(state);
  const players = activeSeats(state).length;
  const last = state.bid;
  const zhai = storedZhai(state, face, zhaiAsked);
  const above =
    last === null || quantity > last.quantity || (quantity === last.quantity && faceRank(face) > faceRank(last.face));

  if (calling === "nozhai") {
    if (face === 1) return { code: "noOnes" };
    if (zhai) return { code: "noZhai" };
    if (last === null && quantity < players + 1) return { code: "min", min: players + 1 };
    return above ? null : { code: "raise" };
  }
  if (zhai && last !== null && !last.zhai) return { code: "kaizhaiRound" };
  if (face === 1 && !zhai) return { code: "onesZhai" };

  if (calling === "jijiji") {
    const [one, leastZhai, fei] = thresholds(players);
    if (quantity < one) return { code: "min", min: one };
    if (quantity < leastZhai && face !== 1) return { code: "onesOnly", min: leastZhai };
    if (!zhai && quantity < fei) return { code: "fei", min: fei };
    return above ? null : { code: "raise" };
  }
  // classic
  if (last === null) {
    const least = openingFor(players, zhai);
    return quantity >= least ? null : { code: "min", min: least };
  }
  // breaking the fast (开斋): 1s wild again, at double the dice
  if (last.zhai && !zhai) return quantity >= last.quantity * 2 ? null : { code: "double", min: last.quantity * 2 };
  return above ? null : { code: "raise" };
}

/** Kinds of problem no count can fix. */
const NEVER = new Set(["kaizhaiRound", "onesZhai", "noOnes", "noZhai"]);

/** Why a call can't be made now, or null when it can. */
export function bidProblem(state: LiarsDiceState, quantity: number, face: number, zhai: boolean): BidProblem | null {
  if (face < 1 || face > 6 || quantity < 1) return { code: "raise" };
  const rule = ruleProblem(state, quantity, face, zhai);
  if (rule) return rule;
  const total = totalDice(state);
  return quantity > total ? { code: "total", total } : null;
}

/** Whether (quantity, face, zhai) is a legal next bid. */
export function isValidBid(state: LiarsDiceState, quantity: number, face: number, zhai: boolean): boolean {
  return bidProblem(state, quantity, face, zhai) === null;
}

/** The fewest dice of `face`, of this kind, the rules allow next (maybe
 *  more than the table holds), or null if that kind can't be called on
 *  the face at all (kaizhai 1s never). Every rule set is monotone in
 *  the count. */
export function leastCall(state: LiarsDiceState, face: number, zhai: boolean): number | null {
  // a call of 1s is always zhai: there's no kaizhai call of them
  if (face === 1 && !zhai) return null;
  for (let quantity = 1; quantity <= 10 * DICE_EACH + 1; quantity++) {
    const problem = ruleProblem(state, quantity, face, zhai);
    if (problem === null) return quantity;
    if (NEVER.has(problem.code)) return null;
  }
  return null;
}

/** The smallest opening of a kind for the players still in. */
export function openingMin(state: LiarsDiceState, zhai: boolean): number {
  const players = activeSeats(state).length;
  const calling = callingOf(state);
  if (calling === "jijiji") return thresholds(players)[zhai ? 1 : 2];
  if (calling === "nozhai") return players + 1;
  return openingFor(players, zhai);
}

/** One of the calls the plinth offers: exactly what a tap sends. */
export interface CallChoice {
  /** null: no count of this kind can be called on the face. */
  quantity: number | null;
  face: number;
  zhai: boolean;
  /** Why it's greyed, or null when it can be called. */
  problem: BidProblem | null;
  /** The 几几几 opening's call of 1s, whatever face is picked. */
  ones?: boolean;
}

/** What the call scene offers for a face and the count I've nudged to:
 *  the faces to pick from, the main call's count (shown between − and
 *  +), how far it goes, and each call button with its exact call. The
 *  buttons rise together with the count, each from its own least. */
export interface CallPlan {
  faces: number[];
  face: number;
  /** The least the main call may be (− stops here). */
  base: number;
  /** The main call's count, shown between − and +. */
  count: number;
  /** Dice on the table (+ stops here). */
  total: number;
  choices: CallChoice[];
}

export function callPlan(state: LiarsDiceState, face: number, wanted = 0): CallPlan {
  const kaizhai = isKaizhai(state);
  const total = totalDice(state);
  // 几几几 opens with a button of its own for 1s
  const ones = state.bid === null && callingOf(state) === "jijiji";
  const faces = kaizhai || ones ? [2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
  const f = faces.includes(face) ? face : faces[faces.length - 1];
  // the kinds offered, the main one (whose count is shown) first
  const kinds = kaizhai ? [false] : [true, false];
  const leasts = kinds.map((zhai) => leastCall(state, f, zhai));
  const base = leasts[0] ?? 1;
  const count = Math.max(base, Math.min(wanted, total));
  const step = count - base;
  const choice = (least: number | null, cf: number, zhai: boolean): CallChoice => {
    const quantity = least === null ? null : least + step;
    return {
      quantity,
      face: cf,
      zhai,
      problem: quantity === null ? { code: cf === 1 ? "onesZhai" : "noZhai" } : bidProblem(state, quantity, cf, zhai),
    };
  };
  const choices = kinds.map((zhai, i) => choice(leasts[i], f, zhai));
  if (ones) choices.unshift({ ...choice(leastCall(state, 1, true), 1, true), ones: true });
  return { faces, face: f, base, count, total, choices };
}

/** The face to start the picker on: the one I hold most of (1s count
 *  for every face, so they don't decide), the higher on a tie. */
export function favouriteFace(dice: number[]): number {
  let best = 6;
  let most = -1;
  for (let face = 6; face >= 2; face--) {
    const n = dice.filter((d) => d === face).length;
    if (n > most) {
      best = face;
      most = n;
    }
  }
  return best;
}

/** The face the picker opens on: the one just called (to raise it), else
 *  the one I hold most of — or, when no call can be made on it, the first
 *  face from the top that has one. */
export function startFace(state: LiarsDiceState): number {
  const callable = (face: number) => callPlan(state, face).choices.some((c) => !c.ones && c.problem === null);
  const first = state.bid && state.bid.face !== 1 ? state.bid.face : favouriteFace(state.myDice);
  if (callable(first)) return first;
  return [1, 6, 5, 4, 3, 2].find((face) => callPlan(state, face).face === face && callable(face)) ?? first;
}

/** How many dice in one cup count for a face, plus its bonus. */
export function myCount(dice: number[], face: number, zhai: boolean): number {
  const found = dice.filter((d) => d === face || (!zhai && face !== 1 && d === 1)).length;
  return found + leopardBonus(dice, face, zhai);
}

/** A cup whose five dice all count for a face counts extra: 豹子 (two 1s
 *  and three 3s, when 1s are wild) one more, six; 大豹子 (five of the very
 *  same number) two more, seven. */
export function leopardBonus(dice: number[], face: number, zhai: boolean): number {
  if (!isLeopard(dice, face, zhai)) return 0;
  return dice.every((d) => d === dice[0]) ? 2 : 1;
}

/** Whether a cup is 豹子 for this face: all five dice count. */
export function isLeopard(dice: number[], face: number, zhai: boolean): boolean {
  return (
    dice.length === 5 &&
    dice.every((d) => d === face || (!zhai && face !== 1 && d === 1))
  );
}

export function currentSeat(state: LiarsDiceState): number {
  if (state.phase === "finished") return -1;
  if (state.phase === "split") return state.bid?.seat ?? -1;
  return state.turn;
}

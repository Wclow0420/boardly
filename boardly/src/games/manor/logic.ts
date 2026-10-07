// Client-side Midnight Manor helpers — mirrors backend
// (backend/app/games/manor/game.py). The backend is authoritative and
// only ever sends this player's *view*: other players' roles, choices
// and notes never reach the client.

export type Role = "butler" | "guest" | "intruder";
export type Side = "good" | "evil";
export type Phase = "move" | "act" | "gathering" | "guess" | "finished";
export type Item = "knife" | "candlestick" | "poison";
export type Action =
  | "wait"
  | "guard"
  | "attack"
  | "take"
  | "fix"
  | "break"
  | "search"
  | "watch"
  | "escort";
export type WinReason =
  | "dawn"
  | "caught"
  | "killed"
  | "butlerFound"
  | "abandoned";

/** Room ids by index on the 3×3 floor plan. */
export const ROOMS = [
  "study",
  "library",
  "bedroom",
  "kitchen",
  "hall",
  "security",
  "cellar",
  "foyer",
  "garden",
] as const;
export type RoomId = (typeof ROOMS)[number];

export const ROOM_EMOJI: Record<RoomId, string> = {
  study: "📚",
  library: "📖",
  bedroom: "🛏️",
  kitchen: "🍳",
  hall: "🕰️",
  security: "🖥️",
  cellar: "🍷",
  foyer: "🚪",
  garden: "🌿",
};

export const SECURITY = 5;
/** Where each weapon lies when the night starts. */
export const ITEM_HOME: Record<Item, number> = { knife: 3, candlestick: 1, poison: 6 };
export const ITEM_EMOJI: Record<Item, string> = {
  knife: "🔪",
  candlestick: "🕯️",
  poison: "☠️",
};

export interface Order {
  room?: number;
  action?: Action;
  item?: Item;
  target?: number | null;
}

export interface Footage {
  room: number;
  seats: number[];
  entered: number[];
  left: number[];
  owner: boolean;
  ownerEntered: boolean;
  ownerLeft: boolean;
  actions: { seat: number; action: Action; item?: Item; target?: number }[];
}

/** One hour in a player's private notebook. */
export interface LogEntry {
  hour: number;
  room: number;
  with: number[];
  owner: boolean;
  action: Order;
  took?: Item | null;
  attack?: "hit" | "blocked";
  search?: { target: number; item: Item | null };
  footage?: Footage[];
}

export type ManorEvent =
  | { hour: number; kind: "scream"; room: number }
  | { hour: number; kind: "cameraOn" | "cameraOff"; room: number }
  | {
      hour: number;
      kind: "gathering";
      votes: (number | null)[];
      locked: number | null;
    };

export interface ManorState {
  numPlayers: number;
  phase: Phase;
  /** 0 = 10pm … 7 = 5am; 8 = dawn. */
  hour: number;
  hours: number;
  ownerHp: number;
  ownerMaxHp: number;
  /** By room: null = no camera, true = working, false = broken. */
  cameras: (boolean | null)[];
  events: ManorEvent[];
  locked: number[];
  /** By seat: has made this phase's choice (not which). */
  ready: boolean[];
  myRole: Role | null;
  myRoom: number | null;
  myItem: Item | null;
  myOrder: Order | null;
  roommates: number[];
  ownerHere: boolean;
  /** Butler only: where the old man was when this hour began. */
  ownerSeenAt: number | null;
  followingMe: boolean;
  roomItems: Item[];
  log: LogEntry[];
  /** Intruders (and everyone at dawn): who the intruders are. */
  intruders: number[] | null;
  ringleader: number | null;
  guessTarget: number | null;
  winner: Side | null;
  winReason: WinReason | null;
  roles: Role[] | null;
  ownerRoom: number | null;
}

export const PLAYER_COUNTS = [4, 5, 6, 7, 8];
export const INTRUDERS_BY_COUNT: Record<number, number> = {
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
};

export function sideOf(role: Role): Side {
  return role === "intruder" ? "evil" : "good";
}

/** Rooms one step up/down/left/right. */
export function neighbors(room: number): number[] {
  const row = Math.floor(room / 3);
  const col = room % 3;
  const out: number[] = [];
  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < 3 && c >= 0 && c < 3) out.push(r * 3 + c);
  }
  return out;
}

/** Where I may go this hour: stay, or a neighbouring room. */
export function reachable(room: number | null): number[] {
  return room === null ? [] : [room, ...neighbors(room)].sort((a, b) => a - b);
}

export type Task = "move" | "act" | "accuse" | "guess";

/** What this player has to do right now, if anything. */
export function taskFor(state: ManorState, mySeat: number): Task | null {
  if (mySeat < 0 || state.phase === "finished") return null;
  if (state.phase === "guess") return state.ringleader === mySeat ? "guess" : null;
  if (state.myRoom === null || state.ready[mySeat]) return null;
  if (state.phase === "move") return "move";
  if (state.phase === "act") return "act";
  return "accuse";
}

/** Seat the shared screen shows as "up": only the dawn guess has one. */
export function currentSeat(state: ManorState): number {
  return state.phase === "guess" ? (state.ringleader ?? -1) : -1;
}

export interface ActionChoice {
  action: Action;
  item?: Item;
}

/** The actions this room and this player allow right now. */
export function availableActions(state: ManorState): ActionChoice[] {
  const room = state.myRoom;
  if (room === null) return [];
  const evil = state.myRole === "intruder";
  const camera = state.cameras[room];
  const out: ActionChoice[] = [];

  if (state.ownerHere) {
    out.push({ action: "guard" });
    if (evil && state.myItem !== null) out.push({ action: "attack" });
    out.push({ action: "escort" });
  }
  for (const item of state.roomItems) out.push({ action: "take", item });
  if (camera === false) out.push({ action: "fix" });
  if (camera === true && evil) out.push({ action: "break" });
  if (room === SECURITY) out.push({ action: "watch" });
  if (state.roommates.length > 0) out.push({ action: "search" });
  out.push({ action: "wait" });
  return out;
}

/** Players who can still be voted on (not locked up), other than me. */
export function suspects(state: ManorState, mySeat: number): number[] {
  return Array.from({ length: state.numPlayers }, (_, s) => s).filter(
    (s) => s !== mySeat && !state.locked.includes(s)
  );
}

/** Who the ringleader may name at dawn: anyone who isn't an intruder. */
export function guessTargets(state: ManorState): number[] {
  const evil = state.intruders ?? [];
  return Array.from({ length: state.numPlayers }, (_, s) => s).filter(
    (s) => !evil.includes(s)
  );
}

/** Seats still due to choose this phase. */
export function waitingOn(state: ManorState): number[] {
  if (state.phase === "guess") return state.ringleader !== null ? [state.ringleader] : [];
  if (state.phase === "finished") return [];
  return Array.from({ length: state.numPlayers }, (_, s) => s).filter(
    (s) => !state.locked.includes(s) && !state.ready[s]
  );
}

/** Screams per room, for the map. */
export function screamsByRoom(events: ManorEvent[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const e of events) {
    if (e.kind === "scream") out[e.room] = (out[e.room] ?? 0) + 1;
  }
  return out;
}

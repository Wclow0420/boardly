// Client-side Seal the Manor (守夜) helpers — mirrors backend
// (backend/app/games/nightwatch/game.py). The backend is authoritative
// and only ever sends this player's *view*: other players' roles,
// positions, choices and notes never reach the client.

export type Role =
  | "prophet"
  | "apprentice"
  | "tracker"
  | "keeper"
  | "watcher"
  | "double"
  | "hermit"
  | "possessed";
export type Side = "good" | "evil";
export type Phase =
  | "announce"
  | "patrol"
  | "room"
  | "team"
  | "vote"
  | "mission"
  | "assassinate"
  | "finished";
export type NightEvent =
  | "blackout"
  | "collapse"
  | "secretDoor"
  | "storm"
  | "insomnia"
  | "echo"
  | "fog"
  | "calm";
export type WinReason =
  | "missions"
  | "assassination"
  | "failedMissions"
  | "rejections"
  | "abandoned";

/** Room ids by index on the 3×3 floor plan. */
export const ROOMS = [
  "belltower",
  "study",
  "chapel",
  "gallery",
  "hall",
  "dining",
  "cellar",
  "kitchen",
  "garden",
] as const;
export type RoomId = (typeof ROOMS)[number];
export const HALL = 4;

export const ROOM_EMOJI: Record<RoomId, string> = {
  belltower: "🔔",
  study: "📜",
  chapel: "⛪",
  gallery: "🖼️",
  hall: "🕯️",
  dining: "🍷",
  cellar: "🕳️",
  kitchen: "🍲",
  garden: "🌙",
};

/** How many people must be in a room, counting you, for its function
 *  to work; null when any number will do. The Hall has no function. */
export const ROOM_NEEDS: Record<RoomId, 1 | 2 | null> = {
  belltower: 1,
  study: 1,
  chapel: null,
  gallery: null,
  hall: null,
  dining: 2,
  cellar: null,
  kitchen: null,
  garden: null,
};

/** Each room's own colour: its name is written in it wherever the name
 *  appears, so notes and the map can be read at a glance. Chosen to be
 *  told apart on the game's dark table. */
export const ROOM_COLOR: Record<RoomId, string> = {
  belltower: "#FFB733",
  study: "#8CCBFF",
  chapel: "#F6F3EA",
  gallery: "#B58CFF",
  hall: "#F0605D",
  dining: "#FF8442",
  cellar: "#7F8594",
  kitchen: "#E3CFA4",
  garden: "#6FCF8E",
};

export const EVENT_EMOJI: Record<NightEvent, string> = {
  blackout: "🌑",
  collapse: "🧱",
  secretDoor: "🚪",
  storm: "⛈️",
  insomnia: "😵",
  echo: "📣",
  fog: "🌫️",
  calm: "🍃",
};

export const ROLE_EMOJI: Record<Role, string> = {
  prophet: "🔮",
  apprentice: "📖",
  tracker: "👣",
  keeper: "🗝️",
  watcher: "🏮",
  double: "🎭",
  hermit: "🌫️",
  possessed: "👻",
};

export const GOOD_ROLES: Role[] = [
  "prophet",
  "apprentice",
  "tracker",
  "keeper",
  "watcher",
];
export const EVIL_ROLES: Role[] = ["double", "hermit", "possessed"];
export const ALL_ROLES: Role[] = [...GOOD_ROLES, ...EVIL_ROLES];

export const ROLE_SETS: Record<number, Role[]> = {
  5: ["prophet", "apprentice", "tracker", "double", "hermit"],
  6: ["prophet", "apprentice", "tracker", "keeper", "double", "hermit"],
  7: ["prophet", "apprentice", "tracker", "keeper", "double", "hermit", "possessed"],
  8: [
    "prophet", "apprentice", "tracker", "keeper", "watcher",
    "double", "hermit", "possessed",
  ],
  9: [
    "prophet", "apprentice", "tracker", "keeper", "watcher", "watcher",
    "double", "hermit", "possessed",
  ],
  10: [
    "prophet", "apprentice", "tracker", "keeper", "watcher", "watcher",
    "double", "hermit", "possessed", "possessed",
  ],
};

export const MISSION_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

export interface Order {
  lock?: number[];
  room?: number;
  fake?: number;
  track?: number;
  target?: number;
  letters?: string[];
  pray?: boolean;
}

export type PrayerResult = "cancelled" | "none" | "noCards";

/** One night in the Chapel's record, read by anyone who enters. */
export interface ChapelRecord {
  round: number;
  prayed: boolean;
  /** null when nobody prayed. */
  result: PrayerResult | null;
}

/** One line of a player's private notebook. */
export type Note =
  | {
      round: number;
      kind: "patrol";
      room: number;
      /** Who I saw here; null in a blackout. */
      seen: number[] | null;
      company: boolean;
      /** The Double's decoy room tonight. */
      fake: number | null;
      /** The Tracker followed this seat. */
      tracked: number | null;
      /** Why the room's function didn't work for me. */
      blocked: "hall" | "mission" | "repeat" | null;
    }
  | { round: number; kind: "bell" | "cellar" | "pray" }
  | { round: number; kind: "dining"; seat: number | null; camp: Side }
  | { round: number; kind: "garden"; counts: number[] }
  | { round: number; kind: "study"; seat: number; card: "success" | "fail" }
  | { round: number; kind: "kitchen"; seat: number; room: number }
  | { round: number; kind: "letter"; texts: string[] }
  | { round: number; kind: "prayer"; result: PrayerResult }
  | { round: number; kind: "chapelRecord"; records: ChapelRecord[] }
  | { round: number; kind: "collapse"; room: number };

export type TimelineEntry =
  | { round: number; kind: "night"; event: NightEvent }
  | { round: number; kind: "collapse"; room: number }
  | { round: number; kind: "door" | "lock"; rooms: number[] }
  | { round: number; kind: "letters"; texts: string[] };

export interface MissionResult {
  round: number;
  room: number;
  team: number[];
  /** Team members who never made it to the mission room. */
  missing: number[];
  /** Fail cards revealed; null when the mission failed outright. */
  fails: number | null;
  success: boolean;
}

export interface Proposal {
  round: number;
  leader: number;
  /** The leader rang the Bell Tower to cut in. */
  bell: boolean;
  team: number[];
  votes: boolean[];
  approved: boolean;
}

export interface Known {
  seat: number;
  as: "evil" | "prophet";
}

export interface NightwatchState {
  numPlayers: number;
  phase: Phase;
  round: number;
  rounds: number;
  missionRoom: number;
  nextMissionRoom: number | null;
  missionSizes: number[];
  failsRequired: number[];
  event: NightEvent | null;
  collapsed: number[];
  doors: number[][];
  lockedDoor: number[] | null;
  leader: number | null;
  nextLeader: number;
  rejections: number;
  team: number[];
  results: MissionResult[];
  history: Proposal[];
  timeline: TimelineEntry[];
  rolesInGame: Role[];
  /** By seat: has made this phase's choice (not which). */
  ready: boolean[];
  voted: boolean[];
  missionPlayed: number[];
  myRole: Role | null;
  known: Known[];
  /** The evil player who names the Prophet (shown to evil, then all). */
  assassinSeat: number | null;
  evilSeats: number[] | null;
  myRoom: number | null;
  myFake: number | null;
  /** The room function open to me this round (room phase only). */
  myFn: RoomId | null;
  abilityLeft: number;
  lastUsed: number | null;
  /** The Cellar's passage: any room on this patrol. */
  freeMove: boolean;
  patrolRooms: number[];
  doorOptions: number[][];
  studyOptions: number[];
  letterLimit: number;
  myOrder: Order | null;
  myVote: boolean | null;
  myCard: "success" | "fail" | null;
  log: Note[];
  assassinTarget: number | null;
  winner: Side | null;
  winReason: WinReason | null;
  roles: Role[] | null;
  positions: number[] | null;
}

export function sideOf(role: Role): Side {
  return EVIL_ROLES.includes(role) ? "evil" : "good";
}

export const PLAYER_COUNTS = [5, 6, 7, 8, 9, 10];

/** Fail cards needed to fail a mission: two on the 4th with 7+. */
export function failsNeeded(numPlayers: number, round: number): number {
  return numPlayers >= 7 && round === 3 ? 2 : 1;
}

export type Task =
  | "announce"
  | "patrol"
  | "room"
  | "propose"
  | "vote"
  | "mission"
  | "assassinate";

/** What this player has to do right now, if anything. */
export function taskFor(state: NightwatchState, mySeat: number): Task | null {
  if (mySeat < 0 || mySeat >= state.numPlayers) return null;
  switch (state.phase) {
    case "announce":
    case "patrol":
    case "room":
      return state.ready[mySeat] ? null : state.phase;
    case "team":
      return state.leader === mySeat ? "propose" : null;
    case "vote":
      return state.voted[mySeat] ? null : "vote";
    case "mission":
      return state.team.includes(mySeat) && !state.missionPlayed.includes(mySeat)
        ? "mission"
        : null;
    case "assassinate":
      return state.assassinSeat === mySeat ? "assassinate" : null;
    default:
      return null;
  }
}

/** Seat the shared screen shows as "up": the leader or the assassin. */
export function currentSeat(state: NightwatchState): number {
  if (state.phase === "team") return state.leader ?? -1;
  if (state.phase === "assassinate") return state.assassinSeat ?? -1;
  return -1;
}

/** Seats still due to act this phase. */
export function waitingOn(state: NightwatchState): number[] {
  const seats = Array.from({ length: state.numPlayers }, (_, s) => s);
  switch (state.phase) {
    case "announce":
    case "patrol":
    case "room":
      return seats.filter((s) => !state.ready[s]);
    case "team":
      return state.leader !== null ? [state.leader] : [];
    case "vote":
      return seats.filter((s) => !state.voted[s]);
    case "mission":
      return state.team.filter((s) => !state.missionPlayed.includes(s));
    case "assassinate":
      return state.assassinSeat !== null ? [state.assassinSeat] : [];
    default:
      return [];
  }
}

/** Whether the Tracker can follow someone this patrol. */
export function canTrack(state: NightwatchState): boolean {
  return (
    state.myRole === "tracker" && state.abilityLeft > 0 && state.event !== "storm"
  );
}

/** Whether the Double can leave a decoy this patrol. */
export function canDecoy(state: NightwatchState): boolean {
  return state.myRole === "double" && state.abilityLeft > 0 && state.patrolRooms.length > 1;
}

/** Rooms the decoy may stand in, given the real room. */
export function decoyRooms(state: NightwatchState, real: number | undefined): number[] {
  return state.patrolRooms.filter((r) => r !== real);
}

/** Who the assassin may name: anyone who isn't evil. */
export function assassinTargets(state: NightwatchState): number[] {
  const evil = state.evilSeats ?? [];
  return Array.from({ length: state.numPlayers }, (_, s) => s).filter(
    (s) => !evil.includes(s)
  );
}

/** Everyone but me. */
export function others(state: NightwatchState, mySeat: number): number[] {
  return Array.from({ length: state.numPlayers }, (_, s) => s).filter(
    (s) => s !== mySeat
  );
}

/** Team size for this round's mission. */
export function teamSize(state: NightwatchState): number {
  return state.missionSizes[state.round] ?? 0;
}

/** Add or remove a seat from a team pick, never over the size. */
export function toggleTeam(team: number[], seat: number, size: number): number[] {
  if (team.includes(seat)) return team.filter((s) => s !== seat);
  if (team.length >= size) return team;
  return [...team, seat].sort((a, b) => a - b);
}

/** My notes, grouped by round, newest round first. */
export function notesByRound(log: Note[]): { round: number; notes: Note[] }[] {
  const groups = new Map<number, Note[]>();
  for (const note of log) {
    const list = groups.get(note.round) ?? [];
    list.push(note);
    groups.set(note.round, list);
  }
  return [...groups]
    .sort((a, b) => b[0] - a[0])
    .map(([round, notes]) => ({ round, notes }));
}

/** This round's anonymous letters (shown when discussion starts). */
export function lettersFor(state: NightwatchState, round: number): string[] {
  return state.timeline
    .filter((e): e is Extract<TimelineEntry, { kind: "letters" }> =>
      e.kind === "letters" && e.round === round
    )
    .flatMap((e) => e.texts);
}

/** Who I saw after this round's patrol, if I've patrolled. */
export function tonightsPatrol(
  state: NightwatchState
): Extract<Note, { kind: "patrol" }> | null {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const note = state.log[i];
    if (note.kind === "patrol") return note.round === state.round ? note : null;
  }
  return null;
}

/** Mission track: each round's result, or null while still to come. */
export function missionTrack(state: NightwatchState): (MissionResult | null)[] {
  return Array.from(
    { length: state.rounds },
    (_, r) => state.results.find((x) => x.round === r) ?? null
  );
}

/** "Room A ↔ Room B" for a door. */
export function doorLabel(rooms: number[], roomName: (room: number) => string): string {
  return rooms.map(roomName).join(" ↔ ");
}

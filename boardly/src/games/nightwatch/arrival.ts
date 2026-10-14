// How the player came into the room they stand in, so the room can show
// them walking in. Only the player's own way is ever worked out: where
// anyone else came from is secret.

import { HALL, type NightwatchState } from "./logic";

/** How the player got here from `from`. */
export type Entry =
  /** a step through the door facing the room left behind */
  | "step"
  /** through a secret door, out of a corner */
  | "secret"
  /** from further than a door leads: the cellar's passage, tracking */
  | "far"
  /** stayed where they were */
  | "stay"
  /** moved to the Hall when their room fell in */
  | "collapse";

export interface Arrival {
  /** One move, so it is shown once. */
  key: string;
  from: number;
  how: Entry;
}

const COLS = 3;

/** How a move from one room to another is made. */
export function entryBetween(from: number, to: number, doors: number[][]): Entry {
  if (from === to) return "stay";
  const dc = (to % COLS) - (from % COLS);
  const dr = Math.floor(to / COLS) - Math.floor(from / COLS);
  if (dc === 0 || dr === 0) return "step";
  const joined = doors.some((door) => door.includes(from) && door.includes(to));
  return Math.abs(dc) === 1 && Math.abs(dr) === 1 && joined ? "secret" : "far";
}

/** Where the player was when night `round` began. */
function startOf(state: NightwatchState, mySeat: number, round: number): number {
  if (state.log.some((note) => note.kind === "collapse" && note.round === round)) return HALL;
  if (round === 0) return HALL;
  const mission = state.results.find((result) => result.round === round - 1);
  if (mission?.team.includes(mySeat) && !mission.missing.includes(mySeat)) return mission.room;
  const patrol = state.log.find((note) => note.kind === "patrol" && note.round === round - 1);
  return patrol?.kind === "patrol" ? patrol.room : HALL;
}

/** The player's latest move into the room they are in, if the game has
 *  just made one: walking to the mission room, the night's patrol, or
 *  being sent to the Hall by a collapse. */
export function arrivalOf(state: NightwatchState, mySeat: number): Arrival | null {
  const room = state.myRoom;
  if (room === null || state.phase === "finished") return null;
  const round = state.round;
  const patrol = state.log.find((note) => note.kind === "patrol" && note.round === round);
  const patrolRoom = patrol?.kind === "patrol" ? patrol.room : null;

  if (
    state.phase === "mission" &&
    state.team.includes(mySeat) &&
    room === state.missionRoom &&
    patrolRoom !== null &&
    patrolRoom !== room
  ) {
    return {
      key: `${round}:mission:${room}`,
      from: patrolRoom,
      how: entryBetween(patrolRoom, room, state.doors),
    };
  }
  if (patrolRoom === room) {
    const from = startOf(state, mySeat, round);
    return { key: `${round}:patrol:${room}`, from, how: entryBetween(from, room, state.doors) };
  }
  const collapse = state.log.find((note) => note.kind === "collapse" && note.round === round);
  if (collapse?.kind === "collapse" && room === HALL) {
    return { key: `${round}:collapse`, from: collapse.room, how: "collapse" };
  }
  return null;
}

// What the stage's header (the arch, the tags under it, the night's event
// medallion) may show on this device: the night as far as this player has
// watched it. The server moves on the moment a vote or a mission is
// settled (a mission's result, the next night, its event, the rejection
// count), but the header must not tell any of it before the lanterns have
// revealed it here: until the reveal's set piece is done (the counters in
// useSetPieces), it holds the night as it stood before.

import type { MissionResult, NightEvent, NightwatchState, Phase } from "./logic";

/** An event of an earlier night whose effect lasts: a room caved in, a
 *  secret door opened. */
export type Lasting = { kind: "collapse"; room: number } | { kind: "door"; rooms: number[] };

export interface ShownNight {
  /** The night shown (0-based). */
  round: number;
  phase: Phase;
  /** Still being played (no ending yet, as far as this device knows). */
  live: boolean;
  /** Each night's result, or null while still to come (or not yet
   *  revealed here). */
  track: (MissionResult | null)[];
  rejections: number;
  missionRoom: number;
  nextMissionRoom: number | null;
  teamSize: number;
  /** The night's event, null for none. */
  event: NightEvent | null;
  /** What earlier nights' events left behind. */
  lasting: Lasting[];
  /** The header is behind the server (a reveal is still to play). */
  held: boolean;
}

/** The night as this device may show it. `seen` is how many votes and
 *  missions have been revealed here (null for one not counted yet: then
 *  nothing is held, as joining late doesn't replay the past). */
export function shownNight(
  state: NightwatchState,
  seen: { votes: number | null; missions: number | null },
): ShownNight {
  const votesSeen = seen.votes ?? state.history.length;
  const missionsSeen = seen.missions ?? state.results.length;
  const voteHeld = state.history.length > votesSeen ? state.history[state.history.length - 1] : null;
  const missionHeld = state.results.length > missionsSeen ? state.results[state.results.length - 1] : null;
  const held = voteHeld !== null || missionHeld !== null;
  const round = held
    ? Math.min(voteHeld?.round ?? Infinity, missionHeld?.round ?? Infinity)
    : state.round;
  const history = voteHeld ? state.history.slice(0, -1) : state.history;
  const track = Array.from(
    { length: state.rounds },
    (_, r) => state.results.find((x) => x.round === r && (!held || x.round < round)) ?? null,
  );
  const eventOf = (r: number): NightEvent | null =>
    r === state.round
      ? state.event
      : (state.timeline.find((e) => e.kind === "night" && e.round === r) as { event: NightEvent } | undefined)?.event ?? null;
  const lasting: Lasting[] = state.timeline.flatMap((e): Lasting[] =>
    e.round >= round ? [] : e.kind === "collapse" ? [{ kind: "collapse", room: e.room }] : e.kind === "door" ? [{ kind: "door", rooms: e.rooms }] : [],
  );
  return {
    round,
    phase: !held ? state.phase : voteHeld ? "vote" : "mission",
    live: held || state.phase !== "finished",
    track,
    rejections: held
      ? history.filter((p) => p.round === round && !p.approved).length
      : state.rejections,
    missionRoom: missionHeld && missionHeld.round === round ? missionHeld.room : state.round === round ? state.missionRoom : (state.results.find((x) => x.round === round)?.room ?? state.missionRoom),
    nextMissionRoom: state.round === round ? state.nextMissionRoom : state.round === round + 1 ? state.missionRoom : null,
    teamSize: state.missionSizes[round] ?? 0,
    event: eventOf(round),
    lasting,
    held,
  };
}

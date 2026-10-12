import {
  MISSION_SIZES,
  ROLE_SETS,
  assassinTargets,
  canDecoy,
  canTrack,
  currentSeat,
  decoyRooms,
  failsNeeded,
  lettersFor,
  missionTrack,
  notesByRound,
  sideOf,
  taskFor,
  toggleTeam,
  tonightsPatrol,
  waitingOn,
  type NightwatchState,
  type Note,
} from "../logic";

function view(overrides: Partial<NightwatchState> = {}): NightwatchState {
  return {
    numPlayers: 5,
    phase: "patrol",
    round: 0,
    rounds: 5,
    missionRoom: 1,
    nextMissionRoom: 8,
    missionSizes: [2, 3, 2, 3, 3],
    failsRequired: [1, 1, 1, 1, 1],
    event: null,
    collapsed: [],
    doors: [],
    lockedDoor: null,
    leader: null,
    nextLeader: 0,
    rejections: 0,
    team: [],
    results: [],
    history: [],
    timeline: [],
    rolesInGame: ROLE_SETS[5],
    ready: [false, false, false, false, false],
    voted: [false, false, false, false, false],
    missionPlayed: [],
    myRole: "watcher",
    known: [],
    assassinSeat: null,
    evilSeats: null,
    myRoom: 4,
    myFake: null,
    myFn: null,
    abilityLeft: 0,
    lastUsed: null,
    freeMove: false,
    patrolRooms: [1, 3, 4, 5, 7],
    doorOptions: [],
    studyOptions: [],
    letterLimit: 1,
    myOrder: null,
    myVote: null,
    myCard: null,
    log: [],
    assassinTarget: null,
    winner: null,
    winReason: null,
    roles: null,
    positions: null,
    ...overrides,
  };
}

describe("setup tables", () => {
  it("deals the rulebook's sides", () => {
    const evil = (n: number) => ROLE_SETS[n].filter((r) => sideOf(r) === "evil").length;
    expect([5, 6, 7, 8, 9, 10].map(evil)).toEqual([2, 2, 3, 3, 3, 4]);
    expect(MISSION_SIZES[7]).toEqual([2, 3, 3, 4, 4]);
  });

  it("needs two fails on the fourth mission with seven or more", () => {
    expect(failsNeeded(7, 3)).toBe(2);
    expect(failsNeeded(6, 3)).toBe(1);
    expect(failsNeeded(10, 4)).toBe(1);
  });
});

describe("taskFor", () => {
  it("asks everyone in the simultaneous phases until they answer", () => {
    for (const phase of ["announce", "patrol", "room"] as const) {
      expect(taskFor(view({ phase }), 0)).toBe(phase);
      expect(taskFor(view({ phase, ready: [true, false, false, false, false] }), 0)).toBeNull();
    }
  });

  it("gives the team to the leader and the cards to the team", () => {
    expect(taskFor(view({ phase: "team", leader: 2 }), 2)).toBe("propose");
    expect(taskFor(view({ phase: "team", leader: 2 }), 0)).toBeNull();
    expect(currentSeat(view({ phase: "team", leader: 2 }))).toBe(2);
    const mission = view({ phase: "mission", team: [0, 3], missionPlayed: [3] });
    expect(taskFor(mission, 0)).toBe("mission");
    expect(taskFor(mission, 3)).toBeNull();
    expect(taskFor(mission, 1)).toBeNull();
    expect(waitingOn(mission)).toEqual([0]);
  });

  it("asks every voter once", () => {
    const vote = view({ phase: "vote", voted: [true, false, true, false, false] });
    expect(taskFor(vote, 0)).toBeNull();
    expect(taskFor(vote, 1)).toBe("vote");
    expect(waitingOn(vote)).toEqual([1, 3, 4]);
  });

  it("gives the last word to the assassin", () => {
    const end = view({ phase: "assassinate", assassinSeat: 3, evilSeats: [3, 4] });
    expect(taskFor(end, 3)).toBe("assassinate");
    expect(taskFor(end, 4)).toBeNull();
    expect(currentSeat(end)).toBe(3);
    expect(assassinTargets(end)).toEqual([0, 1, 2]);
  });

  it("asks nothing of spectators or a finished game", () => {
    expect(taskFor(view(), -1)).toBeNull();
    expect(taskFor(view({ phase: "finished" }), 0)).toBeNull();
  });
});

describe("abilities", () => {
  it("lets the Tracker follow unless the storm is blowing", () => {
    expect(canTrack(view({ myRole: "tracker", abilityLeft: 2 }))).toBe(true);
    expect(canTrack(view({ myRole: "tracker", abilityLeft: 0 }))).toBe(false);
    expect(canTrack(view({ myRole: "tracker", abilityLeft: 1, event: "storm" }))).toBe(false);
  });

  it("puts the Double's decoy in another reachable room", () => {
    const double = view({ myRole: "double", abilityLeft: 2 });
    expect(canDecoy(double)).toBe(true);
    expect(decoyRooms(double, 4)).toEqual([1, 3, 5, 7]);
    expect(canDecoy({ ...double, patrolRooms: [4] })).toBe(false);
  });
});

describe("team picks", () => {
  it("adds and removes seats without going over the size", () => {
    expect(toggleTeam([], 3, 2)).toEqual([3]);
    expect(toggleTeam([3], 1, 2)).toEqual([1, 3]);
    expect(toggleTeam([1, 3], 4, 2)).toEqual([1, 3]);
    expect(toggleTeam([1, 3], 1, 2)).toEqual([3]);
  });
});

describe("records", () => {
  const patrol = (round: number, room: number): Note => ({
    round,
    kind: "patrol",
    room,
    seen: [],
    company: false,
    fake: null,
    tracked: null,
    blocked: null,
  });

  it("groups my notes by night, newest first", () => {
    const log: Note[] = [patrol(0, 1), { round: 0, kind: "pray" }, patrol(1, 2)];
    expect(notesByRound(log).map((g) => [g.round, g.notes.length])).toEqual([
      [1, 1],
      [0, 2],
    ]);
  });

  it("finds tonight's patrol only once I've patrolled", () => {
    expect(tonightsPatrol(view({ round: 1, log: [patrol(0, 1)] }))).toBeNull();
    expect(tonightsPatrol(view({ round: 1, log: [patrol(0, 1), patrol(1, 2)] }))?.room).toBe(2);
  });

  it("collects a night's letters and the mission track", () => {
    const state = view({
      round: 1,
      timeline: [
        { round: 0, kind: "letters", texts: ["a"] },
        { round: 1, kind: "night", event: "echo" },
        { round: 1, kind: "letters", texts: ["b", "c"] },
      ],
      results: [{ round: 0, room: 1, team: [0, 1], missing: [], fails: 0, success: true }],
    });
    expect(lettersFor(state, 1)).toEqual(["b", "c"]);
    expect(missionTrack(state).map((r) => r?.success ?? null)).toEqual([
      true,
      null,
      null,
      null,
      null,
    ]);
  });
});

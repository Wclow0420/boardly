import {
  PLAYER_COUNTS,
  QUEST_SIZES,
  ROLE_SETS,
  failsNeeded,
  assassinTargets,
  currentSeat,
  newReveals,
  pendingAction,
  questScore,
  seenOf,
  sideOf,
  teamSize,
  toggleSeat,
  type AvalonState,
} from "../logic";

function makeState(overrides: Partial<AvalonState> = {}): AvalonState {
  return {
    numPlayers: 5,
    phase: "team",
    quest: 0,
    leader: 0,
    rejections: 0,
    team: [],
    questSizes: [2, 3, 2, 3, 3],
    failsRequired: [1, 1, 1, 1, 1],
    questResults: [],
    history: [],
    rolesInGame: ["assassin", "merlin", "morgana", "percival", "servant"],
    voted: [false, false, false, false, false],
    questPlayed: [],
    myVote: null,
    myCard: null,
    myRole: "servant",
    known: [],
    evilSeats: null,
    assassinSeat: null,
    assassinTarget: null,
    winner: null,
    winReason: null,
    roles: null,
    ...overrides,
  };
}

describe("sideOf", () => {
  it("splits roles into the two teams", () => {
    expect(["merlin", "percival", "servant"].map((r) => sideOf(r as never))).toEqual([
      "good",
      "good",
      "good",
    ]);
    expect(
      ["assassin", "morgana", "mordred", "oberon", "minion"].map((r) =>
        sideOf(r as never)
      )
    ).toEqual(["evil", "evil", "evil", "evil", "evil"]);
  });
});

describe("teamSize", () => {
  it("follows the current quest", () => {
    expect(teamSize(makeState({ quest: 0 }))).toBe(2);
    expect(teamSize(makeState({ quest: 1 }))).toBe(3);
  });
});

describe("toggleSeat", () => {
  it("adds, removes and keeps seats sorted", () => {
    expect(toggleSeat([], 3, 2)).toEqual([3]);
    expect(toggleSeat([3], 1, 2)).toEqual([1, 3]);
    expect(toggleSeat([1, 3], 3, 2)).toEqual([1]);
  });

  it("ignores taps beyond the team size", () => {
    expect(toggleSeat([1, 3], 4, 2)).toEqual([1, 3]);
  });
});

describe("pendingAction", () => {
  it("asks only the leader to propose", () => {
    const state = makeState({ leader: 2 });
    expect(pendingAction(state, 2)).toBe("propose");
    expect(pendingAction(state, 0)).toBeNull();
  });

  it("asks everyone who hasn't voted", () => {
    const state = makeState({
      phase: "vote",
      team: [0, 1],
      voted: [true, false, false, false, false],
    });
    expect(pendingAction(state, 0)).toBeNull();
    expect(pendingAction(state, 1)).toBe("vote");
  });

  it("asks quest members who haven't played", () => {
    const state = makeState({ phase: "quest", team: [1, 3], questPlayed: [3] });
    expect(pendingAction(state, 1)).toBe("quest");
    expect(pendingAction(state, 3)).toBeNull();
    expect(pendingAction(state, 0)).toBeNull();
  });

  it("asks only the assassin to assassinate", () => {
    const state = makeState({
      phase: "assassinate",
      evilSeats: [3, 4],
      assassinSeat: 3,
    });
    expect(pendingAction(state, 3)).toBe("assassinate");
    expect(pendingAction(state, 4)).toBeNull();
  });

  it("never asks spectators or finished games", () => {
    expect(pendingAction(makeState(), -1)).toBeNull();
    expect(pendingAction(makeState({ phase: "finished" }), 0)).toBeNull();
  });
});

describe("assassinTargets", () => {
  it("excludes the evil team", () => {
    const state = makeState({ phase: "assassinate", evilSeats: [1, 4] });
    expect(assassinTargets(state)).toEqual([0, 2, 3]);
  });
});

describe("questScore", () => {
  it("counts successes and failures", () => {
    const state = makeState({
      questResults: [
        { team: [0, 1], fails: 0, success: true },
        { team: [0, 1, 3], fails: 1, success: false },
        { team: [0, 2], fails: 0, success: true },
      ],
    });
    expect(questScore(state)).toEqual({ good: 2, evil: 1 });
  });
});

describe("currentSeat", () => {
  it("points at the leader or assassin, otherwise nobody", () => {
    expect(currentSeat(makeState({ leader: 4 }))).toBe(4);
    expect(currentSeat(makeState({ phase: "vote" }))).toBe(-1);
    expect(currentSeat(makeState({ phase: "quest" }))).toBe(-1);
    expect(
      currentSeat(makeState({ phase: "assassinate", assassinSeat: 2 }))
    ).toBe(2);
  });
});

describe("newReveals", () => {
  const vote = {
    quest: 0,
    leader: 0,
    team: [0, 1],
    votes: [true, true, true, false, false],
    approved: true,
  };
  const quest = { team: [0, 1], fails: 0, success: true };

  it("announces nothing when nothing new happened", () => {
    const state = makeState({ history: [vote], questResults: [quest] });
    expect(newReveals(seenOf(state), state)).toEqual([]);
  });

  it("announces a vote that just finished", () => {
    const before = seenOf(makeState());
    const after = makeState({ phase: "quest", history: [vote] });
    expect(newReveals(before, after)).toEqual([
      { kind: "vote", id: "vote:1", record: vote },
    ]);
  });

  it("announces a quest that just finished", () => {
    const before = seenOf(makeState({ phase: "quest", history: [vote] }));
    const after = makeState({ quest: 1, history: [vote], questResults: [quest] });
    expect(newReveals(before, after)).toEqual([
      { kind: "quest", id: "quest:1", quest: 0, result: quest },
    ]);
  });

  it("catches up in order after missed updates, newest vote only", () => {
    const rejected = { ...vote, approved: false };
    const after = makeState({
      phase: "finished",
      history: [rejected, vote],
      questResults: [quest],
      winner: "evil",
      winReason: "failedQuests",
    });
    expect(newReveals(seenOf(makeState()), after).map((r) => r.id)).toEqual([
      "vote:2",
      "quest:1",
      "end",
    ]);
  });

  it("does not announce an abandoned game as a win", () => {
    const after = makeState({ phase: "finished", winReason: "abandoned" });
    expect(newReveals(seenOf(makeState()), after)).toEqual([]);
  });
});

describe("setup tables (mirror of the backend engine)", () => {
  it("deals one role per player with the right number of moles", () => {
    const moles: Record<number, number> = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
    for (const count of PLAYER_COUNTS) {
      const roles = ROLE_SETS[count];
      expect(roles).toHaveLength(count);
      expect(roles.filter((r) => sideOf(r) === "evil")).toHaveLength(moles[count]);
      expect(roles.filter((r) => r === "merlin")).toHaveLength(1);
      expect(roles.filter((r) => r === "assassin")).toHaveLength(1);
    }
  });

  it("has five operations per player count", () => {
    expect(QUEST_SIZES[5]).toEqual([2, 3, 2, 3, 3]);
    expect(QUEST_SIZES[6]).toEqual([2, 3, 4, 3, 4]);
    expect(QUEST_SIZES[7]).toEqual([2, 3, 3, 4, 4]);
    for (const count of [8, 9, 10]) {
      expect(QUEST_SIZES[count]).toEqual([3, 4, 4, 5, 5]);
    }
  });

  it("needs two fails only on the fourth operation with seven or more", () => {
    expect([0, 1, 2, 3, 4].map((q) => failsNeeded(6, q))).toEqual([1, 1, 1, 1, 1]);
    expect([0, 1, 2, 3, 4].map((q) => failsNeeded(7, q))).toEqual([1, 1, 1, 2, 1]);
  });
});

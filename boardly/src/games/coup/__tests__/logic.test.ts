import {
  canTake,
  currentSeat,
  handOf,
  targetsFor,
  taskFor,
  toggleKeep,
  type CoupState,
} from "../logic";

function makeState(overrides: Partial<CoupState> = {}): CoupState {
  return {
    numPlayers: 3,
    players: [
      {
        coins: 2,
        alive: true,
        cards: [
          { revealed: false, role: "duke" },
          { revealed: false, role: "captain" },
        ],
      },
      {
        coins: 2,
        alive: true,
        cards: [
          { revealed: false, role: null },
          { revealed: true, role: "contessa" },
        ],
      },
      {
        coins: 0,
        alive: false,
        cards: [
          { revealed: true, role: "assassin" },
          { revealed: true, role: "duke" },
        ],
      },
    ],
    deckCount: 9,
    turn: 0,
    phase: "action",
    action: null,
    block: null,
    passed: [],
    waitingOn: [0],
    exchange: null,
    log: [],
    winner: null,
    ...overrides,
  };
}

function withCoins(coins: number): CoupState {
  const state = makeState();
  state.players[0].coins = coins;
  return state;
}

describe("canTake", () => {
  it("needs enough coins for paid actions", () => {
    expect(canTake(withCoins(2), 0, "assassinate")).toBe(false);
    expect(canTake(withCoins(3), 0, "assassinate")).toBe(true);
    expect(canTake(withCoins(6), 0, "coup")).toBe(false);
    expect(canTake(withCoins(7), 0, "coup")).toBe(true);
    expect(canTake(withCoins(0), 0, "income")).toBe(true);
  });

  it("allows only a coup at 10 or more coins", () => {
    const rich = withCoins(10);
    expect(canTake(rich, 0, "coup")).toBe(true);
    expect(canTake(rich, 0, "income")).toBe(false);
    expect(canTake(rich, 0, "tax")).toBe(false);
  });
});

describe("targetsFor", () => {
  it("lists other players still in the game", () => {
    expect(targetsFor(makeState(), 0)).toEqual([1]);
    expect(targetsFor(makeState(), 1)).toEqual([0]);
  });
});

describe("handOf", () => {
  it("returns face-down card indices", () => {
    expect(handOf(makeState(), 0)).toEqual([0, 1]);
    expect(handOf(makeState(), 1)).toEqual([0]);
    expect(handOf(makeState(), 2)).toEqual([]);
  });
});

describe("taskFor", () => {
  it("is the phase when the game waits on me", () => {
    expect(taskFor(makeState(), 0)).toBe("action");
    expect(
      taskFor(makeState({ phase: "challengeAction", waitingOn: [1] }), 1)
    ).toBe("challengeAction");
    expect(taskFor(makeState({ phase: "block", waitingOn: [1] }), 1)).toBe("block");
    expect(taskFor(makeState({ phase: "loseInfluence", waitingOn: [0] }), 0)).toBe(
      "reveal"
    );
    expect(taskFor(makeState({ phase: "exchange", waitingOn: [0] }), 0)).toBe(
      "exchange"
    );
  });

  it("is nothing when it isn't my move, I'm watching, or it's over", () => {
    expect(taskFor(makeState(), 1)).toBeNull();
    expect(taskFor(makeState(), -1)).toBeNull();
    expect(taskFor(makeState({ phase: "finished", waitingOn: [] }), 0)).toBeNull();
  });
});

describe("toggleKeep", () => {
  it("toggles and caps the selection", () => {
    expect(toggleKeep([], 2, 2)).toEqual([2]);
    expect(toggleKeep([2], 0, 2)).toEqual([0, 2]);
    expect(toggleKeep([0, 2], 3, 2)).toEqual([0, 2]);
    expect(toggleKeep([0, 2], 0, 2)).toEqual([2]);
  });
});

describe("currentSeat", () => {
  it("is the single player being waited on, else nobody", () => {
    expect(currentSeat(makeState())).toBe(0);
    expect(currentSeat(makeState({ waitingOn: [0, 1] }))).toBe(-1);
    expect(currentSeat(makeState({ waitingOn: [] }))).toBe(-1);
  });
});

import {
  availableActions,
  canHide,
  currentSeat,
  guessTargets,
  neighbors,
  reachable,
  screamsByRoom,
  suspects,
  taskFor,
  waitingOn,
  type ManorState,
} from "../logic";

function view(overrides: Partial<ManorState> = {}): ManorState {
  return {
    numPlayers: 5,
    phase: "move",
    hour: 0,
    hours: 8,
    ownerHp: 2,
    ownerMaxHp: 2,
    cameras: [null, false, false, false, null, null, null, false, false],
    events: [],
    locked: [],
    ready: [false, false, false, false, false],
    myRole: "guest",
    myRoom: 4,
    myItem: null,
    myOrder: null,
    someoneHere: false,
    hideUsed: false,
    ownerHere: false,
    ownerSeenAt: null,
    followingMe: false,
    roomItems: [],
    log: [],
    intruders: null,
    ringleader: null,
    guessTarget: null,
    winner: null,
    winReason: null,
    roles: null,
    ownerRoom: null,
    ...overrides,
  };
}

describe("floor plan", () => {
  it("moves one room up, down, left or right", () => {
    expect(neighbors(4).sort()).toEqual([1, 3, 5, 7]);
    expect(neighbors(0).sort()).toEqual([1, 3]);
    expect(reachable(8)).toEqual([5, 7, 8]);
    expect(reachable(null)).toEqual([]);
  });

  it("lets intruders go anywhere", () => {
    expect(reachable(0, true)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("never keeps anyone in the security room for a second hour", () => {
    expect(reachable(5)).toEqual([2, 4, 8]);
    expect(reachable(5, true)).not.toContain(5);
  });
});

describe("taskFor", () => {
  it("asks each phase's question until answered", () => {
    expect(taskFor(view(), 0)).toBe("move");
    expect(taskFor(view({ phase: "act" }), 0)).toBe("act");
    expect(taskFor(view({ phase: "gathering" }), 0)).toBe("accuse");
    expect(taskFor(view({ ready: [true, false, false, false, false] }), 0)).toBeNull();
  });

  it("skips locked players and spectators", () => {
    expect(taskFor(view({ myRoom: null, locked: [0] }), 0)).toBeNull();
    expect(taskFor(view(), -1)).toBeNull();
  });

  it("gives the dawn guess to the ringleader only", () => {
    const dawn = view({ phase: "guess", ringleader: 3, intruders: [3, 4] });
    expect(taskFor(dawn, 3)).toBe("guess");
    expect(taskFor(dawn, 4)).toBeNull();
    expect(currentSeat(dawn)).toBe(3);
    expect(guessTargets(dawn)).toEqual([0, 1, 2]);
  });
});

describe("availableActions", () => {
  const names = (state: ManorState) =>
    availableActions(state).map((a) => (a.item ? `${a.action}:${a.item}` : a.action));

  it("offers what the room allows", () => {
    expect(names(view({ myRoom: 3, roomItems: ["knife"] }))).toEqual([
      "take:knife",
      "fix",
      "wait",
    ]);
    expect(names(view({ myRoom: 5, someoneHere: true }))).toEqual([
      "watch",
      "search",
      "wait",
    ]);
  });

  it("gives the flashlight to the guard", () => {
    expect(names(view({ myRole: "guard" }))).toEqual(["flashlight", "wait"]);
  });

  it("lets an armed intruder hide a weapon once", () => {
    const intruder = view({ myRole: "intruder", myItem: "knife" });
    expect(canHide(intruder)).toBe(true);
    expect(canHide({ ...intruder, hideUsed: true })).toBe(false);
    expect(canHide({ ...intruder, myItem: null })).toBe(false);
    expect(canHide(view({ myItem: "knife" }))).toBe(false);
  });

  it("keeps attack and break for armed intruders", () => {
    const cameras = [null, false, false, true, null, null, null, false, false];
    const guest = view({ myRoom: 3, ownerHere: true, myItem: "knife", cameras });
    expect(names(guest)).toEqual(["guard", "escort", "wait"]);
    const intruder = { ...guest, myRole: "intruder" as const };
    expect(names(intruder)).toEqual(["guard", "attack", "escort", "break", "wait"]);
    expect(names({ ...intruder, myItem: null })).not.toContain("attack");
  });
});

describe("meetings and records", () => {
  it("can't vote for yourself or the locked up", () => {
    expect(suspects(view({ locked: [2] }), 0)).toEqual([1, 3, 4]);
  });

  it("waits only on free players who haven't chosen", () => {
    expect(
      waitingOn(view({ locked: [1], ready: [true, false, false, true, false] }))
    ).toEqual([2, 4]);
  });

  it("counts screams per room", () => {
    expect(
      screamsByRoom([
        { hour: 1, kind: "scream", room: 2 },
        { hour: 1, kind: "cameraOn", room: 3 },
        { hour: 4, kind: "scream", room: 2 },
      ])
    ).toEqual({ 2: 2 });
  });
});

import { arrivalOf, entryBetween } from "../arrival";

const patrol = (round: number, room: number) => ({
  round,
  kind: "patrol",
  room,
  seen: [],
  company: false,
  fake: null,
  tracked: null,
  blocked: null,
});
const state = (over: Record<string, unknown>) =>
  ({
    phase: "room",
    round: 0,
    myRoom: 1,
    missionRoom: 6,
    team: [],
    doors: [],
    results: [],
    log: [],
    ...over,
  }) as never;

describe("entryBetween", () => {
  it("tells a step, a secret door, a far move and staying apart", () => {
    expect(entryBetween(4, 1, [])).toBe("step");
    expect(entryBetween(3, 5, [])).toBe("step");
    expect(entryBetween(0, 4, [[0, 4]])).toBe("secret");
    expect(entryBetween(0, 4, [])).toBe("far");
    expect(entryBetween(0, 8, [])).toBe("far");
    expect(entryBetween(2, 2, [])).toBe("stay");
  });
});

describe("arrivalOf", () => {
  it("walks the first patrol in from the Hall", () => {
    expect(arrivalOf(state({ log: [patrol(0, 1)] }), 0)).toEqual({
      key: "0:patrol:1",
      from: 4,
      how: "step",
    });
  });

  it("starts the next night where the mission left the player", () => {
    const results = [{ round: 0, room: 2, team: [0], missing: [], fails: 0, success: true }];
    const s = state({ round: 1, myRoom: 5, results, log: [patrol(0, 1), patrol(1, 5)] });
    expect(arrivalOf(s, 0)).toEqual({ key: "1:patrol:5", from: 2, how: "step" });
  });

  it("walks a team member to the mission room", () => {
    const s = state({ phase: "mission", myRoom: 6, team: [0, 2], log: [patrol(0, 3)] });
    expect(arrivalOf(s, 0)).toEqual({ key: "0:mission:6", from: 3, how: "step" });
  });

  it("brings the player out of a fallen room into the Hall", () => {
    const s = state({
      phase: "announce",
      round: 1,
      myRoom: 4,
      log: [{ round: 1, kind: "collapse", room: 1 }],
    });
    expect(arrivalOf(s, 0)).toEqual({ key: "1:collapse", from: 1, how: "collapse" });
  });

  it("has nothing to show before the patrol", () => {
    expect(
      arrivalOf(state({ phase: "patrol", round: 1, myRoom: 1, log: [patrol(0, 1)] }), 0),
    ).toBeNull();
  });
});

import { shownNight } from "../shownNight";

const ok = (round: number, room = 1) => ({ round, room, team: [0, 1], missing: [], fails: 0, success: true });
const bad = (round: number, room = 1) => ({ round, room, team: [0, 1], missing: [], fails: 1, success: false });
const vote = (round: number, approved: boolean) => ({
  round,
  leader: 0,
  bell: false,
  team: [0, 1],
  votes: [approved, approved, false, approved, false],
  approved,
});
const state = (over: Record<string, unknown>) =>
  ({
    phase: "team",
    round: 1,
    rounds: 5,
    missionRoom: 2,
    nextMissionRoom: 7,
    missionSizes: [2, 3, 2, 3, 3],
    event: "fog",
    rejections: 0,
    results: [ok(0, 6)],
    history: [vote(0, true)],
    timeline: [{ round: 1, kind: "night", event: "fog" }],
    ...over,
  }) as never;

describe("shownNight", () => {
  it("shows the server's night when everything has been revealed", () => {
    const s = shownNight(state({}), { votes: 1, missions: 1 });
    expect(s).toMatchObject({ round: 1, phase: "team", held: false, event: "fog", missionRoom: 2, nextMissionRoom: 7 });
    expect(s.track[0]?.success).toBe(true);
  });

  it("holds a mission's result, the next night and its event until the reveal", () => {
    // night 2's mission failed; the server is already on night 3, in a storm
    const st = state({
      phase: "announce",
      round: 2,
      missionRoom: 3,
      nextMissionRoom: 8,
      event: "storm",
      results: [ok(0, 6), bad(1, 2)],
      history: [vote(0, true), vote(1, true)],
      timeline: [
        { round: 1, kind: "night", event: "fog" },
        { round: 2, kind: "night", event: "storm" },
      ],
    });
    const held = shownNight(st, { votes: 2, missions: 1 });
    expect(held).toMatchObject({ round: 1, phase: "mission", held: true, live: true, event: "fog", missionRoom: 2, nextMissionRoom: 3 });
    expect(held.track[1]).toBeNull();
    const after = shownNight(st, { votes: 2, missions: 2 });
    expect(after).toMatchObject({ round: 2, held: false, event: "storm" });
    expect(after.track[1]?.success).toBe(false);
  });

  it("holds a rejection's count and an approval's phase until the vote is revealed", () => {
    const rejected = state({ rejections: 2, history: [vote(0, true), vote(1, false), vote(1, false)] });
    expect(shownNight(rejected, { votes: 2, missions: 1 })).toMatchObject({ phase: "vote", rejections: 1, held: true });
    expect(shownNight(rejected, { votes: 3, missions: 1 })).toMatchObject({ phase: "team", rejections: 2, held: false });
    const approved = state({ phase: "mission", history: [vote(0, true), vote(1, true)] });
    expect(shownNight(approved, { votes: 1, missions: 1 }).phase).toBe("vote");
  });

  it("keeps the ending back until the last reveal", () => {
    const st = state({ phase: "finished", round: 3, results: [bad(0), bad(1), ok(2), bad(3)], history: [] });
    expect(shownNight(st, { votes: 0, missions: 3 })).toMatchObject({ live: true, round: 3, phase: "mission" });
    expect(shownNight(st, { votes: 0, missions: 4 }).live).toBe(false);
  });

  it("holds nothing before the counters are first set", () => {
    const st = state({ results: [ok(0), bad(1)], round: 2 });
    expect(shownNight(st, { votes: null, missions: null }).held).toBe(false);
  });

  it("lists what earlier nights left behind, not tonight's", () => {
    const st = state({
      round: 3,
      timeline: [
        { round: 1, kind: "night", event: "secretDoor" },
        { round: 1, kind: "door", rooms: [0, 4] },
        { round: 3, kind: "night", event: "collapse" },
        { round: 3, kind: "collapse", room: 8 },
      ],
      event: "collapse",
      history: [],
      results: [],
    });
    expect(shownNight(st, { votes: 0, missions: 0 }).lasting).toEqual([{ kind: "door", rooms: [0, 4] }]);
  });
});

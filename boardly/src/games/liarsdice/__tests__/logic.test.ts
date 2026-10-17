import {
  JIJIJI,
  bidProblem,
  callPlan,
  callingOf,
  favouriteFace,
  leastCall,
  openingMin,
  startFace,
  canReroll,
  canSplit,
  faceRank,
  isKaizhai,
  isLeopard,
  isOut,
  taskFor,
  isValidBid,
  myCount,
  type LiarsDiceState,
} from "../logic";

function view(overrides: Partial<LiarsDiceState> = {}): LiarsDiceState {
  return {
    numPlayers: 2,
    mode: "knockout",
    phase: "bidding",
    turn: 0,
    round: 1,
    cups: [0, 0],
    maxCups: 5,
    diceEach: 5,
    myDice: [1, 2, 5, 5, 6],
    diceCount: [5, 5],
    bid: null,
    bids: [],
    split: null,
    endVotes: [],
    rerolls: [],
    reveal: null,
    winner: null,
    winners: null,
    ...overrides,
  };
}

const bid = (quantity: number, face: number, zhai = false) => ({
  quantity,
  face,
  zhai,
  seat: 1,
});

describe("bidding", () => {
  it("ranks 1 above 6", () => {
    expect([2, 6, 1].map(faceRank)).toEqual([2, 6, 7]);
  });

  it("opens above the player count", () => {
    expect(isValidBid(view(), 2, 5, false)).toBe(false);
    expect(isValidBid(view(), 3, 5, false)).toBe(true);
    expect(isValidBid(view({ cups: [0, 5], diceCount: [5, 0] }), 2, 5, false)).toBe(true);
  });

  it("must raise the count or the face", () => {
    const state = view({ bid: bid(3, 5) });
    expect(isValidBid(state, 3, 5, false)).toBe(false);
    expect(isValidBid(state, 3, 4, false)).toBe(false);
    expect(isValidBid(state, 3, 6, false)).toBe(true);
    expect(isValidBid(state, 3, 1, false)).toBe(false); // kaizhai: no 1s
    expect(isValidBid(view({ bid: bid(3, 5, true) }), 3, 1, true)).toBe(true);
    expect(isValidBid(state, 4, 2, false)).toBe(true);
    expect(isValidBid(state, 11, 2, false)).toBe(false); // only 10 dice
  });

  it("never goes back to zhai once kaizhai", () => {
    expect(isValidBid(view({ bid: bid(3, 5) }), 3, 5, true)).toBe(false);
    expect(isValidBid(view({ bid: bid(3, 5) }), 5, 6, true)).toBe(false);
    expect(isValidBid(view({ bid: bid(3, 5, true) }), 3, 5, true)).toBe(false);
    expect(isKaizhai(view({ bid: bid(3, 5) }))).toBe(true);
    expect(isKaizhai(view({ bid: bid(3, 5, true) }))).toBe(false);
  });

  it("lets a zhai opening call the player count", () => {
    expect(isValidBid(view(), 2, 5, true)).toBe(true);
    expect(isValidBid(view(), 2, 1, false)).toBe(true); // 1s are zhai
    expect(isValidBid(view(), 1, 5, true)).toBe(false);
  });

  it("breaks the fast (开斋) only at double the dice", () => {
    const state = view({ bid: bid(3, 4, true) });
    expect(isValidBid(state, 5, 6, false)).toBe(false);
    expect(isValidBid(state, 6, 2, false)).toBe(true);
    expect(isValidBid(state, 4, 4, true)).toBe(true); // staying zhai raises as usual
  });

  it("counts 豹子 as six and 大豹子 as seven", () => {
    expect(myCount([1, 1, 3, 3, 3], 3, false)).toBe(6);
    expect(myCount([1, 1, 3, 3, 3], 3, true)).toBe(3);
    expect(myCount([3, 3, 3, 3, 3], 3, true)).toBe(7);
    expect(myCount([3, 3, 3, 3, 3], 3, false)).toBe(7);
    expect(myCount([1, 1, 1, 1, 1], 4, false)).toBe(7);
    expect(myCount([1, 1, 1, 1, 1], 4, true)).toBe(0);
    expect(myCount([3, 3, 3, 3, 2], 3, false)).toBe(4);
    expect(isLeopard([1, 1, 1, 1, 1], 4, false)).toBe(true);
    expect(isLeopard([1, 1, 1, 1, 1], 4, true)).toBe(false);
  });

  it("counts my dice, with 1s wild until zhai", () => {
    expect(myCount([1, 2, 5, 5, 6], 5, false)).toBe(3);
    expect(myCount([1, 2, 5, 5, 6], 5, true)).toBe(2);
    expect(myCount([1, 1, 5], 1, false)).toBe(2);
  });
});

/** A table of n, all in, playing `calling`. */
const table = (n: number, calling: LiarsDiceState["calling"], over: Partial<LiarsDiceState> = {}) =>
  view({ numPlayers: n, cups: Array(n).fill(0), diceCount: Array(n).fill(5), calling, ...over });

describe("几几几 (jijiji)", () => {
  it("has the owner's table of thresholds", () => {
    expect(JIJIJI).toEqual({
      2: [2, 3, 3], 3: [3, 4, 5], 4: [4, 5, 7], 5: [5, 6, 8], 6: [6, 7, 9],
      7: [7, 8, 11], 8: [8, 9, 12], 9: [9, 10, 14], 10: [10, 11, 15],
    });
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])("opens by the thresholds at %i players", (n) => {
    const [one, zhai, fei] = JIJIJI[n];
    const state = table(n, "jijiji");
    expect(isValidBid(state, one - 1, 1, true)).toBe(false);
    for (let q = one; q < zhai; q++) {
      expect(isValidBid(state, q, 1, false)).toBe(true); // 1s are zhai
      expect(isValidBid(state, q, 4, true)).toBe(false);
    }
    for (let q = zhai; q < fei; q++) {
      expect(isValidBid(state, q, 4, true)).toBe(true);
      expect(isValidBid(state, q, 4, false)).toBe(false);
      expect(bidProblem(state, q, 4, false)).toEqual({ code: "fei", min: fei });
    }
    expect(isValidBid(state, fei, 4, false)).toBe(true);
    expect([leastCall(state, 1, true), leastCall(state, 4, true), leastCall(state, 4, false)]).toEqual([one, zhai, fei]);
    expect([openingMin(state, true), openingMin(state, false)]).toEqual([zhai, fei]);
  });

  it("counts only the players still in", () => {
    const state = table(4, "jijiji", { cups: [0, 0, 0, 5], diceCount: [5, 5, 5, 0] });
    expect(leastCall(state, 1, true)).toBe(3);
    expect(leastCall(state, 4, false)).toBe(5);
  });

  it("goes kaizhai from FEI with no doubling, and stays kaizhai", () => {
    const zhai = table(3, "jijiji", { bid: bid(4, 5, true) });
    expect(isValidBid(zhai, 5, 3, false)).toBe(true);
    expect(isValidBid(zhai, 4, 6, false)).toBe(false);
    const kai = table(3, "jijiji", { bid: bid(5, 3) });
    expect(isValidBid(kai, 6, 3, true)).toBe(false);
    expect(isValidBid(kai, 6, 1, true)).toBe(false);
    expect(bidProblem(kai, 6, 1, true)).toEqual({ code: "kaizhaiRound" });
    expect(isValidBid(kai, 5, 4, false)).toBe(true);
    expect(leastCall(kai, 1, true)).toBeNull();
  });
});

describe("不玩斋 (nozhai) and old games", () => {
  it("never calls 1s or zhai, and opens above the players", () => {
    const state = table(3, "nozhai");
    expect(isKaizhai(state)).toBe(true);
    expect(isValidBid(state, 3, 5, false)).toBe(false);
    expect(isValidBid(state, 4, 5, false)).toBe(true);
    expect(isValidBid(state, 4, 5, true)).toBe(false);
    expect(isValidBid(state, 6, 1, false)).toBe(false);
    expect(leastCall(state, 1, false)).toBeNull();
  });

  it("plays classic when the game has no calling", () => {
    expect(callingOf(view())).toBe("classic");
    expect(callingOf(view({ calling: "jijiji" }))).toBe("jijiji");
  });
});

describe("the call buttons (callPlan)", () => {
  it("opens 几几几 with 1s, zhai and kaizhai at their least, rising together", () => {
    const state = table(3, "jijiji");
    const plan = callPlan(state, 4);
    expect(plan.faces).toEqual([2, 3, 4, 5, 6]);
    expect(plan.count).toBe(4);
    expect(plan.choices.map((c) => [c.quantity, c.face, c.zhai, c.problem])).toEqual([
      [3, 1, true, null],
      [4, 4, true, null],
      [5, 4, false, null],
    ]);
    const up = callPlan(state, 4, 6);
    expect(up.choices.map((c) => c.quantity)).toEqual([5, 6, 7]);
    expect(callPlan(state, 1).face).toBe(6); // no 1s in the row: they have their own call
  });

  it("offers zhai and kaizhai mid-round, the least legal for each", () => {
    const state = table(3, "jijiji", { bid: bid(4, 5, true) });
    expect(callPlan(state, 6).choices.map((c) => c.quantity)).toEqual([4, 5]);
    expect(callPlan(state, 3).choices.map((c) => c.quantity)).toEqual([5, 5]);
    const ones = callPlan(state, 1).choices;
    expect(ones[0]).toMatchObject({ quantity: 4, zhai: true, problem: null });
    expect(ones[1]).toMatchObject({ quantity: null, problem: { code: "onesZhai" } });
    // classic doubles to break zhai
    expect(callPlan(table(3, "classic", { bid: bid(4, 5, true) }), 6).choices.map((c) => c.quantity)).toEqual([4, 8]);
  });

  it("offers one call after kaizhai and with no zhai, faces 2-6", () => {
    const kai = callPlan(table(3, "jijiji", { bid: bid(5, 4) }), 4);
    expect(kai.faces).toEqual([2, 3, 4, 5, 6]);
    expect(kai.choices.map((c) => [c.quantity, c.zhai])).toEqual([[6, false]]);
    const no = callPlan(table(3, "nozhai"), 5);
    expect(no.choices.map((c) => [c.quantity, c.zhai])).toEqual([[4, false]]);
    const classic = callPlan(table(3, "classic"), 5);
    expect(classic.faces).toEqual([1, 2, 3, 4, 5, 6]);
    expect(classic.choices.map((c) => c.quantity)).toEqual([3, 4]);
  });

  it("greys a call past the dice on the table and stops the count there", () => {
    const state = table(2, "jijiji", { bid: bid(9, 5, true) });
    const plan = callPlan(state, 6, 99);
    expect(plan.count).toBe(10);
    expect(plan.choices.map((c) => [c.quantity, c.problem])).toEqual([
      [10, null],
      [10, null],
    ]);
    const past = callPlan(state, 3, 10).choices; // 3s need 10, kaizhai too
    expect(past[0].problem).toBeNull();
    expect(callPlan(table(2, "jijiji", { bid: bid(10, 5, true) }), 3).choices[0].problem).toEqual({ code: "total", total: 10 });
  });

  it("starts on the face called, else the one I hold most of, else one that can be called", () => {
    expect(favouriteFace([1, 3, 3, 5, 6])).toBe(3);
    expect(favouriteFace([2, 2, 5, 5, 1])).toBe(5);
    expect(startFace(table(3, "jijiji", { myDice: [2, 3, 3, 5, 6] }))).toBe(3);
    expect(startFace(table(3, "jijiji", { bid: bid(5, 4, true) }))).toBe(4);
    // 10 fives zhai of 10 dice: only 1s and 6s can still be called
    expect(startFace(table(2, "jijiji", { bid: bid(10, 5, true) }))).toBe(1);
  });
});

describe("splits and modes", () => {
  it("lets anyone but the bidder split, any time", () => {
    const state = view({ numPlayers: 3, cups: [0, 0, 0], bid: bid(4, 5), turn: 2 });
    expect(canSplit(state, 0)).toBe(true); // not their turn: still allowed
    expect(canSplit(state, 1)).toBe(false); // their own bid
    expect(canSplit(view(), 0)).toBe(false); // nothing to split yet
  });

  it("asks the bidder to answer a split", () => {
    const state = view({ phase: "split", bid: bid(4, 5), split: { by: 0 } });
    expect(taskFor(state, 1)).toBe("answer");
    expect(taskFor(state, 0)).toBeNull();
    expect(taskFor(view(), 0)).toBe("bid");
  });

  it("never knocks anyone out in endless games", () => {
    expect(isOut(view({ cups: [5, 0] }), 0)).toBe(true);
    expect(isOut(view({ mode: "endless", maxCups: null, cups: [12, 0] }), 0)).toBe(false);
  });
});

describe("scattered dice (散骰)", () => {
  it("lets a cup of five different faces reshake before its first bid", () => {
    const scattered = view({ myDice: [1, 2, 3, 5, 6] });
    expect(canReroll(scattered, 0)).toBe(true);
    expect(canReroll(view({ myDice: [1, 1, 3, 5, 6] }), 0)).toBe(false);
    expect(canReroll({ ...scattered, bids: [bid(3, 4)] }, 0)).toBe(true); // seat 1 bid
    expect(canReroll({ ...scattered, bids: [{ ...bid(3, 4), seat: 0 }] }, 0)).toBe(false);
    expect(canReroll({ ...scattered, phase: "split" }, 0)).toBe(false);
  });
});

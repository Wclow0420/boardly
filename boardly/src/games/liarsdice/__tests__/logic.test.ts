import {
  canReroll,
  canSplit,
  faceRank,
  isKaizhai,
  isLeopard,
  isOut,
  taskFor,
  isValidBid,
  myCount,
  suggestedBid,
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

  it("suggests the smallest raise", () => {
    expect(suggestedBid(view())).toEqual({ quantity: 3, face: 2 });
    expect(suggestedBid(view({ bid: bid(3, 5) }))).toEqual({ quantity: 3, face: 6 });
    expect(suggestedBid(view({ bid: bid(3, 6) }))).toEqual({ quantity: 4, face: 2 });
    expect(suggestedBid(view({ bid: bid(3, 6, true) }))).toEqual({ quantity: 3, face: 1 });
    expect(suggestedBid(view({ bid: bid(3, 1) }))).toEqual({ quantity: 4, face: 2 });
  });

  it("counts five of a kind (豹子) one extra", () => {
    expect(myCount([1, 1, 3, 3, 3], 3, false)).toBe(6);
    expect(myCount([1, 1, 3, 3, 3], 3, true)).toBe(3);
    expect(myCount([3, 3, 3, 3, 3], 3, true)).toBe(6);
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

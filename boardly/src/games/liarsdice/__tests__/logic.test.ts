import {
  faceRank,
  isValidBid,
  myCount,
  suggestedBid,
  type LiarsDiceState,
} from "../logic";

function view(overrides: Partial<LiarsDiceState> = {}): LiarsDiceState {
  return {
    numPlayers: 2,
    phase: "bidding",
    turn: 0,
    round: 1,
    cups: [0, 0],
    maxCups: 3,
    diceEach: 5,
    myDice: [1, 2, 5, 5, 6],
    diceCount: [5, 5],
    bid: null,
    bids: [],
    reveal: null,
    winner: null,
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
    expect(isValidBid(view({ cups: [0, 3], diceCount: [5, 0] }), 2, 5, false)).toBe(true);
  });

  it("must raise the count or the face", () => {
    const state = view({ bid: bid(3, 5) });
    expect(isValidBid(state, 3, 5, false)).toBe(false);
    expect(isValidBid(state, 3, 4, false)).toBe(false);
    expect(isValidBid(state, 3, 6, false)).toBe(true);
    expect(isValidBid(state, 3, 1, false)).toBe(true);
    expect(isValidBid(state, 4, 2, false)).toBe(true);
    expect(isValidBid(state, 11, 2, false)).toBe(false); // only 10 dice
  });

  it("lets a switch to zhai keep the same call", () => {
    expect(isValidBid(view({ bid: bid(3, 5) }), 3, 5, true)).toBe(true);
    expect(isValidBid(view({ bid: bid(3, 5, true) }), 3, 5, true)).toBe(false);
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
    expect(suggestedBid(view({ bid: bid(3, 6) }))).toEqual({ quantity: 3, face: 1 });
    expect(suggestedBid(view({ bid: bid(3, 1) }))).toEqual({ quantity: 4, face: 2 });
  });

  it("counts my dice, with 1s wild until zhai", () => {
    expect(myCount([1, 2, 5, 5, 6], 5, false)).toBe(3);
    expect(myCount([1, 2, 5, 5, 6], 5, true)).toBe(2);
    expect(myCount([1, 1, 5], 1, false)).toBe(2);
  });
});

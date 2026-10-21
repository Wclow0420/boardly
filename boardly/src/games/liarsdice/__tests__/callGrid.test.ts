import { dockInsets } from "@/features/game/stage/Dock";
import { stacksCalls } from "../CallScene";

// the plinth's room between the house rules in my hand and the satchel
const room = (width: number) => {
  const at = dockInsets(width, { hand: true, satchel: true });
  return width - at.left - at.right;
};

describe("the opening calls on the plinth", () => {
  it("stack 1 + 2 on mid-width phones, where three in a row are cramped", () => {
    for (const width of [390, 393, 402, 414]) expect(stacksCalls(room(width), 3)).toBe(true);
  });
  it("stay in a row on wide phones and on narrow ones (whose dock is studs)", () => {
    for (const width of [375, 420, 430, 440]) expect(stacksCalls(room(width), 3)).toBe(false);
  });
  it("never stack two calls", () => {
    for (const width of [375, 390, 414, 440]) expect(stacksCalls(room(width), 2)).toBe(false);
  });
});

import { liftLayout, needleAngle } from "../layout";

describe("the lift's layout", () => {
  it.each([
    [375, 600, 20],
    [420, 828, 62],
  ])("keeps the dial, the opening and the plaque apart at %ix%i", (w, h, top) => {
    const L = liftLayout(w, h, top);
    expect(L.opening.y).toBeGreaterThanOrEqual(L.headerH);
    expect(L.opening.y + L.opening.h + L.sill).toBeLessThanOrEqual(L.plaque.y);
    expect(L.plaque.y + L.plaque.h).toBeLessThanOrEqual(h);
    expect(L.floorH).toBeGreaterThan(0);
    expect(L.stops).toHaveLength(7);
    // the side plates stay clear of the dial
    expect(L.panels.left.x + L.panels.left.w).toBeLessThan(L.cx - L.R);
    expect(L.panels.right.x).toBeGreaterThan(L.cx + L.R);
    // the bank studs stay on screen, clear of the sign
    expect(L.studs.left.x - 13).toBeGreaterThan(0);
    expect(L.studs.right.x + 13).toBeLessThan(w);
    expect(L.studs.left.x + 13).toBeLessThanOrEqual(L.sign.x);
    // the bank's cartouche sits inside the dial, over the hub
    expect(L.centre.x).toBeGreaterThan(L.cx - L.R);
    expect(L.centre.y + L.centre.h).toBeLessThan(L.cy - 17);
  });

  it("swings the needle across the dial, the middle floor straight up", () => {
    const { span } = liftLayout(420, 828, 62);
    expect(needleAngle(0, 7, span)).toBe(-span);
    expect(needleAngle(3, 7, span)).toBe(0);
    expect(needleAngle(6, 7, span)).toBe(span);
    expect(needleAngle(0, 1, 0)).toBe(0);
  });
});

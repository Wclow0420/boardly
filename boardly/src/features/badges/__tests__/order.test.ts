import type { BadgeRecord } from "@/api/client";
import {
  earnedLastGame,
  levelId,
  nextBadge,
  nextTier,
  sortBadges,
  titleBadge,
  toNext,
} from "../order";

const badge = (
  key: string,
  progress: number,
  unlocked: BadgeRecord["unlocked"] = {},
  gameType: string | null = null,
): BadgeRecord => {
  const order = ["bronze", "silver", "gold", "diamond"] as const;
  const tier = [...order].reverse().find((t) => unlocked[t]) ?? null;
  return { key, gameType, goals: [1, 5, 10, 20], progress, tier, unlocked };
};

it("puts earned badges first, highest level then newest, then the closest to bronze", () => {
  const order = sortBadges([
    badge("a", 0),
    badge("b", 1, { bronze: "2026-10-01" }),
    badge("c", 5, { bronze: "2026-09-01", silver: "2026-10-02" }),
    badge("d", 5, { bronze: "2026-09-01", silver: "2026-10-05" }),
    badge("e", 0),
  ]).map((b) => b.key);
  expect(order).toEqual(["d", "c", "b", "a", "e"]);
});

it("names the player after their highest badge, or nothing yet", () => {
  expect(titleBadge([badge("a", 0)])).toBeNull();
  expect(
    titleBadge([
      badge("b", 1, { bronze: "2026-10-09" }),
      badge("c", 10, { bronze: "1", silver: "2", gold: "2026-10-01" }),
    ])?.key,
  ).toBe("c");
});

it("knows the next level and how far there is to go", () => {
  expect(nextTier(badge("a", 0))).toBe("bronze");
  const silver = badge("b", 7, { bronze: "1", silver: "2" });
  expect(nextTier(silver)).toBe("gold");
  expect(toNext(silver)).toBeCloseTo(0.7);
  const top = badge("c", 20, { bronze: "1", silver: "2", gold: "3", diamond: "4" });
  expect(nextTier(top)).toBeNull();
  expect(toNext(top)).toBe(1);
});

it("celebrates the levels the latest game reached that this device hasn't shown", () => {
  const last = "2026-10-14T09:00:00";
  const badges = [
    badge("old", 1, { bronze: "2026-10-01T10:00:00" }),
    // two levels at once: only the higher is celebrated
    badge("jump", 5, { bronze: last, silver: last }),
    badge("seen", 1, { bronze: last }),
  ];
  const ups = earnedLastGame(badges, last, new Set([levelId("seen", "bronze")]));
  expect(ups.map((u) => `${u.badge.key}:${u.tier}`)).toEqual(["jump:silver"]);
  expect(earnedLastGame(badges, null, new Set())).toEqual([]);
});

it("works towards the closest next level, the game's own first", () => {
  const badges = [
    badge("boardly.a", 4, { bronze: "1" }),
    badge("game.b", 1, {}, "game"),
    badge("game.top", 20, { bronze: "1", silver: "2", gold: "3", diamond: "4" }, "game"),
  ];
  expect(nextBadge(badges, "game")?.key).toBe("game.b");
  expect(nextBadge(badges, "other")?.key).toBe("boardly.a");
  expect(nextBadge(badges)?.key).toBe("game.b");
});

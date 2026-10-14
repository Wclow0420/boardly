import type { BadgeRecord } from "@/api/client";
import { earnedLastGame, nextBadge, sortBadges, titleBadge } from "../order";

const badge = (
  key: string,
  tier: BadgeRecord["tier"],
  progress: number,
  goal: number,
  unlockedAt: string | null = null,
): BadgeRecord => ({
  key,
  gameType: null,
  tier,
  goal,
  progress,
  unlockedAt,
});

it("puts earned badges first, rarest then newest, then the closest to earning", () => {
  const order = sortBadges([
    badge("a", "gold", 2, 10),
    badge("b", "bronze", 1, 1, "2026-10-01"),
    badge("c", "silver", 1, 1, "2026-10-02"),
    badge("d", "silver", 1, 1, "2026-10-05"),
    badge("e", "bronze", 8, 10),
  ]).map((b) => b.key);
  expect(order).toEqual(["d", "c", "b", "e", "a"]);
});

it("names the player after their rarest badge, or nothing yet", () => {
  expect(titleBadge([badge("a", "gold", 2, 10)])).toBeNull();
  expect(
    titleBadge([
      badge("b", "bronze", 1, 1, "2026-10-09"),
      badge("c", "legendary", 1, 1, "2026-10-01"),
    ])?.key,
  ).toBe("c");
});

it("celebrates only what the latest game earned and this device hasn't shown", () => {
  const badges = [
    badge("old", "bronze", 1, 1, "2026-10-01T10:00:00"),
    badge("new", "silver", 1, 1, "2026-10-14T09:00:00"),
    badge("shown", "bronze", 1, 1, "2026-10-14T09:00:00"),
  ];
  const keys = earnedLastGame(
    badges,
    "2026-10-14T09:00:00",
    new Set(["shown"]),
  ).map((b) => b.key);
  expect(keys).toEqual(["new"]);
  expect(earnedLastGame(badges, null, new Set())).toEqual([]);
});

it("points at the closest badge still to earn, the game's own first", () => {
  const badges = [
    { ...badge("game.feat", "gold", 0, 1), gameType: "game" },
    { ...badge("game.wins", "gold", 4, 10), gameType: "game" },
    badge("boardly.veteran", "gold", 40, 50),
  ];
  expect(nextBadge(badges, "game")?.key).toBe("game.wins");
  expect(nextBadge(badges, "other")?.key).toBe("boardly.veteran");
  // on the player card: the closest of all
  expect(nextBadge(badges)?.key).toBe("boardly.veteran");
});

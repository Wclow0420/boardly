import type { BadgeRecord } from "@/api/client";
import { sortBadges, titleBadge } from "../order";

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

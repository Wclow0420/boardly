// The order badges are shown in, and the one that names the player.

import type { BadgeRecord } from "@/api/client";
import type { BadgeTier } from "@/components/badges/types";

const RANK: Record<BadgeTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  legendary: 3,
};

/** Earned first (rarest, then newest); then locked (closest first). */
export function sortBadges(badges: BadgeRecord[]): BadgeRecord[] {
  return [...badges].sort((a, b) => {
    if (!!a.unlockedAt !== !!b.unlockedAt) return a.unlockedAt ? -1 : 1;
    if (a.unlockedAt && b.unlockedAt) {
      return (
        RANK[b.tier] - RANK[a.tier] || b.unlockedAt.localeCompare(a.unlockedAt)
      );
    }
    return (
      b.progress / b.goal - a.progress / a.goal || RANK[a.tier] - RANK[b.tier]
    );
  });
}

/** The rarest badge earned: it names the player ("Seal Keeper"). */
export function titleBadge(badges: BadgeRecord[]): BadgeRecord | null {
  return sortBadges(badges).find((badge) => badge.unlockedAt) ?? null;
}

/** Badges earned in the latest game that this device hasn't shown. */
export function earnedLastGame(
  badges: BadgeRecord[],
  lastGameAt: string | null,
  seen: Set<string>,
): BadgeRecord[] {
  if (!lastGameAt) return [];
  return sortBadges(badges).filter(
    (badge) => badge.unlockedAt === lastGameAt && !seen.has(badge.key),
  );
}

/** The next badge to work towards: one still locked, the closest to
 *  earning; badges that fill up over several games come before one-off
 *  feats. Given a game, its own badges first, then Boardly's; without
 *  one (undefined), the closest of all. */
export function nextBadge(
  badges: BadgeRecord[],
  gameType?: string,
): BadgeRecord | null {
  const locked = badges.filter((badge) => !badge.unlockedAt);
  const ratio = (badge: BadgeRecord) => badge.progress / badge.goal;
  const pick = (pool: BadgeRecord[]) =>
    [...pool].sort(
      (a, b) =>
        Number(b.goal > 1) - Number(a.goal > 1) ||
        ratio(b) - ratio(a) ||
        RANK[a.tier] - RANK[b.tier],
    )[0] ?? null;
  if (gameType === undefined) return pick(locked);
  return (
    pick(locked.filter((b) => b.gameType === gameType)) ??
    pick(locked.filter((b) => b.gameType === null))
  );
}

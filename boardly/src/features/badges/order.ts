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

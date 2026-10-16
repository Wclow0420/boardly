// Badge levels: where a badge stands, what comes next, the order badges
// are shown in, and the one that names the player.

import type { BadgeRecord } from "@/api/client";
import { TIERS, type BadgeTier } from "@/components/badges/types";

const RANK: Record<BadgeTier, number> = { bronze: 0, silver: 1, gold: 2, diamond: 3 };

/** The goal for a level of a badge. */
export const goalOf = (badge: BadgeRecord, tier: BadgeTier) => badge.goals[RANK[tier]];

/** The level after the one reached (bronze before any), null at diamond. */
export function nextTier(badge: BadgeRecord): BadgeTier | null {
  if (!badge.tier) return "bronze";
  return TIERS[RANK[badge.tier] + 1] ?? null;
}

/** How far towards the next level: 0..1 (1 at diamond). */
export function toNext(badge: BadgeRecord): number {
  const next = nextTier(badge);
  if (!next) return 1;
  return Math.min(1, (badge.progress ?? 0) / goalOf(badge, next));
}

/** When the highest level reached was reached. */
const reachedAt = (badge: BadgeRecord) =>
  badge.tier ? (badge.unlocked[badge.tier] ?? "") : "";

/** Earned first (highest level, then newest); then the rest (closest to
 *  bronze first). */
export function sortBadges(badges: BadgeRecord[]): BadgeRecord[] {
  return [...badges].sort((a, b) => {
    if (!!a.tier !== !!b.tier) return a.tier ? -1 : 1;
    if (a.tier && b.tier)
      return RANK[b.tier] - RANK[a.tier] || reachedAt(b).localeCompare(reachedAt(a));
    return toNext(b) - toNext(a);
  });
}

/** The badge at the highest level: it names the player ("Seal Keeper"). */
export function titleBadge(badges: BadgeRecord[]): BadgeRecord | null {
  return sortBadges(badges).find((badge) => badge.tier) ?? null;
}

/** A level reached, to celebrate. */
export interface LevelUp {
  badge: BadgeRecord;
  tier: BadgeTier;
}

/** The id a device remembers a level by once it has shown it. */
export const levelId = (key: string, tier: BadgeTier) => `${key}:${tier}`;

/** Levels reached in the latest game that this device hasn't shown: for
 *  each badge, the highest level that game reached. */
export function earnedLastGame(
  badges: BadgeRecord[],
  lastGameAt: string | null,
  seen: Set<string>,
): LevelUp[] {
  if (!lastGameAt) return [];
  const ups: LevelUp[] = [];
  for (const badge of sortBadges(badges)) {
    const tier = [...TIERS]
      .reverse()
      .find((t) => badge.unlocked[t] === lastGameAt && !seen.has(levelId(badge.key, t)));
    if (tier) ups.push({ badge, tier });
  }
  return ups;
}

/** The badge to work towards next: one not yet at diamond, the closest
 *  to its next level. Given a game, its own badges first, then
 *  Boardly's; without one (undefined), the closest of all. */
export function nextBadge(badges: BadgeRecord[], gameType?: string): BadgeRecord | null {
  const open = badges.filter((badge) => nextTier(badge) !== null);
  const pick = (pool: BadgeRecord[]) =>
    [...pool].sort((a, b) => toNext(b) - toNext(a))[0] ?? null;
  if (gameType === undefined) return pick(open);
  return (
    pick(open.filter((b) => b.gameType === gameType)) ??
    pick(open.filter((b) => b.gameType === null))
  );
}

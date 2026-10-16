// How each badge looks. Boardly's own badges (played at all, streaks,
// company) are here; every game lists its own in its definition
// (GameDefinition.badges).

import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { BadgeArt } from "@/components/badges/types";
import { lidColors } from "@/features/games/GameBox";
import { getGame } from "@/games/registry";

/** Boardly's own enamel: deep teal. */
export const BOARDLY_FACE = "#1F4E5F";

const GENERAL: Record<string, BadgeArt> = {
  "boardly.firstTable": { glyph: G.meeple, emoji: "🪑", loop: "bob" },
  "boardly.firstWin": { glyph: G.trophy, emoji: "🏆", loop: "pulse" },
  "boardly.regular": { glyph: G.die, emoji: "🎲", loop: "tumble" },
  "boardly.streak": { glyph: G.flame, emoji: "🔥", loop: "flicker" },
  "boardly.company": { glyph: G.people, emoji: "🤝", loop: "bob" },
  "boardly.veteran": { glyph: G.laurel, emoji: "🏅", loop: "pulse" },
  "boardly.champion": { glyph: G.star, emoji: "★", loop: "spin" },
  "boardly.legend": { glyph: G.crown, emoji: "👑", loop: "pulse" },
};

const FALLBACK: BadgeArt = { glyph: G.star, emoji: "★", loop: "pulse" };

/** A badge's art and its enamel colour. */
export function badgeArt(
  key: string,
  gameType: string | null,
): { art: BadgeArt; face: string } {
  if (!gameType) return { art: GENERAL[key] ?? FALLBACK, face: BOARDLY_FACE };
  const art = getGame(gameType)?.badges?.[key] ?? FALLBACK;
  return { art, face: art.face ?? lidColors(gameType)[0] };
}

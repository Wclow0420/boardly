// How each badge looks. Boardly's own badges (played at all, streaks,
// company) are here; every game lists its own in its definition
// (GameDefinition.badges).

import { BOARDLY_FRAMES } from "@/components/badges/frames/boardly";
import { BADGE_GLYPHS as G } from "@/components/badges/glyphs";
import type { BadgeArt, BadgeStyle } from "@/components/badges/types";
import { lidColors } from "@/features/games/GameBox";
import { getGame } from "@/games/registry";

/** Boardly's own enamel: deep teal. */
export const BOARDLY_FACE = "#1F4E5F";

const GENERAL: Record<string, BadgeArt> = {
  "boardly.regular": { glyph: G.die, emoji: "🎲", loop: "tumble" },
  "boardly.champion": { glyph: G.trophy, emoji: "🏆", loop: "pulse" },
  "boardly.streak": { glyph: G.flame, emoji: "🔥", loop: "flicker" },
  "boardly.company": { glyph: G.people, emoji: "🤝", loop: "bob" },
};

const FALLBACK: BadgeArt = { glyph: G.star, emoji: "★", loop: "pulse" };

/** A badge's art, its enamel colour and the frames it wears. */
export function badgeArt(
  key: string,
  gameType: string | null,
): { art: BadgeArt; face: string; frames: BadgeStyle } {
  if (!gameType)
    return { art: GENERAL[key] ?? FALLBACK, face: BOARDLY_FACE, frames: BOARDLY_FRAMES };
  const game = getGame(gameType);
  const art = game?.badges?.[key] ?? FALLBACK;
  return {
    art,
    face: art.face ?? lidColors(gameType)[0],
    frames: game?.badgeFrames ?? BOARDLY_FRAMES,
  };
}

// The profile, made ready before it's opened. Once the app has settled
// after starting, the player's card is fetched and the four badges it
// shows are baked, so the first visit to the profile draws at once
// instead of waiting on the network and then on the badges.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { InteractionManager } from "react-native";

import { api } from "@/api/client";
import { badgeImage } from "@/components/badges/bake";
import { useSession } from "@/context/SessionContext";
import { badgeArt } from "@/features/badges/art";

/** The player card's query (the profile, the badge hall, the shop). */
export const statsQuery = (userId: string | undefined) => ({
  queryKey: ["stats", userId],
  queryFn: async () => (await api.auth.stats()).stats,
  enabled: userId !== undefined,
});

/** The size the profile shows its badges at (ShowcaseRow). */
const SHOWCASE = 64;

export function useWarmProfile() {
  const queryClient = useQueryClient();
  const userId = useSession().user?.id;
  useEffect(() => {
    if (!userId) return;
    let live = true;
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const card = await queryClient.fetchQuery({ ...statsQuery(userId), staleTime: 30_000 });
        if (!live) return;
        for (const key of card.showcase) {
          const badge = card.badges.find((b) => b.key === key);
          if (!badge) continue;
          const { art, face, frames } = badgeArt(badge.key, badge.gameType);
          badgeImage({ art, tier: badge.tier ?? "bronze", frames, tint: art.face ?? face }, false, SHOWCASE);
        }
      } catch {
        // the profile fetches it itself when opened
      }
    });
    return () => {
      live = false;
      task.cancel();
    };
  }, [userId, queryClient]);
}

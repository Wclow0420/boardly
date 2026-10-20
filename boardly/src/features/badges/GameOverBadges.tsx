// Badges when a game ends, for every game (the shared game screen shows
// this; games do nothing). The player card is fetched again once the
// game is over; anything that game earned is celebrated a moment later,
// and under the result sits the next badge to work towards.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { api } from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/theme";
import { BadgeCelebration } from "./BadgeCelebration";
import { NextBadge } from "./NextBadge";
import { earnedLastGame, nextBadge, type LevelUp } from "./order";
import { useSeenBadges } from "./useSeenBadges";

/** Let the result land before the badges arrive. */
const CELEBRATE_AFTER_MS = 2200;

export function GameOverBadges({ gameType }: { gameType: string }) {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, radius, spacing } = useTheme();
  const still = useSharedValue(0);

  // the card as it stands now that the game is over
  const [since] = useState(() => Date.now());
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["stats", user?.id] });
  }, [queryClient, user?.id]);
  const statsQuery = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => (await api.auth.stats()).stats,
    enabled: user !== null,
  });
  const card = statsQuery.dataUpdatedAt >= since ? statsQuery.data : undefined;

  const { seen, markSeen } = useSeenBadges(user?.id);
  // fixed once found, so marking them seen doesn't cut the show short
  const [toCelebrate, setToCelebrate] = useState<LevelUp[] | null>(null);
  const earned = useMemo(
    () =>
      card && seen ? earnedLastGame(card.badges, card.lastGameAt, seen) : null,
    [card, seen],
  );
  useEffect(() => {
    if (toCelebrate !== null || earned === null) return;
    const timer = setTimeout(() => setToCelebrate(earned), CELEBRATE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [earned, toCelebrate]);

  const onShown = useCallback((id: string) => markSeen([id]), [markSeen]);
  const next = card ? nextBadge(card.badges, gameType) : null;

  return (
    <>
      {next ? (
        <View
          style={[
            styles.next,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
            },
          ]}
        >
          <NextBadge
            badge={next}
            clock={still}
            color={colors.text}
            muted={colors.textMuted}
          />
        </View>
      ) : null}
      <BadgeCelebration
        badges={toCelebrate ?? []}
        next={next}
        onShown={onShown}
        onProfile={() => router.push("/profile")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  next: { borderWidth: 1 },
});

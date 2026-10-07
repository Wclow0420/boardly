import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSession } from "@/context/SessionContext";

/** Coins earned from finished games that haven't been claimed yet. */
export function useRewards() {
  const { user, status } = useSession();
  return useQuery({
    queryKey: ["rewards", user?.id],
    queryFn: () => api.rewards.list(),
    enabled: status === "signedIn",
    // Rewards appear when a game ends, so always look again on return
    staleTime: 0,
  });
}

/** Re-checks waiting rewards, e.g. right after a game finishes. */
export function useRefreshRewards() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["rewards"] });
}

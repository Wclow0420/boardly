import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSession } from "@/context/SessionContext";

/** What my latest games paid. The coins are already on the balance:
 *  they go there by themselves when a game ends. */
export function useRecentRewards() {
  const { user, status } = useSession();
  return useQuery({
    queryKey: ["rewards", user?.id],
    queryFn: () => api.rewards.recent(),
    enabled: status === "signedIn",
    // A payment appears when a game ends, so always look again
    staleTime: 0,
  });
}

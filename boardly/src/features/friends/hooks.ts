// Data hooks for the Friends screen. Mock-backed for now.

import { useMemo, useState } from "react";

import { MOCK_FRIENDS } from "@/data/mock";
import type { Friend } from "@/data/types";

export type FriendTab = "friends" | "requests" | "recent";

export const FRIEND_TABS: FriendTab[] = ["friends", "requests", "recent"];

export function useFriends() {
  const [tab, setTab] = useState<FriendTab>("friends");

  const friends: Friend[] = useMemo(
    () =>
      tab === "friends"
        ? MOCK_FRIENDS
        : MOCK_FRIENDS.filter((f) => f.group === tab),
    [tab]
  );

  return { friends, tab, setTab };
}

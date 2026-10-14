// Which earned badges this device has already shown, so a badge stamps
// down onto the player card once — the first time it is seen — and
// never again (like a game's set pieces).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const keyFor = (userId: string) => `badges-seen:${userId}`;

export function useSeenBadges(userId: string | undefined) {
  const [seen, setSeen] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    AsyncStorage.getItem(keyFor(userId))
      .then((saved) => {
        if (live)
          setSeen(new Set(saved ? (JSON.parse(saved) as string[]) : []));
      })
      .catch(() => {
        if (live) setSeen(new Set());
      });
    return () => {
      live = false;
    };
  }, [userId]);

  /** Remember these as shown. */
  const markSeen = useCallback(
    (keys: string[]) => {
      if (!userId || keys.length === 0) return;
      setSeen((now) => {
        const next = new Set([...(now ?? []), ...keys]);
        AsyncStorage.setItem(keyFor(userId), JSON.stringify([...next])).catch(
          () => {},
        );
        return next;
      });
    },
    [userId],
  );

  /** null until the device's record has loaded. */
  return { seen, markSeen };
}

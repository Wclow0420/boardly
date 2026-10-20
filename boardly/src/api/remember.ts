// A few answers kept on the phone between launches: the game list, my
// tables and my player card. On start they're put back before the screens
// ask, so Home and the profile draw at once with what they showed last
// time; each is then refreshed from the server as usual (they come back
// marked old). Only these small, per-player lists are kept — never a
// game's state.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";

const KEY = "boardly.remembered.v1";
/** Which queries are kept, by the first part of their key. */
const KEPT = new Set(["games", "myTables", "stats"]);
/** Older than this, a kept answer isn't shown at all. */
const MAX_AGE = 7 * 24 * 3600 * 1000;

type Saved = { key: unknown[]; data: unknown; at: number }[];

/** Puts the kept answers back (call once, before the first screen). */
export async function restore(client: QueryClient) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const now = Date.now();
    for (const { key, data, at } of JSON.parse(raw) as Saved) {
      // marked as fetched long ago: shown at once, refreshed straight away
      if (now - at < MAX_AGE) client.setQueryData(key, data, { updatedAt: 0 });
    }
  } catch {
    // nothing kept, or it couldn't be read: the screens fetch as usual
  }
}

/** Keeps the kept answers saved as they change (a second after the last
 *  change, so a burst of updates is one write). */
export function rememberChanges(client: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    const saved: Saved = client
      .getQueryCache()
      .getAll()
      .filter((q) => KEPT.has(String(q.queryKey[0])) && q.state.data !== undefined && q.state.dataUpdatedAt > 0)
      .map((q) => ({ key: q.queryKey as unknown[], data: q.state.data, at: q.state.dataUpdatedAt }));
    AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  };
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || !KEPT.has(String(event.query.queryKey[0]))) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 1000);
  });
}

/** Forgets them (signing out). */
export function forget() {
  return AsyncStorage.removeItem(KEY).catch(() => {});
}

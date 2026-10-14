import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Which of the game's full-screen moments this player has already
 *  watched: the role card being dealt, and the last night whose
 *  anonymous letters were delivered. `books` is the nights on which the
 *  Chapel's record was opened. */
interface Watched {
  dealt: boolean;
  letters: number | null;
  books: number[];
  /** The last move shown as a walk in (see arrival.ts). */
  walked: string | null;
}

const FRESH: Watched = { dealt: false, letters: null, books: [], walked: null };
const keyFor = (sessionId: string) => `boardly.nightwatch.watched.${sessionId}`;

/** Remembers on the device what has been watched, so each moment plays
 *  once per game and not again after a reload or on coming back to the
 *  table. `ready` is false until that memory has been read: nothing
 *  should play before then. */
export function useSetPieces(sessionId: string | undefined) {
  const [watched, setWatched] = useState<Watched>(FRESH);
  const [ready, setReady] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    AsyncStorage.getItem(keyFor(sessionId))
      .then((saved) => {
        if (live && saved) setWatched((now) => ({ ...now, ...(JSON.parse(saved) as Watched) }));
      })
      .catch(() => {})
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [sessionId]);

  const mark = (change: Partial<Watched>) => {
    const next = { ...watched, ...change };
    setWatched(next);
    if (sessionId) {
      AsyncStorage.setItem(keyFor(sessionId), JSON.stringify(next)).catch(() => {});
    }
  };

  return { ready, watched, mark };
}

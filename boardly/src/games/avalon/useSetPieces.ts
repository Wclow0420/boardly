import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Which of Double Agent's moments this player has already watched: the
 *  role card being dealt, and how many team votes and operations have
 *  been revealed on the stage (null until the board has first counted
 *  them, so joining late doesn't replay the past). */
interface Watched {
  dealt: boolean;
  votes: number | null;
  missions: number | null;
}

const FRESH: Watched = { dealt: false, votes: null, missions: null };
export const setPiecesKey = (sessionId: string) => `boardly.avalon.watched.${sessionId}`;

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
    AsyncStorage.getItem(setPiecesKey(sessionId))
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
    if (sessionId) AsyncStorage.setItem(setPiecesKey(sessionId), JSON.stringify(next)).catch(() => {});
  };

  return { ready, watched, mark };
}

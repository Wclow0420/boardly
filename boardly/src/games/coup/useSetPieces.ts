import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/** What this player has already watched in a game of Hustle: their two
 *  cards dealt, and how far through the table's log the big moments (a
 *  challenge settled, someone put out) have been played on the stage;
 *  null until the board first counts the log, so joining late doesn't
 *  replay the past. */
export interface Watched {
  dealt: boolean;
  shown: number | null;
}

const FRESH: Watched = { dealt: false, shown: null };
const keyFor = (sessionId: string) => `boardly.coup.watched.${sessionId}`;

/** Remembers on the device what has been watched, so each moment plays
 *  once per game and not again after a reload. `ready` is false until
 *  that memory has been read: nothing should play before then. */
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
    setWatched((now) => {
      const next = { ...now, ...change };
      if (sessionId) AsyncStorage.setItem(keyFor(sessionId), JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return { ready, watched, mark };
}

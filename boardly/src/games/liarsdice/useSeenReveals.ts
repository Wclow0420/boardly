import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const keyFor = (sessionId: string) => `boardly.liarsdice.watched.${sessionId}`;

/** The last round whose reveal this player has watched, remembered on the
 *  device so each reveal plays once, even across a reload. `revealed` is
 *  null until the board has first counted what's already happened (so
 *  joining late doesn't replay the past); `ready` is false until the
 *  memory has been read. */
export function useSeenReveals(sessionId: string | undefined) {
  const [revealed, setRevealed] = useState<number | null>(null);
  const [ready, setReady] = useState(!sessionId);
  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    AsyncStorage.getItem(keyFor(sessionId))
      .then((saved) => {
        if (live && saved !== null) setRevealed(Number(saved));
      })
      .catch(() => {})
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [sessionId]);
  const mark = (round: number) => {
    setRevealed(round);
    if (sessionId) AsyncStorage.setItem(keyFor(sessionId), String(round)).catch(() => {});
  };
  return { ready, revealed, mark };
}

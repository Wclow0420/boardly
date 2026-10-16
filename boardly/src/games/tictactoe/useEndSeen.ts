import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const keyFor = (sessionId: string) => `boardly.tictactoe.watched.${sessionId}`;

/** Whether this player has gone on from the finished board to the
 *  ending, remembered on the device so a reload or a return to the table
 *  goes straight to it. `ready` is false until the memory has been read. */
export function useEndSeen(sessionId: string | undefined) {
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(!sessionId);
  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    AsyncStorage.getItem(keyFor(sessionId))
      .then((saved) => {
        if (live && saved) setSeen(true);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [sessionId]);
  const mark = () => {
    setSeen(true);
    if (sessionId) AsyncStorage.setItem(keyFor(sessionId), "1").catch(() => {});
  };
  return { ready, seen, mark };
}

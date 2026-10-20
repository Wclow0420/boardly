import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export const shakenKey = (sessionId: string) => `boardly.liarsdice.shaken.${sessionId}`;

/** The last round this player has shaken their cup for and started,
 *  remembered on the device so a reload or a rejoin doesn't ask for the
 *  shake again. `ready` is false until the memory has been read. */
export function useShaken(sessionId: string | undefined) {
  const [shaken, setShaken] = useState(0);
  const [ready, setReady] = useState(!sessionId);
  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    AsyncStorage.getItem(shakenKey(sessionId))
      .then((saved) => {
        if (live && saved !== null) setShaken(Number(saved));
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
    setShaken(round);
    if (sessionId) AsyncStorage.setItem(shakenKey(sessionId), String(round)).catch(() => {});
  };
  return { ready, shaken, mark };
}

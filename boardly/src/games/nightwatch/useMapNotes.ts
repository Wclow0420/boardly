import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** The player's own guesses: by night, which room they put each seat in.
 *  Never sent anywhere — it stays on this device. */
export type MapNotes = Record<number, Record<number, number>>;

const keyFor = (sessionId: string) => `boardly.nightwatch.mapNotes.${sessionId}`;

/** The map notes of one game, kept on the device so they survive a
 *  reload. Without a session id they last as long as the screen does. */
export function useMapNotes(sessionId: string | undefined) {
  const [notes, setNotes] = useState<MapNotes>({});

  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    AsyncStorage.getItem(keyFor(sessionId))
      .then((saved) => {
        if (!live || !saved) return;
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          // anything noted before the load finished wins
          setNotes((now) => (Object.keys(now).length ? now : (parsed as MapNotes)));
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [sessionId]);

  /** Puts a seat in a room for that night; null takes the note away. */
  const setNote = (round: number, seat: number, room: number | null) => {
    const night = { ...(notes[round] ?? {}) };
    if (room === null) delete night[seat];
    else night[seat] = room;
    const next = { ...notes, [round]: night };
    setNotes(next);
    if (sessionId) {
      AsyncStorage.setItem(keyFor(sessionId), JSON.stringify(next)).catch(() => {});
    }
  };

  return { notes, setNote };
}

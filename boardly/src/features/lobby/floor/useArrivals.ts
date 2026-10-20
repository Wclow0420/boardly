// Who walks out of the lift: each player once per device per table, the
// first time this phone sees them at it. Remembered on the device by the
// table's code, so a reload, a rejoin or coming back to the lobby shows
// everyone already standing in their place. Opening a table for the
// first time, the ones already there are standing; you walk out.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const keyFor = (code: string) => `boardly.lobby.arrived.${code}`;

export function useArrivals(code: string, ids: string[], me: string | undefined) {
  const seen = useRef<Set<string> | null>(null);
  /** The table whose memory has been read. */
  const [readFor, setReadFor] = useState<string | null>(null);
  const ready = readFor === code;
  /** Who is walking now, each with when they set off (a token). */
  const [walking, setWalking] = useState<Record<string, number>>({});
  const idsKey = ids.join(",");

  useEffect(() => {
    let live = true;
    seen.current = null;
    AsyncStorage.getItem(keyFor(code))
      .then((saved) => {
        if (!live) return;
        seen.current = saved ? new Set(JSON.parse(saved) as string[]) : new Set(ids.filter((id) => id !== me));
      })
      .catch(() => {
        if (live) seen.current = new Set(ids);
      })
      .finally(() => {
        if (live) setReadFor(code);
      });
    return () => {
      live = false;
    };
    // read once per table: later arrivals are found below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    const known = seen.current;
    if (!ready || !known) return;
    const fresh = ids.filter((id) => !known.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => known.add(id));
    AsyncStorage.setItem(keyFor(code), JSON.stringify([...known])).catch(() => {});
    const now = Date.now();
    setWalking((was) => ({ ...was, ...Object.fromEntries(fresh.map((id, i) => [id, now + i])) }));
    // ids stands for idsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey, code]);

  const arrived = useCallback((id: string) => {
    setWalking((was) => {
      if (!(id in was)) return was;
      const next = { ...was };
      delete next[id];
      return next;
    });
  }, []);

  return { ready, walking, arrived };
}

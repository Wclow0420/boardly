// Where a table is left for, and the word waiting there. Leaving a table
// (the lobby's leave or close, a game's back or its ending) lands on the
// Me tab, where the app opens. A host who takes me off a waiting table
// sends me there too, with a short word ("You were removed from the
// table"), shown once by the Me tab.

import { useSyncExternalStore } from "react";

/** The Me tab: where leaving a table lands. */
export const ME = "/mascot";

/** What the Me tab has to say when I land: the table I was removed from. */
let removedFrom: string | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

/** The host took me off the table with this code. */
export function noteRemoved(code: string) {
  if (removedFrom === code) return;
  removedFrom = code;
  changed();
}

/** The word was read. */
export function clearRemoved() {
  if (removedFrom === null) return;
  removedFrom = null;
  changed();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const read = () => removedFrom;

/** The code of the table I was just removed from, until it's read. */
export function useRemovedNotice(): string | null {
  return useSyncExternalStore(subscribe, read, read);
}

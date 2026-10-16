// Letting go when the phone runs short. iOS warns an app before it closes
// it for using too much memory; on that warning every cache of drawn art
// that registered here is emptied (anything still on screen keeps its own
// copy, and the rest is simply drawn again when next needed), so the
// system can take the memory back instead of closing the app.

import { AppState } from "react-native";

const clearers = new Set<() => void>();

/** Empty `clear`'s cache when memory runs short. */
export function onMemoryWarning(clear: () => void) {
  clearers.add(clear);
}

/** Empty every registered cache now. */
export function releaseCaches() {
  for (const clear of clearers) {
    try {
      clear();
    } catch {
      // one cache failing to empty mustn't stop the others
    }
  }
  // the art's memory comes back when the JS objects holding it are
  // collected: collect now rather than whenever the engine next would
  (globalThis as { gc?: () => void }).gc?.();
}

AppState.addEventListener("memoryWarning", releaseCaches);

// Haptic feedback helpers — game-feel standard: every tappable control
// gives light feedback, game moves land heavier, results celebrate.
// No-ops on web; failures are swallowed (haptics are never critical).

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS !== "web";

// Haptics must never crash the app, so failures are swallowed — but in
// development, surface the classic mistake once: expo-haptics is a
// NATIVE module, so a dev build compiled before it was installed won't
// have it (rebuild the dev client to get haptics).
let warned = false;
function swallow(err: unknown) {
  if (__DEV__ && !warned) {
    warned = true;
    console.warn(
      "[haptics] expo-haptics unavailable — if this is a development " +
        "build made before expo-haptics was added, rebuild the dev client.",
      err
    );
  }
}

/** Light tick for ordinary buttons, chips, tabs, toggles. */
export function tapHaptic() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow);
}

/** Firmer thud for game moves (placing a piece, playing a card). */
export function moveHaptic() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(swallow);
}

/** Win / game start celebrations. */
export function successHaptic() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    swallow
  );
}

/** Errors and rejected actions. */
export function errorHaptic() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    swallow
  );
}

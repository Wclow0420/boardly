// Sharing an invite: the native share sheet where there is one, and a
// copy-to-clipboard fallback where there isn't (desktop browsers).

import * as Clipboard from "expo-clipboard";
import { Platform, Share } from "react-native";

export type ShareOutcome = "shared" | "copied" | "dismissed";

export async function shareOrCopy(
  message: string,
  link: string
): Promise<ShareOutcome> {
  const canShare =
    Platform.OS !== "web" ||
    (typeof navigator !== "undefined" && typeof navigator.share === "function");

  if (canShare) {
    try {
      await Share.share({ message });
      return "shared";
    } catch {
      // Closing the share sheet rejects on web — that's not an error
      return "dismissed";
    }
  }
  await Clipboard.setStringAsync(link);
  return "copied";
}

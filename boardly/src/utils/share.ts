// Sharing an invite: the native share sheet where there is one, and a
// copy-to-clipboard fallback where there isn't (desktop browsers).

import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

/** The link that brings someone to a table. In the store app this is
 *  https://boardly.lol/join/CODE, which opens the app when it is
 *  installed and a "get the app" page when it isn't. Other builds have
 *  no website behind them and use their own scheme (boardly-dev://). */
export function inviteLink(code: string): string {
  const origin = Constants.expoConfig?.extra?.LINK_ORIGIN as string | null;
  return origin && Platform.OS !== "web"
    ? `${origin}/join/${code}`
    : Linking.createURL(`join/${code}`);
}

/** The /join/CODE path inside a link that opened the app, if it is an
 *  invite: https://boardly.lol/join/CODE or boardly://join/CODE. */
export function invitePathFromLink(url: string | null): string | null {
  const code = /\/join\/([A-Za-z0-9]{6})\/?(?:[?#].*)?$/.exec(url ?? "")?.[1];
  return code ? `/join/${code.toUpperCase()}` : null;
}

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

// The night events' engraved emblems, as the medallion and its popup
// show them.

import type { EmblemData } from "@/components/engraved/emblem";
import { emblemData } from "@/components/icons";
import { EMBLEMS } from "../emblems";
import { EMOJI_ICON } from "../icons";
import { EVENT_EMOJI, type NightEvent } from "../logic";

/** An event's engraved emblem: the game's own icon for its emoji (😵 is
 *  the dizzy sleeper here, not the app's die), else the app's. */
export function eventEmblem(event: NightEvent): { data: EmblemData; tint?: string } | null {
  const emoji = EVENT_EMOJI[event].replace(/\uFE0F/g, "");
  const own = EMOJI_ICON[emoji] ? EMBLEMS[EMOJI_ICON[emoji]] : undefined;
  return own ? { data: own, tint: "#F0CC72" } : emblemData(emoji);
}

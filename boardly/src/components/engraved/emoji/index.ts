// Every emoji the app writes that has an engraved emblem, for AppText
// (and <Emblem>) to draw in its place. Where two sets draw the same
// emoji, the app's own (components/icons) wins, then the sets drawn for
// emoji in this folder, then Seal the Manor's and Shelter's game icons,
// reused here by their emoji.

import {
  EMOJI_ICON as MANOR_EMOJI,
  type IconName as ManorIcon,
} from "@/games/nightwatch/icons";
import { EMBLEMS as MANOR_EMBLEMS } from "@/games/nightwatch/emblems";
import {
  EMOJI_ICON as SHELTER_EMOJI,
  type IconName as ShelterIcon,
} from "@/games/shelter/icons";
import { EMBLEMS as SHELTER_EMBLEMS } from "@/games/shelter/emblems";
import type { EmblemData } from "../emblem";
import { EMBLEMS as MANOR } from "./manor";
import { EMBLEMS as SPIES } from "./spies";

export interface EmojiEmblem {
  data: EmblemData;
  /** The colour its "tint" parts take. */
  tint?: string;
}

const GOOD = "#3FA34D";
const BAD = "#D9513B";
/** Icons whose meaning is their colour (a thumbs-down is red). */
const TINT: Record<string, string> = {
  check: GOOD,
  up: GOOD,
  cross: BAD,
  down: BAD,
  blocked: BAD,
  food: GOOD,
  sabotage: BAD,
  infected: BAD,
  mold: BAD,
  zombie: BAD,
  injured: BAD,
};

const strip = (emoji: string) => emoji.replace(/️/g, "");

function fromGame<N extends string>(
  emoji: Record<string, N>,
  emblems: Partial<Record<N, EmblemData>>,
) {
  const out: Record<string, EmojiEmblem> = {};
  for (const [e, name] of Object.entries(emoji) as [string, N][]) {
    const data = emblems[name];
    if (data) out[strip(e)] = { data, tint: TINT[name] };
  }
  return out;
}

/** Sets drawn for emoji: Hustle and Double Agent's (spies), Liar's
 *  Dice and Manor's (manor). */
const sets: Record<string, EmblemData>[] = [SPIES, MANOR];

export const EMOJI_EMBLEMS: Record<string, EmojiEmblem> = {
  ...fromGame<ShelterIcon>(SHELTER_EMOJI, SHELTER_EMBLEMS),
  ...fromGame<ManorIcon>(MANOR_EMOJI, MANOR_EMBLEMS),
  ...Object.fromEntries(
    sets.flatMap((set) =>
      Object.entries(set).map(([e, data]) => [strip(e), { data }]),
    ),
  ),
};

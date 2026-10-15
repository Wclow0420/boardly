// The game's icons as engraved emblems, in two halves drawn side by side.

import type { EmblemData } from "@/components/engraved/emblem";
import type { IconName } from "../icons";
import { EMBLEMS as PART1 } from "./part1";
import { EMBLEMS as PART2 } from "./part2";

export const EMBLEMS: Partial<Record<IconName, EmblemData>> = {
  ...PART1,
  ...PART2,
};

// Every art border's drawing, by id (the ids in borders.ts).

import { EARNED_ART } from "./earned";
import { EPIC_ART } from "./epic";
import type { ArtBorderDrawing } from "./kit";
import { LEGENDARY_ART } from "./legendary";
import { RARE_ART } from "./rare";

export const ART: Record<string, ArtBorderDrawing> = {
  ...RARE_ART,
  ...EPIC_ART,
  ...LEGENDARY_ART,
  ...EARNED_ART,
};

export { BorderClockProvider, useBorderClock } from "./kit";
export type { ArtBorderDrawing } from "./kit";

// Every art border's drawing, by id (the ids in borders.ts).

import { BAROQUE_ART } from "./baroque";
import { CREST_ART } from "./crest";
import { CROWN_ART } from "./crowns";
import { EARNED_ART } from "./earned";
import { EPIC_ART } from "./epic";
import { FALLEN_ART } from "./fallen";
import { FRAME_ART } from "./frames";
import type { ArtBorderDrawing } from "./kit";
import { LEGENDARY_ART } from "./legendary";
import { RARE_ART } from "./rare";
import { RIM_ART } from "./rimBorders";
import { SERAPH_ART } from "./seraph";

export const ART: Record<string, ArtBorderDrawing> = {
  ...RARE_ART,
  ...EPIC_ART,
  ...LEGENDARY_ART,
  ...EARNED_ART,
  ...FRAME_ART,
  ...CROWN_ART,
  ...RIM_ART,
  ...SERAPH_ART,
  ...FALLEN_ART,
  ...CREST_ART,
  ...BAROQUE_ART,
};

export { BorderClockProvider, useBorderClock } from "./kit";
export type { ArtBorderDrawing } from "./kit";

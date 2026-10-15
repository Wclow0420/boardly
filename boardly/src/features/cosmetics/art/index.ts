// Every art border's drawing, by id (the ids in borders.ts).

import { BAROQUE_ART } from "./baroque";
import { CREST_ART } from "./crest";
import { CROWN_ART } from "./crowns";
import { EARNED_ART } from "./earned";
import { EPIC_ART } from "./epic";
import { FALLEN_ART } from "./fallen";
import { ELEMENTS_ART } from "./elements";
import { FRAME_ART } from "./frames";
import { HERALDRY_ART } from "./heraldry";
import type { ArtBorderDrawing } from "./kit";
import { LEGENDARY_ART } from "./legendary";
import { RADIANT_ART } from "./radiant";
import { GARDEN_ART } from "./garden";
import { TABLETOP_ART } from "./tabletop";
import { RIM_ART } from "./rimBorders";
import { SERAPH_ART } from "./seraph";

export const ART: Record<string, ArtBorderDrawing> = {
  ...TABLETOP_ART,
  ...GARDEN_ART,
  ...EPIC_ART,
  ...LEGENDARY_ART,
  ...EARNED_ART,
  ...FRAME_ART,
  ...HERALDRY_ART,
  ...RADIANT_ART,
  ...ELEMENTS_ART,
  ...CROWN_ART,
  ...RIM_ART,
  ...SERAPH_ART,
  ...FALLEN_ART,
  ...CREST_ART,
  ...BAROQUE_ART,
};

export { BorderClockProvider, useBorderClock } from "./kit";
export type { ArtBorderDrawing } from "./kit";

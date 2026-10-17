// Whether Seal the Manor's board draws the room flat on (FlatRoom, which
// falls back to the iso RoomScene for rooms not drawn flat yet). The game
// draws flat; the dev page can turn it off (&flat=0) to compare with iso.

import { createContext } from "react";

export const FlatPreview = createContext(true);

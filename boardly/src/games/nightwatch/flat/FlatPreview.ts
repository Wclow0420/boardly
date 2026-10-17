// Development only: while the owner compares the two, the dev page can
// ask Seal the Manor's board to draw the room flat on (FlatRoom) instead
// of in iso (RoomScene). The game itself never sets it.

import { createContext } from "react";

export const FlatPreview = createContext(false);

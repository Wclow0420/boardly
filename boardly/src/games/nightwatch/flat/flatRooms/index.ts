// The manor's rooms drawn flat on, by room: one line each. A room not
// here is still drawn in iso (RoomScene). See types.ts for what a room
// hands FlatRoom.

import type { RoomId } from "../../logic";
import type { FlatRoomDef } from "./types";
import { belltower } from "./belltower";
import { chapel } from "./chapel";
import { gallery } from "./gallery";
import { hall } from "./hall";
import { study } from "./study";
import { dining } from "./dining";
import { cellar } from "./cellar";
import { kitchen } from "./kitchen";
import { garden } from "./garden";

export const FLAT_ROOMS: Partial<Record<RoomId, FlatRoomDef>> = {
  belltower,
  chapel,
  gallery,
  hall,
  study,
  dining,
  cellar,
  kitchen,
  garden,
};

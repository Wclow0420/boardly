// Every game's own room, by game key (Hustle's is in ../rooms.ts). Each
// room is one file here, so they can be drawn apart.

import type { RoomLook } from "../roomTypes";
import { ROOM as nightwatch } from "./nightwatch";
import { ROOM as shelter } from "./shelter";
import { ROOM as avalon } from "./avalon";
import { ROOM as tictactoe } from "./tictactoe";
import { ROOM as liarsdice } from "./liarsdice";
import { ROOM as manor } from "./manor";

export const GAME_ROOMS: [string, RoomLook][] = (
  [["nightwatch", nightwatch], ["shelter", shelter], ["avalon", avalon], ["tictactoe", tictactoe], ["liarsdice", liarsdice], ["manor", manor]] as [string, RoomLook | null][]
).filter((entry): entry is [string, RoomLook] => entry[1] !== null);

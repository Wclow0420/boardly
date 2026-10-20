// What a game's room on its floor is made of (see rooms.ts). Kept apart so
// each game's room (rooms/<key>.ts) can use it without importing rooms.ts.

import type { PopupLook } from "@/features/game/Popup";
import type { RoomLayout } from "./layout";

export interface RoomLook {
  /** The lamps' light, for the glows and pools. */
  light: string;
  /** The room's still art, w × h (the door, the wall, the board, the
   *  table, the floor), for the lift's `floor` of `floors`. */
  art: (R: RoomLayout, floor: number, floors: number) => string;
  /** A lamp over a spot, lit and out, w × h (hung from the middle of
   *  its top edge). */
  lamp: { lit: () => string; out: () => string; w: number; h: number };
  /** What's set out on the table for each player, w × h. */
  piece?: { art: () => string; w: number; h: number };
  /** The board's ink: its title and its line. */
  board: { title: string; text: string };
  /** The popups opened from the room. */
  popup: PopupLook;
}

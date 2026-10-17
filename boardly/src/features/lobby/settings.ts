// The game's settings at a table (e.g. Liar's Dice: knockout or endless),
// set by the host while the table waits. Labels live in the locale files
// under gameOptions.<game>.<option>.

import type { RoomInfo } from "@/api/client";

/** The game's settings at this table: each one's name, its choices and
 *  the one the host has picked (the first until they pick). */
export function roomSettings(room: RoomInfo) {
  const choices = room.game?.options ?? {};
  return Object.keys(choices).map((name) => ({
    name,
    choices: choices[name],
    current: room.options?.[name] ?? choices[name][0],
  }));
}

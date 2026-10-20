// Which floor of the lift a game is on, as the Games tab's dial numbers
// it: its floor in its own type's bank (not the "your floors" bank), so
// the lobby's sign reads the same number ("3F").

import { floorOfGame } from "@/features/games/lift/banks";
import { useLiftBuilding } from "@/features/games/lift/building";

export function useLiftFloor(gameType: string | undefined): { floor: number; floors: number } {
  const building = useLiftBuilding();
  return {
    floor: gameType ? floorOfGame(building, gameType) : 1,
    floors: Math.max(1, building.floors.length),
  };
}

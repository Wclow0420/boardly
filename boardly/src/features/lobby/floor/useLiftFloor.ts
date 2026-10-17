// Which floor of the lift a game is on: the Games tab's lift has a floor
// per game in the catalogue's order (the server's), so the lobby's sign
// reads the same number the dial showed ("3F").

import { useGamesQuery } from "@/features/games/hooks";

export function useLiftFloor(gameType: string | undefined): { floor: number; floors: number } {
  const games = useGamesQuery().data ?? [];
  const i = games.findIndex((g) => g.id === gameType);
  return { floor: i >= 0 ? i + 1 : 1, floors: Math.max(1, games.length) };
}

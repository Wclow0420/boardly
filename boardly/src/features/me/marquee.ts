// What the lobby's marquee says, a line at a time: the house's news,
// friends who are on, a new game on its floor, and the game of the day,
// from what the app already has. Add a line by adding to NEWS (a string
// under me.news) or another source below.

import type { TFunction } from "i18next";

import type { Friend, GameCatalogEntry } from "@/data/types";

/** The house's news, newest first: keys under me.news. */
export const NEWS = ["manorMap"];

export interface MarqueeSources {
  t: TFunction;
  gameName: (key: string | undefined, fallback?: string | null) => string;
  games: GameCatalogEntry[];
  /** Friends online now (and what they're playing). */
  friends: Friend[];
  /** Whether a game is new. */
  isNew: (game: GameCatalogEntry) => boolean;
  /** A game's floor in the lift. */
  floorOf: (gameKey: string) => number;
  /** Today, for the game of the day (a new one each day). */
  day?: number;
}

export function marqueeLines({ t, gameName, games, friends, isNew, floorOf, day }: MarqueeSources): string[] {
  const lines: string[] = NEWS.map((k) => t(`me.news.${k}`));

  // friends on now: one playing, then everyone on
  const playing = friends.find((f) => f.presence === "inGame" && f.playing);
  if (playing) {
    lines.push(t("me.marquee.playing", { name: playing.name, game: gameName(playing.playing ?? undefined) }));
  }
  if (friends.length === 1 && !playing) lines.push(t("me.marquee.online_one", { name: friends[0].name }));
  else if (friends.length > 1) lines.push(t("me.marquee.online_other", { count: friends.length }));

  // a new game on its floor
  for (const g of games.filter(isNew).slice(0, 2)) {
    lines.push(t("me.marquee.newGame", { floor: floorOf(g.id), game: gameName(g.id, g.name) }));
  }

  // the game of the day: the same all day, another tomorrow
  if (games.length) {
    const today = day ?? Math.floor(Date.now() / 86_400_000);
    const g = games[today % games.length];
    lines.push(t("me.marquee.ofTheDay", { game: gameName(g.id, g.name) }));
  }
  if (!lines.length) lines.push(t("me.marquee.welcome"));
  return lines;
}

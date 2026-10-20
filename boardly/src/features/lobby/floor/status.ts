// The one line over the plinth in the floor lobby: what the table is
// waiting for. Too few seated: how many more are needed. Someone not
// ready: who ("you" first, then by name, the rest counted). Everyone
// ready: the host can start, the others wait for the host.

import { shortName } from "@/features/game/stage/PlayerName";

type T = (key: string, options?: Record<string, unknown>) => string;

export interface StatusPerson {
  name: string;
  ready: boolean;
  host: boolean;
  me: boolean;
}

/** Names as a list that fits a line: "Ben and Ada", "Ben, Ada and
 *  Kai", or past that (or when long) "Ben, Ada and 3 more". */
export function nameList(names: string[], t: T): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return t("lobby.floor.two", { a: names[0], b: names[1] });
  if (names.length === 3 && names.join("").length <= 18) return t("lobby.floor.three", { a: names[0], b: names[1], c: names[2] });
  return t("lobby.floor.more", { a: names[0], b: names[1], count: names.length - 2 });
}

export function lobbyStatus(people: StatusPerson[], min: number, t: T): { text: string; ready: boolean } {
  if (people.length < min) {
    return { text: t("lobby.floor.needMore", { count: min - people.length }), ready: false };
  }
  const waiting = people.filter((p) => !p.host && !p.ready);
  if (waiting.length > 0) {
    const names = [...waiting.filter((p) => p.me).map(() => t("lobby.floor.you")), ...waiting.filter((p) => !p.me).map((p) => shortName(p.name.replace(/^🤖️?\s*/u, ""), 10))];
    return { text: t("lobby.floor.waitingOn", { names: nameList(names, t), count: names.length }), ready: false };
  }
  const iHost = people.some((p) => p.me && p.host);
  if (iHost) return { text: t("lobby.floor.canStart"), ready: true };
  const host = people.find((p) => p.host);
  return { text: t("lobby.floor.waitingHost", { host: host ? shortName(host.name, 12) : "" }), ready: true };
}

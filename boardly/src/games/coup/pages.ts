// Hustle's history as Journal pages: one page per turn (each action
// starts one), its claim, the challenges and blocks it drew, and the
// cards it cost. The same lines feed the hints on the stage.

import type { JournalEntry, JournalPage } from "@/features/game/Journal";
import { ACTION_EMOJI, ROLE_EMOJI } from "./art";
import type { LogEvent } from "./logic";

type T = (key: string, options?: Record<string, unknown>) => string;

/** A log event as one sentence. */
export function describe(event: LogEvent, t: T, nameOf: (seat: number) => string): string {
  const role = (r: string) => t(`coup.roles.${r}.name`);
  switch (event.t) {
    case "action":
      return t(`coup.log.${event.action}`, {
        actor: nameOf(event.actor),
        target: event.target !== null ? nameOf(event.target) : "",
      });
    case "block":
      return t("coup.log.block", { name: nameOf(event.seat), role: role(event.role) });
    case "blocked":
      return t("coup.log.blocked");
    case "challenge":
      return t(event.caught ? "coup.log.caught" : "coup.log.proved", {
        challenger: nameOf(event.challenger),
        claimant: nameOf(event.claimant),
        role: role(event.role),
      });
    case "lose":
      return t(event.why ? `coup.log.lose_${event.why}` : "coup.log.lose", { name: nameOf(event.seat), role: role(event.role) });
    case "out":
      return t("coup.log.out", { name: nameOf(event.seat) });
  }
}

const EMOJI: Record<LogEvent["t"], string> = {
  action: "🪙",
  block: "🛡",
  blocked: "🛡",
  challenge: "⚡",
  lose: "💔",
  out: "🔒",
};

/** The log as pages, one per turn. `mySeat` colours what hurt or helped
 *  me; `from` starts partway (events before it are left out). */
export function hustlePages(log: LogEvent[], mySeat: number, t: T, nameOf: (seat: number) => string, from = 0): JournalPage[] {
  const pages: JournalPage[] = [];
  let turn = log.slice(0, from).filter((e) => e.t === "action").length;
  let entries: JournalEntry[] = [];
  let title = "";
  let subtitle: string | undefined;
  const flush = () => {
    if (entries.length) pages.push({ key: `turn-${turn}-${pages.length}`, title, subtitle, sections: [{ key: "turn", entries }] });
    entries = [];
  };
  for (const event of log.slice(from)) {
    if (event.t === "action") {
      flush();
      turn += 1;
      title = t("coup.journal.turn", { n: turn });
      subtitle = nameOf(event.actor);
    } else if (!title) {
      title = t("coup.journal.turn", { n: Math.max(turn, 1) });
    }
    const mine =
      (event.t === "lose" || event.t === "out") && event.seat === mySeat
        ? "bad"
        : event.t === "challenge" && (event.challenger === mySeat || event.claimant === mySeat)
          ? (event.caught ? event.challenger === mySeat : event.claimant === mySeat)
            ? "good"
            : "bad"
          : "neutral";
    const icon = event.t === "action" ? ACTION_EMOJI[event.action] : event.t === "lose" ? ROLE_EMOJI[event.role] : EMOJI[event.t];
    entries.push({ text: `${icon} ${describe(event, t, nameOf)}`, tone: mine });
  }
  flush();
  return pages;
}

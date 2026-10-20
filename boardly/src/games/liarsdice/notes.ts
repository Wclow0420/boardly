// What this many at the bar means: the dice under the cups, where each
// way of calling starts, what a lost call costs, when you're out. The
// lobby shows it under the house rules (GameDefinition.tableNotes), and
// the board's house-rules card in my hand reads the same lines for the
// table as it stands now (HouseRules.tsx).

import type { TableNote } from "../types";
import { CALLINGS, DICE_EACH, DRINKS, KNOCKOUT_CUPS, openingFor, thresholds, type Calling } from "./logic";

type T = (key: string, options?: Record<string, unknown>) => string;

/** The way this table calls, in a line: its name and where each kind of
 *  call starts for `players` at the table. */
export function callingNote(calling: Calling, players: number, t: T) {
  const [one, zhai, fei] = thresholds(players);
  const rule: Record<Calling, string> = {
    jijiji: t("liarsdice.openRule.jijiji", { one, zhai, fei }),
    classic: t("liarsdice.openRule.classic", { zhai: openingFor(players, true), kai: openingFor(players, false) }),
    nozhai: t("liarsdice.openRule.nozhai", { min: openingFor(players, false) }),
  };
  return t("liarsdice.table.calling", { name: t(`gameOptions.liarsdice.calling.${calling}.name`), rule: rule[calling] });
}

export function liarsTableNotes(players: number, t: T, settings?: Record<string, string>): TableNote[] {
  return [
    {
      emoji: "🎲",
      text: t("liarsdice.table.dice", { count: players * DICE_EACH, each: DICE_EACH }),
      short: t("liarsdice.table.diceShort", { count: players * DICE_EACH }),
    },
    // the way this table calls (all three if it isn't known)
    ...CALLINGS.filter((calling) => !settings?.calling || settings.calling === calling).map((calling) => ({
      emoji: "🎯",
      text: callingNote(calling, players, t),
    })),
    { emoji: "🍺", text: t("liarsdice.table.drinks", DRINKS) },
    // only a knockout table has a cup that puts you out
    ...(settings?.mode === "endless" ? [] : [{ emoji: "🍻", text: t("liarsdice.table.knockout", { count: KNOCKOUT_CUPS }) }]),
  ];
}

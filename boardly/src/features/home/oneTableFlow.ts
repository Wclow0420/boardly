// The flow behind useOneTable().run (OneTable.tsx), apart from the sheet
// so it can be tested on its own.

import { ApiError, type RoomInfo } from "@/api/client";

export type OneTableOutcome = "done" | "back" | "cancelled";
export type Choice = "back" | "leave" | "cancel";

/** The flow behind run(): look for another table of mine first and ask
 *  before the action; if the server still says already_in_room, ask then
 *  and try once more after a Leave. */
export async function decide(
  action: () => Promise<unknown>,
  {
    other,
    ask,
  }: {
    other: () => Promise<RoomInfo | null>;
    ask: (room: RoomInfo) => Promise<Choice>;
  },
): Promise<OneTableOutcome> {
  const before = await other();
  if (before) {
    const choice = await ask(before);
    if (choice !== "leave") return choice === "back" ? "back" : "cancelled";
  }
  try {
    await action();
    return "done";
  } catch (err) {
    if (!(err instanceof ApiError && err.code === "already_in_room")) throw err;
    const after = await other();
    if (!after) throw err;
    const choice = await ask(after);
    if (choice !== "leave") return choice === "back" ? "back" : "cancelled";
    await action();
    return "done";
  }
}

// A role as the game draws it: its engraved emblem (the one in its card's
// window) on its own, with no card behind it, for the rules.

import { Emblem } from "@/components/icons";
import { ROLE_EMOJI } from "./art";
import type { Role } from "./logic";

/** The role's emblem, `size` square. */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  return <Emblem emoji={ROLE_EMOJI[role]} size={size} />;
}

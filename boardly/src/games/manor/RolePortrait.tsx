// A role as the game draws it: its engraved portrait, on its own with no
// card behind it, for the rules, the role card and the reveals.

import { EmblemGlyph } from "@/components/engraved/Engraved";
import { ROLE_EMBLEMS } from "./emblems";
import type { Role } from "./logic";

/** The role's portrait, `size` square. */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  return <EmblemGlyph data={ROLE_EMBLEMS[role]} size={size} />;
}

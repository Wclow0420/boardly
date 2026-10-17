// A role as the game draws it: its engraved portrait (the one on its
// card), on its own with no card behind it, for the rules.

import { EmblemGlyph } from "@/components/engraved/Engraved";
import { ROLE_EMBLEMS } from "./emblems/roles";
import type { Role } from "./logic";

/** The role's portrait, `size` square. */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  return <EmblemGlyph data={ROLE_EMBLEMS[role]} size={size} />;
}

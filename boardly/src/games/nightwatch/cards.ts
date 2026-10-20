// Seal the Manor's role card fronts, as the shared playing cards
// (components/tabletop/cards): a gothic window in night blue for the
// watchers and in crimson for the ghosts, the role's engraved portrait
// (emblems/roles.ts) standing on the window's sill, and an enamel plaque
// for the name. The back is MANOR_BACK (RoleCardFace.tsx).

import { toSvgBody } from "@/components/engraved/emblem";
import { cardFront, type FrontStyle } from "@/components/tabletop/cards/cardArt";
import { ROLE_EMBLEMS } from "./emblems/roles";
import { sideOf, type Role } from "./logic";

export const GOOD_FRONT: FrontStyle = {
  window: ["#5A7ABE", "#22356A", "#0C1634"],
  plaque: ["#4AA06A", "#1E6A3A", "#0E3A1E"],
};
export const EVIL_FRONT: FrontStyle = {
  window: ["#D2445A", "#7A1020", "#2E0408"],
  plaque: ["#D2384A", "#8A1424", "#4A0812"],
};

/** The front a role's card wears: its side's window and plaque. */
export const frontOf = (role: Role) => (sideOf(role) === "evil" ? EVIL_FRONT : GOOD_FRONT);

/** Where the portrait sits in a card's window, in the card's own units:
 *  its foot (y 44 of the 48 box) standing on the plaque's top edge
 *  (FRONT.plaque, y 60). */
export const EMBLEM_AT = { size: 50, x: 25, y: 60 - (44 * 50) / 48 };

/** A role's whole card face as one SVG (frame, window and portrait),
 *  for baked images where the name and text are left off. */
export function faceSvg(role: Role) {
  const s = EMBLEM_AT.size / 48;
  const portrait = `<g transform="translate(${EMBLEM_AT.x} ${+EMBLEM_AT.y.toFixed(2)}) scale(${+s.toFixed(4)})">${toSvgBody(ROLE_EMBLEMS[role], undefined, `r${role}`)}</g>`;
  return cardFront(frontOf(role)).replace(/<\/svg>\s*$/, `${portrait}</svg>`);
}

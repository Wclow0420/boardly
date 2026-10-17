// Double Agent's role card fronts, as the shared playing cards
// (components/tabletop/cards): a round-arched window in the agency's
// steel and teal for the agents and in crimson for the moles, each role
// its own shade, with the role's engraved portrait (emblems.ts) standing
// on the window's sill like a file photograph, and a dark brass plaque
// for the cover name. The back is AGENCY_BACK (RoleCard.tsx).

import { toSvgBody } from "@/components/engraved/emblem";
import { cardFront, type FrontStyle } from "@/components/tabletop/cards/cardArt";
import { ROLE_EMBLEMS } from "./emblems";
import type { Role } from "./logic";

/** The plaque every role shares: brass, dark enough for light text. */
const BRASS: FrontStyle["plaque"] = ["#C8963E", "#7E5818", "#3E2808"];

export const ROLE_FRONT: Record<Role, FrontStyle> = {
  // the agents: teal, steel and sea-green
  merlin: { window: ["#6ACFC2", "#22786F", "#0C3532"], plaque: BRASS, arch: "round" },
  percival: { window: ["#9CC0DE", "#3A6488", "#142A40"], plaque: BRASS, arch: "round" },
  servant: { window: ["#7AD8B8", "#257A5E", "#0C3424"], plaque: BRASS, arch: "round" },
  // the moles: crimson, wine and rose
  assassin: { window: ["#E8606C", "#94202E", "#3A0810"], plaque: BRASS, arch: "round" },
  morgana: { window: ["#E87898", "#962650", "#3A0C20"], plaque: BRASS, arch: "round" },
  mordred: { window: ["#D45664", "#7A1828", "#2C060E"], plaque: BRASS, arch: "round" },
  oberon: { window: ["#E0707A", "#8A2A40", "#320C18"], plaque: BRASS, arch: "round" },
  minion: { window: ["#DC5064", "#861828", "#32060C"], plaque: BRASS, arch: "round" },
};

/** Where the portrait sits in a card's window, in the card's own units:
 *  its foot (y 44 of the 48 box) standing on the plaque's top edge
 *  (FRONT.plaque, y 60). */
export const EMBLEM_AT = { size: 50, x: 25, y: 60 - (44 * 50) / 48 };

/** A role's whole card face as one SVG (frame, window and portrait),
 *  for baked images where the name and text are laid over or left off. */
export function faceSvg(role: Role) {
  const s = EMBLEM_AT.size / 48;
  const portrait = `<g transform="translate(${EMBLEM_AT.x} ${+EMBLEM_AT.y.toFixed(2)}) scale(${+s.toFixed(4)})">${toSvgBody(ROLE_EMBLEMS[role], undefined, `r${role}`)}</g>`;
  return cardFront(ROLE_FRONT[role]).replace(/<\/svg>\s*$/, `${portrait}</svg>`);
}

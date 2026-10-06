import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { AvalonBoard } from "./AvalonBoard";
import { currentSeat, pendingAction, type AvalonState } from "./logic";
import { AVALON_RULES } from "./rules";

export const avalon: GameDefinition<AvalonState> = {
  key: "avalon",
  name: "Double Agent",
  minPlayers: 5,
  maxPlayers: 10,
  Board: AvalonBoard,
  currentSeat,
  layout: "custom",
  rulePages: AVALON_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#12393A", "rgba(11,17,20,0)"],
    backdropImage: BACKDROP,
    logo: LOGO,
    taglineKey: "avalon.tagline",
  },
  needsMe: (state, mySeat) =>
    state.phase !== "finished" && pendingAction(state, mySeat) !== null,
};

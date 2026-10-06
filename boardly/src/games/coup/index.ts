import type { GameDefinition } from "../types";
import { BACKDROP, LOGO, SKIN_COLORS } from "./art";
import { CoupBoard } from "./CoupBoard";
import { currentSeat, taskFor, type CoupState } from "./logic";
import { COUP_RULES } from "./rules";

export const coup: GameDefinition<CoupState> = {
  key: "coup",
  name: "Hustle",
  minPlayers: 2,
  maxPlayers: 6,
  Board: CoupBoard,
  currentSeat,
  layout: "custom",
  rulePages: COUP_RULES,
  skin: {
    colors: SKIN_COLORS,
    backdrop: ["#22335A", "rgba(10,16,32,0)"],
    backdropImage: BACKDROP,
    logo: LOGO,
    taglineKey: "coup.tagline",
  },
  needsMe: (state, mySeat) =>
    state.phase !== "finished" && taskFor(state, mySeat) !== null,
};

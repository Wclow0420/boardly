import type { ComponentType } from "react";

/** Props every game board component receives from the game screen. */
export interface GameBoardProps<TState = Record<string, unknown>> {
  /** Current game state (GameSession.state from the backend). */
  state: TState;
  /** The local player's seat index (turn order). */
  mySeat: number;
  /** Whether it's the local player's turn. */
  isMyTurn: boolean;
  /** Send a game-specific move to the backend. */
  onMove: (move: Record<string, unknown>) => void;
}

/** Everything the app needs to know to host a game.
 *  Each game folder (src/games/<key>/) exports one of these. */
export interface GameDefinition<TState = Record<string, unknown>> {
  key: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  /** The board UI, rendered inside the shared game screen. */
  Board: ComponentType<GameBoardProps<TState>>;
  /** Whose turn it is, derived from state (used by the shared screen). */
  currentSeat: (state: TState) => number;
}

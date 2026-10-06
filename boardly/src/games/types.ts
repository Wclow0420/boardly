import type { ComponentType } from "react";
import type { ImageSourcePropType } from "react-native";

import type { ColorScheme } from "@/theme";

export interface GamePlayer {
  seat: number;
  userId: string;
  username: string;
  /** Profile border they wear. */
  borderId?: string | null;
}

/** Props every game board component receives from the game screen. */
export interface GameBoardProps<TState = Record<string, unknown>> {
  /** Current game state as this player sees it (GameSession.state —
   *  the backend filters hidden information per player). */
  state: TState;
  /** The local player's seat index (turn order); -1 when spectating. */
  mySeat: number;
  /** Whether it's the local player's turn. */
  isMyTurn: boolean;
  /** Everyone at the table, by seat. */
  players: GamePlayer[];
  /** A move is being sent — disable inputs. */
  busy: boolean;
  /** The session is over (won, drawn or abandoned). */
  finished: boolean;
  /** Send a game-specific move to the backend. */
  onMove: (move: Record<string, unknown>) => void;
}

/** A game's own look. The game screen switches to the dark palette
 *  with these colors on top, and draws the backdrop behind the header. */
export interface GameSkin {
  colors: Partial<ColorScheme>;
  /** Top-to-bottom glow behind the header; fades into the background. */
  backdrop: [string, string];
  /** Optional art drawn over the glow (see the game's art.ts). */
  backdropImage?: ImageSourcePropType;
  /** Optional wordmark replacing the text title. */
  logo?: ImageSourcePropType;
  /** i18n key of the line under the title. */
  taglineKey?: string;
}

/** One page of a game's "How to play" popup. */
export interface RulesPage {
  key: string;
  /** i18n key of the page's tab title. */
  titleKey: string;
  Content: ComponentType;
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
  /** Whose turn it is, derived from state (used by the shared screen);
   *  -1 when nobody in particular is up. */
  currentSeat: (state: TState) => number;
  /** "custom": the Board draws its own players, status and result —
   *  for games that aren't a simple alternating-turn board. The shared
   *  screen then only provides the header and the exit button. */
  layout?: "custom";
  /** Pages of the "How to play" popup. Without them the popup is built
   *  from the plain text under rules.<key> in the locale files. */
  rulePages?: RulesPage[];
  /** Games with their own visual identity (custom layout only). */
  skin?: GameSkin;
  /** Whether the game is waiting on this player — drives the
   *  "Your move" badge in the header of skinned games. */
  needsMe?: (state: TState, mySeat: number) => boolean;
}

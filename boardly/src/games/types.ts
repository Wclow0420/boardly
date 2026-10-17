import type { MascotLook } from "@/api/client";
import type { BadgeArt, BadgeStyle } from "@/components/badges/types";
import type { ComponentType, ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";

import type { RuleSection } from "@/features/game/rules/standard";
import type { ColorScheme } from "@/theme";

export interface GamePlayer {
  seat: number;
  userId: string;
  username: string;
  /** Profile border they wear. */
  borderId?: string | null;
  /** Profile picture path (see assetUrl). */
  avatarUrl?: string | null;
  /** Their mascot, to stand in for them where a game draws people. */
  mascot?: MascotLook | null;
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
  /** Identifies this game, for notes a board keeps on the device. */
  sessionId?: string;
  /** Send a game-specific move to the backend. `quiet`: a move that only
   *  shows the table something (no waiting on it: `busy` stays false). */
  onMove: (move: Record<string, unknown>, options?: { quiet?: boolean }) => void;
  /** For a board that fills the whole screen (layout "stage"): the
   *  screen's own controls and what follows a finished game. */
  stage?: StageChrome;
}

export interface StageChrome {
  /** Leave (asks first while the game is running). */
  onBack: () => void;
  /** Open "How to play". */
  onRules?: () => void;
  /** The last move failed. */
  error?: string | null;
  /** After the game: what was earned (coins, badges), shown under the
   *  result. */
  afterGame?: ReactNode;
  /** After the game: play again and back home, for the board's main
   *  button spot (the plinth). */
  onward?: ReactNode;
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
  /** Which of the standard sections it is (features/game/rules/standard):
   *  that names it and sets its place among the pages. */
  section?: RuleSection;
  /** i18n key of a title of its own, where the standard name doesn't fit
   *  (Shelter's places in the Rooms slot). Old pages without a section
   *  still use this. */
  titleKey?: string;
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
   *  screen then only provides the header and the exit button.
   *  "stage": the Board fills the whole screen and draws its own header
   *  too, given the screen's controls in `stage`. */
  layout?: "custom" | "stage";
  /** Pages of the "How to play" popup. Without them the popup is built
   *  from the plain text under rules.<key> in the locale files. */
  rulePages?: RulesPage[];
  /** Games with their own visual identity (custom layout only). */
  skin?: GameSkin;
  /** The picture on the game's box lid (the Games shelf, Your Tables),
   *  drawn `width` wide. Without it the lid shows the skin's logo, or
   *  the game's emoji. */
  boxArt?: ComponentType<{ width: number }>;
  /** How each of the game's badges looks, keyed like the server's
   *  badges ("<game key>.<name>"): an emblem from the game's own icons
   *  and the way it moves. Names live under badges.<key> in the locales. */
  badges?: Record<string, BadgeArt>;
  /** The frames its badges wear at each level (bronze to diamond), in
   *  the game's own style; without them, Boardly's. */
  badgeFrames?: BadgeStyle;
  /** Whether the game is waiting on this player — drives the
   *  "Your move" badge in the header of skinned games. */
  needsMe?: (state: TState, mySeat: number) => boolean;
  /** What the number at the table means for this game, for the lobby's
   *  house rules (Hustle: the coins and cards each, the deck). Each line
   *  is already in the reader's language (`t`); `short` ones are put
   *  together on the house rules board when the game has no settings. */
  tableNotes?: (
    players: number,
    t: (key: string, options?: Record<string, unknown>) => string,
    /** The host's settings for this table (each setting's current choice). */
    settings?: Record<string, string>,
  ) => TableNote[];
}

/** One line of a game's table notes. */
export interface TableNote {
  /** An emoji with an engraved emblem, shown before the line. */
  emoji: string;
  text: string;
  /** A few words for the house rules board. */
  short?: string;
}

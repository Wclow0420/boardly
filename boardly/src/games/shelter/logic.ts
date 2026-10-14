// Shelter (避难所): the client's view of the game and small helpers. The
// rules live on the server (backend/app/games/shelter/game.py); this
// only mirrors what the board needs to draw and ask.

export type Role = "survivor" | "infected";
export type Place = "farm" | "market" | "hospital";
export type Post = "store" | "door" | "sleep";
export type Card =
  | "f1"
  | "f2"
  | "f3"
  | "none"
  | "mold1"
  | "mold2"
  | "zombie"
  | "medicine"
  | "sabotage";
export type Phase = "vote" | "search" | "play" | "night" | "finished";
export type Status = "ok" | "fallen" | "exiled";

export const PLACES: Place[] = ["farm", "market", "hospital"];
export const POSTS: Post[] = ["store", "door", "sleep"];

/** Food a card brings back (sabotage is the Infected's own card). */
export const FOOD: Record<Card, number> = {
  f1: 1,
  f2: 2,
  f3: 3,
  none: 0,
  mold1: -1,
  mold2: -2,
  zombie: 0,
  medicine: 0,
  sabotage: -2,
};

/** What each place's deck holds, as {card: copies} (mirrors the server). */
export const DECKS: Record<Place, Partial<Record<Card, number>>> = {
  farm: { f1: 6, f2: 3, none: 2, mold1: 1 },
  market: { f2: 4, f3: 2, none: 2, mold2: 2, zombie: 2 },
  hospital: { f1: 5, f2: 2, none: 2, medicine: 2, zombie: 1 },
};

/** Each place's own colour: its name is written in it everywhere. */
export const PLACE_COLOR: Record<Place, string> = {
  farm: "#9BD27A",
  market: "#FFB45E",
  hospital: "#F6F3EA",
};

/** Each night post's colour. */
export const POST_COLOR: Record<Post, string> = {
  store: "#E3B26B",
  door: "#8CCBFF",
  sleep: "#B9A8FF",
};

/** Per player count: infected, survivors needed at the rescue, starving
 *  players that make a famine (mirrors the server's COUNTS). */
export const COUNTS: Record<number, [number, number, number]> = {
  4: [1, 2, 2],
  5: [1, 2, 2],
  6: [2, 2, 3],
  7: [2, 3, 3],
  8: [2, 3, 3],
};

export interface PlaceReport {
  players: number[];
  cards: Card[];
  food: number;
}

export interface SearchEntry {
  day: number;
  places: Partial<Record<Place, PlaceReport>>;
  injured: number[];
}

export interface NightEntry {
  day: number;
  before: number;
  after: number;
  stolen: number;
  opened: boolean;
  injured: number[];
  hungry: number[];
  fallen: number[];
  cough: boolean;
}

export interface ExileEntry {
  day: number;
  votes: (number | null)[];
  exiled: number | null;
  role: Role | null;
}

export type Note =
  | { day: number; kind: "turned" }
  | { day: number; kind: "played"; card: Card; place: Place }
  | { day: number; kind: "guarded"; post: Post; with: number[]; saw: number[] }
  | { day: number; kind: "caught"; post: Post; by: number[] }
  | { day: number; kind: "stole"; food: number; sneaked: boolean }
  | { day: number; kind: "opened"; sneaked: boolean };

export interface ShelterState {
  numPlayers: number;
  phase: Phase;
  day: number;
  days: number;
  places: Place[];
  store: number;
  medicine: number;
  status: Status[];
  injured: boolean[];
  weak: boolean[];
  infectedTotal: number;
  rescueNeeded: number;
  famineAt: number;
  coughs: number;
  /** Known roles: exiled players, and everyone once the game is over. */
  roles: (Role | null)[];
  /** Who still has to act this phase — never what anyone chose. */
  waiting: number[];
  searches: SearchEntry[];
  nights: NightEntry[];
  exiles: ExileEntry[];
  myRole: Role | null;
  myStatus: Status | null;
  myPlace: Place | null;
  myHand: Card[];
  myPlay: Card | null;
  myPost: { post: Post; stealth: boolean } | null;
  myVote: number | null;
  myTired: boolean;
  myStealth: number;
  canAct: boolean;
  log: Note[];
  winner: "survivors" | "infected" | null;
  winReason: string | null;
}

export function currentSeat(): number {
  // Everyone acts at once: nobody in particular is up
  return -1;
}

export const standing = (state: ShelterState) =>
  state.status.map((s, seat) => (s === "ok" ? seat : -1)).filter((s) => s >= 0);

/** Food the shelter eats tonight: one for each player still standing. */
export const need = (state: ShelterState) => standing(state).length;

// What a badge is drawn from. The server says which badges exist, their
// tier and progress; the app says how each one looks (its BadgeArt) and
// what it is called (badges.<key> in the locales).

/** Rarity, rarest last (mirrors TIERS on the server). */
export type BadgeTier = "bronze" | "silver" | "gold" | "legendary";

/** A line icon on a 24-unit grid: outlines, and parts filled in. */
export interface Glyph {
  line?: string;
  fill?: string;
}

/** How the emblem keeps moving:
 *  flicker — a flame (stretches at its foot)
 *  sway    — a candle, a pendulum (rocks from its foot)
 *  spin    — a seal, a coin (turns slowly)
 *  bob     — a ghost, a boat (floats up and down)
 *  pulse   — a heart, an eye (swells and settles)
 *  tumble  — a die (tips a quarter turn now and then) */
export type BadgeLoop =
  "flicker" | "sway" | "spin" | "bob" | "pulse" | "tumble";

export interface BadgeArt {
  glyph: Glyph;
  loop: BadgeLoop;
  /** The enamel behind the emblem; defaults to the game's colour. */
  face?: string;
}

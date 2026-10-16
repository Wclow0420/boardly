// What a badge is drawn from. The server says which badges exist, their
// tier and progress; the app says how each one looks (its BadgeArt) and
// what it is called (badges.<key> in the locales).

import type { EmblemData } from "@/components/engraved/emblem";

/** A badge's levels, rarest last (mirrors TIERS on the server). */
export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";
export const TIERS: readonly BadgeTier[] = ["bronze", "silver", "gold", "diamond"];

/** A badge's frame at one level, in a 120 × 120 box with the emblem's
 *  disc at the centre (60, 60). Parts in "tint" take the game's colour
 *  (the disc's enamel). */
export interface BadgeFrame {
  /** Drawn under the emblem: rays, wreaths, the rim, the disc. */
  back: EmblemData;
  /** Drawn over the emblem (a band, claws over the disc's edge). */
  front?: EmblemData;
  /** The emblem's disc: its radius round (60, 60). */
  face: number;
  /** The metal the light sweeps across: one path (holes cut even-odd). */
  sweep: string;
  /** Where glints flare: [x, y, size]. */
  glints: [number, number, number][];
}

/** A set of frames (Boardly's own, or a game's), one per level. */
export type BadgeStyle = (tier: BadgeTier) => BadgeFrame;

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
  /** The line icon: the fallback when there is no emblem. */
  glyph: Glyph;
  /** The engraved emblem in the middle, by its emoji (any emoji
   *  <Emblem> draws, except the few drawn as components). */
  emoji?: string;
  loop: BadgeLoop;
  /** The enamel behind the emblem; defaults to the game's colour. */
  face?: string;
}

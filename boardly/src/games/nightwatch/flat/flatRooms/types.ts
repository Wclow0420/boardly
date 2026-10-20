// What a room drawn flat on hands FlatRoom: where its pieces stand (its
// plan), its still art (baked once into one image), its working object
// (the `prop`: a still image, how it moves when used, what using it
// feels like) and, if it has any, what else lives in it each frame (the
// study's moonlight and the lightning in its window, the bell tower's
// rope). FlatRoom does the rest the same for every room: the candle
// flames and their glow, the seal of the mission, the secret doors, the
// people, the plates and names, the ways out, the night's weather.
//
// A room is one file in flatRooms/ exporting a FlatRoomDef; index.ts
// maps the manor's rooms to theirs (a room not there is drawn in iso).

import type { SkCanvas, SkImage, SkPaint } from "@shopify/react-native-skia";

import type { BurstSpec } from "@/components/iso";
import type { Door } from "@/components/iso/kit";
import type { Payoff, Side } from "../../roomScenes";
import type { FlatLayout } from "../layout";

/** A way out as the room draws it: its side, tonight's door, and the
 *  next room's colour (its light at the end of the passage). */
export interface FlatExit {
  side: Side;
  door: Door;
  color: string;
}

/** A candle flame: where its wick is, how big (1 = a desk candle). */
export interface FlatFlame {
  x: number;
  y: number;
  s: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What every room's plan has; a room adds what its art needs. */
export interface FlatPlan {
  /** The working object's still image, where it is drawn. */
  prop: Box;
  /** Where it glows while it waits and can be touched (its middle and
   *  half-sizes); the middle of `prop` when left out. */
  touch?: { x: number; y: number; rx: number; ry: number };
  /** The live candle flames. */
  flames: FlatFlame[];
  /** Flames on the working object itself: they move with it. */
  propFlames?: FlatFlame[];
  /** A book that can be opened and read (the chapel's record). */
  book?: { x: number; y: number; r: number };
}

/** How the working object moves when touched (and stirs while it waits).
 *  `pop`: it rises from its foot and grows; `swing`: it turns about a
 *  point on the screen, `ring` swinging back and forth as it dies away. */
export type FlatMotion =
  | { kind: "pop"; lift: number; scale: number }
  | { kind: "swing"; x: number; y: number; degrees: number; ring?: boolean };

/** A still image for the live drawing, w × h, baked once. `key` says
 *  what it depends on besides its size (default: the room's layout and
 *  doors). */
export interface FlatImage {
  w: number;
  h: number;
  art: () => string;
  key?: string;
}

/** What a room's live drawing is handed each frame (on the UI thread:
 *  every function a room writes for it must be a worklet). */
export interface FlatFrame {
  c: SkCanvas;
  /** Seconds, the scene's clock. */
  time: number;
  /** Draws an image into a box (with a paint, for its alpha or blend). */
  draw: (img: SkImage | null, x: number, y: number, w: number, h: number, paint?: SkPaint) => void;
  /** The room's own images (FlatRoomDef.images), by name. */
  img: Record<string, SkImage | null>;
  /** Paints of this mounted copy, set per frame: four that add light
   *  (screen), a fill and a stroke (antialiased). */
  screen: SkPaint[];
  fill: SkPaint;
  stroke: SkPaint;
  /** Lightning, 0–1 (only in a storm). */
  flash: number;
  /** The working object's motion now: 0 at rest, ±1 at its fullest. */
  move: number;
  /** 0 → 1 over a little more than a second after a touch (1 at rest). */
  touched: number;
  /** The room can be used now. */
  active: boolean;
}

export interface FlatRoomDef<P extends FlatPlan = FlatPlan> {
  /** Names its images in the cache. */
  id: string;
  /** The colour of its candlelight. */
  light: string;
  /** Where its pieces stand, for a layout and tonight's ways out. */
  plan: (L: FlatLayout, exits: FlatExit[]) => P;
  /** The whole room, still, as SVG markup w × h: everything but what
   *  lives. */
  art: (L: FlatLayout, plan: P, exits: FlatExit[]) => string;
  /** The working object's still image (plan.prop's size). */
  propArt: (plan: P) => string;
  motion: (plan: P) => FlatMotion;
  /** What using it looks like (a burst at the touch spot, or at `at`)
   *  and feels like in the hand. */
  payoff: { burst: Omit<BurstSpec, "x" | "y">; haptic: Payoff["haptic"]; at?: (plan: P) => [number, number] };
  /** More still images its live drawing uses, by name. */
  images?: (L: FlatLayout, plan: P) => Record<string, FlatImage>;
  /** Drawn each frame over the still art, under the flames and the
   *  object (a worklet). */
  under?: (f: FlatFrame, plan: P) => void;
  /** Drawn each frame with the object, in its motion (a worklet). */
  onProp?: (f: FlatFrame, plan: P) => void;
}

/** Keeps a room's own plan type through the map in index.ts. */
export const flatRoom = <P extends FlatPlan>(def: FlatRoomDef<P>) => def as unknown as FlatRoomDef;

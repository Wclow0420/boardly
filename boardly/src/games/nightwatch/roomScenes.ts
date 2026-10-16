// Each room on its own, filling the page: the place the player stands
// in. It is built like a small stage set with the drawing kit of
// manorShapes.ts — a stone plinth, two thick back walls with the real
// doors to the neighbouring rooms, steps down from the two open sides,
// and the room's furniture, every piece standing on another.
//
// One thing in each room works it (the bell, the ledger, the hatch...).
// Its shapes are marked `prop` so RoomScene can move them by themselves;
// what is listed before it is drawn behind it and what comes after in
// front. The glow of every flame is marked `glow` so it can flicker.
//
// The front of the floor (x + y > 1.3) is kept clear in every room:
// that is where the watchers stand.

import {
  ROOMS,
  type RoomId,
} from "./logic";
import {
  P,
  live,
  n,
  unit,
  type Door,
  type Effect,
  type Pt,
  type Shape,
  type V3,
} from "@/components/iso/kit";
import {
  BASE,
  barriers,
  pawn,
  pawnTop as roomPawnTop,
  SPOTS as ROOM_SPOTS,
  roomOutline,
  setExits,
  type Side,
} from "@/components/iso/room";
import {
  belltower,
} from "./rooms/belltower";
import {
  study,
} from "./rooms/study";
import {
  chapel,
} from "./rooms/chapel";
import {
  gallery,
} from "./rooms/gallery";
import {
  hall,
} from "./rooms/hall";
import {
  dining,
} from "./rooms/dining";
import {
  cellar,
} from "./rooms/cellar";
import {
  kitchen,
} from "./rooms/kitchen";
import {
  garden,
} from "./rooms/garden";
import type {
  BurstSpec,
} from "@/components/iso/bursts";

import {
  doorBetween,
  inScene,
  paintAs,
} from "./manorShapes";

export type { Side } from "@/components/iso/room";

/** A way out of the room, and where its name goes in the drawing. */
export interface SceneExit {
  side: Side;
  room: number;
  door: Door;
  x: number;
  y: number;
}

/** How the room's object moves when it is touched. Lengths are in
 *  drawing units. */
export type Motion =
  | { kind: "swing"; pivot: Pt; degrees: number }
  | { kind: "pop"; pivot: Pt; scale: number; lift: number }
  | { kind: "slide"; dx: number; dy: number };

export interface Scene {
  back: Shape[];
  prop: Shape[];
  front: Shape[];
  /** Flames, steam and fireflies, when built live (see SceneOptions). */
  effects: Effect[];
  exits: SceneExit[];
  /** The glowing spot over the room's object. */
  touch: { x: number; y: number; r: number };
  motion: Motion;
  payoff: Payoff;
  /** A book in the room that can be opened and read, if it has one. */
  book: { x: number; y: number; r: number } | null;
}

export interface SceneOptions {
  accent: string;
  collapsed: number[];
  lockedDoor: number[] | null;
  /** Build for an animated canvas: flames, steam and fireflies come
   *  back as effects instead of drawn shapes. */
  live?: boolean;
}

const BUILDERS: Record<RoomId, (accent: string) => Shape[]> = {
  belltower,
  study,
  chapel,
  gallery,
  hall,
  dining,
  cellar,
  kitchen,
  garden,
};

/** What using a room looks and feels like: a burst on the canvas, and
 *  a haptic pattern to go with it. */
export interface Payoff {
  burst: BurstSpec;
  haptic: "ring" | "bless" | "thud" | "tick" | "clink" | "ripple";
}

/** The thing in each room the player touches to use the room, how it
 *  moves, and what using it does. */
const OBJECT: Record<
  RoomId,
  { at: V3; radius: number; motion: () => Motion; payoff: () => Payoff }
> = {
  belltower: {
    at: [0.5, 0.34, 0.36],
    radius: 17,
    motion: () => ({ kind: "swing", pivot: P(0.5, 0.34, 0.66), degrees: 16 }),
    payoff: () => {
      const [x, y] = P(0.5, 0.34, 0.4);
      return {
        burst: { kind: "rings", x, y, size: 24, color: "#F0C87A", duration: 1400 },
        haptic: "ring",
      };
    },
  },
  study: {
    at: [0.76, 0.3, 0.24],
    radius: 13,
    motion: () => ({ kind: "pop", pivot: P(0.76, 0.3, 0.224), scale: 1.25, lift: 7 }),
    payoff: () => {
      const [x, y] = P(0.76, 0.3, 0.26);
      return {
        burst: { kind: "glow", x, y, size: 16, color: "#FFE3A8", duration: 900 },
        haptic: "tick",
      };
    },
  },
  chapel: {
    at: [0.5, 0.13, 0.46],
    radius: 17,
    motion: () => ({ kind: "pop", pivot: P(0.5, 0.125, 0.28), scale: 1.12, lift: 3 }),
    payoff: () => {
      const [x, y] = P(0.5, 0.13, 0.3);
      return {
        burst: { kind: "beam", x, y, size: 26, color: "#FFD98A", duration: 1800 },
        haptic: "bless",
      };
    },
  },
  gallery: {
    at: [0.76, 0.22, 0.28],
    radius: 15,
    motion: () => ({ kind: "swing", pivot: P(0.69, 0.2, 0.25), degrees: 20 }),
    payoff: () => {
      const [x, y] = P(0.68, 0.18, 0.4);
      return {
        burst: { kind: "sparks", x, y, size: 14, color: "#B58CFF", duration: 900 },
        haptic: "tick",
      };
    },
  },
  hall: {
    at: [0.28, 0.28, 0.36],
    radius: 13,
    motion: () => ({ kind: "swing", pivot: P(0.28, 0.28, 0), degrees: 5 }),
    payoff: () => {
      const [x, y] = P(0.28, 0.28, 0.44);
      return {
        burst: { kind: "glow", x, y, size: 20, color: "#FFB45E", duration: 900 },
        haptic: "tick",
      };
    },
  },
  dining: {
    at: [0.5, 0.41, 0.3],
    radius: 16,
    motion: () => ({ kind: "pop", pivot: P(0.505, 0.41, 0.24), scale: 1.2, lift: 6 }),
    payoff: () => {
      const [x, y] = P(0.505, 0.41, 0.31);
      return {
        burst: { kind: "sparks", x, y, size: 12, color: "#F0C87A", duration: 800 },
        haptic: "clink",
      };
    },
  },
  cellar: {
    at: [0.56, 0.56, 0.02],
    radius: 16,
    motion: () => {
      const [x0, y0] = P(0, 0);
      const [x1, y1] = P(-0.15, 0);
      return { kind: "slide", dx: x1 - x0, dy: y1 - y0 };
    },
    payoff: () => {
      const [x, y] = P(0.56, 0.56, 0.02);
      return {
        burst: { kind: "puff", x, y, size: 18, color: "#05060B", duration: 1400, dark: true },
        haptic: "thud",
      };
    },
  },
  kitchen: {
    at: [0.8, 0.34, 0.16],
    radius: 15,
    motion: () => ({ kind: "swing", pivot: P(0.8, 0.34, 0.08), degrees: 6 }),
    payoff: () => {
      const [x, y] = P(0.8, 0.34, 0.2);
      return {
        burst: { kind: "puff", x, y, size: 14, color: "#EDE8DC", duration: 1200 },
        haptic: "tick",
      };
    },
  },
  garden: {
    at: [0.76, 0.3, 0.22],
    radius: 16,
    motion: () => ({ kind: "slide", dx: 0, dy: -0.07 * unit() }),
    payoff: () => {
      const [x, y] = P(0.76, 0.3, 0.12);
      return {
        burst: { kind: "ripples", x, y, size: 13, color: "#9CB8FF", duration: 1300 },
        haptic: "ripple",
      };
    },
  },
};

/** Where a room keeps a book to read: the Chapel's record on its lectern. */
const BOOK: Partial<Record<RoomId, V3>> = { chapel: [0.135, 0.36, 0.27] };

const COLS = 3;

/** The rooms next door, by the side of the drawing they lie on. */
function neighbours(room: number): Record<Side, number | null> {
  const col = room % COLS;
  const row = Math.floor(room / COLS);
  return {
    left: col > 0 ? room - 1 : null,
    right: row > 0 ? room - COLS : null,
    frontRight: col < COLS - 1 ? room + 1 : null,
    frontLeft: row < COLS - 1 ? room + COLS : null,
  };
}

const SIDES: Side[] = ["left", "right", "frontRight", "frontLeft"];

/** Where each door's name is written: over a back door, under a step. */
const ANCHOR: Record<Side, () => Pt> = {
  left: () => P(0, 0.5, 0.6),
  right: () => P(0.5, 0, 0.6),
  frontRight: () => {
    const [x, y] = P(1.08, 0.5, -BASE);
    return [x, y + 9];
  },
  frontLeft: () => {
    const [x, y] = P(0.5, 1.08, -BASE);
    return [x, y + 9];
  },
};

/** One room in full detail, in the layers RoomScene draws. */
export function buildScene(room: number, options: SceneOptions): Scene {
  if (!options.live) return assemble(room, options);
  const { drawing, effects } = live(() => assemble(room, options));
  return { ...drawing, effects };
}

/** The outline of the room in the scene's drawing. */
export const sceneOutline = () => inScene(roomOutline);

/** Where a point of the room lands in the scene's drawing. */
export function scenePoint(x: number, y: number, z = 0): Pt {
  return inScene(() => P(x, y, z));
}

function assemble(room: number, { accent, collapsed, lockedDoor }: SceneOptions): Scene {
  const next = neighbours(room);
  return inScene(() => {
    const out: SceneExit[] = [];
    const doors = {} as Record<Side, Door | null>;
    for (const side of SIDES) {
      const other = next[side];
      doors[side] = other === null ? null : doorBetween(room, other, collapsed, lockedDoor);
      if (other !== null) {
        const [x, y] = ANCHOR[side]();
        out.push({ side, room: other, door: doors[side] ?? "open", x, y });
      }
    }
    setExits(doors);

    const id = ROOMS[room];
    paintAs(id);
    const all = [...BUILDERS[id](accent), ...barriers()];
    const first = all.findIndex((shape) => shape.layer === "prop");
    const count = all.filter((shape) => shape.layer === "prop").length;

    const object = OBJECT[id];
    const [x, y] = P(...object.at);
    const book = BOOK[id];
    const [bookX, bookY] = book ? P(...book) : [0, 0];
    return {
      back: all.slice(0, first),
      prop: all.slice(first, first + count),
      front: all.slice(first + count),
      effects: [],
      exits: out,
      touch: { x, y, r: object.radius },
      motion: object.motion(),
      payoff: object.payoff(),
      book: book ? { x: bookX, y: bookY, r: 9 } : null,
    };
  });
}

/** Where watchers stand, the player's own spot first (see room.ts). */
export const SPOTS = ROOM_SPOTS;

/** A watcher standing on a spot in the room's drawing. */
export function pawnShapes(spot: [number, number], fill: string, edge: string): Shape[] {
  return inScene(() => pawn(spot, fill, edge));
}

/** The top of a pawn's head, for its name. */
export function pawnTop(spot: [number, number]): Pt {
  return inScene(() => roomPawnTop(spot));
}

/** Where the player comes into the room for a move made `how` from room
 *  `from`: the door or step facing it, the corner of a secret door, or
 *  the dark at the back. In the scene's drawing; `fade` when they come
 *  out of nowhere a door explains. */
export function entryPoint(
  room: number,
  from: number,
  how: "step" | "secret" | "far" | "stay" | "collapse"
): { at: Pt; fade: boolean } {
  const dc = (from % COLS) - (room % COLS);
  const dr = Math.floor(from / COLS) - Math.floor(room / COLS);
  const straight = (dc === 0) !== (dr === 0);
  const [x, y]: [number, number] =
    how === "stay"
      ? [SPOTS[0][0] - 0.07, SPOTS[0][1] - 0.07]
      : how === "secret"
        ? [dc > 0 ? 0.9 : 0.1, dr > 0 ? 0.9 : 0.1]
        : (how === "step" || how === "collapse") && straight
          ? dc < 0
            ? [0.06, 0.5]
            : dc > 0
              ? [1.02, 0.5]
              : dr < 0
                ? [0.5, 0.06]
                : [0.5, 1.02]
          : [0.32, 0.32];
  const fade = how === "far" || ((how === "step" || how === "collapse") && !straight);
  return { at: scenePoint(x, y, 0), fade };
}

/** Footprints from one point of the scene to another, left and right. */
export function walkPrints(from: Pt, to: Pt, color: string): Shape[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 8) return [];
  const [nx, ny] = [-(y2 - y1) / length, (x2 - x1) / length];
  const steps = Math.floor(length / 9);
  return Array.from({ length: Math.max(0, steps - 1) }, (_, index) => {
    const i = index + 1;
    const side = i % 2 ? 2.2 : -2.2;
    const x = x1 + ((x2 - x1) * i) / steps + nx * side;
    const y = y1 + ((y2 - y1) * i) / steps + ny * side;
    return {
      d: `M${n(x - 2)} ${n(y)}a2 1.2 0 1 0 4 0a2 1.2 0 1 0 -4 0Z`,
      fill: color,
      opacity: 0.35 + (0.45 * i) / steps,
    };
  });
}

// The isometric drawing kit: a camera, solid parts built from it, and
// the inks they are painted in. A builder places parts in world units —
// x to the right-front, y to the left-front, z up — and gets back plain
// shapes (SVG path data with a fill and an edge) in painter's order,
// back to front. Shapes draw the same through react-native-svg or the
// Skia canvas (IsoCanvas), on phones and on the web.
//
// The kit keeps the camera, the cell being drawn and its ink as state,
// so a builder reads like a list of parts: set them with setView,
// setOrigin and setInk (or withView) before building.

/** A fill that runs from one colour to the next along a line (`from`
 *  to `to`, in the drawing), or out from a point (`radius`). */
export interface Grad {
  colors: string[];
  from: Pt;
  to?: Pt;
  radius?: number;
}

export interface Shape {
  d: string;
  /** The flat colour (and what plain renderers draw). */
  fill?: string;
  /** Engraved: the fill as a gradient, lit from the upper left. */
  grad?: Grad;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;
  /** Drawn in a layer of its own, so it can move: the part that works a room. */
  layer?: "prop";
}

/** The camera: drawing units per world unit, and where the world's
 *  origin lands in the drawing. */
export interface View {
  scale: number;
  cx: number;
  cy: number;
}

let view: View = { scale: 40, cx: 0, cy: 0 };
/** The cell being drawn: builders work in its own unit square. */
let origin = { col: 0, row: 0 };

export function setView(next: View) {
  view = next;
}
export function setOrigin(col: number, row: number) {
  origin = { col, row };
}
/** Drawing units per world unit in the view being drawn. */
export const unit = () => view.scale;

/** Draws with another camera and origin, then puts the old ones back. */
export function withView<T>(next: View, draw: () => T, col = 0, row = 0): T {
  const [oldView, oldOrigin] = [view, origin];
  view = next;
  origin = { col, row };
  try {
    return draw();
  } finally {
    view = oldView;
    origin = oldOrigin;
  }
}

export const WALL = 0.8;
export const DOOR: [number, number] = [0.36, 0.64];
/** Sizes given in drawing units were tuned at 40 units per room. */
export const k = () => view.scale / 40;

export type Pt = [number, number];
export type V3 = [number, number, number];

/** Top, +y face (lit), +x face (shaded). */
export type Tones = [string, string, string];

export type Door = "open" | "locked" | "shut";


export const INK = {
  line: "#465280",
  floor: "#2B3350",
  floorLine: "#384266",
  wallLit: "#252C46",
  wallShade: "#1C2238",
  night: "#0D1020",
  glass: "#9CB8FF",
  paper: "#E9E2CF",
  gold: "#D9A95B",
  red: "#8E3B3F",
  redDark: "#6E2C31",
  iron: "#1A1E30",
  grass: "#22382F",
  grassLine: "#2D4A3D",
};
/** A room's own colours: floor, the lines drawn on it, its two walls,
 *  and the lighter tile of a patterned floor. */
export interface RoomInk {
  floor: string;
  line: string;
  lit: string;
  shade: string;
  tile: string;
}

/** The plain night palette, for a room without colours of its own. */
export const PLAIN_INK: RoomInk = {
  floor: INK.floor,
  line: INK.floorLine,
  lit: INK.wallLit,
  shade: INK.wallShade,
  tile: "#343D5E",
};

/** The colours of the room being drawn. */
let ink: RoomInk = PLAIN_INK;
export const paint = () => ink;
export function setInk(next: RoomInk) {
  ink = next;
}

/** A carpet that shows on any floor. */
export const CARPET = { fill: "#262B45", edge: "#A87C3A" };

export const STONE: Tones = ["#56628C", "#3D476B", "#2C3454"];
export const WOOD: Tones = ["#9A7250", "#74533A", "#53392A"];
export const LEAF: Tones = ["#4C8F6C", "#3A7256", "#2B5742"];
export const GOLD: Tones = ["#F0C87A", "#D9A95B", "#A87C3A"];
export const BOOKS = ["#8E3B3F", "#3A7256", "#D9A95B", "#5A6FA8", "#B4683C"];

export const n = (v: number) => Math.round(v * 100) / 100;

// ── engraving ───────────────────────────────────────────────────────
// Every part is drawn the house way: each face filled with a gradient
// of its own colour (lit from the upper left), a dark ink outline of that
// colour, a line of light along the lit edge, and grain on wood.

/** `hex` mixed toward white (amount > 0) or black (amount < 0); colours
 *  that aren't #rrggbb come back as they are. */
export function tone(hex: string, amount: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const to = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  return `#${[1, 3, 5]
    .map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16);
      return Math.round(c + (to - c) * a)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

/** The ink a colour is outlined in: itself, much darker. */
export const inkOf = (fill: string) => tone(fill, -0.62);

/** Tones whose faces show a grain (wood, planks). */
export const GRAINED = new WeakSet<Tones>([WOOD]);

export const P = (x: number, y: number, z = 0): Pt => [
  view.cx + (x + origin.col - y - origin.row) * 0.866 * view.scale,
  view.cy + (x + origin.col + y + origin.row) * 0.5 * view.scale - z * view.scale,
];

export const path = (pts: Pt[], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join(" ") +
  (close ? " Z" : "");

export const poly = (pts: V3[], fill: string, stroke?: string): Shape => ({
  d: path(pts.map(([x, y, z]) => P(x, y, z))),
  fill,
  stroke: stroke ?? inkOf(fill),
  strokeWidth: 0.55,
});

/** A face with its gradient: lightest at `from`, darkest at `to`. */
function face(pts: V3[], fill: string, from: V3, to: V3, light: number, dark: number): Shape {
  return {
    ...poly(pts, fill),
    grad: { colors: [tone(fill, light), fill, tone(fill, -dark)], from: P(...from), to: P(...to) },
  };
}

export const line = (pts: V3[], stroke: string = INK.line, strokeWidth = 0.5): Shape => ({
  d: path(pts.map(([x, y, z]) => P(x, y, z)), false),
  stroke,
  strokeWidth,
});

/** A solid block: its three faces the viewer can see. */
export function box(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  tones: Tones
): Shape[] {
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  const [top, lit, shade] = tones;
  const shapes: Shape[] = [
    face([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], shade, [X, y, Z], [X, Y, z], 0.06, 0.28),
    face([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], lit, [x, Y, Z], [X, Y, z], 0.14, 0.22),
    face([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], top, [x, y, Z], [X, Y, Z], 0.2, 0.1),
  ];
  const s = view.scale;
  // the grain along a wooden face's long side
  if (GRAINED.has(tones)) {
    const vein = tone(lit, -0.4);
    if (w * s > 8 && h * s > 5) {
      const along = w >= h;
      for (const f of [0.3, 0.62]) {
        shapes.push({
          ...line(
            along
              ? [[x + w * 0.04, Y, z + h * f], [X - w * 0.04, Y, z + h * (f + 0.04)]]
              : [[x + w * f, Y, z + h * 0.05], [x + w * (f + 0.06), Y, Z - h * 0.05]],
            vein,
            0.4,
          ),
          opacity: 0.55,
        });
      }
    }
    if (w * s > 8 && d * s > 8) {
      const along = w >= d;
      for (const f of [0.35, 0.68]) {
        shapes.push({
          ...line(
            along
              ? [[x + w * 0.05, y + d * f, Z], [X - w * 0.05, y + d * (f + 0.05), Z]]
              : [[x + w * f, y + d * 0.05, Z], [x + w * (f + 0.05), Y - d * 0.05, Z]],
            tone(top, -0.32),
            0.4,
          ),
          opacity: 0.5,
        });
      }
    }
  }
  // a line of light along the lit top edge
  if (w * s > 5) {
    shapes.push({ ...line([[x + w * 0.04, Y, Z], [X - w * 0.12, Y, Z]], "#FFFFFF", 0.55), opacity: 0.4 });
  }
  return shapes;
}

/** A flat patch on the floor or on top of something. */
export const flat = (x1: number, x2: number, y1: number, y2: number, z: number, fill: string, stroke?: string) =>
  poly([[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]], fill, stroke);

/** A patch on a plane of constant y (the right-hand wall is y = 0). */
export const onY = (y: number, x1: number, x2: number, z1: number, z2: number, fill: string, stroke?: string) =>
  poly([[x1, y, z1], [x2, y, z1], [x2, y, z2], [x1, y, z2]], fill, stroke);

/** A patch on a plane of constant x (the left-hand wall is x = 0). */
export const onX = (x: number, y1: number, y2: number, z1: number, z2: number, fill: string, stroke?: string) =>
  poly([[x, y1, z1], [x, y2, z1], [x, y2, z2], [x, y1, z2]], fill, stroke);

/** An arched opening on a wall: `axis` is the wall's constant coordinate. */
export function arch(
  axis: "x" | "y",
  from: number,
  to: number,
  z0: number,
  spring: number,
  fill: string,
  pointed = false
): Shape {
  const mid = (from + to) / 2;
  const r = (to - from) / 2;
  const at = (a: number, z: number): V3 => (axis === "x" ? [0, a, z] : [a, 0, z]);
  const pts: V3[] = [at(from, z0), at(to, z0)];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI;
    const rise = pointed ? Math.sin(t) * r * 1.5 : Math.sin(t) * r;
    pts.push(at(mid + Math.cos(t) * r, spring + rise));
  }
  return poly(pts, fill);
}

/** An upright cylinder (barrel, pot, well, trunk). */
export function cylinder(x: number, y: number, z: number, r: number, h: number, [top, lit]: Tones): Shape[] {
  const rx = r * view.scale * 1.2247;
  const ry = r * view.scale * 0.7071;
  const [bx, by] = P(x, y, z);
  const [, ty] = P(x, y, z + h);
  return [
    {
      d: `M${n(bx - rx)} ${n(ty)} L${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} L${n(bx + rx)} ${n(ty)} Z`,
      fill: lit,
      // round: light on the left, falling away to the right
      grad: { colors: [tone(lit, 0.22), lit, tone(lit, -0.32)], from: [bx - rx * 0.7, ty], to: [bx + rx, ty] },
      stroke: inkOf(lit),
      strokeWidth: 0.55,
    },
    {
      d: `M${n(bx - rx)} ${n(ty)} A${n(rx)} ${n(ry)} 0 1 0 ${n(bx + rx)} ${n(ty)} A${n(rx)} ${n(ry)} 0 1 0 ${n(bx - rx)} ${n(ty)} Z`,
      fill: top,
      grad: { colors: [tone(top, 0.2), top, tone(top, -0.12)], from: [bx - rx, ty - ry], to: [bx + rx, ty + ry] },
      stroke: inkOf(top),
      strokeWidth: 0.55,
    },
    ...(rx > 3
      ? [
          {
            d: `M${n(bx - rx * 0.55)} ${n(ty + ry * 0.9)} L${n(bx - rx * 0.55)} ${n(by + ry * 0.75)}`,
            stroke: "#FFFFFF",
            strokeWidth: 0.6,
            opacity: 0.35,
          },
        ]
      : []),
  ];
}

/** A hoop round a cylinder at height z (the near half). */
export function hoop(x: number, y: number, z: number, r: number, stroke: string): Shape {
  const rx = r * view.scale * 1.2247;
  const ry = r * view.scale * 0.7071;
  const [bx, by] = P(x, y, z);
  return {
    d: `M${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)}`,
    stroke,
    strokeWidth: 0.8,
  };
}

/** A round blob facing the viewer, centred on a world point. */
export function ball(at: V3, radius: number, fill: string, stroke?: string, opacity?: number): Shape {
  const [cx, cy] = P(...at);
  const r = n(radius * k());
  return {
    d: `M${n(cx - r)} ${n(cy)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
    fill,
    // a solid ball is lit from the upper left; a glow stays soft
    grad:
      opacity === undefined && r > 1.4
        ? { colors: [tone(fill, 0.35), fill, tone(fill, -0.35)], from: [cx - r * 0.35, cy - r * 0.4], radius: r * 1.5 }
        : undefined,
    stroke,
    strokeWidth: stroke ? 0.5 : undefined,
    opacity,
  };
}

/** Something a canvas brings to life in place of drawn shapes: a
 *  flame, steam, a firefly, a pool of light. Points and sizes are in
 *  the drawing. `layer` is where it sits among a scene's layers: 0
 *  behind the moving part, 1 in it (moving with it), 2 in front. */
export type Effect = { layer: 0 | 1 | 2 } & (
  | { kind: "flame"; x: number; y: number; size: number }
  | { kind: "steam"; x: number; y: number; width: number; height: number }
  | { kind: "firefly"; x: number; y: number }
  | { kind: "pool"; x: number; y: number; radius: number }
  | { kind: "shaft"; d: string; from: Pt; to: Pt; color: string }
);
type Asked = Effect extends infer E ? (E extends Effect ? Omit<E, "layer"> : never) : never;

/** While a live drawing is made, the effects it asks for (see live). */
let effects: Effect[] | null = null;
let layer: Effect["layer"] = 0;
const ask = (effect: Asked) => effects?.push({ ...effect, layer } as Effect);

/** Marks what follows as behind (0), in (1) or in front of (2) a
 *  scene's moving part (see room.ts, prop). */
export function setLayer(next: Effect["layer"]) {
  layer = next;
}

/** Draws for a canvas that animates (IsoCanvas): flames, steam and
 *  fireflies come back as effects instead of being drawn as shapes. */
export function live<T>(draw: () => T): { drawing: T; effects: Effect[] } {
  const outer = effects;
  const asked: Effect[] = [];
  effects = asked;
  layer = 0;
  try {
    return { drawing: draw(), effects: asked };
  } finally {
    effects = outer;
  }
}

/** A lit flame with its glow, standing on a world point. */
export function flame(at: V3, units: number, accent: string): Shape[] {
  const [cx, by] = P(...at);
  const size = units * k();
  if (effects) {
    ask({ kind: "flame", x: cx, y: by, size });
    return [];
  }
  const cy = by - size;
  return [
    ball([at[0], at[1], at[2] + size / view.scale], units * 2.6, accent, undefined, 0.22),
    {
      d: `M${n(cx)} ${n(cy - size)} Q${n(cx + size * 0.8)} ${n(cy + size * 0.1)} ${n(cx)} ${n(by)} Q${n(cx - size * 0.8)} ${n(cy + size * 0.1)} ${n(cx)} ${n(cy - size)} Z`,
      fill: accent,
    },
    {
      d: `M${n(cx)} ${n(cy - size * 0.3)} Q${n(cx + size * 0.35)} ${n(cy + size * 0.4)} ${n(cx)} ${n(by)} Q${n(cx - size * 0.35)} ${n(cy + size * 0.4)} ${n(cx)} ${n(cy - size * 0.3)} Z`,
      fill: "#FFE3A8",
    },
  ];
}

/** Steam rising from a world point, `width` × `height` world units. */
export function steam(at: V3, width: number, height: number): Shape[] {
  const [x, y] = P(...at);
  if (effects) {
    ask({ kind: "steam", x, y, width: width * view.scale, height: height * view.scale });
    return [];
  }
  return [
    ball([at[0], at[1], at[2] + height * 0.15], 1.6, INK.paper, undefined, 0.22),
    ball([at[0] + 0.015, at[1], at[2] + height * 0.35], 2.1, INK.paper, undefined, 0.16),
    ball([at[0] - 0.01, at[1], at[2] + height * 0.55], 2.6, INK.paper, undefined, 0.1),
  ];
}

/** Firelight on the floor around a world point; nothing when drawn
 *  as shapes. `radius` is in world units. */
export function lightPool(at: V3, radius: number): Shape[] {
  const [x, y] = P(...at);
  ask({ kind: "pool", x, y, radius: radius * view.scale });
  return [];
}

/** A shaft of light from an opening in a wall (`opening`, its top edge
 *  first) to the patch of floor it lights (`pool`, the far edge first).
 *  Nothing when drawn as shapes: the patch itself is drawn by the
 *  builder. */
export function moonShaft(opening: [V3, V3], pool: [V3, V3], color: string): Shape[] {
  if (!effects) return [];
  const [a, b] = opening.map(([x, y, z]) => P(x, y, z));
  const [c, d] = pool.map(([x, y, z]) => P(x, y, z));
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ask({ kind: "shaft", d: path([a, b, c, d]), from: mid(a, b), to: mid(c, d), color });
  return [];
}

/** A firefly hanging in the air. */
export function firefly(at: V3): Shape[] {
  const [x, y] = P(...at);
  if (effects) {
    ask({ kind: "firefly", x, y });
    return [];
  }
  return [ball(at, 1.6, "#FFE3A8", undefined, 0.2), ball(at, 0.5, "#FFE3A8")];
}

/** A candle: a short wax stick with a flame. */
export const candle = (x: number, y: number, z: number, h: number, accent: string): Shape[] => [
  ...box(x - 0.012, y - 0.012, z, 0.024, 0.024, h, [INK.paper, "#CFC7B0", "#B3AB95"]),
  ...flame([x, y, z + h], 2.2, accent),
];

export const WALLS: Tones = ["#4A5580", "#2F3757", "#252C46"];
export const LOCK: Tones = ["#B4484D", INK.red, INK.redDark];

/** A crescent moon at a point of the drawing. */
export function moon(cx: number, cy: number, radius: number): Shape {
  const r = n(radius * k());
  return {
    d: `M${n(cx)} ${n(cy - r)} A${r} ${r} 0 1 1 ${n(cx)} ${n(cy + r)} A${n(r * 0.72)} ${r} 0 1 0 ${n(cx)} ${n(cy - r)} Z`,
    fill: INK.glass,
  };
}

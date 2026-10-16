// Shelter's badge frames, one per level, richer at each: the survivors'
// winter. Bronze is a riveted survivor's tag on a pair of fir sprigs;
// silver a rope-lashed medal in a fir wreath under a snowflake; gold
// adds snow and icicles on the rope, a crested ruby flake and the camp
// fire at its foot; diamond is a platinum frost-crystal medallion, its
// rim set with diamonds, the fire still burning below.

import type { EmblemData, EmblemPart } from "@/components/engraved/emblem";
import { INKS, frond, type Material, type Pt } from "@/components/engraved/shapes";
import type { BadgeFrame, BadgeStyle } from "@/components/badges/types";
import { C, arc, at, beads, circle, disc, gem, rays, ring } from "@/components/badges/frames/kit";

const FACE = 27;
const f = (n: number) => +n.toFixed(2);
const P = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
const HEMP = "#C9A266" as const;
const ICE = "#CFE6F8" as const;

/** A six-armed snowflake as one outline: each arm `h` half-wide out to
 *  `R`, with a pair of barbs leaning out from it. */
function flake(cx: number, cy: number, R: number, h: number, m: Material, rot = 0, at0 = 0.5): EmblemPart {
  const pts: Pt[] = [];
  const veins: string[] = [];
  const s60 = Math.sin(Math.PI / 3);
  for (let k = 0; k < 6; k++) {
    const th = ((rot + k * 60) * Math.PI) / 180;
    const u: Pt = [Math.sin(th), -Math.cos(th)];
    const v: Pt = [Math.cos(th), Math.sin(th)];
    const L = (x: number, y: number): Pt => [cx + u[0] * y + v[0] * x, cy + u[1] * y + v[1] * x];
    const b = R * at0;
    const bl = R * 0.72 * (1 - at0);
    const bw = h * 1.7;
    const side = (sx: number): Pt[] => [
      L(sx * h, h * Math.sqrt(3)),
      L(sx * h, b),
      L(sx * (h + bl * s60), b + bl * 0.5 + h * 0.4),
      L(sx * h, b + bw),
      L(sx * h, R - h * 2.2),
    ];
    pts.push(...side(-1), L(0, R), ...side(1).reverse());
    veins.push(`M${P(L(0, h * 1.2))}L${P(L(0, R - h * 2))}`);
  }
  return {
    d: `M${pts.map(P).join("L")}Z`,
    m,
    vein: veins.join(""),
    ink: 0.8,
    vw: 0.45,
  };
}

/** Fir sprigs along radius `r` from `a0` to `a1` degrees: `n` serrated
 *  sprigs pointing the way the branch grows, leaning out and in. */
function fir(r: number, a0: number, a1: number, n: number, len: number, w: number, m: Material = "leaf"): EmblemData {
  const dir = Math.sign(a1 - a0);
  const parts: EmblemData = [
    { line: arc(r, Math.min(a0, a1), Math.max(a0, a1)), color: INKS[m].ink, w: 1.5 },
  ];
  for (let i = 0; i < n; i++) {
    const deg = a0 + ((a1 - a0) * i) / Math.max(n - 1, 1);
    const lean = i % 2 ? 26 : -26;
    const [x, y] = at(deg, r + (i % 2 ? -0.8 : 0.8));
    parts.push({
      d: frond(len, w, 6),
      m,
      vein: `M0 -1L0 ${-len + 2}`,
      ink: 0.75,
      vw: 0.45,
      t: `translate(${x} ${y}) rotate(${f(deg + dir * 90 + lean * dir)})`,
    });
  }
  return parts;
}

/** A twisted rope round the badge: a band with its strands cut across
 *  it on the slant. */
function rope(r: number, w: number, n: number, m: `#${string}` | Material = HEMP): EmblemPart {
  const step = 360 / n;
  const strands = Array.from({ length: n }, (_, i) => {
    const a = i * step;
    return `M${P(at(a, r - w / 2 + 0.3))}L${P(at(a + step * 1.4, r + w / 2 - 0.3))}`;
  }).join("");
  return {
    d: circle(r + w / 2) + circle(r - w / 2),
    m,
    evenOdd: true,
    vein: strands,
    shine: arc(r + w / 2 - 1, -68, -30),
    ink: 1,
    vw: 0.6,
    sw: 0.8,
  };
}

/** Snow lying along the top of radius `r` (a bumpy drift between `a0`
 *  and `a1`), and icicles hanging from it at the given angles. */
function snow(r: number, a0: number, a1: number, icicles: number[]): EmblemData {
  const n = 14;
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const end = Math.sin((Math.PI * i) / n);
    top.push(at(a, r + 1 + end * (2.2 + (i % 2) * 0.9)));
    bottom.push(at(a, r - 1.5 - end * 1.2));
  }
  const cap: EmblemPart = {
    d: `M${top.map(P).join("L")}L${bottom.reverse().map(P).join("L")}Z`,
    m: "ivory",
    shine: arc(r + 2.2, a0 + 6, a0 + (a1 - a0) * 0.4),
    ink: 0.8,
    sw: 0.8,
  };
  const ice: EmblemData = icicles.map((a, i) => {
    const [x, y] = at(a, r - 2.2);
    const len = 5 + (i % 2) * 2;
    return {
      d: `M${f(x - 1.3)} ${f(y)}L${f(x + 1.3)} ${f(y)}L${f(x + 0.2)} ${f(y + len)}Z`,
      m: ICE,
      ink: 0.6,
    };
  });
  return [cap, ...ice];
}

const LOG = (l: number, h: number) =>
  `M${-l} ${-h}H${l}A${h * 0.6} ${h} 0 0 1 ${l} ${h}H${-l}A${h * 0.6} ${h} 0 0 1 ${-l} ${-h}Z`;

/** The camp fire: two logs crossed under a flame, at (x, y) its foot. */
function campfire(x: number, y: number, s: number): EmblemData {
  const logs: EmblemData = [16, -16].flatMap((turn) => {
    const end = turn > 0 ? 11 * s : -11 * s;
    const t = `translate(${x} ${y + 1.5 * s}) rotate(${turn})`;
    return [
      {
        d: LOG(11 * s, 2.6 * s),
        m: "wood" as const,
        vein: `M${f(-8 * s)} ${f(-0.8 * s)}H${f(-1 * s)}M${f(2 * s)} ${f(0.9 * s)}H${f(8 * s)}`,
        ink: 0.8,
        vw: 0.45,
        t,
      },
      {
        d: `M${f(end - 1.5 * s)} 0A${f(1.5 * s)} ${f(2.6 * s)} 0 1 1 ${f(end + 1.5 * s)} 0A${f(1.5 * s)} ${f(2.6 * s)} 0 1 1 ${f(end - 1.5 * s)} 0Z`,
        m: "#E6BE84" as const,
        vein: `M${f(end - 0.5 * s)} 0A${f(0.5 * s)} ${f(1 * s)} 0 1 1 ${f(end + 0.5 * s)} 0A${f(0.5 * s)} ${f(1 * s)} 0 1 1 ${f(end - 0.5 * s)} 0Z`,
        ink: 0.6,
        vw: 0.4,
        t,
      },
    ];
  });
  const flame = (k: number) =>
    `M0 0C${-6 * k} 0 ${-7.5 * k} ${-4 * k} ${-5.5 * k} ${-8 * k}C${-4.6 * k} ${-9.8 * k} ${-4.4 * k} ${-11.5 * k} ${-4.6 * k} ${-13.5 * k}C${-2.4 * k} ${-12 * k} ${-1.6 * k} ${-10.6 * k} ${-1.3 * k} ${-9 * k}C${-0.6 * k} ${-12.4 * k} ${0.8 * k} ${-15.6 * k} ${0.2 * k} ${-19 * k}C${4.4 * k} ${-15 * k} ${6.6 * k} ${-11 * k} ${6.2 * k} ${-7 * k}C${6 * k} ${-3.4 * k} ${4.6 * k} 0 0 0Z`;
  return [
    ...logs,
    {
      d: flame(s),
      m: "flame",
      vein: `M${f(0.3 * s)} ${f(-3 * s)}C${f(1.2 * s)} ${f(-7 * s)} ${f(0.8 * s)} ${f(-11 * s)} ${f(0.2 * s)} ${f(-15 * s)}`,
      ink: 0.9,
      vw: 0.5,
      t: `translate(${x} ${y})`,
    },
    { d: flame(s * 0.5), m: "#FFF0B0", ink: 0, t: `translate(${x + 0.4 * s} ${y - 0.4 * s})` },
  ];
}

/** Rivets: round metal heads at the given angles on radius `r`. */
const rivets = (r: number, angles: number[], size: number, m: Material): EmblemData =>
  angles.map((deg) => {
    const [x, y] = at(deg, r);
    return { d: circle(size, x, y), m, round: true, ink: 0.7, shine: `M${f(x - size * 0.55)} ${f(y - size * 0.2)}A${size * 0.6} ${size * 0.6} 0 0 1 ${f(x - size * 0.1)} ${f(y - size * 0.6)}`, sw: 0.5 };
  });

function bronze(): BadgeFrame {
  const rim = ring(37, FACE + 2, "bronze");
  // the tag's eyelet, where it hangs from a cord
  const eyelet: EmblemPart = {
    d: circle(6, C, 20) + circle(2.8, C, 20),
    m: "bronze",
    evenOdd: true,
    shine: `M${C - 4.6} 18A4.8 4.8 0 0 1 ${C - 1.4} 15.4`,
    ink: 1,
    sw: 0.8,
  };
  return {
    back: [
      ...fir(42, 184, 240, 4, 13, 3.4),
      ...fir(42, 176, 120, 4, 13, 3.4),
      eyelet,
      rim,
      ...rivets(33, [45, 135, 225, 315], 1.9, "bronze"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d + eyelet.d,
    glints: [[37, 34, 4]],
  };
}

function silver(): BadgeFrame {
  const rim = ring(36.5, FACE + 2, "silver");
  return {
    back: [
      ...fir(44.5, 188, 326, 8, 15, 3.6),
      ...fir(44.5, 172, 34, 8, 15, 3.6),
      flake(C, 14.5, 11, 1.6, "silver", 0),
      rope(39.5, 5, 40),
      rim,
      ...beads(33, 16, 1.05, "silver"),
      disc(FACE + 0.5),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 6, 3.5],
      [37, 33, 4.5],
      [88, 80, 3],
    ],
  };
}

function gold(): BadgeFrame {
  const rim = ring(36.5, FACE + 2, "gold");
  const [lx, ly] = at(270, 33);
  const [rx, ry] = at(90, 33);
  return {
    back: [
      ...fir(46, 204, 334, 9, 16, 3.9),
      ...fir(46, 156, 26, 9, 16, 3.9),
      flake(C, 14.5, 11.5, 1.8, "gold", 0),
      rope(40, 5.4, 44),
      rim,
      ...beads(33, 20, 1.05, "gold", 20, 340),
      disc(FACE + 0.5),
    ],
    front: [
      ...snow(40, -60, 60, [-46, -32, 32, 46]),
      ...campfire(C, 106, 1),
      { jewel: "ruby", x: C, y: 14.5, r: 3.4 },
      { jewel: "emerald", x: lx, y: ly, r: 2.8 },
      { jewel: "emerald", x: rx, y: ry, r: 2.8 },
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 6, 3.5],
      [36, 34, 4.5],
      [56, 92, 3],
      [92, 70, 3],
    ],
  };
}

function diamond(): BadgeFrame {
  const rim = ring(39, FACE + 2, "platinum");
  const set = [60, 120, 240, 300].map((deg) => {
    const [x, y] = at(deg, 34);
    return { jewel: "diamond" as const, x, y, r: 2.6 };
  });
  return {
    back: [
      // a great frost crystal behind: six barbed arms, shards between
      ...rays(6, 34, 50, 20, "platinum", 0, "#A8C8E8"),
      flake(C, C, 55, 3.6, "platinum", 30, 0.8),
      rope(40.5, 4, 46, "#B8D4EC"),
      rim,
      ...beads(32.2, 24, 0.9, "platinum"),
      disc(FACE + 0.5),
    ],
    front: [
      ...snow(40.5, -46, 46, [-34, -20, 20, 34]),
      ...campfire(C, 107, 1),
      ...set,
      ...gem(C, 13, 15),
    ],
    face: FACE,
    sweep: rim.d,
    glints: [
      [C, 6, 5],
      [26, 34, 4],
      [96, 30, 3.5],
      [18, 92, 3],
      [100, 88, 4],
    ],
  };
}

export const BADGE_FRAMES: BadgeStyle = (tier) =>
  tier === "bronze" ? bronze() : tier === "silver" ? silver() : tier === "gold" ? gold() : diamond();

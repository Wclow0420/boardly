// Light: candlesticks and candelabra, a sconce, lanterns, a lamp post.
// Their flames are the kit's `flame`, so they come alive inside live().

import {
  ball,
  box,
  cylinder,
  flame,
  GOLD,
  INK,
  inkOf,
  k,
  line,
  n,
  P,
  path,
  poly,
  tone,
  unit,
  type Shape,
  type Tones,
  type V3,
} from "../kit";
import { disc, WAX } from "../room";
import {
  ASHLAR,
  BRASS,
  BRASS_SHEEN,
  GILT,
  GILT_SHEEN,
  IRONWORK,
  PAGES,
  PALE_GILT,
  SILVER,
  SILVER_SHEEN,
  WARM_INK,
} from "./materials";
import { ellipsePoints, lit, onWall, rod, shaded, strokes, type Wall } from "./helpers";
import { lathe, turned } from "./turned";

/** A standing candelabrum at (x, y): a gilt plinth on three feet, a turned shaft
 *  with knops, a drip bowl, and five candles on curving arms. */
export function torchere(x: number, y: number, accent: string): Shape[] {
  const arm = 0.058;
  const z0 = 0.35;
  const branch = (dx: number, dy: number): Shape[] => {
    const tip: V3 = [x + dx, y + dy, z0 + 0.03];
    const path: V3[] = [
      [x, y, z0],
      [x + dx * 0.45, y + dy * 0.45, z0 - 0.016],
      [x + dx * 0.85, y + dy * 0.85, z0 - 0.004],
      [x + dx, y + dy, z0 + 0.018],
    ];
    return [
      line(path, tone(GOLD[2], -0.5), 2.3),
      line(path, GOLD[1], 1.3),
      ...turned(tip, [[0.006, -0.012], [0.006, 0], [0.016, 0.008]], GILT_SHEEN, GOLD[1]),
      ...cylinder(tip[0], tip[1], tip[2] + 0.008, 0.007, 0.045, WAX),
      ...flame([tip[0], tip[1], tip[2] + 0.053], 2, accent),
    ];
  };
  const feet = [0.6, 2.7, 4.8]
    .map((a): [number, number] => [x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05])
    .sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  return [
    disc(x + 0.03, y + 0.015, 0, 0.06, INK.night, undefined, 0.32),
    ...feet.flatMap(([fx, fy]) => [line([[x, y, 0.024], [fx, fy, 0.008]], tone(GOLD[2], -0.5), 2.4), line([[x, y, 0.024], [fx, fy, 0.008]], GOLD[1], 1.4), ball([fx, fy, 0.008], 0.75, GOLD[0], GOLD[2])]),
    ...turned([x, y, 0.012], [[0.034, 0], [0.036, 0.008], [0.024, 0.02], [0.012, 0.032]], GILT_SHEEN),
    ...turned(
      [x, y, 0.044],
      [
        [0.012, 0],
        [0.009, 0.07],
        [0.022, 0.082],
        [0.023, 0.094],
        [0.009, 0.104],
        [0.008, 0.19],
        [0.019, 0.204],
        [0.008, 0.218],
        [0.008, 0.276],
        [0.016, 0.29],
      ],
      GILT_SHEEN,
    ),
    ...turned([x, y, z0 - 0.02], [[0.014, 0], [0.036, 0.012], [0.042, 0.02]], GILT_SHEEN, GOLD[0]),
    ...branch(0, -arm),
    ...branch(-arm, 0),
    ...turned([x, y, z0], [[0.007, 0], [0.006, 0.03], [0.015, 0.04]], GILT_SHEEN, GOLD[1]),
    ...cylinder(x, y, z0 + 0.04, 0.008, 0.055, WAX),
    ...flame([x, y, z0 + 0.095], 2.3, accent),
    ...branch(arm, 0),
    ...branch(0, arm),
  ];
}

/** A silver candelabrum on a table at (x, y, z): a domed foot, a turned
 *  stem, two scrolled arms along x and a taller middle light. */
export function tableCandelabrum(x: number, y: number, z: number, accent: string): Shape[] {
  const spread = 0.045;
  const az = z + 0.1;
  const light = (cx: number, cz: number, h: number): Shape[] => [
    ...turned([cx, y, cz], [[0.005, -0.006], [0.005, 0], [0.012, 0.007]], SILVER_SHEEN, SILVER[1]),
    ...cylinder(cx, y, cz + 0.007, 0.006, h, WAX),
    ...flame([cx, y, cz + 0.007 + h], 1.8, accent),
  ];
  const arm = (s: number): Shape[] => {
    const pts: V3[] = [
      [x, y, az - 0.012],
      [x + s * spread * 0.5, y, az - 0.026],
      [x + s * spread * 0.92, y, az - 0.012],
      [x + s * spread, y, az + 0.004],
    ];
    return [line(pts, tone(SILVER[2], -0.5), 2), line(pts, SILVER[0], 1.1)];
  };
  return [
    disc(x + 0.012, y + 0.006, z, 0.03, INK.night, undefined, 0.25),
    ...turned(
      [x, y, z],
      [
        [0.026, 0],
        [0.026, 0.006],
        [0.014, 0.016],
        [0.006, 0.024],
        [0.005, 0.05],
        [0.011, 0.058],
        [0.005, 0.066],
        [0.005, 0.09],
        [0.01, 0.098],
      ],
      SILVER_SHEEN,
    ),
    ...arm(-1),
    ...arm(1),
    ...light(x - spread, az + 0.004, 0.045),
    ...light(x + spread, az + 0.004, 0.045),
    ...turned([x, y, z + 0.098], [[0.006, 0], [0.006, 0.014]], SILVER_SHEEN),
    ...light(x, az + 0.018, 0.055),
  ];
}

/** A gilt candlestick standing at (x, y, z), `h` to the drip pan: a
 *  stepped foot, a turned stem with a knop, a pan, a wax candle and its
 *  flame. `size` scales it (1 for the altar, ~1.8 for a floor stand). */
export function giltCandlestick(x: number, y: number, z: number, h: number, accent: string, size = 1): Shape[] {
  const r = 0.022 * size;
  const foot = 0.012 * size;
  const wax = 0.06 * size;
  return [
    ...cylinder(x, y, z, r, foot, PALE_GILT),
    ...cylinder(x, y, z + foot, r * 0.55, foot, PALE_GILT),
    ...cylinder(x, y, z + foot * 2, r * 0.22, h - foot * 2, PALE_GILT),
    ball([x, y, z + h * 0.42], 0.5 * size, PALE_GILT[1], inkOf(PALE_GILT[1])),
    ball([x, y, z + h * 0.75], 0.34 * size, PALE_GILT[1], inkOf(PALE_GILT[1])),
    ...cylinder(x, y, z + h, r * 0.75, 0.007 * size, PALE_GILT),
    ...cylinder(x, y, z + h + 0.007 * size, 0.008 * size, wax, WAX),
    ...flame([x, y, z + h + 0.007 * size + wax], 1.9 * Math.sqrt(size), accent),
  ];
}

/** A brass candlestick standing at (x, y, z): a round foot, a turned
 *  stem `stem` tall, a drip pan, the candle (`wax` tall) and its flame. */
export function brassCandlestick(x: number, y: number, z: number, accent: string, stem = 0.05, wax = 0.07): Shape[] {
  return [
    ...cylinder(x, y, z, 0.024, 0.008, BRASS),
    ...cylinder(x, y, z + 0.008, 0.012, 0.008, BRASS),
    ...cylinder(x, y, z + 0.016, 0.006, stem, BRASS),
    ...cylinder(x, y, z + 0.016 + stem * 0.45, 0.01, 0.008, BRASS),
    ...cylinder(x, y, z + 0.016 + stem, 0.016, 0.006, BRASS),
    ...box(x - 0.011, y - 0.011, z + 0.022 + stem, 0.022, 0.022, wax, PAGES),
    ...flame([x, y, z + 0.022 + stem + wax], 2.2, accent),
  ];
}

/** A brass chamberstick standing at (x, y, z), turned in one piece: a
 *  foot, a stem `stem` tall and a drip pan, a wax candle (`wax` tall) and
 *  its flame. */
export function turnedCandlestick(x: number, y: number, z: number, accent: string, stem = 0.04, wax = 0.05): Shape[] {
  return [
    ...turned(
      [x, y, z],
      [
        [0.02, 0],
        [0.019, 0.005],
        [0.008, 0.012],
        [0.005, 0.016],
        [0.006, stem * 0.5],
        [0.004, stem - 0.006],
        [0.014, stem - 0.002],
        [0.013, stem + 0.003],
      ],
      BRASS_SHEEN,
    ),
    ...cylinder(x, y, z + stem + 0.003, 0.008, wax, ["#FFFFFF", "#F4EEDF", "#D8CCB0"]),
    ...flame([x, y, z + stem + 0.003 + wax], 2, accent),
  ];
}

/** A candle sconce on a back wall at u, z: a gilt back plate, a curved
 *  arm out from the wall, a drip pan, the candle and its flame. */
export function brassSconce(wall: Wall, u: number, z: number, accent: string): Shape[] {
  const out = 0.05;
  const [px, py] = P(...onWall(wall, u, z + 0.02, 0.002));
  const [x, y] = wall === "x" ? [out, u] : [u, out];
  const pr = 0.022 * unit();
  return [
    {
      d: path(ellipsePoints(px, py, pr * 0.62, pr * 1.15, 12)),
      fill: GILT[1],
      grad: { colors: GILT, from: [px - pr * 0.4, py - pr], to: [px + pr * 0.4, py + pr] },
      stroke: WARM_INK,
      strokeWidth: 0.45,
    },
    {
      ...line([onWall(wall, u, z + 0.035, 0), onWall(wall, u, z - 0.01, out * 0.5), [x, y, z]], GILT[2], 1.4),
    },
    { ...line([onWall(wall, u, z + 0.035, 0), onWall(wall, u, z - 0.01, out * 0.5), [x, y, z]], GILT[0], 0.5), opacity: 0.8 },
    ...cylinder(x, y, z, 0.017, 0.008, [GILT[0], GILT[1], GILT[2]]),
    ...box(x - 0.008, y - 0.008, z + 0.008, 0.016, 0.016, 0.04, [PAGES[0], PAGES[1], PAGES[2]]),
    ...flame([x, y, z + 0.048], 1.8, accent),
  ];
}

/** A brass lantern standing at (x, y, z): a base, a candle behind four
 *  panes of glass, corner posts, a pyramid roof and a ring. `s` is half
 *  its width. */
export function brassLantern(x: number, y: number, z: number, s: number, h: number, accent: string): Shape[] {
  const zb = z + 0.012;
  const zt = zb + h;
  const r = s * 1.25;
  const apex: V3 = [x, y, zt + 0.045];
  const glass = (pts: V3[]): Shape => ({ ...poly(pts, INK.glass), opacity: 0.22, stroke: undefined });
  const [ax, ay] = P(...apex);
  return [
    ...box(x - s, y - s, z, 2 * s, 2 * s, 0.012, BRASS),
    ...box(x - 0.008, y - 0.008, zb, 0.016, 0.016, h * 0.45, WAX),
    ...flame([x, y, zb + h * 0.45], 1.7, accent),
    glass([[x - s, y + s, zb], [x + s, y + s, zb], [x + s, y + s, zt], [x - s, y + s, zt]]),
    glass([[x + s, y - s, zb], [x + s, y + s, zb], [x + s, y + s, zt], [x + s, y - s, zt]]),
    { ...line([[x - s * 0.6, y + s, zt - h * 0.15], [x - s * 0.1, y + s, zt - h * 0.6]], "#FFFFFF", 0.5), opacity: 0.6 },
    ...[[x + s, y - s], [x - s, y + s], [x + s, y + s]].flatMap(([px, py]) => rod([[px, py, zb], [px, py, zt]], BRASS[1], 0.7)),
    line([[x - s, y + s, zb + h * 0.5], [x + s, y + s, zb + h * 0.5], [x + s, y - s, zb + h * 0.5]], BRASS[2], 0.5),
    ...box(x - r, y - r, zt, 2 * r, 2 * r, 0.01, BRASS),
    lit([[x - r, y + r, zt + 0.01], [x + r, y + r, zt + 0.01], apex], BRASS[1], [x - r, y + r, zt], apex, 0.25, 0.2),
    lit([[x + r, y - r, zt + 0.01], [x + r, y + r, zt + 0.01], apex], BRASS[2], apex, [x + r, y - r, zt], 0.15, 0.25),
    {
      d: `M${n(ax - 1.4)} ${n(ay - 1.3)} a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0`,
      stroke: BRASS[1],
      strokeWidth: 0.8,
    },
  ];
}

/** A lantern hanging from an iron bracket on the right-hand wall (y = 0)
 *  at x: the arm and its scroll, a chain, a cage of dark iron round warm
 *  glass, a brass cap, and the flame inside. */
export function hangingLantern(x: number, z: number, accent: string): Shape[] {
  const arm = 0.11;
  const ly = arm - 0.01;
  const s = 0.05;
  const lz = z - 0.17;
  const hgt = 0.065;
  const amber: Tones = ["#FFE6A6", "#F0C36A", "#C08A3A"];
  const [x0, x1, y0, y1] = [x - s / 2, x + s / 2, ly - s / 2, ly + s / 2];
  const zt = lz + 0.012 + hgt;
  const apex: V3 = [x, ly, zt + 0.045];
  const [sx, sy] = P(x, 0.055, z - 0.035);
  return [
    // the bracket: an arm, a brace and a scroll
    line([[x, 0, z], [x, arm, z]], IRONWORK[1], 1.6),
    line([[x, 0, z - 0.07], [x, 0.065, z]], IRONWORK[1], 1.1),
    { d: `M${n(sx)} ${n(sy)} a${n(1.1 * k())} ${n(1.1 * k())} 0 1 1 ${n(0.8 * k())} ${n(0.9 * k())}`, stroke: IRONWORK[0], strokeWidth: 0.9 },
    ...box(x - 0.008, -0.004, z - 0.09, 0.016, 0.006, 0.12, IRONWORK),
    // the chain
    { ...line([[x, ly, z], [x, ly, apex[2] + 0.012]], IRONWORK[0], 0.9), dash: "1.6 1" },
    // the lantern
    ...box(x0, y0, lz, s, s, 0.012, IRONWORK),
    ...box(x0 + 0.005, y0 + 0.005, lz + 0.012, s - 0.01, s - 0.01, hgt, amber),
    ...flame([x, ly, lz + 0.016], 1.6, accent),
    strokes(
      [
        [[x1, y1, lz + 0.012], [x1, y1, zt]],
        [[x0, y1, lz + 0.012], [x0, y1, zt]],
        [[x1, y0, lz + 0.012], [x1, y0, zt]],
        [[x0 + 0.004, y1, lz + 0.012 + hgt / 2], [x1, y1, lz + 0.012 + hgt / 2], [x1, y0 + 0.004, lz + 0.012 + hgt / 2]],
      ],
      IRONWORK[2],
      1,
    ),
    ...box(x0 - 0.004, y0 - 0.004, zt, s + 0.008, s + 0.008, 0.01, IRONWORK),
    shaded([[x0 - 0.004, y1 + 0.004, zt + 0.01], [x1 + 0.004, y1 + 0.004, zt + 0.01], apex], BRASS[1], [x0, y1, zt], apex, 0.25, 0.1),
    shaded([[x1 + 0.004, y1 + 0.004, zt + 0.01], [x1 + 0.004, y0 - 0.004, zt + 0.01], apex], BRASS[2], apex, [x1, y0, zt], 0.15, 0.2),
    ball(apex, 0.7, BRASS[0], BRASS[2]),
  ];
}

/** A storm lantern standing at (x, y, z), `h` tall: an iron base and
 *  cap, a glass with a flame in it, a wire bail. */
export function stormLantern(x: number, y: number, z: number, h: number, accent: string): Shape[] {
  const r = h * 0.3;
  const [cx] = P(x, y, z + h);
  const [, topY] = P(x, y, z + h * 1.08);
  const rx = r * unit() * 1.2247;
  return [
    ...cylinder(x, y, z, r * 1.05, h * 0.14, IRONWORK).slice(0, 2),
    ...cylinder(x, y, z + h * 0.14, r * 0.8, h * 0.56, ["#FFE9B8", "#F2C46A", "#C98A3A"]).slice(0, 2).map((s) => ({ ...s, opacity: 0.7 })),
    line([[x - r * 0.8, y, z + h * 0.14], [x - r * 0.8, y, z + h * 0.7]], IRONWORK[1], 0.6),
    line([[x + r * 0.8, y + r * 0.2, z + h * 0.14], [x + r * 0.8, y + r * 0.2, z + h * 0.7]], IRONWORK[1], 0.6),
    ...flame([x, y, z + h * 0.2], h * 22, accent),
    ...cylinder(x, y, z + h * 0.7, r * 1.0, h * 0.12, IRONWORK).slice(0, 2),
    ...cylinder(x, y, z + h * 0.82, r * 0.45, h * 0.12, IRONWORK).slice(0, 2),
    { d: `M${n(cx - rx * 0.9)} ${n(topY + h * unit() * 0.1)} Q${n(cx)} ${n(topY - h * unit() * 0.42)} ${n(cx + rx * 0.9)} ${n(topY + h * unit() * 0.1)}`, stroke: IRONWORK[0], strokeWidth: 0.6 },
  ];
}

/** An iron lamp post at (x, y), its lantern at `h`: a stone footing, a turned iron post with
 *  a collar, scrolls under a glass lantern with a brass cap. */
export function lampPost(x: number, y: number, h: number, accent: string): Shape[] {
  const s = 0.05;
  const lz = h;
  const hgt = 0.07;
  const amber: Tones = ["#FFE6A6", "#F0C36A", "#C08A3A"];
  const [x0, x1, y0, y1] = [x - s / 2, x + s / 2, y - s / 2, y + s / 2];
  const zt = lz + 0.012 + hgt;
  const apex: V3 = [x, y, zt + 0.05];
  const [px, py] = P(x, y, lz - 0.03);
  const c = 1.2 * k();
  return [
    disc(x + 0.03, y + 0.015, 0, 0.05, INK.night, undefined, 0.35),
    ...box(x - 0.035, y - 0.035, 0, 0.07, 0.07, 0.03, ASHLAR),
    ...lathe(
      x,
      y,
      0.03,
      [
        [0, 0.026],
        [0.02, 0.022],
        [0.05, 0.012],
        [0.07, 0.008],
        [h - 0.05, 0.007],
        [h - 0.045, 0.012],
        [h - 0.035, 0.012],
        [h - 0.03, 0.008],
      ],
      IRONWORK,
      [0.02, h - 0.04],
    ),
    // scrolls holding the lantern
    {
      d: `M${n(px)} ${n(py)} q${n(-c * 1.6)} ${n(-c * 0.2)} ${n(-c * 1.5)} ${n(-c * 1.3)} a${n(c * 0.45)} ${n(c * 0.45)} 0 1 1 ${n(c * 0.6)} ${n(c * 0.35)} M${n(px)} ${n(py)} q${n(c * 1.6)} ${n(-c * 0.2)} ${n(c * 1.5)} ${n(-c * 1.3)} a${n(c * 0.45)} ${n(c * 0.45)} 0 1 0 ${n(-c * 0.6)} ${n(c * 0.35)}`,
      stroke: IRONWORK[2],
      strokeWidth: 1,
    },
    ...box(x0, y0, lz, s, s, 0.012, IRONWORK),
    ...box(x0 + 0.005, y0 + 0.005, lz + 0.012, s - 0.01, s - 0.01, hgt, amber),
    ...flame([x, y, lz + 0.018], 1.7, accent),
    strokes(
      [
        [[x1, y1, lz + 0.012], [x1, y1, zt]],
        [[x0, y1, lz + 0.012], [x0, y1, zt]],
        [[x1, y0, lz + 0.012], [x1, y0, zt]],
      ],
      IRONWORK[2],
      1.1,
    ),
    ...box(x0 - 0.006, y0 - 0.006, zt, s + 0.012, s + 0.012, 0.01, IRONWORK),
    shaded([[x0 - 0.006, y1 + 0.006, zt + 0.01], [x1 + 0.006, y1 + 0.006, zt + 0.01], apex], BRASS[1], [x0, y1, zt], apex, 0.25, 0.1),
    shaded([[x1 + 0.006, y1 + 0.006, zt + 0.01], [x1 + 0.006, y0 - 0.006, zt + 0.01], apex], BRASS[2], apex, [x1, y0, zt], 0.15, 0.2),
    ball(apex, 0.8, BRASS[0], BRASS[2]),
  ];
}

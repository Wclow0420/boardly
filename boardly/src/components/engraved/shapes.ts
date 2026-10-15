// The house style's shapes, as plain SVG path data: scrolls, acanthus,
// bands, leaves and feathers, built procedurally so every border, emblem
// and icon draws them the same way. Shared by the Skia borders
// (features/cosmetics/art) and the SVG icons (./icons). See "The house
// drawing style" in AGENTS.md.

export type Pt = [number, number];
export const fmt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

/** Fills, light to dark and back. Metals first (gold, silver, dark
 *  iron), then ivory (bone, parchment, cloth), wood, and the enamels:
 *  flame, crimson (wine, blood, a seal), leaf green, night blue. */
export const MATERIALS = {
  gold: ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"],
  silver: ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"],
  iron: ["#A8AEB8", "#5A606A", "#2A2E36", "#7A808A"],
  ivory: ["#FFFFFF", "#F4EEDF", "#D8CCB0"],
  wood: ["#D09A5E", "#8A5A2E", "#5A3618", "#A8743E"],
  flame: ["#FFF6C8", "#FFB23A", "#E2541A", "#FFD27A"],
  crimson: ["#FF9AA6", "#C2203A", "#6A0A18", "#E05A6A"],
  leaf: ["#D8F0A0", "#6AAA3A", "#2E6A1E", "#9ACC5A"],
  night: ["#9AB8E8", "#3A5A9A", "#1A2A5A", "#6A8AC8"],
} as const;
export type Material = keyof typeof MATERIALS;

/** The outline and the engraved lines for each material. */
export const INKS: Record<Material, { ink: string; vein: string }> = {
  gold: { ink: "#3A2408", vein: "#7A5212" },
  silver: { ink: "#1E242C", vein: "#4A5462" },
  iron: { ink: "#0E1014", vein: "#2A2E36" },
  ivory: { ink: "#3A2408", vein: "#A08A60" },
  wood: { ink: "#2A1808", vein: "#4A2C12" },
  flame: { ink: "#5A1A04", vein: "#A0360C" },
  crimson: { ink: "#3A0408", vein: "#7A1020" },
  leaf: { ink: "#14300A", vein: "#2E5A16" },
  night: { ink: "#0A1430", vein: "#1A2A5A" },
};

const channel = (hex: string, i: number) =>
  parseInt(hex.replace("#", "").slice(i * 2, i * 2 + 2), 16);
/** Mix `hex` toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
  const to = amount > 0 ? 255 : 0;
  const k = Math.abs(amount);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(hex, i) + (to - channel(hex, i)) * k)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Any colour as cloth, skin or hair: a soft fall of light rather than a
 *  metal's sheen, inked a little darker than itself. */
export function cloth(hex: string) {
  return {
    colors: [shade(hex, 0.32), hex, shade(hex, -0.2)],
    ink: shade(hex, -0.72),
    vein: shade(hex, -0.38),
  };
}

/** Any colour as an enamel: its fill, outline and engraving. */
export function enamel(hex: string) {
  return {
    colors: [shade(hex, 0.55), hex, shade(hex, -0.4), shade(hex, 0.25)],
    ink: shade(hex, -0.78),
    vein: shade(hex, -0.5),
  };
}

/** Jewels: highlight, body, depth. */
export const JEWELS = {
  ruby: ["#FF9AA6", "#D0102E", "#5A0410"],
  sapphire: ["#D8EEFF", "#2E7AE0", "#0A2A6A"],
  emerald: ["#C8FFD8", "#1E9A54", "#06401E"],
} as const;
export type Jewel = keyof typeof JEWELS;

/** A scroll: a tapering stroke that sets off along `heading` and turns
 *  ever tighter (by `turn` in all) into a curl. Returns its outline and
 *  its centre line (the engraved vein). */
export function curl(
  x: number,
  y: number,
  heading: number,
  len: number,
  turn: number,
  w: number,
  /** How fast it thins toward the eye (lower keeps it fuller), or
   *  "leaf": thin at both ends, swelling between. */
  taper: number | "leaf" = 0.9,
) {
  const N = 48;
  const mid: Pt[] = [];
  const left: Pt[] = [];
  const right: Pt[] = [];
  let px = x;
  let py = y;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const th = heading + turn * s * s;
    const body =
      taper === "leaf"
        ? Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * s)), 0.8)
        : Math.pow(1 - s, taper);
    const half = (w * body + 0.6) / 2;
    mid.push([px, py]);
    left.push([px + Math.sin(th) * half, py - Math.cos(th) * half]);
    right.push([px - Math.sin(th) * half, py + Math.cos(th) * half]);
    const ds = (len / N) * (1.35 - 0.9 * s);
    px += Math.cos(th) * ds;
    py += Math.sin(th) * ds;
  }
  const outline = `M${left.map(fmt).join("L")}L${right.reverse().map(fmt).join("L")}Z`;
  const vein = `M${mid
    .slice(2, N - 6)
    .map(fmt)
    .join("L")}`;
  // where along it a leaf may branch, and which way is outside the curl
  const at = (s: number) => {
    const i = Math.round(s * N);
    const th = heading + turn * s * s;
    return { p: mid[i], th };
  };
  return { outline, vein, at };
}

/** An acanthus leaf: a main scroll with smaller ones branching off the
 *  outside of its curve, curling the other way. `lush` keeps the main
 *  scroll full to its eye and its leaves small and close. */
export function acanthus(
  x: number,
  y: number,
  heading: number,
  len: number,
  turn: number,
  w: number,
  lush = false,
) {
  const main = curl(x, y, heading, len, turn, w, lush ? 0.5 : 0.9);
  const sign = Math.sign(turn);
  const parts = [main];
  const leaves = lush
    ? [
        [0.22, 0.34],
        [0.42, 0.27],
        [0.6, 0.2],
      ]
    : [
        [0.2, 0.5],
        [0.42, 0.38],
        [0.62, 0.26],
      ];
  for (const [s, size] of leaves) {
    const { p, th } = main.at(s);
    parts.push(
      lush
        ? curl(
            p[0],
            p[1],
            th - sign * 0.6,
            len * size,
            -sign * 2.4,
            w * 0.7,
            "leaf",
          )
        : curl(p[0], p[1], th - sign * 0.9, len * size, -sign * 4, w * 0.6),
    );
  }
  return parts;
}

const catmull = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const f = (i: 0 | 1) =>
    0.5 *
    (2 * b[i] +
      (c[i] - a[i]) * u +
      (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u * u +
      (3 * b[i] - a[i] - 3 * c[i] + d[i]) * u * u * u);
  return [f(0), f(1)];
};

/** A band of varying width along a smooth curve through `points`, with
 *  grooves cut along its length and a line of shine. */
export function ribbon(points: Pt[], widths: number[]) {
  const S = 10;
  const mid: Pt[] = [];
  const wid: number[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const a = points[Math.max(i - 1, 0)];
    const d = points[Math.min(i + 2, n - 1)];
    for (let j = 0; j < S; j++) {
      mid.push(catmull(a, points[i], points[i + 1], d, j / S));
      wid.push(widths[i] + ((widths[i + 1] - widths[i]) * j) / S);
    }
  }
  mid.push(points[n - 1]);
  wid.push(widths[n - 1]);
  const along = (offset: number) =>
    mid.map((p, k): Pt => {
      const a = mid[Math.max(k - 1, 0)];
      const b = mid[Math.min(k + 1, mid.length - 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const h = (wid[k] / 2) * offset;
      return [p[0] - ((b[1] - a[1]) / l) * h, p[1] + ((b[0] - a[0]) / l) * h];
    });
  const line = (pts: Pt[], from: number, to: number) =>
    `M${pts
      .slice(Math.round(from * pts.length), Math.round(to * pts.length))
      .map(fmt)
      .join("L")}`;
  return {
    outline: `M${along(1).map(fmt).join("L")}L${along(-1).reverse().map(fmt).join("L")}Z`,
    grooves:
      line(along(0.55), 0.04, 0.9) +
      line(along(0.15), 0.08, 0.8) +
      line(along(-0.5), 0.12, 0.95),
    shine: line(along(-0.15), 0.1, 0.7),
  };
}

/** A serrated acanthus leaf, pointing up from its stalk: lobes leaning
 *  toward the tip, notched between. */
export function frond(len: number, w: number, lobes: number) {
  const width = (s: number) =>
    w * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.7);
  const lobe = Array.from({ length: lobes }, (_, j) => {
    const s0 = j / lobes;
    const s1 = (j + 0.85) / lobes;
    return {
      notch: [width(s0) * 0.5, -len * s0] as Pt,
      ctrl: [width(s0) * 1.1, -len * (s0 + 0.25 / lobes)] as Pt,
      tip: [width(s1), -len * s1] as Pt,
    };
  });
  const flip = (p: Pt): Pt => [-p[0], p[1]];
  // up the right side, notch to lobe tip; then down the left, in reverse
  const right = lobe
    .map((l) => `L${fmt(l.notch)}Q${fmt(l.ctrl)} ${fmt(l.tip)}`)
    .join("");
  const left = [...lobe]
    .reverse()
    .map(
      (l) => `L${fmt(flip(l.tip))}Q${fmt(flip(l.ctrl))} ${fmt(flip(l.notch))}`,
    )
    .join("");
  return `M0 0${right}L0 ${-len}${left}Z`;
}

/** A teardrop leaf, pointing up from its stalk. */
export const LEAF = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.25} ${w} ${-len * 0.7} 0 ${-len}C${-w} ${-len * 0.7} ${-w} ${-len * 0.25} 0 0Z`;

/** A long wing feather with a rounded tip, pointing up from its root. */
export const FEATHER = (len: number, w: number) =>
  `M${-w * 0.75} 0C${-w} ${-len * 0.45} ${-w * 1.05} ${-len + w * 1.1} ${-w * 0.2} ${-len}C${w * 0.6} ${-len - w * 0.2} ${w} ${-len + w * 0.6} ${w} ${-len * 0.45}C${w} ${-len * 0.2} ${w * 0.85} ${-len * 0.05} ${w * 0.75} 0Z`;

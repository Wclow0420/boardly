// Winged Crest: an engraved heraldic frame. A twisted gold rope crowns
// the picture, a laurel sprig at each end; below, two ivory wings rise
// from a ruby heart at the foot, their small feathers closing the ring
// and their long ones fanning up and out; gold acanthus scrolls curl
// away on both sides and under the heart. The heart beats.

import {
  BlurMask,
  Group,
  LinearGradient,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  Sparks,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const INK = "#3A2408";
const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const DEG = Math.PI / 180;

type Pt = [number, number];
const fmt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

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

// The right half; the left is its mirror image.
const SCROLLS = [
  // the big wave out to the side, curling down and back in
  ...acanthus(50, 30, -0.1, 62, 5.6, 13),
  // below it, falling and curling up
  ...acanthus(54, 42, 1.0, 40, -4.8, 9),
  // a small one rising behind the wing's root
  ...acanthus(56, 16, -1.25, 28, 4.4, 7),
  // under the heart, sweeping out and curling up
  ...acanthus(4, 66, 0.45, 52, -5.4, 11),
];
const SCROLL_D = SCROLLS.map((s) => s.outline).join("");

/** A long wing feather with a rounded tip, pointing up from its root. */
const FEATHER = (len: number, w: number) =>
  `M${-w * 0.75} 0C${-w} ${-len * 0.45} ${-w * 1.05} ${-len + w * 1.1} ${-w * 0.2} ${-len}C${w * 0.6} ${-len - w * 0.2} ${w} ${-len + w * 0.6} ${w} ${-len * 0.45}C${w} ${-len * 0.2} ${w * 0.85} ${-len * 0.05} ${w * 0.75} 0Z`;

/** A teardrop leaf, pointing up from its stalk. */
export const LEAF = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.25} ${w} ${-len * 0.7} 0 ${-len}C${-w} ${-len * 0.7} ${-w} ${-len * 0.25} 0 0Z`;

/** The long feathers, top (longest) first: rooted along the ring's
 *  lower right, fanning up and out. */
const PRIMARIES = Array.from({ length: 6 }, (_, k) => ({
  root: polar((-16 + k * 12) * DEG, 60),
  dir: (-62 + k * 6) * DEG,
  len: 48 - k * 5,
  w: 7.2 - k * 0.2,
}));

/** The small feathers closing the ring from the side down to the heart. */
const COVERTS = [
  { count: 10, r: 60, from: -6, to: 80, len: 14, w: 6 },
  { count: 10, r: 55, from: -2, to: 84, len: 10, w: 4.8 },
].flatMap((row) =>
  Array.from({ length: row.count }, (_, k) => {
    const a = (row.to - (row.to - row.from) * (k / (row.count - 1))) * DEG;
    return { root: polar(a, row.r), dir: a - 80 * DEG, len: row.len, w: row.w };
  }),
);

function Feather({
  root,
  dir,
  len,
  w,
}: {
  root: { x: number; y: number };
  dir: number;
  len: number;
  w: number;
}) {
  const d = FEATHER(len, w);
  return (
    <Group
      transform={[
        { translateX: root.x },
        { translateY: root.y },
        { rotate: dir + Math.PI / 2 },
      ]}
    >
      <Path path={d}>
        <LinearGradient start={vec(0, -len)} end={vec(0, 0)} colors={IVORY} />
      </Path>
      <Path path={d} style="stroke" strokeWidth={1.3} color={INK} />
      <Path
        path={`M${-w * 0.15} ${-len * 0.12}L${-w * 0.25} ${-len * 0.7}`}
        style="stroke"
        strokeWidth={0.7}
        color="#A08A60"
      />
    </Group>
  );
}

function Scrolls() {
  return (
    <Group>
      {SCROLLS.map((s, i) => (
        <Group key={i}>
          <Path path={s.outline}>
            <LinearGradient
              start={vec(0, -10)}
              end={vec(90, 90)}
              colors={GOLD}
            />
          </Path>
          <Path path={s.outline} style="stroke" strokeWidth={1.1} color={INK} />
          <Path
            path={s.vein}
            style="stroke"
            strokeWidth={0.7}
            color="#7A5212"
          />
        </Group>
      ))}
    </Group>
  );
}

const MIRROR = [{ scaleX: -1 }];

function CrestBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.35 + 0.1 * Math.sin(t.value * 1.3));
  // the long feathers stir, hinged at the ring
  const stir = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.5) * 0.02 },
  ]);
  const half = (
    <Group>
      <Scrolls />
      <Sweep t={t} d={SCROLL_D} every={4.8} />
      <Group transform={stir}>
        {PRIMARIES.map((f, k) => (
          <Feather key={k} {...f} />
        ))}
      </Group>
    </Group>
  );
  return (
    <Group>
      <Halo r={92} color="#FFE6A0" opacity={glow} />
      {/* the pendant leaf under the heart */}
      <Group transform={[{ translateY: 64 }, { rotate: Math.PI }]}>
        <Path path={LEAF(30, 7)}>
          <LinearGradient start={vec(0, 0)} end={vec(0, -30)} colors={GOLD} />
        </Path>
        <Path path={LEAF(30, 7)} style="stroke" strokeWidth={1.1} color={INK} />
        <Path
          path="M0 -2L0 -24"
          style="stroke"
          strokeWidth={0.7}
          color="#7A5212"
        />
      </Group>
      {half}
      <Group transform={MIRROR}>{half}</Group>
    </Group>
  );
}

/** The rope over the top: a gold band with its twists cut slantwise. */
const ROPE_FROM = -158 * DEG;
const ROPE_TO = -22 * DEG;
const ropeArc = (r: number) => {
  const a = polar(ROPE_FROM, r);
  const b = polar(ROPE_TO, r);
  return `M${a.x} ${a.y}A${r} ${r} 0 0 1 ${b.x} ${b.y}`;
};
const ROPE = ropeArc(56);
const TWISTS = Array.from({ length: 30 }, (_, k) => {
  const a = ROPE_FROM + ((ROPE_TO - ROPE_FROM) * (k + 0.5)) / 30;
  const p = polar(a, 52.6);
  const q = polar(a + 0.075, 59.4);
  return `M${p.x} ${p.y}L${q.x} ${q.y}`;
}).join("");

/** Laurel at each end of the rope, hugging the ring upward. */
const SPRIG = [
  { at: -24, r: 60, turn: -90, len: 20, w: 5.5 },
  { at: -16, r: 64, turn: -62, len: 17, w: 5 },
];

const HEART =
  "M0 6C-10 -1 -9 -10 -3.6 -9.6C-1.4 -9.4 0 -7.6 0 -6C0 -7.6 1.4 -9.4 3.6 -9.6C9 -10 10 -1 0 6Z";

function CrestHalf() {
  return (
    <Group>
      {COVERTS.map((f, k) => (
        <Feather key={k} {...f} />
      ))}
      {SPRIG.map((l, k) => {
        const root = polar(l.at * DEG, l.r);
        return (
          <Group
            key={k}
            transform={[
              { translateX: root.x },
              { translateY: root.y },
              { rotate: (l.at + l.turn) * DEG + Math.PI / 2 },
            ]}
          >
            <Path path={LEAF(l.len, l.w)}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, -l.len)}
                colors={GOLD}
              />
            </Path>
            <Path
              path={LEAF(l.len, l.w)}
              style="stroke"
              strokeWidth={1.1}
              color={INK}
            />
            <Path
              path={`M0 -1L0 ${-l.len * 0.8}`}
              style="stroke"
              strokeWidth={0.6}
              color="#7A5212"
            />
          </Group>
        );
      })}
    </Group>
  );
}

function CrestFront({ t }: { t: Clock }) {
  // lub-dub, every 1.4s
  const beat = useDerivedValue(() => {
    const p = (t.value % 1.4) / 1.4;
    if (p < 0.1) return Math.sin((p / 0.1) * Math.PI);
    if (p > 0.18 && p < 0.28)
      return 0.7 * Math.sin(((p - 0.18) / 0.1) * Math.PI);
    return 0;
  });
  const heart = useDerivedValue(() => [
    { translateY: 62 },
    { scale: 1.15 + beat.value * 0.14 },
  ]);
  const heartGlow = useDerivedValue(() => 0.35 + beat.value * 0.55);
  return (
    <Group>
      {/* the rope */}
      <Path path={ROPE} style="stroke" strokeWidth={8.4} color={INK} />
      <Path path={ROPE} style="stroke" strokeWidth={6.4}>
        <LinearGradient start={vec(-56, -56)} end={vec(56, 0)} colors={GOLD} />
      </Path>
      <Path path={TWISTS} style="stroke" strokeWidth={1.1} color={INK} />
      <Sweep t={t} d={ROPE} every={4.8} phase={0.6} />
      <CrestHalf />
      <Group transform={MIRROR}>
        <CrestHalf />
      </Group>
      {/* the ruby heart at the foot */}
      <Group transform={heart}>
        <Path path={HEART} color="#FF2A4A" opacity={heartGlow}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={HEART}>
          <LinearGradient
            start={vec(-6, -9)}
            end={vec(4, 6)}
            colors={["#FF8A9A", "#D0102E", "#6A0414"]}
          />
        </Path>
        <Path path={HEART} style="stroke" strokeWidth={1.6}>
          <LinearGradient start={vec(-9, -9)} end={vec(9, 6)} colors={GOLD} />
        </Path>
      </Group>
      <Sparks
        t={t}
        count={6}
        from={-Math.PI}
        to={0}
        r={62}
        rise={22}
        color="#FFE6A0"
        size={1.4}
        seed={33}
      />
      <Glint t={t} x={0} y={56} size={5} phase={0.3} speed={1} />
      <Glint t={t} x={-38} y={-44} size={4} phase={1.8} speed={1.1} />
      <Glint t={t} x={44} y={-38} size={4} phase={3.1} speed={0.9} />
    </Group>
  );
}

export const CREST_ART = {
  "winged-crest": {
    back: CrestBack,
    front: CrestFront,
  } satisfies ArtBorderDrawing,
};

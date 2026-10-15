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

import { FEATHER, LEAF, acanthus } from "@/components/engraved/shapes";

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

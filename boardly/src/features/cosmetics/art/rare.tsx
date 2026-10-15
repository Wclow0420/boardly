// Rare art borders: dice, cards, blossom, meeples.

import {
  Circle,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { MEEPLE_COLORS, MEEPLE_PATH } from "@/components/tabletop/Meeple";
import {
  Band,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

// ── Dice Orbit: dice circle the avatar, each tumbling as it goes ─────

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

function OrbitDie({ t, i, count }: { t: Clock; i: number; count: number }) {
  const s = 15;
  const transform = useDerivedValue(() => {
    const a = (i / count) * TAU + t.value * 0.35;
    const p = polar(a, 69);
    return [
      { translateX: p.x },
      { translateY: p.y },
      { rotate: t.value * (1.2 + (i % 3) * 0.3) + i },
    ];
  });
  const face = (i % 6) + 1;
  return (
    <Group transform={transform}>
      <RoundedRect
        x={-s / 2 + 1}
        y={-s / 2 + 2}
        width={s}
        height={s}
        r={3.5}
        color="#00000066"
      />
      <RoundedRect x={-s / 2} y={-s / 2} width={s} height={s} r={3.5}>
        <LinearGradient
          start={vec(-s / 2, -s / 2)}
          end={vec(s / 2, s / 2)}
          colors={["#FFFDF6", "#E8DCC4"]}
        />
      </RoundedRect>
      {PIPS[face].map(([px, py], k) => (
        <Circle
          key={k}
          cx={px * 4}
          cy={py * 4}
          r={1.5}
          color={face === 1 ? "#D0362A" : "#2A1C10"}
        />
      ))}
    </Group>
  );
}

const DiceOrbit: ArtBorderDrawing = {
  back: () => <Band r={55} width={7} colors={["#6B4A2E", "#3B2516"]} />,
  front: ({ t }) => (
    <Group>
      {Array.from({ length: 6 }, (_, i) => (
        <OrbitDie key={i} t={t} i={i} count={6} />
      ))}
    </Group>
  ),
};

// ── Card Fan: cards fanned behind, one turning over now and then ─────

function FanCard({ t, i, count }: { t: Clock; i: number; count: number }) {
  const w = 26;
  const h = 38;
  const angle = -Math.PI / 2 + (i - (count - 1) / 2) * 0.42;
  // the middle card turns over every few seconds
  const flips = i === Math.floor(count / 2);
  const flip = useDerivedValue(() => {
    if (!flips) return 1;
    const p = (t.value % 4.5) / 0.9;
    return p < 1 ? Math.cos(p * Math.PI) : 1;
  });
  const transform = useDerivedValue(() => [
    { rotate: angle + Math.PI / 2 + Math.sin(t.value * 0.9 + i) * 0.03 },
    { translateY: -60 },
    { scaleX: flip.value },
  ]);
  const showFace = useDerivedValue(() => (flips && flip.value < 0 ? 1 : 0));
  const showBack = useDerivedValue(() => 1 - showFace.value);
  const back = i % 2 ? ["#C2392B", "#7E1F17"] : ["#2E6FB8", "#183E6E"];
  return (
    <Group transform={transform}>
      <RoundedRect
        x={-w / 2 + 1.5}
        y={-h / 2 + 2}
        width={w}
        height={h}
        r={4}
        color="#00000055"
      />
      <Group opacity={showBack}>
        <RoundedRect x={-w / 2} y={-h / 2} width={w} height={h} r={4}>
          <LinearGradient
            start={vec(0, -h / 2)}
            end={vec(0, h / 2)}
            colors={back}
          />
        </RoundedRect>
        <RoundedRect
          x={-w / 2 + 3}
          y={-h / 2 + 3}
          width={w - 6}
          height={h - 6}
          r={2.5}
          style="stroke"
          strokeWidth={1.2}
          color="#FFFFFFAA"
        />
        <Path path="M0 -7L5 0L0 7L-5 0z" color="#FFFFFFCC" />
      </Group>
      <Group opacity={showFace}>
        <RoundedRect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          r={4}
          color="#FFFDF6"
        />
        <Path
          path="M0 -9C3 -5 8 -3 8 1C8 4 5 6 2 4L3 9H-3L-2 4C-5 6 -8 4 -8 1C-8 -3 -3 -5 0 -9z"
          color="#1E1A16"
        />
      </Group>
    </Group>
  );
}

const CardFan: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      {Array.from({ length: 5 }, (_, i) => (
        <FanCard key={i} t={t} i={i} count={5} />
      ))}
    </Group>
  ),
  front: () => <Band r={52} width={4} colors={["#F6D27A", "#B8862D"]} />,
};

// ── Sakura Branch: a blossom branch, petals drifting down ────────────

// The branch hugs the ring from the bottom right, round the bottom and
// up the left side, and bursts into a cluster on the picture's top-left
// edge (covering a little of it, on purpose).
const BRANCH =
  "M44 56C20 72 -20 74 -46 54C-70 34 -76 0 -66 -26C-60 -40 -52 -48 -40 -54";
const TWIG_A = "M-62 -12C-76 -16 -86 -26 -88 -40";
const TWIG_B = "M18 66C26 76 38 80 50 78";
const TWIG_C = "M-58 34C-72 40 -80 52 -82 64";
const BLOSSOMS: [number, number, number][] = [
  // the big cluster, top left
  [-40, -50, 13],
  [-58, -36, 11],
  [-24, -62, 10],
  [-52, -60, 8.5],
  [-34, -32, 7.5],
  [-70, -48, 7],
  // along the branch
  [-86, -40, 7],
  [-70, 2, 7.5],
  [-80, 62, 6.5],
  [-30, 70, 6],
  // a little cluster, bottom right
  [48, 60, 9],
  [36, 72, 7],
  [56, 74, 6],
];
const LEAVES: [number, number, number][] = [
  [-66, -18, -0.6],
  [-76, 20, 0.4],
  [-50, 54, 1.1],
  [8, 72, 1.6],
  [-14, -70, -1.2],
  [62, 52, 2.4],
];

function Blossom({ x, y, r }: { x: number; y: number; r: number }) {
  const petals = Array.from({ length: 5 }, (_, k) =>
    polar((k / 5) * TAU - Math.PI / 2, r * 0.55),
  );
  return (
    <Group>
      {petals.map((p, k) => (
        <Circle
          key={k}
          cx={x + p.x}
          cy={y + p.y}
          r={r * 0.55}
          color="#FFC4D6"
        />
      ))}
      {petals.map((p, k) => (
        <Circle
          key={`e${k}`}
          cx={x + p.x * 1.15}
          cy={y + p.y * 1.15}
          r={r * 0.22}
          color="#FFE3EC"
        />
      ))}
      <Circle cx={x} cy={y} r={r * 0.3} color="#E5527A" />
      <Circle cx={x} cy={y} r={r * 0.14} color="#FFD36E" />
    </Group>
  );
}

function Petal({ t, i }: { t: Clock; i: number }) {
  const life = 4 + rnd(i) * 3;
  const x0 = -60 + rnd(i + 1) * 130;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 7 + i) * 10 + p * 18 },
      { translateY: -88 + p * 176 },
      { rotate: p * 9 + i },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return Math.sin(p * Math.PI) * 0.9;
  });
  return (
    <Path
      path="M0 -3.4C2.6 -2 2.6 2 0 3.4C-2.6 2 -2.6 -2 0 -3.4z"
      color="#FFB3C8"
      transform={transform}
      opacity={opacity}
    />
  );
}

function SakuraFront({ t }: { t: Clock }) {
  const sway = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 0.9) * 0.012 },
  ]);
  return (
    <Group>
      <Group transform={sway}>
        <Path
          path={BRANCH}
          style="stroke"
          strokeWidth={7}
          strokeCap="round"
          color="#4A2E22"
        />
        {[TWIG_A, TWIG_B, TWIG_C].map((d) => (
          <Path
            key={d}
            path={d}
            style="stroke"
            strokeWidth={3.5}
            strokeCap="round"
            color="#4A2E22"
          />
        ))}
        {LEAVES.map(([x, y, a], i) => (
          <Path
            key={i}
            path="M0 0C3 -4 10 -4 14 0C10 4 3 4 0 0z"
            color="#7DBE6A"
            transform={[{ translateX: x }, { translateY: y }, { rotate: a }]}
          />
        ))}
        {BLOSSOMS.map(([x, y, r], i) => (
          <Blossom key={i} x={x} y={y} r={r} />
        ))}
      </Group>
      {Array.from({ length: 8 }, (_, i) => (
        <Petal key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

const Sakura: ArtBorderDrawing = {
  back: () => (
    <Band r={53} width={5} colors={["#FFD6E3", "#E78FAE"]} rim="#8C3B5833" />
  ),
  front: SakuraFront,
};

// ── Meeple Parade: meeples in every colour march round the ring ──────

function Marcher({ t, i, count }: { t: Clock; i: number; count: number }) {
  const transform = useDerivedValue(() => {
    const a = (i / count) * TAU - t.value * 0.28;
    const hop = Math.abs(Math.sin(t.value * 5 + i * 1.7)) * 3.5;
    const p = polar(a, 69 + hop);
    return [
      { translateX: p.x },
      { translateY: p.y },
      { rotate: a + Math.PI / 2 + Math.sin(t.value * 5 + i * 1.7) * 0.15 },
      { scale: 0.92 },
      { translateX: -12 },
      { translateY: -16 },
    ];
  });
  return (
    <Group transform={transform}>
      <Path
        path={MEEPLE_PATH}
        color="#00000055"
        transform={[{ translateX: 1 }, { translateY: 1.4 }]}
      />
      <Path
        path={MEEPLE_PATH}
        color={MEEPLE_COLORS[i % MEEPLE_COLORS.length]}
      />
      <Path
        path={MEEPLE_PATH}
        style="stroke"
        strokeWidth={0.9}
        color="#00000066"
      />
    </Group>
  );
}

const MeepleParade: ArtBorderDrawing = {
  back: () => <Band r={56} width={9} colors={["#9A6B43", "#5E3D24"]} />,
  front: ({ t }) => (
    <Group>
      {Array.from({ length: 8 }, (_, i) => (
        <Marcher key={i} t={t} i={i} count={8} />
      ))}
    </Group>
  ),
};

export const RARE_ART = {
  "dice-orbit": DiceOrbit,
  "card-fan": CardFan,
  sakura: Sakura,
  "meeple-parade": MeepleParade,
};

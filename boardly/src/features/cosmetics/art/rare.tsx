// Rare art borders: dice, cards, blossom, meeples, a campfire.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { Fire } from "@/components/iso";
import { MEEPLE_COLORS, MEEPLE_PATH } from "@/components/tabletop/Meeple";
import {
  Band,
  Halo,
  Sparks,
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

const BRANCH = "M-62 46C-82 18 -80 -24 -58 -52C-48 -64 -32 -72 -14 -76";
const TWIG_A = "M-74 4C-86 -2 -92 -10 -92 -18";
const TWIG_B = "M-50 -60C-46 -74 -36 -82 -24 -86";
const BLOSSOMS: [number, number, number][] = [
  [-70, 28, 7],
  [-80, -6, 8],
  [-90, -16, 5.5],
  [-70, -36, 7],
  [-48, -62, 6.5],
  [-26, -84, 6],
  [-14, -74, 7.5],
  [-60, 40, 5.5],
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

const Sakura: ArtBorderDrawing = {
  back: () => (
    <Band r={53} width={5} colors={["#FFD6E3", "#E78FAE"]} rim="#8C3B5833" />
  ),
  front: ({ t }) => (
    <Group>
      <Path
        path={BRANCH}
        style="stroke"
        strokeWidth={6}
        strokeCap="round"
        color="#4A2E22"
      />
      <Path
        path={TWIG_A}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color="#4A2E22"
      />
      <Path
        path={TWIG_B}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color="#4A2E22"
      />
      {BLOSSOMS.map(([x, y, r], i) => (
        <Blossom key={i} x={x} y={y} r={r} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <Petal key={i} t={t} i={i} />
      ))}
    </Group>
  ),
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

// ── Campfire: flames lick up round the ring, embers rise ─────────────

/** Flames round the ring, tallest at the foot. */
const FLAMES = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * TAU;
  // a = π/2 is the bottom of the ring
  const low = (1 + Math.sin(a)) / 2;
  return { a, h: 16 + low * 26, w: 13 + low * 8 };
});

function FirePlume({
  t,
  a,
  h,
  w,
}: {
  t: Clock;
  a: number;
  h: number;
  w: number;
}) {
  return (
    <Group transform={[{ rotate: a + Math.PI / 2 }]}>
      <Fire x={0} y={-50} width={w} height={h} clock={t} />
    </Group>
  );
}

function CampfireBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.55 + 0.15 * Math.sin(t.value * 7.3) * Math.sin(t.value * 3.1),
  );
  return (
    <Group>
      <Halo r={92} color="#FF7A1A" opacity={glow} />
      {FLAMES.map((f, i) => (
        <FirePlume key={i} t={t} {...f} />
      ))}
      <Sparks
        t={t}
        count={9}
        from={-Math.PI * 0.95}
        to={-Math.PI * 0.05}
        r={64}
        rise={30}
      />
    </Group>
  );
}

function CampfireFront({ t }: { t: Clock }) {
  const embers = useDerivedValue(() => 0.65 + 0.35 * Math.sin(t.value * 5.2));
  return (
    <Group>
      <Band r={53} width={6} colors={["#3A2216", "#1C0F08"]} rim="#00000099" />
      <Circle
        cx={0}
        cy={0}
        r={53}
        style="stroke"
        strokeWidth={1.6}
        color="#FF8A2A"
        opacity={embers}
      >
        <BlurMask blur={2} style="solid" />
      </Circle>
    </Group>
  );
}

const Campfire: ArtBorderDrawing = {
  back: CampfireBack,
  front: CampfireFront,
};

export const RARE_ART = {
  "dice-orbit": DiceOrbit,
  "card-fan": CardFan,
  sakura: Sakura,
  "meeple-parade": MeepleParade,
  campfire: Campfire,
};

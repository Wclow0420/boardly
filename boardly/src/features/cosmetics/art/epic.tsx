// Epic art borders: ice, a storm, haunted lanterns, a galaxy.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  Band,
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

// ── Glacier: ice crystals grow round the ring, snow falls ────────────

/** A shard pointing straight up from the ring, `len` long. */
const shard = (len: number, w: number) =>
  `M0 0L${w} -${len * 0.45}L0 -${len}L${-w} -${len * 0.45}z`;
const SHARDS = Array.from({ length: 18 }, (_, i) => ({
  a: (i / 18) * TAU + rnd(i) * 0.12,
  len: 14 + rnd(i + 5) * 22,
  w: 3.2 + rnd(i + 9) * 3,
}));

function Shard({
  t,
  a,
  len,
  w,
  i,
}: {
  t: Clock;
  a: number;
  len: number;
  w: number;
  i: number;
}) {
  const d = useMemo(() => shard(len, w), [len, w]);
  const transform = useDerivedValue(() => [
    { rotate: a + Math.PI / 2 },
    { translateY: -52 },
    { scaleY: 0.92 + 0.08 * Math.sin(t.value * 0.9 + i) },
  ]);
  return (
    <Group transform={transform}>
      <Path path={d}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, -len)}
          colors={["#4B8BFF", "#BFEFFF", "#FFFFFF"]}
        />
      </Path>
      <Path
        path={`M0 0L0 -${len}`}
        style="stroke"
        strokeWidth={0.8}
        color="#FFFFFFAA"
      />
    </Group>
  );
}

function Flake({ t, i }: { t: Clock; i: number }) {
  const life = 5 + rnd(i) * 3;
  const x0 = -80 + rnd(i + 1) * 160;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 5 + i) * 6 },
      { translateY: -90 + p * 180 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return Math.sin(p * Math.PI) * 0.95;
  });
  return (
    <Circle
      cx={0}
      cy={0}
      r={1.2 + rnd(i + 4) * 1.4}
      color="#FFFFFF"
      transform={transform}
      opacity={opacity}
    />
  );
}

function GlacierBack({ t }: { t: Clock }) {
  const shine = useDerivedValue(() => [{ rotate: t.value * 0.8 }]);
  return (
    <Group>
      <Halo r={88} color="#6FC8FF" opacity={0.45} />
      {SHARDS.map((s, i) => (
        <Shard key={i} t={t} i={i} {...s} />
      ))}
      {/* a cold light turning round the crystals */}
      <Circle cx={0} cy={0} r={80} blendMode="screen" opacity={0.55}>
        <SweepGradient
          c={vec(0, 0)}
          colors={["#FFFFFF00", "#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"]}
          transform={shine}
          origin={vec(0, 0)}
        />
      </Circle>
    </Group>
  );
}

const Glacier: ArtBorderDrawing = {
  back: GlacierBack,
  front: ({ t }) => (
    <Group>
      <Band
        r={53}
        width={6}
        colors={["#E8FBFF", "#6FC8FF", "#2E5FB8"]}
        rim="#1B3A7A88"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <Flake key={i} t={t} i={i} />
      ))}
    </Group>
  ),
};

// ── Thunderstorm: a cloud ring, lightning cracking round it ──────────

const PUFFS = Array.from({ length: 26 }, (_, i) => ({
  a: (i / 26) * TAU + rnd(i + 8) * 0.1,
  r: 62 + rnd(i) * 12,
  s: 8 + rnd(i + 3) * 7,
}));

/** A jagged bolt between two points on the ring, the same for one strike. */
function boltPath(seed: number) {
  const a0 = rnd(seed) * TAU;
  const a1 = a0 + 0.9 + rnd(seed + 1) * 0.9;
  const steps = 7;
  let d = "";
  for (let k = 0; k <= steps; k++) {
    const a = a0 + ((a1 - a0) * k) / steps;
    const r =
      66 + (k === 0 || k === steps ? 0 : (rnd(seed + k * 3) - 0.5) * 22);
    const p = polar(a, r);
    d += `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
}
const BOLTS = Array.from({ length: 6 }, (_, i) => boltPath(i * 17 + 3));

function Puff({
  t,
  a,
  r,
  s,
  i,
}: {
  t: Clock;
  a: number;
  r: number;
  s: number;
  i: number;
}) {
  const transform = useDerivedValue(() => {
    const p = polar(a + Math.sin(t.value * 0.3 + i) * 0.04, r);
    return [
      { translateX: p.x },
      { translateY: p.y },
      { scale: 1 + 0.06 * Math.sin(t.value * 0.7 + i) },
    ];
  });
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={s}>
        <RadialGradient
          c={vec(-s * 0.35, -s * 0.45)}
          r={s * 1.5}
          colors={["#A9B2C6", "#565E74", "#262B3B"]}
        />
        <BlurMask blur={1.6} style="solid" />
      </Circle>
    </Group>
  );
}

function Bolt({ t, k }: { t: Clock; k: number }) {
  // strikes every 2.6 s; each strike picks one of the bolts
  const opacity = useDerivedValue(() => {
    const n = Math.floor(t.value / 2.6);
    if (n % BOLTS.length !== k) return 0;
    const p = (t.value % 2.6) / 0.32;
    return p < 1 ? (p < 0.2 || p > 0.45 ? 1 - p * 0.6 : 0.2) : 0;
  });
  return (
    <Group opacity={opacity} blendMode="screen">
      <Path
        path={BOLTS[k]}
        style="stroke"
        strokeWidth={7}
        color="#7FB8FF"
        strokeJoin="round"
      >
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path
        path={BOLTS[k]}
        style="stroke"
        strokeWidth={2.2}
        color="#F2F8FF"
        strokeJoin="round"
      />
    </Group>
  );
}

function ThunderBack({ t }: { t: Clock }) {
  const flash = useDerivedValue(() => {
    const p = (t.value % 2.6) / 0.32;
    return p < 1 ? 0.6 * (1 - p) : 0;
  });
  return (
    <Group>
      <Halo r={90} color="#7FB8FF" opacity={flash} />
      {PUFFS.map((p, i) => (
        <Puff key={i} t={t} i={i} {...p} />
      ))}
    </Group>
  );
}

const Thunderstorm: ArtBorderDrawing = {
  back: ThunderBack,
  front: ({ t }) => (
    <Group>
      <Band r={53} width={5} colors={["#5A6378", "#232838"]} />
      {BOLTS.map((_, k) => (
        <Bolt key={k} t={t} k={k} />
      ))}
    </Group>
  ),
};

// ── Ghost Lantern: paper lanterns, little ghosts drifting by ────────

const GHOST = "M-7 6V-2A7 7 0 0 1 7 -2V6L4.5 4L2.3 6.5L0 4L-2.3 6.5L-4.5 4z";

function Lantern({ t, a, i }: { t: Clock; a: number; i: number }) {
  const p = polar(a, 70);
  const sway = useDerivedValue(() => [
    { translateX: p.x },
    { translateY: p.y },
    { rotate: Math.sin(t.value * 1.4 + i) * 0.12 },
  ]);
  const light = useDerivedValue(
    () =>
      0.75 + 0.25 * Math.sin(t.value * 9 + i * 2) * Math.sin(t.value * 3.3 + i),
  );
  return (
    <Group transform={sway}>
      <Path
        path="M0 -22V-12"
        style="stroke"
        strokeWidth={1.2}
        color="#2A1A10"
      />
      <Circle cx={0} cy={0} r={18} color="#FF8A3D" opacity={light}>
        <BlurMask blur={9} style="normal" />
      </Circle>
      <Oval x={-9} y={-12} width={18} height={22}>
        <LinearGradient
          start={vec(0, -12)}
          end={vec(0, 10)}
          colors={["#E8452C", "#A71F14"]}
        />
      </Oval>
      <Oval
        x={-5}
        y={-12}
        width={10}
        height={22}
        style="stroke"
        strokeWidth={0.8}
        color="#FFD08A88"
      />
      <Oval
        x={-6}
        y={-6}
        width={12}
        height={10}
        color="#FFD08A"
        opacity={light}
      />
      <Path
        path="M-5 -13H5M-4 11H4"
        style="stroke"
        strokeWidth={2.4}
        color="#2A1A10"
        strokeCap="round"
      />
    </Group>
  );
}

function Ghost({ t, i, count }: { t: Clock; i: number; count: number }) {
  const transform = useDerivedValue(() => {
    const a = (i / count) * TAU + t.value * 0.22;
    const p = polar(a, 72 + Math.sin(t.value * 2 + i) * 3);
    return [{ translateX: p.x }, { translateY: p.y }, { scale: 1.1 }];
  });
  const opacity = useDerivedValue(
    () => 0.55 + 0.35 * Math.sin(t.value * 1.3 + i * 2),
  );
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={GHOST} color="#E9ECFF">
        <BlurMask blur={1.5} style="solid" />
      </Path>
      <Circle cx={-2.4} cy={-1.5} r={1.1} color="#22243A" />
      <Circle cx={2.4} cy={-1.5} r={1.1} color="#22243A" />
    </Group>
  );
}

const GhostLantern: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={86} color="#6B4BC9" opacity={0.5} />
      {Array.from({ length: 3 }, (_, i) => (
        <Ghost key={i} t={t} i={i} count={3} />
      ))}
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Band r={53} width={6} colors={["#4A2F7A", "#1F1238"]} />
      {[-Math.PI * 0.78, -Math.PI / 2, -Math.PI * 0.22].map((a, i) => (
        <Lantern key={i} t={t} a={a} i={i} />
      ))}
    </Group>
  ),
};

// ── Galaxy: a turning nebula, stars, two small planets ───────────────

function Star({ t, i }: { t: Clock; i: number }) {
  const p = polar(rnd(i) * TAU, 58 + rnd(i + 1) * 32);
  const opacity = useDerivedValue(
    () => 0.3 + 0.7 * Math.max(0, Math.sin(t.value * (1 + rnd(i + 2) * 2) + i)),
  );
  return (
    <Circle
      cx={p.x}
      cy={p.y}
      r={0.6 + rnd(i + 3) * 1.1}
      color="#FFFFFF"
      opacity={opacity}
    />
  );
}

function Planet({
  t,
  r,
  speed,
  size,
  colors,
  ring,
  phase,
}: {
  t: Clock;
  r: number;
  speed: number;
  size: number;
  colors: string[];
  ring?: boolean;
  phase: number;
}) {
  const transform = useDerivedValue(() => {
    const p = polar(t.value * speed + phase, r);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={size}>
        <RadialGradient
          c={vec(-size * 0.35, -size * 0.35)}
          r={size * 1.6}
          colors={colors}
        />
      </Circle>
      {ring ? (
        <Oval
          x={-size * 1.8}
          y={-size * 0.45}
          width={size * 3.6}
          height={size * 0.9}
          style="stroke"
          strokeWidth={1.2}
          color="#F6D9A8"
        />
      ) : null}
    </Group>
  );
}

function GalaxyBack({ t }: { t: Clock }) {
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.18 }]);
  const turnBack = useDerivedValue(() => [{ rotate: -t.value * 0.11 }]);
  return (
    <Group>
      <Group transform={turn} origin={vec(0, 0)}>
        <Circle
          cx={0}
          cy={0}
          r={74}
          style="stroke"
          strokeWidth={30}
          opacity={0.85}
        >
          <SweepGradient
            c={vec(0, 0)}
            colors={[
              "#2B1B6B",
              "#7B3FD1",
              "#E05FB8",
              "#3B7BEA",
              "#1B1450",
              "#9B4FE0",
              "#2B1B6B",
            ]}
          />
          <BlurMask blur={9} style="normal" />
        </Circle>
      </Group>
      <Group transform={turnBack} origin={vec(0, 0)} blendMode="screen">
        <Circle
          cx={0}
          cy={0}
          r={66}
          style="stroke"
          strokeWidth={10}
          opacity={0.5}
        >
          <SweepGradient
            c={vec(0, 0)}
            colors={[
              "#00000000",
              "#B8E1FF",
              "#00000000",
              "#FFC2F0",
              "#00000000",
            ]}
          />
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Group>
      {Array.from({ length: 26 }, (_, i) => (
        <Star key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

const Galaxy: ArtBorderDrawing = {
  back: GalaxyBack,
  front: ({ t }) => (
    <Group>
      <Band r={52.5} width={4} colors={["#C7B8FF", "#5B3FA8"]} />
      <Planet
        t={t}
        r={80}
        speed={0.35}
        size={6}
        colors={["#FFE3A8", "#E08A3A", "#7A3A12"]}
        ring
        phase={0}
      />
      <Planet
        t={t}
        r={68}
        speed={-0.55}
        size={4}
        colors={["#B8F0FF", "#3B8BD9", "#163A6E"]}
        phase={2.2}
      />
      <Glint t={t} x={-62} y={-48} size={5} phase={0.5} />
      <Glint t={t} x={58} y={52} size={4} phase={2.4} />
    </Group>
  ),
};

export const EPIC_ART = {
  glacier: Glacier,
  thunderstorm: Thunderstorm,
  "ghost-lantern": GhostLantern,
  galaxy: Galaxy,
};

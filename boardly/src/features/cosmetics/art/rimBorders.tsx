// Rim borders: the effect itself is the ring, licking in over the
// picture's edge on the front layer, with its aura behind (rimfx.tsx).

import { BlurMask, Circle, Group, Path } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import {
  AURA_CLOUD,
  AURA_FLAME,
  AURORA,
  AURORA_RIM,
  BLACK_HOLE_DISC,
  BLACK_HOLE_RIM,
  Fx,
  GOLD_RIM,
  LAVA_RIM,
  PLASMA_RIM,
  PRISM_GLOW,
  PRISM_RIM,
  RAYS,
  RIM_GLOW,
  TIDE_RIM,
  aura,
  rim,
} from "./rimfx";

/** A beat every `every` seconds: rises fast, fades. */
function usePulse(t: Clock, every: number, length = 0.4) {
  return useDerivedValue(() => {
    const p = (t.value % every) / length;
    return p < 1 ? 1 - p : 0;
  });
}

// ── Black Hole ──────────────────────────────────────────────────────

/** A speck of light spiralling in to the horizon. */
function Infall({ t, i }: { t: Clock; i: number }) {
  const life = 2.2 + rnd(i) * 1.6;
  const a0 = rnd(i + 3) * TAU;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 5) * life) % life) / life;
    const p2 = p * p;
    const at = polar(a0 + p2 * 3.2, 90 - p2 * 32);
    return [{ translateX: at.x }, { translateY: at.y }];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 5) * life) % life) / life;
    return Math.sin(p * Math.PI);
  });
  return (
    <Group transform={transform} opacity={opacity} blendMode="screen">
      <Circle cx={0} cy={0} r={1.6} color="#FFE2B8" />
    </Group>
  );
}

const BlackHole: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={94} color="#7A3FD1" opacity={0.45} />
      <Fx sksl={BLACK_HOLE_DISC} t={t} />
      {Array.from({ length: 10 }, (_, i) => (
        <Infall key={i} t={t} i={i} />
      ))}
    </Group>
  ),
  front: ({ t }) => <Fx sksl={BLACK_HOLE_RIM} t={t} extent={68} />,
};

// ── Molten Lava ─────────────────────────────────────────────────────

const LAVA_AURA = aura("#5A0A02", "#C22A06", "#FF9A2A", 0.5, 0.55);

function LavaBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.5 + 0.15 * Math.sin(t.value * 2.3));
  return (
    <Group>
      <Halo r={94} color="#FF4A0A" opacity={glow} />
      <Fx sksl={AURA_FLAME} t={t} values={LAVA_AURA} />
    </Group>
  );
}

const MoltenLava: ArtBorderDrawing = {
  back: LavaBack,
  front: ({ t }) => (
    <Group>
      <Fx sksl={LAVA_RIM} t={t} extent={70} />
      <Sparks
        t={t}
        count={9}
        from={-Math.PI}
        to={0}
        r={58}
        rise={28}
        color="#FF8A2A"
        seed={31}
      />
    </Group>
  ),
};

// ── Shadow Flame ────────────────────────────────────────────────────

const SHADOW_AURA = aura("#14001F", "#5A16A8", "#E8C2FF", 1.1, 1);
const SHADOW_RIM = rim("#1A0030", "#7A2BE0", "#F2DCFF", 1.4, 11);

const ShadowFlame: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={94} color="#7A2BE0" opacity={0.45} />
      <Fx sksl={AURA_FLAME} t={t} values={SHADOW_AURA} />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={SHADOW_RIM} extent={70} />
      <Sparks
        t={t}
        count={7}
        from={-Math.PI}
        to={0}
        r={58}
        rise={30}
        color="#B98CFF"
        size={2.2}
        seed={41}
      />
    </Group>
  ),
};

// ── Aurora ──────────────────────────────────────────────────────────

const Aurora: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={92} color="#2FE3A8" opacity={0.3} />
      <Fx sksl={AURORA} t={t} />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Fx sksl={AURORA_RIM} t={t} extent={68} />
      <Glint t={t} x={-52} y={-56} size={4} phase={0.6} />
      <Glint t={t} x={58} y={44} size={3.5} phase={2.4} />
    </Group>
  ),
};

// ── Tidal Wave ──────────────────────────────────────────────────────

const TidalWave: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={92} color="#3FA8FF" opacity={0.4} />
      <Sparks
        t={t}
        count={10}
        from={-Math.PI}
        to={0}
        r={64}
        rise={24}
        color="#BFE8FF"
        size={1.8}
        seed={51}
      />
    </Group>
  ),
  front: ({ t }) => <Fx sksl={TIDE_RIM} t={t} extent={74} />,
};

// ── Plasma Core ─────────────────────────────────────────────────────

/** Short arcs leaping off the rim, magenta and cyan. */
const ARCS = Array.from({ length: 6 }, (_, i) => {
  const a = rnd(i + 70) * TAU;
  let d = "";
  for (let k = 0; k <= 5; k++) {
    const p = polar(a + (rnd(i * 9 + k) - 0.5) * 0.18, 50 + k * 6);
    d += `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
});

function PlasmaArc({ t, k }: { t: Clock; k: number }) {
  const opacity = useDerivedValue(() => {
    const p = ((t.value + k * 0.41) % 1.1) / 0.14;
    return p < 1 ? 1 - p : 0;
  });
  const color = k % 2 ? "#5FF2FF" : "#FF5FD8";
  return (
    <Group opacity={opacity} blendMode="screen">
      <Path
        path={ARCS[k]}
        style="stroke"
        strokeWidth={4.5}
        color={color}
        strokeJoin="round"
      >
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path
        path={ARCS[k]}
        style="stroke"
        strokeWidth={1.3}
        color="#FFFFFF"
        strokeJoin="round"
      />
    </Group>
  );
}

function PlasmaBack({ t }: { t: Clock }) {
  const pink = useDerivedValue(() => 0.35 + 0.2 * Math.sin(t.value * 3));
  const cyan = useDerivedValue(() => 0.35 - 0.2 * Math.sin(t.value * 3));
  return (
    <Group>
      <Halo r={92} color="#FF3FC8" opacity={pink} />
      <Halo r={86} color="#3FE8FF" opacity={cyan} />
    </Group>
  );
}

function PlasmaFront({ t }: { t: Clock }) {
  const surge = usePulse(t, 1.9, 0.5);
  return (
    <Group>
      <Fx sksl={PLASMA_RIM} t={t} flash={surge} extent={72} />
      {ARCS.map((_, k) => (
        <PlasmaArc key={k} t={t} k={k} />
      ))}
    </Group>
  );
}

const PlasmaCore: ArtBorderDrawing = { back: PlasmaBack, front: PlasmaFront };

// ── Toxic ───────────────────────────────────────────────────────────

const TOXIC_RIM = rim("#0E3A06", "#4FC21A", "#D6FF7A", 0.6, 9, 7);

/** A drop of slime running down over the picture's lower edge. */
function Drip({ t, a, i }: { t: Clock; a: number; i: number }) {
  const at = polar(a, 52);
  const every = 2.4 + rnd(i) * 1.6;
  const d = useMemo(() => "M-2.6 0C-2.6 6 -1.5 9 0 12C1.5 9 2.6 6 2.6 0z", []);
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * every) % every) / every;
    return [
      { translateX: at.x },
      { translateY: at.y },
      { scaleY: 0.2 + p * 1.3 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * every) % every) / every;
    return p < 0.85 ? 1 : (1 - p) / 0.15;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={d} color="#4FC21A" />
      <Path
        path="M-1 2C-1 5 -0.5 7 0 8"
        style="stroke"
        strokeWidth={0.9}
        color="#D6FF7A"
      />
    </Group>
  );
}

const Toxic: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={92} color="#7AE82A" opacity={0.35} />
      <Sparks
        t={t}
        count={8}
        from={-Math.PI}
        to={0}
        r={60}
        rise={22}
        color="#C8FF6A"
        size={2}
        seed={61}
      />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={TOXIC_RIM} extent={72} />
      {[0.32, 0.45, 0.58, 0.7].map((f, i) => (
        <Drip key={i} t={t} a={Math.PI * f} i={i} />
      ))}
    </Group>
  ),
};

// ── Divine Light ────────────────────────────────────────────────────

const DivineLight: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={94} color="#FFE08A" opacity={0.45} />
      <Fx sksl={RAYS} t={t} />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Fx sksl={GOLD_RIM} t={t} extent={68} />
      <Sparks
        t={t}
        count={8}
        from={-Math.PI}
        to={0}
        r={58}
        rise={26}
        color="#FFF0B0"
        size={1.6}
        seed={71}
      />
      <Glint t={t} x={-46} y={-58} size={5} phase={0.3} />
      <Glint t={t} x={54} y={-40} size={4} phase={2} />
      <Glint t={t} x={20} y={66} size={3.5} phase={3.6} />
    </Group>
  ),
};

// ── Prism ───────────────────────────────────────────────────────────

const Prism: ArtBorderDrawing = {
  back: ({ t }) => <Fx sksl={PRISM_GLOW} t={t} />,
  front: ({ t }) => (
    <Group>
      <Fx sksl={PRISM_RIM} t={t} extent={68} />
      <Glint t={t} x={-50} y={-50} size={5} phase={0.2} />
      <Glint t={t} x={56} y={30} size={4} phase={1.9} />
      <Glint t={t} x={-20} y={64} size={3.5} phase={3.3} />
    </Group>
  ),
};

// ── Blood Moon ──────────────────────────────────────────────────────

const BLOOD_AURA = aura("#120003", "#5A0610", "#E8283A", 0.7, 1);
const BLOOD_RIM = rim("#2A0006", "#B0101E", "#FF7A6A", 0.7, 10);

const BloodMoon: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={94} color="#C2101E" opacity={0.45} />
      <Fx sksl={AURA_CLOUD} t={t} values={BLOOD_AURA} />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={BLOOD_RIM} extent={70} />
      <Sparks
        t={t}
        count={6}
        from={-Math.PI}
        to={0}
        r={58}
        rise={24}
        color="#FF5A4A"
        size={1.6}
        seed={81}
      />
    </Group>
  ),
};

export const RIM_ART = {
  "black-hole": BlackHole,
  "molten-lava": MoltenLava,
  "shadow-flame": ShadowFlame,
  aurora: Aurora,
  "tidal-wave": TidalWave,
  "plasma-core": PlasmaCore,
  toxic: Toxic,
  "divine-light": DivineLight,
  prism: Prism,
  "blood-moon": BloodMoon,
};

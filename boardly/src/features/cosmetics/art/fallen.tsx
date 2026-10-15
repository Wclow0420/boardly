// Fallen Angel: the seraph's ring gone dark — black iron studded with
// embers, a blood-red gem at its foot — between two black wings that
// hang down from the shoulders, ragged and red-edged. A cracked halo
// slips crooked above, flickering; black feathers drift down in smoke.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { AURA_CLOUD, Fx, aura } from "./rimfx";
import { FEATHER, RING } from "./seraph";

/** Rows of feathers fanned from the shoulder, longest underneath. A
 *  feather's turn is from straight up: ~1.3 is out over the shoulder,
 *  π is straight down. The longest hang down and out. */
const ROWS = [
  {
    count: 13,
    from: 1.6,
    to: 3.1,
    len: (f: number) => 30 + Math.sin(f * Math.PI * 0.6) * 52,
    w: 8.5,
    at: 0,
    colors: ["#07050A", "#221828", "#6A1E32"],
  },
  {
    count: 10,
    from: 1.5,
    to: 2.95,
    len: (f: number) => 26 + Math.sin(f * Math.PI * 0.7) * 14,
    w: 8.5,
    at: 3,
    colors: ["#0A080E", "#2E2234", "#5A2A40"],
  },
  {
    count: 8,
    from: 1.6,
    to: 2.7,
    len: () => 18,
    w: 8,
    at: 6,
    colors: ["#100C14", "#3A2C40"],
  },
];

function Wing({ t, side }: { t: Clock; side: 1 | -1 }) {
  // the wing hangs heavy and sways a little, hinged at the shoulder
  const droop = useDerivedValue(() => [
    { translateX: side * 55 },
    { translateY: -34 },
    { rotate: side * (Math.sin(t.value * 0.9) * 0.04 + 0.02) },
    { scale: 0.78 },
  ]);
  return (
    <Group transform={droop}>
      {ROWS.map((row, r) =>
        Array.from({ length: row.count }, (_, k) => {
          const f = k / (row.count - 1);
          const rot = side * (row.from + (row.to - row.from) * f);
          // ragged: no two the same length
          const len = row.len(f) * (0.84 + 0.28 * rnd(r * 17 + k * 5 + 3));
          return (
            <Group
              key={`${r}-${k}`}
              transform={[{ rotate: rot }, { translateY: -row.at }]}
            >
              <Path path={FEATHER(len, row.w)}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, -len)}
                  colors={row.colors}
                />
              </Path>
              <Path
                path={FEATHER(len, row.w)}
                style="stroke"
                strokeWidth={0.9}
                color="#B02236"
                opacity={0.75}
              />
              <Path
                path={`M0 0L0 ${-len * 0.85}`}
                style="stroke"
                strokeWidth={0.6}
                color="#4A1A26"
              />
            </Group>
          );
        }),
      )}
    </Group>
  );
}

/** A black feather drifting down past the wing, turning as it falls. */
function Falling({ t, i }: { t: Clock; i: number }) {
  const life = 4.5 + rnd(i * 3 + 1) * 2.5;
  const side = i % 2 === 0 ? 1 : -1;
  const x0 = side * (58 + rnd(i * 3 + 2) * 24);
  const start = rnd(i * 3 + 3) * life;
  const transform = useDerivedValue(() => {
    const p = ((t.value + start) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 6 + i) * 7 },
      { translateY: -30 + p * 115 },
      { rotate: Math.sin(p * 5 + i) * 0.9 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + start) % life) / life;
    return Math.sin(p * Math.PI) * 0.9;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={FEATHER(10, 2.8)} color="#4A3450" />
      <Path
        path={FEATHER(10, 2.8)}
        style="stroke"
        strokeWidth={0.6}
        color="#B0283A"
      />
    </Group>
  );
}

const SMOKE = aura("#06030A", "#3A0C22", "#B02236", 0.45, 1);

function FallenBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Halo r={94} color="#8A1022" opacity={0.5} />
      <Fx sksl={AURA_CLOUD} t={t} values={SMOKE} />
      <Wing t={t} side={-1} />
      <Wing t={t} side={1} />
      {Array.from({ length: 6 }, (_, i) => (
        <Falling key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

const IRON = ["#8A7A8E", "#3A3040", "#1A141E", "#5A4A5E"];

/** The halo, cracked in two places, as an ellipse 26 × 6. */
const HALO =
  "M-26 0A26 6 0 0 1 4 -5.93M12 -5.32A26 6 0 0 1 26 0A26 6 0 0 1 -6 5.84";

function FallenFront({ t }: { t: Clock }) {
  const studs = Array.from({ length: 24 }, (_, k) =>
    polar((k / 24) * TAU, 57.5),
  );
  const ember = useDerivedValue(() => 0.55 + 0.45 * Math.sin(t.value * 2.6));
  // the halo stutters like a dying light, never quite out
  const flicker = useDerivedValue(() =>
    Math.sin(t.value * 17) * Math.sin(t.value * 5.3) > 0.7 ? 0.25 : 0.9,
  );
  // slipped crooked, rocking a little
  const slip = useDerivedValue(() => [
    { translateY: -79 },
    { rotate: -0.24 + Math.sin(t.value * 0.9) * 0.04 },
  ]);
  return (
    <Group>
      {/* the iron ring: a dark channel studded with embers */}
      <Path path={RING} fillType="evenOdd">
        <LinearGradient start={vec(-50, -63)} end={vec(50, 63)} colors={IRON} />
      </Path>
      <Circle
        cx={0}
        cy={0}
        r={63}
        style="stroke"
        strokeWidth={1.4}
        color="#08060A"
      />
      <Circle
        cx={0}
        cy={0}
        r={51}
        style="stroke"
        strokeWidth={1.4}
        color="#08060A"
      />
      <Circle
        cx={0}
        cy={0}
        r={57.5}
        style="stroke"
        strokeWidth={5}
        color="#22070F"
      />
      <Group opacity={ember}>
        {studs.map((p, k) => (
          <Circle key={k} cx={p.x} cy={p.y} r={1.4} color="#E8283A" />
        ))}
      </Group>
      <Sweep t={t} d={RING} every={5.5} />

      {/* the cracked halo */}
      <Group transform={slip} opacity={flicker}>
        <Path
          path={HALO}
          style="stroke"
          strokeWidth={9}
          strokeCap="round"
          color="#FF3A4A"
          opacity={0.7}
        >
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={HALO} style="stroke" strokeWidth={3.6} strokeCap="round">
          <LinearGradient
            start={vec(-26, 0)}
            end={vec(26, 0)}
            colors={["#8A7A8E", "#F2E2E6", "#8A7A8E"]}
          />
        </Path>
      </Group>

      {/* the blood-red gem at the foot, in a dark setting */}
      <Path path="M0 78L12 63L0 50L-12 63z">
        <LinearGradient
          start={vec(0, 50)}
          end={vec(0, 78)}
          colors={["#8A7A8E", "#2A2030", "#0E0A12"]}
        />
      </Path>
      <Path
        path="M0 78L12 63L0 50L-12 63z"
        style="stroke"
        strokeWidth={1.2}
        color="#08060A"
      />
      <Circle cx={0} cy={63} r={10} color="#FF2A3A" opacity={ember}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={63}
        w={9}
        h={12}
        colors={["#FF9A9A", "#C2101E", "#4A0408"]}
      />
      <Glint t={t} x={0} y={63} size={5} phase={1.2} speed={0.8} />
    </Group>
  );
}

export const FALLEN_ART = {
  "fallen-angel": {
    back: FallenBack,
    front: FallenFront,
  } satisfies ArtBorderDrawing,
};

// Frame borders: one drawing the avatar sits inside — between angel
// wings, in the heart of a sun. They take room and may cover the
// avatar's edge a little; that's the point.

import {
  BlurMask,
  Group,
  LinearGradient,
  Oval,
  Path,
  Rect,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import { FireRim } from "./rims";
import { Fx, GOLD_RIM } from "./rimfx";
import {
  Glint,
  Halo,
  Sparks,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

// ── Sun Blaze: one ring of fire, burning outward like the sun ───────

const SUN_FIRE = `
uniform float t;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 49.0) / 40.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = xy / r;
  // the flames' pattern streams outward, seamless all the way round
  float s = h * 2.4 - t * 1.5;
  float n = fbm(dir * 2.6 + vec2(s, s * 0.7));
  float tip = 0.42 + 0.58 * fbm(dir * 3.4 + vec2(t * 0.35, -t * 0.2));
  float heat = (1.0 - h / tip) * (0.55 + n * 0.9);
  heat = max(heat, (1.0 - smoothstep(0.0, 0.16, h)) * 0.9);
  vec3 color = mix(vec3(0.95, 0.18, 0.02), vec3(1.0, 0.62, 0.12), smoothstep(0.15, 0.5, heat));
  color = mix(color, vec3(1.0, 0.95, 0.72), smoothstep(0.55, 0.95, heat));
  float a = smoothstep(0.04, 0.32, heat);
  return half4(color * a, a);
}`;

function SunFire({ t }: { t: Clock }) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(SUN_FIRE), []);
  const uniforms = useDerivedValue(() => ({ t: t.value }));
  if (!source) return null;
  return (
    <Rect x={-92} y={-92} width={184} height={184}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

function SunBlazeBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(
    () => 0.6 + 0.15 * Math.sin(t.value * 6.1) * Math.sin(t.value * 2.3),
  );
  return (
    <Group>
      <Halo r={94} color="#FF6A1A" opacity={glow} />
      <SunFire t={t} />
    </Group>
  );
}

/** The fire is the ring: it licks in over the picture's rim, embers
 *  leaving it. */
function SunBlazeFront({ t }: { t: Clock }) {
  return (
    <Group>
      <FireRim t={t} />
      <Sparks
        t={t}
        count={8}
        from={-Math.PI}
        to={0}
        r={54}
        rise={30}
        size={1.6}
        seed={21}
      />
    </Group>
  );
}

const SunBlaze: ArtBorderDrawing = { back: SunBlazeBack, front: SunBlazeFront };

// ── Angel Wings: great feathered wings, a halo above ─────────────────

const FEATHER = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.2} ${w * 0.9} ${-len * 0.8} 0 ${-len}C${-w * 0.9} ${-len * 0.8} ${-w} ${-len * 0.2} 0 0z`;

/** Rows of feathers, longest underneath: from straight up, out over
 *  the shoulder and down. The long ones rise highest at the wing's tip. */
const ROWS = [
  {
    count: 10,
    from: 0.1,
    to: 1.95,
    len: (k: number) => 54 + Math.sin((k / 9) * Math.PI * 0.9) * 22 - k * 1.5,
    w: 11,
    at: 0,
    colors: ["#AEB8E0", "#E6EAFB", "#FFFFFF"],
  },
  {
    count: 8,
    from: 0.25,
    to: 1.8,
    len: (k: number) => 40 + Math.sin((k / 7) * Math.PI) * 6,
    w: 11,
    at: 3,
    colors: ["#C3CBEC", "#F2F4FF", "#FFFFFF"],
  },
  {
    count: 6,
    from: 0.45,
    to: 1.55,
    len: () => 24,
    w: 11,
    at: 6,
    colors: ["#D6DCF4", "#FFFFFF"],
  },
];

function Wing({ t, side }: { t: Clock; side: 1 | -1 }) {
  const flap = useDerivedValue(() => [
    { translateX: side * 42 },
    { translateY: -14 },
    { rotate: side * (Math.sin(t.value * 1.8) * 0.09 - 0.05) },
    { scale: 0.84 },
  ]);
  return (
    <Group transform={flap}>
      {ROWS.map((row, r) =>
        Array.from({ length: row.count }, (_, k) => {
          const rot =
            side * (row.from + ((row.to - row.from) * k) / (row.count - 1));
          const len = row.len(k);
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
                strokeWidth={0.8}
                color="#B8A46A"
                opacity={0.7}
              />
              <Path
                path={`M0 0L0 ${-len * 0.85}`}
                style="stroke"
                strokeWidth={0.6}
                color="#B8C2E0"
              />
            </Group>
          );
        }),
      )}
    </Group>
  );
}

function AngelBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.45 + 0.15 * Math.sin(t.value * 1.4));
  return (
    <Group>
      <Halo r={94} color="#FFF1C2" opacity={glow} />
      <Wing t={t} side={-1} />
      <Wing t={t} side={1} />
    </Group>
  );
}

function AngelFront({ t }: { t: Clock }) {
  const bob = useDerivedValue(() => [
    { translateY: -78 + Math.sin(t.value * 1.6) * 2 },
  ]);
  return (
    <Group>
      <Fx sksl={GOLD_RIM} t={t} extent={68} />
      <Group transform={bob}>
        <Oval
          x={-28}
          y={-6}
          width={56}
          height={12}
          style="stroke"
          strokeWidth={7}
          color="#FFE9A0"
          opacity={0.6}
        >
          <BlurMask blur={5} style="normal" />
        </Oval>
        <Oval
          x={-28}
          y={-6}
          width={56}
          height={12}
          style="stroke"
          strokeWidth={3.5}
        >
          <LinearGradient
            start={vec(-28, 0)}
            end={vec(28, 0)}
            colors={["#E0A82E", "#FFF6D0", "#E0A82E"]}
          />
        </Oval>
      </Group>
      <Sparks
        t={t}
        count={6}
        from={-Math.PI}
        to={0}
        r={62}
        rise={22}
        color="#FFF4C2"
        seed={12}
      />
      <Glint t={t} x={-48} y={-66} size={5} phase={0.4} />
      <Glint t={t} x={50} y={-62} size={4} phase={2.2} />
    </Group>
  );
}

const AngelWings: ArtBorderDrawing = { back: AngelBack, front: AngelFront };

export const FRAME_ART = {
  campfire: SunBlaze,
  "angel-wings": AngelWings,
};

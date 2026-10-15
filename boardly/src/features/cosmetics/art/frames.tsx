// Frame borders: the border is one drawing the avatar sits inside — the
// lion's open mouth, the dragon's jaws, between angel wings, in the
// heart of a sun. They take room and may cover the avatar's edge a
// little; that's the point.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { Steam } from "@/components/iso";
import { NOISE } from "@/components/iso/noise";
import {
  Band,
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

/** Eyes shut for a moment every `every` seconds. */
function useBlink(t: Clock, every: number, phase = 0) {
  return useDerivedValue(() => {
    const p = ((t.value + phase) % every) / 0.18;
    return [
      { scaleY: p < 1 ? Math.abs(Math.cos(p * Math.PI)) * 0.9 + 0.1 : 1 },
    ];
  });
}

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

const SunBlaze: ArtBorderDrawing = {
  back: SunBlazeBack,
  front: () => (
    <Band
      r={52.5}
      width={5}
      colors={["#FFE08A", "#F28A1F", "#9E2A0A"]}
      rim="#5A1404"
    />
  ),
};

// ── Lion Dance: the whole border is the lion's head; you are its mouth ─

/** The head swings a little; both layers swing together. */
function useShake(t: Clock) {
  return useDerivedValue(() => [
    {
      rotate: Math.sin(t.value * 2.4) * 0.05 + Math.sin(t.value * 5.1) * 0.015,
    },
  ]);
}

const MANE = Array.from({ length: 22 }, (_, k) => {
  const a = (k / 22) * TAU;
  return { ...polar(a, 80), k };
});

function LionBack({ t }: { t: Clock }) {
  const shake = useShake(t);
  const ruffle = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 6) * 0.03 },
  ]);
  return (
    <Group transform={shake}>
      <Halo r={94} color="#FF3B2A" opacity={0.45} />
      {/* the mane: tufts all round, red, white and gold */}
      <Group transform={ruffle}>
        {MANE.map((m) => (
          <Circle
            key={m.k}
            cx={m.x}
            cy={m.y}
            r={15}
            color={["#FF6F61", "#FFF2E8", "#F6C64A"][m.k % 3]}
          />
        ))}
      </Group>
      {/* the head itself, taller above the mouth than below */}
      <Oval x={-78} y={-90} width={156} height={170}>
        <LinearGradient
          start={vec(0, -90)}
          end={vec(0, 80)}
          colors={["#F2453A", "#C8231B", "#9C1410"]}
        />
      </Oval>
      <Oval
        x={-78}
        y={-90}
        width={156}
        height={170}
        style="stroke"
        strokeWidth={3}
        color="#F6C64A"
      />
      {/* cheeks */}
      <Circle cx={-58} cy={12} r={13} color="#FF8A7A" opacity={0.7} />
      <Circle cx={58} cy={12} r={13} color="#FF8A7A" opacity={0.7} />
    </Group>
  );
}

function LionFront({ t }: { t: Clock }) {
  const shake = useShake(t);
  const jaw = useDerivedValue(() => [
    { translateY: Math.max(0, Math.sin(t.value * 2.4)) * 4 },
  ]);
  const blink = useBlink(t, 3.4);
  const upperTeeth = useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => {
        const a = -Math.PI * (0.84 - k * 0.085);
        const p0 = polar(a - 0.06, 51);
        const p1 = polar(a, 43);
        const p2 = polar(a + 0.06, 51);
        return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}z`;
      }).join(""),
    [],
  );
  const lowerTeeth = useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => {
        const a = Math.PI * (0.25 + k * 0.083);
        const p0 = polar(a - 0.07, 51);
        const p1 = polar(a, 44);
        const p2 = polar(a + 0.07, 51);
        return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}z`;
      }).join(""),
    [],
  );
  return (
    <Group transform={shake}>
      {/* the lips round the mouth */}
      <Circle
        cx={0}
        cy={0}
        r={54}
        style="stroke"
        strokeWidth={8}
        color="#7A0E0B"
      />
      <Circle
        cx={0}
        cy={0}
        r={58}
        style="stroke"
        strokeWidth={2}
        color="#F6C64A"
      />
      <Path path={upperTeeth} color="#FFFDF4" />
      {/* brows: thick white fur */}
      <Path
        path="M-56 -74Q-36 -94 -12 -80M56 -74Q36 -94 12 -80"
        style="stroke"
        strokeWidth={9}
        strokeCap="round"
        color="#FFF2E8"
      />
      {/* the mirror on its forehead */}
      <Circle cx={0} cy={-80} r={7} color="#DDE6F2" />
      <Circle
        cx={0}
        cy={-80}
        r={7}
        style="stroke"
        strokeWidth={2}
        color="#F6C64A"
      />
      <Circle cx={-2} cy={-82} r={2} color="#FFFFFF" />
      {/* eyes */}
      {[-32, 32].map((x) => (
        <Group key={x} transform={[{ translateX: x }, { translateY: -64 }]}>
          <Oval x={-13} y={-9} width={26} height={18} color="#F6C64A" />
          <Group transform={blink}>
            <Oval x={-11} y={-7.5} width={22} height={15} color="#FFFFFF" />
            <Circle cx={x < 0 ? 2 : -2} cy={0.5} r={5.2} color="#111" />
            <Circle cx={x < 0 ? 0.5 : -3.5} cy={-1.5} r={1.8} color="#FFFFFF" />
          </Group>
        </Group>
      ))}
      {/* the big gold nose, over the top of the mouth */}
      <Path path="M-18 -60C-18 -48 -8 -44 0 -48C8 -44 18 -48 18 -60C14 -66 -14 -66 -18 -60z">
        <LinearGradient
          start={vec(0, -66)}
          end={vec(0, -44)}
          colors={["#FFE08A", "#D9961E"]}
        />
      </Path>
      <Circle cx={-7} cy={-53} r={2.6} color="#7A4E1C" />
      <Circle cx={7} cy={-53} r={2.6} color="#7A4E1C" />
      {/* the lower jaw opens and shuts */}
      <Group transform={jaw}>
        <Path path={lowerTeeth} color="#FFFDF4" />
        <Path
          path="M-46 66Q0 96 46 66"
          style="stroke"
          strokeWidth={10}
          strokeCap="round"
          color="#FFF2E8"
        />
        {[-30, -15, 0, 15, 30].map((x) => (
          <Circle
            key={x}
            cx={x}
            cy={84 - Math.abs(x) * 0.25}
            r={7}
            color="#FFF2E8"
          />
        ))}
      </Group>
    </Group>
  );
}

const LionDance: ArtBorderDrawing = { back: LionBack, front: LionFront };

// ── Dragon Head: you sit in the dragon's open jaws ───────────────────

const DRAGON_HEAD =
  "M0 -86C26 -86 52 -82 68 -66C86 -48 88 -18 82 8C76 38 60 62 34 80C18 90 -18 90 -34 80C-60 62 -76 38 -82 8C-88 -18 -86 -48 -68 -66C-52 -82 -26 -86 0 -86z";

const FRILL = Array.from({ length: 9 }, (_, k) => {
  // spikes down each side of the head
  const a = Math.PI * (0.05 + k * 0.1);
  return [a, Math.PI - a];
}).flat();

function spike(a: number, r0: number, len: number, w: number) {
  const p0 = polar(a - w, r0);
  const p1 = polar(a, r0 + len);
  const p2 = polar(a + w, r0);
  return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}z`;
}

function DragonHeadBack({ t }: { t: Clock }) {
  const breathe = useDerivedValue(() => 0.55 + 0.2 * Math.sin(t.value * 1.6));
  const frill = useMemo(
    () => FRILL.map((a, k) => spike(a, 72, 14 + (k % 3) * 4, 0.09)).join(""),
    [],
  );
  return (
    <Group>
      <Halo r={96} color="#FF3B1F" opacity={breathe} />
      {/* horns sweeping up and out */}
      {[1, -1].map((s) => (
        <Path
          key={s}
          path={`M${s * 30} -78C${s * 46} -92 ${s * 68} -94 ${s * 90} -86C${s * 74} -84 ${s * 60} -78 ${s * 52} -64z`}
        >
          <LinearGradient
            start={vec(s * 30, -70)}
            end={vec(s * 90, -86)}
            colors={["#9A7A4A", "#E8D2A0", "#FFF6E0"]}
          />
        </Path>
      ))}
      <Path path={frill} color="#5A0A06" />
      <Path path={DRAGON_HEAD}>
        <LinearGradient
          start={vec(0, -86)}
          end={vec(0, 88)}
          colors={["#D9361E", "#A51C10", "#6E0E08"]}
        />
      </Path>
      <Path
        path={DRAGON_HEAD}
        style="stroke"
        strokeWidth={2.5}
        color="#3A0503"
      />
      {/* the fire deep in its throat, glowing round you */}
      <Circle cx={0} cy={0} r={60} opacity={breathe}>
        <RadialGradient
          c={vec(0, 0)}
          r={60}
          colors={["#FFB347", "#FF5A1F", "#FF5A1F00"]}
          positions={[0.7, 0.85, 1]}
        />
      </Circle>
    </Group>
  );
}

function DragonHeadFront({ t }: { t: Clock }) {
  const blink = useBlink(t, 4.2, 1.1);
  const fierce = useDerivedValue(
    () => 0.65 + 0.35 * Math.sin(t.value * 5.3) * Math.sin(t.value * 2.1),
  );
  const jaw = useDerivedValue(() => [
    { translateY: Math.max(0, Math.sin(t.value * 1.2)) * 3 },
  ]);
  const whiskers = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.8) * 0.06 },
  ]);
  const scales = useMemo(
    () =>
      Array.from({ length: 5 }, (_, k) => {
        const y = -82 + k * 6;
        const w = 16 - k * 2;
        return `M${-w} ${y}Q0 ${y + 5} ${w} ${y}`;
      }).join(""),
    [],
  );
  const rowTeeth = (top: boolean) => {
    const count = top ? 8 : 6;
    const span = top ? 0.7 : 0.55;
    return Array.from({ length: count }, (_, k) => {
      const a =
        (top ? -Math.PI / 2 : Math.PI / 2) +
        (k / (count - 1) - 0.5) * span * Math.PI;
      return spike(a, 52, -7, 0.06);
    }).join("");
  };
  return (
    <Group>
      {/* the jaws' rim */}
      <Circle
        cx={0}
        cy={0}
        r={54}
        style="stroke"
        strokeWidth={7}
        color="#3A0503"
      />
      <Path path={rowTeeth(true)} color="#FFF4E0" />
      {/* the long fangs, over your picture's edge */}
      {[-20, 20].map((x) => (
        <Path
          key={x}
          path={`M${x - 6} -50L${x} -30L${x + 6} -50z`}
          color="#FFF8EA"
        />
      ))}
      {/* snout: ridge scales and nostrils */}
      <Path path={scales} style="stroke" strokeWidth={2} color="#5A0A06" />
      <Path
        path="M-22 -52C-20 -66 -10 -70 0 -70C10 -70 20 -66 22 -52C12 -56 -12 -56 -22 -52z"
        color="#B81F14"
      />
      <Oval x={-15} y={-64} width={9} height={6} color="#2A0402" />
      <Oval x={6} y={-64} width={9} height={6} color="#2A0402" />
      {[-11, 11].map((x) => (
        <Group
          key={x}
          transform={[
            { translateX: x },
            { translateY: -66 },
            { rotate: x < 0 ? -0.3 : 0.3 },
          ]}
        >
          <Steam x={0} y={0} width={9} height={22} clock={t} />
        </Group>
      ))}
      {/* brow ridges and the burning eyes */}
      {[-1, 1].map((s) => (
        <Group key={s}>
          <Path
            path={`M${s * 26} -62L${s * 64} -74L${s * 62} -62L${s * 30} -54z`}
            color="#5A0A06"
          />
          <Group
            transform={[
              { translateX: s * 46 },
              { translateY: -56 },
              { rotate: s * 0.25 },
            ]}
          >
            <Group transform={blink}>
              <Path path="M-12 0Q0 -9 12 0Q0 7 -12 0z" color="#2A0402" />
              <Path
                path="M-10 0Q0 -7 10 0Q0 5.5 -10 0z"
                color="#FF8A1F"
                opacity={fierce}
              />
              <Oval x={-1.2} y={-4.5} width={2.4} height={9} color="#1A0200" />
            </Group>
            <Circle
              cx={0}
              cy={0}
              r={13}
              color="#FF6A1F"
              opacity={fierce}
              blendMode="screen"
            >
              <BlurMask blur={8} style="normal" />
            </Circle>
          </Group>
        </Group>
      ))}
      {/* whiskers flowing out from the snout */}
      <Group transform={whiskers}>
        {[-1, 1].map((s) => (
          <Path
            key={s}
            path={`M${s * 22} -58C${s * 50} -54 ${s * 70} -36 ${s * 92} -46`}
            style="stroke"
            strokeWidth={2.4}
            strokeCap="round"
            color="#F6C64A"
          />
        ))}
      </Group>
      {/* the lower jaw */}
      <Group transform={jaw}>
        <Path path={rowTeeth(false)} color="#FFF4E0" />
        {[-18, 18].map((x) => (
          <Path
            key={x}
            path={`M${x - 5} 50L${x} 34L${x + 5} 50z`}
            color="#FFF8EA"
          />
        ))}
        <Path
          path="M-30 76L-22 92L-12 80L0 96L12 80L22 92L30 76"
          color="#5A0A06"
        />
      </Group>
    </Group>
  );
}

const DragonHead: ArtBorderDrawing = {
  back: DragonHeadBack,
  front: DragonHeadFront,
};

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
      <Band
        r={53}
        width={5}
        colors={["#FFF6D0", "#E0B94A", "#9A7A2A"]}
        rim="#6E5418"
      />
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
  "lion-dance": LionDance,
  "dragon-head": DragonHead,
  "angel-wings": AngelWings,
};

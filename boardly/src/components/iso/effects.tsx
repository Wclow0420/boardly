// Things lines can't draw, as shaders that live inside an <IsoCanvas>
// in the picture's own units: fire, steam, and the light a flame
// throws. Each runs off the UI thread and only adds light, so it can
// be laid over any drawing. All of a scene's effects keep time by one
// clock (useIsoClock), which stops — and the canvas with it — when the
// scene is paused.

import { useEffect, useMemo } from "react";
import {
  Circle,
  Group,
  RadialGradient,
  Rect,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { Shaft } from "./bursts";
import { NOISE } from "./noise";
import type { Effect } from "./kit";
import { Dust } from "./weather";

// uv.x runs -0.5..0.5 across the flame, uv.y 0..1 from its foot up
const FIRE = `
uniform float t;
uniform vec2 foot;
uniform vec2 size;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = vec2((xy.x - foot.x) / size.x, (foot.y - xy.y) / size.y);
  float n = fbm(vec2(uv.x * 3.2, uv.y * 2.6 - t * 1.9));
  float lick = uv.x + (n - 0.5) * 0.34 * uv.y;
  float body = 1.0 - smoothstep(0.0, 0.5 - uv.y * 0.42, abs(lick));
  float heat = body * (1.0 - uv.y) * (0.55 + n * 0.95);
  heat *= smoothstep(0.0, 0.06, uv.y) * (1.0 - smoothstep(0.7, 1.0, uv.y));
  vec3 color = mix(vec3(1.0, 0.24, 0.02), vec3(1.0, 0.72, 0.18), smoothstep(0.18, 0.5, heat));
  color = mix(color, vec3(1.0, 0.96, 0.78), smoothstep(0.5, 0.85, heat));
  float a = smoothstep(0.06, 0.3, heat);
  return half4(color * a, a);
}`;

const STEAM = `
uniform float t;
uniform vec2 foot;
uniform vec2 size;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = vec2((xy.x - foot.x) / size.x, (foot.y - xy.y) / size.y);
  float sway = sin(uv.y * 3.0 + t * 0.7) * 0.12 * uv.y;
  float n = fbm(vec2(uv.x * 2.6 + sway * 3.0, uv.y * 2.2 - t * 0.55));
  float wisp = 1.0 - smoothstep(0.04, 0.2 + uv.y * 0.22, abs(uv.x + sway + (n - 0.5) * 0.3));
  float a = wisp * n * smoothstep(0.0, 0.18, uv.y) * (1.0 - smoothstep(0.35, 1.0, uv.y)) * 0.6;
  return half4(vec3(0.93, 0.91, 0.86) * a, a);
}`;

/** A scene's clock, in seconds. While `paused` it stands still and no
 *  frame is drawn: nothing on the canvas changes. */
export function useIsoClock(paused = false): SharedValue<number> {
  const seconds = useSharedValue(0);
  const tick = useFrameCallback((frame) => {
    seconds.value += Math.min(frame.timeSincePreviousFrame ?? 16, 100) / 1000;
  }, !paused);
  useEffect(() => tick.setActive(!paused), [paused, tick]);
  return seconds;
}

/** What every effect is given: the scene's clock. */
interface Timed {
  clock: SharedValue<number>;
}

export interface PlumeProps extends Timed {
  /** The foot of the flame or the steam: bottom centre. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The clock, set forward so no two effects move alike. */
const useOffset = (clock: SharedValue<number>, offset: number) =>
  useDerivedValue(() => clock.value + 1.7 + offset);

function Plume({ x, y, width, height, clock, sksl }: PlumeProps & { sksl: string }) {
  const seconds = useOffset(clock, (x * 7.13 + y * 3.71) % 10);
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  const uniforms = useDerivedValue(() => ({
    t: seconds.value,
    foot: [x, y],
    size: [width, height],
  }));
  if (!source) return null;
  return (
    <Rect x={x - width / 2} y={y - height} width={width} height={height} blendMode="screen">
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** A fire burning upward from its foot. */
export const Fire = (props: PlumeProps) => <Plume {...props} sksl={FIRE} />;

/** Steam drifting up and thinning out. */
export const Steam = (props: PlumeProps) => <Plume {...props} sksl={STEAM} />;

export interface LightPoolProps extends Timed {
  /** Centre of the pool, and how far the light reaches. */
  x: number;
  y: number;
  radius: number;
  color: string;
  /** How much a floor is foreshortened: 1 is a round glow in the air. */
  flatten?: number;
  /** How bright at its steadiest, 0–1. */
  strength?: number;
}

/** The light a flame throws on what is around it, never quite steady. */
export function LightPool({ x, y, radius, color, flatten = 1, strength = 0.5, clock }: LightPoolProps) {
  const seconds = useOffset(clock, x * 0.37 + y * 0.11);
  const opacity = useDerivedValue(() => {
    const t = seconds.value;
    return strength * (1 + 0.24 * Math.sin(t * 7.3) + 0.16 * Math.sin(t * 13.7 + 1.3));
  });
  return (
    <Group transform={[{ scaleY: flatten }]} origin={vec(x, y)} blendMode="screen">
      <Circle cx={x} cy={y} r={radius} opacity={opacity}>
        <RadialGradient c={vec(x, y)} r={radius} colors={[color, `${color}00`]} />
      </Circle>
    </Group>
  );
}

/** A firefly: a speck of light that drifts and pulses. */
export function Firefly({ x, y, clock }: { x: number; y: number } & Timed) {
  const seconds = useOffset(clock, x * 1.9 + y * 0.7);
  const glow = useDerivedValue(() => 0.35 + 0.65 * Math.max(0, Math.sin(seconds.value * 1.6)));
  const drift = useDerivedValue(() => {
    const t = seconds.value;
    return [{ translateX: Math.sin(t * 0.5) * 3 }, { translateY: Math.sin(t * 0.8) * 2 }];
  });
  return (
    <Group transform={drift} blendMode="screen">
      <Circle cx={x} cy={y} r={4} opacity={glow}>
        <RadialGradient c={vec(x, y)} r={4} colors={["#FFE9A8", "#FFE9A800"]} />
      </Circle>
    </Group>
  );
}

/** A scene's effects (see kit.ts, live) on one of its layers. */
export function IsoEffects({
  effects,
  layer,
  clock,
}: {
  effects: Effect[];
  layer: Effect["layer"];
} & Timed) {
  return (
    <>
      {effects
        .filter((effect) => effect.layer === layer)
        .map((effect, index) => {
          switch (effect.kind) {
            case "flame":
              return (
                <Group key={index}>
                  <LightPool
                    x={effect.x}
                    y={effect.y - effect.size}
                    radius={effect.size * 4.5}
                    color="#FFB45E"
                    strength={0.32}
                    clock={clock}
                  />
                  <Fire
                    x={effect.x}
                    y={effect.y}
                    width={effect.size * 1.5}
                    height={effect.size * 2.6}
                    clock={clock}
                  />
                </Group>
              );
            case "steam":
              return <Steam key={index} {...effect} clock={clock} />;
            case "firefly":
              return <Firefly key={index} x={effect.x} y={effect.y} clock={clock} />;
            case "shaft":
              return <ShaftOfLight key={index} effect={effect} clock={clock} />;
            case "pool":
              return (
                <LightPool
                  key={index}
                  x={effect.x}
                  y={effect.y}
                  radius={effect.radius}
                  color="#FF9A3D"
                  flatten={0.58}
                  clock={clock}
                />
              );
          }
        })}
    </>
  );
}

/** Moonlight from a window, with dust hanging in it. */
function ShaftOfLight({
  effect,
  clock,
}: {
  effect: Extract<Effect, { kind: "shaft" }>;
  clock: SharedValue<number>;
}) {
  const bounds = useMemo(() => Skia.Path.MakeFromSVGString(effect.d)?.getBounds(), [effect.d]);
  return (
    <Shaft d={effect.d} from={effect.from} to={effect.to} color={effect.color} clock={clock}>
      {bounds ? (
        <Dust
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          clock={clock}
          amount={0.7}
        />
      ) : null}
    </Shaft>
  );
}

// What a night can do to a whole scene, laid over everything else on an
// <IsoCanvas>: the dark, fog on the floor, dust falling, rain, and the
// flash of lightning. Like the effects, each keeps time by the scene's
// clock (useIsoClock) and is placed in the picture's own units.

import { useMemo } from "react";
import { RadialGradient, Rect, Shader, Skia, vec } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { NOISE } from "./effects";

/** The part of the picture a weather fills. */
export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
  clock: SharedValue<number>;
}

// uv runs 0..1 across the area, top to bottom
const FOG = `
uniform float t;
uniform vec2 origin;
uniform vec2 size;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = (xy - origin) / size;
  float n = fbm(vec2(uv.x * 3.0 + t * 0.07, uv.y * 5.0 - t * 0.02));
  float m = fbm(vec2(uv.x * 6.0 - t * 0.05, uv.y * 8.0 + 3.0));
  float low = smoothstep(0.2, 0.65, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y));
  float a = low * smoothstep(0.3, 0.75, n * 0.7 + m * 0.5) * 0.6;
  return half4(vec3(0.72, 0.78, 0.88) * a, a);
}`;

const DUST = `
uniform float t;
uniform vec2 origin;
uniform vec2 size;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = (xy - origin) / size;
  float a = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    vec2 g = vec2(uv.x * 16.0 + layer * 7.3, uv.y * 9.0 - t * (0.22 + layer * 0.07));
    vec2 cell = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 off = vec2(hash(cell + 3.1) - 0.5, hash(cell + 7.7) - 0.5) * 0.6;
    float speck = 1.0 - smoothstep(0.02, 0.07, length(f - off));
    a += speck * smoothstep(0.86, 0.92, hash(cell + layer));
  }
  a *= 0.45 * smoothstep(0.0, 0.15, uv.y);
  return half4(vec3(0.86, 0.8, 0.7) * a, a);
}`;

const RAIN = `
uniform float t;
uniform vec2 origin;
uniform vec2 size;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = (xy - origin) / size;
  vec2 g = vec2(uv.x * 42.0 + uv.y * 9.0, uv.y * 2.4 + t * 2.4);
  float column = floor(g.x);
  float h = hash(vec2(column, 1.0));
  float y = fract(g.y + h * 13.0);
  float width = 1.0 - smoothstep(0.0, 0.07, abs(fract(g.x) - 0.5));
  float streak = width * smoothstep(0.0, 0.25, y) * (1.0 - smoothstep(0.25, 0.5, y));
  float a = streak * smoothstep(0.45, 0.55, h) * 0.4;
  return half4(vec3(0.7, 0.8, 1.0) * a, a);
}`;

function Weather({ x, y, width, height, clock, sksl }: Area & { sksl: string }) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  const uniforms = useDerivedValue(() => ({
    t: clock.value,
    origin: [x, y],
    size: [width, height],
  }));
  if (!source) return null;
  return (
    <Rect x={x} y={y} width={width} height={height}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** Fog lying low and drifting, thickest near the bottom of the area. */
export const Fog = (props: Area) => <Weather {...props} sksl={FOG} />;

/** Specks of dust falling slowly, as after something has come down. */
export const Dust = (props: Area) => <Weather {...props} sksl={DUST} />;

/** Rain slanting down. */
export const Rain = (props: Area) => <Weather {...props} sksl={RAIN} />;

/** The dark of a blackout: everything goes under, but a circle of light
 *  around (`x`, `y`) — a lantern — stays. */
export function Darkness({
  x,
  y,
  radius,
  width,
  height,
  clock,
}: {
  x: number;
  y: number;
  radius: number;
  width: number;
  height: number;
  clock: SharedValue<number>;
}) {
  // the lantern's light isn't steady either
  const reach = useDerivedValue(
    () => radius * (1 + 0.04 * Math.sin(clock.value * 5.1) + 0.03 * Math.sin(clock.value * 11.3))
  );
  const centre = vec(x, y);
  return (
    <Rect x={0} y={0} width={width} height={height}>
      <RadialGradient c={centre} r={reach} colors={["#05060B00", "#05060B99", "#05060BEB"]} positions={[0.25, 0.55, 1]} />
    </Rect>
  );
}

/** A flash of lightning over the area; `flash` runs 0..1. */
export function Flash({
  width,
  height,
  flash,
}: {
  width: number;
  height: number;
  flash: SharedValue<number>;
}) {
  const opacity = useDerivedValue(() => flash.value * 0.5);
  return (
    <Rect x={0} y={0} width={width} height={height} color="#D6E4FF" opacity={opacity} blendMode="screen" />
  );
}

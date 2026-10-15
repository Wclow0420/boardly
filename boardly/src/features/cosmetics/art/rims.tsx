// Rims that are the effect itself: a band of fire or storm cloud where a
// metal ring would be, its edge licking in over the picture's rim. Drawn
// on the front layer, so the border and its effect read as one piece,
// over the picture rather than behind it.

import { Rect, Shader, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import {
  useDerivedValue,
  type DerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import type { Clock } from "./kit";

/** Distance from the ring (r = 54), wavering: flames lick both in over
 *  the picture and out, by up to ~11. */
const RIM = `
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 1.5;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = 4.5 + 7.0 * n;
  float d = abs(r - 54.0 + (n2 - 0.5) * 5.0);
  float heat = (1.0 - d / width) * (0.6 + n * 0.8);
  if (heat <= 0.0) return half4(0.0);
`;

const FIRE_RIM = `
uniform float t;
${NOISE}
half4 main(vec2 xy) {
  ${RIM}
  vec3 color = mix(vec3(0.85, 0.16, 0.02), vec3(1.0, 0.6, 0.12), smoothstep(0.2, 0.55, heat));
  color = mix(color, vec3(1.0, 0.96, 0.76), smoothstep(0.6, 0.95, heat));
  float a = smoothstep(0.04, 0.4, heat);
  return half4(color * a, a);
}`;

const STORM_RIM = `
uniform float t;
uniform float flash;
${NOISE}
half4 main(vec2 xy) {
  ${RIM}
  vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(0.1, 0.18, 0.42), smoothstep(0.25, 0.7, heat));
  color = mix(color, vec3(0.35, 0.6, 1.0), smoothstep(0.65, 1.0, heat) * 0.8);
  color += vec3(0.5, 0.72, 1.0) * flash * (0.3 + heat);
  float a = smoothstep(0.04, 0.4, heat);
  return half4(color * a, a);
}`;

function Rim({
  sksl,
  uniforms,
}: {
  sksl: string;
  uniforms: DerivedValue<Record<string, number>>;
}) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  if (!source) return null;
  return (
    <Rect x={-70} y={-70} width={140} height={140}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

export function FireRim({ t }: { t: Clock }) {
  const uniforms = useDerivedValue<Record<string, number>>(() => ({
    t: t.value,
  }));
  return <Rim sksl={FIRE_RIM} uniforms={uniforms} />;
}

export function StormRim({
  t,
  flash,
}: {
  t: Clock;
  flash: SharedValue<number>;
}) {
  const uniforms = useDerivedValue<Record<string, number>>(() => ({
    t: t.value,
    flash: flash.value,
  }));
  return <Rim sksl={STORM_RIM} uniforms={uniforms} />;
}

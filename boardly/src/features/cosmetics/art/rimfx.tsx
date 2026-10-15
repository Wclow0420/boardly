// The shaders rim borders are made of. Every one draws round the avatar
// (r = 50, rim at 54) on the shared clock `t`, and takes `flash` (a
// lightning strike, a pulse: 0 when the border has none).
//
// Three kinds take their colours as uniforms and serve many borders:
//   AURA_FLAME — flames streaming outward, like the sun's
//   AURA_CLOUD — a ring of cloud or mist churning round
//   RIM_GLOW   — a wavering band right on the rim, licking over the
//                picture's edge (draw it on the front layer)
// The rest are one-offs: a black hole's disc, lava, aurora, rays, water,
// plasma, a prism, frost, a nebula.

import { Rect, Shader, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { NOISE } from "@/components/iso/noise";
import type { Clock } from "./kit";

const PRE = `
uniform float t;
uniform float flash;
${NOISE}
vec2 rot(vec2 v, float a) { float c = cos(a); float s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
// a band wavering round the rim: about 1 at its middle, 0 at its edges
float rimHeat(float r, vec2 dir, float speed, float reach) {
  float s = t * speed;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = reach * (0.4 + 0.65 * n);
  float d = abs(r - 54.0 + (n2 - 0.5) * 5.0);
  return (1.0 - d / width) * (0.6 + n * 0.8);
}
vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
`;

/** Colours of the shared kinds: dark, middle, bright. */
const COLORS = `
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform float speed;
uniform float reach;
`;

export const AURA_FLAME = `${PRE}${COLORS}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 49.0) / 40.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = xy / r;
  float s = h * 2.4 - t * 1.5 * speed;
  float n = fbm(dir * 2.6 + vec2(s, s * 0.7));
  float tip = reach * (0.42 + 0.58 * fbm(dir * 3.4 + vec2(t * 0.35, -t * 0.2)));
  float heat = (1.0 - h / tip) * (0.55 + n * 0.9);
  heat = max(heat, (1.0 - smoothstep(0.0, 0.16, h)) * 0.9);
  vec3 color = mix(c0, c1, smoothstep(0.15, 0.5, heat));
  color = mix(color, c2, smoothstep(0.55, 0.95, heat)) * (1.0 + flash * 0.3);
  float a = smoothstep(0.04, 0.32, heat);
  return half4(color * a, a);
}`;

export const AURA_CLOUD = `${PRE}${COLORS}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 48.0) / 42.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = xy / r;
  vec2 d = rot(dir, t * 0.55 * speed);
  vec2 p = d * 2.2 + vec2(h * 1.8, -h * 1.2);
  vec2 w = vec2(fbm(p + t * 0.7), fbm(p - t * 0.6 + 3.1));
  float n = fbm(p * 1.7 + w * 1.9 - vec2(t * 1.1, t * 0.5) * speed);
  float tip = reach * (0.5 + 0.5 * fbm(dir * 3.0 + vec2(-t * 0.5, t * 0.35)));
  float dense = (1.0 - h / tip) * (0.6 + n * 0.9);
  dense = max(dense, (1.0 - smoothstep(0.0, 0.18, h)) * 0.95);
  vec3 col = mix(c0, c1, smoothstep(0.3, 0.75, n));
  col = mix(col, c2, smoothstep(0.62, 0.95, n) * 0.75);
  col += c2 * flash * (0.35 + n * 0.9) * (1.0 - h * 0.5);
  float alpha = smoothstep(0.05, 0.35, dense);
  return half4(col * alpha, alpha);
}`;

/** `reach` is how far the band licks; `drip` thickens its lower half. */
export const RIM_GLOW = `${PRE}${COLORS}
uniform float drip;
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, speed, reach + max(dir.y, 0.0) * drip);
  if (heat <= 0.0) return half4(0.0);
  vec3 color = mix(c0, c1, smoothstep(0.2, 0.55, heat));
  color = mix(color, c2, smoothstep(0.6, 0.95, heat));
  color += c2 * flash * (0.3 + heat) * 0.6;
  float a = smoothstep(0.04, 0.4, heat);
  return half4(color * a, a);
}`;

/** A black hole's disc of light, spiralling in. */
export const BLACK_HOLE_DISC = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 54.0) / 38.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = xy / r;
  vec2 d = rot(dir, t * 1.4 + (1.0 - h) * 3.0);
  float n = fbm(d * 3.0 + vec2(h * 5.0, 0.0));
  float disc = exp(-pow((r - 68.0) / 10.0, 2.0)) * (0.45 + n * 0.9);
  float v = disc + (1.0 - h) * 0.35 * n + flash * 0.1;
  vec3 col = mix(vec3(0.45, 0.15, 0.75), vec3(1.0, 0.5, 0.12), smoothstep(0.15, 0.55, v));
  col = mix(col, vec3(1.0, 0.95, 0.85), smoothstep(0.7, 1.1, v));
  float a = smoothstep(0.05, 0.5, v);
  return half4(col * a, a);
}`;

/** Its event horizon: pitch black over the picture's edge, a thin ring
 *  of bent light just outside. */
export const BLACK_HOLE_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float n = fbm(dir * 4.0 + vec2(t * 0.8, -t * 0.8));
  float d = abs(r - 55.0 + (n - 0.5) * 3.0);
  float black = 1.0 - smoothstep(3.0, 7.5, d);
  float photon = exp(-pow((r - 60.0 - (n - 0.5) * 2.0) / 1.3, 2.0)) * (1.0 + flash * 0.3);
  vec3 col = vec3(1.0, 0.85, 0.6) * min(photon, 1.0);
  return half4(col, max(black, min(photon, 1.0)));
}`;

/** A crust of dark rock, lava glowing through its cracks. */
export const LAVA_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.35, 12.0);
  if (heat <= 0.0) return half4(0.0);
  vec2 p = rot(dir, t * 0.15) * 4.0 + vec2(r * 0.08, t * 0.25);
  float crack = 1.0 - smoothstep(0.0, 0.07, abs(fbm(p) - 0.5));
  float pulse = (0.75 + 0.25 * sin(t * 3.0 + fbm(p * 2.0) * 6.0)) * (1.0 + flash * 0.3);
  vec3 crust = vec3(0.12, 0.05, 0.03) + vec3(0.14, 0.06, 0.03) * fbm(p * 3.0);
  vec3 lava = mix(vec3(1.0, 0.3, 0.02), vec3(1.0, 0.88, 0.35), crack * pulse);
  vec3 col = mix(crust, lava, clamp(crack * pulse, 0.0, 1.0));
  float a = smoothstep(0.05, 0.4, heat);
  return half4(col * a, a);
}`;

/** Curtains of northern light, rippling. */
export const AURORA = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 50.0) / 42.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  float ang = atan(xy.y, xy.x);
  vec2 d = vec2(cos(ang), sin(ang));
  float curtain = fbm(d * 2.5 + vec2(t * 0.25, 0.0));
  // fine vertical streaks, like curtains of light hanging in folds
  float folds = pow(0.5 + 0.5 * sin(ang * 30.0 + curtain * 9.0 + t * 1.2), 2.0);
  float streak = 0.6 + 0.4 * sin(ang * 70.0 + curtain * 14.0);
  float fade = smoothstep(0.0, 0.15, h) * (1.0 - smoothstep(0.55, 1.0, h));
  float band = exp(-pow((h - 0.35 - (curtain - 0.5) * 0.35) / 0.3, 2.0));
  float v = band * fade * (0.3 + folds * streak * 0.9) * (0.7 + curtain * 0.6) + flash * 0.05;
  vec3 col = mix(vec3(0.1, 0.95, 0.55), vec3(0.2, 0.8, 0.95), smoothstep(0.2, 0.6, h));
  col = mix(col, vec3(0.95, 0.4, 0.8), smoothstep(0.5, 0.9, h + (curtain - 0.5) * 0.3));
  float a = clamp(v, 0.0, 1.0) * 0.85;
  return half4(col * a, a);
}`;

export const AURORA_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.4, 8.0);
  if (heat <= 0.0) return half4(0.0);
  float ang = atan(xy.y, xy.x);
  float k = 0.5 + 0.5 * sin(ang * 3.0 + t * 0.7);
  vec3 col = mix(vec3(0.15, 1.0, 0.6), vec3(1.0, 0.45, 0.85), k);
  col = mix(col, vec3(0.9, 1.0, 0.95), smoothstep(0.7, 1.0, heat)) * (1.0 + flash * 0.2);
  float a = smoothstep(0.05, 0.45, heat);
  return half4(col * a, a);
}`;

/** Rays of light fanning out, turning slowly. */
export const RAYS = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 50.0) / 42.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  float ang = atan(xy.y, xy.x);
  float rays = pow(0.5 + 0.5 * sin(ang * 18.0 + t * 0.6), 6.0)
    + pow(0.5 + 0.5 * sin(ang * 11.0 - t * 0.4 + 1.3), 8.0) * 0.7;
  float v = rays * (1.0 - h) * (1.0 - h) + (1.0 - smoothstep(0.0, 0.6, h)) * 0.5 + flash * 0.1;
  vec3 col = mix(vec3(1.0, 0.78, 0.3), vec3(1.0, 0.97, 0.85), clamp(v, 0.0, 1.0));
  float a = clamp(v, 0.0, 1.0) * 0.9;
  return half4(col * a, a);
}`;

/** Molten gold flowing round the rim. */
export const GOLD_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.6, 9.0);
  if (heat <= 0.0) return half4(0.0);
  float n = fbm(rot(dir, t * 0.5) * 4.0 + vec2(t * 0.3));
  vec3 col = mix(vec3(0.6, 0.38, 0.08), vec3(1.0, 0.82, 0.35), smoothstep(0.2, 0.6, heat + n * 0.3));
  col = mix(col, vec3(1.0, 0.97, 0.85), smoothstep(0.75, 1.0, heat + n * 0.2)) * (1.0 + flash * 0.2);
  float a = smoothstep(0.05, 0.4, heat);
  return half4(col * a, a);
}`;

/** A rolling wave round the rim, foam on its crest. */
export const TIDE_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  // waves rolling round: crests rise out, troughs sink
  float wave = fbm(rot(dir, -t * 0.8) * 6.0 + vec2(t * 0.6, 0.0));
  float swell = 0.5 + 0.5 * sin(atan(xy.y, xy.x) * 7.0 - t * 2.4 + wave * 4.0);
  float d0 = r - 54.0;
  float outer = 3.0 + swell * 14.0 + wave * 4.0;
  float inner = 4.0 + wave * 3.0;
  float m = d0 > 0.0 ? 1.0 - d0 / outer : 1.0 + d0 / inner;
  if (m <= 0.0) return half4(0.0);
  vec3 deep = vec3(0.0, 0.1, 0.32);
  vec3 col = mix(deep, vec3(0.08, 0.5, 0.88), smoothstep(0.0, 0.9, m * (0.5 + swell * 0.7)));
  col = mix(col, vec3(0.45, 0.85, 1.0), smoothstep(0.55, 0.9, wave) * 0.5);
  // white foam curling on the crests
  float foam = (1.0 - smoothstep(0.0, 0.4, m)) * step(0.0, d0) * smoothstep(0.35, 0.75, swell);
  foam += smoothstep(0.72, 0.85, fbm(rot(dir, t * 0.5) * 11.0 + vec2(r * 0.25, t))) * 0.6;
  col = mix(col, vec3(0.96, 0.99, 1.0), clamp(foam, 0.0, 1.0)) * (1.0 + flash * 0.2);
  float a = smoothstep(0.0, 0.25, m);
  return half4(col * a, a);
}`;

/** Plasma crackling round the rim, pulsing. */
export const PLASMA_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 2.2;
  float n = fbm(dir * 6.0 + vec2(s, -s));
  float n2 = fbm(dir * 9.0 - vec2(s * 1.3, s * 0.4));
  float width = 7.0 + 11.0 * n * (0.8 + 0.2 * sin(t * 5.0));
  float d = abs(r - 54.0 + (n2 - 0.5) * 6.0);
  float heat = (1.0 - d / width) * (0.7 + n) * (1.0 + flash * 0.4);
  if (heat <= 0.0) return half4(0.0);
  vec3 col = mix(vec3(0.9, 0.1, 0.75), vec3(0.2, 0.9, 1.0), smoothstep(0.3, 0.8, heat));
  col = mix(col, vec3(1.0), smoothstep(0.85, 1.2, heat));
  float a = smoothstep(0.05, 0.4, heat) * (0.85 + 0.15 * sin(t * 6.0));
  return half4(col * a, a);
}`;

/** A rim whose rainbow turns as it goes round. */
export const PRISM_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.6, 9.0);
  if (heat <= 0.0) return half4(0.0);
  float ang = atan(xy.y, xy.x) / 6.2832;
  vec3 col = hue(ang + t * 0.15 + (r - 54.0) * 0.012);
  col = mix(col, vec3(1.0), smoothstep(0.7, 1.0, heat) * 0.6 + flash * 0.2);
  float a = smoothstep(0.05, 0.45, heat);
  return half4(col * a, a);
}`;

export const PRISM_GLOW = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 50.0) / 42.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  float ang = atan(xy.y, xy.x) / 6.2832;
  float v = (1.0 - h) * (1.0 - h) * (0.45 + 0.25 * sin(ang * 6.2832 * 6.0 + t)) + flash * 0.05;
  vec3 col = hue(ang + t * 0.1 - h * 0.3);
  float a = clamp(v, 0.0, 1.0);
  return half4(col * a, a);
}`;

/** Frost on the rim, crystals glinting in it. */
export const FROST_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.25, 10.0);
  if (heat <= 0.0) return half4(0.0);
  float c = fbm(xy * 0.35 + vec2(t * 0.1, 0.0));
  vec3 col = mix(vec3(0.35, 0.6, 0.95), vec3(0.85, 0.95, 1.0), smoothstep(0.2, 0.7, heat));
  col = mix(col, vec3(1.0), smoothstep(0.55, 0.75, c) * 0.6) * (1.0 + flash * 0.2);
  float a = smoothstep(0.05, 0.45, heat);
  return half4(col * a, a);
}`;

/** A nebula on the rim, stars twinkling in it. */
export const NEBULA_RIM = `${PRE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float heat = rimHeat(r, dir, 0.4, 10.0);
  if (heat <= 0.0) return half4(0.0);
  float n = fbm(rot(dir, t * 0.2) * 3.5 + vec2(r * 0.05));
  vec3 col = mix(vec3(0.35, 0.15, 0.75), vec3(0.95, 0.35, 0.75), smoothstep(0.3, 0.7, n));
  col = mix(col, vec3(0.4, 0.7, 1.0), smoothstep(0.65, 0.9, n));
  vec2 cell = floor(xy * 1.2);
  float star = step(0.97, hash(cell)) * (0.5 + 0.5 * sin(t * 4.0 + hash(cell) * 30.0));
  col = (col * (0.6 + 0.6 * heat) + vec3(star)) * (1.0 + flash * 0.2);
  float a = smoothstep(0.05, 0.45, heat);
  return half4(min(col, vec3(1.0)) * a, a);
}`;

type Uniform = number | number[];

/** A hex colour as a shader's vec3. */
export const rgb = (hex: string): number[] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** One of the shaders above, drawn over the art's square. */
export function Fx({
  sksl,
  t,
  flash,
  values,
  extent = 92,
}: {
  sksl: string;
  t: Clock;
  flash?: SharedValue<number>;
  /** The shared kinds' colours and settings. */
  values?: Record<string, Uniform>;
  extent?: number;
}) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  const uniforms = useDerivedValue<Record<string, Uniform>>(() => ({
    t: t.value,
    flash: flash ? flash.value : 0,
    ...values,
  }));
  if (!source) return null;
  return (
    <Rect x={-extent} y={-extent} width={extent * 2} height={extent * 2}>
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

/** Colours and settings for AURA_FLAME / AURA_CLOUD (reach ~1: how far
 *  out it goes) — each shader gets exactly the uniforms it declares. */
export function aura(
  dark: string,
  mid: string,
  bright: string,
  speed = 1,
  reach = 1,
) {
  return { c0: rgb(dark), c1: rgb(mid), c2: rgb(bright), speed, reach };
}

/** Colours and settings for RIM_GLOW (reach ~10: how far it licks). */
export function rim(
  dark: string,
  mid: string,
  bright: string,
  speed = 1,
  reach = 10,
  drip = 0,
) {
  return { ...aura(dark, mid, bright, speed, reach), drip };
}

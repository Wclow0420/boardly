// The lanterns' live light, as shaders in the lantern's own units (the
// 120 × 210 box of art.ts): the candle's flame, and the aura that grows
// round the lantern as it is powered, the way the rim borders burn
// (Shadow Flame's streaming fire for the good lantern, Blood Moon's
// churning smoke for the bad). Both return early where they draw
// nothing, and the aura draws nothing at all until it has power.

import { NOISE } from "@/components/iso/noise";

/** uv.x runs -0.5..0.5 across the flame, uv.y 0..1 from its foot up. */
export const FLAME = `
uniform float t;
uniform vec2 foot;
uniform vec2 size;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
${NOISE}
half4 main(vec2 xy) {
  vec2 uv = vec2((xy.x - foot.x) / size.x, (foot.y - xy.y) / size.y);
  if (uv.y < 0.0 || uv.y > 1.0 || abs(uv.x) > 0.5) return half4(0.0);
  float n = fbm(vec2(uv.x * 3.0, uv.y * 2.4 - t * 2.1));
  float lick = uv.x + (n - 0.5) * 0.3 * uv.y;
  float body = 1.0 - smoothstep(0.0, 0.46 - uv.y * 0.4, abs(lick));
  float heat = body * (1.0 - uv.y * 0.85) * (0.6 + n * 0.9);
  heat *= smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.72, 1.0, uv.y));
  vec3 color = mix(c0, c1, smoothstep(0.15, 0.45, heat));
  color = mix(color, c2, smoothstep(0.5, 0.85, heat));
  float a = smoothstep(0.06, 0.3, heat);
  return half4(color * a, a);
}`;

/** The aura: from the lantern's edge (an ellipse at c, radii R) outward,
 *  as far as its power reaches. mode 0 is fire streaming out and up,
 *  mode 1 a cloud of smoke churning round. */
export const AURA = `
uniform float t;
uniform vec2 c;
uniform vec2 R;
uniform float power;
uniform float mode;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
${NOISE}
vec2 rot(vec2 v, float a) { float k = cos(a); float s = sin(a); return vec2(v.x * k - v.y * s, v.x * s + v.y * k); }
half4 main(vec2 xy) {
  if (power < 0.01) return half4(0.0);
  vec2 d = (xy - c) / R;
  float q = length(d);
  float reach = 0.18 + 0.5 * power;
  float h = (q - 0.7) / reach;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = d / q;
  float heat;
  if (mode < 0.5) {
    float s = h * 2.4 - t * 1.6;
    float n = fbm(dir * 2.6 + vec2(s, s * 0.7));
    float tip = (0.42 + 0.58 * fbm(dir * 3.4 + vec2(t * 0.35, -t * 0.2))) * (0.7 + 0.5 * max(-dir.y, 0.0));
    heat = (1.0 - h / tip) * (0.55 + n * 0.9);
    heat = max(heat, (1.0 - smoothstep(0.0, 0.2, h)) * 0.85);
  } else {
    vec2 r = rot(dir, t * 0.5);
    vec2 p = r * 2.2 + vec2(h * 1.8, -h * 1.2);
    vec2 w = vec2(fbm(p + t * 0.7), fbm(p - t * 0.6 + 3.1));
    float n = fbm(p * 1.7 + w * 1.9 - vec2(t * 1.1, t * 0.5));
    float tip = 0.5 + 0.5 * fbm(dir * 3.0 + vec2(-t * 0.5, t * 0.35));
    heat = (1.0 - h / tip) * (0.6 + n * 0.9);
    heat = max(heat, (1.0 - smoothstep(0.0, 0.22, h)) * 0.95);
  }
  vec3 col = mix(c0, c1, smoothstep(0.15, 0.5, heat));
  col = mix(col, c2, smoothstep(0.55, 0.95, heat));
  float a = smoothstep(0.04, 0.32, heat) * min(power * 1.2, 0.85);
  return half4(col * a, a);
}`;

/** Each lantern's light: its flame (dark, middle, core), its aura, and
 *  the colour its glass glows. */
export const LIGHT = {
  good: {
    flame: ["#0E6A2A", "#42E070", "#F0FFE0"],
    aura: ["#04240E", "#1EB04A", "#C8FFB0"],
    glow: "#6CFF8E",
    mode: 0,
  },
  bad: {
    flame: ["#2A0006", "#D8203A", "#FFC8C0"],
    aura: ["#0E0002", "#6A0612", "#F0283A"],
    glow: "#FF2E44",
    mode: 1,
  },
  seal: {
    flame: ["#A8481A", "#FFB23A", "#FFF6D8"],
    aura: ["#3A1804", "#E28A1A", "#FFF0B0"],
    glow: "#FFC870",
    mode: 0,
  },
} as const;

/** A hex colour as a shader's vec3. */
export const rgb = (hex: string): number[] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// The dossier's live light, as a shader: the aura that grows round a
// stamp as it is charged (and round the verdict when it lands) — green
// fire streaming up for the approving stamp, a churn of red smoke for
// the moles' seal, warm lamplight for the dossier itself. It returns
// early where it draws nothing, and draws nothing at all until it has
// power. After the lanterns' aura in Seal the Manor.

import { NOISE } from "@/components/iso/noise";

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

/** Each light: its aura's colours (dark, middle, bright), the colour it
 *  glows, and how its aura moves (0 fire, 1 smoke). */
export const LIGHT = {
  approve: { aura: ["#04240E", "#1EB04A", "#C8FFB0"], glow: "#6CFF8E", mode: 0 },
  seal: { aura: ["#0E0002", "#6A0612", "#F0283A"], glow: "#FF2E44", mode: 1 },
  lamp: { aura: ["#3A1804", "#E28A1A", "#FFF0B0"], glow: "#FFC870", mode: 0 },
} as const;
export type LightKind = keyof typeof LIGHT;

/** A hex colour as a shader's vec3. */
export const rgb = (hex: string): number[] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

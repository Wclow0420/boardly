// Glacier and Thunderstorm, enhanced and engraved.
//
// - Glacier: a crown of real ice. Faceted crystal shards (a lit face, a
//   shaded face, white ridges, see-through shines) rise round the
//   picture, set in a thin silver ring engraved with frost-work and an
//   ice jewel at its crown. Snow drifts down, a cold glint slides across
//   the facets and a little frost clings to the rim.
// - Thunderstorm: the churning storm-cloud ring as before, now set with a
//   thin engraved iron ring studded with silver bolts. Lightning forks
//   along the clouds, lighting the cloud and the studs where it strikes,
//   and fine rain falls through the storm.

import {
  BlurMask,
  Circle,
  FillType,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import { NOISE } from "@/components/iso/noise";

const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(2);
/** A point at angle `a`, radius `r`, as path text. */
const at = (a: number, r: number) => {
  const p = polar(a, r);
  return `${f(p.x)} ${f(p.y)}`;
};
/** A circle, clockwise (or anticlockwise, to cut a hole). */
const disc = (r: number, hole = false) => {
  const s = hole ? 0 : 1;
  return `M${f(r)} 0A${r} ${r} 0 1 ${s} ${f(-r)} 0A${r} ${r} 0 1 ${s} ${f(r)} 0Z`;
};
/** A band round the origin (a ring under either fill rule). */
const ring = (rOut: number, rIn: number) => disc(rOut) + disc(rIn, true);

const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const INK_SILVER = "#1E242C";
const VEIN_SILVER = "#4A5462";

/** An engraved piece: filled with its metal, its veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink,
  vein,
  veinColor,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors: string[];
  ink: string;
  vein?: string;
  veinColor?: string;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const fill = evenOdd ? "evenOdd" : "winding";
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={colors} />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={0.8}
              strokeCap="round"
              color={veinColor ?? ink}
              opacity={0.75}
            />
          ) : null}
          {shine ? (
            <Path
              path={shine}
              style="stroke"
              strokeWidth={1.2}
              strokeCap="round"
              color="#FFFFFF"
              opacity={0.85}
            />
          ) : null}
        </Group>
      ) : null}
      <Path
        path={d}
        fillType={fill}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        color={ink}
      />
    </Group>
  );
}

/** One of this file's shaders over the art's square. */
function Shaded({
  sksl,
  uniforms,
  extent,
  opacity,
}: {
  sksl: string;
  uniforms: SharedValue<Record<string, number | number[]>>;
  extent: number;
  opacity?: number;
}) {
  const source = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  if (!source) return null;
  return (
    <Rect
      x={-extent}
      y={-extent}
      width={extent * 2}
      height={extent * 2}
      opacity={opacity}
    >
      <Shader source={source} uniforms={uniforms} />
    </Rect>
  );
}

// ── Glacier ──────────────────────────────────────────────────────────

const INK_ICE = "#0A2440";
/** Ice, lit from the top left: the face toward the light, the face on,
 *  the face away. */
const ICE_LIT = ["#FFFFFF", "#DDF3FF", "#A6D8FB"];
const ICE_MID = ["#D4F0FF", "#86C6F4", "#4A90D8"];
const ICE_DARK = ["#7CB8EE", "#3474C0", "#163F80"];

interface Crystal {
  lit: string;
  mid: string;
  dark: string;
  outline: string;
  ridge: string;
  shine: string;
  inner: string;
}

/** A crystal of ice rising from the ring: a six-sided prism cut to a
 *  point, three of its faces seen. Rooted at angle `a`, radius `root`,
 *  `len` long and `w` half as wide, leaning by `tilt`. */
const crystal = (
  a: number,
  root: number,
  len: number,
  w: number,
  tilt = 0,
): Crystal => {
  const c = polar(a, root);
  const d = a + tilt;
  const ux = Math.cos(d);
  const uy = Math.sin(d);
  const px = -uy;
  const py = ux;
  const P = (x: number, y: number) =>
    `${f(c.x + ux * y + px * x)} ${f(c.y + uy * y + py * x)}`;
  const s = len * 0.56;
  const sm = s + len * 0.06;
  const BL = P(-w, 0);
  const BML = P(-0.3 * w, 0);
  const BMR = P(0.3 * w, 0);
  const BR = P(w, 0);
  const SL = P(-w, s);
  const SML = P(-0.3 * w, sm);
  const SMR = P(0.3 * w, sm);
  const SR = P(w, s);
  const T = P(0, len);
  const neg = `M${BL}L${BML}L${SML}L${T}L${SL}Z`;
  const pos = `M${BMR}L${BR}L${SR}L${T}L${SMR}Z`;
  // which side faces the light (up and to the left)
  const negLit = px * 0.6 + py * 0.8 > 0;
  const side = negLit ? -1 : 1;
  return {
    lit: negLit ? neg : pos,
    dark: negLit ? pos : neg,
    mid: `M${BML}L${BMR}L${SMR}L${T}L${SML}Z`,
    outline: `M${BL}L${SL}L${T}L${SR}L${BR}Z`,
    ridge: `M${BML}L${SML}L${T}M${BMR}L${SMR}L${T}M${SL}L${SML}M${SMR}L${SR}`,
    shine:
      `M${P(side * 0.66 * w, len * 0.14)}L${P(side * 0.66 * w, s * 0.9)}` +
      `M${P(side * 0.62 * w, s + len * 0.05)}L${P(side * 0.2 * w, len * 0.84)}`,
    // light seen through the ice, near its shaded side
    inner: `M${P(-side * 0.12 * w, len * 0.1)}L${P(-side * 0.12 * w, s * 0.85)}`,
  };
};

/** Twelve clusters, tallest at the crown: a big crystal with a smaller
 *  one leaning out each side, and a stub between clusters. */
const CLUSTERS = Array.from({ length: 12 }, (_, k) => {
  const a = -Math.PI / 2 + (k * TAU) / 12 + (rnd(k + 3) - 0.5) * 0.06;
  // 1 at the top of the ring, 0 at its foot
  const crown = 0.5 - 0.5 * Math.sin(a);
  const len = 15 + 19 * crown ** 1.4 + rnd(k + 11) * 4;
  return { a, crown, len, w: 4.2 + 1.6 * crown + rnd(k + 21) * 0.8 };
});
const ICE_BACK = CLUSTERS.flatMap((c, k) => [
  crystal(
    c.a - 8 * DEG,
    49,
    c.len * (0.55 + rnd(k + 31) * 0.12),
    c.w * 0.72,
    -0.3,
  ),
  crystal(
    c.a + 8 * DEG,
    49,
    c.len * (0.5 + rnd(k + 41) * 0.12),
    c.w * 0.7,
    0.3,
  ),
  ...(k % 2
    ? []
    : [
        crystal(c.a + 15 * DEG, 49, 9 + 7 * c.crown + rnd(k + 51) * 3, 3, 0.05),
      ]),
]);
const ICE_FRONT = CLUSTERS.map((c) => crystal(c.a, 48, c.len, c.w));
const ICE_ALL = [...ICE_BACK, ...ICE_FRONT].map((c) => c.outline).join("");

/** The tips that catch a glint now and then. */
const ICE_TIPS = [0, 2, 10, 5, 7].map((k, j) => {
  const c = CLUSTERS[k];
  const p = polar(c.a, 48 + c.len - 2);
  return { x: p.x, y: p.y, size: 4 + c.crown * 3, phase: j * 1.3 + 0.4 };
});

function IceTier({ shards }: { shards: Crystal[] }) {
  const join = (key: keyof Crystal) => shards.map((s) => s[key]).join("");
  const p = useMemo(
    () => ({
      lit: join("lit"),
      mid: join("mid"),
      dark: join("dark"),
      outline: join("outline"),
      ridge: join("ridge"),
      shine: join("shine"),
      inner: join("inner"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shards],
  );
  const from = vec(-70, -85);
  const to = vec(70, 85);
  return (
    <Group>
      <Path path={p.lit} opacity={0.96}>
        <LinearGradient start={from} end={to} colors={ICE_LIT} />
      </Path>
      <Path path={p.mid} opacity={0.94}>
        <LinearGradient start={from} end={to} colors={ICE_MID} />
      </Path>
      <Path path={p.dark} opacity={0.94}>
        <LinearGradient start={from} end={to} colors={ICE_DARK} />
      </Path>
      <Path
        path={p.inner}
        style="stroke"
        strokeWidth={0.7}
        strokeCap="round"
        color="#E6F6FF"
        opacity={0.55}
      />
      <Path
        path={p.ridge}
        style="stroke"
        strokeWidth={0.7}
        strokeJoin="round"
        color="#FFFFFF"
        opacity={0.85}
      />
      <Path
        path={p.shine}
        style="stroke"
        strokeWidth={1.2}
        strokeCap="round"
        color="#FFFFFF"
        opacity={0.9}
      />
      <Path
        path={p.outline}
        style="stroke"
        strokeWidth={1.1}
        strokeJoin="round"
        color={INK_ICE}
      />
    </Group>
  );
}

const STAR =
  "M0 -1Q0.15 -0.15 1 0Q0.15 0.15 0 1Q-0.15 0.15 -1 0Q-0.15 -0.15 0 -1Z";

function Flake({ t, i }: { t: Clock; i: number }) {
  const life = 6 + rnd(i) * 4;
  const x0 = -84 + rnd(i + 1) * 168;
  const size = 1.1 + rnd(i + 4) * 1.6;
  const star = i % 3 === 0;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 5 + i) * 7 },
      { translateY: -88 + p * 176 },
      { rotate: p * 3 + i },
      { scale: star ? size * 2.2 : 1 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 2) * life) % life) / life;
    return Math.sin(p * Math.PI) * 0.95;
  });
  return star ? (
    <Path path={STAR} color="#FFFFFF" transform={transform} opacity={opacity} />
  ) : (
    <Circle
      cx={0}
      cy={0}
      r={size}
      color="#FFFFFF"
      transform={transform}
      opacity={opacity}
    />
  );
}

function GlacierBack({ t }: { t: Clock }) {
  return (
    <Group>
      <IceTier shards={ICE_BACK} />
      <IceTier shards={ICE_FRONT} />
      <Group opacity={0.8}>
        <Sweep t={t} d={ICE_ALL} every={4.2} />
      </Group>
      {ICE_TIPS.map((g, k) => (
        <Glint key={k} t={t} x={g.x} y={g.y} size={g.size} phase={g.phase} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <Flake key={i} t={t} i={i} />
      ))}
    </Group>
  );
}

/** Frost on the rim: thin, pale, crystals glinting in it. */
const GLACIER_FROST = `
uniform float t;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 0.25;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = 7.0 * (0.4 + 0.65 * n);
  float d = abs(r - 53.0 + (n2 - 0.5) * 4.0);
  float heat = (1.0 - d / width) * (0.6 + n * 0.8);
  if (heat <= 0.0) return half4(0.0);
  float c = fbm(xy * 0.4 + vec2(t * 0.1, 0.0));
  vec3 col = mix(vec3(0.5, 0.75, 1.0), vec3(0.9, 0.97, 1.0), smoothstep(0.2, 0.7, heat));
  col = mix(col, vec3(1.0), smoothstep(0.55, 0.75, c) * 0.7);
  float a = smoothstep(0.05, 0.5, heat) * 0.75;
  return half4(col * a, a);
}`;

const ICE_RING = ring(56, 49.5);
/** Frost-work engraved along the ring: a groove, ferns of frost off it. */
const FROSTWORK =
  disc(52.75) +
  Array.from({ length: 60 }, (_, k) => {
    const a = k * 6 * DEG;
    return `M${at(a, 52.75)}L${at(a + 2.6 * DEG, 55.1)}M${at(a, 52.75)}L${at(a + 2.6 * DEG, 50.4)}`;
  }).join("");

/** A cut ice jewel at the ring's crown, in a silver setting. */
const kite = (cx: number, cy: number, w: number, top: number, bottom: number) =>
  `M${cx} ${cy - top}L${cx + w} ${cy}L${cx} ${cy + bottom}L${cx - w} ${cy}Z`;
const JX = 0;
const JY = -53;
const JEWEL_SET = kite(JX, JY, 7.4, 9.4, 7.6);
const JEWEL = kite(JX, JY, 5.4, 7.4, 5.8);
const JEWEL_FACETS = {
  tl: `M${JX} ${JY - 7.4}L${JX} ${JY - 1}L${JX - 5.4} ${JY}Z`,
  tr: `M${JX} ${JY - 7.4}L${JX + 5.4} ${JY}L${JX} ${JY - 1}Z`,
  bl: `M${JX - 5.4} ${JY}L${JX} ${JY - 1}L${JX} ${JY + 5.8}Z`,
  br: `M${JX + 5.4} ${JY}L${JX} ${JY + 5.8}L${JX} ${JY - 1}Z`,
};

function IceJewel({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.35 + 0.3 * Math.sin(t.value * 1.6));
  return (
    <Group>
      <Metal
        d={JEWEL_SET}
        colors={SILVER}
        ink={INK_SILVER}
        width={1.1}
        from={vec(-8, -62)}
        to={vec(8, -44)}
      />
      <Path path={JEWEL_FACETS.tl} color="#F4FBFF" />
      <Path path={JEWEL_FACETS.tr} color="#9ED4FA" />
      <Path path={JEWEL_FACETS.bl} color="#6CB2EE" />
      <Path path={JEWEL_FACETS.br} color="#245EAE" />
      <Circle cx={JX} cy={JY - 1} r={3.4} color="#BFE6FF" opacity={glow}>
        <BlurMask blur={2.2} style="normal" />
      </Circle>
      <Path
        path={`M${JX} ${JY - 7.4}L${JX} ${JY + 5.8}M${JX - 5.4} ${JY}L${JX} ${JY - 1}L${JX + 5.4} ${JY}`}
        style="stroke"
        strokeWidth={0.5}
        color="#FFFFFF"
        opacity={0.8}
      />
      <Path
        path={JEWEL}
        style="stroke"
        strokeWidth={0.9}
        strokeJoin="round"
        color={INK_ICE}
      />
    </Group>
  );
}

function GlacierFront({ t }: { t: Clock }) {
  const uniforms = useDerivedValue<Record<string, number | number[]>>(() => ({
    t: t.value,
  }));
  return (
    <Group>
      <Shaded sksl={GLACIER_FROST} uniforms={uniforms} extent={64} />
      <Metal
        d={ICE_RING}
        colors={SILVER}
        ink={INK_SILVER}
        width={1.2}
        vein={FROSTWORK}
        veinColor={VEIN_SILVER}
        shine="M-51 -18A54 54 0 0 1 -32 -43"
      />
      <Sweep t={t} d={ICE_RING} evenOdd every={4.2} phase={0.3} />
      <IceJewel t={t} />
      <Glint t={t} x={JX - 1.5} y={JY - 3} size={6} phase={0.2} />
    </Group>
  );
}

const Glacier: ArtBorderDrawing = { back: GlacierBack, front: GlacierFront };

// ── Thunderstorm ─────────────────────────────────────────────────────

/** A strike every PERIOD seconds. */
const PERIOD = 2.6;

/** How bright the strike is, `s` seconds after it began: the leader
 *  creeping out, the stroke, a flicker and a return stroke, fading. */
const strikeLight = (s: number) => {
  "worklet";
  if (s < 0.06) return (0.35 * s) / 0.06;
  if (s < 0.13) return 1;
  if (s < 0.19) return 0.3;
  if (s < 0.27) return 0.95;
  if (s < 0.7) return 0.95 * (1 - (s - 0.27) / 0.43) ** 2;
  return 0;
};

/** Ring of storm cloud churning round, lit where the lightning is. */
const STORM = `
uniform float t;
uniform float flash;
uniform float sx;
uniform float sy;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  float h = (r - 48.0) / 42.0;
  if (h < 0.0 || h > 1.0) return half4(0.0);
  vec2 dir = xy / r;
  float a = t * 0.6;
  vec2 d = vec2(dir.x * cos(a) - dir.y * sin(a), dir.x * sin(a) + dir.y * cos(a));
  vec2 p = d * 2.2 + vec2(h * 1.8, -h * 1.2);
  vec2 w = vec2(fbm(p + t * 0.7), fbm(p - t * 0.6 + 3.1));
  float n = fbm(p * 1.7 + w * 1.9 - vec2(t * 1.1, t * 0.5));
  // billows streaming out, ragged at the edge rather than a round disc
  float tip = 0.42 + 0.8 * fbm(d * 3.4 + vec2(-t * 0.5, t * 0.35));
  float dense = (1.0 - h / tip) * (0.6 + n * 0.9);
  dense = max(dense, (1.0 - smoothstep(0.0, 0.18, h)) * 0.95);
  vec3 col = mix(vec3(0.03, 0.045, 0.11), vec3(0.13, 0.21, 0.46), smoothstep(0.3, 0.58, n));
  col = mix(col, vec3(0.34, 0.52, 0.98), smoothstep(0.54, 0.72, n) * 0.75);
  col *= 1.0 - 0.35 * h;
  float near = pow(max(dot(dir, vec2(sx, sy)), 0.0), 3.0);
  col += vec3(0.5, 0.72, 1.0) * flash * (0.3 + n * 0.9) * (0.2 + 0.9 * near) * (1.0 - h * 0.4);
  float alpha = smoothstep(0.08, 0.32, dense);
  return half4(col * alpha, alpha);
}`;

/** The cloud on the rim, licking in over the picture's edge. */
const STORM_RIM = `
uniform float t;
uniform float flash;
uniform vec2 strike;
${NOISE}
half4 main(vec2 xy) {
  float r = length(xy);
  vec2 dir = xy / r;
  float s = t * 1.5;
  float n = fbm(dir * 3.0 + vec2(s, -s * 0.6));
  float n2 = fbm(dir * 5.0 + vec2(-s * 0.8, s * 0.5));
  float width = 4.5 + 7.0 * n;
  float d = abs(r - 54.0 + (n2 - 0.5) * 5.0);
  float heat = (1.0 - d / width) * (0.6 + n * 0.8);
  if (heat <= 0.0) return half4(0.0);
  vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(0.1, 0.18, 0.42), smoothstep(0.25, 0.7, heat));
  color = mix(color, vec3(0.35, 0.6, 1.0), smoothstep(0.65, 1.0, heat) * 0.8);
  float near = pow(max(dot(dir, strike), 0.0), 3.0);
  color += vec3(0.5, 0.72, 1.0) * flash * (0.3 + heat) * (0.25 + 0.85 * near);
  float a = smoothstep(0.04, 0.4, heat);
  return half4(color * a, a);
}`;

/** A forked bolt running along the clouds: a jagged trunk from `a0`
 *  round the ring, branches splitting off it. */
const bolt = (a0: number, seed: number) => {
  const span = 0.95 + rnd(seed) * 0.45;
  const n = 16;
  let u = 0;
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    // uneven steps, each kinking in or out by a random amount
    if (k) u += (0.5 + rnd(seed + k * 11)) / n;
    const zig = (rnd(seed + k * 3) - 0.5) * 7;
    const r =
      79 -
      8 * Math.sin(Math.PI * Math.min(u, 1)) +
      Math.sin(u * 6 + seed) * 2.5 +
      zig;
    return {
      a: a0 + span * Math.min(u, 1),
      r: Math.max(66, Math.min(85, r)),
    };
  });
  // a smaller kink between every two points: fine jaggedness
  const trunk = `M${pts
    .map((p, k) => {
      if (!k) return at(p.a, p.r);
      const q = pts[k - 1];
      const kink = (rnd(seed + k * 13) - 0.5) * 5;
      return `${at((p.a + q.a) / 2, (p.r + q.r) / 2 + kink)}L${at(p.a, p.r)}`;
    })
    .join("L")}`;
  // branches: one out into the cloud, one down to strike the ring, one more
  const fork = (k: number, dr: number, steps: number, s2: number) => {
    let { a, r } = pts[k];
    let d = `M${at(a, r)}`;
    for (let j = 1; j <= steps; j++) {
      a += 0.035 + rnd(s2 + j) * 0.05;
      r += dr + (rnd(s2 + j * 5) - 0.5) * 4;
      r = Math.max(65, Math.min(86, r));
      d += `L${at(a, r)}`;
    }
    return d;
  };
  const branches =
    fork(4, 3, 5, seed + 50) +
    fork(8, -3.6, 4, seed + 60) +
    fork(11, 2.6, 4, seed + 70) +
    fork(13, -2.8, 3, seed + 80);
  return { trunk, branches, mid: a0 + span * 0.5 };
};
const BOLTS = Array.from({ length: 6 }, (_, k) =>
  bolt(-Math.PI * 0.85 + (k * TAU) / 6 + rnd(k + 90) * 0.4, k * 17 + 3),
);
/** The order the bolts strike in. */
const ORDER = [0, 3, 1, 4, 2, 5];
const STRIKE_DIRS = BOLTS.map((b) => [Math.cos(b.mid), Math.sin(b.mid)]);

/** Fine rain: two sheets of slanting streaks, falling at two speeds. */
const SHEET = 184;
const rainSheet = (count: number, seed: number, len: number) =>
  Array.from({ length: count }, (_, k) => {
    const x = -130 + rnd(seed + k) * 260;
    const y = -92 + rnd(seed + k * 3 + 1) * SHEET;
    const l = len * (0.7 + rnd(seed + k * 5) * 0.6);
    return `M${f(x)} ${f(y)}l${f(-l * 0.28)} ${f(l)}`;
  }).join("");
const RAIN = [
  { d: rainSheet(26, 300, 9), speed: 150, width: 0.7, opacity: 0.4 },
  { d: rainSheet(22, 500, 6), speed: 95, width: 0.5, opacity: 0.25 },
];
const RAIN_CLIP = disc(89);

function Rain({
  t,
  flash,
  d,
  speed,
  width,
  opacity,
}: {
  t: Clock;
  flash: SharedValue<number>;
  d: string;
  speed: number;
  width: number;
  opacity: number;
}) {
  const transform = useDerivedValue(() => {
    const y = (t.value * speed) % SHEET;
    return [{ translateX: -y * 0.28 }, { translateY: y }];
  });
  const lit = useDerivedValue(() => opacity + flash.value * 0.45);
  return (
    <Group transform={transform} opacity={lit}>
      {[0, -SHEET].map((dy) => (
        <Path
          key={dy}
          path={d}
          transform={[{ translateX: -dy * 0.28 }, { translateY: dy }]}
          style="stroke"
          strokeWidth={width}
          strokeCap="round"
          color="#A8C8F4"
        />
      ))}
    </Group>
  );
}

/** The strike's brightness, and which bolt it is. */
function useStrike(t: Clock) {
  const flash = useDerivedValue(() => strikeLight(t.value % PERIOD));
  const which = useDerivedValue(
    () => ORDER[Math.floor(t.value / PERIOD) % ORDER.length],
  );
  return { flash, which };
}

function ThunderBack({ t }: { t: Clock }) {
  const { flash, which } = useStrike(t);
  const uniforms = useDerivedValue<Record<string, number | number[]>>(() => ({
    t: t.value,
    flash: flash.value,
    sx: STRIKE_DIRS[which.value][0],
    sy: STRIKE_DIRS[which.value][1],
  }));
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(RAIN_CLIP), []);
  const glow = useDerivedValue(() => 0.14 + flash.value * 0.5);
  return (
    <Group>
      <Halo r={94} color="#3E6FD9" opacity={glow} />
      <Shaded sksl={STORM} uniforms={uniforms} extent={92} />
      {clip ? (
        <Group clip={clip}>
          {RAIN.map((r, k) => (
            <Rain key={k} t={t} flash={flash} {...r} />
          ))}
        </Group>
      ) : null}
    </Group>
  );
}

/** The bolt of this strike: glow, then a bright core, the trunk racing
 *  out first and the branches following. */
function Lightning({
  t,
  flash,
  which,
}: {
  t: Clock;
  flash: SharedValue<number>;
  which: SharedValue<number>;
}) {
  const paths = useMemo(
    () =>
      BOLTS.map((b) => ({
        trunk: Skia.Path.MakeFromSVGString(b.trunk)!,
        branches: Skia.Path.MakeFromSVGString(b.branches)!,
      })),
    [],
  );
  const trunk = useDerivedValue(() => paths[which.value].trunk);
  const branches = useDerivedValue(() => paths[which.value].branches);
  const reach = useDerivedValue(() => Math.min(1, (t.value % PERIOD) / 0.06));
  const seen = useDerivedValue(() =>
    t.value % PERIOD < 0.7 ? Math.min(1, flash.value * 1.6) : 0,
  );
  const forked = useDerivedValue(() =>
    t.value % PERIOD < 0.05 ? 0 : seen.value,
  );
  return (
    <Group blendMode="screen">
      <Group opacity={seen}>
        <Path
          path={trunk}
          end={reach}
          style="stroke"
          strokeWidth={6}
          strokeJoin="round"
          strokeCap="round"
          color="#5E9BFF"
        >
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path
          path={trunk}
          end={reach}
          style="stroke"
          strokeWidth={2.4}
          strokeJoin="round"
          strokeCap="round"
          color="#B8D6FF"
        />
        <Path
          path={trunk}
          end={reach}
          style="stroke"
          strokeWidth={1.1}
          strokeJoin="round"
          strokeCap="round"
          color="#FFFFFF"
        />
      </Group>
      <Group opacity={forked}>
        <Path
          path={branches}
          style="stroke"
          strokeWidth={5}
          strokeJoin="round"
          strokeCap="round"
          color="#5E9BFF"
        >
          <BlurMask blur={3.5} style="normal" />
        </Path>
        <Path
          path={branches}
          style="stroke"
          strokeWidth={1}
          strokeJoin="round"
          strokeCap="round"
          color="#F2F8FF"
        />
      </Group>
    </Group>
  );
}

const IRON = ["#A8B0BE", "#4C5262", "#1A1E28", "#6E7686"];
const INK_IRON = "#090B10";
const VEIN_IRON = "#262C38";
const IRON_RING = ring(64.5, 59.5);
const STUD_R = 62;
/** Grooves at the ring's edges and a zigzag of lightning between them. */
const IRON_ENGRAVING =
  disc(60.6) +
  disc(63.4) +
  `M${Array.from({ length: 73 }, (_, k) => at(k * 5 * DEG, k % 2 ? 62.7 : 61.3)).join("L")}`;
/** Eight silver bolts set in the ring, each striking in at the picture. */
const STUD_A = Array.from({ length: 8 }, (_, k) => -Math.PI / 2 + k * 45 * DEG);
const studBolt = (a: number) => {
  const c = polar(a, STUD_R);
  // local x across the ring, y in toward the picture
  const ix = -Math.cos(a);
  const iy = -Math.sin(a);
  const P = (x: number, y: number) =>
    `${f(c.x - iy * x + ix * y)} ${f(c.y + ix * x + iy * y)}`;
  return {
    d: `M${P(2.2, -7.2)}L${P(-3.6, 0.9)}L${P(-0.3, 0.9)}L${P(-2.2, 7.2)}L${P(3.6, -1.2)}L${P(0.3, -1.2)}Z`,
    shine: `M${P(1.7, -5.8)}L${P(-2.3, -0.1)}`,
  };
};
const STUDS = STUD_A.map(studBolt);
const STUDS_D = STUDS.map((s) => s.d).join("");

/** Little arcs jumping across the rim. */
const ARCS = Array.from({ length: 4 }, (_, i) => {
  const a = rnd(i + 40) * TAU;
  let d = "";
  for (let k = 0; k <= 4; k++) {
    const p = polar(a + (rnd(i * 7 + k) - 0.5) * 0.12, 47 + k * 4);
    d += `${k ? "L" : "M"}${f(p.x)} ${f(p.y)}`;
  }
  return d;
});

function Arc({ t, k }: { t: Clock; k: number }) {
  const opacity = useDerivedValue(() => {
    const p = ((t.value + k * 0.61) % 1.5) / 0.12;
    return p < 1 ? 1 - p : 0;
  });
  return (
    <Group opacity={opacity} blendMode="screen">
      <Path
        path={ARCS[k]}
        style="stroke"
        strokeWidth={4}
        color="#7FB8FF"
        strokeJoin="round"
      >
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path
        path={ARCS[k]}
        style="stroke"
        strokeWidth={1.2}
        color="#F2F8FF"
        strokeJoin="round"
      />
    </Group>
  );
}

function ThunderFront({ t }: { t: Clock }) {
  const { flash, which } = useStrike(t);
  const uniforms = useDerivedValue<Record<string, number | number[]>>(() => ({
    t: t.value,
    flash: flash.value,
    strike: STRIKE_DIRS[which.value],
  }));
  // the light of the strike, falling on the ring where it hits
  const light = useDerivedValue(() => [
    { translateX: STRIKE_DIRS[which.value][0] * 68 },
    { translateY: STRIKE_DIRS[which.value][1] * 68 },
  ]);
  const studLit = useDerivedValue(() => flash.value * 0.85);
  return (
    <Group>
      <Shaded sksl={STORM_RIM} uniforms={uniforms} extent={70} />
      <Metal
        d={IRON_RING}
        colors={IRON}
        ink={INK_IRON}
        width={1.1}
        vein={IRON_ENGRAVING}
        veinColor={VEIN_IRON}
        shine="M-60 -17A62 62 0 0 1 -40 -47"
      />
      <Group opacity={0.5}>
        <Sweep t={t} d={IRON_RING} evenOdd every={5.2} phase={1.2} />
      </Group>
      {STUDS.map((s, k) => (
        <Metal
          key={k}
          d={s.d}
          colors={SILVER}
          ink={INK_SILVER}
          width={0.9}
          shine={s.shine}
        />
      ))}
      <Group blendMode="screen">
        <Group transform={light} opacity={flash}>
          <Circle cx={0} cy={0} r={22}>
            <RadialGradient
              c={vec(0, 0)}
              r={22}
              colors={["#8AB8FFCC", "#6FA6FF00"]}
            />
          </Circle>
        </Group>
        <Path path={STUDS_D} color="#CFE2FF" opacity={studLit} />
      </Group>
      <Lightning t={t} flash={flash} which={which} />
      {ARCS.map((_, k) => (
        <Arc key={k} t={t} k={k} />
      ))}
      <Glint t={t} x={0} y={-STUD_R} size={5} phase={1.1} speed={0.9} />
    </Group>
  );
}

const Thunderstorm: ArtBorderDrawing = {
  back: ThunderBack,
  front: ThunderFront,
};

export const TEMPEST_ART: Record<string, ArtBorderDrawing> = {
  glacier: Glacier,
  thunderstorm: Thunderstorm,
};

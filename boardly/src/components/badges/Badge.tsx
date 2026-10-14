// A badge: a medallion on its ribbon. The rim's metal says the tier
// (bronze, silver, gold, or a shifting holographic legendary), the
// enamel face is the game's colour, and the emblem in the middle is one
// of the game's own icons. Three things keep it alive, all on one clock:
// a soft halo that breathes in the tier's colour, a band of light that
// sweeps across the face every few seconds, and the emblem's own little
// loop (a flame flickers, a die tips over...). Gold and legendary also
// glint with sparkles.
//
// Locked, it is a dark coin with the emblem pressed in and a ring round
// the rim showing how close it is.

import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { BadgeArt, BadgeLoop, BadgeTier } from "./types";

interface Metal {
  /** Highlight, body, shadow of the rim. */
  rim: [string, string, string];
  glow: string;
  ribbon: string;
}

export const TIER_METAL: Record<BadgeTier, Metal> = {
  bronze: {
    rim: ["#F6CFA3", "#B8713A", "#6E3A16"],
    glow: "#E58A45",
    ribbon: "#7E3E17",
  },
  silver: {
    rim: ["#FFFFFF", "#B7C2CF", "#5D6878"],
    glow: "#BFD8F5",
    ribbon: "#3E5068",
  },
  gold: {
    rim: ["#FFF5BE", "#F2B630", "#8E5A0C"],
    glow: "#FFC94A",
    ribbon: "#9E2A20",
  },
  legendary: {
    rim: ["#FFFFFF", "#C9A8FF", "#5B3FA8"],
    glow: "#B98CFF",
    ribbon: "#3A2878",
  },
};

/** The holographic rim of a legendary badge. */
const HOLO = [
  "#FF6AD5",
  "#C774E8",
  "#8F9CFF",
  "#6FE3FF",
  "#7FFFD4",
  "#FFE66D",
  "#FF9A6A",
  "#FF6AD5",
];
const LOCKED_RIM: [string, string, string] = ["#8A8A90", "#4C4C52", "#2A2A2E"];

/** A hex colour mixed towards white (t > 0) or black (t < 0). */
function tint(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const mix = (c: number) =>
    Math.round(t > 0 ? c + (255 - c) * t : c * (1 + t));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

/** The emblem's own movement at time `t`, in its 24-unit grid. */
function loopTransform(loop: BadgeLoop, t: number) {
  "worklet";
  switch (loop) {
    case "flicker": {
      const s = 1 + 0.07 * Math.sin(t * 9) * Math.sin(t * 3.3);
      return [{ scaleY: s }, { scaleX: 2 - s }];
    }
    case "sway":
      return [{ rotate: 0.13 * Math.sin(t * 1.9) }];
    case "spin":
      return [{ rotate: (t * 0.5) % (Math.PI * 2) }];
    case "bob":
      return [{ translateY: 1.1 * Math.sin(t * 2.2) }];
    case "pulse":
      return [{ scale: 1 + 0.08 * Math.max(0, Math.sin(t * 2.6)) ** 3 }];
    case "tumble": {
      // a quarter turn every 2.6 s, tipping over with a little overshoot
      const step = Math.floor(t / 2.6);
      const p = Math.min(1, (t % 2.6) / 0.45);
      const ease = 1 - (1 - p) ** 3 + 0.12 * Math.sin(p * Math.PI);
      return [{ rotate: (step + ease) * (Math.PI / 2) }];
    }
  }
}

export interface BadgeProps {
  art: BadgeArt;
  tier: BadgeTier;
  /** The canvas: a square this wide. */
  size: number;
  clock: SharedValue<number>;
  locked?: boolean;
  /** 0..1 towards unlocking, shown on a locked badge. */
  progress?: number;
  /** Sets this badge's moments apart from its neighbours'. */
  phase?: number;
  /** The enamel when the art doesn't name one. */
  face?: string;
}

export function Badge({
  art,
  tier,
  size,
  clock,
  locked = false,
  progress = 0,
  phase = 0,
  face: fallbackFace = "#24344F",
}: BadgeProps) {
  const cx = size / 2;
  // room round the medal for its halo, which must fade out inside the canvas
  const cy = size * 0.46;
  const R = size * 0.29;
  const metal = TIER_METAL[tier];
  const rim = locked ? LOCKED_RIM : metal.rim;
  const face = locked ? "#2C2B30" : (art.face ?? fallbackFace);
  const ink = locked ? "#5E5C66" : "#FFF6E6";
  const legendary = tier === "legendary" && !locked;
  const sparkly = (tier === "gold" || legendary) && !locked;

  const medal = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(cx, cy, R);
    return path;
  }, [cx, cy, R]);
  const ribbon = useMemo(() => {
    const w = R * 0.42;
    const top = cy + R * 0.55;
    const bottom = size * 0.97;
    const tail = (dir: number) =>
      `M${cx + dir * R * 0.18} ${top}L${cx + dir * (R * 0.18 + w)} ${top + R * 0.15}` +
      `L${cx + dir * (R * 0.42 + w)} ${bottom}L${cx + dir * (R * 0.3 + w * 0.5)} ${bottom - R * 0.2}` +
      `L${cx + dir * R * 0.18} ${bottom - R * 0.05}z`;
    return `${tail(-1)}${tail(1)}`;
  }, [cx, cy, R, size]);
  const ring = useMemo(() => {
    const path = Skia.Path.Make();
    const r = R * 1.1;
    path.addArc(
      { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
      -90,
      360 * Math.max(0.001, progress),
    );
    return path;
  }, [cx, cy, R, progress]);

  const t = useDerivedValue(() => clock.value + phase);
  // the halo breathes
  const halo = useDerivedValue(() =>
    locked ? 0 : 0.42 + 0.22 * Math.sin(t.value * 1.6),
  );
  const haloB = useDerivedValue(() =>
    legendary ? 0.42 + 0.22 * Math.sin(t.value * 1.6 + Math.PI) : 0,
  );
  // the holographic rim turns
  const holoTurn = useDerivedValue(() => [{ rotate: t.value * 0.7 }]);
  // a band of light crosses the face once every 3.6 s
  const sweep = useDerivedValue(() => {
    const p = (t.value % 3.6) / 0.95;
    const x = p < 1 ? -R * 1.6 + p * R * 3.2 : R * 4;
    return [{ translateX: cx + x }, { translateY: cy }, { rotate: 0.42 }];
  });
  const k = (R * 1.02) / 24;
  const emblem = useDerivedValue(() =>
    locked ? [] : loopTransform(art.loop, t.value),
  );
  const footed = art.loop === "flicker" || art.loop === "sway";
  const origin = vec(12, footed ? 21 : 12);
  const sparkles = useMemo(
    () => [
      { a: -2.2, d: 1.12, s: 0.13, p: 0 },
      { a: -0.6, d: 1.05, s: 0.1, p: 1.3 },
      { a: 0.9, d: 1.14, s: 0.08, p: 2.4 },
      { a: 2.6, d: 0.98, s: 0.11, p: 3.1 },
    ],
    [],
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* halo */}
      {!locked ? (
        <>
          <Circle
            cx={cx}
            cy={cy}
            r={R * 0.98}
            color={legendary ? "#FF6AD5" : metal.glow}
            opacity={halo}
          >
            <BlurMask blur={R * 0.24} style="normal" />
          </Circle>
          {legendary ? (
            <Circle
              cx={cx}
              cy={cy}
              r={R * 0.98}
              color="#6FE3FF"
              opacity={haloB}
            >
              <BlurMask blur={R * 0.24} style="normal" />
            </Circle>
          ) : null}
        </>
      ) : null}

      {/* ribbon tails */}
      <Path path={ribbon} color={locked ? "#3A393F" : metal.ribbon} />
      <Path
        path={ribbon}
        color="rgba(0,0,0,0.25)"
        style="stroke"
        strokeWidth={1}
      />

      {/* rim: metal, or a holographic swirl */}
      <Circle cx={cx} cy={cy} r={R}>
        {legendary ? (
          <SweepGradient
            c={vec(cx, cy)}
            colors={HOLO}
            transform={holoTurn}
            origin={vec(cx, cy)}
          />
        ) : (
          <SweepGradient
            c={vec(cx, cy)}
            colors={[
              rim[0],
              rim[1],
              rim[2],
              rim[1],
              rim[0],
              rim[1],
              rim[2],
              rim[1],
              rim[0],
            ]}
          />
        )}
      </Circle>
      <Circle
        cx={cx}
        cy={cy}
        r={R}
        style="stroke"
        strokeWidth={1.2}
        color="rgba(0,0,0,0.35)"
      />
      {/* the bevel inside the rim */}
      <Circle cx={cx} cy={cy} r={R * 0.84}>
        <LinearGradient
          start={vec(cx, cy - R)}
          end={vec(cx, cy + R)}
          colors={[rim[2], rim[0]]}
        />
      </Circle>
      {/* enamel */}
      <Circle cx={cx} cy={cy} r={R * 0.78}>
        <RadialGradient
          c={vec(cx - R * 0.25, cy - R * 0.3)}
          r={R * 1.1}
          colors={[tint(face, 0.28), face, tint(face, -0.45)]}
        />
      </Circle>

      {/* emblem, with its shadow */}
      <Group
        transform={[
          { translateX: cx - 12 * k },
          { translateY: cy - 12 * k },
          { scale: k },
        ]}
      >
        <Group transform={emblem} origin={origin}>
          <Group
            transform={[{ translateX: 0.5 }, { translateY: 0.8 }]}
            opacity={locked ? 0 : 0.45}
          >
            {art.glyph.fill ? (
              <Path path={art.glyph.fill} color="#000" />
            ) : null}
            {art.glyph.line ? (
              <Path
                path={art.glyph.line}
                style="stroke"
                strokeWidth={1.9}
                color="#000"
                strokeCap="round"
                strokeJoin="round"
              />
            ) : null}
          </Group>
          {art.glyph.fill ? <Path path={art.glyph.fill} color={ink} /> : null}
          {art.glyph.line ? (
            <Path
              path={art.glyph.line}
              style="stroke"
              strokeWidth={1.9}
              color={ink}
              strokeCap="round"
              strokeJoin="round"
            />
          ) : null}
        </Group>
      </Group>

      {/* the sweep of light, across the medal only */}
      {!locked ? (
        <Group clip={medal}>
          <Group transform={sweep}>
            <Rect x={-R * 0.32} y={-R * 2} width={R * 0.64} height={R * 4}>
              <LinearGradient
                start={vec(-R * 0.32, 0)}
                end={vec(R * 0.32, 0)}
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.55)",
                  "rgba(255,255,255,0)",
                ]}
              />
            </Rect>
          </Group>
        </Group>
      ) : null}

      {/* glints */}
      {sparkly
        ? sparkles.map((s, i) => (
            <Sparkle
              key={i}
              t={t}
              x={cx + Math.cos(s.a) * R * s.d}
              y={cy + Math.sin(s.a) * R * s.d}
              size={R * s.s * 2}
              phase={s.p}
            />
          ))
        : null}

      {/* how close a locked badge is */}
      {locked && progress > 0 ? (
        <>
          <Circle
            cx={cx}
            cy={cy}
            r={R * 1.1}
            style="stroke"
            strokeWidth={R * 0.07}
            color="rgba(255,246,230,0.12)"
          />
          <Path
            path={ring}
            style="stroke"
            strokeWidth={R * 0.07}
            strokeCap="round"
            color="#F2B630"
          />
        </>
      ) : null}
    </Canvas>
  );
}

/** A four-pointed glint that flares and fades. */
function Sparkle({
  t,
  x,
  y,
  size,
  phase,
}: {
  t: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  phase: number;
}) {
  const star = useMemo(() => {
    const s = size;
    const w = s * 0.18;
    return `M0 ${-s}Q${w} ${-w} ${s} 0Q${w} ${w} 0 ${s}Q${-w} ${w} ${-s} 0Q${-w} ${-w} 0 ${-s}z`;
  }, [size]);
  const transform = useDerivedValue(() => {
    const p = Math.max(0, Math.sin(t.value * 1.3 + phase * 2.1)) ** 6;
    return [
      { translateX: x },
      { translateY: y },
      { scale: 0.2 + p },
      { rotate: t.value * 0.8 },
    ];
  });
  const opacity = useDerivedValue(
    () => Math.max(0, Math.sin(t.value * 1.3 + phase * 2.1)) ** 4,
  );
  return (
    <Path path={star} color="#FFFFFF" transform={transform} opacity={opacity} />
  );
}

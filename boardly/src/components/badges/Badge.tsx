// A badge: an engraved frame for its level (bronze, silver, gold,
// diamond; Boardly's own or its game's style), the emblem on an enamel
// disc in the game's colour, and, while it moves, a light sweeping the
// metal, glints flaring, and the emblem's own loop (a flame flickers, a
// die tips over). Locked, the whole badge is struck in dark iron.
//
// The frame and emblem are still SVG, parsed once; on a badge that
// doesn't move (a grid of them) nothing is drawn per frame.

import {
  Canvas,
  FillType,
  Group,
  Image as SkImage,
  ImageSVG,
  LinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { badgeImage, badgeSvgs } from "./bake";
import type { BadgeArt, BadgeLoop, BadgeStyle, BadgeTier } from "./types";

/** Each level's glow, for the light round a badge and its words. */
export const TIER_GLOW: Record<BadgeTier, string> = {
  bronze: "#E59A5A",
  silver: "#CFE0F2",
  gold: "#FFC94A",
  diamond: "#A8E4FF",
};

/** The emblem's own movement at time `t`, about its centre (or foot). */
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
      return [{ rotate: 0.2 * Math.sin(t * 0.8) }];
    case "bob":
      return [{ translateY: 1.4 * Math.sin(t * 2.2) }];
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
  /** The level whose frame is drawn. */
  tier: BadgeTier;
  /** Its frames: Boardly's own or its game's. */
  frames: BadgeStyle;
  /** The canvas: a square this wide. */
  size: number;
  clock: SharedValue<number>;
  /** Struck in iron: not reached yet. */
  locked?: boolean;
  /** Sets this badge's moments apart from its neighbours'. */
  phase?: number;
  /** The disc's enamel when the art doesn't name one. */
  face?: string;
  /** Whether it moves at all (a grid of badges stands still). */
  alive?: boolean;
}

export function Badge({
  art,
  tier,
  frames,
  size,
  clock,
  locked = false,
  phase = 0,
  face = "#24344F",
  alive = true,
}: BadgeProps) {
  const tint = art.face ?? face;
  const moving = alive && !locked;
  // a still badge is one picture, recorded once for the whole app
  const still = useMemo(
    () => (moving ? null : badgeImage({ art, tier, frames, tint }, locked, size)),
    [moving, art, tier, frames, tint, locked, size],
  );
  const svgs = useMemo(() => badgeSvgs({ art, tier, frames, tint }), [art, tier, frames, tint]);
  const frame = svgs.frame;
  const sweepPath = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(frame.sweep);
    path?.setFillType(FillType.EvenOdd);
    return path;
  }, [frame.sweep]);

  const t = useDerivedValue(() => clock.value + phase);
  const footed = art.loop === "flicker" || art.loop === "sway";
  const box = svgs.box;
  const emblem = useDerivedValue(() => {
    const origin = footed ? box * 0.86 : box / 2;
    return [
      { translateX: 60 },
      { translateY: 60 - box / 2 + origin },
      ...(moving ? loopTransform(art.loop, t.value) : []),
      { translateX: -box / 2 },
      { translateY: -origin },
    ];
  });
  // a band of light crosses the metal once every 4 s
  const sweep = useDerivedValue(() => {
    const p = (t.value % 4) / 1.1;
    const x = p < 1 ? -30 + p * 180 : 200;
    return [{ translateX: x }, { translateY: 60 }, { rotate: 0.42 }];
  });

  if (still)
    return (
      <Canvas style={{ width: size, height: size }}>
        <SkImage image={still} x={0} y={0} width={size} height={size} />
      </Canvas>
    );

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale: size / 120 }]}>
        <Group>
          {svgs.back ? <ImageSVG svg={svgs.back} x={0} y={0} width={120} height={120} /> : null}
          {svgs.emblem ? (
            <Group transform={emblem}>
              <ImageSVG svg={svgs.emblem} x={0} y={0} width={box} height={box} />
            </Group>
          ) : null}
          {svgs.front ? <ImageSVG svg={svgs.front} x={0} y={0} width={120} height={120} /> : null}
        </Group>

        {moving && sweepPath ? (
          <Group clip={sweepPath}>
            <Group transform={sweep}>
              <Rect x={-9} y={-90} width={18} height={180}>
                <LinearGradient
                  start={vec(-9, 0)}
                  end={vec(9, 0)}
                  colors={["#FFFFFF00", "#FFFFFFB0", "#FFFFFF00"]}
                />
              </Rect>
            </Group>
          </Group>
        ) : null}

        {moving
          ? frame.glints.map(([x, y, s], i) => (
              <Glint key={i} t={t} x={x} y={y} size={s} phase={i * 1.7} />
            ))
          : null}
      </Group>
    </Canvas>
  );
}

/** A four-pointed glint that flares and fades. */
function Glint({
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
    const w = size * 0.18;
    return `M0 ${-size}Q${w} ${-w} ${size} 0Q${w} ${w} 0 ${size}Q${-w} ${w} ${-size} 0Q${-w} ${-w} 0 ${-size}z`;
  }, [size]);
  const transform = useDerivedValue(() => {
    const p = Math.max(0, Math.sin(t.value * 1.3 + phase)) ** 6;
    return [
      { translateX: x },
      { translateY: y },
      { scale: 0.15 + p },
      { rotate: t.value * 0.8 },
    ];
  });
  const opacity = useDerivedValue(
    () => Math.max(0, Math.sin(t.value * 1.3 + phase)) ** 4,
  );
  return <Path path={star} color="#FFFFFF" transform={transform} opacity={opacity} />;
}

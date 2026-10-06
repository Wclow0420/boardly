import { useId, type ReactNode } from "react";
import { View } from "react-native";
import AnimatedGlow, { type GlowConfig } from "react-native-animated-glow";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";

import { Avatar, AvatarBadges, type PresenceStatus } from "@/components/ui";

import {
  getBorder,
  type GlowBorder,
  type RingBorder,
  type ShapeBorder,
} from "./borders";
import { CROWN_PATH, framePath } from "./shapes";

export interface AvatarBorderProps {
  name: string;
  /** Diameter of the avatar itself; the border draws outside it. */
  size: number;
  /** Falls back to the default border when missing or unknown. */
  borderId?: string | null;
  /** Presence dot in the bottom-right corner. */
  presence?: PresenceStatus;
  /** Show the host crown overlay. */
  crown?: boolean;
  /** Coloured ring; only shown with the "No Border" choice, since any
   *  other border takes its place. */
  ringColor?: string;
}

// Borders are drawn in a square this many times the avatar's size, in a
// coordinate space where the avatar's radius is 50.
const CANVAS = 1.9;
const VIEW = 50 * CANVAS;
const VIEW_BOX = `${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`;

/** An avatar wearing a profile border. It takes up only the avatar's own
 *  size in the layout: leave room around it for the border to show. */
export function AvatarBorder({
  name,
  size,
  borderId,
  presence,
  crown,
  ringColor,
}: AvatarBorderProps) {
  const border = getBorder(borderId ?? undefined);
  const badges = <AvatarBadges size={size} presence={presence} crown={crown} />;

  if (border.kind === "glow") {
    return (
      <GlowAvatar border={border} name={name} size={size}>
        {badges}
      </GlowAvatar>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      {border.kind === "ring" ? <Ring border={border} size={size} /> : null}
      {border.kind === "shape" ? <Shape border={border} size={size} /> : null}
      <Avatar
        name={name}
        size={size}
        ringColor={border.kind === "none" ? ringColor : undefined}
      />
      {badges}
    </View>
  );
}

/** Square canvas centred on the avatar, for the SVG-drawn borders. */
function canvasStyle(size: number) {
  const side = size * CANVAS;
  const offset = (size - side) / 2;
  return {
    position: "absolute" as const,
    left: offset,
    top: offset,
    width: side,
    height: side,
  };
}

function Ring({ border, size }: { border: RingBorder; size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { width } = border;
  const mid = 50 + width / 2;

  return (
    <Svg style={canvasStyle(size)} viewBox={VIEW_BOX} pointerEvents="none">
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={border.colors[0]} />
          <Stop offset="1" stopColor={border.colors[1]} />
        </SvgGradient>
      </Defs>
      <Circle r={mid} fill="none" stroke={`url(#${id})`} strokeWidth={width} />
      <Circle r={50 + width} fill="none" stroke={border.rim} strokeWidth={2} />
      <Circle r={50} fill="none" stroke={border.rim} strokeWidth={2} />
    </Svg>
  );
}

function Shape({ border, size }: { border: ShapeBorder; size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { shape, extra } = border;

  return (
    <>
      <Svg style={canvasStyle(size)} viewBox={VIEW_BOX} pointerEvents="none">
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={border.colors[0]} />
            <Stop offset="1" stopColor={border.colors[1]} />
          </SvgGradient>
        </Defs>
        {/* soft shadow, then the plate, its rim and the inner line */}
        <Path
          d={framePath(shape)}
          fill="#000"
          opacity={0.3}
          transform="translate(0 3)"
        />
        <Path
          d={framePath(shape)}
          fill={`url(#${id})`}
          stroke={border.rim}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Path
          d={framePath(shape, 6)}
          fill="none"
          stroke={border.inner}
          strokeOpacity={0.8}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* the socket the avatar sits in */}
        <Circle r={53} fill={border.rim} />
      </Svg>

      {extra === "crown" ? (
        <Svg style={canvasStyle(size)} viewBox={VIEW_BOX} pointerEvents="none">
          <Path
            d={CROWN_PATH}
            fill={border.colors[0]}
            stroke={border.rim}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Circle cx={0} cy={-68} r={3.4} fill="#E5533C" />
          <Circle cx={-11} cy={-66} r={2.4} fill="#5FA8F0" />
          <Circle cx={11} cy={-66} r={2.4} fill="#5FA8F0" />
        </Svg>
      ) : null}
    </>
  );
}

/** Glow presets are tuned for a 72pt avatar; scale them to this one. */
function scaleGlow(glow: GlowConfig, k: number): GlowConfig {
  return {
    ...glow,
    outlineWidth: (glow.outlineWidth ?? 0) * k,
    glowLayers: glow.glowLayers?.map((layer) => ({
      ...layer,
      glowSize: Array.isArray(layer.glowSize)
        ? layer.glowSize.map((n) => n * k)
        : (layer.glowSize ?? 0) * k,
    })),
  };
}

function GlowAvatar({
  border,
  name,
  size,
  children,
}: {
  border: GlowBorder;
  name: string;
  size: number;
  children?: ReactNode;
}) {
  const glow = scaleGlow(border.glow, size / 72);
  const outline = glow.outlineWidth ?? 0;
  const box = size + outline * 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* The glowing outline sits just outside the avatar */}
      <View style={{ position: "absolute", left: -outline, top: -outline }}>
        <AnimatedGlow
          {...glow}
          cornerRadius={border.roundness * box}
          backgroundColor="#141414"
          style={{ width: box, height: box }}
        >
          <View style={{ width: box, height: box, padding: outline }}>
            <Avatar name={name} size={size} radius={border.roundness * size} />
          </View>
        </AnimatedGlow>
      </View>
      {children}
    </View>
  );
}

// A still drawing as plain SVG: for small pictures that never move
// (thumbnails, rules pages, choice cards), where a Skia canvas would be
// more than is needed. Engraved gradients are drawn too.

import { useId } from "react";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

import type { Shape } from "./kit";

/** A shape's gradient as an SVG definition (in the drawing's units). */
export function svgGradient(shape: Shape, id: string) {
  const g = shape.grad;
  if (!g) return null;
  const stops = g.colors.map((c, i) => (
    <Stop key={i} offset={i / Math.max(1, g.colors.length - 1)} stopColor={c} />
  ));
  if (g.radius !== undefined)
    return (
      <RadialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={g.from[0]} cy={g.from[1]} r={g.radius}>
        {stops}
      </RadialGradient>
    );
  if (!g.to) return null;
  return (
    <LinearGradient
      key={id}
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={g.from[0]}
      y1={g.from[1]}
      x2={g.to[0]}
      y2={g.to[1]}
    >
      {stops}
    </LinearGradient>
  );
}

export function IsoPicture({
  shapes,
  width,
  height,
  size,
}: {
  shapes: Shape[];
  /** The drawing's own size. */
  width: number;
  height: number;
  /** Width on the page; the height follows. */
  size: number;
}) {
  const base = `p${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg viewBox={`0 0 ${width} ${height}`} style={{ width: size, height: (size * height) / width }}>
      <Defs>{shapes.map((shape, index) => svgGradient(shape, `${base}${index}`))}</Defs>
      {shapes.map((shape, index) => (
        <Path
          key={index}
          d={shape.d}
          fill={shape.grad && shape.fill ? `url(#${base}${index})` : (shape.fill ?? "none")}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dash}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={shape.opacity}
        />
      ))}
    </Svg>
  );
}

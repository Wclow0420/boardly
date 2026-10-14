// A still drawing as plain SVG: for small pictures that never move
// (thumbnails, rules pages, choice cards), where a Skia canvas would be
// more than is needed.

import Svg, { Path } from "react-native-svg";

import type { Shape } from "./kit";

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
  return (
    <Svg viewBox={`0 0 ${width} ${height}`} style={{ width: size, height: (size * height) / width }}>
      {shapes.map((shape, index) => (
        <Path
          key={index}
          d={shape.d}
          fill={shape.fill ?? "none"}
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

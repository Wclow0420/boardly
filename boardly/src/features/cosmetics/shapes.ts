// Frame outlines, generated in code. Everything is drawn in a coordinate
// space centred on the avatar, whose radius is 50.

import type { FrameShape } from "./borders";

function polygon(points: [number, number][]) {
  return (
    points
      .map(
        ([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
      )
      .join(" ") + " Z"
  );
}

/** Regular polygon with `sides` corners, the first one pointing up. */
function regular(sides: number, radius: number, turn = 0) {
  const points: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + turn + (i * 2 * Math.PI) / sides;
    points.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  return polygon(points);
}

/** The outline of a frame; `inset` shrinks it for the inner line. */
export function framePath(shape: FrameShape, inset = 0): string {
  const k = 1 - inset / 68;
  switch (shape) {
    case "hexagon":
      return regular(6, 68 * k);
    case "octagon":
      return regular(8, 66 * k, Math.PI / 8);
    case "shield": {
      const s = (n: number) => (n * k).toFixed(2);
      return `M ${s(-60)} ${s(-60)} L ${s(60)} ${s(-60)} L ${s(60)} ${s(8)} Q ${s(60)} ${s(54)} 0 ${s(76)} Q ${s(-60)} ${s(54)} ${s(-60)} ${s(8)} Z`;
    }
  }
}

/** A small crown, sitting on the top edge of the frame. */
export const CROWN_PATH =
  "M -19 -60 L -24 -84 L -11 -72 L 0 -90 L 11 -72 L 24 -84 L 19 -60 Z";

// A meeple: the little wooden player piece. Filled for someone in a
// seat, outlined for a seat still open.

import Svg, { Path } from "react-native-svg";

export const MEEPLE_PATH =
  "M12 2.5a3.2 3.2 0 0 1 3.2 3.2c0 1-.4 1.8-1 2.4 2.8.6 6.3 1.8 6.3 3.6 0 1.1-1.6 1.6-3.6 1.6.9 2 2.6 4.6 3.3 6.4.3.8-.2 1.3-1 1.3h-3.6c-.6 0-1-.3-1.3-.8L12 17.4l-2.3 2.8c-.3.5-.7.8-1.3.8H4.8c-.8 0-1.3-.5-1-1.3.7-1.8 2.4-4.4 3.3-6.4-2 0-3.6-.5-3.6-1.6 0-1.8 3.5-3 6.3-3.6-.6-.6-1-1.4-1-2.4A3.2 3.2 0 0 1 12 2.5z";

/** Seat colours, like the pieces in a box: one per player. */
export const MEEPLE_COLORS = [
  "#E8553D",
  "#3E8EDE",
  "#F2B630",
  "#4FB45F",
  "#9B6BD8",
  "#F08A2E",
  "#E46FA8",
  "#3BB8B0",
  "#C9C2B4",
  "#6E5A48",
];

export function Meeple({
  size = 16,
  color,
  empty = false,
}: {
  size?: number;
  color: string;
  /** An open seat: just the outline. */
  empty?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={MEEPLE_PATH}
        fill={empty ? "none" : color}
        stroke={empty ? color : "rgba(0,0,0,0.35)"}
        strokeWidth={empty ? 1.4 : 0.8}
        strokeDasharray={empty ? "2 1.6" : undefined}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

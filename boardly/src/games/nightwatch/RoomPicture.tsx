import { useMemo } from "react";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/theme";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./manorShapes";
import { buildScene } from "./roomScenes";

const NO_ROOMS: number[] = [];

/** A still picture of a room, as it looks when you stand in it. */
export function RoomPicture({ room, width }: { room: number; width: number }) {
  const { colors } = useTheme();
  const shapes = useMemo(() => {
    const scene = buildScene(room, {
      accent: colors.primary,
      collapsed: NO_ROOMS,
      lockedDoor: null,
    });
    return [...scene.back, ...scene.prop, ...scene.front, ...scene.glow, ...scene.glow2];
  }, [room, colors.primary]);

  return (
    <Svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      style={{ width, height: (width * SCENE_HEIGHT) / SCENE_WIDTH }}
    >
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

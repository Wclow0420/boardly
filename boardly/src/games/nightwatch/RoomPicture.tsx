import { useMemo } from "react";

import { IsoPicture } from "@/components/iso";
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
    return [...scene.back, ...scene.prop, ...scene.front];
  }, [room, colors.primary]);

  return <IsoPicture shapes={shapes} width={SCENE_WIDTH} height={SCENE_HEIGHT} size={width} />;
}

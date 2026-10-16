import { IsoPicture } from "@/components/iso";
import { useTheme } from "@/theme";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./manorShapes";
import { buildScene } from "./roomScenes";

const NO_ROOMS: number[] = [];

/** A still picture of a room, as it looks when you stand in it: baked once
 *  and shared by every screen showing it. */
export function RoomPicture({ room, width }: { room: number; width: number }) {
  const { colors } = useTheme();
  return (
    <IsoPicture
      shapes={() => {
        const scene = buildScene(room, { accent: colors.primary, collapsed: NO_ROOMS, lockedDoor: null });
        return [...scene.back, ...scene.prop, ...scene.front];
      }}
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      size={width}
      cacheKey={`manor-room|${room}|${colors.primary}`}
    />
  );
}

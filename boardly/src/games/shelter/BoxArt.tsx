// Shelter's box lid: the house, its fire lit, food on the shelves.

import { IsoPicture } from "@/components/iso";
import { SCENE_HEIGHT, SCENE_WIDTH, shelterScene } from "./shelterScenes";

export function ShelterBoxArt({ width }: { width: number }) {
  return (
    <IsoPicture
      shapes={() => shelterScene(9, "#FF9A4D").shapes}
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      size={width}
      cacheKey="shelter-box"
    />
  );
}

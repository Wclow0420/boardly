// Shelter's box lid: the house, its fire lit, food on the shelves.

import { useMemo } from "react";

import { IsoPicture } from "@/components/iso";
import { SCENE_HEIGHT, SCENE_WIDTH, shelterScene } from "./shelterScenes";

export function ShelterBoxArt({ width }: { width: number }) {
  const shapes = useMemo(() => shelterScene(9, "#FF9A4D").shapes, []);
  return <IsoPicture shapes={shapes} width={SCENE_WIDTH} height={SCENE_HEIGHT} size={width} />;
}

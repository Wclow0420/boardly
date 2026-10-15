// Every friend has their own meeple colour, the same wherever they show.

import { MEEPLE_COLORS } from "@/components/tabletop/Meeple";

export function meepleColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return MEEPLE_COLORS[Math.abs(hash) % MEEPLE_COLORS.length];
}

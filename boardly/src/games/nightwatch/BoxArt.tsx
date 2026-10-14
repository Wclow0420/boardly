// Seal the Manor's box lid: the Chapel, candles lit, the seal waiting.

import { ROOMS } from "./logic";
import { RoomPicture } from "./RoomPicture";

const CHAPEL = ROOMS.indexOf("chapel");

export function ManorBoxArt({ width }: { width: number }) {
  return <RoomPicture room={CHAPEL} width={width} />;
}

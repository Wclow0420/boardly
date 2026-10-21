// A still drawing on screen for the price of its native view. A Skia
// <Canvas> runs a React renderer of its own for its children (a container,
// a recorder, its own tree of nodes), which is a lot to keep for every
// canvas on a page when nothing on it ever changes: a stage of mascots
// had fifty of them. This hands the same native view the picture to draw
// directly, so the pixels are the same. For anything that moves on the
// canvas itself, use a <Canvas>; for still art moved by native transforms
// of its view (a mascot breathing, a curtain sweeping), use this.

import { Skia, SkiaPictureView, type SkCanvas, type SkPicture } from "@shopify/react-native-skia";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

export function StillPicture({
  picture,
  style = StyleSheet.absoluteFill,
}: {
  picture: SkPicture | null;
  /** Where it sits (the whole parent unless told). */
  style?: StyleProp<ViewStyle>;
}) {
  return <SkiaPictureView picture={picture ?? undefined} style={style} pointerEvents="none" />;
}

/** A picture of whatever `draw` draws: for placing and scaling what's
 *  already kept (pictures, small images) on a StillPicture. */
export function record(draw: (canvas: SkCanvas) => void): SkPicture | null {
  const recorder = Skia.PictureRecorder();
  if (!recorder) return null; // tests have no Skia
  draw(recorder.beginRecording(Skia.XYWHRect(-4096, -4096, 8192, 8192)));
  return recorder.finishRecordingAsPicture() ?? null;
}

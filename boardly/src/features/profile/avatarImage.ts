// Pick a profile picture from the photo library and turn it into a
// small square JPEG (base64) for upload — the backend keeps pictures in
// the database, so they're shrunk on the device first.

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";

/** Side of the uploaded square, in pixels. */
const SIZE = 256;

/** Resolves to base64 JPEG data, or null when the player cancels. */
export async function pickAvatarImage(): Promise<string | null> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const { uri, width, height } = result.assets[0];

  // The crop step doesn't run everywhere (e.g. web): centre-crop here too
  const side = Math.min(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (side > 0 && width !== height) {
    context.crop({
      originX: Math.floor((width - side) / 2),
      originY: Math.floor((height - side) / 2),
      width: side,
      height: side,
    });
  }
  context.resize({ width: SIZE, height: SIZE });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    base64: true,
    compress: 0.8,
    format: SaveFormat.JPEG,
  });
  return saved.base64 ?? null;
}

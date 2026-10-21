// A top-to-bottom gradient for a big area (a stage's sky, a room's wall).
// expo-linear-gradient paints its layer into a bitmap the size of the
// view: a full-screen one is ~14 MB, and iOS keeps a second copy for the
// screen. A gradient that only changes downwards looks exactly the same
// drawn a few points wide and stretched across, so that's what this does:
// the same picture, for a sliver of the memory.

import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

/** How wide the strip is drawn, in points, and how far it's stretched:
 *  enough to cover any screen across. */
const STRIP = 4;
const STRETCH = 1200;

export function TallGradient({
  colors,
  locations,
  style = StyleSheet.absoluteFill,
}: {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]] | null;
  /** Where it sits (the whole parent unless told). */
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style, styles.clip]} pointerEvents="none">
      <LinearGradient colors={colors} locations={locations} style={styles.strip} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  strip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: STRIP,
    transformOrigin: [0, 0, 0],
    transform: [{ scaleX: STRETCH }],
  },
});

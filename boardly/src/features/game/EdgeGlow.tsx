// Light bleeding in from the four edges of the screen: the frame of a
// game's full-screen moments (Seal the Manor's hush, Shelter's cough).

import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const BEAT_MS = 1150;

const clear = (color: string) => `${color}00`;

/** Light bleeding in from the four edges of the screen, beating like a
 *  heart. `color` is a six-digit hex. */
export function EdgeGlow({ color, calm = false }: { color: string; calm?: boolean }) {
  const [beat] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const to = (toValue: number, duration: number) =>
      Animated.timing(beat, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      calm
        ? Animated.sequence([to(0.85, 1600), to(0.4, 1600)])
        : // two beats and a rest
          Animated.sequence([to(1, 130), to(0.55, 170), to(0.95, 130), to(0.35, BEAT_MS - 430)])
    );
    loop.start();
    return () => loop.stop();
  }, [beat, calm]);

  // a thin rim: strong at the very edge, gone within a finger's width
  const fade = [`${color}CC`, clear(color)] as const;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: beat }]}>
      <LinearGradient colors={fade} style={[styles.edge, styles.top]} />
      <LinearGradient colors={fade} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[styles.edge, styles.bottom]} />
      <LinearGradient colors={fade} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.edge, styles.left]} />
      <LinearGradient colors={fade} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={[styles.edge, styles.right]} />
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  edge: { position: "absolute" },
  top: { top: 0, left: 0, right: 0, height: 56 },
  bottom: { bottom: 0, left: 0, right: 0, height: 56 },
  left: { top: 0, bottom: 0, left: 0, width: 36 },
  right: { top: 0, bottom: 0, right: 0, width: 36 },
});

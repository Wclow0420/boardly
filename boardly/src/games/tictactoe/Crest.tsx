// Tic-Tac-Toe's header: the parlour crest across the top of the stage
// (art in art.ts, baked once per size). The cross's medallion on the
// left, the nought's on the right, each with its player's name under
// it; a warm light breathes behind the one whose turn it is (and stays
// on the winner). The plaque says whose turn it is, and its nine studs
// count the moves — a sapphire for each cross, a ruby for each nought,
// the newest popping into its socket.

import { Canvas, Circle, Group, Image as SkImage, RadialGradient, vec } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { crestArt, crestLayout, studArt, MARK_LIGHT, type Mark } from "./art";

const STUD = 13;

export function Crest({
  width,
  top,
  title,
  names,
  lit,
  won = false,
  moves,
  paused = false,
}: {
  width: number;
  /** Where the content starts (below the status bar). */
  top: number;
  title: string;
  /** The cross's player, then the nought's. */
  names: [string, string];
  /** The medallion lit: whose turn it is, or the winner. */
  lit: 0 | 1 | null;
  /** The light stays full: the game is won. */
  won?: boolean;
  /** The marks played, in order. */
  moves: Mark[];
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = crestLayout(width, top);
  const image = bakedSvg(`ttt-crest|${top}`, width, L.h, () => crestArt(L));
  const studs = {
    none: bakedSvg("ttt-stud|none", STUD, STUD, () => studArt(null, STUD)),
    X: bakedSvg("ttt-stud|X", STUD, STUD, () => studArt("X", STUD)),
    O: bakedSvg("ttt-stud|O", STUD, STUD, () => studArt("O", STUD)),
  };

  // the light behind the medallion: it slides across as the turn passes
  const m = lit === null ? null : L.medallions[lit];
  const level = useSharedValue(lit === null ? 0 : 1);
  useEffect(() => {
    level.set(withTiming(lit === null ? 0 : 1, { duration: 400 }));
  }, [lit, level]);
  const glow = useDerivedValue(
    () =>
      level.value *
      (won ? 0.85 + 0.1 * Math.sin(clock.value * 2.2) : 0.5 + 0.2 * Math.sin(clock.value * 1.8) + 0.06 * Math.sin(clock.value * 5.1)),
    [won],
  );
  const color = m && lit !== null ? (won ? "#FFD27A" : MARK_LIGHT[lit === 0 ? "X" : "O"]) : "#FFD27A";

  // the newest stud pops into its socket
  const pop = useSharedValue(1);
  const n = moves.length;
  useEffect(() => {
    if (n === 0) return;
    pop.set(0);
    pop.set(withSpring(1, { damping: 9, stiffness: 220 }));
  }, [n, pop]);
  const last = n > 0 ? L.studs[n - 1] : null;
  const popTransform = useDerivedValue(() => {
    if (!last) return [];
    const s = 0.2 + 0.8 * pop.value;
    return [{ translateX: last.x }, { translateY: last.y }, { scale: s }, { translateX: -STUD / 2 }, { translateY: -STUD / 2 }];
  }, [last?.x, last?.y]);
  const fresh = n > 0 ? studs[moves[n - 1]] : null;
  const fade = useDerivedValue(() => Math.min(1, pop.value * 2));

  return (
    <View style={{ width, height: L.h }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} x={0} y={0} width={width} height={L.h} /> : null}
        {m ? (
          <Circle cx={m.x} cy={m.y} r={m.r + 22} opacity={glow} blendMode="screen">
            <RadialGradient c={vec(m.x, m.y)} r={m.r + 22} colors={[`${color}00`, `${color}00`, `${color}CC`, `${color}00`]} positions={[0, 0.5, 0.66, 1]} />
          </Circle>
        ) : null}
        {L.studs.map((s, i) => {
          const kind = i < n - 1 ? moves[i] : i === n - 1 ? null : "none";
          if (kind === null) return null;
          const img = studs[kind];
          return img ? <SkImage key={i} image={img} x={s.x - STUD / 2} y={s.y - STUD / 2} width={STUD} height={STUD} /> : null;
        })}
        {last && studs.none ? (
          <SkImage image={studs.none} x={last.x - STUD / 2} y={last.y - STUD / 2} width={STUD} height={STUD} />
        ) : null}
        {last && fresh ? (
          <Group transform={popTransform}>
            <SkImage image={fresh} x={0} y={0} width={STUD} height={STUD} opacity={fade} />
          </Group>
        ) : null}
      </Canvas>
      {L.medallions.map((md, i) => (
        <AppText
          key={i}
          numberOfLines={1}
          style={[styles.name, { left: md.x - 56, top: md.y + md.r + 4 }, lit === i && styles.nameLit]}
        >
          {names[i]}
        </AppText>
      ))}
      <View style={[styles.plaque, { left: L.plaque.x, top: L.plaque.y + 6, width: L.plaque.w }]}>
        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  name: {
    position: "absolute",
    width: 112,
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: "#D8C4A4",
    ...shadow,
  },
  nameLit: { color: "#FFF2D8", fontFamily: fontFamily.bold },
  plaque: { position: "absolute", alignItems: "center", paddingHorizontal: 18 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: "#3A2408",
    textTransform: "uppercase",
  },
});

// Liar's Dice's header: the dice den's back bar across the top of the
// stage (art in art.ts, baked once per size and table). The ivory plaque
// holds the round and what's on the table; along the shelf stands a glass
// stein for every player, filling with each cup they drink (knocked out
// when it brims), their name and their count under it. A warm light
// breathes behind the stein of whoever the table is waiting on, and a
// stein that has just been filled turns red for a moment.

import { Canvas, Circle, Image as SkImage, RadialGradient, vec } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { denArt, denLayout, steinArt } from "./art";

export interface Tally {
  name: string;
  cups: number;
  out: boolean;
}

export function Den({
  width,
  top,
  title,
  subtitle,
  tally,
  maxCups,
  waiting,
  paused = false,
}: {
  width: number;
  /** Where the content starts (below the status bar). */
  top: number;
  title: string;
  subtitle?: string;
  /** Every player, by seat. */
  tally: Tally[];
  /** Cups that knock you out; null in endless games. */
  maxCups: number | null;
  /** The seat the table is waiting on. */
  waiting: number | null;
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = denLayout(width, top, tally.length);
  const image = bakedSvg(`ld-den|${top}|${tally.length}`, width, L.h, () => denArt(L));
  const sw = L.stein;
  const sh = sw * 1.3;
  // the most anyone has drunk, so an endless game's steins still read
  const most = Math.max(5, ...tally.map((p) => p.cups));
  const full = maxCups ?? most;

  const at = waiting !== null ? L.steins[waiting] : null;
  const glow = useDerivedValue(() => 0.55 + 0.2 * Math.sin(clock.value * 1.9) + 0.06 * Math.sin(clock.value * 5.3));

  // a stein just filled flushes red a moment
  const cups = tally.map((p) => p.cups).join(",");
  const [filled, setFilled] = useState({ cups, seat: -1 });
  if (filled.cups !== cups) {
    const before = filled.cups.split(",").map(Number);
    setFilled({ cups, seat: tally.findIndex((p, i) => p.cups > (before[i] ?? 0)) });
  }
  const flush = useSharedValue(0);
  useEffect(() => {
    if (filled.seat < 0) return;
    flush.set(0);
    flush.set(withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 1600 })));
  }, [filled, flush]);
  const hit = filled.seat >= 0 ? L.steins[filled.seat] : null;

  return (
    <View style={{ width, height: L.h }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} x={0} y={0} width={width} height={L.h} /> : null}
        {at ? (
          <Circle cx={at.x} cy={at.y + sh * 0.55} r={sw * 1.05} opacity={glow} blendMode="screen">
            <RadialGradient c={vec(at.x, at.y + sh * 0.55)} r={sw * 1.05} colors={["#FFC870CC", "#FFC87000"]} />
          </Circle>
        ) : null}
        {hit ? (
          <Circle cx={hit.x} cy={hit.y + sh * 0.55} r={sw * 1.1} opacity={flush} blendMode="screen">
            <RadialGradient c={vec(hit.x, hit.y + sh * 0.55)} r={sw * 1.1} colors={["#FF4A5ADD", "#FF4A5A00"]} />
          </Circle>
        ) : null}
        {tally.map((p, i) => {
          const level = Math.min(full, p.cups);
          const img = bakedSvg(`ld-stein|${level}/${full}|${p.out}`, sw, sh, () => steinArt(level / full, p.out, sw));
          const s = L.steins[i];
          return img ? <SkImage key={i} image={img} x={s.x - sw * 0.42} y={s.y} width={sw} height={sh} /> : null;
        })}
      </Canvas>
      {tally.map((p, i) => {
        const s = L.steins[i];
        return (
          <View key={i} style={[styles.under, { left: s.x - s.each / 2, top: L.shelfY + 3, width: s.each }]}>
            <PlayerName name={p.name} style={[styles.name, styles.wide, i === waiting && styles.nameLit, p.out && styles.nameOut]} />
            <AppText style={[styles.count, p.out && styles.nameOut]} numberOfLines={1}>
              {maxCups !== null ? `${p.cups}/${maxCups}` : String(p.cups)}
            </AppText>
          </View>
        );
      })}
      <View style={[styles.plaque, { left: L.plaque.x, top: L.plaque.y + 5, width: L.plaque.w, height: L.plaque.h - 10 }]}>
        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
};

const styles = StyleSheet.create({
  under: { position: "absolute", alignItems: "center" },
  wide: { alignSelf: "stretch" },
  name: { fontFamily: fontFamily.semiBold, fontSize: 9.5, lineHeight: 12, color: "#E8D2B4", ...shadow },
  nameLit: { color: "#FFE7A8", fontFamily: fontFamily.bold },
  nameOut: { color: "#C87A80" },
  count: { fontFamily: fontFamily.bold, fontSize: 9, lineHeight: 11, color: "#C8A878", ...shadow },
  plaque: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.4,
    color: "#3A2408",
    textTransform: "uppercase",
  },
  subtitle: { fontFamily: fontFamily.semiBold, fontSize: 10.5, lineHeight: 13, color: "#7A5A2A" },
});

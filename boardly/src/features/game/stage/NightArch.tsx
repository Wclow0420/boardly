// The stained-glass arch across the top of the stage (art in
// archArt.ts, baked once per state): the nights as lancet windows,
// tonight's lit from behind and glowing softly, a candle burning on each
// corbel, and the night's name on the stone tablet at the arch's point.

import { Canvas, Circle, Group, Image as SkImage, RadialGradient, vec } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { Fire, useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { archLayout, nightArch, type Pane } from "./archArt";

export function NightArch({
  width,
  top,
  title,
  subtitle,
  panes,
  labels = [],
  paused = false,
}: {
  width: number;
  /** Where the content starts (below the status bar). */
  top: number;
  title: string;
  /** A second, smaller line (the phase). */
  subtitle?: string;
  /** One per night: how it went. */
  panes: Pane[];
  /** Small text in each window (a team size), "" for none. */
  labels?: string[];
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = archLayout(width, top, panes.length);
  const image = bakedSvg(`arch|${panes.join()}|${top}`, width, L.h, () => nightArch(L, panes));
  const now = panes.indexOf("now");
  const win = now >= 0 ? L.windows[now] : null;
  // tonight's window breathes a little light into the stone round it
  const glow = useDerivedValue(() => 0.42 + 0.14 * Math.sin(clock.value * 1.7) + 0.06 * Math.sin(clock.value * 5.3));
  return (
    <View style={{ width, height: L.h }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {win ? (
          <Circle cx={win.mid} cy={win.y + win.h * 0.45} r={46} opacity={glow} blendMode="screen">
            <RadialGradient c={vec(win.mid, win.y + win.h * 0.45)} r={46} colors={["#FFB45E", "#FFB45E00"]} />
          </Circle>
        ) : null}
        {image ? <SkImage image={image} x={0} y={0} width={width} height={L.h} /> : null}
        {L.candles.map((c, i) => (
          <Group key={i}>
            <Circle cx={c.x} cy={c.y - 36} r={18} opacity={glow} blendMode="screen">
              <RadialGradient c={vec(c.x, c.y - 36)} r={18} colors={["#FFC870", "#FFC87000"]} />
            </Circle>
            <Fire x={c.x} y={c.y - 27} width={14} height={24} clock={clock} />
          </Group>
        ))}
      </Canvas>
      {L.windows.map((w, i) =>
        labels[i] ? (
          <AppText key={i} style={[styles.label, { left: w.x, width: w.w, top: w.y + w.h * 0.68 }]}>
            {labels[i]}
          </AppText>
        ) : null,
      )}
      <View style={[styles.tablet, { left: L.tablet.x, top: L.tablet.y, width: L.tablet.w, height: L.tablet.h }]}>
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

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 15,
    color: "#D8E4FF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tablet: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
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

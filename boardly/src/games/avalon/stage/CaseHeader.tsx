// Double Agent's header (art in headerArt.ts, baked once per state):
// the agency crest over a row of case files, one per operation. Alive the
// borders' way, on one clock: a desk lamp's pool of light breathing on
// today's file, the emerald over the crest glowing, a glint catching the
// medallion now and then and a slow sweep of light across its gold.

import {
  Canvas,
  Circle,
  Image as SkImage,
  LinearGradient,
  Path,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { agencyHeader, crestDisc, headerLayout, type FileState } from "./headerArt";
import { glintPath } from "./svg";

export function CaseHeader({
  width,
  top,
  title,
  subtitle,
  files,
  labels = [],
  paused = false,
}: {
  width: number;
  /** Where the content starts (below the status bar). */
  top: number;
  title: string;
  subtitle?: string;
  /** One per operation: how it went. */
  files: FileState[];
  /** On each file's label (a team size), "" for none. */
  labels?: string[];
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = headerLayout(width, top, files.length);
  const image = bakedSvg(`agency-header|${files.join()}|${top}`, width, L.h, () => agencyHeader(L, files));
  const now = files.indexOf("now");
  const file = now >= 0 ? L.files[now] : null;
  const C = L.crest;
  const jewel = { x: C.x, y: C.y - C.r - 2.6 };

  // the lamp's pool on today's file, breathing a little
  const lamp = useDerivedValue(() => 0.3 + 0.08 * Math.sin(clock.value * 1.3) + 0.03 * Math.sin(clock.value * 4.1));
  // the emerald glows, then rests
  const beat = useDerivedValue(() => {
    const p = (clock.value % 3.2) / 3.2;
    return 0.25 + 0.55 * Math.pow(Math.max(0, Math.sin(p * Math.PI * 2)), 3);
  });
  // a glint on the medallion's lit edge every few seconds
  const glint = useDerivedValue(() => {
    const p = ((clock.value + 1.1) % 4.6) / 4.6;
    const k = p < 0.12 ? Math.sin((p / 0.12) * Math.PI) : 0;
    return [
      { translateX: C.x - C.r * 0.62 },
      { translateY: C.y - C.r * 0.62 },
      { scale: 0.001 + k },
      { rotate: p * 2 },
    ];
  });
  // the light sweeping over the medallion's gold
  const sweepAt = useDerivedValue(() => {
    const p = (clock.value % 6) / 6;
    return C.x - 40 + p * 110;
  });
  const sweepFrom = useDerivedValue(() => vec(sweepAt.value - 8, C.y - 14));
  const sweepTo = useDerivedValue(() => vec(sweepAt.value + 8, C.y + 14));
  const disc = crestDisc(L);

  return (
    <View style={{ width, height: L.h }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} x={0} y={0} width={width} height={L.h} /> : null}
        {file ? (
          <Circle cx={file.mid} cy={file.y + file.h * 0.4} r={46} opacity={lamp} blendMode="screen">
            <RadialGradient
              c={vec(file.mid, file.y + file.h * 0.4)}
              r={46}
              colors={["#FFE2A0", "#FFC87000"]}
            />
          </Circle>
        ) : null}
        <Path path={disc} blendMode="screen">
          <LinearGradient start={sweepFrom} end={sweepTo} colors={["#FFFFFF00", "#FFF6D8AA", "#FFFFFF00"]} />
        </Path>
        <Circle cx={jewel.x} cy={jewel.y} r={11} opacity={beat} blendMode="screen">
          <RadialGradient c={vec(jewel.x, jewel.y)} r={11} colors={["#9CFFC0", "#6CFF8E00"]} />
        </Circle>
        <Path path={glintPath(0, 0, 7)} color="#FFFFFF" transform={glint} />
      </Canvas>
      {L.files.map((F, i) => (
        <AppText
          key={`tab${i}`}
          style={[styles.tab, { left: F.tab.x, width: F.tab.w, top: F.y + (files[i] === "now" ? -6 : 0) - 1 }]}
        >
          {i + 1}
        </AppText>
      ))}
      {L.files.map((F, i) =>
        labels[i] ? (
          <AppText
            key={`label${i}`}
            style={[
              styles.label,
              {
                left: F.x + 7,
                width: F.w - 14,
                top: F.y + 18 + (files[i] === "now" ? -6 : 0),
                opacity: files[i] === "ahead" ? 0.75 : 1,
              },
            ]}
          >
            {labels[i]}
          </AppText>
        ) : null,
      )}
      <View style={[styles.plaque, { left: L.plaque.x, top: L.plaque.y, width: L.plaque.w, height: L.plaque.h }]}>
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
  tab: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 8,
    lineHeight: 10,
    color: "#5A3E12",
  },
  label: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 13,
    color: "#2A2010",
  },
  plaque: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
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

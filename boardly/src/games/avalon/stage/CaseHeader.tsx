// Double Agent's header (art in headerArt.ts, baked once per state):
// the agency crest over a row of case files, one per operation. Alive the
// borders' way, on one clock: a desk lamp's pool of light breathing on
// today's file, the emerald over the crest glowing, a glint catching the
// medallion now and then and a slow sweep of light across its gold.

import {
  Canvas,
  Circle,
  Group,
  Image as SkImage,
  LinearGradient,
  Path,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { moveHaptic } from "@/utils/haptics";
import { agencyHeader, crestDisc, headerLayout, markArt, markBox, sealAt, type FileState } from "./headerArt";
import { glintPath } from "./svg";

export function CaseHeader({
  width,
  top,
  title,
  subtitle,
  files,
  labels = [],
  stamp = null,
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
  /** A file just closed on this device (its reveal watched): its seal
   *  comes down on it once. `n` tells one closing from the next. */
  stamp?: { index: number; n: number } | null;
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = headerLayout(width, top, files.length);
  const still = useReducedMotion();

  // the seal coming down on a file just closed: the file is drawn bare
  // under it until it has landed (a header opened later shows it sealed)
  const [landed, setLanded] = useState(() => stamp?.n ?? 0);
  const closed = stamp ? files[stamp.index] : undefined;
  const landing =
    stamp && stamp.n !== landed && !still && (closed === "won" || closed === "lost")
      ? { index: stamp.index, kind: closed }
      : null;
  const fall = useSharedValue(0);
  const stampN = landing ? stamp?.n : undefined;
  useEffect(() => {
    if (stampN === undefined) return;
    fall.set(0);
    fall.set(withTiming(1, { duration: STAMP_MS, easing: Easing.linear }));
    // the thud as it lands, then the file is drawn sealed
    const thud = setTimeout(moveHaptic, STAMP_MS * STAMP_DOWN);
    const done = setTimeout(() => setLanded(stampN), STAMP_MS);
    return () => {
      clearTimeout(thud);
      clearTimeout(done);
    };
  }, [stampN, fall]);
  const bare = landing ? landing.index : -1;
  const image = bakedSvg(`agency-header|${files.join()}|${top}|${bare}`, width, L.h, () => agencyHeader(L, files, bare));
  const B = landing ? markBox(L, landing.index) : null;
  const seal = landing ? sealAt(L, landing.index, landing.kind) : { x: 0, y: 0 };
  const markImage = (only: "band" | "seal") =>
    landing && B
      ? bakedSvg(`agency-mark|${landing.kind}|${only}|${landing.index}|${top}|${width}`, B.w, B.h, () =>
          markArt(L, landing.index, landing.kind, only),
        )
      : null;
  const bandImage = markImage("band");
  const sealImage = markImage("seal");
  // the seal comes down from above, big and faint, landing hard (the
  // band or the typed lines inked in under it as it falls); then a ring
  const markMove = useDerivedValue(() => {
    const a = Math.min(1, fall.value / STAMP_DOWN);
    const s = 1 + 0.9 * (1 - a * a) + (a >= 1 ? 0.06 * Math.max(0, 1 - (fall.value - STAMP_DOWN) / 0.15) : 0);
    return [{ translateX: seal.x }, { translateY: seal.y }, { scale: s }, { translateX: -seal.x }, { translateY: -seal.y }];
  });
  const markAlpha = useDerivedValue(() => Math.min(1, (fall.value / STAMP_DOWN) * 1.6));
  const ring = useDerivedValue(() => Math.max(0, (fall.value - STAMP_DOWN) / (1 - STAMP_DOWN)));
  const ringR = useDerivedValue(() => 10 + ring.value * 16);
  const ringAlpha = useDerivedValue(() => (ring.value > 0 ? 0.75 * (1 - ring.value) : 0));
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
        {landing && B && bandImage && sealImage ? (
          <>
            <SkImage image={bandImage} x={B.x} y={B.y} width={B.w} height={B.h} opacity={markAlpha} />
            <Circle
              cx={seal.x}
              cy={seal.y}
              r={ringR}
              style="stroke"
              strokeWidth={2}
              color={landing.kind === "won" ? "#9CF0B8" : "#FF8A96"}
              opacity={ringAlpha}
            />
            <Group transform={markMove}>
              <SkImage image={sealImage} x={B.x} y={B.y} width={B.w} height={B.h} opacity={markAlpha} />
            </Group>
          </>
        ) : null}
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

/** How long the seal takes to come down and settle, and the part of
 *  that it spends falling. */
const STAMP_MS = 820;
const STAMP_DOWN = 0.3;

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

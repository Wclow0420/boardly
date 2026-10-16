// Liar's Dice's small pieces, drawn from the baked art (art.ts): a row of
// dice on one canvas, the slate a call is chalked on, the call itself
// ("4 × ⚄", zhai or kaizhai), and the felt tray my own dice lie in.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { AppText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { dieArt, slateArt, type DieTone } from "./art";

/** A die's baked image, `size` across (the image has a margin round it
 *  for its shadow and rim: draw it at `dieBox`). */
export function dieImage(face: number, size: number, tone: DieTone = "plain") {
  return bakedSvg(`ld-die|${face}|${tone}`, size * 1.2, size * 1.2, () => dieArt(face, size, tone));
}
/** Where to draw a die's image so the die itself sits at (x, y). */
export const dieBox = (x: number, y: number, size: number) => ({ x: x - size * 0.1, y: y - size * 0.1, width: size * 1.2, height: size * 1.2 });

/** Dice side by side on one canvas. */
export function DiceRow({
  faces,
  size,
  gap = 6,
  tones,
  style,
}: {
  faces: number[];
  size: number;
  gap?: number;
  /** Each die's look (plain when left out). */
  tones?: DieTone[];
  style?: StyleProp<ViewStyle>;
}) {
  const w = faces.length * size + Math.max(0, faces.length - 1) * gap;
  return (
    <View style={[{ width: w + size * 0.2, height: size * 1.2 }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {faces.map((face, i) => {
          const img = dieImage(face, size, tones?.[i] ?? "plain");
          return img ? <SkImage key={i} image={img} {...dieBox(size * 0.1 + i * (size + gap), size * 0.1, size)} /> : null;
        })}
      </Canvas>
    </View>
  );
}

/** The slate in its gold moulding, w × h, with what's chalked on it. */
export function Slate({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const image = bakedSvg("ld-slate", width, height + 6, () => slateArt(width, height));
  return (
    <View style={{ width, height: height + 6 }}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {image ? <SkImage image={image} x={0} y={0} width={width} height={height + 6} /> : null}
      </Canvas>
      <View style={styles.slateBody}>{children}</View>
    </View>
  );
}

/** A call: "4 ×" and the face's die, its kind on a small enamel tag. */
export function Call({
  quantity,
  face,
  zhai,
  size = 46,
  dim = false,
}: {
  quantity: number;
  face: number;
  zhai: boolean;
  size?: number;
  dim?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.call, dim && styles.dim]}>
      <AppText style={[styles.quantity, { fontSize: size * 0.95, lineHeight: size * 1.15 }]}>{quantity}</AppText>
      <AppText style={[styles.times, { fontSize: size * 0.55, lineHeight: size * 0.8 }]}>×</AppText>
      <DiceRow faces={[face]} size={size} />
      <View style={[styles.tag, zhai ? styles.zhai : styles.kaizhai]}>
        <AppText style={[styles.tagText, zhai ? styles.zhaiText : styles.kaizhaiText]}>
          {t(zhai ? "liarsdice.zhai" : "liarsdice.kaizhai")}
        </AppText>
      </View>
    </View>
  );
}

/** The felt tray my own dice lie in, lifted out from under my cup. */
export function Tray({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tray, style]}>
      <LinearGradient colors={["#2E6A4A", "#1A4A30", "#0E2E1C"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={12} t={3} />
      <View style={styles.trayBody}>{children}</View>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  slateBody: { position: "absolute", left: 10, right: 10, top: 12, bottom: 8, alignItems: "center", justifyContent: "center" },
  call: { flexDirection: "row", alignItems: "center", gap: 6 },
  dim: { opacity: 0.55 },
  quantity: { fontFamily: fontFamily.bold, color: "#FFF6E0", ...shadow },
  times: { fontFamily: fontFamily.semiBold, color: "#E8D2B4", ...shadow },
  tag: { marginLeft: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  zhai: { backgroundColor: "#9A1828", borderColor: "#FF8A94" },
  kaizhai: { backgroundColor: "#E2B04A", borderColor: "#FFF2B8" },
  tagText: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  zhaiText: { color: "#FFF2F0" },
  kaizhaiText: { color: "#3A2408" },
  tray: { borderRadius: 12, overflow: "hidden" },
  trayBody: { paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 8 },
});

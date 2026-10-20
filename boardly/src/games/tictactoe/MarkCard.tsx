// My mark, held in my hand on the dock (GameStage's dock): a walnut token
// in a gold bezel with my engraved cross or nought on it. Lifted, it
// turns over into a parlour card: my mark large in a sapphire window, its
// name on the plaque, who moves first (always the cross) and the one rule.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { CardFront, FRONT, type FrontStyle } from "@/components/tabletop/cards/PlayingCard";
import { AppText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { markArt, type Mark } from "./art";
import { FIRST_SEAT, SYMBOLS, WIN_LINES } from "./logic";

const PARLOUR_FRONT: FrontStyle = {
  window: ["#5A7ABE", "#22356A", "#0C1634"],
  plaque: ["#C8904A", "#8A5A24", "#4A2A0E"],
  arch: "round",
};

/** A mark on its own, `size` across. */
export function MarkImage({ kind, size }: { kind: Mark; size: number }) {
  const image = bakedSvg(`ttt-token|${kind}`, size, size, () => markArt(kind, size));
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? <SkImage image={image} x={0} y={0} width={size} height={size} /> : null}
      </Canvas>
    </View>
  );
}

/** The token in my hand, drawn in a box `width` wide and 1.4× as tall
 *  (the dock's card box): a walnut disc in a gold bezel, my mark on it. */
export function MarkToken({ kind, width }: { kind: Mark; width: number }) {
  const d = width;
  return (
    <View style={[styles.tokenBox, { width, height: width * 1.4 }]} pointerEvents="none">
      <View style={[styles.disc, { width: d, height: d, borderRadius: d / 2 }]}>
        <LinearGradient colors={["#7A4A26", "#4A2A12", "#2A1608"]} style={StyleSheet.absoluteFill} />
        <BezelOverlay r={d / 2} t={Math.max(2, d * 0.07)} />
        <MarkImage kind={kind} size={d * 0.62} />
      </View>
    </View>
  );
}

/** The card it turns into, `width` wide (its height is 1.4×). */
export function MarkFace({ kind, width }: { kind: Mark; width: number }) {
  const { t } = useTranslation();
  const s = width / 100;
  const W = FRONT.window;
  const P = FRONT.plaque;
  const B = FRONT.body;
  const first = SYMBOLS[FIRST_SEAT];
  const line = WIN_LINES[0].length;
  return (
    <CardFront width={width} front={PARLOUR_FRONT}>
      <View style={[styles.centre, { position: "absolute", left: W.x * s, top: (W.y + 6) * s, width: W.w * s, height: (W.h - 6) * s }]}>
        <MarkImage kind={kind} size={40 * s} />
      </View>
      <View style={[styles.centre, { position: "absolute", left: P.x * s, top: P.y * s, width: P.w * s, height: P.h * s }]}>
        <AppText style={[styles.name, { fontSize: 5.4 * s, lineHeight: 7.4 * s }]} numberOfLines={1}>
          {t("tictactoe.hand.title", { mark: t(`tictactoe.marks.${kind}`) })}
        </AppText>
      </View>
      <View style={[styles.body, { position: "absolute", left: B.x * s, top: (B.y + 2) * s, width: B.w * s, height: B.h * s, gap: 3 * s }]}>
        <AppText style={[styles.first, { fontSize: 4.4 * s, lineHeight: 5.8 * s }]}>
          {t(kind === first ? "tictactoe.hand.youFirst" : "tictactoe.hand.youSecond", { mark: t(`tictactoe.marks.${first}`) })}
        </AppText>
        <AppText style={[styles.rule, { fontSize: 3.9 * s, lineHeight: 5.3 * s }]}>
          {t("tictactoe.table.line", { count: line, cells: line * line })}
        </AppText>
      </View>
    </CardFront>
  );
}

const styles = StyleSheet.create({
  tokenBox: { alignItems: "center", justifyContent: "center" },
  disc: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  centre: { alignItems: "center", justifyContent: "center" },
  name: {
    fontFamily: fontFamily.bold,
    color: "#FFF6E0",
    letterSpacing: 1,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: { alignItems: "center", justifyContent: "center" },
  first: { fontFamily: fontFamily.bold, color: "#1E3A6A", textAlign: "center" },
  rule: { fontFamily: fontFamily.medium, color: "#3A2408", textAlign: "center" },
});

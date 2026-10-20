// The badge hall's popup: a dark wooden card in a gilded frame with
// corner pieces, the title on a crimson enamel sign over its top edge,
// a gold-rimmed stud to close it. Opened from the hall (a badge's four
// levels), so it wears the hall's style rather than the plain card.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Canvas, Image as SkImage } from "@shopify/react-native-skia";

import { bakedSvg } from "@/components/badges/bake";

import { Emblem } from "@/components/icons";
import { AppText, BezelOverlay, IconButton, useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { popupArt, raysArt } from "./art";

export function BadgePopup({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [{ w, h }, onLayout] = useBox();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centre}>
        <Pressable accessibilityLabel={t("rules.close")} onPress={onClose} style={styles.dim} />
        <View style={styles.wrap}>
          <View style={styles.card} onLayout={onLayout}>
            {w > 0 ? <PopupCard w={w} h={h} /> : null}
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
          {/* the sign over the top edge */}
          <View style={styles.signRow} pointerEvents="none">
            <View style={styles.sign}>
              <LinearGradient colors={["#D2384A", "#9A1828", "#5A0812"]} style={StyleSheet.absoluteFill} />
              <BezelOverlay r={12} t={4} />
              <AppText style={styles.signText} numberOfLines={1}>
                {title}
              </AppText>
            </View>
          </View>
          {/* the stud that closes it */}
          <IconButton accessibilityLabel={t("rules.close")} onPress={onClose} size={38} style={styles.close}>
            <LinearGradient colors={["#5A606A", "#24282E"]} style={styles.closeFace} />
            <BezelOverlay r={19} t={3} />
            <Emblem emoji="✕" size={14} />
          </IconButton>
        </View>
      </View>
    </Modal>
  );
}

/** The card's wood and gilt, baked once per size. */
function PopupCard({ w, h }: { w: number; h: number }) {
  const image = bakedSvg("popup", w, h, () => popupArt(w, h));
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {image ? <SkImage image={image} x={0} y={0} width={w} height={h} /> : null}
    </Canvas>
  );
}

/** Rays of the level's colour turning slowly behind a badge. */
export function BadgeRays({ size, color }: { size: number; color: string }) {
  const still = useReducedMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    turn.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1);
    return () => cancelAnimation(turn);
  }, [still, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        <RaysImage size={size} color={color} />
      </Canvas>
    </Animated.View>
  );
}

const CARD_MAX = 400;

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(8,5,3,0.78)" },
  wrap: { width: "100%", maxWidth: CARD_MAX, maxHeight: "86%" },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  body: { paddingTop: 40, paddingBottom: 22, paddingHorizontal: 20 },
  signRow: { position: "absolute", left: 0, right: 0, top: -21, alignItems: "center" },
  sign: {
    minWidth: 180,
    maxWidth: 300,
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  signText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 1,
    color: "#FFF2D0",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  close: { position: "absolute", right: -10, top: -12 },
  closeFace: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 19 },
});

function RaysImage({ size, color }: { size: number; color: string }) {
  const image = bakedSvg(`rays|${color}`, size, size, () => raysArt(size, color));
  return image ? <SkImage image={image} x={0} y={0} width={size} height={size} /> : null;
}

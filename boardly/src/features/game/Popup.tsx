import { Canvas, Group, Image as SkImage, rect } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import type { Jewel } from "@/components/engraved/shapes";
import { Emblem } from "@/components/icons";
import { AppText, BezelOverlay, IconButton, useBox } from "@/components/ui";
import { fontFamily, useTheme } from "@/theme";
import { popupPanel } from "./popupArt";

/** A game's own colours for its popups. */
export interface PopupLook {
  /** The sign over the top edge, top to bottom. */
  enamel: readonly string[];
  /** The jewel in the corner pieces. */
  jewel?: Jewel;
  /** The light falling on the card from the top. */
  glow?: string;
}

const PLAIN: PopupLook = { enamel: ["#D2384A", "#9A1828", "#5A0812"], jewel: "ruby", glow: "#FFD58A" };

export interface PopupProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  look?: PopupLook;
}

/** A card in the middle of the screen, over the board: a game's panels
 *  (map, notebook, role...) and its prompts all open in one. Shared by
 *  the games that use it (Seal the Manor, Shelter). It wears the house
 *  trim: the game's dark card in a gilded moulding with jewelled
 *  corners, its title on an enamel sign over the top edge, a stud to
 *  close it. The panel is baked once per size. */
export function Popup({ visible, title, onClose, children, look = PLAIN }: PopupProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [{ w, h }, onLayout] = useBox();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <View style={[styles.fill, styles.centre, { padding: spacing.lg }]}>
          <Pressable
            accessibilityLabel={t("rules.close")}
            onPress={onClose}
            style={[StyleSheet.absoluteFill, styles.dim]}
          />
          <View style={styles.wrap}>
            <View style={styles.card} onLayout={onLayout}>
              {w > 0 ? <Panel w={w} h={h} look={look} /> : null}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
              >
                {children}
              </ScrollView>
            </View>
            {/* the title on its sign, over the top edge */}
            <View style={styles.signRow} pointerEvents="none">
              <View style={styles.sign}>
                <LinearGradient colors={look.enamel as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
                <BezelOverlay r={12} t={4} />
                <AppText style={styles.signText} numberOfLines={1}>
                  {title}
                </AppText>
              </View>
            </View>
            <IconButton accessibilityLabel={t("rules.close")} onPress={onClose} size={38} style={styles.close}>
              <LinearGradient colors={["#5A606A", "#24282E"]} style={styles.closeFace} />
              <BezelOverlay r={19} t={3} />
              <Emblem emoji="✕" size={14} />
            </IconButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Panel({ w, h, look }: { w: number; h: number; look: PopupLook }) {
  const { colors } = useTheme();
  const fill = [colors.card, colors.background] as const;
  const glow = look.glow ?? PLAIN.glow!;
  const jewel = look.jewel ?? "ruby";
  // baked in steps of height, not once for every height its content
  // reaches: the top of the panel is drawn down to just above the card's
  // foot, and the panel's own foot (its corners) pinned to the card's
  const bh = Math.ceil(h / 64) * 64;
  const image = bakedSvg(`gamepopup|${fill.join()}|${glow}|${jewel}`, w, bh, () => popupPanel(w, bh, fill, glow, jewel));
  const foot = Math.min(72, h / 2);
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {image ? (
        <>
          <Group clip={rect(0, 0, w, h - foot)}>
            <SkImage image={image} x={0} y={0} width={w} height={bh} />
          </Group>
          <Group clip={rect(0, h - foot, w, foot)}>
            <SkImage image={image} x={0} y={h - bh} width={w} height={bh} />
          </Group>
        </>
      ) : null}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centre: { alignItems: "center", justifyContent: "center" },
  dim: { backgroundColor: "rgba(4,5,10,0.78)" },
  wrap: { width: "100%", maxWidth: 440, maxHeight: "86%", marginTop: 14 },
  card: {
    flexShrink: 1,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  body: { paddingTop: 38, paddingBottom: 24, paddingHorizontal: 22 },
  signRow: { position: "absolute", left: 0, right: 0, top: -21, alignItems: "center" },
  sign: {
    minWidth: 170,
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
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 1,
    color: "#FFF2D0",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  close: { position: "absolute", right: -10, top: -12 },
  closeFace: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 19 },
});

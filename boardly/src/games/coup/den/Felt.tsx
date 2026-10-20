// My turn, on the gambling felt: every action has its box printed on
// the baize (the bluffs double-ruled, each with the role it claims),
// and I lay my chip on one. What I can't afford, or can't choose with
// ten dollars in hand, lies under a shadow.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { AppText, useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { ACTION_EMOJI, ROLE_EMOJI } from "../art";
import { ACTIONS, type ActionType } from "../logic";
import { feltArt, feltLayout } from "./feltArt";

const ROWS = [2, 2, 2, 1];
const CLAIMS = ACTIONS.map((a) => a.claim !== null);

export const Felt = memo(function Felt({
  enabled,
  picked,
  onPick,
}: {
  /** The actions I may take now. */
  enabled: ActionType[];
  picked: ActionType | null;
  onPick: (type: ActionType) => void;
}) {
  const { t } = useTranslation();
  const [{ w, h }, onLayout] = useBox();
  const boxes = w > 0 ? feltLayout(w, h, ROWS) : [];
  const image = w > 0 ? bakedSvg(`hustle-felt|${Math.round(w)}x${Math.round(h)}`, w, h, () => feltArt(w, h, boxes, CLAIMS)) : null;
  const icon = boxes.length ? Math.min(38, boxes[0].h * 0.42) : 0;
  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {image ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <SkImage image={image} x={0} y={0} width={w} height={h} />
          </Canvas>
        </View>
      ) : null}
      {boxes.map((b, i) => {
        const a = ACTIONS[i];
        const on = enabled.includes(a.type);
        const chosen = picked === a.type;
        const wide = b.w > 200;
        return (
          <Animated.View key={a.type} entering={FadeIn.delay(120 + i * 60).duration(300)} style={[styles.box, { left: b.x, top: b.y, width: b.w, height: b.h }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`coup.actions.${a.type}.name`)}
              accessibilityState={{ disabled: !on, selected: chosen }}
              disabled={!on}
              onPress={() => {
                tapHaptic();
                onPick(a.type);
              }}
              style={({ pressed }) => [styles.press, wide && styles.row, pressed && styles.pressed, !on && styles.off]}
            >
              <Emblem emoji={ACTION_EMOJI[a.type]} size={icon} />
              <View style={[styles.words, wide && styles.wordsWide]}>
                <AppText style={styles.name} numberOfLines={1}>
                  {t(`coup.actions.${a.type}.name`)}
                </AppText>
                <AppText style={styles.effect} numberOfLines={1}>
                  {t(`coup.felt.${a.type}`)}
                </AppText>
                {a.claim ? (
                  <AppText style={styles.claim} numberOfLines={1}>
                    {`${ROLE_EMOJI[a.claim]} ${t("coup.felt.claims", { role: t(`coup.roles.${a.claim}.name`) })}`}
                  </AppText>
                ) : (
                  <AppText style={styles.safe} numberOfLines={1}>
                    {a.blockers.length ? t("coup.felt.blockable") : t("coup.felt.sure")}
                  </AppText>
                )}
              </View>
              {a.cost > 0 ? (
                <View style={styles.cost}>
                  <AppText style={styles.costText}>{`$${a.cost}`}</AppText>
                </View>
              ) : null}
            </Pressable>
            {chosen ? (
              <Animated.View entering={ZoomIn.duration(220)} style={styles.chosen} pointerEvents="none">
                <View style={styles.chip}>
                  <Emblem emoji="🪙" size={26} />
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
});

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
};

const styles = StyleSheet.create({
  wrap: { flex: 1, marginHorizontal: 10, marginVertical: 6 },
  box: { position: "absolute" },
  press: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, gap: 2 },
  row: { flexDirection: "row", gap: 12 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  off: { opacity: 0.32 },
  words: { alignItems: "center" },
  wordsWide: { alignItems: "flex-start" },
  name: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 17, color: "#FFF2D8", ...shadow },
  effect: { fontFamily: fontFamily.semiBold, fontSize: 11.5, lineHeight: 14, color: "#FFE08A", ...shadow },
  claim: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14, color: "#F4D8C8", ...shadow },
  safe: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14, color: "#B8D8C4", ...shadow },
  cost: {
    position: "absolute",
    right: 6,
    top: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "rgba(20,8,4,0.6)",
    borderWidth: 1,
    borderColor: "#C8962E",
  },
  costText: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 15, color: "#FFD27A" },
  chosen: {
    position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: "#FFD27A",
    backgroundColor: "rgba(255,210,122,0.14)",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  chip: { position: "absolute", left: 4, top: 4 },
});

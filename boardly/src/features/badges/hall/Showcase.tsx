// The showcase: the (up to four) badges a player shows on their card,
// each on a lit gold pedestal in a velvet-lined glass case, its name on
// a plate beneath. Empty pedestals invite a pick. Only these four move.

import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SharedValue } from "react-native-reanimated";
import { SvgXml } from "react-native-svg";

import type { BadgeRecord } from "@/api/client";
import { Badge } from "@/components/badges/Badge";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { badgeArt } from "../art";
import { badgeText } from "../strings";
import { showcaseCase } from "./art";

export const SHOWCASE_SIZE = 4;
const HEIGHT = 196;

export function Showcase({
  width,
  badges,
  clock,
  onOpen,
}: {
  width: number;
  /** The badges shown, in order (up to four). */
  badges: BadgeRecord[];
  clock: SharedValue<number>;
  onOpen: (badge: BadgeRecord) => void;
}) {
  const { t } = useTranslation();
  const art = useMemo(() => showcaseCase(width, HEIGHT, SHOWCASE_SIZE), [width]);
  const slot = (width - 30) / SHOWCASE_SIZE;
  const size = Math.min(92, slot * 1.02);
  return (
    <View style={{ width, height: HEIGHT }}>
      <SvgXml xml={art.caseSvg} width={width} height={HEIGHT} style={StyleSheet.absoluteFill} />
      {art.centres.map((cx, i) => {
        const badge = badges[i];
        const left = cx - size / 2;
        // the badge's frame fills its box; stand it on the pedestal
        const top = art.standAt - size * 0.9;
        if (!badge) {
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.empty, { left: cx - 22, top: art.standAt - 58 }]}
            >
              <AppText style={styles.plus}>+</AppText>
            </View>
          );
        }
        const { art: look, face, frames } = badgeArt(badge.key, badge.gameType);
        return (
          <Pressable
            key={badge.key}
            accessibilityRole="button"
            accessibilityLabel={badgeText(t, badge.key).name}
            onPress={() => {
              tapHaptic();
              onOpen(badge);
            }}
            style={[styles.slot, { left, top, width: size, height: size }]}
          >
            <Badge
              art={look}
              face={face}
              frames={frames}
              tier={badge.tier ?? "bronze"}
              size={size}
              clock={clock}
              phase={i * 1.3}
            />
          </Pressable>
        );
      })}
      {/* the glass, over everything in the case */}
      <SvgXml
        xml={art.glass}
        width={width}
        height={HEIGHT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* name plates along the floor */}
      {art.centres.map((cx, i) => (
        <View
          key={`n${i}`}
          pointerEvents="none"
          style={[styles.plate, { left: cx - slot / 2 + 3, width: slot - 6, top: HEIGHT - 27 }]}
        >
          <AppText numberOfLines={1} style={[styles.plateText, !badges[i] && styles.plateEmpty]}>
            {badges[i] ? badgeText(t, badges[i].key).name : t("badges.hall.emptySlot")}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute" },
  empty: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(242,204,114,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { color: "rgba(242,204,114,0.75)", fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 24 },
  plate: {
    position: "absolute",
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F4EEDF",
    borderWidth: 1.5,
    borderColor: "#C8902E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  plateText: { fontFamily: fontFamily.semiBold, fontSize: 9.5, lineHeight: 12, color: "#4A2E10" },
  plateEmpty: { color: "#9A8460" },
});

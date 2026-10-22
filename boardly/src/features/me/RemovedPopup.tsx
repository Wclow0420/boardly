// The word waiting on the Me tab after the host took me off a waiting
// table: the mailbox's letter board (the lift directory's black felt in
// its brass deco frame), small, with one line and an OK.

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { stillSvg } from "@/components/badges/bake";
import { AppText, Button, StillPicture } from "@/components/ui";
import { BOARD_RIM, directoryArt } from "@/features/games/lift/art";
import { fontFamily } from "@/theme";

const H = 230;

export function RemovedPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const w = Math.min(340, width - 32);
  const board = useMemo(() => stillSvg(`me-mail|${w}x${H}`, w, H, () => directoryArt(w, H)), [w]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={t("common.ok")}>
        <Pressable style={{ width: w, height: H }} onPress={() => {}}>
          <StillPicture picture={board} style={{ width: w, height: H }} />
          <View style={[StyleSheet.absoluteFill, { padding: BOARD_RIM + 12 }]}>
            <AppText style={styles.title}>{t("lobby.removed.title")}</AppText>
            <View style={styles.rule} />
            <View style={styles.body}>
              <AppText style={styles.text}>{t("lobby.removed.message")}</AppText>
            </View>
            <Button label={t("common.ok")} variant="secondary" size="sm" onPress={onClose} style={styles.close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,5,3,0.72)" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 2,
    color: "#F4EEDF",
    textAlign: "center",
    textTransform: "uppercase",
  },
  rule: { height: 1.5, backgroundColor: "#FF8A7A", opacity: 0.7, marginVertical: 8, marginHorizontal: 40 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  text: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21, color: "#F4EEDF", textAlign: "center" },
  close: { alignSelf: "center", marginTop: 8, minWidth: 120 },
});

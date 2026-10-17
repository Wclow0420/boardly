// The table's invite as a code to scan, in a popup in the room's style:
// the join link's QR code (qr.ts, drawn here: no native library) on an
// ivory card in a brass moulding, the table's code under it, and the
// Share button (the lobby's share sheet, or the link copied).

import { Canvas, Image as SkImg } from "@shopify/react-native-skia";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { bakedSvg } from "@/components/badges/bake";
import { moulding } from "@/components/engraved/panel";
import { AppText, Button } from "@/components/ui";
import { Popup } from "@/features/game/Popup";
import { fontFamily } from "@/theme";
import { svg } from "./art";
import { qrEncode, qrPath } from "./qr";
import type { RoomLook } from "./rooms";

const CARD = 232;

/** The code on its card, CARD square: ivory in a brass moulding, the
 *  modules in walnut ink, four modules of quiet margin round them. */
function qrCardArt(link: string) {
  const code = qrEncode(link);
  const rim = 9;
  const inner = CARD - 2 * rim;
  const units = code ? code.size + 8 : 1;
  const k = inner / units;
  return svg(
    CARD,
    CARD,
    `<defs><linearGradient id="qi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F4EEDF"/></linearGradient></defs>
<path d="M2 5H${CARD - 2}V${CARD}H2Z" fill="#000" fill-opacity="0.45"/>
<rect x="${rim}" y="${rim}" width="${inner}" height="${inner}" fill="url(#qi)"/>
${code ? `<path transform="translate(${rim} ${rim}) scale(${+k.toFixed(4)})" d="${qrPath(code, 4)}" fill="#24160A"/>` : ""}
${moulding(0, 0, CARD, CARD, 12, rim, "qm")}`,
  );
}

export function QrPopup({
  visible,
  onClose,
  link,
  code,
  look,
  shared,
  onShare,
}: {
  visible: boolean;
  onClose: () => void;
  /** The join link the code holds. */
  link: string;
  code: string;
  look: RoomLook;
  /** The link went to the clipboard (no share sheet). */
  shared?: boolean;
  onShare: () => void;
}) {
  const { t } = useTranslation();
  const image = visible ? bakedSvg(`lobby-qr|${link}`, CARD, CARD, () => qrCardArt(link)) : null;
  return (
    <Popup visible={visible} title={t("lobby.floor.qrTitle")} onClose={onClose} look={look.popup}>
      <View style={styles.body}>
        <View style={styles.card} accessible accessibilityLabel={t("lobby.floor.qrTitle")}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {image ? <SkImg image={image} x={0} y={0} width={CARD} height={CARD} /> : null}
          </Canvas>
        </View>
        <AppText style={styles.label}>{t("lobby.tableCode")}</AppText>
        <AppText style={styles.code} selectable>
          {code}
        </AppText>
        <AppText style={styles.hint}>{t("lobby.floor.qrHint")}</AppText>
        <Button
          label={shared ? t("lobby.linkCopied") : t("lobby.shareInvite")}
          size="md"
          style={styles.share}
          onPress={onShare}
        />
      </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center" },
  card: { width: CARD, height: CARD, marginTop: 4 },
  label: {
    marginTop: 14,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    color: "#E8C88A",
    textTransform: "uppercase",
  },
  code: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 32, letterSpacing: 6, color: "#FFF2D8" },
  hint: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: "#D8C6A6",
    textAlign: "center",
  },
  share: { alignSelf: "stretch", marginTop: 16 },
});

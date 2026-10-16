// Your mascot's home: it stands on its stage, breathing, and hops when
// tapped; the wardrobe slides up from here. Room to grow: things to do
// with it, and mini-games that earn coins.

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Emblem } from "@/components/icons";
import { AppText, BezelOverlay, Frame, TitlePlaque, Texture } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { CoinPill } from "@/features/coins/CoinPill";
import { asLook } from "@/features/mascot/dress";
import { MascotStage } from "@/features/mascot/MascotStage";
import { useMeepleTransition } from "@/features/mascot/MeepleTransition";
import { Stage } from "@/features/mascot/Stage";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export default function MascotTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useSession();
  const look = useMemo(() => asLook(user?.mascot), [user?.mascot]);
  const go = useMeepleTransition();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: TABLE.table[1] }}>
      <LinearGradient colors={TABLE.table} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TitlePlaque label={t("mascot.tab")} />
        <View style={{ flex: 1 }} />
        <CoinPill amount={user?.coins ?? 0} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <AppText style={styles.hello}>{t("mascot.hello", { name: user?.username ?? "" })}</AppText>
        <Stage width={width - 32}>
          <MascotStage look={look} width={Math.min(220, width * 0.52)} />
        </Stage>
        <AppText style={styles.hint}>{t("mascot.tapToHop")}</AppText>

        {/* the wardrobe: it slides up over everything */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tapHaptic();
            go(() => router.push("/wardrobe"));
          }}
          style={({ pressed }) => [styles.wardrobe, pressed && { opacity: 0.8 }]}
        >
          <LinearGradient colors={TABLE.button} style={styles.wardrobeFill}>
            <Texture radius={16} />
            <BezelOverlay r={16} t={4} />
            <Emblem emoji="👗" size={40} />
            <AppText style={styles.wardrobeText}>{t("mascot.open")}</AppText>
          </LinearGradient>
        </Pressable>

        <Frame tone="wood" style={styles.soon}>
          <Emblem emoji="🎲" size={30} />
          <AppText style={styles.soonText}>{t("mascot.soon")}</AppText>
        </Frame>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 4 },
  body: { alignItems: "center", paddingHorizontal: 16, paddingBottom: 32, gap: 6 },
  hello: { color: TABLE.cream, fontFamily: fontFamily.bold, fontSize: 18, marginTop: 8 },
  hint: { color: TABLE.creamMuted, fontSize: 11, marginTop: -4 },
  wardrobe: {
    marginTop: 12,
    alignSelf: "stretch",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  wardrobeFill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    borderRadius: 16,
  },
  wardrobeText: { color: "#FFFFFF", fontFamily: fontFamily.bold, fontSize: 18 },
  soon: { marginTop: 14, alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  soonText: { flex: 1, color: TABLE.cream, fontSize: 13 },
});

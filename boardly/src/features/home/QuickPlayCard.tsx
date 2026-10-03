import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ChevronRightIcon } from "@/components/icons";
import { AppText } from "@/components/ui";
import { fontFamily, palette, useTheme } from "@/theme";

export interface QuickPlayCardProps {
  onPress?: () => void;
}

/** The yellow gradient hero card — always brand-colored in both themes. */
export function QuickPlayCard({ onPress }: QuickPlayCardProps) {
  const { t } = useTranslation();
  const { radius, shadows } = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={[palette.yellowLight, "#FFC53D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: radius.xl }, shadows.quickPlay]}
      >
        <View style={styles.dice}>
          {DICE_DOTS.map((visible, i) => (
            <View key={i} style={styles.diceCell}>
              {visible ? <View style={styles.diceDot} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.body}>
          <AppText
            style={{ fontFamily: fontFamily.bold, fontSize: 16, color: palette.ink }}
          >
            {t("home.quickPlay")}
          </AppText>
          <AppText
            style={{
              fontFamily: fontFamily.regular,
              fontSize: 11.5,
              color: "rgba(24,32,43,0.62)",
              marginTop: 2,
            }}
          >
            {t("home.quickPlaySubtitle")}
          </AppText>
        </View>
        <View style={styles.arrow}>
          <ChevronRightIcon size={14} color={palette.ink} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// 5-face dice pattern on a 3x3 grid
const DICE_DOTS = [true, false, true, false, true, false, true, false, true];

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  dice: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#fff",
    transform: [{ rotate: "-8deg" }],
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  diceCell: {
    width: "33.333%",
    height: "33.333%",
    alignItems: "center",
    justifyContent: "center",
  },
  diceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.ink,
  },
  body: { flex: 1 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

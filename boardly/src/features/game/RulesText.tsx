import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/theme";

/** A rules page made of plain text from the locale files:
 *  `<i18nKey>.intro` (optional) and `<i18nKey>.items` (bullet points). */
export function RulesText({ i18nKey }: { i18nKey: string }) {
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useTheme();
  const items = t(`${i18nKey}.items`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  return (
    <View style={{ gap: spacing.md }}>
      {i18n.exists(`${i18nKey}.intro`) ? (
        <AppText variant="body" color="textMuted">
          {t(`${i18nKey}.intro`)}
        </AppText>
      ) : null}
      {Array.isArray(items)
        ? items.map((item, index) => (
            <View key={index} style={styles.item}>
              <AppText variant="body" style={{ color: colors.primary }}>
                •
              </AppText>
              <AppText variant="body" style={styles.grow}>
                {item}
              </AppText>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  item: { flexDirection: "row", gap: 8 },
});

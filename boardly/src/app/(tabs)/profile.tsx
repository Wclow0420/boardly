import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api } from "@/api/client";
import { AppText, Avatar, Button, Card, Chip, Screen } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme, useThemeMode, type ThemeMode } from "@/theme";

const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useSession();
  const { spacing } = useTheme();
  const { mode, setMode } = useThemeMode();
  const { language, setLanguage } = useLocale();

  const statsQuery = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => (await api.auth.stats()).stats,
    enabled: user !== null,
  });
  const stats = [
    { label: t("profile.gamesPlayed"), value: statsQuery.data?.gamesPlayed },
    { label: t("profile.wins"), value: statsQuery.data?.wins },
    { label: t("profile.friends"), value: statsQuery.data?.friends },
  ];

  return (
    <Screen>
      <AppText variant="h2">{t("profile.title")}</AppText>

      {/* Identity */}
      <View style={[styles.identity, { marginTop: spacing.xxl }]}>
        <Avatar name={user?.username ?? "?"} size={84} />
        <AppText variant="title" style={{ marginTop: spacing.md }}>
          {user?.username ?? ""}
        </AppText>
      </View>

      {/* Stats */}
      <Card style={[styles.stats, { marginTop: spacing.xl }]}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <AppText variant="title">{stat.value ?? "–"}</AppText>
            <AppText variant="tiny" color="textSubtle" align="center">
              {stat.label}
            </AppText>
          </View>
        ))}
      </Card>

      {/* Settings */}
      <AppText variant="label" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
        {t("profile.settings")}
      </AppText>
      <Card>
        <AppText variant="caption" color="textMuted">
          {t("profile.language")}
        </AppText>
        <View style={[styles.chips, { marginTop: spacing.sm }]}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Chip
              key={lang.code}
              label={lang.label}
              selected={language === lang.code}
              onPress={() => setLanguage(lang.code)}
            />
          ))}
        </View>

        <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.lg }}>
          {t("profile.appearance")}
        </AppText>
        <View style={[styles.chips, { marginTop: spacing.sm }]}>
          {THEME_MODES.map((themeMode) => (
            <Chip
              key={themeMode}
              label={t(`profile.theme.${themeMode}`)}
              selected={mode === themeMode}
              onPress={() => setMode(themeMode)}
            />
          ))}
        </View>
      </Card>

      <Button
        label={t("auth.logout")}
        variant="secondary"
        style={{ marginTop: spacing.xxl }}
        onPress={() => logout()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center" },
  stats: { flexDirection: "row", paddingVertical: 16 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

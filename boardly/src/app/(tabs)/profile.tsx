import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api } from "@/api/client";
import { ChevronRightIcon } from "@/components/icons";
import {
  AppText,
  Card,
  Frame,
  GorhomBottomSheetModal,
  Ribbon,
  Screen,
  TableBackdrop,
  Texture,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useEquippedBorder } from "@/features/cosmetics/store";
import { ChangePasswordSheet } from "@/features/profile/ChangePasswordSheet";
import { DeleteAccountSheet } from "@/features/profile/DeleteAccountSheet";
import { LanguageSheet } from "@/features/profile/LanguageSheet";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocale } from "@/i18n/LocaleContext";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

const ROW_RADIUS = 14;
// Delete Account keeps a red tile so it stands apart from the rest
const DANGER_TILE = {
  fill: ["#D9513B", "#B23A27"] as [string, string],
  border: "#7A2416",
};

type SettingKey = "borders" | "language" | "password" | "logout" | "delete";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useSession();
  const borderId = useEquippedBorder();
  const { spacing } = useTheme();
  const { language } = useLocale();
  const languageSheetRef = useRef<GorhomBottomSheetModal>(null);
  const passwordSheetRef = useRef<GorhomBottomSheetModal>(null);
  const deleteSheetRef = useRef<GorhomBottomSheetModal>(null);

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

  const rows: {
    key: SettingKey;
    icon: string;
    label: string;
    value?: string;
    danger?: boolean;
  }[] = [
    { key: "borders", icon: "🖼️", label: t("profile.borders") },
    {
      key: "language",
      icon: "🌐",
      label: t("profile.language"),
      value: SUPPORTED_LANGUAGES.find((lang) => lang.code === language)?.label,
    },
    { key: "password", icon: "🔑", label: t("profile.changePassword") },
    { key: "logout", icon: "🚪", label: t("auth.logout") },
    {
      key: "delete",
      icon: "🗑️",
      label: t("profile.deleteAccount"),
      danger: true,
    },
  ];

  const openSetting = (key: SettingKey) => {
    tapHaptic();
    if (key === "borders") router.push("/borders");
    else if (key === "language") languageSheetRef.current?.present();
    else if (key === "password") passwordSheetRef.current?.present();
    else if (key === "logout") logout();
    else deleteSheetRef.current?.present();
  };

  return (
    <Screen
      scroll={false}
      style={styles.screen}
      backdrop={<TableBackdrop dim={0.45} />}
    >
      <Ribbon
        label={t("profile.title")}
        colors={TABLE.ribbonGold}
        standalone
        style={styles.title}
      />

      {/* Identity */}
      <View style={styles.identity}>
        <AvatarBorder
          name={user?.username ?? "?"}
          size={68}
          borderId={borderId}
        />
        <AppText variant="title" style={styles.username}>
          {user?.username ?? ""}
        </AppText>
      </View>

      {/* Stats */}
      <Card style={[styles.stats, { marginTop: spacing.lg }]}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <AppText variant="title">{stat.value ?? "–"}</AppText>
            <AppText variant="tiny" color="textSubtle" align="center">
              {stat.label}
            </AppText>
          </View>
        ))}
      </Card>

      {/* Settings: one panel, scrolls inside if it runs out of room */}
      <Ribbon
        label={t("profile.settings")}
        colors={TABLE.ribbonBlue}
        style={{ marginTop: spacing.xl }}
      />
      <Frame tone="wood" style={styles.settings}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.settingsContent}
        >
          {rows.map((row) => (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              onPress={() => openSetting(row.key)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <LinearGradient
                colors={row.danger ? DANGER_TILE.fill : TABLE.button}
                style={[
                  styles.row,
                  {
                    borderColor: row.danger
                      ? DANGER_TILE.border
                      : TABLE.buttonBorder,
                  },
                ]}
              >
                <Texture radius={ROW_RADIUS - 2} />
                <AppText style={styles.rowIcon}>{row.icon}</AppText>
                <AppText
                  numberOfLines={1}
                  style={[styles.grow, styles.rowLabel]}
                >
                  {row.label}
                </AppText>
                {row.value ? (
                  <AppText numberOfLines={1} style={styles.rowValue}>
                    {row.value}
                  </AppText>
                ) : null}
                <ChevronRightIcon size={12} color="#FFFFFF" strokeWidth={2.6} />
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      </Frame>

      <LanguageSheet ref={languageSheetRef} />
      <ChangePasswordSheet ref={passwordSheetRef} />
      <DeleteAccountSheet ref={deleteSheetRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 12 },
  title: { alignSelf: "flex-start" },
  grow: { flex: 1 },
  pressed: { opacity: 0.7 },
  // Extra room above and below the avatar for its border to show
  identity: { alignItems: "center", marginTop: 34 },
  username: { marginTop: 30 },
  stats: { flexDirection: "row", paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  // Fills the rest of the screen; the rows scroll inside it
  settings: { flex: 1, minHeight: 0, paddingTop: 18, paddingBottom: 6 },
  settingsContent: { gap: 10, paddingTop: 4, paddingBottom: 4 },
  // Each setting is its own raised tile, coloured like the Start button
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: ROW_RADIUS,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  rowLabel: { fontFamily: fontFamily.semiBold, fontSize: 14, color: "#FFFFFF" },
  rowValue: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  rowIcon: { fontSize: 18, lineHeight: 24, width: 26, textAlign: "center" },
});

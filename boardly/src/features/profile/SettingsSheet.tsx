// The profile's settings, behind the gear: borders, language, password,
// the legal pages, logging out and deleting the account. Picking one
// closes this sheet and hands the choice back (some open sheets of their
// own).

import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { ComponentType } from "react";

import {
  BinEmblem,
  DoorEmblem,
  FrameEmblem,
  GlobeEmblem,
  KeyEmblem,
  LockEmblem,
  ScrollEmblem,
  type EmblemProps,
} from "@/components/engraved";
import { ChevronRightIcon } from "@/components/icons";
import {
  AppText,
  BottomSheetModal,
  GorhomBottomSheetModal,
  Texture,
} from "@/components/ui";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocale } from "@/i18n/LocaleContext";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export type SettingKey =
  | "borders"
  | "language"
  | "password"
  | "privacy"
  | "terms"
  | "logout"
  | "delete";

const ROW_RADIUS = 14;
// Delete Account keeps a red tile so it stands apart from the rest
const DANGER_TILE = {
  fill: ["#D9513B", "#B23A27"] as [string, string],
  border: "#7A2416",
};

export const SettingsSheet = forwardRef<
  GorhomBottomSheetModal,
  { onPick: (key: SettingKey) => void }
>(function SettingsSheet({ onPick }, ref) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const selfRef = useRef<GorhomBottomSheetModal | null>(null);

  const rows: {
    key: SettingKey;
    Emblem: ComponentType<EmblemProps>;
    label: string;
    value?: string;
    danger?: boolean;
  }[] = [
    { key: "borders", Emblem: FrameEmblem, label: t("profile.borders") },
    {
      key: "language",
      Emblem: GlobeEmblem,
      label: t("profile.language"),
      value: SUPPORTED_LANGUAGES.find((lang) => lang.code === language)?.label,
    },
    { key: "password", Emblem: KeyEmblem, label: t("profile.changePassword") },
    { key: "privacy", Emblem: LockEmblem, label: t("legal.privacy") },
    { key: "terms", Emblem: ScrollEmblem, label: t("legal.terms") },
    { key: "logout", Emblem: DoorEmblem, label: t("auth.logout") },
    {
      key: "delete",
      Emblem: BinEmblem,
      label: t("profile.deleteAccount"),
      danger: true,
    },
  ];

  return (
    <BottomSheetModal
      ref={(node) => {
        selfRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      title={t("profile.settings")}
    >
      <View style={styles.body}>
        {rows.map((row) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            onPress={() => {
              tapHaptic();
              selfRef.current?.dismiss();
              onPick(row.key);
            }}
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
              <row.Emblem size={30} />
              <AppText numberOfLines={1} style={[styles.grow, styles.label]}>
                {row.label}
              </AppText>
              {row.value ? (
                <AppText numberOfLines={1} style={styles.value}>
                  {row.value}
                </AppText>
              ) : null}
              <ChevronRightIcon size={12} color="#FFFFFF" strokeWidth={2.6} />
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 },
  grow: { flex: 1 },
  pressed: { opacity: 0.7 },
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
  label: { fontFamily: fontFamily.semiBold, fontSize: 14, color: "#FFFFFF" },
  value: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
});

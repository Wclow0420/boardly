import { forwardRef, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppText,
  BottomSheetModal,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocale } from "@/i18n/LocaleContext";
import { TABLE, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

/** Bottom sheet: pick the app language. Closes once one is chosen. */
export const LanguageSheet = forwardRef<GorhomBottomSheetModal>(
  function LanguageSheet(_props, ref) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { language, setLanguage } = useLocale();
    const selfRef = useRef<GorhomBottomSheetModal | null>(null);

    return (
      <BottomSheetModal
        ref={(node) => {
          selfRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        title={t("profile.language")}
      >
        <View style={styles.body}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  tapHaptic();
                  setLanguage(lang.code);
                  selfRef.current?.dismiss();
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: colors.well,
                    borderColor: selected
                      ? TABLE.yellow.fill[0]
                      : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="bodyMedium" style={styles.grow}>
                  {lang.label}
                </AppText>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected
                        ? TABLE.yellow.fill[0]
                        : colors.iconMuted,
                    },
                  ]}
                >
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 10,
  },
  grow: { flex: 1 },
  pressed: { opacity: 0.8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TABLE.yellow.fill[0],
  },
});

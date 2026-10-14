import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, IconButton } from "@/components/ui";
import { useTheme } from "@/theme";

export interface PopupProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A card in the middle of the screen, over the board: a game's panels
 *  (map, notebook, role...) and its prompts all open in one. Shared by
 *  the games that use it (Seal the Manor, Shelter). */
export function Popup({ visible, title, onClose, children }: PopupProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <View style={[styles.fill, styles.centre, { padding: spacing.lg }]}>
          <Pressable
            accessibilityLabel={t("rules.close")}
            onPress={onClose}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.head,
                { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
              ]}
            >
              <AppText variant="title" style={styles.grow} numberOfLines={1}>
                {title}
              </AppText>
              <IconButton accessibilityLabel={t("rules.close")} onPress={onClose} filled>
                <AppText variant="title" color="textMuted">
                  ✕
                </AppText>
              </IconButton>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.md,
                paddingBottom: spacing.xl,
              }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  centre: { alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
});

import { forwardRef, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { successHaptic } from "@/utils/haptics";
import { pickAvatarImage } from "./avatarImage";

/** Bottom sheet: choose or remove the profile picture. */
export const PhotoSheet = forwardRef<GorhomBottomSheetModal>(
  function PhotoSheet(_props, ref) {
    const { t } = useTranslation();
    const { user, setAvatar } = useSession();
    const selfRef = useRef<GorhomBottomSheetModal | null>(null);
    const [busy, setBusy] = useState<"choose" | "remove" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = async (kind: "choose" | "remove") => {
      setError(null);
      setBusy(kind);
      try {
        if (kind === "choose") {
          const image = await pickAvatarImage();
          if (image === null) return; // cancelled
          await setAvatar(image);
        } else {
          await setAvatar(null);
        }
        successHaptic();
        selfRef.current?.dismiss();
      } catch (err) {
        setError(
          err instanceof ApiError
            ? t([`errors.${err.code}`, err.message])
            : t("profile.photo.failed")
        );
      } finally {
        setBusy(null);
      }
    };

    return (
      <BottomSheetModal
        ref={(node) => {
          selfRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        title={t("profile.photo.title")}
        onDismiss={() => setError(null)}
      >
        <View style={styles.body}>
          <AppText variant="body" color="textMuted" align="center">
            {t("profile.photo.hint")}
          </AppText>
          <Button
            label={t("profile.photo.choose")}
            loading={busy === "choose"}
            disabled={busy !== null}
            onPress={() => run("choose")}
          />
          {user?.avatarUrl ? (
            <Button
              label={t("profile.photo.remove")}
              variant="secondary"
              loading={busy === "remove"}
              disabled={busy !== null}
              onPress={() => run("remove")}
            />
          ) : null}
          {error ? (
            <AppText variant="caption" color="danger" align="center">
              {error}
            </AppText>
          ) : null}
        </View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
});

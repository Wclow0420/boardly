import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { forwardRef, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
  TextField,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { successHaptic } from "@/utils/haptics";

const MIN_PASSWORD_LENGTH = 6;

/** Bottom sheet: change the account password (signs out other devices). */
export const ChangePasswordSheet = forwardRef<GorhomBottomSheetModal>(
  function ChangePasswordSheet(_props, ref) {
    const { t } = useTranslation();
    const { changePassword } = useSession();
    const selfRef = useRef<GorhomBottomSheetModal | null>(null);

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const reset = () => {
      setCurrent("");
      setNext("");
      setError(null);
    };

    const handleSave = async () => {
      setError(null);
      setSaving(true);
      try {
        await changePassword(current, next);
        successHaptic();
        selfRef.current?.dismiss();
      } catch (err) {
        setError(
          err instanceof ApiError
            ? t([`errors.${err.code}`, err.message])
            : t("common.errorTitle")
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <BottomSheetModal
        ref={(node) => {
          selfRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        title={t("profile.changePassword")}
        onDismiss={reset}
      >
        <View style={styles.body}>
          <TextField
            label={t("profile.currentPassword")}
            value={current}
            onChangeText={setCurrent}
            InputComponent={BottomSheetTextInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label={t("profile.newPassword")}
            value={next}
            onChangeText={setNext}
            InputComponent={BottomSheetTextInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <AppText variant="caption" color={error ? "danger" : "textSubtle"}>
            {error ?? t("profile.changePasswordHint")}
          </AppText>
          <Button
            label={t("profile.savePassword")}
            onPress={handleSave}
            loading={saving}
            disabled={current.length === 0 || next.length < MIN_PASSWORD_LENGTH}
          />
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
});

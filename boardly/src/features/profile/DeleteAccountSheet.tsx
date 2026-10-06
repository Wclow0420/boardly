import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { forwardRef, useState } from "react";
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

/** Bottom sheet: permanently delete the account. Requires the password;
 *  on success the session ends and the app returns to the login screen. */
export const DeleteAccountSheet = forwardRef<GorhomBottomSheetModal>(
  function DeleteAccountSheet(_props, ref) {
    const { t } = useTranslation();
    const { deleteAccount } = useSession();

    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
      setError(null);
      setDeleting(true);
      try {
        await deleteAccount(password);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? t([`errors.${err.code}`, err.message])
            : t("common.errorTitle")
        );
        setDeleting(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        title={t("profile.deleteAccount")}
        onDismiss={() => {
          setPassword("");
          setError(null);
        }}
      >
        <View style={styles.body}>
          <AppText variant="body" color="textMuted">
            {t("profile.deleteAccountMessage")}
          </AppText>
          <TextField
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            InputComponent={BottomSheetTextInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}
          <Button
            label={t("profile.deleteAccountConfirm")}
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            disabled={password.length === 0}
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

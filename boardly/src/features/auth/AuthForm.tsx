import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import { AppText, Button, Screen, TextField } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, register } = useSession();
  const { spacing } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      // Route guards swap the navigator to the signed-in screens
    } catch (err) {
      if (err instanceof ApiError) {
        // Map known codes to localized text, fall back to the server text
        setError(t([`errors.${err.code}`, err.message]));
      } else {
        setError(t("common.errorTitle"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const valid = username.trim().length >= 3 && password.length >= 6;

  return (
    <Screen>
      {/* Brand header */}
      <View style={[styles.brand, { marginTop: spacing.xxxl }]}>
        <AppText variant="display" color="text">
          {t("common.appName")}
        </AppText>
        <AppText variant="bodyMedium" color="textMuted" style={{ marginTop: spacing.sm }}>
          {t("common.tagline")}
        </AppText>
      </View>

      <AppText variant="h2" style={{ marginTop: spacing.xxxl }}>
        {t(mode === "login" ? "auth.loginTitle" : "auth.registerTitle")}
      </AppText>

      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        <TextField
          label={t("auth.username")}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <TextField
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType={mode === "login" ? "password" : "newPassword"}
        />
        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}
        <Button
          label={t(mode === "login" ? "auth.loginCta" : "auth.registerCta")}
          onPress={submit}
          loading={submitting}
          disabled={!valid}
        />
      </View>

      {/* Switch mode */}
      <View style={[styles.switchRow, { marginTop: spacing.xxl }]}>
        <AppText variant="caption" color="textSubtle">
          {t(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}
        </AppText>
        <Pressable
          hitSlop={8}
          onPress={() => {
            tapHaptic();
            router.replace(mode === "login" ? "/register" : "/login");
          }}
        >
          <AppText variant="caption" color="primary">
            {t(mode === "login" ? "auth.registerLink" : "auth.loginLink")}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
});

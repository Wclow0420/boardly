// OTA update standard (see NEW_PROJECT_PLAYBOOK.md): every app checks
// for an EAS Update on launch and on returning to foreground, downloads
// it silently, then PROMPTS the user to restart — never restarts
// mid-session without asking.

import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { useTranslation } from "react-i18next";

export function useOtaUpdates() {
  const { t } = useTranslation();
  // Only prompt once per downloaded update
  const prompted = useRef(false);

  const checkForUpdate = useCallback(async () => {
    // Disabled in dev / Expo Go — Updates only works in real builds
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) return;

      await Updates.fetchUpdateAsync();
      if (prompted.current) return;
      prompted.current = true;

      Alert.alert(t("updates.title"), t("updates.message"), [
        { text: t("updates.later"), style: "cancel" },
        {
          text: t("updates.restart"),
          onPress: () => {
            Updates.reloadAsync().catch(() => {});
          },
        },
      ]);
    } catch {
      // Network errors are expected offline — next foreground retries
    }
  }, [t]);

  useEffect(() => {
    checkForUpdate();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkForUpdate();
    });
    return () => sub.remove();
  }, [checkForUpdate]);
}

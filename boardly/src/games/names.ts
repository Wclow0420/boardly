import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Localized display name for a game. Names live in the locale files
 *  under gameNames.<key>; the backend's name is the fallback for a game
 *  this build has no translation for. */
export function useGameName() {
  const { t } = useTranslation();
  return useCallback(
    (key: string | undefined, fallback?: string | null): string =>
      key
        ? t(`gameNames.${key}`, { defaultValue: fallback ?? key })
        : (fallback ?? ""),
    [t]
  );
}

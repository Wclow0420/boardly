import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ms from "./locales/ms.json";
import zh from "./locales/zh.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "Bahasa Melayu" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export function detectDeviceLanguage(): LanguageCode {
  const deviceLang = getLocales()[0]?.languageCode ?? "en";
  return (
    SUPPORTED_CODES.includes(deviceLang as LanguageCode)
      ? deviceLang
      : "en"
  ) as LanguageCode;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ms: { translation: ms },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: "en",
  interpolation: {
    // React already escapes rendered strings
    escapeValue: false,
  },
});

export default i18n;

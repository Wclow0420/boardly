import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { darkColors, lightColors, type ColorScheme } from "./colors";
import { radius, shadows, spacing, typography } from "./tokens";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "boardly.themeMode";

export interface Theme {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: boolean;
}

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {
        // Fall back to "system" if storage is unavailable
      });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: {
        colors: isDark ? darkColors : lightColors,
        spacing,
        radius,
        typography,
        shadows,
        isDark,
      },
      mode,
      setMode,
    }),
    [isDark, mode, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Re-themes everything inside it: forces the dark palette and layers
 *  `colors` on top. Used by games that bring their own look (a "skin"),
 *  so the shared UI kit — text, buttons, cards, sheets — follows it. */
export function ThemeScope({
  colors,
  active = true,
  children,
}: {
  colors?: Partial<ColorScheme>;
  /** false = leave the surrounding theme untouched. */
  active?: boolean;
  children: ReactNode;
}) {
  const parent = useContext(ThemeContext);
  if (!parent) throw new Error("ThemeScope must be used within ThemeProvider");

  const value = useMemo<ThemeContextValue>(
    () =>
      active
        ? {
            ...parent,
            theme: {
              ...parent.theme,
              colors: { ...darkColors, ...colors },
              isDark: true,
            },
          }
        : parent,
    [parent, colors, active]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Carries the theme across a portal. Content rendered through a
 *  portal host (bottom sheets) takes its context from where the host is
 *  mounted, not from where the sheet is declared — so a sheet opened
 *  inside a ThemeScope would lose the scope. Capture the value at the
 *  call site with useThemeRelay() and re-provide it with <ThemeRelay>. */
export function useThemeRelay(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeRelay must be used within ThemeProvider");
  return ctx;
}

export function ThemeRelay({
  value,
  children,
}: {
  value: ThemeContextValue;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return { mode: ctx.mode, setMode: ctx.setMode, isDark: ctx.theme.isDark };
}

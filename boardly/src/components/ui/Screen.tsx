import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

export interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default true). */
  scroll?: boolean;
  /** Apply horizontal padding (default true). */
  padded?: boolean;
  /** Apply top safe-area padding (default true). Disable when the
   *  screen draws its own full-bleed header under the status bar. */
  inset?: boolean;
  /** Extra space at the bottom, e.g. above a floating tab bar. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  /** Background override — defaults to theme surface. */
  background?: string;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  inset = true,
  bottomInset = 0,
  style,
  background,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: background ?? theme.colors.surface,
  };
  const contentStyle: ViewStyle = {
    paddingTop: inset ? insets.top + theme.spacing.sm : 0,
    paddingHorizontal: padded ? theme.spacing.xl : 0,
    paddingBottom: bottomInset + insets.bottom + theme.spacing.xl,
  };

  if (!scroll) {
    return (
      <View style={[containerStyle, contentStyle, style]}>{children}</View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        contentContainerStyle={[contentStyle, style]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        style={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});

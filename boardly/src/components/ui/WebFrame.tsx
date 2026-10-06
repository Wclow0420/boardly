import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/** Phone-width column the app is laid out in on wide web screens. */
export const WEB_MAX_WIDTH = 480;

/** On web, centers the phone-sized app in the browser window so it
 *  doesn't stretch across a desktop screen. A no-op on native. */
export function WebFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  if (Platform.OS !== "web") return <>{children}</>;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.column,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center" },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: "hidden",
  },
});

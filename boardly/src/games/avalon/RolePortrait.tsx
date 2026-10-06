import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { useTheme } from "@/theme";
import { ROLE_ART } from "./art";
import { ROLE_EMOJI, sideOf, type Role } from "./logic";

/** A role's portrait — registered art, or its placeholder glyph —
 *  framed in its side's colour (agents green, moles red). */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  const { colors } = useTheme();
  const art = ROLE_ART[role];
  const tint = sideOf(role) === "evil" ? colors.danger : colors.success;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.well,
        borderWidth: 1.5,
        borderColor: tint,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {art ? (
        <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AppText style={{ fontSize: size * 0.5, lineHeight: size * 0.66 }}>
          {ROLE_EMOJI[role]}
        </AppText>
      )}
    </View>
  );
}

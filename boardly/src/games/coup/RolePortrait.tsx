import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { ROLE_ART, ROLE_EMOJI, ROLE_TINT } from "./art";
import type { Role } from "./logic";

/** A role's portrait — registered art, or its placeholder glyph. */
export function RolePortrait({ role, size }: { role: Role; size: number }) {
  const art = ROLE_ART[role];
  const tint = ROLE_TINT[role];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: `${tint}2E`,
        borderWidth: 1,
        borderColor: `${tint}66`,
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

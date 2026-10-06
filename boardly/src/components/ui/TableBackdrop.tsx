import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { TABLE, TABLE_BACKGROUND } from "@/theme";

/** The wooden game table behind a page: pass it as a Screen's
 *  `backdrop`. `dim` darkens the art for pages full of lists and forms. */
export function TableBackdrop({ dim = 0 }: { dim?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={TABLE.table} style={StyleSheet.absoluteFill} />
      {TABLE_BACKGROUND ? (
        <Image
          source={TABLE_BACKGROUND}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : null}
      {dim > 0 ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(12,8,5,${dim})` },
          ]}
        />
      ) : null}
    </View>
  );
}

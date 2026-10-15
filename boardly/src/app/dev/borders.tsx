// Development only: every art border, moving, on a device. Tap one to
// see it large. Open with boardly-dev://dev/borders.

import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { BORDERS } from "@/features/cosmetics/borders";
import { useTheme } from "@/theme";

const ART_BORDERS = BORDERS.filter((border) => border.kind === "art");

export default function BordersPreview() {
  const { colors, spacing } = useTheme();
  const [big, setBig] = useState("phoenix");
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          alignItems: "center",
        }}
      >
        {/* the frame borders, large */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 60,
            marginTop: 50,
          }}
        >
          {["golden-aura", "neon-green", "ripple", "vaporwave", "ember", "frost"].map((id) => (
            <View key={id} style={{ padding: 34 }}>
              <AvatarBorder name="Wei" size={96} borderId={id} />
            </View>
          ))}
        </View>
        <View style={{ height: 250, justifyContent: "center", marginTop: 40 }}>
          <AvatarBorder name="Wei" size={130} borderId={big} />
        </View>
        <AppText variant="title">
          {ART_BORDERS.find((b) => b.id === big)?.name}
        </AppText>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            rowGap: 34,
            columnGap: 40,
          }}
        >
          {ART_BORDERS.map((border) => (
            <Pressable
              key={border.id}
              onPress={() => setBig(border.id)}
              style={{ alignItems: "center", width: 90, gap: 26 }}
            >
              <View style={{ marginTop: 22 }}>
                <AvatarBorder name="Wei" size={58} borderId={border.id} />
              </View>
              <AppText variant="tiny" align="center" numberOfLines={1}>
                {border.name}
              </AppText>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 30, marginTop: 20 }}>
          {["fire-dragon", "campfire", "dice-orbit"].map((id) => (
            <AvatarBorder key={id} name="Wei" size={36} borderId={id} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

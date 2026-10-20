// Development only: every art border, moving, on a device. Tap one to
// see it large. Open with boardly-dev://dev/borders; add ?ids=a,b,c to
// show just those large at the top (e.g. ?ids=phoenix,galaxy). Add
// &perf=1 to show only those, at &size= points, with the frame rate:
// how many of a border can move at once.

import { Redirect, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { BORDERS } from "@/features/cosmetics/borders";
import { useTheme } from "@/theme";

const ART_BORDERS = BORDERS.filter((border) => border.kind === "art");

/** Frames drawn in the last second, counted on the UI thread. */
function useFps() {
  const [fps, setFps] = useState(0);
  const frames = useSharedValue(0);
  const since = useSharedValue(0);
  useFrameCallback((frame) => {
    frames.set(frames.get() + 1);
    if (frame.timestamp - since.get() >= 1000) {
      scheduleOnRN(setFps, frames.get());
      frames.set(0);
      since.set(frame.timestamp);
    }
  });
  return fps;
}

export default function BordersPreview() {
  const { colors, spacing } = useTheme();
  const [big, setBig] = useState("phoenix");
  const { ids, perf, size } = useLocalSearchParams<{ ids?: string; perf?: string; size?: string }>();
  const large = ids ? ids.split(",") : ["phoenix", "galaxy"];
  const fps = useFps();
  if (!__DEV__) return <Redirect href="/" />;
  if (perf)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AppText variant="title" align="center">
          {`${fps} fps · ${large.length} borders at ${size ?? 74}pt`}
        </AppText>
        <AppText variant="tiny" align="center">
          {[...new Set(large)].join(", ")}
        </AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 30 }}>
          {large.map((id, i) => (
            <View key={`${id}-${i}`} style={{ padding: Number(size ?? 74) * 0.45 }}>
              <AvatarBorder name="Wei" size={Number(size ?? 74)} borderId={id} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
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
          {large.map((id) => (
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

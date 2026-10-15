// Development only: every engraved emblem, at row size on a settings
// tile and large. Open with boardly-dev://dev/emblems.

import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentType } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BinEmblem,
  DoorEmblem,
  FrameEmblem,
  GlobeEmblem,
  KeyEmblem,
  LockEmblem,
  ScrollEmblem,
  type EmblemProps,
} from "@/components/engraved";
import { AppText } from "@/components/ui";
import { TABLE, useTheme } from "@/theme";

const EMBLEMS: [string, ComponentType<EmblemProps>][] = [
  ["Frame", FrameEmblem],
  ["Globe", GlobeEmblem],
  ["Key", KeyEmblem],
  ["Lock", LockEmblem],
  ["Scroll", ScrollEmblem],
  ["Door", DoorEmblem],
  ["Bin", BinEmblem],
];

export default function EmblemsPreview() {
  const { colors, spacing } = useTheme();
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 10 }}>
        {EMBLEMS.map(([name, Emblem]) => (
          <LinearGradient
            key={name}
            colors={name === "Bin" ? ["#D9513B", "#B23A27"] : TABLE.button}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <Emblem size={28} />
            <AppText style={{ color: "#FFFFFF", flex: 1 }}>{name}</AppText>
            <Emblem size={56} />
            <Emblem size={112} />
          </LinearGradient>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

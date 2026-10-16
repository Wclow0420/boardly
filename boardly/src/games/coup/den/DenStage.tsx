// Hustle's stage: the shared GameStage (features/game/stage) in the warm
// dark of the back room, under the den's eave (DenSign: whose turn it is,
// how many are still in, every player's tile on the rack), with what's
// at stake on small enamel tags under it.

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, BezelOverlay } from "@/components/ui";
import { GameStage, type StageLook } from "@/features/game/stage/GameStage";
import { fontFamily } from "@/theme";
import { DenSign, denHeight, type DenTile } from "./DenSign";

/** The back room: smoky maroon over dark boards, lantern-red light. */
export const DEN: StageLook = { sky: ["#2E1618", "#1A0C0E", "#0E0708"], glow: "#F2643A", jewel: "emerald" };

/** A small enamel tag under the header. */
export function DenTag({ label, value, color = "#FFE7A8" }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.tag}>
      <LinearGradient colors={["#3A1A1C", "#1C0C0E"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={10} t={2.5} />
      <AppText style={styles.tagLabel} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={[styles.tagValue, { color }]} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function DenStage({
  title,
  subtitle,
  tiles,
  turn,
  under,
  sceneKey,
  centre,
  tools,
  hint,
  bottom,
  overlays,
  onBack,
  onRules,
  away = false,
  bleed = false,
  paused = false,
}: {
  title: string;
  subtitle?: string;
  tiles: DenTile[];
  turn: number | null;
  under?: ReactNode;
  sceneKey: string;
  centre: ReactNode;
  tools?: ReactNode;
  hint?: ReactNode;
  bottom: ReactNode;
  overlays?: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  away?: boolean;
  bleed?: boolean;
  paused?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <GameStage
      header={
        <DenSign width={width} top={insets.top} title={title} subtitle={subtitle} tiles={tiles} turn={turn} paused={paused} />
      }
      headerHeight={denHeight(width, insets.top, tiles.length)}
      under={under}
      sceneKey={sceneKey}
      centre={centre}
      tools={tools}
      hint={hint}
      bottom={bottom}
      overlays={overlays}
      onBack={onBack}
      onRules={onRules}
      away={away}
      bleed={bleed}
      look={DEN}
    />
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 1,
  },
  tagLabel: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14, color: "#C8B8A8" },
  tagValue: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 15, flexShrink: 1 },
});

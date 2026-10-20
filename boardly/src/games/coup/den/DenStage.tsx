// Hustle's stage: the shared GameStage (features/game/stage) in the warm
// dark of the back room, under the den's eave (DenSign: whose turn it is,
// how many are still in, every player's tile on the rack), with what's
// at stake on small enamel tags under it. The scene fills the whole
// middle: my two cards, the satchel of lookups and the hint line sit on
// the plinth (the stage's dock).

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode, RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, BezelOverlay } from "@/components/ui";
import type { PopupLook } from "@/features/game/Popup";
import { GameStage, useStageSize, type StageDock, type StageLook } from "@/features/game/stage/GameStage";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { DenSign, denHeight, type DenTile } from "./DenSign";

/** The den's popups: a crimson lacquer sign, a jade jewel. */
export const DEN_POPUP: PopupLook = { enamel: ["#D2384A", "#8A1424", "#4A0812"], jewel: "emerald", glow: "#FFB45E" };

/** The back room: smoky maroon over dark boards, lantern-red light. */
export const DEN: StageLook = {
  sky: ["#2E1618", "#1A0C0E", "#0E0708"],
  glow: "#F2643A",
  jewel: "emerald",
  popup: DEN_POPUP,
};

/** A small enamel tag under the header; with `onPress`, a button. */
export function DenTag({
  label,
  value,
  color = "#FFE7A8",
  onPress,
}: {
  label: string;
  value: string;
  color?: string;
  onPress?: () => void;
}) {
  const tag = (
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
  if (!onPress) return tag;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value}`}
      hitSlop={8}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.press, pressed && styles.pressed]}
    >
      {tag}
    </Pressable>
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
  dock,
  handRef,
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
  /** My cards, the satchel and the hint line, on the plinth. */
  dock: StageDock;
  /** Set on my cards in the hand. */
  handRef?: RefObject<View | null>;
  bottom: ReactNode;
  overlays?: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  away?: boolean;
  bleed?: boolean;
  paused?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useStageSize();
  return (
    <GameStage
      header={
        <DenSign width={width} top={insets.top} title={title} subtitle={subtitle} tiles={tiles} turn={turn} paused={paused} />
      }
      headerHeight={denHeight(width, insets.top, tiles.length)}
      under={under}
      sceneKey={sceneKey}
      centre={centre}
      dock={dock}
      handRef={handRef}
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
  press: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
  tagLabel: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14, color: "#C8B8A8" },
  tagValue: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 15, flexShrink: 1 },
});

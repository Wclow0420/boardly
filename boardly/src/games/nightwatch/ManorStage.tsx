// Seal the Manor's stage: the shared GameStage (features/game/stage) in
// the manor's night, with its stained-glass arch across the top (the five
// nights as windows, the night's name on its tablet) and tonight's mission
// rooms on enamel tags under it.

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode, RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { BezelOverlay } from "@/components/ui";
import { archLayout, type Pane } from "@/features/game/stage/archArt";
import { GameStage, NIGHT, useStageSize, type StageDock } from "@/features/game/stage/GameStage";
import { NightArch } from "@/features/game/stage/NightArch";
import { fontFamily } from "@/theme";
import { GameText as AppText } from "./GameText";
import { ROOMS, ROOM_COLOR, missionTrack, teamSize, type NightwatchState } from "./logic";

/** A room's name on a small enamel tag in its colour. */
function RoomTag({
  kind,
  room,
  name,
  detail,
  onPress,
}: {
  kind: string;
  room: number;
  name: string;
  detail?: string;
  onPress: () => void;
}) {
  const color = ROOM_COLOR[ROOMS[room]];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tag, pressed && styles.pressed]}>
      <LinearGradient colors={["#1E2438", "#10141F"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={10} t={2.5} />
      <View style={[styles.tagDot, { backgroundColor: color }]} />
      <AppText style={styles.tagKind}>{kind}</AppText>
      <AppText style={[styles.tagRoom, { color }]} numberOfLines={1}>
        {name}
      </AppText>
      {detail ? <AppText style={styles.tagKind}>{detail}</AppText> : null}
    </Pressable>
  );
}

export function ManorStage({
  state,
  roomName,
  subtitle,
  sceneKey,
  centre,
  tools,
  hint,
  dock,
  handRef,
  bottom,
  overlays,
  onBack,
  onRules,
  onMap,
  away = false,
  bleed = false,
  paused = false,
}: {
  state: NightwatchState;
  roomName: (room: number) => string;
  /** The arch's second line (the phase, where I am). */
  subtitle: string;
  /** What's on the stage now: the curtain closes and opens as it changes. */
  sceneKey: string;
  /** The middle of the stage: the room, or a moment. */
  centre: ReactNode;
  /** Down the right side of the middle. */
  tools?: ReactNode;
  /** Lines just above the plinth. */
  hint?: ReactNode;
  /** My card, the satchel of tools and the hint line, on the plinth (the
   *  scene then fills the middle). */
  dock?: StageDock;
  /** Set on the card in my hand: where the dealt role card is put away. */
  handRef?: RefObject<View | null>;
  /** On the plinth: the main move. */
  bottom: ReactNode;
  /** Full-screen pieces over everything (set pieces, popups). */
  overlays?: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  onMap: () => void;
  /** A moment has the stage: the tags and tools step aside. */
  away?: boolean;
  /** The middle runs the screen's full height, under the arch and the
   *  plinth (a long scroll, like the ending's): it's handed the room to
   *  leave at either end through `StageInsets`. */
  bleed?: boolean;
  paused?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useStageSize();
  const live = state.phase !== "finished";
  const track = missionTrack(state);
  const panes: Pane[] = track.map((result, r) =>
    result ? (result.success ? "won" : "lost") : r === state.round && live ? "now" : "ahead",
  );
  const labels = track.map((result, r) =>
    result ? "" : `${state.missionSizes[r]}${state.failsRequired[r] > 1 ? "★" : ""}`,
  );
  const archH = archLayout(width, insets.top, state.rounds).h;
  return (
    <GameStage
      header={
        <NightArch
          width={width}
          top={insets.top}
          title={t("nightwatch.bar.night", { n: Math.min(state.round + 1, state.rounds), total: state.rounds })}
          subtitle={subtitle}
          panes={panes}
          labels={labels}
          paused={paused}
        />
      }
      headerHeight={archH}
      under={
        live ? (
          <>
            <RoomTag
              kind={t("nightwatch.bar.mission")}
              room={state.missionRoom}
              name={roomName(state.missionRoom)}
              detail={`· ${teamSize(state)}`}
              onPress={onMap}
            />
            {state.nextMissionRoom !== null ? (
              <RoomTag
                kind={t("nightwatch.bar.next")}
                room={state.nextMissionRoom}
                name={roomName(state.nextMissionRoom)}
                onPress={onMap}
              />
            ) : null}
          </>
        ) : undefined
      }
      sceneKey={sceneKey}
      centre={centre}
      tools={tools}
      hint={hint}
      dock={dock}
      handRef={handRef}
      bottom={bottom}
      overlays={overlays}
      onBack={onBack}
      onRules={onRules}
      away={away}
      bleed={bleed}
      look={NIGHT}
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
  pressed: { opacity: 0.7 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagKind: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14, color: "#C8C2B0" },
  tagRoom: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 15, flexShrink: 1 },
});

// shared now (features/game/stage/GameStage); re-exported for the board
export { DOCK_PAD, PLINTH_H, StageInsets, stageText } from "@/features/game/stage/GameStage";

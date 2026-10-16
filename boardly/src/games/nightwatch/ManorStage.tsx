// Seal the Manor's stage: the whole screen is the game. The night sky
// behind, the stained-glass arch across the top (the five nights as
// windows, the night's name on its tablet), tonight's mission rooms on
// enamel tags under it, the scene in the middle as large as the screen
// allows with the tools down its side, and the plinth along the foot
// holding the main move. The board fills the slots; a moment (the vote's
// lanterns, the last chance) takes the middle and sends the tools away.

import { LinearGradient } from "expo-linear-gradient";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { BackIcon, Emblem } from "@/components/icons";
import { BezelOverlay, IconButton } from "@/components/ui";
import { archLayout, type Pane } from "@/features/game/stage/archArt";
import { NightArch } from "@/features/game/stage/NightArch";
import { Glow, Plinth } from "@/features/game/stage/parts";
import { StageCurtain } from "@/features/game/stage/StageCurtain";
import { fontFamily } from "@/theme";
import { GameText as AppText } from "./GameText";
import { ROOMS, ROOM_COLOR, missionTrack, teamSize, type NightwatchState } from "./logic";

/** How tall the plinth is above the home bar. */
export const PLINTH_H = 128;
/** How far the curtain reaches up behind the arch and down behind the
 *  plinth, past the stage between them. */
const CURTAIN_UP = 14;
const CURTAIN_DOWN = 12;

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

/** A round metal stud in a top corner (back, rules). */
function Stud({ label, onPress, children, side }: { label: string; onPress: () => void; children: ReactNode; side: "left" | "right" }) {
  const insets = useSafeAreaInsets();
  return (
    <IconButton
      accessibilityLabel={label}
      onPress={onPress}
      size={40}
      style={[styles.corner, { top: insets.top + 6 }, side === "left" ? { left: 12 } : { right: 12 }]}
    >
      <LinearGradient colors={["#3A4258", "#1A1E2C"]} style={styles.stud} />
      <BezelOverlay r={20} t={3} />
      {children}
    </IconButton>
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
  const { width, height } = useWindowDimensions();
  const live = state.phase !== "finished";
  const track = missionTrack(state);
  const panes: Pane[] = track.map((result, r) =>
    result ? (result.success ? "won" : "lost") : r === state.round && live ? "now" : "ahead",
  );
  const labels = track.map((result, r) =>
    result ? "" : `${state.missionSizes[r]}${state.failsRequired[r] > 1 ? "★" : ""}`,
  );
  const archH = archLayout(width, insets.top, state.rounds).h;
  // the move on the plinth changes with the scene, once the curtain has
  // closed on the old one
  const [aside, setAside] = useState<{ key: string; bottom: ReactNode }>(() => ({ key: sceneKey, bottom }));
  if (aside.key === sceneKey && aside.bottom !== bottom) setAside({ key: sceneKey, bottom });
  const settled = aside.key === sceneKey;
  const plinthH = PLINTH_H + insets.bottom;

  // the tags and tools slide off when a moment takes the stage
  const gone = useSharedValue(away ? 1 : 0);
  useEffect(() => {
    gone.value = withTiming(away ? 1 : 0, { duration: 450 });
  }, [away, gone]);
  const toolsOut = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ translateX: gone.value * 80 }],
  }));
  const tagsOut = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ translateY: -gone.value * 16 }],
  }));

  return (
    <View style={styles.screen}>
      {/* the night: deep blue, warm where the lantern light falls */}
      <LinearGradient colors={["#1A2238", "#0E1220", "#0B0E16"]} style={StyleSheet.absoluteFill} />
      <Glow size={520} color="#F28B4B" style={{ top: height * 0.24, left: width * 0.5 - 260 }} />

      {/* everything between the arch and the plinth is behind the curtain:
          the tags, the scene, the tools and the lines under it */}
      <View style={[styles.stage, { top: archH - CURTAIN_UP, bottom: plinthH - CURTAIN_DOWN }]}>
        <StageCurtain sceneKey={sceneKey} onSwap={(key) => setAside({ key, bottom: null })}>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {bleed ? (
              <View style={[styles.centre, { top: CURTAIN_UP - archH, bottom: CURTAIN_DOWN - plinthH }]}>
                <StageInsets.Provider value={{ top: archH + 26, bottom: plinthH + 34 }}>{centre}</StageInsets.Provider>
              </View>
            ) : (
              <View style={[styles.centre, { top: CURTAIN_UP + 26, bottom: CURTAIN_DOWN + 34 }]}>{centre}</View>
            )}
            {live ? (
              <Animated.View style={[styles.tags, { top: CURTAIN_UP - 8 }, tagsOut]} pointerEvents={away ? "none" : "box-none"}>
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
              </Animated.View>
            ) : null}
            {tools ? (
              <Animated.View
                style={[styles.tools, { top: CURTAIN_UP + 46 }, toolsOut]}
                pointerEvents={away ? "none" : "box-none"}
              >
                {tools}
              </Animated.View>
            ) : null}
            <View style={[styles.hint, { bottom: CURTAIN_DOWN + 2 }]} pointerEvents="box-none">
              {hint}
            </View>
          </View>
        </StageCurtain>
      </View>

      <View style={styles.top} pointerEvents="box-none">
        <NightArch
          width={width}
          top={insets.top}
          title={t("nightwatch.bar.night", { n: Math.min(state.round + 1, state.rounds), total: state.rounds })}
          subtitle={subtitle}
          panes={panes}
          labels={labels}
          paused={paused}
        />
      </View>
      {onBack ? (
        <Stud label={t("common.back")} onPress={onBack} side="left">
          <BackIcon size={18} />
        </Stud>
      ) : null}
      {onRules ? (
        <Stud label={t("rules.title")} onPress={onRules} side="right">
          <Emblem emoji="📖" size={20} />
        </Stud>
      ) : null}

      <View style={styles.bottom} pointerEvents="box-none">
        <Plinth width={width} height={plinthH}>
          {settled ? bottom : aside.bottom}
        </Plinth>
      </View>
      {overlays}
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0E16", overflow: "hidden" },
  stage: { position: "absolute", left: 0, right: 0 },
  centre: { position: "absolute", left: 0, right: 0, justifyContent: "center" },
  tools: { position: "absolute", right: 4, gap: 12 },
  top: { position: "absolute", left: 0, right: 0, top: 0, alignItems: "center" },
  tags: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 8, paddingHorizontal: 12 },
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
  corner: { position: "absolute" },
  stud: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  hint: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 26, gap: 2 },
});

/** For a middle that bleeds under the arch and the plinth: how far its
 *  content should start from the top and stop from the bottom. */
export const StageInsets = createContext({ top: 0, bottom: 0 });

export const stageText = StyleSheet.create({
  hint: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    ...shadow,
  },
  strong: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 19,
    color: "#FFD9A8",
    textAlign: "center",
    ...shadow,
  },
});

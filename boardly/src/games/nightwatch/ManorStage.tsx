// Seal the Manor's stage: the shared GameStage (features/game/stage) in
// the manor's night, with its stained-glass arch across the top (the five
// nights as windows, the night's name on its tablet) and tonight's mission
// rooms on enamel tags under it. Tonight's event hangs in a gold
// medallion in the stone beside the windows (medallion/); tapping it
// tells what the event does and what earlier nights left behind.
//
// The header shows the night only as far as this player has watched it
// (`shown`, shownNight.ts): a mission's result, the next night and its
// event wait until the lanterns have revealed them here.

import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode, type RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { EmblemGlyph } from "@/components/engraved";
import { BezelOverlay } from "@/components/ui";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { archLayout, type Pane } from "@/features/game/stage/archArt";
import { GameStage, NIGHT, useStageSize, type StageDock } from "@/features/game/stage/GameStage";
import { NightArch } from "@/features/game/stage/NightArch";
import { fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { GameText as AppText } from "./GameText";
import { ROOMS, ROOM_COLOR, doorLabel, type NightEvent, type NightwatchState } from "./logic";
import { EventMedallion } from "./medallion/EventMedallion";
import { eventEmblem } from "./medallion/emblem";
import type { ShownNight } from "./shownNight";

/** The manor's popups: a night-blue sign, lantern-amber jewels. */
export const MANOR_POPUP: PopupLook = { enamel: ["#3A4A7A", "#1E2A50", "#0E1430"], jewel: "amber", glow: "#FFB45E" };

/** Where tonight's medallion hangs in an arch `width` wide: in the stone
 *  under the rules stud, clear of the candle beside the windows. */
export function medallionAt(width: number, top: number, rounds: number) {
  const L = archLayout(width, top, rounds);
  const candle = L.candles[1].x + 13;
  const R = Math.max(17, Math.min(24, (width - candle) / 2 - 3));
  return { R, x: Math.min(width - R - 4, Math.max(width - 32, candle + 2 + R)), y: top + 98 };
}

/** An event's emblem, as the medallion shows it. */
function EventIcon({ event, size }: { event: NightEvent; size: number }) {
  const found = eventEmblem(event);
  return found ? <EmblemGlyph data={found.data} size={size} color={found.tint} /> : null;
}

/** What tonight's event does, and what earlier nights left behind. */
function EventNotes({ shown, roomName }: { shown: ShownNight; roomName: (room: number) => string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const event = shown.event;
  const name = [styles.noteName, { color: colors.text }];
  const line = [styles.noteLine, { color: colors.textMuted }];
  const head = [styles.notesHead, { color: colors.primary }];
  return (
    <View style={styles.notes}>
      <AppText style={head}>{t("nightwatch.medallion.tonight")}</AppText>
      <View style={styles.noteRow}>
        {event ? <EventIcon event={event} size={40} /> : null}
        <View style={styles.noteText}>
          <AppText style={name}>
            {event ? t(`nightwatch.events.${event}.name`) : t("nightwatch.medallion.none")}
          </AppText>
          <AppText style={line}>
            {event ? t(`nightwatch.events.${event}.desc`) : t("nightwatch.announce.noEvent")}
          </AppText>
        </View>
      </View>
      {shown.lasting.length > 0 ? (
        <>
          <AppText style={[head, styles.notesGap]}>{t("nightwatch.medallion.lasting")}</AppText>
          {shown.lasting.map((e, i) => (
            <View key={i} style={styles.noteRow}>
              <EventIcon event={e.kind === "collapse" ? "collapse" : "secretDoor"} size={28} />
              <View style={styles.noteText}>
                <AppText style={name}>
                  {e.kind === "collapse"
                    ? t("nightwatch.record.collapse", { room: roomName(e.room) })
                    : t("nightwatch.record.door", { door: doorLabel(e.rooms, roomName) })}
                </AppText>
                <AppText style={line}>
                  {t(`nightwatch.events.${e.kind === "collapse" ? "collapse" : "secretDoor"}.desc`)}
                </AppText>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

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
  shown,
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
  /** The night as far as this player has watched it; null until that's
   *  known (the arch waits a moment rather than tell too much). */
  shown: ShownNight | null;
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
  const [reading, setReading] = useState(false);
  const live = shown?.live ?? false;
  const panes: Pane[] = (shown?.track ?? []).map((result, r) =>
    result ? (result.success ? "won" : "lost") : r === shown?.round && live ? "now" : "ahead",
  );
  const labels = (shown?.track ?? []).map((result, r) =>
    result ? "" : `${state.missionSizes[r]}${state.failsRequired[r] > 1 ? "★" : ""}`,
  );
  const archH = archLayout(width, insets.top, state.rounds).h;
  const medal = medallionAt(width, insets.top, state.rounds);
  const eventName = shown?.event ? t(`nightwatch.events.${shown.event}.name`) : t("nightwatch.medallion.none");
  return (
    <GameStage
      header={
        shown ? (
          <View style={{ width, height: archH }} pointerEvents="box-none">
            <NightArch
              width={width}
              top={insets.top}
              title={t("nightwatch.bar.night", { n: Math.min(shown.round + 1, state.rounds), total: state.rounds })}
              subtitle={subtitle}
              panes={panes}
              labels={labels}
              paused={paused}
            />
            {live ? (
              <EventMedallion
                event={shown.event}
                lasting={shown.lasting.length}
                R={medal.R}
                x={medal.x}
                y={medal.y}
                label={t("nightwatch.medallion.label", { name: eventName })}
                onPress={() => {
                  tapHaptic();
                  setReading(true);
                }}
                paused={paused || reading}
                delay={900}
              />
            ) : null}
          </View>
        ) : (
          <View style={{ width, height: archH }} />
        )
      }
      headerHeight={archH}
      under={
        shown && live ? (
          <>
            <RoomTag
              kind={t("nightwatch.bar.mission")}
              room={shown.missionRoom}
              name={roomName(shown.missionRoom)}
              detail={`· ${shown.teamSize}`}
              onPress={onMap}
            />
            {shown.nextMissionRoom !== null ? (
              <RoomTag
                kind={t("nightwatch.bar.next")}
                room={shown.nextMissionRoom}
                name={roomName(shown.nextMissionRoom)}
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
      overlays={
        <>
          {overlays}
          <Popup look={MANOR_POPUP} visible={reading && shown !== null} title={t("nightwatch.medallion.title")} onClose={() => setReading(false)}>
            {shown ? <EventNotes shown={shown} roomName={roomName} /> : null}
          </Popup>
        </>
      }
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
  notes: { gap: 10 },
  notesHead: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" },
  notesGap: { marginTop: 8 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  noteText: { flex: 1, gap: 2 },
  noteName: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20 },
  noteLine: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
});

// shared now (features/game/stage/GameStage); re-exported for the board
export { DOCK_PAD, PLINTH_H, StageInsets, stageText } from "@/features/game/stage/GameStage";

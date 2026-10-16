// The patrol, on the stage: the manor's map in a gilt frame on night-blue
// felt (tap a room on it, or below), the rooms you may walk to as enamel
// plates each in its room's colour, and — for those who can — the
// Tracker's follow and the Double's decoy as engraved toggles. The move
// itself ("Go") waits on the plinth.

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { enamel } from "@/components/engraved/shapes";
import { Emblem } from "@/components/icons";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { AppText as PlainText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import type { GamePlayer } from "../types";
import { GameText as AppText } from "./GameText";
import { ROOMS, ROOM_COLOR, ROOM_EMOJI, canDecoy, canTrack, decoyRooms, others, type NightwatchState } from "./logic";

export interface PatrolPick {
  room?: number;
  follow?: boolean;
  track?: number;
  decoy?: boolean;
  fake?: number;
}

/** Whether a patrol pick is complete. */
export const patrolReady = (pick: PatrolPick) =>
  pick.follow ? pick.track !== undefined : pick.room !== undefined && (!pick.decoy || pick.fake !== undefined);

export function PatrolStage({
  state,
  mySeat,
  pick,
  busy,
  players,
  roomName,
  nameOf,
  map,
  onPick,
}: {
  state: NightwatchState;
  mySeat: number;
  pick: PatrolPick;
  busy: boolean;
  players: GamePlayer[];
  roomName: (room: number) => string;
  nameOf: (seat: number) => string;
  map: ReactNode;
  onPick: (next: PatrolPick) => void;
}) {
  const { t } = useTranslation();
  const here = state.myRoom;
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.frame}>
        <LinearGradient colors={["#1E2A50", "#0E1430"]} style={StyleSheet.absoluteFill} />
        <BezelOverlay r={16} t={5} ornate />
        <View style={styles.map}>{map}</View>
      </View>

      {canTrack(state) ? (
        <Switch
          emoji="👣"
          label={t("nightwatch.prompt.follow")}
          hint={t("nightwatch.prompt.followHint", { count: state.abilityLeft })}
          on={!!pick.follow}
          disabled={busy}
          onPress={() => onPick({ follow: !pick.follow })}
        />
      ) : null}

      {pick.follow ? (
        <View style={styles.plates}>
          {others(state, mySeat).map((seat) => {
            const player = players.find((p) => p.seat === seat);
            return (
              <Pressable
                key={seat}
                accessibilityRole="button"
                accessibilityState={{ selected: pick.track === seat }}
                disabled={busy}
                onPress={() => {
                  tapHaptic();
                  onPick({ track: seat });
                }}
                style={[styles.person, pick.track === seat && styles.personOn]}
              >
                <AvatarBorder
                  name={player?.username ?? "?"}
                  borderId={player?.borderId}
                  avatarUrl={player?.avatarUrl}
                  mascot={player?.mascot}
                  size={28}
                />
                <AppText style={styles.personName} numberOfLines={1}>
                  {nameOf(seat)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.plates}>
          {state.patrolRooms.map((room) => (
            <RoomPlate
              key={room}
              room={room}
              label={room === here ? t("nightwatch.prompt.stay", { room: roomName(room) }) : roomName(room)}
              on={pick.room === room}
              disabled={busy}
              onPress={() => onPick({ room, fake: pick.fake === room ? undefined : pick.fake })}
            />
          ))}
        </View>
      )}

      {canDecoy(state) ? (
        <>
          <Switch
            emoji="🎭"
            label={t("nightwatch.prompt.decoy")}
            hint={t("nightwatch.prompt.decoyHint", { count: state.abilityLeft })}
            on={!!pick.decoy}
            disabled={busy}
            onPress={() => onPick({ decoy: !pick.decoy })}
          />
          {pick.decoy ? (
            <>
              <AppText style={styles.ask}>{t("nightwatch.prompt.decoyRoom")}</AppText>
              <View style={styles.plates}>
                {decoyRooms(state, pick.room).map((room) => (
                  <RoomPlate
                    key={room}
                    room={room}
                    label={roomName(room)}
                    on={pick.fake === room}
                    disabled={busy}
                    onPress={() => onPick({ fake: room })}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

/** A room as an enamel plate in its own colour, gold-rimmed. */
function RoomPlate({
  room,
  label,
  on,
  disabled,
  onPress,
}: {
  room: number;
  label: string;
  on: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const id = ROOMS[room];
  const look = enamel(ROOM_COLOR[id]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.plate, on && styles.plateOn, pressed && styles.pressed]}
    >
      <LinearGradient colors={look.colors.slice(0, 3) as [string, string, string]} style={StyleSheet.absoluteFill} />
      {!on ? <View style={[StyleSheet.absoluteFill, styles.plateDim]} /> : null}
      <BezelOverlay r={11} t={3} metal={on ? "gold" : "silver"} />
      <Emblem emoji={ROOM_EMOJI[id]} size={20} />
      <PlainText style={[styles.plateText, { color: on ? look.ink : "#FFF6E6" }]} numberOfLines={1}>
        {label}
      </PlainText>
    </Pressable>
  );
}

/** A choice that's on or off: an engraved toggle with its hint. */
function Switch({
  emoji,
  label,
  hint,
  on,
  disabled,
  onPress,
}: {
  emoji: string;
  label: string;
  hint: string;
  on: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={styles.switch}
    >
      <LinearGradient colors={on ? ["#3A2A14", "#22160A"] : ["#1E2438", "#10141F"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={12} t={3} metal={on ? "gold" : "silver"} />
      <Emblem emoji={emoji} size={26} />
      <View style={styles.grow}>
        <AppText style={styles.switchLabel}>{label}</AppText>
        <AppText style={styles.switchHint}>{hint}</AppText>
      </View>
      <View style={[styles.knob, on && styles.knobOn]}>
        <View style={[styles.knobDot, on && styles.knobDotOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  frame: { borderRadius: 16, overflow: "hidden", padding: 10 },
  map: { minHeight: 200 },
  plates: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  plate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 11,
    overflow: "hidden",
    minWidth: "46%",
    flexGrow: 1,
  },
  plateOn: { transform: [{ scale: 1.03 }] },
  plateDim: { backgroundColor: "rgba(10,12,20,0.55)" },
  pressed: { opacity: 0.8 },
  plateText: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18, flexShrink: 1 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#3A4258",
    backgroundColor: "#141927",
    minWidth: "46%",
    flexGrow: 1,
  },
  personOn: { borderColor: "#F0CC72", backgroundColor: "#2E2414" },
  personName: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 17, color: "#F1E6D2", flexShrink: 1 },
  ask: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 18, color: "#F1E6D2", textAlign: "center" },
  switch: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, overflow: "hidden" },
  grow: { flex: 1 },
  switchLabel: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18, color: "#F1E6D2" },
  switchHint: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#AEB3C6" },
  knob: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0B0E16",
    borderWidth: 1.5,
    borderColor: "#7A8494",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  knobOn: { borderColor: "#F0CC72", backgroundColor: "#3A2A14" },
  knobDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#C9D0DA" },
  knobDotOn: { alignSelf: "flex-end", backgroundColor: "#F0CC72" },
});

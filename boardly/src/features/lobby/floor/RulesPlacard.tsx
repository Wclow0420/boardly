// The house rules: on the room's wall, the board they hang on (drawn
// with the room, rooms.ts) with what the host has set written on it and
// the count at the table on its medallion ("5/6"); tap it for the house
// rules in a popup in the room's style. There the host changes the
// game's settings (the same settings the server keeps for the table), and
// everyone reads what the number at the table means for this game (its
// tableNotes: Hustle's coins, cards and deck).

import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import type { RoomInfo } from "@/api/client";
import { Emblem } from "@/components/icons";
import { AppText, BezelOverlay } from "@/components/ui";
import { Popup } from "@/features/game/Popup";
import { roomSettings } from "@/features/lobby/settings";
import { getGame } from "@/games/registry";
import type { TableNote } from "@/games/types";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import type { RoomLayout } from "./layout";
import type { RoomLook } from "./rooms";

type T = (key: string, options?: Record<string, unknown>) => string;

/** What the number at the table, with the host's settings, means for its
 *  game. */
export function tableNotes(room: RoomInfo, players: number, t: T): TableNote[] {
  const settings = Object.fromEntries(roomSettings(room).map((s) => [s.name, s.current]));
  return getGame(room.gameType)?.tableNotes?.(players, t, settings) ?? [];
}

/** The line on the board: the host's choices, or the game's own few
 *  words when it has no settings. */
export function rulesSummary(room: RoomInfo, notes: TableNote[], t: T): string {
  const base = `gameOptions.${room.gameType}`;
  const picked = roomSettings(room).map((s) => t(`${base}.${s.name}.${s.current}.name`));
  if (picked.length > 0) return picked.join(" · ");
  const short = notes.map((n) => n.short).filter((s): s is string => !!s);
  return short.length > 0 ? short.join(" · ") : t("lobby.floor.classic");
}

export const RulesPlacard = memo(function RulesPlacard({
  R,
  look,
  summary,
  count,
  max,
  onPress,
  k = 1,
}: {
  R: RoomLayout;
  /** How much the room is drawn down (see RoomScene). */
  k?: number;
  look: RoomLook;
  summary: string;
  count: number;
  max: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const B = { x: R.board.x * k, y: R.board.y * k, w: R.board.w * k, h: R.board.h * k };
  // the words are drawn down with the board, the count sized to its
  // medallion's face (r 16.8 at the least): "10/10" smaller than "5/6"
  const label = `${count}/${max}`;
  const face = 31 * k;
  const countSize = Math.min(13, 30 / (label.length * 0.6)) * k;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("lobby.floor.houseRules")}: ${summary}. ${t("lobby.floor.count", { current: count, max })}`}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.abs, { left: B.x, top: B.y, width: B.w, height: B.h }, pressed && styles.pressed]}
    >
      <View style={[styles.abs, styles.text, { left: 16 * k, right: 54 * k, top: 0, bottom: 0 }]}>
        <AppText
          style={[styles.title, { color: look.board.title, fontSize: 9 * k, lineHeight: 12 * k, letterSpacing: 1.6 * k }]}
          numberOfLines={1}
        >
          {t("lobby.floor.houseRules")}
        </AppText>
        <AppText
          style={[styles.line, { color: look.board.text, fontSize: 14 * k, lineHeight: 19 * k, marginTop: k }]}
          numberOfLines={1}
        >
          {summary}
        </AppText>
      </View>
      <View style={[styles.abs, styles.count, { left: B.w - 27 * k - face / 2, top: B.h / 2 - face / 2, width: face, height: face }]}>
        <AppText style={[styles.countText, { fontSize: countSize, lineHeight: countSize * 1.3 }]} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
});

/** The house rules, opened from the board. */
export function HouseRulesPopup({
  visible,
  onClose,
  room,
  look,
  isHost,
  busy,
  onSetOption,
}: {
  visible: boolean;
  onClose: () => void;
  room: RoomInfo;
  look: RoomLook;
  isHost: boolean;
  busy?: boolean;
  onSetOption: (name: string, choice: string) => void;
}) {
  const { t } = useTranslation();
  const settings = roomSettings(room);
  const count = room.players.length;
  const min = room.game?.minPlayers ?? 2;
  const max = room.game?.maxPlayers ?? 2;
  const notes = tableNotes(room, Math.max(count, min), t);
  const base = `gameOptions.${room.gameType}`;
  const editable = isHost && room.status === "waiting";
  return (
    <Popup visible={visible} title={t("lobby.floor.houseRules")} onClose={onClose} look={look.popup}>
      <AppText style={styles.range}>
        {`👥 ${min === max ? t("games.lift.playersExact", { count: min }) : t("games.lift.playersRange", { min, max })}  ·  ${t("lobby.floor.count", { current: count, max })}`}
      </AppText>
      {settings.map(({ name, choices, current }) => (
        <View key={name} style={styles.section}>
          <AppText style={styles.head}>{t(`${base}.${name}.title`)}</AppText>
          <View style={styles.choices}>
            {choices.map((choice) => {
              const on = choice === current;
              return (
                <Pressable
                  key={choice}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: !editable }}
                  disabled={!editable || busy}
                  onPress={() => {
                    tapHaptic();
                    onSetOption(name, choice);
                  }}
                  style={[styles.choice, !on && !editable && styles.faded]}
                >
                  <LinearGradient
                    colors={on ? ["#6A2A1A", "#3A1408"] : ["#2E2014", "#1C120A"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <BezelOverlay r={12} t={on ? 2.6 : 1.6} metal={on ? "gold" : "silver"} />
                  <AppText style={[styles.choiceName, on && styles.choiceOn]}>{t(`${base}.${name}.${choice}.name`)}</AppText>
                  <AppText style={styles.choiceDesc}>{t(`${base}.${name}.${choice}.desc`)}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {settings.length > 0 && !editable && room.status === "waiting" ? (
        <AppText style={styles.note}>{t("lobby.settingsHostOnly")}</AppText>
      ) : null}
      {notes.length > 0 ? (
        <View style={styles.section}>
          <AppText style={styles.head}>{t("lobby.floor.atCount", { count: Math.max(count, min) })}</AppText>
          {notes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <View style={styles.noteIcon}>
                <Emblem emoji={n.emoji} size={18} />
              </View>
              <AppText style={styles.noteText}>{n.text}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Popup>
  );
}

const shadow = {
  textShadowColor: "rgba(40,0,6,0.85)",
  textShadowOffset: { width: 0, height: 1.2 },
  textShadowRadius: 1.5,
};

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  pressed: { opacity: 0.8 },
  text: { justifyContent: "center" },
  title: { fontFamily: fontFamily.bold, textTransform: "uppercase", ...shadow },
  line: { fontFamily: fontFamily.bold, ...shadow },
  count: { alignItems: "center", justifyContent: "center" },
  countText: { fontFamily: fontFamily.bold, color: "#3A2408", textAlign: "center" },
  range: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 19, color: "#F7C948", textAlign: "center" },
  section: { marginTop: 16, gap: 8 },
  head: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, color: "#E8C88A", textTransform: "uppercase" },
  choices: { flexDirection: "row", gap: 8 },
  choice: { flex: 1, borderRadius: 12, overflow: "hidden", paddingVertical: 10, paddingHorizontal: 12 },
  faded: { opacity: 0.55 },
  choiceName: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 19, color: "#F6E9D2" },
  choiceOn: { color: "#FFD58A" },
  choiceDesc: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#D8C6A6", marginTop: 2 },
  note: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#B8A383", marginTop: 8 },
  noteRow: { flexDirection: "row", gap: 8 },
  noteIcon: { width: 18, height: 20, justifyContent: "center" },
  noteText: { fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 20, color: "#F1E6D2", flexShrink: 1 },
});

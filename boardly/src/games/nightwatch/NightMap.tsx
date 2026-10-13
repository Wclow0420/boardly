import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";


import { useTheme } from "@/theme";
import type { GamePlayer } from "../types";
import { ROOMS, ROOM_COLOR, type NightwatchState } from "./logic";
import { ManorMap } from "./ManorMap";
import { GameText as AppText } from "./GameText";
import type { MapNotes } from "./useMapNotes";

export interface NightMapProps {
  state: NightwatchState;
  mySeat: number;
  players: GamePlayer[];
  nameOf: (seat: number) => string;
  roomName: (room: number) => string;
  notes: MapNotes;
  onNote: (round: number, seat: number, room: number | null) => void;
}

/** The map, night by night: where I patrolled and who I saw on each
 *  night so far, with my own notes of where I think the others were.
 *  Nights still to come can't be opened. */
export function NightMap({
  state,
  mySeat,
  players,
  nameOf,
  roomName,
  notes,
  onNote,
}: NightMapProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const tonight = Math.min(state.round, state.rounds - 1);
  const [night, setNight] = useState(tonight);
  // the watcher being placed on the map
  const [placing, setPlacing] = useState<number | null>(null);

  const mine = notes[night] ?? {};
  const others = players
    .filter((player) => player.seat !== mySeat)
    .sort((a, b) => a.seat - b.seat);
  const rooms = ROOMS.map((_, room) => room).filter((room) => !state.collapsed.includes(room));

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.row}>
        {Array.from({ length: state.rounds }, (_, n) => {
          const open = n <= tonight;
          const on = n === night;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={t("nightwatch.map.nightN", { n: n + 1 })}
              accessibilityState={{ selected: on, disabled: !open }}
              disabled={!open}
              onPress={() => {
                setNight(n);
                setPlacing(null);
              }}
              style={[
                styles.night,
                {
                  backgroundColor: on ? colors.primary : colors.well,
                  borderColor: on ? colors.primary : colors.border,
                  opacity: open ? 1 : 0.4,
                },
              ]}
            >
              <AppText variant="bodyMedium" style={{ color: on ? colors.background : colors.text }}>
                {`🏮 ${n + 1}`}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ManorMap
        state={state}
        mySeat={mySeat}
        round={night}
        notes={mine}
        selectable={placing !== null ? rooms : []}
        onSelect={(room) => {
          if (placing === null) return;
          onNote(night, placing, mine[placing] === room ? null : room);
          setPlacing(null);
        }}
        nameOf={nameOf}
        roomName={roomName}
      />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label">{`✎ ${t("nightwatch.map.notesTitle")}`}</AppText>
        <AppText variant="caption" color={placing !== null ? "primary" : "textMuted"}>
          {placing !== null
            ? t("nightwatch.map.notesPlace", { name: nameOf(placing) })
            : t("nightwatch.map.notesHint")}
        </AppText>
        <View style={styles.row}>
          {others.map(({ seat }) => {
            const on = placing === seat;
            const at = mine[seat];
            return (
              <Pressable
                key={seat}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setPlacing(on ? null : seat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.well : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {nameOf(seat)}
                </AppText>
                {at !== undefined ? (
                  <AppText variant="tiny" numberOfLines={1} style={{ color: ROOM_COLOR[ROOMS[at]] }}>
                    {roomName(at)}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {placing !== null && mine[placing] !== undefined ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onNote(night, placing, null);
              setPlacing(null);
            }}
          >
            <AppText variant="bodyMedium" color="danger">
              {t("nightwatch.map.notesRemove", { name: nameOf(placing) })}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  night: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    maxWidth: "48%",
  },
});

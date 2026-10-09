// The game's lobby settings (e.g. Liar's Dice: knockout or endless).
// The host taps a choice; everyone else sees what the host picked.
// Labels live in the locale files under gameOptions.<game>.<option>.

import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RoomInfo } from "@/api/client";
import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { useSetRoomOptions } from "./hooks";

export function GameSettings({
  room,
  code,
  isHost,
}: {
  room: RoomInfo;
  code: string;
  isHost: boolean;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const setOptions = useSetRoomOptions(room.id, code);
  const choices = room.game?.options ?? {};
  const names = Object.keys(choices);
  if (names.length === 0) return null;

  const base = `gameOptions.${room.gameType}`;
  const editable = isHost && room.status === "waiting";

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <AppText variant="label">{`⚙️  ${t("lobby.settings")}`}</AppText>
      {names.map((name) => {
        const current = room.options?.[name] ?? choices[name][0];
        return (
          <View key={name} style={{ marginTop: spacing.md }}>
            <AppText variant="caption" color="textMuted">
              {t(`${base}.${name}.title`)}
            </AppText>
            <View style={[styles.row, { marginTop: 6 }]}>
              {choices[name].map((choice) => {
                const selected = choice === current;
                return (
                  <Pressable
                    key={choice}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: !editable }}
                    disabled={!editable || setOptions.isPending}
                    onPress={() => {
                      tapHaptic();
                      setOptions.mutate({ [name]: choice });
                    }}
                    style={[
                      styles.choice,
                      {
                        backgroundColor: selected ? colors.primarySoft : colors.well,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: !editable && !selected ? 0.55 : 1,
                      },
                    ]}
                  >
                    <AppText variant="label">{t(`${base}.${name}.${choice}.name`)}</AppText>
                    <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
                      {t(`${base}.${name}.${choice}.desc`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      {!editable && room.status === "waiting" ? (
        <AppText variant="tiny" color="textSubtle" style={{ marginTop: spacing.sm }}>
          {t("lobby.settingsHostOnly")}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});

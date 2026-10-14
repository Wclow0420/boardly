// Bot players for trying a game on your own (development only). The host
// picks how many and the backend starts them; they join one by one, so
// the seats fill as they arrive. Shown only where the backend offers
// bots for this game (room.botsAvailable).

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RoomInfo } from "@/api/client";
import { AppText, Button, Card } from "@/components/ui";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { useAddBots } from "./hooks";

export function AddBots({
  room,
  minPlayers,
  maxPlayers,
}: {
  room: RoomInfo;
  minPlayers: number;
  maxPlayers: number;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const addBots = useAddBots(room.id);
  const seated = room.players.length;
  const free = maxPlayers - seated;
  // enough to start, by default
  const [count, setCount] = useState(Math.max(1, Math.min(free, minPlayers - seated)));
  // how many seats were taken when bots were last asked for
  const [askedAt, setAskedAt] = useState<number | null>(null);
  if (free <= 0) return null;

  const wanted = Math.min(count, free);
  const joining =
    askedAt !== null && addBots.isSuccess && seated < askedAt + (addBots.data?.added ?? 0);
  const step = (by: number) => {
    tapHaptic();
    setCount(Math.max(1, Math.min(free, wanted + by)));
  };

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <AppText variant="label">{`🤖  ${t("lobby.bots.title")}`}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t("lobby.bots.hint")}
      </AppText>
      <View style={[styles.row, { marginTop: spacing.md, gap: spacing.md }]}>
        <View style={[styles.stepper, { borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("lobby.bots.fewer")}
            disabled={wanted <= 1}
            onPress={() => step(-1)}
            style={styles.stepButton}
          >
            <AppText variant="title" color={wanted <= 1 ? "textSubtle" : "text"}>
              −
            </AppText>
          </Pressable>
          <AppText variant="title" style={styles.count}>
            {wanted}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("lobby.bots.more")}
            disabled={wanted >= free}
            onPress={() => step(1)}
            style={styles.stepButton}
          >
            <AppText variant="title" color={wanted >= free ? "textSubtle" : "text"}>
              +
            </AppText>
          </Pressable>
        </View>
        <Button
          label={t("lobby.bots.add", { count: wanted })}
          size="sm"
          style={styles.grow}
          loading={addBots.isPending}
          onPress={() => {
            setAskedAt(seated);
            addBots.mutate(wanted);
          }}
        />
      </View>
      {joining ? (
        <AppText variant="caption" color="primary" style={{ marginTop: spacing.sm }}>
          {t("lobby.bots.joining")}
        </AppText>
      ) : null}
      {addBots.isError ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.sm }}>
          {addBots.error instanceof Error ? addBots.error.message : t("lobby.bots.failed")}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12 },
  stepButton: { paddingHorizontal: 14, paddingVertical: 6 },
  count: { minWidth: 28, textAlign: "center" },
});

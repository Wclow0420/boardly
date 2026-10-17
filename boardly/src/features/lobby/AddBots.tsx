// Bot players, for when the table is a player or two short. On the
// lobby's plinth the host has a bot bell; it opens this sheet to pick
// how many and add them. They sit down ready and the server plays them;
// the host can take one off by holding it on the floor.
// Offered only where the backend has bots for this game
// (room.botsAvailable).

import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RoomInfo } from "@/api/client";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { useAddBots } from "./hooks";

export interface AddBotsSheetProps {
  room: RoomInfo;
  minPlayers: number;
  maxPlayers: number;
}

export const AddBotsSheet = forwardRef<GorhomBottomSheetModal, AddBotsSheetProps>(
  function AddBotsSheet({ room, minPlayers, maxPlayers }, ref) {
    const { t } = useTranslation();
    const { colors, spacing } = useTheme();
    const addBots = useAddBots(room.id);
    const seated = room.players.length;
    const free = Math.max(0, maxPlayers - seated);
    // enough to start by default, until the host picks a number
    const [picked, setPicked] = useState<number | null>(null);
    const wanted = Math.max(1, Math.min(free, picked ?? minPlayers - seated));
    const close = () => {
      if (ref && typeof ref !== "function") ref.current?.dismiss();
    };
    const step = (by: number) => {
      tapHaptic();
      setPicked(Math.max(1, Math.min(free, wanted + by)));
    };

    return (
      <BottomSheetModal ref={ref} title={t("lobby.bots.title")}>
        <View style={[styles.body, { gap: spacing.lg }]}>
          <AppText variant="body" color="textMuted">
            {t("lobby.bots.hint")}
          </AppText>
          {free === 0 ? (
            <AppText variant="bodyMedium" color="textSubtle" align="center">
              {t("lobby.bots.full")}
            </AppText>
          ) : (
            <>
              <View style={[styles.stepper, { borderColor: colors.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("lobby.bots.fewer")}
                  disabled={wanted <= 1}
                  onPress={() => step(-1)}
                  style={styles.stepButton}
                >
                  <AppText variant="h2" color={wanted <= 1 ? "textSubtle" : "text"}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="h1" style={styles.count}>
                  {wanted}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("lobby.bots.more")}
                  disabled={wanted >= free}
                  onPress={() => step(1)}
                  style={styles.stepButton}
                >
                  <AppText variant="h2" color={wanted >= free ? "textSubtle" : "text"}>
                    +
                  </AppText>
                </Pressable>
              </View>
              <AppText variant="caption" color="textSubtle" align="center">
                {t("lobby.bots.seats", { free })}
              </AppText>
              <Button
                label={t("lobby.bots.add", { count: wanted })}
                size="lg"
                loading={addBots.isPending}
                onPress={() =>
                  addBots.mutate(wanted, {
                    onSuccess: () => {
                      setPicked(null);
                      close();
                    },
                  })
                }
              />
            </>
          )}
          {addBots.isError ? (
            <AppText variant="caption" color="danger" align="center">
              {addBots.error instanceof Error ? addBots.error.message : t("lobby.bots.failed")}
            </AppText>
          ) : null}
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    minWidth: 200,
  },
  stepButton: { paddingHorizontal: 22, paddingVertical: 10 },
  count: { minWidth: 48, textAlign: "center" },
});

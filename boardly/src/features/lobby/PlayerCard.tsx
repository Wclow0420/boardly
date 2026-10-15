import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Emblem, PlusIcon } from "@/components/icons";
import { AppText, Card, StatusPill } from "@/components/ui";
import type { LobbyPlayer } from "@/data/types";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export function PlayerCard({
  player,
  onRemove,
  onPress,
}: {
  player: LobbyPlayer;
  /** Shown on a bot's card for the host: take the bot off the table. */
  onRemove?: () => void;
  /** Tapping the card: show who they are. */
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();

  return (
    <Card
      radius={radius.xl}
      style={styles.card}
      onPress={
        onPress
          ? () => {
              tapHaptic();
              onPress();
            }
          : undefined
      }
    >
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("lobby.bots.remove", { name: player.name })}
          hitSlop={8}
          onPress={() => {
            tapHaptic();
            onRemove();
          }}
          style={({ pressed }) => [
            styles.remove,
            { backgroundColor: pressed ? colors.border : colors.well },
          ]}
        >
          <Emblem emoji="✕" size={12} />
        </Pressable>
      ) : null}
      <AvatarBorder
        name={player.name}
        borderId={player.borderId}
        avatarUrl={player.avatarUrl}
        mascot={player.mascot}
        size={74}
        crown={player.isHost}
        ringColor={player.isHost ? colors.accent : colors.border}
      />
      <AppText
        style={{ fontFamily: fontFamily.semiBold, fontSize: 15, marginTop: 12 }}
      >
        {player.name}
      </AppText>
      <View style={{ marginTop: 8 }}>
        <StatusPill
          label={
            player.isHost
              ? t("lobby.host")
              : player.isBot
                ? t("lobby.bots.bot")
                : player.ready
                  ? t("lobby.ready")
                  : t("lobby.waiting")
          }
          variant={
            player.isHost
              ? "host"
              : player.isBot
                ? "info"
                : player.ready
                  ? "ready"
                  : "waiting"
          }
        />
      </View>
    </Card>
  );
}

export function InviteSlotCard({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();

  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.invite,
        {
          borderRadius: radius.xl,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.well : "transparent",
        },
      ]}
    >
      <View style={[styles.inviteIcon, { backgroundColor: colors.well }]}>
        <PlusIcon size={18} color={colors.textSubtle} />
      </View>
      <AppText variant="caption" color="textSubtle">
        {t("common.invite")}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  remove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  removeMark: { fontFamily: fontFamily.semiBold },
  card: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 10,
    flex: 1,
  },
  invite: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});

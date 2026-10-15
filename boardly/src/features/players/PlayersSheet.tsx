// Everyone at the table, from the game screen's header: tap one for
// their player card. (In a game, tapping the players on the board is
// often a move, so the cards live here instead.)

import { forwardRef, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RoomPlayerInfo } from "@/api/client";
import { ChevronRightIcon } from "@/components/icons";
import { Meeple } from "@/components/tabletop/Meeple";
import {
  AppText,
  BottomSheetModal,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { meepleColor } from "@/features/friends/seat";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { usePlayerCard } from "./PlayerCardProvider";

export const PlayersSheet = forwardRef<
  GorhomBottomSheetModal,
  { players: RoomPlayerInfo[] }
>(function PlayersSheet({ players }, ref) {
  const { t } = useTranslation();
  const { user } = useSession();
  const playerCard = usePlayerCard();
  const selfRef = useRef<GorhomBottomSheetModal | null>(null);

  return (
    <BottomSheetModal
      ref={(node) => {
        selfRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      title={t("game.players")}
    >
      <View style={styles.body}>
        {[...players]
          .sort((a, b) => a.seat - b.seat)
          .map((player, i) => {
            const me = player.userId === user?.id;
            return (
              <Pressable
                key={player.userId}
                accessibilityRole="button"
                accessibilityLabel={player.username}
                disabled={player.isBot}
                onPress={() => {
                  tapHaptic();
                  selfRef.current?.dismiss();
                  playerCard.show({
                    id: player.userId,
                    name: player.username,
                    borderId: player.borderId,
                    avatarUrl: player.avatarUrl,
                  });
                }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divided,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.avatar}>
                  <AvatarBorder
                    name={player.username}
                    borderId={player.borderId}
                    avatarUrl={player.avatarUrl}
                    size={40}
                  />
                </View>
                <Meeple size={14} color={meepleColor(player.userId)} />
                <AppText numberOfLines={1} style={styles.name}>
                  {player.username}
                </AppText>
                <AppText variant="tiny" style={styles.tag}>
                  {me
                    ? t("game.you")
                    : player.isBot
                      ? `🤖 ${t("lobby.bots.bot")}`
                      : ""}
                </AppText>
                {!player.isBot ? (
                  <ChevronRightIcon
                    size={12}
                    color={TABLE.creamMuted}
                    strokeWidth={2.4}
                  />
                ) : null}
              </Pressable>
            );
          })}
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  divided: { borderTopWidth: 1, borderTopColor: "rgba(255,230,190,0.12)" },
  pressed: { opacity: 0.7 },
  avatar: { padding: 2 },
  name: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: TABLE.cream,
  },
  tag: { color: TABLE.creamMuted },
});

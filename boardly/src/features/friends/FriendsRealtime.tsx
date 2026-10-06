// Mounted once while signed in. Keeps friends data live
// (`friends_updated`) and surfaces table invites (`table_invite`) as a
// bottom sheet on whatever screen the user is on.

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TableInvite } from "@/api/client";
import { getSocket } from "@/api/socket";
import { ConfirmSheet, GorhomBottomSheetModal } from "@/components/ui";
import { useGameName } from "@/games/names";
import { successHaptic } from "@/utils/haptics";

export function FriendsRealtime() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [invite, setInvite] = useState<TableInvite | null>(null);
  const gameName = useGameName();

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendSearch"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    };
    const onInvite = (payload: TableInvite) => {
      successHaptic();
      setInvite(payload);
      sheetRef.current?.present();
    };
    socket.on("friends_updated", refresh);
    socket.on("table_invite", onInvite);
    // Presence may have changed while the connection was down
    socket.on("connect", refresh);

    return () => {
      socket.off("friends_updated", refresh);
      socket.off("table_invite", onInvite);
      socket.off("connect", refresh);
    };
  }, [queryClient]);

  return (
    <ConfirmSheet
      ref={sheetRef}
      title={t("invite.title", { name: invite?.from.username ?? "" })}
      message={t("invite.message", {
        game: invite?.game
          ? gameName(invite.game.key, invite.game.name)
          : t("tabs.games"),
      })}
      confirmLabel={t("invite.join")}
      cancelLabel={t("invite.notNow")}
      onConfirm={() => {
        sheetRef.current?.dismiss();
        if (invite) router.push(`/join/${invite.code}`);
      }}
    />
  );
}

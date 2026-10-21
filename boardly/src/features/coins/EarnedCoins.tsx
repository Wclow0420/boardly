import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/client";
import { AppText } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { TABLE, fontFamily } from "@/theme";

import { CoinIcon } from "./CoinIcon";
import { useRecentRewards } from "./hooks";

/** After a game: the coins this player earned from it, already in their
 *  purse (the balance is fetched again here). A game with bots at the
 *  table pays a quarter and counts towards no badge: it says so. */
export function EarnedCoins({
  sessionId,
  withBots = false,
}: {
  sessionId: string;
  withBots?: boolean;
}) {
  const { t } = useTranslation();
  const { updateUser } = useSession();
  const rewards = useRecentRewards();
  const queryClient = useQueryClient();

  // The coins were paid the moment the game ended: look for them then,
  // and bring the balance up to date
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
    let live = true;
    api.auth
      .me()
      .then(({ user }) => {
        if (live) updateUser(user);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [queryClient, sessionId, updateUser]);

  const earned = rewards.data?.find((r) => r.sessionId === sessionId);
  if (!earned && !withBots) return null;

  return (
    <View style={styles.wrap}>
      {earned ? (
        <View style={styles.row}>
          <CoinIcon size={20} />
          <AppText style={styles.text}>
            {t("coins.added", { count: earned.amount })}
          </AppText>
        </View>
      ) : null}
      {withBots ? (
        <AppText variant="tiny" color="textMuted" align="center">
          {t("coins.botGame")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: TABLE.yellow.fill[0],
  },
});

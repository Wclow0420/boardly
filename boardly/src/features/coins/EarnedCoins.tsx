import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { AppText } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";

import { CoinIcon } from "./CoinIcon";
import { useRewards } from "./hooks";

/** After a game: the coins this player earned from it. They are claimed
 *  on Home, where the balance lives. */
export function EarnedCoins({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const rewards = useRewards();
  const queryClient = useQueryClient();

  // The reward is created the moment the game ends: look for it then
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
  }, [queryClient, sessionId]);

  const earned = rewards.data?.rewards.find((r) => r.sessionId === sessionId);
  if (!earned) return null;

  return (
    <View style={styles.row}>
      <CoinIcon size={20} />
      <AppText style={styles.text}>
        {t("coins.waiting", { count: earned.amount })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
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

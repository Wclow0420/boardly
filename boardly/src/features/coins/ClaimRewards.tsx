import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, type RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api } from "@/api/client";
import { AppText, Texture } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { TABLE, fontFamily } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

import type { CoinFlyHandle } from "./CoinFly";
import { CoinIcon } from "./CoinIcon";
import { useRefreshRewards, useRewards } from "./hooks";

export interface ClaimRewardsProps {
  /** Where the coins fly to: the balance pill on this screen. */
  target: RefObject<View | null>;
  fly: RefObject<CoinFlyHandle | null>;
}

/** Banner shown while game winnings are waiting. Claiming sends the
 *  coins flying into the balance, which then counts up. */
export function ClaimRewards({ target, fly }: ClaimRewardsProps) {
  const { t } = useTranslation();
  const { updateUser } = useSession();
  const rewards = useRewards();
  const refreshRewards = useRefreshRewards();
  const button = useRef<View>(null);
  const [claiming, setClaiming] = useState(false);
  const [failed, setFailed] = useState(false);

  const total = rewards.data?.total ?? 0;
  if (total <= 0 && !claiming) return null;

  const claim = async () => {
    if (claiming) return;
    tapHaptic();
    setClaiming(true);
    setFailed(false);
    try {
      const result = await api.rewards.claim();
      const finish = () => {
        refreshRewards();
        setClaiming(false);
      };
      if (!fly.current) {
        updateUser(result.user);
        finish();
        return;
      }
      fly.current.fly(button.current, target.current, {
        coins: Math.min(12, Math.max(5, Math.round(result.claimed / 3))),
        // The balance starts counting up as the first coin lands
        onLand: () => {
          successHaptic();
          updateUser(result.user);
        },
        onDone: finish,
      });
    } catch {
      setFailed(true);
      setClaiming(false);
    }
  };

  return (
    <LinearGradient colors={TABLE.dark.fill} style={styles.banner}>
      <Texture radius={12} />
      <CoinIcon size={26} />
      <View style={styles.text}>
        <AppText style={styles.title} numberOfLines={1}>
          {t("coins.earned", { count: total })}
        </AppText>
        <AppText
          variant="tiny"
          color={failed ? "danger" : "textMuted"}
          numberOfLines={1}
        >
          {failed ? t("common.errorTitle") : t("coins.fromGames")}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={claiming}
        onPress={claim}
        style={({ pressed }) => (pressed || claiming) && styles.pressed}
      >
        <View ref={button} collapsable={false}>
          <LinearGradient colors={TABLE.button} style={styles.claim}>
            <AppText style={styles.claimText}>{t("coins.claim")}</AppText>
          </LinearGradient>
        </View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: TABLE.yellow.border,
  },
  text: { flex: 1 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: TABLE.yellow.fill[0],
  },
  pressed: { opacity: 0.7 },
  claim: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: TABLE.buttonBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  claimText: { fontFamily: fontFamily.bold, fontSize: 13, color: "#FFFFFF" },
});

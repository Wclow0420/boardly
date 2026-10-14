// The badge to work towards next, and how far there is to go: its coin,
// its name and what it asks, and a bar. Shown when a game ends and on
// the player card.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SharedValue } from "react-native-reanimated";

import type { BadgeRecord } from "@/api/client";
import { Badge } from "@/components/badges/Badge";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { badgeArt } from "./art";
import { badgeText } from "./strings";

export function NextBadge({
  badge,
  clock,
  color = "#FFF6E6",
  muted = "rgba(255,246,230,0.7)",
}: {
  badge: BadgeRecord;
  clock: SharedValue<number>;
  /** Text colours, to sit on the table or on a game's own skin. */
  color?: string;
  muted?: string;
}) {
  const { t } = useTranslation();
  const { art, face } = badgeArt(badge.key, badge.gameType);
  const text = badgeText(t, badge.key);
  const ratio = badge.progress / badge.goal;
  return (
    <View style={styles.row}>
      <Badge
        art={art}
        face={face}
        tier={badge.tier}
        size={58}
        clock={clock}
        locked
        progress={ratio}
      />
      <View style={styles.body}>
        <AppText variant="tiny" style={{ color: muted }}>
          {t("badges.celebrate.nextUp")}
        </AppText>
        <View style={styles.head}>
          <AppText numberOfLines={1} style={[styles.name, { color }]}>
            {text.name}
          </AppText>
          <AppText style={styles.toGo}>
            {t("badges.celebrate.toGo", { n: badge.goal - badge.progress })}
          </AppText>
        </View>
        <View style={styles.bar}>
          <View
            style={[styles.fill, { width: `${Math.max(4, ratio * 100)}%` }]}
          />
        </View>
        <AppText variant="tiny" numberOfLines={1} style={{ color: muted }}>
          {`${text.desc}  ${t("profile.card.progress", { n: badge.progress, goal: badge.goal })}`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  body: { flex: 1, gap: 3 },
  head: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { flex: 1, fontFamily: fontFamily.semiBold, fontSize: 14 },
  toGo: { fontFamily: fontFamily.bold, fontSize: 13, color: "#F2B630" },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: "#F2B630" },
});

// The four badges a player shows, in a row on their card (mine on the
// profile, a friend's on their player card): still pictures, with their
// names, and a way into the badge hall.

import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSharedValue } from "react-native-reanimated";

import type { BadgeRecord } from "@/api/client";
import { Badge } from "@/components/badges/Badge";
import { ChevronRightIcon } from "@/components/icons";
import { AppText } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { badgeArt } from "./art";
import { badgeText } from "./strings";

const SLOTS = 4;

export function ShowcaseRow({
  badges,
  count,
  total,
  onOpen,
  color = TABLE.cream,
  muted = TABLE.creamMuted,
}: {
  /** The badges shown (up to four), in order. */
  badges: BadgeRecord[];
  /** How many they have earned, and of how many (total may be unknown). */
  count: number;
  total?: number;
  /** Into the badge hall (mine only). */
  onOpen?: () => void;
  color?: string;
  muted?: string;
}) {
  const { t } = useTranslation();
  const still = useSharedValue(0);
  const body = (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText style={[styles.label, { color }]}>{t("profile.card.badges")}</AppText>
        <AppText style={[styles.count, { color: muted }]}>
          {total !== undefined ? `${count}/${total}` : `${count}`}
        </AppText>
        <View style={styles.grow} />
        {onOpen ? (
          <View style={styles.more}>
            <AppText style={[styles.moreText, { color }]}>{t("common.seeAll")}</AppText>
            <ChevronRightIcon size={10} color={color} strokeWidth={2.4} />
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        {Array.from({ length: SLOTS }, (_, i) => {
          const badge = badges[i];
          if (!badge)
            return (
              <View key={i} style={styles.cell}>
                <View style={styles.empty} />
              </View>
            );
          const { art, face, frames } = badgeArt(badge.key, badge.gameType);
          return (
            <View key={badge.key} style={styles.cell}>
              <Badge
                art={art}
                face={face}
                frames={frames}
                tier={badge.tier ?? "bronze"}
                size={64}
                clock={still}
                alive={false}
              />
              <AppText numberOfLines={1} variant="tiny" style={[styles.name, { color }]}>
                {badgeText(t, badge.key).name}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
  if (!onOpen) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("badges.hall.title")}
      onPress={() => {
        tapHaptic();
        onOpen();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontFamily: fontFamily.semiBold, fontSize: 13 },
  count: { fontFamily: fontFamily.medium, fontSize: 12 },
  grow: { flex: 1 },
  more: { flexDirection: "row", alignItems: "center", gap: 3 },
  moreText: { fontFamily: fontFamily.semiBold, fontSize: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cell: { flex: 1, alignItems: "center" },
  empty: {
    width: 40,
    height: 40,
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(242,204,114,0.35)",
  },
  name: { marginTop: -4, paddingHorizontal: 2 },
  pressed: { opacity: 0.8 },
});

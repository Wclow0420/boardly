// Development only: every badge style at its four levels, moving, and
// every badge, earned or locked, to look at on a device. Open with
// boardly-dev://dev/badges; add ?game=shelter to show one style only.

import { Redirect, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import type { BadgeRecord } from "@/api/client";
import { Badge } from "@/components/badges/Badge";
import { TIERS } from "@/components/badges/types";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { badgeArt } from "@/features/badges/art";
import { BadgeCelebration } from "@/features/badges/BadgeCelebration";
import { BadgeDetail } from "@/features/badges/BadgeGrid";
import type { LevelUp } from "@/features/badges/order";
import { badgeText } from "@/features/badges/strings";
import { GAMES } from "@/games/registry";
import { useTheme } from "@/theme";

const GENERAL = ["boardly.regular", "boardly.champion", "boardly.streak", "boardly.company"];

const record = (
  key: string,
  gameType: string | null,
  progress: number,
  reached: number,
): BadgeRecord => {
  const unlocked = Object.fromEntries(TIERS.slice(0, reached).map((t) => [t, "2026-10-12"]));
  return {
    key,
    gameType,
    goals: [1, 5, 15, 40],
    progress,
    tier: reached ? TIERS[reached - 1] : null,
    unlocked,
  };
};

/** What a game might have reached, and what comes next. */
const SAMPLE: LevelUp[] = [
  { badge: record("shelter.fullLarder", "shelter", 15, 3), tier: "gold" },
  { badge: record("boardly.regular", null, 40, 4), tier: "diamond" },
];
const NEXT = record("shelter.lastWinter", "shelter", 7, 1);

export default function BadgesPreview() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { game } = useLocalSearchParams<{ game?: string }>();
  const clock = useIsoClock(false);
  const still = useIsoClock(true);
  const [locked, setLocked] = useState(false);
  const [party, setParty] = useState<LevelUp[]>([]);
  const [detail, setDetail] = useState<BadgeRecord | null>(null);
  if (!__DEV__) return <Redirect href="/" />;

  const styles = [
    { name: "Boardly", game: null as string | null, keys: GENERAL },
    ...Object.values(GAMES).map((g) => ({
      name: g.key,
      game: g.key as string | null,
      keys: Object.keys(g.badges ?? {}),
    })),
  ].filter((s) => s.keys.length && (!game || s.game === game));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 40 }}>
          <Pressable accessibilityLabel="Toggle locked" onPress={() => setLocked(!locked)}>
            <AppText>{locked ? "Locked · tap" : "Earned · tap"}</AppText>
          </Pressable>
          <Pressable
            accessibilityLabel="Detail"
            onPress={() => setDetail(record("nightwatch.sharpEye", "nightwatch", 9, 2))}
          >
            <AppText>Detail ▶</AppText>
          </Pressable>
          <Pressable accessibilityLabel="Celebrate" onPress={() => setParty(SAMPLE)}>
            <AppText>Celebrate ▶</AppText>
          </Pressable>
        </View>

        {styles.map((style) => (
          <View key={style.name} style={{ gap: 6 }}>
            <AppText variant="title">{style.name}</AppText>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {TIERS.map((tier, i) => {
                const { art, face, frames } = badgeArt(style.keys[0], style.game);
                return (
                  <View key={tier} style={{ alignItems: "center" }}>
                    <Badge
                      art={art}
                      face={face}
                      frames={frames}
                      tier={tier}
                      size={84}
                      clock={clock}
                      phase={i}
                      locked={locked}
                    />
                    <AppText variant="tiny">{t(`badges.tiers.${tier}`)}</AppText>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {style.keys.map((key, i) => {
                const { art, face, frames } = badgeArt(key, style.game);
                return (
                  <View key={key} style={{ width: 84, alignItems: "center" }}>
                    <Badge
                      art={art}
                      face={face}
                      frames={frames}
                      tier={TIERS[i % 4]}
                      size={72}
                      clock={still}
                      locked={locked}
                      alive={false}
                    />
                    <AppText variant="tiny" align="center" numberOfLines={2}>
                      {badgeText(t, key).name}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <BadgeDetail badge={detail} clock={clock} still={still} onClose={() => setDetail(null)} />
      <BadgeCelebration
        key={party.length ? "on" : "off"}
        badges={party}
        next={NEXT}
        onShown={() => {}}
        onProfile={() => setParty([])}
      />
    </SafeAreaView>
  );
}

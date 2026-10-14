// Development only: every badge, in every tier, earned and locked, on
// one clock — to look at on a device. Open with boardly-dev://dev/badges.

import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/badges/Badge";
import type { BadgeTier } from "@/components/badges/types";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import type { BadgeRecord } from "@/api/client";
import { badgeArt } from "@/features/badges/art";
import { BadgeCelebration } from "@/features/badges/BadgeCelebration";
import { badgeText } from "@/features/badges/strings";
import { GAMES } from "@/games/registry";
import { useTheme } from "@/theme";

/** What a game might have earned, and what comes next. */
const SAMPLE: BadgeRecord[] = [
  {
    key: "shelter.fullLarder",
    gameType: "shelter",
    tier: "gold",
    series: null,
    goal: 1,
    progress: 1,
    unlockedAt: "now",
  },
  {
    key: "boardly.legend",
    gameType: null,
    tier: "legendary",
    series: "played",
    goal: 100,
    progress: 100,
    unlockedAt: "now",
  },
];
const NEXT: BadgeRecord = {
  key: "shelter.lastWinter",
  gameType: "shelter",
  tier: "legendary",
  series: "wins",
  goal: 25,
  progress: 7,
  unlockedAt: null,
};

const TIERS: BadgeTier[] = ["bronze", "silver", "gold", "legendary"];
const GENERAL = [
  "boardly.firstTable",
  "boardly.streak",
  "boardly.regular",
  "boardly.legend",
];

export default function BadgesPreview() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const clock = useIsoClock(false);
  const [locked, setLocked] = useState(false);
  const [party, setParty] = useState<BadgeRecord[]>([]);
  if (!__DEV__) return <Redirect href="/" />;

  const all: { key: string; game: string | null }[] = [
    ...GENERAL.map((key) => ({ key, game: null })),
    ...Object.values(GAMES).flatMap((game) =>
      Object.keys(game.badges ?? {}).map((key) => ({ key, game: game.key })),
    ),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      >
        <Pressable
          accessibilityLabel="Celebrate"
          onPress={() => setParty(SAMPLE)}
          style={{
            alignSelf: "flex-end",
            paddingTop: 40,
            paddingHorizontal: 8,
          }}
        >
          <AppText>Celebrate ▶</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Toggle locked"
          onPress={() => setLocked(!locked)}
          style={{ paddingTop: 40 }}
        >
          <AppText>
            {locked
              ? "Showing locked · tap to unlock"
              : "Showing earned · tap to lock"}
          </AppText>
        </Pressable>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {TIERS.map((tier, i) => {
            const { art, face } = badgeArt("boardly.streak", null);
            return (
              <View key={tier} style={{ alignItems: "center" }}>
                <Badge
                  art={art}
                  face={face}
                  tier={tier}
                  size={88}
                  clock={clock}
                  phase={i}
                  locked={locked}
                  progress={0.6}
                />
                <AppText variant="tiny">{t(`badges.tiers.${tier}`)}</AppText>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {TIERS.map((tier, i) => {
            const { art, face } = badgeArt("boardly.streak", null);
            return (
              <View key={tier} style={{ alignItems: "center" }}>
                <Badge
                  art={art}
                  face={face}
                  tier={tier}
                  size={88}
                  clock={clock}
                  phase={i}
                  locked
                  progress={0.25 * (i + 1)}
                />
                <AppText variant="tiny">{t(`badges.tiers.${tier}`)}</AppText>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {all.map(({ key, game }, i) => {
            const { art, face } = badgeArt(key, game);
            return (
              <View key={key} style={{ width: 104, alignItems: "center" }}>
                <Badge
                  art={art}
                  face={face}
                  tier={TIERS[i % 4]}
                  size={96}
                  clock={clock}
                  phase={i * 0.7}
                  locked={locked}
                  progress={0.4}
                />
                <AppText variant="tiny" align="center" numberOfLines={2}>
                  {badgeText(t, key).name}
                </AppText>
              </View>
            );
          })}
        </View>
      </ScrollView>
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

// Shelter's "How to play" pages. Roles, places, posts and the player
// counts are built from logic.ts so they can't drift from the game; the
// story, the daily flow and the win conditions are text under
// rules.shelter in the locale files.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { IsoPicture } from "@/components/iso";
import { RulesText } from "@/features/game/RulesText";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import { GameText as AppText } from "./GameText";
import {
  COUNTS,
  DECKS,
  FOOD,
  PLACES,
  PLACE_COLOR,
  POSTS,
  POST_COLOR,
  type Card,
  type Place,
} from "./logic";
import { PLACE_HEIGHT, PLACE_WIDTH, placeScene } from "./shelterScenes";

const PLACE_EMOJI: Record<Place, string> = { farm: "🌾", market: "🛒", hospital: "🏥" };
const POST_EMOJI = { store: "📦", door: "🚪", sleep: "🛏" } as const;
const ACT_EMOJI = { store: "✋", door: "🔓", sleep: "🛏" } as const;
const CARD_EMOJI: Record<Card, string> = {
  f1: "🍞", f2: "🍞", f3: "🍞", none: "⭕", mold1: "🦠", mold2: "🦠",
  zombie: "🧟", medicine: "💊", sabotage: "🦠",
};

function OverviewPage() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.shelter.intro")}
      </AppText>
      <RulesText i18nKey="rules.shelter.clashes" />
    </View>
  );
}

function Panel({ color, children }: { color: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: color }]}>{children}</View>;
}

function RolesPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const roles = [
    { key: "survivor", emoji: "🧍", tint: colors.successStrong },
    { key: "infected", emoji: "☣", tint: colors.danger },
  ];
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.shelter.roles.intro")}
      </AppText>
      {roles.map(({ key, emoji, tint }) => (
        <Panel key={key} color={tint}>
          <AppText variant="title" style={{ color: tint }}>
            {`${emoji}  ${t(`shelter.role.${key}`)}`}
          </AppText>
          {(t(`rules.shelter.roles.${key}`, { returnObjects: true }) as string[]).map((line, i) => (
            <AppText key={i} variant="caption">
              {`•  ${line}`}
            </AppText>
          ))}
        </Panel>
      ))}
    </View>
  );
}

function PlacesPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.shelter.places.intro")}
      </AppText>
      {PLACES.map((place) => {
        const deck = DECKS[place];
        const total = Object.values(deck).reduce((a, b) => a + (b ?? 0), 0);
        return (
          <Panel key={place} color={PLACE_COLOR[place]}>
            <View style={styles.row}>
              <IsoPicture shapes={placeScene(place)} width={PLACE_WIDTH} height={PLACE_HEIGHT} size={92} />
              <View style={[styles.grow, { gap: 4 }]}>
                <AppText variant="title">{`${PLACE_EMOJI[place]}  ${t(`shelter.places.${place}`)}`}</AppText>
                <AppText variant="tiny" style={{ fontFamily: fontFamily.semiBold, color: PLACE_COLOR[place] }}>
                  {place === "hospital" ? t("rules.shelter.places.fivePlus") : t("rules.shelter.places.always")}
                </AppText>
                <AppText variant="caption">{t(`rules.shelter.places.${place}`)}</AppText>
              </View>
            </View>
            <View style={styles.deck}>
              {(Object.keys(deck) as Card[]).map((card) => (
                <View key={card} style={[styles.chip, { borderColor: colors.border }]}>
                  <AppText variant="tiny">
                    {`${CARD_EMOJI[card]} ${t(`shelter.cards.${card}`)}${FOOD[card] ? ` ${FOOD[card] > 0 ? "+" : ""}${FOOD[card]}` : ""}  ×${deck[card]}/${total}`}
                  </AppText>
                </View>
              ))}
            </View>
          </Panel>
        );
      })}
      <AppText variant="title" style={{ marginTop: spacing.sm }}>
        {`🌙  ${t("rules.shelter.posts.title")}`}
      </AppText>
      <AppText variant="body" color="textMuted">
        {t("rules.shelter.posts.intro")}
      </AppText>
      {POSTS.map((post) => (
        <Panel key={post} color={POST_COLOR[post]}>
          <AppText variant="title">{`${POST_EMOJI[post]}  ${t(`shelter.posts.${post}`)}`}</AppText>
          <AppText variant="caption">{`🧍  ${t(`rules.shelter.posts.${post}.survivor`)}`}</AppText>
          <AppText variant="caption" style={{ color: colors.danger }}>
            {`${ACT_EMOJI[post]}  ${t(`rules.shelter.posts.${post}.infected`)}`}
          </AppText>
        </Panel>
      ))}
    </View>
  );
}

function CountsPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const head = ["players", "infected", "survivors", "food", "rescue", "famine", "votes"];
  const rows = Object.keys(COUNTS)
    .map(Number)
    .map((n) => {
      const [infected, rescue, famine] = COUNTS[n];
      return [n, infected, n - infected, n, rescue, famine, Math.floor(n / 2) + 1];
    });
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.shelter.counts.intro")}
      </AppText>
      <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={[styles.tr, { backgroundColor: colors.well }]}>
          {head.map((key) => (
            <AppText key={key} variant="tiny" style={[styles.td, { fontFamily: fontFamily.semiBold }]}>
              {t(`rules.shelter.counts.${key}`)}
            </AppText>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row[0]} style={[styles.tr, { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
            {row.map((cell, i) => (
              <AppText key={i} variant="caption" style={styles.td}>
                {String(cell)}
              </AppText>
            ))}
          </View>
        ))}
      </View>
      <RulesText i18nKey="rules.shelter.countNotes" />
    </View>
  );
}

const text = (key: string, titleKey: string): RulesPage => ({
  key,
  titleKey,
  Content: function TextPage() {
    return <RulesText i18nKey={`rules.shelter.${key}`} />;
  },
});

export const SHELTER_RULES: RulesPage[] = [
  { key: "overview", titleKey: "rules.overview", Content: OverviewPage },
  { key: "roles", titleKey: "rules.shelter.roles.title", Content: RolesPage },
  { key: "places", titleKey: "rules.shelter.places.title", Content: PlacesPage },
  text("flow", "rules.shelter.flow.title"),
  { key: "counts", titleKey: "rules.shelter.counts.title", Content: CountsPage },
  text("winning", "rules.shelter.winning.title"),
];

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { borderWidth: 1.5, borderRadius: 18, padding: 12, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  deck: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  table: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  tr: { flexDirection: "row" },
  td: { flex: 1, textAlign: "center", paddingVertical: 6 },
});

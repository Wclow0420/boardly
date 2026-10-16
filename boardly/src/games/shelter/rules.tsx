// Shelter's "How to play", in the standard sections (features/game/rules):
// overview, teams, roles, a day step by step, the night posts (actions),
// the places (in the rooms slot) and the player counts. Decks, posts and
// every number in the counts table come from logic.ts; the words are
// under rules.shelter in the locales.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { IsoPicture } from "@/components/iso";
import { AppText } from "@/components/ui";
import {
  CountsTable,
  RuleCard,
  RuleLead,
  RuleNote,
  RulePage,
  RuleSteps,
  RuleText,
} from "@/features/game/rules/blocks";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import { EMOJI_ICON, GameIcon } from "./icons";
import {
  COUNTS,
  DAYS,
  DECKS,
  FOOD,
  PLACES,
  PLACE_COLOR,
  POSTS,
  POST_COLOR,
  canSneak,
  placesFor,
  startFood,
  type Card,
} from "./logic";
import { PLACE_HEIGHT, PLACE_WIDTH, placeScene } from "./shelterScenes";

const R = "rules.shelter";
const PLAYER_COUNTS = Object.keys(COUNTS)
  .map(Number)
  .sort((a, b) => a - b);
const FEWEST = PLAYER_COUNTS[0];
const MOST = PLAYER_COUNTS[PLAYER_COUNTS.length - 1];
/** The smallest table where the hospital opens. */
const HOSPITAL_FROM = PLAYER_COUNTS.find((n) => placesFor(n).includes("hospital"));

const PLACE_EMOJI = { farm: "🌾", market: "🛒", hospital: "🏥" } as const;
const POST_EMOJI = { store: "📦", door: "🚪", sleep: "🛏" } as const;
const STRIKE_EMOJI = { store: "✋", door: "🔓", sleep: "💤" } as const;
const CARD_EMOJI: Record<Card, string> = {
  f1: "🍞", f2: "🍞", f3: "🍞", none: "⭕", mold1: "🦠", mold2: "🦠",
  zombie: "🧟", medicine: "💊", sabotage: "🦠",
};

/** The game's own drawing of an emoji, as its board shows it. */
function gameIcon(emoji: string, color: string, size = 30) {
  const name = EMOJI_ICON[emoji.replace(/️/g, "")];
  return name ? <GameIcon name={name} size={size} color={color} /> : undefined;
}

function OverviewPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.overview.lead`, { days: DAYS })}</RuleLead>
      <RuleText>{t(`${R}.overview.turn`)}</RuleText>
      <RuleText>{t(`${R}.overview.win`)}</RuleText>
      <RuleText>{t(`${R}.overview.length`, { days: DAYS, min: FEWEST, max: MOST })}</RuleText>
    </RulePage>
  );
}

function TeamsPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const infected = PLAYER_COUNTS.map((n) => COUNTS[n][0]);
  const sides = [
    { key: "survivors", emoji: "🧍", tint: colors.successStrong, tags: [t(`${R}.teams.survivors.tag`)] },
    {
      key: "infected",
      emoji: "☣",
      tint: colors.danger,
      tags: [t(`${R}.teams.infected.tag`), t(`${R}.teams.infected.size`, { min: Math.min(...infected), max: Math.max(...infected) })],
    },
  ];
  return (
    <RulePage>
      <RuleLead>{t(`${R}.teams.lead`)}</RuleLead>
      {sides.map(({ key, emoji, tint, tags }) => (
        <RuleCard key={key} emoji={emoji} picture={gameIcon(emoji, tint)} name={t(`${R}.teams.${key}.name`)} tint={tint} tags={tags}>
          {t(`${R}.teams.${key}.text`, { days: DAYS })}
        </RuleCard>
      ))}
    </RulePage>
  );
}

function RolesPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sneakAt = PLAYER_COUNTS.filter(canSneak);
  return (
    <RulePage>
      <RuleLead>{t(`${R}.roles.lead`)}</RuleLead>
      <RuleCard
        emoji="🧍"
        picture={gameIcon("🧍", colors.successStrong)}
        name={t(`${R}.roles.survivor.name`)}
        tint={colors.successStrong}
        tags={[t(`${R}.roles.survivor.tag`)]}
      >
        {t(`${R}.roles.survivor.text`)}
      </RuleCard>
      <RuleCard
        emoji="☣"
        picture={gameIcon("☣", colors.danger)}
        name={t(`${R}.roles.infected.name`)}
        tint={colors.danger}
        tags={[t(`${R}.roles.infected.tag`)]}
      >
        {t(`${R}.roles.infected.text`)}
      </RuleCard>
      <RuleNote>{t(`${R}.roles.second`, { count: PLAYER_COUNTS.find((n) => COUNTS[n][0] > 1) })}</RuleNote>
      {sneakAt.length ? <RuleNote>{t(`${R}.roles.sneak`, { count: sneakAt[0] })}</RuleNote> : null}
    </RulePage>
  );
}

const STEPS = [
  ["vote", "🗳"],
  ["search", "🌾"],
  ["play", "🍞"],
  ["night", "🌙"],
  ["supper", "🔥"],
] as const;

function PlayPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.play.lead`, { days: DAYS })}</RuleLead>
      <RuleSteps
        steps={STEPS.map(([key, emoji]) => ({
          emoji,
          title: t(`${R}.play.${key}.title`),
          detail: t(`${R}.play.${key}.detail`, { count: HOSPITAL_FROM }),
        }))}
      />
      <RuleNote>{t(`${R}.play.cough`)}</RuleNote>
      <RuleText>{t(`${R}.play.out`)}</RuleText>
    </RulePage>
  );
}

/** The night posts: what a survivor does there, and what the Infected
 *  does with the same choice. */
function ActionsPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.actions.lead`)}</RuleLead>
      {POSTS.map((post) => (
        <RuleCard
          key={post}
          emoji={POST_EMOJI[post]}
          picture={gameIcon(POST_EMOJI[post], POST_COLOR[post])}
          name={t(`shelter.posts.${post}`)}
          tint={POST_COLOR[post]}
          tags={post === "sleep" ? [] : [t(`${R}.actions.tired`)]}
        >
          <View style={styles.lines}>
            <AppText style={[styles.line, { color: colors.text }]}>{`🧍 ${t(`${R}.actions.${post}.survivor`)}`}</AppText>
            <AppText style={[styles.line, { color: colors.danger }]}>
              {`${STRIKE_EMOJI[post]} ${t(`${R}.actions.${post}.infected`)}`}
            </AppText>
          </View>
        </RuleCard>
      ))}
      <RuleNote>{t(`${R}.actions.guard`)}</RuleNote>
    </RulePage>
  );
}

/** The places, each with its picture and its deck. */
function PlacesPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.places.lead`)}</RuleLead>
      {PLACES.map((place) => {
        const deck = DECKS[place];
        const total = Object.values(deck).reduce((a, b) => a + (b ?? 0), 0);
        const from = PLAYER_COUNTS.find((n) => placesFor(n).includes(place));
        return (
          <RuleCard
            key={place}
            picture={
              <IsoPicture
                shapes={() => placeScene(place)}
                width={PLACE_WIDTH}
                height={PLACE_HEIGHT}
                size={76}
                cacheKey={`shelter-place|${place}`}
              />
            }
            name={`${PLACE_EMOJI[place]} ${t(`shelter.places.${place}`)}`}
            tint={PLACE_COLOR[place]}
            tags={[from === FEWEST ? t(`${R}.places.always`) : t(`${R}.places.from`, { count: from })]}
          >
            <View style={styles.lines}>
              <AppText style={[styles.line, { color: colors.text }]}>{t(`${R}.places.${place}`)}</AppText>
              <View style={styles.deck}>
                {(Object.keys(deck) as Card[]).map((card) => (
                  <View key={card} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.well }]}>
                    <AppText style={[styles.chipText, { color: colors.textMuted }]}>
                      {`${CARD_EMOJI[card]} ${t(`shelter.cards.${card}`)}${FOOD[card] ? ` ${FOOD[card] > 0 ? "+" : ""}${FOOD[card]}` : ""} · ${deck[card]}/${total}`}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </RuleCard>
        );
      })}
      <RuleNote>{t(`${R}.places.cards`)}</RuleNote>
    </RulePage>
  );
}

function CountsPage() {
  const { t } = useTranslation();
  const yes = (on: boolean) => (on ? "✓" : "–");
  return (
    <RulePage>
      <RuleLead>{t(`${R}.counts.lead`, { min: FEWEST, max: MOST })}</RuleLead>
      <CountsTable
        counts={PLAYER_COUNTS}
        rows={[
          { label: t(`${R}.counts.infected`), values: PLAYER_COUNTS.map((n) => COUNTS[n][0]) },
          { label: t(`${R}.counts.food`), values: PLAYER_COUNTS.map(startFood) },
          { label: t(`${R}.counts.rescue`), values: PLAYER_COUNTS.map((n) => COUNTS[n][1]) },
          { label: t(`${R}.counts.famine`), values: PLAYER_COUNTS.map((n) => COUNTS[n][2]) },
          { label: t(`${R}.counts.votes`), values: PLAYER_COUNTS.map((n) => Math.floor(n / 2) + 1) },
          { label: t(`${R}.counts.hospital`), values: PLAYER_COUNTS.map((n) => yes(placesFor(n).includes("hospital"))) },
          { label: t(`${R}.counts.sneak`), values: PLAYER_COUNTS.map((n) => yes(canSneak(n))) },
        ]}
      />
      <RuleText>{t(`${R}.counts.rescueNote`, { days: DAYS })}</RuleText>
      <RuleText>{t(`${R}.counts.famineNote`)}</RuleText>
      <RuleNote>{t(`${R}.counts.votesNote`)}</RuleNote>
    </RulePage>
  );
}

export const SHELTER_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: OverviewPage },
  { key: "teams", section: "teams", Content: TeamsPage },
  { key: "roles", section: "roles", Content: RolesPage },
  { key: "play", section: "play", Content: PlayPage },
  { key: "actions", section: "actions", Content: ActionsPage },
  { key: "places", section: "rooms", titleKey: `${R}.places.title`, Content: PlacesPage },
  { key: "counts", section: "counts", Content: CountsPage },
];

const styles = StyleSheet.create({
  lines: { gap: 6 },
  line: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  deck: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  chipText: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14 },
});

// Seal the Manor's "How to play" pages. The Roles page is built from
// the role tables in logic.ts; the other pages are the plain text
// under rules.nightwatch in the locale files.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { RulesText } from "@/features/game/RulesText";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import {
  ALL_ROLES,
  EVENT_EMOJI,
  ROLE_EMOJI,
  ROLE_SETS,
  ROOMS,
  ROOM_COLOR,
  ROOM_NEEDS,
  sideOf,
  type NightEvent,
  type Role,
} from "./logic";
import { GameText as AppText } from "./GameText";
import { ManorPicture } from "./ManorMap";
import { RoomPicture } from "./RoomPicture";

const PLAYER_COUNTS = Object.keys(ROLE_SETS)
  .map(Number)
  .sort((a, b) => a - b);

/** Smallest table that deals `copies` of this role. */
function playersFor(role: Role, copies: number): number | undefined {
  return PLAYER_COUNTS.find(
    (count) => ROLE_SETS[count].filter((r) => r === role).length >= copies
  );
}

function OverviewPage() {
  const { t } = useTranslation();
  return (
    <AppText variant="body" color="textMuted">
      {t("rules.nightwatch.intro")}
    </AppText>
  );
}

function RolesPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.nightwatch.roles.intro")}
      </AppText>
      {ALL_ROLES.map((role) => {
        const evil = sideOf(role) === "evil";
        const tint = evil ? colors.danger : colors.success;
        const one = playersFor(role, 1);
        const two = playersFor(role, 2);
        const inPlay = [
          one === PLAYER_COUNTS[0]
            ? t("rules.nightwatch.roles.everyGame")
            : t("rules.nightwatch.roles.fromPlayers", { count: one }),
          two !== undefined
            ? t("rules.nightwatch.roles.twoFrom", { count: two })
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <View
            key={role}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: tint },
            ]}
          >
            <View style={styles.cardHead}>
              <AppText style={styles.emoji}>{ROLE_EMOJI[role]}</AppText>
              <View style={styles.grow}>
                <AppText variant="title">
                  {t(`nightwatch.roles.${role}.name`)}
                </AppText>
                <AppText
                  variant="tiny"
                  style={{ fontFamily: fontFamily.semiBold, color: tint }}
                >
                  {`${t(`nightwatch.sides.${evil ? "evil" : "good"}`)} · ${inPlay}`}
                </AppText>
              </View>
            </View>
            <AppText variant="caption">
              {t(`nightwatch.roles.${role}.desc`)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/** The nine rooms in the order of the map, each with its picture, how
 *  many people it takes, and what it does. */
function RoomsPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.nightwatch.rooms.intro")}
      </AppText>
      {ROOMS.map((id, room) => {
        const needs = ROOM_NEEDS[id];
        return (
          <View
            key={id}
            style={[
              styles.card,
              styles.room,
              { backgroundColor: colors.card, borderColor: needs ? colors.primary : colors.border },
            ]}
          >
            <RoomPicture room={room} width={96} />
            <View style={[styles.grow, styles.roomText]}>
              <AppText variant="title" style={{ color: ROOM_COLOR[id] }}>
                {t(`nightwatch.rooms.${id}`)}
              </AppText>
              {id !== "hall" ? (
                <AppText
                  variant="tiny"
                  style={{
                    fontFamily: fontFamily.semiBold,
                    color: needs ? colors.primary : colors.textMuted,
                  }}
                >
                  {t(`nightwatch.needs.${needs === 1 ? "one" : needs === 2 ? "two" : "any"}`)}
                </AppText>
              ) : null}
              <AppText variant="caption">{t(`rules.nightwatch.rooms.${id}`)}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** The house: the map itself, then how you move about it. */
function MapPage() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <ManorPicture roomName={(room) => t(`nightwatch.rooms.${ROOMS[room]}`)} />
      <RulesText i18nKey={`rules.nightwatch.sections.${MAP_SECTION}`} />
    </View>
  );
}

const EVENTS = Object.keys(EVENT_EMOJI) as NightEvent[];

/** The night events, one to a card. */
function EventsPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.nightwatch.events.intro")}
      </AppText>
      {EVENTS.map((event) => (
        <View
          key={event}
          style={[
            styles.card,
            styles.room,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AppText style={styles.eventEmoji}>{EVENT_EMOJI[event]}</AppText>
          <View style={[styles.grow, styles.roomText]}>
            <AppText variant="title">{t(`nightwatch.events.${event}.name`)}</AppText>
            <AppText variant="caption">{t(`rules.nightwatch.events.${event}`)}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const MAP_SECTION = 1;
const ROOMS_SECTION = 3;
const EVENTS_SECTION = 4;
const PAGES: Record<number, RulesPage["Content"]> = {
  [MAP_SECTION]: MapPage,
  [ROOMS_SECTION]: RoomsPage,
  [EVENTS_SECTION]: EventsPage,
};

const section = (index: number): RulesPage => ({
  key: `section-${index}`,
  titleKey: `rules.nightwatch.sections.${index}.title`,
  Content:
    PAGES[index] ??
    function SectionPage() {
      return <RulesText i18nKey={`rules.nightwatch.sections.${index}`} />;
    },
});

// Sections of rules.nightwatch.sections, in the locale files' order:
// sides, the house (with the map), each night, room functions and night
// events (pages of their own, one card each), ending.
const SECTION_COUNT = 6;

export const NIGHTWATCH_RULES: RulesPage[] = [
  { key: "overview", titleKey: "rules.overview", Content: OverviewPage },
  { key: "roles", titleKey: "rules.nightwatch.roles.title", Content: RolesPage },
  ...Array.from({ length: SECTION_COUNT }, (_, index) => section(index)),
];

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { borderWidth: 1.5, borderRadius: 18, padding: 12, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 30, lineHeight: 38 },
  eventEmoji: { fontSize: 40, lineHeight: 50, width: 56, textAlign: "center" },
  room: { flexDirection: "row", alignItems: "center", gap: 12 },
  roomText: { gap: 4 },
});

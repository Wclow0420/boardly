// Seal the Manor's "How to play" pages. The Roles and player-count
// pages are built from the tables in logic.ts; the other pages are the plain text
// under rules.nightwatch in the locale files.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { RulesText } from "@/features/game/RulesText";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import {
  ALL_ROLES,
  EVENT_EMOJI,
  MISSION_SIZES,
  failsNeeded,
  ROLE_EMOJI,
  ROLE_SETS,
  ROOMS,
  ROOM_COLOR,
  ROOM_NEEDS,
  GOOD_ROLES,
  EVIL_ROLES,
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

/** Who plays at each table size: sides, roles, each night's team and
 *  the votes a team needs — all read from logic.ts. */
function CountsPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const head = [
    t("rules.nightwatch.counts.players"),
    t("rules.nightwatch.counts.good"),
    t("rules.nightwatch.counts.evil"),
    ...[1, 2, 3, 4, 5].map((n) => t("rules.nightwatch.counts.night", { n })),
    t("rules.nightwatch.counts.votes"),
  ];
  // Group a table's roles as "Name ×2" in the order the Roles page uses
  const roleList = (roles: Role[], side: Role[]) =>
    side
      .filter((role) => roles.includes(role))
      .map((role) => {
        const copies = roles.filter((r) => r === role).length;
        // non-breaking spaces keep each icon with its name
        return `${ROLE_EMOJI[role]}\u00A0${t(`nightwatch.roles.${role}.name`)}${copies > 1 ? `\u00A0×${copies}` : ""}`;
      })
      .join("  ");
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.nightwatch.counts.intro")}
      </AppText>
      <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={[styles.tr, { backgroundColor: colors.well }]}>
          {head.map((label, i) => (
            <AppText
              key={i}
              variant="tiny"
              numberOfLines={1}
              style={[styles.td, i === 0 && styles.first, { fontFamily: fontFamily.semiBold }]}
            >
              {label}
            </AppText>
          ))}
        </View>
        {PLAYER_COUNTS.map((n) => {
          const roles = ROLE_SETS[n];
          const evil = roles.filter((r) => sideOf(r) === "evil").length;
          const cells = [
            String(n),
            String(n - evil),
            String(evil),
            ...MISSION_SIZES[n].map((size, round) => `${size}${failsNeeded(n, round) > 1 ? "*" : ""}`),
            String(Math.floor(n / 2) + 1),
          ];
          return (
            <View key={n} style={[styles.tr, { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
              {cells.map((cell, i) => (
                <AppText
                  key={i}
                  variant="caption"
                  style={[
                    styles.td,
                    i === 0 && styles.first,
                    i === 1 && { color: colors.success },
                    i === 2 && { color: colors.danger },
                  ]}
                >
                  {cell}
                </AppText>
              ))}
            </View>
          );
        })}
      </View>
      <AppText variant="tiny" color="textMuted">
        {t("rules.nightwatch.counts.star")}
      </AppText>
      {PLAYER_COUNTS.map((n) => (
        <View key={n} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 4 }]}>
          <AppText variant="title">{t("rules.nightwatch.counts.table", { n })}</AppText>
          <AppText variant="caption" style={{ color: colors.success }}>
            {roleList(ROLE_SETS[n], GOOD_ROLES)}
          </AppText>
          <AppText variant="caption" style={{ color: colors.danger }}>
            {roleList(ROLE_SETS[n], EVIL_ROLES)}
          </AppText>
        </View>
      ))}
      <RulesText i18nKey="rules.nightwatch.countNotes" />
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
  { key: "counts", titleKey: "rules.nightwatch.counts.title", Content: CountsPage },
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
  table: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  tr: { flexDirection: "row" },
  td: { flex: 1, textAlign: "center", paddingVertical: 6 },
  first: { flex: 1.6 },
});

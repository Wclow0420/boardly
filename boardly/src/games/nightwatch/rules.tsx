// Seal the Manor's "How to play", in the standard sections
// (features/game/rules): overview, teams, roles, a night step by step,
// the nine rooms, the night events and the player counts. Everything
// countable (who is dealt at each table, team sizes, votes) is read
// from logic.ts; the words are under rules.nightwatch in the locales.

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { IsoPicture } from "@/components/iso";
import { AppText } from "@/components/ui";
import {
  CountsTable,
  RuleCard,
  RuleHeading,
  RuleLead,
  RuleNote,
  RulePage,
  RuleSteps,
  RuleText,
} from "@/features/game/rules/blocks";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import {
  EVENT_EMOJI,
  EVIL_ROLES,
  GOOD_ROLES,
  MISSION_SIZES,
  PLAYER_COUNTS,
  ROLE_EMOJI,
  ROLE_SETS,
  ROOMS,
  ROOM_COLOR,
  ROOM_EMOJI,
  ROOM_NEEDS,
  failsNeeded,
  sideOf,
  type NightEvent,
  type Role,
  type Side,
} from "./logic";
import { EMOJI_ICON, GameIcon } from "./icons";
import { MANOR_HEIGHT, MANOR_WIDTH, floorPoint, manorShapes } from "./manorShapes";
import { RoomPicture } from "./RoomPicture";

const R = "rules.nightwatch";
const FEWEST = PLAYER_COUNTS[0];
const MOST = PLAYER_COUNTS[PLAYER_COUNTS.length - 1];
const NIGHTS = MISSION_SIZES[FEWEST].length;
const EVENTS = Object.keys(EVENT_EMOJI) as NightEvent[];
/** Events that change the house for the rest of the game. */
const LASTING: NightEvent[] = ["collapse", "secretDoor"];

const copiesAt = (count: number, role: Role) => ROLE_SETS[count].filter((r) => r === role).length;
/** Smallest table that deals `copies` of this role. */
const playersFor = (role: Role, copies: number) => PLAYER_COUNTS.find((count) => copiesAt(count, role) >= copies);
/** How many of a side sit at the smallest and the largest table. */
const sideRange = (side: Side) => {
  const sizes = PLAYER_COUNTS.map((count) => ROLE_SETS[count].filter((r) => sideOf(r) === side).length);
  return { min: Math.min(...sizes), max: Math.max(...sizes) };
};

/** The game's own drawing of an emoji (as its board shows it), for a
 *  card's picture; the shared emblem where the game has none. */
function gameIcon(emoji: string, color: string) {
  const name = EMOJI_ICON[emoji.replace(/\uFE0F/g, "")];
  return name ? <GameIcon name={name} size={30} color={color} /> : undefined;
}

function useSideTint() {
  const { colors } = useTheme();
  return (side: Side) => (side === "evil" ? colors.danger : colors.success);
}

function OverviewPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.intro`)}</RuleLead>
      <RuleText>{t(`${R}.overview.win`)}</RuleText>
      <RuleText>{t(`${R}.overview.secret`)}</RuleText>
      <RuleText>{t(`${R}.overview.length`, { nights: NIGHTS, min: FEWEST, max: MOST })}</RuleText>
    </RulePage>
  );
}

function TeamsPage() {
  const { t } = useTranslation();
  const tint = useSideTint();
  const names = (roles: Role[]) => roles.map((role) => t(`nightwatch.roles.${role}.name`)).join(t(`${R}.teams.and`));
  return (
    <RulePage>
      <RuleLead>{t(`${R}.teams.lead`)}</RuleLead>
      {(["good", "evil"] as const).map((side) => (
        <RuleCard
          key={side}
          emoji={side === "good" ? "🏮" : "👻"}
          picture={gameIcon(side === "good" ? "🏮" : "👻", tint(side))}
          name={t(`${R}.teams.${side}.name`)}
          tint={tint(side)}
          tags={[t(`${R}.teams.${side}.tag`), t(`${R}.teams.size`, sideRange(side))]}
        >
          {t(`${R}.teams.${side}.text`, { roles: names(side === "good" ? GOOD_ROLES : EVIL_ROLES) })}
        </RuleCard>
      ))}
    </RulePage>
  );
}

function RolesPage() {
  const { t } = useTranslation();
  const tint = useSideTint();
  const tags = (role: Role) => {
    const one = playersFor(role, 1);
    const two = playersFor(role, 2);
    return [
      one === FEWEST ? t(`${R}.roles.everyGame`) : t(`${R}.roles.from`, { count: one }),
      ...(two !== undefined ? [t(`${R}.roles.two`, { count: two })] : []),
    ];
  };
  return (
    <RulePage>
      <RuleLead>{t(`${R}.roles.lead`)}</RuleLead>
      {(["good", "evil"] as const).map((side) => (
        <View key={side} style={styles.group}>
          <RuleHeading tint={tint(side)}>{t(`${R}.teams.${side}.name`)}</RuleHeading>
          {(side === "good" ? GOOD_ROLES : EVIL_ROLES).map((role) => (
            <RuleCard
              key={role}
              emoji={ROLE_EMOJI[role]}
              picture={gameIcon(ROLE_EMOJI[role], tint(side))}
              name={t(`nightwatch.roles.${role}.name`)}
              tint={tint(side)}
              tags={tags(role)}
            >
              {t(`${R}.roles.${role}`)}
            </RuleCard>
          ))}
        </View>
      ))}
      <RuleNote>{t(`${R}.roles.assassin`)}</RuleNote>
      <RuleNote>{t(`${R}.roles.decoy`)}</RuleNote>
    </RulePage>
  );
}

const STEPS = [
  ["announce", "📣"],
  ["patrol", "👣"],
  ["room", "🚪"],
  ["talk", "✉️"],
  ["team", "🗳️"],
  ["mission", "🕯️"],
] as const;

function PlayPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.play.lead`, { nights: NIGHTS })}</RuleLead>
      <RuleSteps
        steps={STEPS.map(([key, emoji]) => ({
          emoji,
          title: t(`${R}.play.${key}.title`),
          detail: t(`${R}.play.${key}.detail`),
        }))}
      />
      <RuleText>{t(`${R}.play.cards`)}</RuleText>
      <RuleHeading>{`🗡️ ${t(`${R}.play.lastTitle`)}`}</RuleHeading>
      <RuleText>{t(`${R}.play.last`)}</RuleText>
      <RuleNote>{t(`${R}.play.rejected`)}</RuleNote>
    </RulePage>
  );
}

/** The empty manor, baked once like the room pictures, with each room's
 *  name over its floor in the room's colour. */
function ManorMapPicture() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const scale = width / MANOR_WIDTH;
  return (
    <View onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
      {width > 0 ? (
        <View style={{ width, height: MANOR_HEIGHT * scale }}>
          <IsoPicture
            shapes={() =>
              manorShapes({ accent: colors.primary, collapsed: [], lockedDoor: null, secretDoors: [], tints: {} })
            }
            width={MANOR_WIDTH}
            height={MANOR_HEIGHT}
            size={width}
            cacheKey={`manor-map|${colors.primary}`}
          />
          {ROOMS.map((id, room) => {
            const [x, y] = floorPoint(room, 0.6, 0.6);
            return (
              <View key={id} pointerEvents="none" style={[styles.label, { left: x * scale - 60, top: y * scale - 10 }]}>
                <AppText style={[styles.labelText, { color: ROOM_COLOR[id], borderColor: ROOM_COLOR[id] }]} numberOfLines={1}>
                  {t(`nightwatch.rooms.${id}`)}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** A card's text set to the exact width it is given. Deep in the Rooms
 *  page a plain line (the Garden's) was measured one line too wide on
 *  iOS and cut off at the card's edge; an explicit width keeps it wrapped. */
function FitText({ children, color }: { children: string; color: string }) {
  const [width, setWidth] = useState<number>();
  return (
    <View style={styles.cardText} onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}>
      <AppText style={[styles.small, { color }, width ? { width } : null]}>{children}</AppText>
    </View>
  );
}

function RoomsPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const needs = (id: (typeof ROOMS)[number]) => {
    if (id === "hall") return t(`${R}.rooms.needs.none`);
    const n = ROOM_NEEDS[id];
    return t(`${R}.rooms.needs.${n === 1 ? "one" : n === 2 ? "two" : "any"}`);
  };
  return (
    <RulePage>
      <RuleLead>{t(`${R}.rooms.lead`)}</RuleLead>
      <ManorMapPicture />
      <RuleText>{t(`${R}.rooms.mission`)}</RuleText>
      <RuleText>{t(`${R}.rooms.use`)}</RuleText>
      {ROOMS.map((id, room) => (
        <RuleCard
          key={id}
          picture={<RoomPicture room={room} width={76} />}
          name={`${ROOM_EMOJI[id]} ${t(`nightwatch.rooms.${id}`)}`}
          tint={ROOM_COLOR[id]}
          tags={[t(`${R}.rooms.fn.${id}`), needs(id)]}
        >
          <FitText color={colors.text}>{t(`${R}.rooms.text.${id}`)}</FitText>
        </RuleCard>
      ))}
      <RuleNote>{t(`${R}.rooms.tip`)}</RuleNote>
    </RulePage>
  );
}

function EventsPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.events.lead`, { count: NIGHTS - 1, total: EVENTS.length })}</RuleLead>
      {EVENTS.map((event) => (
        <RuleCard
          key={event}
          emoji={EVENT_EMOJI[event]}
          picture={gameIcon(EVENT_EMOJI[event], colors.primary)}
          name={t(`nightwatch.events.${event}.name`)}
          tags={[t(`${R}.events.${LASTING.includes(event) ? "lasting" : "tonight"}`)]}
        >
          {t(`${R}.events.text.${event}`)}
        </RuleCard>
      ))}
    </RulePage>
  );
}

function CountsPage() {
  const { t } = useTranslation();
  const evilAt = (count: number) => ROLE_SETS[count].filter((r) => sideOf(r) === "evil").length;
  const nights = MISSION_SIZES[FEWEST].map((_, night) => ({
    label: t(`${R}.counts.night`, { n: night + 1 }),
    values: PLAYER_COUNTS.map(
      (count) => `${MISSION_SIZES[count][night]}${failsNeeded(count, night) > 1 ? "*" : ""}`,
    ),
  }));
  return (
    <RulePage>
      <RuleLead>{t(`${R}.counts.lead`, { min: FEWEST, max: MOST })}</RuleLead>
      <CountsTable
        counts={PLAYER_COUNTS}
        rows={[
          { label: t(`${R}.teams.good.name`), values: PLAYER_COUNTS.map((count) => count - evilAt(count)) },
          { label: t(`${R}.teams.evil.name`), values: PLAYER_COUNTS.map(evilAt) },
          ...nights,
          { label: t(`${R}.counts.votes`), values: PLAYER_COUNTS.map((count) => Math.floor(count / 2) + 1) },
        ]}
      />
      <RuleText>{t(`${R}.counts.star`)}</RuleText>
      <RuleHeading>{t(`${R}.counts.dealt`)}</RuleHeading>
      <CountsTable
        counts={PLAYER_COUNTS}
        rows={[...GOOD_ROLES, ...EVIL_ROLES].map((role) => ({
          label: `${ROLE_EMOJI[role]} ${t(`nightwatch.roles.${role}.name`)}`,
          values: PLAYER_COUNTS.map((count) => copiesAt(count, role) || "–"),
        }))}
      />
      <RuleNote>{t(`${R}.counts.note`)}</RuleNote>
    </RulePage>
  );
}

export const NIGHTWATCH_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: OverviewPage },
  { key: "teams", section: "teams", Content: TeamsPage },
  { key: "roles", section: "roles", Content: RolesPage },
  { key: "play", section: "play", Content: PlayPage },
  { key: "rooms", section: "rooms", Content: RoomsPage },
  { key: "events", section: "events", Content: EventsPage },
  { key: "counts", section: "counts", Content: CountsPage },
];

const styles = StyleSheet.create({
  group: { gap: 10 },
  cardText: { alignSelf: "stretch" },
  small: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  label: { position: "absolute", width: 120, alignItems: "center" },
  labelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 14,
    paddingHorizontal: 6,
    borderRadius: 7,
    borderWidth: 0.6,
    overflow: "hidden",
    backgroundColor: "rgba(11,14,22,0.82)",
  },
});

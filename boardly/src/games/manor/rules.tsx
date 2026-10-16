// Midnight Manor's "How to play", written with the shared rule pieces
// (features/game/rules). Roles, rooms and the counts table are built from
// logic.ts (the role sets, the floor plan, the cameras, where the weapons
// lie); the wording lives under rules.manor, names under manor.*.

import { useTranslation } from "react-i18next";

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
import { useTheme } from "@/theme";
import type { RulesPage } from "../types";
import {
  BEDROOM,
  CAMERA_ROOMS,
  HALL,
  HOURS,
  ITEM_EMOJI,
  ITEM_HOME,
  PLAYER_COUNTS,
  ROOM_EMOJI,
  ROOMS,
  SECURITY,
  neighbors,
  roleCount,
  type Action,
  type Item,
  type Role,
} from "./logic";

const R = "rules.manor";
const MIN = PLAYER_COUNTS[0];
const MAX = PLAYER_COUNTS[PLAYER_COUNTS.length - 1];

const ROLE_EMOJI: Record<Role, string> = {
  butler: "🤵",
  guard: "🔦",
  guest: "🧳",
  intruder: "🗡️",
};

function useSides() {
  const { colors } = useTheme();
  return { good: colors.successStrong, evil: colors.danger };
}

function Overview() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.intro`)}</RuleLead>
      <RuleText>{t(`${R}.overview.win`)}</RuleText>
      <RuleText>{t(`${R}.overview.length`, { min: MIN, max: MAX, hours: HOURS })}</RuleText>
    </RulePage>
  );
}

function Teams() {
  const { t } = useTranslation();
  const side = useSides();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.teams.lead`)}</RuleLead>
      <RuleCard emoji="🛡️" name={t(`${R}.teams.household.name`)} tint={side.good}>
        {t(`${R}.teams.household.text`)}
      </RuleCard>
      <RuleCard emoji="🎭" name={t(`${R}.teams.intruders.name`)} tint={side.evil}>
        {t(`${R}.teams.intruders.text`)}
      </RuleCard>
    </RulePage>
  );
}

function Roles() {
  const { t } = useTranslation();
  const side = useSides();
  // how many of a role sit at the table, over every table size
  const howMany = (role: Role) => {
    const counts = PLAYER_COUNTS.map((n) => roleCount(n, role));
    const from = Math.min(...counts);
    const to = Math.max(...counts);
    return from === to ? t(`${R}.roles.perGame`, { count: from }) : t(`${R}.roles.range`, { from, to });
  };
  const card = (role: Role, tint: string) => (
    <RuleCard
      key={role}
      emoji={ROLE_EMOJI[role]}
      name={t(`manor.roles.${role}.name`)}
      tint={tint}
      tags={[howMany(role)]}
    >
      {t(`${R}.roles.${role}`)}
    </RuleCard>
  );
  return (
    <RulePage>
      <RuleLead>{t(`${R}.roles.lead`)}</RuleLead>
      <RuleHeading tint={side.good}>{t(`${R}.teams.household.name`)}</RuleHeading>
      {(["butler", "guard", "guest"] as Role[]).map((role) => card(role, side.good))}
      <RuleHeading tint={side.evil}>{t(`${R}.teams.intruders.name`)}</RuleHeading>
      {card("intruder", side.evil)}
    </RulePage>
  );
}

const STEPS = [
  { key: "start", emoji: "🌙" },
  { key: "move", emoji: "👣" },
  { key: "act", emoji: "🕯️" },
  { key: "dark", emoji: "🌑" },
  { key: "owner", emoji: "👴" },
  { key: "meet", emoji: "🗳️" },
  { key: "dawn", emoji: "🌅" },
];

function Play() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.play.lead`)}</RuleLead>
      <RuleSteps
        steps={STEPS.map(({ key, emoji }) => ({
          emoji,
          title: t(`${R}.play.steps.${key}.title`),
          detail: t(`${R}.play.steps.${key}.detail`),
        }))}
      />
      <RuleNote>{t(`${R}.play.note`)}</RuleNote>
    </RulePage>
  );
}

// Every action, with who may take it and where (the game's own checks in
// availableActions / game.py)
const ACTIONS: { action: Action | "hide"; emoji: string; tags: string[]; evil?: boolean }[] = [
  { action: "guard", emoji: "🛡️", tags: ["ownerHere"] },
  { action: "attack", emoji: "🔪", tags: ["intruders", "weapon", "ownerHere"], evil: true },
  { action: "escort", emoji: "🤝", tags: ["ownerHere"] },
  { action: "take", emoji: "✋", tags: ["itemHere"] },
  { action: "fix", emoji: "📷", tags: ["broken"] },
  { action: "break", emoji: "🚫", tags: ["intruders", "working"], evil: true },
  { action: "watch", emoji: "🖥️", tags: ["security"] },
  { action: "search", emoji: "🔍", tags: ["someone"] },
  { action: "flashlight", emoji: "🔦", tags: ["guard"] },
  { action: "wait", emoji: "🤫", tags: [] },
  { action: "hide", emoji: "🫥", tags: ["intruders", "once"], evil: true },
];

function Actions() {
  const { t } = useTranslation();
  const side = useSides();
  const name = (action: Action | "hide") =>
    action === "take"
      ? t(`${R}.actions.takeName`)
      : action === "hide"
        ? t(`${R}.actions.hideName`)
        : t(`manor.actions.${action}.name`);
  return (
    <RulePage>
      <RuleLead>{t(`${R}.actions.lead`)}</RuleLead>
      {ACTIONS.map(({ action, emoji, tags, evil }) => (
        <RuleCard
          key={action}
          emoji={emoji}
          name={name(action)}
          tint={evil ? side.evil : undefined}
          tags={tags.map((tag) => t(`${R}.actions.tags.${tag}`))}
        >
          {t(`${R}.actions.${action}`)}
        </RuleCard>
      ))}
    </RulePage>
  );
}

// What lies where when the night starts
const ITEM_IN = Object.fromEntries(
  (Object.entries(ITEM_HOME) as [Item, number][]).map(([item, room]) => [room, item]),
) as Record<number, Item | undefined>;
// The rooms with a line of their own
const ROOM_NOTE: Record<number, string> = { [HALL]: "hall", [BEDROOM]: "bedroom", [SECURITY]: "security" };

function Rooms() {
  const { t } = useTranslation();
  const roomName = (room: number) => t(`manor.rooms.${ROOMS[room]}`);
  return (
    <RulePage>
      <RuleLead>{t(`${R}.rooms.lead`)}</RuleLead>
      {ROOMS.map((id, room) => {
        const item = ITEM_IN[room];
        const tags = [
          ...(CAMERA_ROOMS.includes(room) ? [t(`${R}.rooms.camera`)] : []),
          ...(item ? [`${ITEM_EMOJI[item]} ${t(`manor.items.${item}`)}`] : []),
        ];
        const note = ROOM_NOTE[room];
        const next = t(`${R}.rooms.next`, { rooms: neighbors(room).map(roomName).join(" · ") });
        return (
          <RuleCard key={id} emoji={ROOM_EMOJI[id]} name={roomName(room)} tags={tags}>
            {note ? `${t(`${R}.rooms.${note}`)}\n${next}` : next}
          </RuleCard>
        );
      })}
      <RuleNote>{t(`${R}.rooms.note`)}</RuleNote>
    </RulePage>
  );
}

function Events() {
  const { t } = useTranslation();
  const side = useSides();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.events.lead`)}</RuleLead>
      <RuleCard emoji="📣" name={t(`${R}.events.scream.name`)} tint={side.evil}>
        {t(`${R}.events.scream.text`)}
      </RuleCard>
      <RuleCard emoji="🗳️" name={t(`${R}.events.meeting.name`)} tint={side.good}>
        {t(`${R}.events.meeting.text`)}
      </RuleCard>
      <RuleCard emoji="🌅" name={t(`${R}.events.dawn.name`)}>
        {t(`${R}.events.dawn.text`)}
      </RuleCard>
    </RulePage>
  );
}

const COUNTED: Role[] = ["butler", "guard", "guest", "intruder"];

function Counts() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.counts.lead`)}</RuleLead>
      <CountsTable
        counts={PLAYER_COUNTS}
        rows={COUNTED.map((role) => ({
          label: `${ROLE_EMOJI[role]} ${t(`manor.roles.${role}.name`)}`,
          values: PLAYER_COUNTS.map((n) => roleCount(n, role)),
        }))}
      />
      <RuleNote>{t(`${R}.counts.note`, { min: MIN })}</RuleNote>
    </RulePage>
  );
}

export const MANOR_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: Overview },
  { key: "teams", section: "teams", Content: Teams },
  { key: "roles", section: "roles", Content: Roles },
  { key: "play", section: "play", Content: Play },
  { key: "actions", section: "actions", Content: Actions },
  { key: "rooms", section: "rooms", Content: Rooms },
  { key: "events", section: "events", Content: Events },
  { key: "counts", section: "counts", Content: Counts },
];

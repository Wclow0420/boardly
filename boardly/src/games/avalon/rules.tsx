// Double Agent's "How to play", written to the rules standard
// (features/game/rules): Overview, Teams, Roles, How to play, Player
// counts. The teams' sizes, the roles' "from N players" tags and the
// counts tables are built from the role and team-size tables in
// logic.ts; the wording lives under rules.avalon in the locales.

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
import { RolePortrait } from "./RolePortrait";
import {
  ALL_ROLES,
  MAX_REJECTIONS,
  PLAYER_COUNTS,
  QUEST_SIZES,
  ROLE_SETS,
  failsNeeded,
  sideOf,
  type Role,
  type Side,
} from "./logic";

const COUNTS = [...PLAYER_COUNTS];
const MIN = COUNTS[0];
const MAX = COUNTS[COUNTS.length - 1];

/** How many of a side (or of one role) are dealt with `n` players. */
const sideCount = (n: number, side: Side) => ROLE_SETS[n].filter((r) => sideOf(r) === side).length;
const roleCount = (n: number, role: Role) => ROLE_SETS[n].filter((r) => r === role).length;

/** "3–6" for a range, "2" when it never changes. */
function span(values: number[]): string {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

function useSideTint() {
  const { colors } = useTheme();
  return (side: Side) => (side === "evil" ? colors.danger : colors.success);
}

function OverviewPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t("rules.avalon.overview.lead")}</RuleLead>
      <RuleText>{t("rules.avalon.overview.win")}</RuleText>
      <RuleText>{t("rules.avalon.overview.shot")}</RuleText>
      <RuleText>{t("rules.avalon.overview.size", { min: MIN, max: MAX })}</RuleText>
    </RulePage>
  );
}

function TeamsPage() {
  const { t } = useTranslation();
  const tint = useSideTint();
  return (
    <RulePage>
      <RuleLead>{t("rules.avalon.teams.lead")}</RuleLead>
      {(["good", "evil"] as const).map((side) => (
        <RuleCard
          key={side}
          picture={<RolePortrait role={side === "good" ? "servant" : "minion"} size={58} />}
          name={t(`rules.avalon.teams.${side}.name`)}
          tint={tint(side)}
          tags={[t("rules.avalon.tags.perGame", { n: span(COUNTS.map((n) => sideCount(n, side))) })]}
        >
          {t(`rules.avalon.teams.${side}.text`, { rejections: MAX_REJECTIONS })}
        </RuleCard>
      ))}
    </RulePage>
  );
}

/** The tag for when a role is dealt: always, from N players, or only at
 *  some counts. */
function useWhenTag() {
  const { t } = useTranslation();
  return (role: Role): string | null => {
    const at = COUNTS.filter((n) => roleCount(n, role) > 0);
    if (at.length === COUNTS.length) return null;
    if (at.every((n, i) => i === 0 || n === at[i - 1] + 1) && at[at.length - 1] === MAX) {
      return t("rules.avalon.tags.from", { n: at[0] });
    }
    return t("rules.avalon.tags.only", { counts: at.join("/") });
  };
}

function RolesPage() {
  const { t } = useTranslation();
  const tint = useSideTint();
  const when = useWhenTag();
  return (
    <RulePage>
      <RuleLead>{t("rules.avalon.roles.lead")}</RuleLead>
      {(["good", "evil"] as const).map((side) => (
        <RulePage key={side}>
          <RuleHeading tint={tint(side)}>{t(`rules.avalon.teams.${side}.name`)}</RuleHeading>
          {ALL_ROLES.filter((role) => sideOf(role) === side).map((role) => {
            const most = Math.max(...COUNTS.map((n) => roleCount(n, role)));
            const tags = [
              when(role),
              most > 1 ? t("rules.avalon.tags.perGame", { n: span(COUNTS.map((n) => roleCount(n, role))) }) : null,
            ].filter((tag): tag is string => tag !== null);
            return (
              <RuleCard
                key={role}
                picture={<RolePortrait role={role} size={58} />}
                name={t(`avalon.roles.${role}.name`)}
                tint={tint(side)}
                tags={tags}
              >
                {t(`rules.avalon.roles.${role}`)}
              </RuleCard>
            );
          })}
        </RulePage>
      ))}
    </RulePage>
  );
}

const STEPS = [
  { key: "role", emoji: "🎭" },
  { key: "team", emoji: "👑" },
  { key: "vote", emoji: "🗳" },
  { key: "rejected", emoji: "❌" },
  { key: "operation", emoji: "💼" },
  { key: "verdict", emoji: "✅" },
  { key: "end", emoji: "🏆" },
  { key: "shot", emoji: "🎯" },
] as const;

function PlayPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t("rules.avalon.play.lead")}</RuleLead>
      <RuleSteps
        steps={STEPS.map(({ key, emoji }) => ({
          emoji,
          title: t(`rules.avalon.play.${key}.title`),
          detail: t(`rules.avalon.play.${key}.detail`, { rejections: MAX_REJECTIONS }),
        }))}
      />
      <RuleNote>{t("rules.avalon.play.talk")}</RuleNote>
      <RuleNote>{t("rules.avalon.play.tip")}</RuleNote>
    </RulePage>
  );
}

function CountsPage() {
  const { t } = useTranslation();
  const name = (role: Role) => t(`avalon.roles.${role}.name`);
  return (
    <RulePage>
      <RuleLead>{t("rules.avalon.counts.lead")}</RuleLead>
      <RuleHeading>{t("rules.avalon.counts.teams")}</RuleHeading>
      <CountsTable
        counts={COUNTS}
        rows={[
          { label: t("rules.avalon.teams.good.name"), values: COUNTS.map((n) => sideCount(n, "good")) },
          { label: t("rules.avalon.teams.evil.name"), values: COUNTS.map((n) => sideCount(n, "evil")) },
          ...[0, 1, 2, 3, 4].map((op) => ({
            label: t("rules.avalon.counts.op", { n: op + 1 }),
            values: COUNTS.map((n) => `${QUEST_SIZES[n][op]}${failsNeeded(n, op) > 1 ? "*" : ""}`),
          })),
        ]}
      />
      <RuleNote>{t("rules.avalon.counts.twoFails")}</RuleNote>
      <RuleHeading>{t("rules.avalon.counts.roles")}</RuleHeading>
      <CountsTable
        counts={COUNTS}
        rows={ALL_ROLES.map((role) => ({
          label: name(role),
          values: COUNTS.map((n) => roleCount(n, role) || "–"),
        }))}
      />
    </RulePage>
  );
}

export const AVALON_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: OverviewPage },
  { key: "teams", section: "teams", Content: TeamsPage },
  { key: "roles", section: "roles", Content: RolesPage },
  { key: "play", section: "play", Content: PlayPage },
  { key: "counts", section: "counts", Content: CountsPage },
];

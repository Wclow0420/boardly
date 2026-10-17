// Hustle's "How to play", written to the rules standard
// (features/game/rules): Overview, Roles, How to play, Actions, Player
// counts. The role tags, the action cards and the counts table are built
// from the tables the game runs on (logic.ts), so they can't drift from
// the real rules; the wording lives under rules.coup in the locales.

import { useTranslation } from "react-i18next";

import {
  CountsTable,
  RuleCard,
  RuleLead,
  RuleNote,
  RulePage,
  RuleSteps,
  RuleText,
} from "@/features/game/rules/blocks";
import type { RulesPage } from "../types";
import { ACTION_EMOJI, ACTION_TINT, ROLE_TINT } from "./art";
import {
  ACTIONS,
  CARDS_EACH,
  DECK_SIZE,
  FORCED_COUP_AT,
  PLAYER_COUNTS,
  ROLES,
  STARTING_COINS,
  firstPlayerCoins,
  specOf,
} from "./logic";
import { RolePortrait } from "./RolePortrait";

const MIN = PLAYER_COUNTS[0];
const MAX = PLAYER_COUNTS[PLAYER_COUNTS.length - 1];

function OverviewPage() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t("rules.coup.overview.lead")}</RuleLead>
      <RuleText>{t("rules.coup.overview.cards", { cash: t("coup.coins", { count: STARTING_COINS }) })}</RuleText>
      <RuleText>{t("rules.coup.overview.win")}</RuleText>
      <RuleText>{t("rules.coup.overview.size", { min: MIN, max: MAX })}</RuleText>
    </RulePage>
  );
}

function RolesPage() {
  const { t } = useTranslation();
  const action = (type: string) => t(`coup.actions.${type}.name`);
  return (
    <RulePage>
      <RuleLead>{t("rules.coup.roles.lead")}</RuleLead>
      {ROLES.map((role) => {
        const own = ACTIONS.filter((a) => a.claim === role);
        const blocks = ACTIONS.filter((a) => a.blockers.includes(role));
        return (
          <RuleCard
            key={role}
            picture={<RolePortrait role={role} size={58} />}
            name={t(`coup.roles.${role}.name`)}
            tint={ROLE_TINT[role]}
            tags={[
              ...own.map((a) => t("rules.coup.tags.does", { action: action(a.type) })),
              ...blocks.map((a) => t("rules.coup.tags.blocks", { action: action(a.type) })),
            ]}
          >
            {t(`rules.coup.roles.${role}`)}
          </RuleCard>
        );
      })}
    </RulePage>
  );
}

const STEPS = [
  { key: "act", emoji: "🎲" },
  { key: "claim", emoji: "🎭" },
  { key: "challenge", emoji: "🔍" },
  { key: "block", emoji: "🚫" },
  { key: "resolve", emoji: "✅" },
  { key: "lose", emoji: "💀" },
  { key: "win", emoji: "🏆" },
] as const;

function PlayPage() {
  const { t } = useTranslation();
  const forced = t("coup.coins", { count: FORCED_COUP_AT });
  return (
    <RulePage>
      <RuleLead>{t("rules.coup.play.lead")}</RuleLead>
      <RuleSteps
        steps={STEPS.map(({ key, emoji }) => ({
          emoji,
          title: t(`rules.coup.play.${key}.title`),
          detail: t(`rules.coup.play.${key}.detail`, { forced }),
        }))}
      />
      <RuleNote>
        {t("rules.coup.play.doubleLoss", { cost: t("coup.coins", { count: specOf("assassinate").cost }) })}
      </RuleNote>
      <RuleNote>{t("rules.coup.play.secret")}</RuleNote>
    </RulePage>
  );
}

function ActionsPage() {
  const { t } = useTranslation();
  const role = (r: string) => t(`coup.roles.${r}.name`);
  return (
    <RulePage>
      <RuleLead>{t("rules.coup.actions.lead")}</RuleLead>
      {ACTIONS.map((a) => {
        const tags = [
          a.cost > 0 ? t("rules.coup.tags.cost", { cash: t("coup.coins", { count: a.cost }) }) : t("rules.coup.tags.free"),
          a.claim ? t("rules.coup.tags.claims", { role: role(a.claim) }) : t("rules.coup.tags.noClaim"),
          a.blockers.length === 0
            ? t("rules.coup.tags.unblockable")
            : t(a.anyoneBlocks ? "rules.coup.tags.anyoneBlocks" : "rules.coup.tags.targetBlocks", {
                roles: a.blockers.map(role).join(" / "),
              }),
        ];
        return (
          <RuleCard
            key={a.type}
            emoji={ACTION_EMOJI[a.type]}
            name={t(`coup.actions.${a.type}.name`)}
            tint={ACTION_TINT[a.type]}
            tags={tags}
          >
            {t(`rules.coup.effects.${a.type}`)}
          </RuleCard>
        );
      })}
      <RuleNote>{t("rules.coup.actions.forced", { forced: t("coup.coins", { count: FORCED_COUP_AT }) })}</RuleNote>
    </RulePage>
  );
}

function CountsPage() {
  const { t } = useTranslation();
  const counts = [...PLAYER_COUNTS];
  const cash = (n: number) => t("coup.coins", { count: n });
  return (
    <RulePage>
      <RuleLead>{t("rules.coup.counts.lead", { cards: DECK_SIZE })}</RuleLead>
      <CountsTable
        counts={counts}
        rows={[
          { label: t("rules.coup.counts.dealt"), values: counts.map((n) => n * CARDS_EACH) },
          { label: t("rules.coup.counts.deck"), values: counts.map((n) => DECK_SIZE - n * CARDS_EACH) },
          { label: t("rules.coup.counts.cash"), values: counts.map(() => cash(STARTING_COINS)) },
          { label: t("rules.coup.counts.first"), values: counts.map((n) => cash(firstPlayerCoins(n))) },
        ]}
      />
      <RuleNote>{t("rules.coup.counts.two", { first: cash(firstPlayerCoins(2)), cash: cash(STARTING_COINS) })}</RuleNote>
      <RuleNote>{t("rules.coup.counts.leave")}</RuleNote>
    </RulePage>
  );
}

export const COUP_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: OverviewPage },
  { key: "roles", section: "roles", Content: RolesPage },
  { key: "play", section: "play", Content: PlayPage },
  { key: "actions", section: "actions", Content: ActionsPage },
  { key: "counts", section: "counts", Content: CountsPage },
];

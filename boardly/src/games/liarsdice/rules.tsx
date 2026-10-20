// Liar's Dice's "How to play", written with the shared rule pieces
// (features/game/rules). The numbers (cups, drinks, the counts table) come
// from logic.ts, the wording from rules.liarsdice in the locales.

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
import type { RulesPage } from "../types";
import { DICE_EACH, DRINKS, KNOCKOUT_CUPS, PLAYER_COUNTS, openingFor, thresholds } from "./logic";

const R = "rules.liarsdice";
const MIN = PLAYER_COUNTS[0];
const MAX = PLAYER_COUNTS[PLAYER_COUNTS.length - 1];
/** The table the 几几几 card gives as its example. */
const EXAMPLE = 3;

function Overview() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.intro`)}</RuleLead>
      <RuleText>{t(`${R}.overview.calls`)}</RuleText>
      <RuleText>{t(`${R}.overview.win`, { cups: KNOCKOUT_CUPS })}</RuleText>
      <RuleText>{t(`${R}.overview.length`, { min: MIN, max: MAX })}</RuleText>
    </RulePage>
  );
}

const STEPS = [
  { key: "shake", emoji: "🎲" },
  { key: "call", emoji: "👥" },
  { key: "raise", emoji: "❗" },
  { key: "reveal", emoji: "🔍" },
  { key: "again", emoji: "🍺" },
];

function Play() {
  const { t } = useTranslation();
  const card = (key: string, emoji: string, opts?: Record<string, unknown>) => (
    <RuleCard emoji={emoji} name={t(`${R}.play.${key}.name`)}>
      {t(`${R}.play.${key}.text`, opts)}
    </RuleCard>
  );
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
      <RuleHeading>{t(`${R}.play.onesHeading`)}</RuleHeading>
      {card("kaizhai", "✨")}
      {card("zhai", "🎲")}
      {card("leopard", "🐆")}
      {card("bigLeopard", "🐆")}
      <RuleHeading>{t(`${R}.play.callingHeading`)}</RuleHeading>
      {card("jijiji", "🍻", {
        n: EXAMPLE,
        one: thresholds(EXAMPLE)[0],
        zhai: thresholds(EXAMPLE)[1],
        fei: thresholds(EXAMPLE)[2],
      })}
      {card("classic", "⚡")}
      {card("nozhai", "✨")}
      <RuleHeading>{t(`${R}.play.winHeading`)}</RuleHeading>
      {card("knockout", "🥴", { cups: KNOCKOUT_CUPS })}
      {card("endless", "⏳")}
      <RuleNote>{t(`${R}.play.note`)}</RuleNote>
    </RulePage>
  );
}

function Actions() {
  const { t } = useTranslation();
  const tag = (key: string) => t(`${R}.actions.tags.${key}`);
  const drinks = (count: number) => t(`${R}.actions.tags.drinks`, { count });
  const card = (key: string, emoji: string, tags: string[]) => (
    <RuleCard key={key} emoji={emoji} name={t(`${R}.actions.${key}.name`)} tags={tags}>
      {t(`${R}.actions.${key}.text`)}
    </RuleCard>
  );
  return (
    <RulePage>
      <RuleLead>{t(`${R}.actions.lead`)}</RuleLead>
      {card("call", "🎲", [tag("yourTurn")])}
      {card("open", "👊", [tag("yourTurn"), drinks(DRINKS.open)])}
      {card("split", "🪓", [tag("anyone"), drinks(DRINKS.split)])}
      {card("counter", "🥊", [tag("bidder"), drinks(DRINKS.counter)])}
      {card("reshake", "🔄", [tag("beforeFirst")])}
      {card("stop", "🗳", [tag("endless")])}
      <RuleNote>{t(`${R}.actions.note`)}</RuleNote>
    </RulePage>
  );
}

function Counts() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.counts.lead`)}</RuleLead>
      <CountsTable
        counts={PLAYER_COUNTS}
        rows={[
          { label: t(`${R}.counts.dice`), values: PLAYER_COUNTS.map((n) => n * DICE_EACH) },
          // 几几几: ONE / ZHAI / FEI
          { label: t(`${R}.counts.jjOne`), values: PLAYER_COUNTS.map((n) => thresholds(n)[0]) },
          { label: t(`${R}.counts.jjZhai`), values: PLAYER_COUNTS.map((n) => thresholds(n)[1]) },
          { label: t(`${R}.counts.jjFei`), values: PLAYER_COUNTS.map((n) => thresholds(n)[2]) },
          // classic's first calls, and no zhai's
          { label: t(`${R}.counts.zhai`), values: PLAYER_COUNTS.map((n) => openingFor(n, true)) },
          { label: t(`${R}.counts.opening`), values: PLAYER_COUNTS.map((n) => openingFor(n, false)) },
          { label: t(`${R}.counts.nozhai`), values: PLAYER_COUNTS.map((n) => openingFor(n, false)) },
        ]}
      />
      <RuleNote>{t(`${R}.counts.note`)}</RuleNote>
    </RulePage>
  );
}

export const LIARSDICE_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: Overview },
  { key: "play", section: "play", Content: Play },
  { key: "actions", section: "actions", Content: Actions },
  { key: "counts", section: "counts", Content: Counts },
];

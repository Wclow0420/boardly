// Tic-Tac-Toe's "How to play", written with the shared rule pieces
// (features/game/rules); the wording lives under rules.tictactoe.

import { useTranslation } from "react-i18next";

import { RuleLead, RuleNote, RulePage, RuleSteps, RuleText } from "@/features/game/rules/blocks";
import type { RulesPage } from "../types";

const R = "rules.tictactoe";

function Overview() {
  const { t } = useTranslation();
  return (
    <RulePage>
      <RuleLead>{t(`${R}.intro`)}</RuleLead>
      <RuleText>{t(`${R}.overview.win`)}</RuleText>
      <RuleText>{t(`${R}.overview.length`)}</RuleText>
    </RulePage>
  );
}

const STEPS = [
  { key: "first", emoji: "❌" },
  { key: "turn", emoji: "👥" },
  { key: "line", emoji: "⭕" },
  { key: "draw", emoji: "🤝" },
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

export const TICTACTOE_RULES: RulesPage[] = [
  { key: "overview", section: "overview", Content: Overview },
  { key: "play", section: "play", Content: Play },
];

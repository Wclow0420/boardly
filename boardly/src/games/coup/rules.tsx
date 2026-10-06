// Hustle's "How to play" pages. The Roles and Actions pages are built
// from the same action table the game runs on (logic.ts), so they can't
// drift from the real rules; the wording lives in the locale files.

import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { RulesText } from "@/features/game/RulesText";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import {
  ACTION_ART,
  ACTION_EMOJI,
  ACTION_TINT,
  ROLE_TINT,
} from "./art";
import { ACTIONS, type Role } from "./logic";
import { RolePortrait } from "./RolePortrait";

const ROLES: Role[] = ["duke", "assassin", "captain", "ambassador", "contessa"];

/** "Label  value" line inside a rules card. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="tiny" color="textSubtle" style={styles.factLabel}>
        {label}
      </AppText>
      <AppText variant="caption" style={styles.grow}>
        {value}
      </AppText>
    </View>
  );
}

function RolesPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.coup.pages.roles.intro")}
      </AppText>
      {ROLES.map((role) => {
        const own = ACTIONS.filter((a) => a.claim === role);
        const blocks = ACTIONS.filter((a) => a.blockers.includes(role));
        return (
          <View
            key={role}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: `${ROLE_TINT[role]}88`,
              },
            ]}
          >
            <View style={styles.cardHead}>
              <RolePortrait role={role} size={48} />
              <AppText variant="title" style={styles.grow}>
                {t(`coup.roles.${role}.name`)}
              </AppText>
            </View>
            <Fact
              label={t("rules.coup.labels.action")}
              value={
                own.length > 0
                  ? own
                      .map(
                        (a) =>
                          `${t(`coup.actions.${a.type}.name`)} — ${t(
                            `rules.coup.effects.${a.type}`
                          )}`
                      )
                      .join("\n")
                  : t("rules.coup.labels.noAction")
              }
            />
            <Fact
              label={t("rules.coup.labels.blocks")}
              value={
                blocks.length > 0
                  ? blocks.map((a) => t(`coup.actions.${a.type}.name`)).join(", ")
                  : t("rules.coup.labels.blocksNothing")
              }
            />
          </View>
        );
      })}
    </View>
  );
}

function ActionsPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.coup.pages.actions.intro")}
      </AppText>
      {ACTIONS.map((action) => {
        const tint = ACTION_TINT[action.type];
        const art = ACTION_ART[action.type];
        // Foreign aid is the one action anybody at the table may block
        const anyoneBlocks = action.type === "foreignAid";
        return (
          <View
            key={action.type}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: `${tint}88` },
            ]}
          >
            <View style={styles.cardHead}>
              {art ? (
                <Image source={art} style={styles.icon} contentFit="contain" />
              ) : (
                <View style={[styles.icon, { backgroundColor: `${tint}33` }]}>
                  <AppText style={styles.iconEmoji}>
                    {ACTION_EMOJI[action.type]}
                  </AppText>
                </View>
              )}
              <View style={styles.grow}>
                <AppText variant="title">
                  {t(`coup.actions.${action.type}.name`)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {t(`rules.coup.effects.${action.type}`)}
                </AppText>
              </View>
            </View>
            <Fact
              label={t("rules.coup.labels.cost")}
              value={
                action.cost > 0
                  ? t("coup.coins", { count: action.cost })
                  : t("rules.coup.labels.free")
              }
            />
            <Fact
              label={t("rules.coup.labels.needs")}
              value={
                action.claim
                  ? t("rules.coup.labels.needsRole", {
                      role: t(`coup.roles.${action.claim}.name`),
                    })
                  : t("rules.coup.labels.anyone")
              }
            />
            <Fact
              label={t("rules.coup.labels.blockedBy")}
              value={
                action.blockers.length > 0
                  ? `${action.blockers
                      .map((role) => t(`coup.roles.${role}.name`))
                      .join(" / ")} ${t(
                      anyoneBlocks
                        ? "rules.coup.labels.byAnyone"
                        : "rules.coup.labels.byTarget"
                    )}`
                  : t("rules.coup.labels.noBlock")
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const text = (page: string) =>
  function TextPage() {
    return <RulesText i18nKey={`rules.coup.pages.${page}`} />;
  };

export const COUP_RULES: RulesPage[] = [
  { key: "overview", titleKey: "rules.coup.pages.overview.title", Content: text("overview") },
  { key: "roles", titleKey: "rules.coup.pages.roles.title", Content: RolesPage },
  { key: "actions", titleKey: "rules.coup.pages.actions.title", Content: ActionsPage },
  { key: "challenges", titleKey: "rules.coup.pages.challenges.title", Content: text("challenges") },
  { key: "blocks", titleKey: "rules.coup.pages.blocks.title", Content: text("blocks") },
  { key: "more", titleKey: "rules.coup.pages.more.title", Content: text("more") },
];

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { borderWidth: 1.5, borderRadius: 18, padding: 12, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  fact: { flexDirection: "row", gap: 10 },
  factLabel: {
    width: 76,
    fontFamily: fontFamily.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 20, lineHeight: 26 },
});

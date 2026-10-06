// Double Agent's "How to play" pages. The Roles and Setup pages are
// built from the role and team-size tables in logic.ts; the wording
// lives in the locale files under rules.avalon.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { RulesText } from "@/features/game/RulesText";
import { fontFamily, useTheme } from "@/theme";
import type { RulesPage } from "../types";
import { RolePortrait } from "./RolePortrait";
import {
  ALL_ROLES,
  PLAYER_COUNTS,
  QUEST_SIZES,
  ROLE_SETS,
  failsNeeded,
  sideOf,
  type Role,
} from "./logic";

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
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.avalon.pages.roles.intro")}
      </AppText>
      {ALL_ROLES.map((role) => {
        const evil = sideOf(role) === "evil";
        const tint = evil ? colors.danger : colors.success;
        return (
          <View
            key={role}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: tint },
            ]}
          >
            <View style={styles.cardHead}>
              <RolePortrait role={role} size={48} />
              <View style={styles.grow}>
                <AppText variant="title">{t(`avalon.roles.${role}.name`)}</AppText>
                <AppText
                  variant="tiny"
                  style={{ fontFamily: fontFamily.semiBold, color: tint }}
                >
                  {t(`avalon.sides.${evil ? "evil" : "good"}`)}
                </AppText>
              </View>
            </View>
            <Fact
              label={t("rules.avalon.labels.knows")}
              value={t(`rules.avalon.roleFacts.${role}.knows`)}
            />
            {i18n.exists(`rules.avalon.roleFacts.${role}.note`) ? (
              <Fact
                label={t("rules.avalon.labels.note")}
                value={t(`rules.avalon.roleFacts.${role}.note`)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** "Field Agent ×2, Handler, ..." for one side of a role set. */
function roleList(
  roles: Role[],
  side: "good" | "evil",
  name: (role: Role) => string
): string {
  const counts = new Map<Role, number>();
  for (const role of roles) {
    if (sideOf(role) === side) counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return [...counts]
    .map(([role, count]) => (count > 1 ? `${name(role)} ×${count}` : name(role)))
    .join(", ");
}

function SetupPage() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const name = (role: Role) => t(`avalon.roles.${role}.name`);

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" color="textMuted">
        {t("rules.avalon.pages.setup.intro")}
      </AppText>
      {PLAYER_COUNTS.map((count) => {
        const roles = ROLE_SETS[count];
        const moles = roles.filter((role) => sideOf(role) === "evil").length;
        return (
          <View
            key={count}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHead}>
              <AppText variant="title" style={styles.grow}>
                {t("rules.avalon.labels.players", { count })}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {t("rules.avalon.labels.split", {
                  agents: count - moles,
                  moles,
                })}
              </AppText>
            </View>
            <Fact
              label={t("avalon.sides.good")}
              value={roleList(roles, "good", name)}
            />
            <Fact
              label={t("avalon.sides.evil")}
              value={roleList(roles, "evil", name)}
            />
            <View style={styles.fact}>
              <AppText variant="tiny" color="textSubtle" style={styles.factLabel}>
                {t("rules.avalon.labels.teams")}
              </AppText>
              <View style={styles.sizes}>
                {QUEST_SIZES[count].map((size, quest) => {
                  const double = failsNeeded(count, quest) > 1;
                  return (
                    <View
                      key={quest}
                      style={[
                        styles.size,
                        {
                          backgroundColor: colors.well,
                          borderColor: double ? colors.danger : "transparent",
                        },
                      ]}
                    >
                      <AppText
                        style={{ fontFamily: fontFamily.bold, fontSize: 14 }}
                      >
                        {size}
                        {double ? "*" : ""}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}
      <AppText variant="caption" color="textSubtle">
        {t("rules.avalon.labels.twoFails")}
      </AppText>
    </View>
  );
}

const text = (page: string) =>
  function TextPage() {
    return <RulesText i18nKey={`rules.avalon.pages.${page}`} />;
  };

export const AVALON_RULES: RulesPage[] = [
  { key: "overview", titleKey: "rules.avalon.pages.overview.title", Content: text("overview") },
  { key: "round", titleKey: "rules.avalon.pages.round.title", Content: text("round") },
  { key: "roles", titleKey: "rules.avalon.pages.roles.title", Content: RolesPage },
  { key: "setup", titleKey: "rules.avalon.pages.setup.title", Content: SetupPage },
  { key: "ending", titleKey: "rules.avalon.pages.ending.title", Content: text("ending") },
  { key: "more", titleKey: "rules.avalon.pages.more.title", Content: text("more") },
];

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { borderWidth: 1.5, borderRadius: 18, padding: 12, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  fact: { flexDirection: "row", gap: 10 },
  factLabel: {
    width: 68,
    fontFamily: fontFamily.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  sizes: { flex: 1, flexDirection: "row", gap: 6 },
  size: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

// The pieces every game's "How to play" is written with, so all games read
// the same way: a lead line, numbered steps, cards for teams, roles,
// actions, rooms and events, a player-count table and a tip. Plain views
// (no SVG trim per card: a rules page can hold dozens). Text is the
// game's own, already translated; the pieces only lay it out.

import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Emblem } from "@/components/icons";
import { AppText } from "@/components/ui";
import { fontFamily, useTheme } from "@/theme";

/** The page's first line: what this section is about, in a sentence. */
export function RuleLead({ children }: { children: ReactNode }) {
  return <AppText style={styles.lead}>{children}</AppText>;
}

/** A plain paragraph. */
export function RuleText({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <AppText style={[styles.text, { color: colors.textMuted }]}>{children}</AppText>;
}

/** Steps in order (a round, a turn): numbered, each a short line with an
 *  optional detail under it and an optional emblem. */
export function RuleSteps({ steps }: { steps: { title: string; detail?: string; emoji?: string }[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.steps}>
      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={[styles.number, { backgroundColor: colors.primary }]}>
            <AppText style={[styles.numberText, { color: colors.primaryContrast }]}>{i + 1}</AppText>
          </View>
          <View style={styles.grow}>
            <View style={styles.stepHead}>
              {step.emoji ? <Emblem emoji={step.emoji} size={18} /> : null}
              <AppText style={styles.stepTitle}>{step.title}</AppText>
            </View>
            {step.detail ? (
              <AppText style={[styles.small, { color: colors.textMuted }]}>{step.detail}</AppText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** One thing explained: a team, a role, an action, a room, an event. An
 *  emblem or a picture on the left, its name (in `tint`, e.g. its team's
 *  colour), a tag or two, then what it does. */
export function RuleCard({
  emoji,
  picture,
  name,
  tint,
  tags = [],
  children,
}: {
  emoji?: string;
  /** A drawing in place of the emblem (a room's picture). */
  picture?: ReactNode;
  name: string;
  tint?: string;
  /** Short labels beside the name ("Evil", "From 7 players", "1 coin"). */
  tags?: string[];
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const edge = tint ?? colors.border;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: edge }]}>
      <View style={styles.cardHead}>
        {picture ?? (emoji ? <Emblem emoji={emoji} size={30} /> : null)}
        <View style={styles.grow}>
          <AppText style={[styles.cardName, tint ? { color: tint } : null]} numberOfLines={2}>
            {name}
          </AppText>
          {tags.length ? (
            <View style={styles.tags}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.well }]}>
                  <AppText style={[styles.tagText, { color: colors.textMuted }]}>{tag}</AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {typeof children === "string" ? (
        <AppText style={[styles.small, { color: colors.text }]}>{children}</AppText>
      ) : (
        children
      )}
    </View>
  );
}

/** A table of what changes with the number of players: a first column of
 *  labels and one column per player count. */
export function CountsTable({
  counts,
  rows,
}: {
  /** The player counts, as column heads. */
  counts: number[];
  rows: { label: string; values: (string | number)[] }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.table, { borderColor: colors.border }]}>
      <View style={[styles.row, { backgroundColor: colors.well }]}>
        <AppText style={[styles.cellLabel, styles.headText]}>👥</AppText>
        {counts.map((n) => (
          <AppText key={n} style={[styles.cell, styles.headText]}>
            {n}
          </AppText>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={row.label} style={[styles.row, i % 2 ? { backgroundColor: colors.well } : null]}>
          <AppText style={[styles.cellLabel, { color: colors.textMuted }]} numberOfLines={2}>
            {row.label}
          </AppText>
          {row.values.map((value, k) => (
            <AppText key={k} style={styles.cell}>
              {value}
            </AppText>
          ))}
        </View>
      ))}
    </View>
  );
}

/** A tip or a rule people often miss. */
export function RuleNote({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.note, { borderColor: colors.primarySoftBorder, backgroundColor: colors.primarySoft }]}>
      <Emblem emoji="💡" size={16} />
      <AppText style={[styles.small, styles.grow, { color: colors.text }]}>{children}</AppText>
    </View>
  );
}

/** A heading inside a page (a team's roles, a group of actions). */
export function RuleHeading({ children, tint }: { children: ReactNode; tint?: string }) {
  return <AppText style={[styles.heading, tint ? { color: tint } : null]}>{children}</AppText>;
}

/** The space between a page's pieces. */
export function RulePage({ children }: { children: ReactNode }) {
  return <View style={styles.page}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { gap: 12 },
  grow: { flex: 1 },
  lead: { fontFamily: fontFamily.semiBold, fontSize: 15, lineHeight: 21 },
  text: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  heading: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18, marginTop: 4, letterSpacing: 0.4 },
  steps: { gap: 10 },
  step: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 1 },
  numberText: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 16 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepTitle: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 19, flexShrink: 1 },
  card: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardName: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 19 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
  tag: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14 },
  table: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 8 },
  cellLabel: { flex: 2.2, fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 15 },
  cell: { flex: 1, textAlign: "center", fontFamily: fontFamily.semiBold, fontSize: 12.5, lineHeight: 16 },
  headText: { fontFamily: fontFamily.bold },
  note: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "flex-start" },
});

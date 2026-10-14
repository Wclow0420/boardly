// The one layout every game uses for what has happened: the notebook,
// the public record and the "what happened" popup. A game turns its
// state into pages — one per day, night or round — each split into
// sections (the vote, the mission, what only you know...), each holding
// short entries. The Journal lays them out the same way everywhere: a
// card per page, newest first, a heading per section, and a coloured
// edge on each entry that says whether it's good news, bad news or a
// secret.
//
// Games pass their own text component (`Text`) so their emoji are drawn
// as their icons and their place names keep their colours.

import type { ComponentType } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, type AppTextProps } from "@/components/ui";
import { useTheme } from "@/theme";

/** good / bad: how it went for the reader's side; secret: only the
 *  reader knows it. */
export type JournalTone = "neutral" | "good" | "bad" | "secret";

export interface JournalEntry {
  /** The line itself; may start with an emoji the game draws as an icon. */
  text: string;
  /** Smaller lines under it: who voted what, which cards came up... */
  detail?: string[];
  tone?: JournalTone;
}

export interface JournalSection {
  key: string;
  /** e.g. "☀ Scavenging", "🔒 Only you know". */
  title?: string;
  /** A private section is set apart: only this player sees it. */
  private?: boolean;
  entries: JournalEntry[];
}

export interface JournalPage {
  key: string;
  /** e.g. "Day 2", "Night 3". */
  title: string;
  /** e.g. "Mission in the Cellar". */
  subtitle?: string;
  sections: JournalSection[];
}

export interface JournalProps {
  pages: JournalPage[];
  /** The game's text component (defaults to AppText). */
  Text?: ComponentType<AppTextProps>;
  /** Shown when there is nothing yet. */
  emptyText?: string;
  /** "newest" (default) puts the latest page first; "oldest" reads in order. */
  order?: "newest" | "oldest";
}

export function Journal({ pages, Text = AppText, emptyText, order = "newest" }: JournalProps) {
  const { colors, spacing, radius } = useTheme();
  const shown = pages
    .map((page) => ({ ...page, sections: page.sections.filter((s) => s.entries.length > 0) }))
    .filter((page) => page.sections.length > 0);
  const ordered = order === "newest" ? [...shown].reverse() : shown;

  if (ordered.length === 0) {
    return emptyText ? (
      <AppText variant="body" color="textMuted">
        {emptyText}
      </AppText>
    ) : null;
  }

  const edge = (tone: JournalTone | undefined) =>
    tone === "good"
      ? colors.successStrong
      : tone === "bad"
        ? colors.danger
        : tone === "secret"
          ? colors.primary
          : colors.border;

  return (
    <View style={{ gap: spacing.md }}>
      {ordered.map((page) => (
        <View
          key={page.key}
          style={[
            styles.page,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg },
          ]}
        >
          <View style={styles.pageHead}>
            <Text variant="title" style={styles.grow}>
              {page.title}
            </Text>
            {page.subtitle ? (
              <Text variant="caption" color="textMuted">
                {page.subtitle}
              </Text>
            ) : null}
          </View>
          {page.sections.map((section) => (
            <View
              key={section.key}
              style={[
                styles.section,
                section.private && {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primarySoftBorder,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                },
              ]}
            >
              {section.title ? (
                <Text variant="label" color={section.private ? "primary" : "textSubtle"}>
                  {section.title}
                </Text>
              ) : null}
              {section.entries.map((entry, index) => (
                <View key={index} style={[styles.entry, { borderLeftColor: edge(entry.tone) }]}>
                  <Text
                    variant="bodyMedium"
                    style={
                      entry.tone === "good"
                        ? { color: colors.successStrong }
                        : entry.tone === "bad"
                          ? { color: colors.danger }
                          : undefined
                    }
                  >
                    {entry.text}
                  </Text>
                  {entry.detail?.map((line, i) => (
                    <Text key={i} variant="caption" color="textMuted">
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  page: { borderWidth: 1, padding: 12, gap: 10 },
  pageHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  section: { gap: 6 },
  entry: { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
});

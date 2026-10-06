// Full-screen announcement for the moments everyone at the table needs
// to notice: a team vote coming in, a quest's cards being turned over,
// and the end of the game. Closes itself after a few seconds or on tap.

import { Image } from "expo-image";
import { useEffect } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { fontFamily, useTheme } from "@/theme";
import { errorHaptic, successHaptic } from "@/utils/haptics";
import { FAIL_CARD, SUCCESS_CARD } from "./art";
import type { Reveal } from "./logic";

const NATIVE = Platform.OS !== "web";
const CARD_STAGGER_MS = 450;

export interface AvalonRevealProps {
  reveal: Reveal;
  nameOf: (seat: number) => string;
  namesOf: (seats: number[]) => string;
  onDone: () => void;
}

export function AvalonReveal({
  reveal,
  nameOf,
  namesOf,
  onDone,
}: AvalonRevealProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const pop = useAnimatedValue(0);

  const cards =
    reveal.kind === "quest"
      ? [
          ...Array(reveal.result.team.length - reveal.result.fails).fill(true),
          ...Array(reveal.result.fails).fill(false),
        ]
      : [];
  // Quest cards turn over one by one before the verdict lands
  const verdictDelay = cards.length * CARD_STAGGER_MS + 250;
  const good =
    reveal.kind === "vote"
      ? reveal.record.approved
      : reveal.kind === "quest"
        ? reveal.result.success
        : reveal.winner === "good";

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: NATIVE,
    }).start();

    const buzz = setTimeout(
      () => (good ? successHaptic() : errorHaptic()),
      reveal.kind === "quest" ? verdictDelay : 0
    );
    const close = setTimeout(
      onDone,
      reveal.kind === "quest"
        ? verdictDelay + 2600
        : reveal.kind === "end"
          ? 4500
          : 2800
    );
    return () => {
      clearTimeout(buzz);
      clearTimeout(close);
    };
    // One-shot on mount: the parent remounts this per reveal (key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tone = good ? colors.successStrong : colors.danger;

  const approvers =
    reveal.kind === "vote"
      ? reveal.record.votes.flatMap((yes, seat) => (yes ? [seat] : []))
      : [];
  const rejecters =
    reveal.kind === "vote"
      ? reveal.record.votes.flatMap((yes, seat) => (yes ? [] : [seat]))
      : [];

  return (
    <Modal transparent animationType="fade" onRequestClose={onDone}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("avalon.reveal.dismiss")}
        onPress={onDone}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: tone,
              borderRadius: radius.xxl,
              padding: spacing.xxl,
              opacity: pop,
              transform: [
                {
                  scale: pop.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {reveal.kind === "vote" ? (
            <>
              <AppText style={styles.emoji}>
                {reveal.record.approved ? "✅" : "❌"}
              </AppText>
              <AppText variant="h1" align="center" style={{ color: tone }}>
                {t(
                  reveal.record.approved
                    ? "avalon.reveal.approved"
                    : "avalon.reveal.rejected"
                )}
              </AppText>
              <AppText style={[styles.score, { color: colors.text }]}>
                {approvers.length} – {rejecters.length}
              </AppText>
              <AppText variant="body" color="textMuted" align="center">
                {t("avalon.reveal.team", {
                  leader: nameOf(reveal.record.leader),
                  team: namesOf(reveal.record.team),
                })}
              </AppText>
              <View style={{ marginTop: spacing.md, gap: 4 }}>
                <AppText variant="caption" align="center">
                  {`👍 ${approvers.length > 0 ? namesOf(approvers) : "—"}`}
                </AppText>
                <AppText variant="caption" align="center">
                  {`👎 ${rejecters.length > 0 ? namesOf(rejecters) : "—"}`}
                </AppText>
              </View>
            </>
          ) : reveal.kind === "quest" ? (
            <>
              <AppText variant="label" color="textMuted" align="center">
                {t("avalon.track.quest", { quest: reveal.quest + 1 })}
              </AppText>
              <View style={[styles.cards, { marginTop: spacing.lg }]}>
                {cards.map((success, index) => (
                  <QuestCard
                    key={index}
                    success={success}
                    delay={index * CARD_STAGGER_MS}
                  />
                ))}
              </View>
              <Verdict delay={verdictDelay}>
                <AppText
                  variant="h1"
                  align="center"
                  style={{ color: tone, marginTop: spacing.lg }}
                >
                  {t(
                    reveal.result.success
                      ? "avalon.reveal.questSuccess"
                      : "avalon.reveal.questFail"
                  )}
                </AppText>
                <AppText variant="body" color="textMuted" align="center">
                  {t("avalon.reveal.failCards", { count: reveal.result.fails })}
                </AppText>
              </Verdict>
            </>
          ) : (
            <>
              <AppText style={styles.emoji}>
                {reveal.winner === "good" ? "🕵️" : "🐀"}
              </AppText>
              <AppText variant="h1" align="center" style={{ color: tone }}>
                {t(`avalon.result.${reveal.winner}`)}
              </AppText>
            </>
          )}
          <AppText
            variant="tiny"
            color="textSubtle"
            align="center"
            style={{ marginTop: spacing.lg }}
          >
            {t("avalon.reveal.dismiss")}
          </AppText>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** One quest card flipping face up. Cards are shown successes first —
 *  the order says nothing about who played what. */
function QuestCard({ success, delay }: { success: boolean; delay: number }) {
  const { colors, radius } = useTheme();
  const flip = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(flip, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: NATIVE,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.questCard,
        {
          borderRadius: radius.md,
          backgroundColor: success ? colors.success : colors.danger,
          opacity: flip,
          transform: [
            {
              scale: flip.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
            {
              rotate: flip.interpolate({
                inputRange: [0, 1],
                outputRange: ["-25deg", "0deg"],
              }),
            },
          ],
        },
      ]}
    >
      {(success ? SUCCESS_CARD : FAIL_CARD) ? (
        <Image
          source={success ? SUCCESS_CARD : FAIL_CARD}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <AppText style={[styles.questMark, { color: "#FFFFFF" }]}>
          {success ? "✓" : "✕"}
        </AppText>
      )}
    </Animated.View>
  );
}

/** Fades the verdict in once the last card has turned. */
function Verdict({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const shown = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(shown, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: NATIVE,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Animated.View style={{ opacity: shown }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 3,
    alignItems: "center",
  },
  emoji: { fontSize: 52, lineHeight: 64 },
  score: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 52,
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  questCard: {
    overflow: "hidden",
    width: 54,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  questMark: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34 },
});

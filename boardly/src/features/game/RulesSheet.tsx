// "How to play" for a game — opened from the (!) button in the lobby
// and on the game screen. A centred popup with one topic per page:
// swipe sideways, tap a tab, or use the arrows. Games supply their own
// pages (GameDefinition.rulePages); otherwise the pages are built from
// the plain text under rules.<gameKey> in the locale files.

import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useTranslation } from "react-i18next";

import { InfoIcon } from "@/components/icons";
import { AppText, Button, Chip, IconButton } from "@/components/ui";
import { getGame } from "@/games/registry";
import type { RulesPage } from "@/games/types";
import { useTheme } from "@/theme";
import { RulesText } from "./RulesText";

const CARD_MAX_WIDTH = 440;

interface TextSection {
  title: string;
  items: string[];
}

/** Whether rules have been written for this game. */
export function useHasRules(gameKey: string | undefined): boolean {
  const { i18n } = useTranslation();
  return gameKey !== undefined && i18n.exists(`rules.${gameKey}.intro`);
}

export interface RulesButtonProps {
  onPress: () => void;
  color: string;
}

/** The (!) button that opens the rules. */
export function RulesButton({ onPress, color }: RulesButtonProps) {
  const { t } = useTranslation();
  return (
    <IconButton accessibilityLabel={t("rules.title")} onPress={onPress}>
      <InfoIcon size={22} color={color} />
    </IconButton>
  );
}

export interface RulesSheetProps {
  gameKey: string;
  gameName: string;
  visible: boolean;
  onClose: () => void;
}

interface Page {
  key: string;
  title: string;
  content: React.ReactNode;
}

export function RulesSheet({
  gameKey,
  gameName,
  visible,
  onClose,
}: RulesSheetProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const pagerRef = useRef<ScrollView>(null);
  // Each page gets the pager's exact size. Without a fixed height a page
  // grows to fit its content and has nothing left to scroll.
  const [pager, setPager] = useState({ width: 0, height: 0 });
  const width = pager.width;
  const [index, setIndex] = useState(0);

  const custom: RulesPage[] | undefined = getGame(gameKey)?.rulePages;
  let pages: Page[];
  if (custom) {
    pages = custom.map(({ key, titleKey, Content }) => ({
      key,
      title: t(titleKey),
      content: <Content />,
    }));
  } else {
    const sections = t(`rules.${gameKey}.sections`, {
      returnObjects: true,
      defaultValue: [],
    }) as TextSection[];
    pages = [
      {
        key: "overview",
        title: t("rules.overview"),
        content: (
          <AppText variant="body" color="textMuted">
            {t(`rules.${gameKey}.intro`)}
          </AppText>
        ),
      },
      ...(Array.isArray(sections) ? sections : []).map((section, i) => ({
        key: `section-${i}`,
        title: section.title,
        content: <RulesText i18nKey={`rules.${gameKey}.sections.${i}`} />,
      })),
    ];
  }

  const last = pages.length - 1;

  // While the pager is animating to a tapped tab it passes over the
  // pages in between. Those scroll positions must not drive the tabs,
  // or the highlight flickers through them on its way.
  const jumpingTo = useRef<number | null>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endJump = () => {
    jumpingTo.current = null;
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    jumpTimer.current = null;
  };
  useEffect(() => endJump, []);

  const goTo = (page: number) => {
    const next = Math.max(0, Math.min(last, page));
    endJump();
    if (next !== index) {
      jumpingTo.current = next;
      // Safety net in case the animation is interrupted and never lands
      jumpTimer.current = setTimeout(endJump, 700);
    }
    setIndex(next);
    pagerRef.current?.scrollTo({ x: next * width, animated: true });
  };

  // If the popup is resized (it settles a moment after opening), put the
  // pager back on the page the tabs say is selected.
  useEffect(() => {
    if (pager.width > 0) {
      pagerRef.current?.scrollTo({ x: index * pager.width, animated: false });
    }
    // Only a size change should re-seat it; page changes scroll in goTo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pager.width, pager.height]);

  // Keeps the tabs and dots in step with a finger swipe
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const x = event.nativeEvent.contentOffset.x;
    if (jumpingTo.current !== null) {
      // Arrived at the tapped tab: hand control back to swiping
      if (Math.abs(x - jumpingTo.current * width) < 2) endJump();
      return;
    }
    const page = Math.round(x / width);
    if (page !== index && page >= 0 && page <= last) setIndex(page);
  };

  const close = () => {
    endJump();
    onClose();
    setIndex(0);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        {/* Tap-outside-to-close sits behind the card as its own layer, so
            the card's scroll views never share touches with a pressable */}
        <Pressable
          accessibilityLabel={t("rules.close")}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xxl,
            },
          ]}
        >
          <View style={[styles.header, { padding: spacing.xl, paddingBottom: 0 }]}>
            <View style={styles.grow}>
              <AppText variant="caption" color="textMuted">
                {t("rules.title")}
              </AppText>
              <AppText variant="h2" numberOfLines={1}>
                {gameName}
              </AppText>
            </View>
            <IconButton accessibilityLabel={t("rules.close")} onPress={close} filled>
              <AppText variant="title" color="textMuted">
                ✕
              </AppText>
            </IconButton>
          </View>

          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                gap: spacing.sm,
              }}
            >
              {pages.map((page, i) => (
                <Chip
                  key={page.key}
                  label={page.title}
                  selected={i === index}
                  onPress={() => goTo(i)}
                />
              ))}
            </ScrollView>
          </View>

          <View
            style={styles.grow}
            onLayout={(event) => {
              const { width: w, height: h } = event.nativeEvent.layout;
              if (w !== pager.width || h !== pager.height) {
                setPager({ width: w, height: h });
              }
            }}
          >
            {width > 0 ? (
              <ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                // A finger on the pager always wins over a tab animation
                onScrollBeginDrag={endJump}
                scrollEventThrottle={32}
              >
                {pages.map((page) => (
                  <ScrollView
                    key={page.key}
                    style={{ width, height: pager.height }}
                    nestedScrollEnabled
                    contentContainerStyle={{
                      paddingHorizontal: spacing.xl,
                      paddingBottom: spacing.lg,
                    }}
                  >
                    <AppText variant="title" style={{ marginBottom: spacing.md }}>
                      {page.title}
                    </AppText>
                    {page.content}
                  </ScrollView>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View
            style={[
              styles.footer,
              { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
            ]}
          >
            <Button
              label="‹"
              variant="secondary"
              size="sm"
              disabled={index === 0}
              onPress={() => goTo(index - 1)}
              style={styles.arrow}
            />
            <View style={styles.dots}>
              {pages.map((page, i) => (
                <View
                  key={page.key}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === index ? colors.primary : colors.border,
                      width: i === index ? 18 : 7,
                    },
                  ]}
                />
              ))}
            </View>
            {index === last ? (
              <Button
                label={t("rules.close")}
                size="sm"
                onPress={close}
                style={styles.done}
              />
            ) : (
              <Button
                label="›"
                size="sm"
                onPress={() => goTo(index + 1)}
                style={styles.arrow}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
    height: "84%",
    maxHeight: 680,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrow: { width: 52, paddingHorizontal: 0 },
  done: { paddingHorizontal: 18 },
  dots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: { height: 7, borderRadius: 4 },
});

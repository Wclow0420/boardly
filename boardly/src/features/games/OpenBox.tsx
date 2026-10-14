// A game taken off the shelf and opened like a folder: its cover falls
// open and the card inside, with our meeple, rises out. Below, what the
// game is, and the ways in: its rules, or a table of your own.

import { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { AppText, Button, StatusPill } from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic } from "@/utils/haptics";
import { GameFolder } from "./GameFolder";

const TAG_VARIANTS = {
  classic: "host",
  card: "info",
  strategy: "ready",
  party: "info",
  faction: "danger",
} as const;

export interface OpenBoxProps {
  game: GameCatalogEntry | null;
  onClose: () => void;
  onRules: (game: GameCatalogEntry) => void;
  onPlay: (game: GameCatalogEntry) => void;
  /** A table is being opened. */
  busy?: boolean;
}

export function OpenBox({
  game,
  onClose,
  onRules,
  onPlay,
  busy,
}: OpenBoxProps) {
  const { t, i18n } = useTranslation();
  const gameName = useGameName();
  const { colors, spacing, radius } = useTheme();
  const { width: screen } = useWindowDimensions();
  const still = useReducedMotion();
  const arrive = useSharedValue(0);
  const open = useSharedValue(0);

  const key = game?.id;
  useEffect(() => {
    if (!key) return;
    if (still) {
      arrive.set(1);
      open.set(1);
      return;
    }
    arrive.set(0);
    open.set(0);
    // it appears where it is — no slide, no bounce — and only the folder
    // springs open
    arrive.set(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
    );
    open.set(
      withDelay(
        260,
        withTiming(1, { duration: 520, easing: Easing.out(Easing.back(1.4)) }),
      ),
    );
    const thud = setTimeout(moveHaptic, 300);
    return () => clearTimeout(thud);
  }, [key, still, arrive, open]);

  const panel = Math.min(360, screen - 32);
  const folder = Math.min(230, panel * 0.68);

  const card = useAnimatedStyle(() => ({
    opacity: arrive.value,
    transform: [{ scale: interpolate(arrive.value, [0, 1], [0.9, 1]) }],
  }));

  if (!game) return null;
  const def = getGame(game.id);
  const tagline = def?.skin?.taglineKey ? t(def.skin.taglineKey) : null;
  const introKey = `rules.${game.id}.intro`;
  const intro = i18n.exists(introKey) ? t(introKey) : null;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(8,5,2,0.72)" },
        ]}
        onPress={onClose}
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.panel,
            {
              width: panel,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
            card,
          ]}
        >
          {/* the game, opened like a folder */}
          <View style={styles.stage}>
            <GameFolder
              gameKey={game.id}
              emoji={game.emoji}
              tileColor={game.tileColor}
              width={folder}
              open={open}
            />
          </View>

          <AppText align="center" style={styles.title}>
            {gameName(game.id, game.name)}
          </AppText>
          {tagline ? (
            <AppText
              variant="caption"
              color="textMuted"
              align="center"
              style={{ marginTop: 2 }}
            >
              {tagline}
            </AppText>
          ) : null}
          <View style={styles.facts}>
            <StatusPill
              label={t(`games.tags.${game.tagKey}`)}
              variant={TAG_VARIANTS[game.tagKey]}
            />
            <StatusPill
              label={t("games.playersRange", {
                min: game.minPlayers,
                max: game.maxPlayers,
              })}
              variant="waiting"
            />
          </View>
          {intro ? (
            <AppText
              variant="caption"
              color="textMuted"
              numberOfLines={4}
              style={{ marginTop: spacing.md }}
            >
              {intro}
            </AppText>
          ) : null}
          <View style={[styles.actions, { marginTop: spacing.lg }]}>
            <Button
              label={t("rules.title")}
              variant="secondary"
              size="md"
              style={styles.grow}
              onPress={() => onRules(game)}
            />
            <Button
              label={t("games.openTable")}
              size="md"
              style={styles.grow}
              loading={busy}
              onPress={() => onPlay(game)}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  stage: { alignItems: "center", paddingTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: { borderWidth: 1 },
  title: { fontFamily: fontFamily.bold, fontSize: 20, marginTop: 10 },
  facts: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  actions: { flexDirection: "row", gap: 10 },
});

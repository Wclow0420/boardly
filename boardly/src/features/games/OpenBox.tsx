// A box taken off the shelf and opened: the lid lifts and leans back,
// and in the felt tray are the pieces — one meeple for every seat the
// game has. Below, what the game is, and the ways in: its rules, or a
// table of your own.

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
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText, Button, StatusPill } from "@/components/ui";
import { MEEPLE_COLORS, Meeple } from "@/components/tabletop/Meeple";
import type { GameCatalogEntry } from "@/data/types";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic } from "@/utils/haptics";
import { GameBox } from "./GameBox";

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
    // in from the shelf, then the lid comes off
    arrive.set(withSpring(1, { damping: 14, stiffness: 160 }));
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
  const box = Math.min(170, panel * 0.5);

  const card = useAnimatedStyle(() => ({
    opacity: arrive.value,
    transform: [
      { translateY: interpolate(arrive.value, [0, 1], [40, 0]) },
      { scale: interpolate(arrive.value, [0, 1], [0.9, 1]) },
    ],
  }));
  // the lid lifts and leans back against the box
  const lid = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(open.value, [0, 1], [0, -box * 0.58]) },
      { rotate: `${interpolate(open.value, [0, 1], [0, -6])}deg` },
      { scale: interpolate(open.value, [0, 1], [1, 0.9]) },
    ],
  }));
  const tray = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.35, 1], [0, 1, 1]),
  }));

  if (!game) return null;
  const def = getGame(game.id);
  const tagline = def?.skin?.taglineKey ? t(def.skin.taglineKey) : null;
  const introKey = `rules.${game.id}.intro`;
  const intro = i18n.exists(introKey) ? t(introKey) : null;
  const seats = Array.from({ length: game.maxPlayers }, (_, i) => i);
  // the pieces fill the tray: up to five a row
  const perRow = Math.min(5, Math.ceil(game.maxPlayers / 2));
  const meeple = Math.floor((box - 20 - (perRow - 1) * 6) / perRow) * 0.86;

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
          {/* the box, opened */}
          <View
            style={{
              height: box * 1.62,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Animated.View style={[styles.layer, lid]}>
              <GameBox
                gameKey={game.id}
                emoji={game.emoji}
                tileColor={game.tileColor}
                width={box}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.tray,
                {
                  width: box,
                  height: box,
                  borderRadius: Math.max(6, box * 0.07),
                },
                tray,
              ]}
            >
              <View style={styles.pieces}>
                {seats.map((seat) => (
                  <Meeple
                    key={seat}
                    size={meeple}
                    color={MEEPLE_COLORS[seat % MEEPLE_COLORS.length]}
                  />
                ))}
              </View>
            </Animated.View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: { borderWidth: 1 },
  layer: { position: "absolute", bottom: 0 },
  tray: {
    backgroundColor: "#2B5A3A",
    borderWidth: 4,
    borderColor: "#1C3A26",
    justifyContent: "center",
    alignItems: "center",
  },
  pieces: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    padding: 10,
  },
  title: { fontFamily: fontFamily.bold, fontSize: 20, marginTop: 10 },
  facts: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  actions: { flexDirection: "row", gap: 10 },
});

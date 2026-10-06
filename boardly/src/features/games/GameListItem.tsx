import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ChevronRightIcon, FriendsIcon, StarIcon } from "@/components/icons";
import { AppText, Card, StatusPill } from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { fontFamily, useTheme } from "@/theme";
import { useGameName } from "@/games/names";
import { GameBadge } from "./GameBadge";

export interface GameListItemProps {
  game: GameCatalogEntry;
  onPress?: () => void;
}

const TAG_VARIANTS = {
  classic: "host",
  card: "info",
  strategy: "ready",
  party: "info",
} as const;

/** Catalogue row: emoji tile, name + tag, player range, rating. */
export function GameListItem({ game, onPress }: GameListItemProps) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const { colors, radius } = useTheme();

  return (
    <Card onPress={onPress} radius={radius.xl} style={styles.row}>
      <GameBadge
        gameKey={game.id}
        emoji={game.emoji}
        tileColor={game.tileColor}
        size={56}
        radius={radius.md}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText style={{ fontFamily: fontFamily.semiBold, fontSize: 14 }}>
            {gameName(game.id, game.name)}
          </AppText>
          <StatusPill
            label={t(`games.tags.${game.tagKey}`)}
            variant={TAG_VARIANTS[game.tagKey]}
          />
        </View>
        <View style={styles.metaRow}>
          <FriendsIcon size={16} color={colors.iconMuted} />
          <AppText variant="tiny" color="textSubtle">
            {t("games.playersRange", {
              min: game.minPlayers,
              max: game.maxPlayers,
            })}
          </AppText>
        </View>
      </View>
      <View style={styles.trailing}>
        {game.rating !== undefined ? (
          <View style={styles.rating}>
            <StarIcon size={12} color={colors.accent} />
            <AppText variant="tiny">{game.rating.toFixed(1)}</AppText>
          </View>
        ) : null}
        <ChevronRightIcon size={12} color={colors.iconMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 13 },
  tile: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 22, lineHeight: 28 },
  body: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  trailing: { alignItems: "flex-end", gap: 8 },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
});

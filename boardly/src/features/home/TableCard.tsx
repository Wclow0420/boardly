import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, AvatarStack, Card } from "@/components/ui";
import type { TableSummary } from "@/data/types";
import { fontFamily, useTheme } from "@/theme";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";

export interface TableCardProps {
  table: TableSummary;
  onPress?: () => void;
}

/** A "Your Tables" card: cover, game, players, avatars, status. */
export function TableCard({ table, onPress }: TableCardProps) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const { colors, radius } = useTheme();
  const skin = getGame(table.gameKey)?.skin;

  const statusColor =
    table.status === "inProgress"
      ? colors.primaryPressed
      : table.status === "waiting"
        ? colors.info
        : colors.textSubtle;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View
        style={[
          styles.cover,
          {
            borderRadius: radius.sm,
            backgroundColor: skin?.colors.background ?? table.coverColor,
          },
        ]}
      >
        {skin?.backdropImage ? (
          <Image
            source={skin.backdropImage}
            style={[StyleSheet.absoluteFill, styles.coverArt]}
            contentFit="cover"
          />
        ) : null}
        {skin?.logo ? (
          <Image source={skin.logo} style={styles.coverLogo} contentFit="contain" />
        ) : null}
      </View>
      <AppText
        style={{ fontFamily: fontFamily.semiBold, fontSize: 14, marginTop: 10 }}
      >
        {gameName(table.gameKey, table.gameName)}
      </AppText>
      <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
        {t("home.playersCount", {
          current: table.players.length,
          max: table.maxPlayers,
        })}
      </AppText>
      <View style={{ marginTop: 8 }}>
        <AvatarStack names={table.players} max={3} />
      </View>
      <AppText variant="tiny" style={{ marginTop: 8, color: statusColor }}>
        {t(`table.${table.status}`)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  cover: {
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverArt: { opacity: 0.45 },
  coverLogo: { width: 110, height: 58 },
});
